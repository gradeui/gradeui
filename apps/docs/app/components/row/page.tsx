import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Row } from "@/components/ui/row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const rowProps = [
  {
    name: "gap",
    type: '"none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"',
    default: '"md"',
    description: "Horizontal gap between children.",
  },
  {
    name: "align",
    type: '"start" | "center" | "end" | "stretch" | "baseline"',
    default: '"center"',
    description:
      "Cross-axis (vertical) alignment of children. Defaults to center — matches what most real rows want (icon + text, centred button groups).",
  },
  {
    name: "justify",
    type: '"start" | "center" | "end" | "between" | "around" | "evenly"',
    default: '"start"',
    description: "Main-axis distribution along the horizontal axis.",
  },
  {
    name: "wrap",
    type: "boolean",
    default: "false",
    description: "Allow children to wrap onto additional lines when they overflow.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render as the single child element via Radix Slot — stamps Row's layout classes onto an existing semantic tag.",
  },
  {
    name: "className",
    type: "string",
    default: "—",
    description: "Extra classes merged onto the root element.",
  },
];

// Visual for the layout demos.
function Box({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 px-4 py-2 text-sm font-medium ${className}`}
    >
      {children}
    </div>
  );
}

export default function RowPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Row</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Horizontal layout primitive. Flows children on the X axis with shared
          gap, cross-axis alignment, main-axis distribution, and optional wrapping.
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Row } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <p className="text-muted-foreground">
          Reach for Row instead of <code className="bg-muted px-1 py-0.5 rounded text-sm">flex items-center gap-*</code>{" "}
          so alignment and spacing stay editable in the settings panel. Common
          cases — button groups, inline form rows, logo + nav rows.
        </p>
        <ComponentPreview
          code={`<Row gap="sm" justify="end">
  <Button variant="ghost">Cancel</Button>
  <Button>Save</Button>
</Row>`}
        >
          <Row gap="sm" justify="end" className="w-full">
            <Button variant="ghost">Cancel</Button>
            <Button>Save</Button>
          </Row>
        </ComponentPreview>
      </div>

      {/* Gap */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Gap
        </h2>
        <p className="text-muted-foreground">
          Horizontal spacing between children. Shares the same scale as Stack.
        </p>

        <h3 className="text-lg font-medium">gap="xs"</h3>
        <ComponentPreview code={`<Row gap="xs">…</Row>`}>
          <Row gap="xs">
            <Box>1</Box>
            <Box>2</Box>
            <Box>3</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">gap="md" (default)</h3>
        <ComponentPreview code={`<Row gap="md">…</Row>`}>
          <Row gap="md">
            <Box>1</Box>
            <Box>2</Box>
            <Box>3</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">gap="xl"</h3>
        <ComponentPreview code={`<Row gap="xl">…</Row>`}>
          <Row gap="xl">
            <Box>1</Box>
            <Box>2</Box>
            <Box>3</Box>
          </Row>
        </ComponentPreview>
      </div>

      {/* Justify */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Justify
        </h2>
        <p className="text-muted-foreground">
          Main-axis distribution — how children spread along the horizontal axis.
        </p>

        <h3 className="text-lg font-medium">justify="start" (default)</h3>
        <ComponentPreview code={`<Row justify="start">…</Row>`}>
          <Row justify="start" className="w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">justify="center"</h3>
        <ComponentPreview code={`<Row justify="center">…</Row>`}>
          <Row justify="center" className="w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">justify="end"</h3>
        <ComponentPreview code={`<Row justify="end">…</Row>`}>
          <Row justify="end" className="w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">justify="between"</h3>
        <ComponentPreview code={`<Row justify="between">…</Row>`}>
          <Row justify="between" className="w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">justify="around"</h3>
        <ComponentPreview code={`<Row justify="around">…</Row>`}>
          <Row justify="around" className="w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">justify="evenly"</h3>
        <ComponentPreview code={`<Row justify="evenly">…</Row>`}>
          <Row justify="evenly" className="w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Row>
        </ComponentPreview>
      </div>

      {/* Align */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Align
        </h2>
        <p className="text-muted-foreground">
          Cross-axis alignment — how children sit vertically within the Row.
          Default is <code className="bg-muted px-1 py-0.5 rounded text-sm">center</code>.
        </p>

        <h3 className="text-lg font-medium">align="start"</h3>
        <ComponentPreview code={`<Row align="start">…</Row>`}>
          <Row align="start" className="h-24 w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>Short</Box>
            <Box className="h-16">Tall</Box>
            <Box>Short</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">align="center" (default)</h3>
        <ComponentPreview code={`<Row align="center">…</Row>`}>
          <Row align="center" className="h-24 w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>Short</Box>
            <Box className="h-16">Tall</Box>
            <Box>Short</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">align="end"</h3>
        <ComponentPreview code={`<Row align="end">…</Row>`}>
          <Row align="end" className="h-24 w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>Short</Box>
            <Box className="h-16">Tall</Box>
            <Box>Short</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">align="stretch"</h3>
        <ComponentPreview code={`<Row align="stretch">…</Row>`}>
          <Row align="stretch" className="h-24 w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>Short</Box>
            <Box>Med</Box>
            <Box>Short</Box>
          </Row>
        </ComponentPreview>

        <h3 className="text-lg font-medium">align="baseline"</h3>
        <ComponentPreview code={`<Row align="baseline">…</Row>`}>
          <Row align="baseline" className="w-full border border-dashed border-muted-foreground/30 p-2 rounded">
            <span className="text-sm">small</span>
            <span className="text-xl font-medium">medium</span>
            <span className="text-3xl font-bold">LARGE</span>
          </Row>
        </ComponentPreview>
      </div>

      {/* Wrap */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Wrap
        </h2>
        <p className="text-muted-foreground">
          Let children flow onto additional lines when they overflow. Useful
          for tag/badge lists or filter chips.
        </p>
        <ComponentPreview
          code={`<Row gap="sm" wrap>
  <Badge>design</Badge>
  <Badge>systems</Badge>
  <Badge>tokens</Badge>
  …
</Row>`}
        >
          <Row gap="sm" wrap className="w-64 border border-dashed border-muted-foreground/30 p-2 rounded">
            <Badge>design</Badge>
            <Badge>systems</Badge>
            <Badge>tokens</Badge>
            <Badge>layout</Badge>
            <Badge>primitives</Badge>
            <Badge>composition</Badge>
            <Badge>a11y</Badge>
            <Badge>OKLCH</Badge>
          </Row>
        </ComponentPreview>
      </div>

      {/* Composition */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Composition
        </h2>
        <p className="text-muted-foreground">
          Pair <code className="bg-muted px-1 py-0.5 rounded text-sm">justify="between"</code>{" "}
          with a Row for the classic "logo on the left, actions on the right" layout.
        </p>
        <ComponentPreview
          code={`<Row justify="between" align="center" className="w-full">
  <span className="font-semibold">Acme</span>
  <Row gap="sm">
    <Button variant="ghost">Docs</Button>
    <Button>Sign in</Button>
  </Row>
</Row>`}
        >
          <Row justify="between" align="center" className="w-full border border-dashed border-muted-foreground/30 p-3 rounded">
            <span className="font-semibold">Acme</span>
            <Row gap="sm">
              <Button variant="ghost">Docs</Button>
              <Button>Sign in</Button>
            </Row>
          </Row>
        </ComponentPreview>
      </div>

      {/* Props */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={rowProps} />
      </div>

      {/* When to reach for it */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to use
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Button groups, inline form rows, logo + nav rows, anything on one line.</li>
          <li>
            For an <em>explicit pane ratio</em> (sidebar + content, 1/3 + 2/3)
            reach for a Split primitive (coming soon). Row evenly flows whatever
            children it holds; Split enforces the ratio.
          </li>
          <li>
            For a <em>vertical</em> composition, reach for{" "}
            <a href="/components/stack" className="underline">Stack</a> instead.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="row" />

      <ComponentNav currentHref="/components/row" />
    </div>
  );
}
