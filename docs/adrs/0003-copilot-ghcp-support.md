---
agent-notes:
  ctx: "feasibility and scope for porting Summon to Copilot IDE Chat"
  deps: [CLAUDE.md, docs/methodology/phases.md, docs/methodology/personas.md, docs/process/team-governance.md, .claude/agents/, .claude/commands/]
  state: accepted
  last: "archie@2026-04-14"
---

# ADR-0003: Support GitHub Copilot IDE Chat as a Distribution Target

## Status

Accepted (2026-04-14)

*Adjudication (2026-04-14): Accepted with all 7 Wei round-2 conditions applied, plus one additional sprint-boundary-degradation item confirmed by the human. See "Round-2 adjudication" section at the bottom of this ADR for the specific conditions incorporated.*

## Context

Summon is a Claude-Code-native framework. Its value lives in the `.claude/agents/` persona set (16 files), the `.claude/commands/` slash command library (23 files), and the phased methodology prose under `docs/`. The differentiating runtime behaviors are:

1. **Isolated subagent invocation** — each persona runs in a private context window.
2. **Parallel subagent fan-out** — Architecture Gate (Archie + Wei simultaneously), three-lens code review (Vik + Tara + Pierrot in a single turn).
3. **Adversarial debate protocol** — multi-round, cross-agent exchanges where Archie's output is fed back to Wei and vice versa, tracked in `docs/tracking/`.
4. **Blackboard debugging** — Sato as conductor, others contributing to a shared artifact.
5. **Slash commands with argument parsing** — `$ARGUMENTS` binding, auto-discovery from `.claude/commands/`.
6. **Tool allow/deny per agent** — Cam read-only, Tara tests-only, etc.

### Scope of this ADR

**Target surface: Copilot IDE Chat only (VS Code, JetBrains).**

Coding Agent (cloud) is explicitly out of scope for this ADR. Human adjudication of the round-1 draft removed it. If cloud-side primitives evolve (parallel subagents within a single run, persona selection per phase), a separate ADR will revisit.

### Driving question

**How close to Claude-Code behavioral fidelity can we get on Copilot IDE Chat, and what engineering discipline must we commit to in order to get there?**

The round-1 concern about Copilot treating `AGENTS.md` as advisory is dismissed: Claude Code also intermittently ignores agent-invocation rules, so this is a runtime-parity wash rather than a port blocker. Remaining concerns are about the orchestration primitives themselves.

### Research findings (April 2026, re-verified)

Confirmed via VS Code docs and Copilot changelog:

- **Custom agents** (`.agent.md`) are GA and replaced `.chatmode.md`. Frontmatter supports `name`, `description`, `argument-hint`, `tools`, `model` (single or prioritized list), `agents` (subagent whitelist), `handoffs`, `user-invocable`, `disable-model-invocation`, `hooks` (preview).
- **Tool field semantics.** VS Code docs state: *"If a given tool is not available when using the custom agent, it is ignored."* This language strongly implies **runtime filtering** — the tool list acts as a whitelist applied by the host, not purely as a hint to the model. We treat this as enforced but flag it as a verification task before first shipping.
- **Model field.** Accepts a single model name or a prioritized array. This is our lever for voice pinning (Pierrot, Wei) and consistency (Archie, Tara).
- **Subagents** are invoked via an `agent` tool included in the parent's tool list. Subagents run in isolated context windows; parent sees only the final summary. Max nesting depth 5; nested subagent invocation disabled by default.
- **Parallel subagent invocation is NOT explicitly documented as a first-class pattern.** The docs describe sequential orchestration (Feature Builder → Researcher → Implementer). Whether the host permits multiple `agent`-tool calls in a single assistant turn, and whether they are executed concurrently or serialized, is unspecified. **This is a live risk, not a confirmed capability** — downgraded from round-1's "canonical pattern" claim.
- **`handoffs`** are user-gated UI transitions (button after response, click to hand off with pre-filled prompt). Good for linear Discovery → Architecture. Not a substitute for programmatic orchestration.
- **Prompt files** (`.prompt.md`) are parameterized prompt templates — closest analog to our slash commands. Argument binding uses Copilot's prompt-variable syntax, not `$ARGUMENTS` directly.
- **AGENTS.md** is the workspace-root, always-on instruction file. `.github/instructions/` holds `.instructions.md` files scoped by glob. There is no standardized `.github/agents/` path in VS Code docs — agents live in `.github/agents/` by convention in user-facing examples, and in `~/.copilot/agents/` for user-profile scope. We verify workspace-scope discovery on first implementation spike.
- **No `maxTurns` field** is exposed in `.agent.md` frontmatter.

