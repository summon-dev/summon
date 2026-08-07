---
agent-notes: { ctx: "ADR: edge-conditioned communication registers; envelope+narrative return contract; gated 2026-08-07 (round 2: Wei 7)", deps: [CLAUDE.md, docs/adrs/template.md, docs/process/team-governance.md, docs/process/doc-ownership.md, docs/methodology/agent-notes.md, docs/methodology/personas.md], state: proposed, last: "archie@2026-08-07", key: ["TWO registers only — BRIEF and PACKET; the model is a selection rule, not a taxonomy", "envelope+narrative REJECTS the brief's persona-free PACKET (Pat: CHARACTER edge <10% of invocations)", "W3: envelope is the record — narrative-only facts are NOT reported; validator asserts finding_count === claims.length", "REPORT deferred WITHOUT a name; NOTES dropped; CHARACTER dissolved into the narrative field", "W7 PROBE FALSIFIED the draft: team-governance:188-193 is 4-of-6 duplicate — Tara + Pat tone descriptors must migrate to personas.md BEFORE deletion", "8 UNVERIFIED harness claims; Slice 2.5 disposable probe harness breaks the U-gate circularity", "hooks are canon by subject and WITHHELD from the payload — classification is not a shipping decision", "adapters are Node ESM; ADR-0012's announce-clause is a floor for unavoidable degradation, not a licence", "spec lands in process/, not methodology/ (conduct vs format)"] }
---

# ADR-0015: Edge-conditioned communication registers

## Status

**Proposed** — 2026-08-07. Work item: issue #94. Ratification pending human sign-off. No implementation may begin until this ADR is Accepted (CLAUDE.md § Critical Rules, "ADR Before Implementation").

Two review rounds are incorporated: a five-lens gate on the originating brief, and Wei's challenge to this draft (7 objections, 1 blocking, all accepted). Point-by-point dispositions are in § Gate record below. Gate record file: `docs/history/tracking/2026-08-07-comms-register-gate.md`. Originating brief: `docs/history/design/2026-08-07-comms-refit.md`.

## Classification: canon

Per ADR-0007 §1 — ask the test question: when a stranger scaffolds a payments app with `summon-team`, does this file help *them*? Yes. It governs how their coordinator addresses them, what their specialists must return before a finding counts as reported, and which of their agents' claims need evidence attached. That is methodology the user's project runs, not Summon's plumbing. It sits in the canon zone `docs/adrs/` alongside 0001 (conventional commits), 0002 (TDD), 0013 (design authority).

**Classification is not a shipping decision, and this ADR is the case that proves it.** The enforcement adapters specified in Sub-decision 3 are classified **canon by subject** — a hook that validates the user's agents serves the user — and are simultaneously **withheld from the shipped payload** by Sub-decision 6 pending a trust review. Both hold at once. ADR-0007 asks *what audience does this file serve*; the withholding asks *is it safe to put executing code in a stranger's repo yet*. Those are different questions with different answers, and conflating them would either misclassify the hooks as meta (wrong — their subject is the user) or ship them prematurely (wrong — see Sub-decision 6). Every future enforcement adapter should expect the same two-step, and this paragraph exists so the next one does not re-derive it.

## Context

Summon's agents talk to two audiences that want opposite things, and today one rule governs both.

A human reading a security finding wants Pierrot's voice — the dark humour is what makes the finding land and be remembered. A coordinator receiving that same finding wants a field it can branch on: is this Critical, is there evidence, did the agent finish. When the only rule is "voice must come through", the coordinator is left parsing prose for structure, and the failure mode is the one CLAUDE.md already names in § Critical Rules: **a truncated report that reads "looks clean" is a false green that can ship a real bug or a missing auth check.** The existing defence is a hand-rolled sentinel line and a coordinator remembering to look for it.

The originating brief proposed fixing this by conditioning communication style on the **sender → receiver edge** rather than on agent identity. That insight is correct and is the core of this ADR. The brief's specific packaging was reviewed by five lenses at the 2026-08-07 gate and substantially revised; where this ADR departs from the brief, it says so and says why.

Ratified canon this decision touches:

- `docs/process/team-governance.md:183-193` — "Agent Voice and Personality": *"Their voice must come through in their outputs — reports, reviews, challenges, and recommendations."*
- `docs/process/team-governance.md:195-199` — "Tiered Communication Protocol": two tiers, agent-to-agent ("no personality needed") and agent-to-human ("personality comes through").
- `docs/methodology/agent-notes.md` — the agent-notes protocol, which already specifies the notes-to-future-agents register.

Three **meta** ADRs also bear on this decision and are cited below by number and title only: **ADR-0006** (multi-runtime install — `.claude/*` Markdown is the single source, other runtimes are derived projections), **ADR-0007** (canon/meta boundary, including the individual-file rule that subject beats directory), and **ADR-0012** (executable canon — the enforcement ladder Hook > Script > Workflow > Prose, the tie-breaker preferring scripts where determinism is equal, enforcement adapters as an asset class, announced degradation, and the tamper-boundary honesty clause).

