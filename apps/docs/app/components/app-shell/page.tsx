import { ComponentNav } from "@/components/component-nav";
import { AppShell, AppShellNav, AppShellMain } from "@/components/ui/app-shell";
import { Stack } from "@/components/ui/stack";
import { Row } from "@/components/ui/row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const appShellProps = [
  {
    name: "nav",
    type: '"none" | "top" | "side"',
    default: '"none"',
    description:
      "Layout structure. `top` puts nav above main, `side` to the left, `none` hides it entirely.",
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

const appShellNavProps = [
  {
    name: "placement",
    type: '"none" | "top" | "side"',
    default: '"top"',
    description:
      "Should match the parent AppShell's `nav` prop — controls border side and sticky axis.",
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

// Shared shrunken-preview classes — AppShell defaults to min-h-screen,
// which is too tall for an in-page preview. Override with a fixed height.
const previewShell = "!min-h-0 h-72 overflow-hidden rounded-md border";

// Tiny mock nav content for the previews.
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

export default function AppShellPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">App Shell</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Top-level page scaffold. A nav region (top, side, or none) plus a
          main region with an optional width cap.
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { AppShell, AppShellNav, AppShellMain } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <p className="text-muted-foreground">
          Reach for AppShell as the root of any app-like screen. It's three
          pieces: <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShell</code>{" "}
          (the grid),{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellNav</code>{" "}
          (a <code className="bg-muted px-1 py-0.5 rounded text-sm">&lt;nav&gt;</code>{" "}
          region — drop a SideMenu or TopMenu in here), and{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellMain</code>{" "}
          (a <code className="bg-muted px-1 py-0.5 rounded text-sm">&lt;main&gt;</code>{" "}
          region — the page content).
        </p>
        <p className="text-muted-foreground">
          It's intentionally just structure — no collapse state, no context,
          no runtime JS. Server-rendered, consumer-themeable.
        </p>
      </div>

      {/* nav="side" */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          nav="side"
        </h2>
        <p className="text-muted-foreground">
          The classic dashboard shape — nav on the left, main filling the
          rest. Drop a SideMenu into the nav region for ready-made
          navigation.
        </p>
        <ComponentPreview
          code={`<AppShell nav="side">
  <AppShellNav placement="side">
    <SideMenu items={navItems} />
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
          Nav bar above main. Common for marketing, docs, and settings
          screens. Combine with{" "}
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

      {/* nav="none" */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          nav="none"
        </h2>
        <p className="text-muted-foreground">
          No nav — just a shell for a single-screen prototype or an auth
          flow. Still useful as a semantic{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">&lt;main&gt;</code>{" "}
          wrapper with an optional width cap.
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

      {/* maxWidth */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Main width
        </h2>
        <p className="text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellMain</code>{" "}
          has a{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">maxWidth</code>{" "}
          prop.{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">"full"</code>{" "}
          leaves the content edge-to-edge — what dashboards usually want.{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">"container"</code>{" "}
          caps it at <code className="bg-muted px-1 py-0.5 rounded text-sm">max-w-7xl</code>{" "}
          with responsive horizontal padding — better for long-form content
          on wide monitors.
        </p>
      </div>

      {/* sticky */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sticky nav
        </h2>
        <p className="text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellNav</code>{" "}
          is sticky by default.{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">placement="top"</code>{" "}
          sticks to the viewport top;{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">placement="side"</code>{" "}
          sticks with{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">h-screen</code>{" "}
          — which gives the nav its own scroll when it has more items than
          the viewport can fit. Pass{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">sticky={`{false}`}</code>{" "}
          to opt out.
        </p>
      </div>

      {/* Composition */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Composition
        </h2>
        <p className="text-muted-foreground">
          AppShell is just layout — drop any nav component into{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellNav</code>{" "}
          and any page content into{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">AppShellMain</code>.
          Here's a typical dashboard shell with a SideMenu on the left and a
          Stack of content on the right:
        </p>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`<AppShell nav="side">
  <AppShellNav placement="side">
    <SideMenu
      header={<Logo />}
      sections={[
        {
          id: "main",
          title: "Main",
          items: [
            { id: "home", label: "Home", href: "/", icon: <Home /> },
            { id: "projects", label: "Projects", href: "/projects" },
          ],
        },
      ]}
    />
  </AppShellNav>
  <AppShellMain>
    <Stack gap="lg" className="p-6">
      <PageHeader title="Dashboard" />
      <DashboardGrid />
    </Stack>
  </AppShellMain>
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
          AppShellNav props
        </h2>
        <PropsTable props={appShellNavProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          AppShellMain props
        </h2>
        <PropsTable props={appShellMainProps} />
      </div>

      {/* When to reach for it */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to use
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            As the root layout for any app-like screen — the top level of a{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">layout.tsx</code>{" "}
            or a full-page route.
          </li>
          <li>
            When you need a nav region plus a main region and don't want to
            hand-roll{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              grid grid-cols-[auto_1fr]
            </code>
            .
          </li>
          <li>
            Pair with{" "}
            <a href="/components/side-menu" className="underline">SideMenu</a> or{" "}
            <a href="/components/top-menu" className="underline">TopMenu</a> for
            the nav content, and{" "}
            <a href="/components/stack" className="underline">Stack</a> for the
            main content.
          </li>
          <li>
            For single-screen prototypes without navigation, use{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">nav="none"</code>{" "}
            — you still get the semantic{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">&lt;main&gt;</code>{" "}
            wrapper.
          </li>
        </ul>
      </div>

      <ComponentNav currentHref="/components/app-shell" />
    </div>
  );
}
