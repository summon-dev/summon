---
agent-notes: { ctx: "ADR: opt-in third-party add-on install path, first instance impeccable", deps: [docs/adrs/template.md, docs/adrs/meta/0007-canon-meta-boundary.md, docs/adrs/meta/0006-multi-runtime-install.md, docs/adrs/meta/0004-summon-doctor.md, docs/adrs/meta/0012-executable-canon.md, docs/adrs/0010-dependency-release-age-cooldown.md, docs/adrs/0011-dependency-supply-chain-scan.md, docs/adrs/0013-design-authority.md, docs/attributions.md, packages/summon-team/src/index.ts], state: accepted, last: "claude@2026-08-06", key: ["one entry point: interactive prompt, default no", "installs with --no-hooks; Summon plants zero hooks", "digest detects drift, does NOT verify the download", "ADR-0010 is inapplicable here; recorded human-ratified exception", "SCOPE AMENDED 2026-08-06: 3.5.0 also installs to .agents/ — §4 gains --providers=claude to confine it, which keeps §3's file count and removal text true and §5's digest scope honest", "blessed digest recorded: 147 files, matched on three independent trees"] }
---

# ADR-0014: Optional Add-Ons — the opt-in install path, first instance `impeccable`

## Status

**Accepted** (2026-08-05) — ratified by the human at the Architecture Gate, with Pierrot's Critical finding in hand and § 7's recorded exception to ADR-0010 explicitly acknowledged as such. **Merge remains blocked on Pierrot's condition C5** (threat-model surfaces), which is being satisfied in § 11 rather than in a file that does not exist; the missing meta zone is filed separately as its own decision and is deliberately not settled here. Authored by Archie. Security review by Pierrot at `docs/history/tracking/2026-08-05-addon-trust-surface.md` — 7 findings, 1 Critical, verdict **proceed-with-conditions** with six conditions C1–C6. Architecture Gate challenge by Wei at `docs/history/tracking/2026-08-05-design-authority-and-addons-debate.md` — challenges **C1, C2, C8** are aimed at this ADR and are answered in § Answers to the review. All six of Pierrot's conditions are addressed; five are adopted, one is adopted with its content rewritten because the fact it described has changed (§ 3).

**This ADR is the spec, not the build.** Nothing here edits `packages/summon-team/src/index.ts`, `doctor.ts`, `docs/attributions.md`, or any threat model. Every change those files need is written out verbatim below for a follow-up implementation PR. Precedent: ADR-0006, ADR-0007, ADR-0012 and ADR-0013 were all spec-only.

**Amended once on 2026-08-06, in § 4, in place; the Decision is unchanged.** A *scope amendment*, found by running the installer for the first time rather than by reading it. `impeccable@3.5.0` reports *"Installed impeccable into: .claude, .agents (project)"* and writes a **second ~152-file copy** to `.agents/skills/impeccable/` — the cross-harness skills convention, which no part of this ADR knew existed. Three of its statements were false as a result: § 3's *"~147 files (~3.3 MB) in `.claude/skills/impeccable/`"* (really ~299 files across two trees), § 3's removal instruction (which left 152 executable files behind), and § 5's one-directory digest scope, whose item-5 exclusion list enumerates what is uncovered and did not name `.agents/`. That last one matters most: § 11's leading post-§4 concern is instruction-bearing text landing where a coding agent reads it, and `.agents/skills/` exists for precisely that purpose.

The fix is **one flag** — § 4's invocation gains `--providers=claude`, which confines the install to a single tree (verified: 147 files in `.claude/`, zero in `.agents/`). It was chosen over widening § 5's digest because it makes the existing § 3 text **true again** rather than rewriting a security control, and § 3 is explicit that its text is data, not prose. **No § 3 wording changed.** The human ratified this amendment on 2026-08-06 and declined a second Architecture Gate on the grounds that it conforms reality to the ADR's existing promises rather than altering them; Pierrot's § 11 item-8 re-review covers it. Status remains **Accepted**.

**Two decisions were made by the human *after* reading Pierrot's Critical finding**, and this ADR exists to record them honestly rather than to argue them into being safe:

1. **Install + disclose + record digest.** The feature ships. The prompt states plainly what happens. This ADR records **on the record** that ADR-0010's release-age cooldown *cannot apply* to this install path, why, and that the human accepted that residual risk knowingly (§ 7).
2. **Narrow to one entry point, earn the rest.** Wei's C8 is accepted in full (§ 1).

**Relationship to ADR-0013.** ADR-0013 (design authority, canon) states it has *zero* hard dependency on this ADR, and that holds in both directions: nothing here requires ADR-0013 to be ratified. The one contact point is § 10, which aligns with ADR-0013 § 5.

## Zone classification: meta

**This ADR is meta.** ADR-0007 §1: *"a file is meta if it is about building or operating Summon itself."* The stranger test — a developer scaffolding a payments app — is decisive: this document is about how `npx summon-team` decides whether to shell out to another vendor's installer. It is Summon's plumbing. It sits in `docs/adrs/meta/`, which `EXCLUDE_PATHS` drops wholesale, alongside 0004 (`doctor`), 0005 (benchmark), 0006 (multi-runtime), 0007 (the boundary itself) and 0012.

**Per ADR-0007 §1's individual-file rule, every asset this ADR introduces is classified separately** — the directory a thing lands in is a copy convenience, never the classifier:

| Asset | Zone | Why |
|---|---|---|
| The prompt + install logic (`packages/summon-team/src/addons/impeccable.ts`, wiring in `index.ts`) | **meta** | `packages/` is in `EXCLUDE_DIRS` and never ships. It is Summon's CLI. |
| The blessed digest constant (in that same module) | **meta** | Summon's own supply-chain judgement about Summon's own installer. Also: it must be readable at run time by the CLI, so the package is its only non-duplicating home (§ 5). |
| The `addons[]` field in `.summon/manifest.json` | **neither zone — CLI output** | The canon/meta test partitions *template-repo files that the scaffolder copies*. The manifest is not copied; it is **written by the CLI into the user's repo at install time**, like the git history the scaffolder inits. Its *schema* is specified here (meta); its *instances* live downstream and are the user's. Naming this explicitly matters, because "it ends up in the user's repo, so it must be canon" is exactly the path-over-subject error §1 forbids. |
| The `addon-integrity` check in `summon-team doctor` | **meta** | `doctor` is the CLI (ADR-0004), `packages/`, excluded. |
| Summon's own record of the blessing (versions, reviewer, date) | **meta**, and it has **no home today** — see below |
| `docs/attributions.md` entry (§ 9) | follows that file's existing classification — **unchanged by this ADR** | The entry is one more row in a register that already exists and already ships or does not ship as a whole. This ADR does not reclassify it. |

**A gap this ADR surfaces and does not close.** Pierrot's C3 and C5 name `docs/sbom/dependency-decisions.md` and `docs/security/threat-model.md`. **Neither path exists in this repo.** What exists is `docs/scaffolds/dependency-decisions.md`, `docs/scaffolds/sbom.md` and `docs/scaffolds/threat-model.md` — **canon stubs the user fills in for *their* project**. Writing Summon's own supply-chain decision or Summon's own installer threat model into those stubs would ship Summon's plumbing into every scaffolded repo, which is the precise failure ADR-0007 §1 exists to prevent.

So: **Summon has no meta home for its own live security registers.** ADR-0007 §2 blessed exactly two meta zones — `docs/history/` (dev history and war stories, i.e. the past) and `docs/adrs/meta/` (decisions). A living register is neither. **UNRESOLVED:** whether that warrants a third meta zone (`docs/meta/`) or an amendment to ADR-0007 §2. It is out of scope here and should not be settled as a side effect of an add-on ADR. § 3 and § 5 below route around it by putting the digest in the code and the rationale in this ADR, which needs no new zone.

## Context

`npx summon-team <name>` today is a template copy: download this repo, delete the meta zones (`EXCLUDE_DIRS` / `EXCLUDE_FILES` / `EXCLUDE_PATHS`, per ADR-0007 §2), rewrite `CLAUDE.md`'s name fields, `git init`, commit. It has **zero optional-component machinery** and it **runs no third-party code**. That second fact is the one this ADR changes, and it should be stated in exactly those terms rather than as "adds an optional design skill."

