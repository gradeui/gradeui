---
"@gradeui/ui": minor
---

Pause autoplay when nobody's watching — a demo is a movie, it stops when you look away.

- New `usePageActive()` hook (lib/motion): `true` only when the tab is visible AND (for a top-level document) the window is focused. Inside an iframe it falls back to visibility, which correctly tracks the top tab.
- `useScriptedDemo` (so `DemoStage`, `Composer`, `Code`) and `ScreenAnimator` now pause their loops when the page is hidden/unfocused, or when the element is scrolled out of view. A paused run is fully torn down (timers cleared) and replays/resumes when the page is active again. This kills the runaway `setTimeout`/`rAF` storm that piled up when many looping demos sat on one page or in a background tab.
- New `maxLoops` option/prop on both: cap the loop cycles, then settle and stop instead of spinning forever. Default `Infinity` (unchanged); grid/embed surfaces set a small number.
- `ScreenAnimator` now shows a centred **replay** button when the tour ends (the way a finished video does), and its play control restarts from the top once finished. The corner transport stays play / pause / restart.

Note: an offscreen iframe can't see its parent's scroll, so the in-view half only applies to non-iframed players; pausing an offscreen *grid* iframe (and freeing its memory) is the parent's job via the poster/promote policy in STUDIO-CAPTURE.md.
