#!/usr/bin/env node
// agent-notes: { ctx: "post-hoc PACKET compliance harvester over subagent transcripts", deps: [schemas/packet.schema.json, docs/process/communication-registers.md], state: active, last: "claude@2026-08-13", key: ["the FINAL assistant record is the return, text or not — walking back past a tool-use-only turn graded a turn 92 records stale as if it were the return (#128)", "no-return carries NO contract violation but DOES trip --strict: a silently dead agent is the false green this tool exists to expose", "isDeadAgent() is DERIVED from status+attribution, never stored — three names for one idea is where the blank-text hole hid", "text present but blank is a no-packet VIOLATION, not a no-return: it reached a turn and used it to say nothing", "ONLY BUILT_IN_AGENT_TYPES membership silences a row; absence from a roster is a ROSTER MISMATCH, graded as bound and reported loudly (that silenced 4 real personas in review)", "bound means the agent file CARRIES BINDING_MARKER, imported from check-canon.mjs — one definition of the word, not two", "a roster that could not be READ is null, never an empty Set, and the failure is NOT cached — one transient readdir poisoned the whole run", "a live transcript looks exactly like a dead one; recent mtime means in-flight, not casualty", "the substrate is writable by the agents being measured — the number is worth the directory permissions", "read-only measurement, NOT an enforcement adapter — no hook, nothing blocks", "exit 0 = measured (violations go in the output), exit 2 = could not measure; --strict opts into exit 1 on violations", "harvest THROWS on an unreadable directory: an empty row set reads as `no violations` over a directory nobody read", "extractPacket recognises a packet ATTEMPT structurally (>=3 packet keys); conformance is validatePacket's question, never the extractor's", "brace scanning is string- and escape-aware — a narrative quoting code with braces in it is the common case", "CHECKED_KEYWORDS is a claim, not a label: every keyword listed fires, and an unlisted assertion keyword in a supplied schema throws rather than passing clean", "if/then is the ONE hardcoded conditional the schema instructs; an unrecognised if/then is refused rather than ignored", "a packet whose `agent` disagrees with the line's attributionAgent is a provenance violation, reported by harvest (validatePacket never sees the transcript)"] }
//
// ADR-0015 gave every specialist return a PACKET envelope, and then made it
// unmeasurable: the envelope is machine-consumed, the coordinator forwards only
// `narrative`, so no human ever sees a packet — and asking the coordinator
// whether the coordinator gated is the agent grading its own homework. This is
// where the evidence comes from instead.
//
// Scope, stated honestly: none of ADR-0015's eight reversal triggers is keyed to
// a violation count. This number SIZES Slice 3; it does not fire a pre-registered
// trigger. (It does bear on one of them — "unknowns[] becomes ritual" is
// countable from these transcripts — but that is a different measurement.)
//
// TRUST ASSUMPTION, because it bounds everything above: the substrate is
// writable by the agents being measured. Every persona has a shell, and this
// grades the last assistant record of a .jsonl that shell can append to. The
// number is exactly as trustworthy as the transcript directory's permissions,
// and that sentence belongs next to it in any governance document.
//
//   pnpm harvest:packets <transcript-dir> [schema.json] [--strict]
//
// It reads .jsonl session transcripts off disk, pulls the final assistant turn
// out of each one, and grades whatever packet it finds. It blocks nothing.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BINDING_MARKER } from "./check-canon.mjs";

// --- the documented value sets ----------------------------------------------
//
// The fallback used when no schema is supplied. It duplicates the assertions in
// schemas/packet.schema.json, which is a real drift risk and a deliberate one:
// this script ships into projects that may not carry the schema file, and a
// harvester that cannot run without it measures nothing there. The test suite
// asserts both arms agree on a conformant packet, which is the sensor for the
// drift. If the two disagree on anything else, the schema wins.

export const VALUE_SETS = Object.freeze({
  epistemic: ["deterministic", "inferential", "human-judgement"],
  severity: ["Critical", "Important", "Suggestions"],
  state: ["complete", "stopped_early"],
});

const AGENT_STEM_PATTERN = "^[a-z]([a-z-]*[a-z])?$";

export const DEFAULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["v", "agent", "state", "finding_count", "claims", "unknowns", "narrative"],
  properties: {
    v: { const: 1 },
    agent: { type: "string", pattern: AGENT_STEM_PATTERN },
    state: { enum: [...VALUE_SETS.state] },
    finding_count: { type: "integer", minimum: 0 },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "epistemic", "severity", "evidence", "action"],
        properties: {
          summary: { type: "string", minLength: 1 },
          epistemic: { enum: [...VALUE_SETS.epistemic] },
          severity: { enum: [...VALUE_SETS.severity] },
          evidence: { type: "string" },
          action: { type: "string", minLength: 1 },
        },
      },
    },
    unknowns: { type: "array", items: { type: "string", minLength: 1 } },
    narrative: { type: "string", minLength: 1 },
  },
};

