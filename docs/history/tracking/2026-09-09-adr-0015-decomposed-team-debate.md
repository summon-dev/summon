---
agent-notes: { ctx: "Architecture Gate challenge record for ADR-0015 (Wei round 1)", deps: [docs/adrs/meta/0015-decomposed-team.md, docs/methodology/team-layers.md, team/README.md, docs/adrs/meta/0012-executable-canon.md], state: active, last: "claude@2026-09-09", key: ["Wei returned the record as a message: the challenger role must-not write:docs; the coordinator placed it (C10)", "2 blocking (C1 fixed formation, C2 dissent as source property), both answered with mechanisms in the same wave", "dispositions: 2026-09-09-adr-0015-decomposed-team-dispositions.md; Archie's independent review has not run"] }
---

# Architecture Gate Debate — ADR-0015 "The Decomposed Team" (2026-09-09)

**Status:** Round 1, Wei's challenge. Coordinator dispositions are in the companion file `2026-09-09-adr-0015-decomposed-team-dispositions.md`, kept separate so the sentinel below attests only to Wei's text. Direction endorsed; draft not ratifiable as written. 11 challenges, 2 blocking. Wei reviewed the tree before `scripts/compose-team.mjs` was committed; every claim that depended on it was marked unverifiable rather than false, and those are re-checked in the dispositions. Archie's independent review has not run. Wei's text is verbatim from the returned message; the challenger role cannot write files (see C10), so the coordinator placed it.

## C1 — The review formation is the fixed roster ADR-0012 C rejected

**Claim.** ADR §Composition: "Multi-persona formations ... are declared in the party and composed from the same lens sources, so the standalone reviewers and the formation cannot drift." §Consequences: "Issue #118's flattening complaint is answered at the source."

**Checked.** `team/parties/summon-core.json:13-24` — `review-party` is a static list of four `{persona, lens}` pairs. No trigger, condition, or `when` field. `team/` contains no operational or UX lens (grep for `Ines|operational|Dani|situational` returns only `architect/SKILL.md:23`, an unrelated word). The v2 composite it replaces carried a situational Ines lens (`.claude/agents/code-reviewer.md:72-76`). ADR-0012 sub-decision C, ratified: the review-wave roster is "computed from the diff by the script ... plus trigger-based conditional lenses (Dani on any UI change, migration-safety and API-compat when relevant) — not a hard-coded three-lens list; a fixed wrong roster would convert today's possible omission into a structural one."

**Objection.** The party file makes the roster a structural constant, which is the exact failure 0012 C named. It also silently drops a lens v2 had. "Cannot drift" is true of the four lenses that are present and says nothing about the lenses that are absent by construction. Nothing in the ADR reconciles this with 0012 C or marks C as amended.

**Counter-proposal.** Either (a) formations carry two lists, `floor` (always) and `conditional` (each with a trigger expression the 0012 review-wave workflow evaluates against the diff), and the composer emits the floor plus a manifest of conditionals; or (b) the ADR states in one sentence that the party formation is 0012 C's floor and the workflow adds lenses at invocation, and 0012 C's text is cross-referenced. Either way, add an `operational` lens under `team/roles/reviewer/lenses/` or record why Ines's lens was deleted.

**Severity:** blocking.

## C2 — "Dissent" as a required section does not touch the failure the post describes

**Claim.** ADR §Persona: "If a persona's dissent section is empty, the persona is decoration and should be cut." §Consequences: "Dissent becomes a required, inspectable section rather than an emergent property that quietly decays." Sequencing step 3: check-canon requires "a non-empty Dissent section."

**Checked.** The post (`/home/user/tech-blogger/published/i-killed-my-agent-team-2026-08-15.md`) locates the decay in two places, neither of them the source file: line 38, "my team was as sharp as it had ever been, and the room they were speaking into had changed shape" (agents not spawned; delegation suppressed by an injected prompt); line 112, "The metric that would have caught it was sitting in my own review artifacts the whole time: disagreement rate, trending to zero." Then the tree as shipped: `team/personas/vik.md:19-23` restates `team/roles/reviewer/lenses/simplicity.md:18` (one-implementation interface, one-value config, dependency-for-stdlib) in first person. `tara.md:20-23` restates `lenses/test-quality.md:10-11` and `roles/tester/SKILL.md:21-23` (existence vs content, mirrored direction, wall clock). `pierrot.md:19` restates `lenses/security.md:10` (silently dropped audit trail). `wei.md:16` opens "This persona is dissent," which is the challenger role's charter restated.

