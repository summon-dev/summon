# Changelog

All notable changes to Summon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Initial port of agent framework from vteam-hybrid
- 16 specialized agent personas (`.claude/agents/`)
- 23 slash commands (`.claude/commands/`)
- Full methodology docs: phases, personas, governance, done gate
- Process docs: gotchas, tracking protocol, operational baseline
- Integration adapters: GitHub Projects, Jira
- Scaffold templates for new projects
- ADR framework with conventional commits and TDD workflow decisions
- Strategic research and roadmap (`docs/research/rebrand-and-relaunch.md`)
- Unified Cloud agent merging architecture, cost, and network diagnostics
- Unified `/cloud-review` command replacing per-platform variants

### Changed
- Replaced "vteam" / "v-team" references with "Summon" across commands and docs
- Removed "absorbs X + Y" consolidation-history language from agent descriptions
- Updated doctor.md expected file lists to match new agent/command counts

### Removed
- user-chorus agent (functionality covered by Cam and Dani)
- cloud-architect, cloud-costguard, cloud-netdiag agents (merged into cloud)
- aws-review, azure-review, gcp-review commands (merged into cloud-review)
- sync-template command (vteam-specific, not applicable to Summon)
- sync-ghcp command (niche internal maintenance tool)