## Decisions

Four decisions remain for IDE Chat in isolation. Each has options and a recommendation.

### Decision 1: Persona and prompt file layout

**Option A (RECOMMENDED).** One `.agent.md` per Summon persona under `.github/agents/`; one `.prompt.md` per slash command under `.github/prompts/`. Workspace-scoped (committed to the repo). Subagent graph declared via the `agents` frontmatter whitelist on orchestrator agents.

**Option B.** Collapse personas into a small composite set (architect, reviewer, implementer). Rejected — loses voice, per-persona tool scoping, and parallel-fan-out targets.

**Option C.** Single mega-agent; personas as prompt files. Rejected — prompt files are parameterized prompts, not isolated contexts. No subagent isolation.

**Recommendation: Option A.** Mirrors the Claude Code layout, preserves isolation and tool scoping, and keeps the port mechanically simple.

### Decision 2: `$ARGUMENTS` translation strategy

**Option A (RECOMMENDED).** Mechanical translation per command: each `.prompt.md` declares named input variables matching the command's expected arguments; conversion script rewrites `$ARGUMENTS` to `${input:name}` (or current Copilot syntax). Command-by-command review because several Summon commands use `$ARGUMENTS` as a free-form blob rather than a named field.

**Option B.** Embed all command prose into a single orchestrator agent; users invoke by name in chat. Rejected — loses the parameterized-input surface Copilot already provides.

**Recommendation: Option A.** Accept that a small number of commands (`/kickoff`, `/sprint-boundary`) need bespoke rewriting because their "argument" is the whole project state.

### Decision 3: Debate orchestrator mechanism

This is the load-bearing decision — it determines whether the multi-round debate protocol actually executes or degrades into independent-opinions-plus-synthesis.

**Option A (RECOMMENDED) — Deterministic orchestrator agent plus a prompt file per debate pattern.** Ship a dedicated `debate-moderator.agent.md` whose system prompt is a deterministic state machine: *(a)* invoke the round-1 subagents in parallel (or serially, if parallel is unavailable — see Risk 2), *(b)* write their independent positions to `docs/tracking/<topic>-debate.md`, *(c)* re-invoke each round-1 subagent with the *other's* output as explicit context ("here is Wei's round-1 — rebut or concede"), *(d)* append round-2 responses to the tracking file, *(e)* summarize points of agreement/disagreement for the human. Debate patterns (Architecture Gate, three-lens review) are shipped as `.prompt.md` files that invoke `debate-moderator` with the participant list and topic. The moderator's prompt is explicit about round-2 being mandatory, not optional.

**Option B.** Rely on the orchestrator LLM's own judgment to sequence rounds. Rejected — this is exactly the failure mode Wei called out in round 1. Without a scripted round-2 invocation, the likely execution is "round 1, then synthesize," which is not a debate.

**Option C.** Use `handoffs` for debate. Rejected — handoffs are user-gated (button click required), incompatible with a programmatic multi-round exchange.

**Recommendation: Option A.** Name the artifact: `.github/agents/debate-moderator.agent.md`. Name the pattern: "artifact-enforced round-2." Enforcement is **structural**, not prompt-level: the moderator is required to write `docs/tracking/<topic>-debate.md` with both `## Round 1` and `## Round 2` sections, one entry per participant, before emitting its synthesis. A standalone check script validates the artifact shape; if the Round 2 section is absent or under-populated, the moderator's output must state `PROTOCOL VIOLATION: round 2 skipped`. See Commitment C2 for the full mechanism.

### Decision 4: Source-of-truth and sync strategy (PROMOTED from follow-up)

