<!-- agent-notes: { ctx: "Vik simplicity review of the nine-agent v2 to v3 port (c4b1e45)", deps: [docs/methodology/team-layers.md, team/roles, team/personas, .claude/agents], state: active, last: "vik@2026-09-09", key: ["seam leakage runs both ways; the composer only catches Dissent restating the lens", "fidelity losses are owned documents and trigger rules, not knobs", "checks that a role cannot run are judgment dressed as command"] } -->

# Persona Port Review (Vik, simplicity lens)

**Scope:** commit c4b1e45 on `claude/summon-team-v3-decomposed-jyiur2`. Nine v2 agents (`.claude/agents/{cam,grace,pat,ines,dani,debra,diego,prof,cloud}.md`) ported to `team/roles/{elicitor,tracker,product,operator,designer,data-scientist,writer,teacher,cloud}` and `team/personas/` of the same nine names, plus `team/roles/reviewer/lenses/accessibility.md`. Spec is `docs/methodology/team-layers.md`.

**Questions, in the order asked:** (1) seam leakage in both directions, (2) fidelity of load-bearing content, (3) laziness ladder on the roles, (4) checks that are judgment in a command's clothing, and the reverse.

I've watched this exact port done three times on three teams: split the monolith into "the job" and "the person." Every time, the person leaked into the job on the first pass because the old file was written in one voice. That is what most of the findings below are. None of it is structural; the seam is in the right place. The port compresses honestly and the authorities mostly survived.

Findings are numbered F0 (Critical), F1-F15 (Important), and S1-S12 (Suggestions); C1-C10 are clean bills, not findings. Each cites file:line.

## Critical

### F0. A role that must not run is told to run a command
`team/roles/designer/role.json:3` declares `"must-not": ["run", ...]`. `:6` declares check `contrast-motion`, which `team/checks.json:44-47` binds to `pnpm check:css`. The composed agent `build/team/.claude/agents/dani.md:6` has `disallowedTools: Bash` and `:30` reads "Run `pnpm check:css`; receipt: the checker's summary line." The agent is forbidden the tool the instruction requires. At runtime that is either a boundary violation (if the harness lets it through) or a receipt that never arrives, and `enforcement.md` still counts it among the 26 "bound" checks the commit message advertises. A check counted as deterministic that its holder cannot execute is a false green with a number on it. Fix is one of: move `contrast-motion` to a seat that may `run` (the reviewer's accessibility lens, which Dani also holds and which the review formation composes with the reviewer's capabilities), or grant the designer `run`. Separately, `scripts/compose-team.mjs` should refuse a binding on a check whose declaring role has `run` in `must-not`; that is a five-line test and it would have caught this. I checked the other two `must-not: run` roles: elicitor (`work-item-exists`) and product (`product-context-present`, `acceptance-criteria-present`) are unbound, so they degrade to inferential rather than contradict; see F14 for whether they belong to those roles at all.

## Important

### F1. Tells restate the role (reverse-direction leak, five personas)
A Tell is how a reader knows it was *this* person and not another holder of the seat. In five personas the Tells are the role in the third person, and the composer does not check Tells at all:

- `team/personas/cam.md:34` "Ends every exchange with a confirmed sentence, never a list of ten questions" = `team/roles/elicitor/SKILL.md:3` and `:25`.
- `team/personas/dani.md:35` all three sentences: "Ships options in threes" = `designer/SKILL.md:15`; "Every finding on a visual change names its source or turns into a question" = `designer/SKILL.md:15` and `reviewer/lenses/accessibility.md:17`.
- `team/personas/diego.md:34` "Verifies by execution and says which steps were only read" = `writer/SKILL.md:23`, near-verbatim.
- `team/personas/prof.md:33` "Names the trade-off in the same sentence as the pattern" = `teacher/SKILL.md:15`.
- `team/personas/cloud.md:34` "Puts a date on every price" = `cloud/role.json:7`; "Answers 'which cloud' before answering anything else" = `cloud/SKILL.md:11`.

Cut or replace with something only that persona does. Grace's, Pat's, Ines's, and Debra's Tells are genuinely theirs.

### F2. Voice exemplars that are the role's or lens's own question
- `team/personas/pat.md:30` "Does this ship value to a user? No? Then why is it in the sprint?" and `team/roles/product/SKILL.md:19` "Does this ship value to a user? If not, why is it being built?"
- `team/personas/ines.md:31` "How will we know when this breaks at 3am? Not whether. When." and `team/roles/reviewer/lenses/operational.md:7` "when this breaks at 3am, how will anyone know".

