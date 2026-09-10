---
agent-notes: { ctx: "the first real runs of the two step-6 workflows, with the human's opt-in", deps: [team/workflows/review-wave.workflow.mjs, team/workflows/line.workflow.mjs, scripts/review-wave.mjs, scripts/dispatch.mjs, scripts/team-log.mjs, team/fixtures/negative-control/README.md, docs/adrs/meta/0015-decomposed-team.md], state: active, last: "claude@2026-09-10", key: ["run 1: five lenses, 34 findings survived 40 refutations, every lens vetoed; the control's split half failed on a unanimous veto", "the control conflates verdict unanimity with absent dissent; the human decides whether that is the instrument or the persona layer", "run 2 ran with isolation none because a harness worktree carries its own copy of the tracked log"] }
---

# First runs of the step-6 workflows (2026-09-10)

The human opted in ("Run both workflows: review-wave against the negative-control fixture, then line against a one-item order"), which is the earn gate ADR-0012 C and ADR-0015 step 6 put on the Workflow primitive. Both runs were made from this session on `claude/summon-team-v3-decomposed-jyiur2` at `bb3d57d`, with every deterministic step run through the scripts and every event on the log written by `review-wave.mjs ingest` or `dispatch.mjs`, not by hand.

## Run 1: the review station against the negative control

**Prepare.** `pnpm team:review prepare` chose five lenses: the four on the floor and the operational lens, which the script triggered because three changed paths matched `src/**`. It skipped accessibility and said why (no path matched the UI globs). The conditional decision was made from the diff by the script, as the ADR promised, not judged.

**Run.** 45 agents: five lens reviewers, then one skeptic per finding (40), in five minutes and about 2.3M tokens. No agent errored or returned empty. The skeptics refuted 6 of 40 findings, and their reasons read as real: two "no default branch" findings fell to TypeScript's exhaustiveness on a single-literal parameter; an "import-time construction" finding fell because the constructor has no side effects; a "column the type does not model" finding fell as speculation without the schema. 34 findings survived, each carrying the skeptic's reason for keeping it.

**Verdicts.** Every lens vetoed: simplicity, test-quality, security, conformance, operational. Kept findings by lens and severity:

| Lens | Critical | Important | Suggestion |
|---|---|---|---|
| simplicity | 4 | 2 | 2 |
| test-quality | 5 | 0 | 2 |
| security | 3 | 1 | 1 |
| conformance | 3 | 4 | 1 |
| operational | 3 | 2 | 1 |

Every planted defect was found by the lens it was planted for, and each lens also found the others' defects through its own question (the simplicity lens vetoed on the SQL concatenation as "the shorter-and-wrong option beside the parameterised one two lines up"; the operational lens on a module that cannot load).

**Ingest.** 41 events written for `negative-control` by `review-wave.mjs ingest` as instance `review-party#2`: claim, 34 findings, five verdicts, return.

**The control.** `pnpm team:control` **failed**: every lens filed findings (the first half passed), but the verdicts were unanimous (the second half failed). `pnpm team:dissent` moved from 0.50 to 0.00 over the two judged items in the window, because the rate reads the latest verdict per lens per item and this run replaced the prose formation's `revise, revise, veto, revise` with five vetoes.

**Reading it honestly.** On paper this is reversal trigger 1, and the fixture's README says to re-argue the persona layer on the evidence rather than retune the fixture. The evidence, read the other way: the fixture carries four critical defects, each lens found its own and named the others, and the reviewer role's own output rule maps a critical finding to a veto. Five lenses that each hold a critical and each return veto are agreeing on the scale, not on the content; the 34 surviving findings disagree in what they point at and why. The instrument says "verdicts must split"; what the ADR wanted to detect is "the lenses stopped arguing", and the two are the same only when the diff has room to split on. A fixture built to be caught by everyone cannot also be the fixture that measures verdict spread.

**Decision (2026-09-10, the human): option 2, taken.** The control now measures presence only (`negativeControl` drops its unanimity half and the CLI prints the verdicts as information); the dissent rate excludes the fixture by name, reports `enough` only on a full window, and its CLI exits 1 only when a full window of real items was unanimous. Canon, the fixture README, the reviewer's two claims, the binding, and the ADR's trigger wording all say the same thing. Against the real log after the change: the control passes (five lenses found something), and the dissent rate reports 2 real items judged and needs 10, exit 0. The options as they were put: (1) keep the instrument as is and treat this as the trigger firing, re-arguing the persona layer; (2) split the control into two claims, "every lens found its planted defect" (deterministic, passed) and "verdicts split on real work" (the dissent rate over ten real items, which today has two); (3) keep both halves but give the fixture a diff with one arguable defect so the verdicts have room to split. The coordinator recommends (2): the sample size for verdict spread is the ten real items the trigger already names, and the planted fixture should measure presence, not spread. The check and the README are unchanged until the human decides.

**Two smaller findings from run 1.**
- The five lens agents each noted that none of the four changed files exist on disk, so they reviewed the diff text alone. The fixture is a diff without a tree; a future fixture could carry the files so the lenses can read context, which the role's Charter tells them to do.
- The floor lenses plus the conditional produced 40 refutation agents for one small diff. At scale the skeptic stage will dominate cost; a cap per lens, or refuting only critical and important findings, is a knob the workflow should carry and log when it drops something.

## Run 2: the line against a one-item order

**The order.** One item, `first-run`: add a `--version` flag to `scripts/team-log.mjs`, tests first, two files only, no commit. Instances: one tester, one coder, one review formation. `dispatch.mjs plan` assigned red to `tara#1`, green to `sato#1`, review to `review-party#1`, and carried the line's two constraints into the plan.

