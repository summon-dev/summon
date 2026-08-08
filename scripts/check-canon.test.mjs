#!/usr/bin/env node
// agent-notes: { ctx: "tests for check-canon's sentinel and persona-voice checks", deps: [scripts/check-canon.mjs, docs/methodology/personas.md, .claude/agents/], state: active, last: "tara@2026-08-08", key: ["catches the real 2026-08-06 placeholder verbatim", "false-positive guards: board pipeline prose and the /command placeholder both mention in-flight words", "entry-point guard regression: importing must not exit, running must print", "#112 delivery tests read the real agent files — presence in personas.md is not delivery", "the delivery wiring test drives the real CLI against a fixture tree (cwd-relative paths); the grep-for-a-call-site version it replaced passed against a call site in dead code", "the roster-census test is the anti-vacuity guard: a reshaped personas.md parses to zero personas and the real-data test goes green comparing nothing"] }
//
//   node --test scripts/check-canon.test.mjs
//
// The check exists because prose did not hold. On 2026-08-06 a review agent
// briefed to "write the file on turn 1 and end it with a sentinel" wrote
// `PIERROT-COMPLETE: 0 findings, 0 critical` above a body reading
// `Status: IN PROGRESS`, then ran out of turns. The coordinator's gate compares
// the declared count against the findings present — 0 matched 0 — so it passed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  findSentinelProblems,
  findPersonasMissingVoice,
  findVoiceDeliveryGaps,
} from "./check-canon.mjs";

const SCRIPT = resolve(import.meta.dirname, "check-canon.mjs");

/** Write one markdown file into a fresh temp dir and scan it. */
function scan(contents) {
  const dir = mkdtempSync(join(tmpdir(), "summon-sentinel-"));
  writeFileSync(join(dir, "report.md"), contents);
  return findSentinelProblems(dir);
}

// --- the failure this check was built for -----------------------------------

test("catches the 2026-08-06 placeholder verbatim", () => {
  const problems = scan(
    `# Impeccable Add-on Implementation — Security Review (Pierrot)

Status: IN PROGRESS — review underway, findings below are being filled in.

PIERROT-COMPLETE: 0 findings, 0 critical
`
  );
  assert.ok(problems.length > 0, "the real placeholder must not pass");
  assert.match(problems.join("\n"), /IN PROGRESS/);
});

test("flags an in-flight status declaration above a sentinel", () => {
  const problems = scan(
    `# Review

Status: TBD

## Findings
### Finding 1 — something
REVIEW-COMPLETE: 1 findings (0 critical, 0 important)
`
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /before the work it attests to/);
});

test("flags a sentinel that is not the last line", () => {
  const problems = scan(
    `# Review

## Findings
### Finding 1 — something

REVIEW-COMPLETE: 1 findings (0 critical, 0 important)

Oh, one more thing I found afterwards.
`
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /not the last line/);
});

test("flags a zero-findings sentinel with no sections describing what was checked", () => {
  const problems = scan(`# Review\n\nREVIEW-COMPLETE: 0 findings (0 critical)\n`);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /show its work/);
});

// --- false-positive guards --------------------------------------------------
//
// These matter more than the positives. A check that fires on correct reviews
// is one people learn to route around, which is worse than not having it — and
// the first draft of this check did exactly that on two real files.

test("accepts a genuinely clean review that shows its work", () => {
  const problems = scan(
    `# Review

## What I checked
Every input path, both failure branches, and the digest.

## Verified clean
No findings.

REVIEW-COMPLETE: 0 findings (0 critical, 0 important)
`
  );
  assert.deepEqual(problems, []);
});

