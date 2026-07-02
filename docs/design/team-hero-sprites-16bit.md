---
agent-notes: { ctx: "16-bit SNES alt art direction + prompts for Meet-the-Team page", deps: [docs/design/team-hero-sprites.md, docs/methodology/personas.md, .claude/agents/, site/src/styles/global.css], state: active, last: "dani@2026-07-01" }
---

# Team Hero Sprites — 16-bit SNES Direction & Prompt Sheet

**Issue:** #42 — "Meet the Team" page (Astro site)
**Owner:** Dani (Design & UX)
**Status:** Creative direction proposed. Alternate to the HD-2D bible.

> **Read this first.** This is the **16-bit alternative** to the HD-2D direction in `docs/design/team-hero-sprites.md`. The two are competing directions for the same page and only one ships. The HD-2D bible stays intact as its own option; nothing here edits it. If you're deciding: HD-2D is cinematic, lit, atmospheric, heavier per asset. This one is flat, chunky, authentic Super Nintendo — Chrono Trigger and Final Fantasy VI, not a film still. Pick one, don't blend them.

> **Sacrificial-concept note.** This v1 exists to be reacted against. I built it because the HD-2D look wasn't landing and the ask was to open the whole thing up — new proportions, new framing, new consistency mechanism, props redrawn to survive at sprite scale. The load-bearing parts are the master palette in § 1 and the redrawn silhouettes in § 3. If the anchor sprite comes back wrong, the palette and the silhouette map are what to defend; the exact per-character prop can flex.

> **Why the pivot, in one line.** Everything that made HD-2D expensive — the rim light, the bloom, the bokeh diorama, the volumetric haze — is exactly what we're throwing out. What replaces it as the glue is a *shared fixed palette*, not a shared lighting rig.

---

## 1. Style Bible

The target is an **authentic 16-bit SNES battle/menu sprite**: Chrono Trigger and FF6, with the readable Toriyama-influenced build. Flat cel shading, a hard dark outline, a strictly limited palette, honest pixel chunkiness. No cinematic layer sits on top of the pixels. The pixels *are* the whole image.

### The SNES contract (non-negotiable, identical for all 16)

| Dimension | Spec |
|-----------|------|
| **Render** | True indexed pixel art. Flat, **banded** cel shading — a color region gets a base tone, one shadow step, one highlight step, and that's usually it. Hard pixel clusters, no smooth gradients anywhere. |
| **Outline** | A single **selective near-black outline** (`#0b1020`, indigo-tinted, not pure black) around the outer silhouette and the major internal form breaks. Selout discipline: the shadow side of an edge takes the dark outline; the lit top edge takes none, or a one-step-darker color instead of black. |
| **Shading** | Two-to-three band ramps per material. **Sparse ordered dithering** only on the transition between two adjacent ramp steps, and only where a surface needs to read as rounded. Dithering is seasoning, not a fill — CT used it in small doses and so do we. |
| **Palette** | Drawn from the **shared master palette** (below). Core tones are fixed and identical across all 16; each sprite adds exactly one small accent ramp. Roughly **≤ 24 colors used per sprite**. |
| **Silhouette** | Big-shape readability first. A teammate has to be identifiable as a black cutout at 64px. Fine detail loses; iconic shape wins. |
| **Mood** | Heroic, warm, competent, a party you'd deploy. Same personalities as v1. What changes is the medium, not who these people are. |

Explicitly gone, and treated as defects if they appear: HDR, rim light, bloom, lens flare, tilt-shift, bokeh, depth-of-field, god-rays, volumetric haze, painterly backgrounds, airbrushed skin, anti-aliased silhouette edges, any smooth 3D-looking form. The negative prompt in § 4 rejects each of these by name.

### Canvas, framing & proportions

CT/FF6 sprites are small and roughly square, not tall 2:3 portraits. I'm matching that and letting the web grid do the presentation work.

- **Native canvas:** **64 × 64 px**, transparent. This is the file you actually pixel. Square tiles reflow into a responsive team grid cleanly and read as a menu roster, which is the CT idiom anyway. The lone exception is `code-reviewer` (§ 3), a wider party-formation strip.
- **Proportions:** **~5.5 heads tall** — the SNES battle-sprite build. Head slightly enlarged (about 10–11px) for face readability, big simplified hands, feet planted. **Not** the 7-head HD-2D hero, **not** chibi/super-deformed.
- **Framing:** figure centered, occupying the full vertical of the tile with ~2px headroom, feet resting on a small **stage token** (a flat indigo ellipse, see palette). No environment, no scenery — the character and its token float on transparency so the tile drops onto any page background.
- **Face at scale:** eyes are 1–2px, mouth 1–2px, expression carried by brow angle and head tilt more than detail. Don't over-render the face; it'll turn to mud.

