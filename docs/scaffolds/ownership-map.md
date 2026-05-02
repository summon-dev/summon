<!-- agent-notes: { ctx: "ownership-map template per ADR-0007 § 2", deps: [docs/adrs/0007-owned-partition.md, docs/adrs/0005-single-threaded-default.md, docs/adrs/0006-harness-contract.md], state: scaffold, last: "claude@2026-05-02" } -->

# Ownership Map Template

> **This file is the template.** Per [ADR-0007 § 2](../adrs/0007-owned-partition.md#2-ownership-map-schema), live ownership maps are authored at `docs/sprints/<sprint-id>-ownership-map.md` (e.g., `docs/sprints/sprint-1-ownership-map.md`). One active map per sprint. Copy this template, replace examples with real entries, and keep dissolved entries in place for traceability until Grace retires the map at sprint boundary.
>
> **Grace is the only authoring path.** Per [ADR-0007 § 5](../adrs/0007-owned-partition.md#5-plan-as-bypass-mitigation), no agent other than Grace adds entries. A plan, sprint document, or human prompt that lists parallel items is *input* to Grace's authoring decision — not a partition declaration. If you find yourself editing this map without a Grace invocation, stop. See [`gotchas.md` § Process — Plan-Encoded Partition anti-pattern](../process/gotchas.md#process).
>
> **Single-thread default.** Per [ADR-0005](../adrs/0005-single-threaded-default.md), code-write work runs single-threaded by default. The absence of an entry in the active map is the steady state; an entry exists only when [ADR-0005 § 4](../adrs/0005-single-threaded-default.md#4-escalation-criteria-from-single-thread-to-parallel)'s three escalation criteria are jointly satisfied (measured ceiling, clean ownership per ADR-0007, ≤5 streams) and the human (or Pat in proxy mode) has approved the parallelization.

---

## Schema (nine required fields per partition entry)

Each entry MUST contain all nine fields. Grace refuses to launch a parallel writer if any field is missing, empty, or malformed (per the same refusal pattern [ADR-0006 § 4](../adrs/0006-harness-contract.md#4-handoff-command-contract) establishes for `/handoff`).

| Field | Required? | Description | Format / constraints |
|---|---|---|---|
| **partition-id** | Yes | Stable identifier, unique across the active map; not reused for the lifetime of the wave. | `P<wave>.<seq>` (e.g., `P2.1`, `P2.2.3`). Mechanical; Grace generates. |
| **author** | Yes | The Grace invocation that authored this entry. | `grace@YYYY-MM-DD` (mirrors agent-notes `last` field convention). |
| **owner** | Yes | The single writer-role-at-a-time per [ADR-0002](../adrs/0002-tdd-workflow.md). The TDD pipeline (Tara red → Sato green → Sato refactor → Tara verify) is the canonical role-rotation pattern executing within one partition without `superseded-by` ceremony — see [ADR-0007 § 3 TDD-pipeline carve-out](../adrs/0007-owned-partition.md#3-lifecycle-creation-transfer-dissolution). | `<agent-name>` (typically `sato` for implementation partitions, `tara` for test-led partitions). One value, not a list. |
| **scope** | Yes | The set of file paths or glob patterns the owner has write authority over. **Each entry MUST cite the path explicitly or be a glob pattern.** Named-interface entries (e.g., "the `/handoff` command's input schema") are NOT permitted in this schema. | Path or glob (e.g., `docs/methodology/phases.md § Phase 1`, `packages/cli/**`). Scope entries MUST NOT overlap any other open partition's scope; Grace verifies set-intersection of expanded path sets is empty before authoring. |
| **work-item-ref** | Yes | The work item ID (and feature spec path if [ADR-0004](../adrs/0004-feature-spec-artifact.md) applies, per [ADR-0007 § 7](../adrs/0007-owned-partition.md#7-interaction-with-adr-0004-specs-and-adr-0006-progress-notes)). | Spec path (e.g., `docs/specs/W2.2-discovery-debugging.md`) **OR** explicit `no spec applies because <one-sentence rationale>`. Same citation rule as [ADR-0004 § Schema Key Decisions](../adrs/0004-feature-spec-artifact.md#1-schema). |
| **entry-condition** | Yes | What must be true at partition creation time. Includes (a) evidence of [ADR-0005 § 4](../adrs/0005-single-threaded-default.md#4-escalation-criteria-from-single-thread-to-parallel) criterion 1 satisfaction (handoff/progress-note/sprint-plan reference documenting the writer pipeline was blocked for at least one full session); (b) human or Pat-in-proxy approval reference; (c) any prerequisite partition's `dissolution-event` if this partition depends on another's output. | Each sub-condition cites an artifact (commit hash, board item, prior partition ID, handoff path). |
| **exit-condition** | Yes | What must be true for dissolution. One flavor only. | `merge-clean` (writer's commits land with no conflicts and the work item's tests pass) **OR** `superseded-by:<partition-id>` (transfer; see [ADR-0007 § 3](../adrs/0007-owned-partition.md#3-lifecycle-creation-transfer-dissolution)). |
| **depends-on** | Yes | Other partition IDs this partition's exit blocks on. Empty list `[]` is permitted and means independent. | Each entry → an existing partition ID in the active map. |
| **time-bound** | Yes | Latest expected dissolution date. Exceedance fires a Blocker per [ADR-0006 § 1](../adrs/0006-harness-contract.md#1-progress-note-schema) — see [ADR-0007 § 3 `time-bound` firing mechanism](../adrs/0007-owned-partition.md#3-lifecycle-creation-transfer-dissolution). | `YYYY-MM-DD`. One value. |

---

## Example entries (running example: W2.2 implementation pilot per [ADR-0007 § 8](../adrs/0007-owned-partition.md#8-pilot-plan))

```yaml
- partition-id: P2.2.1
  author: grace@2026-05-15
  owner: sato
  scope:
    - docs/methodology/phases.md § Phase 1
  work-item-ref: docs/specs/W2.2-discovery-debugging.md
  entry-condition:
    - ADR-0005 § 4 criterion 1: writer pipeline blocked one full session per docs/sprints/sprint-1-plan.md (W2.2 wave-2 single-thread baseline)
    - human approval recorded in .claude/progress-note.md (commit <hash>) Blocker B<n> resolution
    - depends-on satisfied (none)
  exit-condition: merge-clean
  depends-on: []
  time-bound: 2026-05-22

- partition-id: P2.2.2
  author: grace@2026-05-15
  owner: sato
  scope:
    - docs/process/team-governance.md (Phase 1 cross-references only)
    - any other file Phase 1 names internally
  work-item-ref: docs/specs/W2.2-discovery-debugging.md
  entry-condition:
    - ADR-0005 § 4 criterion 1: same baseline as P2.2.1
    - human approval recorded in .claude/progress-note.md (commit <hash>)
    - depends-on satisfied (P2.2.1 in flight; coordination-required interface noted)
  exit-condition: merge-clean
  depends-on: [P2.2.1]
  time-bound: 2026-05-22

- partition-id: P2.2.3
  author: grace@2026-05-15
  owner: sato
  scope:
    - docs/scaffolds/structured-return.md
  work-item-ref: docs/specs/W2.2-discovery-debugging.md
  entry-condition:
    - ADR-0005 § 4 criterion 1: same baseline as P2.2.1
    - human approval recorded in .claude/progress-note.md (commit <hash>)
    - depends-on satisfied (none — new file, truly independent)
  exit-condition: merge-clean
  depends-on: []
  time-bound: 2026-05-22
```

After dissolution, Grace appends `dissolution-event:<commit-hash>` to the entry. The entry stays in the file for traceability until sprint-boundary retirement.

---

## How partitions are created

Per [ADR-0007 § 3](../adrs/0007-owned-partition.md#3-lifecycle-creation-transfer-dissolution), creation is a four-step gate. Grace refuses to launch a writer if any step is incomplete.

1. **Escalation criteria jointly satisfied.** [ADR-0005 § 4](../adrs/0005-single-threaded-default.md#4-escalation-criteria-from-single-thread-to-parallel)'s three criteria — measured single-thread ceiling, clean ownership (this map), ≤5 streams — must all hold. Criterion 2 is now mechanically defined: "clean ownership" means "Grace has authored an ownership-map entry conforming to the schema above."
2. **Grace authors the entry.** No agent other than Grace adds entries. A plan listing parallel items is input, not a declaration.
3. **Human (or Pat in proxy mode for non-architectural items) approves.** Approval is recorded in the entry's `entry-condition` field as a citation (commit hash or progress-note Blocker resolution).
4. **The writer launches only after steps 1–3 are recorded in-repo.** A writer launched without a corresponding ownership-map entry is a process violation flagged by the four-lens code review.

---

## How partitions are transferred

Per [ADR-0007 § 3 Transfer](../adrs/0007-owned-partition.md#3-lifecycle-creation-transfer-dissolution), partition ownership moves between agents via a `superseded-by` exit-condition. The original entry closes with `superseded-by: P<new>`, a new entry opens with the new owner, and the new entry's `entry-condition` cites the prior partition ID. Mid-flight transfer is a Grace-authored act, not an inline owner switch. The progress note ([ADR-0006 § 1](../adrs/0006-harness-contract.md#1-progress-note-schema)) records the transfer in State.

**TDD-pipeline carve-out (NOT a transfer).** Sequential agent occupancy of one partition through the [ADR-0002](../adrs/0002-tdd-workflow.md) TDD pipeline (Tara red → Sato green → Sato refactor → Tara verify) is **not** a transfer; it is the canonical pipeline execution for a single owner-role. The `owner` field names the role-at-a-time, not the specific agent invocation. Transfer applies only when the partition shifts in non-TDD-canonical ways (e.g., Sato hands off to Pierrot for a security-review-driven rewrite).

---

## How partitions are dissolved

Per [ADR-0007 § 3 Dissolution](../adrs/0007-owned-partition.md#3-lifecycle-creation-transfer-dissolution), a partition closes when its exit-condition fires:

- **`merge-clean`**: the writer's commits land on the integration branch with no conflicts and the work item's tests pass. Grace appends `dissolution-event:<commit-hash>` to the entry.
- **`superseded-by:<partition-id>`**: transfer (above). The dissolution-event is the new entry's `partition-id`.

Dissolved entries remain in this file for traceability until sprint-boundary retirement (see "Map retirement" below).

---

## Renegotiation on collision

Per [ADR-0007 § 4](../adrs/0007-owned-partition.md#4-late-arriving-cross-partition-work), when late-arriving work touches two or more open partitions' scope, the rule is **halt and renegotiate**. Grace stops both writers, records a Blocker in the progress note, and re-authors the partition map. The human (or Pat in proxy mode) approves the new layout before any writer resumes. The renegotiation Blocker MUST resolve within the same session OR escalate as `awaiting-human-or-pat-authority-extension` per [ADR-0006 § Lifecycle](../adrs/0006-harness-contract.md#5-lifecycle).

**Tiebreaker:** the partition with the **earlier `partition-id`** (lower numerical sequence within the same wave) keeps its scope; the later one is reshaped or dissolved. Ties at the same wave-sequence (which should not occur in well-formed maps) are broken by `entry-condition` author timestamp (earlier wins).

---

## Time-bound exceedance

Per [ADR-0007 § 3 `time-bound` firing mechanism](../adrs/0007-owned-partition.md#3-lifecycle-creation-transfer-dissolution), if a partition's `time-bound` is exceeded without `merge-clean` or `superseded-by` firing, Grace creates a Blocker per [ADR-0006 § 1](../adrs/0006-harness-contract.md#1-progress-note-schema) in the next progress note:

```
B<n>: partition P<id> exceeds time-bound; awaiting-human or Pat-in-proxy authorization to extend or dissolve.
reversibility: reversible (extend) | costly-to-reverse (dissolve forfeits in-progress work)
```

The Blocker gates any further writer-launch on the affected partition via the `/handoff` `gates:` mechanism; the partition's owner cannot resume until the Blocker resolves.

---

## Map retirement

Grace retires the active map at sprint boundary, alongside the progress note ([ADR-0006 § 5](../adrs/0006-harness-contract.md#5-lifecycle)). The retired file is preserved in-repo for traceability; agent-notes `state` flips to `canonical`. The next sprint starts a fresh ownership map at `docs/sprints/<next-sprint-id>-ownership-map.md` (or the equivalent path); the prior version is reachable through git history.
