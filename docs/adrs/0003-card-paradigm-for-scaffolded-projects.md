---
agent-notes: { ctx: "ADR for layered card UX paradigm in scaffolds", deps: [CLAUDE.md, docs/adrs/template.md], state: active, last: "dani@2026-04-08-r2" }
---

# ADR-0003: Card Paradigm for Scaffolded Projects

## Status

Accepted

## Context

Summon scaffolds web projects across multiple frameworks (React/Next.js, SvelteKit, Astro) with Tailwind CSS. These projects frequently need to surface structured data, present choices, and collect input from end users — the "card paradigm."

We evaluated Microsoft Adaptive Cards as a declarative, cross-platform card format. The evaluation found:

- **Ecosystem stagnation.** The React wrapper (`adaptivecards-react`) last published 3+ years ago. The templating SDK: 3 years stale. The 900K weekly npm downloads are almost entirely transitive dependencies from Microsoft Teams/Copilot SDKs, not organic adoption.
- **Stack conflict.** Adaptive Cards render via imperative DOM manipulation, conflicting with React's component model, Astro's zero-JS SSR philosophy, and Tailwind's utility-class styling. The host config JSON styling model is incompatible with Tailwind theming.
- **Insufficient accessibility control.** The renderer controls semantic HTML output, preventing fine-grained ARIA, focus management, and keyboard interaction customization needed for WCAG compliance.
- **Narrow portability benefit.** Most Summon-scaffolded projects target web only. The cross-platform rendering story (web + iOS + Android) applies to a minority of use cases.

**Exception:** Adaptive Cards remain the correct choice when a project explicitly targets Microsoft surfaces (Teams bots, Outlook Actionable Messages, Copilot Studio). This ADR does not apply to those cases.

We then evaluated alternatives across five categories:

- **Component libraries:** shadcn/ui (85K+ GitHub stars, dominant in React + Tailwind), shadcn-svelte (7.5K+ stars, actively maintained Svelte port using Bits UI), Radix UI, Headless UI, Ark UI (React/Svelte/Vue/Solid via Zag.js state machines), Park UI
- **Declarative form/card specs:** JSON Forms (no Svelte support), RJSF (React-only, known a11y issues), Formily (no Svelte, Chinese-primary docs)
- **Design system approaches:** Tailwind UI/Plus, design tokens (Style Dictionary, W3C Design Tokens v1), Storybook-driven patterns
- **Data-driven approaches:** Builder.io, Block Protocol (stalled — last spec v0.3, Feb 2023), Portable Text (Sanity), Vercel json-render (13K+ stars since Jan 2026, cross-framework AI-generated UI rendering with shadcn/ui and shadcn-svelte renderers)
- **Bespoke schemas:** custom Summon-specific card types with per-framework renderers

No single library covers Summon's cross-framework needs while maintaining accessibility, developer experience, and data-driven rendering capability. A layered approach is required.

## Decision

Adopt a three-layer card paradigm for Summon-scaffolded projects:

### Layer 1: Interactive Primitives — Ark UI

