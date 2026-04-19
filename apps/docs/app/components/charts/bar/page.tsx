"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentNav } from "@/components/component-nav";

const trafficData = [
  { month: "Jan", desktop: 186, grid: 80 },
  { month: "Feb", desktop: 205, grid: 65 },
  { month: "Mar", desktop: 237, grid: 50 },
  { month: "Apr", desktop: 273, grid: 40 },
  { month: "May", desktop: 309, grid: 30 },
  { month: "Jun", desktop: 314, grid: 25 },
];

const horizontalData = [
  { source: "Desktop", value: 314 },
  { source: "Wind", value: 186 },
  { source: "Hydro", value: 95 },
  { source: "Mobile", value: 65 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "oklch(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "oklch(var(--chart-2))",
  },
  value: {
    label: "Traffic",
    color: "oklch(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function BarChartPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Bar Chart</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Compare values across categories with vertical or horizontal bars.
        </p>
      </div>

      {/* Basic Bar Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Basic Bar Chart
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Desktop Production</CardTitle>
            <CardDescription>Monthly desktop visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Bar Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Grouped Bar Chart
        </h2>
        <p className="text-muted-foreground">
          Compare multiple data series side by side.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Desktop vs Grid</CardTitle>
            <CardDescription>Monthly comparison of traffic sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stacked Bar Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Stacked Bar Chart
        </h2>
        <p className="text-muted-foreground">
          Stack bars to show total and composition.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Total Device Mix</CardTitle>
            <CardDescription>Stacked view of desktop and mobile</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" />
                <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Horizontal Bar Chart
        </h2>
        <p className="text-muted-foreground">
          Use horizontal bars for categories with long labels.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Traffic by Source</CardTitle>
            <CardDescription>Total traffic contribution by source type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <BarChart data={horizontalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="source" type="category" tickLine={false} axisLine={false} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]}>
                  {horizontalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "oklch(var(--chart-1))" : "oklch(var(--chart-2))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Negative Values */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          With Negative Values
        </h2>
        <p className="text-muted-foreground">
          Display both positive and negative values (e.g., traffic import/export).
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Net Traffic Flow</CardTitle>
            <CardDescription>Positive = export, Negative = import</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ net: { label: "Net", color: "oklch(var(--chart-1))" } }} className="min-h-[300px] w-full">
              <BarChart data={[
                { month: "Jan", net: -50 },
                { month: "Feb", net: -20 },
                { month: "Mar", net: 30 },
                { month: "Apr", net: 80 },
                { month: "May", net: 120 },
                { month: "Jun", net: 150 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="net" radius={4}>
                  {[
                    { month: "Jan", net: -50 },
                    { month: "Feb", net: -20 },
                    { month: "Mar", net: 30 },
                    { month: "Apr", net: 80 },
                    { month: "May", net: 120 },
                    { month: "Jun", net: 150 },
                  ].map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.net >= 0 ? "oklch(var(--chart-1))" : "oklch(var(--destructive))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

<ChartContainer config={chartConfig} className="min-h-[300px]">
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis dataKey="month" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ChartContainer>

{/* Stacked bars */}
<Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" />
<Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" />

{/* Horizontal layout */}
<BarChart data={data} layout="vertical">
  <XAxis type="number" />
  <YAxis dataKey="category" type="category" />
</BarChart>`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/charts/bar" />
    </div>
  );
}
