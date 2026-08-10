# STUDIO-BYODS — Bring Your Own Design System

**Status:** B0 in progress (registry contract + default registry). Everything else is design.
**Companions:** `STUDIO-LEARNING.md` (corpus/retrieval), `STUDIO-CHAT.md` (presentation), `STUDIO-TOKENFIELD.md` + `STUDIO-FILLS.md` (the token-registry seam this generalises), `STUDIO-CANVAS.md` (the sandbox origin split this depends on for untrusted DS code).

## The pitch

A company keeps Studio's whole working surface (projects, screens, comments, selection, settings panel, audit trail, share links) but the model designs with **their** component library instead of `@gradeui/ui`. Grade stops being only a component library with a playground attached and becomes a design-infrastructure product: the editing, tracking, and commentability layer for any design system.

This came out of a June 2026 usability session, alongside "Sign in with Claude" (see Inference sources, below).

## Why it's tractable

Studio's shell is already DS-agnostic: storage adapters, the entity hierarchy (Org > Team > Project > Screen), comments, audit events, the canvas chrome, and persistence (raw JSX at `designs.state.appSource`) know nothing about gradeui. The playbook (`packages/studio/src/playbook/`) is pure data-in/data-out TS with zero runtime deps, which is exactly the shape a pluggable knowledge pack needs.

The gradeui coupling is concentrated and almost entirely *data baked as constants*, not structure:

| Coupling point | Where | Nature |
|---|---|---|
| Component allowlist + pins + external imports | `playbook/components/allowlist.ts` | TS constants |
| Sidecars (refs, retrieval aliases, prop manifests) | `playbook/components/sidecars.generated.ts` | generated TS constant |
| System prompt (interpolates allowlist, names `@gradeui/ui` inline) | `playbook/prompts/system.ts` | template function |
| Reference layouts / scaffolds | `playbook/layouts/` | gradeui-flavoured JSX content |
| Sandpack/Fast Frame bootstrap: `styles.css` import, pinned `@gradeui/ui` version, Tailwind CDN, fonts, `componentFiles` map | `apps/docs/lib/chat-sandpack.ts` | hardcoded strings |
| Theme generation: token names (`--primary` etc.), oklch assumption, shape presets (`data-button-shape` …) | `apps/docs/lib/themes/*` | hardcoded naming |
| Selection agent keys off `data-gds-part` | `chat-sandpack.ts` (in-iframe agent) + `screen-context.ts` | one attribute name |
| Walker registration of PascalCase names | `apps/docs/lib/studio-walker-register.ts` | reads allowlist (fine once allowlist is registry-fed) |

## Three levels of "their design system"

"Bring your own design system" means three different things, with wildly different cost, and the registry has to express all three rather than assuming the hardest one:

**Level 1 — Theme pack (most customers, most of the value).** Their brand on Grade's components: tokens, fonts, radii, shape presets, plus a `design.md` of house rules ("never use elevated cards", "primary actions are always filled"). Components stay `@gradeui/ui`. This is *mostly already built*: per-project theme drafts are the substrate (STUDIO-THEMES), and the compose pipeline already reads a `design.md` alongside the page. What's missing is packaging: a named, org-owned bundle of theme + guidance that applies across every project, instead of a per-project draft.

**Level 2 — Theme pack + custom knowledge.** Level 1 plus their own scaffolds (reference layouts in their idiom) and extra sidecar-style guidance, possibly restricting the allowlist ("our DS has no Carousel"). Still zero new runtime code: it's prompt + content, all data. Note that mature design systems already HAVE this content in some form: a COMPONENTS.md equivalent, usage guidelines, docs pushing certain components over others. Piloting with real external systems means ingesting those steering documents as registry content (sidecars + prompt guidance), not just their component list — expect a conversion pass per system, and expect the pilot to be the thing that hardens the sidecar schema.

