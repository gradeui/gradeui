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

(The *watchable* sibling of this — a directed, non-interactive sequence of scenes — is **Grade Motion**, next section. Motion ships first; FlowCanvas inherits its scene vocabulary.)

## Grade Motion — the Motions section (scenes on a shared stage)

FlowCanvas (above) is the *prototype* answer to multi-screen — linked live frames you can take over. **Grade Motion is the *cinematic* answer**: a directed sequence of scenes you watch, like a product launch video that happens to be alive. It lands first because it's nearly all composition of things that already exist. In the project nav it's a first-class section branded **Motion Studio**: a project holds **Screens, Flows (tbd — FlowCanvas when it lands), Motion Studio, and Styles**. (Internally the section id and design `kind` stay `motions`/`motion` — branding can move; storage keys shouldn't.)

### What a Motion is

A Motion is a **sequence of scenes on one persistent stage**. The grammar to hit is the one every modern product demo uses: *text → demo → video → text, any order, any mix, with transitions*. So a scene is **not** a kind — it's a **stage moment** that holds arbitrary content, and each content type brings its own behaviour:

- **Screens** — `MotionScreen`, a framed screen *inside* a scene, each with its **own** camera (`shots` — `ScreenAnimator` applied per-screen, not per-scene). A scene can hold several: mobile + desktop of the same flow side by side, a before/after pair. This is the demotion that makes the model extensible: the camera is a property of a screen, the scene is just the moment that contains it.
- **Text** — `MotionText`, the templated text animations (**Motion Templates**: title, lower-third, section-break, growing library). A text-only scene is a title card; a `MotionText` next to a screen is a caption.
- **Video / anything else** — drop a `<video>`, an image, any JSX into the scene. Content that can't time itself rides the scene's `durationMs`.

**The completion contract (what makes it robust):** a scene advances when **all its timed children have finished** — a screen's camera tour ending, a text template's run completing — or after `durationMs` when nothing in it keeps time. Timed children register with the scene; static content doesn't. New content types plug in by registering, nothing else changes.

Each scene is its own JSX node in the blob, so it's **independently editable** — select it, regenerate it, reorder it — without touching its neighbours. Scene-level `transition` (fade/none today, more later) handles the cut; screens keep their fly-in/out choreography within it.

The stage inverts ownership relative to a standalone `ScreenAnimator`: the **Motion owns the stage** (one continuous backdrop across the whole sequence), scenes enter and exit on it. That's what makes a cut between a dashboard, a title card, and a settings screen read as one film rather than three widgets.

### Where a Motion lives — a source blob, like everything else

A Motion is **JSX source in a Design-shaped record** (`kind: "motion"`), not a parallel JSON store:

```jsx
<Motion stage="...">
  <MotionScene label="Hook">
    <MotionText template="title" heading="Meet the new pipeline" />
  </MotionScene>
  <MotionScene label="Dashboard — both viewports">
    <MotionScreen device="mobile" shots={[...]}>{/* screen, copied in */}</MotionScreen>
    <MotionScreen shots={[...]}>{/* desktop copy */}</MotionScreen>
  </MotionScene>
  <MotionScene label="Clip" durationMs={6000}>
    <video src="..." autoPlay muted />
  </MotionScene>
</Motion>
```

Why source wins (same reasoning as shots-as-props, one level up): it renders without an interpreter, it round-trips through the existing source-mutation channel, it gets revisions / shares / persistence / the agent for free, and it's **exactly the shape the AI already authors** — "make me a motion of these three screens with a title card between" is a generation target, not a new protocol. The dock reads it the way it reads shots today (extract/replace on the blob).

**Scene content is copied in, not referenced (v1).** A screen scene snapshots the screen's JSX at insert time — same semantics as duplicating a screen. That keeps a Motion a single self-contained blob the existing renderer runs as-is, and it's honest about pinning: a Motion is usually *meant* to be stable while the screen evolves. Live-by-reference scenes (edit the screen, the Motion updates) are a later phase that rides the transclusion/capture work — and that's the seam where Motion and FlowCanvas converge.

### The editor — the strip and the timeline

Two views of the same blob, matching the rest of Studio:

- **Scene strip (the canvas).** Scenes laid left-to-right, each a labelled card: screen scenes show the screen small on its stage, text scenes show the card. This is the "see it all connected" view — arrangement, not playback. Reorder = move a scene node in source. The strip is just the `<Motion>` component rendering in `view="strip"`, so the editor view is itself the live render, not a parallel preview.
- **Timeline (the dock).** The existing TimelineDock grows a **scene lane**: clips sized to each scene's real duration (computed from shots' hold+trans, or the text template's length), with the focused scene's camera shots in the lane below. Two nested timelines, as designed — flow above, shot within.

Playback is the same component in `view="play"`: one stage, scenes run in order, each handing off on end (`ScreenAnimator` grows an `onEnded`; `MotionText` templates have fixed durations).

### Motion Templates

Text scenes ship with a small curated set of pre-directed animations — start with three: **title** (fade-up headline + sub), **lower-third** (caption slides in from the edge), **section-break** (full-bleed statement, slow push). A template is just a `MotionText` variant: props in, keyframes inside the component, honours reduced motion. The library grows the way component starters do, and community templates eventually ride the same tiers as themes (STUDIO-THEMES).

### Rollout

- **M0 — Components.** `Motion` / `MotionScene` / `MotionScreen` / `MotionText` in `@gradeui/ui`; `paused` + `onEnded` on `ScreenAnimator`; the scene completion contract; strip + play views; 3 text templates.
- **M1 — Project sections.** Left nav: Screens / Flows (tbd) / **Motion Studio** / Styles (the section is branded "Motion Studio"; the section id and `kind` stay `motion`/`motions` for storage stability). Motions are Designs with `kind: "motion"`; New Motion seeds a starter sequence. Motion Studio's grid shows Motions as tiles exactly like Screens' grid — same TileGrid, filtered by kind.
- **M2 — Dock scene lane.** Extract/replace scenes on the Motion blob; clips sized to duration; click a scene to focus its shots. **Adding scenes must be one gesture:** an "Add scene" action in the dock (append to source via the mutation channel — lands first), and a dashed empty add-card at the end of the strip itself (needs a `grade:add-scene` postMessage from the iframe — the polish pass). Also kills the dead-end empty state: "no camera" becomes *actions* — wrap this screen in `ScreenAnimator`, or add it to a Motion. When branching (M5) lands, the strip's linear arrows become real connective cues — the EventSpine foci-and-noodles idiom at scene scale, drawing any-scene→any-scene links.
- **M3 — AI authoring + mood direction.** The model emits/edits a whole `<Motion>` from a brief (the DA path applied to the Motion blob). Templates make text scenes cheap to generate well. The signature interaction is **emotional motion, not tap-tap edit**: "make it moody — slow fades, ken burns" or "youthful, poppy" compiles to concrete shot grammar (trans/hold lengths, easing choice, zoom amplitude, template selection, stage fill) — the same trick as STUDIO-LEARNING's display axes, so it can also surface as **mood sliders** (pace / energy / warmth) that drive the identical mapping deterministically. The editing hierarchy is: mood (AI or sliders) → point-and-click on the strip/dock → field-level tweak as the escape hatch. That last tier is nearly free: scene props are plain JSX props, so the **TokenField inspector + the auto-generated contracts** (`MotionContract`, `MotionSceneContract`, …) make the right panel a scene object-editor with no new machinery (STUDIO-TOKENFIELD's registry seam). Storage needs nothing: a Motion IS a Design — revisions, persistence, shares, comments all apply as-is. Which restates the end-state below: a website with timestamps on every screen, just a different way to look at it.
- **M4 — Live scenes + A/V.** Reference-not-copy screen scenes (transclusion via the capture/embed kernel), voiceover/webcam tracks from D3, export via D7. Convergence with FlowCanvas: a Motion with take-over is a guided flow.
- **M5 — Branching.** Scenes are already addressable (the transport dots are random access — a Motion is *slides that play themselves*). Branching makes the jump authorable from inside a scene: a hotspot/choice routes to scene X vs scene Y, turning the linear strip into a graph — infinite combinations from one scene set. This is the moment Motion and FlowCanvas become the same object viewed from two ends (a Motion is a directed walk through a flow graph; a FlowCanvas is the graph itself), so it should land as a shared primitive, not two.
- **M6 — Stickers + the audience layer.** `MotionSticker` template library (author-side overlays, themeable JSX). Time-anchored reactions + comments on the share view's scrubber (viewer-side) — the comment substrate with `t` as the anchor.
- **M2.5 — Transition system, phase two.** Shipped: entrance vocabulary (fade/slides/pop/zoom/wipe-circle/none), per-scene `transitionMs`, and the **overlap engine** (outgoing scene held as a frozen layer under the incoming one for the transition window — slides reveal it, wipes cut through it). Next: `transitionLayer: "over" | "under"` (incoming can slide OVER the frozen outgoing, or the outgoing can animate OUT over the incoming — exit transitions), and **mask transitions with arbitrary shapes/text** (`transitionMask` carrying an SVG shape or a word — the FX-madness TextMask generalised into the transition system). Screen references: the editor's "insert screen" picks from the project's EXISTING screens (copies source + stamps `screenId` today; flips to live reference at M4). Scenes are never shared across Motions — screens are the shared unit.

  **Reference lifecycle (the M4 rules).** A reverse index — scan Motion blobs for `screenId`s — gives every screen its "used by" list. Three behaviours hang off it: (1) the **screen editor shows a banner** on a referenced screen ("Linked into *Motion 2* — edits play there live", with a jump link); not a hard lock, an informed-consent surface. (2) **Deleting the Motion** simply drops the reference — the banner disappears, the screen is untouched. (3) **Deleting a referenced screen** must never break the film: the delete prompt offers "detach into the Motion as a copy" (the reference freezes back into inline source — trivial, since v1 references ARE copies with provenance) or cancel. The invariant: **references degrade to copies, never to holes.** A Motion can always play.
