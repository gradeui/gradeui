/**
 * @label       Home — primitives showcase (visual-led)
 * @description Primitives-as-hero. Above the fold: data table, map, kanban, TipTap mocks all visible. Less copy, more visual. For buyers asking "what does it do."
 * @tags        home landing marketing primitives showcase visual demo wireframe
 * @notes       Generated 2026-05-28. The hero IS the components themselves
 *              rendered (or hinted at) in a 2x2 grid: data table, map,
 *              kanban, TipTap. Used MediaSurface for the heavy primitives
 *              since playground scaffolds can't run live data tables; in
 *              production the home page renders the real things in iframes.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge,
  MediaSurface,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Database, Map as MapIcon, MoveVertical, FileText,
  Box, LayoutGrid, Image as ImageIcon,
} from "lucide-react";

const TABLE_ROWS = [
  { id: 1, name: "Acme Corp", owner: "Alex Chen", stage: "Negotiation", value: "$48,000" },
  { id: 2, name: "Northwind", owner: "Sam Lee", stage: "Discovery", value: "$12,500" },
  { id: 3, name: "Globex", owner: "Priya Singh", stage: "Closed won", value: "$92,300" },
  { id: 4, name: "Initech", owner: "Marcus Hill", stage: "Proposal", value: "$28,400" },
  { id: 5, name: "Stark Industries", owner: "Jess Park", stage: "Discovery", value: "$76,100" },
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
              <Button size="sm">Open Studio</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-6xl mx-auto px-6">

        {/* Compact hero — let the components do the talking */}
        <Stack gap="lg" className="py-16">
          <Stack gap="sm" align="center" className="text-center max-w-2xl mx-auto">
            <Badge variant="outline">Built from real components</Badge>
            <h1 className="text-4xl font-semibold tracking-tight">
              This is what the AI builds.
            </h1>
            <p className="text-muted-foreground">
              Not a screenshot. Not Tailwind soup. Real `<DataTable>`, real `<Map>`, real `<Sortable>`, real TipTap. Generate against them, theme them with tokens, ship them to your repo.
            </p>
          </Stack>

          {/* Four primitives, 2x2 grid above the fold */}
          <Grid cols="2" gap="md">
            {/* Data table */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <Row gap="sm" align="center" justify="between">
                  <Row gap="sm" align="center">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Data table</CardTitle>
                  </Row>
                  <Badge variant="outline" className="text-xs">TanStack</Badge>
                </Row>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TABLE_ROWS.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.owner}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.stage}</Badge></TableCell>
                        <TableCell className="text-right text-sm font-mono">{r.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <Row gap="sm" align="center" justify="between">
                  <Row gap="sm" align="center">
                    <MapIcon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Map</CardTitle>
                  </Row>
                  <Badge variant="outline" className="text-xs">MapLibre</Badge>
                </Row>
              </CardHeader>
              <CardContent className="p-0">
                <MediaSurface hint="map view with clustered markers across a city" alt="Map with markers" className="aspect-[16/10] w-full" />
              </CardContent>
            </Card>

            {/* Kanban / Sortable */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <Row gap="sm" align="center" justify="between">
                  <Row gap="sm" align="center">
                    <MoveVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Kanban</CardTitle>
                  </Row>
                  <Badge variant="outline" className="text-xs">dnd-kit</Badge>
                </Row>
              </CardHeader>
              <CardContent className="p-3">
                <Grid cols="3" gap="sm">
                  {["Backlog", "In progress", "Done"].map((col) => (
                    <Stack key={col} gap="xs" className="rounded-md bg-muted/40 p-2">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{col}</span>
                      <Card className="p-2"><span className="text-xs">Onboarding flow</span></Card>
                      <Card className="p-2"><span className="text-xs">Filter chips</span></Card>
                      {col === "Backlog" && <Card className="p-2"><span className="text-xs">Empty states</span></Card>}
                    </Stack>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* TipTap rich text */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <Row gap="sm" align="center" justify="between">
                  <Row gap="sm" align="center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Rich text editor</CardTitle>
                  </Row>
                  <Badge variant="outline" className="text-xs">TipTap</Badge>
                </Row>
              </CardHeader>
              <CardContent className="p-0">
                <Stack gap="xs">
                  <Row gap="xs" className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-bold">B</span>
                    <span className="italic">I</span>
                    <span className="underline">U</span>
                    <span>H1</span>
                    <span>H2</span>
                    <span>•</span>
                    <span>1.</span>
                    <span>"</span>
                  </Row>
                  <div className="p-3 text-sm space-y-1">
                    <h3 className="font-semibold">Meeting notes</h3>
                    <p className="text-muted-foreground">Reviewed the migration plan with the engineering team. Next steps include sidebar swap and token adoption on the dashboard page.</p>
                    <p className="text-muted-foreground">@alex to draft a one-pager by Friday.</p>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Row gap="sm" justify="center" className="mt-4">
            <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <Button size="lg" variant="outline">See all components</Button>
          </Row>
        </Stack>

        {/* Two more primitives — 3D and charts */}
        <Stack gap="xl" className="py-16 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">Plus the ones nobody else ships</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">3D, WebGL, charts, multi-select.</h2>
            <p className="text-muted-foreground">three.js surfaces for product viewers and scenes. recharts wired into the token system. MultiSelect first-class. Combobox. The components that recur in every real app.</p>
          </Stack>
          <Grid cols="2" gap="md">
            <Card>
              <CardHeader>
                <Row gap="sm" align="center"><Box className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">3D and WebGL</CardTitle></Row>
                <CardDescription>three.js surfaces for product viewers, scenes, ambient backgrounds. Tokens drive lighting and material colours.</CardDescription>
              </CardHeader>
              <CardContent>
                <MediaSurface hint="3D product viewer with a rotating model" alt="3D scene" className="aspect-video w-full rounded-md" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Row gap="sm" align="center"><LayoutGrid className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">Charts</CardTitle></Row>
                <CardDescription>recharts pre-stamped. Colours come from tokens so charts match the rest of the system without per-chart config.</CardDescription>
              </CardHeader>
              <CardContent>
                <MediaSurface hint="bar and line chart pair showing revenue trends" alt="Charts" className="aspect-video w-full rounded-md" />
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Real content fills */}
        <Stack gap="xl" className="py-16 border-t border-border">
          <Grid cols="2" gap="xl" className="items-center">
            <Stack gap="sm">
              <Badge variant="outline" className="w-fit">Real content, not placeholders</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Stop staring at grey rectangles.</h2>
              <p className="text-muted-foreground">One-click fill from album art, product photos, stock libraries, or generate against page context with any model you have a key for. The prototype starts looking like the app on the first click.</p>
              <Row gap="sm" align="center" className="mt-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" /><span>Album art, stock, generated, all from one button</span>
              </Row>
            </Stack>
            <MediaSurface hint="MediaSurface fill menu open with options for album art and generation" alt="Fill menu" className="aspect-video w-full rounded-md" />
          </Grid>
        </Stack>

        {/* CTA close */}
        <Stack gap="md" align="center" className="py-20 border-t border-border text-center">
          <h2 className="text-3xl font-semibold tracking-tight">See it in Studio.</h2>
          <p className="text-muted-foreground max-w-xl">Open the canvas, vibe a screen, watch the components fall into place. Free to start on gradeui.com or self-host the whole thing.</p>
          <Row gap="sm" className="mt-2">
            <Button size="lg">Try on gradeui.com <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <Button size="lg" variant="outline">Install and self-host</Button>
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
// • <ComponentShowcaseCard> — every card in the 2x2 grid has the
//   same shape: icon + title + library badge in the header, the
//   primitive itself in the body. Worth a dedicated primitive when
//   showcase-style sections recur. Proposed:
//   <ComponentShowcaseCard icon title library>{primitive}</...>.
//
// • <KanbanColumn> — the inline kanban hand-roll for the showcase
//   tile is a stand-in. Real Sortable.Group is in the allowlist but
//   too heavy for a static showcase. Worth a "kanban placeholder"
//   primitive that shares Sortable's visual chrome but is render-only.
//
// • <RichTextPlaceholder> — same shape for the TipTap tile: a
//   toolbar row + body. Could pair with a TipTap-styled chrome
//   wrapper that renders without instantiating the editor for
//   marketing pages.
