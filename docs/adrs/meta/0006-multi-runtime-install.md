---
agent-notes: { ctx: "ADR: multi-runtime install (claude/copilot/both), manifest, generation-as-projection, CLI verb set", deps: [docs/adrs/template.md, docs/adrs/meta/0004-summon-doctor.md, docs/adrs/meta/0005-behavioral-benchmark.md, packages/summon-team/src/index.ts, packages/summon-team/src/doctor.ts], state: accepted, last: "claude@2026-07-02", key: ["manifest schema = § Additional Decisions #6", "Copilot output is a projection of .claude/*, never hand-authored", "targets: claude (default) | copilot | both = Cases A/C/B"] }
---

# ADR-0006: Multi-Runtime Install, the `.summon/manifest.json`, and Generation-as-Projection

## Status

Accepted (2026-07-02) — ratified by the human after the Architecture Gate: Archie authored, Wei challenged as a standalone agent (six challenges, all conceded in full or in part), debate recorded at `docs/tracking/2026-07-02-multi-runtime-install-debate.md`. This ADR is the spec; none of the verbs, the manifest module, or the generator described below are built yet. Round 2 changed the build sequence, not the target model: the generator and Cases B/C are now gated behind a one-persona fidelity proof and real Copilot demand (see § Phasing), the manifest is no longer written for a Claude-only install, hand-edit detection hashes normalized content, and Case C's projection is user-owned rather than damage-detected. Wei conceded the single-source-of-truth projection principle, the deferred three-way merge (OQ #7), the `claude` default, and the vendored-template rejection could not be broken; those stand as written.

**This ADR is the document a whole epic already cites but that never existed.** Issues #7 (`--target` parsing), #8 (`.summon/manifest.json` module), #13 (`add <runtime>`), #16 (Case C copilot fresh install), #17 (Case B both), and #18 (`update`) all say "From ADR-0004" and point at "ADR-0004 § Generation Model", "§ CLI Surface", "§ Additional Decisions #6", and "OQ #7". The accepted ADR-0004 (`0004-summon-doctor.md`) is about the `summon doctor` health check and contains none of those sections. The multi-runtime design was planned against an ADR that was numbered but never written. This is that document, renumbered to 0006 (0004 was taken). The section headings the epic references — **§ Generation Model**, **§ CLI Surface**, **§ Additional Decisions** (with the manifest schema as **#6**), and **OQ #7** — are reproduced here under those exact names so the existing issue citations resolve against this ADR without editing the issues. ADR-0004 is not touched; it was simply the wrong number.

## Context

Summon installs today are Claude-only. `packages/summon-team/src/index.ts` downloads the template, strips repo infrastructure (`packages/`, `site/`, `package.json`, lockfiles), resets `CLAUDE.md` to its stub, and commits. The result is a project carrying `.claude/*`, `CLAUDE.md`, and `docs/*`. That is the entire runtime surface: `.claude/agents/*.md` and `.claude/commands/*.md` are what Claude Code reads, and the docs are what the agents read.

GitHub Copilot has its own agent format — `*.agent.md` and `*.prompt.md` files under `.github/` — and its own users, who do not run Claude Code and get nothing from Summon today. Reaching them means emitting Copilot-shaped files. The tempting move is to write and maintain a parallel `.github/*` tree by hand. That path guarantees drift: two hand-maintained copies of sixteen personas and two dozen commands diverge the first time someone edits one and forgets the other, and Summon's own `check-canon` fitness function exists precisely because copy-drift is the failure mode this project keeps hitting.

Two premises fix the shape of everything below:

