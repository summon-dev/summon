---
agent-notes: { ctx: "Diego review of ADR-0015 Slice 1 canon doc", deps: [docs/process/communication-registers.md, docs/adrs/0015-communication-registers.md, docs/process/ai-tells-catalog.md], state: active, last: "diego@2026-08-08", key: ["review of a canon doc that ships to strangers", "AI-tells + stranger-test + overclaim lenses", "4 Critical: by-construction overclaim, unenumerated severity, dropped ADR caveat, the open-decision blockquote"] }
---

# Code Review — ADR-0015 Slice 1: Communication Registers

**Reviewer:** Docs Diego (technical writer / DevEx)
**Branch:** `feat/comms-slice-1`
**Range:** `cb6fe34..HEAD` (`952de7b`, `b0f655c`)
**Target:** `docs/process/communication-registers.md` (new, 130 lines)
**Date:** 2026-08-08

Findings are recorded below as they were produced. Count and sentinel at end of file.

---

## Verified before reviewing

Things I checked rather than assumed, because several findings depend on them:

- `docs/adrs/` **does** ship into scaffolded projects. `packages/summon-team/dist/index.js` `EXCLUDE_PATHS` excludes only `docs/adrs/meta`, `docs/history`, `docs/code-reviews`, `docs/tracking`, `docs/sprints`, `.claude/handoff.md`, `README.md`. So the ADR-0015 link on line 13 resolves for a stranger. Good.
- `CLAUDE.md` § Treat Agent Output as Untrusted exists (CLAUDE.md:74) and ships. The line 9 reference resolves.
- `docs/code-reviews/` is excluded from the payload, so this review file does not ship. Good.
- Persona voice coverage in `personas.md` after `952de7b`: six agents carry a voice descriptor — Archie (97), Pierrot (123), Vik (135), Wei (181), Tara (57), Pat (67). Ten do not.
- Summon's ratified severity ladder is **Critical / Important / Suggestions** (`.claude/agents/code-reviewer.md:90-102`).
- Migration fidelity (your request 5): all four non-migrated descriptors already existed in `personas.md` and survive in substance — Archie "Confident, visual-thinking, prefers diagrams over walls of text" (97), Vik "Has been in the industry forever… Pushes back on 'clever' code" (135, carries the grizzled-veteran sense), Wei "Reads Hacker News one morning and tries to shift the entire solution" (181), Pierrot "Prone to dark humor" (123). Tara's and Pat's migrations preserve meaning, not just words — Tara's new line merges the governance descriptor with the pre-existing "uncanny knack for unhappy paths" into one sentence rather than stacking them, and Pat's keeps the question as a question. **No voice content was lost in the migration.** Two follow-on defects live below (I-8, M-8).

---

## Critical

### C-1 — The doc contradicts its own honesty rule: "by construction, not by discipline"

**Line 123:**

> 4. **The index is independently actionable.** You can decide and act having read only steps 1–3, without opening a single narrative. This holds by construction, not by discipline — the correspondence rule puts every finding in `claims[]`, so an index built from envelopes is complete.

Line 77 has already ruled that the correspondence rule is prose discipline and cannot be machine-checked. So the index holds **by** discipline, precisely and only. Fifty lines after the doc says "claiming more enforcement than exists would be its own false green," it claims more enforcement than exists. This is the single most damaging line in the file, because the property it overclaims is the one that lets a reader stop reading — a reader who believes the index is complete by construction will act on steps 1–3 and skip narratives, which is exactly the false green.

**Proposed replacement:**

> 4. **The index should be independently actionable.** You should be able to decide and act having read only steps 1–3, without opening a single narrative. That holds exactly as far as `claims[]` is complete: the index is built from envelopes, so any finding an agent left out of `claims[]` is missing from the index too. Anti-starvation is what closes that gap, and it is prose discipline — nothing checks it. When a decision is expensive or a Critical is in play, read the narrative.

### C-2 — `severity` is the sort key for the whole wave rule and it is never enumerated, and the examples use a ladder Summon does not have

**Line 122** makes severity ordering "the largest readability lever available." **Line 37** requires every claim to carry `severity`. Nowhere does the doc say what the legal values are or what order they run in. Then the examples use four different tokens across three cases:

