---
agent-notes: { ctx: "adoption is the standing request for agent invocation", deps: [CLAUDE.md, docs/process/done-gate.md, docs/process/team-governance.md, docs/adrs/0015-communication-registers.md], state: accepted, last: "claude@2026-08-14", key: ["adoption SATISFIES the restriction's condition, it does not override it — the restriction says 'unless the user requested it' and adoption is the request", "the scope is a PREDICATE: request-conditioned restrictions are satisfied, unconditional ones win and go to the human", "ungraded is an OUTCOME ABOVE the grade ladder, NOT a fourth rung — a fourth rung would break packet.schema.json's closed epistemic enum at v:1", "ungraded ships with limits: verbatim mechanism, context exhaustion inadmissible, unavailable when a human is reachable, follow-up item required", "Sub-decision 4 is the human's ruling; issue #82 keeps the objection open, it is not closed", "unenforceable by construction: no artifact's absence proves a wave was skipped"] }
---

# ADR-0016: Adoption is the standing request for agent invocation

## Status

**Accepted** — 2026-08-14, ratified by the human, who also authorised the gate and ruled on Sub-decision 4. Work item: PR #131.

Architecture Gate completed 2026-08-14, Archie and Wei as standalone agents. Point-by-point dispositions: `docs/history/tracking/2026-08-14-adr-0016-gate.md`. Both returned *ratify with amendments*; the amendments are incorporated above and the gate found no defect in what the decision decides.

The gate was itself blocked before it ran, and the shape of that is worth keeping. The drafting session operated under the restriction this ADR is about, so it could not spawn Archie and Wei for a *routine* work item. It recorded the gate item as **ungraded with the reason named** and blocked ratification rather than closing on its own proposed outcome — declining the benefit it invents, which is the only defensible first use of an escape hatch. The human then authorised the gate directly. That path is available for a one-off ratification and is not available for routine work, which is the whole reason the standing request exists.

## Classification: canon

Per ADR-0007 §1 — ask the test question: when a stranger scaffolds a payments app with `summon-team`, does this decision help *them*? Yes, and directly. Its text lands in `CLAUDE.md` and `docs/process/done-gate.md`, both of which ship, and it governs whether their coordinator can run the review wave their own Done Gate requires. That is methodology the user's project runs, not Summon's plumbing. It sits in the canon zone `docs/adrs/` alongside 0002 (TDD) and 0015 (communication registers).

The classification is also why the instrument matters: a decision that shipped only as a note in this repository would resolve the collision here and nowhere else, which is precisely the failure recorded in Context.

## Context

Summon's canon requires agent invocation in several places, and only some of them are conditioned on the human asking.

`CLAUDE.md` § *Don't Skip Agents* opens unconditionally — *"When a situation triggers multiple personas, invoke ALL of them"* — and then narrows in its second paragraph to *"When the human says 'invoke the team'… you MUST spawn the named agents."* The phase table assigns leads per phase with no such condition. The Done Gate is the sharpest instance: item 5 requires the code-reviewer wave, and item 8 states that *"Dani must be spawned as a standalone agent, not reviewed inline by the coordinator"* — a requirement with no conditional clause and no alternative satisfaction.

Some runtimes inject a session-level instruction of roughly the form *"do not call the AgentTool unless the user requested it."* Three properties matter:

- **It is not configuration.** It appears in no settings file on disk — `~/.claude/settings.json`, `.claude/settings.json`, and `.claude/settings.local.json` have been checked and are clean of it in two independent working trees. It is injected at session launch. There is nothing a user can edit to disable it, so no amount of user-side setup makes the collision go away.
- **It is well-motivated.** Spawning subagents costs tokens and time and takes actions the user did not ask for. A runtime that declines to do that unbidden is behaving correctly, and any resolution that treats the restriction as noise to be overridden is wrong on the merits.
- **It is silent about standing authorization.** It asks whether the user requested agent invocation. It does not say when, or in what form, or whether a request can be made once for a body of work rather than per invocation.

When both are live, precedence is undefined, and Summon's canon does not answer it. The coordinator does the cautious thing: it stops mid-gate and asks. The work item parks in In Review, and a documented workflow becomes a per-session negotiation.

The failure recurs, and the second occurrence is the informative one. In one downstream project the collision was hit on 2026-08-11, resolved by asking the human, who confirmed standing authorization; the resolution was written to per-user memory including an explicit instruction not to block again. On 2026-08-13 the same project hit the same collision and blocked anyway, reportedly having read that memory.

