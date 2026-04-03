---
title: Architecture Gates
description: No implementation without an ADR. How Summon enforces architectural discipline.
---

One of Summon's strongest opinions: **you don't write code before you've written the design.**

## Why Gates?

In solo development, it's tempting to jump straight to code. But without architectural review:
- You build on a foundation that hasn't been stress-tested
- Rework costs compound as code builds on bad decisions
- "I'll refactor later" becomes permanent technical debt

Summon enforces the pause with an Architecture Gate.

## How It Works

When work involves an architectural decision, the gate activates:

1. **Archie** proposes a design — data models, API contracts, component boundaries
2. **Wei** plays devil's advocate — challenges assumptions, defends alternatives
3. An **ADR** is written using the project template at `docs/adrs/template.md`
4. The ADR is approved before any implementation starts

## What Triggers a Gate?

- New service or package
- Database schema changes
- API contract changes
- New integration with an external system
- Changes that cross module boundaries
- Significant technology choices

## ADR Format

Every ADR follows the same structure:
- **Status:** Proposed / Accepted / Deprecated / Superseded
- **Context:** What's the situation?
- **Decision:** What are we doing?
- **Consequences:** What are the tradeoffs?
- **Alternatives Considered:** What else did we evaluate?

ADRs live in `docs/adrs/` and are numbered sequentially. They're never deleted — superseded ADRs link to their replacement.

## The Wei Factor

Wei's role is deliberate friction. When Archie proposes a design, Wei asks:
- What's the simplest thing that could work?
- What happens when this fails?
- Are we building this because we need it, or because it's interesting?
- What would we do differently if we had half the time?

This isn't obstruction — it's the adversarial review that catches groupthink before it becomes architecture.