### Presenting a 64px sprite crisply on the web

A 64px image on a modern display is tiny and, scaled naively, blurry. The rule is **integer nearest-neighbor upscaling only**.

- Ship a pre-upscaled **×4 export at 256 × 256** as the page asset (nearest-neighbor, no resampling). Keep the 64px master as the source of truth.
- CSS: `image-rendering: pixelated;` with `image-rendering: crisp-edges;` as fallback, so any residual browser scaling stays hard-edged.
- Target display box **128–256px** in the grid. Prefer sizes that are integer multiples of 64 (128 / 192 / 256) so the pixels land square. A `srcset` offering the 256 (×4) and a 512 (×8) retina export covers high-DPI without a non-integer scale.
- Downscaling the ×4 asset slightly for a smaller cell is safe under `pixelated`; upscaling past ×8 is not — cap the cell.

**Asset path (decide this explicitly so the two directions never collide):**
The HD-2D pipeline writes `site/src/assets/team/<slug>.webp`. This set writes to a **separate directory**:

```
site/src/assets/team-16bit/<slug>.png        # ×4 (256px) shipped asset, lossless
site/src/assets/team-16bit/_src/<slug>.png    # 64px master, source of truth
```

**PNG, not WebP, and lossless.** Indexed PNG guarantees the palette survives byte-for-byte; lossy WebP would smear the hard edges we just fought for. If the site build wants WebP, use **WebP-lossless** — never lossy on pixel art. The `team-16bit/` prefix keeps this set from ever overwriting the HD-2D `team/` assets, so both directions can sit in the repo while the human decides.

### The master palette (this is the consistency lever — read § 2 with it)

HD-2D unified 16 images with a shared indigo rim light and a shared bokeh atmosphere. Both are gone. What binds this set instead is a **single fixed master palette** every sprite draws from, plus one shared outline color and one shared stage token. Indigo still does the unifying, but it now lives in the **shadows, the neutrals, and the base** rather than in a light.

**Shared core (fixed, identical in every sprite):**

| Role | Hex | Where it's used |
|------|-----|-----------------|
| Outline | `#0b1020` | The single selective outline color, all 16. Indigo-tinted near-black, from `#0f172a`. |
| Indigo deep | `#1e1b4b` | Stage-token shadow, deepest cloth shadow. |
| Indigo mid | `#312e81` | Cool shadow step on neutral cloth/metal. |
| **Brand indigo** | `#4f46e5` | Stage token base, the shared anchor tone. The one saturated color present in every frame. |
| Indigo bright | `#6366f1` | Stage-token highlight, cool highlight on dark surfaces. |
| Indigo light | `#a5b4fc` | Sparkle/highlight accents, the `code-reviewer` codex glow. |
| Neutral 1–5 | `#1f2433` · `#3b4256` · `#5b6478` · `#8b93a7` · `#c3c9d6` | Cloth, leather, steel. **Cool, indigo-biased grays, never neutral gray** — the indigo undertone is what makes 16 sprites feel like one team. |
| Skin light ramp | `#8a5a3b` · `#c98d5f` · `#f2c9a0` | Lighter complexions (shadow/base/light). |
| Skin deep ramp | `#5b3a28` · `#8a5a3b` · `#b57c4f` | Deeper complexions. Vary skin tone across the roster; both ramps are shared. |
| Paper/white | `#b7b3a0` · `#f4f1e6` | Mask, book, banner cloth, blueprint, teeth of highlights. Warm off-white, not pure `#ffffff`. |

Those tones lift straight from `site/src/styles/global.css` (`--summon-accent #4f46e5`, `--summon-accent-light #a5b4fc`, `--summon-bg-dark #0f172a`) so the sprites sit native against the live site, same as v1 promised.

**Per-character accent ramp (the only per-sprite variance):**
Each teammate adds **one 3-shade accent ramp** (dark / base / light) on top of the shared core. The accent is the secondary identifier; silhouette and prop come first. Because the core is fixed and the accent is small, two characters with neighboring hues still read as family — the shared indigo neutrals and outline hold them together. Accent assignments are in the § 3 table (same hues as the HD-2D set, so the two directions stay hue-consistent).

