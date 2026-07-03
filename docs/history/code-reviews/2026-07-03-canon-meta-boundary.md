---
agent-notes:
  ctx: "review of ADR-0007 canon/meta boundary implementation (3 waves)"
  deps: [docs/adrs/meta/0007-canon-meta-boundary.md, scripts/check-canon.mjs, packages/summon-team/src/index.ts, packages/summon-team/test/cli.test.ts]
  state: active
  last: "code-reviewer@2026-07-03"
---
# Code Review: ADR-0007 Canon/Meta Boundary Implementation

**Date:** 2026-07-03
**Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security), Archie (conformance)
**Files reviewed:** `scripts/check-canon.mjs`, `packages/summon-team/src/index.ts`, `packages/summon-team/test/cli.test.ts`, `docs/adrs/0003-project-risk-tiers.md`, `docs/adrs/0008-example-sqlite-first-datastore.md`, `docs/process/doc-ownership.md`, `README-template.md`, `.claude/commands/{handoff,resume}.md`, plus the full `git mv` set.
**Verdict:** Changes requested — the *shipped scaffold output is correct today* (sensor green, meta zones excluded, README swapped, handoff absent), but the branch leaves the **repo's own health red** and the **boundary not self-enforcing going forward**.

## Context

This branch implements ADR-0007: split Summon's docs into *canon* (ships to a scaffolded project) and *meta* (framework-only). Wave 1 `git mv`s the meta zones (`docs/{code-reviews,tracking,design}` and two war-story process docs → `docs/history/`; product ADRs 0004–0007 → `docs/adrs/meta/`), teaches the scaffolder `EXCLUDE_PATHS`, adds a README stub swap, removes+gitignores `.claude/handoff.md`, and severs ADR-0003's dep on the now-meta `cross-repo-lessons.md`. Wave 2 adds two `check-canon.mjs` checks (canon→meta deps-edge FAIL + ADR-number contiguity) and a canon example ADR-0008. Wave 3 scrubs dead prose pointers.

The interesting bug class here is **staleness introduced by a bulk move**: moving a file is one edit; every string that named its old path is a separate edit the move does not make for you.

## Findings

### Critical
None. The scaffold a user receives *today* is correct: `node scripts/check-canon.mjs` is green, the two meta zones and `handoff.md` do not ship, and the README swap replaces the marketing page with the stub (the negative assertion string "code you have to answer for later" is genuinely present in `README.md`, so that test is not vacuous).

### Important

**1. The `git mv` left 19 dangling agent-notes deps in-repo; Summon's own `doctor` is now red.**
The moves relocated files but did **not** update the `deps:` strings that pointed at their old paths. `summon-team doctor` run at repo root now reports **19 unresolved deps**, e.g. `docs/adrs/meta/0005-behavioral-benchmark.md -> docs/adrs/meta/0004-summon-doctor.md` (0004 is now under `meta/`), and `docs/history/ponytail-harness-review.md -> docs/history/cross-repo-lessons.md` (now under `docs/history/`). Confirmed these are *new*: `git show main:docs/adrs/0005-…` shows the dep resolved before the move.
- *Why it matters:* (a) It directly contradicts ADR-0007 §5a's load-bearing claim that *"meta→meta deps are fine — the two files move into the exclude zone together, so the reference never dangles."* They move together but the **dep string still names the old location**, so they dangle in-repo. (b) `check-canon.mjs` does **not** catch this by design (`isCanonPath` skips meta sources), and CI runs `check:canon`, not `doctor` — so CI stays green while the repo's own health check is red. (c) A framework that sells "doctor catches dangling refs" failing its own doctor is a dogfooding embarrassment, and 19 known-bad entries bury the 20th, *real* regression.
- *Fix:* rewrite the 19 dep strings to their new paths (`docs/history/…`, `docs/adrs/meta/…`). This is exactly the check `check-canon` can't see — consider adding `summon-team doctor` (or an in-repo `checkAgentNotesDeps` pass) to CI so a green tree means both zones resolve.
- *Principle:* a bulk `git mv` is a find-and-replace on paths *and* on every reference to them. The reference edit is invisible until something resolves the string.

