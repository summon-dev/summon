<!-- agent-notes: { ctx: "review of doctor command-refs check (a), issue #35", deps: ["packages/summon-team/src/doctor.ts", "packages/summon-team/test/doctor.test.ts"], state: active, last: "code-reviewer@2026-06-24" } -->
---
agent-notes: ctx: "review of doctor command-refs check (a), issue #35" deps: [packages/summon-team/src/doctor.ts, packages/summon-team/test/doctor.test.ts] state: active last: "code-reviewer@2026-06-24"
---
# Code Review: `summon doctor` command-refs health check (a)

**Date:** 2026-06-24 **Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security), Archie (conformance) **Files reviewed:** `packages/summon-team/src/doctor.ts`, `packages/summon-team/test/doctor.test.ts` **Verdict:** Approved with suggestions

## Context

Incremental, uncommitted addition completing issue #30 / #35 under ADR-0004. The doctor infrastructure and check (b) `agentnotes-deps` were reviewed and merged separately (`docs/code-reviews/2026-06-24-doctor.md`); this review covers ONLY the new check (a):

- `checkCommandRefs(root)` scans Summon-managed docs (`CLAUDE.md`, `.claude/`, `docs/`) for backtick-delimited `/command` tokens via `` /`\/([a-z][a-z0-9-]{2,})`/g `` (min 3 chars). A token resolving to no `.claude/commands/*.md` file, not in `CLAUDE_BUILTINS`, and not the `/command` placeholder is reported as `verdict: "degraded"` (non-blocking; exit stays 0).
- `formatResults` gained a 3-way header (problems / healthy-with-N-warnings / healthy).
- 5 new unit tests.

**Verification performed:**
- `npm test` in `packages/summon-team`: 25 passed (17 in doctor.test.ts). Green.
- `node packages/summon-team/dist/index.js doctor` at repo root: exit 0, "healthy — 2 check(s) passed". Both green claims confirmed.
- Scanned the real corpus: the only 3+ char non-command backtick slash-token present is `/clear` (a listed builtin). No `/gim`-style flag combos, no stray noise. The dogfooding claim (doctor green on the real repo) holds.

## Findings

### Critical

None. No security surface (read-only fs walk over the project's own docs, no user-input sink, no shell, no injection vector). Pierrot: no security or compliance concerns — `readFileSync`/`readdirSync` over project-local paths, no secrets, no network.

### Important

None blocking. The two items below are design-judgement notes the author asked me to probe; both resolve in favor of the current code, recorded for the trail.

**1. `degraded`-never-blocks is the right call AND the check still earns its place.** The concern raised: is a never-blocking warning "a warning nobody acts on," too weak to ship? Verdict: no. The ambiguity is real and irreducible — an unresolved fenced `/word` is *indistinguishable* between a deleted/renamed Summon command (broken wiring, should block) and an un-listed Claude built-in (benign). Blocking on that ambiguity would produce false CI failures on every new Claude release, which is strictly worse than a warning. The value the check delivers is **surfacing**: a developer who renames `kickoff.md` and leaves 28 `` `/kickoff` `` references in docs now gets a visible signal at `doctor` time instead of silent rot. That is worth shipping. The honest framing is that this is a lint-grade advisory, not a gate — and the code/comment already say exactly that. No realistic broken-wiring case is *guaranteed* missed; it is *reported*, just not
exit-coded. Consistent with ADR-0004's `ok | degraded | error` vocabulary.

**2. The regex matches single-backtick tokens even when they sit inside a triple-fence block — and that is correct, not a gap.** The task asked whether the check "only matches single-backtick inline code, missing triple-fence blocks." Verified empirically: a `` `/ghost` `` written *inside* a ```` ``` ```` fence still matches (the scanner is content-agnostic over raw text). What it does NOT match is a *bare* slash-token in a code fence (e.g. `/ghost --flag` on its own line in a ```` ```bash ```` block, no inner backticks). That distinction is the right scope: a bare shell example is not a markdown command *reference*; a backticked `` `/ghost` `` is, wherever it appears. So "triple-fence blocks" are not a blind spot — the unit of detection is the backtick pair, not the fence. The PR description's phrasing slightly undersells this; behavior is correct.

### Suggestions

**S1 — `formatResults` header drops the check count on the warning path (cosmetic inconsistency).** The all-ok header reads "healthy — N check(s) passed"; the warning header reads "healthy with N warning(s)" and omits how many checks ran. Minor, but a reader can't tell from the warning header whether 2 or 12 checks executed. Consider "healthy with N warning(s) — M check(s) passed" for parity. Not blocking. (Vik)

