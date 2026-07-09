# Changelog

All notable changes to Summon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- 16 specialized agent personas (`.claude/agents/`)
- 24 slash commands (`.claude/commands/`)
- 7-phase development methodology with phase-dependent team composition
- Architecture gate with mandatory ADRs before implementation
- TDD workflow with Tara writing failing tests, Sato making them pass
- Three-lens code review (simplicity, test quality, security) in parallel
- Sprint management with velocity tracking, retrospectives, and handoffs
- 16-item Done Gate checklist for work item completion
- Integration adapters for GitHub Projects and Jira
- Scaffold templates for web monorepo, CLI, static site, and AI tool projects
- Unified Cloud agent covering architecture, cost, and network diagnostics
- Supply-chain hardening: dependency release-age cooldown (ADR-0010, 3-day default enforced via `pin-versions` and Done Gate), CI actions pinned to commit SHAs, MCP-server vetting directive, an owner-harm (C1–C8) threat-model lens, and a `security-intake.md` routing guide for future security learnings
