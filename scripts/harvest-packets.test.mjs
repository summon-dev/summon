#!/usr/bin/env node
// agent-notes: { ctx: "red-phase tests for the post-hoc PACKET compliance harvester", deps: [scripts/harvest-packets.mjs, schemas/packet.schema.json, docs/adrs/0015-communication-registers.md], state: active, last: "claude@2026-08-13", key: ["#128 additions come in PAIRS: each new behaviour has a discriminating arm that fails if the fix is implemented by suppression", "the unattributed-and-truncated case was found by running the tool on real data while all 63 tests were green — mutation testing proves a test CAN fail, not that the population was right", "written before the module exists — the import failing IS the red", "absent input is not clean input: harvest on a missing dir must never return an empty row set", "CHECKED_KEYWORDS is probed behaviourally, not read as a label — a listed keyword must actually fire", "the shipped schema's keywords must be implemented OR the validator must throw; silence is the laundered false green", "count mismatch is tested in BOTH directions so a one-sided comparison fails", "a malformed packet must still EXTRACT, or validatePacket can never report on a real transcript"] }
//
//   node --test scripts/harvest-packets.test.mjs
//
// Issue #121. ADR-0015's reversal triggers are unmeasurable today: the envelope
// is machine-consumed, the coordinator forwards only `narrative`, so no human
// ever sees a packet, and asking the coordinator whether the coordinator gated
// is the agent grading its own homework. This tool reads transcripts off disk
// and grades compliance after the fact. It is not a hook and blocks nothing.
//
// RED-PHASE PRE-FLIGHT (docs: three checks, run on every test below):
//   1. Calendar/time — SKIPPED, explicitly. Nothing here asserts on a date,
//      duration, or "now". The `last:` field above is a literal in a comment,
//      not an assertion, and no fixture carries a timestamp anything reads.
//   2. Direction/sign — APPLIES to exactly one rule, `finding_count` vs
//      `claims.length`. The requirement is EQUALITY, so both an over-count and
//      an under-count are violations. Stated in words first, then encoded, and
//      tested in both directions — a validator that only catches `count >
//      length` must fail here rather than pass on the half it happens to do.
//   3. Path/target — the tests import `./harvest-packets.mjs`, the same
//      specifier the CLI entry point will live in, resolved relative to this
//      file. There is no stub, no re-export, no sibling copy. The fixtures are
//      built in temp dirs rather than read from /tmp/claude-* on purpose: the
//      real transcripts are enormous and machine-specific, so a test touching
//      them is neither hermetic nor portable.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, utimesSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  finalAssistantText,
  extractPacket,
  validatePacket,
  CHECKED_KEYWORDS,
  harvest,
  STATUS,
  isDeadAgent,
} from "./harvest-packets.mjs";
import { BINDING_MARKER } from "./check-canon.mjs";

/** The real, committed schema. Stable enough to be a fixture. */
const REAL_SCHEMA = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "..", "schemas", "packet.schema.json"), "utf-8")
);

// --- fixtures ---------------------------------------------------------------

/** A packet that satisfies every rule in the schema and the count assertion. */
const CONFORMANT = Object.freeze({
  v: 1,
  agent: "tara",
  state: "complete",
  finding_count: 1,
  claims: [
    {
      summary: "harvest() returns [] on a directory it could not read",
      epistemic: "deterministic",
      severity: "Critical",
      evidence: "node --test scripts/harvest-packets.test.mjs",
      action: "Throw on a missing directory instead of reporting zero rows.",
    },
  ],
  unknowns: [],
  narrative:
    "One finding, Critical, in scripts/harvest-packets.mjs: harvest() reads a missing directory as clean. Throw instead.",
});

/** A conformant packet with fields replaced, and optionally keys removed. */
function packet(overrides = {}, omit = []) {
  const p = structuredClone(CONFORMANT);
  Object.assign(p, structuredClone(overrides));
  for (const key of omit) delete p[key];
  return p;
}

/** Replace claim 0's fields, keeping finding_count honest with claims.length. */
function withClaim(claimOverrides) {
  const p = structuredClone(CONFORMANT);
  Object.assign(p.claims[0], claimOverrides);
  return p;
}

const line = (obj) => `${JSON.stringify(obj)}\n`;

/** One transcript line as an assistant turn. `content` is passed through verbatim. */
const assistantLine = (content, agent = "tara") =>
  line({ type: "assistant", attributionAgent: agent, message: { role: "assistant", content } });

/** Prose, then the packet in a fenced block — the shape the contract asks for. */
const returnText = (p, prose = "Here is what I found.") =>
  `${prose}\n\n\`\`\`json\n${JSON.stringify(p, null, 2)}\n\`\`\`\n`;

/** A transcript whose final assistant turn is `text`. */
const transcript = (text, agent = "tara") =>
  line({ type: "user", message: { role: "user", content: "Go." } }) +
  assistantLine("Working on it.", agent) +
  line({ type: "user", message: { role: "user", content: [{ type: "tool_result", content: "ok" }] } }) +
  assistantLine(text, agent);

// --- finalAssistantText -----------------------------------------------------

test("returns the LAST assistant line, not the first", () => {
  // The first assistant line is nearly always "I'll start by reading the file."
  // A harvester that takes it grades the plan instead of the return.
  const jsonl = assistantLine("first turn") + assistantLine("second turn") + assistantLine("final turn");
  assert.equal(finalAssistantText(jsonl), "final turn");
});

test("reads content given as a plain string", () => {
  assert.equal(finalAssistantText(assistantLine("plain string content")), "plain string content");
});

test("reads content given as an array of blocks", () => {
  const text = finalAssistantText(
    assistantLine([{ type: "text", text: "first block" }, { type: "text", text: "second block" }])
  );
  assert.equal(typeof text, "string");
  assert.match(text, /first block/);
  assert.match(text, /second block/, "both text blocks belong to the return");
});

test("ignores non-text blocks inside the content array", () => {
  // Thinking and tool_use blocks carry no return text. A harvester that
  // stringifies the whole array finds JSON in a tool_use input and grades it.
  const text = finalAssistantText(
    assistantLine([
      { type: "thinking", thinking: "Let me consider the unhappy path." },
      { type: "tool_use", name: "Read", input: { file_path: "/etc/passwd" } },
      { type: "text", text: "the actual return" },
    ])
  );
  assert.equal(text, "the actual return");
});

