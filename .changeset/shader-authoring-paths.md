---
"@gradeui/ui": minor
---

Expand `ThreeScene` with on-demand custom fragment shaders and three new shipped presets.

**New preset scenes** (`preset="…"`):
- `plasma` — soft rolling colour clouds driven by overlapping sine waves.
- `voronoi` — jittered cellular grid with glowing, time-animated edges.
- `synthwave` — retro perspective grid receding to a banded sun disc.

All palette-driven off the same `{ primary, secondary, accent, background }` slots as `space`.

**New `fragmentShader` prop.** Users (and LLM agents) can now write GLSL directly against a fixed uniform contract — `uTime`, `uResolution`, `uMouse`, `uPrimary`, `uSecondary`, `uAccent`, `uBackground`, plus `varying vec2 vUv`. The header is auto-injected; only `void main()` needs to be authored. Runs on a fullscreen orthographic quad, auto-wires pointer tracking, and shares all post-FX presets with preset-backed scenes.

**Resilient compile errors.** A new `ShaderCompileError` class surfaces GL info logs via an `onShaderError` callback; the scene automatically falls back to `preset="space"` on compile failure, so a bad shader never leaves the surface blank.

New public exports: `FRAGMENT_HEADER` (the auto-injected prelude, for introspection), `ShaderCompileError`, `buildFragmentShaderScene`.
