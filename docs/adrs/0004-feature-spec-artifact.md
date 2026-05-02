---
agent-notes: { ctx: "feature-spec artifact between ADR and TDD", deps: [docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0002-tdd-workflow.md, docs/methodology/phases.md, docs/process/done-gate.md], state: proposed, last: "archie@2026-05-02" }
---

# ADR-0004: Feature-Spec Artifact Between ADR and TDD

## Status

**Proposed** 2026-05-02. Pending Wei challenge and human approval. Follows ADR-0003 § Decision item 2 ("Specs become the spine between Architecture and Implementation") and the ADR-A row in the follow-on table.

## Context

ADR-0003 commits Summon to a spec-driven spine: ADRs commit to *direction*; a feature spec commits to *outcomes, constraints, tasks, and verification* and becomes the executable contract for TDD. The umbrella does not specify the spec's schema, lifecycle, ownership, or applicability rules. This ADR makes those decisions and nothing more.

Two umbrella-level constraints govern this ADR: (a) the spec must be a strictly additive artifact, not a paraphrase of ADRs, tests, or acceptance criteria — duplication is what makes Wei's "next bypass-able heavyweight artifact" concern (Plan-as-Bypass, `docs/process/gotchas.md` line 67) real; (b) the spec must carve out sizes where it adds no value, so the artifact does not become process tax on small items.

## Decision

### 1. Schema

The feature spec contains exactly six sections; no more, no fewer. The first ADR-0003 enumeration is ratified as authoritative.

