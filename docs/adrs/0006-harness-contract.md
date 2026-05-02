---
agent-notes: { ctx: "explicit harness contract: progress-note schema and persona-to-role mapping", deps: [docs/adrs/0003-research-driven-restructure-2026.md, docs/adrs/0004-feature-spec-artifact.md, docs/adrs/0005-single-threaded-default.md, docs/methodology/personas.md, docs/methodology/phases.md, docs/process/gotchas.md, .claude/commands/handoff.md, docs/sprints/sprint-1-plan.md, docs/tracking/2026-05-02-adr0006-harness-debate.md, docs/tracking/2026-05-02-w1.3-pilot-postmortem.md], state: accepted-conditional, last: "claude@2026-05-02" }
---

# ADR-0006: Harness Contract — Progress-Note Schema and Persona-Role Mapping

## Status

**Accepted (Conditional)** 2026-05-02, per [W1.3 pilot post-mortem](../tracking/2026-05-02-w1.3-pilot-postmortem.md). Both Accept transition conditions are satisfied: (a) human approval of the persona-role mapping was given originally and re-affirmed by the post-rollout override (Rework Notes amendment 13); (b) the W1.3 pilot scored three of five success criteria as unconditional PASS, one as PASS-on-reachability-demonstration, and one (criterion 4: resume <5min) as DEFERRED to the first true `/resume` (post-mortem follow-up F1). The schema is binding for general use as of this transition. **Reopen condition:** if F1 fails (resume takes >5min) or follow-up F4 surfaces a real op-consequence-1 violation in production, this ADR reopens per § 6 failure handling.

*Prior status:* Proposed (Shadow-Pilot phase), 2026-05-02. Wei challenge complete per `docs/sprints/sprint-1-plan.md` W1.3 ([round 1 debate](../tracking/2026-05-02-adr0006-harness-debate.md), verdict ACCEPT WITH AMENDMENTS); twelve amendments folded inline.

## Context

ADR-0003 § Decision item 4 commits Summon to making the harness explicit: cross-session continuity moves from prose handoff to a structured progress-note schema, and the umbrella commits to the *existence* of a planner/generator/evaluator triad as the harness shape. ADR-0003 § Follow-on table binds this ADR to two specific tasks: **(a)** debate the persona-to-role mapping from first principles with no pre-commitment to Pat/Sato/Tara, and **(b)** justify why a vendor-published triad shape is the right fit for Summon's persona shape. The umbrella explicitly logs cargo-cult risk on this exact question (§ Negative consequences, line 92): "the harness shape is borrowed from Anthropic's published triad… ADR-C is constrained to debate the mapping from first principles."

ADR-0004 (feature-spec artifact) was reworked to remove a parenthetical pre-commitment of Pat/Sato/Tara to planner/generator/evaluator; its ownership decision now stands on standalone merits and does not depend on this ADR's outcome. ADR-0005 (single-threaded default) constrains the harness to operate inside the binding rule "at most one Sato invocation writing inside a given partition at a given time." This ADR must not contradict that rule.

This ADR decides six things and only those things: (1) the progress-note schema; (2) the persona-to-role mapping; (3) the relationship between the progress-note and `handoff.md`; (4) the `/handoff` command's contract; (5) the progress-note lifecycle; (6) how this ADR is piloted. It does not decide ADR-D (agents vs skills), ADR-E (single-writer hierarchy), or ADR-G (slim personas).

## Decision

### 1. Progress-Note Schema

The cross-session progress note contains a fixed header followed by exactly five sections; the fifth ("Blockers") is the binding addition over the umbrella's four-field candidate ("state, next step, learnings, open questions") — the four-field draft did not have a place for *blocking decisions awaiting the human*, which is the failure mode the schema must prevent.

**Header (mandatory).** A YAML-style header at the top of the file, separate from the body sections:

```
session-date: YYYY-MM-DD
author: <coordinator | cam | <agent-name-in-proxy-mode>>
prior-note-commit: <git-commit-hash-of-prior-progress-note, or "none" for first session>
```

The header carries session metadata that does not fit any body section. Adding the header explicitly resolves the Lifecycle "Learnings carry forward with their original session date" requirement, which has no body-section home.

**Body sections (exactly five, no more, no fewer):**

