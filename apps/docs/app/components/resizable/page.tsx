import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { InstallBlock } from "@/components/install-block";

const panelGroupProps = [
  {
    name: "direction",
    type: '"horizontal" | "vertical"',
    default: "—",
    description:
      "Required. `horizontal` arranges panels left-to-right with vertical drag handles between them. `vertical` arranges panels top-to-bottom with horizontal handles.",
  },
  {
    name: "id",
    type: "string",
    default: "—",
    description:
      "When set, panel sizes are auto-persisted to localStorage under this key — the user's preferred layout survives reloads. Pair with an `id` on each `ResizablePanel`.",
  },
  {
    name: "autoSaveId",
    type: "string",
    default: "—",
    description:
      "Alternative to `id` for layout persistence. Both work; pick one.",
  },
  {
    name: "onLayout",
    type: "(sizes: number[]) => void",
    default: "—",
    description:
      "Fires whenever the user drags a handle and panels resize. Sizes are percentages summing to ~100.",
  },
];

const panelProps = [
  {
    name: "defaultSize",
    type: "number",
    default: "—",
    description:
      "Initial size as a percentage of the group (0–100). Required if you want a non-equal split on first render.",
  },
  {
    name: "minSize",
    type: "number",
    default: "10",
    description:
      "Minimum size before the panel collapses or hits the floor (percentage).",
  },
  {
    name: "maxSize",
    type: "number",
    default: "100",
    description: "Maximum size the panel can grow to (percentage).",
  },
  {
    name: "collapsible",
    type: "boolean",
    default: "false",
    description:
      "When true, dragging below `collapsedSize` snaps the panel closed. Pair with `onCollapse` / `onExpand`.",
  },
  {
    name: "collapsedSize",
    type: "number",
    default: "0",
    description:
      "Size the panel snaps to when collapsed (percentage). Set non-zero to keep an icon-rail visible when collapsed.",
  },
  {
    name: "id",
    type: "string",
    default: "—",
    description:
      "Stable id used by `ResizablePanelGroup`'s `id` to persist this panel's size across reloads.",
  },
];

const handleProps = [
  {
    name: "withHandle",
    type: "boolean",
    default: "false",
    description:
      "When true, render a small grip in the middle of the divider for affordance. Without it, the handle is a 1px hit area — fine for power-user tools, less discoverable for a general audience.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disable dragging on this handle.",
  },
];

