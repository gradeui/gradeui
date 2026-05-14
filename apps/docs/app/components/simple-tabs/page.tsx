"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import {
  SimpleTabs,
  SimpleTabsPanel,
  SimpleTabsRoot,
  SimpleTabsList,
  SimpleTabsTrigger,
  SimpleTabsContent
} from "@/components/ui/simple-tabs";
import { LayoutDashboard, Cpu, BarChart3, Settings } from "lucide-react";
import { useState } from "react";

const simpleTabsProps = [
  {
    name: "tabs",
    type: "SimpleTab[]",
    default: "-",
    description: "Array of tab definitions with id, label, and optional icon",
  },
  {
    name: "activeTab",
    type: "string",
    default: "-",
    description: "Currently active tab id (controlled mode)",
  },
  {
    name: "defaultTab",
    type: "string",
    default: "first tab",
    description: "Default active tab id (uncontrolled mode)",
  },
  {
    name: "onTabChange",
    type: "(tabId: string) => void",
    default: "-",
    description: "Callback when tab changes",
  },
];

export default function SimpleTabsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "devices", label: "Devices", icon: <Cpu className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Simple Tabs</h1>
        <p className="text-lg text-muted-foreground mt-2">
          An underlined tabs component with optional icons and animated indicator.
          Great for page-level navigation within content areas.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { SimpleTabs, SimpleTabsPanel } from "@gradeui/ui"
// Or use the compound component pattern:
import { SimpleTabsRoot, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`const tabs = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard /> },
  { id: "devices", label: "Devices", icon: <Cpu /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 /> },
  { id: "settings", label: "Settings", icon: <Settings /> },
];

<SimpleTabs tabs={tabs} defaultTab="overview">
  <SimpleTabsPanel id="overview">
    <p>Overview content here...</p>
  </SimpleTabsPanel>
  <SimpleTabsPanel id="devices">
    <p>Devices content here...</p>
  </SimpleTabsPanel>
  <SimpleTabsPanel id="analytics">
    <p>Analytics content here...</p>
  </SimpleTabsPanel>
  <SimpleTabsPanel id="settings">
    <p>Settings content here...</p>
  </SimpleTabsPanel>
</SimpleTabs>`}
        >
          <SimpleTabs tabs={tabs} defaultTab="overview">
            <SimpleTabsPanel id="overview">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Overview</h3>
                <p className="text-sm text-muted-foreground">Overview content goes here. This tab shows a summary of your data.</p>
              </div>
            </SimpleTabsPanel>
            <SimpleTabsPanel id="devices">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Devices</h3>
                <p className="text-sm text-muted-foreground">List of connected devices and their status.</p>
              </div>
            </SimpleTabsPanel>
            <SimpleTabsPanel id="analytics">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">Charts and metrics for your energy data.</p>
              </div>
            </SimpleTabsPanel>
            <SimpleTabsPanel id="settings">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Settings</h3>
                <p className="text-sm text-muted-foreground">Configure your site preferences.</p>
              </div>
            </SimpleTabsPanel>
          </SimpleTabs>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Without Icons</h3>
        <ComponentPreview
          code={`const tabs = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

<SimpleTabs tabs={tabs} defaultTab="day" />`}
        >
          <SimpleTabs
            tabs={[
              { id: "day", label: "Day" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
              { id: "year", label: "Year" },
            ]}
            defaultTab="day"
          >
            <SimpleTabsPanel id="day">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Daily view content</p>
              </div>
            </SimpleTabsPanel>
            <SimpleTabsPanel id="week">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Weekly view content</p>
              </div>
            </SimpleTabsPanel>
            <SimpleTabsPanel id="month">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Monthly view content</p>
              </div>
            </SimpleTabsPanel>
            <SimpleTabsPanel id="year">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Yearly view content</p>
              </div>
            </SimpleTabsPanel>
          </SimpleTabs>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Compound Component Pattern</h3>
        <p className="text-sm text-muted-foreground mb-4">
          For more flexibility, you can use the compound component pattern:
        </p>
        <ComponentPreview
          code={`<SimpleTabsRoot defaultTab="tab1">
  <SimpleTabsList>
    <SimpleTabsTrigger value="tab1">Account</SimpleTabsTrigger>
    <SimpleTabsTrigger value="tab2">Password</SimpleTabsTrigger>
    <SimpleTabsTrigger value="tab3" disabled>Disabled</SimpleTabsTrigger>
  </SimpleTabsList>
  <SimpleTabsContent value="tab1">
    <p>Account settings...</p>
  </SimpleTabsContent>
  <SimpleTabsContent value="tab2">
    <p>Password settings...</p>
  </SimpleTabsContent>
</SimpleTabsRoot>`}
        >
          <SimpleTabsRoot defaultTab="tab1">
            <SimpleTabsList>
              <SimpleTabsTrigger value="tab1">Account</SimpleTabsTrigger>
              <SimpleTabsTrigger value="tab2">Password</SimpleTabsTrigger>
              <SimpleTabsTrigger value="tab3" disabled>Disabled</SimpleTabsTrigger>
            </SimpleTabsList>
            <SimpleTabsContent value="tab1">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Account settings and preferences.</p>
              </div>
            </SimpleTabsContent>
            <SimpleTabsContent value="tab2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Change your password here.</p>
              </div>
            </SimpleTabsContent>
          </SimpleTabsRoot>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Controlled Mode</h3>
        <ComponentPreview
          code={`const [activeTab, setActiveTab] = useState("overview");

<SimpleTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
>
  {/* panels */}
</SimpleTabs>`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current tab:</span>
              <span className="text-sm font-medium">{activeTab}</span>
            </div>
            <SimpleTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              <SimpleTabsPanel id="overview">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Overview content</p>
                </div>
              </SimpleTabsPanel>
              <SimpleTabsPanel id="devices">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Devices content</p>
                </div>
              </SimpleTabsPanel>
              <SimpleTabsPanel id="analytics">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Analytics content</p>
                </div>
              </SimpleTabsPanel>
              <SimpleTabsPanel id="settings">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Settings content</p>
                </div>
              </SimpleTabsPanel>
            </SimpleTabs>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Comparison with Tabs
        </h2>
        <p className="text-muted-foreground">
          <strong>SimpleTabs</strong> uses an underline style ideal for page-level navigation,
          while <strong>Tabs</strong> (from Radix UI) uses a pill/box style better suited for
          switching between views in a contained area.
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Use <code className="text-sm bg-muted px-1 rounded">SimpleTabs</code> for page sections (Overview, Devices, Settings)</li>
          <li>Use <code className="text-sm bg-muted px-1 rounded">Tabs</code> for toggling views within cards or panels</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <h3 className="text-lg font-medium">SimpleTabs</h3>
        <PropsTable props={simpleTabsProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Type Definitions
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`interface SimpleTab {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}`}</code>
          </pre>
        </div>
      </div>

      <SidecarBlock slug="simple-tabs" />

      <ComponentNav currentHref="/components/simple-tabs" />
    </div>
  );
}
