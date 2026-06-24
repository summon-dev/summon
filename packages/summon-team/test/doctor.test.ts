// agent-notes: { ctx: "unit + integration tests for summon-team doctor health registry", deps: ["src/doctor.ts", "src/index.ts"], state: active, last: "tara@2026-06-24" }

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
