#!/usr/bin/env node
// agent-notes: { ctx: "tests for dispatch: a work order becomes a plan; spawn and claim events written from outside the model", deps: [scripts/dispatch.mjs, scripts/compose-team.mjs, scripts/team-log.mjs, team/events.json, team/lines/tdd.json, docs/methodology/team-layers.md], state: draft, last: "tara@2026-09-09", key: ["no wall-clock reads: at is always injected", "the plan is the assignment; a station never chooses its own instance", "distinct-instance is refused at plan time when a seat cannot supply two instances, and at claim time when the log shows the same instance on both stations", "the order constraint is enforced per item, before the claim is written"] }
//
//   node --test scripts/dispatch.test.mjs
//
// Red phase, written before scripts/dispatch.mjs existed.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { claim, loadOrder, open, plan } from "./dispatch.mjs";
import { appendEvent, checkLog, loadLine, loadSchema, readLog, validateEvent } from "./team-log.mjs";

const SCRIPT = resolve(import.meta.dirname, "dispatch.mjs");
const REPO = resolve(import.meta.dirname, "..");
const roots = [];
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const T = "2026-09-09T12:00:00Z";
const T2 = "2026-09-09T12:05:00Z";
const T3 = "2026-09-09T12:10:00Z";
const LOG = ".summon/team-log.jsonl";

const role = (name, charter) => `---
name: ${name}
description: ${charter}
---
# ${name[0].toUpperCase() + name.slice(1)}

## Charter

FIXTURE-${name.toUpperCase()}-CHARTER ${charter}

## Standard

A standard.

## Questions

A question.

## Boundaries

A boundary.

## Output

An output.
`;
const persona = (name, roleName, marker, lens = null) => `---
name: ${name}
role: ${roleName}
${lens ? `lens: ${lens}\n` : ""}display: ${name[0].toUpperCase() + name.slice(1)}
---
## Priors

${marker}-PRIORS Priors.

## Dissent

${marker}-DISSENT When something only this persona would push on.

## Voice

${marker}-VOICE Voice.

"Line."

## Tells

${marker}-TELLS Tells.
`;
const lens = (name, marker) => `## Lens: ${name}\n\n${marker} Guiding question.\n`;

/** The checked-in tdd line, verbatim: red (tara) → green (sato) → review (review-party). */
const TDD = {
  name: "tdd",
  stations: [
    { name: "red", seat: "tara", emits: "tests" },
    { name: "green", seat: "sato", needs: ["tests"], emits: "change" },
    { name: "review", seat: "review-party", needs: ["change"], emits: "verdicts" },
  ],
  constraints: [
    { rule: "order", stations: ["red", "green", "review"] },
    { rule: "distinct-instance", stations: ["green", "review"] },
  ],
};
/** A line where one seat holds both constrained stations: only two instances of sato can satisfy it. */
const SOLO = {
  name: "solo",
  stations: [
    { name: "red", seat: "tara", emits: "tests" },
    { name: "green", seat: "sato", needs: ["tests"], emits: "change" },
    { name: "review", seat: "sato", needs: ["change"], emits: "verdicts" },
  ],
  constraints: [
    { rule: "order", stations: ["red", "green", "review"] },
    { rule: "distinct-instance", stations: ["green", "review"] },
  ],
};
/** A line the fixture party exists alongside but does not opt into. */
const ROGUE = { name: "rogue", stations: [{ name: "red", seat: "tara", emits: "tests" }], constraints: [] };
/** A line naming a seat nobody composes. */
const GHOST = { name: "ghost", stations: [{ name: "red", seat: "nobody", emits: "tests" }], constraints: [] };

const ORDER = {
  id: "wo-1",
  party: "core",
  line: "tdd",
  items: [{ id: "i1", spec: "specs/i1.md" }, { id: "i2", spec: "specs/i2.md" }, { id: "i3", spec: "specs/i3.md" }],
  instances: { tara: 1, sato: 2, "review-party": 1 },
};