test("skips lines that are not valid JSON rather than throwing", () => {
  // A transcript truncated mid-write is normal. A harvester that dies on one
  // bad line reports nothing about the other thirty-nine.
  const jsonl =
    assistantLine("good line") + '{"type":"assistant","message":{"content":"trunca\n' + assistantLine("last good line");
  let text;
  assert.doesNotThrow(() => {
    text = finalAssistantText(jsonl);
  }, "a malformed line must not take the whole transcript down");
  assert.equal(text, "last good line");
});

test("ignores lines whose type is not assistant", () => {
  const jsonl =
    assistantLine("the return") +
    line({ type: "user", message: { role: "user", content: "a later user turn" } }) +
    line({ type: "system", subtype: "compact_boundary", message: { content: "a later system line" } });
  assert.equal(finalAssistantText(jsonl), "the return");
});

test("returns null when there is no assistant text at all", () => {
  const jsonl = line({ type: "user", message: { role: "user", content: "Go." } }) + line({ type: "system" });
  assert.equal(finalAssistantText(jsonl), null);
});

test("returns null for an empty transcript", () => {
  assert.equal(finalAssistantText(""), null);
});

// --- extractPacket ----------------------------------------------------------

test("pulls a packet out of prose followed by a fenced JSON object", () => {
  const found = extractPacket(returnText(CONFORMANT));
  assert.deepEqual(found, CONFORMANT);
});

test("returns null for pure prose", () => {
  assert.equal(extractPacket("I reviewed the file and everything looks clean to me."), null);
});

test("returns null for a JSON object that is not a packet", () => {
  // The dangerous false positive: reporting an arbitrary object as a return
  // means every transcript that quotes a config blob scores as compliant.
  assert.equal(extractPacket('Here is the config I found:\n\n```json\n{"foo":1}\n```\n'), null);
});

test("handles braces and escaped quotes inside string values", () => {
  // Naive brace-counting ends the object at the first unmatched `}` inside a
  // string, and a narrative quoting code is the common case, not the exotic one.
  //
  // The braces below are deliberately UNBALANCED, with the `}` first. An
  // earlier version of this fixture quoted `if (!dir) { return []; }`, whose
  // braces balance — so a brace counter with no string awareness at all still
  // passed it. Verified by mutation: stripping the string/escape handling out
  // of a working implementation left this test green. It does not now.
  //
  // The escaped quotes are the second half: a scanner that toggles on `"` but
  // does not honour `\"` loses its place inside the string and starts counting
  // the braces it should be skipping.
  const p = packet({
    narrative:
      'Two defects in scripts/foo.mjs: a stray } on line 12 with no opening partner, and the guard `if (!dir) { return []; }` which reports "clean" where it means "unread". Fix both before this ships.',
  });
  assert.deepEqual(extractPacket(returnText(p)), p);
});

test("returns the packet when prose also contains a small non-packet object", () => {
  const text =
    'I ran the check. Its config was `{"strict": true}`, which matters.\n\n' +
    `\`\`\`json\n${JSON.stringify(CONFORMANT)}\n\`\`\`\n`;
  assert.deepEqual(extractPacket(text), CONFORMANT);
});

test("extracts a MALFORMED packet rather than rejecting it as a non-packet", () => {
  // NOTE (tara): this case was NOT in the brief, and it is load-bearing enough
  // that I would rather flag it than let it be discovered by a green run. If
  // recognition means "has every required key", then every non-conformant
  // packet extracts as null, every violation reads as "no packet found", and
  // validatePacket can never report a single violation against a real
  // transcript — the tool would grade only the packets that need no grading.
  // Recognition and validation must be different questions. If the intent is
  // otherwise, strike this test and say so, but then case 22's malformed row
  // is unreachable too.
  const bad = packet({ finding_count: 4 }, ["unknowns"]);
  const found = extractPacket(returnText(bad));
  assert.notEqual(found, null, "a packet that violates the schema is still a packet");
  assert.equal(found.agent, "tara");
});

// --- validatePacket: the conformant baseline --------------------------------

test("a conformant packet returns no violations", () => {
  assert.deepEqual(validatePacket(CONFORMANT, REAL_SCHEMA), []);
});

test("a conformant packet returns no violations with no schema passed", () => {
  // The documented fallback. If this ever disagrees with the schema-passed
  // arm on a conformant packet, one of the two value sets has drifted.
  assert.deepEqual(validatePacket(CONFORMANT), []);
});

// --- validatePacket: finding_count, in both directions ----------------------
//
// The requirement, in words before it is encoded: finding_count must EQUAL
// claims.length. Equality, not a bound. So a count larger than the array and a
// count smaller than the array are both violations, and a validator that
// implements only `count > length` (or only `<`) must fail one of these two.
// Derived from ADR-0015 and the schema's own note, not from any implementation.

test("finding_count larger than claims.length is reported", () => {
  const violations = validatePacket(packet({ finding_count: 3 }), REAL_SCHEMA);
  assert.ok(violations.length > 0);
  assert.match(violations.join("\n"), /finding_count/);
});

test("finding_count smaller than claims.length is reported", () => {
  const p = structuredClone(CONFORMANT);
  p.claims.push(structuredClone(CONFORMANT.claims[0]));
  p.finding_count = 1; // two claims, one declared
  const violations = validatePacket(p, REAL_SCHEMA);
  assert.ok(violations.length > 0, "an under-count smuggles a finding past the counter");
  assert.match(violations.join("\n"), /finding_count/);
});

test("finding_count zero against a non-empty claims array is reported", () => {
  const violations = validatePacket(packet({ finding_count: 0 }), REAL_SCHEMA);
  assert.ok(violations.length > 0, "0 findings over 1 claim is the false-green shape");
});

test("the count rule holds with no schema passed", () => {
  // JSON Schema cannot relate two sibling values, so this rule lives entirely
  // in the validator — it must not be conditional on a schema being supplied.
  assert.ok(validatePacket(packet({ finding_count: 3 })).length > 0);
});

// --- validatePacket: the deterministic/evidence pairing ---------------------

test("a deterministic claim with empty evidence is reported", () => {
  const violations = validatePacket(withClaim({ epistemic: "deterministic", evidence: "" }), REAL_SCHEMA);
  assert.ok(violations.length > 0, "the whole reason the grade exists");
  assert.match(violations.join("\n"), /evidence/i);
});

