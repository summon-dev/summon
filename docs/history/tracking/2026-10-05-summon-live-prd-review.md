---
agent-notes: { ctx: "persona review of the Summon Live PRD draft", deps: [docs/history/design/summon-live-prd.md], state: active, last: "claude@2026-10-05", key: ["five standalone reviewers: Wei, Pierrot, Pat, Archie, Dani; 46 findings, 12 blocking", "reviewers returned messages; the coordinator wrote this record and revised the PRD", "every finding has a disposition; the reviews are reproduced verbatim at the end"] }
---

# Review: the Summon Live PRD draft

**Date:** 2026-10-05
**Subject:** `docs/history/design/summon-live-prd.md`, first draft (commit `9429059`), revised in the commit that adds this record
**Reviewers:** Wei (challenger), Pierrot (security), Pat (product), Archie (architecture), Dani (design and accessibility), each spawned as a standalone agent with instructions not to write files
**Method:** Each reviewer read the draft, the v3 branch files it cites, and herdr's v0.9.3 documentation source, and returned numbered findings graded blocking, amend, or note, with a closing completion sentinel. The coordinator checked each sentinel's count against the findings present, verified the factual claims that the revision depends on, wrote this record, and revised the PRD. The reviews are reproduced verbatim at the end, with each sentinel restated as a plain line so this file carries no sentinel of its own.

## What changed

The review moved the PRD more than any single section edit would suggest. Pat found that it never said when its own work would be enough, so the PRD now opens with **G0**, the conditions under which the deprecation notice can come down. Wei and Archie independently showed that "witnessed" overclaimed and would not even catch #129, so the wire now separates testimony from out-of-band events and computes *corroboration* per seat, item, and lens, with a principle stating that none of it is proof. Wei and Pierrot independently showed that the herdr host handed every seat a keyboard to every other pane, so herdr now arrives in two steps: pane labels that give seats nothing (Phase 1), and a host that waits behind a need gate and OS-level containment (Phase 3). Pat, Wei, and Dani converged on the world: *Echo* now needs overlapping findings as well as unanimous verdicts and stops the order until a human acknowledges it, every renderer races the existing table renderer instead of raw JSONL, the replay and battle come before the hall, and every status leads with plain words. Pat's and Wei's objections to the multi-model pages made one model with effort per station the shipped default, with everything else waiting on H1.

## Sentinel check

| Reviewer | Sentinel as returned | Findings present | Matches | Note |
|---|---|---|---|---|
| Wei | 6 findings (2 blocking, 4 amend, 0 note) | 6 | yes | |
| Pierrot | 8 findings (3 blocking, 4 amend, 1 note) | 8 | yes | Hit the v2 `maxTurns: 20` cap before reporting; resumed once with an instruction to report from what it had read |
| Pat | 12 findings (2 blocking, 8 amend, 2 note) | 12 | yes | |
| Archie | 10 findings (3 blocking, 6 amend, 1 note) | 10 | yes | Hit the v2 `maxTurns: 25` cap before reporting; resumed the same way |
| Dani | 10 findings (2 blocking, 7 amend, 1 note) | 10 | yes | |

Two of five reviewers hitting a hard-coded turn cap mid-task is the deprecation notice's `maxTurns` complaint, observed live; the PRD's "Why now" table records it.

## Claims the coordinator verified before acting

- **v3 code (Archie 1, 2, 4):** `review-wave.workflow.mjs` spawns lens agents with no `agentType` and hard-codes the skeptics' `effort: 'medium'`; `dispatch.mjs open` runs `git worktree add --detach` for every instance at one head; `plan` reads its limits from the party's harness adapter. All confirmed on `claude/summon-team-v3-decomposed-jyiur2`.
- **ADR-0012 E (Archie 3):** no capability registry exists on `main` or the v3 branch; `doctor.ts` holds ADR-0004's health registry, which is a different thing.
- **Claude Code (Pierrot 1, 2, 3):** async hooks have no enforced timeout; plain stdout from `SessionStart` and `PostModelSwitch` becomes model context; `--settings '{"disableAllHooks": true}'` outranks project and local settings; `ConfigChange` can block; the sandbox covers shell commands only, while hooks, file tools, and MCP servers run outside it; Unix-socket blocking on Linux needs the optional seccomp filter; `sandbox.credentials` entries from project and local settings are ignored. Whether an async hook's `additionalContext` reaches the model on a later turn is not documented either way, so W-3 forbids the output outright.
- **herdr (Pierrot 3, Wei 1):** v0.9.3 exports `HERDR_SOCKET_PATH` and `HERDR_BIN_PATH` into launched processes and keeps its own values on conflict; the socket is created `0600` with no protocol-level authentication; `agent send-keys` answers a blocked dialog.
- **Contrast (Dani 7):** recomputed for every accent against `#0f172a`; the six failing values and the formation's 2.84 match Dani's figures exactly.
- **`check:css` (Dani 1):** advisory (exit 0 unless `--strict`) and limited to statically resolvable CSS colours, per its own header and ADR-0013 § 6.

## Dispositions

Sustained means the PRD now does what the finding asked, or something stronger. Partly sustained says what was kept and why.

### Wei

