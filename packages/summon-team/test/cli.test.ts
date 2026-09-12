// agent-notes: { ctx: "integration tests for summon-team CLI", deps: ["dist/index.js", "src/index.ts", "src/manifest.ts", "../../scripts/team-log.mjs", "../../.gitignore"], state: active, last: "tara@2026-09-11", key: [".summon/manifest.json is the one install manifest (ADR-0006 #6): the scaffolder stamps manifestVersion 1, its own PKG.version, targets claude, the scaffold time, and source, Case A included, overwriting anything the template carried; a synthetic template with a stale manifest proves the overwrite", "the scaffold time is the one clock read a test tolerates, pinned to the exact [before, after] window around the spawn with no slack: a build-baked stamp fails", "source is the bare string local on --local: the file carries no path", "the manifest is in the first commit: git ls-files and ls-tree HEAD inside the project list it, which also pins that .gitignore's !.summon/manifest.json shipped", "shipped team-log.mjs --version is run inside the scaffolded project through run's bin option, cwd = project, no --root"] }

import { execFile, execFileSync } from "node:child_process";
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

/**
 * Spawn a node script and settle on its exit. `bin` defaults to the built CLI; a shipped script
 * inside a scaffolded project (team-log.mjs, check-canon.mjs) runs through the same helper.
 */
