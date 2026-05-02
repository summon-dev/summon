---
agent-notes: { ctx: "Wei challenge of ADR-0006 harness contract", deps: [docs/adrs/0006-harness-contract.md, docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0005-single-threaded-default.md, docs/tracking/2026-05-02-adr0003-restructure-debate.md, docs/tracking/2026-05-02-adr0004-feature-spec-debate-round2.md, docs/sprints/sprint-1-plan.md], state: complete, last: "wei@2026-05-02" }
---

# Debate: ADR-0006 Harness Contract — Progress-Note Schema and Persona-Role Mapping

**ADR:** [docs/adrs/0006-harness-contract.md](../adrs/0006-harness-contract.md)
**Date:** 2026-05-02
**Participants:** Archie (author, in absentia) vs Wei (challenger)
**Note:** Wei is read-only by persona definition. Round 2 below is Wei's good-faith reconstruction of Archie's strongest defense, per the gate protocol's "anticipated rebuttal" pattern. Archie may rebut directly during the human-approval step; concessions there should be folded back into ADR-0006 before Acceptance.

**Prior Wei rounds in scope:** Umbrella debate (ADR-0003) Round 1 Challenge 2 — "Pat is not the planner; Archie is." Round 2 (ADR-0004) lessons — no custom statuses, no pre-commitment dressed as "without pre-empting," no soft gates without escalation, no hand-waved enforcement.

---

## Round 1 — Wei's Challenges

### Challenge 1 — Plan-as-artifact is a clever dodge of "Archie is the planner," not an answer to it

The ADR's central move (§ Persona-Role Mapping) is that "plan = the feature-spec artifact." This is well-constructed: Pat-as-planner *is* a misfit, the ADR catches it, and binding planner to an artifact does dissolve the cargo-cult one-to-one mapping.

But the move is not what it claims to be. ADR-0003's binding constraint says "MUST debate the persona-to-role mapping from first principles (no pre-commitment to Pat/Sato/Tara)." Plan-as-artifact answers that constraint *for the planner role only* by binding planner to a non-persona. Generator and evaluator are still bound to Sato and Tara.

My Round 1 attack on the umbrella was: "Pat is a *product* persona, not a planner; the actual planner is Archie." The ADR rejects "Archie = planner" with the argument "Archie is a *strategic* planner, not a *loop-level* planner." This is technically correct but instrumentally evasive. **Test: who would notice if a spec was missing an architectural decision?** Pat won't catch it. Cam won't catch it. Tara won't catch it until red phase. **Archie will catch it.**

If "plan = the spec" and Archie is the agent who guarantees the spec is a *good* plan (escalation duty per ADR-0004), then Archie has the planner instinct even under the ADR's own definition. The plan-quality function is *distributed* — Pat decomposes (authorship), Cam coherence-checks, Archie architecture-gates, Tara verifies. Alternative E ("split planner") rejection on "a triad whose 'planner' is four agents is not a triad" is unconvincing — the ADR has already abandoned the structural triad; it cannot reinstate it as a rejection criterion.

Plan-as-artifact is fine. But the ADR should *also* name Archie as the planner-quality gate, and § Persona-Role Mapping should enumerate the distributed plan-quality function. Otherwise plan-quality is un-owned and artifacts don't get retros.

### Challenge 2 — Plan-as-artifact has below-spec, across-session, and mid-session holes

The ADR makes "the spec is the planner" load-bearing. But specs only exist for M+ items.

- **XS items:** spec forbidden. Planner is what?
- **S items, default off:** no spec by default. Same question.
- **Across work items:** the harness's purpose is cross-session continuity. The spec is *per-work-item*. What carries plan-state from one work item to the next? The implicit answer is the progress note's Next Step field, which contradicts "plan = the spec."
- **Mid-session pivot:** if a discovery during green phase changes the plan, who decides to amend the spec? ADR-0004 § Lifecycle step 4 binds amendment to Pat re-authoring, but the implementer (Sato) is the one deciding whether the discovery rises to amendment. ADR-0006 doesn't say so.

The ADR should either restrict the planner mapping ("the spec, when a spec exists; otherwise the in-flight progress note's Next Step, with the resuming session as planner-of-last-resort") or acknowledge the harness is silent on XS/S items.

