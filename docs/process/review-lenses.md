---
agent-notes: { ctx: "canonical checklists for reusable review lenses; single source for persona + composite reviewer", deps: [CLAUDE.md, docs/process/operational-baseline.md], state: canonical, last: "claude@2026-07-07" }
---

# Review Lenses

The canonical checklists for the **reusable review lenses** — the operational and architectural-conformance passes that run during code review and at the sprint boundary.

These lenses are applied from two places: the owning **persona** (Ines for operational, Archie for conformance), when invoked directly, and the composite **`code-reviewer`** agent, which runs all lenses in one pass. Both reference this file so the checklist has **one home** and cannot drift between them. When a lens gains or loses a check, edit it here; the persona and the reviewer inherit the change.

Two lenses do **not** live here because they already have a single home: Vik's simplicity/YAGNI ladder (`.claude/agents/vik.md`) and Tara's test-quality checklist (`.claude/agents/tara.md`). Pierrot's security lens likewise lives in `.claude/agents/pierrot.md`. This file holds only the lenses that were previously duplicated.

## Operational Review Lens

**Owner:** Ines. **Read-only** — this lens identifies operational concerns and reports them; it does not implement fixes (that is Sato's job).

**Activates:**
- **Code review (situational)** — when the diff changes application behavior (not docs-only, not CI-only). A lightweight check against the list below.
- **Sprint boundary (Step 5b)** — a full audit of every applicable concern in `docs/process/operational-baseline.md` (the 11-concern catalog; this lens is its per-diff subset).
- **Pre-release** — a comprehensive operational-readiness review.

**What it checks:**
- **Logging coverage** — are significant operations logged, at appropriate levels (INFO for operations, WARNING for recoverable issues, ERROR for failures)? Do `--verbose` / `--debug` flags surface the extra detail?
- **Error-pattern consistency** — does new error handling follow the project's established pattern? Are user-facing errors actionable? Are internal errors caught and wrapped?
- **Config validation** — are new config values validated at startup? Do invalid values produce clear messages? Is `.env.example` / config documentation current?
- **Debug support** — can a developer diagnose a failure without attaching a debugger? Are there enough breadcrumbs in logs and error messages?
- **Graceful degradation** — do external calls have timeouts? Do failures produce user-friendly messages rather than stack traces or hangs?
- **Subprocess spawn safety** — do all subprocess spawn calls (`execa`, `child_process`, `spawn`) explicitly configure stdin/stdout/stderr? Is stdin `'ignore'` when the subprocess needs no input? Are timeouts set? Do integration tests spawn the real binary?

## Architectural Conformance Lens

**Owner:** Archie.

**Activates:** when the diff touches shared or core types — types consumed by multiple modules, pipeline abstractions, or types that cross package boundaries.

**Guiding question:** "Does this change introduce assumptions specific to one consumer, format, or platform into a shared type?"

**What it checks:**
1. **Read the relevant ADRs** for the area being changed, and check their fitness functions — does the change violate any?
2. **Consumer-specific leakage in shared types** — units, options, or data structures only one module cares about do not belong in shared types. Shared types use format-neutral representations; consumer-specific conversions happen at the boundary. Format-specific markup attached to a shared AST is flagged when the architecture plans multiple consumers.
3. **Architecture-doc claims still true** — if a doc states a property ("Core is format-neutral"), does the change maintain it?
4. **Flag violations as Important** — or **Critical** if they make a planned capability significantly harder to implement.

**Detection signal:** a shared type imports or references a consumer-specific namespace, uses consumer-specific units without conversion, or exposes properties only one consumer would use.
