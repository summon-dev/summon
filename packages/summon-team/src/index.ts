// agent-notes: { ctx: "summon-team CLI entry — scaffold, --local, --ref, doctor", deps: ["src/doctor.ts", "src/template-ref.ts", "src/addons/impeccable.ts"], state: active, last: "sato@2026-08-08" }

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
import { offerImpeccable } from "./addons/impeccable";
import {
  exitCodeFor,
  formatResults,
  isSummonProject,
  runHealth,
} from "./doctor";
import {
  buildTemplateSpec,
  describeDownloadFailure,
  validateRef,
} from "./template-ref";

declare const __VERSION__: string;

const TEMPLATE = "github:summon-dev/summon";
const VERSION = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";

// Must start with a letter or number — no leading hyphens
const PROJECT_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

// Directories that are Summon's own repo infrastructure, not template canon.
// Matched by basename during the copy filter (so a nested one is caught too).
// .github (Summon's CI + site-deploy workflows) and .playwright-mcp (gitignored
// browser scratch that --local's cpSync would otherwise copy) are meta, ADR-0007.
const EXCLUDE_DIRS = new Set([
  "packages",
  "site",
  "node_modules",
  ".git",
  ".github",
  ".playwright-mcp",
]);
// Files that are Summon's own project metadata, not the user's. The governance
// files describe the Summon project/community (CONTRIBUTING "to Summon", Summon's
// security policy) or carry Summon's copyright (LICENSE) — the user writes their own.
const EXCLUDE_FILES = new Set([
  "CHANGELOG.md",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "package.json",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "LICENSE",
]);

// Meta paths (ADR-0007): Summon's own development exhaust — framework-only, not
// template canon a user installs. Nested paths (not top-level basenames), so they're
// stripped after copy/download rather than via the basename EXCLUDE_DIRS filter.
// Canon files must not dep into these (check-canon.mjs fails CI on any canon->meta
// edge, ADR-0007 §9). rmSync is force+recursive, so a missing path is a safe no-op —
// which is what makes the "generative dirs" entries a forward guard, not a present cut.
const EXCLUDE_PATHS = [
  // The two consolidated meta zones.
  "docs/history", //     dev-history, war-stories, design docs
  "docs/adrs/meta", //   product ADRs about building summon-team itself
  // Generative dirs: the commands write the USER's own reviews/tracking/sprints here
  // in their project (created on first write), but Summon's own are meta. Excluding
  // them means a future self-hosted /code-review or /sprint-boundary can't drop fresh
  // Summon meta into a shipped path. The user's project makes its own on demand.
  "docs/code-reviews",
  "docs/tracking",
  "docs/sprints",
  // Individual meta files. handoff is per-session scratch: cpSync (the --local path)
  // ignores .gitignore, so a locally-regenerated handoff would otherwise be copied.
  // README.md is the marketing page — excluded so it never ships even if the stub
  // swap below is skipped; README-template.md (not listed) survives to become README.md.
  ".claude/handoff.md",
  "README.md",
];

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
    --ref <ref>          Scaffold from a branch, tag, or commit instead of the default branch
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

  const refIdx = args.indexOf("--ref");
  if (refIdx !== -1) {
    const next = args[refIdx + 1];
    if (!next || next.startsWith("-")) {
      console.error("Error: --ref requires a ref argument.\n");
      console.error(
        "Usage: npx summon-team [--ref <branch|tag|commit>] <project-name>"
      );
      process.exit(1);
    }
  }

  const localPath = localIdx !== -1 ? args[localIdx + 1] : undefined;
  const ref = refIdx !== -1 ? args[refIdx + 1] : undefined;

  // A local directory copy has no git ref to check out. Honouring one flag and
  // dropping the other silently is how a validation run passes against a payload
  // nobody asked for, so contradictory flags are an error, not a preference order.
  if (localPath !== undefined && ref !== undefined) {
    console.error("Error: --ref and --local cannot be used together.\n");
    console.error(
      "--local copies a directory that is already on disk, so there is no ref to resolve."
    );
    process.exit(1);
  }

  // Validate before anything touches the disk or the network: a bad ref should
  // cost a message, not a half-created project directory.
  if (ref !== undefined) {
    const check = validateRef(ref);
    if (!check.ok) {
      console.error(`Error: ${check.reason}\n`);
      console.error(
        "Usage: npx summon-team [--ref <branch|tag|commit>] <project-name>"
      );
      process.exit(1);
    }
  }

  // Every flag that takes a value consumes the index after it. Those indices are
  // not candidates for the project name — a set (rather than a scalar skip) is
  // what keeps the next value-taking flag from reintroducing this bug.
  const consumedValueIdx = new Set<number>();
  for (const flagIdx of [localIdx, refIdx]) {
    if (flagIdx !== -1) consumedValueIdx.add(flagIdx + 1);
  }
  const projectArg = args.find(
    (a, i) => !a.startsWith("-") && !consumedValueIdx.has(i)
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
      await downloadTemplate(buildTemplateSpec(TEMPLATE, ref), {
        dir: targetDir,
      });
    } catch (err) {
      s.stop("Download failed.");
      p.log.error(describeDownloadFailure(err, ref));
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

  // The add-on phase (ADR-0014 §2). It runs here, last, because the scaffold
  // above is already complete and committed — which is what makes §6's failure
  // posture structural rather than a promise. Nothing below can leave a
  // half-scaffolded project, and offerImpeccable never throws or exits non-zero.
  await offerImpeccable({ targetDir, argv: args });

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
