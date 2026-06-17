"use client";
import * as React from "react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { Swatch, SwatchGroup } from "@/components/ui/swatch";
import { Row } from "@/components/ui/row";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const swatchProps = [
  {
    name: "color",
    type: "string",
    default: "-",
    description:
      "Any raw CSS colour (#1f6feb, oklch(...), rgb(...), var(--x)). Takes precedence over token.",
  },
  {
    name: "token",
    type: "string",
    default: "-",
    description:
      "A Grade colour token name (no --, no oklch() wrap), resolved to oklch(var(--<token>)). Re-voices with the theme. e.g. \"brand-3\", \"primary\".",
  },
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg" | "xl"',
    default: '"md"',
    description: "T-shirt scale, 20px → 56px. Prefer over h-*/w-* utilities.",
  },
  {
    name: "shape",
    type: '"square" | "rounded" | "circle"',
    default: '"rounded"',
    description: "rounded rides --radius; circle for dot pickers; square for a hard tile.",
  },
  {
    name: "selected",
    type: "boolean",
    default: "false",
    description: "Draws the shared selection ring (--selected). For palette/accent pickers.",
  },
  {
    name: "onSelect",
    type: "() => void",
    default: "-",
    description:
      "Makes the swatch a pickable <button> (adds aria-pressed, focus ring, hover lift).",
  },
  {
    name: "label",
    type: "ReactNode",
    default: "-",
    description: "Caption beneath the chip; also becomes the accessible name + tooltip.",
  },
];

function PickableRow() {
  const [selected, setSelected] = React.useState("brand-1");
  return (
    <Row gap="sm">
      {["brand-1", "brand-2", "brand-3", "brand-4", "brand-5"].map((t) => (
        <Swatch
          key={t}
          token={t}
          shape="circle"
          size="lg"
          selected={t === selected}
          onSelect={() => setSelected(t)}
        />
      ))}
    </Row>
  );
}

export default function SwatchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Swatch</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A single colour chip. Bind it to a live theme token or show a raw
          colour — for brand-pop strips, palette pickers, and theme previews.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Swatch } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <p className="leading-7 text-muted-foreground">
          Reach for <code className="bg-muted px-1 py-0.5 rounded text-sm">token</code>{" "}
          to point at a live theme variable — pass the bare name, no{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">--</code> and no{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">oklch()</code>{" "}
          wrap. The chip re-voices automatically when the theme changes.
        </p>
        <ComponentPreview
          code={`<SwatchGroup size="lg">
  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
    <Swatch key={n} token={\`brand-\${n}\`} />
  ))}
</SwatchGroup>`}
        >
          <SwatchGroup size="lg">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Swatch key={n} token={`brand-${n}`} />
            ))}
          </SwatchGroup>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Grouping
        </h2>
        <p className="leading-7 text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-sm">SwatchGroup</code>{" "}
          arranges a set and cascades <code className="bg-muted px-1 py-0.5 rounded text-sm">size</code>{" "}
          / <code className="bg-muted px-1 py-0.5 rounded text-sm">shape</code> to
          every child. <code className="bg-muted px-1 py-0.5 rounded text-sm">layout="stack"</code>{" "}
          overlaps them into a coin-stack — the theme-picker &ldquo;key
          colours&rdquo; treatment.
        </p>
        <ComponentPreview
          code={`<div className="flex flex-col gap-4">
  {/* Row — spaced */}
  <SwatchGroup shape="circle" size="md">
    <Swatch token="background" />
    <Swatch token="muted" />
    <Swatch token="primary" />
    <Swatch token="accent" />
  </SwatchGroup>

  {/* Stack — overlapping */}
  <SwatchGroup layout="stack" shape="circle" size="md">
    <Swatch token="background" />
    <Swatch token="muted" />
    <Swatch token="primary" />
    <Swatch token="accent" />
  </SwatchGroup>
</div>`}
        >
          <div className="flex flex-col gap-4">
            <SwatchGroup shape="circle" size="md">
              <Swatch token="background" />
              <Swatch token="muted" />
              <Swatch token="primary" />
              <Swatch token="accent" />
            </SwatchGroup>
            <SwatchGroup layout="stack" shape="circle" size="md">
              <Swatch token="background" />
              <Swatch token="muted" />
              <Swatch token="primary" />
              <Swatch token="accent" />
            </SwatchGroup>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Captioned tokens</h3>
        <ComponentPreview
          code={`<Row gap="md" wrap>
  <Swatch token="primary" label="Primary" />
  <Swatch token="accent" label="Accent" />
  <Swatch token="muted" label="Muted" />
  <Swatch token="destructive" label="Destructive" />
</Row>`}
        >
          <Row gap="md" wrap>
            <Swatch token="primary" label="Primary" />
            <Swatch token="accent" label="Accent" />
            <Swatch token="muted" label="Muted" />
            <Swatch token="destructive" label="Destructive" />
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Pickable accent set</h3>
        <p className="leading-7 text-muted-foreground">
          Pass <code className="bg-muted px-1 py-0.5 rounded text-sm">onSelect</code>{" "}
          to render a real button with <code className="bg-muted px-1 py-0.5 rounded text-sm">aria-pressed</code>;{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">selected</code>{" "}
          draws the shared selection ring.
        </p>
        <ComponentPreview
          code={`const [selected, setSelected] = React.useState("brand-1");

<Row gap="sm">
  {["brand-1", "brand-2", "brand-3", "brand-4", "brand-5"].map((t) => (
    <Swatch
      key={t}
      token={t}
      shape="circle"
      size="lg"
      selected={t === selected}
      onSelect={() => setSelected(t)}
    />
  ))}
</Row>`}
        >
          <PickableRow />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Raw colours &amp; transparency</h3>
        <p className="leading-7 text-muted-foreground">
          A transparency checkerboard sits behind the fill, so semi-transparent
          values read honestly.
        </p>
        <ComponentPreview
          code={`<Row gap="sm">
  <Swatch color="#1f6feb" />
  <Swatch color="oklch(0.7 0.18 30)" />
  <Swatch color="rgb(16 185 129 / 0.4)" />
</Row>`}
        >
          <Row gap="sm">
            <Swatch color="#1f6feb" />
            <Swatch color="oklch(0.7 0.18 30)" />
            <Swatch color="rgb(16 185 129 / 0.4)" />
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Sizes &amp; shapes</h3>
        <ComponentPreview
          code={`<Row gap="md" align="center">
  <Swatch token="primary" size="xs" />
  <Swatch token="primary" size="sm" />
  <Swatch token="primary" size="md" />
  <Swatch token="primary" size="lg" />
  <Swatch token="primary" size="xl" />
  <Swatch token="accent" shape="square" size="lg" />
  <Swatch token="accent" shape="circle" size="lg" />
</Row>`}
        >
          <Row gap="md" align="center">
            <Swatch token="primary" size="xs" />
            <Swatch token="primary" size="sm" />
            <Swatch token="primary" size="md" />
            <Swatch token="primary" size="lg" />
            <Swatch token="primary" size="xl" />
            <Swatch token="accent" shape="square" size="lg" />
            <Swatch token="accent" shape="circle" size="lg" />
          </Row>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={swatchProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Static swatches render as a div; pickable swatches render as a button</li>
          <li>Pickable swatches expose aria-pressed and a visible focus ring</li>
          <li>The label (or token/color) becomes the accessible name and tooltip</li>
        </ul>
      </div>

      <SidecarBlock slug="swatch" />

      <ComponentNav currentHref="/components/swatch" />
    </div>
  );
}
