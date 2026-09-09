#!/usr/bin/env node
// agent-notes: { ctx: "composes team/ layers (role, persona, view, harness) into harness output per a party", deps: [docs/methodology/team-layers.md, team/README.md, team/parties/summon-core.json, team/harness/claude-code.json], state: draft, last: "sato@2026-09-09", key: ["zero dependencies; flat-scalar frontmatter parser only", "view content is never written into an agent file", "enforcement level per must-not: tool when every mapped tool is withheld, else prose", "exports loadTeam + compose behind an entry-point guard for the tests"] }
//
// Reads a party under team/parties/, resolves each member's role, lens, and
// persona, and emits the harness adapter's artefacts plus roster.md (from the
// view) and enforcement.md (tool vs prose, per boundary).
//
//   node scripts/compose-team.mjs --party summon-core [--harness NAME] [--view NAME] [--out DIR]
//
// Exit 0 = composed. Exit 1 = a layer is malformed or a binding does not resolve.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

// Capabilities are verbs about the work. Tool names live only in harness adapters.
export const CAPABILITIES = ["read", "run", "write:src", "write:tests", "write:docs", "web", "notebook"];

const ROLE_ORDER_HEAD = ["Charter", "Standard", "Questions"];
const ROLE_ORDER_TAIL = ["Boundaries", "Output"];
const PERSONA_ORDER = ["Priors", "Dissent", "Tells"];

// --- parsing -----------------------------------------------------------------

const read = (p) => readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(read(p));
const listDirs = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
const listMd = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : []);
const listJson = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : []);

/** Flat `key: value` frontmatter. Enough for role and persona files; nesting is a defect here. */
export function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { data, body: text.slice(m[0].length) };
}

/** Split a Markdown body into its level-2 sections. Text before the first `## ` is dropped. */
export function sections(body) {
  const out = new Map();
  const parts = body.split(/^## /m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const content = nl === -1 ? "" : part.slice(nl + 1).trim();
    out.set(heading, content);
  }
  return out;
}

const stripComments = (text) => text.replace(/<!--[\s\S]*?-->\n?/g, "").trim();

// --- loading -----------------------------------------------------------------

function loadRole(dir, name) {
  const skillPath = join(dir, "SKILL.md");
  const metaPath = join(dir, "role.json");
  if (!existsSync(skillPath)) throw new Error(`role "${name}": missing SKILL.md`);
  if (!existsSync(metaPath)) throw new Error(`role "${name}": missing role.json`);
  const skill = read(skillPath);
  const meta = readJson(metaPath);
  for (const key of ["may", "must-not"]) {
    for (const cap of meta[key] ?? []) {
      if (!CAPABILITIES.includes(cap)) {
        throw new Error(`role "${name}": capability "${cap}" in ${key} is not a work verb (expected one of ${CAPABILITIES.join(", ")}); tool names belong in a harness adapter`);
      }
    }
  }
  const { data, body } = parseFrontmatter(skill);
  const lenses = {};
  for (const lens of meta.lenses ?? []) {
    const p = join(dir, "lenses", `${lens}.md`);
    if (!existsSync(p)) throw new Error(`role "${name}": declares lens "${lens}" but ${p} is missing`);
    lenses[lens] = stripComments(read(p));
  }
  return { name, skill, description: data.description ?? "", sections: sections(stripComments(body)), meta: { may: meta.may ?? [], "must-not": meta["must-not"] ?? [], lenses: meta.lenses ?? [] }, lenses };
}

function loadPersona(path, name) {
  const { data, body } = parseFrontmatter(read(path));
  const secs = sections(stripComments(body));
  if (!(secs.get("Dissent") ?? "").trim()) {
    throw new Error(`persona "${name}": Dissent section is empty; a persona without dissent is decoration and should be cut (docs/methodology/team-layers.md)`);
  }
  const holds = (data.holds ? data.holds.split(",") : [data.role ? `${data.role}${data.lens ? `/${data.lens}` : ""}` : ""])
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [role, lens] = s.split("/");
      return { role, lens: lens ?? null };
    });
  if (!holds.length) throw new Error(`persona "${name}": frontmatter must name a role (\`role:\` or \`holds:\`)`);
  return { name, role: holds[0].role, holds, display: data.display || name, sections: secs };
}

