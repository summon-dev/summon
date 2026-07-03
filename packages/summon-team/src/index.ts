import * as p from "@clack/prompts";
import { downloadTemplate } from "giget";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";
import {
  exitCodeFor,
  formatResults,
  isSummonProject,
  runHealth,
} from "./doctor";

declare const __VERSION__: string;

const TEMPLATE = "github:summon-dev/summon";
const VERSION = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";

// Must start with a letter or number — no leading hyphens
const PROJECT_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

// Directories and files that are repo infrastructure, not part of the template
const EXCLUDE_DIRS = new Set(["packages", "site", "node_modules", ".git"]);
const EXCLUDE_FILES = new Set([
  "CHANGELOG.md",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "package.json",
]);

// The meta zones (ADR-0007): Summon's own development exhaust and product ADRs —
// framework-only, not template canon a user installs. `docs/history/` holds dev-history,
// war-stories, and design docs; `docs/adrs/meta/` holds the product ADRs about building
// summon-team itself. These are nested paths (not top-level names), so they're stripped
// after copy/download rather than via the basename EXCLUDE_DIRS filter. Whole zones only:
// the doctor suppresses a missing agent-notes dep when the parent dir is absent, so
// removing an entire zone stays doctor-clean — and canon files must not dep into these
// zones (check-canon.mjs fails CI on any canon->meta edge, ADR-0007 §9).
const EXCLUDE_PATHS = ["docs/history", "docs/adrs/meta"];

// `summon-team doctor` — second invocation mode (ADR-0004). Runs the portable
// health registry against the current working directory; downloads nothing, writes
// nothing. Exit 0 = healthy, non-zero = at least one check failed (the v1 contract).
function runDoctor() {
  const root = process.cwd();
  if (!isSummonProject(root)) {
    console.error(
      `No Summon installation found in ${root} — expected a .claude/ directory.`
    );
    process.exit(1);
  }
  const results = runHealth(root);
  console.log(formatResults(results));
  process.exit(exitCodeFor(results));
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "doctor") {
    runDoctor();
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`summon-team v${VERSION}`);
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
  summon-team — Summon your AI dev team

  Usage:
    npx summon-team <project-name>
    npx summon-team
    npx summon-team doctor          Check this project's Summon wiring (run in the project)

  Options:
    -v, --version        Show version
    -h, --help           Show this help
    --local <path>       Copy template from a local directory instead of GitHub
