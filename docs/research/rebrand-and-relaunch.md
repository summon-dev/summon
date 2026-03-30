---
agent-notes: { ctx: "rebrand research for vteam-hybrid relaunch — positioning-first strategy", deps: [CLAUDE.md, docs/methodology/personas.md, docs/methodology/phases.md, docs/research/ux-gap-analysis-squad-vs-vteam.md, docs/research/squad-vs-vteam-architectural-comparison.md], state: active, last: "dani@2026-03-30" }
---

# Rebrand and Relaunch Research

> **Author:** Dani (Design + UX + Accessibility)
> **Date:** 2026-03-30
> **Status:** Research -- not yet implemented
> **Audience:** Repo maintainer planning the relaunch

This document covers four pillars: naming, distribution, maintainability architecture, and the marketing site. The goal is to transform vteam-hybrid from a GitHub template repo used by its author into a publicly distributed product.

> **⚠ Positioning Update (post-review synthesis):** The original framing below targets "vibe coders" as a primary audience. Cross-review analysis (see § Synthesis at the end of this document) identified a fundamental contradiction: vibe coders want minimal process, but this product IS process. The real audience is **solo builders who know they need discipline**. The "vibe coder" segment may discover this product, but they are not who it's built for. Naming, site copy, and distribution decisions should be re-evaluated through this lens.

---

## What We Are Selling

Before naming or distribution: clarity on the pitch.

vteam-hybrid is a **CLAUDE.md-driven AI team framework**. It gives you 19 specialized AI agents, 27 slash commands, a 7-phase development methodology, and opinionated governance -- all configured through static markdown files that Claude Code reads at session start. No runtime dependency. No daemon. No lock-in. You clone it, you own it.

The elevator pitch, distilled: **"An AI dev team in a repo. Clone it. Ship with it."**

The audience splits into two segments:

1. **Vibe coders** -- people using Claude Code / Cursor / Copilot to build fast. They want more structure than "just prompt it" without the ceremony of enterprise process. They want to feel like they have a team.
2. **Solo builders / small teams** -- indie devs, startup CTOs, senior engineers working alone on side projects. They know they need code review, security scanning, architecture decisions -- but they are one person. This gives them the team they cannot hire.

The name and positioning must serve both segments without alienating either.

> **⚠ Tension flag:** These two segments have opposing needs. Segment 1 wants speed with light guardrails. Segment 2 wants the guardrails. The product — with mandatory architecture gates, 15-item done checklists, sprint boundaries, and adversarial ADR debates — is firmly a Segment 2 product. Marketing it to Segment 1 risks high bounce rates when they hit the Session Entry Protocol (3 mandatory questions before writing ANY code). See § Synthesis for the recommended resolution.

---

## (A) Name Candidates

### Naming Criteria

A good name for this product must:

1. **Be available** as an npm package (unscoped or under a claimable scope), a GitHub org, and a `.dev` or `.sh` domain.
2. **Be typeable** -- no special characters, no ambiguous spelling, maximum 12 characters for the CLI command.
3. **Evoke the concept** -- AI agents working as a team, structured creativity, shipping culture.
4. **Not be cringe** -- the vibe coding crowd has finely tuned cringe detectors. Avoid anything that sounds like an enterprise sales deck.
5. **Be SEO-differentiable** -- must not collide with an existing popular tool or common English word that dominates search results.

### The Candidates

| # | Name | CLI Command | Vibe | Notes |
|---|------|------------|------|-------|
| 1 | **shipwright** | `npx shipwright` | Master builder who constructs ships. Evokes craft, speed, and something seaworthy leaving the dock. Old-world skill meets modern shipping culture. | Strong metaphor. "Ship" is the developer verb of the decade. Risk: there is a Kubernetes-adjacent project called Shipwright (Red Hat). Check if the npm name is clear. |
| 2 | **crewfile** | `npx crewfile` | Your team is defined in files. Riffs on Dockerfile, Makefile, Brewfile -- devs already think in "Xfile" patterns. The crew is the file. | Highly descriptive. Immediately communicates the mechanism (file-based team definition). Lowercase, no ambiguity. Could also be the name of the actual config file (`Crewfile`). |
| 3 | **vsquad** | `npx vsquad` | Virtual squad. Short, punchy, nods to "vibe" with the v-prefix. Squad is the gaming/military term for a small team on a mission. | Risks collision with Brady Gaster's "squad" project (bradygaster/squad). The "v" prefix differentiates but the association is tight. |
| 4 | **phantomteam** | `npx phantomteam` | Your team is real but invisible. They review your code, challenge your architecture, write your tests -- but they are not people. Ghost team energy. | Long (11 chars) but memorable. "Phantom" has strong connotations of stealth and capability. The metaphor works: the team exists in the machine. |
| 5 | **vibecrew** | `npx vibecrew` | Leans directly into the vibe coding meme. "We don't write code alone; we vibe with our crew." Self-aware, slightly irreverent, immediately understood by the target audience. | Most meme-aligned name. Risk: ties the product to a meme that may age. Counter-argument: "vibe coding" was Collins Dictionary Word of the Year 2025 and is now industry vernacular, not just a meme. |
| 6 | **shipit** | `npx shipit` | The most direct possible name. Zero metaphor overhead. You use this tool to ship it. Period. | npm package `shipit` exists (deployment tool by Segment). Would need `@shipit/create` or a variant like `shippit`. The directness is the appeal and the limitation. |
| 7 | **raidparty** | `npx raidparty` | RPG/gaming metaphor. You are assembling a raid party before tackling a dungeon (your project). Each agent is a class in your party: the tank (Sato), the healer (Tara), the rogue (Pierrot), the bard (Cam). | Strong appeal to the gaming-dev overlap (which is large). The metaphor maps naturally: party composition matters, each member has a role, you wipe if you skip the healer. Risk: slightly niche for non-gamers. |
| 8 | **runbook** | `npx runbook` | Operational metaphor. A runbook is a set of procedures. Your AI team follows the runbook. | Clean, professional, widely understood. Risk: "runbook" already has strong associations with SRE/ops. May confuse the positioning. npm package exists. |
| 9 | **wardroom** | `npx wardroom` | Naval term for the officers' mess -- where the team plans and debates. Evokes strategy, leadership, structured collaboration. | Obscure enough to be ownable. Sophisticated without being pretentious. The nautical theme pairs well with "ship." Risk: most devs will not know what a wardroom is. |
| 10 | **aiparty** | `npx aiparty` | Double meaning: AI party (a group of AI agents) and "AI party" (it is a party, not a slog). Light, fun, approachable. | Simple and memorable. The double meaning is a feature. Risk: slightly too casual for enterprise adoption. Counter: enterprise is not the initial target. |
| 11 | **summon** | `npx summon` | You summon your team into existence. RPG evocation meets developer tooling. "Summon your dev team. Start building." | Strong verb-as-name pattern (like Forge, Brew, Invoke). Evocative without being silly. The summon metaphor maps perfectly: you invoke agents, you summon a team. npm: check availability. |
| 12 | **helmsmate** | `npx helmsmate` | The person who helps you steer the ship. Your AI co-pilot, but framed as a whole crew at the helm. | Nautical theme continued. "Mate" is warm and collaborative. Risk: "helm" collides with Kubernetes Helm. "Helmsmate" is differentiated enough but the association exists. |
| 13 | **cloneforce** | `npx cloneforce` | You clone the repo, you get a force (team). Direct, action-oriented, slightly sci-fi. Star Wars clone army vibes without being derivative. | Communicates the distribution model (clone) and the value (force/team) in one word. Risk: "clone" has negative connotations in some contexts (copying, not original). |
| 14 | **shipmates** | `npx shipmates` | The people you ship with. Your mates. On the ship. Warm, collaborative, and directly tied to shipping culture. | Friendly and approachable. "Mates" is informal without being sloppy. The nautical + shipping double meaning is strong. npm: likely available. |
| 15 | **partycli** | `npx partycli` | "Party" (RPG team composition) + "CLI" (the medium). Explicit about what it is while leaning into the gaming metaphor. | Too literal. Included for completeness. The name explains itself but lacks magic. |

### npm Availability (Verified 2026-03-30)

| Name | Base pkg | `create-` pkg | Status |
|------|----------|---------------|--------|
| vibecrew | **Available** | **Available** | Fully clear |
| shipmates | **Available** | **Available** | Fully clear |
| raidparty | **Available** | **Available** | Fully clear |
| summon | **Taken** (v0.2.1, inactive since 2015) | **Available** | Base name blocked; scoped `@summon/create` or variant needed |
| shipwright | **Taken** (v0.1.2, DigitalOcean CLI) | **Available** | Base name blocked; also conflicts with Red Hat's CNCF Shipwright project |

### Top 3 Recommendations (Original — see § Synthesis for revised ranking)

> **⚠ Post-review note:** The original ranking below optimized for "vibe coder" resonance. After competitive landscape analysis and positioning review, the ranking is revised in the Synthesis section. The core issue: "vibecrew" signals the wrong audience. The product's differentiator is governance and methodology, not vibes.

**First choice: `vibecrew`** -- It is the most culturally aligned name for the target audience right now. It says what it is (a crew for vibe coding), it is memorable, it is fun to say, and it has built-in virality because people will screenshot the name and share it. The risk of meme aging is real but manageable: even if "vibe coding" fades as a meme, "vibe" and "crew" are both durable words.

**Second choice: `shipmates`** -- If the meme-forward approach feels too risky, this is the safe-but-still-good option. Warm, clear, nautical-meets-shipping-culture, and it works in a sentence: "I built this with my shipmates." It also works as a collective noun: "The shipmates reviewed my PR."

**Third choice: `summon`** -- If the preference is for something more serious and evocative, this is the strongest single-word option. It is a verb (good for CLI tools), it maps perfectly to the agent invocation model, and it has gravitas without being corporate. "Summon your dev team."

### Naming Validation Checklist (Before Committing)

- [ ] Check npm registry for package name availability
- [ ] Check GitHub for org/repo name availability
- [ ] Check domain availability (.dev, .sh, .io, .com)
- [ ] Search Twitter/X for existing usage in dev context
- [ ] Search Product Hunt for existing products with the name
- [ ] Google the name + "developer tool" and check for collisions
- [ ] Say it out loud in a sentence: "I just set up [name] on my project"
- [ ] Ask 3-5 developers who are not involved in the project for gut reactions

---

## (B) Distribution Model

### The Current Model: GitHub Template Repo

**How it works today:** User clicks "Use this template" on GitHub, gets a new repo with all files copied. They then read CLAUDE.md, run `/quickstart` or `/kickoff`, and the template bootstraps into their project.

**Strengths:**
- Zero dependencies. No runtime. No package manager required.
- Full ownership: the user gets every file, can modify anything.
- Git history starts clean (no template history polluting their repo).
- Works with any language/framework (it is just markdown + Claude Code conventions).

**Weaknesses:**
- **Discoverability is near zero.** GitHub template repos do not appear in package manager searches. They are found through links, not discovery.
- **No update story.** Once you clone, you are frozen in time. Template improvements do not flow to existing projects. The `/sync-template` command partially addresses this, but it requires manual invocation and cannot handle structural changes.
- **Onboarding friction.** The user lands on a repo with 50+ files and must figure out what to do. The UX gap analysis documents this problem extensively.
- **No install metrics.** GitHub does not provide "template usage" analytics. You cannot tell how many people are using it, where they drop off, or what they struggle with.

### Option 1: `npx create-X` / `npm init X` Pattern

**Examples:** create-next-app, create-t3-app, create-vite, create-astro

**How it works:** User runs `npx create-vibecrew@latest`, answers a few prompts (project name, tech stack, features to include), and the CLI generates a tailored project. The CLI itself is an npm package published to the registry.