| # | Grade | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | blocking | herdr doesn't earn its seat; H-4's fixture tests a polite attacker | Partly sustained. The host moves to Phase 3 behind a need gate and OS-level containment (H-3), with a raw-socket test; herdr-aware labels stay in Phase 1 because they give seats nothing. A separate PRD is declined because the human asked how Summon fits into herdr. | Part 3; Alternatives |
| 2 | blocking | "Witnessed" overclaims | Sustained. Testimony, out-of-band, and corroborated replace "witnessed"; corroboration is keyed per instance, item, and lens; `ingest` is testimony; herdr pane state is excluded; Wei's "pane skips the wave" case is a W-4 fixture; the tamper clause is now a principle. | Part 1; Principles; Terms |
| 3 | amend | Auditions gate on noise | Sustained. Auditions block and never promote; the replay set is seeded with defects the incumbent missed; replay n is pre-registered; the rule-of-three limit is stated; the claim about reusing ADR-0005's discipline is removed. | Part 2 |
| 4 | amend | The default contradicts the casting pages | Sustained. One model with effort per station is what ships; the sample casting and the scenario use it; model escalation, mixed lenses, and cross-vendor seats wait for H1. | Part 2; scenario |
| 5 | amend | The world sells a badge, not an alarm | Sustained. *Echo* needs overlap as well as unanimity; D-4 fails closed until a human `ack`; timed tasks race `team-log.mjs render`; usage counts local `serve` launches. | Parts 4 and 5 |
| 6 | amend | Personas are assumed model-proof | Sustained. G4 is now "identity changes only on purpose"; a persona edit for model fit is its own reviewed change and never blocks retiring a model; probes use format-neutral prompts and compare with and without the persona. | Goals; Part 2 |

### Pierrot

| # | Grade | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | blocking | "Async and silent" is not built into the design | Sustained. The hook contract: output to `/dev/null`, its own two-second timer, no JSON, `O_NOFOLLOW`, regular files only, and a fixture proving nothing reaches the model. | Part 1, W-3 |
| 2 | blocking | The hook runs code seats and contributors can edit | Sustained. The wire runs pinned outside every worktree (plugin or `--settings`); `ConfigChange` guard, no `bypassPermissions`, the `check --line` diff rule, and the CI `disableAllHooks` line for scaffolded projects. The loss of tracked-file visibility is recorded and answered by the manifest hash. | Part 1, W-7, W-9; Security |
| 3 | blocking | H-4 can't honestly pass its own P0 fixture | Sustained. Containment preconditions are now H-3 (P0), the string-matching hook is a tripwire only, cross-vendor seats need an equivalent sandbox, and the risk is re-graded High without containment. | Part 3; Risks |
| 4 | amend | Seat testimony is attacker-controlled text | Sustained. The renderer rules and V-8, with a `</script>` and OSC 52 fixture. | Part 4 |
| 5 | amend | Leaks | Sustained. Redaction at append for every writer, the assignment-skipping command allowlist, relative paths, allowlisted exports, and a W-8 that never stores tool arguments. | Part 1, W-6, W-8; V-5 |
| 6 | amend | Local server | Sustained. Cookie swap, `Referrer-Policy: no-referrer`, and the OTLP receiver's header token, content type, and size cap. | V-2; Security |
| 7 | amend | Plugin supply chain | Moot for now, because the plugin is cut (with Pat 10). The conditions are kept for any return; ADR-0010's cooldown now applies to herdr itself; renderers never trust herdr tokens for identity. | Part 3 |
| 8 | note | herdr's detection rules update remotely | Adopted. Every `host` event records the rule-set version. | Part 3 |

### Pat

| # | Grade | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | blocking | No goal says when the notice comes down; G3 unmeasured | Sustained. G0 with Pat's four conditions; G3 measured by identical spawn sequences. | Summary; Goals |
| 2 | blocking | Part 5 unscheduled; *Echo* will cry wolf | Sustained. D-1 to D-4 with priority and phase; D-1 is P0 in Phase 1; *Echo* requires overlapping findings. | Parts 4 and 5 |
| 3 | amend | Phase 0 is invisible | Sustained. The read-only party bar and the *Uncorroborated verdict* status ship in Phase 0; #123 and #109 are prerequisites. | Phasing |
| 4 | amend | Made-up targets | Sustained. A Phase 0 baseline run sets the targets; the 40 percent and two-day figures are withdrawn; corroboration is measured per host. | Success measures |
| 5 | amend | Renderer order is upside down | Sustained. Replay and battle in Phase 2; hall and server in Phase 4; races against the table renderer; usage from `serve` launches. | Part 4; Phasing |
| 6 | amend | Priorities | Sustained. C-4 and C-8 are P0; C-2 tests two hosts; C-5 tests the ledger only. | Part 2 |
| 7 | amend | Untestable acceptance | Sustained. W-3 tests the hook contract; *Unaudited model* has one definition in C-3; C-4 states its block rule. | Parts 1 and 2 |
| 8 | amend | "All fifteen" untestable; tic without substance | Sustained. The target is every seat an audition exercises; tells are declared a floor, with D-1 and presence catching substance; the badge reads "Voice drift (judged)". | Part 2; Part 4 |
| 9 | amend | "Why now" overclaims | Sustained. Causes 1 and 3 are marked open outside work orders; C-7 is P1; the Architecture Gate becomes a line (C-12). | Why now; Part 2 |
| 10 | amend | Say no to sound, Line, H-6, H-7, sprite sheets | Mostly sustained. Sound and the plugin are cut, Line folds into the quest board, and sprite work waits for the quest board's gate. Cross-vendor seats are kept as a later, separate decision after H1 arm A instead of being deleted, because the human asked about herdr's multi-vendor world. | N7; Parts 3 and 4 |
| 11 | note | The scenario sells an unproven casting | Adopted. The scenario runs on the default. | Scenario |
| 12 | note | Keep these; ship no default casting; keep promotion human | Adopted as recommendations in open questions 2 and 3; the human decides. | Open questions |

