// agent-notes: { ctx: "unit tests for the install provenance record", deps: ["src/provenance.ts"], state: active, last: "claude@2026-08-08" }

import { describe, expect, it } from "vitest";
import { PROVENANCE_FILE, buildProvenance } from "../src/provenance";

// A scaffolded project could not say where it came from. That matters more than
// it looks: with no --ref, `npx summon-team` installs whatever main's HEAD was at
// that moment, and an upstream revert never reaches a project already scaffolded
// (ADR-0015). So the only way to find affected projects is to ask each one what
// it was built from, and none of them could answer.

describe("buildProvenance", () => {
  const base = {
    template: "github:summon-dev/summon",
    cliVersion: "0.1.0",
    installedAt: "2026-08-08T01:23:45.000Z",
  };

  it("records the ref when one was requested", () => {
    const p = buildProvenance({ ...base, ref: "feat/comms-slice-1" });
    expect(p.ref).toBe("feat/comms-slice-1");
    expect(p.template).toBe("github:summon-dev/summon");
  });

  it("records ref as null when none was given, rather than omitting the key", () => {
    // An absent key and a null are different claims: "this install did not pin a
    // ref" versus "this record predates ref tracking". The same distinction
    // ADR-0015 draws for an empty unknowns[] against a missing one.
    const p = buildProvenance({ ...base, ref: undefined });
    expect(p.ref).toBeNull();
    expect("ref" in p).toBe(true);
  });

  it("carries a schema version so a later shape is migratable", () => {
    expect(buildProvenance({ ...base, ref: undefined }).schema).toBe(1);
  });

  it("records the CLI version that performed the install", () => {
    expect(buildProvenance({ ...base, ref: undefined }).cliVersion).toBe("0.1.0");
  });

  it("records when the install happened", () => {
    // Load-bearing for the no-ref case specifically. Without a ref the install
    // tracks a moving HEAD, so the timestamp is the only thing that narrows down
    // which commit was actually received.
    expect(buildProvenance({ ...base, ref: undefined }).installedAt).toBe(
      "2026-08-08T01:23:45.000Z"
    );
  });

  it("takes the timestamp as an argument rather than reading the clock", () => {
    // Purity is the point: a function that called Date.now() internally could not
    // be asserted against without freezing time.
    const a = buildProvenance({ ...base, ref: "x", installedAt: "2020-01-01T00:00:00.000Z" });
    expect(a.installedAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("names a local template by its path", () => {
    const p = buildProvenance({
      ...base,
      template: "/home/dev/summon",
      ref: undefined,
    });
    expect(p.template).toBe("/home/dev/summon");
    expect(p.ref).toBeNull();
  });

  it("serialises to stable, human-readable JSON", () => {
    // A person opening this file is the primary consumer, so it is pretty-printed
    // and key order is fixed rather than incidental.
    const json = JSON.stringify(buildProvenance({ ...base, ref: "feat/x" }), null, 2);
    expect(json).toContain('"schema": 1');
    expect(Object.keys(buildProvenance({ ...base, ref: "feat/x" }))).toEqual([
      "schema",
      "template",
      "ref",
      "cliVersion",
      "installedAt",
    ]);
  });

  it("writes to a dotfile at the project root", () => {
    expect(PROVENANCE_FILE).toBe(".summon-install.json");
  });
});
