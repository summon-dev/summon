---
agent-notes: { ctx: "single-threaded-by-default rule for code-write tasks", deps: [docs/adrs/0003-research-driven-restructure-2026.md, docs/methodology/phases.md, docs/process/team-governance.md, CLAUDE.md, docs/process/gotchas.md], state: proposed, last: "archie@2026-05-02" }
---

# ADR-0005: Single-Threaded by Default for Code-Write Tasks

## Status

**Proposed** 2026-05-02. Per `docs/sprints/sprint-1-plan.md` W1.2, Wei challenge is optional and single-round; the human will dispatch Wei or Accept directly. This is the ADR-H slot under ADR-0003 § Follow-on table.

## Context

ADR-0003 commits Summon to "single-writer by default for code writes" and binds this ADR to two specific tasks: (a) distinguish thread count, invocation count, and partition ownership; and (b) define escalation criteria from single-thread to parallel. The umbrella's binding **operational definition of single-writer** is "at most one Sato invocation writing inside a given code partition at a given time"; this ADR extends that definition along the thread axis without contradicting or broadening it.

The current `docs/methodology/phases.md` Phase 4 entry rule says "default to parallel unless there's a true data dependency between items." That sentence is the rule this ADR inverts at the doctrine level. The **mechanics** of Phase 4 (ownership maps, partition lifecycle, who assigns work, how Grace coordinates) are ADR-B / W2.1's job and are *not* decided here.

## Decision

### 1. The Rule

**Code-writing work runs single-threaded by default.** A code-write task is any task whose output is committed source, configuration, schema, or migration code authored by Sato (or any agent assuming the writer role).

### 2. Operational Definition

The umbrella separates three meanings; this ADR commits each independently:

- **Invocation count** — number of writer-agent invocations active for a given partition. Per ADR-0003, the binding rule is **at most one Sato invocation writing inside a given partition at a given time**. ADR-0005 adopts this verbatim.
- **Partition ownership** — which partition a piece of work belongs to. Defined by ADR-B; not decided here.
- **Thread count** — number of execution paths through the writer pipeline. **ADR-0005 sets the default to one.** A "thread" is one continuous Tara-red → Sato-green → Sato-refactor → Tara-verify pipeline.

The three-way relationship: **single-thread = one writer pipeline executing through one partition at a time = the inhabitable state of the umbrella's "one Sato invocation per partition" rule when no parallel partitions are open.** The umbrella permits multiple partitions to be open at once; this ADR says that, by default, they are not.

### 3. What Single-Thread Is NOT

Single-thread applies only to the **write side**. The following remain multi-agent and are **explicitly unaffected** by this ADR:

- **Read/research parallelism** — Discovery elicitation, multi-lens code review (Vik + Tara + Pierrot + Archie), parallel architecture debate (Archie ↔ Wei), Phase 6 debugging hypothesis generation. ADR-0003 finding 1 is explicit: multi-agent for read/research stays the model.
- **Specialist consultation** — Pierrot reviewing security, Ines reviewing operability, Dani reviewing UI — these run in parallel on a write-in-progress without crossing the writer boundary.
- **Phase 5 ensemble review** — three reviewers in parallel is the design and is not write-side parallelism.

A reader who concludes this ADR bans parallel reading has misread it.

### 4. Escalation Criteria from Single-Thread to Parallel

Parallel write streams are permitted only when **all three** criteria below are satisfied. Grace authors the parallelization proposal; the human (or Pat in proxy mode for non-architectural items) approves it before parallel launch.

1. **Measured ceiling.** Single-thread throughput must be demonstrably the bottleneck — i.e., the work-in-progress pipeline is full and the next item is blocked on writer availability for at least one full session, with the block visible in the sprint plan or handoff. "I expect this to be faster in parallel" is not a measured ceiling.
2. **Clean ownership.** The work decomposes into non-overlapping partitions per ADR-B's partition rules. If ADR-B is not yet Accepted, parallelization is not yet available — ADR-0003's wave gate forbids it. The partition boundaries are written down in the parallelization proposal before any worker is launched.
3. **Concurrency cap of ≤5 streams.** Aligned with the ADR-0003 finding-8 sizing of 3–7 agents per workflow. Five is the hard cap; proposals above five are rejected outright and require decomposition.

If any criterion fails, the work runs single-threaded. **Enforcement:** Grace refuses to launch parallel workers when a criterion is unmet; if Grace is bypassed (a worker is launched directly without Grace), the next code review (Vik) flags it as a process violation per the standard four-lens review. There is no "we just decided to parallelize" path.

### 5. CLAUDE.md Rule (post-acceptance text)

Implementation of this ADR is a downstream work item; the CLAUDE.md edit will land that rule with the following prose-quality text under § Critical Rules:

> **Single-Threaded by Default for Code Writes.** Code-writing work — any task whose output is committed source, schema, configuration, or migration code — runs as a single writer pipeline (one Tara→Sato→Tara cycle) at a time. Read-side parallelism (multi-lens code review, parallel architecture debate, parallel specialist consultation) is unaffected. Parallel write streams are permitted only when Grace has authored a parallelization proposal satisfying all three escalation criteria — measured single-thread ceiling, clean partitions per ADR-B, ≤5 streams — and the human (or Pat in proxy mode) has approved it. See ADR-0005.