**Level 3 — BYO npm components.** Their actual component packages (`@acme/ui` from npm, or an uploaded bundle) replace `@gradeui/ui` in the preview and in generated imports. Only here do the hard problems appear: sidecars must exist for their components, the preview needs their deps resolvable, the selection agent needs their part attribute (or selection degrades to tag-level), themes only work if their components consume CSS variables at all, and uploaded bundles hit the sandbox-origin security wall (see Security note). Level 3 is the headline, but levels 1 and 2 are the product most companies actually need first.

The registry expresses this as **layering**: every field is optional and a registry `extends` a base (default `gradeui`). A Level 1 registry is `{ extends: "gradeui", theme, prompt.designMd }`. A Level 2 adds `components.allowed` (subsetting), `sidecars`, `scaffolds`. A Level 3 replaces `package` and supplies its own component surface.

## The contract: `DesignSystemRegistry`

One interface describes everything Studio needs to know about a design system. It lives in `@gradeui/studio` under `src/registry/`, and the existing playbook constants become the **default registry** (`GRADE_REGISTRY`). Nothing about the playbook's authoring pipeline changes: sidecars are still `.md` files inlined by `generate-sidecars.mjs`; the registry is the delivery shape, not a new authoring format.

```ts
interface DesignSystemRegistry {
  /** Stable identifier ("gradeui", "acme-ds"). Keys storage + caching. */
  id: string;
  /** Human name used in the system prompt ("Grade Design System"). */
  name: string;
  /** Base registry to layer on. Level 1/2 registries extend "gradeui"
   *  and override only theme/prompt/content fields; absent = standalone
   *  (Level 3, must supply the full component surface). */
  extends?: string;

  package: {
    /** Barrel the model imports from ("@gradeui/ui"). */
    name: string;
    /** npm version the preview resolves (chat-sandpack owns this until B2). */
    version?: string;
    /** Stylesheets the preview iframe must load. */
    styleImports: readonly string[];
  };

  components: {
    allowed: readonly string[];
    pinned: readonly string[];
    externalImports: readonly string[];
    /** filename → raw sidecar md. Feeds refs, retrieval, prop manifests. */
    sidecars: Readonly<Record<string, string>>;
  };

  selection: {
    /** Attribute the library stamps on addressable parts ("data-gds-part"). */
    partAttribute: string;
  };

  // B2+ (designed, not in the v1 type):
  // theme: { tokenMap, shapeOptions, fonts } — Level 1's payload; wraps the
  //   existing ThemeInput contract (STUDIO-THEMES) rather than a new shape
  // prompt: { designMd, extraRules }    — house rules injected as a prompt
  //   stanza; designMd reuses the compose pipeline's design.md convention
  // scaffolds: ReferenceLayout[]        — reference layouts for this DS
  // runtime: { dependencies, externalResources } — Level 3 preview resolution
}
```

Design rules:

1. **The registry is data.** No functions, no React, no fs. Serialisable as JSON so it can be stored per-org in Supabase, served over an API route, or shipped as an npm package (`@acme/studio-registry`). Same constraint that makes the playbook serveable from `@gradeui/mcp`.
2. **gradeui is just the default.** `GRADE_REGISTRY` is assembled from the existing constants; every playbook entry point gains an optional registry parameter defaulting to it. Output with the default must stay byte-identical, so this is a refactor with a zero-diff verification step.
3. **Sidecars are the unit of onboarding.** A customer DS becomes usable exactly when its components have sidecars. The frontmatter schema (`props`, `when_to_use`, `composes_with`, `aliases`) is already library-agnostic; `generate-sidecars.mjs` already turns a folder of `.md` into the inlined map. Customer onboarding is therefore a content pipeline, not an integration project. A "sidecar generator" skill (point it at a component folder, draft sidecars for human review) is the obvious accelerator and fits the existing @gradeui/skills suite.
4. **Don't collide with `token-registry.ts`.** The inspector's token registry (STUDIO-TOKENFIELD) describes *tokens* for value editing; this registry describes *the design system* for generation. The theme/token portion of B3 should slot the existing token registry in as a field rather than reinventing it.

