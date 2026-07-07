// agent-notes: { ctx: "summon doctor — portable health registry, run on-demand against cwd (ADR-0004)", deps: ["src/index.ts", "docs/adrs/meta/0004-summon-doctor.md"], state: active, last: "sato@2026-07-07" }
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

// Claude Code built-in slash commands that legitimately appear in Summon docs but
// are NOT Summon command files. Not exhaustive by design: an un-listed built-in
// surfaces as a non-blocking `degraded` note, never a false CI failure — which is why
// this set can stay small and need not track every Claude Code release.
const CLAUDE_BUILTINS = new Set([
  "clear", "compact", "help", "init", "cost", "model", "config", "memory",
  "agents", "mcp", "status", "doctor", "review", "resume", "login", "logout",
]);
// `/command` is used generically in prose as a placeholder, not a real command.
const COMMAND_PLACEHOLDERS = new Set(["command"]);

// Health check (a): backtick `/command` tokens in the operative command WIRING
// (CLAUDE.md + .claude/ — the runtime instructions and agent/command definitions)
// should resolve to a `.claude/commands/*.md` file. A token that resolves to no file
// and is not a known Claude built-in or placeholder is reported as `degraded`
// (non-blocking) — it MIGHT be a deleted/renamed Summon command (broken wiring) or
// simply a built-in we haven't listed; we cannot tell, so we warn rather than block.
//
// Scope is deliberately the wiring, NOT docs/ prose: ADRs, methodology, and review
// docs legitimately quote `/command` tokens as *examples* (this check's own review doc
// mentions `/ghost`, `/add-dir`, ...), which are references-to-discuss, not wiring. Only
// backtick-delimited tokens are considered; prose mentions are advisory and ignored.
function checkCommandRefs(root: string): CheckResult {
  const commandsDir = join(root, ".claude", "commands");
  const commandStems = new Set(
    existsSync(commandsDir)
      ? readdirSync(commandsDir)
          .filter((f) => f.endsWith(".md"))
          .map((f) => f.replace(/\.md$/, ""))
      : []
  );
  const docs = [
    ...(existsSync(join(root, "CLAUDE.md")) ? [join(root, "CLAUDE.md")] : []),
    ...walkMarkdown(join(root, ".claude")),
  ];
  const unresolved = new Map<string, string>(); // token -> first file it appeared in
  for (const abs of docs) {
    const rel = relative(root, abs);
    // Min 3 chars: every Summon command and Claude built-in is >=3 chars, while
    // 1-2 char backtick slash-tokens are regex flags (`/g`, `/gi`) or short paths,
    // not commands — excluding them keeps the check quiet on technical docs.
    // Known residual: a 3-char flag combo (`/gms`) would warn; rare in backticked
    // prose and only ever a non-blocking warning, so left as-is (YAGNI).
    for (const m of readFileSync(abs, "utf8").matchAll(/`\/([a-z][a-z0-9-]{2,})`/g)) {
      const name = m[1];
      if (
        commandStems.has(name) ||
        CLAUDE_BUILTINS.has(name) ||
        COMMAND_PLACEHOLDERS.has(name)
      )
        continue;
      if (!unresolved.has(name)) unresolved.set(name, rel);
    }
  }
  if (unresolved.size === 0) {
    return {
      id: "command-refs",
      verdict: "ok",
      detail: "backtick /command references resolve to command files or known built-ins",
      evidence: [],
      schemaVersion: DOCTOR_SCHEMA_VERSION,
    };
  }
  const items = [...unresolved].map(([name, file]) => `/${name} (${file})`);
  return {
    id: "command-refs",
    verdict: "degraded",
    detail: `${unresolved.size} backtick /command reference(s) resolve to no command file — verify they are Claude built-ins or fix broken wiring: ${items.join("; ")}`,
    evidence: [...unresolved].map(([name, file]) => ({
      kind: "file" as const,
      ref: `${file} (/${name})`,
    })),
    schemaVersion: DOCTOR_SCHEMA_VERSION,
  };
}

// Resolve the glossary, honoring the docs/scaffolds indirection (as depResolves
// does for deps): docs/glossary.md may live at docs/scaffolds/glossary.md until a
// scaffold command moves it into place. Returns the resolved absolute path, or null.
function resolveGlossary(root: string): string | null {
  const primary = join(root, "docs", "glossary.md");
  if (existsSync(primary)) return primary;
  const scaffolded = join(root, "docs", "scaffolds", "glossary.md");
  if (existsSync(scaffolded)) return scaffolded;
  return null;
}

// Parse `**Term**:` headings at line granularity (ADR-0009 §4 glossary format). A
// heading is a line that, once trimmed, is a bold span immediately followed by a
// colon — so a bold word in prose without a colon (`**important**`) and an
// `_Avoid_:` synonym line are NOT headings. The dedup key is the term trimmed and
// lower-cased; `term` preserves first-seen casing for human-readable detail text.
function parseGlossaryTerms(text: string): { term: string; key: string }[] {
  const out: { term: string; key: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.trim().match(/^\*\*(.+?)\*\*\s*:/);
    if (!m) continue;
    const term = m[1].trim();
    out.push({ term, key: term.toLowerCase() });
  }
  return out;
}