Originally flagged as a follow-up ADR. Promoted here because shipping without a decision guarantees divergence in sprint 1.

**Option A (RECOMMENDED).** `.claude/agents/` and `.claude/commands/` remain source of truth. A generator script (`scripts/generate-copilot-artifacts.ts`) produces `.github/agents/` and `.github/prompts/` deterministically. A CI check fails the build if generated artifacts are stale or if a new `.claude/agents/*.md` file has no Copilot twin. Human-edited Copilot-specific overrides live in a sidecar file (`.copilot-overrides/<persona>.patch.md`) rather than the generated artifact.

**Option B.** Copilot artifacts as source of truth; Claude Code artifacts generated. Rejected — Claude Code is the richer runtime; source format should not be the limited dialect.

**Option C.** Both hand-maintained. Rejected — Risk 2 in round 1 (sync drift) materializes in week one.

**Recommendation: Option A** with a documented invariant: *"No commit merges if `pnpm run generate:copilot` produces a diff."*

## Capability Classification (IDE Chat only)

Definitions: **FULL** = ports with fidelity; **DEGRADED** = ports with behavioral loss; **MISSING** = no reasonable equivalent; **WORKAROUND** = simulated at cost.

| Summon primitive | IDE Chat | Notes |
|---|---|---|
| Markdown persona files (auto-discovery) | FULL | `.agent.md` in `.github/agents/` (to verify on first spike) or user-profile `~/.copilot/agents/`. |
| Isolated subagent invocation | FULL | `agent` tool invocation yields isolated context; parent receives summary only. Structurally equivalent to Claude Code's Task tool. |
| Parallel subagent invocation | DEGRADED | Not explicitly documented as supported. Orchestrator must be written to work under either concurrent or serial execution. See Risk 2. |
| Slash commands with `$ARGUMENTS` | DEGRADED | `.prompt.md` with named input variables is close but not identical. Free-form `$ARGUMENTS` commands need bespoke rewriting. |
| Tool allow/deny per persona | FULL (pending verification) | Docs language ("ignored if not available") implies runtime filtering. Verify on first spike; if advisory-only, mitigation in Risks. |
| Agent-to-agent handoff (linear kickoff) | FULL | `handoffs` frontmatter with user-gated buttons fits Discovery → Architecture → Plan well. |
| Adversarial debate protocol (Archie ↔ Wei, multi-round) | DEGRADED | Ported via the scripted `debate-moderator` agent (Decision 3). Round-2 re-invocation is deterministic but more ceremonial than Claude Code's free Task composition. |
| Three-lens code review (Vik + Tara + Pierrot) | DEGRADED unconditionally | Independence is a property of *simultaneity*, not of isolated sub-contexts. Even if Copilot permits parallel `agent`-tool calls with isolated sub-contexts per reviewer, the orchestrator's own turn-transcript carries earlier reviewer outputs, biasing the synthesis step toward whichever reviewer ran first. Fidelity loss is intrinsic to the orchestration model, not contingent on parallel availability. |
| Architecture Gate (Archie + Wei, parallel standalone) | DEGRADED unconditionally | Same rationale as three-lens review: orchestrator-transcript bias means Wei's critique is read through a lens already primed by whichever participant's output was appended to the transcript first. Protocol *content* survives via the scripted `debate-moderator`; independence-of-read does not. |
| Blackboard debugging | DEGRADED | Shared artifact = docs file; contributors append via the moderator-scripted pattern. More ceremony than Claude Code. |
| File system access (Read/Write/Edit) | FULL | Standard tools. |
| Bash / shell access | FULL | Standard. |
| Grep/Glob/WebSearch/WebFetch | FULL | Equivalents exist. |
| Long-running background agents (`run_in_background: true`) | MISSING | No IDE Chat equivalent. Workflows that depend on it (`/handoff` multi-wave) must be rewritten as explicit session-per-wave. |
| Session-management workflow (multi-wave sprint execution, `/handoff` / `/resume` context preservation) | DEGRADED | `CLAUDE.md § Session Management` assumes background agents can write wave summaries to files while the main context stays lean. Without `run_in_background`, every wave's exploration, agent invocations, and summaries accumulate in the single active transcript. Copilot users hit context walls sooner on exactly the work where the methodology promises them they're safe. Mitigation: **aggressive wave-splitting with explicit human-initiated session boundaries** — each wave becomes its own chat session, `/handoff` artifacts carry state across session boundaries, not across background tasks. Called out in the honest-trade-offs README (Commitment C8). |
| `/sprint-boundary` Step 5b/5c (Ines + Diego audit, Playwright visual smoke) | DEGRADED | These steps fan out to multiple personas — on Claude Code they run concurrently, on Copilot's serial-by-assumption model a sprint boundary on a web app becomes 5+ sequential subagent round-trips. Protocol *content* survives (same audits happen); wall-clock latency and token cost multiply. Web-app projects should expect a sprint close to take materially longer on Copilot. Documented in honest-trade-offs README. |
| MCP server integration | FULL | GA; escape hatch for tracking adapters. |
| `maxTurns` per agent | MISSING | No frontmatter field. Mitigation: write agents that self-terminate on structured output; orchestrator imposes per-step bounds. |
| Agent-notes protocol | FULL | Pure prose convention. |
| Voice / personality via model pinning | PARTIAL | `model` field supports pinning, but catalog is Copilot-hosted. High-voice personas (Pierrot, Wei) may read differently. |
| `/sprint-boundary`, `/handoff`, `/resume` | DEGRADED | Portable as prompt files, but `run_in_background` loss means multi-wave sprints compress to single-session or split explicitly across user-initiated sessions. |

