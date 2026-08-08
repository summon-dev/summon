#!/usr/bin/env node
// agent-notes: { ctx: "CLI-level exit-code tests for the packet harvester", deps: [scripts/harvest-packets.mjs], state: active, last: "claude@2026-08-09", key: ["the exit code is the ONLY part a machine consumes, and it had no coverage", "three separate paths once exited 0 having measured nothing — all three are pinned here", "exit 2 = could not measure; absent input is not clean input"] }
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
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(import.meta.dirname, "harvest-packets.mjs");
const SCHEMA = resolve(import.meta.dirname, "..", "schemas", "packet.schema.json");

const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

/** A transcript dir. Each entry is [filename, assistantText, attributionAgent|null]. */
function treeOf(entries) {
  const dir = mkdtempSync(join(tmpdir(), "summon-harvest-cli-"));
  for (const [name, text, agent] of entries) {
    const line = { type: "assistant", message: { content: text } };
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
  assert.equal(run(dir, "--strict").status, 2);
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
  const dir = treeOf([["agent-1.jsonl", "Findings in prose, no envelope.", "vik"]]);
  assert.equal(run(dir, SCHEMA, "--strict").status, 1);
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
  assert.equal(run(dir, SCHEMA, "--strict").status, 0);
});

// --- usage errors -------------------------------------------------------------

test("a missing directory exits 2", () => {
  assert.equal(run(join(tmpdir(), "summon-does-not-exist-4f2a"), "--strict").status, 2);
});

test("no arguments exits 2 and prints usage", () => {
  const r = run();
  assert.equal(r.status, 2);
  assert.match(`${r.stdout}${r.stderr}`, /usage:/i);
});

test("an unrecognised flag exits 2 rather than being ignored", () => {
  assert.equal(run(treeOf([]), "--strictly").status, 2);
});
