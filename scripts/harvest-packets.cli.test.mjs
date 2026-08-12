#!/usr/bin/env node
// agent-notes: { ctx: "CLI-level exit-code tests for the packet harvester", deps: [scripts/harvest-packets.mjs], state: active, last: "claude@2026-08-13", key: ["an exit-code assertion alone cannot tell `judged correctly` from `never ran` — a syntax error also exits 1, so every case pairs its exit code with an assertion on stdout or stderr", "the exit code is the ONLY part a machine consumes, and it had no coverage", "three separate paths once exited 0 having measured nothing — all three are pinned here", "exit 2 = could not measure; absent input is not clean input"] }
//
//   node --test scripts/harvest-packets.cli.test.mjs
//
// Pierrot's root-cause finding on #121: `main` is not exported and the unit
// suite covers only the exported functions, so the exit code — the one part of
// this tool a machine reads — had zero coverage. Three separate paths returned
// 0 after measuring nothing, and 55 passing unit tests said nothing about any
// of them. Follows the convention of scripts/check-css-contrast-motion.cli.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(import.meta.dirname, "harvest-packets.mjs");
const SCHEMA = resolve(import.meta.dirname, "..", "schemas", "packet.schema.json");

const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

/** A transcript dir. Each entry is [filename, assistantText, attributionAgent|null]. */
function treeOf(entries) {
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cli-"));
  for (const [name, text, agent] of entries) {
    // A block array, because that is what the harness actually writes: across
    // 668 real transcripts the final assistant content is a block array in all
    // of them and a bare string in none. Testing the machine-consumed layer in
    // a dialect the harness does not speak is how a population goes uncovered.
    const line = { type: "assistant", message: { content: [{ type: "text", text }] } };
    if (agent) line.attributionAgent = agent;
    writeFileSync(join(dir, name), JSON.stringify(line) + "\n");
  }
  return dir;
}

const CONFORMANT = JSON.stringify({
  v: 1, agent: "vik", state: "complete", finding_count: 1, unknowns: [],
  narrative: "One thing, at src/a.ts:1, Important, and you fix it by deleting the branch.",
  claims: [{ summary: "s", epistemic: "inferential", severity: "Important", evidence: "src/a.ts:1", action: "delete it" }],
});

const CONFORMANT_SATO = CONFORMANT.replace(/"vik"/g, '"sato"');

// --- the three paths that once exited 0 having measured nothing ---------------
//
// Each of these printed an honest paragraph and then handed the shell a 0. The
// prose told a human the truth while the exit code told a machine the opposite,
// and --strict exists for no reason other than to be read by a machine.

test("an empty directory exits 2, not 0", () => {
  const r = run(treeOf([]), "--strict");
  assert.equal(r.status, 2, "nothing measured must never look like nothing wrong");
  assert.match(r.stdout, /NOT a report of zero violations/);
});

test("a directory whose transcripts are under a different extension exits 2", () => {
  // The harness layout is undocumented internals. If it moves, this tool finds
  // no .jsonl and must say it failed rather than that the fleet is clean.
  const dir = treeOf([]);
  writeFileSync(join(dir, "agent-1.json"), "{}\n");
  const r = run(dir, "--strict");
  assert.equal(r.status, 2);
  assert.match(r.stdout, /NOT a report of zero violations/);
});

test("transcripts that are ALL unattributed exit 2, however non-compliant they are", () => {
  // The one that would actually bite, and it was introduced by the fix for the
  // opposite bug: unattributed rows were made incapable of carrying a violation,
  // so if `attributionAgent` is ever renamed upstream every specialist return
  // goes unattributed, every violation is suppressed, and this reports a clean
  // fleet. Three wholly non-compliant returns, "0 violations found", exit 0.
  const dir = treeOf([
    ["agent-1.jsonl", "Prose only, no envelope.", null],
    ["agent-2.jsonl", "Also prose.", null],
    ["agent-3.jsonl", "Still prose.", null],
  ]);
  const r = run(dir, "--strict");
  assert.equal(r.status, 2, "a fleet nobody could grade is not a compliant fleet");
  assert.match(r.stdout, /NOT MEASURED/);
});

