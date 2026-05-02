---
agent-notes: { ctx: "Wei challenge of ADR-0004 feature-spec artifact", deps: [docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0002-tdd-workflow.md, docs/process/done-gate.md, docs/process/gotchas.md, docs/tracking/2026-05-02-adr0003-restructure-debate.md], state: complete, last: "wei@2026-05-02" }
---

# Debate: ADR-0004 Feature-Spec Artifact Between ADR and TDD

**ADR:** [docs/adrs/0004-feature-spec-artifact.md](../adrs/0004-feature-spec-artifact.md)
**Date:** 2026-05-02
**Participants:** Archie (author, in absentia) vs Wei (challenger)
**Note:** Wei is read-only by persona definition. Round 2 below is Wei's good-faith reconstruction of Archie's strongest defense, per the gate protocol's "anticipated rebuttal" pattern. Archie may rebut directly during the human-approval step; any concessions there should be folded back into ADR-0004 before Acceptance. This is the first follow-on under the now-Accepted ADR-0003 umbrella; Wei's prior round on the umbrella itself is in `2026-05-02-adr0003-restructure-debate.md` and is not repeated here.

---

## Round 1 — Wei's Challenges

### Challenge 1 — The M boundary is inherited, not derived (§ Size Carve-Out)

The size table sets M as the threshold where a spec becomes *required*. The justification given: "This is the size where Tara is already invoked as a standalone agent (ADR-0002), so adding spec authorship to the same handoff has low marginal cost."

That is a **co-location argument, not a fitness argument.** ADR-0002 picked M for Tara-as-standalone because of *test-authoring* economics — at M+, a separate test-author shifts the design lens. ADR-0004 silently re-uses that boundary because it's *administratively convenient*, not because there is independent evidence that M is the size where scope-and-decision provenance starts paying for itself.

The two boundaries can legitimately differ. It is plausible that the test-design boundary is M but the scope-provenance boundary is L (or vice versa). The ADR doesn't even consider this — it just inherits M and calls the inheritance a feature ("does not introduce a new size threshold to remember").

The cost of being wrong here is asymmetric: if M is too low, every M item gets a near-empty spec that paraphrases the test, and the "Plan-as-Bypass" failure mode (gotchas.md line 67) becomes the dominant outcome. The pilot tests one M item. One M item cannot tell you whether the boundary is right; it can only tell you whether *that item* benefited.

**Counter-proposal:** either (a) justify M from first principles independently of ADR-0002, or (b) commit to the pilot covering an M *and* an L item so the boundary itself is testable, not just the artifact at one point.

### Challenge 2 — XS-forbidden vs S-optional is asymmetric in a way the ADR doesn't justify (§ Size Carve-Out)

XS is **forbidden** to have a spec. S is **optional** with default off. Why the asymmetry?

The ADR's stated reasoning for XS-forbidden ("a spec here would paraphrase the test and degrade signal-to-noise") is a *quality* argument: specs at this size are bad. That reasoning applies just as well to S items in many cases. If the concern is signal-to-noise degradation from low-value specs, "default off, optional with author justification" is the *weaker* form of the same intervention — it leaves the door open for exactly the noise XS forbids.

The asymmetry only makes sense if the ADR believes (a) XS specs are *uniformly* bad, but (b) S specs have a long-enough tail of legitimately useful instances that an opt-in path is worth the abuse risk. That belief is not stated and not defended.

The opt-in path is also the most plausible **escape valve for the bypass attack the ADR itself worries about**: implementers don't even need to down-size to S to skip the spec at S — it's already opt-in. So the bypass risk really lives at the M boundary (down-size from M to S), where the ADR concedes the risk and assigns Grace as the mitigation. Fine — but then why the elaborate "S optional with explicit justification" carve-out at all? Either S is too small for a spec (forbid it like XS) or it isn't (require it like M). The middle ground is the worst of both.

