"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";
import {
  BarChart3,
  Code2,
  Download,
  Eye,
  Layers,
  Layout,
  Monitor,
  Palette,
  Plus,
  Settings,
  Smartphone,
  StickyNote,
  Tablet,
  User,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const tabsProps = [
  {
    name: "value",
    type: "string",
    default: "-",
    description: "The controlled value of the active tab.",
  },
  {
    name: "defaultValue",
    type: "string",
    default: "-",
    description: "The default value when uncontrolled.",
  },
  {
    name: "onValueChange",
    type: "(value: string) => void",
    default: "-",
    description: "Callback when the active tab changes.",
  },
];

const tabsListProps = [
  {
    name: "size",
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description:
      "T-shirt size for the list and every TabsTrigger inside it (cascades via context). md is the default — compact density that matches the rest of the chrome. sm for dense admin rows, lg for hero / settings pages.",
  },
  {
    name: "variant",
    type: '"pill" | "underlined"',
    default: '"pill"',
    description:
      "pill (default) is the shadcn-style chips on a muted track — app chrome, in-card tab strips. underlined is the minimal text + bottom-border treatment for marketing pages, docs nav, and browser-tab-like layouts. Cascades to every TabsTrigger via context.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description:
      "Extra Tailwind classes. Use for layout (e.g. w-full to span the parent); avoid overriding the visual sizing unless intentional.",
  },
];

const tabsTriggerProps = [
  {
    name: "value",
    type: "string",
    default: "-",
    description: "The value this trigger activates. Must match a TabsContent value.",
  },
  {
    name: "size",
    type: '"sm" | "md" | "lg"',
    default: "inherited",
    description:
      "Override the size inherited from the parent TabsList. Use sparingly — keeping size on the list keeps the row consistent.",
  },
  {
    name: "tooltip",
    type: "React.ReactNode",
    default: "-",
    description:
      "When set, wraps the trigger in the design-system Tooltip primitive. Designed for icon-only triggers — the tooltip text is also applied as aria-label when none is set, so screen readers can name the choice. Requires a TooltipProvider above the tabs.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Prevent the trigger from being selected.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    default: "-",
    description:
      "Trigger content. Pass an icon as a sibling of the label (e.g. <Icon /> Label) — TabsTrigger auto-sizes any SVG child via [&_svg]:size-* and lays it out with the appropriate gap. No icon prop is needed.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description:
      "Extra Tailwind classes. Use for layout (e.g. flex-1 for full-width tabs); avoid overriding the visual styles unless intentional.",
  },
];

export default function TabsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Tabs</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A set of layered sections of content that display one panel at a time.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Tabs, TabsList, TabsTrigger, TabsContent } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <p>Make changes to your account here.</p>
  </TabsContent>
  <TabsContent value="password">
    <p>Change your password here.</p>
  </TabsContent>
</Tabs>`}
        >
          <Tabs defaultValue="account" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <p className="text-sm text-muted-foreground pt-2">Make changes to your account here.</p>
            </TabsContent>
            <TabsContent value="password">
              <p className="text-sm text-muted-foreground pt-2">Change your password here.</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sizes
        </h2>
        <p className="text-sm text-muted-foreground">
          T-shirt sizes: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">sm</code>, <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">md</code> (default), <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">lg</code>. Set on <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">TabsList</code>; the size cascades to every trigger inside via context, so you set it once.
        </p>
        <ComponentPreview
          code={`<Tabs defaultValue="preview">
  <TabsList size="sm">
    <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
    <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
  </TabsList>
</Tabs>

<Tabs defaultValue="preview">
  <TabsList size="md">
    <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
    <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
  </TabsList>
</Tabs>

<Tabs defaultValue="preview">
  <TabsList size="lg">
    <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
    <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
  </TabsList>
