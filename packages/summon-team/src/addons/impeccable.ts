// agent-notes: { ctx: "opt-in impeccable add-on: consent, install, digest (ADR-0014)", deps: ["node:crypto", "node:child_process", "../manifest"], state: active, last: "sato@2026-09-11", key: ["readManifest moved to ../manifest and is re-exported here: doctor.ts and impeccable.test.ts import it from this module"] }

/**
 * The one opt-in add-on Summon offers, per ADR-0014 (Accepted 2026-08-05).
 *
 * Read the ADR before changing anything here. Three properties are load-bearing
 * and a change to any of them is an ADR amendment, not a refactor:
 *
 *   1. `--no-hooks` is unconditional (§4). Install *writes* files; execution
 *      begins at the first hook invocation. Summon plants zero hooks, so the
 *      payload arrives inert. Reopen trigger 6: anyone reporting that Summon
 *      installed impeccable's hooks is a stop-the-line defect, not a bug.
 *   2. `IMPECCABLE_BUNDLE_PATH` is stripped from the child environment (§4).
 *      The vendor reads it at `skills.mjs:561` to redirect the bundle source to
 *      an arbitrary local path, validated only for existence.
 *   3. No manifest entry and no second commit unless the install succeeded AND
 *      hashed (§6). An entry with an empty digest is worse than no entry,
 *      because `doctor` would report it as intact.
 *
 * §8 is why this is a single module with no `AddOn` interface, no registry and
 * no discovery: there is one add-on, and an abstraction extracted from n=1 is
 * the thing ADR-0006 and Done Gate item 16 exist to prevent.
 */

import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createInterface } from "node:readline/promises";
import { join, relative, resolve, sep } from "node:path";
import { readManifest } from "../manifest";

/**
 * The pinned downloader — and ADR-0010's cooldown reaches only THIS artifact,
 * because it is a named, dated version. It does not reach the ~3.3 MB payload
 * this downloader fetches, which carries no version and no checksum and is the
 * part that actually executes. That gap is ADR-0014 §7's recorded exception #1,
 * not something the pin covers.
 */
export const IMPECCABLE_CLI_VERSION = "3.5.0";

/** The payload's own version line, from its `SKILL.md`. Recorded by hand — the bundle carries no version. */
export const PAYLOAD_VERSION = "4.0.4";

/** The only directory the digest covers. Not `.impeccable/`, not `settings.local.json` (§5 item 5). */
export const ADDON_ROOT = ".claude/skills/impeccable";

export const DIGEST_ALGORITHM = "summon-tree-v1";

/**
 * The digest a maintainer reviewed, for comparison against what actually lands.
 *
 * Observed over the human-reviewed, git-tracked impeccable 4.0.4 tree (147 files),
 * whose `v4.0.2 -> v4.0.4` upgrade landed as a reviewable diff rather than a
 * scratch-directory glance. Blessed 2026-08-06.
 *
 * §5 is emphatic about what this does NOT mean: it is drift detection, not
 * verification. If the bundle was already compromised when it was blessed, it
 * matches forever. Re-blessing is a normal PR under normal review, and every
 * upstream payload release invalidates this constant until someone does it.
 */
export const BLESSED_TREE_DIGEST: string | null =
  "sha256:ee4e188c56b9c5cfb315c3b697b0e5a27a5de91de2288543daa7094cd6b6a2b1";

/**
 * §3, verbatim. This text is a security control, not copy.
 *
 * Changing it is an ADR amendment. It is written for the person who presses
 * Enter without reading, which is why the default is safe and the text leads
 * with consequence rather than feature. If §4's hook posture or §5's digest
 * scope ever changes, the matching line changes in the same PR or this is lying.
 */
