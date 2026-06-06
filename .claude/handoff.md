<!-- agent-notes: { ctx: "session handoff — Wave 1 implemented + Wave 2 R1 ADR accepted", deps: [docs/process/cross-repo-lessons.md, docs/adrs/0003-project-risk-tiers.md, CLAUDE.md], state: active, last: "coordinator@2026-06-06" } -->

# Session Handoff

**Created:** 2026-06-06
**Sprint:** N/A — meta/self-improvement work on the summon framework itself (no sprint, no board; board not configured).
**Wave:** Self-improvement initiative — Wave 1 DONE; Wave 2 R1 ADR accepted, R1 implementation NOT started.
**Session summary:** Resumed from the prior handoff (which was stale — the decision record was already committed). Implemented Wave 1 (5 "adopt now" decisions) with a code-review pass, then ran the full Architecture Decision Gate for Wave 2 item R1 (risk-tiering): Archie authored, Wei challenged and inverted the design, Pierrot gave conditional safety sign-off, Pat gave product sign-off. ADR-0003 accepted by the human. Nothing implemented for R1 yet.

## What Was Done

- **Wave 1 implemented + committed (`b030a00`)** on branch `docs/cross-repo-lessons`. Five decisions from `docs/process/cross-repo-lessons.md` Section 2, all in runtime surfaces, no magic numbers:
  - `#3` Step 0 `git status` clean-baseline → `CLAUDE.md` Session Entry Protocol.
  - `#7` atomic create+board+status → `CLAUDE.md` § Per Work Item (cites gotchas 115/119).
  - `#1` file-based reports + completion sentinel (G1 EOF + G3 self-declared count) → `sato.md`, `tara.md`, `code-reviewer.md`; "Treat Agent Output as Untrusted" Critical Rule → `CLAUDE.md`. One canonical coordinator-gated sentence, verbatim across the agent files.
  - `#5` Tara "Red-Phase Pre-Flight (3 checks)" (calendar/direction/path) → `tara.md`.
  - `#4` Wei citation-grep habit → `wei.md`.
  - Code-reviewer ran over the diff (Approved w/ suggestions; 2 Important sentinel-coherence findings fixed pre-commit). Review at `docs/code-reviews/2026-06-06-wave1-self-improvements.md`.
- **Wave 2 R1 — ADR-0003 ACCEPTED + committed (`0a193f8`).** Full Architecture Decision Gate run with standalone agents:
  - Design **inverted** from a 3-tier project label to a **per-feature hazard trip-wire** (4 fail-closed questions: no-human-in-loop+injection / irreversible-or-money / standing-creds / data-exposure) as the load-bearing gate; project tier (0/1/2) demoted to a default sensitivity the wire overrides upward.
  - Pierrot conditions (all applied): Q4 + Q1-injection, security lens non-droppable at every tier, S1 decoupled (taxonomy owns the wire).
  - Pat changes: measurable acceptance metric (mean control count vs flat baseline; trip-to-track coverage = 100%) + quickstart safety-floor framing. Pat's A/C (command wiring) deferred to implementation.
  - Debate record: `docs/tracking/2026-06-06-risk-tiers-debate.md`.

## Current State

- **Branch:** `docs/cross-repo-lessons` (3 commits ahead of `origin` — **NOT pushed**, no PR).
  - `eb906d6` decision record (prior session)
  - `b030a00` Wave 1 implementation
  - `0a193f8` ADR-0003 accepted + debate artifact + citation fix
- **Working tree:** clean.
- **Tests:** N/A — no application code changed this session (framework markdown + ADRs only).
- **Board:** not configured (`project-number`/`project-owner` empty in CLAUDE.md) — board checks skipped.

## What To Do Next (in order)

1. Read `docs/adrs/0003-project-risk-tiers.md` (esp. §1 the four-question trip-wire, §4 the differential-ceremony table, and the "Implementation note") and `docs/tracking/2026-06-06-risk-tiers-debate.md`.
2. **R1 implementation (the next chunk — this is the deferred wiring of an Accepted ADR):**
   - Add `<!-- risk-tier: 1 -->` field to `CLAUDE.md` in the Tracking config region (~line 100, near the adapter markers).
   - Add a "Hazard Trip-Wire (4 checks)" subsection to the `CLAUDE.md` Session Entry Protocol (rides the per-item board-add step) and mirror it in `.claude/agents/pierrot.md`.
   - Wire tier-seeding into `.claude/commands/kickoff.md` Phase 1b (Pat's **Change A** — Pat gave exact wording in-session) and `.claude/commands/quickstart.md` (Pat's **Change C** — one-line `risk-tier: 1` default + re-tier note).
   - Add the `/sprint-boundary` re-tier trigger (`.claude/commands/sprint-boundary` or the skill).
   - Add a one-time "Risk Tier" subsection to `docs/product-context.md` IF/when that file exists (it does not yet; Pat flagged she'd add it on approval).
   - Update the §4 differential-ceremony rules wherever the Done Gate / code-review / TDD docs need to *read* the tier (light touch — the ADR is the spec).
   - **Pierrot retains sign-off** on anything that touches the security-lens-non-droppable rule.
3. **Then continue Wave 2 in order:** gap `#2` review-reliability ADR (G1–G5; Pierrot signs off on the implemented `code-reviewer.md`) → `S1` Tier-2 safety track ADR (Pierrot+Archie; S1 owns the hazard taxonomy the trip-wire keys off) → `M1` backflow spike decision (Grace).
4. **Push / PR decision:** the branch has 3 unpushed commits and no PR. Decide whether to push + open a PR for the self-improvement work, or keep accumulating locally.

## Tracked Risks / Open Follow-ons

- **Baseline ceremony granularity (from the R1 debate):** Archie kept 3 tiers to gate *non-safety* baseline ceremony (TDD relaxations, Done-Gate breadth, lens count). Whether that baseline should *also* be per-item (like the safety axis now is) is un-litigated — flagged for a future ADR, not blocking.
- **R1 acceptance metric is live:** measure over the next 2 sprints OR 2 summon repos (whichever yields ≥1 trip). Kill criterion: revert if non-tripping Tier-0/1 items show no reduction in mean control count, OR any tripped item merged without its S1 artifact.
- **gotchas.md:113** (G5 "hand-author the file" advice) is still UNTOUCHED — reconcile only when gap #2 is implemented (it contradicts the file+sentinel design once #2 lands).

## Proxy Decisions (Review Required)

- None. The human was present and approved each gate decision directly.

## Key Context

- **The headline:** R1's mechanism is the **per-feature hazard trip-wire**, not the project tier. The tier is a cheap default; the wire (fail-closed, per work item) is what actually switches on the S1 safety track. Any item that trips gets the safety track in any project at any tier.
- **Wave 1's sentinel discipline is now load-bearing** for all future agent work: agents write findings to files ending in `<AGENT>-COMPLETE: <count>`; the **coordinator** (not the agent) verifies the count and re-runs on mismatch. The R1 gate dogfooded this (verified each agent's file on disk via grep/Read before trusting it).
- Resumable agents from this session (if needed): the last Archie (B/D/E) `a25eb5891f6e7ed16`, Pierrot `a38b2429964270eb0`, Pat `a65341865ef6dc2dd`, Wei `a42be351424a75be0`.
- **Don't push without being asked.** Branch is local-only by design this session.