**Provenance, because this account carries more of the argument than any other fact here:** it is second-hand, reported by that project's session, and unverifiable from this repository. One detail is load-bearing and is *not* established — whether the memory was actually in the second session's context, or whether that is an inference from the file existing. If retrieval simply failed, then memory was never tested and "fix retrieval" is a live alternative this ADR does not consider. Everything below that leans on this account is marked accordingly.

Note what the argument does and does not need. The collision itself is **structural** — canon says *must invoke*, the runtime says *not unless asked* — so it recurs deterministically at every gate in every project, and one occurrence establishes it. No frequency claim is made and none is needed; the second occurrence is evidence about the *instrument*, not about a rate.

On instruments: per-user memory does not ship with the scaffold, does not reach a new project or a second user, and — on the account above — did not reach the next session in the same repository.

**Why the shipped artifact should do better, stated as salience and not merely distribution.** Distribution is the easy half: `CLAUDE.md` reaches downstream adopters and memory does not. But `CLAUDE.md` is also background context, so distribution alone does not explain why it would win where memory lost; the two arguments are easy to substitute for one another and only one of them is load-bearing. Three properties do the work: it is present **unconditionally** in every session rather than retrieved on relevance; it is phrased as a **standing directive to the coordinator's role**, not as a note recording what someone decided once; and it sits **adjacent to the gate it modifies**, so it is read at the moment of the collision rather than recalled about it. That is a real difference in kind. It is not a guarantee, and the Negative consequences below say so.

The root defect is not the AgentTool restriction specifically. It is that Summon has never said where a runtime-injected session instruction sits relative to its own canon, so every such collision is resolved from scratch by whoever hits it.

## Decision

### Sub-decision 1 — Adoption *supplies the restriction's condition*; it does not override it

**Adoption is the standing request.** A project that has adopted this methodology has already requested agent invocation. The phase table, § *Don't Skip Agents*, and the Done Gate's review wave *are* that request, made once at adoption rather than restated per work item.

The restriction is **conditioned**: *"unless the user requested it."* So the operation here is not overriding it. It is **satisfying** it. Where a session-level restriction asks whether the user requested agent invocation, the answer for a Summon project is yes — the restriction's own condition is met, and the coordinator proceeds normally with nothing to announce.

The distinction is load-bearing, not stylistic, and the tempting phrasing is the wrong one. *"Where a session restriction contradicts this, state the conflict and proceed"* concedes a conflict which, on this ADR's own logic, does not exist — and a coordinator that believes it is overriding the runtime is one bad inference from believing it may. Reading the condition as satisfied has an intrinsic stopping point; overriding has none. Anyone restating this rule should check which of the two they have written.

### Sub-decision 2 — The scope is a predicate, not an instance

**Restrictions conditioned on a user request** are satisfied by adoption, for the behaviours canon specifies. **Unconditional restrictions win** and the collision goes to the human.

That is deliberately a predicate rather than a rule about the AgentTool specifically, and it is *not* the general-precedence claim rejected below. It cannot reach a safety interlock, a cost ceiling, or any restriction that does not ask whether the user asked — those are unconditional as far as this ADR is concerned, and they win. No project file may assert supremacy over the runtime it executes in; Summon has no standing to grant itself that and does not.

Two consequences worth stating plainly. The boundary is **structural rather than promised**: it holds because of the restriction's grammar, not because this ADR undertakes not to widen later. And "unconditional restrictions go to the human" is itself a blocking rule, issued by an ADR whose thesis is that blocking mid-gate is the failure. Both are true and they do not conflict: blocking is the failure when the answer is already known and identical every time, and the correct move when it genuinely is not.

### Sub-decision 3 — The Done Gate gains an *outcome*, above the grade level

Items 5 and 8 currently admit only two results: the wave ran, or the coordinator asks. Where a wave genuinely cannot run — tool absent, spawn denied, a restriction the standing request does not reach — the gate item is recorded as **ungraded, with the reason named**, and the work item may close on that record. An ungraded item is not a passed item and must never be reported as one. Blocking forever is not proof, and closing on a silent skip is the false green that `CLAUDE.md` § *Treat Agent Output as Untrusted* exists to prevent.

The originating proposal from the downstream project framed this as a **Done Gate outcome** — a third path beside "the wave ran" and "the coordinator asks". That framing is the correct one and is kept.

