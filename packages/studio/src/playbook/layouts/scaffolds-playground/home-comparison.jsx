/**
 * @label       Home — comparison matrix (PM ammunition)
 * @description Feature matrix comparing gradeui to v0, Lovable, Bolt, Claude Design across the wedges. PM-flavoured, gives PMs ammunition for internal cases.
 * @tags        home landing marketing comparison matrix v0 lovable bolt claude-design wireframe
 * @notes       Generated 2026-05-28. The hero is the matrix table itself.
 *              Treats competitors fairly: yes/no/partial with one-line
 *              caveats. PMs read this and have everything they need to
 *              make a case for adoption to engineering and design.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row,
  Card, CardContent,
  Button, Badge,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Check, X, Minus,
} from "lucide-react";

const ROWS = [
  { feature: "Real integratable components", grade: "yes", v0: "partial", lovable: "no", bolt: "no", claude: "partial", note: "Most builders emit Tailwind soup; v0 ships shadcn primitives but stops at the starter layer." },
  { feature: "Five sizes per primitive", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "Built for the application, not the landing page." },
  { feature: "Multi-select first-class", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "shadcn does not ship this. Every builder downstream has the same gap." },
  { feature: "Data tables (TanStack-grade)", grade: "yes", v0: "no", lovable: "partial", bolt: "no", claude: "partial", note: "Sortable, filterable, virtualised, themed against tokens." },
  { feature: "Maps and 3D surfaces", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "MapLibre + Mapbox + Google adapters; three.js for 3D." },
  { feature: "Drag and drop", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "dnd-kit underneath. Single column or cross-container kanban." },
  { feature: "Rich text editor", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "TipTap. Toolbars on the size scale. Mentions and slash menus." },
  { feature: "Tokens as the contract", grade: "yes", v0: "partial", lovable: "partial", bolt: "no", claude: "partial", note: "CSS variables. Brand designer reskins without re-prompting." },
  { feature: "Figma file matching code", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "partial", note: "Slot-based Figma. Copy-to-Figma shipping soon." },
  { feature: "Wireframes first", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "Other builders ship polished demos that are impossible to iterate against." },
  { feature: "Grid view of screens", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "Defaults are positioning. Infinite canvas does not scale past 80 screens." },
  { feature: "Model agnostic (BYOT)", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "Claude, Gemini, Nano Banana, Imagen, OpenAI. Your keys, your choice." },
  { feature: "MCP server", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "Plugs into Cursor, Claude Code, Windsurf." },
  { feature: "MIT licensed, you own the code", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "Walk away anytime. The system you built keeps shipping." },
  { feature: "Piecemeal legacy migration", grade: "yes", v0: "no", lovable: "no", bolt: "no", claude: "no", note: "Install alongside existing stack. No big-bang rewrite." },
];

function Mark({ kind }) {
  if (kind === "yes") return <Check className="h-4 w-4 text-foreground" />;
  if (kind === "partial") return <Minus className="h-4 w-4 text-muted-foreground" />;
  return <X className="h-4 w-4 text-muted-foreground/40" />;
}

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
                <a href="#compare">Compare</a>
                <a href="#components">Components</a>
                <a href="#studio">Studio</a>
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
        <Stack gap="xl" className="py-20">
          <Stack gap="md" align="center" className="text-center max-w-3xl mx-auto">
            <Badge variant="outline">For PMs and design leads evaluating the field</Badge>
            <h1 className="text-5xl font-semibold tracking-tight">
              The feature matrix nobody is publishing.
            </h1>
            <p className="text-lg text-muted-foreground">
              Every AI builder has a marketing page. None of them tell you which features they actually ship. Here is the honest comparison across the things that matter when you have to integrate the output.
            </p>
            <Row gap="sm" className="mt-2">
              <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button size="lg" variant="outline">Talk to us about a migration plan</Button>
            </Row>
          </Stack>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px]">Capability</TableHead>
                    <TableHead className="text-center">GradeUI</TableHead>
                    <TableHead className="text-center">v0</TableHead>
                    <TableHead className="text-center">Lovable</TableHead>
                    <TableHead className="text-center">Bolt</TableHead>
                    <TableHead className="text-center">Claude Design</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROWS.map((r) => (
                    <TableRow key={r.feature}>
                      <TableCell>
                        <Stack gap="xs">
                          <span className="text-sm font-medium">{r.feature}</span>
                          <span className="text-xs text-muted-foreground">{r.note}</span>
                        </Stack>
                      </TableCell>
                      <TableCell className="text-center bg-muted/30"><Mark kind={r.grade} /></TableCell>
                      <TableCell className="text-center"><Mark kind={r.v0} /></TableCell>
                      <TableCell className="text-center"><Mark kind={r.lovable} /></TableCell>
                      <TableCell className="text-center"><Mark kind={r.bolt} /></TableCell>
                      <TableCell className="text-center"><Mark kind={r.claude} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Row gap="md" align="center" justify="center" className="text-xs text-muted-foreground flex-wrap">
            <Row gap="xs" align="center"><Check className="h-3 w-3" /><span>Yes</span></Row>
            <Row gap="xs" align="center"><Minus className="h-3 w-3" /><span>Partial</span></Row>
            <Row gap="xs" align="center"><X className="h-3 w-3" /><span>No</span></Row>
            <span>Last updated 2026-05-28. Open an issue if any of this is out of date.</span>
          </Row>
        </Stack>

        {/* The "what this means for your team" beat */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">What this means for your team</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Three honest reads of the matrix.</h2>
          </Stack>
          <Stack gap="lg">
            <Row gap="lg" className="border-t border-border pt-6">
              <span className="text-2xl font-semibold text-muted-foreground/40 w-12">01</span>
              <Stack gap="xs" className="flex-1 max-w-2xl">
                <h3 className="text-xl font-semibold">v0 is the closest competitor.</h3>
                <p className="text-muted-foreground">v0 ships shadcn primitives, which gets you a sidebar and a button. It stops at the starter layer. No size scale, no multi-select, no data table that scales past a demo, no Figma parity. Use it for landing pages. Move to gradeui when the application starts.</p>
              </Stack>
            </Row>
            <Row gap="lg" className="border-t border-border pt-6">
              <span className="text-2xl font-semibold text-muted-foreground/40 w-12">02</span>
              <Stack gap="xs" className="flex-1 max-w-2xl">
                <h3 className="text-xl font-semibold">Lovable and Bolt are great for v1, brutal for v2.</h3>
                <p className="text-muted-foreground">Vibe code in either, ship a working demo in a weekend, watch the migration cost compound the moment you need to integrate with the rest of the business. gradeui is the graduation path. Bring your screens, rebuild on the system, hand a real codebase to your team.</p>
              </Stack>
            </Row>
            <Row gap="lg" className="border-t border-border pt-6">
              <span className="text-2xl font-semibold text-muted-foreground/40 w-12">03</span>
              <Stack gap="xs" className="flex-1 max-w-2xl">
                <h3 className="text-xl font-semibold">Claude Design is the sharp future competitor.</h3>
                <p className="text-muted-foreground">Anthropic-built, likely canvas-first, deep model access. Our defence is depth: real components, hard primitives, density, two-way Figma parity, model-agnostic by design. Worth watching, not worth waiting for.</p>
              </Stack>
            </Row>
          </Stack>
        </Stack>

        {/* CTA close */}
        <Stack gap="md" align="center" className="py-20 border-t border-border text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Take the matrix into your next vendor meeting.</h2>
          <p className="text-muted-foreground max-w-xl">If your team is evaluating AI builders this quarter, this page is the briefing document. Share it. Open issues if any of it is out of date.</p>
          <Row gap="sm" className="mt-2">
            <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <Button size="lg" variant="outline">Talk to us</Button>
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
// • <ComparisonTable> — the matrix shape (rows = features, columns =
//   competitors, cells = yes/partial/no marks) is a recurring pattern
//   for any feature-comparison surface. The current implementation
//   leans on raw <Table> + a tiny <Mark> helper. Proposed:
//   <ComparisonTable columns rows highlightColumn />.
//
// • <Legend> — the small inline yes/partial/no legend row with the
//   "last updated" caveat. Tight primitive worth having for any data
//   visualisation embedded in a marketing page.
//
// • <NumberedPrinciple> — same pattern as home-system-statement.
//   Two scaffolds now use it; ready to graduate.