// Shrunken-preview wrapper — Resizable's panels are h-full w-full so we
// constrain the outer box.
const previewBox = "h-72 rounded-md border overflow-hidden";

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default function ResizablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Resizable</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Drag-to-adjust panel groups. Use when you want users to control
          column widths — for static layouts with fixed-width columns,
          prefer{" "}
          <a href="/components/app-shell" className="underline">
            AppShell with nav="three-pane"
          </a>{" "}
          (no JS, server-renderable).
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@gradeui/ui"`}</InstallBlock>
        <p className="text-sm text-muted-foreground">
          Built on{" "}
          <a
            href="https://github.com/bvaughn/react-resizable-panels"
            className="underline"
          >
            react-resizable-panels
          </a>
          {" "}— same API, gradeui styling and tokens.
        </p>
      </div>

      {/* Horizontal */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Horizontal split
        </h2>
        <p className="text-muted-foreground">
          Two columns split 30 / 70. Drag the divider to resize. Hover over
          the divider to see the hit area.
        </p>
        <ComponentPreview
          code={`<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={30} minSize={20}>
    <NavRail />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={70}>
    <Main />
  </ResizablePanel>
</ResizablePanelGroup>`}
        >
          <div className={previewBox}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={30} minSize={20}>
                <PanelLabel>Sidebar</PanelLabel>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={70}>
                <PanelLabel>Main</PanelLabel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
      </div>

      {/* Visible handle */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Visible handle
        </h2>
        <p className="text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-sm">withHandle</code>{" "}
          renders a small grip in the middle of the divider so it's easier
          to spot. Use this for general audiences; skip it for power-user
          tools where every pixel matters.
        </p>
        <ComponentPreview
          code={`<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={50}>
    <Left />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50}>
    <Right />
  </ResizablePanel>
</ResizablePanelGroup>`}
        >
          <div className={previewBox}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50}>
                <PanelLabel>Left</PanelLabel>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50}>
                <PanelLabel>Right</PanelLabel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
      </div>

      {/* Three-pane (the resizable answer to AppShell three-pane) */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Three-pane workspace
        </h2>
        <p className="text-muted-foreground">
          Slack/Mail/Notion shape with adjustable middle column. Each panel
          has{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">minSize</code>{" "}
          so users can't crush a pane to nothing.
        </p>
        <ComponentPreview
          code={`<ResizablePanelGroup direction="horizontal" id="workspace">
  <ResizablePanel defaultSize={20} minSize={15} id="nav">
    <Sidebar />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={30} minSize={20} id="list">
    <ThreadList />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50} id="detail">
    <ThreadDetail />
  </ResizablePanel>
</ResizablePanelGroup>`}
        >
          <div className={previewBox}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={20} minSize={15}>
                <PanelLabel>Nav</PanelLabel>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20}>
                <PanelLabel>List</PanelLabel>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={50}>
                <PanelLabel>Detail</PanelLabel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
      </div>

      {/* Vertical split */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Vertical split
        </h2>
        <p className="text-muted-foreground">
          Set{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">direction="vertical"</code>{" "}
          to stack panels with horizontal drag handles between them — useful
          for an editor + console layout.
        </p>
        <ComponentPreview
          code={`<ResizablePanelGroup direction="vertical">
  <ResizablePanel defaultSize={70}>
    <Editor />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={30} minSize={15}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>`}
        >
          <div className={previewBox}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <PanelLabel>Editor</PanelLabel>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={15}>
                <PanelLabel>Console</PanelLabel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
      </div>

      {/* Nested */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Nested groups
        </h2>
        <p className="text-muted-foreground">
          Panels can themselves contain a{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">ResizablePanelGroup</code>{" "}
          — useful when one column should split top-to-bottom while another
          stays single. Nest groups freely; sizes resolve independently per
          group.
        </p>
        <ComponentPreview
          code={`<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={30}>
    <NavRail />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={70}>
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={60}>
        <List />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={40}>
        <Preview />
      </ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
</ResizablePanelGroup>`}
        >
          <div className={previewBox}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={30}>
                <PanelLabel>Nav</PanelLabel>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={70}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={60}>
                    <PanelLabel>List</PanelLabel>
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={40}>
                    <PanelLabel>Preview</PanelLabel>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
      </div>

      {/* Persisting layout */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Persisting layout
        </h2>
        <p className="text-muted-foreground">
          Pass{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">id</code>{" "}
          to the group and to each panel and the user's drag positions
          survive reloads — sizes are written to{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">localStorage</code>{" "}
          under that key. Same drag, different visit, same layout.
        </p>
        <InstallBlock>{`<ResizablePanelGroup direction="horizontal" id="inbox-shell">
  <ResizablePanel defaultSize={20} id="nav">…</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={30} id="list">…</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50} id="detail">…</ResizablePanel>
</ResizablePanelGroup>`}</InstallBlock>
      </div>

      {/* Static vs resizable */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Static or resizable — which one?
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Reach for{" "}
            <a href="/components/app-shell" className="underline">
              AppShell <code className="bg-muted px-1 py-0.5 rounded text-sm">nav="three-pane"</code>
            </a>{" "}
            when the column widths are a design decision (320px aside, etc.) and
            you don't want users adjusting them. Pure CSS, server-renderable,
            no JS.
          </li>
          <li>
            Reach for Resizable when the column widths are a{" "}
            <em>workflow</em> decision — the user's preferred split for their
            inbox, IDE layout, file browser. Drag handles + persistence
            outweigh the JS cost.
          </li>
          <li>
            They compose: a marketing page using AppShell <em>and</em> an
            in-app workspace inside it using Resizable is a perfectly valid
            shape.
          </li>
        </ul>
      </div>

      {/* Props */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          ResizablePanelGroup props
        </h2>
        <PropsTable props={panelGroupProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          ResizablePanel props
        </h2>
        <PropsTable props={panelProps} />

        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight pt-4">
          ResizableHandle props
        </h2>
        <PropsTable props={handleProps} />
      </div>

      {/* When to use */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to use
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Inbox / Mail apps where users want to drag the message list wider
            or narrower.
          </li>
          <li>
            IDE-style layouts: editor + sidebar + console, where the
            developer's preferred ratio matters.
          </li>
          <li>
            Comparison views: split-pane diff, before/after editor, side-by-
            side translation.
          </li>
          <li>
            Anywhere the right answer to "how wide should this column be?" is
            "let the user decide."
          </li>
        </ul>
      </div>

      <SidecarBlock slug="resizable" />

      <ComponentNav currentHref="/components/resizable" />
    </div>
  );
}
