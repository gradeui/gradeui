# STUDIO-EXPRESSIVE.md — the Expressive (Scope) colour system

Status: design contract / spec. Source of truth for the expressive-colour work
across the generator, the Studio in-app colour table, the Figma variables, and
the `grade-theme-sync` skill. Read this before building any of those pieces.

## What expressive colours are

Expressive colours are a **highlight layer**, not the base UI. They paint
**sections** — marketing banners (including banners *inside* an app or product),
feature cards, promo strips, editorial blocks — anywhere you want an on-brand
splash that is deliberately louder than the neutral product chrome.

They are NOT for base surfaces, body text, form controls, or anything structural.
The semantic layer (`surface/*`, `action/*`, `border/*`) still owns the product
UI. Expressive sits on top, scoped to a region.

Borrowed in spirit from eBay's `expressiveTheme`, but **renamed to be generic**
(see below) and wired to Figma variable modes for one-click switching.

## Naming — generic, never the hue

The eBay model names by hue (`expressiveTheme.avocado.light`). We deliberately do
NOT. The hue is editable and theme-able, so a hue name in the token would lie the
moment someone retunes it. Names are **positional / generic**:

- Elevated ramps: `expressive-accent1` … `expressive-accent5` (5 slots), each a
  full 50–950 ramp.
- CSS custom properties: `--gds-expressive-accent{N}-{step}` — e.g.
  `--gds-expressive-accent1-500`. (Follows the runtime `--gds-*` namespace from
  the root CLAUDE.md. NOTE: the brief wrote `gb-`; treating that as a typo for
  `gds-` — confirm if a different prefix is wanted.)
- Figma primitives: `expressive/accent{N}/{step}` (e.g. `expressive/accent1/500`).

A slot (`accent1`) is a position, not a colour. Its hue can change without any
token rename.

## The 5 elevated accents (the pairing tool)

Five "elevated" accent slots, generated as OKLCH ramps via the existing
`hueToRamp`. Defaults are spaced **20° apart in OKLCH hue** so they read as a
balanced, distinct set out of the box; each slot is **user-editable** (the
pairing tool). Five slots × the pairing model below give more than enough
combinations to showcase a system without hand-picking colours.

- Generation: same ramp engine as the themes (`apps/docs/lib/themes/generator.ts`
  → `hueToRamp`), so expressive ramps share the system's lightness/chroma curve.
- Editable: each slot's hue (and optionally chroma) is a knob; everything
  downstream (pairs, CSS vars, Figma values) re-derives.

## The pairing model — four tiers, each a bg+fg pair

