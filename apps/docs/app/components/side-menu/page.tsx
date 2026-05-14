"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { SideMenu } from "@/components/ui/side-menu";
import {
  LayoutDashboard,
  Home,
  Zap,
  Users,
  Settings,
  Bell,
  BarChart3,
  FileText
} from "lucide-react";
import { useState } from "react";

const sideMenuProps = [
  {
    name: "header",
    type: "React.ReactNode",
    default: "-",
    description: "Header content (logo, title, etc.)",
  },
  {
    name: "collapsedHeader",
    type: "React.ReactNode",
    default: "-",
    description: "Header content shown when collapsed (icon, etc.)",
  },
  {
    name: "sections",
    type: "SideMenuSection[]",
    default: "[]",
    description: "Navigation sections with collapsible groups",
  },
  {
    name: "items",
    type: "SideMenuItem[]",
    default: "[]",
    description: "Standalone items without sections",
  },
  {
    name: "collapsed",
    type: "boolean",
    default: "-",
    description: "Whether the sidebar is collapsed (controlled)",
  },
  {
    name: "defaultCollapsed",
    type: "boolean",
    default: "false",
    description: "Default collapsed state (uncontrolled)",
  },
  {
    name: "collapsible",
    type: "boolean",
    default: "true",
    description: "Whether the sidebar can be collapsed",
  },
  {
    name: "onCollapsedChange",
    type: "(collapsed: boolean) => void",
    default: "-",
    description: "Callback when collapsed state changes",
  },
  {
    name: "activeItem",
    type: "string",
    default: "-",
    description: "Currently active item id",
  },
  {
    name: "linkComponent",
    type: "React.ComponentType",
    default: "a",
    description: "Custom link component (e.g., Next.js Link)",
  },
];

export default function SideMenuPage() {
  const [activeItem, setActiveItem] = useState("dashboard");

  const items = [
    { id: "dashboard", label: "Dashboard", href: "#", icon: <LayoutDashboard className="h-full w-full" strokeWidth={1.5} /> },
    { id: "notifications", label: "Notifications", href: "#", icon: <Bell className="h-full w-full" strokeWidth={1.5} />, badge: 3 },
  ];

  const sections = [
    {
      id: "fleet",
      title: "Fleet",
      icon: <Zap className="h-full w-full" strokeWidth={1.5} />,
      items: [
        { id: "sites", label: "Sites", href: "#", icon: <Home className="h-full w-full" strokeWidth={1.5} /> },
        { id: "devices", label: "Devices", href: "#", icon: <Zap className="h-full w-full" strokeWidth={1.5} /> },
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: <BarChart3 className="h-full w-full" strokeWidth={1.5} />,
      items: [
        { id: "insights", label: "Insights", href: "#", icon: <BarChart3 className="h-full w-full" strokeWidth={1.5} /> },
        { id: "reports", label: "Reports", href: "#", icon: <FileText className="h-full w-full" strokeWidth={1.5} /> },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      icon: <Settings className="h-full w-full" strokeWidth={1.5} />,
      items: [
        { id: "account", label: "Account", href: "#", icon: <Users className="h-full w-full" strokeWidth={1.5} /> },
        { id: "preferences", label: "Preferences", href: "#", icon: <Settings className="h-full w-full" strokeWidth={1.5} /> },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Side Menu</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A collapsible sidebar navigation component with sections, tooltips, and icons.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { SideMenu } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`const items = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: <LayoutDashboard /> },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: <Bell />, badge: 3 },
];

const sections = [
  {
    id: "fleet",
    title: "Fleet",
    icon: <Zap />,
    items: [
      { id: "sites", label: "Sites", href: "/sites", icon: <Home /> },
      { id: "devices", label: "Devices", href: "/devices", icon: <Zap /> },
    ],
  },
];

<SideMenu
  header={<span className="font-bold">My App</span>}
  collapsedHeader={<span className="font-bold">M</span>}
  items={items}
  sections={sections}
  activeItem="dashboard"
/>`}
        >
          <div className="h-[400px] relative border rounded-lg overflow-hidden">
            <SideMenu
              header={<span className="font-bold text-rds-gray-900 dark:text-white">My App</span>}
              collapsedHeader={<span className="font-bold text-rds-gray-900 dark:text-white">M</span>}
              items={items}
              sections={sections}
              activeItem={activeItem}
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Non-collapsible</h3>
        <ComponentPreview
          code={`<SideMenu
  header={<span className="font-bold">App Name</span>}
  items={items}
  sections={sections}
  collapsible={false}
  activeItem="sites"
/>`}
        >
          <div className="h-[300px] relative border rounded-lg overflow-hidden">
            <SideMenu
              header={<span className="font-bold text-rds-gray-900 dark:text-white">App Name</span>}
              items={items.slice(0, 1)}
              sections={sections.slice(0, 1)}
              collapsible={false}
              activeItem="sites"
            />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Footer</h3>
        <ComponentPreview
          code={`<SideMenu
  header={<span className="font-bold">App Name</span>}
  items={items}
  sections={sections}
  footer={<div className="text-xs text-muted-foreground">v1.0.0</div>}
  activeItem="dashboard"
/>`}
        >
          <div className="h-[300px] relative border rounded-lg overflow-hidden">
            <SideMenu
              header={<span className="font-bold text-rds-gray-900 dark:text-white">App Name</span>}
              items={items.slice(0, 1)}
              sections={sections.slice(0, 1)}
              footer={<div className="text-xs text-muted-foreground text-center">v1.0.0</div>}
              activeItem="dashboard"
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={sideMenuProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Type Definitions
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`interface SideMenuItem {
  id: string
  label: string
  href?: string
  icon?: React.ReactNode
  badge?: string | number
  onClick?: () => void
  disabled?: boolean
}

interface SideMenuSection {
  id: string
  title: string
  icon?: React.ReactNode
  items: SideMenuItem[]
  defaultExpanded?: boolean
}`}</code>
          </pre>
        </div>
      </div>

      <SidecarBlock slug="side-menu" />

      <ComponentNav currentHref="/components/side-menu" />
    </div>
  );
}