const HARNESS = {
  harness: "claude-code",
  fitted: true,
  review: "x",
  output: { dir: ".claude/agents", file: "{name}.md" },
  capabilities: { read: ["Read"], run: ["Bash"], "write:src": ["Write"], "write:tests": ["Write"] },
  frontmatter: {},
  budget: {},
  // concurrency 4 = tara 1 + sato 2 + review-party 1, so the default order sits exactly at the limit
  dispatch: { concurrency: 4, depth: 1, isolation: "worktree" },
};

/**
 * A fixture team: tester (tara), coder (sato), a review-party formation (vik, pierrot); party "core"
 * opts into lines tdd and solo; an order file at order.json. With git: true the root is a repo with
 * one commit and .summon/ ignored, so the log and worktrees never dirty the tree.
 */
function fixture(edit = () => {}, { git = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "summon-dispatch-"));
  roots.push(root);
  const files = {
    "team/roles/tester/SKILL.md": role("tester", "Writes failing tests first."),
    "team/roles/tester/role.json": JSON.stringify({ may: ["read", "run", "write:tests"], "must-not": ["write:src"], lenses: [] }),
    "team/roles/coder/SKILL.md": role("coder", "Makes the failing tests pass."),
    "team/roles/coder/role.json": JSON.stringify({ may: ["read", "run", "write:src"], "must-not": ["write:tests"], lenses: [] }),
    "team/roles/reviewer/SKILL.md": role("reviewer", "Reads a change and reports what is wrong with it."),
    "team/roles/reviewer/role.json": JSON.stringify({ may: ["read", "run"], "must-not": ["write:src"], lenses: ["simplicity", "security"] }),
    "team/roles/reviewer/lenses/simplicity.md": lens("Simplicity", "FIXTURE-LENS-SIMPLICITY"),
    "team/roles/reviewer/lenses/security.md": lens("Security", "FIXTURE-LENS-SECURITY"),
    "team/personas/tara.md": persona("tara", "tester", "FIXTURE-TARA"),
    "team/personas/sato.md": persona("sato", "coder", "FIXTURE-SATO"),
    "team/personas/vik.md": persona("vik", "reviewer", "FIXTURE-VIK", "simplicity"),
    "team/personas/pierrot.md": persona("pierrot", "reviewer", "FIXTURE-PIERROT", "security"),
    "team/harness/claude-code.json": JSON.stringify(HARNESS),
    "team/parties/core.json": JSON.stringify({
      name: "core",
      harness: "claude-code",
      members: [
        { role: "tester", persona: "tara" },
        { role: "coder", persona: "sato" },
      ],
      formations: [{ name: "review-party", role: "reviewer", members: [{ persona: "vik", lens: "simplicity" }, { persona: "pierrot", lens: "security" }] }],
      lines: ["tdd", "solo"],
    }),
    "team/lines/tdd.json": JSON.stringify(TDD),
    "team/lines/solo.json": JSON.stringify(SOLO),
    "team/lines/rogue.json": JSON.stringify(ROGUE),
    "team/lines/ghost.json": JSON.stringify(GHOST),
    "team/events.json": readFileSync(join(REPO, "team/events.json"), "utf8"),
    "team/checks.json": JSON.stringify({ log: LOG }),
    "order.json": JSON.stringify(ORDER),
    ".gitignore": ".summon/\n",
  };
  edit(files);
  for (const [rel, content] of Object.entries(files)) {
    if (content === null) continue;
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), typeof content === "string" ? content : JSON.stringify(content));
  }
  // .summon/ is where the log, the plan, and the worktrees live; team-log's appendEvent does not mkdir.
  mkdirSync(join(root, ".summon"), { recursive: true });
  const run = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (git) {
    run("init", "-q");
    run("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A");
    run("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "fixture");
  }
  return { root, git: run };
}