Every expressive accent resolves to **four** surface tiers — the long-favoured
`superlight / light / dark / superdark` combo (the same four-step surface idea as
the portfolio's RDS theme classes), here keyed off the accent ramp. Each tier is
a background + a foreground that's legible against it:

| variant     | background      | foreground      |
|-------------|-----------------|-----------------|
| Super Light | `{accent}/100`  | `{accent}/900`  |
| Light       | `{accent}/300`  | `{accent}/900`  |
| Dark        | `{accent}/700`  | `{accent}/100`  |
| Super Dark  | `{accent}/900`  | `{accent}/100`  |

(Backgrounds 100/300/700/900 are the locked tiers. Foregrounds are the
contrasting end — confirm the exact fg steps; the generator should ideally
*verify* each pair clears a contrast threshold and nudge the fg step if a retuned
hue breaks it.)

Pair tokens (generic, position-based):

- `expressive/bg/{superlight,light,dark,superdark}`
- `expressive/fg/{superlight,light,dark,superdark}`

So a section picks `expressive.superdark` and gets `bg =
expressive/bg/superdark`, `fg = expressive/fg/superdark` — a complete, accessible
scope. (8 pair variables total per accent mode, was 6.)

## Switching — Figma variable modes + an in-code scope

The whole point is **easy switching between accents**. The bg/fg pair variables
are a *single* small set; **which accent they resolve to is the mode**:

- **Figma**: a dedicated collection (e.g. **"Expressive"**) with **6 variables**
  — `expressive/bg/{light,medium,dark}` + `expressive/fg/{light,medium,dark}` —
  and **modes = Accent 1 … Accent 5** (generic names). Each variable aliases the
  matching step of that mode's accent ramp. Flip the mode → the whole section
  reskins. The accent ramps themselves live as `expressive/accent{N}/*`
  primitives (their own collection/mode, or alongside themed primitives — TBD,
  but keep them separate from the 10-mode-capped theme primitives).
- **In code**: a scope mechanism — a `data-expressive="accent3"` attribute (or a
  scope class) on a section that remaps `--gds-expressive-bg-*` /
  `--gds-expressive-fg-*` to that slot's ramp. One attribute reskins the region;
  nothing structural changes.

This is the "pull them into a separate collection that cycles via variable mode"
idea, made generic.

## In-app display — the colour table (TokenField chips)

Every colour in the system — core ramps, semantic tokens, AND these expressive
pairs — renders in a Studio reference **table** built from the inspector's
**TokenField chips**: rows of `Title · Background chip · Foreground chip`, exactly
like the eBay reference table. One display component powers both the read-only
reference view and the expressive picker. (This is also how the user wants tokens
shown in-app generally.)

## Pipeline / ownership

1. **Generator** (`apps/docs/lib/themes/`): add an expressive generator that
   takes 5 hues (defaults 20° apart) → 5 ramps → the bg/fg pair map. Emit
   alongside `themes-figma.json`.
2. **Figma** (`grade-theme-sync` skill): create the Expressive collection (6 pair
   vars + accent-mode aliasing) + the expressive accent primitives.
3. **In-app**: the colour-table component + the `data-expressive` scope.
4. **Shader generation**: the expressive accent ramps feed shader/WebGL
   generation DIRECTLY as the palette source — a generated background/section
   shader pulls its colours from the active `expressive-accent{N}` slots (and
   their light/medium/dark pairs) rather than ad-hoc hex. So switching the accent
   mode reskins the shader too, and the shader stays on-brand by construction.
   (Hooks into the existing shader work — `renderers/*`, the experiments shader
   tiles, and the theme's `experimental.shaders` channel.)
5. **This doc** is the knowledge the model/skill reads: "expressive colours
   highlight sections, mainly marketing; switch via mode; never base UI; they are
   also the palette for generated shaders."

## Feeding the generation prompt (project brief + theme knowledge)

Tokens alone don't tell the model *when* to be expressive or *what the product
is*. Two pieces of context must ride along in the Studio generation system
prompt, stitched in next to the registry-fed token list (see the system-prompt
stitching in `apps/docs/STUDIO.md` / `apps/docs/lib/chat-sandpack.ts`, and the
registry contract in `STUDIO-BYODS.md`):

1. **This `theme.md`** — the expressive contract above. The model reads it and
   learns the rule: "expressive colours highlight sections, mainly marketing /
   banners inside a product; switch via accent slot; never base UI." So a "make a
   promo banner" prompt reaches for `expressive.*`, and a "build a settings form"
   prompt does not.

2. **A project brief — "what this product is for"** — authored in the **Design
   System** (project level), NOT per screen. One short description of the product
   / brand / audience (e.g. "Pebble — a calm personal-finance app for freelancers;
   trustworthy, warm, not flashy"). This is the App-Brief idea from
   `STUDIO-LEARNING.md`: a project-scoped field that every generation reads, so
   screens share a coherent intent instead of being generated in a vacuum.

3. **Project do / don'ts — the voice + content rules** — also authored in the
   Design System (project level). A short, declarative list that steers the COPY
   and choices the generator makes, e.g.:
   - DON'T use em dashes.
   - DO write specific, non-generic CTAs ("Start your 30-day trial", not "Learn
     more" / "Click here").
   - DON'T invent fake testimonials / logos.
   - DO match the brand voice from the brief.
   These are project-scoped guardrails, distinct from the brief (what the product
   is) and the theme contract (how colour works). Together: brief = *what*,
   do/don'ts = *how it should read/behave*, theme.md = *how colour works*.

Wiring: the project brief, the do/don'ts, and the theme docs are stored fields on
the project (surfaced + edited in the Design System section of the right column /
project home), concatenated into the system prompt alongside the token registry.
Keep each short and declarative — they're steering, not a spec. The do/don'ts in
particular work best as a flat bulleted list the model can follow literally.

## Open decisions (confirm before building)

- The light/medium/dark step pairs above — lock as-is, or contrast-verify + nudge?
- Prefix: `--gds-expressive-*` (assumed) vs the literal `gb-` from the brief.
- Where the 5 accent ramps live in Figma (own collection vs themed-primitives) —
  leaning own collection so they're theme-independent and not under the 10-mode cap.
- Do expressive accents vary per theme, or are they one shared set across themes?
  (Brief implies one editable shared set — "5 elevated colours" — not per theme.)
