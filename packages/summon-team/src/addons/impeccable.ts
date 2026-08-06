// agent-notes: { ctx: "opt-in impeccable add-on: consent, install, digest (ADR-0014)", deps: ["node:crypto", "node:child_process"], state: active, last: "claude@2026-08-06" }

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

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createInterface } from "node:readline/promises";
import { join, relative, resolve, sep } from "node:path";

/** The pinned downloader. ADR-0010's cooldown reaches this artifact (it is a named version). */
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

/** Named in the prompt and printed instead of the enable-hooks text on a digest mismatch (§5). */
export const REMOVAL_NOTICE = `To remove it: delete .claude/skills/impeccable/ and .impeccable/.`;

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
  delete copy.IMPECCABLE_BUNDLE_PATH;
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
 *   - Regular files only. Directories are structure, not content; symlinks are
 *     skipped rather than followed, so a link cannot smuggle content in twice
 *     or walk out of the tree.
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
  const files: string[] = [];

  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      // lstat, not stat: a symlink must not be followed. Under lstat a link is
      // neither a file nor a directory, so it falls through both branches and is
      // skipped — it cannot hash content twice or reach outside the tree.
      const st = lstatSync(full, { throwIfNoEntry: false });
      if (!st) continue;
      if (st.isDirectory()) walk(full);
      else if (st.isFile()) files.push(full);
    }
  };
  walk(root);

  const relativePaths = files
    .map((f) => relative(root, f).split(sep).join("/"))
    .sort();

  let concatenated = "";
  for (const rel of relativePaths) {
    const normalized = readFileSync(join(root, rel))
      .toString("utf-8")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    concatenated += `${rel}\n${sha256(normalized)}\n`;
  }

  return `sha256:${sha256(concatenated)}`;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function manifestPath(root: string): string {
  return join(root, ".summon", "manifest.json");
}

/**
 * Reads `.summon/manifest.json`, or null when there isn't one.
 *
 * §5: the schema must NOT be strict on unknown top-level keys. An older
 * `summon-team` reading a newer manifest must ignore fields it does not know,
 * not hard-fail — forward compatibility across CLI versions is the entire point
 * of a persistent on-disk artifact, and strictness would turn every future
 * additive field into a breaking change.
 *
 * That is why this returns parsed JSON rather than validating against a schema.
 * When #8 builds the real ADR-0006 manifest module, this constraint carries over
 * to it: whatever validator it uses must be non-strict at the top level.
 */
export function readManifest(root: string): Record<string, unknown> | null {
  const path = manifestPath(root);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
}

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
  entry: Record<string, unknown>
): void {
  const existing = readManifest(root) ?? {};
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
  // SIGINT resolves null rather than throwing, so Ctrl-C reads as "no" (§3).
  const onSigint = () => rl.close();
  rl.once("SIGINT", onSigint);
  try {
    return await rl.question(prompt);
  } catch {
    return null; // EOF
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
    isTTY = process.stdin.isTTY === true,
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
    log(`${reason}\nYour project is complete and unaffected.`);
    log(`To try the design skill yourself later:  ${MANUAL_COMMAND}`);
  };

  const result = spawnSync(
    "npx",
    [...INSTALL_ARGS],
    {
      cwd: targetDir,
      env: childEnv(env),
      stdio: "inherit",
      timeout: INSTALL_TIMEOUT_MS,
      killSignal: "SIGKILL",
    }
  );

  if (result.error && (result.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
    failed(`The impeccable install exceeded ${INSTALL_TIMEOUT_MS / 1000}s and was stopped.`);
    return;
  }
  if (result.error) {
    failed(`The impeccable install could not run: ${result.error.message}`);
    return;
  }
  if (result.signal) {
    // Includes Ctrl-C during install. §6: that must never produce a broken project.
    failed(`The impeccable install was interrupted (${result.signal}).`);
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
  });

  // §2: a trust decision that leaves no trace in version control is one nobody
  // can audit later. Best-effort, like the scaffold's own `git init`.
  try {
    execFileSync("git", ["add", "-A"], { cwd: targetDir, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", commitMessage()], {
      cwd: targetDir,
      stdio: "ignore",
    });
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
