"use client";
import { ComponentNav } from "@/components/component-nav";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const toasterProps = [
  {
    name: "position",
    type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
    default: '"bottom-right"',
    description: "The position of the toasts.",
  },
  {
    name: "expand",
    type: "boolean",
    default: "false",
    description: "Whether toasts should expand to fill available space.",
  },
  {
    name: "richColors",
    type: "boolean",
    default: "false",
    description: "Use rich colors for success, error, etc.",
  },
  {
    name: "closeButton",
    type: "boolean",
    default: "false",
    description: "Show a close button on each toast.",
  },
  {
    name: "duration",
    type: "number",
    default: "4000",
    description: "Default duration in milliseconds before toasts dismiss.",
  },
];

export default function ToastPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Toast</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A succinct message that is displayed temporarily using Sonner.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`// Add Toaster to your layout
import { Toaster } from "@gradeui/ui"

// In your layout.tsx
<Toaster />

// Use toast function in components
import { toast } from "sonner"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Button onClick={() => toast("Event has been created")}>
  Show Toast
</Button>`}
        >
          <Button onClick={() => toast("Event has been created")}>
            Show Toast
          </Button>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Success</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() => toast.success("Device connected successfully")}
>
  Success Toast
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() => toast.success("Device connected successfully")}
          >
            Success Toast
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Error</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() => toast.error("Failed to connect device")}
>
  Error Toast
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() => toast.error("Failed to connect device")}
          >
            Error Toast
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Warning</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() => toast.warning("Storage almost full")}
>
  Warning Toast
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() => toast.warning("Storage almost full")}
          >
            Warning Toast
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Info</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() => toast.info("New version available")}
>
  Info Toast
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() => toast.info("New version available")}
          >
            Info Toast
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Description</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() =>
    toast("Member invited", {
      description: "Jordan has been added to the workspace.",
    })
  }
>
  With Description
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() =>
              toast("Member invited", {
                description: "Jordan has been added to the workspace.",
              })
            }
          >
            With Description
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Action</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() =>
    toast("Settings saved", {
      description: "Your changes have been saved.",
      action: {
        label: "Undo",
        onClick: () => console.log("Undo clicked"),
      },
    })
  }
>
  With Action
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() =>
              toast("Settings saved", {
                description: "Your changes have been saved.",
                action: {
                  label: "Undo",
                  onClick: () => console.log("Undo clicked"),
                },
              })
            }
          >
            With Action
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Promise Toast</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() => {
    const promise = new Promise((resolve) =>
      setTimeout(() => resolve({ name: "Production" }), 2000)
    );

    toast.promise(promise, {
      loading: "Deploying...",
      success: (data) => \`Deployed to \${data.name}\`,
      error: "Deploy failed",
    });
  }}
>
  Promise Toast
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() => {
              const promise = new Promise<{ name: string }>((resolve) =>
                setTimeout(() => resolve({ name: "Production" }), 2000)
              );

              toast.promise(promise, {
                loading: "Deploying...",
                success: (data) => `Deployed to ${data.name}`,
                error: "Deploy failed",
              });
            }}
          >
            Promise Toast
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Custom Duration</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() =>
    toast("This stays longer", {
      description: "This toast will stay for 10 seconds.",
      duration: 10000,
    })
  }
>
  Long Duration (10s)
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() =>
              toast("This stays longer", {
                description: "This toast will stay for 10 seconds.",
                duration: 10000,
              })
            }
          >
            Long Duration (10s)
          </Button>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Dismiss Toast</h3>
        <ComponentPreview
          code={`<Button
  variant="outline"
  onClick={() => {
    const toastId = toast("Processing...", {
      duration: Infinity,
    });

    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success("Done!");
    }, 2000);
  }}
>
  Auto Dismiss
</Button>`}
        >
          <Button
            variant="outline"
            onClick={() => {
              const toastId = toast("Processing...", {
                duration: Infinity,
              });

              setTimeout(() => {
                toast.dismiss(toastId);
                toast.success("Done!");
              }, 2000);
            }}
          >
            Auto Dismiss
          </Button>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props (Toaster)
        </h2>
        <PropsTable props={toasterProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Uses ARIA live regions for screen reader announcements</li>
          <li>Toasts can be dismissed with keyboard</li>
          <li>Action buttons are keyboard accessible</li>
          <li>Respects prefers-reduced-motion for animations</li>
        </ul>
      </div>

      <ComponentNav currentHref="/components/toast" />
    </div>
  );
}
