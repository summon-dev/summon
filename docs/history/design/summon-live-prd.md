---
agent-notes: { ctx: "PRD: live seats, model casting, herdr host, visual world", deps: [README.md, docs/adrs/meta/0005-behavioral-benchmark.md, docs/adrs/meta/0006-multi-runtime-install.md, docs/adrs/meta/0012-executable-canon.md, docs/adrs/meta/0014-optional-addons.md, docs/adrs/0013-design-authority.md, docs/process/team-governance.md, docs/history/design/team-hero-sprites-16bit.md, docs/history/tracking/2026-10-05-summon-live-prd-review.md, site/src/components/TeamGrid.astro], state: draft, last: "claude@2026-10-05", key: ["builds on ADR-0015 (Proposed) on branch claude/summon-team-v3-decomposed-jyiur2, issue #138", "revised after a five-persona review (46 findings, 12 blocking); G0 is the condition for lifting the deprecation notice", "answers why the team was stopped: skipped seats, flattened voices, and unanimity read as one chain, with an instrument on every link (W-10, C-8, D-1, D-5) and maker-checker enforced at hand-off (H-7)", "spec only: ADRs and an Architecture Gate come before any code; ADR-0012 E and Pierrot's threat-model pass gate Phase 0"] }
---

# Summon Live

**Product requirements document.** Revised draft for the human's review, 2026-10-05.

| | |
|---|---|
| Owner | Pat (scope, acceptance). Archie owns the ADRs this PRD asks for. |
| Drafted by | The coordinator, at the human's request, on `claude/multi-agent-coding-improvements-ip34gt` |
| Reviewed | 2026-10-05 by Wei, Pierrot, Pat, Archie, and Dani as standalone agents: 46 findings, 12 blocking, all dispositioned in `docs/history/tracking/2026-10-05-summon-live-prd-review.md` |
| Author's input | 2026-10-05: the team was stopped because the agents lost their voices: personas stopped speaking, agents were skipped, and reviewers agreed instead of contesting. The section *The three symptoms are one chain* answers that directly. |
| Builds on | ADR-0015, *The Decomposed Team* (Proposed, 2026-09-09), on branch `claude/summon-team-v3-decomposed-jyiur2`, epic #138 |
| Zone | Meta (ADR-0007 § 1). This is about building Summon; each asset it proposes is classified on its own in the Architecture Gate section. |
| Decides | Nothing yet. Every part that changes architecture needs an ADR and an Architecture Gate before code. |

## Summary

Summon was stopped because its agents lost their voices: personas stopped speaking, agents were skipped, and reviewers agreed with each other instead of contesting. *I Killed My Agent Team* (2026-08-15) traces all three to one change underneath the team, and this PRD treats them as one chain with four links, each of which it either breaks or makes visible (see *The three symptoms are one chain*).

Summon v3 split the fused agent file into a role, a persona, a skin, and a fitted harness adapter, and gave the team an event log that no harness owns. That answered the structural half of the August deprecation. The operational half is still open: every seat runs on `model: inherit`, the record of what the team did is mostly the seats' own account of themselves, and nobody sees the team while it works, so dissent can decay with no one watching.

Summon Live is four additions on top of v3, ordered so each is useful without the ones after it, and one goal that says when they are enough.

**G0. The deprecation notice can come down.** It comes down when, on the current model, the cascade audit (D-5) finds no expected seat absent on the dispatched path while catching the absence it plants on each path, every persona it exercises distinguishable from the same seat run without its persona, and verdicts that split on its arguable fixture; the review formation passes the negative control on presence; dissent is non-zero over a full window of ten real items; content divergence is reported for every item; and one model release has landed with changes only in fitted files.

1. **The wire.** Hooks and scripts write *out-of-band* events (who started, who stopped, which model actually ran) into the log beside the seats' own *testimony*, and every event says who wrote it. A verdict is *corroborated* only when out-of-band events bracket the same seat, item, and lens. A review that never ran stops passing as a completed one (#129). None of this is proof, and the PRD says where it stops holding.
2. **Casting.** One model with effort set per station is the default. A fitted casting file holds it, expires on every model release, and changes only when the human promotes a casting that an audition did not block. A recast never edits a persona; when a new model needs a persona change to keep its voice, that is its own reviewed edit.
3. **herdr, in two steps.** First, Summon labels the herdr panes it already runs in, so herdr's sidebar shows seat, station, item, and state, with no new powers for any seat. Later, and only after a need gate and OS-level containment, the herdr host runs seats as their own sessions in panes that the human can step into.
4. **The world.** A party bar in the terminal first, then a replay with a turn-based battle view of each review, then a Guild Hall that starts as a quest board. Every badge leads with plain words, is computed from the log, and names a real failure mode, and a unanimous, overlapping window of reviews stops the work order until the human acknowledges it.

How the parts fit, with v3's pieces unmarked and this PRD's additions marked `+`:

```
STARTS THE SEATS              WRITES THE RECORD                         READS THE RECORD

work order                    dispatch.mjs       spawn, claim     ─┐
   │                          run-checks.mjs     check, receipt    │
dispatch.mjs                + wire.mjs           start, stop,      │  out-of-band
   │ + cast from casting                         cast, block       │
   │                        + herdr host         pane state        ├─► ledger ──────┬─► checks: dissent, control,
host: Workflow, subagents,    seats, ingest      claim, finding,   │  testimony     │   line, + corroboration
      + herdr                                    verdict, return  ─┘  (tracked)     │
   │                                                                                └─► + renderers, plain words
seat sessions on a cast     + wire.mjs           tool calls, cost ───► + telemetry ─┬─► first, then the skin:
                                                                         (untracked) │  party bar, herdr labels,
                                                                                     └─► replay and battle, hall
```

## A night with the party

The scenario is illustrative, and each beat is tagged with the phase that delivers it. Every number in it would come from the log.

At 22:40 the human hands Grace a work order: three items on the `tdd` line, cast on the default (Opus 5.5 throughout, effort by station: high for red, medium for green, low for the skeptics) [Phase 1]. The dispatcher opens a branch per item and starts the seats, each in its own herdr pane [Phase 3]. herdr's sidebar lists them by seat and state, `Tara#1 · red · working` and `Sato#1 · green · idle` [Phase 1]. A one-line party bar in the human's own session shows the same seats with the model each is actually running on and its tokens so far [Phase 0].

At 22:52 Sato#1 stops on a permission prompt for `curl`. Its pane label changes to `Sato#1 · green · waiting on you`, herdr raises a desktop notification, and the party bar's line for Sato says the same in words [Phase 1]. The human answers in the pane, where the whole terminal is live [Phase 3], and goes back to the sofa.

At 23:30 item 1 reaches review. The four floor lenses run in parallel on Opus 5.5, and the skeptic stage tries to refute each finding [v3]. Next morning the replay draws it as a battle: hits in timestamp order, each labelled with its severity in words, three of them marked REFUTED with the skeptic's reason underneath and the finding still visible, the forty skeptics drawn as one chorus with a count. Verdicts split (revise, revise, accept, revise), and the dissent line on the party bar moves [Phase 2].

Item 3 goes badly. Sato#2's session compacts twice, the green station returns `ok: false`, and the casting's escalation rule re-runs it once at high effort, logging why and what it cost [Phase 2]. In the morning the human scrubs the replay to 01:14, sees the escalation, and drags the exported replay into the PR description. The export shows severities and verdicts, never the text of a finding, so it cannot leak an unfixed vulnerability to a public PR [Phase 2].

Had all three items come back unanimous with overlapping findings, the dispatcher would have refused to close the order until the human acknowledged the run [Phase 1]. No agent saw any of it, because the skin, the meter, and the badges never enter a model's context.

## Why now

### What the deprecation named, and how far v3 got

The README's notice of 2026-08-18 names four causes and one failure mode. ADR-0015 answers part of each; this PRD exists for the parts it leaves open, most of which ADR-0015 itself names.

| Named on 2026-08-18 | What ADR-0015 does | Still open | Answered here by |
|---|---|---|---|
| Opus 5 guidance inverted delegation and verification | Adapter field `delegation: null`; the line runs as a workflow, not a prose mandate | Work orders no longer depend on posture; the conversational ceremonies, including the Architecture Gate that the README sells, still do | Casting (posture under `team/casting/`, C-7) and the Architecture Gate as a line (C-12) |
| Subagent defaults churned | `dispatch` limits moved into the adapter, labelled as expiring | A seat is still a subagent. Between Claude Code 2.1.212 and 2.1.224 (July to August 2026) a session spawn cap was added and removed, a 20-agent concurrency cap arrived, and nesting was switched off and back on at depth 3. The churn goes on: since 2.1.271 the harness's advisory default for a workflow is fewer than 10 agents, and smaller on Pro plans, where the review station's first run used 45 | Mostly by v3's Workflow host already, whose fan-out a script computes; the herdr host removes the rest for the seats it runs; the cascade audit (D-5) catches a wave that shrinks anyway |
| Sessions told not to invoke agents unless asked | Named as the one thing no file in the team can counter | The post quotes the injected line, "Do not call the AgentTool unless the user requested it", served to Opus 5 sessions with no changelog entry, and records a session in this repository that named it as the reason it worked solo. Answered for work orders, which the human requests and a script dispatches; still open for conversational ceremonies | C-12 for the gate and posture for the rest; absence events (W-10) and the cascade audit (D-5) show a skipped seat the same day |
| `maxTurns` and `model: inherit` hard-coded | Moved into the fitted adapter | `inherit` is still the only model value in `team/`; two of this PRD's five reviewers (Pierrot at 20 turns, Archie at 25) hit their v2 `maxTurns` cap mid-review on 2026-10-05 | Casting |
| Stale tuning degrades into unanimous approval | `disagreement-rate` over ten real items; negative control split into presence and spread | Verdict-level only; most of the log is testimony; nobody sees the rate unless they run a command | The wire, dissent instruments (D-1 to D-4), the world |

The first real runs on the v3 branch (2026-09-10, `docs/history/tracking/2026-09-10-first-runs.md` there) added four findings this PRD also picks up. The review station used 45 agents and about 2.3M tokens on one small diff, and 40 of those agents were skeptics. The line's review station failed to start because Claude Code loads its agent registry at session start, so a composed seat staged mid-session was never seen. The dispatcher's worktrees and the harness's worktrees turned out to be two different things, and a worktree carries its own copy of the tracked log. And five lenses each vetoing a diff with four planted critical defects read as "unanimous" to the instrument while their 34 surviving findings disagreed in content.

### What moved outside the repo since August

**Model guidance now flips between releases, and it is written down.** Anthropic's migration notes tell Opus 4.8 users to add explicit delegation triggers because that model under-reaches for subagents. The *Prompting Claude Opus 5* guide then says Opus 5 "delegates to subagents more readily than prior models", recommends deterministic caps on spawning, and says to remove verification instructions ("use a subagent to verify") because they cause over-verification; it also confirms that Claude Code adds a delegation instruction of its own on that model, which is the session-level instruction the deprecation notice ran into. The *Prompting Claude Fable 5* guide reverses both: use subagents frequently, prefer long-lived asynchronous ones, and use separate fresh-context verifiers, which "tend to outperform self-critique". The same guide says skills written for prior models "are often too prescriptive" and can degrade output quality. A methodology that hard-codes one delegation posture is wrong on at least one current model by construction.

**Claude Code grew the primitives this needs.** As of October 2026 the subagent frontmatter accepts `model` (an alias such as `opus` or `fable`, or a full model ID) and `effort` (`low` through `max`), and the Workflow tool's `agent()` takes `model` and `effort` per call. Hooks can be `command`, `http`, `mcp_tool`, `prompt`, or `agent`; any hook can run with `async: true`; and when a session runs with `--agent`, every hook event carries `agent_type`. `PostToolUse` and `SubagentStart` cannot block. Hooks, file tools, and MCP servers run outside Claude Code's OS sandbox, which covers shell commands only; the sandbox can deny writes outside the working directory, block Unix sockets (on Linux only with its optional seccomp filter), and strip named environment variables from sandboxed commands. OpenTelemetry export carries `agent.name`, `model`, and `cost_usd`, and traces are in beta. The `subagentStatusLine` script receives every running subagent with its `name`, `status`, `model`, `effort`, and `tokenCount`.

