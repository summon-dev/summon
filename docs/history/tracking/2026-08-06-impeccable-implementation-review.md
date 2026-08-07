<!-- agent-notes: { ctx: "Pierrot security review of the impeccable add-on (ADR-0014 §11 item 8)", deps: [packages/summon-team/src/addons/impeccable.ts, packages/summon-team/src/doctor.ts, packages/summon-team/src/index.ts], state: active, last: "pierrot@2026-08-06" } -->

# Security review — impeccable add-on implementation

**Reviewer:** Pen-testing Pierrot
**Date:** 2026-08-06
**Branch:** `feat/72-impeccable-addon-prompt`
**Scope:** `packages/summon-team/src/addons/impeccable.ts` (540 lines) and its single call site at `src/index.ts:295`.
**Mandate:** ADR-0014 §11 item 8.

**Verdict: VETO on Finding 4.** One user-facing claim in the consent prompt describes a control that does
not exist in the shipping code. Consent obtained on a false premise is not consent. Remediation is a
wording change; it is cheap, and it must land before merge.

Grades: Critical / Important / Minor, each with a proof grade — deterministic (provable from code or from a
run I executed), inferential (follows from documented runtime behaviour), judgement (calibrated opinion
about severity or wording).

---

## Verdict on the three §11 item-8 invariants

| Invariant | Status |
|---|---|
| §4 — `--no-hooks` unconditional, `IMPECCABLE_BUNDLE_PATH` stripped | **Implemented.** `INSTALL_ARGS` is a frozen-by-convention `readonly string[]` with `--no-hooks` literal, spread at the one spawn site with no conditional anywhere in the module. `childEnv` deletes the variable from a copy before it reaches `spawnSync`. One caveat: Finding 10 (Windows case-insensitivity). |
| §6 — no manifest entry and no second commit unless install succeeded AND hashed | **Implemented.** Every one of the six failure branches (`ETIMEDOUT`, generic `error`, `signal`, non-zero `status`, nothing-written, hash-threw) `return`s before `writeAddonEntry`. The commit is unreachable except through a successful `writeAddonEntry`. The inverse case — manifest written, commit fails — is caught, logged, and is the safe direction. |
| §6 — add-on failure non-fatal to the scaffold, always | **NOT implemented as claimed.** See Finding 6: `writeAddonEntry`/`readManifest` are unguarded and can throw out of `offerImpeccable`, through `main().catch` at `index.ts:307`, to `process.exit(1)`. The docblock's "Never throws and never exits non-zero" is false. |
| §6 — 120s cap real | **Implemented, and bounds only the direct child.** I confirmed by execution that `spawnSync` on timeout sets `result.error.code === "ETIMEDOUT"` (Node v24.3.0), so the detection branch at line 454 fires correctly. See Finding 7 for what the cap does not reach. |
| §6 — cleanup removes the tree only if Summon created it | **Implemented, and correctly ordered.** `preExisting` is sampled at line 423, before the spawn, not after. `rmSync` with `recursive` uses `lstat` internally, so a symlink at the addon root would be unlinked rather than followed into the user's home. |
| §3 — default no; no prompt when non-TTY / `CI` / `--yes` / `--non-interactive` | **Implemented.** The raw `process.argv.slice(2)` is threaded through (`index.ts:98` → `:295`), so the flag checks see real flags. `shouldPrompt` returning false takes an early `return` — there is no path in the module where the prompt is skipped and the install still runs. |
| §5 — exactly one user-facing claim | **VIOLATED.** Finding 4. |

---

## Critical (veto-worthy)

### Finding 4 — the consent prompt promises a `doctor` check that does not exist

**Grade:** Critical · **Proof:** deterministic (code)
**Location:** `impeccable.ts:88-90` (`CONSENT_PROMPT`), contradicted by `packages/summon-team/src/doctor.ts`

The prompt tells the user, at the moment they are deciding whether to run unverified third-party code:

```
  What Summon   It records a checksum of the files after they land.
  does about it `summon-team doctor` warns if they change later. That
                detects drift. It does not verify the download.
```

`doctor.ts` contains **zero** references to `.summon`, `manifest`, `addons`, or `treeDigest`. I grepped the
entire `src/` tree: the only two files that mention addons or digests are `impeccable.ts` itself and the
`index.ts` line that calls it. `summon-team doctor` will never warn if these files change, today or on any
commit in this branch. The digest is written to a manifest that nothing reads.

Why this is Critical rather than Important: this sentence is the *entire consideration* offered in exchange
for consent. The prompt is otherwise scrupulously honest — it concedes the payload is unversioned,
unchecksummed, fetched over a channel Summon cannot verify, and that ~147 mostly-executable files land on
disk. The one thing it offers back is post-hoc drift detection, and that is the thing that isn't there. A
user who reads this prompt carefully — which is exactly the user §3 is written for — accepts a risk on the
strength of a compensating control that is vapour. That is a consent-integrity defect, and consent is the
whole security model of an opt-in add-on.

It also breaks §5 on its face. §5 permits exactly one claim: *"Summon records what landed on disk so you
can tell later if it changed. It does not verify that what landed was genuine."* Note the permitted phrasing
is passive about the mechanism — "so you can tell later" is satisfied by a manifest a human can diff against
a recomputed hash. The implementation went further and named a tool and a behaviour. Naming a behaviour the
binary does not have is overclaiming, and §5 exists to prevent precisely this.

**Remediation, either is acceptable:**

- **Cheap (recommended for this PR):** reword to the §5-permitted claim. `It records a checksum of the
  files after they land, in .summon/manifest.json, so you can tell later if they changed. It does not
  verify the download.` Drop the `doctor` sentence entirely until the check exists.
- **Expensive:** implement the `doctor` check in this PR. If you take this route, read Finding 8 first —
  the manifest it would read is writable by the untrusted payload before Summon writes to it.

