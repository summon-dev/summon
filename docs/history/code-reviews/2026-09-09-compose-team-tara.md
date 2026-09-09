---
agent-notes: { ctx: "Tara test-quality review of compose-team.test.mjs", deps: [scripts/compose-team.test.mjs, scripts/compose-team.mjs, docs/methodology/team-layers.md], state: active, last: "tara@2026-09-09", key: ["20 mutants run against the suite; 17 survived", "two false greens: two-seat path collision, undeclared-lens refusal never reached", "no veto; Criticals block under the normal gate"] }
---

# Test-quality review: `scripts/compose-team.test.mjs`

**Reviewer:** Tara (test-quality lens)
**Under review:** `/home/user/summon/scripts/compose-team.test.mjs` (22 cases, `node --test`) against `/home/user/summon/scripts/compose-team.mjs` and the spec `/home/user/summon/docs/methodology/team-layers.md`.
**Baseline:** `node --test scripts/compose-team.test.mjs` → 22 pass, 0 fail, 339 ms.

## Method

I did not take the suite's word for what it pins. I copied script and test into a scratch directory and ran twenty single-point mutants of the composer against the unchanged suite (scratch harness at `/tmp/claude-0/.../scratchpad/mut/run.sh`; nothing in the repo was touched). A mutant that keeps all 22 green is a wrong implementation these tests would not catch. **Seventeen of twenty survived.** Three were killed: heading-only Dissent check (M8), dropping the Tells section (M13, killed only by the real-tree smoke test), and ignoring the view's member entry in the roster (M19). The survivors are the findings below.

## The coordinator's question 1: load-bearing claims, the test that pins each, and a wrong implementation that still passes

| Claim in team-layers.md | Pinning test | Wrong implementation that stays green | Mutant |
|---|---|---|---|
| View content never enters an agent file (line 55) | `no view content reaches any agent file...` | Writes the view's `title`, `skin`, or a member's `epithet` into the prompt. The leak list checks class, blurb, accent, sprite only; the fixture view has no `epithet` key at all, so that field cannot leak in the test even though `renderRoster` reads it. | M5 survived |
| enforcement.md says tool vs prose per must-not (line 81) | `enforcement: a must-not whose tools are all withheld...` | Reports **tool** when *any* mapped tool is withheld rather than *every* one. The fixture has no boundary whose tools are partly shared, so `some` and `every` give identical rows. Also: a boundary the adapter maps to nothing has no pinned level. | M1, M12 survived |
| Skills adapter emits roles alone, no personas (line 81) | `skills harness emits one SKILL.md per role used by the party, verbatim...` | Emits every role under `team/roles/`, not only the party's; or also emits `roster.md` (view content) on the roles-only target. The fixture uses every role it defines, so "used by the party" is not actually tested. The persona-marker scan is good and does hold. | M10, M7 survived |
| Capabilities are never tool names (line 34) | `refuses a role file that names a harness capability by tool name...` | Validates `may` and skips `must-not`. Only `may` is exercised. | M4 survived |
| Empty Dissent is refused (line 51) | `refuses a persona whose Dissent section is empty` | Passes the heading-only mutant (good) but nothing covers a Dissent that is *absent* (no heading) or that contains only an HTML comment. An implementation that stopped stripping comments would accept a comment-only Dissent as non-empty. | M8 killed; M2 survived |

Two further claims the suite thinks it pins but does not, because the test passes through a different code path. See Critical 1 and 2.

## The coordinator's question 2: red-phase pre-flight

- **Time.** No `Date`, `now`, or clock read in the test file or the composer. `mkdtempSync` is the only environment dependency. Skip explicitly: does not apply.
- **Direction.** The enforcement expectations (tester `write:src` → prose, reviewer `write:src` → tool) are derived in words in the test comment from the shared-tool argument, not read off the implementation. Sound. Two places where the direction was *not* derivable from the spec: (a) the level for an unmapped boundary (spec silent; implementation says prose; no test either way, Important 2), and (b) the body section order in the `...in that order` test. team-layers.md does not state an order, and lists the role as having *four* sections (Charter, Standard, Questions, Output) while the implementation and four of five real role files carry a fifth, Boundaries. The order test is therefore pinning a decision that lives only in the implementation, which is the mirror pattern (Important 9).
- **Path.** Unit tests import `compose`/`loadTeam` from the same module `main()` calls; CLI tests spawn the real script with `cwd` set to the fixture root, matching `process.cwd()` in `main()`. Good. Gaps: `pnpm team:skills` runs `--harness skills` *through the CLI* and no test exercises `--harness` or `--view` on the CLI (Suggestion 1). And one refusal test reaches the wrong branch entirely (Critical 2).