test("does not fire on a review that discusses the board's In Progress stage", () => {
  // Regression: docs/history/code-reviews/2026-06-24-canon-checks.md analyses
  // the `Backlog → Ready → In Progress → In Review → Done` pipeline at length.
  const problems = scan(
    `# Review of checkStatusFlow

## Findings
### Finding 1 — the separator class is too narrow
The pipeline \`Backlog → Ready → In Progress → In Review → Done\` must stay ordered.
A set-style claim written In Progress, Done, Backlog would read as drift.

REVIEW-COMPLETE: 1 findings (0 critical, 1 important)
`
  );
  assert.deepEqual(problems, []);
});

test("does not fire on a review that discusses a placeholder token", () => {
  // Regression: docs/history/code-reviews/2026-06-24-doctor-check-a.md discusses
  // the `/command` placeholder that checkCommandRefs deliberately ignores.
  const problems = scan(
    `# Review of checkCommandRefs

## Findings
### Finding 1 — resolves-or-builtin-or-placeholder
A token that is the \`/command\` placeholder is reported as ok. TBD is not a status here.

REVIEW-COMPLETE: 1 findings (0 critical, 0 important)
`
  );
  assert.deepEqual(problems, []);
});

test("ignores markdown files that carry no sentinel at all", () => {
  assert.deepEqual(scan(`# Some design note\n\nStatus: IN PROGRESS\n\nNotes follow.\n`), []);
});

test("tolerates a missing directory", () => {
  assert.deepEqual(findSentinelProblems(join(tmpdir(), "summon-does-not-exist-9f3a")), []);
});

test("scans nested directories, not just the top level", () => {
  const dir = mkdtempSync(join(tmpdir(), "summon-sentinel-"));
  mkdirSync(join(dir, "tracking"), { recursive: true });
  writeFileSync(
    join(dir, "tracking", "r.md"),
    `# R\n\nStatus: IN PROGRESS\n\nVIK-COMPLETE: 2 findings\n`
  );
  assert.equal(findSentinelProblems(dir).length, 1);
});

// --- entry-point guard ------------------------------------------------------
//
// The guard added to make this module importable is the same six characters
// whose absence was a Critical defect in the CSS checker. If it breaks the
// other way, `node scripts/check-canon.mjs` silently does nothing and exits 0 —
// a green CI that checked nothing.

test("importing this module does not run the CLI", () => {
  // Reaching this line at all proves it: a missing guard would have called
  // process.exit() during the import at the top of this file.
  assert.equal(typeof findSentinelProblems, "function");
});

test("running the script as a CLI still executes the checks", () => {
  const out = execFileSync(process.execPath, [SCRIPT], {
    cwd: resolve(import.meta.dirname, ".."),
    encoding: "utf8",
  });
  assert.match(out, /canon check:/, "the CLI must produce a verdict, not exit silently");
});

// --- persona voice coverage (#97) -------------------------------------------
//
// Nine of fifteen personas had no voice recorded anywhere. Not drift: all three
// locations arrived in one import nobody deduplicated, and nothing made an
// absent voice visible. ADR-0015 then made a persona `narrative` required on
// every specialist return, which turns a documentation gap into a contract the
// repo cannot honour. These tests pin the sensor that replaces the vigilance.

const PERSONA = (body) =>
  `### Tester Tara\n\n**Agent file:** \`.claude/agents/tara.md\` **Capability:** TDD\n\n${body}\n`;

test("flags a persona entry with no Voice field", () => {
  const missing = findPersonasMissingVoice(PERSONA("The red in red-green-refactor."));
  assert.equal(missing.length, 1);
  assert.equal(missing[0].agent, "tara");
});

test("accepts a persona entry that carries a Voice field", () => {
  const missing = findPersonasMissingVoice(
    PERSONA("**Voice:** Precise and relentless about edge cases.\n\nThe red in red-green-refactor.")
  );
  assert.deepEqual(missing, []);
});

test("a deliberately plain voice is a valid value, not a blank", () => {
  // ADR-0015 rules out a neutral-by-design opt-out, but the sensor asserts
  // presence rather than flamboyance — recording that an agent is plain is a
  // decision, and the check must not push anyone into inventing a quirk.
  const missing = findPersonasMissingVoice(PERSONA("**Voice:** Plain and unhurried. No set-pieces."));
  assert.deepEqual(missing, []);
});

