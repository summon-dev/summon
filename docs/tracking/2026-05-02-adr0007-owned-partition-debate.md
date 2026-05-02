---
agent-notes: { ctx: "Wei challenge of ADR-0007 owned partition (rounds 1 + 2)", deps: [docs/adrs/0007-owned-partition.md, docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0005-single-threaded-default.md, docs/adrs/0006-harness-contract.md, docs/adrs/0004-feature-spec-artifact.md, docs/tracking/2026-05-02-w1.3-pilot-postmortem.md, docs/sprints/sprint-1-plan.md], state: complete, last: "wei@2026-05-02" }
---

# Debate: ADR-0007 Owned Partition Replaces Self-Claim Market

**ADR:** [docs/adrs/0007-owned-partition.md](../adrs/0007-owned-partition.md)
**Date:** 2026-05-02
**Participants:** Archie (author, in absentia) vs Wei (challenger)
**Note:** Wei is read-only by persona definition. The "Round 2 anticipated rebuttal" below is Wei's good-faith reconstruction of Archie's strongest defense, per the gate-protocol pattern established in the ADR-0006 debate. The actual Round 2 will be Archie's rework (folded inline into ADR-0007) plus a light Wei verification pass.

**Prior Wei rounds in scope:** ADR-0006 round 1 lessons — no soft gates without escalation; no hand-waved enforcement; refusal conditions must be mechanically reachable. ADR-0004 round 1 lessons — no pre-commitment dressed as deferral; honor-system mitigations must be honestly named. W1.3 post-mortem F4/F5 — partition-citation rules face the same op-consequence-1 minor gap as ADR-0006's spec citation; dual-purpose pilots have structural retroactivity risk.

---

## Round 1 — Wei's Challenges

### Challenge 1 — Synthetic pilot honesty (§ 8)

The pilot — three parallel partitions on `phases.md § Phase 1`, `phases.md § Phase 6`, and `docs/scaffolds/structured-return.md` — is named synthetic by Archie ("test the machinery, not the parallelism justification"). The stance is partially sound but the success criteria collapse "machinery works" and "parallelism justified" in a way the post-mortem cannot disentangle.

- Three sections of one Markdown file *cannot* collide on git semantics; they could collide on prose-coherence semantics, which is the failure mode that matters for parallel-writing methodology docs, and the criteria don't capture that.
- A pilot run *inside* Wave 2 cannot inform Wave 2's broad rollout — every other Wave 2 item starts with the same uncertainty the pilot was meant to retire.
- The pilot does not stress single-thread-vs-parallel comparison. The signal is binary on a test designed not to fail.

**Verdict: should-amend.** Add at least one criterion that isn't passable-by-construction (e.g., a single-thread baseline elapsed-time estimate, or a partition pair with a real cross-partition risk on shared interface).

### Challenge 2 — Cross-partition collision halt cost calibration (§ 4 step 3)

Halt-and-renegotiate is defensible. Two real gaps:
- **No time bound on resolution.** If the human is unavailable and Pat-in-proxy can't authorize (partition layout is arguably architectural), both writers stall indefinitely. ADR-0006 § Lifecycle's `awaiting-human-or-pat-authority-extension` pattern is the model.
- **No partition-priority tiebreaker.** If P2.1 and P2.3 collide, which keeps scope and which reshapes? Without a rule, Grace's renegotiation is fresh-each-time and the team gravitates toward "whoever yells first" — exactly the ownership-ambiguity failure mode this ADR exists to prevent.

**Verdict: should-amend.** Add time-bound + escalation citing ADR-0006's pattern; default tiebreaker (earlier `partition-id` keeps scope).

### Challenge 3 — Grace-bypass enforcement parity with ADR-0005 (§ 5)

**The most important challenge.** The umbrella binding constraint is "address Plan-as-Bypass head-on." § 5 names three enforcements but the actual writer-launch gate is the same Vik-post-hoc-review that ADR-0005 named. The "**Detection signal (mechanical)**" framing overpromises: only the *signal* is mechanical; the *enforcement* is post-hoc. Nothing prevents the coordinator from launching `Task(subagent_type: sato)` without first invoking Grace.

The honest options:
- **(i)** Add a *mechanical* writer-launch gate that doesn't depend on remembering to invoke Grace (e.g., a `/parallelize` slash-command analog to `/handoff`'s refusal mechanism).
- **(ii)** Acknowledge that the gate remains honor-system + post-hoc, name it explicitly, and argue from first principles why this is the best achievable.