| Section | Content | Distinct from |
|---|---|---|
| **Outcomes** | User-observable end state in 1-3 sentences. "When this ships, X will be true." | ADR's *direction* (which constrains *how*, not *what success looks like to a user*). |
| **Scope (in/out)** | Explicit in-scope items; explicit out-of-scope items the reader might assume are included. | Acceptance criteria (which assert *behavior*, not *boundaries*). |
| **Constraints** | Non-negotiable limits: performance, compatibility, dependencies, deadlines, sequencing rules with other items. | ADRs (which set architectural constraints across many items, not item-local ones). |
| **Key Decisions** | Item-local choices not warranting an ADR (library X over Y at the call-site, error-shape choice, retry policy). One-line each with rationale. | ADRs (which set cross-cutting direction). If a key decision turns out to be cross-cutting, it gets escalated to an ADR. |
| **Task Breakdown** | Ordered list of concrete steps to implement, sized so each maps to one TDD red-green-refactor cycle. | Tests (which assert behavior, not work order). |
| **Verification Plan** | How we will know each outcome holds: which tests, which manual check, which metric, which user flow. References the test files Tara will author. | Acceptance criteria (which are *what* must be true; verification plan is *how we'll prove it*). |

A spec that cannot be filled in without copying from an ADR or restating acceptance criteria is a signal the work item does not need a spec — see size carve-out.

### 2. Lifecycle

1. **Authored** at the start of Phase 3 (Implementation) for items requiring a spec, after Architecture but before Tara's red phase.
2. **Becomes canonical** when the human (or Pat in proxy mode for non-architectural items) confirms it. Tara's tests reference the canonical spec.
3. **Amended** by appending a dated `## Amendment YYYY-MM-DD` section, never by silent edit. Amendments require the same approval as authoring.
4. **Retired** when the work item closes. The spec is preserved in-repo for traceability; `state` in agent-notes flips to `canonical` (frozen historical record).

### 3. Ownership

**Pat authors the spec; Archie reviews if the spec touches an ADR's surface; Tara confirms verifiability before implementation begins.**

Pat already owns acceptance criteria and product context, which makes them the natural author for outcomes, scope, and verification plan. Archie reviews the *Constraints* and *Key Decisions* sections to confirm nothing item-local has silently absorbed an architectural decision. Tara reads the *Verification Plan* and either confirms the listed tests are sufficient or returns the spec for sharpening — no green-light from Tara, no red phase. This three-agent loop is intentional: it mirrors the planner/generator/evaluator shape ADR-C will formalize, without pre-empting that ADR's persona mapping.

### 4. Size Carve-Out

| Size | Spec status | Rationale |
|---|---|---|
| **XS** | **Forbidden** | Single-file or single-line changes. The commit message and the test diff are sufficient executable contract. A spec here would paraphrase the test and degrade signal-to-noise. |
| **S** | **Optional** (default off) | Bounded changes (one component, one endpoint). Acceptance criteria + TDD red phase already pin down behavior. A spec is permitted only when the author explicitly justifies it (e.g., "scope ambiguity emerged in discovery"). |
| **M** | **Required** | Multi-file changes typically span 2-4 task-breakdown steps and benefit from explicit scope boundaries. This is the size where Tara is already invoked as a standalone agent (ADR-0002), so adding spec authorship to the same handoff has low marginal cost. |
| **L** | **Required** | Multi-component or cross-cutting changes. Risk of scope drift is high; spec is the brake. |
| **XL** | **Required, with mandatory decomposition review** | An XL item must be re-examined for whether it should split into multiple M/L items. If it stays XL, the spec is required and Pat + Archie + Grace jointly review the task breakdown. |

The XS carve-out directly addresses Wei's Challenge 4: for the smallest items, ADR + tests + acceptance criteria already form a complete executable contract, and a spec adds noise. The cutoff at M tracks ADR-0002's existing M-or-larger Tara-as-standalone-agent boundary, so the spec lifecycle does not introduce a new size threshold to remember.

### 5. Relationship to Existing Artifacts

The spec is **strictly additive** to existing artifacts. Each artifact has a unique purpose:

- **ADR (above the spec)**: cross-cutting *direction*. Specs may *cite* ADRs in Constraints and Key Decisions, never restate them. If a spec needs to repeat an ADR's reasoning, the spec is wrong (or the ADR is missing).
- **Tests (below the spec)**: executable *behavioral assertions*. The Verification Plan lists which tests cover which outcomes; it does not contain test code.
- **Acceptance Criteria (parallel)**: *what must be true* on done. The spec's Outcomes section says *what user-observable end state*; Scope says *boundaries*; Verification Plan says *how we'll prove it*. Acceptance criteria are quoted in the spec by reference to the work item, not copied.
- **Agent-notes (file metadata)**: *per-file* purpose and dependencies. Specs are *per-work-item*, never per-file. No overlap.

A spec that copies content from any of these is non-conformant and Tara returns it before red phase.

### 6. Storage and Naming

- **Location**: `docs/specs/<work-item-id>-<slug>.md`. One file per work item. Co-located with other process docs, not nested under sprints (a spec may outlive its sprint via amendment).
- **Naming**: `<work-item-id>-<short-slug>.md`. Work item id matches whatever the active tracking adapter uses (`W1.1`, `#42`, `JIRA-123`).
- **Discovery**: Indexed in `docs/code-map.md` under a new "Active Specs" section (Diego maintains; spec author registers on creation).
- **Template**: `docs/scaffolds/feature-spec.md` (created post-acceptance, not in this ADR).
- **Agent-notes**: required, with `state: draft` until canonical, `state: active` while implementation runs, `state: canonical` once retired.

## Pilot Plan

Per ADR-0003 § Rollout ("Pilot-before-broad rollout"), this ADR ships with a single pilot before broad application.

**Pilot work item criteria**: an M-sized item from the current sprint that (a) is not itself an ADR, (b) has at least one cross-file change, (c) has acceptance criteria already drafted (so spec-vs-criteria duplication risk is testable), and (d) is not on the critical path of Wave 2 (so a failed pilot does not stall the wave plan).

**Concrete candidate**: W2.2 (single-writer hierarchy in Discovery and Debugging). It is M-sized, prose-heavy, has clear acceptance criteria, and a spec failure there is recoverable.

**Pilot success criteria**: (a) the spec is written in under 30 minutes, (b) Tara accepts the Verification Plan without a return-for-sharpening cycle, (c) implementation closes without a spec amendment, (d) post-mortem confirms the spec did not paraphrase the ADR or acceptance criteria. Failure on (b) or (d) reopens this ADR per ADR-0003 § Rollback.

**Broad application gate**: only after pilot success is the size carve-out enforced for all M+ items.

## Considered and Rejected

### Alternative A: Do nothing — keep relying on ADR + tests + acceptance criteria (Wei's Challenge 4, steel-manned)

**The argument**: Tara's red phase is already the executable contract. Acceptance criteria already pin down behavior. ADRs already capture cross-cutting direction. A feature spec adds a fourth artifact whose sections, on inspection, paraphrase the other three. The "executable contract" framing is just rebranding — tests are already executable. We will spend author-time on specs that get written, ignored, and rot.

**Why rejected**: The argument is correct for XS items, partially correct for S, and wrong for M+. At M+, the gap the spec fills is **scope and decision provenance**, neither of which lives in tests, ADRs, or acceptance criteria. Tests assert behavior but not boundaries (you cannot tell from a test suite what was deliberately excluded). ADRs cover cross-cutting direction but not item-local choices (which library at this call site, which error shape for this endpoint). Acceptance criteria assert *what must be true* but not *why this scope was chosen* or *what was deliberately deferred*. The spec's Scope, Key Decisions, and Task Breakdown sections are non-overlapping with all three other artifacts; they fill a real gap. The carve-out at XS/S concedes the steel-manned argument exactly where it holds.

**Residual risk**: the carve-out itself becomes the next bypass — implementers size everything S to skip the spec. Mitigation: Grace owns sizing (already), and a sizing audit is part of the pilot post-mortem. If sizing-down-to-skip emerges, this ADR is reopened per ADR-0003 § Rollback.

### Alternative B: Spec is mandatory at all sizes

**Why rejected**: Plan-as-Bypass becomes inevitable. Implementers will paste boilerplate or copy from acceptance criteria to satisfy the gate, the spec becomes ceremonial, the artifact rots, and the gate teaches the team that process is theater. The XS carve-out is non-negotiable.

### Alternative C: Spec replaces acceptance criteria

**Why rejected**: acceptance criteria live on the work-item tracker and are visible to non-coding stakeholders; the spec is in-repo and aimed at implementing agents. Different audiences, different lifecycles. Conflating them deletes a stakeholder-visible surface for a code-author-visible one.

### Alternative D: Sato authors the spec (not Pat)

**Why rejected**: this collapses planner and generator into the same agent, which is precisely the harness anti-pattern ADR-C will address. Pat-authors / Tara-validates / Sato-implements is the planner/evaluator/generator separation in miniature.

## Consequences

### Positive

- M+ items get an explicit, single-source statement of scope and item-local decisions, eliminating "I thought that was out of scope" reopen cycles.
- Tara's red phase starts with a verification plan rather than an interpretation of acceptance criteria, which reduces test-vs-intent drift.
- The spec gives Wei an inspectable target for adversarial review at Implementation entry, which currently relies on ad-hoc analysis of acceptance criteria.
- Pat's planning role gains a tangible artifact, which sets up ADR-C's planner/generator/evaluator mapping without pre-empting it.
- The XS/S carve-out preserves the lightweight feel of small changes — the artifact is sized to the work, not to the ceremony.

### Negative

- Adds an artifact and an authoring step to every M+ item; throughput on those items will drop until the spec template and the Pat-Tara handshake are routine.
- Creates a new size-classification pressure: implementers may down-size items to S to skip the spec. Mitigation is sizing-audit in pilot post-mortem; if the pressure persists, this ADR is reopened.
- Spec sections (especially Scope and Key Decisions) overlap with information that today lives in commit messages, PR descriptions, and ad-hoc design notes. Until those sources are pruned to defer to the spec, there will be transient duplication.
- A new directory (`docs/specs/`) and a new code-map section to maintain. Diego's load increases.
- Pat becomes a serialized dependency for M+ items; if Pat is unavailable, work blocks. Mitigation: in proxy mode the human can author or approve a spec directly; the dependency is on the *role*, not the *agent*.

### Neutral

- The Done Gate gains a new line item ("spec link present for M+ items"); implementation deferred to W1.1 acceptance work.
- The phase model is unchanged in shape; the spec sits at the Architecture→Implementation seam, not as a new phase.
- The spec template itself is a downstream deliverable, not part of this ADR.
- The pilot result may amend any of the six decisions above; the structure of this ADR is stable, the parameters are not.
