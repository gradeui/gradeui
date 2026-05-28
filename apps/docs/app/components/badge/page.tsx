import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Badge } from "@/components/ui/badge";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { InstallBlock } from "@/components/install-block";
import { Loader2, Check, X, Circle, Zap, AlertTriangle } from "lucide-react";

const badgeProps = [
  {
    name: "variant",
    type: '"default" | "secondary" | "destructive" | "outline" | "highlight" | "success" | "warning" | "info" | "*-soft" | "*-outline"',
    default: '"default"',
    description: "The visual style of the badge. Soft and outline variants available for success, warning, destructive, info, highlight.",
  },
  {
    name: "rounded",
    type: '"default" | "full"',
    default: '"default"',
    description: "The border radius. Use 'full' for pill-shaped badges.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

export default function BadgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Badge</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Displays a badge or label for categorization or status indication.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Badge } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview code={`<Badge>Badge</Badge>`}>
          <Badge>Badge</Badge>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">All Variants</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge>Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="outline">Outline</Badge>
  <Badge variant="destructive">Destructive</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
  <Badge variant="info">Info</Badge>
  <Badge variant="highlight">Highlight</Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="highlight">Highlight</Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Soft Variants</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge variant="success-soft">Success</Badge>
  <Badge variant="warning-soft">Warning</Badge>
  <Badge variant="destructive-soft">Error</Badge>
  <Badge variant="info-soft">Info</Badge>
  <Badge variant="highlight-soft">Highlight</Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="success-soft">Success</Badge>
            <Badge variant="warning-soft">Warning</Badge>
            <Badge variant="destructive-soft">Error</Badge>
            <Badge variant="info-soft">Info</Badge>
            <Badge variant="highlight-soft">Highlight</Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Outline Variants</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge variant="success-outline">Success</Badge>
  <Badge variant="warning-outline">Warning</Badge>
  <Badge variant="destructive-outline">Error</Badge>
  <Badge variant="info-outline">Info</Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="success-outline">Success</Badge>
            <Badge variant="warning-outline">Warning</Badge>
            <Badge variant="destructive-outline">Error</Badge>
            <Badge variant="info-outline">Info</Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Fully Rounded (Pill)</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge rounded="full">Default</Badge>
  <Badge variant="success-soft" rounded="full">Online</Badge>
  <Badge variant="warning-soft" rounded="full">Pending</Badge>
  <Badge variant="info-soft" rounded="full">New</Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge rounded="full">Default</Badge>
            <Badge variant="success-soft" rounded="full">Online</Badge>
            <Badge variant="warning-soft" rounded="full">Pending</Badge>
            <Badge variant="info-soft" rounded="full">New</Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Icons</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge variant="success-soft">
    <Check /> Verified
  </Badge>
  <Badge variant="destructive-soft">
    <X /> Failed
  </Badge>
  <Badge variant="warning-soft">
    <AlertTriangle /> Warning
  </Badge>
  <Badge variant="highlight-soft">
    <Zap /> Active
  </Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="success-soft">
              <Check /> Verified
            </Badge>
            <Badge variant="destructive-soft">
              <X /> Failed
            </Badge>
            <Badge variant="warning-soft">
              <AlertTriangle /> Warning
            </Badge>
            <Badge variant="highlight-soft">
              <Zap /> Active
            </Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Loading State</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge variant="secondary">
    <Loader2 className="animate-spin" /> Loading
  </Badge>
  <Badge variant="info-soft" rounded="full">
    <Loader2 className="animate-spin" /> Syncing
  </Badge>
  <Badge variant="warning-soft">
    <Loader2 className="animate-spin" /> Processing
  </Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Loader2 className="animate-spin" /> Loading
            </Badge>
            <Badge variant="info-soft" rounded="full">
              <Loader2 className="animate-spin" /> Syncing
            </Badge>
            <Badge variant="warning-soft">
              <Loader2 className="animate-spin" /> Processing
            </Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Status with Dot</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge variant="success-soft" rounded="full">
    <Circle className="fill-current" /> Online
  </Badge>
  <Badge variant="warning-soft" rounded="full">
    <Circle className="fill-current" /> Away
  </Badge>
  <Badge variant="destructive-soft" rounded="full">
    <Circle className="fill-current" /> Offline
  </Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="success-soft" rounded="full">
              <Circle className="fill-current" /> Online
            </Badge>
            <Badge variant="warning-soft" rounded="full">
              <Circle className="fill-current" /> Away
            </Badge>
            <Badge variant="destructive-soft" rounded="full">
              <Circle className="fill-current" /> Offline
            </Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Category Tags</h3>
        <ComponentPreview
          code={`<div className="flex flex-wrap gap-2">
  <Badge variant="highlight">New</Badge>
  <Badge variant="info">Beta</Badge>
  <Badge variant="secondary">v2.0</Badge>
</div>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="highlight">New</Badge>
            <Badge variant="info">Beta</Badge>
            <Badge variant="secondary">v2.0</Badge>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">In Context</h3>
        <ComponentPreview
          code={`<div className="flex items-center gap-2">
  <span className="font-medium">Device Status:</span>
  <Badge variant="success-soft">Connected</Badge>
</div>`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">Device Status:</span>
            <Badge variant="success-soft">Connected</Badge>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={badgeProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Badges are decorative by default</li>
          <li>Use meaningful text content for screen readers</li>
          <li>Don't rely solely on color to convey meaning</li>
          <li>Consider adding aria-label for icon-only badges</li>
        </ul>
      </div>

      <SidecarBlock slug="badge" />

      <ComponentNav currentHref="/components/badge" />
    </div>
  );
}
