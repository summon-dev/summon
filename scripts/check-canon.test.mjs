#!/usr/bin/env node
// agent-notes: { ctx: "tests for check-canon: review-sentinel integrity, the team tree, the version manifest", deps: [scripts/check-canon.mjs, docs/process/gotchas.md, team/version.json, packages/summon-team/package.json, docs/methodology/team-layers.md], state: active, last: "tara@2026-09-11", key: ["catches the real 2026-08-06 placeholder verbatim", "false-positive guards: board pipeline prose and the /command placeholder both mention in-flight words", "entry-point guard regression: importing must not exit, running must print", "rule #11: team/version.json summon-team must equal packages/summon-team/package.json version when packages/ exists; with no packages/ (a scaffolded project) a well-formed manifest passes and a malformed or missing one still fails; wired into the CLI, pinned by a spawn in a fixture root"] }
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
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { findSentinelProblems } from "./check-canon.mjs";

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

// --- check #10: the team tree (ADR-0015 sequencing step 4) --------------------
// Red phase for findTeamProblems. The composer already refuses a malformed layer at
// compose time; this check makes those refusals, plus three rules the composer does
// not own (adapters fitted, deps resolve, log validates), CI facts.

import { findTeamProblems } from "./check-canon.mjs";

const ROLE = `---
name: tester
description: Writes failing tests first.
---
<!-- agent-notes: { ctx: "fixture", deps: [team/roles/tester/role.json], state: draft, last: "t@2026-09-09" } -->
# Tester

## Charter

FIXTURE-CHARTER You write the failing tests first.

## Standard

Fails for the right reason.

## Questions

Time pinned?

## Boundaries

You do not write production code.

## Output

The tests.
`;
const PERSONA = (priors = "FIXTURE-PRIORS A test that cannot fail is worse than none.", dep = "team/roles/tester/SKILL.md") => `---
name: tara
role: tester
display: Tara
---
<!-- agent-notes: { ctx: "fixture", deps: [${dep}], state: draft, last: "t@2026-09-09" } -->
## Priors

${priors}

## Dissent

When the brief's arithmetic is off, she says the real number unprompted.

## Voice

Precise.

"Minus two."

## Tells

Counts.
`;
const TEAM = (edit = () => {}) => {
  const root = mkdtempSync(join(tmpdir(), "summon-canon-team-"));
  const files = {
    "team/roles/tester/SKILL.md": ROLE,
    "team/roles/tester/role.json": JSON.stringify({ may: ["read", "write:tests"], "must-not": ["write:src"], lenses: [] }),
    "team/personas/tara.md": PERSONA(),
    "team/views/skin/party.json": JSON.stringify({ skin: "skin", title: "FIXTURE-TITLE", members: { tara: { class: "FIXTURE-CLASS-ARCHER", accent: "#ef4444", blurb: "FIXTURE-BLURB" } } }),
    "team/harness/claude-code.json": JSON.stringify({ harness: "claude-code", fitted: true, review: "x", output: { dir: ".claude/agents", file: "{name}.md" }, capabilities: { read: ["Read"], "write:src": ["Write"], "write:tests": ["Write"] }, frontmatter: {}, budget: {} }),
    "team/parties/core.json": JSON.stringify({ name: "core", harness: "claude-code", view: "skin", members: [{ role: "tester", persona: "tara" }], formations: [] }),
    "team/events.json": JSON.stringify({ common: ["t", "seat", "event"], events: { claim: { required: ["item"] } }, severities: [], verdicts: ["accept"], grades: [] }),
    "team/checks.json": JSON.stringify({ log: ".summon/team-log.jsonl" }),
    ".summon/team-log.jsonl": JSON.stringify({ t: "2026-09-09T10:00:00Z", seat: "tara", event: "claim", item: "i1" }) + "\n",
  };
  edit(files);
  for (const [rel, content] of Object.entries(files)) {
    if (content === null) continue;
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
  return root;
};

test("team: a clean tree has no problems", () => {
  assert.deepEqual(findTeamProblems(TEAM()), []);
});

test("team: a tree with no team/ directory is skipped, not failed", () => {
  const root = mkdtempSync(join(tmpdir(), "summon-canon-noteam-"));
  assert.deepEqual(findTeamProblems(root), []);
});

test("team: a party that does not compose fails with the composer's own reason", () => {
  const root = TEAM((f) => (f["team/parties/core.json"] = JSON.stringify({ name: "core", harness: "claude-code", view: "skin", members: [{ role: "tester", persona: "nobody" }] })));
  const problems = findTeamProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /party "core".*persona "nobody"/);
});

