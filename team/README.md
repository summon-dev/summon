---
agent-notes: { ctx: "source tree for the composed team; read team-layers.md first", deps: [docs/methodology/team-layers.md, scripts/compose-team.mjs], state: draft, last: "claude@2026-09-09" }
---

# team/

The team is authored here as four layers and composed into harness output by `scripts/compose-team.mjs`. The spec is `docs/methodology/team-layers.md`; read it before editing anything below.

```
team/
├── roles/<role>/         the work: SKILL.md (Agent Skills) + role.json (boundaries) [+ lenses/]
├── personas/<name>.md    the point of view: priors, dissent, voice, tells
├── views/<skin>/         the skin: party.json, keyed by persona; never reaches a prompt
├── harness/<name>.json   the fitted part: tool names, budgets, output paths; marked fitted
├── parties/<name>.json   bindings: which persona holds which role, on which harness, in which skin
└── checks.json           this project's commands for each role's declared checks; unbound checks are judged
```

Compose:

```
pnpm team:compose                       # summon-core party, claude-code adapter → build/team/
node scripts/compose-team.mjs --party summon-core --harness skills --out build/skills
```

`build/` is gitignored. Do not edit composed files; edit the layer and recompose.
