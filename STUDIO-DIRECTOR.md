# STUDIO-DIRECTOR.md — record a demo on a live canvas, replay it as a directed sequence

The plan for turning a Grade screen into a **live product demo**: you walk through a real running screen (pan, click, scroll, talk), and that's captured into a **declarative JSON payload** that replays instantly as a polished, directed demo, with auto-zoom, an animated cursor, captions, voiceover, and a webcam head-shot. Prompt to demo in minutes.

> Status: design doc. Drafted 2026-06-02. Sibling to [`STUDIO-EMBED.md`](./STUDIO-EMBED.md) (the live embed it rides on), [`STUDIO-CAPTURE.md`](./STUDIO-CAPTURE.md) (the capture primitive), and [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) (where the a/v lands).

## The dream

Screen Studio and Descript auto-zoom and pan around a screen recording. The catch: they operate on a **video file**, dead pixels. Grade can do the same direction on a **live, interactive, transcluded canvas**, which changes everything downstream. So the loop is:

1. **Record** — perform on the live screen: move the cursor, click where it matters, scroll, do the action. Optionally talk (mic) and show your face (webcam).
2. **Payload** — the session becomes a JSON timeline (no video). Clicks auto-derive camera moves; the cursor path, scrolls, captions, and a/v offsets all sit on the same timeline.
3. **Replay** — the payload plays over the live canvas: the camera zooms/pans, a synthetic cursor moves, the screen actually reacts, captions and voiceover fire on cue, the head-shot floats in a corner.

## Why a live payload beats a video file (the whole point)

Because the output is **JSON over a live render, not an mp4**, the demo:

- **re-renders fresh every play** — crisp at any size, no compression, no fixed resolution;
- **stays interactive** — a viewer can grab the wheel mid-demo;
- **is an embed** — it ships through the same `/e/<token>` surface, tiny, themeable, droppable anywhere;
- **is editable after the fact** — tweak a single camera shot, re-record one step, swap the underlying screen, change the theme, without re-shooting;
- **chooses freshness or permanence** — because it's transclusion, an embed is live-by-reference by default: edit the original screen and the demo updates on next load. Or pin the share to a specific `revisionId` and it's frozen at that version, a product demo tied to an exact moment in time, no studio, no re-shoot. (Pinning matters for camera tours: the focal points are tuned to where things are, so a later layout change could otherwise drift the camera off-target.)
- **re-themes / re-localises** — same demo, dark mode, or a different brand.

And when a platform demands a real video, you render the *same payload* to an mp4 (Playwright/ffmpeg drives the replay and captures it). **Live-first, video on demand, one source of truth.** That's the differentiator: everyone else's demo is frozen the moment it's recorded; this one stays alive.

## The payload — the load-bearing abstraction

A demo is a JSON timeline with a few parallel tracks. Record and replay are independent producers/consumers of it; the **camera shot list shipped today is track one**.

```ts
interface DemoPayload {
  screen: { shareId: string; revisionId?: string }; // what it's a demo OF
  durationMs: number;
  tracks: {
    camera: CameraShot[];          // SPATIAL — zoom + focal point over time (built)
    annotation: AnnotationEvent[]; // ELEMENT-TARGETED — comment / dim / highlight / callout, anchored to a DOM node
    cursor: CursorEvent[];         // synthetic-cursor path + clicks ("alt cursor")
    interaction: InteractionEvent[]; // the real clicks/scrolls/typing that drive the screen
    caption: CaptionEvent[];       // narrative text on shot boundaries
    audio?: AudioTrack;            // voiceover clip + offset (an asset)
    video?: VideoTrack;            // webcam head-shot clip + corner + offset (an asset)
  };
}
```

Each event is `{ t, … }` in ms. Get this schema right and every other piece is an editor or a player for it.

## It's mostly already built

The hard substrate exists; the new work is narrow.

- **Live canvas** — the transcluded embed / `FastIframeHost`. *Done.*
- **Camera** — auto-zoom/pan, tweened, reduced-motion-aware, play/pause. *Done* (`apps/docs/components/studio/embed-screen.tsx`, `useCameraTimeline`). It's track one of the payload.
- **Auto-direction from clicks** — the selection agent inside the sandbox already knows *which element* was clicked and its bounding rect (`data-gds-source-id`). So a recorded click already carries the rect needed to derive a camera shot that frames it. **Auto-zoom-on-click is a primitive we already have**, not new intelligence.
- **Event streaming** — the `grade:*` postMessage bus already pipes events out of the iframe. The recorder is one more message type (`grade:demo-event`) plus a timestamp.
- **A/V as assets** — voiceover + webcam are `getUserMedia` + `MediaRecorder`, stored through the assets pillar (STUDIO-STORAGE) and referenced by offset on the timeline.

**Genuinely new:** the recorder (capture + timestamp), the synthetic alt-cursor layer, the replay driver, and the a/v capture + compositing. None of it is research.

## The alt-cursor

A rendered cursor layer over the embed that follows the `cursor` track, eased, with a click ripple + an optional "press" scale. Synthetic (not the OS cursor) so it reads clean at any zoom and can be styled. On replay it leads the camera: cursor arrives, then the camera settles, then the click fires, the grammar of a good product demo.

## Webcam + voiceover — honest difficulty

The **capture is genuinely easy**: `getUserMedia({ video, audio })` + `MediaRecorder` gives you webm clips in a few lines, and the assets bucket already takes bytes. What actually takes the work is the unglamorous middle:

- **Sync** — keeping the a/v clock aligned to the payload timeline (record the wall-clock offset at start; on replay, seek the `<video>`/`<audio>` to `now − offset`). Drift is the enemy; a single shared clock fixes it.
- **Permissions + storage + encoding** — camera/mic consent prompts, file size, and (for the mp4 export path) an encode step.
- **Compositing on replay** — floating the head-shot in a corner, ducking it, captions over the canvas.

So: capture is a footnote, sync + storage + compositing is the real (but bounded) work. Don't let "webcam is easy" hide that the timeline alignment is where the polish lives.

## Live replay vs video export

Both come from the one payload:

- **Live replay** (default) — the payload plays over the embed in the browser. Tiny, interactive, editable, embeddable. This is the magic.
- **Video export** — Playwright opens the replay, plays it deterministically, and captures to mp4 (camera, cursor, a/v composited). For YouTube/LinkedIn/anywhere that wants a file.

## Two timelines: the camera (spatial) and the DOM (element-targeted)

There are really two kinds of track, and conflating them is a trap:

- **Camera track — spatial.** Zoom + focal point over the canvas (what `ScreenAnimator` drives today). It thinks in *regions* and fractions of the screen.
- **DOM track — element-targeted.** Overlays and effects anchored to a *specific element*, not a coordinate: a **comment** pinned to a button, **dim** everything except a card, **highlight** a component, a callout arrow. These follow the element as it moves or reflows; they don't care about screen coordinates.

Comments land here almost for free, because the anchoring already exists. Studio comment pins anchor to `data-gds-source-id` / `data-gds-instance-id` and ride the live DOM (and the camera transform) natively. A DOM track is the same primitive on a timeline: at *t*, dim the element with this id; at *t*, highlight that one; at *t*, surface this comment. Dim/highlight are CSS treatments on the targeted element; the rect comes from the same source-id lookup the selection agent and comment pins already use.

The key difference from the camera track: camera events carry *coordinates*; annotation events carry *element references*. Which leads to the headline.

## Element-targeted camera → inter-viewport zooming (the thing that can't be a video)

If a camera shot can target an **element** (by `data-gds-source-id`) instead of a fraction, the camera resolves that element's live `getBoundingClientRect()` and frames it. The selection agent already exposes exactly this. Now the focal point *tracks the element*, even as the screen reflows.

That unlocks something a screen-recording fundamentally cannot do: **inter-viewport zooming.** Because the canvas is live and responsive, the same screen renders at mobile width *and* desktop width. So a shot can say "frame element X at 390px," the next "frame element X at 1440px," and the camera animates **between viewport sizes** while keeping the same element in focus, the mobile layout magically expanding into the desktop layout with the eye locked on the one element (a video, a card) that exists in both. Pan out to the whole desktop, zoom into a detail, scroll, then collapse back to mobile, all tracking the same DOM node.

No video can do this: a recording is one viewport, frozen. This needs a *live responsive canvas* + an *element-tracking camera*, both of which exist here. Today it's the kind of thing that takes a human editor days in After Effects; here it's two shots in a payload.

Mechanically it needs: (1) a shot carrying a target element id + a target viewport width; (2) the renderer re-laying-out at that width (the embed already does fixed-width + responsive reflow); (3) the camera tweening the transform from the element's rect-at-width-A to its rect-at-width-B. The reflow animates if the layout uses transitions; the camera glides over the top.

## Rollout

- **D0 — Payload schema.** Define the JSON tracks (camera is already track one). The contract everything else targets.
- **D1 — Alt-cursor + replay driver.** Synthetic cursor + camera driven by a payload; captions on shot boundaries. "A payload plays as a demo," no recording yet. Extends the camera shipped today.
- **D2 — Recorder.** Capture clicks / scroll / move via `grade:demo-event`; auto-derive camera shots from click rects (the selection-agent primitive). Now a walkthrough becomes a payload.
- **D3 — A/V layer.** Mic voiceover + webcam head-shot via `MediaRecorder`, stored as assets, synced on the timeline.
- **D4 — Authoring + 16:9.** A camera/timeline editor on a fixed 16:9 artboard (deterministic shot placement), tweak shots, re-record a step, reorder captions.
- **D5 — DOM track.** Element-targeted overlays/effects on a timeline — comment, dim, highlight, callout — reusing the comment-pin anchoring (`data-gds-source-id`). The second timeline.
- **D6 — Element-targeted camera + inter-viewport.** Shots that frame an element id (camera resolves its live rect), and zooming *between viewport widths* while tracking the same node. The capability nothing else has.
- **D7 — Video export.** Playwright + capture for an mp4 from the same payload.

## See also

- [`STUDIO-EMBED.md`](./STUDIO-EMBED.md) — the live embed this rides on; demos ship through `/e/<token>`.
- [`STUDIO-CAPTURE.md`](./STUDIO-CAPTURE.md) — the capture primitive (one DOM/source grab, three consumers); a video export is a fourth.
- [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) — where voiceover + webcam clips live (assets, signed delivery in shares).
- [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) / [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) — "from prompt to screen"; this is "from screen to demo," the stage after.
- `apps/docs/components/studio/embed-screen.tsx` — `useCameraTimeline` + `ZoomPan` (camera = payload track one).
- `apps/docs/app/fast-sandbox/page.tsx` — the selection agent (click → element rect) + the `grade:*` bus the recorder extends.