**Dependency hygiene.** `scripts/check-canon.mjs` fails CI on a canon→meta edge, so this file's `deps` list names only canon files, and the meta ADRs above are cited in prose by title rather than carried as declared dependencies — precedent: ADR-0013 § Dependency hygiene, which established exactly this pattern. This ADR must stay readable and applicable in a scaffolded project where `docs/adrs/meta/` does not exist. Every mechanism borrowed from a meta ADR below is therefore written so that the meta ADR's absence degrades to plain prose discipline rather than to a dangling reference: the enforcement ladder is restated as a table here, the tamper boundary is restated in full here, and the projection rule is stated as a rule rather than as a pointer. The gate record and the originating brief cited under Status are likewise Summon-internal provenance — a scaffolded project will not have them, and nothing in this ADR's substance depends on reading them.

## Decision

Six sub-decisions.

### Sub-decision 1 — Adopt edge-conditioned registers as a *refinement* of the two-tier protocol, not a replacement

The unit of selection is the **edge** (who is sending to whom), not the agent. **This ADR specifies two registers:**

| Register | Edge | Shape |
|---|---|---|
| **BRIEF** | coordinator → human | Outcome first. No offer-menus. Findings surfaced, never summarised away. |
| **PACKET** | specialist → coordinator | One JSON object: mechanical envelope **plus** a persona `narrative` field (Sub-decision 2). |

**The register *model* is the selection rule, not a promise of a fuller taxonomy.** Two registers is the whole of it. If a third edge later earns a specified register, it gets its own decision record; nothing here reserves a slot for one, and no canon word ships to a stranger without a spec behind it.

This is a refinement, not a repeal — but the word describes the *idea*, not the file. The brief's five registers map onto the existing two tiers cleanly (PACKET is the inner loop made explicit, BRIEF is the outer loop made explicit), so the tiers were right about the **axis** and under-specified about the **shape**. That axis is carried forward into `docs/process/communication-registers.md` and survives. The *text* at `team-governance.md:183-199` is superseded and deleted. Both statements are true at once, and the earlier draft of this paragraph claimed the deletion "keeps the reasoning intact", which is not a thing a deletion can do.

**Naming, adjudicated (not left open).** The brief's `REPORT` and `NOTES` collide with live repo vocabulary — Summon already uses "report" for agent returns generally and "notes" for the agent-notes protocol. `REPORT` is **deferred, not renamed-and-shipped**: the durable-artifact edge is real, but this ADR has no spec for it, and shipping the bare word `ARTIFACT` to a stranger who then looks it up and finds a table row is worse than shipping nothing. It moves to Deferred. `NOTES` is **dropped entirely**: `docs/methodology/agent-notes.md` already specifies that register as ratified canon, and re-specifying it here would create a second source for a solved problem. `CHARACTER` is **dissolved**, not renamed — Sub-decision 2 folds persona voice into PACKET, so a separate voice register has nothing left to carry. The proposed intermediate name `VOICE` is therefore also declined; it would name a register that no longer exists.

**Supersession, precisely.** `team-governance.md:183-199` — both `## Agent Voice and Personality` (183) and `## Tiered Communication Protocol` (195), stopping short of `## Parallel Agent Teams` (201) — is deleted and replaced by a five-line pointer to `docs/process/communication-registers.md`.

**The six per-persona voice bullets at 188-193 are *not* all duplicates. The earlier draft of this ADR asserted they were, and the probe falsified it.** Receipt: `sed -n '188,193p' docs/process/team-governance.md` compared line-by-line against `docs/methodology/personas.md`, run 2026-08-07 by the coordinator. Result — **4 of 6 duplicate, 2 do not**:

| Bullet | Verdict | Evidence |
|---|---|---|
| Pierrot — "dark humor" | duplicate | `personas.md:123` "Prone to dark humor." |
| Archie — "confident, visual-thinking, prefers diagrams" | duplicate | `personas.md:97`, near-verbatim |
| Wei — "just read something exciting on Hacker News" | duplicate | `personas.md:180`, same trait, different phrasing |
| Vik — "grizzled veteran who's seen every mistake" | duplicate | `personas.md:134` "in the industry forever… pushes back on 'clever' code" |
| **Tara** — "precise and relentless about edge cases" | **NOT a duplicate** | `personas.md:56` "uncanny knack for unhappy paths" covers the *behaviour*; the entry carries **no tone descriptor** |
| **Pat** — "terse and business-focused. 'Does this ship value to users?'" | **NOT a duplicate** | `personas.md:66` covers business focus; **"terse" is absent**, and the quoted line is unique to governance |

**Precondition on the deletion:** Tara's and Pat's tone descriptors are **migrated into `docs/methodology/personas.md` before** the 188-193 deletion commit, in the same PR. Not a follow-up. Deleting them unmigrated destroys ratified guidance that exists nowhere else.

**And the "single source" claim needs qualifying.** `personas.md` entries are written capability-first — agent file, capability, hybrid phases, behaviour — so voice appears for some personas incidentally and is absent for others. "personas.md is the single source for who sounds like what" is therefore **aspirational, not currently true**; the migration above is what starts making it true, for two of sixteen.

This matters more than a doc-hygiene note, because Sub-decision 2 makes `narrative` a **required** field on every specialist return. That contract assumes `personas.md` can tell each of the sixteen agents how to sound. Inconsistent voice coverage means inconsistent narratives, on the field this ADR just made mandatory. **A voice-coverage pass across all 16 personas is warranted and I am scoping it as a separate work item, explicitly not part of Slice 1** — Slice 1 migrates exactly the two descriptors its own deletion would otherwise destroy, and nothing more. Widening it silently is how a docs slice becomes a sprint.

