/**
 * @label       Motion transitions (the cut catalogue)
 * @description Every scene transition, one per scene, labelled — fade, slide up/down/left/right, pop, zoom, wipe-circle, and a hard cut (none). Each scene names its own entrance in giant type on a distinct fill, so you FEEL each transition as it happens and can pick by eye. The reference reel for the `transition` prop.
 * @tags        motion transitions fade slide pop zoom cut scene entrance catalogue reference
 * @notes       Transitions are ENTRANCE-only by design — the outgoing scene cuts, the incoming one performs (true cross-fades ride the seekable-clock work). Set per scene: <MotionScene transition="slide-up">. Written as LITERAL scenes (not a .map) so every cut gets its own editable timeline chip and the scene counter reads true. Short durations on purpose; this is a flip-book. Needs @gradeui/ui dist with Motion: `pnpm -F @gradeui/ui build`.
 */
import { Motion, MotionScene, MotionText } from "@gradeui/ui";

// One reusable card so the literal scenes below stay readable. This is a
// plain render helper (inlined per scene), NOT a wrapper component — each
// <MotionScene> is a real literal tag the timeline can introspect + edit.
function Cut({ name, note, ink = "#fff" }) {
  return (
    <div style={{ textAlign: "center", color: ink }}>
      <div style={{ fontSize: "9vw", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
        {name}
      </div>
      <div style={{ marginTop: 12, fontSize: 15, opacity: 0.7 }}>{note}</div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Motion aspect="16/9">
        <MotionScene label="Title">
          <MotionText
            template="title"
            heading="The cut catalogue"
            text="every scene names its own entrance"
          />
        </MotionScene>

        {/* Each cut is its own literal scene — transitionMs slows the
            entrance a touch so you can study it; the previous scene stays
            visible underneath during the performance. */}
        <MotionScene label="fade" transition="fade" transitionMs={700} durationMs={2400} fill="#0b0b0e">
          <Cut name="fade" note="the default — calm dissolve in" />
        </MotionScene>

        <MotionScene label="slide-up" transition="slide-up" transitionMs={700} durationMs={2400} fill="#1d1a4b">
          <Cut name="slide-up" note="rises from below — momentum" />
        </MotionScene>

        <MotionScene label="slide-down" transition="slide-down" transitionMs={700} durationMs={2400} fill="#e8ff47">
          <Cut name="slide-down" note="drops from above — weight" ink="#101014" />
        </MotionScene>

        <MotionScene label="slide-left" transition="slide-left" transitionMs={700} durationMs={2400} fill="#0f3d2e">
          <Cut name="slide-left" note="enters from the right — forward" />
        </MotionScene>

        <MotionScene label="slide-right" transition="slide-right" transitionMs={700} durationMs={2400} fill="#3d0f24">
          <Cut name="slide-right" note="enters from the left — backward" />
        </MotionScene>

        <MotionScene label="pop" transition="pop" transitionMs={700} durationMs={2400} fill="#7c1dff">
          <Cut name="pop" note="overshoot scale — playful" />
        </MotionScene>

        <MotionScene label="zoom" transition="zoom" transitionMs={700} durationMs={2400} fill="#101014">
          <Cut name="zoom" note="settles from above-size — cinematic" />
        </MotionScene>

        <MotionScene label="wipe-circle" transition="wipe-circle" transitionMs={700} durationMs={2400} fill="#0f3d2e">
          <Cut name="wipe-circle" note="mask wipe — cuts through the last scene" />
        </MotionScene>

        <MotionScene label="none" transition="none" durationMs={2400} fill="#e11d48">
          <Cut name="none" note="hard cut — beat-matched energy" />
        </MotionScene>

        <MotionScene label="Close" transition="zoom">
          <MotionText template="section-break" heading="Pick your cut." />
        </MotionScene>
      </Motion>
    </div>
  );
}
