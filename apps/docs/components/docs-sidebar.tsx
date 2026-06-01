"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const docsNav: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Claude Code", href: "/docs/claude-code" },
      { title: "Subagents", href: "/docs/claude-code/subagents" },
      { title: "Theming", href: "/docs/theming" },
    ],
  },
  {
    title: "Design Tokens",
    items: [
      { title: "Colors", href: "/docs/tokens/colors" },
      { title: "Typography", href: "/docs/tokens/typography" },
      { title: "Spacing", href: "/docs/tokens/spacing" },
    ],
  },
  {
    title: "Patterns",
    items: [
      { title: "Forms", href: "/docs/patterns/forms" },
    ],
  },
  {
    title: "Studio",
    items: [
      { title: "How it works", href: "/docs/studio/how-it-works" },
    ],
  },
];

const componentsNav: NavSection[] = [
  {
    title: "Layout",
    items: [
      { title: "App Shell", href: "/components/app-shell" },
      { title: "Stack", href: "/components/stack" },
      { title: "Row", href: "/components/row" },
      { title: "Grid", href: "/components/grid" },
      { title: "Flex", href: "/components/flex" },
    ],
  },
  // Navigation — hoisted above Forms so structural primitives (Layout,
  // Nav) come before controls. Sidebar replaced SideMenu (May 2026)
  // and ships as a compound API: Sidebar / SidebarHeader /
  // SidebarContent / SidebarFooter / SidebarSection / SidebarItem.
  {
    title: "Navigation",
    items: [
      { title: "Breadcrumb", href: "/components/breadcrumb" },
      { title: "Sidebar", href: "/components/sidebar" },
      { title: "Toolbar", href: "/components/toolbar" },
      { title: "Tabs", href: "/components/tabs" },
      { title: "Command", href: "/components/command" },
      { title: "Dropdown Menu", href: "/components/dropdown-menu" },
      { title: "Accordion", href: "/components/accordion" },
      { title: "Collapsible", href: "/components/collapsible" },
      { title: "Sheet", href: "/components/sheet" },
      { title: "Scroll Area", href: "/components/scroll-area" },
    ],
  },
  {
    title: "Forms",
    items: [
      { title: "Button", href: "/components/button" },
      { title: "Input", href: "/components/input" },
      { title: "Textarea", href: "/components/textarea" },
      { title: "Composer", href: "/components/composer" },
      { title: "Label", href: "/components/label" },
      { title: "Select", href: "/components/select" },
      { title: "Multi Select", href: "/components/multi-select" },
      { title: "Checkbox", href: "/components/checkbox" },
      { title: "Radio Group", href: "/components/radio-group" },
      { title: "Switch", href: "/components/switch" },
      { title: "Slider", href: "/components/slider" },
      { title: "Toggle", href: "/components/toggle" },
      { title: "Toggle Group", href: "/components/toggle-group" },
      { title: "Calendar", href: "/components/calendar" },
      { title: "Date Picker", href: "/components/date-picker" },
    ],
  },
  {
    title: "Data Display",
    items: [
      { title: "Avatar", href: "/components/avatar" },
      { title: "Badge", href: "/components/badge" },
      { title: "Message", href: "/components/message" },
      { title: "Card", href: "/components/card" },
      { title: "Table", href: "/components/table" },
      { title: "Skeleton", href: "/components/skeleton" },
      { title: "Separator", href: "/components/separator" },
      { title: "Hover Card", href: "/components/hover-card" },
    ],
  },
  {
    title: "Charts",
    items: [
      { title: "Overview", href: "/components/charts" },
      { title: "Area Chart", href: "/components/charts/area" },
      { title: "Bar Chart", href: "/components/charts/bar" },
      { title: "Line Chart", href: "/components/charts/line" },
      { title: "Pie Chart", href: "/components/charts/pie" },
      { title: "Radar Chart", href: "/components/charts/radar" },
      { title: "Radial Chart", href: "/components/charts/radial" },
      { title: "Tooltip", href: "/components/charts/tooltip" },
    ],
  },
  {
    title: "Feedback",
    items: [
      { title: "Banner", href: "/components/banner" },
      { title: "Callout", href: "/components/callout" },
      { title: "Dialog", href: "/components/dialog" },
      { title: "Popover", href: "/components/popover" },
      { title: "Toast", href: "/components/toast" },
      { title: "Tooltip", href: "/components/tooltip" },
      { title: "Progress", href: "/components/progress" },
    ],
  },
  {
    title: "Media",
    items: [
      { title: "Carousel", href: "/components/carousel" },
      { title: "Code", href: "/components/code" },
      { title: "Video Player", href: "/components/video-player" },
      { title: "Rive Player", href: "/components/rive-player" },
      { title: "Three Scene", href: "/components/three-scene" },
      { title: "Shader Preset Preview", href: "/components/shader-preset-preview" },
      { title: "Shader Preset Picker", href: "/components/shader-preset-picker" },
      { title: "Background Fill", href: "/components/background-fill" },
    ],
  },
  {
    // Interactions — drag/drop + motion. New category landed May 2026.
    title: "Interactions",
    items: [
      { title: "Sortable", href: "/components/sortable" },
    ],
  },
  {
    title: "Map",
    items: [
      { title: "Map", href: "/components/map" },
    ],
  },
  {
    // Studio — Grade-specific surfaces (chat, contract-derived props
    // rendering, token visualisers). Renamed from "Blocks" in May 2026.
    title: "Studio",
    items: [
      { title: "Presence", href: "/components/presence" },
      { title: "AI Chat", href: "/components/ai-chat" },
      { title: "Component Props", href: "/components/component-props" },
    ],
  },
];

interface DocsSidebarProps {
  type: "docs" | "components";
}

export function DocsSidebar({ type }: DocsSidebarProps) {
  const pathname = usePathname();
  const nav = type === "docs" ? docsNav : componentsNav;

  return (
    <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
      <div className="relative h-full">
        <div className="h-full py-6 pr-6 lg:py-8 overflow-y-auto scrollbar-none" data-lenis-prevent>
          <div className="w-full pb-12">
            {nav.map((section) => (
              <div key={section.title} className="pb-4">
                <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                  {section.title}
                </h4>
                <div className="grid grid-flow-row auto-rows-max text-sm">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex w-full items-center rounded-md border border-transparent px-2 py-1 transition-colors hover:bg-muted hover:text-foreground",
                        pathname === item.href
                          ? "font-medium text-foreground bg-muted"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom fade gradient */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-6 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>
    </aside>
  );
}
