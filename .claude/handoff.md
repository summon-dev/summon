<!-- agent-notes: { ctx: "session handoff — repo review + two ratified ADRs (0006, 0007) merged", deps: [CLAUDE.md, docs/adrs/0006-multi-runtime-install.md, docs/adrs/0007-canon-meta-boundary.md], state: active, last: "coordinator@2026-07-03" } -->

# Session Handoff

**Created:** 2026-07-03 **Sprint:** none active (this was an ad-hoc improvement session, not a sprint-wave execution) **Session summary:** A deep repo review surfaced Tier-1 bugs and a structural problem (Summon's own meta-content ships into user projects). Shipped a Tier-1 cleanup and two ratified ADRs (0006 multi-runtime install, 0007 canon/meta boundary), all through the Architecture Gate. Three PRs merged to main.

## What Was Done
- **Deep repo review** — categorized findings into Tier 1 (bugs), Tier 2 (ceremony vs solo-dev audience), Tier 3 (site). Full ledger in memory: `repo-review-2026-07.md`.
- **ADR-0006 (multi-runtime install)** — authored via gate (Archie + Wei), ratified, **merged (#44)**. Fixes the orphaned epic: issues #7/#8/#13/#16/#17/#18 cited an "ADR-0004 § …" that never existed; 0006 is that missing doc. Those issues were re-commented to point at 0006.
- **Tier-1 cleanup — merged (#45)** — scaffolder no longer ships `docs/code-reviews/` + `docs/tracking/` (new `EXCLUDE_PATHS` in `packages/summon-team/src/index.ts`, TDD'd); README "HD-2D"→"16-bit"; removed phantom "Starter/Full Tier" CHANGELOG line. Dropped a false-alarm threat-model "fix" after verifying the path was correct.
- **ADR-0007 (canon/meta boundary)** — authored via gate, ratified, **merged (#46)**. The durable rule for what ships to users vs what stays framework-only.
- Both gate debates recorded in `docs/tracking/` (2026-07-02 and 2026-07-03).

## Current State
- **Branch:** main (all work merged; feature branches deleted)
- **Last commit:** `d5f28ec docs(adr): ADR-0007 canon/meta boundary — what ships vs framework-only (#46)`
- **Uncommitted changes:** this handoff file only (see "Key Context" — intentionally uncommitted per ADR-0007)
- **Tests:** 28 passing across 2 test files (`packages/summon-team`); `node scripts/check-canon.mjs` → OK
- **Board status:** no gh project board wired (`project-number`/`project-owner` empty in CLAUDE.md). 25 open issues, 0 open PRs.

## Sprint Progress
- No `docs/sprints/*-plan.md` exists; no wave structure. Work was tracked by the deep-review Tier ledger in memory, not a sprint board.

## What To Do Next (in order)
1. Read `docs/code-map.md` to orient (note: currently at `docs/scaffolds/code-map.md` until a scaffold command moves it).
2. Read memory: `canon-meta-boundary-adr.md` and `repo-review-2026-07.md` — they hold the full plan and open-item ledger.
3. **Primary next task — the ADR-0007 implementation PR (now UNBLOCKED; #44+#45 are merged).** Branch off main. Per ADR-0007 (`docs/adrs/0007-canon-meta-boundary.md`), it must:
   - Move meta → `docs/history/` (`code-reviews/`, `tracking/`, `process/ponytail-harness-review.md`, `process/cross-repo-lessons.md`, `design/`) and `docs/adrs/meta/` (product ADRs 0004, 0005, 0006, and 0007 itself).
   - Add `docs/history` + `docs/adrs/meta` to `EXCLUDE_PATHS` in `packages/summon-team/src/index.ts` (extend the existing pattern from #45; add a scaffold test like the one at `test/cli.test.ts`).
   - Sever ADR-0003's agent-notes `deps` on `cross-repo-lessons.md` (inline the one line of rationale it needs). 0003 stays canon.
   - Add `README-template.md` (a minimal project-README stub); scaffolder installs it as the new project's `README.md`. Marketing `README.md` stays repo-only. This also repairs CLAUDE.md First-Run Detection (which already keys on `README-template.md` existing).
   - Remove + gitignore `.claude/handoff.md`; scrub any `/handoff` prose implying git carries the cross-machine baton.
   - Ship a NEW **canon** example ADR (fictional user decision, e.g. "Postgres vs SQLite for the user's app") so scaffolded projects get a worked ADR example without leaking Summon internals.
   - Add a deterministic **canon→meta `deps`-edge FAIL** check to `scripts/check-canon.mjs` (+ an ADR-number-contiguity check across both adrs dirs). The prose-ref warn was **cut** as a non-goal — do not build it.
   - Fix soft prose refs in shipped canon docs that point at now-moved meta paths (kickoff, team-governance, gotchas, phases, tracking-protocol, plan, tdd, code-review, sprint-boundary, code-reviewer) — prefer generic phrasing per ADR-0007 §5b.
4. **Or** pick up the ADR-0006 implementation: issues **#7** (`--target` parsing, can stub copilot/both) and **#8** (`.summon/manifest.json` module) are the unblocked starting points.
5. **Or** open the **Tier-2 ceremony-vs-solo-dev** discussion — the biggest untouched simplification item.

## Tracking Artifacts
- `docs/tracking/2026-07-02-multi-runtime-install-debate.md` — ADR-0006 gate debate
- `docs/tracking/2026-07-03-canon-meta-boundary-debate.md` — ADR-0007 gate debate
- `docs/product-context.md` — does NOT exist (referenced 13× across the repo but only created by `/kickoff`; a known open review item)

## Proxy Decisions (Review Required)
- None. Every ADR ratification and scope decision was made by the human directly (via AskUserQuestion), not by Pat proxy.

## Key Context
- **This handoff file is intentionally uncommitted.** ADR-0007 (just ratified) classifies `.claude/handoff.md` as *meta* and slates it for removal + gitignore in the implementation PR; and per the branch-and-review convention we don't commit straight to main. The durable cross-session state lives in **memory** (`MEMORY.md` + the linked files), not in this file.
- **Gate pattern that worked well (reuse it):** Archie authors the ADR as a standalone agent → Wei challenges as a standalone agent (he reads the *code*, which caught real defects) → coordinator **fact-checks both agents** before Round 2 (Wei was wrong twice on ADR-0007 due to reading `main` where unmerged branches' code was absent — do not relay an adversary uncritically) → Archie revises → debate recorded in `docs/tracking/` → human ratifies.
- **Durable gotcha worth knowing:** issue bodies can cite ADR sections that don't exist (the whole #6–#20 epic cited a phantom "ADR-0004 § Generation Model"). Verify ADR citations against the actual ADR before implementing.
- Open review items still on the table (in `repo-review-2026-07.md`): the ADR-0007 implementation (above); `docs/code-map.md`/`product-context.md` dangling until scaffold/kickoff; and all of Tier 2 (ceremony) and Tier 3 (site: abandoned `assets/team/`, duplicated site↔repo docs).
