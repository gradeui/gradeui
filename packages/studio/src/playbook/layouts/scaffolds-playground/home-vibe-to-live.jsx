/**
 * @label       Home — vibe to live code (designer voice)
 * @description Designer/founder-flavoured home page led by the three-panel vibe-to-live-code arc. Lovable graduation framing. Wireframe foundation.
 * @tags        home landing marketing vibe lovable graduation arc designer wireframe
 * @notes       Generated 2026-05-28 from POSITIONING.md + COPY.md. The hero
 *              is a three-panel sequence: Studio canvas mid-vibe, polished
 *              slot-filled middle, IDE handoff. Used MediaSurface for each
 *              panel — swap for real screenshots when ready. The narrative
 *              targets Lovable / Bolt / v0 graduates who hit the ceiling.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge,
  MediaSurface,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Sparkles, Wand2, Code2,
  Layers, Palette, GitBranch,
} from "lucide-react";

export default function App() {
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
                <a href="#studio">Studio</a>
                <a href="#components">Components</a>
                <a href="#figma">Figma</a>
                <a href="#docs">Docs</a>
              </Row>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Row gap="sm" align="center">
              <Button variant="ghost" size="sm"><Github className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm">Sign in</Button>
              <Button size="sm">Open Studio</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <Stack gap="xl" className="py-20">
          <Stack gap="md" align="center" className="text-center max-w-3xl mx-auto">
            <Badge variant="outline">Built on a real design system</Badge>
            <h1 className="text-5xl font-semibold tracking-tight">
              Vibe code anywhere.<br />Ship live code with gradeui.
            </h1>
            <p className="text-lg text-muted-foreground">
              The AI app builder for teams that ship real software. Real components, real density, real primitives, a Figma file that matches the code.
            </p>
            <Row gap="sm" className="mt-2">
              <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button size="lg" variant="outline">See the components</Button>
            </Row>
          </Stack>

          {/* The three-panel arc — the hero asset */}
          <Grid cols="3" gap="md" className="mt-8">
            {[
              { icon: Wand2, label: "1. Vibe in Studio", caption: "Sketch the screen, let the model fill it in. Wireframe first, fidelity later.", hint: "studio canvas mid-vibe — sketchy layout, generated blocks" },
              { icon: Palette, label: "2. Polish on the system", caption: "Real components emerge. Slots fill. Tokens apply. Annotate, prompt, refine.", hint: "polished screen with tokens applied, MediaSurfaces filled" },
              { icon: Code2, label: "3. Ship to your repo", caption: "Export to React, push to CodeSandbox, copy to Figma. Components survive intact.", hint: "IDE / repo view with Sidebar and DataTable imports visible" },
            ].map((p, i) => (
              <Card key={p.label} className={i === 1 ? "ring-2 ring-foreground/10" : ""}>
                <CardContent className="p-4">
                  <Stack gap="sm">
                    <MediaSurface
                      hint={p.hint}
                      alt={p.label}
                      className="aspect-video w-full rounded-md"
                    />
                    <Row gap="xs" align="center">
                      <p.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.label}</span>
                    </Row>
                    <span className="text-sm text-foreground">{p.caption}</span>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* The graduation narrative */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Grid cols="2" gap="xl" className="items-start">
            <Stack gap="sm">
              <Badge variant="outline" className="w-fit">For Lovable, Bolt, and v0 graduates</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">The graduation step nobody is talking about.</h2>
              <p className="text-muted-foreground">You shipped v1 in two weekends. The board is delighted. Then comes the first frontend hire, the first design audit, and the work begins to slow. The markup is throwaway. Components do not exist as components. Every regenerate drifts the structure further from anything your team can ship.</p>
              <p className="text-muted-foreground">GradeUI is the destination. AI builders feed into it. Your team builds on it.</p>
            </Stack>
            <Card>
              <CardContent className="p-6">
                <Stack gap="md">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">The bridge</span>
                  <Stack gap="sm">
                    <Row gap="sm" align="center"><Sparkles className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Vibe in Studio just like Lovable</span></Row>
                    <Row gap="sm" align="center"><Layers className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Real components emerge from the prompt</span></Row>
                    <Row gap="sm" align="center"><GitBranch className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Push to CodeSandbox or your repo</span></Row>
                    <Row gap="sm" align="center"><Code2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Your developers inherit the same primitives</span></Row>
                  </Stack>
                  <Button variant="outline" className="w-full mt-2">Read the migration story</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Figma loop */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Figma parity, both directions</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Designers and developers build on the same substrate.</h2>
            <p className="text-muted-foreground">A slot-based Figma file with primitive names that match the code. Copy to Figma takes a layout straight out of Studio with components intact (shipping soon). Three roles, one substrate.</p>
          </Stack>
          <Grid cols="2" gap="md">
            <MediaSurface hint="figma artboard with sidebar component, slots labelled" alt="Figma side" className="aspect-video w-full rounded-md" />
            <MediaSurface hint="same component in code, slot names matching" alt="Code side" className="aspect-video w-full rounded-md" />
          </Grid>
        </Stack>

        {/* Wireframes first */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Wireframes first</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Raise fidelity on your terms.</h2>
            <p className="text-muted-foreground">Every other AI builder hands you a polished demo on the first prompt. That is why iteration is painful. GradeUI starts at the wireframe. Lock the structure, then raise fidelity across content, imagery, and visual polish on three independent axes.</p>
          </Stack>
          <Grid cols="4" gap="sm">
            {["Wireframe", "+ Real labels", "+ Real data", "+ Brand polish"].map((label) => (
              <Card key={label}>
                <CardContent className="p-3">
                  <Stack gap="xs">
                    <MediaSurface hint={`fidelity step ${label}`} alt={label} className="aspect-video w-full rounded-sm" />
                    <span className="text-xs text-center text-muted-foreground">{label}</span>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* CTA close */}
        <Stack gap="md" align="center" className="py-20 border-t border-border text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Stop staring at v0 output.</h2>
          <p className="text-muted-foreground max-w-xl">Open Studio. Vibe a screen. Ship live code your team will actually merge.</p>
          <Row gap="sm" className="mt-2">
            <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <Button size="lg" variant="outline">Install the library</Button>
          </Row>
        </Stack>
      </AppShellMain>

      <AppShellFooter className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Row justify="between" align="center">
            <span className="text-sm text-muted-foreground">GradeUI by Ali Driver — ali@gradeui.com</span>
            <Row gap="md" className="text-sm text-muted-foreground">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#github">GitHub</a>
            </Row>
          </Row>
        </div>
      </AppShellFooter>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// • <ArcPanel> / <SequenceStep> — the three-panel arc (or four-panel
//   fidelity ladder) follows a clear shape: image + step number +
//   label + caption. Used twice in this scaffold alone (hero arc,
//   fidelity ladder). Proposed:
//   <SequenceStep step label caption media />.
//
// • <FactRow> — the bridge card lists "Vibe in Studio / Real
//   components / Push to CodeSandbox / Developers inherit" as a
//   vertical icon+text rhythm. Recurring on most marketing pages.
//   Could fold into <Stack as={List}> with an icon prop.
//
// (Same <LogoStripe> and <CodePanel> gaps from home-diff-hero apply
// here too — when this pattern shows up in three scaffolds, it
// graduates.)
