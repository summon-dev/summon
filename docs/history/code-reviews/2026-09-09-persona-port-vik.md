<!-- agent-notes: { ctx: "Vik simplicity review of the nine-agent v2 to v3 port (c4b1e45)", deps: [docs/methodology/team-layers.md, team/roles, team/personas, .claude/agents], state: active, last: "vik@2026-09-09", key: ["seam leakage runs both ways; the composer only catches Dissent restating the lens", "fidelity losses are owned documents and trigger rules, not knobs", "checks that a role cannot run are judgment dressed as command"] } -->

# Persona Port Review (Vik, simplicity lens)

**Scope:** commit c4b1e45 on `claude/summon-team-v3-decomposed-jyiur2`. Nine v2 agents (`.claude/agents/{cam,grace,pat,ines,dani,debra,diego,prof,cloud}.md`) ported to `team/roles/{elicitor,tracker,product,operator,designer,data-scientist,writer,teacher,cloud}` and `team/personas/` of the same nine names, plus `team/roles/reviewer/lenses/accessibility.md`. Spec is `docs/methodology/team-layers.md`.

**Questions, in the order asked:** (1) seam leakage in both directions, (2) fidelity of load-bearing content, (3) laziness ladder on the roles, (4) checks that are judgment in a command's clothing, and the reverse.

I've watched this exact port done three times on three teams: split the monolith into "the job" and "the person." Every time, the person leaked into the job on the first pass because the old file was written in one voice. That is what most of the findings below are. None of it is structural; the seam is in the right place. The port compresses honestly and the authorities mostly survived.

Findings are numbered F1..Fn. Each cites file:line.

## Critical

### F0. A role that must not run is told to run a command
`team/roles/designer/role.json:3` declares `"must-not": ["run", ...]`. `:6` declares check `contrast-motion`, which `team/checks.json:44-47` binds to `pnpm check:css`. The composed agent `build/team/.claude/agents/dani.md:6` has `disallowedTools: Bash` and `:30` reads "Run `pnpm check:css`; receipt: the checker's summary line." The agent is forbidden the tool the instruction requires. At runtime that is either a boundary violation (if the harness lets it through) or a receipt that never arrives, and `enforcement.md` still counts it among the 26 "bound" checks the commit message advertises. A check counted as deterministic that its holder cannot execute is a false green with a number on it. Fix is one of: move `contrast-motion` to a seat that may `run` (the reviewer's accessibility lens, which Dani also holds and which the review formation composes with the reviewer's capabilities), or grant the designer `run`. Separately, `scripts/compose-team.mjs` should refuse a binding on a check whose declaring role has `run` in `must-not`; that is a five-line test and it would have caught this. I checked the other two `must-not: run` roles: elicitor (`work-item-exists`) and product (`product-context-present`, `acceptance-criteria-present`) are unbound, so they degrade to inferential rather than contradict; see F14 for whether they belong to those roles at all.

## Important

### F1. Cam's Tells restate the elicitor role (reverse-direction leak)
`team/personas/cam.md:34` — "Ends every exchange with a confirmed sentence, never a list of ten questions." That is `team/roles/elicitor/SKILL.md:3` ("Asks one question at a time") and `:25` ("Ask one focused question at a time. Summarise periodically") in the third person. The composer checks Dissent against the lens; it does not check Tells against the role, so this got through. A Tell should be how a reader knows it was Cam and not another elicitor. This one is how a reader knows it was *an* elicitor.

### F2. Pat's Voice exemplar is the product role's first Question, verbatim
`team/personas/pat.md:30` — "Does this ship value to a user? No? Then why is it in the sprint?" and `team/roles/product/SKILL.md:19` — "Does this ship value to a user? If not, why is it being built?" Same sentence, both layers. One of them has to move. The question is the role's (any product seat asks it); Pat needs an exemplar that only Pat would say. The persona's own Tells (`pat.md:34`, "Uses 'no' as a complete sentence and then explains") is the better seed.

### F3. Tracker Charter carries Grace's scar
`team/roles/tracker/SKILL.md:11` — "the last three 'simple' estimates were off by three times, and you plan for that." That is a memory of an incident, not a description of the work, and it is already in the persona twice: `team/personas/grace.md:10` (Priors: "Estimates are wrong in a consistent direction, and the direction is data") and `:20` (Dissent: "Quotes the last three"). Same anecdote in three places across two layers. The role should say "you track actual against estimate and correct the next estimate with the gap"; it already does at `:21`. Cut the sentence from the Charter.

### F4. Product Charter carries Pat's temperament
`team/roles/product/SKILL.md:11` — "you say no more often than yes" (and `:3`, "says no"). That is how Pat holds the seat, and `team/personas/pat.md:28` ("Terse, business-first") and `:34` ("Uses 'no' as a complete sentence") already say it. A different product persona might say yes and cut later. The role's job is "prioritises and scopes"; leave the temperament in the persona.

