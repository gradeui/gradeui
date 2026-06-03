import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { InstallBlock } from "@/components/install-block";
import { Search, Mail } from "lucide-react";

const inputProps = [
  {
    name: "type",
    type: "string",
    default: '"text"',
    description: "The type of input (text, email, password, etc.).",
  },
  {
    name: "size",
    type: '"default" | "sm" | "xs" | "2xs"',
    default: '"default"',
    description:
      "Control density. default = h-9 (forms); sm = h-8, xs = h-7 and 2xs = h-6 for dense tool panels (the Studio inspector).",
  },
  {
    name: "startSlot",
    type: "ReactNode",
    default: "-",
    description:
      "Adornment inside the leading edge — icon, prefix, currency symbol. Non-interactive by default; clicks pass through to focus the input.",
  },
  {
    name: "endSlot",
    type: "ReactNode",
    default: "-",
    description:
      'Adornment inside the trailing edge — a unit ("px"), a clear button, a stepper. Same pointer rules as startSlot.',
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "Placeholder text displayed when empty.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Whether the input is disabled.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

export default function InputPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Input</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Displays a form input field for user text entry.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Input } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview code={`<Input placeholder="Enter text..." />`}>
          <Input placeholder="Enter text..." className="max-w-sm" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">With Label</h3>
        <ComponentPreview
          code={`<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="name@example.com" />
</div>`}
        >
          <div className="space-y-2 w-full max-w-sm">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Password</h3>
        <ComponentPreview
          code={`<Input type="password" placeholder="Enter password" />`}
        >
          <Input type="password" placeholder="Enter password" className="max-w-sm" />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Sizes</h3>
        <ComponentPreview
          code={`<div className="grid gap-2">
  <Input size="default" placeholder="Default (h-9)" />
  <Input size="sm" placeholder="Small (h-8)" />
  <Input size="xs" placeholder="Extra small (h-7)" />
  <Input size="2xs" placeholder="2x extra small (h-6)" />
</div>`}
        >
          <div className="grid gap-2 w-full max-w-sm">
            <Input size="default" placeholder="Default (h-9)" />
            <Input size="sm" placeholder="Small (h-8)" />
            <Input size="xs" placeholder="Extra small (h-7)" />
            <Input size="2xs" placeholder="2x extra small (h-6)" />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Slots</h3>
        <p className="text-sm text-muted-foreground">
          Use <code className="bg-muted px-1 py-0.5 rounded text-sm">startSlot</code> and{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">endSlot</code> for icons,
          prefixes and units instead of hand-positioning absolute children. Padding is
          reserved automatically per size.
        </p>
        <ComponentPreview
          code={`<Input
  placeholder="Search..."
  startSlot={<Search />}
/>

<Input
  type="number"
  placeholder="0"
  startSlot={<Mail />}
  endSlot={<span className="text-xs text-muted-foreground">px</span>}
/>`}
        >
          <div className="grid gap-2 w-full max-w-sm">
            <Input placeholder="Search..." startSlot={<Search />} />
            <Input
              type="number"
              placeholder="0"
              startSlot={<Mail />}
              endSlot={<span className="text-xs text-muted-foreground">px</span>}
            />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Disabled</h3>
        <ComponentPreview code={`<Input disabled placeholder="Disabled input" />`}>
          <Input disabled placeholder="Disabled input" className="max-w-sm" />
        </ComponentPreview>

        <h3 className="text-lg font-medium">File Input</h3>
        <ComponentPreview code={`<Input type="file" />`}>
          <Input type="file" className="max-w-sm" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={inputProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Uses native <code className="bg-muted px-1 py-0.5 rounded text-sm">&lt;input&gt;</code> element</li>
          <li>Always pair with a Label component for accessibility</li>
          <li>Supports all standard input attributes</li>
          <li>Focus ring visible for keyboard users</li>
        </ul>
      </div>

      <SidecarBlock slug="input" />

      <ComponentNav currentHref="/components/input" />
    </div>
  );
}
