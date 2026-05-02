---
agent-notes: { ctx: "umbrella ADR setting direction for 2026 research-driven restructure", deps: [docs/methodology/phases.md, docs/process/team-governance.md, docs/methodology/personas.md, CLAUDE.md, docs/tracking/2026-05-02-adr0003-restructure-debate.md], state: proposed, last: "archie@2026-05-02" }
---

# ADR-0003: Research-Driven Restructure for 2026 Agentic Coding Findings

## Status

Proposed — amendments applied per Wei challenge ([debate](../tracking/2026-05-02-adr0003-restructure-debate.md)); pending human approval.

## Context

Summon's current shape — 7 phases, 16 personas, blackboard-style Discovery and Debugging, Wei adversarial debate at Architecture, Tara→Sato TDD pipeline, Vik+Tara+Pierrot ensemble review, Grace-coordinated parallel work — was designed before the 2026 wave of agentic coding research consolidated. A scan of that research surfaces eight findings that, taken together, indicate Summon is structurally close to current best practice but materially misaligned on a handful of high-leverage points.

Summarized findings:

1. **Cognition vs Anthropic has settled.** Multi-agent for read/research, single-thread for code-writes. Both camps now agree the failure mode is memory and context, not topology.
2. **Of 8 canonical agent patterns, only hierarchy and graph-orchestrated reliably justify production cost.** Pure swarm and pure blackboard rarely outperform hierarchy for code-writing tasks.
3. **Spec-driven development is the new spine** across 30+ frameworks (Spec Kit, OpenSpec, Tessl, Kiro). Specs as executable contracts: outcomes, scope, constraints, decisions, tasks, verification.
4. **Skills vs subagents are now distinct primitives** — skills carry procedural knowledge, subagents are context-isolated executors. The two compose.
5. **Anthropic's "Effective harnesses for long-running agents"** prioritizes durable structured artifacts (progress files, init scripts, feature lists) over context preservation, with a planner/generator/evaluator three-agent harness.
6. **Judge stacks beat single critics**: multiple gates, replay, disagreement review, human escalation.
7. **Fourteen catalogued failure modes** cluster in three buckets — system design, inter-agent misalignment, task verification. Parallel write conflicts and ownership ambiguity dominate.
8. **Sizing**: 3–7 agents per workflow, hierarchy beyond.

What Summon already gets right — the **principles** below are not up for debate in this ADR, though their concrete artifacts may evolve in follow-on ADRs: phase-dependent hybrid teams, Wei adversarial debate at Architecture, Tara-first TDD as a verifier-critic loop, the Vik+Tara+Pierrot review ensemble, the agent-notes protocol as durable structured metadata, and a continuity artifact between sessions. (Specifically: ADR-F may evolve the *form* of the review ensemble, and ADR-C may evolve the *form* of the continuity artifact, but the *principle* of multi-lens review and cross-session continuity stands.)

## Decision

Summon will adopt a **single-writer, spec-driven, harness-first** model on top of its existing phase-dependent team structure. Concretely, the direction is:

1. **Single-writer by default for code writes.** Multi-agent remains the model for read/research (Discovery, Architecture deliberation, Code Review). Implementation collapses to a single writer per partition.

   **Operational definition (binding for all follow-on ADRs):** "single-writer" means *at most one Sato invocation writing inside a given code partition at a given time*. The umbrella ADR commits only to that. Partition definition, partition lifecycle, parallelism cap across partitions, and the rules for cross-partition work are deferred to ADR-B (partitions) and ADR-H (default thread count). The three meanings — single invocation, single partition owner, single thread of execution — are intentionally separated; follow-on ADRs MUST address each independently and not collapse them.