function run(
  args: string[],
  options: { cwd?: string; bin?: string } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      "node",
      [options.bin ?? CLI, ...args],
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
    // The installed version is .summon/manifest.json (ADR-0006 #6), not a canon rule:
    // the third pass's team/version.json and its rule #11 are gone.
    const cwd = makeTempDir();
    const result = await run(["--local", REPO_ROOT, "canon-check"], { cwd });
    expect(result.code).toBe(0);
    const projectDir = join(cwd, "canon-check");
    expect(existsSync(join(projectDir, "scripts", "check-canon.mjs"))).toBe(true);
    expect(existsSync(join(projectDir, ".summon", "manifest.json"))).toBe(true);
    expect(existsSync(join(projectDir, "team", "version.json"))).toBe(false);
    expect(existsSync(join(projectDir, "packages"))).toBe(false);

    const check = await run([], { cwd: projectDir, bin: join(projectDir, "scripts", "check-canon.mjs") });
    expect(check.code).toBe(0);
    expect(check.stdout + check.stderr).toContain("OK");
  }, 30_000);

  // --- .summon/manifest.json (work order first-run, fourth pass) ------------------------
  // team-layers.md § The version; ADR-0006 § Additional Decisions #6 (the schema); ADR-0015
  // supersedes 0006's clause that a Claude-only install writes none. Every scaffold writes the
  // one install manifest, Case A included, after the meta strip and before git init, so it lands
  // in the first commit. summonVersion is the CLI's build-baked version, scaffolded the moment of
  // the scaffold, source the template constant verbatim on the download path and the bare string
  // "local" on --local: a path is one machine's fact and would be committed into a stranger's
  // first commit. The download branch's source is covered by buildManifest in manifest.test.ts.

  const MANIFEST = join(".summon", "manifest.json");

  /** Scaffold `name` from the template at `src`; the window is the exact span of the spawn. */
  async function scaffold(
    src: string,
    name: string
  ): Promise<{ projectDir: string; before: number; after: number }> {
    const cwd = makeTempDir();
    const before = Date.now();
    const result = await run(["--local", src, name], { cwd });
    const after = Date.now();
    expect(result.stderr + result.stdout).not.toContain("Could not initialize git");
    expect(result.code).toBe(0);
    return { projectDir: join(cwd, name), before, after };
  }

  /** A template with nothing but the two files the scaffolder resets: no team/, no .summon/. */
  function bareTemplate(): string {
    const src = makeTempDir();
    writeFileSync(join(src, "README-template.md"), "# [Your Project Name]");
    writeFileSync(join(src, "CLAUDE.md"), "**Project Name:** Summon");
    return src;
  }

  it("writes .summon/manifest.json into the scaffolded project: manifestVersion 1, the CLI's version, claude, the scaffold time, and source local", async () => {
    const { projectDir, before, after } = await scaffold(REPO_ROOT, "manifest-test");
    const manifestPath = join(projectDir, MANIFEST);
    expect(existsSync(manifestPath)).toBe(true);
    // The third pass's file is not written any more; the manifest is the one record.
    expect(existsSync(join(projectDir, "team", "version.json"))).toBe(false);

    const raw = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    expect(manifest.manifestVersion).toBe(1);
    expect(manifest.summonVersion).toBe(PKG.version);
    expect(manifest.targets).toStrictEqual(["claude"]);

    // The one legitimate clock read: the scaffolder stamps the moment. The expected value is the
    // exact window around this spawn, no slack: a version stamped at build time, or copied from
    // the template, falls outside it. The format is what Date#toISOString produces: it parses,
    // and parsing then printing gives the string back.
    expect(typeof manifest.scaffolded).toBe("string");
    const stamped = Date.parse(manifest.scaffolded);
    expect(Number.isNaN(stamped)).toBe(false);
    expect(new Date(stamped).toISOString()).toBe(manifest.scaffolded);
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(after);

    // The bare string, and no path anywhere in the file: not the template's, not the project's.
    expect(manifest.source).toBe("local");
    expect(raw).not.toContain(REPO_ROOT);
    expect(raw).not.toContain(projectDir);
  }, 30_000);

  it("overwrites the template's own .summon/manifest.json rather than copying it through", async () => {
    // A copy-through of this repo's tree cannot be told from a stamp by the version alone. A
    // synthetic template with a stale manifest, every field wrong and one extra key, is what
    // tells "stamped" apart from "copied": the result carries exactly the stamped fields.
    const src = bareTemplate();
    mkdirSync(join(src, ".summon"), { recursive: true });
    writeFileSync(
      join(src, MANIFEST),
      JSON.stringify({
        manifestVersion: 0,
        summonVersion: "0.0.0-template",
        targets: ["copilot"],
        scaffolded: "1999-01-01T00:00:00.000Z",
        source: "github:stale/template",
        addons: [{ name: "stale" }],
      })
    );

    const { projectDir } = await scaffold(src, "overwrite");
    const manifest = JSON.parse(readFileSync(join(projectDir, MANIFEST), "utf-8"));
    expect(manifest.scaffolded).not.toBe("1999-01-01T00:00:00.000Z");
    expect(manifest).toStrictEqual({
      manifestVersion: 1,
      summonVersion: PKG.version,
      targets: ["claude"],
      scaffolded: manifest.scaffolded,
      source: "local",
    });
  }, 30_000);

  it("writes .summon/manifest.json when the template has no .summon/ at all: Case A, the default install, records its version too", async () => {
    // ADR-0006 said a Claude-only install writes no manifest; ADR-0015 supersedes that clause.
    // An upgrade pass reads the manifest to learn which layers a project is on, and a template
    // with no .summon/ is exactly the project that needs saying so.
    const { projectDir } = await scaffold(bareTemplate(), "case-a");
    const manifestPath = join(projectDir, MANIFEST);
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest).toStrictEqual({
      manifestVersion: 1,
      summonVersion: PKG.version,
      targets: ["claude"],
      scaffolded: manifest.scaffolded,
      source: "local",
    });
    expect(existsSync(join(projectDir, "team", "version.json"))).toBe(false);
  }, 30_000);

  it("commits .summon/manifest.json in the scaffold's first commit", async () => {
    // Written before git init, and not ignored: the shipped .gitignore keeps .summon/* out of
    // the tree except the log and the manifest. ls-files pins the index, ls-tree HEAD pins the
    // commit, and the count pins that HEAD is the first one.
    const { projectDir } = await scaffold(REPO_ROOT, "first-commit");
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: projectDir, encoding: "utf-8" }).trim().split("\n");
    expect(git("ls-files")).toContain(".summon/manifest.json");
    expect(git("rev-list", "--count", "HEAD")).toStrictEqual(["1"]);
    expect(git("ls-tree", "-r", "--name-only", "HEAD")).toContain(".summon/manifest.json");
  }, 30_000);

  it("shipped team-log.mjs --version, run inside the scaffolded project with no --root, prints the CLI's version bare", async () => {
    // The scriptable form. Same entry point a user's project runs: the shipped script, from
    // the project's own root, with packages/ gone (the scaffold excludes it).
    const { projectDir } = await scaffold(REPO_ROOT, "log-version");
    expect(existsSync(join(projectDir, "scripts", "team-log.mjs"))).toBe(true);
    expect(existsSync(join(projectDir, "packages"))).toBe(false);

    const v = await run(["--version"], { cwd: projectDir, bin: join(projectDir, "scripts", "team-log.mjs") });
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
