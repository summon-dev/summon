#!/usr/bin/env node
// agent-notes: { ctx: "turns a work order into a plan; writes spawn and claim events from outside the model", deps: [scripts/compose-team.mjs, scripts/team-log.mjs, scripts/run-checks.mjs, team/events.json, docs/methodology/team-layers.md], state: draft, last: "sato@2026-09-09", key: ["the plan is the assignment: instances are named and bound to stations at plan time, never chosen by a seat", "a return releases the station its instance last claimed on that item; a claim alone releases nothing", "every refusal is thrown before anything is written, so a refused open or claim leaves the log untouched"] }
//
// Dispatch is where scale lives (team-layers.md § The work order). The party says who may
// hold a seat; the order says how many instances run against which items on which line.
//
//   node scripts/dispatch.mjs plan  --order FILE --out FILE
//   node scripts/dispatch.mjs open  --plan FILE --at ISO [--no-worktrees]
//   node scripts/dispatch.mjs claim --plan FILE --item ID --station NAME --at ISO
//
// Exit 1 on a malformed order, a party that cannot run the line, a limit exceeded, or a
// claim the line's constraints refuse. Nothing is written on a refusal.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { compose, loadTeam } from "./compose-team.mjs";
import { treeState } from "./run-checks.mjs";
import { appendEvent, loadLine, loadSchema, readLog, validateEvent } from "./team-log.mjs";

const WORKTREES = ".summon/worktrees";

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (err) {
    throw new Error(`${p}: ${err.message}`);
  }
};

// --- the order ---------------------------------------------------------------

/** Read a work order and check it against team/events.json workOrder. Names the missing field. */
export function loadOrder(path, schema = loadSchema()) {
  const order = readJson(path);
  const spec = schema.workOrder;
  for (const k of spec.required) if (order[k] === undefined) throw new Error(`order ${path}: "${k}" is required`);
  if (!Array.isArray(order.items)) throw new Error(`order ${path}: "items" must be an array`);
  order.items.forEach((item, i) => {
    for (const k of spec.item.required) if (item?.[k] === undefined) throw new Error(`order ${path}: item ${i}: "${k}" is required`);
  });
  return order;
}

// --- plan: the assignment ----------------------------------------------------

const seatsOf = (party) => [...(party.members ?? []).map((m) => m.as ?? m.persona), ...(party.formations ?? []).map((f) => f.name)];

/** Name every instance a station needs: seat#1..seat#n, in the order the line first uses each seat. */
function nameInstances(line, order, isolation) {
  const seats = [...new Set(line.stations.map((s) => s.seat))];
  const out = [];
  for (const seat of seats) {
    const n = order.instances[seat] ?? 1;
    for (let i = 1; i <= n; i++) {
      const instance = `${seat}#${i}`;
      out.push({ seat, instance, worktree: isolation === "worktree" ? `${WORKTREES}/${instance}` : null });
    }
  }
  return out;
}

/** Round-robin per seat across every station of every item, then separate what distinct-instance separates. */
function assign(line, order, instances) {
  const pool = new Map(); // seat -> [instance names]
  for (const i of instances) pool.set(i.seat, [...(pool.get(i.seat) ?? []), i.instance]);
  const next = new Map(); // seat -> index of the instance that takes the next draw
  const draw = (seat) => {
    const names = pool.get(seat);
    const k = next.get(seat) ?? 0;
    next.set(seat, (k + 1) % names.length);
    return names[k];
  };
  const distinct = (line.constraints ?? []).filter((c) => c.rule === "distinct-instance");
  return order.items.map((item) => {
    const stations = line.stations.map((st) => ({ station: st.name, seat: st.seat, instance: draw(st.seat), needs: st.needs ?? [], emits: st.emits }));
    for (const c of distinct) {
      const [a, b] = c.stations.map((name) => stations.find((s) => s.station === name));
      if (!a || !b || a.instance !== b.instance) continue;
      const names = pool.get(b.seat);
      b.instance = names[(names.indexOf(b.instance) + 1) % names.length];
    }
    return { id: item.id, ...(item.spec !== undefined ? { spec: item.spec } : {}), ...(item.diff !== undefined ? { diff: item.diff } : {}), stations };
  });
}