2. **Specs become the spine between Architecture and Implementation.** ADRs commit to *direction*; feature specs commit to *outcomes, constraints, tasks, and verification* and become the executable contract for TDD.
3. **The team is reorganized into agents and skills.** Frequently-active personas remain context-isolated agents; rarely-active or purely procedural personas become skills that any agent can load. **A third option — splitting a persona into an agent (for judgment and gate enforcement) plus a companion skill (for procedural knowledge any agent loads) — is a first-class option, not an exception.** ADR-D establishes the split pattern; ADR-G applies it per persona.
4. **The harness is made explicit.** Cross-session continuity moves from prose handoff to a structured progress-note schema. The umbrella ADR commits to the *existence* of a planner/generator/evaluator triad as the harness shape; **the persona-to-role mapping is deferred to ADR-C** and not pre-committed here.
5. **Blackboards are replaced with single-writer hierarchies** in Discovery and Debugging. The lead owns the artifact; contributors deliver structured input.
6. **The judge stack is formalized.** Vik+Tara+Pierrot+Archie becomes a named judge stack with replay, disagreement escalation, and human review thresholds.

This umbrella ADR commits to the direction. Each substantive change ships as its own ADR, written and debated separately. Each follow-on ADR carries the **binding constraints** in its row below, in addition to the standard architecture-gate process. Each follow-on ADR MUST also include a *Considered and Rejected* subsection enumerating the strongest counter-evidence to its decision.

| Follow-on | Scope | Binding constraints from this umbrella |
|---|---|---|
| **ADR-A** | Feature-spec artifact between ADR and TDD (schema, lifecycle, ownership) | MUST specify spec applicability by work-item size (XS/S/M/L/XL) and explicitly carve out sizes where the spec is not required |
| **ADR-B** | Phase 4 reframe: owned partitions instead of self-claim market | MUST specify partition lifecycle (creation, transfer, dissolution) and how late-arriving cross-partition work is renegotiated, addressing the Plan-as-Bypass anti-pattern |
| **ADR-C** | Explicit harness contract: progress-note schema and planner/generator/evaluator mapping | MUST debate the persona-to-role mapping from first principles (no pre-commitment to Pat/Sato/Tara); MUST justify why a vendor-published triad shape is the right fit for Summon's persona shape |
| **ADR-D** | Persona split: agents vs skills, with migration list | MUST justify each migration persona-by-persona, citing accountability, tool isolation, and depth-of-expertise consequences. MUST treat "split into agent + companion skill" as a first-class third option alongside stay-agent and become-skill. MUST use **Dani as the canonical worked example** of the split pattern: Dani-the-agent retains the Invisible-UI workflow-step gate (`docs/process/gotchas.md` line 107); the WCAG / sacrificial-concepts / accessibility checklist becomes a `frontend-accessibility` skill that any frontend-writing agent (Sato, Vik, Pierrot, Tara) auto-loads. |
| **ADR-E** | Replace blackboard with single-writer hierarchy in Discovery and Debugging | MUST address the dissenting view that read/research phases (which Discovery and Debugging arguably are) are exactly where multi-agent shines — the burden is on this ADR to show single-writer beats blackboard *for those phases* |
| **ADR-F** | Formalize the judge stack: replay, disagreement review, human escalation | MUST deliver measurable additions over the existing ensemble: numeric escalation thresholds, defined replay mechanics, quantified disagreement criteria. Pure renaming is rejected |
| **ADR-G** | Slim rarely-active personas to summoned specialists | MUST cite the anti-pattern each migration avoids; MAY conclude that a given persona is *not* a candidate for migration; MAY apply the split pattern from ADR-D (agent + companion skill) for any persona where the gate role and the procedural knowledge can cleanly separate. |
| **ADR-H** | Single-threaded-by-default for write tasks (CLAUDE.md amendment) | MUST distinguish between thread count, invocation count, and partition ownership; MUST define escalation criteria from single-thread to parallel |

None of A–H short-circuit its own Wei challenge.

## Rollout, Sequencing, and Halt-Points

Eight ADRs is heavy. The risks are gate fatigue, cross-ADR coupling, and unstable intermediate states where Summon is half-restructured. This section is the binding rollout plan; it overrides any contrary phrasing in the sprint plan.

**Order of acceptance** (matches `docs/sprints/sprint-1-plan.md` waves):

