---
agent-notes:
  ctx: "install UX, CLI surface, and generation model for Claude/Copilot targets"
  deps: [docs/adrs/0003-copilot-ghcp-support.md, packages/summon-team/, packages/create-summon-team/, CLAUDE.md]
  state: accepted
  last: "archie@2026-04-14"
---

# ADR-0004: Install UX, CLI Surface, and Generation Model

## Status

Accepted (2026-04-14)

*Adjudication (2026-04-14): All load-bearing choices picked by the human via a Dani-led sacrificial-concepts round. Concept 1 ("Single Switch") adopted with Dani's `add`-verb amendment. This ADR encodes the decisions; it does not re-propose them.*

## Context

ADR-0003 accepted Copilot IDE Chat as a second distribution target, with `.claude/*` canonical and a generator producing `.github/*`. It explicitly deferred three operational questions:

1. What does the install CLI look like for users who want Claude-only, Copilot-only, or both?
2. Which direction does the source-of-truth flow at steady state, and are generated outputs committed?
3. When does the generator run — at install time, at commit time, in CI, or on demand?

A Dani-led sacrificial-concepts round surfaced four install-UX concepts differing along target-selection timing, source-of-truth direction, install scope, and runtime coexistence. The human picked Concept 1 with one amendment: an explicit `add` verb for additive install instead of overloading `.` as a sentinel.

## Decision

1. **Single Switch, single CLI.** One published tool, `summon-team`, with a `--target` flag on fresh scaffolds and an `add <runtime>` verb on existing projects. No separate Claude-only vs. Copilot-only commands.
2. **`.claude/*` is canonical source.** Hand-authored, committed. `.github/*` (`.agent.md`, `.prompt.md`, `copilot-instructions.md`) are generated outputs. Generated artifacts are **committed** to the repo — not gitignored — so they are reviewable in PRs and usable without a local build step.
3. **Generation runs at CI time.** Not install-time for both-runtime repos, not pre-commit, not manual. A CI job runs on every PR, regenerates `.github/*` from `.claude/*`, and fails the check if the pair is missing or out of sync.
4. **`--target` defaults to `claude`.** Valid values: `claude`, `copilot`, `both`. Omitting the flag installs the Claude-only path.

## CLI Surface

```
# Fresh project scaffolding
npx summon-team <name>                       # Claude only (default)
npx summon-team <name> --target claude       # explicit Claude only
npx summon-team <name> --target copilot      # Copilot only (generates .github/*, no .claude/*)
npx summon-team <name> --target both         # .claude/* committed + .github/* generated & committed

# Additive install on an existing project
npx summon-team add claude                   # install .claude/* into an existing repo
npx summon-team add copilot                  # install .github/* (generated from upstream template)
npx summon-team add both                     # install both; redundant if one already present, idempotent otherwise

# Upgrade to a newer Summon version
npx summon-team update                       # detects installed target(s) from .summon/manifest.json

# Rejected / error case
npx summon-team .                            # error: "Use `summon-team add <runtime>` to install into an existing project."
```

`add` is the fix for the `.`-as-sentinel bug reported at the start of the session: users get a clear verb for "install into the thing I'm standing in" and a helpful error for the old mental model.

## Generation Model

Three cases, each with distinct behavior.

### Case A — Claude only

Triggered by `--target claude` (fresh) or `add claude` on an existing repo, or detected when the repo has `.claude/*` and no `.github/*`.