Same sentence, both layers, and on Claude Code both land in one context. The question belongs to the role or lens (any holder asks it). The persona needs an exemplar that only Pat or only Ines would say; each persona's Tells has better raw material.

### F3. Tracker Charter carries Grace's scar
`team/roles/tracker/SKILL.md:11` — "the last three 'simple' estimates were off by three times, and you plan for that." That is a memory of an incident, and it is already in the persona twice: `team/personas/grace.md:10` and `:20` ("Quotes the last three"). The role's own `:21` already says the durable thing: track actual against estimate and correct the next one. Cut the sentence from the Charter.

### F4. Product Charter carries Pat's temperament
`team/roles/product/SKILL.md:11` "you say no more often than yes" (and `:3` "says no"). That is how Pat holds the seat; `team/personas/pat.md:28` and `:34` already say it. A different product persona might say yes and cut later. Leave "prioritises and scopes" in the role and the temperament in the persona.

### F5. Dissent restates the role by paraphrase in seven of nine personas
The composer's containment test (`scripts/compose-team.mjs:79-80`, `:231-236`) is content-word overlap against single sentences; it catches restatement, not paraphrase. These got through:

| Persona | Bullet | Already said at |
|---|---|---|
| `grace.md:22` | sprint declared done with an untouched issue | `tracker/SKILL.md:23` |
| `ines.md:20` | setting in code, not in manifest | `operator/SKILL.md:15`, check `config-manifest-current` |
| `ines.md:21` | no answer to "what would someone do", no alert | `operator/SKILL.md:23`, check `runbook-per-alert` |
| `dani.md:22` | aesthetic preference stated as a rule, no owner | `accessibility.md:17`, `designer/SKILL.md:27` |
| `dani.md:23` | keyboard path never tried | `accessibility.md:10` |
| `debra.md:20` | dashboard number nobody acted on | `data-scientist/SKILL.md:19` |
| `debra.md:21` | ML before the heuristic | `data-scientist/SKILL.md:22`, `:15` |
| `diego.md:20` | illustrative example, runs it | `writer/SKILL.md:20` |
| `diego.md:21` | script with no header | `writer/SKILL.md:15` |
| `diego.md:22` | "various fixes" | `writer/SKILL.md:24` |
| `prof.md:20` | elegant praised, pragmatic shipped | `teacher/SKILL.md:29` |
| `prof.md:21` | asks the transfer question | `teacher/SKILL.md:32` |
| `cloud.md:19` | estimate with no assumptions column | `cloud/SKILL.md:15` |
| `cloud.md:20` | "open the port", which hop failed | `cloud/SKILL.md:21` |
| `cloud.md:22` | year-old landscape pricing | `cloud/SKILL.md:15`, check `pricing-current` |

The spec (`docs/methodology/team-layers.md:60`) says Dissent is the section that matters and that a persona whose Dissent empties out is decoration. Diego and Cloud are at three of five; that is most of the friction budget spent restating the role in the first person. Cam and Pat are clean (C9). Fix the bullets, and consider whether the test should compare a bullet against the whole role rather than sentence by sentence; a bag-of-words over the section would have caught most of this table.

### F6. Product lost proxy mode's end condition (fidelity)
v2 `.claude/agents/pat.md:95`: "Proxy mode ends when the human sends any message." Nothing in `team/roles/product/SKILL.md` says when proxy mode stops, and I found it nowhere else in canon (`docs/process/gotchas.md:93-103` has the table and the log location, not the stop). That stop is the safety property of the whole mode. The log location (`.claude/handoff.md` § Proxy Decisions, v2 `:116`, canon `gotchas.md:103`, `handoff.md:73`) can be cited; the end condition has to be restated in the role or added to gotchas and cited.

### F7. Owned documents named by description, not path (fidelity, four roles)
`team/roles/product/SKILL.md:15` names `docs/product-context.md`. The other three roles that own files do not name them: tracker (`tracker/SKILL.md:11`, `:15`, `:35`: "the register"; v2 `grace.md:29` `docs/tech-debt.md`), operator (`operator/SKILL.md:15`, `:35`: "the configuration manifest", "runbooks", "the performance budget"; v2 `ines.md:55`, `:75`, `:94`), writer (`writer/SKILL.md:11`: "the changelog"; v2 `diego.md:22` `CHANGELOG.md`). The paths sit in each SKILL.md's agent-notes `deps`, which the model never reads as instruction. An owned document is load-bearing because another seat has to find it. One convention: name the path, or cite `docs/process/doc-ownership.md`.

