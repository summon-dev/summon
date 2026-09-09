---
agent-notes: { ctx: "ADR: v3 team decomposed into role / persona / view layers plus a fitted harness adapter, composed by script", deps: [docs/adrs/template.md, docs/adrs/meta/0012-executable-canon.md, docs/adrs/meta/0007-canon-meta-boundary.md, docs/adrs/meta/0006-multi-runtime-install.md, docs/methodology/team-layers.md, team/README.md, scripts/compose-team.mjs], state: draft, last: "claude@2026-09-09", key: ["four layers, three of them portable; the harness adapter is the only file allowed to be fitted", "view never enters model context", "composer reports enforcement level per boundary: tool / prose", "numbering: 0015 also claimed by unmerged #105 — whichever lands second renumbers"] }
---

# ADR-0015: The Decomposed Team — Role, Persona, View, and the Fitted Adapter

## Status

**Proposed** (2026-09-09). Authored in Archie's seat by the coordinator, on the human's direction, after the v2 roster was deprecated on 2026-08-18. Ratification requires the Architecture Gate: Wei's challenge is recorded at `docs/history/tracking/2026-09-09-adr-0015-decomposed-team-debate.md`; Archie's independent review has not run. Cutover of `.claude/agents/` (§ Sequencing, step 4) waits on ratification.