// --- transcript reading ------------------------------------------------------

/** Text out of a message `content`, which is either a string or a block array. */
function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  // Only `text` blocks are the return. A harvester that stringifies the whole
  // array finds JSON in a tool_use input and grades that instead.
  const parts = content.filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text);
  return parts.length ? parts.join("\n") : null;
}

/**
 * The final assistant turn, plus the persona the transcript attributes it to and
 * the working directory it ran in.
 * Lines that are not valid JSON are skipped: a transcript truncated mid-write is
 * normal, and dying on one bad line reports nothing about the other thirty-nine.
 *
 * THE FINAL ASSISTANT RECORD IS THE AGENT'S LAST ACT, whether or not it carried
 * text. This used to `continue` past a tool-use-only turn and keep walking
 * backwards for text, which meant an agent killed mid-tool-loop was graded on
 * whatever it last narrated — for one `sato` run, a turn 92 records before the
 * end of the transcript reading "Now the C1 fix in `bodies.py`.", reported as a
 * missing packet. That agent did not decline the contract; it never reached a
 * turn in which it could comply. `stop_reason` corroborates but cannot decide
 * it: across the 36 transcripts that surfaced this, the key was absent on 4.
 */
function finalAssistantTurn(jsonlText) {
  let text = null;
  let agent = null;
  let lastSeenAgent = null;
  let cwd = null;
  let endedMidToolCall = false;
  for (const raw of String(jsonlText ?? "").split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    let entry;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.attributionAgent === "string" && entry.attributionAgent) {
      lastSeenAgent = entry.attributionAgent;
    }
    if (entry.type !== "assistant") continue;
    // cwd comes off the ASSISTANT record, not off whatever line happens to be
    // last. A tool result can carry a different cwd — real transcripts hold two
    // in one project, one of them a vendor directory with no personas in it —
    // and the roster must come from where the agent actually ran.
    if (typeof entry.cwd === "string" && entry.cwd) cwd = entry.cwd;
    const found = contentText(entry.message?.content);
    endedMidToolCall = found === null;
    if (found === null) continue;
    text = found;
    agent = typeof entry.attributionAgent === "string" ? entry.attributionAgent : null;
  }
  // The agent's last act was a tool call, so nothing it said earlier is its
  // return. Discard the stale text rather than grade it.
  if (endedMidToolCall) {
    text = null;
    agent = null;
  }
  if (text === null && lastSeenAgent === null) return null;
  return { text, agent: agent ?? lastSeenAgent, cwd, endedMidToolCall };
}

/** The text of the last assistant turn in a JSONL transcript, or null. */
export function finalAssistantText(jsonlText) {
  const turn = finalAssistantTurn(jsonlText);
  return turn && turn.text !== null ? turn.text : null;
}

// --- packet extraction -------------------------------------------------------

const PACKET_KEYS = ["v", "agent", "state", "finding_count", "claims", "unknowns", "narrative"];

// Recognition is structural and deliberately loose. If recognition meant "has
// every required key", every non-conformant packet would extract as null, every
// violation would read as "no packet found", and validatePacket could never
// report anything against a real transcript — the tool would grade only the
// packets that need no grading. Three of seven is the line: enough to be an
// attempt, far more than any config blob quoted in prose carries.
const MIN_PACKET_KEYS = 3;

function looksLikePacket(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return PACKET_KEYS.filter((k) => Object.hasOwn(value, k)).length >= MIN_PACKET_KEYS;
}

/**
 * Index just past the `}` matching the `{` at `start`, or -1.
 *
 * String- and escape-aware, because a naive counter ends the object at the first
 * `}` inside a string value — and a narrative quoting code with braces in it is
 * the common case, not the exotic one. The escape handling is the second half: a
 * scanner that toggles on `"` but not on `\"` loses its place inside the string
 * and starts counting braces it should be skipping.
 */
function objectEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return i + 1;
  }
  return -1;
}

/** Cheap pre-filter: a JSON object literal opens with a key or closes at once. */
function opensLikeAnObject(text, i) {
  for (let j = i + 1; j < text.length; j++) {
    const ch = text[j];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") continue;
    return ch === '"' || ch === "}";
  }
  return false;
}

/**
 * The packet in a return, or null. Fences are irrelevant — the scan finds JSON
 * objects wherever they sit, so a fenced block and a bare object both work. The
 * LAST packet-shaped object wins, because the contract says the return ends with
 * one, and a packet quoted mid-prose is an example rather than the return.
 */
export function extractPacket(text) {
  if (typeof text !== "string" || !text) return null;
  let found = null;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{" || !opensLikeAnObject(text, i)) continue;
    const end = objectEnd(text, i);
    if (end === -1) continue;
    let parsed;
    try {
      parsed = JSON.parse(text.slice(i, end));
    } catch {
      continue;
    }
    if (looksLikePacket(parsed)) {
      found = parsed;
      i = end - 1; // a packet's own nested objects are not separate candidates
    }
  }
  return found;
}