test("an empty Voice field counts as missing", () => {
  assert.equal(findPersonasMissingVoice(PERSONA("**Voice:**")).length, 1);
  assert.equal(findPersonasMissingVoice(PERSONA("**Voice:**   ")).length, 1);
});

test("ignores headings that are prose rather than persona entries", () => {
  // personas.md carries section headings like "Governance Rules" and
  // "Feature Development" that have no agent file and need no voice. Anchoring
  // on **Agent file:** is what keeps the check from demanding one.
  const text = "### Governance Rules\n\nVeto power exists and is explicit.\n";
  assert.deepEqual(findPersonasMissingVoice(text), []);
});

test("reports every uncovered persona, not just the first", () => {
  const text =
    PERSONA("no voice here") +
    "\n### SDE Sato\n\n**Agent file:** `.claude/agents/sato.md` **Capability:** Impl\n\nAlso none.\n";
  assert.deepEqual(
    findPersonasMissingVoice(text).map((m) => m.agent).sort(),
    ["sato", "tara"]
  );
});

test("the shipped personas.md has a voice for every persona", () => {
  // The regression guard that matters: this is the real file, not a fixture.
  const personas = readFileSync(
    resolve(import.meta.dirname, "..", "docs", "methodology", "personas.md"),
    "utf-8"
  );
  assert.deepEqual(findPersonasMissingVoice(personas), []);
});

// --- voice DELIVERY, not voice presence (#112) ------------------------------
//
// findPersonasMissingVoice measures the wrong end of the pipe. `personas.md` is
// a document; `.claude/agents/<name>.md` is the system prompt a subagent is
// actually handed. A short-turn agent told "your full persona is defined in
// docs/methodology/personas.md" never reads it. #97 wrote sixteen voices into
// personas.md and the sensor went green while fourteen agent files carried no
// voice at all — the voice existed everywhere except where it runs.
//
// The matching rule is verbatim containment after collapsing whitespace runs.
// ADR-0006's projection model makes personas.md the authored copy and the agent
// file a derived one, and verbatim is the only rule a script can decide. The
// whitespace collapse exists so a line-wrapped copy still counts; nothing looser.

/** Build one persona entry with the same anchor the real file uses. */
const ENTRY = (heading, agent, body) =>
  `### ${heading}\n\n**Agent file:** \`.claude/agents/${agent}.md\` **Capability:** X\n\n${body}\n`;

const TARA_VOICE =
  '**Voice:** Precise and relentless about edge cases. Asks what happens on the unhappy path before congratulating anyone on the happy one, and says "untested" where others say "probably fine".';

const TARA_ENTRY = ENTRY("Tester Tara", "tara", `${TARA_VOICE}\n\nThe red in red-green-refactor.`);

test("flags an agent file that carries no voice at all", () => {
  // The pre-fix state of all sixteen agent files: not one carries a **Voice:**
  // field, and the pointer to personas.md is not delivery.
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: "You are Tester Tara.\n\nYour full persona is defined in `docs/methodology/personas.md`.\n",
  });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].agent, "tara");
  assert.equal(gaps[0].reason, "missing");
  assert.match(gaps[0].name, /Tara/);
});

