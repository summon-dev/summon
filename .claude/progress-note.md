<!-- agent-notes: { ctx: "first canonical progress note under ADR-0006 schema; W1.3 pilot output", deps: [docs/adrs/0006-harness-contract.md, docs/adrs/0004-feature-spec-artifact.md, docs/sprints/sprint-1-plan.md, .claude/handoff.md], state: active, last: "claude@2026-05-02" } -->

```yaml
session-date: 2026-05-02
author: coordinator
prior-note-commit: none
```

# Progress Note — Sprint 1, Wave 1 close

## State

- **Branch:** `claude/research-agentic-teams-UCssB` *(cited: `git branch --show-current`)*
- **Last commit:** `8a69a0f docs(W1.1): roll out feature-spec artifact per ADR-0004` *(cited: `git log -1 --oneline`)*
- **Working tree:** clean *(cited: `git status --porcelain` → empty)*
- **In-flight work item:** none — Wave 1 implementation closed by `8a69a0f` *(cited: `docs/sprints/sprint-1-plan.md` Status Tracker, all three Wave 1 rows show "Done")*
- **Current phase:** between phases — Wave 1 closed, dual-purpose pilot post-mortem pending *(cited: `docs/sprints/sprint-1-plan.md` Wave 1 exit criteria line 50; `docs/adrs/0006-harness-contract.md` § 6 Pilot Plan)*
- **Sprint/Wave:** Sprint 1, Wave 1 of 3 — implementation Done; post-mortem pending *(cited: `docs/sprints/sprint-1-plan.md` line 19 + Status Tracker)*
- **Board status:** not configured; tracking via `docs/sprints/sprint-1-plan.md` Status Tracker *(cited: `CLAUDE.md` lines 101–102, empty `project-number` and `project-owner`)*
- **Recent commits (this session, oldest → newest):** `321cea2` (W1.2 single-thread default), `9983ab2` (W1.3 harness contract + redirect cutover), `8a69a0f` (W1.1 feature-spec artifact) *(cited: `git log --oneline -10`)*
- **Schema cutover marker:** `.claude/handoff.md` is now a single-line redirect; this file (`.claude/progress-note.md`) is the canonical artifact per ADR-0006 § 3 *(cited: `.claude/handoff.md` content; `docs/adrs/0006-harness-contract.md` § 3)*

## Next Step

**Action:** Run the dual-purpose pilot post-mortem for ADR-0004 + ADR-0006 scoring the W1.3 implementation against both ADRs' criteria independently, and apply the joint-reopen rule if attribution is ambiguous (per ADR-0006 § 6).

- **Work item:** W1.3 (post-mortem); incorporates W1.1 implementation evidence as it bears on ADR-0004's pilot criteria.
- **File:** `docs/tracking/2026-05-02-w1.3-pilot-postmortem.md` (to be created).
- **`gates:`** `[]` *(no Blockers gate the post-mortem; OQ1 below is team-answerable inside the post-mortem itself, not a Blocker)*

## Learnings

- **L1 — Verbatim ADR-doctrine rollout doesn't fit the four-lens code review pattern.** When a sprint item is "insert ADR-quoted prose into operational docs at the locations the ADR names," the architecture gate already covered the substance and there's no code or judgement call left to multi-lens review. The W1.2 / W1.3 / W1.1 commits each skipped the formal four-lens review for this reason; commit messages noted the rationale.
  - **Status:** `pending-promotion: docs/process/gotchas.md § Process` — *will promote after the next non-doctrine-rollout item to confirm the pattern doesn't generalize too broadly. One additional data point would distinguish "verbatim rollout exception" from "all doc-only changes skip review," which is the concerning over-generalization.*

- **L2 — The dual-purpose pilot has retroactivity risk for ADR-0004.** Because W1.3 is the pilot vehicle AND ADR-0006's implementation, the implementation had to land before the ADR-0004 spec could be written. ADR-0004 § Pilot Plan criterion 4 ("Implementation closes without a spec amendment") doesn't naturally apply to a retroactive spec — the spec is authored after the implementation has settled, so amendments would mean the retroactive author drifted from the implemented reality, not that the implementation drifted from the plan. The post-mortem must explicitly note where retroactivity makes a criterion partially-scorable. *(See OQ1.)*
  - **Status:** `pending-promotion: docs/adrs/0004-feature-spec-artifact.md § Pilot Plan as a future-pilots refinement note` — *will promote into the post-mortem next session, then fold into ADR-0004 if the post-mortem confirms the pattern is structural rather than incidental to W1.3.*

- **L3 — "Sprint plan must not contradict accepted ADRs" caught a real conflict.** The W1.3 sprint AC said "Phase doc and personas.md annotate the planner/generator/evaluator mapping," but the accepted ADR-0006 § Persona-Role Mapping explicitly says no persona file is edited. The gotchas rule (gotchas.md "Sprint plan must not contradict accepted ADRs") fired correctly: the AC was reconciled to the ADR (sprint-plan note added; personas.md untouched). The reconciliation is documented in `docs/sprints/sprint-1-plan.md` W1.3 AC.
  - **Status:** *promoted: reconciliation lives in `docs/sprints/sprint-1-plan.md` W1.3 AC bullet "Note (2026-05-02)" — no further promotion needed.*

## Open Questions

- **OQ1 — for Pat (or human at post-mortem time):** Is a *retroactive* feature spec a valid pilot artifact for ADR-0004's pilot success criteria, or does the pilot need to be re-run on a future M+ item where the spec genuinely precedes implementation? *Why it blocks the post-mortem's verdict (not Next Step):* if retroactive specs aren't valid pilot evidence for ADR-0004, the W1.3 post-mortem closes ADR-0006 cleanly but defers ADR-0004's pilot evaluation to the next M+ item; if retroactive specs are valid pilot evidence (with caveats), both ADRs can transition out of Shadow-Pilot together. The post-mortem cannot apply the joint-reopen rule until this is resolved. *Addressed within the post-mortem; team-answerable, not a Blocker.*

## Blockers

*None.* The Wave 1 implementation Done state is unblocked; all decisions awaiting human input (the original ADR-0004 + ADR-0006 Accepts) were resolved at the start of this session. No legacy `## Proxy Decisions (Review Required)` entries existed in `.claude/handoff.md` to migrate per ADR-0006 § 3 mapping table.
