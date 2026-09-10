#!/usr/bin/env node
// agent-notes: { ctx: "tests for team-log: event validation, line constraints over a log, disagreement rate, the table renderer", deps: [scripts/team-log.mjs, team/events.json, team/lines/tdd.json, docs/methodology/team-layers.md], state: draft, last: "tara@2026-09-10", key: ["no wall-clock reads: every event carries an explicit t", "disagreement rate direction derived from the spec: non-unanimous items over items with 2+ lens verdicts", "the separation constraint is checked over the log, not asserted by the seat", "--version resolves package.json from --root, so fixtures pin the version; the repo package.json has no version field"] }
//
//   node --test scripts/team-log.test.mjs
//
// Red phase, written before scripts/team-log.mjs existed.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { appendEvent, checkLog, disagreementRate, readLog, render, validateEvent } from "./team-log.mjs";

const SCRIPT = resolve(import.meta.dirname, "team-log.mjs");
const REPO = resolve(import.meta.dirname, "..");

const roots = [];
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const SCHEMA = JSON.parse(readFileSync(join(REPO, "team/events.json"), "utf8"));
const LINE = JSON.parse(readFileSync(join(REPO, "team/lines/tdd.json"), "utf8"));
const SKIN = {
  skin: "test-skin",
  title: "Fixture",
  members: { tara: { class: "FIXTURE-CLASS-ARCHER" }, sato: { class: "FIXTURE-CLASS-SMITH" } },
  roles: { reviewer: { class: "FIXTURE-CLASS-WARDEN" } },
  formations: { "review-party": { class: "FIXTURE-CLASS-PARTY" } },
};

/** A fresh dir with a log file; `events` are written one per line, pinned times, no clock. */
function logDir(events = []) {
  const root = mkdtempSync(join(tmpdir(), "summon-log-"));
  roots.push(root);
  mkdirSync(join(root, ".summon"), { recursive: true });
  const file = join(root, ".summon", "team-log.jsonl");
  writeFileSync(file, events.map((e) => JSON.stringify(e)).join("\n") + (events.length ? "\n" : ""));
  return { root, file };
}

const T = (n) => `2026-09-09T10:${String(n).padStart(2, "0")}:00Z`;
const ev = (n, seat, event, rest = {}) => ({ t: T(n), seat, event, ...rest });

/** A clean run of one item through the tdd line, reviewed by four lenses that split. */
function cleanItem(item, n0, { unanimous = false, coder = "sato#1", reviewer = "review-party#1" } = {}) {
  const v = unanimous ? "accept" : "revise";
  return [
    ev(n0, "tara", "claim", { item, station: "red", instance: "tara#1" }),
    ev(n0 + 1, "tara", "return", { item, ok: true, instance: "tara#1" }),
    ev(n0 + 2, "sato", "claim", { item, station: "green", instance: coder }),
    ev(n0 + 3, "sato", "check", { item, id: "tests-green", grade: "deterministic", exit: 0, instance: coder }),
    ev(n0 + 4, "sato", "return", { item, ok: true, instance: coder }),
    ev(n0 + 5, "review-party", "claim", { item, station: "review", instance: reviewer }),
    ev(n0 + 6, "review-party", "verdict", { item, lens: "simplicity", verdict: "accept", instance: reviewer }),
    ev(n0 + 7, "review-party", "verdict", { item, lens: "test-quality", verdict: v, findings: unanimous ? 0 : 1, instance: reviewer }),
    ev(n0 + 8, "review-party", "verdict", { item, lens: "security", verdict: "accept", instance: reviewer }),
    ev(n0 + 9, "review-party", "return", { item, ok: true, instance: reviewer }),
  ];
}

// --- validation --------------------------------------------------------------
// team-layers.md § The event log: every event carries t, seat, event; each event type has required fields.

test("validateEvent accepts each documented event with its required fields and rejects a missing one", () => {
  for (const [name, spec] of Object.entries(SCHEMA.events)) {
    const good = ev(1, "tara", name, Object.fromEntries(spec.required.map((k) => [k, k === "exit" ? 0 : k === "ok" ? true : k === "verdict" ? "accept" : k === "grade" ? "deterministic" : k === "severity" ? "critical" : k === "tree" ? { head: "abc", dirty: false } : "x"])));
    assert.deepEqual(validateEvent(good, SCHEMA), [], `${name} with all required fields should validate`);
    for (const k of spec.required) {
      const { [k]: _, ...bad } = good;
      const problems = validateEvent(bad, SCHEMA);
      assert.ok(problems.some((p) => p.includes(`"${k}"`)), `${name} without ${k} should name the field; got ${problems}`);
    }
  }
});

