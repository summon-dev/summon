<!-- agent-notes: { ctx: "Vik simplicity review of dispatch.mjs and its tests", deps: [scripts/dispatch.mjs, scripts/dispatch.test.mjs, docs/methodology/team-layers.md, team/events.json, scripts/team-log.mjs, scripts/compose-team.mjs], state: active, last: "vik@2026-09-09", key: ["distinct-instance fix-up in assign is dead for every checked-in line and emits a wrong plan when it fires", "instances shape is unchecked: 0 crashes bare, 1.5 and a typo pass silently", "--no-worktrees writes a spawn event naming a worktree that does not exist", "a return with ok:false releases the station", "isolation is the one adapter value a second harness would have to teach this script"] } -->

# Code review: `scripts/dispatch.mjs` (simplicity lens)

**Reviewer:** Vik. **Date:** 2026-09-09. **Branch:** `claude/summon-team-v3-decomposed-jyiur2`.
**Scope:** `scripts/dispatch.mjs` (260 lines) and `scripts/dispatch.test.mjs`, shape only. Spec `docs/methodology/team-layers.md` § The work order, § The line; schema `team/events.json`; house style from `review-wave.mjs`, `run-checks.mjs`, `team-log.mjs`, `compose-team.mjs`. Tara has test quality; Pierrot has security.
**Ran:** `node --test scripts/dispatch.test.mjs` (35 pass). Probed `plan()` in a scratch team against a three-stations-on-one-seat line, a zero count, a fractional count, and a typo'd seat; results cited inline.

## Critical

None. The worst outcome below (a wrong plan) is refused later by `claim`'s log check, so nothing ships a broken separation of duties. It just ships a confusing refusal at the wrong step.

## Important

1. **`assign` fix-up loop is dead code that gives a wrong answer when it wakes up.** `scripts/dispatch.mjs:79-84`. With one counter per seat, two consecutive draws for the same seat never collide, so for `tdd` and for the test's `solo` line (the only same-seat shape anyone has written) lines 79-84 never execute; no test reaches them. When a line has three stations on one seat with overlapping constraints (`distinct(green,review)`, `distinct(polish,review)`, `sato: 2`), the one-pass bump satisfies the second constraint by re-breaking the first and `plan` returns `green=sato#1 polish=sato#2 review=sato#1` without refusing, though `green=#1 polish=#1 review=#2` is valid. Spec line 189 promises "for every distinct-instance constraint the instances on an item differ." A fix-up that can't keep that promise is worse than a refusal that says so. Fix: delete 79-84; after drawing an item's stations, walk `distinct` once and `throw new Error(\`item "${item.id}": stations "${a.station}" and "${b.station}" both fall to "${a.instance}"; give seat "${a.seat}" more instances in order "${order.id}"\`)`. Four lines for six, honest on the edge, still dead on every line that exists, and the plan-time refusal at 110-116 keeps catching the common case.

2. **`instances` is checked for presence, not shape.** `scripts/dispatch.mjs:36-45`, `:56`, `:72`. Probed: `{ tara: 0 }` throws `TypeError: Cannot read properties of undefined (reading 'length')` from `draw` (line 72), naming nothing; `{ tara: 1.5 }` silently plans one instance; `{ satto: 2 }` (a typo) is silently ignored and sato gets one. The last is the bad one: the human asked for parallelism and got none, with no message. Fix, two refusals: in `loadOrder`, `for (const [seat, n] of Object.entries(order.instances)) if (!Number.isInteger(n) || n < 1) throw new Error(\`order ${path}: instances.${seat} must be a positive integer, got ${JSON.stringify(n)}\`)`; in `plan` after `nameInstances`, refuse a key no station uses: `order "o": instances names "satto", which line "tdd" has no station for (seats: tara, sato, review-party)`.

3. **`open --no-worktrees` writes a spawn event naming a worktree that was never made.** `scripts/dispatch.mjs:153` builds `worktree: i.worktree` regardless of the `worktrees` flag; line 157 then skips creation. The log, which the spec calls "what every renderer draws from," now names `.summon/worktrees/sato#1` and there is no such directory. Fix: `worktree: worktrees && p.limits.isolation === "worktree" ? i.worktree : null` on 153, which lets the `&& !o["no-worktrees"]` on 246 go. Tara's tests at `dispatch.test.mjs:399-405` and `:548-560` don't assert the field, so this passes as written. See Suggestion 7 for whether the switch should exist at all.