**Counter-proposal:** collapse XS and S into a single "spec forbidden below M" rule, and let the size-classification debate happen at the sizing step (Grace), not at the spec step. Simpler boundary, fewer escape valves.

### Challenge 3 — The three-pillar distinction (Scope / Key Decisions / Task Breakdown) is semantic and unenforceable (§ Schema, § Considered and Rejected Alt A)

The ADR's strongest defensive claim is that Scope, Key Decisions, and Task Breakdown are *non-overlapping* with tests, ADRs, and acceptance criteria. The rejection of Alternative A leans on this entirely.

But the distinctions are **prose distinctions, not structural ones**:

- "Scope (in/out)" vs acceptance criteria — the ADR says one is "boundaries" and the other is "behavior." In practice an acceptance criterion ("user can export to PDF but not DOCX") *is* a boundary statement. Any review can rationalize the same content as either.
- "Key Decisions" vs ADRs — the ADR says one is "item-local" and the other is "cross-cutting." There is no test for which is which until after the fact. Many decisions are item-local *until* they are repeated, at which point they are cross-cutting; by then the spec has already absorbed them and the cross-cutting nature is invisible.
- "Task Breakdown" vs the test list — the ADR says one is "work order," the other is "behavior." But the Verification Plan section *also* lists "which tests Tara will author," so the spec already contains the test-list shape; Task Breakdown just adds an ordering on top.

The enforcement mechanism is "Tara returns the spec for sharpening" if the spec copies content. That depends entirely on Tara's vigilance, with no objective signal. A spec that *paraphrases* the AC in slightly different words — same semantics, different phrasing — is exactly the failure mode and exactly the thing Tara has the weakest leverage to reject.

**Counter-proposal:** require a mechanical check, not a vibe check. For example: each Scope bullet must cite which acceptance criterion it bounds, or each Key Decision must cite which ADR it sits below. Citation-or-reject is enforceable; "non-overlapping" is not.

### Challenge 4 — Pat-as-author creates a same-author drift hazard (§ Ownership)

Pat already owns acceptance criteria. ADR-0004 makes Pat the spec author. That means **the same agent owns the artifact that says "what must be true" (AC) and the artifact that says "what we will do and why" (spec).** The ADR frames this as natural ("Pat already owns AC and product context"). It is also the conflict-of-interest configuration.

The hazard: when Pat writes the spec, Pat will (consciously or not) shape Scope and Outcomes to be *consistent with the AC Pat already wrote*. If the AC was wrong or incomplete, the spec will inherit the same blind spot. The two artifacts will agree because they have the same source — not because they are independently correct. This is the well-known reviewer-author overlap failure: agreement does not equal validation when the validator and author share priors.

The ADR has this exact pattern *somewhere else* and has flagged it as bad: the existing rule that Tara writes tests, not Sato, because separating test authorship from implementation strengthens the feedback loop (ADR-0002 § Consequences). That rationale applies directly here. Pat-writes-AC + Pat-writes-spec is the same anti-pattern Pat-writes-spec + Pat-validates-spec would be.

The Tara verifiability check helps but doesn't fix this — Tara verifies that the *Verification Plan* lists adequate tests, not that the *Outcomes* and *Scope* are coherent with the AC's intent.

**Counter-proposal:** either (a) Pat writes AC and someone else (Cam? Archie for architectural items?) authors the spec, with Pat as approver only; or (b) explicitly add a "spec-vs-AC drift check" by a non-Pat agent (Wei or Cam) before Tara's verifiability gate. The ADR currently has neither.

### Challenge 5 — Archie's "Constraints + Key Decisions" review is a soft gate that re-creates the architecture-gate problem one level deeper (§ Ownership)

The ADR says Archie reviews the spec's Constraints and Key Decisions sections "to confirm nothing item-local has silently absorbed an architectural decision." This is doing a lot of work in a single sentence.