test("a deterministic claim with whitespace-only evidence is reported", () => {
  const violations = validatePacket(withClaim({ epistemic: "deterministic", evidence: "   " }), REAL_SCHEMA);
  assert.ok(violations.length > 0, "a space is not a command that was run");
});

test("an inferential claim with empty evidence is NOT reported", () => {
  // The discriminating arm. Without it, a validator that flags empty evidence
  // unconditionally would pass every test above while contradicting the schema,
  // where `evidence` is required as a key and may be empty for non-deterministic
  // grades. A check that fires on correct returns is one people route around.
  assert.deepEqual(validatePacket(withClaim({ epistemic: "inferential", evidence: "" }), REAL_SCHEMA), []);
});

test("the evidence pairing holds with no schema passed", () => {
  assert.ok(validatePacket(withClaim({ epistemic: "deterministic", evidence: "" })).length > 0);
});

// --- validatePacket: absent vs empty ----------------------------------------

test("a missing unknowns key is reported", () => {
  const violations = validatePacket(packet({}, ["unknowns"]), REAL_SCHEMA);
  assert.ok(violations.length > 0);
  assert.match(violations.join("\n"), /unknowns/);
});

test("an empty unknowns array is NOT reported", () => {
  // The pair that must not collapse: an empty array asserts "I looked and found
  // nothing I could not determine"; an absent key asserts nothing at all.
  assert.deepEqual(validatePacket(packet({ unknowns: [] }), REAL_SCHEMA), []);
});

test("the absent-vs-empty distinction holds with no schema passed", () => {
  assert.ok(validatePacket(packet({}, ["unknowns"])).length > 0);
  assert.deepEqual(validatePacket(packet({ unknowns: [] })), []);
});

// --- validatePacket: the closed value sets ----------------------------------

test("an invalid epistemic value is reported", () => {
  const violations = validatePacket(withClaim({ epistemic: "probably-fine" }), REAL_SCHEMA);
  assert.ok(violations.length > 0);
  assert.match(violations.join("\n"), /epistemic/);
});

test("an invalid severity value is reported", () => {
  const violations = validatePacket(withClaim({ severity: "Blocker" }), REAL_SCHEMA);
  assert.ok(violations.length > 0);
  assert.match(violations.join("\n"), /severity/);
});

test("a near-miss severity is reported — the set is closed, not indicative", () => {
  // "Suggestion" singular is the plausible drift, and the one a substring or
  // case-insensitive comparison would wave through.
  assert.ok(validatePacket(withClaim({ severity: "Suggestion" }), REAL_SCHEMA).length > 0);
  assert.ok(validatePacket(withClaim({ severity: "critical" }), REAL_SCHEMA).length > 0);
});

test("all three epistemic grades and all three severities are accepted", () => {
  // Anti-vacuity for the two tests above: a validator that rejected everything
  // would pass them. This is what proves the sets are the documented ones.
  for (const epistemic of ["deterministic", "inferential", "human-judgement"]) {
    assert.deepEqual(
      validatePacket(withClaim({ epistemic, evidence: "node --test" }), REAL_SCHEMA),
      [],
      `${epistemic} is a valid grade`
    );
  }
  for (const severity of ["Critical", "Important", "Suggestions"]) {
    assert.deepEqual(validatePacket(withClaim({ severity }), REAL_SCHEMA), [], `${severity} is a valid severity`);
  }
});

test("the closed value sets hold with no schema passed", () => {
  assert.ok(validatePacket(withClaim({ epistemic: "probably-fine" })).length > 0);
  assert.ok(validatePacket(withClaim({ severity: "Blocker" })).length > 0);
  assert.deepEqual(validatePacket(withClaim({ epistemic: "human-judgement", evidence: "" })), []);
});

test("an invalid state value is reported", () => {
  assert.ok(validatePacket(packet({ state: "done" }), REAL_SCHEMA).length > 0);
  assert.ok(validatePacket(packet({ state: "done" })).length > 0);
});

// --- validatePacket: narrative and version ----------------------------------

test("a missing narrative is reported", () => {
  const violations = validatePacket(packet({}, ["narrative"]), REAL_SCHEMA);
  assert.ok(violations.length > 0);
  assert.match(violations.join("\n"), /narrative/);
});

test("an empty narrative is reported", () => {
  // Slice 1's whole point: the envelope is machine-consumed and the narrative
  // is the only part a human ever reads. An empty one is a silent persona.
  assert.ok(validatePacket(packet({ narrative: "" }), REAL_SCHEMA).length > 0);
  assert.ok(validatePacket(packet({ narrative: "" })).length > 0);
});

test("v not equal to 1 is reported", () => {
  for (const v of [2, 0, "1", null]) {
    const violations = validatePacket(packet({ v }), REAL_SCHEMA);
    assert.ok(violations.length > 0, `v: ${JSON.stringify(v)} is not the v1 contract`);
  }
});

test("a missing v is reported", () => {
  assert.ok(validatePacket(packet({}, ["v"]), REAL_SCHEMA).length > 0);
  assert.ok(validatePacket(packet({}, ["v"])).length > 0);
});

// --- validatePacket: every violation, not just the first --------------------

test("multiple independent violations are ALL reported", () => {
  // A validator that returns on the first violation turns a four-defect packet
  // into a one-line report, and the reader fixes one thing and re-reads green.
  const p = packet({ v: 2, finding_count: 7, narrative: "" }, ["unknowns"]);
  p.claims[0].severity = "Blocker";
  const violations = validatePacket(p, REAL_SCHEMA);
  assert.ok(Array.isArray(violations));
  assert.ok(
    violations.length >= 5,
    `expected at least five violations (v, finding_count, narrative, unknowns, severity), got ${violations.length}: ${violations.join(" | ")}`
  );
  const joined = violations.join("\n");
  for (const token of ["v", "finding_count", "narrative", "unknowns", "severity"]) {
    assert.match(joined, new RegExp(token), `${token} must appear in the report`);
  }
});

test("violations are strings a human can read", () => {
  const violations = validatePacket(packet({ finding_count: 9 }), REAL_SCHEMA);
  assert.ok(violations.length > 0);
  for (const v of violations) {
    assert.equal(typeof v, "string");
    assert.ok(v.trim().length > 0, "an empty violation string reports nothing");
  }
});