### Archie

| # | Grade | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | blocking | The witness rule doesn't catch #129 | Sustained. Corroboration per turn keyed on instance, item, and lens or station; `ingest` and the audition script listed as writers; per-lens agent types from the composer; the four-verdicts, three-starts fixture. | Part 1, W-4 |
| 2 | blocking | Per-instance worktrees break the hand-off | Sustained. One branch per item with commits recorded on `return` (H-4); one log resolver in `team-log.mjs` (W-5). | Parts 1 and 3 |
| 3 | blocking | ADR-0012 orders E first | Sustained. E is a Phase 0 prerequisite; the wire ADR amends ADR-0012 B; the draft's claim that ADR-0014 needed amending is corrected; the sandbox layer is added with Pierrot 3. | Security; Phasing; ADR table |
| 4 | amend | Four fitted locations, not two; posture homeless; G4 vs ADR-0015 | Sustained. A closed fitted list enforced by check-canon; posture, skeptic effort, and the judge model in `team/casting/`; probes in persona frontmatter; posture emitted as an output style; G4 reworded. | Part 2; Goals |
| 5 | amend | A host is not a harness | Sustained. `team/hosts/`, `launch` templates, `plan --host`, split isolation, `host` on `spawn` (H-2). | Part 3 |
| 6 | amend | W-1 breaks history | Sustained. `by` required on append only; `unattributed` for old lines; the seat CLI stamps `seat`; one writer for `claim`; a reserved coordinator seat. | Part 1, W-1 |
| 7 | amend | The herdr loop reimplements the line workflow | Sustained. One runner over a host interface with a parity test (H-5); the foreground-dispatcher argument against ADR-0012 A; the human's ADR-0012 C opt-in recorded on the order. | Part 3 |
| 8 | amend | Zone misclassification | Sustained. The ADRs are meta; assets are classified individually; sprites move into the skin or the canon world falls back to the `plain` skin. | ADR table; Part 4 |
| 9 | amend | Fold into ADR-0015; split cross-vendor; cutover gates Phase 1 | Sustained. | ADR table; Phasing |
| 10 | note | The skin carries no identity in the model | Adopted. Identity lives in the persona file; the voice probe decides whether it survived. | Part 3 |

### Dani

| # | Grade | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | blocking | `check:css` can't see a canvas page | Sustained. A `node --test` contrast case over every accent against the named background, plus axe; `check:css` stays advisory under ADR-0013 § 6. | Accessibility; V-7 |
| 2 | blocking | The hall's gate asks the battle's question; Line untested; races raw JSONL | Sustained. The hall is timed on "who is waiting on me", the battle on "who vetoed and why", both against the table renderer; Line folds into the quest board. | Part 4 |
| 3 | amend | Badges blame the wrong actor | Sustained. A "waiting on you" card instead of a sleeping seat; item statuses go on the item; "Voice drift (judged)". | Status effects |
| 4 | amend | Plain words first; REFUTED; skeptic chorus | Sustained. | Status effects; Battle |
| 5 | amend | Pause control, flash limit, colour alone, herdr state in the name | Sustained. | Accessibility; H-1 |
| 6 | amend | Status region, no `role="log"`, DOM mirror, focus return | Sustained. | Accessibility; V-7 |
| 7 | amend | Six accents fail contrast | Sustained, figures independently confirmed; `color-mix` lift, baked rim, glyph colouring, `NO_COLOR`. | Accessibility; party bar |
| 8 | amend | One bobbing frame reads as a sticker; minimum art | Sustained. "Needs no new art" withdrawn; the minimum art listed; no walking; the room is the second concept. | Guild Hall |
| 9 | amend | The scenario over-promises | Sustained. Desktop notification through herdr instead of a phone; parallel lenses in timestamp order; phase tags; severity-only exports. | Scenario; V-5 |
| 10 | note | Wrong directive cited for the 16-bit sprites | Adopted. The citation is corrected. | Guild Hall |

Dani's preamble (no design profile) became open question 6, and Dani's three sacrificial concepts are in the PRD: the quest board is the hall's first form, the diff-as-map is the replay's second tab, and the room is the second concept for the hall.

## Where the reviewers converged

| Concern | Raised by | Outcome |
|---|---|---|
| herdr's socket gives every seat control of every pane | Wei 1, Pierrot 3, Archie 3 | Containment preconditions; herdr host gated |
| "Witnessed" overclaims and misses #129 | Wei 2, Archie 1, Pierrot 2 | Testimony, out-of-band, corroborated |
| *Echo* on verdicts alone cries wolf, and a badge is not an alarm | Pat 2, Wei 5, Dani 2 | Overlap required; D-4 fails closed |
| Renderers should race the table renderer, battle before hall | Pat 5, Wei 5, Dani 2 | Reordered phases and timed tasks |
| The multi-model pages outrun the one-model default | Pat 11, Wei 4 | Default ships first; H1 decides the rest |

