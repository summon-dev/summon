---
agent-notes: { ctx: "phase-dependent team compositions for hybrid methodology", deps: [docs/methodology/personas.md, CLAUDE.md, docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0005-single-threaded-default.md, docs/adrs/0006-harness-contract.md], state: canonical, last: "sato@2026-05-02" }
---

# Hybrid Team Methodology

## TL;DR

Summon organizes AI-assisted development into **8 phases** (numbered 1–7 plus Phase 2.5), each with a different team structure. You don't need to memorize this — the coordinator picks the right team automatically.

| Phase | When | Lead | Model |
|-------|------|------|-------|
| 1. Discovery | New idea or vague request | Cam | Blackboard (open brainstorm) |
| 2. Architecture | Design decisions, tech choices | Archie | Ensemble + Wei debate |
| 2.5. Feature Spec | M+ item before TDD red phase | Pat → Cam → (Archie) → Tara | Pipeline (author → review → gate) |
| 3. Implementation | Writing code | Tara → Sato | TDD pipeline (red-green-refactor) |
| 4. Parallel Work | 3+ independent items meeting ADR-0005 escalation criteria | Grace | Single-threaded by default; market by exception |
| 5. Code Review | Reviewing changes | Vik + Tara + Pierrot | Three parallel lenses |
| 6. Debugging | Fixing bugs | Sato | Blackboard (shared investigation) |
| 7. Human Interaction | Consulting the user | Cam | Single point of contact |

**Next:** See [personas.md](personas.md) for the full agent roster. See [../process/team-governance.md](../process/team-governance.md) for triggers, debate protocol, and governance rules.

---

Different development phases need different organizational structures. Instead of a fixed hierarchy, the coordinator selects the appropriate team composition at each phase transition. This document defines the 7 phases, their org models, and which agents participate.

## Core Insight

No single org structure works for everything:
- **Discovery** needs a shared workspace where anyone can contribute ideas (blackboard)
- **Implementation** needs a strict pipeline with clear handoffs (TDD pipeline)
- **Code review** needs multiple independent reviewers working in parallel (ensemble)
- **Debugging** needs open collaboration on a shared problem space (blackboard)

The coordinator's job is to recognize phase transitions and assemble the right team.

## The 7 Phases

### Phase 1: Discovery

**Org Model:** Blackboard (shared workspace, anyone contributes)

| Role | Agent | Responsibility |
|------|-------|---------------|
| Lead | **Cam** | Elicitation, probing, clarifying |
| Contribute | **Pat** | Business value, priorities |
| Contribute | **Dani** | Sacrificial concepts, user needs |
| Contribute | **Wei** | Challenge assumptions |
| Optional | **Debra** | Data/ML feasibility |

**How it works:** Cam leads elicitation. All contributing agents can add ideas to the "blackboard" (plan document). No hierarchy — the best idea wins regardless of source. Cam synthesizes and confirms with the human.

**Transition to next phase:** When the human confirms the vision is clear and the direction is chosen.

---

### Phase 2: Architecture

**Org Model:** Ensemble + Adversarial Debate

| Role | Agent | Responsibility |
|------|-------|---------------|
| Lead | **Archie** | System design, ADR authorship |
| Challenger | **Wei** | Devil's advocate on every decision |
| Reviewer | **Vik** | Simplicity check on proposed architecture |
| Constraint | **Pierrot** | Security surface assessment |
| Constraint | **Ines** | Operational feasibility |
| Optional | **Cloud Architect** | Cloud-specific design (if targeting cloud) |

**How it works:** Archie proposes architecture. Wei challenges it (adversarial debate protocol). Vik checks for over-engineering. Pierrot flags security concerns. Ines validates operational feasibility. Debates are multi-round — see the Adversarial Debate Protocol in `docs/process/team-governance.md`.

**Mandatory steps before transition:**
1. Archie writes or updates an ADR in `docs/adrs/`.
2. Wei is invoked as a **standalone agent** to challenge the ADR. This is NOT optional — skipping Wei is a process violation.
3. The multi-round debate (minimum 2 rounds) is executed and tracked in `docs/tracking/YYYY-MM-DD-<topic>-debate.md`.
4. The ADR is updated to reflect debate outcomes.

**Transition to next phase:** When ALL of the following are true:
- The ADR exists and is marked Accepted.
- Wei has challenged it and the debate is tracked.
- The human approves the architecture.