</Tabs>`}
        >
          <div className="flex flex-col items-start gap-3">
            <Tabs defaultValue="preview">
              <TabsList size="sm">
                <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
                <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="preview">
              <TabsList size="md">
                <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
                <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="preview">
              <TabsList size="lg">
                <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
                <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Variants
        </h2>
        <p className="text-sm text-muted-foreground">
          Two looks, set on <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">TabsList</code> and cascaded to every trigger.
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded ml-1">pill</code> (default) is the chip-on-muted treatment for app chrome;
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded ml-1">underlined</code> is the minimal text + bottom-border look for marketing and docs nav.
        </p>
        <ComponentPreview
          code={`<Tabs defaultValue="account">
  <TabsList variant="pill">
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
</Tabs>

<Tabs defaultValue="account">
  <TabsList variant="underlined">
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
</Tabs>`}
        >
          <div className="flex flex-col items-start gap-5">
            <Tabs defaultValue="account">
              <TabsList variant="pill">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="account">
              <TabsList variant="underlined">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Icons
        </h2>
        <p className="text-sm text-muted-foreground">
          Pass an icon as a sibling of the label inside <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">TabsTrigger</code>.
          The component handles sizing and spacing automatically — any <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">&lt;svg&gt;</code> child is set to <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">size-3.5</code> (14&thinsp;px) and laid out with <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">gap-1.5</code> against the label.
          No <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">icon</code> prop, no per-call sizing.
        </p>

        <h3 className="text-lg font-medium">Icon and label</h3>
        <ComponentPreview
          code={`import { Eye, Code2 } from "lucide-react";

<Tabs defaultValue="preview">
  <TabsList>
    <TabsTrigger value="preview">
      <Eye />
      Preview
    </TabsTrigger>
    <TabsTrigger value="code">
      <Code2 />
      Code
    </TabsTrigger>
  </TabsList>
  <TabsContent value="preview">
    <p>Rendered preview goes here.</p>
  </TabsContent>
  <TabsContent value="code">
    <p>Source code goes here.</p>
  </TabsContent>
</Tabs>`}
        >
          <Tabs defaultValue="preview" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="preview">
                <Eye />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code2 />
                Code
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <p className="text-sm text-muted-foreground pt-2">Rendered preview goes here.</p>
            </TabsContent>
            <TabsContent value="code">
              <p className="text-sm text-muted-foreground pt-2">Source code goes here.</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Icon only</h3>
        <p className="text-sm text-muted-foreground">
          Omit the label entirely for compact icon-only tabs. Pass a <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">tooltip</code> prop and the component wraps the trigger in the design-system <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Tooltip</code> automatically — the same string is also applied as <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">aria-label</code> when not set explicitly, so screen readers always have an accessible name. Requires a <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">TooltipProvider</code> above the tabs (the design system root layout mounts one app-wide).
        </p>
        <ComponentPreview
          code={`import { Smartphone, Tablet, Monitor } from "lucide-react";

<Tabs defaultValue="desktop">
  <TabsList>
    <TabsTrigger value="mobile" tooltip="Mobile">
      <Smartphone />
    </TabsTrigger>
    <TabsTrigger value="tablet" tooltip="Tablet">
      <Tablet />
    </TabsTrigger>
    <TabsTrigger value="desktop" tooltip="Desktop">
      <Monitor />
    </TabsTrigger>
  </TabsList>
</Tabs>`}
        >
          <Tabs defaultValue="desktop" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="mobile" tooltip="Mobile">
                <Smartphone />
              </TabsTrigger>
              <TabsTrigger value="tablet" tooltip="Tablet">
                <Tablet />
              </TabsTrigger>
              <TabsTrigger value="desktop" tooltip="Desktop">
                <Monitor />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Icon-led navigation</h3>
        <p className="text-sm text-muted-foreground">
          A common pattern: every tab carries an icon for fast visual scanning, plus a label for clarity.
          Pair with the full-width <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">flex-1</code> trick if you want the strip to fill its container.
        </p>
        <ComponentPreview
          code={`import { Layers, Palette, StickyNote } from "lucide-react";