/** Edit the order in a fixture's file map. */
const withOrder = (patch) => (f) => (f["order.json"] = JSON.stringify({ ...ORDER, ...patch }));
/** Edit the harness in a fixture's file map. */
const withHarness = (patch) => (f) => (f["team/harness/claude-code.json"] = JSON.stringify({ ...HARNESS, ...patch }));
/** Write a plan for the fixture's order under .summon/ (dispatch scratch, ignored by git) and return its path relative to root. */
const PLAN = ".summon/plan.json";
function planned(root, orderPath = "order.json") {
  const p = plan(root, { orderPath });
  writeFileSync(join(root, PLAN), JSON.stringify(p));
  return { plan: p, planPath: PLAN };
}
/** The station rows of one item in a plan, keyed by station name. */
const stationsOf = (p, item) => Object.fromEntries(p.items.find((i) => i.id === item).stations.map((s) => [s.station, s]));
/** A schema-valid return event for an instance on an item. */
const returned = (seat, instance, item, t) => ({ t, seat, instance, event: "return", ok: true, item });
/** The events on the log, or [] when no log has been written yet. */
const logOrEmpty = (root) => (existsSync(join(root, LOG)) ? readLog(join(root, LOG)) : []);

// --- the order ----------------------------------------------------------------
// team-layers.md § The work order: a JSON file, anywhere, with id, party, line, items, instances.
// The schema lives in team/events.json under workOrder, next to the events it produces.

test("loadOrder parses a well-formed order so that the file the human wrote is the file dispatch runs", () => {
  const { root } = fixture();
  const o = loadOrder(join(root, "order.json"));
  assert.equal(o.id, "wo-1");
  assert.equal(o.party, "core");
  assert.equal(o.line, "tdd");
  assert.deepEqual(o.items.map((i) => i.id), ["i1", "i2", "i3"]);
  assert.deepEqual(o.instances, { tara: 1, sato: 2, "review-party": 1 });
});

test("loadOrder refuses an order missing any required field, naming the field, so a half-written order never becomes a plan", () => {
  for (const field of ["id", "party", "line", "items", "instances"]) {
    const { root } = fixture((f) => {
      const o = { ...ORDER };
      delete o[field];
      f["order.json"] = JSON.stringify(o);
    });
    assert.throws(() => loadOrder(join(root, "order.json")), new RegExp(`"${field}"`), `missing ${field} must be named`);
  }
});

test("loadOrder refuses an item without an id, because the id is the item every event carries", () => {
  const { root } = fixture(withOrder({ items: [{ id: "i1" }, { spec: "specs/anon.md" }] }));
  assert.throws(() => loadOrder(join(root, "order.json")), /"id"/);
});

// --- plan: the assignment -------------------------------------------------------
// § The work order: plan names every instance, gives each a worktree when isolation asks for it,
// and assigns one instance per station per item, round-robin. The plan is the assignment; a
// station is never left to choose its own instance.

test("plan names the order, party, line, harness, and the adapter's dispatch limits, and every instance as seat#n from 1 with a worktree under .summon/worktrees", () => {
  const { root } = fixture();
  const p = plan(root, { orderPath: "order.json" });
  assert.equal(p.order, "wo-1");
  assert.equal(p.party, "core");
  assert.equal(p.line, "tdd");
  assert.equal(p.harness, "claude-code");
  assert.deepEqual(p.limits, { concurrency: 4, depth: 1, isolation: "worktree" });
  const instances = p.instances.map((i) => [i.seat, i.instance, i.worktree]).sort((a, b) => a[1].localeCompare(b[1]));
  assert.deepEqual(instances, [
    ["review-party", "review-party#1", ".summon/worktrees/review-party#1"],
    ["sato", "sato#1", ".summon/worktrees/sato#1"],
    ["sato", "sato#2", ".summon/worktrees/sato#2"],
    ["tara", "tara#1", ".summon/worktrees/tara#1"],
  ]);
});

test("plan assigns one instance per station per item, carrying the station's seat, needs, and emits from the line", () => {
  const { root } = fixture();
  const p = plan(root, { orderPath: "order.json" });
  assert.deepEqual(p.items.map((i) => i.id), ["i1", "i2", "i3"]);
  const s = stationsOf(p, "i1");
  assert.deepEqual(Object.keys(s), ["red", "green", "review"], "stations in the line's order");
  assert.deepEqual(s.red, { station: "red", seat: "tara", instance: "tara#1", needs: [], emits: "tests" });
  assert.deepEqual(s.green, { station: "green", seat: "sato", instance: "sato#1", needs: ["tests"], emits: "change" });
  assert.deepEqual(s.review, { station: "review", seat: "review-party", instance: "review-party#1", needs: ["change"], emits: "verdicts" });
  for (const i of p.items) for (const st of i.stations) assert.ok(p.instances.some((x) => x.instance === st.instance), `${st.instance} is a named instance`);
});