// --- the validator -----------------------------------------------------------
//
// CHECKED_KEYWORDS is not documentation. It is a claim, and the test suite
// probes it behaviourally: for each keyword listed, a packet violating it must
// come back with a violation. Do not add a keyword here without the code that
// fires on it — a validator that silently no-ops on a keyword produces a pass
// certifying nothing, which is the laundered false green this whole contract
// exists to stop.

export const CHECKED_KEYWORDS = Object.freeze([
  "type",
  "enum",
  "const",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "minLength",
  "pattern",
  "minimum",
  "if",
  "then",
]);

// Every draft-07 keyword that can make a document invalid. Anything in here and
// not in CHECKED_KEYWORDS is refused rather than ignored: a caller can hand this
// function any schema, and returning [] for a packet that schema rejects is the
// exact failure mode the honesty rule is about.
const ASSERTION_KEYWORDS = new Set([
  "$ref",
  "type",
  "enum",
  "const",
  "required",
  "properties",
  "patternProperties",
  "additionalProperties",
  "propertyNames",
  "minProperties",
  "maxProperties",
  "dependencies",
  "dependentRequired",
  "dependentSchemas",
  "items",
  "prefixItems",
  "additionalItems",
  "contains",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minLength",
  "maxLength",
  "pattern",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "if",
  "then",
  "else",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
]);

// The one conditional this validator implements, hardcoded exactly as the
// schema's note to Slice 3 instructs rather than as a generic if/then engine: a
// deterministic claim must name what was run. `then` is intersected with the
// base schema (the properties walk still type-checks `evidence`) rather than
// replacing it, so evidence does not lose its type check on the claims that most
// need one.
function isTheDeterministicEvidenceConditional(node) {
  return (
    node.if?.properties?.epistemic?.const === "deterministic" &&
    node.then?.properties?.evidence?.minLength === 1
  );
}

/**
 * Refuse a schema this validator cannot honour, before grading anything against
 * it. Throwing is the honest outcome; the one outcome that must not happen is
 * returning [] because a keyword went unread.
 */
function assertSchemaSupported(schema) {
  const unsupported = new Set();
  const conditionals = [];
  (function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if ("if" in node || "then" in node || "else" in node) conditionals.push(node);
    for (const [key, value] of Object.entries(node)) {
      if (ASSERTION_KEYWORDS.has(key) && !CHECKED_KEYWORDS.includes(key)) unsupported.add(key);
      walk(value);
    }
  })(schema);

  if (unsupported.size > 0) {
    throw new Error(
      `packet validator: schema uses ${[...unsupported].sort().join(", ")}, which this validator does not implement. ` +
        "Refusing to grade — a pass that ignored those keywords would certify nothing."
    );
  }
  for (const node of conditionals) {
    if (!isTheDeterministicEvidenceConditional(node)) {
      throw new Error(
        "packet validator: schema carries an if/then this validator does not recognise. " +
          "Only the deterministic-claim-needs-evidence conditional is implemented (see schemas/packet.schema.json), " +
          "and evaluating some other conditional silently would certify nothing."
      );
    }
  }
}

const typeName = (value) =>
  value === null ? "null" : Array.isArray(value) ? "array" : typeof value;

function matchesType(value, type) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) =>
    t === "integer" ? Number.isInteger(value) : t === "number" ? typeof value === "number" : typeName(value) === t
  );
}

const sameValue = (a, b) =>
  a === b || (a !== null && b !== null && typeof a === "object" && typeof b === "object" && JSON.stringify(a) === JSON.stringify(b));

const show = (value) => (value === undefined ? "undefined" : JSON.stringify(value));

/** Walk one value against one subschema, collecting every violation it finds. */
function checkNode(value, schema, path, out) {
  if (!schema || typeof schema !== "object") return;
  const at = (msg) => out.push(path ? `${path}: ${msg}` : msg);

  if ("type" in schema && !matchesType(value, schema.type)) {
    at(`expected ${[schema.type].flat().join(" or ")}, got ${typeName(value)}`);
    return; // every keyword below assumes the type held
  }
  if ("const" in schema && !sameValue(value, schema.const)) {
    at(`expected ${show(schema.const)}, got ${show(value)}`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((allowed) => sameValue(allowed, value))) {
    at(`${show(value)} is not one of: ${schema.enum.map(show).join(", ")}`);
  }
  if (typeof schema.minLength === "number" && typeof value === "string" && value.length < schema.minLength) {
    at(schema.minLength === 1 ? "is empty" : `is shorter than ${schema.minLength} characters`);
  }
  if (typeof schema.pattern === "string" && typeof value === "string" && !new RegExp(schema.pattern).test(value)) {
    at(`${show(value)} does not match ${schema.pattern}`);
  }
  if (typeof schema.minimum === "number" && typeof value === "number" && value < schema.minimum) {
    at(`${value} is below the minimum of ${schema.minimum}`);
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const properties = schema.properties ?? {};
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) {
        at(`missing required key "${key}" — an absent key asserts nothing, which is not the same as an empty one`);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(properties, key)) at(`unexpected key "${key}" — the packet shape is closed`);
      }
    }
    for (const [key, sub] of Object.entries(properties)) {
      if (Object.hasOwn(value, key)) checkNode(value[key], sub, path ? `${path}.${key}` : key, out);
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => checkNode(item, schema.items, `${path}[${i}]`, out));
  }
}

