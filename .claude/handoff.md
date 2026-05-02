<!-- agent-notes: { ctx: "session handoff: Wave 1 architecture gates closed; awaiting human Accept on 2 conditional ADRs", deps: [docs/sprints/sprint-1-plan.md, docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0005-single-threaded-default.md, docs/adrs/0006-harness-contract.md], state: active, last: "claude@2026-05-02" } -->

# Session Handoff

**Created:** 2026-05-02
**Sprint:** 1
**Wave:** 1 of 3 — Architecture gates closed; implementation work pending
**Session summary:** Researched 2026 agentic coding consensus, drafted umbrella ADR-0003 + 3 follow-on ADRs (A/H/C), ran 4 Wei rounds, applied amendments. ADR-0003 + ADR-0005 Accepted; ADR-0004 + ADR-0006 in Shadow-Pilot phase awaiting human Accept.

## What Was Done

- **Research pass** on 2026 agentic coding team structure (Cognition vs Anthropic, spec-driven dev, Anthropic harness papers, failure-mode taxonomies). 8 proposals (A–H) for adapting Summon. Sources documented in initial assistant message.
- **Sprint 1 plan authored** at `docs/sprints/sprint-1-plan.md`. 3 waves, 8 items, 6 full + 2 slim ADRs. Wave 1 (doctrine) → Wave 2 (org model) → Wave 3 (persona surface).
- **ADR-0003 (umbrella) authored, Wei-challenged, amended, Accepted.** Direction commitment: single-writer, spec-driven, harness-first. 8 follow-on ADRs (A–H) constrained by binding clauses in the umbrella's follow-on table. Halt-rule: Wave N+1 cannot begin until all of Wave N is Accepted. Pilot-before-broad rule binds ADR-A and ADR-B.
- **Split-persona pattern added to ADR-0003** by human-driven amendment after the Dani-as-skill discussion. ADR-D MUST treat "split into agent + companion skill" as a first-class third option; Dani is the canonical worked example (agent retains gate, WCAG checklist becomes `frontend-accessibility` skill).
- **ADR-0004 (feature-spec artifact) authored, Wei round 1 verdict REWORK, Archie reworked, Wei round 2 verdict ACCEPT WITH AMENDMENTS, 6 amendments folded.** Status: Proposed (Shadow-Pilot phase). Decisions: 5-section schema + size carve-out (XS forbidden, S optional default-off, M+L required, XL required + decomposition), Pat authors + Cam coherence-reviews + Archie escalates + Tara verifies, citation requirements convert prose to mechanical check.
- **ADR-0005 (single-threaded default) authored, Wei skipped per sprint plan W1.2 optional/single-round provision, Accepted.** Decisions: code-writes single-threaded by default; read-side parallelism explicitly preserved; three escalation criteria (measured ceiling, clean ownership per ADR-B, ≤5 streams); Grace refuses unmet proposals; four-lens code review backstops Grace bypass via Premature Parallelism anti-pattern.
- **ADR-0006 (harness contract) authored, Wei verdict ACCEPT WITH AMENDMENTS, 12 amendments folded.** Status: Proposed (Shadow-Pilot phase). Key decisions: schema = header (session-date/author/prior-note-commit) + 5 body sections; persona-role mapping = plan-as-artifact (the spec) / Sato generates / Tara evaluates with plan-quality function distributed across Pat/Cam/Archie/Tara; `/handoff` gate uses explicit Blocker-ID `gates:` list (no semantic-dependency reasoning); `handoff.md` retired by redirect-line cutover at W1.3 close; dual-purpose pilot with ADR-0004 bound by joint-reopen rule if attribution ambiguous.
- **4 Wei debate documents persisted** to `docs/tracking/` (ADR-0003, ADR-0004 r1, ADR-0004 r2, ADR-0006).

## Current State

- **Branch:** `claude/research-agentic-teams-UCssB`
- **Last commit:** `7e5946c` — "docs: ADR-0006 amendments folded (Wei: ACCEPT WITH AMENDMENTS)"
- **Uncommitted changes:** none (working tree clean)
- **Tests:** N/A (this session was architecture/docs only; no test suite exists for the methodology repo)
- **Board status:** **NOT CONFIGURED.** `CLAUDE.md` has empty `project-number` and `project-owner`; `gh` CLI is not installed in this environment. Pre-flight check fails. Sprint 1 has been tracked in-repo via `docs/sprints/sprint-1-plan.md` per CLAUDE.md's session-management guidance. **Action required from human:** run `/kickoff` Phase 5 or manually configure the project board before any work item that requires board status transitions.

## Sprint Progress