export const CONSENT_PROMPT = `Optional: install "impeccable", a third-party design skill?

  This downloads and runs code Summon did not write.

  What it is    impeccable by pbakaus - Apache-2.0 - impeccable.style
  What lands    ~147 files (~3.3 MB) in .claude/skills/impeccable/,
                most of them executable scripts.
  What runs     Nothing, yet. Summon installs with hooks OFF. Until you
                turn them on yourself, these files sit on disk unused.
  Where from    The npm package is only a downloader. The 3.3 MB payload
                is fetched from impeccable.style at install time. That
                request names no version and carries no checksum, so
                Summon cannot verify in advance that what you receive is
                what Summon reviewed. Updates re-download from the same
                place - not from npm.
  What Summon   It records a checksum of the files after they land.
  does about it \`summon-team doctor\` warns if they change later. That
                detects drift. It does not verify the download.
  To remove     Delete .claude/skills/impeccable/ and .impeccable/.
  Needs network Yes. If you are offline this step is skipped and your
                project is unaffected.

Install impeccable? [y/N] `;

/**
 * §4, verbatim. Printed on success only when the tree matched the blessed digest.
 *
 * The 30-second turn-end cost and the untracked-wiring fact live here rather
 * than in the main prompt because they only matter to someone taking this step.
 */
export const HOOKS_ENABLE_NOTICE = `impeccable installed with hooks off. Nothing from it runs yet.
To enable its automatic design review (a check after every file edit
and at the end of every turn):
  npx impeccable@${IMPECCABLE_CLI_VERSION} install --providers=claude
Note: that turn-end check can take up to 30 seconds, and the wiring
lands in .claude/settings.local.json, which git does not track.`;

/**
 * Named in the prompt and printed instead of the enable-hooks text on a digest
 * mismatch (§5) — that is, to the user most likely to actually follow it, who
 * has just been told their payload may not be the reviewed one. So it names
 * everything, including the two things deleting directories does not reach: the
 * manifest entry that would otherwise assert an install that is gone, and the
 * commit the suspect bytes stay recoverable from.
 */
export const REMOVAL_NOTICE = `To remove it: delete .claude/skills/impeccable/ and .impeccable/,
then drop the "impeccable" entry from .summon/manifest.json.
The files are also in the add-on commit, so remove that commit too if you
want them out of the repository's history.`;

/**
 * The exact invocation (§4, as amended 2026-08-06). Exported so the flags that
 * carry the security argument are assertable in a test rather than buried in a
 * spawn call — a silent edit here would void §11's whole analysis.
 *
 * `--no-hooks` is unconditional. `--yes` is present only so impeccable's own
 * prompts do not nest inside Summon's; it cannot re-enable hooks, because the
 * vendor evaluates `installHooks = !flags.includes('--no-hooks')` independently
 * and every hook-wiring call site reads `installHooks && decideHookInstall(...)`
 * — the `&&` short-circuits before the yes-flag is ever consulted.
 *
 * `--providers=claude` confines the install to one tree. Without it, 3.5.0
 * reports "Installed impeccable into: .claude, .agents" and writes a second
 * ~152-file copy to `.agents/skills/impeccable/` — the cross-harness skills
 * convention. That second tree falls outside §5's one-directory digest scope
 * and outside the prompt's removal instructions, which would make §3's stated
 * file count and removal text false. The flag is what keeps them true.
 */
export const INSTALL_ARGS: readonly string[] = [
  "--yes",
  `impeccable@${IMPECCABLE_CLI_VERSION}`,
  "install",
  "--no-hooks",
  "--yes",
  "--providers=claude",
];

/** The manual escape hatch. There is no way to add impeccable to an existing project through Summon (§1). */
const MANUAL_COMMAND = `npx impeccable@${IMPECCABLE_CLI_VERSION} install --no-hooks --providers=claude`;

/** §6: a scaffolder that hangs is worse than one that skips. */
const INSTALL_TIMEOUT_MS = 120_000;

/**
 * §3's silent-path rule, and it is the whole of Pierrot's C6: a default-no prompt
 * that becomes default-yes when nobody is watching is not a default-no prompt.
 *
 * `--yes` / `--non-interactive` are checked even though `summon-team` does not
 * accept them today. The rule is about the shape of the decision, not about
 * which flags currently parse, so the guard should already be right on the day
 * someone adds them.
 */
