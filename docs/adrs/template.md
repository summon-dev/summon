---
agent-notes: { ctx: "ADR template for architectural decisions", deps: [CLAUDE.md], state: canonical, last: "diego@2026-08-07" }
---

<!--
  Fill in what applies; delete what doesn't, including these comments.

  An ADR is a record for someone who was not there — a future human or agent who
  needs to understand what was decided, the forces that produced it, what else was
  on the table, and why those were rejected. Write it in the present tense, as a
  standing description of the decision, not as a report on the meeting that reached it.

  What does not belong: how this document itself was written or revised. No "an
  earlier draft said X", no "reviewer Y objected so I changed Z", no round-by-round
  dispositions of a gate, no narration of the authoring agent's relationship to the
  text. That is authorship exhaust. It reads as substance because it is true and it
  is recent, and it is exactly what a reader five months out has to skim past.

  Gate provenance belongs in Status as one or two sentences plus a pointer to the
  debate record in docs/history/tracking/ — never as inlined dispositions.
  ADR-0007 and ADR-0012 do this correctly; follow them.
-->

# ADR-NNNN: <Title>

## Status

Proposed | Accepted | Deprecated | Superseded by [ADR-NNNN](./NNNN-title.md)

<!--
  One line of state. If the decision went through an architecture gate, add one or
  two sentences naming the outcome and linking the debate record in
  docs/history/tracking/ — e.g. "Ratified after a two-round gate; the full
  challenge-and-response is in docs/history/tracking/<file>.md."

  That link is where dispositions live. Reproducing them here turns a decision
  record into a transcript.
-->

## Context

What is the issue that we're seeing that is motivating this decision or change?

<!--
  The forces, as they stand: the constraint, the pressure, the thing that broke, the
  capability that doesn't exist yet. Enough that a reader can re-derive the decision
  rather than take it on trust.

  Where a rule ends up phrased oddly to prevent a specific failure, keep the reason —
  a reader who can't see why will simplify it back into the defect it prevents. State
  it timelessly ("the field is machine-checked because prose in a return contract
  becomes a channel for unverifiable claims"), not as the story of the day it was
  found ("during review we discovered...").
-->

## Decision

What is the change that we're proposing and/or doing?

## Alternatives Considered

<!--
  The options that were not taken, each with the reason it lost. This section is
  decision content and it is mandatory in substance — an ADR whose alternatives are
  missing has recorded a preference, not a decision, and the next person to hit the
  same fork re-litigates it from scratch.

  Careful with the "no authorship narrative" rule above — it is easy to over-apply
  and delete this section. The rejected option stays; the chronology of when and by
  whom it was rejected goes. Two phrasings of the same fact:

    Keep:  "Strict JSON was considered and rejected: the emitters can't guarantee
            fence-free output, so every consumer would need a repair path anyway."
    Cut:   "An earlier draft specified strict JSON; a reviewer objected in round 2
            and it was changed."

  The first is a fact about the problem. The second is the same fact as autobiography.

  One option per subsection or bullet: what it was, why it lost. If an option is
  merely deferred rather than rejected, say which condition would revive it.
-->

-

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive

-

### Negative

-

### Neutral

-
