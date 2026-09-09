#!/usr/bin/env node
// agent-notes: { ctx: "tests for compose-team: layer composition, enforcement report, view isolation", deps: [scripts/compose-team.mjs, docs/methodology/team-layers.md, team/parties/summon-core.json], state: draft, last: "tara@2026-09-09", key: ["fixture tree in a tmpdir for invariants; the real team/ tree for the smoke test", "view isolation and prose-vs-tool enforcement are the load-bearing cases", "pre-flight: no clock reads; expected directions derived from team-layers.md, not from the composer"] }
//
//   node --test scripts/compose-team.test.mjs
//
// Red phase, written before scripts/compose-team.mjs existed. Each case names
// the sentence in docs/methodology/team-layers.md it pins.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { compose, loadTeam } from "./compose-team.mjs";

const SCRIPT = resolve(import.meta.dirname, "compose-team.mjs");
const REPO = resolve(import.meta.dirname, "..");

// --- fixture -----------------------------------------------------------------

const ROLE_TESTER = `---
name: tester
description: Writes failing tests first.
---
# Tester

## Charter

FIXTURE-TESTER-CHARTER You write the failing tests first.

## Standard

Fails for the right reason.

## Questions

1. Time pinned?

## Boundaries

FIXTURE-TESTER-BOUNDARY You do not write production code.

## Output

The tests.
`;

const ROLE_REVIEWER = `---
name: reviewer
description: Reads a change and reports what is wrong with it.
---
# Reviewer

## Charter

FIXTURE-REVIEWER-CHARTER You read a change and say what is wrong.

## Standard

Every finding cites a line.

## Questions

The lens supplies them.

## Output

By severity.
`;

const LENS_SIMPLICITY = `## Lens: Simplicity

FIXTURE-LENS-SIMPLICITY Could someone understand this at 2am?
`;

const LENS_SECURITY = `## Lens: Security

FIXTURE-LENS-SECURITY If an attacker saw this diff, what would they try?
`;

const PERSONA_TARA = `---
name: tara
role: tester
display: Tara
---
## Priors

FIXTURE-TARA-PRIORS A test that cannot fail is worse than none.

## Dissent

FIXTURE-TARA-DISSENT When the brief's arithmetic is off.

## Voice

FIXTURE-TARA-VOICE Precise and relentless.

"Counted the suite. Minus two."

## Tells

Reports counts.
`;

const PERSONA_VIK = `---
name: vik
role: reviewer
lens: simplicity
display: Vik
---
## Priors

FIXTURE-VIK-PRIORS Most abstractions are premature.

## Dissent

FIXTURE-VIK-DISSENT When an interface has one implementation.

## Voice

FIXTURE-VIK-VOICE Dry and unhurried.

"Two are gone."

## Tells

Counts callers.
`;

const PERSONA_PIERROT = `---
name: pierrot
role: reviewer
lens: security
display: Pierrot
---
## Priors

FIXTURE-PIERROT-PRIORS Every input is hostile.

## Dissent

FIXTURE-PIERROT-DISSENT When an audit trail was silently dropped.

## Voice

FIXTURE-PIERROT-VOICE Deadpan.

"Six seconds."

## Tells

Attaches a blast radius.
`;

const VIEW = {
  skin: "test-skin",
  title: "Fixture Party",
  members: {
    tara: { class: "FIXTURE-VIEW-CLASS-ARCHER", accent: "#ef4444", sprite: "tara.png", blurb: "FIXTURE-VIEW-BLURB-TARA" },
    vik: { class: "FIXTURE-VIEW-CLASS-WARDEN", accent: "#64748b", sprite: "vik.png", blurb: "FIXTURE-VIEW-BLURB-VIK" },
    pierrot: { class: "FIXTURE-VIEW-CLASS-NIGHTBLADE", accent: "#7f1d1d", sprite: "pierrot.png", blurb: "FIXTURE-VIEW-BLURB-PIERROT" },
  },
  formations: {
    "review-party": { class: "FIXTURE-VIEW-CLASS-PARTY", accent: "#4f46e5", sprite: "party.png", blurb: "FIXTURE-VIEW-BLURB-PARTY" },
  },
};

