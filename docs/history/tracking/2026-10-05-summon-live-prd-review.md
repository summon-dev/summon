---
agent-notes: { ctx: "persona review of the Summon Live PRD draft", deps: [docs/history/design/summon-live-prd.md], state: active, last: "claude@2026-10-05", key: ["five standalone reviewers: Wei, Pierrot, Pat, Archie, Dani; 46 findings, 12 blocking", "reviewers returned messages; the coordinator wrote this record and revised the PRD", "every finding has a disposition; the reviews are reproduced verbatim at the end", "round 2 reviews commit 9888dd0, the chain revision made after the author said why the team was stopped"] }
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

## Round 2: the revision after the author's input

**Date:** 2026-10-05
**Subject:** commit `9888dd0`, which added *The three symptoms are one chain*, W-10, D-5, H-7, and H-8 after the human said why the team was stopped
**Reviewers:** Archie (architecture and feasibility) and Wei (challenger), each spawned as a standalone agent with instructions not to write files. The first attempt at both was lost to a container restart, and both were re-spawned with the same briefs.
**Method:** As in round 1. Each brief named the changed lines and the sources to check; Archie's asked five questions and Wei's six. Wei's review notes that pointed questions prime content the way round 1's briefs primed format (his finding 12), so round 2's findings are answers to the coordinator's questions, not a sample of contest.

Round 2 changed the answer more than the machinery. Wei showed that the chain was fitted to the fortnight around July 24 while the post dates the decline's onset to May 15, so the section is now *The three symptoms, two paths*, skip and decay, with a forensic pass (D-6) to find out which led before anything is built. Wei also showed that the voice probe cannot see a coordinator writing under a seat's name, that G0 let the notice come down with the post's recorded failure still live in conversation, and that the arguable fixture fails the Lucas critique it was meant to honour. Those became the production voice check (C-13), a conversational bar in G0, and the contest control as an open question. Archie found three false greens in the new requirements, all fixed: no expectation on the dispatched path, a hand-off check that could not see what a station changed, and a re-run that laundered a crossing.

### Sentinel check, round 2

| Reviewer | Sentinel as returned | Findings present | Matches | Note |
|---|---|---|---|---|
| Archie | 13 findings (3 blocking, 9 amend, 1 note) | 13 | yes | Re-spawned once after the restart |
| Wei | 12 findings (4 blocking, 6 amend, 2 note) | 12 | yes | Re-spawned once after the restart; fetched the public Opus 5 guide to check a citation |

### Claims the coordinator verified, round 2

- **Hooks:** `Stop` carries `background_tasks` to tell "done" from "paused waiting for background work"; `SessionEnd` hooks get 1.5 seconds by default and a plugin's own timeout does not raise that; `-p` runs kill async hooks at teardown; `SubagentStart` is documented for the Agent tool, resumed subagents, and agent-team teammates, not for agents a Workflow script spawns; `PreToolUse` matches `Workflow`; `prompt_id` is a common input field.
- **Sandbox and permissions:** `autoAllowBashIfSandboxed` defaults to true; a sandbox in a linked worktree may write the shared `.git` directory. One correction runs the other way: the settings reference says `Read` and `Edit` deny rules also apply to the shell commands Claude Code recognises as file commands (`cat`, `sed`, `tee`) and to redirection targets, though not to arbitrary subprocesses. H-8 now says so.
- **v3 code:** `open` runs `git worktree add --detach`; `claim` checks only `order` and `distinct-instance` and records no tree; `dispatch.mjs` takes only `plan`, `open`, and `claim`; `appendEvent` throws on an undeclared event; `line.workflow.mjs` has no filesystem and each seat runs its own claim.
- **The Opus 5 guide (Wei 1, 4, 5, 11):** fetched and read. Claude Code adds its delegation instruction on Opus 5 "only when you use its claude_code system prompt preset"; Opus 5 "finds real bugs at a high rate per pass, and its additional findings are mostly real issues rather than false positives"; it "performs well out of the box on existing Claude Opus 4.8 prompts"; and its sample delegation instruction says "do not use subagents to verify or double-check your own work".
- **The post (Wei 1, 2, 10):** "Three things, inside about a fortnight"; the harness as "the axis that killed my team"; "I noticed, and filed it as cosmetic"; nesting recorded as "manually approving something that used to just run"; one audit date six months out, beside Boris Cherny's every-six-months advice, which the post quotes.
- **ADR-0015 (Wei 4):** reversal trigger 1, as amended on 2026-09-10, keys on presence and on spread over ten real items, so reading the arguable fixture under it would amend it.
- **Hook payloads (Wei 5):** inside a subagent every hook payload carries `agent_id` and `agent_type`, which is what lets W-11 tie a verdict to the agent that wrote it.
- **This repository's history (Wei 1):** twelve v2-era tracking records from 2026-06-06 to 2026-08-06, among them a refutation on 2026-08-05 by a challenger who was "told to default to `REFUTED`".

### Archie, round 2

