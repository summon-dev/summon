---
agent-notes: { ctx: "coordinator dispositions for Vik's simplicity review of the nine-agent port", deps: [docs/history/code-reviews/2026-09-09-persona-port-vik.md, docs/methodology/team-layers.md, team/roles, team/personas, team/checks.json, scripts/compose-team.mjs], state: active, last: "claude@2026-09-09", key: ["F0 fixed twice: the check moved and the composer now refuses the shape", "23 of 28 applied in the tree; S4, S8, S11 (three of five), and F5's composer half deferred with reasons", "two new bindings the composer refused on its first run are recorded here, not hidden"] }
---

# Persona port — Dispositions (2026-09-09)

Answers to Vik's simplicity review of commit `c4b1e45` (`../code-reviews/2026-09-09-persona-port-vik.md`, sentinel `VIK-COMPLETE: 28 findings, 1 critical`). Written by the coordinator; reviewers do not write files. The composer, the script tests, and check-canon were run after the batch landed: 145 tests green, `canon check: OK`, `pnpm team:compose` composes 18 files with 29 checks bound and 17 judged.

## Critical

| # | Disposition | Where |
|---|---|---|
| F0 | **Fixed, both halves.** `contrast-motion` moved from the designer role to the reviewer role, whose accessibility lens Dani holds with the reviewer's capabilities. The composer now refuses any check that is bound to a command on a role whose `must-not` includes `run`, with a message naming the seat and the two ways out. The refusal caught two more of the same shape on its first run over the real tree: `product-context-present` (product must not run; moved to the tracker, who owns pre-flight checks) and `citation-resolves` (challenger must not run; its binding duplicated `canon-drift`, so it is now unbound and Wei judges it by reading the cited file, which was always the real check). | `team/roles/reviewer/role.json`, `team/roles/tracker/role.json`, `team/checks.json`, `scripts/compose-team.mjs`, `scripts/compose-team.test.mjs` |

## Important

| # | Disposition | Where |
|---|---|---|
| F1 | **Fixed.** Tells rewritten for Cam, Dani, Diego, Prof, and Cloud so each names something only that persona does; nothing in them is a role sentence in the third person now. | `team/personas/{cam,dani,diego,prof,cloud}.md` |
| F2 | **Fixed.** Pat's and Ines's Voice exemplars replaced; the role's and lens's questions stay where any holder asks them. | `team/personas/pat.md`, `team/personas/ines.md` |
| F3 | **Fixed.** The three-times sentence cut from the tracker Charter; the persona keeps the scar. | `team/roles/tracker/SKILL.md` |
| F4 | **Fixed.** "Says no more often than yes" cut from the product Charter and description; Pat keeps the temperament. | `team/roles/product/SKILL.md` |
| F5 | **Fixed by hand; composer half deferred.** All fifteen bullets in the table rewritten to add friction the role does not carry. The suggestion to compare a bullet against the whole role as a bag of words is deferred: the sentence-level containment test is the documented rule in `team-layers.md`, and widening it changes what counts as restatement for every persona at once. It goes to the next composer wave with its own tests, after the log shows whether paraphrase is still getting through. | `team/personas/{grace,ines,dani,debra,diego,prof,cloud}.md` |
| F6 | **Fixed.** "Proxy mode ends the moment the human sends any message" restored in the product role's Boundaries. | `team/roles/product/SKILL.md` |
| F7 | **Fixed.** Owned documents named by path: `docs/tech-debt.md` (tracker), `docs/config-manifest.md` and `docs/runbooks/` (operator), `CHANGELOG.md` (writer). | `team/roles/{tracker,operator,writer}/SKILL.md` |
| F8 | **Fixed.** The product-context template has a scaffold home; kickoff and the role cite it, and the bound check reads the `Last updated` line the template defines. | `docs/scaffolds/product-context.md`, `.claude/commands/kickoff.md`, `team/roles/product/SKILL.md` |
| F9 | **Fixed.** The error-budget freeze is back in the operator's Standard: when the budget is spent, features freeze and reliability work takes the sprint. | `team/roles/operator/SKILL.md` |
| F10 | **Fixed.** One compact per-platform table (network shape, identity, governance, diagnostics) in the cloud role; prices stay out. | `team/roles/cloud/SKILL.md` |
| F11 | **Fixed.** The designer's authority line now defers to the accessibility lens in one sentence instead of restating ADR-0013's ladder. | `team/roles/designer/SKILL.md` |
| F12 | **Fixed.** Conditional lenses carry `paths` globs in the party; the composer prints "decided by changed paths" on the formation, and `scripts/review-wave.mjs prepare` decides them from the diff and reports which it applied and why. The prose `when` stays as the human-readable reason. | `team/parties/summon-core.json`, `scripts/compose-team.mjs`, `scripts/review-wave.mjs` |
| F13 | **Fixed, by renaming.** The check is `installs-and-builds` and claims what the command decides; whether the README's quick start matches is `quick-start-matches`, judged. | `team/roles/writer/role.json`, `team/checks.json` |
| F14 | **Fixed.** `work-item-exists` moved to the tracker. `status-flow` retired; the claim the board cannot answer is answered by the log through `line-respected`, which the tracker now declares. | `team/roles/{elicitor,tracker}/role.json` |
| F15 | **Fixed.** Teacher's check renamed `cited-lines-exist`; left unbound, since the grep Vik describes belongs with the returned message, which the runner does not yet see. | `team/roles/teacher/role.json` |