const HARNESS_CLAUDE = {
  harness: "claude-code",
  fitted: true,
  review: "on every release",
  output: { dir: ".claude/agents", file: "{name}.md" },
  capabilities: {
    read: ["Read", "Grep", "Glob"],
    run: ["Bash"],
    "write:src": ["Write", "Edit"],
    "write:tests": ["Write", "Edit"],
    "write:docs": ["Write", "Edit"],
    web: ["WebSearch", "WebFetch"],
  },
  frontmatter: { model: "inherit" },
  budget: { default: 20, reviewer: 15 },
};

const HARNESS_SKILLS = {
  harness: "skills",
  fitted: false,
  review: "when the spec changes",
  output: { dir: ".agents/skills", file: "{role}/SKILL.md" },
  personas: false,
  capabilities: {},
  frontmatter: {},
  budget: {},
};

const PARTY = {
  name: "fixture",
  harness: "claude-code",
  view: "test-skin",
  members: [
    { role: "tester", persona: "tara" },
    { role: "reviewer", lens: "simplicity", persona: "vik" },
    { role: "reviewer", lens: "security", persona: "pierrot" },
  ],
  formations: [
    {
      name: "review-party",
      role: "reviewer",
      members: [
        { persona: "vik", lens: "simplicity" },
        { persona: "pierrot", lens: "security" },
      ],
    },
  ],
};

