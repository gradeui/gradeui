/**
 * @label       Click to confetti (DemoStage + ScreenAnimator)
 * @description A single screen scripted as a tiny interaction, directed by a declarative camera. DemoStage reveals the card, headline and buttons piece by piece; a ScreenAnimator shot list tightens the zoom as the buttons appear and releases it on the confetti. No bespoke inline motion — the zoom is our own ScreenAnimator `shots`, so the Studio timeline can read and edit it like any other camera.
 * @tags        demo stage reveal interaction hover click press confetti zoom camera screenanimator shots timeline declarative dogfood showcase
 * @notes       Generated 2026-06-03. Dogfoods ScreenAnimator: the zoom used to be a bespoke inline `setZoom` state machine on a scaled div — replaced with a declarative `shots` list so the motion is the same idiom the camera-tour uses and the Studio timeline reads (extractCameraShots finds `const SHOTS`). Reveals stay on DemoStage; confetti fires from the `pressB` reveal. Single play (loop off) so the camera and reveal clocks don't drift — the proper fix for synced looping is one clock (zoom keyframes ON the scripted timeline), which is the next slice. ScreenAnimator shows a replay button on finish. Camera holds are timed to land each push on a reveal beat; tune them from the timeline.
 */
import { useRef } from "react";
import {
  AppShell,
  AppShellMain,
  Stack,
  Row,
  Card,
  CardContent,
  Button,
  DemoStage,
  Reveal,
  ScreenAnimator,
  useReducedMotion,
} from "@gradeui/ui";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

// The camera arc as a declarative shot list — the SAME idiom as the
// camera-tour, so the Studio timeline reads and edits it. Holds are timed so
// each push lands on a reveal beat (centre focal point; the card is centred).
const SHOTS = [
  { zoom: 1, cx: 0.5, cy: 0.5, hold: 1100, label: "Get started" },
  { zoom: 1.12, cx: 0.5, cy: 0.5, trans: 500, hold: 1500, label: "Continue" },
  { zoom: 1.3, cx: 0.5, cy: 0.5, trans: 500, hold: 800, label: "Finish setup" },
  { zoom: 0.9, cx: 0.5, cy: 0.5, trans: 600, hold: 2600, label: "All set" },
];

// The reveal script — pure show/hide. A hover is a ring we reveal over the
// button; a click is a press flash we reveal (and confetti fires from its
// onReveal). Single play (no loop) so it stays in step with the camera.
const SCRIPT = [
  { type: "reveal", target: "card" },
  { type: "wait", ms: 560 },
  { type: "reveal", target: "headline" },
  { type: "wait", ms: 500 },
  { type: "reveal", target: "btnA" },
  { type: "wait", ms: 700 },
  { type: "reveal", target: "hoverA" },
  { type: "wait", ms: 1050 },
  { type: "hide", target: "hoverA" },
  { type: "reveal", target: "btnB" },
  { type: "wait", ms: 700 },
  { type: "reveal", target: "hoverB" },
  { type: "wait", ms: 850 },
  { type: "reveal", target: "pressB" }, // → confetti
  { type: "reveal", target: "done" },
];

export default function App() {
  const reduced = useReducedMotion();
  const btnBRef = useRef(null);

  function fireConfetti() {
    if (reduced) return; // confetti is motion — suppress it
    const el = btnBRef.current;
    let origin = { x: 0.5, y: 0.55 };
    if (el) {
      const r = el.getBoundingClientRect();
      origin = {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      };
    }
    confetti({
      particleCount: 90,
      spread: 72,
      startVelocity: 38,
      ticks: 220,
      scalar: 0.9,
      origin,
    });
  }

  // Wrap the screen in our own ScreenAnimator — the zoom is declarative shots,
  // not an inline state machine. Lean config: no fly-in, no vignette, no
  // synthetic cursor, transparent stage; just the directed zoom over the card.
  return (
    <ScreenAnimator
      shots={SHOTS}
      enter={false}
      loop={false}
      spotlight={false}
      cursor={false}
      stage="transparent"
    >
      <AppShell nav="none" className="h-screen min-h-0 overflow-hidden bg-background">
        <AppShellMain className="grid h-full place-items-center overflow-hidden p-6">
          <DemoStage
            steps={SCRIPT}
            trigger="mount"
            defaultAnimation="fade-up"
            className="w-full max-w-md"
          >
            <Reveal id="card" animation="scale" durationMs={560}>
              <Card className="shadow-elevation-3">
                <CardContent className="p-8">
                  <Stack gap="lg" align="center">
                    <Reveal id="headline">
                      <Stack gap="xs" align="center" className="text-center">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight">
                          You're almost there
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Two taps and you're set up.
                        </span>
                      </Stack>
                    </Reveal>

                    <Row gap="md" align="center" justify="center" className="w-full">
                      {/* Button A — fades in, then a hover ring. */}
                      <div className="relative">
                        <Reveal id="btnA">
                          <Button variant="outline" size="lg">
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Reveal>
                        <Reveal
                          id="hoverA"
                          animation="scale"
                          className="pointer-events-none absolute -inset-0.5 rounded-lg ring-2 ring-primary/60"
                        >
                          <span className="sr-only">hover</span>
                        </Reveal>
                      </div>

                      {/* Button B — appears second; the press fires confetti. */}
                      <div className="relative">
                        <Reveal id="btnB">
                          <Button ref={btnBRef} size="lg">
                            Finish setup
                          </Button>
                        </Reveal>
                        <Reveal
                          id="hoverB"
                          animation="scale"
                          className="pointer-events-none absolute -inset-0.5 rounded-lg ring-2 ring-primary/60"
                        >
                          <span className="sr-only">hover</span>
                        </Reveal>
                        <Reveal
                          id="pressB"
                          animation="scale"
                          className="pointer-events-none absolute inset-0 grid place-items-center"
                          onReveal={fireConfetti}
                        >
                          <span className="h-full w-full rounded-md bg-primary/25" />
                        </Reveal>
                      </div>
                    </Row>

                    <Reveal id="done" animation="fade-up">
                      <Row gap="xs" align="center" className="text-emerald-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">All set</span>
                      </Row>
                    </Reveal>
                  </Stack>
                </CardContent>
              </Card>
            </Reveal>
          </DemoStage>
        </AppShellMain>
      </AppShell>
    </ScreenAnimator>
  );
}
