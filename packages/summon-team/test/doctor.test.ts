// agent-notes: { ctx: "unit + integration tests for summon-team doctor health registry", deps: ["src/doctor.ts", "src/index.ts"], state: active, last: "claude@2026-07-07" }

import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  exitCodeFor,
  formatResults,
  isSummonProject,
  runHealth,
  type CheckResult,
} from "../src/doctor.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI = resolve(__dirname, "..", "dist", "index.js");

// ---- fixture helpers -------------------------------------------------------

const tempDirs: string[] = [];

function makeProject(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "summon-doctor-"));
  tempDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return dir;
}

const notes = (deps: string[]) =>
  `<!-- agent-notes: { ctx: "x", deps: [${deps.join(", ")}], state: active, last: "t@2026-06-24" } -->\n# doc\n`;

afterEach(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
  tempDirs.length = 0;
});

// ---- unit: health registry -------------------------------------------------

describe("doctor health registry", () => {
  it("passes a well-wired project (all deps resolve)", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      ".claude/agents/foo.md": notes(["CLAUDE.md", "docs/bar.md"]),
      "docs/bar.md": "# bar\n",
    });
    const results = runHealth(root);
    expect(results.every((r) => r.verdict === "ok")).toBe(true);
    expect(exitCodeFor(results)).toBe(0);
  });

  it("flags a missing dep when its directory exists (typo/deletion in a real category)", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      "docs/present.md": "# present\n", // docs/ exists, so a gap there is real
      ".claude/agents/foo.md": notes(["docs/missing.md"]),
    });
    const results = runHealth(root);
    const depCheck = results.find((r) => r.id === "agentnotes-deps");
    expect(depCheck?.verdict).toBe("error");
    expect(depCheck?.detail).toContain("docs/missing.md");
    expect(depCheck?.evidence.some((e) => e.ref.includes("foo.md"))).toBe(true);
    expect(exitCodeFor(results)).toBe(1);
  });

  it("ignores a dep whose whole directory is absent (not-yet-generated command output)", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      // /cloud-update writes docs/research/* on demand; the dir doesn't exist yet
      ".claude/commands/gen.md": notes(["docs/research/aws-landscape.md"]),
    });
    expect(exitCodeFor(runHealth(root))).toBe(0);
  });

  it("ignores a trailing-slash directory dep (a write-target, not a file)", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      ".claude/agents/foo.md": notes(["docs/whatsit/"]),
    });
    expect(exitCodeFor(runHealth(root))).toBe(0);
  });

  it("allows the docs/scaffolds indirection (dep at docs/x lives at docs/scaffolds/x)", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      ".claude/agents/foo.md": notes(["docs/code-map.md"]),
      "docs/scaffolds/code-map.md": "# code map\n",
    });
    const results = runHealth(root);
    expect(exitCodeFor(results)).toBe(0);
  });

  it("ignores deps outside .claude/ and docs/ (user app code is out of scope)", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      ".claude/agents/foo.md": notes(["src/index.ts", "package.json"]),
    });
    // src/index.ts and package.json do NOT exist, but are out of the Summon-owned
    // surface, so health must not flag them.
    const results = runHealth(root);
    expect(exitCodeFor(results)).toBe(0);
  });

  it("reads deps from the leading agent-notes, not a later fenced example block", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      "docs/present.md": "# present\n", // docs/ exists, so a real missing dep WOULD flag
      ".claude/agents/foo.md":
        `<!-- agent-notes: { ctx: "real", deps: [docs/present.md], state: active, last: "t@x" } -->\n` +
        "# doc\n\nExample of the format:\n\n```\nagent-notes: { deps: [docs/example-only.md] }\n```\n",
    });
    // the leading agent-notes dep resolves; the example block's dep must be ignored
    expect(exitCodeFor(runHealth(root))).toBe(0);
  });

  it("treats a degraded verdict as non-blocking (exit 0) with a warning icon", () => {
    const degraded: CheckResult[] = [
      {
        id: "x",
        verdict: "degraded",
        detail: "heads up",
        evidence: [],
        schemaVersion: 1,
      },
    ];
    expect(exitCodeFor(degraded)).toBe(0);
    expect(formatResults(degraded)).toContain("!");
  });

  it("isSummonProject is false without a .claude/ directory", () => {
    const root = makeProject({ "README.md": "not summon\n" });
    expect(isSummonProject(root)).toBe(false);
  });

  it("isSummonProject is true with a .claude/ directory", () => {
    const root = makeProject({ ".claude/agents/foo.md": notes([]) });
    expect(isSummonProject(root)).toBe(true);
  });
});

// ---- unit: command-refs health check (a) -----------------------------------