test("team: an adapter that is not fitted: true fails, naming the adapter", () => {
  // team-layers.md: fitted is "Always true. Every adapter is fitted to something."
  const root = TEAM((f) => (f["team/harness/claude-code.json"] = f["team/harness/claude-code.json"].replace('"fitted":true', '"fitted":false')));
  assert.ok(findTeamProblems(root).some((p) => /adapter "claude-code".*fitted/.test(p)), findTeamProblems(root).join("; "));
});

test("team: skin text that reaches a composed agent fails, naming the agent and the string", () => {
  // A persona whose own prose repeats its skin class is the realistic way a leak happens.
  const root = TEAM((f) => (f["team/personas/tara.md"] = PERSONA("I am FIXTURE-CLASS-ARCHER, and proud of it.")));
  const problems = findTeamProblems(root);
  assert.ok(problems.some((p) => /\.claude\/agents\/tara\.md.*FIXTURE-CLASS-ARCHER/.test(p)), problems.join("; "));
});

test("team: an agent-notes dep under team/ that does not resolve fails, naming the file and the dep", () => {
  const root = TEAM((f) => (f["team/personas/tara.md"] = PERSONA(undefined, "team/roles/nope/SKILL.md")));
  const problems = findTeamProblems(root);
  assert.ok(problems.some((p) => /team\/personas\/tara\.md.*"team\/roles\/nope\/SKILL\.md"/.test(p)), problems.join("; "));
});

test("team: an invalid event in the configured log fails by line number; a missing log file does not", () => {
  const bad = TEAM((f) => (f[".summon/team-log.jsonl"] += JSON.stringify({ t: "2026-09-09T10:01:00Z", seat: "tara", event: "dance" }) + "\n"));
  assert.ok(findTeamProblems(bad).some((p) => /team-log\.jsonl line 2.*event "dance"/.test(p)), findTeamProblems(bad).join("; "));
  const none = TEAM((f) => (f[".summon/team-log.jsonl"] = null));
  assert.deepEqual(findTeamProblems(none), []);
});

test("team: the checked-in tree passes", () => {
  assert.deepEqual(findTeamProblems(resolve(import.meta.dirname, "..")), []);
});

// --- check #11: the version manifest (work order first-run, third pass) ----------------
// team-layers.md § The version: every project carries team/version.json, and this repo's copy
// is kept equal to packages/summon-team/package.json by a canon check. A scaffolded project has
// no packages/, so there the rule has nothing to compare against and passes on a well-formed
// manifest; a manifest that is missing or carries a non-string summon-team is wrong anywhere.
// Imported by namespace so an export that does not exist yet fails these tests and not the
// file's import (a missing named export is a link error that would take every test above down).

import * as canon from "./check-canon.mjs";

const VERSION_FILE = join("team", "version.json");
const TEAM_PKG = join("packages", "summon-team", "package.json");

/**
 * A root with team/version.json (`manifest`: object as JSON, string verbatim, null for no file)
 * and packages/summon-team/package.json (`pkg`: object, or null for no packages/ tree at all).
 */
const VERSION_TREE = ({ manifest = { "summon-team": "1.2.3", scaffolded: null, source: null }, pkg = { name: "summon-team", version: "1.2.3" } } = {}) => {
  const root = mkdtempSync(join(tmpdir(), "summon-canon-version-"));
  if (manifest !== null) {
    mkdirSync(join(root, "team"), { recursive: true });
    writeFileSync(join(root, VERSION_FILE), typeof manifest === "string" ? manifest : JSON.stringify(manifest));
  }
  if (pkg !== null) {
    mkdirSync(join(root, "packages", "summon-team"), { recursive: true });
    writeFileSync(join(root, TEAM_PKG), JSON.stringify(pkg));
  }
  return root;
};

