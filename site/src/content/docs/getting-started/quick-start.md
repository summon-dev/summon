---
title: Quick Start
description: Get your AI engineering team running in under 5 minutes.
---

## Install

```bash
npx summon-team my-project
cd my-project
```

This scaffolds a new project with the full Summon framework — 16 agents, 23 commands, and all the methodology docs.

Or use the GitHub template:

1. Click **[Use this template](https://github.com/summon-dev/summon/generate)** on GitHub
2. Clone your new repo

## Set Up

Open the project in [Claude Code](https://claude.ai/code) (CLI, desktop app, or IDE extension).

Claude will detect the fresh project and tell you to run one of:

- **`/quickstart`** — 5-minute setup. Gets you coding fast.
- **`/kickoff`** — 30-60 minute full discovery. Architecture, board setup, sprint planning.

Choose `/quickstart` if you already know what you're building. Choose `/kickoff` if you want the team to help you figure it out.

## Requirements

- [Claude Code](https://claude.ai/code) (CLI, desktop app, or IDE extension)
- A Claude API key or Claude Pro/Team subscription

## What's in Your Project

```
.claude/
  agents/       16 specialized agent personas
  commands/     23 slash commands

docs/
  methodology/  7-phase team methodology
  process/      Governance, done gate, sprint tracking
  integrations/ GitHub Projects + Jira adapters
  scaffolds/    Project templates (code-map, test strategy, ...)
  adrs/         Architecture Decision Records

CLAUDE.md       Runtime instructions — Claude reads this first
```

## Next Steps

- [Meet the Team](/summon/team/overview/) — learn who does what
- [How It Works](/summon/getting-started/how-it-works/) — understand the methodology
- [Slash Commands](/summon/team/commands/) — see all 23 commands