// --- the discriminating arms, so the fixes above cannot pass by exiting 2 always

test("a measurable directory with no violations exits 0", () => {
  const dir = treeOf([["agent-1.jsonl", `Here it is.\n\n${CONFORMANT}`, "vik"]]);
  const r = run(dir, SCHEMA, "--strict");
  assert.equal(r.status, 0, `expected a clean measurement to exit 0:\n${r.stdout}`);
});

test("--strict exits 1 when an attributed specialist returned no packet", () => {
  // Asserts on stdout as well as the code. A module with a SYNTAX ERROR also
  // exits 1, so an exit-code assertion alone cannot tell "judged correctly"
  // from "never ran" — this exact test was green against an unparseable module.
  const dir = treeOf([["agent-1.jsonl", "Findings in prose, no envelope.", "vik"]]);
  const r = run(dir, SCHEMA, "--strict");
  assert.equal(r.status, 1);
  assert.match(r.stdout, /no PACKET envelope/);
});

test("without --strict, violations still exit 0 — this is a measurement, not a gate", () => {
  const dir = treeOf([["agent-1.jsonl", "Findings in prose, no envelope.", "vik"]]);
  const r = run(dir, SCHEMA);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /measurement, not a gate/);
});

test("a mixed directory measures the attributed rows and does not exit 2", () => {
  // Guards the all-unattributed rule from over-firing: one attributed row is
  // enough to make the run a measurement.
  const dir = treeOf([
    ["agent-1.jsonl", "Main-session prose.", null],
    ["agent-2.jsonl", `Here it is.\n\n${CONFORMANT}`, "vik"],
  ]);
  const r = run(dir, SCHEMA, "--strict");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /transcript\(s\) read/);
});

// --- usage errors -------------------------------------------------------------

test("a missing directory exits 2", () => {
  const r = run(join(tmpdir(), "summon-does-not-exist-4f2a"), "--strict");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /cannot read transcript directory/);
});

test("no arguments exits 2 and prints usage", () => {
  const r = run();
  assert.equal(r.status, 2);
  assert.match(`${r.stdout}${r.stderr}`, /usage:/i);
});

test("an unrecognised flag exits 2 rather than being ignored", () => {
  const r = run(treeOf([]), "--strictly");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown option/);
});

// --- the two categories that owe no violation but must not read as a pass (#128)

import { mkdirSync } from "node:fs";

/** Age a fixture past the in-flight grace window, so it reads as dead rather than live. */
const age = (f) => utimesSync(f, new Date(Date.now() - 3_600_000), new Date(Date.now() - 3_600_000));

/** A project dir binding `names` as personas. */
function projectBinding(names) {
  const proj = mkdtempSync(join(tmpdir(), "summon-cli-project-"));
  mkdirSync(join(proj, ".claude", "agents"), { recursive: true });
  for (const n of names) writeFileSync(join(proj, ".claude", "agents", `${n}.md`), "# persona\n\n**Return contract (PACKET).** End your return with one JSON object.\n");
  return proj;
}

test("--strict exits 1 when an agent never returned", () => {
  // A truncated agent carries no contract violation — it never reached a turn
  // in which it could comply. Without its own count it lands in a report
  // reading "0 violation(s) found" over a dead agent, which is precisely the
  // false green CLAUDE.md § Treat Agent Output as Untrusted names.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cli-trunc-"));
  writeFileSync(
    join(dir, "agent-sato.jsonl"),
    JSON.stringify({ type: "assistant", attributionAgent: "sato", cwd: proj, message: { content: "Now the C1 fix." } }) +
      "\n" +
      JSON.stringify({
        type: "assistant",
        attributionAgent: "sato",
        cwd: proj,
        message: { stop_reason: "tool_use", content: [{ type: "tool_use", name: "Bash", input: { command: "pytest" } }] },
      }) +
      "\n"
  );
  age(join(dir, "agent-sato.jsonl"));
  const r = run(dir, SCHEMA, "--strict");
  assert.equal(r.status, 1, "an agent that died mid-run must not exit 0 under --strict");
  assert.match(r.stdout, /produced no return/);
});