**Palette discipline, stated as a rule:** a sprite = shared core + exactly one accent ramp, quantized to that combined palette, nothing off-palette. A sprite that introduces a fourth accent shade, a warm gray, or a pure-black outline is an outlier to re-quantize (§ 2). The indigo stage token appears under **every** character with no exception — it is the visual handshake that says "same set."

---

## 2. Consistency Strategy

Same philosophy as v1 — **anchor-and-propagate**: make one sprite right, freeze it, force the rest to inherit. The *mechanism* changes completely, because a generative model does not natively produce true indexed pixel art. Prompt words like "16-bit" and "pixel art" get you a smooth illustration wearing a pixel costume. The real levers are a **pixel-art LoRA**, a **nearest-neighbor downscale**, and a **hard palette-quantization pass** against the master palette.

### Step 0 — Build the master palette file first

Before any generation, save the shared core palette (§ 1) as a `master-palette.png` swatch strip, plus one variant per accent ramp. Every generated frame gets remapped to `core + that character's accent`. This file, not a style-reference image, is the thing that actually unifies the set.

### Step 1 — Build the anchor: **Sato**

Generate **Sato** first as the anchor, not Archie. The HD-2D bible picked Archie because a structured silhouette and neutral accent exposed *lighting and proportion* problems early. Flat SNES art has no lighting to expose, so the anchor criterion shifts: I want the sprite that **exercises the most shared ramps** and reads most canonically as an SNES battle sprite.

Sato does that better than anyone. Rolled sleeves give a big run of the **skin ramp**; the tool-belt and apron exercise the **neutral leather/cloth grays**; the hammer-head exercises **steel**; and his accent (a small green ember on the hammer) is restrained, so it locks *how an accent sits inside the palette* without the accent being the whole sprite. His build — broad shoulders, planted stance, symmetrical — is the most textbook CT/FF6 shape on the roster, so proportion and outline discipline get set on the clearest possible case. Archie's blueprint is a glowing hologram, which is genuinely hard to sell in flat pixels and would let the anchor lock the wrong habits.

Iterate on Sato *alone* until § 1 is fully satisfied: 64px, ~5.5 heads, selective `#0b1020` outline, banded shading, indigo stage token, master palette respected, green as the only accent. Lock that master PNG. It's the single source of truth.

### Step 2 — The pixelation pipeline (this is the mechanism)

For **every** frame, anchor and followers alike:

1. **Generate at moderate res with a pixel-art LoRA.** SDXL or Flux.1-dev + a SNES/pixel-art LoRA at **~0.8–1.0** is the base. Generate around 512–768px so the model commits to clean shapes. Prompt words are backup; the LoRA does the work.
2. **Nearest-neighbor downscale to 64px.** No bilinear, no Lanczos — those reintroduce anti-aliasing. Aseprite, ImageMagick `-filter point -resize 64x64`, or a downscale node in Comfy.
3. **Quantize to the master palette.** Remap the 64px image to `core + accent` (Aseprite "remap palette", or ImageMagick `-remap master-palette.png -dither None`). This is what forces the shared palette and kills stray colors. Dithering off by default; add sparse ordered dither by hand only where § 1 calls for it.
4. **Hand-clean in Aseprite.** Every authentic sprite needs a human pixel pass: fix the outline to selout rules, clear orphan pixels, snap the silhouette hard, place the stage token. Budget for this — the model gives you a strong base, not a finished sprite.

Freeze the whole chain (LoRA, weight, downscale filter, palette, sampler/steps/CFG) across all 16. Vary only the per-character prompt and seed. A drifting LoRA weight or a forgotten quantize pass is the top cause of "these two don't match."

### Step 3 — Contact sheet + re-quantize-the-outliers loop

1. Run all 16 through the chain at frozen params.
2. Lay them in a **4×4 contact sheet** at ×4. This is what you eyeball, not single files.
3. Flag outliers against the Sato anchor, in priority order:
   - **Palette** — off-palette colors? warm grays sneaking in? indigo stage token present?
   - **Outline** — single `#0b1020` selective outline, selout obeyed, no pure black?
   - **Proportions** — ~5.5 heads, same head-size and footprint as the anchor?
   - **Read** — identifiable as a silhouette at 64px, big-shape prop legible?
