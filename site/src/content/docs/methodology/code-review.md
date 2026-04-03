---
title: Code Review
description: Four parallel lenses catch what single-pass review misses.
---

Every code change in Summon goes through four-lens review. Not sequentially — in parallel.

## The Four Lenses

### Vik — Simplicity & Maintainability
- Is this the simplest approach that works?
- Will a new team member understand this in 6 months?
- Are patterns consistent with the rest of the codebase?
- Are there unnecessary abstractions or premature optimizations?

### Tara — Test Quality & Coverage
- Do tests cover the change adequately?
- Are tests testing behavior, not implementation details?
- Are edge cases covered?
- Would a regression be caught?

### Pierrot — Security & Compliance
- Are there injection vulnerabilities (SQL, XSS, command)?
- Is authentication/authorization correct?
- Are secrets handled properly?
- Are dependencies safe?

### Archie — Architectural Conformance
- Does this conform to the ADR for this area?
- Are module boundaries respected?
- Is the data flow correct?
- Will this create coupling problems?

## Severity Levels

| Level | Action |
|-------|--------|
| **Critical** | Blocks merge. Must fix. |
| **Important** | Should fix before merge. |
| **Suggestion** | Consider for improvement. |
| **Nitpick** | Style preference, take it or leave it. |

Only Critical and Important findings require action.

## Running Code Review

```
/code-review
```

This invokes the composite code-reviewer agent, which spawns all four lenses in parallel and consolidates findings.

## Why Four Lenses?

Single-pass review optimizes for one perspective. A security expert misses maintainability issues. A simplicity-focused reviewer misses auth bugs. By running four lenses in parallel:

- Each lens focuses on what it's best at
- No single perspective dominates
- Review completes faster (parallel, not sequential)
- Findings are categorized by type, making triage easier