<Tabs defaultValue="layout" className="w-full">
  <TabsList className="w-full">
    <TabsTrigger value="layout" className="flex-1">
      <Layers />
      Layout
    </TabsTrigger>
    <TabsTrigger value="theme" className="flex-1">
      <Palette />
      Theme
    </TabsTrigger>
    <TabsTrigger value="notes" className="flex-1">
      <StickyNote />
      Notes
    </TabsTrigger>
  </TabsList>
  <TabsContent value="layout">
    <p>Layout controls.</p>
  </TabsContent>
  <TabsContent value="theme">
    <p>Theme controls.</p>
  </TabsContent>
  <TabsContent value="notes">
    <p>Free-form notes.</p>
  </TabsContent>
</Tabs>`}
        >
          <Tabs defaultValue="layout" className="w-full max-w-md">
            <TabsList className="w-full">
              <TabsTrigger value="layout" className="flex-1">
                <Layers />
                Layout
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex-1">
                <Palette />
                Theme
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                <StickyNote />
                Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="layout">
              <p className="text-sm text-muted-foreground pt-2">Layout controls.</p>
            </TabsContent>
            <TabsContent value="theme">
              <p className="text-sm text-muted-foreground pt-2">Theme controls.</p>
            </TabsContent>
            <TabsContent value="notes">
              <p className="text-sm text-muted-foreground pt-2">Free-form notes.</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Composing with buttons
        </h2>
        <p className="text-sm text-muted-foreground">
          Tabs and <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Button</code> both consume the theme&rsquo;s <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">--radius</code> token, so their corner rounding always matches without per-call overrides. Switch the active theme&rsquo;s radius (sharp / subtle / round / pill) and both primitives follow.
        </p>

        <h3 className="text-lg font-medium">Toolbar row</h3>
        <p className="text-sm text-muted-foreground">
          A common pattern: a tab strip on the left, action buttons on the right. Pair <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">TabsList size=&quot;md&quot;</code> with <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Button size=&quot;sm&quot;</code> — they read as the same row of chrome.
        </p>
        <ComponentPreview
          code={`<div className="flex items-center justify-between gap-3">
  <Tabs defaultValue="overview">
    <TabsList size="md">
      <TabsTrigger value="overview"><Layout /> Overview</TabsTrigger>
      <TabsTrigger value="analytics"><BarChart3 /> Analytics</TabsTrigger>
      <TabsTrigger value="settings"><Settings /> Settings</TabsTrigger>
    </TabsList>
  </Tabs>
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="sm">
      <Download /> Export
    </Button>
    <Button size="sm">
      <Plus /> Add
    </Button>
  </div>
</div>`}
        >
          <div className="flex w-full items-center justify-between gap-3">
            <Tabs defaultValue="overview">
              <TabsList size="md">
                <TabsTrigger value="overview"><Layout /> Overview</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 /> Analytics</TabsTrigger>
                <TabsTrigger value="settings"><Settings /> Settings</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Download /> Export
              </Button>
              <Button size="sm">
                <Plus /> Add
              </Button>
            </div>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Size pairing reference</h3>
        <p className="text-sm text-muted-foreground">
          T-shirt sizes match EXACTLY in outer height between primitives:
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded ml-1">TabsList size=&quot;sm&quot;</code> = <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Button size=&quot;sm&quot;</code> = 28&thinsp;px,
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded ml-1">md</code> = 32&thinsp;px,
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded ml-1">lg</code> = 40&thinsp;px.
          A button next to a tab strip lines up at every size, with or without icons on either side.
        </p>

        <h4 className="text-sm font-medium text-muted-foreground pt-2">Plain — no icons</h4>
        <ComponentPreview
          code={`<div className="flex items-center gap-2">
  <Tabs defaultValue="a">
    <TabsList size="sm">
      <TabsTrigger value="a">One</TabsTrigger>
      <TabsTrigger value="b">Two</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="sm">Save</Button>
</div>

<div className="flex items-center gap-2">
  <Tabs defaultValue="a">
    <TabsList size="md">
      <TabsTrigger value="a">One</TabsTrigger>
      <TabsTrigger value="b">Two</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="md">Save</Button>