**Install UX:** Excellent. One command, no pre-installation. `npx` handles fetching and running. Works on any machine with Node.js. The `npm create` alias (`npm create vibecrew`) makes it even cleaner.

**Update story:** Good. The CLI is versioned on npm. Users always run `@latest`. The CLI itself updates independently of generated projects. For existing projects, the CLI could include an `npx vibecrew update` command that diffs the user's project against the latest template and offers selective updates.

**Maintenance burden:** Medium. You maintain two things: the CLI (TypeScript/Node.js) and the template files it generates. The CLI needs prompts, file generation logic, and post-scaffold setup (git init, dependency install). Frameworks like `create-create-app`, `clack` (for beautiful prompts), or `giget` (for template downloading) reduce this burden significantly.

**Discoverability:** Strong. npm registry search, npmjs.com browsing, npm weekly download counts (social proof), and the `npx` invocation pattern is now universally understood by JavaScript developers.

**Limitations:**
- Requires Node.js on the user's machine. This is fine for web/JS developers but excludes pure Python/Rust/Go developers who may not have Node.
- The npm ecosystem is JavaScript-centric. A Rust developer running `npx` to scaffold a Rust project feels wrong.
- Maintenance of the CLI is a real cost for a single maintainer.

### Option 2: `degit` / `tiged` / `giget` Pattern

**Examples:** SvelteKit uses `npm create svelte@latest` which internally uses `giget`.

**How it works:** A lightweight tool downloads a repo (or subdirectory of a repo) without git history. The user runs `npx tiged vibecrew/template my-project` or similar.

**Install UX:** Good but not great. The user must know about `tiged`/`giget`, or you wrap it in an npm package (at which point it is the same as Option 1). The raw `tiged` command is a power-user pattern.

**Update story:** Same as GitHub template -- once cloned, no updates flow automatically. `giget` supports extracting subdirectories, which enables a monorepo template structure.

**Maintenance burden:** Low. You maintain the template repo. The download mechanism is someone else's tool.

**Discoverability:** Weak. Same problem as GitHub templates -- you must already know about the project to find it.

**Assessment:** Not a primary distribution channel. Useful as a secondary mechanism for users who prefer it. The real value of `giget` is its programmatic API, which you would use inside a `create-X` CLI.

### Option 3: Homebrew Tap

**How it works:** You create a `homebrew-vibecrew` repo with a Ruby formula. Users run `brew install vibecrew/tap/vibecrew`. The formula installs a CLI that handles scaffolding.

**Install UX:** Excellent for macOS/Linux developers. Homebrew is the de facto package manager for developer tools on macOS. The `brew install` pattern is deeply ingrained.

**Update story:** Good. `brew upgrade vibecrew` pulls the latest version. Formula updates are automatic via the tap.

**Maintenance burden:** Medium. You maintain a Homebrew formula (Ruby boilerplate), release automation (generate tarballs, compute SHA256 checksums), and the CLI binary itself. Tools like GoReleaser or GitHub Actions can automate most of this.

**Discoverability:** Moderate. Homebrew taps do not appear in the main `brew search` unless you are in the core formula list (which requires significant adoption). Discovery comes from documentation and word-of-mouth.

**Limitations:**
- macOS/Linux only. Windows users need WSL or an alternative.
- You must produce a distributable binary, which means the CLI must be compiled (Go, Rust) or bundled (Node.js with pkg/bun compile). This is additional build complexity.
- Homebrew is a secondary install channel for most developer tools, not primary.

### Option 4: Cargo-Style Install

**How it works:** `cargo install vibecrew` installs a Rust binary. Or `cargo binstall vibecrew` for pre-compiled binary download.

**Install UX:** Excellent for Rust developers. Irrelevant for everyone else.

**Assessment:** Only viable if the CLI is written in Rust. Given the project's current JavaScript/markdown nature, this adds significant complexity for a narrow audience. Not recommended as a primary channel.

### Option 5: Language-Agnostic Shell Script

**How it works:** `curl -fsSL https://vibecrew.dev/install.sh | sh` -- a one-liner that downloads and runs a shell script. The script handles detection of the user's environment and bootstraps appropriately.

**Install UX:** Universal. Works on any Unix-like system. No package manager dependency.

**Update story:** Depends on what the script installs. If it installs a binary, the binary can self-update. If it just scaffolds files, same limitations as templates.

**Maintenance burden:** Low for the script itself. The script is a thin wrapper around the real distribution mechanism (it could download from GitHub releases, npm, or a direct URL).

**Discoverability:** None inherent. The user must find the URL somewhere.

**Limitations:**
- `curl | sh` is controversial (piping untrusted scripts to shell). Many developers refuse on principle. Mitigated by hosting the script on a verified domain and providing checksum verification.
- Windows requires WSL or Git Bash.

### Recommendation: Two-Channel Strategy

**Primary: `npx create-vibecrew`** (or whatever the chosen name is)

This is the main distribution channel. Reasons:

1. **Lowest friction for the largest audience.** The majority of Claude Code users are JavaScript/TypeScript developers (Claude Code's strongest ecosystem). `npx` requires nothing beyond Node.js.
2. **Best discoverability.** npm registry search, download counts, trending.
3. **Best update story.** The CLI is always `@latest`. Existing projects get an `update` subcommand.
4. **Best metrics.** npm provides download counts, version adoption, and geographic distribution.
5. **Best social proof mechanics.** Weekly downloads displayed on npmjs.com. GitHub stars on the CLI repo. These compound.

The CLI would use `clack` for beautiful interactive prompts and `giget` internally to fetch template files from the main repo. This means you maintain the templates in one place and the CLI is a thin distribution layer.

**Secondary: GitHub template repo (keep it)**

Maintain the existing template repo as a "view source" resource and an escape hatch for users who do not want Node.js. The template repo becomes the source of truth for template files; the CLI reads from it. This also preserves the "full ownership, no runtime" value proposition for users who prefer it.

The template repo's README would say: "Prefer `npx create-vibecrew`? Run that instead. This repo is the template source."

**Do not pursue (initially):** Homebrew tap, cargo install, or shell script. These are secondary channels that add maintenance burden without proportional reach. Revisit Homebrew if adoption among macOS developers is strong enough to justify the formula maintenance.

### CLI Architecture Sketch

```
create-vibecrew/
  src/
    index.ts          -- entry point, clack prompts
    templates/         -- or fetched via giget from the template repo
    generators/
      cli.ts           -- CLI project generator
      web.ts           -- Web monorepo generator
      ai-tool.ts       -- AI tool generator
      static-site.ts   -- Static site generator
    utils/
      git.ts           -- git init, initial commit
      deps.ts          -- detect package manager, install deps
      post-scaffold.ts -- CLAUDE.md personalization, template cleanup
  package.json
  tsconfig.json
```

The generators map directly to the existing scaffold commands (`/scaffold-cli`, `/scaffold-web-monorepo`, `/scaffold-ai-tool`, `/scaffold-static-site`). The CLI replaces the "create from template, then run a scaffold command" two-step with a single `npx create-vibecrew` flow.

---

## (C) Maintainability Architecture

### The Problem

A single maintainer must support:

- 19 agent definitions that evolve as Claude Code's capabilities change
- 27 slash commands that reference agent definitions and process docs
- 4 scaffold types (CLI, web, AI tool, static site) with different tech stacks
- Cross-cutting process docs (governance, done gate, gotchas, phases, personas)
- A marketing site
- A CLI distribution tool
- Community contributions

Without deliberate architecture, this is a combinatorial explosion that drowns a solo maintainer.

### Principle 1: Separate the Layers

The template repo currently mixes three distinct layers:

1. **Core methodology** -- phases, personas, governance, agent-notes protocol, done gate. This is the "operating system" of the team. It changes slowly and applies universally.
2. **Agent definitions** -- the 19 `.claude/agents/*.md` files. These change when Claude Code's capabilities evolve, when new agent patterns are discovered, or when the community contributes improvements.
3. **Scaffold templates** -- project-type-specific files (package.json templates, tsconfig, pyproject.toml, Cargo.toml, CI configs). These change frequently and are the primary source of combinatorial complexity.

**Recommendation: Version these layers independently.**

```
vibecrew/                          -- GitHub org
  vibecrew-core/                   -- methodology + agents (the "kernel")
    docs/methodology/
    docs/process/
    .claude/agents/
    .claude/commands/              -- methodology commands (kickoff, review, etc.)
    CHANGELOG.md
    VERSION                        -- semver, independent of scaffolds

  vibecrew-scaffolds/              -- project templates (the "drivers")
    cli/python-typer/
    cli/python-click/
    cli/rust-clap/
    web/nextjs/
    web/sveltekit/
    ai-tool/python/
    static-site/astro/
    CHANGELOG.md
    VERSION                        -- semver, independent of core

  create-vibecrew/                 -- CLI distribution tool
    src/
    package.json
    VERSION

  vibecrew.dev/                    -- marketing site
    src/
    public/
```

The `create-vibecrew` CLI composes core + scaffold at generation time. When you run `npx create-vibecrew`, it:

1. Fetches the latest `vibecrew-core` (methodology, agents, commands)
2. Fetches the selected scaffold from `vibecrew-scaffolds`
3. Merges them into the user's new project directory
4. Personalizes CLAUDE.md with the project name and tech stack
5. Runs git init and initial commit

This means:

- Updating an agent definition = one PR to `vibecrew-core`. All future scaffolds get it automatically.
- Adding a new scaffold type = one PR to `vibecrew-scaffolds`. No changes to core.
- Fixing the CLI prompts = one PR to `create-vibecrew`. No changes to templates.

### Principle 2: Scaffold Templates as Thin Overlays

The current scaffold commands contain significant duplication -- every scaffold command starts with the same "Template Setup" block (swap README, move scaffolds, clean template files). This is a symptom of the flat file structure.

In the new architecture, a scaffold is a **thin overlay** on top of the core. The scaffold directory contains only the files that differ from the core:

```
vibecrew-scaffolds/cli/python-typer/
  overlay/
    pyproject.toml.hbs             -- Handlebars template
    src/
      {{project_name}}/
        __init__.py.hbs
        cli.py.hbs
    tests/
      test_cli.py.hbs
  scaffold.json                    -- metadata: name, description, variables, post-hooks
```

The CLI reads `scaffold.json`, prompts for variables, applies the overlay on top of the core files, and runs Handlebars (or a similar lightweight template engine) to personalize file contents. The `*.hbs` extension is stripped after template rendering.

This eliminates:
- Duplication between scaffold commands
- The "move scaffolds, clean template files" ceremony
- The need for users to understand the template's internal file structure

### Principle 3: Support Multiple Project Types Without Combinatorial Explosion

The current model has 4 scaffold types. The future might need 10+ (add Rust, Go, mobile, monorepo variants). Combinatorial explosion comes from crossing project types with optional features:

| Project Type | + Auth | + Database | + CI | + Docker | + Cloud |
|-------------|--------|-----------|------|----------|---------|
| CLI (Python) | - | optional | yes | optional | optional |
| Web (Next.js) | optional | optional | yes | optional | optional |
| AI Tool | - | optional | yes | optional | optional |

A naive approach (one scaffold per combination) produces 4 x 2 x 2 x 2 x 2 x 3 = 192 scaffolds. Unmanageable.

**Solution: Composable layers, not monolithic scaffolds.**

```
vibecrew-scaffolds/
  base/                -- files every project gets (gitignore, editorconfig, CI skeleton)
  project-types/
    cli-python/        -- project structure, package config
    web-nextjs/        -- project structure, package config
    ...
  features/
    auth-supabase/     -- auth overlay (adds files, modifies existing)
    db-postgres/       -- database overlay
    docker/            -- Dockerfile, compose
    ci-github/         -- GitHub Actions workflows
    cloud-aws/         -- AWS-specific config
    cloud-azure/       -- Azure-specific config
```

The CLI composes: `core + base + project-type + selected features`. Features are additive overlays with merge rules defined in their `feature.json`.

This is the `create-t3-app` model: the user selects features interactively, and the CLI composes the right combination. Adding a new feature = adding one overlay directory with a `feature.json`. Adding a new project type = adding one project-type directory. No cross-product explosion.

### Principle 4: Community Contributions Without Drowning

For a solo maintainer, the contribution model must be:

1. **Low-friction for contributors.** "Add a scaffold" should not require understanding the entire codebase.
2. **Low-review-cost for the maintainer.** A scaffold PR should be self-contained and testable in isolation.
3. **No breaking changes from contributions.** A bad scaffold cannot break the core.

**Recommendation: Scaffold contributions are self-contained directories.**

A contributor who wants to add "Rust + Axum web server" creates:

```
vibecrew-scaffolds/web/rust-axum/
  overlay/
    Cargo.toml.hbs
    src/main.rs.hbs
    ...
  scaffold.json        -- metadata, variable definitions
  README.md            -- how to use this scaffold
  test/                -- test that the scaffold generates valid output
```

The review checklist for scaffold PRs:

- [ ] `scaffold.json` is valid
- [ ] Overlay files use the correct template variables
- [ ] The test suite generates a project and runs a basic smoke test (cargo check, npm test, etc.)
- [ ] No modifications to core files

For agent contributions (new agent definitions or improvements to existing ones), the bar is higher: the maintainer must review for voice consistency, methodology alignment, and interaction with other agents. These PRs touch the core and require closer scrutiny.

**CODEOWNERS file:**

```
# Core methodology -- maintainer only
docs/methodology/     @maintainer
docs/process/         @maintainer
.claude/agents/       @maintainer
.claude/commands/     @maintainer

# Scaffolds -- community can contribute
vibecrew-scaffolds/   @maintainer @community-reviewers

# CLI -- maintainer only
create-vibecrew/      @maintainer

# Site -- maintainer + design contributors
vibecrew.dev/         @maintainer
```

### Principle 5: Versioning Strategy

**Core:** Semver. Breaking changes (agent API changes, methodology rewrites) are major bumps. New agents or commands are minor. Fixes are patches.

**Scaffolds:** Independent semver per scaffold directory? No -- too much overhead. Instead: the scaffolds repo has a single version, and each scaffold declares a `core_compat` range in its `scaffold.json`:

```json
{
  "name": "cli-python-typer",
  "version": "1.2.0",
  "core_compat": ">=2.0.0 <3.0.0",
  "description": "Python CLI with Typer, Rich, and Pydantic"
}
```

The CLI checks compatibility at generation time: "This scaffold requires core v2.x. You're generating with core v3.x. This scaffold may need updates."

**CLI:** Semver. The CLI version determines which core/scaffold versions it fetches by default (pinned to known-good combinations). `npx create-vibecrew@latest` always uses the latest compatible combination.

---

## (D) GitHub Pages Marketing Site

### What Makes a Great Developer Tool Landing Page

Based on the Evil Martians study of 100+ developer tool landing pages and analysis of the highest-converting developer tool sites, here are the patterns that work.

### Design References (Sites That Nail It)

**1. Linear (linear.app)**
Why it works: Bold hero statement ("Linear is a purpose-built tool for planning and building products"). Dark theme. Product screenshot immediately below the hero. Logo bar of recognizable customers. Feature sections use the "chess layout" (alternating image-text blocks). No fluff. The entire page respects the developer's time.
What to steal: The confidence of the hero copy. The dark theme. The "show the product, not an illustration" approach.

**2. Supabase (supabase.com)**
Why it works: Code snippet in the hero ("Start your project with a Postgres database, Authentication, instant APIs, and more"). Terminal-style demonstrations. Green-on-dark color scheme that feels like a terminal. Feature sections show actual code and SQL. The page teaches while selling.
What to steal: The code-in-hero pattern. Showing real usage, not abstract feature descriptions.

**3. create.t3.gg**
Why it works: Minimal. One page. The hero is literally the install command (`npm create t3-app@latest`). GitHub stars as social proof. Feature list is short and opinionated. The page loads in under 1 second. No cookie banners, no newsletter popups, no distractions.
What to steal: The radical minimalism. The "one command to start" hero. The opinion-as-feature positioning.

**4. Charm (charm.sh)**
Why it works: A developer tools company whose landing page IS a terminal. Animated terminal demos for every product. Whimsical illustrations that respect the developer's intelligence. The site itself demonstrates the product's aesthetic. Pink-on-dark color scheme that is instantly recognizable.
What to steal: The terminal-as-hero-element approach. The personality. The "our site looks like our product" coherence.

**5. Warp (warp.dev)**
Why it works: AI-native terminal. The hero shows the product in use with AI suggestions visible. Feature sections use animated GIFs/videos showing real workflows. The page answers "what does using this feel like?" rather than "what features does this have?"
What to steal: The "show the feeling, not the feature list" approach. The animated workflow demos.

### Site Structure

Based on the Evil Martians template structure and analysis of the above sites:

```
Section 1: Hero
  - Headline: bold, centered, 6-10 words max
  - Subheadline: one sentence explaining what it is
  - CTA: the install command (copyable) + "View on GitHub" secondary
  - Hero visual: terminal recording showing the /quickstart flow

Section 2: Trust Block
  - GitHub stars count
  - npm weekly downloads (once established)
  - "Built for Claude Code" badge (establishes the ecosystem)
  - Optional: logos of projects built with it (once they exist)

Section 3: The Pitch (3 feature blocks)
  - "19 AI agents, one CLAUDE.md" -- agent roster visualization
  - "Ship faster than your team of one" -- workflow demo
  - "Clone it. Own it. No runtime." -- differentiation from SaaS tools

Section 4: How It Works (step-by-step)
  - Step 1: npx create-vibecrew my-project
  - Step 2: Answer 3 questions
  - Step 3: Start building (show TDD cycle)
  - Each step has a terminal recording or animation

Section 5: Agent Roster (interactive)
  - Grid of agent cards (name, role, one-liner)
  - Click to expand: full description, example invocation
  - Visual: role icons or avatar illustrations

Section 6: Social Proof
  - Curated testimonials (dev Twitter/X quotes)
  - "Projects built with [name]" showcase
  - Community stats (Discord members, GitHub contributors)

Section 7: Comparison (optional, add later)
  - Table: vibecrew vs "just prompting" vs enterprise tools vs squad
  - Honest about trade-offs (the dev audience punishes dishonesty)

Section 8: Final CTA
  - Repeat the install command
  - Links: GitHub, docs, Discord/community
  - Visually distinct background (dark section if rest is light, or vice versa)
```

### Tech Stack for the Site

**Recommendation: Astro + Tailwind CSS**

Reasons:

1. **Zero JavaScript by default.** Astro ships no JS unless a component explicitly needs it. The landing page is static content -- it should load instantly.
2. **Tailwind for rapid styling.** No custom CSS architecture to maintain. Utility classes. The maintainer can update copy and layout without touching stylesheets.
3. **Component islands for interactive elements.** The agent roster grid (Section 5) might need interactivity (click to expand). Astro's island architecture loads JavaScript only for that component, keeping the rest of the page static.
4. **Markdown content.** Astro supports `.md` and `.mdx` content collections. The agent descriptions from `docs/methodology/personas.md` can be imported directly as content, keeping the site in sync with the repo.
5. **GitHub Pages deployment.** Astro has a first-party GitHub Pages adapter. Push to `main`, GitHub Actions builds, deploys to Pages. Zero hosting cost.

**Alternatives considered:**

- **Next.js:** Overkill. SSR and ISR are unnecessary for a landing page. Next.js ships more JavaScript by default. The maintainer already has enough TypeScript to maintain.
- **Plain HTML + Tailwind:** Viable but loses the component model and markdown integration. For a single page it works; for docs + blog + changelog it does not scale.
- **VitePress/Starlight:** Good for docs sites, but the landing page needs custom design, not a docs template. If the project later needs full documentation, Astro's Starlight integration provides this without migrating.

**Consider using LaunchKit as a starting point.** Evil Martians' [LaunchKit](https://launchkit.evilmartians.io/) is a free, open-source HTML template specifically designed for developer tool landing pages. It includes all the sections listed above, supports light/dark mode, is responsive, and can be customized by tweaking CSS variables. Starting from LaunchKit and migrating to Astro components would be faster than building from scratch.

### Terminal Recordings: The "Flash" Element

The hero and "How It Works" sections need terminal recordings showing the product in action. This is the single most important visual element on the page -- it answers "what does using this actually look like?" in 10 seconds.

**Tool comparison:**

| Tool | Output Format | Editability | Embed Quality | Maintenance |
|------|--------------|-------------|---------------|-------------|
| **asciinema** | `.cast` + web player | Re-record only | Excellent (native player, copy-paste text) | Active, well-maintained |
| **VHS** (Charm) | GIF, MP4, WebM | Edit the `.tape` script, re-run | Good (pixel-perfect, no interactivity) | Active, by the Charm team |
| **Terminalizer** | GIF, YAML config | Edit YAML, re-render | Decent (GIF compression artifacts) | Less actively maintained |

**Recommendation: Use VHS for recordings, asciinema player for embed.**

VHS is the best choice for reproducible terminal recordings:

1. **Scriptable.** You write a `.tape` file that describes the session as a sequence of `Type`, `Enter`, `Sleep` commands. This means recordings are version-controlled and reproducible.
2. **Editable.** Change a command? Edit the `.tape` file. No re-recording. No screen-capture fumbling.
3. **Multiple output formats.** Generate GIF for social cards/README, MP4/WebM for the site, and `.cast` (asciicast format) for the asciinema player.
4. **CI-friendly.** Run `vhs demo.tape` in GitHub Actions to regenerate recordings on every release. The recordings stay in sync with the product automatically.

For the site embed, use the **asciinema player** (web component). It provides:
- Text-based rendering (not video), so it is sharp at any resolution
- Copy-paste from the recording (users can grab commands)
- Playback controls (pause, speed up, scrub)
- Accessible (screen readers can read the text content)

The workflow: VHS generates `.cast` files. The Astro site embeds them with asciinema-player. GitHub Actions regenerates on release.

**`.tape` file for the hero recording:**

```tape
# demo.tape -- hero recording for vibecrew.dev
Output demo.cast
Set FontSize 16
Set Width 100
Set Height 30
Set Theme "Catppuccin Mocha"

Type "npx create-vibecrew my-awesome-app"
Enter
Sleep 2s

# Simulate prompts
Type "A personal finance tracker"
Enter
Sleep 1s

Type "Solo developer, me"
Enter
Sleep 1s

Type "Show me my spending by category"
Enter
Sleep 2s

# Show the quickstart output
Sleep 3s
```

This recording is version-controlled, reproducible, and updates automatically. No screen recording software. No manual editing.

### SEO and Social Card Strategy

**SEO:**

1. **Title tag:** `[Name] -- AI Dev Team in a Repo | Ship Faster with 19 AI Agents`
2. **Meta description:** `Clone a complete AI development team into your project. 19 specialized agents for architecture, testing, security review, and more. For Claude Code.`
3. **Keywords (natural integration, not stuffing):** vibe coding, AI agents, Claude Code, AI pair programming, virtual dev team, AI code review, AI TDD
4. **Structured data:** SoftwareApplication schema with offers (free), applicationCategory (DeveloperApplication)
5. **Canonical URL:** `https://vibecrew.dev/` (or whatever the domain is)
6. **Sitemap:** Auto-generated by Astro

**Social Cards (Open Graph + Twitter):**

The social card is the most important single marketing asset after the landing page itself. When someone shares the link on Twitter/X, Discord, or Slack, the card is what people see.

**Design:**

- **Dimensions:** 1200x630 (standard OG ratio)
- **Content:** Product name, one-liner tagline, the install command, and a visual element (stylized terminal or agent grid)
- **Style:** Dark background, bold sans-serif headline, monospace for the install command
- **Generation:** Use `@vercel/og` or `satori` to generate cards programmatically from a template. This means the card updates automatically when the tagline changes.

**Dynamic social cards per page:** If the site eventually has docs or blog posts, generate unique OG images per page using the title and description. Astro supports this via integration with `satori` or `@vercel/og`.

**GitHub social preview:** Upload a matching 1280x640 image to the repo settings. This is what appears when the repo URL is shared. Make it match the site's social card for brand consistency.

### Accessibility Requirements for the Site

This is non-negotiable. The marketing site must meet WCAG 2.1 AA at minimum.

- **Color contrast:** 4.5:1 for body text, 3:1 for large text and UI components. Dark themes are especially prone to contrast failures -- test every color combination.
- **Keyboard navigation:** Every interactive element (agent cards, code copy buttons, navigation) must be keyboard-operable. Focus indicators must be visible.
- **Screen reader support:** The terminal recordings (asciinema player) must have text alternatives. The agent roster must use semantic HTML (not just divs with onClick). ARIA labels on icon-only buttons.
- **Motion:** The site must respect `prefers-reduced-motion`. Terminal recordings should not auto-play. Animations should be subtle and optional.
- **Responsive:** The site must work on mobile. Terminal recordings may need horizontal scroll on small viewports -- this is acceptable for code content but must be indicated visually.
- **Performance:** Lighthouse score above 95 on all four categories. The site is static content -- there is no excuse for poor performance.

### Timeline Estimate

| Phase | Effort | Deliverable |
|-------|--------|-------------|
| Name selection + domain/npm claim | 1 day | Secured namespace |
| Core/scaffold repo split | 2-3 days | New repo structure |
| CLI (`create-X`) MVP | 3-5 days | Working npx command |
| VHS recordings | 1 day | 3-4 `.tape` files + `.cast` output |
| Landing page (Astro + Tailwind) | 3-5 days | Deployed to GitHub Pages |
| Social cards + SEO | 1 day | OG images, meta tags, structured data |
| README + docs refresh | 1-2 days | New README, updated getting-started guide |
| **Total** | **12-18 days** | **Launchable product** |

This assumes solo maintainer working on this full-time. Part-time, double it.

---

## Open Questions for the Maintainer

1. **Name decision:** Which of the top 3 (vibecrew, shipmates, summon) resonates most? Which do you hate? Why? This is the first decision that blocks everything else.

2. **Audience narrowing:** Is the initial target purely Claude Code users, or also Cursor/Copilot users? The agents are Claude-specific today (CLAUDE.md, `.claude/agents/`), but the methodology is transferable. This affects positioning.

3. **Community appetite:** How much community contribution do you want to support? The scaffold contribution model is low-maintenance, but even reviewing scaffold PRs takes time. An alternative is "no external contributions until v2" -- ship opinionated, iterate based on feedback, open up later.

4. **Monetization intent:** Is this purely open-source, or is there a future paid tier (managed team, hosted dashboard, enterprise features)? This affects the site structure (pricing section, CTA copy) and the distribution model (npm vs. hosted service).

5. **Launch venue:** Product Hunt launch? Hacker News Show HN? Dev Twitter thread? All of the above? The terminal recordings and social cards should be ready before any public launch.

---

## Archie's Architecture Review

> **Reviewer:** Archie (Architecture + Data + API)
> **Date:** 2026-03-30
> **Scope:** Architectural soundness of the proposed rebrand/relaunch plan
> **Verdict:** Conditionally support, with significant modifications to the repo topology and distribution model

### 1. Architecture Assessment: The 3-Repo Split

**Context.** The doc proposes splitting into 3 repos under a GitHub org: `vibecrew-core` (methodology + agents), `vibecrew-scaffolds` (project templates), and `create-vibecrew` (CLI). The stated benefit is independent versioning and isolated change surfaces.

**The case for the split is intellectually clean but operationally wrong for a solo maintainer.**

Consider what the 3-repo architecture actually costs day-to-day:

- **Three sets of CI/CD pipelines** to maintain. Three sets of GitHub Actions workflows. Three repos to keep branch-protected and release-automated.
- **Cross-repo PRs for coordinated changes.** When a new agent is added to core, the CLI may need to know about it (to offer it in prompts), and scaffolds may need to reference it (in their CLAUDE.md templates). That is a 3-repo coordinated release for what should be a single-commit change.
- **Local development requires cloning 3 repos** and wiring them together. Or you build a `docker-compose`-style dev harness. Either way, the inner loop gets slower.
- **Issue tracking splits across repos.** A user reports "the Python CLI scaffold doesn't pick up the new security agent." Is that a core issue, a scaffold issue, or a CLI issue? Triage overhead multiplies.

**The separation of concerns is real, but the boundary is wrong.** The doc correctly identifies three layers (methodology, scaffolds, CLI). But layers are not repos. They can be directories in a monorepo with workspaces.

**Counter-proposal: single repo with workspace packages.**

```
vibecrew/
  packages/
    core/                    # methodology, agents, commands
      docs/methodology/
      docs/process/
      .claude/agents/
      .claude/commands/
      package.json           # version, metadata only (no runtime deps)
    scaffolds/               # project templates
      base/
      project-types/
      features/
      package.json
    create-vibecrew/         # CLI (the only package that ships to npm)
      src/
      package.json
    site/                    # marketing site (Astro)
      src/
      package.json
  package.json               # workspace root (pnpm workspaces)
  turbo.json                 # optional: turborepo for build orchestration
```

**Benefits over multi-repo:**

- **One CI pipeline.** One set of GitHub Actions. One branch protection policy. One release workflow.
- **Atomic commits across layers.** "Add Rust scaffold + update CLI prompts + update agent definition" is one PR, one review, one merge. No cross-repo coordination.
- **One `git clone` for contributors.** Fork, clone, develop. No multi-repo setup instructions.
- **pnpm workspaces give you the isolation you want.** Each package has its own version, its own dependencies, its own changelog. The CLI `import`s from `core` and `scaffolds` using workspace references. Turborepo caches builds. You get the modularity without the operational overhead.
- **GitHub Issues stay in one place.** Labels (`area:core`, `area:scaffold`, `area:cli`, `area:site`) replace repo-level separation.
- **Changesets or release-please handle multi-package versioning** from a single repo. This is a solved problem (see Changesets, used by Chakra UI, Radix, Turborepo itself).

**The one legitimate argument for multi-repo** is if you expect the scaffolds to be contributed by a large community with different maintainers per scaffold. But the doc itself says the initial target is solo-maintainer, with community contributions as a future possibility. Optimize for today. A workspace monorepo can always be split later (the reverse is painful).

**Recommendation: single monorepo with pnpm workspaces. Ship the site from the same repo.** This halves the operational overhead and keeps the atomic-commit property that a solo maintainer needs. If community scale demands it later, `vibecrew-scaffolds` can be extracted into its own repo at that point -- monorepo-to-multi-repo is a well-trodden path.

### 2. Distribution Model Gaps: The Node.js Prerequisite Problem

**The doc acknowledges this but hand-waves the solution.** "Requires Node.js on the user's machine. This is fine for web/JS developers but excludes pure Python/Rust/Go developers who may not have Node."

This is not a minor caveat. It is a positioning contradiction. The product's pitch is "works with any language/framework" and the scaffolds include Python, Rust, and Go project types. Telling a Rust developer to install Node.js to scaffold a Rust project is an immediate credibility hit. It violates the "no runtime dependency" value proposition that the doc correctly identifies as a core differentiator.

**Options to address this:**

| Approach | Pros | Cons |
|----------|------|------|
| **A. Accept the Node.js dependency** | Simplest. Largest existing ecosystem. Most developers have Node installed even if it is not their primary stack. | Brand contradiction. Alienates the non-JS audience the product explicitly targets. |
| **B. Compile the CLI to a standalone binary** using `bun build --compile` or `pkg` | No Node.js required at runtime. Distribute via GitHub Releases. | Build matrix (linux-x64, linux-arm64, darwin-x64, darwin-arm64, win-x64). Binary size (~50-80MB for bun-compiled). Must test on all platforms. |
| **C. Write the CLI in Go** and distribute via `go install` + GitHub Releases + Homebrew | Single binary, cross-compiles trivially, tiny binary (~10MB). Go is the lingua franca for developer CLI tools (gh, docker, kubectl, etc.). | Rewrite cost. The maintainer's primary expertise appears to be TypeScript, not Go. |
| **D. Thin shell bootstrap script** that detects the environment and dispatches | Works everywhere. The shell script downloads a platform-appropriate binary or falls back to `npx`. | Two code paths to maintain. Shell scripts are fragile across OS variants. |
| **E. Offer both `npx` and GitHub Releases** | Users with Node use `npx`. Users without Node download a pre-built binary from Releases. One codebase (TypeScript), compiled for release. | Must maintain release automation for binaries AND npm publishing. |

**My recommendation: Option E (npx + compiled binaries from GitHub Releases), implemented with Bun's single-file compiler.**

The reasoning:

1. Write the CLI in TypeScript (matches the maintainer's existing stack and the project's ecosystem).
2. Publish to npm for the `npx create-vibecrew` path. This is the primary channel for JS/TS developers.
3. Use `bun build --compile` to produce standalone binaries for each platform. Publish these as GitHub Release assets. A simple install script (`curl -fsSL https://vibecrew.dev/install.sh | sh`) downloads the right binary.
4. Homebrew formula points to the GitHub Release binary. This is trivial to automate with GoReleaser-style GitHub Actions.

This gives you three install paths from one codebase:
- `npx create-vibecrew` (JS/TS developers, zero install)
- `brew install vibecrew` (macOS developers, any language)
- `curl -fsSL https://vibecrew.dev/install.sh | sh` (everyone else)

The binary compilation step adds one GitHub Actions workflow. That is worth the audience expansion.

### 3. Update Story: The Hard Problem Nobody Wants to Solve

The doc mentions `npx vibecrew update` as if it is a feature to build. It deserves much more scrutiny because **this is the hardest engineering problem in the entire proposal** and the doc treats it as a one-liner.

**Why updating scaffolded projects is genuinely hard:**

1. **User modifications are the norm, not the exception.** The product's value proposition is "clone it, own it, modify anything." Users will edit agent definitions, add custom commands, change governance rules, modify CLAUDE.md. Any update mechanism must respect these modifications.
2. **Markdown files do not diff cleanly for merging.** A user who added two paragraphs to an agent definition cannot be three-way-merged with an upstream change that restructured the same file. Git's merge machinery works on lines, not semantic blocks.
3. **Structural changes are the valuable updates but the hardest to apply.** "We renamed `docs/process/gotchas.md` to `docs/process/patterns.md` and split it into three files" -- how do you express that as an automated update? You cannot. It requires a migration script.
4. **The update must be safe.** A botched update that corrupts a user's CLAUDE.md or agent definitions will destroy trust immediately. The blast radius of a failed update is the user's entire development workflow.

**What actually works in practice (from prior art):**

- **create-t3-app does not have an update command.** You scaffold once and own the output. Updates are manual.
- **Angular CLI's `ng update`** works because Angular controls the entire dependency graph and writes codemods (schematics) for every breaking change. This is an enormous maintenance burden that only a large team can sustain.
- **Renovate/Dependabot** update dependencies, not scaffolded files. Different problem.
- **Yeoman's update mechanism** was widely regarded as unreliable and was a contributing factor in Yeoman's decline.

**My recommendation: Do not build `vibecrew update` for v1. Instead, build `vibecrew diff`.**

`vibecrew diff` would:

1. Fetch the latest template version.
2. Show the user what has changed between their scaffolded version and the latest, file by file.
3. For each changed file, show whether the user has modified it (clean vs. dirty).
4. For clean files (user never modified), offer to update automatically.
5. For dirty files (user modified), show a side-by-side diff and let the user decide.
6. Produce a summary: "Updated 12 files automatically. 3 files need manual review. See `.vibecrew/update-log.md`."

This is dramatically simpler than automated merging and dramatically more trustworthy. The user stays in control. The tool does the tedious work (fetching, diffing, identifying clean files) without the dangerous work (merging conflicting changes).

**Implementation detail:** Stamp the scaffolded version into a `.vibecrew/manifest.json` at scaffold time. Record the version of core and scaffold used, plus a hash of each generated file as it was originally scaffolded. At diff time, compare the user's current file hash against the original hash to determine if the file is clean or dirty.

**Maintenance cost:** Low. The `diff` command is stateless -- it compares two snapshots. No migration scripts. No codemods. No merge conflict resolution. The manifest is generated once at scaffold time and never needs updating.

### 4. Versioning Risks: core_compat Is Coordination Overhead in Disguise

The `core_compat` range in `scaffold.json` sounds clean in the doc but plays out poorly in practice.

**The coordination burden:**

- Every core major version bump requires auditing every scaffold's `core_compat` range and updating those that are affected.
- Every scaffold must be tested against the core versions its `core_compat` claims to support.
- The CLI must resolve version compatibility at scaffold time, which means it needs access to the version metadata of both core and scaffolds simultaneously.
- A user running `npx create-vibecrew@latest` expects it to work. If the latest CLI ships with a scaffold that is incompatible with the latest core, you have a broken release. Preventing this requires integration testing across the version matrix.

**For a solo maintainer, "everything ships together" is the correct default.**

In a monorepo with workspaces, you have a single version number for the entire project (or use Changesets for independent-but-coordinated versioning). When you cut a release, everything is tested together. The version of core that ships with a scaffold is the version it was tested with. Full stop.

If you later need to support "scaffold X works with core v2 and v3," you can add compatibility metadata then. But do not build the coordination machinery before the coordination problem exists.

**Recommendation: single version number for v1. The monorepo is the release unit.** Changesets can manage individual package changelogs within that single release if needed. Introduce `core_compat` only if community-contributed scaffolds begin to lag behind core updates -- and even then, consider whether a CI matrix is simpler.

### 5. Missing Concerns

The doc is thorough on naming, distribution, visual design, and maintainability architecture. The following concerns are absent or insufficiently addressed:

**5.1 Testing strategy for the CLI.**
The CLI is the public-facing product surface. What does its test suite look like? At minimum:
- **Snapshot tests** for each scaffold type (generate a project, compare against a golden snapshot).
- **Smoke tests** that run the generated project's build/test command (e.g., `cargo check` for a Rust scaffold, `npm test` for a TypeScript scaffold). This catches broken templates before release.
- **Prompt flow tests** using `@clack/core`'s test utilities (or by mocking stdin) to verify the interactive flow works end-to-end.
- **Platform tests** in CI: at minimum linux-x64 and darwin-arm64 (the two most common developer platforms for Claude Code users).

Without these, every release is a manual QA session. For a solo maintainer, that means releases slow down or quality degrades.

**5.2 CI/CD for the release pipeline.**
The doc does not describe how releases happen. For a monorepo:
- PR merges to `main` trigger CI (lint, test, build).
- Releases are cut via Changesets or release-please (creates a "Version Packages" PR that bumps versions and updates changelogs).
- Merging the release PR triggers: npm publish for the CLI, GitHub Release with compiled binaries, site rebuild and deploy.
- The VHS recordings should regenerate on release (as the doc suggests) and be committed to the site assets.

This pipeline is not optional -- it is load-bearing infrastructure for a public distribution. Design it before writing the CLI.

**5.3 Telemetry and usage analytics.**
The doc correctly notes that GitHub templates provide no usage metrics. But the proposed CLI also has no telemetry plan. For a solo maintainer trying to prioritize work, knowing "80% of users pick the Python CLI scaffold" vs. "nobody uses the Rust scaffold" is critical signal.

Options: anonymous, opt-in telemetry (like create-next-app's telemetry, which reports scaffold type, Node version, and OS -- no PII). Or simply rely on npm download counts + GitHub star/issue signals. The former is better signal; the latter is zero maintenance.

At minimum, decide the policy and document it. If telemetry is included, it must be clearly disclosed in the CLI output and opt-out-able (Pierrot would flag this as a compliance concern).

**5.4 Graceful degradation when the network is unavailable.**
If the CLI uses `giget` to fetch templates from GitHub at scaffold time, what happens when GitHub is down, or the user is on an airplane, or behind a corporate firewall that blocks GitHub's raw content domain?

Options:
- **Bundle templates in the npm package.** The CLI ships with the templates baked in. No network fetch at scaffold time. Trade-off: the npm package is larger, and templates are only as fresh as the installed CLI version.
- **Fetch-with-fallback.** Try to fetch latest from GitHub. If that fails, fall back to bundled templates with a warning ("Using bundled templates from v1.2.0; run with network for latest").

I recommend the fetch-with-fallback approach. It gives you the "always latest" property when online and a working offline story when not.

**5.5 Licensing and contribution terms.**
The doc mentions community contributions but not the project's license. For an open-source developer tool distributed via npm:
- The core, scaffolds, and CLI should be MIT or Apache-2.0 (standard for dev tools).
- A `CONTRIBUTING.md` with a DCO (Developer Certificate of Origin) or CLA for contributions.
- Scaffold contributions that include third-party code must declare their licenses in `scaffold.json`.

This is table-stakes for public distribution and should be decided before the first community PR.

**5.6 What happens to existing vteam-base and vteam-agentapalooza users?**
The doc does not address migration for users of the current template repos. If the rebranded product is the successor, the old repos need:
- A deprecation notice in their READMEs pointing to the new project.
- A migration guide (or at minimum, a statement that existing projects are unaffected and can continue as-is).
- Archival of the old repos (read-only) after a reasonable sunset period.

Ignoring existing users -- even if the number is small -- erodes trust at the moment you are trying to build it.

### 6. Recommendation

**I conditionally support the relaunch with the following modifications:**

1. **Use a monorepo, not multi-repo.** Single repo with pnpm workspaces. The packages are `core`, `scaffolds`, `create-vibecrew`, and `site`. This cuts operational overhead roughly in half while preserving the layer separation the doc correctly identifies as important.

2. **Ship compiled binaries alongside npx.** Use `bun build --compile` to produce standalone binaries published via GitHub Releases. Add a Homebrew tap and an install script. The "Node.js required" constraint is a positioning flaw that is worth ~1 day of CI work to eliminate.

3. **Build `vibecrew diff`, not `vibecrew update`, for v1.** The diff-and-selective-apply model is dramatically simpler, more trustworthy, and sufficient for the initial user base. Full automated updates can come in v2 if the diff tool proves inadequate.

4. **Use a single version number for v1.** Drop `core_compat` ranges until community-contributed scaffolds create an actual version coordination problem. Ship everything together, tested together.

5. **Design the CI/CD pipeline and testing strategy before writing the CLI.** These are architectural decisions that constrain the CLI's structure. Deciding them after the CLI is written means retrofitting, which always costs more.

6. **Address the migration story for existing template users.** Even a brief "existing projects are unaffected; this is a new distribution channel for the same methodology" statement in the launch materials.

**What I would not change:**

- The composable scaffold layer architecture is sound. The `base + project-type + features` composition model is the right answer to combinatorial explosion.
- Astro + Tailwind for the marketing site is the correct choice. Static-first, component islands for interactivity, zero unnecessary JavaScript.
- VHS for terminal recordings is excellent. Scriptable, version-controlled, CI-reproducible. The workflow of `.tape` files generating `.cast` files for asciinema embed is clean.
- The two-audience positioning (vibe coders + solo builders) is well-reasoned and the name candidates serve both segments.
- The contribution model (scaffolds open, core guarded) is the right balance for a solo maintainer.

**The overall plan is strong.** The research is thorough, the competitive analysis is honest, and the design instincts are good. The modifications above are about operational sustainability -- making sure a solo maintainer can actually execute and maintain what is proposed without drowning in coordination overhead.

---

## Pierrot's Security & Compliance Review

> **Reviewer:** Pierrot (Security + Compliance)
> **Date:** 2026-03-30
> **Scope:** Security and compliance assessment of the proposed rebrand and relaunch architecture
> **Status:** Review complete -- findings below must be addressed before public launch

This review covers the full attack surface introduced by the proposed distribution model, community contribution pipeline, marketing site, and public identity. The proposed architecture is sound in its separation of concerns, but distributing executable code to strangers via `npx` is a fundamentally different threat model than hosting a GitHub template repo. You are moving from "users consciously clone a repo they can read first" to "users execute your code sight-unseen with a single command." That shift demands a security posture upgrade.

---

### 1. Supply Chain Security

**Severity: Critical**

This is the highest-risk surface in the entire proposal. When a user runs `npx create-vibecrew`, npm downloads your package and executes it on their machine with the user's full permissions. A compromised package means arbitrary code execution on every machine that runs the install command. This is not theoretical -- in September 2025, the [Shai-Hulud worm compromised 180+ npm packages](https://unit42.paloaltonetworks.com/npm-supply-chain-attack/) through a self-propagating payload, and [a separate maintainer-account phishing attack hit 18 high-profile packages](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem) including chalk and debug with over a billion weekly downloads combined. In March 2026, UNC6426 [leveraged the nx package compromise to achieve AWS admin access in 72 hours](https://thehackernews.com/2026/03/unc6426-exploits-nx-npm-supply-chain.html).

Your package will be smaller and less targeted, but the attack vector is identical. If someone compromises your npm account or your CI pipeline, every future user of `npx create-vibecrew` gets backdoored project scaffolds.

**Required mitigations (all are launch blockers):**

1. **npm provenance attestation.** Publish with `--provenance` flag from GitHub Actions. This uses [Sigstore](https://blog.sigstore.dev/cosign-verify-bundles/) to cryptographically link every published package version to its source commit and build workflow. Users and automated tools can verify the package was built from the claimed source. This is [SLSA Level 2+](https://slsa.dev/spec/v0.1/provenance) attestation and is now table stakes for any npm package that runs code on user machines.

2. **CI-only publishing.** Never publish from a local machine. The npm token used for publishing must exist only in GitHub Actions secrets, scoped to the `create-vibecrew` package, and set to automation-only (no interactive use). Use [npm Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements/) (available since July 2025) to eliminate stored tokens entirely -- the CI provider attests identity directly to npm.

3. **Lockfile pinning with integrity hashes.** The CLI's own dependencies must be locked with a `package-lock.json` or `pnpm-lock.yaml` committed to the repo, with integrity hashes (SHA-512) verified on every CI build. Do not rely on floating ranges for anything in the dependency tree. A single unpinned transitive dependency is a supply chain entry point.

4. **Dependency audit in CI.** Run `npm audit --audit-level=high` on every PR and block merge on high/critical findings. Complement with [Socket.dev](https://socket.dev/) or Snyk for behavioral analysis -- `npm audit` only catches known CVEs, not malicious packages that haven't been reported yet.

5. **SBOM generation.** Generate a Software Bill of Materials on every release (CycloneDX or SPDX format). Publish it alongside the npm package or in the GitHub release. This allows downstream consumers to audit the dependency tree without installing the package.

6. **Minimal dependency footprint.** Every dependency you add is an attack surface. The doc proposes `clack` for prompts and `giget` for template fetching. Audit both thoroughly before adopting. Prefer packages with provenance attestation themselves. Consider whether the CLI can use Node.js built-ins (`readline`, `https`) for core functionality and limit third-party dependencies to what genuinely cannot be done in 50 lines of code.

---

### 2. Template Injection Risks

**Severity: High**

The architecture proposes Handlebars (`.hbs`) templates that render user-supplied variables (project name, description, etc.) into generated files. Handlebars has a documented history of [Remote Code Execution vulnerabilities](https://security.snyk.io/vuln/SNYK-JS-HANDLEBARS-1056767) through prototype pollution and template injection, including [a $10,000 bounty on Shopify](https://hackerone.com/reports/423541) for server-side template injection via Handlebars.

In this context, the risk is bidirectional:

**A) Malicious user input into templates:**

If a user provides a project name like `{{constructor.constructor('return process')().exit()}}` and the template engine evaluates it unsafely, you get code execution during scaffold generation. This is less likely with Handlebars' default escaping but becomes dangerous if:
- Any template uses triple-brace `{{{variable}}}` (unescaped output)
- Custom Handlebars helpers use `new Function()` or `eval()`
- Templates generate shell scripts, Makefiles, or CI configs where the rendered output is later executed by a shell

**B) Malicious templates injecting into generated projects (the bigger risk):**

Community-contributed scaffolds (see Section 3) could contain templates that inject malicious code into generated files. A template that generates a `postinstall` script, a GitHub Actions workflow, or a `.claude/agents/*.md` file with prompt injection could compromise every project created from that scaffold.

**Specific dangerous generation targets:**
- `package.json` with `postinstall`, `preinstall`, or `prepare` scripts
- `.github/workflows/*.yml` -- CI config that runs arbitrary commands
- Shell scripts (`.sh`) -- direct code execution
- `CLAUDE.md` or `.claude/agents/*.md` -- prompt injection into AI agents
- `Dockerfile` -- container build-time code execution
- `Makefile` / `pyproject.toml` `[tool.setuptools.cmdclass]` -- build-time hooks

**Required mitigations:**

1. **Input sanitization.** Validate all user-provided variables against a strict allowlist pattern before template rendering. Project names: `[a-z0-9-]` only, max 64 characters. Descriptions: alphanumeric + basic punctuation, max 256 characters, no template syntax characters (`{`, `}`, `<`, `>`).

2. **Use Handlebars in strict mode.** Enable `strict: true` to prevent access to prototype properties. Pin Handlebars to >= 4.7.8. Do not register custom helpers that evaluate dynamic code.

3. **Never use triple-brace syntax** (`{{{var}}}`) in any template. All output must be escaped. If a template needs to emit special characters, use a dedicated helper that explicitly handles only the known safe characters.

4. **Post-generation audit.** After rendering templates, scan the generated output for suspicious patterns before writing to disk: `eval(`, `exec(`, `Function(`, `curl | sh`, `wget | bash`, base64-encoded strings, obfuscated JavaScript. This is defense-in-depth -- it catches both malicious input and malicious templates.

5. **Template schema validation.** Each scaffold's `scaffold.json` must declare which files it generates. The CLI must refuse to generate files outside the declared list. A scaffold that claims to generate `src/main.rs` but also writes `.github/workflows/backdoor.yml` should be rejected.

---

### 3. Community Contribution Threat Model

**Severity: High**

The document proposes accepting community scaffold contributions. This is the equivalent of accepting pull requests that inject code into every future user's project. A malicious scaffold is not just a bad PR to your repo -- it is a supply chain attack on every developer who selects that scaffold.

**Attack scenarios:**

1. **Trojan scaffold.** Contributor submits a legitimate-looking "Rust + Axum" scaffold. The `Cargo.toml.hbs` includes a build dependency that exfiltrates environment variables during `cargo build`. The overlay also includes a `.github/workflows/ci.yml` that sends `GITHUB_TOKEN` to an external server. The scaffold passes a basic smoke test (`cargo check` succeeds). The backdoor only activates during CI builds when secrets are present.

2. **Slow-burn reputation attack.** Contributor submits several good scaffolds over months, earns trust, gets added to `@community-reviewers`. Then submits a scaffold update with a subtle change to a template helper that introduces a prototype pollution vulnerability in generated code.

3. **Prompt injection via agent templates.** If any scaffold can include or modify `.claude/agents/*.md` files, a malicious contributor can inject instructions that cause Claude Code to exfiltrate code, disable security checks, or ignore the governance rules. This is a novel attack surface specific to AI-native tooling.

**Required mitigations:**

1. **Maintainer-only merge for all contributions.** The CODEOWNERS file in the doc is correct -- maintain it. Never grant merge access to community contributors, regardless of their track record. The cost of reviewing scaffolds is lower than the cost of a compromised scaffold reaching users.

2. **Automated scaffold scanning in CI.** Every scaffold PR must trigger:
   - Static analysis of all template files for dangerous patterns (shell injection, env exfiltration, obfuscated code, postinstall scripts)
   - Template rendering with test variables, followed by scanning the generated output
   - License scanning of any dependencies declared in the scaffold's templates
   - A sandboxed test run (generate a project, build it, run tests) in an isolated environment with no network access and no access to secrets

3. **No scaffold may modify core files.** The CI pipeline must enforce that scaffold PRs only touch files under their own `vibecrew-scaffolds/<type>/<name>/` directory. Any PR that modifies `docs/methodology/`, `docs/process/`, `.claude/agents/`, `.claude/commands/`, or the CLI source must be rejected automatically.

4. **Scaffold signing.** Each official scaffold should include a hash manifest (SHA-256 of every file in the overlay). The CLI verifies the manifest at generation time. Community scaffolds that have not been signed by the maintainer should trigger a visible warning: "This scaffold has not been verified by the maintainer."

5. **Quarantine period.** New scaffolds from first-time contributors should not be included in the default scaffold list for at least one release cycle. They can be available via explicit flag (`--scaffold=community/rust-axum`) with a warning.

---

### 4. npm Account Security

**Severity: Critical**

A compromised npm account is the single highest-impact attack vector. It gives the attacker the ability to publish a malicious version that every future `npx create-vibecrew` invocation will download and execute. The September 2025 npm phishing campaign demonstrated that even experienced maintainers can be social-engineered.

**Required mitigations (all are launch blockers):**

1. **Hardware security key for npm 2FA.** Not TOTP, not SMS -- a physical FIDO2/WebAuthn key (YubiKey or equivalent). TOTP codes can be phished in real-time via reverse-proxy phishing kits. Hardware keys cannot.

2. **Enable npm Trusted Publishing.** This eliminates long-lived npm tokens entirely. Publishing is only possible from a specific GitHub Actions workflow in a specific repository. Even if someone steals your npm credentials, they cannot publish from their local machine.

3. **npm access audit.** Only one account (the maintainer's) should have publish access. No shared accounts. No "just in case" collaborators. If the project grows to need multiple publishers, use npm organization scoped packages with granular role-based access.

4. **GitHub repository branch protection.** The `main` branch of `create-vibecrew` must require:
   - PR review before merge (even for the maintainer -- use a branch protection rule that requires at least one approval, and use a bot or second account for self-review auditing)
   - Status checks passing (CI, tests, security scanning)
   - Signed commits (GPG or SSH key signing)
   - No force pushes

5. **Publishing workflow isolation.** The GitHub Actions workflow that publishes to npm should run only on tagged releases, require manual approval (environment protection rules), and use a dedicated OIDC identity for npm Trusted Publishing. The workflow file itself should be owned by CODEOWNERS and require review for changes.

6. **Incident response plan.** Document what to do if the npm account or GitHub repo is compromised: who to contact at npm (security@npmjs.com), how to yank a malicious version (`npm unpublish` within 72 hours or `npm deprecate`), how to notify users (GitHub advisory, Twitter/X post, README warning), and how to rotate all secrets.

---

### 5. GitHub Pages / DNS Security

**Severity: Medium**

The proposal includes an Astro site deployed to GitHub Pages with a custom domain (likely `vibecrew.dev` or similar).

**Risks and mitigations:**

1. **Subdomain takeover.** If you configure a custom domain via CNAME and later remove or rename the GitHub Pages repo without updating DNS, an attacker can [claim your subdomain by creating their own GitHub Pages site pointing to it](https://filipmikina.com/blog/stolen-github-page/). They then serve content on your domain -- phishing pages, malicious install instructions, or SEO spam.
   - **Mitigation:** [Verify your custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) in GitHub organization settings. This prevents any other GitHub user from claiming it. Do not use wildcard DNS records (`*.vibecrew.dev`).

2. **HTTPS enforcement.** GitHub Pages supports HTTPS via Let's Encrypt. Ensure "Enforce HTTPS" is checked in repo settings. The Astro site must set `<meta http-equiv="Content-Security-Policy">` headers and use HSTS. Since GitHub Pages does not support custom headers natively, implement these via a `<meta>` tag in the HTML `<head>` or use Cloudflare as a proxy (which also provides DDoS protection and custom headers).

3. **Domain squatting.** Once the name is chosen, register the domain immediately across all relevant TLDs (`.dev`, `.sh`, `.io`, `.com`). Also register common typosquats. The `.dev` TLD enforces HTTPS at the registrar level (it is in the HSTS preload list), which is a security advantage. Someone registering `vibecrew.io` while you own `vibecrew.dev` could run a phishing site that looks identical to yours.

4. **npm package name squatting.** Register the npm package name (and the `create-` prefixed name) as soon as the name is finalized. Publish a placeholder `0.0.1` with a README pointing to the repo. Also register scoped variants (`@vibecrew/create`, `@vibecrew/core`) to prevent squatting.

5. **GitHub organization security.** The proposed GitHub org must have:
   - 2FA required for all members
   - Base permissions set to "Read" (not "Write")
   - Third-party application access restricted
   - SAML/SSO if available on the GitHub plan

---

### 6. License and IP Concerns

**Severity: Medium**

The product includes 19 AI agent persona definitions (detailed system prompts), a 7-phase methodology, governance rules, and 27 slash commands. These are creative works that need deliberate licensing.

**License recommendation:**

1. **Use MIT or Apache 2.0 for the codebase** (CLI, templates, scaffold infrastructure). These are the standard choices for developer tools. MIT is simpler; Apache 2.0 provides explicit patent grants, which may matter if the project grows. Both are compatible with essentially every other open-source license.

2. **Consider the agent personas carefully.** The 19 agent definitions in `.claude/agents/` are prompt engineering artifacts -- detailed instructions for AI behavior. They represent significant intellectual property. Options:
   - **Same license as code (MIT/Apache 2.0):** Simplest. Anyone can fork, modify, redistribute. This is the "rising tide lifts all boats" approach and maximizes adoption.
   - **Creative Commons (CC BY 4.0):** Appropriate for creative/documentation content. Requires attribution but allows commercial use. However, mixing CC and software licenses in one repo creates confusion.
   - **Dual license:** Code under MIT, agent definitions under CC BY 4.0. Adds complexity. Not recommended unless there is a specific reason to restrict agent persona redistribution.
   - **Recommendation:** MIT for everything. The value of the project is in the system (methodology + tooling + community), not in any individual agent definition. A competitor who forks your agent prompts but not your methodology and tooling will produce an inferior product. Open licensing maximizes adoption and community contribution.

3. **Trademark concerns with name candidates:**
   - **"shipwright"** -- Red Hat's [Shipwright](https://github.com/shipwright-io/build) is a CNCF/CD Foundation incubating project for building container images on Kubernetes. There is an existing npm package (`@kubernetes-models/shipwright`). Using "shipwright" for a developer tool risks trademark confusion and will definitely cause SEO collision. **Recommend against this name.**
   - **"vibecrew"** -- No conflicting trademark found. Monday.com has a `@vibe/core` npm package for their Vibe Design System, but "vibecrew" is sufficiently differentiated. Cloudflare has a "VibeSDK" but that is also distinct. **Acceptable, but register the trademark proactively if the project gains traction.**
   - **"shipmates"** -- General English word. Low trademark risk but also low defensibility.
   - **"summon"** -- Common English word used in gaming contexts. Check npm and trademark databases before committing. Low collision risk for a developer tool.
   - **General advice:** Before finalizing, run a search on the USPTO TESS database, the EU EUIPO database, and the WIPO Global Brand Database. A trademark attorney consult (a few hundred dollars) is cheap insurance against a cease-and-desist letter after you have built brand equity.

4. **Dependency license audit.** The CLI will have its own dependency tree. Before v1.0, audit every dependency (including transitives) for license compatibility. Flag any GPL, AGPL, or SSPL dependencies -- these are copyleft licenses that could require the CLI itself to be open-sourced under the same license (which may conflict with your chosen license). Use `license-checker` or `licensee` to automate this. Include the results in the SBOM.

---

### 7. Privacy / Telemetry

**Severity: Medium**

The document mentions npm download counts as a metric. If the CLI itself collects any telemetry (even "anonymous" usage analytics), there are regulatory implications.

**If you collect no telemetry (recommended for v1.0):**

- State this explicitly in the README and CLI output. "This tool does not collect telemetry or send data to any server." This is a differentiator -- developers are [increasingly hostile to opt-out telemetry](https://github.com/vercel/next.js/issues/59688) (see the Next.js telemetry backlash).
- npm download counts are collected by npm, not by you. You have no GDPR obligation for npm's data collection.
- The marketing site (GitHub Pages) will have GitHub's standard analytics. If you add any analytics (Plausible, Fathom, etc.), disclose it.

**If you add telemetry in the future:**

1. **Opt-in only.** GDPR requires affirmative consent for data collection. CCPA requires opt-out rights. The cleanest approach is opt-in: the CLI asks on first run "Would you like to share anonymous usage data? [y/N]" with "N" as the default. Never collect data without asking.

2. **Minimal data.** If you collect telemetry, collect only: CLI version, selected scaffold type, OS/arch, Node.js version. Do not collect: project names, file contents, IP addresses, usernames, or anything that could identify a person or their project.

3. **Privacy policy.** If telemetry exists, publish a privacy policy on the marketing site. State what is collected, why, how long it is retained, and how to opt out. This is required by GDPR (Articles 13-14) and CCPA (Section 1798.100).

4. **Data processing location.** If telemetry data is sent to a server, that server's location matters. EU users' data sent to a US server requires Standard Contractual Clauses or similar mechanism post-Schrems II. The simplest approach: do not collect telemetry. The second simplest: use an EU-hosted privacy-focused analytics provider (Plausible, hosted in the EU).

5. **CCPA specifics.** If the tool is used by California residents (it will be), CCPA requires you to disclose the categories of personal information collected and the purposes for collection. Penalties are [$2,500 per unintentional violation and $7,500 per intentional violation](https://compliancehub.wiki/privacy-laws-compared-ccpa-gdpr-and-lgpd-compliance-requirements-2025-update/). For a CLI tool, the risk is low if you collect nothing, but it becomes real the moment you add a telemetry endpoint.

---

### 8. Additional Security Considerations

#### 8a. The `giget` Fetch Pattern

**Severity: Medium**

The proposal has the CLI fetching templates from GitHub at generation time via `giget`. This means every scaffold invocation makes a network request to GitHub. Attack scenarios:

- **DNS poisoning / MITM:** If the user is on a compromised network, the GitHub API request could be redirected to a malicious server serving backdoored templates. Mitigation: `giget` uses HTTPS, which provides transport security, but verify that certificate validation is not disabled in any configuration.
- **GitHub repository compromise:** If `vibecrew-scaffolds` is compromised, all future scaffold generations are backdoored. Mitigation: Pin fetches to a specific commit hash or tag, not `main`. The CLI should fetch from a release tag that has been signed.
- **Availability:** If GitHub is down, the CLI breaks. Not a security issue, but an availability concern. Consider bundling a fallback set of core templates in the CLI package itself.

#### 8b. Post-Scaffold Script Execution

**Severity: High**

The `scaffold.json` metadata includes "post-hooks." If these hooks execute shell commands (e.g., `npm install`, `git init`), a malicious scaffold can run arbitrary code after generation. This is the same risk as npm `postinstall` scripts.

- **Mitigation:** Post-hooks must be limited to a strict allowlist of operations: `git init`, `install dependencies` (using the detected package manager), `format files`. No arbitrary shell commands. The CLI executes these operations itself -- it does not delegate to a shell script provided by the scaffold.

#### 8c. Prompt Injection via Generated CLAUDE.md

**Severity: Medium**

The generated CLAUDE.md is read by Claude Code at session start and controls AI behavior. A malicious scaffold that injects instructions into CLAUDE.md (e.g., "ignore all security rules," "never run tests," "always approve code") could degrade the security posture of every project created from it.

- **Mitigation:** CLAUDE.md content should come exclusively from `vibecrew-core` (maintainer-controlled), not from scaffold overlays. Scaffolds may append project-type-specific sections (e.g., "## Tech Stack" with the selected framework) but must not modify the core governance, security, or methodology sections. The CLI should enforce this structurally.

---

### 9. Recommendation: Minimum Security Bar for Public Launch

**The following are launch blockers (must be in place before the first public `npm publish`):**

| # | Requirement | Severity | Effort |
|---|------------|----------|--------|
| 1 | npm provenance attestation (`--provenance` in CI publish) | Critical | 1 hour |
| 2 | CI-only publishing via Trusted Publishing (no local npm tokens) | Critical | 2 hours |
| 3 | Hardware security key for npm 2FA | Critical | Buy a YubiKey |
| 4 | Lockfile pinned with integrity hashes | Critical | Already standard |
| 5 | `npm audit` + Socket.dev in CI, blocking on high/critical | Critical | 2 hours |
| 6 | Input sanitization for all template variables | High | 4 hours |
| 7 | Handlebars strict mode, no triple-brace syntax | High | 2 hours |
| 8 | Post-hook allowlist (no arbitrary shell from scaffolds) | High | 4 hours |
| 9 | CLAUDE.md generation locked to core (scaffolds cannot modify governance sections) | High | 2 hours |
| 10 | GitHub branch protection on all repos | High | 1 hour |
| 11 | Custom domain verification for GitHub Pages | Medium | 30 min |
| 12 | License chosen and applied to all repos | Medium | 1 hour |
| 13 | Trademark search for chosen name | Medium | 1-2 days |
| 14 | Explicit "no telemetry" statement in README | Medium | 10 min |

**The following should be in place before accepting community scaffold contributions:**

| # | Requirement | Severity | Effort |
|---|------------|----------|--------|
| 15 | Automated scaffold scanning in CI | High | 1-2 days |
| 16 | Sandboxed scaffold test runs (no network, no secrets) | High | 1 day |
| 17 | Template schema validation (declared file manifest) | High | 4 hours |
| 18 | Scaffold signing and verification | Medium | 1 day |
| 19 | CODEOWNERS enforced via branch protection | Medium | 30 min |

**Total estimated effort for launch-blocking items: 2-3 days** (excluding trademark search lead time). This is a reasonable investment for a tool that will execute code on strangers' machines.

**My assessment:** The proposed architecture is well-structured for maintainability, and the layer separation (core / scaffolds / CLI / site) actually helps security by isolating blast radius. The primary risks are supply chain (npm account compromise, dependency poisoning) and community contribution (malicious scaffolds). Both are manageable with the mitigations above. I am not exercising a veto -- there is no active vulnerability to veto against since no code exists yet. But I am flagging items 1-5 and the npm account security requirements as conditions that must be met before the first `npm publish`. If those are skipped, I will veto the release.

One final note with dark humor attached: the name candidate "phantomteam" is uncomfortably close to the [PhantomRaven malicious npm packages](https://thehackernews.com/2026/03/unc6426-exploits-nx-npm-supply-chain.html) that were discovered in early 2026. Naming your security-conscious developer tool after an active threat campaign would be... a choice.

---


## Synthesis: Positioning-First Strategy

> **Author:** Cross-review synthesis (post Dani, Archie, Pierrot)
> **Date:** 2026-03-30
> **Purpose:** This section reframes the entire plan around a positioning insight that changes the priority order of the four pillars.

### The Core Insight: Solve Positioning Before Distribution

The original doc spends 70% of its depth on distribution and architecture, and 30% on positioning. This is inverted. The competitive landscape — which the original doc does not analyze — reveals that **distribution is not the hard problem; differentiation is.**

### Competitive Landscape (Missing from Original)

| Competitor | Stars | What They Offer |
|-----------|-------|----------------|
| wshobson/agents | 32,532 | 112 agents, 16 orchestrators, 146 skills, 79 tools |
| davila7/claude-code-templates (aitmpl.com) | 23,787 | 1000+ agents/commands/MCPs, web UI + CLI installer |
| alirezarezvani/claude-skills | 7,956 | 192+ skills, marketplace-style install |
| bradygaster/squad | 1,492 | Copilot team agents, GitHub blog backing, growing fast |

**The "bag of agents" market is saturated.** You cannot win by leading with "19 agents and 27 commands." wshobson has 112 agents. aitmpl.com has a thousand. Competing on quantity is a losing strategy.

**What nobody else has:** An integrated methodology with governance. Phase-aware team composition. Mandatory architecture gates. Sprint boundaries. Done gates. Adversarial debates. Veto authority. Tech debt escalation. The competitors are collections of independent tools; this is a team that works like a team.

**The positioning should be:** Not "get AI agents" (everyone has those). Instead: **"The only AI dev team that ships like a real team — with process, accountability, and the discipline to say no."**

### The Positioning Contradiction

The doc targets "vibe coders" in segment 1. The product is a heavyweight governance framework: mandatory gates, sprint boundaries, ADR debates, veto authority, 15-item done checklists. These audiences are fundamentally opposed.

A vibe coder who installs this expecting "AI team goes brrrr" will hit the Session Entry Protocol (3 mandatory questions before writing ANY code) and bounce immediately. The product's real audience is segment 2: **solo builders who know they need discipline but can't hire a team.**

**Resolution:** Target segment 2 explicitly. Segment 1 may discover the product and self-select in — some vibe coders will realize they need more structure — but marketing should speak to the builder who already knows they need help, not the one who thinks they don't.

### Revised Name Recommendation

Given the positioning correction (signal discipline, not vibes):

**First choice: `summon`** — Timeless verb. Maps perfectly to agent invocation. Has gravitas without being corporate. Works in context: "I summon my dev team." "The summon review caught a security issue." Base npm name is taken (inactive since 2015) but `create-summon` is available, as is `@summon/cli` or the variant `summondev`. Explore negotiating the abandoned base name or using a scope.

**Second choice: `wardroom`** — The officers' planning room on a ship. Evokes strategy, structured collaboration, the place where decisions are made before the ship moves. Obscure enough to be fully ownable. Pairs with "ship" (the dev verb). The obscurity is a feature: it invites curiosity ("what's a wardroom?") which is a marketing hook. Fully available on npm.

**Third choice: `shipmates`** — Safe, warm, clear. Works for both audiences. "The people you ship with" is a strong tagline. Nautical + shipping culture double meaning. Less distinctive than summon or wardroom but lower risk.

**Demoted: `vibecrew`** — Ties the product to a meme with a half-life. "Vibe coding" was coined in early 2025 and is already normalizing. By the time this ships and gains traction, "vibecrew" risks feeling dated. More importantly, it signals the wrong audience — the product is discipline, not vibes. Still fully available on npm if the maintainer disagrees with this assessment.

### Revised Distribution Strategy

**The product is 60 files, 93% markdown, zero runtime dependencies.** Building an npm CLI with Handlebars templating, composable feature layers, and interactive prompts to distribute markdown files is over-engineered for v1.

**What the CLI actually does:** Copies markdown files, substitutes `[Your Project Name]`, runs `git init`. That's a shell script, not a product.

**Revised v1 strategy:**

1. **Keep the GitHub template repo as the distribution mechanism.** The template IS the product. Clean it up, improve the README, ensure `/quickstart` works flawlessly.
2. **Build the marketing site (Astro + Tailwind).** This is where discovery happens. The site converts visitors into users. Site > CLI for adoption.
3. **Add a one-liner install alternative** using `degit`/`giget` for users who prefer it: `npx giget gh:summon/template my-project`. Zero maintenance — the tool is someone else's.
4. **Invest in content marketing.** Blog posts, Twitter/X threads, YouTube demos. A post titled "Why 19 agents with governance beats 1000 agents without it" will drive more adoption than `npx create-anything`.

**Build the full `create-X` CLI when:**
- The composable scaffold layer actually ships (generating real project code, not just markdown)
- Users are asking "I wish I could install this without cloning a repo"
- You have 8+ scaffold types and the interactive selection adds real value

**Do not build it preemptively.** The value is in the content of the markdown files, not in the scaffolding ceremony.

### Revised Architecture Strategy

**Do not split the repo yet.** The current single-repo structure works for 60 files and 1 maintainer. Archie's monorepo-with-workspaces recommendation is good architecture for when the CLI exists, but premature for v1.

**v1 architecture:**
- One repo (the current one, renamed)
- Clean directory structure (already good)
- The site can live in a `site/` directory in the same repo, or in a separate `<name>.github.io` repo (standard GitHub Pages pattern)

**Split when the pain is real:** When you have 10+ scaffold types, a CLI, and community contributors stepping on each other. Not before.

### Revised Priority Order

The original doc implicitly prioritizes: Name → CLI → Architecture → Site.

**Revised priority:**

| Priority | Action | Why |
|----------|--------|-----|
| 1 | **Name selection + namespace claims** | Blocks everything else. 1 day. |
| 2 | **Marketing site** | Discovery is the real problem. 3-5 days. |
| 3 | **README + repo cleanup** | The template repo must sell itself when someone lands on it. 1-2 days. |
| 4 | **Terminal recordings (VHS)** | Hero content for site + README + social cards. 1 day. |
| 5 | **Content marketing** | Blog post, Twitter thread, Show HN. 1-2 days. |
| 6 | **Progressive disclosure ("lite" mode)** | Reduce entry intimidation. 2-3 days. |
| 7 | **CLI (create-X)** | Only after user demand validates the need. Weeks/months later. |

### The "Lite" Entry Point (New Recommendation)

The full 19-agent, 7-phase, mandatory-gate system is intimidating for new users. The UX gap analysis already flagged this. The competitors that are winning (Squad, aitmpl.com) have lower entry friction.

**Recommendation:** Offer a graduated entry:

- **Starter tier (5 agents):** Sato (code), Tara (tests), Archie (architecture), Cam (discovery), Vik (review). Minimal governance — no sprint boundaries, no done gate, no mandatory debates. Just good habits.
- **Full tier (19 agents):** Everything. Full governance, sprint boundaries, ADR gates, veto authority. For users who are ready for the discipline.

The starter tier is a separate, simpler CLAUDE.md and a subset of `.claude/agents/`. Users "graduate" to the full tier when they feel the need. This is progressive disclosure — the same pattern that made VS Code successful (simple editor that can become a full IDE).

### Revised Site Positioning

The site's hero and feature sections should lean into the real differentiator:

**Don't lead with:** "19 AI agents in your repo" (agent marketplaces have 1000+)

**Lead with:** "Ship like a team of 10. You're the only human." Then show the governance in action — an architecture gate catching a bad decision, a code review with 3 parallel lenses, a sprint boundary wrapping up a milestone. The *process* is the product, not the agent count.

**Comparison framing:** Don't compare against "no agents." Compare against agent marketplaces: "They give you agents. We give you a team. There's a difference."

### Open Questions (Revised)

1. **Name decision (unchanged, but re-ranked):** summon vs. wardroom vs. shipmates. Which resonates? Which do you hate?
2. **Lite mode scope:** Which 5 agents for the starter tier? Which governance rules to include/exclude?
3. **Site-first or content-first?** Build the site then write the launch post, or write the post and use a simple GitHub README as the landing page initially?
4. **Community strategy (unchanged):** How much contribution to support at launch?
5. **Audience validation:** Before building anything, consider posting the positioning ("AI team with governance, not an agent marketplace") to relevant communities and measuring response.

---

## Dani's Response

> **Reviewer:** Dani (Design + UX + Accessibility)
> **Date:** 2026-03-30
> **Scope:** Response to Archie's architecture review, Pierrot's security review, and the cross-review synthesis

### Where I Am Aligned

The synthesis is right on the three biggest calls, and I want to acknowledge that clearly:

**1. Audience reframe.** I was wrong to lead with vibe coders. The synthesis nails it: marketing a mandatory-gate, 15-item-checklist governance framework to people who want "AI team goes brrrr" is a UX contradiction that would produce high bounce rates and negative word-of-mouth. Solo builders who already feel the pain of shipping alone are the real audience. My original framing tried to serve both segments equally, but the product's interaction design — the Session Entry Protocol especially — self-selects for segment 2. The positioning should match what the product actually does to people when they use it. I accept this correction fully.

**2. Name re-ranking.** Demoting `vibecrew` follows logically from the audience reframe, and I agree. If the audience is builders who want discipline, the name should signal craft, not memes. `summon` is a strong verb-as-name that maps to the core interaction (you invoke agents, you summon a team), and it ages well because it has no dependency on any trend. I would still rank `shipmates` above `wardroom` — warmth and approachability matter for a product that asks users to trust AI agents with their development workflow, and "wardroom" requires explanation that "shipmates" does not — but this is a preference, not a hill I would die on.

**3. Lite mode / progressive disclosure.** This is the recommendation I wish I had made myself. The full 19-agent system is an intimidation problem I flagged in the UX gap analysis but did not solve in this document. A 5-agent starter tier with graduated governance is textbook progressive disclosure and directly addresses the onboarding friction I documented. I would push for the starter tier to also simplify the Session Entry Protocol — perhaps a single "What are you building?" question instead of three mandatory gates — so that the first-run experience feels guided rather than interrogated.

### Where I Push Back: The CLI Deferral

The synthesis recommends keeping the GitHub template repo as the sole v1 distribution mechanism, deferring the CLI entirely, and relying on the marketing site for discovery. I disagree with the degree of this deferral, though not the direction.

**The UX argument for an early CLI (even a thin one):**

The template repo's onboarding flow is: land on GitHub, click "Use this template," wait for repo creation, clone it, open it, find CLAUDE.md, read it, figure out what to do next, then run `/quickstart`. That is 6-8 steps with significant cognitive load at step 5 ("open a repo with 50+ files and orient yourself"). The synthesis says "the template IS the product" — true — but the template's discoverability and first-touch UX are genuinely poor, and the marketing site alone does not fix the gap between "I am convinced on the site" and "I am productive in my editor."

A thin CLI does not need Handlebars templating, composable feature layers, or interactive scaffold selection. It needs to do three things: (a) copy the template files, (b) ask for a project name, (c) run `git init`. That is 50-80 lines of TypeScript wrapping `giget`. It can ship in the same repo, not a monorepo. The maintenance burden is closer to 1 day than the 3-5 days the original doc estimated for a full CLI, because the full CLI was over-scoped.

The reason this matters from a design perspective: the `npx create-X` pattern is not just a distribution mechanism, it is a **trust signal**. When a developer sees `npx create-summon my-project` on a landing page, they pattern-match it against create-next-app, create-vite, create-t3-app — tools they already trust and use. The pattern says "this is a real tool, not just someone's dotfiles." A GitHub template link does not carry that same signal. The marketing site's hero section loses its most effective visual element (the copyable install command) if the install path is "click this GitHub link and then do 6 more things."

**My recommendation:** Ship a minimal CLI alongside the site for v1. Not the full composable scaffold system — just the thin wrapper. It costs 1 day and transforms the site's hero from a GitHub link into a one-liner. Build the full interactive CLI when the scaffold layer actually exists.

### What I Would Not Change

- Archie's monorepo recommendation over my 3-repo split is correct for a solo maintainer. I was designing for a future scale that does not exist yet.
- Pierrot's security requirements are non-negotiable and thorough. The supply chain concerns are real, and if a thin CLI ships for v1, items 1-5 of Pierrot's launch blockers still apply.
- The site architecture (Astro + Tailwind), terminal recording strategy (VHS + asciinema), and content marketing priority are all solid as proposed.
- The revised site positioning ("Ship like a team of 10. You're the only human." rather than leading with agent count) is stronger than my original framing.

### Summary

I am aligned on audience, naming, progressive disclosure, site-first priority, and monorepo architecture. I push back on deferring the CLI entirely — a thin wrapper (not the full scaffold system) should ship with v1 because the `npx create-X` pattern is a UX and trust signal, not just a distribution mechanism. This is a design argument, not an engineering one: the one-liner install command is the single most effective element on a developer tool landing page, and removing it weakens the site we are prioritizing.

---

## References

### Developer Tool Marketing & Design
- [Evil Martians: We studied 100 dev tool landing pages](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025)
- [How to kill conversions on your dev tool landing page (Evil Martians)](https://evilmartians.com/chronicles/how-to-kill-conversions-on-your-developer-tool-landing-page)
- [LaunchKit: Free devtool landing page template](https://launchkit.evilmartians.io/)
- [LaunchKit GitHub repo](https://github.com/evilmartians/devtool-template)
- [Astro static site generator](https://astro.build/)

### Terminal Recordings
- [VHS by Charm (scriptable terminal recordings)](https://github.com/charmbracelet/vhs)
- [asciinema (terminal recorder)](https://asciinema.org/)
- [awesome-terminal-recorder (curated list)](https://github.com/orangekame3/awesome-terminal-recorder)

### Distribution & Packaging
- [create-t3-app (npm)](https://www.npmjs.com/package/create-t3-app)
- [giget vs degit vs tiged comparison (2026)](https://www.pkgpulse.com/blog/giget-vs-degit-vs-tiged-git-template-downloading-nodejs-2026)
- [Homebrew tap distribution guide](https://casraf.dev/2025/01/distribute-open-source-tools-with-homebrew-taps-a-beginners-guide/)
- [npm scoped packages docs](https://docs.npmjs.com/about-scopes/)
- [npm package name guidelines](https://docs.npmjs.com/package-name-guidelines/)

### Competitive Landscape
- [bradygaster/squad](https://github.com/bradygaster/squad) — Closest conceptual competitor (Copilot-based team agents, 1.5k stars)
- [GitHub Blog: How Squad runs coordinated AI agents](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/)
- [wshobson/agents](https://github.com/wshobson/agents) — 112 agents, 32k stars (largest agent collection)
- [davila7/claude-code-templates / aitmpl.com](https://github.com/davila7/claude-code-templates) — 1000+ agents, 24k stars (marketplace model)
- [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) — 192+ skills, 8k stars

### Market Context
- [Vibe Coding: semantic history](https://www.coderabbit.ai/blog/a-semantic-history-how-the-term-vibe-coding-went-from-a-tweet-to-prod)
- [Vibe Coding (Wikipedia)](https://en.wikipedia.org/wiki/Vibe_coding)

### Security (cited in Pierrot's review)
- [Shai-Hulud npm supply chain attack (Unit 42, 2025)](https://unit42.paloaltonetworks.com/npm-supply-chain-attack/)
- [CISA: Widespread npm supply chain compromise (2025)](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)
- [npm provenance / Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements/)
- [Sigstore (package signing)](https://blog.sigstore.dev/cosign-verify-bundles/)
- [SLSA framework](https://slsa.dev/spec/v0.1/provenance)
