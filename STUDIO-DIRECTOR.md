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

## AI-first: the demo is generated, not just edited

The director is **AI-first**. The payload is declarative JSON, so the model emits a whole demo the way it emits JSX today, and the editor (D4) is for *refining* the AI's cut, not building from a blank timeline. The captions `ScreenAnimator` already renders are exactly the model's narration surface: it writes the sentiment ("Revenue is up 24%"), the camera just carries it.

The brief is natural language over the things Grade already understands:

> Do me a demo of #Homepage, #Dashboard and #Settings, through the eyes of @persona, in dark mode (it's night). I've attached extra data to include. Show the best parts of each screen, scroll up and down. Mobile viewport.

What the model turns that into, and why it can:

- **`#Homepage #Dashboard #Settings`** → the flow: three screens, ordered, with link transitions. The model already references screens.
- **`@persona`** → the point of view: the caption voice, what counts as "interesting," even the pace. A founder demo and an end-user demo of the same screens narrate differently.
- **dark mode / mobile viewport** → theme + render width, both already first-class (`mode`, fixed-width). "It's night" is the model *inferring* the setting.
- **attached data** → content woven into the screens before the tour (the existing fill/media + prompt path).
- **"show the best parts" / "scroll up and down"** → the model *reads the screen* (it knows the components and their `data-gds-source-id`s) and picks salient elements to frame, emitting camera shots + scrolls to bring off-screen content into view. "Best parts" is a saliency call the model is well placed to make over a structure it generated.

So the output of that one sentence is a full `DemoPayload`: flow order, per-screen camera shots, captions in the persona's voice, theme + viewport, the DOM/annotation beats. Generate-then-refine, exactly like the rest of Studio: prompt → a directed demo → nudge a shot or a caption. This is "prompt to demo in minutes" made concrete, and it's *why the payload schema (D0) is the load-bearing piece*: a clean JSON the model can author makes the whole thing a generation target.

("Scroll up and down" is its own operation, scrolling the live screen to reveal content, distinct from the camera transform. The camera frames a region; a scroll brings off-screen content into the frame first. Both ride the timeline.)

## Where the timeline lives — props on the component, ringfenced

The screen is stored as a source blob, so the timeline lives where it composes best: **as props on the component itself**, `<ScreenAnimator shots={[...]}>` right in the source. No parallel store. The dock reads the shots out of the blob (`extractCameraShots`) and writes edits back in (`replaceShotsInSource`), round-tripping through the same source-mutation channel the inspector already uses.

Why props-in-source beats a separate timeline blob:

- **It travels with the screen.** Copy the screen, remix it, save it as a starter, the direction comes with it, because it *is* part of the thing. A side-car store has to be kept in sync and drifts (ids, focal points).
- **It just renders.** The props aren't a description of an animation; they *are* the animation. Nothing has to interpret a separate payload.
- **It round-trips losslessly** through the channel that already exists.

The cost is that the camera shares the blob with agent edits, so a regeneration could clobber the shots. Two protections, and they're the two halves the ringfence needs:

- **Wrapper preservation (live HEAD).** The camera *wraps* the screen (`<ScreenAnimator shots>` around the content), so an agent regenerates the **child** and the compose pipeline preserves the outer wrapper + its props. The direction is structurally separable from the content it directs: the agent edits the content, the camera survives. (Focal *fractions* can still drift if the layout moves, which is the argument for **element-targeted** shots that track a `data-gds-source-id` instead of a coordinate.)
- **Revision pinning (shipped demo).** A published demo binds to a `revisionId`, a historic save, a frozen blob, so the live screen keeps evolving while the demo stays exactly as shot. Same pin already on the payload (`screen.revisionId`) and the embed/share.

So: **bound to the component as props** for composition and round-trip, **wrapper-preserved** so agents don't clobber HEAD, **revision-pinned** when it has to be permanent. Live-editable and freezable, the same duality as the rest of the director.

## The whole thing is foci and noodles

Stripped all the way down, a demo is **a set of foci connected by transitions**: "here's a thing to focus on, take me from here to there." The animation lives *entirely in the connections* , the noodles between events. Nothing else is stored.

- A **node** is a focus: *which* thing (an element by `data-gds-source-id`, or a beat/event) plus its context , zoom, viewport, theme, the screen's state at that point. You don't author nodes from scratch; you *pick* foci that already exist in the live DOM.
- An **edge** (noodle) is the only authored thing: how to travel from one focus to the next , zoom out then in, pan back, the ease, the duration. "Here to there, like this."

Two things fall out of that:

- **It's fractal.** Foci joined by noodles *within* a screen (element → element) is the camera; foci joined by noodles *across* screens is FlowCanvas. Same model, two scales , a node is an element or a whole screen.
- **It's exactly what the AI authors.** The nodes are already in the DOM, so generation is just choosing foci and drawing edges. "Focus the revenue card, then the feed, pull out between" is two nodes and a noodle. A human scrub is walking those edges by hand , the intervention hatch.

A timeline and a node-graph are then the *same data* shown two ways: the timeline is the linear walk, the noodle view is the connections. Pick the view; the foci-and-edges underneath don't change.

## Anchor the camera to events, not seconds

"Event-synced vs time-based" was a false split — the reveals elapse in seconds too, so *everything* is on a clock. The real question is what a camera keyframe is *anchored to*. Anchor it to an **event**, not an absolute time:

> at `pressB`: zoom 0.9, arrive by panning out over 600ms

The event (the reveal) owns the *when*; the keyframe owns the *where* and the *how you get there* (zoom out, pan back, ease). The camera then has no independent clock — it's pinned to the same scripted timeline as the reveals. That's **one clock**, so it can't drift no matter how the reveal cadence changes; re-time a reveal and the camera follows for free. (The drift between two independent clocks is exactly why the camera got hand-rolled inline on the confetti screen the first time — event-anchoring removes the reason.)

