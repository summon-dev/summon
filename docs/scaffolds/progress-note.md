<!-- agent-notes: { ctx: "template for cross-session progress note (canonical lives at .claude/progress-note.md)", deps: [docs/adrs/0006-harness-contract.md, docs/adrs/0004-feature-spec-artifact.md, .claude/commands/handoff.md], state: template, last: "claude@2026-05-02" } -->

# Progress Note Template

> **This file is the template.** The canonical, in-flight progress note lives at `.claude/progress-note.md` and is written by the `/handoff` command at session end. Per [ADR-0006](../adrs/0006-harness-contract.md), the schema is binding — `/handoff` will refuse to write a non-conforming note. Use this template as a reference for structure and citation requirements.
>
> **Schema source of truth:** [ADR-0006 § 1 Progress-Note Schema](../adrs/0006-harness-contract.md#1-progress-note-schema).

---

## Header (mandatory)

```yaml
session-date: 2026-05-02            # YYYY-MM-DD
author: coordinator                 # coordinator | cam | <agent-name-in-proxy-mode>
prior-note-commit: 7e5946c          # git hash of prior progress note, or "none" for first session
```

---

## State

> What is true *right now* in the workspace. Each claim MUST cite the artifact it was read from (commit hash, file path, board item ID). Non-cited claims are non-conformant.

- **Branch:** `claude/research-agentic-teams-UCssB` *(cited: `git branch --show-current`)*
- **Last commit:** `321cea2 docs(W1.2): roll out single-threaded-default rule per ADR-0005` *(cited: `git log -1 --oneline`)*
- **Working tree:** clean *(cited: `git status --porcelain` — empty)*
- **In flight:** W1.3 (harness contract implementation) *(cited: `docs/sprints/sprint-1-plan.md` Status Tracker line 165)*
- **Phase:** 3 (Implementation) — verbatim doctrine rollout from ADR-0006 *(cited: `docs/methodology/phases.md` § Phase 3)*
- **Sprint/Wave:** Sprint 1, Wave 1 of 3 *(cited: `docs/sprints/sprint-1-plan.md` line 19)*
- **Board status:** not configured; tracking via in-repo sprint plan *(cited: `CLAUDE.md` line 101–102, empty `project-number`/`project-owner`)*

---

## Next Step

> The single next action the resuming session takes. ONE sentence. MUST cite the work-item ID and the file path the action operates on. MUST include a `gates:` list naming any Blocker IDs that gate this action; empty list (`gates: []`) is permitted and means unblocked.

**Action:** Run the dual-purpose shadow-pilot post-mortem on W1.3 — score against ADR-0004's six criteria and ADR-0006's five criteria independently, then evaluate whether the joint-reopen rule fires.

- **Work item:** W1.3 *(cited: `docs/sprints/sprint-1-plan.md` Status Tracker)*
- **File:** `docs/tracking/2026-05-02-w1.3-pilot-postmortem.md` (to be created)
- **`gates:`** `[B1]`

---

## Learnings

> Project-specific operational knowledge from this session. Each learning MUST be either (a) **promoted** to its destination (gotcha, ADR amendment, code-map entry) with a citation, OR (b) flagged `pending-promotion: <destination>` with a one-sentence rationale. A learning that is neither is non-conformant.

- **L1 — Verbatim doctrine rollout doesn't need multi-lens code review.** When a sprint item is "insert ADR-quoted prose into operational docs," the four-lens review is overkill (no code, no judgement calls beyond the ADR text). The architecture gate already covered the substance.
  - **Status:** `pending-promotion: docs/process/gotchas.md § Process` — *will promote at next gotchas update; want one more data point first to confirm the pattern generalizes beyond verbatim rollout.*

- **L2 — Plan-as-artifact mapping (ADR-0006 § 2) absorbs the "where does the planner live" question cleanly.** The first session resuming under the new schema should not be confused about who/what the planner is — see OQ for human.
  - **Status:** *promoted: documented inline in [ADR-0006 § Persona-Role Mapping Debate](../adrs/0006-harness-contract.md#persona-role-mapping-debate); no further promotion needed.*

---

## Open Questions

> Questions that need answering before progress can resume. Each MUST cite *who* must answer (human / Pat-in-proxy / a specific agent) and *why* it blocks. A question with no addressee is non-conformant.

- **OQ1 — for human:** Should the W1.3 pilot post-mortem be authored by the coordinator or by a separate Cam invocation?  *Why it blocks:* The post-mortem is an evaluator artifact; if Cam authors it, Phase 7 single-point-of-contact applies. If the coordinator authors it, the joint-reopen-rule attribution may be subject to authorship bias.

---

## Blockers

> Decisions awaiting the human (or Pat in proxy mode) that prevent the Next Step from executing. Structurally distinct from Open Questions — Open Questions may be team-answerable; Blockers require explicit human input. Each Blocker MUST have a stable ID (`B1`, `B2`, … never reused for unresolved blockers) and MUST cite the decision required and the verdict (or `awaiting-human` if not).

- **B1 — Pilot post-mortem authorship:** *(decision required:)* Confirm post-mortem author for W1.3 pilot. *(verdict:)* `awaiting-human`. *(verdict-rationale:)* — *(reversibility:)* `reversible` — wrong author can be re-run with correct author at low cost.

---

## Migration mapping for legacy `## Proxy Decisions (Review Required)` entries

Per ADR-0006 § 3 Proxy Decisions migration, prior `handoff.md` entries map to Blockers as:

| Legacy field | Blocker target |
|---|---|
| `question` | decision required |
| `decision` | `verdict` (or `awaiting-human` if unanswered) |
| `rationale` | sub-field `verdict-rationale:` (one line, recommended when Pat applied a proxy verdict) |
| `reversibility` | sub-field `reversibility:` — one of `reversible`, `costly-to-reverse`, `irreversible` |

The migration is one-time at W1.3 close; no entries are dropped.

---

## Refusal-condition checklist (for `/handoff` enforcement)

The `/handoff` command refuses to write the canonical progress note if **any** of the following hold:

- [ ] Header missing `session-date`, `author`, or `prior-note-commit`.
- [ ] More than one Next Step supplied.
- [ ] Next Step's `gates:` list contains a Blocker ID whose status is non-resolved (e.g., `awaiting-human`).
- [ ] A Learning is neither promoted nor flagged `pending-promotion: <destination>`.
- [ ] An Open Question lacks an addressee.
- [ ] A Blocker is missing a stable ID, or two unresolved Blockers share an ID.

Refusals are surfaced with the violating field named — caller resolves and re-runs.
