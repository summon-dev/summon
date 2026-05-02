<!-- agent-notes: { ctx: "template for per-work-item feature spec (canonical lives at docs/specs/<id>-<slug>.md)", deps: [docs/adrs/0004-feature-spec-artifact.md, docs/methodology/phases.md, docs/process/done-gate.md], state: template, last: "claude@2026-05-02" } -->

# Feature Spec Template

> **This file is the template.** Per [ADR-0004 § 6 Storage and Naming](../adrs/0004-feature-spec-artifact.md#6-storage-and-naming), the canonical spec lives at `docs/specs/<work-item-id>-<slug>.md` (e.g., `docs/specs/W1.3-harness-contract.md`). One file per work item.
>
> **Schema is binding.** The spec contains exactly six sections — no more, no fewer — per [ADR-0004 § 1](../adrs/0004-feature-spec-artifact.md#1-schema). Citation requirements convert section distinctions into mechanical checks Tara verifies before the red phase.

---

## When you need a spec

Per [ADR-0004 § 4 Size Carve-Out](../adrs/0004-feature-spec-artifact.md#4-size-carve-out):

| Size | Spec status |
|---|---|
| **XS** | Forbidden — commit message + test diff is sufficient |
| **S** | Optional, default off; opt-in requires one-line rationale + Pat + Tara sign-off |
| **M** | Required |
| **L** | Required |
| **XL** | Required + Pat + Archie + Grace decomposition review |

If you cannot fill a section without paraphrasing an ADR, an AC, or a test, the work item likely does not need a spec.

---

## Header (required)

```yaml
---
agent-notes:
  ctx: "<work-item title in 6-10 words>"
  deps: [<ADRs cited>, <ACs cited>, <related specs>]
  state: draft   # -> active when canonical -> canonical when retired
  last: "<author>@<YYYY-MM-DD>"
work-item: <ID, e.g., W1.3>
size: <XS | S | M | L | XL>
author: <Pat | <coordinator-in-proxy-mode>>
canonical-on: <YYYY-MM-DD when human/proxy confirms; "draft" before then>
---
```

---

## 1. Outcomes

> User-observable end state in 1–3 sentences. "When this ships, X will be true." Distinct from the ADR's *direction*.

- _Example:_ "When this ships, every cross-session handoff is a structured progress note that the resuming session can read in under five minutes, and `/handoff` mechanically refuses malformed notes before write."

---

## 2. Scope (in / out)

> Explicit in-scope items; explicit out-of-scope items the reader might assume are included.
>
> **Citation rule:** Each Scope bullet MUST cite the specific acceptance criterion it bounds (by AC ID or quoted phrase). A Scope bullet that cannot cite an AC is a signal the AC is missing or the bullet is paraphrase, and **Tara returns the spec**.

### In scope

- _Example:_ Replace `.claude/handoff.md` with `.claude/progress-note.md`. *(cited: AC "Structured progress-note schema documented … template at `docs/scaffolds/progress-note.md`")*
- _Example:_ Refusal conditions in `/handoff`. *(cited: AC "`/handoff` command updated to emit this schema with mechanical refusal conditions")*

### Out of scope

- _Example:_ Editing `personas.md`. *(cited: ADR-0006 § Persona-Role Mapping → "What this means for personas.md: Nothing — by intent.")*
- _Example:_ Wave 2 mechanics. *(cited: ADR-0003 § Halt-Points)*

---

## 3. Constraints

> Non-negotiable limits: performance, compatibility, dependencies, deadlines, sequencing rules with other items. Distinct from cross-item architectural constraints (those are ADRs).

- _Example:_ Cross-session continuity must not regress — sessions must still resume from the prior state without manual reconstruction.
- _Example:_ Sequencing — must precede W1.1's pilot post-mortem because W1.3 is the pilot vehicle.
- _Example:_ No new dependencies; the schema is plain Markdown.

---

## 4. Key Decisions

> Item-local choices not warranting an ADR. One line each, with rationale.
>
> **Citation rule:** Each Key Decision MUST cite the ADR it sits below (by number), OR explicitly declare `no ADR applies because <one-sentence rationale>`. A Key Decision with neither citation nor declaration is non-conformant and **Tara returns the spec**.
>
> Citations MAY reference Proposed (not-yet-Accepted) ADRs with the suffix `(Proposed as of YYYY-MM-DD)`; if the cited ADR is amended at Acceptance, revisit the citation and amend if the change affects the decision.
>
> If Archie deems any Key Decision architectural rather than item-local, the spec stalls and a new ADR is opened. The work item halts until that ADR is Accepted (per ADR-0004 § Ownership escalation).

- _Example:_ "Use a YAML-style header rather than full frontmatter to keep the file Markdown-renderable." *(cited: no ADR applies because file-format choice is item-local cosmetic)*
- _Example:_ "Prior-note-commit hash sourced via `git log -1 --format=%H -- .claude/progress-note.md`." *(cited: ADR-0006 § 1 Schema; no separate ADR)*

---

## 5. Task Breakdown

> Ordered list of concrete steps, each sized so it maps to one TDD red-green-refactor cycle. Distinct from tests — task breakdown is *work order*, tests are *behavioral assertions*.

1. _Example:_ Create `docs/scaffolds/progress-note.md` template with header + five sections.
2. _Example:_ Rewrite `.claude/commands/handoff.md` to emit the schema and enforce refusal conditions.
3. _Example:_ Update `.claude/commands/resume.md` to consume the new schema.
4. _Example:_ Add Phase 7 documentation overlay in `phases.md`.
5. _Example:_ Cutover `.claude/handoff.md` to redirect line.

---

## 6. Verification Plan

> How we will know each Outcome holds: which tests, which manual check, which metric, which user flow. References test files Tara will author. Distinct from acceptance criteria — the spec *proves* them; it does not restate them.

- _Example:_ Outcome 1 (structured handoff) — manual: write a session-end progress note, confirm all six refusal conditions can be triggered.
- _Example:_ Outcome 1 (under-five-minute resume) — manual: time the next session's `/resume` from start to "Ready to pick up" prompt.
- _Example:_ Mechanical refusal — assertion that `/handoff` command file documents all six refusal conditions verbatim.

---

## Amendments

> Append-only. Never edit prior content silently. Each amendment requires the same approval as authoring (per ADR-0004 § Lifecycle step 4).

### Amendment YYYY-MM-DD — _summary_

_What changed and why. Approved by: <human | Pat-in-proxy>._

---

## Spec-vs-Other-Artifacts Self-Check

Before submitting this spec for Cam's coherence pass and Tara's verifiability pass, confirm:

- [ ] No section copies content from an ADR; ADRs are *cited*, never restated.
- [ ] No section copies tests; the Verification Plan lists *which* tests, not test code.
- [ ] No section restates acceptance criteria; ACs are *quoted by reference* in Scope.
- [ ] Every Scope bullet cites an AC.
- [ ] Every Key Decision cites an ADR or declares "no ADR applies because…".
- [ ] Author is Pat (or human/coordinator in proxy mode); Sato has not authored the spec.
- [ ] If size is S, the work-item description includes a one-line opt-in rationale and Pat + Tara have recorded sign-off.
- [ ] If size is XL, decomposition review with Pat + Archie + Grace is logged.