### Challenge 3 — Schema field coherence: drift between Open Questions, Blockers, Learnings

Five sections: State, Next Step, Learnings, Open Questions, Blockers. The ADR has citation-as-provenance built into each field rather than a separate Provenance field — defensible.

**Open Questions vs Blockers drift.** The distinction: "an open question may be answerable by the team; a blocker requires explicit human input." Test: Pat-in-proxy answers via conservative defaults — was it a blocker (no human) or open question (Pat could answer)? The schema only checks for Blocker addressee presence, not addressee fitness. Drift is structural.

**Learnings vs Open Questions.** A discovered fact that turns out to need verification is *both* a Learning and an Open Question. Schema doesn't say which wins.

**The /handoff "depends on" gate.** The command refuses to write if Next Step depends on an unresolved Blocker. But "depends on" is undefined. Is it syntactic (Next Step's cited paths string-match a Blocker's cited paths)? Or semantic (the command reasons about dependency)? If semantic, the gate is judgment-based and softer than it looks.

**Concrete test:** Blocker says "decision pending on `docs/methodology/personas.md` schema." Next Step says "implement `.claude/agents/sato.md` per the personas schema." Cited paths don't string-match; the dependency is real. The mechanical check passes; the actual dependency exists.

**Recommended fix:** define "depends on" precisely — string-prefix match on cited paths, OR explicit Blocker-ID list referenced from Next Step. Punting the definition to W1.3 implementation is hand-waved enforcement.

### Challenge 4 — The dual-purpose pilot is muddled and Archie pre-flagged it

§ Pilot Plan dual-purposes ADR-0006's pilot with ADR-0004's W1.3 shadow-pilot. Archie pre-empts (§ Negative bullet 5): "If both ADRs' pilots fail simultaneously, attribution to specific failures requires care — the post-mortem must score each ADR's criteria independently or the rollback path is muddied."

Not satisfied. The post-mortem template "is W1.3 implementation, not decided here, but is bound by this contract." That is exactly the hand-waved-enforcement pattern from ADR-0004 Round 2.

- **The post-mortem template doesn't exist yet.** If authored *during* W1.3, it is biased by what already happened.
- **Failures often have shared root causes.** If W1.3's spec is bad *because* the progress-note schema didn't surface a Blocker that should have informed the spec, the failure is attributable to ADR-0006 *flowing through* ADR-0004's failure mode.

**Two fixes, either acceptable:**
1. Author the post-mortem template before W1.3 begins.
2. Run a separate non-shadow pilot for ADR-0006 on a different work item.

Currently the ADR does neither.

### Challenge 5 — `handoff.md` hard cutover has unaddressed transition risks

§ Relationship to handoff.md describes read-only retention for one sprint then deletion by Grace.

**"One sprint" is undefined when we are mid-Wave-1.** Sprint 1 has three waves; the next sprint boundary is after Wave 3. So `handoff.md` is preserved for what could be many weeks. During that window, a session that reads the old file (because of stale tooling, or because the resuming agent reads `.claude/` and finds the old file first) silently uses the wrong artifact. The ADR's response: "likely a redirect line during the retention window — but the contract is not finalized here." That is hand-waved enforcement.

**"Next sprint boundary" vs "W1.3 close."** Line 51 contradicts itself on which event triggers deletion. Pick one.

**Proxy Decisions migration.** Existing `## Proxy Decisions` template (question, decision, rationale, reversibility) doesn't map cleanly onto Blockers (decision required + verdict). Migration is presented as straightforward; it isn't. Either the schema absorbs `rationale` and `reversibility`, or the migration is lossy — the ADR should say which.

### Challenge 6 — "Five sections only, no more, no fewer" without provenance schema is rigid

The schema is fixed at five sections. But:

- **Session date.** Lifecycle says Learnings carry forward "with their original session date." The schema has no field for date. This is a contradiction.
- **Author identity.** No field for who authored the progress note.
- **Prior-note ancestry.** No field for the chain of progress notes.

The "no more, no fewer" rigidity is an ADR-0004-style anti-pattern — over-constrained schema that the implementation will silently violate by stuffing metadata into State.

**Fix:** add a session-date field to Schema, OR strike the Lifecycle date requirement. Currently contradictory.