test("plan round-robins a seat's instances across items, so with sato: 2 and three items green is held by sato#1, sato#2, sato#1", () => {
  const { root } = fixture();
  const p = plan(root, { orderPath: "order.json" });
  assert.deepEqual(p.items.map((i) => stationsOf(p, i.id).green.instance), ["sato#1", "sato#2", "sato#1"]);
  assert.deepEqual(p.items.map((i) => stationsOf(p, i.id).red.instance), ["tara#1", "tara#1", "tara#1"], "a single instance takes every item");
});

test("plan gives a seat the order does not name exactly one instance when a station needs it", () => {
  const { root } = fixture(withOrder({ instances: { sato: 2 } }));
  const p = plan(root, { orderPath: "order.json" });
  assert.deepEqual(p.instances.filter((i) => i.seat === "tara").map((i) => i.instance), ["tara#1"]);
  assert.deepEqual(p.instances.filter((i) => i.seat === "review-party").map((i) => i.instance), ["review-party#1"]);
  assert.equal(p.instances.length, 4);
});

test("plan sets worktree to null when the adapter's isolation is not worktree, so nothing downstream creates one", () => {
  const { root } = fixture(withHarness({ dispatch: { concurrency: 4, depth: 1, isolation: "none" } }));
  const p = plan(root, { orderPath: "order.json" });
  assert.equal(p.limits.isolation, "none");
  assert.ok(p.instances.every((i) => i.worktree === null), "no instance has a worktree");
});

// --- plan: distinct-instance ----------------------------------------------------
// § The line: the station that reviews an item must not be held by the instance that coded it.
// When one seat holds both constrained stations, only two instances of that seat can satisfy it.

test("plan on a line where one seat holds both constrained stations assigns two different instances of that seat to every item", () => {
  const { root } = fixture(withOrder({ line: "solo", instances: { tara: 1, sato: 2 } }));
  const p = plan(root, { orderPath: "order.json" });
  assert.equal(p.items.length, 3);
  for (const item of p.items) {
    const s = stationsOf(p, item.id);
    assert.equal(s.green.seat, "sato");
    assert.equal(s.review.seat, "sato");
    assert.notEqual(s.green.instance, s.review.instance, `item ${item.id}: green and review must be held by different instances`);
  }
});

test("plan refuses a line whose distinct-instance constraint cannot be met with one instance of the shared seat, naming the constraint, the seat, and both stations", () => {
  const { root } = fixture(withOrder({ line: "solo", instances: { tara: 1, sato: 1 } }));
  assert.throws(() => plan(root, { orderPath: "order.json" }), (err) => /distinct-instance/.test(err.message) && /"sato"|\bsato\b/.test(err.message) && /green/.test(err.message) && /review/.test(err.message));
});

test("plan refuses the distinct-instance line when the shared seat is left unnamed in the order, since an unnamed seat gets only one instance", () => {
  const { root } = fixture(withOrder({ line: "solo", instances: { tara: 1 } }));
  assert.throws(() => plan(root, { orderPath: "order.json" }), /distinct-instance/);
});

// --- plan: refusals -------------------------------------------------------------
// § The work order: refuses an order whose line the party does not opt into, whose seat the party
// does not compose, or whose instance count exceeds the adapter's dispatch.concurrency.

test("plan refuses an order whose line the party does not opt into, naming the line and the party", () => {
  const { root } = fixture(withOrder({ line: "rogue" }));
  assert.throws(() => plan(root, { orderPath: "order.json" }), (err) => /rogue/.test(err.message) && /core/.test(err.message));
});

test("plan refuses a line whose station names a seat the party does not compose, naming the seat", () => {
  const { root } = fixture((f) => {
    withOrder({ line: "ghost" })(f);
    const party = JSON.parse(f["team/parties/core.json"]);
    party.lines = ["tdd", "ghost"];
    f["team/parties/core.json"] = JSON.stringify(party);
  });
  assert.throws(() => plan(root, { orderPath: "order.json" }), /nobody/);
});

