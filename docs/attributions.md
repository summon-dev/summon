---
agent-notes: { ctx: "third-party provenance record for adapted external material", deps: [CLAUDE.md, docs/process/doc-ownership.md], state: active, last: "claude@2026-08-04" }
---

# Attributions

Third-party material Summon has drawn on, and what was actually taken. Summon ships its canon into user projects via `npx summon-team`, so anything borrowed travels with it — this file travels too, and records what came from where.

**Owner:** Diego, with Pierrot on license terms.

## What belongs here

An entry is required whenever Summon carries a third party's **expression** — prose copied verbatim, or adapted closely enough that you could not have written it with the source closed. Ideas, vocabulary, and techniques carry no legal obligation (copyright does not cover procedures or methods), but we record notable ones anyway: Summon's whole argument is that decisions should be traceable, and "where did this rule come from?" is the same question as "who decided this?".

When adding an entry, also leave a one-line provenance note at the borrowing site, so a file that gets moved or copied downstream carries its own lineage.

## mattpocock/skills

- **Source:** <https://github.com/mattpocock/skills>
- **License:** MIT — Copyright (c) 2026 Matt Pocock
- **Reviewed at:** commit `2ab9580`
- **Nature of use:** ideas and conventions, re-expressed in Summon's own voice. No `SKILL.md` file is copied or vendored, verbatim or adapted.

| Summon file | Upstream source | What was taken | Fidelity |
|---|---|---|---|
| `docs/methodology/phases.md` § Phase 6 | `skills/engineering/diagnosing-bugs` | The feedback-loop entry gate (a named, already-run, red-capable command before any hypothesis), the minimise-before-hypothesising rule, and "no correct seam is itself the finding" | Idea, re-expressed |
| `.claude/agents/sato.md` § Debugging | `skills/engineering/diagnosing-bugs` | The ladder of loop constructions, loop-tightening criteria, tagged debug instrumentation, and ranked falsifiable hypotheses | Idea, re-expressed |
| `.claude/commands/plan.md` | `skills/engineering/wayfinder` | "Not Yet Specified" and "Out of Scope" as plan sections, and the sharpness test that separates them (can you *state* the question precisely, not answer it) | Concept, re-expressed |
| `docs/process/review-lenses.md` § Module Depth | `skills/engineering/codebase-design` | The deletion test, interface-as-test-surface, one-adapter-is-hypothetical, and depth-as-leverage | Concept, re-expressed |
| `docs/team-directives.md` (Diego) | `skills/productivity/writing-great-skills` | The no-op test for agent prose, and prompting the positive rather than the prohibition | Concept, re-expressed |
| `docs/team-directives.md` (Archie) | `skills/engineering/to-tickets` | Expand → migrate → contract sequencing for a wide refactor | Concept, re-expressed |

Summon's `docs/glossary.md` (ADR-0009) also originates from a 2026-07-07 audit of this repository's `domain-modeling` skill. That ADR adopted the glossary convention while rejecting the upstream file's name and placement; see `docs/history/tracking/2026-07-07-context-glossary-debate.md`.

**Not adopted, deliberately.** `git-guardrails-claude-code`, `setup-pre-commit`, and `wizard` were reviewed and declined — the first fails open when `jq` is absent, the second instructs unpinned dependency installs that contradict ADR-0010/0011, and the third writes live secrets to disk in plaintext. Upstream does not ship any of the three in its own plugin manifest either.

## Prior art acknowledged in canon

These shape Summon's methodology without any of their text being carried:

- **Eric Evans**, *Domain-Driven Design* — the ubiquitous-language glossary (ADR-0009).
- **John Ousterhout**, *A Philosophy of Software Design* — deep modules. Summon's Module Depth sub-lens deliberately rejects his lines-ratio definition of depth in favour of depth-as-leverage.
- **Michael Feathers**, *Working Effectively with Legacy Code* — the seam concept underlying the test-surface check.
