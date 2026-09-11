// agent-notes: { ctx: "integration tests for summon-team CLI", deps: ["dist/index.js", "src/index.ts", "../../team/version.json", "../../scripts/team-log.mjs"], state: active, last: "tara@2026-09-11", key: ["team/version.json: the scaffolder stamps its own PKG.version, the scaffold time, and the source, overwriting the template copy; a synthetic template with a stale manifest is what proves the overwrite, since this repo's manifest already equals PKG.version", "the scaffold time is the one clock read a test tolerates, pinned to a window around the run", "shipped team-log.mjs --version is run inside the scaffolded project, cwd = project, no --root"] }

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
    // Rule #11 (team/version.json equals packages/summon-team/package.json) has no
    // packages/ to compare against here and must pass on the stamped manifest alone.
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "canon-check"], { cwd });
    expect(result.code).toBe(0);
    const projectDir = join(cwd, "canon-check");
    expect(existsSync(join(projectDir, "scripts", "check-canon.mjs"))).toBe(true);
    expect(existsSync(join(projectDir, "team", "version.json"))).toBe(true);
    expect(existsSync(join(projectDir, "packages"))).toBe(false);

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

  // --- team/version.json (work order first-run, third pass; team-layers.md § The version) ---
  // The scaffolder writes the manifest after the copy: summon-team is the CLI's own build-baked
  // version, scaffolded is the moment of the scaffold, source says where the template came from.

  function runIn(
    cwd: string,
    args: string[]
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((res) => {
      execFile("node", args, { cwd }, (err, stdout, stderr) =>
        res({ code: err?.code ?? 0, stdout: stdout.toString(), stderr: stderr.toString() })
      );
    });
  }

  it("writes team/version.json into the scaffolded project: the CLI's version, the scaffold time, and the local source", async () => {
    const cwd = makeTempDir();
    // This repo's own manifest is the template copy; its scaffolded is null (never scaffolded).
    // Read here, not at module load, so a broken checked-in manifest fails this named test.
    const template = JSON.parse(
      readFileSync(join(REPO_ROOT, "team", "version.json"), "utf-8")
    );
    expect(template.scaffolded).toBeNull();
    expect(template.source).toBeNull();

    const before = Date.now();
    const result = await run(["--local", REPO_ROOT, "version-test"], { cwd });
    expect(result.code).toBe(0);
    const manifestPath = join(cwd, "version-test", "team", "version.json");
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

    expect(manifest["summon-team"]).toBe(PKG.version);

    // The one legitimate clock read: the scaffolder stamps the moment. The expected value is a
    // window around this run, not a fixed instant; the format is ISO-8601 and it must parse.
    expect(manifest.scaffolded).not.toBeNull();
    expect(typeof manifest.scaffolded).toBe("string");
    expect(manifest.scaffolded).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/);
    const stamped = Date.parse(manifest.scaffolded);
    expect(Number.isNaN(stamped)).toBe(false);
    const fiveMinutes = 5 * 60_000;
    expect(stamped).toBeGreaterThanOrEqual(before - fiveMinutes);
    expect(stamped).toBeLessThanOrEqual(Date.now() + fiveMinutes);

    expect(manifest.source).toMatch(/^local:/);
    expect(resolve(manifest.source.slice("local:".length))).toBe(resolve(REPO_ROOT));
  }, 30_000);

  it("overwrites the template's own team/version.json rather than copying it through", async () => {
    // This repo's manifest carries the same version the CLI is built from, so a copy-through
    // would pass the version assertion above by accident. A synthetic template with a stale
    // manifest is what tells "stamped" apart from "copied".
    const cwd = makeTempDir();
    const src = makeTempDir();
    mkdirSync(join(src, "team"), { recursive: true });
    writeFileSync(
      join(src, "team", "version.json"),
      JSON.stringify({
        "summon-team": "0.0.0-template",
        scaffolded: "1999-01-01T00:00:00Z",
        source: "github:stale/template",
      })
    );
    writeFileSync(join(src, "README-template.md"), "# [Your Project Name]");
    writeFileSync(join(src, "CLAUDE.md"), "**Project Name:** Summon");

    const result = await run(["--local", src, "overwrite"], { cwd });
    expect(result.code).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(cwd, "overwrite", "team", "version.json"), "utf-8")
    );
    expect(manifest["summon-team"]).toBe(PKG.version);
    expect(manifest.scaffolded).not.toBe("1999-01-01T00:00:00Z");
    expect(manifest.source).toMatch(/^local:/);
    expect(manifest.source).not.toBe("github:stale/template");
  }, 30_000);

  it("writes team/version.json even when the template has no team/ directory", async () => {
    // Every project carries the manifest: an upgrade pass reads it to learn which version of
    // the layers a project is on, and a template that predates team/ is exactly the project
    // that needs saying so.
    const cwd = makeTempDir();
    const src = makeTempDir();
    writeFileSync(join(src, "README-template.md"), "# [Your Project Name]");
    writeFileSync(join(src, "CLAUDE.md"), "**Project Name:** Summon");

    const result = await run(["--local", src, "no-team-dir"], { cwd });
    expect(result.code).toBe(0);
    const manifestPath = join(cwd, "no-team-dir", "team", "version.json");
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest["summon-team"]).toBe(PKG.version);
    expect(typeof manifest.scaffolded).toBe("string");
    expect(manifest.source).toMatch(/^local:/);
  }, 30_000);

  it("shipped team-log.mjs --version, run inside the scaffolded project with no --root, prints the CLI's version bare", async () => {
    // The scriptable form. Same entry point a user's project runs: the shipped script, from
    // the project's own root, with packages/ gone (the scaffold excludes it).
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "log-version"], { cwd });
    expect(result.code).toBe(0);
    const projectDir = join(cwd, "log-version");
    expect(existsSync(join(projectDir, "scripts", "team-log.mjs"))).toBe(true);
    expect(existsSync(join(projectDir, "packages"))).toBe(false);

    const v = await runIn(projectDir, [join(projectDir, "scripts", "team-log.mjs"), "--version"]);
    expect(v.stderr).toBe("");
    expect(v.code).toBe(0);
    expect(v.stdout).toBe(`${PKG.version}\n`);
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
});
