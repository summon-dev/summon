---
agent-notes: { ctx: "feature-spec artifact between ADR and TDD", deps: [docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0002-tdd-workflow.md, docs/methodology/phases.md, docs/process/done-gate.md, docs/tracking/2026-05-02-adr0004-feature-spec-debate.md, docs/tracking/2026-05-02-adr0004-feature-spec-debate-round2.md], state: proposed, last: "claude@2026-05-02" }
---

# ADR-0004: Feature-Spec Artifact Between ADR and TDD

## Status

**Proposed (Shadow-Pilot phase)** 2026-05-02. Rework following Wei's REWORK verdict ([round 1 debate](../tracking/2026-05-02-adr0004-feature-spec-debate.md)); Wei round 2 verdict ACCEPT WITH AMENDMENTS ([round 2 debate](../tracking/2026-05-02-adr0004-feature-spec-debate-round2.md)) with six wording amendments folded in.

**Transition to Accepted requires both:** (a) W1.3 shadow-pilot success criteria pass (see § Pilot Plan), AND (b) W1.1 (Done Gate amendment for "spec link present for M+ items") lands. Until both conditions hold, the size carve-out is not enforced for general M+ work; only the named shadow-pilot item is bound.

**Hard backstop (active on this ADR's acceptance, independent of W1.1):** Tara MUST refuse to author tests for any M+ item that has no spec link. This rule is added to the Tara workflow on acceptance and survives any slip in W1.1.

**Honor-system mitigation during the Shadow-Pilot phase:** the Tara backstop assumes Tara is invoked. During the pre-W1.1 window, the human (or the coordinator in proxy mode) is responsible for confirming Tara is invoked on M+ items, starting with the W1.3 shadow-pilot. The honor-system gap closes when W1.1's Done Gate amendment lands.

## Context

ADR-0003 commits Summon to a spec-driven spine: ADRs commit to *direction*; a feature spec commits to *outcomes, constraints, tasks, and verification* and becomes the executable contract for TDD. The umbrella does not specify the spec's schema, lifecycle, ownership, or applicability rules. This ADR makes those decisions and nothing more.

Two umbrella-level constraints govern this ADR: (a) the spec must be a strictly additive artifact, not a paraphrase of ADRs, tests, or acceptance criteria — duplication is what makes Wei's "next bypass-able heavyweight artifact" concern (Plan-as-Bypass, `docs/process/gotchas.md` line 67) real; (b) the spec must carve out sizes where it adds no value, so the artifact does not become process tax on small items.

## Decision

### 1. Schema

The feature spec contains exactly six sections; no more, no fewer.

| Section | Content | Distinct from |
|---|---|---|
| **Outcomes** | User-observable end state in 1-3 sentences. "When this ships, X will be true." | ADR's *direction*. |
| **Scope (in/out)** | Explicit in-scope items; explicit out-of-scope items the reader might assume are included. **Each Scope bullet MUST cite the specific acceptance criterion (by ID or quoted phrase) it bounds.** A Scope bullet that cannot cite an AC is a signal the AC is missing or the bullet is paraphrase, and Tara returns the spec. | Acceptance criteria. |
| **Constraints** | Non-negotiable limits: performance, compatibility, dependencies, deadlines, sequencing rules with other items. | ADRs (cross-item architectural constraints). |
| **Key Decisions** | Item-local choices not warranting an ADR. One line each, with rationale. **Each Key Decision MUST cite the ADR it sits below (by number), OR explicitly declare "no ADR applies because…" with a one-sentence rationale.** A Key Decision with neither citation nor declaration is non-conformant and Tara returns the spec. Citations MAY reference Proposed (not-yet-Accepted) ADRs with the suffix `(Proposed as of YYYY-MM-DD)`; if the cited ADR is amended at Acceptance, the spec author MUST revisit the citation and amend if the change affects the Key Decision. | ADRs (cross-cutting direction). |
| **Task Breakdown** | Ordered list of concrete steps to implement, sized so each maps to one TDD red-green-refactor cycle. | Tests (behavior, not work order). |
| **Verification Plan** | How we will know each outcome holds: which tests, which manual check, which metric, which user flow. References the test files Tara will author. | Acceptance criteria (the spec proves them; it does not restate them). |

The citation requirements convert the Scope-vs-AC and Key-Decisions-vs-ADRs distinctions from prose guidance into mechanical checks Tara can verify by inspection. A spec that cannot be filled in without copying from an ADR or restating acceptance criteria is a signal the work item does not need a spec — see size carve-out.

### 2. Lifecycle

1. **Authored** at the start of Phase 3 (Implementation) for items requiring a spec, after Architecture but before Tara's red phase.
2. **Coherence-reviewed** by Cam *after* the spec is authored and *before* Tara's verifiability gate — i.e., between Lifecycle step 1 and Tara's red-phase entry. **This is a second touch from Cam at the Architecture→Implementation seam, not the earlier Phase 1→2 Discovery handoff.** Cam pressure-tests spec-vs-AC drift: do Outcomes and Scope reflect the same intent the AC captured, or have they silently shifted? Cam returns the spec for redraft if drift is present. Single review pass; no new agent.
3. **Becomes canonical** when the human (or Pat in proxy mode for non-architectural items) confirms it. Tara's tests reference the canonical spec.
4. **Amended** by appending a dated `## Amendment YYYY-MM-DD` section, never by silent edit. Amendments require the same approval as authoring.
5. **Retired** when the work item closes. Spec preserved in-repo for traceability; agent-notes `state` flips to `canonical`.

### 3. Ownership

**Pat authors the spec; Cam reviews for spec-vs-AC coherence; Archie reviews when objective triggers fire or when the spec touches an ADR's surface; Tara confirms verifiability before implementation begins.**

The author/reviewer split rests on three independent merits, each standing on its own:

- **Pat already owns acceptance criteria and product context.** Authoring Outcomes, Scope, and Verification Plan is a natural extension of work Pat already does; no new ownership boundary is invented.
- **Tara already owns verification.** Confirming the Verification Plan is sufficient is the same lens Tara applies in red-phase test design — the gate is already in Tara's mandate.
- **Sato already owns implementation.** Excluding Sato from authorship preserves spec-as-contract: Sato implements *against* the spec rather than *defining* the spec they then implement, which is the same separation that makes Tara-writes-tests / Sato-writes-code work in ADR-0002.

**Cam's coherence pass** addresses the same-author drift hazard that Pat-writes-AC + Pat-writes-spec creates. Cam already pressure-tests intent during Discovery and is the natural non-Pat reviewer for "does the spec say what the AC meant?" One review pass, no new agent on the roster.

**Archie's review trigger** has both an objective minimum and a judgment overlay:

- **Objective triggers (mandatory):** any Key Decision touching cross-component interfaces, persistence, security, or external dependencies MUST be reviewed by Archie. Pat flags these on authoring; if Pat misses one, Cam or Tara catches it on their pass.
- **Judgment trigger:** if any reviewer believes the spec touches an ADR's surface for any other reason, Archie reviews.
- **Escalation:** if Archie deems any Key Decision architectural rather than item-local, the spec stalls and a new ADR is opened. The work item halts until that ADR is Accepted. There is no "Archie noted this and we proceeded" path; either the decision is item-local (stays in spec) or it is architectural (opens an ADR).

This gives the soft gate hard teeth without requiring exhaustive trigger lists, and prevents the architecture-gate-bypass pattern (gotchas.md line 69) from relocating into the spec layer.

### 4. Size Carve-Out

| Size | Spec status | Rationale |
|---|---|---|
| **XS** | **Forbidden** | Single-file or single-line changes. Commit message + test diff is sufficient executable contract. |
| **S** | **Optional** (default off) | Bounded changes (one component, one endpoint). S sits in a genuinely ambiguous middle: most S items need no spec, but a tail of cross-component-fitting-in-one-file refactors legitimately benefit. Default off avoids tax on the common case; opt-in preserves the legitimate cases. **Opt-in requires audit trail:** the work item description must include a one-line rationale (e.g., "scope ambiguity surfaced in discovery"), and Pat + Tara must record sign-off on that rationale. Without both, the spec is non-conformant. |
| **M** | **Required** | Multi-file changes typically span 2-4 task-breakdown steps and benefit from explicit scope and decision provenance. The boundary is inherited from ADR-0002's Tara-as-standalone-agent threshold, which is administratively economical but not independently validated for *spec* fitness. The pilot tests this boundary explicitly (see § Pilot Plan). |
| **L** | **Required** | Multi-component or cross-cutting changes. Risk of scope drift is high; spec is the brake. |
| **XL** | **Required, with mandatory decomposition review** | An XL item must be re-examined for whether it should split into multiple M/L items. If it stays XL, Pat + Archie + Grace jointly review the task breakdown. |

The XS carve-out reflects that for the smallest items, ADR + tests + acceptance criteria already form a complete executable contract. The M boundary is provisional; pilot evidence may move it to L.

### 5. Relationship to Existing Artifacts

The spec is **strictly additive**. Each artifact has a unique purpose:

- **ADR (above the spec)**: cross-cutting *direction*. Specs *cite* ADRs, never restate them.
- **Tests (below the spec)**: executable *behavioral assertions*. The Verification Plan lists which tests cover which outcomes; it does not contain test code.
- **Acceptance Criteria (parallel)**: *what must be true* on done. The spec's Outcomes section says *what user-observable end state*; Scope says *boundaries*; Verification Plan says *how we'll prove it*. ACs are quoted by reference, not copied.
- **Agent-notes (file metadata)**: *per-file* purpose. Specs are *per-work-item*. No overlap.

A spec that copies content from any of these is non-conformant and Tara returns it before red phase.

### 6. Storage and Naming

- **Location**: `docs/specs/<work-item-id>-<slug>.md`. One file per work item.
- **Naming**: `<work-item-id>-<short-slug>.md` (e.g., `W1.3-harness-contract.md`).
- **Discovery**: indexed in `docs/code-map.md` under a new "Active Specs" section (Diego maintains; spec author registers on creation).
- **Template**: `docs/scaffolds/feature-spec.md` (created post-acceptance, not in this ADR).
- **Agent-notes**: required, with `state: draft` until canonical, `state: active` while implementation runs, `state: canonical` once retired.

## Pilot Plan

ADR-0003 § Rollout requires pilot-before-broad-rollout; ADR-0003 § Halt-Points forbids Wave 2 starting until all of Wave 1 is Accepted. A pilot drawn from Wave 2 is therefore structurally impossible — by the time Wave 2 starts, this ADR is already Accepted and binding on every M+ item in that wave. The prior draft's W2.2 pilot violated this halt rule.

**Resolution: shadow-pilot on a Wave 1 work item.** A current-sprint Wave 1 item is selected; the spec is authored, coherence-reviewed by Cam, verifiability-reviewed by Tara, and post-mortem'd — but the existing pre-ADR-0004 process *still* gates the work. The shadow run produces real signal (does the spec add value? does it duplicate ACs? does Cam's coherence pass catch real drift?) without violating the halt rule.