/** Build a minimal team/ tree in a fresh tmpdir; `edit` mutates the file map before writing. */
function fixture(edit = () => {}) {
  const root = mkdtempSync(join(tmpdir(), "summon-team-"));
  const files = {
    "team/roles/tester/SKILL.md": ROLE_TESTER,
    "team/roles/tester/role.json": JSON.stringify({ may: ["read", "run", "write:tests"], "must-not": ["write:src"], lenses: [] }),
    "team/roles/reviewer/SKILL.md": ROLE_REVIEWER,
    "team/roles/reviewer/role.json": JSON.stringify({ may: ["read", "run"], "must-not": ["write:src", "write:tests", "write:docs"], lenses: ["simplicity", "security"] }),
    "team/roles/reviewer/lenses/simplicity.md": LENS_SIMPLICITY,
    "team/roles/reviewer/lenses/security.md": LENS_SECURITY,
    "team/personas/tara.md": PERSONA_TARA,
    "team/personas/vik.md": PERSONA_VIK,
    "team/personas/pierrot.md": PERSONA_PIERROT,
    "team/views/test-skin/party.json": JSON.stringify(VIEW),
    "team/harness/claude-code.json": JSON.stringify(HARNESS_CLAUDE),
    "team/harness/skills.json": JSON.stringify(HARNESS_SKILLS),
    "team/parties/fixture.json": JSON.stringify(PARTY),
  };
  edit(files);
  for (const [rel, content] of Object.entries(files)) {
    if (content === null) continue;
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

const fileNamed = (result, suffix) => result.files.find((f) => f.path.endsWith(suffix));
const frontmatterOf = (content) => content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";

// --- composition -------------------------------------------------------------

test("one agent file per member, named for the persona, in the adapter's output dir", () => {
  const out = compose(fixture(), { party: "fixture" });
  const agents = out.files.filter((f) => f.path.startsWith(".claude/agents/"));
  assert.deepEqual(
    agents.map((f) => f.path).sort(),
    [".claude/agents/pierrot.md", ".claude/agents/review-party.md", ".claude/agents/tara.md", ".claude/agents/vik.md"]
  );
});

test("frontmatter: name matches persona; tools come from role.may through the adapter; budget from the adapter", () => {
  const out = compose(fixture(), { party: "fixture" });
  const fm = frontmatterOf(fileNamed(out, "vik.md").content);
  assert.match(fm, /^name: vik$/m);
  assert.match(fm, /^tools: Read, Grep, Glob, Bash$/m);
  assert.match(fm, /^disallowedTools: Write, Edit$/m);
  assert.match(fm, /^model: inherit$/m);
  assert.match(fm, /^maxTurns: 15$/m, "reviewer budget is 15 in the fixture adapter");
  const taraFm = frontmatterOf(fileNamed(out, "tara.md").content);
  assert.match(taraFm, /^maxTurns: 20$/m, "tester has no budget entry, so the default applies");
});

test("body carries voice, charter, lens, priors, dissent, boundaries, output, in that order", () => {
  const out = compose(fixture(), { party: "fixture" });
  const body = fileNamed(out, "vik.md").content;
  const order = [
    "FIXTURE-VIK-VOICE",
    "FIXTURE-REVIEWER-CHARTER",
    "FIXTURE-LENS-SIMPLICITY",
    "FIXTURE-VIK-PRIORS",
    "FIXTURE-VIK-DISSENT",
  ].map((marker) => {
    const i = body.indexOf(marker);
    assert.notEqual(i, -1, `${marker} missing from composed vik.md`);
    return i;
  });
  for (let i = 1; i < order.length; i++) {
    assert.ok(order[i] > order[i - 1], `section ${i} is out of order`);
  }
  assert.doesNotMatch(body, /FIXTURE-LENS-SECURITY/, "a member bound to one lens must not receive the other lenses");
});

test("a member with no lens gets the role without any lens section", () => {
  const out = compose(fixture(), { party: "fixture" });
  const body = fileNamed(out, "tara.md").content;
  assert.match(body, /FIXTURE-TESTER-CHARTER/);
  assert.match(body, /FIXTURE-TESTER-BOUNDARY/);
  assert.doesNotMatch(body, /## Lens:/);
});

// --- the view never enters model context ------------------------------------
// team-layers.md: "They never enter an agent's context. A test on the composer pins that."

test("no view content reaches any agent file: not the class, not the accent, not the sprite, not the blurb", () => {
  const out = compose(fixture(), { party: "fixture" });
  const agents = out.files.filter((f) => f.path.startsWith(".claude/agents/"));
  assert.ok(agents.length > 0);
  const leaks = ["FIXTURE-VIEW-CLASS", "FIXTURE-VIEW-BLURB", "#ef4444", "#64748b", "#4f46e5", "tara.png", "vik.png", "party.png"];
  for (const f of agents) {
    for (const leak of leaks) {
      assert.ok(!f.content.includes(leak), `${f.path} contains view content "${leak}"`);
    }
  }
});

test("the roster is rendered from the view and names every member's class and display name", () => {
  const out = compose(fixture(), { party: "fixture" });
  const roster = fileNamed(out, "roster.md").content;
  for (const marker of ["Fixture Party", "Tara", "FIXTURE-VIEW-CLASS-ARCHER", "Vik", "FIXTURE-VIEW-CLASS-WARDEN", "FIXTURE-VIEW-CLASS-PARTY"]) {
    assert.ok(roster.includes(marker), `roster.md lacks ${marker}`);
  }
});

// --- the enforcement report --------------------------------------------------
// team-layers.md: "for every must-not in every member, whether the harness enforces it at
// the tool layer or only by prose." On Claude Code, write:src and write:tests share tools,
// so the tester's boundary is prose; the reviewer's is tool.

test("enforcement: a must-not whose tools are all withheld is tool-enforced; one whose tools the role also needs is prose", () => {
  const out = compose(fixture(), { party: "fixture" });
  const rows = out.enforcement;
  const find = (member, boundary) => rows.find((r) => r.member === member && r.boundary === boundary);
  assert.equal(find("tara", "write:src")?.level, "prose", "tester may write:tests, which shares Write/Edit with write:src");
  assert.equal(find("vik", "write:src")?.level, "tool");
  assert.equal(find("vik", "write:tests")?.level, "tool");
  assert.equal(find("review-party", "write:docs")?.level, "tool", "formations are reported too");
  const md = fileNamed(out, "enforcement.md").content;
  assert.match(md, /tara[^\n]*write:src[^\n]*prose/);
  assert.match(md, /vik[^\n]*write:src[^\n]*tool/);
});

test("enforcement: a prose boundary is still written into the agent body as a boundary sentence", () => {
  const out = compose(fixture(), { party: "fixture" });
  const body = fileNamed(out, "tara.md").content;
  assert.match(body, /FIXTURE-TESTER-BOUNDARY/, "the role's own Boundaries section carries the rule the tool layer cannot");
});

// --- formations --------------------------------------------------------------

test("a formation is one agent carrying every member's lens and dissent, with the role's tools", () => {
  const out = compose(fixture(), { party: "fixture" });
  const f = fileNamed(out, "review-party.md");
  assert.match(frontmatterOf(f.content), /^name: review-party$/m);
  assert.match(frontmatterOf(f.content), /^disallowedTools: Write, Edit$/m);
  for (const marker of ["FIXTURE-REVIEWER-CHARTER", "FIXTURE-LENS-SIMPLICITY", "FIXTURE-LENS-SECURITY", "FIXTURE-VIK-DISSENT", "FIXTURE-PIERROT-DISSENT"]) {
    assert.ok(f.content.includes(marker), `formation lacks ${marker}`);
  }
  const simplicity = f.content.indexOf("FIXTURE-LENS-SIMPLICITY");
  const security = f.content.indexOf("FIXTURE-LENS-SECURITY");
  assert.ok(simplicity < security, "lenses appear in party order");
});

// --- the skills adapter: roles only ------------------------------------------
// team-layers.md: "The skills adapter emits roles alone, no personas."

test("skills harness emits one SKILL.md per role used by the party, verbatim, and no persona text", () => {
  const out = compose(fixture(), { party: "fixture", harness: "skills" });
  const paths = out.files.map((f) => f.path).sort();
  assert.ok(paths.includes(".agents/skills/tester/SKILL.md"));
  assert.ok(paths.includes(".agents/skills/reviewer/SKILL.md"));
  assert.ok(!paths.some((p) => p.startsWith(".claude/agents/")), "no agent files on the skills target");
  const tester = fileNamed(out, "tester/SKILL.md").content;
  assert.equal(tester, ROLE_TESTER, "role text is emitted verbatim");
  for (const f of out.files) {
    assert.ok(!/FIXTURE-(TARA|VIK|PIERROT)-/.test(f.content), `${f.path} carries persona text on a roles-only target`);
  }
});

test("skills harness includes a role's lenses so a multi-lens role stays whole", () => {
  const out = compose(fixture(), { party: "fixture", harness: "skills" });
  const paths = out.files.map((f) => f.path);
  assert.ok(paths.includes(".agents/skills/reviewer/lenses/simplicity.md"));
  assert.ok(paths.includes(".agents/skills/reviewer/lenses/security.md"));
});

// --- refusals ----------------------------------------------------------------

test("refuses a party that names a persona with no file", () => {
  const root = fixture((files) => {
    files["team/parties/fixture.json"] = JSON.stringify({ ...PARTY, members: [{ role: "tester", persona: "nobody" }], formations: [] });
  });
  assert.throws(() => compose(root, { party: "fixture" }), /persona "nobody"/);
});

test("refuses a member whose persona is bound to a different role than the party assigns", () => {
  const root = fixture((files) => {
    files["team/parties/fixture.json"] = JSON.stringify({ ...PARTY, members: [{ role: "reviewer", persona: "tara" }], formations: [] });
  });
  assert.throws(() => compose(root, { party: "fixture" }), /tara.*bound to role "tester".*"reviewer"/);
});

test("a persona that holds two seats can be bound to either, and to nothing else", () => {
  const root = fixture((files) => {
    files["team/personas/tara.md"] = PERSONA_TARA.replace("role: tester\n", "role: tester\nholds: tester, reviewer/security\n");
    files["team/parties/fixture.json"] = JSON.stringify({
      ...PARTY,
      members: [{ role: "tester", persona: "tara" }, { role: "reviewer", lens: "security", persona: "tara" }],
      formations: [],
    });
  });
  const out = compose(root, { party: "fixture" });
  assert.equal(out.files.filter((f) => f.path.startsWith(".claude/agents/")).length, 2);
  const bad = fixture((files) => {
    files["team/personas/tara.md"] = PERSONA_TARA.replace("role: tester\n", "role: tester\nholds: tester, reviewer/security\n");
    files["team/parties/fixture.json"] = JSON.stringify({ ...PARTY, members: [{ role: "reviewer", lens: "simplicity", persona: "tara" }], formations: [] });
  });
  assert.throws(() => compose(bad, { party: "fixture" }), /tara.*holds: tester, reviewer\/security.*"reviewer" on lens "simplicity"/);
});

test("refuses a lens the role does not declare", () => {
  const root = fixture((files) => {
    files["team/parties/fixture.json"] = JSON.stringify({ ...PARTY, members: [{ role: "reviewer", lens: "vibes", persona: "vik" }], formations: [] });
  });
  assert.throws(() => compose(root, { party: "fixture" }), /lens "vibes"/);
});

test("refuses a persona whose Dissent section is empty", () => {
  // team-layers.md: "a persona whose Dissent section is empty ... should be cut."
  const root = fixture((files) => {
    files["team/personas/vik.md"] = PERSONA_VIK.replace(/## Dissent\n\n[^\n]+\n/, "## Dissent\n\n");
  });
  assert.throws(() => compose(root, { party: "fixture" }), /vik.*Dissent/);
});

test("refuses a harness adapter that does not declare whether it is fitted", () => {
  const root = fixture((files) => {
    const { fitted, ...rest } = HARNESS_CLAUDE;
    files["team/harness/claude-code.json"] = JSON.stringify(rest);
  });
  assert.throws(() => compose(root, { party: "fixture" }), /claude-code.*fitted/);
});

test("refuses a role file that names a harness capability by tool name instead of a work verb", () => {
  // team-layers.md: capabilities "are never tool names."
  const root = fixture((files) => {
    files["team/roles/tester/role.json"] = JSON.stringify({ may: ["Read", "Bash"], "must-not": [], lenses: [] });
  });
  assert.throws(() => compose(root, { party: "fixture" }), /capability "Read"/);
});

// --- the real tree -----------------------------------------------------------

test("the checked-in summon-core party composes on the claude-code adapter", () => {
  const out = compose(REPO, { party: "summon-core" });
  const names = out.files.filter((f) => f.path.startsWith(".claude/agents/")).map((f) => f.path);
  for (const n of ["sato", "tara", "archie", "wei", "vik", "pierrot", "review-party"]) {
    assert.ok(names.includes(`.claude/agents/${n}.md`), `summon-core lacks ${n}`);
  }
  const vik = fileNamed(out, "vik.md").content;
  assert.match(vik, /laziness ladder/i, "Vik carries the simplicity lens");
  assert.match(vik, /pick a side/i, "Vik carries his own tells");
  assert.doesNotMatch(vik, /Grey Warden/, "the view stays out of the prompt");
});

test("loadTeam reads every layer of the checked-in tree", () => {
  const team = loadTeam(REPO);
  assert.ok(Object.keys(team.roles).length >= 5);
  assert.ok(Object.keys(team.personas).length >= 6);
  assert.ok(team.views["jrpg-16bit"]);
  assert.ok(team.harnesses["claude-code"].fitted === true);
  assert.ok(team.parties["summon-core"]);
});

// --- the CLI -----------------------------------------------------------------

test("CLI writes the composed tree under --out and prints the enforcement summary", () => {
  const root = fixture();
  const out = join(root, "build");
  const stdout = execFileSync("node", [SCRIPT, "--party", "fixture", "--out", out], { cwd: root, encoding: "utf8" });
  assert.ok(existsSync(join(out, ".claude/agents/vik.md")));
  assert.ok(existsSync(join(out, "roster.md")));
  assert.ok(existsSync(join(out, "enforcement.md")));
  assert.match(stdout, /prose/);
  assert.match(readFileSync(join(out, ".claude/agents/vik.md"), "utf8"), /FIXTURE-VIK-DISSENT/);
});

test("CLI exits non-zero with the reason when composition is refused", () => {
  const root = fixture((files) => {
    files["team/parties/fixture.json"] = JSON.stringify({ ...PARTY, members: [{ role: "tester", persona: "nobody" }], formations: [] });
  });
  assert.throws(
    () => execFileSync("node", [SCRIPT, "--party", "fixture", "--out", join(root, "build")], { cwd: root, encoding: "utf8", stdio: "pipe" }),
    (err) => err.status === 1 && /persona "nobody"/.test(String(err.stderr))
  );
});
