---
agent-notes:
  ctx: "Review of slice A CSS contrast/motion checker (PR #87)"
  deps: [scripts/check-css-contrast-motion.mjs, scripts/check-css-contrast-motion.test.mjs, package.json, docs/adrs/0013-design-authority.md]
  state: active
  last: "code-reviewer@2026-08-06"
---
# Code Review: Slice A — static CSS contrast + reduced-motion checker (PR #87)

**Date:** 2026-08-06
**Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security/robustness), Archie (conformance)
**Files reviewed:** `scripts/check-css-contrast-motion.mjs`, `scripts/check-css-contrast-motion.test.mjs`, `package.json`
**Verdict:** Changes requested — 1 Critical (silent no-op), 7 Important (four confirmed false-positive/false-negative sources, one dead code path, two coverage/wiring gaps)

## Context

First executable code in the ADR-0013 arc. A zero-dependency Node script that statically resolves CSS contrast pairs and flags motion declarations lacking reduced-motion coverage. It is advisory by ratification (ADR-0013 §6's binding constraint: not gate-wired, honest narrow name, item 8's deterministic upgrade stays gated on slice B).

The thesis matters for calibration. This tool's stated value is *"its silence means nothing, but when it speaks, believe it."* That inverts the usual severity weighting: a **false positive is worse than a false negative here**, because a checker that invents findings gets routed around (ADR-0013 §300 names this exact failure), and a checker that silently emits nothing is a false green — the failure this ADR exists to prevent.

Every CONFIRMED finding below was reproduced by executing the module directly. Repro snippets are inline.

## Findings

### Critical

---

**C1 — The script is a silent no-op when its own path contains a space, a non-ASCII character, or runs on Windows.** CONFIRMED.

`scripts/check-css-contrast-motion.mjs:465`

```js
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
```

`import.meta.url` is percent-encoded and normalized; `process.argv[1]` is a raw filesystem path. They diverge the moment the path contains a space (`%20`), a non-ASCII character, or a Windows drive letter (`file:///C:/...` vs `C:\...`).

Reproduced — same script, same input file, only the directory name differs:

```
$ node /tmp/scratch/check-css-contrast-motion.mjs bad.css
  contrast  1.11:1 < 4.5:1  .a b { color: #111111 } on #000000 (from .a)
css contrast+motion: 1 finding(s) ...
exit=0

$ node "/tmp/scratch/dir with space/check-css-contrast-motion.mjs" bad.css
exit=0                        # no output at all. main() never ran.
```

`main` is never called, nothing prints, and the exit code is 0. There is no diagnostic. A user on `~/My Projects/`, `C:\Users\...`, or any localized home directory gets a clean-looking run that checked nothing. Summon scaffolds into arbitrary user directories, so this is not a hypothetical.

This is the exact false-green shape ADR-0013 §208 condemns, delivered by a two-character bug rather than by a scoping decision.

**Smallest fix:**

```js
import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { ... }
```

**Principle:** any "am I the entry point?" guard that fails closed to *silence* rather than to *noise* is a false-green generator. Prefer `pathToFileURL`; it is stdlib, so this costs nothing under the zero-dependency constraint.

### Important

---

**I1 — Cascade order is inverted: the first-declared background wins, but CSS says the last one does.** CONFIRMED false positive.

`scripts/check-css-contrast-motion.mjs:352-355` (fallback path, `>` is strict so ties keep the first) and `:326-331` (markup path, `break` on first match).

