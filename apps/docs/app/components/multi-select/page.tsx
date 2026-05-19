"use client";

import * as React from "react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

import { MultiSelect } from "@/components/ui/multi-select";
import {
  Boxes,
  Cloud,
  Code2,
  Database,
  Globe,
  Server,
  Terminal,
} from "lucide-react";

const props = [
  {
    name: "options",
    type: "{ value: string; label: string; icon?: ComponentType; disabled?: boolean }[]",
    default: "—",
    description: "The full pool of selectable items.",
  },
  {
    name: "value",
    type: "string[]",
    default: "—",
    description: "Controlled selection. When set, onValueChange must be wired.",
  },
  {
    name: "defaultValue",
    type: "string[]",
    default: "[]",
    description: "Uncontrolled initial selection.",
  },
  {
    name: "onValueChange",
    type: "(next: string[]) => void",
    default: "—",
    description: "Fired with the full next selection on every change.",
  },
  {
    name: "placeholder",
    type: "string",
    default: '"Select…"',
    description: "Trigger text when nothing is selected.",
  },
  {
    name: "maxCount",
    type: "number",
    default: "3",
    description: 'How many selected badges to show on the trigger before collapsing to "+N more".',
  },
  {
    name: "searchable",
    type: "boolean",
    default: "true",
    description: "Show the search input in the dropdown. Hide for short option lists.",
  },
  {
    name: "badgeDismissible",
    type: "boolean",
    default: "true",
    description: "Show the × button on each selected badge.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disable the whole control.",
  },
];

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "solidstart", label: "SolidStart" },
];

const runtimes = [
  { value: "edge", label: "Edge runtime", icon: Cloud },
  { value: "node", label: "Node runtime", icon: Server },
  { value: "browser", label: "Browser only", icon: Code2 },
  { value: "db", label: "Database adapter", icon: Database },
  { value: "shell", label: "Shell scripts", icon: Terminal },
  { value: "cdn", label: "CDN worker", icon: Globe },
  { value: "all", label: "Everything everywhere", icon: Boxes },
];

export default function MultiSelectPage() {
  const [selected, setSelected] = React.useState<string[]>(["next", "remix"]);
  const [runtimeSel, setRuntimeSel] = React.useState<string[]>([
    "edge",
    "node",
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          MultiSelect
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Multi-pick combobox. Selected items render as removable badges in the
          trigger; the dropdown lists every option with a searchable, checkable
          row.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { MultiSelect } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
];

<MultiSelect
  options={frameworks}
  defaultValue={["next", "remix"]}
  onValueChange={setSelected}
  placeholder="Pick frameworks"
  maxCount={2}
/>`}
        >
          <div className="w-full max-w-md">
            <MultiSelect
              options={frameworks}
              value={selected}
              onValueChange={setSelected}
              placeholder="Pick frameworks"
              maxCount={2}
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">With per-option icons</h3>
        <p className="text-sm text-muted-foreground">
          The icon renders both in the dropdown row and on the selected badge.
        </p>
        <ComponentPreview
          code={`import { Cloud, Server, Code2 } from "lucide-react";

const runtimes = [
  { value: "edge", label: "Edge runtime", icon: Cloud },
  { value: "node", label: "Node runtime", icon: Server },
  { value: "browser", label: "Browser only", icon: Code2 },
];

<MultiSelect options={runtimes} placeholder="Select runtimes" />`}
        >
          <div className="w-full max-w-md">
            <MultiSelect
              options={runtimes}
              value={runtimeSel}
              onValueChange={setRuntimeSel}
              placeholder="Select runtimes"
              maxCount={3}
            />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Search hidden</h3>
        <p className="text-sm text-muted-foreground">
          For short lists, pass <code className="font-mono">searchable={`{false}`}</code>{" "}
          so the dropdown opens straight to the options.
        </p>
        <ComponentPreview
          code={`<MultiSelect
  options={frameworks}
  defaultValue={["astro"]}
  searchable={false}
  placeholder="Pick frameworks"
/>`}
        >
          <div className="w-full max-w-md">
            <MultiSelect
              options={frameworks}
              defaultValue={["astro"]}
              searchable={false}
              placeholder="Pick frameworks"
            />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Disabled</h3>
        <ComponentPreview
          code={`<MultiSelect
  options={frameworks}
  defaultValue={["next", "astro"]}
  disabled
  placeholder="Pick frameworks"
/>`}
        >
          <div className="w-full max-w-md">
            <MultiSelect
              options={frameworks}
              defaultValue={["next", "astro"]}
              disabled
              placeholder="Pick frameworks"
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={props} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Trigger is <code className="bg-muted px-1 py-0.5 rounded text-sm">role=&quot;combobox&quot;</code>{" "}
            with <code className="bg-muted px-1 py-0.5 rounded text-sm">aria-expanded</code>{" "}
            wired to the open state.
          </li>
          <li>
            Each removable badge is a focusable <code className="bg-muted px-1 py-0.5 rounded text-sm">role=&quot;button&quot;</code>{" "}
            with an <code className="bg-muted px-1 py-0.5 rounded text-sm">aria-label</code>{" "}
            so screen-reader users can remove items without opening the dropdown.
          </li>
          <li>
            Selection inside the dropdown is keyboard-driven via Command (cmdk):
            ↑/↓ to navigate, ↵ to toggle, Esc to close.
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When NOT to use
        </h2>
        <p className="text-muted-foreground">
          For single-pick reach for <code className="font-mono">&lt;Select&gt;</code>.
          For unbounded / async lists (users to mention, search-as-you-type API
          results) use <code className="font-mono">&lt;Command&gt;</code> directly —
          MultiSelect&rsquo;s <code className="font-mono">options</code> model
          expects the full set up front.
        </p>
      </div>

      <SidecarBlock slug="multi-select" />

      <ComponentNav currentHref="/components/multi-select" />
    </div>
  );
}
