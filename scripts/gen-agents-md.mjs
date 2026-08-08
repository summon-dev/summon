#!/usr/bin/env node
// agent-notes: { ctx: "generates AGENTS.md as a projection of the register spec", deps: [docs/process/communication-registers.md, docs/adrs/0015-communication-registers.md], state: active, last: "claude@2026-08-09", key: ["AGENTS.md is DERIVED — never hand-edit it; edit the process doc and regenerate", "--check mode exits 1 on drift so CI and check-canon share one implementation", "staleness is a sha256 of the SOURCE, embedded in the output as an HTML comment", "relative links are rewritten docs/process-relative -> repo-root-relative, because the projection sits at the root"] }
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
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "docs", "process", "communication-registers.md");
const OUTPUT = join(ROOT, "AGENTS.md");

/** The marker the staleness check reads. Kept on its own line so it greps cleanly. */
export const SHA_MARKER = "source-sha256";

export const sourceHash = (text) => createHash("sha256").update(text).digest("hex");

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
    .replace(/\]\((?!https?:|#|docs\/)([^)]+\.md)\)/g, "](docs/process/$1)")
    .trim();
}

export function renderAgentsMd(sourceText) {
  return `<!-- agent-notes: { ctx: "cross-runtime projection of the communication contract", deps: [docs/process/communication-registers.md], state: generated, last: "gen-agents-md@2026-08-09", key: ["GENERATED — edit the source and rerun, never this file", "the process doc wins over this projection on any disagreement"] } -->
<!-- GENERATED FILE — DO NOT EDIT. -->
<!-- Source: docs/process/communication-registers.md · regenerate with \`node scripts/gen-agents-md.mjs\` -->
<!-- ${SHA_MARKER}: ${sourceHash(sourceText)} -->

# AGENTS.md

This file is the cross-runtime projection of Summon's communication contract. Every agent working in this repository — whichever runtime it runs under — follows what is below.

**This is a projection, not the source.** Edit \`docs/process/communication-registers.md\` and regenerate. Where a pointer, a projection, and the process doc disagree, **the process doc wins**.

---

${body(sourceText)}
`;
}

/** Returns null when in sync, or a human-readable reason when stale. */
export function findStaleness(sourceText, outputText) {
  if (outputText === null) return "AGENTS.md does not exist — run `node scripts/gen-agents-md.mjs`";
  const declared = new RegExp(`${SHA_MARKER}:\\s*([0-9a-f]{64})`).exec(outputText)?.[1];
  if (!declared) {
    return `AGENTS.md carries no ${SHA_MARKER} marker — it was hand-written or truncated rather than generated`;
  }
  const actual = sourceHash(sourceText);
  if (declared !== actual) {
    return `AGENTS.md is stale: built from ${declared.slice(0, 12)}… but communication-registers.md now hashes to ${actual.slice(0, 12)}… — regenerate with \`node scripts/gen-agents-md.mjs\``;
  }
  return null;
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
  console.log(`AGENTS.md written from ${SHA_MARKER} ${sourceHash(source).slice(0, 12)}…`);
}