**S2 — 3+ char regex-flag false-warn is possible but currently empty; pin it with a test if you want a regression guard.** A backticked 3-char flag combo like `` `/gms` `` or `` `/sui` `` WOULD false-warn (it satisfies the `{2,}` lower bound). None exist in the corpus today, so doctor is green, but the min-3-chars heuristic only fully holds against 1-2 char flags (`/g`, `/gi`) — it does not exclude 3-char flag combos. This is an acceptable residual (such a token in *backticks in prose* is rare, and the consequence is a non-blocking warning, not a failure). If you want to lock the boundary, a test asserting `` `/gms` `` behavior documents the known edge rather than leaving it implicit. (Tara/Vik)

**S3 — `CLAUDE_BUILTINS` allowlist spot-check: clean, no noise risk found.** The set correctly includes names that are *also* Summon commands (`doctor`, `review`, `resume`) — harmless because `commandStems.has(name)` is checked first, so they resolve to files regardless. The list omits some real Claude built-ins (`/add-dir`, `/vim`, `/terminal-setup`, `/bug`, `/pr-comments`, `/release-notes`), but per the design those surface as non-blocking warnings only if they appear *in backticks in Summon docs* — none do today. No action needed; recording the omission so a future doc that backticks `` `/add-dir` `` is understood as expected-noise, not a defect. (Pierrot/Vik)

### Test quality (Tara)

The 5 tests pin the load-bearing behaviors well: resolves-or-builtin-or-placeholder → ok; unknown → degraded with the token name in `detail` and exit 0; 1-2 char flags ignored; prose (non-backtick) ignored. The false-positive-avoidance cases (the whole point of the min-3-chars and backtick-only design) are the ones explicitly covered — exactly right, since those are the regressions dogfooding already hit.

Coverage gaps worth noting (none blocking):
- **No test asserts the `evidence[]` array shape** on the degraded path (the other check, `agentnotes-deps`, has analogous evidence). A consumer reading `evidence` would not be protected by the suite. One assertion on `c?.evidence[0].ref` would close it.
- **No test for a backtick command inside a triple-fence block** — given finding #2, a test proving `` `/ghost` `` inside a ```` ``` ```` fence still warns (and a bare `/ghost` in a fence does not) would pin the actual scope and prevent a future "let's skip fenced blocks" regression.
- **No multi-file / dedup test:** `unresolved` keys on token and records first file only. A test with the same unknown token in two docs asserting it reports once (first file) would pin the Map-dedup behavior the `detail` string depends on.

### Architectural conformance (Archie)

In scope: registration into `HEALTH_CHECKS`, `Verdict`/`CheckResult` reuse, schema version. The check reuses the shared `CheckResult` contract verbatim, sets `schemaVersion: DOCTOR_SCHEMA_VERSION`, and introduces no consumer-specific concepts into the shared type. `degraded` is part of ADR-0004's declared vocabulary. `formatResults` now exercises all three verdicts the type always allowed. No conformance violation; the stale "NOT YET BUILT" comment that deferred check (a) was correctly removed.

## Lessons

1. **A lint-grade advisory is a legitimate ship, not a half-measure — but name it honestly.** The instinct to make every check a gate is wrong when the underlying signal is *ambiguous*. `degraded`/non-blocking is the correct verdict when you genuinely cannot distinguish "broken" from "fine I just don't know about it" without an exhaustive (and therefore brittle) allowlist. The test that says "exit 0 // a warning, not a gate failure" encodes that intent — good practice. The failure mode to avoid is the opposite: blocking on ambiguity, which trains people to add `|| true` and ignore the tool.

2. **Heuristic boundaries should be stated as what they exclude, then tested at the boundary.** "Min 3 chars excludes regex flags" is true for `/g` and `/gi` but NOT for `/gms` — the rule under-promises its own limits. When a heuristic has a soft edge, either tighten it (an explicit flag-combo denylist) or document the residual with a test so the next reader knows it's a known, accepted gap rather than an oversight.

3. **"Does it scan inside code fences?" is the wrong question — "what is the unit of detection?" is the right one.** This check's unit is the backtick pair, not the fence, so fences are irrelevant to it. When reviewing a text-scanning regex, reason about the token grammar it actually matches (and prove it with a 5-line script) rather than the document structure you imagine it cares about. The empirical check caught that the PR description's framing was slightly off while the behavior was right.

4. **An allowlist that need not be exhaustive is a design strength when the fallback is benign.** `CLAUDE_BUILTINS` can stay small precisely because a miss degrades to a warning, not a failure. That coupling — "non-exhaustive list" + "soft fallback" — is what makes it maintainable. The anti-pattern is a non-exhaustive allowlist behind a *hard* gate, which guarantees periodic false failures as the upstream list grows.

REVIEW-COMPLETE: 5 findings (0 critical, 0 important) — 3 suggestions + 2 design notes confirmed in author's favor
