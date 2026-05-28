/**
 * @label       Home — docs-flavoured (developer landing)
 * @description Dev-doc aesthetic. Install command as hero, then usage examples in code blocks, components inline. For developers who want the install path immediately.
 * @tags        home landing marketing docs install developer wireframe
 * @notes       Generated 2026-05-28. Targets devs arriving from Hacker
 *              News, MCP discovery, or shadcn-adjacent communities. Less
 *              marketing chrome, more code-block authority. Hero is the
 *              install command rendered as if it were the first heading
 *              in a README.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Code,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Terminal, Copy, Package, Boxes, Sparkles, Code2,
} from "lucide-react";

const INSTALL_PNPM = `pnpm add @gradeui/ui`;
const INSTALL_NPM = `npm install @gradeui/ui`;
const INSTALL_YARN = `yarn add @gradeui/ui`;
const INSTALL_BUN = `bun add @gradeui/ui`;

const SIDEBAR_USAGE = `import { Sidebar, SidebarHeader, SidebarContent, SidebarItem } from "@gradeui/ui";
import { Inbox, FileText, Star } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>Workspace</SidebarHeader>
      <SidebarContent>
        <SidebarItem icon={<Inbox />}>Inbox</SidebarItem>
        <SidebarItem icon={<FileText />}>Drafts</SidebarItem>
        <SidebarItem icon={<Star />}>Starred</SidebarItem>
      </SidebarContent>
    </Sidebar>
  );
}`;

const DATATABLE_USAGE = `import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@gradeui/ui";

export function DealsTable({ data, columns }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <Table>
      <TableHeader>{/* headerGroups.map(...) */}</TableHeader>
      <TableBody>{/* rows.map(...) */}</TableBody>
    </Table>
  );
}`;

const MULTISELECT_USAGE = `import { MultiSelect } from "@gradeui/ui";

const options = [
  { value: "alex", label: "Alex Chen" },
  { value: "sam", label: "Sam Lee" },
  { value: "priya", label: "Priya Singh" },
];