**2. The boundary is not self-enforcing for Summon's own *future* meta artifacts.**
Wave 1 moved the *existing* `docs/code-reviews/` and `docs/tracking/` into `docs/history/`, but the canon tooling that *generates new ones* still targets the top level: the code-reviewer agent writes to `docs/code-reviews/` (`.claude/agents/code-reviewer.md`), and `/code-review`, `/plan`, `/kickoff`, `/tdd`, `/sprint-boundary`, and `tracking-protocol.md` all write to `docs/tracking/…`. Neither top-level dir is in `EXCLUDE_PATHS` (only `docs/history/` is). The moment a Summon maintainer runs `/code-review` or `/sprint-boundary` on Summon itself, fresh **meta** content lands in a **non-excluded** path and ships to the next user — the exact rot ADR-0007 exists to kill. The §9 sensor can't see it (it checks `deps`, not stray meta *files* in canon dirs). The only thing stopping it right now is that this very review was hand-routed to `docs/history/code-reviews/` by the human.
- *Why it matters:* for a *user's* project `docs/tracking/` and `docs/code-reviews/` are legitimately canon (their own artifacts), so you can't just exclude them wholesale without breaking the user. But Summon-the-repo has no mechanism that routes *its own* generated artifacts into `docs/history/`. The boundary holds for the one-time cleanup and then leaks on the next self-hosted command.
- *Fix (pick one):* (a) point Summon's own review/tracking output at `docs/history/…` and say so in the commands' repo-facing notes; or (b) add `docs/code-reviews` and `docs/tracking` to `EXCLUDE_PATHS` (users still get them auto-created on first use, same as `docs/sprints/`) and route Summon's own into `docs/history/`; or (c) extend the sensor to FAIL if top-level `docs/code-reviews/` or `docs/tracking/` contains files in-repo.
- *Principle:* moving today's exhaust is a cleanup; redirecting the *pipe that produces it* is the fix. Without the second, you re-accumulate.

**3. `.claude/handoff.md` exclusion relies solely on git-untracked status — the `--local` path defeats it.**
Nothing in the scaffolder names `handoff.md` in any exclude list (confirmed by grep). Its non-shipping depends entirely on the file being absent from the source tree. That holds for the **download** path (giget pulls from GitHub, where the file is gitignored/untracked). It does **not** hold for `--local`: `cpSync` is a filesystem copy that ignores `.gitignore`, and the basename filter only screens `EXCLUDE_DIRS`/`EXCLUDE_FILES`. So `summon-team --local <path>` run against a working tree where `/handoff` has regenerated `.claude/handoff.md` will **copy the stale session snapshot into the user's project**. `--local` is a documented, supported option (`--help`).
- *Fix:* add `.claude/handoff.md` to `EXCLUDE_PATHS` (it already runs the post-copy `rmSync` loop for both paths), or screen `handoff.md` in the basename filter. Belt-and-suspenders with the gitignore.
- *Principle:* `.gitignore` is invisible to `fs.cpSync`. Any "never ships because it's gitignored" guarantee is only as strong as the copy mechanism that honors it — and the local-copy path doesn't.

**4. The marketing README non-shipping is a single silent point of failure.**
The marketing `README.md` is **not** in any exclude list; it is copied into the scaffold and then *overwritten* by the stub, but only inside `if (existsSync(readmeTemplatePath))`. If `README-template.md` is ever renamed, moved, or added to an exclude, the swap is silently skipped and the marketing sales page ships as the user's README — the precise defect ADR-0007 §6 exists to prevent, with no fallback.
- *Fix:* treat the marketing `README.md` like other meta files — exclude it, then unconditionally install the stub — or at minimum log a warning when `README-template.md` is missing rather than silently shipping marketing.
- *Principle:* when "the bad thing doesn't happen" depends on a *second* step succeeding, a skipped second step ships the bad thing. Prefer excluding the hazard over relying on an overwrite.

### Suggestions

**5. Sensor prefix match is trailing-slash-strict (minor false-negative).** `isMetaTarget` tests `dep.startsWith("docs/history/")`; a dep written as the bare dir `docs/history` or `docs/adrs/meta` (no trailing slash) evades it. Unlikely in practice (deps name files), but tightening to also match the exact dir names closes it.