test("plan refuses an order whose total instances exceed the adapter's concurrency, naming the count and the limit, and allows a total exactly at the limit", () => {
  const { root: at } = fixture();
  assert.equal(plan(at, { orderPath: "order.json" }).instances.length, 4, "4 of 4 is allowed");
  const { root: over } = fixture(withOrder({ instances: { tara: 1, sato: 3, "review-party": 1 } }));
  assert.throws(() => plan(over, { orderPath: "order.json" }), (err) => /concurrency/.test(err.message) && /\b5\b/.test(err.message) && /\b4\b/.test(err.message));
});

test("plan refuses an adapter with dispatch: null, because a harness with no spawner cannot dispatch", () => {
  const { root } = fixture(withHarness({ dispatch: null }));
  assert.throws(() => plan(root, { orderPath: "order.json" }), (err) => /dispatch/.test(err.message) && /claude-code/.test(err.message));
});

test("plan refuses an order naming a party that has no file, so a typo does not plan against nothing", () => {
  const { root } = fixture(withOrder({ party: "nope" }));
  assert.throws(() => plan(root, { orderPath: "order.json" }), /party "nope"/);
});

// --- open: spawn events and worktrees -------------------------------------------
// § The work order: open writes one spawn event per instance, carrying harness, instance, order,
// tree, and worktree, and creates the worktrees when isolation asks for it. § The event log: the
// events come from outside the model.

test("open writes one schema-valid spawn event per instance to the configured log, with t injected and the tree bound to the repo head", () => {
  const { root } = fixture(undefined, { git: true });
  const { plan: p, planPath } = planned(root);
  open(root, { planPath, at: T, worktrees: false });
  const log = readLog(join(root, LOG));
  assert.equal(log.length, 4);
  const schema = loadSchema(root);
  for (const e of log) assert.deepEqual(validateEvent(e, schema), [], `spawn event for ${e.instance} is schema-valid`);
  assert.deepEqual(
    log.map((e) => [e.event, e.seat, e.instance, e.order, e.harness, e.t]).sort((a, b) => a[2].localeCompare(b[2])),
    [
      ["spawn", "review-party", "review-party#1", "wo-1", "claude-code", T],
      ["spawn", "sato", "sato#1", "wo-1", "claude-code", T],
      ["spawn", "sato", "sato#2", "wo-1", "claude-code", T],
      ["spawn", "tara", "tara#1", "wo-1", "claude-code", T],
    ]
  );
  for (const e of log) {
    assert.match(e.tree.head, /^[0-9a-f]{40}$/);
    assert.equal(e.tree.dirty, false, ".summon/ is ignored, so the log itself does not dirty the tree");
    const planned = p.instances.find((i) => i.instance === e.instance);
    assert.ok(planned, `${e.instance} is in the plan`);
  }
});

test("open with worktree isolation creates a git worktree per instance under .summon/worktrees, and the spawn event names it", () => {
  const { root, git } = fixture(undefined, { git: true });
  const { planPath } = planned(root);
  open(root, { planPath, at: T });
  const listed = git("worktree", "list", "--porcelain");
  for (const inst of ["tara#1", "sato#1", "sato#2", "review-party#1"]) {
    assert.ok(existsSync(join(root, ".summon/worktrees", inst)), `worktree dir for ${inst} exists`);
    assert.ok(listed.includes(`worktrees/${inst}`), `git knows the worktree for ${inst}`);
  }
  const log = readLog(join(root, LOG));
  assert.deepEqual(log.map((e) => e.worktree).sort(), [".summon/worktrees/review-party#1", ".summon/worktrees/sato#1", ".summon/worktrees/sato#2", ".summon/worktrees/tara#1"]);
});

test("open with worktrees: false writes the spawn events and creates nothing on disk beyond the log", () => {
  const { root } = fixture(undefined, { git: true });
  const { planPath } = planned(root);
  open(root, { planPath, at: T, worktrees: false });
  assert.equal(readLog(join(root, LOG)).length, 4);
  assert.equal(existsSync(join(root, ".summon/worktrees")), false, "no worktree directory was created");
});