function loadHarness(path, name) {
  const h = readJson(path);
  if (typeof h.fitted !== "boolean") {
    throw new Error(`harness "${name}": must declare "fitted": true or false; the adapter is the only layer allowed to be fitted, and it has to say so`);
  }
  if (!h.output?.dir || !h.output?.file) throw new Error(`harness "${name}": output.dir and output.file are required`);
  return { name, ...h, capabilities: h.capabilities ?? {}, frontmatter: h.frontmatter ?? {}, budget: h.budget ?? {} };
}

/** Read every layer under <root>/team. Validation errors name the file and the rule. */
export function loadTeam(root) {
  const base = join(root, "team");
  const roles = {};
  for (const name of listDirs(join(base, "roles"))) roles[name] = loadRole(join(base, "roles", name), name);
  const personas = {};
  for (const f of listMd(join(base, "personas"))) {
    const name = f.replace(/\.md$/, "");
    personas[name] = loadPersona(join(base, "personas", f), name);
  }
  const views = {};
  for (const name of listDirs(join(base, "views"))) {
    const p = join(base, "views", name, "party.json");
    if (existsSync(p)) views[name] = readJson(p);
  }
  const harnesses = {};
  for (const f of listJson(join(base, "harness"))) {
    const name = f.replace(/\.json$/, "");
    harnesses[name] = loadHarness(join(base, "harness", f), name);
  }
  const parties = {};
  for (const f of listJson(join(base, "parties"))) parties[f.replace(/\.json$/, "")] = readJson(join(base, "parties", f));
  return { roles, personas, views, harnesses, parties };
}

// --- composition -------------------------------------------------------------

const uniq = (arr) => [...new Set(arr)];
const toolsFor = (harness, caps) => uniq(caps.flatMap((c) => harness.capabilities[c] ?? []));

function resolveMember(team, party, m, where) {
  const role = team.roles[m.role];
  if (!role) throw new Error(`${where}: role "${m.role}" has no directory under team/roles/`);
  const persona = team.personas[m.persona];
  if (!persona) throw new Error(`${where}: persona "${m.persona}" has no file under team/personas/`);
  const lens = m.lens ?? null;
  const held = persona.holds.some((h) => h.role === m.role && (h.lens === null || h.lens === lens));
  if (!held) {
    const holds = persona.holds.map((h) => (h.lens ? `${h.role}/${h.lens}` : h.role)).join(", ");
    throw new Error(`${where}: persona "${m.persona}" is bound to role "${persona.role}" (holds: ${holds}) but the party assigns role "${m.role}"${lens ? ` on lens "${lens}"` : ""}`);
  }
  if (lens && !role.meta.lenses.includes(lens)) {
    throw new Error(`${where}: lens "${lens}" is not declared by role "${role.name}" (declared: ${role.meta.lenses.join(", ") || "none"})`);
  }
  return { role, persona, lens };
}

/** tool: every tool the boundary maps to is withheld. prose: the role needs a tool the boundary shares, or the harness maps nothing. */
function enforcementRows(harness, member, role, allowed) {
  return role.meta["must-not"].map((boundary) => {
    const mapped = harness.capabilities[boundary] ?? [];
    const level = mapped.length > 0 && mapped.every((t) => !allowed.includes(t)) ? "tool" : "prose";
    return { member, role: role.name, boundary, level };
  });
}

function frontmatter(harness, role, name, description, tools, disallowed) {
  const lines = [`name: ${name}`, `description: ${JSON.stringify(description)}`];
  if (tools.length) lines.push(`tools: ${tools.join(", ")}`);
  if (disallowed.length) lines.push(`disallowedTools: ${disallowed.join(", ")}`);
  for (const [k, v] of Object.entries(harness.frontmatter)) lines.push(`${k}: ${v}`);
  const budget = harness.budget[role.name] ?? harness.budget.default;
  if (budget !== undefined) lines.push(`maxTurns: ${budget}`);
  return `---\n${lines.join("\n")}\n---\n`;
}