**Objection.** A non-empty-section check is passed by the wrong implementation that already exists in the tree: paste the lens bullets in first person. Dissent-as-text is a source property; the decay was a runtime property (agents not running, and when running, not splitting). The ADR promotes an inspectable *section* while the post's own instrument is an inspectable *rate*. This is the ritual the coordinator's question suspected: it will decay into boilerplate because it already is boilerplate in four of six files.

**Counter-proposal.** Move the mechanism to the output. (1) The composer ships a negative-control fixture: a known-bad diff with one planted defect per lens; a composed formation must return at least one finding per lens and at least one non-unanimous verdict, or the compose is marked degraded. (2) Every review artefact records verdict-per-lens; a script (0012 script layer) computes the disagreement rate over the last N reviews and it becomes reversal trigger 1 (C8). (3) Keep the Dissent section but change its rule to *additive*: a Dissent bullet that also appears in the bound lens or role is a check-canon failure, so the section can only hold what the lens does not already say. If that rule empties most Dissent sections, that is the finding, not a problem with the rule.

**Severity:** blocking.

## C3 — The role/persona seam leaks both ways, and the tree already trips the spec's own alarm

**Claim.** `team-layers.md:38` "A role contains no persona voice"; `:51` "A persona contains no capabilities, no tool names, and no process steps"; `:93` "If an edit seems to need two layers, the seam is probably in the wrong place. Say so in the ADR."

**Checked.** Persona sentences that are role: `sato.md:18-19` ("When the tests are missing. Will not write them; will say so and stop. / When a test looks wrong. Will not change it") are `coder/SKILL.md:36-38` Boundaries, i.e. process steps. `tara.md:24` "The veto is for exactly this" invokes a role mechanism (`tester/SKILL.md:41`). `pierrot.md:22` "Will run it" names a capability (`run`). Role sentences that are persona: `coder/SKILL.md:15` "Duplication is acceptable until the third occurrence; the wrong abstraction is not" is `sato.md:10` "Duplication is cheaper than the wrong abstraction." `architect/SKILL.md:27` "Never cite your own earlier recommendation as their preference" is `archie.md:11`, a scar from one incident, now in the portable charter.

**Objection.** Change the ladder and Vik's Dissent must change; change the coder's boundaries and Sato's Dissent must change. That is "every real edit needs both layers," and the spec's own rule says the ADR must then say so. It does not. Scale attack: the split pays where a role has more than one holder. Today that is one role (reviewer, four lenses). The remaining ten v2 personas (Cam, Grace, Pat, Ines, Dani, Debra, Diego, Prof, Cloud) each imply a role with exactly one holder; for those, role plus persona is two files saying one thing, and "sixteen files become forty" is underestimated.

**Counter-proposal.** Adopt the additive rule from C2 for Dissent and Priors: a sentence may live in exactly one of {role, lens, persona}, enforced by a near-duplicate check in check-canon (normalised sentence match is enough). State in the ADR that single-holder roles may carry their persona inline under a `persona:` block in `SKILL.md` until a second holder exists, so the split is earned per role rather than imposed on all sixteen. Remove the four duplicates cited above in this wave.

**Severity:** amend.

## C4 — The view layer's context saving is against a leak that never happened, and the view makes a claim about the work

**Claim.** ADR §Context item 4: each v2 file fused "the presentation. The archetype names and accents in the sprite bible, the Meet-the-Team grid, the alt text." §Alternatives: storing the view in the persona "costs context on every invocation." `team-layers.md:57` "Swapping skins changes nothing about the work."

**Checked.** Grep of `.claude/agents/` for `Warden|Forge-Knight|Nightblade|Sentinel Archer|Master Builder|sprite|accent|epithet|archetype`: zero hits in any agent file. The only source of that vocabulary is `site/src/components/TeamGrid.astro:13` (a hard-coded table) and `docs/history/design/team-hero-sprites-16bit.md`. `team/views/jrpg-16bit/party.json:40`: Pierrot "Holds a hard veto on security grounds." No role or persona in `team/` carries a Pierrot veto (grep `veto` hits only tester and challenger); v2 `personas.md:123` did.