## Suggestions

| # | Disposition | Where |
|---|---|---|
| S1 | **Applied.** Cam names the reversal cost and hands the decision to the product seat. | `team/personas/cam.md` |
| S2 | **Applied.** Each of the six Priors trimmed to the belief that is not already the bar. Extending the containment test to Priors is deferred with F5's composer half. | `team/personas/{grace,ines,debra,diego,prof,cloud}.md` |
| S3 | **Applied.** The status order is stated once, in the tracker's Standard; the questions and the check refer to it. | `team/roles/tracker/SKILL.md` |
| S4 | **Deferred.** Steps filed under Questions in five roles are not defects, as Vik says. Moving them is a section-shape change across the tree and is better done once, with the spec's section definitions tightened at the same time. |  |
| S5 | **Applied.** "Overwrite it whole" dropped; the correction log forces the rewrite. | `team/roles/product/SKILL.md` |
| S6 | **Applied.** The tracker's Charter says the tracker runs the sprint-boundary workflow, including its dead-code and dependency-health passes. | `team/roles/tracker/SKILL.md` |
| S7 | **Applied.** Contradicting the design profile is an Important finding; a broken quick start is a P1 defect. | `team/roles/designer/SKILL.md`, `team/roles/writer/SKILL.md` |
| S8 | **Deferred.** The proxy can/cannot list still has two owners (the role and `gotchas.md`). The role should own it and gotchas should cite the role, but gotchas is canon that ships to every project and the role does not yet (step 8), so the edit waits for the scaffolder wave. |  |
| S9 | **Applied.** The designer says accessibility-on-every-change once, in Boundaries; the Standard now says what an accessibility claim must cite, which is a different sentence. | `team/roles/designer/SKILL.md` |
| S10 | **Applied.** The belief cut from the cloud Charter; Cloud's Priors keep it. | `team/roles/cloud/SKILL.md` |
| S11 | **Applied in part.** `product-context-present` is bound (on the tracker, per F0). `notebook-outputs-clean`, `versions-pinned`, and `board-statuses` stay unbound here: this repo has no notebooks, no Dockerfiles, and the board binding needs `gh` project access that the runner does not assume. `design-profile-present` stays one judged claim until its second half is split out. |  |
| S12 | **Applied.** The operational lens says the full audit runs at the sprint boundary against the operational baseline; pre-release folded into the boundary. | `team/roles/reviewer/lenses/operational.md` |

## What the batch changed in the numbers

The totals did not move: 29 of 46 checks bound before and after, 17 judged. What moved is where they sit. Before, one bound check lived on a seat that could not run it (F0), and two more of the same shape were waiting to be noticed. After, every bound check is declared by a seat that may `run`, and the composer refuses the other arrangement. Two of the three corrections were moves rather than unbindings, which is the honest direction: a claim decided by a command belongs on the seat that runs the command.
