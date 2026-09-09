---
agent-notes: { ctx: "ADR: v3 team decomposed into role / persona / view layers plus a fitted harness adapter, composed by script; checks split deterministic from judged", deps: [docs/adrs/template.md, docs/adrs/meta/0012-executable-canon.md, docs/adrs/meta/0007-canon-meta-boundary.md, docs/adrs/meta/0006-multi-runtime-install.md, docs/methodology/team-layers.md, team/README.md, scripts/compose-team.mjs, docs/history/tracking/2026-09-09-adr-0015-decomposed-team-debate.md, docs/history/tracking/2026-09-09-adr-0015-decomposed-team-dispositions.md, team/events.json, team/lines/tdd.json, scripts/team-log.mjs], state: draft, last: "claude@2026-09-09", key: ["four layers, three of them portable; the harness adapter is the only file allowed to be fitted", "runtime: event log (deep parameter), line (stations + separation constraint over the log), work order (deferred); view splits into skin + renderer", "checks: role claims a command can decide, bound per project; the rest is judgment", "supersedes the register stack (#95 #105 #116 #120 #131) by the human's direction", "Wei round 1: 11 challenges, 2 blocking, dispositions in the debate record; Archie's review has not run"] }
---

# ADR-0015: The Decomposed Team — Role, Persona, View, and the Fitted Adapter

## Status

**Proposed** (2026-09-09); direction approved by the human the same day ("fold into 15 and go, I approve"), including the runtime section below. Authored in Archie's seat by the coordinator after the v2 roster was deprecated on 2026-08-18. Ratification still requires the Architecture Gate to complete. Wei's round-1 challenge (11 items, 2 blocking) is at `docs/history/tracking/2026-09-09-adr-0015-decomposed-team-debate.md` and the coordinator's dispositions at `2026-09-09-adr-0015-decomposed-team-dispositions.md` beside it; both blocking items were answered with mechanisms in the same wave. Archie's independent review has not run. Cutover of `.claude/agents/` (§ Sequencing, step 4) waits on ratification; the human directed that on 2026-09-09.

**Supersedes** the communication-register stack as proposed on #95, #105, #116, #120, and #131 (their ADR-0015 and ADR-0016), by the human's direction on 2026-09-09. Those PRs' voice work lands here as the persona layer's Voice sections; their `checkVoiceDelivery` sensor is replaced by the composer's own tests, since delivery is now by construction; `personas.md` becomes rendered output rather than a source. The human is the stack's author and closes or rebases those PRs. This ADR takes the 0015 number on `main`, where `check-canon` requires contiguity after 0014.

**Zone: meta** (ADR-0007 § 1). This ADR is about how Summon builds its own team. The layer spec it introduces, `docs/methodology/team-layers.md`, is canon: a scaffolded project practices the layering, and its agents are built from it.

**Amends ADR-0012 sub-decision F.** Personas stay, as 0012 F decided, but as a detachable layer composed onto roles rather than as agent files; the `skills` target drops them entirely. 0012 F's revisit trigger now reads against the composed role-only and role-plus-persona variants, which makes the overhead it keys on measurable. The amendment is noted in 0012 as well.

## Context

Summon v2 shipped sixteen agent files. Each one fused three different kinds of content into a single Markdown document that became a subagent's system prompt, and a fourth kind lived beside it in the site:

1. **The work.** What a reviewer checks, what a tester writes, what an architect owns. Vik's laziness ladder; Tara's red-phase pre-flight; Pierrot's "if an attacker saw this diff" question.
2. **The point of view.** Who this is. The veteran who has watched three teams build the same abstraction. The precision about edge cases. The dark humour.
3. **The harness controls.** `tools`, `disallowedTools`, `model: inherit`, `maxTurns`, the fan-out across four sibling files, the completion-sentinel apparatus, the delegation mandate in `CLAUDE.md`.
4. **The presentation.** The archetype names, accents, and sprites, which lived in the site's `TeamGrid.astro` and the sprite bible as a hand-copied table, never in the agent files.

The deprecation notice and the post it links to (*I Killed My Agent Team*, 2026-08-15) diagnosed what happened when the model and harness underneath moved: layer 3 expired and took the file with it, because there was no seam between it and the other two. Every fitness question the post proposes asking (does the tool still fit the task, the model, the harness) had to be asked of a file that answered all three at once. The lenses in layer 1 were still true about the codebase. The voices in layer 2 had flattened, which was the visible symptom. The knobs in layer 3 were what had actually broken. Nobody could kill one without killing the others, so the whole roster was killed.