export function shouldPrompt(opts: {
  isTTY: boolean;
  env: Record<string, string | undefined>;
  argv: string[];
}): boolean {
  if (!opts.isTTY) return false;
  // Any non-empty CI value disqualifies, including "false" — the variable's
  // presence is the signal, not its truthiness, and CI systems disagree on value.
  if (opts.env.CI) return false;
  if (opts.argv.includes("--yes") || opts.argv.includes("--non-interactive")) {
    return false;
  }
  return true;
}

/**
 * §3: default no. Enter, EOF, SIGINT and any unrecognised input all mean no.
 *
 * Deliberately an allowlist of two exact words. A near-miss like "yep" or "Y!"
 * is not consent, and the failure direction on a typo must be "did not install".
 */
export function isAffirmative(answer: string | null | undefined): boolean {
  if (answer === null || answer === undefined) return false;
  const normalized = answer.trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}

/**
 * §4 environment hygiene. `IMPECCABLE_BUNDLE_PATH` (`skills.mjs:561`) redirects
 * the bundle source to an arbitrary local directory or zip, validated only for
 * existence.
 *
 * Not an escalation on its own — it needs pre-existing environment control. But
 * a scaffolder that launders a caller-controlled variable into a third-party
 * installer is doing avoidable work for an attacker. The threat model says the
 * absence of this is a defect, not an omission.
 */
export function childEnv(
  env: Record<string, string | undefined>
): Record<string, string | undefined> {
  const copy = { ...env };
  // Case-insensitively, because Windows environment *lookup* ignores case while
  // the spread above preserves whatever casing the variable was actually set
  // with. `delete copy.IMPECCABLE_BUNDLE_PATH` would leave `Impeccable_Bundle_Path`
  // in place and visible to the child under any spelling — half-avoiding the
  // laundering this control exists to avoid entirely.
  for (const key of Object.keys(copy)) {
    if (key.toLowerCase() === "impeccable_bundle_path") delete copy[key];
  }
  return copy;
}

/**
 * `summon-tree-v1` (§5).
 *
 *   entry_i    = "<relative path>" + "\n" + sha256hex(LF-normalized content) + "\n"
 *   treeDigest = "sha256:" + sha256hex(entry_1 || entry_2 || ...)
 *
 * Traversal rules, pinned here because §5 does not state them and an unstated
 * rule is where a spurious mismatch comes from:
 *   - Regular files contribute their content. Directories are structure, not
 *     content.
 *   - Symlinks contribute their literal target string and are NOT walked
 *     through. Skipping them entirely (the obvious reading of "don't follow
 *     links") is a hole: a payload that plants
 *     `.claude/skills/impeccable/vendor -> ../../../.cache/x` gets a subtree
 *     that is inside the add-on root by every path a user would type, is absent
 *     from the blessed tree, changes no digest by its presence, and stays
 *     mutable forever with `matchedBlessed` still true. Hashing the target
 *     string makes the link's presence register while still refusing to follow
 *     it, so content cannot be counted twice or reached outside the root.
 *   - Empty directories do not contribute. They carry no content to hash.
 *   - Permission bits are not covered. The digest answers "did the bytes
 *     change", and a mode-only change is outside what §5 claims.
 *   - Paths are joined with "/" regardless of platform, so a Windows tree and a
 *     POSIX tree of the same content agree.
 *
 * Both the path and the content hash go into the concatenation, so a rename
 * with identical content changes the digest, as does swapping two files'
 * contents between their paths.
 *
 * Line endings normalize to LF before hashing (§5, following ADR-0006 #6):
 * an un-normalized hash reports a whole tree as modified on a Windows/autocrlf
 * checkout, and a check that cries wolf on a fresh clone is one people learn
 * to ignore.
 */
