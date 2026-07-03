---
agent-notes:
  ctx: "Architecture Gate debate record — ADR-0004 (doctor) + ADR-0005 (benchmark)"
  deps: [docs/adrs/meta/0004-summon-doctor.md, docs/adrs/meta/0005-behavioral-benchmark.md, docs/history/ponytail-harness-review.md, docs/process/team-governance.md]
  state: active
  last: "coordinator@2026-06-24"
---
# Architecture Gate Debate — `summon doctor` (ADR-0004) & Behavioral Benchmark (ADR-0005)

**Date:** 2026-06-24 **Protocol:** `docs/process/team-governance.md` § Architecture Decision Gate (multi-round Archie/Wei debate). **Participants:** Wei (devil's advocate, standalone), Archie (author, standalone), coordinator (synthesis + edits). **Rounds:** R1 Wei challenges (parallel, per-ADR) → R2 Archie point-by-point responses → R3 Wei rebuttal on new/inadequately-addressed surfaces. **Outcome:** Both ADRs pass the gate. **Status: Proposed — passed gate, awaiting human approval** (the final checklist item). Both blocks conceded in full; one new surface (0004) replaced, one Phase-1 cut adopted (0005).

These ADRs were authored from the seven-agent direction review (`ponytail-harness-review.md`). The gate's value-add: Wei verified each ADR's premises **against the actual code**, and found that *both* had inherited a real flaw from the issues they reframed — which the direction review did not catch.

---

## Part A — ADR-0004: `summon doctor`

### Round 1 — Wei's challenges (numbered)

- **C1 (BLOCK) — "doctor travels with the CLI binary" is false; repeats Bug B one level up.** Verified: `packages/summon-team/src/index.ts` is a one-shot `npx` scaffolder (single `bin`, no subcommand router; deletes `package.json` + `packages/`, lines 24-29/154-162) invoked once at creation and never re-installed downstream. Making doctor a subcommand of it does not make doctor reachable in a scaffolded project. *(Technique: citation check + assumption surfacing.)*
- **C2 — should ANY health registry vendor downstream?** A frozen copy rots the day Summon's canon evolves (no update channel); and `health` checks assert the user hasn't diverged from a layout whose *purpose* is to diverge. *(Inversion.)*
- **C3 — "layout-tolerant" health checks false-fire against a real diverged app.** `/command`-in-prose false positives; "tracking adapter reachable" is a non-deterministic network/credential probe masquerading as health; agent-notes-deps fires on the user's own app code. The all-green fixture drawn from Summon's own layout is a rigged control for a portability claim. *(Scale attack.)*
- **C4 — "defer the envelope until a consumer exists" — but the ADR names the consumer** ("so agents can probe it"). Exit-code-only forces an agent to screen-scrape stdout. *(Assumption surfacing.)*
- **C5 — `schemaVersion` documents a breaking change, doesn't prevent one.** The exit-code→envelope transition is itself the break for a stdout-scraper. *(Cost-of-being-wrong.)*
- **C6 — open questions.** OQ1: keep `canon` unreachable from the shipped artifact. OQ2: "don't design the envelope" vs "align result shape with ADR-0005 now" are in tension.
- **C7 — risk-tier check rests on an unimplemented dependency.** The `<!-- risk-tier: N -->` field is not in `CLAUDE.md` yet (ADR-0003 "Not yet implemented"); the check would false-FAIL Summon's own repo today.

### Round 2 — Archie's responses

Archie verified C1 against the code and **conceded the block in full**, adopting Wei's on-demand model. Per-challenge resolution:

| # | Resolution | Change |
|---|-----------|--------|
| C1 | **Accept-and-change** | Decision #1 rewritten: doctor is a **second invocation mode** `npx summon-team@latest doctor` run **on-demand against `cwd`**, nothing vendored, scaffold path unchanged. |
| C2 | **Accept** (resolved by C1) | On-demand = no frozen copy = cannot rot. `health` "Ships downstream?" → "run on-demand from current release." |
| C3 | **Accept-and-change** | `health` checks "Summon-managed wiring present & consistent, not layout-match"; scope to `.claude/`+`docs/`; fenced-token-only `/command`; **drop** the non-deterministic tracking-reachability check; all-green fixture must be a **non-Summon-shaped diverged project**. |
| C4 | **Accept-and-change** | Stop claiming "no consumer"; re-justify deferral as "consumer anticipated (a go/no-go gate), exit-code serves the gate; envelope earns its keep only for per-check programmatic remediation." |
| C5 | **Accept-and-change** | Binding constraint: envelope is **additive-only behind `--json`**, exit-code/stdout preserved verbatim → no break to price. |
| C6 | **Accept-and-change** | OQ1: separate maintainer entrypoint. OQ2: decide the **internal result struct now**, defer only the serialized envelope. |
| C7 | **Accept-and-change** | Hard sequencing: risk-tier check **not in v1 `health`**; blocked behind ADR-0003 R1. |

### Round 3 — Wei's rebuttal

Wei confirmed **6 of 7 clean**, with one **live gap**: Archie's R2 introduced a *new* heuristic — detecting "am I at Summon's repo root?" via `packages/summon-team/` presence to decide whether `canon` runs. Wei attacked it as a fragile reintroduction of the environment-sniffing anti-pattern: it **leaks** `canon` into any downstream project with a `packages/` path, and **misses** at Summon root (the scaffolder deletes `packages/`, and "fail toward health-only" silently skips the drift-guard where it's mandatory).

**Resolution (adopted):** Wei's **option 1** — `canon` is **never registered in the shipped `doctor` entrypoint**; the `npx ... doctor` path imports only `health`; maintainer `canon` runs solely via the in-repo `pnpm check:canon`. The boundary is *what's compiled into the shipped entrypoint*, not a runtime cwd guess. With that, Wei holds **no block**.

---

## Part B — ADR-0005: Behavioral Benchmark

### Round 1 — Wei's challenges (numbered)

- **C1 — Phase 1 may be the over-engineering the review fights.** "A test suite for a grader for a benchmark," validated against synthetic fixtures the authors wrote, before a single real transcript shows whether the grader design survives reality. *(Inversion.)*
- **C2 (BLOCK) — causal-trace grading reintroduces the circularity the ADR claims to kill.** The Summon arm produces ADR-ancestor-of-impl topology *by mandate* (CLAUDE.md); the control structurally cannot. "Harness controls commit granularity per arm" makes it worse — equalizing topology injects Summon's process into the control. *(Cost-of-being-wrong.)*
- **C3 — "budget-matched" may be undefinable → headline unfalsifiable.** Turns/tokens aren't fungible across a multi-agent arm and a single-agent control; whichever quantity you match decides the result. *(Assumption surfacing.)*
- **C4 — Phase 2 may be specified-but-never-runnable** (≥5×≥10×~3 arms×2-3 models + a labeled LLM-judge = quarter-scale), permanently blocking #32b. *(Scale attack.)*
- **C5 — (a)** the LLM-judge relocates subjectivity (who labels ground truth?); **(b)** the shared-envelope deferral is **circular** across 0004/0005 (each defers to the other).

### Round 2 — Archie's responses

Archie **conceded C2 in full** (it was a contradiction inside his own Decision section). Per-challenge:

| # | Resolution | Change |
|---|-----------|--------|
| C1 | **Accept-and-change** | Real-transcript-first: **Phase 0** thin slice (one outcome grader + one negative control, ~3 real transcripts/arm) + an **earn-gate** before building the fixture-family/meta-test apparatus. |
| C2 | **Accept-and-change** (block resolved) | Causal-trace grading **demoted to explanation-track only, zero to any published number, arms NOT commit-equalized**; leaking sentence removed; OQ2 deleted as answered-by-design. Vacuity check stays. |
| C3 | **Accept-and-change** | Pre-register the operationalization (primary = **task-relevant tokens**) + a mandatory **sign-sensitivity check** across total-token & turn matching; sign-flip → "definition-sensitive," not a win. |
| C4 | **Accept-and-change** | **MVP Phase 2** = 1 task × 1 model × 2 arms, 5-run pilot go/no-go, ~50 sessions / low-hundreds-of-dollars; full matrix gated behind MVP signal; cost estimate in the ADR. |
| C5a | **Accept-and-change** | Judge ground-truth **labeled/blind-audited by someone other than the task-spec author**. |
| C5b | **Accept-and-change** | Break the deadlock: pin shared shape `{ verdict, evidence[], schemaVersion }` **now** (verdict vocab domain-specific), serialize later — coordinated with ADR-0004. |

### Round 3 — Wei's rebuttal

Wei confirmed **no remaining block**, with one sharper recommendation and three verification items:

- **Causal-trace → CUT from Phase 1 (adopted).** Now explanation-only, `inferential`, zero-to-the-number, arms not equalized → a check with no consumer (the same YAGNI breach Vik flagged on 0004's envelope). Build the ancestry-topology grader **only on real explanation-track demand**; keep the framework-agnostic **vacuity check** + outcome graders in Phase 1.
- **C1 carve-out resolved** — one negative control in Phase 0 is the floor (`/grill`'s "is the proof alive?"), not premature; the *family* is correctly deferred.
- **Verify (folded into edits):** the sign-sensitivity check is **pre-registered** (not post-hoc); both ADRs name the **same** envelope shape.

---

## Gate Checklist (team-governance § Architecture Decision Gate)

- [x] **ADR written** — ADR-0004, ADR-0005.
- [x] **Wei invoked as standalone** — both ADRs, ≥2 challenge techniques each.
- [x] **Multi-round debate executed** — R1 challenges → R2 point-by-point → R3 rebuttal.
- [x] **Debate tracked** — this file.
- [x] **ADR updated** — both ADRs revised to reflect every resolution.
- [x] **Human approved** — approved 2026-06-24; both ADRs moved Proposed → Accepted.

---
*Both blocks (0004-C1, 0005-C2) were code-verified flaws inherited from issues #30/#31 and missed by the direction review — caught only by the adversarial gate. Both ADRs are materially stronger for it. Awaiting human approval to move Proposed → Accepted.*