test("validateEvent rejects an unknown event, a bad verdict, a bad severity, a bad grade, and a missing common field", () => {
  assert.match(validateEvent(ev(1, "tara", "dance"), SCHEMA).join(), /event "dance"/);
  assert.match(validateEvent(ev(1, "tara", "verdict", { lens: "x", item: "i", verdict: "maybe" }), SCHEMA).join(), /verdict "maybe"/);
  assert.match(validateEvent(ev(1, "tara", "finding", { severity: "meh", summary: "s" }), SCHEMA).join(), /severity "meh"/);
  assert.match(validateEvent(ev(1, "tara", "check", { id: "x", grade: "vibes", exit: 0 }), SCHEMA).join(), /grade "vibes"/);
  assert.match(validateEvent({ seat: "tara", event: "claim", item: "i" }, SCHEMA).join(), /"t"/);
  assert.match(validateEvent(ev(1, "tara", "claim", { item: "i", t: "yesterday" }), SCHEMA).join(), /"t".*ISO/);
});

test("appendEvent validates, then appends one JSON line; readLog returns events in file order", () => {
  const { file } = logDir();
  appendEvent(file, ev(1, "tara", "claim", { item: "i1", station: "red" }), SCHEMA);
  appendEvent(file, ev(2, "tara", "return", { item: "i1", ok: true }), SCHEMA);
  assert.throws(() => appendEvent(file, ev(3, "tara", "dance"), SCHEMA), /event "dance"/);
  const log = readLog(file);
  assert.deepEqual(log.map((e) => e.event), ["claim", "return"]);
  assert.equal(readFileSync(file, "utf8").split("\n").filter(Boolean).length, 2, "the rejected event was not written");
});

test("readLog names the line of a malformed entry", () => {
  const { file } = logDir([ev(1, "tara", "claim", { item: "i" })]);
  writeFileSync(file, readFileSync(file, "utf8") + "{not json\n");
  assert.throws(() => readLog(file), /line 2/);
});

// --- the line ----------------------------------------------------------------
// team-layers.md § The line: stations in order per item; the station that reviews an item
// must not be held by the instance that coded it.

test("checkLog passes a clean run and reports zero violations", () => {
  const { file } = logDir(cleanItem("i1", 0));
  const r = checkLog(readLog(file), LINE, SCHEMA);
  assert.deepEqual(r.violations, []);
  assert.equal(r.items, 1);
});

test("checkLog reports the distinct-instance violation when the coder instance also holds the review station", () => {
  const { file } = logDir(cleanItem("i1", 0, { coder: "sato#1", reviewer: "sato#1" }));
  const r = checkLog(readLog(file), LINE, SCHEMA);
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0], /i1.*green.*review.*sato#1/);
});

test("checkLog reports an order violation when green is claimed before red for the same item", () => {
  const events = cleanItem("i1", 0);
  const red = events.find((e) => e.station === "red");
  const green = events.find((e) => e.station === "green");
  [red.t, green.t] = [green.t, red.t];
  events.sort((a, b) => a.t.localeCompare(b.t));
  const { file } = logDir(events);
  const r = checkLog(readLog(file), LINE, SCHEMA);
  assert.ok(r.violations.some((v) => /i1.*"green" before "red"/.test(v)), r.violations.join("; "));
});

test("checkLog reports invalid events in the log by line number before checking constraints", () => {
  const { file } = logDir([...cleanItem("i1", 0), { t: T(30), seat: "sato", event: "verdict", item: "i1", lens: "x", verdict: "maybe" }]);
  const r = checkLog(readLog(file), LINE, SCHEMA);
  assert.ok(r.violations.some((v) => /line 11.*verdict "maybe"/.test(v)));
});

// --- the disagreement rate ---------------------------------------------------
// The post's decay metric: disagreement rate, trending to zero. Direction from the spec:
// rate = items whose lens verdicts were NOT unanimous / items with two or more lens verdicts.
// A rate of 0 over enough items is the signal, so the tool must report the denominator.

test("disagreementRate counts items with split verdicts over items with two or more lens verdicts, most recent first", () => {
  const events = [...cleanItem("i1", 0), ...cleanItem("i2", 10, { unanimous: true }), ...cleanItem("i3", 20)];
  const { file } = logDir(events);
  const r = disagreementRate(readLog(file), { last: 10 });
  assert.deepEqual(r, { items: 3, split: 2, rate: 2 / 3, window: 10 });
  assert.deepEqual(disagreementRate(readLog(file), { last: 1 }), { items: 1, split: 1, rate: 1, window: 1 }, "the window takes the most recent items");
});

