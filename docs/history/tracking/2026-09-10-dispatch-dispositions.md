---
agent-notes: { ctx: "coordinator dispositions for the three-lens review of the dispatcher", deps: [docs/history/code-reviews/2026-09-09-dispatch-vik.md, docs/history/code-reviews/2026-09-09-dispatch-tara.md, docs/history/code-reviews/2026-09-09-dispatch-pierrot.md, docs/methodology/team-layers.md, scripts/dispatch.mjs, scripts/dispatch.test.mjs, scripts/run-checks.mjs, team/events.json], state: active, last: "claude@2026-09-10", key: ["33 findings across three lenses, none critical to Vik or Pierrot, two critical to Tara; all but five applied", "the collision at plan time refuses rather than re-deals: Vik over Tara, with Tara's test rewritten to the decision", "the log stays tracked and treeState ignores .summon/: a decision, recorded here, not a fix"] }
---

# Dispatcher — Dispositions (2026-09-10)

Answers to the three reviews of `scripts/dispatch.mjs` at `a03259a`: Vik's simplicity lens (`../code-reviews/2026-09-09-dispatch-vik.md`, 13 findings, 0 critical), Tara's test-quality lens (`../code-reviews/2026-09-09-dispatch-tara.md`, 11 findings, 2 critical, 8 of 18 mutants survived), and Pierrot's security lens (`../code-reviews/2026-09-09-dispatch-pierrot.md`, 9 findings, 0 critical). Written by the coordinator; reviewers do not write files. The fixes went in as a red phase (Tara: 14 new red tests across `dispatch.test.mjs` and `run-checks.test.mjs`, 8 green pins each proven against a mutant from her review) and a green phase (Sato), in that order.

## Decisions that cut across lenses

| Decision | Reason | Where |
|---|---|---|
| **A collision at plan time refuses; it does not re-deal.** Vik 1 over Tara Critical 1. | A fix-up that satisfies one constraint by breaking another is worse than a refusal that names the seat. The refusal is four lines and is honest on the edge; the common case is still caught at plan time. Tara's candidate test became a pair: `sato: 2` on the `triple` line refuses naming green, review, and sato; `sato: 3` plans with distinct instances. | `team-layers.md` § The work order, `dispatch.mjs` `assign`, `dispatch.test.mjs` |
| **The round-robin rule is specified**: one counter per seat, advanced by every station of every item in line order. Tara Suggestion 1. | Tara declined to pin an unspecified rule; the spec sentence now exists and the test is written from it, not from the implementation. | `team-layers.md`, `dispatch.test.mjs` |
| **The log stays git-tracked and `treeState` ignores `.summon/`.** Pierrot 3, Tara Critical 2. | The `disagreement-rate` and `negative-control` checks read the log in CI, and the log is the record the ADR calls the deep parameter, so it is committed on purpose. The fix is on the other side: the tree state a spawn or a receipt binds to excludes the log's own footprint, so `dirty` means the code and not the record. The test fixture now tracks the log like the repo does, and `run-checks.test.mjs` pins the exclusion. Receipt scrubbing (the home-directory path in check output) is recorded as owed, below. | `run-checks.mjs` `treeState`, `.gitignore` (`.summon/plan.json`), both test files |
| **`claim` trusts self-written `return` events, and canon says so.** Pierrot 2. | Writing `return` from outside the model needs a hook that withholds append rights from seats, which the composer already says is `doctor`'s level, and the line workflow has no filesystem to call the script from. The canon sentence is the honest fix now: the refusal guards against an honest out-of-order run, not a seat that edits the log. `ok: true` and the item are required to release (Vik 4, Vik 11), which closes the accidental version of the hole. | `team-layers.md` § The work order, `team/events.json` (`item` required on `return`), composer Log prose |
| **`--no-worktrees` is cut.** Vik 7 over Tara's original red. | `isolation: "none"` in the adapter already means what the flag meant, and a second knob for one decision is the kind of thing the laziness ladder exists to remove. Tara rewrote the tests to the `none` fixture and added a refusal test for the flag. | `dispatch.mjs` CLI, `dispatch.test.mjs` |

## Vik

| # | Disposition | Where |
|---|---|---|
| 1 | **Applied** as the cross-lens decision above. | `assign` |
| 2 | **Applied.** `loadOrder` refuses a non-positive-integer count naming `instances.<seat>`; `plan` refuses a key no station uses, listing the line's seats. | `loadOrder`, `plan` |
| 3 | **Applied.** No worktree is named on a spawn that made none; with `none`, `worktree: null`. | `open` |
| 4 | **Applied.** Only `ok: true` releases a station. | `returnedStations` |
| 5 | **Applied.** `compose()` is the one place a station's seat is checked against the party. | `plan` |
| 6 | **Applied.** `readJson` and `instanceOf` exported from `team-log.mjs` and imported. | `team-log.mjs`, `dispatch.mjs` |
| 7 | **Applied** as the cross-lens decision above. | CLI |
| 8 | **Applied.** `{ ...item, stations }`. | `plan` |
| 9 | **Applied.** The plan carries `constraints`; `claim` reads one file. | `plan`, `claim` |
| 10 | **Applied.** An isolation value other than `worktree` or `none` is refused at plan time, naming the harness and the value. | `plan` |
| 11 | **Applied.** `item` is required on `return` in the schema, and the composed Log section asks every seat for it. | `team/events.json`, `compose-team.mjs` |
| 12 | **Applied** by Tara. `before` is read before the throw. | `dispatch.test.mjs` |
| 13 | **Deferred.** A shared `scripts/test-fixture.mjs` is the third-copy rung and is owed; it is a refactor across four test files and not this change's job, as Vik says. | |

