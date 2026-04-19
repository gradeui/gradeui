"use client";
import { ComponentNav } from "@/components/component-nav";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const sheetProps = [
  {
    name: "open",
    type: "boolean",
    default: "-",
    description: "The controlled open state of the sheet.",
  },
  {
    name: "defaultOpen",
    type: "boolean",
    default: "false",
    description: "The default open state when uncontrolled.",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    default: "-",
    description: "Callback when the open state changes.",
  },
];

const sheetContentProps = [
  {
    name: "side",
    type: '"top" | "right" | "bottom" | "left"',
    default: '"right"',
    description: "The side of the screen the sheet appears from.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

export default function SheetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Sheet</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A panel that slides out from the edge of the screen.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Sheet</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>
        This is the sheet description.
      </SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
                <SheetDescription>
                  This is the sheet description.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Project Settings</h3>
        <ComponentPreview
          code={`<Sheet>
  <SheetTrigger asChild>
    <Button>Project Settings</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Project Settings</SheetTitle>
      <SheetDescription>
        Configure your project settings.
      </SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" defaultValue="Marketing Site" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="team-size">Team Size</Label>
        <Input id="team-size" type="number" defaultValue="10" />
      </div>
    </div>
    <SheetFooter>
      <Button type="submit">Save Changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button>Project Settings</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Project Settings</SheetTitle>
                <SheetDescription>
                  Configure your project settings.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" defaultValue="Marketing Site" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="team-size">Team Size</Label>
                  <Input id="team-size" type="number" defaultValue="10" />
                </div>
              </div>
              <SheetFooter>
                <Button type="submit">Save Changes</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Side: Left</h3>
        <ComponentPreview
          code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Left</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
      <SheetDescription>
        Browse your workspace.
      </SheetDescription>
    </SheetHeader>
    <nav className="grid gap-2 py-4">
      <Button variant="ghost" className="justify-start">Dashboard</Button>
      <Button variant="ghost" className="justify-start">Projects</Button>
      <Button variant="ghost" className="justify-start">Analytics</Button>
      <Button variant="ghost" className="justify-start">Settings</Button>
    </nav>
  </SheetContent>
</Sheet>`}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Left</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>
                  Browse your workspace.
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-2 py-4">
                <Button variant="ghost" className="justify-start">Dashboard</Button>
                <Button variant="ghost" className="justify-start">Projects</Button>
                <Button variant="ghost" className="justify-start">Analytics</Button>
                <Button variant="ghost" className="justify-start">Settings</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Side: Top</h3>
        <ComponentPreview
          code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Top</Button>
  </SheetTrigger>
  <SheetContent side="top">
    <SheetHeader>
      <SheetTitle>Notifications</SheetTitle>
      <SheetDescription>
        You have 3 new alerts.
      </SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Top</Button>
            </SheetTrigger>
            <SheetContent side="top">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>
                  You have 3 new alerts.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Side: Bottom</h3>
        <ComponentPreview
          code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Bottom</Button>
  </SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Quick Actions</SheetTitle>
      <SheetDescription>
        Common device operations.
      </SheetDescription>
    </SheetHeader>
    <div className="flex gap-2 py-4">
      <Button variant="outline" className="flex-1">Export Data</Button>
      <Button variant="outline" className="flex-1">Refresh</Button>
      <Button variant="outline" className="flex-1">Settings</Button>
    </div>
  </SheetContent>
</Sheet>`}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Bottom</Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Quick Actions</SheetTitle>
                <SheetDescription>
                  Common device operations.
                </SheetDescription>
              </SheetHeader>
              <div className="flex gap-2 py-4">
                <Button variant="outline" className="flex-1">Export Data</Button>
                <Button variant="outline" className="flex-1">Refresh</Button>
                <Button variant="outline" className="flex-1">Settings</Button>
              </div>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <h3 className="text-lg font-medium">Sheet</h3>
        <PropsTable props={sheetProps} />
        <h3 className="text-lg font-medium mt-4">SheetContent</h3>
        <PropsTable props={sheetContentProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Built on Radix UI Dialog for full accessibility</li>
          <li>Focus is trapped within the sheet</li>
          <li>Escape key closes the sheet</li>
          <li>Background scroll is locked when open</li>
          <li>Announces content to screen readers</li>
        </ul>
      </div>

      <ComponentNav currentHref="/components/sheet" />
    </div>
  );
}
