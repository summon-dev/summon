#!/usr/bin/env node
// agent-notes: { ctx: "tests for check-canon's sentinel and persona-voice checks", deps: [scripts/check-canon.mjs, docs/process/gotchas.md], state: active, last: "claude@2026-08-08", key: ["catches the real 2026-08-06 placeholder verbatim", "false-positive guards: board pipeline prose and the /command placeholder both mention in-flight words", "entry-point guard regression: importing must not exit, running must print"] }
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
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { findSentinelProblems, findPersonasMissingVoice } from "./check-canon.mjs";

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
