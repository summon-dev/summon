---
agent-notes: { ctx: "Wei round-2 verification of ADR-0004 rework", deps: [docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0003-research-driven-restructure-2026.md, docs/sprints/sprint-1-plan.md, docs/tracking/2026-05-02-adr0004-feature-spec-debate.md], state: complete, last: "wei@2026-05-02" }
---

# Debate Round 2: ADR-0004 Feature-Spec Artifact — Rework Verification

**ADR:** [docs/adrs/0004-feature-spec-artifact.md](../adrs/0004-feature-spec-artifact.md)
**Round 1 debate:** [2026-05-02-adr0004-feature-spec-debate.md](2026-05-02-adr0004-feature-spec-debate.md)
**Date:** 2026-05-02
**Participants:** Archie (rework author, in absentia) vs Wei (challenger, read-only)
**Note:** Round 1 issued REWORK on three Must-Change items and three Should-Amend items. Archie reworked the ADR in place and added a Rework Notes section. This round verifies each finding and looks for new defects introduced by the rework itself.

---

## Part 1 — Verification of Round 1 Findings

### Must-Change items 1–3

#### Finding 1 — Challenge 6 (planner/generator/evaluator pre-commitment)

**Status: RESOLVED.**

The parenthetical is gone from § Ownership. The new § Ownership justifies Pat-authors / Tara-validates / Sato-implements on three independent merits, none of which name the harness triad. Alternative D's rejection is rewritten on standalone grounds (spec-as-contract requires authorship/implementation separation, mirroring the same logic as ADR-0002's Tara-writes-tests rule). The harness shape is not mentioned anywhere in the body of the ADR. ADR-C is left free to debate the persona-to-role mapping from first principles; if it lands on a different mapping, ADR-0004's ownership decision survives on its own justification rather than depending on the triad.

Clean fix.

#### Finding 2 — Challenge 7 (W2.2 pilot impossibility)

**Status: RESOLVED, with a structural side-effect that needs flagging (see Part 2 §A).**

The W2.2 pilot is replaced with a shadow-pilot on W1.3. The shadow pattern is named explicitly: existing pre-ADR-0004 process still gates the work; the spec is authored, reviewed, and post-mortem'd alongside it. The selection criteria for W1.3 are sound: M-sized, multi-file, has an ADR being authored above it, has substantive cross-component decisions, isn't self-referential (avoids piloting on W1.1), isn't undersized (avoids W1.2). Pilot success criteria are concrete and falsifiable. ADR-0003's halt rule is preserved.

The fix lands. There is one residual structural concern about *picking W1.3 specifically* that I treat as a new attack surface in Part 2 §A — not a regression on the original challenge.

#### Finding 3 — Challenge 8 (no enforcement hook)

**Status: PARTIALLY RESOLVED.**

The ADR now says "Accepted, broad rollout gated on W1.1 (Done Gate amendment) landing." That's the binding I asked for. The Tara hard-backstop — "Tara MUST refuse to author tests for any M+ item that has no spec link" — is added as a workflow rule independent of the Done Gate amendment, and § Status calls it out as surviving any slip in W1.1. Both moves are correct.

**Residual risk:** the Tara backstop assumes Tara is invoked. The team's existing process gotchas (CLAUDE.md § Critical Rules; gotchas.md line 69) document that Tara is sometimes silently bypassed for M+ items under deadline pressure. If Tara isn't invoked, the backstop has nothing to enforce. The ADR doesn't address who catches the failure mode where the implementer skips both the spec *and* Tara — in that path the work item closes with no spec link, and only a post-hoc audit finds it. I treat this as a new attack surface in Part 2 §B.

