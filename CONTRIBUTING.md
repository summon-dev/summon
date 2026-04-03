# Contributing to Summon

Thanks for your interest in contributing to Summon.

## Getting Started

1. Fork and clone the repo
2. Install dependencies: `pnpm install`
3. Build: `pnpm build`

## What to Contribute

**Agent improvements** — better prompts, clearer boundaries, new situational behaviors. These touch `.claude/agents/` and require close review for voice consistency and methodology alignment.

**New slash commands** — useful workflows that fit the methodology. Add to `.claude/commands/`.

**Scaffold templates** — new project types under `docs/scaffolds/`. Self-contained and testable.

**Bug fixes and docs** — always welcome.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with conventional commit messages (`feat:`, `fix:`, `docs:`, etc.)
3. Ensure `pnpm build` passes
4. Open a PR with a clear description of what and why

## Agent & Command File Conventions

- Every file must have `agent-notes` metadata (see `docs/methodology/agent-notes.md`)
- Agent files use YAML frontmatter for tool permissions, then an HTML comment for agent-notes
- Command files use an HTML comment on line 1 for agent-notes
- Update the `last` field in agent-notes when you modify a file

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