4. Re-run **only the flagged frames**, nudging the lock harder (LoRA +0.1, or just re-quantize + hand-clean the shape). Palette misses are fixed in the quantize pass, not by re-rolling from scratch.
5. Repeat until the 4×4 reads as one party. Fix the system before touching individual frames.

> **Accessibility gate (mine, non-negotiable — same bar as v1).** Before anything ships to the page:
> - Each `<img>` gets **real `alt` text** describing character and archetype, e.g. `alt="Sato, the team's build engineer, a broad smith resting a glowing green hammer on his shoulder"` — never `alt="sato.png"`.
> - **≥ 3:1 contrast** between the figure and its immediate page background so low-vision users can resolve the sprite. Limited-palette SNES art makes this *easier* than HD-2D: I control every color, so I can check the outline and the lightest/darkest sprite tones against the page background directly and pick the display background to clear 3:1. Any baked-in text (there shouldn't be) clears **4.5:1**.
> - Page respects **`prefers-reduced-motion`**: no auto-playing float/parallax/idle-bob on the sprites. If we add an idle animation later, it's motion-gated.
> - Grid **reflows to a single column on mobile** with **no horizontal scroll**. Square 64px tiles make this trivial.
> These are ship-blockers. Frontend change means Dani review, no exceptions.

---

## 3. Persona → Archetype Map

Same 16 personas, same accents, same roles pulled from `.claude/agents/*.md`. The redraw job here: every prop and silhouette has to survive at ~48–64px as a **bold iconic shape**. Loupes, lockpicks, color swatches, orbiting data-motes — none of those read at sprite scale, so each becomes a big simple shape or a 2–4px cluster. Read the "sprite read" line as the thing that actually has to land on the grid.

| Slug | Class / archetype | Accent | Hex |
|------|-------------------|--------|-----|
| cam | The Wayfinder (Guide) | Amber gold | `#f59e0b` |
| sato | The Forge-Knight (Smith) — **anchor** | Refactor green | `#22c55e` |
| archie | The Master Builder (Artificer) | Blueprint cyan | `#22d3ee` |
| tara | The Sentinel Archer (Ranger) | Test-fail crimson | `#ef4444` |
| vik | The Grey Warden (Veteran) | Gunmetal slate | `#64748b` |
| grace | The Marshal (Tactician) | Royal violet | `#8b5cf6` |
| pat | The Quartermaster-Judge | Wine burgundy | `#9f1239` |
| wei | The Wildcard (Trickster) | Chaos magenta | `#ec4899` |
| pierrot | The Nightblade (Rogue) | Oxblood + venom-lime | `#7f1d1d` / `#84cc16` |
| ines | The Pipeline-Wright (Engineer) | Signal yellow | `#facc15` |
| diego | The Lorekeeper (Scribe) | Ink teal | `#0e7490` |
| dani | The Illusion-Artificer (Painter) | Coral | `#fb7185` |
| debra | The Star-Diviner (Seer) | Data teal | `#2dd4bf` |
| cloud | The Aeromancer (Sky-mage) | Sky azure | `#0ea5e9` |
| prof | The Sage (Mentor) | Scholar ochre | `#a16207` |
| code-reviewer | **The Review Party** (formation strip) | Brand indigo binds four | `#4f46e5` |

### Per-character intent (and the sprite read)

- **cam — The Wayfinder.** Probes your intent before you run with a fuzzy vision. **Silhouette:** pointed traveler's hood and open coat, one arm extended holding a lantern. **Sprite read:** the lantern is the icon — a 5–6px amber box with a bright center, held out at arm's length; hood + lantern is the whole shape. **Face:** friendly, brow raised mid-question. Amber accent on the lantern and coat trim.

- **sato — The Forge-Knight (anchor).** The green in red-green-refactor; makes the tests pass. **Silhouette:** broad, rolled sleeves, apron and tool-belt, hammer over one shoulder. **Sprite read:** wide shoulders + the hammer-head slab breaking the silhouette top-right; a 2–3px green ember cluster on the hammer head. **Face:** steady, focused. Refactor-green accent, used sparingly (that restraint is why he's the anchor).

- **archie — The Master Builder.** Owns architecture; speaks in ADRs. **Silhouette:** draftsman's tabard, a big rolled plan held across the body. **Sprite read:** the rolled blueprint is a horizontal cyan-edged bar held in both hands, a set-square notch on the belt — flat and legible, no hologram glow (glow doesn't survive flat pixels). Faint cyan grid on the tabard hem. **Face:** calm authority. Blueprint-cyan accent.

- **tara — The Sentinel Archer.** Writes the failing test first; holds veto. **Silhouette:** lean, a drawn bow. **Sprite read:** the **bow arc is the icon** — a big curved shape spanning the tile, one nocked arrow with a crimson tip; quiver simplified to a slab on the back. **Face:** one eye narrowed down the shaft. Crimson accent on the arrow tip and cloak.

- **vik — The Grey Warden.** Grizzled reviewer who's watched three teams build this exact abstraction. **Silhouette:** cloaked, a tall sword planted as a walking staff. **Sprite read:** the **vertical sword-staff line** anchors the silhouette; he leans on it, arms crossed. The loupe becomes a single bright disc held up, not fine detail. **Face:** one brow up, skeptical. Gunmetal-slate accent on armor and blade.

- **grace — The Marshal.** "Where are we." Owns the board and velocity. **Silhouette:** upright, a raised banner. **Sprite read:** the **banner pole + flag is the icon** — a tall vertical with a violet flag block at the top, arm raised. Kanban tokens on the sash drop to 1–2px dots. **Face:** rallying, warm. Royal-violet accent on the flag.

- **pat — The Quartermaster-Judge.** Owns what to build and why; says no more than yes. **Silhouette:** heavy ledger-cloak, holding a balance. **Sprite read:** the **scales are the icon** — a horizontal beam with two pans held out front, reading instantly as judgement. **Face:** unimpressed, "convince me." Wine-burgundy accent on the cloak.

- **wei — The Wildcard.** Breaks groupthink on gut feel, retcons the rationale after. **Silhouette:** asymmetric, jester collar, leaning back. **Sprite read:** the **asymmetry is the icon** — an off-kilter stance with a bright card or coin arcing above one hand (a 2–3px magenta pixel trail). Collar points break the outline. **Face:** sly grin, one brow cocked. Chaos-magenta accent.

- **pierrot — The Nightblade.** Finds the vuln before the attacker; dual veto. **Silhouette:** hooded rogue, half-mask, dagger low. **Sprite read:** the **white half-mask is the icon** — a bright `#f4f1e6` block on the shadowed face, unmistakable against the dark hood; dagger is a short slab with 1–2 venom-lime pixels on the edge. Lockpicks are cut (too fine). **Face:** half-smirk under the mask. Oxblood costume, single lime accent.

- **ines — The Pipeline-Wright.** Owns everything between `git push` and prod; breaks things on purpose. **Silhouette:** tool-harness, goggles pushed up, hand on a big lever. **Sprite read:** the **deploy lever is the icon** — a tall vertical bar with a yellow knob, mid-throw; goggles are a 2px band on the forehead; cables simplify to two thick curved lines. **Face:** calm under load. Signal-yellow accent on the lever.

- **diego — The Lorekeeper.** "If it's not documented, it doesn't exist." **Silhouette:** robed scholar, holding an open book forward. **Sprite read:** the **open book is the icon** — a two-page spread shape held in both hands, teal script as 2–3px marks on the pages. Quill drops to a dot behind the ear. **Face:** pleasant, mid-thought. Ink-teal accent on the pages and robe trim. (Kept visually distinct from Dani and Prof — Diego *holds an open two-page book*, see below.)

- **dani — The Illusion-Artificer (me).** Design exploration, sacrificial concepts, accessibility. **Silhouette:** artist's coat, holding a rectangular artboard/panel up, brush in the other hand. **Sprite read:** the **upright rectangular UI panel is the icon** — a single coral-edged rectangle held vertically in front (distinct from Diego's two-page book and Prof's floating diagram), brush as a short slab with a coral tip. **Face:** head tilted, evaluating. Coral accent on the panel and brush.

- **debra — The Star-Diviner.** ML, telemetry, experiments; catches Goodhart violations. **Silhouette:** pointed astronomer's hat and robe, a small orb held up. **Sprite read:** the **pointed hat + a floating 3–4px teal cluster** (a scatter-plot read as a tiny constellation) is the icon; astrolabe simplifies to a ring at the hip. The pointed hat separates her from Cloud and Prof. **Face:** quietly delighted, analytical. Data-teal accent.

- **cloud — The Aeromancer.** Cloud architecture, cost, network diagnostics. Literally Cloud. **Silhouette:** flowing robes, a staff, a cloud puff above. **Sprite read:** the **rounded azure cloud shape floating over the staff** is the icon — a soft-cornered blob (still hard pixels, just a rounded outline) that reads "cloud" at a glance; ley-lines drop to two short azure zigzags. No levitation glow. **Face:** serene, far-seeing. Sky-azure accent.

- **prof — The Sage.** Explains the team's choices Socratically; assumes competence. **Silhouette:** tweed robe, spectacles, a pointer raised at a small floating diagram. **Sprite read:** the **raised pointer + a 3–4px ochre diagram** in the air is the icon; spectacles are two bright pixels. He *gestures at* a diagram (Diego *holds* a book, Dani *holds* a panel — three different silhouettes so the scholars don't blur). **Face:** animated, enjoying the why. Scholar-ochre accent.

