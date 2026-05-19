"use client";

import * as React from "react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
} from "@/components/ui/sidebar";
import {
  Home,
  Inbox,
  Users,
  Settings,
  LogOut,
  Folder,
  BarChart3,
  Bell,
} from "lucide-react";

const sidebarProps = [
  { name: "collapsed", type: "boolean", default: "—", description: "Controlled collapsed state. Wire onCollapsedChange when set." },
  { name: "defaultCollapsed", type: "boolean", default: "false", description: "Uncontrolled initial collapsed state." },
  { name: "onCollapsedChange", type: "(next: boolean) => void", default: "—", description: "Fired when the toggle flips collapsed state." },
  { name: "collapsible", type: "boolean", default: "true", description: "Show the affordance for the user to collapse." },
];

const sectionProps = [
  { name: "title", type: "ReactNode", default: "—", description: "Group label, hidden when sidebar is collapsed." },
  { name: "icon", type: "ReactNode", default: "—", description: "Optional icon beside the title." },
  { name: "collapsible", type: "boolean", default: "true", description: "Title acts as expand/collapse trigger." },
  { name: "defaultExpanded", type: "boolean", default: "true", description: "Initial open state." },
];

const itemProps = [
  { name: "icon", type: "ReactNode", default: "—", description: "Leading icon." },
  { name: "badge", type: "ReactNode", default: "—", description: "Trailing count / label. Hidden when collapsed." },
  { name: "active", type: "boolean", default: "false", description: "Current route. Adds aria-current='page'." },
  { name: "href", type: "string", default: "—", description: "Renders as <a>. Use asChild for custom routers." },
  { name: "asChild", type: "boolean", default: "false", description: "Wrap a custom link component via Radix Slot." },
  { name: "asButton", type: "boolean", default: "false", description: "Render as <button> for action rows." },
  { name: "disabled", type: "boolean", default: "false", description: "Greyed + pointer-events-none." },
  { name: "collapsedLabel", type: "ReactNode", default: "children", description: "Tooltip override when sidebar is collapsed." },
];

export default function SidebarPage() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [active, setActive] = React.useState("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Sidebar</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Vertical app navigation as a compound layout primitive. Slot
          custom chrome into the header, content, and footer regions.
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
          Renamed from <code className="font-mono">SideMenu</code> in May 2026
          and rebuilt around a compound API so consumers can drop search
          inputs, brand blocks, or drag handles alongside the nav rows
          without fighting a data-driven <code className="font-mono">sections={`{[…]}`}</code>{" "}
          prop.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
} from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Sidebar defaultCollapsed={false}>
  <SidebarHeader>
    <div className="font-semibold">Acme</div>
  </SidebarHeader>
  <SidebarContent>
    <SidebarSection title="Workspace">
      <SidebarItem icon={<Home />} active>Dashboard</SidebarItem>
      <SidebarItem icon={<Inbox />} badge={3}>Inbox</SidebarItem>
      <SidebarItem icon={<Users />}>Team</SidebarItem>
    </SidebarSection>
  </SidebarContent>
  <SidebarFooter>
    <div className="text-xs text-muted-foreground">Pro plan</div>
  </SidebarFooter>