The Session Entry Protocol question 2 ("Does this work involve an architectural decision?") *already* exists as a gate, and the team already has a problem with it being silently bypassed (CLAUDE.md § Critical Rules; gotchas.md line 69 — "Wei must be invoked as a standalone agent"). ADR-0004 now adds a *second* place where the same question must be answered — except this time it's a soft "Archie reviews" with no defined trigger, no defined output, and no defined escalation if Archie disagrees with the spec author.

Concretely:
- What signals that Archie review is required? "If the spec touches an ADR's surface" — but that determination is itself a judgment Pat (the author) makes. Pat may not know.
- What does Archie do if a Key Decision *should* be an ADR? The ADR doesn't say. Does the spec stall? Does the work item halt? Is a new ADR opened? Does this trigger Wei?
- What if Pat and Archie disagree on whether a Key Decision is item-local? There is no debate protocol named.

This is exactly the "next bypass-able heavyweight artifact" pattern the ADR's Context section claims to be defending against. Soft gates without escalation paths get skipped under deadline pressure. We have direct evidence of this in our own gotchas (line 69, line 73).

**Counter-proposal:** make the trigger objective ("any Key Decision touching cross-component interfaces, persistence, security, or external dependencies must be reviewed by Archie") and define the escalation: if Archie deems a Key Decision architectural, the spec stalls and a new ADR is opened — this *halts* the work item until the ADR is Accepted. Anything weaker than that, and the spec layer just relocates the existing architecture-gate bypass problem.

### Challenge 6 — The "intentionally mirrors planner/generator/evaluator" line is the exact pre-commitment ADR-0003 forbade (§ Ownership)

ADR-0004 § Ownership ends with: *"This three-agent loop is intentional: it mirrors the planner/generator/evaluator shape ADR-C will formalize, without pre-empting that ADR's persona mapping."*

This is a contradiction in one sentence. ADR-0003's binding constraint on ADR-C is: *"MUST debate the persona-to-role mapping from first principles (no pre-commitment to Pat/Sato/Tara)."* The umbrella debate (Round 3 item 2) explicitly required striking the Pat/Sato/Tara mapping from the umbrella for exactly this reason.

ADR-0004 then turns around and locks in **Pat = planner, Tara = evaluator, Sato = generator** as its ownership model and says it "mirrors" the harness ADR-C is supposed to debate. Once ADR-0004 is Accepted with this ownership pattern in production, ADR-C cannot meaningfully debate the mapping from first principles — any other mapping would force ADR-0004 to be re-opened. The phrase "without pre-empting" does the opposite of what it says: it pre-empts and then disclaims the pre-emption.

Worse, Alternative D's rejection ("Sato authors the spec") leans on this same triad framing: *"Pat-authors / Tara-validates / Sato-implements is the planner/evaluator/generator separation in miniature."* So the ownership decision is *justified* by the very mapping ADR-C is supposed to debate. If ADR-C debates the mapping and lands on a different shape, Alternative D's rejection collapses retroactively.

**Counter-proposal:** delete the planner/generator/evaluator parenthetical from § Ownership. Justify Pat-authors / Tara-validates / Sato-implements *on its own merits* (Pat owns AC and product context; Tara owns verification; Sato owns implementation). If those merits are sufficient, the harness mapping is irrelevant. If they aren't sufficient, the parenthetical is doing load-bearing work it isn't allowed to do.

### Challenge 7 — The W2.2 pilot is structurally impossible under the umbrella's halt rule (§ Pilot Plan)

ADR-0003's Halt-Points section: *"Wave 2 may not begin until *all* Wave 1 ADRs are Accepted."*

ADR-0004 names W2.2 as the pilot candidate. W2.2 is in **Wave 2**. ADR-0004 is itself in **Wave 1**. By the umbrella's own halt rule, W2.2 cannot start until ADR-A, ADR-H, and ADR-C are all Accepted — at which point ADR-0004 is *already accepted and in force for all M+ items*, not piloting on one.