### Revised parity estimate: **50% at ship; 72% target post-Commitments 1/4/5 verified**

The round-1 figure of ~85% assumed parallel subagent invocation was a canonical, documented pattern. Re-verification shows it is not. That single downgrade propagates: three-lens review, Architecture Gate, and blackboard debugging all depend on fan-out, and the round-2 reclassification of three-lens and Architecture Gate to DEGRADED-unconditionally removes the "fixable with parallel support" escape hatch. With a scripted `debate-moderator` that works under either concurrent or serial execution, the *content* of the protocols survives — but composition looseness, turn economics, and independence-of-read are genuinely reduced.

Against Wei's 40%: Wei's number assumes orchestration will not be written, that the community/maintainers will lean on the host to "just handle it." The honest framing is a **ship-time parity of 50%** — what the project actually delivers on day one, before any of the load-bearing commitments are verified in production. The **72% target** is contingent on three specific commitments landing and being verified: C1 (deterministic orchestrator prompts shipped), C4 (CI sync check green on every PR), and C5 (tool-scope verification completed on spike-0). Until those are verified in a shipped distribution, the defensible number is 50%. The README and all user-facing parity claims use the "50% at ship; 72% target" framing until the three commitments are verified.

## Wei's residual concerns — direct engagement

### 1. Multi-round debate is DEGRADED, not FULL

**Acknowledged.** Decision 3 commits to a named mechanism: a `debate-moderator.agent.md` with a deterministic state machine backed by **artifact-level enforcement** of the round-2 invariant (see Commitment C2). The tracking artifact at `docs/tracking/<topic>-debate.md` must contain a populated `## Round 2` section before the moderator synthesizes; a check script verifies this structurally. The risk Wei named — "Wei produces a list, Archie never actually defends" — is mitigated not by prompt exhortation ("you MUST re-invoke") but by the check script refusing to pass an artifact missing the round-2 structure. Additionally, the smoke-test prompt file (`.github/prompts/smoke-debate.prompt.md`) exercises the round-2 path and is wired into `/sprint-boundary` per Commitment C6.

### 2. Fleet mode ≠ Grace's Parallel Work

**Acknowledged.** Copilot's fleet dispatches generic workers against a queue; Grace's market model has domain-affine personas self-claiming work (Dani → UI, Ines → infra, Diego → docs). These are not the same abstraction.

Two viable paths:

- **Port the intent, not the mechanism.** Grace's Parallel Work becomes a single-session prompt file (`.github/prompts/self-claim-triage.prompt.md`) that lists unclaimed issues and lets the human invoke the appropriate persona subagent per issue, sequentially. This loses concurrency but preserves domain-affinity claiming. The workflow is ported at DEGRADED fidelity.
- **Workflow exclusion.** Treat Parallel Work as not-applicable to IDE Chat, same as `/sprint-boundary` multi-wave is degraded by `run_in_background` loss.

**Recommendation: DEGRADED port via Option 1, with a labeling rename on the Copilot artifact only.** Domain-affinity matters for Summon's voice; dropping it loses the team metaphor. Concurrency loss is acceptable because IDE Chat is interactive anyway — the human is present to sequence.

**Labeling:** The Claude Code artifact continues to call the workflow **"Parallel Work"** because on Claude Code it actually *is* parallel (Grace dispatches to concurrent subagents). The Copilot-side artifact renames the workflow to **"Self-claim triage"** to avoid implying concurrency that the runtime does not provide. This is a **labeling difference across runtimes, not a concept rename.** The underlying methodology (domain-affine self-claiming, Grace as coordinator) is identical; only the surface label shifts. Documentation that references the workflow by name must disambiguate per runtime: Claude Code docs say "Parallel Work"; Copilot docs say "Self-claim triage"; cross-runtime methodology docs under `docs/methodology/` say "Parallel Work / Self-claim triage" on first reference.

### 3. Tool allow/deny enforcement

**Verified:** VS Code docs state *"If a given tool is not available when using the custom agent, it is ignored."* This language implies runtime filtering by the host — a whitelist, not a hint. This is a strong signal but not a full confirmation.

**Mitigation:** First implementation spike includes an explicit test — create `wei.agent.md` with an empty `tools` list (or `tools: [read, grep, glob]`), then attempt a Write via chat. If the Write succeeds, we know `tools` is advisory; mitigation is to add guard-rail prose at the top of every tool-scoped persona ("YOU MAY NOT WRITE OR EDIT FILES. If asked, refuse and state your scope.") and accept that a motivated user can still bypass it. Same posture as Claude Code, where tool restrictions can likewise be talked around in practice.

### 4. `maxTurns` guardrail loss

**Acknowledged, no first-class mitigation.** No VS Code setting or frontmatter field reinstates `maxTurns`. Mitigation:

- Orchestrator agents impose per-step bounds in their own prompt ("You will invoke at most 3 subagent calls per phase.").
- Persona prompts include termination criteria ("When the tracking artifact contains a final recommendation and the human has responded, your turn ends.").
- We accept that a looping persona on Copilot is easier to trigger than on Claude Code. This goes in the README honest-trade-offs section.

### 5. Voice drift

**Acknowledged.** The `model` field accepts a prioritized list, giving us model pinning per persona. Copilot's exposed catalog includes GPT-class, Claude-class, and Gemini-class options (subject to org entitlement). We pin:

- **Wei, Pierrot** (personality-forward) → Claude-class (Sonnet or Opus tier) as primary; GPT-class fallback.
- **Archie, Tara, Sato** (disciplined, structured) → either tier; default to whatever the org entitles.
- **Dani, Cass** (voice moderate) → host default.

Voice drift remains a real risk for orgs that entitle only GPT-class. README documents this.

## Commitments that close the parity gap

These are the engineering disciplines the project commits to. Without them, the "50% at ship; 72% target" framing collapses to 50% permanently. With C1, C4, and C5 specifically verified in a shipped distribution, the 72% target unlocks; Wei's "primitive exists but discipline is uncommitted" critique is answered in prose that the project will be held to.

1. **Deterministic orchestrator prompts.** Every multi-round debate workflow (Architecture Gate, three-lens review, blackboard debugging) ships as a `.github/prompts/<workflow>.prompt.md` that invokes `debate-moderator.agent.md`. Moderator behaviour is defined by prompt, not by relying on LLM initiative.

