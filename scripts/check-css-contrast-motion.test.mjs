#!/usr/bin/env node
// agent-notes: { ctx: "tests for the static CSS contrast + motion checker (ADR-0013 §6 slice A)", deps: [scripts/check-css-contrast-motion.mjs, docs/adrs/0013-design-authority.md], state: active, last: "claude@2026-08-06", key: ["red-phase-first: written before the implementation", "covers the two defects the gate found in our own repo: TeamGrid hover borders and global.css paint-vs-motion", "stdlib node:test only — the script and its tests are both zero-dependency"] }
//
//   node --test scripts/
//
// These encode the two findings that survived the ADR-0013 §6 gates:
//   - ancestor-scoped pairing (not co-declaration) is what finds real defects
//   - motion checks must split motion properties from paint properties

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  contrastRatio,
  collectTokens,
  resolveColor,
  findContrastFindings,
  findMotionFindings,
  extractCss,
  parseMarkup,
  matchesSelector,
} from "./check-css-contrast-motion.mjs";

// ── contrastRatio ────────────────────────────────────────────────────────────

test("contrastRatio: black on white is 21:1", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
});

test("contrastRatio: is symmetric", () => {
  assert.equal(contrastRatio("#7f1d1d", "#0f172a"), contrastRatio("#0f172a", "#7f1d1d"));
});

test("contrastRatio: reproduces the values the gate verified by hand", () => {
  // global.css:5-6's annotated pair, and the value it rejected.
  assert.equal(contrastRatio("#ffffff", "#4f46e5").toFixed(2), "6.29");
  assert.equal(contrastRatio("#ffffff", "#6366f1").toFixed(2), "4.47");
  // The two accents issue #86 is about.
  assert.equal(contrastRatio("#7f1d1d", "#0f172a").toFixed(2), "1.78");
  assert.equal(contrastRatio("#9f1239", "#0f172a").toFixed(2), "2.23");
});

test("contrastRatio: accepts 3-digit hex", () => {
  assert.equal(contrastRatio("#fff", "#000"), contrastRatio("#ffffff", "#000000"));
});

// ── token collection + resolution ────────────────────────────────────────────

test("collectTokens: picks up custom properties declared anywhere in the file", () => {
  const tokens = collectTokens(`:root { --accent: #4f46e5; }\n.x { --local: #fff; }`);
  assert.equal(tokens.get("--accent"), "#4f46e5");
  assert.equal(tokens.get("--local"), "#fff");
});

test("resolveColor: resolves a literal, a var(), and a chained var()", () => {
  const tokens = collectTokens(`:root { --a: #123456; --b: var(--a); }`);
  assert.equal(resolveColor("#123456", tokens), "#123456");
  assert.equal(resolveColor("var(--a)", tokens), "#123456");
  assert.equal(resolveColor("var(--b)", tokens), "#123456");
});

test("resolveColor: returns null for anything it cannot statically resolve", () => {
  const tokens = collectTokens(`:root { --a: #123456; }`);
  // Undefined token, a computed function, and a keyword we deliberately don't guess at.
  assert.equal(resolveColor("var(--nope)", tokens), null);
  assert.equal(resolveColor("color-mix(in srgb, var(--a), white 42%)", tokens), null);
  assert.equal(resolveColor("inherit", tokens), null);
});

// ── ancestor-scoped contrast ─────────────────────────────────────────────────

test("findContrastFindings: pairs a descendant's color against an ancestor's background", () => {
  const css = `.card { background: #0f172a; } .card h3 { color: #94a3b8; }`;
  const f = findContrastFindings(css);
  assert.equal(f.length, 1);
  assert.equal(f[0].fg, "#94a3b8");
  assert.equal(f[0].bg, "#0f172a");
  assert.equal(f[0].passes, true); // 6.96:1 clears 4.5
});

test("findContrastFindings: still finds a co-declared pair on one selector", () => {
  const css = `.btn { background: #4f46e5; color: #fff; }`;
  const f = findContrastFindings(css);
  assert.equal(f.length, 1);
  assert.equal(f[0].passes, true);
});

test("findContrastFindings: flags text below 4.5:1", () => {
  const css = `.card { background: #0f172a; } .card .dim { color: #334155; }`;
  const [finding] = findContrastFindings(css);
  assert.equal(finding.passes, false);
  assert.equal(finding.threshold, 4.5);
});

test("findContrastFindings: holds border-color to 3:1, not 4.5:1 (WCAG 1.4.11)", () => {
  // This is issue #86's exact shape: an accent border on the fixed-dark card.
  const css = `.hero-card { background: #0f172a; } .hero-card:hover { border-color: #7f1d1d; }`;
  const [finding] = findContrastFindings(css);
  assert.equal(finding.threshold, 3);
  assert.equal(finding.passes, false);
  assert.equal(finding.ratio.toFixed(2), "1.78");
});

test("findContrastFindings: does not invent pairs when no ancestor declares a background", () => {
  assert.equal(findContrastFindings(`.lonely { color: #94a3b8; }`).length, 0);
});

test("findContrastFindings: skips pairs it cannot statically resolve rather than guessing", () => {
  const css = `.card { background: #0f172a; } .card .x { color: color-mix(in srgb, var(--accent), white 42%); }`;
  assert.equal(findContrastFindings(css).length, 0);
});

// ── motion ───────────────────────────────────────────────────────────────────

