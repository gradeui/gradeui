---
name: Motion
import: "@gradeui/ui"
subcomponents: [MotionScene, MotionScreen, MotionText]
props:
  - view?: "play" | "strip" (default "play") — play runs the film; strip lays
      scenes out left-to-right as labelled cards (the arrangement view).
  - aspect?: "auto" | "16/9" | "9/16" | "1/1" (default "auto") — fixed artboard
      aspect, letterboxed into the container. "9/16" is the TikTok / Reels /
      Shorts format; "auto" fills responsively. Strip cards adopt the ratio.
  - stage?: string — CSS background of the persistent stage behind every scene.
  - backdrop?: React.ReactNode — live layer behind all scenes (image, gradient, <ThreeScene>).
  - autoplay?: boolean (default true)
  - loop?: boolean (default false — a motion is a movie, it ends)
  - controls?: boolean (default true) — play/pause, restart, scene dots (random access)
  - children: <MotionScene> elements, in order.
  - "MotionScene: label?, durationMs? (MINIMUM runtime; the whole clock when
      nothing inside keeps time, default 4000), fill? (scene background over
      the stage — e.g. a white title card), transition? ('fade' | 'slide-up' |
      'slide-down' | 'slide-left' | 'slide-right' | 'pop' | 'zoom' |
      'wipe-circle' (a circular mask wipe) | 'none' — how the scene ARRIVES.
      The OUTGOING scene stays visible as a frozen layer UNDERNEATH for the
      transition window, so slides reveal it and wipes cut through it),
      transitionMs? (timing override; each transition has a sensible
      default), children (ANY JSX)."
  - "MotionScreen: device? ('desktop' | 'mobile'), shots? (its OWN ScreenAnimator
      camera), virtualWidth?, spotlight?, cursor?, enter? (default FALSE —
      the offscreen fly-in reads badly inside a small frame; use scene
      transition / animate for entrances), animate? ('rise' |
      'tilt-settle' — entrances; 'float' | 'drift' — ambient loops; 'none'
      default — animates the FRAME in place within the scene, composable with
      the camera inside; pair entrances with enter={false}), screenId?
      (provenance, ignored at render), children (the screen content, copied in)."
  - "MotionText: template? ('title' | 'lower-third' | 'section-break' |
      'broadcast' — the TV-style full-width brand-blue band that sits over
      the screen | 'ticker' — a news-style marquee bar pinned to the very
      bottom: heading is the uppercase label chip, text scrolls in an
      infinite loop | 'stat' — an oversized statistic slate: heading is the
      number slamming in at up to 180px, text is the label fading up below |
      'quote' — an editorial pull-quote with a decorative oversized opening
      mark: heading is the quote, text the em-dash attribution), heading,
      text?, durationMs?, tone? ('light' | 'dark'). 'ticker' pairs well
      inside MotionOverlay zone='bottom' for a film-level ticker that runs
      across every scene."
  - "MotionOverlay: the BROADCAST layer — a peer of MotionScene inside
      <Motion> that renders above every scene for the film's runtime:
      network-bug logo, live wall clock (which keeps ticking when playback
      pauses — better-than-video proof it's live), ticker, persistent
      video. zone? ('top-left' | 'top' | 'top-right' | 'center' |
      'bottom-left' | 'bottom' | 'bottom-right' | 'lower-third'),
      fromScene?/toScene? (scene-range visibility — overlays are a second
      timeline; defaults = always on), interactive? (re-enable pointer
      events), children (any JSX)."
when_to_use: A directed sequence of scenes on one persistent stage — the
  text → demo → video → text grammar of a modern product demo. A scene is a
  stage MOMENT holding arbitrary JSX; screens go inside scenes via
  <MotionScreen> (each with its own camera — two side by side shows
  mobile + desktop), templated text via <MotionText>, video/images as plain
  children. A scene advances when all its timed children finish (camera tours,
  text templates), or after durationMs when nothing keeps time. Use
  <ScreenAnimator> alone for a single directed screen; use <Motion> the moment
  there's a sequence.
composes_with: [ScreenAnimator, ThreeScene, VideoPlayer, AppShell, the whole component set (scenes hold screens)]
aliases: [motion, grade motion, scenes, sequence, demo reel, product video, launch video, title card, lower third, section break, multi-scene, storyboard]
---

```jsx
// Title card → dashboard at two viewports → video clip. One stage throughout.
<Motion>
  <MotionScene label="Hook">
    <MotionText template="title" heading="Meet the new pipeline" text="From prompt to product" />
  </MotionScene>
  <MotionScene label="Dashboard">
    <MotionScreen device="mobile" shots={[{ zoom: 1, hold: 2000 }, { zoom: 2, cx: 0.5, cy: 0.25, hold: 2400, label: "Live on mobile" }]}>
      <DashboardMobile />
    </MotionScreen>
    <MotionScreen shots={[{ zoom: 1, hold: 2400 }, { zoom: 2.2, cx: 0.22, cy: 0.3, hold: 2600, label: "Revenue up 24%" }]}>
      <Dashboard />
    </MotionScreen>
  </MotionScene>
  <MotionScene label="Proof">
    <MotionText template="stat" heading="4.2x" text="Faster from prompt to product" />
  </MotionScene>
  <MotionScene label="Word">
    <MotionText template="quote" heading="It feels like the demo directs itself." text="Head of Design, Acme" />
  </MotionScene>
  <MotionScene label="Clip" durationMs={6000}>
    <video src="/clip.mp4" autoPlay muted style={{ borderRadius: 12, maxWidth: "70%" }} />
    <MotionText template="ticker" heading="Live" text="Grade Motion ships scene transitions, broadcast overlays and a directed camera" />
  </MotionScene>
</Motion>
```

### Anti-patterns

DO NOT wrap a whole scene in <ScreenAnimator> — the camera belongs to each
<MotionScreen> inside the scene, not to the scene. A scene with two screens
has two cameras.

durationMs is a MINIMUM runtime, not just a fallback: a scene with a 3s
lower-third and `durationMs={16000}` runs the full 16s (the caption ending
early never cuts a long visual mid-flight). Timed children can extend a
scene PAST the floor; with no timed children, durationMs is the whole clock.

DO NOT use it as a layout wrapper — like ScreenAnimator it positions
`absolute inset-0` and takes over the frame.

DO NOT worry about reduced motion — the play view falls back to the strip
(see everything, move nothing).