### F8. The product-context template is gone and a command still points at it (fidelity)
v2 `.claude/agents/pat.md:57-83` defined the file's shape (Decision Philosophy, Quality Bar, Scope Style, User Model, Non-Negotiables, Correction Log, "Last updated"). Nothing in `team/` or `docs/scaffolds/` carries it (`docs/scaffolds/` has ten stubs; product-context is not one). `.claude/commands/kickoff.md:58` says "using the format defined in Pat's Human Model Lens", which dangles at cutover. `team/roles/product/role.json:6` (`product-context-present`) reads a "last-updated date" that only the template defines. Give the template a scaffold home next to `docs/scaffolds/tech-debt.md` and have kickoff and the role cite it.

### F9. Operator lost the error-budget freeze (fidelity)
v2 `.claude/agents/ines.md:76`: "When the budget is burned, freeze features and fix reliability." `team/roles/operator/SKILL.md:23` asks for an error budget and burn-rate alerting but never says what the budget *does*. Without the freeze, an error budget is a dashboard. It is an authority in the same class as no-runbook-no-alert, which did survive (`:15`, `:31`).

### F10. Cloud lost every per-platform anchor (fidelity)
v2 `.claude/agents/cloud.md:43-47` (AWS/Azure/GCP patterns: subnets and AZs, hub-spoke, shared VPC, governance services) and `:89-93` (per-platform diagnostic tools) are gone. `team/roles/cloud/SKILL.md:21` says "the platform's own diagnostic tool" and `:11` "any landscape research on file"; `docs/research/` does not exist in this repo, so both point at nothing. Cloud vendors are the domain here, not the harness; the spec's vendor rule (`team-layers.md:47`) is about tools the model runs on. Keep one compact table in the role, or put it in a scaffold and cite it. The prices (v2 `:68-70`) were right to delete.

### F11. The design-authority ladder is written three times (laziness ladder)
`docs/adrs/0013-design-authority.md` is the decision. `team/roles/reviewer/lenses/accessibility.md:17` restates it (D1 profile, D2 add-on, D3 say-so-once), and `team/roles/designer/SKILL.md:22` restates it again in nearly the same words. Dani holds both seats, so on a review Dani carries the lens; on design work Dani carries the role. Two copies of a citation discipline will drift, and the first place it will show is a persona that cites one and not the other. The role already cites the lens at `:23` for accessibility; make `:22` one line that does the same for authority.

### F12. The review formation's triggers went from mechanical to prose
v2 `.claude/agents/dani.md:86`: "Any `.svelte`, `.tsx`, `.jsx`, `.vue`, CSS, or SCSS file change must trigger Dani review. No exceptions. This is a lesson learned from multiple sprints where frontend code shipped without accessibility validation." `team/parties/summon-core.json:90`: `"when": "the change touches UI files: components, templates, stylesheets, layouts"`. Same for `:85` ("not docs-only, not CI-only"). Both are decidable from `git diff --name-only`; the v2 rule was made an extension list precisely so nobody could judge their way out of it. The spec says the formation "reports which it applied"; that report should be a receipt from a command, not a judgment. Bind the `when` to a path glob, the same way the adapter's `paths` already bind write capabilities.

### F13. `quick-start-runs` decides a different claim than it declares
`team/roles/writer/role.json:6` claims "The documented quick-start commands run on the current tree." `team/checks.json:48-51` runs a hardcoded `pnpm install --frozen-lockfile && pnpm build`. If the README's quick start says something else, the check is green and the docs are wrong, which is the one defect this check exists to catch. Either the binding runs what the README says (extract the fenced block), or the claim is renamed to what is actually decided ("the tree installs and builds"), and the README claim stays inferential.

### F14. Two tracker claims filed elsewhere, or undecidable where they sit
- `team/roles/elicitor/role.json:6` `work-item-exists`: board-item creation is the coordinator's atomic first step (`CLAUDE.md` § Per Work Item, step 1; Pat and Grace). The elicitor may not `run` and cannot see the board, so this is inferential forever in its hands. It is the tracker's claim.
- `team/roles/tracker/role.json:7` `status-flow`: "Every item in Done passed through In Progress and In Review, in that order." The board cannot answer that (no status history through the CLI); the v2 text (`grace.md:87`) pretended it could. The event log can: `claim` events per item in `.summon/team-log.jsonl` carry stations and order. Bind it to `team-log.mjs check`, or reword it as the judgment it is on this project.