The post also named two ideas it was not willing to discard and not yet entitled to keep: per-role context isolation, and enforced separation of duties. One correction to the post is owed here, and Wei found it: the post says the v2 testing agents "could not touch non-test code," and the v2 files say otherwise. Tara's file had `tools: Read, Write, Edit, Bash, Grep, Glob` and no `disallowedTools`; the boundary was prose in v2 too. Both ideas need a home that outlives the harness, and a way to measure whether a given harness actually enforces them or merely reads about them.

Two decisions frame this one. ADR-0012 sub-decision F kept the personas on product grounds, with a revisit trigger keyed on measured persona overhead. ADR-0012 sub-decision B classified every methodology rule by the cheapest layer that makes it deterministic, and the human's direction for v3 makes that split a property of each role: what a command can decide is declared as a check; what only judgment can decide stays prose, and the team spends model effort only on the second half.

## Decision

Summon v3 authors the team as **four layers in separate files** and **composes** them into harness-specific output with a script. Three layers are portable and belong to the work; the fourth is fitted to a harness and is the only place fitted content is allowed to live. Every role additionally declares its **checks**, the claims a command can decide, and a project binds those to commands.

| Layer | Holds | Example | Portable | Loaded into model context |
|---|---|---|---|---|
| **Role** | The work and the standard it must meet. Boundaries stated as facts about the work. Checks a command can decide. | `reviewer`, `coder`, `tester` | Yes. Agent Skills format. | Yes |
| **Persona** | A named point of view on a role: priors, what it argues beyond the lens, its voice. | Vik, Sato, Tara | Yes. Plain Markdown. | Yes, when bound |
| **View** | The human-facing skin: class, epithet, accent, sprite. | The Grey Warden, The Forge-Knight | Yes. JSON. | **Never** |
| **Harness adapter** | Tool names, frontmatter keys, budgets, paths, output locations. | `claude-code`, `skills` | **No, by declaration** | Indirectly, as frontmatter |

A **party** file binds them: each member names a role, optionally a lens within that role, and a persona that holds that seat; formations name a floor of lenses and a set of conditional lenses with triggers; the party names a view and a harness. `scripts/compose-team.mjs` reads a party and emits the harness's artefacts plus two reports. The full spec is `docs/methodology/team-layers.md`; what follows is the decision, not a copy of it.

### The layers, precisely

**Role.** A directory `team/roles/<role>/` holding `SKILL.md` (Agent Skills frontmatter; body sections Charter, Standard, Questions, Boundaries, Output, all required) and `role.json` (capabilities the role `may` use, capabilities it `must-not` use, `lenses`, `checks`). Capabilities are abstract verbs about the work, never tool names. Lenses live in `lenses/<lens>.md` so one role can be held by several personas without duplicating the shared charter. The test for whether a sentence belongs in a role: would it be true of this work if the model and harness were swapped tonight?

**Checks.** A check is `{ id, claim, lens? }` on a role: a claim a command can decide. `team/checks.json` binds ids to `{ run, receipt }` for one project. The composer joins them: a bound check is emitted into the agent with its command and the receipt to paste, graded deterministic; an unbound one is emitted as a claim to judge, graded inferential, using the done gate's proof grades. The claim is portable; the command is not; that is why they live in different files. The composer wires checks and does not run them; the runner is sequenced after ADR-0012's receipt schema. This is the human's stated v3 capability: each role decomposes into what a script decides and what the model judges, and the report says how much of each.

**Persona.** One file `team/personas/<persona>.md` with frontmatter `name`, `role`, optional `lens`, optional `holds` (every seat the persona may take), `display`. Four required sections: Priors, Dissent, Voice, Tells. Dissent is governed by the **additive rule**: it holds only what the role and lens do not already say, and the composer refuses a bullet whose content is mostly contained in a lens or role sentence. Wei's C2 established why: a required section is passed by pasting the lens in the first person, which four of the six first-draft personas had done. The additive rule makes the section cost something to fill. Whether dissent survives at runtime is measured separately, by the reviewer role's `disagreement-rate` and `negative-control` checks, and reversal trigger 1 keys on those.