test("open with isolation other than worktree writes spawn events with worktree null and creates no worktrees even when asked", () => {
  const { root } = fixture(withHarness({ dispatch: { concurrency: 4, depth: 1, isolation: "none" } }), { git: true });
  const { planPath } = planned(root);
  open(root, { planPath, at: T });
  const log = readLog(join(root, LOG));
  assert.equal(log.length, 4);
  assert.ok(log.every((e) => e.worktree === null));
  assert.equal(existsSync(join(root, ".summon/worktrees")), false);
});

test("open validates every spawn event against the schema before writing any, so a schema the events cannot satisfy leaves the log untouched", () => {
  const { root } = fixture((f) => {
    const schema = JSON.parse(f["team/events.json"]);
    schema.events.spawn.required.push("fixture-required");
    f["team/events.json"] = JSON.stringify(schema);
  }, { git: true });
  const { planPath } = planned(root);
  assert.throws(() => open(root, { planPath, at: T, worktrees: false }), /"fixture-required"/);
  assert.throws(() => readLog(join(root, LOG)), /no such log/, "nothing was written");
});

test("open refuses when no log is configured, because a spawn nobody can see is not a dispatch", () => {
  const { root } = fixture((f) => (f["team/checks.json"] = JSON.stringify({})), { git: true });
  const { planPath } = planned(root);
  assert.throws(() => open(root, { planPath, at: T, worktrees: false }), /no log configured/);
});

// --- claim: the separation-of-duties boundary -----------------------------------
// § The work order: claim writes the claim event for the instance the plan assigned, and refuses
// before writing when the log shows the item's earlier stations have not returned (order) or when
// the assigned instance already holds a station the constraint separates it from (distinct-instance).
// This is the boundary enforced at dispatch, before the seat runs, rather than detected after.

test("claim on the first station writes a claim event for the plan's instance on an empty log and returns it", () => {
  const { root } = fixture();
  const { planPath } = planned(root);
  const e = claim(root, { planPath, item: "i1", station: "red", at: T });
  assert.deepEqual(e, { t: T, seat: "tara", instance: "tara#1", event: "claim", item: "i1", station: "red", order: "wo-1" });
  assert.deepEqual(readLog(join(root, LOG)), [e]);
});

test("claim on a later station refuses until the earlier station has returned for that item, naming the item, the station claimed, and the station owed, and writes nothing on refusal", () => {
  const { root } = fixture();
  const { planPath } = planned(root);
  assert.throws(() => claim(root, { planPath, item: "i1", station: "green", at: T }), (err) => /"i1"|\bi1\b/.test(err.message) && /green/.test(err.message) && /red/.test(err.message));
  assert.deepEqual(logOrEmpty(root), [], "a refused claim writes nothing");
  claim(root, { planPath, item: "i1", station: "red", at: T });
  assert.throws(() => claim(root, { planPath, item: "i1", station: "green", at: T2 }), /red/, "a claim on red is not a return from red");
  appendEvent(join(root, LOG), returned("tara", "tara#1", "i1", T2), loadSchema(root));
  const e = claim(root, { planPath, item: "i1", station: "green", at: T3 });
  assert.equal(e.instance, "sato#1");
  assert.equal(e.station, "green");
  assert.throws(() => claim(root, { planPath, item: "i2", station: "green", at: T3 }), /red/, "the order constraint is per item: i1's return does not release i2");
});

test("claim on review refuses until both red and green have returned, because the order constraint chains every earlier station", () => {
  const { root } = fixture();
  const { planPath } = planned(root);
  const schema = loadSchema(root);
  claim(root, { planPath, item: "i1", station: "red", at: T });
  appendEvent(join(root, LOG), returned("tara", "tara#1", "i1", T), schema);
  assert.throws(() => claim(root, { planPath, item: "i1", station: "review", at: T2 }), /green/, "red returned, green still owed");
  const before = readLog(join(root, LOG)).length;
  assert.equal(readLog(join(root, LOG)).length, before, "nothing written on refusal");
  claim(root, { planPath, item: "i1", station: "green", at: T2 });
  appendEvent(join(root, LOG), returned("sato", "sato#1", "i1", T2), schema);
  const e = claim(root, { planPath, item: "i1", station: "review", at: T3 });
  assert.equal(e.instance, "review-party#1");
});