### F15. Teacher check id is one letter from a different bound check
`team/roles/teacher/role.json:6` `citations-resolve` ("every file and line the explanation cites exists"). `team/checks.json:31` binds `citation-resolves` (canon-to-meta boundary via `check-canon.mjs`), declared by `team/roles/challenger/role.json:15`. Different claims, ids that differ by an `s`. Either the teacher's is a typo for the existing binding, in which case it is bound to the wrong claim, or it is a new claim that will be misread and mis-bound the first time someone touches `checks.json`. Rename it (`cited-lines-exist`) and, if wanted, bind it to a ten-line script that greps each `path:line` cited in the returned message.

## Suggestions

### S1. Cam's "you decide" bullet has Cam deciding
`team/personas/cam.md:20` — "When the human says 'you decide.' Decides only after naming what the decision costs to reverse." The elicitor's Boundaries (`elicitor/SKILL.md:37`) say the seat does not proceed to solutions, and "you decide" is the product role's proxy trigger (v2 `pat.md:95`). Naming the reversal cost is good dissent; deciding contradicts the role. "Names what the decision costs to reverse, then hands it to the product seat."

### S2. Priors restating the role (six personas; the composer does not check Priors)
- `grace.md:10` "somebody has to be its advocate by rule rather than by mood" = `tracker/SKILL.md:24`.
- `ines.md:11` "If it cannot be rebuilt from code, it does not exist" = `operator/SKILL.md:31`; "The alert that pages at 3am had better come with instructions" = `operator/SKILL.md:15`.
- `debra.md:10` "a rule and a lookup table" = `data-scientist/SKILL.md:22`.
- `diego.md:10` "explains the system ... for the author; explains the task ... for the reader" = `writer/SKILL.md:11`, `:19`.
- `prof.md:10` "what they cannot read is why it is that way" = `teacher/SKILL.md:15`.
- `cloud.md:10` "Networking is where confident deployments go to die" = `cloud/SKILL.md:11`.

Priors are allowed to overlap the role more than Dissent is; a belief and a standard can coincide. But when every Prior is the Standard in aphorism form, the section costs context and adds nothing the model did not just read. Either extend the containment test to Priors with a looser threshold, or trim each to the one belief that is not already the bar.

### S3. Status order stated three times in one role, twice more in canon
`tracker/SKILL.md:15` (Standard), `:19` (Question), `tracker/role.json` `status-flow`; also `CLAUDE.md` § Tracking and `docs/integrations/README.md`. Once in the Standard; the question and the check refer to it.

### S4. Instructions filed under Questions
`tracker/SKILL.md:27` (the automatic boundary trigger), `elicitor/SKILL.md:25` ("Ask one focused question at a time"), `designer/SKILL.md:23`, `writer/SKILL.md:23-24`, `teacher/SKILL.md:32`. Not defects; the spec calls the section "the judgment checklist," and these are steps. Charter or Standard is where the steps go.

### S5. "Overwrite it whole" is a tool instruction wearing prose
`product/SKILL.md:27` is v2's "Write, not Edit" (`pat.md:87`), a Claude Code tool distinction. Drop the clause (the correction log already forces a full rewrite) or express the path constraint in the adapter's `paths`.

### S6. Periodic-pass coordination: cite the workflow that owns it
v2 `grace.md:31` and `:118` had the tracker coordinating the dead-code and dependency passes. `.claude/commands/sprint-boundary.md:142-150` owns them now, so the duty is not lost, but nothing in `tracker/SKILL.md` says the tracker is the one who runs that workflow's Step 5. One clause in the Charter, citing the workflow.

### S7. Severities dropped in port
v2 `dani.md:29`: a change contradicting the design profile is an **Important** finding; `designer/SKILL.md:22` says "a finding". v2 `diego.md:52`: a broken quick start is a **P1 defect**; `writer/SKILL.md:11` says "your defect". If the coordinator triages by severity, say the severity; if not, fine.

### S8. Proxy can/cannot list has two owners
`product/SKILL.md:27` and `docs/process/gotchas.md:93-103` carry the same list. Portable roles argue for the role owning it and gotchas citing the role; today it is the other way, and both will be edited independently. Pick one.

### S9. Designer says "accessibility on every interface change" three times
`designer/SKILL.md:11`, `:23`, `:27`. Once in Boundaries is the strong form; the Charter and the Question can drop it.