### 6. Phase 4 Implication (philosophical only — mechanics deferred to ADR-B)

This ADR amends Phase 4 *philosophically*: parallel work is the exception, not the default. The current `phases.md` text "Default to parallel unless there's a true data dependency" is contradicted by this ADR and must be reconciled. **The actual `phases.md` rewrite — which entry rule, which agent roster, which artifacts — is W2.1 / ADR-B's job.** This ADR does not pre-commit ADR-B's partition lifecycle, partition transfer rules, or Grace's mechanism for assigning workers.

### 7. Anti-Pattern: Premature Parallelism

To be added to `docs/process/gotchas.md` § Process by the implementation work item:

> **Premature Parallelism anti-pattern.** The coordinator (or Grace) launches parallel writers without a measured single-thread ceiling, often because parallelism *feels* faster or because a plan listed multiple items. The result is partition collisions, duplicated work, and merge contention that costs more than the serial run would have. **Detection signal:** more than one Task call with `subagent_type: sato` (or any writer role) for overlapping code areas in a single message, with no parallelization proposal in the handoff or sprint artifacts and no Grace sign-off recorded. **Fix:** stop, run the single-thread version to establish the throughput baseline, then re-evaluate against ADR-0005's three escalation criteria before parallelizing.

## Considered and Rejected

### Alternative A: Keep parallel-by-default

**The argument:** Phase 4 already exists, Grace already coordinates, and the current `phases.md` rule favors parallel unless there's a data dependency. The 2026 research (ADR-0003 finding 1) is one input among many; throughput on independent items is a real benefit.

**Why rejected:** The 2026 consensus identifies parallel-write conflicts and ownership ambiguity as the two failure modes that dominate the catalogued fourteen (ADR-0003 finding 7). "True data dependency" as the only filter is too weak — many partition collisions are not data dependencies but ownership ambiguity, and the current rule doesn't catch them. Steel-manned hardest because the cost of throughput loss on truly-independent items is real; the mitigation is the escalation path, not abandonment of parallelism.

### Alternative B: Ban parallel writes entirely

**Why rejected:** Over-rotation. Genuinely independent partitions (e.g., a documentation update and an unrelated bug fix in a different package) can run in parallel without ownership ambiguity, and banning that case wastes capacity. The umbrella's "single-writer per partition" rule already permits multiple partitions; this ADR keeps that door open via the escalation path rather than welding it shut.

### Alternative C: Leave the rule informal

**Why rejected:** Informal rules are not enforced. Without a written default and explicit escalation criteria, the team will drift back to parallel-by-default the first time a sprint feels slow — exactly the failure mode `gotchas.md` § Process patterns are supposed to prevent. Sprint plan W1.2 acceptance criteria require a CLAUDE.md rule and a gotchas entry; an informal rule satisfies neither.

## Consequences

### Positive

- Aligns Summon's write-side organization with the 2026 consensus on parallel-write conflicts as a dominant failure mode.
- Eliminates the most common ownership-ambiguity vector (multiple writers on adjacent code) without restricting read-side parallelism, which the research is explicit about preserving.
- Gives Grace a refusal path: parallelization proposals without all three criteria are rejected at the planning step, not discovered as collisions at merge time.
- Sets a single, mechanical rule (one writer pipeline at a time, by default) that the four-lens code review can detect violations against.

### Negative

- Throughput drops on workloads that *are* genuinely parallelizable but lack a measured ceiling on the first run — the rule forces a serial baseline before parallelizing, which costs one cycle of latency.
- Grace gains a refusal duty; if Grace is bypassed, only post-hoc code review catches the violation. Mitigation: the four-lens review is already in the workflow, and the Premature Parallelism anti-pattern names the detection signal.
- The escalation criteria are conservative; teams that have working parallel patterns today will feel the rule as a regression until ADR-B lands and partition rules formalize.
- The "measured ceiling" criterion requires evidence the team may not have collected; in early sprints it functions as a near-prohibition on parallel writes until baseline data exists.

### Neutral

- Read-side parallelism is unchanged. Phase 5 review, Phase 2 architecture debate, Phase 1 Discovery, Phase 6 Debugging hypothesis generation all keep their current org models.
- The actual `phases.md` Phase 4 rewrite, the partition lifecycle, and Grace's assignment mechanism are deferred to ADR-B and are not pre-committed here.
- The CLAUDE.md and `gotchas.md` edits are mechanical implementation work post-acceptance; the prose to land is fixed in this ADR.
- ≤5 streams is a sizing cap inherited from ADR-0003 finding 8; this ADR does not independently validate the ceiling, and a future sizing study may move it.

### Residual Risks

- **Ceiling-evidence asymmetry.** "Measured ceiling" is easier to assert than to verify; a future ADR or sprint retro may need to define what evidence counts. For now, "writer pipeline blocked for at least one full session, visible in handoff or sprint plan" is the working definition.
- **Cap-of-five hand-off to ADR-B.** ADR-B's partition rules will determine whether five is the right cap; if ADR-B argues for a different number, this ADR's criterion (c) is amended, not the doctrine.
- **Grace bypass remains an honor-system risk** until ADR-B formalizes partition assignment. The four-lens code review is the backstop; a recurring Grace-bypass pattern would reopen this ADR.
