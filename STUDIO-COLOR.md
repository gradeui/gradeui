# Studio Colour — palette, pairs, and surfaces

How a theme reaches *and adheres to* an arbitrary brand's colours, and how surfaces (sections, cards, buttons, badges) wear them, without forking the colour system.

> Status: design direction. Drafted 2026-06-19 (an evening of working it out from the Superside site).
> Sibling of [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (the theme is a deterministic `ThemeInput`) and [`STUDIO-TYPOGRAPHY.md`](./STUDIO-TYPOGRAPHY.md). This doc is the plan we have at tomorrow — nothing here has shipped except where noted.

---

## The problem

Two gaps surfaced trying to rebuild marketing layouts (Superside: dark-green hero, mint headings, a bright-lime "Book a demo" pill, dark text on it):

1. **You can't reach a specific colour.** The Colours editor is hue + a chroma *multiplier* over a **pinned lightness curve**. You can get the green *hue* but never the exact bright lime, the curve fixes each step's lightness, and `--primary` (the button fill) sits mid/dark so white text passes. A multiplier scales the whole curve; there's no value to *land on*.

2. **Foreground is a per-surface afterthought.** A section can set a background but nothing tells the text inside what colour to be. There's a background fill, no **text fill**. So "dark surface, light text" isn't expressible as a unit.

The fix is one idea in three layers.

## The layering

```
Core palette       → locked OKLCH swatches (the brand's actual colours)
Roles              → brand · accent · semantics (error/success/…) · pairs/triplets
                     — ALL select from the palette, nothing hardcodes a hue
Surfaces           → Section / Card / Button / Badge ASSIGN a role
```

Each layer only references the one below it. Override is always available at any layer — the layers are defaults, not a cage.

The **core palette is the single pool**, and *everything* selects from it: brand and accent are palette picks, the marketing pairs/triplets pick strong pairings from it, and the **semantic roles (error / success / warning / info) become palette selections too** rather than separately-generated hues. That's the maximum-impact move — one palette, and every role is a reference into it. The locked swatches (layer 1) *are* the palette entries.

**UI:** the `Swatch` / `SwatchGroup` primitives render the palette in the Colours section. A `Swatch` reads a `token` name (re-voices with the theme) or a raw `color`; `onSelect` makes it a pickable chip with a selection ring; `SwatchGroup` lays a set out. Selecting a swatch + editing it with the OKLCH L/C/H control (layer 1) is the pick-and-tune loop. (Swatch's native colour well is hex-only, so OKLCH editing rides our own control, not the OS picker.)

## 1. Palette — OKLCH anchors + locked swatches

Surface the **actual OKLCH**, not an abstraction. The ramps are already stored as raw `L C H` triplets internally (`oklch(var(--x))`), so this just exposes what's there.

- **Friendly labels, real channels.** Keep Hue / Vibrancy / Lightness as the names (the user liked "vibrancy"), but back them with the anchor's true `H` / `C` / `L`. Vibrancy *becomes* the real chroma value, so the slider lands on a number instead of nudging a curve. An optional raw-OKLCH readout for precision.
- **Hex paste → OKLCH.** We already have OKLCH→hex (`oklchToHex`); the inverse wants culori (what oklch.com uses).
- **Locked swatches (brand adherence).** Paste an OKLCH → assign it to the **nearest ramp step by lightness** (`#0a221f` at L≈0.23 → ~900; a lime at L≈0.85 → ~200/300) → **pin** it exactly → **lock** it as a fixed anchor. The generator then **interpolates L/C/H between locked stops** instead of riding the fixed curve; Hue/Vibrancy/Lightness edits only move *unlocked* steps. Lock several (dark-green @900 + lime @300) and the ramp threads through them all. This is the Leonardo / Tailwind-palette locked-swatch model.
- **Contrast-derived foreground.** `--primary-foreground` is currently a fixed light step, so a bright primary gets invisible light text. It must be chosen by contrast so it flips dark on a bright fill (the lime pill).

Contract (additive, deterministic generator): per-ramp locked stops, e.g. `input.ramps?.{primary,accent,neutral}?.locks?: Record<RampKey, OKLCHtriplet>`; channels stored as real values, not multipliers. **Shipped tonight (interim):** a continuous Vibrancy (chroma-multiplier) slider in `HueRow` — useful, but it's the multiplier this plan replaces with the true `C`.

→ Task **#29**.

## 2. Pairs & triplets — named surface roles

Promote colour pairs to **first-class, authored, named** theme entities.

- A **pair** = background + on-colour (foreground).
- A **triplet** adds a third role — accent, *or* border, *or* muted text (pick the most useful; likely muted-text for sections, accent for action surfaces).
- A surface **assigns** a named pair rather than setting bg/fg ad hoc. Foreground stops being an afterthought because it's *baked into the role*.

We're already halfway there: every `--x` / `--x-foreground` is an implicit pair (`card`/`card-foreground`, `primary`/`primary-foreground`, the soft pairs via `deriveAlertPair`). The move is to make them **user-authored and named** instead of fixed. A brand like Superside becomes "here are my five pairs," and everything references them. Pairs bind locked swatches (layer 1) with a guaranteed contrast check.

Why it's quick + worth it: pairs are then trivially themeable, swap the pair definitions and every surface re-skins, and the per-surface override still exists for one-offs.

→ Task **#33** (umbrella; absorbs #30 and #32).

## 3. Surfaces — assign a role, override when needed

Surfaces reference a pair via a **thin override layer**: scoped tokens that default to inherit and only diverge when set.

- **Components** (Button first, then Badge/Card): `--gds-button-bg` / `--gds-button-fg` default to `var(--primary)` / `var(--primary-foreground)`; a Buttons sub-section points them at a ramp step (e.g. primary-400 for a lighter button), a brand pop, or a named pair. Global `--primary` never moves — only buttons do. Precedent: the `raised` Button's `--btn-glow`, `data-button-shape`, the `--gds-*` component vars. → Task **#30**.
- **Sections**: an official `<Section>` carries a **surface pair** (background + foreground), establishing a local colour context for its subtree — it sets `background` + `--foreground` / `--muted-foreground` (+ `color`) so every heading, paragraph and caption inside re-tones automatically. Same "themed island" trick that fixed `ThemePreviewScope`. → Task **#32**.

### Marketing `<Section>` primitive

Sections also need **structure**, not just colour: a standard vertical-padding scale, a max-width inner container, and consistent rhythm, so you drop self-contained bands down a page. The surface pair + the padding scale is essentially the whole marketing-section story.

## What shipped tonight (2026-06-19)

These landed and are verified (parse-clean, changesets + memories where relevant):

- **Accent font role** — supplementary display face (Display/Body/Mono/**Accent**), defaults to Instrument Serif, overridable; `--font-accent` + `font-accent` utility.
- **Heading mini-editor** — TipTap inline editor wired into the selection inspector for h1–h6: select a word → Accent / bold / italic span → splices back into source. **Accent swaps the font only; italic is a separate mark.**
- **Token-first letter-spacing** — the shared `TokenField` chip (`tracking-tight · -0.025em`) in the Typography editor.
- **Vibrancy slider** — continuous chroma in `HueRow` (interim; see layer 1).
- **MediaSurface aspect fix** — an explicit `aspect` prop now wins over a baked-in `className` aspect (inline `aspect-ratio`).
- **Inter Tight** added to the font registry.
- **`get_theme` / `save_theme`** MCP tools (read/write `projects.theme_draft_json`).

## Open tasks

- **#29** — OKLCH anchors + locked swatches + contrast foreground (layer 1).
- **#33** — Theme-level pairs & triplets (layer 2, umbrella).
- **#30** — Component-scoped token overrides, Buttons first (layer 3).
- **#32** — Section surface pairs: text fill + the marketing `<Section>` primitive (layer 3).
- **#31** — Tailwind class autocomplete in the Studio SourceEditor (token-first class list).
- **#24** — Focus-ring browser-default + override option.
- **#20** — TY2 typography generator pass.

## Guiding principle

**Minimum extra tokens, maximum impact.** The whole point of pairs is leverage: a handful of named pairs re-skin every surface, so resist token proliferation. Don't add a token per component per state; add a *role* and let surfaces assign it. If a new token doesn't earn its keep by re-skinning many places at once, it shouldn't exist. (This is the thing that makes hand-authored theming painful — a sprawl of one-off tokens — and the thing pairs fix.)

## Decisions locked

- **Minimum extra tokens, maximum impact** (above) — the north star for every addition.
- Pairs/triplets are **first-class and named**, not fixed `--x-foreground` conventions.
- **Override is always available** at every layer; the layers are defaults that inherit.
- **Vibrancy stays as a label** but is backed by the real OKLCH `C`, not a multiplier.
- **Locked swatches** are how a brand is adhered to — pin the exact colour at its nearest step, generate the rest around it.
- A **Section** is a surface pair *plus* a standard padding/container scale.
- The global palette stays the single source of truth; surfaces pick from it or override.