// --- the honesty rule: CHECKED_KEYWORDS must not overclaim -------------------
//
// The script cannot implement draft-07, and it does not need to — but a
// validator that silently no-ops on a keyword produces a pass certifying
// nothing, which is the laundered false green this whole contract exists to
// stop. The schema says so itself, in the `then` block's note to Slice 3.
//
// So CHECKED_KEYWORDS is not documentation. It is a claim, and these tests
// probe it behaviourally rather than reading it as a label.

/**
 * Mutations that violate exactly one schema keyword, or as close to one as the
 * schema permits. `properties` and `minimum` are deliberately absent: neither
 * is violable in isolation here (a negative finding_count also breaks the
 * count-equality rule, so its probe would pass without `minimum` implemented).
 */
const KEYWORD_PROBES = {
  type: () => packet({ unknowns: "not an array" }),
  additionalProperties: () => packet({ confidence: 0.9 }),
  required: () => packet({}, ["unknowns"]),
  const: () => packet({ v: 2 }),
  pattern: () => packet({ agent: "Tester Tara" }),
  enum: () => packet({ state: "finished" }),
  items: () => packet({ unknowns: [42] }),
  minLength: () => packet({ narrative: "" }),
  if: () => withClaim({ epistemic: "deterministic", evidence: "" }),
  then: () => withClaim({ epistemic: "deterministic", evidence: "" }),
};

test("CHECKED_KEYWORDS exists and is a non-empty list of strings", () => {
  assert.ok(Array.isArray(CHECKED_KEYWORDS), "CHECKED_KEYWORDS must be an array");
  assert.ok(CHECKED_KEYWORDS.length > 0, "a validator that claims to check nothing checks nothing");
  for (const k of CHECKED_KEYWORDS) assert.equal(typeof k, "string");
  assert.equal(new Set(CHECKED_KEYWORDS).size, CHECKED_KEYWORDS.length, "no duplicates");
});

test("every keyword CHECKED_KEYWORDS claims actually fires", () => {
  // CAVEAT, stated rather than hidden: this proves "listed ⇒ something is
  // reported for a packet violating that keyword", not "listed ⇒ that keyword's
  // own logic exists". A hardcoded required-keys check would satisfy the
  // `required` probe without a generic implementation, and that is fine — the
  // rule being enforced is that the list does not name a no-op.
  const probed = CHECKED_KEYWORDS.filter((k) => k in KEYWORD_PROBES);
  assert.ok(
    probed.length >= 5,
    `only ${probed.length} of the listed keywords are probeable here (${CHECKED_KEYWORDS.join(", ")}); ` +
      "a list made entirely of unprobeable keywords would make this test vacuous"
  );
  for (const keyword of probed) {
    const violations = validatePacket(KEYWORD_PROBES[keyword](), REAL_SCHEMA);
    assert.ok(
      Array.isArray(violations) && violations.length > 0,
      `CHECKED_KEYWORDS claims "${keyword}" but a packet violating it passed clean`
    );
  }
});

test("`pattern` is either implemented or not claimed", () => {
  // The named case from the brief. `pattern` is the keyword a small hand-rolled
  // validator most plausibly skips — it is the only one in this schema needing a
  // regex engine — and the shipped schema uses it on `agent`. Either the list
  // owns it and it fires, or the list must not name it.
  const bad = packet({ agent: "Tester Tara" }); // spaces and capitals: not the file stem
  if (CHECKED_KEYWORDS.includes("pattern")) {
    const violations = validatePacket(bad, REAL_SCHEMA);
    assert.ok(violations.length > 0, "`pattern` is claimed, so a malformed agent stem must be reported");
    assert.match(violations.join("\n"), /agent/);
  } else {
    assert.ok(true, "`pattern` is not claimed, so the validator owes nothing here — see the next test");
  }
});

test("the validator implements every assertion keyword the shipped schema uses, or throws", () => {
  // NOTE (tara): derived from the schema's own instruction to Slice 3 — "the
  // validator must throw on any keyword it does not implement" — rather than
  // from the brief. It is written as a DISJUNCTION so it does not over-pin
  // Sato's design: implement the keyword, or refuse the schema. What it forbids
  // is the third option, quietly ignoring it and returning a clean result.
  const ASSERTION_KEYWORDS = new Set([
    "type", "enum", "const", "required", "properties", "additionalProperties",
    "items", "minLength", "maxLength", "pattern", "minimum", "maximum",
    "minItems", "maxItems", "uniqueItems", "if", "then", "else",
    "allOf", "anyOf", "oneOf", "not", "dependencies", "patternProperties",
  ]);
  const used = new Set();
  (function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if (ASSERTION_KEYWORDS.has(k)) used.add(k);
      walk(v);
    }
  })(REAL_SCHEMA);
  assert.ok(used.size > 5, `anti-vacuity: the walk found only ${used.size} keywords in the shipped schema`);

  const unimplemented = [...used].filter((k) => !CHECKED_KEYWORDS.includes(k));
  if (unimplemented.length === 0) {
    assert.deepEqual(validatePacket(CONFORMANT, REAL_SCHEMA), []);
  } else {
    assert.throws(
      () => validatePacket(CONFORMANT, REAL_SCHEMA),
      `the schema uses ${unimplemented.join(", ")}, which CHECKED_KEYWORDS does not claim — ` +
        "a validator that ignores them returns a pass certifying nothing"
    );
  }
});

test("an unimplemented keyword in a supplied schema is refused, not ignored", () => {
  // A caller can hand validatePacket any schema. If it meets a keyword it does
  // not implement, the honest outcomes are "throw" or "report it"; the one
  // outcome that must not happen is returning [] for a packet the schema
  // rejects. `allOf` is real draft-07 and is the kind of thing a forty-line
  // validator skips.
  const schema = {
    type: "object",
    allOf: [{ properties: { v: { const: 999 } } }],
  };
  let threw = false;
  let violations;
  try {
    violations = validatePacket(CONFORMANT, schema);
  } catch {
    threw = true;
  }
  if (!threw) {
    assert.ok(
      Array.isArray(violations) && violations.length > 0,
      "a schema this packet fails must not come back clean just because `allOf` went unread"
    );
  }
});

// --- harvest: absent input is not clean input -------------------------------

