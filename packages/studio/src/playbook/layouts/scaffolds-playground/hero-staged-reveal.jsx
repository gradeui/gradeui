/**
 * @label       Hero — staged reveal (DemoStage + Reveal)
 * @description Marketing hero that reveals piece-by-piece — badge, headline, subhead, CTAs, then a product preview with a scripted Composer typing inside. Demonstrates the lib/demo whole-interface staging primitive. Loops with a 4s breath between cycles so it reads as a "show what this thing does" surface.
 * @tags        hero marketing staged reveal demo stage composer scripted animation showcase landing
 * @notes       Generated 2026-05-29. First scaffold built on DemoStage +
 *              Reveal. The 'product preview' card uses Composer in readOnly
 *              + scripted mode to show a real <Composer> typing inside the
 *              hero — not a screenshot, not a mockup, the actual component.
 *              This is the "production components doing scripted demos"
 *              angle. Stage loop is 4s so the user can feel the rhythm
 *              without it feeling frantic.
 */
import { useRef } from "react";
import {
  AppShell, AppShellHeader, AppShellMain,
  Toolbar, ToolbarSlot,
  Stack, Row,
  Card, CardContent,
  Button, Badge,
  Composer,
  Message,
  Avatar, AvatarFallback,
  DemoStage, Reveal,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Sparkles,
} from "lucide-react";

// Sample mention items for the inline Composer demo.
const TEAM = [
  { id: "u1", value: "alice" },
  { id: "u2", value: "ben" },
  { id: "u3", value: "carolina" },
];

// Composer demo script — types a chat-style message, mentions a
// teammate, submits. Mirrors the docs page demo so the user sees the
// same component behaving the same way in a marketing context.
const COMPOSER_SCRIPT = [
  { type: "type", text: "Drafting the launch post — " },
  { type: "mention", trigger: "@", value: "alice", query: "ali" },
  { type: "type", text: " can you take a pass before EOD?" },
  { type: "wait", ms: 600 },
  { type: "submit" },
];

// Reveal script — the order matters: each step shows one Reveal child.
// 'wait' between reveals gives the eye a chance to land before the
// next piece appears. Final 'wait' is the breath before the loop kicks
// the whole hero off again.
const STAGE_SCRIPT = [
  { type: "reveal", target: "badge" },
  { type: "wait", ms: 250 },
  { type: "reveal", target: "headline" },
  { type: "wait", ms: 350 },
  { type: "reveal", target: "subhead" },
  { type: "wait", ms: 400 },
  { type: "reveal", target: "ctas" },
  { type: "wait", ms: 350 },
  { type: "reveal", target: "preview" },
  { type: "wait", ms: 3000 },
  { type: "reset" },
];

