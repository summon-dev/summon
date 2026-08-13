---
agent-notes: { ctx: "how agents address the human and each other; the specialist return contract", deps: [CLAUDE.md, docs/methodology/personas.md, docs/methodology/agent-notes.md, docs/process/done-gate.md, docs/adrs/0015-communication-registers.md], state: canonical, last: "claude@2026-08-13", key: ["TWO registers — BRIEF and PACKET; a selection rule, not a taxonomy", "correspondence runs BOTH ways: nothing only in the narrative, nothing only in claims[]", "internal means machine-CONSUMED, not machine-carried; the test is who reads it", "on conflict the envelope governs and clarity beats character", "the correspondence and anchor rules are prose discipline, NOT machine-checkable"] }
---

# Communication Registers

Your team talks to two audiences that want opposite things.

You, reading a security finding, want Pierrot's voice. The dark humour is what makes the finding land and be remembered a week later. The coordinator receiving that same finding wants a field it can branch on: is this Critical, is there evidence, did the agent actually finish. When the only rule is "voice must come through", the coordinator is left parsing prose for structure, and the failure that produces is the one `CLAUDE.md` names in § Treat Agent Output as Untrusted. **A truncated report that reads "looks clean" is a false green that can ship a real bug or a missing auth check.**

The fix is to choose communication style by the **edge**, meaning who is sending to whom, rather than by who the agent is.

Decision record: [ADR-0015](../adrs/0015-communication-registers.md).

## The two registers

| Register | Edge | Shape |
|---|---|---|
| **BRIEF** | coordinator → human | Outcome first. No offer-menus. Findings surfaced, never summarised away. |
| **PACKET** | specialist → coordinator | One JSON object: a mechanical envelope plus a persona `narrative` field. |

**Two registers is the whole model.** It is a selection rule. Nothing about two implies a third is coming. If a third edge ever earns a specified register it gets its own decision record. Nothing here reserves a slot.

Two edges deliberately have no register named. Writing durable artifacts to `docs/**` is a real edge and an unspecified one, so it ships **no name at all**: a canon word you look up and find nothing behind is worse than no word. Notes to future agents are already specified by [`agent-notes.md`](../methodology/agent-notes.md), and a second source for a solved problem is a liability rather than thoroughness.

## BRIEF, to the human

1. **Outcome first.** What happened and what it means for you, before the method that produced it.
2. **No offer-menus.** Do the work. Don't present a menu of things that could be done instead; an offer-menu moves a decision you already delegated back onto your desk.
3. **Nothing summarised away.** A finding that existed is a finding you hear about.
4. **No length ceiling.** Length is the wrong control variable. A sentence cap truncates Critical findings, which reintroduces the exact false green this exists to close. The control is *outcome-first and nothing omitted*.

## PACKET, to the coordinator

One JSON object carrying both halves.

**Envelope, mechanical and required:**

| Field | Meaning |
|---|---|
| `v` | Schema version. Currently `1`. |
| `agent` | Which persona is returning, as its `.claude/agents/<name>.md` stem — `cam`, not `coach-cam`. |
| `state` | Did this invocation finish, or stop early? One of `complete` or `stopped_early`. |
| `finding_count` | How many findings. Must equal `claims.length`. |
| `claims[]` | The findings themselves. |
| `unknowns[]` | What the agent could not determine. Mandatory; may be empty. |

Each entry in `claims[]` carries `summary` (the finding in one line), `epistemic` (how it was established), `severity`, `evidence`, and `action` (what to do about it).

**Narrative, prose and required.** The persona's own voice, written as that agent would write it.

The coordinator **gates on the envelope and forwards the narrative.** It does not paraphrase the narrative into house style. Forwarding is the whole point: a coordinator that rewrites every specialist into one voice has paid for the persona and thrown away what it bought.

**A malformed envelope is a failed return.** If the envelope is missing, unparseable, or its `finding_count` disagrees with `claims.length`, the coordinator reports that upward as a failure and re-runs or escalates. It does not forward the narrative alone and it does not treat the absence of findings as a clean bill of health. An agent that stopped early has `state` to say so, and a return that says nothing at all is the false green this whole document exists to prevent.

Two envelope rules that look pedantic and are not:

- **`unknowns[]` is mandatory and may be empty.** An empty array is an assertion: *"I looked, and there was nothing I couldn't determine."* A missing key is a defect. Those are different claims, and the schema should not let them collapse into each other.
- **`v` is required.** A contract that ships without a version key has no migration signal at its first breaking change, and no way for a reader to tell which contract it holds.

The structure is also written as a JSON Schema at [`schemas/packet.schema.json`](../../schemas/packet.schema.json). This document is the authoritative one: where the schema and this text disagree, this text wins and the schema is corrected.

### The line every agent file carries

