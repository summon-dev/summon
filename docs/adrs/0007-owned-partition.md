---
agent-notes: { ctx: "owned-partition model replaces self-claim market in Phase 4", deps: [docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0005-single-threaded-default.md, docs/adrs/0006-harness-contract.md, docs/methodology/phases.md, docs/methodology/personas.md, docs/process/gotchas.md, docs/sprints/sprint-1-plan.md, docs/tracking/2026-05-02-w1.3-pilot-postmortem.md], state: proposed, last: "archie@2026-05-02" }
---

# ADR-0007: Owned Partition Replaces Self-Claim Market

## Status

**Proposed (pre-Wei)** 2026-05-02. Archie's draft, round 0. Wei challenge has not yet occurred. This is the ADR-B slot under [ADR-0003](./0003-research-driven-restructure-2026.md) § Follow-on table and the deliverable for [W2.1](../sprints/sprint-1-plan.md). Wave 2 may not begin until all of Wave 1 is Accepted; per the [W1.3 pilot post-mortem](../tracking/2026-05-02-w1.3-pilot-postmortem.md), ADR-0006 transitioned to Accepted (Conditional) and ADR-0004 remains in Shadow-Pilot with hard backstop active. The wave gate is met for ADR-B authorship.

**Transition to Accepted requires all of:** (a) Wei challenge complete with verdict ACCEPT or ACCEPT WITH AMENDMENTS; (b) human approval; (c) named pilot work item passes the success criteria in § 8 below; (d) the Phase 4 rewrite, ownership-map scaffold, and Grace persona annotation in this ADR's W2.1 rollout work land in-repo and conform to this ADR's schema.

**Reopen condition:** if the pilot fails any criterion, or if the Plan-as-Bypass detection signal in § 5 fires in normal use during the first three post-acceptance work items, this ADR reopens per [ADR-0003](./0003-research-driven-restructure-2026.md) § Rollback.

## Context

[ADR-0003](./0003-research-driven-restructure-2026.md) § Decision item 2 commits Summon to single-writer code paths and identifies parallel-write conflicts and ownership ambiguity as the two failure modes that dominate the catalogued fourteen ([ADR-0003](./0003-research-driven-restructure-2026.md) finding 7). [ADR-0005](./0005-single-threaded-default.md) inverted Phase 4's default from parallel-by-default to single-thread-by-default and named three escalation criteria — measured ceiling, clean ownership per ADR-B, ≤5 streams. Criterion 2 is the open loop this ADR closes: ADR-0005 cited "clean partitions per ADR-B" without defining what a partition is, who creates one, or how partitions interact with the existing self-claim market.

The current [`phases.md`](../methodology/phases.md) Phase 4 (line 140) describes a self-claim market: "Grace identifies independent work items that may proceed in parallel. Agents are assigned non-overlapping work." That description is the rule this ADR replaces. Line 155 explicitly defers "ownership map artifact, partition lifecycle, market vs. assignment dynamics" to this ADR.

[ADR-0003](./0003-research-driven-restructure-2026.md) § Negative Consequences line 88 binds this ADR specifically: *"Reframing Phase 4 from market to owned partition removes self-claim flexibility that some workflows rely on; the Plan-as-Bypass anti-pattern is a live risk that ADR-B must address head-on."* The Plan-as-Bypass anti-pattern is documented at [`gotchas.md`](../process/gotchas.md) line 67: a detailed plan from prior session or human-provided spec is *input* to the Summon team phases, not a bypass. A plan that lists multiple parallel items can encode parallelism that bypasses the partition-creation gate; this ADR makes the gate mechanical.

This ADR decides eight things: (1) what a partition is; (2) the ownership-map artifact's schema; (3) partition lifecycle (creation, transfer, dissolution); (4) cross-partition late-arriving work renegotiation; (5) the concurrency cap; (6) Plan-as-Bypass mitigation; (7) how partitions interact with ADR-0004 specs and ADR-0006 progress notes; (8) the pilot. It does not decide the Phase 4 prose rewrite (W2.1 rollout work) or Grace's persona-file annotation (W2.1 rollout work).

## Decision

### 1. What a Partition Is

A **partition** is a *named, time-bounded scope of write authority over a defined set of files or interfaces, owned by exactly one writer agent (Sato or any agent assuming the writer role) for the partition's lifetime.* The definition is mechanical: a partition exists if and only if it has an entry in the active ownership map.