## The reviews, verbatim

### Wei, verbatim

I'll start with the opposite (Inversion): ship Part 1 and Part 5 on the v3 Workflow host, and make everything else earn its way in. Line numbers refer to the first draft of the PRD.

**1. herdr doesn't earn its seat. Blocking. (Part 3; Security and privacy)**
Scale attack: the subagent limits bite at the review station, which is 40 of 45 agents, and the draft leaves that station on subagents. herdr frees red and green, and with the night's three items they come nowhere near a cap. Cutover fixes the registry failure, and the Workflow host is already a script. What herdr does add is a keyboard on every pane. `agent send-keys` is how you answer a blocked dialog (agent-automation.mdx:72), so any seat can approve another seat's permission prompt. H-4's string match loses to a glob like `~/.config/*/*.sock` (socket-api.mdx:637). The draft concedes that bypass, yet H-4's fixture only tests a polite attacker.
*Counter:* move Part 3 into its own PRD with a gate that proves need, such as an order the Workflow host failed. If it stays, contain seats at the OS level: the Bash sandbox with the socket outside `allowUnixSockets`, or a separate user. The test should be a raw socket connect from inside a seat. H1 can run headless (`codex exec`) and needs no host.

**2. "Witnessed" overclaims. Blocking. (Part 1; Principles; Terms)**
- **`by` proves nothing.** It is a string the writer declares about itself, and any seat can append it as the same user.
- **herdr state is a guess.** It is read off the screen: `blocked` means herdr "recognized an approval or question UI" (agent-automation.mdx:78). Any socket client can overwrite it with `pane.report_agent` (socket-api.mdx:656-673). herdr's own integration guide has the agent in a pane report its own state (add-herdr-support.mdx:28-39).
- **It softens ADR-0012.** ADR-0012:67-69 says Summon "should not claim" this property and adds "do not soften downstream". The draft's "proof" softens it.
- **A wrong implementation passes W-4.** The review pane starts, skips the wave, writes five verdicts and exits. The draft's rule counts that as witnessed.
- **Citation check fails.** The draft says the wire "loses nothing" through `agent_type`. But review-wave runs prepared prompts, and it ran while `review-party` was unregistered (first-runs:51, :93). `ingest` wrote all 41 run-1 events (first-runs:27) and is missing from the `by` table.

*Counter:* call these events *out-of-band* and grade them inferential about the work. Require a `SubagentStop` that names its lens for every verdict. Make the case above W-4's fixture. Classify `ingest` as `seat`, and keep `host` out of the witness ratio.

**3. Auditions gate on noise. Amend. (Auditions; Phase 1 gate)**
- **Citation check fails.** The draft says auditions "reuse ADR-0005's grader discipline". They don't. ADR-0005 requires fixture families (§3), at least 5×10 runs with CIs (§5), and a judge validated on human labels (§7). The audition has one saturated fixture (first-runs:31), no run count, and an unvalidated voice judge.
- **The replay set favours the incumbent.** It is built from the incumbent's own hits. A challenger that finds *different* defects, which is H1's whole premise, scores as a regression.
- **One run proves little.** A clean presence run covers about 20 findings on planted defects. That only bounds the skeptic's refutation rate below about 15% (rule of three).

*Counter:* an audition may block but never promote. Seed the replay set with defects the incumbent missed, pre-register n, and drop the two-day target.

**4. The default contradicts the casting pages. Amend. (Part 2; Success measures)**
The default is one model. Yet the night story and the sample casting run Sonnet, Opus and Haiku, and the 40% target is arithmetic on Sonnet skeptics. Part 5 discounts agreement within one model family, so the default is the setup the PRD's own instrument distrusts.
*Counter:* Phase 1 ships C-1 to C-3 with a cost target based on effort alone. Run H1 first, because it decides whether escalation, posture profiles and cross-vendor seats should exist at all.

**5. The world sells a badge, not an alarm. Amend. (Part 4; Status effects)**
*Echo* reads verdicts only, which is the instrument first-runs:31 faulted, and Part 5 redefines it. It needs ten real items and v3 has two (first-runs:73). In the scenario the human is asleep anyway. The gates compare the hall against raw JSONL and against the human's own report of using it.
*Counter:* fail closed. `team:dissent` already exits 1 on a unanimous window (first-runs:33), so the dispatcher should refuse to close an order without a human ack. Time the hall against `team-log.mjs render`. I concede the party bar and replays.

**6. Personas are assumed model-proof. Amend. (G4; Voices)**
Assumption surfacing: ADR-0015:116 says "model fit is a persona edit", and G4 forbids exactly that. The draft says older prompts are "too prescriptive" for Fable. If every casting on a new model fails the voice check, the team deadlocks on a model that is being retired. The probes also measure obedience. This review numbers and grades its challenges because the brief asked it to, so it passes Wei's probe (wei.md:32) with or without the persona.
*Counter:* probe with station prompts that say nothing about format. Compare the same seat with and without its persona. Write the deadlock rule now.

**Withdrawn after checking:** these claims all hold: the Tells (pierrot.md:35, vik.md:35); the first-run figures; the fifteen seats; ADR-0012:89's rejection of agent teams; herdr's env precedence, including `HERDR_BIN_PATH` (cli-reference.mdx:545).