**`ungraded` is not a fourth rung on the proof ladder, and must not be filed as one.** The three grades answer *how do you know?* `ungraded` answers *was it checked at all?* Those are different axes, and collapsing them would break a contract ADR-0015 explicitly closed: the packet's `epistemic` field is bound to the same three grades, `schemas/packet.schema.json` enumerates them as a closed `enum`, and ADR-0015 states they are the whole set under `v: 1`. A fourth entry would force a meaningless `epistemic: "ungraded"` or silently falsify the *same ladder* claim, and both are ADR events this decision does not take. **The ladder stays closed at three and the schema is untouched at `v: 1`.** PACKET already solved the same problem correctly by routing what an agent could not determine to `unknowns[]` rather than into the grade enum; the gate copies that shape.

So `done-gate.md` gains two levels: an item has an **outcome** (graded, or ungraded-with-reason), and a graded item has a **grade** (`deterministic` / `inferential` / `human-judgement`).

**`ungraded` ships with limits, not just a reversal condition.** A term that lets an item close without the review it requires needs a structural bound at introduction, because blocking costs a turn now, visibly, to someone who can fix it, while an ungraded close costs nothing now and everything at an unspecified later read:

- The reason must name the **blocking mechanism verbatim** — the restriction text, the missing tool, the denial.
- **Context exhaustion is inadmissible.** It is the reason that will be reached for, and its real fix is a smaller wave.
- **Unavailable when a human is reachable.** Ask instead.
- Every ungraded item **requires a follow-up work item** on the board, which is the counter the Reversal section needs and which uses tracking that already exists rather than a new script.

### Sub-decision 4 — Adoption counts as the request for downstream adopters too

Ruled by the human on 2026-08-14, in response to the gate.

The gate raised a real objection: reading a *file's presence* as a *person's request* manufactures consent, and issue #82 supplies a case where the premise is false — the scaffolder can install Summon's `CLAUDE.md` over a repository whose owner never chose it, so the artifact evidences an agent's action rather than a human's. Narrow scope answers *what* was authorised and never *who*.

The ruling is that adoption does constitute the request, downstream as well as here. What adopting this methodology means is the product owner's call to make, and it has been made.

The objection is not thereby dissolved, and is recorded rather than closed: where `CLAUDE.md` arrives in a repository by an agent's action rather than a person's choice, this clause rests on an act the owner did not perform. That is a defect in **how Summon installs**, tracked as issue #82, not a reason to withhold the decision here. Resolving #82 in favour of an affirmative, visible adoption step would retire the objection entirely.

### Sub-decision 5 — Unenforceable, and the text that ships says so

**This is prose discipline and is not enforceable.** Nothing can assert that a coordinator spawned an agent it should have. `check-canon.mjs` reads files, not behaviour, and there is no artifact on disk whose absence proves a wave was skipped — the gate record is written by the same coordinator whose compliance is in question. This sits in the same category as ADR-0015's correspondence rule and carries the same explicit disclaimer, for the same reason: given how much of Summon's canon insists that a rule in Markdown is not a control, an unenforceable rule that does not announce itself as one is a false green in waiting.

### The text

Added to `CLAUDE.md` § *Don't Skip Agents*:

> **Adopting Summon is the standing request.** Some runtimes inject a session-level restriction such as *"do not call the AgentTool unless the user requested it."* A project that has adopted this methodology has already made that request — the phase table, the Done Gate's review wave, and this rule *are* the request, made once at adoption rather than per work item. So the restriction's own condition is **satisfied**, not overridden: proceed normally, and do not park a work item to re-ask. This reaches only restrictions conditioned on a user request, and only for behaviour this canon specifies. An unconditional restriction wins, and that collision goes to the human. Where a wave genuinely cannot run, record the gate item as ungraded with the reason named (`docs/process/done-gate.md`) rather than blocking or skipping silently. Nothing checks any of this — no artifact's absence proves a wave was skipped.

Added to `docs/process/done-gate.md` § *Backpressure, not say-so*, **after** the three-grade ladder and not inside it:

> **Outcome sits above grade.** An item is *graded* or *ungraded*; only a graded item carries one of the three grades above.
>
> - **`ungraded`** — the check could not run, and the record names the blocking mechanism verbatim. It asserts nothing about the code and everything about what was not checked, so it never reports as passed and an item closing with one carries a legible hole rather than a silent skip. Context exhaustion is not an admissible reason — the fix for that is a smaller wave. Not available when a human is reachable: ask instead. Every ungraded item requires a follow-up work item on the board.

## Alternatives Considered

- **State the general precedence: `CLAUDE.md` outranks runtime-injected session instructions.** The originating proposal from the downstream project asked for this explicitly, on the reasonable ground that naming the general rule once resolves the next collision without a third round. Rejected: it licenses overriding *any* future session restriction, including ones injected for safety, cost, or user-consent reasons that Summon cannot anticipate and has no authority over. The narrow claim resolves the observed failure completely; the general claim buys future collisions at the price of a rule that would be wrong the first time a restriction deserved to win.

