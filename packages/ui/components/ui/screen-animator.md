---
name: ScreenAnimator
import: "@gradeui/ui"
subcomponents: []
props:
  - shots?: Array<{ zoom?, cx?, cy?, hold?, trans?, label? }> — the tour. Each
      shot is a zoom (1 = fit, >1 push in), focal point cx/cy (0..1 fractions of
      the content), hold (ms dwell), trans (ms glide-in), and a caption label.
      Omit for a static framed view.
  - autoplay?: boolean (default true)
  - loop?: boolean (default true) — fly in → shots → back to start → exit → repeat
  - controls?: boolean (default true) — play / pause / restart transport
  - spotlight?: boolean (default false) — opt in to dim the edges (vignette) when pushed in
  - cursor?: boolean (default true) — synthetic cursor pulse on detail shots
  - enter?: boolean (default true) — fly in from offscreen on start
  - stage?: string — CSS background of the stage behind the screen (default dark)
  - backdrop?: React.ReactNode — a live layer behind the content (image, gradient, or a <ThreeScene> shader)
  - className?: string
  - children: React.ReactNode (the screen to animate)
when_to_use: Wrap ANY screen or section in a directed camera — a "live demo
  director". Give it a list of shots and it tours them (zoom + pan) over the
  live, still-interactive content, with a focus spotlight, captions, a synthetic
  cursor, and play/pause. Use it to turn a built screen into an auto-playing
  product demo (embed it, or drop it on a marketing page). It's the live,
  editable, re-renderable answer to a screen-recording video.
composes_with: [AppShell, ThreeScene, Card, Grid, the whole component set (it wraps a screen)]
aliases: [screen animator, camera, camera tour, director, demo, product demo, zoom pan, spotlight, ken burns, presenter]
---

```jsx
// Wrap a live screen; the camera tours the shots and loops.
<ScreenAnimator
  shots={[
    { zoom: 1, cx: 0.5, cy: 0.5, hold: 2400, label: "Overview" },
    { zoom: 2.4, cx: 0.2, cy: 0.34, hold: 2600, label: "Revenue up 24%" },
    { zoom: 1.8, cx: 0.5, cy: 0.6, hold: 2800, label: "Pipeline" },
  ]}
  backdrop={<ThreeScene preset="aurora" />}
>
  <Dashboard />
</ScreenAnimator>
```

### Anti-patterns

DO NOT use it as a layout wrapper — it positions `absolute inset-0` and takes
over the frame. It's for a whole screen/section you want to direct, not a div.

DO NOT hand-tune `trans`/`hold` per shot unless you need to — the defaults
(soft settle on overview, snappier push on detail) read well. `cx`/`cy` are the
knobs that matter; they're fractions of the screen (0 = left/top, 0.5 = centre).

DO NOT worry about reduced motion — it settles on the starter frame and stops
moving automatically under `prefers-reduced-motion`.
