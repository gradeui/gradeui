/**
 * @label       Home — diff hero (dev voice)
 * @description Dev-flavoured home page led by the v0-vs-gradeui code diff. Trust bar, hard primitives, density, install CTAs. Wireframe foundation.
 * @tags        home landing marketing diff hero developer v0 shadcn wireframe
 * @notes       Generated 2026-05-28 from POSITIONING.md + COPY.md. Wireframe
 *              quality: structure first, fidelity later. The diff cards now
 *              use the `<Code>` primitive (token highlighting, line numbers,
 *              optional diff bgs) instead of raw `<pre>` placeholders. The
 *              visual hero of this concept IS the diff — every section
 *              below it lives or dies by whether the diff lands in the
 *              first viewport.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Code,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Package, Sparkles, Boxes,
  Database, Map, MoveVertical, FileText,
} from "lucide-react";

const v0Code = `<div className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-gray-100 flex flex-col">
  <div className="px-4 py-5 border-b border-gray-800 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-md bg-blue-600 ...">
        <svg className="h-4 w-4" ... />
      </div>
      <span className="text-sm font-semibold">Workspace</span>
    </div>
    <button className="h-7 w-7 rounded hover:bg-gray-800 ...">
      <svg className="h-3.5 w-3.5" ... />
    </button>
  </div>
  <nav className="flex-1 px-2 py-3 overflow-auto">
    <a className="flex items-center gap-2 px-2 py-1.5 ...">
      <svg className="h-4 w-4" ... />
      <span>Inbox</span>
    </a>
    ... 240 more lines ...
  </nav>
</div>`;

const gradeCode = `<Sidebar>
  <SidebarHeader>Workspace</SidebarHeader>
  <SidebarContent>
    <SidebarItem icon={<Inbox />}>Inbox</SidebarItem>
    <SidebarItem icon={<FileText />}>Drafts</SidebarItem>
  </SidebarContent>
</Sidebar>`;

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
                <a href="#components">Components</a>
                <a href="#studio">Studio</a>
                <a href="#docs">Docs</a>
                <a href="#pricing">Pricing</a>
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
        {/* Hero — the diff IS the hero asset */}
        <Stack gap="xl" className="py-20">
          <Stack gap="md" align="center" className="text-center max-w-3xl mx-auto">
            <Badge variant="outline">For teams shipping real software</Badge>
            <h1 className="text-5xl font-semibold tracking-tight">
              Open the markup.<br />Tell me which one you would merge.
            </h1>
            <p className="text-lg text-muted-foreground">
              GradeUI is the only AI builder that produces code you would actually integrate. Real components. Real tokens. Real density. Bring your own key.
            </p>
            <Row gap="sm" className="mt-2">
              <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button size="lg" variant="outline">Install the library</Button>
            </Row>
          </Stack>

          <Grid cols="2" gap="md" className="mt-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/40 border-b border-border">
                <Row justify="between" align="center">
                  <CardTitle className="text-sm font-medium">v0 — a sidebar</CardTitle>
                  <Badge variant="outline" className="text-xs">~300 lines</Badge>
                </Row>
              </CardHeader>
              <CardContent className="p-0">
                <Code
                  source={v0Code}
                  language="tsx"
                  bare
                  reveal="lines"
                  trigger="inView"
                  stagger={20}
                  className="text-[11px] max-h-80 overflow-auto p-4"
                />
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-foreground/20 ring-2 ring-foreground/5">
              <CardHeader className="bg-muted/40 border-b border-border">
                <Row justify="between" align="center">
                  <CardTitle className="text-sm font-medium">GradeUI — a sidebar</CardTitle>
                  <Badge className="text-xs">6 lines</Badge>
                </Row>
              </CardHeader>
              <CardContent className="p-0">
                <Code
                  source={gradeCode}
                  language="tsx"
                  bare
                  reveal="lines"
                  trigger="inView"
                  stagger={60}
                  delay={400}
                  className="text-[11px] max-h-80 overflow-auto p-4"
                />
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Trust bar */}
        <Stack gap="sm" align="center" className="py-10 border-y border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Plugs into everything you already use</span>
          <Row gap="xl" align="center" className="text-muted-foreground/70 text-sm font-medium">
            <span>Anthropic</span><span>Google</span><span>OpenAI</span><span>Nano Banana</span><span>Imagen</span><span>MCP</span>
          </Row>
        </Stack>

        {/* Hard primitives */}
        <Stack gap="xl" className="py-20">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">The hard primitives</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">The components no AI builder ships.</h2>
            <p className="text-muted-foreground">TanStack data tables, MapLibre maps, dnd-kit drag and drop, TipTap rich text, three.js surfaces. The libraries every serious frontend team eventually adopts, curated and themed against the same token system. Multi-select included.</p>
          </Stack>
          <Grid cols="2" gap="md">
            {[
              { icon: Database, title: "Data tables", desc: "Sorting, filtering, virtualisation, column resizing. TanStack underneath, themed against your tokens." },
              { icon: Map, title: "Maps", desc: "MapLibre by default, Mapbox or Google adapters. Markers, clustering, list-to-map sync built in." },
              { icon: MoveVertical, title: "Drag and drop", desc: "dnd-kit underneath. Single column reorder or cross-container kanban groups." },
              { icon: FileText, title: "Rich text", desc: "TipTap, the de facto editor. Toolbars wired to the size scale, mentions, slash menus." },
            ].map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <Row gap="sm" align="center">
                    <f.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </Row>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* Density story */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Five sizes per primitive</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Dense to marketing, one prop change.</h2>
            <p className="text-muted-foreground">Built for the application, not the landing page. The screens your team actually ships have density requirements no demo aesthetic can hit.</p>
          </Stack>
          <Card>
            <CardContent className="p-8">
              <Stack gap="md">
                <Row gap="sm" align="end">
                  <Button size="sm">xs</Button>
                  <Button size="sm">sm</Button>
                  <Button>md</Button>
                  <Button size="lg">lg</Button>
                  <Button size="lg">xl</Button>
                </Row>
                <span className="text-xs text-muted-foreground">All from the same Button primitive. Same applies to inputs, selects, toggles, modals.</span>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Install CTAs */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-semibold tracking-tight">Three ways in. Same system.</h2>
          </Stack>
          <Grid cols="3" gap="md">
            {[
              { icon: Package, title: "The free library", desc: "@gradeui/ui installs into any React project. MIT licensed. The foundation everything else sits on top of.", cta: "Install", variant: "outline" },
              { icon: Sparkles, title: "Studio", desc: "The canvas. Free to use, bring your own key. A Google key (free tier on their API) runs at zero cost.", cta: "Open Studio", variant: "default" },
              { icon: Boxes, title: "The MCP server", desc: "Install in Cursor, Claude Code, Windsurf. Brings the primitives, skills, and playbook to your model of choice.", cta: "Get the MCP", variant: "outline" },
            ].map((c) => (
              <Card key={c.title}>
                <CardHeader>
                  <c.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>{c.title}</CardTitle>
                  <CardDescription>{c.desc}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant={c.variant} className="w-full">{c.cta}</Button>
                </CardFooter>
              </Card>
            ))}
          </Grid>
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
// • <CodePanel> — the diff hero's left/right panels follow a pattern
//   that will recur in any developer-facing marketing surface: card
//   with a label header, a line-count badge, and a syntax-styled
//   <pre><code>. Worth folding into a primitive when the second
//   scaffold needs it. Proposed:
//   <CodePanel title language lineCount tone="default|emphasised">.
//
// • <LogoStripe> — the trust bar with eyebrow text and a row of
//   tonally-flat brand names. Single-line, wrap, and centred variants
//   will keep recurring across home pages and trust sections.
//   Proposed: <LogoStripe eyebrow items layout="single|wrap">.
//
// • <FeatureCard> — the icon + title + one-line description card used
//   in the hard-primitives grid and again in the install grid. Could
//   fold into <Card variant="feature" icon> to keep chrome minimal.