### Challenge 7 — Wave-gate consistency: does ADR-0006 require Wave 2 work to be operable?

Checked. ADR-0006 does not require Wave 2 work for its core. It explicitly carves out ADR-D and ADR-G. **Acceptable.** Soft concern: pilot success criterion 2 ("zero `awaiting-human` blockers that the schema failed to surface") presumes the schema's binding is stable, but ADR-D could reshape proxy-mode behavior. The ADR notes this in § Residual Risks ("the binding is loose, but not zero"). Acceptable as future-coupling acknowledgement.

### Challenge 8 — Standard Wei pre-empt audit

- **Custom statuses.** § Status reads "Proposed 2026-05-02 ... Transition to Accepted requires (a) Wei round complete, (b) human approval, (c) shadow-pilot evidence." Multi-condition Accept transition. ADR-0004 Round 2 caught this exact shape; fix is "Proposed (Shadow-Pilot phase)" pattern. Cosmetic amendment.
- **Pre-commitment.** § Persona-Role Mapping binds Sato (generator), Tara (evaluator), coordinator-or-Cam (authoring), Pat (proxy resolution), Grace (sprint-boundary retirement). If ADR-D demotes any of these, the harness mapping breaks. § Residual Risks acknowledges this loosely; should enumerate the personas explicitly.
- **Soft gates.** /handoff refusal conditions are concrete with escalation. Proxy-mode escalation has explicit no-bypass path. Good.
- **Hand-waved enforcement.** /handoff "depends on" (Challenge 3), post-mortem template (Challenge 4), redirect mechanism (Challenge 5). Three instances. Same lesson, three times.
- **Operational consistency.** Honors ADR-0003 single-writer and ADR-0005 single-thread. Clean.

---

## Round 2 — Anticipated Archie Rebuttal

### Re: Challenge 1 (plan-as-artifact dodges Archie-as-planner)

Archie's strongest defense: the loop-level vs strategic-level distinction is the actual structural answer. Anthropic's planner is a *control-loop* role; Archie operates at a longer timescale. Archie's escalation duty is a *gate* on the plan, not the plan itself — which is an *evaluator* function on the architectural axis, not a planner function.

**Wei's counter-counter:** The defense concedes the underlying point: plan-quality is distributed across Pat (decompose), Cam (coherence), Archie (architecture-gate), Tara (verifiability). The ADR should say so explicitly — "plan-as-artifact, with the plan-quality function distributed across Pat/Cam/Archie/Tara at authorship and review time." Not a structural change; clarifying language.

### Re: Challenge 2 (below-spec / cross-session / mid-session holes)

Archie's defense: the harness model is operative on M+ items. For XS/S, "no spec applies" escape valve is sufficient. Mid-session pivots are handled by ADR-0004 Lifecycle step 4 (Pat re-authors).

**Wei's counter-counter:** acceptable on XS/S, but the mid-session pivot answer is not in ADR-0006. Add one sentence: "When a discovery during implementation requires a plan amendment, Sato escalates to Pat per ADR-0004 § Lifecycle step 4; the progress-note Next Step is updated only after the spec is amended."

### Re: Challenge 3 (Schema field coherence)

Archie's defense: Open/Blocker drift is real because the underlying reality isn't clean — the schema's value is forcing a decision. On "depends on," Archie defends that W1.3 implementation will define the check.

**Wei's counter-counter:** "Implementation will define the check" is the hand-waved-enforcement pattern. ADR is the binding contract. Pick (i) string-prefix match or (ii) explicit Blocker-ID list. Punting is not allowed.

On Open/Blocker drift, defense conceded — add to § Residual Risks: "the Open-Question/Blocker boundary is judgment-loaded; recurring mis-classification reopens the schema."

On Learnings vs Open Questions: add one sentence — "A Learning may reference an Open Question by its addressee; the same fact is not duplicated, but the link is recorded."

### Re: Challenge 4 (dual-purpose pilot)

Archie's defense: pre-commit templates have their own bias.

**Wei's counter-counter:** acceptable, but the alternative I proposed (separate pilot) sidesteps the bias. Choose one of: (1) author template before W1.3, (2) separate pilot, (3) acknowledge dual-purpose is single-signal in failure case and bind "if attribution ambiguous, both ADRs reopen jointly." Currently does (3) implicitly without binding.

