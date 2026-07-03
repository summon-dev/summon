<!-- agent-notes: { ctx: "Architecture Gate debate record for ADR-0006 (multi-runtime install)", deps: [docs/adrs/0006-multi-runtime-install.md, .claude/agents/wei.md, docs/adrs/0004-summon-doctor.md], state: complete, last: "claude@2026-07-02" } -->

# Debate: Multi-Runtime Install, Manifest, and Generation-as-Projection

**ADR:** docs/adrs/0006-multi-runtime-install.md **Date:** 2026-07-02 **Participants:** Archie (author) vs Wei (challenger), both invoked as standalone agents **Trigger:** ADR-0006 ratifies the design that ~13 open epic issues (#7, #8, #13, #16, #17, #18) cite as "ADR-0004 § Generation Model / § CLI Surface / § Additional Decisions #6 / OQ #7" — sections that do not exist in the ratified ADR-0004 (the doctor decision). The gate's job was to author the missing document.

## Round 1 — Wei's Challenges

Wei verified the ADR's load-bearing citations against the actual code before challenging (`packages/summon-team/src/doctor.ts`, `src/index.ts`).

1. **Generator built for zero demonstrated demand + zero fidelity proof** _(serious)_. Technique: cost-of-being-wrong + historical precedent (ADR-0004 killed the `--json` envelope as "a contract with one implementation and zero consumers"). The 13 issues are not 13 users; they cite a phantom ADR. The ADR defers the actual `.claude/*`→Copilot mapping to "when the generator is built," so it ratifies a maintained component without proving one persona projects faithfully. Claude agent frontmatter (`tools`/`model`/`maxTurns`/`disallowedTools`) has no obvious Copilot `*.agent.md` equivalent — "semantically lossy" is the default outcome, unchecked. **Demand to cut:** hand-author a one-persona `.github/*` example + mapping table now (serves the first user *and* is the fidelity proof); build the generator only when a real Copilot user asks and fidelity holds.

2. **`manifestVersion` justification is false** _(serious on the citation; minor on the field)_. Technique: citation check + historical precedent. Decision #6 claimed the field "mirrors `doctor.ts`'s `schemaVersion` discipline." But `DOCTOR_SCHEMA_VERSION` is internal/in-memory and ADR-0004 Decision 3 explicitly does **not** serialize it — so the precedent cuts the *opposite* way. A field serialized day one with zero migrations is the `--json` pattern Vik killed. **Counter:** cut the field with "absent = v1", or keep it but strike the false citation and re-justify honestly.

3. **Case A writing a manifest contradicts "byte-for-byte today's behavior"** _(serious — internal contradiction)_. Technique: assumption surfacing + inversion. Decision #3 Case A writes the manifest; Additional Decision #1 and the Positive consequences claim Case A is "byte-for-byte today's behavior / default path untouched." A new `.summon/manifest.json` in a repo that today gets none is not byte-for-byte. A claude-only install is re-derivable from "`.claude/` present, no `.summon/`." **Counter:** write the manifest only when generation occurs (B/C).

4. **sha256 hand-edit detection false-positives on the first Windows clone** _(serious)_. Technique: assumption surfacing + scale attack. Refusing to overwrite a file whose on-disk sha256 differs assumes on-disk bytes equal generator-written bytes. `core.autocrlf=true` (Windows default) rewrites LF→CRLF on checkout, so every generated `.md` mismatches on a *fresh clone* — `update` reports the whole tree as hand-edited. **Counter:** hash normalized content (LF, single trailing newline, content-only) and state the normalization as contract.

5. **Case C wrongly inherits Case B's "generated = damage-detect" governance** _(serious)_. Technique: inversion + assumption surfacing. Damage-detection is sound in Case B (has a local source + CI). Case C has neither: the user can't edit at source (none exists), and editing the output — their only artifact — makes `update` fight them. Case C is doubly crippled. **Counter:** in Case C, classify `.github/*` as copied/user-owned (diff-prompt), not generated; or state plainly Case C is a non-customizable consumption tier.

6. **`generatorVersion` is a second speculative version field** _(minor)_. Technique: inversion + cost-of-being-wrong. It tracks a divergence that doesn't exist (example shows both versions equal; generator ships inside `summon-team` today, so its version *is* `summonVersion`). **Counter (cut):** drop it until the generator is a separately-released artifact.

**Wei's concessions (could not break):** single-source-of-truth + projection over hand-maintained copies (drift is Summon's real recurring failure — `check-canon` exists for it); deferring the three-way merge (OQ #7) while recording base checksums; `--target` defaulting to `claude` as additive (conditional on fixing #3); rejecting the vendored-template alternative on rot grounds. Wei held **no veto**, but asked that challenges 1, 3, 4, 5 be answered on the record before Accepted.

## Round 2 — Archie's Responses

| # | Verdict | Resolution in the ADR |
|---|---------|-----------------------|
| 1 | **Accept core / reject never-build** | New **§ Phasing**: Phase 0 hand-authors a one-persona projection + mapping table (serves the first user *and* is the fidelity proof); Phase 1 builds the generator + Cases B/C only once fidelity holds and a real Copilot user asks. Design stays ratified so #7/#8 proceed; `--target` can route `copilot`/`both` to a "not yet — see Phase 0" stub. |
| 2 | **Accept** | Struck the "mirrors `doctor.ts`" line, noted it cut the opposite way, re-justified honestly (a serialized, re-read, persistent file earns a discriminator even at v1); added **absent field reads as v1**. |
| 3 | **Accept** | Case A now writes **no manifest**; it appears only on B/C or a later `add copilot`. "Byte-for-byte" is now literal. |
| 4 | **Accept** | Checksums are now over **normalized content** (LF, single trailing newline, content-only), stated as contract, with the `autocrlf` fresh-clone rationale. |
| 5 | **Accept reclassify / reject fold-into-`both`** | Governance keys on whether a local source exists: Case B `.github/*` = damage-detect; Case C `.github/*` = user-owned diff-prompt. Case C kept, explicitly labeled a consumption tier. |
| 6 | **Accept** | Removed `generatorVersion` from the schema; documented that it earns a place only when the generator is a separately-released artifact. |

## Resolution

- **Resolved by ADR change:** all six challenges. Correctness defects (#2 false citation, #3 contradiction, #4 line-ending flaw) fully fixed; scope/design challenges (#1, #5, #6) resolved via the phasing model and the source-presence governance rule.
- **Accepted as standing risk:** the Copilot mapping is lossy by default (no `*.agent.md` equivalent for some Claude frontmatter) — Phase 0's documented mapping table characterizes the loss against one hand-authored persona before any generator is built.
- **Rejected:** never build the generator (Wei's maximal cut) — the projection *design* is ratified now so `--target`/manifest work can proceed; only the *build* is gated. Folding Case C into `both` — rejected in favor of reclassifying Case C's files as user-owned.
- **Round 3:** not run. Archie adopted Wei's counter-proposals on all four flagged challenges (1, 3, 4, 5) substantially as proposed, so a rebuttal round was judged unnecessary. Human approval is the final gate step.

## Outstanding for human approval

- Ratify the phasing model (Phase 0 fidelity proof before the generator is built).
- Confirm Case C should exist as a non-customizable consumption tier.
- On approval: set the ADR `state` to `accepted` and update the epic issues (#7, #8, #13, #16, #17, #18) to cite **ADR-0006** instead of the phantom "ADR-0004 §…".
