// agent-notes: { ctx: "record of which template and ref produced a scaffolded project", deps: [], state: active, last: "claude@2026-08-08" }

/**
 * Written into every scaffolded project so it can say where it came from.
 *
 * A dotfile at the project root rather than something under `.claude/`: it
 * describes the install, not the agent configuration, and a person looking for
 * "what did I scaffold this from" should find it beside the README.
 */
export const PROVENANCE_FILE = ".summon-install.json";

export type Provenance = {
  schema: number;
  template: string;
  ref: string | null;
  cliVersion: string;
  installedAt: string;
};

/**
 * Build the provenance record.
 *
 * Pure, and the timestamp is an argument rather than a call to the clock, so the
 * result is assertable without freezing time.
 *
 * `installedAt` earns its place mainly in the *no-ref* case. Without a ref the
 * install resolves whatever the default branch pointed at in that moment, so the
 * timestamp is the only thing that narrows down which commit was received. It
 * does make two scaffolds of the same ref differ byte-for-byte, which would be a
 * real objection if the scaffolder produced reproducible trees — it does not,
 * since it runs `git init` and commits, and a commit carries its own timestamp.
 */
export function buildProvenance(input: {
  template: string;
  ref?: string;
  cliVersion: string;
  installedAt: string;
}): Provenance {
  return {
    schema: 1,
    template: input.template,
    // Null rather than omitted. "This install pinned no ref" and "this record
    // predates ref tracking" are different claims, and a missing key cannot tell
    // them apart — the same reason ADR-0015 makes an empty unknowns[] mandatory.
    ref: input.ref ?? null,
    cliVersion: input.cliVersion,
    installedAt: input.installedAt,
  };
}
