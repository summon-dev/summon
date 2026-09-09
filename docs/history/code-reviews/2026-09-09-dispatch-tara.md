<!-- agent-notes: { ctx: "Tara test-quality review of dispatch.test.mjs", deps: [scripts/dispatch.test.mjs, scripts/dispatch.mjs, docs/methodology/team-layers.md, team/events.json], state: active, last: "tara@2026-09-09", key: ["18 mutants run; 8 survived the 35-test suite", "plan-time distinct-instance advance is dead code under every tested line", "tree.dirty=false is green only because the fixture ignores .summon/ and the real repo does not", "7 candidate tests proven to kill their mutants in scratch; none added to the tree"] } -->

# Test-quality review: `scripts/dispatch.test.mjs`

**Scope:** `/home/user/summon/scripts/dispatch.test.mjs` (35 cases, `node --test`, 35 pass) reviewed against `/home/user/summon/scripts/dispatch.mjs` and the spec at `/home/user/summon/docs/methodology/team-layers.md` § The work order and § The line, plus the `workOrder` and event shapes in `/home/user/summon/team/events.json`. Reviewer, not author. No file other than this one was edited; the tree was left as found (`git status --short` clean at the end).

## Method

Read the spec's three bullets first and listed their rules; then the implementation; then the tests. Then copied `scripts/` and `team/` to the scratchpad and ran eighteen single-point mutants of `dispatch.mjs` against the unchanged suite. For each survivor I wrote a candidate test in the scratch copy and confirmed it (a) passes on the original and (b) fails on the mutant, so every "test I would add" below is proven load-bearing, not guessed. Nothing under the repo was modified during the run.

Red-phase pre-flight on the suite as a whole: **time** is pinned (every `at` is an injected constant; every CLI call passes `--at`; no wall-clock read anywhere). **Direction** of the order constraint (red before green before review) and of distinct-instance (green and review must differ) is taken from `team/lines/tdd.json` and the spec, not from the implementation. **Path** is the production path: the tests import `./dispatch.mjs` and the CLI tests execute the script itself, and test 35 plans the spec's own example order against the checked-in `summon-core` party. Those three hold.

## Question 1: coverage against the spec's three bullets