## The coordinator's question 3: vacuity

- `no view content reaches any agent file` guards with `agents.length > 0`. Not vacuous.
- `frontmatterOf` returns `""` on no frontmatter and every `assert.match` on it then fails. Not vacuous.
- The `enforcement.md` regexes `/tara[^\n]*write:src[^\n]*prose/` are single-line and the only line containing `tara` and `write:src` is the row. Not vacuous. (I also confirmed the header line cannot match: it contains no member name.)
- `fileNamed(out, "x.md")` returns `undefined` when absent and the test dies with a TypeError on `.content`. It fails, but for the wrong reason and with no message (Suggestion 8).
- **Vacuous by construction:** `refuses a lens the role does not declare` (Critical 2). The regex `/lens "vibes"/` matches the *holds* refusal message, so the lens-declaration branch is never executed. Disabling that branch keeps the test green.
- **Vacuous by fixture:** `a persona that holds two seats...` asserts `length === 2` on a result whose two agent paths are identical (Critical 1).

## The coordinator's question 4: existence-only assertions

- CLI test: `existsSync` on `roster.md` and `enforcement.md` with no content check; `stdout` matched against `/prose/` when the CLI prints a counted summary line that the test could pin exactly (Suggestion 2).
- `skills harness includes a role's lenses`: path presence only; the lens content is never compared (Suggestion 3).
- `loadTeam reads every layer`: `>= 5`, `>= 6`, truthiness on `views["jrpg-16bit"]`. Acceptable as a smoke test but drift-prone (Suggestion 9).

## Findings by severity

### Critical

**C1. Two-seat persona produces two agent files at the same path, and the test certifies it.**
`a persona that holds two seats can be bound to either, and to nothing else` binds `tara` as tester and as reviewer/security in one party, then asserts `agents.length === 2`. Both entries have `path: ".claude/agents/tara.md"` (verified: `compose()` returns the duplicate; `main()` would write the file twice and the tester agent is silently lost, last write wins). The enforcement rows are also keyed `tara` twice with different roles, so the report is ambiguous. team-layers.md line 42 names exactly this case (Tara holds tester and the test-quality lens) as the reason `holds` exists. The test passes on a result the CLI cannot write correctly.
*Test to write:* `two seats held by one persona compose to two distinct output paths`
```
const paths = agents.map(f => f.path);
assert.deepEqual(paths, uniq(paths)); assert.equal(paths.length, 2);
```
Whether the fix is a per-seat filename (`tara-reviewer.md`) or a refusal is Sato's and Archie's call; either way the test must assert uniqueness of `path`, not the count.

**C2. `refuses a lens the role does not declare` never reaches the lens-declaration check.**
Vik's persona is bound to `reviewer/simplicity`; the party assigns `reviewer` on `vibes`. `resolveMember` throws from the *holds* check first, with a message that happens to contain `lens "vibes"`. Mutant M16 (delete the `role.meta.lenses.includes(lens)` branch) keeps all 22 green. The declared-lens refusal is untested.
*Test to write:* `refuses a lens the role does not declare, even for a persona that holds the role on any lens`
```
files["team/personas/vik.md"] = PERSONA_VIK.replace("lens: simplicity\n", "");   // holds: reviewer (any lens)
assert.throws(() => compose(root, {party}), /lens "vibes" is not declared by role "reviewer"/);
```

### Important

