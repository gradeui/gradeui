"use client";

import { Toggle } from "@/components/ui/toggle";
import { ComponentNav } from "@/components/component-nav";
import { Bold, Italic, Underline } from "lucide-react";

export default function TogglePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Toggle</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A two-state button that can be either on or off.
        </p>
      </div>

      {/* Basic */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Basic Toggle
        </h2>
        <div className="flex gap-2">
          <Toggle aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle aria-label="Toggle italic">
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle aria-label="Toggle underline">
            <Underline className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {/* With Text */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          With Text
        </h2>
        <div className="flex gap-2">
          <Toggle aria-label="Toggle bold">
            <Bold className="h-4 w-4 mr-2" />
            Bold
          </Toggle>
          <Toggle aria-label="Toggle italic">
            <Italic className="h-4 w-4 mr-2" />
            Italic
          </Toggle>
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Variants
        </h2>
        <div className="flex gap-2">
          <Toggle variant="default" aria-label="Default">
            Default
          </Toggle>
          <Toggle variant="outline" aria-label="Outline">
            Outline
          </Toggle>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sizes
        </h2>
        <div className="flex items-center gap-2">
          <Toggle size="sm" aria-label="Small">
            <Bold className="h-3 w-3" />
          </Toggle>
          <Toggle size="default" aria-label="Default">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle size="lg" aria-label="Large">
            <Bold className="h-5 w-5" />
          </Toggle>
        </div>
      </div>

      {/* Disabled */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Disabled
        </h2>
        <Toggle disabled aria-label="Disabled toggle">
          <Bold className="h-4 w-4" />
        </Toggle>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Toggle } from "@/components/ui/toggle"
import { Bold } from "lucide-react"

<Toggle aria-label="Toggle bold">
  <Bold className="h-4 w-4" />
</Toggle>

{/* With text */}
<Toggle>
  <Bold className="h-4 w-4 mr-2" />
  Bold
</Toggle>

{/* Variants */}
<Toggle variant="outline">Outline</Toggle>

{/* Sizes */}
<Toggle size="sm">Small</Toggle>
<Toggle size="lg">Large</Toggle>`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/toggle" />
    </div>
  );
}