**View.** A directory `team/views/<skin>/` holding `party.json`, keyed by persona. Views feed the site, the roster printout, and any header the human sees. The composer refuses to place view content in an agent file; a test pins that. The layer's value is de-duplication (the site and roster read one file) and swappability, not a prompt saving; the presentation was never in the v2 agent files.

**Harness adapter.** One file `team/harness/<harness>.json`, always `"fitted": true`, with `review` naming what invalidates it. It maps capabilities to tool names, names the frontmatter keys for allow, deny, and budget, sets budgets and fixed frontmatter, carries `paths` (globs per write capability, so a hook can later be composed from the same source as the role), and declares how formations are emitted. It is the only file in `team/` that may mention a vendor's product. The claim that only this file changes on a harness release is falsifiable and tested: composing the fixture party on two adapters with every fitted value different yields byte-identical agent bodies. What the adapter does not isolate: the delegation policy a harness injects at the session level, which no file in the team can counter, and which the post recorded as the third breakage. When a harness needs delegation text, it goes in the adapter's `delegation` field; Claude Code's is `null` and the ADR says so rather than pretending.

### Composition

For each party member, the composer emits one agent artefact: adapter frontmatter (tools from the role's `may`, disallowed from its `must-not`, budget and keys from the adapter) followed by the persona's Voice, the role's Charter and Standard, the Checks, the role's Questions, the bound lens, the persona's Priors, Dissent, and Tells, and the role's Boundaries and Output. **Formations** carry a floor of lenses that always apply and conditional lenses with `when` triggers; the formation is told to say which conditionals it applied. This is ADR-0012 C's review-wave roster made concrete: the party is the floor, the conditionals are the diff-computed additions, and the workflow that evaluates the triggers is sequenced there. The first conditional is Ines's operational lens, which the v2 composite carried and the first draft of this tree had dropped.

The `skills` adapter emits roles alone as `SKILL.md` folders and no personas. That is the configuration the human has been running since the kill, and it is now a first-class target rather than a manual conversion.

### The enforcement report

For every `must-not` boundary in every member, the composer records whether the target harness can enforce it at the tool layer or only by prose. On Claude Code, `write:src` and `write:tests` both map to `Write` and `Edit`, so a tester who may write tests but must not write source is **prose-enforced**; a reviewer who must not write at all is **tool-enforced**. A third level, **hook**, is reserved for a boundary enforced by a hook composed from the adapter's `paths`; the composer cannot probe whether one is installed, so that column belongs to `doctor` under ADR-0012 E. The report is a label, as Wei said; its use is that the label is now computed from the same source as the agent, and the prose rows are the exact work list for the hook layer. The report also counts checks, bound and judged, per member.

### The runtime: event log, line, and work order

The human's broader vision is teams of testers, coders, and reviewers stamped out at scale, watched through views that range from a Factorio assembly line to an RTS battlefield to a tmux wall of panes, with everything under the view staying the same. That holds only if one thing exists between the team and its views: a record of what the team did that no harness owns. Three objects carry it.

**The event log.** `.summon/team-log.jsonl`, one JSON object per line, schema in `team/events.json`: every event carries `t`, `seat`, `event`, and optionally `instance` and `item`; the event types are `spawn`, `claim`, `check`, `finding`, `verdict`, and `return`. The log is the deep parameter here. A tmux wall is nearly free because it is the raw harness output; an assembly line or a battlefield needs structured events, and without a harness-independent schema each renderer would parse a vendor's transcript, which is the fitted curve in a costume. The same log serves the runtime checks: the reviewer's `disagreement-rate` reads verdict events, so the post's decay metric is now a bound, deterministic check rather than a judged claim. `scripts/team-log.mjs` validates and appends events, computes the rate, checks a line's constraints, and renders the dullest view, a table by seat instance. Seats are told to write events by a `Log` section the composer emits when a project configures a log path.

**The line.** Maker-checker only means something per work item: the instance that coded item X must not review X, and the tests for X exist before the coder sees X. That is an assembly line with stations, ordering, and a separation constraint, and today it lives as prose in the phase model. `team/lines/<line>.json` names stations bound to seats, the artefacts handed between them, and constraints (`order`, `distinct-instance`). A party opts into lines; the composer refuses a line whose station names a seat the party does not compose. `team-log.mjs check --line tdd` enforces the constraints over the log, which makes the separation-of-duties boundary that Claude Code cannot enforce at the tool layer enforceable at the log layer, per item, after the fact. That is the honest shape of the answer to the post's enforcement gap until a hook exists: not prevented, but detected, deterministically.

**The work order.** Scale is a dispatch concern, not a party concern. The party says who may hold which seat; a work order says how many instances of a seat run against which items. One composed definition spawned N times, each in its own worktree, is what a harness does anyway, so stamping out fifty coders is N spawns of one file, not fifty party entries. Parallelism limits (concurrency, nesting depth) are exactly the knobs that moved twice this summer and belong in the harness adapter's `dispatch` field, expected to expire. The work order's schema is deferred to the wave that builds the dispatch workflow; the log already carries `instance` so its output has somewhere to land.

**The view, split.** What this ADR first called the view is a **skin**: static presentation data keyed by persona, formation, and now role, so a persona-less instance on the line has a class and an accent. A **renderer** reads the log and a skin and draws the team in motion. The table renderer ships now; the tmux wall, the assembly line, and the battlefield are renderers over the same rows. Personas detach for throughput seats and attach for judging seats, which the composer already supports; at scale the disagreement rate stops being an impression and becomes a statistic with enough samples to trust.

### Sequencing

1. This ADR, the canon spec, the `team/` tree for the implementation trio and the review formation, the composer with tests, the `skills` and `claude-code` adapters, the checks bindings for this repo. (Landed.)
2. The event log as canon: schema, the log tool (append, check, dissent, render), the `tdd` line with its constraints checked over the log, the `disagreement-rate` and `line-respected` checks bound to it, the table renderer, role-level skin entries. (Landed, same day, on the human's approval.)
3. Remaining personas and roles ported one at a time, each port a diff against its v2 file that classifies every sentence as role, persona, view, adapter, check, or delete. The delete column is expected to be the largest.
4. `check-canon` learns the new tree: a party binding must resolve, an adapter must carry `fitted: true`, view text must not appear in composed output, an `agent-notes` dep must resolve to a file, the log validates. The composer and the log tool already enforce most of these at run time; check-canon makes them CI facts.
5. The check runner: executes bound checks, binds receipts to a tree state per ADR-0012's receipt schema, and writes `check` events to the log. The `negative-control` fixture (a planted-defect diff the formation must not wave through) lands with it.
6. The line as a workflow script over seats (ADR-0012 C), with the per-item separation constraint enforced at dispatch rather than detected after; work orders and the adapter's `dispatch` limits land here.
7. Cutover: `.claude/agents/` becomes composer output, gitignored or generated in CI, and `personas.md` becomes a rendered roster rather than a source. Requires ratification and a fidelity read of the composed files against the v2 originals. `check-canon`'s agent-file checks are taught the composed shape first.
8. The scaffolder ships `team/` and both scripts, runs compose at install, and `doctor` runs `compose --check`. A downstream project gets the layers, not fused output.
9. Renderers over the log: the tmux wall first, then the assembly line and the battlefield, all reading the same rows and the same skin. Site `TeamGrid.astro` reads the skin plus the party binding instead of its own hard-coded table.

### Reversal triggers (90-day checkpoint: 2026-12-08)

Per Wei's C8, adopted verbatim. At the checkpoint, or earlier if tripped:

1. **Consensus returns.** The composed review formation fails the negative-control fixture, or `team-log.mjs dissent --last 10` reports a rate of zero over ten judged items. The persona layer is not producing dissent; re-argue Alternative 2 (skills only) on the evidence.
2. **Two-layer edits.** Three or more of the first ten edits under `team/` touch a role and its bound persona together. The seam is wrong; re-argue the split or adopt inline personas for single-holder roles.
3. **Adapter leak.** A harness or model release forces a change outside `team/harness/`. The isolation claim failed; re-scope what the adapter carries.
4. **Generated-file drift.** `compose --check` finds `.claude/agents/` hand-edited, or the composer grows a dependency. ADR-0006's projection discipline did not hold on Summon's own runtime surface; consider shipping composed output as the source.
5. **Portability unproven.** The bake-off runs a role on a second harness only after editing a `SKILL.md` body. "Portable" was aspirational; the role layer is fitted too, and this ADR's central positive consequence is withdrawn.

## Alternatives Considered

- **Patch the sixteen files** against the Opus 5 migration notes and the harness changelog. Rejected: this is the fix branch of the fix-or-kill decision the human already made, and it leaves the layers fused, so the next regime change repeats the whole episode.
- **Skills only, no personas** (the human's current interim setup). Rejected as the end state, kept as a target: it discards the dissent layer, and the post's own decay metric was the disagreement rate. A persona layer that can be attached or detached is strictly more than a skills folder. Reversal trigger 1 is the condition for this alternative coming back.
- **Personas as the source, roles derived** (the register stack's direction: `personas.md` projects into agent files). Rejected and superseded: it makes the least portable layer the root. Roles are what survive; personas bind to them.
- **Inline personas for single-holder roles** (Wei's C3 counter-proposal: a `persona:` block in `SKILL.md` until a second holder exists). Rejected: the `skills` target needs the role alone, which is the whole reason the persona is a separate file; a role with its persona inline is not emittable voiceless without a parser that knows the block, which is the composer again. The cost of two files saying one thing is real and is priced below; reversal trigger 2 watches it.
- **Store the view in the persona file.** Rejected: the site and the roster want one data file, and the skin should be swappable without a persona edit.
- **One adapter format for all harnesses** via ADR-0006's projection generator. Deferred: the composer is that generator for the agent layer, but it emits per-harness originals from a shared source rather than projecting one harness's files into another's. ADR-0006's manifest still records what was installed; this ADR changes what the source is.

## Consequences

### Positive

- The three-question fitness audit maps onto files: task fit is a role edit, model fit is a persona edit, harness fit is an adapter edit. A regime change invalidates one small JSON file, and a test says whether that claim held.
- Each role is split into what a command decides and what the model judges, and the report gives the ratio per project. Work that a script can prove is never spent as model judgment.
- The role layer is runnable anywhere that reads the Agent Skills spec, which makes the bake-off the post promised a `--harness` flag rather than a rewrite.
- Separation of duties and context isolation have a portable home, and the enforcement report says per harness whether they are enforced or merely described, with the prose rows as the hook layer's work list.
- Dissent is a section that costs something to fill, by rule, rather than an emergent property that quietly decays; and its runtime survival is a check with a reversal trigger behind it.
- The team has a runtime record no harness owns. Every view renders from it, the decay metric reads from it, and the per-item separation constraint is checked over it, so "the view varies and the rest remains" is a property of the log rather than a hope.
- The composite reviewer stops being a hand-maintained fan-out file and becomes a formation composed from the same lenses as its members, with conditional lenses declared rather than forgotten. Issue #118's flattening complaint is answered at the source.

### Negative

- **Generated files.** `.claude/agents/` stops being hand-editable after cutover. A downstream user who tweaks a composed file loses the tweak on the next compose. Mitigation: edit the layer, not the output. This is ADR-0006's projection discipline applied to Summon's own runtime surface, and reversal trigger 4 watches it.
- **More files per persona.** Sixteen files become roughly fifty once checks bindings and lenses are counted. The composer and `check-canon` carry the burden of keeping them coherent that a single file carried by being one file. For single-holder roles the split is two files saying one thing; reversal trigger 2 watches it.
- **A new script on the load-bearing path.** The team does not exist until the composer runs. It is zero-dependency Node with tests, but it is code, and it is canon.
- **Prose-enforced boundaries are named as such.** Some users will read "prose" in the enforcement report as "unenforced" and rip out the persona layer. That reading is correct today for those rows, and the report is more honest than the v2 allowlists, which implied enforcement they did not have.
- **The additive rule is crude.** Content-word containment catches a pasted lens and nothing subtler; a paraphrase with different words passes. It is a floor, not a judge, and a reviewer reading a persona still has to ask whether the Dissent adds anything.
- **The log is written by the seats themselves.** A `claim` or `verdict` a seat forgets to append is work nobody can see, and the disagreement rate is computed over what was written. Until the check runner (step 5) and the dispatch workflow (step 6) write `check` and `spawn` events from outside the model, the log is self-reported, which is the same limit ADR-0012's tamper boundary names. The line check detects a violated constraint after the fact; it does not prevent one.
- **Checks bindings are per project.** A scaffolded project starts with every check unbound, and therefore judged, until someone binds commands. The report makes that visible; it does not make it happen.

### Neutral

- Nothing in this ADR changes the phase model or the done gate. The proof grades the checks use are the done gate's.
- The register stack's voice work (#106, #116) becomes the Voice section of each persona file.
- Gate records and review documents are written by the coordinator from a reviewer's returned message; reviewers and challengers do not write files. That was true in practice under 0012 and is now stated in the spec.