### F5. Tracker lost the periodic-pass trigger (fidelity)
v2 `.claude/agents/grace.md:31` and `:118`: at sprint boundary or pre-release, coordinate the dead-code pass and the dependency-health check. Neither `team/roles/tracker/SKILL.md` nor its Output (`:35`) mentions it. This is a trigger rule, not a harness knob: without it nobody schedules the sweep, and the reviewer roles that perform it are reactive by design. Either the tracker role names it as a boundary-time duty, or the sprint-boundary workflow owns it and the role cites that. Verified against the current sources below (see F6 note if the sweep turned up an owner).

### F6. Product lost the proxy log's location and proxy mode's end condition (fidelity)
v2 `.claude/agents/pat.md:95`: "Proxy mode ends when the human sends any message." v2 `:116`: decisions logged in `.claude/handoff.md` under `## Proxy Decisions (Review Required)`. `team/roles/product/SKILL.md:31` says "a proxy decision log for the human to review on return" with no path, and nothing in the role says when proxy mode stops. The coordinator has to find that log to surface it on return, and the stop condition is the whole safety property of proxy mode. Either name both in the role, or cite `docs/process/gotchas.md` § Process if it carries them (see the verification note appended below).

### F7. Tracker names the debt register by description, never by path (fidelity, owned document)
v2 `.claude/agents/grace.md:29` and `:117` own `docs/tech-debt.md`. `team/roles/tracker/SKILL.md:11`, `:15`, `:35` say "the register" / "the debt register" with no path, while `team/roles/product/SKILL.md:15` names `docs/product-context.md` explicitly. Same commit, two conventions. An owned document is load-bearing precisely because another seat has to find it; name the path or cite `docs/process/doc-ownership.md`.

## Suggestions

### S1. Cam's "you decide" bullet has Cam deciding
`team/personas/cam.md:20` — "When the human says 'you decide.' Decides only after naming what the decision costs to reverse." The elicitor's Boundaries (`team/roles/elicitor/SKILL.md:37`) say the seat does not proceed to solutions, and "you decide" is the product role's proxy trigger (v2 `.claude/agents/pat.md:95`). Cam naming the reversal cost is good dissent; Cam then deciding contradicts the role. Rewrite as "names what the decision costs to reverse, then hands it to the product seat."

### S2. Grace's Priors restate the tracker's escalation rationale
`team/personas/grace.md:10` — "Maintenance loses every popularity contest, so somebody has to be its advocate by rule rather than by mood." `team/roles/tracker/SKILL.md:24` — "This authority exists because a value-to-users lens systematically undervalues maintenance." Same claim, both layers; Priors are not checked by the composer. Keep the role's (it is the authority's justification); let the persona notice something the role does not.

### S3. Grace's fifth Dissent bullet is the tracker's backlog sweep
`team/personas/grace.md:22` — "When a sprint is declared done with an issue nobody has opened since it was filed." `team/roles/tracker/SKILL.md:23` — "which open issues belong to nobody? Which were created by the user and never triaged?" The composer's containment test missed it because the words differ. It does not add friction the role lacks.

### S4. Status order stated three times in one role, and twice more in canon
`team/roles/tracker/SKILL.md:15` (Standard, five statuses in order), `:19` (Question: skipped a status), `team/roles/tracker/role.json` `status-flow` (same claim again). `CLAUDE.md` § Tracking and `docs/integrations/README.md` also carry the flow. Say it once in the Standard and let the check and the question cite it.

### S5. A trigger rule filed under Questions
`team/roles/tracker/SKILL.md:27` — "When a sprint's items are all Done or deferred, the boundary workflow runs; nobody has to ask." Not a question; it is the automatic sprint-boundary trigger (good that it survived). Move it to the Charter where the ceremonies are listed.

### S6. "Overwrite it whole" is a tool instruction wearing prose
`team/roles/product/SKILL.md:27` — "The only file you write is `docs/product-context.md`, and you overwrite it whole." The second clause is v2's "Write, not Edit" (`.claude/agents/pat.md:87`), which is a Claude Code tool distinction. A role names no harness vocabulary; either drop the clause (the correction-log requirement already forces a full rewrite) or put the path constraint in the adapter's `paths`.

## Clean

### C1. Elicitor fidelity
Every rule in v2 `.claude/agents/cam.md` that is not routing or a knob survived: 5 Whys (`elicitor/SKILL.md:21`), inversion (`:22`), constraint surfacing (`:23`), alternative framing (`:24`), the one-question rule (`:25`), orient/prioritise/probe/translate (`:29-32`), "better than fine" (`:33`), must-fix vs nice-to-have (`:15`), and the success metric (`:15`). The slash-command names at v2 `:33` were correctly generalised to "full discovery, design exploration, or planning" (`:37`).

### C2. Pat's proxy limits and conservative defaults
The full can/cannot table (v2 `pat.md:99-105`) survives as one sentence at `product/SKILL.md:27`; conservative defaults (v2 `:109-112`) at `:23`; the "outside proxy authority, log as deferred and stop" rule at `:23`. Nothing in the authority was weakened.

### C3. Grace's debt-escalation authority
`tracker/SKILL.md:24` and `:31` carry the 3+ sprint rule, P0 forcing over product preference, and the single override (explicit human deferral). The role description (`:3`) advertises it. Intact.

