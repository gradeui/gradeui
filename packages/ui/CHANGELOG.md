# @gradeui/ui

## 3.3.0

### Minor Changes

- 7d0353f: Button sizing reworked to match the Figma Button with zero drift:

  - `2xs` and `xs` are now first-class `size` values (previously only in the cva, so they worked at runtime but the Studio inspector treated them as raw overrides). `2xs` corrected to `h-5` (20px). Full ramp: 2xs 20 · xs 24 · sm 28 · md 32 · lg 40.
  - New `iconOnly` boolean: squares the button at the current `size` height (width = height, no horizontal padding) so you can make a square icon-only button at _any_ density (`size="sm" iconOnly` → 28², `size="2xs" iconOnly` → 20²). The icon child is centered.
  - BREAKING: `size="icon"` is removed. Migrate `size="icon"` → `iconOnly` (identical 32² result, since `iconOnly` defaults to the md height). All in-repo call sites have been migrated.
  - Code Connect updated: `size` map drops `icon`, adds `iconOnly` (mapped from an "Icon only" Figma variant axis).

- b99a9a2: ColorPicker reworked into the Figma "Color Picker" popover, and adopted as the inspector's one colour control:

  - New `<ColorPickerPanel>` export — the popover body (header title + ghost close button, search, grouped DropdownMenuItem-style rows: Swatch + token name + check). `<ColorPicker>` now composes it behind its own trigger, and the Studio inspector hosts the same panel inside its TokenField-chrome fields so every colour control shares one list.
  - New `title` prop on `ColorPicker` (default `"Color"`; pass `null` to drop the header) and `onClose` on `ColorPickerPanel`. `shortName` is exported as `colorTokenShortName`.
  - Compact rows (`text-xs`, 12px) and a fixed-height scroll area so filtering never resizes the popover (Radix no longer repositions mid-search).
  - `PopoverClose` is now exported from `popover.tsx`.

  Inspector: Fill solid, gradient stops, border colour, and text colour all now render as TokenFields (leading swatch + bound chip) that open this picker — replacing the previous plain token Selects and the oversized default ColorPicker trigger.

- 7d0353f: Add three token-led colour/fill controls:

  - **ColorPicker** — a grouped, searchable single-select colour picker (Popover + Command + Swatch), the focused "pick one colour token" sibling of FillPicker's solid tab. `triggerVariant="inline"` reduces it to a clickable swatch for inspector / fill-row use.
  - **GradientEditor** — edit a multi-stop CSS gradient with token-led stops: type Select (linear / radial / angular) with reverse + rotate, a live preview bar, and a stops list (position % + colour + opacity %). Emits the structured `GradientValue`; render the CSS with the exported `gradientToCss(value)`.
  - **FillSection** (alongside the existing `FillPicker`) — a multi-fill list: each row a Solid/Gradient/Image toggle, the matching value control (ColorPicker / GradientEditor popover / image URL), an opacity %, a visibility toggle, and a remove button, with an "add fill" button in the header.

- 2e8cf59: Map markers are no longer styled by default. The DS used to force a 1px border

  - ambient shadow on every direct child of a `MapMarker`'s content (a legibility
    "floor"). That's too opinionated for a primitive, marker/pin design belongs to
    the consumer. The `[data-gds-part="map-marker-content"] > *` border + box-shadow
    rule is removed; pins now render exactly as authored.

  The `--gds-map-marker-border` / `--gds-map-marker-shadow` tokens remain defined,
  and the `.gds-map-label` halo helper is unchanged, so legibility on busy tiles
  is now opt-in rather than mandatory. If you relied on the automatic lift, add
  the border/shadow yourself (or use the tokens) on your marker content.

- 1f2ca64: Add colour **scopes**: `scope-*` utility classes (`default` / `inverse` / `brand` / `accent` / `muted` / `card`) that act like a local Figma variable mode, re-pointing the surface token family (`--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--border`) for a subtree while leaving the action colours vivid. `SectionBlock` gains a `scope` prop that applies one, so a section sets a background + foreground colour context as a unit and every descendant re-tones using the ordinary tokens. The generator emits stable `--bg-base` / `--fg-base` mirrors so the `inverse` swap can't form a custom-property cycle.
- 7d0353f: Add the **Section** page-scaffold primitive and its **Container** measure. A page is an ordered stack of Sections — each distinct band gets its own, independently themeable. `Section` is the full-width band: it owns a colour `scope` (subtheme, via the `scope-*` classes) and vertical `pad` rhythm, nothing else. `Container` is the centred max-width + gutters you drop inside a section (or anywhere) to constrain content; omit it for a full-bleed band, and `grid` snaps children to a 12-column grid. The composable parts — `SectionEyebrow`, `SectionTitle`, `SectionSubtitle`, `SectionDescription`, `SectionActions`, `SectionMedia` (a slot for any media) — give the common heading + copy + CTA + media shape design intent without constraining the content. Design doc: `STUDIO-SECTIONS.md`.
- 7d0353f: Swatch:

  - New `2xs` size (16px) for dense colour lists / inspector rows (full ramp 16 → 56px).
  - New `type` ("solid" | "gradient" | "image") plus `gradient?: string` and `image?: string`. The chip now renders a gradient or image fill **in place**, not just a solid colour/token. `type` is inferred from `image`/`gradient` when omitted, so existing solid usage is unchanged. The transparency checkerboard continues to sit behind the fill so translucent values read honestly.
  - Chip border now uses the `border` token at `ring-[0.5px]` (was `ring-1 ring-foreground/40`) — a themed hairline that reads as an edge at small sizes instead of a heavy box.

### Patch Changes

- 1f2ca64: Badge status variants now use the semantic `--success` / `--warning` / `--info` / `--highlight` / `--destructive` tokens (solid, soft, and outline) instead of fixed `gds-green` / `orange` / `blue` ramps. They now re-tone with a theme's semantic-colour edits, matching Callout and Banner. Also switched the AI chat error icon from `text-red-500` to `text-destructive`.
- 1369595: Combobox: the leading option icon now inverts with its row. It was pinned to `text-muted-foreground`, so on the highlighted/selected row (accent fill, `accent-foreground` text) the icon stayed muted grey and read as wrong against the fill. Icons are now muted at rest and pick up `accent-foreground` when the row is highlighted, matching the label.
- 2e8cf59: Make the package barrel ESM-safe by force-bundling `lexical-beautiful-mentions`.

  Previously tsup externalized `lexical-beautiful-mentions` (the default for
  dependencies), so `dist/index.mjs` shipped a bare
  `from "lexical-beautiful-mentions"` import. That package's published ESM uses
  extensionless re-exports (`export * from "./BeautifulMentionsPlugin"`), which
  strict ESM resolvers (Vite SSR, Astro, `@tailwindcss/node`, plain Node) reject.
  The result: any consumer importing even `<Section>` or `<Button>` from
  `@gradeui/ui` could crash during module resolution, because the Composer export
  dragged the broken dependency into the barrel's static graph.

  It's now in tsup's `noExternal` list, so esbuild inlines it at our build time
  and resolves the extensionless imports. The published bundle is self-contained
  and resolves cleanly in every consumer, no patches or resolver shims required.
  No runtime or API change to `<Composer>`.

- d7dd171: Menu items now invert their icons on highlight. A leading icon with its own colour (e.g. a muted folder, a primary check) used to stay that colour on the highlighted/selected row, where the text had flipped to `accent-foreground`, leaving the icon stranded and low-contrast on the accent fill. `DropdownMenuItem` (and sub-trigger / checkbox / radio items), `SelectItem`, and `Combobox` options now flip every SVG to `accent-foreground` while the row is highlighted, so the icon tracks the label. Resting-state icon colours are unchanged.
- 525a6dc: Toggle / ToggleGroup dense sizes now scale their text and icons: `2xs` drops to `text-2xs` + `size-3` icons and `xs` to `text-xs`, so a labelled segmented control (e.g. a Row/Stack direction toggle) reads at property-panel density instead of inheriting the base `text-sm`.

## 3.2.0

### Minor Changes

