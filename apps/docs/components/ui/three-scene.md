---
name: ThreeScene
import: ./components/ui/three-scene
props:
  - preset?: string — shader preset id from the registry (e.g. "space")
  - postPreset?: string (default from preset, or "vhs") — "none" | "vhs" | "cinematic" | "synthwave" | "crt"
  - palette?: Partial<{ primary; secondary; accent; background }> — unset slots fall back to defaults
  - createScene?: (ctx) => SceneHandle — custom scene factory; takes precedence over preset
  - controls?: boolean (default false) — play/pause overlay
  - autoPlay?: boolean (default true) — respects reduced-motion
  - pauseOffscreen?: boolean (default true) — big win for WebGL battery life
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "video")
  - maxDpr?: number (default min(devicePixelRatio, 2)) — lower for thumbnails / low-end devices
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg")
when_to_use: WebGL primitive for shader backgrounds, generative visuals, and custom three.js scenes. Preset-driven (via the shader registry) or bring-your-own-scene. Pattern for hero backgrounds, decorative page chrome, and visualiser widgets. For looping video, use VideoPlayer; for interactive animations, use RivePlayer.
composes_with: [MediaSurface (internal), foreground content stacked above with `position: absolute/relative z-10`]
notes: Depends on `three` and `postprocessing` (bundled into @gradeui/ui). Safari caps concurrent WebGL contexts at ~8 — for preset galleries, prefer ShaderPresetPreview with `live="hover"`.
---

```jsx
// Preset + post-FX
<ThreeScene preset="space" postPreset="vhs" aspect="wide" />

// Hero background — shader behind, content on top
<div className="relative overflow-hidden">
  <ThreeScene preset="space" className="absolute inset-0 w-full h-full" />
  <div className="relative z-10 py-16 px-6 text-center text-white">
    <h1 className="text-5xl font-bold">Build at the speed of thought</h1>
  </div>
</div>
```