const NAMES_FILE = /team[\/\\]version\.json/;
const NAMES_FIELD = /"summon-team"/;

test("version: a manifest equal to the package version has no problems", () => {
  assert.deepEqual(canon.findVersionProblems(VERSION_TREE()), []);
});

test("version: a manifest that differs from the package version fails, naming both files and both versions", () => {
  const problems = canon.findVersionProblems(VERSION_TREE({ pkg: { name: "summon-team", version: "1.2.4" } }));
  assert.equal(problems.length, 1, problems.join("; "));
  assert.match(problems[0], NAMES_FILE);
  assert.match(problems[0], /packages[\/\\]summon-team[\/\\]package\.json/);
  assert.match(problems[0], /1\.2\.3/);
  assert.match(problems[0], /1\.2\.4/);
});

test("version: a missing manifest fails, naming team/version.json", () => {
  const problems = canon.findVersionProblems(VERSION_TREE({ manifest: null }));
  assert.equal(problems.length, 1, problems.join("; "));
  assert.match(problems[0], NAMES_FILE);
});

test("version: a summon-team field that is absent, empty, or not a string fails, naming the file and the field", () => {
  for (const manifest of [{ scaffolded: null, source: null }, { "summon-team": "" }, { "summon-team": 3 }, { "summon-team": null }, '"1.2.3"']) {
    const problems = canon.findVersionProblems(VERSION_TREE({ manifest }));
    assert.equal(problems.length, 1, `${JSON.stringify(manifest)}: ${problems.join("; ")}`);
    assert.match(problems[0], NAMES_FILE);
    assert.match(problems[0], NAMES_FIELD);
  }
});

test("version: a malformed manifest fails, naming team/version.json", () => {
  const problems = canon.findVersionProblems(VERSION_TREE({ manifest: "{not json" }));
  assert.equal(problems.length, 1, problems.join("; "));
  assert.match(problems[0], NAMES_FILE);
});

test("version: a scaffolded project (no packages/) passes on a well-formed manifest, whatever version it carries", () => {
  // The scaffolder stamps its own version; the project has no package to compare it to.
  assert.deepEqual(canon.findVersionProblems(VERSION_TREE({ manifest: { "summon-team": "0.3.7", scaffolded: "2026-09-11T00:00:00Z", source: "github:summon-dev/summon" }, pkg: null })), []);
});

test("version: a scaffolded project (no packages/) still fails on a missing or malformed manifest", () => {
  const missing = canon.findVersionProblems(VERSION_TREE({ manifest: null, pkg: null }));
  assert.equal(missing.length, 1, missing.join("; "));
  assert.match(missing[0], NAMES_FILE);
  const bad = canon.findVersionProblems(VERSION_TREE({ manifest: { "summon-team": 3 }, pkg: null }));
  assert.equal(bad.length, 1, bad.join("; "));
  assert.match(bad[0], NAMES_FIELD);
});

test("version: the CLI runs the rule, so a mismatch in the cwd's tree is reported in the verdict", () => {
  // check-canon.mjs takes its root from process.cwd(). The bare fixture also fails the other
  // checks (no .claude/, no docs/), so the exit code alone proves nothing; the version line does.
  const root = VERSION_TREE({ pkg: { name: "summon-team", version: "1.2.4" } });
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    (err) => {
      const out = String(err.stderr) + String(err.stdout);
      return err.status === 1 && NAMES_FILE.test(out) && /1\.2\.3/.test(out) && /1\.2\.4/.test(out);
    }
  );
});

test("version: the checked-in tree passes", () => {
  // Read inside the test, not at module load, so a broken manifest fails this one named test.
  const repo = resolve(import.meta.dirname, "..");
  const manifest = JSON.parse(readFileSync(join(repo, VERSION_FILE), "utf8"));
  const pkg = JSON.parse(readFileSync(join(repo, TEAM_PKG), "utf8"));
  assert.equal(manifest["summon-team"], pkg.version, "team/version.json and packages/summon-team/package.json carry the same version");
  assert.deepEqual(canon.findVersionProblems(repo), []);
});