Two adjacent repo-state claims **were** verified by the coordinator on 2026-08-07 and are recorded as such: the inbound-link grep for `team-governance.md`'s voice sections is clean (so the deletion is link-safe), and `docs/process/doc-ownership.md:14` has the four columns `Doc | Owner | Path | Update trigger` with no `team-governance.md` row.

**Placement.** The durable spec is `docs/process/communication-registers.md`, canon. Not `docs/methodology/`: methodology holds formats, process holds conduct, and the text being superseded already lives in process. Ownership is Diego's, with an added row in `docs/process/doc-ownership.md` (four columns: Doc | Owner | Path | Update trigger) — that table has no `team-governance.md` row today, so this adds coverage rather than amending it. `CLAUDE.md` references "voice rules" in two places, lines 43 and 137; both are repointed. Register names do **not** enter `docs/glossary.md`, which excludes Summon process vocabulary by its own text.

### Sub-decision 2 — The return contract is **envelope + narrative**, not persona-free JSON

A specialist return is one JSON object carrying both:

- **Envelope (mechanical, required):** `v` (schema version, `const 1`), `agent`, `state`, `finding_count`, `claims[]`, `unknowns[]` (mandatory, may be empty — an empty array is an assertion, an absent key is a defect), and per-claim `epistemic` / `severity` / `evidence` / `action`. `epistemic: "OBSERVED"` requires a non-empty `evidence` reference.
- **Narrative (prose, required):** the persona's own voice, written as the agent would write it.

The coordinator **gates on the envelope and forwards the narrative**. It does not paraphrase the narrative into house style; forwarding is the whole point.

**The `v` field is restored from the brief and is required.** The earlier draft of this ADR dropped it while listing the envelope, which would have left `schemas/packet.schema.json` with no version key at all — a schema that ships to strangers and whose first breaking change would arrive with no migration signal and no way for a consumer to tell which contract it is holding. `const 1` costs four bytes and buys the only affordance that makes v2 survivable.

#### Precedence: the envelope is the record

**A fact that appears only in `narrative` has not been reported.** Agents must land every finding in `claims[]` first; the narrative may only *color* what the envelope already contains. Where the two disagree, the envelope governs — it is the record, and the narrative is commentary on it.

This rule is not decoration, and it closes a defect that **the envelope + narrative repair itself introduced** — the originating brief did not have this hole, because its PACKET carried no prose to hide facts in. Adding a required, unbounded, verbatim-forwarded prose field re-opened the smuggling channel that the brief's ≤20-word `voice` cap was written to close, and re-opened it wider. The concrete failure: Vik's narrative reads *"the auth bypass in session.ts:88 is the real problem here"*, `claims[]` holds one medium logging finding, `finding_count: 1`. The envelope is internally consistent, the hook passes it, the coordinator forwards the narrative, and nothing reconciles the two. A Critical exists only in prose — which means **`finding_count` is a lie the validator certifies**. That is strictly worse than no validator, because it launders the false green through a check.

Accordingly, **the validator asserts `finding_count === claims.length` and blocks on mismatch.** Two sources for one number is a defect in a v1 schema; the assertion makes them one. It does not detect narrative smuggling on its own — nothing mechanical can read prose for unclaimed findings — but combined with the precedence rule it makes the smuggled finding *unreportable* rather than merely unrecorded: an agent that wants a finding to count must put it in `claims[]`, where it is counted.

Watch this in practice. If narrative-only findings show up anyway, the precedence rule is being ignored and the reversal trigger below fires.

#### BRIEF × multiple narratives

The two registers this ADR specifies meet on the most common path in the system — a parallel review wave — and the earlier draft left that meeting undefined. Three specialists return, each with a narrative; BRIEF says outcome-first and nothing omitted, Sub-decision 2 says forward verbatim, and "summarising is where findings die" makes naive concatenation the path of least resistance. Left unspecified, the human receives either a wall or a lossy digest, chosen ad hoc per wave.

**Rule for a multi-narrative wave.** The coordinator's BRIEF is: the outcome, then per-agent severity (the highest severity each agent returned, read from its envelope, not from its prose), then the narratives forwarded verbatim below under agent headings. **No narrative is dropped, and none is summarised.** The BRIEF is the index; the narratives are the body.

This keeps the anti-omission property that BRIEF exists for while giving the human a scannable top. It costs length, which is exactly the trade Sub-decision 3 makes when it strikes the brief's sentence ceiling: the control variable is *nothing omitted*, not *short*.

**This is a deliberate departure from the originating brief, which specified PACKET as persona-free with no prose.** The reason is a cost argument, not an aesthetic one. Pat priced the specialist → human edge at **under 10% of invocations** — so a persona-free return contract would pay the full context cost of loading persona definitions into every specialist and then discard the benefit on more than nine returns in ten. Persona context is not free; buying it and throwing away the output is the worst of both.

It also settles the conflict with `team-governance.md:183-193` without a loss. The ratified rule names *reports* and *reviews* specifically, which are exactly the outputs the brief stripped. Envelope + narrative keeps them voiced. The anti-false-green defence is bought by the **envelope** — `finding_count`, `unknowns[]`, and per-claim `evidence` are all machine-checkable, and none of them care whether the prose next to them is deadpan or dry. This does not reverse ADR-0012 §F.

