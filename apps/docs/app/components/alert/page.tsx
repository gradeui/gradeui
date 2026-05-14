"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { AlertCircle, CheckCircle2, Info, Zap, AlertTriangle, Sparkles } from "lucide-react";

const alertProps = [
  {
    name: "variant",
    type: '"default" | "destructive" | "success" | "warning" | "info" | "highlight"',
    default: '"default"',
    description: "The visual style of the alert.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

export default function AlertPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Alert</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Displays a callout for user attention with contextual feedback.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Alert, AlertTitle, AlertDescription } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the CLI.
  </AlertDescription>
</Alert>`}
        >
          <Alert className="w-full max-w-lg">
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the CLI.
            </AlertDescription>
          </Alert>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">With Icon</h3>
        <ComponentPreview
          code={`<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>
    This is an informational message with an icon.
  </AlertDescription>
</Alert>`}
        >
          <Alert className="w-full max-w-lg">
            <Info className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              This is an informational message with an icon.
            </AlertDescription>
          </Alert>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Destructive</h3>
        <ComponentPreview
          code={`<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>`}
        >
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Success</h3>
        <ComponentPreview
          code={`<Alert variant="success">
  <CheckCircle2 className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Your changes have been saved.
  </AlertDescription>
</Alert>`}
        >
          <Alert variant="success" className="w-full max-w-lg">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your changes have been saved.
            </AlertDescription>
          </Alert>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Warning</h3>
        <ComponentPreview
          code={`<Alert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    Your session will expire in 5 minutes. Save your work.
  </AlertDescription>
</Alert>`}
        >
          <Alert variant="warning" className="w-full max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Your session will expire in 5 minutes. Save your work.
            </AlertDescription>
          </Alert>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Info</h3>
        <ComponentPreview
          code={`<Alert variant="info">
  <Info className="h-4 w-4" />
  <AlertTitle>Did you know?</AlertTitle>
  <AlertDescription>
    Press ⌘K anywhere to open the command palette.
  </AlertDescription>
</Alert>`}
        >
          <Alert variant="info" className="w-full max-w-lg">
            <Info className="h-4 w-4" />
            <AlertTitle>Did you know?</AlertTitle>
            <AlertDescription>
              Press ⌘K anywhere to open the command palette.
            </AlertDescription>
          </Alert>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Highlight</h3>
        <ComponentPreview
          code={`<Alert variant="highlight">
  <Sparkles className="h-4 w-4" />
  <AlertTitle>New feature</AlertTitle>
  <AlertDescription>
    The theme switcher is now live — try swapping to Paper.
  </AlertDescription>
</Alert>`}
        >
          <Alert variant="highlight" className="w-full max-w-lg">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>New feature</AlertTitle>
            <AlertDescription>
              The theme switcher is now live — try swapping to Paper.
            </AlertDescription>
          </Alert>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={alertProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Uses <code className="bg-muted px-1 py-0.5 rounded text-sm">role="alert"</code> for screen readers</li>
          <li>Icons should have appropriate aria-labels</li>
          <li>Color is not the only indicator of variant type</li>
          <li>Text content provides context for all users</li>
        </ul>
      </div>

      <SidecarBlock slug="alert" />

      <ComponentNav currentHref="/components/alert" />
    </div>
  );
}
