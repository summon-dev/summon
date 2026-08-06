// agent-notes: { ctx: "TDD red — impeccable opt-in add-on (ADR-0014)", deps: ["src/addons/impeccable.ts"], state: active, last: "tara@2026-08-06" }

import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";

import {
  IMPECCABLE_CLI_VERSION,
  PAYLOAD_VERSION,
  ADDON_ROOT,
  DIGEST_ALGORITHM,
  BLESSED_TREE_DIGEST,
  CONSENT_PROMPT,
  HOOKS_ENABLE_NOTICE,
  INSTALL_ARGS,
  REMOVAL_NOTICE,
  treeDigest,
  shouldPrompt,
  isAffirmative,
  childEnv,
  readManifest,
  writeAddonEntry,
} from "../src/addons/impeccable.ts";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "summon-test-"));
  tempDirs.push(dir);
  return dir;
}

/** Write a file relative to `root`, creating parent directories as needed. */
function writeAt(root: string, relPath: string, contents: string): void {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
}

/** Build a temp tree from [relPath, contents] pairs, written in the given order. */
function buildTree(files: Array<[string, string]>): string {
  const root = makeTempDir();
  for (const [relPath, contents] of files) {
    writeAt(root, relPath, contents);
  }
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("impeccable add-on constants", () => {
  it("pins IMPECCABLE_CLI_VERSION to 3.5.0", () => {
    expect(IMPECCABLE_CLI_VERSION).toBe("3.5.0");
  });

  it("pins PAYLOAD_VERSION to 4.0.4", () => {
    expect(PAYLOAD_VERSION).toBe("4.0.4");
  });

  it("installs under .claude/skills/impeccable", () => {
    expect(ADDON_ROOT).toBe(".claude/skills/impeccable");
  });

  it("names the digest algorithm summon-tree-v1 (ADR-0014 §5)", () => {
    expect(DIGEST_ALGORITHM).toBe("summon-tree-v1");
  });

  it("exports BLESSED_TREE_DIGEST as either a sha256 string or null (ADR-0014 §5)", () => {
    if (BLESSED_TREE_DIGEST !== null) {
      expect(BLESSED_TREE_DIGEST).toMatch(/^sha256:[0-9a-f]{64}$/);
    } else {
      expect(BLESSED_TREE_DIGEST).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// §3 consent — shouldPrompt
// ---------------------------------------------------------------------------

describe("shouldPrompt — ADR-0014 §3 consent gating", () => {
  it("returns true when interactive TTY with no CI and no consent-bypass flags (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: {}, argv: [] })).toBe(true);
  });

  it("returns true when unrelated env vars and unrelated argv flags are present (ADR-0014 §3)", () => {
    expect(
      shouldPrompt({
        isTTY: true,
        env: { PATH: "/usr/bin", HOME: "/home/dev" },
        argv: ["--verbose", "init"],
      }),
    ).toBe(true);
  });

  it("returns false when stdin is not a TTY (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: false, env: {}, argv: [] })).toBe(false);
  });

  it("names both .claude/skills/impeccable/ and the manifest entry in removal (ADR-0014 §5)", () => {
    // Deleting the directories leaves the manifest asserting an install that is
    // gone, and this text is printed on a digest mismatch — to the user most
    // likely to follow it exactly.
    expect(REMOVAL_NOTICE).toContain(".summon/manifest.json");
    expect(REMOVAL_NOTICE).toContain("commit");
  });

  it("returns false when env.CI is set to '1' (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: { CI: "1" }, argv: [] })).toBe(false);
  });

  it("returns false when env.CI is set to 'true' (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: { CI: "true" }, argv: [] })).toBe(false);
  });

  it("returns false when env.CI is set to an arbitrary non-empty value (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: { CI: "woodpecker" }, argv: [] })).toBe(false);
  });

  it("returns false when env.CI is set to 'false' — any non-empty value disqualifies (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: { CI: "false" }, argv: [] })).toBe(false);
  });

  it("returns true when env.CI is present but empty (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: { CI: "" }, argv: [] })).toBe(true);
  });

  it("returns true when env.CI is explicitly undefined (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: { CI: undefined }, argv: [] })).toBe(true);
  });

  it("returns false when argv contains --yes (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: {}, argv: ["--yes"] })).toBe(false);
  });

  it("returns false when argv contains --non-interactive (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: {}, argv: ["--non-interactive"] })).toBe(false);
  });

  it("returns false when --yes appears among other argv entries (ADR-0014 §3)", () => {
    expect(shouldPrompt({ isTTY: true, env: {}, argv: ["init", "--yes", "--verbose"] })).toBe(false);
  });

  it("returns false when every disqualifier holds at once (ADR-0014 §3)", () => {
    expect(
      shouldPrompt({ isTTY: false, env: { CI: "1" }, argv: ["--yes", "--non-interactive"] }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §3 default-no — isAffirmative
// ---------------------------------------------------------------------------

describe("isAffirmative — ADR-0014 §3 default-no consent", () => {
  it("accepts 'y' (ADR-0014 §3)", () => {
    expect(isAffirmative("y")).toBe(true);
  });

  it("accepts 'yes' (ADR-0014 §3)", () => {
    expect(isAffirmative("yes")).toBe(true);
  });

  it("accepts 'Y' — case-insensitive (ADR-0014 §3)", () => {
    expect(isAffirmative("Y")).toBe(true);
  });

  it("accepts 'YES' — case-insensitive (ADR-0014 §3)", () => {
    expect(isAffirmative("YES")).toBe(true);
  });

  it("accepts 'Yes' — mixed case (ADR-0014 §3)", () => {
    expect(isAffirmative("Yes")).toBe(true);
  });

  it("tolerates surrounding whitespace around 'y' (ADR-0014 §3)", () => {
    expect(isAffirmative("  y  ")).toBe(true);
  });

  it("tolerates a trailing newline after 'yes' (ADR-0014 §3)", () => {
    expect(isAffirmative("yes\n")).toBe(true);
  });

  it("tolerates a trailing CRLF after 'y' (ADR-0014 §3)", () => {
    expect(isAffirmative("y\r\n")).toBe(true);
  });

  it("rejects the empty string — bare Enter means no (ADR-0014 §3)", () => {
    expect(isAffirmative("")).toBe(false);
  });

  it("rejects whitespace-only input — bare Enter means no (ADR-0014 §3)", () => {
    expect(isAffirmative("   ")).toBe(false);
  });

  it("rejects null — EOF means no (ADR-0014 §3)", () => {
    expect(isAffirmative(null)).toBe(false);
  });

  it("rejects undefined — SIGINT means no (ADR-0014 §3)", () => {
    expect(isAffirmative(undefined)).toBe(false);
  });

  it("rejects 'n' (ADR-0014 §3)", () => {
    expect(isAffirmative("n")).toBe(false);
  });

  it("rejects 'no' (ADR-0014 §3)", () => {
    expect(isAffirmative("no")).toBe(false);
  });

  it("rejects 'N' (ADR-0014 §3)", () => {
    expect(isAffirmative("N")).toBe(false);
  });

  it("rejects 'maybe' — unrecognised input means no (ADR-0014 §3)", () => {
    expect(isAffirmative("maybe")).toBe(false);
  });

  it("rejects 'Y!' — a near-miss must not be read as consent (ADR-0014 §3)", () => {
    expect(isAffirmative("Y!")).toBe(false);
  });

  it("rejects 'yep' — a near-miss must not be read as consent (ADR-0014 §3)", () => {
    expect(isAffirmative("yep")).toBe(false);
  });

  it("rejects 'yeah' — a near-miss must not be read as consent (ADR-0014 §3)", () => {
    expect(isAffirmative("yeah")).toBe(false);
  });

  it("rejects 'ok' (ADR-0014 §3)", () => {
    expect(isAffirmative("ok")).toBe(false);
  });

  it("rejects 'true' (ADR-0014 §3)", () => {
    expect(isAffirmative("true")).toBe(false);
  });

  it("rejects '1' (ADR-0014 §3)", () => {
    expect(isAffirmative("1")).toBe(false);
  });

  it("rejects 'y es' — internal whitespace is not trimmed away (ADR-0014 §3)", () => {
    expect(isAffirmative("y es")).toBe(false);
  });

  it("rejects 'yes please' (ADR-0014 §3)", () => {
    expect(isAffirmative("yes please")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §4 hook posture — prompt and notices are data
// ---------------------------------------------------------------------------

describe("CONSENT_PROMPT — ADR-0014 §4 disclosure is data, not prose", () => {
  it("states plainly that this downloads and runs third-party code (ADR-0014 §4)", () => {
    expect(CONSENT_PROMPT).toContain("This downloads and runs code Summon did not write.");
  });

  it("names the Apache-2.0 licence (ADR-0014 §4)", () => {
    expect(CONSENT_PROMPT).toContain("Apache-2.0");
  });

  it("discloses the file count as ~147 files (ADR-0014 §4)", () => {
    expect(CONSENT_PROMPT).toContain("~147 files");
  });

  it("discloses the payload size as 3.3 MB (ADR-0014 §4)", () => {
    expect(CONSENT_PROMPT).toContain("3.3 MB");
  });

  it("discloses that hooks install OFF (ADR-0014 §4)", () => {
    expect(CONSENT_PROMPT).toContain("hooks OFF");
  });

  it("offers a default-no [y/N] affordance (ADR-0014 §4)", () => {
    expect(CONSENT_PROMPT).toContain("[y/N]");
  });

  it("does not claim Summon 'verifies' the payload (ADR-0014 §4 honesty)", () => {
    expect(CONSENT_PROMPT.toLowerCase()).not.toContain("verifies");
  });

  it("does not claim the payload is 'verified' (ADR-0014 §4 honesty)", () => {
    expect(CONSENT_PROMPT.toLowerCase()).not.toContain("verified");
  });
});

describe("HOOKS_ENABLE_NOTICE — ADR-0014 §4 hooks-off default", () => {
  it("tells the user hooks are off (ADR-0014 §4)", () => {
    expect(HOOKS_ENABLE_NOTICE.toLowerCase()).toContain("hooks off");
  });

  it("names settings.local.json as where to turn hooks on (ADR-0014 §4)", () => {
    expect(HOOKS_ENABLE_NOTICE).toContain("settings.local.json");
  });
});

describe("REMOVAL_NOTICE — ADR-0014 §5 honesty about what is left behind", () => {
  it("names the .claude/skills/impeccable/ directory (ADR-0014 §5)", () => {
    expect(REMOVAL_NOTICE).toContain(".claude/skills/impeccable/");
  });

  it("names the .impeccable/ directory (ADR-0014 §5)", () => {
    expect(REMOVAL_NOTICE).toContain(".impeccable/");
  });
});

// ---------------------------------------------------------------------------
// §4 env hygiene — childEnv
// ---------------------------------------------------------------------------

describe("childEnv — ADR-0014 §4 environment hygiene", () => {
  it("deletes IMPECCABLE_BUNDLE_PATH from the child environment (ADR-0014 §4, threat model)", () => {
    const result = childEnv({ IMPECCABLE_BUNDLE_PATH: "/tmp/attacker-bundle" });
    expect(Object.keys(result)).not.toContain("IMPECCABLE_BUNDLE_PATH");
  });

  it("leaves IMPECCABLE_BUNDLE_PATH undefined even when read directly (ADR-0014 §4)", () => {
    const result = childEnv({ IMPECCABLE_BUNDLE_PATH: "/tmp/attacker-bundle", PATH: "/usr/bin" });
    expect(result.IMPECCABLE_BUNDLE_PATH).toBeUndefined();
  });

  it("preserves PATH while stripping IMPECCABLE_BUNDLE_PATH (ADR-0014 §4)", () => {
    const result = childEnv({ IMPECCABLE_BUNDLE_PATH: "/tmp/evil", PATH: "/usr/bin" });
    expect(result.PATH).toBe("/usr/bin");
  });

  it("preserves other unrelated variables (ADR-0014 §4)", () => {
    const result = childEnv({
      IMPECCABLE_BUNDLE_PATH: "/tmp/evil",
      HOME: "/home/dev",
      LANG: "en_US.UTF-8",
    });
    expect(result.HOME).toBe("/home/dev");
    expect(result.LANG).toBe("en_US.UTF-8");
  });

  it("is a no-op on an environment that never had IMPECCABLE_BUNDLE_PATH (ADR-0014 §4)", () => {
    const result = childEnv({ PATH: "/usr/bin", HOME: "/home/dev" });
    expect(result).toEqual({ PATH: "/usr/bin", HOME: "/home/dev" });
  });

  it("strips IMPECCABLE_BUNDLE_PATH regardless of casing (ADR-0014 §4)", () => {
    // Windows environment lookup is case-insensitive, but the spread preserves
    // whatever casing the variable was set with — so a case-sensitive delete
    // leaves this spelling visible to the child under any casing.
    const result = childEnv({ Impeccable_Bundle_Path: "/tmp/evil", PATH: "/usr/bin" });
    expect(Object.keys(result).some((k) => k.toLowerCase() === "impeccable_bundle_path")).toBe(
      false,
    );
    expect(result.PATH).toBe("/usr/bin");
  });

  it("strips a lowercase impeccable_bundle_path too (ADR-0014 §4)", () => {
    const result = childEnv({ impeccable_bundle_path: "/tmp/evil" });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("does not mutate the caller's environment object (ADR-0014 §4)", () => {
    const original: Record<string, string | undefined> = {
      IMPECCABLE_BUNDLE_PATH: "/tmp/evil",
      PATH: "/usr/bin",
    };
    childEnv(original);
    expect(original.IMPECCABLE_BUNDLE_PATH).toBe("/tmp/evil");
  });
});

// ---------------------------------------------------------------------------
// §4 invocation — the flags are the security argument
// ---------------------------------------------------------------------------

describe("INSTALL_ARGS — ADR-0014 §4 invocation", () => {
  it("passes --no-hooks unconditionally (ADR-0014 §4, reopen trigger 6)", () => {
    expect(INSTALL_ARGS).toContain("--no-hooks");
  });

  it("pins the installer to the reviewed version (ADR-0014 §4)", () => {
    expect(INSTALL_ARGS).toContain(`impeccable@${IMPECCABLE_CLI_VERSION}`);
  });

  it("invokes the install subcommand (ADR-0014 §4)", () => {
    expect(INSTALL_ARGS).toContain("install");
  });

  it("confines the install to the .claude provider (ADR-0014 §4 amendment)", () => {
    // Without this, 3.5.0 also writes ~152 files to .agents/skills/impeccable/,
    // which is outside §5's digest scope and outside the prompt's removal text.
    expect(INSTALL_ARGS).toContain("--providers=claude");
  });

  it("never passes a flag that would re-enable hooks (ADR-0014 §4)", () => {
    expect(INSTALL_ARGS).not.toContain("--hooks");
    expect(INSTALL_ARGS.some((a) => a.startsWith("--providers=") && a.includes("agents"))).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// §5 digest — treeDigest / summon-tree-v1
// ---------------------------------------------------------------------------

describe("treeDigest — ADR-0014 §5 summon-tree-v1", () => {
  it("returns a sha256:-prefixed hex string (ADR-0014 §5)", () => {
    const root = buildTree([["a.txt", "alpha"]]);
    expect(treeDigest(root)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("is stable across two calls on the same tree (ADR-0014 §5)", () => {
    const root = buildTree([
      ["a.txt", "alpha"],
      ["nested/b.txt", "beta"],
    ]);
    expect(treeDigest(root)).toBe(treeDigest(root));
  });

  it("is independent of file creation order (ADR-0014 §5)", () => {
    const forwards = buildTree([
      ["a.txt", "alpha"],
      ["b.txt", "beta"],
      ["nested/c.txt", "gamma"],
    ]);
    const backwards = buildTree([
      ["nested/c.txt", "gamma"],
      ["b.txt", "beta"],
      ["a.txt", "alpha"],
    ]);
    expect(treeDigest(backwards)).toBe(treeDigest(forwards));
  });

  it("normalizes CRLF to LF so autocrlf checkouts digest identically (ADR-0014 §5)", () => {
    const crlf = buildTree([["a.txt", "a\r\nb"]]);
    const lf = buildTree([["a.txt", "a\nb"]]);
    expect(treeDigest(crlf)).toBe(treeDigest(lf));
  });

  it("normalizes CRLF across multiple lines and multiple files (ADR-0014 §5)", () => {
    const crlf = buildTree([
      ["a.txt", "one\r\ntwo\r\nthree\r\n"],
      ["nested/b.txt", "x\r\ny\r\n"],
    ]);
    const lf = buildTree([
      ["a.txt", "one\ntwo\nthree\n"],
      ["nested/b.txt", "x\ny\n"],
    ]);
    expect(treeDigest(crlf)).toBe(treeDigest(lf));
  });

  it("changes when a file's content changes (ADR-0014 §5)", () => {
    const root = buildTree([["a.txt", "alpha"]]);
    const before = treeDigest(root);
    writeAt(root, "a.txt", "alpha-tampered");
    expect(treeDigest(root)).not.toBe(before);
  });

  it("changes when a file is added (ADR-0014 §5)", () => {
    const root = buildTree([["a.txt", "alpha"]]);
    const before = treeDigest(root);
    writeAt(root, "b.txt", "beta");
    expect(treeDigest(root)).not.toBe(before);
  });

  it("changes when a file is added in a nested directory (ADR-0014 §5)", () => {
    const root = buildTree([["a.txt", "alpha"]]);
    const before = treeDigest(root);
    writeAt(root, "nested/deep/c.txt", "gamma");
    expect(treeDigest(root)).not.toBe(before);
  });

  it("changes when a file is renamed but content is unchanged — paths are covered (ADR-0014 §5)", () => {
    const asA = buildTree([["a.txt", "alpha"]]);
    const asB = buildTree([["b.txt", "alpha"]]);
    expect(treeDigest(asB)).not.toBe(treeDigest(asA));
  });

  it("distinguishes binary files that are not valid UTF-8 (ADR-0014 §5)", () => {
    // Decoding to a string before hashing would map every invalid byte sequence
    // to U+FFFD, so these two distinct payloads would collide. The payload is
    // third-party code fetched over an unverified channel, which puts that
    // collision within an attacker's reach rather than in theory.
    const first = makeTempDir();
    writeFileSync(join(first, "blob.bin"), Buffer.from([0xff, 0xfe, 0x00, 0x01]));
    const second = makeTempDir();
    writeFileSync(join(second, "blob.bin"), Buffer.from([0xff, 0xfe, 0x00, 0x02]));
    expect(treeDigest(second)).not.toBe(treeDigest(first));
  });

  it("does not corrupt binary content while normalizing line endings (ADR-0014 §5)", () => {
    // 0x0D inside binary data still normalizes — that is the documented rule —
    // but bytes that are neither CR nor LF must survive untouched, so two blobs
    // differing only in a non-CR byte stay distinguishable.
    const first = makeTempDir();
    writeFileSync(join(first, "blob.bin"), Buffer.from([0x80, 0x0d, 0x0a, 0x81]));
    const second = makeTempDir();
    writeFileSync(join(second, "blob.bin"), Buffer.from([0x80, 0x0d, 0x0a, 0x82]));
    expect(treeDigest(second)).not.toBe(treeDigest(first));
  });

  it("treats a CRLF and a lone LF in binary content identically (ADR-0014 §5)", () => {
    const crlf = makeTempDir();
    writeFileSync(join(crlf, "blob.bin"), Buffer.from([0x80, 0x0d, 0x0a, 0x81]));
    const lf = makeTempDir();
    writeFileSync(join(lf, "blob.bin"), Buffer.from([0x80, 0x0a, 0x81]));
    expect(treeDigest(lf)).toBe(treeDigest(crlf));
  });

  it("does NOT normalize a lone CR — it is content, not a line ending (ADR-0014 §5)", () => {
    // Collapsing lone CR to LF would make [0x0D], [0x0A] and [0x0D,0x0A] collide,
    // letting anyone with write access flip an LF to a CR anywhere in the tree
    // without moving the digest. In bash that turns the LF ending a comment into
    // a CR and swallows the next line — deleting a check with no digest change.
    // autocrlf produces CRLF, never a lone CR, so normalizing it buys nothing.
    const cr = makeTempDir();
    writeFileSync(join(cr, "s.sh"), Buffer.from([0x61, 0x0d, 0x62]));
    const lf = makeTempDir();
    writeFileSync(join(lf, "s.sh"), Buffer.from([0x61, 0x0a, 0x62]));
    expect(treeDigest(cr)).not.toBe(treeDigest(lf));
  });

  it("counts a symlink's presence, so a planted link cannot hide (ADR-0014 §5)", () => {
    // Skipping symlinks entirely would let a payload plant
    // `impeccable/vendor -> ../../../.cache/x`: inside the root by every path a
    // user would type, absent from the blessed tree, and freely mutable with
    // matchedBlessed still true.
    const plain = buildTree([["a.txt", "alpha"]]);
    const linked = buildTree([["a.txt", "alpha"]]);
    symlinkSync("../../../.cache/x", join(linked, "vendor"));
    expect(treeDigest(linked)).not.toBe(treeDigest(plain));
  });

  it("changes when a symlink is repointed (ADR-0014 §5)", () => {
    const first = buildTree([["a.txt", "alpha"]]);
    symlinkSync("./target-one", join(first, "vendor"));
    const second = buildTree([["a.txt", "alpha"]]);
    symlinkSync("./target-two", join(second, "vendor"));
    expect(treeDigest(first)).not.toBe(treeDigest(second));
  });

  it("does not follow a symlink out of the tree (ADR-0014 §5)", () => {
    // The link's target string is hashed, never the target's content — so an
    // identical link pointing at wildly different outside content digests the
    // same, which is what "does not follow" means.
    const outside = buildTree([["secret.txt", "sensitive"]]);
    const withLink = buildTree([["a.txt", "alpha"]]);
    symlinkSync(outside, join(withLink, "vendor"));
    const before = treeDigest(withLink);
    writeAt(outside, "secret.txt", "totally different content now");
    expect(treeDigest(withLink)).toBe(before);
  });

  it("refuses to hash a root that is itself a symlink (ADR-0014 §5)", () => {
    // Following it would digest wherever it points while REMOVAL_NOTICE's
    // "delete .claude/skills/impeccable/" removes only the link.
    const real = buildTree([["a.txt", "alpha"]]);
    const parent = makeTempDir();
    const linkRoot = join(parent, "impeccable");
    symlinkSync(real, linkRoot);
    expect(() => treeDigest(linkRoot)).toThrow(/symlink/i);
  });

  it("distinguishes two files whose contents are swapped between paths (ADR-0014 §5)", () => {
    const forward = buildTree([
      ["a.txt", "alpha"],
      ["b.txt", "beta"],
    ]);
    const swapped = buildTree([
      ["a.txt", "beta"],
      ["b.txt", "alpha"],
    ]);
    expect(treeDigest(swapped)).not.toBe(treeDigest(forward));
  });
});

// ---------------------------------------------------------------------------
// §5 manifest — readManifest / writeAddonEntry
// ---------------------------------------------------------------------------

function readManifestRaw(root: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, ".summon", "manifest.json"), "utf8"));
}

describe("readManifest — ADR-0014 §5 forward compatibility", () => {
  it("returns null when .summon/manifest.json is absent (ADR-0014 §5)", () => {
    const root = makeTempDir();
    expect(readManifest(root)).toBeNull();
  });

  it("returns null when .summon/ exists but the manifest does not (ADR-0014 §5)", () => {
    const root = makeTempDir();
    mkdirSync(join(root, ".summon"), { recursive: true });
    expect(readManifest(root)).toBeNull();
  });

  it("reads a minimal manifest (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", JSON.stringify({ manifestVersion: 1 }));
    expect(readManifest(root)).toMatchObject({ manifestVersion: 1 });
  });

  it("does not throw on an unknown top-level key — schema is not strict (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", JSON.stringify({ manifestVersion: 1, futureField: 1 }));
    expect(() => readManifest(root)).not.toThrow();
  });

  it("preserves the unknown top-level key it read back to the caller (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", JSON.stringify({ manifestVersion: 1, futureField: 1 }));
    expect(readManifest(root)).toMatchObject({ futureField: 1 });
  });

  it("returns null on a malformed manifest rather than throwing (ADR-0014 §6)", () => {
    // The untrusted installer has write access to the project before Summon
    // reads this, and §6 forbids the add-on being fatal to a completed scaffold.
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", "{ not json at all");
    expect(() => readManifest(root)).not.toThrow();
    expect(readManifest(root)).toBeNull();
  });

  it("returns null when the manifest is a JSON array, not an object (ADR-0014 §6)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", JSON.stringify([1, 2, 3]));
    expect(readManifest(root)).toBeNull();
  });

  it("returns null when the manifest is a bare JSON scalar (ADR-0014 §6)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", "42");
    expect(readManifest(root)).toBeNull();
  });

  it("tolerates a newer manifestVersion than this CLI knows (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", JSON.stringify({ manifestVersion: 99, futureField: 1 }));
    expect(() => readManifest(root)).not.toThrow();
  });
});

describe("writeAddonEntry — ADR-0014 §5 additive addons array", () => {
  it("creates .summon/manifest.json when it is absent (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(readManifestRaw(root)).toBeTruthy();
  });

  it("sets manifestVersion to 1 — addons is optional and additive, not a bump (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(readManifestRaw(root).manifestVersion).toBe(1);
  });

  it("leaves an existing manifestVersion of 1 unbumped (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", JSON.stringify({ manifestVersion: 1 }));
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(readManifestRaw(root).manifestVersion).toBe(1);
  });

  it("stores the entry in an addons array (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(Array.isArray(readManifestRaw(root).addons)).toBe(true);
  });

  it("stores the entry's fields verbatim in the addons array (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(readManifestRaw(root).addons).toContainEqual(
      expect.objectContaining({ name: "impeccable", version: PAYLOAD_VERSION }),
    );
  });

  it("appends a second entry rather than replacing the first (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    writeAddonEntry(root, { name: "other", version: "1.0.0" });
    expect(readManifestRaw(root).addons).toHaveLength(2);
  });

  it("preserves a pre-existing unknown top-level key on rewrite (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAt(root, ".summon/manifest.json", JSON.stringify({ manifestVersion: 1, futureField: 1 }));
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(readManifestRaw(root).futureField).toBe(1);
  });

  it("preserves a pre-existing addons entry written by an older run (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAt(
      root,
      ".summon/manifest.json",
      JSON.stringify({ manifestVersion: 1, addons: [{ name: "legacy", version: "0.1.0" }] }),
    );
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(readManifestRaw(root).addons).toContainEqual(
      expect.objectContaining({ name: "legacy", version: "0.1.0" }),
    );
  });

  it("builds on the supplied pre-install snapshot, not on what is on disk (ADR-0014 §5)", () => {
    // The installer runs with write access before this executes. A payload that
    // seeds its own manifest could otherwise have Summon preserve a fabricated
    // entry claiming matchedBlessed: true, then commit it under a Summon message.
    const root = makeTempDir();
    writeAt(
      root,
      ".summon/manifest.json",
      JSON.stringify({
        manifestVersion: 1,
        addons: [{ name: "fabricated-by-payload", matchedBlessed: true }],
      }),
    );
    // Snapshot taken before the hostile write would be an empty/absent manifest.
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION }, null);
    const addons = readManifestRaw(root).addons as Array<Record<string, unknown>>;
    expect(addons.map((a) => a.name)).not.toContain("fabricated-by-payload");
    expect(addons.map((a) => a.name)).toContain("impeccable");
  });

  it("still preserves a genuine pre-install entry when that is the snapshot (ADR-0014 §5)", () => {
    const root = makeTempDir();
    const snapshot = { manifestVersion: 1, addons: [{ name: "legacy", version: "0.1.0" }] };
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION }, snapshot);
    const addons = readManifestRaw(root).addons as Array<Record<string, unknown>>;
    expect(addons.map((a) => a.name)).toEqual(["legacy", "impeccable"]);
  });

  it("round-trips through readManifest after writing (ADR-0014 §5)", () => {
    const root = makeTempDir();
    writeAddonEntry(root, { name: "impeccable", version: PAYLOAD_VERSION });
    expect(readManifest(root)).toMatchObject({ manifestVersion: 1 });
  });
});