2. **Round-2 is enforced at the artifact level, not by prompt exhortation.** The `debate-moderator` is required to write a tracking artifact at `docs/tracking/<topic>-debate.md` that contains a `## Round 2` section with **one entry per participant** before it is allowed to emit its synthesis. A lint/check step (`scripts/check-debate-artifact.ts`, invoked as part of the `/sprint-boundary` command and available as a standalone check) verifies this structure: the artifact must have a `## Round 1` section with N entries and a `## Round 2` section with N entries, where N equals the participant count declared at the top of the file. If the `## Round 2` section is absent, empty, or under-populated (fewer entries than participants), the moderator's final output must contain the literal string `PROTOCOL VIOLATION: round 2 skipped` and the human is alerted. The mechanism is verifiable from the artifact alone — no prompt-level enforcement, no reliance on LLM initiative to self-report compliance. This is the point: prompt-level "you MUST" clauses are advisory to the model; artifact-level structural checks are binary and auditable.

3. **Tracking artifacts are moderator-written.** `docs/tracking/<topic>-debate.md` is written by the orchestrator, never by the participant subagents. This preserves the debate's adversarial framing (participants can't self-edit their position between rounds) and gives us a single narrator.

4. **CI sync check.** A GitHub Actions step runs `pnpm run generate:copilot --check` on every PR. If the diff is non-empty, the PR fails. A companion check verifies that every `.claude/agents/*.md` has a matching `.github/agents/*.agent.md` (and vice versa). New personas without Copilot twins cannot merge.

5. **Tool-scope verification on spike-0.** Before the first Copilot distribution ships, a verification task (tracked as an issue) confirms whether `tools` frontmatter is enforced or advisory. Result documents in the README honest trade-offs table.

6. **Smoke-test prompt files — wired to sprint-boundary.** Every workflow with non-trivial orchestration ships a `.github/prompts/smoke-<workflow>.prompt.md` that exercises the happy path. These are **not ceremonial** — the `/sprint-boundary` command grows a new step that invokes each smoke-test prompt and fails the sprint boundary if any smoke-test does not produce its expected artifact (e.g., the debate-smoke must produce a `docs/tracking/smoke-debate.md` with populated Round 1 and Round 2 sections; the three-lens-smoke must produce three reviewer sections in a synthesis artifact). A sprint cannot close while smoke-tests fail. Implementation of the new `/sprint-boundary` step is a tracked follow-up work item — this ADR commits to *wiring*, not to demoting the commitment to best-effort. The `sprint-boundary.md` command edit itself is implementation work and does not happen in this ADR.

7. **Model pinning catalog.** `docs/process/copilot-model-pins.md` documents which model each persona targets and the voice-drift assumptions. Updated whenever the Copilot model catalog changes.

8. **Honest trade-offs README.** The Copilot distribution's top-level README declares, in plain prose, what degrades vs. Claude Code. The README MUST explicitly name:
   - `maxTurns` loss and its looping-risk implications.
   - `run_in_background` absence and the session-management consequence: multi-wave sprints compress to **aggressive wave-splitting with explicit human-initiated session boundaries**, not background-task parallelism. Users will hit context walls sooner on long sprints; the mitigation is smaller waves and more frequent `/handoff` invocations.
   - Parallel-invocation uncertainty and the unconditional-DEGRADED classification of three-lens review and Architecture Gate.
   - `/sprint-boundary` Step 5b/5c serial fan-out on web-app projects — sprint closes take materially longer on Copilot than Claude Code because Ines/Diego audits and Playwright visual smoke run sequentially rather than in parallel.
   - Model-voice variation on low-entitlement orgs (Pierrot, Wei flatter without Claude-class models).
   - The "Parallel Work" vs. "Self-claim triage" labeling difference across runtimes.
   Silent under-delivery is a trust failure; we state the gap explicitly. Parity claims in the README use the "**50% at ship; 72% target post-Commitments 1/4/5 verified**" framing until those commitments are verified in production.

## Consequences

### Positive

- Unlocks a materially larger user base. Copilot's installed base dwarfs Claude Code's.
- Forces Summon's methodology into platform-neutral language, improving the `docs/methodology/` prose.
- Validates the persona/command abstraction — if it ports, it's less Claude-Code-coupled than it appears.
- MCP tracking adapters benefit both surfaces; reusable investment.
- The `debate-moderator` orchestrator, once built, retrofits to Claude Code as a more deterministic alternative to free Task composition. Net win for protocol reliability.