test("flags an agent file whose voice is a paraphrase of the canonical one", () => {
  // vik.md and pierrot.md both carry hand-written voice lines that predate #97
  // and say something *near* the canonical text — vik.md's is the "grizzled
  // veteran" line below. A near-miss is the dangerous case: it looks delivered,
  // drifts freely, and no reader can tell which copy is authoritative. It must
  // read as a gap rather than as coverage.
  const vikVoice =
    '**Voice:** Blunt and time-worn. Reaches for the war story over the principle, and would rather say "I have watched this fail" than "this is an anti-pattern".';
  const personas = ENTRY("Veteran Vik", "vik", `${vikVoice}\n\nThree parallel lenses.`);
  const gaps = findVoiceDeliveryGaps(personas, {
    vik: `You are Veteran Vik.\n\n**Voice:** Sound like a grizzled veteran who's seen every mistake before. "I've watched three teams build this exact abstraction. Two are gone. The third rewrote it as a simple function."\n`,
  });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].agent, "vik");
  assert.equal(gaps[0].reason, "mismatch");
});

test("accepts an agent file carrying the canonical sentence verbatim", () => {
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: `You are Tester Tara.\n\n${TARA_VOICE}\n\n## Your Role\n`,
  });
  assert.deepEqual(gaps, []);
});

test("allows extra material after the canonical sentence", () => {
  // Several agent files follow the projected voice with an exemplar line written
  // in that persona's register. The projection only has to be present — a check
  // that demanded an exact whole-field match would punish the richer files.
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: `You are Tester Tara.\n\n${TARA_VOICE} Example: "Three tests are green and the fourth is the one you did not write."\n`,
  });
  assert.deepEqual(gaps, []);
});

test("accepts a line-wrapped copy of the canonical sentence", () => {
  // Markdown authors and formatters wrap. Whitespace normalization is the whole
  // reason this is a containment check on collapsed text rather than on raw text.
  const wrapped =
    '**Voice:** Precise and relentless about edge cases.\nAsks what happens on the unhappy path before\ncongratulating anyone on the happy one, and says "untested"\nwhere others say "probably fine".';
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: `You are Tester Tara.\n\n${wrapped}\n`,
  });
  assert.deepEqual(gaps, []);
});

test("ignores prose headings that name no agent file", () => {
  // Same guard as the presence check: "Governance Rules" and "Feature
  // Development" are sections, not personas, and have no agent file to deliver to.
  const text = "### Governance Rules\n\nVeto power exists and is explicit.\n";
  assert.deepEqual(findVoiceDeliveryGaps(text, {}), []);
});

test("reports every undelivered persona, not just the first", () => {
  // The #97 failure was fourteen at once. A sensor that stops at the first gap
  // would have reported one and let thirteen ship.
  const satoVoice = "**Voice:** Plain and unhurried. Explains the change, not the changer.";
  const personas =
    TARA_ENTRY + "\n" + ENTRY("SDE Sato", "sato", `${satoVoice}\n\nGreen and refactor.`);
  const gaps = findVoiceDeliveryGaps(personas, {
    tara: "You are Tester Tara.\n",
    sato: "You are SDE Sato.\n",
  });
  assert.deepEqual(
    gaps.map((g) => g.agent).sort(),
    ["sato", "tara"]
  );
  assert.deepEqual([...new Set(gaps.map((g) => g.reason))], ["missing"]);
});

test("reports a named agent file that does not exist instead of throwing", () => {
  // personas.md can name an agent whose file was never created or was renamed.
  // Throwing here would take the whole canon check down with it, which converts
  // a reportable gap into a broken sensor.
  const personas = ENTRY("Ghost Gary", "gary", "**Voice:** Absent.\n\nNo file behind this name.");
  let gaps;
  assert.doesNotThrow(() => {
    gaps = findVoiceDeliveryGaps(personas, { tara: "You are Tester Tara.\n" });
  });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].agent, "gary");
  assert.equal(gaps[0].reason, "no-agent-file");
});

test("a persona with no Voice field at all is left to the presence check", () => {
  // findVoiceDeliveryGaps deliberately skips these rather than reporting the
  // same persona twice — checkPersonaVoice already names it, and a duplicate
  // entry under a "did not arrive" heading would send the reader to the agent
  // file to copy a sentence that does not exist yet.
  const gaps = findVoiceDeliveryGaps(ENTRY("Tester Tara", "tara", "The red in red-green-refactor."), {
    tara: "You are Tester Tara.\n",
  });
  assert.deepEqual(gaps, [], "an absent voice is an authoring gap, not a delivery gap");
});

