// agent-notes: { ctx: "TDD red — the install manifest module (ADR-0006 #6, ADR-0015)", deps: ["src/manifest.ts"], state: draft, last: "tara@2026-09-11", key: ["buildManifest is pure: a pinned Date, no clock read, source passed through verbatim, so the download branch's source is covered without the network", "readManifest's lax read (null when absent or unreadable, unknown keys kept) carries over from addons/impeccable.ts so nothing is lost in the move; impeccable.test.ts still imports readManifest from the add-on module", "writeManifest writes exactly the object given: an overwrite drops the old file's keys"] }

import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildManifest, readManifest, writeManifest } from "../src/manifest.ts";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "summon-manifest-"));
  tempDirs.push(dir);
  return dir;
}

/** Write .summon/manifest.json under `root` verbatim, creating .summon/ as needed. */
function plant(root: string, contents: string): void {
  mkdirSync(join(root, ".summon"), { recursive: true });
  writeFileSync(join(root, ".summon", "manifest.json"), contents);
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

// Pinned inputs: no clock read anywhere in this file. The expected timestamp is computed for
// this instant, not the live one.
const NOW = new Date("2026-09-11T12:34:56.789Z");
const VERSION = "1.2.3";
const TEMPLATE = "github:summon-dev/summon";

// ---------------------------------------------------------------------------
// buildManifest — pure; the scaffolder calls it then writeManifest
// ---------------------------------------------------------------------------

describe("buildManifest", () => {
  it("passes the download source through verbatim: the template constant already carries its scheme", () => {
    // The third review's critical: the download branch wrote `github:github:…`. This is that
    // branch's coverage without the network: the scaffolder hands the constant over as given.
    const m = buildManifest({ version: VERSION, source: TEMPLATE, now: NOW });
    expect(m.source).toBe("github:summon-dev/summon");
  });

  it("passes the local source through as the bare string local: no path", () => {
    const m = buildManifest({ version: VERSION, source: "local", now: NOW });
    expect(m.source).toBe("local");
  });

  it("stamps scaffolded as the given instant in ISO form", () => {
    const m = buildManifest({ version: VERSION, source: "local", now: NOW });
    expect(m.scaffolded).toBe("2026-09-11T12:34:56.789Z");
    expect(m.scaffolded).toBe(NOW.toISOString());
  });

  it("fixes manifestVersion at 1 and targets at claude", () => {
    const m = buildManifest({ version: VERSION, source: "local", now: NOW });
    expect(m.manifestVersion).toBe(1);
    expect(m.targets).toStrictEqual(["claude"]);
  });

  it("carries the given version as summonVersion and nothing beyond the five fields", () => {
    const m = buildManifest({ version: VERSION, source: TEMPLATE, now: NOW });
    expect(m).toStrictEqual({
      manifestVersion: 1,
      summonVersion: "1.2.3",
      targets: ["claude"],
      scaffolded: "2026-09-11T12:34:56.789Z",
      source: "github:summon-dev/summon",
    });
  });

  it("is deterministic and touches no disk: the same inputs give the same manifest, and nothing is written", () => {
    const root = makeTempDir();
    const a = buildManifest({ version: VERSION, source: "local", now: NOW });
    const b = buildManifest({ version: VERSION, source: "local", now: new Date(NOW.getTime()) });
    expect(a).toStrictEqual(b);
    expect(existsSync(join(root, ".summon"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// readManifest — moved from addons/impeccable.ts; its lax read carries over (ADR-0014 §5, §6)
// ---------------------------------------------------------------------------

describe("readManifest", () => {
  it("returns null when .summon/manifest.json is absent", () => {
    expect(readManifest(makeTempDir())).toBeNull();
  });

  it("returns null when .summon/ exists but the manifest does not", () => {
    const root = makeTempDir();
    mkdirSync(join(root, ".summon"), { recursive: true });
    expect(readManifest(root)).toBeNull();
  });

  it("reads a minimal manifest", () => {
    const root = makeTempDir();
    plant(root, JSON.stringify({ manifestVersion: 1 }));
    expect(readManifest(root)).toStrictEqual({ manifestVersion: 1 });
  });

  it("keeps an unknown top-level key: the schema is not strict, a newer writer's field survives", () => {
    const root = makeTempDir();
    plant(root, JSON.stringify({ manifestVersion: 1, futureField: 1 }));
    expect(() => readManifest(root)).not.toThrow();
    expect(readManifest(root)).toMatchObject({ futureField: 1 });
  });

  it("returns null on a malformed manifest rather than throwing", () => {
    // Carried from the add-on module: the installer has write access to the project before
    // Summon reads this, and ADR-0014 §6 forbids the add-on being fatal to a completed scaffold.
    const root = makeTempDir();
    plant(root, "{ not json at all");
    expect(() => readManifest(root)).not.toThrow();
    expect(readManifest(root)).toBeNull();
  });

  it("returns null when the manifest is a JSON array, not an object", () => {
    const root = makeTempDir();
    plant(root, JSON.stringify([1, 2, 3]));
    expect(readManifest(root)).toBeNull();
  });

  it("returns null when the manifest is a bare JSON scalar", () => {
    const root = makeTempDir();
    plant(root, "42");
    expect(readManifest(root)).toBeNull();
  });

  it("tolerates a newer manifestVersion than this CLI knows", () => {
    const root = makeTempDir();
    plant(root, JSON.stringify({ manifestVersion: 99, futureField: 1 }));
    expect(() => readManifest(root)).not.toThrow();
    expect(readManifest(root)).toMatchObject({ manifestVersion: 99 });
  });
});

// ---------------------------------------------------------------------------
// writeManifest — writes the given object; readManifest gives it back
// ---------------------------------------------------------------------------

describe("writeManifest", () => {
  it("creates .summon/ and the file when neither exists, and readManifest round-trips the manifest exactly", () => {
    const root = makeTempDir();
    const m = buildManifest({ version: VERSION, source: "local", now: NOW });
    writeManifest(root, m);
    expect(existsSync(join(root, ".summon", "manifest.json"))).toBe(true);
    expect(readManifest(root)).toStrictEqual(m);
  });

  it("writes JSON a reader other than this module can parse", () => {
    const root = makeTempDir();
    const m = buildManifest({ version: VERSION, source: TEMPLATE, now: NOW });
    writeManifest(root, m);
    const raw = readFileSync(join(root, ".summon", "manifest.json"), "utf8");
    expect(JSON.parse(raw)).toStrictEqual(m);
  });

  it("preserves an unknown key through write then read", () => {
    const root = makeTempDir();
    const withExtra = { ...buildManifest({ version: VERSION, source: "local", now: NOW }), futureField: 1 };
    writeManifest(root, withExtra);
    expect(readManifest(root)).toStrictEqual(withExtra);
  });

  it("overwrites an existing manifest: the old file's fields, including keys the new one lacks, are gone", () => {
    // The scaffolder's case: the template carried a stale manifest and the stamp replaces it.
    const root = makeTempDir();
    plant(
      root,
      JSON.stringify({
        manifestVersion: 0,
        summonVersion: "0.0.0-template",
        targets: ["copilot"],
        scaffolded: "1999-01-01T00:00:00.000Z",
        source: "github:stale/template",
        addons: [{ name: "stale" }],
      })
    );
    const m = buildManifest({ version: VERSION, source: "local", now: NOW });
    writeManifest(root, m);
    expect(readManifest(root)).toStrictEqual(m);
  });
});
