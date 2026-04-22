# @gradeui/ui

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
