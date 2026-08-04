<!-- agent-notes: { ctx: "Architecture Gate debate record for ADR-0012", deps: [docs/adrs/meta/0012-executable-canon.md], state: complete, last: "claude@2026-07-24" } -->

# Architecture Gate Debate — ADR-0012 "Executable Canon" (2026-07-24)

**Participants:** Archie (gate review, 14 findings, sentinel verified), Wei (challenge, 8 objections, sentinel verified in-message — Wei has no Write tool by design, so the returned message is the artifact; noted rather than laundered). Coordinator drafted and revised.

**Both agents endorsed the direction and blocked the draft.** Archie: "NOT RATIFIABLE AS DRAFTED — direction endorsed, repairs required." Wei: "ADR-0012's direction survives; its evidence doesn't yet." All repairs are in the revised ADR; dispositions below.

## Archie findings → dispositions

| # | Finding | Disposition |
|---|---------|-------------|
| C1 | ADR misplaced in canon; deps dangling (0006/0007 live in `meta/`); codex doc headed for user repos from `docs/` root | **Fixed.** ADR → `docs/adrs/meta/0012`, codex doc → `docs/history/`, deps corrected; all edges now meta→meta per 0007 §5a |
| C2 | Portability clause cites a nonexistent "ADR-0006 adapter structure"; enforcement assets don't fit 0006's projection model; manifest↔registry relationship undefined | **Fixed.** Clause now introduces "enforcement adapters" as an explicitly new asset class outside 0006's projection model, drift risk accepted with registry mitigation; registry=exists / manifest=installed / doctor joins |
| I1 | Review-wave roster encoded as three lenses; governance defines four + conditionals | **Fixed.** C now names Vik+Tara+Pierrot+Archie-conformance plus trigger-based lenses (Dani UI, migration, API-compat), roster computed from the diff by the script |
| I2 | B silently flips ratified encode-on-observed-failure policy to exhaustive | **Fixed.** Named as an explicit policy amendment, deterministic checks only, observed-failure retained for inferential sensors; backlog cost priced in Negatives |
| I3 | "Receipts over claims" adopted but never decided; format-checked sentinels still self-authored | **Fixed.** Receipts = explicit deferred design item owned by Archie, sequenced before the exit-path hook; interim rule: hooks/scripts re-execute deterministic checks rather than trust worker reports |
| I4 | Registry has no owner, zone, or versioning discipline | **Fixed.** Archie owns schema (versioned, validated, manifest-grade); doctor maintainer owns probes; check script canon, Summon's data meta |
| I5 | Ladder stands on unpinned primitives | **Fixed.** Per-asset required-primitive + minimum-version in registry; doctor probes (merged with Wei O1/O3) |
| I6 | Missing Negative: shipping executable hooks is a new trust surface | **Fixed.** New Negative added; Pierrot threat-model pass (via security-intake) gates first canon adapter; per-hook escape hatch + false-positive policy required |
| I7 | D's "structurally impossible" has no carrier ceremony | **Fixed.** Parallel Work dispatch added to C's ceremony list; D restated honestly and sequenced strictly after its carrier |
| I8 | "Canon stays Markdown" vs "enforcement assets are canon" self-contradiction | **Fixed.** Two-term vocabulary (methodology canon / enforcement adapters); flagship assets classified in the ADR |
| M1 | "First-class" overstates ADR-0006's Copilot posture | **Fixed.** Now "committed, gated, and second-tier by design" |
| M2 | Gate workflow would freeze the stale pre-0007 debate-artifact path | **Fixed.** Named in C as a sequencing prerequisite. (This artifact uses the corrected `docs/history/tracking/` path.) |
| M3 | No sequencing principle | **Fixed.** Sequencing section: E → scripts → hooks (exit-path last) → review-wave earn gate → remaining ceremonies → D |
| M4 | Hook latency + fixture-maintenance costs unpriced | **Fixed.** Both added to the policy-amendment Negative |

## Wei objections → dispositions

| # | Objection | Disposition |
|---|-----------|-------------|
| O1 | "Already falsified by shipped primitives" bets on a nine-week-old plan-gated research preview with none of the version discipline the ADR praises | **Amended.** Context states Workflow's status (research preview, 2026-05-28, plan-gated), claim downgraded to "conditionally answered"; C earn-gated on the review wave + negative-control fixture |
| O2 | ADR rebuts D1 but drops D6/D8 — no exit-path guard, and the tamper property is unclaimable in-repo | **Amended.** Exit-path hook named in B's ladder; "Tamper boundary" honesty clause added: hardens against forgetting, not an adversarial coordinator; human PR review is the integration authority |
| O3 | Degradation note aimed at the wrong axis — plan tiers split within Claude Code; adapter READMEs are read by no one at invocation time | **Amended.** Registry keys on probed capabilities, not runtime identity; ceremonies announce mode at invocation |
| O4 | No reversal criteria; B–E unfalsifiable as drafted | **Amended.** Reversal-triggers section with Wei's four conditions and a 90-day checkpoint (2026-10-24); E sequenced first |
| O5 | "Cheapest layer" is runtime-relative; pushes checks to the least portable layer | **Amended.** Tie-breaker added: prefer script at equal determinism; hooks reserved for moment-of-action blocking. Done-gate items moved to the script row |
| O6 | "1%" unfalsifiable; false-positive hard-fails in strangers' repos unpriced; Summon-as-dependency ungoverned | **Amended.** "1%" struck (now "no daemon, no event store, no sandbox engineering"); false-positive policy + escape hatch in Negatives; security-intake routing for the shipped-adapter surface |
| O7 | Deps paths wrong; ADR itself is meta by 0007's own test | **Fixed** (same repair as Archie C1) |
| O8 | Personas: retirement case argued at full strength | **WITHDRAWN** by Wei, conditional on the revisit trigger now in F (ADR-0006 Phase-0 fidelity-loss dominance, or persona overhead >10% of typical session context) |

## Residue

Open items deliberately *not* resolved in the ADR (tracked as follow-ups): the receipt schema design (Archie I3, owner Archie); the registry schema itself (I4 — owner named, schema deferred); the team-governance debate-artifact path fix (M2); Pierrot's threat model for shipped adapters (I6 — gates first canon adapter). Human ratification decides the ADR; none of these blocks it.
