import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import {
  AppShell,
  AppShellHeader,
  AppShellNav,
  AppShellAside,
  AppShellMain,
  AppShellFooter,
} from "@/components/ui/app-shell";
import { Stack } from "@/components/ui/stack";
import { Row } from "@/components/ui/row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const appShellProps = [
  {
    name: "nav",
    type: '"none" | "top" | "side" | "three-pane"',
    default: '"none"',
    description:
      "Layout structure. `top` puts an in-app nav row above main, `side` to the left, `three-pane` adds a fixed Aside column between Nav and Main, `none` hides nav entirely. Header and Footer always span full width regardless.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render as the single child element via Radix Slot — stamp the shell layout onto an existing root tag without an extra wrapper div.",
  },
  {
    name: "className",
    type: "string",
    default: "—",
    description: "Extra classes merged onto the root element.",
  },
];

const appShellHeaderProps = [
  {
    name: "sticky",
    type: "boolean",
    default: "false",
    description:
      "When true, the header sticks to the viewport top on scroll. Off by default — opt-in because marketing pages often prefer the header to scroll away.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as the child element via Radix Slot.",
  },
];

const appShellNavProps = [
  {
    name: "placement",
    type: '"none" | "top" | "side"',
    default: '"top"',
    description:
      "Should match the parent AppShell's `nav` prop — controls border side and sticky axis. For `nav=\"three-pane\"`, use `placement=\"side\"`.",
  },
  {
    name: "sticky",
    type: "boolean",
    default: "true",
    description:
      "When true, top nav sticks to the viewport top and side nav sticks with full-height self-scroll.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as the child element via Radix Slot.",
  },
];

const appShellAsideProps = [
  {
    name: "sticky",
    type: "boolean",
    default: "false",
    description:
      "When true, Aside sticks to the viewport top with `h-screen` and self-scrolls — useful when the list is long.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as the child element via Radix Slot.",
  },
];

const appShellMainProps = [
  {
    name: "maxWidth",
    type: '"full" | "container"',
    default: '"full"',
    description:
      "`container` caps main at `max-w-7xl` with responsive padding — useful for marketing/docs pages. `full` leaves width unconstrained for dashboard layouts that want to fill the pane.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as the child element via Radix Slot.",
  },
];

const appShellFooterProps = [
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as the child element via Radix Slot.",
  },
];

// Shared shrunken-preview classes — AppShell defaults to min-h-screen,
// which is too tall for an in-page preview. Override with a fixed height.
const previewShell = "!min-h-0 h-80 overflow-hidden rounded-md border";

// Tiny mock content for the previews.
function MockSideNav() {
  return (
    <Stack gap="xs" className="p-3 w-48 h-full">
      <div className="font-semibold text-sm px-2 py-1">App</div>
      <div className="h-px bg-border my-1" />
      <div className="text-sm px-2 py-1 rounded bg-muted">Home</div>
      <div className="text-sm px-2 py-1 rounded text-muted-foreground">Projects</div>
      <div className="text-sm px-2 py-1 rounded text-muted-foreground">Team</div>
      <div className="text-sm px-2 py-1 rounded text-muted-foreground">Settings</div>
    </Stack>
  );
}

function MockSideRail() {
  return (
    <Stack gap="xs" className="p-2 w-14 h-full items-center pt-3">
      <div className="h-7 w-7 rounded bg-primary/20" />
      <div className="h-7 w-7 rounded bg-muted mt-1" />
      <div className="h-7 w-7 rounded bg-muted" />
      <div className="h-7 w-7 rounded bg-muted" />
    </Stack>
  );
}

function MockTopNav() {
  return (
    <Row justify="between" align="center" className="w-full px-4 py-3">
      <div className="font-semibold text-sm">App</div>
      <Row gap="sm">
        <Button variant="ghost" size="sm">Docs</Button>
        <Button variant="ghost" size="sm">Pricing</Button>
        <Button size="sm">Sign in</Button>
      </Row>
    </Row>
  );
}

