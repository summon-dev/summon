---
agent-notes: { ctx: "ADR: edge-conditioned communication registers; envelope+narrative return contract", deps: [CLAUDE.md, docs/adrs/template.md, docs/process/team-governance.md, docs/process/doc-ownership.md, docs/methodology/agent-notes.md, docs/methodology/personas.md], state: accepted, last: "claude@2026-08-13", key: ["TWO registers only — BRIEF and PACKET; the model is a selection rule, not a taxonomy", "correspondence is BIDIRECTIONAL: no fact only in narrative (smuggling), no claim only in claims[] (starvation)", "claims[] is the raw claim, narrative is the SAME claim voiced, carrying literal anchors; clarity beats character on conflict", "voice INTENSITY is edge-conditioned — damped internal vs full-voice narrative; internal = machine-CONSUMED, not machine-carried", "8 UNVERIFIED harness claims gate slices 2-3; Slice 2.5 probe harness breaks the circularity", "hooks are canon by subject and WITHHELD from the payload — classification is not a shipping decision", "adapters are Node ESM; ADR-0012's announce-clause is a floor for unavoidable degradation, not a licence", "team-governance:188-193 is 4-of-6 duplicate — Tara + Pat descriptors migrate to personas.md BEFORE deletion", "all 15 personas get a voice, no neutral opt-out (issue #97); 6 covered today", "narrative runs 4-6 sentences, 8-12 for a 12-claim return; a 5-agent wave is a wall and that cost is accepted"] }
---

# ADR-0015: Edge-conditioned communication registers

## Status

**Accepted** — 2026-08-07, ratified by the human. Work item: issue #94.

