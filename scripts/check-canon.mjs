#!/usr/bin/env node
// agent-notes: { ctx: "CI drift-guard for cross-file canon consistency", deps: [docs/methodology/personas.md, docs/process/done-gate.md], state: active, last: "claude@2026-08-06", key: ["9 checks: agent files, persona roster, command agent-notes, Done-Gate count, board status-flow, command count, canon->meta boundary, ADR numbering, review-sentinel integrity", "Done-Gate-count scan covers README + site/, excludes ADRs/CHANGELOG history", "status-flow validates the stage SEQUENCE (separator-agnostic), identified structurally not by stage names", "canon->meta boundary (ADR-0007 §9) fails on any canon agent-notes dep into docs/history/, docs/adrs/meta/, .claude/handoff.md, or README.md", "ships into scaffolds: checks #7/#8/#9 self-skip when docs/adrs/meta absent (IS_SUMMON_REPO) so a canon-only tree passes", "check #9 catches the Placeholder-Sentinel anti-pattern; its marker regex is anchored to a Status: line because matching prose false-positived on two real reviews", "exports findSentinelProblems + runAllChecks behind an entry-point guard, so the module is importable by its tests"] }
//
// Fitness function for Summon's canon. Our agent/persona/process docs duplicate
// facts across many files; the agent-notes protocol keeps them in sync by hand.
// This script makes the load-bearing ones machine-checked, so drift fails CI
// instead of rotting silently. Inspired by ponytail's scripts/check-rule-copies.js.
//
//   node scripts/check-canon.mjs
//
// Exit 0 = canon consistent. Exit 1 = drift found (printed below).

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const AGENTS_DIR = join(ROOT, ".claude", "agents");
const COMMANDS_DIR = join(ROOT, ".claude", "commands");
const PERSONAS = join(ROOT, "docs", "methodology", "personas.md");
const DONE_GATE = join(ROOT, "docs", "process", "done-gate.md");

const failures = [];
const fail = (msg) => failures.push(msg);
const read = (p) => readFileSync(p, "utf8");
const mdFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".md"));

// Recursively collect .md/.mdx files under a dir (tolerant of a missing dir).
function walkMarkdown(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(abs));
    else if (/\.mdx?$/.test(entry.name)) out.push(abs);
  }
  return out;
}

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

