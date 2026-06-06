---
agent-notes:
  ctx: "cross-repo audit of summon usage + team decision record"
  deps: [CLAUDE.md, docs/process/team-governance.md, docs/process/done-gate.md, docs/process/gotchas.md, docs/adrs/template.md]
  state: active
  last: "coordinator@2026-06-06"
---
# Cross-Repo Audit — What Real Deployments Teach Summon

> **Status:** Section 1 is the original evidence-backed audit. Section 2 is the team's
> critique and the resulting decisions (the team reviewed the audit as standalone
> subagents on 2026-06-06).
>
> **Wave 1 implemented 2026-06-06** (decisions #3, #7, #1-reshaped, #5, #4) — landed in
> `CLAUDE.md` and `.claude/agents/{sato,tara,code-reviewer,wei}.md`. See the "ADOPT NOW"
> rows in the Decision table below. **Wave 2 (R1 risk-tier → #2 → S1 → M1) remains gated
> behind ADRs and not started.**

---

## Section 1 — The Audit

### Provenance

Two sibling repos in the `claude-apps` holder directory, both bootstrapped from summon:

| Repo | Domain | Scale at audit | Key artifacts (for re-verification) |
|------|--------|----------------|-------------------------------------|
| `predictasaurv2` | Prediction/analysis pipeline (TS monorepo) | 7 sprints, ~101 commits, 2367+ tests | `docs/retrospectives/2026-02-20-process-violation-plan-bypass.md`, `2026-06-01-watchlist-feature-and-process.md`; `docs/adrs/template.md` (no worked-example section) |
| `alpaca-trader` | Options trading (Python, live broker API) | ~2 sprints, ~90 commits, 608 tests | `docs/methodology/subagent-briefing.md`, `docs/retrospectives/2026-05-16-wave-c1-c2-and-adr-0010-amendment.md`, `docs/adrs/0006-wei-review.md` |

**Method:** two read-only exploration agents mined retros, gotchas, ADRs, handoffs, and
git history in each repo, then findings were cross-checked against summon's current state.

### The one finding with genuine cross-repo convergence

**Subagent output truncates silently on multi-file work.** Both repos hit this
independently and built mitigations (alpaca: `subagent-briefing.md`, ~50% truncation
measured; predictasaurv2: "verify agent reports via `git status` + tests, never trust the
report," reports truncated ~4×). This is the only N=2 finding. **Everything else below is
single-repo evidence** (mostly alpaca, several from one session) — strong enough to
consider, not strong enough to call a law. (Credit: Wei flagged that the original draft
over-applied the "convergence" framing to all seven gaps.)

### Behavioral lessons (coordinator operating habits — not fixable by docs alone)

1. **Treat subagent output as untrusted until independently verified** — after any agent
   wave, run `git status` + the real test/typecheck command. Truncation is silent, and a
   truncated *security/test* report that reads "looks clean" is a false green (Pierrot).
2. **Prefer file-based agent reports.** CLAUDE.md § Session Management already says
   "background agents write to files; read summaries." Enforcing this in the spawning
   personas is the actual fix for truncation (Vik) — the rest is mitigation.
3. **Run the Session Entry Protocol even when handed a detailed plan; check `git status`
   first.** (The plan-as-bypass half is already in `gotchas.md` line 67; the clean-tree
   half is new.)
4. **Don't skip the adversarial pass to save time.** (Caveat: the original "Wei would have
   caught ADR-0006" claim is counterfactual — `alpaca/docs/adrs/0006-wei-review.md` shows
   the author caught it at implementation. The real lesson is "read the source before
   implementing.")
5. **Spawn the named agent instead of deciding inline** when a decision is being made.

### Framework gaps (raw audit list — see Section 2 for verdicts)

| # | Gap | Strongest evidence | Convergent? |
|---|-----|--------------------|-------------|
| 1 | No subagent-briefing discipline | ~50% truncation (alpaca) + verify rule (predictasaurv2) | **Yes (N=2)** |
| 2 | `code-reviewer` is a fragile parallel composite | ~50% truncation on the 4-lens agent (alpaca) | No (alpaca) |
| 3 | No clean-baseline check at session entry | entanglement incident (predictasaurv2) | No (predictasaurv2) |
| 4 | Wei has no "citation grep" duty | 3 ADR-text contradictions (alpaca, one repo) | No (alpaca) |
| 5 | Tara has no red-phase pre-flight | calendar/direction/path test bugs (alpaca) | No (alpaca) |
| 6 | ADR template lacks worked-examples + durable-assertions | math ADRs failed at green (alpaca) | **No — refuted.** predictasaurv2's template lacks it and shipped 13 ADRs |
| 7 | Board `item-add` not wired into per-item flow | board-orphan 3× (predictasaurv2) | No (predictasaurv2) |

### Already handled in summon (corrected after Diego's review)

The original draft wrongly listed some of these as gaps. Accurate picture:
- **Done Gate #2/#15** carries the esbuild/`tsc` scoped-test caveat.
- **`gotchas.md` line 113** already documents code-reviewer truncation → gap #2 is an
  *upgrade*, not a new gap.
- **`gotchas.md` lines 115/119** already require board items at planning time + sprint-
  boundary cross-check → gap #7 is narrowly about the *per-item* loop only.
- **`gotchas.md` line 67** already covers plan-as-bypass.
- **ADR template, operational-baseline, tracking-protocol** exist; GitHub adapter
  documents `item-add`.

---

## Section 2 — Team Critique & Decisions

Reviewed by Wei, Archie, Vik, Grace, Pat, Diego (general lenses) plus Tara and Pierrot
(personas whose own definitions the audit proposed to change). Full reasoning is in the
session transcript; key cross-cutting conclusions:

- **No new standalone docs** (Vik, Pat, Diego). Fold content into runtime surfaces the
  coordinator actually reads — `CLAUDE.md`, `gotchas.md`, and `.claude/agents/*.md`
  (behavior lives in agent files, *not* the `personas.md` catalog — Diego).
- **Strip the magic numbers** (≤3 files, ≤30 LOC). They are one-session eyeball estimates
  and harness-dependent; encode the *principle* (Wei, Vik, Pat).
- **The truncation fix is the file-output pattern**, already prescribed but unenforced
  (Vik).
- **Don't board 8 accepted items** — gate first, board what survives (Grace).

### Decision table

| # | Decision | Form (where it lands) | Owner |
|---|----------|------------------------|-------|
| 3 | **ADOPT NOW** | One line in CLAUDE.md Session Entry Protocol (Step 0: `git status`) | coordinator |
| 7 | **ADOPT NOW** | Tighten CLAUDE.md § Per Work Item to atomic create+board+status; cite gotchas 115/119 | Grace |
| 1 | **ADOPT NOW (reshaped)** | Inline into `sato.md`/`tara.md`/`code-reviewer.md`: small briefs, **file-based reports + completion sentinel**, principle-not-numbers. One line in CLAUDE.md "treat agent output as untrusted." No new doc. **Collapses with #2 — same mechanism.** | coordinator |
| 5 | **ADOPT NOW (Tara's own rewrite)** | Named "Red-Phase Pre-Flight (3 checks)" subsection in `tara.md`, domain-neutral. Tara accepted and rewrote it to drop alpaca-specific terms and to actually catch path-mismatch. | Tara |
| 4 | **ADOPT NOW (as a habit, not a gate)** | One bullet in `wei.md`: grep "already encodes/mirrors/same as" claims against real code before accepting an ADR. Not a mandatory per-ADR checklist gate. | Wei |
| 6 | **PARTIAL** | Worked Example as an **optional/triggered** section in `docs/adrs/template.md` (only for ADRs with a calculation). Durable-assertions + reversibility move to the safety track (below), **not** the generic template. | Archie |
| 2 | **VETO LIFTED (conditional on G1–G5)** | File+sentinel+parallel mechanism (see below). No longer sequential. Pierrot retains sign-off on implemented `code-reviewer.md` for G1/G3/G4. | Archie + Pierrot |
| R1 | **ELEVATED (new finding) → ADR** | Project Risk Tier (0/1/2), set at `/kickoff`. Gates all safety ceremony so Tier-0 toy projects stay light. This is the keystone that answers Vik's anti-ceremony objection. | Archie + Pat + Pierrot |
| S1 | **TIER-2 ONLY → ADR** | Safety Contract ADR type + Unsupervised-Action checklist (durable-assertion re-check-at-use, authority-freshness, kill switch, fail-closed, audit trail). | Pierrot + Archie |
| M1 | **DEFER (spike)** | Learning-backflow MVP = `LESSONS.md` file + `/retro` write-step + `/sprint-boundary` read-step, human-gated, **no auto-sync** (Grace). Decide via spike before building. | Grace |

### Pierrot's veto on gap #2 (recorded — has governance veto power)

A sequential review chain (Vik→Pierrot→Tara→Archie) under the very truncation pressure
that motivates it will tend to complete early lenses and **silently drop late ones**,
producing a false-green review that can ship a hardcoded key or missing authz check. The
veto lifts only with all of:
1. Each lens emits a structured completion sentinel; absence = *lens failed*, not *passed*.
2. Safety-relevant lenses run as **separate spawns**, not links in a shared-budget chain.
3. The Pierrot (security/compliance) lens is **non-droppable for all item sizes** — the
   "parallel for S-sized only" carve-out must never become "skip security on small diffs."
4. Safety lenses ordered **first**, not last.

### Gap #2 re-spec (replaces the sequential proposal)

Root cause correction: truncation is a property of the **output channel** (the agent's
returned message), not the **concurrency model**. Switching parallel→sequential only
changes *which* lens is dropped; it does not fix the channel. So we fix the channel and
keep review **parallel**:

1. **File-based reports.** Each lens writes findings to `docs/code-reviews/<date>-<lens>.md`.
   The returned message is only a path + ≤3-line summary. A truncated *message* loses
   nothing — findings are on disk.
2. **Completion sentinel.** Each lens ends its file with `LENS-COMPLETE: <lens>`. The
   coordinator gates on it: **absent = lens failed/incomplete = re-run, never "clean."**
   This is the core move — it converts *silent* truncation into a *detected* failure.
3. **Separate spawns.** Each lens is its own subagent invocation with its own context/
   output budget; no lens can starve another's budget.
4. **Shard the input, not the output.** Large diff → split by file/area; each shard×lens
   is its own spawn writing its own file. Output size is bounded on the way in.
5. **Independent verify.** Coordinator confirms each expected file exists, has its
   sentinel (gotchas.md:113 already warns the reviewer sometimes fails to persist), then
   runs `git status` + tests. "Looks clean" is never trusted.

**How this satisfies the four veto conditions:**

| Veto condition | Satisfied by |
|---|---|
| (1) completion sentinel; absent = failed | Re-spec #2 — the gate *is* the sentinel |
| (2) separate spawns, not shared budget | Re-spec #3 |
| (3) security lens non-droppable, all sizes | Sentinel required for every lens incl. Pierrot, regardless of diff size; the S-sized carve-out is removed |
| (4) safety lenses first | Moot — review is parallel, so there is no "last" position to drop |

Because findings are durable and gated by sentinels, the review stays **parallel** (fast)
and is strictly safer than today's parallel composite (which truncates with no sentinel).

**Status: VETO LIFTED by Pierrot (2026-06-06), contingent on guardrails G1–G5 below.**
Pierrot retains sign-off on the implemented `code-reviewer.md` to confirm G1, G3, G4.

#### Veto-lift guardrails (load-bearing — omitting any re-attaches the veto)

Pierrot's review found that the sentinel proves a *file completed*, not that *analysis
completed*, and that input-sharding introduces a new blind spot at shard seams. The lift
requires:

- **G1 — Sentinel placement.** The sentinel is valid *only* as the file's last line, with
  the complete findings section above it. Sentinel not-at-EOF, or with no findings
  section, = invalid file = lens FAILED = re-run.
- **G2 — Per-file gate, never an aggregate read.** Compute the expected set
  (lenses × shards) *before* spawning; pass/fail iterates that checklist (file exists AND
  ends in a valid sentinel). A never-spawned lens shows up as a missing file, not an
  uncounted absence. This is the real replacement for the "safety lenses first" condition,
  whose concern migrates from the write path to the aggregation/reduce step under parallel.
- **G3 — Sentinel carries a self-declared findings count** (`LENS-COMPLETE: pierrot —
  3 findings` or `— 0 findings, clean`). Lets the coordinator detect sentinel-above-
  truncation: if the count says 3 but only 1 finding block is present, the file is corrupt
  = re-run. A bare sentinel cannot distinguish clean from truncated-then-stamped. **This is
  the single most important addition to the re-spec.**
- **G4 — Sharding requires a seam pass for the security lens.** When a diff is sharded,
  the Pierrot lens additionally runs once over the whole-diff taint surface (cross-file
  source→sink reconciliation), *or* sharding is disabled for the security lens (it always
  gets the full diff). Uniform sharding alone would ship injection-at-the-seam with a green
  board.
- **G5 — Fail-closed; never hand-author the report from the returned message.** A missing/
  invalid sentinel means re-run the spawn — full stop. **Reconcile gotchas.md:113**, whose
  current advice ("write the file manually from the subagent's output") is *wrong* under
  this design: the returned message is now deliberately only a path + ≤3-line summary, so
  hand-authoring would fabricate a clean-looking review with no findings.

### Sequencing (Archie)

Dependencies: **#6 before #4** (Wei needs a structured "durable assertions" target to
grep); **#1 before #2** (the briefing primitive underlies the review fallback);
**#3 + #7 together** (same CLAUDE.md sections). Recommended waves:
1. **Wave 1 (no ADR):** #3, #7, #5, #4, and reshaped #1 — all cheap, reversible, land in
   runtime surfaces.
2. **Wave 2 (ADRs):** R1 risk-tier first (it gates the rest), then re-spec'd #2 and the S1
   safety track, then the M1 backflow spike decision.
3. **Propagation:** only after this repo settles — bubble accepted changes to `vteam-base`
   / `vteam-agentapalooza` / `claude-template`. **Landmine:** predictasaurv2 and alpaca
   already have bespoke versions; propagation to them is *reconciliation*, never overwrite
   (Grace).

### Acceptance criteria (Pat) — "was this worth doing?"

Measured over the next 2 sprints in the next summon repo (baselines from this audit):
- Silent-truncation incidents reaching false-green → ≤1 (baseline ~50%).
- Plan-bypass / uncommitted-entanglement incidents → 0 (baseline: predictasaurv2's two
  worst).
- Board-orphan incidents → 0 (baseline 3×).
- No third repo independently re-discovers subagent briefing (= the inline-vs-doc bet
  worked).
- **Kill criterion:** if the convergent items (#1, #3) show no incident-class reduction in
  2 sprints, revert rather than accumulate dead process.

---
*Wave 1 ("Adopt now") landed 2026-06-06. Next step: Wave 2 ADRs in order — R1 risk-tier
(gates the rest) → re-spec'd #2 review-reliability with G1–G5 (Pierrot signs off on
`code-reviewer.md`) → S1 Tier-2 safety track → M1 backflow spike. This document is the
decision record.*