**Assessment:** the core of the wire and Part 5 are sound. The herdr host and the world are being bought on their credibility.

Sentinel as returned: 6 findings (2 blocking, 4 amend, 0 note).

### Pierrot, verbatim

Pierrot's review of the PRD. I checked it against the current Claude Code hooks, sandbox and permission docs, herdr 0.9.3's socket and plugin docs, and v3's `events.json` and harness adapter. In short, the wire is not the inert observer the Security section describes, and H-4 looks like a lock without being one.

**1. Blocking (Phase 0): "async and silent" is not built into the design.** *Part 1, hook set; W-3.* An async hook can still talk to the model: Claude Code hands its `additionalContext` and `systemMessage` to the model on the next turn, and you never see them. On `SessionStart` and `PostModelSwitch` (both wired here), plain stdout also becomes model context. Async hooks get no enforced `timeout` and no deduplication; if the wire blocks on its log (a planted FIFO, say), every tool call leaves another stuck process behind. Blast radius: every session that loads the hook, yours included. Fix: wire it as `node <abs-path> >/dev/null 2>&1` and give the script its own exit timer. Open the log with `O_NOFOLLOW` and refuse anything that isn't a regular file. Add a W-3 fixture where the wire emits `additionalContext` and assert that nothing reaches the model.

