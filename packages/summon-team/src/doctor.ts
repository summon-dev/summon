// agent-notes: { ctx: "summon doctor — portable health registry, run on-demand against cwd (ADR-0004)", deps: ["src/index.ts", "docs/adrs/0004-summon-doctor.md"], state: active, last: "sato@2026-06-24" }
//
// The `health` registry per ADR-0004: "is THIS project's Summon install wired
// correctly?" — run downstream via `npx summon-team@latest doctor`, against cwd,
// writing nothing. The `canon` registry (is the *framework* consistent?) is
// deliberately NOT in this module's import graph — it ships nowhere and runs only
// via the in-repo `pnpm check:canon` (ADR-0004 Decision 2, Wei gate R3 option 1).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

// Internal result struct (ADR-0004 Decision 3), shared in shape with ADR-0005's
// grader contract. NOT serialized to --json yet — exit code + stdout is the v1
// contract; the envelope is deferred until a per-check remediation consumer exists.
export const DOCTOR_SCHEMA_VERSION = 1;

export type Verdict = "ok" | "degraded" | "error";
export interface EvidencePointer {
  kind: "file" | "commit" | "span";
  ref: string;
}
export interface CheckResult {
  id: string;
  verdict: Verdict;
  detail: string;
  evidence: EvidencePointer[];
  schemaVersion: number;
}

export function isSummonProject(root: string): boolean {
  return existsSync(join(root, ".claude"));
}

// Recursively collect .md/.mdx under a dir (tolerant of a missing dir).
function walkMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(abs));
    else if (/\.mdx?$/.test(entry.name)) out.push(abs);
  }
  return out;
}

// Extract the agent-notes `deps: [...]` entries. agent-notes is the file's LEADING
// metadata (docs/methodology/agent-notes.md), so we anchor to the first `agent-notes:`
// and read the deps within it — NOT a later `deps:` from a fenced example/template
// block embedded in the doc body. Assumes the canonical inline bracket form
// (`deps: [a, b]`, the spec's only form); a YAML list form (`deps:` then `- a`) would
// read as empty — acceptable until the spec permits it.
function extractDeps(text: string): string[] {
  const notesIdx = text.search(/agent-notes\s*:/);
  if (notesIdx === -1) return [];
  const m = text.slice(notesIdx).match(/deps:\s*\[([^\]]*)\]/);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

// Only deps inside the Summon-owned surface are health's business — the user's own
// app code (src/, package.json, dist/...) is out of scope (ADR-0004 Decision 2).
function isSummonOwned(dep: string): boolean {
  return dep.startsWith(".claude/") || dep.startsWith("docs/");
}

// Resolve a dep, allowing the docs/scaffolds indirection: docs/X may live at
// docs/scaffolds/X until a scaffold command moves it to its final home.
function depResolves(root: string, dep: string): boolean {
  if (existsSync(join(root, dep))) return true;
  if (dep.startsWith("docs/")) {
    const rest = dep.slice("docs/".length);
    if (existsSync(join(root, "docs", "scaffolds", rest))) return true;
  }
  return false;
}

// Health check (b): agent-notes `deps:` paths within .claude/ and docs/ resolve.
// Catches broken wiring after a user edits or moves Summon-managed docs.
//
// Two deliberate exclusions keep this precise (agent-notes `deps` also names a
// command's *output* paths, which legitimately don't exist until the command runs):
//   - a trailing-slash dep is a directory write-target, not a file to verify;
//   - a missing file is only flagged when its immediate parent directory EXISTS. A
//     gap in a real directory (docs/adrs/typo.md) is a typo/deletion; an absent
//     directory at any depth (docs/research/* before /cloud-update runs, or a deeper
//     docs/a/b/ that doesn't exist) is treated as not-yet-generated, not a fault —
//     suppression keys on dirname(dep), so it applies to any depth, not just top-level.
function checkAgentNotesDeps(root: string): CheckResult {
  const evidence: EvidencePointer[] = [];
  const broken: string[] = [];
  const files = [
    ...walkMarkdown(join(root, ".claude")),
    ...walkMarkdown(join(root, "docs")),
  ];
  for (const abs of files) {
    const rel = relative(root, abs);
    for (const dep of extractDeps(readFileSync(abs, "utf8"))) {
      if (!isSummonOwned(dep)) continue;
      if (dep.endsWith("/")) continue; // directory write-target, not a file
      if (depResolves(root, dep)) continue;
      if (!existsSync(join(root, dirname(dep)))) continue; // absent category, not a fault
      broken.push(`${rel} -> ${dep}`);
      evidence.push({ kind: "file", ref: `${rel} (dep: ${dep})` });
    }
  }
  return broken.length === 0
    ? {
        id: "agentnotes-deps",
        verdict: "ok",
        detail: "agent-notes deps under .claude/ and docs/ all resolve",
        evidence: [],
        schemaVersion: DOCTOR_SCHEMA_VERSION,
      }
    : {
        id: "agentnotes-deps",
        verdict: "error",
        detail: `${broken.length} agent-notes dep(s) do not resolve: ${broken.join("; ")}`,
        evidence,
        schemaVersion: DOCTOR_SCHEMA_VERSION,
      };
}

// v1 health registry. Grows by observed need (ADR-0004 Vik YAGNI guard).
// NOT YET BUILT — command<->file existence (a): a backtick `/word` cannot be cleanly
// told apart from Claude Code built-ins (`/clear`) or the `/command` placeholder
// without an allowlist, so it would false-error in a healthy project. Deferred until
// that allowlist is designed; see ADR-0004 and the #30 follow-up.
export const HEALTH_CHECKS = [checkAgentNotesDeps];

export function runHealth(root: string): CheckResult[] {
  return HEALTH_CHECKS.map((check) => check(root));
}

export function exitCodeFor(results: CheckResult[]): number {
  return results.some((r) => r.verdict === "error") ? 1 : 0;
}

export function formatResults(results: CheckResult[]): string {
  const icon = (v: Verdict) => (v === "ok" ? "✓" : v === "degraded" ? "!" : "✗");
  const healthy = results.every((r) => r.verdict === "ok");
  const header = healthy
    ? `summon doctor: healthy — ${results.length} check(s) passed`
    : `summon doctor: problems found`;
  const lines = results.map((r) => `  ${icon(r.verdict)} ${r.id}: ${r.detail}`);
  return [header, ...lines].join("\n");
}
