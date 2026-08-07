<!-- agent-notes: { ctx: "Architecture Gate on the comms-register work order; five lenses, 66 findings, 3 vetoes; input to ADR-0015", deps: [docs/history/design/2026-08-07-comms-refit.md, docs/process/team-governance.md, docs/adrs/meta/0007-canon-meta-boundary.md, docs/adrs/meta/0012-executable-canon.md], state: complete, last: "claude@2026-08-07", key: ["direction sound, packaging rejected", "keep epistemic claim tagging", "hooks Node not Python, earn-gated", "C2 persona-voice call belongs to the human"] } -->

# Architecture Gate — Edge-Conditioned Communication Registers

**Date:** 2026-08-07 · **Input:** `docs/history/design/2026-08-07-comms-refit.md` (operator-authored work order, 470 lines) · **Output:** the scope for ADR-0015 · **Branch:** `feat/comms-register-refit`

## Verdict

**The direction is sound; the packaging is rejected as specified.** The brief bundles one genuinely novel mechanism with four renames of ratified canon and three blocking enforcement mechanisms, two of which contain fail-closed defects. Ship the mechanism, write the ADR, earn-gate the enforcement.

Five lenses ran concurrently with disjoint prompts and no visibility into each other's output: Archie (19 findings), Pierrot (18), Diego (17), Wei (9 objections), Pat (8). All five sentinels verified present at end-of-file; Pierrot's declared count matched 18 distinct finding IDs in the file.

## What survives

**Epistemic claim tagging with evidence binding.** Every claim declares `OBSERVED | INFERRED | HYPOTHESIS | UNKNOWN`; `OBSERVED` requires an evidence locator; `unknowns[]` is mandatory rather than optional. Three lenses kept it independently and for three different reasons — Wei because it is the machine-checkable form of the Done Gate's proof grades, Pat because it gates truncated returns at zero cost to persona, Pierrot because it attacks Summon's false-green failure mode. Convergence from disjoint prompts is why this is the keeper.

It maps onto vocabulary Summon already has. The Done Gate's proof grades (`deterministic` / `inferential` / `human`) and the brief's epistemic tags are the same concept arriving twice under different names; ADR-0015 must reconcile them rather than ship both.

**Honest scope, per Pierrot:** worth real review-quality gains, and nothing at all against an adversary. That sentence belongs in the shipped copy verbatim.

## What is rejected as specified

### Three vetoes (Pierrot)

| # | Vetoed | Lift condition |
|---|---|---|
| V1 | Shipping the hooks as ADR-0007 canon | An Architecture-Gate ADR on "Summon ships executing code into user repos", the Node ESM rewrite, and explicit opt-in consent. Hooks stay framework-only until then. |
| V2 | The `veto: true` authority claim | A recorded probe of the real `SubagentStop` event proving `agent_type` is harness-supplied, **plus** honest wording that it names which agent the coordinator spawned, not a principal. Or delete the check. |
| V3 | The `REGISTER: CHARACTER` escape | Removal (route CHARACTER through the packet as `register: "character"`) or transcript-derived register. **Not liftable by a TODO.** |

### Two defects that are bugs, not opinions

**D1 — the validator fails closed into silence.** `validate_packet.py:232` reads `raw = (evt.get("last_assistant_message") or "").strip()`. The brief's own §1.4 concedes `last_assistant_message` may not exist on this Claude Code version. If it is absent — or if the agent hit `maxTurns` and returned nothing, a known failure mode in this repo — `raw` is `""`, `json.loads("")` raises, and the hook blocks **every return, always**. The agent then burns its remaining turns re-emitting into the same block. Nothing at the call site distinguishes "blocked into silence" from "completed successfully". *Fix: fail open on empty or absent input; never block below an unobservable turn budget; keep the prose sentinel.*

**D2 — the BRIEF lint blocks the system from discussing itself.** The `LEAKS` regexes (`"epistemic"`, `"acceptance"`, `SpecialistReportV1`, `REGISTER: CHARACTER`) are the names of the system's own artifacts. Any coordinator turn explaining the register model, answering "what fields are in the packet?", or surfacing a governance conflict is blocked — **including the brief's own §10.3 requirement that the final report surface governance conflicts.** The hook never inspects `stop_hook_active`, so a rewrite tripping a different pattern re-blocks: livelock. Blocking the *final* message also has no good failure mode — the human is waiting and the turn cannot complete. *Fix: warn-only on landing, `stop_hook_active` honored, promotion to blocking gated on a stated numeric false-positive criterion.*