Each `.claude/agents/*.md` carries this line verbatim. It is **one line, not a pointer** — a subagent is handed its own agent file and nothing else, so a reference to this document would not reach it (issue #112). This block is the single source; `scripts/check-canon.mjs` asserts every agent file matches it.

The line spells out what goes in `agent` for the same reason it exists at all. It used to say bare `"agent"`, and the only place the answer was written down was the JSON Schema's description — which a subagent never reads. Cam, whose display name is Coach Cam, duly signed `"coach-cam"`; that was the single violation in the first full validation run of this contract (issue #127). Eight of the nine bound personas got it right by coincidence, their file stem and display name being the same word. A rule that only holds where two names happen to coincide is not holding.

```text
**Return contract (PACKET).** End your return with one JSON object: `{"v":1, "agent": "<your agent-file stem, e.g. cam not coach-cam>", "state": "complete"|"stopped_early", "finding_count", "claims":[{"summary", "epistemic":"deterministic"|"inferential"|"human-judgement", "severity":"Critical"|"Important"|"Suggestions", "evidence", "action"}], "unknowns":[], "narrative"}` — `finding_count` must equal `claims.length`, `unknowns` is mandatory and may be empty, a `deterministic` claim needs non-empty `evidence` naming what was run, and `narrative` restates every claim with its path, severity, and action **in your own voice**. Full spec, which wins on any disagreement: `docs/process/communication-registers.md`.
```

### Severity

`severity` is one of **Critical**, **Important**, or **Suggestions**, matching the vocabulary the review lenses already use (`.claude/agents/code-reviewer.md`). One set of words for one concept: a finding's severity in a packet means what it means in a review document.

## The claim and the voiced claim

`claims[]` and `narrative` are **one content at two intensities**, the same finding said twice for two readers. One is machine-shaped, one is human-shaped. So the rule runs in both directions, and neither half may be read alone:

- **No fact in `narrative` that is absent from `claims[]`.** *Anti-smuggling.* A fact that appears only in prose has not been reported.
- **No claim in `claims[]` that is absent from `narrative`.** *Anti-starvation.* Every claim appears in the narrative **carrying its literal anchor**: exact path or component, severity, and recommended action, matching the claim's values.

Where the two disagree, **the envelope governs.** Where voice and precision pull against each other, **clarity beats character.**

Both directions guard a real failure.

**Smuggling.** A narrative says *"the auth bypass in `session.ts:88` is the real problem here"* while `claims[]` holds one Important logging finding and `finding_count` is 1. The envelope is internally consistent, so a validator passes it, the coordinator forwards the prose, and nothing reconciles the two. A Critical now exists only in prose, which means `finding_count` is a lie that a check certified. That is strictly worse than having no check at all, because the false green has been laundered through one.

**Starvation.** The mirror image: the findings sit in `claims[]` and reach you as atmosphere. *"This one's ugly. Fix it before it ships."* is a failing narrative. No path, no severity, no action, and on a single-agent return it is the entire message you receive.

**The narrative must *carry* each finding, not flavour it.**

### Full restatement, always

A twelve-claim return restates all twelve. Two things make that survivable.

**Anchors may be grouped.** Claims sharing a pattern can be restated together, so long as every path, severity, and action appears: *"Three instances of the same missing guard, `session.ts:88`, `auth.ts:14`, `mw.ts:203`, all Critical, all fixed the same way."* Three claims, one sentence, nothing dropped. Restatement therefore scales sub-linearly when claims cluster, which is the common shape of a real review.

**Treat the verbosity as a signal.** A narrative too long to read is reporting that twelve findings were bundled into one invocation. The fix is to scope returns smaller. An escape hatch here would suppress the only feedback that produces that.

Restating only above a severity threshold is starvation with a permission slip, and capping `claims[]` is just dropping findings: finding thirteen would go unreported.

### What is checkable

**Only one part of this is mechanical: `finding_count` must equal `claims.length`.** That is worth asserting, because two sources for one number is a defect, and because it makes a smuggled finding *unreportable* rather than merely unrecorded. An agent that wants a finding to count has to put it in `claims[]`, where it is counted.

**Everything else here is prose discipline, and must not be described as though it were enforced.** Nothing can read prose for a *missing* restatement any more than for a *smuggled* fact. Both directions of the correspondence rule, and the anchor check, rest on the agent following them and on review catching it when they don't.

Claiming more enforcement than exists would be its own false green, which is the one mistake this document cannot afford to make.

### A worked return

```json
{
  "v": 1,
  "agent": "pierrot",
  "state": "complete",
  "finding_count": 2,
  "claims": [
    {
      "summary": "Session token comparison is not constant-time",
      "epistemic": "deterministic",
      "severity": "Critical",
      "evidence": "src/auth/session.ts:88 — `token === stored` under test/auth.test.ts:41",
      "action": "Use timingSafeEqual"
    },
    {
      "summary": "Refund endpoint logs the full card object",
      "epistemic": "inferential",
      "severity": "Important",
      "evidence": "src/payments/refund.ts:203",
      "action": "Log the last four digits only"
    }
  ],
  "unknowns": [],
  "narrative": "Two things. The session token comparison at src/auth/session.ts:88 is a plain `===`, which leaks timing and is Critical — swap it for timingSafeEqual before this ships. Less urgent but still Important: the refund path at src/payments/refund.ts:203 logs the whole card object, so your logs are now in scope for compliance nobody budgeted for. Log the last four and move on. I checked the token comparison against the tests; the logging one I read rather than ran."
}
```

Note what the narrative does. Every claim reappears with its path, its severity, and its action, so the correspondence rule holds. The voice is unmistakably Pierrot's and it never costs a fact. And `"unknowns": []` is a positive statement that nothing was left undetermined, which is why the key is mandatory even when the array is empty.

## How a claim was established

Every claim carries how it was established, using **the same three grades as the Done Gate's proof ladder** ([`done-gate.md`](done-gate.md)), because it is the same ladder. The gate grades an *item*; a claim grades *itself*. One vocabulary, two subjects.

| `epistemic` | Means | Evidence |
|---|---|---|
| `deterministic` | A command computed the verdict: a test, a typecheck, a script, a query. | **Required.** `evidence` must be non-empty and must name what was run. |
| `inferential` | The agent read and judged. A review lens is legitimate here. | Expected: the paths or artifacts the judgement rests on. |
| `human-judgement` | The call genuinely needs a person: product fit, taste, risk appetite. | The claim names the decision needed, not a verdict. |

These three are the whole set. A later schema version may extend it; nothing else is valid under `v: 1`.

A `deterministic` claim with empty `evidence` is malformed. That pairing is the entire reason the tag exists: *"the agent said it looked clean"* and *"this command exited 0, here it is"* are different epistemic states that plain prose renders identically.

Grade honestly in both directions. Forcing a taste call to look deterministic is as wrong as eyeballing something a one-line check would settle. And a grade is a claim about **what was actually run**, so it decays silently when the command behind it goes missing. Name the command that produced it.

## Voice intensity

Registers set the **surface form** of a message. A second axis sets its **intensity**.

- **Damped.** Near-uniform: parsimony and pragmatism. Identity survives in word choice and in what the agent puts first, not in performance. No set-pieces, no extended metaphors, no jokes. Voices deliberately converge here.
- **Full voice.** The persona as written in [`personas.md`](../methodology/personas.md), unhedged.

**`narrative` is full voice.** The tempting misreading is that `narrative` travels on the specialist → coordinator edge, which is internal, so it should be damped. It should not.

> **Internal means machine-*consumed*, not machine-*carried*. The test is who reads the text, not who transports it.**

A field is internal if a program or an agent acts on it as data. A field is human-facing if a person reads it, however many relays it crosses. Transport is not consumption. `narrative` is the persona's message *to you*, merely passing through the coordinator.

So the damped register governs peer traffic and the envelope's machine-consumed prose fields: `summary`, `action`, and the entries in `unknowns[]`. It does not govern `narrative`. Reports, reviews, challenges, and recommendations all still reach you in the agent's own voice, because all of them arrive as `narrative`.

**Scope, honestly: the damped register has almost no live consumer today.** Peer agent-to-agent messages depend on harness capabilities ADR-0015 defers, so that traffic does not yet flow. The envelope's prose fields are the whole of its current reach. The rule is written now so that it is settled when peer traffic arrives. Describing it as governing traffic that does not exist would be exactly the overclaim this document forbids elsewhere.

**Every persona needs a documented voice**, executors included. There is no neutral-by-design opt-out, because a required `narrative` field assumes `personas.md` can tell each agent how to sound. Where an entry there carries no voice yet, that is a gap in `personas.md` to close, and returning flat prose meanwhile is still a defect.

## A parallel review wave

The two registers meet on the most common path in the system, and the meeting has to be specified. Otherwise you receive either a wall of prose or a lossy digest chosen ad hoc, wave by wave. Full-voice narratives run four to six sentences, more when a return carries many claims, and a five-agent wave is the ordinary case rather than the edge.

1. **Outcome first**, one line.
2. **An index, one line per *finding*, not per agent**: agent, severity, path, action. Every value read **from the envelope, never from the prose**.
3. **Ordered by severity, highest first**, Critical before Important before Suggestions. Not roster order, not completion order. This is the largest readability lever available and it costs nothing: reading top-down you meet the Critical first and can stop anywhere without having missed the worst thing. Roster order scatters severity randomly through the wall, which is what makes a wall a wall.
4. **The index should be independently actionable.** You should be able to decide and act having read only steps 1 to 3, without opening a single narrative. This is exactly as complete as the correspondence rule was honoured: the index is built from envelopes, so a finding that never reached `claims[]` never reaches the index either. That is the failure the anti-smuggling rule exists to prevent, and it is prose discipline, not a guarantee.
5. **Narratives below a single separator**, each under its own agent heading, same severity order, **verbatim**. Agents that returned no findings go last.
6. **No narrative is dropped and none is summarised.**

Per-*finding* granularity is what makes steps 3 and 4 work. A per-agent index can only sort by each agent's maximum severity, which buries a second Critical under someone else's Important. And `Pierrot: Critical, 3 findings` tells you something exists without telling you anything you can act on.

The index is the body's table of contents. It means a five-narrative return can be **scanned** rather than read: the volume is unchanged, you control how much you consume, and you never pay for that control in missed findings.
