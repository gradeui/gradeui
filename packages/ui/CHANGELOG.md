# @gradeui/ui

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