**Objection.** The fourth layer was never in model context, so "never enters context" protects nothing that was at risk; the layer is TeamGrid's data file with an ADR around it. That relocation is still worth doing (step 5), but the ADR should argue it as de-duplicating the site, not as a prompt saving. Worse, the skin currently asserts a separation-of-duties mechanism (a security veto) that the work layer dropped. Either Pierrot's veto is real and belongs in a role, or the view lies about the work. Also, the `Tells` section is absent from the composition order (ADR line 55: voice, charter, lens, priors, dissent, boundaries, output), so it never reaches a prompt either; it is a reader-facing property, which is the definition of view.

**Counter-proposal.** Rewrite Context item 4 to say the presentation lived in the site, not the agent files, and drop the context-saving argument for the view. Decide Pierrot's veto: add it to the reviewer role (as the tester has one) or remove it from personas.md and the blurb. Move `Tells` to the view or into the composition order; do not leave a persona section that is neither. Note that `TeamGrid.astro` also needs `role` and `trigger` per member, which `party.json` does not carry; step 5 will need the party binding plus the role description, so say so.

**Severity:** amend.

## C5 — The adapter isolates one of the three things that killed v2

**Claim.** ADR §Harness adapter: "When a harness ships a release, the adapter is the file to reread ... nothing else should need to change." §Consequences: "A regime change invalidates one small JSON file." `claude-code.json:4` repeats the promise.

**Checked.** The post names three breakages. (1) `maxTurns`, `model: inherit`, allowlists: in the adapter. Yes. (2) The composite's fan-out across four sibling files under changing nesting and concurrency defaults (post line 36): the emission strategy for a formation (one file with four lenses, four spawns, or a workflow) is a composer decision; `claude-code.json` has no field for it. (3) The injected "do not call the AgentTool" plus the `CLAUDE.md` delegation mandate (post lines 28, 38): not in `team/` at all; the ADR does not say where the delegation policy lives. Also: frontmatter key names (`tools`, `disallowedTools`, `maxTurns`) are not in the adapter (`frontmatter` carries only `model: inherit`), so a renamed key, which the post cites Copilot doing, is a composer change. Also: `skills.json:3` carries `"fitted": false` while the spec (`team-layers.md:61`) says an adapter "carries `fitted: true`" and sequencing step 3 makes check-canon require it; the post itself (line 120) says skills are "still fitted to something."

**Objection.** The next regime change hits the adapter, the composer, and CLAUDE.md, in that order of likelihood, and the ADR promises it hits only the first. That is the same breakage with a JSON file in front of it.

**Counter-proposal.** Adapter gains `keys` (which frontmatter keys carry allow, deny, budget, model), `formation` (`single-file | fan-out | workflow`), and `delegation` (the harness-specific text, if any, the composer emits into CLAUDE.md or a hook). Make `fitted` a required `true` on every adapter and put the honesty in `review`; or rename it `fitted_to` with a value. Add a composer test: for each adapter, compose twice with two different adapter files and assert the diff touches only frontmatter and paths. That test is the isolation claim made falsifiable.

**Severity:** amend.

## C6 — The enforcement report is a label, and it is asserted, not probed

**Claim.** ADR §Enforcement report: the composer "records whether the target harness can enforce it at the tool layer or only by prose"; the report "makes the post's open question ... a number per harness instead of an impression."

**Checked.** By `claude-code.json:12-14`, `write:src`, `write:tests`, `write:docs` all map to `Write, Edit`. So on Claude Code: reviewer and challenger are tool-enforced; architect, coder, and tester, the three roles whose boundary the post actually cares about, are prose. And they were prose in v2 too: `.claude/agents/tara.md:8` is `tools: Read, Write, Edit, Bash, Grep, Glob` with no `disallowedTools`; `sato.md:8` likewise. The post's line 68 ("my testing agents could not touch non-test code") describes an enforcement that was never in the files. ADR line 94 concedes this obliquely ("implied enforcement they did not have") without saying the post is wrong. Compare ADR-0012 E, my own demand there: enforcement level recorded per *probed* capability because "an adapter README nobody reads at invocation time is a disclaimer, not a sensor." This report is computed from the adapter JSON and the assumption that the harness honours `disallowedTools`, which is a runtime property that moved twice this summer.