**If this phase is skipped:** The coordinator must check at Implementation entry: "Is there an architectural decision embedded in this work item?" If yes, **stop** — return to Phase 2 before proceeding. An architectural decision made during implementation without Wei's challenge is a process failure that will be flagged in the sprint retro.

---

### Phase 2.5: Feature Spec

**Org Model:** Pipeline (author → coherence-review → verifiability gate)

| Stage | Agent | Responsibility |
|------|-------|---------------|
| Author | **Pat** (or human / coordinator in proxy mode) | Drafts the six-section spec at `docs/specs/<work-item-id>-<slug>.md` |
| Coherence review | **Cam** | Pressure-tests spec-vs-AC drift between authoring and Tara's gate |
| Architecture review (conditional) | **Archie** | Reviews any Key Decision touching cross-component interfaces, persistence, security, or external dependencies — escalates to a new ADR if the decision is architectural |
| Verifiability gate | **Tara** | Confirms the Verification Plan is sufficient before red phase begins |

**How it works:** For items requiring a spec (M+ by default; S by opt-in with audit trail; XS forbidden), Pat authors the six-section spec per [ADR-0004 § 1](../adrs/0004-feature-spec-artifact.md#1-schema): Outcomes, Scope, Constraints, Key Decisions, Task Breakdown, Verification Plan. Cam pressure-tests for spec-vs-AC drift. Archie reviews when objective triggers fire (cross-component, persistence, security, external deps). Tara confirms the Verification Plan supports the red phase. The spec becomes canonical when the human (or Pat in proxy mode for non-architectural items) confirms it.

**Citation requirements (mechanical):** Each Scope bullet MUST cite the AC it bounds. Each Key Decision MUST cite the governing ADR or declare "no ADR applies because <one-sentence rationale>". A spec failing either check is non-conformant; Tara returns it before red phase.

**Size carve-out** (per [ADR-0004 § 4](../adrs/0004-feature-spec-artifact.md#4-size-carve-out)):

| Size | Spec status |
|---|---|
| XS | Forbidden — commit + tests are the contract |
| S | Optional, default off; opt-in requires one-line rationale + Pat + Tara sign-off |
| M | Required |
| L | Required |
| XL | Required + decomposition review (Pat + Archie + Grace) |

**Tara hard-backstop:** Tara MUST refuse to author tests for any M+ item that has no spec link. This rule is active independent of the Done Gate amendment and survives any pre-W1.1-landing window.

**Architectural escalation:** If Archie deems any Key Decision architectural rather than item-local, the spec stalls and a new ADR is opened. The work item halts until that ADR is Accepted. There is no "Archie noted this and we proceeded" path.

**Template:** [`docs/scaffolds/feature-spec.md`](../scaffolds/feature-spec.md). Slash command stub: `/feature-spec`.

**Transition to next phase:** When the spec is canonical, citations verify, and Tara has accepted the Verification Plan.

---

### Phase 3: Implementation (TDD Pipeline)

**Org Model:** Pipeline (strict sequential handoffs)

| Stage | Agent | Responsibility |
|-------|-------|---------------|
| Red | **Tara** | Write failing tests |
| Green | **Sato** | Make tests pass with minimum code |
| Refactor | **Sato** | Clean up while keeping tests green |
| Verify | **Tara** | Confirm tests pass, coverage adequate |

**How it works:** Strict TDD pipeline. Tara writes failing tests first. Sato implements. Sato refactors. Tara verifies. No skipping steps. For items sized M or larger, Tara must be invoked as a standalone agent (not inlined by Sato).

**Transition to next phase:** When implementation is complete and tests pass.

---

### Phase 4: Parallel Work

**Org Model:** Market / Self-claim

| Role | Agent | Responsibility |
|------|-------|---------------|
| Coordinator | **Grace** | Work distribution, status tracking |
| Workers | **Sato** (x N) | Parallel implementation streams |
| Workers | **Tara** (x N) | Parallel test writing |
| Workers | **Dani** | UI/UX work (parallel to backend) |
| Workers | **Ines** | Infrastructure work (parallel to app code) |
| Workers | **Diego** | Documentation (parallel to implementation) |

**How it works:** Grace identifies independent work items that may proceed in parallel. Agents are assigned non-overlapping work. Multiple Task tool calls launch parallel agent teams. Grace tracks progress and flags blockers.

**When to use:** Code-write work runs **single-threaded by default** per [ADR-0005](../adrs/0005-single-threaded-default.md). Parallel write streams are permitted only when **all three** escalation criteria are met — (1) measured single-thread ceiling, (2) clean ownership per ADR-B (once Accepted), (3) ≤5 streams — and Grace has authored a parallelization proposal approved by the human (or Pat in proxy mode). Parallelism is the exception, not the default. Read-side parallelism (multi-lens code review, parallel architecture debate, parallel specialist consultation) is **unaffected** by this rule and remains the model for those activities. The Phase 4 mechanics — ownership map artifact, partition lifecycle, market vs. assignment dynamics — are deferred to ADR-B / W2.1 and are subject to revision when that ADR lands.

**Transition to next phase:** When all parallel work items are complete.

---

### Phase 5: Code Review

**Org Model:** Ensemble (3 parallel reviewers)

| Role | Agent | Responsibility |
|------|-------|---------------|
| Coordinator | Orchestrator | Launches reviewers, synthesizes |
| Reviewer | **Vik** | Simplicity, maintainability |
| Reviewer | **Tara** | Test quality, coverage |
| Reviewer | **Pierrot** | Security surface |
| Optional | **Dani** | UI/UX review (if frontend changes) |

**How it works:** All three reviewers run in parallel (same message, multiple Task calls). Each provides independent findings. The coordinator synthesizes findings by severity. If a reviewer flags a blocking concern, it triggers adversarial debate with the implementer (Sato).

**Transition to next phase:** When all critical and important findings are addressed.

---

### Phase 6: Debugging

**Org Model:** Blackboard (shared problem space)

| Role | Agent | Responsibility |
|------|-------|---------------|
| Lead | **Sato** | Hypothesis generation, fix implementation |
| Contribute | **Tara** | Reproduce via failing test |
| Contribute | **Vik** | Pattern recognition, root cause intuition |
| Contribute | **Pierrot** | Security-related root causes |
| Optional | **Ines** | Infrastructure-related root causes |
| Optional | **Debra** | Data/ML-related root causes |

**How it works:** Shared "blackboard" — a debugging document where agents post hypotheses, observations, and evidence. Tara writes a failing test that reproduces the bug. Sato investigates and fixes. Vik contributes pattern-based intuition. Any agent can contribute if they spot something.

**Backlog scan:** Before designing new diagnostic tooling, Tara and Sato check the backlog for features that could help diagnose or reproduce the bug. A planned "preview" feature, "debug panel," "export" capability, or "logging enhancement" may already solve the diagnostic need. If found, flag it to Pat for dual-duty pull-forward consideration.

**Transition to next phase:** When the bug is fixed and the regression test passes.

---

### Phase 7: Human Interaction

**Org Model:** Hierarchical (single point of contact)

| Role | Agent | Responsibility |
|------|-------|---------------|
| Lead | **Cam** | All human-facing communication |
| Support | **Pat** | Business context for decisions |
| Support | **Grace** | Status updates, progress reports |

**How it works:** Cam is the single point of contact for the human. Other agents feed information to Cam, who synthesizes and presents it. This prevents the human from being overwhelmed by multiple agent voices. Cam translates between agent-speak and human-speak.

**When to use:** Any time the human needs to be consulted, informed, or asked for a decision. Cam is the default for all human interaction unless the human explicitly asks to speak to a specific agent.

**Proxy mode:** When the human declares unavailability (e.g., "I'm going to bed"), Pat becomes Lead for product questions. The coordinator routes questions that would normally go to the human through Pat instead. Pat uses `docs/product-context.md` to answer within the human's known preferences, applying conservative defaults for uncovered areas. Pat cannot approve ADRs, change scope, make architectural choices, or override vetoes — those block until the human returns. All proxy decisions are recorded in the cross-session progress note's **Blockers** section per [ADR-0006](../adrs/0006-harness-contract.md) (canonical artifact at `.claude/progress-note.md`; written by `/handoff`). Proxy mode ends when the human sends any message.

**Cross-session continuity (harness contract).** [ADR-0006](../adrs/0006-harness-contract.md) defines the canonical cross-session artifact: a structured progress note at `.claude/progress-note.md` with a fixed header (`session-date`, `author`, `prior-note-commit`) and five named sections (State, Next Step, Learnings, Open Questions, Blockers). The `/handoff` command writes it; the schema is binding and the command refuses to write a non-conforming note. The `/resume` command reads it in the order **State → Blockers → Open Questions → Next Step → Learnings**. The legacy `.claude/handoff.md` is a single-line redirect after W1.3 close.

**Harness role mapping (planner / generator / evaluator overlay).** Per [ADR-0006 § 2 Persona-Role Mapping](../adrs/0006-harness-contract.md#2-persona-role-mapping), Summon adopts the *functional* separation of plan / generate / evaluate but rejects a one-to-one persona triad. The mapping:

| Harness role | Summon binding |
|---|---|
| **Plan** | The feature-spec artifact (per [ADR-0004](../adrs/0004-feature-spec-artifact.md)). Plan-quality is jointly owned: Pat decomposes (authorship), Cam coherence-checks, Archie architecture-gates, Tara verifies. |
| **Generate** | **Sato.** |
| **Evaluate** | **Tara**, applying the Verifiability gate from ADR-0004. |

This is a documentation overlay on existing personas — no persona file is rewritten by the mapping. For below-spec items (XS, S without opt-in), the in-flight progress note's Next Step stands in for the spec.

---

## Phase Selection Flowchart

```mermaid
flowchart TD
    A{"New idea or<br/>vague request?"} -->|Yes| P1["Phase 1: Discovery"]
    A -->|No| B{"Architectural<br/>decision?"}
    B -->|Yes| P2["Phase 2: Architecture<br/><em>ADR + Wei debate + tracking</em>"]
    B -->|No| C{"Code to write?"}
    C -->|Yes| D{"Embeds an arch<br/>decision?"}
    D -->|Yes| STOP["STOP — Route to<br/>Phase 2 first"]
    D -->|No| SPEC{"Item is M+ size<br/>or S-with-opt-in?"}
    SPEC -->|Yes| P25["Phase 2.5: Feature Spec<br/><em>Pat authors, Cam coherence,<br/>Tara verifiability gate</em>"]
    SPEC -->|No| E{"Parallel work<br/>(ADR-0005 escalation<br/>criteria met)?"}
    P25 --> E
    E -->|Yes| P4["Phase 4: Parallel Work<br/><em>each item uses Phase 3</em>"]
    E -->|No| P3["Phase 3: Implementation<br/><em>TDD pipeline</em>"]
    C -->|No| F{"Code to review?"}
    F -->|Yes| P5["Phase 5: Code Review"]
    F -->|No| G{"Bug to fix?"}
    G -->|Yes| P6["Phase 6: Debugging"]
    G -->|No| P7["Phase 7: Human Interaction"]

    style STOP fill:#ffcdd2,stroke:#c62828
    style P1 fill:#e1f5fe
    style P2 fill:#fff3e0
    style P25 fill:#fff3e0
    style P3 fill:#e8f5e9
    style P4 fill:#e8f5e9
    style P5 fill:#fce4ec
    style P6 fill:#fff8e1
    style P7 fill:#f3e5f5
```

## Phase Nesting

Phases can nest. Common patterns:

- **Parallel Work** contains multiple **Implementation** pipelines running concurrently
- **Discovery** may trigger **Architecture** for technical feasibility checks
- **Code Review** may trigger **Debugging** if a reviewer finds a bug
- **Any phase** can trigger **Human Interaction** when a decision is needed

The coordinator manages the phase stack — knowing which phase is active and which phases are suspended waiting for a sub-phase to complete.

## Agent Participation Summary

| Agent | Discovery | Architecture | Implementation | Parallel | Review | Debugging | Human |
|-------|:---------:|:------------:|:--------------:|:--------:|:------:|:---------:|:-----:|
| **Cam** | Lead | | | | | | Lead |
| **Sato** | | | Green+Refactor | Worker | | Lead | |
| **Tara** | | | Red+Verify | Worker | Reviewer | Contribute | |
| **Pat** | Contribute+1b | | | | | | Lead/Support* |
| **Grace** | | | | Coordinator | | | Support |
| **Archie** | | Lead | | | | | |
| **Dani** | Contribute | | | Worker | Optional | | |
| **Pierrot** | | Constraint | | | Reviewer | Contribute | |
| **Vik** | | Reviewer | | | Reviewer | Contribute | |
| **Ines** | | Constraint | | Worker | | Optional | |
| **Diego** | | | | Worker | | | |
| **Wei** | Contribute | Challenger | | | | | |
| **Debra** | Optional | | | | | Optional | |
| **Cloud** | | Optional | | | | | |

**Table annotations:**
- **+1b**: Pat leads Discovery Phase 1b (Human Model Elicitation) after Cam's vision elicitation.
- **Lead/Support***: Pat is Lead in proxy mode (human unavailable), Support in normal mode.
