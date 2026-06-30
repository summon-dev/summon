---
agent-notes: { ctx: "HD-2D hero sprite art direction + prompts for Meet-the-Team page", deps: [docs/methodology/personas.md, .claude/agents/, site/src/styles/global.css], state: active, last: "dani@2026-07-01" }
---

# Team Hero Sprites — Art Direction & Prompt Sheet

**Issue:** #42 — "Meet the Team" page (Astro site)
**Owner:** Dani (Design & UX)
**Status:** Creative direction locked. Images generated externally (Midjourney / Flux / SDXL) by a contributor, then downscaled into `site/src/assets/team/<slug>.webp`.

> **What this doc is.** The actual sprites are made by an AI image model, not committed here. This is the brief a contributor runs so all 16 come out as **one consistent set** — a believable JRPG party, not 16 unrelated portraits. Generate the anchor first, lock it, then drive the other 15 from it (see § 2).

> **Sacrificial-concept note.** This direction is itself a v1 to react against. If the anchor render lands wrong, tear it up — the per-character maps in § 3 are the load-bearing part; the exact rim-light hue or aspect can flex.

---

## 1. Style Bible

The target look is **HD-2D** — the Octopath Traveler / Triangle Strategy / Live A Live aesthetic — adapted to a **single standing full-body hero on a shallow diorama stage**. Pixel-art-rendered character; cinematic, photographic *lighting and depth*; everything else painted into a soft, deep background.

### The core HD-2D contract (non-negotiable, identical for all 16)

| Dimension | Spec |
|-----------|------|
| **Character render** | Pixel-art / sprite-rendered figure — visible, deliberate pixel grid on the character, **not** smooth vector or 3D. Think a high-res 16-bit sprite lit like a film still. |
| **Lighting** | Dramatic HDR with a strong **rim light** separating the figure from the background. One warm-to-neutral key, one cool fill, plus a brand-indigo back-rim. Subtle **bloom** on the brightest highlights. |
| **Background** | Shallow **diorama** — a tilted, miniature stage receding behind the hero. Heavy **tilt-shift depth-of-field**: foreground sharp, background melts into **bokeh**. Floating **particle motes** (dust, embers, light spores) drifting in the depth. |
| **Atmosphere** | Volumetric haze, god-rays where they fit the character, gentle bloom. Painterly background, pixel-crisp subject. The contrast between the two is the whole look. |
| **Mood** | Heroic, warm, a little wondrous. These are teammates you'd want in your party — competent and likeable, never grimdark, never chibi-cute. |

### Canvas, framing & proportions

- **Aspect / canvas:** **2:3 portrait**, full-body framing. The hero stands head-to-toe with a small headroom margin above and a sliver of diorama floor below. Generate large: **1024 × 1536** minimum (see § 4 for the upscale/export pipeline).
- **Proportions:** **heroic-realistic, ~7 heads tall** — the Octopath build. **Not** chibi, **not** super-deformed. Slightly stylized faces (clear, readable features) on grounded, athletic bodies.
- **Composition:** figure centered, occupying ~70–80% of frame height, weight on a clear ground plane. A single hero per frame (the lone exception is `code-reviewer`, § 3/§ 4 — a party formation).
- **Camera:** slight low-angle (~10°) hero shot so each teammate reads as capable. Eye-level for the warmer/host personas (Cam, Prof) so they feel approachable.

### Outline & anti-alias treatment