export function treeDigest(root: string): string {
  // Refuse a symlinked root outright. `existsSync`/`readdirSync` would follow it
  // and digest wherever it points, while REMOVAL_NOTICE's "delete
  // .claude/skills/impeccable/" would remove only the link and leave the real
  // tree on disk — a digest describing a directory the removal instruction does
  // not reach.
  const rootStat = lstatSync(root, { throwIfNoEntry: false });
  if (rootStat?.isSymbolicLink()) {
    throw new Error(`Refusing to hash ${root}: it is a symlink, not a directory.`);
  }

  // Each entry is [relative path, content hash]. Symlinks are entries too.
  const entries: Array<[string, string]> = [];

  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      // lstat, not stat: nothing here may follow a link.
      const st = lstatSync(full, { throwIfNoEntry: false });
      if (!st) continue;
      const rel = relative(root, full).split(sep).join("/");
      if (st.isSymbolicLink()) {
        // The target string, not the target's content. Presence registers; the
        // link is not walked through.
        entries.push([rel, sha256(`symlink:${readlinkSync(full)}`)]);
      } else if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile()) {
        entries.push([rel, sha256(normalizeLineEndings(readFileSync(full)))]);
      }
    }
  };
  walk(root);

  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  let concatenated = "";
  for (const [rel, hash] of entries) {
    concatenated += `${rel}\n${hash}\n`;
  }

  return `sha256:${sha256(concatenated)}`;
}

/**
 * CRLF -> LF on BYTES rather than on a decoded string. Lone CR is left ALONE.
 *
 * Mapping lone CR to LF as well would make the byte sequences `[0x0D]`,
 * `[0x0A]` and `[0x0D,0x0A]` all hash identically, so anyone with write access
 * could flip any LF to a CR anywhere in the tree without moving the digest.
 * That is not cosmetic in the payload's ~147 mostly-executable scripts: bash
 * does not treat CR as a line terminator, so turning the LF that ends a comment
 * into a CR swallows the following line into that comment and deletes whatever
 * it did. The extra collisions buy nothing either — git's `autocrlf` produces
 * CRLF, never a lone CR — so the rationale for normalizing never covered them.
 *
 * Decoding to UTF-8 first would be the obvious implementation and it is subtly
 * wrong for a tamper-detection digest: `Buffer.toString("utf-8")` maps every
 * invalid byte sequence to U+FFFD, so two different binary payloads decode to
 * the same string and hash identically. The payload is ~147 files of somebody
 * else's code fetched over an unverified channel (ADR-0014 §7), which makes
 * that collision attacker-reachable rather than theoretical — an attacker who
 * can shape the bundle can shape the bytes the digest never sees.
 *
 * Today's 4.0.4 payload happens to round-trip through UTF-8 losslessly on all
 * 147 files, so this produces a digest identical to the decoded form and the
 * blessed constant is unaffected. That is a property of this payload, not of
 * the algorithm, and it is not one to depend on across future releases.
 *
 * Byte 0x0D is CR and 0x0A is LF. Both are single-byte in UTF-8 and cannot
 * appear inside a multi-byte sequence (continuation bytes are all >= 0x80), so
 * scanning raw bytes cannot corrupt valid text either.
 */
function normalizeLineEndings(buf: Buffer): Buffer {
  const CR = 0x0d;
  const LF = 0x0a;
  const out = Buffer.allocUnsafe(buf.length);
  let n = 0;
  for (let i = 0; i < buf.length; i++) {
    // Only a CR immediately followed by LF collapses, to the single LF. A lone
    // CR is content and is copied through untouched.
    if (buf[i] === CR && buf[i + 1] === LF) {
      out[n++] = LF;
      i++;
    } else {
      out[n++] = buf[i];
    }
  }
  return out.subarray(0, n);
}

function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

function manifestPath(root: string): string {
  return join(root, ".summon", "manifest.json");
}