**Amended three times, on 2026-08-08, 2026-08-09, and 2026-08-13, in place; the Decision is unchanged in all three.** The third (2026-08-13, issue #127) is recorded at Sub-decision 5: the binding line carries every constraint its reader cannot look up, values included, which generalises the mechanism the second amendment established. The second amendment (2026-08-09, issue #117) is recorded at Sub-decision 5 and at Slice 1's gate line: the per-agent binding is one line but not a pointer, per #112; and Slice 1 gate (3) is marked discharged with its receipt rather than left reading open. The first follows.

**Amended once on 2026-08-08, in Sub-decision 2, in place; the Decision is unchanged.** A *vocabulary amendment* — the `epistemic` tag was spelled `"OBSERVED"` in one sentence and its value set was never enumerated. Issue #99 requires the tag be reconciled with the Done Gate's proof ladder rather than shipping two vocabularies for one concept, and inventing `INFERRED`/`HUMAN` alongside `OBSERVED` would have produced exactly that second vocabulary. The set is now enumerated as `deterministic` / `inferential` / `human-judgement`, matching the ladder `docs/process/communication-registers.md` shipped in Slice 1. Struck text is left visible rather than deleted. Status is untouched and remains **Accepted**. Work item: issue #113. Settled before Slice 2 because Slice 2 ships the schema and validator that consume these strings as enum values, after which the change stops being a rename.

Architecture Gate completed 2026-08-07. Point-by-point dispositions: `docs/history/tracking/2026-08-07-comms-register-gate.md`. Originating brief: `docs/history/design/2026-08-07-comms-refit.md`.

**This decision and its implementation reach `main` together, not separately.** The rollout changes how every agent on the team sounds, and that is a property no review can settle — only a real session can. So the slices are built on an integration branch and validated by installing the result into a fresh project before anything merges. Ratification unblocks the build; it does not publish it. An Accepted ADR standing alone on `main` with none of its artifacts present would read to a later session as unfinished work and invite a second, parallel implementation.

Restore point for the whole rollout: tag `v0.1.0-pre-registers`. Note what a revert does and does not reach — the repository, yes; a project already scaffolded from it, no, because that project holds a copy. That asymmetry is why validation precedes the merge rather than following it.

## Classification: canon

Per ADR-0007 §1 — ask the test question: when a stranger scaffolds a payments app with `summon-team`, does this file help *them*? Yes. It governs how their coordinator addresses them, what their specialists must return before a finding counts as reported, and which of their agents' claims need evidence attached. That is methodology the user's project runs, not Summon's plumbing. It sits in the canon zone `docs/adrs/` alongside 0001 (conventional commits), 0002 (TDD), 0013 (design authority).

**Classification is not a shipping decision, and this ADR is the case that proves it.** The enforcement adapters in Sub-decision 3 are classified **canon by subject** — a hook that validates the user's agents serves the user — and are simultaneously **withheld from the shipped payload** by Sub-decision 6 pending a trust review. Both hold at once. ADR-0007 asks *what audience does this file serve*; the withholding asks *is it safe to put executing code in a stranger's repo yet*. Those are different questions with different answers, and conflating them would either misclassify the hooks as meta (wrong — their subject is the user) or ship them prematurely (wrong — see Sub-decision 6). Every future enforcement adapter takes the same two steps.

## Context

Summon's agents talk to two audiences that want opposite things, and one rule governs both.

A human reading a security finding wants Pierrot's voice — the dark humour is what makes the finding land and be remembered. A coordinator receiving that same finding wants a field it can branch on: is this Critical, is there evidence, did the agent finish. When the only rule is "voice must come through", the coordinator is left parsing prose for structure, and the failure mode is the one CLAUDE.md names in § Critical Rules: **a truncated report that reads "looks clean" is a false green that can ship a real bug or a missing auth check.** The existing defence is a hand-rolled sentinel line and a coordinator remembering to look for it.

The fix is to condition communication style on the **sender → receiver edge** rather than on agent identity.

That insight, and a full implementation design around it, came from an **originating proposal** (`docs/history/design/2026-08-07-comms-refit.md`). This ADR adopts the insight and rules against several of the proposal's specific choices. Where a rejected option appears below without another source named, the originating proposal is where it was proposed — the options were real, not hypotheticals raised to be knocked down.

Ratified canon this decision touches:

- `docs/process/team-governance.md:183-193` — "Agent Voice and Personality": *"Their voice must come through in their outputs — reports, reviews, challenges, and recommendations."*
- `docs/process/team-governance.md:195-199` — "Tiered Communication Protocol": two tiers, agent-to-agent ("no personality needed") and agent-to-human ("personality comes through").
- `docs/methodology/agent-notes.md` — the agent-notes protocol, which already specifies the notes-to-future-agents register.

Three **meta** ADRs also bear on this decision and are cited by number and title only: **ADR-0006** (multi-runtime install — `.claude/*` Markdown is the single source, other runtimes are derived projections), **ADR-0007** (canon/meta boundary, including the individual-file rule that subject beats directory), and **ADR-0012** (executable canon — the enforcement ladder Hook > Script > Workflow > Prose, the tie-breaker preferring scripts where determinism is equal, enforcement adapters as an asset class, announced degradation, and the tamper-boundary honesty clause).

**Dependency hygiene.** `scripts/check-canon.mjs` fails CI on a canon→meta edge, so this file's `deps` list names only canon files, and the meta ADRs above are cited in prose by title rather than carried as declared dependencies — the pattern ADR-0013 § Dependency hygiene establishes. This ADR must stay readable and applicable in a scaffolded project where `docs/adrs/meta/` does not exist. Every mechanism borrowed from a meta ADR is therefore written so that the meta ADR's absence degrades to plain prose discipline rather than to a dangling reference: the enforcement ladder is restated as a table here, the tamper boundary is restated in full here, and the projection rule is stated as a rule rather than as a pointer. The gate record and originating brief cited under Status are Summon-internal provenance — a scaffolded project will not have them, and nothing here depends on reading them.

## Decision

Six sub-decisions.

### Sub-decision 1 — Edge-conditioned registers, refining the two-tier protocol

The unit of selection is the **edge** (who is sending to whom), not the agent. **This ADR specifies two registers:**

| Register | Edge | Shape |
|---|---|---|
| **BRIEF** | coordinator → human | Outcome first. No offer-menus. Findings surfaced, never summarised away. |
| **PACKET** | specialist → coordinator | One JSON object: mechanical envelope **plus** a persona `narrative` field (Sub-decision 2). |

**The register *model* is the selection rule, not a promise of a fuller taxonomy.** Two registers is the whole of it. If a third edge later earns a specified register, it gets its own decision record; nothing here reserves a slot for one, and no canon word ships to a stranger without a spec behind it.

This refines the two-tier protocol rather than repealing its reasoning. The tiers are right about the **axis** — PACKET is the inner loop made explicit, BRIEF is the outer loop made explicit — and under-specified about the **shape**. That axis carries forward into `docs/process/communication-registers.md`. The *text* at `team-governance.md:183-199` is superseded and deleted; the idea survives its file.

**Vocabulary.** "Report" and "notes" already mean other things in a Summon repo — agent returns generally, and the agent-notes protocol — so neither is used as a register name. The durable-artifact edge (writing to `docs/**`) is real but unspecified here, and it ships **no name at all** until it has a spec: a canon word a stranger looks up and finds nothing behind is worse than no word. The notes-to-future-agents register is not specified here either, because `docs/methodology/agent-notes.md` already specifies it and a second source for a solved problem is a liability. There is no separate voice register; Sub-decision 2 folds persona voice into PACKET, so one would have nothing left to carry.

**Supersession, precisely.** `team-governance.md:183-199` — both `## Agent Voice and Personality` (183) and `## Tiered Communication Protocol` (195), stopping short of `## Parallel Agent Teams` (201) — is deleted and replaced by a five-line pointer to `docs/process/communication-registers.md`.

**Four of the six per-persona voice bullets at 188-193 duplicate `docs/methodology/personas.md`. Two do not.** Verified by line-level comparison, 2026-08-07:

| Bullet | Verdict | Evidence |
|---|---|---|
| Pierrot — "dark humor" | duplicate | `personas.md:123` "Prone to dark humor." |
| Archie — "confident, visual-thinking, prefers diagrams" | duplicate | `personas.md:97`, near-verbatim |
| Wei — "just read something exciting on Hacker News" | duplicate | `personas.md:180`, same trait, different phrasing |
| Vik — "grizzled veteran who's seen every mistake" | duplicate | `personas.md:134` "in the industry forever… pushes back on 'clever' code" |
| **Tara** — "precise and relentless about edge cases" | **NOT a duplicate** | `personas.md:56` "uncanny knack for unhappy paths" covers the *behaviour*; the entry carries **no tone descriptor** |
| **Pat** — "terse and business-focused. 'Does this ship value to users?'" | **NOT a duplicate** | `personas.md:66` covers business focus; **"terse" is absent**, and the quoted line is unique to governance |

**Precondition on the deletion:** Tara's and Pat's tone descriptors are **migrated into `docs/methodology/personas.md` before** the 188-193 deletion commit, in the same PR. Not a follow-up. Deleting them unmigrated destroys ratified guidance that exists nowhere else.

**`personas.md` is the intended single source for voice, and is not yet a sufficient one.** Its entries are written capability-first — agent file, capability, hybrid phases, behaviour — so voice appears for some personas incidentally and is absent for others. Of 15 personas, **9 have no voice documented anywhere**: `personas.md` covers 6 (Pierrot, Vik, Wei, Archie, plus Tara and Pat weakly, behaviour only), `team-governance.md:188-193` covers the same 6, and the agent files cover 3-4. Coverage tracks persona vividness rather than persona need — the loud characters got documented, the executors did not.

That gap is load-bearing, because Sub-decision 2 makes `narrative` a **required** field on every specialist return, and that contract assumes `personas.md` can tell each of the fifteen agents how to sound. **Every persona gets a documented voice; there is no neutral-by-design opt-out**, including for executors like Sato, Grace, Ines, Diego, Debra, Cloud, Cam, Dani, and Prof. The pass is issue **#97** and is scoped separately from every slice below — Slice 1 migrates exactly the two descriptors its own deletion would otherwise destroy and stops, because widening a docs slice silently is how it becomes a sprint.

Two adjacent repo-state facts, verified 2026-08-07: the inbound-link grep for `team-governance.md`'s voice sections is clean, so the deletion is link-safe; and `docs/process/doc-ownership.md:14` has the four columns `Doc | Owner | Path | Update trigger` with no `team-governance.md` row.

**Placement.** The durable spec is `docs/process/communication-registers.md`, canon. Not `docs/methodology/`: methodology holds formats, process holds conduct, and the superseded text already lives in process. Ownership is Diego's, with an added row in `doc-ownership.md` — that table has no `team-governance.md` row today, so this adds coverage rather than amending it. `CLAUDE.md` references "voice rules" in two places, lines 43 and 137; both are repointed. Register names do **not** enter `docs/glossary.md`, which excludes Summon process vocabulary by its own text.

### Sub-decision 2 — The return contract is envelope + narrative

A specialist return is one JSON object carrying both:

- **Envelope (mechanical, required):** `v` (schema version, `const 1`), `agent`, `state`, `finding_count`, `claims[]`, `unknowns[]` (mandatory, may be empty — an empty array is an assertion, an absent key is a defect), and per-claim `epistemic` / `severity` / `evidence` / `action`. `epistemic` takes exactly one of ~~`"OBSERVED"`~~ **`"deterministic"` / `"inferential"` / `"human-judgement"`** — the Done Gate's proof ladder applied to a claim rather than to a gate item, so the repo carries one vocabulary for the concept instead of two (issue #99). `epistemic: "deterministic"` requires a non-empty `evidence` reference.
- **Narrative (prose, required):** the persona's own voice, written as the agent would write it.

The coordinator **gates on the envelope and forwards the narrative**. It does not paraphrase the narrative into house style; forwarding is the whole point.

**`v` is required.** A schema that ships to strangers without a version key has no migration signal at its first breaking change and no way for a consumer to tell which contract it holds. `const 1` costs four bytes and is the only affordance that makes v2 survivable.

Envelope + narrative also settles the conflict with `team-governance.md:183-193` without a loss. That rule names *reports* and *reviews* specifically; keeping the narrative keeps them voiced. The anti-false-green defence is bought entirely by the **envelope** — `finding_count`, `unknowns[]`, and per-claim `evidence` are machine-checkable, and none of them care whether the prose beside them is deadpan or dry. This does not reverse ADR-0012 §F.

There is no separate `voice` field. The originating proposal carried one, capped at 20 words, to let a trace of persona survive an otherwise persona-free packet; the `narrative` field supersedes that purpose entirely. A capped `voice` field would also be forbidden on the only edge `SubagentStop` can observe, and its one legal use would depend on the `PreToolUse` validation this ADR defers — unusable everywhere it is reachable, which is dead weight in a v1 schema.

#### Correspondence: `claims[]` is the raw claim, `narrative` is the same claim voiced

The two fields are **one content at two intensities**, not a record and a commentary on it. One is machine-shaped, one is human-shaped. So the rule runs in **both directions**, and neither half may be read alone:

- **No fact in `narrative` that is absent from `claims[]`.** *Anti-smuggling.* A fact that appears only in prose has not been reported.
- **No claim in `claims[]` that is absent from `narrative`.** *Anti-starvation.* Every claim appears in the narrative **carrying its literal anchor — exact path or component, severity, and recommended action — matching the claim's values exactly.**

Where the two disagree the envelope governs, and where voice and precision pull against each other: **clarity beats character on conflict.**

**The narrative must *carry* each finding, not merely flavour it.** A narrative that adds voice without restating the finding's path, severity, and action fails this rule. *"This one's ugly. Fix it before it ships."* is a failing narrative — it contains no path, no severity, and no action, and on a single-agent return it is the entire message the human receives.

Both directions guard real failures.

**Smuggling.** A narrative reads *"the auth bypass in `session.ts:88` is the real problem here"* while `claims[]` holds one medium logging finding and `finding_count` is 1. The envelope is internally consistent, the validator passes it, the coordinator forwards the narrative, and nothing reconciles the two. A Critical exists only in prose, which means **`finding_count` is a lie the validator certifies** — strictly worse than no validator, because it launders the false green through a check.

**Starvation.** The mirror: findings live in `claims[]` and reach the human as atmosphere. The correspondence rule and the index below are what prevent it.

**The validator asserts `finding_count === claims.length` and blocks on mismatch.** Two sources for one number is a defect in a v1 schema; the assertion makes them one. It does not detect smuggling by itself, but combined with the correspondence rule it makes a smuggled finding *unreportable* rather than merely unrecorded: an agent that wants a finding to count must put it in `claims[]`, where it is counted.

**The envelope-derived index is rendered on *every* return, not only on multi-agent waves.** A single return gets the same one-line-per-finding index specified below. Without it the narrative is the sole carrier and the human has no mechanical backstop at all.

#### Scale: full restatement always

A twelve-claim return restates all twelve.

**Rejected — restate only above a severity threshold, index carries the rest.** This is starvation with a permission slip: it re-creates the failure above for every claim under the line, and it asks the human to cross-reference two artifacts to reconstruct one finding, which is the work the correspondence rule exists to abolish.

**Rejected — cap `claims[]` per return.** Capping the record is dropping findings. It contradicts the anti-omission property that is the entire purpose of this ADR; finding thirteen would simply not be reported.

**Chosen — full restatement, always,** with two things that make it survivable:

1. **Anchors may be grouped.** Claims sharing a pattern may be restated together so long as every path, severity, and action appears: *"Three instances of the same missing guard — `session.ts:88`, `auth.ts:14`, `mw.ts:203`, all Critical, all fixed the same way."* Three claims, one sentence, every anchor present. Restatement therefore scales **sub-linearly** when claims cluster, which is the common shape of a real review.
2. **The verbosity is a signal, not a defect to engineer around.** A return whose narrative is unreadably long is reporting that twelve findings were bundled into one invocation. The right response is to scope returns smaller, and an escape hatch would suppress the only feedback that produces that.

#### Anchor check

**For any return: each claim's path, severity, and action appear in the narrative with matching values.**

**This is not mechanically enforceable and must not be described as though it were.** Nothing can read prose for a *missing* restatement any more than for a *smuggled* fact — both directions of the correspondence rule are prose discipline with a review check and a reversal trigger behind them. The validator's reach stops at `finding_count === claims.length`. Claiming otherwise would be the overclaim the tamper boundary in Sub-decision 6 exists to forbid.

#### Voice intensity is edge-conditioned too

Registers set the **surface form** of a message. A second axis sets its **intensity**:

- **Damped (internal).** Near-uniform register: parsimony and pragmatism. Identity survives in word choice and in what the agent puts first, not in performance. No set-pieces, no extended metaphors, no jokes. Voices deliberately converge here.
- **Full voice.** The persona as written, unhedged.

**`narrative` is full voice.** The tempting misreading is that `narrative` is authored on the specialist → coordinator edge, which is internal, so it should be damped. It should not. `narrative` is the persona's message *to the human*, merely transported through the coordinator.

**The definition the whole distinction rests on: *internal* means machine-to-machine coordination — not "carried on an internal edge."** The test is **who consumes the text, not who carries it.** A field is internal if a program or an agent acts on it as data. A field is human-facing if a person reads it, however many relays it crosses. Transport is not consumption.

So the damped register governs peer traffic and the envelope's machine-consumed prose fields — `summary`, `action`, and the entries in `unknowns[]`. It does not govern `narrative`.

This is not a second axis bolted onto the model; it is the edge rule applied to the true receiver rather than the visible one. Register follows sender → receiver, and `narrative`'s receiver is the human even though its wire is internal.

It draws the same line through the packet that the correspondence rule draws: **the damped fields are the record; the full-voice field is that record voiced.** Fields the machine parses are terse and authoritative; the field the machine only forwards is vivid and, on conflict, deferential. One content at two intensities — which is why the damped/full-voice boundary and the raw-claim/voiced-claim boundary land in the same place. Implementation consequence: `schemas/packet.schema.json` documents which prose fields are damped, because a schema that treats all prose alike will not carry this.

**Scope, honestly: the damped internal register has almost no live consumer.** Peer agent↔agent messages depend on the `SendMessage` / `PreToolUse` work this ADR defers, so that traffic does not yet flow. The envelope's prose fields are the whole of its current reach. The rule is written now so it is settled when peer traffic arrives; describing it as governing traffic that does not exist would be exactly the overclaim Sub-decision 6 forbids.

#### BRIEF × multiple narratives

The two registers meet on the most common path in the system — a parallel review wave — and the meeting has to be specified, or the human receives either a wall or a lossy digest chosen ad hoc per wave.

The volume is real. Full-voice narratives run roughly 4-6 sentences, more when a return carries many claims, and a five-agent wave is the common case rather than the edge case.

**Rule for a multi-narrative wave.**

1. **Outcome first**, one line: what happened and what it means for the human.
2. **The index, one line per *finding* — not per agent**: agent, severity, path, action. Every value read **from the envelope, never from the prose**.
3. **Ordered by severity, highest first** — not by roster order and not by completion order. This is the largest readability lever available and it costs nothing: a human reading top-down meets the Critical first and can stop at any point without having missed the worst thing. Roster order distributes severity randomly through the wall, which is the property that makes a wall a wall.
4. **The index is independently actionable.** The human can decide and act having read only steps 1-3, without opening a single narrative. This holds by construction rather than by discipline: the correspondence rule puts every finding in `claims[]`, so an index built from envelopes is complete.
5. **Narratives below a single separator**, each under its own agent heading, in the same severity order, **verbatim**. Agents that returned no findings go last.
6. **No narrative is dropped and none is summarised.**

**Per-finding granularity is what makes steps 3 and 4 true.** A per-agent index can only sort by each agent's *maximum*, which buries a second Critical underneath someone else's Medium; and `Pierrot: high, 3 findings` is a notification that something exists, not something a human can act on. The finer index is free by construction, since `claims[]` already carries path, severity, and action on every entry.

The BRIEF is the index; the narratives are the body. Steps 3-5 let a five-narrative return be *scanned* rather than *read* — the volume is unchanged, but the reader controls how much they consume and never pays for that control in missed findings. This rule cannot make the output short and does not try. The control variable is **nothing omitted**; the mitigation for length is **ordering and structure**, not deletion.

### Sub-decision 3 — Enforcement tier per artifact

Applying ADR-0012 §B and its tie-breaker: *prefer the script where determinism is equal; hooks are reserved for checks that must block at the moment of action.*

| Rule | Tier | Reasoning |
|---|---|---|
| PACKET envelope conformance on specialist return | **Hook** (`SubagentStop`) | The artifact is transient. It does not exist in repo state, so no script has any input at all. The only genuine moment-of-action case here. |
| Register binding present in every agent file; AGENTS.md and the skill in sync with their source; every enforcement adapter names a canon source rule | **Script** (`scripts/check-canon.mjs`) | All decidable from repo state. |
| BRIEF conduct — offer-menu ban | **Prose** (`docs/process/communication-registers.md`) | Judgment over natural language. See Alternative E. |
| Act vocabulary, claim tagging honesty, coordinator-only acts | **Prose** | Judgment. A regex cannot decide whether a claim is really ~~OBSERVED~~ `deterministic`. |

**BRIEF conduct has no length ceiling.** The originating proposal set one at 1-3 sentences. Length is the wrong control variable, and a hard sentence ceiling truncates Critical findings — reintroducing the exact false-green hazard this ADR exists to close. The control variable is *outcome-first and nothing omitted*.

**No self-declared marker may exempt a return from validation.** The originating proposal's validator exempted any return beginning with a literal marker string, so that a specialist writing directly to the human could opt out of the packet contract. Register selection instead rides **inside** the packet as a validated field, or is derived from the transcript. An exemption triggered by a string the validated party emits is a bypass available to any confused, budget-starved, or prompt-injected agent, and it makes the hook advisory against intent rather than enforcing. Logging such a bypass does not fix it: the log is read by nobody at the moment it matters.

**Two requirements on the validator, both guarding fail-closed-into-silence.**

1. **Absent output is not malformed output.** The `SubagentStop` payload key carrying the return may not exist on a given harness version, and an agent that exhausts `maxTurns` returns nothing regardless. Parsing an empty string as JSON raises, which blocks **every** return unconditionally and fails as silence — indistinguishable from success. The validator distinguishes *absent* (report upward as a failure) from *malformed* (block and request correction).
2. **The re-entry guard is checked.** Without inspecting `stop_hook_active`, a rewrite that trips a different pattern re-blocks: livelock, with the human waiting.

Both carry regression tests before the adapter lands.

### Sub-decision 4 — Enforcement adapters are Node ESM

All Summon enforcement adapters — this one and every future one — are `.mjs`, Node standard library, zero dependencies. The originating proposal specified stdlib Python for the adapters, deliberately, to avoid a pip dependency; this ADR rules otherwise.

Summon has zero Python. All four existing checks (`scripts/check-canon.mjs`, `check-canon.test.mjs`, `check-css-contrast-motion.mjs`, `harvest-debt.mjs`) are Node ESM; the repo is pnpm + Node. A Python adapter would fork the toolchain for two files and ship a `python3` requirement to Node projects that never asked for it — plus `jq`, if the acceptance checks are shell pipelines.

**ADR-0012's "degrade explicitly, never silently" clause does not authorise a Python adapter.** That clause is a **floor for unavoidable degradation** — it governs capabilities genuinely absent on a runtime or plan tier. It is not a licence for self-inflicted degradation; read that way it would bless any dependency as long as a warning printed. Its precondition is that no cheaper alternative exists, and here the cheaper alternative is the house language. It also fails mechanically: it requires announcement **at invocation**, and a hook that cannot start because `python3` is missing has no channel to announce anything, because the announcing machinery is inside the process that failed to launch.

Cost: draft-07 validation is hand-rolled rather than delegated to a library. Viable precisely because the schema is deliberately flat with no `$ref`, and consistent with the zero-dependency posture ADR-0013 §6 slice A establishes.

**The flat, `$ref`-free schema shape is inherited from the originating proposal and is load-bearing — do not "improve" it by factoring out shared subschemas.** Its original rationale is grammar-constrained decoding: a flat JSON Schema converts cleanly to a GBNF-style grammar for a future harness port, and `$ref` indirection does not. Choosing Node adds a second, immediate reason — flatness is what makes a hand-rolled stdlib validator ~40 lines instead of a dependency. Both reasons must fail before the constraint is worth relaxing.

### Sub-decision 5 — `AGENTS.md` and the comms skill are projections

Three authored sources, everything else a pointer:

1. `docs/process/communication-registers.md` — the prose spec.
2. `schemas/packet.schema.json` — the structure.
3. A one-line register binding in each `.claude/agents/*.md`.

`AGENTS.md` at repo root and `.claude/skills/comms/SKILL.md` are **generated projections** of (1), with a `check-canon.mjs` staleness rule. The originating proposal authored `AGENTS.md` as a root original instead; that satisfies nothing in ADR-0006, because a root cross-runtime file authored as an original inverts the projection model on its first real test and sets a precedent that erodes it for every subsequent cross-runtime artifact.

The originating proposal also appended a ~19-line register block to each of the sixteen agent files. Item (3) is **one line** per agent for that reason: ~300 lines of copy-paste with no single source is a drift generator, where the next persona edit forgets one file and the contract silently forks.

**Amended 2026-08-13 — the line carries values, not just keys.** Issue #127. Amendment 2 below established that the line carries the field shape inline rather than pointing at it, and did not say how far *shape* reaches. The line it produced enumerated values for `v`, `state`, `epistemic`, and `severity`, and left `agent` a bare key whose rule lived in the schema — the same pointer failure one field to the left, since the schema is a document the specialist never reads. The constraint therefore generalises: **the line carries every constraint its reader cannot look up, values included.** A key name the reader must resolve elsewhere is a pointer wearing a different costume.

Value completeness is genuinely wider than the reachability licence Amendment 2 granted, and the proof is an object rather than an argument: a line naming `agent` as a bare key satisfies reachability **completely** — it carries the field shape inline and defers to the process doc only on disagreement — and still fails #112's own test, because the value's rule lives in a schema the specialist never reads. The counterexample is the line that shipped.

**What is delegated, and what is not.** The canonical text remains delegated to `communication-registers.md` § The line every agent file carries. Delegation of text is not delegation of scope: the delegated document may refine the line **within** the constraints below, and changing a constraint requires an amendment here.

The constraints, as of this amendment:

1. **Volume** — one line per agent file, not a block (Sub-decision 5's originating grievance).
2. **Reachability** — the line carries its content inline and defers to the process doc only on disagreement, because a subagent is handed its own agent file and nothing else (Amendment 2, issue #112).
3. **Value completeness** — every constraint the reader cannot look up is carried, values included (this amendment, issue #127).

**Silence in this list is not a licence.** A rule the list did not anticipate is not thereby permitted; it is tested by the construction below, and where the construction fires the list gains a fourth entry in that same amendment. A floor that grows, never a ceiling that expires — a list read as exhaustive would rot into a false negative wearing a lookup's authority, which is worse than the judgement it replaced.

**When an edit to the delegated text is an ADR event, tested in both directions.** Name the sentence here constituting the licence, then ask:

- Does the delegated document now **assert** something no sentence above licenses? That is an **amendment** — extend the list.
- Does it now **fail** a sentence above? That is **not an amendment but a conformance failure** — fix the delegated document.

The second direction is not symmetry for its own sake. Sub-decision 5's founding incident is contraction: *a later reader given only the paragraph above would "simplify" the line back to a reference,* and before `check-canon.mjs` existed, doing so passed CI. A forward-only test would be silent on the exact failure this sub-decision was written to catch.

This test is **citable, not mechanised.** Both sides have addresses, so a third party can check a verdict and overturn it — but nothing runs it. `check-canon.mjs` asserts every agent file matches the canonical text; it does not assert that the canonical text satisfies this ADR, and that relation has no check in either direction. Whether it is mechanisable at all is open.

**Amended 2026-08-09 — one line, but not a pointer.** Issue #112, found after ratification, established that a pointer is not delivery: a subagent is handed its own agent file and nothing else, so the `@AGENTS.md` import above reaches the coordinator and buys the specialist nothing. The one line therefore carries the field shape inline and defers to this document only on disagreement. That satisfies the volume half of the grievance above; the *single source* half is satisfied separately, by `communication-registers.md` § The line every agent file carries holding the canonical text and `scripts/check-canon.mjs` asserting every agent file matches it verbatim. Recorded here because a later reader given only the paragraph above would "simplify" the line back to a reference — and before that check existed, doing so passed CI.

**Precedence, stated explicitly because pointers rot:** where a pointer, a projection, and the process doc disagree, **the process doc wins.** Projections are rebuilt; pointers are corrected.

**`CLAUDE.md` wiring.** The `@AGENTS.md` import goes **immediately after** the First-Run Detection block — not at line 1, where the originating proposal placed it. First-Run Detection is a guard clause whose job is to short-circuit before anything else applies; an uninitialised project should not be loading the register contract at all.

**This change is strictly additive to `CLAUDE.md`.** The originating proposal instructed the implementer to *"remove any content the contract now duplicates"*; that instruction is not carried out. `CLAUDE.md` is 168 lines of ratified operating canon — the Session Entry Protocol, the Done Gate pointer, "Treat Agent Output as Untrusted", the board transitions — with no allowlist, no diff-review step, and no acceptance check guarding it. An open-ended deletion licence over that file is not something this ADR grants. Any removal is a separate, individually enumerated change with human line-by-line review.

### Sub-decision 6 — Trust surface, tamper boundary, and what is withheld

**Enforcement adapters are classified canon and withheld from the shipped payload.** They live framework-only until a separate Architecture Gate ADR covers three things: (a) the general question of Summon shipping executing code into user repos, (b) the Node ESM implementation landing with tests, and (c) explicit opt-in consent at install time. Summon ships zero executable-on-agent-lifecycle assets today; `.claude/settings.json` is the file that would change that, and it is a category change in what `summon-team` means, not plumbing.

**The tamper boundary, in ADR-0012's language and unsoftened.** This layer hardens against **drift and forgetting**. It does **not** harden against an adversarial or prompt-injected coordinator. A hook validates *shape*; it never validates *provenance*. Consequently:

- The `veto: true`-is-Pierrot-only rule and the coordinator-only acts **must not be described as unforgeable** in this ADR, in `docs/process/communication-registers.md`, in `AGENTS.md`, or in any projection. They are conventions with a shape check, and that is all they are.
- The `veto` authority check depends on `agent_type` being harness-supplied and trustworthy. **This is UNVERIFIED (U8).** Even if a probe confirms the harness supplies it, the honest wording is that it names *which agent the coordinator spawned* — not an authenticated principal. If the probe fails, the check is deleted rather than reworded.
- `.claude/skills/` introduces Summon's first content-injection channel, which is the surface open issue **#79** (ADR-0014 §11) flags as unaddressed. #79 is a blocker for the skill projection, not a follow-up.

### UNVERIFIED harness claims — the count is the finding

Eight load-bearing claims about Claude Code harness behaviour are unprobed. Listing them individually understates the problem; the pattern is issue #93 recurring, now inside security-adjacent code.

| # | Claim | Status |
|---|---|---|
| U1 | `SubagentStop` event shape, including the key carrying the agent's return | UNVERIFIED |
| U2 | Nonzero-exit vs. `{"decision":"block"}` semantics | UNVERIFIED |
| U3 | `transcript_path` availability and readability from a hook | UNVERIFIED |
| U4 | `${CLAUDE_PROJECT_DIR}` expansion inside `args` | UNVERIFIED |
| U5 | Whether the blocked recipient sees the hook's `reason` | UNVERIFIED |
| U6 | `skills:` frontmatter key is honoured (no `skills:` key exists in the repo today) | UNVERIFIED |
| U7 | `stop_hook_active` presence and semantics | UNVERIFIED |
| U8 | `agent_type` is harness-supplied and reflects the spawned agent | UNVERIFIED |

**Every one gates the slice that depends on it.** A recorded probe — command, raw output, date — is the only thing that clears a row. Prose confidence does not.

## Sequencing

Four slices plus a probe. Each gate is decidable; none is a judgment call.

**Slice 1 — prose canon. No trust surface. Ships first.**
`docs/process/communication-registers.md`; deletion of `team-governance.md:183-199` plus the five-line pointer; additive coordinator rules in `CLAUDE.md` with lines 43 and 137 repointed; the `doc-ownership.md` row.
**Gate — receipts before the deletion commit, not after.** This is the only slice containing an irreversible deletion, and the deletion is licensed by repo-state equivalences that must be proven rather than assumed. All in the same PR: (1) the inbound-link grep receipt — **discharged 2026-08-07, clean**; (2) the line-level `188-193 ⊆ personas.md` comparison — **discharged 2026-08-07, result 4 of 6**; (3) consequent to (2), Tara's and Pat's tone descriptors migrated into `docs/methodology/personas.md` before the bullets are removed. ~~**Gate (3) is open.**~~ **Discharged 2026-08-08, commit `952de7b`** — Tara at `personas.md:62`, Pat at `personas.md:74`.
Value rationale: BRIEF conduct is the highest-value piece of the model, and claim tagging plus `unknowns[]` costs nothing to implement.

**Slice 2 — the contract surfaces.**
`schemas/packet.schema.json`; the one-line register binding per agent file; `AGENTS.md` and `.claude/skills/comms/SKILL.md` as generated projections plus the staleness rule.
Gates: **U6** proven for the frontmatter key — if it fails, the binding ships as a plain line with no frontmatter change. For the skill projection specifically: **an ADR addressing issue #79 has status Accepted.** That criterion is binary and checkable by someone with no stake in the outcome, which "#79 is resolved" is not.

**Slice 2.5 — disposable probe harness. Not an adapter.**
U2, U5, and U7 are behavioural claims observable **only by installing a hook that blocks**. Gating Slice 3 on them while authorising no artifact before Slice 3 makes Slice 3 formally unstartable, and the realistic resolution of that deadlock is someone building the production adapter and calling it a probe — which is the discipline this ADR exists to install.
So: a throwaway hook whose only job is to echo its event payload and exercise the block path, run locally, **receipts recorded in the U-table, deleted in the same commit that records them.** It is not an enforcement adapter, is never shipped, is not gated on U1-U8, and names no canon source rule because it enforces nothing.

**Slice 3 — the validator, framework-only.**
`.claude/hooks/validate-packet.mjs` + `.claude/settings.json`, used by Summon on Summon and **not shipped**.
Gates: **U1, U2, U5, U7, U8** probed and recorded via Slice 2.5; no self-declared validation exemption; both fail-closed requirements in Sub-decision 3 implemented with regression tests; the `finding_count === claims.length` assertion implemented; the adapter names its canon source rule (`CLAUDE.md` § "Treat Agent Output as Untrusted" plus Sub-decision 2) or `check-canon.mjs` fails it.

**Slice 4 — shipping the adapters to user repos.**
Gate: a separate Architecture Gate ADR on executing code in user repos, plus opt-in consent. Not authorised by this ADR.

**Deferred, not scheduled:** a register for the durable-artifact edge — the edge is real, this ADR has no spec for it, and it ships no name until it has one; `PreToolUse` validation on peer messages; claim-store-compiled artifacts; a MAF/LangChain harness port; any promotion of BRIEF conduct from prose to a blocking check.

**Separate work item — issue #97:** the voice-coverage pass across all 15 personas in `docs/methodology/personas.md`, so the mandatory `narrative` field has a consistent source to draw on for every agent rather than for six. Nine personas need a voice written from scratch. #97 gates no slice here — Slices 1-3 are buildable with coverage as it stands — but the *quality* of `narrative` is capped until it lands, and narrative quality is most of what the field buys. Shipping the register model without #97 delivers the contract and defers the benefit.

**Priority: LATER.** Slice 1 is cheap and should land when convenient. Nothing here preempts current sprint commitments.

## Alternatives Considered

**A. Strict persona-free PACKET — mechanical fields only, no prose.** The originating proposal's design, and the most serious alternative here. The cleanest machine contract: trivially validated, and the natural target for grammar-constrained decoding later. Rejected because it pays the persona context cost on every invocation and discards the output on more than nine returns in ten — the specialist → human edge is under 10% of invocations, so loading persona definitions into every specialist and then forbidding their use is the worst of both. It also collides head-on with `team-governance.md:183-193`, which names reports and reviews specifically as outputs that must carry voice.

It does hold **one advantage envelope + narrative cannot match**: a packet with no prose has nowhere to smuggle a fact. The correspondence rule and the count assertion narrow that gap without closing it, since nothing mechanical reads prose for unclaimed findings. The trade is accepted with eyes open, and a reversal trigger below exists so that if narrative-only findings appear in practice this alternative is re-argued on evidence rather than defended on the original reasoning.

**B. Do nothing — keep the two-tier protocol and the sentinel line.** Zero cost, zero risk. Rejected because the sentinel is a hand-rolled, unenforced convention guarding the single failure mode most likely to ship a real defect, and because the two-tier text is under-specified about shape rather than merely informal.

**C. Five registers, replacing the two tiers wholesale** — the originating proposal's model, adding registers for the durable-artifact edge, the notes-to-future-agents edge, and a separate specialist-voice edge. Rejected as over-scoped: the notes register duplicates ratified canon in `agent-notes.md`, the voice register dissolves into `narrative` once the return contract carries prose, and the artifact register has no spec. Framing the change as replacement rather than refinement also discards the tiers' correct insight about the axis in order to re-derive it under new names.

**D. Three registers — the two specified plus a named-but-deferred artifact register.** Rejected: a canon word that ships to a stranger who looks it up and finds a table row is worse than shipping nothing. The edge is deferred without a name.

**E. Enforce BRIEF conduct with a blocking `Stop` hook** that regex-matches offer-menus and packet-field leakage in the coordinator's final message, as the originating proposal specified. Rejected on four counts. A regex over natural language is judgment wearing a determinism costume, and ADR-0012's ladder puts judgment at Prose tier. Patterns matching the system's own vocabulary — schema field names, register names — block any turn that explains the register model or surfaces a governance conflict, which is a structural false positive over an entire legitimate conversation class rather than a tunable rate. The hook fires on every coordinator turn, the hottest path in the system. And blocking a final message has no good failure mode: the human is waiting and the turn cannot complete.

**F. Ship the enforcement adapters in the payload immediately.** Rejected on trust grounds — a category change in what `summon-team` installs, resting on eight unverified harness claims. Slice 4 keeps the door open behind a gate.

**G. Stdlib Python enforcement adapters,** as the originating proposal specified — chosen there for a deliberate reason, that Python's standard library covers JSON parsing and regex with no pip dependency. Rejected because Summon is a pnpm + Node repo with zero Python and four existing Node ESM checks, so a Python adapter ships a `python3` requirement to Node projects that never asked for it and forks the toolchain for two files. Node's standard library covers the same ground at no added cost. Full argument, including why ADR-0012's announced-degradation clause does not authorise it, in Sub-decision 4.

## Consequences

### Positive

- The false-green failure mode gets a machine-checkable defence. `finding_count`, `unknowns[]`, and evidence-backed ~~`OBSERVED`~~ `deterministic` claims are checkable in a way "the agent said it looked clean" never was.
- Persona voice survives where it pays — the human-facing narrative — and stops being demanded where it costs without returning.
- `unknowns[]` being **mandatory** converts silence into an assertion. An agent that says nothing about what it could not determine fails a check instead of reading as confidence.
- One authored source per concern; projections are rebuilt, not maintained.
- The classification-vs-shipping split gives every future enforcement adapter a path that does not require re-litigating the trust question from scratch.

### Negative

- **The envelope costs tokens on every specialist return.** Structured fields plus prose is strictly more output than prose alone, on the highest-frequency edge in the system.
- **The registers can be described but not enforced until Slice 3, which may never ship.** Slices 1-2 are prose and structure; if the probes fail or the trust ADR stalls, this remains a convention a forgetful agent can ignore. This is a *drift* control, not a *guarantee*.
- **Eight unverified harness claims gate real work.** Slice 3 is not schedulable until someone probes the harness. That work is unglamorous and easy to skip.
- **Human-facing output gets substantially longer, and the size is quantified rather than hand-waved.** Full-voice narratives run 4-6 sentences each; a five-agent review wave returns 20-30 sentences of narrative plus the index. The common case is verbose. The multi-narrative rule mitigates by ordering and structure so the wall can be scanned and abandoned safely at any point, but **mitigation is not elimination**. The volume is real, permanent, and the price of the anti-omission property.
- **Anti-starvation raises that estimate again.** Every claim is restated in the narrative with its anchor, so narrative length scales with finding count rather than sitting flat: roughly 8-12 sentences for a twelve-claim return after grouping. A five-agent wave in which several agents find a lot is the worst case in the design.
- **`team-governance.md:183-199` is deleted.** Anyone with that section in working memory will look for it and not find it. The five-line pointer mitigates but does not eliminate this.
- **Voice work is a committed obligation, not optional polish.** Nine personas need a voice authored from scratch (#97) — creative writing rather than mechanical migration, and the hardest kind, since these are precisely the personas nobody found vivid enough to document already.
- **The packet carries prose in two registers** — damped machine-consumed fields and one full-voice field. That is more nuance in a v1 schema than a single prose convention would be, it must be documented in `schemas/packet.schema.json` rather than left to prose, and it is one more thing an agent can get wrong.
- **The durable-artifact edge is unnamed as well as unspecified.** Anyone wanting to discuss it has no word — a small ongoing friction, traded for not shipping an empty one.
- **Hand-rolled schema validation** means Summon owns draft-07 semantics it did not write and cannot delegate upstream. Bounded by the flat-schema constraint, but it is code we maintain.
- **Vocabulary drift against `docs/history/`.** The originating brief and gate record use register names this ADR does not. The drift is bounded to historical documents, but a reader moving between them will hit it.

### Neutral

- ADR-0012 §F is untouched. This does not reverse it.
- `docs/methodology/agent-notes.md` is untouched, and remains the single source for the notes register.
- `docs/glossary.md` is untouched. Register names are Summon process vocabulary, which that document excludes by its own text.

## Reversal triggers

Revisit this ADR if any of the following becomes true.

- **Three or more of U1-U8 fail their probe.** If the harness does not expose what the return contract needs, Slices 2-3 are not buildable and this decision collapses to Slice 1 prose. That is a materially smaller decision and should be re-recorded as such rather than left standing as an unbuildable spec.
- **The trust ADR for Slice 4 is rejected.** If Summon decides it will never ship executing code into user repos, the enforcement half is permanently framework-only and the shipped canon is prose plus a schema. Worth saying out loud rather than leaving Slice 4 open indefinitely.
- **The envelope measurably degrades return quality.** If specialists produce thinner narratives because the structured fields absorb the effort, the trade in Sub-decision 2 has inverted and strict prose plus a sentinel may be better. Watch for narratives that restate the envelope instead of voicing it.
- **Narrative-only findings are observed in practice.** A finding in a `narrative` that never appeared in `claims[]` means the correspondence rule is not holding, `finding_count` is certifying an incomplete record, and the smuggling channel is open. That outcome makes strict persona-free PACKET (Alternative A) the better call, and it should be re-argued on that evidence.
- **Narratives are observed that omit claims present in the envelope, or that carry no literal anchors.** The mirror: the starvation direction is being ignored, findings are reaching the human as atmosphere with no path and no action, and the anchor check is not being run in review. Both directions fail silently, and only visible if someone reads a narrative against its envelope.
- **The human starts skipping narratives.** If wave output is routinely scrolled past rather than read, the verbosity has exceeded what the voice buys, and the honest response is to revisit full-voice `narrative` on multi-agent waves — not to quietly start summarising, which is the failure this ADR forbids. Watch at five agents and up; a two-agent wave will not surface it.
- **`unknowns[]` becomes ritual.** If agents routinely emit `unknowns: []` on work that plainly had unknowns, the field is a checkbox and worse than nothing — it converts an absence of thought into a positive assertion of completeness. That is the false-green failure mode wearing this ADR's own uniform.
- **Checkpoint: 2027-02-07**, six months from Proposed. If Slice 1 has not landed by then, the LATER ranking was correct and the rest should be closed rather than carried.