describe("doctor command-refs health check", () => {
  it("passes when fenced /command refs resolve or are known built-ins/placeholder", () => {
    const root = makeProject({
      "CLAUDE.md":
        "Run `/kickoff`, then `/clear` the screen. A `/command` drives each phase.\n",
      ".claude/commands/kickoff.md": notes([]),
    });
    const c = runHealth(root).find((r) => r.id === "command-refs");
    expect(c?.verdict).toBe("ok");
    expect(exitCodeFor(runHealth(root))).toBe(0);
  });

  it("warns (degraded, non-blocking) on a fenced /command with no command file", () => {
    const root = makeProject({
      "CLAUDE.md": "Run `/ghost` to summon nothing.\n",
      ".claude/commands/kickoff.md": notes([]),
    });
    const results = runHealth(root);
    const c = results.find((r) => r.id === "command-refs");
    expect(c?.verdict).toBe("degraded");
    expect(c?.detail).toContain("/ghost");
    expect(c?.evidence[0]).toMatchObject({ kind: "file" });
    expect(c?.evidence[0].ref).toContain("/ghost");
    expect(exitCodeFor(results)).toBe(0); // a warning, not a gate failure
  });

  it("ignores 1-2 char backtick slash-tokens (regex flags like /g, /gi)", () => {
    const root = makeProject({
      "CLAUDE.md": "The matcher uses `/g` and `/gi`, not `/m`.\n",
      ".claude/commands/kickoff.md": notes([]),
    });
    const c = runHealth(root).find((r) => r.id === "command-refs");
    expect(c?.verdict).toBe("ok");
  });

  it("scans only the wiring (CLAUDE.md + .claude/), not docs/ prose examples", () => {
    const root = makeProject({
      "CLAUDE.md": "Run `/kickoff`.\n",
      ".claude/commands/kickoff.md": notes([]),
      // a review/ADR doc quoting `/ghost` as an example must NOT warn
      "docs/code-reviews/r.md": "We considered `/ghost` and `/add-dir` here.\n",
    });
    const c = runHealth(root).find((r) => r.id === "command-refs");
    expect(c?.verdict).toBe("ok");
  });

  it("ignores non-fenced (prose) /command mentions", () => {
    const root = makeProject({
      "CLAUDE.md": "The /ghost workflow is conceptual, not a real command.\n",
      ".claude/commands/kickoff.md": notes([]),
    });
    const c = runHealth(root).find((r) => r.id === "command-refs");
    expect(c?.verdict).toBe("ok");
  });
});

// ---- unit: glossary health check (ADR-0009 §5) -----------------------------

// A realistic §4-format glossary body: `**Term**:` headings, each followed by a
// one-line definition and an `_Avoid_:` synonym list. Kept close to the ADR's
// worked example so the parser is exercised against the shape it will really see.
const GLOSSARY_OK = `# Glossary

**Order**:
A customer's request to purchase one or more items, priced at time of placement.
_Avoid_: purchase, transaction, cart

**Invoice**:
A request for payment issued after an Order is fulfilled.
_Avoid_: bill, receipt
`;

// CLAUDE.md that DOES wire the glossary into the doc index (the string the check
// scans for). Contains no backtick /command tokens, so command-refs stays ok.
const CLAUDE_LINKED =
  "# project\n\n| Doc | Purpose |\n|-----|---------|\n| docs/glossary.md | domain terms |\n";
// CLAUDE.md that exists but does NOT mention docs/glossary.md (present-but-unwired).
const CLAUDE_UNLINKED = "# project\n\nNo doc index here.\n";

const glossaryResult = (root: string) =>
  runHealth(root).find((r) => r.id === "glossary");

