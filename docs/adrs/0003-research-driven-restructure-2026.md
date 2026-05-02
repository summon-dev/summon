---
agent-notes: { ctx: "umbrella ADR setting direction for 2026 research-driven restructure", deps: [docs/methodology/phases.md, docs/process/team-governance.md, docs/methodology/personas.md, CLAUDE.md], state: proposed, last: "archie@2026-05-02" }
---

# ADR-0003: Research-Driven Restructure for 2026 Agentic Coding Findings

## Status

Proposed (pending Wei challenge and human approval)

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

What Summon already gets right and we **will not relitigate**: phase-dependent hybrid teams, Wei adversarial debate at Architecture, Tara-first TDD as a verifier-critic loop, the Vik+Tara+Pierrot ensemble (already a judge stack in spirit), the agent-notes protocol as durable structured metadata, and `handoff.md` as continuity artifact.

## Decision

Summon will adopt a **single-writer, spec-driven, harness-first** model on top of its existing phase-dependent team structure. Concretely, the direction is:

1. **Single-threaded by default for code writes.** Multi-agent remains the model for read/research (Discovery, Architecture deliberation, Code Review). Implementation collapses to a single writer per partition.
2. **Specs become the spine between Architecture and Implementation.** ADRs commit to *direction*; feature specs commit to *outcomes, constraints, tasks, and verification* and become the executable contract for TDD.
3. **The team is reorganized into agents and skills.** Frequently-active personas remain context-isolated agents; rarely-active or purely procedural personas become skills that any agent can load.
4. **The harness is made explicit.** Cross-session continuity moves from prose handoff to a structured progress-note schema, mapped to a planner/generator/evaluator triad (Pat / Sato / Tara).
5. **Blackboards are replaced with single-writer hierarchies** in Discovery and Debugging. The lead owns the artifact; contributors deliver structured input.
6. **The judge stack is formalized.** Vik+Tara+Pierrot+Archie becomes a named judge stack with replay, disagreement escalation, and human review thresholds.

This umbrella ADR commits to the direction. Each substantive change ships as its own ADR, written and debated separately:

| Follow-on | Scope |
|---|---|
| **ADR-A** | Feature-spec artifact between ADR and TDD (schema, lifecycle, ownership) |
| **ADR-B** | Phase 4 reframe: owned partitions instead of self-claim market |
| **ADR-C** | Explicit harness contract: progress-note schema and planner/generator/evaluator mapping (Pat/Sato/Tara) |
| **ADR-D** | Persona split: agents vs skills, with migration list |
| **ADR-E** | Replace blackboard with single-writer hierarchy in Discovery and Debugging |
| **ADR-F** | Formalize the judge stack: replay, disagreement review, human escalation |
| **ADR-G** | Slim rarely-active personas (Cloud, Debra, Diego, Dani) to summoned specialists |
| **ADR-H** | Single-threaded-by-default for write tasks (CLAUDE.md amendment) |

ADRs A–H may be ordered, parallelized, or merged during the architecture phase, but none short-circuit their own Wei challenge.

## Consequences

### Positive

- Aligns Summon with the 2026 research consensus on context as the primary failure mode and single-writer code paths as the antidote to parallel-write conflicts.
- Specs as executable contracts make Tara's red phase deterministic and reduce ambiguity at the Architecture→Implementation seam.
- Splitting personas into agents and skills shrinks always-loaded context and lets rare expertise scale without bloating the roster.
- Formalizing the harness produces a continuity guarantee that does not depend on prose conventions in `handoff.md`.
- Naming the judge stack creates a defensible verification surface and a clear escalation ladder for disagreement.

### Negative

- Eight follow-on ADRs is a large debate load; sprint throughput will drop while the restructure lands.
- Reframing Phase 4 from market to owned partition removes self-claim flexibility that some workflows rely on.
- Demoting personas to skills (ADR-G) is a one-way door for those personas' identities; misclassification will surface as gaps in coverage.
- Spec-driven development adds a mandatory artifact between ADR and code; small items will feel heavier until tooling absorbs the cost.
- Replacing blackboards with single-writer hierarchies risks losing the "any contributor can post evidence" property that benefits debugging.

### Neutral

- Existing accepted ADRs (0001 conventional commits, 0002 TDD workflow) are unaffected and remain authoritative.
- The phase model itself is retained; only the org models inside specific phases change.
- The 16-persona catalog is preserved as a roster; the change is in *how* personas are instantiated (agent vs skill) and *when* they activate.
- Wei's role expands: every follow-on ADR carries its own debate and tracking artifact.