test("disagreementRate ignores items with a single lens verdict and reports null over no items", () => {
  const { file } = logDir([ev(1, "vik", "verdict", { item: "solo", lens: "simplicity", verdict: "accept" })]);
  assert.deepEqual(disagreementRate(readLog(file), { last: 10 }), { items: 0, split: 0, rate: null, window: 10 });
});

// --- the renderer ------------------------------------------------------------
// team-layers.md § View: a renderer reads the log and the skin; the skin supplies class names
// for personas, formations, and persona-less role instances.

test("render draws one row per seat instance with its skin class, current item, station, and last event", () => {
  const { file } = logDir([...cleanItem("i1", 0), ev(40, "reviewer", "claim", { item: "i2", station: "review", instance: "reviewer#3" })]);
  const out = render(readLog(file), { skin: SKIN, as: "table" });
  assert.match(out, /tara#1 .*FIXTURE-CLASS-ARCHER.*i1.*return/);
  assert.match(out, /review-party#1 .*FIXTURE-CLASS-PARTY.*i1.*return/);
  assert.match(out, /reviewer#3 .*FIXTURE-CLASS-WARDEN.*i2.*review.*claim/, "a persona-less role instance takes the role's class");
  assert.match(out, /Fixture/);
});

test("render without a skin still draws every instance", () => {
  const { file } = logDir(cleanItem("i1", 0));
  const out = render(readLog(file), { as: "table" });
  assert.match(out, /sato#1/);
  assert.doesNotMatch(out, /FIXTURE-CLASS/);
});

// --- the CLI -----------------------------------------------------------------

const EXEC = { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10_000 };
const run = (cwd, args) => execFileSync(process.execPath, [SCRIPT, ...args], { cwd, ...EXEC });

test("CLI append writes a validated event; dissent prints the rate line; check prints the summary; render prints the table", () => {
  const { root, file } = logDir(cleanItem("i1", 0));
  run(root, ["append", "--log", file, "--event", JSON.stringify(ev(50, "vik", "claim", { item: "i9", station: "review", instance: "vik#1" }))]);
  assert.equal(readLog(file).length, 11);
  assert.match(run(root, ["dissent", "--log", file, "--last", "10"]), /^disagreement: 1 items, 1 non-unanimous, rate 1\.00 \(window 10\)/m);
  assert.match(run(root, ["check", "--log", file, "--line", "tdd"]), /^line tdd: 2 items, 0 violations/m);
  assert.match(run(root, ["render", "--log", file]), /vik#1/);
});

test("CLI exits 1 with the reason: invalid event, line violation, unknown line, missing log", () => {
  const { root, file } = logDir(cleanItem("i1", 0, { coder: "sato#1", reviewer: "sato#1" }));
  const fails = (args, re) => assert.throws(() => run(root, args), (err) => err.status === 1 && re.test(String(err.stderr) + String(err.stdout)), args.join(" "));
  fails(["append", "--log", file, "--event", JSON.stringify(ev(1, "tara", "dance"))], /event "dance"/);
  fails(["check", "--log", file, "--line", "tdd"], /1 violations[\s\S]*i1.*sato#1/);
  fails(["check", "--log", file, "--line", "nope"], /line "nope"/);
  fails(["dissent", "--log", join(root, "missing.jsonl")], /missing\.jsonl/);
});

test("the checked-in bindings point disagreement-rate and line-respected at this tool", () => {
  const checks = JSON.parse(readFileSync(join(REPO, "team/checks.json"), "utf8"));
  assert.match(checks["disagreement-rate"].run, /team-log\.mjs dissent/);
  assert.match(checks["line-respected"].run, /team-log\.mjs check .* --line tdd/);
  assert.equal(checks.log, ".summon/team-log.jsonl");
});

// --- the negative control -----------------------------------------------------
// ADR-0015 reversal trigger 1: on a planted-defect item, every named lens must return at
// least one finding and the verdicts must not be unanimous. Direction from the ADR, not
// from the tool: "at least one finding per lens" and "not unanimous" are both required.

import { negativeControl } from "./team-log.mjs";

const LENSES = ["simplicity", "security"];
const control = (n0, { findings = { simplicity: 1, security: 1 }, verdicts = { simplicity: "revise", security: "accept" } } = {}) => {
  const out = [];
  let n = n0;
  for (const lens of LENSES) {
    for (let i = 0; i < findings[lens]; i++) out.push(ev(n++, "review-party", "finding", { item: "negative-control", lens, severity: "important", summary: `planted ${lens} defect` }));
    out.push(ev(n++, "review-party", "verdict", { item: "negative-control", lens, verdict: verdicts[lens], findings: findings[lens] }));
  }
  return out;
};

test("negativeControl passes when every lens found something and the verdicts split", () => {
  const { file } = logDir(control(0));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.deepEqual(r, { ok: true, missing: [], silent: [], unanimous: false, verdicts: { simplicity: "revise", security: "accept" } });
});

test("negativeControl fails when a lens returned no finding, naming the lens", () => {
  const { file } = logDir(control(0, { findings: { simplicity: 1, security: 0 } }));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.equal(r.ok, false);
  assert.deepEqual(r.silent, ["security"]);
});

test("negativeControl fails when the verdicts are unanimous, even with findings everywhere", () => {
  const { file } = logDir(control(0, { verdicts: { simplicity: "accept", security: "accept" } }));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.equal(r.ok, false);
  assert.equal(r.unanimous, true);
});

test("negativeControl fails when a lens never returned a verdict, naming it as missing", () => {
  const { file } = logDir(control(0).filter((e) => !(e.event === "verdict" && e.lens === "security")));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["security"]);
});

test("negativeControl reads only the most recent review of the item", () => {
  // An earlier failed run, then a later passing one: the later one counts.
  const events = [...control(0, { verdicts: { simplicity: "accept", security: "accept" } }), ...control(20)];
  const { file } = logDir(events);
  assert.equal(negativeControl(readLog(file), { item: "negative-control", lenses: LENSES }).ok, true);
});

test("CLI control prints the verdict per lens and exits 1 on a failed control", () => {
  const { root, file } = logDir(control(0));
  assert.match(run(root, ["control", "--log", file, "--item", "negative-control", "--lenses", LENSES.join(",")]), /^negative control negative-control: ok \(2 lenses found something; verdicts split\)/m);
  const { root: r2, file: f2 } = logDir(control(0, { verdicts: { simplicity: "accept", security: "accept" } }));
  assert.throws(() => run(r2, ["control", "--log", f2, "--item", "negative-control", "--lenses", LENSES.join(",")]), (err) => err.status === 1 && /unanimous/.test(String(err.stdout)));
});

// --- the version flag --------------------------------------------------------
// Spec (work order first-run): `node scripts/team-log.mjs --version` prints the version from
// package.json and exits 0. The version is resolved from the same root every other repo file
// resolves from (--root, defaulting to the repo this script lives in). Pinned fixture roots
// below, because the checked-in package.json carries no "version" field at time of writing.

/** A fresh root holding only a package.json; `pkg` is written verbatim when a string. */
function pkgRoot(pkg) {
  const root = mkdtempSync(join(tmpdir(), "summon-pkg-"));
  roots.push(root);
  if (pkg !== undefined) writeFileSync(join(root, "package.json"), typeof pkg === "string" ? pkg : JSON.stringify(pkg));
  return root;
}

const fails = (root, args, re) =>
  assert.throws(() => run(root, args), (err) => err.status === 1 && re.test(String(err.stderr) + String(err.stdout)), `${args.join(" ")} should exit 1 matching ${re}`);

test("CLI --version prints the package.json version as the only line of stdout and exits 0", () => {
  const root = pkgRoot({ name: "fixture", version: "1.2.3" });
  const out = run(root, ["--version", "--root", root]);
  assert.equal(out, "1.2.3\n");
});

test("CLI --version does not require --log or an event schema", () => {
  // The fixture root has a package.json and nothing else: no team/events.json, no log.
  const root = pkgRoot({ version: "0.0.1" });
  assert.equal(run(root, ["--version", "--root", root]).trim(), "0.0.1");
});

test("CLI --version exits 1 naming package.json when the version field is absent", () => {
  const root = pkgRoot({ name: "no-version" });
  fails(root, ["--version", "--root", root], /package\.json[\s\S]*version/);
});

test("CLI --version exits 1 naming package.json when the version field is empty or not a string", () => {
  fails(pkgRoot({ version: "" }), ["--version", "--root", roots.at(-1)], /package\.json[\s\S]*version/);
  fails(pkgRoot({ version: 3 }), ["--version", "--root", roots.at(-1)], /package\.json[\s\S]*version/);
});

test("CLI --version exits 1 naming package.json when the file is missing or malformed", () => {
  fails(pkgRoot(undefined), ["--version", "--root", roots.at(-1)], /package\.json/);
  fails(pkgRoot("{not json"), ["--version", "--root", roots.at(-1)], /package\.json/);
});

test("CLI still rejects an unknown leading flag with the usage line after --version is added", () => {
  fails(pkgRoot({ version: "1.2.3" }), ["--versionx"], /usage/);
});