**Numbering.** `main` carries ADRs 0001–0014 and `check-canon` requires contiguity, so this is 0015. The unmerged register stack (#105, #120, #131) also claims 0015 and 0016 on its own branches. Whichever of the two lands second renumbers on rebase; nothing links to this ADR by number yet.

**Zone: meta** (ADR-0007 § 1). This ADR is about how Summon builds its own team. The layer spec it introduces, `docs/methodology/team-layers.md`, is canon: a scaffolded project practices the layering, and its agents are built from it.

## Context

Summon v2 shipped sixteen agent files. Each one fused four different kinds of content into a single Markdown document that became a subagent's system prompt:

1. **The work.** What a reviewer checks, what a tester writes, what an architect owns. Vik's laziness ladder; Tara's red-phase pre-flight; Pierrot's "if an attacker saw this diff" question.
2. **The point of view.** Who this is. The veteran who has watched three teams build the same abstraction. The precision about edge cases. The dark humour.
3. **The harness controls.** `tools`, `disallowedTools`, `model: inherit`, `maxTurns`, the fan-out across four sibling files, the completion-sentinel apparatus, the delegation mandate in `CLAUDE.md`.
4. **The presentation.** The archetype names and accents in the sprite bible, the Meet-the-Team grid, the alt text.

The deprecation notice and the post it links to (*I Killed My Agent Team*, 2026-08-15) diagnosed what happened when the model and harness underneath moved: layer 3 expired and took the file with it, because there was no seam between it and the other three. Every fitness question the post proposes asking (does the tool still fit the task, the model, the harness) had to be asked of a file that answered all three at once. The lenses in layer 1 were still true about the codebase. The voices in layer 2 had flattened, which was the visible symptom. The knobs in layer 3 were what had actually broken. Nobody could kill one without killing the others, so the whole roster was killed.

The post also named two ideas it was not willing to discard and not yet entitled to keep: per-role context isolation, and enforced separation of duties (a tester who cannot edit source). Both were expressed in v2 only as tool allowlists, which is the fitted layer. They need a home that outlives the harness, and a way to measure whether a given harness actually enforces them or merely reads about them.

ADR-0012 sub-decision F kept the personas on product grounds, with a revisit trigger keyed on measured persona overhead. The register stack (ADR-0015 as numbered on #105, #116) tried to deliver the voices into the agent files as a projection from `personas.md`, which is the right instinct applied one layer too late: it projects a persona into a file that is still mostly harness.

## Decision

Summon v3 authors the team as **four layers in separate files** and **composes** them into harness-specific output with a script. Three layers are portable and belong to the work; the fourth is fitted to a harness and is the only place fitted content is allowed to live.

| Layer | Holds | Example | Portable | Loaded into model context |
|---|---|---|---|---|
| **Role** | The work and the standard it must meet. Boundaries stated as facts about the work. | `reviewer`, `coder`, `tester` | Yes. Agent Skills format. | Yes |
| **Persona** | A named point of view on a role: priors, what it argues against, its voice. | Vik, Sato, Tara | Yes. Plain Markdown. | Yes, when bound |
| **View** | The human-facing skin: class, epithet, accent, sprite. | The Grey Warden, The Forge-Knight | Yes. JSON. | **Never** |
| **Harness adapter** | Tool names, turn budgets, frontmatter keys, output paths. | `claude-code`, `skills` | **No, by declaration** | Indirectly, as frontmatter |

A **party** file binds them: each entry names a role, optionally a lens within that role, a persona, and the party names a view and a harness. `scripts/compose-team.mjs` reads a party and emits the harness's artefacts plus two reports.

### The layers, precisely

**Role.** A directory `team/roles/<role>/` holding `SKILL.md` (Agent Skills frontmatter: `name`, `description`; body: charter, standard, questions, output shape) and `role.json` (machine-readable: capabilities the role `may` use, capabilities it `must-not` use, optional `lenses`). Capabilities are abstract verbs about the work (`read`, `run`, `write:src`, `write:tests`, `write:docs`, `web`), never tool names. A role with several lenses keeps each lens in `lenses/<lens>.md`, so one role can be held by several personas without duplicating the shared charter. A role file contains no harness vocabulary and no persona voice. The test for whether a sentence belongs in a role: would it be true of this work if the model and harness were swapped tonight?

**Persona.** One file `team/personas/<persona>.md` with frontmatter `name`, `role`, optional `lens`, `display`. The body has four sections: **Priors** (what this person believes and notices first), **Dissent** (what they will push on even when the diff is fine, which is the friction budget the review process depends on), **Voice** (one sentence plus one exemplar line), and **Tells** (how a reader knows it was them). A persona contains no capabilities, no tool names, and no process steps. If a persona's dissent section is empty, the persona is decoration and should be cut.

**View.** A directory `team/views/<skin>/` holding `party.json`, keyed by persona, with `class`, `epithet`, `accent`, `sprite`, `blurb`. Views feed the site, the roster printout, and any terminal or PR-comment header the human sees. The composer refuses to place view content in an agent file; a test pins that.

**Harness adapter.** One file `team/harness/<harness>.json`, carrying `"fitted": true` and a `review` field naming what invalidates it (a model or harness release). It maps capabilities to tool names, sets turn budgets and frontmatter, and names output paths. It is the only file in `team/` that may mention a vendor's product. When a harness ships a release, the adapter is the file to reread against the migration notes; nothing else should need to change.

### Composition

For each party binding, the composer emits one agent artefact: adapter frontmatter (tools derived from the role's `may`, disallowed from its `must-not`, budgets from the adapter) followed by the persona voice line, the role charter, the bound lens if any, the persona's priors and dissent, the role's boundaries, and the role's output shape, in that order. Multi-persona **formations** (the v2 composite reviewer) are declared in the party and composed from the same lens sources, so the standalone reviewers and the formation cannot drift.

The `skills` adapter emits roles alone as `SKILL.md` folders and no personas. That is the configuration the human has been running since the kill, and it is now a first-class target rather than a manual conversion.

### The enforcement report

For every `must-not` boundary in every binding, the composer records whether the target harness can enforce it at the tool layer or only by prose. On Claude Code, `write:src` and `write:tests` both map to `Write` and `Edit`, so a tester who may write tests but must not write source is **prose-enforced**; a reviewer who must not write at all is **tool-enforced**. The report makes the post's open question (does separation of duties survive a harness it wasn't tuned for) a number per harness instead of an impression, and it is the input to whatever enforcement layer ADR-0012's hook ladder eventually supplies for the prose-only rows.

### Sequencing

1. This ADR, the canon spec, the `team/` tree for the implementation trio and the review formation, the composer with tests, the `skills` and `claude-code` adapters. (This wave.)
2. Remaining personas and roles ported one at a time, each port a diff against its v2 file that classifies every sentence as role, persona, view, adapter, or delete. The delete column is expected to be the largest.
3. `check-canon` learns the new tree: a party binding must resolve, a persona must have a non-empty Dissent section, an adapter must carry `fitted: true`, and view text must not appear in composed output.
4. Cutover: `.claude/agents/` becomes composer output, gitignored or generated in CI, and `personas.md` becomes a rendered roster rather than a source. Requires ratification and a fidelity read of the composed files against the v2 originals.
5. Site `TeamGrid.astro` reads the view's `party.json` instead of its own hard-coded table.

## Alternatives Considered

- **Patch the sixteen files** against the Opus 5 migration notes and the harness changelog. Rejected: this is the fix branch of the fix-or-kill decision the human already made, and it leaves the four layers fused, so the next regime change repeats the whole episode.
- **Skills only, no personas** (the human's current interim setup). Rejected as the end state, kept as a target: it discards the dissent layer, and the post's own decay metric was the disagreement rate. A persona layer that can be attached or detached is strictly more than a skills folder.
- **Personas as the source, roles derived** (the register stack's direction: `personas.md` projects into agent files). Rejected: it makes the least portable layer the root. Roles are what survive; personas bind to them.
- **Store the view in the persona file** as a frontmatter block. Rejected: the view costs context on every invocation and changes nothing about the work. The post's ratio (most of a file was about getting the model to cooperate, not about the job) argues for keeping every non-work byte out of the prompt by construction.
- **One adapter format for all harnesses** via ADR-0006's projection generator. Deferred: the composer is that generator for the agent layer, but it emits per-harness originals from a shared source rather than projecting one harness's files into another's. ADR-0006's manifest still records what was installed; this ADR changes what the source is.

## Consequences

### Positive

- The three-question fitness audit maps onto files: task fit is a role edit, model fit is a persona edit, harness fit is an adapter edit. A regime change invalidates one small JSON file.
- The role layer is runnable anywhere that reads the Agent Skills spec, which makes the bake-off the post promised a `--harness` flag rather than a rewrite.
- Separation of duties and context isolation have a portable home, and the enforcement report says per harness whether they are enforced or merely described.
- Dissent becomes a required, inspectable section rather than an emergent property that quietly decays.
- The composite reviewer stops being a hand-maintained fan-out file and becomes a formation composed from the same lenses as its members. Issue #118's flattening complaint is answered at the source.

### Negative

- **Generated files.** `.claude/agents/` stops being hand-editable. A downstream user who tweaks a composed file loses the tweak on the next compose. Mitigation: edit the layer, not the output; the adapter carries per-project overrides. This is ADR-0006's projection discipline applied to Summon's own runtime surface.
- **More files per persona.** Sixteen files become roughly forty. The composer and `check-canon` carry the burden of keeping them coherent that a single file carried by being one file.
- **A new script on the load-bearing path.** The team does not exist until the composer runs. It is zero-dependency Node with tests, but it is code, and it is canon.
- **Prose-enforced boundaries are named as such.** Some users will read "prose" in the enforcement report as "unenforced" and rip out the persona layer. That reading is correct today for those rows, and the report is more honest than the v2 allowlists, which implied enforcement they did not have.

### Neutral

- ADR-0012 F's revisit trigger (persona overhead above 10% of session context) becomes measurable: the composer can emit a role-only and a role-plus-persona variant and the difference is the overhead.
- The register stack's voice work (#106, #116) becomes the Voice section of each persona file. The sensor it added (`checkVoiceDelivery`) is superseded by the composer's own test, since delivery is now by construction.
- Nothing in this ADR changes the phase model or the done gate.