- **Install:** copy `.claude/*` from the Summon npm package's bundled template into the user repo. No `.github/*` emitted.
- **CI:** no generator job required. If the project later adds Copilot via `add copilot`, the CI workflow lands as part of that install.
- **Update:** `summon-team update` re-copies `.claude/*` with a per-file diff prompt (Concept 1's conflict resolution).

### Case B — Both runtimes

Triggered by `--target both` (fresh) or detected when the repo has both `.claude/*` and `.github/*`.

- **Install:** copy `.claude/*`, run the generator locally once to produce initial `.github/*`, commit both.
- **Steady state:** `.claude/*` is source. `.github/*` is committed output. Developers do not edit `.github/*` by hand; CI enforces this.
- **CI:** on every PR, the generator runs against current `.claude/*` and diffs against the checked-in `.github/*`.
  - Missing pair → fail; message points at `summon-team update` or local generator invocation.
  - Drift detected → regenerate and commit back to the PR branch. On forks (no write access), fail the check with a regeneration patch attached as an artifact; contributor applies locally.
  - Generator itself fails → emit `GENERATION-STALE` banner on every artifact per ADR-0003 Risk 4 mitigation; downstream personas refuse banner-stamped files.
- **Update:** `summon-team update` re-copies `.claude/*` (with conflict resolution) and regenerates `.github/*` from the new source.

### Case C — Copilot only

Triggered by `--target copilot` (fresh) or `add copilot` on a repo with no `.claude/*`.

- **Install:** the generator runs against Summon's **upstream template `.claude/*`** bundled inside the npm package, producing `.github/*` which is copied into the user repo. The user repo never gains a `.claude/*` directory.
- **Steady state:** `.github/*` is the only artifact set. CI cannot regenerate locally because there is no local `.claude/*` source.
- **Update:** `summon-team update` re-runs generation against the new upstream template version bundled with the newer `summon-team` release.
- **Known trade-off:** Copilot-only repos are pinned to whatever Summon version they last `update`d against. They do not benefit from the CI regeneration loop. Mitigation is the `update` command and a manifest-driven update reminder.

## Additional Decisions

### 1. Single npm package

The current repo ships two scaffolds: `packages/summon-team/` and `packages/create-summon-team/`. We consolidate around `summon-team` as the single published package. `create-summon-team` is retained as a thin `npm init`-compatible wrapper that execs `summon-team` with the same args, so `npm create summon-team` continues to work for users on older package managers. One tool surface, two entry points, one codebase. Rationale: Concept 1's "one switch" is undermined if users have to pick a package before picking a target.

### 2. Manifest file

Every installed project carries `.summon/manifest.json`. Minimal schema:

```json
{
  "summonVersion": "0.4.0",
  "targets": ["claude", "copilot"],
  "generatorVersion": "0.4.0",
  "generatedFiles": {
    ".github/agents/archie.agent.md": "sha256:…",
    ".github/prompts/kickoff.prompt.md": "sha256:…"
  }
}
```

`summon-team update` reads `targets` to know what to regenerate and `generatedFiles` checksums to detect hand-edits (which it warns about rather than silently overwriting). The manifest is committed to the repo.

### 3. Upstream template bundling

The Summon npm package bundles the canonical `.claude/*` template. This is the source of truth for:
- Case A install (direct copy).
- Case B install (copy, then generate).
- Case C install (generate, discard the intermediate).
- All three update paths.

Bundling the canonical files inside the npm package is what makes `update` coherent: users get the new canon from a version bump, and the generator is always invoked against a known source.

### 4. CI workflow (sketch)

`.github/workflows/summon-sync.yml` — one job, runs on `pull_request`:

- Check out the PR, install Node and the `summon-team` CLI at the version pinned in `.summon/manifest.json`.
- Invoke `summon-team generate --check` — regenerates into a scratch dir and diffs against checked-in `.github/*`.
- If clean: pass. If drift and the PR is on the same repo: regenerate in place and commit back with `[summon-sync]` prefix. If drift and PR is from a fork: fail with an artifact containing the regeneration patch.
- If generator crashes: fail and upload logs; do not regenerate.

Full YAML lives in implementation work, not this ADR.

### 5. `.` handling

`npx summon-team .` is rejected with the error:

> Use `summon-team add <runtime>` to install into an existing project.

This fixes the original `.`-as-sentinel bug by redirecting to the new mental model rather than by making `.` magic.

## Consequences

### Positive

- One CLI, one mental model across all three cases. The `--target` / `add` split maps cleanly to "new project" vs. "existing project."
- Committed generated artifacts mean PR reviewers see the full Copilot surface area; no hidden build steps.
- CI regeneration catches drift before merge, closing the sync-drift failure mode ADR-0003 Risk 4 worried about.
- Source-of-truth direction is unambiguous: `.claude/*` primary, `.github/*` derived. Debates about "which one do I edit" are settled by tooling.
- Manifest file makes `update` deterministic and detectable.

### Negative

- Copilot-only repos are second-class on updates — no CI loop, pinned to last `update` invocation.
- Two npm-package entry points (`summon-team` and `create-summon-team`) are a minor maintenance tax even though they share a codebase.
- Committed `.github/*` means larger diffs on persona changes; reviewers see both the `.claude/*` edit and the regenerated fan-out.
- Fork PRs cannot auto-regenerate; contributors must run the generator locally or accept the bot-posted patch.

### Neutral

- ADR-0003 Commitment C4 (CI sync check) is satisfied by this ADR's CI workflow.
- Manifest schema is small and versioned; future migrations are tractable.

## Risks

1. **Copilot-only upgrade drift.** Case C repos lag behind Summon releases because no CI nags them. Mitigation: `summon-team update --check` command that compares manifest `summonVersion` against the latest published version and emits a warning; optionally documented as a manual reminder in the Copilot-only README.

2. **CI regeneration on fork PRs.** Auto-commit-back does not work on forks. Contributors may not realize they need to run the generator locally. Mitigation: the CI failure message is explicit, and the regeneration patch is attached as a downloadable artifact for one-shot application.

3. **Manifest divergence.** A user hand-edits `.github/*`; checksums diverge; `update` must decide whether to overwrite, merge, or refuse. Mitigation: `update` surfaces hand-edits and requires explicit `--overwrite-generated` for Case B repos where the user has modified generator output.

4. **Two npm packages.** `create-summon-team` as a thin wrapper is a small burden but an easy one to drop silently out of sync. Mitigation: wrapper's source is a generated shim; both ship from the same monorepo publish step.

## Open Questions

1. **`.github/agents/` path standardization.** ADR-0003 C5 spike is still pending — workspace-scope vs. user-profile discovery for `.agent.md` is not resolved.
2. **Generator implementation language.** TypeScript vs. a bundled binary; AST-driven vs. template-driven. Deferred to implementation.
3. **`summon-team update` conflict resolution.** Per-file diff prompt is specified, but the exact interaction (three-way merge, accept-theirs, skip) needs a spike.
4. **Fork-PR regeneration UX.** Whether the artifact-attached patch is enough or whether a bot comment with `git apply`-ready instructions is warranted.

## Non-Goals

This ADR does **NOT**:

- Specify the generator's implementation (language, AST vs. template, library choices).
- Write any CLI code or generator code.
- Re-open any ADR-0003 decision.
- Decide `.github/agents/` path standardization (ADR-0003 C5 spike).
- Commit the ADR file or touch git.
- Take a position on which runtime is "primary" at runtime — only on which format is canonical source.
