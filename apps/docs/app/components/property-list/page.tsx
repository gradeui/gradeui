"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { PropertyList } from "@/components/ui/property-list";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Row } from "@/components/ui/row";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { Activity, BarChart3, Calendar, Users } from "lucide-react";

const propertyListProps = [
  {
    name: "layout",
    type: '"row" | "stack"',
    default: '"row"',
    description:
      "row = label column beside the value. stack = label sits above the value — for narrow panels and inspectors.",
  },
  {
    name: "density",
    type: '"compact" | "default" | "relaxed"',
    default: '"default"',
    description: "Row rhythm. compact for dense inspectors, relaxed for airy settings pages.",
  },
  {
    name: "align",
    type: '"start" | "center"',
    default: '"center"',
    description:
      "Default vertical alignment of label against value. Use start when values wrap (tag groups, multi-line text).",
  },
  {
    name: "divider",
    type: "boolean",
    default: "false",
    description: "Draw a hairline rule between rows.",
  },
  {
    name: "labelWidth",
    type: "string",
    default: '"8.5rem"',
    description:
      "Override the label column width (any CSS length). Sets --gds-property-list-label-width for every row.",
  },
];

const rowProps = [
  {
    name: "label",
    type: "ReactNode",
    default: "-",
    description: "The property name (rendered as the dt).",
  },
  {
    name: "icon",
    type: "ReactNode",
    default: "-",
    description: "Optional leading glyph, rendered muted at --gds-property-list-icon-size.",
  },
  {
    name: "value",
    type: "ReactNode",
    default: "-",
    description:
      "The value. Provide here or as children. Polymorphic — text, Badge, tag group, Avatar stack, date, link, anything.",
  },
  {
    name: "align",
    type: '"start" | "center"',
    default: "inherits",
    description: "Per-row override of the list's vertical alignment.",
  },
];

export default function PropertyListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Property List
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Read-only display of the properties of a single item — a Table row
          transposed. The value side is a polymorphic slot, so the same
          renderers that fill a Table cell (a Badge, an avatar stack, a date, a
          tag group) drop straight into a row. Detail panels, inspectors,
          record summaries.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { PropertyList } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<PropertyList>
  <PropertyList.Row label="Status" icon={<Activity />}>
    <Badge variant="warning-soft">Low</Badge>
  </PropertyList.Row>
  <PropertyList.Row label="Published">2026-06-18</PropertyList.Row>
  <PropertyList.Row label="Owner">
    <Avatar className="h-5 w-5"><AvatarFallback>EO</AvatarFallback></Avatar>
  </PropertyList.Row>
</PropertyList>`}
        >
          <div className="w-full max-w-md">
            <PropertyList>
              <PropertyList.Row label="Status" icon={<Activity />}>
                <Badge variant="warning-soft">Low</Badge>
              </PropertyList.Row>
              <PropertyList.Row label="Published">2026-06-18</PropertyList.Row>
              <PropertyList.Row label="Owner">
                <Row gap="xs" align="center">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>EO</AvatarFallback>
                  </Avatar>
                  <span>Elena Okafor</span>
                </Row>
              </PropertyList.Row>
            </PropertyList>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Polymorphic values</h3>
        <p className="text-muted-foreground">
          The value is a slot, not a string. A single row can hold a status
          pill, a priority, a wrapping tag group, an avatar stack, or a date —
          whatever the field is.
        </p>
        <ComponentPreview
          code={`<PropertyList align="start" divider>
  <PropertyList.Row label="Impact" icon={<Activity />}>
    <Badge variant="outline">Open · Not started</Badge>
  </PropertyList.Row>
  <PropertyList.Row label="Priority" icon={<BarChart3 />}>
    <Badge variant="warning-soft">Low</Badge>
  </PropertyList.Row>
  <PropertyList.Row label="Topics">
    <Row gap="xs" wrap>
      <Badge variant="secondary">Pricing</Badge>
      <Badge variant="secondary">Onboarding</Badge>
      <Badge variant="secondary">Billing</Badge>
    </Row>
  </PropertyList.Row>
  <PropertyList.Row label="Team" icon={<Users />}>
    <Row gap="none">{/* avatar stack */}</Row>
  </PropertyList.Row>
  <PropertyList.Row label="Published" icon={<Calendar />}>2026-06-18</PropertyList.Row>
