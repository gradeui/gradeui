/**
 * @label       Home — main landing page
 * @description The overarching gradeui home page. Every wedge from the positioning doc in one comprehensive scroll. Wireframe foundation to iterate from.
 * @tags        home landing main gradeui marketing wireframe overarching
 * @notes       Generated 2026-05-28 from POSITIONING.md + COPY.md. This is
 *              the single comprehensive landing page. Combines: hero,
 *              trust bar, diff, hard primitives, density, Figma parity,
 *              tokens, fidelity ladder, real content, team surface,
 *              migration, full trust block, install routes, consultancy.
 *              Wireframe quality so you can rearrange and design over
 *              the top. The angle-specific scaffolds (home-diff-hero,
 *              home-vibe-to-live, home-free-any-ai, home-migration-story,
 *              home-system-statement) remain as individual landing-page
 *              experiments and can be linked from this main page.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Code,
  MediaSurface,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Package, Sparkles, Boxes,
  Database, Map as MapIcon, MoveVertical, FileText, Box,
  Wand2, Palette, Code2, GitBranch, Image as ImageIcon,
  LayoutGrid, ShieldCheck, Layers3, Quote,
} from "lucide-react";

const v0Code = `<div className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-gray-100 flex flex-col">
  <div className="px-4 py-5 border-b border-gray-800 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-md bg-blue-600 ...">...</div>
      <span className="text-sm font-semibold">Workspace</span>
    </div>
    <button className="h-7 w-7 rounded hover:bg-gray-800 ...">...</button>
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

const PROVIDERS = [
  { tier: "Models", items: ["Anthropic", "Google", "OpenAI", "Nano Banana", "Imagen"] },
  { tier: "Libraries", items: ["TanStack", "MapLibre", "dnd-kit", "TipTap", "three.js", "recharts"] },
  { tier: "Content", items: ["Unsplash", "Spotify", "Generated"] },
  { tier: "Standards", items: ["MCP", "React", "Tailwind", "Figma"] },
];

const HARD_PRIMITIVES = [
  { icon: Database, title: "Data tables", desc: "TanStack underneath. Sort, filter, virtualise, resize. Themed against your tokens." },
  { icon: MapIcon, title: "Maps", desc: "MapLibre default, Mapbox or Google adapters. Markers, clustering, list-to-map sync." },
  { icon: MoveVertical, title: "Drag and drop", desc: "dnd-kit underneath. Single column reorder or cross-container kanban groups." },
  { icon: FileText, title: "Rich text", desc: "TipTap, the de facto editor. Toolbars on the size scale, mentions, slash menus." },
  { icon: Box, title: "3D and WebGL", desc: "three.js surfaces. Scenes, product viewers, ambient backgrounds, all token-aware." },
  { icon: LayoutGrid, title: "Charts", desc: "recharts pre-stamped. Tokens drive colours so charts match the rest of the system." },
];

const INSTALL_ROUTES = [
  { icon: Package, title: "The free library", desc: "@gradeui/ui installs into any React project. MIT licensed. The foundation everything else sits on top of.", cta: "Install", variant: "outline" },
  { icon: Sparkles, title: "Studio", desc: "The canvas. Free to use, bring your own key. A Google key runs at zero cost on their free tier; OpenAI and Anthropic keys cover paid providers. Team plans add the collaboration surface.", cta: "Open Studio", variant: "default" },
  { icon: Boxes, title: "The MCP server", desc: "Install in Cursor, Claude Code, Windsurf. Brings the primitives, skills, and playbook to your model of choice.", cta: "Get the MCP", variant: "outline" },
];

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

      <AppShellMain className="max-w-6xl mx-auto px-6">

        {/* Hero — vibe-to-live arc framing */}
        <Stack gap="xl" className="py-24">
          <Stack gap="md" align="center" className="text-center max-w-3xl mx-auto">
            <Badge variant="outline">One free platform. Any AI.</Badge>
            <h1 className="text-5xl font-semibold tracking-tight leading-tight">
              Vibe code anywhere.<br />Ship live code with gradeui.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              The AI app builder for teams that ship real software. Real components, real density, real primitives, a Figma file that matches the code. Bring your key. Unlock the box.
            </p>
            <Row gap="sm" className="mt-2">
              <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button size="lg" variant="outline">Install the library</Button>
            </Row>
            <Row gap="md" align="center" className="mt-2 text-xs text-muted-foreground flex-wrap justify-center">
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>MIT licensed</span></Row>
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>BYOT — Google's API is free</span></Row>
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>You own the code</span></Row>
              <Row gap="xs" align="center"><ShieldCheck className="h-3 w-3" /><span>No lock-in</span></Row>
            </Row>
          </Stack>

          <Grid cols="3" gap="md" className="mt-8">
            {[
              { icon: Wand2, label: "1. Vibe in Studio", caption: "Sketch the screen. Let the model fill it in. Wireframe first.", hint: "studio canvas mid-vibe" },
              { icon: Palette, label: "2. Polish on the system", caption: "Real components emerge. Tokens apply. Annotate, prompt, refine.", hint: "polished screen with tokens applied" },
              { icon: Code2, label: "3. Ship live code", caption: "Push to your repo, CodeSandbox, or Figma. Components survive.", hint: "IDE with Sidebar and DataTable imports" },
            ].map((p, i) => (
              <Card key={p.label} className={i === 1 ? "ring-2 ring-foreground/10" : ""}>
                <CardContent className="p-4">
                  <Stack gap="sm">
                    <MediaSurface hint={p.hint} alt={p.label} className="aspect-video w-full rounded-md" />
                    <Row gap="xs" align="center">
                      <p.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.label}</span>
                    </Row>
                    <span className="text-sm">{p.caption}</span>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* Compact trust bar */}
        <Stack gap="sm" align="center" className="py-10 border-y border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Plugs into everything you already use</span>
          <Row gap="xl" align="center" className="text-muted-foreground/70 text-sm font-medium flex-wrap justify-center">
            <span>Anthropic</span><span>Google</span><span>OpenAI</span><span>Nano Banana</span><span>Imagen</span><span>MCP</span>
          </Row>
        </Stack>

        {/* The diff */}
        <Stack gap="xl" className="py-20">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Real components</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Open the markup. Tell me which one you would merge.</h2>
            <p className="text-muted-foreground">v0 ships a sidebar. So does shadcn. But shadcn is a starter layer: one button size, no multi-select, no data table that survives past a demo. GradeUI is the system that comes after the starter.</p>
          </Stack>
          <Grid cols="2" gap="md">
            <Card surface="glass" className="overflow-hidden shadow-elevation-4">
              <CardHeader className="border-b border-border/60">
                <Row justify="between" align="center">
                  <CardTitle className="text-sm font-medium">v0 — a sidebar</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">~300 lines</Badge>
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
                  className="text-xs max-h-72 overflow-auto p-4"
                />
              </CardContent>
            </Card>
            <Card surface="glass" className="overflow-hidden shadow-elevation-4 gds-aura-ring">
              <CardHeader className="border-b border-border/60">
                <Row justify="between" align="center">
                  <CardTitle className="text-sm font-medium">GradeUI — a sidebar</CardTitle>
                  <Badge variant="success-soft" className="font-mono text-xs">6 lines</Badge>
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
                  className="text-xs max-h-72 overflow-auto p-4"
                />
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Hard primitives */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">The hard primitives</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">The components no AI builder ships.</h2>
            <p className="text-muted-foreground">TanStack data tables, MapLibre maps, dnd-kit drag and drop, TipTap rich text, three.js surfaces. The libraries every serious team eventually adopts, curated and themed against the same token system. Multi-select and combobox first-class.</p>
          </Stack>
          <Grid cols="3" gap="md">
            {HARD_PRIMITIVES.map((f) => (
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

        {/* Density */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Grid cols="2" gap="xl" className="items-center">
            <Stack gap="sm">
              <Badge variant="outline" className="w-fit">Five sizes per primitive</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Dense to marketing, one prop change.</h2>
              <p className="text-muted-foreground">Built for the application, not the landing page. xs for ops dashboards, sm for compact product UI, md for default, lg for generous moments, xl for marketing onboarding. Same primitive across button, input, select, toggle, modal.</p>
            </Stack>
            <Card>
              <CardContent className="p-6">
                <Stack gap="md">
                  <Row gap="sm" align="end">
                    <Button size="sm">xs</Button>
                    <Button size="sm">sm</Button>
                    <Button>md</Button>
                    <Button size="lg">lg</Button>
                    <Button size="lg">xl</Button>
                  </Row>
                  <span className="text-xs text-muted-foreground">All from the same Button primitive.</span>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Figma parity */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Figma parity, both directions</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Designers and developers build on the same substrate.</h2>
            <p className="text-muted-foreground">A slot-based Figma file with primitive names that match the code. Copy to Figma takes a layout straight out of Studio with components intact (shipping soon). The agent makes a screen. The designer refines it on the same primitives. The developer builds from the same primitives. Three roles, one substrate.</p>
          </Stack>
          <Grid cols="2" gap="md">
            <MediaSurface hint="figma artboard with sidebar component, slots labelled" alt="Figma side" className="aspect-video w-full rounded-md" />
            <MediaSurface hint="same component in code, slot names matching" alt="Code side" className="aspect-video w-full rounded-md" />
          </Grid>
        </Stack>

        {/* Tokens */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Tokens as the contract</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Reskin everything with a token edit.</h2>
            <p className="text-muted-foreground">CSS variables are the public surface area. A brand designer changes a token and the entire output reskins. No regenerate, no re-prompt. The part of the stack that survives the next AI cycle.</p>
          </Stack>
          <Grid cols="3" gap="md">
            {["Warm brand", "Cool tech", "High contrast"].map((label) => (
              <Card key={label}>
                <CardContent className="p-3">
                  <Stack gap="xs">
                    <MediaSurface hint={`same UI rendered with the ${label.toLowerCase()} token set`} alt={label} className="aspect-video w-full rounded-sm" />
                    <span className="text-xs text-center text-muted-foreground">{label}</span>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* Wireframes first / fidelity ladder */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Wireframes first</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Raise fidelity on your terms.</h2>
            <p className="text-muted-foreground">Every other AI builder hands you a polished demo on the first prompt. That is why iteration is painful. GradeUI starts at the wireframe. Lock the structure, then raise fidelity on three independent axes: content, imagery, visual polish.</p>
          </Stack>
          <Grid cols="4" gap="sm">
            {["Wireframe", "Real labels", "Real data", "Brand polish"].map((label) => (
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

        {/* Real content */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Grid cols="2" gap="xl" className="items-center">
            <Stack gap="sm">
              <Badge variant="outline" className="w-fit">Real content, not placeholders</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Stop staring at grey rectangles.</h2>
              <p className="text-muted-foreground">One-click fill from album art, product photos, stock libraries, or generate against page context with Nano Banana, Imagen, OpenAI, or any model you have a key for. The prototype starts looking like the app on the first click.</p>
              <Stack gap="xs" className="mt-2">
                <Row gap="sm" align="center"><ImageIcon className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Album art, stock, generated, all from one button</span></Row>
                <Row gap="sm" align="center"><Sparkles className="h-4 w-4 text-muted-foreground" /><span className="text-sm">BYOT for any provider — Google's API has a free tier</span></Row>
              </Stack>
            </Stack>
            <MediaSurface hint="MediaSurface fill menu open with album art and generate options" alt="Fill menu" className="aspect-video w-full rounded-md" />
          </Grid>
        </Stack>

        {/* Team surface */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Built for teams</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">An infinite canvas does not scale. A grid view does.</h2>
            <p className="text-muted-foreground">Multiple projects, permissions, team comments, prototype links. Studio defaults to a grid view of screens. Find it, open it, ship it. The infinite canvas is one click away when you want it.</p>
          </Stack>
          <MediaSurface hint="grid view of project screens with thumbnails, comment badges, last-edited stamps" alt="Studio grid view" className="aspect-[2/1] w-full rounded-md" />
        </Stack>

        {/* Migration */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Migrate, do not rewrite</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Replace your legacy UI piece by piece.</h2>
            <p className="text-muted-foreground">Install the library alongside whatever your team ships today. Replace the sidebar this sprint. Adopt the token system on the page being touched anyway. Every refactor graduates a screen onto the system. The migration becomes the work the team was already doing, channelled.</p>
          </Stack>
          <Grid cols="3" gap="md">
            {[
              { stage: "Before", caption: "Legacy UI. Dated. Inconsistent. The thing the team is afraid to touch." },
              { stage: "During", caption: "Some screens migrated, some legacy. Both shipping. The team is moving." },
              { stage: "After", caption: "Fully migrated. Modernised. Recognisably the same product." },
            ].map((s, i) => (
              <Card key={s.stage} className={i === 2 ? "ring-2 ring-foreground/10" : ""}>
                <CardContent className="p-4">
                  <Stack gap="sm">
                    <MediaSurface hint={`${s.stage.toLowerCase()} state of a legacy product UI`} alt={s.stage} className="aspect-video w-full rounded-md" />
                    <Badge variant="outline" className="w-fit text-xs">{i + 1}. {s.stage}</Badge>
                    <span className="text-sm text-muted-foreground">{s.caption}</span>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
          <Row gap="sm" justify="center" className="mt-2">
            <Button>Talk to us about a migration plan <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Row>
        </Stack>

        {/* Full trust block */}
        <Stack gap="lg" className="py-20 border-t border-border">
          <Stack gap="sm" align="center" className="text-center max-w-2xl mx-auto">
            <Badge variant="outline">Plugs into everything</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Model agnostic. Library curated. Standards friendly.</h2>
            <p className="text-muted-foreground">Bring your own key for every provider. A Google key runs on their free tier at zero cost; OpenAI and Anthropic keys cover the paid providers. Swap per task. The system is the asset. Models are interchangeable parts.</p>
          </Stack>
          <Stack gap="md">
            {PROVIDERS.map((row) => (
              <Row key={row.tier} gap="xl" align="center" justify="center" className="flex-wrap">
                <span className="text-xs uppercase tracking-wider text-muted-foreground w-24 text-right">{row.tier}</span>
                <Row gap="lg" align="center" className="flex-wrap">
                  {row.items.map((item) => (
                    <span key={item} className="text-sm font-medium text-muted-foreground/80">{item}</span>
                  ))}
                </Row>
              </Row>
            ))}
          </Stack>
        </Stack>

        {/* How it ships */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" align="center" className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-semibold tracking-tight">Three ways in. Same system.</h2>
          </Stack>
          <Grid cols="3" gap="md">
            {INSTALL_ROUTES.map((c) => (
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

        {/* Pull quote */}
        <Stack gap="md" className="py-16 border-t border-border max-w-3xl mx-auto">
          <Quote className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-2xl font-medium leading-snug">
            Get tokens, real components, and Figma parity right and AI becomes a multiplier on your design system. Get them wrong and AI becomes its accelerated death.
          </p>
          <span className="text-sm text-muted-foreground">Ali Driver, GradeUI</span>
        </Stack>

        {/* About / consultancy bridge */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Grid cols="2" gap="xl" className="items-start">
            <Stack gap="sm">
              <Badge variant="outline" className="w-fit">Behind the system</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Built by Ali Driver and the gradeui team.</h2>
              <p className="text-muted-foreground">We help product teams build design systems that survive the AI era: real tokens, real components, real Figma parity, and a workflow that lets AI builders feed into the system rather than break it.</p>
              <p className="text-muted-foreground">We work with a small number of teams each quarter. Engagement-based, not retainer-based. The work ends when the work is done.</p>
            </Stack>
            <Card>
              <CardContent className="p-6">
                <Stack gap="md">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Consultancy services</span>
                  <Stack gap="sm">
                    <Row gap="sm" align="start"><Layers3 className="h-4 w-4 text-muted-foreground mt-0.5" /><Stack gap="xs"><span className="text-sm font-medium">Design system strategy</span><span className="text-xs text-muted-foreground">For teams about to scale.</span></Stack></Row>
                    <Row gap="sm" align="start"><GitBranch className="h-4 w-4 text-muted-foreground mt-0.5" /><Stack gap="xs"><span className="text-sm font-medium">AI builder integration</span><span className="text-xs text-muted-foreground">For teams whose generated output is fighting their system.</span></Stack></Row>
                    <Row gap="sm" align="start"><Boxes className="h-4 w-4 text-muted-foreground mt-0.5" /><Stack gap="xs"><span className="text-sm font-medium">Migration plans</span><span className="text-xs text-muted-foreground">For teams sitting on legacy UI.</span></Stack></Row>
                  </Stack>
                  <Row gap="sm" className="mt-2">
                    <Button variant="outline" className="flex-1">Email</Button>
                    <Button className="flex-1">Book a call <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  </Row>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Closing pitch */}
        <Stack gap="md" align="center" className="py-20 border-t border-border text-center">
          <h2 className="text-4xl font-semibold tracking-tight">Bring your key. Unlock the box.</h2>
          <p className="text-muted-foreground max-w-xl">One free platform. Any AI. Real components, real density, real primitives, real content. Vibe code in Studio. Ship live code to your team.</p>
          <Row gap="sm" className="mt-2">
            <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <Button size="lg" variant="outline">Install the library</Button>
          </Row>
        </Stack>
      </AppShellMain>

      <AppShellFooter className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Row justify="between" align="center" className="flex-wrap gap-4">
            <Stack gap="xs">
              <Row gap="xs" align="center">
                <div className="h-5 w-5 rounded bg-foreground text-background grid place-items-center font-bold text-xs">G</div>
                <span className="font-semibold text-sm">GradeUI</span>
              </Row>
              <span className="text-xs text-muted-foreground">By Ali Driver. ali@gradeui.com.</span>
            </Stack>
            <Row gap="md" className="text-sm text-muted-foreground flex-wrap">
              <a href="#components">Components</a>
              <a href="#studio">Studio</a>
              <a href="#docs">Docs</a>
              <a href="#mcp">MCP</a>
              <a href="#consultancy">Consultancy</a>
              <a href="#github">GitHub</a>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
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
// Same gap candidates from the angle-specific scaffolds all show up
// here, which is the strongest possible signal that they should
// graduate into @gradeui/ui:
//
// • <CodePanel> — the diff panel shape (header with label + line
//   count badge, syntax-styled <pre>) recurs across home pages.
//
// • <LogoStripe> AND <LogoStripe variant="multi-tier"> — both the
//   compact under-hero trust bar and the four-tier "Models /
//   Libraries / Content / Standards" block are reused exactly.
//
// • <SequenceStep> — the hero arc, the fidelity ladder, and the
//   migration before/during/after triptych all follow the same
//   image + label + caption pattern. One primitive covers all three.
//
// • <FeatureCard> — icon + title + one-line description card,
//   reused in the hard primitives grid and the install routes.
//   <Card variant="feature" icon> covers it.
//
// • <PullQuote attribution> — used here and in
//   home-system-statement. Two scaffolds = graduate.
//
// • <FeatureChecklist> — the inline "MIT licensed / Free for
//   commercial use / You own the code / No lock-in" row under the
//   hero, and the "Album art / BYOT for paid providers" stack in
//   the real-content section, are the same shape. Tight primitive.
//
// • <ConsultancyCTA> — the contact card in the about section is the
//   conversion surface and appears verbatim in home-migration-story.
//
// Nothing in this scaffold was a one-off pattern. Everything that
// felt like a primitive WAS one in a sibling scaffold. The roadmap
// is clear: ship CodePanel, LogoStripe, SequenceStep, and a Card
// feature variant first; the rest follow.