/**
 * Grade a packet. Returns a list of human-readable violations; empty means
 * conformant. Throws when the supplied schema uses a keyword this validator does
 * not implement.
 *
 * Two rules live here rather than in the schema, because JSON Schema cannot
 * express either: finding_count must EQUAL claims.length (a relation between two
 * siblings), and a deterministic claim's evidence must name something that was
 * actually run (minLength cannot tell a command from three spaces).
 */
export function validatePacket(packet, schema) {
  const effective = schema ?? DEFAULT_SCHEMA;
  assertSchemaSupported(effective);

  const violations = [];
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    return [`not a packet: expected an object, got ${typeName(packet)}`];
  }
  checkNode(packet, effective, "", violations);

  // Equality, not a bound: an over-count claims findings that are not recorded,
  // and an under-count smuggles a recorded finding past the counter.
  if (Array.isArray(packet.claims) && Number.isFinite(packet.finding_count)) {
    if (packet.finding_count !== packet.claims.length) {
      violations.push(
        `finding_count is ${packet.finding_count} but claims has ${packet.claims.length} entr${packet.claims.length === 1 ? "y" : "ies"} — they must be equal`
      );
    }
  }

  // The pairing the epistemic grade exists for: "it looked clean" and "this
  // command exited 0, here it is" are different states that prose renders alike.
  if (Array.isArray(packet.claims)) {
    packet.claims.forEach((claim, i) => {
      if (!claim || typeof claim !== "object") return;
      if (claim.epistemic !== "deterministic") return;
      if (typeof claim.evidence !== "string" || claim.evidence.trim() === "") {
        violations.push(
          `claims[${i}].evidence: a deterministic claim must name what was RUN, and this one names nothing`
        );
      }
    });
  }

  return violations;
}

// --- harvest -----------------------------------------------------------------

/** The row identity for a transcript that names no persona at all. */
const UNATTRIBUTED = "(unknown)";

export const STATUS = Object.freeze({
  conformant: "conformant",
  malformed: "malformed",
  noPacket: "no-packet",
  noReturn: "no-return",
  outOfScope: "out-of-scope",
  inFlight: "in-flight",
});

// A transcript touched this recently is treated as a session still in progress
// rather than an agent that was killed. A running agent's transcript ends in a
// tool-use record BY DEFINITION, so without this the tool bills whoever is
// working right now as a casualty — found in review when the same directory
// gave different answers minutes apart.
const IN_FLIGHT_GRACE_MS = 60_000;

/**
 * The personas a project binds, as a Set of agent-file stems, or `null` when the
 * roster could not be determined.
 *
 * `null` IS NOT AN EMPTY ROSTER, and the distinction is the whole point. An
 * unreadable roster read as "this project binds nobody" would make every agent
 * out-of-scope and silence every violation — a clean report over a wholly
 * non-compliant fleet. That false negative is the same one this tool has now
 * produced in three other guises, so an existing-but-empty `.claude/agents/`
 * is also `null`: a directory with no personas in it cannot be the roster of a
 * project that just ran nine of them.
 */
const rosterCache = new Map();
function rosterFor(cwd) {
  if (typeof cwd !== "string" || !cwd) return null;
  if (rosterCache.has(cwd)) return rosterCache.get(cwd);
  let stems = null;
  try {
    const dir = join(cwd, ".claude", "agents");
    stems = readdirSync(dir, { withFileTypes: true })
      .filter((e) => !e.isDirectory() && e.name.endsWith(".md"))
      // "Bound" means the file CARRIES the return contract, not that the file
      // exists. check-canon.mjs already owns that predicate, so this imports it
      // rather than inventing a second definition of the same word. A stale
      // scaffold or a user's own custom agent has a file and no binding — and
      // was being billed for a contract it never received, which is this
      // issue's own error class one layer in.
      .filter((e) => {
        try {
          return readFileSync(join(dir, e.name), "utf8").includes(BINDING_MARKER);
        } catch {
          return false;
        }
      })
      .map((e) => e.name.slice(0, -".md".length));
  } catch {
    stems = null;
  }
  const roster = stems && stems.length > 0 ? new Set(stems) : null;
  // Only a SUCCESSFUL read is remembered. Caching the failure meant one
  // transient readdir — EMFILE on a deep walk, a network mount hiccup — poisoned
  // that project for every remaining transcript in the run, and silently
  // re-inflated the very count the tool exists to report.
  if (roster !== null) rosterCache.set(cwd, roster);
  return roster;
}

