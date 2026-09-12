// agent-notes: { ctx: "the install manifest: .summon/manifest.json read, write, build (ADR-0006 #6, ADR-0015)", deps: ["node:fs", "../../../docs/methodology/team-layers.md"], state: active, last: "sato@2026-09-11", key: ["readManifest is lax on purpose (ADR-0014 §5, §6): null when absent, unreadable, malformed, or not an object; unknown top-level keys survive", "writeManifest writes exactly the object given, pretty JSON with a trailing newline, and creates .summon/ itself since the scaffolder's EXCLUDE_DIRS strips that directory from the template", "buildManifest is pure: the caller passes the clock and the source verbatim (the template constant on the download path, the bare string local on --local: never a path)"] }

/**
 * The one install manifest, `.summon/manifest.json` (ADR-0006 § Additional
 * Decisions #6; team-layers.md § The version). The scaffolder writes it on every
 * scaffold, Case A included — ADR-0015 supersedes ADR-0006's clause that a
 * Claude-only install writes none. The add-on installer (addons/impeccable.ts)
 * appends to it; `doctor` and `team-log.mjs --version` read it.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** The five fields every scaffold stamps. Readers must tolerate more (ADR-0014 §5). */
export interface Manifest {
  manifestVersion: 1;
  summonVersion: string;
  targets: string[];
  scaffolded: string;
  source: string;
}

function manifestPath(root: string): string {
  return join(root, ".summon", "manifest.json");
}

/**
 * Reads `.summon/manifest.json`, or null when there isn't one.
 *
 * ADR-0014 §5: the schema must NOT be strict on unknown top-level keys. An older
 * `summon-team` reading a newer manifest must ignore fields it does not know,
 * not hard-fail — forward compatibility across CLI versions is the entire point
 * of a persistent on-disk artifact, and strictness would turn every future
 * additive field into a breaking change. That is why this returns parsed JSON
 * rather than validating against a schema.
 */
export function readManifest(root: string): Record<string, unknown> | null {
  const path = manifestPath(root);
  if (!existsSync(path)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    // Unreadable or malformed reads as absent rather than throwing. The add-on
    // must not be fatal to a completed scaffold (ADR-0014 §6), and this file is
    // one the untrusted installer had write access to before Summon got here.
    return null;
  }
  // A non-object (`null`, an array, a bare number) is not a manifest. Returning
  // it would let a payload-supplied array reach the spread in `writeAddonEntry`.
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  return parsed as Record<string, unknown>;
}

/**
 * Writes `manifest` as `.summon/manifest.json`, verbatim: whatever keys it
 * carries land, whatever the old file carried does not. Creates `.summon/`
 * when absent — the scaffolder strips that directory from the template, so on
 * a fresh scaffold it never exists yet.
 */
export function writeManifest(root: string, manifest: Record<string, unknown>): void {
  mkdirSync(join(root, ".summon"), { recursive: true });
  writeFileSync(manifestPath(root), `${JSON.stringify(manifest, null, 2)}\n`);
}

/**
 * The manifest a scaffold stamps. Pure: the caller supplies the clock, so the
 * download branch's `source` is testable without the network and the stamp is
 * testable without a clock read.
 */
export function buildManifest(input: { version: string; source: string; now: Date }): Manifest {
  return {
    manifestVersion: 1,
    summonVersion: input.version,
    targets: ["claude"],
    scaffolded: input.now.toISOString(),
    source: input.source,
  };
}