- **M7 — Free transforms + the WebGL track.** Two upgrades to what a scene can *look like*. (a) **Per-child transforms**: scene children get `x / y / scale / rotate` (the centered-flex layout is just the v1 default), so screens, text, and stickers place freely and the transform values become animatable — the same fields the inspector's TokenField editing already knows how to drive. (b) **WebGL scenes**: `ThreeScene` already backdrops the stage; the new experiment is **HTML-as-texture** (Chrome's element-capture path, behind beta flags today) — render the live screen into a WebGL scene and glitch / distortion / shader transitions run over *real interactive content*, not a screenshot. Worth a spike early because it's also the most spectacular possible scene transition, and nobody else can do it on live UI.

### Why Motion exists (the product claim)

The point is **making demo videos of any product, fast** — and beating the wave of AI-generated demo videos on the three things a rendered mp4 can never do: it's **interactive** (a viewer can grab the wheel), **themeable** (same Motion, dark mode, another brand), and **editable** (tweak one scene, swap one screen, re-cut a caption — no re-render, no re-shoot). The whole live-payload argument at the top of this doc, productised.

**The economic unlock — personalised Motion at scale.** A real benchmark: a finance company once paid an animator + illustrator north of £100k for *one* animated customer statement. Because a Motion is live JSX, personalisation is just **data flowing into props** — `Hi {name}`, their figures, their plan, their theme — so the per-recipient cost is a database row and a share link, not a render farm. One Motion template + a recipient record = an animated statement, a renewal summary, an onboarding walkthrough, a year-in-review ("Wrapped") — each unique to the viewer, each still interactive and on-brand. mp4 generators must re-render per person; Grade re-binds. This is the same data channel the AI-brief path already uses ("I've attached extra data to include"), pointed at a recipient instead of a prompt. Audio slots in the same way: AI-generated music + voiceover (and later talking heads — D3's webcam track, or generated) are per-recipient assets on the timeline, synced the same as any other clip. Beat-synced music (every cut on a beat, silence as design — the thing motion.so's best work leans on) becomes a `music` track with beat markers that scene transitions snap to.