/** Drop every memoized roster. Exported for test isolation; the CLI never needs it. */
export function resetRosterCache() {
  rosterCache.clear();
}

/**
 * Agent types the harness provides, which have no `.claude/agents/` file and so
 * never received the return contract.
 *
 * THIS IS AN ALLOWLIST, AND THAT DIRECTION IS THE WHOLE POINT. Treating "absent
 * from the roster" as "owes nothing" silenced four real personas carrying real
 * violations in review — `vik` missing from a roster and `general-purpose`
 * missing from a roster were the same event to this code, and exactly one of
 * them is safe to ignore. A persona absent from a roster that WAS read is a
 * roster mismatch: graded as bound, reported loudly, never silenced.
 */
export const BUILT_IN_AGENT_TYPES = Object.freeze(
  new Set(["general-purpose", "explore", "plan", "statusline-setup", "output-style-setup"])
);

/**
 * Every `.jsonl` under `dir`, plus a count of entries skipped for not being one.
 * Symlinked transcripts count: `isFile()` is false for a symlink Dirent, so they
 * used to vanish with no note, which is how an unmeasured agent reads as a
 * compliant one.
 */
/**
 * A specialist that owed a return and produced none.
 *
 * Derived, not stored. It used to be a `countsAsDeadAgent` field sitting beside
 * `STATUS.noReturn` and `endedMidToolCall` — three names for one idea, which is
 * exactly where the blank-text hole hid: the three could disagree and nothing
 * reconciled them. An unattributed main-session log stops mid-tool-call because
 * the session stopped, and owes no return; an in-flight transcript has not
 * finished owing one yet.
 */
export function isDeadAgent(row) {
  return row.status === STATUS.noReturn && row.agent !== UNATTRIBUTED;
}

function transcriptFiles(dir) {
  const out = [];
  let skipped = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = transcriptFiles(abs);
      out.push(...nested.files);
      skipped += nested.skipped;
    } else if (entry.name.endsWith(".jsonl")) {
      // A symlink Dirent is neither isFile() nor isDirectory(); stat follows it.
      try {
        if (statSync(abs).isFile()) out.push(abs);
        else skipped += 1;
      } catch {
        skipped += 1;
      }
    }
  }
  return { files: out.sort(), skipped };
}

function gradeTranscript(file, root, schema, now) {
  const turn = finalAssistantTurn(readFileSync(file, "utf8"));
  const text = turn?.text ?? null;
  const packet = text ? extractPacket(text) : null;
  const attributed = turn?.agent ?? null;
  const agent =
    attributed ?? (packet && typeof packet.agent === "string" && packet.agent ? packet.agent : UNATTRIBUTED);
  const roster = rosterFor(turn?.cwd ?? null);
  const row = {
    file: relative(root, file) || basename(file),
    agent,
    status: STATUS.noReturn,
    violations: [],
    rosterKnown: roster !== null,
    rosterMismatch: false,
  };

  // A built-in agent type has no `.claude/agents/` file, so it never received
  // the binding and was never addressed by the contract. Checked BEFORE the
  // no-return arm on purpose: if the contract never addressed this agent,
  // whether it finished is not this tool's question to answer.
  //
  // Membership of BUILT_IN_AGENT_TYPES is the ONLY thing that silences a row.
  // Absence from the roster is not: a real persona missing from a roster that
  // was read perfectly well is a roster mismatch — a sibling cwd, a stale
  // install, a user-scope persona — and it is graded as bound and reported.
  // Treating the two alike silenced four real personas carrying real violations,
  // printed "0 violation(s) found", and exited 0 under --strict.
  if (attributed && BUILT_IN_AGENT_TYPES.has(attributed.toLowerCase())) {
    row.status = STATUS.outOfScope;
    return row;
  }
  if (attributed && roster && !roster.has(attributed)) row.rosterMismatch = true;

  if (text === null) {
    // No return at all: the agent's last act was a tool call, or it never spoke.
    //
    // A transcript still being appended to looks EXACTLY like a killed agent —
    // a running agent's file ends in a tool-use record by definition — so a
    // recently-touched file is in-flight, not a casualty. Without this the tool
    // bills whoever is working right now.
    let mtimeMs = null;
    try {
      mtimeMs = statSync(file).mtimeMs;
    } catch {
      mtimeMs = null;
    }
    if (turn?.endedMidToolCall && mtimeMs !== null && now - mtimeMs < IN_FLIGHT_GRACE_MS) {
      row.status = STATUS.inFlight;
    }
    return row;
  }

  if (text.trim() === "") {
    // It REACHED a turn and used it to say nothing. That is the purest missing
    // envelope there is, and it shared a branch with the no-return case above —
    // so it landed in neither the violations list, nor the dead-agent section,
    // nor --strict. Three reviewers found this independently.
    row.status = STATUS.noPacket;
    row.violations = attributed ? ["the return was empty — no prose and no PACKET envelope"] : [];
    return row;
  }

  if (!packet) {
    row.status = STATUS.noPacket;
    // Only a transcript the harness attributed to a persona owes a packet. An
    // unattributed one is a main-session log, which was never a specialist
    // return and cannot have failed a contract that does not address it.
    // Counting those as violations made --strict useless at a project root —
    // 38 of 41 "violations" in the first real run were this — and a measuring
    // instrument that inflates its own numbers is worse than no instrument.
    row.violations = attributed
      ? ["the return carried no PACKET envelope — the contract asks every return to end with one"]
      : [];
    return row;
  }

  row.violations = validatePacket(packet, schema);
  // The one check the transcript can make and a shape check never can: the
  // persona that ran is not the persona the packet claims.
  if (attributed && typeof packet.agent === "string" && packet.agent !== attributed) {
    row.violations.push(
      `agent: the packet is signed "${packet.agent}" but the transcript attributes this run to "${attributed}" — provenance mismatch`
    );
  }
  row.status = row.violations.length === 0 ? STATUS.conformant : STATUS.malformed;
  return row;
}