</PropertyList>`}
        >
          <div className="w-full max-w-md">
            <PropertyList align="start" divider>
              <PropertyList.Row label="Impact" icon={<Activity />}>
                <Badge variant="outline">Open · Not started</Badge>
              </PropertyList.Row>
              <PropertyList.Row label="Priority" icon={<BarChart3 />}>
                <Badge variant="warning-soft">Low</Badge>
              </PropertyList.Row>
              <PropertyList.Row label="Topics">
                <Row gap="xs" wrap>
                  <Badge variant="secondary">Pricing</Badge>
                  <Badge variant="secondary">Onboarding</Badge>
                  <Badge variant="secondary">Billing</Badge>
                </Row>
              </PropertyList.Row>
              <PropertyList.Row label="Team" icon={<Users />}>
                <div className="flex -space-x-2">
                  {["EO", "ML", "PD"].map((i) => (
                    <Avatar key={i} className="h-6 w-6 ring-2 ring-background">
                      <AvatarFallback className="text-[10px]">{i}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </PropertyList.Row>
              <PropertyList.Row label="Published" icon={<Calendar />}>
                2026-06-18
              </PropertyList.Row>
            </PropertyList>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Compact inspector</h3>
        <p className="text-muted-foreground">
          density=&quot;compact&quot; with a tighter labelWidth — the shape you
          want in a side inspector or popover.
        </p>
        <ComponentPreview
          code={`<PropertyList density="compact" labelWidth="6rem">
  <PropertyList.Row label="Type">Alert</PropertyList.Row>
  <PropertyList.Row label="Status"><Badge variant="success-soft">Active</Badge></PropertyList.Row>
  <PropertyList.Row label="Comments">12</PropertyList.Row>
</PropertyList>`}
        >
          <div className="w-full max-w-xs rounded-lg border border-border bg-card p-4">
            <PropertyList density="compact" labelWidth="6rem">
              <PropertyList.Row label="Type">Alert</PropertyList.Row>
              <PropertyList.Row label="Status">
                <Badge variant="success-soft">Active</Badge>
              </PropertyList.Row>
              <PropertyList.Row label="Comments">12</PropertyList.Row>
            </PropertyList>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Stacked layout</h3>
        <p className="text-muted-foreground">
          layout=&quot;stack&quot; drops the label above the value — for very
          narrow columns where a side-by-side label would crush the value.
        </p>
        <ComponentPreview
          code={`<PropertyList layout="stack" density="relaxed">
  <PropertyList.Row label="Business profiles">
    <Row gap="xs" wrap>
      <Badge variant="outline">Acme</Badge>
      <Badge variant="outline">Kite</Badge>
    </Row>
  </PropertyList.Row>
  <PropertyList.Row label="Owner">Elena Okafor</PropertyList.Row>
</PropertyList>`}
        >
          <div className="w-44 rounded-lg border border-border bg-card p-4">
            <PropertyList layout="stack" density="relaxed">
              <PropertyList.Row label="Business profiles">
                <Row gap="xs" wrap>
                  <Badge variant="outline">Acme</Badge>
                  <Badge variant="outline">Kite</Badge>
                </Row>
              </PropertyList.Row>
              <PropertyList.Row label="Owner">Elena Okafor</PropertyList.Row>
            </PropertyList>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={propertyListProps} />
        <h3 className="text-lg font-medium">PropertyList.Row</h3>
        <PropsTable props={rowProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Renders a real description list: a <code>&lt;dl&gt;</code> with{" "}
            <code>&lt;dt&gt;</code> / <code>&lt;dd&gt;</code> pairs, so it is
            announced as term/definition content.
          </li>
          <li>
            Decorative row icons are <code>aria-hidden</code> — the label text
            carries the meaning.
          </li>
          <li>
            It is a display primitive. For an editable label + control, use{" "}
            <code>Field</code>; a read↔edit detail panel swaps PropertyList for
            a stack of Fields.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="property-list" />

      <ComponentNav currentHref="/components/property-list" />
    </div>
  );
}