</Sidebar>`}
        >
          <div className="h-[400px] flex">
            <Sidebar
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
            >
              <SidebarHeader>
                <div className="font-semibold">Acme</div>
              </SidebarHeader>
              <SidebarContent>
                <SidebarSection title="Workspace">
                  <SidebarItem
                    icon={<Home />}
                    asButton
                    active={active === "dashboard"}
                    onClick={() => setActive("dashboard")}
                  >
                    Dashboard
                  </SidebarItem>
                  <SidebarItem
                    icon={<Inbox />}
                    badge={3}
                    asButton
                    active={active === "inbox"}
                    onClick={() => setActive("inbox")}
                  >
                    Inbox
                  </SidebarItem>
                  <SidebarItem
                    icon={<Users />}
                    asButton
                    active={active === "team"}
                    onClick={() => setActive("team")}
                  >
                    Team
                  </SidebarItem>
                </SidebarSection>
                <SidebarSection title="Personal">
                  <SidebarItem
                    icon={<Settings />}
                    asButton
                    active={active === "settings"}
                    onClick={() => setActive("settings")}
                  >
                    Settings
                  </SidebarItem>
                </SidebarSection>
              </SidebarContent>
              <SidebarFooter>
                <div className="text-xs text-muted-foreground">Pro plan</div>
              </SidebarFooter>
            </Sidebar>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Many sections + nested groups</h3>
        <ComponentPreview
          code={`<Sidebar>
  <SidebarHeader>…</SidebarHeader>
  <SidebarContent>
    <SidebarSection title="Workspace">…</SidebarSection>
    <SidebarSection title="Reports" defaultExpanded={false}>…</SidebarSection>
    <SidebarSection title="Admin">…</SidebarSection>
  </SidebarContent>
</Sidebar>`}
        >
          <div className="h-[400px] flex">
            <Sidebar>
              <SidebarHeader>
                <div className="font-semibold">Acme</div>
              </SidebarHeader>
              <SidebarContent>
                <SidebarSection title="Workspace">
                  <SidebarItem icon={<Home />} asButton>Dashboard</SidebarItem>
                  <SidebarItem icon={<Folder />} asButton>Projects</SidebarItem>
                </SidebarSection>
                <SidebarSection title="Reports" defaultExpanded={false}>
                  <SidebarItem icon={<BarChart3 />} asButton>Analytics</SidebarItem>
                  <SidebarItem icon={<Bell />} asButton badge="New">Alerts</SidebarItem>
                </SidebarSection>
                <SidebarSection title="Admin">
                  <SidebarItem icon={<Users />} asButton>Team</SidebarItem>
                  <SidebarItem icon={<Settings />} asButton>Settings</SidebarItem>
                </SidebarSection>
              </SidebarContent>
              <SidebarFooter>
                <SidebarItem icon={<LogOut />} asButton>Sign out</SidebarItem>
              </SidebarFooter>
            </Sidebar>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With routing (asChild)</h3>
        <ComponentPreview
          code={`import Link from "next/link";

<SidebarItem asChild icon={<Home />} active={pathname === "/"}>
  <Link href="/">Dashboard</Link>
</SidebarItem>`}
        >
          <div className="h-[200px] flex">
            <Sidebar collapsible={false}>
              <SidebarContent>
                <SidebarSection title="Routes" collapsible={false}>
                  <SidebarItem asChild icon={<Home />} active>
                    <a href="#">Dashboard</a>
                  </SidebarItem>
                  <SidebarItem asChild icon={<Folder />}>
                    <a href="#">Projects</a>
                  </SidebarItem>
                </SidebarSection>
              </SidebarContent>
            </Sidebar>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sidebar props
        </h2>
        <PropsTable props={sidebarProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          SidebarSection props
        </h2>
        <PropsTable props={sectionProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          SidebarItem props
        </h2>
        <PropsTable props={itemProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Theming
        </h2>
        <p className="text-muted-foreground">
          Sizing knobs live as CSS variables on{" "}
          <code className="font-mono">:root</code> so consumers can retune
          without prop drilling:{" "}
          <code className="font-mono">--rds-sidebar-width</code>,{" "}
          <code className="font-mono">--rds-sidebar-collapsed-width</code>,{" "}
          <code className="font-mono">--rds-sidebar-header-height</code>,{" "}
          <code className="font-mono">--rds-sidebar-content-py</code>,{" "}
          <code className="font-mono">--rds-sidebar-section-px</code>,{" "}
          <code className="font-mono">--rds-sidebar-section-gap</code>.
        </p>
      </div>

      <SidecarBlock slug="sidebar" />

      <ComponentNav currentHref="/components/sidebar" />
    </div>
  );
}