**6. The sensor file-walk misses shipped-canon files that aren't `.md`/`.mdx` under `.claude`/`docs` (or `CLAUDE.md`).** `README-template.md` ships (becomes the user's README) but is not scanned; it carries no deps today, so this is latent. Any future non-markdown canon file with agent-notes would be unchecked. Add root-level shipped files to the source list if that ever changes.

**7. Stale meta→meta path strings outside the doctor's default scope.** `site/src/components/TeamGrid.astro` and `docs/history/design/team-hero-sprites-16bit.md` still dep on `docs/design/…` (now `docs/history/design/…`). `site/` never ships, so it's harmless downstream, but it's the same unupdated-path class as finding #1 and adds noise. Fold into the #1 sweep.

**8. `docs/tracking/` vs `docs/sprints/` asymmetry.** `docs/sprints/` ships an empty `.gitkeep` scaffold (per §1's worked example); `docs/tracking/` and `docs/code-reviews/` ship nothing. If the *directory concept* is canon for the user (their artifacts land there), a `.gitkeep` for consistency — or an explicit "these are auto-created" note — would make the treatment uniform. Tied to finding #2.

**9. ADR-number check guards contiguity, not classification.** `checkAdrNumbering` correctly handles `template.md` (no number → skipped), missing `meta/` dir (existsSync guard), and duplicates. But a *meta* ADR mis-filed in canon `docs/adrs/` would pass the number check and ship. That's an accepted limit (classification is the subject test, not automatable) — worth a one-line comment so the next maintainer doesn't assume the number check also validates placement.

## Lens summary

- **Vik (simplicity):** Clean. The sensor is ~15 structured lines as ADR §9 promised, no premature abstraction, and the prose-ref check was correctly *cut* (YAGNI respected). No complexity concerns.
- **Tara (testing):** The meta-zone-exclusion and README-swap tests assert strong, non-vacuous invariants (marketing string confirmed present). But `does not ship the session handoff snapshot` is **trivially passing** — it asserts the absence of an already-absent file and exercises *no exclusion logic*, so it would not catch finding #3. A test that writes `.claude/handoff.md` into a copied source and asserts it doesn't ship would fail today and surface the `--local` leak. The download path is untested (acceptable — network).
- **Pierrot (security):** No secrets, no injection, no auth surface. The scaffolder's destructive `rmSync`/`cpSync` calls are all `resolve(targetDir, <hardcoded-rel>)`-bounded — no path traversal from user input (project name is regex-validated). Clean.
- **Archie (conformance):** The boundary itself is the architecture and the sensor is the right fitness function. The one conformance gap is finding #2: the fitness function guards *deps* but not the *generative pipeline*, so the invariant "no Summon exhaust ships" is not actually enforced for future artifacts.

## Lessons

1. **A bulk move is two edits, and the tooling only does one.** `git mv` relocates the file; it does not touch the strings — `deps:`, prose links, `import`s — that named the old path. Findings #1 and #7 are the same mistake. After any move, resolve the references: run the dep checker (`summon-team doctor`) and grep the old paths. If your CI check deliberately ignores half the tree (here, meta sources), something *else* must cover that half, or the move rots silently.
2. **Moving today's mess is not the same as fixing the thing that makes the mess.** Finding #2 is the deep one: the branch relocated existing exhaust but left the pipe that produces it aimed at a non-excluded path. Cleanups that don't redirect the source re-accumulate. When you draw a boundary, ask "what *writes* to the wrong side, and does anything stop it next time?"
3. **`.gitignore` is not an exclusion mechanism for a filesystem copy.** Finding #3: `cpSync` doesn't read `.gitignore`. Any "it won't ship because it's ignored" guarantee only holds for the code path that honors ignores. If you have two copy paths (download vs local), a guarantee must hold on *both*.
4. **"The bad thing is prevented by a later overwrite" is weaker than "the bad thing is excluded."** Finding #4: relying on a conditional swap to bury the marketing README means a skipped swap ships it. Exclude the hazard; don't overwrite it.
5. **A test that can't fail teaches nothing.** The handoff test passes because the file is already gone, not because the scaffolder excludes it — so it green-lights a leak it was written to guard. Before trusting a guard test, ask: "what would I have to break to make this red?" If the answer is "nothing the code controls," the test is decorative.

REVIEW-COMPLETE: 9 findings (0 critical, 4 important)