test("harvest on a non-existent directory does not report zero violations", () => {
  // THE most dangerous bug this tool could have, and the same absent-vs-
  // malformed distinction ADR-0015 Sub-decision 3 demands of the validator. A
  // green report over a directory it could not read is worse than no tool: it
  // is a measurement that certifies compliance it never observed, and it would
  // be quoted at the ADR's reversal checkpoint.
  const missing = join(tmpdir(), "summon-harvest-does-not-exist-4b71");
  let threw = false;
  let result;
  try {
    result = harvest(missing, REAL_SCHEMA);
  } catch {
    threw = true;
  }
  if (threw) return; // throwing is the preferred outcome and needs nothing more
  assert.notDeepEqual(result, [], "an empty row set reads as `no violations found`");
  assert.ok(
    result && typeof result === "object" && result.error,
    "if harvest returns instead of throwing, the return must carry an explicit error"
  );
});

test("harvest on an empty but existing directory is distinguishable from a missing one", () => {
  // The discriminating arm. Without it, a harvest that threw unconditionally
  // would pass the test above. An existing-but-empty dir HAS been read, and
  // zero rows is a true statement about it.
  const empty = mkdtempSync(join(tmpdir(), "summon-harvest-empty-"));
  let rows;
  assert.doesNotThrow(() => {
    rows = harvest(empty, REAL_SCHEMA);
  }, "an empty directory was successfully read; that is not an error");
  assert.deepEqual(rows, []);
});

// --- harvest: one row per transcript ----------------------------------------

/** Three transcripts: one conformant, one malformed, one with no packet at all. */
function fixtureTranscripts() {
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-"));
  writeFileSync(join(dir, "aaa-valid.jsonl"), transcript(returnText(CONFORMANT), "tara"));
  writeFileSync(
    join(dir, "bbb-malformed.jsonl"),
    transcript(returnText(packet({ agent: "vik", finding_count: 4 }, ["unknowns"])), "vik")
  );
  writeFileSync(
    join(dir, "ccc-prose.jsonl"),
    transcript("I read the three files and everything looks fine to me.", "pierrot")
  );
  return dir;
}

test("harvest returns one row per transcript", () => {
  const rows = harvest(fixtureTranscripts(), REAL_SCHEMA);
  assert.ok(Array.isArray(rows), "harvest returns rows");
  assert.equal(rows.length, 3, "one row per transcript — a skipped transcript is an unmeasured agent");
});

test("each row carries the agent identity taken from the transcript", () => {
  // OPEN QUESTION (tara), deliberately NOT pinned: every fixture here has a
  // packet whose `agent` agrees with the line's `attributionAgent`, so this
  // test does not decide which wins when they disagree. That disagreement is
  // itself a compliance finding — a packet signed by a persona other than the
  // one that ran — and it needs a decision before it needs a test. The
  // prose-only fixture DOES pin one half of it: an identity must be recoverable
  // from the transcript when there is no packet to read one from.
  const rows = harvest(fixtureTranscripts(), REAL_SCHEMA);
  assert.deepEqual(
    rows.map((r) => r.agent).sort(),
    ["pierrot", "tara", "vik"],
    "attributionAgent is what names the persona; a row with no identity cannot be actioned"
  );
});

test("each row carries a status, and the three outcomes are distinguishable", () => {
  // Deliberately not pinning the status vocabulary — that is Sato's to name.
  // What is pinned is that conformant, malformed, and no-packet-at-all do not
  // collapse into one value, because collapsing them is how a prose-only return
  // gets counted as a passing packet.
  const rows = harvest(fixtureTranscripts(), REAL_SCHEMA);
  for (const row of rows) {
    assert.equal(typeof row.status, "string", `row for ${row.agent} has no status`);
    assert.ok(row.status.trim().length > 0);
  }
  const statuses = new Set(rows.map((r) => r.status));
  assert.equal(
    statuses.size,
    3,
    `conformant, malformed and no-packet must be three outcomes, got: ${[...statuses].join(", ")}`
  );
});

test("the conformant row is clean and the malformed row carries its violations", () => {
  const rows = harvest(fixtureTranscripts(), REAL_SCHEMA);
  const byAgent = Object.fromEntries(rows.map((r) => [r.agent, r]));
  assert.deepEqual(byAgent.tara.violations, [], "a conformant packet must not be reported as violating");
  assert.ok(
    Array.isArray(byAgent.vik.violations) && byAgent.vik.violations.length > 0,
    "the malformed packet's violations must reach the row, not just the status"
  );
  assert.match(byAgent.vik.violations.join("\n"), /finding_count|unknowns/);
});

test("a transcript with a truncated line still produces a row", () => {
  // Real transcripts truncate. A harvester that drops the file reports nothing
  // about that agent — which reads, in a summary table, as an agent that had
  // no findings rather than one that was never measured.
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-torn-"));
  const p = packet({ agent: "grace" });
  writeFileSync(
    join(dir, "torn.jsonl"),
    assistantLine("first turn", "grace") + '{"type":"assistant","message":{"conte\n' + assistantLine(returnText(p), "grace")
  );
  const rows = harvest(dir, REAL_SCHEMA);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].agent, "grace");
});

test("harvest works without a schema, using the documented value sets", () => {
  const rows = harvest(fixtureTranscripts());
  assert.equal(rows.length, 3);
  const byAgent = Object.fromEntries(rows.map((r) => [r.agent, r]));
  assert.deepEqual(byAgent.tara.violations, []);
  assert.ok(byAgent.vik.violations.length > 0);
});

// --- entry-point guard ------------------------------------------------------

test("importing this module does not run the CLI", () => {
  // Same six characters whose absence was a Critical defect in the CSS checker.
  // Here the failure is louder: an unguarded module scans a transcript
  // directory and prints a report the moment a test file imports it.
  // Reaching this line at all is the proof — an unguarded module would have
  // run during the import at the top of this file.
  assert.equal(typeof harvest, "function");
  assert.equal(typeof validatePacket, "function");
});

// --- unattributed transcripts owe no packet (#121) ---------------------------
//
// Written by the coordinator, not Tara, after Sato flagged it in review: at a
// project root the first real run reported 41 unattributed transcripts and
// counted 38 of them as violations. Those are main-session logs, not specialist
// returns — they were never addressed by the contract they were being billed
// against. A measuring instrument that inflates its own numbers is worse than
// no instrument, and it made --strict unusable where it is most wanted.