- Line 59: "one **medium** logging finding"
- Line 122: "you meet the **Critical** first"
- Line 127: "`Pierrot: high, 3 findings`" and "buries a second Critical under someone else's **Medium**"

`high` and `medium` are not Summon vocabulary at all. `.claude/agents/code-reviewer.md:90-102` ratifies **Critical / Important / Suggestions**. So a canon doc instructing an agent to sort by severity gives it neither the set nor the order, and demonstrates a fifth vocabulary in the process. An agent cannot implement step 3 from this text. Slice 2's schema author will guess.

**Proposed replacement — add to the envelope spec at line 37:**

> `severity` is one of `critical`, `important`, `suggestion`, in that order, highest first. These are the same three grades the code-review lenses use; lowercase in the envelope, capitalised freely in prose.

**And normalise the examples:** line 59 "one medium logging finding" → "one Suggestion-grade logging finding"; line 127 "`Pierrot: high, 3 findings`" → "`Pierrot: critical, 3 findings`"; line 127 "someone else's Medium" → "someone else's Suggestion".

If you want a four- or five-point ladder instead because `important` is too coarse for a PACKET, that is a legitimate call — but then it is a vocabulary change against `code-reviewer.md` and belongs in the ADR, not invented in an example.

### C-3 — The damped register is described as governing traffic that does not exist, and the ADR's own anti-overclaim caveat was dropped in the migration

**Line 110:**

> So the damped register governs peer traffic and the envelope's machine-consumed prose fields — `summary`, `action`, and the entries in `unknowns[]`. It does not govern `narrative`.

ADR-0015:157 carries this exact sentence **plus** the paragraph that makes it honest:

> **Scope, honestly: the damped internal register has almost no live consumer.** Peer agent↔agent messages depend on the `SendMessage` / `PreToolUse` work this ADR defers, so that traffic does not yet flow. The envelope's prose fields are the whole of its current reach. The rule is written now so it is settled when peer traffic arrives; **describing it as governing traffic that does not exist would be exactly the overclaim Sub-decision 6 forbids.**

The canon doc kept the claim and dropped the caveat. The ADR explicitly named this as the overclaim to avoid, and the durable spec — the file a stranger actually reads — is the one that commits it. This is the highest-confidence finding in the review: it is not a judgement call, it is a ratified sentence that did not make the trip.

**Proposed replacement for line 110:**

> So the damped register governs the envelope's machine-consumed prose fields — `action` and the entries in `unknowns[]` — and it will govern agent-to-agent peer messages when those exist. Today they do not: agents do not message each other directly, so the envelope's prose fields are the whole of this rule's live reach. It is written now so it is settled when peer traffic arrives. It does not govern `narrative`.

(Note `summary` is dropped from that list here on purpose — see I-1.)

### C-4 — The open-decision blockquote is the wrong instrument, and this is the answer to your question

**Line 95:**

> > **Open decision, flagged rather than buried.** ADR-0015 spells this field's value as `"OBSERVED"` in one sentence and never enumerates the rest of the set. Using the Done Gate's grades here is a reconciliation choice made to avoid shipping two vocabularies for one idea. It is reversible with a rename while Slice 1 remains prose-only; once a schema and validator exist, it is not. Confirm or overturn before that lands.

You asked whether a blockquote is the right way to carry an unresolved decision in canon. **No — and the problem is not the blockquote, it is that the decision is being carried at all.**

Three separate defects, in ascending order of severity:

1. **It is addressed to the wrong reader.** "Confirm or overturn before that lands" is an instruction to a Summon maintainer with commit rights on ADR-0015. In a payments-app repo, nobody can act on it. Canon that asks its reader for a ruling they cannot issue is dead text — and dead text in a spec teaches the reader that other rules might also be provisional.
2. **It publishes a second vocabulary in the one place that exists to prevent one.** The blockquote's own stated goal is "to avoid shipping two vocabularies for one idea," and the sentence achieves that by printing the rejected vocabulary in canon. An agent reading this section now knows both `OBSERVED` and `deterministic`, and has been told the choice is unsettled. That is a materially worse outcome than picking one silently.
3. **It is the wrong artifact class.** ADR-0015 is Accepted and it ships. A live disagreement between the ADR text and the spec belongs in the ADR's own residue — which the AI-tells catalog (5.2, 5.3) explicitly wants ADRs to carry — and in issue #99. The canon doc's job is to state the rule.

