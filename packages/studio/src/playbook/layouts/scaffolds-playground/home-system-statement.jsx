/**
 * @label       Home — system statement (thought leadership)
 * @description Authoritative positioning home page led by "The design system every AI builder should sit on top of." Long-form, component showcase, less tactical. Wireframe foundation.
 * @tags        home landing marketing positioning statement thought-leadership wireframe
 * @notes       Generated 2026-05-28 from POSITIONING.md + COPY.md. The
 *              tone here is editorial: long-form blocks, smaller image
 *              footprint, component showcase as proof. This is the home
 *              page that pairs best with LinkedIn referral from the
 *              insight-led posts in COPY.md.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Quote, Layers3, Boxes, Palette, Component,
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
                <a href="#thinking">Thinking</a>
                <a href="#components">Components</a>
                <a href="#studio">Studio</a>
                <a href="#consultancy">Consultancy</a>
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

      <AppShellMain className="max-w-5xl mx-auto px-6">
        {/* Hero — long-form statement, less visual weight */}
        <Stack gap="lg" className="py-24">
          <Stack gap="md" className="max-w-3xl">
            <Badge variant="outline" className="w-fit">A position</Badge>
            <h1 className="text-5xl font-semibold tracking-tight leading-tight">
              The design system every AI builder should sit on top of.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              AI builders are now generating output faster than systems can absorb it. The discipline is no longer "build the design system." It is build the design system that can metabolise AI output without compounding drift. GradeUI is built for that discipline.
            </p>
            <Row gap="sm" className="mt-2">
              <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button size="lg" variant="outline">Read the positioning</Button>
            </Row>
          </Stack>
        </Stack>

        {/* Three principles */}
        <Stack gap="xl" className="py-16 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">The three things to get right</span>
            <h2 className="text-3xl font-semibold tracking-tight">A design system survives the AI era when three things are true.</h2>
          </Stack>
          <Stack gap="md">
            {[
              { num: "01", icon: Palette, title: "Tokens as the contract.", body: "CSS variables are the public surface area. A brand designer changes a token and the entire output reskins. No regenerate, no re-prompt. The part of the stack that survives the next AI cycle." },
              { num: "02", icon: Component, title: "Real components in the output.", body: "Not Tailwind soup. When the model emits a sidebar, it emits <Sidebar>, not three hundred lines of inline divs. Generations stack rather than diverge, and the engineering team integrates as a file copy, not a rewrite." },
              { num: "03", icon: Layers3, title: "A Figma file that matches the code.", body: "Slot-based, primitive names matching, tokens matching. Designers mock with the substrate the app is actually built from. Designers and developers review the same artefact." },
            ].map((p) => (
              <Row key={p.num} gap="lg" className="border-t border-border pt-6">
                <span className="text-2xl font-semibold text-muted-foreground/40 w-12">{p.num}</span>
                <Stack gap="sm" className="flex-1">
                  <Row gap="sm" align="center">
                    <p.icon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">{p.title}</h3>
                  </Row>
                  <p className="text-muted-foreground max-w-2xl">{p.body}</p>
                </Stack>
              </Row>
            ))}
          </Stack>
        </Stack>

        {/* Pull quote */}
        <Stack gap="md" className="py-20 border-t border-border">
          <Quote className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-2xl font-medium leading-snug max-w-3xl">
            Get those right and AI becomes a multiplier on your design system. Get them wrong and AI becomes its accelerated death.
          </p>
          <span className="text-sm text-muted-foreground">Ali Driver, GradeUI</span>
        </Stack>

        {/* Component showcase via tabs */}
        <Stack gap="xl" className="py-16 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Proof</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">The system, in components.</h2>
            <p className="text-muted-foreground">Every primitive in five sizes. The hard libraries (data tables, maps, drag and drop, rich text, 3D) curated and themed against the same tokens. Multi-select and combobox first-class.</p>
          </Stack>
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="primitives">
                <TabsList>
                  <TabsTrigger value="primitives">Primitives</TabsTrigger>
                  <TabsTrigger value="hard">Hard libraries</TabsTrigger>
                  <TabsTrigger value="sizes">Size scale</TabsTrigger>
                </TabsList>
                <TabsContent value="primitives" className="pt-4">
                  <Grid cols="3" gap="sm">
                    {["Sidebar", "Toolbar", "Modal", "Toggle", "MultiSelect", "Combobox", "DataTable", "Map", "Sortable", "TipTap", "MediaSurface", "Avatar"].map((p) => (
                      <Card key={p}><CardContent className="p-3 text-sm text-muted-foreground">{p}</CardContent></Card>
                    ))}
                  </Grid>
                </TabsContent>
                <TabsContent value="hard" className="pt-4">
                  <Grid cols="2" gap="sm">
                    {[
                      { name: "TanStack", role: "Data tables" },
                      { name: "MapLibre + Mapbox + Google", role: "Maps" },
                      { name: "dnd-kit", role: "Drag and drop" },
                      { name: "TipTap", role: "Rich text" },
                      { name: "three.js", role: "3D and WebGL" },
                      { name: "recharts", role: "Charts" },
                    ].map((l) => (
                      <Card key={l.name}>
                        <CardContent className="p-3">
                          <Row justify="between" align="center">
                            <span className="text-sm font-medium">{l.name}</span>
                            <span className="text-xs text-muted-foreground">{l.role}</span>
                          </Row>
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>
                </TabsContent>
                <TabsContent value="sizes" className="pt-4">
                  <Stack gap="md">
                    <Row gap="sm" align="end">
                      <Button size="sm">xs</Button>
                      <Button size="sm">sm</Button>
                      <Button>md</Button>
                      <Button size="lg">lg</Button>
                      <Button size="lg">xl</Button>
                    </Row>
                    <p className="text-sm text-muted-foreground">Same button. Same primitive across input, select, toggle, modal. Dense to marketing, one prop change.</p>
                  </Stack>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </Stack>

        {/* Trust bar */}
        <Stack gap="sm" align="center" className="py-12 border-y border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Model agnostic. Plugs into everything you already use.</span>
          <Row gap="xl" align="center" className="text-muted-foreground/70 text-sm font-medium flex-wrap justify-center">
            <span>Anthropic</span><span>Google</span><span>OpenAI</span><span>Nano Banana</span><span>Imagen</span><span>MCP</span><span>React</span><span>Figma</span>
          </Row>
        </Stack>

        {/* Editorial close + consultancy bridge */}
        <Stack gap="xl" className="py-20">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Behind the system</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Built by Ali Driver and the gradeui team.</h2>
            <p className="text-muted-foreground">We help product teams build design systems that survive the AI era: real tokens, real components, real Figma parity, and a workflow that lets AI builders feed into the system rather than break it.</p>
            <p className="text-muted-foreground">We work with a small number of teams each quarter on design system strategy, AI builder integration, and piecemeal migration plans. Engagement-based, not retainer-based. The work ends when the work is done.</p>
            <Row gap="sm" className="mt-2">
              <Button>Get in touch <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button variant="outline">Read the LinkedIn posts</Button>
            </Row>
          </Stack>
        </Stack>
      </AppShellMain>

      <AppShellFooter className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-8">
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
// • <NumberedPrinciple> — the "01 / 02 / 03" stacked principle rows
//   (large numeral + icon + title + body) are an editorial pattern
//   that will appear in any thought-leadership marketing surface.
//   Proposed: <NumberedPrinciple num icon title body />.
//
// • <PullQuote> — Quote icon + large serif-leaning paragraph +
//   attribution. The current implementation is a Stack with raw
//   Quote icon and a bigger paragraph; could be a primitive in its
//   own right when used twice. Proposed: <PullQuote attribution />.
//
// • <ComponentBadgeGrid> — the small "Sidebar / Toolbar / Modal..."
//   grid inside the showcase tab is a component-name pill list.
//   Could be primitive in its own right when paired with a link
//   target for each name (which a real home page would have).