**Objection.** "Prose" in a report changes no agent's behaviour and no coordinator's. The report is the disclaimer 0012 E rejected, one layer down. And the ADR should state plainly that the two boundaries the post wants to keep are prose on both v2 and v3 Claude Code, because the post is the human's evidence base and it is wrong on this point.

**Counter-proposal.** (1) Three levels, matching 0012 B's ladder: `tool`, `hook`, `prose`. (2) Adapter carries `paths` per write capability (`write:tests` → globs), so a PreToolUse hook can be composed from the same source as the role, and the row flips to `hook` when it is installed; without this the eventual hook will define "tests" differently from the role. (3) `doctor`, not the composer, owns the final column: it probes whether `disallowedTools` is honoured on this install (0012 E's registry entry), and the composer's report is its input. (4) One sentence in Context correcting the post's line 68.

**Severity:** amend.

## C7 — This ADR supersedes the register stack; "whichever lands second renumbers" is not the honest description

**Claim.** ADR line 11: numbering collision with "#105, #120, #131"; nothing else changes. Line 28: "#105, #116." Line 99: "#106, #116."

**Checked.** Three different PR lists in one document. Substantively: line 75 rejects the register stack's direction; line 99 declares its sensor `checkVoiceDelivery` "superseded" (not present in `scripts/` on this branch, consistent with it being unmerged); line 68 turns `personas.md`, that stack's source of truth, into rendered output. I cannot read the PRs from here, so the supersession is inferred from the ADR's own text, not verified against them.

**Objection.** That is a supersession of an architecture, not a collision over an integer. Leaving it as "renumbers on rebase" invites someone to rebase #105 onto this and land two ADRs that contradict each other on what `personas.md` is.

**Counter-proposal.** A **Supersedes** line: "Supersedes the register stack's ADR-0015/0016 as proposed on #105/#116/#131 (fix the list once). Those PRs close or rebase as persona-layer contributions; their voice work lands as `Voice` sections; `checkVoiceDelivery` is replaced by the composer test." State who told the stack's author.

**Severity:** amend.

## C8 — No reversal triggers on an ADR that rejects five alternatives

**Claim.** None; the section is absent. ADR-0012 §Reversal triggers, on my demand: "the ADR rejecting it must too."

**Checked.** `docs/adrs/template.md` has no reversal-trigger heading (grep empty), so the template does not force it; 0012 did it anyway and this ADR cites 0012 as its parent.

**Objection.** Without triggers, "skills only" and "patch the sixteen files" are grandfathered rejections. The human has been running skills-only for three weeks and it is working (post line 118); that alternative deserves a falsifiable condition for coming back.

**Counter-proposal.** 90-day checkpoint (2026-12-08), or earlier if tripped:
1. **Consensus returns.** The composed review-party fails the negative-control fixture (C2), or returns unanimous verdicts on ten consecutive real reviews. The persona layer is not producing dissent; re-argue Alternative 2 (skills only) on the evidence.
2. **Two-layer edits.** Three or more of the first ten edits under `team/` touch a role and its bound persona together. The seam is wrong (C3); re-argue the split or adopt inline personas for single-holder roles.
3. **Adapter leak.** A harness or model release forces a change outside `team/harness/`. The isolation claim (C5) failed; re-scope what the adapter carries.
4. **Generated-file drift.** `compose --check` finds `.claude/agents/` hand-edited, or the composer grows a dependency. ADR-0006's projection discipline did not hold on Summon's own runtime surface; consider shipping composed output as the source.
5. **Portability unproven.** The bake-off runs a role on a second harness only after editing a `SKILL.md` body. "Portable" was aspirational; the role layer is fitted too, and the ADR's central positive consequence is withdrawn.

**Severity:** amend.

## C9 — Present-tense claims about things that do not exist

**Claim.** `team/README.md:25` "`build/` is gitignored." `README.md:21` `pnpm team:compose`. ADR line 49 and `team-layers.md:55`: "a test pins that" (view never in composed output). ADR line 9: "Wei's challenge is recorded at ..." (this file, before it existed).