### The product risk (Wei O2, Pat Q2, Archie C2 — three independent arrivals)

If specialist→coordinator returns are persona-free JSON and the coordinator emits a 1–3 sentence BRIEF, persona reaches the human only through the CHARACTER edge — the human addressing a specialist directly. Pat priced that edge at **under 10% of invocations** from the documented workflows; review waves, TDD, the architecture gate, and sprint boundary are all coordinator-dispatch. Wei's framing: you keep the persona *cost* (the text still loads and still shapes stance) and discard the *benefit*.

This partially reverses **ADR-0012 §F**, ratified 2026-08-04 — three days before this brief — which decided personas stay because they are "Summon's pedagogy, its documentation voice, and its brand", with the context cost "accepted as a product decision". A proposal that reverses a decision that recent is a re-litigation and belongs in the gate, not in an append-only work order.

**Pat's repair, which the gate adopts as the recommended shape:** a structured envelope with required mechanical fields (sentinel, finding count, severity, path, evidence, action) **plus** a persona `narrative` field. That buys 100% of the mechanical defense against truncated and false-green returns at zero product cost. Strict persona-free JSON, if still wanted, is an ADR amendment — not a work order.

### The `voice` field ships dead (Wei O6)

It is forbidden on coordinator returns, which is the only edge `SubagentStop` observes. Its one sanctioned use — specialist↔specialist peer messages — requires `PreToolUse` validation the brief explicitly defers, and the brief concedes `SendMessage` may be unavailable. Its "strip test" is a human reading two JSON blobs and asserting nothing changed: an unfalsifiable judgment, not a test. Fact-smuggling in twenty words is trivial. *Drop until peer traffic exists.*

## Governance conflicts (surfaced, not resolved)

Per the brief's own §0, conflicts stop the step. Nine were found; three are Critical and blocking.

- **C1 (Critical)** — the five registers supersede the ratified two-tier protocol at `docs/process/team-governance.md:195-199`. Archie's read, which the gate endorses: frame it as a **refinement, not a replacement** (PACKET/NOTES ⊂ inner loop, BRIEF/CHARACTER ⊂ outer loop, REPORT is the genuinely new one). That makes the supersession narrower and more honest.
- **C2 (Critical)** — persona-free REPORT/PACKET contradicts `team-governance.md:183-193`, which names *reports* and *reviews* specifically as outputs where voice must come through. Those are exactly the two the brief strips. **This is a product-identity decision and belongs to the human.**
- **C9 (Critical)** — the brief's §3 instructs "remove any content the contract now duplicates" from 168 lines of ratified `CLAUDE.md`, with no allowlist, no diff-review step, and no acceptance check. It also contradicts the brief's own §0 "append, don't rewrite". *The refit is strictly additive to CLAUDE.md; any removal is a separate, enumerated, human-reviewed change.*
- **C3** — a regex-over-prose predicate is judgment, which ADR-0012's ladder places at Prose tier, not Hook tier.
- **C4** — Python hooks in a zero-Python pnpm repo. **ADR-0012's "degrade explicitly, never silently" clause does not bless this**: that clause is a floor for *unavoidable* degradation, not a license for self-inflicted degradation. Its precondition is that no cheaper alternative exists, and one does — Node ESM is already the house language. It also fails mechanically: a hook that cannot start because `python3` is missing has no channel to announce anything, because the announcement machinery is inside the thing that failed to launch.
- **C5** — `AGENTS.md` as an authored root original collides with ADR-0006, under which `.claude/*` Markdown is the single source and cross-runtime artifacts are projections.
- **C6** — `@AGENTS.md` at CLAUDE.md line 1 inverts the First-Run Detection guard clause, whose whole job is to short-circuit. (No positional parser exists, so this is Important, not Critical.) *Place the import after the guard.*
- **C7** — "only Pierrot may set `veto: true`" and "ASSIGN/DECIDE are coordinator-only" read as security properties. A hook validates *shape*, never *provenance*. ADR-0012's honesty clause forbids describing this layer as tamper-proof. **Non-negotiable: the docs must not claim these are unforgeable.**
- **C8** — introducing `.claude/skills/` instantiates the content-injection surface that open issue #79 flags as unaddressed.

## The meta-finding

**Five load-bearing claims about Claude Code harness behavior in this design are unverified** — the `SubagentStop` event shape, nonzero-exit semantics, `transcript_path` access, `${CLAUDE_PROJECT_DIR}` expansion inside `args`, and recipient visibility. Archie found a sixth: the `skills:` frontmatter key appears nowhere in this repo and is unproven on the target runtime, which gates two of the ten proposed artifacts.

