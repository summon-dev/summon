<!-- agent-notes: { ctx: "Architecture Gate debate record for ADR-0007 (canon/meta boundary)", deps: [docs/adrs/0007-canon-meta-boundary.md, .claude/agents/wei.md, scripts/check-canon.mjs, packages/summon-team/src/doctor.ts], state: complete, last: "claude@2026-07-03" } -->

# Debate: The Canon/Meta Boundary (ADR-0007)

**ADR:** docs/adrs/0007-canon-meta-boundary.md **Date:** 2026-07-03 **Participants:** Archie (author) vs Wei (challenger), both standalone agents **Trigger:** Summon's template repo is also its dev repo, so Summon's own meta-content ships into every scaffolded user project. ADR-0007 establishes the rule for what ships (canon) vs what stays framework-only (meta).

## Round 1 — Wei's Challenges

Wei verified against the code first (`packages/summon-team/src/index.ts`, `scripts/check-canon.mjs`, `docs/adrs/`). Note: he read `main`, where PR #45 (`EXCLUDE_PATHS`) and ADR-0006 are not yet merged — which is the root of C1/C2/C5.

1. **Enforcement surface cites a mechanism that doesn't exist** _(fatal as written)_. Technique: citation check. `EXCLUDE_PATHS` appears only inside the ADR; `index.ts` on `main` has basename-matched `EXCLUDE_DIRS`/`EXCLUDE_FILES`. The ADR describes the exclusion plumbing in present tense as if shipped.
2. **§9 sensor presupposes unbuilt systems; the "breaks downstream doctor" urgency is vaporware** _(serious)_. Technique: cost of being wrong. `check-canon.mjs` has no "canon registry"; the downstream `doctor` "can't happen until ADR-0004 ships."
3. **§5b and §9.2 contradict** _(serious)_. Technique: assumption surfacing. §5b blesses illustrative meta paths in prose ("in Summon's own repo, e.g. `docs/tracking/…`"), but §9.2's prose-ref warn fires on exactly that phrasing — and on `doc-ownership.md`, which must name the zones. Warnings can never trend to zero.
4. **Split OQ1: keep the deterministic `deps`-edge FAIL, CUT the prose-ref WARN** _(serious; demand to cut)_. Technique: inversion + historical precedent (the ADR-0004 `--json` "zero consumers" precedent lands on the warn, not the fail). The structured deps-edge check is ~15 deterministic lines guarding a real break; the prose warn is false-positive-prone advisory noise.
5. **ADR-0006 doesn't exist; §3 moves a phantom file** _(minor)_. Technique: citation check. The migration table lists 0004/0005/**0006** as a concrete move.
6. **The classification test misfires on a file in its own scope** _(serious)_. Technique: assumption surfacing. `ai-tells-catalog.md` is framed as "keeping *Summon's own docs* from reading machine-built" → meta by §1's subject test, but §3 ships it canon via directory granularity — §1 (subject) and §3 (path) disagree, the exact failure §1 claims to prevent.
7. **`docs/adrs/meta/` rots the ADR numbering** _(minor)_. Technique: alternative technology. The number sequence now spans two dirs — ironic for an anti-rot ADR. Counter: flat `adrs/` + `audience: meta` frontmatter.

**Wei's concessions (could not break):** OQ4 (remove+gitignore `handoff.md` — tried the "tracked empty template" inversion, it's weaker); OQ3 (hiding product ADRs is right — shipping them would leak CLI internals; offered a constructive alternative: ship a *new canon* example ADR for a fictional user decision instead); zone-in-one-repo; and the `deps`-edge FAIL half of §9.

## Round 2 — Archie's Responses

Two of Wei's points rested on reading `main`; the coordinator fact-checked both against the actual code before Archie responded.

| # | Verdict | Resolution |
|---|---------|-----------|
| 1 | **Accept framing / reject matcher critique** | Declared the hard PR-#45 dependency in §Status and §2. Corrected the record: #45's `EXCLUDE_PATHS` is a **post-copy `rmSync` removal loop** (path-prefix based) that handles nested `docs/history/` and `docs/adrs/meta/` correctly — Wei's "basename can't express a prefix" applies only to the old `EXCLUDE_DIRS`/`FILES`. Added a two-matcher reconciliation; kept the mechanism. |
| 2 | **Reject vaporware / accept precision** | `checkAgentNotesDeps` **ships** in `runHealth` on this branch (verified), so a canon→meta dep breaks a user's `doctor` today — the urgency stands. Dropped the false "canon registry" wording (`check-canon.mjs` is a plain function array). Added a nuance neither had: `doctor` *suppresses* a missing dep when the parent dir is absent, so the clean post-move break is `0003 → cross-repo-lessons.md` — which is why the pre-ship, full-visibility `check-canon` sensor is the right guard rather than the post-ship `doctor`. |
| 3+4 | **Accept** | Cut the prose-ref **warn** to a documented non-goal (contradicts §5b, can't trend to zero). Kept only the deterministic deps-edge **fail**. |
| 5 | **Accept** | De-phantomed the 0006 row — table lists 0004/0005 (exist); 0006 named parenthetically as a future move once its branch lands. |
| 6 | **Accept** | Classified `ai-tells-catalog.md` as **canon** on subject grounds (a reusable prose-quality discipline any Summon-run project practices), with a caveat to generalize its Summon-specific examples. Added the structural **individual-file rule** to §1: a meta file in a canon dir is classified individually; directory granularity is copy convenience, never an override of the subject test. |
| 7 | **Accept-as-risk** | Named the numbering-rot trade honestly in OQ2; added a cheap mitigation — a `check-canon.mjs` assertion that ADR numbers are contiguous and unique across both dirs. |

## Resolution

- **Resolved by ADR change:** all seven. Correctness/framing defects (C1 present-tense mechanism, C3 contradiction, C5 phantom row) fixed; C2 corrected in both directions (urgency kept on verified facts, "registry" wording dropped); C4 the enforcement sensor scoped down to the deterministic deps-edge fail; C6 the classification test hardened with the individual-file rule.
- **Cut:** the prose-ref warn (documented non-goal).
- **Adopted from Wei's concession:** the follow-up implementation PR ships a new *canon* example ADR for a fictional user-domain decision (Postgres vs SQLite) rather than a redacted product ADR.
- **Rejected:** the "downstream doctor is vaporware" claim (factually wrong — the health check ships) and the "basename can't express a prefix" mechanism critique (applies to a different matcher).
- **Round 3:** not run — Archie accepted every legitimate challenge and the two rejections are grounded in verified code facts, not unaddressed argument. Human approval is the final gate step.

## Outstanding for human approval

- Ratify the classification test (subject beats directory) + the individual-file rule.
- Confirm the enforcement posture: deterministic canon→meta deps-edge **fail** in `check-canon.mjs`; prose-ref warn is a **non-goal**.
- Confirm `ai-tells-catalog.md` stays canon.
- On approval: `state: accepted`; the follow-up implementation PR does the file moves, scaffolder `EXCLUDE_PATHS` additions (depends on #45), ADR-0003 dep surgery, `README-template.md`, `handoff.md` removal, the new canon example ADR, and the `check-canon` sensor.