**Checked.** `/home/user/summon/.gitignore`: no `build/` entry (has `dist/`, `.astro/`). `package.json`: only `check:canon`; no `team:compose`. `scripts/compose-team.mjs`: absent (Glob). No test file. `scripts/check-canon.mjs`: no `Dissent`, `fitted`, or `team/` rule (expected, that is step 3, but the spec reads as if it were present). Every `agent-notes` in the ADR, spec, and `team/README.md` lists `scripts/compose-team.mjs` as a dep.

**Objection.** These may all be mid-write, and the coordinator said so. But a Proposed ADR should not read as if its sensors exist. Archie's own standard (`architect/SKILL.md:15`) is a record a stranger can read in a year; a stranger reading "a test pins that" would look for the test.

**Counter-proposal.** Future tense for everything in sequencing step 1 that has not landed, or land the script, its test, the `package.json` entry, and the `.gitignore` line before ratification, whichever is sooner. Add a check-canon rule that an `agent-notes` dep must resolve to a file.

**Severity:** amend.

## C10 — Who writes the gate record, and where do review documents go

**Claim.** `challenger/SKILL.md:3` "writes nothing"; `challenger/role.json` `must-not: [run, write:src, write:tests, write:docs]`. `reviewer/role.json` `must-not: [write:src, write:tests, write:docs]`.

**Checked.** This gate's instruction told Wei to write this file. The v2 adapter gives Wei no Write tool (`wei.md:7-8`); the ADR-0012 gate record line 5 recorded that "the returned message is the artifact." The v2 composite reviewer wrote review documents with a completion sentinel to `docs/code-reviews/` (`code-reviewer.md:104-160`); the v3 reviewer role cannot write anything, and the ADR does not say what replaces the review document or the sentinel (0012 says outputs become schema-constrained; nothing here binds to that).

**Objection.** The ADR's passive voice ("is recorded at") hides a process that contradicts its own role file, and the same contradiction is repeated live in this session. Separately, `team-governance.md:92` still cites `docs/tracking/` for the debate artefact, the stale path 0012 Archie M2 flagged; it is still stale.

**Counter-proposal.** One sentence in the spec: gate records and review documents are written by the coordinator (or the 0012 review-wave workflow) from the returned message; challengers and reviewers do not write. Or scope `write:docs` for those roles to a directory in the adapter. Fix the governance path while touching it.

**Severity:** note.

## C11 — What does the scaffolder ship, and 0012 F is amended, not neutral

**Claim.** ADR §Negative: "`.claude/agents/` stops being hand-editable ... the adapter carries per-project overrides." §Neutral: 0012 F's trigger "becomes measurable."

**Checked.** `packages/summon-team/src/`: no reference to `team/`, compose, or SKILL beyond the impeccable add-on. The ADR does not say whether `npx summon-team` ships `team/` plus the composer (install gains a build step and Node on the path for a Markdown product) or composed output (downstream users get fused files with the seam gone, which is v2's shape). 0012 F said "personas stay" as agent files; this ADR makes them a layer that the `skills` target drops entirely, which is a change to F's substance.

**Objection.** Cost of being wrong depends on which the scaffolder ships, and the ADR defers the question it most needs to answer for anyone other than the human. And "neutral" understates an amendment to a ratified sub-decision.

**Counter-proposal.** Decide: ship `team/` and composer, with `summon-team` running compose at install and `doctor` running `compose --check`. Mark 0012 F as amended by this ADR, in both files.

**Severity:** note.

## Honest assessment

The direction is right and it is the correct reading of the post: the lenses are the deep parameters, the knobs were the fitted curve, and separating them is the only move that lets the next regime change kill one file instead of sixteen. The `team/` tree is better prose than the v2 files it replaces; the reviewer role with four lenses is a real improvement and the enforcement report is more honest than v2's allowlists. I would not argue for skills-only as the end state.

But the draft claims more than the tree delivers. Its central mechanism against the consensus-decay failure is a section in a source file, and the tree already shows that section filled with paraphrases of the lens; the post's own instrument was a rate in the output, and the ADR does not build it. The formation regresses against a ratified sub-decision. The adapter isolates one of the three breakages the post catalogued. Several sensors are described in the present tense and do not exist. None of this is an argument against the decomposition; it is an argument that the decomposition is being asked to carry a promise (dissent survives the next regime) that only a runtime check can carry. Fix C1 and C2 with mechanisms, not wording, and the rest with amendments, and I will withdraw on the record.

WEI-COMPLETE: 11 challenges, 2 blocking