Pierrot's framing: **that count is the finding.** It is the pattern of open issue #93 — a spec-only ADR asserting falsifiable facts about external systems with no verification requirement, facts that then shipped as security copy — recurring here in the enforcement layer.

This generalizes past this brief. Summon's ADR template has no verification requirement for claims about the harness. That is a gap in the template, and this is the second time it has bitten.

## Classification (ADR-0007)

The work order itself is **meta** — a work order addressed to Summon maintainers, superseded once the durable doc lands. Moved to `docs/history/design/2026-08-07-comms-refit.md` (date-prefixed per the convention: 18 of 20 history files carry a date; the two that do not are living reference docs). The stray `:Zone.Identifier` artifact was removed; `.gitignore:14` already covers the pattern, so no ignore change was needed.

All ten proposed artifacts classify **canon, zero meta**. Four ship a new trust surface: the two hooks and `settings.json` execute, and `SKILL.md` injects content.

**Archie and Pierrot appear to disagree here and do not.** Archie classifies the hooks canon; Pierrot vetoes shipping them as canon. They answer different questions — ADR-0007 asks *what audience is this file for*, and Pierrot's veto asks *is it safe to ship executing code into strangers' repos yet*. **Classification is not a shipping decision.** A file can be canon-by-subject and still be withheld pending a trust review. ADR-0015 should state this distinction explicitly, because it recurs for every future enforcement adapter.

## Documentation shape (Diego)

- **Home for the durable spec:** `docs/process/communication-registers.md`, against the brief's `docs/methodology/communication.md`. Methodology holds *formats* (agent-notes, debt-markers); process holds *conduct*. Decisive: the text it supersedes already lives in `process/team-governance.md`, and CLAUDE.md's index row for that file literally reads "voice rules". The `-registers` suffix is a scope-creep guard.
- **Resolving the collision:** delete `team-governance.md:183-199` outright — including the six per-persona voice bullets, which are a stale copy of `personas.md` — and replace with a five-line pointer stub. The inbound-link grep is clean (only the file itself), so the move is link-safe.
- **Single-source layout:** three sources — `communication-registers.md` (prose spec), `packet.schema.json` (structure), and a one-line register binding per agent file. Everything else is a pointer, with an explicit "the document wins" precedence sentence. This replaces the brief's ~304 lines of copy-pasted block across 16 agent files, which is a drift generator with no single source.
- **Three things the brief misses:** CLAUDE.md says "voice rules" in **two** places (lines 43 and 137); `doc-ownership.md` has four columns and no team-governance row to amend; and the register names must **not** enter `docs/glossary.md`, which excludes Summon process vocabulary by its own text.
- **Naming:** REPORT and NOTES both collide with live repo vocabulary (agent reports, agent-notes). Diego recommends **BRIEF / VOICE / PACKET / ARTIFACT**, with NOTES dropped as already-shipped canon.

## Recommended sequencing

**Slice 1 — pure canon prose, zero trust surface.** ADR-0015 ratified first as the gate. Then `docs/process/communication-registers.md` as the single authored source, the supersession patch to `team-governance.md:183-199`, and epistemic claim tagging adopted as prose canon. Reversible by deleting one doc.

**Slice 2 — contract surfaces.** The flat schema, `AGENTS.md` and the comms skill as *projections* of the spec (resolving C5), CLAUDE.md coordinator rules with the import placed after the First-Run guard, and per-agent pointers — the last gated on empirical proof that `skills:` is honored by the runtime.

**Slice 3 — earn-gated hooks.** `validate_packet.mjs` (Node, not Python) plus `settings.json`, gated on slices 1–2 landing, the packet format holding stable across one real sprint, and V3 resolved. Silent bypass does not pass the gate.

**Slice 4 — deferred.** `lint_brief.mjs`, warn-only on landing; promotion to blocking is a separate PR with a numeric criterion.

**Priority (Pat):** LATER. It displaces nothing. It queues behind #79, #93, #81, #82, and #91 — making Slice 1 sixth of nine. Authorship by the human is signal about a real daily irritant, but it is not a priority argument.

## Open decision for the human

**C2 — does persona voice survive on specialist→coordinator returns?** Three lenses flagged it; Archie declined to decide it on the grounds that it is a product-identity call. The options are: accept the loss and amend the voice rule to CHARACTER-only; carve out reviews and challenges as always-persona regardless of edge; or adopt Pat's envelope-plus-`narrative` field. The gate recommends the third.
