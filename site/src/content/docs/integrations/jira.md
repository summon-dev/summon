---
title: Jira
description: Use Jira for sprint tracking with Summon's adapter.
---

Summon includes a Jira adapter for teams that use Jira for project management. The same status flow and board operations work with Jira's API.

## Setup

1. Create a Jira project with a board
2. Configure status categories to match Summon's flow:
   - `Backlog`
   - `Ready`
   - `In Progress`
   - `In Review`
   - `Done`
3. Set up a Jira API token
4. Configure the adapter in your project per `docs/integrations/jira.md`

## Status Flow

The same flow as GitHub Projects:

```
Backlog → Ready → In Progress → In Review → Done
```

## Adapter Details

The full Jira adapter configuration — including authentication, field mapping, JQL queries, and API examples — is documented in `docs/integrations/jira.md` in your Summon project.

The adapter covers:
- Issue creation and updates
- Status transitions
- Sprint management
- Comment integration
- Board queries for sprint boundary