So the "pilot" is one of:

1. **Not a pilot at all** — it's an after-the-fact validation on the first work item that happens to land. By definition, the spec rule is already binding on every other M+ item in Wave 2. If W2.2 fails, the rollback per ADR-0003 § Rollback re-opens the umbrella and pauses every other ADR mid-flight.
2. **A halt-rule violation** — the team runs the pilot before Wave 2 officially begins, which contradicts the umbrella's binding constraint that wave boundaries are not crossed mid-flight (the "Intermediate-state rule").
3. **A wave-boundary fudge** — W2.2 is reclassified as a Wave 1 item to enable the pilot, which is exactly the kind of reclassification-to-evade-process pattern the umbrella's halt rule was designed to prevent.

None of these are good. The "pilot before broad rollout" promise (ADR-0003 § Rollout) is structurally unachievable for any Wave 1 ADR if the pilot has to come from a later wave.

**Counter-proposal:** the pilot must be a Wave 1 work item — meaning a work item from the *current sprint that is operating under the prior methodology*. The team applies the spec process *as a shadow exercise* on that item: the spec is written, reviewed, and post-mortem'd, but the existing process still gates the work. That preserves the halt rule and produces a real pilot signal before broad rollout. If no Wave 1 work item is suitable, ADR-0004 should not move to Accepted until one exists.

### Challenge 8 — "Required" status with no enforcement hook is just a strong recommendation (§ Lifecycle, § Consequences Neutral)

The ADR says specs are required for M/L/XL. The ADR also says the Done Gate "gains a new line item ('spec link present for M+ items'); implementation deferred to W1.1 acceptance work."

Translation: the requirement is asserted, but the enforcement mechanism is *deferred to a later work item that does not yet exist*. Between ADR-0004 acceptance and W1.1 landing, "required" is a norm with no gate — exactly the pattern that produces silent skipping (Solo-Coordinator, Quick-Test Bypass, Plan-as-Bypass — all named in gotchas.md).

The Lifecycle section says Tara "either confirms the listed tests are sufficient or returns the spec for sharpening — no green-light from Tara, no red phase." That is the de facto enforcement, but it is buried in § Ownership and not surfaced as a Done Gate item or a workflow rule. If Tara doesn't ask for the spec, the spec doesn't appear, and nothing in the official Done Gate stops the item from closing.

**Counter-proposal:** ADR-0004 should not move to Accepted *until the Done Gate amendment is itself written and accepted*, or it should bind a hard pre-condition into Tara's red-phase invocation pattern (Tara refuses to author tests for an M+ item with no spec link). Either is acceptable; the current "deferred to W1.1" is process-debt at the moment of acceptance.

---

## Round 2 — Anticipated Archie Rebuttal

(Wei's good-faith reconstruction. Archie should respond directly when this is escalated.)

### Re: Challenge 1 (M boundary inherited)
Archie's strongest defense: aligning the spec boundary with the test-authorship boundary is itself a fitness argument because handoff cost is real — every separate threshold the team has to remember degrades workflow integrity. Two boundaries doubles the misclassification surface.
**Wei's counter-counter:** that's an argument for *administrative simplicity*, not for *correctness*. Two boundaries are worth the cost if they're the right two boundaries. Concession Archie should make: commit the pilot to cover both an M and an L item (Wei's counter-proposal a) — that's a one-line change to § Pilot Plan and converts the boundary from asserted to tested.

### Re: Challenge 2 (XS-forbidden vs S-optional asymmetry)
Archie's strongest defense: S is the genuinely ambiguous middle case where some items legitimately benefit (cross-component refactors that happen to fit in one component) and most don't. A blanket forbid would lose the legitimate cases; a blanket require would tax the rest. Default-off-with-justification is the correct compromise for an ambiguous category.
**Wei's counter-counter:** then say *that* in the rationale, and define what "explicit justification" means — a one-liner in the work item, a Pat + Tara sign-off, what? The current "the author explicitly justifies it" has no enforcement, no audit trail, and no acceptance test. Without those, S-optional is a private decision that produces no signal for the post-mortem.