function MockHeader() {
  return (
    <Row justify="between" align="center" className="w-full px-6 py-3 border-b">
      <Row gap="sm" align="center">
        <div className="h-6 w-6 rounded bg-primary" />
        <div className="font-semibold text-sm">Acme</div>
      </Row>
      <Row gap="sm">
        <Button variant="ghost" size="sm">Product</Button>
        <Button variant="ghost" size="sm">Pricing</Button>
        <Button variant="ghost" size="sm">Docs</Button>
        <Button size="sm">Get started</Button>
      </Row>
    </Row>
  );
}

function MockFooter() {
  return (
    <Row justify="between" align="center" className="w-full px-6 py-3">
      <span className="text-xs text-muted-foreground">© 2026 Acme Inc.</span>
      <Row gap="md">
        <span className="text-xs text-muted-foreground">Privacy</span>
        <span className="text-xs text-muted-foreground">Terms</span>
        <span className="text-xs text-muted-foreground">Status</span>
      </Row>
    </Row>
  );
}

function MockAside() {
  return (
    <Stack gap="none" className="h-full">
      <div className="px-4 py-3 border-b">
        <div className="text-sm font-semibold">Inbox</div>
        <div className="text-xs text-muted-foreground">12 unread</div>
      </div>
      <Stack gap="none" className="overflow-hidden">
        {[
          { from: "Elena Okafor", subj: "Re: Q4 plan" },
          { from: "Marcus Li", subj: "Migration notes" },
          { from: "Priya Devi", subj: "Designs for review" },
          { from: "Samir Khan", subj: "Hiring update" },
          { from: "Zoe Chen", subj: "Trial feedback" },
        ].map((m, i) => (
          <div
            key={m.from}
            className={`px-4 py-2 border-b text-xs ${i === 0 ? "bg-muted/60" : ""}`}
          >
            <div className="font-medium text-foreground">{m.from}</div>
            <div className="text-muted-foreground truncate">{m.subj}</div>
          </div>
        ))}
      </Stack>
    </Stack>
  );
}

function MockMain({ constrained = false }: { constrained?: boolean }) {
  return (
    <Stack gap="md" className={constrained ? "py-6" : "p-6"}>
      <div>
        <h3 className="text-lg font-semibold">Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          A placeholder for whatever your page's content is.
        </p>
      </div>
      <Row gap="md" wrap>
        <Card className="flex-1 min-w-[160px]">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Users</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-semibold">1,248</CardContent>
        </Card>
        <Card className="flex-1 min-w-[160px]">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-semibold">$24.3k</CardContent>
        </Card>
      </Row>
    </Stack>
  );
}

function MockDetail() {
  return (
    <Stack gap="md" className="p-6">
      <div>
        <div className="text-xs text-muted-foreground">Elena Okafor</div>
        <h3 className="text-base font-semibold">Re: Q4 plan</h3>
      </div>
      <div className="text-sm text-muted-foreground">
        Hey — taking another look at the roadmap. The Q4 cuts feel
        right but I'd love to talk through the timing on…
      </div>
    </Stack>
  );
}

