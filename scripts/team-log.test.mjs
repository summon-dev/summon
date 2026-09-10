#!/usr/bin/env node
// agent-notes: { ctx: "tests for team-log: event validation, line constraints over a log, disagreement rate, the table renderer", deps: [scripts/team-log.mjs, team/events.json, team/lines/tdd.json, packages/summon-team/package.json, docs/methodology/team-layers.md], state: draft, last: "tara@2026-09-10", key: ["no wall-clock reads: every event carries an explicit t", "disagreement rate direction derived from the spec: non-unanimous items over items with 2+ lens verdicts; the control measures presence only, spread needs a full window of real items", "the separation constraint is checked over the log, not asserted by the seat", "--version is the summon-team package version (packages/summon-team/package.json): the default root is exercised from a foreign cwd against the checked-in value, and every --root run uses a decoy cwd so a process.cwd() implementation fails"] }
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
  assert.deepEqual(r, { items: 3, split: 2, rate: 2 / 3, window: 10, enough: false });
  assert.deepEqual(disagreementRate(readLog(file), { last: 1 }), { items: 1, split: 1, rate: 1, window: 1, enough: true }, "the window takes the most recent items");
});

test("disagreementRate ignores items with a single lens verdict and reports null over no items", () => {
  const { file } = logDir([ev(1, "vik", "verdict", { item: "solo", lens: "simplicity", verdict: "accept" })]);
  assert.deepEqual(disagreementRate(readLog(file), { last: 10 }), { items: 0, split: 0, rate: null, window: 10, enough: false });
});

// The rate measures spread on real work; a planted fixture is excluded by name, and a rate over
// fewer items than the window is a sample, not a signal (first-runs report, finding 1).
test("disagreementRate excludes named items, so the planted fixture does not count as real work", () => {
  const events = [...cleanItem("i1", 0, { unanimous: true }), ...cleanItem("negative-control", 10)];
  const { file } = logDir(events);
  assert.deepEqual(disagreementRate(readLog(file), { last: 10, exclude: ["negative-control"] }), { items: 1, split: 0, rate: 0, window: 10, enough: false });
});

test("disagreementRate reports enough only when the window is full", () => {
  const events = Array.from({ length: 10 }, (_, i) => cleanItem(`i${i}`, i * 10, { unanimous: true })).flat();
  const { file } = logDir(events);
  const r = disagreementRate(readLog(file), { last: 10 });
  assert.equal(r.items, 10);
  assert.equal(r.enough, true);
  assert.equal(disagreementRate(readLog(file), { last: 11 }).enough, false);
});

test("CLI dissent exits 1 only when the window is full and every item was unanimous; a short sample says so and exits 0", () => {
  const short = logDir([...cleanItem("i1", 0, { unanimous: true }), ...cleanItem("i2", 10, { unanimous: true })]);
  assert.match(run(short.root, ["dissent", "--log", short.file, "--last", "10"]), /2 items[\s\S]*needs 10/);
  const full = logDir(Array.from({ length: 10 }, (_, i) => cleanItem(`i${i}`, i * 10, { unanimous: true })).flat());
  assert.throws(() => run(full.root, ["dissent", "--log", full.file, "--last", "10"]), (err) => err.status === 1 && /rate 0\.00/.test(String(err.stdout)) && /always agrees/.test(String(err.stdout)));
  const mixed = logDir([...Array.from({ length: 9 }, (_, i) => cleanItem(`i${i}`, i * 10, { unanimous: true })).flat(), ...cleanItem("i9", 90)]);
  assert.match(run(mixed.root, ["dissent", "--log", mixed.file, "--last", "10"]), /10 items, 1 non-unanimous, rate 0\.10/);
  const excluded = logDir([...Array.from({ length: 10 }, (_, i) => cleanItem(`i${i}`, i * 10, { unanimous: true })).flat(), ...cleanItem("negative-control", 100)]);
  assert.throws(() => run(excluded.root, ["dissent", "--log", excluded.file, "--last", "10", "--exclude", "negative-control"]), (err) => err.status === 1, "the fixture's split verdict does not rescue the rate");
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
// ADR-0015 reversal trigger 1, as split after the first runs: on a planted-defect item, every
// named lens must return at least one finding in its latest round (presence). Verdict spread is
// not measured here; the dissent rate over real items measures it. A fixture built so that every
// lens catches something cannot also be the fixture that measures whether verdicts split.

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

test("negativeControl passes when every lens found something, and reports the verdicts as information", () => {
  const { file } = logDir(control(0));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.deepEqual(r, { ok: true, missing: [], silent: [], verdicts: { simplicity: "revise", security: "accept" } });
});

test("negativeControl fails when a lens returned no finding, naming the lens", () => {
  const { file } = logDir(control(0, { findings: { simplicity: 1, security: 0 } }));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.equal(r.ok, false);
  assert.deepEqual(r.silent, ["security"]);
});

test("negativeControl passes on unanimous verdicts when every lens found something: unanimity is not the control's claim", () => {
  const { file } = logDir(control(0, { verdicts: { simplicity: "veto", security: "veto" } }));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.equal(r.ok, true);
  assert.equal("unanimous" in r, false, "the result carries no unanimity flag to be misread as a failure");
});

test("negativeControl fails when a lens never returned a verdict, naming it as missing", () => {
  const { file } = logDir(control(0).filter((e) => !(e.event === "verdict" && e.lens === "security")));
  const r = negativeControl(readLog(file), { item: "negative-control", lenses: LENSES });
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["security"]);
});

test("negativeControl reads only the most recent review of the item", () => {
  // An earlier failed run (a silent lens), then a later passing one: the later one counts.
  const events = [...control(0, { findings: { simplicity: 1, security: 0 } }), ...control(20)];
  const { file } = logDir(events);
  assert.equal(negativeControl(readLog(file), { item: "negative-control", lenses: LENSES }).ok, true);
});

test("CLI control prints the verdict per lens and exits 1 on a silent lens, never on unanimity", () => {
  const { root, file } = logDir(control(0, { verdicts: { simplicity: "veto", security: "veto" } }));
  const out = run(root, ["control", "--log", file, "--item", "negative-control", "--lenses", LENSES.join(",")]);
  assert.match(out, /^negative control negative-control: ok \(2 lenses found something\)/m);
  assert.match(out, /simplicity: veto/);
  const { root: r2, file: f2 } = logDir(control(0, { findings: { simplicity: 1, security: 0 } }));
  assert.throws(() => run(r2, ["control", "--log", f2, "--item", "negative-control", "--lenses", LENSES.join(",")]), (err) => err.status === 1 && /no finding from security/.test(String(err.stdout)));
});

// --- the version flag --------------------------------------------------------
// Spec (work order first-run, revised after the first review): `node scripts/team-log.mjs --version`
// prints the version of the summon-team package, packages/summon-team/package.json, the package a
// user installs, and exits 0. It resolves from the same root every other repo file resolves from:
// --root DIR reads DIR/packages/summon-team/package.json; no --root means the repo this script lives
// in. The root package.json is a private workspace with no version and is not read.
// Every run below sets cwd to a directory other than the root under test, so an implementation
// that resolves from process.cwd() fails at least one of them.

const TEAM_PKG = join("packages", "summon-team", "package.json");
const REPO_VERSION = JSON.parse(readFileSync(join(REPO, TEAM_PKG), "utf8")).version;

/** A fresh root holding only packages/summon-team/package.json; `pkg` is written verbatim when a string. */
function pkgRoot(pkg) {
  const root = mkdtempSync(join(tmpdir(), "summon-pkg-"));
  roots.push(root);
  mkdirSync(join(root, "packages", "summon-team"), { recursive: true });
  if (pkg !== undefined) writeFileSync(join(root, TEAM_PKG), typeof pkg === "string" ? pkg : JSON.stringify(pkg));
  return root;
}

/** A working directory that is not the root under test: a decoy package.json at both places, with a version no test expects. */
function decoyCwd() {
  const cwd = pkgRoot({ name: "decoy", version: "9.9.9-decoy" });
  writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "decoy-root", version: "9.9.9-decoy" }));
  return cwd;
}