The ask: `npx summon-team` should be able to also install **impeccable**, a third-party design skill (pbakaus, Apache-2.0, `impeccable.style`). It is a genuinely good product — Pierrot read the payload and found no network calls, no subprocess spawns, a hand-rolled zip extractor that explicitly guards zip-slip, and a hook that fails open *correctly* because it is advisory rather than a guardrail.

**The problem is the channel, not the product.** Verified, twice, independently:

- `npm pack --dry-run impeccable@3.5.0` → **30 files, 1.09 MB, all under `cli/`**. No `SKILL.md`, no `reference/`, no `scripts/`. **The npm package is a downloader, not the payload.**
- `cli/bin/commands/skills.mjs:23` — `const API_BASE = 'https://impeccable.style';`
- `cli/bin/commands/skills.mjs:566` — ``await downloadFile(`${API_BASE}/api/download/bundle/universal`, tmpZip);``
- **That URL carries no version and no digest.** The 147-file / 3.3 MB payload that actually lands in `.claude/skills/impeccable/` is whatever the vendor's web server is serving at that instant.
- `skills.mjs:605` does use `createHash('sha256')` — but for **drift detection between the local tree and the bundle**, not for integrity verification of the download. It is not the control it looks like.

The consequence, stated precisely: **ADR-0010's release-age cooldown is not bypassed here — it is inapplicable.** ADR-0010's mechanism is *name a version, check that version's publish age, pin it.* `npx impeccable@3.5.0` satisfies that for the 30-file downloader and for nothing else. There is no version to age-check on the payload because the request never names one. npm's tarball integrity, publish transparency, 2FA and yank semantics all cover `impeccable-3.5.0.tgz` and stop exactly where it starts downloading. ADR-0011's scan reasons about package-manager coordinates; skill `v4.0.4` has none, so it is invisible to that instrument too.

And there is a second-order fact that makes the resolution possible. Also verified:

- `skills.mjs:1753` and `:2029` — `const installHooks = !flags.includes('--no-hooks');` → **`--no-hooks` is a supported, documented flag.**
- `skills.mjs:1701 / 1752 / 2027` — `-y` / `--yes` for non-interactive runs.

That is the hinge of this entire ADR. **Install writes files; it does not execute them.** Execution begins at the first hook invocation. If Summon installs with `--no-hooks`, the payload arrives inert, and the digest gets its chance to be useful *before* anything runs.

## Decision

Ten parts. §§ 1–6 are the mechanism; §§ 7–10 are the record and the seams.

### 1. Scope: one entry point, and the rest is deferred

**Ship the interactive prompt alone. Default no.** Wei's C8 is **accepted in full**.

| Surface | Decision |
|---|---|
| Interactive prompt at the end of `npx summon-team <name>`, default **no** | **Ships.** |
| `--with impeccable` flag | **Deferred** until a real non-interactive or scripted need appears from an actual user. |
| Generic `summon-team add <thing>` verb | **Deferred** until a **second** add-on actually exists. |

Wei's argument, which is correct: `packages/summon-team/src/index.ts` has zero optional-component machinery today, so whatever ships here **defines the extension point for every future add-on** — public CLI surface, semver-visible, effectively permanent. Three entry points for one add-on, in the PR that introduces the concept, is three surfaces to support forever on evidence of one. Summon's own precedent cuts the same way: ADR-0006 established *earn the generator before building it* and gated its generator behind a fidelity proof plus real demand; ADR-0012 §C earn-gated the workflow layer on one ceremony surviving real sessions; Done Gate item 16 (YAGNI) asks "did we build more than was asked?"

**This reverses an earlier plan and moots part of issue #72.** #72 was written against the three-entry-point shape (prompt + `--with` + `add`) that Pierrot's review and Wei's C8 both reference. Two thirds of its stated scope is now out of scope. #72 must be **rewritten to the prompt alone** before implementation starts, not silently over-delivered against. Anyone reading #72's current text against this ADR will find them in conflict; this ADR wins, and the issue is the thing that is wrong.

Note the interaction with `add`'s absence: **there is no way to add impeccable to an existing Summon project through Summon.** That is a real gap and it is accepted. The remedy is one line the prompt already prints — the user runs `npx impeccable@3.5.0 install --no-hooks` themselves. Summon offering to do it is convenience, not capability, and convenience is what has to be earned.

### 2. Sequencing and placement in the install

The add-on runs **last, as a distinct phase, after the scaffold is complete and committed.**

1. Scaffold: copy, exclude, rewrite, `git init`, initial commit. **Unchanged, byte for byte.**
2. Prompt (interactive TTY only — see § 3).
3. On yes: spawn the installer, hash the tree, write the manifest, **commit the add-on as a second commit**.

Two reasons the ordering is load-bearing, not cosmetic. First, § 6's failure posture depends on it: nothing the add-on does can leave a half-scaffolded project, because the project is already finished and committed before the add-on is offered. Second, the second commit is the answer to Pierrot's F4 complaint that a trust decision leaving no trace in version control is a trust decision nobody can audit later. A separate commit is greppable, `git revert`-able, visible in `git log`, and leaves the working tree clean — which matters because the CLAUDE.md that ships mandates a clean tree at session entry.

Proposed commit message:

```
chore: install impeccable design skill (opt-in third-party add-on)

Installed by summon-team with --no-hooks. Hooks are NOT wired; nothing
from this skill runs automatically. See .summon/manifest.json for the
recorded tree digest, and ADR-0014 for what that digest does and does
not verify.

Source: npm:impeccable@3.5.0 (CLI) -> https://impeccable.style bundle (payload)
```

### 3. The consent prompt

**Pierrot's C2 is adopted, with its fact 3 rewritten.** C2 required disclosure that install *"wires two hooks that run automatically."* Under § 4 that is no longer true — Summon passes `--no-hooks` and wires nothing. Disclosing a hook Summon does not install would be a false statement in the one piece of text whose entire job is to be true, so the fact is replaced by its accurate successor: **that no hooks are wired, and what changes if the user enables them later.** Every other C2 requirement — lead with "downloads and runs third-party code," name the vendor and license, state the file count and size, disclose the update channel, provide a removal escape hatch, never install non-interactively — is adopted verbatim.

The governing assumption, from C2: **write it for the person who presses Enter without reading.** That means the default must be safe (it is: no) and the text must lead with consequence, not with feature.

**Proposed prompt, verbatim, for the implementation PR:**

```
Optional: install "impeccable", a third-party design skill?

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
  does about it `summon-team doctor` warns if they change later. That
                detects drift. It does not verify the download.
  To remove     Delete .claude/skills/impeccable/ and .impeccable/.
  Needs network Yes. If you are offline this step is skipped and your
                project is unaffected.

Install impeccable? [y/N]
```

**Prompt rules the implementation must honour:**

- **Default no.** Enter, EOF, `SIGINT`, and any unrecognised input all mean no.
- **TTY only.** If `stdin` is not a TTY, or `process.env.CI` is set, or `--yes`/`--non-interactive` was passed to `summon-team`, the prompt is **not shown and nothing is installed**. Print one line saying it was skipped and how to do it manually. Pierrot's C6, adopted and strengthened: a default-no prompt that becomes default-yes when nobody is watching is not a default-no prompt.
- **The text is data, not prose to be regenerated.** It is specified here because it is a security control. Changing it is an ADR amendment, not a copy edit. If the hook posture (§ 4) or the digest's honest scope (§ 5) ever changes, the corresponding line changes in the same PR or the prompt is lying.

### 4. Hook posture: Summon plants zero hooks

**Decision: install with `--no-hooks`. Always. Not a flag, not a default — the only mode Summon offers.**

The invocation (**amended 2026-08-06** — `--providers=claude` added; the struck form is left visible):

~~`npx --yes impeccable@3.5.0 install --no-hooks --yes`~~

```
npx --yes impeccable@3.5.0 install --no-hooks --yes --providers=claude
```

`--no-hooks` and `--yes` compose safely: `installHooks = !flags.includes('--no-hooks')` is evaluated independently of the yes-flag, so `--yes` cannot re-enable hooks. `--yes` is present only so impeccable's own prompts do not nest inside Summon's, which would produce a prompt the user cannot attribute to either tool.

**Verified against the shipped artifact, not inferred.** `installHooks = !flags.includes('--no-hooks')` appears at `skills.mjs:1753` and `:2029` in `impeccable@3.5.0`, and **all four** hook-wiring call sites read `wantHooks = installHooks && await decideHookInstall(...)`. Because `&&` short-circuits, the yes-flag is never reached when `installHooks` is false — the composition claim is a property of the operator rather than a promise. An end-to-end install confirms it: no `.claude/settings.local.json` is created, and `.git/info/exclude` is untouched.