**Proposed fix — delete line 95 entirely.** Replace with nothing in the canon doc. Then do two things outside this file:

- **In `docs/adrs/0015-communication-registers.md`:** amend line 89 so `epistemic: "OBSERVED"` reads `epistemic: "deterministic"`, and add to the Consequences residue: *"The `epistemic` values are the Done Gate's three proof grades rather than a vocabulary of their own. That is a bet that one ladder can grade both an item and a claim about an item; if grading a claim turns out to need distinctions the gate does not make, this forks and both vocabularies have to be maintained. Issue #99 tracks the reconciliation."* The ADR is where a live trade-off is supposed to stay visible.
- **In issue #99:** record that Slice 1 shipped the Done Gate grades, that the rename is free while Slice 1 is prose-only, and that it stops being free when `schemas/packet.schema.json` lands.

If something genuinely must warn a *stranger's* agent, make it forward-looking and actionable rather than a request for confirmation. A legitimate version would be one sentence in the section body, no blockquote: *"These three values are the whole set. A later schema version may add to it; nothing here reserves a value."* That is useful to a reader who will never see the ADR. The current text is not.

---

## Important

### I-1 — `summary` is used as an envelope field and never specified

**Line 37** lists the envelope as `v`, `agent`, `state`, `finding_count`, `claims[]`, `unknowns[]`, with per-claim `epistemic` / `severity` / `evidence` / `action`. **Line 110** then refers to "the envelope's machine-consumed prose fields — `summary`, `action`, and the entries in `unknowns[]`." `summary` appears from nowhere. An agent cannot emit a field the spec does not list, and Slice 2's schema author has to guess whether it is an envelope key or a claim key.

This is inherited faithfully from ADR-0015 — `summary` appears at 151 and is absent from the field spec at 89 — so the doc reproduced a defect rather than introducing one. It still has to be resolved here, because this file is what an agent reads.

**Two clean fixes; pick one and move both files together.** Either add it to line 37:

> **Envelope — mechanical, required.** `v` (schema version), `agent`, `state`, `summary`, `finding_count`, `claims[]`, and `unknowns[]`. `summary` is one damped line naming what was reviewed and the verdict.

Or drop it from line 110 (my recommendation — the envelope already carries `state` and `finding_count`, and a prose `summary` that must not duplicate `narrative` is a third place for a finding to hide).

### I-2 — The schema and the validator are described in the present tense; neither exists

Slice 1 is prose-only, but three lines read as though machinery is in place:

- Line 45: "the **schema** should not let them collapse into each other"
- Line 59: "so **a validator passes it**, the coordinator forwards the prose"
- Line 77: "**A validator's reach** stops at `finding_count === claims.length`"

A stranger scaffolding today reads this and concludes that malformed PACKETs are rejected. Nothing rejects anything. ADR-0015:318 is blunt about it — *"the registers can be described but not enforced until Slice 3, which may never ship."* That sentence's substance belongs in canon, in the reader's language.

**Proposed — insert immediately after line 35 ("One JSON object carrying both halves:"):**

> Nothing validates this yet. The contract is a convention your agents follow; there is no schema file and no check that rejects a malformed return. The rules below are written to be mechanically checkable later, which is why they are stated as sharply as they are, but today the coordinator is the only thing enforcing any of it.

**And soften the three present-tense references:** line 45 → "no schema should be allowed to collapse them into each other"; line 59 → "a validator that checked only `finding_count === claims.length` would pass it"; line 77 → "a validator's reach would stop at".

### I-3 — "Every persona has a voice" is false in the repo it ships from

**Line 114:**

> **Every persona has a voice.** There is no neutral-by-design opt-out — not for the executors either. A required `narrative` field assumes `personas.md` can tell each agent how to sound.

`personas.md` describes the voice of six agents out of sixteen (Archie, Pierrot, Vik, Wei, and — as of `952de7b` — Tara and Pat). ADR-0015:283 concedes it: nine personas need a voice written from scratch, tracked in issue #97, and *"shipping the register model without #97 delivers the contract and defers the benefit."*

So a stranger reads "every persona has a voice," opens `personas.md`, finds ten with none, and has no instruction for what those ten write in `narrative`. The word "assumes" in the last sentence is doing quiet work it cannot carry — a reader takes the bolded sentence as the rule and the last one as rationale.