| Bullet | Rule | Pinning test (`dispatch.test.mjs`) | Held under mutation? |
|---|---|---|---|
| plan | loads the party, the line, and the adapter | :243 (order/party/line/harness/limits) | yes |
| plan | refuses a line the party does not opt into | :324 | yes |
| plan | refuses a seat the party does not compose | :329 | yes |
| plan | refuses an instance count over `dispatch.concurrency` (and allows exactly at) | :339 | yes, M1 killed |
| plan | refuses a `distinct-instance` constraint that cannot be met (same seat, fewer than two instances) | :310, :315 | yes, M2 killed; **but the converse, a different-seat line with one instance, is never planned** (M16 survived; see Important 4) |
| plan | names every instance `seat#n` with a worktree under `.summon/worktrees/<instance>` when isolation is `worktree` | :243 | yes |
| plan | worktree null when isolation is not `worktree` | :287 | yes |
| plan | one instance per station per item, round-robin | :260, :272 | yes for a seat with one station; **the counter's semantics for a seat with two stations is unpinned** (M11; Suggestion 1) |
| plan | for every `distinct-instance` constraint the instances on an item differ | :298 | **no. M3 survived: the advance at `dispatch.mjs:79-84` can be deleted** (Critical 1) |
| plan | a station is never left to choose its own instance | :260 (every station instance is a named one) | yes |
| plan | a seat the order does not name gets one instance | :279 | yes, M17 killed |
| (parallelism para.) | a `dispatch: null` adapter cannot dispatch | :346 | yes |
| open | one `spawn` per instance, carrying `harness`, `instance`, `order`, `tree`, `worktree` | :361, :386 | yes for the fields; **`tree.dirty` is green only by fixture arrangement** (Critical 2) |
| open | creates the worktrees when isolation asks for it | :386, :399, :407, :562 | yes; the worktree's HEAD is never compared to the `tree.head` the spawn bound (Suggestion 3) |
| open | (implementation's own claim, agent-notes line 2) a refused open writes nothing | :417 for a schema refusal | schema path yes; **worktree-failure path no** (M12; Important 6) |
| claim | writes the `claim` for the instance the plan assigned | :440, :503, :548 | yes |
| claim | refuses when the item's earlier stations have not returned (`order`) | :448, :462, :570 | deletion caught (M4 killed); **weakening to "only the previous station" survives** (M9; Important 5); **a return from a stranger instance releasing survives** (M7; Important 1) |
| claim | refuses when the assigned instance already holds a separated station (`distinct-instance`) | :477 | deletion caught (M5 killed); **seat-level comparison survives** (M8; Important 2); **item-blind comparison survives** (M10; Important 3) |
| claim | refuses *before writing* | :448, :462, :477, :495, :570 | yes, M15 killed by five tests |
| claim | (implementation) off-plan item or station refused | :495 | yes |

Rules with no test at all: the distinct-instance advance at plan time (row 9), the single-sato tdd order (row 5 converse), the stranger-return case, the skipped-earlier-station case, the claim-time distinct-instance allow path on a shared seat, and the per-item scope of distinct-instance at claim time. Each has a proven test below.

## Question 2: mutation resistance of the three named enforcement points

| Enforcement point | Mutant | Result |
|---|---|---|
| concurrency refusal (`dispatch.mjs:118-120`) | M1: condition replaced by `false` | killed by :339 |
| distinct-instance at plan time, refusal (`dispatch.mjs:110-116`) | M2: `< 2` replaced by `false` | killed by :310 and :315 |
| distinct-instance at plan time, **advance** (`dispatch.mjs:79-84`) | M3: the collision check replaced by `continue` | **survived, 35/35 green** |
| order at claim time (`dispatch.mjs:191-195`) | M4: `if (owed) throw` disabled | killed by :448, :462, :570 |
| order at claim time, weakened | M9: only the immediately preceding station is checked | **survived** |
| distinct-instance at claim time (`dispatch.mjs:196-201`) | M5: `if (held) throw` disabled | killed by :477 |
| distinct-instance at claim time, weakened | M8: compare `seat` instead of `instance`; M10: drop `e.item === item` | **both survived** |

Full run, 18 mutants: killed M1, M2, M4, M5, M6 (claim counts as return), M13 (returned-stations ignores item), M15 (append before guards), M17 (unnamed seat gets 2). Survived M3, M7, M8, M9, M10, M11, M12, M14, M16, M18. M14 and M18 are benign (see Clean).

## Findings

### Critical

**Critical 1. The plan-time distinct-instance advance is dead under every line the suite plans; deleting it keeps 35/35 green.**
`dispatch.mjs:79-84` (the advance); `dispatch.test.mjs:298-308` (the test that believes it pins this).
The `solo` line puts green and review on consecutive draws of the same seat. With one round-robin counter per seat and `n >= 2`, two consecutive draws never coincide, so `a.instance !== b.instance` is always true and the `for (const c of distinct)` body never runs. Test :298 goes green on the round-robin alone. The spec's rule ("so that for every `distinct-instance` constraint the instances on an item differ") is therefore certified by a test that would certify an implementation with no separation logic at all. The production failure this hides: any line with a third same-seat station between the two constrained ones (green, polish, review all on sato, with sato: 2) plans the coder and the reviewer as the same instance, and the log check catches it only after the fact.
Test to add: `plan separates green and review when the round-robin draw would land them on the same instance` using a `triple` line (red/tara, green/sato, polish/sato, review/sato; distinct on green and review) with `instances: { tara: 1, sato: 2 }`. The assertion that matters: `assert.notEqual(s.green.instance, s.review.instance)` for every item. Proven: passes on the original, fails on M3.

**Critical 2. `tree.dirty === false` at open is green because the fixture ignores `.summon/` wholesale; the real repo does not.**
`dispatch.test.mjs:171` (`".gitignore": ".summon/\n"`), `:380` (the assertion and its comment ".summon/ is ignored, so the log itself does not dirty the tree"), `:195` (`PLAN = ".summon/plan.json"`); versus `/home/user/summon/.gitignore:31` (`.summon/worktrees/` only) and `git ls-files .summon` (`.summon/team-log.jsonl` is tracked).
The comment states a product property; it is a fixture property. In this repo, `plan --out .summon/plan.json` leaves an untracked file and `open` then records `dirty: true`; and because the log is tracked, every `open` after the first append records `dirty: true` for the rest of the session. The spawn's `tree` is meant to bind an instance to a tree state (the same `{head, dirty}` a check receipt is invalidated by); the suite certifies "clean" as the normal reading when in the real repo it is not. This is a fixture-honesty failure in the test and a design question for the implementation (should `treeState` exclude the log and the plan, or should `.summon/` be ignored and the log stop being tracked?). The test should not decide that; it should stop asserting it.
Test change: at :380 assert `typeof e.tree.dirty === "boolean"` and drop the comment, or make the fixture's `.gitignore` match the repo's (`.summon/worktrees/` only) and assert whatever the product then does once Sato and Archie have decided. Route the design question to Sato; it belongs in the implementation's agent-notes or an ADR note, not in a test comment.

### Important

**Important 1. A `return` from an instance that never claimed on the item is under-tested (Sato's seam 1).**
`dispatch.mjs:166-176` (`returnedStations`); mutant M7 (any return on the item releases whatever is held) survived.
The suite's only `return` events are written by the instance that holds the station. The spec's rule is that the *earlier station* must have returned, and the implementation derives that station from the returning instance's last claim. Nothing checks that a stranger's return does not count. Failure hidden: a review-party return on item i1 written before sato has finished releases green.
Test to add: `a return from an instance that never claimed on the item does not release the station another instance holds`: tara#1 claims red on i1, append `return` from sato#2 on i1, then `assert.throws(() => claim(... station: "green"), /red/)`. Proven against M7.

**Important 2. The claim-time distinct-instance allow path on a shared-seat line is never exercised; a seat-level comparison survives.**
`dispatch.mjs:199` (`(e.instance ?? e.seat) === st.instance`); mutant M8 survived.
Test :477 covers only the refusal, and :503 walks the `tdd` line where green and review are on different seats, so `seat === seat` and `instance === instance` are indistinguishable. Failure hidden: an implementation that compares seats refuses every legitimate review on a line where one seat codes and reviews, which is the whole reason `distinct-instance` exists.
Test to add: `claim on review succeeds for the plan's other sato instance when a different sato instance coded the item` on `solo` with `sato: 2`: walk red and green with returns, then `const review = claim(...)` and `assert.notEqual(review.instance, green.instance)` plus `assert.equal(review.instance, s.review.instance)`. Proven against M8.

**Important 3. Distinct-instance at claim time is not shown to be per item.**
`dispatch.mjs:199` (`e.item === item`); mutant M10 survived.
The spec scopes maker-checker "per work item". An implementation that refuses sato#1 from reviewing i2 because it coded i1 breaks every multi-item plan on a shared-seat line, and no test notices.
Test to add: `distinct-instance is per item: the instance that coded i1 may review i2` on `solo` with `sato: 3` (fits the fixture's concurrency of 4): assert the plan reuses i1's coder as i2's reviewer, walk both items through red and green, then `assert.equal(claim(... item: "i2", station: "review").instance, coderOf1)`. Proven against M10 (and, through its precondition, M8 and M11).

**Important 4. The `tdd` line with a single sato is never planned, so a refusal that ignores seat equality survives.**
`dispatch.mjs:113` (`a.seat === b.seat`); mutant M16 survived.
Every order in the suite that plans `tdd` carries `sato: 2` (:117, :280, :594). The spec's refusal is specific: "two constrained stations on the same seat with fewer than two instances". A version that refuses any order with `sato: 1` on `tdd` (where green and review are on different seats) rejects the most common one-human dispatch and no test fails.
Test to add: `plan accepts the tdd line with a single sato, because green and review sit on different seats`: `instances: { tara: 1, sato: 1, "review-party": 1 }`, `assert.equal(p.instances.length, 3)`, `assert.notEqual(s.green.instance, s.review.instance)`. Proven against M16.

**Important 5. Test :462 is named "chains every earlier station" but exercises only the immediately preceding one.**
`dispatch.test.mjs:462-475`; `dispatch.mjs:193` (`c.stations.slice(0, indexOf(station))`); mutant M9 (check only the previous station) survived.
In :462 red has returned when review is claimed, so "green owed" and "any earlier station owed" coincide. A hand-written log with green returned and red never claimed is exactly the case the chain is for.
Test to add: `claim on review refuses naming red when green has returned but red never did`: append a green claim and return by sato#1 on i1 with no red events, then `assert.throws(() => claim(... station: "review"), /red/)`. Proven against M9. Rename :462 or add this as a sibling.

**Important 6. "Worktrees before events" is a stated invariant with no test.**
`dispatch.mjs:156-159` and the agent-notes claim at `dispatch.mjs:2` ("a refused open ... leaves the log untouched"); mutant M12 (append, then add worktrees) survived.
:417 covers the schema-refusal path only. A failed `git worktree add` after the events are written leaves four spawn events for instances that have nowhere to run.
Test to add: `open leaves the log untouched when a worktree cannot be created`: a non-git fixture root with worktree isolation and `worktrees` defaulted on; `assert.throws(() => open(...), /worktree/)` then `assert.deepEqual(logOrEmpty(root), [])`. Proven against M12.

### Suggestion

**Suggestion 1. The round-robin counter's granularity (Sato's seam 2) is unspecified, so any pin is a mirror.**
`dispatch.mjs:69-75`; mutant M11 (one counter per seat *per station*) survived the 35 tests and died only to the precondition in the Important 3 test.
On `solo` with `sato: 2`, one counter per seat means sato#1 codes every item and sato#2 reviews every item, forever; a per-station counter would rotate them. The spec says "round-robin" and nothing more, so I derived no expected direction from it and will not pin one from the implementation. Ask Sato to add one sentence to § The work order stating the rule (per seat across stations, in the order the line draws), then pin it with a test whose expected assignment is written from that sentence: `solo`, `sato: 2`, three items, expected `green` = `["sato#1","sato#1","sato#1"]` and `review` = `["sato#2","sato#2","sato#2"]`. Until the sentence exists, the precondition assertion in the Important 3 test should be written as a search (find an instance that codes one item and reviews another) rather than an equality.

**Suggestion 2. A `return` that carries `seat` but no `instance` is an unpinned decision (seam 1 again).**
`dispatch.mjs:171` (`e.instance ?? e.seat`); mutant M14 (drop the fallback) survived because no test writes an instance-less event.
`team/events.json` makes `instance` optional on every event and the spec says "most carry `instance`". A human appending `{seat: "tara", event: "return", item: "i1"}` by hand today releases nothing, because "tara" never equals "tara#1". That may be right (an event without an instance cannot be matched to a claim) but it should be a stated rule with a test either way: `a return without an instance does not release a station claimed by a named instance` or its opposite.

**Suggestion 3. The worktree is never shown to sit at the head the spawn event bound.**
`dispatch.test.mjs:386-397`; `dispatch.mjs:143` (`git worktree add --detach`).
The spawn carries `tree.head` so a seat's receipts bind to a known state; the worktree it runs in should be at that commit. Add to :386: `assert.equal(git("-C", join(root, ".summon/worktrees/sato#1"), "rev-parse", "HEAD"), log[0].tree.head)`.

## Question 3: fixture honesty, the rest

- **`.gitignore`**: not honest; see Critical 2.
- **`.summon/plan.json`**: the spec allows the plan file "anywhere", so the location is fine as a test choice; its only effect on greenness is through the ignore rule above.
- **`#` in worktree paths**: honest. The tests create real worktrees with `#` in the path on a real `git init` repo and confirm both the directory and `git worktree list --porcelain` (:386, :562). Git and the filesystem accept it; the repo's `.summon/worktrees/` ignore line covers it (`git check-ignore` confirms). No test relies on a shell interpolation of the path.
- **Test 35 against the real repo** (:593): honest. `plan` calls `compose(REPO, ...)`, which returns files without writing (writing happens only in `compose-team.mjs` `main`, :496-502); `git status --short` was clean after the run. It pins the live adapter's `concurrency: 10`, which is a deliberate smoke test, not a mirror.

## Question 4: the two seams

- **Return carries no station; derived from the last claim.** Under-tested. The only returns in the suite come from the holding instance, so a stranger's return (Important 1) and an instance-less return (Suggestion 2) are both unpinned. The "last claim" part (an instance that has claimed twice on one item releases only the later station) is unreachable on the shipped lines because `order` forces a return before the next claim, so I am not asking for a test of it; note it in the implementation's key list instead.
- **One counter per seat across stations.** Unpinned by the 35 tests (M11 survived), and correctly so until the spec says which behaviour is intended (Suggestion 1). The Important 3 test pins it as a side effect; treat that as a flag for Sato, not a decision by the test.

## Clean

- Every `at` is injected; there is no `Date.now()`, `new Date()`, or clock read in the suite. The CLI's wall-clock default is exercised nowhere, which is right: it is the one line that cannot be pinned.
- The refusal-writes-nothing rule is well held: M15 (append before the guards) is killed by five separate tests.
- The order guard per item is held: M13 (returned-stations ignores item) is killed by :448's `i2` assertion; M6 (a claim counts as a return) is killed by :454.
- M18 (drop the pre-validation in `open`) survives only because `appendEvent` validates each event and all four spawn events share a shape, so the first append throws before anything is written. No observable difference; not a finding.
- Error messages are asserted by content (item, station owed, instance, count and limit), not by exact string, so wording can change without churn.
- The end-to-end walk at :503 closes the loop with `checkLog`, so dispatch's log and `team-log check --line` agree on what clean looks like.
- Fixture isolation is good: each test gets its own `mkdtemp` root, cleaned in `after`; no test depends on another's log.
- The CLI tests use `execFileSync` with a 20 s timeout and assert on exit status and stderr, the same entry point a human uses.

No veto. The two Criticals are false greens on a named enforcement point and on a product claim, and both have a proven test or a one-line assertion change; they block under the normal review gate, not by veto.

TARA-COMPLETE: 11 findings, 2 critical
