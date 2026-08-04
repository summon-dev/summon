---
description: "Produce an implementation plan, scanning first for architecture decisions needing a gate."
---
<!-- agent-notes: { ctx: "implementation planning workflow", deps: [docs/methodology/personas.md, docs/methodology/phases.md], state: active, last: "claude@2026-08-04" } -->
I need to plan the implementation of: $ARGUMENTS

Before writing the plan, ensure the goal is well-understood. If the request is vague, first run through Coach Cam elicitation (see `docs/methodology/personas.md`) or use `/kickoff` for full discovery.

## Architecture Decision Scan (Mandatory Pre-Step)

Before writing the plan, scan the work items for architectural decisions:

1. **For each item, ask:** Does this involve a new pattern, new integration, technology choice, data model change, or package boundary?
2. **If yes:** The item requires the Architecture Gate (see CLAUDE.md § Architecture Gate). Flag it in the plan as "**Requires Architecture Gate:** ADR + Wei debate before implementation."
3. **If any items require the gate:** The plan must schedule Phase 2 (Architecture) before Phase 3 (Implementation) for those items. They cannot enter the TDD pipeline until the ADR exists, Wei has challenged it, and the debate is tracked.
4. **List gated items** in a dedicated section of the plan document.

## Plan Document

Create or update a plan document in `docs/plans/`. The plan should include:

1. **Goal** — What we're trying to achieve and why.
2. **Constraints** — Any relevant ADRs, conventions, or technical limitations.
3. **Architecture Gate Items** — Items requiring ADR + Wei debate before implementation. For each: what decision needs an ADR, and why it's architectural (not just implementation detail).
4. **Approach** — Step-by-step implementation plan following TDD. Gated items must show Architecture phase before Implementation phase.
5. **Personas involved** — Which Summon agents should be consulted during implementation? (See `docs/methodology/personas.md`.) Include Wei for any gated items.
6. **Open Questions** — Anything that needs clarification before starting.
7. **Not Yet Specified** — Questions you can tell are coming but cannot yet phrase precisely, because they hang on questions still open. See below.
8. **Out of Scope** — Work consciously ruled outside this plan's goal, each with the reason. See below.
9. **Acceptance Criteria** — How we'll know the work is done.

Check existing ADRs and plans for context before writing. Add agent-notes frontmatter per `docs/methodology/agent-notes.md`.

### Not Yet Specified vs. a work item

A plan that lists only what it knows overstates its own confidence. **Not Yet Specified** is the deliberate record of what remains unclear — in scope, just not sharp enough to act on.

The test is whether you can **state the question precisely now — not whether you can answer it now**:

- **Make it a work item** when the question is already sharp, even if it is blocked and nothing can start on it yet.
- **Leave it in Not Yet Specified** when you cannot yet phrase it that sharply.

Do not pre-slice the unclear into item-sized pieces — one entry may later become several items, or none. Resolving an item is what makes the next questions specifiable; when that happens, promote them to real work items and delete them from this section so each lives in exactly one place.

### Out of Scope

Unclarity only ever gathers *toward* the goal. Work past the goal is not unclear, it is **out of scope**, and it gets recorded rather than silently dropped: one line for the gist plus why it is out. Scope, not sharpness, lands it here.

Out-of-scope entries never graduate into work items. They return only if the goal itself is redrawn, and then as a fresh plan. If an existing work item turns out to sit past the goal, close it and record one line here rather than completing it — a scope boundary is not a step on the route.

_Both sections adapt conventions from [mattpocock/skills](https://github.com/mattpocock/skills) (`wayfinder`), MIT © 2026 Matt Pocock._

## Tracking Artifact

After the plan document is written, produce `docs/tracking/YYYY-MM-DD-<topic>-plan.md` summarizing the plan's goals, approach, key constraints, and acceptance criteria. Use the standard tracking format from `docs/process/tracking-protocol.md`. Set **Prior Phase** to the most recent tracking artifact for this topic (if any), or "None" if this is a standalone plan.

## Development Environment Check

After the plan is written, check whether a devcontainer is set up:

1. Check if `.devcontainer/devcontainer.json` exists.
2. **If it does not exist:** Ask the user: "No devcontainer is configured for this project. Would you like me to set one up before we start implementation? This ensures a consistent development environment. I can run `/devcontainer` to create one."
   - If yes: run `/devcontainer` with the project's tech stack as context.
   - If no: note the decision and proceed.
3. **If it already exists:** No action needed — proceed to implementation.
