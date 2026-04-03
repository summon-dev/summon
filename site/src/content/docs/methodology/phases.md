---
title: 7-Phase Workflow
description: The methodology that turns agents into a team.
---

Summon's methodology is phase-dependent — different agents lead at different stages, and the transitions are enforced, not suggested.

## Phase Overview

| Phase | Lead | Key Pattern |
|-------|------|------------|
| Discovery | Cam | Elicit before implementing |
| Architecture | Archie | ADR before code |
| Planning | Pat + Grace | Work items before sprints |
| Implementation | Tara → Sato | TDD red-green-refactor |
| Code Review | Vik + Tara + Pierrot | Three parallel lenses |
| Done Gate | Grace | 15-item checklist |
| Sprint Boundary | Grace | Retro + velocity + kaizen |

## Phase Details

### 1. Discovery
Cam leads. Before anyone writes code — including types, tests, or ADRs — three questions must be answered:

1. **Do work items exist?** If not, create them.
2. **Is this an architectural decision?** If yes, go to Architecture first.
3. **Am I about to write code?** If yes, Tara writes tests first.

### 2. Architecture
Archie leads, Wei challenges. Every feature with an architectural decision needs an ADR before implementation starts. The Architecture Gate requires:

- Archie proposes a design
- Wei pressure-tests it (devil's advocate)
- The ADR is written and approved
- Only then does implementation begin

### 3. Planning
Pat writes acceptance criteria. Grace organizes into sprint waves — batches of work sized for one Claude Code session.

### 4. Implementation
Strict TDD cycle:
- **Red:** Tara writes a failing test
- **Green:** Sato writes the minimum code to pass it
- **Refactor:** Clean up while tests stay green

One commit per issue. Conventional commit format. Board status moves to "In Progress" before code starts.

### 5. Code Review
Three parallel lenses — every time, not optionally:
- **Vik:** Simplicity and maintainability
- **Tara:** Test quality and coverage
- **Pierrot:** Security and compliance

Critical or Important findings must be resolved before merge. Board status moves to "In Review."

### 6. Done Gate
A 15-item checklist before any work item closes. Includes: tests pass, no security findings, docs updated, ADR written, board updated, and more.

### 7. Sprint Boundary
Grace runs `/sprint-boundary`:
- Retrospective: what worked, what didn't
- Velocity tracking
- Kaizen: one concrete improvement for next sprint
- Sweep: catch any missed items