test("a transcript with no persona attribution and no packet is not a violation", () => {
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-unattr-"));
  writeFileSync(
    join(dir, "agent-main.jsonl"),
    JSON.stringify({ type: "assistant", message: { content: "Plain coordinator prose, no packet here." } }) + "\n"
  );
  const [row] = harvest(dir);
  assert.equal(row.violations.length, 0, "an unattributed transcript owes no packet");
});

test("an attributed transcript with no packet IS a violation", () => {
  // The discriminating arm. Without it the fix above would pass an
  // implementation that simply stopped reporting missing packets at all.
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-attr-"));
  writeFileSync(
    join(dir, "agent-vik.jsonl"),
    JSON.stringify({
      type: "assistant",
      attributionAgent: "vik",
      message: { content: "Findings in prose, and no envelope anywhere." },
    }) + "\n"
  );
  const [row] = harvest(dir);
  assert.equal(row.agent, "vik");
  assert.ok(row.violations.length > 0, "a specialist that returned no packet has failed the contract");
});

// --- an agent that never returned did not refuse the contract (#128) ---------
//
// Found 2026-08-13 harvesting the validation project. `finalAssistantTurn`
// skipped tool-use-only turns and kept walking backwards, so a subagent killed
// mid-tool-loop was graded on whatever it last narrated. For one `sato` run
// that was a turn 92 records before the end of the transcript reading "Now the
// C1 fix in `bodies.py`." — reported as `no-packet`, "the return carried no
// PACKET envelope". It did not decline the contract; it never got a turn in
// which it could comply.
//
// The direction of the error is the bad one: it takes the failure CLAUDE.md
// § Treat Agent Output as Untrusted calls the dangerous one — an agent that
// died silently — and files it under the milder label of a formatting slip.

/** An assistant turn that is a tool call and nothing else: the shape of a truncated tail. */
const toolUseLine = (agent = "sato", cwd = null) =>
  line({
    type: "assistant",
    attributionAgent: agent,
    ...(cwd ? { cwd } : {}),
    message: {
      role: "assistant",
      // No stop_reason ON PURPOSE. Nothing reads it, and it is absent on 4 of
      // 36 real tool-only finals — a fixture that carries it invites the reader
      // to think it drives the classification. The CLI suite keeps one that has
      // it, so both shapes are covered.
      content: [{ type: "tool_use", name: "Bash", input: { command: "uv run pytest" } }],
    },
  });

/** A transcript that ends mid-tool-loop: prose, a tool call, its result, nothing more. */
const truncatedTranscript = (text, agent = "sato", cwd = null) =>
  line({ type: "user", message: { role: "user", content: "Go." } }) +
  (cwd ? line({ type: "assistant", attributionAgent: agent, cwd, message: { role: "assistant", content: text } })
       : assistantLine(text, agent)) +
  toolUseLine(agent, cwd) +
  line({ type: "user", message: { role: "user", content: [{ type: "tool_result", content: "46 passed" }] } });

test("a transcript ending in a tool call is no-return, not no-packet", () => {
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-trunc-"));
  writeFileSync(join(dir, "agent-sato.jsonl"), truncatedTranscript("Now the C1 fix in `bodies.py`."));
  const [row] = harvest(dir, REAL_SCHEMA, { now: Date.now() + 3_600_000 });
  assert.equal(row.agent, "sato", "the row must still name the agent that died");
  assert.equal(
    row.status,
    STATUS.noReturn,
    "an agent killed mid-tool-loop produced no return; grading its last narration as one is grading the wrong turn"
  );
});

test("a truncated agent carries no CONTRACT violation", () => {
  // No contract was breached — there was no return to breach it with. The
  // problem is real and belongs in its own category, not billed as a packet
  // the agent refused to write.
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-trunc2-"));
  writeFileSync(join(dir, "agent-grace.jsonl"), truncatedTranscript("Now verifying the statuses took.", "grace"));
  const [row] = harvest(dir, REAL_SCHEMA, { now: Date.now() + 3_600_000 });
  assert.deepEqual(row.violations, [], "a dead agent did not fail the contract; it never reached it");
});

test("the final turn is what gets graded — an earlier packet is not the return", () => {
  // The discriminating arm for the walk-backwards bug. If the fix only
  // relabelled no-text transcripts, this still grades the stale packet: here a
  // MALFORMED one sits earlier in the transcript, and reporting it as
  // `malformed` would mean the harvester is still reading a turn the agent had
  // already moved on from.
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-stale-"));
  const stale = returnText(packet({ agent: "sato", finding_count: 9 }, ["unknowns"]));
  writeFileSync(join(dir, "agent-sato.jsonl"), truncatedTranscript(stale));
  const [row] = harvest(dir, REAL_SCHEMA, { now: Date.now() + 3_600_000 });
  assert.equal(row.status, STATUS.noReturn, `a packet from an abandoned turn is not this run's return (got ${row.status})`);
  assert.deepEqual(row.violations, [], "and its staleness must not be reported as this run's non-compliance");
});