### Re: Challenge 3 (three-pillar distinction is semantic)
Archie's strongest defense: structural distinctions exist (citations to other artifacts, agent ownership of each section) and the prose distinctions are guidelines for the author, not enforcement contracts. The enforcement is the Tara return-for-sharpening loop plus the post-mortem.
**Wei's counter-counter:** Tara's return loop is exactly the soft enforcement pattern that fails under deadline pressure. Adopt the citation requirement — every Scope bullet cites an AC, every Key Decision cites an ADR or declares "no ADR applies and here's why." That converts the prose distinction into a mechanical check that survives a tired Tara and a hurried Pat.

### Re: Challenge 4 (Pat same-author drift)
Archie's strongest defense: AC and spec serve different audiences (stakeholder-visible vs implementation-author-visible) and live in different surfaces (tracker vs repo), so the same author writing both is actually *coherence*, not drift — the artifacts intentionally express the same intent in two registers. The drift hazard would be if AC and spec were authored independently and *had* to be reconciled.
**Wei's partial concession:** the audience distinction is real. But the drift hazard isn't just "the two artifacts say different things" — it's "the two artifacts share the same blind spot because they share an author." Coherence between coupled artifacts is not validation. Minimum amendment: add a non-Pat reviewer for spec-vs-AC coherence (Cam during discovery handoff is the natural fit; Cam already pressure-tests intent). One review pass, no new agent.

### Re: Challenge 5 (Archie soft gate)
Archie's strongest defense: defining objective triggers ("touches persistence, security, etc.") risks under-coverage in the case where a Key Decision is architectural in a non-obvious way; "Archie reviews when the spec touches an ADR's surface" is intentionally a judgment call because architectural smell is a judgment call.
**Wei's counter-counter:** the trigger doesn't have to be exhaustive to be useful. A *minimum* objective trigger (the categories named above) plus the existing judgment trigger is strictly better than judgment alone. And the escalation path is non-negotiable — without "if Archie disagrees, the spec stalls and an ADR opens," the gate has no teeth. Adding the escalation paragraph is a 3-sentence change.

### Re: Challenge 6 (planner/generator/evaluator pre-commitment)
Archie's strongest defense: the parenthetical is descriptive ("this happens to mirror"), not prescriptive ("this is chosen to mirror"). The ownership decision stands on Pat-owns-AC, Tara-owns-verification, Sato-owns-implementation, all of which are independently true today.
**Wei's concession (partial):** if Archie is willing to *delete* the parenthetical entirely and re-justify Alternative D's rejection on the standalone merits ("Sato authoring the spec collapses authorship and implementation, weakening the spec-as-contract role"), then this challenge is resolved. The fix is a deletion, not an addition.

### Re: Challenge 7 (W2.2 pilot impossibility)
Archie's strongest defense: the pilot can be run as a *shadow* on a Wave 1 item (Wei's own counter-proposal), or W2.2 can be re-classified as a Wave 1 item if the team agrees its content is doctrinal, not org-model. Either resolves the halt-rule conflict.
**Wei's response:** good — the shadow-on-Wave-1 path is the cleanest. The ADR should name this explicitly. Reclassifying W2.2 to Wave 1 just to enable the pilot is the wave-boundary fudge I warned about and should not be how this is resolved.

### Re: Challenge 8 (no enforcement hook)
Archie's strongest defense: the Done Gate amendment is intentionally a separate work item because amending the gate touches another doc and another approval surface; bundling it into ADR-0004 conflates ADR scope with doc-update scope.
**Wei's counter-counter:** then bind the dependency. ADR-0004 § Status should say "Accepted, with broad rollout gated on W1.1 (Done Gate amendment) landing." That keeps scope clean *and* prevents a window of unenforced "required." Until W1.1 lands, the ADR is Accepted-but-not-broadly-applied, which matches the pilot-only state anyway.