test("--strict does NOT exit 1 for an out-of-scope agent alone", () => {
  // The discriminating arm. `general-purpose` has no agent file, so it never
  // received the binding — billing it inflated the miss count five-fold. But
  // an all-out-of-scope run measured nothing about the contract, so it exits 2
  // rather than 0: that is a failure to measure, not a clean fleet.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cli-oos-"));
  writeFileSync(
    join(dir, "agent-gp.jsonl"),
    JSON.stringify({ type: "assistant", attributionAgent: "general-purpose", cwd: proj, message: { content: "Prose." } }) + "\n"
  );
  writeFileSync(
    join(dir, "agent-sato.jsonl"),
    JSON.stringify({ type: "assistant", attributionAgent: "sato", cwd: proj, message: { content: CONFORMANT_SATO } }) + "\n"
  );
  const r = run(dir, SCHEMA, "--strict");
  assert.equal(r.status, 0, "an unbound agent type was never addressed by the contract and cannot fail it");
  assert.match(r.stdout, /ran under a built-in agent type/);
});

test("a run whose every transcript is out-of-scope exits 2, not 0", () => {
  // Nothing here was gradeable against the contract. Exiting 0 would report a
  // clean fleet over a measurement that never happened.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cli-alloos-"));
  writeFileSync(
    join(dir, "agent-gp.jsonl"),
    JSON.stringify({ type: "assistant", attributionAgent: "general-purpose", cwd: proj, message: { content: "Prose." } }) + "\n"
  );
  const r = run(dir, SCHEMA, "--strict");
  assert.equal(r.status, 2);
  assert.match(r.stdout, /NOT MEASURED/);
});

test("a real persona missing from the roster is reported, not silenced", () => {
  // The Critical, end to end. Four real personas carrying genuine violations
  // were silenced as out-of-scope, printing "0 violation(s) found" and exiting
  // 0 under --strict. Membership of the built-in allowlist is now the only
  // thing that excuses a row.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cli-mismatch-"));
  writeFileSync(
    join(dir, "agent-vik.jsonl"),
    JSON.stringify({ type: "assistant", attributionAgent: "vik", cwd: proj, message: { content: [{ type: "text", text: "Prose, no envelope." }] } }) + "\n"
  );
  const r = run(dir, SCHEMA, "--strict");
  assert.equal(r.status, 1, "a real persona's violation must survive a roster that omits it");
  assert.match(r.stdout, /ROSTER MISMATCH/);
  assert.match(r.stdout, /no PACKET envelope/);
});

test("the summary separates transcripts read from transcripts gradeable", () => {
  // It read "60 transcript(s) measured" when 27 were gradeable, so every reader
  // who divided got a different wrong answer.
  const proj = projectBinding(["sato"]);
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cli-denom-"));
  writeFileSync(
    join(dir, "agent-gp.jsonl"),
    JSON.stringify({ type: "assistant", attributionAgent: "general-purpose", cwd: proj, message: { content: [{ type: "text", text: "Prose." }] } }) + "\n"
  );
  writeFileSync(
    join(dir, "agent-sato.jsonl"),
    JSON.stringify({ type: "assistant", attributionAgent: "sato", cwd: proj, message: { content: [{ type: "text", text: CONFORMANT_SATO }] } }) + "\n"
  );
  const r = run(dir, SCHEMA);
  assert.match(r.stdout, /2 transcript\(s\) read, 1 gradeable against the contract/);
});
