<!-- agent-notes: { ctx: "session handoff — ponytail/harness positioning wrap", deps: [CLAUDE.md, docs/process/ponytail-harness-review.md, docs/code-map.md], state: active, last: "coordinator@2026-06-29" } -->

# Session Handoff

**Created:** 2026-06-29
**Sprint:** n/a — this repo is issue-driven (no `docs/sprints/` wave plan, no GitHub Projects board configured)
**Wave:** n/a
**Session summary:** Merged the ponytail/harness review PR (#36), then completed and merged the #32a README positioning rewrite (PR #38). The next session is starting something slightly orthogonal — this handoff exists so the positioning thread can be resumed cleanly later, not necessarily next.

## What Was Done
- **Merged PR #36** (squash) — the ponytail/harness integration (ADR-0004/0005, canon checks, `summon doctor`).
- **Completed #32a README rewrite** and **merged PR #38** (squash → `main`, `b01b4e9`). README now leads with a value prop + a real in-repo before/after artifact (the dogfooding episode), ICP, anti-use-case, fears-not-features FAQ; roster/phases/commands moved below the fold.
  - Drafted by Cam (voice/FAQ) + Pat (before/after/ICP) as standalone agents; reviewed by Diego (DX) + Wei (adversarial).
  - **Wei caught a Fatal overclaim** — draft said "the gate fires," but the gates were *skipped* and the review was *retroactive*. Reframed to concede the skip and sell the verifiable aftermath (omission legible → freeze → ratify-or-revert → two ADRs). Diego's Critical (specialist miscount 9→6) and lens-count contradiction also fixed.
- **Created follow-up issue #37** (Astro site port of the positioning); kept **#32 open** (`Refs`, not `Closes`) so it closes when the site lands.
- **Memory updated** — new file `ponytail-harness-initiative.md` + MEMORY.md index pointer.

## Current State
- **Branch:** `main` (up to date with origin, pruned)
- **Last commit:** `b01b4e9 docs(readme): lead with value prop + real before/after artifact (#32a) (#38)`
- **Uncommitted changes:** none (clean tree; this handoff is the only pending add)
- **Tests:** 26 passing across 2 files in `packages/summon-team` (doctor.test.ts 18, cli.test.ts 8). `check-canon` OK, `summon doctor` healthy.
- **Board status:** No GitHub Projects board configured (`project-number`/`project-owner` empty in `CLAUDE.md:105-106`). Work tracked via GitHub Issues only. Status transitions (In Progress→In Review→Done) are N/A until a board is set up via `/kickoff` Phase 5.

## Sprint Progress
- **Wave plan:** none — `docs/sprints/` is empty. Initiative tracked via issues + decision record `docs/process/ponytail-harness-review.md`.
- **Initiative completed this session:** #32a (README), merged via PR #38.
- **Open issues (ponytail/harness initiative):**
  - **#37** — port #32a positioning to the Astro landing page (`site/src/content/docs/index.mdx`). Fast; reuses the ratified README framing. Closing it (+ merged #38) completes #32a. **Best next positioning step.**
  - **#33 (#32b)** — wire a falsifiable benchmark number into the README. Gated on #31 Phase 2.
  - **#31** — behavioral benchmark harness (the keystone, NOT started). ADR-0005 mandates outcome (not process-compliance) metrics, budget-matched control, real n, offline graders in Phase 1.
  - **#32** — stays open until #37 lands.
- Older CLI/Copilot issues (#5–#27) deferred until the positioning bet resolves.

## What To Do Next (in order)
1. Read `docs/code-map.md` to orient.
2. Read `docs/process/ponytail-harness-review.md` — the initiative's decision record (verdicts, gating, the artifact this positioning is built on).
3. **If resuming positioning → #37 (site port):** apply the merged README's framing to `site/src/content/docs/index.mdx`. Carry the guardrails: concede gates are *skippable*, sell the aftermath, "unaccountable not wrong," NO benchmark number (gated on #33), keep counts canonical (16 agents / 24 commands). Update the `og:` description (still says "Ship like a team of 10"). Invoke Dani for visual hierarchy. Verify with `node scripts/check-canon.mjs` + `summon doctor`.
4. **If tackling #31 (benchmark):** re-read ADR-0005 first — the design was contested (Goodhart trap); Phase 1 is offline graders only, no API key.
5. **For the orthogonal new work the user mentioned:** start fresh from the Session Entry Protocol (clean baseline ✓ — tree is clean on `main`; branch before coding; create a work item; Architecture Gate if it's a design decision).

## Tracking Artifacts
- `docs/process/ponytail-harness-review.md` — canonical initiative decision record + 7-agent critique.
- `docs/tracking/2026-06-24-doctor-benchmark-gate-debate.md` — ADR-0004/0005 Architecture Gate debate (Archie/Wei).
- `docs/product-context.md` — **does not exist** (no Pat proxy-mode product philosophy file). If the next session needs product context, it's in the decision record's acceptance criteria, not a standalone file.

## Proxy Decisions (Review Required)
- None. The human was present and made the two key calls directly: hero artifact = self-caught gate-skip episode; scope = README first, site deferred.

## Key Context
- **The positioning bet is deliberately self-critical:** the README *admits* an agent skipped Summon's own gates and sells the aftermath. This survives the kill criterion (the "that's just YAGNI in a prompt" tweet) precisely because it concedes the skeptic's true premise. Do not let future edits drift back to "the gate fires" / "the team prevents all slips" — Wei rated that Fatal.
- **`code-reviewer` is the 16th agent file but NOT a persona** (it's a composite invocation pattern). README copy says "16 agents" + "9 named + 6 specialists" (= 15 personas + composite). Keep that math intact; `check-canon` enforces the "24 commands" string.
- Files actively worked on this session: `README.md` (merged). No in-flight edits.
- New `summon doctor` (`packages/summon-team/src/doctor.ts`) and `scripts/check-canon.mjs` are the deterministic gates — run both after any docs/canon-touching change.
