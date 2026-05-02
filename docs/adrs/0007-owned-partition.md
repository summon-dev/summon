---
agent-notes: { ctx: "owned-partition model replaces self-claim market in Phase 4", deps: [docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0005-single-threaded-default.md, docs/adrs/0006-harness-contract.md, docs/methodology/phases.md, docs/methodology/personas.md, docs/process/gotchas.md, docs/sprints/sprint-1-plan.md, docs/tracking/2026-05-02-w1.3-pilot-postmortem.md, docs/tracking/2026-05-02-adr0007-owned-partition-debate.md], state: proposed, last: "archie@2026-05-02" }
---

# ADR-0007: Owned Partition Replaces Self-Claim Market

## Status

**Proposed (Pilot-pending)** 2026-05-02. Wei round-1 verdict REWORK ([debate](../tracking/2026-05-02-adr0007-owned-partition-debate.md)); four must-change + seven should-amend + one cosmetic item folded inline per the Rework Notes section at the end of this ADR. **Wei round-2 verdict: ACCEPT WITH AMENDMENTS** (all twelve amendments verified satisfied; both prior spirit-of-rule weaknesses now met in spirit; see [debate § Round 2](../tracking/2026-05-02-adr0007-owned-partition-debate.md#round-2--wei-verification)). Condition (a) below is now satisfied. This is the ADR-B slot under [ADR-0003](./0003-research-driven-restructure-2026.md) § Follow-on table and the deliverable for [W2.1](../sprints/sprint-1-plan.md). Wave 2 may not begin until all of Wave 1 is Accepted; per the [W1.3 pilot post-mortem](../tracking/2026-05-02-w1.3-pilot-postmortem.md), ADR-0006 transitioned to Accepted (Conditional) and ADR-0004 remains in Shadow-Pilot with hard backstop active. The wave gate is met for ADR-B authorship.

**Transition to Accepted requires all of:** (a) Wei challenge complete with verdict ACCEPT or ACCEPT WITH AMENDMENTS; (b) human approval; (c) named pilot work item passes the success criteria in § 8 below; (d) the Phase 4 rewrite, ownership-map scaffold, and Grace persona annotation in this ADR's W2.1 rollout work land in-repo and conform to this ADR's schema.

**Reopen condition:** if the pilot fails any criterion, or if the Plan-as-Bypass detection signal in § 5 fires in normal use during the first three post-acceptance work items, this ADR reopens per [ADR-0003](./0003-research-driven-restructure-2026.md) § Rollback.

## Context

[ADR-0003](./0003-research-driven-restructure-2026.md) § Decision item 2 commits Summon to single-writer code paths and identifies parallel-write conflicts and ownership ambiguity as the two failure modes that dominate the catalogued fourteen ([ADR-0003](./0003-research-driven-restructure-2026.md) finding 7). [ADR-0005](./0005-single-threaded-default.md) inverted Phase 4's default from parallel-by-default to single-thread-by-default and named three escalation criteria — measured ceiling, clean ownership per ADR-B, ≤5 streams. Criterion 2 is the open loop this ADR closes: ADR-0005 cited "clean partitions per ADR-B" without defining what a partition is, who creates one, or how partitions interact with the existing self-claim market.

The current [`phases.md`](../methodology/phases.md) Phase 4 (line 140) describes a self-claim market: "Grace identifies independent work items that may proceed in parallel. Agents are assigned non-overlapping work." That description is the rule this ADR replaces. Line 155 explicitly defers "ownership map artifact, partition lifecycle, market vs. assignment dynamics" to this ADR.

[ADR-0003](./0003-research-driven-restructure-2026.md) § Negative Consequences line 88 binds this ADR specifically: *"Reframing Phase 4 from market to owned partition removes self-claim flexibility that some workflows rely on; the Plan-as-Bypass anti-pattern is a live risk that ADR-B must address head-on."* The Plan-as-Bypass anti-pattern is documented at [`gotchas.md`](../process/gotchas.md) line 67: a detailed plan from prior session or human-provided spec is *input* to the Summon team phases, not a bypass. A plan that lists multiple parallel items can encode parallelism that bypasses the partition-creation gate; this ADR makes the gate mechanical.

This ADR decides eight things: (1) what a partition is; (2) the ownership-map artifact's schema; (3) partition lifecycle (creation, transfer, dissolution); (4) cross-partition late-arriving work renegotiation; (5) the concurrency cap; (6) Plan-as-Bypass mitigation; (7) how partitions interact with ADR-0004 specs and ADR-0006 progress notes; (8) the pilot. It does not decide the Phase 4 prose rewrite (W2.1 rollout work) or Grace's persona-file annotation (W2.1 rollout work).

## Decision

### 1. What a Partition Is

A **partition** is a *named, time-bounded scope of write authority over a defined set of files or interfaces, owned by exactly one writer-role-at-a-time (Sato or any agent assuming the writer role) for the partition's lifetime.* The definition is mechanical: a partition exists if and only if it has an entry in the active ownership map. The single-owner rule binds **role-at-a-time**, not specific agent invocation; the ADR-0002 TDD pipeline (Tara red → Sato green → Sato refactor → Tara verify) is the canonical role-rotation pattern that executes within one partition without `superseded-by` ceremony — see § 3 below.

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
| **owner** | The single writer-role-at-a-time per ADR-0002 that holds write authority. The TDD pipeline (Tara red → Sato green → Sato refactor → Tara verify) is the canonical role-rotation pattern executing without `superseded-by` ceremony; see § 3 Transfer carve-out. Format `<agent-name>` for the lead writer (typically `sato` for implementation partitions or `tara` for test-led partitions). | One value, not a list. |
| **scope** | The set of file paths or glob patterns the owner has write authority over. **Each entry MUST cite the path explicitly or be a glob pattern** (e.g., `packages/cli/**`). Entries MUST be file paths or glob patterns; **named-interface entries (e.g., "the `/handoff` command's input schema") are NOT permitted in this ADR's schema**. If a real case for named-interface scope surfaces, it triggers a future ADR amendment with explicit overlap rules; until then, scope is path-or-glob only — see challenge 12 in the [Wei round-1 debate](../tracking/2026-05-02-adr0007-owned-partition-debate.md). Glob overlap rules: a glob entry covers all paths matching the pattern; two partitions overlap if any path could match both glob/explicit-path entries (set intersection of expanded path sets is non-empty). Scope entries MUST NOT overlap any other open partition's scope. Grace verifies non-overlap mechanically before adding the entry. | Each entry → a path or glob. Overlap check: set-intersection of expanded path sets across all open partitions returns empty. |
| **work-item-ref** | The work item ID (and feature spec path if [ADR-0004](./0004-feature-spec-artifact.md) applies, per § 7 below) the partition implements. **MUST cite either the spec path or "no spec applies because <one-sentence rationale>"** — same citation rule as [ADR-0004](./0004-feature-spec-artifact.md) § Schema Key Decisions and [ADR-0006](./0006-harness-contract.md) § 2 op-consequence 1. | Spec path or explicit "no spec applies because…". |
| **entry-condition** | What must be true at partition creation time. Includes: (a) **evidence of [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 1 satisfaction** — the form of evidence is what ADR-0005 § 4 names (a handoff or sprint-plan entry documenting the writer pipeline was blocked for at least one full session); pending a future ADR formalizing the artifact format (per [ADR-0005](./0005-single-threaded-default.md) § Residual Risks), any handoff/progress-note/sprint-plan reference that documents the block is sufficient; (b) human or Pat-in-proxy approval reference; (c) any prerequisite partition's `dissolution-event` field (see § 3) if this partition depends on another's output. | Each sub-condition cites an artifact (commit hash, board item, prior partition ID, handoff path). |
| **exit-condition** | What must be true for dissolution. Two flavors permitted: `merge-clean` (the partition's commits land on the integration branch with no conflicts and the work item's tests pass) or `superseded-by:<partition-id>` (transfer; see § 3). One flavor only. | One value. |
| **depends-on** | List of other partition IDs this partition's exit blocks on, if any. Empty list `[]` is permitted and means independent. | Each entry → an existing partition ID in the active map. |
| **time-bound** | Latest expected dissolution date. If the partition exceeds this date without `merge-clean` or `superseded-by` exit-condition firing, Grace creates a Blocker per [ADR-0006](./0006-harness-contract.md) § 1 in the next progress note (firing mechanism specified in § 3 Dissolution). Format `YYYY-MM-DD`. | One value; firing mechanism per § 3. |

These nine fields are the mechanical checklist; an entry missing any field is non-conformant and Grace refuses to launch the worker. The schema mirrors [ADR-0006](./0006-harness-contract.md) § 1's progress-note schema in shape: required fields with citation rules, mechanically inspectable, refusal-on-malformed.

### 3. Lifecycle: Creation, Transfer, Dissolution

**Creation.** A partition is created only when:
1. [ADR-0005](./0005-single-threaded-default.md) § 4's three escalation criteria are jointly satisfied (measured ceiling, clean ownership per this ADR, ≤5 streams). Criterion 2 is now mechanically defined: "clean ownership" means "Grace has authored an ownership-map entry conforming to § 2."
2. Grace authors the entry. **Grace is the only agent permitted to add entries to the ownership map.** A plan, a sprint document, or a human prompt that lists multiple parallel items is *input* to Grace's authoring decision, not a partition declaration. See § 5.
3. The human (or Pat in proxy mode for non-architectural items) approves the entry. Approval is recorded in the entry's `entry-condition` field as a citation.
4. The writer agent is launched only after steps 1–3 are recorded in-repo. A writer launched without a corresponding ownership-map entry is a process violation detected by the four-lens code review per [ADR-0005](./0005-single-threaded-default.md) § 4 enforcement.

**Transfer.** Partition ownership moves between agents via a `superseded-by` exit-condition: the original entry is closed with `superseded-by: P<new>`, a new entry is opened with the new owner, and the new entry's `entry-condition` cites the prior partition ID. Mid-flight transfer is a Grace-authored act, not an inline owner switch. The progress note ([ADR-0006](./0006-harness-contract.md) § 1) records the transfer in State.

**TDD-pipeline carve-out (not transfer).** Sequential agent occupancy of one partition through the [ADR-0002](./0002-tdd-workflow.md) TDD pipeline (Tara red → Sato green → Sato refactor → Tara verify) is **not** a transfer; it is the canonical pipeline execution for a single owner-role. The `owner` field names the role-at-a-time, not the specific agent invocation, when the work item runs through the standard TDD pipeline. Transfer (above) applies when the work item shifts between writers in non-TDD-canonical ways — for example, Sato hands off to Pierrot for a security-review-driven rewrite, or a partition's owner changes mid-flight from one agent to a different agent in a non-pipeline transition. The carve-out preserves the no-overlap and Grace-authored-creation rules; it merely declines to require three `superseded-by` entries per M+ partitioned item for the routine pipeline rotation.

**Dissolution.** A partition closes when its exit-condition fires:
- **`merge-clean`**: the writer's commits land on the integration branch with no conflicts and the work item's tests pass. The dissolution event is the merge commit hash, recorded by Grace in a `dissolution-event:<commit>` annotation appended to the entry.
- **`superseded-by:<partition-id>`**: transfer (above).

Dissolved entries remain in the ownership-map file for traceability — the file accumulates a sprint's partition history; Grace retires the file at sprint boundary alongside the progress note ([ADR-0006](./0006-harness-contract.md) § 5). The dissolution-event annotation is required.

**`time-bound` firing mechanism.** If a partition's `time-bound` is exceeded without `merge-clean` or `superseded-by` exit-condition firing, Grace creates a Blocker per [ADR-0006](./0006-harness-contract.md) § 1 in the next progress note: `B<n>: partition P<id> exceeds time-bound; awaiting-human or Pat-in-proxy authorization to extend or dissolve.` The Blocker's `reversibility:` is `reversible` (extending the bound is cheap; dissolving forfeits in-progress work, which is `costly-to-reverse` and recorded as such if the resolution is dissolve). The Blocker gates any further writer-launch on the affected partition via the [ADR-0006](./0006-harness-contract.md) § /handoff `gates:` mechanism; the partition's owner cannot resume until the Blocker resolves.

### 4. Late-Arriving Cross-Partition Work

When work surfaces mid-flight that touches the scope of an open partition not its own, the **partition-renegotiation rule** applies. The decision tree:

1. **Originating-partition absorption (default).** If the late-arriving work falls inside an open partition's scope, the partition's owner absorbs it. No new partition. The progress note records the scope adjustment in State.
2. **Scope expansion.** If the work falls outside *all* open partitions' scope but does not collide with any open partition, Grace amends the active partition entry whose work item the new work most closely belongs to (or creates a new partition if no work item fits). Amendment uses the [ADR-0004](./0004-feature-spec-artifact.md) § Lifecycle step 4 pattern: append a dated `## Amendment YYYY-MM-DD` block to the entry; never silent edit.
3. **Cross-partition collision.** If the work touches *two or more* open partitions' scope, the rule is **halt and renegotiate**. Grace stops both writers, records a Blocker in the progress note ([ADR-0006](./0006-harness-contract.md) § 1 Blockers), and re-authors the partition map. The human (or Pat in proxy mode for non-architectural items) approves the new layout before any writer resumes. There is no "we'll figure it out at merge" path.

   *Time-bound on resolution.* The renegotiation Blocker MUST resolve within the same session OR be escalated as `awaiting-human-or-pat-authority-extension` per [ADR-0006](./0006-harness-contract.md) § Lifecycle. Both writers remain halted until the Blocker resolves; indefinite stall on an absent human is not permitted — the escalation is the named exit.

   *Partition-priority tiebreaker.* When two partitions collide, the partition with the **earlier `partition-id`** (lower numerical sequence within the same wave; e.g., `P2.1` outranks `P2.3`) keeps its scope; the later one is reshaped or dissolved. Ties at the same wave-sequence (which should not occur in well-formed maps, since `partition-id` is unique per § 2) are broken by `entry-condition` author timestamp (earlier wins). The rule is mechanical and removes the "whoever yells first" failure mode the [ADR-0003](./0003-research-driven-restructure-2026.md) finding-7 ownership-ambiguity pattern produces.
4. **No-spawn-without-Grace.** A new partition does not spawn implicitly because work surfaced. Grace's authoring step in § 3 is mandatory; an agent that needs a new partition raises a Blocker, not a parallel `Task` call.

The renegotiation rule binds the cross-ADR composition: a Blocker raised under this rule is a [ADR-0006](./0006-harness-contract.md) § 1 Blocker with `awaiting-human` (or Pat-in-proxy) status, and its resolution updates the ownership map, not the work item directly. This is the only path for cross-partition work; "agents coordinate informally" is rejected (§ 9 Alternative D).

### 5. Plan-as-Bypass: Mitigation

The Plan-as-Bypass anti-pattern is the dominant Phase 4 risk this ADR addresses. The pre-W2.1 self-claim model and any plan-driven parallel launch share a single failure mode: a plan can encode parallelism that bypasses the partition-creation gate. This ADR makes the gate mechanical.

**The binding rule:** *A plan listing multiple parallel items does NOT auto-create partitions. Partitions are created only via Grace authoring an ownership-map entry that satisfies § 2 and § 3.*

Three concrete enforcements, layered as defense-in-depth:

1. **Grace is the only authoring path.** No agent other than Grace adds entries to the ownership map. The coordinator reading a plan that lists parallel work items MUST invoke Grace to author entries; the coordinator does not launch parallel writers from the plan directly.
2. **Detection signal (mechanically expressible; enforcement is post-hoc per the standard four-lens review).** More than one writer-role `Task` call (e.g., `subagent_type: sato`) for distinct file paths in a single message, with no corresponding ownership-map entries authored within that session, is the detection signal. The four-lens code review (Vik) flags it as a process violation per [ADR-0005](./0005-single-threaded-default.md) § 4 and the existing [Premature Parallelism anti-pattern](../process/gotchas.md) (line 75).
3. **Plan-input rule.** A plan, sprint document, or human-provided implementation guide that lists multiple parallel items is *input* to Grace's authoring decision per [`gotchas.md`](../process/gotchas.md) line 67. Grace MAY decide that the plan's items collapse into a single partition (single-thread default), MAY decompose them across multiple partitions if the [ADR-0005](./0005-single-threaded-default.md) escalation criteria are met, and MAY reject the parallelism entirely. The plan's structure does not bind Grace's decision.

**What is mechanical, what is not — explicitly.** Each enforcement above operates at a different layer with a different enforcement modality, and honest naming matters:

- **(1) Grace-only authoring path** is *mechanical at map-authoring time*: Grace's refusal-on-malformed-entry pattern (mirroring [ADR-0006](./0006-harness-contract.md) § 4) catches missing fields, overlap, and cap exceedance at the moment Grace is asked to author. The mechanical refusal is real; what is not mechanical is the act of *invoking Grace* in the first place.
- **(2) Detection signal** is *mechanically expressible* (the signal is a structural property of a message — multiple writer-role `Task` calls without prior Grace authoring) but *enforcement is post-hoc* via Vik's four-lens code review. Vik can detect the violation after-the-fact; Vik cannot prevent the writer-launch in real time.
- **(3) Plan-input rule** is *a coordinator-reading rule*, not a mechanical gate. It binds the coordinator's interpretation of plan structure but has no automated check; a coordinator that simply ignores it produces no immediate refusal.

A stronger gate — a slash-command-level writer-launch refusal that fires when no ownership-map entry exists for the launched scope — would require tooling Summon does not yet have (the coordinator harness is Markdown-and-convention, not a process supervisor with `Task`-call interception). This is an explicit deferred follow-up, not a hand-wave: the natural home is the planned `create-summon` CLI scaffolder (Sprint-N+ work, post-Wave 3), where a `/parallelize` slash-command analog to `/handoff`'s refusal mechanism can mechanically gate writer-launches against the in-repo ownership map. Until that tooling lands, the three enforcements above are the achievable layered defense; the gap is named in § Residual Risks, not papered over.

**Anti-pattern to add to [`gotchas.md`](../process/gotchas.md) § Process** (W2.1 rollout work, not this ADR's edit):

> **Plan-Encoded Partition anti-pattern.** A plan or human prompt lists multiple parallel work items, and the coordinator launches parallel writers for each. The plan structure has effectively created partitions without an ownership map. **Detection signal:** multiple writer-role `Task` calls for distinct scope in one message, no ownership-map entries authored that session, no Grace invocation between plan-read and writer-launch. **Fix:** stop, invoke Grace to author ownership-map entries (or to confirm single-thread is the right call), surface the parallelization proposal to the human (or Pat in proxy mode) for approval, then resume.

This anti-pattern is the Plan-as-Bypass parent ([`gotchas.md`](../process/gotchas.md) line 67) projected into Phase 4; it is named as a sibling, not a duplicate.

### 6. Concurrency Cap

The cap is **≤5 concurrent open partitions per wave**, inherited from [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 3 and from [ADR-0003](./0003-research-driven-restructure-2026.md) finding 8 (3–7 agents per workflow). This ADR confirms the cap; it does not raise or lower it. Five is the hard cap, not a target. Most waves will have zero or one open partitions; the steady state under [ADR-0005](./0005-single-threaded-default.md) is "no parallel writers." A proposal that would open a sixth partition is rejected by Grace; the wave is decomposed or items deferred.

The cap is enforced mechanically: Grace counts open ownership-map entries (those with no `dissolution-event` annotation) before authoring a new entry. If the count reaches five, the next request is rejected with reference to this section.

### 7. Interaction with ADR-0004 Specs and ADR-0006 Progress Notes

This ADR composes with the Wave 1 ADRs as follows:

- **[ADR-0004](./0004-feature-spec-artifact.md) (feature spec).** A partition's `work-item-ref` field cites the feature spec path when the partition's work item is M+ (per [ADR-0004](./0004-feature-spec-artifact.md) § Size Carve-Out), or "no spec applies because <rationale>" when XS or unopted-S. **A partition that implements an M+ work item without a corresponding spec is non-conformant** — the [ADR-0004](./0004-feature-spec-artifact.md) hard backstop (Tara refuses to author tests on M+ without spec) plus this ADR's `work-item-ref` requirement form **two honor-system checkpoints on the same rule**, layered to catch one if the other is skipped. Both layers fire only when their host agent is invoked (Tara for the backstop, Grace for the map authoring); they are not independent of each other in the strong sense — see [Wei round-1 challenge 5](../tracking/2026-05-02-adr0007-owned-partition-debate.md). A genuinely independent third layer (e.g., commit-message lint that refuses commits whose work item lacks a spec link) is a candidate for future tooling; until that lands, "two honor-system checkpoints, layered" is the honest framing.
- **[ADR-0005](./0005-single-threaded-default.md) (single-thread default).** This ADR is the artifact that satisfies [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 2 ("clean ownership"). The phrase "clean ownership per ADR-B" in [ADR-0005](./0005-single-threaded-default.md) is now mechanical: "Grace has authored an ownership-map entry per [ADR-0007](./0007-owned-partition.md) § 2." The single-thread default is unchanged; partitions are the *legitimate path* to parallelism, not the new default.
- **[ADR-0006](./0006-harness-contract.md) (harness contract).** A partition's worker is a Sato (generator) per [ADR-0006](./0006-harness-contract.md) § 2 op-consequence. Each partition that spans sessions has its **State** in the progress note carry a `partition: P<id>` annotation, so the resuming session reads which partition it is operating against. Cross-partition Blockers (§ 4 collision) live in the progress note's Blockers section, not in the ownership map; the ownership map records the *resolution* (a new entry replacing two old ones), not the deliberation.

**`partition: P<id>` annotation enforcement composes with W1.3 follow-up F4.** The `partition: P<id>` annotation in progress-note State is currently honor-system; mechanical enforcement requires a `/handoff` refusal-condition extension that pairs with [W1.3 post-mortem](../tracking/2026-05-02-w1.3-pilot-postmortem.md) follow-up F4 ("Next Step MUST cite spec path OR explicitly state 'no spec applies because…'"). Both extensions can land in a single `/handoff` amendment when F4 is executed: the refusal also requires `partition:` to be either an active partition-id from the ownership map or `partition: none`. Until that `/handoff` amendment lands, the annotation is documentary, not enforced — same status as F4's spec citation.

The composition is intentional: the spec is the *plan*, the progress note is the *continuation state*, and the ownership map is the *write-authority topology*. Three artifacts, three concerns, no overlap. None paraphrases another.

### 8. Pilot Plan

[ADR-0003](./0003-research-driven-restructure-2026.md) § Rollout (line 73) requires pilot-before-broad-rollout. The [W1.3 pilot post-mortem](../tracking/2026-05-02-w1.3-pilot-postmortem.md) F5 follow-up identified the dual-purpose-pilot retroactivity trap: a contract ADR's implementation is not a sound pilot vehicle for an artifact ADR authored in the same wave. This ADR avoids the trap by selecting a Wave 2 work item that is **not** the implementation vehicle for another Wave 2 ADR.

**Candidate evaluation:**

- **W2.2 (Single-Writer Hierarchy for Discovery and Debugging).** M-sized, restructures Phase 1 and Phase 6 mechanics. Touches `docs/methodology/phases.md` and adds a structured-return schema. **Has natural partition boundaries:** Phase 1 (Discovery) edits and Phase 6 (Debugging) edits are independent file regions — `phases.md` § Phase 1 vs. § Phase 6 — and the structured-return schema is a new file. Three plausible partitions: `phases.md § Phase 1`, `phases.md § Phase 6`, `docs/scaffolds/structured-return.md`. **However**, W2.2 is also the implementation vehicle for its own ADR, which means the F5 trap applies again. **Rejected.**
- **W2.3 (Formalize Vik+Tara+Pierrot as Judge Stack).** M-sized, restructures Phase 5. Touches `phases.md`, the Done Gate, and adds replay/disagreement docs. Same F5-trap structure: implementation vehicle for its own ADR. **Rejected.**
- **A Wave 3 work item.** Wave 3 cannot start until Wave 2 is complete per [ADR-0003](./0003-research-driven-restructure-2026.md) § Halt-Points. Pilot scheduled to Wave 3 violates the wave gate. **Rejected.**

**Selected pilot: a Wave 2 partitioning of W2.2's rollout work, scheduled *after* W2.2's ADR is Accepted but during W2.2's implementation.** The work itself does not change; what changes is whether Grace authors an ownership map and runs partitions in parallel. The pilot intentionally mixes one partition with a real cross-partition coordination interface and one truly independent partition, so the success criteria do not collapse to "machinery works on a contrived non-collision case" (per [Wei round-1 challenge 1](../tracking/2026-05-02-adr0007-owned-partition-debate.md)).

**Three pilot partitions, rebalanced:**

1. `phases.md § Phase 1` — the Discovery phase rewrite.
2. **Cross-references to Phase 1 elsewhere in `team-governance.md` (and any other file Phase 1 names internally).** This partition's scope deliberately interfaces with partition (1)'s scope: a rename or reshape inside Phase 1 must coordinate with the cross-references. The pair therefore exercises the *coordination-required interface* case, not just non-overlapping-paths. (Replaces the prior `phases.md § Phase 6` partition, which would have been a third truly-independent region of the same Markdown file.)
3. `docs/scaffolds/structured-return.md` — the structured-return schema (a new file, truly independent of (1) and (2)).

The pilot now has one pair with a coordination-required interface (1 + 2) and one truly independent partition (3). The [ADR-0005](./0005-single-threaded-default.md) measured ceiling can be observed from the prior W1 implementations' single-thread runtime. This is a *real* parallelization decision with a real coordination surface, not a contrived non-collision.

The pilot is *not* on a work item that is the implementation vehicle for an in-flight ADR (W2.2's ADR is Accepted before the pilot begins). The F5 trap does not apply.

**Pilot success criteria:**

1. Grace authors an ownership map at `docs/scaffolds/ownership-map.md` (or an active-pilot variant under `docs/tracking/`) conforming to § 2 — every required field present, citation rules satisfied — without amendment at write time.
2. The two writer agents complete their partitions with `merge-clean` exit-conditions; commits land on the integration branch with no conflicts and W2.2's tests pass.
3. No cross-partition collision (§ 4) occurs during the pilot. If one occurs (notably plausible on the partition (1) + (2) coordination interface), the renegotiation rule fires correctly: writers halt, Blocker recorded in the progress note, human (or Pat in proxy) approves the new layout, partition-priority tiebreaker (§ 4 step 3) is applied as written. A correctly-fired renegotiation is a PASS for criterion 3, not a fail.
4. The Plan-as-Bypass detection signal (§ 5) does not fire — i.e., no parallel writer is launched without a corresponding ownership-map entry that session.
5. Post-mortem confirms the ownership map's `work-item-ref` cites the [ADR-0004](./0004-feature-spec-artifact.md) spec for any M+ partition (or "no spec applies because…" rationale), and the partition annotations in the progress note's State section are present and accurate.
6. The cap of ≤5 (§ 6) is not exercised in the pilot (only three partitions are anticipated); the cap is reachability-tested by inspection rather than by violation, mirroring [ADR-0006](./0006-harness-contract.md) § 6 criterion 5.
7. **Refusal-mechanism reachability demonstrated.** At least one of Grace's refusal mechanisms (overlap detection, missing-field rejection, cap exceedance) MUST fire during the pilot, including via deliberate test-input by the coordinator (e.g., the coordinator submits a malformed map entry to verify the rejection path). Reachability of all three mechanisms must be demonstrated even if not all fire in production. Mirrors [ADR-0006](./0006-harness-contract.md) § 6 criterion 5's positive-failure-evidence pattern.

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

### Alternative F: Consolidate the ownership map into the progress note

**The argument:** The ownership map and the progress note both record session/wave-level coordination state. The "three-artifact composition" framing in § 7 may itself be a Conway's Law smell — three artifacts because three ADRs, not because three independent concerns. Consolidating partition entries as a section inside the progress note (under [ADR-0006](./0006-harness-contract.md) § 1) reduces artifact surface area and removes one file the coordinator has to read.

**Why rejected:** the partition's lifecycle is *wave-scoped* (a partition can span multiple sessions, and is retired at sprint boundary by Grace alongside the progress note), while the progress note is *session-scoped* (rewritten each session by `/handoff` per [ADR-0006](./0006-harness-contract.md) § Lifecycle). Embedding the map as a section inside the progress note creates a lifecycle-mismatch: cross-session partitions would either need to be re-authored each session (duplicating Grace's work and creating drift opportunity — the exact failure mode [ADR-0006](./0006-harness-contract.md) § 1's clean per-session rewrite avoids) or the progress note's session-rewrite contract would need a per-section persistence rule, which contradicts [ADR-0006](./0006-harness-contract.md) § Lifecycle's clean retirement model. The three-artifact composition (sprint plan / progress note / ownership map) reflects three genuinely different lifecycles — sprint-scoped, session-scoped, wave-scoped — not Conway's Law surface area. The composition's cost (one extra file to read) is bounded; the consolidation's cost (lifecycle contradiction) compounds with each cross-session partition. Steel-manned hardest because the consolidation argument is real for waves with one session per partition; it fails for the multi-session case which this ADR must handle.

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
- The pilot (§ 8) parallelizes work that single-thread could complete. If single-thread is genuinely faster on the W2.2 work, the pilot is a worst-case throughput test. Steel-manned: that is the point. The pilot tests whether the *machinery* works, not whether parallelism is justified. The Round-2 rebalance (§ 8 partitions (1) + (2) coordinate on cross-references; only (3) is truly independent) reduces the synthetic-honesty risk Wei flagged in [round-1 challenge 1](../tracking/2026-05-02-adr0007-owned-partition-debate.md): the pilot now exercises a real coordination interface, not just three deliberately-non-overlapping regions of one Markdown file.

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
- **The partition's owner being a single role-at-a-time is binding.** *Concurrent* pair-style writers (two agents writing to one partition simultaneously) are not permitted under this ADR. The [ADR-0002](./0002-tdd-workflow.md) TDD pipeline (Tara red → Sato green → Sato refactor → Tara verify) executes within a single partition under § 3's TDD-pipeline carve-out — sequential agent rotation in the canonical pipeline is *not* a transfer and does not require `superseded-by` ceremony. Non-canonical sequential occupancy (e.g., Sato hands off to Pierrot for a security-review-driven rewrite) is a transfer per § 3. If the team finds a workflow where two agents legitimately share a partition *concurrently*, the resolution is to decompose the partition or to add an explicit pair-writer rule via a future ADR. ADR-D / ADR-G persona reshaping may surface a case this rule does not handle; the residual risk is named for inheritance.

## Rework Notes (2026-05-02)

This ADR was amended following Wei's round-1 verdict (REWORK, [debate](../tracking/2026-05-02-adr0007-owned-partition-debate.md)). Twelve items folded inline: four must-change, seven should-amend, one cosmetic. Round-2 expected outcome: ACCEPT WITH AMENDMENTS, pending Wei's verification pass.

**Must-change (4):**

1. **(Challenge 3 — § 5 Plan-as-Bypass enforcement parity.)** "Detection signal (mechanical)" softened to "Detection signal (mechanically expressible; enforcement is post-hoc per the standard four-lens review)." Added an explicit per-enforcement layer-modality breakdown: (1) Grace-only authoring path is mechanical *at map-authoring time*; (2) detection signal is mechanically expressible but enforcement is post-hoc Vik review; (3) plan-input rule is a coordinator-reading rule, not a mechanical gate. Cited the planned `create-summon` CLI scaffolder (Sprint-N+) as the natural home for a mechanical writer-launch gate. Lines: § 5 enforcements list and the new "What is mechanical, what is not" paragraph.
2. **(Challenge 4 — Single-owner-per-partition TDD carve-out.)** Added explicit TDD-pipeline carve-out in § 3: sequential agent occupancy of one partition through the [ADR-0002](./0002-tdd-workflow.md) pipeline (Tara red → Sato green → Sato refactor → Tara verify) is **not** a transfer; the `owner` field names the role-at-a-time. Updated § 1 definition, § 2 schema `owner` row, and § Residual Risks pair-writer text to match. Lines: § 1 definition; § 2 owner row; § 3 new "TDD-pipeline carve-out (not transfer)" paragraph; § Residual Risks final bullet.
3. **(Challenge 7 — `time-bound` firing mechanism.)** Bound the `time-bound` field to a Blocker creation per [ADR-0006](./0006-harness-contract.md) § 1: exceedance triggers a `B<n>: partition P<id> exceeds time-bound` Blocker with `reversibility: reversible` (extend) or `costly-to-reverse` (dissolve). The Blocker gates further writer-launch via [ADR-0006](./0006-harness-contract.md) § /handoff `gates:`. Lines: § 2 `time-bound` schema row; § 3 new "`time-bound` firing mechanism" paragraph.
4. **(Challenge 6 — Entry-condition language.)** Downgraded `entry-condition` to cite *evidence* of [ADR-0005](./0005-single-threaded-default.md) § 4 criterion 1 satisfaction (a handoff/progress-note/sprint-plan reference) pending a future ADR formalizing the artifact format per [ADR-0005](./0005-single-threaded-default.md) § Residual Risks. Lines: § 2 `entry-condition` schema row.

**Should-amend (7):**

5. **(Challenge 2 — Renegotiation rule.)** Added time-bound on resolution (escalates as `awaiting-human-or-pat-authority-extension` per [ADR-0006](./0006-harness-contract.md) § Lifecycle) and partition-priority tiebreaker (earlier `partition-id` keeps scope; ties broken by `entry-condition` author timestamp). Lines: § 4 step 3 collision halt.
6. **(Challenge 8 — Pilot positive-failure-evidence.)** Added 7th success criterion: at least one of Grace's refusal mechanisms (overlap, missing-field, cap exceedance) MUST fire during the pilot, including via deliberate test-input by the coordinator. Mirrors [ADR-0006](./0006-harness-contract.md) § 6 criterion 5. Lines: § 8 success criteria.
7. **(Challenge 10 — Considered and Rejected Alternative F.)** Added Alternative F (consolidate map into progress note). Rejected on lifecycle-scope grounds: partition is wave-scoped, progress note is session-scoped; embedding creates a lifecycle-mismatch [ADR-0006](./0006-harness-contract.md) § Lifecycle's clean retirement model contradicts. Lines: new § Considered and Rejected sub-section after Alternative E.
8. **(Challenge 12 — Scope schema constrains named interfaces.)** Restricted `scope` entries to file paths or glob patterns; named-interface entries are NOT permitted in this ADR's schema. Added explicit glob overlap rule: two partitions overlap if any path could match both glob/explicit-path entries (set intersection of expanded path sets is non-empty). Named-interface scope is deferred to a future ADR if a real case surfaces. Lines: § 2 `scope` schema row.
9. **(Challenge 5 — § 7 two-layer enforcement.)** Softened "two-layer enforcement of the same rule" to "two honor-system checkpoints on the same rule, layered to catch one if the other is skipped." Noted that both checkpoints fire only when their host agent is invoked; a genuinely independent third layer (commit-message lint) is candidate future tooling. Lines: § 7 ADR-0004 composition bullet.
10. **(Challenge 11 — Compose with W1.3 post-mortem F4.)** Added explicit composition note: the `partition: P<id>` annotation in progress-note State is currently honor-system; mechanical enforcement requires a `/handoff` refusal-condition extension that pairs with W1.3 F4 ("Next Step MUST cite spec path OR explicitly state 'no spec applies because…'"). Both extensions can land in a single `/handoff` amendment. Lines: § 7 new "`partition: P<id>` annotation enforcement composes with W1.3 follow-up F4" paragraph.
11. **(Challenge 1 — Pilot rebalance toward real cross-partition risk.)** Replaced the third-deliberately-non-overlapping-Markdown-section partition (`phases.md § Phase 6`) with a partition that touches the cross-references to Phase 1 elsewhere in `team-governance.md` and any other file Phase 1 names. Pilot now has one coordination-required interface pair (1 + 2) and one truly independent partition (3 = `docs/scaffolds/structured-return.md`). Updated § Negative Consequences to note the rebalance reduces the synthetic-honesty risk Wei flagged. Lines: § 8 selected pilot, three pilot partitions, success criteria 3; § Negative Consequences pilot bullet.

**Cosmetic (1):**

12. **(Challenge 9 — Status taxonomy.)** "Proposed (pre-Wei)" replaced with "Proposed" plus a note matching ADR-0006's pattern syntax: Wei round-1 challenge complete (REWORK), seven should-amend + four must-change items folded inline, Wei round-2 verification pending. Transition-to-Accepted conditions unchanged. Lines: § Status.

**Open questions for Wei round 2:**

- The TDD-pipeline carve-out (R2) reads "owner field names the role-at-a-time, not the specific agent invocation." This treats `owner: sato` as covering the canonical Sato role even when Tara is the active red-phase actor inside that partition. Wei may prefer a stronger formulation (e.g., a `role-rotation:` annotation that lists permitted agent transitions inside the partition without ceremony). Both formulations close the must-change; the chosen one is cheaper.
- The A1 partition-priority tiebreaker uses lower `partition-id` wins. Wei's challenge 2 suggested "earlier `partition-id` keeps scope" without specifying whether "earlier" means lower numerical sequence within the same wave or chronological authoring order. The chosen wording is the former (lower-numeric-sequence) with chronological order as the secondary tiebreaker; if Wei intended chronological as primary, swap is one-line.
- A4 declines to define a named-interface registry now and explicitly defers it. If Wei prefers the registry inline (challenge 12 alternative b), this is a future-ADR question, not a round-2 blocker.
