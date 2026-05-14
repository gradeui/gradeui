---
name: VideoPlayer
import: "@gradeui/ui"
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
  - poster?: string — image shown before playback. Always rendered as a `loading="lazy"` `<img>` overlay (not the native `poster` attribute, which fetches eagerly).
  - playbackRate?: number (default 1)
when_to_use: HTML5 video wrapped in the shared media surface. Controls-on for a standard player, controls-off (+ autoplay/muted/loop) for hero / background video. Prefer Rive for anything interactive, Three Scene for shader backgrounds.
composes_with: [MediaSurface (internal), Card (wrap for thumbnail grids)]
aliases: [video, mp4, movie, webm, clip]
notes: Poster images are always lazy-loaded. We don't use the native `<video poster>` attribute because browsers fetch it eagerly even when the surface is off-screen, which wastes the offscreen-pause savings. Instead we render `<img loading="lazy" decoding="async">` layered over the video, then fade it out on `onPlaying`. When no `src` is given nothing renders — always pass a URL.
---

```jsx
<VideoPlayer src="/sample.mp4" poster="/movie-poster.jpg" controls />

// Chromeless hero video
<VideoPlayer src="/sample.mp4" controls={false} autoPlay loop muted aspect="wide" />
```