| Section | Content | Distinct from |
|---|---|---|
| **State** | What is true *right now* in the workspace: branch, last commit, working-tree status, which work item is in flight, which phase, which wave. **Each state claim MUST cite the artifact it was read from** (commit hash, file path, board item ID), or the line is non-conformant. This converts state-as-narration into state-as-citation. | `git status` raw output (state is *interpreted*, not dumped). Sprint plan (sprint plan is *intent*, state is *now*). |
| **Next Step** | The single next action the resuming session takes, expressed as one sentence. **MUST cite the work-item ID and the file path the action operates on.** No "next steps" plural — multiple next actions are a sign the session ended in an undecidable state, which is itself a Blocker. **MUST include a `gates:` list naming any Blocker IDs that gate this action.** An empty `gates: []` is permitted and means the Next Step is unblocked. The `/handoff` gate (see § /handoff Command Contract) operates on this list, not on path-string heuristics. | Sprint plan task list (plan is the *menu*, next step is the *first dish*). |
| **Learnings** | Project-specific operational knowledge discovered this session that would save time in a future session. **Each learning MUST be either** (a) promoted to its destination — a specific gotcha, ADR amendment, or `code-map.md` entry — with a citation, **OR** (b) flagged as `pending-promotion: <destination>` with a one-sentence rationale for why it is not yet promoted. A learning that is neither promoted nor flagged-with-destination is non-conformant. **A Learning MAY reference an Open Question by its addressee** (e.g., "see OQ for human") when the same fact is both a finding and an unanswered question; the same fact is not duplicated, only linked. | Agent-notes (per-file). Gotchas (already-promoted). |
| **Open Questions** | Questions that need answering before progress can resume. Each MUST cite *who* must answer (human / Pat-in-proxy / a specific agent) and *why* it blocks. A question with no addressee is non-conformant. | Sprint plan deferrals (deferral is decided; an open question is *undecided*). |
| **Blockers** | Decisions awaiting the human (or Pat in proxy mode) that prevent the Next Step from executing. **A blocker is structurally distinct from an open question:** an open question may be answerable by the team; a blocker requires explicit human input. **Each Blocker MUST have a stable ID** (`B1`, `B2`, … in order of appearance, never reused across sessions for unresolved blockers) and MUST cite the decision required and the proxy authority's verdict if Pat answered, or `awaiting-human` if not. Blocker IDs are the binding mechanism for the `/handoff` refusal gate (see § /handoff Command Contract). | Open Questions (open questions don't gate Next Step; blockers do). Proxy Decisions (proxy decisions are *recorded*; blockers are *unanswered*). |

The citation requirements convert each section from prose-vibe-check into mechanical inspection, mirroring ADR-0004's Schema citation pattern. A progress note that fails any citation rule is rejected by the resuming session before any code is touched.

### 2. Persona-Role Mapping

**Summon adopts the *functional separation* of plan / generate / evaluate but rejects the *structural triad* of three persona-agents.** The decision in one sentence: **plan = the feature-spec artifact (multi-author, per ADR-0004); generate = Sato; evaluate = Tara.** Full debate in § Persona-Role Mapping Debate. The cargo-cult risk identified by ADR-0003 is mitigated by *not* mapping a Summon persona one-to-one onto an Anthropic role; instead, the role that most resembled cargo-culting (planner) is bound to an artifact Summon already defined for standalone reasons.

This mapping has five operational consequences for the harness:

1. **The progress note's Next Step section names the spec it is operating against** (or "no spec applies" with the same one-sentence rationale rule ADR-0004's Key Decisions use). Resuming sessions read the spec, not just the progress note.

2. **The harness "evaluator" role at session-resume time is Tara's verifiability gate from ADR-0004**, applied to whatever the resuming session is about to write. No new agent is introduced.

3. **The harness "planner" function is distributed across multiple agents at the spec's authorship and review time.** The plan-quality function is *not* un-owned — it is owned jointly: **Pat** decomposes (spec authorship), **Cam** coherence-checks (spec-vs-AC drift, ADR-0004 § Lifecycle step 2), **Archie** architecture-gates (objective triggers in ADR-0004 § Ownership; Archie is the agent whose absence would let architecturally-flawed plans through, and whose escalation halts the work item if a Key Decision should have been an ADR), and **Tara** verifies (Verification Plan check before red phase). The artifact (the spec) carries the planner *title*; the function (plan quality) is owned by the four-agent review chain. The functional separation Anthropic's harness paper relies on is preserved by this distribution, not by a single named planner.

4. **For below-spec items (XS, and S without opt-in), the planner is the in-flight progress note's Next Step field, with the resuming session as planner-of-last-resort.** The harness model is operative on M+ items where cross-session continuity is a real risk; for XS/S items, the Next Step's "no spec applies" rationale stands in for the spec, and the resuming session decides the immediate next action from State + Next Step alone.