- **code-reviewer — The Review Party (composite, NOT a lone sprite).** The four-lens review pattern, rendered as a **battle-formation strip** in the SNES idiom — think a party lined up in a menu, or four sprites facing a boss. **Members:** Vik, Tara, Pierrot, Archie (the tribunal from `code-reviewer.md`), arranged around a central glowing **codex tile**. Each keeps their own accent and their § 3 icon (Vik's sword-staff, Tara's bow, Pierrot's mask, Archie's plan). The **brand indigo binds them**: the codex tile glows `#a5b4fc`/`#4f46e5`, and all four stand on one shared indigo stage bar. Wider canvas (see § 4). Mood: a party that will not rubber-stamp the boss.

---

## 4. Per-Character Prompt Sheet

**How to use:** every prompt = **STYLE PREAMBLE** (verbatim, all 16) **+** the character's **SUBJECT** line **+** **PARAMS**. Then run the § 2 pipeline (downscale → quantize → hand-clean) on the output — the prompt gets you a clean base, the pipeline makes it a real sprite. Prompt words alone will not produce true indexed pixels; the LoRA and the quantize pass do.

### Shared style preamble (reuse verbatim — do not edit per character)

```
Authentic 16-bit SNES JRPG character sprite in the Chrono Trigger / Final
Fantasy VI style (Akira Toriyama influenced), single character centered on a
plain transparent background, standing on a small flat indigo #4f46e5 stage
ellipse. Battle-sprite proportions, about 5 to 6 heads tall with a slightly
enlarged head for readability, big simple hands, planted feet, a bold
readable silhouette. Flat banded cel shading with a strictly limited palette
of about 24 colors, one base tone plus one shadow and one highlight per
material, cool indigo-tinted neutral shadows, sparse ordered dithering only
on rounded shadow transitions. A single hard selective near-black #0b1020
outline on the outer silhouette and major internal edges, no outline on lit
top edges. Clean hard pixel clusters, no anti-aliasing on the silhouette
edge. True indexed pixel art, nearest-neighbor hard pixels, Super Nintendo
era sprite.
```

