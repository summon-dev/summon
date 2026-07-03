<!-- agent-notes: { ctx: "Architecture Gate debate record for ADR-0003 risk tiers", deps: [docs/adrs/0003-project-risk-tiers.md, docs/process/cross-repo-lessons.md, docs/process/team-governance.md], state: active, last: "coordinator@2026-06-06" } -->

# Debate: Project Risk Tiers & Per-Feature Hazard Trip-Wire (R1)

**ADR:** `docs/adrs/0003-project-risk-tiers.md` **Date:** 2026-06-06 **Participants:** Archie (author) vs Wei (challenger); Pierrot (safety co-owner, veto power); Pat (product co-owner) **Context:** Wave 2 item R1 from `docs/process/cross-repo-lessons.md` — the keystone that gates the rest of Wave 2 (#2 review-reliability, S1 safety track). Run as standalone subagents per the Architecture Decision Gate in `docs/process/team-governance.md`.

## Outcome

The debate **inverted the original proposal**. Round 1 made *project tier* the load-bearing unit; Wei showed that was the wrong unit and Archie adopted the correction. The accepted design: a per-feature **hazard trip-wire** (now four objective, fail-closed questions) is the load-bearing gate that switches on the S1 safety track for any item that trips it, in any project; the **project risk tier** is demoted to a cheap default sensitivity that can only override *upward*. Pierrot then found two safety blind spots and approved with three conditions, all applied.

**Status: ADR Proposed — awaiting human approval (final gate item).**

---

## Round 1 — Wei's Challenges

**Citation flag (technique #7).** The decision record (`cross-repo-lessons.md`) attributed the anti-ceremony objection to "Vik" alone; Section 2 line 98 credits **Wei, Vik, Pat** jointly. → **Resolved:** fixed in both the decision record and the ADR.

1. **(Inversion) Risk is per-feature, not per-project.** A project-level Tier 2 smothers alpaca-trader's ~90% boring code; the inverse — a Tier-1 SaaS app with one `POST /transfer` — gets *zero* safety track. The coarse label both over- and under-covers. **Alt:** per-capability hazard flag; tier becomes a default the flag overrides.
2. **(Cost of being wrong) The Tier 1↔2 boundary is subjective and the expensive error is one-directional.** Mis-tier-down ships the failure silently with a green board. **Alt:** objective trip-wire checklist; ambiguous = on.
3. **(Incentives) Self-declared tiers drift; an unset tier has no defined failure direction.** Everyone self-declares Tier 0 to dodge process (the prototype-in-prod pipeline). **Alt:** unset → fail closed; Tier 0 requires a falsifiable assertion.
4. **(Lifecycle) Nothing forces a re-tier.** The toy gets a payments integration in sprint 6; `/kickoff` ran once; the label rots silently — the same silent-false-green the audit is about. **Alt:** anchor risk to the per-item gate that already runs; add a `/sprint-boundary` re-tier trigger.
5. **(Does it solve the objection?) Only if the tier is the OUTPUT of an objective test.** "Make a tiering decision at kickoff" is itself ceremony, and nothing measures whether it reduced ceremony. **Alt:** add a Pat acceptance criterion tied to the kill criterion.

**Wei's verdict:** *sound-with-changes, but the unit is wrong.* Invert the keystone — per-feature fail-closed trip-wire on the existing per-item gate; demote the project tier to a default sensitivity.

## Round 2 — Archie's Responses

| # | Resolution |
|---|------------|
| Citation | **Resolved** — attribution fixed in ADR + decision record. |
| 1 | **Resolved (adopted as the keystone inversion).** Trip-wire is now load-bearing (§1); tier demoted to default sensitivity, override-upward-only (§2). Safety track lands on the hazardous *feature*, not the project. |
| 2 | **Resolved.** Trip-wire is objective yes/no questions, evaluated at kickoff *and* per item; ambiguous/unevaluated = tripped. Tier only sets the baseline. |
| 3 | **Resolved.** Two composing fail-closed defaults (§5): unset tier → Tier 1; unevaluated wire → presumed tripped. Tier 0 requires a falsifiable written assertion. |
| 4 | **Resolved.** Wire rides the per-item board-add step (§3); added a `/sprint-boundary` re-tier trigger. The label can rot; the gate can't. |
| 5 | **Resolved.** Tier default seeded by the objective trip-wire; added a Consequences acceptance metric + kill criterion (revert to flat process if no measurable ceremony reduction in 2 sprints). |

**Archie accepted Wei's verdict.** The unit was wrong; the hybrid (trip-wire load-bearing + tier as cheap default) was adopted.

**Open follow-on (tracked, non-blocking):** Archie kept three tiers to gate *baseline* (non-safety) ceremony — TDD relaxations, Done-Gate breadth, lens count — which the trip-wire (a safety-axis mechanism) does not address. Whether that baseline ceremony should *also* be per-item rather than per-project is a genuine, un-litigated follow-on. Flagged as a tracked risk for the human, not a reason to re-open R1.

## Safety Gate — Pierrot (APPROVE WITH CONDITIONS)

Pierrot found the trip-wire — whose entire job is deciding when safety applies — had two blind spots, and that Tier-0 lightening reintroduced a self-certifying-gate hole. Three must-fix conditions, **all applied** by Archie and verified on disk:

1. **Trip-wire under-covered two hazard classes.** Added **Q4 — sensitive data exposure** (read-only PII/PHI disclosure is itself the irreversible harm; trips none of Q1–Q3) and **amended Q1** to cover untrusted/model-influenced input reaching a privileged capability (LLM-with-tools = no reliable human in the loop). Wire is now **four** questions.
2. **Security lens non-droppable at every tier, including Tier-0.** The security lens is *also the independent trip-detector* — the only check on a misjudged "no," and the author judging the wire is the untrusted actor (Wave 1 principle). Tier 0 may drop the *other* lenses; the security lens always runs. Extends the gap-#2 veto (non-droppable for all item *sizes*) to all *tiers*. (§88, §91.)
3. **Decoupled S1 from the wire.** S1 owns the hazard *taxonomy* (actuation, authority, disclosure, injection); the trip-wire is S1's *detection front-end* carrying ≥1 question per hazard class. A richer S1 drives *adding* a wire question — not the reverse. (§107.)

**Non-blocking note (applied):** Consequences→Negative now acknowledges the wire **fails open on a confident wrong "no"** (fail-closed handles omission, not commission), with the non-droppable security lens named as the compensating control.

**Pierrot retains sign-off** on the eventual S1 (Safety Contract) ADR and on the implemented `code-reviewer.md` for gap-#2 guardrails G1/G3/G4. Approval of this ADR does not pre-approve those.

## Product Gate — Pat (ENDORSE WITH CHANGES)

Pat reviewed product fit, onboarding flow, and measurability (not safety/architecture). Three ADR-text changes (B, D, E) **applied and verified on disk**; two command-wiring changes (A, C) **deferred to R1 implementation** and recorded in the ADR's new "Implementation note":

- **A (deferred → implementation).** `kickoff.md` Phase 1b must add the tier-seeding step. The ADR *claims* kickoff seeds the tier, but the command has no such step — a paper claim until wired.
- **B (applied).** `/quickstart`'s Tier-1 default now governs only the **safety floor** (trip-wire armed, security lens non-droppable), while inheriting quickstart's documented ceremony deferrals until first `/kickoff` — resolving the "runs below its declared tier" contradiction.
- **C (deferred → implementation).** `quickstart.md` must state the `risk-tier: 1` default + re-tier note. Same paper-claim issue as A.
- **D (applied).** The faith-based acceptance metric was replaced with **countable instruments**: ceremony delta (mean control count vs. an explicit flat-process baseline of all-15-Done-Gate + full multi-lens), and **trip-to-track coverage = 100%** (replacing the unfalsifiable "zero safety incidents," which a no-trip toy project trivially satisfies). Kill criterion now binds to those instruments; a small-n caveat requires the trial run until ≥1 trip is observed.
- **E (applied).** The zero-ceremony common case is now stated plainly: no trip ⇒ four "no" answers once at kickoff, auto-written Tier-1 default, no safety track — the two-mechanism cost is paid only by projects that carry hazard.

**Pat verdict: ENDORSE WITH CHANGES — all ADR-text changes applied.** A and C live in the R1 implementation step (ADR §"Implementation note").

## Gate Checklist Status

- [x] ADR written (Archie, standalone)
- [x] Wei invoked as standalone agent, ≥2 challenge techniques (used 5 + citation-check)
- [x] Multi-round debate executed (R1 proposal+challenges parallel; R2 point-by-point responses)
- [x] Debate tracked (this file)
- [x] ADR updated to reflect debate + safety conditions
- [x] Safety co-owner (Pierrot) sign-off — conditional, conditions applied
- [x] **Human approved** — 2026-06-06. ADR-0003 flipped to `Accepted`. R1 implementation (wiring) follows; see the ADR's Implementation note.
