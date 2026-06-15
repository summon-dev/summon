#!/usr/bin/env node
// agent-notes: { ctx: "CI drift-guard for cross-file canon consistency", deps: [docs/methodology/personas.md, docs/process/done-gate.md], state: active, last: "vik@2026-06-15", key: ["fails build if persona roster, agent-notes, or Done Gate count drift"] }
//
// Fitness function for Summon's canon. Our agent/persona/process docs duplicate
// facts across many files; the agent-notes protocol keeps them in sync by hand.
// This script makes the load-bearing ones machine-checked, so drift fails CI
// instead of rotting silently. Inspired by ponytail's scripts/check-rule-copies.js.
//
//   node scripts/check-canon.mjs
//
// Exit 0 = canon consistent. Exit 1 = drift found (printed below).

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const AGENTS_DIR = join(ROOT, ".claude", "agents");
const COMMANDS_DIR = join(ROOT, ".claude", "commands");
const PERSONAS = join(ROOT, "docs", "methodology", "personas.md");
const DONE_GATE = join(ROOT, "docs", "process", "done-gate.md");

const failures = [];
const fail = (msg) => failures.push(msg);
const read = (p) => readFileSync(p, "utf8");
const mdFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".md"));

// 1. Agent file integrity: frontmatter `name:` matches filename, agent-notes present.
function checkAgentFiles() {
  for (const file of mdFiles(AGENTS_DIR)) {
    const stem = file.replace(/\.md$/, "");
    const body = read(join(AGENTS_DIR, file));
    const name = body.match(/^name:\s*(\S+)/m)?.[1];
    if (name !== stem) {
      fail(`agent ${file}: frontmatter name "${name ?? "(missing)"}" != filename "${stem}"`);
    }
    if (!body.includes("agent-notes:")) {
      fail(`agent ${file}: missing agent-notes block`);
    }
  }
}

// 2. Persona roster sync: agent files <-> "Agent file:" references in personas.md
//    must be the same set, in both directions.
function checkPersonaRoster() {
  const onDisk = new Set(mdFiles(AGENTS_DIR).map((f) => f.replace(/\.md$/, "")));
  const referenced = new Set(
    [...read(PERSONAS).matchAll(/\.claude\/agents\/([a-z-]+)\.md/g)].map((m) => m[1])
  );
  for (const a of onDisk) {
    if (!referenced.has(a)) fail(`persona roster: .claude/agents/${a}.md exists but is not documented in personas.md`);
  }
  for (const a of referenced) {
    if (!onDisk.has(a)) fail(`persona roster: personas.md references .claude/agents/${a}.md but the file is missing`);
  }
}

// 3. Every command file carries an agent-notes block.
function checkCommandNotes() {
  for (const file of mdFiles(COMMANDS_DIR)) {
    if (!read(join(COMMANDS_DIR, file)).includes("agent-notes:")) {
      fail(`command ${file}: missing agent-notes block`);
    }
  }
}

// 4. Done Gate count consistency: the number of top-level items in done-gate.md
//    must equal every "<N>-item ... Done Gate/checklist" claim across the docs.
//    This is exactly the prose-number-drifts-from-the-list bug agent-notes can't catch.
function checkDoneGateCount() {
  const actual = (read(DONE_GATE).match(/^\d+\.\s/gm) ?? []).length;
  const docs = ["CLAUDE.md", "docs/process/done-gate.md", "docs/process/gotchas.md"];
  for (const rel of docs) {
    const text = read(join(ROOT, rel));
    for (const m of text.matchAll(/(\d+)-item[^\n]*?(?:Done Gate|checklist)/gi)) {
      if (Number(m[1]) !== actual) {
        fail(`${rel}: claims "${m[1]}-item" but done-gate.md has ${actual} top-level items`);
      }
    }
  }
}

// summon: 4 checks cover the drift we've actually seen; add a status-flow-order
// check (Backlog->Ready->In Progress->In Review->Done across adapters) if those
// strings ever diverge.

for (const check of [checkAgentFiles, checkPersonaRoster, checkCommandNotes, checkDoneGateCount]) {
  try {
    check();
  } catch (err) {
    fail(`${check.name} threw: ${err.message}`);
  }
}

if (failures.length === 0) {
  console.log("canon check: OK");
  process.exit(0);
}
console.error(`canon check: ${failures.length} problem(s) found\n`);
for (const f of failures) console.error(`  - ${f}`);
process.exit(1);