### Shared negative prompt (reuse verbatim — SDXL/Flux; for Midjourney prepend `--no`)

This rejects the entire HD-2D layer by name, plus the usual sprite failures:

```
bloom, glow, HDR, rim light, backlight, lens flare, depth of field, bokeh,
tilt-shift, god rays, volumetric haze, atmosphere, soft focus, motion blur,
smooth gradient, airbrush, painterly, digital painting, concept art,
illustration, 3D render, plastic, realistic lighting, photoreal, high detail,
high resolution, semi-realistic, vector art, cel-shaded anime, chibi,
super-deformed, big-head mascot, extra limbs, extra fingers, fused hands,
deformed face, muddy palette, gray neutrals, pure black outline, text,
watermark, signature, logo, UI, frame, border, cropped head, cut-off feet,
multiple characters, background scenery, low contrast.
```
(For `code-reviewer` only, remove `multiple characters` and `background scenery` — that one is a group on a shared stage.)

### Recommended generation params (frozen across the whole set)

The pipeline, not the prompt, is what makes these pixels. Freeze all of it.

| Engine | Params |
|--------|--------|
| **SDXL** (recommended for control) | 512–768px square, **DPM++ 2M Karras, 28 steps, CFG 6**, **pixel-art LoRA @ 0.9**. Then § 2 pipeline: nearest-neighbor downscale to 64px → remap to master palette → Aseprite clean. Vary prompt + seed only. |
| **Flux.1-dev** | 768px, guidance 3.5, 28 steps, **pixel-art LoRA @ 0.85**. Same downscale + quantize + clean pass. |
| **Midjourney v6/v7** | `--ar 1:1 --style raw --stylize 150`. MJ will not emit true indexed pixels natively, so the **downscale + palette-quantize pass is mandatory** on every MJ output. Use `--sref <Sato anchor>` `--sw 100` to carry the look, but the palette lock still comes from the quantize step, not `--sref`. |
| **All** | Downscale filter = **point/nearest only**. Quantize target = `master-palette core + this character's accent ramp`, **dither None** (add sparse dither by hand). Export ×4 (256px) and ×8 (512px) nearest-neighbor → `site/src/assets/team-16bit/<slug>.png`; keep the 64px master in `_src/`. Composite (`code-reviewer`) uses the wide canvas below. |

