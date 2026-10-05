---
agent-notes: { ctx: "PRD: live seats, model casting, herdr host, visual world", deps: [README.md, docs/adrs/meta/0005-behavioral-benchmark.md, docs/adrs/meta/0006-multi-runtime-install.md, docs/adrs/meta/0012-executable-canon.md, docs/adrs/meta/0014-optional-addons.md, docs/process/team-governance.md, docs/history/design/team-hero-sprites-16bit.md, site/src/components/TeamGrid.astro], state: draft, last: "claude@2026-10-05", key: ["builds on ADR-0015 (Proposed) on branch claude/summon-team-v3-decomposed-jyiur2, issue #138", "four parts (wire, casting, herdr host, world), each phase earn-gated; personas never change when models do", "spec only: four ADRs and an Architecture Gate come before any code; Pierrot gates the first Summon-authored hook"] }
---

# Summon Live

**Product requirements document.** Draft for the human's review, 2026-10-05.

| | |
|---|---|
| Owner | Pat (scope, acceptance). Archie owns the ADRs this PRD asks for. |
| Drafted by | The coordinator, at the human's request, on `claude/multi-agent-coding-improvements-ip34gt` |
| Builds on | ADR-0015, *The Decomposed Team* (Proposed, 2026-09-09), on branch `claude/summon-team-v3-decomposed-jyiur2`, epic #138 |
| Zone | Meta (ADR-0007 § 1). This is about building Summon; nothing here ships into a scaffolded project until an ADR classifies it. |
| Decides | Nothing yet. Every part that changes architecture needs its own ADR and an Architecture Gate before code. |

## Summary

Summon v3 split the fused agent file into a role, a persona, a skin, and a fitted harness adapter, and gave the team an event log that no harness owns. That answered the structural half of the August deprecation. The operational half is still open: every seat runs on `model: inherit`, the structured work rests on subagent primitives whose limits moved twice this summer, and half of the event log is the seats' own account of themselves. The team is also invisible while it works, so the human learns what happened by reading JSONL afterwards.

Summon Live adds four things on top of v3, in an order where each one is useful without the ones after it:

1. **The wire.** Harness hooks, the dispatcher, and the multiplexer write the record from outside the model, and every event says who wrote it. A review that never spawned can no longer pass as a completed review (#129).
2. **Casting.** Each seat and station gets a model and an effort level from a fitted file that expires on every model release, and no casting is promoted until it passes an audition on the negative control. The persona never changes when the model behind it does.
3. **The herdr host.** A work order can run each seat as its own long-lived session in a [herdr](https://github.com/herdrdev/herdr) pane instead of as a subagent, so the team's shape comes from the dispatcher and stops depending on whether the coordinating model feels like delegating today. The human can walk up to any seat and watch it work.
4. **The world.** Renderers draw the log through the 16-bit skin Summon already has: a party bar in the terminal, a herdr wall, a Guild Hall in the browser where the sprites work at their stations, a review rendered as a turn-based battle, and a replay you can attach to a PR. Every status effect on screen is computed from the log and maps to a real failure mode.

How the parts fit, with v3's pieces unmarked and this PRD's additions marked `+`:

```
STARTS THE SEATS              WRITES THE RECORD                       READS THE RECORD

work order                    dispatch.mjs       spawn, claim     ─┐
   │                          run-checks.mjs     check, receipt    │
dispatch.mjs                + wire.mjs           start, exit,      ├─► ledger ──────┬─► checks: dissent, control,
   │ + cast from casting                         cast, block       │   (tracked)    │   line, + witness
   │                        + herdr host         block, unblock    │                │
host: + herdr, Workflow,      seats (testimony)  claim, finding,  ─┘                └─► + renderers, with the skin:
      or subagents                               verdict, return                        party bar, herdr wall,
   │                                                                                ┌─► Guild Hall, battle, replay
seat sessions on a cast     + wire.mjs           tool calls, cost ───► + telemetry ─┘
                                                                         (untracked)
```

## A night with the party

The scenario is illustrative. Every number in it would come from the log.

At 22:40 the human hands Grace a work order: three items on the `tdd` line. `dispatch.mjs open --host herdr` creates the worktrees and a herdr workspace. Panes come up titled by seat and instance (`Tara#1 · red`, `Sato#1 · green`, `Review#1`), each one a Claude Code session started as its composed seat, on the model and effort the casting file names for that station. Tara#1 runs on Sonnet 5.5 at high effort and starts red on item 1. In the browser tab, the Sentinel Archer walks to the range.

At 22:52 Sato#1's pane turns yellow in herdr's sidebar: blocked on a permission prompt for `curl`. The Forge-Knight in the Guild Hall stops hammering and raises a hand, and the human's phone gets one notification. The human answers from the herdr pane, where the whole terminal is live, and goes back to the sofa. Had nobody answered for five minutes, the Forge-Knight would have fallen asleep at the anvil, which is the *Sleep* status.

At 23:30 item 1 reaches the review table. The formation convenes as a battle: Vik, Tara's test-quality lens, Pierrot, and Archie's conformance lens take turns against the diff. Each finding lands as a hit coloured by severity. The skeptic stage, cast on Sonnet 5.5 at low effort because it is forty agents out of forty-five, refutes three of them, and those show as MISS with the skeptic's reason underneath. The bubble over Vik shows the first line of the finding Vik actually filed. Verdicts split (revise, revise, accept, revise) and the dissent meter in the corner ticks up.

Item 3 goes badly. Sato#2's session compacts twice (*Fatigue*), the green station returns `ok: false`, and the casting file's escalation rule re-runs it on Opus 5.5. In the morning the human scrubs the replay to 01:14, sees where the escalation happened and what it cost, and drags the exported replay into the PR description, where a reviewer can watch it without installing anything.

No agent saw any of it, because the skin, the meter, and the badges never enter a model's context.

## Why now

### What the deprecation named, and how far v3 got

The README's notice of 2026-08-18 names four causes and one failure mode. ADR-0015 answers part of each; this PRD exists for the parts it leaves open, most of which ADR-0015 itself names.

| Named on 2026-08-18 | What ADR-0015 does | Still open | Answered here by |
|---|---|---|---|
| Opus 5 guidance inverted delegation and verification | Adapter field `delegation: null`; the line runs as a workflow, not a prose mandate | The conversational coordinator still carries one posture for every model | Casting (posture profiles) |
| Subagent defaults churned | `dispatch` limits moved into the adapter, labelled as expiring | A seat is still a subagent. Between Claude Code 2.1.212 and 2.1.224 (July to August 2026) a session spawn cap was added and removed, a 20-agent concurrency cap arrived, and nesting was switched off and back on at depth 3 | The herdr host |
| Sessions told not to invoke agents unless asked | Named as the one thing no file in the team can counter | Unchanged | The herdr host: the human runs the dispatcher; the dispatcher starts sessions; no model has to choose to delegate |
| `maxTurns` and `model: inherit` hard-coded | Moved into the fitted adapter | `inherit` is still the only model value anywhere in `team/` | Casting |
| Stale tuning degrades into unanimous approval | `disagreement-rate` over ten real items; negative control split into presence and spread | Verdict-level only; `claim`, `verdict`, and `return` are self-reported; nobody sees the rate unless they run a command | The wire, dissent instruments, the world |

The first real runs on the v3 branch (2026-09-10, `docs/history/tracking/2026-09-10-first-runs.md` there) added four findings this PRD also picks up. The review station used 45 agents and about 2.3M tokens on one small diff, and 40 of those agents were skeptics. The line's review station failed to start because Claude Code loads its agent registry at session start, so a composed seat staged mid-session was never seen. The dispatcher's worktrees and the harness's worktrees turned out to be two different things, and a worktree carries its own copy of the tracked log. And five lenses each vetoing a diff with four planted critical defects read as "unanimous" to the instrument while their 34 surviving findings disagreed in content.

### What moved outside the repo since August

**Model guidance now flips between releases, and it is written down.** Anthropic's migration notes tell Opus 4.8 users to add explicit delegation triggers because that model under-reaches for subagents. The *Prompting Claude Opus 5* guide then says Opus 5 "delegates to subagents more readily than prior models", recommends deterministic caps on spawning, and says to remove verification instructions ("use a subagent to verify") because they cause over-verification; it also confirms that Claude Code adds a delegation instruction of its own on that model, which is the session-level instruction the deprecation notice ran into. The *Prompting Claude Fable 5* guide reverses both: use subagents frequently, prefer long-lived asynchronous ones, and use separate fresh-context verifiers, which "tend to outperform self-critique". The same guide says skills written for prior models "are often too prescriptive" and can degrade output quality. A methodology that hard-codes one delegation posture is wrong on at least one current model by construction.

**Claude Code grew the primitives this needs.** As of October 2026 the subagent frontmatter accepts `model` (an alias such as `opus` or `fable`, or a full model ID) and `effort` (`low` through `max`), and the Workflow tool's `agent()` takes `model` and `effort` per call. Hooks can be `command`, `http`, `mcp_tool`, `prompt`, or `agent`; any hook can run with `async: true`; `allowedHttpHookUrls` restricts where HTTP hooks may post; and when a session runs with `--agent`, every hook event carries `agent_type`. `PostToolUse` and `SubagentStart` cannot block, and a timed-out hook does not block the tool. OpenTelemetry export carries `agent.name`, `model`, and `cost_usd` (agent names are redacted unless `OTEL_LOG_TOOL_DETAILS=1`), traces are in beta, and the trace context reaches subprocesses through `TRACEPARENT`. The `subagentStatusLine` script receives every running subagent with its `name`, `status`, `model`, `effort`, and `tokenCount`. Plugins can bundle agents, hooks, a status line, monitors, and executables.

**herdr became the terminal for running many agents.** It is a single Rust binary (Apache-2.0, v0.9.3 released 2026-09-29, about 42k GitHub stars) whose server owns real PTY panes, keeps them alive across detach and SSH, and marks every agent pane `working`, `blocked`, `done`, or `idle` by reading its screen, so it knows Claude Code is waiting on a permission prompt without any hooks. Its CLI and newline-delimited JSON socket API can start a named agent of a given kind in a pane, prompt it and wait for it to settle, label the pane, and stream state changes; Part 3 lists the calls. It starts Claude Code, Codex, Gemini, Cursor, OpenCode, Amp, and about twenty other agents, and since v0.7.0 it takes out-of-process plugins. Its maintainers keep the core small on purpose and have declined fleet-level events, pane lineage, and per-turn cost tracking (herdr issues #4027, #2871, #2742). That is the layer Summon would supply.

**The community converged on named roles and on watching agents work.** Steve Yegge's Gas Town runs a Mayor, Polecats ("worker agents with persistent identity but ephemeral sessions"), a Refinery that verifies work before merging it, and Witness and Deacon watchdogs over Claude Code, Codex, Gemini, and others in tmux, with work tracked in Beads. Pixel Agents draws each Claude Code session as a pixel-art character in a small office who walks to a desk, types while editing, reads while searching, and flags when it is waiting for input. It is driven by the same hook events this PRD uses (`SessionStart`, `PreToolUse`, `PermissionRequest`, `Stop`), shows subagents and teammates as their own characters, and lists "health bars for rate limits and token budgets" on its roadmap. Claude Code itself added an agent view (`claude agents`), a per-subagent status line, and in 2.1.287 Claude Mods, plugins that can add live panes and bands to its interface. The most telling change is Anthropic's own: since 2.1.274, `/code-review` uses "leaner inline review prompts for every model that has no tuned settings of its own, instead of spawning many review subagents". That is per-model tuning with a lean fallback, which is what this PRD calls casting and posture. None of these projects has a methodology whose output is dissent and a decision record, which is the part Summon brings.

**The research says agreement between similar reviewers is weak evidence.** Kim et al. (ICML 2025) found that when two models both err they pick the same wrong answer about 60 percent of the time on one leaderboard, and that larger, more accurate models correlate even across providers. Goel et al. (ICML 2025) found that model judges favour models similar to themselves and that mistakes converge as capability rises. Choi et al. (NeurIPS 2025) found that majority voting, not the debate itself, accounts for most of multi-agent debate's gains. In code review specifically, framing a change as bug-free cut LLM vulnerability detection by 16 to 93 percent, and adversarial PR descriptions got past Claude Code in 88 percent of iterated attempts until the metadata was redacted (arXiv 2603.18740, 2026). The Refute-or-Promote study (arXiv 2604.19049, 2026) records ten agents, an arbiter among them, unanimously confirming an OpenSSL padding oracle that a single fresh-context instance disproved by compiling the code and running three tests. Unanimity among similar reviewers who share the author's framing is close to no information, which is the deprecation's failure mode stated as a finding.

## The problem

Summon's promise is a team whose disagreement carries information. After v3, three things outside Summon's files still decide whether that holds. The model behind each seat is whatever the session inherited, so a model release recasts the whole team silently and the next unanimous window is the first sign. The structured work depends on subagent semantics and on a coordinating model's willingness to delegate, both of which change per release. And the record of what the team did is half testimony: a seat that forgets to log, or never ran, looks the same as one that ran and agreed.

Underneath all three sits a plainer problem. The team works in a place the human cannot see. Dissent decays quietly because nobody is watching it decay, and the instruments that would show it are commands nobody runs at 23:30.

## Goals and non-goals

| ID | Goal |
|---|---|
| G1 | Spawns, exits, blocks, and casts are written by something other than the seat, and every event in the log says who wrote it. |
| G2 | Each seat and station gets a model and an effort level from one file that a model release invalidates, and that file changes only through an audition. |
| G3 | A work order produces the same team shape on any coordinating model, because a script starts the seats. |
| G4 | Persona files never change because a model did, and a voice check says whether each persona still comes through. |
| G5 | A human can see, live and in replay, who is working, who is blocked, who disagreed, and what it cost, through the skin Summon already has. |
| G6 | The review station costs measurably less per item, with no planted defect lost. |

| ID | Out of scope |
|---|---|
| N1 | A hosted service, an account, or network egress for telemetry. Everything stays on the machine. |
| N2 | A terminal multiplexer. herdr is the host; Summon writes an adapter and a plugin and never forks it. |
| N3 | A supervisor or control plane. ADR-0012's rejection stands, and so does its tamper-boundary clause: nothing here is tamper-proof, and the human reviewing the PR remains the integration authority. |
| N4 | Views that feed model context or take actions. The world is read-only in this PRD, and the skin never enters a prompt (ADR-0015). |
| N5 | Claims that multi-model casting improves quality. That is a hypothesis with a null allowed, and benchmark claims stay with ADR-0005. |
| N6 | Replacing v3. Every part extends ADR-0015's layers, log, line, and work order. |

## Who this is for

The README's audience does not change: a solo developer or a two-to-three-person team who will answer for the code later. Summon Live adds a reason for that person to run longer, unattended work orders, and the jobs below are the ones it serves.

| Job | Today on v3 | With Summon Live |
|---|---|---|
| Run a work order overnight and know in the morning what happened | Read `.summon/team-log.jsonl`, run `team:dissent` and `team:watch` | Scrub a replay; every event shows who wrote it |
| Notice the moment the review formation goes quiet | Remember to run `pnpm team:dissent` | *Echo* status on the formation, and the party bar turns it red |
| Upgrade the model under the team | Edit nothing and hope, since everything inherits | Run an audition; promote the casting or keep the incumbent; the ledger records which model actually ran |
| Get a second opinion from another vendor's model | Leave Summon | Cast one lens on a Codex pane under the same persona text (opt-in) |
| Step in when a seat is stuck | Find the subagent transcript afterwards | Focus the seat's herdr pane and type |
| Show a reviewer how a change was made | Link the tracking doc | Attach the replay to the PR |

## Principles

**Identity is canon; casting is configuration; configuration is measured.** A persona's priors, dissent, voice, and tells live in its persona file and nowhere else. The model and effort behind a seat live in a fitted casting file, which expires on every model release and changes only through an audition. In the JRPG skin the model is equipment: Vik can change gear and is still Vik.

**Write the record from outside the model.** A seat's own events are testimony. Hooks, the dispatcher, the check runner, and herdr are witnesses. The log keeps both and labels them, and checks that need proof read only witnessed events.

**Structure by dispatch, never by delegation.** Which seats run, on which items, in what order, is decided by `dispatch.mjs` from a work order. A coordinating model's appetite for subagents can then flip between releases without changing the team.

**No silent recasting.** A casting names full model IDs. Aliases such as `opus` move when Anthropic ships, which is the same silent change that killed v2's tuning.

**Every flashy thing answers a question the log cannot answer quickly.** Each renderer is specified with the question it exists for, and its earn-gate tests that question.

**Degrade loudly.** When a host, hook, or renderer is missing, the ceremony announces its mode at invocation, as ADR-0012 C already requires.

## Part 1: The wire

The wire is one new writer, `scripts/wire.mjs` (zero dependencies, run as asynchronous command hooks), alongside the two outside-the-model writers v3 already has and the herdr host's state events. It answers the limit ADR-0015 names itself ("the log is partly written by the seats themselves") and issue #129.

### Who writes what

Every ledger event gains a `by` field. Checks that need proof filter on it.

| `by` | Writer | Events | Outside the model |
|---|---|---|---|
| `dispatch` | `scripts/dispatch.mjs` | `spawn`, `claim` (already on v3) | yes |
| `runner` | `scripts/run-checks.mjs` | `check` with tree-bound receipt (already on v3) | yes |
| `wire` | `scripts/wire.mjs` from harness hooks | `start`, `exit`, `cast`, `block`, `unblock`, `compact` (new) | yes |
| `host` | the herdr host adapter | `start`, `exit`, `block`, `unblock` from pane state (new) | yes |
| `seat` | the seat, through its composed Log section | `claim`, `finding`, `verdict`, `return` | no |

An event written by a seat is *testimony*. An event written by anything else is *witnessed*. A verdict is witnessed when the same instance has a witnessed `start` before it and a witnessed `exit` after it.

### Two streams

The v3 ledger stays what it is: low volume, schema-validated, git-tracked so CI can read it. Tool-level events go to a second stream that is never committed.

| Stream | Path | Holds | Tracked | Read by |
|---|---|---|---|---|
| Ledger | `.summon/team-log.jsonl` (v3) | Semantic events in `team/events.json`, plus `start`, `exit`, `cast`, `block`, `unblock`, `compact` | yes | checks, renderers |
| Telemetry | `.summon/telemetry/<date>.jsonl` | Tool calls, durations, pane states, token and cost samples | no (gitignored, rotated after 14 days) | renderers only |

### The hook set

All hooks are `async: true`, carry a timeout of five seconds or less, always exit 0, and never write to stdout, so none of them can block or steer a seat.

| Claude Code event | Stream | Becomes | Note |
|---|---|---|---|
| `SessionStart` | ledger | `start`, `cast` | `cast` records the model the session reports at start, which may differ from what the casting asked for; the status-line payload's `model.id` is the fallback source |
| `SubagentStart` / `SubagentStop` | ledger | `start` / `exit` | `agent_type` names the composed seat; this is the subagent and Workflow host |
| `SessionEnd`, `Stop`, `StopFailure` | ledger | `exit` | carries `ok: false` on `StopFailure` |
| `PermissionRequest`, `Notification` | ledger | `block` | the human is now the bottleneck |
| `PreCompact` | ledger | `compact` | context pressure inside one seat |
| `PreModelSwitch` / `PostModelSwitch` | ledger | `cast` | a mid-session recast is still a recast |
| `PreToolUse` / `PostToolUse` / `PostToolUseFailure` | telemetry | `tool` | tool name, duration, relative path for file tools, first word of a Bash command, exit status |
| `WorktreeCreate` / `WorktreeRemove` | telemetry | `worktree` | joins harness worktrees to dispatcher worktrees |

Item and instance attribution comes from environment variables the dispatcher sets on each seat (`SUMMON_SEAT`, `SUMMON_INSTANCE`, `SUMMON_ITEM`, `SUMMON_STATION`, `SUMMON_LOG`). Under the Workflow host those variables are not per-agent, so the wire attributes by `agent_type` and the dispatcher's claim instead, and says so in the event.

### Where the log lives

The first-runs report found that a worktree carries its own copy of the tracked log. The wire writes to one log only: the absolute path in `SUMMON_LOG` when the dispatcher set it, and otherwise the `.summon/` directory of the checkout that owns the repository's shared git directory (`git rev-parse --git-common-dir`), which resolves to the main checkout from every worktree. Each event is one line written by one `O_APPEND` write call, which does not interleave with another writer's line on a local filesystem; network filesystems are out of scope, and W-5 tests the claim under load.

### Tokens and cost

Hooks carry no token counts, so cost comes from two places Claude Code already provides. The party bar's status script (Part 4) receives `cost.total_cost_usd` and the context-window figures for its session, and `subagentStatusLine` receives a `tokenCount` per running subagent; the script appends a sample to the telemetry stream when the numbers change, which costs nothing extra because Claude Code runs it anyway. When the human enables Claude Code's OpenTelemetry export, `claude_code.cost.usage` and `claude_code.token.usage` with `model` and `agent.name` are the better source (W-8). Cost per item and per seat, the audition's cost probe, and the *Doom* status all read these samples, and every report states which source it used.

### Redaction

The telemetry stream never stores tool output, file contents, environment variables, prompts, or full shell commands. It stores tool names, durations, exit codes, paths relative to the worktree, and the first word of a Bash command (`git`, `pnpm`). `SUMMON_WIRE_DETAIL=1` keeps full commands in the telemetry stream for local debugging; it is off by default and the stream is never committed either way. The ledger events the wire writes carry no tool input at all, so the tracked file cannot leak a secret that passed through a tool.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| W-1 | Every ledger event carries `by`; v3 events gain it by writer | P0 | `team-log.mjs append` refuses an event without `by`; existing writers set it; old lines read as `by: seat` |
| W-2 | `scripts/wire.mjs` maps the hook set above, zero dependencies | P0 | Recorded hook payload fixtures replay into the expected ledger and telemetry lines |
| W-3 | Hooks are async, fail-open, silent, and time-bounded | P0 | A wire that throws, hangs, or finds no log leaves the seat's behaviour byte-identical in a fixture session |
| W-4 | `team-log.mjs witness --item <id>` reports every testimony event lacking a witnessed start and exit | P0 | A fixture of #129 (verdicts with no spawned seat) is reported as an unwitnessed review |
| W-5 | One log across worktrees via `SUMMON_LOG` | P0 | Three stations in three worktrees write one ledger with no lost lines under concurrent appends |
| W-6 | Redaction as specified; detail mode opt-in | P0 | A fixture containing a bearer token in a `curl` command produces no token in either stream |
| W-7 | Hook wiring lives in tracked `.claude/settings.json` or a Summon plugin, never `settings.local.json` | P0 | `doctor` reports where the wire is wired and refuses to report it present from an untracked file |
| W-8 | Optional OTLP/HTTP JSON receiver in the world server for cost and token data | P2 | With `CLAUDE_CODE_ENABLE_TELEMETRY=1` and `OTEL_LOG_TOOL_DETAILS=1`, cost per seat appears in telemetry |

## Part 2: Casting

### The default is one model

Anthropic's own cost guidance says to measure the most capable model at a lower effort before building a multi-model cascade, because lower effort on the newest models often matches older models at high effort, and because prompt caches are per model, so a cascade gives up cache reuse. Summon Live takes that as the baseline. The default casting is **one model, effort by station**. Every multi-model casting has to beat it in an audition, and the audition report states the cache cost of switching.

### The casting file

`team/casting/<name>.json` is fitted (`"fitted": true`, with a `review` field like the harness adapter's) and is the only place a model ID may appear under `team/`. That widens ADR-0015's rule from one fitted file per harness to two kinds of fitted file, and reversal trigger 3 has to read accordingly: a model release that forces a change outside `team/harness/` and `team/casting/` means the seam failed.

```json
{
  "casting": "anthropic-2026-10",
  "fitted": true,
  "review": "Re-audition on any release of a model named here, and on any harness release that changes how model or effort is set.",
  "auditioned": { "date": "2026-10-12", "report": "docs/history/tracking/2026-10-12-audition.md" },
  "default": { "model": "claude-opus-5-5", "effort": "medium" },
  "seats": {
    "archie": { "*": { "model": "claude-opus-5-5", "effort": "high" } },
    "tara":   { "red": { "model": "claude-sonnet-5-5", "effort": "high" } },
    "sato":   { "green": { "model": "claude-sonnet-5-5", "effort": "medium",
                           "escalate": { "after": "fail", "to": { "model": "claude-opus-5-5", "effort": "high" } } } },
    "grace":  { "*": { "model": "claude-haiku-4-5" } }
  },
  "formations": {
    "review-party": {
      "lenses": { "security": { "model": "claude-opus-5-5", "effort": "high" } },
      "skeptic": { "model": "claude-sonnet-5-5", "effort": "low", "capPerLens": 6 }
    }
  }
}
```

The composer resolves a cast for every seat and station and emits it where the host can apply it: `model` and `effort` frontmatter for the subagent host, `opts.model` and `opts.effort` for the Workflow host, and launch flags for the herdr host. The values above are an illustration of shape, not a recommendation. The first real casting is whatever wins the first audition.

### Auditions

`pnpm team:audition --casting <file>` runs four probes and writes an `audition` event to the ledger with the result.

1. **Presence.** The review formation runs the v3 negative-control fixture under the candidate. Every lens must find its planted defect, and the skeptic stage must refute none of them. A skeptic that talks a lens out of a real defect hides a bug, and that asymmetry is why this is a hard floor.
2. **Recall on replays.** A small set of past items whose real defects are known (from the ledger: findings that led to a fix commit) runs again. The candidate's recall of known findings is compared with the incumbent's.
3. **Voice.** Each persona's tells are probed on its outputs (below).
4. **Cost and time.** Tokens, list-price cost, and wall time per item, from the wire.

A casting is promoted only when presence is complete, recall is no worse than the incumbent's by more than a stated tolerance, and every persona keeps its voice. Cost is reported, not gated. Auditions spend real money and run only when the human asks or opts into a schedule. With a handful of items they are a smoke test, and ADR-0005's benchmark stays the only place a quality claim can come from.

### The review formation

The first run's 45 agents were 5 lenses and 40 skeptics. If the skeptics' share of tokens tracks their share of agents (unmeasured; the report gives only the 2.3M total), casting them on Sonnet 5.5 cuts the wave's bill by roughly 40 to 45 percent at list price before any effort change, and Haiku 4.5 by roughly two thirds. That is arithmetic on assumptions, and the audition measures the real number. The skeptic cap per lens, which the report recommended, is logged when it drops a finding so the cap is never silent.

Two cheaper changes come before any mixed-model experiment, both from the research above. The review station's prompt carries the item's spec and the diff and nothing that frames the change: never the coder's own summary of what it did, never PR titles or descriptions (C-11). v3's `review-wave.mjs prepare` already builds lens prompts from the diff alone; this makes that a tested rule that the herdr host's hand-off files must follow too. And a veto backed by a witnessed check, such as a failing test the runner executed, is recorded as stronger than a veto backed by prose, which is the lesson of the unanimous padding oracle.

Mixed-model lenses are the more interesting question. Lenses on the same base model share blind spots, so their agreement is weaker evidence than it looks, and the correlation findings above suggest that more lenses on one model buy less independence than the count implies. Summon Live tests this as hypothesis **H1**: at equal cost, a review formation whose lenses run on different model families has lower finding overlap and higher union recall on the control and the replay set than a single-family formation. The experiment is pre-registered in ADR-0005's style, and a null result is published like any other. The same papers temper the hope: larger models correlate across providers too, so H1 may well come back null, and the default casting does not wait on it.

### Escalation

A station may name an `escalate` cast and a trigger (`after: "fail"` when the station returns `ok: false`, or `after: "veto"` when the review vetoes twice). The dispatcher re-runs the station once on the escalated cast and writes a `cast` event with the reason. Cost is judged per completed item, never per request, so an escalation that finishes the item counts as cheaper than two cheap failures.

### Posture profiles

For the conversational coordinator, the part of Summon that is still a model choosing whether to delegate, `team/posture/<family>.md` holds a short fitted block per model family drawn from that family's prompting guide (cap spawns and keep verification in the main loop on the Opus 5 line; delegate asynchronously with fresh-context verifiers on the Fable line). The composer picks the block by the coordinator's cast model. This is where ADR-0015's `delegation: null` gets a value. On every model release the posture files are run through the `prompt-audit` procedure in Claude Code's bundled `claude-api` skill, which audits agent configuration files for instructions a new model no longer needs. Work orders do not read posture at all.

### Voices survive recasting

The deprecation post noted that the voices flattened first, before anyone noticed the review had stopped working. That makes voice the cheapest early warning there is. Each v3 persona already lists its *Tells*, and several are mechanical: Wei numbers challenges and grades each one blocking, amend, or note; Pierrot attaches a time-to-exploit or a blast radius to every finding; Vik counts things and ends a finding with a choice. `team/voice/<persona>.json` turns the mechanical tells into probes (graded deterministic) and leaves the rest to a judged check (graded inferential, run by a cheap model, never the seat's own). An audition fails a casting that loses a persona's voice, and the world shows a *Muted* badge on a seat whose recent outputs show none of its tells.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| C-1 | Casting file schema, fitted, full model IDs only | P0 | The composer refuses an alias and names the ID it resolves to today |
| C-2 | Composer emits casts per host (frontmatter, Workflow opts, herdr flags) | P0 | Composing the same party on three hosts yields the same cast per seat and station |
| C-3 | `cast` events from the wire record the model that actually ran | P0 | A session whose model differs from its cast produces a *Stale gear* status and a doctor warning |
| C-4 | Auditions with the four probes and the promotion rule | P1 | A casting whose skeptics refute a planted defect is refused promotion |
| C-5 | Skeptic cast and cap, logged when they drop work | P1 | The cap drops are visible in the ledger and on the battle screen |
| C-6 | Escalation ladder in the dispatcher | P1 | A fixture item that fails green once escalates exactly once and logs why |
| C-7 | Posture profiles per model family | P2 | Changing the coordinator's cast swaps the block; no other file changes |
| C-8 | Voice probes and the *Muted* badge | P1 | Each persona has at least one mechanical tell probe with a fixture that passes and one that fails |
| C-9 | H1 experiment, pre-registered | P2 | The registration exists before the first mixed-model run |
| C-10 | Work orders take an optional token budget per item; escalation never runs past it | P1 | A fixture item at its budget is reported as stopped on budget, with no escalation started |
| C-11 | Blind review: lens prompts carry the spec and the diff, never the coder's summary or PR metadata | P0 | A fixture whose hand-off file claims "no security impact" produces lens prompts that do not contain the claim |

## Part 3: The herdr host

### Why a host at all

Casting and the wire do not need herdr. Both run on the v3 Workflow host and on plain subagents, and they come first in the phasing for that reason. A host earns its place with four things the subagent path cannot give.

- **Seats as sessions.** Each seat instance is its own top-level session started with its composed seat as the main thread (`claude --agent <seat>`), on its cast model and effort. Subagent caps, nesting depth, and the session-level instruction about invoking agents stop applying, and the agent registry is read at that seat's own start, which removes the first-runs failure where a composed seat staged mid-session was never seen.
- **Long-lived seats.** A seat instance can hold its context across items, which is the asynchronous, long-lived delegation Anthropic recommends for Fable 5.1 and which saves cache reads.
- **The human can step in.** Every seat is a real terminal. The human can watch a seat, answer its permission prompt, or type into it, and herdr's blocked state is a witness the wire does not have to infer.
- **Other vendors' agents.** herdr hosts Codex, OpenCode, Cursor, and others beside Claude Code, which is what makes a cross-vendor lens possible without leaving the team.

### How a work order runs

The dispatcher stays the only thing that drives herdr. The commands below are herdr v0.9.3's; the host adapter pins them and `doctor` probes the version (0.7.5 is the floor for the agent commands).

1. **Plan.** `dispatch.mjs plan` is unchanged from v3: one instance per station per item, `distinct-instance` satisfied by construction.
2. **Open.** `dispatch.mjs open --host herdr` creates one git worktree per instance, as v3 does, and runs every seat with harness isolation off, which leaves exactly one worktree per seat and removes the first-runs mismatch between the dispatcher's worktrees and the harness's. It creates one herdr workspace per order (`workspace create --label <order> --no-focus`) and one pane per instance (`pane split ... --cwd <worktree> --env SUMMON_SEAT=... --env SUMMON_INSTANCE=... --env SUMMON_ITEM=... --env SUMMON_LOG=<absolute path> --no-focus`), or the whole wall in one `layout.apply` call. It writes `spawn` events as it does today.
3. **Start.** `herdr agent start tara-1 --kind claude --pane <id> -- --agent tara --model claude-sonnet-5-5 --effort high` starts the composed seat as the session's main thread on its cast, with the tool allowlist and permission mode the composer already emits for that seat. herdr agent names allow lower-case letters, digits, `-`, and `_`, so instance `tara#1` is named `tara-1`. The dispatcher then labels the pane without touching herdr's detection: `pane report-metadata <id> --source summon --display-agent "Tara#1 · red" --token persona=tara --token station=red --token item=42 --token cast=sonnet-5.5/high`. The wire's `SessionStart` hook writes the witnessed `start` and `cast`.
4. **Run a station.** `herdr agent prompt tara-1 "<station prompt>" --wait --until idle --until done --until blocked --timeout <budget>`. Long hand-offs travel as files under the main checkout's `.summon/handoff/`, which is herdr's own advice for output too long to read back from a pane.
5. **Blocked.** When the wait returns `blocked`, the dispatcher writes `block` (by `host`), raises one notification (`notification show`), and waits for the human (`agent wait --until idle --until done`). It never answers a dialog itself; herdr's own agent skill gives the same rule.
6. **Settle.** On `idle` or `done` the dispatcher reads the ledger, never the screen. A station is complete only with the seat's `return` for that item and a witnessed `exit` or idle after it. A seat that went idle without a `return` is an unwitnessed failure.
7. **Next item.** A long-lived instance gets the next item's prompt in the same pane and keeps its context. Otherwise the dispatcher exits the agent and closes only the panes it created.

Two herdr behaviours shape this. Subagents inside one Claude Code process are invisible to herdr, which sees processes per pane, so on this host every seat instance is its own process. And `pane report-agent` would take lifecycle authority away from herdr's screen detection for Claude Code, so Summon only ever uses `report-metadata`.

The review formation is the exception to one pane per seat. Forty skeptic panes would bury the wall, so the review station runs as one pane whose session runs v3's review-wave workflow, with its lenses and skeptics as subagents inside it. herdr sees one pane; the wire still sees every lens and skeptic through `SubagentStart` and `SubagentStop`, so the battle renderer and the witness check lose nothing.

### Cross-vendor seats

A seat may be cast on a non-Claude harness in a herdr pane. The role and persona files are plain Markdown already; the `skills` adapter emits the role, and a new `agents-md` adapter emits role plus persona as the `AGENTS.md` that most other harnesses read. Wei on another vendor's model is still Wei, because identity lives in the persona file and the skin, and the model is the gear. Cross-vendor seats are off by default, and enabling one is a recorded human decision per project, because it sends the project's code to a second vendor. Their witnessing is weaker: where the other harness has no hooks, only herdr's pane state witnesses them, and the ledger marks that.

### The Summon herdr plugin

herdr's plugin v1 is a directory with a `herdr-plugin.toml` manifest and commands in any language, run out of process with the whole herdr CLI as their API and no sandbox. It has no sidebar widgets, border badges, per-pane colours, or graphics (a pane graphics API was removed in v0.9.2). What it does have is enough:

- An `[[events]]` hook on `pane.agent_status_changed` runs `node scripts/wire.mjs herdr`, which reads `HERDR_PLUGIN_EVENT_JSON` and writes `block`, `unblock`, and telemetry state for panes that carry a `persona` token, and does nothing for any other pane. herdr plugins are installed per user and see every workspace, so the no-op path matters.
- `[[actions]]` for opening the Guild Hall, exporting the current order's replay, and showing a seat's card in a popup pane (the v3 table renderer, filtered to one instance).
- Sidebar rows built from the tokens the dispatcher sets (`$persona`, `$station`, `$item`, `$cast`, `$verdict`), with a suggested `[ui.sidebar.agents]` snippet and styling rules the user pastes into their own config. Colour stays the user's choice, which is how herdr wants it.

The plugin is a first-party subdirectory of this repo, installed pinned to a release (`herdr plugin install summon-dev/summon/<subdir> --ref <tag>`), zero-dependency, and small enough to read in one sitting, because herdr runs it unsandboxed with full control of every pane.

### Fallback hosts

The host is chosen per work order, and the ceremony announces it. With herdr absent, the order runs on the v3 Workflow host, which the human must opt into per ADR-0012 C, and after that on prose subagents. Claude Code's experimental agent teams are a candidate fourth host: teammates can use custom subagent definitions and run in tmux panes, but they are Claude-only, the lead coordinates them by conversation rather than by plan, and several frontmatter fields (`skills`, `hooks`, `permissionMode`) do not apply to teammates. It stays a candidate until the experiment flag is gone.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| H-1 | Host adapter `team/harness/herdr.json`, fitted, version-pinned | P1 | `doctor` probes the herdr version and the socket, and reports the host as unavailable rather than failing |
| H-2 | `dispatch.mjs open --host herdr` starts one pane per instance with the cast, the worktree, and the `SUMMON_*` environment | P1 | The v3 `first-run` order runs end to end with zero line violations and every station witnessed |
| H-3 | Station prompts delivered at launch; completion read from the ledger and pane state | P1 | A seat that exits without a `return` is reported as an unwitnessed failure, never as a pass |
| H-4 | No seat may drive herdr | P0 | Every composed seat on this host denies the herdr binary; a `PreToolUse` hook refuses Bash commands naming the binary or `HERDR_SOCKET_PATH`; a fixture diff that tells a reviewer to prompt the coder's pane produces a refusal and a ledger finding, never a prompt |
| H-5 | Long-lived instances across items | P2 | An instance that handles two items logs both claims and shows cache reads on the second |
| H-6 | `agents-md` adapter and opt-in cross-vendor seats | P2 | A Codex pane holding one lens writes its findings through the same Log section and is marked host-witnessed |
| H-7 | Summon herdr plugin | P2 | Pane display names come from the skin, sidebar rows read the dispatcher's tokens, and the plugin does nothing on panes without a `persona` token |

## Part 4: The world

### Rules every renderer follows

A renderer reads the ledger, the telemetry stream, and a skin. It never writes the ledger, never feeds text into any model's context, and takes no action in this PRD. Each renderer is specified with the question it exists to answer, and its earn-gate checks that the question is answered faster than reading the log.

### The renderers

| Renderer | Surface | Answers | Phase |
|---|---|---|---|
| Party bar | Claude Code `statusLine` and `subagentStatusLine` | Who is running right now, on what model, at what cost, and is the formation in *Echo*? | 1 |
| Table | `team-log.mjs render` (v3, exists) | Everything, densely | exists |
| herdr wall | herdr panes plus the Summon plugin | Which seat is blocked on me, and can I step in? | 2 |
| Guild Hall | Local web page | What is the whole party doing, and where is it stuck? | 3 |
| Battle | Local web page, review station only | How did this review go: who hit what, what got refuted, how did the verdicts split? | 4 |
| Line | Local web page, work orders | Where is the queue, and which station is the bottleneck? | 4 |
| Replay | Self-contained HTML export | What happened last night, in order, with costs, attachable to a PR? | 3 |

### The party bar

The cheapest renderer and the first one built. Claude Code already hands a `subagentStatusLine` script every running subagent with its `name`, `model`, `effort`, and `tokenCount`, and hands the main status line `agent.name`, `model`, `effort`, and `cost`. A Summon status script joins those with the skin and the ledger and prints one line per seat: display name in its accent colour, station, cast, tokens, plus the dissent meter and the last control result. It has no server and no dependency, and it works on the subagent host on day one. Where Claude Mods are available (2.1.287 and later), the same data can render as a live band inside Claude Code; the status-line version stays the floor because it works on every install.

### The Guild Hall

A single-screen pixel room drawn from the jrpg-16bit skin, served by `scripts/world.mjs serve` (Node standard library only, `127.0.0.1`, a random token in the URL, server-sent events tailing both streams). Each seat has a station that matches its class: the Forge-Knight at a forge, the Sentinel Archer at a range, the Master Builder at a drafting table, the Nightblade on a watchtower, the Marshal at the quest board where work-order items hang as notices. Seats walk to a shared table when the review formation convenes. Speech bubbles show the first line of a real finding or verdict from the ledger and nothing else; the world never invents dialogue. Clicking a seat opens its recent events, receipts, cast, and cost, and its herdr pane name for stepping in.

The sprites exist already as 64-pixel masters under `site/src/assets/team-16bit/_src/`, drawn to one master palette per the 16-bit art bible. Phase 3 animates them procedurally (idle bob, a hop when working, a tool icon for the tool in use, emote bubbles), which needs no new art. Hand-pixelled or generated four-frame sheets per state are a Phase 4 deliverable owned by Dani under the same bible, dropped in by the existing convention for team sprites in `docs/team-directives.md`.

### Status effects

JRPG status effects carry the signals, and every one is computed from events, so the flash has a source.

| Status | Shown when | The failure it names |
|---|---|---|
| *Echo* | `team:dissent` reports a full window of ten real items with unanimous verdicts | The deprecation's failure mode: review that only ever agrees |
| *Silence* | A seat has testimony with no witnessed start or exit | #129: a review that never ran, reported as complete |
| *Sleep* | A `block` with no `unblock` for over five minutes | The human is the bottleneck |
| *Fatigue* | A `compact` event in the seat's current session | Quality risk late in a long session |
| *Confuse* | `check --line` reports an out-of-order or same-instance station | Separation of duties broken |
| *Stale gear* | The model a seat ran on is not one its casting auditioned | Silent recasting after a release |
| *Muted* | No persona tells in the seat's recent outputs | Voice flattening, the early sign of tuning decay |
| *Doom* (with a counter) | An item has spent over 80 percent of its token budget | Cost overrun |

### Replays

`world.mjs export --order <id>` writes one HTML file with the ledger slice, the redacted telemetry slice, the skin, and the sprites inlined as data URIs (sixteen 64-pixel PNGs are a few kilobytes each). It opens offline, scrubs by time, and plays at any speed. The README's "read the receipt yourself" becomes something a stranger can watch. Exports include no file contents, prompts, or commands, and print what they excluded at the top.

### Accessibility

Dani reviews every renderer before it ships. Each one honours `prefers-reduced-motion` by replacing animation with static state badges, never uses colour as the only signal (every status has an icon and a text label), uses the skin's per-persona `alt` text, is fully keyboard-navigable, and offers a toggle to the table renderer. The world's CSS must pass the repo's own `pnpm check:css` contrast and reduced-motion checker. Sound is off by default.

### Requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| V-1 | Party bar status scripts | P1 | On the subagent host, a running review formation shows one line per lens with its cast and tokens |
| V-2 | `world.mjs serve`: loopback only, URL token, read-only, zero dependencies | P1 | A request without the token, or from a non-loopback address or a foreign `Host` header, is refused |
| V-3 | Guild Hall with stations, procedural animation, and click-through | P2 | Given a recorded order, the human answers "who vetoed item X and why" from the page faster than from the JSONL, in a timed task |
| V-4 | Status effects computed from events, with a fixture per status | P1 | Each status has a fixture that raises it and one that does not |
| V-5 | Replay export with stated exclusions | P2 | The export opens offline and contains no prompt, file content, or command string from the fixture |
| V-6 | Battle and Line renderers | P2 | The battle replays the v3 negative-control run with its 34 findings, 6 refutations, and five verdicts |
| V-7 | Accessibility floor and `check:css` | P1 | Dani's review passes and `pnpm check:css` is green on the world's stylesheet |
| V-8 | Skin never in context | P0 | The composer test that pins this on v3 is extended to every renderer asset |

## Part 5: Dissent instruments

v3's `disagreement-rate` reads verdicts. The first run showed the gap: five lenses each vetoing a diff with four critical defects is unanimity on the scale and disagreement on the content. Three instruments widen what Summon measures.

1. **Content divergence.** Per item, the pairwise overlap of findings between lenses, keyed on file and a small line window. High overlap with a unanimous verdict is the real *Echo*; low overlap with a unanimous verdict is agreement worth having.
2. **Independence weighting.** Agreement between two lenses cast on the same model family counts less than agreement across families. The dissent report shows both numbers.
3. **Witness ratio.** The share of verdicts that are witnessed. Below 0.95 on the herdr host, the dissent rate itself is untrustworthy, and the report says so before it says anything else.

The negative control also gets a schedule: on every casting change (part of the audition) and, if the human opts in, weekly.

## Security and privacy

Pierrot owns this section's review; it lists what the gate has to cover.

- **Summon's first hooks.** ADR-0014 § 4 had Summon plant zero hooks, and ADR-0012 sequenced its own exit-path hook last as the most invasive asset. The wire would be the first Summon-authored hook, and it is the least invasive kind there is: observe-only, asynchronous, fail-open, silent to the model, no network. That makes it a reasonable first candidate for the threat-model gate ADR-0012 requires, and passing that gate de-risks the later blocking hooks. The wiring goes in a tracked file (W-7) for ADR-0014's F4 reason.
- **The herdr socket is a keyboard, and every seat holds the address.** herdr's socket has no authentication beyond its `0600` file mode, and herdr exports `HERDR_SOCKET_PATH` and `HERDR_BIN_PATH` into every process it launches, with its own values winning over anything the dispatcher passes. Any seat whose shell runs as the user can therefore type into every other seat. Summon contains this in two layers and claims no more than that: every composed seat on this host denies the herdr binary in its tool rules (H-4), and a `PreToolUse` hook on `Bash` refuses commands that name the herdr binary or socket path. That hook would be Summon's first blocking hook, so it inherits every condition ADR-0012 put on blocking hooks, including the false-positive policy. A seat that writes its own socket client in a scripting language gets past both layers, and ADR-0012's tamper-boundary clause applies in full: this hardens against a confused seat, not a hostile one. Only the dispatcher, a script, drives herdr, and the coordinator reaches herdr only through `pnpm team:dispatch`. The cross-pane prompt-injection fixture is a P0 test. This is the herdr-host version of #79.
- **The local server.** Loopback binding, a per-run URL token, `Host` header checking against DNS rebinding, a strict content security policy, no remote assets, read-only endpoints.
- **Secrets in streams.** Redaction by construction (W-6), telemetry never tracked, ledger events from the wire carry no tool input.
- **Cross-vendor egress.** Off by default, enabled per project as a recorded human decision.
- **Third-party plugins.** Summon ships one first-party herdr plugin and installs no others. ADR-0014's add-on discipline applies if that ever changes.
- **Where the threat model lives.** Issue #123 records that `docs/security/` does not exist. The wire's gate needs a home for its threat-model entry, so #123 blocks Phase 0's gate.

## Phasing and earn-gates

Each phase is useful alone, and none starts before ADR-0015 is ratified and its step 7 cutover has run, because the composed seats are what every phase casts, witnesses, and draws.

| Phase | Builds | Earn-gate before the next phase |
|---|---|---|
| 0. The wire | W-1 to W-7, `witness` subcommand, ledger `by` field, the threat-model entry | The #129 fixture is reported unwitnessed; the wire is shown not to change seat behaviour; Pierrot's gate passes |
| 1. Casting and the party bar | C-1 to C-6, C-8, C-10, V-1, V-4, V-8, first audition | The first audition promotes a casting with complete presence and zero skeptic-refuted plants, and reports measured review cost per item on at least five real items |
| 2. The herdr host | H-1 to H-4, `dispatch.mjs --host herdr` | The v3 first-run order runs on herdr with zero line violations, every station witnessed, no registry failure, and the human attaches to a running seat once |
| 3. The Guild Hall and replays | V-2, V-3, V-5, V-7 | The timed "who vetoed and why" task beats the JSONL; Dani's review passes; the human has opened the hall unprompted in most work-order sessions over a month (self-reported) |
| 4. Battle, Line, and the experiment | V-6, H-5 to H-7, C-7, C-9, sprite sheets, sound | H1 is pre-registered before its first run |

If Phase 3's last gate fails after sixty days (nobody opens the hall), the hall is deleted and the party bar and replays stay. ADR-0014 used the same kind of reopen trigger for an unused prompt.

## Success measures

| Measure | Target | Source |
|---|---|---|
| Witness ratio on the herdr host | at least 0.95 of verdicts | `team-log.mjs witness` |
| Files changed outside `team/harness/` and `team/casting/` on the next model release | zero | ADR-0015 reversal trigger 3, widened |
| Time from a model release to a promoted, re-auditioned casting | two days or less | `audition` events |
| Review-station cost per item against the all-inherit baseline | 40 percent lower | wire cost samples |
| Planted defects refuted by skeptics | zero | auditions |
| Personas with a passing voice probe after any recast | all fifteen v3 seats | auditions |
| *Echo* raised on a unanimous fixture window | within one item | status fixture |
| "Who vetoed item X and why" from the hall vs the JSONL | faster, every time in the timed task | Phase 3 gate |

## Architecture Gate: the ADRs this needs

Four ADRs, numbered when written (after ADR-0015 lands, since `check-canon` requires contiguous numbers). Each goes through Archie's authorship, Wei's challenge as a standalone agent, and the human's approval.

| ADR | Decides | Zone | Gate notes |
|---|---|---|---|
| The wire | Witnessed events, the `by` field, the two streams, the first Summon-authored hook | Canon (it observes user projects) | Pierrot's threat-model pass first; amends ADR-0014's zero-hooks posture for Summon's own hooks only |
| Casting and auditions | The fitted casting file, full IDs, the promotion rule, escalation, posture profiles, voice probes | Canon | Widens ADR-0015's fitted-file rule and its reversal trigger 3 |
| Host adapters | herdr as a host, seats as sessions, cross-vendor seats, the herdr plugin | Canon (adapter), meta (Summon's own plugin release process) | Data-governance note on cross-vendor egress; version-pin and probe discipline from ADR-0012 E |
| The world | Renderer rules, the local server, replays, status effects | Canon for the rules and server; meta for Summon's own art pipeline | Dani's accessibility gate; "view never in context" carried over from ADR-0015 |

## Alternatives considered

**Stay on v3 as it is.** This is the strongest alternative, and it partly wins: the wire and casting do not need herdr, which is why they come first. The Workflow host already accepts `model` and `effort` per agent, and ADR-0015's cutover fixes the registry failure on its own. What staying gives up is the human stepping into a running seat, sessions that outlive a coordinator, and any route to a second vendor's model. If Phase 2's gate fails, this is where Summon lands, and it is a good place.

**Claude Code agent teams as the host.** First-party, panes in tmux, a task list and a mailbox, and teammates can use custom subagent definitions, so the persona survives. It loses on three counts for now: it is experimental and Claude-only, the lead coordinates by conversation where Summon needs a plan the dispatcher computes (ADR-0012 already rejected it as a substrate for that reason), and `skills`, `hooks`, and `permissionMode` do not apply to teammates. It stays a candidate host and should be re-read when the flag is removed.

**Adopt an external orchestrator.** Gas Town is the strongest candidate, and it overlaps this PRD more than any other project: persistent worker identities, a merge queue that verifies before merging, watchdog roles, and agents from several vendors in tmux. Adopting it would hand Summon's dispatch to a system built for throughput, with its own vocabulary and its own tracker, when Summon's product is the decision record, the vetoes, and the measured dissent. The overlap is real enough to leave two doors open: a Beads tracking adapter beside the GitHub Projects and Jira ones, and a Gas Town host adapter for a user who already runs a town. Neither is in scope here, and a user who wants throughput above accountability should use Gas Town, as the README already says about bare agents.

**One model everywhere at varied effort.** Adopted as the default rather than rejected. Its argument is strong (one cache, fewer moving parts, and current guidance that low effort on a new model often beats high effort on an old one), and multi-model casting has to beat it in an audition to exist.

**An off-the-shelf tracing backend instead of a world.** Langfuse, Phoenix, or any OTLP backend would show spans, tokens, and costs with no UI to build, and the wire's optional OTLP receiver keeps that door open. What a span view cannot show is a seat, a verdict, or a disagreement, which are the things Summon exists to make visible.

**A VS Code extension in the manner of Pixel Agents.** Many developers live there, and the web renderer could later sit in a webview. Starting there would tie the world to one editor while the herdr host is terminal-first.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The world becomes a toy that nobody uses for decisions | Medium | The question-per-renderer rule, the timed task gate, and the sixty-day delete trigger |
| Goodhart on dissent: pressure to disagree for the meter | Low for seats, real for humans | Seats never see the meter (the skin is never in context); the human sees content divergence beside the verdict rate |
| Long-lived sessions on the herdr host cost more than subagents | Medium | Per-item budgets with *Doom*, adapter limits, and costs measured per completed item in Phase 2 |
| herdr changes fast: v0.7.0 to v0.9.3 between June and September 2026, with a breaking removal in v0.9.2 | High | Fitted host adapter, `min_herdr_version` pin, `doctor` probe, a plugin limited to tokens, events, and actions (the surface stable since v0.7.x), and two fallback hosts |
| Claude Code changes hook payloads | Medium | The wire is fitted to the harness, tested against recorded payloads, and fail-open |
| A skeptic cast too cheaply refutes real findings | Medium | The zero-refuted-plants floor in every audition |
| Cross-pane prompt injection through herdr | Medium | H-4 and its fixture are P0 |
| Scope: a solo developer drowns in panes and pages | Medium | Every phase stands alone; the party bar alone is a complete Phase 1 |

## Open questions

These are live, and the human decides each one.

1. Should the ledger stay git-tracked once wire events land? This PRD keeps it tracked and adds volume only for semantic events; the v3 dispatch review chose tracking so CI can read it, and nothing here overturns that.
2. Does a default casting ship into scaffolded projects as canon, or does every project start on one-model-varied-effort and audition its own? The second is safer and slower.
3. Is Wei on another vendor's model still Wei? This PRD says yes, because identity lives in the persona file and the skin. A human who disagrees would want cross-vendor seats limited to throughput seats without personas.
4. Should a recorded audition be allowed to promote a casting automatically, or does promotion stay a human act? This draft keeps it human.
5. How much of the herdr plugin is worth building while herdr's maintainers keep orchestration out of core? This draft limits it to tokens, one event hook, and three actions. A community plugin such as `herdr-projects` already runs a coordinator with workers, and the human may prefer to contribute the wire's event hook upstream to a shared plugin over shipping a Summon one.
6. Does procedural animation read as alive enough, or does the hall need sprite sheets in Phase 3 to be worth opening?

## Related in-flight work

Reconnoitred on 2026-10-05 per the Session Entry Protocol. Nothing below was changed by this PRD.

| Item | Relation | Suggested disposition |
|---|---|---|
| #138, ADR-0015, branch `claude/summon-team-v3-decomposed-jyiur2` | Prerequisite for every phase | Ratify (Archie's gate read is owed), then cutover (step 7), before Phase 0 |
| #129 review wave that never spawned reports as complete | Answered by the wire (W-4) | Keep open until W-4 lands; link this PRD |
| #123 `docs/security/` does not exist | Blocks Phase 0's threat-model gate | Resolve first, or pick an interim home for the entry |
| #79 prompt injection through add-on skill content | Same class as cross-pane injection | Cross-reference in the host ADR |
| #74 no meta zone for living registers | This PRD sits in `docs/history/design/` meanwhile | No change |
| #31, #32, #33 behavioral benchmark | Auditions reuse ADR-0005's grader discipline; quality claims stay with the benchmark | No change |
| #121, #124, #128 packet harvester; PRs #95, #105, #116, #120, #131 | Superseded by v3 on the human's direction of 2026-09-09; the wire gives the harvester's goal a witnessed source | The human closes them, as recorded in the v3 handoff |
| #109 CI only runs on PRs into `main` | Stacked PRs for these phases would merge unchecked | Fix before stacking Phase 0 work |
| ADR-0012's 90-day checkpoint, 2026-10-24 | Its trigger 1 (the capability registry) and its deferred receipt schema meet the wire | Read this PRD at the checkpoint |

## Terms this PRD introduces

When an ADR adopts one of these, the definition moves to `docs/methodology/team-layers.md` and this table links there.

| Term | Meaning |
|---|---|
| Witnessed event | A ledger event written by the dispatcher, the check runner, the wire, or the host, never by the seat it describes |
| Testimony | A ledger event written by the seat it describes |
| Casting | The fitted file that gives each seat and station a model and an effort level |
| Audition | The four-probe run a casting must pass before promotion |
| Host | What starts a seat: prose subagents, the Workflow tool, or herdr |
| Posture profile | The coordinator's delegation and verification guidance for one model family |
| Status effect | A world badge computed from events that names a failure mode |

## Sources

Read on 2026-10-05 unless noted. Facts about herdr come from its repository at commit `e35f393` (2026-10-04) and the documentation source for v0.9.3 inside it, because herdr.dev was not reachable from the drafting environment.

**This repository and its v3 branch**

- `README.md`, the deprecation notice of 2026-08-18.
- ADR-0005, ADR-0006, ADR-0007, ADR-0012, ADR-0014 in `docs/adrs/meta/`; `docs/process/ai-tells-catalog.md`; `docs/history/design/team-hero-sprites-16bit.md`.
- On `claude/summon-team-v3-decomposed-jyiur2`: `docs/adrs/meta/0015-decomposed-team.md`, `docs/methodology/team-layers.md`, `docs/history/tracking/2026-09-10-first-runs.md`, `docs/history/tracking/2026-09-09-v3-handoff.md`, `team/events.json`, `team/harness/claude-code.json`, `team/views/jrpg-16bit/party.json`, `team/personas/*.md`, `team/workflows/line.workflow.mjs`. Issue #138 and its comments.

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
- Hooks (handler types, `async`, `allowedHttpHookUrls`, `agent_type` under `--agent`, events that cannot block): https://code.claude.com/docs/en/hooks
- Monitoring with OpenTelemetry (`claude_code.cost.usage`, `agent.name`, traces beta, `TRACEPARENT`): https://code.claude.com/docs/en/monitoring-usage
- Status line and `subagentStatusLine`: https://code.claude.com/docs/en/statusline
- Agent teams: https://code.claude.com/docs/en/agent-teams
- CHANGELOG, versions 2.1.212, 2.1.217, 2.1.219, 2.1.224, 2.1.274, 2.1.287: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

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
- Choi et al., *Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models?*, NeurIPS 2025: https://arxiv.org/abs/2508.17536
- Cemri et al., *Why Do Multi-Agent LLM Systems Fail?* (MAST), 2025: https://arxiv.org/abs/2503.13657
- *Measuring and Exploiting Contextual Bias in LLM-Assisted Security Code Review*, 2026: https://arxiv.org/abs/2603.18740
- *Refute-or-Promote: An Adversarial Stage-Gated Multi-Agent Review Methodology for High-Precision LLM-Assisted Defect Discovery*, 2026: https://arxiv.org/abs/2604.19049