1. **`.claude/*` is the single source of truth.** The personas, the methodology, the commands are authored once, in Claude Code's format. Any other runtime's files are derived from it, never co-equal with it.
2. **A multi-runtime install needs to remember what it did.** A Claude-only install and a Copilot-only install and a both install produce different trees; a later `add` or `update` has to know which one it is looking at, and which files it is allowed to overwrite. Re-deriving that state by sniffing the filesystem is guesswork (an empty `.github/` could be the user's, or ours); the install must record its own decisions in an artifact it owns.

## Decision

Two runtimes, one source of truth, a persistent manifest, and four CLI verbs.

### 1. Target model: `claude`, `copilot`, `both`

A single selector, `--target claude|copilot|both`, default `claude`. The default preserves today's behavior exactly — a bare `summon-team <name>` is a Claude-only install and nothing about it changes.

| Target | `.claude/*` in repo? | `.github/*` in repo? | CI sync workflow? |
|--------|----------------------|----------------------|-------------------|
| `claude` (default) | yes (copied) | no | no |
| `copilot` | **no** | yes (generated) | no |
| `both` | yes (copied) | yes (generated) | yes |

### 2. § Generation Model

Copilot artifacts are a **projection** of the canonical `.claude/*` source. They are generated by a deterministic function, never hand-authored and never hand-edited. Given the same source tree and the same generator version, the generator emits byte-identical output; every emitted file's checksum is recorded in the manifest over **normalized** content (§ Additional Decisions #6) so a later run can tell an intact projection from one a human has touched.

**The generator is built only after its fidelity is proven, not on the strength of this ADR.** The `.claude/*` → Copilot mapping is not obvious: Claude agent frontmatter carries `tools`, `model`, `maxTurns`, and `disallowedTools`, none of which has a settled `*.agent.md` equivalent, so a low-fidelity projection is the *default* outcome, not an edge case. Ratifying "we will build a generator" without demonstrating that even one persona projects faithfully would repeat the mistake this ADR was written to correct. The build is therefore phased (§ Phasing): a hand-authored, reproducible one-persona projection plus a documented mapping table comes first and doubles as the fidelity proof; the deterministic generator is built only once that proof holds and a real Copilot user asks.

The projection **source differs by case**, and this asymmetry is deliberate:

- In **Case B (`both`)**, the projection source is the repo's own `.claude/*`. The user owns that tree and may customize it; the CI workflow (§ Additional Decisions #3) regenerates `.github/*` whenever `.claude/*` changes, so a customized persona stays reflected in the Copilot files.
- In **Case C (`copilot`)**, there is no `.claude/*` in the repo to project from, so the source is the upstream `.claude/*` template **bundled inside the npm package** as package data, frozen at the installed `summonVersion`. A Copilot-only user therefore cannot customize their agents in place (they hold only the projection, not its source); their only refresh path is `summon-team update` pulling a newer package. This is a real limitation of Case C, recorded in Consequences, not a bug.

The generator is a build-time and install-time component Summon now has to own and maintain. It is the price of not hand-maintaining a second copy, and it is the central new cost this ADR takes on.

### 3. The three install cases

- **Case A (`claude`, default).** Today's path, unchanged: copy `.claude/*`, `CLAUDE.md`, `docs/*`, init git, and commit, exactly as today. **No `.summon/manifest.json` is written** — a Claude-only install has no generated files and no target ambiguity, so its state is fully re-derivable from disk (`.claude/` present, no `.summon/`). The manifest appears only when generation does (Cases B/C, or a later `add copilot`).
- **Case C (`copilot`).** Run the generator against the bundled upstream template; emit `.github/*` into the repo; **no `.claude/*` lands in the user repo**. No CI workflow — there is no local source to sync from. Manifest: `targets: ["copilot"]`.
- **Case B (`both`).** Copy `.claude/*` as in Case A, then run the generator against that copied tree to emit `.github/*`, then install the CI workflow (§ Additional Decisions #3). Manifest: `targets: ["claude", "copilot"]`.

### 4. § CLI Surface

Four verbs. `doctor` is unchanged from ADR-0004; the other three are the subject of this ADR.

| Invocation | Purpose |
|------------|---------|
| `summon-team <name> [--target ...]` | Fresh scaffold into a **new** directory (Cases A/C/B). |
| `summon-team add <runtime>` | **Additive** install into an **existing** project. Refuses if the target is already installed unless the operation is a safe idempotent no-op. Updates the manifest. |
| `summon-team update [--check] [--overwrite-generated]` | Re-copy `.claude/*` (Case A/B) with a per-file diff prompt on conflict; regenerate the projection (Case B/C). Only Case B's `.github/*` is damage-detected (normalized-content hash vs. manifest) and refuses to clobber a hand-edit without `--overwrite-generated`; Case C's `.github/*` is user-owned and gets the diff prompt (§ Additional Decisions #2). `--check` compares the manifest's `summonVersion` to the latest published version and warns without writing anything. |
| `summon-team doctor` | Unchanged (ADR-0004): portable health registry against `cwd`. |

`summon-team <name> .` and the bare-directory case continue to error toward `add` (the behavior added in commit for #28); `add` is now the real destination that message points to.

`update` degrades cleanly on a repo with no `.summon/manifest.json` — a Case A claude-only install, which by design writes none. There it re-copies `.claude/*` with the diff prompt and has nothing to regenerate; `--check` reports that no installed version is recorded and exits without error, since a claude-only repo carries no recorded `summonVersion` to compare.

## Additional Decisions

1. **Default target is `claude`; Case A is byte-for-byte today's behavior.** Because Case A writes no `.summon/manifest.json` (see #6), "byte-for-byte" is literal, not approximate: the flag is additive, and an existing user who never passes `--target` gets no new file and no changed behavior. Migration risk on the existing install path is zero.

2. **Governance keys on whether a file has a local canonical source, not on how it was produced.** Copied files (`.claude/*`, `CLAUDE.md`, `docs/*`) become the user's to edit after install, so `update` treats a local edit as a *conflict to reconcile* (per-file diff prompt). A generated file is *damage to detect* (normalized-content hash vs. manifest, refuse to clobber without `--overwrite-generated`) **only when a local source it derives from still exists** — that is Case B, where `.claude/*` and the CI workflow keep the projection honest. In **Case C there is no local source and no CI**: the emitted `.github/*` is the user's *only* artifact, so treating their edit as damage would make `update` fight the one file they can change. Case C's `.github/*` is therefore **user-owned and gets the diff prompt**, exactly like a copied file. The rule is: damage-detect a projection only where its source is present to reconcile against; everywhere else, the on-disk file is the user's.

3. **The CI sync workflow (`.github/workflows/summon-sync.yml`) is installed in Case B only.** It regenerates `.github/*` from `.claude/*` on change, keeping the projection current as the user customizes their source. Case C has no local source to sync from, so no workflow is written; Case A has no `.github/*` to maintain. Installing the workflow anywhere but Case B would be a no-op file the user has to wonder about.

4. **`add <runtime>` is additive and refuses a redundant re-install.** `add` reads the manifest, determines what is already present, and either performs the additive step (e.g. `add copilot` on a Claude-only repo generates `.github/*` and rewrites the manifest to `["claude", "copilot"]`) or, if the target is already installed, refuses with a clear message unless the operation reduces to a safe idempotent no-op. `add` never silently overwrites an existing install.

5. **`update` conflict and hand-edit semantics are defined; the interactive UX is not (OQ #7).** `update` re-copies `.claude/*` with a per-file diff prompt when the on-disk file differs from what Summon last wrote, and regenerates the projection. Only damage-detect files (Case B's `.github/*`, per #2) go through the hand-edit guard: `update` compares the file's current **normalized-content** hash (§ Additional Decisions #6) to the manifest checksum, and on mismatch warns and requires `--overwrite-generated`. Normalizing before hashing is what stops a fresh Windows/`autocrlf` checkout — where every file's on-disk bytes differ from what the generator wrote — from reporting the whole tree as hand-edited. User-owned files (all copied files, and Case C's `.github/*`) get the diff prompt instead. `--check` is read-only: it compares the manifest's `summonVersion` to the latest published release and warns, writing nothing; on a manifest-less repo it reports that no installed version is recorded and exits without error.

6. **The `.summon/manifest.json` schema.** This is the new persistent artifact and the crux of the ADR. It lives at `.summon/manifest.json` in the user's repo and is written only when generation occurs — Cases B/C, or a later `add copilot` (a Claude-only Case A install writes none, per #1). It is validated with Zod on read; a malformed manifest raises a typed error with an actionable message rather than crashing or being silently ignored.

   ```jsonc
   {
     "manifestVersion": 1,                       // schema discriminator; absent field reads as v1
     "summonVersion": "1.4.0",                   // Summon release that last wrote this repo
     "targets": ["claude", "copilot"],           // installed runtimes; non-empty, unique, subset of the enum
     "generatedFiles": {                         // repo-relative path → normalized-content checksum
       ".github/agents/archie.agent.md": "sha256:9f2c...e1",
       ".github/prompts/kickoff.prompt.md": "sha256:0b7a...4d"
     }
   }
   ```

   - `manifestVersion` is a fixed integer. It is **not** in the reconstructed epic schema; it is added here (a deliberate tightening — see Summary) for the plain reason that a persistent on-disk file a future `update` must parse across Summon releases benefits from an explicit discriminator even at v1: it is what makes a later schema change a migration rather than a guess. (An earlier draft justified this as "mirroring `doctor.ts`'s `schemaVersion`" — that citation was wrong and is struck. `DOCTOR_SCHEMA_VERSION` is an *internal, in-memory* struct field that ADR-0004 Decision 3 explicitly does **not** serialize; if anything it is precedent for *not* shipping a version field before a consumer needs it. The manifest is a different case precisely because it *is* serialized from day one and re-read by a later tool, which is the condition that earns a discriminator.) A manifest with no `manifestVersion` reads as v1, so pre-versioning and hand-written manifests still parse.
   - `targets` is a non-empty array of unique values from `("claude" | "copilot")`.
   - `generatedFiles` maps repo-relative paths to `"sha256:<hex>"` strings computed over **normalized content** — LF line endings, a single trailing newline, content only. Raw-byte hashing would flag every file on a fresh `core.autocrlf=true` (Windows-default) checkout as hand-edited, because checkout rewrites LF→CRLF and the on-disk bytes no longer match what the generator wrote; normalizing first is what makes the hash mean "a human changed the content," which is the only thing the guard should react to. This map is the sole input to `update`'s hand-edit detection (#2, #5) and contains only projected files, never copied ones.
   - A missing `.summon/manifest.json` reads as `null` (an un-Summoned or Case A repo), not an error; only a *present but malformed* file is a typed error.
   - **`generatorVersion` is deliberately not a field.** The projection generator ships *inside* `summon-team` today, so its version is `summonVersion` — a separate field would be a second speculative discriminator with no way to diverge. It earns a place (with the same absent-reads-as handling) only if and when the generator becomes a separately-released artifact that can move independently of the Summon release. Until then, `summonVersion` already answers "which generator produced this."

## Phasing — earn the generator before building it

The target model, the manifest shape, and the CLI surface are decided now so the epic issues resolve and the flag work (#7) and manifest module (#8) can proceed. The generator and the projection cases (B/C) are gated, mirroring ADR-0005's slice-first phasing and ADR-0004's YAGNI guard.

- **Phase 0 — the fidelity proof (cheap, no generator).** Hand-author a reproducible `.github/*` projection for **one persona** (Archie is the natural choice — he is already the most-specified agent) plus a **documented `.claude/*` → Copilot mapping table** in the docs: which frontmatter key maps where, and — the part that matters — what has no target (`maxTurns`, `disallowedTools`, the `model` vocabulary) and is therefore dropped or approximated. This single artifact does double duty: it is a real deliverable a first Copilot user can consume today, and it is the evidence that a faithful projection is even possible. **Earn-gate:** the one-persona projection must be judged faithful (or its losses judged acceptable and documented) before any generator is written. If a persona cannot project without material loss, that is a finding that reshapes the generator's scope — better learned from one hand-authored file than from a built generator emitting sixteen lossy ones.
- **Phase 1 — the generator and Cases B/C (gated on Phase 0 + a real Copilot user).** Build the deterministic generator, the manifest module (#8), and the `add`/`update` projection paths (#13, #16, #17, #18) only once Phase 0's mapping holds and an actual Copilot user has asked. `--target` parsing (#7) can land before this and route `copilot`/`both` to a "not yet — see Phase 0" stub, as #7 already anticipates.

The one-persona example is the honest-alternative synthesis: Wei's "hand-author it" is right *as the first step and the proof*, and wrong only as the permanent answer for sixteen personas and two dozen commands, where the drift a generator prevents reasserts itself.

## Consequences

### Positive

- Copilot users get a real install, and it is a projection of the same canon Claude users get, so the two runtimes cannot describe different methodologies. There is one source of truth and a derived view, not two hand-maintained copies drifting apart.
- Phase 0 delivers value before any generator exists: a hand-authored one-persona projection plus a mapping table serves the first Copilot user *and* proves fidelity, so the expensive component is built against evidence rather than hope.
- The manifest makes `add` and `update` deterministic where it matters — the generated-file case. They act on recorded state, not a filesystem guess, so "which files may I overwrite?" has an exact answer rather than a heuristic.
- Hand-edits to Case B's generated files are caught (normalized-content hash vs. manifest) instead of being silently blown away on the next `update` — the failure mode that would most anger a user who tweaked a projected file — while Case C's sole artifact stays the user's to edit.
- The default path is genuinely untouched: a Claude-only install writes no manifest and behaves byte-for-byte as today. The new machinery only engages when `--target`, `add`, or `update` is used.

### Negative

- **If it is built, Summon owns a generator — a maintained component with its own bugs and release cadence.** Every change to the `.claude/*` format and every change to the Copilot file conventions becomes a change the generator has to track. This is the biggest cost of the decision, and the phasing (§ Phasing) is the mitigation: the cost is taken on only after a one-persona proof shows the projection can be faithful and a real user justifies it, not on the strength of this ADR. It is accepted at that point because the alternative — hand-maintaining `.github/*` for every persona and command — carries the same maintenance cost *plus* guaranteed drift.
- **Drift risk moves rather than disappearing, and the mapping may be lossy by default.** Hand- maintained copies drift by neglect; a projection drifts when the mapping is wrong or incomplete. Claude frontmatter (`tools`, `model`, `maxTurns`, `disallowedTools`) has no settled `*.agent.md` equivalent, so a lossy projection is the *expected* first result, not a rare one. This is exactly why Phase 0 exists: the loss is characterized in a documented mapping table against one hand-authored persona *before* a generator is trusted to emit sixteen. We trade "copies fall out of sync" for "the mapping might be lossy," a smaller surface but not an empty one.
- **A new persistent file lands in user repos — but only when generation occurs.** `.summon/ manifest.json` is state Summon writes into someone else's project, and it can rot (a user hand-edits it, git-merges it badly, or deletes it). Restricting it to Cases B/C keeps it out of every Claude- only repo (the common case) entirely. Zod validation on read and treating absence as `null` blunt the rest, but a B/C repo can still end up with a manifest that disagrees with its own file tree, and `update` has to degrade sanely when it does.
- **Case C is a consumption tier, and is labeled as one.** Case C users hold the projection, not its source, so the source-side flexibility Claude and `both` users have (edit `.claude/*`, get it reflected) is not available to them. The Round 2 fix (#2, #5) at least stops `update` from fighting them: because Case C's `.github/*` is user-owned, a user *can* edit their output directly and `update` will diff-prompt rather than demand `--overwrite-generated`. But an in-place edit to a Case C output has no canonical home and will diverge from any future regeneration. This is inherent to shipping a projection without its source; it is a genuine reason a power user picks `both` over `copilot`, and Case C is documented as the no-`.claude/*` consumption tier rather than pretending to be a peer of `both`.

### Neutral

- Where the generator physically lives (a module inside `summon-team`, or a separate package) and how the upstream `.claude/*` template is bundled as package data (#16's build-time concern) are implementation details for the build step, not decided here.
- The exact `.claude/*` → Copilot mapping (which persona field becomes which `*.agent.md` frontmatter key, how commands become `*.prompt.md`, what is dropped) is not fixed in this ADR — it is Phase 0's first deliverable, a documented mapping table validated against one hand-authored persona (§ Phasing). This ADR fixes that the mapping is deterministic and its outputs checksummed once the generator exists, not what the mapping is.
- `--target` is the one selector for runtime, matching the CLI's existing single-flag style (`--local`, `--version`); no per-runtime sub-flags are introduced.

## Alternatives considered

**Hand-maintain the Copilot files.** Author `.github/*` directly alongside `.claude/*` and keep them in step by review discipline. **Partially adopted, not rejected outright** (this is the Round 2 synthesis). As the *permanent* answer for sixteen personas and two dozen commands it is rejected: that is the exact copy-drift failure `check-canon` and `summon doctor` were built to catch, scaled up to two full runtime trees, and drift is the precise thing Summon sells itself as preventing. But its strongest point — no generator to build or debug, and a hand-authored file is never lossy the way a projection can be — is real and survives: it is adopted as **Phase 0**, where one hand-authored persona projection plus a mapping table is both the first Copilot deliverable and the fidelity proof the generator is gated on (§ Phasing). Hand-authoring is the right first step and the right proof; it is wrong only as the standing mechanism at full scale.

**No manifest; re-derive install state from disk.** Skip `.summon/manifest.json` and have `add`/ `update` infer the install shape by inspecting which directories exist. Rejected: the inference is ambiguous in exactly the cases that matter. An empty or partial `.github/` could be Summon's projection or the user's own workflows; a `.claude/` with local edits looks the same as an untouched one; and there is nowhere to record the checksums that `update` needs to tell a hand-edited generated file from an intact one. The part of this option that is right — that a filesystem is the ground truth for what *files* exist — survives as `update`'s reconciliation step, which reads disk and compares it against the manifest rather than trusting either alone.

**Vendor the upstream template into each repo instead of bundling it in the package.** Commit a copy of `.claude/*` into every install (including Case C) so the generator always has a local source. Rejected on the same grounds ADR-0004 rejected a vendored `doctor`: a committed copy rots relative to canon, and it defeats the point of Case C (a Copilot-only user who explicitly did not want `.claude/*` in their repo would get it anyway). Bundling the template as npm package data keeps the source out of the user's tree and always at a known published version. The cost this imposes — Case C cannot customize its agents locally — is documented above as a real limitation, not waved away.

## Open questions (for the Architecture Gate and later authorship)

- **OQ #7 (per-file conflict-resolution UX for `update`).** Referenced by #18. When `update` re-copies `.claude/*` and finds a file the user has edited, how does it resolve? The lightweight option is accept-theirs / accept-ours / skip / view-diff, prompted per file. The heavyweight option is a proper three-way merge (base = what Summon last wrote per the manifest, ours = on-disk, theirs = new upstream), which is more capable but materially more machinery and a worse fit for a scaffolder. **Leaning:** ship the four-way prompt first and let dogfooding decide whether the three-way merge earns its complexity — but this is a live question, not settled, and the manifest deliberately records the base checksums a future three-way merge would need. (Numbered #7 to match the epic's citations; the lower-numbered planning questions from the original phantom-ADR notes were folded into the Decision and Additional Decisions above.)

- **A projection health check in `doctor`.** Mapping fidelity itself is no longer an open question — it is Phase 0's earn-gate (§ Phasing). What stays open is whether `summon doctor` (ADR-0004 `health` registry) should eventually grow a Case B check that the on-disk `.github/*` still matches the manifest's normalized-content checksums, catching a stale or hand-edited projection. This is the natural place the manifest and the doctor meet, and it is left open rather than pre-committed — and it only makes sense for Case B, since Case C's `.github/*` is user-owned (#2) and would false-fail.

- **`add` downgrade / removal.** This ADR blesses additive `add` only. Removing a runtime (`add`'s inverse — dropping `.github/*` and rewriting the manifest to `["claude"]`) has no verb yet and no demand yet; noted so its absence is a decision, not an oversight.