/**
 * The lax read lives in ../manifest (ADR-0006 #6's module) and is re-exported
 * here so this add-on's callers keep one import. §5's constraint carries over
 * there: unknown top-level keys survive, and a malformed file reads as absent.
 */
export { readManifest };

/**
 * Appends an add-on entry, creating the manifest if absent.
 *
 * §5 notes this is the first exception to ADR-0006 #1's "a Case A install writes
 * no manifest" — installing an add-on forces one to exist. The claim survives as
 * scoped, because it only fires when the user opts in; the default path still
 * writes nothing.
 *
 * `manifestVersion` stays 1. `addons` is optional and additive, and adding an
 * optional field is not a breaking change. Unknown top-level keys are preserved
 * on rewrite for the same forward-compatibility reason `readManifest` is lax.
 */
export function writeAddonEntry(
  root: string,
  entry: Record<string, unknown>,
  /**
   * The manifest as it looked BEFORE the installer ran. Pass it whenever an
   * untrusted process has had write access in between: the installer can write
   * its own `.summon/manifest.json` first, and since unknown keys are preserved
   * by design and `addons` is appended to, a payload could otherwise seed a
   * fabricated entry with `matchedBlessed: true` and have Summon rewrite and
   * commit it under a message saying the install was recorded. The artifact
   * that polices the payload must not be built on a base the payload supplied.
   */
  base?: Record<string, unknown> | null
): void {
  const existing = (base === undefined ? readManifest(root) : base) ?? {};
  const addons = Array.isArray(existing.addons) ? existing.addons : [];

  const next = {
    ...existing,
    manifestVersion: existing.manifestVersion ?? 1,
    addons: [...addons, entry],
  };

  mkdirSync(join(root, ".summon"), { recursive: true });
  writeFileSync(manifestPath(root), `${JSON.stringify(next, null, 2)}\n`);
}

/** §2's second commit, verbatim. Greppable, revertable, and visible in `git log`. */
function commitMessage(): string {
  return `chore: install impeccable design skill (opt-in third-party add-on)

Installed by summon-team with --no-hooks. Hooks are NOT wired; nothing
from this skill runs automatically. See .summon/manifest.json for the
recorded tree digest, and ADR-0014 for what that digest does and does
not verify.

Source: npm:impeccable@${IMPECCABLE_CLI_VERSION} (CLI) -> https://impeccable.style bundle (payload)`;
}

interface InstallOutcome {
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
  timedOut: boolean;
  interrupted: boolean;
  /** False when the OS gave no way to guarantee descendants are dead. */
  descendantsReaped: boolean;
}

/**
 * Runs the vendor installer under a real time bound.
 *
 * `spawnSync`'s `timeout`/`killSignal` looked like it did this and did not: the
 * signal reaches the direct child (`npx`) only, while the node process `npx`
 * execs — the one actually fetching and extracting 3.3 MB — is left running and
 * reparented to init. The old code then deleted the tree out from under a live
 * writer and printed "unaffected" while third-party code kept writing. §6 sells
 * the cap as bounding the add-on's *execution*; `spawnSync` bounded Summon's
 * *wait*. Those are different guarantees and only the weaker one was true.
 *
 * So: `detached` puts the child in its own process group, and the timeout kills
 * the whole group. Where the platform cannot guarantee that, we say so and let
 * the caller decline to clean up rather than race a writer.
 */
