import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Grid } from "@/components/ui/grid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const gridProps = [
  {
    name: "cols",
    type: '"1" | "2" | "3" | "4" | "5" | "6" | "12"',
    default: '"3"',
    description:
      "Desired desktop column count. Each value has a baked-in responsive ladder — e.g. `4` produces `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, the canonical stat-card pattern.",
  },
  {
    name: "gap",
    type: '"none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"',
    default: '"md"',
    description:
      "Gap between grid cells. Same scale as Stack and Row, so the prop transfers cleanly when switching layout types.",
  },
  {
    name: "align",
    type: '"start" | "center" | "end" | "stretch"',
    default: '"stretch"',
    description: "Cross-axis alignment of each cell's content.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render as the single child element via Radix Slot — stamps Grid's layout classes onto an existing semantic tag (e.g. <section>) without nesting a wrapper div.",
  },
  {
    name: "className",
    type: "string",
    default: "—",
    description: "Extra classes merged onto the root element. Use this if you need bespoke breakpoints beyond the `cols` ladder.",
  },
];

// Shared demo tile — chunky enough that the grid shape is obvious.
function Tile({ n }: { n: number }) {
  return (
    <div className="flex items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 h-20 text-lg font-semibold">
      {n}
    </div>
  );
}

export default function GridPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Grid</h1>
        <p className="text-lg text-muted-foreground mt-2">
          2D layout primitive. The partner to Stack and Row — for tile
          grids, stat cards, feature columns, anything that needs to
          collapse gracefully on mobile.
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Grid } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <p className="text-muted-foreground">
          Reach for Grid when Stack (vertical) and Row (horizontal) don't
          fit — anywhere you'd hand-roll{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
          </code>
          . The <code className="bg-muted px-1 py-0.5 rounded text-sm">cols</code>{" "}
          prop bakes in a sensible responsive ladder so you pick the
          desktop column count and let mobile break down automatically.
        </p>
        <ComponentPreview
          code={`<Grid cols="4" gap="md">
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
</Grid>`}
        >
          <Grid cols="4" gap="md" className="w-full">
            {[1, 2, 3, 4].map((n) => (
              <Tile key={n} n={n} />
            ))}
          </Grid>
        </ComponentPreview>
      </div>

      {/* Cols */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Cols
        </h2>
        <p className="text-muted-foreground">
          Each{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">cols</code>{" "}
          value is a baked-in responsive ladder — not a fixed column
          count. Resize your viewport to see the grid adapt.
        </p>

        <h3 className="text-lg font-medium">cols="2"</h3>
        <p className="text-sm text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-xs">grid-cols-1 md:grid-cols-2</code>
        </p>
        <ComponentPreview code={`<Grid cols="2">…</Grid>`}>
          <Grid cols="2" gap="md" className="w-full">
            {[1, 2, 3, 4].map((n) => (
              <Tile key={n} n={n} />
            ))}
          </Grid>
        </ComponentPreview>

        <h3 className="text-lg font-medium">cols="3" (default)</h3>
        <p className="text-sm text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-xs">grid-cols-1 sm:grid-cols-2 md:grid-cols-3</code>
        </p>
        <ComponentPreview code={`<Grid cols="3">…</Grid>`}>
          <Grid cols="3" gap="md" className="w-full">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Tile key={n} n={n} />
            ))}
          </Grid>
        </ComponentPreview>

        <h3 className="text-lg font-medium">cols="4"</h3>
        <p className="text-sm text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-xs">grid-cols-1 sm:grid-cols-2 lg:grid-cols-4</code>
          {" "}— the canonical stat-card grid.
        </p>
        <ComponentPreview code={`<Grid cols="4">…</Grid>`}>
          <Grid cols="4" gap="md" className="w-full">
            {[1, 2, 3, 4].map((n) => (
              <Tile key={n} n={n} />
            ))}
          </Grid>
        </ComponentPreview>

        <h3 className="text-lg font-medium">cols="6"</h3>
        <p className="text-sm text-muted-foreground">
          <code className="bg-muted px-1 py-0.5 rounded text-xs">grid-cols-2 sm:grid-cols-3 lg:grid-cols-6</code>
          {" "}— denser, good for icon or thumbnail grids.
        </p>
        <ComponentPreview code={`<Grid cols="6">…</Grid>`}>
          <Grid cols="6" gap="sm" className="w-full">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Tile key={n} n={n} />
            ))}
          </Grid>
        </ComponentPreview>
      </div>

      {/* Gap */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Gap
        </h2>
        <p className="text-muted-foreground">
          Same seven-step scale as{" "}
          <a href="/components/stack" className="underline">Stack</a> and{" "}
          <a href="/components/row" className="underline">Row</a> — so the
          prop transfers cleanly if you switch a region's layout type.
        </p>

        <h3 className="text-lg font-medium">gap="sm"</h3>
        <ComponentPreview code={`<Grid cols="4" gap="sm">…</Grid>`}>
          <Grid cols="4" gap="sm" className="w-full">
            {[1, 2, 3, 4].map((n) => (
              <Tile key={n} n={n} />
            ))}
          </Grid>
        </ComponentPreview>

        <h3 className="text-lg font-medium">gap="xl"</h3>
        <ComponentPreview code={`<Grid cols="4" gap="xl">…</Grid>`}>
          <Grid cols="4" gap="xl" className="w-full">
            {[1, 2, 3, 4].map((n) => (
              <Tile key={n} n={n} />
            ))}
          </Grid>
        </ComponentPreview>
      </div>

      {/* Composition */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Composition
        </h2>
        <p className="text-muted-foreground">
          The classic 4-up stat-card grid. Drop Cards directly into Grid
          cells — no wrappers needed.
        </p>
        <ComponentPreview
          code={`<Grid cols="4" gap="md">
  <Card>
    <CardHeader>
      <CardTitle>Users</CardTitle>
      <CardDescription>+18% vs last month</CardDescription>
    </CardHeader>
    <CardContent><div className="text-3xl font-bold">2,350</div></CardContent>
  </Card>
  {/* …three more */}
</Grid>`}
        >
          <Grid cols="4" gap="md" className="w-full">
            {[
              { title: "Users", value: "2,350", trend: "+18% vs last month" },
              { title: "Revenue", value: "$12.4k", trend: "+5.1% vs last month" },
              { title: "Conversion", value: "4.8%", trend: "-0.3% vs last month" },
              { title: "Churn", value: "1.2%", trend: "-0.1% vs last month" },
            ].map((s) => (
              <Card key={s.title}>
                <CardHeader>
                  <CardTitle className="text-sm">{s.title}</CardTitle>
                  <CardDescription className="text-xs">{s.trend}</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{s.value}</CardContent>
              </Card>
            ))}
          </Grid>
        </ComponentPreview>
      </div>

      {/* Props */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={gridProps} />
      </div>

      {/* When to reach for it */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to use
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Stat-card dashboards — <code className="bg-muted px-1 py-0.5 rounded text-sm">cols="4"</code> is the canonical shape.</li>
          <li>Feature-tile grids on marketing pages — usually <code className="bg-muted px-1 py-0.5 rounded text-sm">cols="3"</code>.</li>
          <li>Pricing columns, testimonial tiles, product cards.</li>
          <li>
            For purely vertical layouts, reach for{" "}
            <a href="/components/stack" className="underline">Stack</a>. For a
            single horizontal row (button groups, nav bars), reach for{" "}
            <a href="/components/row" className="underline">Row</a>.
          </li>
          <li>
            For bespoke breakpoints beyond the{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">cols</code>{" "}
            ladder, pass <code className="bg-muted px-1 py-0.5 rounded text-sm">className</code>{" "}
            with your own grid classes — Grid will merge them correctly
            via tailwind-merge.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="grid" />

      <ComponentNav currentHref="/components/grid" />
    </div>
  );
}
