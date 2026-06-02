/**
 * @label       Click to confetti (DemoStage interaction)
 * @description A single screen scripted as a tiny interaction: a button fades in, a synthetic cursor arrives and a hover ring lights up, a second button appears, the cursor glides over, presses, and fires confetti — then "All set" lands and it loops. Built entirely on the lib/demo show/hide animator (DemoStage + Reveal). Hover and click aren't real pointer events — they're *reveal states*: a ring you reveal, a press flash you reveal, with confetti fired from Reveal's onReveal hook. The DOM timeline, not the camera one.
 * @tags        demo stage reveal interaction hover click press confetti cursor onboarding showcase scripted dom timeline show hide
 * @notes       Generated 2026-06-02. Companion to the Hero staged-reveal scaffold — same DemoStage + Reveal primitive, but used to script an *interaction* (hover → click → celebrate) rather than a marketing reveal. Key trick: the animator has no hover/click step (its vocabulary is reveal / hide / reveal-all / wait / reset), so a hover is a ring you `reveal` over the button and a click is a press flash you `reveal`, with `confetti()` fired from the matching Reveal's `onReveal` (the same hook the Hero uses to start the Composer typing). The cursor is a single element moved between the two buttons by measuring their rects on each onReveal — robust to layout. Honours reduced motion: confetti is suppressed and the stage snaps to its end state.
 */
import { useRef, useState } from "react";
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
  useReducedMotion,
} from "@gradeui/ui";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

// The script is pure show/hide — the only verbs the animator has.
// A "hover" is a ring we reveal over the button; a "click" is a press
// flash we reveal (and confetti fires from its onReveal). wait gives the
// eye time to land; reset loops the whole beat.
const SCRIPT = [
  { type: "reveal", target: "headline" },
  { type: "wait", ms: 450 },
  { type: "reveal", target: "btnA" },
  { type: "wait", ms: 700 },
  { type: "reveal", target: "hoverA" }, // cursor arrives + ring lights
  { type: "wait", ms: 1050 },
  { type: "hide", target: "hoverA" },
  { type: "reveal", target: "btnB" }, // second button appears
  { type: "wait", ms: 700 },
  { type: "reveal", target: "hoverB" }, // cursor glides over
  { type: "wait", ms: 850 },
  { type: "reveal", target: "pressB" }, // press flash → confetti (onReveal)
  { type: "reveal", target: "done" },
  { type: "wait", ms: 2800 },
  { type: "reset" },
];

// A pointer that points up-left, tip at (0,0) — same silhouette as the
// ScreenAnimator cursor so the family reads consistently.
function Cursor({ x, y, visible, pressed }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px) scale(${pressed ? 0.82 : 1})`,
        transformOrigin: "0 0",
        opacity: visible ? 1 : 0,
        transition:
          "transform 620ms cubic-bezier(0.34,1.12,0.64,1), opacity 280ms ease",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3l14 7-6 1.5L10 18 5 3z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function App() {
  const reduced = useReducedMotion();
  const cardRef = useRef(null);
  const btnARef = useRef(null);
  const btnBRef = useRef(null);
  const [cursor, setCursor] = useState({
    x: 24,
    y: 24,
    visible: false,
    pressed: false,
  });

  // Park the cursor over a button by measuring its rect relative to the
  // card — no hardcoded coordinates, so it survives a re-layout.
  function moveTo(ref) {
    const card = cardRef.current;
    const el = ref.current;
    if (!card || !el) return;
    const c = card.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursor((p) => ({
      ...p,
      visible: true,
      x: r.left - c.left + r.width * 0.5,
      y: r.top - c.top + r.height * 0.62,
    }));
  }

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

  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellMain className="grid min-h-screen place-items-center p-6">
        <div
          ref={cardRef}
          className="relative w-full max-w-md"
          style={{ pointerEvents: "none" }}
        >
          <Cursor {...cursor} />

          <DemoStage steps={SCRIPT} loop trigger="mount" defaultAnimation="fade-up">
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
                    {/* Button A — fades in, then a hover ring lights up. */}
                    <div className="relative">
                      <Reveal id="btnA">
                        <Button ref={btnARef} variant="outline" size="lg">
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Reveal>
                      <Reveal
                        id="hoverA"
                        animation="scale"
                        className="pointer-events-none absolute -inset-1 rounded-xl ring-2 ring-primary/60"
                        onReveal={() => moveTo(btnARef)}
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
                        className="pointer-events-none absolute -inset-1 rounded-xl ring-2 ring-primary/60"
                        onReveal={() => moveTo(btnBRef)}
                      >
                        <span className="sr-only">hover</span>
                      </Reveal>
                      <Reveal
                        id="pressB"
                        animation="scale"
                        className="pointer-events-none absolute inset-0 grid place-items-center"
                        onReveal={() => {
                          setCursor((p) => ({ ...p, pressed: true }));
                          fireConfetti();
                          setTimeout(
                            () => setCursor((p) => ({ ...p, pressed: false })),
                            190,
                          );
                        }}
                        onHide={() =>
                          setCursor((p) => ({
                            ...p,
                            visible: false,
                            pressed: false,
                          }))
                        }
                      >
                        <span className="h-full w-full rounded-xl bg-primary/25" />
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
          </DemoStage>
        </div>
      </AppShellMain>
    </AppShell>
  );
}