test("claim refuses when the plan's instance already holds a station the distinct-instance constraint separates from this one, naming the instance and both stations, and writes nothing", () => {
  // solo line: plan gives i1 green and review to two different sato instances. A hand-written claim
  // in the log shows the review instance already coded i1; the plan's assignment cannot be honoured.
  const { root } = fixture(withOrder({ line: "solo", instances: { tara: 1, sato: 2 } }));
  const { plan: p, planPath } = planned(root);
  const schema = loadSchema(root);
  const s = stationsOf(p, "i1");
  const reviewer = s.review.instance;
  const file = join(root, LOG);
  appendEvent(file, { t: T, seat: "tara", instance: "tara#1", event: "claim", item: "i1", station: "red", order: "wo-1" }, schema);
  appendEvent(file, returned("tara", "tara#1", "i1", T), schema);
  appendEvent(file, { t: T2, seat: "sato", instance: reviewer, event: "claim", item: "i1", station: "green", order: "wo-1" }, schema);
  appendEvent(file, returned("sato", reviewer, "i1", T2), schema);
  const before = readLog(file).length;
  assert.throws(() => claim(root, { planPath, item: "i1", station: "review", at: T3 }), (err) => err.message.includes(reviewer) && /green/.test(err.message) && /review/.test(err.message));
  assert.equal(readLog(file).length, before, "a refused claim writes nothing");
});

test("claim refuses an item or a station that is not in the plan, naming it, so nothing is claimed off-plan", () => {
  const { root } = fixture();
  const { planPath } = planned(root);
  assert.throws(() => claim(root, { planPath, item: "i9", station: "red", at: T }), /"i9"|\bi9\b/);
  assert.throws(() => claim(root, { planPath, item: "i1", station: "polish", at: T }), /polish/);
  assert.deepEqual(logOrEmpty(root), []);
});

test("an item walked red, green, review through claim and return leaves a log that team-log's line check reports clean, with distinct coding and reviewing instances", () => {
  const { root } = fixture();
  const { planPath } = planned(root);
  const schema = loadSchema(root);
  const file = join(root, LOG);
  const red = claim(root, { planPath, item: "i1", station: "red", at: T });
  appendEvent(file, returned(red.seat, red.instance, "i1", T), schema);
  const green = claim(root, { planPath, item: "i1", station: "green", at: T2 });
  appendEvent(file, returned(green.seat, green.instance, "i1", T2), schema);
  const review = claim(root, { planPath, item: "i1", station: "review", at: T3 });
  appendEvent(file, returned(review.seat, review.instance, "i1", T3), schema);
  assert.notEqual(green.instance, review.instance);
  const { items, violations } = checkLog(readLog(file), loadLine("tdd", root), schema);
  assert.equal(items, 1);
  assert.deepEqual(violations, []);
});

// --- the CLI ----------------------------------------------------------------------
// plan, open, and claim run without the workflow, so a human dispatching by hand still gets the
// events and the refusals.

const EXEC = { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 };

test("CLI plan writes the plan file and prints one line naming the order, the instance count, and the item count", () => {
  const { root } = fixture();
  const out = execFileSync(process.execPath, [SCRIPT, "plan", "--order", "order.json", "--out", PLAN], { cwd: root, ...EXEC });
  assert.equal(out.trim().split("\n").length, 1, "one line");
  assert.match(out, /wo-1/);
  assert.match(out, /4 instances/);
  assert.match(out, /3 items/);
  const p = JSON.parse(readFileSync(join(root, PLAN), "utf8"));
  assert.equal(p.order, "wo-1");
  assert.equal(p.instances.length, 4);
  assert.equal(p.items.length, 3);
});

test("CLI plan exits non-zero with the refusal on stderr and writes no plan file", () => {
  const { root } = fixture(withOrder({ line: "rogue" }));
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT, "plan", "--order", "order.json", "--out", PLAN], { cwd: root, ...EXEC }),
    (err) => err.status !== 0 && /rogue/.test(String(err.stderr))
  );
  assert.equal(existsSync(join(root, PLAN)), false);
});