export function AssigneeFilter({ value, onChange }) {
  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Filter by assignee"
      maxCount={3}
    />
  );
}`;

const MCP_INSTALL = `# In your Claude Code / Cursor / Windsurf settings
{
  "mcpServers": {
    "gradeui": {
      "command": "npx",
      "args": ["-y", "@gradeui/mcp-server"]
    }
  }
}`;

function CodeBlock({ language, children }) {
  // Thin wrapper: Card chrome + copy affordance. Token-coloured body
  // comes from the DS <Code> primitive so the palette inherits theme
  // tokens automatically (--gds-code-*). Previously rolled as a raw
  // <pre className="bg-background"> which read as flat grey and lost
  // every syntax distinction.
  return (
    <Card className="overflow-hidden">
      <Row justify="between" align="center" className="bg-muted/40 border-b border-border px-3 py-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{language}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
      </Row>
      <Code
        source={children}
        language={language === "bash" || language === "sh" ? "bash" : "tsx"}
        bare
        className="text-xs p-4"
      />
    </Card>
  );
}

export default function App() {
  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellHeader className="border-b border-border bg-background/80 backdrop-blur">
        <Toolbar size="md" className="max-w-5xl mx-auto px-6">
          <ToolbarSlot slot="leading">
            <Row gap="md" align="center">
              <Row gap="xs" align="center">
                <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center font-bold text-sm">G</div>
                <span className="font-semibold">GradeUI</span>
                <Badge variant="outline" className="ml-2 font-mono text-xs">v0.11.0</Badge>
              </Row>
              <Row gap="md" align="center" className="ml-6 text-sm text-muted-foreground font-mono">
                <a href="#docs">docs</a>
                <a href="#components">components</a>
                <a href="#mcp">mcp</a>
                <a href="#changelog">changelog</a>
              </Row>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Row gap="sm" align="center">
              <Button variant="ghost" size="sm"><Github className="h-4 w-4 mr-1" /><span className="font-mono text-xs">12.4k</span></Button>
              <Button size="sm" variant="outline">Open Studio</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-3xl mx-auto px-6">

        {/* Hero — install command as the heading */}
        <Stack gap="lg" className="py-16">
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">$ install</span>
            </Row>
            <h1 className="text-4xl font-semibold tracking-tight font-mono">
              @gradeui/ui
            </h1>
            <p className="text-muted-foreground">
              Real components for AI-generated apps. MIT licensed. TypeScript. Tailwind. CSS variables. Five sizes per primitive. Hard libraries curated (TanStack, MapLibre, dnd-kit, TipTap, three.js).
            </p>
          </Stack>

          <Tabs defaultValue="pnpm">
            <TabsList>
              <TabsTrigger value="pnpm">pnpm</TabsTrigger>
              <TabsTrigger value="npm">npm</TabsTrigger>
              <TabsTrigger value="yarn">yarn</TabsTrigger>
              <TabsTrigger value="bun">bun</TabsTrigger>
            </TabsList>
            <TabsContent value="pnpm" className="pt-2"><CodeBlock language="shell">{INSTALL_PNPM}</CodeBlock></TabsContent>
            <TabsContent value="npm" className="pt-2"><CodeBlock language="shell">{INSTALL_NPM}</CodeBlock></TabsContent>
            <TabsContent value="yarn" className="pt-2"><CodeBlock language="shell">{INSTALL_YARN}</CodeBlock></TabsContent>
            <TabsContent value="bun" className="pt-2"><CodeBlock language="shell">{INSTALL_BUN}</CodeBlock></TabsContent>
          </Tabs>

          <Row gap="sm">
            <Button>Read the docs <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <Button variant="outline"><Github className="h-4 w-4 mr-1" /> Source</Button>
          </Row>
        </Stack>

        {/* Quick examples */}
        <Stack gap="lg" className="py-12 border-t border-border">
          <Stack gap="sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">## quick examples</span>
            <h2 className="text-2xl font-semibold tracking-tight">Three things in three minutes.</h2>
          </Stack>

          <Stack gap="md">
            <Stack gap="sm">
              <h3 className="text-base font-semibold">A sidebar</h3>
              <p className="text-sm text-muted-foreground">Compound API. No `data-` props to remember. The shadcn equivalent is three hundred lines.</p>
              <CodeBlock language="tsx">{SIDEBAR_USAGE}</CodeBlock>
            </Stack>

            <Stack gap="sm">
              <h3 className="text-base font-semibold">A data table</h3>
              <p className="text-sm text-muted-foreground">Headless TanStack underneath plus our Table primitives for chrome. Sort, filter, virtualise, resize.</p>
              <CodeBlock language="tsx">{DATATABLE_USAGE}</CodeBlock>
            </Stack>

            <Stack gap="sm">
              <h3 className="text-base font-semibold">Multi-select</h3>
              <p className="text-sm text-muted-foreground">First-class. The thing shadcn does not ship. Chips inside the trigger, "+N more" past `maxCount`.</p>
              <CodeBlock language="tsx">{MULTISELECT_USAGE}</CodeBlock>
            </Stack>
          </Stack>
        </Stack>

        {/* MCP */}
        <Stack gap="lg" className="py-12 border-t border-border">
          <Stack gap="sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">## mcp</span>
            <h2 className="text-2xl font-semibold tracking-tight">Plug into your agent.</h2>
            <p className="text-muted-foreground">The MCP server brings the gradeui primitives, skills, and playbook directly to Cursor, Claude Code, Windsurf, or any MCP-aware tool. The model stops inventing components.</p>
          </Stack>
          <CodeBlock language="json">{MCP_INSTALL}</CodeBlock>
        </Stack>

        {/* What you get */}
        <Stack gap="lg" className="py-12 border-t border-border">
          <Stack gap="sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">## what's in the box</span>
            <h2 className="text-2xl font-semibold tracking-tight">The component list.</h2>
          </Stack>
          <Grid cols="3" gap="sm">
            {["Sidebar", "Toolbar", "Modal", "Toggle", "MultiSelect", "Combobox", "DataTable", "Map", "Sortable", "TipTap", "MediaSurface", "Avatar", "Tabs", "DatePicker", "Carousel", "ThreeScene", "Charts", "Breadcrumb"].map((c) => (
              <Card key={c}><CardContent className="p-3 font-mono text-sm text-muted-foreground">{c}</CardContent></Card>
            ))}
          </Grid>
        </Stack>

        {/* Routes */}
        <Stack gap="lg" className="py-12 border-t border-border">
          <Stack gap="sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">## or use the canvas</span>
            <h2 className="text-2xl font-semibold tracking-tight">If you'd rather not start from a file.</h2>
          </Stack>
          <Grid cols="3" gap="md">
            <Card>
              <CardHeader>
                <Package className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Install</CardTitle>
                <CardDescription>The free library, your codebase, your decisions.</CardDescription>
              </CardHeader>
              <CardFooter><Button variant="outline" className="w-full" size="sm">Read docs</Button></CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">gradeui.com</CardTitle>
                <CardDescription>Hosted Studio. Free tier or paid. No infrastructure setup.</CardDescription>
              </CardHeader>
              <CardFooter><Button className="w-full" size="sm">Try hosted</Button></CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Boxes className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Self-host</CardTitle>
                <CardDescription>Run Studio on your own infra. MIT, BYOT, free forever.</CardDescription>
              </CardHeader>
              <CardFooter><Button variant="outline" className="w-full" size="sm">Self-host guide</Button></CardFooter>
            </Card>
          </Grid>
        </Stack>
      </AppShellMain>

      <AppShellFooter className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Row justify="between" align="center">
            <Row gap="xs" align="center">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">ali@gradeui.com — MIT licensed</span>
            </Row>
            <Row gap="md" className="text-xs text-muted-foreground font-mono">
              <a href="#changelog">changelog</a>
              <a href="#privacy">privacy</a>
              <a href="#github">github</a>
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
// • <CodeBlock> — used five times in this scaffold (install x4 via
//   the tabs + three usage examples + MCP config). Was already
//   flagged in home-diff-hero. Definitely ready to graduate.
//   Proposed: <CodeBlock language copyable maxHeight />.
//
// • <InstallTabs> — the pnpm/npm/yarn/bun tab strip is canonical for
//   any developer-facing landing or docs page. Could be a thin
//   wrapper around Tabs + CodeBlock that takes a packageName prop.
//
// • <SectionAnchor> — the "## quick examples" / "## mcp" markdown-
//   styled section headers (eyebrow eyebrow + h2) are the dev-doc
//   pattern. Could be a tight primitive.
//
// • <ComponentBadgeGrid> — appears here and in home-system-statement.
//   Two scaffolds = graduate.