Acceptable for acceptance, but the residual risk should be acknowledged in § Consequences (which does in fact say "if Tara is bypassed, the rule has no automated catch" — good, that's the right disclosure).

### Should-Amend items 4–6

#### Finding 4 — Challenge 3 (semantic three-pillar distinction)

**Status: RESOLVED.**

The Schema table now requires Scope bullets to cite the specific AC they bound (by ID or quoted phrase) and Key Decisions to either cite the ADR they sit below or declare "no ADR applies because…" with a one-sentence rationale. Both are mechanically checkable by Tara at red-phase entry. The vibe-check failure mode I worried about is closed. Note one new attack surface in Part 2 §C around chicken-and-egg with not-yet-existing ADRs — the citation requirement itself is sound; the question is whether it composes cleanly with the umbrella's wave structure.

#### Finding 5 — Challenge 4 (Pat same-author drift)

**Status: PARTIALLY RESOLVED.**

Cam is added as coherence reviewer at the discovery handoff. Single pass, no new agent. The mechanism matches my counter-proposal exactly.

**Residual risk:** the Lifecycle section says Cam reviews "at the discovery handoff, before Tara's verifiability gate." But the spec is *authored* at the start of Phase 3 (Implementation), per Lifecycle step 1 — *after* Discovery handoff has already occurred. So either:
- "Discovery handoff" here means a second handoff at the Architecture→Implementation seam (which is ambiguous wording — Cam is a Discovery agent and "discovery handoff" reads as Phase 1→2), or
- Cam is being asked to review the spec at a moment that is chronologically before the spec exists.

The intent is clear (Cam reviews spec-vs-AC coherence after the spec is written, before Tara opens red phase) but the wording is slipshod. I treat this as a Part 2 §D concern — it's an amendment-grade clarification, not a new structural defect.

#### Finding 6 — Challenge 5 (Archie soft gate)

**Status: RESOLVED.**

§ Ownership now names the objective trigger list (cross-component interfaces, persistence, security, external dependencies) as mandatory, keeps the judgment trigger as an additive overlay, and adds the escalation path: Archie deeming a Key Decision architectural stalls the spec, opens an ADR, halts the work item until that ADR is Accepted. There is no "Archie noted this and we proceeded" path. That is the teeth I asked for. The architecture-gate-bypass pattern (gotchas.md line 69) is closed at the spec layer.

### Acceptable-as-is items 7–8

#### Finding 7 — Challenge 1 (M boundary inherited)

**Status: PARTIALLY RESOLVED.**

The ADR now commits to extending the pilot to an L item *if one becomes available* in Wave 1, and requires the post-mortem to log "boundary fitness not yet tested at L; deferred to first L item under broad rollout" if no L item exists in Wave 1.

**Residual risk:** I checked sprint-1-plan.md. Wave 1 has W1.1 (M), W1.2 (S), W1.3 (M) — no L item exists in Wave 1. So the "if available" branch is, by inspection of the plan, not going to fire. The fallback is "log it as a follow-up and treat the first L item under broad rollout as continuing-pilot evidence." That's a reasonable plan but it has two weaknesses:

1. **"Continuing-pilot evidence" has no defined consumer.** The original pilot has a post-mortem that feeds back into ADR-0004. The continuing-pilot evidence at the first L item has no named gate, no named reviewer, no named amendment trigger. If the first L L-item under broad rollout reveals the boundary is wrong, who reopens the ADR? When?
2. **By the time the first L item lands under broad rollout, the spec rule is already binding for all M+ items.** If the boundary turns out to be at L, every M item that already shipped a low-value spec is wasted process tax — the cost of being wrong is paid before the evidence arrives. This is exactly the asymmetric-cost concern from Round 1.

I do not think this rises to REWORK. The ADR explicitly acknowledges the boundary is provisional ("may move to L based on pilot evidence") and ties pilot results to amendments. The risk is real but disclosed. I am accepting it on the condition that § Consequences gain one sentence: "First L item under broad rollout treated as continuing-pilot; failure on that item reopens § Size Carve-Out." Without that sentence, the continuing-pilot promise has no defined trigger.

That's an amendment, not a REWORK.

#### Finding 8 — Challenge 2 (XS-forbidden vs S-optional asymmetry)

**Status: RESOLVED.**

§ Size Carve-Out now defines "explicit justification" for opt-in S specs: a one-line rationale in the work item description, plus Pat + Tara recorded sign-off. Without both, non-conformant. That's the audit trail I asked for.

---

## Part 2 — New Attack Surfaces Introduced by the Rework

### A. Does picking W1.3 as the shadow-pilot create a circular dependency?

**Concern:** W1.3 is the harness ADR (ADR-C) being authored above the work item. The W1.3 spec might absorb harness-ADR decisions before ADR-C is debated, which would be the same pre-commitment problem Challenge 6 hit on for ADR-0004 itself.

**Verdict: real risk, but controllable.** The spec's Key Decisions section is supposed to capture *item-local* choices. The progress-note schema and `/handoff` command shape are exactly the kind of cross-cutting decisions that belong in ADR-C, not in a per-item spec. If Pat writes W1.3's spec and includes "progress-note schema = X" as a Key Decision, that decision is silently locking ADR-C's debate space — same anti-pattern as the planner/generator/evaluator parenthetical, one ADR removed.

**The mitigation already exists in this ADR, if it's invoked:** Archie's escalation path (§ Ownership) says any Key Decision touching cross-component interfaces opens an ADR and halts the work item. The progress-note schema is cross-component by construction. So if the W1.3 spec tries to absorb a schema decision, Archie should escalate it to ADR-C and the work item should halt until ADR-C is Accepted — which is the desired behavior under ADR-0003's wave model.

This is fine *if Archie is actually invoked on the W1.3 spec*. The pilot success criteria (ADR § Pilot Plan) currently list Pat, Cam, and Tara as reviewers but do not explicitly call out Archie. **Amendment recommended:** add a sixth pilot success criterion: "Archie reviews any Key Decision flagged as touching cross-component interfaces (which the harness/progress-note shape will be); if Archie escalates, the spec stalls and ADR-C absorbs the decision rather than the spec." This makes the circular-dependency mitigation explicit instead of relying on the reader to chain two sections together.

This is amendment-grade, not REWORK.

### B. Does the Tara backstop survive Tara not being invoked?

**Concern:** The hard-backstop rule says "Tara MUST refuse to author tests for any M+ item that has no spec link." This presupposes Tara is invoked. What stops the implementer from skipping Tara *and* the spec?

**Verdict: real gap, partially disclosed.** § Consequences (Negative bullet 6) acknowledges: "Until W1.1 lands, the Done-Gate enforcement leans on Tara's pre-condition rule; if Tara is bypassed, the rule has no automated catch." Good — it's disclosed.

But disclosure is not mitigation. Once W1.1 lands, the Done Gate item ("spec link present for M+ items") catches the post-hoc skipped-spec case. Until W1.1 lands, the team is on an honor system: implementer must invoke Tara, Tara must check for spec link, if either step is skipped the rule has no enforcement. The window between ADR-0004 acceptance and W1.1 landing is exactly when the shadow-pilot runs, so in practice this gap exists for the duration of the pilot itself.

**This is acceptable** because (a) the shadow-pilot is on a single named work item (W1.3) where the team is paying close attention by definition, and (b) broader rollout is gated on W1.1. But the ADR should add one line in § Status: "During the shadow-pilot phase, the human or coordinator confirms Tara is invoked on W1.3; the honor-system gap closes when W1.1 lands." This makes the temporary mitigation explicit.

Amendment-grade.

### C. Does the citation requirement create a chicken-and-egg problem?

**Concern:** Every Scope bullet must cite an AC; every Key Decision must cite an ADR or declare "no ADR applies." But what if the work item is in an area where the relevant ADR doesn't yet exist — for instance, a spec written *during* Wave 1 that touches a topic Wave 2 will formalize?

**Verdict: not a real problem, because the "no ADR applies because…" escape valve handles it.** The citation requirement is *citation OR declaration* — it doesn't require the ADR to exist. If no ADR applies, the author says so with a one-sentence rationale. The schema as written handles this case.

The genuine version of this concern would be: "ADR exists in flight (Proposed but not Accepted) — does the spec cite the proposed ADR, the prior accepted state, or wait?" The ADR doesn't address this. For W1.3 specifically, ADR-C is in flight while W1.3's spec is being drafted in the shadow-pilot. The W1.3 spec would naturally want to cite ADR-C, but ADR-C isn't Accepted yet.

**Resolution path is implicit but not stated:** under ADR-0003's halt rule, W1.3's *real* implementation can't proceed until ADR-C is Accepted. For the *shadow-pilot*, the spec can be drafted citing the in-flight ADR-C with a note ("cites ADR-C as of <date>; subject to ADR-C amendment"). This is consistent with ADR amendment lifecycle.

**Amendment recommended:** one line in § Schema clarifying that citations may reference Proposed (not yet Accepted) ADRs, with a follow-up obligation to revisit if the ADR is amended at acceptance. This is process hygiene, not a structural defect.

Amendment-grade.

### D. Does the Cam coherence-review step have access to AC and spec at the right time?

**Concern:** The Lifecycle section says Cam reviews "at the discovery handoff, before Tara's verifiability gate." But step 1 says authoring happens "at the start of Phase 3 (Implementation)" — after Discovery handoff has already concluded.

**Verdict: real wording bug.** "Discovery handoff" is genuinely ambiguous. Cam is the Discovery lead in Summon's phase model, so "discovery handoff" reads naturally as the Phase 1→2 boundary, which is before the spec exists. The intent is clearly that Cam reviews the spec *after authoring, before Tara* — i.e., a second touch from Cam at the Architecture→Implementation seam.

**Amendment required:** rewrite Lifecycle step 2 as "Coherence-reviewed by Cam after authoring and before Tara's verifiability gate (i.e., between Lifecycle steps 1 and Tara's red-phase entry). This is a second touch from Cam; the first was during Discovery." This removes the ambiguity entirely.

Amendment-grade. The intent is fine; the wording will confuse readers and could lead to Cam being skipped on the grounds that "Discovery handoff is over."

### E. Does "Accepted, broad rollout gated on W1.1 landing" break the Status taxonomy?

**Concern:** Standard ADR Status values are Proposed / Accepted / Deprecated / Superseded. ADR-0004's compound "Accepted, broad rollout gated on W1.1" is a custom status that doesn't fit the taxonomy.

**Verdict: this is a real but minor process issue, and probably the right call anyway.** The team's ADR taxonomy doesn't currently support "Accepted with conditional rollout," which is the state ADR-0004 actually wants to be in. The compound phrasing is the right description of reality; the taxonomy is what's wrong.

**Amendment recommended:** change § Status to "Proposed (Shadow-Pilot phase). Transitions to Accepted on (a) W1.3 shadow-pilot success criteria pass, AND (b) W1.1 Done Gate amendment lands. Until then, Tara's pre-condition backstop applies to any M+ item, but the carve-out is not enforced for general work."

This is a process-clean way to express the same intent, and it doesn't require extending the Status taxonomy.

Amendment-grade.

### F. Is "if a Wave 1 L item becomes available" a back-door to never doing it?

**Concern:** Challenge 1's partial address commits to L coverage *if one becomes available*. By inspection, Wave 1 contains no L item, so the "if" branch never fires.

**Verdict: yes, this is functionally equivalent to "we won't do it."** The fallback (post-mortem logs the gap; first L item under broad rollout becomes continuing-pilot) is OK in principle but has no defined consumer. Not a backdoor in bad faith, but a real limitation that needs the explicit "if the first L item reveals the boundary is wrong, here's what reopens" sentence (same as Finding 7 amendment). That's the only thing standing between "honest disclosure" and "back-door."

---

## Part 3 — Verdict

### Summary of status by finding

| Finding | Round 1 | Round 2 |
|---|---|---|
| 1 (M boundary) | Acceptable with caveat | PARTIALLY RESOLVED, residual risk needs one sentence |
| 2 (XS/S asymmetry) | Acceptable with caveat | RESOLVED |
| 3 (three-pillar) | Should-amend | RESOLVED |
| 4 (Pat same-author) | Should-amend | PARTIALLY RESOLVED, wording bug in Lifecycle step 2 |
| 5 (Archie soft gate) | Should-amend | RESOLVED |
| 6 (planner/generator/evaluator) | Must-change | RESOLVED |
| 7 (W2.2 pilot) | Must-change | RESOLVED |
| 8 (no enforcement hook) | Must-change | PARTIALLY RESOLVED, honor-system gap during pilot acknowledged |

### New attack surfaces

| Attack | Severity | Action |
|---|---|---|
| A. W1.3 absorbs ADR-C decisions | Real, controllable | Amendment: add Archie to pilot success criteria explicitly |
| B. Tara backstop assumes Tara invoked | Disclosed gap | Amendment: name the human/coordinator as honor-system enforcer during shadow-pilot |
| C. Citation chicken-and-egg | Not real (escape valve covers it) | Amendment: clarify that Proposed ADRs can be cited |
| D. Cam at "discovery handoff" wording | Real wording bug | Amendment: rewrite Lifecycle step 2 |
| E. Custom Status outside taxonomy | Real minor process issue | Amendment: rephrase as Proposed-with-rollout-conditions |
| F. "If L item available" back-door | Real but defensible | Amendment: define continuing-pilot trigger (same as Finding 7) |

### Net Recommendation

**ACCEPT WITH AMENDMENTS.**

The rework lands the three Must-Change items cleanly. The two Should-Amend items that resolved fully (Findings 3, 5) resolved exactly as proposed. The three remaining items (Findings 1, 4, 8) are partially resolved with disclosed residual risk that does not rise to structural defect. The new attack surfaces are all amendment-grade — wording bugs, honor-system gaps that disclosure has already addressed, missing trigger definitions for follow-up loops.

There is no new structural defect from the rework. The author/reviewer shape is now justified on standalone merits, the pilot is achievable under the umbrella, the enforcement hook is bound (Tara backstop + W1.1 dependency).

Recommended amendments before move to Accepted (six items, all small):

1. **Lifecycle step 2:** rewrite to clarify "Cam reviews after the spec is authored, before Tara's red phase — a second Cam touch, not the Phase 1→2 handoff."
2. **§ Status:** rephrase as "Proposed (Shadow-Pilot phase). Transitions to Accepted on W1.3 pilot success + W1.1 Done Gate landing."
3. **§ Status (or § Pilot Plan):** add one sentence naming the human/coordinator as honor-system enforcer of "Tara invoked on M+ items" during the pre-W1.1 window.
4. **§ Pilot Plan:** add a sixth pilot success criterion explicitly invoking Archie on cross-component Key Decisions in W1.3.
5. **§ Schema:** add one sentence noting that citations may reference Proposed ADRs (with a follow-up obligation if the ADR is amended at Acceptance).
6. **§ Consequences (Neutral):** add the continuing-pilot trigger sentence: "First L item under broad rollout treated as continuing-pilot; failure on that item reopens § Size Carve-Out."

None of these are structural. ADR-0004 is sound and acceptance-ready post-amendment without another full Wei round.
