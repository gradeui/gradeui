import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Flex } from "@/components/ui/flex";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const flexProps = [
  {
    name: "direction",
    type: '"row" | "col" | "row-reverse" | "col-reverse"',
    default: '"row"',
    description:
      "Main-axis direction. Flex's defining prop — Stack and Row lock this; Flex doesn't.",
  },
  {
    name: "gap",
    type: '"none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"',
    default: '"none"',
    description:
      "Gap between children. Same scale as Stack, Row, and Grid. Defaults to none — Flex is CSS-default throughout.",
  },
  {
    name: "align",
    type: '"start" | "center" | "end" | "stretch" | "baseline"',
    default: '"stretch"',
    description:
      "Cross-axis alignment. `baseline` is Flex-only — Row and Stack don't expose it.",
  },
  {
    name: "justify",
    type: '"start" | "center" | "end" | "between" | "around" | "evenly"',
    default: '"start"',
    description: "Main-axis distribution.",
  },
  {
    name: "wrap",
    type: '"nowrap" | "wrap" | "wrap-reverse"',
    default: '"nowrap"',
    description:
      "Wrap behaviour when children overflow. `wrap-reverse` flows extra lines upward.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render as the single child element via Radix Slot — stamps Flex's layout classes onto an existing semantic tag.",
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

export default function FlexPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Flex</h1>
        <p className="text-lg text-muted-foreground mt-2">
          The unopinionated flexbox primitive. The CSS-aligned escape
          hatch under Stack, Row, and Grid — reach for it when you need
          reverse direction, CSS defaults, or baseline alignment.
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Flex } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <p className="text-muted-foreground">
          Flex mirrors the CSS flexbox model directly — <code className="bg-muted px-1 py-0.5 rounded text-sm">direction</code>, <code className="bg-muted px-1 py-0.5 rounded text-sm">gap</code>, <code className="bg-muted px-1 py-0.5 rounded text-sm">align</code>, <code className="bg-muted px-1 py-0.5 rounded text-sm">justify</code>, <code className="bg-muted px-1 py-0.5 rounded text-sm">wrap</code> — and ships with CSS's own defaults. No baked-in rhythm; you pay for exactly the props you set. For the 95% case reach for{" "}
          <a href="/components/stack" className="underline">Stack</a>,{" "}
          <a href="/components/row" className="underline">Row</a>, or{" "}
          <a href="/components/grid" className="underline">Grid</a> — they're
          shorter to type and tuned for common layouts. Flex is the escape
          hatch.
        </p>
        <ComponentPreview
          code={`<Flex direction="row" gap="md" align="center">
  <Box>A</Box>
  <Box>B</Box>
  <Box>C</Box>
</Flex>`}
        >
          <Flex direction="row" gap="md" align="center">
            <Box>A</Box>
            <Box>B</Box>
            <Box>C</Box>
          </Flex>
        </ComponentPreview>
      </div>

      {/* Direction */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Direction
        </h2>
        <p className="text-muted-foreground">
          Flex's defining prop — the only knob Stack and Row don't let you
          touch. <code className="bg-muted px-1 py-0.5 rounded text-sm">col-reverse</code> and <code className="bg-muted px-1 py-0.5 rounded text-sm">row-reverse</code> are the common reasons to reach for Flex over Row or Stack.
        </p>

        <h3 className="text-lg font-medium">direction="row-reverse"</h3>
        <ComponentPreview code={`<Flex direction="row-reverse" gap="md">…</Flex>`}>
          <Flex direction="row-reverse" gap="md">
            <Box>1</Box>
            <Box>2</Box>
            <Box>3</Box>
          </Flex>
        </ComponentPreview>

        <h3 className="text-lg font-medium">direction="col"</h3>
        <ComponentPreview code={`<Flex direction="col" gap="sm">…</Flex>`}>
          <Flex direction="col" gap="sm">
            <Box>Top</Box>
            <Box>Middle</Box>
            <Box>Bottom</Box>
          </Flex>
        </ComponentPreview>
      </div>

      {/* Align */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Align (baseline)
        </h2>
        <p className="text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-sm">align="baseline"</code>{" "}
          is Flex-only — Stack and Row don't expose it. Useful for icon + heading
          rows where the caps line should line up.
        </p>
        <ComponentPreview
          code={`<Flex gap="sm" align="baseline">
  <Box className="text-xs">sm</Box>
  <Box className="text-base">md</Box>
  <Box className="text-2xl">lg</Box>
</Flex>`}
        >
          <Flex gap="sm" align="baseline">
            <Box className="text-xs">sm</Box>
            <Box className="text-base">md</Box>
            <Box className="text-2xl">lg</Box>
          </Flex>
        </ComponentPreview>
      </div>

      {/* Wrap */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Wrap
        </h2>
        <p className="text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-sm">wrap="wrap-reverse"</code>{" "}
          flows overflow lines upward instead of downward — niche but occasionally exactly what a tag cloud wants.
        </p>
        <ComponentPreview code={`<Flex gap="sm" wrap="wrap">…</Flex>`}>
          <Flex gap="sm" wrap="wrap" className="max-w-xs">
            {Array.from({ length: 10 }, (_, i) => (
              <Box key={i}>tag {i + 1}</Box>
            ))}
          </Flex>
        </ComponentPreview>
      </div>

      {/* Props */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={flexProps} />
      </div>

      {/* When to use */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to use
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Reverse direction — <code className="bg-muted px-1 py-0.5 rounded text-sm">row-reverse</code> / <code className="bg-muted px-1 py-0.5 rounded text-sm">col-reverse</code>. Stack and Row can't express either without a className escape.
          </li>
          <li>
            Baseline alignment — icon + heading rows where caps should line up.
          </li>
          <li>
            You want CSS defaults rather than Row's <code className="bg-muted px-1 py-0.5 rounded text-sm">items-center gap-md</code> starting point.
          </li>
          <li>
            Otherwise prefer{" "}
            <a href="/components/stack" className="underline">Stack</a> (vertical),{" "}
            <a href="/components/row" className="underline">Row</a> (horizontal),{" "}
            or <a href="/components/grid" className="underline">Grid</a> (2D) —
            they're easier to read and tuned for the common cases.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="flex" />

      <ComponentNav currentHref="/components/flex" />
    </div>
  );
}