/**
 * One row per transcript under `dir`.
 *
 * THROWS when the directory cannot be read. Never returns [] for an unreadable
 * directory: a caller reading that as "no violations" would have a green report
 * over something nobody measured, and it would be quoted at ADR-0015's reversal
 * checkpoint. An existing but empty directory HAS been read, and [] is a true
 * statement about it.
 */
export function harvest(dir, schema, opts = {}) {
  if (typeof dir !== "string" || dir.trim() === "") {
    throw new Error("harvest: no transcript directory given — refusing to report on a path that was never named");
  }
  let stats;
  try {
    stats = statSync(dir);
  } catch (err) {
    throw new Error(
      `harvest: cannot read transcript directory ${dir} (${err.code ?? err.message}) — ` +
        "refusing to report zero rows for a directory that was never read"
    );
  }
  if (!stats.isDirectory()) throw new Error(`harvest: ${dir} is not a directory`);

  const now = typeof opts.now === "number" ? opts.now : Date.now();
  const { files, skipped } = transcriptFiles(dir);
  const rows = files.map((file) => gradeTranscript(file, dir, schema, now));
  // Non-enumerable: this is metadata about the walk, not a row. An enumerable
  // property would make `harvest(dir)` stop deep-equalling the array it is.
  Object.defineProperty(rows, "skippedEntries", { value: skipped, enumerable: false });
  return rows;
}

// --- CLI ---------------------------------------------------------------------

const USAGE = `usage: node scripts/harvest-packets.mjs <transcript-dir> [schema.json] [--strict]

Grades PACKET compliance from subagent transcripts after the fact. Read-only:
it blocks nothing and gates nothing.

  --strict   exit 1 when violations were found OR an agent never returned
             (default: both are output, not an exit code)

exit 0  measurement succeeded, whatever it found
exit 1  --strict only, violations found or an agent never returned
exit 2  could not measure (missing directory, bad usage, unusable schema,
        or nothing under it was addressed by the contract)

Statuses. "no-return" is an agent whose last act was a tool call — it was killed
mid-loop and never reached a turn in which it could comply, so it carries no
contract violation but IS surfaced, because a silently dead agent is the failure
this tool exists to expose. "out-of-scope" is an agent the target project does
not bind in .claude/agents/, which was never addressed by the contract at all.`;

const pad = (s, width) => String(s).padEnd(width);

function renderTable(rows) {
  const statuses = [STATUS.conformant, STATUS.malformed, STATUS.noPacket, STATUS.noReturn, STATUS.inFlight, STATUS.outOfScope];
  const byAgent = new Map();
  for (const row of rows) {
    if (!byAgent.has(row.agent)) byAgent.set(row.agent, { total: 0, violations: 0, ...Object.fromEntries(statuses.map((s) => [s, 0])) });
    const tally = byAgent.get(row.agent);
    tally.total += 1;
    tally[row.status] += 1;
    tally.violations += row.violations.length;
  }
  const header = ["agent", "total", ...statuses, "violations"];
  const body = [...byAgent.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([agent, t]) => [agent, t.total, ...statuses.map((s) => t[s]), t.violations]);
  const totals = ["TOTAL", rows.length, ...statuses.map((s) => rows.filter((r) => r.status === s).length), rows.reduce((n, r) => n + r.violations.length, 0)];
  const all = [header, ...body, totals];
  const widths = header.map((_, i) => Math.max(...all.map((line) => String(line[i]).length)));
  const line = (cells) => cells.map((c, i) => pad(c, widths[i])).join("  ").trimEnd();
  return [line(header), line(widths.map((w) => "-".repeat(w))), ...body.map(line), line(totals)].join("\n");
}