describe("doctor glossary health check", () => {
  it("passes a present glossary with unique headings that is linked from CLAUDE.md", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_LINKED,
      "docs/glossary.md": GLOSSARY_OK,
    });
    const results = runHealth(root);
    const g = results.find((r) => r.id === "glossary");
    expect(g?.verdict).toBe("ok");
    expect(exitCodeFor(results)).toBe(0);
  });

  it("errors and blocks when a **Term**: heading is duplicated (names the term)", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_LINKED,
      "docs/glossary.md":
        `# Glossary\n\n` +
        `**Order**:\nA customer's request to purchase items.\n_Avoid_: cart\n\n` +
        `**Invoice**:\nA request for payment.\n_Avoid_: bill\n\n` +
        `**Order**:\nA duplicated heading — the deterministic failure mode.\n_Avoid_: purchase\n`,
    });
    const results = runHealth(root);
    const g = results.find((r) => r.id === "glossary");
    expect(g?.verdict).toBe("error");
    expect(g?.detail).toContain("Order");
    expect(g?.evidence.some((e) => e.ref.includes("glossary.md"))).toBe(true);
    expect(exitCodeFor(results)).toBe(1);
  });

  it("detects a duplicate heading case-insensitively (**Order**: vs **order**:)", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_LINKED,
      "docs/glossary.md":
        `# Glossary\n\n` +
        `**Order**:\nA customer's request to purchase items.\n_Avoid_: cart\n\n` +
        `**order**:\nSame term, different case — must collide.\n_Avoid_: purchase\n`,
    });
    const g = glossaryResult(root);
    expect(g?.verdict).toBe("error");
    expect(exitCodeFor(runHealth(root))).toBe(1);
  });

  it("detects a duplicate heading across surrounding whitespace (** Order **: vs **Order**:)", () => {
    // Pins the parser's trim() normalization (Tara review thin-spot): a padded
    // heading must fold to the same dedup key, so a refactor dropping trim() fails here.
    const root = makeProject({
      "CLAUDE.md": CLAUDE_LINKED,
      "docs/glossary.md":
        `# Glossary\n\n` +
        `**Order**:\nA customer's request to purchase items.\n_Avoid_: cart\n\n` +
        `** Order **:\nPadded heading — must collide with the unpadded one.\n_Avoid_: purchase\n`,
    });
    const g = glossaryResult(root);
    expect(g?.verdict).toBe("error");
    expect(exitCodeFor(runHealth(root))).toBe(1);
  });

  it("degrades (non-blocking) when the glossary is present but not linked from CLAUDE.md", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_UNLINKED,
      "docs/glossary.md": GLOSSARY_OK,
    });
    const results = runHealth(root);
    const g = results.find((r) => r.id === "glossary");
    expect(g?.verdict).toBe("degraded");
    expect(g?.detail).toMatch(/link/i);
    expect(exitCodeFor(results)).toBe(0); // present-but-unwired is a warning, not a gate
  });

  it("errors and blocks when CLAUDE.md links a glossary that is absent (dangling wiring)", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_LINKED, // points at docs/glossary.md ...
      // ... but no glossary file exists anywhere
      "docs/other.md": "# unrelated\n",
    });
    const results = runHealth(root);
    const g = results.find((r) => r.id === "glossary");
    expect(g?.verdict).toBe("error");
    expect(exitCodeFor(results)).toBe(1);
  });

  it("passes cleanly when no glossary exists and nothing links to one (not-a-fault)", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_UNLINKED, // no glossary, no link to one
      "docs/other.md": "# unrelated\n",
    });
    const results = runHealth(root);
    const g = results.find((r) => r.id === "glossary");
    expect(g?.verdict).toBe("ok");
    expect(exitCodeFor(results)).toBe(0);
  });

  it("resolves the glossary via the docs/scaffolds indirection", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_LINKED, // links docs/glossary.md
      "docs/scaffolds/glossary.md": GLOSSARY_OK, // but it lives under scaffolds/ pre-move
    });
    const results = runHealth(root);
    const g = results.find((r) => r.id === "glossary");
    expect(g?.verdict).toBe("ok");
    expect(exitCodeFor(results)).toBe(0);
  });

  it("does not treat bold-without-colon prose or _Avoid_: lines as term headings", () => {
    const root = makeProject({
      "CLAUDE.md": CLAUDE_LINKED,
      "docs/glossary.md":
        `# Glossary\n\n` +
        `**Order**:\nA customer's request to purchase items.\n_Avoid_: purchase, cart\n\n` +
        // bold word reusing the term but WITHOUT a colon — not a heading, must not
        // register as a second "Order" and trip the duplicate check:
        `When you place an **Order** you receive confirmation — this is **important** context.\n\n` +
        `**Invoice**:\nA request for payment issued after an Order is fulfilled.\n_Avoid_: bill\n`,
    });
    const results = runHealth(root);
    const g = results.find((r) => r.id === "glossary");
    expect(g?.verdict).toBe("ok"); // exactly two unique headings: Order, Invoice
    expect(exitCodeFor(results)).toBe(0);
  });
});

// ---- integration: CLI dispatch (requires `pnpm build`) ---------------------

function run(
  args: string[],
  cwd?: string
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((res) => {
    execFile(
      "node",
      [CLI, ...args],
      { cwd, env: { ...process.env, NO_COLOR: "1" } },
      (error, stdout, stderr) =>
        res({
          code: (error as { code?: number } | null)?.code ?? 0,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        })
    );
  });
}

describe("doctor CLI dispatch", () => {
  it("exits 0 and writes nothing on a healthy project", async () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      ".claude/agents/foo.md": notes(["CLAUDE.md"]),
    });
    const result = await run(["doctor"], root);
    expect(result.code).toBe(0);
    expect(result.stdout.toLowerCase()).toContain("healthy");
  });

  it("exits non-zero on a broken project and names the problem", async () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      "docs/present.md": "# present\n",
      ".claude/agents/foo.md": notes(["docs/missing.md"]),
    });
    const result = await run(["doctor"], root);
    expect(result.code).not.toBe(0);
    expect(result.stdout + result.stderr).toContain("docs/missing.md");
  });

  it("exits non-zero with a clear message when cwd is not a Summon project", async () => {
    const root = makeProject({ "README.md": "not summon\n" });
    const result = await run(["doctor"], root);
    expect(result.code).not.toBe(0);
    expect((result.stdout + result.stderr).toLowerCase()).toMatch(
      /no summon|\.claude/
    );
  });
});