1. **Wave 1 — Doctrine:** ADR-A (feature spec), ADR-H (single-threaded default), ADR-C (harness contract).
2. **Wave 2 — Org Model:** ADR-B (owned partitions), ADR-E (single-writer hierarchy), ADR-F (judge stack).
3. **Wave 3 — Persona Surface:** ADR-D (agents vs skills), then ADR-G (slim rarely-active personas; depends on ADR-D).

**Halt-points.** Acceptance is gated wave-by-wave. Wave 2 may not begin until *all* Wave 1 ADRs are Accepted (or formally rejected with the umbrella amended). Same for Wave 3 vs Wave 2. This eliminates the "half-restructured" risk: at the end of each wave, the methodology is internally consistent.

**Intermediate-state rule.** While a wave is in flight, sprints continue under the *prior* methodology. Mixed-methodology sprints are forbidden; a work item runs end-to-end on one version of the methodology, not crossing a wave boundary mid-flight.

**Rollback.** If any follow-on ADR fails its gate (rejected by Wei, vetoed by human, or revealed unworkable in pilot), this umbrella ADR is **automatically reopened**. The follow-ons in flight pause. The umbrella is amended to reflect what the failure taught us, re-debated, and the wave plan is revised before any wave continues. There is no partial commitment — a failed follow-on means the umbrella was wrong about that direction, and the umbrella is the source of truth.

**Pilot-before-broad rollout.** ADR-A (feature spec) and ADR-B (owned partitions) MUST each pilot on at least one work item before being applied to all work. Pilot results inform any amendment before broad rollout.

## Consequences

### Positive

- Aligns Summon with the 2026 research consensus on context as the primary failure mode and single-writer code paths as the antidote to parallel-write conflicts.
- Specs as executable contracts make Tara's red phase deterministic and reduce ambiguity at the Architecture→Implementation seam.
- Splitting personas into agents and skills shrinks always-loaded context and lets rare expertise scale without bloating the roster.
- Formalizing the harness produces a continuity guarantee that does not depend on prose conventions in `handoff.md`.
- Naming the judge stack creates a defensible verification surface and a clear escalation ladder for disagreement.

### Negative

- Eight follow-on ADRs is a large debate load; sprint throughput will drop while the restructure lands. Mitigation: wave-gated rollout above.
- Reframing Phase 4 from market to owned partition removes self-claim flexibility that some workflows rely on; the Plan-as-Bypass anti-pattern is a live risk that ADR-B must address head-on.
- Demoting personas to skills (ADR-D, ADR-G) is a one-way door for those personas' identities; misclassification will surface as gaps in coverage (e.g., losing accountability for Diego's docs ownership, losing tool isolation for Debra's NotebookEdit grant, losing breadth for Cloud, or recreating the Invisible UI anti-pattern for Dani).
- Spec-driven development adds a mandatory artifact between ADR and code; small items will feel heavier until tooling absorbs the cost. ADR-A's size carve-out is the hedge.
- Replacing blackboards with single-writer hierarchies risks losing the "any contributor can post evidence" property that benefits debugging — and the underlying research finding came from code-writing studies, not Discovery/Debugging. ADR-E carries the burden of proof.
- The harness shape is borrowed from Anthropic's published triad. There is residual cargo-cult risk if the triad turns out to be tuned to the vendor's model rather than to Summon's actual workflow shape; ADR-C is constrained to debate the mapping from first principles.
- The "30+ frameworks adopting spec-driven development" evidence is a popularity argument and could be near a hype-cycle peak. If spec-driven dev fails in the field over the next year, ADR-A is the first to revisit.

### Neutral

- Existing accepted ADRs (0001 conventional commits, 0002 TDD workflow) are unaffected and remain authoritative.
- The phase model itself is retained; only the org models inside specific phases change.
- The 16-persona catalog is preserved as a roster; the change is in *how* personas are instantiated (agent vs skill) and *when* they activate.
- Wei's role expands: every follow-on ADR carries its own debate and tracking artifact.