**Isolation.** The plan was opened with `isolation: none`, set on the plan file rather than the adapter, because the harness's worktree isolation gives each station its own worktree, and a worktree carries its own copy of the tracked log: a claim written there would be invisible to the next station and to the main log. Three stations on one item run in sequence, so the main tree was safe. This is a finding against step 6: the dispatcher's worktrees and the harness's worktrees are two different things, and the log lives inside the tree it records. Either the log moves outside the tree (a path the adapter owns, outside the checkout) or the dispatcher's worktree is the one the harness runs the seat in. Recorded as owed; not decided here.

**Open.** Three `spawn` events bound to head `bb3d57d`, `dirty: false` (the tree state ignores `.summon/`, as decided in the dispatcher review).

**Red.** The line workflow's first attempt halted on a bug in the workflow script itself, not in a station: the pipeline hands the first stage the item as its "previous result", and the script spread a field that only later stages carry. The tester had already run and returned before the halt, so the fix (one line: the first stage has no previous) and a resume from the run id replayed her result from cache. `tara#1` claimed red through `dispatch.mjs claim` (the first command in her prompt), appended six tests to `scripts/team-log.test.mjs` derived from the spec, five red and one regression guard green, and wrote her `return` with the station. She flagged that the repo's `package.json` has no `version` field, which the spec did not anticipate and which is outside the item's two files.

**Green.** `sato#1` claimed green; the dispatcher accepted it because red's `return` carried `ok: true` from the claiming instance. He added `loadVersion` beside the other loaders, a one-line bypass in `parseArgs`, and a `main` branch that prints before the schema loads; 27 tests pass, the five red went green, the test file was untouched. He confirmed the flag exits 1 in the real repo with a message naming `package.json`, for the reason the tester flagged.

**Review.** The line's review station failed to start: the workflow spawns each station as the composed seat's agent type, and the harness loads its agent registry at session start, so the composed `review-party` file staged into `.claude/agents/` mid-session was never seen (the registry listed the v2 roster). This is the dependency the ADR's sequencing already states from the other side: step 6 runs whole only after step 7's cutover, or once the line's review station stops depending on a registered agent type. The station was run instead through the review-wave workflow with the dispatcher's check kept in front: `dispatch.mjs claim --station review` was accepted (green had returned `ok: true`; `review-party#1` is not `sato#1`), `review-wave.mjs prepare` built the wave from the two-file diff (the operational lens triggered on `scripts/**`; accessibility skipped), the workflow ran, and `review-wave.mjs ingest` wrote the result as `review-party#1`.

**Review outcome.** 22 agents (five lenses, seventeen skeptics), 17 findings, 12 survived refutation, 5 refuted. Every lens returned `revise`. All five converged on one defect from five directions: the spec's own acceptance command, `node scripts/team-log.mjs --version`, exits 1 in this repo because the root `package.json` carries no `version` field, and every test routes around it through `--root` fixtures, so the suite is green while the one real invocation is red. The test-quality and operational lenses graded it critical; simplicity, security, and conformance graded it important. The rest: the tests never distinguish `--root` from the working directory (a `process.cwd()` implementation would pass), the usage line still omits the flag, `--version` is parsed as a command rather than a flag, the fixtures lean on argument evaluation order, and which `package.json` is the source of truth in a workspace with three sub-package versions is undecided. The refuted five included a "one caller, one export" finding knocked down by the file's own convention (`loadSkin` has the same shape).

**The item's state.** `first-run` sits at `revise`, not done. The change the line produced is committed on the branch as the run's evidence, with the verdicts beside it on the log; the coder's next pass waits on the human's decision about the root `package.json` (finding 6 below).

**What the line check says.** `team-log.mjs check --line tdd`: 3 items, 0 violations. On `first-run` the claims ran red, green, review in order; green and review were held by different instances; every claim was written by `dispatch.mjs claim`, every return by the seat with `ok: true` and the item. `pnpm team:dissent`: 3 judged items, 0 non-unanimous, rate 0.00; the third data point for finding 1, since five `revise` verdicts on a change with one real defect is again agreement on the scale over 12 findings that differ in content.

## Findings against step 6, in one place

1. **The control's split half is the wrong instrument for a planted fixture** (run 1). Decided and applied the same day: presence on the fixture, spread on ten real items.
2. **Two kinds of worktree, and the log inside the tree** (run 2). Owed: a decision on where the log lives, or which worktree a seat runs in.
3. **The line's review station needs a registered agent type** (run 2). Owed: the line workflow's review station should take the review-wave path (prepared lens prompts carried in the line's args, conditional lenses matched by the same globs in the script) so the line runs whole before cutover; after cutover the agent-type path also works.
4. **`ingest` writes its own `claim`** even when the dispatcher already claimed the station, so the review station carries two claim events from the same instance. Harmless to the line check; untidy on the log. Owed: `ingest --claimed` or a check for an existing claim.
5. **The pipeline's first-stage argument** cost one halt and a resume. Fixed in the script; a test that runs the stage functions against a stub `pipeline` would have caught it.
6. **The repo's `package.json` has no `version`.** The tester found it, the coder confirmed it, both kept to scope. The coordinator leaves the decision to the human: add one, or change the spec.

## Verification

After both runs: `pnpm test:scripts` 210 pass (the six new `--version` tests included), `packages/summon-team` 162 pass, `canon check: OK`, `pnpm team:compose` composes 18 files, `team-log.mjs check --line tdd` 3 items and 0 violations. The staged `review-party.md` was removed before the commit; under `.summon/` only the log is tracked now.
