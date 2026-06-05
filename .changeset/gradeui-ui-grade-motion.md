---
"@gradeui/ui": minor
---

Add Grade Motion — `Motion` / `MotionScene` / `MotionScreen` / `MotionText`, a directed sequence of scenes on one persistent stage.

The grammar of a modern product demo: text → demo → video → text, any order, any mix. A `<Motion>` owns the stage and plays its `<MotionScene>`s in order; a scene is a stage *moment* holding arbitrary JSX:

- `MotionScreen` — a framed screen (desktop / mobile device presets) with its **own** camera (`shots` — ScreenAnimator per-screen, not per-scene). Several can share a scene: mobile + desktop side by side.
- `MotionText` — the Motion Templates: `title`, `lower-third`, `section-break` (pre-directed text animations).
- Anything else — a `<video>`, an image, plain JSX. Untimed content rides the scene's `durationMs`.

The completion contract: a scene advances when all its *timed* children finish (camera tours, text templates), or after `durationMs` when nothing keeps time. Timed children register with the scene via context; new content types plug in by registering.

Also:

- `view="strip"` — the arrangement view (scenes left-to-right as labelled cards) vs `view="play"` (the film). Reduced motion falls back to the strip.
- `aspect` — fixed artboard ("16/9", "9/16" for TikTok/Reels, "1/1"), letterboxed into the container; "auto" fills responsively.
- Transport with scene dots (random access — a Motion is slides that play themselves), loop cap, centred replay on end.
- `ScreenAnimator` grows `paused` (controlled pause for sequencers) and `onEnded` (fires once when a tour runs to its end).

See `STUDIO-DIRECTOR.md` ("Grade Motion") for the design doc and rollout.
