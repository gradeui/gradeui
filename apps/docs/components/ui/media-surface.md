---
name: MediaSurface
import: ./components/ui/media-surface
props:
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "video")
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg") — driven by `--rds-media-radius` CSS var
  - className?: string
  - children: React.ReactNode
when_to_use: Low-level shell primitive that wraps a media canvas (video, Rive runtime, WebGL canvas) in an aspect-ratio surface with shared border-radius and pause-on-offscreen behaviour. Prefer VideoPlayer / RivePlayer / ThreeScene, which wrap this. Reach for MediaSurface directly only if you're building a bespoke media component and want consistent chrome.
composes_with: [VideoPlayer, RivePlayer, ThreeScene — all use this internally]
---

```jsx
<MediaSurface aspect="video" radius="lg">
  <canvas ref={canvasRef} className="w-full h-full" />
</MediaSurface>
```