[Ark UI](https://ark-ui.com) provides accessible, headless UI components (dialog, popover, menu, accordion, tabs, tooltip, combobox, etc.) across React, Svelte, Vue, and Solid with a consistent API. It is backed by the Chakra UI team and built on Zag.js state machines, ensuring consistent cross-framework behavior.

Summon scaffolds include Ark UI as the default dependency for interactive UI primitives. When a card contains a dropdown, modal, accordion, or other interactive behavior, Ark UI provides the accessible primitive.

**For React projects:** shadcn/ui (which uses Radix under the hood) is also acceptable — both Radix and Ark UI are strong choices for React. The scaffold may use either. Ark UI is required for SvelteKit and other non-React scaffolds.

**Accessibility note on Radix:** A [Publicis Sapient audit](https://github.com/radix-ui/primitives/discussions/2232) identified 35 accessibility issues in Radix primitives. The copy-paste ownership model means developers can fix these issues in their own code, but must be aware they exist. Ark UI's Zag.js state machine architecture tests accessibility logic once in framework-agnostic JS, reducing the surface area for per-framework a11y bugs.

### Layer 2: Card Components — Framework-native, Tailwind-styled

Cards are layout, not interaction. Each scaffold ships framework-native card components styled with Tailwind:

- `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardActions`
- React scaffolds: `.tsx` components (shadcn/ui's Card)
- SvelteKit scaffolds: `.svelte` components (shadcn-svelte's Card, backed by Bits UI)
- Astro scaffolds: `.astro` components

These follow the shadcn/ui copy-paste ownership model — the developer owns the code and customizes freely. Interactive elements within cards compose Layer 1 primitives.

### Layer 3 (Optional): Data-Driven Card Schema

For projects that need cards defined as data (CMS-driven dashboards, notification feeds, configurable layouts), provide an opt-in card schema with per-framework serializers:

- A JSON schema defining 6-8 card types: `StatusCard`, `ChoiceCard`, `MetricCard`, `NotificationCard`, `DataTableCard`, `MediaCard`, `FormCard`, `CompositeCard`
- Per-framework serializer packages that render card JSON using Layer 2 components
- Inspired by Sanity's [Portable Text](https://github.com/portabletext/portabletext) architecture: schema -> serializers -> native components

**For AI-driven dynamic UI:** [Vercel json-render](https://github.com/vercel-labs/json-render) is the recommended implementation path. It defines a component catalog (Zod schemas), constrains LLMs to generate JSON specs against that catalog, and renders progressively across React, Svelte, Vue, and Solid. It ships shadcn/ui and shadcn-svelte renderers, aligning with Layers 1 and 2. json-render is young (Jan 2026, Vercel Labs) so treat it as the preferred direction, not a locked dependency.

This layer is opt-in. Most projects use Layers 1 + 2 only.

## Consequences

### Positive

- Cross-framework consistency — Ark UI provides the same interactive primitive API regardless of whether the project uses React, Svelte, or Vue.
- Full accessibility control — developers own the card components and can customize ARIA attributes, focus management, and keyboard behavior for WCAG compliance.
- Full styling control — Tailwind utility classes apply directly; no host config JSON or renderer-controlled styling.
- Incremental adoption — projects take only the layers they need. Layer 3 is opt-in for data-driven use cases.
- No ecosystem risk from a single-vendor dependency — Ark UI, Tailwind, and the card components are independent, well-maintained, and replaceable individually.

### Negative

- Per-framework card component maintenance — Summon must maintain card component templates for each scaffolded framework (React, Svelte, Astro). This is mitigated by the components being simple Tailwind-styled layout code.
- Layer 3 (card schema + serializers) is bespoke — no community to lean on. This is acceptable because Layer 3 is opt-in and only built when the first project needs it.
- Developers must learn Ark UI's API in addition to their framework's patterns. The API is small and well-documented; the cost is low.

### Neutral

- Adaptive Cards remain available as a documented option for Microsoft ecosystem integration. This ADR does not prohibit their use in that narrow context.
- The specific card types in the Layer 3 schema will be defined when the first project requires data-driven cards. The types listed above are indicative, not final.
- Streamlit and Gradio have their own component models that are fundamentally different from web component architectures. This card paradigm applies to web projects only; AI tool scaffolds should document idiomatic patterns for their respective frameworks.

## Accessibility Non-Negotiables

Regardless of which layer or library is used, all card implementations must meet these requirements:

- Semantic HTML — cards use `article` or `section` with appropriate heading hierarchy
- Keyboard operability — all interactive elements within cards are keyboard-accessible with logical focus order
- Color contrast — WCAG AA minimums (4.5:1 normal text, 3:1 large text)
- Accessible names — cards used as links or interactive regions must have accessible names
- Live regions — dynamic card content (loading states, live data) must use `aria-live` regions
- Reduced motion — motion within cards must respect `prefers-reduced-motion`