- **Wave plan:** `docs/sprints/sprint-1-plan.md`
- **Current wave:** Wave 1 of 3 — Architecture gates **complete**; implementation pending.
- **Wave 1 items completed (architecture gate):**
  - **W1.1 (Feature-spec artifact):** ADR-0004 in Shadow-Pilot phase, awaiting human Accept. Implementation work (CLAUDE.md edits, phases.md insertion, scaffold template, Done Gate update) PENDING.
  - **W1.2 (Single-threaded default):** ADR-0005 Accepted. Implementation work (CLAUDE.md rule, phases.md Phase 4 update, gotchas.md Premature Parallelism entry) PENDING.
  - **W1.3 (Harness contract):** ADR-0006 in Shadow-Pilot phase, awaiting human Accept. Implementation work (`.claude/progress-note.md` template, `/handoff` command rewrite, `handoff.md` redirect-line cutover, Phase 7 / personas.md annotations) PENDING.
- **Wave 1 implementation work is the next session's job.** All 3 ADRs gated; 3 doc-edit work items queued.
- **Next wave (Wave 2):** Items W2.1 (owned partition / ADR-B), W2.2 (single-writer hierarchy / ADR-E), W2.3 (judge stack / ADR-F). All M-sized, all require full Archie + Wei rounds. **Cannot start until all Wave 1 ADRs Accepted AND W1.3 shadow-pilot completes** per ADR-0003's halt rule and ADR-0004's pilot-before-broad rule.
- **Wave 3:** W3.1 (Skills concept / ADR-D, L), W3.2 (slim personas / ADR-G, S).

## What To Do Next (in order)

1. **Read `docs/code-map.md`** — wait, it doesn't exist for this project. Read `CLAUDE.md` instead for project structure (the "Project Structure" tree at the bottom).
2. **Read `docs/product-context.md`** — does not exist. Skip; this project hasn't had product-context elicited.
3. **Read `docs/sprints/sprint-1-plan.md`** for wave context — especially the "Authoritative rollout source" note linking back to ADR-0003 § Rollout.
4. **Confirm human Accept on ADR-0004 and ADR-0006.** Both are at Status: "Proposed (Shadow-Pilot phase)." Per their own Status sections, full Acceptance is conditional on (a) human approval AND (b) shadow-pilot success on W1.3. The first session-resume task is asking the human to confirm Accept (or pointing them at specific sections to revisit). If human says Accept, no edit is needed yet — Status correctly stays "Proposed (Shadow-Pilot phase)" until the conditions land.
5. **Begin Wave 1 implementation work** (assuming ADRs Accepted). The ordering matters because W1.3 implementation includes the new `progress-note.md` template that everything else will use afterward. Recommended order:
   - **W1.2 implementation first** (cheapest, isolates a single concept). Edit CLAUDE.md to add the "Single-Threaded by Default for Code Writes" rule under § Critical Rules (verbatim text in `docs/adrs/0005-single-threaded-default.md` § 5). Update `docs/methodology/phases.md` Phase 4 entry rule from "default to parallel" to "parallel-by-exception." Add Premature Parallelism entry to `docs/process/gotchas.md` (verbatim text in ADR-0005 § 7).
   - **W1.3 implementation second** (delivers the new harness; the pilot for ADR-A and ADR-C run on this work). Create `.claude/progress-note.md` template per ADR-0006 § Schema. Rewrite `.claude/commands/handoff.md` to emit the schema and enforce refusal conditions per ADR-0006 § /handoff Command Contract. At W1.3 close, overwrite `.claude/handoff.md` with the single-line redirect per ADR-0006 § Relationship to handoff.md, and migrate any existing Proxy Decisions into the new Blockers schema per the field mapping. Update `docs/methodology/phases.md` Phase 7 to reference the new schema.
   - **W1.1 implementation third** (depends on Done Gate amendment landing, which makes ADR-0004 broadly enforced). Create `docs/scaffolds/feature-spec.md` template per ADR-0004 § Schema. Add Phase 2.5 (or equivalent insertion) to `docs/methodology/phases.md`. Update `CLAUDE.md` Session Entry Protocol with a fourth question about feature spec presence. Update `docs/process/done-gate.md` with the "spec link present for M+ items" check. **Then** run the W1.3 shadow-pilot per ADR-0004 § Pilot Plan and ADR-0006 § Pilot Plan.
6. **Run W1.3 shadow-pilot.** This is *the* dual-purpose pilot for both ADR-0004 and ADR-0006. Score against the 6 ADR-0004 criteria + 5 ADR-0006 criteria independently. If attribution is ambiguous between the two, **joint-reopen rule** applies (both ADRs reopen).
7. **If pilot succeeds AND W1.1 Done Gate amendment lands:** ADR-0004 and ADR-0006 transition to Accepted automatically per their Status conditions. Wave 1 closes. Run `/sprint-boundary`-equivalent (or move directly to Wave 2 planning).

## Tracking Artifacts

Active tracking artifacts from this session — read these for full phase context:

- `docs/tracking/2026-05-02-adr0003-restructure-debate.md` — Wei round 1 on the umbrella (ACCEPT WITH AMENDMENTS, 3 must-change applied).
- `docs/tracking/2026-05-02-adr0004-feature-spec-debate.md` — Wei round 1 on ADR-A (REWORK verdict).
- `docs/tracking/2026-05-02-adr0004-feature-spec-debate-round2.md` — Wei round 2 on ADR-A (ACCEPT WITH AMENDMENTS, 6 amendments).
- `docs/tracking/2026-05-02-adr0006-harness-debate.md` — Wei round 1 on ADR-C (ACCEPT WITH AMENDMENTS, 12 amendments).

ADR-0005 has no debate artifact — Wei was skipped per sprint plan W1.2 optional/single-round provision.

## Proxy Decisions (Review Required)

None. The human was active throughout this session.

## Key Context

- **Read ADR-0003 first** if returning fresh. It is the umbrella; every Wave 1 ADR inherits binding constraints from its follow-on table. The halt-rule (no Wave N+1 until all Wave N Accepted) and the pilot-before-broad rule (ADR-A and ADR-B specifically) are load-bearing.
- **The split-persona pattern** is human-added to ADR-0003 after a discussion about Dani-as-skill. ADR-D (Wave 3) is now bound to use Dani as the canonical worked example of the split (agent + companion skill). Don't lose this when ADR-D is drafted.
- **ADR-0004's Status uses the "Proposed (Shadow-Pilot phase)" pattern,** which ADR-0006 then matched for symmetry. This is the right pattern when an ADR is decided in principle but only enforced on a named pilot work item — keeps the standard taxonomy clean (Wei round 2 of ADR-A caught the prior compound-status anti-pattern).
- **Dual-purpose pilot:** ADR-0004 and ADR-0006 both pilot on W1.3. If W1.3 fails for ambiguous reasons, **both ADRs reopen jointly** per ADR-0006 § Pilot Plan. Don't try to attribute one-sidedly under pressure.
- **The /handoff command itself was used to write THIS file**, but the new schema from ADR-0006 hasn't been implemented yet. So this handoff is in the *old* prose form. The next session's W1.3 implementation work will both rewrite the command AND make the next handoff structured. **Pain points observed for the W1.3 pilot post-mortem (informal signal):**
  - The "sprint number" field doesn't map cleanly when work is mid-wave; flat sprint numbering hides wave structure.
  - "Last commit" is a single field but multiple recent commits matter for state (10-commit log was useful).
  - "What To Do Next" wanted to be both ordered and conditional (steps 4+ depend on human Accept) — the linear list is the wrong structure for branching plans. ADR-0006's `gates:` list on Next Step would have helped here.
  - There was no clean place for "ADR is Proposed (Shadow-Pilot phase) awaiting your Accept" — that's a Blocker, but the prose form scattered it across "What Was Done" and "Current State."
  - "Proxy Decisions" header survived from the template but had nothing to record. The new Blockers schema with explicit `awaiting-human` status would be more honest about empty-vs-skipped.
- **Board is not configured.** Every ADR pretends a board exists for status tracking; in practice everything tracked in the sprint plan file. This will become more painful as more work items spawn.
- **No `MEMORY.md` exists** (the /handoff step 7 referenced one). Skipped that step. Possibly worth creating, possibly not — this is a 1-session-old project.
- **No `docs/product-context.md` exists.** Skipped its read.
- **`docs/code-map.md` does not exist.** The README/CLAUDE.md note that several paths are under `docs/scaffolds/` until a scaffold command moves them — code-map.md is one of those. Don't waste time looking for it; read CLAUDE.md's "Project Structure" section instead.

## Files Materially Touched This Session

| File | Action |
|---|---|
| `docs/adrs/0003-research-driven-restructure-2026.md` | Created, Wei-challenged, amended, Accepted |
| `docs/adrs/0004-feature-spec-artifact.md` | Created, Wei-challenged (2 rounds), reworked, amended; Proposed (Shadow-Pilot) |
| `docs/adrs/0005-single-threaded-default.md` | Created, Accepted (Wei skipped) |
| `docs/adrs/0006-harness-contract.md` | Created, Wei-challenged, amended; Proposed (Shadow-Pilot) |
| `docs/sprints/sprint-1-plan.md` | Created, status updated 4 times |
| `docs/tracking/2026-05-02-adr0003-restructure-debate.md` | Created |
| `docs/tracking/2026-05-02-adr0004-feature-spec-debate.md` | Created |
| `docs/tracking/2026-05-02-adr0004-feature-spec-debate-round2.md` | Created |
| `docs/tracking/2026-05-02-adr0006-harness-debate.md` | Created |
| `.claude/handoff.md` | This file |