## Rollout

**B0 — Contract + default registry (now).** `src/registry/{types,gradeui}.ts` in `@gradeui/studio`. `buildSystemPrompt(registry?)` parametrised on the component list, DS name, and package specifier; `GRADE_REGISTRY` default keeps output byte-identical. No consumer changes.

**B1 — Refs + retrieval + manifest go registry-fed.** `refs.ts` loses its module-scope `SIDECARS` cache in favour of a per-registry cache (keyed by `registry.id`). `renderComponentRefsBlock`, `relevantComponentNames`, `buildComponentManifest`, and `createScreenContext` take the registry. The `/api/component-manifest` route resolves the active registry per request. `studio-walker-register.ts` and `stage-b-inspector.tsx` read `registry.components.allowed`.

**B2 — Preview bootstrap.** `buildSandpackFiles()` + the Fast Frame entry stop hardcoding `@gradeui/ui`: style imports, the npm dependency map, the `componentFiles` map, and auto-import resolution all derive from the registry. The selection agent takes `partAttribute` as config. This is the riskiest slice (chat-sandpack is 2600 lines and feeds both renderers; any new behaviour needs handlers in BOTH `fast-sandbox/page.tsx` and `chat-sandpack.ts`).

**B3 — Theme + guidance + scaffolds (ships Levels 1 and 2).** Theme generator/apply parametrised by a token map + shape options (wrapping `ThemeInput`); `prompt.designMd` injected as a house-rules stanza; scaffolds load from the registry (the `.jsx` + `.md` pair format already has no structural diff from built-ins, per the reference-layouts remix loop). A registry with no scaffolds just gets an empty Layouts tab. Note B3 does not depend on B2: a Level 1/2 registry never touches the preview bootstrap, so if Level 1 demand arrives first, B3 can land before B2.

**B4 — Loading + commercialisation.** Per-org `active_registry` in Supabase (jsonb or a pointer to an uploaded registry package), an admin surface to upload/validate one, and RLS so a customer's registry is theirs alone. Validation = the existing contract validator run against the registry's own sidecars. This is where BYODS becomes a sellable tier: the hosted SaaS gates "custom registry" behind the paid plan; self-host gets it free, consistent with the hosted+self-host split.

## Tokens: the layering rule (and the interim work)

Real-world reference: a client DS encountered June 2026 ships as four npms (tokens, components, icons, illustrations — the `@brightlocal/*` split). The structure is right, but their tokens package contains component-associated tokens (button paddings, input borders living in `@brightlocal/tokens`). That's a dependency inversion: the tokens layer ends up knowing about components above it, so you can't consume "just the brand" without dragging component opinions along.

The rule BYODS needs, and gradeui should model:

1. **Primitives** (color ramps `--gds-green-50…950`, gray scale, spacing scale, radii, type scale, font stacks): component-agnostic, belongs in a tokens package.
2. **Semantic aliases** (`--gds-success: var(--gds-green-600)`, `--primary`, `--background`): the theme contract; also tokens-package territory. This is the layer themes actually rewrite.
3. **Component tokens** (`--gds-carousel-arrow-bg`, `--gds-composer-border`, ~50 families): part of each component's CONTRACT, so they ship WITH the components package and *reference* layers 1–2. They are not portable and must never migrate into the tokens layer.

Where gradeui stands today: the layering is conceptually clean inside `packages/ui/styles/globals.css` (ramps → semantics → spacing/radius/type → OKLCH theme defaults → component palettes, in that order), but physically it's one 2000-line file inside `@gradeui/ui`, and `@gradeui/core` — the natural tokens package — is still the placeholder scaffold whose own header documents the migration (move `lib/themes/*`, tokens, `cn`). So gradeui is currently shaped like the thing we'd critique in a customer DS: tokens and components in one npm.

