<!-- agent-notes: { ctx: "session handoff: emit ADR-0006 progress-note schema with mechanical refusal checks", deps: [docs/adrs/0006-harness-contract.md, docs/scaffolds/progress-note.md, docs/sprints/, docs/tracking/, .claude/progress-note.md], state: active, last: "claude@2026-05-02" } -->

Write the cross-session progress note so the next session can pick up. The output is `.claude/progress-note.md`, conforming to the schema defined in [ADR-0006 § 1](../../docs/adrs/0006-harness-contract.md#1-progress-note-schema). Use [`docs/scaffolds/progress-note.md`](../../docs/scaffolds/progress-note.md) as the structural reference.

> **Schema is binding.** This command refuses to write a non-conforming progress note. See § Refusal Conditions below.

---

## Steps

### 1. Read inputs (in parallel)

- `git log --oneline -10` — recent commits
- `git status --porcelain` — working-tree state (interpret, don't dump)
- `git diff --stat` — uncommitted summary
- Active sprint plan in `docs/sprints/sprint-N-plan.md`
- Active tracking artifacts in `docs/tracking/` (most recent N relevant to in-flight work)
- Prior progress note at `.claude/progress-note.md` (if it exists). Preserve:
  - Learnings flagged `pending-promotion: <destination>` — carry forward verbatim with original session date.
  - Unresolved Blockers — carry forward with stable IDs preserved.
  - State is rewritten from scratch (do NOT carry forward).
- **Board check (if configured):** if `CLAUDE.md` has non-empty `project-number` and `project-owner`, run `gh auth status` then `gh project item-list <NUMBER> --owner <OWNER> --format json`. Board failure does NOT block the write — record `board: unavailable; reason: <reason>` in State.

### 2. Author the progress note

Write the file to `.claude/progress-note.md` using this exact structure (header + five named sections). Each section's content rules are below; see the [template](../../docs/scaffolds/progress-note.md) for filled-in examples.

#### Header (mandatory)

```yaml
session-date: <YYYY-MM-DD>
author: <coordinator | cam | <agent-name-in-proxy-mode>>
prior-note-commit: <git-hash-of-prior-progress-note, or "none">
```

To find the prior-note commit: `git log -1 --format=%H -- .claude/progress-note.md` (returns empty for first session — write `none`).

#### Section 1: State

What is true *right now*. Each claim **MUST** cite the artifact it was read from (commit hash, file path, board item ID). State is interpreted, not dumped.

Suggested fields: branch, last commit, working tree, in-flight work item, current phase, sprint/wave, board status. Each line carries an inline citation: `*(cited: <source>)*`.

#### Section 2: Next Step

Exactly **one** sentence describing the single next action. **MUST** cite:
- the work-item ID,
- the file path the action operates on,
- a `gates:` list of Blocker IDs that gate the action (`gates: []` if unblocked).

If the session ended in an undecidable state with multiple candidate next steps, that is itself a Blocker — record it as `B<N>` and let the gate fire.

#### Section 3: Learnings

Each learning **MUST** be one of:
- **(a) promoted** to its destination (gotcha, ADR amendment, code-map entry) with a citation showing where the promotion lives, OR
- **(b) flagged** `pending-promotion: <destination>` with a one-sentence rationale for why it isn't promoted yet.

A learning that is neither is non-conformant. A Learning MAY reference an Open Question by its addressee (e.g., "see OQ for human") to avoid duplication.

#### Section 4: Open Questions

Each MUST cite *who* answers (human / Pat-in-proxy / a specific agent) and *why* it blocks. A question with no addressee is non-conformant. Distinct from Blockers — Open Questions may be team-answerable; Blockers require explicit human input.

#### Section 5: Blockers

Decisions awaiting the human (or Pat in proxy mode). Each Blocker MUST have:
- a stable ID: `B1`, `B2`, … in order of appearance, **never reused** across sessions for unresolved blockers.
- the decision required.
- `verdict:` either Pat's proxy verdict or `awaiting-human`.
- (recommended) `verdict-rationale:` one line — required if Pat applied a verdict.
- (required) `reversibility:` one of `reversible`, `costly-to-reverse`, `irreversible`.

**Migrating legacy `## Proxy Decisions (Review Required)` entries** (one-time at W1.3 close, then never again):

| Legacy field | Blocker target |
|---|---|
| `question` | decision required |
| `decision` | `verdict` (or `awaiting-human` if unanswered) |
| `rationale` | sub-field `verdict-rationale:` |
| `reversibility` | sub-field `reversibility:` |

### 3. Validate against refusal conditions

Before writing, the command checks **all six** conditions below. Refuse to write — exit with the violating field named — if **any** hold:

1. **Header missing** `session-date`, `author`, or `prior-note-commit`.
2. **More than one Next Step** supplied.
3. **Next Step's `gates:` list contains a Blocker ID whose status is non-resolved** (e.g., `awaiting-human`). The check is mechanical: read Next Step's `gates:` list, look up each cited Blocker ID in the Blockers section, refuse if any is unresolved. **No semantic-dependency reasoning** — if Next Step is gated, Next Step lists it; if not listed, the gate does not fire. (Caller resolves the blocker, removes it from the gates list with explicit justification recorded in Learnings, or changes the Next Step.)
4. **A Learning is neither promoted nor flagged** with `pending-promotion: <destination>`.
5. **An Open Question lacks an addressee.**
6. **A Blocker is missing a stable ID, or two unresolved Blockers share an ID.**

### 4. Write the file

Write `.claude/progress-note.md` (overwriting the prior one — its content is preserved in git history).

### 5. Commit (separately — confirm with user)

Stage and commit only if the user wants the handoff committed in this session. Otherwise leave it staged. Use a conventional commit message like `docs(handoff): session N progress note`.

---

## Important

- The schema is binding per ADR-0006. **Do not** silently downgrade refusal conditions to warnings.
- The progress note **replaces** the legacy `.claude/handoff.md`. After W1.3 close, `handoff.md` is a single-line redirect — do not write to it.
- "Read code-map.md first" was the prior-handoff convention but `code-map.md` is in `docs/scaffolds/` until a scaffold command moves it. If it doesn't exist, point the resuming session at `CLAUDE.md` § Project Structure instead.
- The resume order at session start is: **State → Blockers → Open Questions → Next Step → Learnings**. Blockers can change Next Step, so they're read first.
- The `/resume` command is the consumer; if you change the schema here, update `/resume` too.
- Don't include sensitive information (tokens, credentials, personal data).
- Add agent-notes frontmatter to the progress-note file per `docs/methodology/agent-notes.md`.
- If a refusal condition fires, the failure mode is *user error caught early*, not *missing output*. Surface the violating field clearly so the caller can fix and re-run.