**Proposed replacement:**

> **No persona is neutral by design.** `narrative` is required of every agent, executors included, so every agent needs a voice to write it in. [`personas.md`](../methodology/personas.md) is the source for that voice and it does not yet describe one for every agent on the roster. An agent whose persona entry says nothing about how it sounds writes `narrative` in plain, direct prose — it does not invent a character for itself, and it does not skip the field.

That last clause is the actionable part and it is currently missing altogether.

### I-4 — "Coordinator" and "specialist" carry the entire model and are never defined

The table at line 17 defines both registers by edge — `coordinator → human`, `specialist → coordinator` — and the doc uses both nouns forty-odd times without ever saying what they are. `docs/glossary.md` excludes Summon process vocabulary by its own text (ADR-0015:83 confirms this was deliberate for the register *names*, but these two words are load-bearing in a way the register names are not). A stranger has no way to know that "the coordinator" is the session they are typing into.

**Proposed — insert after line 11 ("…rather than by who the agent is."):**

> Two words carry the model. The **coordinator** is the top-level agent in your session: the one you talk to, which invokes others and assembles what comes back. A **specialist** is any agent the coordinator invokes as a subagent — a reviewer, a test author, a security lens. Every rule below hangs off which of those two is sending.

### I-5 — Em-dash flood: 31 in 130 lines

Catalog 1.1 sets the target at zero and permits one per long doc. This file has **31 across 28 lines**, including doubles at lines 2, 11, and 61. That alone will make the doc read as machine-built to anyone calibrated for it, and it is the tell the catalog calls "the single most reliable" one.

Worst offenders, with rewrites:

- **Line 11:** "choose communication style by the **edge** — who is sending to whom — rather than by who the agent is." → "choose communication style by the **edge** (who is sending to whom) rather than by who the agent is."
- **Line 31:** "Length is the wrong control variable — a sentence cap truncates Critical findings, which reintroduces the exact false green this exists to close." → "Length is the wrong control variable. A sentence cap truncates Critical findings, which reintroduces the exact false green this exists to close."
- **Line 61:** "The mirror image: the findings sit in `claims[]` and reach you as atmosphere. *"This one's ugly. Fix it before it ships."* is a failing narrative — no path, no severity, no action — and on a single-agent return it is the entire message you receive." → "The mirror image: the findings sit in `claims[]` and reach you as atmosphere. *"This one's ugly. Fix it before it ships."* is a failing narrative with no path, no severity and no action, and on a single-agent return it is the entire message you receive."
- **Line 93:** "a grade is a claim about **what was actually run** — it decays silently when the command behind it goes missing, so name the command, not the intention." → "a grade is a claim about **what was actually run**. It decays silently when the command behind it goes missing, so name the command rather than the intention."
- **Line 118:** "the meeting has to be specified — otherwise you receive either a wall of prose or a lossy digest chosen ad hoc." → "the meeting has to be specified, or you receive either a wall of prose or a lossy digest chosen ad hoc."

The remaining ~20 are mechanical: parentheses, semicolon, or split the sentence. Aim for two or three survivors in the whole file — the ones where a genuine mid-sentence break earns it, e.g. the anchor-grouping example at line 69 where the dash separates an example list from its frame.