/** Load the order, refuse what the party or adapter cannot run, and bind every station of every item to a named instance. */
export function plan(root, { orderPath }) {
  const schema = loadSchema(root);
  const order = loadOrder(resolve(root, orderPath), schema);
  const team = loadTeam(root);
  const party = team.parties[order.party];
  if (!party) throw new Error(`order "${order.id}": party "${order.party}" has no file under team/parties/`);
  if (!(party.lines ?? []).includes(order.line)) {
    throw new Error(`order "${order.id}": party "${order.party}" does not opt into line "${order.line}" (lines: ${(party.lines ?? []).join(", ") || "none"})`);
  }
  const line = loadLine(order.line, root);
  const seats = seatsOf(party);
  for (const st of line.stations ?? []) {
    if (!seats.includes(st.seat)) throw new Error(`line "${line.name}" station "${st.name}" names seat "${st.seat}", which party "${order.party}" does not compose (have: ${seats.join(", ")})`);
  }
  compose(root, { party: order.party }); // every binding checked the way the composer checks it
  const harness = team.harnesses[party.harness];
  if (!harness) throw new Error(`party "${order.party}": harness "${party.harness}" has no adapter under team/harness/`);
  if (!harness.dispatch) throw new Error(`harness "${harness.name}" has dispatch: null; a harness with no spawner cannot dispatch`);
  const { concurrency, depth, isolation } = harness.dispatch;

  for (const c of line.constraints ?? []) {
    if (c.rule !== "distinct-instance") continue;
    const [a, b] = c.stations.map((name) => line.stations.find((s) => s.name === name));
    if (a && b && a.seat === b.seat && (order.instances[a.seat] ?? 1) < 2) {
      throw new Error(`line "${line.name}": constraint "distinct-instance" separates stations "${a.name}" and "${b.name}", both on seat "${a.seat}", which order "${order.id}" gives only ${order.instances[a.seat] ?? 1} instance; it needs at least 2`);
    }
  }
  const instances = nameInstances(line, order, isolation);
  if (instances.length > concurrency) {
    throw new Error(`order "${order.id}" needs ${instances.length} instances, over the "${harness.name}" adapter's dispatch.concurrency of ${concurrency}`);
  }
  return {
    order: order.id,
    party: order.party,
    line: order.line,
    harness: harness.name,
    limits: { concurrency, depth, isolation },
    instances,
    items: assign(line, order, instances),
  };
}

// --- open: spawn events and worktrees ----------------------------------------

function logPathOf(root) {
  const logPath = loadTeam(root).checks?.log;
  if (!logPath) throw new Error("no log configured in team/checks.json; a spawn nobody can see is not a dispatch");
  return join(root, logPath);
}