test("findMotionFindings: a transform with no reduced-motion block is reported", () => {
  const { motion, hasReducedMotionBlock } = findMotionFindings(`.card:hover { transform: translateY(-3px); }`);
  assert.equal(hasReducedMotionBlock, false);
  assert.equal(motion.length, 1);
  assert.equal(motion[0].property, "transform");
});

test("findMotionFindings: paint-only transitions are NOT motion (WCAG 2.3.3 excludes colour)", () => {
  const { motion } = findMotionFindings(`.a { transition: background 0.15s ease; } .b { transition: border-color 0.15s ease; }`);
  assert.equal(motion.length, 0, "background/border-color transitions must not be flagged as motion");
});

test("findMotionFindings: a transition naming a motion property IS motion", () => {
  const { motion } = findMotionFindings(`.card { transition: transform 0.15s ease, box-shadow 0.15s ease; }`);
  assert.equal(motion.length, 1);
});

test("findMotionFindings: detects an existing reduced-motion block", () => {
  const css = `.card { transform: scale(1); }\n@media (prefers-reduced-motion: reduce) { .card { transform: none; } }`;
  assert.equal(findMotionFindings(css).hasReducedMotionBlock, true);
});

test("findMotionFindings: animation and keyframe-driven motion count", () => {
  const { motion } = findMotionFindings(`.spin { animation: rot 1s linear infinite; }`);
  assert.equal(motion.length, 1);
  assert.equal(motion[0].property, "animation");
});

// ── markup-derived DOM ancestry ──────────────────────────────────────────────
//
// The reason these exist: in a real single-file component the background sits on
// `.hero-card` while the text rule is `.hero-meta h3`. Neither selector string
// contains the other, so selector-prefix matching finds nothing. The ancestry is
// in the markup, and only the markup.

test("parseMarkup: records each element's ancestor chain", () => {
  const els = parseMarkup(`<article class="hero-card"><div class="hero-meta"><h3>x</h3></div></article>`);
  const h3 = els.find((e) => e.tag === "h3");
  assert.ok(h3, "should find the h3");
  assert.deepEqual(
    h3.ancestors.map((a) => a.classes).flat(),
    ["hero-meta", "hero-card"],
    "nearest ancestor first"
  );
});

test("parseMarkup: ignores void and self-closing tags when building depth", () => {
  const els = parseMarkup(`<div class="a"><img src="x"/><span class="b">y</span></div>`);
  const span = els.find((e) => e.classes.includes("b"));
  assert.deepEqual(span.ancestors.map((a) => a.classes).flat(), ["a"]);
});

test("parseMarkup: recovers static class fragments from a dynamic class expression", () => {
  // Real Astro/JSX: class={`hero-card${cond ? ' composite' : ''}`}
  const els = parseMarkup("<article class={`hero-card${x ? ' composite' : ''}`}><h3>y</h3></article>");
  const article = els.find((e) => e.tag === "article");
  assert.ok(article.classes.includes("hero-card"), "the always-present prefix must be recovered");
  assert.equal(article.dynamicClasses, true, "and the element must be marked as partly dynamic");
});

test("parseMarkup: a fully computed class list yields no classes rather than a guess", () => {
  const [el] = parseMarkup("<div class={someVar}>x</div>");
  assert.deepEqual(el.classes, []);
});

test("matchesSelector: handles tag, class, compound, and descendant forms", () => {
  const el = { tag: "h3", classes: [], ancestors: [{ tag: "div", classes: ["hero-meta"] }, { tag: "article", classes: ["hero-card"] }] };
  assert.equal(matchesSelector("h3", el), true);
  assert.equal(matchesSelector(".hero-meta h3", el), true);
  assert.equal(matchesSelector(".hero-card h3", el), true, "non-adjacent ancestor still matches");
  assert.equal(matchesSelector(".nope h3", el), false);
  assert.equal(matchesSelector("h4", el), false);
});

test("matchesSelector: strips pseudo-classes, since :hover styles the same element", () => {
  const el = { tag: "article", classes: ["hero-card"], ancestors: [] };
  assert.equal(matchesSelector(".hero-card:hover", el), true);
});

test("findContrastFindings: uses markup ancestry to pair across sibling class selectors", () => {
  const astro = `<article class="hero-card"><div class="hero-meta"><h3>x</h3></div></article>
<style>
  .hero-card { background: #0f172a; }
  .hero-meta h3 { color: #f1f5f9; }
</style>`;
  const findings = findContrastFindings(extractCss(astro, "X.astro"), parseMarkup(astro));
  assert.equal(findings.length, 1, "selector-prefix matching alone would find zero here");
  assert.equal(findings[0].bg, "#0f172a");
  assert.equal(findings[0].passes, true); // 16.3:1
});

// ── file handling ────────────────────────────────────────────────────────────

test("extractCss: returns a .css file whole", () => {
  assert.equal(extractCss(".a { color: red; }", "x.css"), ".a { color: red; }");
});

test("extractCss: pulls only the <style> block out of an .astro file", () => {
  const astro = `---\nconst x = 1;\n---\n<div class="a">hi</div>\n<style>\n  .a { color: #fff; }\n</style>`;
  const css = extractCss(astro, "X.astro");
  assert.match(css, /\.a \{ color: #fff; \}/);
  assert.doesNotMatch(css, /const x/);
  assert.doesNotMatch(css, /<div/);
});