- **Selective dark outline** on the character's outer silhouette and major internal edges (the HD-2D "sticker" pop), softening to no-outline inside lit forms.
- **Crisp pixel edges on the subject** — do not let the upscaler smooth the sprite into vector. Background may be soft/painterly; the character stays pixel-defined.
- Anti-alias *within* the sprite is fine (it's high-res pixel art, not 1-bit), but the **silhouette edge stays hard** against the bokeh.

### Palette

The set is unified by the **Summon brand indigo** and split apart by a **per-character accent**.

**House anchors (present in every frame):**

| Token | Hex | Role in the frame |
|-------|-----|-------------------|
| Brand indigo | `#4f46e5` | The back-rim light + the dominant bokeh/atmosphere hue. The constant that makes 16 images one set. |
| Indigo light | `#a5b4fc` | Highlight bloom, particle motes, god-ray tint. |
| Indigo glow | `rgba(99,102,241,0.15)` | Volumetric haze / lens glow density. |
| Stage dark | `#0f172a` | Deepest background falloff, diorama shadow. |

(Values lifted verbatim from `site/src/styles/global.css` so the sprites sit natively against the live site.)

**Per-character accent** drives that hero's costume pop, prop glow, and *warm* rim light (the indigo owns the *cool* back-rim; the accent owns the *key/warm* side). Accent hue is the secondary identifier — **silhouette + prop come first**; the brand indigo keeps them family even when two accents are neighbours on the wheel. Full accent assignments in the § 3 table.

### Lighting key (one recipe, reused)

```
KEY:    warm, ~35° camera-left, character's accent hue, soft.       (the personality)
FILL:   cool neutral, low intensity, camera-right.                  (shape)
RIM:    brand indigo #4f46e5, behind/above, hard and bright.        (the house signature)
BLOOM:  on brightest accent highlights + indigo rim only.
```

This single key recipe is the strongest consistency lever after the style reference — it must not vary character to character. A teammate lit flat, or lit with the wrong rim colour, is an outlier to re-roll (§ 2).

---

## 2. Consistency Strategy

Sixteen separate generations will **not** look like one set by luck. The technique is **anchor-and-propagate**: make one hero excellent, freeze it, and force every other generation to inherit its style.

### Step 1 — Build the anchor

Generate **Archie** first as the anchor (clear silhouette, mid-palette cyan accent, lots of readable HD-2D surfaces — good stress test of the look). Iterate on Archie *alone* until the style bible (§ 1) is fully satisfied: pixel-character + bokeh diorama + indigo rim + 2:3 full-body + correct proportions. **Lock that image and its seed** *after* it lands, not before. This is the single source of truth; everything else is judged against it.

> **Forcing the pixel render (learned from the v1 anchor).** An SDXL/Flux base will drift to a smooth, painterly character even with the words above — prompt weighting alone is not enough. The actual lever is one of: a **pixel-art style LoRA at ~0.8**, or a **nearest-neighbor pixelation pass** (downscale the character to ~384px wide, then upscale back). Add one of these to the graph; the preamble text is backup, not the mechanism.
>
> **Anchor seed strategy.** Don't nudge a single seed — you want a materially different render. Freeze the checkpoint, sampler (DPM++ 2M Karras), 30 steps, and CFG ~5.5, then **batch 6–8 fresh seeds**. When one nails all of: visible pixel grid, ~75% framing, neutral costume with cyan as the only accent, and an indigo rim that wraps the full silhouette (legs and boots clearing the background ≥3:1), *that* seed and image become the frozen anchor for all follower propagation.

> Why Archie and not Cam (P0)? The anchor should be the *most representative of the style*, not the most important persona — Archie's structured silhouette and neutral-cool accent expose lighting/proportion problems early. Identity ordering is for § 3; style ordering is for here.

### Step 2 — Drive the other 15 from the anchor

Pick the engine you're using:

**Midjourney (v6/v7) — recommended for speed.**
- Use **`--sref <anchor image URL>`** (style reference) with a high style weight **`--sw 100–150`** on all 15 followers. This transfers the anchor's rendering, lighting, and palette without copying its subject.
- **Do _not_ use `--cref` here.** `--cref` (character reference) locks a *face/identity* — it would try to make all 16 the same person. We want 16 *different* heroes in one *style*. Style ref yes, character ref no.
- Keep **`--style raw`** and a fixed **`--stylize 250`** across the whole set so MJ doesn't re-interpret each prompt with different flair.
- Optionally pin **`--sref random`'s resolved seed**: once a follower's style locks, reuse its `--seed` for re-rolls so only the prompt changes.

**SDXL / Flux — recommended for maximal control.**
- **Flux.1-dev + a small style LoRA** is the highest-consistency route: train a lightweight LoRA on the locked anchor plus 3–5 approved follower renders, apply at weight **~0.8**, and generate all 16 through it. The LoRA *is* the style lock.
- **SDXL + IP-Adapter (style transfer)**: use the **style-only / "plus" IP-Adapter** referencing the anchor at weight **~0.6** (style, not composition — do not let it copy the anchor's pose). Pair with a fixed sampler.
- **Freeze every non-prompt knob** across all 16: sampler **DPM++ 2M Karras**, **30 steps**, **CFG 5–6**, resolution **1024×1536**. Vary *only* the per-character prompt and the seed. A drifting CFG or sampler is the most common cause of "these two don't match."

### Step 3 — Contact sheet + re-roll-the-outliers loop

1. Generate all 16 at the frozen params.
2. Lay them in a **4×4 contact sheet** (this is the actual deliverable to eyeball, not individual files).
3. Flag **outliers** against the anchor on four axes, in priority order:
   - **Lighting key** — indigo rim present? warm-accent key on the correct side?
   - **Proportions** — ~7 heads, same camera height/zoom as the anchor?
   - **Palette** — accent reads correctly *and* the indigo atmosphere is present?
   - **Render fidelity** — still pixel-character + bokeh diorama, not gone smooth/3D?
4. Re-roll **only the flagged ones**, nudging the lock harder (Midjourney: `--sw +30`; LoRA: weight +0.1; IP-Adapter: weight +0.1) until the flagged frame rejoins the family.
5. Repeat until the 4×4 reads as **one party**. Do not hand-fix individuals before the *set* is coherent — fix the system, not the frame.

> **Accessibility gate (mine, non-negotiable).** Before these ship to the page: every sprite must hit **≥4.5:1 contrast** for any baked-in text and **≥3:1** for the figure against its immediate background (so low-vision users can resolve the hero). Each `<img>` gets a real `alt` describing the character and archetype (e.g. `alt="Archie, the team's architect, presenting a glowing blueprint"`) — **not** `alt="archie.webp"`. The page must respect `prefers-reduced-motion` (no auto-playing parallax/float on the sprites) and the grid must reflow to a single column on mobile with **no horizontal scroll**. These are ship-blockers, same as any frontend change.

---

## 3. Persona → Archetype Map

Each hero's class, silhouette, prop, pose, expression, and accent are derived from the agent's **actual role and voice** (sourced from `.claude/agents/*.md`). Read top-to-bottom, they should feel like a party you could deploy.

| Slug | JRPG class / archetype | Accent | Hex |
|------|------------------------|--------|-----|
| cam | The Wayfinder (Bard / Guide) | Amber gold | `#f59e0b` |
| archie | The Master Builder (Artificer) — **anchor** | Blueprint cyan | `#22d3ee` |
| sato | The Forge-Knight (Smith / Vanguard) | Refactor green | `#22c55e` |
| tara | The Sentinel Archer (Ranger) | Test-fail crimson | `#ef4444` |
| vik | The Grey Warden (Veteran Knight) | Gunmetal slate | `#64748b` |
| grace | The Marshal (Tactician / Standard-bearer) | Royal violet | `#8b5cf6` |
| pat | The Quartermaster-Judge (Merchant-Lord) | Wine burgundy | `#9f1239` |
| wei | The Wildcard (Trickster / Chaos-mage) | Chaos magenta | `#ec4899` |
| pierrot | The Nightblade (Shadow / Pen-tester) | Oxblood + venom-lime glow | `#7f1d1d` / `#84cc16` |
| ines | The Pipeline-Wright (Engineer-Pilot) | Signal yellow | `#facc15` |
| diego | The Lorekeeper (Scribe-mage) | Ink teal | `#0e7490` |
| dani | The Illusion-Artificer (Painter-mage) | Coral | `#fb7185` |
| debra | The Star-Diviner (Astronomer / Seer) | Data teal | `#2dd4bf` |
| cloud | The Aeromancer (Sky-mage) | Sky azure | `#0ea5e9` |
| prof | The Sage (Mentor-Wizard) | Scholar ochre | `#a16207` |
| code-reviewer | **The Review Tribunal** (party formation banner) | Brand indigo (binds the four) | `#4f46e5` |

### Per-character intent

- **cam — The Wayfinder.** Cam never lets you run with a fuzzy vision; he probes and maps your intent. **Silhouette:** open traveller's coat, one hand raised palm-up mid-question. **Prop:** a lantern that casts the path forward (the vision he's surfacing). **Pose:** half-turned toward the viewer, inviting, mid-"why?". **Expression:** warm, attentive, one eyebrow lifted in genuine curiosity. The campfire host who gathers the party.

- **archie — The Master Builder (anchor).** Owns the architecture; speaks in diagrams and ADRs. **Silhouette:** draftsman's tabard with a faint grid motif, measuring tools at the belt. **Prop:** a glowing holographic blueprint / floating floor-plan unrolling from one hand; a set-square in the other. **Pose:** presenting the schematic, confident, weight grounded. **Expression:** calm authority — "here are the three options, and here's my pick."

- **sato — The Forge-Knight.** The workhorse; the "green" in red-green-refactor who makes Tara's tests pass. **Silhouette:** sleeves rolled, broad stance, tool-belt. **Prop:** a smith's hammer that doubles as a blade, resting over one shoulder; faint green ember-glow on the head (tests going green). **Pose:** steady, mid-stride toward the work, reliable. **Expression:** focused, unflappable, quietly satisfied.

- **tara — The Sentinel Archer.** Writes the failing test *first* — she aims before the thing exists; holds veto power. **Silhouette:** lean, alert, a quiver where each arrow is a labelled test case. **Prop:** a drawn bow with a single nocked arrow over a glowing target reticle (the "red" failing assertion). **Pose:** drawn and sighting, one eye narrowed down the shaft. **Expression:** sharp, scrutinizing, certain. She sees the break before the build.

- **vik — The Grey Warden.** Grizzled reviewer who's "watched three teams build this exact abstraction." **Silhouette:** weathered, cloaked, scarred; a worn longsword used as a walking staff. **Prop:** a magnifying loupe in one hand, reading-glasses pushed up. **Pose:** leaning on the sword-staff, arms half-crossed, unhurried scrutiny. **Expression:** skeptical, one eyebrow up — "could a junior understand this at 2am?"

- **grace — The Marshal.** "Where are we." Keeps the party moving, owns the board and velocity. **Silhouette:** upright, a sash strung with small kanban tokens, a banner aloft. **Prop:** a tactician's standard / banner, and a floating board with pieces mid-move. **Pose:** pointing forward, rallying the line. **Expression:** energetic, commanding but warm — the one who remembers the last three estimates were off by 3×.

- **pat — The Quartermaster-Judge.** Owns "what to build and why"; says no more than yes; terse and business. **Silhouette:** authoritative, a heavy ledger-cloak, an accept/reject seal at the hip. **Prop:** a set of priority scales in one hand, a rolled backlog in the other. **Pose:** arms appraising the scales, weight back — "does this ship value? No? Then why are we building it?" **Expression:** shrewd, unimpressed, waiting to be convinced.

- **wei — The Wildcard.** Breaks groupthink on gut feel, then retcons the rationale. Chaos as a feature. **Silhouette:** asymmetric, a subtle harlequin/jester collar, off-kilter stance. **Prop:** a wildcard/joker card and a tumbling coin or pair of dice; a flicker of chaos-flame. **Pose:** leaning back, casual, mid-toss of the coin. **Expression:** mischievous grin, eyebrow cocked — "what if we did the exact opposite?"

- **pierrot — The Nightblade.** Finds the vuln before the attacker; dark humour; dual veto. **Silhouette:** hooded rogue, a half-porcelain Pierrot mask (the sad-clown namesake) catching the light. **Prop:** lockpicks and a thin dagger; a shield-sigil stamped with a broken lock. **Pose:** half-emerged from shadow, testing a lock, body coiled. **Expression:** knowing half-smirk under the mask — "six seconds and a working internet connection." Oxblood costume with a single venom-lime glow on the blade's edge.

- **ines — The Pipeline-Wright.** Owns everything between `git push` and prod; automates herself out of a job; breaks things on purpose. **Silhouette:** tool-harness, goggles, cables/pipes coiling around her like tamed conduits. **Prop:** a hand on a heavy **deploy lever**, a wrench at the belt, a small mechanical pipeline-familiar. **Pose:** lever half-thrown, goggles up, ready to ship or roll back. **Expression:** calm under load — the unflappable one at 3am. Hazard-yellow signal accents.

- **diego — The Lorekeeper.** "If it's not documented, it doesn't exist." Docs as a first-class deliverable. **Silhouette:** robed scholar with a satchel of scrolls, a quill behind the ear. **Prop:** a great open tome, glowing script trailing off the page as ribbons of light. **Pose:** writing into the floating book, words materializing as he goes. **Expression:** pleasant, articulate, mid-thought — making the complex legible. Ink-teal glow.

- **dani — The Illusion-Artificer (me).** Design exploration, sacrificial concepts, accessibility. **Silhouette:** artist's coat hung with colour swatches, a stylus-brush in hand. **Prop:** a brush/stylus painting glowing UI panels and wireframe cards into the air; a floating palette. **Pose:** sketching a luminous interface, head tilted, evaluating it like it's meant to be torn apart. **Expression:** curious, playful, a designer mid-critique. Coral accent for the creative pop.

- **debra — The Star-Diviner.** ML, telemetry, experimentation; the only one with notebook access; catches Goodhart violations. **Silhouette:** scholar-mage robes with orbiting data-motes; a small floating notebook-grimoire. **Prop:** a holographic constellation that is really a 3-D scatter-plot; an astrolabe of metrics. **Pose:** one hand raised, rotating the data-constellation, reading a pattern in it. **Expression:** analytical, quietly delighted to have found signal in the noise. Luminous data-teal.

- **cloud — The Aeromancer.** AWS/Azure/GCP architecture, cost, network diagnostics. Literally Cloud. **Silhouette:** flowing robes, levitating a hand's-breadth off the diorama floor. **Prop:** three small floating cloud-platforms orbiting a staff (the three clouds), network ley-lines arcing between them like lightning. **Pose:** arms raised, conducting the sky-platforms; calm command of the storm. **Expression:** serene, far-seeing — watching the bill before it lands. Sky-azure.

- **prof — The Sage.** Explains the team's choices Socratically; assumes competence; "here's the thing." **Silhouette:** tweed-robe with elbow patches, spectacles, a pointer. **Prop:** a piece of chalk drawing a glowing diagram in mid-air; a closed book under the arm. **Pose:** mid-explanation, one finger raised, gesturing at the floating diagram. **Expression:** warm, animated, enjoying the *why* — the senior engineer explaining over beers, never lecturing. Scholar-ochre.

- **code-reviewer — The Review Tribunal (composite, NOT a lone hero).** This is the four-lens review pattern, so render a **party formation / heraldic banner**, not one character: **Vik, Tara, Pierrot, and Archie** gathered around a glowing codex on a war-table, each examining it through their own lens — Vik leaning in skeptical, Tara sighting down an arrow at a line of it, Pierrot probing it from the shadowed edge, Archie overlaying a blueprint grid on it. The brand indigo binds them (shared rim light, shared table glow); each member keeps their own accent so the four lenses read distinctly. Wider crop than the others (see § 4). Mood: a council that will not rubber-stamp.

---

## 4. Per-Character Prompt Sheet

**How to use:** every prompt = **STYLE PREAMBLE** (verbatim, identical for all 16) **+** the character's **SUBJECT** line **+** **PARAMS**. The preamble carries the HD-2D look so the engine doesn't re-invent it per character; the subject only swaps the hero. After the anchor is locked, append the style-lock flag (`--sref …` / LoRA / IP-Adapter) per § 2.

### Shared style preamble (reuse verbatim — do not edit per character)

```
HD-2D JRPG hero sprite in the Octopath Traveler / Triangle Strategy style:
a full-body pixel-art-rendered character standing on a shallow miniature
diorama stage, dramatic HDR cinematic lighting with a bright brand-indigo
#4f46e5 rim light separating the figure from the background, soft warm key
light and cool fill, subtle bloom on the highlights. Background is a rich
tilt-shift depth-of-field diorama with layered set pieces receding into
indigo bokeh, floating glowing particle motes, subtle god-rays and
volumetric haze, deep #0f172a falloff. The character is rendered as a crisp
16-bit HD-2D pixel-art sprite — visible pixel grid, pixelated dithered
shading, hard sprite edges, in the style of an Octopath Traveler character
sprite — with a selective dark silhouette outline. The background alone is
soft and painterly; the character is never smooth, airbrushed, or painterly.
Heroic-realistic proportions, about 7 heads tall, full-body head-to-toe with
the figure filling ~75% of frame height, minimal headroom and feet near the
lower edge, slight low hero angle.
```

### Shared negative prompt (reuse verbatim — SDXL/Flux; for Midjourney prepend `--no`)

```
chibi, super-deformed, big-head, cute mascot, smooth vector art, flat
illustration, 3D render, plastic skin, anime cel-shading, blurry subject,
soft-focus character, photoreal human, smooth digital painting, painterly
character, airbrushed, semi-realistic rendering, concept-art illustration,
extra limbs, extra fingers, fused hands, deformed face, text, watermark,
signature, logo, UI, frame, border, cropped head, cut-off feet, multiple
characters, busy cluttered background, low contrast, washed-out colors,
harsh flat lighting.
```
(For `code-reviewer` only, remove `multiple characters` from the negative — that one is a group.)

### Recommended generation params (frozen across the whole set)

| Engine | Params |
|--------|--------|
| **Midjourney v6/v7** | `--ar 2:3 --style raw --stylize 250` + (followers) `--sref <ANCHOR_URL> --sw 120`. No `--cref`. Reuse a locked `--seed` per character for re-rolls. |
| **Flux.1-dev** | 1024×1536, guidance 3.5, 28–32 steps, **style LoRA @ 0.8**, fixed sampler, vary prompt + seed only. |
| **SDXL** | 1024×1536, **DPM++ 2M Karras, 30 steps, CFG 5.5**, **style IP-Adapter (plus) @ 0.6** → anchor. Vary prompt + seed only. |
| **All** | Source render ≥ **1024×1536 (2:3)**. Upscale 2× to ~2048×3072 for the hero crop. Export downscaled **WebP** → `site/src/assets/team/<slug>.webp` at display sizes (≈480×720 @1x, 960×1440 @2x). Composite (`code-reviewer`) generates at **16:9 / 1536×864** instead. |

> **Output target:** `site/src/assets/team/<slug>.webp` — one file per row below.

---

### The 16 subject lines

Each block is the **SUBJECT** to splice between the preamble and the params.

**cam** → `cam.webp`
```
SUBJECT: Cam, "The Wayfinder," a warm welcoming guide in an open
traveller's coat, holding up a glowing lantern that lights the path
forward, other hand raised palm-up mid-question, half-turned toward the
viewer, attentive curious expression with one eyebrow lifted. Amber-gold
#f59e0b accent on the lantern glow and coat trim, warm and inviting.
```

**archie** → `archie.webp`  *(generate FIRST — this is the anchor, no style-ref)*
```
SUBJECT: Archie, "The Master Builder," a confident architect in a
slate-grey draftsman's tabard with a glowing blueprint-cyan #22d3ee grid
motif and trim, measuring tools at the belt, unrolling a glowing
holographic cyan blueprint from one hand and holding a set-square in the
other, presenting it, calm authoritative expression, grounded stance,
bright indigo #4f46e5 rim light wrapping the entire silhouette including
legs and boots. Cyan is the only saturated accent on an otherwise neutral
costume.
```

> **Archie-specific negatives** (anchor only): `orange costume, amber clothing, leather tunic, bow, quiver`. The v1 anchor drifted to an orange tunic with a back-strap that read as Tara's bow — a warm costume base also fights every follower's accent, so the anchor's costume must stay neutral with cyan as the only accent.

**sato** → `sato.webp`
```
SUBJECT: Sato, "The Forge-Knight," a dependable engineer with sleeves
rolled up and a tool-belt, resting a smith's hammer-blade over one shoulder
with a soft green ember-glow on its head, mid-stride toward the work, focused
unflappable expression. Refactor-green #22c55e accent on the hammer glow and
gauntlets.
```

**tara** → `tara.webp`
```
SUBJECT: Tara, "The Sentinel Archer," a lean alert ranger with a quiver of
labelled arrows, drawing a bow with a single nocked arrow aimed through a
glowing red target reticle, one eye narrowed down the shaft, sharp certain
expression. Crimson #ef4444 accent on the reticle, arrow-tip glow, and cloak.
```

**vik** → `vik.webp`
```
SUBJECT: Vik, "The Grey Warden," a grizzled scarred veteran in a weathered
cloak leaning on a worn longsword used as a walking staff, holding a
magnifying loupe with reading-glasses pushed up onto his brow, arms half
crossed, skeptical one-eyebrow-raised expression. Gunmetal-slate #64748b
accent on the armor and blade.
```

**grace** → `grace.webp`
```
SUBJECT: Grace, "The Marshal," an energetic tactician standing upright with
a sash strung with small kanban tokens, raising a tactician's banner in one
hand while a floating board with pieces hovers beside her, pointing forward
to rally the line, commanding but warm expression. Royal-violet #8b5cf6
accent on the banner and sash.
```

**pat** → `pat.webp`
```
SUBJECT: Pat, "The Quartermaster-Judge," a shrewd authoritative product lead
in a heavy ledger-cloak with an accept/reject seal at the hip, holding a set
of priority scales in one hand and a rolled backlog scroll in the other,
appraising the scales, unimpressed "convince me" expression. Wine-burgundy
#9f1239 accent on the cloak and seal.
```

**wei** → `wei.webp`
```
SUBJECT: Wei, "The Wildcard," a mischievous trickster with an asymmetric
outfit and a subtle harlequin collar, leaning back casually mid-toss of a
spinning coin, a wildcard joker card in the other hand wreathed in a flicker
of chaos-flame, sly grin with one eyebrow cocked. Chaos-magenta #ec4899
accent on the flame and card.
```

**pierrot** → `pierrot.webp`
```
SUBJECT: Pierrot, "The Nightblade," a hooded rogue half-emerged from shadow
wearing a half-porcelain Pierrot mask catching the light, holding lockpicks
and a thin dagger, a shield-sigil stamped with a broken lock at the hip,
body coiled, a knowing half-smirk under the mask. Oxblood #7f1d1d costume
with a single venom-lime #84cc16 glow along the blade edge.
```

**ines** → `ines.webp`
```
SUBJECT: Ines, "The Pipeline-Wright," a calm SRE in a tool-harness with
goggles pushed up and cables coiling around her like tamed conduits, one
hand on a heavy half-thrown deploy lever, a wrench at the belt and a small
mechanical pipeline-familiar nearby, ready and unflappable expression.
Hazard signal-yellow #facc15 accent on the lever and harness.
```

**diego** → `diego.webp`
```
SUBJECT: Diego, "The Lorekeeper," a robed scholar with a satchel of scrolls
and a quill behind the ear, writing into a great open floating tome with
glowing script trailing off the page as ribbons of light, pleasant
articulate mid-thought expression. Ink-teal #0e7490 accent on the glowing
script and robe trim.
```

**dani** → `dani.webp`
```
SUBJECT: Dani, "The Illusion-Artificer," a designer in an artist's coat hung
with colour swatches, using a stylus-brush to paint glowing UI panels and
wireframe cards into the air, a floating palette beside her, head tilted
evaluating the interface, curious playful expression. Coral #fb7185 accent
on the painted panels and brush glow.
```

**debra** → `debra.webp`
```
SUBJECT: Debra, "The Star-Diviner," a scholar-mage in robes with orbiting
data-motes and a small floating notebook-grimoire, one hand raised rotating
a holographic constellation that is really a 3D scatter-plot, an astrolabe of
metrics at her side, quietly delighted analytical expression. Luminous
data-teal #2dd4bf accent on the constellation and motes.
```

**cloud** → `cloud.webp`
```
SUBJECT: Cloud, "The Aeromancer," a serene sky-mage in flowing robes
levitating a hand's-breadth off the diorama floor, conducting three small
floating cloud-platforms orbiting a staff with network ley-lines arcing
between them like soft lightning, far-seeing calm expression. Sky-azure
#0ea5e9 accent on the platforms and ley-lines.
```

**prof** → `prof.webp`
```
SUBJECT: Prof, "The Sage," a warm mentor in a tweed robe with elbow patches
and spectacles, drawing a glowing explanatory diagram in mid-air with a
piece of chalk, a closed book tucked under the other arm, one finger raised
mid-explanation, animated friendly expression. Scholar-ochre #a16207 accent
on the chalk diagram and robe.
```

**debra/cloud/prof note:** these three lean "mage" — keep their *silhouettes* clearly different (astronomer vs. levitating sky-mage vs. tweedy lecturer) so the shared robe motif doesn't blur them.

**code-reviewer** → `code-reviewer.webp`  *(COMPOSITE — group banner, 16:9, NOT a lone hero)*
```
SUBJECT: "The Review Tribunal" — a party formation of FOUR heroes gathered
around a large glowing codex on a war-table, each examining it through their
own lens: a grizzled grey warden (gunmetal-slate) leaning in skeptically with
a loupe, a lean ranger (crimson) sighting an arrow down a line of the codex,
a masked nightblade (oxblood) probing it from the shadowed edge, and an
architect (blueprint-cyan) overlaying a glowing blueprint grid across it.
Heroic council composition, shared brand-indigo #4f46e5 rim light and
table-glow binding the four, each keeping their own accent color. A council
that will not rubber-stamp. Wide cinematic framing.
```
*(Params override for this one: `--ar 16:9` / 1536×864; remove `multiple characters` from the negative prompt.)*

---

## Appendix — Production checklist (hand-off to the contributor)

1. Generate **archie.webp** first; iterate until it satisfies § 1; **lock image + seed**.
2. Set the style lock (Midjourney `--sref`, or Flux/SDXL LoRA/IP-Adapter) per § 2.
3. Generate the other 15 at the **frozen params**; assemble a **4×4 contact sheet**.
4. Flag + **re-roll only outliers** (lighting → proportions → palette → fidelity) until the set reads as one party.
5. Generate **code-reviewer.webp** last, at 16:9.
6. Upscale 2×, export WebP at display sizes into `site/src/assets/team/<slug>.webp`.
7. **Dani a11y gate before merge:** real per-image `alt` text, ≥3:1 figure/background contrast, `prefers-reduced-motion` respected, single-column mobile reflow, no horizontal scroll. Frontend change → Dani review is mandatory.