**herdr became the terminal for running many agents.** It is a single Rust binary (Apache-2.0, v0.9.3 released 2026-09-29, about 42k GitHub stars) whose server owns real PTY panes, keeps them alive across detach and SSH, and marks every agent pane `working`, `blocked`, `done`, or `idle` by reading its screen, so it knows Claude Code is waiting on a permission prompt without any hooks. Its CLI and newline-delimited JSON socket API can start a named agent of a given kind in a pane, prompt it and wait for it to settle, label the pane, and stream state changes; Part 3 lists the calls. It starts Claude Code, Codex, Gemini, Cursor, OpenCode, Amp, and about twenty other agents, and since v0.7.0 it takes out-of-process plugins. Its maintainers keep the core small on purpose and have declined fleet-level events, pane lineage, and per-turn cost tracking (herdr issues #4027, #2871, #2742). That is the layer Summon would supply.

**The community converged on named roles and on watching agents work.** Steve Yegge's Gas Town runs a Mayor, Polecats ("worker agents with persistent identity but ephemeral sessions"), a Refinery that verifies work before merging it, and Witness and Deacon watchdogs over Claude Code, Codex, Gemini, and others in tmux, with work tracked in Beads. Pixel Agents draws each Claude Code session as a pixel-art character in a small office who walks to a desk, types while editing, reads while searching, and flags when it is waiting for input. It is driven by the same hook events this PRD uses (`SessionStart`, `PreToolUse`, `PermissionRequest`, `Stop`), shows subagents and teammates as their own characters, and lists "health bars for rate limits and token budgets" on its roadmap. Claude Code itself added an agent view (`claude agents`), a per-subagent status line, and in 2.1.287 Claude Mods, plugins that can add live panes and bands to its interface. The most telling change is Anthropic's own: since 2.1.274, `/code-review` uses "leaner inline review prompts for every model that has no tuned settings of its own, instead of spawning many review subagents". That is per-model tuning with a lean fallback, which is what this PRD calls casting and posture. None of these projects has a methodology whose output is dissent and a decision record, which is the part Summon brings.

**The research says agreement between similar reviewers is weak evidence.** Kim et al. (ICML 2025) found that when two models both err they pick the same wrong answer about 60 percent of the time on one leaderboard, and that larger, more accurate models correlate even across providers. Goel et al. (ICML 2025) found that model judges favour models similar to themselves and that mistakes converge as capability rises. Choi et al. (NeurIPS 2025) found that majority voting, not the debate itself, accounts for most of multi-agent debate's gains. In code review specifically, framing a change as bug-free cut LLM vulnerability detection by 16 to 93 percent, and adversarial PR descriptions got past Claude Code in 88 percent of iterated attempts until the metadata was redacted (arXiv 2603.18740, 2026). The Refute-or-Promote study (arXiv 2604.19049, 2026) records ten agents, an arbiter among them, unanimously confirming an OpenSSL padding oracle that a single fresh-context instance disproved by compiling the code and running three tests. Unanimity among similar reviewers who share the author's framing is close to no information, which is the deprecation's failure mode stated as a finding.

## The problem

Summon's promise is a team whose disagreement carries information. After v3, three things outside Summon's files still decide whether that holds. The model behind each seat is whatever the session inherited, so a model release recasts the whole team silently and the next unanimous window is the first sign. The conversational ceremonies, the Architecture Gate first among them, still depend on a coordinating model's appetite for delegation, which changes per release. And the record of what the team did is mostly testimony: a seat that forgets to log, or never ran, looks the same as one that ran and agreed.

Underneath all three sits a plainer problem. The team works where the human cannot see it, so dissent decays quietly, and the instruments that would show the decay are commands nobody runs at 23:30.

## The three symptoms are one chain

The human stopped the team because its agents lost their voices: personas stopped speaking, agents were skipped, and reviewers agreed instead of contesting. *I Killed My Agent Team* records the order in which those showed. First the voices flattened, until the reviews "read like they'd been written by one careful, forgettable author". Then the disputes thinned, and then every review came back unanimous. The post also records a cause underneath. On the day Opus 5 shipped, Claude Code began injecting a server-gated section into Opus 5 sessions that said "Do not call the AgentTool unless the user requested it" (claude-code issue #80988, as the post cites it), with no changelog entry and no opt-out. A session doing the deprecation work in this repository named that line as its reason for working solo instead of spawning the personas CLAUDE.md mandates. The post's own summary is this section's thesis: "A reviewer that stops being spawned as its own agent stops speaking in its own voice."

Read that way, the three symptoms are four links of one chain. The human saw them in the order they become visible, which is not the order they happen. A skipped seat is invisible while a verdict still carries its name, so the first thing anyone can see is the voice.

| Link | What happens | What this PRD does | Effect |
|---|---|---|---|
| 1. A model the harness can instruct decides whether seats run | The coordinator reads CLAUDE.md's mandate to spawn and an injected line that countermands it; the line renders after everything the user wrote | A work order or a line decides which seats run, and a script starts them. A work order is the human's own request, so it meets even the injected line's condition. The Architecture Gate becomes a line (C-12), and posture blocks (C-7) cover what stays conversational | Breaks the link on the dispatched path |
| 2. A skipped seat still leaves a verdict under its name | The coordinator writes the review itself and labels each part with a lens, so the record looks complete | Every work order and ceremony states the seats it must start, and a seat that never started is written down as `absent` (W-10): by the dispatcher from the plan, or by the wire from hooks in conversation. A verdict with no bracketing out-of-band events is *Uncorroborated* (W-4, D-3) | Detects it the same day |
| 3. One context writes every lens, and the voices flatten | v2's composite reviewer described itself as "an invocation pattern combining four core review lenses". When nesting was off it could not fan out, and when it was never spawned the coordinator wrote the lenses; either way one context wrote all four, and each persona became a paragraph in someone else's prompt | Every lens is its own agent type in its own context (Part 1), and lens prompts carry the spec and the diff, never the coder's framing (C-11). The voice probe compares each seat with and without its persona (C-8) | Prevents it on the dispatched path; detects it everywhere |
| 4. One context cannot contest itself, and fitted dissent decays | Lenses written by one context, or by one model, agree for reasons that have nothing to do with the code. In the post's words, dissent tuned against an older model's temperament "decayed into consensus rather than noise" | Content divergence beside the verdict rate (D-1); a unanimous, overlapping window stops the order (D-4); H1 tests whether lenses on different models disagree more usefully | Detects it and stops the work |

**The chain has more than one way in.** The injected line explains the skipping from late July. It does not explain everything, because the post dates the last review with a real dissent to May 15, more than two months before the line appeared. Anthropic's migration notes say an earlier model, Opus 4.8, under-reached for subagents, so a model can skip seats with no injected line at all. Claude Code 2.1.217 switched nested subagents off for two releases, which is enough to stop a composite reviewer from fanning out. And the post's fitted-dissent reading needs no harness change. So the chain can be entered at any link, and this PRD puts an instrument on every link rather than a fix on the first. The cascade audit (D-5) runs all of them together on every model release, every Claude Code release, and on a calendar, because the line that silenced the team arrived from a server with no release to trigger a check.

**Voice is the earliest sensor.** The voice went first, so the voice probe (C-8) is the earliest warning this PRD has. That is why it runs with and without the persona, on prompts that say nothing about format: it should fail on the day a persona stops adding anything, not on the day the verdicts go unanimous.

**What today's evidence says.** It is thin, and it points one way. The five reviews of this PRD on 2026-10-05 ran as v2 subagents on `model: inherit`, spawned under this repository's CLAUDE.md mandate. Every seat named was spawned, all five returned (two after hitting their turn caps and being resumed), none approved the draft, and their 46 findings differ in content, with five concerns reached independently. Three caveats keep that from counting toward G0. The briefs asked for numbered findings graded blocking, amend, or note, so the format was primed, and Wei's review says so of itself. The session ran in Claude Code's cloud environment rather than the CLI on the human's machine, and its system prompt carried no such line, so it says nothing about whether the line still reaches the human's own sessions. And it is one run. D-5 is what would turn it into evidence.

**The post's two hypotheses get instruments.** The post kept two ideas from the wreckage as hypotheses for its bake-off: per-role context isolation, and enforced separation of duties. Context isolation is link 3's fix, and corroboration (D-3) measures it, because a corroborated verdict is one whose lens started and stopped as its own agent. Separation of duties has a gap the post could not see from inside it. ADR-0015 records Wei's correction that the v2 boundary was prose too: Tara's file carried `Write` and `Edit` with no `disallowedTools`, because on Claude Code writing source and writing tests use the same tools. The hypothesis has never been tested with enforcement, so Part 3 adds it, as a hand-off check that stops the next station when one touched paths its role must not (H-7, every host) and as per-seat permission rules that block the write where a seat is its own session (H-8). The post's six-month audit asks "whether the context boundaries and the maker-checker split survived contact with harnesses I don't tune, and whether my reviewers, whatever they're running on by then, still argue with me". D-5 and H-7 are built to be that audit's instruments. H-7 and the content-divergence report read git and the ledger rather than the harness, so they run unchanged on Codex.

**What this does not fix.** The conversational path stays exposed. A human who types "review this" into their own session is asking a model whether to spawn, and the harness can tell that model no. This PRD does not fight the harness there with stronger prose, which is the fitted-curve move the post warns against. It makes the absence visible the same day (W-10), moves the gate onto a line (C-12), and asks the human whether ceremonies that declare seats should run as work orders by default (open question 8).

## Goals and non-goals

| ID | Goal | Measured by |
|---|---|---|
| G0 | The deprecation notice can come down | Every condition in the Summary holds on the current model, recorded in one tracking doc the human signs |
| G1 | Every event in the log says who wrote it, and every verdict says whether it is corroborated | The corroboration report (D-3) runs on every item |
| G2 | Each seat and station gets its model and effort from one fitted file that a model release invalidates and only the human's promotion changes | No item runs on an unaudited model without a recorded acknowledgement |
| G3 | A work order produces the same team shape on any coordinating model | The same order on two coordinating models produces identical spawn sequences |
| G4 | Identity changes only on purpose | No recast edits a persona file; persona edits for model fit are their own reviewed changes; the voice probe runs on every seat an audition exercises |
| G5 | A human can see, live and in replay, who is working, who is waiting on them, who disagreed, and what it cost | The timed tasks in Phase 2 and Phase 4 beat `team-log.mjs render` |
| G6 | The review station costs less per item than the Phase 0 baseline, with no planted defect lost | Cost per reviewed item against the baseline; zero refuted plants |

| ID | Out of scope |
|---|---|
| N1 | A hosted service, an account, push notifications, or network egress for telemetry. Everything stays on the machine. |
| N2 | A terminal multiplexer. herdr is the host; Summon writes an adapter and never forks it. |
| N3 | A supervisor or control plane. ADR-0012's rejection stands, and so does its tamper-boundary clause: nothing here is tamper-proof, and the human reviewing the PR remains the integration authority. |
| N4 | Views that feed model context or take actions. Renderers are read-only, apart from the human's acknowledgement in D-4, and the skin never enters a prompt (ADR-0015). |
| N5 | Claims that multi-model casting improves quality. H1 is a hypothesis with a null allowed, and benchmark claims stay with ADR-0005. |
| N6 | Replacing v3. Every part extends ADR-0015's layers, log, line, and work order. |
| N7 | Throughput views, sound, and a Summon plugin for herdr. All three were cut in review. |

## Who this is for

The README's audience does not change: a solo developer or a two-to-three-person team who will answer for the code later. Summon Live gives that person a reason to run longer, unattended work orders and a way to trust what comes back.

| Job | Today on v3 | With Summon Live |
|---|---|---|
| Run a work order overnight and know in the morning what happened | Read `.summon/team-log.jsonl`, run `team:dissent` and `team:watch` | Scrub a replay; every verdict says whether it is corroborated |
| Notice the moment the review formation goes quiet | Remember to run `pnpm team:dissent` | The order will not close on a unanimous, overlapping window until the human acknowledges it |
| Upgrade the model under the team | Edit nothing and hope, since everything inherits | Run an audition, promote or keep the incumbent, and see which model each seat actually ran on |
| See which seat is waiting on them | Find the subagent transcript afterwards | Read it in herdr's sidebar or on the party bar, in words |
| Show a reviewer how a change was made | Link the tracking doc | Attach the replay to the PR |

## Principles

**Identity is canon; casting is configuration; configuration is measured.** A persona's priors, dissent, voice, and tells live in its persona file. The model and effort behind a seat live in a fitted casting file that expires on every model release. A recast never edits a persona, and a persona edit for model fit is a deliberate, reviewed change (ADR-0015 already says "model fit is a persona edit"). In the JRPG skin the model is equipment: Vik can change gear and is still Vik.

**Testimony, out-of-band events, and proof are three different things.** A seat's own events are testimony. Events written by a script or hook that the seat does not run are out-of-band. Neither is proof, because a seat that can write the log file can forge any line in it. Out-of-band events resist forgery only on installs where seats run their shell in Claude Code's sandbox and cannot edit the log, the wire, or settings; `doctor` reports whether that holds, and every ceremony says which mode it ran in.

**Structure by dispatch, never by delegation.** Which seats run, on which items, in what order, is decided by a script from a work order or a line. A coordinating model's appetite for subagents can then flip between releases without changing the team.

**No silent recasting.** A casting names full model IDs. Aliases such as `opus` move when Anthropic ships, which is the same silent change that killed v2's tuning.

**Fail closed on silence.** A full window of unanimous reviews with overlapping findings stops the order until a human acknowledges it. A badge nobody is awake to see is decoration.

**Plain words first, flavour second.** Every status says what is wrong in plain words; the JRPG name is the skin's decoration on top. Every renderer answers a stated question, and its gate times that question against the table renderer that already exists.

**Degrade loudly.** When a host, hook, sandbox, or renderer is missing, the ceremony announces its mode at invocation, as ADR-0012 C already requires.

## Part 1: The wire

The wire is one new writer, `scripts/wire.mjs` (zero dependencies, run as asynchronous command hooks), alongside the outside-the-model writers v3 already has. It answers the limit ADR-0015 names itself ("the log is partly written by the seats themselves") and issue #129, with the honesty clause above attached.

### Who writes what

Every new ledger event carries `by`. Lines written before this change read as `unattributed`, never as `seat`, because dispatch, the runner, and `ingest` wrote some of them.

| `by` | Writer | Events | Kind |
|---|---|---|---|
| `dispatch` | `scripts/dispatch.mjs` | `spawn`, `claim` (the dispatcher claims before it prompts, so `claim` has one writer), and `expect` from the plan | out-of-band |
| `prepare` | `scripts/review-wave.mjs prepare` | `expect` for the lenses it computed from the diff (new) | out-of-band |
| `runner` | `scripts/run-checks.mjs` | `check` with a tree-bound receipt | out-of-band |
| `wire` | `scripts/wire.mjs` from harness hooks | `start`, `stop`, `cast`, `block`, `unblock`, `compact`, and in conversation `expect` and `absent` (new) | out-of-band |
| `host` | the herdr host | pane state from herdr's screen detection (new) | out-of-band, excluded from corroboration because herdr reads it off the screen and any socket client can overwrite it |
| `ingest` | `scripts/review-wave.mjs ingest` | `finding`, `verdict`, `return` relayed from a workflow's return | testimony, because the content is a model's |
| `audition` | `scripts/audition.mjs` (new) | `audition` | out-of-band |
| `seat` | the seat, through the `append` CLI | `finding`, `verdict`, `return` | testimony; the seat-facing CLI stamps `seat` and refuses any other value |
| `coordinator` | the main session | `ack`, notes | testimony, under a reserved seat name |

### Corroboration

A verdict is *corroborated* when out-of-band `start` and `stop` events for the same instance, item, and lens bracket it. A station's `return` is corroborated the same way, keyed on instance, item, and station. "Who wrote the line" never decides it.

That needs one change to v3. Today `review-wave.workflow.mjs` spawns every lens without an `agentType`, so `SubagentStart` cannot name the lens. The composer emits one agent type per formation lens and one for the skeptic chorus, and the workflow passes it, so every `start` and `stop` names its lens. A long-lived session that handles several items brackets all of them, so corroboration is per turn (claim to return), never per session.

Corroboration catches a verdict that no seat wrote. It cannot catch a seat nobody asked for, which is how the team actually went quiet (see *The three symptoms are one chain*). So every run states the seats it must start, and a seat that never started becomes an `absent` event, written out-of-band.

- **On the dispatched path, the plan is the expectation.** `dispatch.mjs claim` writes `expect` for the station's seat before the seat runs, and `review-wave.mjs prepare` writes `expect` for the lenses it computed from the diff. A conditional lens that `prepare` chose not to apply is recorded as `skipped`, as v3 already does, and is never expected.
- **In conversation, the hooks supply it.** The seats stay where ADR-0015 puts them: the party's formation, the line's stations, and the gate line (C-12). The party gains a portable binding from each ceremony to its formation or line, and the harness adapter gains the harness's names for each ceremony (the typed command, the skill, a plugin-scoped name such as `summon:review`), because those names are fitted. The composer compiles both into an expectations table that the wire reads from its pinned location, with its hash in the manifest (W-7), so no seat can edit what is expected of it. The wire writes `expect` from `UserPromptExpansion` when the human types a ceremony and from `PostToolUse` on the `Skill` tool when the model invokes one; `PermissionDenied` or `PostToolUseFailure` withdraws it, so a refused call never counts as a ceremony that ran.
- **Closing is declared.** The binding says whether a ceremony closes at the turn's `Stop` or at `SessionEnd`. At `Stop` the wire closes it only when the hook's `background_tasks` holds no workflow or subagent still in flight. The `SessionEnd` handler runs synchronously, wired through `--settings` with a timeout inside the hook budget, because `SessionEnd` hooks get 1.5 seconds by default, a plugin's own timeout cannot raise that, and `-p` runs kill async hooks at teardown. An interrupted ceremony fires no `Stop`, so its `expect` is reported as unclosed, never as absent.
- **A written `absent` is a cache, not the only record.** `team-log.mjs corroborate` derives "expected and never started" from `expect`, `start`, and the session's last `stop`, so a lost hook leaves the fact recoverable. `expect` and `absent` are declared in `team/events.json` like every other event, because v3's append rejects an undeclared event and a silent wire would lose the rejection. Their `seat` is a reserved writer name and the missing seat goes in `missing`, so *Seat never started* lands on the item, never on the persona. In conversation, where no `SUMMON_ITEM` is set, the item falls back to the session and prompt ids.

Whether `SubagentStart` fires for agents that a Workflow script spawns is not documented, and every lens on the Workflow host is spawned that way. A live probe settles it before Phase 0 counts anything: one Workflow agent with an agent type must produce an observed `start` and `stop`. If it does not, corroboration and absences on the Workflow host are reported as unavailable, never as zero, and the wire ADR names the fallback.

### The hook set

Every wire hook but one is `async: true` and is wired as `node <absolute path> >/dev/null 2>&1`; the exception is the `SessionEnd` handler, which runs synchronously inside the hook budget (W-10). The script carries its own two-second exit timer, and a shorter one under `SessionEnd`, because Claude Code enforces no timeout on async hooks. It never prints anything and never emits JSON, because stdout from `SessionStart`, `UserPromptSubmit`, `UserPromptExpansion`, and `PostModelSwitch` reaches the model as context. It opens the log with `O_NOFOLLOW` and refuses anything that is not a regular file, so a planted FIFO or symlink cannot hang it or redirect it.

| Claude Code event | Stream | Becomes | Note |
|---|---|---|---|
| `SessionStart` | ledger | `start`, `cast` | `cast` records the model the session reports; the status-line payload's `model.id` is the fallback source |
| `UserPromptExpansion`; `PostToolUse` on the `Skill` tool | ledger | `expect` | in conversation only: a ceremony has started, typed by the human or invoked by the model; `PermissionDenied` and `PostToolUseFailure` withdraw it (W-10) |
| `SubagentStart` / `SubagentStop` | ledger | `start` / `stop` | `agent_type` names the composed seat or lens |
| `SessionEnd`, `Stop`, `StopFailure` | ledger | `stop`, `absent` | carries `ok: false` on `StopFailure`; closes a ceremony as its binding says and writes one `absent` per expected seat that never started (W-10) |
| `PermissionRequest`, `Notification` | ledger | `block` | the human is now the bottleneck |
| `PreCompact` | ledger | `compact` | context pressure inside one seat |
| `PreModelSwitch` / `PostModelSwitch` | ledger | `cast` | a mid-session recast is still a recast |
| `PreToolUse` / `PostToolUse` / `PostToolUseFailure` | telemetry | `tool` | tool name, duration, exit status, and the redacted fields below |
| `WorktreeCreate` / `WorktreeRemove` | telemetry | `worktree` | joins harness worktrees to dispatcher worktrees |

Item and instance attribution comes from environment variables the dispatcher sets on each seat it starts (`SUMMON_SEAT`, `SUMMON_INSTANCE`, `SUMMON_ITEM`, `SUMMON_STATION`, `SUMMON_LOG`). Under the Workflow host those are not per agent, so the wire attributes by `agent_type` and the dispatcher's claim, and says so in the event.

### Where the wire's code lives

A hook runs outside the sandbox with the session's environment, and `scripts/wire.mjs` in a seat's worktree is a file a coder seat can edit, so its next tool call would run the edited code. The wire therefore runs from a pinned path outside every worktree: installed as a Claude Code plugin, or passed by the dispatcher on the command line with `--settings`, which outranks project and local settings. It is never wired from a project or local settings file. That gives up ADR-0014's preference for wiring that review can see in a tracked file, so the visibility moves to the record instead: the work order and `.summon/manifest.json` carry the wire's version and content hash, and `doctor` reports what is wired, from where, and whether the hash matches.

Three more guards keep seats away from their own instruments. During a work order a `ConfigChange` hook refuses edits to project and local settings; it is a blocking hook, so every ADR-0012 condition on blocking hooks applies to it. Seats never run with `bypassPermissions`. And `check --line` fails any work-order diff that touches `.claude/**`, the wire, `team/harness/`, `team/hosts/`, or `team/casting/`.

One consequence reaches past Summon. Claude Code trusts the folder in `claude -p` and SDK runs, so any project hook runs in any CI job that calls `claude -p` on a PR checkout, with that job's secrets. Scaffolded projects get a line in their runbook to pass `--settings '{"disableAllHooks": true}'` for CI runs on untrusted checkouts.

### Two streams and one resolver

The v3 ledger stays what it is: low volume, schema-validated, git-tracked so CI can read it. Tool-level events go to a second stream that is never committed.

| Stream | Path | Holds | Tracked | Read by |
|---|---|---|---|---|
| Ledger | `.summon/team-log.jsonl` (v3) | Semantic events, every one declared in `team/events.json`, the new `start`, `stop`, `cast`, `block`, `unblock`, `compact`, `expect`, `absent`, `audition`, and `ack` included | yes | checks, renderers |
| Telemetry | `.summon/telemetry/<date>.jsonl` | Tool calls, durations, pane states, token and cost samples | no (gitignored, rotated after 14 days) | renderers only |

Every writer resolves the log through one function in `team-log.mjs`: `SUMMON_LOG` when the dispatcher set it, otherwise the `.summon/` directory of the checkout that owns the repository's shared git directory (`git rev-parse --git-common-dir`), which is the main checkout from every worktree. Today dispatch, `ingest`, the runner, and the seats' Log section each resolve it from their working directory, which is how the first-runs report found a worktree writing to its own copy. Each event is one line written by one `O_APPEND` write call, which does not interleave with another writer's line on a local filesystem; network filesystems are out of scope.

### Tokens and cost

Hooks carry no token counts. The party bar's status script (Part 4) receives `cost.total_cost_usd` and context-window figures for its session, and `subagentStatusLine` receives a `tokenCount` per running subagent; the script appends a sample to the telemetry stream when the numbers change, which costs nothing extra because Claude Code runs it anyway. OpenTelemetry is optional and stays local (W-8). Every cost report says which source it used.

### Redaction

Secrets reach the log by two routes, and both are closed at append time. The telemetry stream never stores tool output, file contents, environment variables, prompts, or full shell commands. For a Bash call it stores the basename of the first token that is not a variable assignment, checked against an allowlist (`git`, `pnpm`, `node`, and so on), so `GITHUB_TOKEN=ghp_… curl …` is stored as `curl`; anything off the list is stored as `other`. Paths are relative to the worktree, never absolute, so usernames stay out. Testimony is the second route: a security finding can quote the secret it found, so every writer, the seat-facing CLI included, scrubs known credential formats and high-entropy strings before append. `SUMMON_WIRE_DETAIL=1` keeps full commands in the untracked telemetry stream for local debugging and is never read by an export.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| W-1 | `by` on every new event; old lines read as `unattributed`; the seat-facing CLI stamps `seat` and refuses other values | P0 | `append` without `by` from an out-of-band writer fails; the seat CLI given `by: wire` fails; check-canon's historical-line validation still passes |
| W-2 | `scripts/wire.mjs` maps the hook set, zero dependencies | P0 | Recorded hook payload fixtures replay into the expected ledger and telemetry lines |
| W-3 | The hook contract: async, exit 0, empty stdout and stderr, ends within two seconds by its own timer, refuses a FIFO or symlink log | P0 | Contract tests for each clause, plus a fixture in which the wire tries to emit `additionalContext` and nothing reaches the model |
| W-4 | `team-log.mjs corroborate --item <id>` reports every verdict and return without bracketing out-of-band events for the same key | P0 | Two fixtures: four verdicts with three lens starts, which must name the missing lens; and a review pane that starts, skips the wave, writes five verdicts, and stops, which must report five uncorroborated verdicts |
| W-5 | One resolver for the log across every writer and worktree | P0 | Three stations in three worktrees write one ledger with no lost lines under concurrent appends |
| W-6 | Redaction at append for every writer | P0 | Fixtures: a bearer token in a `curl` command, a `GITHUB_TOKEN=` prefix, an absolute home path, and a secret quoted in a finding summary; none survive in either stream |
| W-7 | The wire runs from a pinned, hashed path outside every worktree | P0 | `doctor` reports the wire's source, version, and hash, and refuses to report it present from a project or local settings file |
| W-8 | Optional local OTLP/HTTP receiver for cost and token data | P2 | It keeps an allowlist of fields and never stores tool arguments, even when `OTEL_LOG_TOOL_DETAILS=1` is set |
| W-9 | Guards on the enforcement surface during work orders | P1 | A seat's settings edit is refused by `ConfigChange`; a seat cast with `bypassPermissions` is refused by `plan`; a diff touching `.claude/**` fails `check --line` |
| W-10 | Absence events: the dispatcher and `prepare` write `expect` from the plan; in conversation the wire writes it from the compiled expectations table; an expected seat that never started becomes `absent`, which `corroborate` can also derive | P0 | Fixtures: a review station that starts four of five lenses yields exactly one `absent`; a conversational review in which the coordinator writes four lens verdicts itself yields four `absent` events and four uncorroborated verdicts; a review still running in the background at `Stop` yields none; a refused `Skill` call yields no `expect`; every line the wire writes validates against `team/events.json`; and the live Workflow probe has run |

## Part 2: Casting

### The default is one model

Anthropic's cost guidance says to measure the most capable model at a lower effort before building a multi-model cascade, because lower effort on the newest models often matches older models at high effort, and because prompt caches are per model, so a cascade gives up cache reuse. Summon Live takes that as the default: one model, effort set per station. The first phase that casts anything ships only that, with a cost target based on effort alone. Multi-model castings, model escalation, and cross-vendor seats wait for H1, because H1 decides whether they should exist at all.

### The casting file

Casting lives in `team/casting/<name>.json`. It is fitted (`"fitted": true`, with a `review` field like the harness adapter's) and is one of a closed list of fitted locations (`team/harness/`, `team/hosts/`, `team/casting/`) that `docs/methodology/team-layers.md` names and check-canon enforces. A model ID may appear nowhere else under `team/`. The posture blocks, the skeptics' effort (hard-coded today as `effort: 'medium'` in `review-wave.workflow.mjs`), and the model used by judged checks move here too. Folding this list into ADR-0015 at its ratification saves a later ADR from amending it straight away, and ADR-0015's reversal trigger 3 then reads against the whole list.

```json
{
  "casting": "anthropic-2026-10-default",
  "fitted": true,
  "review": "Re-audition on any release of a model named here, and on any harness release that changes how model or effort is set.",
  "promoted": { "by": "human", "date": "2026-10-14", "audition": "docs/history/tracking/2026-10-14-audition.md" },
  "default": { "model": "claude-opus-5-5", "effort": "medium" },
  "stations": {
    "red":    { "effort": "high" },
    "green":  { "effort": "medium", "escalate": { "after": "fail", "to": { "effort": "high" } } },
    "review": { "effort": "high" },
    "refute": { "effort": "low", "capPerLens": 6 }
  },
  "judge": { "model": "claude-opus-5-5", "effort": "low" },
  "posture": { "claude-opus-5-5": "opus-5.md" }
}
```

The composer resolves a cast for every seat and station and emits it where the host can apply it: `model` and `effort` frontmatter for the subagent host, `opts.model` and `opts.effort` for the Workflow host, and a `launch` argument template in each harness adapter for the herdr host (Part 3). The values above illustrate the shape. The first real casting is whatever the human promotes after the first audition.

### Auditions block; the human promotes

`pnpm team:audition --casting <file>` runs four probes and writes an `audition` event. An audition can block a casting. It never promotes one; the human does, and the casting file records who and when.

1. **Presence.** The review formation runs the v3 negative-control fixture under the candidate. Every lens must find its planted defect, and the skeptic stage must refute none of them. A skeptic that talks a lens out of a real defect hides a bug, and that asymmetry is why this is a hard floor.
2. **Recall on replays.** A replay set of past items with known defects runs again. The set is seeded from fix commits and from defects the incumbent missed, so a challenger that finds different defects can win; a set built only from the incumbent's hits would score every difference as a regression. The block rule: no defect the incumbent caught may be lost. Union recall is reported beside it.
3. **Voice.** Each persona's probes run on station prompts that say nothing about format (below).
4. **Cost and time.** Tokens, list-price cost, and wall time per item.

These are smoke tests, and the PRD says so plainly. A clean presence run covers about twenty findings on planted defects, which by the rule of three only bounds the skeptics' refutation rate below about 15 percent. The number of replay items is pre-registered before the first audition, and every quality claim stays with ADR-0005's benchmark and its statistics.

### The review formation

The first run's 45 agents were 5 lenses and 40 skeptics. The default casting lowers the skeptics' effort, and the audition measures what that saves; the draft's arithmetic about casting skeptics on a cheaper model is withdrawn until H1 says whether a second model belongs in the formation at all. The skeptic cap per lens, which the first-runs report recommended, is logged whenever it drops a finding, so the cap is never silent.

Two cheaper changes come first, both from the research above. The review station's prompt carries the item's spec and the diff and nothing that frames the change: never the coder's own summary of what it did, never PR titles or descriptions (C-11). v3's `review-wave.mjs prepare` already builds lens prompts from the diff alone; this makes that a tested rule. And a veto backed by an out-of-band check, such as a failing test the runner executed, is recorded as stronger than a veto backed by prose, which is the lesson of the unanimous padding oracle.

Mixed-model lenses are the open question. Lenses on the same base model share blind spots, so their agreement is weaker evidence than it looks. Summon Live tests this as hypothesis **H1**: at equal cost, a review formation whose lenses run on different models has lower finding overlap and higher union recall on the control and the replay set than a single-model formation. H1 runs in two arms. Arm A uses Anthropic's own models and sends no code anywhere new. Arm B, with a second vendor, runs only after arm A reports, and only through the separate cross-vendor decision in Part 3. The post describes a bake-off the human began in August, Claude against Codex on the same real work with GitHub Copilot's agent mode queued behind it, so arm B uses that bake-off's items rather than building a second corpus. Both arms are pre-registered in ADR-0005's style, and a null result is published like any other. The correlation papers above suggest arm A may well come back null, and the default casting does not wait on it.

### Escalation

A station may name an `escalate` cast and a trigger (`after: "fail"` when the station returns `ok: false`, or `after: "veto"` when the review vetoes twice). Under the default casting, escalation raises effort; it switches model only in a casting that H1 has justified. The dispatcher re-runs the station once and writes a `cast` event with the reason. Cost is judged per completed item, so an escalation that finishes the item counts as cheaper than two cheap failures, and escalation never runs past the item's token budget (C-10).

### Posture, and the gate as a line

For the conversational coordinator, the part of Summon that is still a model choosing whether to delegate, `team/casting/` holds a short posture block per model family, drawn from that family's prompting guide (cap spawns and keep verification in the main loop on the Opus 5 line; delegate asynchronously with fresh-context verifiers on the Fable line). The coordinator is not a composed seat, so the composer emits the block as a generated output style rather than as text in `CLAUDE.md`, where a generated block is exactly the drift ADR-0015's trigger 4 watches for. This gives ADR-0015's `delegation: null` a value. On every model release the posture blocks go through the `prompt-audit` procedure in Claude Code's bundled `claude-api` skill.

Posture still leaves the README's own pitch, the Architecture Gate, resting on a model's willingness to call Wei. So the gate becomes a line (C-12): Archie authors, Wei challenges on a distinct instance, Archie responds, and the human approves, with the stations, order, and separation checked over the log like the `tdd` line. ADR-0012 C already sequences an architecture-gate workflow after the review wave earns its keep; this is that workflow, expressed as a line.

### Voices survive recasting, or the edit is deliberate

The deprecation post noted that the voices flattened first, before anyone noticed the review had stopped working, which makes voice a cheap early warning. Each v3 persona lists its *Tells*, and several are mechanical: Wei numbers challenges and grades each one blocking, amend, or note; Pierrot attaches a time-to-exploit or a blast radius to every finding; Vik counts things and ends a finding with a choice.

Each persona's frontmatter carries its probes: the mechanical tells as patterns (graded deterministic) and the rest as a judged check (graded inferential, run on the casting's `judge` model, never the seat's own). The probes run on station prompts that say nothing about format, because a brief that asks for numbered, graded findings gets them from any model, persona or not. And each probe runs twice, with and without the persona attached (the composer already supports both), so the probe measures what the persona adds; when the two outputs become indistinguishable, the persona has gone flat. That comparison is also the measurement ADR-0012 F's revisit trigger has been waiting for.

Tells are a floor and cannot judge substance; a seat can keep its tic and lose its point. Content divergence (D-1) and presence are what catch that, which is why the voice probe never gates alone. If no candidate casting keeps a persona's voice on a new model, the persona gets a reviewed edit for that model (ADR-0015's "model fit is a persona edit"). It is never a silent change, and it never blocks moving off a model that is being retired.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| C-1 | Casting schema, fitted, full model IDs only, in the closed list of fitted locations | P0 | The composer refuses an alias and names the ID it resolves to today; check-canon refuses a model ID outside the list |
| C-2 | The composer emits casts per host | P0 | Composing the same party for the subagent and Workflow hosts yields the same cast per seat and station |
| C-3 | `cast` events record the model that actually ran | P0 | One definition of *Unaudited model*: a seat ran on a model ID that no promoted casting names for that seat and station; it raises the status and a `doctor` warning |
| C-4 | Auditions with four probes; they block, never promote | P0 | A casting whose skeptics refute a planted defect is blocked; a replay-set defect the incumbent caught and the candidate lost is blocked; nothing is ever promoted without a human `promoted` entry |
| C-5 | Skeptic cast and cap, logged when they drop work | P1 | Every dropped finding appears in the ledger with the cap that dropped it |
| C-6 | Escalation ladder in the dispatcher, effort first | P1 | A fixture item that fails green once escalates exactly once, logs why, and stops at its budget |
| C-7 | Posture blocks under `team/casting/`, emitted as an output style | P1 | Changing the coordinator's cast swaps the block; no other file changes |
| C-8 | Voice probes in persona frontmatter, format-neutral prompts, with and without the persona | P0 | Every seat an audition exercises has a probe with a passing and a failing fixture |
| C-9 | H1 arm A, pre-registered; arm B only after A reports | P2 | The registration exists before the first mixed-model run |
| C-10 | Work orders take an optional token budget per item | P1 | A fixture item at its budget is reported as stopped on budget, with no escalation started |
| C-11 | Blind review: lens prompts carry the spec and the diff, never the coder's summary or PR metadata | P0 | A fixture whose hand-off file claims "no security impact" produces lens prompts without the claim |
| C-12 | The Architecture Gate as a line | P1 | A gate order runs author, challenger, response, and approval in order on distinct instances, and `check --line gate` passes |

## Part 3: herdr, in two steps

### Why herdr at all

Wei's challenge in review was that herdr does not earn a host's place: the subagent limits bite at the review station, which stays on subagents anyway, v3's Workflow host is already a script that no model has to choose to run, and ADR-0015's cutover fixes the registry failure. That is largely right, and it reshaped this part. What herdr gives that nothing else in the stack does is a terminal the human can see and step into, sessions that survive a closed laptop or a dropped SSH connection, and a sidebar that already knows when an agent is waiting on a person. The first step takes those benefits without giving any seat a new power. The second step, seats as sessions in panes, waits until a real work order needs it and the containment below is in place.

### Step 1: herdr-aware (Phase 1)

When a Summon session runs inside herdr (`HERDR_ENV=1`), the wire labels its own pane. Hooks already run outside the sandbox with herdr's environment, so this adds one socket write from code Summon pins, and nothing a seat can call:

```
herdr pane report-metadata "$HERDR_PANE_ID" --source summon \
  --display-agent "Sato#1 · green · waiting on you" \
  --token seat=sato --token item=42 --token cast=opus-5.5/medium
```

The state goes into the display name in words, so the sidebar says who is waiting without relying on colour. Summon only ever uses `report-metadata`, which leaves herdr's own screen detection in charge of the pane's lifecycle; `pane report-agent` would take that authority away. herdr raises a local desktop notification on `blocked` when its toast delivery is set to `system`, which needs no push service. Renderers never trust herdr's tokens for identity, because any socket client can set them; identity comes from the ledger.

### Step 2: the herdr host (Phase 3, gated)

**The need gate.** The host is built only after a real work order where the human needed to step into a running seat, needed a run to survive a disconnect, or saw the Workflow host fail in a way separate sessions would fix. A cascade audit (D-5) that finds an expected seat absent on the Workflow host counts as that last case, because a seat the dispatcher starts as its own process is one that no model decided to spawn. The order and what went wrong are recorded in the tracking doc that opens the host ADR.

**Containment comes first.** herdr's socket has no authentication beyond its `0600` file mode, and herdr exports `HERDR_SOCKET_PATH` and `HERDR_BIN_PATH` into every process it starts, with its own values winning. With the socket, a seat can press Enter on another seat's permission prompt with `agent send-keys` and so borrow its tools, read every pane, overwrite the pane state that the host reports, and install persistent plugin code. A seat does not need the herdr binary or the variable to do it: five lines of Node opening `~/.config/herdr/herdr.sock` are enough, so a string-matching hook cannot stop it. The host therefore requires all of the following before it runs a seat, and `doctor` refuses the host when any is missing:

- Every seat runs its shell in Claude Code's sandbox, with herdr's socket left off `network.allowUnixSockets`. On Linux that needs the sandbox's optional seccomp filter, without which Unix sockets stay open.
- `HERDR_*` variables are denied to sandboxed commands through `sandbox.credentials.envVars`, passed by the dispatcher in `--settings`, because Claude Code ignores credential entries in project and local settings by design.
- Permission rules deny the edit tools on the ledger, the wire, herdr's configuration directory, and settings files, because file tools run outside the sandbox.
- A test opens a raw socket connection from inside a seat, and it must fail.

The `PreToolUse` hook that refuses commands naming herdr stays as a tripwire that logs an attempt. It is not a control and is not graded as one.

**Host adapters.** A host is not a harness. `team/hosts/herdr.json` (fitted, version-pinned, `min_herdr_version` 0.7.5 for the agent commands) says how to start, prompt, wait on, label, and close a pane. Each harness adapter gains a `launch` argument template, because `--agent`, `--model`, and `--effort` are Claude Code's flags and a Codex pane needs Codex's. `dispatch.mjs plan` takes `--host`, `spawn` events carry `host`, and v3's single `isolation` field splits into the harness's isolation and the dispatcher's worktree policy. herdr itself falls under ADR-0010's release-age cooldown like any other dependency, and every `host` event records which version of herdr's detection rules judged the pane, because herdr updates them remotely.

**One branch per item.** v3's `open` creates every instance's worktree at one detached head before any station runs, so the coder never sees the tester's commits; the line check passes anyway because it reads only claims. On the herdr host each item gets a branch. Each station commits its output and records the commit on its `return`, and at the next claim the dispatcher checks that commit out in the next station's worktree.

**How a work order runs.**

1. `dispatch.mjs plan --host herdr` assigns one instance per station per item, as v3 does, and refuses any seat cast with `bypassPermissions`.
2. `open` creates the item branches and worktrees, one herdr workspace per order (`workspace create --label <order> --no-focus`), and one pane per instance (`pane split ... --cwd <worktree> --env SUMMON_SEAT=... --no-focus`). It writes `spawn` events and records the human's ADR-0012 C opt-in on the work order, since no human sits inside the review pane to give it.
3. For each instance it runs `herdr agent start sato-1 --kind claude --pane <id> -- <launch argv>`, which expands to `--agent sato --model claude-opus-5-5 --effort medium --settings <containment JSON>`. herdr agent names allow lower-case letters, digits, `-`, and `_`, so instance `sato#1` is named `sato-1`.
4. At each station the dispatcher claims, checks out the previous station's commit, and prompts: `herdr agent prompt sato-1 "<station prompt>" --wait --until idle --until done --until blocked --timeout <budget>`. Hand-offs travel as committed files, which is herdr's own advice for output too long to read back from a pane.
5. On `blocked` it writes `block`, raises one local notification, and waits for the human (`agent wait --until idle --until done`). It never answers a dialog itself; herdr's own agent skill gives the same rule.
6. On `idle` or `done` it reads the ledger, never the screen. A station is complete only with a corroborated `return`.
7. A long-lived instance can take the next item's prompt in the same pane and keep its context; otherwise the dispatcher exits the agent and closes only the panes it created.

The review formation stays inside one pane, whose session runs v3's review-wave workflow, because forty skeptic panes would bury the wall; the wire still sees every lens and skeptic through their own agent types.

**One runner, not two.** The herdr loop above and v3's `line.workflow.mjs` must not become two implementations of the line. Both run over one host interface (start, prompt, wait, stop), and a parity test feeds the same plan to both and requires the same claims and returns. The dispatcher is not the supervisor ADR-0012 A rejected: it is a foreground command the human runs, it holds nothing the human's shell does not, it keeps no state outside the repository's log, it exits when the order ends, and it claims no tamper resistance.

### Separation of duties, enforced

The post kept enforced separation of duties as a hypothesis: a coder that cannot edit the tests cannot make a failing test pass by weakening it. As *The three symptoms are one chain* notes, the boundary was prose in v2, and v3's enforcement report still marks the tester's boundary as prose, because on Claude Code writing source and writing tests use the same tools. Two layers change that. The first does not wait for herdr.

**Checked at hand-off, on every host (H-7).** At each claim the dispatcher records the station's starting tree as a git object id, never a ref, by writing a temporary index and running `git write-tree`, so untracked files count and nothing a seat can move is trusted. The base for each station is fixed per item: the previous station's hand-off tree, or the order's head for the first station. It is never the latest claim's tree, so re-running a station cannot launder a crossing. The next claim diffs the base against the station's hand-off tree with `git diff-tree -r --no-renames --name-only`, so a rename out of a test path shows both sides, and matches every changed path against the boundary. A station counts as returned only when its latest boundary check passed, a small change to v3's read-decide-append claim; `claim` gains a `tree`, and `check` gains `station` and `instance`. Gitignored paths are invisible to the check, and tests that live inside source files, such as Rust's `mod tests`, cannot be separated by path at all. The enforcement report states both limits.

On the Workflow host the refusal is an exit code that the next seat's shell receives, because that host has no return step and each seat runs its own claim. Like v3's claim, it guards an honest run, not an adversarial one. That host also runs H-7 with one item in flight under isolation none, because the dispatcher cannot read a harness worktree, and under shared isolation two items in parallel would mix their changes; `plan` refuses anything else until H-4's item branches reach that host. On the herdr host the dispatcher runs the check itself through a `dispatch.mjs handoff` command and resets the station's tree to its base before any re-run.

Which files are tests is a fact about the project, not the harness, so the globs move out of the Claude Code adapter into a per-project binding beside `team/checks.json`, which H-7, H-8, and the composer all read. That is what lets H-7 run unchanged on Codex. The default globs widen to the common conventions (`*.spec.*`, `*_test.*`, `test_*.*`), and writing source is defined as the complement: a changed path in no declared class and outside `.summon/`. A tester who edits test configuration such as `vitest.config.ts` is flagged unless the binding declares it.

**Blocked at the tool, where a seat is its own session (H-8).** On a host that starts each seat as its own Claude Code session, each seat's `--settings` carries `Edit()` deny rules composed from its boundary. Deny rules hold in every permission mode. They block the edit tools, and they also cover the shell commands Claude Code recognises as file commands (`cat`, `sed`, `tee`) and the targets of redirections, on every OS. They do not reach arbitrary subprocesses. There the sandbox is the layer, and it takes a glob from an `Edit` rule into its write list only on macOS, because on Linux and WSL2 it skips wildcard write entries. Every default test glob is a wildcard, so on Linux the composer would have to expand the globs into concrete paths at seat start, and directories created later would escape. The tester's boundary is a complement, which no deny rule can name, so the tester's seat runs in `dontAsk` with `Edit()` allow rules for its own globs. That narrows the file tools only: sandboxed shell commands run without approval by default, can write anywhere in the working directory, and the test suite the tester runs is itself code the tester wrote. H-8 is the early catch for the coder's commonest move; H-7 is the layer that holds for every boundary.

The enforcement report fills the level ADR-0015 reserved for a hook with the two that exist, `hand-off` (H-7) and `rule` (H-8), beside v3's `tool` and `prose`. It reports them per boundary, per host, and per OS, as `doctor` computes them, so whether the maker-checker split is enforced on a given install is answered before the run rather than after it.

### Cross-vendor seats are a separate decision

A seat held by another vendor's agent sends the project's code to that vendor, and Claude Code's hooks and sandbox do not exist in that agent's terminal. Cross-vendor seats are therefore split out of this PRD's host ADR into their own decision, taken only after H1's arm A reports, only with an equivalent sandbox for the other agent, and only as a recorded human decision per project. The human's own bake-off is the natural place to gather the evidence, and H-7 runs there unchanged because it reads git rather than the harness. The persona would travel as the `AGENTS.md` that most other harnesses read, emitted by a new adapter. Identity lives in the persona file, never in the skin, which no model sees; whether the persona survived the other model is the voice probe's call.

### What was cut

The draft proposed a Summon plugin for herdr. It is cut. The CLI calls above cover labels and notifications, and a plugin runs unsandboxed with control of every pane for the sake of convenience. If it ever returns, it is pinned to a commit that `doctor` checks against what herdr reports, it has no `[[build]]` or `[[startup]]` entries, it is never installed from a live checkout, and it waits out ADR-0010's cooldown.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| H-1 | herdr-aware pane labels from the wire, state in words | P1 | Inside herdr, a blocked seat's pane reads `· waiting on you` within two seconds; outside herdr, nothing is attempted |
| H-2 | `team/hosts/herdr.json`, `launch` templates per harness, `plan --host`, split isolation, `host` on `spawn` | P1 | `doctor` probes herdr's version and the socket and reports the host as unavailable rather than failing |
| H-3 | Containment preconditions for the herdr host | P0 | The raw-socket test fails from inside a seat; `doctor` refuses the host without the seccomp filter on Linux |
| H-4 | One branch per item with commit hand-off at each claim | P1 | On the `first-run` order, the coder's worktree contains the tester's commit, and the line check reads it from the returns |
| H-5 | One runner over a host interface | P1 | The parity test yields identical claims and returns from the Workflow and herdr hosts for the same plan |
| H-6 | Long-lived instances across items | P2 | An instance that handles two items logs both claims, both corroborated, and shows cache reads on the second |
| H-7 | Separation of duties checked at hand-off on every host, from a fixed per-station base tree to the hand-off tree, against globs in a per-project binding | P0 | On the Workflow host: a coder station that edits a test file and a tester station that edits a source file each get a failed `check` naming the path, and the next claim is refused; a coder that edits a test, fails, re-claims, and returns with no change still fails; a rename out of a test path is caught; `plan` refuses two items in flight under isolation none |
| H-8 | Separation of duties blocked per seat on hosts that start sessions: `Edit()` deny rules from the boundary, and `dontAsk` with allow rules where the boundary is a complement | P1 | On the herdr host, each seat tries an `Edit`, a `Write`, a `NotebookEdit`, and a shell write across its boundary; the enforcement report and `doctor` show which layer stopped each one, per OS, and H-7 catches whatever got through |

## Part 4: The world

### Rules every renderer follows

A renderer reads the ledger, the telemetry stream, and a skin. It never writes the ledger (apart from the human's `ack` in D-4), never feeds text into any model's context, and treats testimony as untrusted text, because a finding's summary was written by a seat that read a possibly hostile diff. In practice: text goes into the page through `textContent` only, data is embedded as `application/json` with `<` escaped, C0 and C1 control characters are stripped before anything reaches a terminal (an OSC 52 sequence in a finding could otherwise write the clipboard), and every export carries a content security policy of `default-src 'none'`. Each renderer is specified with the question it answers, and its gate times that question against `team-log.mjs render`, the table renderer v3 already has.

### The renderers

| Renderer | Surface | Answers | Phase |
|---|---|---|---|
| Party bar | Claude Code `statusLine` and `subagentStatusLine` | Who is running, on which model, at what cost; is anyone waiting on me? | 0 (read-only), 1 |
| Table | `team-log.mjs render` (v3, exists) | Everything, densely | exists |
| herdr labels | herdr's sidebar, through Part 3 step 1 | Which seat is waiting on me, and where is its terminal? | 1 |
| Replay with battle | Self-contained HTML export | Who vetoed this item and why, what got refuted, how did the verdicts split, and what did it cost? | 2 |
| Guild Hall | Local web page, starting as a quest board | Who is waiting on me, on which item, and for how long? | 4 |

The draft's assembly-line view is folded into the quest board, and sound is cut; neither answered a question for the person this PRD is for.

### The party bar

The cheapest renderer and the first one built, read-only in Phase 0. Claude Code hands a `subagentStatusLine` script every running subagent with its `name`, `model`, `effort`, and `tokenCount`, and hands the main status line `agent.name`, `model`, `effort`, and `cost`. A Summon status script joins those with the ledger and prints one line per seat: a coloured glyph and the name, station, the model it actually ran on, tokens, and its state in words, plus the dissent line and the last control result. It colours a glyph rather than the name, honours `NO_COLOR`, and says "waiting on you" or "uncorroborated" in words rather than turning anything red. Where Claude Mods are available (2.1.287 and later), the same data can render as a live band inside Claude Code; the status line stays the floor because it works on every install.

### The replay and the battle

`world.mjs export --order <id>` writes one HTML file with the ledger slice, the redacted telemetry slice, the skin, and the sprites inlined as data URIs. It opens offline, scrubs by time, and plays at any speed. By default it shows severities, verdicts, refutations, costs, and timings, and no finding text, because a speech bubble in a replay attached to a public PR can disclose an unfixed vulnerability. Finding text is an explicit option for private use. Exports are built from a field allowlist and never include detail-mode telemetry.

Each review renders as a turn-based battle. The lenses act in parallel, so hits appear in timestamp order, each labelled with its severity in words. A refuted finding shows REFUTED with the skeptic's reason, and the finding stays visible, because a skeptic refuting a real defect is the case the audition treats as worst. The skeptics are drawn as one chorus with a count. Hit effects stay under three flashes a second. A second tab draws Dani's "diff as a map": files as tiles, a banner where each lens filed a finding, knocked over when it was refuted. It is the one picture of content divergence (D-1), which shows whether the lenses were looking at different things or echoing each other.

### The Guild Hall

The hall answers "who is waiting on me?" for a work order in flight, and it starts as Dani's first sacrificial concept, the quest board: items pinned under station banners, each live seat standing under its item's notice with its state in words and a timer. It is cheap, readable, and absorbs the old line view. It is mocked on paper with the `first-run` order before any code, and its timed gate is "who is waiting on me" against `team-log.mjs render`.

A fuller room (fixed stations, no walking, a review cutting to the battle) is the second concept, built only if the quest board passes its gate and the human wants the charm. It needs art the sprites do not have yet: every 16-bit sprite has its stage token baked in, so a bob drags the floor with it, and a raised hand is a new pose. The minimum art is re-exports without the token, one working frame per persona, a shared emote sheet, and motion in whole master pixels, with no walking, under Dani's art bible and its lossless-PNG rule (the team-directives drop-in convention names the older HD-2D path and does not apply). The canon world cannot depend on `site/`, which the scaffolder excludes, so the sprites move into the skin's directory, or the scaffolded world falls back to v3's `plain` skin.

`world.mjs serve` binds loopback only, checks the `Host` header against DNS rebinding, swaps a one-time URL token for an `HttpOnly; SameSite=Strict` cookie on first load so the token does not linger in history, sends `Referrer-Policy: no-referrer`, and serves read-only endpoints. Its usage gate counts local `serve` launches against work-order sessions, with no telemetry leaving the machine.

### Status effects

Each status leads with plain words and is computed from events. The JRPG name is the skin's flavour on top, in the `jrpg-16bit` skin only. Statuses about an item go on the item's notice, never on a persona, so no badge blames a seat for something the process did.

| Plain label | Skin flavour | Computed from | Shown on |
|---|---|---|---|
| Agreeing without diverging (10 items) | *Echo* | A full window of ten real items whose verdicts were unanimous **and** whose findings overlapped above the D-1 threshold | the formation; the order stops until acknowledged (D-4) |
| Uncorroborated verdict | none | Testimony with no bracketing out-of-band events (W-4) | the item |
| Seat never started | none | An `absent` event: an expected seat that never started (W-10) | the item, never the persona, since the coordinator or the harness skipped it |
| Crossed its boundary | none | A failed hand-off check (H-7) | the item |
| Out of order | none | `check --line` reports an out-of-order or same-instance station | the item |
| Waiting on you, 3 min | the seat holds up a card | A `block` with no `unblock` | the seat |
| Context compacted | *Fatigue* | A `compact` in the seat's current session | the seat |
| Unaudited model | *Stale gear* | C-3's definition | the seat |
| Voice drift (judged) | none | The voice probe's judged check failed on recent outputs | the seat, labelled as judged |
| Budget 84% | none | An item past 80 percent of its token budget | the item |

### Accessibility

Dani reviews every renderer before it ships, against this floor. `pnpm check:css` cannot see colours drawn on a canvas and is advisory under ADR-0013 § 6, so the world gets its own `node --test` case that runs the checker's contrast function over every accent against the named hall background, plus axe on the DOM. On the site's `#0f172a`, six accents fail 4.5:1 as text (Pierrot 1.78, Pat 2.23, Diego 3.33, Prof 3.63, Vik 3.75, Grace 4.22), and Pierrot, Pat, and the formation's `#4f46e5` (2.84) fail even 3:1, so accent text is lifted with the team-directives `color-mix` rule, and the sprite rim is baked into the frames because CSS filters do not survive `drawImage`.

The hall has a visible pause control (WCAG 2.2.2) as well as honouring reduced motion. Severity and state are always in words as well as colour (1.4.1). One polite `role="status"` region announces only what needs the human (a block, a verdict, a status raised, an escalation, an order done), at most once every ten seconds, and never telemetry; the event list is not `role="log"`, and scrubbing a replay stays silent. The canvas is mirrored by a DOM list of buttons named by state ("Sato#1, green, item 42, waiting on you 3 min"), because the skin's `alt` text describes a portrait, not a state, and the seat dialog returns focus when it closes.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| V-1 | Party bar status scripts | P0 read-only, P1 full | In Phase 0, a running review formation shows one line per lens with the model it ran on, its tokens, and its state in words |
| V-2 | `world.mjs serve` with the controls above | P2 | A request without the cookie, from a non-loopback address, or with a foreign `Host` header is refused; the token is gone from the URL after first load |
| V-3 | Guild Hall as a quest board | P2 | A paper mock first; then the timed "who is waiting on me" task beats `team-log.mjs render` |
| V-4 | Status effects computed from events, plain label first | P0 | Each status has a fixture that raises it and one that does not |
| V-5 | Replay export, severity-only by default | P1 | The export opens offline and contains no prompt, file content, command, or finding text from the fixture |
| V-6 | Battle and map views inside the replay | P1 | The timed "who vetoed item X and why" task beats `team-log.mjs render`; the battle redraws the v3 negative-control run with its 34 findings, 6 refutations, and five verdicts |
| V-7 | Accessibility floor | P0 | The contrast test and axe pass; the pause control, status region, DOM mirror, and focus return each have a test |
| V-8 | Skin never in context; testimony never rendered as markup | P0 | The composer test that pins the first is extended to every renderer asset; a fixture finding containing `</script>` and an OSC 52 sequence renders as inert text everywhere |

## Part 5: Dissent instruments

v3's `disagreement-rate` reads verdicts. The first run showed the gap: five lenses each vetoing a diff with four critical defects is unanimity on the scale and disagreement on the content. Five instruments widen what Summon measures, make one of them stop the work, and run the whole chain on demand.

| ID | Instrument | Priority | Phase |
|---|---|---|---|
| D-1 | **Content divergence.** Per item, the pairwise overlap of findings between lenses, keyed on file and a small line window. High overlap with a unanimous verdict is the real *Echo*; low overlap with a unanimous verdict is agreement worth having. | P0 | 1, with V-4 |
| D-2 | **Independence weighting.** Agreement between two lenses on the same model counts less than agreement across models; the report shows both numbers. | P2 | after H1 arm A |
| D-3 | **Corroboration report.** The share of verdicts and returns that are corroborated, per host. Pane state from herdr never counts toward it. Below the target set after the Phase 0 baseline, the report says the dissent rate itself is untrustworthy before it says anything else. | P0 | 0 |
| D-4 | **Fail closed.** When a full window is unanimous and overlapping, the dispatcher refuses to close the order until the human writes an `ack` event naming what they checked. | P1 | 1 |
| D-5 | **The cascade audit.** One run checks every link of the chain on two paths: a ceremony started the way a human starts it in conversation, and the same work dispatched as a work order. It reports absences (W-10), voice (the C-8 probe with and without each persona that ran), and contest (the arguable fixture, below). Every run plants one absence on each path, which must come back as exactly one `absent`, so a wire that has gone blind cannot pass as a clean one. It runs on every model release, every Claude Code release, and on a calendar the human sets, and its report is the evidence G0 asks for. | P0 | 0 for absences; 1 in full |

The arguable fixture is the third option the first-runs report put to the human on 2026-09-10 and the human did not take: a diff that a careful team should split on, where each floor lens has something true to say and the verdict turns on how it is weighed. It does not reopen that decision. The negative control still measures presence, and the dissent rate over ten real items still measures spread on real work. The fixture exists so that a release can be checked on the day it lands, rather than after ten real items, which by the post's own timeline can take months. Its run count and pass bar are pre-registered with the fixture. It is held out like a test set: no persona is ever edited against it, and a failure is never fixed by tuning a persona until it passes, which would be the curve-fitting the post warns about. A failure is a G0 condition and evidence the human weighs. Whether it should also count under ADR-0015's reversal trigger 1, which the 2026-09-10 decision keyed to presence and to spread over ten real items, is the human's call in the ADR-0015 fold-in.

The negative control also gets a schedule: every audition runs it, and the human can opt into a weekly run.

## Security and privacy

Pierrot owns this section's review and the threat-model entry it requires. The entry needs a home first; issue #123 records that `docs/security/` does not exist, and Phase 0 cannot pass its gate until that is resolved.

| Surface | Threat | Mitigation in this PRD |
|---|---|---|
| The wire, a hook outside the sandbox | Talks to the model through stdout or JSON output; hangs on a planted FIFO; runs code a seat edited | W-3's hook contract; code pinned outside every worktree (W-7); `ConfigChange` guard, no `bypassPermissions`, and the `check --line` diff rule (W-9) |
| The ledger | A seat forges out-of-band lines or relabels testimony | Seat CLI stamps `seat`; the edit tools are denied on the ledger; out-of-band claims hold only where seats are sandboxed, and `doctor` and every ceremony say whether they are |
| Project hooks in CI | `claude -p` on a PR checkout runs any project hook with the job's secrets | The wire is never wired from project settings; scaffolded projects' runbooks carry the `disableAllHooks` line for CI |
| herdr's socket | A seat drives other panes: approves their prompts, reads them, spoofs their state, installs plugins | Step 1 gives seats no access; step 2 requires the containment preconditions (H-3), with the string-matching hook demoted to a tripwire |
| Testimony in renderers | Markup injection in the hall or a replay; terminal escape sequences | The renderer rules and V-8 |
| Secrets in streams and exports | Tokens in commands, findings quoting secrets, usernames in paths | Redaction at append (W-6); severity-only exports built from a field allowlist (V-5) |
| The local server | Token leakage through history, Referer, or a shared screen; DNS rebinding; cross-site POSTs to a write endpoint | V-2's controls; the optional OTLP receiver requires a header token, an exact `application/json` content type, and a body size cap |
| herdr and its detection rules | A compromised release; rules updated remotely | ADR-0010's cooldown for herdr; the rule-set version on every `host` event |
| Cross-vendor seats | Code leaves for a second vendor; no Claude hooks or sandbox there | A separate decision after H1 arm A, with an equivalent sandbox |

ADR-0012 already reserves the hook layer for enforcement, gates the first canon hook on Pierrot's threat model, and sequences the capability registry (its sub-decision E) first. The wire would be Summon's first hook of its own and its first observe-only one, so the wire ADR amends ADR-0012 B to admit observe-only hooks, and the registry has to exist before the wire can be entered into it. ADR-0014 § 4's zero-hooks rule governs third-party add-ons and needs no change.

## Phasing and earn-gates

Three prerequisites come before Phase 0. ADR-0012 E's capability registry has not shipped on `main` or on the v3 branch, and the wire needs it (its 90-day checkpoint, 2026-10-24, already counts that as a reversal trigger). Issue #123 must give the threat model a home. And issue #109 must make CI run on stacked PRs, or the phases below merge unchecked. ADR-0015's ratification and step 7 cutover gate Phase 1, not Phase 0, because Phase 0 runs on recorded fixtures.

| Phase | Builds | Earn-gate before the next phase |
|---|---|---|
| 0. The wire, visible | The live Workflow probe first, then W-1 to W-7, W-10, D-3, D-5's absence probe, V-1 read-only, V-4 for *Uncorroborated verdict* and *Seat never started*, the threat-model entry, and a baseline run: Phase 0's own items through the v3 line on all-inherit, plus the absence probe on both paths | The probe's result is recorded; both W-4 fixtures and every W-10 fixture caught; the hook contract tests pass; Pierrot's gate passes; the baseline records cost per item, a first recall corpus, the first dissent samples, and how often the conversational path skipped a declared seat on today's model and harness |
| 1. Casting and dissent | C-1 to C-5, C-8, C-10, C-11, D-1, D-4, D-5 in full, V-4 in full, V-7, V-8, W-9, H-1, H-7 | The first audition blocks a deliberately broken candidate and passes the default; the human promotes a casting; cost per item is reported against the baseline; the first full cascade audit is filed |
| 2. Replays, the gate line, and H1 arm A | V-1 full, V-5, V-6, C-6, C-7, C-9 arm A, C-12 | The battle beats the table on "who vetoed and why"; H1 arm A reports, null allowed; a gate order runs clean |
| 3. The herdr host | H-2 to H-5 and H-8, after the need gate | The raw-socket test fails from a seat; the parity test passes; the `first-run` order runs with zero line violations, every return corroborated, the tester's commit in the coder's worktree, and both of H-8's refusals made by the tool |
| 4. The hall and what H1 earns | V-2, V-3, H-6, W-8, D-2, the minimum art, and the cross-vendor decision if arm A justified it | The quest board beats the table on "who is waiting on me"; `serve` launches show the hall in use |

If the hall is not opened in most work-order sessions sixty days after it ships, counted by local `serve` launches, it is deleted, and the party bar and replays stay. ADR-0014 used the same kind of trigger for an unused prompt.

## Success measures

Targets are set from the Phase 0 baseline; the draft's 40 percent cost cut and two-day re-audition were arithmetic on assumptions and are withdrawn.

| Measure | Target | Source |
|---|---|---|
| G0: the notice can come down | Every G0 condition on the current model | the G0 tracking doc |
| Corroboration, per host | Set after the baseline, reported from Phase 0 | D-3 |
| Files changed outside the fitted list on the next model release | zero | ADR-0015 reversal trigger 3, read against the list |
| Items run on an unaudited model without an acknowledgement | zero | C-3 |
| Review cost per item against the Phase 0 baseline | lower, by a margin set after the baseline | wire cost samples |
| Planted defects refuted by skeptics | zero | auditions |
| Voice probe on every seat an audition or cascade audit exercises | passes with the persona, and differs from the run without it | auditions, D-5 |
| Expected seats absent on the dispatched path, with each run's planted absence caught | zero | D-5, W-10 |
| Expected seats absent on the conversational path | reported per release against the Phase 0 baseline | D-5, W-10 |
| The arguable fixture | verdicts split at the pre-registered rate | D-5 |
| Station returns that crossed a separation boundary and were built on | zero | H-7 |
| Same work order on two coordinating models | identical spawn sequences | G3 fixture |
| Timed tasks against `team-log.mjs render` | faster for the battle and the hall | Phase 2 and Phase 4 gates |

## Architecture Gate: the ADRs this needs

The ADRs below are meta, because they are about building Summon; each asset they introduce is classified on its own. Each goes through Archie's authorship, Wei's challenge as a standalone agent, and the human's approval, and is numbered when written, after ADR-0015 lands, since `check-canon` requires contiguous numbers.

| Decision | Where | Gate notes |
|---|---|---|
| The closed list of fitted locations; `by` with `unattributed` for old lines; H-7's claim semantics, `tree` on `claim`, and the enforcement report's new levels; the ceremony binding in the party; the per-project binding for `paths`; and whether the arguable fixture counts under reversal trigger 1 | Folded into ADR-0015 at its ratification | Saves the ADRs below from amending ADR-0015 straight away; H-7 is P0 in Phase 1, and only this fold-in can carry it there |
| The wire: out-of-band events, corroboration, `expect` and `absent` with the compiled expectations table, the hook contract, where the wire's code lives | New ADR | Amends ADR-0012 B to admit observe-only hooks; needs ADR-0012 E's registry entry, a canon source, and an escape hatch; records the live Workflow probe and its fallback; Pierrot's threat-model pass first |
| Casting and auditions: one-model default, block-never-promote, posture as an output style, voice probes and D-5's voice half, the gate line | New ADR | Shares the fitted list with ADR-0015 |
| Host adapters: herdr-aware labels, the herdr host, containment, item branches, one runner, H-8 | New ADR | Opened only with the need-gate record; version-pin and probe discipline from ADR-0012 E; records that H-8 fills ADR-0015's reserved enforcement level with permission rules rather than a hook |
| Cross-vendor seats and data egress | New ADR, later | Only after H1 arm A |
| The world: renderer rules, the local server, replay defaults, the accessibility floor, plain words first | New ADR | Dani's accessibility gate; "view never in context" carried over from ADR-0015 |

Under ADR-0012 E, H-7's script and H-8's composed settings are enforcement adapters just as the wire is, so each gets a registry entry naming its canon source and the minimum versions it depends on (`dontAsk`, the copying of `Edit` rules into the sandbox, `Stop`'s `background_tasks`).

| Asset | Zone |
|---|---|
| Casting schema, `team/casting/` format, wire, world server, host adapter format, status vocabulary | Canon: they ship into user projects |
| Summon's own casting, audition reports, replay set, the G0 tracking doc | Meta, unless the human answers open question 2 by shipping a default casting |
| Sprites | Currently under `site/`, which the scaffolder excludes; they move into the skin's directory, or the canon world falls back to the `plain` skin |

## Alternatives considered

**Stay on v3 as it is.** This is the strongest alternative, and review moved the PRD toward it. The wire, casting, the dissent instruments, the party bar, and the replays all run on v3's Workflow host; the Workflow host already takes `model` and `effort` per agent and runs as a script no model has to choose to call; and ADR-0015's cutover fixes the registry failure on its own. What staying gives up is only what Part 3 step 2 adds, and step 2 now waits for a need gate. If that gate never fires, this is where Summon lands, and it is a good place.

**Move herdr to its own PRD.** Wei's counter-proposal, half adopted. The host itself is need-gated and fenced behind containment, as a separate PRD would have done; the herdr-aware labels stay here because they cost almost nothing, give seats no new power, and the human asked how Summon would fit into herdr.

**Claude Code agent teams as the host.** First-party, panes in tmux, a task list and a mailbox, and teammates can use custom subagent definitions, so the persona survives. It loses for now on three counts: it is experimental and Claude-only, its lead coordinates by conversation where Summon needs a plan a script computes (ADR-0012 already rejected it as a substrate for that reason), and `skills`, `hooks`, and `permissionMode` do not apply to teammates. It should be re-read when the experiment flag is removed.

**Adopt an external orchestrator.** Gas Town is the strongest candidate and overlaps this PRD more than any other project: persistent worker identities, a merge queue that verifies before merging, watchdog roles, and agents from several vendors in tmux. Adopting it would hand Summon's dispatch to a system built for throughput, with its own vocabulary and tracker, when Summon's product is the decision record, the vetoes, and measured dissent. Two doors stay open: a Beads tracking adapter beside the GitHub Projects and Jira ones, and a Gas Town host adapter for a user who already runs a town. A user who wants throughput above accountability should use Gas Town, as the README already says about bare agents.

**One model everywhere at varied effort.** Adopted as the default rather than rejected; anything else has to earn its way in through H1 and an audition.

**An off-the-shelf tracing backend instead of a world.** Langfuse, Phoenix, or any OTLP backend would show spans, tokens, and costs with no UI to build, and W-8 keeps that door open. A span view cannot show a seat, a verdict, or a disagreement, which are what Summon exists to make visible.

**A VS Code extension in the manner of Pixel Agents.** Many developers live there, and the replay could later sit in a webview. Starting there would tie the world to one editor while the herdr labels and party bar are terminal-first.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The world becomes a toy nobody uses for decisions | Medium | Question-per-renderer, timed tasks against the existing table, the quest board before the room, and the sixty-day delete trigger |
| "Corroborated" is read as "proven" | Medium | The principle and the security table say what it is not; every ceremony announces whether seats were sandboxed |
| A seat forges or edits its own instruments | Medium without the sandbox, low with it | W-7, W-9, the seat CLI's `by` stamp, and the sandbox mode reported on every run |
| Cross-pane control through herdr's socket | High without containment | The host does not exist without H-3; step 1 gives seats nothing |
| A skeptic cast too cheaply refutes real findings | Medium | The zero-refuted-plants floor in every audition |
| Goodhart on dissent: pressure to disagree for the meter | Low for seats, real for humans | Seats never see the meter; the human sees content divergence beside the verdict rate, and D-4 asks what they checked |
| herdr changes fast: v0.7.0 to v0.9.3 between June and September 2026, with a breaking removal in v0.9.2 | High | Fitted host adapter, version pin, cooldown, `doctor` probe, and two other hosts |
| Claude Code changes hook payloads | Medium | The wire is fitted to the harness, tested against recorded payloads, and fail-open |
| Scope: a solo developer drowns in panes and pages | Medium | Every phase stands alone; Phase 0 is a status line and a report |
| The conversational path keeps skipping seats on instructions the harness injects | High | Not fought with prose: absences are visible the same day (W-10), the gate moves onto a line (C-12), and open question 8 asks whether ceremonies default to work orders |
| The arguable fixture becomes a target that personas are tuned to pass | Medium | Held out like a test set; a failure is read under ADR-0015's reversal trigger 1 and never fixed by a persona edit made against it |
| Read as a single-cause story, the chain hides a decay that enters lower down | Medium | Every link has its own instrument, and D-5 runs them together on a calendar as well as on releases |
| An instrument goes blind and reads as clean | Medium | Each D-5 run plants an absence on each path; the live Workflow probe; `doctor` probes the hook payload fields the wire relies on |

## Open questions

These are live, and the human decides each one. Where a reviewer recommended an answer, it is noted.

1. Should the ledger stay git-tracked once out-of-band events land? This PRD keeps it tracked with semantic events only; the v3 dispatch review chose tracking so CI can read it, and nothing here overturns that.
2. Does a default casting ship into scaffolded projects as canon, or does every project start on one model with varied effort and audition its own? Pat recommends shipping none.
3. Is promotion always a human act? This PRD says yes, and Pat agrees.
4. What counts as need for the herdr host's gate? This PRD proposes the three cases in Part 3; the human may want a stricter or looser bar.
5. Which of Dani's three hall concepts does the human want mocked first: the quest board (recommended), the room, or the diff as a map? Dani asks which one the human hates.
6. Summon has no design profile (`docs/design-profile.md` is still a scaffold stub), which ADR-0013 makes the human's to write. Dani recommends filling it before the hall is designed.
7. Is a generated output style the right place for the coordinator's posture, or should the coordinator become a composed seat run through Claude Code's `agent` setting?
8. Should a ceremony that declares seats run as a work order by default, so that the conversational path, where a harness instruction can still skip a seat, becomes the exception? This PRD leans yes for the review formation and the gate, and leaves the rest to the human.
9. What calendar should D-5 keep? The post's own audit runs every six months; the server-side line argues for something shorter, such as monthly, since it arrived with no release to trigger a check.

## Related in-flight work

Reconnoitred on 2026-10-05 per the Session Entry Protocol. Nothing below was changed by this PRD.

| Item | Relation | Suggested disposition |
|---|---|---|
| #138, ADR-0015, branch `claude/summon-team-v3-decomposed-jyiur2` | Prerequisite; Phase 1 needs its ratification and cutover | Ratify (Archie's gate read is owed), folding in the fitted list and `by`; then cut over |
| ADR-0012 E (capability registry), not shipped | Gates Phase 0; its checkpoint on 2026-10-24 counts it as a reversal trigger | Build it first |
| #123 `docs/security/` does not exist | Blocks Phase 0's threat-model gate | Resolve now |
| #109 CI only runs on PRs into `main` | Stacked phase PRs would merge unchecked | Fix now |
| #129 review wave that never spawned reports as complete | Answered by W-4 and D-3 | Keep open until W-4 lands; link this PRD |
| #79 prompt injection through add-on skill content | Same class as cross-pane control through herdr | Cross-reference in the host ADR |
| #74 no meta zone for living registers | This PRD sits in `docs/history/design/` meanwhile | No change |
| #31, #32, #33 behavioral benchmark | Auditions are smoke tests; quality claims stay with the benchmark | No change |
| #121, #124, #128 packet harvester; PRs #95, #105, #116, #120, #131 | Superseded by v3 on the human's direction of 2026-09-09; the wire gives the harvester's goal an out-of-band source | The human closes them, as recorded in the v3 handoff |

## Terms this PRD introduces

When an ADR adopts one of these, the definition moves to `docs/methodology/team-layers.md` and this table links there.

| Term | Meaning |
|---|---|
| Testimony | A ledger event whose content comes from a model, written by the seat itself or relayed by `ingest` |
| Out-of-band event | A ledger event written by a script or hook the seat does not run; not proof, and resistant to forgery only where seats are sandboxed |
| Corroborated | A verdict or return bracketed by out-of-band `start` and `stop` events for the same instance, item, and lens or station |
| Casting | The fitted file that gives each seat and station a model and an effort level |
| Audition | The four-probe run that can block a casting; promotion is the human's |
| Host | What starts a seat: prose subagents, the Workflow tool, or herdr |
| herdr-aware | Summon labelling the herdr panes it already runs in, without starting seats in panes |
| Posture block | The coordinator's delegation and verification guidance for one model family, emitted as an output style |
| Status | A plain-language label computed from events, with optional skin flavour |
| Absent | An out-of-band event for a seat that a work order or ceremony expected and that never started; distinct from v3's `skipped`, a conditional lens that `prepare` deliberately left out |
| Cascade audit | D-5: one run that checks absences, voice, and contest on the conversational and dispatched paths |
| Arguable fixture | A held-out diff that a careful team should split on; it measures contest on the day of a release |
| Hand-off check | H-7: the check, at the next claim or hand-off, that a station changed no path its role must not touch |

## Sources

Read on 2026-10-05 unless noted. Facts about herdr come from its repository at commit `e35f393` (2026-10-04) and the documentation source for v0.9.3 inside it, because herdr.dev was not reachable from the drafting environment.

**This repository and its v3 branch**

- `README.md`, the deprecation notice of 2026-08-18.
- ADR-0005, ADR-0006, ADR-0007, ADR-0012, ADR-0014 in `docs/adrs/meta/`; ADR-0013 in `docs/adrs/`; `docs/process/ai-tells-catalog.md`; `docs/team-directives.md`; `docs/history/design/team-hero-sprites-16bit.md`; `scripts/check-css-contrast-motion.mjs`; `site/src/components/TeamGrid.astro`.
- On `claude/summon-team-v3-decomposed-jyiur2`: `docs/adrs/meta/0015-decomposed-team.md`, `docs/methodology/team-layers.md`, `docs/history/tracking/2026-09-10-first-runs.md`, `docs/history/tracking/2026-09-09-v3-handoff.md`, `team/events.json`, `team/harness/claude-code.json`, `team/views/jrpg-16bit/party.json`, `team/personas/*.md`, `team/workflows/line.workflow.mjs`, `team/workflows/review-wave.workflow.mjs`, `scripts/dispatch.mjs`. Issue #138 and its comments.
- The review of this PRD: `docs/history/tracking/2026-10-05-summon-live-prd-review.md`.

**The post**

- *I Killed My Agent Team*, 2026-08-15: https://innerloopai.substack.com/p/i-killed-my-agent-team. Read from its published source; the quotations about the injected line, the order of the symptoms, the May 15 date, the two hypotheses, the bake-off, and the six-month audit come from it.
- claude-code issue #80988, the injected section, as the post cites it: https://github.com/anthropics/claude-code/issues/80988

**Anthropic**

- *Prompting Claude Opus 5*: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
- *Prompting Claude Fable 5*: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
- *Prompting Claude Fable 5.1*: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1
- Migration guides index: https://platform.claude.com/docs/en/about-claude/models/migration-guide (the Opus 4.8 delegation note is quoted from the migration notes bundled in Claude Code's `claude-api` skill)
- Pricing and models overview: https://platform.claude.com/docs/en/about-claude/pricing, https://platform.claude.com/docs/en/about-claude/models/overview
- *Harness design for long-running apps* (2026-03-24): https://www.anthropic.com/engineering/harness-design-long-running-apps
- *How we built our multi-agent research system* (2025-06-13): https://www.anthropic.com/engineering/multi-agent-research-system

**Claude Code**

- Subagents (frontmatter `model`, `effort`, `color`; nesting depth 3; 20 concurrent): https://code.claude.com/docs/en/sub-agents
- Hooks (handler types, `async` and its unenforced timeout, stdout as context on `SessionStart`, `UserPromptSubmit`, `UserPromptExpansion`, and `PostModelSwitch`, `UserPromptExpansion` matching on `command_name`, `disableAllHooks`, `ConfigChange`, `agent_type` under `--agent`): https://code.claude.com/docs/en/hooks
- Permissions and permission modes (`Edit()` rules, deny rules in every mode, `dontAsk`): https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/permission-modes
- Settings reference (`Edit` rules copied into the sandbox's write lists; wildcard write entries skipped on Linux and WSL2; `workflowSizeGuideline`): https://code.claude.com/docs/en/settings-reference
- Sandboxing (shell-only scope, write limits, Unix sockets and the seccomp filter, `credentials.envVars` scopes): https://code.claude.com/docs/en/sandboxing
- Monitoring with OpenTelemetry: https://code.claude.com/docs/en/monitoring-usage
- Status line and `subagentStatusLine`: https://code.claude.com/docs/en/statusline
- Agent teams: https://code.claude.com/docs/en/agent-teams
- CHANGELOG, versions 2.1.202, 2.1.212, 2.1.217, 2.1.219, 2.1.224, 2.1.271, 2.1.274, 2.1.287: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

**herdr**

- Repository and releases (v0.9.3, 2026-09-29): https://github.com/herdrdev/herdr
- Docs source for v0.9.3: `docs/versions/0.9.3/website/src/content/docs/` (`agent-automation.mdx`, `cli-reference.mdx`, `socket-api.mdx`, `plugins.mdx`, `configuration.mdx`), rendered at https://herdr.dev/docs/
- Declined orchestration requests: herdr issues #4027, #2871, #2742, #3568

**Community**

- Gas Town: https://github.com/steveyegge/gastown, and Beads: https://github.com/steveyegge/beads
- Pixel Agents: https://github.com/pixel-agents-hq/pixel-agents
- disler, *claude-code-hooks-multi-agent-observability*: https://github.com/disler/claude-code-hooks-multi-agent-observability

**Research**

- Kim, Garg, Peng, Garg, *Correlated Errors in Large Language Models*, ICML 2025: https://arxiv.org/abs/2506.07962
- Goel et al., *Great Models Think Alike and this Undermines AI Oversight*, ICML 2025: https://arxiv.org/abs/2502.04313
- Choi, Zhu, Li, *Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models?*, NeurIPS 2025: https://arxiv.org/abs/2508.17536
- Cemri et al., *Why Do Multi-Agent LLM Systems Fail?* (MAST), 2025: https://arxiv.org/abs/2503.13657
- *Measuring and Exploiting Contextual Bias in LLM-Assisted Security Code Review*, 2026: https://arxiv.org/abs/2603.18740
- *Refute-or-Promote: An Adversarial Stage-Gated Multi-Agent Review Methodology for High-Precision LLM-Assisted Defect Discovery*, 2026: https://arxiv.org/abs/2604.19049