---

## Round 3 — Wei's Verdict

### Must change before Acceptance (3 items)

1. **Delete the planner/generator/evaluator parenthetical from § Ownership and re-justify Alternative D on standalone grounds.** ADR-0003's binding constraint on ADR-C is being violated by ADR-A pre-committing to the mapping. (Challenge 6.)
2. **Replace the W2.2 pilot with a shadow-pilot on a Wave 1 work item.** The current pilot plan is structurally impossible under the umbrella's halt rule. Name the shadow-pilot work item and the success criteria explicitly. (Challenge 7.)
3. **Bind the enforcement hook to the ADR's effective scope.** Either include the Done Gate amendment in this ADR's scope, or mark ADR-0004 as "Accepted, broad rollout gated on W1.1 landing." A "required" rule with no gate at acceptance time is process-debt at birth. (Challenge 8.)

### Should be amended before Acceptance (3 items)

4. **Add a citation requirement to the schema.** Every Scope bullet cites an AC; every Key Decision cites an ADR or declares "no ADR applies because…". Converts the three-pillar distinction from prose to mechanical check. (Challenge 3.)
5. **Add a non-Pat coherence reviewer for spec-vs-AC drift.** Cam at the discovery handoff is the natural fit. Single review pass, no new agent. (Challenge 4.)
6. **Define the Archie escalation path.** "If Archie deems a Key Decision architectural, the spec stalls and a new ADR opens; the work item halts until the ADR is Accepted." Plus a minimum objective trigger list (cross-component interfaces, persistence, security, external dependencies). Without escalation, the soft gate is decorative. (Challenge 5.)

### Acceptable as-is with caveats (2 items)

7. **The M boundary is inherited but not fatally so**, *if* the pilot is amended to cover an M and an L item rather than just an M. (Challenge 1.) Becomes blocking if the pilot stays at one item.
8. **The XS/S asymmetry is defensible** if "explicit justification" for an opt-in S spec is defined as a one-liner in the work item with Pat + Tara sign-off recorded. Without that definition, it's a private decision producing no audit trail. (Challenge 2.)

### Net Recommendation

**REWORK.**

This is stronger than ACCEPT WITH AMENDMENTS for two specific reasons:

- Challenge 6 (planner/generator/evaluator pre-commitment) is a direct violation of an Accepted umbrella's binding constraint. The umbrella debate's Round 3 explicitly required striking exactly this mapping; ADR-0004 reintroduces it under a "without pre-empting" disclaimer. That's not an amendment-level fix — that's a "the ADR cannot be Accepted in this form" issue.
- Challenge 7 (W2.2 pilot) means the ADR's own rollout plan does not work as written. Pilot-before-broad-rollout was a binding umbrella constraint (ADR-0003 § Rollout). The proposed pilot violates the halt rule. This is a structural defect, not a parameter to tune.

The other six challenges are amendment-grade — fix the schema, fix the ownership, fix the enforcement, tune the size carve-out — and the ADR is fundamentally pointed in the right direction. Specs as the artifact between ADR and TDD is sound. The execution as written is not.

Recommend: Archie revises ADR-0004 to address Must-Change items 1–3 in a new draft, then re-runs the Wei challenge on items 4–6. If the rework lands cleanly, the verdict on the next round can credibly be ACCEPT WITH AMENDMENTS.

If the human approves moving to Accepted without addressing items 1–3, that should be logged in § Consequences as acknowledged risk: (a) ADR-A pre-committed to a persona mapping that ADR-C is supposed to debate from first principles, and (b) the pilot promise of ADR-0003 was not satisfied for ADR-A.
