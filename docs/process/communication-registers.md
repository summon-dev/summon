---
agent-notes: { ctx: "how agents address the human and each other; the specialist return contract", deps: [CLAUDE.md, docs/methodology/personas.md, docs/methodology/agent-notes.md, docs/process/done-gate.md, docs/adrs/0015-communication-registers.md], state: canonical, last: "claude@2026-08-08", key: ["TWO registers — BRIEF and PACKET; the model is a selection rule, not a taxonomy", "correspondence runs BOTH ways: nothing only in the narrative, nothing only in claims[]", "internal means machine-CONSUMED, not machine-carried — the test is who reads it", "on conflict the envelope governs and clarity beats character"] }
---

# Communication Registers

Your team talks to two audiences that want opposite things.

You, reading a security finding, want Pierrot's voice — the dark humour is what makes the finding land and be remembered a week later. The coordinator receiving that same finding wants a field it can branch on: is this Critical, is there evidence, did the agent actually finish. When the only rule is "voice must come through," the coordinator is left parsing prose for structure. And the failure that produces is the one `CLAUDE.md` names in § Treat Agent Output as Untrusted: **a truncated report that reads "looks clean" is a false green that can ship a real bug or a missing auth check.**

The fix is to choose communication style by the **edge** — who is sending to whom — rather than by who the agent is.

Decision record: [ADR-0015](../adrs/0015-communication-registers.md).

## The two registers

| Register | Edge | Shape |
|---|---|---|
| **BRIEF** | coordinator → human | Outcome first. No offer-menus. Findings surfaced, never summarised away. |
| **PACKET** | specialist → coordinator | One JSON object: a mechanical envelope **plus** a persona `narrative` field. |

**Two registers is the whole model.** It is a selection rule, not the first two entries in a taxonomy. If a third edge ever earns a specified register it gets its own decision record; nothing here reserves a slot, and no word ships as canon without a spec behind it.

Two edges deliberately have no register named here. Writing durable artifacts to `docs/**` is a real edge and an unspecified one — it ships **no name at all**, because a canon word you look up and find nothing behind is worse than no word. And notes to future agents are already specified by [`docs/methodology/agent-notes.md`](../methodology/agent-notes.md); a second source for a solved problem is a liability, not thoroughness.

## BRIEF — talking to the human

1. **Outcome first.** What happened and what it means for you, before the method that produced it.
2. **No offer-menus.** Do the work; don't present a menu of things that could be done instead. An offer-menu moves a decision you already delegated back onto your desk.
3. **Nothing summarised away.** A finding that existed is a finding you hear about.
4. **No length ceiling.** Length is the wrong control variable — a sentence cap truncates Critical findings, which reintroduces the exact false green this exists to close. The control is *outcome-first and nothing omitted*.

## PACKET — a specialist returning to the coordinator

One JSON object carrying both halves:

**Envelope — mechanical, required.** `v` (schema version), `agent`, `state`, `finding_count`, `claims[]`, and `unknowns[]`. Each claim carries `epistemic`, `severity`, `evidence`, and `action`.

**Narrative — prose, required.** The persona's own voice, written as that agent would write it.

The coordinator **gates on the envelope and forwards the narrative.** It does not paraphrase the narrative into house style. Forwarding is the whole point — a coordinator that rewrites every specialist into one voice has spent the persona context and thrown away what it bought.

Two envelope rules that look pedantic and are not:

- **`unknowns[]` is mandatory and may be empty.** An empty array is an assertion — *"I looked, and there was nothing I couldn't determine."* A missing key is a defect. Those are different claims and the schema should not let them collapse into each other.
- **`v` is required.** A contract that ships without a version key has no migration signal at its first breaking change, and no way for a reader to tell which contract it holds.

## Correspondence: the claim and the voiced claim

`claims[]` and `narrative` are **one content at two intensities** — not a record plus a commentary on it. One is machine-shaped, one is human-shaped. So the rule runs in both directions, and neither half may be read alone:

- **No fact in `narrative` that is absent from `claims[]`.** *Anti-smuggling.* A fact that appears only in prose has not been reported.
- **No claim in `claims[]` that is absent from `narrative`.** *Anti-starvation.* Every claim appears in the narrative **carrying its literal anchor** — exact path or component, severity, and recommended action, matching the claim's values.

Where the two disagree, **the envelope governs.** Where voice and precision pull against each other, **clarity beats character.**

Both directions guard a real failure.

**Smuggling.** A narrative says *"the auth bypass in `session.ts:88` is the real problem here"* while `claims[]` holds one medium logging finding and `finding_count` is 1. The envelope is internally consistent, so a validator passes it, the coordinator forwards the prose, and nothing reconciles the two. A Critical now exists only in prose — which means `finding_count` is a lie the validator certified. That is strictly worse than having no validator, because the false green has been laundered through a check.

**Starvation.** The mirror image: the findings sit in `claims[]` and reach you as atmosphere. *"This one's ugly. Fix it before it ships."* is a failing narrative — no path, no severity, no action — and on a single-agent return it is the entire message you receive.

**The narrative must *carry* each finding, not flavour it.**

### Full restatement, always

A twelve-claim return restates all twelve. Two things make that survivable:

**Anchors may be grouped.** Claims sharing a pattern can be restated together, so long as every path, severity, and action appears: *"Three instances of the same missing guard — `session.ts:88`, `auth.ts:14`, `mw.ts:203`, all Critical, all fixed the same way."* Three claims, one sentence, nothing dropped. Restatement therefore scales sub-linearly when claims cluster, which is the common shape of a real review.