// 2b. Every persona entry in personas.md carries a Voice field.
//
// ADR-0015 makes a persona `narrative` required on every specialist return, and
// personas.md is the single source that has to answer for all of them. Nine of
// fifteen had no voice recorded anywhere before #97 — not through drift, but
// because nothing made an absent one visible. Coverage tracked how vivid a
// persona was rather than whether anything needed it.
//
// So the sensor asserts presence, not quality. A deliberately plain voice is a
// legitimate value; a missing one is a defect. Anchored on the `**Agent file:**`
// line because that is what marks a section as a persona entry rather than a
// prose heading, which keeps the check honest when sections are added.
export function findPersonasMissingVoice(text) {
  const missing = [];
  for (const section of text.split(/^### /m).slice(1)) {
    const agentFile = /\*\*Agent file:\*\* `\.claude\/agents\/([a-z-]+)\.md`/.exec(section);
    if (!agentFile) continue; // a prose heading, not a persona entry
    if (!/^\*\*Voice:\*\*[ \t]*\S/m.test(section)) {
      missing.push({ name: section.split("\n")[0].trim(), agent: agentFile[1] });
    }
  }
  return missing;
}

function checkPersonaVoice() {
  for (const { name, agent } of findPersonasMissingVoice(read(PERSONAS))) {
    fail(
      `persona voice: "${name}" (${agent}.md) has no **Voice:** field in personas.md — ` +
        `ADR-0015 requires every persona to have a documented voice, and a blank is a defect rather than an opt-out`
    );
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
  // Scan user-facing, current-state surfaces that describe the live Done Gate.
  // Historical records are deliberately NOT scanned: an accepted ADR
  // (docs/adrs/**) and the CHANGELOG cite the count at the time they were
  // written and must not be rewritten to a later value. The whole
  // site/src/content tree is current-state product docs, so it's walked
  // recursively — add new current-state surfaces here, not historical ones.
  const explicit = ["CLAUDE.md", "README.md", "docs/process/done-gate.md", "docs/process/gotchas.md"];
  const files = [
    ...explicit.map((rel) => join(ROOT, rel)).filter(existsSync),
    ...walkMarkdown(join(ROOT, "site", "src", "content")),
  ];
  for (const abs of files) {
    const text = read(abs);
    const rel = relative(ROOT, abs);
    for (const m of text.matchAll(/(\d+)-item[^\n]*?(?:Done Gate|checklist)/gi)) {
      if (Number(m[1]) !== actual) {
        fail(`${rel}: claims "${m[1]}-item" but done-gate.md has ${actual} top-level items`);
      }
    }
  }
}

// 5. Board status-flow consistency: the *ordered stage sequence* must match
//    everywhere the pipeline is described. We normalize separators (→, -->, commas,
//    "and", markdown bold) and compare the stage list — punctuation/format is free,
//    but adding, dropping, renaming, or reordering a stage is drift. Historical
//    records (docs/adrs/**, CHANGELOG) are not scanned — they cite the flow as it was.
const STAGES = ["Backlog", "Ready", "In Progress", "In Review", "Done"];
function checkStatusFlow() {
  const files = [
    ...["CLAUDE.md", "README.md"].map((r) => join(ROOT, r)),
    ...walkMarkdown(join(ROOT, ".claude")),
    ...walkMarkdown(join(ROOT, "docs", "integrations")),
    ...walkMarkdown(join(ROOT, "site", "src", "content")),
  ].filter(existsSync);
  // Assumption: every single-line Backlog..Done enumeration in canon is the ORDERED
  // pipeline. A set-style claim ("ensure Done, Backlog, Ready, ... all exist") in a
  // non-canonical order would be reported as drift — keep such enumerations in order.
  for (const abs of files) {
    const rel = relative(ROOT, abs);
    for (const m of read(abs).matchAll(/\bBacklog\b[^\n]*?\bDone\b/g)) {
      const stages = m[0]
        .replace(/[*`]/g, "") // strip markdown bold/code
        .split(/\s*(?:→|-+>|>|\/|·|,|\|)\s*/) // arrows (→ --> > /), middot, comma, pipe
        .map((s) => s.replace(/^and\s+/i, "").trim()) // "and Done" -> "Done"
        .filter(Boolean);
      // Identify the board pipeline STRUCTURALLY — a separator-chain of >=3 tokens
      // anchored Backlog..Done — never by the middle stage names (those are what we
      // validate; keying on them lets a rename evade the check). Prose like
      // "from Backlog to Done" yields one token and is skipped.
      if (stages.length < 3 || stages[0] !== "Backlog" || stages.at(-1) !== "Done") continue;
      if (stages.join(" → ") !== STAGES.join(" → ")) {
        fail(`${rel}: board status flow [${stages.join(", ")}] != canonical [${STAGES.join(", ")}]`);
      }
    }
  }
}

// 6. Command-count consistency: every slash-command count claim across the
//    current-state surfaces must equal the number of .claude/commands/*.md files.
//    Scans CLAUDE.md + README + the whole site/src/content tree (the same surfaces
//    checkDoneGateCount walks) — a narrow single-file/single-phrasing check gives a
//    false sense of coverage (the count lives in marketing copy too). Historical
//    records (CHANGELOG, adrs/**) are not scanned — they cite the count as it was.
//    The robust subset of "command <-> file": the bijective /command-reference-
//    resolves direction is deliberately NOT built — commands are auto-discovered
//    with no canonical list, so that direction false-positives (YAGNI per ADR-0004's
//    "only encode invariants we actually observe").
function checkCommandCount() {
  const actual = mdFiles(COMMANDS_DIR).length;
  const files = [
    ...["CLAUDE.md", "README.md"].map((r) => join(ROOT, r)).filter(existsSync),
    ...walkMarkdown(join(ROOT, "site", "src", "content")),
  ];
  const patterns = [
    /\((\d+),\s*auto-discovered\)/g, // CLAUDE.md "(24, auto-discovered)"
    /\b(\d+)\s+(?:custom\s+|slash\s+)*commands?\b/gi, // "24 commands", "24 slash commands"
  ];
  for (const abs of files) {
    const text = read(abs);
    const rel = relative(ROOT, abs);
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        if (Number(m[1]) !== actual) {
          fail(`${rel}: claims "${m[0].trim()}" but .claude/commands has ${actual} files`);
        }
      }
    }
  }
}

// 7. Canon->meta boundary (ADR-0007 §9): no shipped canon file may carry an
//    agent-notes `dep` that points into a meta zone. Meta zones are excluded from
//    the scaffold (docs/history/, docs/adrs/meta/) or removed from the repo
//    entirely (.claude/handoff.md, the marketing README.md). A canon file that
//    deps into one ships a reference the user's copy can't resolve — exactly the
//    dangling `dep` `summon-team doctor` fails on downstream. We catch it here,
//    in-repo, pre-ship: deterministic path-prefix match, near-zero false positives
//    (it matches dep paths, not prose). The prose-mention variant was cut as a
//    non-goal (ADR-0007 §9) — it can't trend to zero and contradicts §5b.
//
//    Note: `.claude/handoff.md` and `README.md` are meta *files*, not zone
//    prefixes — §7 removes handoff.md and it (like the marketing README) never
//    ships, so a canon dep on either dangles just like a canon->zone dep.
const META_PREFIXES = ["docs/history/", "docs/adrs/meta/"];
const META_FILES = new Set([".claude/handoff.md", "README.md"]);
const isMetaTarget = (dep) =>
  META_PREFIXES.some((pre) => dep.startsWith(pre)) || META_FILES.has(dep);
const isCanonPath = (rel) =>
  !META_PREFIXES.some((pre) => rel.startsWith(pre)) && !META_FILES.has(rel);

// This file SHIPS into scaffolded projects (it's the exemplar fitness function
// retro.md/sprint-boundary.md/done-gate.md teach users to write). But checks #7 and
// #8 assert Summon-repo-only invariants about the meta zones — which don't exist in a
// user's project. Guard both on the meta zone's presence so check-canon runs clean
// downstream (a scaffold has canon ADRs 0001-0003 + the 0008 example, a deliberate
// gap where the excluded meta ADRs were — #8 must not read that as drift).
const IS_SUMMON_REPO = existsSync(join(ROOT, "docs", "adrs", "meta"));

function checkCanonMetaBoundary() {
  if (!IS_SUMMON_REPO) return;
  // Canon files that can carry agent-notes: the shipped docs, agents, and commands,
  // plus the two root docs. (Meta zones are skipped — their deps are meta->*, allowed.)
  const canonRoots = [
    join(ROOT, ".claude"),
    join(ROOT, "docs"),
  ];
  const files = [
    ...canonRoots.flatMap(walkMarkdown),
    ...["CLAUDE.md"].map((r) => join(ROOT, r)).filter(existsSync),
  ];
  for (const abs of files) {
    const rel = relative(ROOT, abs).split("\\").join("/");
    if (!isCanonPath(rel)) continue; // skip meta files' own deps
    const block = read(abs).match(/agent-notes:\s*\{[\s\S]*?deps:\s*\[([^\]]*)\]/);
    if (!block) continue;
    const deps = block[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    for (const dep of deps) {
      if (isMetaTarget(dep)) {
        fail(`canon->meta dep: ${rel} deps on "${dep}" (a meta path that does not ship)`);
      }
    }
  }
}

// 8. ADR numbering (ADR-0007 §9 rider): because docs/adrs/meta/ fragments the ADR
//    sequence, assert numbers are unique and contiguous from 0001 across BOTH
//    docs/adrs/ and docs/adrs/meta/. Turns the numbering-rot risk the meta split
//    introduces into a machine-caught error. (template.md has no number — skipped.)
function checkAdrNumbering() {
  if (!IS_SUMMON_REPO) return;
  const dirs = [join(ROOT, "docs", "adrs"), join(ROOT, "docs", "adrs", "meta")];
  const seen = new Map();
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of mdFiles(dir)) {
      const m = file.match(/^(\d{4})-/);
      if (!m) continue;
      const n = Number(m[1]);
      if (seen.has(n)) fail(`ADR number ${m[1]} is duplicated: ${file} and ${seen.get(n)}`);
      else seen.set(n, file);
    }
  }
  const nums = [...seen.keys()].sort((a, b) => a - b);
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) {
      fail(`ADR numbering not contiguous: expected ${String(i + 1).padStart(4, "0")}, found ${String(nums[i]).padStart(4, "0")} (${seen.get(nums[i])})`);
      break;
    }
  }
}

// 9. Review-sentinel integrity (the Placeholder-Sentinel anti-pattern,
//    docs/process/gotchas.md). A review agent's completion sentinel is what the
//    coordinator gates on. CLAUDE.md § Treat Agent Output as Untrusted says to
//    re-run any agent whose "self-declared count doesn't match the findings
//    present in the file" — but an agent briefed to write its file on turn 1
//    will write the sentinel INTO the skeleton, and then `0 declared` matches
//    `0 present` and the gate passes on a review that never happened. That is
//    not hypothetical: it happened on 2026-08-06, and a clean `git status` does
//    not catch it either, because the file exists.
//
//    Recording that in prose was itself the ADR-0012 §B defect — a mechanically
//    checkable rule left as prose. This is the sensor.
//
//    Exported so it is unit-testable; the CLI wrapper below adapts it.
export function findSentinelProblems(dir) {
  const problems = [];
  // Any AGENT-COMPLETE: shape, so this covers Pierrot, Vik, Tara and REVIEW alike.
  const SENTINEL = /^[A-Z][A-Z-]*-COMPLETE:/;
  // Markers that mean "not finished" — but ONLY when they are the file's own
  // status declaration. Matching them anywhere in the body produced two false
  // positives on real reviews immediately: one discusses the board's
  // `Backlog → Ready → In Progress` pipeline, the other the `/command`
  // placeholder token. A review that analyses a status flow is not a review
  // that is in progress, and a check that cannot tell the difference is one
  // people learn to route around.
  const STATUS_LINE = /^\s*[*_>\s-]*(?:\*\*)?status(?:\*\*)?\s*:\s*(.*)$/i;
  const IN_FLIGHT = /\b(IN PROGRESS|TBD|PLACEHOLDER|FILL ME|being filled in|underway)\b/i;

  for (const abs of walkMarkdown(dir)) {
    const rel = relative(ROOT, abs);
    const lines = read(abs).split("\n");
    const sentinelIdx = lines.findIndex((l) => SENTINEL.test(l.trim()));
    if (sentinelIdx === -1) continue; // not a sentinel-bearing report

    // (a) The sentinel is valid ONLY as the last line. Content after it means
    //     the agent kept writing past its own completion claim.
    const lastContentIdx = lines.reduce((acc, l, i) => (l.trim() ? i : acc), -1);
    if (sentinelIdx !== lastContentIdx) {
      problems.push(
        `${rel}: completion sentinel is not the last line (line ${sentinelIdx + 1} of ${lastContentIdx + 1}) — it attests to content written after it`
      );
    }

    // (b) The observed failure mode: a skeleton carrying both a sentinel and an
    //     in-flight marker. This is the rule that catches the real placeholder.
    for (const line of lines.slice(0, sentinelIdx)) {
      const status = line.match(STATUS_LINE);
      const marker = status && status[1].match(IN_FLIGHT);
      if (marker) {
        problems.push(
          `${rel}: declares "Status: ${marker[0]}" above a completion sentinel — the sentinel was written before the work it attests to`
        );
        break;
      }
    }

    // (c) A zero-findings sentinel is legitimate ONLY for a review that actually
    //     ran and found nothing clean — which has sections describing what was
    //     checked. A bare skeleton has just its title. Deliberately structural
    //     rather than a line-count threshold, and deliberately NOT "0 findings
    //     always fails": failing a genuinely clean review would train people to
    //     route around the check, which is worse than not having it.
    if (/:\s*0\s+findings/i.test(lines[sentinelIdx])) {
      const headings = lines.filter((l) => /^#{1,6}\s/.test(l)).length;
      if (headings < 2) {
        problems.push(
          `${rel}: declares 0 findings but has no sections describing what was checked — a review that found nothing still has to show its work`
        );
      }
    }
  }
  return problems;
}

function checkReviewSentinels() {
  // Consistent with #7/#8: docs/history/ is meta and never ships, so a scaffolded
  // canon-only tree has nothing to check and must not fail on its absence.
  if (!IS_SUMMON_REPO) return;
  for (const p of findSentinelProblems(join(ROOT, "docs", "history"))) fail(p);
}

export function runAllChecks() {
  for (const check of [checkAgentFiles, checkPersonaRoster, checkPersonaVoice, checkCommandNotes, checkDoneGateCount, checkStatusFlow, checkCommandCount, checkCanonMetaBoundary, checkAdrNumbering, checkReviewSentinels]) {
    try {
      check();
    } catch (err) {
      fail(`${check.name} threw: ${err.message}`);
    }
  }
  return failures;
}

// Entry-point guard, so this file can be imported by its tests without running
// the CLI and calling process.exit. `import.meta.url` is percent-encoded and
// `process.argv[1]` is not, so compare against pathToFileURL — the same six
// characters whose absence was a Critical defect in the CSS checker.
// `process.argv[1]` is undefined under `node -e`/`node --eval`, where nothing is
// the entry point — hence the guard on it, without which importing this module
// that way throws instead of just not running the CLI.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const found = runAllChecks();
  if (found.length === 0) {
    console.log("canon check: OK");
    process.exit(0);
  }
  console.error(`canon check: ${found.length} problem(s) found\n`);
  for (const f of found) console.error(`  - ${f}`);
  process.exit(1);
}