**2. Blocking (Phase 0): the hook runs code that seats and contributors can edit.** *W-7; Security, "first hooks".* Hooks run outside the sandbox, with the session's environment, `HERDR_SOCKET_PATH` included. `scripts/wire.mjs` lives in the seat's worktree, and v3's `write:src` has no path limit: a coder seat can edit it (no prompt under `acceptEdits`), and its next tool call runs the edited code. Hook edits load live. A local `disableAllHooks: true`, one approved prompt away, outranks the tracked file. The same access lets a seat write fake `by: wire` lines. `-p` and SDK runs trust the folder, so a PR that edits the script executes in any CI job that runs `claude -p` on the checkout, with that job's secrets, in every scaffolded project. Time-to-exploit: one tool call. Fix: run the wire from a pinned, hashed path outside every worktree (a Claude Code plugin, or inline `--settings` passed by the dispatcher, which lives in argv and outranks project and local files); block project and local settings edits with a `ConfigChange` hook (a blocking hook, so ADR-0012's conditions apply); refuse `bypassPermissions` for seats; make `check --line` fail any work-order diff that touches `.claude/**`, the wire, or `team/harness|casting`; document `--settings '{"disableAllHooks": true}'` for CI on PR checkouts.

**3. Blocking (Phase 2): H-4 can't honestly pass its own P0 fixture.** *H-4; Security, "socket is a keyboard"; Risks.* The fixture is a prompt-injected reviewer, which is exactly the hostile seat the PRD admits neither layer stops. A seat can Write a five-line Node client and run `node x.mjs`, and herdr is never named; stripping the env var doesn't help, because the socket sits at `~/.config/herdr/herdr.sock` by default. With the socket a seat can press Enter on the coder's pending permission prompt with `send_keys` (a read-only lens borrows Bash), read every pane with `pane.read`, fake the pane state the `host` witness reads with `report_agent`, and install persistent, unsandboxed code with `plugin.link`. Codex seats get no Claude hooks at all. Time: seconds. Blast radius: everything open in herdr, and it outlives the work order. Fix: require Claude Code's sandbox for seats, with Unix sockets blocked and `HERDR_*` denied through `credentials.envVars`; `doctor` refuses the herdr host when Linux's seccomp filter is missing, since without it sockets stay open; cross-vendor seats get an equivalent sandbox or don't run; keep the guard hook as a tripwire only, and re-grade the Risks row. Finding 2 is how a seat escapes that sandbox, so 2 has to land first.

**4. Amend: seat testimony is attacker-controlled text.** *Part 4; V-2, V-5; W-1.* `finding.summary` is written by a seat that read a hostile diff. It ends up in Guild Hall speech bubbles, in a replay whose inlined JSON breaks out on `</script>`, and in terminal renderers, where an OSC 52 sequence can write your clipboard. Blast radius: anyone who opens the hall or a replay. Fix: render with `textContent` only; embed JSON as `application/json` with `<` escaped; strip control characters (C0/C1) before terminal output; give the export a meta CSP of `default-src 'none'`; CI treats the ledger as data; the seat-facing `append` always writes `by: seat`.

**5. Amend: leaks.** *Redaction; W-6, W-8, V-5.* My own findings quote secrets, so testimony carries them into git history and PR replays. "First word of a Bash command" stores `GITHUB_TOKEN=ghp_…` whole. Absolute paths carry usernames. `OTEL_LOG_TOOL_DETAILS=1` exports tool input arguments, so W-8's acceptance test switches redaction off. Fix: scrub secrets at append; record the basename of the first token that isn't a variable assignment, checked against an allowlist; build exports from a field allowlist and never include detail-mode lines; add a fixture for each case.

**6. Amend: local server.** *V-2, W-8.* A token in the URL leaks through synced browser history, Referer headers and screen-shares; swap it once for an `HttpOnly; SameSite=Strict` cookie and send `Referrer-Policy: no-referrer`. The OTLP receiver is a write endpoint, and any web page can POST to it without a CORS preflight; require the token in a header, an exact `application/json` content type, and a body size cap.

**7. Amend: plugin supply chain.** *Part 3, the Summon herdr plugin.* Tags can be moved: pin the commit, and have `doctor` compare it with the resolved commit `plugin.list` reports. No `[[build]]` or `[[startup]]` entries. Never `plugin link` a live checkout. Apply ADR-0010's cooldown to herdr and to the plugin. Use argv only, because any socket client can set the `persona` token.

**8. Note.** herdr's agent-detection rules update remotely (`server.agent_manifests`), so each `host` event should record which rule-set version judged it.

Sentinel as returned: 8 findings (3 blocking, 4 amend, 1 note).

### Pat, verbatim

I reviewed `/home/user/summon/docs/history/design/summon-live-prd.md` for the person the README says Summon is for: a solo developer who answers for the code later. On paper the PRD covers all five of your asks. It loses the plot in one place: dissent is what decayed, and the PRD makes it neither a goal nor something any phase builds.

1. **Blocking. Goals and non-goals; Success measures.** No goal says when the deprecation notice comes down, and no measure tracks dissent on real items. Add G0, "the warning can be lifted," met when the negative control passes on presence on the current model, dissent is non-zero over ten real items, content divergence is reported for every item, and one model release lands with changes only in fitted files. G3 has no measure either. Add one: the same work order on two coordinating models produces identical spawn sequences.

2. **Blocking. Part 5; Status effects; Phasing.** Part 5's three instruments have no IDs, no priority and no phase. *Echo* fires on unanimous verdicts alone, which Part 5 itself says is not the real *Echo*. The first-runs report already counts three cases of unanimous verdicts over findings that differed in content. Built as written, *Echo* will cry wolf. Number the instruments, ship content divergence at P0 together with V-4, and redefine *Echo* as unanimous verdicts plus high finding overlap.

3. **Amend. Phasing, Phase 0.** Phase 0 builds the right foundation, but nobody will see it. Add V-1 (read-only) and *Silence*. The status line then shows each seat, the model actually running it and its tokens, and goes red when a review never spawned. That is the smallest release anyone would notice, and it needs no casting. Prioritize #123 and #109 now, because both block it.

4. **Amend. Success measures.** Three targets are made up: 40 percent (the PRD calls its own arithmetic "assumptions"); two days (promotion is a human act, so this times the human); 0.95 (it applies only on herdr). The first-runs report shows two real judged items. Get a baseline first: run Phase 0's own items through the v3 line on all-inherit. That gives a cost baseline, a recall corpus and the first dissent window. Replace "two days" with "no item runs on *Stale gear* unacknowledged", and measure the witness ratio on every host.

5. **Amend. Part 4; Phasing, Phases 3–4.** The order is upside down. The Battle is the renderer that draws the premise: MISS with the skeptic's reason, and the verdict split. As a replay export it needs no server. The Guild Hall repeats the party bar's question and adds a server. Make Phase 3 V-5 plus the Battle replay, and move the hall and V-2 to Phase 4. V-3 must beat `team-log.mjs render`, not raw JSONL. Its usage gate should count `serve` launches, not self-reports.

6. **Amend. Part 2 requirements, priorities.** Phase 1's gate needs a promoted audition, and promotion needs voice, so C-4 and C-8 are P0. C-2's acceptance needs Phase 2's herdr adapter; test two hosts for now. C-5 cites Phase 4's battle screen; test the ledger only.

7. **Amend. Parts 1–2 requirements, acceptance.** W-3's "byte-identical seat behaviour" can't be tested: a live model is nondeterministic, and a stubbed session tests nothing. Test the hook contract instead: exit 0, empty stdout, under five seconds. C-3 and the *Stale gear* row define the status two ways; pick one. C-4 needs its recall tolerance stated.

8. **Amend. Success measures; Voices survive recasting.** "All fifteen seats" can't be tested. Auditions run only the formation and the line, so at least eight seats (Cam, Pat, Grace, Wei, Debra, Diego, Prof, Cloud) produce nothing to probe. Narrow the target. Also, *Muted* fires only when every tell is gone. A seat that keeps its tic but loses its substance stays green, which is the same failure the deprecation describes.

9. **Amend. Why now.** This section overclaims. Dispatch covers only the tdd line. The Architecture Gate, which is the README's own pitch, still needs a coordinator willing to delegate, and the PRD's answer to that, C-7, is P2. Mark causes 1 and 3 as still open outside work orders.

10. **Amend. Who this is for; Parts 3–4; Phase 4.** No to: sound (it answers no question); the Line renderer (a bottleneck view serves throughput, which the README excludes); H-6 and the second-vendor job row (they send code to a second vendor on an untested hypothesis; run H1 across Anthropic model families first); H-7 (the dispatcher already records `blocked`, and the plugin runs unsandboxed over every pane); sprite sheets (not until the hall passes its usage gate, open question 6).

11. **Note. A night with the party.** The scenario sells a multi-model casting that hasn't yet beaten the one-model default. Show the default, or an audition winner.

12. **Note. Keep these:** status effects computed from the log, the one-model default, the floor of zero refuted planted defects, and the sixty-day delete trigger. On open questions 2 and 4: ship no default casting, and keep promotion a human act.

Sentinel as returned: 12 findings (2 blocking, 8 amend, 2 note).

### Archie, verbatim

The direction is sound, and "view never in context" holds (V-8). Three defects would carry into the ADRs if they aren't fixed first.

**1. Blocking. Part 1 "Who writes what", W-4, and the review-formation exception in Part 3.** The witness rule doesn't catch #129. The PRD counts anything not written by the seat as witnessed, so `review-wave.mjs ingest` counts as a witness. But `ingest` writes a `revise` verdict and `return ok:true` for a lens that never returned, all under one instance. Lenses are spawned without an `agentType`, so `SubagentStart` can't name the lens. A long-lived session (H-5) brackets every item it handles, so its start and exit say nothing about any one item. *Change:* compute "witnessed" per turn, keyed on (instance, item, station), or on (instance, item, lens) for a formation. Never infer it from who wrote the line. List `ingest` and the audition script as writers. Add a fixture with four verdicts and three lens starts that must name the missing lens.

**2. Blocking. Part 3 "How a work order runs", H-2.** Per-instance worktrees give the isolation ADR-0012 D asks for, but they break the hand-off between stations. `open` creates every worktree at one detached head before any station runs, so `sato#1` never sees `tara#1`'s tests. H-2 still passes, because `check --line` reads only claims. *Change:* use one branch per item. At each claim, the dispatcher checks out the previous station's committed head (recorded on its `return`). Put the `SUMMON_LOG` resolver in `team-log.mjs`; today dispatch, ingest, the runner and the seats' Log section all resolve the log path from cwd.

**3. Blocking. Security and privacy; Phasing.** ADR-0012 orders the work: E (the capability registry) first, then scripts, then hooks. E has not shipped on main or on v3, and ADR-0012's trigger 1 fires on 2026-10-24. ADR-0014 § 4 governs add-on hooks and leaves Summon's own hooks to 0012, so it needs no amendment. *Change:* E gates Phase 0. The Wire ADR amends 0012 B, which reserves hooks for blocking, to admit observe-only hooks. H-4 gets its registry entry, canon source and escape hatch. Under the hook, add a structural layer: seats run Bash in Claude Code's sandbox, with the herdr socket left off `network.allowUnixSockets`. That closes the scripted-client bypass the PRD concedes. Pierrot should confirm this holds on Linux.

**4. Amend. Part 2 (casting file, posture, voice); Success measures.** The PRD claims two kinds of fitted file but adds four: harness, casting, the herdr file, and `team/posture/`. Posture is re-checked on every release, yet it sits outside the widened trigger 3. G4 also reverses ADR-0015's "model fit is a persona edit". *Change:* keep a closed list of fitted locations in team-layers.md, enforced by check-canon; put posture under `team/casting/`, along with the skeptics' `effort: 'medium'` that is hard-coded in `review-wave.workflow.mjs` today; put voice probes in persona frontmatter, and the judge's model in casting; say where posture is emitted (the coordinator isn't a composed seat, and a generated block in CLAUDE.md is the drift trigger 4 watches for).