function runInstaller(
  targetDir: string,
  env: Record<string, string | undefined>
): Promise<InstallOutcome> {
  // detached creates a process group on POSIX. On Windows it spawns a new
  // console instead and there are no process groups to signal, so we don't.
  const canGroupKill = process.platform !== "win32";

  return new Promise((resolve) => {
    const child = spawn("npx", [...INSTALL_ARGS], {
      cwd: targetDir,
      env,
      stdio: "inherit",
      detached: canGroupKill,
    });

    let timedOut = false;
    let interrupted = false;
    let settled = false;

    const killTree = (): boolean => {
      if (child.pid === undefined) return false;
      if (canGroupKill) {
        try {
          // Negative pid signals the whole group, which is the point.
          process.kill(-child.pid, "SIGKILL");
          return true;
        } catch {
          /* group already gone, or never formed */
        }
      }
      try {
        child.kill("SIGKILL");
      } catch {
        /* already dead */
      }
      return false;
    };

    let descendantsReaped = true;
    const timer = setTimeout(() => {
      timedOut = true;
      descendantsReaped = killTree();
    }, INSTALL_TIMEOUT_MS);

    // With `detached`, the child is no longer in the terminal's foreground
    // group, so a Ctrl-C reaches Summon and not the installer. Forwarding it is
    // what keeps §6's "Ctrl-C must never produce a broken project" true.
    const onSigint = () => {
      interrupted = true;
      descendantsReaped = killTree();
    };
    process.once("SIGINT", onSigint);

    const finish = (outcome: Omit<InstallOutcome, "timedOut" | "interrupted" | "descendantsReaped">) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      process.removeListener("SIGINT", onSigint);
      resolve({ ...outcome, timedOut, interrupted, descendantsReaped });
    };

    child.once("error", (error) => finish({ status: null, signal: null, error }));
    child.once("exit", (status, signal) => finish({ status, signal }));
  });
}

interface OfferOptions {
  /** The finished, already-committed project directory. */
  targetDir: string;
  isTTY?: boolean;
  env?: Record<string, string | undefined>;
  argv?: string[];
  log?: (message: string) => void;
  /** Injected for tests; defaults to a real readline prompt on stdin. */
  ask?: (prompt: string) => Promise<string | null>;
}

async function askOnStdin(prompt: string): Promise<string | null> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // Ctrl-C must resolve null so it reads as "no" (§3). Closing the interface is
  // NOT enough: an in-flight `rl.question()` promise from node:readline/promises
  // stays pending forever after `rl.close()`, and attaching a SIGINT listener
  // also suppresses Node's default termination — together those hang the CLI
  // just after a successful, already-committed scaffold. Aborting the question
  // is what actually settles it.
  const controller = new AbortController();
  const onSigint = () => controller.abort();
  rl.once("SIGINT", onSigint);

  try {
    return await rl.question(prompt, { signal: controller.signal });
  } catch {
    // AbortError (SIGINT) and EOF both land here, and both mean no.
    return null;
  } finally {
    rl.close();
  }
}

/**
 * The add-on phase (§2 step 2-3). Runs LAST, after the scaffold is complete and
 * committed, which is what makes §6's failure posture structural rather than a
 * promise: nothing here can leave a half-scaffolded project, because the project
 * is already finished before the prompt is shown.
 *
 * Never throws and never exits non-zero. Add-on failure is non-fatal to the
 * scaffold, always, with no flag to change it (§6).
 */