function addWorktree(root, worktree) {
  const abs = join(root, worktree);
  if (existsSync(abs)) return;
  const r = spawnSync("git", ["worktree", "add", "--detach", abs], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (r.status !== 0) throw new Error(`git worktree add ${worktree}: ${(r.stderr || r.stdout || "").trim() || `exit ${r.status}`}`);
}

/** Write one spawn event per planned instance, and create its worktree when isolation asks for one. */
export function open(root, { planPath, at, worktrees = true }) {
  const p = readJson(resolve(root, planPath));
  const logFile = logPathOf(root);
  const schema = loadSchema(root);
  const tree = treeState(root);
  const events = p.instances.map((i) => ({ t: at, seat: i.seat, instance: i.instance, event: "spawn", order: p.order, harness: p.harness, tree, worktree: i.worktree }));
  const problems = events.flatMap((e) => validateEvent(e, schema).map((x) => `spawn ${e.instance}: ${x}`));
  if (problems.length) throw new Error(problems.join("; "));
  // Worktrees before events: a failed add then leaves nothing in the log, and a rerun skips what exists.
  if (worktrees && p.limits.isolation === "worktree") for (const i of p.instances) if (i.worktree) addWorktree(root, i.worktree);
  mkdirSync(dirname(logFile), { recursive: true });
  for (const e of events) appendEvent(logFile, e, schema);
  return events;
}

// --- claim: the separation-of-duties boundary --------------------------------

/** The stations of one item that have returned: a return releases whatever its instance last claimed there. */
function returnedStations(log, item) {
  const holding = new Map(); // instance -> station
  const returned = new Set();
  for (const e of log) {
    if (e.item !== item) continue;
    const instance = e.instance ?? e.seat;
    if (e.event === "claim" && e.station) holding.set(instance, e.station);
    if (e.event === "return" && holding.has(instance)) returned.add(holding.get(instance));
  }
  return returned;
}

/** Write the claim for the instance the plan assigned, unless the log shows the line's constraints would be broken. */
export function claim(root, { planPath, item, station, at }) {
  const p = readJson(resolve(root, planPath));
  const row = p.items.find((i) => i.id === item);
  if (!row) throw new Error(`item "${item}" is not in plan ${planPath} (items: ${p.items.map((i) => i.id).join(", ")})`);
  const st = row.stations.find((s) => s.station === station);
  if (!st) throw new Error(`item "${item}" has no station "${station}" in plan ${planPath} (stations: ${row.stations.map((s) => s.station).join(", ")})`);
  const logFile = logPathOf(root);
  const schema = loadSchema(root);
  const line = loadLine(p.line, root);
  const log = existsSync(logFile) ? readLog(logFile) : [];

  const returned = returnedStations(log, item);
  for (const c of line.constraints ?? []) {
    if (c.rule !== "order" || !c.stations.includes(station)) continue;
    const owed = c.stations.slice(0, c.stations.indexOf(station)).find((s) => !returned.has(s));
    if (owed) throw new Error(`item "${item}": cannot claim "${station}" until "${owed}" has returned (line "${line.name}" order: ${c.stations.join(" → ")})`);
  }
  for (const c of line.constraints ?? []) {
    if (c.rule !== "distinct-instance" || !c.stations.includes(station)) continue;
    const other = c.stations.find((s) => s !== station);
    const held = log.some((e) => e.event === "claim" && e.item === item && e.station === other && (e.instance ?? e.seat) === st.instance);
    if (held) throw new Error(`item "${item}": instance "${st.instance}" already claimed "${other}", and distinct-instance keeps "${other}" and "${station}" on different instances`);
  }

  const e = { t: at, seat: st.seat, instance: st.instance, event: "claim", item, station, order: p.order };
  mkdirSync(dirname(logFile), { recursive: true });
  appendEvent(logFile, e, schema);
  return e;
}

// --- CLI ---------------------------------------------------------------------

const SWITCHES = ["--no-worktrees"];

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { cmd };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith("--")) throw new Error(`unknown argument ${a}`);
    if (SWITCHES.includes(a)) {
      opts[a.slice(2)] = true;
      continue;
    }
    const v = rest[i + 1];
    if (v === undefined || v.startsWith("--")) throw new Error(`${a} requires a value`);
    opts[a.slice(2)] = v;
    i++;
  }
  if (!["plan", "open", "claim"].includes(cmd)) throw new Error("usage: dispatch.mjs plan|open|claim ...");
  const required = { plan: ["order", "out"], open: ["plan"], claim: ["plan", "item", "station"] }[cmd];
  for (const k of required) if (!opts[k]) throw new Error(`--${k} is required`);
  return opts;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const at = o.at ?? new Date().toISOString();
  if (o.cmd === "plan") {
    const p = plan(root, { orderPath: o.order });
    writeFileSync(resolve(root, o.out), JSON.stringify(p, null, 2));
    console.log(`planned ${p.order}: ${p.instances.length} instances, ${p.items.length} items → ${o.out}`);
    return;
  }
  if (o.cmd === "open") {
    const events = open(root, { planPath: o.plan, at, worktrees: !o["no-worktrees"] });
    console.log(`opened ${events[0]?.order ?? "plan"}: ${events.length} spawn events${events.some((e) => e.worktree) && !o["no-worktrees"] ? `, worktrees under ${WORKTREES}` : ""}`);
    return;
  }
  const e = claim(root, { planPath: o.plan, item: o.item, station: o.station, at });
  console.log(`claimed ${e.station} on ${e.item} for ${e.instance}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(`dispatch: ${err.message}`);
    process.exit(1);
  }
}
