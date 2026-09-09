---
agent-notes: { ctx: "spec for the four team layers, checks, and how a party composes them", deps: [CLAUDE.md, docs/methodology/personas.md, docs/methodology/phases.md, docs/process/done-gate.md, team/README.md, scripts/compose-team.mjs], state: draft, last: "claude@2026-09-09", key: ["role = the work, persona = the point of view, view = the skin, adapter = the fitted part", "capabilities are verbs about the work, never tool names", "checks split each role into what a command decides and what the model judges", "view content never enters model context; Dissent must add to the lens"] }
---

# Team Layers

A Summon agent is not one file. It is a **role** held by a **persona**, shown to the human through a **view**, and run on a harness through an **adapter**. The four are authored separately under `team/` and composed by `scripts/compose-team.mjs` into whatever a given harness reads.

The reason for the split is a question you should be able to ask of any sentence in any team file: *if the model and the harness were swapped tonight, would this sentence still be true?* Sentences that survive belong in a role or a persona. Sentences that do not belong in the adapter, and nowhere else.

A second split runs through every role: what a command can decide, and what only judgment can. The first half is declared as **checks** and bound to commands per project; the model runs them and pastes the receipt. The second half is the role's questions and the persona's dissent. The composer reports how much of each role is which.

## The four layers

### Role — the work