It's also the more promptable shape: "zoom into the button when it appears" maps straight to `{ at: "btnA", zoom: 1.12 }`, no seconds to compute. And because it's one elapsed timeline, **scrubbing falls out** — a playhead at time *t* has a single deterministic state (which reveals have fired, where the camera is), so seek is a pure function of *t*, and the timeline width auto-fits the total duration.

So the model is: the **timeline is the event script**; the **camera is one track of keyframes anchored to events**, each saying "by this beat, be here, arriving like this"; and **each animated DOM item is its own track** of show/hide/move on the same clock. The absolute-time `shots={[...]}` the camera-tour and the confetti dogfood use today are the degenerate case where the "events" are just ticks — fine for a standalone camera, but the event-anchored form is what unifies camera + reveals under one clock, and it's what makes a human scrub (the intervention escape hatch under an otherwise-prompted flow) actually work.

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

## FlowCanvas — the multi-screen layer (above ScreenAnimator)

`ScreenAnimator` stays single-screen; that's the per-frame primitive. Animating *between* screens is a layer above it: **FlowCanvas**, a canvas that holds several screens and a camera that tours them. Build single-screen first; this is the next architectural layer, not a `ScreenAnimator` change.

The shape that keeps it simple: each screen stays **isolated** (its own render, its own iframe), never merged into one monolithic app. But the screens are **linked** the way a Figma prototype links frames, hotspots that move you from screen A to screen B. So FlowCanvas is a familiar object: a prototype graph (screens + links) where every frame is *live, animated, and annotated* instead of a static mock. Close to a real product without the complexity of building everything into one app.

That gives three ways to consume one flow, and the last two are the live-canvas dividend a video can't touch:

- **Auto-play (timed clickthrough).** The flow walks itself: the camera tours screen A, a link "clicks," it transitions to screen B, tours it, and on. A timed, narrated, step-by-step product walkthrough.
- **Take over.** Because every frame is live, the viewer can grab the wheel at any point and click the real links themselves, then let it resume. You can't take over a video; you can take over this.
- **Scrub.** A timeline you can jump along, ahead to the screen you care about, back to re-watch a step.

FlowCanvas has its own timeline, a **screen-level** track: you drop screens onto it and arrange the order + transitions, while each screen's *own* `ScreenAnimator` timeline directs the camera *within* it. Two nested timelines: the flow (screens) and the shot (camera). Plus the DOM/annotation track for comments, dim, highlight, and measurements.

Screen transitions are navigations between isolated embeds (the link model), so there's no shared app state to wrangle, each screen is self-contained, exactly like a prototype frame. Memory follows `STUDIO-CAPTURE`: only the screens near the camera are live, the rest are posters, promoted on approach.

This is the convergence point: a multi-screen **share** is a FlowCanvas; a multi-screen **embed** is a FlowCanvas, chrome-free. Share, embed, and director all become "frames on a canvas + the shared kernel + a camera + overlays."

## Rollout

- **D0 — Payload schema.** Define the JSON tracks (camera is already track one). The contract everything else targets.
- **D1 — Alt-cursor + replay driver.** Synthetic cursor + camera driven by a payload; captions on shot boundaries. "A payload plays as a demo," no recording yet. Extends the camera shipped today.
- **DA — AI authoring (the primary path).** The model emits a `DemoPayload` from a natural-language brief (screens + persona + theme + viewport + "best parts"). Generate-then-refine; recording (D2) and the editor (D4) are alternate ways in, but AI-first means this lands as soon as the schema (D0) + a player (D1) exist, not as a late add-on.
- **D2 — Recorder.** Capture clicks / scroll / move via `grade:demo-event`; auto-derive camera shots from click rects (the selection-agent primitive). Now a walkthrough becomes a payload.
- **D3 — A/V layer.** Mic voiceover + webcam head-shot via `MediaRecorder`, stored as assets, synced on the timeline.
- **D4 — Authoring + 16:9.** A camera/timeline editor on a fixed 16:9 artboard (deterministic shot placement), tweak shots, re-record a step, reorder captions.
- **D5 — DOM track.** Element-targeted overlays/effects on a timeline — comment, dim, highlight, callout — reusing the comment-pin anchoring (`data-gds-source-id`). The second timeline.
- **D6 — Element-targeted camera + inter-viewport.** Shots that frame an element id (camera resolves its live rect), and zooming *between viewport widths* while tracking the same node. The capability nothing else has.
- **D7 — Video export.** Playwright + capture for an mp4 from the same payload.
- **D8 — FlowCanvas.** The multi-screen layer above `ScreenAnimator`: isolated-but-linked screens on a canvas, a screen-level timeline, link transitions, take-over + scrub. The convergence with multi-screen share/embed.

## See also

- [`STUDIO-EMBED.md`](./STUDIO-EMBED.md) — the live embed this rides on; demos ship through `/e/<token>`.
- [`STUDIO-CAPTURE.md`](./STUDIO-CAPTURE.md) — the capture primitive (one DOM/source grab, three consumers); a video export is a fourth.
- [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) — where voiceover + webcam clips live (assets, signed delivery in shares).
- [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) / [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) — "from prompt to screen"; this is "from screen to demo," the stage after.
- `apps/docs/components/studio/embed-screen.tsx` — `useCameraTimeline` + `ZoomPan` (camera = payload track one).
- `apps/docs/app/fast-sandbox/page.tsx` — the selection agent (click → element rect) + the `grade:*` bus the recorder extends.