**5. Amend. Part 3 H-1, steps 1–3.** A host is not a harness. `herdr.json` has no capabilities and no frontmatter. A Codex pane needs both a Codex adapter and herdr. `--agent/--model/--effort` are Claude Code flags. `plan` reads its limits from the party's harness, so "plan is unchanged" is false, and both kinds of worktree hang off one `isolation` field. *Change:* add `team/hosts/<host>.json`, a `launch` argv in each harness adapter, `plan --host`, a split `isolation` field, and `host` on `spawn`.

**6. Amend. Part 1 W-1.** `append` and check-canon #10 share `validateEvent`, so requiring `by` there fails every historical line. Reading old lines as `seat` also mislabels what dispatch, the runner and ingest wrote. *Change:* require `by` on append only, and read a missing `by` as `unattributed`; the CLI `append` stamps `seat` and refuses any other value, which keeps the PRD honest under ADR-0012's tamper boundary; the dispatcher claims before it prompts, so `claim` has one writer; reserve a seat name for coordinator events.

**7. Amend. Part 3; N3.** The herdr loop plus escalation (C-6) reimplements `line.workflow.mjs`. *Change:* build one runner over a host interface, or add a parity test (same plan, same claims and returns). Argue why a foreground loop is not the supervisor 0012 A rejects. Record the human's 0012 C Workflow opt-in on the work order, because no human is inside the review pane to opt in.

**8. Amend. Architecture Gate table; Part 4.** "Canon (it observes user projects)" repeats the misclassification ADR-0012's own gate caught. The ADRs are meta, and each asset is classified on its own: casting schema, wire, world server, and plugin are canon; Summon's casting, audition reports, and replay set are meta unless OQ2 ships a default; the sprites live under `site/`, which the scaffolder excludes. *Change:* move the sprites into the skin, or have the canon world fall back to the plain skin.

**9. Amend. Architecture Gate; Phasing.** *Change:* fold the fitted list and `by` into ADR-0015 at ratification, so two of these ADRs don't amend it straight away; split cross-vendor seats, and the egress decision that comes with them, out of the Host ADR; cutover gates Phase 1, not Phase 0, because Phase 0 runs on recorded fixtures.

**10. Note. Cross-vendor seats; OQ3.** The skin never reaches the model, so it carries no identity there. Say "persona file", and let *Muted* decide whether the persona survived.

Sentinel as returned: 10 findings (3 blocking, 6 amend, 1 note).

### Dani, verbatim