| # | Grade | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | blocking | W-10 never writes `expect` on the dispatched path | Sustained. The plan is the expectation: `dispatch.mjs claim` and `review-wave.mjs prepare` write `expect`; the hooks cover conversation only; a dispatched fixture in which four of five lenses start must yield one `absent`. `PreToolUse` on `Workflow` is not adopted, because the plan already covers that path. | Part 1, W-10; chain link 2 |
| 2 | amend | `Stop` closes too early; `SessionEnd` may never run | Sustained. `Stop` closes only when `background_tasks` is clear; a synchronous `SessionEnd` handler through `--settings`; `corroborate` derives absences; the binding declares where a ceremony closes; an interrupted ceremony reads as unclosed. | Part 1 |
| 3 | amend | `expect` and the absence event need schema entries; `seat` must not be the persona | Sustained. Both are declared in `team/events.json`; a reserved writer `seat` with the missing seat in `missing`; session and prompt ids as the item fallback; W-10's acceptance validates every wire line. | Part 1, W-10 |
| 4 | amend | Seat declarations already have homes | Sustained. Seats stay in the formation, the line, and the gate line; a ceremony binding in the party and harness names in the adapter are compiled into a pinned, hashed expectations table. | Part 1; ADR table |
| 5 | amend | The model-invoked trigger fires before permission | Sustained. `PostToolUse` on `Skill`, withdrawn on `PermissionDenied` or `PostToolUseFailure`; the field name goes in the adapter behind a `doctor` probe. | Part 1 |
| 6 | amend | `SubagentStart` for Workflow agents is undocumented | Sustained. The live probe is Phase 0's first item; if it fails, the Workflow host reports corroboration and absences as unavailable, never as zero. | Part 1; Phasing |
| 7 | blocking | H-7 cannot compute changed paths on the Workflow host | Sustained. Object-id snapshots through a temporary index, `diff-tree --no-renames`, the check inside the next claim and a `handoff` command, a return counted only after a passing check, `tree` on `claim`, `station` and `instance` on `check`, and one item in flight under isolation none until H-4 reaches that host. "Refused" is reworded as a guard on an honest run there. Pulling H-4 into Phase 1 was the alternative and is not taken. | Part 3, H-7 |
| 8 | blocking | Re-running a station launders the crossing | Sustained. The base is fixed per item and station; the herdr host resets to it before a re-run; the re-claim fixture is in H-7. | Part 3, H-7 |
| 9 | amend | `write:src` is a complement, and the globs sit in a Claude-specific file | Sustained. The globs move to a per-project binding beside `team/checks.json`; writing source is the complement; the defaults widen; the `mod tests` limit is stated. | Part 3; ADR table |
| 10 | amend | H-8 overstates the shell | Sustained, with the correction above: recognised file commands and redirections are covered on every OS, arbitrary subprocesses are not, the sandbox takes glob rules only on macOS, and the tester's complement is not covered on the shell at all. The acceptance adds `Write`, `NotebookEdit`, and a shell write. | Part 3, H-8 |
| 11 | amend | D-5 needs a planted positive; the trigger-1 reading reopens a decision | Sustained. Every D-5 run plants one absence per path; whether the arguable fixture counts under trigger 1 goes to the human in the ADR-0015 fold-in. | Part 5; G0 |
| 12 | amend | The gate table cannot carry H-7 in Phase 1 | Sustained. The ADR-0015 fold-in row carries H-7, the ceremony binding, the `paths` binding, and the trigger-1 question; the wire row names `expect` and `absent`; casting takes D-5's voice half; host adapters take H-8; H-7 and H-8 get ADR-0012 E registry entries. | ADR table |
| 13 | note | "skip" already means something in v3 | Adopted. The event is `absent` and the status *Seat never started*; v3's `skipped` keeps its meaning. The review below says `skip` because it reviewed the earlier wording. | Throughout |

### Wei, round 2

| # | Grade | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | blocking | The chain is fitted to the last fortnight | Sustained. The section is now *The three symptoms, two paths*: skip and decay, the onset ten weeks before any dated change stated as unexplained, the Opus 4.8 claim cut, the "visible, not happen" sentence cut, the post's counter-case and survivorship named, and the forensic pass (D-6) first in Phase 0. The Summary, the risk table, and the cross-references follow. | Two-paths section; Summary; Risks; D-6 |
| 2 | blocking | "Voice is the earliest sensor" contradicts the thesis | Sustained. "Earliest" is gone; any C-8 or C-13 failure starts D-5 at once; the production voice check (C-13) compares ledger text with runs with and without the persona and raises *Voice missing (judged)* on the item, never on the persona. | Two-paths section; Part 2, C-13; statuses |
| 3 | blocking | G0 doesn't gate the conversational path; W-10 can't see free text | Sustained, both halves. G0 holds the conversational route to a bar set from the baseline, typed and free text alike, and narrows the notice instead of lifting it if open question 8 is answered yes; D-5 measures free text in its own probes; W-10's limit is stated where the PRD relies on it; the dissent bar comes from the baseline or v2's pre-May artifacts, not "non-zero". | G0; D-5; Risks |
| 4 | blocking | The arguable fixture is the Lucas critique by the letter | Sustained. It is now the contest control: scored on content, read against each model's own baseline at audition, automated only within a model, its answer key outside the public tree, retired after a persona edit that follows a failure, and out of G0 as open question 10. The "months" sentence is replaced with Summon's own throughput. | Part 5; G0; open questions |
| 5 | amend | A token seat satisfies W-10 | Sustained. W-11: a `wrote` event ties each `append` to the calling agent's `agent_id`, so in conversation only a verdict written from inside its lens's agent is corroborated; every rate reads the latest corroborated verdict; *Framed* catches a lens prompt that `prepare` did not build. The coordinator's view of its own absence report is now in the Goodhart risk. | Part 1, W-11; Risks |
| 6 | amend | H-7 enforces the split but doesn't test the hypothesis | Sustained. H-7 runs report-only first, measured against D-6's v2 base rate; the shortcut fixture (H-9) tests the hypothesis with a planted bug, outcome registered before the runs; "H-7 enforces; the shortcut fixture tests"; "unchanged" is struck, and the path check runs report-only in the bake-off. | Part 3, H-7, H-9; Success measures |
| 7 | amend | Link 4's stop doesn't fire on the August pattern | Sustained. *Silence* (unanimous approval with no finding above note severity) stops the order like *Echo*; empty-set overlap is defined; D-1 says it sees where lenses point, not why. | Part 5, D-1, D-4; statuses |
| 8 | amend | The need gate counts a lens skip toward a host that runs the review the same way | Sustained. Only an absent station seat counts. | Part 3 |
| 9 | amend | The voice probe can be tuned against | Sustained. A persona edit forced by a release is recorded against ADR-0015's trigger 3 and voids that release for G0's last condition; a voice that no casting can keep is an input to ADR-0012 F's revisit trigger; probe prompts are held out and rotated after every edit. | Part 2; G0; Risks |
| 10 | amend | More misquotes and overclaims | Sustained. "The post's own summary" is gone; the skip path marks the coordinator-writing step as inference and quotes what the post records for nesting; the calendar's case is restated; open question 9 says the post set one date and quotes Cherny. | Two-paths section; open questions |
| 11 | note | The injected line now has a documented scope | Adopted and verified: the delegation instruction comes only with the `claude_code` preset. The Why-now rows and the two-paths section cite it, and D-5 records the preset on every route. | Why now; two-paths section; D-5 |
| 12 | note | This review isn't independent evidence either | Adopted. The evidence paragraph says round 2's pointed briefs prime content and counts its findings as answers to the coordinator's questions. The clean sample Wei suggests, one lens given only the diff and the post, has not been run. | Two-paths section |

### Archie, round 2, verbatim

Archie: architecture review of commit 9888dd0 (W-10, H-7, H-8, D-5, phasing, gate)

