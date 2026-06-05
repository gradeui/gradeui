/**
 * @label       Motion transitions (the cut catalogue)
 * @description Every scene transition, one per scene, labelled — fade, slide up/down/left/right, pop, zoom, and a hard cut (none). Each scene names its own entrance in giant type on a distinct fill, so you FEEL each transition as it happens and can pick by eye. The reference reel for the `transition` prop.
 * @tags        motion transitions fade slide pop zoom cut scene entrance catalogue reference
 * @notes       Transitions are ENTRANCE-only by design — the outgoing scene cuts, the incoming one performs (true cross-fades ride the seekable-clock work). Set per scene: <MotionScene transition="slide-up">. Short durations on purpose; this is a flip-book. Needs @gradeui/ui dist with Motion: `pnpm -F @gradeui/ui build`.
 */
import { Motion, MotionScene, MotionText } from "@gradeui/ui";

const CUTS = [
  { t: "fade", fill: "#0b0b0e", ink: "#fff", note: "the default — calm dissolve in" },
  { t: "slide-up", fill: "#1d1a4b", ink: "#fff", note: "rises from below — momentum" },
  { t: "slide-down", fill: "#e8ff47", ink: "#101014", note: "drops from above — weight" },
  { t: "slide-left", fill: "#0f3d2e", ink: "#fff", note: "enters from the right — forward" },
  { t: "slide-right", fill: "#3d0f24", ink: "#fff", note: "enters from the left — backward" },
  { t: "pop", fill: "#7c1dff", ink: "#fff", note: "overshoot scale — playful" },
  { t: "zoom", fill: "#101014", ink: "#fff", note: "settles from above-size — cinematic" },
  { t: "wipe-circle", fill: "#0f3d2e", ink: "#fff", note: "mask wipe — cuts through the last scene" },
  { t: "none", fill: "#e11d48", ink: "#fff", note: "hard cut — beat-matched energy" },
];

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

        {CUTS.map((c) => (
          // transitionMs overrides each cut's default timing — slowed a
          // touch here so you can study them. The previous scene stays
          // visible underneath during each entrance.
          <MotionScene key={c.t} label={c.t} transition={c.t} transitionMs={c.t === "none" ? undefined : 700} durationMs={2400} fill={c.fill}>
            <div style={{ textAlign: "center", color: c.ink }}>
              <div style={{ fontSize: "9vw", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
                {c.t}
              </div>
              <div style={{ marginTop: 12, fontSize: 15, opacity: 0.7 }}>{c.note}</div>
            </div>
          </MotionScene>
        ))}

        <MotionScene label="Close" transition="zoom">
          <MotionText template="section-break" heading="Pick your cut." />
        </MotionScene>
      </Motion>
    </div>
  );
}
