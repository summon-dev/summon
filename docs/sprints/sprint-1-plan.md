---
agent-notes: { ctx: "sprint 1 plan: align Summon with 2026 agentic consensus", deps: [CLAUDE.md, docs/methodology/phases.md, docs/process/team-governance.md, docs/methodology/personas.md, docs/adrs/0005-single-threaded-default.md], state: active, last: "claude@2026-05-02", key: ["3 waves, 8 items", "no board: track in-repo", "6 ADRs gated", "W1.2 Done"] }
---

# Sprint 1 Plan — Align with 2026 Agentic Coding Consensus

**Sprint goal:** Update Summon's methodology, persona model, and runtime rules to reflect the 2026 consensus on agentic coding team structure (spec-driven, single-writer, ownership-partitioned, judge-gated).

**Tracking:** No project board configured (`gh` missing, `project-number` empty). Track items in this file. Status flow per item: Planned → In Progress → In Review → Done.

**Wave strategy:** Three waves grouped by dependency and context cost. Each wave is one session; commit + `/handoff` between waves. ADR-gated items must clear the Architecture Gate (Archie + Wei) before any prose/persona/process changes ship.

**Authoritative rollout source:** Wave order, halt-points, rollback rules, and intermediate-state behavior are governed by [ADR-0003 § Rollout](../adrs/0003-research-driven-restructure-2026.md). If this plan and ADR-0003 conflict, ADR-0003 wins.

**Per-ADR binding constraints:** Each follow-on ADR (W1.1, W1.3, W2.1–W2.3, W3.1–W3.2) inherits binding constraints from ADR-0003's follow-on table — including a mandatory "Considered and Rejected" subsection. Acceptance criteria below are the *delivery* criteria; ADR-0003's constraints are the *content* criteria.

---

## Wave 1 — Foundational Doctrine (3 items)

These are the upstream changes the rest depend on. Each rewrites a core mental model and needs an ADR.

### W1.1 — Feature-Spec Artifact Between ADR and TDD (Proposal A)
- **Size:** M
- **ADR required:** Yes (`adrs/NNNN-feature-spec-artifact.md`) — Archie + Wei
- **Acceptance criteria:**
  - ADR accepted, debate tracked, human approved.
  - New phase doc section "Phase 2.5: Feature Spec" or equivalent insertion in `docs/methodology/phases.md` defining the artifact: outcomes, scope (in/out), constraints, key decisions, task breakdown, verification plan.
  - Template at `docs/scaffolds/feature-spec.md` plus `/feature-spec` slash command stub.
  - Session Entry Protocol in `CLAUDE.md` updated with a fourth question: "Does this work item have a feature spec?"
  - Done Gate updated to require feature spec link for M+ items.

### W1.2 — Single-Threaded by Default Rule (Proposal H)
- **Size:** S
- **ADR required:** Slim ADR or amendment to existing parallel-work guidance — Archie (Wei challenge optional, single round).
- **Acceptance criteria:**
  - `CLAUDE.md` adds explicit "Single-threaded by default for write tasks" rule with escalation criteria (measured ceiling, clean ownership, ≤5 streams).
  - `docs/methodology/phases.md` Phase 4 entry rule updated: parallel-by-exception, not by-default.
  - Anti-pattern entry added to `docs/process/gotchas.md`.

### W1.3 — Harness Contract + Cross-Session Progress Note (Proposal C)
- **Size:** M
- **ADR required:** Yes — Archie + Wei. Harness role mapping (Pat=planner, Sato=generator, Tara=evaluator) is a structural claim about how Summon maps to the Anthropic three-agent harness; Wei must challenge.
- **Acceptance criteria:**
  - ADR accepted, debate tracked, human approved.
  - Structured progress-note schema documented (header + State, Next Step, Learnings, Open Questions, Blockers per ADR-0006 § 1); template at `docs/scaffolds/progress-note.md`; canonical artifact at `.claude/progress-note.md`.
  - `/handoff` command updated to emit this schema with mechanical refusal conditions.
  - `/resume` command updated to consume this schema.
  - Phase doc annotates the planner/generator/evaluator mapping.
  - Legacy `.claude/handoff.md` overwritten with single-line redirect at W1.3 close (per ADR-0006 § 3).
  - **Note (2026-05-02):** ADR-0006 § Persona-Role Mapping → "What this means for personas.md" explicitly says **no persona file is edited** — the harness mapping is a documentation overlay (added to `phases.md` and ADR-0006 only). This supersedes the prior AC bullet "Phase doc and personas.md annotate the mapping" per the gotchas rule "Sprint plan must not contradict accepted ADRs."