| Concept | Granularity | Lifetime | Owner |
|---|---|---|---|
| **Sprint** | Many work items | Weeks | Pat + Grace |
| **Wave** | Several work items grouped by dependency | Days–weeks | Grace |
| **Work item** | One issue / acceptance-criteria block | Hours–days | Pat assigns; Sato implements |
| **Partition** | One write-authority scope inside a wave | Hours–days, ≤ wave | One writer agent |
| **Progress note context** | One session's continuation state | One session | Coordinator |

A partition is *not* a work item. A small work item has zero partitions (single-thread default applies; no ownership map entry exists). A large work item with cleanly-decomposable scope may map to multiple partitions, each with its own owner. A wave may contain partitions from multiple work items running concurrently when the escalation criteria are met. The single-thread default ([ADR-0005](./0005-single-threaded-default.md)) means **the absence of an ownership-map entry is the steady state**; a partition is the artifact of an explicit decision to parallelize.

### 2. Ownership-Map Schema

The ownership map at `docs/scaffolds/ownership-map.md` (template lands in W2.1 rollout, not this ADR) MUST be Grace-authored before any parallel writer is launched. Each partition entry contains exactly the following required fields. Grace refuses to launch a parallel writer when any required field is missing or empty, per the same refusal pattern [ADR-0006](./0006-harness-contract.md) § 4 establishes for `/handoff`.

| Field | Content | Citation rule |
|---|---|---|
| **partition-id** | Stable ID, format `P<wave>.<seq>` (e.g., `P2.1`, `P2.2`). IDs are unique across the active map and not reused for the lifetime of the wave. | Mechanical; Grace generates. |
| **author** | The Grace invocation that authored this partition entry, with date. Format `grace@YYYY-MM-DD`. | Mirrors [agent-notes](../methodology/agent-notes.md) `last` field convention. |
| **owner** | The single agent that holds write authority. One agent per partition, no exceptions. Format `<agent-name>` (typically `sato`, but any writer-role agent is permitted). | One value, not a list. |
| **scope** | The set of file paths, modules, or named interfaces the owner has write authority over. **Each entry MUST cite the path or interface name explicitly**; glob patterns are permitted only when the glob is itself the cited entry (e.g., `packages/cli/**`). Scope entries MUST NOT overlap any other open partition's scope. Grace verifies non-overlap mechanically before adding the entry. | Each entry → a path or named interface. Overlap check: set-intersection of all open partitions' scope returns empty. |
| **work-item-ref** | The work item ID (and feature spec path if [ADR-0004](./0004-feature-spec-artifact.md) applies, per § 7 below) the partition implements. **MUST cite either the spec path or "no spec applies because <one-sentence rationale>"** — same citation rule as [ADR-0004](./0004-feature-spec-artifact.md) § Schema Key Decisions and [ADR-0006](./0006-harness-contract.md) § 2 op-consequence 1. | Spec path or explicit "no spec applies because…". |
| **entry-condition** | What must be true at partition creation time. Includes: (a) the [ADR-0005](./0005-single-threaded-default.md) measured-ceiling artifact reference; (b) human or Pat-in-proxy approval reference; (c) any prerequisite partition's `dissolution-event` field (see § 3) if this partition depends on another's output. | Each sub-condition cites an artifact (commit hash, board item, prior partition ID). |
| **exit-condition** | What must be true for dissolution. Two flavors permitted: `merge-clean` (the partition's commits land on the integration branch with no conflicts and the work item's tests pass) or `superseded-by:<partition-id>` (transfer; see § 3). One flavor only. | One value. |
| **depends-on** | List of other partition IDs this partition's exit blocks on, if any. Empty list `[]` is permitted and means independent. | Each entry → an existing partition ID in the active map. |
| **time-bound** | Latest expected dissolution date. If the partition exceeds this date, Grace flags it for renegotiation per § 4. Format `YYYY-MM-DD`. | One value. |

These nine fields are the mechanical checklist; an entry missing any field is non-conformant and Grace refuses to launch the worker. The schema mirrors [ADR-0006](./0006-harness-contract.md) § 1's progress-note schema in shape: required fields with citation rules, mechanically inspectable, refusal-on-malformed.

### 3. Lifecycle: Creation, Transfer, Dissolution

