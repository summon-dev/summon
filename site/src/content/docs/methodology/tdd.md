---
title: TDD Workflow
description: Tests before code. Always. Here's how Summon enforces it.
---

Summon enforces Test-Driven Development with a strict separation: **Tara writes the failing test, Sato makes it pass.**

## Why Separate Agents?

When the same person writes both the test and the implementation, there's a natural tendency to write tests that confirm the code rather than challenge it. By splitting the roles:

- **Tara** writes tests from the acceptance criteria, not the implementation
- **Sato** writes the minimum code to make those tests pass
- Neither agent compromises the other's perspective

## The Cycle

### Red Phase (Tara)
1. Read the acceptance criteria from the work item
2. Write a failing test that captures the expected behavior
3. Verify it fails for the right reason (not a syntax error)

### Green Phase (Sato)
1. Read the failing test
2. Write the simplest code that makes it pass
3. No more, no less — don't anticipate future requirements

### Refactor Phase (Sato + Vik)
1. Clean up while tests stay green
2. Vik reviews for simplicity and pattern adherence
3. No new functionality during refactor

## Running TDD

Use the `/tdd` command:

```
/tdd implement the user authentication feature
```

This invokes the full cycle: Tara writes tests, Sato implements, review follows.

## Tara's Veto

Tara has veto power on test coverage. If a work item doesn't have adequate tests:
- The Done Gate fails
- The item doesn't close
- No exceptions

This isn't bureaucracy — it's the discipline that keeps the codebase trustworthy.