</div>

<div className="flex items-center gap-2">
  <Tabs defaultValue="a">
    <TabsList size="lg">
      <TabsTrigger value="a">One</TabsTrigger>
      <TabsTrigger value="b">Two</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="lg">Save</Button>
</div>`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Small (sm)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="a">
                  <TabsList size="sm">
                    <TabsTrigger value="a">One</TabsTrigger>
                    <TabsTrigger value="b">Two</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="sm">Save</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Medium (md)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="a">
                  <TabsList size="md">
                    <TabsTrigger value="a">One</TabsTrigger>
                    <TabsTrigger value="b">Two</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="md">Save</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Large (lg)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="a">
                  <TabsList size="lg">
                    <TabsTrigger value="a">One</TabsTrigger>
                    <TabsTrigger value="b">Two</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="lg">Save</Button>
              </div>
            </div>
          </div>
        </ComponentPreview>

        <h4 className="text-sm font-medium text-muted-foreground pt-2">Tabs with icons + buttons without icons</h4>
        <ComponentPreview
          code={`<div className="flex items-center gap-2">
  <Tabs defaultValue="preview">
    <TabsList size="sm">
      <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
      <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="sm">Save</Button>
</div>

<div className="flex items-center gap-2">
  <Tabs defaultValue="preview">
    <TabsList size="md">
      <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
      <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="md">Save</Button>
</div>

<div className="flex items-center gap-2">
  <Tabs defaultValue="preview">
    <TabsList size="lg">
      <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
      <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="lg">Save</Button>
</div>`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Small (sm)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="preview">
                  <TabsList size="sm">
                    <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
                    <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="sm">Save</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Medium (md)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="preview">
                  <TabsList size="md">
                    <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
                    <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="md">Save</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Large (lg)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="preview">
                  <TabsList size="lg">
                    <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
                    <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="lg">Save</Button>
              </div>
            </div>
          </div>
        </ComponentPreview>

        <h4 className="text-sm font-medium text-muted-foreground pt-2">Tabs without icons + buttons with icons</h4>
        <ComponentPreview
          code={`<div className="flex items-center gap-2">
  <Tabs defaultValue="a">
    <TabsList size="sm">
      <TabsTrigger value="a">One</TabsTrigger>
      <TabsTrigger value="b">Two</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="sm"><Download /> Export</Button>
</div>

<div className="flex items-center gap-2">
  <Tabs defaultValue="a">
    <TabsList size="md">
      <TabsTrigger value="a">One</TabsTrigger>
      <TabsTrigger value="b">Two</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="md"><Download /> Export</Button>
</div>

<div className="flex items-center gap-2">
  <Tabs defaultValue="a">
    <TabsList size="lg">
      <TabsTrigger value="a">One</TabsTrigger>
      <TabsTrigger value="b">Two</TabsTrigger>
    </TabsList>
  </Tabs>
  <Button size="lg"><Download /> Export</Button>
</div>`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Small (sm)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="a">
                  <TabsList size="sm">
                    <TabsTrigger value="a">One</TabsTrigger>
                    <TabsTrigger value="b">Two</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="sm"><Download /> Export</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Medium (md)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="a">
                  <TabsList size="md">
                    <TabsTrigger value="a">One</TabsTrigger>
                    <TabsTrigger value="b">Two</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="md"><Download /> Export</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Large (lg)
              </span>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="a">
                  <TabsList size="lg">
                    <TabsTrigger value="a">One</TabsTrigger>
                    <TabsTrigger value="b">Two</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="lg"><Download /> Export</Button>
              </div>
            </div>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Full Width Tabs</h3>
        <ComponentPreview
          code={`<Tabs defaultValue="day" className="w-full">
  <TabsList className="w-full">
    <TabsTrigger value="day" className="flex-1">Day</TabsTrigger>
    <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
    <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
    <TabsTrigger value="year" className="flex-1">Year</TabsTrigger>
  </TabsList>
  <TabsContent value="day">
    <p className="text-sm text-muted-foreground pt-2">Daily view content</p>
  </TabsContent>
  <TabsContent value="week">
    <p className="text-sm text-muted-foreground pt-2">Weekly view content</p>
  </TabsContent>
  <TabsContent value="month">
    <p className="text-sm text-muted-foreground pt-2">Monthly view content</p>
  </TabsContent>
  <TabsContent value="year">
    <p className="text-sm text-muted-foreground pt-2">Yearly view content</p>
  </TabsContent>
