# Summon

**Ship like a team of 10. You're the only human.**

Summon gives solo developers a full AI engineering team inside [Claude Code](https://claude.ai/code) — not a bag of disconnected agents, but a team with real process: architecture gates, TDD, code review, sprint management, and the discipline to say no.

> They give you agents. We give you a team. There's a difference.

## The Problem

Agent marketplaces offer hundreds of AI agents. Install them, and you get... a pile of tools. No one decides what to build first. No one catches the bad architecture before you've built on top of it. No one says "wait, we need tests."

You don't need more agents. You need a team that works like a team.

## What Summon Does

Summon installs a complete engineering team into your Claude Code project:

- **Cam** probes your vague idea until the vision is concrete — before anyone writes code
- **Archie** designs the architecture and writes ADRs — before implementation starts
- **Tara** writes failing tests first — then **Sato** makes them pass
- **Vik** reviews every change for simplicity, **Tara** checks test quality, **Pierrot** catches security issues — three lenses, in parallel
- **Grace** manages sprints, tracks velocity, coordinates handoffs
- **Pat** owns the backlog, writes acceptance criteria, prioritizes ruthlessly
- **Wei** plays devil's advocate when the team converges too quickly

Plus 9 more specialists: cloud ops, SRE, data science, UX, security compliance, documentation, and pedagogy.

**Every agent knows its role, its boundaries, and when to invoke the others.** The team self-organizes around your work using a 7-phase methodology — from discovery through sprint boundary.

## Quick Start

```bash
npx create-summon my-project
cd my-project
claude
```

Or use the GitHub template directly:

1. Click **[Use this template](https://github.com/summon-dev/summon/generate)** on GitHub
2. Clone your new repo
3. Open it in Claude Code — it will detect the fresh project and guide you through setup

## Two Ways to Start

### Starter Tier (5 agents)

For developers new to AI-assisted workflows. Light process, good habits:

| Agent | Role |
|-------|------|
| **Sato** | Writes production code |
| **Tara** | Writes tests first (TDD) |
| **Archie** | Architecture decisions |
| **Cam** | Clarifies requirements before coding |
| **Vik** | Code review |

Simplified governance — one question before coding instead of three mandatory gates. Graduate to the full tier when you're ready.

### Full Tier (16 agents)

The complete engineering team with full governance:

- **Mandatory architecture gates** — no implementation without an ADR
- **Sprint boundaries** — retrospectives, velocity tracking, kaizen
- **Done gate** — 15-item checklist before any work item closes
- **Adversarial debate** — Wei challenges assumptions, Pierrot has security veto
- **Three-lens code review** — simplicity, test quality, and security in parallel

## What's Inside

```
.claude/
  agents/       16 specialized agent personas
  commands/     23 slash commands (/kickoff, /tdd, /review, /handoff, ...)

docs/
  methodology/  7-phase team methodology, persona catalog
  process/      Governance, done gate, gotchas, sprint tracking
  integrations/ GitHub Projects + Jira adapters
  scaffolds/    Project templates (code-map, test strategy, threat model, ...)
  adrs/         Architecture Decision Records

CLAUDE.md       Runtime instructions — Claude Code reads this first
```

## How It Works

1. **You describe what you want to build.** Cam interviews you until the vision is sharp.
2. **The team plans.** Archie designs architecture. Pat writes work items. Grace organizes the sprint.
3. **The team builds.** Tara writes failing tests. Sato makes them pass. Commit per issue.
4. **The team reviews.** Vik checks simplicity. Tara checks coverage. Pierrot checks security. Three parallel lenses.
5. **The team ships.** Done gate passes. Sprint boundary runs. Retrospective captures learnings.

You're the product owner and the final decision-maker. The team handles the engineering discipline.

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/kickoff` | Full project discovery (30-60 min) |
| `/quickstart` | Fast setup (5 min) |
| `/plan` | Implementation planning |
| `/tdd` | TDD workflow for a feature |
| `/review` | Guided human review session |
| `/code-review` | Multi-lens automated code review |
| `/handoff` | Save session state for next time |
| `/resume` | Pick up where you left off |
| `/sprint-boundary` | Sprint wrap-up: retro + gate + sweep |
| `/doctor` | Project health check |
| `/design` | Sacrificial concept exploration |
| `/adr` | Create an Architecture Decision Record |

Plus 11 more for cloud reviews, scaffolding, devcontainers, dependency pinning, and more.

## Why Not Just Use an Agent Marketplace?

| | Agent Marketplaces | Summon |
|---|---|---|
| **Agents** | 100-1000+ independent tools | 16 agents that know each other |
| **Process** | None — install and figure it out | 7-phase methodology with gates |
| **Architecture** | No guardrails | Mandatory ADRs before implementation |
| **Testing** | Optional | TDD enforced — tests before code |
| **Code Review** | Single-pass or none | Three parallel lenses (quality, tests, security) |
| **Sprint Management** | None | Velocity tracking, retrospectives, handoffs |
| **Accountability** | None — agents don't say no | Veto authority on security and test coverage |

## Requirements

- [Claude Code](https://claude.ai/code) (CLI, desktop app, or IDE extension)
- A Claude API key or Claude Pro/Team subscription

## Contributing

Summon is open source under the MIT license. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