### Negative

- **Two maintained distributions.** Generator script and CI sync check are ongoing cost. Acceptable if Commitment 4 lands; catastrophic if it slips.
- **Debate orchestration is ceremonial.** New debate patterns require editing the moderator and shipping a new prompt file — not freely composable the way Claude Code Task calls are.
- **`maxTurns` loss.** Runaway loops are easier on Copilot. We accept the risk and mitigate in prose.
- **Parallel-fan-out is unconfirmed, and even if confirmed does not restore FULL parity.** If Copilot serializes multiple `agent`-tool calls within a turn, three-lens review and Architecture Gate take 3× (or 2×) the wall-clock and token cost. Even under concurrent execution, orchestrator-transcript bias prevents true independence-of-read; three-lens review and Architecture Gate are DEGRADED unconditionally, not contingent on parallel support.
- **Platform churn.** `.agent.md` frontmatter is evolving. Field renames force generator-script updates.
- **Voice drift for orgs without Claude-class entitlement.** Pierrot and Wei read flatter on GPT-only tenants.
- **`.prompt.md` argument handling differs from `$ARGUMENTS`.** Per-command translation work.

### Neutral

- Methodology prose under `docs/methodology/` ports verbatim.
- `AGENTS.md` convention maps onto `CLAUDE.md`.

## Risks

1. **Orchestrator drift.** The `debate-moderator` prompt becomes load-bearing; its quality determines whether the debate protocol works at all. A careless edit breaks every dependent workflow. Mitigation: treat `debate-moderator.agent.md` as hot code — changes require an ADR update or Wei review, same as a schema migration.

2. **Parallel subagent invocation is unconfirmed.** Round-1 claimed this as canonical; re-verification on 2026-04-14 found it undocumented. If the host serializes `agent`-tool calls within a turn, three-lens review and Architecture Gate fan-out degrade to sequential execution. Mitigation: the moderator is written to be execution-order-agnostic; the protocol works either way, just slower under serial.

3. **`tools` field turns out to be advisory.** If the spike-0 verification shows the `tools` whitelist is a hint, not enforcement, then Cam-the-read-only-persona can be talked into writing a file. This is the same situation as Claude Code at baseline. Mitigation: prose guardrails in every tool-scoped persona prompt + README acknowledgement.

4. **Generator script as a single point of failure.** If the generator has a bug, every persona on Copilot is wrong. Mitigation (three-part): **(a)** generator has unit tests; first-spike acceptance includes a diff test between a hand-written reference `.agent.md` and the generated one. **(b) Quarantine mode.** If generation fails or the schema check fails mid-run, the generator MUST NOT silently succeed with partial output — instead, every emitted artifact is prefixed with a `GENERATION-STALE` banner at the top of the file (e.g., `<!-- GENERATION-STALE: generator failed at 2026-04-14T10:23:00Z; this file may not reflect .claude/ source. DO NOT USE IN PRODUCTION. -->`). Downstream consumers (Copilot, the CI sync check) detect the banner and refuse to load the persona. Silent staleness is the failure mode we are most worried about; the banner makes staleness loud. **(c)** Unit tests cover the banner-emission path — a synthetic generator failure must produce banner-stamped output, not an empty directory or a partial write.

5. **Copilot feature churn.** `.agent.md` frontmatter may rename `tools` or add required fields. Mitigation: pin the VS Code and Copilot extension versions in the README; generator script has a schema-version check.

6. **Voice loss in low-entitlement orgs.** Documented, not mitigated at runtime.

## Open Questions

1. **Spike-0 verification items** (must run before first ship):
   - Is `tools` frontmatter enforced by the runtime or advisory?
   - Does Copilot permit multiple `agent`-tool calls in a single assistant turn, and are they parallel or serial?
   - Does Copilot auto-discover `.agent.md` from `.github/agents/` in workspace scope, or only from user profile?
