---
"@gradeui/ui": minor
---

Add `ScreenAnimator` — wrap any screen in a directed camera.

Give it a list of `shots` (a zoom + focal point + dwell + caption) and it tours them over the live, still-interactive content: flies in from offscreen, eases between shots, dims the edges with a focus spotlight, pulses a synthetic cursor, captions each beat, settles back to the start, exits, and loops, with a play / pause / restart transport.

- `shots`, `autoplay`, `loop`, `controls`, `spotlight`, `cursor`, `enter`.
- `stage` (CSS background) and `backdrop` (a live layer behind the screen — image, gradient, or a `<ThreeScene>` shader).
- Honours reduced motion (settles on the starter frame, no movement).

It's the reusable form of the embed's camera and the `camera-tour` showcase, the live, editable, re-renderable answer to a screen-recording. See `STUDIO-DIRECTOR.md`.
