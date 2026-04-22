# @gradeui/ui

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