2. **Does the moderator write to `docs/tracking/` via Write tool, or via a structured subagent response?** The former is simpler; the latter is cleaner for audit.
3. **How do `handoffs` interact with `agent`-tool subagent calls?** Unknown whether a handoff target can be simultaneously a subagent.
4. **Model pinning compatibility.** If an org entitles only one model class, the `model` prioritized-list fallback should work — to verify.

## Non-Goals

This ADR does **NOT**:

- Commit to a final file layout for `.agent.md` — `.github/agents/` is the recommended path pending spike-0 verification.
- Address Coding Agent (cloud) — explicitly out of scope; separate ADR if revisited.
- Address the marketing site, `create-summon` CLI, or methodology prose rewrites.
- Commit to supporting Copilot CLI, GitHub Mobile, or other Copilot surfaces.
- Take a position on which distribution is "primary." Source of truth for persona/command content is `.claude/` per Decision 4; runtime primacy is a separate question.

## Decision Points Summary (for the human)

1. **Persona/prompt layout** — per-persona `.agent.md` and per-command `.prompt.md` in `.github/agents/` and `.github/prompts/`. Recommended.
2. **`$ARGUMENTS` translation** — mechanical per-command with bespoke rewrite for argument-as-state commands. Recommended.
3. **Debate orchestrator** — deterministic `debate-moderator.agent.md` with scripted round-2 re-invocation and moderator-written tracking artifact. Recommended.
4. **Source of truth** — `.claude/` is canonical; generator script + CI sync check produce Copilot artifacts. Recommended.
5. **Is "50% at ship; 72% target post-Commitments 1/4/5 verified" parity acceptable?** Archie's read: yes, because the residual gap is composition ergonomics, orchestrator-transcript independence loss, and specific workflows (`run_in_background`, `maxTurns`, multi-persona sprint-boundary fan-out), not protocol *content* fidelity. The ship-time number is 50%; the 72% target unlocks only after C1, C4, and C5 are verified in production.

---

## Round-2 adjudication (2026-04-14)

Wei's round-2 read delivered "Support with Conditions" (7 items). Human adjudication on 2026-04-14 was **accept all 7**, plus one additional item the human confirmed with Archie (sprint-boundary Step 5b/5c serial-fan-out degradation). The following conditions were incorporated into this ADR before it was marked Accepted:

1. **Parity reframing.** Headline figure updated to "50% at ship; 72% target post-Commitments 1/4/5 verified" across the Summary section, capability-matrix header, Consequences, and Decision Points Summary.
2. **C2 upgraded to artifact-level invariant.** Moderator compliance is now verified structurally (populated `## Round 1` and `## Round 2` sections in the tracking artifact), not by prompt exhortation. A check script refuses to pass malformed artifacts; protocol violations emit a literal `PROTOCOL VIOLATION: round 2 skipped` string in the output.
3. **C6 wired, not ceremonial.** `/sprint-boundary` will grow a new step that fails on smoke-test failure; the step's implementation is a tracked follow-up work item. The commitment here is to *wire*, not to demote.
4. **Three-lens review and Architecture Gate reclassified DEGRADED unconditionally.** Rationale: orchestrator-transcript bias prevents true independence-of-read even when subagent sub-contexts are isolated. Independence is a property of simultaneity, not of isolation.
5. **Session-management / `run_in_background` loss** added as an explicit DEGRADED workflow row in the capability matrix, with aggressive wave-splitting + explicit human-initiated session boundaries as the named mitigation. Called out in Commitment C8.
6. **Generator quarantine mode** added to Risk 4: generator failure emits `GENERATION-STALE` banner on every artifact rather than silently succeeding; downstream consumers refuse to load banner-stamped personas; banner-emission path is covered by unit tests.
7. **"Parallel Work" → "Self-claim triage"** on the Copilot artifact only. The Claude Code artifact keeps "Parallel Work." Cross-runtime methodology docs disambiguate on first reference. This is a labeling difference across runtimes, not a concept rename.
8. **Sprint-boundary Step 5b/5c serial fan-out** explicitly called out as DEGRADED in the capability matrix and in the honest-trade-offs README (C8). Web-app projects should expect materially longer sprint closes on Copilot.

Accepted 2026-04-14; see round-2 critique for the conditions applied.