export default function AppShellPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">App Shell</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Top-level page scaffold. Five slots — Header, Nav, Aside, Main,
          Footer — arranged via CSS-grid template areas. Covers app
          dashboards, three-column workspaces, and marketing pages from one
          primitive.
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import {
  AppShell,
  AppShellHeader,
  AppShellNav,
  AppShellAside,
  AppShellMain,
  AppShellFooter,
} from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <p className="text-muted-foreground">
          AppShell is a CSS-grid layout with fixed{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">grid-area</code>{" "}
          slots. The <code className="bg-muted px-1 py-0.5 rounded text-sm">nav</code>{" "}
          prop picks the template — <code className="bg-muted px-1 py-0.5 rounded text-sm">none</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">top</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">side</code>, or{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">three-pane</code>{" "}
          — and the slot components drop wherever they go in the JSX. Order
          doesn't matter; each slot has a fixed area.
        </p>
        <p className="text-muted-foreground">
          Header and Footer always span full width, regardless of nav variant
          — that's what makes the same primitive work for marketing pages
          (Header / Main / Footer) and three-column workspaces (Header
          spanning a sidebar+aside+main grid).
        </p>
        <p className="text-muted-foreground">
          It's intentionally just structure — no collapse state, no context,
          no runtime JS. Server-rendered, consumer-themeable. For{" "}
          <em>user-adjustable</em> column widths (drag-to-resize), use{" "}
          <a href="/components/resizable" className="underline">Resizable</a>{" "}
          instead.
        </p>
      </div>

      {/* nav="side" */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          nav="side"
        </h2>
        <p className="text-muted-foreground">
          The classic dashboard shape — nav on the left, main filling the
          rest.
        </p>
        <ComponentPreview
          code={`<AppShell nav="side">
  <AppShellNav placement="side">
    <Sidebar>...</Sidebar>
  </AppShellNav>
  <AppShellMain>
    <Stack gap="md" className="p-6">…</Stack>
  </AppShellMain>
</AppShell>`}
        >
          <AppShell nav="side" className={previewShell}>
            <AppShellNav placement="side" sticky={false}>
              <MockSideNav />
            </AppShellNav>
            <AppShellMain>
              <MockMain />
            </AppShellMain>
          </AppShell>
        </ComponentPreview>
      </div>

      {/* nav="top" */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          nav="top"
        </h2>
        <p className="text-muted-foreground">
          In-app nav bar above main — a tab strip or section nav row.
          Combine with{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">maxWidth="container"</code>{" "}
          on the main region to cap the content width.
        </p>
        <ComponentPreview
          code={`<AppShell nav="top">
  <AppShellNav placement="top">
    <TopMenu title="My App" />
  </AppShellNav>
  <AppShellMain maxWidth="container">
    <Stack gap="md" className="py-6">…</Stack>
  </AppShellMain>
</AppShell>`}
        >
          <AppShell nav="top" className={previewShell}>
            <AppShellNav placement="top" sticky={false}>
              <MockTopNav />
            </AppShellNav>
            <AppShellMain maxWidth="container">
              <MockMain constrained />
            </AppShellMain>
          </AppShell>
        </ComponentPreview>
      </div>

      {/* nav="three-pane" */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          nav="three-pane"
        </h2>
        <p className="text-muted-foreground">
          The Slack/Mail/Notion shape — narrow nav rail + fixed-width{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">Aside</code>{" "}
          (a list, channel picker, or page tree) + flex Main. The middle
          column's width comes from the{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">--gds-app-shell-aside</code>{" "}
          CSS variable (default 320px) — override per-screen via inline{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">style</code>{" "}
          or a parent class without forking the component.
        </p>
        <ComponentPreview
          code={`<AppShell nav="three-pane">
  <AppShellNav placement="side">
    <SideRail />
  </AppShellNav>
  <AppShellAside>
    <ThreadList />
  </AppShellAside>
  <AppShellMain>
    <ThreadDetail />
  </AppShellMain>
</AppShell>

// Override the middle column width:
<AppShell
  nav="three-pane"
  style={{ "--gds-app-shell-aside": "280px" } as React.CSSProperties}
>
  …
</AppShell>`}
        >
          <AppShell
            nav="three-pane"
            className={previewShell}
            style={{ "--gds-app-shell-aside": "200px" } as React.CSSProperties}
          >
            <AppShellNav placement="side" sticky={false}>
              <MockSideRail />
            </AppShellNav>
            <AppShellAside>
              <MockAside />
            </AppShellAside>
            <AppShellMain>
              <MockDetail />
            </AppShellMain>
          </AppShell>
        </ComponentPreview>
      </div>

      {/* Header + Footer marketing layout */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Marketing layout (Header + Footer)
        </h2>
        <p className="text-muted-foreground">
          Header and Footer span full width and always sit at the very top /
          very bottom — independent of the nav variant. With{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">nav="none"</code>{" "}
          you get the canonical marketing shape: Header / Main / Footer.
        </p>
        <ComponentPreview
          code={`<AppShell nav="none">
  <AppShellHeader sticky>
    <Brand /> <NavLinks />
  </AppShellHeader>

  <AppShellMain maxWidth="container">
    <Hero />
    <Features />
    <Pricing />
  </AppShellMain>

  <AppShellFooter>
    <SiteMap />
  </AppShellFooter>
</AppShell>`}
        >
          <AppShell nav="none" className={previewShell}>
            <AppShellHeader>
              <MockHeader />
            </AppShellHeader>
            <AppShellMain maxWidth="container">
              <MockMain constrained />
            </AppShellMain>
            <AppShellFooter>
              <MockFooter />
            </AppShellFooter>
          </AppShell>
        </ComponentPreview>
      </div>

      {/* Header + Footer with side nav */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Header + side nav + Footer
        </h2>
        <p className="text-muted-foreground">
          Header and Footer span all columns, with the side-nav body row in
          the middle. Useful when an app has site-wide chrome (org switcher,
          help menu) above and an in-app side nav for navigation.
        </p>
        <ComponentPreview
          code={`<AppShell nav="side">
  <AppShellHeader sticky>
    <OrgSwitcher /> <UserMenu />
  </AppShellHeader>
  <AppShellNav placement="side">
    <Sidebar />
  </AppShellNav>
  <AppShellMain>…</AppShellMain>
  <AppShellFooter>
    <span>Acme Inc · Status</span>
  </AppShellFooter>
</AppShell>`}
        >
          <AppShell nav="side" className={previewShell}>
            <AppShellHeader>
              <MockHeader />
            </AppShellHeader>
            <AppShellNav placement="side" sticky={false}>
              <MockSideNav />
            </AppShellNav>
            <AppShellMain>
              <MockMain />
            </AppShellMain>
            <AppShellFooter>
              <MockFooter />
            </AppShellFooter>
          </AppShell>
        </ComponentPreview>
      </div>

      {/* nav="none" */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          nav="none"
        </h2>
        <p className="text-muted-foreground">
          No nav — useful for auth flows, single-screen prototypes, or any
          page where you don't need an in-app navigation rail.
        </p>
        <ComponentPreview
          code={`<AppShell nav="none">
  <AppShellMain maxWidth="container">
    {/* page content */}
  </AppShellMain>
</AppShell>`}
        >
          <AppShell nav="none" className={previewShell}>
            <AppShellMain maxWidth="container">
              <MockMain constrained />
            </AppShellMain>
          </AppShell>
        </ComponentPreview>
      </div>

      {/* Aside width */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Aside width
        </h2>
        <p className="text-muted-foreground">
          When using <code className="bg-muted px-1 py-0.5 rounded text-sm">nav="three-pane"</code>,
          the Aside column's width comes from a CSS variable, not a prop.
          The default is{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">320px</code>{" "}
          — fits a typical inbox / channel-list / file-tree comfortably. To
          override per-screen, set{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">--gds-app-shell-aside</code>{" "}
          on the shell element (or any ancestor):
        </p>
        <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`{/* Inline style on the shell */}
<AppShell
  nav="three-pane"
  style={{ "--gds-app-shell-aside": "280px" } as React.CSSProperties}
>
  …
</AppShell>

{/* Or via a parent class — useful for breakpoint-based switching */}
<div className="[--gds-app-shell-aside:240px] lg:[--gds-app-shell-aside:360px]">
  <AppShell nav="three-pane">…</AppShell>
</div>`}</code>
          </pre>
        </div>
      </div>

      {/* sticky */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sticky header / nav / aside
        </h2>
        <p className="text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellHeader</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellNav</code>{" "}
          and <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellAside</code>{" "}
          each take a <code className="bg-muted px-1 py-0.5 rounded text-sm">sticky</code>{" "}
          prop. Defaults: Nav <code className="bg-muted px-1 py-0.5 rounded text-sm">true</code>,
          Header and Aside <code className="bg-muted px-1 py-0.5 rounded text-sm">false</code>.
          Side and aside variants get{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">h-screen</code>{" "}
          self-scroll when sticky — so a long list scrolls inside its
          column, not the page.
        </p>
      </div>

      {/* Drag-to-resize */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          User-adjustable columns
        </h2>
        <p className="text-muted-foreground">
          AppShell columns are static — the widths come from the grid
          template. If you want users to drag column dividers to resize,
          drop a{" "}
          <a href="/components/resizable" className="underline">
            ResizablePanelGroup
          </a>{" "}
          inside an{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellMain</code>{" "}
          (or use it as the only child of{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">nav="none"</code>)
          and let it manage the splits.
        </p>
      </div>

      {/* Composition */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Composition
        </h2>
        <p className="text-muted-foreground">
          Drop any nav component into{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellNav</code>{" "}
          and any page content into{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellMain</code>.
          A typical productivity-app shell with site chrome, side nav, and a
          footer:
        </p>
        <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`<AppShell nav="side">
  <AppShellHeader sticky>
    <OrgSwitcher /> <SearchInput /> <UserMenu />
  </AppShellHeader>

  <AppShellNav placement="side">
    <Sidebar>
      <SidebarHeader><Logo /></SidebarHeader>
      <SidebarContent>
        <SidebarSection title="Main">
          <SidebarItem href="/" icon={<Home />}>Home</SidebarItem>
          <SidebarItem href="/projects">Projects</SidebarItem>
        </SidebarSection>
      </SidebarContent>
    </Sidebar>
  </AppShellNav>

  <AppShellMain>
    <Stack gap="lg" className="p-6">
      <PageHeader title="Dashboard" />
      <DashboardGrid />
    </Stack>
  </AppShellMain>

  <AppShellFooter>
    <FooterLinks />
  </AppShellFooter>
</AppShell>`}</code>
          </pre>
        </div>
      </div>

      {/* Props */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          AppShell props
        </h2>
        <PropsTable props={appShellProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          AppShellHeader props
        </h2>
        <PropsTable props={appShellHeaderProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          AppShellNav props
        </h2>
        <PropsTable props={appShellNavProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          AppShellAside props
        </h2>
        <PropsTable props={appShellAsideProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          AppShellMain props
        </h2>
        <PropsTable props={appShellMainProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          AppShellFooter props
        </h2>
        <PropsTable props={appShellFooterProps} />
      </div>

      {/* When to reach for it */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to use
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            As the root layout for any screen — app or marketing — at the
            top of a{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">layout.tsx</code>{" "}
            or full-page route.
          </li>
          <li>
            When you need a 3-column workspace (Slack/Mail/Notion shape)
            without hand-rolling{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              grid grid-cols-[auto_320px_1fr]
            </code>
            {" "}— use{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              nav="three-pane"
            </code>
            .
          </li>
          <li>
            When you want columns the user can drag to resize, compose with{" "}
            <a href="/components/resizable" className="underline">Resizable</a>{" "}
            inside the AppShell instead of relying on the grid.
          </li>
          <li>
            Pair Nav with{" "}
            <a href="/components/sidebar" className="underline">Sidebar</a> or{" "}
            <a href="/components/top-menu" className="underline">TopMenu</a>,
            and Main with{" "}
            <a href="/components/stack" className="underline">Stack</a>.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="app-shell" />

      <ComponentNav currentHref="/components/app-shell" />
    </div>
  );
}