**Verdict: must-change.** Either name a mechanical writer-launch gate, OR honestly downgrade § 5's "mechanical" framing to "mechanically expressible; enforcement is post-hoc per the standard four-lens review."

### Challenge 4 — Single-owner-per-partition rule breaks TDD without a carve-out

As written, every M+ partitioned item incurs three Grace-authored transfers (Tara red → Sato green → Tara verify), each with `superseded-by` ceremony. ADR-0007 chose to read "single owner = single agent" rather than "single owner = single role-at-a-time"; the narrowing wasn't required by ADR-0003 and creates real process tax.

**Verdict: must-change.** Either (a) explicitly carve TDD red→green→verify cycles out of the transfer rule (sequential agent occupancy of one partition is permitted within one work item without `superseded-by` ceremony), or (b) redefine "owner" as a role rather than an agent, with the ADR-0002 TDD pipeline as the canonical transition.

### Challenge 5 — `work-item-ref` double-enforcement claim (§ 7)

§ 7 claims ADR-0007's `work-item-ref` plus ADR-0004's hard backstop form "two-layer enforcement." Both layers fire only when Tara is invoked / when Grace authors a map. Skip both, both fail — they are two pointers to the same gate, not two independent layers.

**Verdict: should-amend.** Soften "two-layer enforcement" to "two honor-system checkpoints" OR add a genuinely independent layer (e.g., commit-message lint).

### Challenge 6 — Entry-condition cites a non-existent ADR-0005 artifact (§ 2)

§ 2 schema requires `entry-condition` to cite "the ADR-0005 measured-ceiling artifact reference." ADR-0005 § 4 criterion 1 defines what counts as ceiling evidence, but ADR-0005 § Residual Risks lines 110–111 explicitly says "a future ADR or sprint retro may need to define what evidence counts." ADR-0007 is depending on an artifact ADR-0005 explicitly deferred.

