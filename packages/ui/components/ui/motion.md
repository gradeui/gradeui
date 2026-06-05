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
  - "MotionScene: label?, durationMs? (fallback clock when nothing inside keeps
      time, default 4000), fill? (scene background over the stage — e.g. a white
      title card), transition? ('fade' | 'none'), children (ANY JSX)."
  - "MotionScreen: device? ('desktop' | 'mobile'), shots? (its OWN ScreenAnimator
      camera), virtualWidth?, spotlight?, cursor?, enter?, screenId? (provenance,
      ignored at render), children (the screen content, copied in)."
  - "MotionText: template? ('title' | 'lower-third' | 'section-break'), heading,
      text?, durationMs?, tone? ('light' | 'dark')."
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
  <MotionScene label="Clip" durationMs={6000}>
    <video src="/clip.mp4" autoPlay muted style={{ borderRadius: 12, maxWidth: "70%" }} />
  </MotionScene>
</Motion>
```

### Anti-patterns

DO NOT wrap a whole scene in <ScreenAnimator> — the camera belongs to each
<MotionScreen> inside the scene, not to the scene. A scene with two screens
has two cameras.

DO NOT give a scene `durationMs` when it contains a <MotionScreen> or
<MotionText> — timed children own the clock; the fallback is only for scenes
of static/untimed content (video, images, plain JSX).

DO NOT use it as a layout wrapper — like ScreenAnimator it positions
`absolute inset-0` and takes over the frame.

DO NOT worry about reduced motion — the play view falls back to the strip
(see everything, move nothing).
