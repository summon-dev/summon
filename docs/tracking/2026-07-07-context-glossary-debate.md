---
agent-notes: { ctx: "Architecture Gate debate record for ADR-0009 (ubiquitous-language glossary)", deps: [docs/adrs/0009-ubiquitous-language-glossary.md, docs/process/team-governance.md], state: complete, last: "claude@2026-07-07" }
---

# Architecture Gate Debate — ADR-0009: Ubiquitous-Language Glossary

**Date:** 2026-07-07
**Tracking issue:** #50
**ADR:** [`docs/adrs/0009-ubiquitous-language-glossary.md`](../adrs/0009-ubiquitous-language-glossary.md)
**Author:** Archie (standalone agent) · **Challenger:** Wei (standalone agent) · **Coordinator:** claude

## Provenance

The decision originates from a five-persona audit (Archie, Vik, Diego, Pat, Wei) of Matt Pocock's [`mattpocock/skills`](https://github.com/mattpocock/skills) repository on 2026-07-07, which surfaced a ubiquitous-language glossary (Eric Evans / DDD) as Summon's single most-cited structural gap. The audit produced two competing framings — ship it as a user-facing methodology practice (Pat) vs. dogfood it internally to de-verbose Summon's own docs (Vik) — which this ADR was gated to resolve.

## Gate procedure followed

1. **Round 1a** — Archie authored ADR-0009 from the template (decision: "adopt, scoped"; one canon `docs/glossary.md` pre-seeded with methodology terms + user domain terms; structural anti-rot sensor).
2. **Round 1b** — Wei challenged the written ADR as a standalone agent, using five techniques from `wei.md`: citation check, assumption surfacing, inversion, cost-of-being-wrong, historical precedent. Six numbered challenges. Verdict: RATIFY-WITH-CHANGES, escalating to SEND-BACK if C1/C4 unanswered.
3. **Round 2** — Archie responded point-by-point and revised the ADR. Five challenges conceded, one (C6) dissolved by the C1+C4 fixes; one precision correction where Wei's literal fix was incomplete.

No Round 3 rebuttal was required: the SEND-BACK trigger (C1/C4) was fully conceded, and the revised design removed the failure modes Wei's remaining challenges depended on.

## Challenges, responses, and resolution

### C1 — The §3 boundary defended the wrong neighbours; the real collision is glossary-vs-spec-doc

**Wei (citation check + assumption surfacing):** "proof grade" is authoritatively defined in `done-gate.md:14-20`; every seed term likewise has a canonical spec-doc home. So §2's "defined nowhere else" was false on arrival — the seeded glossary would *duplicate* the spec docs and manufacture the exact drift the artifact exists to prevent. §3's boundary table only compared the glossary to code-map and agent-notes, never to the methodology spec docs where the collision actually is.

**Archie:** CONCEDE. Verified the `done-gate.md` definition. Fixed with a pointer-not-copy invariant (§3 single-source rule) and by removing process terms from the shipped glossary entirely (§2).

**Resolution:** RESOLVED — ADR changed. Boundary table expanded to four artifacts (glossary / code-map / agent-notes / spec-docs), disjoint by design; terms with a canonical spec-doc home are pointed to, never redefined.

### C2 — The anti-rot sensor was guarded so it never runs where the artifact ships

**Wei (citation check + inversion):** `check-canon.mjs` checks #7/#8 are `IS_SUMMON_REPO`-guarded because they assert meta-zone invariants absent downstream. The glossary is canon and ships, so guarding its check "like the others" disables the sensor precisely in the user's project where the glossary rots. Invoking ADR-0004 Decision 2 to justify the guard was a misapplication.

**Archie:** CONCEDE, with a precision correction. Wei's direction is right but his literal fix (unguard the `check-canon` function) is incomplete — a scaffolded project has no workspace wired to run `check-canon.mjs` at all. The architecturally correct home is the portable `health` registry (ADR-0004 Decision 2), which runs downstream via `npx summon-team doctor`.

**Resolution:** RESOLVED — ADR changed, improved beyond Wei's stated fix. The structural check moves to the unguarded `health` registry so it runs in the user's project.

### C3 — The motivating verbosity evidence was inflated and internally contradictory

**Wei (citation check):** the exact `(deterministic / inferential / human-judgement)` parenthetical appears at two sites repo-wide, not four; `grill.md` has it once, not twice; `done-gate.md` is the definition, not a re-teach — yet §Context banked it as evidence while §5 exempted it.