**Wave 1 exit criteria:** Three ADRs accepted; `phases.md`, `CLAUDE.md`, `gotchas.md` updated; templates exist. Commit, handoff.

---

## Wave 2 — Org Model Restructure (3 items)

Builds on Wave 1's doctrine. These restructure phase mechanics and depend on the feature-spec and single-threaded rules being in place.

### W2.1 — Owned Partition Replaces Self-Claim (Proposal B)
- **Size:** M
- **ADR required:** Yes — Archie + Wei. Re-frames Phase 4.
- **Depends on:** W1.2 (single-threaded default).
- **Acceptance criteria:**
  - ADR accepted, debate tracked, human approved.
  - Phase 4 in `phases.md` rewritten: ownership map artifact required before parallel launch; cap of ~5 concurrent streams; parallel-by-exception phrasing.
  - Ownership map template added under `docs/scaffolds/`.
  - Grace's persona/agent file updated to reflect ownership-map authorship.

### W2.2 — Single-Writer Hierarchy for Discovery and Debugging (Proposal E)
- **Size:** M
- **ADR required:** Yes — Archie + Wei. Replaces blackboard-with-many-writers in two phases.
- **Acceptance criteria:**
  - ADR accepted, debate tracked, human approved.
  - Phase 1 (Discovery) in `phases.md` updated: Cam is sole writer to the discovery doc; specialists feed structured returns.
  - Phase 6 (Debugging) updated: Sato sole writer to the debug blackboard; Tara/Vik/Pierrot return structured findings.
  - "Structured return" schema defined for specialist contributions.

### W2.3 — Formalize Vik+Tara+Pierrot as Judge Stack (Proposal F)
- **Size:** M
- **ADR required:** Yes — Archie + Wei. Promotes review trio to gate semantics.
- **Acceptance criteria:**
  - ADR accepted, debate tracked, human approved.
  - Phase 5 in `phases.md` reframed as judge stack: Vik (simplicity), Tara (correctness), Pierrot (security) with explicit gate semantics.
  - Replay step documented (re-run judges after fixes on critical findings).
  - Disagreement escalation path documented (judge disagreement → Archie or human).
  - Done Gate updated to reference judge-stack pass.

**Wave 2 exit criteria:** Three ADRs accepted; phase docs rewritten; ownership map and structured-return schemas exist. Commit, handoff.

---

## Wave 3 — Persona Surface Cleanup (2 items)

Lowest leverage, but cleanest once doctrine and org model are settled. Mostly file rearrangement and metadata changes — high context cost if interleaved with doctrine work, low cost done together at the end.

### W3.1 — Split Personas into Agents vs Skills (Proposal D)
- **Size:** L
- **ADR required:** Yes — Archie + Wei. New top-level concept ("Skills") in the methodology.
- **Depends on:** W1.1 (feature-spec format), W2.3 (judge stack defines what review is).
- **Acceptance criteria:**
  - ADR accepted, debate tracked, human approved.
  - New doc `docs/methodology/skills.md` defines the agent-vs-skill distinction.
  - Procedural items demoted to Skills: agent-notes enforcement, Done Gate checklist execution, conventional-commits format, tracking pre-flight check. Skill files created under `docs/methodology/skills/` (or `.claude/skills/`, decided in ADR).
  - `personas.md` and `team-governance.md` updated to reflect the cleaner persona surface.
  - `CLAUDE.md` references skills where appropriate.