PRD: /home/user/summon/docs/history/design/summon-live-prd.md. v3 sources were read from origin/claude/summon-team-v3-decomposed-jyiur2. Claude Code docs are in /tmp/claude-0/-home-user-summon/19f58b4c-ab90-5f99-8a34-13722f4112b6/scratchpad/.

The direction is right. Making a skipped seat an out-of-band fact (W-10) is the right instrument for link 2. Checking separation of duties by reading git instead of the harness (H-7) is the right move for portability, and as a script it fits ADR-0012 B's rule that a script wins over a hook. But three defects would produce false greens in P0 requirements, and H-8 claims more for the shell than it delivers.

Short answers to the five checks:
1. **W-10 hooks.** `UserPromptExpansion` carries enough (`command_name`, `command_args`). `PreToolUse` on `Skill` does fire, but its input fields are undocumented and it fires before the permission check. `Stop` works only if the wire reads `background_tasks`. `SessionEnd` is a 1.5 s hook that may be killed before it writes. Neither trigger fires on the dispatched path (findings 1–6).
2. **Where declarations live.** The party and the line already hold the seats. The harness's command names belong in the adapter. A new seat list is the wrong home (finding 4).
3. **events.json.** Yes, `expect` and `skip` need entries (finding 3).
4. **H-7.** It cannot be computed as specified on the Workflow host, and the re-run remedy launders the crossing. The claim refusal fits v3's claim logic with small changes. `write:src` can only be matched as a complement (findings 7–9).
5. **H-8.** All four doc claims hold as stated. What they add up to for the shell is overstated (finding 10).
6. **D-5 phasing.** Coherent, but the Phase 0 dispatched probe is vacuous. H-7 has no ADR row that can carry it in Phase 1 (findings 11–12).
7. **ADR conflicts.** See findings 4, 7, 9, 11 and 12.

---

**1. [Blocking] W-10 never writes `expect` on the dispatched path, so G0's "no seat skipped on the dispatched path" passes by construction.**
- **PRD:** 27, 198, 207, 506, 536, 557.
- **Sources:**
  - v3 `team/workflows/line.workflow.mjs` 42–44: each station is started by `agent(prompt, {agentType: st.seat})`.
  - v3 `team/workflows/review-wave.workflow.mjs` 83: each lens is started by `agent(reviewPrompt(l), …)`.
  - cc-hooks.md 1396–1402: `UserPromptExpansion` fires only for a command the user types. `PreToolUse` on `Skill` fires only when Claude calls the Skill tool.
- **Problem:** On the Workflow host, seats are started by a Workflow script. On the herdr host they are started by the `herdr agent prompt` text at line 384, which is a slash command only if Summon makes it one. Neither of W-10's triggers fires on that path. With no `expect` there can be no `skip`, so success measure 557 and G0 read zero whether or not a lens ran. That is the false green this revision exists to prevent.
- **Fix:**
  - On the dispatched path, the plan is the expectation, written out-of-band before any seat starts. `dispatch.mjs claim` writes `expect` for the station's seats (`by: dispatch`). `review-wave.mjs prepare` writes `expect` for the roster it computed from the diff.
  - Keep the hook triggers for the conversational path only.
  - Consider `PreToolUse` on `Workflow` as a third trigger. cc-hooks.md 1580 lists `Workflow` as matchable, though its input fields are also undocumented.
  - Add a dispatched-path fixture: a review station that starts four of five lenses must yield exactly one `skip`.