The same overclaim is echoed in the commit message (`impeccable.ts:354-356`, "See `.summon/manifest.json`
for the recorded tree digest") — that one is *true* and can stay; it claims a record exists, not that a
tool inspects it.

---

## Important

### Finding 1 — `git add -A` stages the whole project, but the digest covers one directory

**Grade:** Important · **Proof:** deterministic (code)
**Location:** `impeccable.ts:514`

```ts
execFileSync("git", ["add", "-A"], { cwd: targetDir, stdio: "ignore" });
```

The installer is arbitrary third-party code running with the user's privileges in `targetDir`. Its write
scope is the entire project. The digest's scope (`ADDON_ROOT = .claude/skills/impeccable`) is one directory,
and §5 is deliberate about that. `git add -A` sits astride the gap: everything the installer wrote or
*modified* anywhere in the tree — `.impeccable/`, a `settings.local.json`, an edit to a tracked `CLAUDE.md`
or `.claude/agents/*.md`, a stray credential file dropped by a postinstall step — is staged and lands in a
commit whose message says "install impeccable design skill".

Two consequences:

1. **Attribution laundering.** A modification to a Summon-authored file is committed under a message
   describing it as a third-party skill install. Someone reading `git log` later sees one plausible commit,
   not an anomaly. The commit is the audit trail §2 is buying, and an audit trail that absorbs unbounded
   content is a weaker trail than it looks.
2. **Changes that are undetectable by construction.** Anything outside `ADDON_ROOT` is committed but never
   hashed, so no future drift check can notice it, and `REMOVAL_NOTICE` does not undo it.

This is not a claim that impeccable 3.5.0 does any of this — the end-to-end run shows a clean tree and no
`settings.local.json`. It is a claim about what the code permits an *unverified future payload* to do, which
is the exact threat ADR-0014 §7 concedes is live. The payload is re-downloaded, unversioned, on every
update; "what 3.5.0 does today" is not a control.

**Recommended fix:** stage explicitly — `git add -- .claude/skills/impeccable .impeccable
.summon/manifest.json` — and after the install, if `git status --porcelain` reports anything else dirty,
print it rather than committing it. An installer that touched files outside its declared footprint is
information the user should see, not information a commit should swallow.

---

### Finding 2 — the failure path's cleanup is narrower than the installer's write scope, and the message asserts more than the code delivers

**Grade:** Important · **Proof:** deterministic (code)
**Location:** `impeccable.ts:425-440`

`cleanup()` removes exactly one path, `ADDON_ROOT`. `failed()` then prints:

> `Your project is complete and unaffected.`

On a mid-install failure — timeout, non-zero exit, network death partway through — the installer has
typically already created `.impeccable/` and whatever else precedes the failing step. None of it is removed,
none of it is mentioned, and the user is told the project is unaffected. The sentence is false in precisely
the circumstance it is printed in, and it is printed at the moment the user is least inclined to go looking.

The same message prints when `preExisting === true`, where cleanup deliberately does nothing (correct — it
must not destroy a working prior install). There, a failed install may have partially overwritten that prior
install and the user is told nothing changed. That path is close to unreachable today because the scaffolder
refuses a non-empty target directory, which is what holds this at Important rather than Critical — but see
the known brownfield gap; if the scaffolder ever accepts a non-empty directory, this becomes a data-loss
message that lies.

**Recommended fix:** say what is true. `Your scaffold is complete and committed. The failed install may
have left files behind — check git status and .impeccable/.` Same length, no lie.

---

### Finding 3 — SIGINT at the consent prompt does not resolve `null`; it hangs

**Grade:** Important · **Proof:** deterministic (executed)
**Location:** `impeccable.ts:372-384`

```ts
const onSigint = () => rl.close();
rl.once("SIGINT", onSigint);
```

The comment directly above states: *"SIGINT resolves null rather than throwing, so Ctrl-C reads as 'no'
(§3)."* It does not. I ran it on Node v24.3.0: an in-flight `rl.question()` promise from
`node:readline/promises` is **still pending** after `rl.close()` — the question callback is never invoked
and the promise never settles. Attaching a `SIGINT` listener to the interface also suppresses Node's default
SIGINT termination while that listener is live. Composed: the first Ctrl-C closes the interface and leaves
`offerImpeccable` awaiting a promise that will never settle, so `main()` never resolves.

The security *direction* is safe — nothing installs, so §3's "SIGINT means no" holds on the outcome, and I
am not vetoing on it. What fails is the stated mechanism: the CLI appears to hang immediately after a
successful, already-committed scaffold, and the user's next move is a second Ctrl-C or a kill. A security
control whose comment describes behaviour the code does not have is a control the next maintainer will
"preserve" while changing.

**Recommended fix:** wire an `AbortController` to `SIGINT` and pass `{ signal }` to `rl.question`, catching
the resulting `AbortError` into `null`. That makes the comment true and the behaviour match §3.

---

### Finding 5 — the digest has two blind spots a payload can steer into: symlinked subtrees, and CR/LF equivalence

**Grade:** Important · **Proof:** deterministic (code)
**Location:** `impeccable.ts:229-240` (`walk`), `:276-291` (`normalizeLineEndings`)

**(a) Symlinked directories are invisible content.** Under `lstatSync`, a symlink is neither `isFile()` nor
`isDirectory()`, so it falls through both branches and is skipped. The docblock frames this as a defence
("a link cannot smuggle content in twice or walk out of the tree") and for *exfiltrating existing content*
it is. But it also means content reachable *under* `ADDON_ROOT` via a symlinked directory contributes
nothing to the digest. A payload that plants `.claude/skills/impeccable/vendor -> ../../../.cache/x` gets a
subtree that is inside the add-on root by every path the user would type, is not in the blessed tree, does
not change the digest by its presence, and can be mutated freely forever. `matchedBlessed` stays true. If
Finding 4's `doctor` check is ever built, it reports intact.

The mirror case: if `ADDON_ROOT` *itself* is a symlink, `existsSync` at line 476 follows it, `readdirSync`
inside `walk` follows it, and the digest is computed over wherever it points — while `REMOVAL_NOTICE`'s
"delete `.claude/skills/impeccable/`" removes only the link, leaving the real tree on disk.

**(b) CR/LF normalization is a deliberate, exploitable collision class.** `normalizeLineEndings` maps
CRLF → LF *and lone CR → LF*. So the byte sequences `[0x0D]`, `[0x0A]`, and `[0x0D,0x0A]` all hash
identically. An on-disk attacker can flip any 0x0A to 0x0D, or vice versa, in any file in the tree without
changing the digest. In a shell script that is not cosmetic — bash does not treat CR as a line terminator,
so converting the LF that ends a comment line into a CR merges the *next* line into the comment and deletes
its effect:

```
# validate input      <-- LF here: next line executes
check_args "$@"

# validate input      <-- CR here: whole thing is one comment, check is gone
check_args "$@"
```

Same digest. The payload is described in the prompt as "most of them executable scripts", so this is the
file type at issue. Note that the lone-CR mapping is not required by the stated rationale — git's `autocrlf`
produces CRLF, never lone CR — so the extra collisions buy nothing. This is the same defect class as the
UTF-8-decode collision already found and fixed, one layer down.

**Recommended fix:** (a) treat a symlink encountered during the walk as a digest input rather than a
skip — hash the literal link target string under its path (`entry = path + "\n" + sha256("symlink:" +
readlinkSync(p)) + "\n"`), and refuse to walk through it. Presence then registers. (b) Collapse `CRLF → LF`
only; leave lone CR bytes alone. Both change `BLESSED_TREE_DIGEST` and so require re-blessing in the same PR.

---

### Finding 6 — `writeAddonEntry` is unguarded, so `offerImpeccable` can throw and exit 1

**Grade:** Important · **Proof:** deterministic (code)
**Location:** `impeccable.ts:314-347`, `:497-509`; escapes via `index.ts:307`

The module docblock promises: *"Never throws and never exits non-zero. Add-on failure is non-fatal to the
scaffold, always, with no flag to change it (§6)."* The spawn result, the digest, and the git commit are all
guarded. `writeAddonEntry` is not, and it does three things that throw:

- `readManifest` → `JSON.parse(readFileSync(...))` with no try/catch. A malformed `.summon/manifest.json`
  throws `SyntaxError`.
- `mkdirSync` / `writeFileSync` throw on `EACCES`, `EROFS`, `ENOSPC`.

There is no `.catch` on the `await` at `index.ts:295`; `main().catch` logs and calls `process.exit(1)`. So a
completed scaffold plus a completed install can still end in a non-zero exit and a stack-trace-flavoured
error, which is the exact posture §6 forbids. Who writes a malformed manifest? The payload can — it is
arbitrary code that runs in `targetDir` before this line executes. Impact is limited (denial plus a missing
record, no code execution), which holds it at Important.

**Recommended fix:** wrap lines 497-509 in the same `try`/`catch` shape as the digest, and route it through
`failed()`. Also guard `readManifest`'s parse and return `null` on a malformed file rather than throwing —
though see Finding 8 before deciding what "recover" means there.

---

### Finding 7 — the 120s cap kills `npx`, not the installer, and cleanup then races a live writer

**Grade:** Important · **Proof:** inferential (POSIX process semantics; timeout detection itself verified by execution)
**Location:** `impeccable.ts:442-457`

`killSignal: "SIGKILL"` is delivered to the direct child only — `npx`. `npx` execs or spawns node, which
runs the installer, which fetches a 3.3 MB bundle. SIGKILL to the parent does not signal the process group
and leaves descendants running and reparented to init. So on timeout:

1. `spawnSync` returns with `error.code === "ETIMEDOUT"` (verified by execution).
2. `failed()` → `cleanup()` → `rmSync(addonPath, { recursive: true })`.
3. The orphaned installer is *still extracting into that directory*, so files reappear after the delete —
   a partial, half-deleted, half-written tree with no manifest entry and no commit.
4. `summon-team` prints "Your project is complete and unaffected" and exits 0 while third-party code
   continues to run and write to the user's disk.

Step 4 is the part I object to most: the cap is sold in §6 as bounding the add-on's execution, and it bounds
Summon's *wait*, not the payload's *runtime*. Those are different guarantees and the code and the ADR say
the stronger one. The same reasoning applies to the `result.signal` branch — Ctrl-C during install reaches
`npx` via the foreground process group, but a grandchild that changed its process group survives.

**Recommended fix:** spawn with `detached: true` to create a process group, and on timeout or signal kill
the group (`process.kill(-child.pid, "SIGKILL")`) — which `spawnSync` cannot do, so this means moving to
`spawn` plus an awaited promise. Failing that, do not delete the tree on a timeout at all: leave it and tell
the user, since deleting under a live writer produces a worse state than leaving it. And soften the
"unaffected" line here specifically (it overlaps Finding 2).

---

### Finding 8 — the manifest Summon writes is derived from a file the untrusted payload can pre-seed

**Grade:** Important · **Proof:** deterministic (code)
**Location:** `impeccable.ts:332-347`

`writeAddonEntry` reads the existing manifest, spreads it, and appends. It runs *after* the third-party
installer has had full write access to `targetDir`. A payload that writes its own `.summon/manifest.json`
first controls every field Summon does not overwrite: unknown top-level keys are preserved by design
(`...existing`), and `addons` is preserved and appended to — so the payload can seed a fabricated addon entry
with `matchedBlessed: true`, `hooksWired: false`, and any `root` it likes. Summon then rewrites the file,
commits it with `git add -A` (Finding 1), and the fabrication is now inside a Summon-authored commit that
says the install was verified.

Impact today is nil, because nothing reads the manifest (Finding 4). That is the only reason this is not
Critical, and it inverts the moment `doctor` learns to read it: the artifact that polices the payload is
writable by the payload. The forward-compatibility argument for laxity in `readManifest` is sound for
*unknown keys*; it is not an argument for trusting `addons` entries that Summon did not write.

**Recommended fix:** sample the manifest **before** the spawn, exactly as `preExisting` is sampled, and
write the post-install entry onto that pre-install snapshot. If the on-disk manifest changed during the
install, that is a finding to report, not a base to build on.

---

## Minor

### Finding 9 — `summon-tree-v1` concatenates unescaped paths, so the digest is not injective

**Grade:** Minor · **Proof:** deterministic (code)
**Location:** `impeccable.ts:243-253`

`entry = rel + "\n" + hash + "\n"`, concatenated. POSIX filenames may contain `\n`. A file named
`a\n<sha256 of X>\nb` containing `Y` produces exactly the same digest input as two files `a` (containing
`X`) and `b` (containing `Y`). The construction has no length prefix and no escaping, which is the textbook
canonicalization failure for tree hashes.

I am grading this Minor rather than Important on exploitability, not on correctness: the useful attack
direction (add malicious content while holding the digest fixed) requires the attacker to *remove* the
folded file's content from disk in exchange, so it does not straightforwardly buy an extra live file. But
the property "one digest, one tree" is false, and it is cheap to make true.

**Recommended fix:** hex- or JSON-encode the path, or length-prefix each field. Changes
`BLESSED_TREE_DIGEST`; re-bless in the same PR.

### Finding 10 — `IMPECCABLE_BUNDLE_PATH` deletion is case-sensitive; Windows environment lookups are not

**Grade:** Minor · **Proof:** inferential (Windows environment semantics)
**Location:** `impeccable.ts:192-198`

`delete copy.IMPECCABLE_BUNDLE_PATH` removes exactly one spelling. `process.env` on Windows is
case-insensitive for *lookup*, but the spread produces a plain object carrying whatever casing the variable
was actually set with. A variable set as `Impeccable_Bundle_Path` survives the delete and is visible to the
child under any casing. This requires pre-existing environment control, which the docblock already
identifies as the precondition — the point of §4's control is to avoid laundering it anyway, and a
case-sensitive delete only half-avoids it.

**Recommended fix:** delete case-insensitively — iterate keys and drop any whose lowercase form is
`impeccable_bundle_path`.

### Finding 11 — `REMOVAL_NOTICE` under-describes removal

**Grade:** Minor · **Proof:** deterministic (code) · judgement on severity
**Location:** `impeccable.ts:111`, referenced from `CONSENT_PROMPT:91` and the mismatch message

"To remove it: delete `.claude/skills/impeccable/` and `.impeccable/`." After removal, the `addons` entry in
`.summon/manifest.json` remains, asserting an install that is gone, and the second commit remains in
history with the files in it. This is the message printed on a **digest mismatch** — i.e. to a user who has
just been told their payload may have been tampered with, and who is most likely to actually follow it.
Following it exactly leaves a stale record and the suspect bytes recoverable from `git`.

**Recommended fix:** add the manifest entry to the removal instructions, and on the mismatch path say the
files are also in the last commit.

### Finding 12 — `stdio: "inherit"` hands the third party the user's terminal, including stdin

**Grade:** Minor · **Proof:** deterministic (code) · judgement on severity
**Location:** `impeccable.ts:448`

The installer inherits stdin/stdout/stderr, so its output is visually indistinguishable from Summon's, and
it can read stdin. A payload that prints something shaped like a Summon prompt ("Enter your npm token to
continue:") gets a credential the user believes they are giving Summon. `--yes` mitigates by suppressing the
vendor's *legitimate* prompts, which makes any prompt during this window anomalous — but nothing tells the
user that. Inheriting is also the right call for a 3.3 MB download the user should see progress on, so this
is a tradeoff to document, not obviously a bug to fix.

**Recommended fix:** print a one-line boundary marker before and after the spawn — `--- output below is
from impeccable, not Summon ---`. Cheap, and it makes UI-redress visible.

### Finding 13 — TTY detection reads stdin only

**Grade:** Minor · **Proof:** deterministic (code)
**Location:** `impeccable.ts:398`, `:160`

`isTTY` derives from `process.stdin.isTTY` alone. With stdin on a terminal and stdout redirected
(`summon-team ... | tee log`), the prompt text goes into the pipe, the user sees nothing, and the process
blocks on input. Fail-safe in the security direction (no input → no install) but confusing.

**Recommended fix:** require both — `process.stdin.isTTY === true && process.stdout.isTTY === true`.

---

## Informational

- **ADR-0010 reaches the wrong artifact, and the comment slightly oversells it.** Line 39 says the cooldown
  "reaches this artifact (it is a named version)". True of `impeccable@3.5.0` (published 2026-07-30, clears
  the 3-day window). Not true of the ~3.3 MB payload, which is fetched from `impeccable.style` with no
  version and no checksum and is the thing that actually executes. The prompt itself is honest about this;
  the code comment is the only place that reads as though the cooldown covers the risk. This is already
  recorded as ADR-0010 exception #1, so it is a wording nit, not a gap — but the comment should point at the
  exception rather than sound like coverage.
- **No SBOM entry, because this repo has no SBOM.** `docs/sbom/` and `docs/security/` do not exist in the
  Summon repo (they are scaffold-only artifacts). This PR introduces Summon's first invocation of a
  third-party runtime payload, which is exactly the thing an SBOM is for. Recommend a follow-up item to add
  `docs/sbom/dependency-decisions.md` to this repo with the impeccable entry, the ADR-0010 exception, and
  the payload's unversioned status. Not a merge blocker.
- **`--yes` appearing twice in `INSTALL_ARGS` is correct**, not a duplicate: the first is npx's
  (auto-install the pinned package), the second is impeccable's. Worth a half-sentence in the docblock,
  which currently explains only the second.

---

## Checked and found clean

Recording these so the next reviewer does not re-spend the turns:

- **`isAffirmative`** — exact-match allowlist of `"y"` / `"yes"` after `trim().toLowerCase()`. I could not
  construct an input that reaches `true` and shouldn't. `null`/`undefined` short-circuit first; `"yes\r\n"`,
  `" Y "`, `"YES"` behave; `"yep"`, `"y!"`, `"1"`, `"true"`, `""` all correctly return `false`. The failure
  direction on a typo is "did not install".
- **`shouldPrompt`** — no path exists where the prompt is skipped but the install proceeds; the negative
  case takes an early `return` before anything is spawned. `env.CI` is tested for presence, not truthiness,
  which is right (CI systems disagree on the value). Real `process.argv` is threaded through, so the
  `--yes` / `--non-interactive` guards see real flags rather than a post-parse residue.
- **`cleanup()` cannot delete a pre-existing install** — `preExisting` is sampled at line 423, before the
  spawn, and short-circuits the delete. Ordering is correct. `rmSync(..., { recursive: true })` uses `lstat`
  internally, so a symlinked `ADDON_ROOT` would be unlinked, not followed into the user's home directory.
  No traversal is reachable through `resolve(targetDir, ADDON_ROOT)` — the suffix is a constant.
- **`normalizeLineEndings` does not leak uninitialized memory** — `Buffer.allocUnsafe(buf.length)` is
  written exactly once per output byte and the return is `subarray(0, n)`, so no unwritten region is ever
  exposed. The CRLF-pair skip (`if (buf[i+1] === LF) i++`) is correct at the buffer's final byte
  (`buf[len]` is `undefined`, not `LF`). Its stated advantage over the decode-first version holds. My
  objection to it is Finding 5(b), which is a different issue.
- **`treeDigest` ordering** — paths are normalized to `/` and sorted *after* normalization, so the sort key
  matches the hashed key on both POSIX and Windows. Both the path and the content hash enter the
  concatenation, so a rename with identical content, and a swap of two files' contents between their paths,
  both change the digest.
- **Prototype pollution via the manifest** — `JSON.parse` places `__proto__` as an own property and object
  spread copies it with `CreateDataProperty`, so a hostile manifest cannot pollute `Object.prototype`
  through `writeAddonEntry`. Non-object JSON (`[]`, `null`, `5`) degrades safely through `?? {}` and the
  `Array.isArray` guard.
- **The mismatch message does not assert which cause occurred** — "Summon cannot tell that apart from
  tampering" is exactly the right epistemics for an ambiguous signal, and withholding `HOOKS_ENABLE_NOTICE`
  on mismatch is the correct behavioural consequence. This is the best-written part of the module.
- **§4's flags are exported and therefore assertable** — `INSTALL_ARGS` as a module-level export rather than
  an inline literal is the right call; a silent edit to the security-bearing flags is now a test failure.

---

## What must happen before merge

1. **Finding 4** — veto. Reword `CONSENT_PROMPT` to the §5-permitted claim, or implement the `doctor` check.
   Nothing else in this review blocks.
2. Findings 1, 2, 6 are one-to-five-line changes and should ride along in this PR.
3. Findings 5, 7, 8, 9 change behaviour or the blessed constant. They are legitimately follow-up items with
   issues filed — but 5(b) and 7 should be recorded in ADR-0014 §7's honest-limitations list, because both
   describe guarantees the ADR currently states more strongly than the code delivers.
4. Finding 3 is a UX-visible hang on a common keystroke. Not a security blocker; fix it before anyone
   reports it as one.

PIERROT-COMPLETE: 13 findings, 1 critical
