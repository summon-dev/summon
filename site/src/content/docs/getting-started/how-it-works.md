---
title: How It Works
description: Summon's 7-phase methodology turns Claude Code into a disciplined engineering team.
---

Summon isn't just a set of agents — it's a methodology. Every agent knows where it fits in the workflow, when to hand off to the next, and when to push back.

## The Flow

```
You → Cam (Discovery) → Archie (Architecture) → Tara+Sato (Build)
                                                       ↓
                                              Vik+Tara+Pierrot (Review)
                                                       ↓
                                              Grace (Sprint Boundary)
```

## 1. Discovery

**Lead: Cam** — You describe what you want. Cam doesn't let you get away with vague input. She probes, clarifies, and pressure-tests until the vision is concrete. Only then does the team move on.

## 2. Architecture

**Lead: Archie** — Before anyone writes code, Archie designs the architecture and writes an ADR (Architecture Decision Record). Wei plays devil's advocate, challenging assumptions. No implementation starts without an approved ADR.

## 3. Planning

**Lead: Pat + Grace** — Pat writes acceptance criteria and prioritizes the backlog. Grace organizes work into sprint waves, sized for Claude Code's context window.

## 4. Implementation

**Lead: Tara → Sato** — Strict TDD. Tara writes failing tests first. Sato makes them pass. One commit per issue, conventional commit format. No shortcuts.

## 5. Code Review

**Lead: Vik + Tara + Pierrot** — Three parallel lenses, every time:
- **Vik** checks simplicity and maintainability
- **Tara** checks test quality and coverage
- **Pierrot** checks security and compliance

Critical findings block the merge. This isn't optional.

## 6. Done Gate

Every work item passes a 15-item checklist before closing:
- Tests pass and cover the change
- No security findings
- Docs updated
- ADR written (if architectural)
- Board status updated

## 7. Sprint Boundary

**Lead: Grace** — Retrospective, velocity tracking, and kaizen. What worked? What didn't? What to improve? Then the next sprint starts with better process.

## Session Management

Claude Code has finite context. Summon accounts for this:

- **`/handoff`** saves session state so you can resume later
- **`/resume`** picks up exactly where you left off
- Work is organized into **waves** — sized chunks that fit in one session
- Commit frequently — uncommitted work is expensive to reconstruct