**2. [Amend] `Stop` closes a ceremony too early, and `SessionEnd` may never run the wire.**
- **PRD:** 198, 209, 251 (W-3's two-second timer), 220 (plugin install).
- **Sources:**
  - cc-hooks.md 2575–2600: `Stop` carries `background_tasks`, with `workflow` and `subagent` types, "to distinguish session is done from paused waiting for background work". `Stop` "does not run if the stoppage occurred due to a user interrupt".
  - cc-hooks.md 3389–3392: `SessionEnd` hooks share a 1.5 s budget, and timeouts set on plugin-provided hooks don't raise it.
  - cc-hooks.md 3732–3735: in `-p`, async hooks still running at teardown are killed. Their fate at an interactive exit is not documented.
- **Problems:**
  - A review running as a background workflow or background subagents is still in flight at the turn's `Stop`. Every lens that hasn't started yet gets a false `skip`. That contaminates the Phase 0 baseline of conversational skips (536) and the *Seat skipped* status.
  - An interrupted ceremony leaves its `expect` open, because no `Stop` fires.
  - On `SessionEnd`, the wire's 2 s timer exceeds the 1.5 s budget. The PRD's preferred plugin install can't raise that budget, and `-p`/SDK runs kill async hooks. So the skips of multi-turn ceremonies are the ones most likely to be lost, and silently, because W-3 forbids output.
- **Fix:**
  - At `Stop`, write skips only when `background_tasks` holds no `workflow` or `subagent` entry; otherwise leave the `expect` open.
  - Run the `SessionEnd` handler synchronously with a timeout under the budget, wired via `--settings` (which can raise it).
  - Make `skip` derivable: W-4's `corroborate` computes "declared, never started" from `expect`, `start`, and the session's last `stop`, so a written `skip` is a cache, not the only record.
  - The declaration must state whether the ceremony closes at `Stop` or at `SessionEnd`. Line 198 assumes the wire knows, but nothing declares it.

**3. [Amend] `expect` and `skip` must be in team/events.json, and a skip's `seat` must not be the persona.**
- **PRD:** 185, 232, 249, 468.
- **Sources:**
  - v3 `scripts/team-log.mjs` 55–65 and 88–90: `validateEvent` rejects any event not in `schema.events`, and `appendEvent` throws.
  - v3 `team/events.json`: `common` is `[t, seat, event]`.
- **Problem:** Line 232's "Semantic events in team/events.json, plus … expect, skip" reads as if these sit outside the schema. In v3, such an append throws. Because the wire is silent (W-3), a rejected `skip` vanishes without a trace, which is the worst failure for a skip detector.
- **Fix:**
  - Add `expect` (required: `ceremony`, `seats`; optional: `item`, `session`, `prompt`, `closes`) and `skip` (required: `ceremony`, `missing`; optional: `item`, `session`).
  - Set `seat` on both to a reserved writer name, with the absent seat in `missing`. `render` groups by seat instance, so this keeps the status off the persona, as line 468 requires.
  - The conversational path usually has no `SUMMON_ITEM`, so "the ceremony's item" (198) needs a fallback key: `session_id` plus `prompt_id` (cc-hooks.md 724–735).
  - Add to W-10's acceptance that the wire's lines validate under check-canon.

**4. [Amend] Seat declarations already have homes in ADR-0015's layers. A new seat list would drift, and a seat could edit it.**
- **PRD:** 198 ("a canon file the composer reads"), 220, 222, 532.
- **Sources:**
  - ADR-0015 § Composition: the party names a formation's floor and conditional lenses; the line names stations bound to seats.
  - v3 team-layers.md 216–217: "who reviews what … the party"; "which seat works which station … the line".
  - ADR-0012 C: the roster is "computed from the diff by the script"; "omissions are deliberate".
  - v3 review-wave.mjs 77–94: `prepare` records each conditional lens it did not apply.
- **Problems:**
  - A third list of review lenses duplicates the formation and goes stale when the formation changes.
  - A static list can only name the floor. It either expects every conditional (false skips) or none (missed skips).
  - If the wire reads the declarations from the seat's worktree at hook time, a coder seat can declare zero seats. The file is not on W-9's `check --line` list (222).
- **Fix:**
  - Seats stay where they are: the party's formation, the line's stations, and C-12's gate line for author and challenger.
  - The new data are (a) a portable ceremony → formation/line binding in the party, and (b) the harness's names for each ceremony in the adapter, because they are fitted. That covers `command_name`, the Skill tool's name, and plugin-scoped names such as `summon:review`.
  - The composer compiles both into an expectations table. The wire reads it from its pinned location, hashed into the manifest (W-7).
  - This also avoids adding a layer before ratification, which matters because Phase 0 precedes ratification (532).

**5. [Amend] The model-invoked trigger rests on undocumented fields and fires before permission.**
- **PRD:** 207.
- **Sources:**
  - cc-hooks.md 1594–1800: the reference documents `tool_input` for Bash, Write, Edit, Read, Glob, Grep, WebFetch, WebSearch, Agent, AskUserQuestion and ExitPlanMode. It does not document Skill or Workflow.
  - `PreToolUse` runs before the call is allowed.
  - cc-hooks.md 861: a `UserPromptExpansion` hook can block the expansion.
- **Problem:** A Skill call refused by a deny rule, the user, or another hook still yields an `expect`, and then a false skip for every declared seat.
- **Fix:**
  - Take the model path from `PostToolUse` on `Skill`, and drop the `expect` on `PermissionDenied` or `PostToolUseFailure`.
  - Put the Skill tool's input field name in the adapter, with an ADR-0012 E registry entry and a `doctor` probe. Then a renamed field shows as a failed probe, not as zero skips (see finding 11).

**6. [Amend] It is undocumented whether `SubagentStart` fires for agents a Workflow script spawns. W-10's no-skip fixture depends on it.**
- **PRD:** 196, 208, 258.
- **Sources:**
  - cc-hooks.md 2382–2384: `SubagentStart` runs "when Claude spawns a subagent with the Agent tool", when it resumes one, and for agent-team teammates. Workflow-spawned agents are not listed.
  - cc-hooks.md 2590: `background_tasks` types `workflow` separately from `subagent`.
- **Problem:** Every lens is Workflow-spawned (review-wave.workflow.mjs 83). If they don't fire `SubagentStart`, every lens yields a false `skip`. W-2 and W-10's recorded-payload fixtures cannot detect this.
- **Fix:** Make a live probe a Phase 0 entry criterion: one Workflow agent with an `agentType`, checking that `start` and `stop` are observed. Register it under ADR-0012 E and name the fallback. This also touches W-4, which I'm not re-reviewing; W-10 inherits it.

**7. [Blocking] H-7 cannot compute "the paths a station changed" on the Workflow host, where it ships first.**
- **PRD:** 397, 421, 537.
- **Sources (v3 unless noted):**
  - `scripts/dispatch.mjs` 162–165: `open` runs `git worktree add --detach` at one head.
  - `scripts/dispatch.mjs` 212–240: the claim event has no tree.
  - `scripts/dispatch.mjs` 256: the only commands are plan, open and claim; nothing runs at return.
  - `scripts/run-checks.mjs` 37–40: `treeState` is `{head, dirty}` with `dirty` a boolean, which cannot reproduce a dirty tree.
  - `team/workflows/line.workflow.mjs` 31–33: the seat's own shell runs `dispatch.mjs claim` as its first command.
  - `team/workflows/line.workflow.mjs` 43: under worktree isolation, the Workflow tool's `agent()` gets its own harness worktree, not `.summon/worktrees/<instance>`.
  - `team/workflows/line.workflow.mjs` 14: "a workflow has no filesystem".
  - `team/events.json`: `check` has no `station` or `instance` field.
- **Problems:**
  - With isolation none, as in the first run, every item shares one tree. The adapter allows concurrency of 10, so a tester's diff includes another item's coder's source edits. The result is false failures, and crossings attributed to the wrong station.
  - With worktree isolation, the edits sit in a harness worktree the dispatcher didn't create. The coder never gets the tester's commit until H-4, which is Phase 3.
  - There is no "when a station returns" step on this host. The refusal is an exit code handed to a model. That is ADR-0012's drift-not-adversary boundary, so "refused" overstates it here.
- **Fix:**
  - At each claim, record a reproducible snapshot as an object id, never a ref: `GIT_INDEX_FILE=<tmp> git add -A && git write-tree`. Sandboxed seats in a linked worktree can write the shared `.git` refs (cc-sandbox.md 525).
  - Diff with `git diff-tree -r --no-renames --name-only`, so a rename out of a test path shows both sides. Untracked files come in through the temporary index. State that gitignored paths are invisible.
  - Run the boundary check inside the next `claim`, plus a `dispatch.mjs handoff` command the herdr dispatcher calls.
  - Extend `returnedStations` so a station counts as returned only when its latest boundary check passed. This fits v3's read-decide-append claim in a few lines.
  - Add `tree` to `claim`, and `station`/`instance` to `check`.
  - Have `plan` refuse an H-7 line under isolation none with more than one item in flight, or pull H-4's per-item branches into Phase 1.
  - Add a fixture with two items in parallel.

**8. [Blocking] Re-running the station launders the crossing.**
- **PRD:** 397 ("between the tree recorded at its claim and the tree at its return"; "until the station re-runs inside its boundary"), 560.
- **Source:** v3 dispatch.mjs 225–235: a same-instance re-claim of a station is allowed, because only `order` and `distinct-instance` are checked.
- **Problem:** A re-run's claim tree already contains the offending edit. A re-run that changes nothing therefore passes, and the next station builds on the crossing. Measure 560 counts exactly that case as zero.
- **Fix:**
  - Fix the diff's base per item and station: the previous station's hand-off tree, or the order's head for the first station. Never use the latest claim's tree.
  - On the herdr host, reset to that base before a re-run.
  - Add a fixture: the coder edits a test, fails, re-claims, and returns with no change. The result must still be a failure.

**9. [Amend] `write:src` is a complement, and H-7 matches against globs in a fitted, Claude-specific file.**
- **PRD:** 397, 405, 421.
- **Sources:**
  - `team/harness/claude-code.json` `paths`: write:tests, write:docs and write:infra only; no write:src.
  - ADR-0015 § Harness adapter: the adapter is "the only file allowed to be fitted", and its two-adapter test varies "every fitted value".
- **Problems:**
  - The tester's must-not can only be matched as "changed, in no declared class, and not under `.summon/`". That flags a `package.json` test script or a `vitest.config.ts`.
  - Which files are tests is a fact about the project, not the harness. Yet H-7, which claims to run unchanged on a Codex bake-off, reads it from `claude-code.json`.
  - The default globs miss `*.spec.ts`, `foo_test.go`, and `test_foo.py` outside `tests/`. A coder editing `foo.spec.ts` passes, and a tester editing it fails.
- **Fix:**
  - Move `paths` into a portable per-project binding beside `team/checks.json`. H-7, H-8 and the composer all read it from there.
  - Define write:src as the complement in team-layers.md.
  - Widen the default globs.
  - State that tests inside source files (Rust `mod tests`) cannot be separated by path.

**10. [Amend] H-8 overstates the shell layer.**
- **PRD:** 399, 422, 539.
- **What holds (each claim checked against the saved docs):**
  - Deny rules apply in every mode, including `bypassPermissions` (cc-permmodes.md 30).
  - `Edit` allow and deny rules are copied into `allowWrite`/`denyWrite` (cc-settingsref.md 1929; cc-sandbox.md 649, 655).
  - On Linux and WSL2, write entries containing `*`, `?` or `[` are skipped, and this includes `Edit` rules (cc-settingsref.md 1951).
  - `dontAsk` refuses a file-tool edit that no allow rule covers (cc-permmodes.md 549).
- **What is overstated:**
  - The sandbox can already write the whole working directory by default (cc-sandbox.md 31, 246, 522). `Edit` allow rules only add to `allowWrite`.
  - So the tester's allow rules narrow the file tools and nothing else. Sandboxed Bash runs without approval (`autoAllowBashIfSandboxed` defaults to true, cc-sandbox.md 381), so it still runs under `dontAsk` and can write any source file, on every OS, not just Linux. Running the test suite also executes project code.
  - On Linux, every write:tests glob (`**/*.test.*`, `**/test/**`, `**/tests/**`, `**/__tests__/**`) still contains `*` once the trailing `/**` is stripped. So the coder's shell is stopped at no test path at all, not only at "test files that sit beside the source".
- **Fix:**
  - State it plainly: H-8 blocks the file tools. On the shell it covers only the coder's boundary, and only on macOS, or on Linux where the composer expands globs into concrete directories at seat start (new directories escape). It never covers the tester's complement.
  - Have `doctor` compute the level per tool and per OS, as ADR-0015 already does for install-dependent levels.
  - In the acceptance test, add a shell write by each seat, and `Write` and `NotebookEdit` cases. The saved docs confirm `Edit` rules cover Edit and Write (cc-settingsref.md 1567), but I found nothing covering NotebookEdit.

**11. [Amend] D-5's phasing is coherent, but its skip half needs a planted positive, and its fixture reading reopens the 2026-09-10 decision.**
- **PRD:** 27, 506–508, 536–537.
- **Phasing:** "0 for skips; 1 in full" lines up with W-10 in Phase 0, and with C-8, D-1 and the arguable fixture in Phase 1.
- **Problems:**
  - The Phase 0 dispatched probe is vacuous until finding 1 is fixed.
  - A skip count of zero after a Claude Code release cannot tell "no seat skipped" from "the wire went blind".
  - Line 508 says the fixture "does not reopen that decision", then reads a failure "under ADR-0015's reversal trigger 1". The human took option 2 (v3 docs/history/tracking/2026-09-10-first-runs.md 33). Trigger 1 now keys only on presence and on spread over ten real items (ADR-0015 97). Feeding the declined option 3 into it amends the trigger.
- **Fix:**
  - Each D-5 run plants one skip per path, which must yield exactly one `skip`.
  - Either put the trigger-1 reading to the human in the ADR-0015 fold-in, or reword it: the fixture is a G0 condition and evidence the human weighs, not a trigger input.

**12. [Amend] Gate table: no ADR can carry H-7 in Phase 1, and W-10's declarations and D-5's trigger reading need rows.**
- **PRD:** 537, 539, 564–575.
- **Problem:** H-7 changes several things ADR-0015 owns:
  - the claim semantics;
  - the event schema;
  - the enforcement report: ADR-0015 reserves its third level, `hook`, for a hook composed from `paths`, and the PRD adds hand-off and permission-rule levels instead;
  - where `paths` lives (finding 9).

  The only candidate row, "Host adapters", is "opened only with the need-gate record" and serves Phase 3. H-7 is P0 in Phase 1.
- **Fix:**
  - Extend the ADR-0015 fold-in row with H-7, the ceremony binding (finding 4), and the trigger-1 decision (finding 11).
  - Name `expect` and `skip` in the wire ADR's row.
  - H-8 fits the host-adapters ADR, which should record that it fills the reserved level with permission rules rather than a hook.
  - D-5's voice half fits the casting ADR.
  - Under ADR-0012 E, H-7's script and H-8's composed settings are enforcement adapters too. Each needs a registry entry with its canon source and minimum versions (`dontAsk`, the `Edit`→sandbox merge, `Stop`'s `background_tasks`), not only the wire.

**13. [Note] "skip" already means something else in v3.**
- **Source:** v3 review-wave.mjs 77–94 and review-wave.workflow.mjs 101: `skipped` lists conditional lenses deliberately not applied, each with a reason.
- **Problem:** W-10's `skip` is a fault. One word with two meanings in one ledger and one renderer is what the glossary rule exists to stop.
- **Fix:** Rename one of them (for example, `absent` for the event, or `not-applied` for the conditionals). W-10 then treats a not-applied lens as not expected.

Sentinel as returned: 13 findings (3 blocking, 9 amend, 1 note).

### Wei, round 2, verbatim

Wei's review of the 9888dd0 revision to /home/user/summon/docs/history/design/summon-live-prd.md

Other sources I read: the post (/tmp/claude-0/-home-user-summon/19f58b4c-ab90-5f99-8a34-13722f4112b6/scratchpad/post-i-killed-my-agent-team.md), the first-runs doc (.../scratchpad/v3/docs/history/tracking/2026-09-10-first-runs.md, lines 25-36), and ADR-0015 (.../scratchpad/v3/docs/adrs/meta/0015-decomposed-team.md, line 30 and reversal triggers 93-101). I also read PRD lines 84, 194, 321-325, 462-475 and 687 because findings needed them, and fetched the public *Prompting Claude Opus 5* guide to check the citation.

My gut said this before I had a reason for it: a July 24 cause is being asked to explain a decline the author dates to May 15. The reasons follow.

---

**1. The chain is fitted to the last fortnight. "More than one way in" names the gap but doesn't close it. Blocking.** Lines 21, 102, 104, 113, 614.
- Line 21 says the post "traces all three to one change underneath the team." The post doesn't say that. It says "Three things, inside about a fortnight": the model guidance, the harness caps and nesting, and the injected line. It gives a second mechanism that involves no skip at all: fitted dissent decaying "when the model underneath became more capable." And it names the harness, not the line, as "the axis that killed my team."
- The line is a step change on July 24. The post describes a slow ramp: first the voices flattened, then the disputes thinned, then everything went unanimous. The last real dissent was May 15. A step can't cause a ramp that started ten weeks before it. Line 104 says the symptoms were seen "in the order they become visible, which is not the order they happen." That reconciles any order with any cause, which makes it unfalsifiable.
- Line 113 offers three causes for the gap, but two of them are July events. 2.1.217 falls inside the PRD's own "July to August" range (line 75). The post ties fitted decay to the more capable model, which means Opus 5. The third cause, Opus 4.8 under-reaching, isn't in the post (line 687 sources it to the claude-api skill's migration notes) and has no date. The public Opus 5 guide treats 4.8 as the direct predecessor ("performs well out of the box on existing Claude Opus 4.8 prompts"). If 4.8 was the model in May, its under-reach was there during May's three-way split and can't explain the onset by itself. So at most one of the three causes fits the window, and only if 4.8 shipped near May 15.
- Two readings are missing. One is the post's own strongest case: the model got better, so there was less to contest. The other is artifact survivorship: the post dates the last review *artifact* with real dissent, and a missing artifact doesn't prove dissent stopped.
- The concession never reaches the rest of the document. The Summary, the section title, line 113's "the line that silenced the team", and line 614's Medium rating all still read as one cause.
- Fix:
  - Rewrite line 21 to match the post: three changes in a fortnight, two mechanisms, and an onset ten weeks earlier that nothing explains.
  - Present the problem as two paths to one symptom: a skip path (links 1-3) and a decay path (spawned seats converging). Fitted decay should stop being link 4 of the skip chain.
  - Give 4.8's ship date or cut the claim.
  - Add a cheap forensic task to Phase 0. Go through v2's review artifacts week by week from April to August: count verdict splits, and check whether each lens's text came from its own run. If the human's local transcripts survived the harness's cleanup, also count subagent spawns per review session. Spawns steady through July with voices already flat means the decay path leads. Spawns falling before July 24 means there is a pre-line skip mechanism to name.

**2. "Voice is the earliest sensor" contradicts the section's own thesis, and that answers the August question. Blocking.** Lines 104, 110, 115, 506; also 323, 462, 474.
- The thesis (lines 102 and 110) is that voices flattened because seats weren't spawned and one context wrote every lens. But C-8 spawns the seat itself, on synthetic prompts, with and without the persona (line 323). Under the thesis, every probed persona speaks fine once spawned, so C-8 passes while production voices are flat.
- D-5's voice readout covers "each persona that ran" (line 506). On a conversational run where seats were skipped, that is nobody, so the readout comes back empty rather than failed.
- V-4's *Voice drift (judged)* does read recent outputs (line 474), but it is shown on the seat, and line 462 says no badge blames a seat "for something the process did." Either it excludes text the coordinator wrote under the seat's name, and then it can't see this mechanism, or it includes that text and blames the seat for the coordinator's writing.
- So the PRD can't have both claims. If the thesis holds, W-10 fires first and C-8 never fires. If C-8 fires first, the thesis was wrong for that window.
- Q2, directly:
  - Something fires before August, but only in late July. The first instrument with evidence behind it is W-10's skip on D-5's conversational run. That run would come on the 2.1.217 release if the review fanned out from a nested subagent, and on Opus 5's release day at the latest. That is about ten weeks after the last real dissent, and after the voices had already gone.
  - Between May 15 and mid-July, nothing this revision adds has evidence that it would fire, because the PRD has no mechanism for that window. If the cause was spawned seats converging, I'd name the arguable fixture on D-5's calendar or harness-release runs (see 4).
  - The instrument that fires whatever the mechanism is the one the post itself names, "disagreement rate, trending to zero." v3 already has it; this revision inherits it rather than adding it.
- The post's voice signal wasn't missed for lack of a sensor: "I noticed, and filed it as cosmetic." That was a failure to interpret, and in this PRD *Voice drift* is still a label with nothing attached to it.
- Fix:
  - Drop "earliest", or earn it by making any C-8 failure or *Voice drift* trigger an immediate D-5 run. Then the cheap signal starts the instrument that can tell a skip from decay.
  - Measure voice where the human actually saw it go. On one real item in N, re-run a lens on the same composed prompt with and without its persona, and compare both against the lens text in the ledger. If the ledger text is closer to the bare run, raise a notice on the item, not the seat.

**3. The conversational path: G0 doesn't gate it, and W-10 can't see its most common form. Blocking.** Lines 27, 121, 198, 557-558, 612, 627.
- G0 requires "no seat skipped on the dispatched path." Conversational skips are only "reported" (line 558). Yet the one skip the post records happened in a conversational session, line 74 says the README sells the gate conversationally, and line 121 admits that path stays exposed. Under G0 as written, the notice can come down while the recorded failure is still live on the path the README sells. The post calls itself the notice "because no other channel reaches" template copiers. Removing it tells those copiers the team works.
- W-10 writes `expect` only when a ceremony starts, "typed by the human or invoked by the model" (line 198). Line 121's own example is a human typing "review this." That starts no ceremony unless the model chooses to invoke one, and that choice is exactly what the injected line governs. No ceremony means no `expect` and no `skip`, so the record is empty rather than wrong. That means neither "visible the same day" (line 121) nor the mitigation for the High-rated risk at line 612 holds for the PRD's own example.
- Fix:
  - Either give G0 a conversational bar, set before the run from the Phase 0 baseline, with D-5 exercising the free-text request and not only the slash command. Or make G0 conditional on a yes to OQ8 and narrow the notice instead of removing it: seat-declaring ceremonies run as work orders, and the conversational path is flagged, not fixed.
  - Have lines 121 and 612 say that W-10 sees only declared ceremonies.
  - Also, G0's "non-zero over ten real items" passes on a single split. Set that bar from the baseline, or from v2's pre-May artifacts.

**4. The arguable fixture is the Lucas critique by the letter, and "held out" answers a different critique. Blocking.** Lines 27, 506, 508, 559, 613.
- Lucas says a relation fitted under one regime can't evaluate a change of regime. "On this diff, a healthy team splits at rate r" is fitted to the models and personas it was written against, and D-5 runs it on model release day, which is the regime change. Holding a fixture out guards against tuning to the test (Goodhart). It does nothing when the regime shifts.
- The vendor's guide supplies the mechanism: Opus 5 "finds real bugs at a high rate per pass, and its additional findings are mostly real issues." Better reviewers converge, so a model that resolves the trade-off correctly reads as decay. The post already names this trap: absorbed and broke "produce the same symptom ... the only way to tell them apart is to look."
- It isn't really held out anyway. Personas get reviewed edits for model fit (lines 30 and 325), made by someone who has read the last D-5 report. And the repo is public, so the fixture and its expected split become training data.
- I checked the citation. As amended on 2026-09-10, ADR-0015 trigger 1 fires only on a negative-control miss, or on `dissent --last 10 --exclude negative-control` reading zero over ten real items. It also says "unanimity on a fixture built to be caught by every lens is not the signal." Nothing in it can trip on a fixture that fails to split. Reading a failure "under trigger 1" (lines 508 and 613) means amending wording the human settled on 2026-09-10. So the fixture does reopen that decision: it is option 3, which the human didn't take, promoted to a G0 condition.
- "By the post's own timeline can take months": the post's timeline describes the lag from not looking. In the post, the rate "was sitting in my own review artifacts the whole time" and the reviewer ran "over every diff before I was allowed to commit." Ten items is slow on Summon's current throughput (two of ten in the first run), not on the post's.
- The fixture's real case, which the PRD doesn't make, is as a control that separates "nothing to contest" from "can't contest." That holds within one model's regime: calendar and harness-release runs, which is exactly where a server-side line or a May-to-July drift would show up.
- Fix:
  - Score the fixture on content, the way the human chose for the negative control: each floor lens must surface its own true point, recorded before the runs, and the lenses' findings must differ in what they find and why. Report verdicts as information.
  - Set the split baseline per model at audition, with the human reading it, and apply the automated bar only within that model.
  - Burn and replace the fixture from a pool after any persona edit that follows a failure, and keep the answer key out of the public tree.
  - Put the fixture to the human as an open question, and keep it out of G0 until answered.

**5. A token seat satisfies W-10, and corroboration closes only one of three ways to do it. Amend.** Lines 29, 109, 194, 258, 608.
W-10 checks only for a `start`. Corroboration only checks that start and stop events bracket the verdict, and line 194 says "'Who wrote the line' never decides it." Three ways through:
- **Anchored seat.** The coordinator reviews in its own context, then spawns each lens with its findings in the prompt ("confirm from the security angle"). The seat files them inside its own bracket. There's no skip, the verdict is corroborated, and the voice is the coordinator's. This takes no malice. It's the compromise a model reaches when CLAUDE.md says spawn and the guide's own sample delegation instruction says "do not use subagents to verify or double-check your own work." C-11 covers only prompts the dispatcher composes.
- **Timed write.** A background seat runs, and the coordinator writes that lens's verdict while it runs. If the verdict names the instance, it falls inside the bracket and counts as corroborated. Nothing I read prevents that.
- **Superseding verdict.** The seat files, then the coordinator files a later verdict for the same lens. The later one is uncorroborated, but the rate reads "the latest verdict per lens per item" (first-runs, line 29), so the coordinator's verdict is the one counted.

Corroboration closes the third way only if every rate reads the latest *corroborated* verdict, and the PRD doesn't say that. It closes neither of the other two. Also, W-10 measures the coordinator, and the coordinator sees the skip report; line 608's "seats never see the meter" doesn't cover that.
- Fix:
  - Add a W-10 fixture in which a token seat starts and stops while the coordinator writes its verdict. That verdict must not come out corroborated.
  - Have the wire record a digest of each declared lens's spawn prompt (PreToolUse on the agent tool) and raise *Framed* when the prompt isn't the composer's spec-plus-diff prompt. That is C-11 enforced by a hook.
  - Tie corroboration to the seat's own process wherever the hook payload identifies the calling agent. Where it can't, say that corroboration isn't available on the conversational path.
  - Make every rate read the latest corroborated verdict.

**6. H-7 enforces the split; it doesn't test the post's hypothesis. Amend.** Lines 119, 395-397, 405, 421, 560.
- The acceptance criterion (line 421) only tests that the check fires. The success measure, "crossed ... and were built on: zero" (line 560), is zero by construction whenever H-7 is installed. The number that matters for the hypothesis is how often a station tries to cross a boundary, and nothing measures it.
- There is a natural experiment nobody has looked at. ADR-0015 line 30 shows the v2 boundary was prose all year, and the post credits that year's boundary with "structurally" removing the failure mode. Either prose was enough on those models, or crossings happened and nobody saw them. `git log` over v2 and the human's trading-system repo would show which. The guide's "effective writer-verifier patterns" is the redundancy branch again, also unmeasured.
- A path check isn't a weakening check. The realistic wrong implementation that passes H-7 makes a failing test pass without touching a test path: a test-environment branch in source, a loosened assertion helper under `src/`, or a snapshot outside the `must-not` globs.
- Line 405 says H-7 "runs there unchanged" in the human's bake-off. But that bake-off runs skills on Codex, with no claims or returns for H-7 to check. And if H-7 refused crossings there, the split would hold by fiat, which answers a different question than the post asks. The post says of the enforcement layer, "I'm suspicious of anyone who currently claims to" know its shape.
- Fix:
  - Give H-7 a report-only mode and run that first.
  - Measure v2's base rate of crossings from git.
  - Add a planted shortcut fixture: a failing test that is cheaper to weaken than to satisfy. Run it with H-7 refusing and in report-only mode, and set the outcome before the runs: does the final suite still catch the planted bug (a mutation check)?
  - Reword line 119 to "H-7 enforces; the shortcut fixture tests."
  - Strike "unchanged" at line 405, or say H-7 runs there report-only.

**7. Link 4's "stops the work" doesn't fire on the August pattern. Amend.** Lines 111, 502, 505; also 466.
- D-4 needs a window that is both unanimous and overlapping. The post's August was "one verdict for everything: approved ... no findings that stung." Thin findings, with each lens nitpicking its own corner, give low overlap, which D-1 calls "agreement worth having."
- With no findings at all, overlap is 0/0, and the PRD doesn't say how that rounds.
- D-1 is keyed on file and line window, so it sees where lenses point, not why. Depending on the threshold, which isn't set, the first-run case could even read as *Echo*.
- Fix: add a *Silent* class (unanimous approval with no finding above note severity, or no findings at all) that stops the order the way *Echo* does. Define what empty-set overlap means, and reword line 111 to match what D-4 actually catches.

**8. The need gate counts a review-lens skip toward a host that runs the review the same way. Amend.** Lines 364, 389.
- Line 364 counts a Workflow-host skip as need, "because a seat the dispatcher starts as its own process is one that no model decided to spawn."
- But line 389 keeps the review formation inside one pane, running the same review-wave workflow. A skipped lens would recur on herdr under the same caps (line 75: an advisory default of under 10 agents, against the 45 the first run used). Lens skips are also the kind D-5 is most likely to find.
- Fix: count only skipped station seats toward the need gate, or run the five floor lenses as their own panes on herdr.

**9. The revision protects the fixture from tuning but allows tuning against the voice probe. Amend.** Lines 27, 30, 556; also 325.
- G0 requires every persona to be distinguishable from its bare seat, and lines 30 and 325 allow a reviewed persona edit to keep the voice. So the probe fails, the persona is edited, the probe passes, and G0 is satisfied. That is refitting the curve, and the post is explicit that "Lucas's remedy went deeper than refitting the curve more often." The probe has no held-out rule at all.
- The PRD also handles a persona failure two different ways: the fixture failure goes to trigger 1, whose remedy is to re-argue the skills-only alternative, while a probe failure gets an edit.
- Fix:
  - Make a voice failure that no casting can fix an input to ADR-0012 F's revisit trigger (line 323 already says the probe is that trigger's measurement), not a G0 condition an edit can satisfy.
  - If voice edits stay, hold the probe prompts out and rotate them after each edit.
  - State whether a persona edit forced by a model release trips G0's last condition and ADR-0015 trigger 3. I couldn't tell from what I read.

**10. More misquotes and overclaims of the post. Amend.** Lines 102, 109-110, 113, 628. (Line 21 is covered in 1, line 508 in 4.)
- Line 102 calls one mid-paragraph sentence "the post's own summary." The post's summary-level claims are the fitted-curve thesis and "disagreement rate, trending to zero."
- Links 2-3 (lines 109-110), where the coordinator writes the review and labels the parts by lens, aren't in the post. "One careful, forgettable author" is a simile. The only skip the post records is a deprecation session working solo, not a review ceremony. For nesting, the post records a different failure: "manually approving something that used to just run." Label these links as inference.
- Line 113 and OQ9 say the line "arrived from a server with no release to trigger a check." Line 102 has it arriving on Opus 5's release day, in Opus 5 sessions only, so a model-release run would have caught its arrival. The honest case for a calendar is that a server-gated line can change between releases, and that a May-to-July drift had no release at all.
- OQ9 says "the post's own audit runs every six months." The post sets one date six months out. The recurring six-month rule is Cherny's advice, which the post quotes.

**11. The injected line now has a documented scope. Use it. Note.** Lines 76, 84, 102, 108.
- The guide now says Claude Code adds its delegation instruction on Opus 5 "only when you use its `claude_code` system prompt preset." Line 84 cites the guide but not this condition, and line 102 repeats the post's "no opt-out."
- Fix: have D-5 record which preset each path ran under, and check whether the dispatcher can launch seats without the preset. If it can, link 1 on the dispatched path is closed by configuration as well as by script.

**12. This review isn't independent evidence either. Note.** Line 117.
- Line 117 discounts the first round because its briefs primed format. This round's brief primes content: six pointed questions aimed at the revision's weak spots. That is exactly the framing C-11 keeps out of a lens prompt.
- Count these findings as the coordinator's questions answered, not as contest. For a clean sample, run one lens with only the diff and the post.

---

**The six questions, briefly.**
1. Yes. The chain is fitted to the last fortnight, and the "more than one way in" paragraph names the gap and then papers over it (finding 1).
2. W-10, via D-5, fires in late July at the earliest, about ten weeks late. Nothing this revision adds has evidence that it would fire between May 15 and mid-July. Under the PRD's own thesis, the voice probe never fires first (finding 2).
3. Yes, across a model release: holding it out answers Goodhart, not Lucas. The fixture is valid within one model's regime and should be scored on content (finding 4).
4. Yes, in three ways, plus the case where no ceremony starts at all. Corroboration closes one of them, and only if every rate reads corroborated verdicts (findings 5 and 3).
5. H-7 only asserts that enforcement works. It doesn't test the hypothesis, and in refuse mode it would confound the human's bake-off (finding 6).
6. Yes, at lines 21, 102, 109-110, 113, 508 and 628 (findings 1, 4 and 10).

**What holds.** Putting an instrument on every link instead of a fix on the first is the right design, and it survives every objection above. The problem is the story told around it. "What this does not fix" (line 121) is the most honest paragraph in the revision; it only needs the W-10 limit added. C-12 and leaning yes on OQ8 are what actually break link 1 rather than just watch it. H-7 reads git, which is the right layer; it's mislabelled, not misbuilt. And D-5 on a calendar is right, for a better reason than the one the PRD gives.

**Assessment.** The direction is sound, but the diagnosis is overfitted. Two instruments measure the wrong variable or work across the wrong boundary: the voice probe can't see ventriloquism, and the fixture is fragile at model releases. The post's recorded failure lives on the conversational path, and G0 lets the notice come down without it. Fix 1-4 and this is a credible answer to the post. Without those fixes, it reads as an answer to the post's last two weeks.

Sentinel as returned: 12 findings (4 blocking, 6 amend, 2 note).