**`--providers=claude` is why § 3's disclosure is true.** Without it, 3.5.0 installs into *two* trees, adding ~152 files (~3.4 MB) at `.agents/skills/impeccable/` — outside § 5's digest scope and outside the removal instruction the prompt gives. The flag confines the install to one tree, which restores § 3's stated file count, § 3's removal text, and § 5's one-directory scope in a single move. It is not an optimisation and it is not cosmetic: **dropping it silently re-breaks all three, and a reviewer should treat its absence as a defect, the same way § 4 treats a missing `IMPECCABLE_BUNDLE_PATH` strip.** Both are asserted in tests against an exported `INSTALL_ARGS` constant so an edit here cannot pass unnoticed.

**Accepted consequence:** a user who works in another harness (Codex, Cursor, the `.agents` convention generally) gets impeccable in Claude Code only, and must re-run the vendor's installer themselves for the rest. That is the right trade at n=1 — Summon can honestly describe one tree, and § 1's rule is that convenience has to be earned. If real users ask for the other harnesses, widening the flag and widening § 5's digest to match is a normal amendment.

**Three independent reasons, any one of which would be sufficient:**

1. **It converts Pierrot's C1 from a warning into a real gate.** This is the decisive one. Install *writes* files; execution begins at the first hook invocation. Verify-then-wire is a genuine control; verify-after-wire is after-the-fact theatre. By never wiring, Summon makes the digest check happen strictly before any execution path exists — and makes the remedy for a bad digest ("delete this directory") actually sufficient, because nothing has run.
2. **Wei's C2.** ADR-0012 §B reserves the hook layer for Summon's own exit-path enforcement, classifies hook assets as canon **gated on Pierrot's threat model**, and sequences the exit-path hook **last** on the explicit grounds that it is *"the most invasive asset."* Summon planting a **third party's** hooks into a user's repo *before shipping its own* would invert Summon's own sequencing and make an outside vendor the first hook author in every opted-in repo — under Summon's brand, and skipping the gate Summon imposed on itself. `--no-hooks` dissolves this: Summon plants no hooks at all, so there is no ordering to invert and no threat-model gate to skip.
3. **Pierrot's F4 — invisibility.** Hook wiring lands in `.claude/settings.local.json`, which is machine-local and untracked. No reviewer, no CI check, and no teammate can see that hooks were installed. Summon must not make an invisible standing-execution decision on a user's behalf from inside a scaffolder prompt.

**How hooks get enabled later.** By the user, deliberately, outside Summon. On success Summon prints exactly:

```
impeccable installed with hooks off. Nothing from it runs yet.
To enable its automatic design review (a check after every file edit
and at the end of every turn):
  npx impeccable@3.5.0 install --providers=claude
Note: that turn-end check can take up to 30 seconds, and the wiring
lands in .claude/settings.local.json, which git does not track.
```

**`--providers=claude` carries into this text too** (2026-08-06 amendment). The bare `npx impeccable@3.5.0 install` printed before would have wired the hooks *and* silently added the second `.agents/` tree — a surface Summon's digest does not cover and `doctor` will not see. A user following Summon's own instruction should not acquire an uncovered copy as a side effect of enabling a feature.

