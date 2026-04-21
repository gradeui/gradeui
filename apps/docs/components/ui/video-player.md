---
name: VideoPlayer
import: ./components/ui/video-player
props:
  - src: string — video URL
  - controls?: boolean (default true) — show native controls; false for chromeless hero/background video
  - autoPlay?: boolean (default false) — forces muted=true (browser restriction)
  - loop?: boolean (default false)
  - muted?: boolean (default = autoPlay)
  - pauseOffscreen?: boolean (default true) — pause when scrolled out of viewport
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "video")
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg") — driven by `--rds-media-radius`
  - objectFit?: "cover" | "contain" | "fill" (default "cover")
  - poster?: string
  - playbackRate?: number (default 1)
when_to_use: HTML5 video wrapped in the shared media surface. Controls-on for a standard player, controls-off (+ autoplay/muted/loop) for hero / background video. Prefer Rive for anything interactive, Three Scene for shader backgrounds.
composes_with: [MediaSurface (internal), Card (wrap for thumbnail grids)]
---

```jsx
<VideoPlayer src="/promo.mp4" controls />

// Chromeless hero video
<VideoPlayer src="/hero.mp4" controls={false} autoPlay loop muted aspect="wide" />
```
