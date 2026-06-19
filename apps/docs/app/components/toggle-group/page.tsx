"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline } from "lucide-react";

export default function ToggleGroupPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Toggle Group</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A set of two-state buttons that can be toggled on or off.
        </p>
      </div>

      {/* Single Selection */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Single Selection
        </h2>
        <p className="text-muted-foreground">
          Only one item can be selected at a time.
        </p>
        <ToggleGroup type="single" defaultValue="center">
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Align justify">
            <AlignJustify className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Multiple Selection */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Multiple Selection
        </h2>
        <p className="text-muted-foreground">
          Multiple items can be selected at once.
        </p>
        <ToggleGroup type="multiple" defaultValue={["bold"]}>
          <ToggleGroupItem value="bold" aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Toggle underline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Variants */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Variants
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Default</p>
            <ToggleGroup type="single" variant="default" defaultValue="center">
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="center">Center</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Outline</p>
            <ToggleGroup type="single" variant="outline" defaultValue="center">
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="center">Center</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Segmented — items sit in a muted track with the active one a soft
              raised pill. Reads like a TabsList, but emits a value, so it&rsquo;s
              the right pick for dense property panels.
            </p>
            <ToggleGroup type="single" variant="segmented" defaultValue="center">
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="center">Center</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sizes
        </h2>
        <div className="space-y-4">
          <ToggleGroup type="single" size="2xs" defaultValue="center">
            <ToggleGroupItem value="left">2xs</ToggleGroupItem>
            <ToggleGroupItem value="center">Densest</ToggleGroupItem>
            <ToggleGroupItem value="right">Panel</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" size="xs" defaultValue="center">
            <ToggleGroupItem value="left">xs</ToggleGroupItem>
            <ToggleGroupItem value="center">Dense</ToggleGroupItem>
            <ToggleGroupItem value="right">Panel</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" size="sm" defaultValue="center">
            <ToggleGroupItem value="left">Small</ToggleGroupItem>
            <ToggleGroupItem value="center">Size</ToggleGroupItem>
            <ToggleGroupItem value="right">Toggle</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" size="default" defaultValue="center">
            <ToggleGroupItem value="left">Default</ToggleGroupItem>
            <ToggleGroupItem value="center">Size</ToggleGroupItem>
            <ToggleGroupItem value="right">Toggle</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" size="lg" defaultValue="center">
            <ToggleGroupItem value="left">Large</ToggleGroupItem>
            <ToggleGroupItem value="center">Size</ToggleGroupItem>
            <ToggleGroupItem value="right">Toggle</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <InstallBlock>{`import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

{/* Single selection */}
<ToggleGroup type="single" defaultValue="center">
  <ToggleGroupItem value="left">Left</ToggleGroupItem>
  <ToggleGroupItem value="center">Center</ToggleGroupItem>
  <ToggleGroupItem value="right">Right</ToggleGroupItem>
</ToggleGroup>

{/* Multiple selection */}
<ToggleGroup type="multiple" defaultValue={["bold", "italic"]}>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>

{/* With variant and size */}
<ToggleGroup type="single" variant="outline" size="sm">
  ...
</ToggleGroup>`}</InstallBlock>
      </div>

      <SidecarBlock slug="toggle-group" />

      <ComponentNav currentHref="/components/toggle-group" />
    </div>
  );
}
