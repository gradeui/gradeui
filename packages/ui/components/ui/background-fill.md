---
name: BackgroundFill
import: "@gradeui/ui"
props:
  - type: "none" | "solid" | "gradient" | "image" | "video" | "shader" — which paint to render (required)
  - color?: string — solid fill; a token name (`primary`, `card`, `muted`, `accent`, `secondary`, `destructive`, `background`, `transparent`) or any CSS colour
  - gradient?: { from?; via?; to?; angle?; shape?; at?; size? } — stops are token names or CSS colours. shape: "linear" (default, uses `angle`, default 135°) | "radial" (uses `at` — CSS position like "top" / "30% 20%", default "center" — and optional `size` like "45rem 50rem", default farthest-corner)
  - src?: string — image or video URL
  - fit?: "cover" | "contain" | "fill" | "none" — object-fit for image/video (default "cover")
  - position?: string — CSS object/background position (default "center")
  - repeat?: boolean — tile the image (background-repeat) instead of a single <img>
  - tileSize?: string — CSS background-size when repeating (e.g. "120px")
  - preset?: string — shader preset id (see ThreeScene)
  - fragmentShader?: string — custom GLSL (takes precedence over preset)
  - palette?: Partial<{ primary; secondary; accent; background }> — shader palette overrides; wrap tokens as `oklch(var(--token))`
  - postPreset?: string | PostPreset — shader post-FX
  - opacity?: number — layer opacity 0–1
  - blendMode?: CSS mix-blend-mode — blend against the frame behind it
  - radius?: "none" | "sm" | "md" | "lg" | "xl" — match the frame's radius so the paint clips cleanly
when_to_use: The background *paint* of a frame — a generative shader, image, video, gradient, repeating texture, or solid token rendered as a layer BEHIND the frame's content. Use it as the first child of a `relative` frame; it paints an `absolute inset-0`, `z-0`, `pointer-events-none` layer, so content carrying `relative z-10` sits on top. This is the canonical way to give any container a rich background — never drop a full-bleed `<ThreeScene>` or `<img>` as a free-standing sibling. For a sized, in-flow media element (a hero card, a thumbnail), use ThreeScene / MediaSurface / VideoPlayer directly instead.
composes_with: [AppShell, Card, Stack, Row, Grid (any relative container), ThreeScene (shader fill), MediaSurface]
aliases: [background, fill, frame fill, backdrop, surface fill, background image, background video, background gradient, background shader, texture, paint]
notes: |
  ## The fill model

  A background is a PROPERTY of a frame, not a node you select — exactly
  like a fill in Figma / Paper. Select the frame; its Fill controls drive
  this layer. BackgroundFill is the render boundary that makes that true.

  ### Required frame setup

  The parent frame must be `relative` (so the `absolute inset-0` layer
  anchors to it) and ideally `overflow-hidden` (so the paint clips to the
  frame's corners). Content that should sit ABOVE the fill needs its own
  stacking context — wrap it `relative z-10`:

    ```jsx
    <Card className="relative overflow-hidden">
      <BackgroundFill type="shader" preset="mesh" opacity={0.3} />
      <div className="relative z-10">…content…</div>
    </Card>
    ```

  ### Why a layer (and why pointer-events-none)

  A solid colour does not strictly need a layer — it could be the frame's
  own `background`. Every other paint (image, video, gradient, shader,
  tiled texture) needs real pixels, so it renders as an absolutely-
  positioned layer. The layer is `z-0` + `pointer-events-none` so it sits
  behind content and never intercepts clicks. It carries
  `data-gds-part="frame-fill"` + `aria-hidden` so Studio treats it as
  chrome (the frame is the selectable unit) and assistive tech skips it.

  ### Type cheat-sheet

    - solid    — `color` (token or CSS colour). Cheapest.
    - gradient — `gradient={{ from, via?, to, angle }}` for linear;
                 `gradient={{ shape: "radial", at: "top", from, to }}` for a radial
                 glow/wash. Tokens get wrapped in oklch() automatically.
    - image    — `src` + `fit` / `position`; set `repeat` (+ `tileSize`) for a tiled texture.
    - video    — `src` (autoplays muted + looped + inline).
    - shader   — `preset` OR `fragmentShader`, + `palette` / `postPreset`. Delegates to ThreeScene.

  Anti-patterns to avoid:

  - DO NOT build gradients with arbitrary-value Tailwind classes —
    `bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)]`
    renders NOTHING in the Studio preview (no runtime Tailwind compiler) and
    `theme(colors.*)` colours ignore the active Grade theme. Use
    `type="gradient"` with token stops instead — themeable, and it always renders.
  - DO NOT hand-roll `style={{ backgroundImage: "linear-gradient(…)" }}` on the
    frame itself when a BackgroundFill child does the same job — the fill layer
    keeps the paint selectable/editable as a Fill in Studio's inspector.

  `opacity` + `blendMode` apply to every type — the same two controls as
  the inspector's Blending section, so a loud shader/image can be dialled
  back to a subtle wash behind text.
---

```jsx
// Shader background behind a hero, dialled back so text stays readable.
<section className="relative overflow-hidden rounded-xl">
  <BackgroundFill
    type="shader"
    preset="mesh"
    palette={{
      primary: "oklch(var(--primary))",
      secondary: "oklch(var(--accent))",
      accent: "oklch(var(--primary))",
      background: "oklch(var(--foreground))",
    }}
    opacity={0.35}
  />
  <div className="relative z-10 p-12">
    <h1 className="text-4xl font-bold">Build at the speed of thought</h1>
  </div>
</section>
```

```jsx
// Gradient wash on a card.
<Card className="relative overflow-hidden">
  <BackgroundFill type="gradient" gradient={{ from: "primary", to: "accent", angle: 120 }} opacity={0.18} />
  <CardContent className="relative z-10">…</CardContent>
</Card>
```

```jsx
// Radial glow from the top of a hero — the token-true version of the
// classic `radial-gradient(45rem 50rem at top, indigo-50, white)` wash.
<section className="relative overflow-hidden">
  <BackgroundFill
    type="gradient"
    gradient={{ shape: "radial", at: "top", size: "45rem 50rem", from: "primary", to: "background" }}
    opacity={0.2}
  />
  <div className="relative z-10 py-24 text-center">…hero content…</div>
</section>
```

```jsx
// Image background, cover-fit, with a blend mode.
<div className="relative h-64 overflow-hidden rounded-lg">
  <BackgroundFill type="image" src="/hero.jpg" fit="cover" blendMode="multiply" />
  <div className="relative z-10 p-6 text-white">Featured</div>
</div>
```

```jsx
// Tiled texture.
<div className="relative overflow-hidden">
  <BackgroundFill type="image" src="/noise.png" repeat tileSize="160px" opacity={0.08} />
  <div className="relative z-10">…</div>
</div>
```