const HEADER = "<!-- composed by scripts/compose-team.mjs from team/ — do not edit; edit the layer and recompose -->\n\n";

const section = (title, text) => (text ? `## ${title}\n\n${text}\n\n` : "");

function agentBody(role, lens, lensText, persona) {
  let out = HEADER;
  out += `You are ${persona.display}, holding the ${role.name} role${lens && lensText ? ` on the ${lens} lens` : ""}.\n\n`;
  out += section("Voice", persona.sections.get("Voice"));
  for (const h of ROLE_ORDER_HEAD) out += section(h, role.sections.get(h));
  if (lensText) out += `${lensText}\n\n`;
  for (const h of PERSONA_ORDER) out += section(h, persona.sections.get(h));
  for (const h of ROLE_ORDER_TAIL) out += section(h, role.sections.get(h));
  return out.trimEnd() + "\n";
}

function formationBody(name, role, members) {
  let out = HEADER;
  out += `You are ${name}, a formation of ${members.length} lenses on the ${role.name} role. Each lens reads the same change independently and is allowed to disagree with the others; report where they do.\n\n`;
  for (const h of ROLE_ORDER_HEAD) out += section(h, role.sections.get(h));
  for (const { persona, lensText } of members) {
    out += `# ${persona.display}\n\n`;
    if (lensText) out += `${lensText}\n\n`;
    out += section("Voice", persona.sections.get("Voice"));
    for (const h of PERSONA_ORDER) out += section(h, persona.sections.get(h));
  }
  for (const h of ROLE_ORDER_TAIL) out += section(h, role.sections.get(h));
  return out.trimEnd() + "\n";
}

function renderRoster(view, party, resolved, formations) {
  const v = view ?? { title: party.name, members: {}, formations: {} };
  let out = `# ${v.title ?? party.name}\n\n`;
  out += `Party \`${party.name}\`, skin \`${v.skin ?? "none"}\`. Rendered from the view; nothing here reaches a prompt.\n\n`;
  out += "| Name | Class | Holds | Epithet | Blurb |\n|---|---|---|---|---|\n";
  for (const { role, persona, lens } of resolved) {
    const m = v.members?.[persona.name] ?? {};
    const holds = lens ? `${role.name} / ${lens}` : role.name;
    out += `| ${persona.display} | ${m.class ?? ""} | ${holds} | ${m.epithet ?? ""} | ${m.blurb ?? ""} |\n`;
  }
  if (formations.length) {
    out += "\n## Formations\n\n| Name | Class | Members | Blurb |\n|---|---|---|---|\n";
    for (const f of formations) {
      const m = v.formations?.[f.name] ?? {};
      out += `| ${f.name} | ${m.class ?? ""} | ${f.members.map((x) => x.persona.display).join(", ")} | ${m.blurb ?? ""} |\n`;
    }
  }
  return out;
}

function renderEnforcement(harness, rows) {
  const tool = rows.filter((r) => r.level === "tool").length;
  const prose = rows.length - tool;
  let out = `# Enforcement on \`${harness.name}\`\n\n`;
  out += `Adapter fitted: ${harness.fitted}. ${rows.length} boundaries: ${tool} enforced at the tool layer, ${prose} by prose only.\n\n`;
  out += "A boundary is **tool** when every tool it maps to is withheld from the agent. It is **prose** when the role needs a tool the boundary shares, or the adapter maps it to nothing; the agent can read the rule but nothing stops it.\n\n";
  out += "| Member | Role | Must not | Level |\n|---|---|---|---|\n";
  for (const r of rows) out += `| ${r.member} | ${r.role} | ${r.boundary} | ${r.level} |\n`;
  return out;
}

/**
 * Compose a party. Returns { files: [{ path, content }], enforcement: rows, roster }.
 * Paths are relative to the output directory.
 */
