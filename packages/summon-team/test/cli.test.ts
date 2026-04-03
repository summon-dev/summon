// agent-notes: { ctx: "integration tests for summon-team CLI", deps: ["dist/index.js", "src/index.ts"], state: active, last: "sato@2026-04-03" }

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