Also note the migration introduced a **new** em-dash into `personas.md` (Pat's line 67: "Terse and business-focused — the question under every answer is…"). Suggest "Terse and business-focused. The question under every answer is *'does this ship value to users?'*"

### I-6 — "Not X, Y" runs eight times; catalog 2.1 retires it permanently

Catalog 2.1 is the strictest entry in the file — *"Permanently retired. All variants, including the two-sentence form."* Occurrences:

| Line | Text |
|---|---|
| 22 | "It is a selection rule, not the first two entries in a taxonomy." |
| 24 | "a second source for a solved problem is a liability, not thoroughness." |
| 50 | "**one content at two intensities** — not a record plus a commentary on it." |
| 63 | "The narrative must *carry* each finding, not flavour it." |
| 71 | "**The verbosity is a signal, not a defect.**" |
| 91 | "is malformed, not merely unhelpful." |
| 106 | "machine-*consumed*, not machine-*carried*. The test is who reads the text, not who transports it." (two in two sentences) |
| 123 | "by construction, not by discipline" (also C-1) |

Eight is past the point where any one of them can be defended individually. Keep at most two — I would keep **line 106**, because the whole distinction is genuinely contrastive and the sentence is the section's thesis, and **line 63**, which is the sharpest sentence in the file. Rewrite the rest:

- Line 22: "Two registers is the whole model — a selection rule, and the model is complete at two." → better without the dash: "Two registers is the whole model. It is a rule for choosing, and it is complete at two."
- Line 71: "**The verbosity is a signal.**" (the "not a defect" half is already carried by the next sentence)
- Line 91: "A `deterministic` claim with empty `evidence` is malformed. Treat it as a failed return, not a thin one."
- Line 50: "`claims[]` and `narrative` are **one content at two intensities**: one machine-shaped, one human-shaped."

### I-7 — Closing reverberation paragraph

**Line 129:**

> The index is the body's table of contents, and it means a five-narrative return can be **scanned** rather than read. The volume is unchanged; you control how much you consume, and never pay for that control in missed findings.

Catalog 2.2: "End on the last substantive point. Do not summarize what was just said." Both sentences restate the six-step list above them, and "the volume is unchanged; you control how much you consume" is a near-verbatim echo of the ADR's own closing flourish at 176. Line 127 (the per-finding granularity argument) is a real point and a strong ending.

**Proposed: delete line 129.** If you want one operative sentence there instead of a summary, make it a rule: *"If the index and a narrative disagree, the index is wrong — rebuild it from the envelopes."*

### I-8 — The supersession silently narrows a ratified rule about challenges

The deleted `team-governance.md` text ratified voice across a named set of output types:

> **Their voice must come through in their outputs** — reports, reviews, **challenges**, and recommendations should read as if that person wrote them.

The new doc scopes full voice to exactly one place: the `narrative` field of a PACKET (line 104). Everything else internal is damped (line 110), and a *challenge* — Wei disputing Archie, Vik disputing Sato — is peer traffic. So a rule that was "challenges carry voice" is now "challenges are damped." That may well be the right call and it follows from the ADR's intensity axis, but **no reader is told it changed.** The replacement pointer says the ADR "supersedes the text and keeps the idea," which is not true of this particular idea.

This matters beyond bookkeeping. Wei's entire value is disputation, and `ai-tells-catalog.md` 5.6 names Claude's house bias as "blandness and false consensus," with "name the real disagreement when one existed (Wei's whole job is to surface it)" as the counter. Damping challenges pushes directly against that.

**Proposed — add to the Voice intensity section, after line 102:**

> This narrows an earlier rule. Voice used to be required across every agent output, challenges between agents included. Challenges now travel on peer traffic, which is damped: an agent that disagrees with another states the disagreement plainly rather than performing it. The persona still shows — in *what* an agent objects to and what it puts first — but a dissent that reaches you does so through `narrative`, in full voice, not through the peer message that raised it.

### I-9 — The replacement pointer in `team-governance.md` is archaeology addressed to a maintainer

**`team-governance.md`, new final line of the section:**

> The two-tier protocol that stood here was right about the axis and under-specified about the shape; ADR-0015 supersedes the text and keeps the idea.

In Summon's own repo this is a useful gravestone. In a scaffolded payments-app repo it is a paragraph about a document the reader has never seen, describing a revision they were not present for, using a term ("the two-tier protocol") that now appears nowhere in their tree. It is the exact defect you asked me to hunt: a sentence whose meaning depends on history the reader does not have.

The first two lines of the replacement are fine — they point, they scope, they resolve. The third should go.

**Proposed: delete that sentence from `team-governance.md`.** Its content is already recorded where it belongs, in ADR-0015:58, which ships and is the correct home for "why this changed." If you want the pointer to carry a reason at all, make it forward-facing: *"Voice is a property of the edge a message travels on, which is why it is specified there and not here."*

### I-10 — The false-green argument is made four times

Catalog 5.1 calls repo-scale restatement the strongest discourse tell, and 7.4 requires one canonical home per rule. The false green is argued at:

- Line 9: "a truncated report that reads 'looks clean' is a false green…"
- Line 31: "reintroduces the exact false green this exists to close"
- Line 59: "the false green has been laundered through a check"
- Line 79: "Claiming more enforcement than exists would be its own false green"

Line 9 is the doc's premise and earns it. Line 59 is a different and sharper claim (laundering through a check) and earns it. **Lines 31 and 79 are restatements.** Line 31 can end at "A sentence cap truncates Critical findings." Line 79 can be deleted outright — line 77's "must not be described as though it were" already carries the whole point, and a one-line paragraph restating the moral of the paragraph above it is 5.1 in its purest form.

### I-11 — "Gates on the envelope" is never operationalised

**Line 41:** "The coordinator **gates on the envelope and forwards the narrative.**"

Gating is the coordinator's single most important act under this contract and the doc never says what it consists of or what happens on failure. `CLAUDE.md` § Treat Agent Output as Untrusted has the answer for sentinels ("a sentinel that is missing… means the agent FAILED and must be re-run, never 'passed'") but nothing connects that rule to this one. An agent reading only this file does not know whether a malformed envelope means retry, ask the human, or read the prose anyway.

**Proposed replacement for line 41:**

> The coordinator **gates on the envelope and forwards the narrative.** Gating is a concrete act: if the envelope is missing, unparseable, or `finding_count` does not equal the length of `claims[]`, the return failed — re-invoke the specialist. A failed return is never mined for its prose and never reported to you as a pass. That is `CLAUDE.md` § Treat Agent Output as Untrusted applied to this contract. What the coordinator must not do is paraphrase the narrative into house style; forwarding is the whole point, because a coordinator that rewrites every specialist into one voice has spent the persona context and thrown away what it bought.

### I-12 — "No offer-menus" reads as a ban on recommending anything

**Line 29:** "**No offer-menus.** Do the work; don't present a menu of things that could be done instead."

The superseded governance text required the opposite-sounding thing: *"Provide context and recommendations, not just raw data."* And this doc's own `action` field requires every claim to carry a recommended action. A reader who takes "no offer-menus" at face value will strip recommendations out of BRIEFs, which starves the human in a new way. The distinction is real and obvious once stated, and it is not stated.

**Proposed replacement:**

> 2. **No offer-menus.** Do the work; don't present a menu of things that could be done instead. An offer-menu moves a decision you already delegated back onto your desk. Recommending one action is not an offer-menu — every claim carries an `action`, and a finding delivered without one is under-reported. The ban is on the menu, not on the recommendation.

---

## Minor

### M-1 — Two colon-subtitle headings (catalog 3.1)

- Line 48: `## Correspondence: the claim and the voiced claim`
- Line 81: `## Epistemic tagging: how a claim was established`

3.1 permits the form only when the second half names a coined framework. "How a claim was established" is the "X: How Y Works" default shape exactly. Line 48 is closer to defensible ("the claim and the voiced claim" is nearly a coined pair) but reads better without.

**Proposed:** `## The claim and the voiced claim` and `## How a claim was established`.

### M-2 — Lines 22 and 24 make the same "no word without a spec" point twice

Line 22: "no word ships as canon without a spec behind it." Line 24: "a canon word you look up and find nothing behind is worse than no word."

The second is the better sentence — it is concrete and it is attached to the actual case. **Cut the clause from line 22** and let line 24 carry it.

### M-3 — Two announce-the-move prefaces (catalog 2.6)

- **Line 43:** "Two envelope rules that look pedantic and are not:" — the "and are not" is the doc pre-defending itself. Delete the clause: "Two envelope rules that carry more weight than their size suggests:" or just "Two rules about the envelope:".
- **Line 57:** "Both directions guard a real failure." — a structure tag narrating that examples follow. Delete it; the two bolded paragraphs beneath announce themselves.

### M-4 — Symmetric parallel-contrast pairs (catalog 1.4, "endemic in Summon's docs")

- **Line 55:** "Where the two disagree, **the envelope governs.** Where voice and precision pull against each other, **clarity beats character.**" — anaphora (1.3) plus symmetric contrast. Both rules are good; the shape is the tell. Suggest: "**The envelope governs where the two disagree**, and where voice and precision pull against each other, clarity beats character."
- **Line 83:** "The gate grades an *item*; a claim grades *itself*. One vocabulary, two subjects:" — the second sentence is a stated takeaway (5.1) restating the first. Cut "One vocabulary, two subjects:".
- **Line 112:** "the damped fields are the record; the full-voice field is that record voiced. Fields the machine parses are terse and authoritative; the field the machine only forwards is vivid and, on conflict, deferential." — two symmetric contrast pairs back to back, the second largely restating the first. Keep the first clause, delete the second sentence.

### M-5 — Unsourced frequency claims

**Line 118:** "Full-voice narratives run four to six sentences, more when a return carries many claims, and a five-agent wave is the ordinary case rather than the edge."

Neither number is grounded, and ADR-0015:289 gives a figure pointing the other way (the specialist → human edge is "under 10% of invocations"). More importantly it is ambiguous whether "run four to six sentences" is a **description** or a **rule** — an agent reading this cannot tell whether it is being given a length target, and line 31 has just banned length ceilings.

**Proposed:** "A narrative is usually a short paragraph and grows with the number of claims it carries; this is a description of what they look like, not a target. Waves of four or five agents are ordinary."

### M-6 — `state` is never enumerated

Same class as C-2 but lower stakes because nothing sorts on it. Line 37 requires `state` and the doc never says what values it takes. Given the sentinel machinery in `CLAUDE.md`, a stranger would guess `complete` / `truncated` / `failed`, which is probably right — but guessing is the problem. One clause on line 37 fixes it.

### M-7 — No worked example of a PACKET

Every agent that reads this has to produce one JSON object, and the doc contains no JSON. Field names appear in three separate prose runs (37, 45–46, 110) and the nesting is never shown. This is the largest single actionability gap in the file, and it is *not* a schema — a fenced example is prose, so it does not breach Slice 1's scope.

**Proposed — add after the envelope/narrative paragraphs (~line 40):**

```json
{
  "v": 1,
  "agent": "pierrot",
  "state": "complete",
  "finding_count": 1,
  "claims": [
    {
      "epistemic": "deterministic",
      "severity": "critical",
      "evidence": "npm audit --json; session.ts:88",
      "action": "Add the session guard to session.ts:88 before merge."
    }
  ],
  "unknowns": [],
  "narrative": "The guard at session.ts:88 is missing and it is Critical — anyone with a stale cookie walks straight in. Add the guard before this merges. I found nothing else I could not account for."
}
```

Note this example also demonstrates the correspondence rule (path, severity and action all appear in both halves) and the empty-`unknowns[]` assertion, which currently cost two paragraphs of prose each to convey. It may let you shorten the file rather than lengthen it.

### M-8 — ADR-0015 now ships to strangers with dangling provenance links

Not introduced by this slice, but line 13 points every stranger at ADR-0015, so it becomes this slice's reachability problem. ADR-0015:11 reads: *"Point-by-point dispositions: `docs/history/tracking/2026-08-07-comms-register-gate.md`. Originating brief: `docs/history/design/2026-08-07-comms-refit.md`."* Both live under `docs/history/`, which the scaffolder excludes. A stranger who follows your one cross-reference lands on an ADR whose first substantive line points at two files that do not exist in their repo.

ADR-0015:327 already concedes vocabulary drift against `docs/history/` as a known consequence, so the issue is on the record — but the reachability half of it is not. Worth a follow-up issue rather than a fix in this PR: either ADRs stop citing `docs/history/` paths inline, or the scaffolder strips those lines, or ADRs get a "Summon-internal references" footer the reader can ignore.

### M-9 — Redundancy: what a reader can skip without losing a rule

You asked what could be cut. Ranked by confidence:

1. **Line 129** (I-7) — pure restatement. ~45 words.
2. **Line 79** (I-10) — restates line 77's moral. ~10 words.
3. **Line 57** (M-3) — structure tag. ~6 words.
4. **Line 112 second sentence** (M-4) — restates the first. ~25 words.
5. **Line 83's "One vocabulary, two subjects:"** (M-4) — restates the sentence before it.
6. **Line 61's Starvation example** — the weakest of the two examples, because line 53's anchor rule already states the failure precisely and line 63 states the moral. The Smuggling example at 59 earns its length (the laundering argument is genuinely new); Starvation could compress to one sentence: *"The mirror image reaches you as atmosphere: "This one's ugly. Fix it before it ships." — no path, no severity, no action, and on a single-agent return that is the whole message."*

That is roughly 120 words out of 2,046, which is not much — **the file is not bloated.** Its real length problem is the opposite: the sections that need more (a worked example, the severity set, the coordinator/specialist definitions) are shorter than the sections arguing why the rules are right. Roughly a third of the prose is justification. That is defensible in canon a stranger has to be persuaded by, but if you want to cut, cut argument and add specification.

---

## Answers to your five direct questions

1. **AI-tells.** Fails on em-dash flood (I-5, 31 instances against a target of zero), "not X, Y" (I-6, eight instances against a permanent retirement), the closing reverberation paragraph (I-7), two colon-subtitle headings (M-1), two announce-the-move prefaces (M-3), and three symmetric parallel-contrast pairs (M-4). It passes cleanly on vocabulary (no *leverage*, *robust*, *seamless*, *load-bearing*, *delve*), on 5.4 (it names ADR-0015, `CLAUDE.md` § Treat Agent Output as Untrusted, `agent-notes.md`, specific personas — no vague allusion anywhere), and on 5.2/5.3 (it leaves genuine residue: line 77 refuses to claim enforcement, line 71 declines an escape hatch). The discourse layer is in better shape than the surface layer, which is the unusual direction and a good sign about the thinking behind it.

2. **Stranger test.** Three genuine failures: undefined "coordinator"/"specialist" (I-4), the maintainer-addressed blockquote (C-4), and the `team-governance.md` gravestone sentence (I-9). The doc explains Summon's internal history where it should state a rule in exactly two places — C-4 and I-9 — and both are fixable by deletion. The opening (lines 7–11) survives the stranger test well; the Pierrot reference works because personas ship.

3. **Actionable?** Weakest dimension. Vivid-but-unimplementable: step 3's severity ordering with no enumerated severities (C-2), "gates on the envelope" with no failure action (I-11), a required JSON object with no example (M-7), a required `summary` field that does not exist (I-1), unenumerated `state` (M-6), and no instruction for the ten personas that have no voice (I-3). Every one of those is a property described without an action attached.

4. **Overclaim.** Four found: C-1 ("by construction, not by discipline" — the worst, and a direct self-contradiction), C-3 (damped register governing traffic that does not exist, with the ADR's own protective caveat dropped in transit), I-2 (present-tense schema and validator), and I-3 ("every persona has a voice"). Line 77 itself is exemplary and should be the model for the fixes.

5. **The supersession.** Nothing ratified is lost in the *persona* migration — all six descriptors survive with meaning intact, and Tara's and Pat's were genuinely at risk (verified above). One ratified rule changes meaning without disclosure: challenges were full-voice under governance and are damped peer traffic under the new model (I-8). One deleted rule has an unresolved tension with its replacement: "provide recommendations" versus "no offer-menus" (I-12). The ordering constraint you cited holds — `952de7b` precedes `b0f655c`.

---

## Summary

| Grade | Count |
|---|---|
| Critical | 4 |
| Important | 12 |
| Minor | 9 |
| **Total** | **25** |

**Inferred rather than observed, flagged per your request:**

- **I-8** rests on my reading that an agent-to-agent challenge is "peer traffic" under line 110. The doc never defines peer traffic, so if you intend challenges to travel as `narrative` inside a PACKET, the narrowing does not occur and I-8 collapses to "define peer traffic." Either way a definition is owed.
- **C-2's** recommendation to adopt Critical / Important / Suggestions assumes you want one severity ladder across the repo. That is a product call, not a documentation one — the finding that the set is unspecified stands regardless of which set you choose.
- **M-8** is a pre-existing ADR/scaffolder interaction I found while verifying that ADR-0015 ships. It is out of this PR's scope; I flag it because line 13 makes it reachable.
- Everything else is observed directly in the diff, the target file, or the files cited by path and line.

**Recommendation:** Changes requested. C-1 and C-3 are must-fix before merge — both are overclaims in a document whose stated purpose is to not overclaim, and C-3 is a ratified caveat that was dropped in migration. C-4 answers your open question and is a deletion. C-2 blocks implementation of the doc's own most-emphasised rule. The Important tier is a half-day of editing. The Minor tier can ship as follow-ups except M-7, which I would fold into this PR because the worked example is likely to shorten the file.

DIEGO-REVIEW-COMPLETE: 25 findings, 4 critical
