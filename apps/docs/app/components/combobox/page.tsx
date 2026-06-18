"use client";
import { useState } from "react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { Circle, CircleDot, CircleCheck, SignalLow, SignalMedium, SignalHigh } from "lucide-react";

const priorityOptions = [
  { value: "low", label: "Low", icon: SignalLow },
  { value: "medium", label: "Medium", icon: SignalMedium },
  { value: "high", label: "High", icon: SignalHigh },
];

const statusOptions = [
  { value: "open", label: "Open", icon: Circle },
  { value: "in-progress", label: "In progress", icon: CircleDot },
  { value: "resolved", label: "Resolved", icon: CircleCheck },
];

const PRIORITY_VARIANT = {
  low: "secondary",
  medium: "warning-soft",
  high: "destructive-soft",
};

const comboboxProps = [
  {
    name: "options",
    type: "{ value, label, icon?, keywords?, disabled? }[]",
    default: "-",
    description: "The selectable pool. icon renders in the row (and the trigger); keywords add extra search terms.",
  },
  {
    name: "value / defaultValue",
    type: "string | null",
    default: "null",
    description: "Controlled / uncontrolled selection. Wire onValueChange when controlled.",
  },
  {
    name: "onValueChange",
    type: "(next: string | null) => void",
    default: "-",
    description: "Fired with the next value, or null when cleared.",
  },
  {
    name: "triggerVariant",
    type: '"default" | "inline"',
    default: '"default"',
    description: "default = form-control surface (like Select). inline = chrome-free token trigger; pair with renderValue to render a Badge.",
  },
  {
    name: "renderValue",
    type: "(option) => ReactNode",
    default: "-",
    description: "Render the selected value yourself (e.g. a Badge). Falls back to the option icon + label.",
  },
  {
    name: "searchable",
    type: "boolean",
    default: "true",
    description: "Show the search input. Turn off for short lists.",
  },
  {
    name: "clearable",
    type: "boolean",
    default: "false",
    description: "Add a Clear row so the value can return to unset (null).",
  },
  {
    name: "hideChevron",
    type: "boolean",
    default: "false",
    description: "Drop the trailing chevron — the inline token look.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Lock the control to a read-only display of its current value. Drive this from a permission check.",
  },
];

function InlinePriority() {
  const [priority, setPriority] = useState("medium");
  return (
    <Combobox
      triggerVariant="inline"
      hideChevron
      searchable={false}
      options={priorityOptions}
      value={priority}
      onValueChange={(v) => setPriority(v ?? "medium")}
      renderValue={(opt) => (
        <Badge variant={PRIORITY_VARIANT[opt.value] || "secondary"}>{opt.label}</Badge>
      )}
    />
  );
}

export default function ComboboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Combobox</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Single-pick searchable picker. The single-select sibling of
          MultiSelect, and the Linear &quot;selectable badge&quot; pattern: a
          status or priority value that is itself the trigger and opens a
          searchable command menu. Composes Popover, Command, and Button.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Combobox } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Combobox
  options={[
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ]}
  defaultValue="low"
  placeholder="Set priority"
/>`}
        >
          <div className="w-56">
            <Combobox options={priorityOptions} defaultValue="low" placeholder="Set priority" />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Inline — the value is the trigger</h3>
        <p className="text-muted-foreground">
          triggerVariant=&quot;inline&quot; drops the form chrome; renderValue
          renders the selection as a Badge. The result reads as a selectable
          token, the Linear status / priority move. Click it to change the
          value in place.
        </p>
        <ComponentPreview
          code={`<Combobox
  triggerVariant="inline"
  hideChevron
  searchable={false}
  options={priorityOptions}
  value={priority}
  onValueChange={setPriority}
  renderValue={(opt) => <Badge variant={variantFor(opt)}>{opt.label}</Badge>}
/>`}
        >
          <InlinePriority />
        </ComponentPreview>

        <h3 className="text-lg font-medium">With option icons</h3>
        <p className="text-muted-foreground">
          Per-option icons render in the menu and on the default trigger.
        </p>
        <ComponentPreview
          code={`<Combobox options={statusOptions} defaultValue="in-progress" />`}
        >
          <div className="w-56">
            <Combobox options={statusOptions} defaultValue="in-progress" />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Clearable</h3>
        <p className="text-muted-foreground">
          clearable adds a Clear row so the value can return to unset.
        </p>
        <ComponentPreview
          code={`<Combobox options={statusOptions} defaultValue="open" clearable placeholder="No status" />`}
        >
          <div className="w-56">
            <Combobox options={statusOptions} defaultValue="open" clearable placeholder="No status" />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Read-only (no edit access)</h3>
        <p className="text-muted-foreground">
          disabled shows the value without letting the user change it. Drive it
          from a permission check so a viewer sees the badge but can&apos;t open
          the menu.
        </p>
        <ComponentPreview
          code={`<Combobox
  disabled
  triggerVariant="inline"
  hideChevron
  options={priorityOptions}
  defaultValue="high"
  renderValue={(opt) => <Badge variant="destructive-soft">{opt.label}</Badge>}
/>`}
        >
          <Combobox
            disabled
            triggerVariant="inline"
            hideChevron
            options={priorityOptions}
            defaultValue="high"
            renderValue={(opt) => <Badge variant="destructive-soft">{opt.label}</Badge>}
          />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={comboboxProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to reach for which
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong>Combobox</strong> — one value, searchable, often shown as an
            inline token (status, priority, assignee).
          </li>
          <li>
            <strong>MultiSelect</strong> — several values, rendered as removable
            badges in the trigger.
          </li>
          <li>
            <strong>Select</strong> — a short fixed list with no search.
          </li>
          <li>
            <strong>Command</strong> — unbounded or async lists (a person to
            @-mention), or a command palette.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="combobox" />

      <ComponentNav currentHref="/components/combobox" />
    </div>
  );
}
