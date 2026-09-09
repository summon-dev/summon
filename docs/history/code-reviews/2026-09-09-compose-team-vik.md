---
agent-notes: { ctx: "Vik simplicity review of compose-team.mjs and its tests", deps: [scripts/compose-team.mjs, scripts/compose-team.test.mjs, docs/methodology/team-layers.md, scripts/check-canon.mjs], state: active, last: "vik@2026-09-09" }
---

# Code review: `scripts/compose-team.mjs` (simplicity lens)

**Reviewer:** Vik
**Date:** 2026-09-09
**Branch:** `claude/summon-team-v3-decomposed-jyiur2` (uncommitted; reviewed the files, not a diff)
**Files:** `scripts/compose-team.mjs`, `scripts/compose-team.test.mjs`, `team/**` (shape only), spec `docs/methodology/team-layers.md`, precedent `scripts/check-canon.mjs`

**What I ran:**
- `node --test scripts/compose-team.test.mjs` — 22/22 pass, 347 ms.
- `node scripts/compose-team.mjs --party summon-core --out /tmp/vik-out` — 9 files, exit 0. Read `vik.md`, `review-party.md`, `roster.md`, `enforcement.md`.
- `--harness skills` — 10 files, 0 tool / 11 prose, as the spec says.
- Three failure probes: malformed `role.json`, unknown `--view`, `--out` with no value. Two of the three fail badly (findings 2, 3, 12).

Short version: this is the right size. 330 lines, zero dependencies, one regex frontmatter parser that does exactly one job, and the entry-point guard copied from the precedent. I have watched this kind of composer grow a plugin system by its third week; this one has not, and it should be held there. What I found is mostly about what fails *silently* rather than loudly, which is the thing that matters at 2am.

## The sidecar question (`role.json` beside `SKILL.md`)

It holds. Walk the ladder: the alternative is `may`/`must-not`/`lenses` as YAML lists in `SKILL.md` frontmatter, which means either a YAML dependency (rung 4 fails: none is installed, and the dependency is forever) or a hand-rolled list parser (rung 6, and every hand-rolled YAML parser I have seen eventually accepts something YAML does not). `JSON.parse` is rung 2. The 10-line flat parser at `compose-team.mjs:33-42` stays 10 lines because of this choice. The boundaries are machine data consumed by an adapter; the prose in `SKILL.md` is for a model. Different readers, different files. The Agent Skills spec keeps its frontmatter to `name`/`description` plus a scalar `metadata` map, so nesting there would be off-spec anyway.

One caveat, not a reason to reverse it: `## Boundaries` prose in `SKILL.md` and `must-not` in `role.json` say the same thing twice and nothing checks them against each other. That is the class of drift `check-canon.mjs` exists for. A future check, not a merge of the files.

## Critical

None. Nothing here corrupts data, leaks the view into a prompt, or writes outside `--out` for the checked-in tree.

## Important

### 1. A missing or misspelled section is dropped silently, exit 0
`scripts/compose-team.mjs:179` (`section()` returns `""` on falsy), `:185-188`, `:195-202`. The loader validates exactly one section, Dissent (`:88`). Rename `## Charter` to `## Chartr` in any role and the composer emits an agent with no charter and reports success. Same for a persona with no Voice or Priors. The spec names the sections as load-bearing (`team-layers.md:15-22`, `:44-49`); the script treats them as optional. One loop over `["Charter", "Standard", "Questions", "Output"]` and `["Priors", "Dissent", "Voice", "Tells"]` at load time, throwing with the file name, closes this. The refusal style is already established for everything else; this is the gap.

### 2. Malformed JSON errors do not name the file
`scripts/compose-team.mjs:26` (`readJson`), and the claim at `:111` ("Validation errors name the file and the rule") is false for this path. Probe: a `role.json` containing `{` yields `compose-team: Expected property name or '}' in JSON at position 2 (line 2 column 1)`. Five JSON layers, one message, no path. Wrap `JSON.parse` in `readJson` and prefix `p`. Two lines.