**The beat grid comes BEFORE the audio.** A `bpm` + `offsetMs` on the Motion is just a quantiser: the dock draws vertical beat/bar lines, scene durations snap to bars ("beatmatch this scene" = round duration to the nearest bar), transitions land on downbeats — music-synced editing with no music. Then the audio layer (upload mp3/wav as assets, or AI-generated tracks) aligns to the same grid and every cut already lands. The film-level overlay system (`MotionOverlay` — the broadcast layer: network bug, live wall clock, ticker, zoned graphics, scene-range visibility) is the same lesson applied to space instead of time: standard zones, second timeline.

**Prior art — Remotion.** The established "video in React" library, and the one with real overlap: `@remotion/player` plays compositions live in-browser, `inputProps` does parameterised/personalised playback. Its great idea is the **frame-pure clock** — everything is a function of `useCurrentFrame()`, so scrub is deterministic and export is frame-by-frame sampling; this is the architecture the M2 seekable-clock refactor should copy for the DIRECTION layer (camera, captions, transitions, beat grid). Its structural limit is the same idea: frame-pure content can't be a live application (no event-driven state — a working composer inside a composition fights the paradigm), there's no design-system substrate (screens get rebuilt as mockups, not transcluded), no AI/editor/share surface (hand-written TSX), and licensing is source-available/paid. The Grade Motion synthesis: **Remotion's clock discipline around live UI** — deterministic time outside the scenes, real life inside them. No entrant has that combination.