// --- the CLI actually runs this check (#112) ---------------------------------
//
// This issue is a sensor wired to the wrong end of a pipe. An exported function
// nobody calls from runAllChecks is the same defect wearing a new hat: green
// unit tests and `node scripts/check-canon.mjs` still blind. The first version
// of this guard grepped the script's own source for a call site, which would
// have passed on a call sitting in dead code. The script resolves every path
// from `process.cwd()`, so it can be pointed at a fixture tree and made to
// speak — that is a strictly better assertion, so it replaces the grep.
//
// Both arms are needed. The firing arm alone would pass against a check that
// reports every persona unconditionally; the silent arm is what proves the
// sensor discriminates.

/** A minimal repo-shaped tree: one persona, one agent file. Returns its root. */
function fixtureTree(agentBody) {
  const dir = mkdtempSync(join(tmpdir(), "summon-canon-cli-"));
  mkdirSync(join(dir, "docs", "methodology"), { recursive: true });
  mkdirSync(join(dir, ".claude", "agents"), { recursive: true });
  writeFileSync(
    join(dir, "docs", "methodology", "personas.md"),
    ENTRY("Tester Tara", "tara", `${TARA_VOICE}\n\nThe red in red-green-refactor.`)
  );
  writeFileSync(join(dir, ".claude", "agents", "tara.md"), agentBody);
  return dir;
}

/** Run the real CLI against a fixture root and return its exit code + stderr. */
function runCli(cwd) {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd, encoding: "utf8" });
  return { status: r.status, output: `${r.stdout}${r.stderr}` };
}

test("the CLI reports a voice that never reached the agent file", () => {
  const { status, output } = runCli(
    fixtureTree("---\nname: tara\n---\n// agent-notes: {}\n\nYour persona is in `docs/methodology/personas.md`.\n")
  );
  assert.equal(status, 1, "an undelivered voice must fail the build, not just be findable");
  assert.match(output, /voice delivery: "Tester Tara"/);
  assert.match(output, /carries no \*\*Voice:\*\* field/);
});

test("the CLI stays silent about voice delivery once the projection is present", () => {
  // The fixture tree has no commands dir or done-gate, so other checks still
  // fail and the exit code stays 1. Asserting on the absence of this check's
  // own message is what isolates it.
  const { output } = runCli(
    fixtureTree(`---\nname: tara\n---\n// agent-notes: {}\n\n${TARA_VOICE}\n\n## Your Role\n`)
  );
  assert.doesNotMatch(output, /voice delivery:/, "a delivered voice must not be reported as a gap");
});

test("the shipped personas.md still parses into the full persona roster", () => {
  // Guards the vacuity hole the real-data test below cannot see. That test
  // asserts "no gaps", and a personas.md whose heading level or **Agent file:**
  // line changed shape would yield zero parsed sections, zero gaps, and a green
  // check that compared nothing — permanently, and silently. Mutating an agent
  // file does not expose this; only counting what the parser found does.
  // The expectation is derived from disk rather than hardcoded to 16, so adding
  // a persona does not fail this test — checkPersonaRoster owns set equality.
  const root = resolve(import.meta.dirname, "..");
  const personas = readFileSync(resolve(root, "docs", "methodology", "personas.md"), "utf-8");
  const onDisk = readdirSync(resolve(root, ".claude", "agents"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3))
    .sort();
  // Every persona is a gap against an empty agent map, so the gap list is a
  // faithful census of what the parser recognised as a persona entry.
  const parsed = findVoiceDeliveryGaps(personas, {}).map((g) => g.agent).sort();
  assert.deepEqual(parsed, onDisk, "the delivery check must see every persona, not silently zero of them");
});