// The message must name the summon-team package's file, not just "package.json": a user with three
// package.json files in the workspace needs to know which one is wrong.
const NAMES_TEAM_PKG = /summon-team[\s\S]*package\.json/;
const fails = (cwd, args, re) =>
  assert.throws(() => run(cwd, args), (err) => err.status === 1 && re.test(String(err.stderr) + String(err.stdout)), `${args.join(" ")} should exit 1 matching ${re}`);

test("CLI --version with no --root prints the summon-team package version from the repo this script lives in, from a foreign cwd", () => {
  assert.equal(REPO_VERSION && typeof REPO_VERSION, "string", "the checked-in packages/summon-team/package.json carries a version");
  const out = run(decoyCwd(), ["--version"]);
  assert.equal(out, `${REPO_VERSION}\n`);
});

test("CLI --version --root DIR prints DIR/packages/summon-team/package.json's version as the only line of stdout and exits 0, not the cwd's", () => {
  const root = pkgRoot({ name: "fixture", version: "1.2.3" });
  const out = run(decoyCwd(), ["--version", "--root", root]);
  assert.equal(out, "1.2.3\n");
});

test("CLI --version reads the summon-team package, not a root package.json carrying a different version", () => {
  const root = pkgRoot({ name: "summon-team", version: "1.2.3" });
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "workspace-root", version: "7.7.7" }));
  assert.equal(run(decoyCwd(), ["--version", "--root", root]), "1.2.3\n");
});

test("CLI --version does not require --log or an event schema", () => {
  // The fixture root has packages/summon-team/package.json and nothing else: no team/events.json, no log.
  const root = pkgRoot({ version: "0.0.1" });
  assert.equal(run(decoyCwd(), ["--version", "--root", root]).trim(), "0.0.1");
});

test("CLI --version exits 1 naming the summon-team package.json when the version field is absent", () => {
  const root = pkgRoot({ name: "no-version" });
  fails(decoyCwd(), ["--version", "--root", root], NAMES_TEAM_PKG);
  fails(decoyCwd(), ["--version", "--root", root], /version/);
});

test("CLI --version exits 1 naming the summon-team package.json when the version field is empty or not a string", () => {
  const empty = pkgRoot({ version: "" });
  fails(decoyCwd(), ["--version", "--root", empty], NAMES_TEAM_PKG);
  fails(decoyCwd(), ["--version", "--root", empty], /version/);
  const numeric = pkgRoot({ version: 3 });
  fails(decoyCwd(), ["--version", "--root", numeric], NAMES_TEAM_PKG);
  fails(decoyCwd(), ["--version", "--root", numeric], /version/);
});

test("CLI --version exits 1 naming the summon-team package.json when the file is missing or malformed", () => {
  const missing = pkgRoot(undefined);
  fails(decoyCwd(), ["--version", "--root", missing], NAMES_TEAM_PKG);
  const malformed = pkgRoot("{not json");
  fails(decoyCwd(), ["--version", "--root", malformed], NAMES_TEAM_PKG);
});

test("CLI usage line for an unknown command mentions --version", () => {
  fails(decoyCwd(), ["bogus"], /usage[^\n]*--version/);
});

test("CLI still rejects an unknown leading flag with the usage line after --version is added", () => {
  fails(decoyCwd(), ["--versionx"], /usage/);
});