export async function offerImpeccable(options: OfferOptions): Promise<void> {
  const {
    targetDir,
    // Both streams, not just stdin. With stdout redirected (`summon-team ... |
    // tee log`) the prompt text goes into the pipe, the user sees nothing, and
    // the process blocks waiting on an answer to a question never displayed.
    isTTY = process.stdin.isTTY === true && process.stdout.isTTY === true,
    env = process.env,
    argv = process.argv.slice(2),
    log = (m: string) => console.log(m),
    ask = askOnStdin,
  } = options;

  if (!shouldPrompt({ isTTY, env, argv })) {
    // §3: say it was skipped and how to do it manually. Never install silently.
    log(
      `Skipped the optional impeccable design skill (non-interactive).\n` +
        `To install it yourself:  ${MANUAL_COMMAND}`
    );
    return;
  }

  const answer = await ask(CONSENT_PROMPT);
  if (!isAffirmative(answer)) {
    // §6: answering no is not a failure. It is the default and the expected
    // answer, and the CLI must not editorialise about it.
    return;
  }

  const addonPath = resolve(targetDir, ADDON_ROOT);
  // Recorded BEFORE spawning so cleanup never destroys a pre-existing install (§6).
  const preExisting = existsSync(addonPath);
  // Sampled for the same reason: everything below this line runs after arbitrary
  // third-party code has had write access to targetDir, so this snapshot — not
  // whatever is on disk afterwards — is the base the manifest is rebuilt from.
  const manifestBefore = readManifest(targetDir);

  const cleanup = (): void => {
    if (preExisting || !existsSync(addonPath)) return;
    try {
      rmSync(addonPath, { recursive: true, force: true });
    } catch {
      log(
        `Could not clean up after the failed install. Remove it manually: ${addonPath}`
      );
    }
  };

  const failed = (reason: string): void => {
    cleanup();
    // Say what is true. `cleanup()` removes ADDON_ROOT and nothing else, while a
    // mid-install failure has usually already created `.impeccable/` and whatever
    // preceded the failing step. "Your project is complete and unaffected" is
    // false in exactly the circumstance it prints in, at the moment the user is
    // least inclined to go looking.
    log(
      `${reason}\nYour scaffold is complete and committed. The failed install may ` +
        `have left files behind — check \`git status\` and .impeccable/.`
    );
    log(`To try the design skill yourself later:  ${MANUAL_COMMAND}`);
  };

  // The installer inherits this terminal, so its output is visually
  // indistinguishable from Summon's and it can read stdin. `--yes` suppresses
  // the vendor's legitimate prompts, which makes ANY prompt in this window
  // anomalous — but only if the user knows where Summon stopped talking. A
  // payload printing "Enter your npm token to continue:" otherwise collects a
  // credential the user believes they are giving Summon. Inheriting is still
  // right for a 3.3 MB download the user should see progress on; the fix is to
  // mark the boundary, not to hide the output.
  log(`--- output below is from impeccable, not from Summon ---`);
  const result = await runInstaller(targetDir, childEnv(env));
  log(`--- end of impeccable output ---`);

  if (result.timedOut || result.interrupted) {
    const what = result.timedOut
      ? `The impeccable install exceeded ${INSTALL_TIMEOUT_MS / 1000}s and was stopped.`
      : `The impeccable install was interrupted.`;
    if (result.descendantsReaped) {
      failed(what);
    } else {
      // Deleting a tree while a surviving writer is still extracting into it
      // produces a half-deleted, half-written state that is worse than leaving
      // it. Say so and name the path instead of cleaning up blind.
      log(
        `${what}\nSummon could not confirm the installer and its children had ` +
          `stopped, so it did NOT delete anything — removing files under a live ` +
          `writer would leave a worse mess. Nothing was recorded and nothing was ` +
          `committed.\nCheck and remove manually if needed: ${addonPath}`
      );
      log(`To try the design skill yourself later:  ${MANUAL_COMMAND}`);
    }
    return;
  }
  if (result.error) {
    failed(`The impeccable install could not run: ${result.error.message}`);
    return;
  }
  if (result.signal) {
    failed(`The impeccable install was killed (${result.signal}).`);
    return;
  }
  if (result.status !== 0) {
    failed(
      `The impeccable install failed (exit ${result.status}). It fetches its payload ` +
        `from https://impeccable.style/api/download/bundle/universal — if that is ` +
        `unreachable, this is a vendor outage rather than a problem with your project.`
    );
    return;
  }

  if (!existsSync(addonPath)) {
    failed(`The impeccable install reported success but wrote nothing to ${ADDON_ROOT}.`);
    return;
  }

  // §6: hashing failure IS install failure. No manifest entry without a digest —
  // an entry with an empty digest would be worse than none, because `doctor`
  // would report it as intact.
  let observed: string;
  try {
    observed = treeDigest(addonPath);
  } catch (err) {
    failed(
      `Could not hash the installed files, so nothing was recorded: ` +
        `${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  const matchedBlessed = BLESSED_TREE_DIGEST !== null && observed === BLESSED_TREE_DIGEST;

  // Guarded for the same reason the hash is: §6 forbids the add-on from being
  // fatal to the scaffold, and this can throw. `readManifest` parses a file the
  // untrusted installer just had write access to, and the write itself can fail
  // on EACCES/EROFS/ENOSPC. Unguarded, that escapes to `main().catch` and exits
  // 1 on a completed scaffold — the exact posture §6 forbids.
  // The installer writing a manifest is not normal and is worth saying out loud
  // — it is the shape of an attempt to seed a record Summon would then sign.
  const manifestAfter = readManifest(targetDir);
  if (JSON.stringify(manifestAfter) !== JSON.stringify(manifestBefore)) {
    log(
      `Note: the installer modified .summon/manifest.json. Summon has discarded ` +
        `those changes and recorded its own result instead.`
    );
  }

  try {
    writeAddonEntry(targetDir, {
      name: "impeccable",
      installer: `npm:impeccable@${IMPECCABLE_CLI_VERSION}`,
      payloadVersion: PAYLOAD_VERSION,
      root: ADDON_ROOT,
      installedAt: new Date().toISOString(),
      digestAlgorithm: DIGEST_ALGORITHM,
      treeDigest: observed,
      matchedBlessed,
      // Summon never sets this true (§5). It records what Summon did, not the
      // state of the world — a user who wires hooks later does not change it.
      hooksWired: false,
    }, manifestBefore);
  } catch (err) {
    failed(
      `Installed impeccable, but could not record it in .summon/manifest.json: ` +
        `${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  // §2: a trust decision that leaves no trace in version control is one nobody
  // can audit later. Best-effort, like the scaffold's own `git init`.
  //
  // Staged explicitly rather than with `git add -A`. The digest covers one
  // directory, but the installer runs with write access to the whole project —
  // so a blanket add would sweep a payload's edits to CLAUDE.md, `.claude/agents/*`
  // or a dropped credential into a commit labelled "install impeccable design
  // skill". That is both attribution laundering and a change the digest cannot
  // see. Anything the installer touched outside its declared footprint is
  // information the user should be shown, not something a commit should swallow.
  try {
    // Only paths that actually exist. `git add` fails the whole invocation on a
    // pathspec matching nothing, and `.impeccable/` is not created under
    // --no-hooks --providers=claude — so naming it unconditionally aborts the
    // add, skips the commit, and leaves the add-on uncommitted in a dirty tree.
    const toStage = [ADDON_ROOT, ".impeccable", ".summon/manifest.json"].filter((rel) =>
      existsSync(resolve(targetDir, rel))
    );
    execFileSync("git", ["add", "--", ...toStage], { cwd: targetDir, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", commitMessage()], {
      cwd: targetDir,
      stdio: "ignore",
    });

    const stray = execFileSync("git", ["status", "--porcelain"], {
      cwd: targetDir,
      encoding: "utf-8",
    }).trim();
    if (stray) {
      log(
        `The installer also changed files outside its own directory. These were ` +
          `NOT committed, and Summon's digest does not cover them:\n${stray}`
      );
    }
  } catch {
    log("Installed impeccable, but could not commit it. Commit it yourself to keep the record.");
  }

  if (matchedBlessed) {
    log(HOOKS_ENABLE_NOTICE);
    return;
  }

  // §5, and the one place the digest changes behaviour rather than only text:
  // withhold the enable-hooks instruction and print removal instead. The signal
  // is genuinely ambiguous — an upstream release looks exactly like an attack —
  // so the wording must not assert which one happened.
  log(
    `The impeccable payload you received is not the payload Summon reviewed.\n` +
      `  expected  ${BLESSED_TREE_DIGEST ?? "(nothing blessed yet)"}\n` +
      `  received  ${observed}\n` +
      `This usually means upstream shipped a new release, but Summon cannot tell\n` +
      `that apart from tampering. The files are on disk and nothing runs them.\n` +
      REMOVAL_NOTICE
  );
}