5. **For mid-session plan amendments, Sato escalates to Pat per ADR-0004 § Lifecycle step 4; the progress-note Next Step is updated only after the spec is amended.** A discovery during green phase that requires changing the plan does not silently rewrite Next Step — it triggers spec amendment first, and the progress note's next write reflects the amended spec. This binds the cross-ADR composition explicitly so the planner role is not silently captured by the implementer.

### 3. Relationship to `handoff.md`

The structured progress note **replaces** `.claude/handoff.md` as the canonical cross-session artifact. The retirement is a **redirect-line cutover at W1.3 close** (single triggering event — not "next sprint boundary," which contradicted itself with "W1.3 close" in an earlier draft). Three concrete steps:

1. **W1.3 implementation lands the new schema** at `.claude/progress-note.md`.
2. **The `/handoff` command writes to the new location** and stops writing to `.claude/handoff.md`.
3. **The legacy `.claude/handoff.md` is overwritten with a single-line redirect at W1.3 close**, replacing all prior content. The redirect line is exactly:

   ```
   ## REDIRECTED → .claude/progress-note.md (per ADR-0006, W1.3 close YYYY-MM-DD)
   ```

   Any session that reads non-redirect content from `handoff.md` is reading a stale checkout and MUST stop and re-read from `.claude/progress-note.md`. The redirect file remains at `.claude/handoff.md` for git history continuity; the prior content is preserved in git history alone, not in the working tree.

**Proxy Decisions migration (concrete).** Existing `## Proxy Decisions (Review Required)` entries follow the four-field template (question, decision, rationale, reversibility). The new Blockers schema requires (decision required + verdict). The migration is **schema-mapping, not lossy**:
- **`question`** → maps to Blocker's "decision required" field.
- **`decision`** → maps to Blocker's "verdict" field (or `awaiting-human` if unanswered).
- **`rationale`** → preserved as a sub-field `verdict-rationale:` on the Blocker (one line, optional but recommended when Pat has applied a proxy verdict).
- **`reversibility`** → preserved as a sub-field `reversibility:` on the Blocker (one of: `reversible`, `costly-to-reverse`, `irreversible`). This was load-bearing in the prior convention and is retained.

The migration is a one-time rewrite at W1.3 close; no entries are dropped. After migration, the Blockers schema canonically holds proxy-decision history.

Coexistence is rejected (see § Considered and Rejected, Alternative C). Supplement is rejected (Alternative D). The migration path is a redirect-line cutover at W1.3 close, not a parallel run.

### 4. `/handoff` Command Contract

The `/handoff` command is updated by W1.3 implementation to satisfy the following contract. Implementation is post-acceptance; the contract is binding.

**Inputs (read):**
- `git log --oneline -10`, `git status`, `git diff --stat` (State derivation).
- Active sprint plan in `docs/sprints/`.
- Active tracking artifacts in `docs/tracking/`.
- Existing `.claude/progress-note.md` if any (Learnings carry forward unless promoted).
- Board access (if configured, per `docs/integrations/README.md`); board failure does not block the write but is recorded in State as `board: unavailable; reason: <reason>`.

**Output (written):** `.claude/progress-note.md`, conforming to § Schema. The command emits the schema as five named sections in order; section headers and citation rules are mechanically checkable.

**Refusal conditions:** the command refuses to write — and exits with a message naming the refusal — if any of the following hold:
- **Next Step's `gates:` list contains a Blocker ID whose status is `awaiting-human`** (or any non-resolved status). The check is **mechanical and explicit**: the command reads Next Step's `gates:` list, looks up each cited Blocker ID in the Blockers section, and refuses if any is unresolved. There is no semantic-dependency reasoning — if Next Step is gated by an unresolved Blocker, Next Step lists it; if Next Step does not list it, the gate does not fire. (Caller must resolve the blocker, remove it from the gates list with explicit justification recorded in Learnings, or change the Next Step.)
- A Learning is neither promoted nor flagged with `pending-promotion: <destination>`. (Caller must annotate.)
- An Open Question lacks an addressee. (Caller must name who answers.)
- More than one Next Step is supplied. (Caller must pick one.)
- The header is missing `session-date`, `author`, or `prior-note-commit`.
- A Blocker is missing a stable ID, or two unresolved Blockers share an ID.

**Preserved from prior progress note:** Learnings flagged `pending-promotion` carry forward verbatim (with their original session date) until promoted. Blockers carry forward until resolved. State is rewritten from scratch each session.

### 5. Lifecycle