## Tara

| # | Disposition | Where |
|---|---|---|
| C1 | **Applied, as the refusal** (cross-lens decision). The `triple` line is in the fixture; the dead advance is gone. | `assign`, `dispatch.test.mjs` |
| C2 | **Applied** (cross-lens decision). The fixture matches the repo; the comment says why `dirty` is false; `treeState` is pinned in `run-checks.test.mjs`. | both test files, `run-checks.mjs` |
| I1 | **Applied.** A stranger's return does not release. | `dispatch.test.mjs` |
| I2 | **Applied.** The allow path on `solo` compares instances, not seats. | `dispatch.test.mjs` |
| I3 | **Applied.** Distinct-instance is per item; the precondition is an equality now that the counter rule is specified. | `dispatch.test.mjs` |
| I4 | **Applied.** `tdd` with a single sato plans. | `dispatch.test.mjs` |
| I5 | **Applied.** The chain reaches red when green returned and red never did. | `dispatch.test.mjs` |
| I6 | **Applied.** Worktrees before events, pinned on a non-git root. | `dispatch.test.mjs`, `open` |
| S1 | **Applied** (cross-lens decision). | `team-layers.md`, `dispatch.test.mjs` |
| S2 | **Applied.** An instance-less return does not release; that is now the stated rule. | `team-layers.md`, `dispatch.test.mjs` |
| S3 | **Applied.** The worktree's HEAD equals the spawn's `tree.head`. | `dispatch.test.mjs` |

## Pierrot

| # | Disposition | Where |
|---|---|---|
| 1 | **Applied.** Seat and formation names are validated at plan time; `open` recomputes the worktree path from the instance and refuses a plan that says otherwise, before any side effect. | `plan`, `open` |
| 2 | **Applied in canon; the rest owed** (cross-lens decision). | `team-layers.md` |
| 3 | **Decided, not fixed as proposed** (cross-lens decision): the log stays tracked; `treeState` ignores `.summon/`; `.summon/plan.json` is ignored. Receipt scrubbing is owed to `run-checks.mjs`: strip the repo root from receipt text before it is written. | `run-checks.mjs`, `.gitignore` |
| 4 | **Applied, both halves.** An existing worktree must be a git worktree of its own (`rev-parse --show-toplevel` equal to the path, so a plain directory inside the repo is refused) at the plan's head; a rerun on the same head writes no second spawn. Sato flagged the plain-directory half as open after his pass; the coordinator closed it with a test. | `open` |
| 5 | **Applied** with Vik 2; validation precedes allocation. | `loadOrder` |
| 6 | **Applied.** Item ids are validated at `loadOrder`; station names come from the line, which the party binds. | `loadOrder` |
| 7 | **Deferred.** The log path in `team/checks.json` is the same person's file, and three scripts share the resolution; refusing a path outside the root belongs in one place (`team-log.mjs`) and touches the composer's Log prose. Owed with the receipt scrub. | |
| 8 | **Applied.** `open` refuses outside a git repository, with any isolation. | `open` |
| 9 | **Noted in the header comment.** Two concurrent claims on one item can both pass; the line workflow runs an item's stations sequentially, and `check --line` catches the rest after the fact. No lock until a second caller exists. | `dispatch.mjs` agent-notes |

## Sato's flagged choices

- The `git()` helper in `run-checks.mjs` no longer trims stdout, because trimming ate the leading space of an unstaged porcelain line and shifted the path column; only the sha is trimmed. Inside the file the brief named, one line beyond it.
- `open` also refuses an instance name that is not `seat#n`, since without it the worktree-path check is circular (`instance: "../x"` implies `.summon/worktrees/../x`). Kept: it is validation of the plan's own invariant, not a knob.
- A plan without a `constraints` key is refused at `claim` as stale rather than claiming with none; claiming with no constraints would be a silent weakening of the line.

## Verification

After the green phase and the two coordinator additions: `pnpm test:scripts` 204 pass, `packages/summon-team` 162 pass, `canon check: OK`, `pnpm team:compose` composes 18 files, `team-log.mjs check --line tdd` reports 0 violations over the real log.

## Owed

- A shared test fixture module for the four `scripts/*.test.mjs` files (Vik 13).
- Receipt scrubbing in `run-checks.mjs` and a root-bounded log path in `team-log.mjs` (Pierrot 3, 7).
- `return` events written from outside the model (Pierrot 2), which needs the hook enforcement level.
