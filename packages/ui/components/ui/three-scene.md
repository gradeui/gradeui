---
name: ThreeScene
import: "@gradeui/ui"
props:
  - preset?: "space" | "plasma" | "voronoi" | "synthwave" — shader preset id from the registry
  - fragmentShader?: string — user-authored GLSL body; takes precedence over preset
  - onShaderError?: (error: ShaderCompileError) => void — fires on compile failure; scene falls back to `preset="space"`
  - postPreset?: "none" | "vhs" | "cinematic" | "synthwave" | "crt" (default "vhs") — post-processing pass
  - palette?: Partial<{ primary; secondary; accent; background }> — any CSS-legal colour string per slot. Re-tints automatically when the theme changes. Unset slots fall back to defaults.
  - createScene?: (ctx) => SceneHandle — custom full scene factory; takes precedence over preset AND fragmentShader
  - controls?: boolean (default false) — play/pause overlay
  - autoPlay?: boolean (default true) — respects reduced-motion
  - pauseOffscreen?: boolean (default true) — big win for WebGL battery life
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "video")
  - maxDpr?: number (default min(devicePixelRatio, 2)) — lower for thumbnails / low-end devices
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg")
when_to_use: WebGL primitive for shader backgrounds, generative visuals, and bespoke three.js scenes. Three authoring paths, in order of preference — (1) pick a `preset` id; (2) if nothing in the registry fits, write a `fragmentShader` against the fixed uniform contract; (3) only as a last resort, pass a full `createScene` factory. For looping video, use VideoPlayer; for interactive animations, use RivePlayer.
composes_with: [MediaSurface (internal), foreground content stacked above with `position: absolute/relative z-10`]
aliases: [three, threejs, webgl, shader, scene, 3d, generative, hero background, fragment shader, glsl]
notes: |
  Depends on `three` and `postprocessing` (bundled into @gradeui/ui). Safari caps concurrent WebGL contexts at ~8 — for preset galleries, prefer ShaderPresetPreview with `live="hover"`.

  ## Path 1 — `preset` (pick one, fastest, highest quality)

  Valid `preset` ids (complete list — do NOT invent any others):
    - "space"     — Hyperspace starfield, streaking stars. Default post: "vhs".
    - "plasma"    — soft rolling colour clouds, ambient/abstract. Default post: "synthwave".
    - "voronoi"   — jittered cellular grid with glowing edges. Default post: "crt".
    - "synthwave" — retro perspective grid + banded sun. Default post: "synthwave".

  Any other preset id renders an empty surface. If these don't cover the ask, DO NOT invent a name — jump to Path 2 (`fragmentShader`) and write the shader directly.

  Valid `postPreset` ids (complete list): "none" | "vhs" | "cinematic" | "synthwave" | "crt".

  Re-skin any preset with `palette={{ primary, secondary, accent, background }}` to shift its mood. Preset + palette + postPreset is usually enough to hit ocean / lava / neon / forest vibes.

  ### Palette values — what counts as a valid colour

  Each slot accepts ANY CSS-legal colour expression. Values are normalised via a browser probe before being handed to three.js, so all of these work:

    - CSS custom properties wrapped in a colour function — `"oklch(var(--primary))"`, `"oklch(var(--foreground))"`. **This is the recommended pattern for gradeui consumers.** gradeui tokens (like shadcn) are bare channel triplets (`--primary: 0.610 0.128 20`), so `var(--primary)` alone is NOT a valid CSS colour and will render black. ALWAYS wrap as `oklch(var(--token))`. The shader re-tints automatically on theme change.
    - Hex — `"#ff5fb9"`, `"#f5b"`.
    - `rgb()` / `rgba()` — `"rgb(255 95 185)"`, `"rgb(255, 95, 185)"`.
    - `hsl()` / `hsla()` — `"hsl(330 100% 69%)"`.
    - `oklch()` / `lab()` / `lch()` / `oklab()` — `"oklch(0.74 0.18 350)"`. Full CSS Color 4.
    - Named colours — `"tomato"`, `"dodgerblue"`, `"black"`.

  INVALID — these DO NOT work and will silently fall back to the default palette slot:

    - Literal bare triplets passed as a palette string — `"0.4 0.1 0.9"` is NOT a colour; wrap it as `"oklch(0.4 0.1 0.9)"`. (The var()-based auto-wrap above only kicks in when the palette value is `var(--token)` and the token itself is a triplet — it can't rescue a raw triplet passed directly.)
    - three.js hex numbers — `0xff5fb9` (number). Use the string `"#ff5fb9"`.
    - Colour arrays — `[0.4, 0.1, 0.9]`. Not accepted.

  Theme reactivity: when the host document's root class or `data-theme` attribute changes, the scene re-reads the palette and pushes new uniforms into the running shader WITHOUT tearing down the WebGL context. Dark/light swaps are essentially free.

  ### gradeui token semantics — pick the RIGHT tokens, and ALWAYS wrap in `oklch()`

  gradeui tokens are bare OKLCH channel triplets (`--primary: 0.610 0.128 20`, no `oklch()` wrapper) — same convention as shadcn. That means **every `var(--token)` passed to the palette MUST be wrapped in `oklch(...)` at the call site**: `"oklch(var(--primary))"`, not `"var(--primary)"`. Unwrapped values resolve to invalid CSS and render black.

  Token role cheat-sheet when picking which slot maps to what:

    - `--primary` — brand hue 1. USE for `palette.primary` (and often `palette.accent` too).
    - `--accent` — brand hue 2. USE for `palette.secondary` — gradeui's `--secondary` is a NEUTRAL surface (identical to `--muted`) and will render as a flat near-white wash in the shader.
    - `--foreground` — inverted neutral (dark in light mode, light in dark mode). USE for `palette.background` — the raw `--background` token is the page background (near-white in light mode) and will wash the shader out.

  Idiomatic theme-reactive palette for gradeui consumers (copy verbatim):

    ```jsx
    palette={{
      primary: "oklch(var(--primary))",
      secondary: "oklch(var(--accent))",   // NOT var(--secondary) — that's a neutral
      accent: "oklch(var(--primary))",
      background: "oklch(var(--foreground))", // NOT var(--background) — that's the page bg
    }}
    ```

  ## Path 2 — `fragmentShader` (custom GLSL)

  Pass a GLSL fragment shader body as a string. Runs on a fullscreen quad. Header is AUTO-INJECTED — write `void main()` only and use the uniforms below as given. Do NOT redeclare them, do NOT add `#version` directives, do NOT `import * as THREE` — you are writing shader text, not JavaScript.

  Auto-injected header (available to every fragmentShader):

    ```glsl
    precision highp float;
    varying vec2 vUv;               // [0,1] across the quad
    uniform float uTime;            // elapsed seconds
    uniform vec2  uResolution;      // pixel size of the canvas
    uniform vec2  uMouse;           // [0,1], y-up (GLSL convention); defaults to (0.5, 0.5)
    uniform vec3  uPrimary;         // palette.primary  (theme-driven)
    uniform vec3  uSecondary;       // palette.secondary
    uniform vec3  uAccent;          // palette.accent
    uniform vec3  uBackground;      // palette.background
    ```

  Minimal working skeleton:

    ```glsl
    void main() {
      vec2 uv = vUv - 0.5;
      float t = uTime;
      vec3 col = mix(uBackground, uPrimary, 0.5 + 0.5 * sin(length(uv) * 10.0 - t));
      gl_FragColor = vec4(col, 1.0);
    }
    ```

  GLSL syntax rules:
    - Use `gl_FragColor` for output (NOT `out vec4`).
    - Use `varying` for inputs (NOT `in`).
    - Use `texture2D` if sampling textures (not `texture`). In practice you won't need textures — stick to procedural colour.
    - Hard cap: keep shaders under ~200 lines. Long raymarchers are usually both slow and wrong.

  Error handling: if the GLSL fails to compile, the component fires `onShaderError` with the GL info log and renders `preset="space"` as a fallback. Never returns a blank surface.

  ## Path 3 — `createScene` (escape hatch)

  A full `SceneFactory` that returns `{ scene, camera, update, resize, setPalette, dispose }`. Only reach for this if you need real geometry, multiple passes, or a custom camera. 95% of "make me a shader" asks are better served by Path 2.

  ## Fullscreen backgrounds

  Surface defaults to `aspect="video"` (16:9). For a full-bleed hero background using `className="absolute inset-0"`, ALWAYS also pass `aspect="auto"` — otherwise the aspect-ratio constraint fights the absolute positioning and you get letterboxing.
---

```jsx
// Path 1 — named preset (fastest path)
<ThreeScene preset="plasma" postPreset="synthwave" aspect="wide" />
```

```jsx
// Path 1 — preset + palette re-skin to hit a custom mood
<ThreeScene
  preset="space"
  postPreset="cinematic"
  palette={{
    primary: "#00e0ff",
    secondary: "#1a7eff",
    accent: "#ffffff",
    background: "#000512",
  }}
/>
```

```jsx
// Path 1 — palette from the active theme via CSS variables.
// Recolors automatically when the theme switches.
//
// gradeui tokens are bare OKLCH triplets (shadcn-style), so EVERY var() MUST
// be wrapped in oklch(...) at the call site — unwrapped `var(--primary)` is
// invalid CSS and will render black.
//
// Slot mapping: `--secondary` is a neutral surface in gradeui (not a brand hue)
// and `--background` is the page bg (near-white in light mode). Map secondary
// to `--accent` and background to `--foreground` for a punchy, theme-reactive
// palette that inverts cleanly on dark-mode toggle.
<ThreeScene
  preset="plasma"
  palette={{
    primary: "oklch(var(--primary))",
    secondary: "oklch(var(--accent))",
    accent: "oklch(var(--primary))",
    background: "oklch(var(--foreground))",
  }}
/>
```

```jsx
// Path 1 — CSS Color 4 (oklch) works too.
<ThreeScene
  preset="voronoi"
  palette={{
    primary: "oklch(0.74 0.18 350)",
    secondary: "oklch(0.62 0.22 260)",
    accent: "oklch(0.92 0.11 95)",
    background: "oklch(0.1 0.04 280)",
  }}
/>
```

```jsx
// Path 2 — custom fragment shader. Header is auto-injected; just write main().
// This one: concentric rings in the theme's primary colour, breathing on uTime.
<ThreeScene
  fragmentShader={`
    void main() {
      vec2 uv = vUv - 0.5;
      uv.x *= uResolution.x / uResolution.y;
      float d = length(uv);
      float rings = 0.5 + 0.5 * sin(d * 30.0 - uTime * 2.0);
      vec3 col = mix(uBackground, uPrimary, rings);
      col = mix(col, uAccent, smoothstep(0.45, 0.5, d) * 0.4);
      gl_FragColor = vec4(col, 1.0);
    }
  `}
  postPreset="vhs"
  aspect="square"
/>
```

```jsx
// Path 2 — interactive: follow the pointer with uMouse.
<ThreeScene
  fragmentShader={`
    void main() {
      vec2 uv = vUv;
      float d = distance(uv, uMouse);
      float glow = smoothstep(0.3, 0.0, d);
      vec3 col = mix(uBackground, uPrimary, glow);
      gl_FragColor = vec4(col, 1.0);
    }
  `}
/>
```

```jsx
// Fullscreen hero — shader behind, content on top.
// `aspect="auto"` is required for inset-0 to fill the parent.
<div className="relative h-screen w-full overflow-hidden">
  <ThreeScene
    preset="synthwave"
    aspect="auto"
    className="absolute inset-0"
  />
  <div className="relative z-10 py-16 px-6 text-center text-white">
    <h1 className="text-5xl font-bold">Build at the speed of thought</h1>
  </div>
</div>
```