1. **Authored** at session end by the coordinator (or Cam, if invoked, but the coordinator is the default and most-frequent author). The author is *not* a single named persona because the progress note's content is cross-cutting state, not a product/architecture/test artifact.
2. **Reviewed** in proxy mode only when the human is unavailable: Pat reviews the Blockers section and applies conservative defaults to any blocker covered by `docs/product-context.md`, recording the decision in the same Blockers/Proxy block. Pat **cannot** clear a blocker that requires architectural input or that overrides a Pierrot/Tara veto — those remain `awaiting-human` and the next session opens by surfacing them to the human first.
3. **Becomes canonical** when `/handoff` writes successfully (i.e., all refusal conditions are satisfied). There is no separate sign-off step; the schema's mechanical checks *are* the gate.
4. **Consumed** at session start by the resuming session: read State, then Blockers, then Open Questions, then Next Step, then Learnings (in that order — blockers can change the Next Step). The Session Entry Protocol from `CLAUDE.md` is unchanged in shape but gains a fourth question: "Is there an unresolved Blocker or Open Question in the progress note?" That question's addition is *implementation work for W1.3*, not decided here, but is bound by this contract.
5. **Retired** when the sprint closes. The progress note is preserved in-repo at `.claude/progress-note.md`; agent-notes `state` flips to `canonical` at sprint boundary by Grace. The next sprint starts a fresh progress note at the same path; the prior version is reachable through git history. Retention beyond git history is not required.

**Escalation:** if a session ends with a Blocker that cannot be expressed as `awaiting-human` (because the human is also unavailable and Pat lacks proxy authority), the coordinator MUST mark the Blocker `awaiting-human-or-pat-authority-extension` and the next session is forbidden from progressing on the affected work item until the blocker resolves. There is no "we proceeded anyway" path.

### 6. Pilot Plan

ADR-0004's shadow-pilot is W1.3 — *which is this ADR's implementation work*. ADR-C is therefore in the unusual position of having its own implementation be the pilot vehicle for a different ADR. This ADR resolves the dual-purpose question explicitly:

**ADR-0006's pilot is W1.3 itself, treated as dual-purpose evidence with ADR-0004's shadow-pilot.** This is acceptable because (a) the two ADRs test orthogonal questions on the same work item — ADR-0004 tests whether the spec adds value over re-reading the ADR; ADR-0006 tests whether the progress-note schema closes the cross-session continuity gap; and (b) ADR-0003's pilot rule applies to ADR-A and ADR-B specifically, not to all follow-on ADRs. ADR-C is not on that list. Dual-purpose evidence is a labor saving here, not a corner-cutting.