</Tabs>`}
        >
          <Tabs defaultValue="day" className="w-full max-w-md">
            <TabsList className="w-full">
              <TabsTrigger value="day" className="flex-1">Day</TabsTrigger>
              <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
              <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
              <TabsTrigger value="year" className="flex-1">Year</TabsTrigger>
            </TabsList>
            <TabsContent value="day">
              <p className="text-sm text-muted-foreground pt-2">Daily view content</p>
            </TabsContent>
            <TabsContent value="week">
              <p className="text-sm text-muted-foreground pt-2">Weekly view content</p>
            </TabsContent>
            <TabsContent value="month">
              <p className="text-sm text-muted-foreground pt-2">Monthly view content</p>
            </TabsContent>
            <TabsContent value="year">
              <p className="text-sm text-muted-foreground pt-2">Yearly view content</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Content Panels</h3>
        <ComponentPreview
          code={`<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">
      <Layout />
      Overview
    </TabsTrigger>
    <TabsTrigger value="activity">
      <BarChart3 />
      Activity
    </TabsTrigger>
    <TabsTrigger value="members">
      <User />
      Members
    </TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <div className="rounded-lg border p-4 mt-2">
      <div className="text-2xl font-bold">1,284</div>
      <p className="text-sm text-muted-foreground">Total events this month</p>
    </div>
  </TabsContent>
  <TabsContent value="activity">
    <div className="rounded-lg border p-4 mt-2">
      <div className="text-2xl font-bold">92%</div>
      <p className="text-sm text-muted-foreground">Active users this week</p>
    </div>
  </TabsContent>
  <TabsContent value="members">
    <div className="rounded-lg border p-4 mt-2">
      <div className="text-2xl font-bold">24</div>
      <p className="text-sm text-muted-foreground">People in the workspace</p>
    </div>
  </TabsContent>
</Tabs>`}
        >
          <Tabs defaultValue="overview" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="overview">
                <Layout />
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity">
                <BarChart3 />
                Activity
              </TabsTrigger>
              <TabsTrigger value="members">
                <User />
                Members
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="rounded-lg border p-4 mt-2">
                <div className="text-2xl font-bold">1,284</div>
                <p className="text-sm text-muted-foreground">Total events this month</p>
              </div>
            </TabsContent>
            <TabsContent value="activity">
              <div className="rounded-lg border p-4 mt-2">
                <div className="text-2xl font-bold">92%</div>
                <p className="text-sm text-muted-foreground">Active users this week</p>
              </div>
            </TabsContent>
            <TabsContent value="members">
              <div className="rounded-lg border p-4 mt-2">
                <div className="text-2xl font-bold">24</div>
                <p className="text-sm text-muted-foreground">People in the workspace</p>
              </div>
            </TabsContent>
          </Tabs>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Tabs props
        </h2>
        <PropsTable props={tabsProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          TabsList props
        </h2>
        <PropsTable props={tabsListProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          TabsTrigger props
        </h2>
        <PropsTable props={tabsTriggerProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Built on Radix UI Tabs for full accessibility</li>
          <li>Keyboard navigation (Arrow keys, Home, End)</li>
          <li>WAI-ARIA tablist pattern</li>
          <li>Tab panels are properly associated with triggers</li>
          <li>For icon-only triggers, always pair with an <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">aria-label</code> so the choice has an accessible name</li>
        </ul>
      </div>

      <SidecarBlock slug="tabs" />

      <ComponentNav currentHref="/components/tabs" />
    </div>
  );
}