**The `voice` field from the brief is deleted.** It is forbidden on the only edge SubagentStop can observe, and its one legal use depends on PreToolUse validation that this ADR defers. A field that is unusable everywhere it is reachable is dead weight in a v1 schema.

### Sub-decision 3 — Enforcement tier per artifact

Applying ADR-0012 §B and Wei's ratified tie-breaker (*prefer the script where determinism is equal; hooks are reserved for checks that must block at the moment of action*):

| Rule | Tier | Reasoning |
|---|---|---|
| PACKET envelope conformance on specialist return | **Hook** (`SubagentStop`) | The artifact is transient. It does not exist in repo state, so no script has any input at all. This is the only genuine moment-of-action case in the brief. |
| Register binding present in every agent file; AGENTS.md and the skill in sync with their source; every enforcement adapter names a canon source rule | **Script** (`scripts/check-canon.mjs`) | All decidable from repo state. |
| BRIEF conduct — offer-menu ban | **Script + Prose** | See below. |
| Act vocabulary, claim tagging honesty, coordinator-only acts | **Prose** | Judgment. A regex cannot decide whether a claim is really OBSERVED. |

**The BRIEF linter is cut down, not shipped as designed.** Two findings kill it in its proposed form:

1. Its `LEAKS` patterns are the names of the system's own artifacts (`"epistemic"`, `SpecialistReportV1`, the register marker). Any coordinator turn that explains the register model, reports on this ADR, or surfaces a governance conflict — which the brief's own §0 *requires* — would be blocked. That is a structural false positive on an entire legitimate conversation class, not a tunable rate.
2. It never inspects `stop_hook_active`, so a rewrite that trips a different pattern re-blocks: **livelock**, with the human waiting.

What survives is the **offer-menu ban as prose conduct** in `docs/process/communication-registers.md`. The brief's **1-3 sentence BRIEF ceiling is struck**: length is the wrong control variable, and a hard ceiling would truncate Critical findings — reintroducing the exact false-green hazard this ADR exists to close. The control variable is *outcome-first and nothing omitted*, not *short*.

**The CHARACTER escape is removed, not fixed.** The brief's validator exempted any return beginning with a literal marker string — a bypass triggered by the party being validated, which makes the hook advisory against intent. Removal is the only resolution: register selection rides **inside** the packet as a validated field, or is derived from the transcript. A TODO does not resolve this, and neither does logging it. (This is the one place where my own gate report offered a weaker option — "ship with the bypass logged and documented as advisory" — and that option is withdrawn.)

**Two bugs in the brief's hook are fixed before any adapter is written.** First, `raw = (evt.get("last_assistant_message") or "").strip()` followed by a JSON parse: the brief's own §1.4 concedes that key may not exist on this version, and a maxTurns-exhausted agent returns nothing either way. Parsing `""` raises, the hook blocks **every** return unconditionally, and the failure is silence — indistinguishable from success. That is fail-closed into a false green, which is the failure mode this ADR is built to prevent. Second, the missing `stop_hook_active` check above. Both get regression tests before the adapter lands.

### Sub-decision 4 — Enforcement adapters are written in **Node ESM**, and this is the general rule

All Summon enforcement adapters — this one and every future one — are `.mjs`, Node standard library, zero dependencies. The brief specified stdlib Python.

Summon has zero Python. All four existing checks (`scripts/check-canon.mjs`, `check-canon.test.mjs`, `check-css-contrast-motion.mjs`, `harvest-debt.mjs`) are Node ESM; the repo is pnpm + Node. Python would fork the toolchain for two files, ship a `python3` requirement to Node projects that never asked for it, and — per the brief's own acceptance checks — add a `jq` requirement on top.

**ADR-0012's "degrade explicitly, never silently" clause does not authorise this.** That clause is a **floor for unavoidable degradation** — it governs capabilities that genuinely are absent on a runtime or plan tier. It is not a licence for self-inflicted degradation; read that way it would bless any dependency as long as a warning printed. Its precondition is that no cheaper alternative exists, and here the cheaper alternative is the house language. The clause also fails mechanically: it requires announcement **at invocation**, and a hook that cannot start because `python3` is missing has no channel to announce anything, because the announcing machinery is inside the process that failed to launch.

Cost, honestly: roughly 100 lines of authored Python are discarded, a few hours of rewrite. Draft-07 validation is hand-rolled rather than delegated to a library — viable precisely because the schema is deliberately flat with no `$ref`, and consistent with the zero-dependency posture ADR-0013 §6 slice A already established. The flat-schema constraint keeps its original justification (grammar-constrained decoding in a future harness port) and gains a second one.

### Sub-decision 5 — `AGENTS.md` and the comms skill are **projections**; the process doc is the source

Three sources, everything else a pointer:

1. `docs/process/communication-registers.md` — the prose spec. **Authored.**
2. `schemas/packet.schema.json` — the structure. **Authored.**
3. A one-line register binding in each `.claude/agents/*.md`. **Authored** (one line, not the brief's ~19-line block).

`AGENTS.md` at repo root and `.claude/skills/comms/SKILL.md` are **generated projections** of (1), with a `check-canon.mjs` staleness rule. This satisfies ADR-0006 — a root cross-runtime file authored as an original would invert the model on its first real test and set a precedent that erodes it for every subsequent cross-runtime artifact. It also kills the brief's ~304 lines of copy-paste across 16 agent files, which is a drift generator with no single source.

**Precedence, stated explicitly because pointers rot:** where a pointer, a projection, and the process doc disagree, **the process doc wins.** Projections are rebuilt; pointers are corrected.

**`CLAUDE.md` wiring.** The `@AGENTS.md` import goes **immediately after** the First-Run Detection block, not at line 1. First-Run Detection is a guard clause whose entire job is to short-circuit before anything else applies; an uninitialised project should not be loading the register contract at all.

**The refit is strictly additive to `CLAUDE.md`.** The brief's §3 instruction to *"remove any content the contract now duplicates"* is **not executed**. `CLAUDE.md` is 168 lines of ratified operating canon with no allowlist, no diff-review step, and no acceptance check guarding it; an open-ended deletion licence over it is not a change this ADR authorises. Any removal is a separate, individually enumerated change with human line-by-line review.

### Sub-decision 6 — Trust surface, tamper boundary, and what is withheld

**Enforcement adapters are classified canon and withheld from the shipped payload.** They live framework-only until a separate Architecture Gate ADR covers three things: (a) the general question of Summon shipping executing code into user repos, (b) the Node ESM rewrite landing with tests, and (c) explicit opt-in consent at install time. Today Summon ships zero executable-on-agent-lifecycle assets; `.claude/settings.json` is the file that would change that, and it is a category change in what `summon-team` means, not plumbing.

**The tamper boundary, in ADR-0012's language and unsoftened.** This layer hardens against **drift and forgetting**. It does **not** harden against an adversarial or prompt-injected coordinator. A hook validates *shape*; it never validates *provenance*. Consequently:

- The `veto: true`-is-Pierrot-only rule and the coordinator-only acts **must not be described as unforgeable** in this ADR, in `docs/process/communication-registers.md`, in `AGENTS.md`, or in any projection. They are conventions with a shape check, and that is all they are.
- The `veto` authority check specifically depends on `agent_type` being harness-supplied and trustworthy. **This is UNVERIFIED (U8).** Even if a probe confirms the harness supplies it, the honest wording is that it names *which agent the coordinator spawned* — not an authenticated principal. If the probe fails, the check is deleted rather than reworded.
- `.claude/skills/` introduces Summon's first content-injection channel, which is exactly the surface open issue **#79** (ADR-0014 §11) flags as unaddressed. #79 is a blocker for the skill projection, not a follow-up.

### UNVERIFIED harness claims — the count is the finding

Eight load-bearing claims about Claude Code harness behaviour are asserted by the brief and **none were probed this session**. Listing them individually understates the problem; the pattern is issue #93 recurring, now inside security-adjacent code.

| # | Claim | Status |
|---|---|---|
| U1 | `SubagentStop` event shape, including the `last_assistant_message` key | UNVERIFIED |
| U2 | Nonzero-exit vs. `{"decision":"block"}` semantics | UNVERIFIED |
| U3 | `transcript_path` availability and readability from a hook | UNVERIFIED |
| U4 | `${CLAUDE_PROJECT_DIR}` expansion inside `args` | UNVERIFIED |
| U5 | Whether the blocked recipient actually sees the hook's `reason` | UNVERIFIED |
| U6 | `skills:` frontmatter key is honoured (no `skills:` key exists in the repo today) | UNVERIFIED |
| U7 | `stop_hook_active` presence and semantics | UNVERIFIED |
| U8 | `agent_type` is harness-supplied and reflects the spawned agent | UNVERIFIED |

**Every one is a gate on the slice that depends on it.** A recorded probe — command, raw output, date — is the only thing that clears a row. Prose confidence does not.

## Sequencing

Four slices. Each gate is decidable; none is a judgment call.

**Slice 1 — prose canon. No trust surface. Ships first.**
`docs/process/communication-registers.md`; deletion of `team-governance.md:183-199` plus the five-line pointer; additive coordinator rules in `CLAUDE.md` with both line 43 and line 137 repointed; the `doc-ownership.md` row.
**Gate — receipts before the deletion commit, not after.** The earlier draft read "Gate: none", which was wrong: this is the only slice containing an irreversible deletion, and it was licensed entirely by unproven repo-state equivalences. Required, all in the same PR as the deletion: (1) the inbound-link grep receipt — **discharged 2026-08-07, clean**; (2) the line-level `188-193 ⊆ personas.md` diff — **discharged 2026-08-07 and it FAILED, 4 of 6**; (3) consequent to (2), Tara's and Pat's tone descriptors migrated into `docs/methodology/personas.md` **before** the bullets are removed. Gate (3) is now the open one.
Value rationale: BRIEF conduct ranked first of five by Pat, and claim tagging plus `unknowns[]` is the highest-value idea in the brief at zero implementation cost.

**Slice 2 — the contract surfaces.**
`schemas/packet.schema.json`; the one-line register binding per agent file; `AGENTS.md` and `.claude/skills/comms/SKILL.md` as generated projections plus the staleness rule.
Gates: **U6** proven for the frontmatter key (if it fails, the binding ships as a plain line with no frontmatter change); and for the skill projection specifically, **an ADR addressing issue #79 has status Accepted**. The earlier wording was "#79 resolved", which has no acceptance criterion and would in practice be adjudicated by whoever wanted the slice to land on the day they wanted it to land. "An ADR is Accepted" is binary and checkable by someone with no stake in the outcome.

**Slice 2.5 — disposable probe harness. Not an adapter.**
U2 (nonzero-exit vs. `{"decision":"block"}`), U5 (does the blocked recipient see `reason`), and U7 (`stop_hook_active`) are behavioural claims observable **only by installing a hook that blocks** — so gating Slice 3 on them while authorising no artifact before Slice 3 makes Slice 3 formally unstartable. Left standing, the realistic resolution is someone quietly building the production adapter and calling it a probe, which is exactly the discipline this ADR is trying to install.
So: a throwaway hook whose only job is to echo its event payload and exercise the block path, run locally, **receipts recorded in the U-table, deleted in the same commit that records them.** It is not an enforcement adapter, is never shipped, is not gated on U1-U8, and names no canon source rule because it enforces nothing.

**Slice 3 — the validator, framework-only.**
`.claude/hooks/validate-packet.mjs` + `.claude/settings.json`, used by Summon on Summon and **not shipped**.
Gates: **U1, U2, U5, U7, U8** probed and recorded via Slice 2.5; the CHARACTER escape **removed** (not TODO'd); both Wei bugs fixed with regression tests; the `finding_count === claims.length` assertion implemented; the adapter names its canon source rule (`CLAUDE.md` § "Treat Agent Output as Untrusted" + this ADR §Sub-decision 2) or `check-canon.mjs` fails it.

**Slice 4 — shipping the adapters to user repos.**
Gate: a separate Architecture Gate ADR on executing code in user repos, plus opt-in consent. Not authorised by this ADR.

**Deferred, not scheduled:** a register for the durable-artifact edge (the brief's `REPORT`) — the edge is real, this ADR has no spec for it, and it ships no name until it has one; `PreToolUse` validation on peer messages; claim-store-compiled artifacts; the MAF/LangChain harness port; any promotion of BRIEF conduct from prose to a blocking check.

**Separate work item, not in any slice above:** a voice-coverage pass across all 16 personas in `docs/methodology/personas.md`, so that the `narrative` field Sub-decision 2 makes mandatory has a consistent source to draw on. Sized independently; Slice 1 migrates exactly two descriptors and stops.

**Priority: LATER.** Slice 1 is cheap and should land when convenient. Nothing here preempts current sprint commitments.

## Gate record

Architecture Gate 2026-08-07, issue #94. Five lenses reviewed the originating brief (round 1); Wei challenged this ADR draft (round 2, 7 objections, 1 blocking, none structural). Full record: `docs/history/tracking/2026-08-07-comms-register-gate.md`.

### Round 2 — Wei's objections, point by point

**W1 — self-contradiction in the refinement framing. ACCEPTED.** He is straightforwardly right and the error was mine. The draft claimed recording the change as a refinement "keeps the reasoning in `team-governance.md` intact" in the same breath as deleting lines 183-199. A deletion cannot keep text intact. Reworded in Sub-decision 1: the tiers' **axis** is carried forward into `communication-registers.md`; the **text** is superseded. "Refinement" describes the idea's lineage, not the file's fate.

**W2 — is this still about registers? ACCEPTED.** `ARTIFACT` was a table row with no spec — a canon word shipped to a stranger who would look it up and find nothing. The row is deleted from Sub-decision 1, the edge moves to Deferred, and the table is now explicitly two registers with the added sentence that **the register model is the selection rule, not a promise of a fuller taxonomy**. I also went one step further than asked: the *name* `ARTIFACT` is withdrawn along with the row, since naming a deferred thing is most of the harm.

**W3 — `narrative` reintroduces unbounded fact-smuggling. ACCEPTED, BLOCKING, and the disposition matters.** This is the strongest objection in either round, and the thing worth saying plainly is that **it is a defect the ratified envelope + narrative repair introduced — not one inherited from the brief.** The brief's PACKET carried no prose, so it had no smuggling channel; its ≤20-word `voice` cap existed precisely because Wei had already killed the wider version of this. Making `narrative` required, unbounded, and forwarded verbatim re-opened that channel wider than the one he closed. His failure case is exact: a Critical living only in prose while `finding_count: 1` passes the hook means **the validator certifies a false green**, which is worse than having no validator, because it launders the lie. Sub-decision 2 now carries the precedence rule ("the envelope is the record; a fact that appears only in `narrative` has not been reported"), the `finding_count === claims.length` assertion, `claims[]` named explicitly in the envelope list, and a fifth reversal trigger for narrative-only findings seen in practice. His secondary catch — two sources for one number, with the ADR never saying the validator asserts equality — was also correct and is fixed in the same place. My Sub-decision 5 precedence rule did cover pointers, projections, and the process doc, and it did stop short of the only precedence question that runs at execution time.

**W4 — circularity in the U-gates. ACCEPTED.** U2, U5, and U7 are observable only by installing a hook that blocks, and the ADR authorised no such artifact before Slice 3 — so Slice 3 was formally unstartable, and his prediction about how that actually resolves (someone builds the adapter and calls it a probe) is the realistic one. **Slice 2.5** added: a disposable echo harness, run locally, receipts into the U-table, deleted in the same commit, explicitly not an adapter and not gated on U1-U8.

**W5 — one gate is vibes. ACCEPTED.** "#79 resolved" had no acceptance criterion and would have been adjudicated by whoever wanted Slice 2 to land. Restated as **an ADR addressing #79 has status Accepted** — binary, checkable by a disinterested party.

**W6 — two unpriced costs. BOTH ACCEPTED.** (a) The missing schema version field was a real regression against the brief, which had `v: {const 1}`; dropping it would have shipped a stranger-facing schema with no migration signal. `v` is restored to the required envelope. (b) The BRIEF × forwarded-narratives interaction genuinely was unspecified, and he is right that it is a pointed omission — the interaction between the ADR's only two specified registers, on the most common path in the system, with "summarising is where findings die" making concatenation the default. His proposed rule (outcome plus per-agent severity, narratives forwarded verbatim under agent headings, none dropped) is adopted as written, with one addition of mine: severity is read **from each agent's envelope, not from its prose**, which is the same precedence principle W3 forced and should apply consistently.

**W7 — repo-state claims asserted without receipts. ACCEPTED, AND VALIDATED BY PROBE.** This one earns a stronger disposition than "accepted", because the probe it demanded immediately found a real defect. The claim that the six voice bullets at `team-governance.md:188-193` were a stale duplicate of `personas.md` was **false: 4 of 6 duplicate, 2 do not.** Tara's tone descriptor ("precise and relentless about edge cases") and Pat's ("terse", plus a quoted line unique to governance) exist nowhere else — `personas.md` entries are written capability-first and carry voice inconsistently. Deleting 188-193 as drafted would have destroyed ratified guidance with no replacement, in the slice whose gate read "none". Sub-decision 1 now records the 4-of-6 result with the per-bullet evidence, migration of the two survivors into `personas.md` is a **precondition** of the deletion commit, and Slice 1's gate is rewritten from "none" to three named receipts. The general form of W7 stands as a permanent gate, not a one-off: the first time anyone ran the check, the claim failed, which is the whole argument. A consequence is recorded on the asymmetry itself — cheap-to-verify claims are the ones most likely to ship unverified.

### Round 2 — disagreements

None. All seven accepted; W2 and W6(b) accepted with the modifications noted above, both of which strengthen rather than soften his point. Wei's round-1 objections O3, O4, O5, O6, and O9 were closed by the draft and are recorded in the gate file.

### Round 1 — human decisions, ratified as inputs

**D1 (C2 resolved: envelope + narrative)** and **D2 (write the ADR, Proposed, no implementation until ratified)** were ratified by the human at the gate and are not re-argued here. D1's cost basis — Pat pricing the specialist → human edge at under 10% of invocations — is recorded in Sub-decision 2. W3 above is the defect D1's repair introduced, and it is closed rather than used as an argument to reopen D1.

### Positions withdrawn by their author

My own round-1 gate report offered "ship the CHARACTER bypass logged and documented as advisory" as an acceptable option. Pierrot's V3 holds that the bypass lifts only by removal or transcript-derived register. He is right — a bypass that is logged is still a bypass, and the log is read by nobody at the moment it matters. **That option is withdrawn**, and Sub-decision 3 says so in text rather than quietly dropping it.

## Alternatives Considered

**A. Strict persona-free PACKET (the originating brief's design).** Cleanest machine contract; trivially validated; the natural target for grammar-constrained decoding later. Rejected because it pays the persona context cost on every invocation and discards the output on >90% of them, and because it collides head-on with `team-governance.md:183-193`, which names reports and reviews specifically.

It does, however, hold **one advantage envelope + narrative cannot match**, and W3 surfaced it: a packet with no prose has nowhere to smuggle a fact. Sub-decision 2's precedence rule and count assertion narrow that gap but do not close it — nothing mechanical reads prose for unclaimed findings. The trade is accepted with eyes open, and the fifth reversal trigger exists precisely so that if narrative-only findings appear in practice, this alternative gets re-argued on evidence rather than defended on the original reasoning.

**B. Do nothing — keep the two-tier protocol and the sentinel line.** Zero cost, zero risk, no discarded work. Rejected because the sentinel is a hand-rolled, unenforced convention guarding the single failure mode most likely to ship a real defect, and because the two-tier text is genuinely under-specified about shape rather than merely informal.

**C. Five registers as the brief specified, replacing the two tiers wholesale.** Rejected as over-scoped: three of the five (`NOTES`, `REPORT`, `CHARACTER`) rank 3-5 of 5 on value, one duplicates ratified canon, and framing it as replacement rather than refinement discards the tiers' correct insight to re-derive it under new names.

**C'. Three registers — the two specified plus a named-but-deferred `ARTIFACT`.** This was the draft's position and it is rejected on W2: a canon word that ships to a stranger who looks it up and finds a table row is worse than shipping nothing. The edge is deferred without a name.

**D. Ship the hooks in the payload immediately.** Rejected on trust grounds — a category change in what `summon-team` installs, resting on eight unverified harness claims, with a caller-triggered bypass in the flagship check. Slice 4 keeps the door open behind a gate.

**E. Enforce BRIEF conduct with a blocking `Stop` hook.** Rejected: a regex over natural language is judgment wearing a determinism costume, ADR-0012's ladder puts judgment at Prose tier, the proposed patterns block the system from discussing itself, and the livelock has no good failure mode with a human waiting.

**F. Python adapters as authored.** Rejected under Sub-decision 4.

## Consequences

### Positive

- The false-green failure mode gets a machine-checkable defence. `finding_count`, `unknowns[]`, and evidence-backed `OBSERVED` claims are checkable in a way "the agent said it looked clean" never was.
- Persona voice survives where it pays — the human-facing narrative — and stops being demanded where it costs without returning, which is the >90% of invocations that never reach a human directly.
- `unknowns[]` being **mandatory** converts silence into an assertion. An agent that says nothing about what it could not determine now fails a check instead of reading as confidence.
- One authored source per concern; projections are rebuilt, not maintained.
- The classification-vs-shipping split gives every future enforcement adapter a path that does not require re-litigating the trust question from scratch.

### Negative

- **The envelope costs tokens on every specialist return.** Structured fields plus prose is strictly more output than prose alone, on the highest-frequency edge in the system. Real, and accepted.
- **The registers can be described but not enforced until Slice 3, which may never ship.** Slices 1-2 are prose and structure; if the U-probes fail or the trust ADR stalls, this remains a convention that a forgetful agent can ignore. Honest framing: this is a *drift* control, not a *guarantee*.
- **Eight unverified harness claims gate real work.** Slice 3 is not schedulable until someone sits down and probes the harness. That work is unglamorous and easy to skip, and skipping it is how #93 happened.
- **The U-table's discipline was applied to harness claims and not to repo claims, and that asymmetry was itself a defect.** Repo-state assertions felt safe because they are checkable in seconds — which is exactly why nobody checked them. The first time one was actually run, it failed: 4 of 6, with two live persona descriptors that a "stale duplicate" deletion would have destroyed. The lesson generalises past this ADR. An unverified claim about a file in front of you is not safer than an unverified claim about the harness; it is merely cheaper to verify, and cheap-to-verify claims are the ones most likely to ship unverified.
- **`team-governance.md:183-199` is deleted.** Anyone with that section in working memory will look for it and not find it. The five-line pointer mitigates but does not eliminate this.
- **Three of the brief's five register names do not survive** — `REPORT` deferred without a name, `NOTES` dropped, `CHARACTER` dissolved — so the originating brief and the gate record use vocabulary this ADR does not. Both are in `docs/history/`, so the drift is bounded to historical documents, but a reader moving between them will hit it.
- **The durable-artifact edge is now unnamed as well as unspecified.** Anyone who wants to talk about it has no word, which is a small ongoing friction traded for not shipping an empty one.
- **Hand-rolled schema validation** means Summon owns draft-07 semantics it did not write and cannot delegate upstream. Bounded by the flat-schema constraint, but it is code we maintain.
- **Discarded work.** ~100 lines of authored Python and a ~19-line-per-agent block are thrown away.
- **A coordinator that forwards narratives verbatim will produce longer human-facing output** than one that summarises. That is intentional — summarising is where findings die — but it is a real change in reading load.

### Neutral

- ADR-0012 §F is untouched. This does not reverse it.
- `docs/methodology/agent-notes.md` is untouched. NOTES was dropped precisely so it would stay the single source.
- `docs/glossary.md` is untouched. Register names are Summon process vocabulary, which that document excludes by its own text.

## Reversal triggers

Revisit this ADR if any of the following becomes true.

- **Three or more of U1-U8 fail their probe.** If the harness does not expose what the return contract needs, Slices 2-3 are not buildable and this decision collapses to Slice 1 prose. That is a materially smaller decision than the one ratified here and should be re-recorded as such rather than left standing as an unbuildable spec.
- **The trust ADR for Slice 4 is rejected.** If Summon decides it will never ship executing code into user repos, the enforcement half of this ADR is permanently framework-only, and the shipped canon is prose plus a schema. Worth saying out loud rather than leaving Slice 4 open indefinitely.
- **The envelope measurably degrades return quality.** If specialists start producing thinner narratives because the structured fields absorb the effort, the trade in Sub-decision 2 has inverted and strict prose plus a sentinel may genuinely be better. Watch for narratives that restate the envelope instead of adding to it.
- **Narrative-only findings are observed in practice.** If a finding turns up in a `narrative` that never appeared in `claims[]` — the Sub-decision 2 failure case, live — then the precedence rule is not holding, `finding_count` is certifying an incomplete record, and envelope + narrative has re-created the smuggling channel it was warned about. That is the one outcome that would make the brief's strict persona-free PACKET the better call after all, and it should be re-argued on that evidence rather than defended.
- **`unknowns[]` becomes ritual.** If agents routinely emit `unknowns: []` on work that plainly had unknowns, the field has become a checkbox and is worse than nothing — it converts an absence of thought into a positive assertion of completeness. That is the false-green failure mode wearing this ADR's own uniform.
- **Checkpoint: 2027-02-07**, six months from Proposed. If Slice 1 has not landed by then, the priority ranking (LATER) was correct and the rest should be closed rather than carried.

=== END ADR-0015 DRAFT — sub-decisions: 6, unverified claims: 8 (harness, open) + 3 repo claims discharged (1 falsified) ===