**Pilot success criteria for ADR-0006 (additive to ADR-0004's six criteria for the same work item):**

1. The first progress note written under the new schema validates against all citation rules without amendment.
2. The W1.3 close ends with zero `awaiting-human` blockers that the schema failed to surface (i.e., every blocker the human had to resolve was structurally captured, not discovered through narrative re-read).
3. At least one Learning produced by W1.3 is either promoted to its destination during the same session or flagged `pending-promotion` with a destination — proving the promotion mechanism works.
4. The next session that resumes from the W1.3 progress note completes its Session Entry Protocol read in under five minutes (rough; calibrated by post-mortem) — proving the schema is faster than reading prose `handoff.md`.
5. The `/handoff` command's refusal conditions fire at least once during W1.3 (any of them) — proving the mechanical checks aren't decorative. If none fire, the post-mortem must show the conditions are reachable but the session simply never violated them; if they're not reachable in normal use, the schema is over-constrained and this ADR reopens.

**Failure handling:** failure on any ADR-0006 criterion reopens this ADR per ADR-0003 § Rollback. Failure does not block ADR-0004's pilot evaluation, which is scored on its own criteria.

**Joint-reopen rule (binding).** The two ADRs (0004 and 0006) test orthogonal questions on the same work item, but root causes can flow across the boundary (e.g., a bad spec might be caused by a progress-note schema that failed to surface a Blocker that would have informed the spec). **If the post-mortem cannot cleanly attribute a failure to one ADR or the other, both ADRs reopen jointly** — the umbrella's rollback path applies to both, and they re-debate together until attribution is achievable. This binds the dual-purpose pilot's failure mode without requiring a separate non-shadow pilot for ADR-0006: ambiguity is treated as a shared failure, not as a deferred question. The post-mortem template that scores criteria independently is W1.3 implementation work; this binding rule survives the template's specifics.

## Persona-Role Mapping Debate

This section satisfies ADR-0003's binding constraint: "MUST debate the persona-to-role mapping from first principles (no pre-commitment to Pat/Sato/Tara); MUST justify why a vendor-published triad shape is the right fit for Summon's persona shape." The debate is structured as Wei would structure it: candidate mappings, what each candidate gets right, what each gets wrong, and what the chosen answer survives.

### What "planner / generator / evaluator" actually means

The Anthropic harness paper uses these terms to describe roles in *one execution loop*: the planner decomposes the immediate task into substeps and sequences them; the generator produces the unit of work; the evaluator checks that unit against criteria before the loop advances. This is a *loop-level* decomposition, not a *strategic-level* decomposition. "Plan" here does **not** mean "long-arc product planning" or "system architecture." A persona that plans at a longer timescale than the loop is not, by this definition, the planner.

### Candidate mappings, evaluated

- **Pat = planner.** Pat owns *what to build and why*. Pat does not decompose code-write tasks into ordered substeps. Pat writes acceptance criteria; ACs are inputs to the plan, not the plan itself. The W1.3 sprint plan parenthetical that called Pat the planner was not justified from first principles — it was inherited language. **Rejected.**

- **Archie = planner** (Wei's proposal in the umbrella debate, Round 1, Challenge 2). Archie does cross-cutting *direction* setting (ADRs). Archie does not decompose individual code-write tasks into ordered substeps either; ADRs commit to direction, not task breakdowns. The thing closest to a loop-level plan in Summon's existing artifacts is the **feature spec's Task Breakdown section**, which Archie does not author. Archie reviews specs when objective triggers fire (per ADR-0004 § Ownership) but is not the spec's author. Wei's challenge has more force than the alternative, but does not survive its own scrutiny: Archie is a *strategic planner*, not a *loop-level planner*. **Rejected.**

- **Cam = planner.** Cam runs Phase 1 elicitation; Cam does session-entry protocol probing. But Cam is read-only and cannot author the artifact a planner produces. Cam's pressure-test happens *before* a plan exists, not as the plan itself. Cam is a *plan-quality reviewer* (per ADR-0004 § Ownership coherence pass), not a planner. **Rejected.**

- **Grace = planner.** Grace plans at the *sprint* level (sprint plan, board, ownership map) but not at the loop level. Grace does not author task breakdowns inside specs. **Rejected.**

- **Split planner (Cam vision-level / Pat product-level / Archie technical-level / spec author for loop-level).** This is the option suggested by the same pattern that led to ADR-0003's agent+skill split. It is more honest about the timescale separation than any single-persona answer. But it has a structural flaw: a triad whose "planner" is *four agents* is not a triad. The harness shape's value comes from separation of concerns; "split everything" dissolves that separation. **Rejected.**

- **Plan-as-artifact (the feature spec) = planner.** The feature spec's Task Breakdown section *is* the loop-level decomposition. The spec is authored by Pat, coherence-reviewed by Cam, escalated to Archie when objective triggers fire, verifiability-reviewed by Tara. Multiple personas contribute to the artifact; the artifact carries the planner role. This is the answer that survives the cargo-cult challenge: we keep the *functional* separation (plan / generate / evaluate) without forcing a one-to-one persona mapping that would misrepresent any single Summon persona. **Selected.**

### Why the *functional* triad is right for Summon, but the *structural* triad is not

The Anthropic harness paper's load-bearing claim is that *separation of plan / generate / evaluate concerns reduces error rates in long-running loops*. That claim is structural-shape-neutral — it survives whether the planner is one agent, three agents, or an artifact. Summon's existing structure already separates these concerns: ADR-0004 separates spec-author (plan) from Sato (generate) from Tara (evaluate) on standalone grounds; ADR-0002 separates Tara (test author) from Sato (implementer) on the same separation logic.

What we *gain* from naming the triad: shared vocabulary for cross-session continuity (the progress-note schema can talk about "what plan was the prior session executing against?") and a clear answer to "where does the plan live?" — in the spec.

What we *lose* by adopting the structural triad as Anthropic published it: persona misfit. Pat is not a loop-level planner. Forcing the title onto Pat creates the exact silent confusion Wei flagged in the umbrella debate ("the misfit will leak as confused responsibilities at handoff time").

This answer accepts the human's stated willingness to risk the cargo-cult factor *with side-by-side testing* but does not require it: by binding planner to an artifact rather than a persona, the cargo-cult attack surface shrinks. If the artifact-as-planner mapping fails in pilot, ADR-0006 reopens cleanly; the failure does not contaminate any persona's identity.

### What this means for `personas.md` and the agent files

**Original position (rejected by human override 2026-05-02):** "Nothing — by intent. No persona's role is rewritten. The harness mapping is a documentation overlay (added to ADR-0004's spec section and to this ADR), not a persona-file edit."

**Current position (post-override 2026-05-02):** `personas.md` annotates each affected persona with its harness role as a one-line `**Harness role:**` field directly under `**Hybrid phases:**`. Five personas are annotated: **Cam** (planner-quality co-owner — coherence review), **Pat** (planner-quality co-owner — spec authorship), **Archie** (planner-quality co-owner — architecture gate), **Sato** (generator), **Tara** (evaluator). The agent file definitions in `.claude/agents/` are NOT edited — only the methodology doc. The annotation makes the harness binding visible at the persona-roster level so a session reading `personas.md` cold sees the role binding alongside the capability statement.

The original "no persona-file edit" stance was the structural-honesty answer: it kept persona identities clean and avoided pre-empting ADR-D / ADR-G persona reshaping. The human override accepted the surface-area cost for the reader-orientation benefit. Persona reshaping in ADR-D / ADR-G remains free to redefine these annotations — the inheritance contract in § Residual Risks is unaffected. The override does NOT change the underlying mapping (Plan = artifact, Generate = Sato, Evaluate = Tara) or any of the five operational consequences; it only changes where the mapping is *also* documented.

## Considered and Rejected

### Alternative A: Adopt Anthropic's triad with Pat / Sato / Tara mapping unchanged

**The argument:** the umbrella's binding sentence calls out the triad shape as the harness; mapping Pat → planner, Sato → generator, Tara → evaluator is the literal shape. The human accepted cargo-cult risk in this branch with side-by-side testing.

**Why rejected:** Wei's umbrella debate Round 1 Challenge 2 demonstrates the misfit: Pat is a product persona, not a loop-level planner. Adopting the literal mapping introduces silent confusion at handoff time and offers no defense against the cargo-cult charge — it *is* the cargo cult. The human's willingness to risk cargo-cult factor is a budget for *outcome*, not a permission to skip the debate; the umbrella binding constraint is independent of human risk tolerance. Plan-as-artifact preserves the functional separation without the persona misfit and is therefore strictly better on first-principles grounds.

### Alternative B: Reject the Anthropic shape entirely

**The argument:** if the triad is misfit, drop it. Use whatever shape Summon's specs and personas already imply, and don't borrow vocabulary from a vendor paper.

**Why rejected:** the *functional* separation of plan / generate / evaluate is independently sound — it predates the Anthropic paper and survives without it. Rejecting the vocabulary loses the shared-vocabulary benefit (no clean way to say "what was the prior session executing against?") without solving any real problem. The cargo-cult risk attaches to the *structural* triad; rejecting the vocabulary throws out the functional triad too. Plan-as-artifact splits the difference cleanly.

### Alternative C: Keep `handoff.md` prose, supplemented by the progress note

**Why rejected:** two artifacts for the same purpose drift. The team will start updating one and not the other; the next session will be forced to read both and reconcile. The umbrella's continuity-artifact-evolution mandate exists specifically because prose handoffs failed in practice. Coexistence reproduces the failure with extra steps.

### Alternative D: Keep `handoff.md` as the canonical artifact and add a progress-note section inside it

**Why rejected:** putting the structured schema *inside* the prose artifact does not solve the prose problem — the rest of the file remains free-form, and the structured section drifts as the prose around it grows. The mechanical-check refusal conditions in the `/handoff` contract require the file to *be* the schema, not contain it.

### Alternative E: Split planner across personas by timescale (Cam / Pat / Archie / spec)

**Why rejected:** addressed in § Persona-Role Mapping Debate above. A four-persona "planner" is not a planner; it dissolves the separation that gives the triad its value. The spec already absorbs the loop-level work, and the longer-timescale planning work is correctly distributed today — no harness-level rename is needed.

### Alternative F: Adopt the structural triad but assign evaluator-as-skill (the agent+skill split from ADR-0003)

**Why rejected:** this is ADR-D's territory. Pre-committing evaluator to skill-form here would replicate the same pre-commitment anti-pattern Wei caught in ADR-0004. Tara remains an agent for ADR-0006's purposes; ADR-D is free to reshape Tara on its own merits.

## Consequences

### Positive

- The cross-session continuity guarantee no longer depends on prose conventions; refusal conditions in `/handoff` make malformed progress notes mechanically rejectable.
- Plan-as-artifact removes the cargo-cult attack surface on the persona-role mapping while preserving the functional plan/generate/evaluate separation.
- The progress note's Blockers section gives proxy mode a clean structural home, replacing the `## Proxy Decisions (Review Required)` convention in `handoff.md` with a typed field.
- Citation requirements on every section make the schema mechanically auditable, mirroring the ADR-0004 pattern Wei verified.
- Resuming sessions read structured fields in a defined order, eliminating the "scan the prose for context" pattern that wasted turns under the prior `handoff.md` shape.

### Negative

- A hard cutover from `handoff.md` to `progress-note.md` at W1.3 implementation introduces a moment-of-transition risk: if W1.3 ships but the next session's tooling expects the old path, the handoff is silently lost. Mitigation: W1.3 implementation includes a one-sprint read-only retention of `handoff.md` and a Grace-driven deletion at the next sprint boundary.
- The schema's refusal conditions make `/handoff` more likely to fail than the prose version. A failed `/handoff` can leave a session ending with no canonical handoff, which is worse than a sloppy one. Mitigation: refusal conditions all surface fixable annotations (resolve blocker, name addressee, pick one Next Step) — the failure mode is *user error caught early*, not *missing output*.
- Plan-as-artifact does not give a single persona the title "planner." Readers expecting the literal Anthropic mapping will be momentarily confused; § Persona-Role Mapping Debate is the documentation answer but the surface area for confusion is real.
- Five sections is more structure than the umbrella's four-field draft. Throughput on `/handoff` drops marginally; the mitigation is that the fifth section (Blockers) replaces the previously-implicit `## Proxy Decisions` convention that was already inside `handoff.md`, so the net structural addition is one section, not two.
- The pilot is dual-purpose with ADR-0004's. If both ADRs' pilots fail simultaneously, attribution to specific failures requires care — the post-mortem must score each ADR's criteria independently or the rollback path is muddied.

### Neutral

- No persona file is edited by this ADR. ADR-D and ADR-G remain free to reshape personas independently.
- ADR-0005's single-thread rule is unaffected: the harness operates inside one Sato invocation per partition, which is the inhabitable state of single-thread default.
- Phase 7 (Human Interaction) is unchanged in shape; proxy mode now writes Blockers into the progress note instead of a free-form `## Proxy Decisions` section, which is a notation change, not a workflow change.
- The `/handoff` command's refusal conditions are enforcement of the schema, not a new gate — there is no separate reviewer.
- Sprint-boundary retirement of the progress note is a Grace responsibility already covered by Grace's existing sprint-boundary duties; no new persona role is created.

### Residual Risks

- **Refusal-condition reachability.** If the refusal conditions never fire in normal use (because sessions naturally satisfy them), the mechanical-check claim is unfalsified. Pilot success criterion 5 forces the question; if no condition fires during W1.3, the post-mortem must demonstrate reachability or the schema is over-constrained and this ADR reopens.
- **Open-Question / Blocker boundary is judgment-loaded.** The structural distinction (team-answerable vs human-required) collapses when Pat-in-proxy can answer questions the team alone could not — the same question may be classified either way depending on whether the author thinks Pat can clear it. The schema forces a choice at write time, accepting drift cost. **A recurring pattern of mis-classification in pilots reopens the schema.**
- **Plan-as-artifact and the evaluator split.** This ADR binds the evaluator role to Tara. If a future ADR (D or G) reshapes Tara's surface, the evaluator binding may need re-examination. The progress-note schema does not depend on the agent identity of Tara, only on Tara's verifiability gate from ADR-0004 — so the binding is loose, but not zero.
- **Persona bindings inherited by ADR-D / ADR-G.** This ADR binds the following personas to harness-related functions: **Sato** (generator), **Tara** (evaluator), **Pat** (Blocker proxy resolution), **Cam** (alternative authoring path; coherence reviewer for the spec-as-planner artifact via ADR-0004), **Grace** (sprint-boundary retirement of the progress note), **coordinator** (default progress-note author), **Archie** (architecture-gate component of the distributed plan-quality function). When ADR-D and ADR-G reshape personas, this list is the inheritance contract — any reshaping of these personas MUST verify that the harness binding survives or amend ADR-0006 accordingly.
- **The dual-purpose pilot risks confounding.** If W1.3 fails for spec-related reasons (ADR-0004) the post-mortem may attribute the failure to the progress-note schema by proximity. Mitigation: each ADR's success criteria are scored independently AND the joint-reopen rule (§ Pilot Plan) applies whenever attribution is ambiguous — both ADRs reopen jointly rather than risking false attribution.
- **Redirect-line risk during transition.** If a session is started from a stale checkout that still contains the old `handoff.md` content (pre-redirect), the session may read prose instead of structured. The redirect-line mechanism makes this a *visible* failure (a prose-only read produces no structured fields and the resuming session detects the format mismatch); it cannot make the failure *impossible*. Sessions that detect the mismatch MUST stop and re-fetch from origin before proceeding.

## Rework Notes (2026-05-02)

This ADR was amended following Wei's round-1 verdict (ACCEPT WITH AMENDMENTS, [debate](../tracking/2026-05-02-adr0006-harness-debate.md)). Twelve amendments folded inline; no second Wei round per Wei's own gate-fatigue concern.

**Must-change (4):**

1. **(Challenge 3)** `/handoff` "depends on" gate is now mechanically defined: Next Step carries an explicit `gates:` list of Blocker IDs; the gate fires iff any cited Blocker is unresolved. No semantic-dependency reasoning.
2. **(Challenge 4)** Dual-purpose pilot bound by joint-reopen rule: if attribution is ambiguous, both ADRs (0004 and 0006) reopen jointly. Survives the absence of a pre-authored post-mortem template.
3. **(Challenge 5)** `handoff.md` retirement bound: redirect-line cutover at W1.3 close (single triggering event, "next sprint boundary" contradiction resolved). Proxy Decisions migration specified field-by-field as schema-mapping (not lossy).
4. **(Challenge 1)** § Persona-Role Mapping operational consequence 3 rewritten: plan-quality function explicitly distributed across Pat/Cam/Archie/Tara at spec authorship and review time. Plan-quality is owned, not dissolved into the artifact.

**Should-amend (4):**

5. **(Challenge 6)** Schema header added with `session-date`, `author`, `prior-note-commit`. Resolves the Lifecycle "Learnings carry forward with original session date" contradiction.
6. **(Challenge 2)** § Persona-Role Mapping operational consequence 4 added: below-spec items (XS, S without opt-in) use the in-flight progress note as planner.
7. **(Challenge 2)** § Persona-Role Mapping operational consequence 5 added: mid-session pivots escalate to Pat per ADR-0004 § Lifecycle step 4 before Next Step is updated.
8. **(Challenge 5)** Proxy Decisions migration concretized field-by-field; `rationale` and `reversibility` preserved as Blocker sub-fields.

**Conceded after rebuttal (3):**

9. **(Challenge 3)** Open-Question / Blocker drift acknowledged in § Residual Risks; recurring mis-classification reopens the schema.
10. **(Challenge 7)** Wave-gate consistency: no change.
11. **(Challenge 8)** § Status reformulated as "Proposed (Shadow-Pilot phase)" matching ADR-0004's pattern; multi-condition Accept transition surfaced explicitly.

**Disclosure (1):**

12. **(Challenge 8)** § Residual Risks now lists the personas this ADR binds (Sato / Tara / Pat / Cam / Grace / coordinator / Archie) as the inheritance contract for ADR-D and ADR-G.

**Human override (1, 2026-05-02 post-rollout):**

13. § "What this means for `personas.md` and the agent files" reversed: the original "no persona-file edit" position is replaced by a per-persona `**Harness role:**` annotation on Cam / Pat / Archie / Sato / Tara in `personas.md` (methodology doc only — `.claude/agents/` files unchanged). Override applied directly by the human after Wave 1 implementation surfaced the conflict between this ADR and sprint-1-plan.md W1.3 AC ("Phase doc and personas.md annotate the planner/generator/evaluator mapping"). The override accepts the surface-area-for-confusion cost identified in § Negative Consequences in exchange for reader-orientation benefit at persona-roster read time. Underlying mapping unchanged; ADR-D / ADR-G inheritance contract unchanged.

**Post-pilot transition (1, 2026-05-02):**

14. **Status flipped to Accepted (Conditional)** per the [W1.3 pilot post-mortem](../tracking/2026-05-02-w1.3-pilot-postmortem.md). Pilot scored: criteria 1, 2, 3 — unconditional PASS; criterion 5 — PASS on reachability demonstration (no condition fired in W1.3, but all six are mechanically reachable per § 5 of the post-mortem); criterion 4 — DEFERRED to first true `/resume` (post-mortem F1). § 6 joint-reopen rule did NOT fire (attribution to ADR-0006 is clean: ADR-0004's missing pilot evidence is attributable to dual-purpose-pilot scheduling, not to ADR-0006 design). Three follow-ups carry forward (F1 = resume-time scoring; F3 = paranoid refusal-condition reachability check; F4 = optional 7th refusal condition for spec citation in Next Step). None block the transition. The reopen condition is named in § Status.
