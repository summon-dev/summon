// agent-notes: { ctx: "unit + integration tests for summon-team doctor health registry", deps: ["src/doctor.ts", "src/index.ts"], state: active, last: "claude@2026-07-07" }

import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkAddonIntegrity,
  exitCodeFor,
  formatResults,
  HEALTH_CHECKS,
  isSummonProject,
  runHealth,
  type CheckResult,
} from "../src/doctor.ts";
import {
  ADDON_ROOT,
  CONSENT_PROMPT,
  DIGEST_ALGORITHM,
  treeDigest,
} from "../src/addons/impeccable.ts";

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

// ---- unit: addon-integrity (ADR-0014 §5) -----------------------------------

/** Build a project carrying a recorded add-on plus its on-disk tree. */
function makeAddonProject(opts: {
  entry?: Record<string, unknown>;
  treeFiles?: Record<string, string> | null;
}): string {
  const treeFiles =
    opts.treeFiles === undefined ? { ".claude/skills/impeccable/a.txt": "alpha" } : opts.treeFiles;
  const root = makeProject({ "CLAUDE.md": "# project\n", ...(treeFiles ?? {}) });

  const digest =
    treeFiles === null ? "sha256:" + "0".repeat(64) : treeDigest(join(root, ADDON_ROOT));

  const entry = {
    name: "impeccable",
    root: ADDON_ROOT,
    digestAlgorithm: DIGEST_ALGORITHM,
    treeDigest: digest,
    matchedBlessed: true,
    hooksWired: false,
    ...(opts.entry ?? {}),
  };
  const manifestPath = join(root, ".summon", "manifest.json");
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify({ manifestVersion: 1, addons: [entry] }, null, 2));
  return root;
}

describe("addon-integrity check (ADR-0014 §5)", () => {
  it("passes with no manifest at all — the modal install has no add-ons", () => {
    const root = makeProject({ "CLAUDE.md": "# project\n" });
    const r = checkAddonIntegrity(root);
    expect(r.verdict).toBe("ok");
    expect(r.detail).toContain("no add-ons recorded");
  });

  it("reports intact when the tree still matches the recorded digest", () => {
    const r = checkAddonIntegrity(makeAddonProject({}));
    expect(r.verdict).toBe("ok");
    expect(r.detail).toContain("intact");
  });

  it("reports drift when a file under the add-on root changed after install", () => {
    const root = makeAddonProject({});
    writeFileSync(join(root, ADDON_ROOT, "a.txt"), "tampered");
    const r = checkAddonIntegrity(root);
    expect(r.verdict).toBe("degraded");
    expect(r.detail).toContain("drift");
  });

  it("reports drift when a file is added under the add-on root", () => {
    const root = makeAddonProject({});
    writeFileSync(join(root, ADDON_ROOT, "extra.sh"), "#!/bin/sh\necho hi\n");
    expect(checkAddonIntegrity(root).verdict).toBe("degraded");
  });

  it("does not claim to know WHY the tree changed — update, edit and tampering are indistinguishable", () => {
    const root = makeAddonProject({});
    writeFileSync(join(root, ADDON_ROOT, "a.txt"), "tampered");
    expect(checkAddonIntegrity(root).detail).toContain("cannot tell which");
  });

  it("reports a stale entry, not a failure, when the tree is gone entirely", () => {
    const root = makeAddonProject({});
    rmSync(join(root, ADDON_ROOT), { recursive: true, force: true });
    const r = checkAddonIntegrity(root);
    expect(r.verdict).toBe("ok");
    expect(r.detail).toContain("stale");
  });

  it("refuses a manifest root that escapes the project — the manifest is untrusted", () => {
    const root = makeAddonProject({ entry: { root: "../../../etc" } });
    const r = checkAddonIntegrity(root);
    expect(r.verdict).toBe("degraded");
    expect(r.detail).toContain("escapes the project");
  });

  it("refuses an absolute manifest root", () => {
    const root = makeAddonProject({ entry: { root: "/etc" } });
    expect(checkAddonIntegrity(root).verdict).toBe("degraded");
  });

  it("refuses a digest algorithm it cannot recompute", () => {
    const root = makeAddonProject({ entry: { digestAlgorithm: "summon-tree-v99" } });
    const r = checkAddonIntegrity(root);
    expect(r.verdict).toBe("degraded");
    expect(r.detail).toContain("cannot recompute");
  });

  it("survives a malformed addons entry rather than throwing", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      ".summon/manifest.json": JSON.stringify({ manifestVersion: 1, addons: ["not-an-object"] }),
    });
    expect(() => checkAddonIntegrity(root)).not.toThrow();
    expect(checkAddonIntegrity(root).verdict).toBe("degraded");
  });

  it("survives a malformed manifest file rather than throwing", () => {
    const root = makeProject({
      "CLAUDE.md": "# project\n",
      ".summon/manifest.json": "{ not json",
    });
    expect(() => checkAddonIntegrity(root)).not.toThrow();
    expect(checkAddonIntegrity(root).verdict).toBe("ok");
  });

  it("still says the payload never matched the reviewed one, even when intact", () => {
    const root = makeAddonProject({ entry: { matchedBlessed: false } });
    const r = checkAddonIntegrity(root);
    expect(r.verdict).toBe("ok");
    expect(r.detail).toContain("never matched");
  });

  it("exists because the consent prompt promises it — the prompt must not name a capability the binary lacks", () => {
    // This is the sensor for the Critical finding of 2026-08-06. CONSENT_PROMPT
    // told users `summon-team doctor` warns if the payload changes later, while
    // doctor.ts had no idea manifests or digests existed — that check was a
    // different, unscheduled issue. It is the ONE consideration offered in
    // exchange for consent, so promising it unbuilt obtains consent on a false
    // premise, and ADR-0014 §5 permits only a claim passive about mechanism.
    //
    // The rule this pins: if the prompt names doctor, doctor must actually check.
    // Deleting the check without also rewording the prompt now fails here.
    if (/summon-team doctor|`?doctor`?\b/.test(CONSENT_PROMPT)) {
      expect(HEALTH_CHECKS).toContain(checkAddonIntegrity);
    }
    // And the converse guard: the prompt must still be the thing that promises
    // it, so a future reword that drops the promise is a deliberate act rather
    // than an accident that leaves this test vacuously true.
    expect(CONSENT_PROMPT).toMatch(/doctor/);
  });

  it("actually reports on a recorded add-on, so the promise is behavioural not nominal", () => {
    // Registration alone would pass even if the check returned a constant.
    const root = makeAddonProject({});
    const result = runHealth(root).find((r) => r.id === "addon-integrity");
    expect(result?.detail).toContain("impeccable");
  });

  it("is registered in the health registry, so `summon-team doctor` actually runs it", () => {
    expect(HEALTH_CHECKS).toContain(checkAddonIntegrity);
    const root = makeAddonProject({});
    expect(runHealth(root).map((r) => r.id)).toContain("addon-integrity");
  });
});