```js
findContrastFindings(`.a { background: #000000; } .a { background: #ffffff; } .a { color: #111111; }`)
// → [{ bg: "#000000", ratio: 1.11, passes: false }]
```

The rendered background is `#ffffff`. `#111111` on `#ffffff` is 18.9:1 — a comfortable pass. The checker reports a 1.11:1 **failure against a background that no pixel on the page ever has.**

This is not a contrived shape. It is what every override looks like: a base rule plus a later theme/state/media override, which is standard in the `global.css` + component-`<style>` layering this tool targets.

**Smallest fix:** `parseRules` already emits rules in source order. In both paths, keep scanning and take the *last* matching background rather than breaking on the first. In the fallback path, change the tie-break so equal-specificity-length candidates prefer the later one:

```js
if (!best || cand.selector.length >= best.selector.length) best = cand;   // >= not >
```

(That is a partial fix — it gets source order right but still ignores specificity, so `#id` vs `.class` remains wrong. Given the tool is advisory, source order is the honest 80%; specificity is a documented limitation, not a further fix.)

---

**I2 — The selector-string fallback runs even when markup already answered the question, and can print a failure the DOM refutes.** CONFIRMED.

`scripts/check-css-contrast-motion.mjs:345-358`. The comment calls this path "Fallback, and the only path for a bare stylesheet" — but it is not gated on `elements` being absent. It always runs, and the dedupe key at `:307` (`selector|property|fg|bg`) omits `bgSelector`, so when the two paths disagree on the background, both records survive.

```js
const a = `<div class="card"><div class="inner"><p class="t">hi</p></div></div>
<style> .card { background: #0f172a; } .inner { background: #ffffff; } .card .t { color: #f8fafc; } </style>`;
findContrastFindings(extractCss(a, "a.astro"), parseMarkup(a))
// → [ { sel: ".card .t", bg: "#ffffff", bgSel: ".inner", ratio: 1.05,  passes: false },
//     { sel: ".card .t", bg: "#0f172a", bgSel: ".card",  ratio: 17.06, passes: true  } ]
```

One rule, two verdicts, from two paths that were never reconciled. Here the markup path happens to be the correct one and the CLI's `bad` filter prints the true failure. Swap the two backgrounds (light on the outer `.card`, dark on the inner `.inner`) and the arrangement reverses: the markup path correctly says PASS, the string fallback says FAIL, and **the CLI prints the false positive** — because `contrast.filter(f => !f.passes)` has no way to know one of those records came from a path the DOM already overruled.

`pairsChecked` (`:433`) also double-counts these, so the headline "N contrast pair(s) statically resolved" overstates yield.

**Smallest fix:** run the fallback only for the rules the markup path did not resolve — or, simplest and honest, gate the whole block:

```js
if (!elements || elements.length === 0) {
  // ... existing selector-string fallback ...
}
```

**Vik's answer to the question you asked:** yes, `findContrastFindings` is doing too much, but the dual path is *justified* — a bare `.css` file genuinely has no DOM, and the ADR record shows string-only pairing finds 1/35th of real pairs. What is not justified is that the two paths are **unranked peers feeding a shared dedupe**. The missing abstraction is a precedence rule: markup ancestry is strictly better evidence than selector-string ancestry, so it should *win*, not *tie*. Encode that (gate the fallback, or make the dedupe key `selector|property` and let the higher-confidence path overwrite) and the function reads as one algorithm with a documented degradation, not two algorithms sharing a bucket.

---

**I3 — Unrecognized compound selectors (`#id`, `[attr]`) degrade to "matches everything" instead of "matches nothing".** CONFIRMED false positive.

`scripts/check-css-contrast-motion.mjs:236-246`. `parseCompound("#sidebar")` extracts no classes (the `.` regex misses) and no tag (the `^[a-zA-Z]` regex misses `#`), yielding `{tag: null, classes: []}`. `compoundMatches` then returns `true` unconditionally — a universal match.

```js
const astro = `<div class="wrapper"><button class="btn">go</button></div>
<style> #sidebar .btn { background: #0f172a; } .btn { color: #1e293b; } </style>`;
findContrastFindings(extractCss(astro,"x.astro"), parseMarkup(astro))
// → [{ sel: ".btn", bg: "#0f172a", bgSel: "#sidebar .btn", ratio: 1.22, passes: false }]
```

The button is not inside `#sidebar`. The reported 1.22:1 failure is fabricated. Same for `[data-theme="dark"] .btn` — verified `true` against a `.btn` with no such ancestor, which means **every dark-theme-scoped background gets applied to light-theme elements.**

You explicitly flagged sibling combinators (I4) as the thing you were unsure about. `matchesSelector:254` returns `false` for `~`/`+`, which is the *correct* conservative direction and I have no issue with it. The problem is that ids and attribute selectors take the opposite branch — they fall through to universal-match. That inconsistency is the finding: the same file fails closed for one unsupported construct and fails wide open for another.

**Smallest fix:** make `parseCompound` report when it saw something it did not model, and have `compoundMatches` refuse rather than accept:

```js
function parseCompound(part) {
  const base = part.replace(/::?[\w-]+(\([^)]*\))?/g, "");
  const classes = [...base.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  const tagMatch = /^([a-zA-Z][\w-]*)/.exec(base);
  const rest = base.replace(/\.[\w-]+/g, "").replace(/^[a-zA-Z][\w-]*/, "").trim();
  return { tag: tagMatch ? tagMatch[1].toLowerCase() : null, classes, unsupported: rest !== "" && rest !== "*" };
}
function compoundMatches(compound, node) {
  if (compound.unsupported) return false;      // never guess
  ...
}
```

---

**I4 — Native CSS nesting yields zero findings, silently. `@media`-scoped backgrounds are flattened as if unconditional.** CONFIRMED false negatives.

`scripts/check-css-contrast-motion.mjs:85-98`. A non-`@` prelude is assumed to contain only declarations. `body.split(";")` on a nested rule produces `& h3 { color` as a property name, which `!/\{/.test(prop)` correctly discards — so nested rules are dropped entirely, and `i = j` skips past them without recursing.

```js
findContrastFindings(`.card { background: #0f172a; & h3 { color: #334155; } }`)   // → []
```

That is a real 2.5:1 defect, invisible. Native nesting is shipping in every current browser and is idiomatic in Astro `<style>` blocks and Tailwind v4 — this is not an exotic input. `@container` has the same shape.

Separately, at `:81-84` an at-rule's condition is discarded except for the reduced-motion bit, so a `@media (min-width: 900px)` background is paired against text that renders at every width:

```js
findContrastFindings(`@media (min-width: 900px) { .card { background: #0f172a; } } .card { color: #f8fafc; }`)
// → one pair against a background that only exists above 900px
```

**Smallest fix (nesting):** in the non-`@` branch, if the body contains `{`, recurse into it before parsing declarations, and split declarations only from the pre-`{` region. **Smallest fix (media):** carry the at-rule prelude onto the rule record and refuse to pair a conditional background with an unconditional foreground — or, cheaper and defensible for an advisory tool, document the limitation in the header block alongside the existing "WHAT THIS IS NOT" text.

---

**I5 — `dynamicClasses` is dead: assigned, asserted in a test, never read. Its explanatory comment describes behavior that does not exist.** CONFIRMED.

`scripts/check-css-contrast-motion.mjs:217, 224, 236` set it. `grep -rn dynamicClasses scripts/` finds exactly one other reference: the test at `check-css-contrast-motion.test.mjs:172`. Nothing in `findContrastFindings` or `main` reads it.

The comment at `:203-207` says:

> "We recover those and flag the element, **because** a conditional fragment is treated as present and can pair text against a background that may not apply."

The `because` clause promises a consequence. There is none. A reader at 2am debugging a false positive will chase that flag expecting it to suppress or downgrade something, and find a dead end.

This also answers your **I1 inference** (dropping `${...}` interpolations). The conservatism itself is right — a conditional class treated as present *does* invent pairs. But the code keeps only the *unconditional literal fragments*, which means the recovered classes are all genuinely present, which means there is nothing left for `dynamicClasses` to warn about. The flag is a leftover from a design where interpolations were kept. Either delete it (three lines, one test), or make it earn its place by tagging findings derived from dynamic elements as lower-confidence in the CLI output.

**Smallest fix:** delete the field, the comment's `because` clause, and the assertion at test:172. Vik's default is delete — three concrete uses before a mechanism stays, and this has zero.

---

**I6 — The CLI has no test coverage at all, including the one property ADR-0013 §6 *binds*.** CONFIRMED gap.

`main()` is not exported and not exercised. Untested, concretely:

- **Exit 0 without `--strict`.** This is ADR-0013 §208's binding constraint. It is asserted nowhere. Nothing stops a future edit from making this exit 1 and quietly gate-coupling the check. An ADR constraint with no fitness function is a comment.
- `--strict` exits 1 when findings exist.
- A missing/unreadable file is reported but does not abort (`:425-428`) — and, worse, produces `0 finding(s)` in the summary, which reads as a pass.
- Zero args exits 2.
- `motionUncovered` suppression logic (`:436`).

C1 lives in exactly this untested region, which is the argument for the coverage, not just the principle.

**Smallest fix:** export `main`, add four tests. The highest-value one is a two-line executable fitness function for the ADR:

```js
test("ADR-0013 §6: advisory — a file with findings still exits 0 without --strict", () => {
  assert.equal(main([badFixturePath]), 0);
  assert.equal(main(["--strict", badFixturePath]), 1);
});
```

**Also untested (Tara's concrete gap list, beyond the CLI):** `rule.inReducedMotion` suppression of declarations *inside* the reduce block (verified working, but unpinned); `outline-color` (declared in `FOREGROUND:282`, exercised by no test — verified working, threshold 3, but unpinned); `isAncestorSelector` negatives (`.card` must not base `.card-header` — verified working, unpinned); cascade override (I1); `@media` and nesting (I4); minified CSS (verified working); the "no `;` on the last declaration" case (verified working).

**On your over-fitting question:** the four hand-verified values at `test:34-41` are the right *kind* of test — pinning the sRGB relative-luminance formula against known-good outputs is exactly what a golden test is for, and the formula will not change. But two of the four (`#7f1d1d`/`#9f1239` against `#0f172a`) pin *this repo's* palette for issue #86, and per V7 the script cannot detect #86 anyway. Those two assert arithmetic that no code path in this repo reaches. Suggestion, not a finding: keep the 21:1 and symmetry tests, keep one repo-independent pair, and replace the #86 colours with a WCAG-published reference pair so the test documents the standard rather than a moment in this repo's history.

**Answering I5 (is 27 tests adequate?):** the count is fine; the *distribution* is not. 27 tests, ~19 of which cover pure functions that were already the least likely to be wrong, and 0 covering the CLI where the Critical bug lives. Coverage is not a number, it is a map of where the risk is.

---

**I7 — The script ships to scaffolded projects; its only invocation path does not.** CONFIRMED. (Archie / ADR-0007.)

`packages/summon-team/src/index.ts:33-53`. `scripts/` is not in `EXCLUDE_DIRS`, so `scripts/check-css-contrast-motion.mjs` **and** its `.test.mjs` are copied into every scaffolded project. `package.json` **is** in `EXCLUDE_FILES` (`:48`), so the `check:css` and `test:scripts` entries added by this PR do not ship.

A scaffolded user therefore receives a 467-line checker with no `pnpm` entry point, no mention in any shipped doc, and a `.test.mjs` file that nothing runs. It is discoverable only by `ls scripts/`.

Compounding it: `pnpm check:css` with no arguments is not runnable even in this repo —

```
$ pnpm check:css
usage: node scripts/check-css-contrast-motion.mjs [--strict] <file...>
exit=2
```

and the header's suggested invocation `site/src/**/*.css` requires bash `globstar`, which is off by default. Without it the literal glob reaches `readFileSync`, hits the `catch` at `:425`, and prints `0 finding(s) across 1 file(s)` with exit 0 — a second false green, from the shell rather than the code.

**Smallest fix:** give `check:css` its default arguments so the script name matches a runnable command (`"check:css": "node scripts/check-css-contrast-motion.mjs site/src/styles/global.css site/src/components/*.astro"`), and either add `scripts/*.test.mjs` to `EXCLUDE_PATHS` or accept that the tests ship as documentation. The "no entry point for scaffolded users" half is pre-existing (`check-canon.mjs` has the same shape), so it is a consistency issue to route through the ADR-0007 owner rather than a blocker on this PR.

### Suggestions (Minor)

- **M1 — Theme-scoped custom properties collide in a file-global token map.** `collectTokens:105-111` is flat and last-wins, so `:root { --fg: #ffffff }` followed by `.light-theme { --fg: #111111 }` resolves `--fg` to `#111111` everywhere. CONFIRMED. For a design system with light/dark token sets this silently pairs against the wrong half. Given the ADR-ratified advisory scope, the honest fix is a one-line header note; the real fix is scoping tokens by selector, which is slice-B-sized.

- **M2 — A `;` inside a string or data-URI breaks declaration splitting.** `parseRules:87` splits on a bare `;`. CONFIRMED: `.a { background: #0f172a url("data:image/svg+xml;base64,AAAA") no-repeat; color: #333333; }` → 0 findings; the background value is truncated to `#0f172a url("data:image/svg+xml`. Silent false negative.

- **M3 — `/*` inside a string value, or an unclosed comment, eats the rest of the file.** `stripComments:55-57` is regex-based and string-unaware. CONFIRMED both: `.a { content: "/*"; background: #ffffff; } .a i { color: #eeeeee; }` → 0 findings; and `.a { background:#0f172a; } /* oops` → 0 findings. Silent, total.

- **M4 — Braces inside an attribute-selector string desync the brace walker.** `parseRules:71-78` counts `{`/`}` without string awareness. CONFIRMED: `.a[title="{"] { background: #000000; } .a { color: #050505; }` → 0 findings.

  M2–M4 share one root cause and one fix: a ~30-line character scanner that tracks "in string" / "in comment" state, feeding both `stripComments` and `parseRules`, instead of three independent regexes. That is the smallest thing that makes the parser honest about strings, and it is strictly less code than the three special cases it replaces. **This is the answer to your "where does hand-rolled parsing break" question: it breaks wherever CSS has a string, and it breaks *silently to zero*, which for this tool is the worst available failure mode.**

- **M5 — Reduced-motion coverage is file-level, so one unrelated reduce block silences every motion finding in the file.** CONFIRMED: `.spin { animation: ... } .slide { transform: ... } @media (prefers-reduced-motion: reduce) { .unrelated { transform: none; } }` → `hasReducedMotionBlock: true`, and `main:436` therefore reports nothing. ADR-0013 §202 explicitly declares selector matching out of scope, so this is ratified behaviour, not a defect. But the header comment at `:9` ("motion declarations lacking reduced-motion coverage") implies per-declaration coverage. Add one line to the WHAT THIS IS NOT block: *"reduced-motion coverage is file-level — a reduce block anywhere silences motion findings everywhere in that file."* For a tool whose whole premise is not overstating itself, the header should not overstate.

- **M6 — `contrastRatio` throws on non-hex input.** `relativeLuminance:37` calls `normalizeHex(hex).slice(1)` with no null check. Internal callers always pass resolved hex, so this is unreachable today — but `contrastRatio` is exported, so `contrastRatio("red", "#fff")` is a `TypeError` on an exported API. Return `null` or throw a named error.

- **M7 — The summary count conflates units.** `main:448` does `failures++` once per *file* for motion but once per *finding* for contrast, so `N finding(s)` mixes the two. Count `motionUncovered.length`, or rename to `issue(s)`.

## Lens verdicts

**Pierrot — clean on security; the robustness half found C1.** No injection surface (the only dynamic `RegExp`, `extractBracedValue:167`, is built from the hardcoded literal `"class"`). No network, no `eval`, no secrets, no new dependencies — V2 confirmed, root `package.json` still has zero deps and zero devDeps. Path handling is read-only from argv with a caught error; there is no traversal concern in a local dev CLI the user points at their own files.

**ReDoS: I tried to break it and could not.** The suspicious pattern is `parseMarkup:190`'s `(?:[^<>"']|"[^"]*"|'[^']*')*?` — nested quantifier with alternation, the textbook shape. Measured against adversarial `<div "a'"a'...` inputs at n = 16/20/24/26: **0 ms at every size, no superlinear growth.** The alternation branches are disjoint on their first character, so there is no ambiguity for the engine to backtrack through. Not a finding.

**Recursion: bounded.** 6000-deep `@media` nesting completes in ~1s with no stack overflow (`parseRules` depth equals nesting depth, and the fallback-chain regex at `:124` uses `[^)]*`, which cannot match a nested `var()`, so `resolveColor` depth is bounded by the distinct-token count via `seen`). The O(n²) slicing in `parseRules` is theoretically present but irrelevant for a tool run against a repo's own stylesheets. Not a finding.

**Archie — conforms to ADR-0013 §6's binding constraint, with one caveat.** Verified: ships as `check-css-contrast-motion`, not `design-floor-check` (honest narrow name ✓); exits 0 without `--strict` ✓; `grep` across `.github/` and `docs/process/done-gate.md` for `check:css`/`check-css` returns **nothing**, so it is not gate-wired ✓; Done Gate item 8 is unchanged and still *inferential* ✓. Conforms to ADR-0012 §B (script layer, deterministic, every runtime). The one caveat is **I6**: the constraint holds by current behaviour, not by any fitness function — an ADR clause with no test is a comment, and this ADR's own §300 anticipates the check being modified under pressure. Adding the exit-code test converts the constraint from prose to canon. ADR-0007 boundary: canon→meta edges are clean (agent-notes deps point only at `docs/adrs/0013-*` and `.claude/agents/dani.md`, and `check:canon` passes per V1); the payload issue is **I7**.

**Vik — the code is well-organized and unusually well-commented; the complexity concern is I2, and the YAGNI concern is I5.** Section banners, a header that states what the tool is *not*, and comments that explain *why* rather than *what* — this reads like something a junior could navigate at 2am, which is the bar. Two deductions: the unranked dual path in `findContrastFindings` (I2), and one dead field whose comment promises behaviour it does not have (I5). No `summon:` markers are present; given that M1–M5 are all knowingly-accepted precision limits, one or two of them are exactly what the marker convention is for (`docs/methodology/debt-markers.md`) — M1 and M5 in particular have named upgrade paths (scoped tokens, selector matching) that belong on the record rather than in a reviewer's head.

**Tara — the gap is the CLI, not the count.** See I6 for the concrete list. The pure-function tests are good tests: they assert behaviour, they read as documentation, they have no timing or ordering dependencies, and none of them are flaky. The distribution is the problem.

## Lessons

1. **An entry-point guard that fails to silence is a false-green machine.** `import.meta.url === \`file://${process.argv[1]}\`` is a widely-copied idiom and it is wrong for any path with a space, a non-ASCII character, or a Windows drive letter. It fails by doing *nothing*, with exit 0. Always `pathToFileURL(process.argv[1]).href`. More generally: when a guard can be wrong, make it wrong *loudly*. C1 would have been caught the first time anyone ran this from `~/My Projects/` — except it wouldn't, because the symptom is indistinguishable from success.

2. **When you build both a precise path and a fallback, rank them — don't let them tie.** I2's dual path is the right design (DOM ancestry is better evidence; a bare stylesheet has none). The bug is that both paths write into one dedupe bucket keyed on fields that cannot express "one of these is better." Two evidence sources always need a precedence rule, and if you cannot state the rule, you do not yet have one algorithm — you have two, sharing a variable.

3. **Unsupported input must fail in one direction, and it should be the quiet one.** This file does both. `matchesSelector` returns `false` for `~`/`+` (correct: refuse to guess). `parseCompound` returns a universal match for `#id` and `[attr]` (wrong: guesses, and guesses "yes"). Grep your own parser for every construct you did not model, and confirm each one lands on the same side. For a tool whose findings are meant to be believed, "unrecognized" must mean "silent," never "matches everything."

4. **Regexes cannot parse strings, and they fail to zero.** M2, M3, and M4 are three faces of one omission: `;`, `/*`, and `{` all mean something different inside a CSS string, and none of the three regexes knows what a string is. Each one produces *zero findings*, silently, on input that is perfectly ordinary. If you hand-roll a parser for a format with string literals, the string-state scanner is not the polish pass — it is the first thing you write, and it is usually smaller than the special cases it replaces.

5. **An architectural constraint with no test is a comment.** ADR-0013 §6 binds this script to advisory-only. That constraint currently holds because the code happens to be written that way, and it is asserted nowhere. Constraints that matter get fitness functions — here, a two-line test on the exit code. This is what "executable canon" (ADR-0012) means concretely: the ADR stops being a document someone has to remember and becomes something CI enforces.

6. **Coverage is a map of risk, not a number.** 27 tests is a healthy-sounding figure, and 19 of them cover the pure functions least likely to break, while 0 cover the CLI where the Critical bug lives. When you count tests, ask which *region* each one defends — and specifically, whether anything defends the glue code that everyone assumes is too simple to be wrong.

7. **For a tool that claims "believe me when I speak," false positives outrank false negatives.** Standard severity instinct says a missed defect is worse than a spurious one. This tool inverts that, because it has already disclaimed completeness in its own header — silence is documented as meaningless, so a false negative costs nothing the ADR did not already concede. A false positive, by contrast, spends the only capital the tool has. Calibrate severity to what the tool *claims*, not to a general rule.

REVIEW-COMPLETE: 15 findings (1 critical, 7 important)
