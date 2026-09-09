---
agent-notes: { ctx: "spec for the four team layers and how a party composes them", deps: [CLAUDE.md, docs/methodology/personas.md, docs/methodology/phases.md, team/README.md, scripts/compose-team.mjs], state: draft, last: "claude@2026-09-09", key: ["role = the work, persona = the point of view, view = the skin, adapter = the fitted part", "capabilities are verbs about the work, never tool names", "view content never enters model context"] }
---

# Team Layers

A Summon agent is not one file. It is a **role** held by a **persona**, shown to the human through a **view**, and run on a harness through an **adapter**. The four are authored separately under `team/` and composed by `scripts/compose-team.mjs` into whatever a given harness reads.

The reason for the split is a question you should be able to ask of any sentence in any team file: *if the model and the harness were swapped tonight, would this sentence still be true?* Sentences that survive belong in a role or a persona. Sentences that do not belong in the adapter, and nowhere else.

## The four layers

### Role — the work

A role describes a job and the standard the job must meet. `team/roles/<role>/SKILL.md` is an [Agent Skills](https://agentskills.io) document, so a role runs unchanged on any tool that reads the spec. Its body has four sections:

| Section | Answers |
|---|---|
| **Charter** | What this work is, in a paragraph. |
| **Standard** | What done means. The bar, not the steps. |
| **Questions** | The checklist the role runs. For a reviewer, the lens. |
| **Output** | The shape of what comes back. |

`role.json` beside it declares the role's boundaries in machine-readable form:

```json
{
  "may": ["read", "run", "write:tests"],
  "must-not": ["write:src"],
  "lenses": []
}
```

Capabilities are verbs about the work: `read`, `run`, `write:src`, `write:tests`, `write:docs`, `web`, `notebook`. They are never tool names. `must-not` is the separation-of-duties list; it is what keeps a tester from making a failing test easier to pass, and it is the part of the role the adapter tries to enforce and reports on when it cannot.

A role with several **lenses** (the reviewer has four) keeps each in `lenses/<lens>.md`. A persona binds to one lens; a formation binds to several.

A role contains no persona voice and no harness vocabulary. If a sentence names a vendor, a tool, or a turn budget, it is in the wrong file.

### Persona — the point of view

A persona is a named way of holding a role. `team/personas/<persona>.md` has frontmatter (`name`, `role`, optional `lens`, optional `holds`, `display`) and four sections. `role` and `lens` name the primary binding; `holds` lists every binding the persona may take, as `role` or `role/lens` entries, when one person holds more than one seat (Tara is the tester and also the test-quality review lens). A party may only bind a persona to a seat it holds.

| Section | Answers |
|---|---|
| **Priors** | What this person believes about the work and notices first. |
| **Dissent** | What they push on even when the change is fine. The friction budget. |
| **Voice** | One sentence describing the register, and one exemplar line. |
| **Tells** | How a reader knows it was them. |

Dissent is the section that matters. A review process is only worth running because its lenses disagree; a persona whose Dissent section is empty adds context cost and no information, and should be cut. A persona contains no capabilities, no tool names, and no process steps; those are the role's.

### View — the skin

A view is how the human sees the party: an archetype, an epithet, an accent colour, a sprite. `team/views/<skin>/party.json` is keyed by persona. Views feed the site, the roster printout, and any header a human reads. They **never** enter an agent's context. A test on the composer pins that, because every byte in a prompt that is not about the work is a byte the model pays for without anyone getting anything back.

More than one skin can exist for the same party. Swapping skins changes nothing about the work.

### Harness adapter — the fitted part

`team/harness/<harness>.json` is the only file under `team/` that may name a vendor's product. It maps capabilities to that harness's tool names, sets budgets, chooses frontmatter keys, and names output paths. It carries `"fitted": true` and a `review` field saying what invalidates it, because it will be invalidated: the roster this replaced died when its equivalent of this file went stale, and the point of isolating it is that next time only this file has to be reread against the release notes.

## Parties and composition

A party, `team/parties/<party>.json`, binds the layers:

```json
{
  "harness": "claude-code",
  "view": "jrpg-16bit",
  "members": [
    { "role": "reviewer", "lens": "simplicity", "persona": "vik" },
    { "role": "coder", "persona": "sato" }
  ],
  "formations": [
    { "name": "review-party", "role": "reviewer", "members": ["vik", "tara", "pierrot", "archie"] }
  ]
}
```

`node scripts/compose-team.mjs --party summon-core --out build/team` writes one artefact per member and formation in the adapter's format, a `roster.md` rendered from the view, and an `enforcement.md` that says, for every `must-not` in every member, whether the harness enforces it at the tool layer or only by prose. The `skills` adapter emits roles alone, no personas, which is the portable, voiceless configuration.

## Where each kind of edit goes

| You want to change | Edit |
|---|---|
| What a reviewer checks | the role, or its lens |
| How Vik argues | the persona |
| Vik's sprite or class name | the view |
| Which tools Claude Code gives a reviewer | the adapter |
| Who reviews what | the party |

If an edit seems to need two layers, the seam is probably in the wrong place. Say so in the ADR rather than smearing the change across both.