**I1. `every` vs `some` in the enforcement rule is indistinguishable with this fixture (M1).** No boundary maps to a tool set that the role *partly* needs.
*Test:* `enforcement: a boundary is prose when the role needs any one of its tools`
```
harness.capabilities["write:src"] = ["Write","Edit","NotebookEdit"]; harness.capabilities.notebook = ["NotebookEdit"];
reviewer role.json may += "notebook"  →  find("vik","write:src").level === "prose"
```

**I2. The level of a boundary the adapter maps to nothing is unspecified and unpinned (M12).** Spec is silent; implementation says prose; flipping it to tool survives. This is the one enforcement direction I could not derive from team-layers.md. Decide (I lean prose: the report must not claim a tool wall that does not exist), write it into the spec sentence at line 81, then pin it.
*Test:* `enforcement: a must-not with no tool mapping on this adapter is reported as prose`
```
tester role.json "must-not": ["write:src","notebook"]; adapter has no notebook key
assert.equal(find("tara","notebook").level, "prose");
```

**I3. Standard, Questions, Output, and Tells are never asserted in the fixture (M3, M14 survive; M13 dies only in the real-tree test).** The spec's two section tables (lines 17-22, 44-49) name eight sections; the fixture markers cover four. Dropping half the role from every prompt keeps the suite green.
*Test:* extend `body carries voice, charter, ...` with `FIXTURE-TESTER-STANDARD`, `FIXTURE-TESTER-QUESTIONS`, `FIXTURE-TESTER-OUTPUT`, `FIXTURE-TARA-TELLS` markers in the fixture and an `includes` loop over all eight.

**I4. HTML comments are not asserted stripped (M2, M20).** Every real persona and four role/lens files carry an `agent-notes` comment. If `stripComments` regresses, agent-notes ship into every composed prompt and no test notices. That is precisely the "byte the model pays for" the spec's view sentence is about.
*Test:* `agent-notes comments in any layer are stripped from the composed agent`
```
prepend "<!-- FIXTURE-COMMENT-ROLE -->\n" / -LENS / -PERSONA to the three fixture texts
for every agent file: assert.doesNotMatch(content, /FIXTURE-COMMENT-/);
```

**I5. View leak list omits `title`, `skin`, and `epithet` (M5).** The fixture view has no `epithet` key although `renderRoster` reads one, so the field is untestable as written.
*Test:* add `epithet: "FIXTURE-VIEW-EPITHET-TARA"` to the fixture view; add `"Fixture Party"`, `"test-skin"`, `"FIXTURE-VIEW-EPITHET"` to `leaks`.

**I6. Tool-name validation is only exercised on `may` (M4).**
*Test:* `refuses a tool name in must-not as well as in may`
```
role.json { may: ["read"], "must-not": ["Write"] }
assert.throws(..., /capability "Write" in must-not/);
```

**I7. A formation whose member does not hold the seat is unrefused (M17).** The coordinator asked for this one specifically; it is absent.
*Test:* `refuses a formation member whose persona does not hold the formation's role on that lens`
```
formations: [{ name:"review-party", role:"reviewer", members:[{ persona:"tara", lens:"simplicity" }] }]
assert.throws(..., /formation "review-party".*persona "tara".*bound to role "tester"/);
```

**I8. Frontmatter `description` is never asserted (M11).** Claude Code selects subagents by description; an agent without one composes fine and is never invoked.
*Test:* in the frontmatter test, `assert.match(fm, /^description: "Vik: Reads a change and reports what is wrong with it\. Holds the simplicity lens\."$/m)`.

**I9. The section-order test promises seven sections and checks five; Boundaries/Output can move anywhere (M6).** The name says "voice, charter, lens, priors, dissent, boundaries, output, in that order"; the array stops at dissent. And the order itself is not in the spec, whose role table also omits Boundaries. Either add the order and the Boundaries section to team-layers.md (then the test pins the spec) or rename the test to the claim it actually makes.
*Test:* extend the `order` array with `FIXTURE-TESTER-BOUNDARY`-style markers for the reviewer role and the Output section, and file a one-line spec edit with Archie.

### Suggestions

**S1. CLI flags untested:** `--harness`, `--view`, unknown argument, missing `--party`, default `--out`. `pnpm team:skills` is a production entry point that goes through `--harness skills` on the CLI and nothing exercises it.
*Tests:* `CLI --harness skills writes .agents/skills and no .claude/agents`; `CLI rejects an unknown argument with exit 1 and names it` (`/unknown argument --nope/`); `CLI without --party exits 1`.