export function compose(root, { party: partyName, harness: harnessName, view: viewName } = {}) {
  const team = loadTeam(root);
  const party = team.parties[partyName];
  if (!party) throw new Error(`party "${partyName}" has no file under team/parties/`);
  const harness = team.harnesses[harnessName ?? party.harness];
  if (!harness) throw new Error(`party "${partyName}": harness "${harnessName ?? party.harness}" has no adapter under team/harness/`);
  const view = team.views[viewName ?? party.view] ?? null;

  const resolved = (party.members ?? []).map((m, i) => resolveMember(team, party, m, `party "${partyName}" member ${i}`));
  const formations = (party.formations ?? []).map((f, i) => {
    const where = `party "${partyName}" formation "${f.name ?? i}"`;
    const members = (f.members ?? []).map((m) => {
      const r = resolveMember(team, party, { role: f.role, persona: m.persona, lens: m.lens }, where);
      return { ...r, lensText: r.lens ? r.role.lenses[r.lens] : null };
    });
    return { name: f.name, role: team.roles[f.role], members };
  });

  const files = [];
  const rows = [];
  const outPath = (vars) => join(harness.output.dir, harness.output.file.replace(/\{(\w+)\}/g, (_, k) => vars[k]));

  if (harness.personas === false) {
    // Roles only: the portable, voiceless target. Role text is emitted verbatim.
    const used = uniq([...resolved.map((r) => r.role), ...formations.map((f) => f.role)]);
    for (const role of used) {
      files.push({ path: outPath({ role: role.name, name: role.name }), content: role.skill });
      for (const [lens, text] of Object.entries(role.lenses)) {
        files.push({ path: join(dirname(outPath({ role: role.name, name: role.name })), "lenses", `${lens}.md`), content: text + "\n" });
      }
      rows.push(...enforcementRows(harness, role.name, role, toolsFor(harness, role.meta.may)));
    }
  } else {
    for (const { role, persona, lens } of resolved) {
      const tools = toolsFor(harness, role.meta.may);
      const disallowed = toolsFor(harness, role.meta["must-not"]).filter((t) => !tools.includes(t));
      const description = `${persona.display}: ${role.description}${lens ? ` Holds the ${lens} lens.` : ""}`;
      const lensText = lens ? role.lenses[lens] : null;
      files.push({ path: outPath({ name: persona.name, role: role.name }), content: frontmatter(harness, role, persona.name, description, tools, disallowed) + agentBody(role, lens, lensText, persona) });
      rows.push(...enforcementRows(harness, persona.name, role, tools));
    }
    for (const f of formations) {
      const tools = toolsFor(harness, f.role.meta.may);
      const disallowed = toolsFor(harness, f.role.meta["must-not"]).filter((t) => !tools.includes(t));
      const description = `${f.name}: ${f.role.description} A formation of ${f.members.map((m) => m.lens).filter(Boolean).join(", ")}.`;
      files.push({ path: outPath({ name: f.name, role: f.role.name }), content: frontmatter(harness, f.role, f.name, description, tools, disallowed) + formationBody(f.name, f.role, f.members) });
      rows.push(...enforcementRows(harness, f.name, f.role, tools));
    }
    files.push({ path: "roster.md", content: renderRoster(view, party, resolved, formations) });
  }

  files.push({ path: "enforcement.md", content: renderEnforcement(harness, rows) });
  return { files, enforcement: rows, roster: files.find((f) => f.path === "roster.md")?.content ?? null };
}

// --- CLI ---------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { out: "build/team" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--party" || a === "--harness" || a === "--view" || a === "--out") opts[a.slice(2)] = argv[++i];
    else throw new Error(`unknown argument ${a}`);
  }
  if (!opts.party) throw new Error("--party is required");
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const result = compose(process.cwd(), opts);
  for (const f of result.files) {
    const abs = join(opts.out, f.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, f.content);
  }
  const tool = result.enforcement.filter((r) => r.level === "tool").length;
  const prose = result.enforcement.length - tool;
  console.log(`composed ${result.files.length} files → ${opts.out}`);
  console.log(`enforcement: ${tool} boundaries at the tool layer, ${prose} by prose only (see ${join(opts.out, "enforcement.md")})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(`compose-team: ${err.message}`);
    process.exit(1);
  }
}
