/**
 * @label       Home — migration story (enterprise voice)
 * @description Enterprise/PM-flavoured home page led by before/during/after migration. No-lock-in trust, MIT line, consultancy CTA prominent. Wireframe foundation.
 * @tags        home landing marketing migration legacy rewrite enterprise consultancy wireframe
 * @notes       Generated 2026-05-28 from POSITIONING.md + COPY.md. The
 *              hero asset is the before-during-after triptych of a real
 *              product UI. This concept is built to convert to consultancy
 *              briefs: heavy consultancy CTA, no-lock-in copy reinforced
 *              twice, the "talk about a migration plan" button as primary.
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
  ArrowRight, Github, ShieldCheck, FileCode, Boxes,
  AlertTriangle, CheckCircle2, Calendar, Layers,
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
                <a href="#migration">Migration</a>
                <a href="#components">Components</a>
                <a href="#consultancy">Consultancy</a>
                <a href="#pricing">Pricing</a>
              </Row>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Row gap="sm" align="center">
              <Button variant="ghost" size="sm"><Github className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm">Sign in</Button>
              <Button size="sm">Talk to us</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <Stack gap="xl" className="py-20">
          <Stack gap="md" align="center" className="text-center max-w-3xl mx-auto">
            <Badge variant="outline">For teams sitting on legacy UI</Badge>
            <h1 className="text-5xl font-semibold tracking-tight">
              Migrate piece by piece.<br />Without the rewrite.
            </h1>
            <p className="text-lg text-muted-foreground">
              Install the library alongside whatever your team ships today. Replace components one at a time. Every refactor graduates a screen onto the system. The migration becomes the work your team was already doing, channelled.
            </p>
            <Row gap="sm" className="mt-2">
              <Button size="lg">Talk to us about a migration plan <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button size="lg" variant="outline">Install the library</Button>
            </Row>
            <Row gap="md" align="center" className="mt-2 text-xs text-muted-foreground">
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>MIT licensed</span></Row>
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>Free for commercial use</span></Row>
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>You own the code</span></Row>
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>No lock-in</span></Row>
            </Row>
          </Stack>

          {/* Before / during / after — hero asset */}
          <Grid cols="3" gap="md" className="mt-8">
            {[
              { stage: "Before", caption: "Legacy UI. Dated. Inconsistent components. The thing the team is afraid to touch.", tone: "muted" },
              { stage: "During", caption: "Some screens migrated, some still legacy. Both shipping in production. The team is moving.", tone: "default" },
              { stage: "After", caption: "Fully migrated. Modernised. Recognisably the same product. Built on a system that will absorb the next AI cycle.", tone: "emphasised" },
            ].map((s, i) => (
              <Card key={s.stage} className={s.tone === "emphasised" ? "ring-2 ring-foreground/10" : ""}>
                <CardContent className="p-4">
                  <Stack gap="sm">
                    <MediaSurface
                      hint={`${s.stage.toLowerCase()} state of a legacy product UI`}
                      alt={`${s.stage} migration state`}
                      className="aspect-video w-full rounded-md"
                    />
                    <Row gap="xs" align="center" justify="between">
                      <Badge variant="outline" className="text-xs">{i + 1}. {s.stage}</Badge>
                    </Row>
                    <span className="text-sm text-muted-foreground">{s.caption}</span>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* The rewrite that kills teams */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Grid cols="2" gap="xl" className="items-start">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <Row gap="sm" align="center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-base">The rewrite path</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="xs">
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Month 0</span><span className="text-sm">Board approves the rewrite</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Month 6</span><span className="text-sm">Team is heads down, customers see nothing</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Month 12</span><span className="text-sm">New version is 40% caught up</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Month 18</span><span className="text-sm">Lead engineer leaves. Project slips.</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Eventually</span><span className="text-sm">Either dies, or ships with all the legacy mistakes in new tech.</span></Row>
                </Stack>
              </CardContent>
            </Card>
            <Card className="ring-2 ring-foreground/10">
              <CardHeader>
                <Row gap="sm" align="center">
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
                  <CardTitle className="text-base">The migration path</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="xs">
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Sprint 1</span><span className="text-sm">Install @gradeui/ui alongside the current stack</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Sprint 2</span><span className="text-sm">Replace the sidebar on the page being touched anyway</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Sprint 3</span><span className="text-sm">Adopt tokens on the new feature work</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Every sprint</span><span className="text-sm">A bit more of the app graduates onto the system</span></Row>
                  <Row gap="xs"><span className="text-muted-foreground text-sm">Always</span><span className="text-sm">Customers see continuous improvement, not a freeze.</span></Row>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Consultancy bridge */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Consultancy</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">We work with a small number of teams each quarter.</h2>
            <p className="text-muted-foreground">You bring the product, the content, and the customer load. We bring the system, the components, and the experience of running these migrations before. Engagement-based, not retainer-based. The work ends when the work is done.</p>
          </Stack>
          <Grid cols="3" gap="md">
            {[
              { icon: Layers, title: "Design system strategy", desc: "For teams about to scale. Token architecture, component selection, the system that absorbs AI output without compounding drift." },
              { icon: FileCode, title: "AI builder integration", desc: "For teams whose generated output is fighting their system. Wire the model to the primitives and the tokens, stop the drift." },
              { icon: Calendar, title: "Migration plans", desc: "For teams sitting on legacy UI. We map your existing product to the system, name the order to replace components, pair on the hard parts." },
            ].map((s) => (
              <Card key={s.title}>
                <CardHeader>
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>{s.title}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </Grid>
          <Card>
            <CardContent className="p-6">
              <Row justify="between" align="center" className="flex-wrap gap-4">
                <Stack gap="xs">
                  <span className="font-semibold">Talk to us about a migration plan.</span>
                  <span className="text-sm text-muted-foreground">Reach out at ali@gradeui.com or book an intro call.</span>
                </Stack>
                <Row gap="sm">
                  <Button variant="outline">Email</Button>
                  <Button>Book a call <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </Row>
              </Row>
            </CardContent>
          </Card>
        </Stack>

        {/* Trust reinforcement */}
        <Stack gap="md" align="center" className="py-20 border-t border-border text-center">
          <Boxes className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-3xl font-semibold tracking-tight">You own the code.</h2>
          <p className="text-muted-foreground max-w-xl">MIT licensed. Free for commercial use. If you stop using gradeui tomorrow, the system you built on it keeps shipping. The difference between buying a foundation and renting a tool.</p>
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
// • <Timeline> / <TimelineRow> — the rewrite-vs-migration cards list
//   "Month 0 / Month 6 / ..." or "Sprint 1 / Sprint 2 / ..." rows.
//   Two-column label+content pattern that will recur in roadmap and
//   case-study sections. Proposed:
//   <Timeline><TimelineRow when label /></Timeline>.
//
// • <ContrastCardPair> — the side-by-side "bad path / good path"
//   layout is a common marketing primitive. One card tonally
//   warning-tinted, the other emphasised with the ring. Could fold
//   into a layout primitive: <ContrastPair tone="warn-vs-default" />.
//
// • <ConsultancyCTA> — the inline contact card at the end of the
//   consultancy section (left-aligned pitch, right-aligned buttons)
//   is the conversion surface. Worth a dedicated component once a
//   second page needs it.
