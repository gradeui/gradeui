"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";

import { Callout, CalloutDescription, CalloutTitle } from "@/components/ui/callout";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

const calloutProps = [
  {
    name: "variant",
    type: '"default" | "destructive" | "success" | "warning" | "info"',
    default: '"default"',
    description: "The visual style of the callout.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

export default function CalloutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Callout</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Inline, ambient, non-blocking status / feedback that sits inside the layout flow.
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
          Renamed from <code className="font-mono">Alert</code> in May 2026. The old name implied
          modal/interruptive behaviour the component doesn&rsquo;t have — Apple HIG &ldquo;Alert&rdquo; is
          a modal, and <code className="font-mono">role=&quot;alert&quot;</code> is assertive ARIA.
          Callout is honest about what it is. For genuinely interruptive needs, reach for{" "}
          <code className="font-mono">&lt;Dialog&gt;</code>.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Callout, CalloutTitle, CalloutDescription } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Callout>
  <CalloutTitle>Heads up!</CalloutTitle>
  <CalloutDescription>
    You can add components to your app using the CLI.
  </CalloutDescription>
</Callout>`}
        >
          <Callout className="w-full max-w-lg">
            <CalloutTitle>Heads up!</CalloutTitle>
            <CalloutDescription>
              You can add components to your app using the CLI.
            </CalloutDescription>
          </Callout>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">With icon</h3>
        <ComponentPreview
          code={`<Callout>
  <Info className="h-4 w-4" />
  <CalloutTitle>Note</CalloutTitle>
  <CalloutDescription>
    This is an informational message with an icon.
  </CalloutDescription>
</Callout>`}
        >
          <Callout className="w-full max-w-lg">
            <Info className="h-4 w-4" />
            <CalloutTitle>Note</CalloutTitle>
            <CalloutDescription>
              This is an informational message with an icon.
            </CalloutDescription>
          </Callout>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Destructive</h3>
        <ComponentPreview
          code={`<Callout variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <CalloutTitle>Error</CalloutTitle>
  <CalloutDescription>
    Your session has expired. Please log in again.
  </CalloutDescription>
</Callout>`}
        >
          <Callout variant="destructive" className="w-full max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <CalloutTitle>Error</CalloutTitle>
            <CalloutDescription>
              Your session has expired. Please log in again.
            </CalloutDescription>
          </Callout>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Success</h3>
        <ComponentPreview
          code={`<Callout variant="success">
  <CheckCircle2 className="h-4 w-4" />
  <CalloutTitle>Success</CalloutTitle>
  <CalloutDescription>
    Your changes have been saved.
  </CalloutDescription>
</Callout>`}
        >
          <Callout variant="success" className="w-full max-w-lg">
            <CheckCircle2 className="h-4 w-4" />
            <CalloutTitle>Success</CalloutTitle>
            <CalloutDescription>
              Your changes have been saved.
            </CalloutDescription>
          </Callout>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Warning</h3>
        <ComponentPreview
          code={`<Callout variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <CalloutTitle>Warning</CalloutTitle>
  <CalloutDescription>
    Your session will expire in 5 minutes. Save your work.
  </CalloutDescription>
</Callout>`}
        >
          <Callout variant="warning" className="w-full max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <CalloutTitle>Warning</CalloutTitle>
            <CalloutDescription>
              Your session will expire in 5 minutes. Save your work.
            </CalloutDescription>
          </Callout>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Info</h3>
        <ComponentPreview
          code={`<Callout variant="info">
  <Info className="h-4 w-4" />
  <CalloutTitle>Did you know?</CalloutTitle>
  <CalloutDescription>
    Press ⌘K anywhere to open the command palette.
  </CalloutDescription>
</Callout>`}
        >
          <Callout variant="info" className="w-full max-w-lg">
            <Info className="h-4 w-4" />
            <CalloutTitle>Did you know?</CalloutTitle>
            <CalloutDescription>
              Press ⌘K anywhere to open the command palette.
            </CalloutDescription>
          </Callout>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={calloutProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            ARIA role is conditional on variant: <code className="bg-muted px-1 py-0.5 rounded text-sm">role=&quot;alert&quot;</code> (assertive — screen
            readers interrupt) for <code className="bg-muted px-1 py-0.5 rounded text-sm">warning</code> and{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">destructive</code>;{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">role=&quot;status&quot;</code> (polite — announces after current speech)
            for <code className="bg-muted px-1 py-0.5 rounded text-sm">info</code>,{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">success</code>, and{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">default</code>.
          </li>
          <li>Icons should have appropriate aria-labels.</li>
          <li>Colour is never the sole indicator of variant — title + description carry the same signal.</li>
          <li>Pass <code className="bg-muted px-1 py-0.5 rounded text-sm">role</code> explicitly to override the default mapping.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          What about the <code className="font-mono">highlight</code> variant?
        </h2>
        <p className="text-muted-foreground">
          Dropped in the Alert → Callout rename. It overlapped <code className="font-mono">warning</code>{" "}
          semantically without a distinct intent. Reach for <code className="font-mono">warning</code>{" "}
          for amber attention, <code className="font-mono">info</code> for neutral attention.
        </p>
      </div>

      <SidecarBlock slug="callout" />

      <ComponentNav currentHref="/components/callout" />
    </div>
  );
}