test("a transcript that ENDS with prose and no packet is still a violation", () => {
  // The arm that stops the fix being implemented as "stop reporting no-packet".
  // Here the agent finished and simply did not write an envelope. That is a
  // real contract violation and must survive the change above.
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-prose-end-"));
  writeFileSync(join(dir, "agent-vik.jsonl"), transcript("Findings in prose, and no envelope anywhere.", "vik"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.status, STATUS.noPacket);
  assert.ok(row.violations.length > 0, "an agent that returned without a packet HAS failed the contract");
});

// --- only agents the project actually binds owe a packet (#128) --------------
//
// `general-purpose` is a built-in Claude Code agent type with no
// `.claude/agents/` file, so it never received the return-contract binding.
// The harvester billed its nine returns anyway, eight as violations — a
// five-fold overstatement of a number ADR-0015's reversal checkpoint is read
// off. `cwd` is on every transcript record and carries the true project path,
// so the roster comes from the project being measured.

/** A transcript ending in prose with no packet, run inside `cwd`. */
const proseTranscriptIn = (cwd, agent) =>
  line({ type: "user", cwd, message: { role: "user", content: "Go." } }) +
  line({ type: "assistant", attributionAgent: agent, cwd, message: { role: "assistant", content: "Prose, no envelope." } });

test("an agent the project does not bind is out-of-scope, not violating", () => {
  const proj = projectBinding(["sato", "vik"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-unbound-"));
  writeFileSync(join(dir, "agent-gp.jsonl"), proseTranscriptIn(proj, "general-purpose"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.status, STATUS.outOfScope, "a return the contract never addressed cannot have failed it");
  assert.deepEqual(row.violations, []);
});

test("an agent the project DOES bind is graded", () => {
  // The discriminating arm. Without it, "grade nobody" passes the test above.
  const proj = projectBinding(["sato", "vik"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-bound-"));
  writeFileSync(join(dir, "agent-vik.jsonl"), proseTranscriptIn(proj, "vik"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.status, STATUS.noPacket);
  assert.ok(row.violations.length > 0, "a bound persona that returned no packet has failed the contract");
});

test("an unresolvable roster grades as before rather than waving everything through", () => {
  // The false negative this issue has already produced twice in other guises.
  // If the project directory is gone, or carries no `.claude/agents/` at all,
  // every agent looks unbound and every violation disappears — a clean report
  // over a wholly non-compliant fleet. Unknown roster is not an empty roster.
  const gone = join(tmpdir(), "summon-project-deleted-9f2c");
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-noroster-"));
  writeFileSync(join(dir, "agent-vik.jsonl"), proseTranscriptIn(gone, "vik"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.notEqual(row.status, STATUS.outOfScope, "a roster that could not be read is not a roster that excludes this agent");
  assert.ok(row.violations.length > 0, "an unreadable roster must not silence violations");
});

test("out-of-scope rows are returned, not dropped", () => {
  // Silently dropping the row is how an unmeasured agent reads as a compliant
  // one — the same rule the empty-directory and unattributed paths already
  // carry, and the issue says so explicitly.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-keep-"));
  writeFileSync(join(dir, "agent-gp.jsonl"), proseTranscriptIn(proj, "general-purpose"));
  writeFileSync(join(dir, "agent-sato.jsonl"), proseTranscriptIn(proj, "sato"));
  const rows = harvest(dir, REAL_SCHEMA);
  assert.equal(rows.length, 2, "the unbound agent still gets a row; it is reported, not hidden");
  assert.deepEqual(rows.map((r) => r.agent).sort(), ["general-purpose", "sato"]);
});

test("a main-session log that ends mid-tool-call is not a dead agent", () => {
  // Caught by pointing the fixed tool at the real validation project, not by
  // this suite: 17 of 24 unattributed main-session transcripts end mid-tool-
  // call, because a session log simply stops when the session does. Reporting
  // those as agents that never returned re-inflates the count in a new column
  // and makes --strict unusable at a project root — the exact regression #128
  // exists to undo. Unattributed rows owe no packet AND owe no return.
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-mainsession-"));
  writeFileSync(
    join(dir, "session.jsonl"),
    line({ type: "assistant", message: { role: "assistant", content: "Let me check the board." } }) +
      line({
        type: "assistant",
        message: { role: "assistant", stop_reason: "tool_use", content: [{ type: "tool_use", name: "Bash", input: {} }] },
      })
  );
  const [row] = harvest(dir, REAL_SCHEMA, { now: Date.now() + 3_600_000 });
  assert.equal(row.agent, "(unknown)", "fixture sanity: this row is unattributed");
  assert.equal(row.status, STATUS.noReturn, "fixture sanity: it did end mid-tool-call");
  assert.equal(isDeadAgent(row), false, "a session log is not a specialist that died mid-return");
});

test("an ATTRIBUTED transcript ending mid-tool-call IS a dead agent", () => {
  // The discriminating arm: without it, "never report a dead agent" passes the
  // test above and the whole truncation fix goes silent.
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-deadagent-"));
  writeFileSync(join(dir, "agent-sato.jsonl"), truncatedTranscript("Now the C1 fix."));
  const [row] = harvest(dir, REAL_SCHEMA, { now: Date.now() + 3_600_000 });
  assert.equal(isDeadAgent(row), true, "a specialist killed mid-tool-loop must stay visible");
});

// --- review round: what out-of-scope must NOT be able to silence -------------
//
// Pierrot's Critical. The out-of-scope fix stopped over-reporting and started
// under-reporting: a roster read PERFECTLY that simply does not contain this
// agent silenced it just as thoroughly as an unbound built-in. Four real
// personas carrying genuine violations printed "0 violation(s) found" and
// exited 0 under --strict. `null`-not-empty-Set only ever covered the roster
// you could not READ.

/** A project binding `names`, each agent file carrying the real binding marker. */
function projectBinding(names, { withMarker = true } = {}) {
  const proj = mkdtempSync(join(tmpdir(), "summon-project-"));
  mkdirSync(join(proj, ".claude", "agents"), { recursive: true });
  const body = withMarker ? `# persona\n\n${BINDING_MARKER} End your return with one JSON object.\n` : "# persona\n";
  for (const n of names) writeFileSync(join(proj, ".claude", "agents", `${n}.md`), body);
  return proj;
}

const proseIn = (cwd, agent) =>
  line({ type: "user", cwd, message: { role: "user", content: "Go." } }) +
  line({ type: "assistant", attributionAgent: agent, cwd, message: { role: "assistant", content: "Prose, no envelope." } });

test("a REAL persona missing from a readable roster is graded, never silenced", () => {
  // The Critical. `vik` is a Summon persona; this project's roster happens not
  // to list it (a sibling cwd, a half-finished install, a user-scope persona).
  // Silencing it is indistinguishable from silencing `general-purpose`, and
  // exactly one of those is safe.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-realpersona-"));
  writeFileSync(join(dir, "agent-vik.jsonl"), proseIn(proj, "vik"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.notEqual(row.status, STATUS.outOfScope, "only a known built-in agent type may be treated as out of scope");
  assert.ok(row.violations.length > 0, "a real persona's missing packet must survive the roster check");
});

test("a known built-in agent type IS out-of-scope", () => {
  // The discriminating arm: the allowlist must still do its job, or #128's
  // original five-fold overstatement comes straight back.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-builtin-"));
  writeFileSync(join(dir, "agent-gp.jsonl"), proseIn(proj, "general-purpose"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.status, STATUS.outOfScope);
  assert.deepEqual(row.violations, []);
});

test("an agent file with no binding marker does not count as bound", () => {
  // Archie: the predicate was "a .md file exists", while check-canon.mjs owns
  // the real one — the file must carry the canonical binding line. A stale
  // scaffold or a user's own custom agent has a file and no contract, and was
  // being billed for one. #128's error class, one layer in.
  const proj = projectBinding(["sato"], { withMarker: false });
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-nomarker-"));
  writeFileSync(join(dir, "agent-sato.jsonl"), proseIn(proj, "sato"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.rosterKnown, false, "a roster in which no file carries the binding is not a roster");
  assert.ok(row.violations.length > 0, "and an unknown roster grades as bound rather than silencing");
});

test("an existing but EMPTY .claude/agents/ is not an empty roster", () => {
  // Tara: mutating this guard left 78/78 green, because the only roster test
  // used a directory that did not exist, so readdirSync threw and the
  // length check was never reached.
  const proj = projectBinding([]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-emptyroster-"));
  writeFileSync(join(dir, "agent-vik.jsonl"), proseIn(proj, "vik"));
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.rosterKnown, false);
  assert.notEqual(row.status, STATUS.outOfScope);
  assert.ok(row.violations.length > 0, "a directory with no personas cannot be the roster of a project that ran one");
});

// --- review round: a return that said nothing is a return -------------------
//
// Vik, Archie and Pierrot converged on this independently. A blank-but-present
// final text block shared a branch with a null one, so an agent that DID reach
// a turn and used it to say nothing was filed under a label this commit defines
// as "never reached a turn in which it could comply".

test("a blank final text block is a missing packet, not a missing return", () => {
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-blank-"));
  writeFileSync(
    join(dir, "agent-sato.jsonl"),
    line({ type: "assistant", attributionAgent: "sato", cwd: proj, message: { content: "Working." } }) +
      line({ type: "assistant", attributionAgent: "sato", cwd: proj, message: { content: [{ type: "text", text: "   " }] } })
  );
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.status, STATUS.noPacket, "it reached a turn and used it; that is a return carrying no packet");
  assert.ok(row.violations.length > 0, "and it must carry the violation, not vanish between two columns");
});

test("a tool-use-only tail is still a missing RETURN", () => {
  // The discriminating arm, so the split above cannot be implemented by
  // calling everything a missing packet.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-split-"));
  writeFileSync(join(dir, "agent-sato.jsonl"), truncatedTranscript("Now the C1 fix.", "sato", proj));
  const [row] = harvest(dir, REAL_SCHEMA, { now: Date.now() + 3_600_000 });
  assert.equal(row.status, STATUS.noReturn);
  assert.deepEqual(row.violations, [], "no contract was breached — there was no return to breach it with");
});

// --- review round: a live agent is not a dead one ---------------------------
//
// Pierrot found this by accident: the same directory gave different answers
// minutes apart. A transcript still being appended to has a tool-use-only last
// record BY DEFINITION, so `--strict` bills a running agent as a killed one.

test("a transcript still being written is in-flight, not dead", () => {
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-live-"));
  const f = join(dir, "agent-sato.jsonl");
  writeFileSync(f, truncatedTranscript("Still working.", "sato", proj));
  const now = 1_760_000_000_000;
  utimesSync(f, new Date(now - 5_000), new Date(now - 5_000)); // touched 5s ago
  const [row] = harvest(dir, REAL_SCHEMA, { now });
  assert.equal(row.status, STATUS.inFlight, "a file written seconds ago is a session in progress");
});

test("a transcript untouched for an hour IS dead", () => {
  // The discriminating arm: without it, "never report a dead agent" passes.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cold-"));
  const f = join(dir, "agent-sato.jsonl");
  writeFileSync(f, truncatedTranscript("Now the C1 fix.", "sato", proj));
  const now = 1_760_000_000_000;
  utimesSync(f, new Date(now - 3_600_000), new Date(now - 3_600_000));
  const [row] = harvest(dir, REAL_SCHEMA, { now });
  assert.equal(row.status, STATUS.noReturn, "an hour cold is not a session in progress");
});

// --- review round: smaller, but each one was a real hole --------------------

test("cwd comes from the final assistant record, not from any later line", () => {
  // Pierrot: :112 took the last cwd off ANY record. Real data has two cwd
  // values in one project, one of them a vendor dir with zero agent files.
  const real = projectBinding(["sato"]);
  const vendor = mkdtempSync(join(tmpdir(), "summon-vendor-"));
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cwd-"));
  writeFileSync(
    join(dir, "agent-sato.jsonl"),
    line({ type: "assistant", attributionAgent: "sato", cwd: real, message: { content: "Prose, no envelope." } }) +
      line({ type: "user", cwd: vendor, message: { role: "user", content: [{ type: "tool_result", content: "ok" }] } })
  );
  const [row] = harvest(dir, REAL_SCHEMA);
  assert.equal(row.rosterKnown, true, "the roster must come from where the agent ran, not from a later tool result");
});

test("the roster cache does not memoize a failed read", () => {
  // Vik: one transient readdir failure poisoned the project for the whole run
  // and re-inflated the violation count invisibly.
  const proj = mkdtempSync(join(tmpdir(), "summon-latecreate-"));
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-recache-"));
  writeFileSync(join(dir, "agent-sato.jsonl"), proseIn(proj, "sato"));
  assert.equal(harvest(dir, REAL_SCHEMA)[0].rosterKnown, false, "fixture sanity: no roster yet");
  mkdirSync(join(proj, ".claude", "agents"), { recursive: true });
  writeFileSync(join(proj, ".claude", "agents", "sato.md"), `# p\n\n${BINDING_MARKER} x\n`);
  assert.equal(harvest(dir, REAL_SCHEMA)[0].rosterKnown, true, "a failed read must not be remembered as a verdict");
});

test("a symlinked transcript is not silently dropped", () => {
  // Pierrot: entry.isFile() is false for a symlink Dirent, so the file
  // vanished with no note — the same way an unmeasured agent reads as a
  // compliant one.
  const proj = projectBinding(["sato"]);
  const real = mkdtempSync(join(tmpdir(), "summon-harvest-realdir-"));
  writeFileSync(join(real, "agent-sato.jsonl"), proseIn(proj, "sato"));
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-symlink-"));
  symlinkSync(join(real, "agent-sato.jsonl"), join(dir, "agent-sato.jsonl"));
  const rows = harvest(dir, REAL_SCHEMA);
  assert.equal(rows.length, 1, "a symlinked transcript is a transcript");
});