A role describes a job and the standard the job must meet. `team/roles/<role>/SKILL.md` is an [Agent Skills](https://agentskills.io) document, so a role runs unchanged on any tool that reads the spec. Its body has five sections, all required:

| Section | Answers |
|---|---|
| **Charter** | What this work is, in a paragraph. |
| **Standard** | What done means. The bar, not the steps. |
| **Questions** | The judgment checklist the role runs. For a reviewer, the lens supplies it. |
| **Boundaries** | What this role does not do, as facts about the work. The prose form of `must-not`. |
| **Output** | The shape of what comes back. |

`role.json` beside it declares the machine-readable half:

```json
{
  "may": ["read", "run", "write:tests"],
  "must-not": ["write:src"],
  "lenses": [],
  "checks": [
    { "id": "tests-red", "claim": "Each new test fails before the implementation exists." },
    { "id": "no-wall-clock", "claim": "No new test reads the real clock." }
  ]
}
```

Capabilities are verbs about the work: `read`, `run`, `write:src`, `write:tests`, `write:docs`, `web`, `notebook`. They are never tool names. `must-not` is the separation-of-duties list; it is what keeps a tester from making a failing test easier to pass, and it is the part of the role the adapter tries to enforce and reports on when it cannot.

A **check** is a claim a command can decide. The role declares the claim; the project binds the command (see Checks below). A check may carry a `lens`, in which case only members holding that lens receive it.

A role with several **lenses** (the reviewer has five) keeps each in `lenses/<lens>.md`. A persona binds to one lens; a formation binds to several.

A role contains no persona voice and no harness vocabulary. If a sentence names a vendor, a tool, or a turn budget, it is in the wrong file.

### Persona — the point of view

A persona is a named way of holding a role. `team/personas/<persona>.md` has frontmatter (`name`, `role`, optional `lens`, optional `holds`, `display`) and four required sections. `role` and `lens` name the primary seat; `holds` lists every seat the persona may take, as `role` or `role/lens` entries, when one person holds more than one (Tara is the tester and also the test-quality review lens). A party may only bind a persona to a seat it holds.

| Section | Answers |
|---|---|
| **Priors** | What this person believes about the work and notices first. |
| **Dissent** | What they push on that the role and lens do not already say. The friction budget. |
| **Voice** | One sentence describing the register, and one exemplar line. |
| **Tells** | How a reader knows it was them. |

Dissent is the section that matters, and it is governed by one rule: **it holds only what the role and lens do not already say.** The composer refuses a Dissent bullet whose content is mostly contained in a sentence of the bound lens or role. Restating the lens in the first person is the cheapest way to fill the section and adds nothing; if the rule empties a persona's Dissent, that persona is decoration and should be cut. Whether dissent survives at runtime is a separate question, measured by the reviewer role's `disagreement-rate` check, not by this file.

A persona contains no capabilities, no tool names, and no process steps; those are the role's.

### View — the skin

A view is how the human sees the party: an archetype, an epithet, an accent colour, a sprite. `team/views/<skin>/party.json` is keyed by persona. Views feed the site, the roster printout, and any header a human reads. They **never** enter an agent's context; a composer test pins that. The layer exists so the site and the roster read one data file instead of a hand-copied table, and so a skin can be swapped without touching the work. More than one skin can exist for the same party.

### Harness adapter — the fitted part

`team/harness/<harness>.json` is the only file under `team/` that may name a vendor's product. It carries:

| Field | Holds |
|---|---|
| `fitted` | Always `true`. Every adapter is fitted to something; `review` says to what. |
| `review` | What invalidates this file: a model release, a harness release, a spec change. |
| `output` | Where artefacts go: `dir`, and `file` with `{name}` or `{role}` placeholders. |
| `capabilities` | Work verb to tool names. Empty on a target with no tool layer. |
| `keys` | The frontmatter key names for allow, deny, and budget on this harness. |
| `frontmatter` | Fixed keys every agent gets. |
| `budget` | Turn budgets by role, plus `default`. |
| `paths` | Globs per write capability, so a hook can be composed from the same source as the role. |
| `formation` | How a formation is emitted: `single-file` today. |
| `personas` | `false` on a roles-only target. |

When a harness ships a release, this is the file to reread against the migration notes. If a release forces a change outside it, the seam is wrong; record that against the ADR's reversal triggers rather than patching around it.

## Parties and composition

A party, `team/parties/<party>.json`, binds the layers:

```json
{
  "harness": "claude-code",
  "view": "jrpg-16bit",
  "members": [
    { "role": "reviewer", "lens": "simplicity", "persona": "vik" },
    { "role": "coder", "persona": "sato" },
    { "role": "reviewer", "lens": "test-quality", "persona": "tara", "as": "tara-review" }
  ],
  "formations": [
    {
      "name": "review-party",
      "role": "reviewer",
      "members": [{ "persona": "vik", "lens": "simplicity" }, { "persona": "pierrot", "lens": "security" }],
      "conditional": [{ "lens": "operational", "when": "the change alters application behaviour" }]
    }
  ]
}
```

A member is a role, an optional lens, and a persona that holds that seat. `as` names the output when one persona holds two seats on the same harness. A **formation** is one agent carrying several lenses: the `members` are its floor, always applied; `conditional` lenses carry a `when` trigger and are applied only when it holds, and the formation reports which it applied. A conditional lens may name a persona or stand alone. This is ADR-0012's review-wave roster: the floor is fixed here, the conditionals are the diff-computed additions, and the workflow that evaluates the triggers is sequenced there.

`node scripts/compose-team.mjs --party summon-core --out build/team` writes one artefact per member and formation in the adapter's format, `roster.md` rendered from the view, and `enforcement.md`. A composed agent's body runs in this order: the persona's Voice, then the role's Charter and Standard, then Checks, then the role's Questions, then the bound lens, then the persona's Priors, Dissent, and Tells, then the role's Boundaries and Output. The `skills` adapter emits roles alone, no personas, which is the portable, voiceless configuration.

## Checks

`team/checks.json` binds check ids to commands for this project:

```json
{
  "tests-green": { "run": "pnpm test", "receipt": "the pass/fail summary lines, pasted" }
}
```

The composer joins each role's declared checks to these bindings. A bound check is emitted into the agent with its command and the receipt to paste, and is graded **deterministic**. An unbound check is emitted as a claim to judge and is graded **inferential**, using the proof grades from the done gate. The enforcement report counts both, per member, so the answer to "how much of this role is a script and how much is a model?" is a number per project. Claims are portable; commands are not, which is why they live apart.

The composer wires checks; it does not run them. A runner that executes them and binds receipts to a tree state is sequenced after the receipt schema.

## The enforcement report

For every `must-not` in every member, `enforcement.md` says whether the harness enforces it at the **tool** layer (every tool the boundary maps to is withheld) or by **prose** only (the role needs a tool the boundary shares, or the adapter maps it to nothing). A third level, **hook**, is reserved for a boundary enforced by a hook composed from the adapter's `paths`; the composer cannot probe whether one is installed, so that column belongs to `doctor`. On Claude Code, writing source and writing tests share the same tools, so a tester's boundary against source is prose. It was prose in the v2 roster as well; the report only makes it visible.

## Who writes what

Reviewers and challengers cannot write files; that is their boundary. Gate records and review documents are written by the coordinator, or by the review-wave workflow, from the returned message. A role that reports is not a role that files.

## Where each kind of edit goes

| You want to change | Edit |
|---|---|
| What a reviewer checks by judgment | the role, or its lens |
| What a role can prove with a command | the role's `checks`, then `team/checks.json` for this project |
| How Vik argues | the persona |
| Vik's sprite or class name | the view |
| Which tools Claude Code gives a reviewer | the adapter |
| Who reviews what, and which lenses are conditional | the party |

If an edit seems to need two layers, the seam is probably in the wrong place. Say so in the ADR rather than smearing the change across both.