### Re: Challenge 5 (handoff.md hard cutover)

Archie's defense: redirect-line is implementation detail, deferred to W1.3.

**Wei's counter-counter:** disagree. "Redirect line vs deletion vs parallel run" is a *contract choice*. Pick one: redirect-line, immediate cutover, or parallel-run with reconciliation rules. Resolve "next sprint boundary" vs "W1.3 close" contradiction.

### Re: Challenge 6 (rigid five-section schema)

Archie's defense: missing fields fit inside existing sections. Rigidity is intentional.

**Wei's partial concession:** the rigidity argument is fair. But the explicit "session date" requirement in Lifecycle contradicts "no field for date" in Schema. Either add a session-date field (cleaner) or strike the Lifecycle requirement. Punting is not allowed.

### Re: Challenge 7 (wave-gate consistency)

Confirmed. No counter.

### Re: Challenge 8 (Wei pre-empt audit)

Most amendments already captured in C3/C4/C5. One additional: align § Status phrasing with ADR-0004's "Proposed (Shadow-Pilot phase)" pattern. Purely cosmetic.

---

## Round 3 — Wei's Verdict

### Must change before Acceptance (4 items)

1. **Define "depends on" in /handoff gate** — pick string-prefix match or explicit Blocker-ID list. Punting to W1.3 implementation is hand-waved enforcement. (Challenge 3.)
2. **Resolve dual-purpose pilot attribution** — pick (a) author post-mortem template before W1.3, (b) separate non-shadow pilot, or (c) explicit "if attribution ambiguous, both ADRs reopen jointly." (Challenge 4.)
3. **Bind handoff.md retirement mechanism** — pick redirect-line, immediate-cutover, or parallel-run. Resolve "next sprint boundary" vs "W1.3 close" contradiction. (Challenge 5.)
4. **Name Archie's planner-quality role explicitly** — rewrite line 43 to enumerate the distributed plan-quality function across Pat/Cam/Archie/Tara. (Challenge 1.)

### Should-amend (4 items)

5. **Add session-date field to Schema** (or strike Lifecycle date requirement). (Challenge 6.)
6. **Cover below-spec items in planner mapping** — one sentence: "When no spec applies, the in-flight progress note's Next Step is the planner; the resuming session is planner-of-last-resort." (Challenge 2.)
7. **Cover mid-session pivots in planner mapping** — one sentence on Sato escalating to Pat per ADR-0004. (Challenge 2.)
8. **Bind proxy-decisions migration concretely** — state whether `rationale` and `reversibility` are absorbed, dropped, or recorded elsewhere. (Challenge 5.)

### Conceded after rebuttal (3 items)

9. **Open Questions / Blockers drift** is real but acceptable. Add one sentence to § Residual Risks. (Challenge 3.)
10. **Wave-gate consistency** is honored. No change. (Challenge 7.)
11. **Status phrasing** — cosmetic alignment with ADR-0004's "Proposed (Shadow-Pilot phase)" pattern. (Challenge 8.)

### Acceptable disclosures (1 item)

12. **Persona-binding loose-coupling** — § Residual Risks should enumerate personas this ADR binds (Sato, Tara, Pat, Grace, Cam, coordinator) and note ADR-D's reshaping must check this list. (Challenge 8.)

### Net Recommendation

**ACCEPT WITH AMENDMENTS.**

The ADR is structurally sound. Plan-as-artifact survives the cargo-cult attack and satisfies ADR-0003's first-principles constraint. Schema mirrors ADR-0004's citation-as-mechanical-check pattern; /handoff refusal conditions are right shape (modulo "depends on" definition).

Four amendments are non-negotiable: define "depends on," resolve dual-purpose-pilot attribution, bind handoff.md retirement, name Archie's planner-quality function. Without these, the ADR has the same hand-waved-enforcement shape ADR-0004 Round 2 caught.

Four should-amend items are smaller — schema/Lifecycle contradiction, two coverage holes, proxy-decisions concreteness.

If the human approves moving to Accepted without amendments 1–4, that's an acknowledged risk and Wei wants it logged in § Consequences as such. Plan-as-artifact survives. The ADR survives. Amendments are tightening, not restructuring.