### 3. An unknown view falls back to nothing instead of refusing
`scripts/compose-team.mjs:247` — `team.views[viewName ?? party.view] ?? null`. Probe with `--view nope`: roster renders with `skin \`none\`` and empty Class/Epithet/Blurb columns, exit 0. Every other unresolved binding in this file throws with a named reason (`:143`, `:145`, `:244`, `:246`). This one does not. Pick a side: a party that names a view gets an error when it does not exist, and `null` only when the party omits `view` entirely.

### 4. The spec's formation example does not compose
`docs/methodology/team-layers.md:76` shows `"members": ["vik", "tara", "pierrot", "archie"]`. The script (`compose-team.mjs:252-253`) and the real party (`team/parties/summon-core.json`) use `{ "persona", "lens" }` objects. A user who copies the spec gets `persona "undefined" has no file under team/personas/`, which names nothing they typed. The string form cannot work as-is (Tara's primary is tester, not reviewer/test-quality), so fix the spec, and consider a one-line guard that says "formation members must be objects" when `typeof m === "string"`.

### 5. Subprocess spawns in the tests: PATH `node`, no timeout, stdio partly implicit
`scripts/compose-team.test.mjs:479` and `:492`.
- `execFileSync("node", ...)` resolves through PATH. The test runner is already a Node binary; `process.execPath` is the same one, guaranteed. The health check should exercise the same binary as the suite.
- No `timeout`. A hung child hangs `node --test` forever; CI does not distinguish "hung" from "slow".
- `:479` passes no `stdio`, so stdin is a pipe the child never reads and stderr streams into the runner's output. `:492` sets `stdio: "pipe"` but still leaves stdin as a pipe.
One options object, used by both: `{ cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10_000 }`.

## Suggestions

### 6. Dead return field
`scripts/compose-team.mjs:293` — `roster: files.find(...)?.content ?? null`. No caller reads it; the tests use `fileNamed(out, "roster.md")` (`compose-team.test.mjs:318`) and `main()` ignores it. It also re-scans an array for a value pushed three lines earlier. Cut it.

### 7. Unused parameter
`scripts/compose-team.mjs:141` — `resolveMember(team, party, m, where)`. `party` is never read. Both callers (`:249`, `:253`) pass it. Drop it.

### 8. `persona.role` is a second name for `holds[0].role`
`scripts/compose-team.mjs:99`, used only at `:150`. When a persona holds several seats the message "is bound to role X" names one seat, then prints all of them in parentheses. The parenthetical is the truth; the prefix can mislead. Drop `role` from the persona object and let the message read "holds: tester, reviewer/security".

### 9. The one 2am line
`scripts/compose-team.mjs:91` — a nested ternary inside a template literal inside an array literal, feeding a three-stage chain. It is correct. It is also the only line in the file I had to read three times. Four plain lines: `const raw = data.holds ?? (data.lens ? \`${data.role}/${data.lens}\` : data.role ?? "")`, then split/map.

### 10. `lenses` in `role.json` duplicates the `lenses/` directory, and the two `lenses` names collide
`scripts/compose-team.mjs:77-82`. `role.meta.lenses` is a list of names; `role.lenses` is a map of name to text. `Object.keys(role.lenses)` already equals `role.meta.lenses`. Either derive the list from `readdirSync(join(dir, "lenses"))` and delete the JSON key (fewer places to edit when a lens is added), or keep the declaration for its missing-file check (`:79`) and rename the text map to `lensText`. Pick a side; do not carry both names.

### 11. Path computed twice, and a reference-equality `uniq`
`scripts/compose-team.mjs:267` and `:269` call `outPath({ role, name })` with identical arguments; hoist it. `:265` dedupes role *objects* by reference, which works only because `loadTeam` holds one object per role. True today; not obvious. Dedupe by `role.name` or say so in a half-line comment.

### 12. `--out` with no value
`scripts/compose-team.mjs:302` — `argv[++i]` walks off the end and stores `undefined`. Probe: `--party summon-core --out` fails with `The "path" argument must be of type string. Received undefined`, which is Node talking, not the script. `parseArgs` should refuse a flag with no value by name.

### 13. `\n`-only frontmatter and section splitting
`scripts/compose-team.mjs:34` and `:47`. A CRLF checkout (Windows, `autocrlf`) parses no frontmatter and finds no sections, and per finding 1 that is silent. `check-canon.mjs` makes the same assumption, so this is consistent with precedent; if one is ever fixed, fix both. No action now.

### 14. Test fixtures leak tmpdirs
`scripts/compose-team.test.mjs:221` — `mkdtempSync` per test, ~22 directories per run, never removed. Collect the roots and `rmSync` them in an `after()` hook. Also `:239` (`if (content === null) continue`) has no user; no test sets a file to `null`. Cut it or use it.

### 15. Smoke test pins prose, not structure
`scripts/compose-team.test.mjs:460-461` — `/laziness ladder/i` and `/pick a side/i` are sentences in `team/roles/reviewer/lenses/simplicity.md` and `team/personas/vik.md`. Editing my own Tells breaks the composer's test suite for a reason that has nothing to do with the composer. `/Grey Warden/` at `:462` is fine (that is view content and must be absent). For presence, pin `## Lens: Simplicity` and `## Tells`.

### 16. The composed header is inside the model's context, and `check-canon` will reject these files
`scripts/compose-team.mjs:177` — `HEADER` lands in the body, so every agent pays ~25 tokens for a note addressed to humans. The spec's own rule (`team-layers.md:55`) is that prompt bytes are for the work. Small. The larger point: `check-canon.mjs:41-53` (check #1) fails any `.claude/agents/*.md` without an agent-notes block, and check #2 (`:57-68`) requires each agent file to be listed in `personas.md`. The day `build/team/.claude/agents` is copied over `.claude/agents`, both checks go red. Not this change's defect, but it is the next change's, and a `summon:` marker here is where that ceiling belongs.

### 17. Spec knows four role sections; the script knows five
`scripts/compose-team.mjs:19-20` — `ROLE_ORDER_TAIL` includes `Boundaries`. `team-layers.md:17-22` lists Charter, Standard, Questions, Output. Four of five checked-in roles have `## Boundaries`; the reviewer (`team/roles/reviewer/SKILL.md`) does not, so on the `skills` adapter its three `must-not`s are "prose only" with no prose carrying them. Data and spec, not script, but the script is where the disagreement is visible. Agree on whether Boundaries is a section.

### 18. A formation with no members and a bad role dies with a TypeError
`scripts/compose-team.mjs:256` — `team.roles[f.role]` is never checked; `resolveMember` would catch it, but only if `f.members` is non-empty. Empty members plus a typo in `role` reaches `:283` as `Cannot read properties of undefined (reading 'meta')`. One guard, same message style as `:143`.

## Clean

- **Proportionality.** Five layers, one script, 330 lines, no config file for the config file. Right-sized. No plugin registry, no template engine, no `class Composer`.
- **Dependencies.** Zero. `JSON.parse`, `readdirSync`, a regex. Rung 2 all the way down.
- **Entry-point guard.** `compose-team.mjs:323` matches `check-canon.mjs:358` exactly, including the `process.argv[1]` guard. Tests import without triggering the CLI.
- **Enforcement logic.** `compose-team.mjs:159-165` is correct. Verified against the real tree: Tara `write:src` is prose (shares Write/Edit with `write:tests`); Wei `run` is tool (Bash withheld); reviewer formation inherits the role's tools. The comment at `:158` says what the code does in one sentence.
- **View isolation.** `vik.md` from the real tree carries no class, sprite, accent, or blurb. The test at `compose-team.test.mjs:304-314` pins it with markers, not prose. This is the test that matters and it is the right shape.
- **Frontmatter emission.** `description` goes through `JSON.stringify` (`:168`), so the embedded quotes in the reviewer description survive. `tools`/`disallowedTools` omitted when empty rather than emitted blank.
- **Performance.** Synchronous fs in a one-shot CLI over ~25 files. Nothing to say.
- **Concurrency.** None. Nothing shared, nothing mutated after load.
- **`parseArgs`.** 10 lines, no argument-parsing library. Correct rung.

VIK-COMPLETE: 18 findings, 0 critical