**Update (June 10, 2026): the core extraction is DONE for layers 1–2.** `@gradeui/core` now ships `tokens.css` (authored source of truth: ramps, neutrals, semantic aliases, spacing, radii, font stacks, type scale) plus generated typed data (`GDS_COLOR_RAMPS`, `GDS_SEMANTIC_ALIASES`, `GDS_FONT_FAMILIES`, …) via `scripts/generate-tokens.mjs`. Both `packages/ui/styles/globals.css` and `apps/docs/app/globals.css` now `@import "@gradeui/core/tokens.css"` instead of carrying copies — verified var-identical compiled output. The theme engine (`lib/themes/*`) migration is still pending.

**Product direction on top of this (from the June 10 session):** Grade is Tailwind-first, so ramps get LOCKED as the vocabulary — a brand doesn't invent arbitrary token names, it (a) chooses a primary palette, a secondary/accent palette, and a neutral gray palette, and (b) optionally overrides specific ramp steps in a **variables viewer** (table/grid of collections → groups → swatch cards, in the spirit of Figma's variables panel) so their tokens match exactly. Because everything downstream references the ramps, a step override re-skins every semantic alias and component token pointing at it. Overrides are theme/org data (the substrate is the existing theme draft / future first-class themes per STUDIO-THEMES), never edits to core. A "Connect to Figma" sync on the viewer is the obvious later step — push ramps to Figma variables or pull a brand's.

**The original interim work item, for reference:** execute the `@gradeui/core` extraction. Layers 1–2 plus the Tailwind preset move to `@gradeui/core`; `@gradeui/ui` depends on it and keeps layer 3; re-exports preserve consumers. That gives Grade the same consumable "real primitives" package the four-npm split gets right (ramps + semantic contract + preset), makes `registry.theme` a thin wrapper over an actual package boundary instead of a convention, and means a Level 3 customer whose DS has a tokens npm maps onto Studio one-to-one: their tokens package ↔ layers 1–2, their components ↔ layer 3 + sidecars.

## Scales, density, and contextual resolution (June 10 session, continued)

The primitive layer grew two semantic font slots (`--font-display`, `--font-body`, both defaulting to the sans stack) and `GDS_MODULAR_SCALES`: musical-interval ratios (minor second 1.067 → golden ratio 1.618) plus a `modularRamp(base, ratio, steps)` helper. The direction:

1. **Generated ramps over hand-picked steps.** Type scale AND size/spacing become ramps derived from base × ratio, generated MIDDLE-OUT (the Utopia model, utopia.fyi/type/calculator): the body size anchors step 0 in the middle of the ladder, headings multiply up by the ratio, small text multiplies down by the reciprocal with a minimum floor. The ladder vocabulary is Tailwind's size names with base mid-ladder (2xs, xs, sm, base, lg, xl, 2xl … 7xl — `GDS_TYPE_SIZE_NAMES` / `modularTypeSizes` in core), which is what lets a generated scale eventually populate the `--text-*` theme variables Tailwind v4 utilities read. Utopia's fluid half (clamp() between a small-viewport and large-viewport ladder) layers on later. The theme generator's flat `compact | default | spacious` multiplier and `spacing.density` both collapse into this one concept: a modular scale IS the density scale. SHIPPED June 10: `ThemeInput.typography.scale` now accepts modular ids alongside the presets (both lib/themes copies), and the theme-builder typography section has the Scale picker.
2. **Contextual resolution.** The active ratio is not one global value — it can resolve by surface kind (website vs app), by section (hero vs settings form), or responsively via viewport/container queries. Switching a view's density = swapping one ratio, which is what makes "change views quickly" cheap.
3. **Hue-pick primary.** The theme engine is already hue-based (`ThemeInput.hues.primary`), so "pick a hue, primary ramp regenerates" is pure UI surfacing in the variables viewer / theme picker.
4. **Screenshot → palette.** Upload a reference screenshot, extract a palette, map it onto primary/secondary/neutral + ramp-step overrides. This is what makes override SCOPING matter: overrides need to attach per project (the brand) or per screen (this one reference-matched view). The theme variant substrate (STUDIO-THEMES T0) is the natural carrier.
5. **Docs.** `/docs/tokens/core` documents the package (data-driven from the GDS_* exports, so it can't drift); `/variables` is the visual browser.

## The style panel: agnostic contract, personalised data

SHIPPED June 10: `components/style-panel/` — the portable, contract-based panel. `StylePanel` wraps the theme-builder primitives (provider + header + controls + footer) and is provider-INHERITING: inside Studio it attaches to the page-level `ThemeBuilderProvider` (no state fork); standalone it creates its own from an `initial: ThemeInput`. `StylePanelPopover` hosts the same panel in a popover for one-off uses ("override the style of THIS screen" — pair with `bindTo="draft"` + a screen-scoped ThemeVariant, or `bindTo="scoped"` + `ThemeBuilderScope`).

The organising principle (Ali, June 10): **agnostic but personalised**. The contract stays generic so components, the model, and BYODS imports all speak one vocabulary; everything brand-specific is data layered on top, configurable in the Studio style panel. Concretely, the panel grows three configurable groups, all writing theme data, never component code:

1. **Palette** — primary / secondary / neutral choice, hue-pick (regenerates the ramp via the existing hue-based generator), per-step overrides, screenshot extraction. Built on `GDS_COLOR_RAMPS`.
2. **Typography** — display font / body font / mono (the `FONTS` catalog + `--font-display` / `--font-body` slots), plus a modular-scale ratio per context. Built on `GDS_MODULAR_SCALES`.
3. **Surfaces & roles** — where primitives map to components.

### The brand kit: fonts and logo (June 10 addition)

Two more pieces make the personalisation complete, and both have existing substrates:

- **Custom fonts.** Upload a font file and use it in themes. STUDIO-STORAGE already anticipated this ("their own images, later fonts"): the asset bucket stores the file, the `FONTS` catalog gains custom entries (`custom:<asset-id>` alongside the built-in FontKeys), the theme contract carries the reference, and an `@font-face` block is injected wherever the theme applies. The injection has to obey the two-renderer rule (fast-sandbox AND chat-sandpack) plus the docs page itself. Licensing note for hosted mode: user-uploaded fonts are user-licensed; we store and serve per-org, never share cross-org.
- **Brand logo.** The `Logo` component already models square / horizontal / icon × light / dark / mono with consumer-supplied artwork. The product insight: a single SQUARE mark (the Instagram/Twitter avatar shape every brand already has) is the minimum viable upload and translates to every placement — sidebars, headers, favicons, avatars. Ask for one square image; accept the fuller set when they have it. Logo assets ride the same storage bucket and the theme/org carries the references.

Both belong to the style panel's brand group and to the import story: a reference screenshot usually CONTAINS the logo, and font identification from imagery is part of "just knows" (even if v1 just asks).

### Surfaces: the fluid-functionalism verdict

Reference: fluidfunctionalism.com/docs/surfaces — eight nesting surface levels, a substrate context so components read their level from their container and lift RELATIVE to it (fixes "popover at surface-5 disappears inside a surface-5 dialog"), an `Elevated` wrapper primitive. Verdict: **very translatable**. It's shadcn-ecosystem already (installs via the shadcn CLI), and Grade has two-thirds of it: the presence system (PRESENCE.md: `shadow-elevation-0..5` + `rds-surface-*`) covers tokens; what Grade lacks is the *relative substrate context*. That's the piece to adopt: a surface context (React context + CSS vars on the wrapper, `data-gds-surface-level`) so overlays resolve depth from nesting. Adopt the mechanism, keep Grade's token names. And yes — ship picked defaults per surface; the context system is what makes the defaults composable rather than hard-coded.

### Component contracts: the override ladder's top rung (Level 2.5)

The June 10 session's closing insight: most components are structurally identical across brands — what differs is color, spacing, radius, type. So if every CORE component exposes a complete, enumerable token surface (its full variant × state matrix), then "give the user their own design system" decomposes into overrides at three depths, and the BYODS levels become a continuous ladder rather than discrete jumps:

1. **Theme override** (exists): hues, fonts, scale — the generator re-skins everything.
2. **Ramp-step override** (variables viewer): match exact brand values.
3. **Component assignment** (the new piece): pick a component — Button — and assign color values per variant and state (default/destructive/outline/ghost × rest/hover/active/disabled/focus), plus add/remove variants. Done for all core components, this IS a brand's design system, expressed as data against Grade's structural contracts.

What it takes, honestly assessed:

- **Complete the component token surfaces.** ~50 `--gds-<component>-*` families exist but coverage is uneven — many components read semantic roles (`bg-primary`) directly with no per-component indirection, and state/variant axes are mostly NOT tokenised. The real work is a "tokenise the surface" pass per core component: every painted property routes through `--gds-<comp>-<variant>-<state>-<prop>`, defaulting to the semantic roles so zero visual change ships. Mechanical but large; pilot on Button first.
- **Enumerate them as data.** The contracts pipeline (`generate:contracts`, `.contract.ts`) already enumerates props; extend it to enumerate the token surface so the style panel can render an editor for any component without hand-built forms (same auto-generated philosophy as the settings panel).
- **Store as `ThemeInput.componentOverrides`** — component → variant → state → token → value-or-ramp-ref. Keeps the contract deterministic and portable; ramp REFS (not raw values) wherever possible so palette swaps cascade.

Then the endgame Ali named: with override contracts at all three depths, you can **"import" a design system** — parse their tokens (npm tokens package, Figma variables, or extracted from screenshots) and map them onto the contracts for reasonable parity. That's the halfway house. Full fidelity is still the npm swap (Level 3). The ladder: theme override → ramp overrides → component assignment → parity import → BYO npm. Each rung is cheaper than the next and covers more brands than you'd expect.

### Roles: the "neutral primary button" problem

A brand may want black (neutral) primary buttons in app chrome but brand-colored ones in marketing. Wrong answer: a Button variant per case (component code becomes personal). Right answer: **role indirection per surface kind** — the semantic action role (`--primary` as consumed by Button) resolves differently by context: marketing surface maps action → brand ramp, app surface maps action → neutral-950. Same generated JSX, same component, different surface kind = different resolution. This composes with the scale/density-per-surface-kind direction (website vs app) — surface kind becomes the axis that switches BOTH color roles and density ratio. shadcn's flat `--primary` is the degenerate single-surface case, which keeps the vocabulary compatible.

## Security note (hard prerequisite for B4)

Running a *customer's* component bundle in the preview means executing other people's code. Today's same-origin iframe is not a boundary (STUDIO-CANVAS calls this out as the sandbox origin split, K-series). BYODS for first-party use (we assemble the registry, components come from npm) can ship before the split; accepting **uploaded** component bundles cannot.

## Inference sources (the session's second ask)

Separate workstream, recorded here because the two land together commercially: from **June 15, 2026** Anthropic supports third-party apps authenticating with a user's Claude subscription via the Agent SDK, billed against a monthly Agent SDK credit ($20 Pro / $100 Max 5x / $200 Max 20x, per-user, no rollover, API rates). That makes "Sign in with Claude" a sanctioned third inference source alongside Google free-tier BYOT and BYO API keys, and it slots into the existing three-deployment-modes architecture without hosting free inference. Do not reuse Claude Code OAuth tokens directly (still prohibited); the Agent SDK flow is the path. Ref: https://support.claude.com/en/articles/15036540