**The verbosity is a signal, not a defect.** A narrative too long to read is reporting that twelve findings were bundled into one invocation. The fix is to scope returns smaller. An escape hatch here would suppress the only feedback that produces that.

Restating only above a severity threshold is starvation with a permission slip, and capping `claims[]` is just dropping findings — finding thirteen would go unreported.

### What can and cannot be enforced

**The anchor check is prose discipline, not a machine check, and must not be described as though it were.** Nothing can read prose for a *missing* restatement any more than for a *smuggled* fact. A validator's reach stops at `finding_count === claims.length` — which does not detect smuggling by itself, but combined with the correspondence rule it makes a smuggled finding *unreportable* rather than merely unrecorded: an agent that wants a finding to count has to put it in `claims[]`, where it is counted.

Claiming more enforcement than exists would be its own false green.

## Epistemic tagging: how a claim was established

Every claim carries how it was established — using **the same three grades as the Done Gate's proof ladder** ([`done-gate.md`](done-gate.md)), because it is the same ladder. The gate grades an *item*; a claim grades *itself*. One vocabulary, two subjects:

| `epistemic` | Means | Evidence |
|---|---|---|
| `deterministic` | A command computed the verdict — a test, a typecheck, a script, a query. | **Required.** `evidence` must be non-empty and must name what was run or read. |
| `inferential` | The agent read and judged. A review lens is legitimate here. | Expected: the paths or artifacts the judgement rests on. |
| `human-judgement` | The call genuinely needs a person — product fit, taste, risk appetite. | The claim names the decision needed, not a verdict. |

A `deterministic` claim with empty `evidence` is malformed, not merely unhelpful. That pairing is the whole reason the tag exists: *"the agent said it looked clean"* and *"this command exited 0 and here it is"* are different epistemic states that plain prose renders identically.

Grade honestly in both directions. Forcing a taste call to look deterministic is as wrong as eyeballing something a one-line check would settle. And a grade is a claim about **what was actually run** — it decays silently when the command behind it goes missing, so name the command, not the intention.

> **Open decision, flagged rather than buried.** ADR-0015 spells this field's value as `"OBSERVED"` in one sentence and never enumerates the rest of the set. Using the Done Gate's grades here is a reconciliation choice made to avoid shipping two vocabularies for one idea. It is reversible with a rename while Slice 1 remains prose-only; once a schema and validator exist, it is not. Confirm or overturn before that lands.

## Voice intensity

Registers set the **surface form** of a message. A second axis sets its **intensity**.

- **Damped.** Near-uniform: parsimony and pragmatism. Identity survives in word choice and in what the agent puts first, not in performance. No set-pieces, no extended metaphors, no jokes. Voices deliberately converge here.
- **Full voice.** The persona as written in [`personas.md`](../methodology/personas.md), unhedged.

**`narrative` is full voice.** The tempting misreading is that `narrative` travels on the specialist → coordinator edge, which is internal, so it should be damped. It should not.

> **Internal means machine-*consumed*, not machine-*carried*. The test is who reads the text, not who transports it.**

A field is internal if a program or an agent acts on it as data. A field is human-facing if a person reads it, however many relays it crosses. Transport is not consumption. `narrative` is the persona's message *to you*, merely passing through the coordinator.

So the damped register governs peer traffic and the envelope's machine-consumed prose fields — `summary`, `action`, and the entries in `unknowns[]`. It does not govern `narrative`.

This draws the same line through the packet that the correspondence rule draws: **the damped fields are the record; the full-voice field is that record voiced.** Fields the machine parses are terse and authoritative; the field the machine only forwards is vivid and, on conflict, deferential.

**Every persona has a voice.** There is no neutral-by-design opt-out — not for the executors either. A required `narrative` field assumes `personas.md` can tell each agent how to sound.

## A parallel review wave

The two registers meet on the most common path in the system, and the meeting has to be specified — otherwise you receive either a wall of prose or a lossy digest chosen ad hoc. Full-voice narratives run four to six sentences, more when a return carries many claims, and a five-agent wave is the ordinary case rather than the edge.

1. **Outcome first**, one line.
2. **An index, one line per *finding* — not per agent**: agent, severity, path, action. Every value read **from the envelope, never from the prose**.
3. **Ordered by severity, highest first.** Not roster order, not completion order. This is the largest readability lever available and it costs nothing: reading top-down you meet the Critical first and can stop anywhere without having missed the worst thing. Roster order scatters severity randomly through the wall, which is what makes a wall a wall.
4. **The index is independently actionable.** You can decide and act having read only steps 1–3, without opening a single narrative. This holds by construction, not by discipline — the correspondence rule puts every finding in `claims[]`, so an index built from envelopes is complete.
5. **Narratives below a single separator**, each under its own agent heading, same severity order, **verbatim**. Agents that returned no findings go last.
6. **No narrative is dropped and none is summarised.**

Per-*finding* granularity is what makes 3 and 4 true. A per-agent index can only sort by each agent's maximum severity, which buries a second Critical under someone else's Medium — and `Pierrot: high, 3 findings` tells you something exists without telling you anything you can act on.

The index is the body's table of contents, and it means a five-narrative return can be **scanned** rather than read. The volume is unchanged; you control how much you consume, and never pay for that control in missed findings.