- **Leave the resolution in per-user memory.** This is what was tried on 2026-08-11. Rejected empirically rather than on principle: it does not ship with the scaffold, does not reach a new project or a second user, and failed to reach the next session in the same repository two days later even when that session read it. An instrument with a demonstrated failure rate at its one job is not a candidate.

- **Document it as a user-settings note.** Rejected on fact: the restriction is in no settings file on disk. There is nothing to configure, so a note telling users to configure it would be advice that cannot be followed.

- **Relax the Done Gate so the review wave is optional.** Rejected: this is the false green. An item that closes without review and without saying so is exactly what § *Treat Agent Output as Untrusted* was written against, and the `ungraded` outcome above gets the same unblocking effect while leaving the hole visible.

- **Have the coordinator ask the human once per session and cache the answer.** Rejected: the block is the failure, and this preserves it — merely amortised across a session rather than a work item. It also cannot survive a session boundary, which is precisely where the 2026-08-13 recurrence happened.

- **Do nothing and resolve each collision conversationally.** Rejected on observed cost: twice in three days in a single project, each time parking a work item mid-gate. That is the definition of a documented workflow degrading into a negotiation, and it scales with the number of projects scaffolded from Summon rather than staying constant.

- **Make the rule enforceable with a sensor.** Deferred rather than rejected, but no mechanism is currently known. It would require an artifact whose presence proves a wave ran and which the coordinator cannot author unilaterally — subagent transcripts are the nearest candidate (see `scripts/harvest-packets.mjs`), but they are written by the agents being measured and are undocumented harness internals. That objection defeats using them to *prove* a wave ran; it does not defeat the weaker and still-useful reading, which is that they supply a **countable denominator** of waves observed. This is revived if a trustworthy invocation record becomes available.

## Consequences

### Positive

- A work item **should** no longer park mid-gate over a question whose answer is the same every time, in every Summon project. Stated as an expectation rather than a guarantee, because the first Negative consequence below is that the rule may lose, and an ADR that promises in one section what it disclaims in the next has said nothing.
- The resolution ships. Every project scaffolded from Summon inherits it, which is the property per-user memory lacked and the reason this failure recurred.
- The Done Gate can be *closed honestly* in a degraded environment. Previously a blocked wave had no honest exit at all — the two available moves were to block indefinitely or to close on a skip nobody recorded.
- An absent check becomes countable rather than invisible: every ungraded close leaves a follow-up item on the board, so accumulation shows up where the sprint boundary already looks.

### Negative

- **A coordinator can now cite this rule to proceed where a human would have preferred to be asked.** That is a real transfer of discretion and it is the price of the decision, mitigated only by the narrow scope and by the one-line conflict statement that makes each exercise of it visible.
- Nothing enforces any of it. The rule's effect depends entirely on a coordinator reading `CLAUDE.md` and following it, against a session restriction that arrives as a stronger signal. It may simply lose, and the 2026-08-13 recurrence is direct evidence that a written instruction can fail to move a coordinator that read it.
- One more unenforceable rule in canon raises the ratio of prose-discipline rules to mechanical ones, which is the drift ADR-0012 watches.

### Neutral

- `CLAUDE.md` § *Don't Skip Agents* grows by a paragraph, and `done-gate.md` gains an outcome level above its grade ladder. The ladder itself is unchanged, no existing gate item changes its grade, and `schemas/packet.schema.json` stays at `v: 1`.
- The claim is scoped so that a future ADR can widen it if a second, differently-shaped collision earns one. Nothing here reserves that slot.

## Reversal

Revert if, six months on, either holds:

- **The rule is not being followed.** Coordinators still park work items on this collision despite the shipped text, which would mean the instrument is wrong again and the answer is not more prose.
- **`ungraded` becomes routine.** If gate items close ungraded as a matter of course rather than exceptionally, the outcome has become a bypass with a permission slip, and it should be withdrawn in favour of blocking — the failure it was built to avoid would have proven the cheaper one.

**What counts them, because a reversal condition nothing can measure is decoration.** Sub-decision 3 requires every ungraded item to open a follow-up work item on the board, so the count is *open follow-ups raised by an ungraded close*, read at each sprint boundary against the number of items closed in that sprint. That reuses tracking this project already runs rather than adding a script. It is a weak sensor and its weakness should be stated: the record is written by the same coordinator whose compliance is in question, which is the argument Sub-decision 5 makes against enforcing the invocation rule and which applies here with equal force. It is a counter that can fire, not a proof.