> **Output target:** `site/src/assets/team-16bit/<slug>.png` (×4 shipped) + `_src/<slug>.png` (64px master). One per row below. Distinct from the HD-2D `site/src/assets/team/<slug>.webp` — the two sets never collide.

---

### The 16 subject lines

Each block is the **SUBJECT** spliced between the preamble and the params.

**sato** → `sato.png`  *(generate FIRST — this is the anchor; lock its master + palette)*
```
SUBJECT: Sato, "The Forge-Knight," a broad dependable smith with rolled-up
sleeves, a leather apron and tool-belt, resting a smith's hammer over one
shoulder with a small green ember on the hammer head, planted stance, steady
focused face. Neutral gray-and-leather costume; refactor-green #22c55e is the
only accent, used sparingly on the ember and gauntlet cuffs.
```

**cam** → `cam.png`
```
SUBJECT: Cam, "The Wayfinder," a warm guide in a pointed traveler's hood and
open coat, one arm extended holding out a glowing amber lantern that is the
focal shape, friendly face with one brow raised. Amber-gold #f59e0b accent on
the lantern and coat trim.
```

**archie** → `archie.png`
```
SUBJECT: Archie, "The Master Builder," a confident architect in a slate
draftsman's tabard with a faint cyan grid on the hem, holding a large rolled
blueprint horizontally across his body in both hands, a set-square notch at
the belt, calm authoritative face. Blueprint-cyan #22d3ee accent on the plan
edges and grid. Flat, no glow.
```

**tara** → `tara.png`
```
SUBJECT: Tara, "The Sentinel Archer," a lean alert ranger drawing a large bow
that arcs across the tile, one nocked arrow with a crimson tip, a simplified
quiver slab on her back, one eye narrowed down the shaft, sharp certain face.
Crimson #ef4444 accent on the arrow tip and cloak.
```

**vik** → `vik.png`
```
SUBJECT: Vik, "The Grey Warden," a grizzled scarred veteran in a weathered
cloak leaning on a tall sword planted as a walking staff, holding up a small
bright loupe disc, arms crossed, skeptical brow-raised face. Gunmetal-slate
#64748b accent on the armor and blade.
```

**grace** → `grace.png`
```
SUBJECT: Grace, "The Marshal," an energetic tactician standing upright,
raising a tall banner with a violet flag block at the top, a sash with tiny
token dots, rallying warm face. Royal-violet #8b5cf6 accent on the flag and
sash.
```

**pat** → `pat.png`
```
SUBJECT: Pat, "The Quartermaster-Judge," a shrewd product lead in a heavy
ledger-cloak, holding out a balance scale with two pans as the focal shape,
an accept/reject seal at the hip, unimpressed "convince me" face.
Wine-burgundy #9f1239 accent on the cloak and seal.
```

**wei** → `wei.png`
```
SUBJECT: Wei, "The Wildcard," a mischievous trickster in an asymmetric outfit
with a jester collar, leaning back off-balance, flicking a bright card or coin
that arcs above one hand, sly grin with one brow cocked. Chaos-magenta #ec4899
accent on the card and collar points.
```

**pierrot** → `pierrot.png`
```
SUBJECT: Pierrot, "The Nightblade," a hooded rogue in shadow wearing a bright
white half-mask that is the focal shape on the dark face, holding a short
dagger low, coiled stance, knowing half-smirk under the mask. Oxblood #7f1d1d
costume with a single venom-lime #84cc16 pixel accent on the blade edge.
```

