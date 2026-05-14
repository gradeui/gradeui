"use client";
import { ComponentNav } from "@/components/component-nav";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { TopMenu, TopMenuUser, TopMenuUserItem, TopMenuUserSection } from "@/components/ui/top-menu";
import { User, Settings, LogOut, HelpCircle, CreditCard, Globe, Moon, Sun } from "lucide-react";

const topMenuProps = [
  {
    name: "breadcrumbs",
    type: "TopMenuBreadcrumbItem[]",
    default: "[]",
    description: "Breadcrumb navigation items",
  },
  {
    name: "showMobileMenu",
    type: "boolean",
    default: "false",
    description: "Show mobile menu button",
  },
  {
    name: "onMobileMenuClick",
    type: "() => void",
    default: "-",
    description: "Mobile menu button click handler",
  },
  {
    name: "leftContent",
    type: "React.ReactNode",
    default: "-",
    description: "Left side content (appears after breadcrumbs)",
  },
  {
    name: "rightContent",
    type: "React.ReactNode",
    default: "-",
    description: "Right side content (actions, user menu, etc.)",
  },
  {
    name: "linkComponent",
    type: "React.ComponentType",
    default: "a",
    description: "Custom link component (e.g., Next.js Link)",
  },
];

export default function TopMenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Top Menu</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A top navigation bar component with breadcrumbs, actions, and user menu.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { TopMenu, TopMenuUser, TopMenuUserItem, TopMenuUserSection } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<TopMenu
  breadcrumbs={[
    { label: "Sites", href: "/sites" },
    { label: "Central Office" },
  ]}
  rightContent={
    <TopMenuUser
      name="John Doe"
      email="john@example.com"
      avatarContent={<User className="h-4 w-4 text-white" />}
    >
      <TopMenuUserSection>
        <TopMenuUserItem icon={<User />}>Profile</TopMenuUserItem>
        <TopMenuUserItem icon={<Settings />}>Settings</TopMenuUserItem>
      </TopMenuUserSection>
      <TopMenuUserSection>
        <TopMenuUserItem icon={<LogOut />} variant="danger">
          Log Out
        </TopMenuUserItem>
      </TopMenuUserSection>
    </TopMenuUser>
  }
/>`}
        >
          <div className="border rounded-lg overflow-hidden">
            <TopMenu
              breadcrumbs={[
                { label: "Sites", href: "#" },
                { label: "Central Office" },
              ]}
              rightContent={
                <TopMenuUser
                  name="John Doe"
                  email="john@example.com"
                  avatarContent={<User className="h-4 w-4 text-white" />}
                >
                  <TopMenuUserSection>
                    <TopMenuUserItem icon={<User className="h-4 w-4" />}>Profile</TopMenuUserItem>
                    <TopMenuUserItem icon={<Settings className="h-4 w-4" />}>Settings</TopMenuUserItem>
                    <TopMenuUserItem icon={<CreditCard className="h-4 w-4" />}>Billing</TopMenuUserItem>
                  </TopMenuUserSection>
                  <TopMenuUserSection>
                    <TopMenuUserItem icon={<HelpCircle className="h-4 w-4" />}>Help</TopMenuUserItem>
                    <TopMenuUserItem icon={<LogOut className="h-4 w-4" />} variant="danger">
                      Log Out
                    </TopMenuUserItem>
                  </TopMenuUserSection>
                </TopMenuUser>
              }
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Simple Breadcrumbs</h3>
        <ComponentPreview
          code={`<TopMenu
  breadcrumbs={[
    { label: "Dashboard" },
  ]}
/>`}
        >
          <div className="border rounded-lg overflow-hidden">
            <TopMenu
              breadcrumbs={[
                { label: "Dashboard" },
              ]}
            />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Mobile Menu Button</h3>
        <ComponentPreview
          code={`<TopMenu
  breadcrumbs={[
    { label: "Sites", href: "/sites" },
    { label: "Central Office" },
  ]}
  showMobileMenu
  onMobileMenuClick={() => console.log("Toggle mobile menu")}
/>`}
        >
          <div className="border rounded-lg overflow-hidden">
            <TopMenu
              breadcrumbs={[
                { label: "Sites", href: "#" },
                { label: "Central Office" },
              ]}
              showMobileMenu
              onMobileMenuClick={() => {}}
            />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Left and Right Content</h3>
        <ComponentPreview
          code={`<TopMenu
  breadcrumbs={[{ label: "Dashboard" }]}
  leftContent={
    <span className="text-xs text-muted-foreground ml-2">Last updated: 2 min ago</span>
  }
  rightContent={
    <div className="flex items-center gap-2">
      <button className="p-2 hover:bg-muted rounded-md">
        <Globe className="h-4 w-4" />
      </button>
      <button className="p-2 hover:bg-muted rounded-md">
        <Moon className="h-4 w-4" />
      </button>
    </div>
  }
/>`}
        >
          <div className="border rounded-lg overflow-hidden">
            <TopMenu
              breadcrumbs={[{ label: "Dashboard" }]}
              leftContent={
                <span className="text-xs text-muted-foreground ml-2">Last updated: 2 min ago</span>
              }
              rightContent={
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted rounded-md">
                    <Globe className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-md">
                    <Moon className="h-4 w-4" />
                  </button>
                </div>
              }
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <h3 className="text-lg font-medium">TopMenu</h3>
        <PropsTable props={topMenuProps} />

        <h3 className="text-lg font-medium mt-6">TopMenuUser</h3>
        <PropsTable props={[
          {
            name: "name",
            type: "string",
            default: "-",
            description: "User name",
          },
          {
            name: "email",
            type: "string",
            default: "-",
            description: "User email",
          },
          {
            name: "avatarUrl",
            type: "string",
            default: "-",
            description: "User avatar URL",
          },
          {
            name: "avatarContent",
            type: "React.ReactNode",
            default: "-",
            description: "Custom avatar content (icon, initials, etc.)",
          },
          {
            name: "avatarClassName",
            type: "string",
            default: "-",
            description: "Avatar background color class",
          },
        ]} />

        <h3 className="text-lg font-medium mt-6">TopMenuUserItem</h3>
        <PropsTable props={[
          {
            name: "icon",
            type: "React.ReactNode",
            default: "-",
            description: "Item icon",
          },
          {
            name: "onClick",
            type: "() => void",
            default: "-",
            description: "Click handler",
          },
          {
            name: "href",
            type: "string",
            default: "-",
            description: "Href for link items",
          },
          {
            name: "variant",
            type: "\"default\" | \"danger\" | \"success\"",
            default: "\"default\"",
            description: "Visual variant",
          },
        ]} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Type Definitions
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`interface TopMenuBreadcrumbItem {
  label: string
  href?: string
}`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/top-menu" />
    </div>
  );
}
