"use client";

import * as React from "react";
import { Bell, Search, Plus, MoreHorizontal } from "lucide-react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { InstallBlock } from "@/components/install-block";

import { Toolbar } from "@/components/ui/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Row } from "@/components/ui/row";

const toolbarProps = [
  {
    name: "leading",
    type: "React.ReactNode",
    default: "—",
    description: "Left-aligned region. Logo + primary nav, page-back chevron, etc.",
  },
  {
    name: "center",
    type: "React.ReactNode",
    default: "—",
    description: "Center region — search input, page title, segmented control. Stays visually centered via the grid's 1fr column.",
  },
  {
    name: "trailing",
    type: "React.ReactNode",
    default: "—",
    description: "Right-aligned region. Action icons, notifications, avatar, primary CTA.",
  },
  {
    name: "position",
    type: '"top" | "bottom" | "inline"',
    default: '"top"',
    description: 'Border placement. "top" adds border-bottom, "bottom" adds border-top, "inline" has no border.',
  },
  {
    name: "variant",
    type: '"default" | "subtle" | "transparent"',
    default: '"default"',
    description: "Surface treatment — `default` background, `subtle` muted, `transparent` for layered chrome.",
  },
  {
    name: "size",
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: "Height + horizontal padding. `sm` for section toolbars, `lg` for spacious app chrome.",
  },
  {
    name: "sticky",
    type: "boolean",
    default: "false",
    description: 'Pin to top:0 (when position="top") or bottom:0 (when position="bottom"). Useful inside scrollable containers.',
  },
  {
    name: "aria-label",
    type: "string",
    default: '"Toolbar"',
    description: "Forwarded to the root for screen readers. WAI-ARIA toolbar pattern recommends a clear label per toolbar.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    default: "—",
    description: "Escape hatch — when provided, the slot props are ignored and you own the inner layout. Prefer the slot props.",
  },
];

export default function ToolbarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Toolbar</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Slot-based chrome bar for the leading / center / trailing pattern
          Apple HIG calls a "Toolbar." App window chrome (Reddit, Twitter,
          GitHub, Linear), section toolbars inside Cards, bottom action bars.
          Reach for it any time you&apos;d otherwise hand-roll{" "}
          <code className="font-mono">&lt;Row justify=&quot;between&quot;&gt;</code>{" "}
          with a flex-1 middle child.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Toolbar } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage — app chrome
        </h2>
        <p className="text-sm text-muted-foreground">
          Three slots: logo + nav on the left, search in the middle, actions on the right.
        </p>
        <ComponentPreview
          code={`<Toolbar
  leading={
    <Row gap="sm" align="center">
      <span className="text-base font-bold">Acme</span>
      <Button variant="ghost" size="sm">Home</Button>
      <Button variant="ghost" size="sm">Explore</Button>
    </Row>
  }
  center={<Input placeholder="Search" className="max-w-md" />}
  trailing={
    <Row gap="xs" align="center">
      <Button variant="ghost" size="icon"><Bell /></Button>
      <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
    </Row>
  }
/>`}
        >
          <div className="w-full">
            <Toolbar
              leading={
                <Row gap="sm" align="center">
                  <span className="text-base font-bold">Acme</span>
                  <Button variant="ghost" size="sm">Home</Button>
                  <Button variant="ghost" size="sm">Explore</Button>
                </Row>
              }
              center={<Input placeholder="Search" className="max-w-md" />}
              trailing={
                <Row gap="xs" align="center">
                  <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">AL</AvatarFallback></Avatar>
                </Row>
              }
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage — section toolbar inside a Card
        </h2>
        <p className="text-sm text-muted-foreground">
          <code className="font-mono">size=&quot;sm&quot; variant=&quot;subtle&quot; position=&quot;inline&quot;</code> gives the muted, borderless treatment for a card header strip.
        </p>
        <ComponentPreview
          code={`<Card>
  <Toolbar
    size="sm"
    variant="subtle"
    position="inline"
    leading={<span className="text-sm font-medium">Recent activity</span>}
    trailing={<Button variant="ghost" size="sm">View all</Button>}
  />
  <CardContent>…</CardContent>
</Card>`}
        >
          <Card className="w-full max-w-md">
            <Toolbar
              size="sm"
              variant="subtle"
              position="inline"
              leading={<span className="text-sm font-medium">Recent activity</span>}
              trailing={<Button variant="ghost" size="sm">View all</Button>}
            />
            <CardContent className="text-sm text-muted-foreground p-4">
              Three users joined this week.
            </CardContent>
          </Card>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage — bottom action bar
        </h2>
        <p className="text-sm text-muted-foreground">
          <code className="font-mono">position=&quot;bottom&quot;</code> flips the border to the top edge — common for detail-page Save / Cancel rails.
        </p>
        <ComponentPreview
          code={`<Toolbar
  position="bottom"
  leading={<Button variant="outline" size="sm">Cancel</Button>}
  trailing={<Button size="sm">Save changes</Button>}
/>`}
        >
          <div className="w-full">
            <Toolbar
              position="bottom"
              leading={<Button variant="outline" size="sm">Cancel</Button>}
              trailing={<Button size="sm">Save changes</Button>}
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Slots with multi-element content
        </h2>
        <p className="text-sm text-muted-foreground">
          Each slot accepts any node — pass a <code className="font-mono">Row</code> when you want multiple controls in one slot, including badges, counts, and segmented strips.
        </p>
        <ComponentPreview
          code={`<Toolbar
  leading={
    <Row gap="xs" align="center">
      <span className="text-sm font-semibold">Projects</span>
      <Badge variant="secondary" className="text-[10px]">12</Badge>
    </Row>
  }
  trailing={
    <Row gap="xs">
      <Button variant="ghost" size="icon"><Search /></Button>
      <Button size="sm"><Plus className="mr-1" /> New</Button>
      <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
    </Row>
  }
/>`}
        >
          <div className="w-full">
            <Toolbar
              leading={
                <Row gap="xs" align="center">
                  <span className="text-sm font-semibold">Projects</span>
                  <Badge variant="secondary" className="text-[10px]">12</Badge>
                </Row>
              }
              trailing={
                <Row gap="xs">
                  <Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button>
                  <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New</Button>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </Row>
              }
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Props</h2>
        <PropsTable props={toolbarProps} />
      </div>

      <SidecarBlock slug="toolbar" />

      <ComponentNav currentHref="/components/toolbar" />
    </div>
  );
}