**Creation.** A partition is created only when:
1. [ADR-0005](./0005-single-threaded-default.md) § 4's three escalation criteria are jointly satisfied (measured ceiling, clean ownership per this ADR, ≤5 streams). Criterion 2 is now mechanically defined: "clean ownership" means "Grace has authored an ownership-map entry conforming to § 2."
2. Grace authors the entry. **Grace is the only agent permitted to add entries to the ownership map.** A plan, a sprint document, or a human prompt that lists multiple parallel items is *input* to Grace's authoring decision, not a partition declaration. See § 5.
3. The human (or Pat in proxy mode for non-architectural items) approves the entry. Approval is recorded in the entry's `entry-condition` field as a citation.
4. The writer agent is launched only after steps 1–3 are recorded in-repo. A writer launched without a corresponding ownership-map entry is a process violation detected by the four-lens code review per [ADR-0005](./0005-single-threaded-default.md) § 4 enforcement.

**Transfer.** Partition ownership moves between agents via a `superseded-by` exit-condition: the original entry is closed with `superseded-by: P<new>`, a new entry is opened with the new owner, and the new entry's `entry-condition` cites the prior partition ID. Mid-flight transfer is a Grace-authored act, not an inline owner switch. The progress note ([ADR-0006](./0006-harness-contract.md) § 1) records the transfer in State.

**Dissolution.** A partition closes when its exit-condition fires:
- **`merge-clean`**: the writer's commits land on the integration branch with no conflicts and the work item's tests pass. The dissolution event is the merge commit hash, recorded by Grace in a `dissolution-event:<commit>` annotation appended to the entry.
- **`superseded-by:<partition-id>`**: transfer (above).

Dissolved entries remain in the ownership-map file for traceability — the file accumulates a sprint's partition history; Grace retires the file at sprint boundary alongside the progress note ([ADR-0006](./0006-harness-contract.md) § 5). The dissolution-event annotation is required; an entry left "open" past its `time-bound` is a Grace-flagged anomaly.

### 4. Late-Arriving Cross-Partition Work

When work surfaces mid-flight that touches the scope of an open partition not its own, the **partition-renegotiation rule** applies. The decision tree:

1. **Originating-partition absorption (default).** If the late-arriving work falls inside an open partition's scope, the partition's owner absorbs it. No new partition. The progress note records the scope adjustment in State.
2. **Scope expansion.** If the work falls outside *all* open partitions' scope but does not collide with any open partition, Grace amends the active partition entry whose work item the new work most closely belongs to (or creates a new partition if no work item fits). Amendment uses the [ADR-0004](./0004-feature-spec-artifact.md) § Lifecycle step 4 pattern: append a dated `## Amendment YYYY-MM-DD` block to the entry; never silent edit.
3. **Cross-partition collision.** If the work touches *two or more* open partitions' scope, the rule is **halt and renegotiate**. Grace stops both writers, records a Blocker in the progress note ([ADR-0006](./0006-harness-contract.md) § 1 Blockers), and re-authors the partition map. The human (or Pat in proxy mode for non-architectural items) approves the new layout before any writer resumes. There is no "we'll figure it out at merge" path.
4. **No-spawn-without-Grace.** A new partition does not spawn implicitly because work surfaced. Grace's authoring step in § 3 is mandatory; an agent that needs a new partition raises a Blocker, not a parallel `Task` call.

The renegotiation rule binds the cross-ADR composition: a Blocker raised under this rule is a [ADR-0006](./0006-harness-contract.md) § 1 Blocker with `awaiting-human` (or Pat-in-proxy) status, and its resolution updates the ownership map, not the work item directly. This is the only path for cross-partition work; "agents coordinate informally" is rejected (§ 9 Alternative D).

### 5. Plan-as-Bypass: Mitigation

The Plan-as-Bypass anti-pattern is the dominant Phase 4 risk this ADR addresses. The pre-W2.1 self-claim model and any plan-driven parallel launch share a single failure mode: a plan can encode parallelism that bypasses the partition-creation gate. This ADR makes the gate mechanical.

**The binding rule:** *A plan listing multiple parallel items does NOT auto-create partitions. Partitions are created only via Grace authoring an ownership-map entry that satisfies § 2 and § 3.*

Three concrete enforcements:

