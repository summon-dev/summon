---
agent-notes:
  ctx: "review: check-canon status-flow + command-count checks (#34)"
  deps: [scripts/check-canon.mjs, CLAUDE.md, docs/adrs/0004-summon-doctor.md]
  state: active
  last: "code-reviewer@2026-06-24"
---
# Code Review: check-canon status-flow & command-count checks (#34)

**Date:** 2026-06-24
**Reviewed by:** Vik (simplicity), Tara (testing/drift-catching), Pierrot (security), Archie (conformance)
**Files reviewed:** `scripts/check-canon.mjs`, `CLAUDE.md`
**Verdict:** Approved with one Important finding to resolve before merge.

## Context

Issue #34, under ADR-0004's "land-now" scope, adds two deterministic checks to the
existing `check-canon.mjs` fitness function and fixes one live drift it surfaced:

- **Check 5 `checkStatusFlow`** — validates the board status-flow *stage sequence*
  (`Backlog → Ready → In Progress → In Review → Done`) is consistent wherever the
  pipeline appears. Separators are normalized (`→`, `-->`, commas, pipes, markdown
  bold, leading "and"); the ordered stage list is then compared against the canonical
  five. Pipelines are identified **structurally** (`≥3` tokens, anchored `Backlog`
  first / `Done` last) rather than by middle-stage names, so a rename can't evade the
  check by changing the key.
- **Check 6 `checkCommandCount`** — asserts CLAUDE.md's `(N, auto-discovered)`
  slash-command count equals the number of `.claude/commands/*.md` files.
- **CLAUDE.md** — `(23, auto-discovered)` → `(24, ...)`, the live drift Check 6 found.

This is a Tier-0/1 CI-script change (ADR-0003): no money, no unsupervised action, no
security surface. Review weighted to Vik (simplicity) and Tara (does the check catch
the drift it claims, and does it false-positive?).

**Baseline verified independently:** `node scripts/check-canon.mjs` → `canon check:
OK`, exit 0. The author's three negative controls (rename / drop / wrong-count) are
plausible and consistent with my own replay of the matcher (see below).

## Findings

### Critical

None. This is a self-contained CI script with no runtime, security, or data surface.

### Important

**I-1. The 23→24 command-count drift is fixed in exactly one of seven places; Check 6
is too narrow to catch the other six.** The author states "Check 6 surfaced the live
drift," and it did — but only the *one* instance it is shaped to see. The actual file
count is 24 (`ls .claude/commands/*.md | wc -l` → 24). The fix touched CLAUDE.md's
`(24, auto-discovered)`. The following six user-facing claims still say **23** and are
now wrong:

| File | Line | Text |
|------|------|------|
| `README.md` | 60 | `commands/  23 slash commands (...)` |
| `site/src/content/docs/index.mdx` | 3 | `16 agents, 23 commands, real methodology` |
| `site/src/content/docs/team/commands.md` | 3 | `23 commands that drive the team's workflow` |
| `site/src/content/docs/getting-started/quick-start.md` | 13 | `16 agents, 23 commands` |
| `site/src/content/docs/getting-started/quick-start.md` | 41 | `23 slash commands` |
| `site/src/content/docs/getting-started/quick-start.md` | 57 | `see all 23 commands` |

Why it matters: the *point* of a fitness function is that green means consistent. A
check that whitelists a single phrasing (`\((\d+),\s*auto-discovered\)`) in a single
file gives a false sense of coverage — CI is green while the most visible, user-facing
count (marketing copy, getting-started docs) is stale. These six are not a separate
issue you can defer; they are the same `23→24` event, and they sit in exactly the
surfaces (`README.md`, `site/src/content/**`) that the *sibling* check
`checkDoneGateCount` already walks. The asymmetry is the tell: Check 4 scans
README + the whole `site/src/content` tree for its count claim; Check 6 scans only
CLAUDE.md.

To be precise: the stale-23 condition pre-dates this diff (the 24th command landed
earlier). The diff didn't *introduce* it. But the diff's stated premise is that the
check "surfaces the live drift," and shipping it green while six instances of that
exact drift remain undermines the premise and leaves the trap armed for the next
reviewer who trusts the green.

Fix (smallest robust form): broaden Check 6 to the `checkDoneGateCount` pattern —
scan README + `site/src/content/**` (plus CLAUDE.md) for `(\d+)\s+(?:slash\s+)?commands?`
and `\((\d+),\s*auto-discovered\)`, comparing each capture to the file count. Then
fix the six occurrences to 24 in the same change so the broadened check goes green.
If you genuinely want to keep the narrow form for the land-now scope, then the six
docs MUST still be corrected to 24 in this diff, and a `summon:` debt marker should
name the ceiling ("Check 6 only validates CLAUDE.md's phrasing; README + site count
claims are unguarded") with the broadening as the upgrade path. Shipping green with
the docs left at 23 and no marker is the one thing not to do.

### Suggestions

**S-1. Separator class misses bare `>`, `/`, and `·`.** The split regex is
`/\s*(?:→|-+>|,|\|)\s*/`. `-+>` matches `-->`/`->` but **not** a bare `>`; `/` and
`·` (middot) are also absent. A pipeline written `Backlog > Ready > In Progress >
In Review > Done` (a common Markdown choice, since `>` alone renders fine) collapses
to a *single* token, fails the `≥3` structural gate, and is silently skipped — a
false negative. This is a real authoring style, not a contrived one. Cheap fix: add
`>` and `/` to the alternation (`(?:→|-+>|>|/|·|,|\|)`). Keep `,` and `|`. Verify the
addition doesn't start splitting prose paths or `and/or` (it won't split on `/` inside
a word boundary the way it's anchored by `\s*`, but spot-check `docs/integrations`
which has `gh project field-list` style command lines).

