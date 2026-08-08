#!/usr/bin/env node
// agent-notes: { ctx: "generates AGENTS.md as a projection of the register spec", deps: [docs/process/communication-registers.md, docs/adrs/0015-communication-registers.md], state: active, last: "claude@2026-08-09", key: ["AGENTS.md is DERIVED — never hand-edit it; edit the process doc and regenerate", "--check mode exits 1 on drift so CI and check-canon share one implementation", "staleness is a BYTE COMPARISON against a fresh render — a source hash only proved what the source was, never that the output is its projection (Vik + Pierrot, Slice 2 review)", "renderAgentsMd must stay DETERMINISTIC: no clock, no randomness, or the comparison breaks", "relative links are rewritten docs/process-relative -> repo-root-relative, because the projection sits at the root"] }
//
//   node scripts/gen-agents-md.mjs           # write AGENTS.md
//   node scripts/gen-agents-md.mjs --check   # exit 1 if AGENTS.md is stale or missing
//
// ADR-0015 Sub-decision 5: `docs/process/communication-registers.md` is the
// authored source; AGENTS.md at the repo root is a generated projection of it.
// The originating proposal authored AGENTS.md as a root original instead, which
// satisfies nothing in ADR-0006 — a root cross-runtime file authored as an
// original inverts the projection model on its first real test and sets a
// precedent that erodes it for every subsequent cross-runtime artifact.
//
// Precedence, stated because pointers rot: where a pointer, a projection, and
// the process doc disagree, THE PROCESS DOC WINS. Projections are rebuilt.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "docs", "process", "communication-registers.md");
const OUTPUT = join(ROOT, "AGENTS.md");

// Strip the agent-notes frontmatter (Summon plumbing, not contract content) and
// the H1, which the projection restates in its own banner.
function body(sourceText) {
  return sourceText
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/^#\s+.*\n/m, "")
    // The source sits in docs/process/, so its relative links resolve from
    // there. The projection sits at the repo root, so they must be rewritten or
    // every link in AGENTS.md 404s — the exact rot the precedence note warns of.
    .replace(/\]\(\.\.\/([^)]+)\)/g, "](docs/$1)")
    // The capture allows a trailing #fragment: without it `](done-gate.md#grades)`
    // shipped unrewritten and 404s from the root, while the ../ branch above
    // handled anchors fine. The two branches disagreeing for no reason is the
    // kind of silent hole nothing lints, since no check reads links in AGENTS.md.
    .replace(/\]\((?!https?:|#|docs\/)([^)\s]+\.md(?:#[^)\s]*)?)\)/g, "](docs/process/$1)")
    .trim();
}

// Pierrot, reviewing Slice 2: body() copies source prose verbatim into a file
// that CLAUDE.md @-imports, and nothing neutralises an `@path` token in that
// prose. Inert today — the only `@` in the source sits inside the frontmatter
// this function strips — but the source document is *about* how instructions get
// imported, which makes it the one doc most likely to grow an @-prefixed example.
// Refuse rather than sanitise: a transitive import nobody chose is worse than a
// failed build, and silently rewriting someone's example would be its own defect.
function refuseImportTokens(text) {
  const token = /^@[\w./-]+/m.exec(text);
  if (token) {
    throw new Error(
      `communication-registers.md line-starts with the import token "${token[0]}" — AGENTS.md is @-imported by CLAUDE.md, so projecting that would create a transitive import nobody chose. Indent it, fence it, or reword it.`
    );
  }
  return text;
}

export function renderAgentsMd(sourceText) {
  return `<!-- agent-notes: { ctx: "cross-runtime projection of the communication contract", deps: [docs/process/communication-registers.md], state: generated, last: "gen-agents-md@2026-08-09", key: ["GENERATED — edit the source and rerun, never this file", "the process doc wins over this projection on any disagreement"] } -->
<!-- GENERATED FILE — DO NOT EDIT. -->
<!-- Source: docs/process/communication-registers.md · regenerate with \`node scripts/gen-agents-md.mjs\` -->

# AGENTS.md

This file is the cross-runtime projection of Summon's communication contract. Every agent working in this repository — whichever runtime it runs under — follows what is below.

**This is a projection, not the source.** Edit \`docs/process/communication-registers.md\` and regenerate. Where a pointer, a projection, and the process doc disagree, **the process doc wins**.

---

${refuseImportTokens(body(sourceText))}
`;
}

/**
 * Returns null when AGENTS.md IS the projection of the source, or a reason when it is not.
 *
 * The verdict is a byte comparison against a fresh render, and it has to be.
 * The first version of this function embedded a sha256 of the SOURCE in the
 * output and compared that — which answers "what was the source when someone
 * last ran the generator" and NOT "is this file the projection of that source".
 * Those read as one question and are two. Vik and Pierrot each proved the gap
 * independently: preserve the one marker line, rewrite the contract underneath
 * it, and both this check and check-canon reported green. AGENTS.md is
 * @-imported into CLAUDE.md, so that is the coordinator's own operating
 * instructions passing CI with arbitrary content in them.
 *
 * A byte comparison catches both directions at once — source edited after
 * generation, AND output edited after generation — which is why the hash,
 * the crypto import and the hex regex are gone rather than kept alongside it.
 * The remaining branches exist only to say something more useful than "differs".
 */
export function findStaleness(sourceText, outputText) {
  if (outputText === null) return "AGENTS.md does not exist — run `node scripts/gen-agents-md.mjs`";
  if (outputText === renderAgentsMd(sourceText)) return null;
  return (
    "AGENTS.md is not the projection of docs/process/communication-registers.md — " +
    "either the source changed after generation, or AGENTS.md was edited by hand. " +
    "It is a generated file: make the change in the source and regenerate with `node scripts/gen-agents-md.mjs`"
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = readFileSync(SOURCE, "utf8");
  if (process.argv.includes("--check")) {
    const stale = findStaleness(source, existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : null);
    if (stale) {
      console.error(`AGENTS.md check: ${stale}`);
      process.exit(1);
    }
    console.log("AGENTS.md check: in sync");
    process.exit(0);
  }
  writeFileSync(OUTPUT, renderAgentsMd(source));
  console.log("AGENTS.md written from docs/process/communication-registers.md");
}