**S2. CLI success test is existence-only for `roster.md` and `enforcement.md`, and `stdout` is matched on `/prose/`.** The fixture yields 10 rows, 9 tool, 1 prose.
*Test:* `assert.match(stdout, /enforcement: 9 boundaries at the tool layer, 1 by prose only/)`; `assert.match(readFileSync(roster), /FIXTURE-VIEW-CLASS-WARDEN/)`.

**S3. Skills target: lens files are path-only, `roster.md` absence is not asserted (M7), and "roles used by the party" is untested because the fixture uses every role (M10).**
*Test:* add an unused third role `scribe/` to the fixture; assert `.agents/skills/scribe/SKILL.md` is absent, `roster.md` is absent, and `assert.equal(lensFile.content, LENS_SIMPLICITY + "\n")`.

**S4. A party naming a view that does not exist composes silently with an empty roster.** Every other unresolved binding (role, persona, harness, lens) is refused; the view is the exception and the spec is silent. Pin one behaviour.
*Test:* `refuses (or: warns and composes) a party whose view has no party.json`, `party.view = "nope"`.

**S5. `parseFrontmatter` quoting is untested (M9), as are `holds` without `role` and a persona with neither.**
*Tests:* `frontmatter values may be quoted` (`display: "Vik"` → `name: vik`, roster shows `Vik` not `"Vik"`); `refuses a persona with no role and no holds` (`/frontmatter must name a role/`).

**S6. Loader refusals untested:** missing `role.json`, missing `SKILL.md`, role directory absent for a party member, declared lens file missing, adapter without `output`, unknown party, `--harness` override with no adapter.
*Test:* one table-driven `refusals name the file and the rule` with `[edit, /pattern/]` pairs, each a fixture mutation via `files[...] = null`.

**S7. Formation frontmatter `tools:` is not asserted (M15); a formation with zero members composes as "a formation of 0 lenses".**
*Tests:* `assert.match(fm, /^tools: Read, Grep, Glob, Bash$/m)` in the formation test; `refuses a formation with no members`.

**S8. `fileNamed(out, x).content` on a missing file throws a TypeError with no message.** Make the helper assert: `const f = ...; assert.ok(f, \`no file ending ${suffix}\`); return f;`.

**S9. `loadTeam` smoke uses `>= 5` / `>= 6`.** Fine as a smoke, but a dropped role goes unnoticed. Assert the sorted role and persona name lists from `team/parties/summon-core.json` instead, so the test and the party drift together.

### Clean

- Time pre-flight: no clock reads anywhere; explicitly skipped.
- `skills harness emits one SKILL.md per role...`: `assert.equal(tester, ROLE_TESTER)` is the strongest assertion in the suite, and the persona-marker scan covers every emitted file including `enforcement.md`.
- `refuses a persona whose Dissent section is empty` kills the heading-only mutant; the regex edit is verified to produce a genuinely empty section.
- View-isolation test guards its loop against an empty agent list and uses fixture-unique markers, so a rename in the real view cannot silently disarm it.
- Real-tree markers (`Grey Warden`, `laziness ladder`, `pick a side`) all exist in the checked-in layer files; those assertions are grounded.
- CLI failure test checks exit status and stderr through the real script with `cwd` at the fixture root; same path production takes.
- Enforcement expectations are stated in words before being encoded, and the fixture's tool sharing was chosen to make the tester-prose/reviewer-tool split real.

## Veto

**Not exercising the coverage veto.** The five load-bearing spec claims each have a non-vacuous pinning test; the current `summon-core` party has no two-seat member and declares every lens it uses, so C1 and C2 do not fire on the checked-in tree. C1 and C2 are nonetheless Critical under the normal review gate and must be fixed before merge: each is a test that goes green on a wrong result, which is the failure class this review exists to catch. I1 through I9 should land in the same change; the mutation harness above will tell you when they do.

TARA-COMPLETE: 20 findings, 2 critical