function main(argv) {
  const flags = argv.filter((a) => a.startsWith("--"));
  const positionals = argv.filter((a) => !a.startsWith("--"));
  if (flags.includes("--help") || flags.includes("-h")) {
    console.log(USAGE);
    return 0;
  }
  const unknown = flags.filter((f) => f !== "--strict");
  if (unknown.length > 0) {
    console.error(`harvest:packets: unknown option ${unknown.join(", ")}\n\n${USAGE}`);
    return 2;
  }
  const [dir, schemaPath] = positionals;
  if (!dir) {
    console.error(`harvest:packets: no transcript directory given\n\n${USAGE}`);
    return 2;
  }

  const bundled = resolve(dirname(fileURLToPath(import.meta.url)), "..", "schemas", "packet.schema.json");
  const chosen = schemaPath ?? (existsSync(bundled) ? bundled : null);
  let schema;
  if (chosen) {
    try {
      schema = JSON.parse(readFileSync(chosen, "utf8"));
    } catch (err) {
      console.error(`harvest:packets: cannot read schema ${chosen} — ${err.message}`);
      return 2;
    }
  }

  let rows;
  try {
    rows = harvest(dir, schema);
  } catch (err) {
    console.error(`harvest:packets: ${err.message}`);
    return 2;
  }

  console.log(`transcripts: ${dir}`);
  console.log(`schema:      ${chosen ?? "built-in fallback (the documented value sets)"}\n`);

  if (rows.length === 0) {
    // Said explicitly, because the alternative reading is the dangerous one. The
    // transcript layout is undocumented harness internals; if it moved, this is
    // a tool that failed to find anything, not a roster of compliant agents.
    console.log("No .jsonl transcripts found under that directory.");
    console.log("That is NOT a report of zero violations — nothing was measured. If the harness");
    console.log("transcript layout has changed, point this at the directory that now holds the");
    console.log("session .jsonl files.");
    return 2; // could not measure — the prose said so, and now the exit code does too
  }

  console.log(renderTable(rows));

  const offenders = rows.filter((r) => r.violations.length > 0);
  if (offenders.length > 0) {
    console.log("\nviolations:");
    for (const row of offenders) {
      console.log(`  ${row.file} (${row.agent}) — ${row.status}`);
      for (const v of row.violations) console.log(`    - ${v}`);
    }
  }

  // Pointed at a project root, the walk also picks up main-session transcripts,
  // which carry no persona attribution and are never expected to end in a
  // packet. They are reported (silently dropping a file is how an unmeasured
  // agent reads as a compliant one) but the reader has to be told they are not
  // non-compliance, for the same reason the empty-directory case is spelled out.
  const unattributed = rows.filter((r) => r.agent === UNATTRIBUTED).length;
  if (unattributed > 0) {
    console.log(
      `\nnote: ${unattributed} transcript(s) carry no persona attribution — those are main-session\n` +
        "transcripts, not subagent returns, and owe no packet. Point this at a `subagents/`\n" +
        "directory to measure only specialist returns. They contribute no violations, and\n" +
        "--strict does NOT count them. Some sit under no-return because a session log stops\n" +
        "mid-tool-call when the session does — that is not an agent that died, so the\n" +
        "no-return column and the specialist count below deliberately differ."
    );
  }

  // An agent killed mid-tool-loop carries no contract violation — it never
  // reached a turn in which it could comply — so without this it would land in
  // a report reading "0 violation(s) found" over two dead agents. That is the
  // false green in CLAUDE.md § Treat Agent Output as Untrusted, printed by the
  // tool built to expose it. It gets its own count, its own section, and it
  // trips --strict.
  const deadAgents = rows.filter(isDeadAgent);
  if (deadAgents.length > 0) {
    console.log("\nspecialists that produced no return (no contract violation, but not a pass either):");
    for (const row of deadAgents) console.log(`  ${row.file} (${row.agent})`);
  }

  const outOfScope = rows.filter((r) => r.status === STATUS.outOfScope).length;
  if (outOfScope > 0) {
    console.log(
      `\nnote: ${outOfScope} transcript(s) ran under a built-in agent type (${[...BUILT_IN_AGENT_TYPES].join(", ")}).\n` +
        "Those have no .claude/agents/ file, never received the return contract, and are out\n" +
        "of scope rather than non-compliant. Counted, shown, and excluded from violations and\n" +
        "from --strict. NOTHING ELSE is ever excluded on roster grounds."
    );
  }

  // A real persona absent from a roster that WAS read. This is the loud arm of
  // the Critical found in review: silence here is indistinguishable from
  // silencing a built-in, and it hid four real personas carrying real
  // violations. They are graded as bound — the count below includes them — and
  // the mismatch is reported so the roster itself can be fixed.
  const mismatched = rows.filter((r) => r.rosterMismatch);
  if (mismatched.length > 0) {
    console.log(
      `\nROSTER MISMATCH: ${mismatched.length} transcript(s) ran under an agent the project's\n` +
        ".claude/agents/ does not bind, and which is not a known built-in type. They were\n" +
        "GRADED AS BOUND, not excused — a persona missing from a roster is a broken install,\n" +
        "a sibling cwd, or a user-scope agent, and none of those is a reason to drop findings."
    );
    for (const row of mismatched) console.log(`  ${row.file} (${row.agent})`);
  }

  const inFlight = rows.filter((r) => r.status === STATUS.inFlight);
  if (inFlight.length > 0) {
    console.log(
      `\nnote: ${inFlight.length} transcript(s) were written within the last ${IN_FLIGHT_GRACE_MS / 1000}s and are\n` +
        "treated as sessions still in progress, not as agents that died. A running agent's\n" +
        "transcript ends in a tool-use record exactly like a killed one does."
    );
  }

  if (rows.skippedEntries > 0) {
    console.log(
      `\nnote: ${rows.skippedEntries} .jsonl entr(ies) were not readable regular files and could not be\n` +
        "graded. Reported rather than dropped: a silently skipped transcript reads as a\n" +
        "compliant agent."
    );
  }

  // Rows whose project roster could not be read are graded as bound, and the
  // reader is told. The alternative — assuming an unreadable roster binds
  // nobody — would mark every agent out-of-scope and silence every violation.
  const rosterUnknown = rows.filter((r) => r.rosterKnown === false && r.agent !== UNATTRIBUTED).length;
  if (rosterUnknown > 0) {
    console.log(
      `\nnote: ${rosterUnknown} transcript(s) could not be matched to a project roster (no cwd, or\n` +
        "no readable .claude/agents/ under it) and were graded as though bound. An unknown\n" +
        "roster is not an empty one; assuming otherwise would suppress every violation."
    );
  }

  // Every row unattributed or out-of-scope is NOT a clean fleet — it is a
  // failure to measure.
  //
  // The unattributed half exists because the fix above created it. Unattributed
  // rows were being counted as violations (38 of 41 in the first real run), so
  // they were made incapable of carrying one — which converted a false positive
  // into a false negative. `attributionAgent` is undocumented harness
  // internals: rename it upstream and every specialist return becomes
  // unattributed, every violation is suppressed, and this prints "0
  // violation(s) found" over a wholly non-compliant fleet. Pierrot reproduced
  // exactly that. Out-of-scope joins it for the same reason: a run in which
  // nothing was addressed by the contract measured nothing about the contract.
  //
  // Absent input is not clean input. That is the distinction ADR-0015
  // Sub-decision 3 demands of Slice 3's validator, and the one this tool was
  // built to make measurable — rebuilding it in here would be the joke telling
  // itself.
  if (unattributed + outOfScope === rows.length) {
    console.log(
      "\nNOT MEASURED: no transcript here was gradeable against the return contract — every\n" +
        "one was either unattributed or run by an agent type the project does not bind. This\n" +
        "is a failure to measure, not a clean result. `attributionAgent` and `cwd` are\n" +
        "undocumented harness internals — if either has been renamed or moved, this tool\n" +
        "needs updating before its numbers mean anything."
    );
    return 2;
  }

  const totalViolations = rows.reduce((n, r) => n + r.violations.length, 0);
  const stopped = deadAgents.length > 0 ? `, ${deadAgents.length} specialist(s) produced no return` : "";
  // rows.length is not the denominator anyone wants. On the real project it read
  // "60 transcript(s) measured" when 27 were gradeable, so every reader who
  // divided got a different wrong answer. Say both, and say which is which.
  const gradeable = rows.filter((r) => r.agent !== UNATTRIBUTED && r.status !== STATUS.outOfScope).length;
  console.log(
    `\n${rows.length} transcript(s) read, ${gradeable} gradeable against the contract; ` +
      `${totalViolations} violation(s) found${stopped}.` +
      ((totalViolations > 0 || deadAgents.length > 0) && !flags.includes("--strict")
        ? " Exit 0: this is a measurement, not a gate."
        : "")
  );
  return flags.includes("--strict") && (totalViolations > 0 || deadAgents.length > 0) ? 1 : 0;
}

// Entry-point guard, so importing this module does not scan a directory and
// print a report. `import.meta.url` is percent-encoded and `process.argv[1]` is
// not, hence pathToFileURL — the same comparison scripts/check-canon.mjs uses.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