This project has no design profile; findings below are accessibility and internal-consistency only. There's no `docs/design-profile.md`. Want to fill in the stub? It takes about ten minutes and makes every later review sharper.

**1. Blocking (Accessibility, V-7).** `pnpm check:css` can't see a canvas page. It reads only colours written literally in CSS (`scripts/check-css-contrast-motion.mjs:18-24`). That means `fillStyle`, skin accents and `requestAnimationFrame` motion are all invisible to it. It also exits 0 without `--strict`, and the script itself says its silence "is not a pass". Replace it with a `node --test` case that runs the script's exported `contrastRatio` over every accent and the hall background, plus axe on the DOM.

**2. Blocking (The renderers, V-3, V-6, Phase 3 gate).** The hall says it answers "where is it stuck?", but its timed gate asks the battle's question, "who vetoed X and why?". The battle only gets a fidelity check, and Line gets no acceptance test at all. The timed gate also races raw JSONL, which any page beats; race the table renderer instead. Time the hall on "who's waiting on me?" and the battle on "who vetoed and why?", and fold Line into the hall's quest board. The party bar, table, herdr wall and replay earn their places.

**3. Amend (Status effects).** Three badges blame the wrong actor. *Sleep* names "the human is the bottleneck" but draws Sato asleep, which reads as herdr's `idle`, not `blocked`. Show him holding up a "waiting on you" card instead. *Silence* (#129's seats never ran) and *Confuse* (a line-order fault) belong on the item's notice, not on a persona. *Muted* reads as audio mute and comes partly from a judge model, so the badge should say it was judged.

**4. Amend (Status effects, Battle).** Lead with plain words ("Unwitnessed verdict", "Out of order", "Budget 84%"). *Silence*, *Confuse* and *Doom* mean nothing to someone who never played a JRPG (WCAG 3.1.3, AAA). "MISS" says the lens whiffed, but your audition treats a skeptic refuting a real defect as the worst case. Show "REFUTED" and keep the finding visible. Skeptics are 40 of 45 agents and have no skin entry; draw them as one chorus with a count.

**5. Amend (Accessibility, Battle, Who this is for).** Respecting reduced motion alone doesn't meet WCAG 2.2.2: a hall that animates all the time needs a visible pause control. Keep hit effects under three flashes a second (2.3.1). Severity-coloured hits and "the party bar turns it red" rely on colour alone (1.4.1); add the word. On herdr, put the state in the pane's display name.

**6. Amend (Accessibility, Guild Hall).** Use one polite `role="status"` region. It announces only what needs the human (blocked, verdict, status raised, escalation, done), at most once every ten seconds, and never telemetry. The event list must not be `role="log"`, which reads out every new row, and scrubbing a replay should stay silent. A canvas needs a DOM list of buttons named by state ("Sato#1, green, item 42, waiting on you 3 min"), because the skin's `alt` describes a portrait, not a state. Clicking a seat opens a dialog that returns focus when closed.

**7. Amend (Accessibility, Party bar).** On the site's `#0f172a`, six accents fail 4.5:1 as text: Pierrot 1.78, Pat 2.23, Diego 3.33, Prof 3.63, Vik 3.75, Grace 4.22. Pierrot, Pat and the formation's `#4f46e5` (2.84) fail even 3:1. Name the hall background and lighten accent text per `docs/team-directives.md:71`. Bake the `#a5b4fc` rim (`site/src/components/TeamGrid.astro:164`) into the frames, since CSS filters don't survive `drawImage`. In terminals, colour a glyph rather than the name, and honour `NO_COLOR`.

**8. Amend (Guild Hall, open question 6).** "Needs no new art" doesn't cover what the scenario shows. Every sprite has its stage token baked in (art bible §1), so a bob drags the floor along with it, and a raised hand is a new pose, not a transform. The minimum is: re-exports without the token; one working frame per persona; a shared emote sheet; motion in whole master pixels; no walking. My bet is that one bobbing frame reads as a sticker. Mock three sprites both ways and look.

**9. Amend (A night with the party).** A phone notification needs a push service, which N1 rules out. The lenses run in parallel, so they don't "take turns"; order the hits by timestamp. Tag each beat with the phase that delivers it. Speech bubbles quoting findings, in a replay attached to a public PR, can disclose an unfixed vulnerability. Default the export to severity only (Pierrot's call).

**10. Note (Guild Hall).** The sprite drop-in directive the PRD cites (`docs/team-directives.md:70`) names the HD-2D `team/<slug>.webp` path. The 16-bit set is lossless PNG in `team-16bit/`.

**Sacrificial concepts (tear them apart):**
- **A. Quest board.** Items are pinned under station banners, and each live seat stands beneath its notice with its state and a timer. Cheap and easy to read, and it absorbs Line; it feels least like a world.
- **B. The room, honestly scoped.** Fixed stations, no walking, and a review cuts to the battle screen. You get charm and a sense of place; it costs art plus a parallel DOM.
- **C. The diff as a map.** Files are tiles. Each lens plants a banner where it filed a finding, and a refutation knocks the banner over. It draws Part 5's content divergence, which no phase schedules yet.

I'd test A first, on paper with the first-run order. It's a day's work, it answers the hall's own question, and it sets the time B has to beat. Which do you hate?

Sentinel as returned: 10 findings (2 blocking, 7 amend, 1 note).
