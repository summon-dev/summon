// agent-notes: { ctx: "integration tests for summon-team CLI", deps: ["dist/index.js", "src/index.ts"], state: active, last: "tara@2026-08-08" }

import { execFile } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI = resolve(__dirname, "..", "dist", "index.js");
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const PKG = JSON.parse(
  readFileSync(resolve(__dirname, "..", "package.json"), "utf-8")
);

function run(
  args: string[],
  options: { cwd?: string } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      "node",
      [CLI, ...args],
      { cwd: options.cwd, env: { ...process.env, NO_COLOR: "1" } },
      (error, stdout, stderr) => {
        resolve({
          code: error?.code ?? 0,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      }
    );
  });
}

describe("summon-team CLI", () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "summon-test-"));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("--version prints version and exits 0", async () => {
    const result = await run(["--version"]);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe(`summon-team v${PKG.version}`);
  });

  it("--help prints usage and exits 0", async () => {
    const result = await run(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
  });

  it("rejects project name with leading dot (invalid first char)", async () => {
    // The CLI arg parser treats anything starting with "-" as a flag, not a
    // positional arg, so a literal "-bad-name" can't be tested via subprocess.
    // Instead we test a name that starts with "." which also fails the regex
    // (must start with [a-zA-Z0-9]) and IS picked up as a positional arg.
    const cwd = makeTempDir();
    const result = await run([".bad-name"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/letters|numbers|hyphens|underscores|valid/i);
  });

  it("rejects project name with special characters", async () => {
    const cwd = makeTempDir();
    const result = await run(["bad name!"], { cwd });
    expect(result.code).not.toBe(0);
  });

  it("rejects bare `.` with helpful error pointing at `add` verb", async () => {
    const cwd = makeTempDir();
    const result = await run(["."], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("summon-team add");
    expect(output).toContain("existing project");
    // Must not fall through to the generic regex-validation error path
    expect(output).not.toMatch(/letters, numbers, hyphens, or underscores/i);
  });

  it("--local without path exits non-zero", async () => {
    const cwd = makeTempDir();
    const result = await run(["--local"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("--local requires a path");
  });

  it("--local with nonexistent path exits non-zero", async () => {
    const cwd = makeTempDir();
    const result = await run(
      ["--local", "/tmp/nonexistent-summon-test", "test-proj"],
      { cwd }
    );
    expect(result.code).not.toBe(0);
  });

  it("scaffolds a project from local repo", async () => {
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "test-project"], { cwd });

    expect(result.code).toBe(0);

    const projectDir = join(cwd, "test-project");
    expect(existsSync(projectDir)).toBe(true);

    // Expected files and dirs exist
    expect(existsSync(join(projectDir, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(projectDir, ".claude", "agents"))).toBe(true);
    expect(existsSync(join(projectDir, "docs"))).toBe(true);

    // Excluded dirs do NOT exist
    expect(existsSync(join(projectDir, "packages"))).toBe(false);
    expect(existsSync(join(projectDir, "site"))).toBe(false);
    expect(existsSync(join(projectDir, "node_modules"))).toBe(false);

    // Excluded files do NOT exist
    expect(existsSync(join(projectDir, "pnpm-workspace.yaml"))).toBe(false);
    expect(existsSync(join(projectDir, "pnpm-lock.yaml"))).toBe(false);
    expect(existsSync(join(projectDir, "package.json"))).toBe(false);

    // CLAUDE.md was reset to template placeholders
    const claudeMd = readFileSync(join(projectDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("[Your Project Name]");

    // git init ran
    expect(existsSync(join(projectDir, ".git"))).toBe(true);
  }, 30_000);

  it("excludes the meta zones (docs/history, docs/adrs/meta) but keeps canon", async () => {
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "history-test"], { cwd });

    expect(result.code).toBe(0);
    const projectDir = join(cwd, "history-test");

    // The two meta zones (ADR-0007) — Summon's development exhaust — do not ship
    expect(existsSync(join(projectDir, "docs", "history"))).toBe(false);
    expect(existsSync(join(projectDir, "docs", "adrs", "meta"))).toBe(false);

    // Canon docs the user DOES inherit are still present
    expect(existsSync(join(projectDir, "docs", "methodology"))).toBe(true);
    expect(existsSync(join(projectDir, "docs", "adrs", "template.md"))).toBe(true);
    // Canon ADRs (0001-0003) ship from docs/adrs/; meta ADRs (0004+) do not
    expect(
      existsSync(join(projectDir, "docs", "adrs", "0003-project-risk-tiers.md"))
    ).toBe(true);
    expect(
      existsSync(join(projectDir, "docs", "adrs", "0004-summon-doctor.md"))
    ).toBe(false);
  }, 30_000);

  it("ships the project README stub, not Summon's marketing README", async () => {
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "readme-test"], { cwd });

    expect(result.code).toBe(0);
    const projectDir = join(cwd, "readme-test");

    // A README exists, but it's the project stub — not the marketing sales page
    const readme = readFileSync(join(projectDir, "README.md"), "utf-8");
    expect(readme).toContain("[Your Project Name]");
    expect(readme).toContain("Summon");
    // The marketing hero line must not leak into the user's project
    expect(readme).not.toContain("code you have to answer for later");

    // The template file itself is consumed — it does not linger in the project
    expect(existsSync(join(projectDir, "README-template.md"))).toBe(false);
  }, 30_000);

  it("does not ship the session handoff snapshot", async () => {
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "handoff-test"], { cwd });

    expect(result.code).toBe(0);
    const projectDir = join(cwd, "handoff-test");

    // .claude/handoff.md is per-session meta scratch (ADR-0007 §7) — never shipped
    expect(existsSync(join(projectDir, ".claude", "handoff.md"))).toBe(false);
  }, 30_000);

  it("strips every meta path from a template that contains them", async () => {
    // The REPO_ROOT tests assert the current tree ships clean, but they can't prove
    // the *exclusion* fires — the meta files were already moved out. Build a synthetic
    // template that DOES contain a file in each meta path (including a regenerated
    // handoff.md, which the --local copy would otherwise pick up since cpSync ignores
    // .gitignore), then assert the scaffold strips them all and keeps canon.
    const cwd = makeTempDir();
    const src = makeTempDir();
    const metaPaths = [
      "docs/history",
      "docs/adrs/meta",
      "docs/code-reviews",
      "docs/tracking",
      "docs/sprints",
    ];

    mkdirSync(join(src, ".claude"), { recursive: true });
    writeFileSync(join(src, ".claude", "handoff.md"), "# stale session snapshot");
    writeFileSync(join(src, ".claude", "keep.md"), "canon agent file");
    for (const p of metaPaths) {
      mkdirSync(join(src, ...p.split("/")), { recursive: true });
      writeFileSync(join(src, ...p.split("/"), "x.md"), `meta under ${p}`);
    }
    // Repo infrastructure meta (Summon's CI, governance, gitignored scratch)
    mkdirSync(join(src, ".github", "workflows"), { recursive: true });
    writeFileSync(join(src, ".github", "workflows", "ci.yml"), "name: CI");
    mkdirSync(join(src, ".playwright-mcp"), { recursive: true });
    writeFileSync(join(src, ".playwright-mcp", "trace.zip"), "scratch");
    for (const f of ["CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "LICENSE"]) {
      writeFileSync(join(src, f), `Summon's ${f}`);
    }
    // Canon that must survive: methodology + the shipped scripts (fitness fn + debt harvest)
    mkdirSync(join(src, "docs", "methodology"), { recursive: true });
    writeFileSync(join(src, "docs", "methodology", "phases.md"), "canon");
    mkdirSync(join(src, "scripts"), { recursive: true });
    writeFileSync(join(src, "scripts", "check-canon.mjs"), "// fitness fn");
    writeFileSync(join(src, "scripts", "harvest-debt.mjs"), "// debt harvest");
    writeFileSync(join(src, "README.md"), "code you have to answer for later");
    writeFileSync(
      join(src, "README-template.md"),
      "# [Your Project Name]\nBuilt with Summon"
    );
    writeFileSync(join(src, "CLAUDE.md"), "**Project Name:** Summon");

    const result = await run(["--local", src, "excl"], { cwd });
    expect(result.code).toBe(0);
    const out = join(cwd, "excl");

    // Every meta path (and the regenerated handoff) is stripped
    for (const p of metaPaths) {
      expect(existsSync(join(out, ...p.split("/")))).toBe(false);
    }
    expect(existsSync(join(out, ".claude", "handoff.md"))).toBe(false);
    // Repo-infrastructure meta is stripped
    expect(existsSync(join(out, ".github"))).toBe(false);
    expect(existsSync(join(out, ".playwright-mcp"))).toBe(false);
    for (const f of ["CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "LICENSE"]) {
      expect(existsSync(join(out, f))).toBe(false);
    }

    // Canon survives — including the two shipped scripts
    expect(existsSync(join(out, ".claude", "keep.md"))).toBe(true);
    expect(existsSync(join(out, "docs", "methodology", "phases.md"))).toBe(true);
    expect(existsSync(join(out, "scripts", "check-canon.mjs"))).toBe(true);
    expect(existsSync(join(out, "scripts", "harvest-debt.mjs"))).toBe(true);

    // Marketing README is gone even though it was present; the stub took its place
    const readme = readFileSync(join(out, "README.md"), "utf-8");
    expect(readme).toContain("[Your Project Name]");
    expect(readme).not.toContain("code you have to answer for later");
    expect(existsSync(join(out, "README-template.md"))).toBe(false);
  }, 30_000);

  it("shipped check-canon.mjs passes in a scaffolded (canon-only) project", async () => {
    // check-canon.mjs ships (it's the exemplar fitness function). Its Summon-repo-only
    // checks (#7 canon->meta boundary, #8 ADR numbering) must self-skip when there's no
    // docs/adrs/meta — otherwise the deliberate 0004-0007 numbering gap (those ADRs are
    // meta and excluded) would make a fresh user's very first check:canon run red.
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "canon-check"], { cwd });
    expect(result.code).toBe(0);
    const projectDir = join(cwd, "canon-check");
    expect(existsSync(join(projectDir, "scripts", "check-canon.mjs"))).toBe(true);

    const check = await new Promise<{ code: number; out: string }>((res) => {
      execFile(
        "node",
        [join(projectDir, "scripts", "check-canon.mjs")],
        { cwd: projectDir },
        (err, stdout, stderr) =>
          res({ code: err?.code ?? 0, out: stdout.toString() + stderr.toString() })
      );
    });
    expect(check.code).toBe(0);
    expect(check.out).toContain("OK");
  }, 30_000);

  it("rejects when target directory already exists and is non-empty", async () => {
    const cwd = makeTempDir();
    const projectName = "existing-project";
    const existingDir = join(cwd, projectName);
    mkdirSync(existingDir);
    writeFileSync(join(existingDir, "file.txt"), "occupying the directory");

    const result = await run([projectName], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("already exists");
  });

  // --- --ref flag (issue #98) ---------------------------------------------
  // Every case below must fail before any network call: the CLI is exercised
  // with either a malformed flag, an invalid ref, or a target directory that
  // is already occupied, all of which exit before downloadTemplate runs.

  it("--ref without a value exits non-zero", async () => {
    const cwd = makeTempDir();
    const result = await run(["--ref"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("--ref requires");
  });

  it("--ref does not swallow the flag that follows it", async () => {
    // --yes is consumed downstream by the add-on phase, not by main()'s early
    // branches, so it makes a clean probe: if --ref eats it as a ref value the
    // run proceeds instead of reporting the missing value. The target dir is
    // pre-occupied so that a swallowed flag fails on "already exists" rather
    // than reaching the network.
    const cwd = makeTempDir();
    const occupied = join(cwd, "proj");
    mkdirSync(occupied);
    writeFileSync(join(occupied, "file.txt"), "occupying the directory");

    const result = await run(["--ref", "--yes", "proj"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("--ref requires");
  });

  it("--help still wins when --ref is missing its value", async () => {
    // Deliberate, not a bug: --local behaves the same way (the --help
    // short-circuit sits above every flag's arity check), and a global --help
    // that an unrelated typo can defeat is worse than an unreported typo.
    // Do not "fix" this into a non-zero exit — see the anti-swallow test above,
    // which is what actually guards --ref from eating the next flag.
    const result = await run(["--ref", "--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
  });

  it("does not mistake the ref value for the project name when the flag comes first", async () => {
    // The ref value sits at the positional slot the name parser scans. If it is
    // read as the project name, the run fails on name validation ("feat/x" has a
    // slash) instead of on the occupied directory — so the two outcomes are
    // distinguishable without a network call either way.
    const cwd = makeTempDir();
    const occupied = join(cwd, "proj-name");
    mkdirSync(occupied);
    writeFileSync(join(occupied, "file.txt"), "occupying the directory");

    const result = await run(["--ref", "feat/x", "proj-name"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("proj-name");
    expect(output).toContain("already exists");
    expect(output).not.toMatch(/letters, numbers, hyphens, or underscores/i);
  });

  it("reads the project name when it comes before --ref", async () => {
    const cwd = makeTempDir();
    const occupied = join(cwd, "proj-name");
    mkdirSync(occupied);
    writeFileSync(join(occupied, "file.txt"), "occupying the directory");

    const result = await run(["proj-name", "--ref", "feat/x"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("proj-name");
    expect(output).toContain("already exists");
    expect(output).not.toMatch(/letters, numbers, hyphens, or underscores/i);
  });

  it("rejects a ref containing a path traversal sequence", async () => {
    const cwd = makeTempDir();
    const result = await run(["--ref", "../../etc", "trav-proj"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/ref/i);
    expect(output).toContain("../../etc");
    // The rejection is about the ref, not connectivity — and it happens before
    // any download, so no project directory is left behind.
    expect(output).not.toMatch(/network/i);
    expect(existsSync(join(cwd, "trav-proj"))).toBe(false);
  });

  it("rejects a ref containing a space", async () => {
    const cwd = makeTempDir();
    const result = await run(["--ref", "feat/my branch", "space-proj"], { cwd });
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/ref/i);
    expect(existsSync(join(cwd, "space-proj"))).toBe(false);
  });

  it("rejects --ref combined with --local, which has no git ref", async () => {
    const cwd = makeTempDir();
    const result = await run(
      ["--local", REPO_ROOT, "--ref", "main", "combo-proj"],
      { cwd }
    );
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain("--ref");
    expect(output).toContain("--local");
    expect(output).toMatch(/cannot|can't|not.*together/i);
    expect(existsSync(join(cwd, "combo-proj"))).toBe(false);
  }, 30_000);

  it("--help documents the --ref flag", async () => {
    const result = await run(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("--ref");
  });
});