**Verdict: must-change.** Either (a) downgrade entry-condition language to "evidence reference per ADR-0005 § 4 criterion 1," (b) define the artifact format here (in scope; ADR-0007 closes ADR-0005's open loop on criterion 2; closing criterion 1 is a small additional move), or (c) explicitly cite the deferral.

### Challenge 7 — Ownership-map schema field fitness

| Field | Verdict |
|---|---|
| partition-id, author, scope, exit-condition, depends-on | Right fields, mechanical, fit. |
| owner | See challenge 4 — role-vs-agent question. |
| work-item-ref | See challenge 5 — claim overpromises. |
| entry-condition | See challenge 6 — cites non-existent artifact. |
| **time-bound** | **Decorative without a mechanism.** § 2 says "If the partition exceeds this date, Grace flags it for renegotiation per § 4," but § 4's renegotiation is collision-driven, not time-driven. There's no rule for what happens at time-bound exceedance without a collision. |

**Missing fields:**
- `escalation-path` — when collision halts both writers, who Grace pings.
- `partition-priority` — see challenge 2; needed for collision tiebreaking.

**Glob-vs-explicit overlap rules in `scope` are unspecified.** Two partitions both writing `packages/cli/**/*.ts` and `packages/cli/foo.ts` would set-intersect-empty under literal string comparison.

**Verdict: must-change** on `time-bound` (define firing mechanism via ADR-0006 § 1 Blocker creation, or remove). **Should-amend** on missing fields and glob rules.

### Challenge 8 — Pilot success criteria scoreability and positive-failure-evidence

Comparing against ADR-0006 § 6 (which W1.3 post-mortem demonstrated were scoreable): five of six ADR-0007 criteria are mechanically scoreable, but criteria 2, 3, 4 are *passable by construction* on the synthetic three-section pilot. ADR-0006's criterion 5 ("refusal conditions fire at least once") was a positive demand for evidence-of-failure; ADR-0007 has no analog.

**Verdict: should-amend.** Add a positive-failure-evidence criterion: at least one of Grace's refusal mechanisms (overlap, missing field, cap exceedance) must fire during the pilot, including via deliberate test-input by the coordinator.

### Challenge 9 — Status taxonomy

"Proposed (pre-Wei)" is non-standard. ADR-0006 used "Proposed (Shadow-Pilot phase)" as a similar parenthetical specialization. Acceptable as a placeholder during round 0/1; should resolve at round 2.

**Verdict: cosmetic.** Match ADR-0006's pattern syntax at round 2.

### Challenge 10 — "Considered and Rejected" missing alternative

The strongest unenumerated alternative: **"Make the ownership map a section inside the progress note (consolidate under ADR-0006)."** This is the alternative the ADR is most tempted not to take seriously. The current "three-artifact composition" framing reads as a virtue but could equally be a *Conway's Law smell* — three artifacts because three ADRs, not because three independent concerns.

**Verdict: should-amend.** Add Alternative F. Reject on lifecycle-scope grounds (partition is wave-scoped, progress note is session-scoped — embedding creates lifecycle-mismatch) OR accept and restructure.

### Challenge 11 — Composition with ADR-0006 op-consequence-1 minor gap (W1.3 post-mortem F4)

ADR-0007 § 7 binds State to carry `partition: P<id>` annotation but does not propose the parallel `/handoff` refusal condition that would mechanically enforce it. The pattern is identical to ADR-0006 op-consequence-1 (W1.3 post-mortem F4): citation rule added, refusal mechanism not extended.

**Verdict: should-amend.** Either (a) propose `/handoff` refusal-condition extension here ("Next Step's `partition:` annotation must be either an active partition-id or `partition: none`"), or (b) explicitly cite F4 and note honor-system status pending F4 resolution.

### Challenge 12 — Silent-failure-with-longest-discovery-time

Scope-non-overlap is mechanically inspectable for path/glob entries, but **the schema permits "named interfaces"** (e.g., "the `/handoff` command's input schema") — these are *not* mechanically inspectable. Two partitions citing semantically-overlapping named interfaces with non-overlapping paths would pass Grace's mechanical check and collide at integration time.

**Verdict: should-amend.** Restrict scope to path/glob (with glob overlap rules from challenge 7), OR define a registry of named interfaces with explicit overlap rules.

---

## Verdict (Round 1)

**REWORK.** Four design-level gaps must close before round 2:

1. **§ 5 enforcement parity** — soften "mechanical" framing OR add tooling-level gate (challenge 3).
2. **TDD carve-out** — single-owner rule needs explicit ADR-0002-pipeline carve-out OR role-not-agent redefinition (challenge 4).
3. **`time-bound` firing mechanism** — bind to ADR-0006 § 1 Blocker creation OR remove field (challenge 7).
4. **Entry-condition language** — downgrade or define the ADR-0005 artifact (challenge 6).

**Should-amend (rank-ordered):** 1, 2, 5, 8, 10, 11, 12. **Cosmetic:** 9.

The rework is mostly recoverable by wording amendments rather than redesign. Round-2 most-likely outcome after rework: ACCEPT WITH AMENDMENTS.

---

## Round 1 Compliance Check vs Umbrella Binding Constraints

| # | Umbrella binding constraint | ADR-0007 status |
|---|---|---|
| 1 | MUST specify partition lifecycle (creation, transfer, dissolution) | **Met.** § 3 names creation (4 steps), transfer (`superseded-by`), dissolution (`merge-clean` or transfer). |
| 2 | MUST address late-arriving cross-partition work renegotiation | **Met with gaps.** § 4 names four-case decision tree. Gaps: time-bound on resolution, partition-priority. (Should-amend.) |
| 3 | MUST address Plan-as-Bypass anti-pattern head-on | **Met in letter, weak in spirit.** § 5 delivers substantive design. "Mechanical" framing overpromises and must be softened. (Conditional pass; tied to challenge 3.) |
| 4 | MUST include "Considered and Rejected" subsection | **Met with one missing alternative.** Should add Alternative F (consolidate into progress note). |
| 5 | Pilot-before-broad-rollout rule applies | **Met with structural concern.** § 8 selects W2.2 with three partitions, after W2.2's ADR is Accepted. Avoids F5 dual-purpose-pilot retroactivity. Concern: pilot is synthetic; criteria are passable-by-construction. (Should-amend.) |

**Bottom line:** all five constraints met in letter. Constraints 3 and 5 carry spirit-of-rule weakness addressable by round-2 amendments. None are catastrophic violations.

---

## Round 2 Anticipated Rebuttal (Wei's good-faith reconstruction of Archie's strongest defense)

Archie would mostly concede. Of the four REWORK items: #3 (time-bound mechanism) and #4 (ADR-0005 artifact citation) concede as wording amendments; #2 (TDD carve-out) concedes with an explicit added clause. On #1 (gate parity) Archie pushes back: the three-enforcement structure *is* the head-on response, and a fourth mechanical gate would require tooling Summon doesn't yet have. The honest stance is what § 5 names: gate is mechanical at map-authoring level, post-hoc at writer-launch level, residual risk acknowledged in line with ADR-0005's pattern. If the human wants a stronger gate, that's a `create-summon` CLI scaffolder feature for a future sprint.

Wei's expected concession on the rebuttal: the three-enforcement framing is genuinely defensible *provided* § 5's "**Detection signal (mechanical)**" wording is softened to "**Detection signal (mechanically expressible; enforcement is post-hoc per the standard four-lens review)**." Wording amendment, not design change. Net round-2 outcome: **ACCEPT WITH AMENDMENTS**, six to seven amendments folded inline.

---

## Round 2 Plan

Archie reworks ADR-0007 inline, addressing all four REWORK items + seven amendments + cosmetic. A light Wei round-2 verification pass confirms the rework. If round 2 = ACCEPT WITH AMENDMENTS, the ADR transitions out of Proposed-pre-Wei status; remaining Accept-transition conditions are (b) human approval, (c) pilot pass, (d) W2.1 rollout work landing.

---

## Round 2 — Wei Verification

**Mode:** Read-only verification pass on the rework. Round 1 verdict was REWORK; round-2 expected outcome (per round-1 anticipated rebuttal) was ACCEPT WITH AMENDMENTS pending honest folding. **Confirmed.**

### Per-Amendment Verification Summary

| # | Type | Round-1 Challenge | Folded? | Wording Satisfies R1? |
|---|---|---|---|---|
| 1 | must-change | Ch.3 — § 5 "mechanical" overpromise | **Yes** | **Yes** — per-enforcement layer-modality breakdown is exactly what R1 alternative (ii) demanded; honest naming throughout. |
| 2 | must-change | Ch.4 — TDD carve-out | **Yes** | **Yes** — TDD pipeline (Tara red → Sato green → Sato refactor → Tara verify) explicitly carved out from `superseded-by` ceremony at § 1, § 2 owner row, § 3 new paragraph, and § Residual Risks. |
| 3 | must-change | Ch.7 — `time-bound` firing | **Yes** | **Yes** — bound to ADR-0006 § 1 Blocker creation with reversibility annotation; gates further writer-launch via `/handoff` `gates:`. Composes correctly. |
| 4 | must-change | Ch.6 — Entry-condition cites non-existent artifact | **Yes** | **Yes** — downgraded to "evidence of ADR-0005 § 4 criterion 1 satisfaction" per R1 option (a); pending-future-ADR clause cites ADR-0005 § Residual Risks. |
| 5 | should-amend | Ch.2 — Renegotiation rule (time-bound + tiebreaker) | **Yes** | **Yes** — same-session resolution OR escalates as `awaiting-human-or-pat-authority-extension` per ADR-0006; tiebreaker "earlier `partition-id`" with secondary chronological. |
| 6 | should-amend | Ch.8 — Pilot positive-failure-evidence | **Yes** | **Yes** — 7th criterion mirrors ADR-0006 § 6 criterion 5; reachability of all three Grace refusal mechanisms must be demonstrated. |
| 7 | should-amend | Ch.10 — Alternative F | **Yes** | **Yes** — Alt F (consolidate map into progress note) added; rejected on lifecycle-scope grounds with steel-manning. |
| 8 | should-amend | Ch.12 — Scope schema named-interface restriction | **Yes** | **Yes** — restricted to file paths/glob; named-interface deferred to future ADR; explicit glob overlap rule added. |
| 9 | should-amend | Ch.5 — § 7 two-layer enforcement | **Yes** | **Yes** — softened to "two honor-system checkpoints"; commit-message lint named as candidate genuinely-independent third layer. |
| 10 | should-amend | Ch.11 — Compose with W1.3 F4 | **Yes** | **Yes** — `partition: P<id>` annotation honor-system pending `/handoff` extension paired with W1.3 F4; both can land in single amendment. |
| 11 | should-amend | Ch.1 — Pilot rebalance | **Yes** | **Yes** — third partition replaced with cross-references-to-Phase-1 in `team-governance.md` (coordination-required interface); criterion 3 explicitly counts correctly-fired renegotiation as PASS. |
| 12 | cosmetic | Ch.9 — Status taxonomy | **Yes** | "Proposed (pre-Wei)" → "Proposed (Pilot-pending)" matching ADR-0006 pattern. |

**Score: 4/4 must-change satisfied; 7/7 should-amend satisfied; 1/1 cosmetic satisfied. No new must-change or should-amend items raised in round 2.**

### Archie's Open Questions for Wei Round 2

**Q1 — `owner` field strength (TDD-pipeline annotation vs `role-rotation:`):** **Accept Archie's choice.** Current formulation (`owner` names role-at-a-time + § 3 carve-out) is sufficient and cheaper. A `role-rotation:` annotation would add schema field whose values are entirely predictable for the canonical pipeline. If a future workflow surfaces non-TDD multi-role rotation, that triggers a future ADR amendment. **No change requested.**

**Q2 — Partition-priority tiebreaker semantics (lower-numeric vs chronological):** **Accept Archie's choice (lower-numeric primary, chronological secondary).** Lower-numeric is mechanically inspectable from the partition-id alone. My R1 challenge ("earlier `partition-id`") intended the mechanical reading. **No change requested.**

**Q3 — Named-interface registry (defer vs inline):** **Accept Archie's choice (defer).** Defining a registry inline adds schema surface area for a case Summon has not yet encountered; the path/glob restriction will catch ~95% of real cases. Wait for the case to surface. **No change requested. This is correctly a future-ADR question, not a round-2 blocker.**

### Compliance Recheck vs Umbrella Binding Constraints (Round 2)

| # | Constraint | R1 Status | R2 Status |
|---|---|---|---|
| 1 | Partition lifecycle (creation, transfer, dissolution) | Met | **Met in spirit.** Now also handles TDD-pipeline rotation correctly and `time-bound` firing. |
| 2 | Late-arriving cross-partition renegotiation | Met with gaps | **Met in spirit.** Time-bound + tiebreaker added. |
| 3 | **Plan-as-Bypass head-on** | Met in letter, weak in spirit | **Met in letter and spirit.** Per-layer modality breakdown names what is and isn't mechanical; future tooling path (`create-summon` CLI) named with appropriate sprint-scope. R1's binding spirit-of-rule weakness — resolved. |
| 4 | "Considered and Rejected" subsection | Met with one missing | **Met in spirit.** Alt F added with steel-manned rejection. |
| 5 | **Pilot-before-broad-rollout** | Met with structural concern | **Met in letter and spirit.** Pilot rebalance gives partitions 1+2 a real coordination interface; criterion 3 counts correctly-fired renegotiation as PASS. R1's second binding spirit-of-rule weakness — resolved. |

All five constraints now met in letter and in spirit. Both R1-flagged spirit-of-rule weaknesses (constraints 3 and 5) are resolved.

---

## Final Verdict (Round 2)

**ACCEPT WITH AMENDMENTS.** All twelve amendments are already inline. There are no new must-change items, no new should-amend items, and no remaining round-2 blockers. The ADR is verification-clean.

**Condition (a) of ADR-0007 § Status Accept transition is now satisfied.** Remaining transition conditions:
- (b) Human approval — pending.
- (c) Named pilot work item passes the success criteria in § 8 — pending pilot execution during W2.2 implementation.
- (d) W2.1 rollout work (Phase 4 rewrite, ownership-map scaffold, Grace persona annotation) lands in-repo — pending W2.1.

Reopen conditions unchanged (per § Status): pilot failure on any criterion, OR Plan-as-Bypass detection signal firing in normal use during the first three post-acceptance work items.

---

## One-Paragraph Round-2 Briefing

ADR-0007 (Owned Partition Replaces Self-Claim Market) has passed Wei round-2 verification with verdict ACCEPT WITH AMENDMENTS — and all twelve amendments from round 1 are folded inline at the locations Archie cited in the Rework Notes. All four must-change items, seven should-amend items, and one cosmetic item satisfy what round 1 demanded; the two binding-constraint spirit-of-rule weaknesses (Plan-as-Bypass head-on, pilot-before-broad-rollout) are now met in spirit. Archie's three open questions for Wei (TDD-pipeline annotation strength, partition-priority tiebreaker semantics, named-interface registry deferral) are all resolved in Archie's favor. Condition (a) of ADR-0007's Accept transition is satisfied; conditions (b) human approval, (c) pilot success on W2.2 implementation, and (d) W2.1 rollout work landing remain. Next steps: route to human for approval; then proceed with W2.1 rollout (Phase 4 rewrite, ownership-map scaffold at `docs/scaffolds/ownership-map.md`, Grace persona-file annotation), with the pilot scheduled to execute during W2.2 implementation after W2.2's ADR is accepted.