**Pilot work item: W1.3 (Harness Contract + Cross-Session Progress Note).** Selected because:
- It is M-sized, multi-file, has an ADR being authored above it (ADR-C), and has substantive cross-component decisions (progress-note schema, `/handoff` command shape) that would naturally populate Key Decisions.
- It is *not* this ADR's own implementation work (W1.1), which would be self-referential and would not test whether the spec adds value over re-reading the ADR.
- It is not S-sized like W1.2, which would be forbidden a spec by this ADR's own carve-out.
- A spec failure on W1.3 is recoverable inside Wave 1 and triggers ADR-0003 § Rollback cleanly.

**Pilot success criteria:**
1. The spec is written in under 30 minutes by Pat.
2. Cam's coherence pass either accepts on the first pass or surfaces concrete spec-vs-AC drift (either is signal).
3. Tara accepts the Verification Plan without a return-for-sharpening cycle.
4. Implementation closes without a spec amendment.
5. Post-mortem confirms the spec did not paraphrase ADR-C or W1.3's acceptance criteria; every Scope bullet's AC citation is verifiable; every Key Decision's ADR citation or "no ADR applies" declaration holds up.
6. **Archie reviews any Key Decision flagged as touching cross-component interfaces — which the W1.3 harness/progress-note shape will be by construction.** If Archie escalates per § Ownership, the spec stalls and ADR-C absorbs the decision rather than the spec. This criterion exists specifically to prevent the W1.3 spec from absorbing ADR-C decisions before ADR-C is debated (the same pre-commitment anti-pattern this ADR's rework eliminated for itself).

Failure on (2)–(6) reopens this ADR per ADR-0003 § Rollback.

**Boundary coverage caveat:** a single M item cannot test whether the M-vs-L boundary is correctly placed. **If a Wave 1 L item becomes available before broad rollout, it is added to the pilot.** Wave 1 contains no L item today, so this cannot be guaranteed; the post-mortem MUST log "boundary fitness not yet tested at L; deferred to first L item under broad rollout" as an explicit follow-up question, and that item's spec is treated as continuing-pilot evidence.

**Broad application gate:** size carve-out is enforced for all M+ items only after (a) shadow-pilot success criteria pass, AND (b) W1.1 lands the Done Gate amendment.

## Considered and Rejected

### Alternative A: Do nothing — keep relying on ADR + tests + acceptance criteria

**The argument**: Tara's red phase is already the executable contract. ACs already pin down behavior. ADRs already capture cross-cutting direction. A spec adds a fourth artifact whose sections paraphrase the other three.

**Why rejected**: correct for XS, partially correct for S, wrong for M+. At M+, the spec fills two specific gaps neither tests, ADRs, nor ACs cover: **scope provenance** (what was deliberately excluded — invisible in any test suite or AC list) and **item-local decision provenance** (which library at this call site, which error shape — too granular for an ADR, not a behavior to test). The Schema's citation requirements (every Scope bullet → AC, every Key Decision → ADR or "no ADR applies because…") make those gaps mechanically auditable; if a section can be filled only by paraphrasing existing artifacts, the citation requirement fails and the spec is rejected. The XS/S carve-out concedes Alternative A exactly where it holds.

**Residual risk**: the carve-out becomes the bypass — implementers size everything S to skip the spec. Mitigation: Grace owns sizing; sizing audit is part of pilot post-mortem; if down-sizing emerges, this ADR reopens.

### Alternative B: Spec is mandatory at all sizes

**Why rejected**: Plan-as-Bypass becomes inevitable. Implementers paste boilerplate at XS, the spec becomes ceremonial, the gate teaches the team that process is theater. The XS carve-out is non-negotiable.

### Alternative C: Spec replaces acceptance criteria

**Why rejected**: ACs live on the work-item tracker and are visible to non-coding stakeholders; the spec is in-repo and aimed at implementing agents. Different audiences, different lifecycles. Conflating them deletes a stakeholder-visible surface.

### Alternative D: Sato authors the spec (not Pat)

**Why rejected on standalone grounds**: Sato authoring the spec collapses authorship and implementation into the same agent, which weakens the spec-as-contract role. The spec exists precisely to be a contract Sato implements *against*; if Sato writes it, the contract has no independent author and the same-author blind spot ADR-0002 avoided for tests (Tara writes tests, not Sato) reappears one layer up. Pat as author preserves the authorship/implementation separation that makes the spec a contract rather than a self-brief.

## Consequences

### Positive

- M+ items get an explicit, single-source statement of scope and item-local decisions, eliminating "I thought that was out of scope" reopen cycles.
- Citation requirements make the additive-vs-paraphrase distinction mechanically checkable rather than vibe-checked.
- Cam's coherence pass catches spec-vs-AC drift at the cheapest moment (before Tara writes tests).
- Archie's escalation path closes the architecture-gate-bypass loophole at the spec layer.
- The shadow-pilot pattern preserves ADR-0003's halt rule while still delivering real pilot evidence.

### Negative

- Adds an artifact and an authoring step to every M+ item; throughput drops on those items until the handshake is routine.
- Cam gains a serialized pass between authoring and Tara's gate; for items where Cam is busy elsewhere this is a new bottleneck. Mitigation: the human can substitute for Cam in proxy mode.
- Size-classification pressure: implementers may down-size to S to skip the spec. Sizing audit in pilot post-mortem; reopen if persistent.
- Pat becomes a serialized dependency for M+ items; if Pat is unavailable, work blocks. Mitigation: in proxy mode the human authors or approves directly.
- M-boundary fitness is not validated by this ADR; the boundary is provisional and may move to L based on pilot evidence.
- Until W1.1 lands, the Done-Gate enforcement leans on Tara's pre-condition rule; if Tara is bypassed, the rule has no automated catch.

### Neutral

- The Done Gate gains "spec link present for M+ items" only when W1.1 lands. Until then, Tara's pre-condition (refuses to author tests without a spec link) is the gate.
- The phase model is unchanged in shape; the spec sits at the Architecture→Implementation seam.
- The spec template itself is a downstream deliverable.
- Pilot results may amend any of the six decisions above; structure is stable, parameters are not.
- **First L item under broad rollout is treated as continuing-pilot evidence for the M-vs-L boundary fitness question (see § Pilot Plan).** Failure on that item — defined as the spec being unable to satisfy citation requirements without paraphrase, OR Tara rejecting Verification Plan, OR the spec needing amendment mid-implementation — reopens § Size Carve-Out per ADR-0003 § Rollback. The post-mortem of this first L item is the named consumer of the deferred boundary-fitness signal.

## Rework Notes

### Round 1 Rework (2026-05-02, Archie)

Reworked following Wei's Round 1 REWORK verdict. Each finding addressed:

1. **Challenge 6 (planner/generator/evaluator pre-commitment)** — the parenthetical in § Ownership is deleted. Pat-authors / Tara-validates / Sato-implements is now justified on three standalone merits (Pat owns AC, Tara owns verification, Sato owns implementation). Alternative D's rejection is re-justified on standalone grounds: Sato authoring collapses authorship and implementation, weakening spec-as-contract. The harness mapping is not mentioned anywhere in the ADR.
2. **Challenge 7 (W2.2 pilot impossibility)** — the W2.2 pilot is replaced with a shadow-pilot on **W1.3 (Harness Contract)**. W1.3 is selected with named criteria (M-sized, cross-component, has ADR above, not self-referential, not S). The shadow runs alongside the existing process; pilot success criteria are explicit.
3. **Challenge 8 (no enforcement hook)** — § Status now reads "Accepted, broad rollout gated on W1.1 landing"; until then, shadow-pilot only. Tara's hard-backstop pre-condition (refuses to author tests for M+ items with no spec link) is added as a workflow rule independent of the Done Gate amendment.
4. **Challenge 3 (semantic three-pillar distinction)** — Schema now requires Scope bullets to cite ACs and Key Decisions to cite ADRs (or declare "no ADR applies because…"). Tara checks citations mechanically.
5. **Challenge 4 (Pat same-author drift)** — Cam added as coherence reviewer at the discovery handoff, before Tara's gate. Single pass, no new agent.
6. **Challenge 5 (Archie soft gate)** — § Ownership names the objective trigger list (cross-component interfaces, persistence, security, external dependencies) and adds the escalation: Archie deeming a Key Decision architectural stalls the spec, opens an ADR, halts the work item.
7. **Challenge 1 (M boundary inherited)** — § Pilot Plan adds L-item coverage when one becomes available; the post-mortem MUST log boundary-fitness-at-L as a follow-up if no L item exists in Wave 1.
8. **Challenge 2 (XS-forbidden vs S-optional asymmetry)** — § Size Carve-Out defines "explicit justification" for opt-in S specs: one-line rationale in the work item description, plus Pat + Tara recorded sign-off. Without both, non-conformant.

### Round 2 Amendments (2026-05-02, applied inline post-Wei round 2 ACCEPT WITH AMENDMENTS verdict)

Six wording-grade amendments folded in without spawning Archie again (Wei explicitly noted no further full Wei round required):

1. **§ Status** rephrased as "Proposed (Shadow-Pilot phase)" with explicit Accept-transition conditions, replacing the compound "Accepted, broad rollout gated on…" status that didn't fit the standard taxonomy.
2. **§ Status** gained the honor-system enforcer paragraph: human or coordinator confirms Tara is invoked on M+ items during the pre-W1.1 window.
3. **§ Lifecycle step 2** rewrote Cam timing to "after the spec is authored and before Tara's verifiability gate" with explicit note that this is a *second* Cam touch, not the Phase 1→2 Discovery handoff.
4. **§ Schema (Key Decisions row)** added that citations may reference Proposed (not-yet-Accepted) ADRs with a follow-up obligation if the cited ADR is amended at Acceptance.
5. **§ Pilot Plan** added a sixth pilot success criterion: Archie reviews W1.3 cross-component Key Decisions to prevent the spec from absorbing ADR-C decisions before ADR-C is debated.
6. **§ Consequences (Neutral)** added the continuing-pilot trigger: first L item under broad rollout is the named consumer of the deferred boundary-fitness signal; failure on that item reopens § Size Carve-Out.