// Health check (c): the ubiquitous-language glossary (ADR-0009). Locate it at
// docs/glossary.md (scaffolds fallback), read CLAUDE.md for a `docs/glossary.md`
// link, and gate on three conditions:
//   - error (blocking): a duplicate `**Term**:` heading — the deterministic
//     failure mode ADR-0009 §5 exists to catch (two definitions of one term);
//   - error (blocking): CLAUDE.md links docs/glossary.md but no glossary exists
//     (dangling wiring — a promised doc that isn't there);
//   - degraded (non-blocking): glossary present and clean but not linked from
//     CLAUDE.md (present-but-unwired — a warning, not a gate).
// Absent-and-unlinked is a clean skip, not a fault: a glossary is optional.
//
// This check is deliberately UNGUARDED — it runs in the user's downstream project
// with no IS_SUMMON_REPO/isSummonProject gate. That is the entire point (ADR-0009
// §5, answering Wei C2): the duplicate-term gate protects the *consumer's* domain
// language, so it must fire against their glossary, not only Summon's own repo.
export function checkGlossary(root: string): CheckResult {
  const id = "glossary";
  const glossaryPath = resolveGlossary(root);
  const claudePath = join(root, "CLAUDE.md");
  const claudeExists = existsSync(claudePath);
  const linked =
    claudeExists && readFileSync(claudePath, "utf8").includes("docs/glossary.md");

  // Absent glossary: dangling wiring is a fault; otherwise a clean skip.
  if (glossaryPath === null) {
    if (linked) {
      return {
        id,
        verdict: "error",
        detail:
          "CLAUDE.md links docs/glossary.md but no glossary file exists (dangling wiring)",
        evidence: [{ kind: "file", ref: "CLAUDE.md -> docs/glossary.md" }],
        schemaVersion: DOCTOR_SCHEMA_VERSION,
      };
    }
    return {
      id,
      verdict: "ok",
      detail: "no glossary present and nothing links to one",
      evidence: [],
      schemaVersion: DOCTOR_SCHEMA_VERSION,
    };
  }

  const rel = relative(root, glossaryPath);
  const terms = parseGlossaryTerms(readFileSync(glossaryPath, "utf8"));
  const seen = new Map<string, string>(); // dedup key -> first-seen term casing
  for (const { term, key } of terms) {
    if (seen.has(key)) {
      const first = seen.get(key)!;
      return {
        id,
        verdict: "error",
        detail: `glossary defines the term "${first}" more than once — merge the duplicate headings`,
        evidence: [{ kind: "file", ref: `${rel} (duplicate term: ${first})` }],
        schemaVersion: DOCTOR_SCHEMA_VERSION,
      };
    }
    seen.set(key, term);
  }

  // Present and clean but unwired from CLAUDE.md: a warning, not a gate.
  if (claudeExists && !linked) {
    return {
      id,
      verdict: "degraded",
      detail: `glossary present at ${rel} but not linked from CLAUDE.md — add a docs/glossary.md link so the team finds it`,
      evidence: [{ kind: "file", ref: rel }],
      schemaVersion: DOCTOR_SCHEMA_VERSION,
    };
  }

  return {
    id,
    verdict: "ok",
    detail: `glossary present at ${rel} with ${seen.size} unique term heading(s)`,
    evidence: [],
    schemaVersion: DOCTOR_SCHEMA_VERSION,
  };
}

// v1 health registry. Grows by observed need (ADR-0004 Vik YAGNI guard).
export const HEALTH_CHECKS = [checkAgentNotesDeps, checkCommandRefs, checkGlossary];

export function runHealth(root: string): CheckResult[] {
  return HEALTH_CHECKS.map((check) => check(root));
}

export function exitCodeFor(results: CheckResult[]): number {
  return results.some((r) => r.verdict === "error") ? 1 : 0;
}

export function formatResults(results: CheckResult[]): string {
  const icon = (v: Verdict) => (v === "ok" ? "✓" : v === "degraded" ? "!" : "✗");
  const errors = results.filter((r) => r.verdict === "error").length;
  const warnings = results.filter((r) => r.verdict === "degraded").length;
  const ran = `${results.length} check(s) ran`;
  const header =
    errors > 0
      ? `summon doctor: problems found — ${ran}`
      : warnings > 0
        ? `summon doctor: healthy with ${warnings} warning(s) — ${ran}`
        : `summon doctor: healthy — ${results.length} check(s) passed`;
  const lines = results.map((r) => `  ${icon(r.verdict)} ${r.id}: ${r.detail}`);
  return [header, ...lines].join("\n");
}