- 70f8050: Typography gains an **accent** font role — a supplementary display face (eyebrows, pull quotes, stylised bits) alongside display / body / mono. Themes carry `typography.accent` (defaults to Instrument Serif, overridable from the picker like any other role); the generator resolves it to `--font-accent`, and a new `font-accent` Tailwind utility applies it (falling back to the display/sans stack until a theme sets one).
- dd91d10: Add `Combobox` — a single-pick searchable picker, the single-select sibling of `MultiSelect`.

  - **Composes Popover + Command + Button.** Data-driven via `options` ({ value, label, icon?, keywords?, disabled? }); controlled or uncontrolled (`value` / `defaultValue` are `string | null`, `onValueChange` fires with the next value or null). Per-option icons render in the menu and on the trigger; cmdk handles search and keyboard nav.
  - **The Linear "selectable badge".** `triggerVariant="inline"` drops the form-control chrome and `renderValue` lets you render the selection as a Badge, so a value (a status, a priority, an assignee) reads as a clickable token that opens the menu in place. `hideChevron` completes the token look.
  - **`clearable`** adds a Clear row so the value can return to unset. **`disabled`** locks the control to a read-only display of its current value, intended to be driven by a permission check (a viewer sees the value but can't open the menu).
  - Reach for `Select` for a short fixed list with no search, `MultiSelect` for multiple values, and `Command` directly for unbounded / async lists.

- dd91d10: Add `DataView` — one dataset, drawn as a table, a list of cards, or a grid.

  - **Wraps TanStack Table so pages stop re-typing the boilerplate.** Hand it `data` plus a `columns` schema and it owns sorting, column visibility, selection, and view switching. Columns declare a `type` (badge / tags / number / currency / percent / date / boolean / url / text) that DataView renders, with a `cell` override per column for bespoke cells (avatars, relations) and `role: "title"` marking the primary field for card / grid composition.
  - **The view toggle can live anywhere.** `useDataView()` holds the view / selection / sorting / column-visibility state, so `<DataViewToggle>` and `<DataViewColumns>` (the "choose what to display" menu) can sit in a page header and drive a `<DataView>` lower down. Pass `toolbar` to render them inline instead. Single-view is first-class: `views={["table"]}` (or just `defaultView`) is only ever that one view, no switch.
  - **Table extras:** mark a column `pinned="left"` (with a `width`) for a fixed column and `stickyHeader` to freeze the header row on scroll. Tunable via `--gds-data-view-*` (card / grid min column width, gap).
  - For a single record's fields use `PropertyList`; for the bare table primitive use `Table`.

  Adds `@tanstack/react-table` as a dependency of `@gradeui/ui`.

- 70f8050: Brand colour utilities are now registered under the `gds-` prefix to match the rest of the system (the May 2026 rename had updated component class names to `gds-*` but missed the `@theme` colour registrations, which left e.g. a colourless Success badge). All ten families — green, yellow, orange, red, teal, navy, blue, gray, plus black/white — are now `--color-gds-*`, so `bg-gds-green-500`, `text-gds-gray-900`, `bg-gds-yellow-400` etc. resolve. The old `--color-rds-*` registrations are removed (no back-compat); switch any `*-rds-<family>` utility to `*-gds-<family>`.
- 3a6682a: Map: unbake chrome, add a label halo token, and fix Leaflet marker layering.

  - **Removed the baked-in radius/border on `<Map>`.** The container no longer sets an inline `border-radius`/`border` (which `className` couldn't override). The Map is now an unopinionated primitive — square with no border by default; round or frame it from the call site with `className` (e.g. `rounded-xl border`). This is a visual change for any existing `<Map>` that relied on the default rounding.
  - **Added the `--gds-map-label-halo` token + `.gds-map-label` helper.** A mode-aware text-stroke for floating marker labels (white halo on light tiles, near-black on dark) so labels don't wash out in dark mode. Use the class instead of a hard-coded white `-webkit-text-stroke`.
  - **Fixed Leaflet dropping inline marker SVG content.** Leaflet's stylesheet sets `z-index: 200` on map `<svg>` elements, which painted an inline pin-shield SVG above later sibling DOM (e.g. a count label), hiding it — but only on Leaflet (the default provider), not Mapbox/MapLibre/Google. Marker content now follows normal source order on every provider via `[data-gds-part="map-marker-content"] svg { z-index: auto }`.

- dd91d10: Add `PropertyList` — the read-only "one record, stacked" display primitive.

  - **New `PropertyList` + `PropertyList.Row`.** A PropertyList is a Table row transposed: where a Table runs the schema horizontally (a column per field, across many records), a PropertyList stacks one record's fields vertically as label / value pairs. Reach for it for detail panels, inspectors, "about this item" cards, and record summaries.
  - **Polymorphic value slot.** The value side is `children` (or the `value` prop), not a string — so the same renderers that fill a Table cell (a Badge, an avatar stack, a date, a wrapping tag group, a link) drop straight into a row, and the two surfaces never drift.
  - **Semantic + token-driven.** Renders a real `<dl>` / `<dt>` / `<dd>`. Layout (`row` / `stack`), density (`compact` / `default` / `relaxed`), alignment, dividers, and label-column width are driven by `--gds-property-list-*` so a narrow inspector and a wide settings page share one primitive. Parts emit `data-gds-part="property-list" | "property" | "property-label" | "property-value"`.
  - It is a display primitive — for an editable label + control use `Field`; a read↔edit detail panel swaps a PropertyList for a stack of Fields.

### Patch Changes

- c55ca65: Badge: the solid variants are now flat — dropped the `shadow` utility from `default`, `destructive`, `highlight`, `success`, `warning`, and `info`. On a solid fill the theme's bevel-highlight shadow read as embossed (the same issue fixed on `Button`); flat is the intended resting look. The soft and outline variants were already shadowless and are unchanged.
- c55ca65: Button: every resting variant is now flat — dropped `shadow` from `variant="default"` and `shadow-sm` from `secondary`, `outline`, and `destructive`. On solid/bordered fills the theme's bevel-highlight shadow read as embossed; flat is the intended resting look, and the tactile/beveled treatment stays exclusive to `variant="raised"` (and the `raised` prop).
- c55ca65: Input: dropped `shadow-sm` from the default size so a text input sits flat, matching `SelectTrigger` (which carries no drop shadow). Previously a default-size Input read as slightly lifted next to a Select of the same height. The `xs` / `2xs` densities already opted out of the shadow, so only the default size changes.
- 70f8050: MediaSurface: an explicit `aspect` prop now wins over a baked-in `className` aspect. Previously the aspect class was emitted before `className`, so a slot authored as `<MediaSurface className="aspect-video" />` ignored a later `aspect="square"` (e.g. set from the inspector) — it did nothing. An explicit `aspect` now applies via inline `aspect-ratio`, which beats the class; a derived (hint-default) aspect still rides the class so a deliberate `className="aspect-[2/1]"` can override it.
- c55ca65: Select: the trigger's focus ring now matches Input (`focus-visible:ring-1 ring-ring`, no offset) instead of the heavier `focus:ring-2 ring-offset-2`, so a Select and an Input side by side highlight identically. `SelectContent` also gains an optional `container` prop that forwards to the Radix portal, letting the menu render inside a scoped-theme wrapper (e.g. a preview island) rather than always portaling to `document.body`.

## 3.1.0

### Minor Changes

- 3787357: Custom uploaded fonts in themes. `ThemeInput.typography` now accepts
  `custom:<family>` selections backed by a `customFonts: CustomFontFace[]`
  list the theme carries with it — family name, permanent public URL,
  format/weight/style descriptors. The generator resolves the selections to
  concrete font-family stacks and passes the faces through as
  `GeneratedTypography.fontFaces`; new `fontFaceCSS()` / `injectFontFaces()`
  helpers (exported from the themes barrel) materialise the `@font-face`
  rules wherever the theme is applied, and `applyThemeToRoot` injects them
  automatically. Registry-only themes are unaffected.

  Variable-font width support: `CustomFontFace.stretch` (default "50% 200%")
  keeps the wdth axis reachable, and `typography.bodyStretch` /
  `displayStretch` set a theme-wide font-stretch consumed by globals.css on
  `body` and `h1–h4` via `--font-body-stretch` / `--font-display-stretch` —
  per-element `font-stretch-[…]` utilities still override.

- 197dea2: Embed viewer modes, map polish, and theme ring control.

  - **MediaSurface fidelity model**: the tiered placeholder stays mounted beneath a filled slot but is now hidden via CSS (`[data-filled]` → `visibility: hidden`), so transparent imagery no longer shows the glyph/`--gds-media-placeholder-bg` through its alpha pixels. Wireframe mode is back as a pure-CSS view: `data-fidelity="wireframe"` on any ancestor cross-fades imagery out and placeholders in (`--gds-media-fidelity-fade`, default 280ms).
  - **Map `tools` / `toolsPosition` props**: `"auto" | "zoom" | "none"` and a four-corner dock position, one vocabulary across leaflet/maplibre/mapbox/google adapters. Google's default UI is now fully disabled with only the zoom control added back.
  - **Map `appearance="auto"` in provider-less hosts**: falls back to watching the root `.dark` class when no `GradeThemeProvider` is mounted, so embeds and sandboxed previews restyle tiles live on mode flips.
  - **Map marker lift**: every `MapMarker` child gets a 1px border + ambient shadow from the mode-aware `--gds-map-marker-*` token pair (light hairline on dark tiles), and marker content re-asserts `--font-sans` over Leaflet/MapLibre's container font-family so pins carry custom faces.
  - **Transparency checkerboard tokens**: `--gds-media-checker-color` / `--gds-media-checker-size` for alpha backdrops (used by Studio's inspector image well).
  - **`ThemeInput.ring`**: optional focus-ring colour — `{ source: "primary" | "accent" | "neutral" }` or `{ hue: number }` (mints a dedicated ramp at primary chroma). The mode-tuned step is preserved, so per-mode contrast behaviour is unchanged.
  - **Contracts**: `Map.onHoveredIdChange` and `MediaSurface.instanceId` added to sidecars/contracts so the documented patterns pass save validation.

- 1317ff8: Component + contract fixes from the Cowork-replica exercise (2026-06-11):

  - **DropdownMenuSubTrigger hover**: now applies `focus:text-accent-foreground`
    / `data-[state=open]:text-accent-foreground` + `transition-colors`,
    matching DropdownMenuItem — previously only the accent background was set,
    leaving default-colour text on hover.
  - **SidebarSection `titleTransform`** ("uppercase" | "none"): explicit
    control over title casing for both header variants. Unset preserves the
    per-variant legacy defaults exactly (static headers uppercase, collapsible
    headers authored-case).
  - **Contracts generator**: multi-prop sidecar lines now parse fully —
    semicolon-separated signatures and bare comma lists (`open?, defaultOpen?,
onOpenChange?, modal?`) previously kept only the first prop, so the save
    gate rejected props the components genuinely support. Prose semicolons in
    descriptions are no longer mistaken for separators. Sub-component props
    are forced optional in the flattened bag (requiredness no longer leaks —
    TabsTrigger's required `value` was being demanded on `<Tabs>` itself).
    Net effect: 27 real props restored across 17 component contracts, zero
    new requirements.
  - **Sidecars**: logo.md now documents the full existing Logo API
    (size/lockup/mode/mono/label/decorative/href — the component had outgrown
    its docs); dropdown-menu.md documents DropdownMenuSub open/defaultOpen/
    onOpenChange (Radix passthrough, useful for composing pre-opened menus in
    static screens); sidebar.md describes the real per-variant title casing
    instead of claiming unconditional uppercase.

- 498c64a: Add `Swatch` and `SwatchGroup`. `Swatch` is a single colour chip that binds
  to a live theme token (`token="brand-3"` → `oklch(var(--brand-3))`,
  re-voicing on theme change) or a raw `color`. Sizes are the t-shirt scale
  (xs–xl); `shape` is square / rounded (rides `--radius`) / circle. A
  transparency checkerboard sits behind the fill and a foreground-based border
  is drawn on top (`rounded-[inherit]`) so the edge reads on any surface and
  survives an opaque fill. `onSelect` makes it a pickable `<button>`
  (`selected` draws the shared selection ring); `onColorChange` makes it an
  editable colour well that hosts a native `<input type="color">` behind the
  chip — the OS picker stays native, the presentation stays the DS chip.
  `SwatchGroup` arranges a set as a spaced `row` or an overlapping `stack` and
  cascades `size`/`shape` to its children.

  Louder brand pops: `--brand-1…8` are now a vivid spectrum fanned from the
  theme's primary and accent hues (high OKLCH chroma, bright lightness) instead
  of being seeded from the muted, data-viz-tuned chart palette. They still
  track the theme, so switching theme or dragging hue re-voices them.

## 3.0.0

### Major Changes

- d09cf28: **Breaking — Tailwind v4 native `@theme` migration (THEME-MIGRATION.md Phase A).**

  The v3 config bridge is gone. Everything `tailwind.config.ts` / `tailwind-preset.ts` defined (brand ramps, OKLCH semantic roles, `text-2xs`, radius, elevation shadow scale, surface colors, backdrop blurs, keyframes/animations, `darkMode: "class"`, content globs, tailwindcss-animate) now lives in `styles/globals.css` as native `@theme inline reference` declarations, `@source` directives, `@custom-variant dark`, and `@plugin "tailwindcss-animate"`.

  - **Removed: the `@gradeui/ui/tailwind-preset` export.** There is no JS Tailwind config for consumers to extend anymore — `@gradeui/ui/styles.css` is fully self-contained (tokens + `@theme` bridge + all utilities the components use). Consumers running their own Tailwind v4 build should add an `@source` for `node_modules/@gradeui/ui/dist` instead.
  - **`dist/styles.css` is unchanged at the rule level.** Verified by a selector→declarations structural diff of the old (`@config`) vs new (native `@theme`) unminified output under Tailwind 4.3.0: identical rule sets (2,512 = 2,512), zero rules added or removed. The only textual deltas are v4 preflight's font indirection (`var(--default-font-family, …)` instead of `var(--font-sans, …)`) and Tailwind's emitted default `--font-sans`/`--font-mono`/`--default-*-font-family` theme vars — all of which resolve to the same computed values because the runtime `--font-sans`/`--font-mono` are defined in the unlayered `:root` of `@gradeui/core/tokens.css`. Opacity shortcuts (`bg-primary/50`) compile to `color-mix()` instead of `<alpha-value>` substitution — same rendered color.
  - Semantic role colors stay raw OKLCH triplets wrapped at use (`oklch(var(--primary))`) — the `GradeThemeProvider` / `applyThemeToRoot` runtime contract is untouched.

  This is the prerequisite for Phase B (density → `--spacing`, modular type scales → `--text-*`): with the utility layer driven by native theme variables, the theme generator can re-pitch spacing and type across every screen ever generated.

### Minor Changes

- d09cf28: **Phase B — the at-will theming switch (THEME-MIGRATION.md B1–B5).** The theme generator now reaches into Tailwind's utility layer:

  - **B1 Density → `--spacing`.** `GeneratedSpacing` gains `unit` — the Tailwind v4 spacing base derived from the density factor (tight 0.2125rem / default 0.25rem / roomy 0.3rem, floored at 0.125rem). `themeToCSSVars` emits it, so every `p-*`/`gap-*`/`m-*`/`size-*` in every screen ever generated re-scales when density changes — retroactively.
  - **B2 Modular scale → `--text-*`.** When `typography.scale` is a modular ratio id, `GeneratedTypography.namedScale` carries the full 2xs…7xl ladder (middle-out from body, descending steps floored at 0.625rem) and is emitted as `--text-<step>` + `--text-<step>--line-height` (line-heights tighten as size grows, mirroring the default ladder's curve). Presets emit nothing — today's static values stand. `--text-2xs` moved from `@theme inline` to a plain `@theme` block so the utility references the variable (runtime-re-pitchable); computed default unchanged.
  - **B4 Role ramp families.** Every semantic alias is now a whole ramp: `GeneratedTheme.roleRamps` carries success/warning/info/highlight/destructive ramps (seeded from the fixed status hues); `themeToCSSVars` emits `--gds-<role>-<step>` triplets for those plus primary/accent/neutral. New `--color-<role>-<step>` `@theme` entries (with flat-role fallbacks) + safelists make `bg-success-100` / `text-warning-800` / `border-primary-300`-style utilities real (+231 rules, purely additive). `neutral` ships as runtime vars only — `--color-neutral-*` would shadow Tailwind's default palette.
  - **B5 Guards.** Min text size 0.625rem, min spacing base 0.125rem, modular ratios clamped to 1.02–1.8, density factor clamped to 0.6–1.6. Style-panel sliders should mirror these bounds.

  Existing saved themes with non-default density will now actually re-scale spacing (previously only `--gds-density` moved). That's the feature. Known parity limit: the Sandpack check renderer (CDN Tailwind v3) gets the role-family colors via its config but cannot re-pitch `--spacing`/`--text-*` — Fast Frame is the live preview and renders all of it.

- 0a090b5: Default palette refresh (THEME-MIGRATION A7.1): the base `:root`/`.dark`
  semantic tokens in `styles/globals.css` now match the current Studio
  design (warm-cream hue-85 neutrals, near-black primary, Inter/Geist
  type, 0.25rem radius). They previously still carried the pre-redesign
  terracotta theme (hue 20/40 palette, Fraunces serif, 0.875rem radius),
  which changed the out-of-box look of the package AND leaked the old
  colours into any surface that loaded both this stylesheet and the docs
  one (the MCP preview panel's "pink progress bar"). 35 custom-property
  values updated; rule set verified structurally identical via
  scripts/css-rule-diff.mjs (0 added / 0 removed; only the two palette
  rules changed). Apps applying a theme at runtime (GradeThemeProvider,
  Studio, embeds) are unaffected — this changes only the un-themed
  defaults.

  New export (A7.2): `@gradeui/ui/styles/globals.css` — the raw Tailwind
  v4 source stylesheet (@theme blocks, dark variant, plugin, palette,
  component layer), for apps that compile Tailwind themselves and want
  the design system as their base. `apps/docs` now consumes it this way
  instead of maintaining a 1,700-line copy. The `styles/` directory is
  now included in the published package.

### Patch Changes

- d09cf28: `Field` (option layout) now centres the control against a single-line label; the top-aligned `mt-0.5` treatment only applies when a `Field.Description` makes the text block taller than the control. Fixes the visibly skewed checkbox-with-label row.
- d09cf28: `SelectLabel` now reads the menu density from `SelectContent` (the same context `SelectItem` uses). Compact menus (`size="xs"` / `"2xs"`) render group headings as quiet muted eyebrow labels aligned with the item text indent, instead of full-size semibold headings towering over 2xs options.

## 2.1.0

### Minor Changes

- 947ff22: Export the `Chart` family from the public barrel + make `--gds-canvas-fill` mode-aware.

  - **`Chart` is now part of the public API.** `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle` (and the `ChartConfig` type) are exported from `@gradeui/ui` — previously the component existed but was never re-exported from `lib/index.ts`, so `import { ChartContainer } from "@gradeui/ui"` failed. It's the themed Recharts wrapper: bring the chart shape (`Bar`/`Line`/`Area`/`Pie` from `recharts`) and nest it inside `<ChartContainer config={…}>`; the wrapper threads design-system tokens through Recharts and supplies a styled tooltip + legend. Reference series colours as `fill="var(--color-<key>)"`. (Also added to the Studio emission allowlist.)

  - **`--gds-canvas-fill` is now mode-aware.** It was a fixed near-black (`#0b0b0e`) with no light variant, so the letterbox bars behind a contained screen (embed / share / fullscreen preview) and the `ScreenAnimator` stage stayed black in light mode. Now a soft neutral (`#e8e8ec`) in light and the near-black in dark — one token, mode-scoped. Override or set to `transparent` as before.

- c2876ca: Add Grade Motion — `Motion` / `MotionScene` / `MotionScreen` / `MotionText`, a directed sequence of scenes on one persistent stage.

  The grammar of a modern product demo: text → demo → video → text, any order, any mix. A `<Motion>` owns the stage and plays its `<MotionScene>`s in order; a scene is a stage _moment_ holding arbitrary JSX:

  - `MotionScreen` — a framed screen (desktop / mobile device presets) with its **own** camera (`shots` — ScreenAnimator per-screen, not per-scene). Several can share a scene: mobile + desktop side by side.
  - `MotionText` — the Motion Templates: `title`, `lower-third`, `section-break` (pre-directed text animations).
  - Anything else — a `<video>`, an image, plain JSX. Untimed content rides the scene's `durationMs`.

  The completion contract: a scene advances when all its _timed_ children finish (camera tours, text templates), or after `durationMs` when nothing keeps time. Timed children register with the scene via context; new content types plug in by registering.

  Also:

  - `view="strip"` — the arrangement view (scenes left-to-right as labelled cards) vs `view="play"` (the film). Reduced motion falls back to the strip.
  - `aspect` — fixed artboard ("16/9", "9/16" for TikTok/Reels, "1/1"), letterboxed into the container; "auto" fills responsively.
  - Transport with scene dots (random access — a Motion is slides that play themselves), loop cap, centred replay on end.
  - `ScreenAnimator` grows `paused` (controlled pause for sequencers) and `onEnded` (fires once when a tour runs to its end).

  See `STUDIO-DIRECTOR.md` ("Grade Motion") for the design doc and rollout.

- 2845f87: The primitive token layer, the BYODS registry, and modular type scales.

  **@gradeui/core — first real release.** No longer a placeholder. Ships the primitive token layer (layers 1–2 of the token model):

  - `tokens.css` (import via `@gradeui/core/tokens.css`) — brand color ramps, neutral grays, semantic role aliases, spacing scale, border radii, font stacks + the new `--font-display` / `--font-body` slots, and the type scale. Authored source of truth.
  - Typed data generated from the CSS (`GDS_COLOR_RAMPS`, `GDS_NEUTRALS`, `GDS_SEMANTIC_ALIASES`, `GDS_SPACING`, `GDS_RADIUS`, `GDS_FONT_FAMILIES`, `GDS_TYPE_SCALE`, `GDS_RAMP_NAMES`) via `scripts/generate-tokens.mjs`.
  - Modular scales: `GDS_MODULAR_SCALES` (musical-interval ratios), `modularRamp`, `modularStep`, and `modularTypeSizes` — the middle-out (Utopia-model) ladder over Tailwind's size vocabulary (`GDS_TYPE_SIZE_NAMES`, base mid-ladder, reciprocal descent, floored).
  - Semantic alias model: every alias is a ROLE pointing at a whole ramp. Added palette roles `--gds-primary` / `--gds-secondary` / `--gds-neutral`; removed `--gds-teal-semantic` (named a color, not a meaning) and `--gds-energy` (brand flavor, not a role).

  **@gradeui/ui.** Now depends on `@gradeui/core`; `styles/globals.css` imports `@gradeui/core/tokens.css` instead of carrying the primitives inline (built `dist/styles.css` remains self-contained and is verified var-identical). Theme engine: `ThemeInput.typography.scale` accepts modular scale ids (`TypeScale = TypeScalePreset | ModularScaleId`) and generates the semantic ladder middle-out from the body size; legacy presets unchanged.

  **@gradeui/studio.** New `registry` module (`@gradeui/studio/registry`): the `DesignSystemRegistry` contract for bring-your-own-design-system, with `GRADE_REGISTRY` as the default assembled from the playbook constants. `buildSystemPrompt()` takes an optional registry (component list, DS name, package specifier); output with the default registry is byte-identical to the previous prompt.

### Patch Changes

- Updated dependencies [2845f87]
  - @gradeui/core@1.1.0

## 2.0.0

### Major Changes

- 0686676: Tailwind v4 migration + the canonical control size scale.

  **Breaking — Tailwind v4.** The package now builds its stylesheet with Tailwind v4 (`@import "tailwindcss"` + `@config`; CLI moved to `@tailwindcss/cli`). `dist/styles.css` is v4-generated. The legacy `safelist` moved to `@source inline(...)` in `styles/globals.css`; `darkMode` is the string `"class"` form. Consumers extending `tailwind-preset.ts` must be on Tailwind v4.

  **Breaking — size scale.** Component `size` variants now map name→text consistently (`2xs→text-2xs`, `xs→text-xs`, `sm→text-sm`, `md→text-base`, `lg→text-lg`) across input, textarea, select, label, toggle, button, avatar. A new `2xs` tier (h-6 / 24px, `text-2xs` = 11px token) lands across the form-control family, plus sized `Switch` variants (`default`/`sm`/`xs`/`2xs`) and a `2xs` avatar. `sm` controls render 14px text (was 12px); `md`/`default` buttons render `text-base` (was `text-xs`). Arbitrary `text-[11px]`-style values are gone from the library.

  **Added.** `SelectItem` gains a `hint` prop — right-aligned secondary text in the menu row that does not mirror into the trigger (used for token→resolved-value readouts).

### Minor Changes

- a9a5569: Add `--gds-canvas-fill` — the standard backdrop behind a screen when it doesn't fill its frame.

  One token for every "canvas" surface: the letterbox bars in an embed/share, and the stage a `<ScreenAnimator>` reveals when it flies in or pulls below 1× zoom. Deep near-black by default; set it to `transparent` to let the host page show through, or any colour to rebrand it in one place. `ScreenAnimator`'s default `stage` now reads `var(--gds-canvas-fill, …)`, falling back to the previous dark gradient where the token isn't loaded.

- a9a5569: Pause autoplay when nobody's watching — a demo is a movie, it stops when you look away.

  - New `usePageActive()` hook (lib/motion): `true` only when the tab is visible AND (for a top-level document) the window is focused. Inside an iframe it falls back to visibility, which correctly tracks the top tab.
  - `useScriptedDemo` (so `DemoStage`, `Composer`, `Code`) and `ScreenAnimator` now pause their loops when the page is hidden/unfocused, or when the element is scrolled out of view. A paused run is fully torn down (timers cleared) and replays/resumes when the page is active again. This kills the runaway `setTimeout`/`rAF` storm that piled up when many looping demos sat on one page or in a background tab.
  - New `maxLoops` option/prop on both: cap the loop cycles, then settle and stop instead of spinning forever. Default `Infinity` (unchanged); grid/embed surfaces set a small number.
  - `ScreenAnimator` now shows a centred **replay** button when the tour ends (the way a finished video does), and its play control restarts from the top once finished. The corner transport stays play / pause / restart.

  Note: an offscreen iframe can't see its parent's scroll, so the in-view half only applies to non-iframed players; pausing an offscreen _grid_ iframe (and freeing its memory) is the parent's job via the poster/promote policy in STUDIO-CAPTURE.md.

- 89cc7b1: Add `ScreenAnimator` — wrap any screen in a directed camera.

  Give it a list of `shots` (a zoom + focal point + dwell + caption) and it tours them over the live, still-interactive content: flies in from offscreen, eases between shots, pulses a synthetic cursor, captions each beat, settles back to the start, exits, and loops, with a play / pause / restart transport. Opt in to a focus spotlight (`spotlight`) to dim the edges when it pushes in.

  - `shots`, `autoplay`, `loop`, `controls`, `cursor`, `enter`, and `spotlight` (the edge vignette, off by default — opt in).
  - `stage` (CSS background) and `backdrop` (a live layer behind the screen — image, gradient, or a `<ThreeScene>` shader).
  - Honours reduced motion (settles on the starter frame, no movement).

  It's the reusable form of the embed's camera and the `camera-tour` showcase, the live, editable, re-renderable answer to a screen-recording. See `STUDIO-DIRECTOR.md`.

- 399f8ec: Component + stylesheet improvements from the Studio editing push:

  - **BackgroundFill**: `type="gradient"` now supports radial gradients —
    `gradient={{ shape: "radial", at: "top", size: "45rem 50rem", from, via?, to }}`
    (linear stays the default). The token-true replacement for arbitrary
    `bg-[radial-gradient(…)]` classes, which don't compile in Studio's preview.
  - **Logo**: `sources` is now optional — a bare `<Logo />` renders the neutral
    placeholder instead of crashing (`resolveArtwork` read from `undefined`).
  - **ThreeScene**: WebGL no longer remounts when the `palette` prop changes
    identity but not value (inline `palette={{…}}` objects re-created every
    parent render were tearing down and re-initialising the renderer — visible
    flash every state tick on shader-heavy pages). The build effect is keyed on
    the palette's serialized value; `onShaderError` rides a ref.
  - **AIChat**: reasoning ("thinking") parts render as markdown and stream live
    (`thinkingStreaming` auto-expands the disclosure); `title={null}` drops the
    header row; auto-scroll follows streamed content growth, not just new
    messages.
  - **Stylesheet safelist**: gradient-text recipe (`bg-clip-text`,
    `text-transparent`, `bg-gradient-to-*`, `from/via/to-*` semantic stops with
    opacity ladder), display sizes (`text-6xl`–`9xl`), responsive `sm:/md:/lg:`
    variants for the typography families (size, weight, `leading-*`,
    `tracking-*`, alignment) — all previously silently absent from the compiled
    CSS when emitted at runtime.
  - **MediaSurface / BackgroundFill sidecars**: imagery + gradient guidance for
    the Studio model (placeholders over invented URLs, fills over arbitrary
    classes).

- 0686676: Inspector-parity polish across the contract pipeline and panel chrome.

  **@gradeui/contracts** — new optional `variantDefaults` field on
  `ComponentContract`: the primary cva's `defaultVariants` extracted from
  component source (`{ variant: "default", size: "md" }`). Lets consumers
  (the Studio inspector) show the REAL resolved value for an unset enum
  prop instead of a meaningless "(default)". Additive; existing contracts
  are unaffected.

  **@gradeui/ui**

  - `generate:contracts` now emits `variantDefaults` per component
    (resolved from the cva referenced by the root part); all generated
    contracts regenerated.
  - `Input`: the dense panel sizes (`xs`, `2xs`) drop the base
    `shadow-sm` (`shadow-none`) so they sit flush with `SelectTrigger` in
    tool panels. `default`/`sm` keep their shadow.
  - `Select`: trigger placeholder muting fixed — `placeholder:` is the
    input pseudo-element and never matched Radix's placeholder span; now
    `data-[placeholder]:text-muted-foreground`, so placeholder/ghost
    values actually render muted.

## 1.3.0

### Minor Changes

- 1022fd3: `lib/demo` (the declarative scripted-motion layer behind `<Code>`, `<Composer>`, `<DemoStage>`) now honours reduced motion.

  `useScriptedDemo` reads `useReducedMotion()`, so when the OS reports `prefers-reduced-motion: reduce` (or the global `data-motion="off"` toggle is set) the runner settles on the final frame instead of animating: every step completes instantly, the sequence never loops, and `typeText` emits whole strings in one tick. Previously the typing/reveal loop ran regardless, which meant a screen built with `<Code>` kept animating under reduced motion.

  This closes the accessibility gap for the declarative-motion surfaces and brings them in line with ThreeScene, the CSS reset, and the rest of the motion control. `ScriptedDemoContext` also gains a `reduced` flag for interpreters that do non-timing-based work (confetti, sound) and want to opt out under reduced motion.

- 276cbe0: Compact control sizes for dense editing UI, plus fills and an upgraded ThreeScene renderer.

  Much of this came out of building the Studio editing surfaces (inspector, side panels), where controls need to sit at a tighter rhythm than page UI.

  New components and exports:

  - `FillPicker` (with `FillValue` and `FILL_TOKENS`) and `BackgroundFill` (`BackgroundFillProps`, `BackgroundFillType`, `BackgroundFillFit`): a frame's background as a first-class fill (shader / image / gradient / solid) with a Figma-style picker.
  - `ShaderControls` (`ShaderControlsProps`): live controls for the shader/post-processing fills.
  - `AvatarTone` type export.

  Compact sizes across form controls:

  - `Button` gains an `xs` size (24px) for tool panels.
  - `Input` gains a `size` prop plus `startSlot` / `endSlot` adornments.
  - `Select` gains menu density (`size="xs" | "sm"` on `SelectContent`, propagated to every `SelectItem` via context).
  - `Textarea` gains a `size` prop mirroring `Input`.
  - `Label` gains a `size` prop.
  - `Message` gains a `compact` variant for dense side-panel use.

  ThreeScene:

  - Upgraded render pipeline: post-processing composer, shader presets, fragment scenes, and theme-aware palettes, so backgrounds react to the active Grade theme.

- f63c05f: Add `Logo` — a brand mark with built-in lockup, on-light / on-dark, and monochrome variations.

  A brand rarely has one logo: a square mark for tight spaces, a horizontal lockup for headers, single-colour versions for busy or inverted surfaces. `Logo` holds that set and renders the right one for the context, so toolbars, sidenavs, and footers can all reach for the same component.

  - `sources` — artwork keyed by lockup (`square` / `horizontal` / `icon`) then appearance (`light` / `dark` / `mono`). Each slot is any node (inline `<svg>`, `<img>`, a component). Supply only what you have; it falls back across appearances and lockups.
  - `lockup`, `mode` (explicit light/dark, not theme-coupled), `mono`, `size` (t-shirt or pixel height), `label` / `decorative` for a11y, optional `href` to link.
  - Monochrome artwork inherits `currentColor`. A neutral placeholder renders when a slot has no artwork yet (handy in Studio before wiring real art).

- 7770369: Add `lib/motion`: a global motion control.

  `useReducedMotion()` is now the single choke point for "should this animate?". It ORs the OS `prefers-reduced-motion: reduce` query with a `data-motion="off"` attribute on `<html>`, so a manual toggle can still every animated surface at once (ThreeScene, RivePlayer, VideoPlayer, aura) on top of honouring the OS preference.

  - `useReducedMotion()` — live (media-query change + attribute observer), SSR-safe.
  - `setMotion(enabled)` — imperatively flip the `<html>` toggle.
  - `MOTION_ATTR` — the `data-motion` attribute name.
  - `usePrefersReducedMotion` — deprecated alias of `useReducedMotion`, kept for back-compat; it now also folds in the toggle.

  Reduce-only by design: the toggle can suppress motion but never forces it on for a viewer whose OS asks for reduced motion. A matching `[data-motion="off"]` reset in the stylesheet covers pure-CSS animation and transition.

- f63c05f: Add `Field` plus the selection-card family (`RadioCard`, `CheckboxCard`, `SwitchCard`), and fix elevation so it works in generated/runtime UI.

  `Field` is the inline composition primitive for a control and its caption. It pairs a bare `Checkbox`, `RadioGroupItem`, or `Switch` with `Field.Label`, an optional `Field.Description`, and an optional `Field.Trailing` slot, and wires the `id` plus `aria-describedby` automatically by cloning the control. The primitives stay bare (no new `description` prop). `layout="option"` (default) leads with the control; `layout="setting"` leads with the text and pins the control trailing, for settings rows.

  `RadioCard` / `CheckboxCard` / `SwitchCard` make the whole card the control: it renders as the underlying Radix `Item` / `Checkbox.Root` / `Switch.Root`, so focus, hover, and the checked state all live on the card surface and the entire card is the hit target. All three share one token-driven surface (`.gds-selection-card`, themeable via the new `--gds-selection-card-*` variables) so they look identical sitting together; the dot/check/switch glyph differs by type by design. Props: `label`, `description`, `aside` (a trailing slot for a Badge), `hideIndicator`, `indicatorPosition`, plus arbitrary `children` for custom static content. The checked glyph defaults to `--primary` so a control reads the same colour in a card as standalone. RadioCard must sit inside a `RadioGroup`; static content only (no nested interactive controls).

  Elevation fix: the Presence elevation system was defined as Tailwind utilities (`shadow-elevation-N`, `shadow-raised`, the single-layer atoms) that only compiled when a scanned source file used the literal class, so typing `shadow-elevation-3` in Studio output or a consumer screen produced no CSS. This adds JIT-proof real classes (`.gds-elevation-0` through `.gds-elevation-5`, `.gds-elevation-hot`, `.gds-elevation-pressed`, and `.gds-shadow-*` atoms) that are always present in the shipped stylesheet, mirroring how `.gds-surface-*` already works, and safelists the Tailwind utility names so the documented API also compiles into every build.

## 1.2.0

### Minor Changes

- d6b506f: Composer, Message, ComposerReply, and lib/demo scripted-demo primitive.

  **New components**

  - `<Composer>` — Lexical-backed text composition surface. Plain text or rich (bold / italic / underline / strike / code / h1-h3 / blockquote / pullquote / lists), mentions and slash commands via `lexical-beautiful-mentions`, image attachments via paperclip + clipboard paste, scripted demo playback for marketing surfaces. Replaces hand-rolled `<textarea>` + toolbar + send-button patterns wherever a user composes text. CSS-variable themed (`--gds-composer-*`).
  - `<Message>` — canonical "avatar + author + timestamp + body" row for chat, comments, post replies, activity logs. Slot-based avatar, optional `edited` / `pinned` / `reactions` / `threadCount` / `badge` / `actions` props, `align="end"` for "your messages" in DM threads.
  - `<ComposerReply>` — preset wrapping Composer for reply boxes (placeholder, no toolbar, no attachments, Cmd+Enter submit).
  - `<DemoStage>` + `<Reveal>` — context-driven staging for whole-interface scripted reveals (marketing heroes, tutorial overlays, onboarding flows).
  - `<BlinkingCursor>` — shared caret primitive used by scripted-typing demos.

  **New primitive layer**

  - `packages/ui/lib/demo/` — shared step-machine spine behind every scripted-demo surface in the design system. Exposes `useScriptedDemo` hook, `sleep`, `typeText`, `DEMO_SPEED_PRESETS`, `DemoStage`, `Reveal`, `BlinkingCursor`. Re-exported from the `@gradeui/ui` barrel.

  **Enhanced**

  - `<Avatar>` gains a `size` prop (xs / sm / md / lg / xl).
  - `<AvatarFallback>` gains a `tone` prop (muted / primary / violet / amber / emerald / sky / rose / plum / lime) for stable per-author colour mapping.
  - `<Code>` refactored onto `lib/demo` — same behaviour, shares the step machine + blinking cursor with Composer.
  - `<AIChatComposer>` refactored onto Composer — same API, ~125-line shim that wraps Composer with chat-input defaults (formats=false, attachments, Press Enter hint).

  **Studio playbook**

  - `Composer`, `ComposerReply`, `Message`, `DemoStage`, `Reveal` added to the allowlist.
  - Sidecar anti-patterns added to `composer.md` and `message.md` to steer the model away from inline `<textarea>` + toolbar and inline avatar+row patterns.
  - `linear-clone` and `notion-clone` reference scaffolds refactored to use the new primitives (Message for comment threads, Composer for input surfaces); Tiptap dependency removed from both.
  - Four new playground scaffolds: `hero-staged-reveal`, `composer-chat-demo`, `composer-comments-demo`, `composer-document-demo`.

  **Docs**

  - New `/components/composer` and `/components/message` pages.
  - `gradeui/CLAUDE.md` gained a 12-step "Creating a new component" ship checklist.

  **Dependencies**

  Adds `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/list`, `@lexical/link`, `@lexical/code`, `@lexical/markdown`, `@lexical/selection`, `@lexical/utils`, `lexical-beautiful-mentions` to `@gradeui/ui`.

## 1.1.0

### Minor Changes

- 7ed04dd: Code + Banner components, Surface axis across containers, Studio polish

  ### New components

  - **`<Code>`** — syntax-highlighted code surface (`prism-react-renderer` under the hood, shared with Studio's Source panel). Diff hero mode, line emphasis, scroll-triggered reveals via `motion`'s `useInView`, speed presets (`slow` / `normal` / `fast`), terminal `prompt` prop, blinking cursor (auto-on for typewriter and scripted sessions), and a `steps` machine for scripted CLI demos (`type` / `wait` / `output` / `clear`, with optional `loop`). Token palette via `--gds-code-*` CSS variables; theme inversion is automatic.
  - **`<Banner>`** — full-width horizontal strip for system-level state, announcements, and first-run guidance. Variants: `default` / `info` / `success` / `warning` / `destructive` / `announcement`. Surface axis (solid / translucent / glass / glass-strong), sticky, dismissible, icon + action slots. Auto role mapping (warning/destructive → `role="alert"`; others → `role="status"`). Extracted out of an inline-style `FigmaIntroBanner` that was rendering nearly invisible because it referenced `--gds-*` tokens that don't exist in our system — the primitive makes that category of mistake impossible.

  ### Surface axis across containers

  `surface` prop added to `Card`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu` (root + sub), `HoverCard`, and `SectionBlock`. Maps to the existing `gds-surface-*` classes from the Presence system (PRESENCE.md). Replaces the "roll `bg-card/40 backdrop-blur-md` by hand" pattern with theme-tuned blur + edge highlight, exposed as a knob in Studio's inspector. Sidecars rewritten as scenario-led canonical examples (intent → output → anti-pattern) so the playbook steers retrieval correctly.

  Shared `surface.ts` module so every surface-bearing component imports the same `SURFACE_CLASS` map and `surfaceBg()` helper.

  ### Studio polish

  - `Replay` control in the canvas toolbar (next to viewport toggles) — re-keys the focused iframe so every `inView` reveal animation runs again. Owns the replay state at the StudioCanvas level; forwarded via `replayKey` prop.
  - `CodeView` (Source panel) migrated to `<Code bare>` — picks up the new `--gds-code-*` palette automatically instead of the washed-out prism `vsLight` / `vsDark` themes.
  - `GradePayloadPanel` (walker) — fallback token names corrected from non-existent `--gds-card` / `--gds-border` / `--gds-foreground` to the actual unprefixed semantic tokens. The Source panel was rendering with the inline-style numeric fallbacks instead of inheriting the theme.

  ### Tokens

  - **`--accent-glow`** — new tonal halo for raised/tactile chrome. Defaults to `var(--primary)` so `<Button variant="raised">` reads as branded by default, not as selection blue. Per-button `--btn-glow` overrides still flow through.
  - **`--gds-code-*`** — full set of token roles for the Code component (bg, fg, keyword, string, function, comment, number, tag, attr-name, attr-value, diff-added, diff-removed, line-highlight). Light + dark + mirrors in `apps/docs/app/globals.css`.
  - **`.gds-code-cursor`** — blinking caret keyframes (1.05s iOS/macOS cadence, respects `prefers-reduced-motion`).

  ### Docs

  - Component pages for `Code` and `Banner` (covering every variant + scenario + props table + accessibility).
  - `ComponentPreview` (used on every component docs page) now renders its Code tab through `<Code bare>` so docs syntax highlighting matches Studio + marketing.
  - Sidecars across all surface-bearing components rewritten as scenario-led canonical examples with explicit anti-patterns.

  ### Fixes

  - `theme-export-md`: guard against `theme.input` being undefined; `JSON.stringify(undefined)` was returning `undefined`, blowing up downstream `.replace` calls with the cryptic "Cannot read properties of undefined (reading 'replace')".
  - Maps: `maplibre-gl` added to `apps/docs` so the `/components/map` page's MapLibre adapter actually loads (was failing the dynamic import silently, rendering an empty container).

## 1.0.0

### Major Changes

- fcc5317: **BREAKING: runtime token namespace renamed from `rds-*` / `ramp-*` to `gds-*` / `grade-*`**

  The last of the legacy `ramp-ds`-era token names are gone. Every runtime surface that touches the brand prefix has been renamed in one sweep:

  | Old                    | New                    | Where it lives                                                                                                                                                          |
  | ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `--rds-*`              | `--gds-*`              | CSS custom properties (every theme token, every component token — ~720 references)                                                                                      |
  | `.rds-*`               | `.gds-*`               | CSS class names (`gds-app-shell`, `gds-card`, `gds-button`, `gds-aura-*`, `gds-surface-*`, `gds-flex`/`grid`/`row`/`stack`, the `gds.*` Tailwind color namespace, etc.) |
  | `data-ramp-theme`      | `data-grade-theme`     | HTML attribute on `<html>` set by `GRADE_PRE_HYDRATION_SCRIPT`                                                                                                          |
  | `'ramp-mode'`          | `'grade-mode'`         | localStorage                                                                                                                                                            |
  | `'ramp-theme'`         | `'grade-theme'`        | localStorage                                                                                                                                                            |
  | `'ramp-user-themes'`   | `'grade-user-themes'`  | localStorage                                                                                                                                                            |
  | `'rds-playgrounds'`    | `'gds-playgrounds'`    | localStorage                                                                                                                                                            |
  | `'rds-template-saves'` | `'gds-template-saves'` | localStorage                                                                                                                                                            |
  | `'rds-chat-settings'`  | `'gds-chat-settings'`  | localStorage                                                                                                                                                            |

  ### What stays

  - `--ramp-*` CSS custom properties — these are the per-step OKLCH color-ramp values (`--ramp-50` … `--ramp-950`) and refer to _color ramps_ as a technical concept, not the Ramp brand. Untouched, as in the previous Ramp→Grade pass.
  - The React API (`GradeThemeProvider`, `useGradeTheme`, `GRADE_PRE_HYDRATION_SCRIPT`) — already on the new names from the prior rebrand.

  ### Migration

  Anyone consuming `@gradeui/ui` from npm needs to:

  1. **CSS overrides** — find/replace `--rds-` → `--gds-` and bare `.rds-` → `.gds-` in any stylesheet that targets Grade tokens or classes.
  2. **Tailwind config** — if you extended Grade's colour palette, update references to the `rds` namespace (`text-rds-gray-500` → `text-gds-gray-500`, etc.).
  3. **HTML attribute targeting** — replace `[data-ramp-theme="…"]` selectors with `[data-grade-theme="…"]`.
  4. **localStorage** — no migration shim ships with this release. The library had no external installs prior to this change, so anyone on a dev branch will get a one-time loss of their saved theme / playground / template-saves selection on next load.

  ### Why now

  The rename was on the books from the original Ramp→Grade rebrand. It was deferred to avoid wiping persisted user state for any in-flight consumer. With no public installs yet, "now" was the cheapest moment to take it.

  The rename script (`scripts/rename-rds-to-gds.py`) is checked in. It walks the monorepo, runs a longest-first replacement list, and protects technical substrings (`--ramp-*`, `@rds-energy`, `rds-energy-zap` URL slug). Re-runnable and idempotent.

### Minor Changes

- bc47f79: May 2026 refresh — new components, two renames, AI pipeline upgrades, bug fixes

  ### Component renames (BREAKING for `@gradeui/ui`)

  - **`Alert` → `Callout`.** The old name implied modal / interruptive behaviour the component doesn't have (Apple HIG `Alert` is a modal, and `role="alert"` is assertive ARIA). The component is inline, ambient, and non-blocking — `Callout` is honest about that. `Alert` is now reserved in the barrel for a future genuinely-interruptive primitive. For modal-alert semantics (HIG / React Native `Alert`), use `<Dialog>`. The `highlight` variant was dropped in the same change — it overlapped `warning` (amber) without a distinct intent. ARIA role is now variant-conditional: `warning` / `destructive` → `role="alert"` (assertive), `info` / `success` / `default` → `role="status"` (polite).
  - **`SideMenu` → `Sidebar`**, rebuilt as a compound API: `Sidebar` / `SidebarHeader` / `SidebarContent` / `SidebarFooter` / `SidebarSection` / `SidebarItem`. `asChild` and `asButton` on Item for routing integration (Next/Link, React Router, action rows). Semantic theme tokens replace the old hard-coded greys; sizing knobs via `--gds-sidebar-*` CSS variables.
  - **`SimpleTabs` deleted.** Merged into Tabs as `variant="underlined"` on TabsList (cascades to triggers via context). `pill` remains the default.

  ### Migration

  ```diff
  - import { Alert, AlertTitle, AlertDescription } from "@gradeui/ui";
  + import { Callout, CalloutTitle, CalloutDescription } from "@gradeui/ui";

  - import { SideMenu } from "@gradeui/ui";
  + import { Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem } from "@gradeui/ui";

  - import { SimpleTabs } from "@gradeui/ui";
  + // Use Tabs with variant="underlined" on TabsList
  ```

  ### New components

  - **`Carousel`** — embla-backed compound API (`Carousel` + `.Slide` + `.VideoSlide` + `.Dots` + `.Arrows` + `.Prev` + `.Next`). Custom autoplay loop (no plugin) so per-slide `duration` overrides and "advance-on-video-end" fall out cleanly. `VideoSlide` autoplays muted + loop with a poster swap on activation by default. Token-driven via `--gds-carousel-*`. Wired into the `tv-streaming` reference layout as the featured row.
  - **`MultiSelect`** — multi-pick combobox (Popover + Command + Badge). Data-driven via `options`; selected items render as removable badges in the trigger with `maxCount` "+N more" overflow; Select All / Clear / Close actions in the dropdown footer. Per-option `icon` shows up in both the dropdown row and on the selected badge.
  - **`Stack.justify`** — new main-axis prop on Stack (mirrors Row's existing `justify`). Stops scaffolds from reaching for `className="flex flex-col justify-end"`.

  ### Studio playbook upgrades

  - **Sidecar prose body now pinned to the model.** Previously only the frontmatter shipped to the system prompt; the canonical JSX example and `### Anti-patterns` only rendered to humans on the docs page. Now the prose body gets pinned verbatim under a labelled section whenever the sidecar wins retrieval. This closed the "model guessed the API" failure mode for compound components like Carousel and MultiSelect.
  - **Contract-backed JSX validator.** New post-pass at `apps/docs/lib/qa/validate-jsx.ts` runs on `streamText.onFinish`. Walks every `<Component prop=…/>` in the emitted JSX, looks up the contract, and validates each used prop against the Zod schema. Reports unknown props, invalid enum values, missing required props, wrong types — all with source locations. Logs server-side today; surfacing into the chat UI is a follow-up.
  - **Cross-platform aliases sweep.** Every sidecar's `aliases:` array now includes Apple HIG (macOS, iOS, SwiftUI) and React Native vocabulary alongside the existing web/shadcn terms. Designers speccing across RN-mobile + Tailwind-web teams can describe components in any of those vocabularies and retrieval still fires. HIG is a _reference_ vocabulary — no renames.
  - **Studio scaffolds migrated to Sidebar.** `saas-user-editor`, `music-app`, `ecommerce-listing` now compose Sidebar inside `<AppShellNav placement="side">` instead of raw Stacks of Buttons. Starter prompts (`app-side-nav`, `app-docs`) updated to instruct the model to do the same.

  ### Bug fixes

  - **Studio selection panel refresh.** Clicking from one MediaSurface to another now correctly refreshes the right panel. `PropControl` key includes `instanceId` (so React fully remounts); new `readDataArrayEntryField` reads per-instance content props from the data-array entry instead of template-wide.
  - **Map preview not rendering** (across all providers). Removed `/* webpackIgnore: true */` from the dynamic peer-dep imports in the maplibre / mapbox / google adapters. The directive kept bare specifiers literal at runtime, which browsers can't resolve — every Map render fell into the `sdk-missing` catch even when the peer dep was installed. Plain dynamic imports let the bundler code-split each peer into its own chunk that loads only when Map mounts.
  - **AI Chat icon-light refresh.** Dropped User + Sparkles avatars on messages, gradient sparkle box on the header, big sparkle on the empty state, sparkle on the thinking indicator. Suggested-prompt chips are text-only. The chat reads as conversation now, not as a branded product surface.

  ### Docs

  - New component pages: Callout, MultiSelect, Sidebar, Carousel, ComponentProps. Old Alert / SimpleTabs / SideMenu routes return `notFound()` — clean break, no redirects (no external consumers yet).
  - Components nav reordered: Layout → Navigation → Forms → Data Display → Charts → Feedback → Media → Map → Studio. "Blocks" category renamed to "Studio" (AI Chat + Component Props under it).
  - `/docs/studio/how-it-works` rewritten: Fast Frame as the default renderer (Sandpack moves to parity-check role), contracts system documented, prose-body pinning and JSX validator added to the pipeline diagram (now six steps).
  - New `ComponentProps` docs renderer auto-derives a props table from a `ComponentContract` (hand-rolled Zod → TS-string printer; no extra dep). Designed to replace per-page hand-authored `PropsTable` as docs migrate.

  ### `@gradeui/studio` impact (patch)

  - Playbook allow-list, sidecars, and contracts registry updated to track the renames + new components. Existing Studio designs that contain `<Alert>` / `<SideMenu>` / `<SimpleTabs>` won't compile in Fast Frame after upgrading — the chat will need to regenerate them, or a manual find-replace is fine.
  - Generators (`generate-sidecars.mjs`, `generate-contracts.mjs`) now drop empty `.md` files as "retired" so truncate-as-delete works cleanly.

  ### New subpath: `@gradeui/ui/contracts`

  Server-safe entrypoint for the typed contracts registry. The main `@gradeui/ui` entry bundles every component, so importing `COMPONENT_CONTRACTS` from it loads React at module init — which crashes in a Server Component / API route boundary with "useEffect cannot be used in a Server Component." The new `@gradeui/ui/contracts` subpath has only Zod + the per-component `*.contract.ts` files (no React), so it's safe from anywhere (Edge runtime, API routes, MCP servers, CLI). Migration:

  ```diff
  - import { COMPONENT_CONTRACTS } from "@gradeui/ui";
  + import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts";
  ```

## 0.10.0

### Minor Changes

- c4f222f: Component sidecars now ship inside the package.

  Every component in `@gradeui/ui` has a sidecar Markdown file at
  `components/ui/<name>.md` — same folder as its `.tsx` source — describing
  the component's API, when to reach for it, idiomatic examples, and any
  gotchas. The `files` field in `package.json` now includes
  `components/ui/*.md`, so the briefs travel with the published tarball.

  The sidecars are what the Grade Studio chat reads to steer model
  generations, and they're being added so that:

  - Consumers building their own AI tooling (custom Studio forks, MCP
    servers, code-gen pipelines) can feed `node_modules/@gradeui/ui/components/ui/*.md`
    to their LLM of choice without depending on `@gradeui/studio`.
  - The single-source-of-truth promise actually holds across the package
    boundary — change a component, change its sidecar, in the same commit.

  Sidecars added in this release for every shipping component:
  `accordion`, `ai-chat`, `alert`, `app-shell`, `avatar`, `badge`,
  `breadcrumb`, `button`, `calendar`, `card`, `chart`, `checkbox`,
  `collapsible`, `command`, `date-picker`, `dialog`, `dropdown-menu`,
  `flex`, `grid`, `hover-card`, `input`, `label`, `map`, `media-surface`,
  `popover`, `progress`, `radio-group`, `resizable`, `rive-player`, `row`,
  `scroll-area`, `select`, `separator`, `shader-preset-picker`,
  `shader-preset-preview`, `sheet`, `side-menu`, `simple-tabs`,
  `skeleton`, `slider`, `stack`, `switch`, `table`, `tabs`, `textarea`,
  `three-scene`, `toast`, `toggle`, `toggle-group`, `tooltip`,
  `video-player`.

  No runtime changes — this is purely a packaging change. Existing
  imports keep working.

## 0.9.0

### Minor Changes

- 6a61a68: **AppShell**: add `Header`, `Aside`, `Footer` slots and a new `nav="three-pane"` variant.

  The shell is now a CSS-grid template-areas layout keyed off `data-nav` on the
  root, so slot order in JSX no longer matters — each slot has a fixed
  `grid-area`. This unlocks marketing-page layouts (`<AppShellHeader>` + main

  - `<AppShellFooter>`) and the Slack/Mail/Notion 3-column shape (nav rail +
    fixed Aside + flex Main).

  The middle column width in `nav="three-pane"` is set by the
  `--rds-app-shell-aside` CSS variable (default 320px) — override per-screen
  without forking the component.

  The existing `nav="none" | "top" | "side"` variants keep their previous
  visual behaviour; only the implementation moved to template areas.

  New exports: `AppShellHeader`, `AppShellAside`, `AppShellFooter` plus their
  prop types.

  **Resizable** (new): port of shadcn's `resizable`, built on
  `react-resizable-panels`. Use when you want user-adjustable column widths
  inside any layout — e.g. a 3-column app where the user can drag the divider
  between list and detail. Static layouts should keep using
  `<AppShell nav="three-pane">`.

  New exports: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.
  New runtime dep: `react-resizable-panels@^2.1.7`.

- 6a61a68: Add `<Map>` and `<MapMarker>` — a provider-agnostic map primitive.

  The component lazy-loads one of three adapters per the `provider` prop:

  - `maplibre` (default) — uses `maplibre-gl` + MapTiler tiles. The free
    zero-key public demo on `gradeui.com` works via a referrer-locked
    Grade-owned MapTiler key (lives in
    `components/ui/map/demo-config.ts`); consumers on other domains must
    pass their own key via the `tilerKey` prop.
  - `mapbox` — requires `accessToken`. Same engine and style spec as
    MapLibre, swap with one line.
  - `google` — requires `apiKey`. Uses `AdvancedMarkerElement` for DOM
    markers so children inherit `--rds-*` tokens like every other DS part.

  All three SDKs are **optional peer deps** — `maplibre-gl`, `mapbox-gl`,
  and `@googlemaps/js-api-loader` are declared in `peerDependenciesMeta`
  as optional. Consumers install only what they use. Using a provider
  without its SDK installed surfaces `onError({ code: "sdk-missing" })`
  with a developer-facing message containing the install command.

  API highlights (full spec in `packages/ui/MAP.md`, model-facing notes
  in `packages/studio/src/playbook/components/map.md`):

  - `<Map provider center zoom appearance="auto" hoveredId onHoveredIdChange>`
  - `<MapMarker id at anchor>` — children are arbitrary DOM, inherit tokens
  - `appearance="auto"` follows `<GradeThemeProvider>` mode (light/dark)
  - Imperative ref: `flyTo(id|coords)`, `panTo`, `fitBounds`, `getCenter`,
    `getZoom`, `getBounds`, plus `instance` (the provider-native escape
    hatch — cast and use the SDK directly for 3D, custom layers, drawing,
    heatmaps, etc.)

  Sub-path exports `@gradeui/ui/map/maplibre`, `/map/mapbox`, `/map/google`
  let consumers preload a single adapter (skipping the default async
  boundary) for SSG or eager-load scenarios.

  Coordinates are always `[lng, lat]` tuples in the public API. Each
  adapter normalizes internally — Google's `{ lat, lng }` object form is
  handled in `adapters/google.ts`.

  Unblocks the `airbnb-listings` reference layout, parked under
  `MISSING_COMPONENTS` in `packages/studio/src/playbook/layouts/index.ts`.
  That scaffold ships in a follow-up changeset alongside the
  `MISSING_COMPONENTS` cleanup.

- 47b97b0: Foundation pass on Tabs, ToggleGroup, Button + new Breadcrumb primitive.

  **Tabs**

  - T-shirt sizes (`sm` / `md` / `lg`) via CVA, default `md`. A small
    size context cascades from `TabsList` to every `TabsTrigger` so
    consumers set the size once on the list.
  - Explicit per-size heights on the trigger so vertical and horizontal
    whitespace stay symmetric — fixes the "padding feels off" v1
    papercut.
  - New `tooltip` prop on `TabsTrigger`. Pass it on an icon-only trigger
    and the component wraps the trigger in the design-system `Tooltip`
    - auto-applies `aria-label` (if not set) so screen readers still
      have an accessible name. Requires a `TooltipProvider` somewhere
      above the tabs.
  - `[&_svg]:size-*` baked into each size variant, so icon children
    sit at the right scale without per-call className overrides.

  **ToggleGroup**

  - Self-contained CVA (`toggleGroupVariants` /
    `toggleGroupItemVariants`) instead of composing `toggleVariants`
    from `Toggle`. The two components have different intents
    (standalone on/off vs in-group picker) and shouldn't share styling.
  - Visual parity with `TabsList`/`TabsTrigger` — same pill chrome,
    same active-state lift, same t-shirt scale. A segmented control
    reads identically whether you reached for Tabs or ToggleGroup.
  - Size cascades from group to items via context (matches the Tabs
    pattern).

  **Button**

  - Size scale aligned to Tabs heights exactly: `sm` = h-7, `md` = h-8,
    `lg` = h-10. Type and icon sizes follow the same scale.
  - `default` is preserved as an alias for `md` so existing call sites
    keep working through the rename.
  - A button placed next to a `TabsList` of the same size now lines up
    edge-to-edge without per-call overrides.

  **New `Breadcrumb` primitive**

  - Composable, surface-less navigation primitive (Breadcrumb /
    BreadcrumbList / BreadcrumbItem / BreadcrumbLink / BreadcrumbPage /
    BreadcrumbSeparator / BreadcrumbEllipsis).
  - Density matches `TabsTrigger`. Theme-token colours throughout.
  - `BreadcrumbLink` renders an `<a>` when `href` is set, a `<button>`
    for in-app click handlers, or a `<span>` when `asChild` is used —
    same visual either way.

  **Removed: `TopMenu`**

  - `TopMenu` and its subcomponents (`TopMenuUser`, `TopMenuUserItem`,
    `TopMenuUserSection`) are dropped from the package. Inherited from
    an earlier iteration and too specific to one app-shell shape to
    pull its weight as a design-system primitive. The new `Breadcrumb`
    covers the navigation-crumbs case generically; compose any other
    header chrome at the consumer level.

  **Theme system**

  - `applyThemeToRoot` is now a thin wrapper over the new
    `applyThemeToElement(theme, mode, target)` so themes can be scoped
    to any `HTMLElement` (a div, an iframe's document element). Same
    semantics as before for the existing usage.

  **Studio theme**

  - New `studioInput` ships as the default chrome theme — off-white
    parchment surface, near-black text and buttons via a small
    per-theme tokenOverrides pass that re-routes the primary token to
    the dark end of the neutral ramp.
  - `defaultThemeId` now points at `studio`. Existing user themes
    (calm, energy) remain available in the switcher.

## 0.8.2

### Patch Changes

- c0b8e6b: Export `Avatar`, `AvatarImage`, `AvatarFallback` from the package barrel.
  The component has shipped since v0.3 but was never re-exported from
  `lib/index.ts`, so `import { Avatar } from "@gradeui/ui"` resolved to
  `undefined` and Sandpack crashed with "Element type is invalid".
  Visible in Studio as four of the five reference-layout scaffolds
  (saas-user-editor, music-app, tv-streaming, data-table-filters) failing
  to render; ecommerce-listing was the only one that didn't use Avatar.

## 0.8.1

### Patch Changes

- 8b11cd2: Expose `./package.json` as a subpath export so consumers (notably the
  docs app's Studio header) can import the raw manifest to read
  `version` at build time without a deep `node_modules` path.

## 0.8.0

### Minor Changes

- bd9400b: Add `Flex` — the unopinionated flexbox primitive, the CSS-aligned escape hatch under Stack / Row / Grid. Exposes `direction` (`"row" | "col" | "row-reverse" | "col-reverse"`), `gap`, `align` (including `baseline`, which Stack/Row don't expose), `justify`, and `wrap` (`"nowrap" | "wrap" | "wrap-reverse"`) directly. Defaults match CSS — no baked-in rhythm — so consumers pay for exactly the props they set. Reach for Flex when Stack / Row / Grid don't fit (reverse direction, baseline alignment, or when you want raw CSS defaults instead of Row's `items-center gap-md` starting point).
- ac0d760: Add `Grid` — the 2D layout primitive, completing the Stack/Row/Grid trio. `cols` prop (`"1" | "2" | "3" | "4" | "5" | "6" | "12"`) bakes in a sensible responsive ladder so `<Grid cols="4">` expands to the canonical `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` stat-card pattern. `gap` and `align` scales match Stack and Row so props transfer cleanly when switching layout types.

## 0.7.0

### Minor Changes

- 8a9d01e: Add `AppShell`, `AppShellNav`, and `AppShellMain` — a top-level page scaffold primitive. `nav` variant picks the layout structure (`"none" | "top" | "side"`), `AppShellMain`'s `maxWidth` caps content width (`"full" | "container"`), and `AppShellNav` is sticky by default. Just structure — no collapse state, no context, SSR-safe.

## 0.6.0

### Minor Changes

- 557459c: Add `Stack` and `Row` — the first wave of layout primitives.

  These exist so the model (and a human reaching for the settings panel) composes pages with named layout components instead of hand-rolling `flex flex-col gap-*` on every generation. The alignment, gap, and distribution knobs are variant props, which means they become editable in Studio the moment Studio can see them — the same way every other DS component's settings come through.

  **`Stack`** — vertical rhythm primitive.

  - `gap`: `none | xs | sm | md | lg | xl | 2xl` (default `md`)
  - `align`: `start | center | end | stretch` (default `stretch`)
  - `asChild` via Radix Slot for stamping onto a semantic tag (`<section>`, `<main>`, etc.)
  - Root class `rds-stack flex flex-col`, `data-gds-part="stack"`
  - Exported alongside `stackVariants` and `StackProps`

  **`Row`** — horizontal rhythm primitive.

  - `gap`: same scale as Stack
  - `align`: `start | center | end | stretch | baseline` (default `center` — matches what most real rows want)
  - `justify`: `start | center | end | between | around | evenly` (default `start`)
  - `wrap`: boolean (default `false`)
  - `asChild` via Radix Slot
  - Root class `rds-row flex flex-row`, `data-gds-part="row"`
  - Exported alongside `rowVariants` and `RowProps`

  Row is distinct from a two-pane `Split` primitive (coming later). Row evenly flows whatever children it holds with a shared gap; `Split` will enforce an explicit pane ratio (1/3 + 2/3, sidebar + content, etc.).

  Both components have sidecar docs in `apps/docs/components/ui/{stack,row}.md` with a new `role: layout` frontmatter field — the first use of the role taxonomy that slot-based App Shells / scaffolds will filter against.

### Patch Changes

- 557459c: Stamp `data-gds-part` on every Card subcomponent so LLMs, design tools, and CSS can target the stable internal parts the same way they already target the media/shader primitives.

  - `Card` → `data-gds-part="card"`
  - `CardHeader` → `data-gds-part="card-header"`
  - `CardTitle` → `data-gds-part="card-title"`
  - `CardDescription` → `data-gds-part="card-description"`
  - `CardContent` → `data-gds-part="card-content"`
  - `CardFooter` → `data-gds-part="card-footer"`

  Non-breaking: the attributes are added above the existing `{...props}` spread, so consumers can still pass their own `data-gds="..."` (or any other attr) and have it win. This follows the same convention established on `MediaSurface`, `ThreeScene`, `VideoPlayer`, `ShaderPresetPicker`, and `ShaderPresetPreview` — DS owns `data-gds-part`, consumers own `data-gds`.

  Applied in both the library source (`packages/ui/components/ui/card.tsx`) and the docs-site copy (`apps/docs/components/ui/card.tsx`) to keep them in sync until the docs app starts importing from the library directly.

## 0.5.3

### Patch Changes

- e7948fd: Fix `ThreeScene` palette when tokens are authored as bare channel triplets (shadcn / gradeui convention — `--primary: 0.610 0.128 20`, no `oklch()` wrapper).

  Passing `palette={{ primary: "var(--primary)" }}` on the gradeui default theme rendered the shader pure black because `var(--primary)` expanded to the raw string `"0.610 0.128 20"`, which is not a valid CSS `<color>` — the browser fell back to the inherited colour (black) and the palette resolver happily handed that to THREE.

  The resolver now peeks at the raw custom-property value whenever the input is a `var(--token)` reference. If the value looks like an OKLCH triplet (three bare floats) or an HSL triplet (shadcn-style, with `%` on channels 2 and 3), it's re-wrapped as `oklch(...)` / `hsl(...)` before being handed to the DOM probe. Fully-formed colours (`oklch(...)`, `#hex`, `rgb(...)`, named colours, and `var(...)` pointing at a pre-wrapped value) are unchanged.

  Net effect: `palette={{ primary: "var(--primary)", secondary: "var(--secondary)", ... }}` now Just Works on gradeui themes and re-tints on theme change, matching the docs.

## 0.5.2

### Patch Changes

- 800b9ac: Fix `ThreeScene` palette failing when tokens are authored in `oklch()` / `oklab()` / `color(srgb …)`.

  0.5.1 resolved CSS expressions via a DOM probe, but `getComputedStyle` preserves CSS Color 4 formats — so `var(--primary)` in a gradeui theme came out as `oklch(0.74 0.18 350)`, which `THREE.Color.setStyle()` can't parse and silently rendered black.

  The resolver now rasterises the computed colour through a 1×1 canvas, which is guaranteed to gamut-convert any CSS colour to sRGB bytes. Result: `var(--primary)` on an `oklch`-based theme round-trips into `rgb(r, g, b)` before THREE sees it.

  Fast path retained: if the browser already returned `rgb(…)` form, we skip the canvas step.

## 0.5.1

### Patch Changes

- 875dcb7: `ThreeScene` palette now accepts any CSS-legal colour expression.

  Previously the palette only worked with hex / `rgb()` / named colours (what `THREE.Color.setStyle()` happens to parse). Raw values like `oklch(0.74 0.18 350)` or `var(--primary)` silently fell through to black.

  Palette values are now normalised via a DOM probe + `getComputedStyle`, so every slot accepts:

  - CSS custom properties — `"var(--primary)"`
  - `oklch()`, `lab()`, `lch()`, `oklab()` — full CSS Color 4
  - `hsl()`, `rgb()`, hex, named colours (still work)

  **Automatic theme re-tinting.** A `MutationObserver` on the document root watches for `class`, `data-theme`, `data-gds-theme`, and `data-grade-mode` changes. When the active theme flips, the scene re-resolves palette values and pushes new uniforms into the running shader — no WebGL remount.

  Recommended pattern for DS consumers:

  ```jsx
  <ThreeScene
    preset="plasma"
    palette={{
      primary: "var(--primary)",
      secondary: "var(--secondary)",
      accent: "var(--accent)",
      background: "var(--background)",
    }}
  />
  ```

## 0.5.0

### Minor Changes

- 4eb7cac: Expand `ThreeScene` with on-demand custom fragment shaders and three new shipped presets.

  **New preset scenes** (`preset="…"`):

  - `plasma` — soft rolling colour clouds driven by overlapping sine waves.
  - `voronoi` — jittered cellular grid with glowing, time-animated edges.
  - `synthwave` — retro perspective grid receding to a banded sun disc.

  All palette-driven off the same `{ primary, secondary, accent, background }` slots as `space`.

  **New `fragmentShader` prop.** Users (and LLM agents) can now write GLSL directly against a fixed uniform contract — `uTime`, `uResolution`, `uMouse`, `uPrimary`, `uSecondary`, `uAccent`, `uBackground`, plus `varying vec2 vUv`. The header is auto-injected; only `void main()` needs to be authored. Runs on a fullscreen orthographic quad, auto-wires pointer tracking, and shares all post-FX presets with preset-backed scenes.

  **Resilient compile errors.** A new `ShaderCompileError` class surfaces GL info logs via an `onShaderError` callback; the scene automatically falls back to `preset="space"` on compile failure, so a bad shader never leaves the surface blank.

  New public exports: `FRAGMENT_HEADER` (the auto-injected prelude, for introspection), `ShaderCompileError`, `buildFragmentShaderScene`.

## 0.4.0

### Minor Changes

- 4e71353: Add Media section: `MediaSurface`, `VideoPlayer`, `RivePlayer`, `ThreeScene`,
  `ShaderPresetPreview`, `ShaderPresetPicker`. All share a common
  aspect-ratio surface with `--rds-media-radius` and pause-on-offscreen
  behaviour.

  - `VideoPlayer` — native `<video>` wrapped in the shared surface; controls
    on by default, or chromeless viewer mode for hero/background loops.
    Posters render as a `loading="lazy"` `<img>` overlay rather than using
    the native `poster` attribute, so offscreen players don't fetch the
    still eagerly.
  - `RivePlayer` — `@rive-app/react-canvas` runtime (optional dep, lazy
    imported) with state-machine inputs and fit modes.
  - `ThreeScene` — WebGL primitive with a shader preset registry + post-FX
    presets (`vhs`, `cinematic`, `synthwave`, `crt`). Bring-your-own scene
    factory also supported.
  - `ShaderPresetPreview` / `ShaderPresetPicker` — thumbnail cards and a
    filterable gallery, both backed by the same registry that drives
    `<ThreeScene preset="…" />`.

  Also: fixed a Calendar SSR hydration mismatch (locale-dependent
  `data-day` attribute — now emitted as an ISO string) and split
  convolution vs UV-transforming effects into separate
  `EffectPass` instances so post-processing composition doesn't throw at
  construction time.

## 0.3.0

### Minor Changes

- 899d77c: Add `DatePicker` and `DateRangePicker` as sealed complex components, and export the underlying `Calendar` and `Popover` primitives from the barrel.

  Previously consumers had to compose Popover + Button + Calendar themselves (or fall back to `<input type="date">`). Now:

  ```tsx
  import { DatePicker, DateRangePicker } from "@gradeui/ui"

  <DatePicker value={date} onChange={setDate} />
  <DateRangePicker value={range} onChange={setRange} numberOfMonths={2} />
  ```

  The DatePicker exposes a `value` / `onChange` contract over a `Date` (or `DateRange`), with optional `placeholder`, `format` (date-fns token, default `"PPP"`), `align`, `side`, `captionLayout`, `icon`, `contentClassName`, and `numberOfMonths` (range only). Internally it still composes Popover + Button + Calendar, so consumers who need a custom trigger can import those primitives directly and build their own.

## 0.2.0

### Minor Changes

- fc1241a: Alert gains paired soft/deep status tokens across success, warning, info,
  highlight, and destructive. The `-soft` token drives tinted surfaces and
  `-deep` drives on-surface text and icon colour, derived through
  `deriveAlertPair` in the theme pipeline so both remain legible across
  generated palettes. Exposed as `bg-*-soft`, `text-*-deep`, and
  `border-*/30` utilities via the Tailwind preset.

  Finishes the Ramp → Grade rename: `ramp-mode-switcher`,
  `ramp-theme-provider`, and `ramp-theme-switcher` are now `grade-*`.
  `@ramp-ds/ui` consumers should switch to `@gradeui/ui` (the old package
  is defunct).

## 0.1.1

### Patch Changes

- 74baf04: Initial public release of @gradeui/core, @gradeui/ui, and @gradeui/pro.