4. **A `return` with `ok: false` releases the station.** `scripts/dispatch.mjs:173` checks `e.event === "return"` and never reads `ok`. Red aborts (`ok: false`, no tests written), green claims. That is the exact hole the order constraint exists to close. Fix: `e.event === "return" && e.ok === true`. If a failed return is meant to release (I can't see why), the doc comment on 165 says so and a test pins it. Lazy means less code, not the flimsier check.

5. **`plan` re-validates what `compose` refuses one line later.** `scripts/dispatch.mjs:49` (`seatsOf`) and `:100-103` re-check that every station's seat is composed by the party; `compose(root, { party })` on line 104 does the same walk at `compose-team.mjs:418-428`, with the same message shape, for every line the party opts into, which line 96-98 has already established includes this one. Two sources of the same refusal drift. Fix: delete 49 and 100-103; the `/nobody/` assertion at `dispatch.test.mjs:336` passes on compose's message. Then the `!a || !b` guard at 81 and `a && b` at 113 guard against a constraint naming a station the line lacks, which `compose-team.mjs:425` refuses; they go too.

## Suggestion

6. **Third copy of `readJson`.** `scripts/dispatch.mjs:25-31` duplicates `team-log.mjs:22-28` and `compose-team.mjs:37-43`. Rule of three is met: export it from `team-log.mjs`, import it here. Same for `instanceOf` (`team-log.mjs:83`), inlined at `dispatch.mjs:171` and `:199`. Once finding 5 removes dispatch's `seatsOf`, `run-checks.mjs:46` holds the only copy, which is fine.

7. **`--no-worktrees` is a second knob for what `isolation` already decides.** `scripts/dispatch.mjs:211`, `:219-222`, `:245-246`. Its only caller is the test suite, which wants spawn events without git worktrees; `isolation: "none"` in the fixture harness gives the same thing (`dispatch.test.mjs:407-415` already does this). Cut the switch and `SWITCHES`, and `parseArgs` matches `review-wave.mjs:133-146` byte for byte. Tara's call, since her red tests named it; flagging for her.

8. **Conditional-spread dance.** `scripts/dispatch.mjs:85`: `{ id, ...(spec ? {spec} : {}), ...(diff ? {diff} : {}), stations }` is `{ ...item, stations }`. The order's item plus an assignment is the plan's item; the schema already says what an item may carry.

9. **Half the line lives in the plan, half is re-read at claim.** `scripts/dispatch.mjs:78` copies each station's `needs`/`emits` into the plan; `:187` reloads the line file at claim time for `constraints`. An edited line between `plan` and `claim` gives constraints that don't match the stations beside them. Carry `constraints: line.constraints ?? []` in the plan (one key on line 121-129) and drop `loadLine` from `claim`. Then "the plan is the assignment" is literally true, and claim reads one file, not two.

10. **The one seam leak for a second adapter (question 4).** `scripts/dispatch.mjs:59`, `:157` compare `isolation` to the string `"worktree"`; any other value silently means no isolation. A `team/harness/foo.json` with `isolation: "container"` plans, opens, and never says the script doesn't know the word; the fix that day lands here, not in `team/harness/`. Refuse an unknown value at plan time, the way `compose-team.mjs:166` refuses a non-boolean `fitted`: `harness "foo": dispatch.isolation "container" is not one of worktree, none`. `concurrency`, `depth`, and `harness.name` are read generically; nothing else in the script knows an adapter's shape.

11. **`returnedStations` leans on a field the schema calls optional and the Log prose doesn't ask for.** `scripts/dispatch.mjs:170` skips a `return` without `item`; `team/events.json:68-77` marks `item` optional on `return`, and the composed Log section (`compose-team.mjs:291`) tells a seat to write "a return (ok true or false)" with no mention of `item`. A self-reported return without it never releases anything, and the refusal then reads "until red has returned" when red did. Outside this file: make `item` required on `return` in `events.json`, or have the Log prose ask for it. Naming the seam, not prescribing which side.

12. **Test: tautological assertion.** `scripts/dispatch.test.mjs:469-470` reads `before` and compares it to a second read taken immediately after; both happen after the `assert.throws`, so it can't fail. Take `before` on line 466 (before the throw) or drop it; line 452's `logOrEmpty` pattern is the one that works.

13. **Test: third hand copy of the fixture team.** `scripts/dispatch.test.mjs:30-79` and `:137-188` duplicate the `persona`/`lens`/`fixture` helpers in `review-wave.test.mjs:51-77`, `run-checks.test.mjs:76`, `compose-team.test.mjs:274`. Rule of three: a `scripts/test-fixture.mjs` exporting `fixtureTeam(edit, opts)` is the rung. Tara's, and not this PR's job to refactor; noting the count.

## Clean

- **Choice (a), returned station derived from the instance's latest claim on the item.** `:166-176`. With `return` carrying no station (schema line 68-77), this is the only option short of a schema change; one pass, one map, ten lines. Simple, not clever. Findings 4 and 11 are its two edges, not its shape.
- **Choice (b), worktrees before spawn events.** `:156-159`. A failed `git worktree add` leaves the log untouched; a rerun skips what exists on disk. Right order, and the comment says why.
- **Choice (c), one round-robin counter per seat across all stations.** `:69-75`. The simple choice, and it is why `sato#1, sato#2, sato#1` falls out for green. The counter is right; the loop beside it (finding 1) is the problem.
- **Choice (d), `--at` defaults to the clock in the CLI only.** `:237`. One line in `main`, library stays clock-free, matches Tara's "no wall-clock reads" key. `review-wave.mjs:106` and `run-checks.mjs:62` default in the library instead; dispatch's way is the better one and the divergence is cheap.
- **Order check** `:191-195`: `slice(0, idx).find(!returned)` names the first owed station. Right size.
- **Distinct check** `:196-201`: one `some` over the log; the pairs-only `find(s => s !== station)` matches `team-log.mjs:111`'s `[a, b]`.
- **Refusals (question 3).** Every one names the offender. 97, 114, 119, 182, 184, 194 give the way out in the message. 107 gives none, correctly; there isn't one. 136's "a spawn nobody can see is not a dispatch" sits next to `review-wave.mjs:103`'s "the wave's result has nowhere to go": same voice. 200 could say "replan" but reads fine.
- **Nothing written on refusal.** `open` validates every event, then worktrees, then appends; `claim` throws before its one append. Holds as the header promises.
- **`addWorktree`** `:143`: all three stdio set, stdin ignored, `cwd: root`. No timeout, same as `run-checks.mjs:25`'s `git()`; local `worktree add` is fine without one.
- **Exports.** `loadOrder`, `plan`, `open`, `claim` each have a test consumer and a CLI consumer. Nothing exported for one caller (question 1, second half).
- **Entry guard, `dispatch:` error prefix, `parseArgs` shape, `logPathOf`:** sibling pattern, no drift beyond finding 7.
- **`limits.depth`** carried and unused: pass-through data for the workflow, not code. Fine.

VIK-COMPLETE: 13 findings, 0 critical