1. **Grace is the only authoring path.** No agent other than Grace adds entries to the ownership map. The coordinator reading a plan that lists parallel work items MUST invoke Grace to author entries; the coordinator does not launch parallel writers from the plan directly.
2. **Detection signal (mechanical).** More than one writer-role `Task` call (e.g., `subagent_type: sato`) for distinct file paths in a single message, with no corresponding ownership-map entries authored within that session, is the detection signal. The four-lens code review (Vik) flags it as a process violation per [ADR-0005](./0005-single-threaded-default.md) § 4 and the existing [Premature Parallelism anti-pattern](../process/gotchas.md) (line 75).
3. **Plan-input rule.** A plan, sprint document, or human-provided implementation guide that lists multiple parallel items is *input* to Grace's authoring decision per [`gotchas.md`](../process/gotchas.md) line 67. Grace MAY decide that the plan's items collapse into a single partition (single-thread default), MAY decompose them across multiple partitions if the [ADR-0005](./0005-single-threaded-default.md) escalation criteria are met, and MAY reject the parallelism entirely. The plan's structure does not bind Grace's decision.

**Anti-pattern to add to [`gotchas.md`](../process/gotchas.md) § Process** (W2.1 rollout work, not this ADR's edit):

> **Plan-Encoded Partition anti-pattern.** A plan or human prompt lists multiple parallel work items, and the coordinator launches parallel writers for each. The plan structure has effectively created partitions without an ownership map. **Detection signal:** multiple writer-role `Task` calls for distinct scope in one message, no ownership-map entries authored that session, no Grace invocation between plan-read and writer-launch. **Fix:** stop, invoke Grace to author ownership-map entries (or to confirm single-thread is the right call), surface the parallelization proposal to the human (or Pat in proxy mode) for approval, then resume.

This anti-pattern is the Plan-as-Bypass parent ([`gotchas.md`](../process/gotchas.md) line 67) projected into Phase 4; it is named as a sibling, not a duplicate.

### 6. Concurrency Cap

The cap is **≤5 concurrent open partitions per wave**, inherited from [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 3 and from [ADR-0003](./0003-research-driven-restructure-2026.md) finding 8 (3–7 agents per workflow). This ADR confirms the cap; it does not raise or lower it. Five is the hard cap, not a target. Most waves will have zero or one open partitions; the steady state under [ADR-0005](./0005-single-threaded-default.md) is "no parallel writers." A proposal that would open a sixth partition is rejected by Grace; the wave is decomposed or items deferred.

The cap is enforced mechanically: Grace counts open ownership-map entries (those with no `dissolution-event` annotation) before authoring a new entry. If the count reaches five, the next request is rejected with reference to this section.

### 7. Interaction with ADR-0004 Specs and ADR-0006 Progress Notes

This ADR composes with the Wave 1 ADRs as follows:

- **[ADR-0004](./0004-feature-spec-artifact.md) (feature spec).** A partition's `work-item-ref` field cites the feature spec path when the partition's work item is M+ (per [ADR-0004](./0004-feature-spec-artifact.md) § Size Carve-Out), or "no spec applies because <rationale>" when XS or unopted-S. **A partition that implements an M+ work item without a corresponding spec is non-conformant** — the [ADR-0004](./0004-feature-spec-artifact.md) hard backstop (Tara refuses to author tests on M+ without spec) plus this ADR's `work-item-ref` requirement form a two-layer enforcement of the same rule.
- **[ADR-0005](./0005-single-threaded-default.md) (single-thread default).** This ADR is the artifact that satisfies [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 2 ("clean ownership"). The phrase "clean ownership per ADR-B" in [ADR-0005](./0005-single-threaded-default.md) is now mechanical: "Grace has authored an ownership-map entry per [ADR-0007](./0007-owned-partition.md) § 2." The single-thread default is unchanged; partitions are the *legitimate path* to parallelism, not the new default.
- **[ADR-0006](./0006-harness-contract.md) (harness contract).** A partition's worker is a Sato (generator) per [ADR-0006](./0006-harness-contract.md) § 2 op-consequence. Each partition that spans sessions has its **State** in the progress note carry a `partition: P<id>` annotation, so the resuming session reads which partition it is operating against. Cross-partition Blockers (§ 4 collision) live in the progress note's Blockers section, not in the ownership map; the ownership map records the *resolution* (a new entry replacing two old ones), not the deliberation.

The composition is intentional: the spec is the *plan*, the progress note is the *continuation state*, and the ownership map is the *write-authority topology*. Three artifacts, three concerns, no overlap. None paraphrases another.

### 8. Pilot Plan

[ADR-0003](./0003-research-driven-restructure-2026.md) § Rollout (line 73) requires pilot-before-broad-rollout. The [W1.3 pilot post-mortem](../tracking/2026-05-02-w1.3-pilot-postmortem.md) F5 follow-up identified the dual-purpose-pilot retroactivity trap: a contract ADR's implementation is not a sound pilot vehicle for an artifact ADR authored in the same wave. This ADR avoids the trap by selecting a Wave 2 work item that is **not** the implementation vehicle for another Wave 2 ADR.

**Candidate evaluation:**

- **W2.2 (Single-Writer Hierarchy for Discovery and Debugging).** M-sized, restructures Phase 1 and Phase 6 mechanics. Touches `docs/methodology/phases.md` and adds a structured-return schema. **Has natural partition boundaries:** Phase 1 (Discovery) edits and Phase 6 (Debugging) edits are independent file regions — `phases.md` § Phase 1 vs. § Phase 6 — and the structured-return schema is a new file. Three plausible partitions: `phases.md § Phase 1`, `phases.md § Phase 6`, `docs/scaffolds/structured-return.md`. **However**, W2.2 is also the implementation vehicle for its own ADR, which means the F5 trap applies again. **Rejected.**
- **W2.3 (Formalize Vik+Tara+Pierrot as Judge Stack).** M-sized, restructures Phase 5. Touches `phases.md`, the Done Gate, and adds replay/disagreement docs. Same F5-trap structure: implementation vehicle for its own ADR. **Rejected.**
- **A Wave 3 work item.** Wave 3 cannot start until Wave 2 is complete per [ADR-0003](./0003-research-driven-restructure-2026.md) § Halt-Points. Pilot scheduled to Wave 3 violates the wave gate. **Rejected.**

**Selected pilot: a synthetic Wave 2 partitioning of W2.2's rollout work, scheduled *after* W2.2's ADR is Accepted but during W2.2's implementation.** The work itself does not change; what changes is whether Grace authors an ownership map and runs two partitions in parallel for the `phases.md § Phase 1` and `phases.md § Phase 6` edits. The two file regions are non-overlapping, the structured-return schema is a third independent file, and the [ADR-0005](./0005-single-threaded-default.md) measured ceiling can be observed from the prior W1 implementations' single-thread runtime. This is a *real* parallelization decision, not a contrived one.

The pilot is *not* on a work item that is the implementation vehicle for an in-flight ADR (W2.2's ADR is Accepted before the pilot begins). The F5 trap does not apply.

**Pilot success criteria:**

1. Grace authors an ownership map at `docs/scaffolds/ownership-map.md` (or an active-pilot variant under `docs/tracking/`) conforming to § 2 — every required field present, citation rules satisfied — without amendment at write time.
2. The two writer agents complete their partitions with `merge-clean` exit-conditions; commits land on the integration branch with no conflicts and W2.2's tests pass.
3. No cross-partition collision (§ 4) occurs during the pilot. If one occurs, the renegotiation rule fires correctly: writers halt, Blocker recorded in the progress note, human (or Pat in proxy) approves the new layout. A correctly-fired renegotiation is a PASS for criterion 3, not a fail.
4. The Plan-as-Bypass detection signal (§ 5) does not fire — i.e., no parallel writer is launched without a corresponding ownership-map entry that session.
5. Post-mortem confirms the ownership map's `work-item-ref` cites the [ADR-0004](./0004-feature-spec-artifact.md) spec for any M+ partition (or "no spec applies because…" rationale), and the partition annotations in the progress note's State section are present and accurate.
6. The cap of ≤5 (§ 6) is not exercised in the pilot (only three partitions are anticipated); the cap is reachability-tested by inspection rather than by violation, mirroring [ADR-0006](./0006-harness-contract.md) § 6 criterion 5.

Failure on any criterion reopens this ADR per [ADR-0003](./0003-research-driven-restructure-2026.md) § Rollback. Failure on (4) is graded as Critical (the head-on Plan-as-Bypass binding constraint failed) and triggers immediate halt of broad rollout regardless of other criteria.

**Boundary coverage caveat:** the pilot exercises three partitions, not five. The ≤5 cap is not stress-tested. **The first wave to open a fourth concurrent partition under broad rollout is treated as continuing-pilot evidence**, mirroring the [ADR-0004](./0004-feature-spec-artifact.md) M-vs-L boundary pattern. The post-mortem of that wave logs cap-fitness as a follow-up question.

## Considered and Rejected

### Alternative A: Keep the self-claim market unchanged

**The argument:** Phase 4 already exists, Grace already coordinates, and the self-claim model (agents claim non-overlapping work items) is light-weight. A formal partition artifact adds ceremony to a workflow that has produced no observed collision.

**Why rejected:** The 2026 consensus ([ADR-0003](./0003-research-driven-restructure-2026.md) finding 7) names parallel-write conflicts and ownership ambiguity as the two dominant failure modes. The self-claim market relies on agents *correctly identifying* non-overlap before claiming — i.e., it relies on the same judgment that fails under the ownership-ambiguity failure mode. The market has no mechanical refusal for a bad claim; the partition model has Grace's refusal at § 3 step 4. Steel-manned hardest because Summon's prior workflows have been small enough that no collision was observed; the rule fires for the next failure, not the prior absence of one.

### Alternative B: Auction model

**The argument:** When parallel work is contemplated, agents bid on partitions based on capability fit and current load; Grace awards the partition to the best bid. This is more flexible than fixed assignment.

**Why rejected:** Auctions add a coordination round that solves a problem Summon does not have. The team's writer roles are largely typed (Sato writes implementation, Tara writes tests); contention for "who writes the implementation" is not the bottleneck. The coordination cost is real (an extra round per partition), and the flexibility benefit is theoretical. Conservative on the side of the [ADR-0003](./0003-research-driven-restructure-2026.md) finding-1 single-writer doctrine: fewer hands on a partition is better, and an auction adds hands before settling on one.

### Alternative C: Manager-assignment model

**The argument:** Pat (or Grace) assigns partitions top-down; agents do not self-claim or bid. This is the simplest model.

**Why rejected on standalone grounds:** Manager-assignment without an ownership-map artifact is what `phases.md` already describes ("Grace identifies independent work items… agents are assigned non-overlapping work"). The defect is not the assignment direction — it is the absence of a written-down record of who owns what. This ADR keeps Grace's assignment role and adds the artifact that makes the assignment auditable. Manager-assignment-without-artifact is therefore the prior state, which [ADR-0003](./0003-research-driven-restructure-2026.md) found insufficient.

### Alternative D: No formal partition — just trust workers

**The argument:** Workers are senior agents; they read each other's commits; they know not to step on each other's toes. The ownership map is process tax.

**Why rejected:** The Plan-as-Bypass anti-pattern ([`gotchas.md`](../process/gotchas.md) line 67) demonstrates that without a mechanical gate, the team drifts toward parallelism whenever a plan looks plural. Trust is not a refusal mechanism. The four-lens code review can detect violations *post-hoc*, but post-hoc detection costs a merge conflict or a redo — exactly the failure mode [ADR-0005](./0005-single-threaded-default.md) is designed to prevent. The artifact's cost is one Grace authoring step per parallel decision (which is rare, since single-thread is default); the benefit is a mechanical refusal at the cheapest point.

### Alternative E: Inherit the ≤5 cap silently from ADR-0005

**The argument:** [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 3 already names ≤5; this ADR does not need to restate it.

**Why rejected:** The cap is the kind of parameter the team will look up under pressure ("how many partitions can I open?"). Confirming it explicitly here costs three lines and removes a source-of-truth ambiguity. If a future sizing study revises the cap, both ADRs are amended together — the duplication is intentional cross-reference, not stale documentation. § 6 records the inheritance rather than hiding it.

## Consequences

### Positive

- Closes the open loop in [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 2: "clean ownership per ADR-B" is now a mechanical check (Grace authored a conforming ownership-map entry), not a judgment call.
- Plan-as-Bypass becomes a detection-signal-and-mechanical-refusal pattern, not a process plea. The [ADR-0003](./0003-research-driven-restructure-2026.md) line 88 binding constraint is satisfied head-on rather than deferred.
- The ownership map composes cleanly with [ADR-0004](./0004-feature-spec-artifact.md) (spec link in `work-item-ref`) and [ADR-0006](./0006-harness-contract.md) (partition annotation in progress-note State). Three artifacts, three concerns, mechanically inspectable boundaries.
- Grace gains a refusal mechanism for partition creation, mirroring `/handoff`'s refusal conditions ([ADR-0006](./0006-harness-contract.md) § 4). The team's Phase 4 doctrine is now refusal-first, parallelism-second.
- Cross-partition late-arriving work has a named protocol (§ 4 renegotiation) instead of "we'll figure it out at merge."

### Negative

- Adds an artifact (the ownership map) and a Grace-authoring step to every parallel decision. Most waves have zero partitions; for those, the artifact is unused (no overhead). For waves that *do* parallelize, throughput drops on the first partition while Grace writes the entry. Mitigation: the writing step is small (nine fields, citation rules), and the alternative is a merge conflict.
- The [ADR-0006](./0006-harness-contract.md) § 1 progress-note State section gains a `partition: P<id>` annotation on multi-session partitions. One more field for the coordinator to maintain. Mitigation: partitions are rare; most sessions write `partition: none`.
- The renegotiation rule (§ 4) halts both writers on cross-partition collision. If the collision is genuine but small, the halt is heavyweight. **Steel-manned:** halting is the correct response when ownership is ambiguous; the alternative ("just merge it later") is the failure mode this ADR exists to prevent. The cost is intentional.
- Grace becomes a serialized dependency for parallel launches. If Grace is unavailable, parallel work blocks. Mitigation: single-thread default means the block is rare; in proxy mode the human authors the ownership map directly.
- The ownership-map file accumulates dissolved entries within a sprint; the file grows. Sprint-boundary retirement (Grace, mirroring [ADR-0006](./0006-harness-contract.md) § 5) keeps the active-state file small, but the git history accumulates indefinitely. This is consistent with progress-note retention and is not a defect.
- The pilot (§ 8) is *synthetic* — it parallelizes work that single-thread could complete. If single-thread is genuinely faster on the W2.2 work, the pilot is a worst-case test. Steel-manned: that is the point. The pilot tests whether the *machinery* works, not whether parallelism is justified.

### Neutral

- The Phase 4 prose rewrite, the ownership-map template at `docs/scaffolds/ownership-map.md`, and Grace's persona-file annotation are W2.1 rollout work, not this ADR. This ADR specifies the schema, not the template's prose.
- [ADR-0005](./0005-single-threaded-default.md)'s single-thread default is unchanged. Partitions are the legitimate path to parallelism; they are not the new default.
- The ≤5 cap is inherited from [ADR-0005](./0005-single-threaded-default.md) and [ADR-0003](./0003-research-driven-restructure-2026.md) finding 8. A future sizing study may move it; this ADR's § 6 records the inheritance, not an independent validation.
- Sprint-boundary retirement of the ownership map is a Grace responsibility already covered by Grace's existing sprint-boundary duties. No new persona role.
- The three-artifact composition (spec, progress note, ownership map) is mechanically auditable but not enforced by tooling beyond Grace's refusal. A future ADR may add lint-level enforcement; this ADR does not.

### Residual Risks

- **Grace bypass remains an honor-system risk** until tooling catches a parallel `Task` call without an ownership-map entry. The four-lens code review is the backstop; the [Premature Parallelism anti-pattern](../process/gotchas.md) line 75 names the detection signal. A recurring Grace-bypass pattern reopens this ADR, identical to [ADR-0005](./0005-single-threaded-default.md) § Residual Risks.
- **Partition-vs-work-item boundary is judgment-loaded.** A small work item might tempt a partition entry "just in case"; a large work item might tempt a single partition that should be three. The schema's `work-item-ref` field forces the partition to cite a work item, which makes the small-item case visible (a one-partition entry citing a one-bullet work item is itself a signal). The large-item case is harder: the post-mortem must check whether the partition's scope matched the actual write surface. **A recurring pattern of partitions whose scope expanded mid-flight beyond the schema's amendment threshold reopens this ADR.**
- **The ≤5 cap is not pilot-stress-tested.** § 8 boundary caveat applies: first fourth-partition wave under broad rollout is continuing-pilot evidence.
- **Renegotiation cost may dominate.** If cross-partition collisions are common, the halt-and-renegotiate cost may exceed single-thread cost. The pilot tests whether collisions occur in a representative case; a high-collision pattern in the first three post-acceptance work items reopens this ADR (named reopen condition in § Status).
- **The partition's owner being a single agent is binding.** Pair-style writers (two agents on one partition) are not permitted under this ADR. If the team finds a workflow where two agents legitimately share a partition (e.g., Tara writes red phase, Sato writes green, both touching the same files within one work item), the resolution is *sequential ownership* (Tara owns the partition for red, transfer per § 3 to Sato for green), not concurrent shared ownership. ADR-D / ADR-G persona reshaping may surface a case this rule does not handle; the residual risk is named for inheritance.