**S-2. Comma-enumerations and ordered pipelines are treated identically — currently
safe, latently fragile.** The matcher cannot distinguish "the board moves Backlog →
Ready → ... → Done" (an *ordered* claim) from "the Status field must have the options
Backlog, Ready, In Progress, In Review, Done" (an *unordered set* claim). Today every
such enumeration in canon happens to list all five in canonical order, so the conflation
is harmless and the check is green. But the failure mode is asymmetric: if a maintainer
ever writes a *set* claim in a different order ("ensure In Review, Done, Backlog, Ready,
In Progress all exist") or omits a stage for brevity in prose, the check will report
"drift" on text that is semantically correct. My replay confirmed e.g.
`Backlog, Ready, In Progress, Done` → `drift:true` and `Backlog, foo, Done` →
`drift:true` (3-token degenerate). Not worth solving now (YAGNI — no such text exists),
but worth a one-line comment noting the check assumes *every* `Backlog..Done`
single-line enumeration is an ordered pipeline, so set-style claims must stay in
canonical order. That comment is the cheapest guard against a future false-positive
that would train maintainers to distrust the check.

**S-3. Scope asymmetry between Check 4 and Check 5.** `checkStatusFlow` scans
CLAUDE.md + `.claude/**` + `docs/integrations/**` + `site/src/content/**` but **not**
`README.md`; `checkDoneGateCount` does scan `README.md`. README has no pipeline today,
so no live gap — but a future README status-flow line would be unguarded. For
consistency between two checks that share the "scan current-state surfaces" intent,
add `README.md` to Check 5's file list. Trivial.

**S-4. `summon:` debt marker correctly retired.** The old marker at the former line 102
("4 checks cover the drift we've actually seen; add a status-flow-order check ... if
those strings ever diverge") is removed because this diff *implements* it. That is the
right lifecycle for a debt marker — good. No action; noted as a positive.

## Lessons

1. **A fitness function's coverage is a claim, and a narrow regex quietly shrinks it.**
   The most dangerous bug in a drift-guard isn't a crash — it's a green result that
   means less than the reader thinks. Check 6 watches one phrasing in one file; a
   reader sees "command-count is machine-checked" and stops worrying. When you add a
   consistency check, enumerate *every* surface the fact appears on (a 30-second
   `grep -rn` for the number) and either cover them or explicitly mark the gap. The
   sibling check (`checkDoneGateCount`) already modelled the right scope — reuse it.

2. **"The check surfaced the drift" is only true if it surfaced *all* of it.** Fixing
   the one instance your check can see, while six identical instances remain, produces
   a green CI that is actively misleading. Before declaring a drift fixed, re-grep the
   raw fact across the repo, not just the surfaces your new check happens to scan.

3. **Structural identification over name-keying was the right call — keep going.**
   Anchoring on `Backlog`-first / `Done`-last and validating the middle is exactly
   right: keying on the middle stage names would let a rename evade the check (you'd be
   matching on the thing you're trying to validate). This is a reusable pattern for any
   "validate an ordered list" guard: anchor on the invariant endpoints, validate the
   interior.

4. **Format-normalization checks need their separator alphabet enumerated up front.**
   "Punctuation is free, sequence is canon" is a great design — but it's only as good
   as the separator set. `→`, `-->`, `,`, `|` covers today's docs; a bare `>` or `/`
   is a plausible future edit that the check would silently skip. When you build a
   normalizer, list the real-world variants explicitly (grep the corpus) rather than
   the ones that came to mind.

5. **A conflation that's safe today is a false-positive waiting for the next edit.**
   Treating comma-sets and arrow-pipelines identically works only while every set
   enumeration stays in canonical order. The cheap insurance is a comment stating the
   assumption, so the maintainer who writes the first out-of-order set claim
   understands *why* CI failed instead of concluding the check is buggy and weakening
   it. Document the assumptions your matcher depends on.

**Pierrot:** No security or compliance concerns — CI-only script, no untrusted input,
no secrets, no auth surface, no new dependency. N/A as scoped.

**Archie:** No architectural-conformance concern. The change extends an existing
single-purpose script in place, adds no shared type, crosses no package boundary, and
respects ADR-0004's land-now scope (the deferred bijective command-resolution direction
is correctly NOT built, with the YAGNI rationale recorded inline). Conformant.

REVIEW-COMPLETE: 4 findings (0 critical, 1 important)