test("every shipped persona's voice reached its shipped agent file", () => {
  // The regression guard that matters, and the one that is red today: real
  // personas.md, real .claude/agents/*.md, no fixtures. This is the assertion
  // findPersonasMissingVoice could never make, because it never opened an agent file.
  const root = resolve(import.meta.dirname, "..");
  const personas = readFileSync(resolve(root, "docs", "methodology", "personas.md"), "utf-8");
  const agentDir = resolve(root, ".claude", "agents");
  const agentTexts = Object.fromEntries(
    readdirSync(agentDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => [f.slice(0, -3), readFileSync(join(agentDir, f), "utf-8")])
  );
  assert.deepEqual(
    findVoiceDeliveryGaps(personas, agentTexts),
    [],
    "a voice recorded in personas.md but absent from the agent file never reaches a running subagent"
  );
});

// --- the comparison is scoped to the agent file's own Voice field ------------
//
// Found by Vik reviewing #112. The first implementation asked two questions
// that read as one: does `**Voice:**` appear anywhere in the file, and does the
// canonical sentence appear anywhere in the file. Nothing tied them to each
// other, so an agent file could carry a flatly wrong Voice field and pass on
// the strength of the canonical sentence surviving elsewhere in its prose.
//
// Case A below is not hypothetical. It is the shape pat.md was in before #112,
// with its tone descriptor sitting mid-paragraph under `## Your Role` — add a
// wrong `**Voice:**` line above that and the sensor blessed it.

const CANON = TARA_VOICE.replace("**Voice:** ", "");

test("a wrong Voice field is not rescued by the canonical sentence elsewhere", () => {
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: `**Voice:** Chipper and vague, never mentions edge cases.\n\n## Your Role\n\nShe is ${CANON}\n`,
  });
  assert.equal(gaps.length, 1, "the Voice field is what has to carry the projection");
  assert.equal(gaps[0].reason, "mismatch");
});

test("a **Voice:** mention inside agent-notes is not delivery", () => {
  // The marker occurs mid-line inside the notes comment, so the ^ anchor keeps
  // it out. Any agent file that ever documents this protocol would otherwise
  // have earned itself a free pass.
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: `<!-- agent-notes: { key: ["carries a **Voice:** field"] } -->\n\n## Your Role\n\nShe is ${CANON}\n`,
  });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].reason, "missing");
});

test("a stale first Voice field is not rescued by a canonical second one", () => {
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: `**Voice:** Stale wording that is wrong.\n\n${TARA_VOICE}\n`,
  });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].reason, "mismatch");
});

test("an exemplar quote in a paragraph below the field still passes", () => {
  // vik.md and pierrot.md both keep their exemplar quote under the projection.
  // Paragraph scoping must not read that separation as the field ending short.
  const gaps = findVoiceDeliveryGaps(TARA_ENTRY, {
    tara: `${TARA_VOICE}\n\n"Untested is not the same as probably fine."\n\n## Your Role\n`,
  });
  assert.deepEqual(gaps, []);
});

test("a persona slug that collides with an Object.prototype member does not throw", () => {
  // Found by Pierrot reviewing #112. The capture class is [a-z-]+, which rules
  // out __proto__ and every capitalised prototype member — but `constructor`
  // survives it, and agentTexts.constructor is the Object function rather than
  // undefined, so a bare lookup skipped the no-agent-file branch and threw on
  // .includes. The throw escaped the loop, so every persona after the poisoned
  // one went unchecked: a sensor that quietly stops measuring partway through.
  const gaps = findVoiceDeliveryGaps(
    ENTRY("Constructor", "constructor", TARA_VOICE) + "\n" + TARA_ENTRY,
    { tara: `${TARA_VOICE}\n` }
  );
  assert.equal(gaps.length, 1, "the personas after the poisoned one must still be checked");
  assert.equal(gaps[0].agent, "constructor");
  assert.equal(gaps[0].reason, "no-agent-file");
});