**Summon does not offer to do this**, does not prompt for it, and does not add a verb for it. The 30-second `Stop`-hook cost and the untracked-wiring fact are disclosed here rather than in the main prompt because they are only relevant to someone taking this step (Pierrot's F4, first and second bullets).

**Rejected sub-option: pre-setting `setHookConsent(root, 'declined')`.** `impeccable-config.mjs` exposes it and it persists to `.impeccable/config.local.json`. Rejected: `--no-hooks` is the vendor's documented flag for exactly this, while writing consent state is Summon reaching into another tool's private config to assert a decision the user never made. Use the front door. (Noted for the record: `ensureConfigGitExclude` writes that config path into **`.git/info/exclude`**, not `.gitignore` — a third party modifying the user's git plumbing. Machine-local, unversioned, invisible to review. Not a blocker, and it happens on install regardless of hooks; it is why the removal line names `.impeccable/`.)

**Environment hygiene.** `IMPECCABLE_BUNDLE_PATH` (`skills.mjs:560`) redirects the bundle source to an arbitrary local directory or zip, validated only for existence. Summon **must delete that variable from the child process environment** before spawning, rather than passing the ambient environment through. This is not an escalation on its own — it needs pre-existing env control — but a scaffolder that launders a caller-controlled variable into a third-party installer is doing avoidable work for an attacker.

### 5. The digest: what it is, and what it is not

**What is hashed.** A rolled-up sha256 over the extracted tree at `.claude/skills/impeccable/`: for each file, in sorted relative-path order, hash `<relative path> \n <sha256 of normalized content>`, then hash the concatenation. **Normalize line endings to LF before hashing**, following ADR-0006 § Additional Decisions #6's normalized-content precedent — an un-normalized hash reports a whole tree as modified on a Windows/`autocrlf` checkout, and a check that cries wolf on a fresh clone is a check people learn to ignore. The algorithm is versioned as `summon-tree-v1` so a later change is a migration rather than a mystery.

**When.** Immediately after the installer exits zero, before the manifest is written and before the second commit. If hashing fails, the install is treated as failed (§ 6).

**Where recorded.** `.summon/manifest.json`, per ADR-0006, as a new **optional** top-level field:

```jsonc
"addons": [
  {
    "name": "impeccable",
    "installer": "npm:impeccable@3.5.0",   // what was pinned (the downloader)
    "payloadVersion": "4.0.4",             // SKILL.md's own version line, recorded by hand
    "root": ".claude/skills/impeccable",
    "installedAt": "2026-08-05T12:00:00Z",
    "digestAlgorithm": "summon-tree-v1",
    "treeDigest": "sha256:<observed>",     // what actually landed
    "matchedBlessed": false,               // did it equal the digest Summon reviewed?
    "hooksWired": false                    // Summon never sets this true
  }
]
```

**Manifest compatibility (API lens, and it needs saying).** ADR-0006 #1 states a Case A (claude-only, default) install writes **no** manifest, and calls that "byte-for-byte today's behavior." Installing an add-on **forces a manifest to exist on a Case A repo**, which is the first exception to that rule. This is acceptable and the ADR-0006 claim survives intact *as scoped*, because it only fires when the user opts in — the default path still writes nothing. The implementation PR must state this in ADR-0006's own terms rather than quietly widening it.

Two schema rules follow:

- `addons` is **optional and additive**, so `manifestVersion` stays **1**. Absent reads as "no add-ons." Adding an optional field is not a breaking change.
- **The Zod schema must not be strict on unknown top-level keys.** An *older* `summon-team` reading a *newer* manifest must ignore `addons`, not hard-fail on it. Forward compatibility across CLI versions is the whole point of a persistent on-disk artifact, and `.strict()` would turn every future additive field into a breaking change. If the current schema is strict, relaxing it is part of this work.

**The blessed digest — where it lives.** In the CLI package (`packages/summon-team/src/addons/impeccable.ts`) as a constant, **not in a doc.** Two reasons: the CLI must read it at run time to compare, so any doc copy is a second source of truth that will drift; and per § Zone classification, Summon has no meta home for a living register today. The human-readable rationale — who reviewed it, when, against which versions — is this ADR plus a `CHANGELOG.md` line on each re-bless. Pierrot's C3 is adopted in substance and **redirected in location**; its named path does not exist and the nearest existing file is a canon stub for the user's project.

**Blessing procedure** (the human-in-the-loop friction is the point, per ADR-0010:35): a maintainer runs the install in a scratch directory, reviews the diff against the previously blessed tree, records the new digest and the new `payloadVersion`, and ships it in a normal PR under normal review. Initial blessing row:

| Blessed | CLI | Payload (`SKILL.md` version) | Reviewer | Date |
|---|---|---|---|---|
| `sha256:ee4e188c56b9c5cfb315c3b697b0e5a27a5de91de2288543daa7094cd6b6a2b1` (147 files) | `impeccable@3.5.0` | `4.0.4` | Pierrot (payload read 2026-08-05); human (tree reviewed in `../design-notes`, 2026-08-06) | 2026-08-06 |

**How this blessing was produced, since it did not follow the scratch-directory procedure above and the difference is in its favour.** The reviewed tree was the human's own `impeccable` 4.0.4 install in a sibling repo, where all 147 files are **tracked in git and clean**, and where the `v4.0.2 → v4.0.4` upgrade landed as commit `0240424` — a reviewable diff that still exists, rather than a scratch-directory glance that does not. The procedure asks a maintainer to review the diff against the previously blessed tree; here that diff is a permanent artifact.

The digest was then confirmed to match on **three independently produced trees**: that reviewed one, a fresh full install, and a fresh `--providers=claude` install. Matching across all three is what establishes that `summon-tree-v1` is stable across machines and install modes, and that the constant will not report a spurious mismatch to every user on day one — which is the failure mode § 5 item 4 warns turns a check into one people route around.

**Traversal rules were pinned in the implementation, because § 5 does not state them.** Regular files only; symlinks skipped rather than followed (`lstat`, so a link cannot hash content twice or reach outside the tree); empty directories contribute nothing; permission bits are not covered; paths joined with `/` on every platform. The blessed tree happens to contain no symlinks, no empty directories and no executable bits, so this blessing is unambiguous either way — but that was luck, and an unstated traversal rule is exactly where a spurious mismatch would later come from.

**What `doctor` reports.** A new `addon-integrity` check in the ADR-0004 health registry, for each `addons[]` entry. It distinguishes three states, and the distinction is the whole value of the check:

| Observed vs. | Report | Severity |
|---|---|---|
| matches `treeDigest` in the manifest | intact — unchanged since Summon installed it | pass |
| differs from `treeDigest`, matches nothing known | **drift**: these files changed after install. Cause is an `impeccable update`, a hand-edit, or tampering — **doctor cannot tell which.** Print both digests, the path, and: re-install from scratch or accept and re-record. | warn |
| tree root missing entirely | removed — the manifest entry is stale; offer to drop it | info |

A `matchedBlessed: false` entry is reported at install time, loudly, and again by `doctor`: *"the payload you received is not the payload Summon reviewed."* It does **not** fail the install (the human's decision 1: install and disclose), and with hooks unwired the files are inert. But when `matchedBlessed` is false, **Summon suppresses the "how to enable hooks" instruction from § 4 and prints removal instructions instead.** That is the one place the digest changes behaviour rather than only text.

**What this explicitly does NOT do.** ADR-0012's tamper-boundary clause forbids overclaiming, and the same honesty applies here. The digest is **drift detection, not verification.** Specifically:

1. **It is not pre-install verification.** The files are written to disk before any hash exists. A malicious bundle has already landed by the time Summon can say anything about it. Nothing in this design stops a bad payload from arriving — only from arriving *silently*, and only from being *wired to execute by Summon*.
2. **It verifies nothing about the download itself.** No signature, no transport attestation, no vendor-published checksum. `matchedBlessed` compares against a digest a Summon maintainer observed at some earlier moment. If the bundle was already compromised when it was blessed, it will match forever.
3. **It does not prevent execution.** Summon declines to wire hooks; it cannot stop a user from wiring them, running `npx impeccable` directly, or Claude reading the skill. The real control is § 4, and it is a control over *Summon's* behaviour, not the user's.
4. **A mismatch is ambiguous by construction.** Upstream ships skill v4.0.5, every install reports unblessed, and that signal is indistinguishable from an attack. Every upstream release invalidates the blessing until a human re-blesses. This is a genuine, recurring operational cost, not a rounding error — see Consequences.
5. **Its scope is one directory.** `.claude/skills/impeccable/` only. Not `.impeccable/`, not `.claude/settings.local.json`, not `.git/info/exclude`. Changes there are outside the check.

The honest one-sentence claim, and the only one that may appear in any user-facing text: **Summon records what landed on disk so you can tell later if it changed. It does not verify that what landed was genuine.**

### 6. Failure posture: the add-on cannot damage the scaffold

**Rule: add-on failure is non-fatal to the scaffold, always, with no exceptions and no flag to change it.** § 2's ordering makes this structural rather than a promise — the project is complete and committed before the prompt is even shown.

| Failure | Behaviour |
|---|---|
| Offline / DNS failure / TLS failure | Prompt is still shown (Summon should not pre-probe the network), install attempt fails fast, message + manual command, **exit 0**. |
| Upstream 404 or 5xx on the bundle endpoint | Same. Name the URL that failed, so the user can tell a vendor outage from a local problem. |
| Installer exits non-zero | Same, plus cleanup below. |
| Timeout | Hard **120 s** cap on the child process, then kill, then cleanup. A scaffolder that hangs is worse than one that skips. |
| `SIGINT` during install | Kill the child, run cleanup, exit 0 with the scaffold intact. Ctrl-C must never produce a broken project. |
| Hashing fails | Treated as install failure. **No manifest entry is written without a digest** — an entry with an empty digest would be worse than no entry, because `doctor` would report it as intact. |

**Cleanup.** Summon records whether `.claude/skills/impeccable/` existed *before* it spawned the installer. On failure it removes that directory **only if it created it**, so a retry over an existing install never destroys a working one. If cleanup itself fails, Summon says so and names the exact path for manual removal rather than exiting quietly. **No `addons[]` entry, and no second commit, unless the install succeeded and hashed** — so a failed add-on leaves a scaffold indistinguishable from one where the user answered no.

**One thing that is not a failure:** answering no. It is the default, it is the expected answer, and the CLI must not editorialise about it.

### 7. ADR-0010 and ADR-0011: an inapplicability finding and a recorded exception

This is the section the human asked to be written honestly, so it is written without a defence.

**Finding, on the record.** ADR-0010's release-age cooldown **cannot apply to this install path.** Not "is waived," not "is bypassed" — *cannot apply.* Its mechanism ages a **named version**. The bundle request names none. There is no version to age, no publish date to check, and no artifact for a resolver to yank. Similarly, ADR-0011's dependency scan reasons about package-manager coordinates, and skill `v4.0.4` has none, so it passes through Summon's entire supply-chain apparatus without leaving a trace in it (Pierrot F2). Both instruments are blind here, and that is a property of the delivery channel, not a lapse in our discipline.

**The consistency problem, stated as the strongest version of the objection.** `docs/attributions.md:42` records Summon **declining** the MIT skill `setup-pre-commit`:

> instructs `husky lint-staged prettier` with no versions plus `npx husky init`, which would resolve to whatever is latest at run time. Summon's release-age cooldown (ADR-0010) and dependency scan (ADR-0011) forbid that for our own installs

Wei's C1 says this is the same defect one level down. Pierrot's Q3 ruled the proposal **not consistent**. Both are right about the original proposal, and pinning `impeccable@3.5.0` does not answer it — it relocates the unpinned fetch from the package manager, where every tool Summon owns can see it, to a vendor HTTP endpoint, where nothing can.

**What actually distinguishes this case — and it is a partial distinction, not a clean one:**

1. **The payload arrives inert.** `npx husky init` *executes* on arrival. Under § 4 impeccable's payload is written and not wired, so nothing executes at install time or at any later time without a further deliberate human act. This is a real structural difference and it is the only one that changes the risk rather than the paperwork.
2. **Change becomes detectable** (§ 5) where it was not before.
3. **Consent is explicit and defaults to no** (§ 3), where the declined skill's shape was an unconditional instruction.

**What those three do not do: pre-install verification.** That is what ADR-0010 actually buys, and no part of this design supplies it. So the honest verdict is the one the human pre-authorised:

> **This is a deliberate, human-ratified exception to a stated policy.** It is recorded as an exception, not argued into compliance. The human made it on 2026-08-05 with Pierrot's Critical finding in hand, having read that the cooldown cannot reach this path and that the digest does not substitute for it.

A recorded exception is more defensible than a manufactured distinction, and it is also more useful: an exception can be counted, reviewed and reversed, while a bad argument quietly becomes precedent.

**Guarding against override erosion** (ADR-0010:64 names this as the thing that decays a rule into theatre). Two mechanisms:

- **Exceptions must be enumerable.** This is exception **#1**. Every future exception to ADR-0010 or ADR-0011 gets: a named ADR, a human ratification recorded with a date, an explicit statement of what the policy would have required, and a reopen trigger. **One exception is a decision; a list of five is a broken rule** — and the count is the metric, so it must be countable. The register's home is blocked on the missing meta zone (§ Zone classification, UNRESOLVED); until that lands, this ADR is the register and any second exception must cite it.
- **`docs/attributions.md:42` must be amended**, or that file reads as a rule Summon enforces on strangers and waives for itself. Proposed addition immediately after the `setup-pre-commit` bullet, verbatim for Diego:

  > **One exception exists, and it is deliberate.** ADR-0014 has `summon-team` offer to install `impeccable`, whose payload is fetched at run time from a URL carrying no version and no digest — structurally the same unpinned-at-run-time shape this section declined `setup-pre-commit` over. It was ratified anyway, by the human, after a Critical security finding, on these terms: the payload is installed with hooks off so it executes nothing; its tree is hashed and recorded so later change is detectable; and the consent prompt states plainly that Summon cannot verify the download in advance. ADR-0014 §7 records the reasoning and the triggers that would reverse it. Two things follow. This section's standard still holds — `setup-pre-commit` would be declined again today. And the exception is counted: if a second one appears, the standard is the thing that needs re-examining, not the next candidate.

### 8. Generality: this is not an add-on class yet

**Given only the prompt ships, there is no add-on *class*.** There is one bespoke, opt-in install path with a vendor name in it. Stated as decisions:

- **No `AddOn` interface, no plugin registry, no discovery, no manifest of available add-ons.** The implementation is a single module with one exported function. It may share nothing but coincidence with a second add-on.
- **The manifest's `addons` field is an array anyway**, because a JSON array is not an architecture and retrofitting one later would be a breaking manifest change for zero present benefit. That is the only concession to a second case.
- **No abstraction is extracted from n=1.** When a second add-on exists, the generalisation is designed from **two observed cases**, per ADR-0006's earn-the-generator rule.

**What would earn `--with <name>`:** a real user with a real non-interactive need — a scripted setup, a dotfiles bootstrap, a devcontainer. Not "CI" (§ 3 forbids the prompt path there). Note for whoever builds it: **`--with` is an explicit human act and would be honoured wherever it is typed, including CI.** Pierrot's C6 binds the *silent* path — the thing that must never flip from no to yes when nobody is watching. A user who types the flag has watched.

**What would earn `summon-team add <thing>`:** a **second add-on that actually exists** — committed, specified, with someone waiting for it. One hypothetical add-on is not two. Until then `add` is a permanent public CLI surface designed against a single sample, which is the precise thing ADR-0006 and Done Gate item 16 exist to prevent.

**What would *un*-earn even the prompt:** see Reopen triggers.

### 9. Attributions: yes, an entry is owed

**Pierrot's C4 is adopted, with his reasoning, which is the right reasoning.** Apache-2.0 §4's conditions attach to *distribution of the Work or Derivative Works*. Summon distributes none of impeccable's code — the user receives it from npm and from `impeccable.style` directly, and the §3 patent grant and §7/§8 disclaimers run to them from the licensor. **No license obligation falls on Summon.** Recommending software is not distributing it.

An entry is owed anyway, because `docs/attributions.md` is demonstrably broader than its license function: it already records three skills Summon **declined**, whose code Summon by definition does not carry. It is a register of third-party material Summon has considered and ruled on. A dependency Summon recommends and installs is a far stronger relationship than one it declined, so listing the declines and omitting this would be backwards — and it would leave the declines section without the counterpart it currently lacks: here is one we accepted, on these terms, and here is what made it different.

**Proposed entry, verbatim, for Diego to apply:**

> ## impeccable (third-party, optional add-on)
>
> - **Source:** `impeccable` by pbakaus — `impeccable.style`, npm `impeccable`.
> - **License:** Apache-2.0.
> - **Reviewed at:** 2026-08-05, by Pierrot, for ADR-0014. The npm tarball was extracted and read; the installer was never run and no impeccable script was executed.
> - **Nature of use:** **recommended and installed, never carried.** `summon-team` offers, on an opt-in prompt that defaults to no, to run the vendor's own installer. **Summon distributes no impeccable code and therefore carries no Apache-2.0 §4 obligation** — no NOTICE to ship, no license text to bundle, no modified files to mark. This entry exists for traceability, not compliance.
> - **What review found:** the shipped payload is well-behaved — no network calls and no subprocess spawns anywhere in the 2,153-line hook library, zip-slip explicitly guarded on extraction, and a `PostToolUse`/`Stop` hook that fails open *correctly* because it is advisory (`hookSpecificOutput.additionalContext`) rather than a guardrail, so the standard that declined `git-guardrails-claude-code` does not transfer to it.
> - **What review also found, and why the install is conditioned:** the npm package is a downloader, not the payload. The 3.3 MB skill bundle is fetched at run time from a URL carrying no version and no digest, so ADR-0010's cooldown cannot reach it. Summon therefore installs with `--no-hooks` (nothing executes), records a digest of the installed tree (later change is detectable), and says all of this in the prompt. See ADR-0014 §7 — this is a recorded exception to a stated policy, not a case that satisfied it.

### 10. Whose floor wins: the Done Gate, one-directionally

**ADR-0013 §5 rule 2 already decided this, and this ADR aligns rather than diverging.** Restated so this ADR stands alone:

> **The Done Gate is the release gate. An add-on's quality floor may block work the Done Gate would pass — that is the user's choice in installing it, and Summon does not override it. An add-on's floor may never satisfy, waive, or substitute for a Done Gate item. More strict is allowed; less strict is not; equivalence is not claimed.**

There is no arbitration, no precedence table, and nothing to litigate — which is the point of making it one-directional. Concretely: *"impeccable passed, so 8b is covered"* is never valid. An impeccable finding is **never** evidence for a Done Gate item, at any proof grade; it is a third party's opinion, and the gate's grades measure Summon's own evidence.

Two corollaries specific to this ADR:

1. **Under § 4 the conflict is mostly unreachable.** Summon wires no hooks, so impeccable's floor does not fire at all unless the user deliberately turns it on. Anyone who has done that has consented to the stricter floor by an explicit act — which is the cleanest possible resolution of Wei's C2 seam question: **the second king only takes the throne if the user crowns him.**
2. **Dani reports, never defers** (ADR-0013 §5 rule 3). Findings from an add-on reach the human as Dani findings with the source cited inline. She remains accountable for whether the rule applies to this project, and she says so when it does not.

And per ADR-0013 §5 rule 4 — **Summon ships no taste.** That is why there is no vocabulary conflict here to resolve: Summon is not a claimant in the aesthetic dispute, so the only question was procedural, and rule 2 answers it.

### 11. Threat model: the two surfaces this ADR adds

**Why this is here and not in a threat-model file.** My condition C5 named `docs/security/threat-model.md`. That path does not exist, and the only threat model in the repo is `docs/scaffolds/threat-model.md` — a canon stub the user fills in for *their* project. Writing Summon's installer threat model there would ship Summon's plumbing into every scaffolded repo, which is what ADR-0007 §1 exists to prevent (§ Zone classification says the same thing about C3). Summon has no meta home for a living security register; that gap is filed as its own decision and is deliberately **not** settled here. So the surfaces are recorded in the ADR that creates them. This section is meta, like the rest of this file.

**This restates C5 against § 4, not against the proposal I reviewed.** My review was written when the design wired impeccable's `PostToolUse` and `Stop` hooks. § 4 removed that: Summon passes `--no-hooks` unconditionally and plants zero hooks. Surface (a) narrows to *Summon executing the vendor's installer, which writes third-party code*, and surface (b) moves from Summon-installed to **user-enabled**. The severities below reflect that; the older framing in `docs/history/tracking/2026-08-05-addon-trust-surface.md` is superseded on exactly this point.

Scope of the analysis: the opt-in add-on path only — the prompt (§ 3), the spawned installer (§ 4), the digest (§ 5) and the manifest entry. The scaffold path itself is unchanged byte for byte (§ Context) and is not re-modelled.

#### (a) Third-party code execution in the scaffolder

**What actually changes.** `npx summon-team` was a file copy that ran no third-party code. Under this ADR it may spawn `npx --yes impeccable@3.5.0 install --no-hooks --yes` (§ 4), which downloads a ~3.3 MB zip from `https://impeccable.style/api/download/bundle/universal` (`cli/bin/commands/skills.mjs:23` and `:565`, both read) and extracts ~147 files into `.claude/skills/impeccable/`. Summon executes the vendor's **installer**; the installer **writes** the payload; under § 4 nothing writes a hook, so the payload is not scheduled to run.

**Trust assumption.** That the npm registry serves the `impeccable@3.5.0` tarball whose `dist.integrity` npm recorded at publish (this part is genuinely covered), **and** — with no supporting control whatsoever — that whatever `impeccable.style` serves at the instant of install is what a Summon maintainer reviewed. § 5 is explicit that Summon supplies nothing that verifies the second half. That is the assumption, stated as an assumption.

**What an attacker gains, given hooks are never wired.** This is where "inert" has to be read precisely. Inert means *Summon schedules no execution*. It does not mean harmless:

- **No automatic code execution.** Nothing in the payload runs at install time or afterwards on its own. This is the real reduction, and it is the whole point of § 4.
- **But instruction-bearing text lands in `.claude/skills/`, which a coding agent reads.** `SKILL.md` and the reference tree exist to be pulled into an agent's context. A compromised bundle does not need a hook — it needs the agent to read it. Prompt injection through a skill file is the highest-value payoff remaining after § 4, and no control in this ADR addresses it. *(Inferential: I did not test agent ingestion of a modified skill; the surface follows from what skills are for.)*
- **Executable scripts sit on disk awaiting a trigger the attacker does not control but can wait for** — a user running `npx impeccable` directly, an `impeccable update`, or the user enabling hooks (surface (b)). The attacker's code is resident; only the trigger is missing.
- **Write access to the working directory at install time**, for the duration of the installer process. A malicious installer is not confined to writing under `.claude/skills/`.

**Vectors, each with what detects it.**

| Vector | STRIDE | What it buys, under § 4 | What detects it | Residual after this ADR |
|---|---|---|---|---|
| **A1 — npm account compromise of the `impeccable` CLI.** A malicious `3.5.0` republish or a compromised maintainer account. | Tampering, Elevation | Full control of the installer Summon spawns — arbitrary code with the user's privileges in the project directory, *during install*, before any digest exists. `--no-hooks` is a flag passed to code the attacker now owns; a hostile installer ignores it. This is the one vector § 4 does **not** blunt. | npm's own protections are the real ones here: immutable version contents, `dist.integrity`, publish transparency, 2FA, yank semantics. Summon's digest sees only the tree *after* the installer ran, so it detects a changed payload but not a subverted installer that reproduces the blessed tree and does its damage elsewhere. | **Medium-low likelihood, high impact.** Unmitigated by anything in this ADR; carried by npm. ADR-0010's cooldown *does* apply to this artifact (it is a named, pinned version) and is the one place Summon's existing policy still bites. |
| **A2 — compromise of `impeccable.style` hosting, DNS, or CDN at the moment of install.** The softest target: no npm account needed. | Tampering, Spoofing | A hostile 3.3 MB payload on disk. Given § 4: no automatic execution, but everything in the "what an attacker gains" list above — notably the agent-readable skill text. Materially less than the pre-§4 design, where the same bundle was wired to run on every file edit. | The digest (§ 5), and only in the honest sense § 5 allows: `matchedBlessed: false` at install time and drift reported by `doctor` later. It fires **after** the files land. TLS covers transport; it does not cover a compromised origin. Nothing detects a compromise that predates the blessing. | **The headline residual risk of this ADR, and Consequences already says so.** The controls are: consent that names this failure mode in the prompt (§ 3), no wiring (§ 4), a post-hoc mismatch signal that also suppresses the enable-hooks instruction (§ 5). Accepted by the human as recorded exception #1 (§ 7). |
| **A3 — `IMPECCABLE_BUNDLE_PATH` env redirect** (`skills.mjs:560`) — redirects the bundle source to an arbitrary local directory or zip, validated only for existence. | Tampering | Full substitution of the payload, with the same post-§4 payoff as A2 and without touching the network. **Requires pre-existing control of the environment Summon is spawned in**, so it is not an escalation on its own — an attacker who has that usually has better options. | Nothing at run time. The digest would report `matchedBlessed: false`, which is the same signal as a benign upstream release and therefore weak evidence (§ 5, item 4). | **Low**, and § 4 requires the variable be **deleted from the child environment** rather than passed through. That control must exist in the implementation; if it is dropped, this row's residual rises and the reviewer should treat its absence as a defect, not an omission. Verifiable in the implementation PR. |

**Owner-harm framing.** Read from the *repo owner's* side rather than the end user's: this ADR gives an agent-driven scaffolder the ability to fetch and unpack unverified third-party code into the owner's working tree during a command the owner ran for an unrelated reason. § 2's ordering (scaffold complete and committed first) and § 6's failure posture bound the blast radius to "the add-on step failed"; § 4 bounds it to "files exist"; the second commit (§ 2) is what makes the decision visible afterwards. Those are the mitigations, and none of them prevents the fetch.

#### (b) The `PostToolUse` / `Stop` hook as a standing local execution point

**Under § 4 this surface is user-enabled, not Summon-installed.** Summon never creates it. It comes into being only if the user, after install, runs `npx impeccable@3.5.0 install` themselves — a deliberate act outside Summon, taken against the post-install text in § 4 that names both the 30-second turn-end cost and the untracked wiring. Modelling it as a Summon-installed surface would be wrong, and modelling it as absent would be worse: the files are on disk precisely so that this step is one command away.

**Trust assumption.** That a user who wires the hooks has understood they are granting resident, automatic execution to code Summon could not verify. § 4's printed text is the only thing carrying that understanding, and when `matchedBlessed` is false § 5 withholds the instruction entirely — the one place the digest changes behaviour rather than text.

**What changes the moment a user enables it.**

- Execution moves from *possible* to *scheduled*. `scripts/hook.mjs` runs on `PostToolUse` (matcher `Edit|Write|MultiEdit`) — every file edit in every future session — and on `Stop` at every turn end. The highest-frequency third-party code in the design becomes resident.
- Every conclusion in surface (a) inverts. A2's hostile payload no longer waits for a trigger; the trigger is the user's next edit.
- The blast radius becomes the whole working tree, on a hair trigger, continuously, for as long as the wiring persists.
- **The wiring lands in `.claude/settings.local.json`, which is machine-local and untracked.** No reviewer, no CI check and no teammate can see that hooks were enabled. This is F4 from my review, and it survives § 4 intact — § 4 removes Summon's authorship of the decision, not its invisibility. A trust decision that leaves no trace in version control is one nobody can audit later.
- Summon's own artifacts do not follow. `hooksWired` in the manifest is written `false` by Summon and **Summon never sets it true** (§ 5); nothing re-reads `settings.local.json` to correct it. So a repo whose hooks are live carries a manifest saying they are not. That is not dishonesty — the field records what *Summon* did — but anyone reading the manifest as the state of the world will read it wrong, and `doctor` does not close the gap because § 5 item 5 scopes the integrity check to one directory.

**What detects it.** For the enabling act: nothing automatic, by construction — it is untracked local config outside the digest's scope. For the payload it runs: the same drift check as (a), on the same after-the-fact terms. For the behaviour itself: nothing. My F3 pass — no `fetch`, no `child_process`, no `spawn`/`exec`, no sockets across 2,153 lines of `scripts/hook-lib.mjs`; writes confined to a cache, a target file and an audit log — is a read of **one version of one payload** and does not extend forward. Reopen trigger 3 exists for exactly this and is the only thing watching it.

**Residual risk.** **Accepted, and it is the user's to accept**, which is the cleanest available resolution: Summon declines the decision rather than making it silently. Residual after the ADR's controls is *disclosure quality* — whether § 4's text is read — plus the untracked-wiring blind spot, which no party can fix from inside Summon. If reopen trigger 6 ever fires (someone reports Summon installed the hooks), the entire security argument of this ADR is void and it is a stop-the-line defect, not a bug.

#### What this threat model does not cover

ADR-0012's tamper-boundary clause forbids overclaiming, and § 5 already refuses to call the digest verification. Nothing above restores a stronger claim than § 5 allows. Stated flatly, this analysis does **not** cover:

1. **Verification of anything.** No control here establishes that the payload received is the payload reviewed. The digest is drift detection (§ 5). "Detected" in the tables above means *a signal appears afterwards, if someone runs `doctor`, and it is ambiguous between an upstream release and an attack.*
2. **A2 prevention.** If `impeccable.style`'s hosting, DNS or CDN is compromised at install time, the user receives the bad payload. This model bounds the consequence; it does not stop the event.
3. **A blessed-but-already-compromised bundle.** If the payload was malicious when a maintainer blessed it, it matches forever and every control here reports green.
4. **The payload as a product, beyond one version.** F3's clean read covers skill `4.0.4` and CLI `3.5.0` as of 2026-08-05. It is not a standing guarantee and no mechanism re-checks it.
5. **Anything outside `.claude/skills/impeccable/`.** Not `.impeccable/`, not `.claude/settings.local.json`, not the `.git/info/exclude` line the vendor appends (§ 4). Changes there are outside both the digest and this model.
6. **Prompt injection through skill content.** Named in (a) as the leading post-§4 payoff and left unaddressed. It is not solved by hook posture and it is not solved by a digest.
7. **The end user's own project.** That is what `docs/scaffolds/threat-model.md` is for, and it stays the user's document.
8. **The implementation.** This ADR is the spec, not the build (§ Status). Every claim above is conditional on § 4 and § 6 being implemented as written — unconditional `--no-hooks`, `IMPECCABLE_BUNDLE_PATH` stripped from the child environment, no manifest entry without a digest. Re-review at the implementation PR is required, not optional; verifying those three is the review's first job.

**Standing owner: Pierrot.** Update trigger: any change to § 4's hook posture, § 5's digest scope, or the install path's network behaviour — and any reopen trigger firing. When a meta home for a living security register exists, this section moves there and this text becomes the historical record of what was known on 2026-08-05.

## Alternatives considered

**A. Vendor a reviewed snapshot of the payload into Summon.** The strongest integrity option available, and Pierrot ranked it second. The 147 files land in git — reviewable, diffable, bisectable — and the unpinned network fetch disappears entirely. **Rejected**, for four reasons that compound: it makes Summon the maintainer and redistributor of 3.3 MB of someone else's executable code; it forks the update path away from upstream, so users get whatever Summon last vendored and lose the vendor's fixes; it triggers Apache-2.0 §4 in full (license text, NOTICE, marking modifications) at the moment of vendoring, not later; and it needs its own ADR-0007 ruling on whether third-party executable code is something Summon *ships* into every scaffolded repo, which would be a much larger decision than this one. **It remains the fallback** if § 4's `--no-hooks` posture ever proves unworkable.

**B. README-only documentation — a sentence saying "you might also like impeccable."** Zero integrity exposure, zero code, zero maintenance, and honest. **Rejected** because it does not do the thing that was asked: the human wants `npx summon-team` to be able to install it, and a link is not an install path. Worth naming the trade explicitly, though — B is the option with the best risk profile in this whole list, and choosing against it is choosing convenience over exposure with open eyes. It is the destination of reopen trigger 3.

**C. Gate this work on upstream shipping a versioned, digest-pinned endpoint** — `/api/download/bundle/universal?version=4.0.4` with a published sha256, or better, the bundle published to npm as its own package so registry protections, provenance and yank semantics cover it. **This is the correct long-term fix.** **Rejected as a gate** because it is not in Summon's control: gating a shipped feature on a third party's roadmap means the feature ships when they feel like it, or never, and the request has not even been made yet. It is filed as a friendly upstream ask instead, and it is reopen trigger 1 — the day it lands, most of § 5 and § 7 can be deleted, which is a good day.

**D. Consent-only: prompt clearly, verify nothing.** Pierrot's option 4. **Rejected.** It is what the original proposal already was, and it is what `docs/attributions.md:42` declined once already. Consent to "install impeccable" is not consent to "execute whatever `impeccable.style` serves, forever." The digest does not fix that, but it makes the difference visible, and the `--no-hooks` posture removes the "forever" clause.

**E. Refuse the install on digest mismatch (hard fail).** **Rejected.** With hooks unwired the payload is inert, so a hard refusal buys little; and because every upstream skill release will mismatch until a human re-blesses (§ 5, item 4), a hard fail would break the feature on the vendor's normal release cadence and train users to route around it. A check people route around is worse than no check. The chosen middle — warn loudly, record `matchedBlessed: false`, and **withhold the enable-hooks instruction** — keeps the consequence proportionate and attached to the thing that actually matters.

**F. Pre-set impeccable's hook consent to `declined` instead of passing `--no-hooks`.** **Rejected** — see § 4. Use the vendor's documented flag rather than writing into their private config.

**G. Ship all three entry points (prompt + `--with` + `add`) as originally scoped.** **Rejected** per Wei's C8 and the human's decision 2. See § 1.

## Answers to the review

### Pierrot's six conditions

| # | Condition | Disposition |
|---|---|---|
| **C1** | Payload integrity gate: bless a digest, verify the installed tree, refuse to wire hooks on mismatch; resolve the `setHookConsent` question first. | **Adopted, in its strong form, and the `UNRESOLVED` is closed.** `--no-hooks` is supported (`skills.mjs:1753`, `:2029`), so the degraded "warn and instruct removal" fallback is not needed: Summon wires **no** hooks at all, ever (§ 4), which is stronger than refusing-on-mismatch because it does not depend on the mismatch being detected. Digest per § 5. **One honest deduction from C1's framing:** verify-then-wire was described as a real gate; since Summon never wires, the digest's remaining job is drift detection, and § 5 says so in those words rather than inheriting the stronger claim. |
| **C2** | Prompt discloses four facts in order, led by "this downloads and runs third-party code," including the update-channel fact. | **Adopted, with fact 3 rewritten.** Facts 1, 2 and 4 verbatim in intent; fact 3 ("wires two hooks that run automatically") is **false under § 4** and is replaced by "nothing runs until you turn hooks on yourself," with the hook cost and untracked-wiring disclosure moved to the post-install text where it is actionable. Exact wording in § 3. Removal escape hatch and the non-interactive prohibition both adopted. |
| **C3** | `docs/sbom/dependency-decisions.md` entry: CLI version, skill version, license, unpinned-fetch risk, blessed digest. | **Adopted in substance, redirected in location.** That path does not exist; the nearest file is `docs/scaffolds/dependency-decisions.md`, a **canon stub for the user's project**, and writing Summon's own supply-chain decision there would ship it into every scaffolded repo (ADR-0007 §1). All five facts are recorded: the digest as a code constant (§ 5, single source of truth the CLI must read anyway), the rest in § 5's blessing table and § 7. The missing meta home is flagged **UNRESOLVED** rather than invented here. |
| **C4** | `docs/attributions.md` entry stating no Apache-2.0 §4 obligation. | **Adopted**, with Pierrot's reasoning and his "distributes no code" sentence. Verbatim entry in § 9. |
| **C5** | `docs/security/threat-model.md` updated with two new surfaces; Pierrot owns it. | **Adopted in substance; the location is Pierrot's to settle.** That path does not exist either — only the canon stub `docs/scaffolds/threat-model.md`, which is the *user's* threat model and is the wrong document for "Summon's scaffolder executes third-party code." The two surfaces are real and must be recorded: **(a) third-party code execution in the scaffolder** — narrowed by § 4 to *writing* third-party code, since Summon executes only the vendor's installer and wires nothing; **(b) the always-on `PostToolUse`/`Stop` hook as a standing local execution point** — which under § 4 exists **only after a deliberate user act outside Summon**, and the threat model should model it as user-enabled rather than Summon-installed. This is a **prerequisite to merge**, per Pierrot's verdict; it is not written here because Pierrot owns that document and the zone question (§ Zone classification) is his and the human's to resolve, not an add-on ADR's to decide by side effect. |
| **C6** | Default stays no; non-interactive and CI never install. | **Adopted and strengthened.** § 3: default no; Enter/EOF/`SIGINT`/unrecognised input all mean no; **no prompt at all** when stdin is not a TTY, `CI` is set, or a yes/non-interactive flag was passed. Strengthened further by § 1 — `--with` does not ship, so for now the prompt is the *only* path and there is nothing to flip. |

### Wei's challenges aimed at this ADR

| # | Challenge | Response | Design changed? |
|---|---|---|---|
| **C1** (blocking) | *Pinning the CLI is a decoy; the 147-file payload is unpinned, un-aged, un-scanned, and `attributions.md:42` declined a free MIT skill for exactly this shape. State how the payload clears ADR-0010 and ADR-0011, and what happens when it can't.* | **Conceded in full, and the answer is "it cannot."** § 7 records that ADR-0010 is **inapplicable** rather than bypassed — its mechanism ages a named version and this request names none — and that ADR-0011 is blind for the same reason. Wei's "wrong if" clause is **not** satisfied: impeccable exposes no `--skill-version`, no lockfile and no integrity hash, so the honest options really were vendoring or a README line. Both were considered and rejected (Alternatives A, B), and the human ratified proceeding anyway with the Critical finding in hand. It is therefore recorded as **exception #1** to a stated policy, with `attributions.md:42` amended so that file cannot read as a rule Summon applies only to strangers, and with a counting mechanism so a second exception indicts the rule rather than the candidate. What partially mitigates: the payload arrives **inert** (§ 4) where `npx husky init` executes on arrival. What does not: pre-install verification, which nothing here supplies and § 5 refuses to claim. | **Yes** — `--no-hooks` posture, digest, exception register, attributions amendment |
| **C2** (blocking) | *Summon's installer would plant a third party's hooks before Summon ships its own, skipping the ADR-0012 §B threat-model gate Summon imposed on itself; and "Dani routes" hides two hook systems and two quality floors firing on the same events.* | **Conceded, and the hook half is removed rather than mitigated.** § 4: Summon installs with `--no-hooks` and plants **zero** hooks. There is no sequencing to invert, no §B gate to skip, and no second hook system in the repo — impeccable's hooks exist only if the user wires them by an explicit act outside Summon. Wei's three "wrong if" requirements are met: **(i)** hooks are disabled on install, by the vendor's own documented flag; **(ii)** Pierrot's threat-model pass is a **prerequisite to merge**, not a follow-up (C5 above), routed per `security-intake.md`; **(iii)** the floor question is named and answered in § 10 — the Done Gate is the release gate, one-directionally, aligned with ADR-0013 §5 rule 2, with the added observation that under `--no-hooks` the conflict is only reachable by a user who deliberately enabled the other floor. | **Yes** — materially; this is the largest single change |
| **C8** (amendment) | *Three entry points for one add-on, in the PR that introduces the concept, is a plugin architecture built for n=1. Ship `--with` alone, or the README sentence, and earn `add`.* | **Accepted, and taken further than demanded.** § 1: only the **interactive prompt** ships. `--with` is deferred (Wei suggested shipping it; the human narrowed harder, since a prompt is reversible surface and a flag is semver-visible forever). `add` is deferred until a **second add-on actually exists** — "one hypothetical add-on is not two," adopted verbatim as the standard. § 8 states there is no add-on *class* yet: no interface, no registry, no discovery, no abstraction extracted from n=1. Precedents cited as Wei cited them: ADR-0006's earn-the-generator, ADR-0012 §C's earn-gate, Done Gate item 16. Consequence recorded rather than hidden: existing projects cannot add impeccable through Summon at all. | **Yes** — two thirds of the proposed CLI surface deleted; issue #72 must be rewritten |

## Consequences

### Positive

- **Summon plants no hooks.** The single most invasive thing the original proposal did is simply gone, and with it Wei's C2, most of Pierrot's F4, and the ADR-0012 §B sequencing conflict. Removing a capability answered three findings at once, which is usually the sign of the right cut.
- **The payload arrives inert.** Install writes files; nothing executes at install time or afterwards without a further deliberate human act. That is a genuine structural difference from the `setup-pre-commit` shape Summon declined, and it is the only one that changes risk rather than paperwork.
- **The consent prompt tells the truth, including the part that is unflattering.** It says outright that Summon cannot verify the download in advance. A user who presses Enter is safe by default; a user who reads has been told the actual failure mode rather than a reassuring paraphrase.
- **The trust decision is in git.** A second commit makes an opt-in third-party install greppable, reviewable and `git revert`-able — where the original design's most consequential state lived in an untracked local settings file (Pierrot F4).
- **Nothing the add-on does can damage the scaffold**, structurally rather than by promise: the project is complete and committed before the prompt appears (§ 2, § 6).
- **One entry point instead of three.** The permanent public CLI surface added by this ADR is a prompt. `--with` and `add` remain available to be designed later, from evidence, by someone who has seen two cases.
- **The policy exception is countable.** A recorded, dated, human-ratified exception with a reopen trigger is auditable in a way that a clever distinction never is — and the counting mechanism means the second exception triggers a review of the rule rather than another round of ingenuity.

### Negative

- **Summon now runs third-party code during install.** That sentence is true regardless of every mitigation above, it is new, and it is the honest headline. `npx summon-team` was a file copy; it is now a file copy that may shell out to another vendor's installer, which downloads 3.3 MB from a host Summon does not control.
- **ADR-0010's guarantee does not hold on this path, and no substitute was found.** The digest is drift detection, not verification. If `impeccable.style`'s hosting, DNS, or CDN is compromised at the moment of install, the user gets a bad payload and Summon's only contribution is that they will find out later, if they run `doctor`, and that Summon did not wire it to execute.
- **The blessing goes stale on every upstream release.** Skill v4.0.5 ships, every install reports `matchedBlessed: false`, and that signal is indistinguishable from an attack until a human re-blesses. This is recurring manual toil with a deadline attached, and if nobody keeps up, the warning becomes background noise — the exact decay mode that makes a check worthless. **UNRESOLVED:** whether an unmaintained blessing should eventually disable the prompt outright. Reopen trigger 4 watches it.
- **`doctor` cannot distinguish an update from tampering.** It reports drift and names both possibilities. That is honest, and it is also less useful than a check that knows.
- **Existing projects cannot add impeccable through Summon.** A direct cost of accepting C8. The remedy is a manual command the prompt prints, which is a worse experience for anyone who says no now and changes their mind later.
- **The manifest appears on Case A installs for the first time.** ADR-0006 #1's "byte-for-byte today's behavior" now carries an opt-in exception. Small, but it is a claim in an accepted ADR that is now narrower than it reads.
- **Two of Pierrot's six conditions name files that do not exist**, and this ADR routes around the gap rather than closing it. Summon has no meta home for its own live security registers, and that is now blocking a real prerequisite (the threat-model update, C5).
- **Issue #72 is now wrong.** It must be rewritten before implementation, and anyone who reads it first will build the wrong thing.
- **A precedent is set that a Critical finding can be ratified through.** That is legitimate — the human is the decision-maker and made the call with the finding in hand — but it is a precedent, and the mitigation (counting exceptions) is procedural rather than structural.

### Neutral

- No Apache-2.0 obligation attaches to Summon, because Summon distributes none of impeccable's code (§ 9). If Alternative A is ever revisited, §4 attaches in full at the moment of vendoring.
- The `addons` manifest field is additive and optional; `manifestVersion` stays 1. The only schema requirement is that unknown top-level keys not be rejected, so older CLIs tolerate newer manifests.
- ADR-0013 is unaffected in either direction. Its D2 row (add-on design artifacts, advisory, subordinate to the project's own profile) becomes reachable if this ADR is ratified and dead text if it is not, exactly as ADR-0013's reversal trigger 4 anticipates.
- impeccable writes `.impeccable/config.local.json` and appends to `.git/info/exclude` regardless of hook posture. Machine-local, unversioned; named in the removal instructions.

## Reopen triggers

1. **Upstream ships a versioned or digest-addressed bundle endpoint** — or publishes the payload to npm as its own package. Then ADR-0010 applies again on its own terms, § 7's exception is **retired**, most of § 5 can be deleted, and the prompt's "Summon cannot verify" line comes out. File the ask; do not wait for it.
2. **A second exception to ADR-0010 or ADR-0011 is proposed.** Then the rule is what gets reviewed, not the candidate. Two exceptions in a policy this young means the policy is mis-scoped or the discipline is eroding, and either finding is more important than the feature requesting the exception.
3. **The payload's behaviour changes** — an `impeccable update` that introduces network calls or subprocess spawns in the hook library, or any change that makes the fail-open hook into something that claims to block. Pierrot's F3 pass rests on a read of a specific version; it does not extend forward. Then the honest move is Alternative B (README line) or A (vendor), not another mitigation layer.
4. **The blessing goes unmaintained for two upstream skill releases.** A digest nobody re-blesses is a warning everybody ignores. Either automate the re-bless, or withdraw the digest claim from the prompt and stop implying a control that is not being operated.
5. **Six months after ratification, telemetry-free observation says nobody accepts the prompt** (including the author). Then the prompt is dead surface plus a live third-party exposure, and Alternative B was right. Delete the install path and keep the README line.
6. **Anyone reports that Summon installed impeccable's hooks.** That would mean § 4 was not implemented as specified, and it is a stop-the-line defect rather than a bug — the entire security argument of this ADR rests on `--no-hooks` being unconditional.
