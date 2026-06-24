---
agent-notes: { ctx: "ADR: outcome-graded benchmark, budget-matched control, slice-first phasing, causal-trace deferred; passed gate", deps: [CLAUDE.md, docs/process/ponytail-harness-review.md, docs/adrs/0004-summon-doctor.md, .claude/commands/grill.md, docs/tracking/2026-06-24-doctor-benchmark-gate-debate.md], state: active, last: "archie@2026-06-24" }
---

# ADR-0005: Behavioral Benchmark Architecture and the PROCESS-Grader Contract

## Status

Proposed — passed Architecture Gate (Archie/Wei debate, 2026-06-24); awaiting human approval.

Authored from the seven-agent direction review recorded in
`docs/process/ponytail-harness-review.md` (Tara/Debra/Wei/Pat lenses). **Tara grader sign-off
and human acceptance** still required before code. Implements the reframed form of GitHub issue
#31. Its number is the input to issue #32b (positioning), which must not cite it until this
benchmark produces a defensible figure.

Debate record: docs/tracking/2026-06-24-doctor-benchmark-gate-debate.md

## Context

Issue #31 proposes a behavioral benchmark so Summon can make a credible, reproducible claim
that using the team beats not using it — modelled on ponytail's `promptfoo eval`. As written,
#31 grades **process compliance** ("was an ADR written before code?", "did a failing test
precede implementation?") against a "bare Claude Code" baseline. The review found this design,
if run as-is, produces a number that **reduces** credibility rather than building it. Four
structural problems:

1. **Construct invalidity (Wei, Tara, Debra).** A grader that scores "was an ADR written
   before code?" measures whether the *ritual ran*, not whether the *outcome was better*.
   These diverge constantly: a team can write a perfect ADR and architect the wrong thing, or
   skip it and ship the right thing. For a framework whose whole pitch is "process produces
   better outcomes," a benchmark that can't tell good outcomes from obedient theater launders
   the pitch instead of defending it — the textbook Goodhart failure.

2. **A rigged A/B (Debra).** Summon is *defined* as the process the process-graders score, so
   a bare-Claude baseline that is never *asked* to produce ADRs loses ~0 by construction. The
   delta is then an artifact of the rubric, not a finding. Baseline and Summon arms also differ
   in agents, turns, token budget, and prompt scaffolding simultaneously, so a win cannot be
   attributed to *the framework* rather than *more compute*.

3. **Fakeable signals (Tara).** "ADR exists at HEAD" passes on a repo where the agent wrote
   the code first and **back-dated** the ADR. A failing test that "precedes implementation"
   but asserts nothing (`expect(true).toBe(true)`) passes an existence check. Existence and
   even ordering checks reward theater unless they assert on a tamper-evident causal trace.

4. **Anecdotal n (Debra).** LLM runs are stochastic; "≥3 task specs, record medians" cannot
   distinguish signal from noise. A median over 3 single runs is essentially noise.

