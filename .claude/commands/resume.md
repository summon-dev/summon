<!-- agent-notes: { ctx: "resume from previous session progress note (ADR-0006 schema)", deps: [.claude/progress-note.md, .claude/handoff.md, CLAUDE.md, docs/sprints/, docs/adrs/0006-harness-contract.md], state: active, last: "claude@2026-05-02" } -->
Resume from a previous session's progress note.

## Steps

1. **Read the progress note.** Read `.claude/progress-note.md` (the canonical cross-session artifact per [ADR-0006](../../docs/adrs/0006-harness-contract.md)). If it doesn't exist, fall back to `.claude/handoff.md`:
   - If `handoff.md` is the **single-line redirect** (`## REDIRECTED → .claude/progress-note.md ...`), the progress note is missing — tell the user there's no resumable state and ask what they'd like to do.
   - If `handoff.md` contains **prose content (pre-redirect format)**, the checkout may be stale. Stop and re-fetch from origin before proceeding. After re-fetch, if `handoff.md` is still prose, this is a one-time legacy-resume; read it as the prior `/resume` did and warn the user that the next `/handoff` will write the new schema.
   - If neither file exists, tell the user there's no progress note to resume from and ask what they'd like to do.

2. **Read the progress note in the prescribed order: State → Blockers → Open Questions → Next Step → Learnings.** Per ADR-0006 § 5 Lifecycle item 4, blockers can change Next Step, so they're read before Next Step. If the schema is malformed (missing header, missing section, citation rule violations), surface the violation to the user — the prior session's `/handoff` should have refused; treat malformed state as suspicious.

3. **Read project context.** In parallel, read:
   - `CLAUDE.md` (already loaded, but review for any recent changes)
   - `docs/product-context.md` (if it exists — the human's product philosophy)
   - The current sprint plan in `docs/sprints/` (referenced by State)
   - Tracking artifacts in `docs/tracking/` referenced by State or Learnings
   - The auto-memory file at the path shown in your system prompt (if it exists)

4. **Verify state against the workspace.** Run these checks:
   - `git log --oneline -5` — does the last commit match what the progress note's State cites?
   - `git status` — is the working tree clean? If not, investigate before proceeding.
   - The progress-note header's `prior-note-commit` should be reachable in `git log`; if not, the file is from a different branch or rewritten history — flag it.
   - **GitHub Board Pre-Flight (Blocking):** If `CLAUDE.md` has a `project-number` and `project-owner` configured (not commented out / not blank), run the full pre-flight:
     1. `gh auth status` — if this fails, STOP: "GitHub CLI is not authenticated. Please run `gh auth login` and try again."
     2. `gh project field-list <NUMBER> --owner <OWNER> --format json` — if this fails, STOP: "Cannot access project board #<NUMBER>. Check your auth scopes (you may need `gh auth refresh -s project`) and that the project exists."
     3. Verify the Status field has all 5 required options (Backlog, Ready, In Progress, In Review, Done). If any are missing, STOP and report.

     **Do not proceed to step 5 if board access fails.** A sprint running without board access causes silent tracking failures — every status transition is skipped, and the sprint boundary will find a broken board. Fix it now, not after a full sprint of lost state.

5. **Summarize to the user.** Give a brief (5-10 line) summary:
   - What the previous session accomplished (from State + recent commits)
   - Current state of the project (from State)
   - Active Blockers and Open Questions
   - What you're about to do next (from Next Step)

6. **Surface Blockers FIRST.** If the progress note's Blockers section has any entry with `verdict: awaiting-human` (or any non-resolved status), surface them to the human **immediately** before continuing any other work. Ask: "These blockers are awaiting your input — please resolve before I proceed." Do not proceed until the human resolves or explicitly defers each blocker. If Pat applied proxy verdicts, also surface those for review: "Pat applied these proxy verdicts while you were away — do you want to override any?"

7. **Ask for confirmation.** Before executing, ask: "Ready to pick up from here? Or would you like to adjust the plan?"

8. **Execute.** Proceed with the **Next Step**. Follow all CLAUDE.md conventions (TDD, conventional commits, agent-notes, etc.). Honor the `gates:` list — if Next Step lists gates that are still unresolved, stop and resolve them first.

## If the user provides $ARGUMENTS

Treat the arguments as an override or addition to the progress note's Next Step. For example:
- `/resume focus on issue #14` — prioritize that issue over the recorded Next Step
- `/resume skip to deployment` — jump ahead in the plan

## Important

- Do NOT blindly trust the progress note. Verify against actual repo/board state. If there's a discrepancy, flag it.
- The progress note is a starting point, not a straitjacket. If the user wants to change direction, that's fine.
- After resuming and completing a significant chunk of work, consider running `/handoff` again to update the progress note for the next potential session break.
- Pending-promotion Learnings carry forward across sessions until promoted. Don't drop them.
