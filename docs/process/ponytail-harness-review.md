---
agent-notes:
  ctx: "team review of the ponytail/harness-engineering integration + decision record"
  deps: [CLAUDE.md, docs/process/cross-repo-lessons.md, docs/adrs/0004-summon-doctor.md, docs/adrs/0005-behavioral-benchmark.md, docs/adrs/template.md]
  state: active
  last: "coordinator@2026-06-24"
---
# Ponytail / Harness-Engineering Integration — Team Review & Decision Record

> **Status:** The four implementing commits on `claude/ponytail-harness-review-jwkucq`
> shipped **without** a decision record, ADR, or debate artifact — verified absent on
> 2026-06-24 (contrast `cross-repo-lessons.md`, which has all three). This document is the
> **retroactive team critique** of that initiative, run as seven standalone subagents on
> 2026-06-24, plus the resulting decisions. The already-merged commits are treated as a
> **spike to ratify-or-revert**, not settled canon.
>
> **Gating:** The three open follow-up issues (#30 doctor, #31 benchmark, #32 positioning)
> are **paused** pending ADR-0004, ADR-0005, and human acceptance. Two verified bugs (below)
> are cheap and unblocked.

---

## Section 1 — The Initiative (as found)

A remote Claude session attempted to integrate the "interesting pieces" of two external repos into Summon:

| Source | What was borrowed |
|--------|-------------------|
| **ponytail** (~8.5k-star repo) | (a) sharp positioning — a persona that doubles as a spec, numbers-above-the-fold defused with "reproduce it yourself", a concrete before/after; (b) a reproducible `promptfoo` benchmark; (c) `check-rule-copies.js`, a CI fitness function that fails on canon drift |
| **harness-engineering** (AI-Substrate, [guide](https://github.com/AI-Substrate/harness-engineering/blob/main/docs/guide/01-quick-start.md)) | repo-local "how this project wants to be operated" governance; `boot`/`doctor` readiness checks ("a cold human or agent can start your product and trust the result"); "grill agent done" / backpressure-decides-done; "encode the fix, not the memory" |

### Already merged (branch `claude/ponytail-harness-review-jwkucq`, 4 commits)

| Commit | Change | Source idea |
|--------|--------|-------------|
| `cd3b4dd` | `summon:` debt-marker convention (`docs/methodology/debt-markers.md`) + `scripts/harvest-debt.mjs`; `scripts/check-canon.mjs` CI drift-guard | ponytail (debt markers + check-rule-copies) |
| `e551b0e` | YAGNI/"laziness ladder" lens added to Vik + composite `code-reviewer` + Done Gate item 16 (15→16) | ponytail (pre-empt "Summon = ceremony") |
| `1d597d2` | Proof-graded Done Gate (deterministic/inferential/human-judgement) + new `/grill` command (Wei interrogates done, Tara judges) | harness-engineering (grill-agent-done, backpressure-decides-done) |
| `81a9c8e` | `/retro` encodes findings on an encoding ladder (sensor > issue > prose) | harness-engineering ("encode the fix, not the memory") |

### Proposed next (open GitHub issues, not yet built)

- **#30** — grow `check-canon` into a `summon doctor` deterministic health check (`pnpm doctor`, `--json` status envelope, negative-control fixture per check, CI-wired, ships to scaffolded projects).
- **#31** — behavioral benchmark harness: baseline (bare Claude Code) vs Summon arm, deterministic PROCESS graders, offline grader unit tests (no API key), phase-2 live runs deferred.
- **#32** — README/site positioning rewrite: lead with a persona + a single before/after artifact + a falsifiable reproducible claim wired to #31. Gated on #31.

---

## Section 2 — Team Critique & Decisions

Reviewed 2026-06-24 by **Cam** (vision), **Wei** (devil's advocate), **Archie** (architecture), **Vik** (YAGNI), **Tara** (test quality), **Pat** (product), and **Debra** (experiment design), each as a standalone subagent with its own lens. Full reasoning is in the session transcript; the verdicts and cross-cutting conclusions follow.

### Verdict tally

| Agent | Verdict | Sharpest call |
|-------|---------|---------------|
| Cam | Agree-with-changes (lean Redirect on process) | No decision record/ADR/debate — this was set unilaterally; run it through Summon's own gate |
| Wei | Agree-with-changes; Kill #32's framing, Redirect #31 | A process grader scores *theater, not outcomes* — Goodhart trap, fatal for a "process produces better outcomes" pitch |
| Archie | Agree-with-changes; **2 ADRs required before code** | The `--json` envelope is a public contract; "ships to scaffolded projects" is broken today (CLI deletes `package.json`/`packages/`) |
| Vik | Agree-with-changes; Cut #30's envelope, defer #31 | The `--json` envelope is "a contract with one implementation and zero consumers" — textbook YAGNI breach |
| Tara | Agree-with-changes; withholds grader sign-off on #31 | "ADR written before code?" passes on a back-dated ADR — grade git topology, not file existence |
| Pat | Agree-with-changes; Reprioritize | Process-only benchmark is the most attackable move; **split #32** (qualitative now, number later) |
| Debra | Agree-with-changes; #31 has a construct-validity hole | Baseline-vs-Summon is a rigged A/B unless compute is held constant; n≥3 medians is an anecdote |

**No agent rubber-stamped; none said scrap it.** The instincts are sound; the governance was skipped and the keystone (#31) is currently designed wrong.

### Cross-cutting conclusions

1. **Dogfood the gate (Cam, Archie, Tara, Debra).** A process-rigor product shipped process changes that skipped its own process. #30 and #31 each introduce a machine-consumed contract — exactly the class of decision the Architecture Decision Gate exists to force through an ADR. → **ADR-0004 (doctor) and ADR-0005 (benchmark) before any more code.**

2. **#31 must measure outcomes, not compliance (Wei, Tara, Pat, Debra).** A grader scoring "was an ADR written before code?" measures whether the ritual ran, not whether the result was better — the Goodhart trap, and especially corrosive here. Real-world precedent: a [Scott Logic post](https://blog.scottlogic.com/2026/06/16/ponytail-yagni-and-the-problem-with-prompt-benchmarks.html) beat ponytail's own benchmark with seven words ("follow YAGNI, one-liners"). The headline claim must rest on a **framework-agnostic outcome** (defect caught, injected vuln flagged), with process as explanation. Detail in ADR-0005.

3. **Ungate / split #32 (Vik, Pat).** The positioning rewrite is the cheapest, most reversible, highest-leverage item, blocked on the most speculative one. Split it: ship the qualitative before/after artifact now ("judge for yourself"); wire the falsifiable *number* in later as an additive edit once #31 produces a defensible one. This honors Cam's "don't cite invented numbers" rule without blocking the real work.

4. **Descope #30 (Vik, Archie, Pat).** Keep "rename `check:canon` → `doctor`, grow checks as real invariants appear." Cut the status taxonomy and per-check fixtures until a consumer exists; land the two *cheap* canon checks (command↔file existence, status-flow-string consistency) in `check-canon` now, independently. Detail in ADR-0004.

5. **Collapse the ceremony accumulation (Vik).** Simplicity is now enforced in four places (Vik's agent, the composite reviewer, Done Gate item 16, `/grill`); "encode the fix" is stated in three (`/retro`, Done Gate, `debt-markers.md`). One canonical home each, the rest reference it — restated rules drift, the exact bug `check-canon` exists to catch.

### Decision table

| Item | Decision | Form (where it lands) | Owner |
|------|----------|------------------------|-------|
| **Ratify spike** | The 4 merged commits are a spike. Keep #cd3b4dd (check-canon, the exemplar) and #1d597d2 (proof-graded Done Gate). Dedupe the simplicity lens (4→1+refs) and "encode the fix" (3→1+refs). `/grill` and the YAGNI lens stay but stop being re-stated. | This decision record + edits to `vik.md`/`code-reviewer.md`/`done-gate.md`/`retro.md` | coordinator |
| **Bug A** | **ADOPT NOW** — extend `check-canon`'s Done-Gate-count scan to cover `README.md`, `CHANGELOG.md`, and `site/`; fix the 6 stale "15-item" strings. | `scripts/check-canon.mjs` + the stale files | Sato |
| **Bug B** | **ADOPT NOW (record)** — the "ships to scaffolded projects" premise in #30 is false today (CLI `EXCLUDE_FILES`/`EXCLUDE_DIRS` delete `package.json` + `packages/`). Resolution decided in ADR-0004. | ADR-0004 | Archie |
| **#30 doctor** | **ADR-0004 (Proposed)** — home, canon-vs-portable check split, exit-code v1 contract; `--json` envelope **deferred** until a real consumer exists. | `docs/adrs/0004-summon-doctor.md` | Archie |
| **#31 benchmark** | **ADR-0005 (Proposed)** — outcome track + budget-matched control + real n + pre-registration + grader contract. Phase 1 offline only. | `docs/adrs/0005-behavioral-benchmark.md` | Archie + Tara + Debra |
| **#32 positioning** | **SPLIT** — #32a (qualitative before/after + ICP + anti-use-case + FAQ) ships now; #32b (wire the number) gated on ADR-0005 Phase 2. Ungate #32a from #31. | Update issues #32 → #32a/#32b | Pat |
| **Older CLI/copilot issues (#11–#27)** | **DEFER** until the positioning bet resolves — distribution multiplies a thing we haven't yet proven people want (Pat). | board | Pat + Grace |

### Verified bugs (checked against the code, not relayed on trust)

- **Bug A — `check-canon` has a blind spot on the marketing surface.** Its Done-Gate-count check scans only `["CLAUDE.md", "docs/process/done-gate.md", "docs/process/gotchas.md"]` (`scripts/check-canon.mjs:71`). The gate is now 16 items, but six stale "15-item" strings survive outside the scan: `README.md:51`, `CHANGELOG.md:17`, `docs/adrs/0003-project-risk-tiers.md:18`, `site/src/content/docs/index.mdx:65`, `site/src/content/docs/methodology/phases.md:17,57`, `site/src/content/docs/getting-started/how-it-works.md:45`. The fitness function introduced as the poster child for "encode the fix" cannot pass its own first real drift. (Note: the ADR-0003:18 and phases.md historical references to "the 15-item Done Gate" may be intentional period references — triage each rather than blind-replacing.)
- **Bug B — `summon doctor` cannot ship downstream as #30 claims.** The CLI (`packages/summon-team/src/index.ts:24-29`) puts `package.json` in `EXCLUDE_FILES` and `packages` in `EXCLUDE_DIRS`. A scaffolded project therefore receives `scripts/check-canon.mjs` but **no `pnpm doctor` script and no workspace** to run it — and the canon checks are hardcoded to Summon's own layout anyway. Resolution: ADR-0004 makes doctor a CLI subcommand that travels with the binary.

### Sequencing

1. **Now (no ADR):** Bug A fix; spike-ratification dedupes (conclusion #5). Cheap, reversible.
2. **ADR-0004 → #30 descoped:** rename + cheap canon checks; defer the envelope.
3. **ADR-0005 → #31 Phase 1:** offline-validated graders + outcome track + fair control + CI. Phase 2 (live runs) deferred behind key + budget.
4. **#32a now / #32b after ADR-0005 Phase 2:** qualitative artifact ships first; the number is additive.
5. **Architecture Gate:** ADR-0004 and ADR-0005 go through Archie + Wei before acceptance; human approves. Only then do they move from Proposed → Accepted.

### Acceptance criteria (Pat) — "was this worth doing?"

A single falsifiable KPI for the whole initiative, measured over the next 2 sprints:

> **A net-new solo dev landing cold on the README can within 5 minutes (a) state who Summon
> is and isn't for and (b) point to one concrete artifact showing the team caught or
> prevented something bare Claude Code did not.**

- **Kill criterion:** if the before/after artifact can be neutralized by a skeptic in one tweet ("that's just YAGNI in a prompt"), the positioning bet is wrong — stop polishing copy and go fix the framework instead.
- **Benchmark kill criterion (Debra):** if the pre-registered outcome metric shows no significant difference between Summon and the budget-matched control across ≥5 tasks × ≥10 runs, do **not** publish a number — report the null and reconsider the claim.

---
*Reviewed and recorded 2026-06-24. The four implementing commits remain a spike pending ratification; #30/#31/#32 are paused behind ADR-0004 and ADR-0005. This document is the decision record the initiative skipped.*