Real-world precedent the review surfaced: a
[Scott Logic post](https://blog.scottlogic.com/2026/06/16/ponytail-yagni-and-the-problem-with-prompt-benchmarks.html)
beat ponytail's own benchmark with seven words ("follow YAGNI, one-liners") and forced the
author to revise claims under pressure. A process-only benchmark invites exactly that.

The instinct in #31 that survives review: **"the grader is the unit under test — validate it
offline"** (red/green, no API key, known-good + known-bad fixtures). That discipline is
correct and is preserved below. It is the *rubric* that needs redesign, not the test-the-grader
philosophy.

## Decision

### 1. Two grader tracks; the headline claim rests on OUTCOMES

| Track | What it scores | Role |
|-------|----------------|------|
| **Outcome** (framework-agnostic) | Quality of the *result*, regardless of how produced: did the injected vulnerability survive to the final diff? do the tests actually pass? does the solution meet the spec's acceptance criteria? was a real defect introduced? | **The headline claim.** Bare Claude *can* win on these. |
| **Process** (mechanism) | Compliance: ADR-before-code, failing-test-first, which review lens fired | **Explanation only** — "*why* Summon caught more defects: the security lens fired." Never the published proof. |

Any public claim (#32b) cites an **outcome** number. Process metrics are reported as the
mechanism behind it, never as the result.

### 2. The grader contract (the unit under test)

A grader is a pure function with a pinned interface:

- **Input:** the run's repo state **plus its git history** (and, where available, a
  tamper-evident session/event log) — not just the filesystem at HEAD.
- **Output:** a per-rubric-item **verdict with evidence pointers** (file\:line, commit SHA,
  CWE/keyword span), not a bare score. "PASS because commit `abc` (the ADR) is an ancestor of
  commit `def` touching `src/order.ts`" — the evidence is part of the result so a skeptic can
  re-check it.
- **Causal-trace (ancestry-topology) grading is EXPLANATION-TRACK, DEFERRED-BY-DEFAULT —
  built on consumer demand, not in Phase 1.** Where a transcript's git history naturally
  exposes ordering ("ADR-introducing commit is a strict ancestor of the commits touching
  implementation paths"), an ancestry grader could **report** it as mechanism — but graded
  **`inferential`, never `deterministic`** (git order proves *commit* order, not *thought*
  order, and the Summon arm produces this topology by mandate while the control cannot — so it
  is a process artifact, not evidence of outcome quality). It contributes **zero to any
  published number** (Decision 1), and **the harness does NOT equalize commit topology across
  arms** — each arm commits as its prompt naturally drives it; giving the control staging
  instructions to "make the trace comparable" would inject Summon's commit discipline into the
  control and rig the A/B (Context §2). Because it is explanation-only, zero-to-the-number, and
  has **no consumer today**, the ancestry-topology grader is **not built in Phase 1**; it is
  deferred and built only if a real consumer of the explanation track appears (a published
  outcome win where a reader asks "*why* did Summon catch it?"). Building it now would be the
  same one-implementation-zero-consumers YAGNI breach Vik flagged on ADR-0004's `--json`
  envelope.
- **The framework-agnostic vacuity check IS built in Phase 1.** Independent of any ancestry
  grading: the ADR's Decision/Consequences are non-empty and not template-identical; a
  failing test asserts something (not `expect(true).toBe(true)`). This catches the theater
  case (empty ADR, no-op test) on *any* arm's artifacts, regardless of how it commits, and
  needs no cross-arm topology — so it earns its keep in Phase 1.
- **Result/evidence envelope — shared shape, pinned now, serialized later (coordinated with
  ADR-0004).** Both ADRs adopt a single envelope **shape**:
  `{ verdict, evidence: EvidencePointer[], schemaVersion }`, with
  `EvidencePointer = { kind: "file" | "commit" | "span", ref }`. The **verdict vocabulary is
  domain-specific**: graders use `PASS | MISS`; ADR-0004's doctor uses `ok | degraded | error`.
  Shape shared, verdict vocab domain-specific. **Neither ADR serializes this to `--json` yet**
  — 0004 keeps its exit-code v1, 0005 keeps offline graders — but the shape is decided once so
  the two evidence models cannot diverge before either hits the wire. This breaks the
  0004↔0005 mutual deferral (the mirror open question in 0004 is pinned identically).

### 3. Negative-control families, and a meta-test that the control is alive

Each grader is validated offline (no API key) against a **family** of fixtures spanning the
distinct failure classes — not a single known-bad:

- (a) **artifact absent**,
- (b) **artifact present-but-vacuous** (the theater case — empty ADR, no-op test, a security
  flag that names a *decoy* unrelated issue),
- plus an **all-good** fixture that must score PASS.

(The **artifact present-but-out-of-order** family — impl commit precedes the ADR commit —
attaches to the ancestry-topology grader, which is deferred-by-default and not built in
Phase 1 per Decision 2. Its fixture family arrives with the grader, if a consumer ever earns
it.)

The grader test suite **asserts the negative controls score MISS**. A negative control that
silently stops discriminating (someone "fixes a flaky grader" by loosening it) is a dead
control wearing a green light — so the meta-test is itself the sensor, per `/retro`'s
"encode the fix" ladder. The security-outcome grader specifically needs a decoy control: a run
where the lens flags an unrelated issue must score MISS, or the grader rewards security
theater.

### 4. Arms: a budget-matched control, not a strawman

Three arms, not two:

1. **Summon** — team-equipped.
2. **Budget-matched control** — same model, **budget matched per the pre-registered
   operationalization in `benchmarks/README.md` (§5: primary = task-relevant tokens, with a
   sign-sensitivity check across total-token and turn matching)**, a generic "plan first,
   write tests, be careful" prompt, **no persona structure.** This is the arm the headline
   claim is measured against.
3. **(Optional) bare baseline** — minimal prompt, reported for context only.

**Tokens and turns per arm are logged and reported** so a reader can see the marginal effect
is not just "Summon spent 5× the compute." At least one outcome grader must be one the
budget-matched control can win, or the benchmark is circular.

**Commit granularity is NOT a harness-controlled, cross-arm-equalized variable.** Each arm
commits as its prompt naturally drives it; the control is never given staging instructions to
"make the trace comparable," because doing so would inject Summon's commit discipline into the
control and rig the A/B (Context §2). Causal-trace topology is therefore an arm-characteristic
reported in the explanation track only (Decision 2), never a graded outcome and never
normalized across arms.

### 5. Statistics: pre-registered, with confidence intervals, allowed to find nothing

- **≥5 task specs × ≥10 runs per arm.** Report per-task pass-rates with **Wilson or bootstrap
  confidence intervals**, not bare medians. For binary outcome graders, a paired test
  (McNemar across matched tasks) yields a real significance figure.
- **Pre-register** the primary metric, the run count, and the significance threshold in
  `benchmarks/README.md` **before** any live run — closes the garden-of-forking-paths exit and
  is squarely in Summon's "process rigor" brand.
- **Pre-register the operationalization of "budget-matched" AND its sign-sensitivity check in
  `benchmarks/README.md` before any live run** — both are committed to the README before a
  single live run executes; a sensitivity check computed *after* seeing the data is itself a
  forking path and is explicitly disallowed. Three parts, all pre-registered: (1) the
  **primary** quantity held constant — *task-relevant tokens* (content touching the task: code,
  specs, reviews, ADRs; pure inter-agent coordination excluded from the *grant*, included in
  *reported cost*), with its fairness argument (holds *useful thinking* constant — neither
  total-bill matching, which taxes multi-agent coordination, nor unlimited compute, which is
  "just more compute"); (2) two **alternative** definitions named up front — total-token-matched
  and turn-matched; (3) the **sign-sensitivity check**, defined before the run: the headline
  comparison is rerun under all three definitions, and **if the sign of the effect flips under
  any definition, the published statement is "definition-sensitive," not a win.** Coordination
  tax is reported separately as the price of the structure.
- The analysis **must be allowed to return "no significant difference."** If the CI crosses
  the control, the published statement is the null, and #32b cites no number.
- **Include ≥1 adversarial task** where methodology should *not* help (a trivial one-liner,
  or a task where process is waste) and report it. A benchmark that only ever shows the
  framework winning is a marketing asset, not a measurement.

### 6. Grader integrity review

Because a grader that subtly favors the Summon arm is the exact "false green" this initiative
exists to kill, the grader rubric and fixtures get an **adversarial review by Pierrot and Vik**
before any live run — the same `/grill` question turned on the graders themselves: *"what
realistic wrong implementation still passes this grader?"*

### 7. Phasing — slice-first, earn the apparatus

- **Phase 0 (thin slice, real transcripts, cheap):** Build **one** outcome grader —
  *injected-vulnerability-survives-to-final-diff* — with **one all-good + one known-bad
  fixture** (negative control, asserts MISS). Run it against **~3 real transcripts per arm**
  (Phase-2-lite: one task, one model, no CIs claimed). This is the first contact with reality
  and the **go/no-go for the rest of Phase 1.** Cost: a handful of sessions, single task. A
  single grader with zero negative control is a dead control wearing a green light — so even
  the slice carries exactly one, no more.
- **Earn-gate (explicit):** Phase 0 must show (a) the grader's verdict matches a human read of
  those ~9 transcripts, and (b) at least one real failure mode the slice grader *missed*. If
  the grader needs material redesign after real transcripts — it will — that redesign happens
  **before**, not after, the fixture families and meta-tests are built. Only a grader that
  survives real transcripts earns the full apparatus.
- **Phase 1 (full offline apparatus, gated on Phase 0, no API key):** the `benchmarks/`
  scaffold, the three-arm harness, ≥5 task specs, the **outcome graders + the
  framework-agnostic vacuity check** (Decision 2), and the **negative-control fixture families
  + meta-tests** (Decision 3), plus the adversarial Pierrot/Vik grader review (Decision 6) —
  all built against grader designs that already survived Phase 0. **The ancestry-topology
  (causal-trace) grader is NOT built here** — it is explanation-only, zero-to-the-number, and
  has no consumer (Decision 2); it is deferred until one appears. Green in CI;
  `benchmarks/README.md` documents the method and pre-registration honestly and states numbers
  are illustrative until Phase 2.
- **Phase 2 (deferred behind ANTHROPIC_API_KEY + budget) — pre-registered MVP with a pilot
  go/no-go**, not the full matrix up front:
  - **MVP Phase 2:** 1 task × 1 model × 2 arms (Summon + budget-matched control). **Pilot:**
    5 paired runs/arm; compute the n needed for a Wilson/McNemar CI excluding zero at the
    pre-registered threshold (≈20–30/arm typical). **Go/no-go:** if the pilot effect sits
    inside noise, STOP — publish the null, #32b cites no number. Rough cost: **~50 sessions,
    low-hundreds-of-dollars, multi-day.**
  - **Full Phase 2 (aspirational, gated on MVP signal):** ≥5 tasks × ≥10 runs × ~3 arms × 2–3
    models + a **separately validated LLM-judge** for quality judgments that aren't
    mechanically gradable ("is this the right architecture?") — inter-rater agreement vs. a
    human-labeled set, position-bias checks, budgeted as part of Phase 2, never smuggled in
    unvalidated. **The judge's human-labeled ground-truth set is labeled by, or blind-audited
    by, someone other than the task-spec author:** at minimum a blind label audit — a second
    labeler (or an adversarial Pierrot/Vik reviewer, Decision 6) re-labels a random subset
    *without seeing the task author's labels or the framework framing*, and disagreement above
    a pre-registered rate **invalidates the judge** until reconciled. Inter-rater agreement is
    reported between independent labelers, never between two framework-believers — agreement
    among believers measures shared bias, not truth (the task-design Goodhart trap, one layer
    down). Rough cost: **300–450 sessions, multi-week, quarter-scale.** Only funded if the MVP
    shows an effect worth scaling. This is research, not a weekend.

## Consequences

### Positive

- The published claim rests on an outcome a buyer cares about (defects caught, vulns flagged),
  measured against a fair control with real n — the kind of number that survives the
  "reproduce it yourself" reader ponytail's own benchmark did not.
- Back-dating, vacuous artifacts, and decoy security flags are caught by the causal-trace +
  vacuity + negative-control-family design, instead of passing an existence check.
- Phase 1 is genuinely buildable now and low-risk; the offline grader red/green discipline is
  the strongest part of the original #31 and is kept.
- The "allowed to find nothing" + pre-registration design means a null result is a credible
  outcome, not a failure to hide — which is what makes a positive result believable.

### Negative

- This is materially more work than #31's process-only design: outcome graders, a third arm,
  ≥5×10 runs, an LLM-judge with its own validation. Accepted because the cheaper design
  produces an attackable number, and an attackable number is worse than none.
- Causal-trace topology is a Summon-arm characteristic produced by its commit mandate
  (CLAUDE.md), not a fair cross-arm signal. We therefore **demote causal-trace grading to the
  explanation track with zero contribution to any published number, do NOT equalize commit
  granularity across arms, and do NOT build the ancestry-topology grader in Phase 1** (Decision
  2, 4) — it is deferred until a real consumer of the explanation track appears. The cost: we
  lose causal-trace as a *headline* "process produced this" proof, and any future explanation
  of *why* Summon wins (if it does) rests on `inferential` mechanism reporting a skeptic may
  discount. Accepted — the alternative (equalizing topology) imports Summon's process into the
  control and rigs the very A/B this ADR exists to make fair.
- **The benchmark can self-terminate at two cheap checkpoints (the Phase 0 earn-gate and the
  Phase 2 pilot) and produce no published number at all.** This is intended — Vik's
  reproducible transcript still unblocks #32a — but approving this ADR is approving a benchmark
  that may never publish a figure.
- **The sign-sensitivity check can kill the headline:** if the effect's sign flips between
  task-relevant-token and total-token matching, there is no publishable win, only
  "definition-sensitive." Real for a multi-agent system with high coordination tax. Accepted —
  that outcome is a finding, and pre-registering it is what makes a surviving win credible.
- **The shared result/evidence envelope is pinned as a shape with no serialization and no
  consumer** — a mild YAGNI exposure. Mitigated: shape-only, costs one type, strictly cheaper
  than reconciling two divergent evidence models post-hoc once either ADR finally serializes.
- Vik's cheaper alternative — **one honest, reproducible before/after transcript** — makes the
  qualitative claim at ~1/10 the cost and is what unblocks #32a *now*. This ADR does not
  replace that: ship the transcript for #32a immediately; build this benchmark only to defend
  the claim *at scale* with a defensible number for #32b. Do not let the harness block the
  transcript.

### Neutral

- Phase 2 stays gated behind budget; #32b stays gated behind a defensible Phase-2 number. The
  positioning rewrite's qualitative half (#32a) proceeds independently (see the decision
  record's split of #32).
- Whether the LLM-judge is needed at all depends on which outcome graders prove mechanically
  sufficient in Phase 1 — decided by what the fixtures show, not assumed here.

### Open questions (carried past the Architecture Gate, for Phase 0/1 authorship)

- What are the ≥5 task specs, and **who authors them — and who labels the LLM-judge's ground
  truth —** without unconsciously selecting for cases where process visibly helps (the
  task-design Goodhart trap, Debra)? Both the task specs and the judge's gold labels need an
  author independent of (or blind-audited against) the framework-believer; see Decision 7
  LLM-judge clause.

*Resolved at the gate (Archie/Wei, 2026-06-24):*

- *Cross-arm commit fairness* — resolved: the harness does **not** equalize commit topology;
  causal-trace grading is explanation-only, zero-to-the-number, and the ancestry grader is
  deferred-by-default (Decision 2, 4).
- *Shared result/evidence envelope with ADR-0004* — resolved: pin the **shape**
  `{ verdict, evidence[], schemaVersion }` now, domain-specific verdict vocab, serialize on
  first consumer (Decision 2).
