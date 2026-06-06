---
agent-notes:
  ctx: "review of Wave 1 self-improvement framework edits"
  deps: [CLAUDE.md, .claude/agents/sato.md, .claude/agents/tara.md, .claude/agents/code-reviewer.md, .claude/agents/wei.md, docs/process/cross-repo-lessons.md, docs/process/gotchas.md]
  state: active
  last: "code-reviewer@2026-06-06"
---
# Code Review: Wave 1 Self-Improvement Edits

**Date:** 2026-06-06
**Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security), Archie (conformance)
**Files reviewed:** `CLAUDE.md`, `.claude/agents/sato.md`, `.claude/agents/tara.md`, `.claude/agents/code-reviewer.md`, `.claude/agents/wei.md`, `docs/process/cross-repo-lessons.md` (changed); `docs/process/gotchas.md`, `docs/methodology/agent-notes.md` (context)
**Verdict:** Approved with suggestions

## Context

Wave 1 of the cross-repo self-improvement initiative implements five decisions from `docs/process/cross-repo-lessons.md` Section 2 (#3, #7, #1-reshaped, #5, #4). These are prose/process edits to framework Markdown — no application code, no tests. The unifying finding behind the wave is **silent subagent-output truncation**: a truncated agent message that reads "looks clean" is a false green that can ship a real bug, a hardcoded secret, or a missing authz check. Wave 1's response is a *file-based-report + completion-sentinel* discipline plus a coordinator rule to treat agent output as untrusted.

The review's load-bearing concern is the Wave 1 / Wave 2 boundary: Wave 2 (the parallel-spawn / input-sharding / per-lens fail-closed restructure of `code-reviewer.md`, audit gap #2, guardrails G1–G5) is gated behind ADRs and Pierrot's conditional veto-lift. Wave 1 must add only the sentinel *primitive* and explicitly defer the restructure.

### Boundary and citation verification (all pass)

- **Wave 2 not implemented.** The `code-reviewer.md` edit adds only the sentinel section and an explicit `> **Wave 2 (pending Pierrot sign-off):**` deferral block naming gap #2 and G1–G5. No parallel-spawn, no input-sharding, no per-lens fail-closed logic appears. Boundary respected; no over-reach into Pierrot's sign-off territory.
- **`gotchas.md` lines 115/119 citation is accurate.** Line 115 = "cross-check board status against GitHub issues at sprint boundary"; line 119 = "all sprint items must be on the board at planning time." The CLAUDE.md "Start (atomic)" parenthetical — "board items required at planning time, cross-checked at sprint boundary" — faithfully summarizes both. Correct.
- **`gotchas.md:113` (G5 "hand-author the file" advice) was deliberately NOT edited.** Confirmed: `git diff docs/process/gotchas.md` is empty. Reconciling :113 belongs to Wave 2's G5 and is correctly deferred.
- **Agent-notes protocol honored.** All four agent files bumped `last` to `coordinator@2026-06-06`; the decision-record `state` moved `draft → active`. Consistent with `docs/methodology/agent-notes.md`.

## Findings

### Critical

None. The truncation hole this wave targets is meaningfully narrowed (see Pierrot's note in Important), the Wave 2 boundary is respected, and no security-sensitive behavior is enabled prematurely.

### Important

**(Pierrot) The sentinel narrows the false-green hole but does not close it — and the wording in three of the four files overstates the guarantee.** This is the central security question for the wave, so it deserves precision. The mechanism works as follows: the *file on disk*, ending in a sentinel with a self-declared count, converts a *silent* truncation of the *returned message* into a *detected* failure — because the coordinator gates on the on-disk sentinel, not the message. That is real and valuable.

But there are two residual surfaces, and only `code-reviewer.md` + the decision record (G1/G3) fully name them:

1. **Sentinel-above truncation (the file itself truncates before the sentinel).** If the agent's *file write* truncates, there's simply no sentinel and the gate catches it (good). But if the write completes with a sentinel while the *findings above it* were truncated, a bare sentinel cannot distinguish "clean" from "truncated-then-stamped." The decision record's **G3** (self-declared count cross-checked against findings actually present) is the fix, and `code-reviewer.md` correctly carries it: *"a count that doesn't match the findings actually present means the review is incomplete."* **`sato.md` and `tara.md` carry the count but state the self-check weakly** — they say only "if the count doesn't match what's actually in the file, *say so* rather than stamping it complete." That places the burden on the (possibly truncated) agent to self-report, which is exactly the actor we just declared untrusted. The coordinator-side cross-check ("count says 4, file shows 2 → re-run") is the load-bearing half and is present in `code-reviewer.md` and CLAUDE.md but under-stated in `sato.md`/`tara.md`. Recommend aligning the two agent files to state the *coordinator* re-runs on count mismatch, matching G3's framing.

2. **A new false-security surface: the sentinel can certify "file complete" while the *analysis* was shallow or wrong.** The sentinel proves a file was written to completion with a matching count — not that the lens actually reasoned correctly. This is acceptable for Wave 1 (it's an honest narrowing, not a claimed closure), and the prose mostly avoids over-claiming. The one place to watch: CLAUDE.md's new rule says the sentinel gate, *then* `git status` + real test/typecheck, is the trust path. That independent-verify second half is what prevents the sentinel from becoming the new false green. It is present and correctly ordered. Good — but note it depends on there *being* a "real test/typecheck command," which holds for code work and not for prose-only work like this very wave. Not a defect; worth a one-line acknowledgment somewhere that for docs-only waves the independent verify is `git diff` review, not tests.

Net: the design does **not** introduce a worse false-security surface than today's status quo (today's parallel composite truncates with *no* sentinel at all). It is strictly safer. The Important flag is about *wording parity* across the four files, not a design hole.

**(Vik) Sentinel-discipline wording is inconsistent across the four files — a coherence risk for a cross-cutting protocol.** The same primitive is described four times with four slightly different contracts:

- `code-reviewer.md`: `REVIEW-COMPLETE: <N> findings (<C> critical, <I> important)` — coordinator cross-checks count against findings present (strong).
- `sato.md`: `SATO-COMPLETE: 4 files changed, 0 follow-ups` — agent self-reports mismatch (weak).
- `tara.md`: `TARA-COMPLETE: 7 tests added, 1 coverage gap` — agent self-reports mismatch (weak).
- CLAUDE.md: refers generically to "the agent's completion sentinel … a self-declared count that doesn't match the file means the agent FAILED."

The *prefix* divergence (`REVIEW-COMPLETE` vs `SATO-COMPLETE` vs `TARA-COMPLETE` vs the decision record's `LENS-COMPLETE`) is fine and arguably good (lets the coordinator pattern-match per agent). The *contract* divergence is the smell: a junior reading these at 2am should not have to infer whether the coordinator or the agent is responsible for the count cross-check. Recommend one canonical sentence — "the coordinator re-runs on a missing sentinel, a sentinel not at EOF, or a count that doesn't match the findings in the file" — copied verbatim into all four. This is the G1+G3 contract; stating it identically everywhere removes the ambiguity.

### Suggestions

**(Tara) The Red-Phase Pre-Flight is domain-neutral and catches all three false-green classes — ship it; one small gap.** The three checks (calendar/time, direction/sign, path/target) are well-chosen and genuinely domain-neutral: the examples span dates/DST/timezone, buy/sell + debit/credit + before/after, and stub-route/sibling-path. Each maps cleanly to a real false-green class where a test goes green while asserting the wrong thing. The "state the expected direction in words first, then encode it" instruction is exactly right — it breaks the implementation-mirroring failure mode. The explicit "skip it explicitly — don't silently assume" closer is good discipline. **One gap:** the pre-flight catches a test that asserts the *wrong* thing but not a test that asserts the *right* thing against a *frozen-but-wrong oracle* — e.g., a pinned clock set to a date that is itself miscalculated. That's a deeper class and arguably out of scope for a three-check pre-flight; mentioning it as a fourth "value-derivation" caveat would be gold-plating. Leave as-is; noting for completeness.

**(Archie) Structure and voice conform; the Wave 2 deferral block is the right architectural move.** Section placement is consistent (new subsections sit alongside peers under the correct H2s; CLAUDE.md Step 0 correctly renumbers within the existing protocol). Voice matches each persona's register. The `> **Wave 2 (pending Pierrot sign-off):**` blockquote in `code-reviewer.md` is the correct way to encode a deferred-but-known dependency inline — it prevents a future session from "completing" the obvious-looking restructure without the ADR. No CLAUDE.md ↔ agent-file contradictions introduced: CLAUDE.md's "Treat Agent Output as Untrusted" rule points *to* the agent definitions for the sentinel spec, and the agent definitions supply it — clean delegation, no duplication drift beyond the wording issue Vik flagged.

**(Vik) "Step 0" numbering.** Numbering the new clean-tree check `0.` (rather than renumbering 1–3 to 1–4) is a deliberate, reasonable choice — it signals "precondition before the questions" and minimizes diff churn. Fine. Minor: a reader skimming may wonder why the list starts at 0; the inline "start from a clean baseline, then answer three questions" lead-in handles it. No change needed.

**(Pierrot) `wei.md` citation-check is correctly scoped as a habit, not a gate.** The new technique #7 (grep "already encodes / mirrors / matches / same as" claims against real code before accepting) is explicitly "a habit you bring to every review, not a mandatory per-ADR checklist gate" — matching decision #4's "as a habit, not a gate" form. This avoids adding ceremony, and the security value (catching aspirational equivalence claims that mask drift) is real. No concern.

## Lessons

1. **A sentinel proves a file finished, not that analysis finished — and not that the file's *body* is intact.** The single most important addition in this design is G3: the self-declared *count*, cross-checked by the coordinator against findings actually present. A bare "DONE" sentinel is defeated by truncate-then-stamp; a counted sentinel that the *untrusted* actor self-checks is only half-defeated; a counted sentinel that the *trusted coordinator* cross-checks is the real control. When you build any "completion marker" protocol, ask: who verifies the marker, and can the thing being verified forge it? Put the verification on the side you trust.

2. **Don't let the same primitive drift across the files that implement it.** This wave defines one sentinel concept in four places and ended up with four subtly different contracts (who checks the count, what counts as failure). For a cross-cutting protocol, write the contract once as a canonical sentence and copy it verbatim; let only the *prefix* vary per agent. Divergent restatements of one rule are how a "must re-run on mismatch" silently degrades into "agent should mention it if convenient."

3. **A safety mechanism narrows a hole; it rarely closes one. Say which.** The honest framing here — "converts *silent* truncation into a *detected* failure" — is much stronger than a claim like "prevents false greens." The first is true and testable; the second invites complacency (the new false-security surface: a complete file with shallow analysis). When documenting a control, state the residual surface explicitly so the next person doesn't treat the green sentinel as proof of correctness.

4. **Encode deferred work as a visible boundary, not a silence.** The `code-reviewer.md` Wave 2 blockquote is a model: it names the deferred restructure, the gating sign-off (Pierrot), and the dependency (this sentinel underlies it). A future session that sees the half-built primitive is told *not* to "finish the obvious thing." Silent deferral is how scope-gated, veto-held work gets quietly completed by a well-meaning agent without the gate.

5. **Tests that assert the wrong thing are worse than no test — the three Red-Phase classes name the common ways it happens.** Calendar (wall-clock leakage), direction (mirroring the implementation's sign), and path (testing a sibling of the production path) are the three highest-frequency false-green generators. "State the expected direction in words first, then encode it" generalizes: derive expectations from the requirement, never from the code under test.

REVIEW-COMPLETE: 7 findings (0 critical, 2 important) — 5 suggestions