### W3.2 — Slim Rarely-Active Personas to Summoned Specialists (Proposal G)
- **Size:** S
- **ADR required:** Slim ADR or amendment — Archie (Wei challenge optional).
- **Depends on:** W3.1 (skills concept exists).
- **Acceptance criteria:**
  - Cloud, Debra, Diego, Dani persona files reframed as summoned specialists; their procedural responsibilities (where any) moved to skills per W3.1.
  - `team-governance.md` capability roster annotated to mark these as on-demand.
  - Phase participation table in `phases.md` updated.
  - No removal of capability — only restructuring of when/how summoned.

**Wave 3 exit criteria:** Two ADRs (one full, one slim) accepted; skills directory populated; persona files restructured. Commit, handoff, run `/sprint-boundary`.

---

## ADR Summary

| Item | ADR Type | Gate |
|------|----------|------|
| W1.1 Feature spec | Full | Archie + Wei + human |
| W1.2 Single-threaded default | Slim/amendment | Archie + light Wei |
| W1.3 Harness contract | Full | Archie + Wei + human |
| W2.1 Owned partition | Full | Archie + Wei + human |
| W2.2 Single-writer hierarchy | Full | Archie + Wei + human |
| W2.3 Judge stack | Full | Archie + Wei + human |
| W3.1 Agents vs Skills | Full | Archie + Wei + human |
| W3.2 Slim personas | Slim/amendment | Archie + light Wei |

Six full ADRs, two slim. All Wave 1 and Wave 2 items must clear the gate before their prose changes ship.

---

## Prioritization Tradeoffs Flagged

- **Wave 1 doctrine before Wave 2 mechanics.** Tempting to start with Phase 4 ownership map (it's tangible), but the feature-spec and single-threaded rule reframe what Phase 4 is *for*. Doing W2.1 first would mean rewriting it after W1.
- **W3.1 (Skills) is L, not M.** It touches every persona file and creates a new methodology concept. Resist the urge to fold it into Wave 2; it deserves its own session.
- **W2.3 (Judge stack) before W3.1 (Skills).** The Done Gate checklist is one of the items being demoted to a Skill. We need the judge stack to be the formal correctness/simplicity/security gate first, otherwise demoting Done-Gate-execution to a skill leaves a hole.
- **Six full ADRs is heavy.** Acceptable because this is a methodology-defining sprint. Future sprints should not look like this.

---

## Deferred / Out-of-Scope

Surfaced by the research pass but not in Sprint 1:

- **Failure-mode taxonomy doc.** The 2026 sources include taxonomies (context loss, premature commit, hallucinated dependencies, etc.). Belongs in a future `docs/process/failure-modes.md`. Defer to Sprint 2.
- **Spec-driven dev tooling beyond the artifact.** Linters or validators for feature-spec completeness. Wait until W1.1 ships and we feel the pain.
- **Cognition-vs-Anthropic debate write-up.** Interesting context but not actionable; could become a `docs/methodology/influences.md` or stay in commit messages.
- **Metrics/telemetry on harness contract adherence.** Measuring whether progress notes actually reduce cross-session loss. Needs the harness contract live first; revisit after one sprint of using it.
- **Tracking-board setup (`gh` install + project-number).** Orthogonal to this research; user will configure when ready. Sprint 1 runs in-repo.
- **CLI scaffolder (`create-summon`) and marketing site updates.** Both will need to reflect the new doctrine eventually but should not be touched until methodology is settled.

---

## Status Tracker

| ID | Title | Size | Status |
|----|-------|------|--------|
| W1.1 | Feature-spec artifact | M | ADR human-Accepted (Shadow-Pilot phase); doc edits pending |
| W1.2 | Single-threaded default | S | Done (CLAUDE.md, phases.md Phase 4, gotchas.md updated) |
| W1.3 | Harness contract + progress note | M | In Progress: template, /handoff, /resume, phases.md done; redirect cutover + first canonical progress note pending; pilot post-mortem after W1.1 |
| W2.1 | Owned partition | M | Planned |
| W2.2 | Single-writer hierarchy | M | Planned |
| W2.3 | Judge stack | M | Planned |
| W3.1 | Agents vs Skills | L | Planned |
| W3.2 | Slim personas | S | Planned |