**Archie:** CONCEDE. Corrected counts in §Context; stated plainly that line-savings is not the case for the artifact.

**Resolution:** RESOLVED — factual correction made. The ADR no longer rests on line-count.

### C4 — Seeding a ubiquitous-language glossary with process jargon contradicts the cited DDD authority

**Wei (inversion + assumption surfacing):** Evans' ubiquitous language is the domain-expert's business language; a payments expert does not speak "sentinel" or "debt marker." Seeding the user's domain glossary with 11 framework-process terms pollutes the artifact. The ADR-0008 analogy was misapplied — 0008 ships a *fictional user-domain* example, so the faithful analog is a fictional-domain glossary (Order/Invoice/Customer) teaching the format, not Summon's internals.

**Archie:** CONCEDE. The glossary now ships seeded with a fictional-domain example; process terms stay in their spec docs.

**Resolution:** RESOLVED — ADR changed. This also strengthens the canon ruling: with process terms out, nothing Summon-internal is baked into what ships.

### C5 — The "dogfooding and shipping are one act" spine papered over a real scope decision

**Wei (assumption surfacing):** the spine conflated "these terms appear in shipped docs" with "these terms belong as glossary entries." The two needs (Vik's de-duplication; the user's domain discipline) are separable; fusing them made the "one artifact" conclusion inevitable by rhetoric, not proof.

**Archie:** CONCEDE the rhetorical critique. Retracted the spine (§Retracted) and made the scope decision explicit: two separable needs, two mechanisms — Need A (user's domain language) gets the new canon artifact; Need B (Summon's own process terms) gets a de-duplication discipline with no new file.

**Resolution:** RESOLVED — ADR changed. Scope is now argued explicitly rather than derived from a collapse.

### C6 — No sensor for the value; the seed was the most rot-prone content

**Wei (cost-of-being-wrong + historical precedent):** the structural sensor catches only trivial duplicate headings; the failure that matters (glossary drifting from an evolving methodology) is caught by nothing but review, and the seeded methodology terms are the most rot-prone content in the repo. Compounding with C1+C2, ship-and-abandon becomes the modal outcome, not a tail risk. Acceptable only if C1+C4 are resolved.

**Archie:** CONCEDE — dissolves via C1+C4. Removing the process-term seed (C4) and the copy-not-pointer duplication (C1) eliminates the rot-prone content; the shipped seed is now a static fictional example that does not track Summon's process churn.

**Resolution:** RESOLVED by dependency. C6's precondition (C1+C4 fixed) is met, so ship-and-abandon is no longer modal. Wei conceded this outcome in his own challenge.

## Net outcome

**Decision stands: adopt, scoped — but the shape changed materially.**

- **Before (Round 1):** one canon `docs/glossary.md` pre-seeded with Summon's methodology vocabulary, serving both framings via the "one act" collapse; sensor in the guarded `canon` set.
- **After (Round 2):** one canon `docs/glossary.md` seeded with a *fictional-domain* example for the user's domain language (Need A); a separate *de-duplication discipline* — no new file — for Summon's own process terms, which keep their single home in the spec docs (Need B); the structural check relocated to the downstream, unguarded `health` registry.

**Canon-vs-meta ruling:** CANON (`docs/adrs/0009-…`), unchanged and strengthened — with process terms removed, nothing Summon-internal ships in the artifact. The only meta component is the `health` structural check (CLI code, not this ADR's subject).

**Accepted risks / open questions carried to ratification:**

- **OQ1** — whether even the structural `health` check is worth building for a single-file artifact (Archie argues yes; Wei may still press YAGNI). **RESOLVED at ratification: build it** — the human accepted Archie's argument.
- **Content freshness** of a user's own domain glossary has no automated sensor by design — it is the user's discipline, as with every doc they own. Accepted.

## Ratification

**Human ratified the ADR as-is on 2026-07-07** (decision: adopt, scoped; OQ1 resolved in favour of building the `health` check). Status flipped to Accepted. Implementation is a single follow-up PR per "this ADR is the spec, not the build."

**Gate checklist status:** ADR written ✅ · Wei invoked standalone with ≥2 techniques ✅ (5 used) · multi-round debate executed ✅ · debate tracked (this file) ✅ · ADR updated ✅ · **human approved ✅**.
