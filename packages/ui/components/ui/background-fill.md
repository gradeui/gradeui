---
name: BackgroundFill
import: "@gradeui/ui"
props:
  - type: "none" | "solid" | "gradient" | "image" | "video" | "shader" — which paint to render (required)
  - color?: string — solid fill; a token name (`primary`, `card`, `muted`, `accent`, `secondary`, `destructive`, `background`, `transparent`) or any CSS colour
  - gradient?: { from?; via?; to?; angle? } — gradient stops (token names or CSS colours) + angle in degrees (default 135)
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
    - gradient — `gradient={{ from, via?, to, angle }}`. Tokens get wrapped in oklch() automatically.
    - image    — `src` + `fit` / `position`; set `repeat` (+ `tileSize`) for a tiled texture.
    - video    — `src` (autoplays muted + looped + inline).
    - shader   — `preset` OR `fragmentShader`, + `palette` / `postPreset`. Delegates to ThreeScene.

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