### S10. Cloud Charter carries a belief
`cloud/SKILL.md:11` "which is the most common way enterprise deployments fail" is a prior, and `team/personas/cloud.md:10` has it. Cut from the role.

### S11. Unbound checks a one-line command could decide today
`notebook-outputs-clean` (`git ls-files '*.ipynb'` plus a grep for non-empty `outputs`), `versions-pinned` (grep `FROM .*:latest` and unpinned providers), `board-statuses` (`gh project field-list`), `product-context-present` (`test -f` plus the date line), and the first half of `design-profile-present` (`test -f docs/design-profile.md`; the second half, "or the report says once that it does not", is a judgment about the report and should be its own claim). Binding is per-project and this repo has no notebooks or Dockerfiles, so unbound is honest for those; the file tests cost one line each.

### S12. Operational lens dropped an activation level
v2 `ines.md:106`: per-diff at review, full audit at sprint boundary, comprehensive review at pre-release. `reviewer/lenses/operational.md:16` keeps the first two. If pre-release is still a moment in the process, say so; if it folded into the boundary, say that.

## Clean

### C1. Elicitor fidelity
Every rule in v2 `cam.md` that is not routing or a knob survived: 5 Whys (`elicitor/SKILL.md:21`), inversion (`:22`), constraint surfacing (`:23`), alternative framing (`:24`), one question at a time (`:25`), orient/prioritise/probe/translate (`:29-32`), "better than fine" (`:33`), must-fix vs nice-to-have (`:15`), success metric (`:15`). The slash-command names (v2 `:33`) were correctly generalised at `:37`.

### C2. Pat's proxy limits and conservative defaults
The can/cannot table (v2 `pat.md:99-105`) is one sentence at `product/SKILL.md:27`; conservative defaults (v2 `:109-112`) at `:23`; "outside proxy authority, log as deferred and stop" at `:23`. Nothing in the authority was weakened.

### C3. Grace's debt-escalation authority
`tracker/SKILL.md:24` and `:31` carry the 3+ sprint rule, P0 over product preference, and the single override (explicit human deferral). `:3` advertises it.

### C4. Operator role prose
No persona in the role. "Will automate yourself out of a job" and the 3am line went where they belong (`ines.md:11`, `:31`). No-runbook-no-alert survived three ways (`operator/SKILL.md:15`, `:31`, check `runbook-per-alert`). Config-manifest ownership, PDV, and roll-back-first-investigate-second (`:15`) survived. `write:infra` as a separate verb is the right cut for this seat.

### C5. Data-scientist port
Notebook access became the `notebook` verb (`data-scientist/role.json:2`), which is the spec's point. Goodhart (`:20`), privacy-by-design (`:15`), start-with-the-question (`:19`), simplest baseline (`:15`), drift and rollback (`:24`), and the notebook conventions (`:25`) all survived. The role prose has no persona in it.

### C6. Teacher port
The v2 Voice block (`prof.md:101-107`) moved cleanly into the persona and nothing of it stayed in the role. Calibration and downshift-only-when-asked (`teacher/SKILL.md:15`, `:36`), opt-in quiz (`:32`, `:36`), and offer-don't-create for reference pages (`:30`, `:36`) survived. `run` is correctly kept: reading history is the job.

### C7. Writer port
Changelog ownership and conventional-commit grouping (`writer/SKILL.md:11`, `:24`), docs-in-the-same-change (`:15`), the 5-minute test with execution-vs-reading recorded (`:23`), and "decide how, not what" (`:28`) survived. Prose-not-decisions on ADRs (`:11`) is exactly the v2 split.

### C8. Capabilities are verbs, everywhere
All nine `role.json` files use the spec's verbs and no tool names. Each `must-not` matches the v2 `disallowedTools` denial (elicitor, product, designer: no `run`; teacher: no writes; data-scientist alone gets `notebook`).

### C9. Cam's and Pat's Dissent
Every bullet in `cam.md:18-22` and `pat.md:18-22` adds friction the role does not carry (problem-before-solution, "what changed this week", praise-ending reviews, champion-without-user, happy-path demos, stated-vs-revealed preference). These are the model for the other seven.

### C10. Cloud authority
The four-step target detection with its order (`cloud/SKILL.md:11`), never-trade-security-for-cost with its three named forms (`:26`), firewall-needs-security-review (`:26`), and never-guess-at-pricing (`:26`, check `pricing-current`) survived intact.

VIK-COMPLETE: 28 findings, 1 critical
