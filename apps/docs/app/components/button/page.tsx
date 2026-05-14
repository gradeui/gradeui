import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { Mail, Loader2, ChevronRight } from "lucide-react";

const buttonProps = [
  {
    name: "variant",
    type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"',
    default: '"default"',
    description: "The visual style of the button.",
  },
  {
    name: "size",
    type: '"default" | "sm" | "lg" | "icon"',
    default: '"default"',
    description: "The size of the button.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as a child component (e.g., Link).",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Whether the button is disabled.",
  },
];

export default function ButtonPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Button</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Displays a button or a component that looks like a button.
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Button } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Button>Click me</Button>`}
        >
          <Button>Click me</Button>
        </ComponentPreview>
      </div>

      {/* Variants */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Variants
        </h2>

        <h3 className="text-lg font-medium">Default</h3>
        <ComponentPreview code={`<Button variant="default">Default</Button>`}>
          <Button variant="default">Default</Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Secondary</h3>
        <ComponentPreview code={`<Button variant="secondary">Secondary</Button>`}>
          <Button variant="secondary">Secondary</Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Destructive</h3>
        <ComponentPreview code={`<Button variant="destructive">Destructive</Button>`}>
          <Button variant="destructive">Destructive</Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Outline</h3>
        <ComponentPreview code={`<Button variant="outline">Outline</Button>`}>
          <Button variant="outline">Outline</Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Ghost</h3>
        <ComponentPreview code={`<Button variant="ghost">Ghost</Button>`}>
          <Button variant="ghost">Ghost</Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Link</h3>
        <ComponentPreview code={`<Button variant="link">Link</Button>`}>
          <Button variant="link">Link</Button>
        </ComponentPreview>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sizes
        </h2>
        <ComponentPreview
          code={`<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>`}
        >
          <div className="flex items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </ComponentPreview>
      </div>

      {/* With Icon */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          With Icon
        </h2>
        <ComponentPreview
          code={`<Button>
  <Mail className="mr-2 h-4 w-4" /> Login with Email
</Button>`}
        >
          <Button>
            <Mail className="mr-2 h-4 w-4" /> Login with Email
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Icon Only</h3>
        <ComponentPreview code={`<Button size="icon"><ChevronRight className="h-4 w-4" /></Button>`}>
          <Button size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </ComponentPreview>
      </div>

      {/* Loading */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Loading
        </h2>
        <ComponentPreview
          code={`<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Please wait
</Button>`}
        >
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </Button>
        </ComponentPreview>
      </div>

      {/* Props */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={buttonProps} />
      </div>

      {/* Accessibility */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Uses native <code className="bg-muted px-1 py-0.5 rounded text-sm">&lt;button&gt;</code> element</li>
          <li>Supports keyboard navigation (Tab, Enter, Space)</li>
          <li>Disabled state prevents interaction and is announced to screen readers</li>
          <li>Focus ring visible for keyboard users</li>
        </ul>
      </div>

      <SidecarBlock slug="button" />

      <ComponentNav currentHref="/components/button" />
    </div>
  );
}