`);
    process.exit(0);
  }

  const localIdx = args.indexOf("--local");
  if (localIdx !== -1) {
    const next = args[localIdx + 1];
    if (!next || next.startsWith("-")) {
      console.error("Error: --local requires a path argument.\n");
      console.error("Usage: npx summon-team [--local <path>] <project-name>");
      process.exit(1);
    }
  }
  const localPath = localIdx !== -1 ? args[localIdx + 1] : undefined;
  const skipIdx = localIdx !== -1 ? localIdx + 1 : -1;
  const projectArg = args.find(
    (a, i) => !a.startsWith("-") && i !== skipIdx
  );

  p.intro("summon-team — Summon your AI dev team");

  let projectName: string;

  if (projectArg) {
    if (projectArg === ".") {
      p.log.error(
        "Use `summon-team add <runtime>` to install into an existing project."
      );
      process.exit(1);
    }
    if (!PROJECT_NAME_RE.test(projectArg)) {
      p.log.error("Use letters, numbers, hyphens, or underscores only.");
      process.exit(1);
    }
    projectName = projectArg;
  } else {
    const result = await p.text({
      message: "What is your project called?",
      placeholder: "my-awesome-project",
      validate: (value) => {
        if (!value.trim()) return "Project name is required.";
        if (!PROJECT_NAME_RE.test(value))
          return "Use letters, numbers, hyphens, or underscores only.";
      },
    });

    if (p.isCancel(result)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    projectName = result;
  }

  const targetDir = resolve(process.cwd(), projectName);

  if (existsSync(targetDir)) {
    try {
      const entries = readdirSync(targetDir);
      if (entries.length > 0) {
        p.log.error(
          `Directory "${projectName}" already exists and is not empty.`
        );
        process.exit(1);
      }
    } catch {
      // If we can't read the dir, let giget handle the error
    }
  }

  const s = p.spinner();

  if (localPath) {
    s.start("Copying template from local directory...");
    const resolvedLocal = resolve(localPath);
    if (!existsSync(resolvedLocal) || !statSync(resolvedLocal).isDirectory()) {
      s.stop("Copy failed.");
      p.log.error(`Local template path is not a directory: ${resolvedLocal}`);
      process.exit(1);
    }
    cpSync(resolvedLocal, targetDir, {
      recursive: true,
      filter: (src) => {
        const name = basename(src);
        return !EXCLUDE_DIRS.has(name) && !EXCLUDE_FILES.has(name);
      },
    });
    s.stop("Template copied.");
  } else {
    s.start("Downloading Summon template...");
    try {
      await downloadTemplate(TEMPLATE, {
        dir: targetDir,
      });
    } catch (err) {
      s.stop("Download failed.");
      const message = err instanceof Error ? err.message : String(err);
      p.log.error(
        `Could not download the template. Check your network connection.\n${message}`
      );
      process.exit(1);
    }
    s.stop("Template downloaded.");
  }

  // Remove repo infrastructure files — these are not part of the template
  s.start("Setting up your project...");

  for (const dir of EXCLUDE_DIRS) {
    const fullPath = resolve(targetDir, dir);
    if (existsSync(fullPath)) rmSync(fullPath, { recursive: true });
  }

  for (const file of EXCLUDE_FILES) {
    const fullPath = resolve(targetDir, file);
    if (existsSync(fullPath)) rmSync(fullPath, { force: true });
  }

  for (const rel of EXCLUDE_PATHS) {
    const fullPath = resolve(targetDir, rel);
    if (existsSync(fullPath)) rmSync(fullPath, { recursive: true, force: true });
  }

  // Reset CLAUDE.md to template state so /quickstart detects a fresh project
  const claudeMdPath = resolve(targetDir, "CLAUDE.md");
  if (existsSync(claudeMdPath)) {
    let content = readFileSync(claudeMdPath, "utf-8");
    content = content.replace(
      /\*\*Project Name:\*\* .+/,
      "**Project Name:** [Your Project Name]"
    );
    content = content.replace(
      /\*\*Description:\*\* .+/,
      "**Description:** [Your project description]"
    );
    content = content.replace(
      /\*\*Tech Stack:\*\* .+/,
      "**Tech Stack:** [Your tech stack]"
    );
    writeFileSync(claudeMdPath, content);
  }

  // Swap Summon's marketing README for the project stub (ADR-0007 §6). The stub
  // ships as README-template.md and becomes the new project's README.md, the same
  // reset pattern applied to CLAUDE.md above; the template file is then consumed so
  // it doesn't linger. First-Run Detection keys on README-template.md's presence.
  const readmeTemplatePath = resolve(targetDir, "README-template.md");
  if (existsSync(readmeTemplatePath)) {
    cpSync(readmeTemplatePath, resolve(targetDir, "README.md"));
    rmSync(readmeTemplatePath, { force: true });
  }

  // Initialize git repo with an initial commit
  try {
    execFileSync("git", ["init"], { cwd: targetDir, stdio: "ignore" });
    execFileSync("git", ["add", "-A"], { cwd: targetDir, stdio: "ignore" });
    execFileSync(
      "git",
      ["commit", "-m", "feat: initialize project with Summon framework"],
      { cwd: targetDir, stdio: "ignore" }
    );
  } catch {
    // git init is best-effort — don't fail the whole scaffold
    p.log.warn("Could not initialize git repository.");
  }

  s.stop("Project ready.");

  p.note(
    `cd ${projectName}\n\nOpen in Claude Code, then run /quickstart`,
    "Next steps"
  );

  p.outro("Ship like a team of 10. You're the only human.");
}

main().catch((err) => {
  p.log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