**ines** → `ines.png`
```
SUBJECT: Ines, "The Pipeline-Wright," a calm SRE in a tool-harness with
goggles pushed up on her forehead, one hand throwing a tall deploy lever with
a yellow knob as the focal shape, two thick cables curving around her, ready
face. Signal-yellow #facc15 accent on the lever.
```

**diego** → `diego.png`
```
SUBJECT: Diego, "The Lorekeeper," a robed scholar holding a large open book
forward in both hands with teal script marks on the two pages, a quill dot
behind the ear, pleasant articulate face. Ink-teal #0e7490 accent on the
script and robe trim.
```

**dani** → `dani.png`
```
SUBJECT: Dani, "The Illusion-Artificer," a designer in an artist's coat
holding up a single upright rectangular UI panel in front of her, a brush
with a coral tip in the other hand, head tilted evaluating it, curious playful
face. Coral #fb7185 accent on the panel edge and brush.
```

**debra** → `debra.png`
```
SUBJECT: Debra, "The Star-Diviner," a scholar-mage in a pointed astronomer's
hat and robe, holding up a small floating cluster of three or four teal dots
like a tiny constellation, an astrolabe ring at the hip, quietly delighted
analytical face. Data-teal #2dd4bf accent on the constellation.
```

**cloud** → `cloud.png`
```
SUBJECT: Cloud, "The Aeromancer," a serene sky-mage in flowing robes holding
a staff with a single rounded azure cloud shape floating just above it as the
focal shape, two short zigzag ley-lines, far-seeing calm face. Sky-azure
#0ea5e9 accent on the cloud and lines. Feet planted, no levitation.
```

**prof** → `prof.png`
```
SUBJECT: Prof, "The Sage," a warm mentor in a tweed robe with elbow patches
and bright-pixel spectacles, raising a pointer at a small floating ochre
diagram of three or four lines, a closed book under the other arm, animated
friendly face. Scholar-ochre #a16207 accent on the diagram and robe.
```

**code-reviewer** → `code-reviewer.png`  *(COMPOSITE — party-formation strip, NOT a lone sprite)*
```
SUBJECT: "The Review Party" — a battle-formation strip of FOUR SNES sprites
standing on one shared flat indigo stage bar, arranged around a central
glowing codex tile: a grizzled grey warden (gunmetal-slate) leaning on a
sword-staff, a lean ranger (crimson) aiming a bow at the codex, a hooded
nightblade (oxblood, white half-mask) at the shadowed edge, and an architect
(blueprint-cyan) holding a rolled plan over it. Each keeps their own accent;
the indigo #4f46e5 stage bar and #a5b4fc codex glow bind the four. A party
that will not rubber-stamp.
```
*(Params override: wide canvas — native **160 × 64** master, ×4 export **640 × 256**. Remove `multiple characters` and `background scenery` from the negative.)*

---

## Appendix — Production checklist (hand-off to the contributor)

1. Save `master-palette.png` (shared core § 1) plus one accent-ramp variant per character. This file unifies the set — build it before generating.
2. Generate **sato.png** first; iterate until it satisfies § 1; **lock the 64px master + its palette**. Sato is the anchor (§ 2 says why).
3. For every frame, run the pipeline: pixel-art LoRA generate → **nearest-neighbor downscale to 64px** → **remap to master palette (dither None)** → **Aseprite hand-clean** (outline, orphan pixels, silhouette, stage token).
4. Freeze the whole chain across all 16; vary prompt + seed only.
5. Assemble a **4×4 contact sheet** at ×4. Flag outliers (palette → outline → proportions → read) and re-quantize/re-clean only the flagged ones until it reads as one party.
6. Generate **code-reviewer.png** last, on the 160×64 wide canvas.
7. Export ×4 (256px) and ×8 (512px) nearest-neighbor → `site/src/assets/team-16bit/<slug>.png`; keep 64px masters in `_src/`. Lossless PNG only.
8. Page wiring: `image-rendering: pixelated` (with `crisp-edges` fallback), display box an integer multiple of 64, `srcset` ×4/×8.
9. **Dani a11y gate before merge:** real per-image `alt` text, ≥3:1 figure/background contrast (verify against the actual page background — easy here since the palette is fixed), `prefers-reduced-motion` respected, single-column mobile reflow, no horizontal scroll. Frontend change → Dani review is mandatory.
