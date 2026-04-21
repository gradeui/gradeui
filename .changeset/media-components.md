---
"@gradeui/ui": minor
---

Add Media section: `MediaSurface`, `VideoPlayer`, `RivePlayer`, `ThreeScene`,
`ShaderPresetPreview`, `ShaderPresetPicker`. All share a common
aspect-ratio surface with `--rds-media-radius` and pause-on-offscreen
behaviour.

- `VideoPlayer` — native `<video>` wrapped in the shared surface; controls
  on by default, or chromeless viewer mode for hero/background loops.
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
