---
title: GitHub Projects
description: Track work with GitHub Projects v2 — Summon manages the board for you.
---

Summon integrates with GitHub Projects v2 for sprint tracking. Grace manages board status automatically as work progresses.

## Setup

1. Create a GitHub Project (Projects v2) on your repo or org
2. Add a **Status** field with these options:
   - `Backlog`
   - `Ready`
   - `In Progress`
   - `In Review`
   - `Done`
3. Note the project number (from the URL: `github.com/orgs/…/projects/N`)
4. Add to your `CLAUDE.md`:
   ```
   project-number: N
   project-owner: @your-org-or-username
   ```
5. Ensure your GitHub CLI has project scope:
   ```bash
   gh auth refresh -s project
   ```

## Status Flow

```
Backlog → Ready → In Progress → In Review → Done
```

Grace moves items through these statuses as part of the development workflow:
- **In Progress** — when a developer starts work on an issue
- **In Review** — when code review begins
- **Done** — when the done gate passes

Skipping "In Review" is a process violation.

## Pre-Flight Check

Before any board operation, Summon runs a pre-flight:
1. `gh auth status` — verifies CLI authentication
2. `gh project field-list` — verifies board access
3. Checks all 5 status options exist

If any check fails, Summon stops and tells you what to fix.

## Commands That Use the Board

- `/kickoff` — creates initial work items
- `/sprint-boundary` — reviews sprint status, moves deferred items
- `/handoff` — captures board state for session continuity
- `/resume` — verifies board state before continuing work
