import { ComponentNav } from "@/components/component-nav";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const labelProps = [
  {
    name: "htmlFor",
    type: "string",
    default: "-",
    description: "The id of the element the label is associated with.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

export default function LabelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Label</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Renders an accessible label associated with form controls.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Label } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
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
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">With Input</h3>
        <ComponentPreview
          code={`<div className="grid w-full max-w-sm gap-1.5">
  <Label htmlFor="project-name">Project Name</Label>
  <Input id="project-name" placeholder="e.g. Marketing Site" />
</div>`}
        >
          <div className="grid w-full max-w-sm gap-1.5">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" placeholder="e.g. Marketing Site" />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Checkbox</h3>
        <ComponentPreview
          code={`<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>`}
        >
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Required Field</h3>
        <ComponentPreview
          code={`<div className="grid w-full max-w-sm gap-1.5">
  <Label htmlFor="serial">
    Serial Number <span className="text-destructive">*</span>
  </Label>
  <Input id="serial" placeholder="Enter serial number" required />
</div>`}
        >
          <div className="grid w-full max-w-sm gap-1.5">
            <Label htmlFor="serial">
              Serial Number <span className="text-destructive">*</span>
            </Label>
            <Input id="serial" placeholder="Enter serial number" required />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Helper Text</h3>
        <ComponentPreview
          code={`<div className="grid w-full max-w-sm gap-1.5">
  <Label htmlFor="api-key">API Key</Label>
  <Input id="api-key" type="password" />
  <p className="text-sm text-muted-foreground">
    Your API key can be found in settings.
  </p>
</div>`}
        >
          <div className="grid w-full max-w-sm gap-1.5">
            <Label htmlFor="api-key">API Key</Label>
            <Input id="api-key" type="password" />
            <p className="text-sm text-muted-foreground">
              Your API key can be found in settings.
            </p>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Disabled State</h3>
        <ComponentPreview
          code={`<div className="grid w-full max-w-sm gap-1.5">
  <Label htmlFor="disabled" className="text-muted-foreground">
    Disabled Field
  </Label>
  <Input id="disabled" disabled placeholder="Cannot edit" />
</div>`}
        >
          <div className="grid w-full max-w-sm gap-1.5">
            <Label htmlFor="disabled" className="text-muted-foreground">
              Disabled Field
            </Label>
            <Input id="disabled" disabled placeholder="Cannot edit" />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={labelProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Built on Radix UI Label for proper accessibility</li>
          <li>Clicking the label focuses the associated control</li>
          <li>Screen readers announce the label with the control</li>
          <li>Always use htmlFor to associate with form controls</li>
        </ul>
      </div>

      <ComponentNav currentHref="/components/label" />
    </div>
  );
}
