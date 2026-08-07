# Changelog

All notable changes to Summon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Opt-in `impeccable` design-skill add-on at the end of `npx summon-team <name>` (ADR-0014). One interactive prompt, default **no**, never shown when stdin is not a TTY or `CI` is set. Installs with `--no-hooks` unconditionally — Summon wires zero hooks, so the payload arrives inert — records a `summon-tree-v1` digest of what landed in `.summon/manifest.json`, and commits it separately so the decision is visible in `git log`. Add-on failure is non-fatal to the scaffold.
- **`addon-integrity` check in `summon-team doctor`** (ADR-0014 §5). For each recorded add-on it reports intact, drift, or a stale entry, printing both digests on drift and stating plainly that it cannot tell an upstream update from a hand-edit or tampering. It shipped **with** the consent prompt rather than after it, because that prompt tells the user `doctor` will warn them — promising it before building it would obtain consent on a false premise. The manifest is treated as untrusted input: the entry is built from a snapshot taken before the installer ran, and a manifest root that escapes the project is refused.
- **Blessed `impeccable` tree digest** `sha256:ee4e188c…6a2b1` — CLI `impeccable@3.5.0`, payload `SKILL.md` version `4.0.4`, 147 files. Reviewed by Pierrot (payload read, 2026-08-05) and by the human against a git-tracked install carrying a reviewable `v4.0.2 → v4.0.4` upgrade diff (2026-08-06). Confirmed identical on three independently produced trees. The digest detects drift; it does **not** verify that what was downloaded is genuine. Every upstream payload release invalidates it until a human re-blesses.
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