test("CLI open --no-worktrees writes the spawn events at the given time and creates no worktrees; CLI claim writes the claim for the plan's instance", () => {
  const { root } = fixture(undefined, { git: true });
  execFileSync(process.execPath, [SCRIPT, "plan", "--order", "order.json", "--out", PLAN], { cwd: root, ...EXEC });
  execFileSync(process.execPath, [SCRIPT, "open", "--plan", PLAN, "--at", T, "--no-worktrees"], { cwd: root, ...EXEC });
  const spawned = readLog(join(root, LOG));
  assert.equal(spawned.length, 4);
  assert.ok(spawned.every((e) => e.event === "spawn" && e.t === T));
  assert.equal(existsSync(join(root, ".summon/worktrees")), false);
  execFileSync(process.execPath, [SCRIPT, "claim", "--plan", PLAN, "--item", "i1", "--station", "red", "--at", T2], { cwd: root, ...EXEC });
  const log = readLog(join(root, LOG));
  assert.equal(log.length, 5);
  assert.deepEqual(log[4], { t: T2, seat: "tara", instance: "tara#1", event: "claim", item: "i1", station: "red", order: "wo-1" });
});

test("CLI open with worktree isolation creates the worktrees under .summon/worktrees", () => {
  const { root, git } = fixture(undefined, { git: true });
  execFileSync(process.execPath, [SCRIPT, "plan", "--order", "order.json", "--out", PLAN], { cwd: root, ...EXEC });
  execFileSync(process.execPath, [SCRIPT, "open", "--plan", PLAN, "--at", T], { cwd: root, ...EXEC });
  assert.ok(existsSync(join(root, ".summon/worktrees/sato#2")));
  assert.ok(git("worktree", "list", "--porcelain").includes("worktrees/sato#2"));
});

test("CLI claim exits non-zero with the refusal on stderr when the earlier station has not returned, and writes nothing", () => {
  const { root } = fixture();
  execFileSync(process.execPath, [SCRIPT, "plan", "--order", "order.json", "--out", PLAN], { cwd: root, ...EXEC });
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT, "claim", "--plan", PLAN, "--item", "i1", "--station", "green", "--at", T], { cwd: root, ...EXEC }),
    (err) => err.status !== 0 && /red/.test(String(err.stderr)) && /green/.test(String(err.stderr))
  );
  assert.deepEqual(logOrEmpty(root), []);
});

test("CLI refuses a missing --order, --plan, --item, or --station on stderr rather than planning against nothing", () => {
  const { root } = fixture();
  const fails = (args, re) => assert.throws(() => execFileSync(process.execPath, [SCRIPT, ...args], { cwd: root, ...EXEC }), (err) => err.status !== 0 && re.test(String(err.stderr)));
  fails(["plan", "--out", PLAN], /--order/);
  fails(["open", "--at", T], /--plan/);
  fails(["claim", "--plan", PLAN, "--station", "red", "--at", T], /--item/);
  fails(["claim", "--plan", PLAN, "--item", "i1", "--at", T], /--station/);
});

// --- the checked-in party -----------------------------------------------------------
// The spec's own example order plans against the real summon-core party, tdd line, and claude-code
// adapter, whose dispatch field is the live limit the tests above fixture.

test("the spec's example order plans against the checked-in summon-core party on the tdd line under the claude-code adapter's live limits", () => {
  const { root: elsewhere } = fixture(withOrder({ id: "wo-138-a", party: "summon-core", items: [{ id: "138-a", spec: "docs/sprints/138-a.md" }] }));
  const p = plan(REPO, { orderPath: join(elsewhere, "order.json") });
  assert.equal(p.order, "wo-138-a");
  assert.equal(p.harness, "claude-code");
  assert.deepEqual(p.limits, { concurrency: 10, depth: 1, isolation: "worktree" });
  const s = stationsOf(p, "138-a");
  assert.deepEqual([s.red.instance, s.green.instance, s.review.instance], ["tara#1", "sato#1", "review-party#1"]);
  assert.notEqual(s.green.instance, s.review.instance);
});
