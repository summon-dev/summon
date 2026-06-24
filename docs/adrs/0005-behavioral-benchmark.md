---
agent-notes: { ctx: "ADR: behavioral benchmark — outcome-graded, budget-matched control, pre-registered n, grader-as-unit-under-test contract", deps: [CLAUDE.md, docs/process/ponytail-harness-review.md, docs/adrs/0004-summon-doctor.md, .claude/commands/grill.md], state: active, last: "archie@2026-06-24" }
---

# ADR-0005: Behavioral Benchmark Architecture and the PROCESS-Grader Contract

## Status

Proposed (2026-06-24) — authored from the seven-agent direction review recorded in
`docs/process/ponytail-harness-review.md` (Tara/Debra/Wei/Pat lenses). **Pending an
Architecture Gate (Archie + Wei), Tara grader sign-off, and human acceptance** before code.
Implements the reframed form of GitHub issue #31. Its number is the input to issue #32b
(positioning), which must not cite it until this benchmark produces a defensible figure.

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
- **Process graders grade the causal trace, not artifact-existence.** "ADR before code" =
  the ADR-introducing commit is a strict ancestor of every commit touching the feature's
  implementation paths. Even then it is graded **`inferential`, not `deterministic`** — git
  order proves *commit* order, not *thought* order — and that residual gap is named in the
  rubric, per the Done Gate's proof-grade taxonomy. Add a **vacuity check** (the ADR's
  Decision/Consequences are non-empty and not template-identical; the failing test asserts
  something).
- **Result shape is shared with ADR-0004's `health`-check result** where practical
  (decide-once on a result/evidence envelope), even though neither is serialized to `--json`
  yet.

### 3. Negative-control families, and a meta-test that the control is alive

Each grader is validated offline (no API key) against a **family** of fixtures spanning the
distinct failure classes — not a single known-bad:

- (a) **artifact absent**,
- (b) **artifact present-but-vacuous** (the theater case — empty ADR, no-op test, a security
  flag that names a *decoy* unrelated issue),
- (c) **artifact present-but-out-of-order** (impl commit precedes the ADR commit),
- plus an **all-good** fixture that must score PASS.

The grader test suite **asserts the negative controls score MISS**. A negative control that
silently stops discriminating (someone "fixes a flaky grader" by loosening it) is a dead
control wearing a green light — so the meta-test is itself the sensor, per `/retro`'s
"encode the fix" ladder. The security-outcome grader specifically needs a decoy control: a run
where the lens flags an unrelated issue must score MISS, or the grader rewards security
theater.

### 4. Arms: a budget-matched control, not a strawman

Three arms, not two:

1. **Summon** — team-equipped.
2. **Budget-matched control** — same model, comparable turn/token budget, a generic
   "plan first, write tests, be careful" prompt, **no persona structure.** This is the arm the
   headline claim is measured against.
3. **(Optional) bare baseline** — minimal prompt, reported for context only.

**Tokens and turns per arm are logged and reported** so a reader can see the marginal effect
is not just "Summon spent 5× the compute." At least one outcome grader must be one the
budget-matched control can win, or the benchmark is circular.

### 5. Statistics: pre-registered, with confidence intervals, allowed to find nothing

- **≥5 task specs × ≥10 runs per arm.** Report per-task pass-rates with **Wilson or bootstrap
  confidence intervals**, not bare medians. For binary outcome graders, a paired test
  (McNemar across matched tasks) yields a real significance figure.
- **Pre-register** the primary metric, the run count, and the significance threshold in
  `benchmarks/README.md` **before** any live run — closes the garden-of-forking-paths exit and
  is squarely in Summon's "process rigor" brand.
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

### 7. Phasing

- **Phase 1 (buildable now, no API key):** `benchmarks/` scaffold, the three arms' harness,
  ≥5 task specs, the outcome + process graders, and the **offline grader fixture suite with
  its negative-control meta-tests**, green in CI. `benchmarks/README.md` documents the method
  and pre-registration honestly and states numbers are illustrative until Phase 2.
- **Phase 2 (deferred behind ANTHROPIC_API_KEY + budget):** live runs across models, recorded
  with CIs against the budget-matched control. Quality judgments that aren't mechanically
  gradable ("is this the right architecture?") use a **separately validated LLM-judge**
  (inter-rater agreement vs. a human-labeled set, position-bias checks) — budgeted as part of
  Phase 2, never smuggled in unvalidated. Treat Phase 2 as research, not a weekend.

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
- Causal-trace graders couple the benchmark to git topology and to how the arms commit. A run
  that squashes everything into one commit defeats ordering checks; the harness must control
  commit granularity per arm. Noted as an implementation constraint.
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

### Open questions (for the Architecture Gate)

- What are the ≥5 task specs, and who authors them without unconsciously picking tasks where
  process visibly helps (the task-design Goodhart trap, Debra)?
- Does the harness commit per-arm in a way that makes causal-trace grading fair across arms
  that naturally commit differently?
- Is a shared result/evidence envelope with ADR-0004 worth pinning now, before either is
  serialized?