**Prior art — html-video (nexu-io, 2026) + Hyperframes (HeyGen).** The open-source convergence on the same space: agent writes a storyboard → per-frame HTML from generic templates → headless Chromium *records* it → ffmpeg → mp4. Confirms the demand AND the gap: all known entrants terminate in a file (no interactivity, no re-theme, no per-recipient binding, no live data, one baked resolution) and none have a design-system substrate — their frames are canned template slots, not the user's actual product UI. Two patterns worth adopting: (1) **template manifests** — YAML per template with an inputs JSON-schema + SPDX license provenance; our Motion template/preset registry should carry the same as it grows (especially for community templates); (2) **article/repo → video** as an input mode — "paste a URL, build the Motion brief from its real content" is a natural M3 path. When D7 (video export) lands, their entire output format becomes one export option on a live Motion.

**Prior art — motion.so (Mosaic's "Motion").** The closest existing product: prompt → rendered motion-graphics video, with a template library and an MCP/API. Three patterns worth adopting: (1) their **beat-sheet brief format** (timestamped scenes + style directives + a "non-negotiables" list) maps 1:1 onto `MotionScene`s and should be the input shape the `motion-author` skill accepts; (2) **prompt-on-tile** — Motion Studio tiles should surface the brief that generated each Motion (already in `messagesByDesign`); (3) their **category taxonomy** (Launch & Promo / Typography / Charts & Data / Logo & SVG / …) seeds the template library's shape. The structural difference stands: their output is an mp4; ours is live.

Two more content layers ride the same model for free:

- **Stickers** — the influencer grammar (badges, arrows, emphasis blobs, animated doodads). A sticker is just another scene child — a `MotionSticker` template library exactly like `MotionText`'s, and because stickers are JSX they're themeable too. Author-side overlay.
- **Reactions + comments on the timeline** — the *audience* layer. A reaction (🌈 at 0:12) is a comment whose anchor is a **time `t`** instead of a DOM element — the third anchor type after element (comment pins) and region (camera). Rides the existing share surface + comments substrate; renders as a Soundcloud-style density strip on the scrubber. This is M6, and it's what makes a shared Motion a *social* object rather than a file.

### It's also the slide creator everyone wanted

A Motion in Arrange view is a slide sorter; in Play view it's the presentation; scene dots are slide navigation; `MotionText` templates are slide layouts; a theme is the deck template. The missing piece is **speaker advance** — an `advance="click"` mode where scenes wait for the presenter instead of the clock (one prop on `Motion`, M2-sized). That makes Grade Motion a Pitch/Keynote alternative where every slide can contain a *live product screen with a directed camera* — the slide creator everyone wanted and nobody shipped.

### Composition combos (work today) + generative video (next)

Because scenes hold arbitrary JSX, the rich combinations are *composition, not features*: a **shader behind the whole film** (`<Motion backdrop={<ThreeScene preset="aurora"/>}>`); a **text scene over a shader or video** (a `<BackgroundFill type="shader"|"video">` child next to the `<MotionText>` in the same scene); a shader-filled title card cutting to a screen scene cutting to a full-bleed clip. The starter and the `motion-author` skill should showcase these combos so people discover them. The intuitiveness work is making each combo *one obvious move* in the editor (a Fill control on the scene — the existing FillPicker pointed at a scene — rather than hand-written JSX). **Generative video** then slots in as a fill type: a scene whose video child is generated on demand — and combined with personalised Motion above, sections of a demo can be *generated per recipient before sending*. Customised video on demand: the advertiser's dream, and structurally it's just one more timed child that registers with its scene.

### Presets + the authoring skill (how agents get good at this)

Two force-multipliers that should grow alongside the components, not after:

- **Transform/transition presets.** A named vocabulary — `ken-burns`, `slow-fade`, `push`, `pop`, `drift`, `glitch` (WebGL, M7) — covering scene transitions, per-child entrance animations, and camera styles. Presets are what the mood mapping compiles to, what the AI emits (a name, not twelve numbers), what the strip/dock surfaces as one-click choices, and what a human overrides field-by-field when they want to. Same pattern as `MotionText` templates: props in, keyframes inside, reduced-motion honoured. The preset registry is the seam.
- **A `motion-author` skill.** The `playground-scaffold` skill proved the pattern: capture the exact workflow (scene grammar, the completion contract, the camera-belongs-to-the-screen rule, preset + template vocabulary, the starter shapes) in a skill so any agent produces correct Motion JSX first try instead of inferring it from component source. Write it as soon as the components stabilise; it's also the substrate the M3 mood prompts stand on.

### The end state — it's a multipage app, exploded

The framing that ties Motion, FlowCanvas, and shipping together: **each scene is just JSX, and the strip is the exploded view of a multipage app.** One set of scenes, three lenses:

- walked by a **camera** on a clock → a Motion (the demo film);
- walked by **clicks** → a flow / prototype (FlowCanvas);
- walked by **routes** → a multipage app or website (the shipped thing).

The lens is presentation; the scenes are the asset. That's why scenes must stay plain JSX nodes in one source blob — anything more exotic (a bespoke scene format, a parallel store) would fork the asset per lens and kill the convergence. Build scenes once; demo them, prototype them, ship them.

The mechanism is three separable problems, two of which already have answers in this codebase:

1. **Combine multiple JSX.** Compose-time stitching: each screen blob becomes a module, the Motion/flow imports them — the exact trick the Sandpack path's `componentFiles` virtual filesystem already does for components. v1 copies content in (one self-contained blob); the stitched form is the M4 live-reference upgrade, and it's a compose-pipeline change, not a renderer change.
2. **Route them.** Scene addressability — already shipped in the transport (a dot is random access; a scene id is a route). Branching (M5) and the route lens are this same address space exposed to clicks and URLs.
3. **Animate between them.** Scene transitions today (fade + the screens' own fly-in/out); the upgrade path is shared-element moves (FLIP, or the View Transitions API the browser now gives us for free) so an element that exists in both scenes travels the cut — the same family as inter-viewport zooming (D6).

## Rollout

- **D0 — Payload schema.** Define the JSON tracks (camera is already track one). The contract everything else targets.
- **D1 — Alt-cursor + replay driver.** Synthetic cursor + camera driven by a payload; captions on shot boundaries. "A payload plays as a demo," no recording yet. Extends the camera shipped today.
- **DA — AI authoring (the primary path).** The model emits a `DemoPayload` from a natural-language brief (screens + persona + theme + viewport + "best parts"). Generate-then-refine; recording (D2) and the editor (D4) are alternate ways in, but AI-first means this lands as soon as the schema (D0) + a player (D1) exist, not as a late add-on.
- **D2 — Recorder.** Capture clicks / scroll / move via `grade:demo-event`; auto-derive camera shots from click rects (the selection-agent primitive). Now a walkthrough becomes a payload.
- **D3 — A/V layer.** Mic voiceover + webcam head-shot via `MediaRecorder`, stored as assets, synced on the timeline.
- **D4 — Authoring + 16:9.** A camera/timeline editor on a fixed 16:9 artboard (deterministic shot placement), tweak shots, re-record a step, reorder captions.
- **D5 — DOM track.** Element-targeted overlays/effects on a timeline — comment, dim, highlight, callout — reusing the comment-pin anchoring (`data-gds-source-id`). The second timeline.
- **D6 — Element-targeted camera + inter-viewport.** Shots that frame an element id (camera resolves its live rect), and zooming *between viewport widths* while tracking the same node. The capability nothing else has.
- **D7 — Video export.** All roads lead to the file: interactivity is the differentiator, but video is the universal share.
  - **v1 (in-browser) — RETIRED.** Chrome tab-capture + canvas crop + `MediaRecorder`. Two fatal flaws in practice: Region Capture wouldn't crop an iframe inside the canvas's zoom transform (black / single-frame output), and even with manual-frame canvas capture, Chrome's `MediaRecorder` returned **zero bytes** despite thousands of valid frames — captured 6734 frames, encoder gave nothing. Real-time capture is also fundamentally un-smooth: a heavy shader frame drops a video frame. Not shippable; removed.
  - **v2 (the pipeline) — BUILT, the real path.** Deterministic frame-stepping, not recording. The Motion component exposes a render kernel at `window.__gradeMotion` (`meta()` → totalMs/durations; `enterRenderMode()` freezes the clock + shows watermark; `renderFrame(ms)` seeks to an exact time, lands the WAAPI puppet, and resolves once the frame is committed via double-rAF). `scripts/render-motion.mjs` drives it headless: launches Chromium (SwiftShader GL), loads the existing `/fast-sandbox` render surface (exact Studio parity), compiles the film source, then for each frame `renderFrame(ms)` → element screenshot of `[data-gds-part="motion"]` → ffmpeg (`libx264`, crf 17, yuv420p, faststart). Output is locked to a perfect fps regardless of scene weight. **Resolution tiers:** `pnpm motion:preview` (0.5× / 960×540 — the fast "does it read?" pass), `pnpm motion:1x` (1920×1080), `pnpm motion:2x` (3840×2160 @ 60fps). All localhost = **zero cost, zero network**. One-time: `pnpm --filter @gradeui/docs exec playwright install chromium`.
  - **v3 (hosted, on gradeui.com) — FUTURE, not immediate.** The same kernel + script behind a job queue: an API route enqueues a render, a worker (headless Chromium + ffmpeg on the server, or a serverless browser) produces the file and drops it in Storage with a signed URL. This is what turns "render my film" into a button on gradeui.com (and the personalised-Motion render farm — N brands × one payload). The browser does nothing but poll; the deterministic stepping is identical to v2, just relocated. Gated behind pro entitlement.
  - **Provenance:** every export carries its origin. The filename stamps it today (`grade-motion_<designId>_<timestamp>`); the pipeline adds mp4 metadata atoms (share URL, revision id) and an **imperceptible in-frame pattern** — a few low-amplitude pixels per corner encoding the share id, surviving re-encodes well enough to map any circulating video back to its live, editable Motion. The loop this closes is the product thesis: *the video IS a link* — anyone holding the file can be routed to the living artifact and edit it with AI.
- **D8 — FlowCanvas.** The multi-screen layer above `ScreenAnimator`: isolated-but-linked screens on a canvas, a screen-level timeline, link transitions, take-over + scrub. The convergence with multi-screen share/embed.

## See also

- [`STUDIO-EMBED.md`](./STUDIO-EMBED.md) — the live embed this rides on; demos ship through `/e/<token>`.
- [`STUDIO-CAPTURE.md`](./STUDIO-CAPTURE.md) — the capture primitive (one DOM/source grab, three consumers); a video export is a fourth.
- [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) — where voiceover + webcam clips live (assets, signed delivery in shares).
- [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) / [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) — "from prompt to screen"; this is "from screen to demo," the stage after.
- `apps/docs/components/studio/embed-screen.tsx` — `useCameraTimeline` + `ZoomPan` (camera = payload track one).
- `apps/docs/app/fast-sandbox/page.tsx` — the selection agent (click → element rect) + the `grade:*` bus the recorder extends.