export default function App() {
  // Composer ref so we can fire restart() at the exact moment the
  // <Reveal id="preview"> becomes visible. Without this the Composer
  // would mount hidden (inside the Reveal) with trigger="mount", run
  // its typing while invisible, and the user would only see the
  // finished message land — never the animation.
  const composerRef = useRef(null);

  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellHeader className="border-b border-border bg-background/80 backdrop-blur">
        <Toolbar size="md" className="max-w-6xl mx-auto px-6">
          <ToolbarSlot slot="leading">
            <Row gap="md" align="center">
              <Row gap="xs" align="center">
                <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center font-bold text-sm">G</div>
                <span className="font-semibold">GradeUI</span>
              </Row>
              <Row gap="md" align="center" className="ml-6 text-sm text-muted-foreground">
                <a href="#features">Features</a>
                <a href="#docs">Docs</a>
                <a href="#pricing">Pricing</a>
              </Row>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Row gap="sm" align="center">
              <Button variant="ghost" size="sm"><Github className="h-4 w-4" /></Button>
              <Button size="sm">Open Studio</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-6xl mx-auto px-6">
        {/* The whole hero is one DemoStage. Each Reveal child is
            triggered by the matching `{ type: "reveal", target }` step.
            Loop + 4s breath means the cycle replays cleanly. */}
        <DemoStage
          steps={STAGE_SCRIPT}
          trigger="mount"
          speed="normal"
          loop
          loopDelay={4000}
          defaultAnimation="fade-up"
        >
          <Stack gap="lg" className="py-20 max-w-3xl">
            <Reveal id="badge">
              <Badge variant="outline" className="w-fit">
                <Sparkles className="h-3 w-3 mr-1" />
                Animation library, on top of a design system
              </Badge>
            </Reveal>

            <Reveal id="headline">
              <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
                Scripted demos.<br />
                Real components.
              </h1>
            </Reveal>

            <Reveal id="subhead">
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Stop shipping screenshots of animations. The same components users tap in production type out their own marketing demos, in sequence, on cue.
              </p>
            </Reveal>

            <Reveal id="ctas">
              <Row gap="sm" align="center" className="pt-2">
                <Button size="lg">
                  Open Studio
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
                <Button size="lg" variant="outline">
                  Read the docs
                </Button>
              </Row>
            </Reveal>

            <Reveal
              id="preview"
              animation="fade-up"
              durationMs={400}
              onReveal={() => {
                // Wait until the card's fade-up has settled before
                // the typing kicks off — otherwise the typing animation
                // competes with the entry animation visually.
                setTimeout(() => composerRef.current?.restart(), 250);
              }}
            >
              <Card className="mt-6 overflow-hidden">
                <CardContent className="p-0">
                  {/* Pretend chat header inside the card. */}
                  <Row align="center" gap="sm" className="border-b border-border px-4 py-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">#launch-week</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">live</Badge>
                  </Row>
                  {/* Pre-baked messages above the Composer to give the
                      scripted typing context. Uses <Message> primitive
                      + tinted Avatar fallbacks. */}
                  <Stack gap="sm" className="px-4 py-3">
                    <Message
                      author="alice"
                      timestamp="11:24"
                      avatar={
                        <Avatar size="xs">
                          <AvatarFallback tone="violet">A</AvatarFallback>
                        </Avatar>
                      }
                    >
                      Post copy is in the doc. Looks tight!
                    </Message>
                    <Message
                      author="ben"
                      timestamp="11:26"
                      avatar={
                        <Avatar size="xs">
                          <AvatarFallback tone="amber">B</AvatarFallback>
                        </Avatar>
                      }
                    >
                      Same. Just need the launch image and we're good.
                    </Message>
                  </Stack>
                  {/* The real Composer, in readOnly + scripted mode.
                      Lives inside the hero card as the "preview" of
                      what the chat input is doing. */}
                  <div className="border-t border-border p-3 bg-muted/20">
                    <Composer
                      ref={composerRef}
                      placeholder="Reply to #launch-week…"
                      formats={false}
                      triggers={[{ char: "@", items: TEAM }]}
                      steps={COMPOSER_SCRIPT}
                      // trigger="manual" — fires only when the parent
                      // Reveal's onReveal callback calls restart(). Stops
                      // the typing from happening while still hidden.
                      trigger="manual"
                      speed="normal"
                      readOnly
                      onSubmit={() => {
                        // No-op — the stage loop resets the composer.
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </Stack>
        </DemoStage>

        {/* Static credit line below the stage. Stays visible the
            whole time — anchors the page even while the hero is
            mid-reveal. */}
        <Row gap="md" align="center" className="border-t border-border py-6 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>
            The hero above replays every 4 seconds. The Composer inside the card is a real component, not a screenshot. Inspect it.
          </span>
        </Row>
      </AppShellMain>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// • <ChatMessage> — every chat-shaped marketing surface needs a
//   compact "avatar + name + timestamp + body" row. Currently composed
//   from Row + Stack + ad-hoc avatar div. Worth a primitive.
//
// • DemoStage script ergonomics — the explicit { type: "wait" } between
//   every reveal is repetitive. A `cadence: "normal"` on DemoStage
//   could auto-insert sensible waits between consecutive reveals so
//   marketing authors write just the targets.
//
// • Inline avatar with size variant — the 6x6 rounded letter circle
//   is repeated. Avatar accepts className for sizing today; a
//   size="xs" preset would tighten the call sites.
