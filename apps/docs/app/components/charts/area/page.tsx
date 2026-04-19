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
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentNav } from "@/components/component-nav";

const trafficData = [
  { month: "Jan", desktop: 186, grid: 80, tablet: 45 },
  { month: "Feb", desktop: 205, grid: 65, tablet: 52 },
  { month: "Mar", desktop: 237, grid: 50, tablet: 61 },
  { month: "Apr", desktop: 273, grid: 40, tablet: 70 },
  { month: "May", desktop: 309, grid: 30, tablet: 82 },
  { month: "Jun", desktop: 314, grid: 25, tablet: 89 },
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
  tablet: {
    label: "Tablet",
    color: "oklch(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function AreaChartPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Area Chart</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Visualize data over time with filled areas. Great for showing volume and trends.
        </p>
      </div>

      {/* Basic Area Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Basic Area Chart
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Traffic by Device</CardTitle>
            <CardDescription>Monthly desktop visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="desktop"
                  fill="var(--color-desktop)"
                  fillOpacity={0.3}
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stacked Area Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Stacked Area Chart
        </h2>
        <p className="text-muted-foreground">
          Show multiple data series stacked on top of each other.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Device Mix</CardTitle>
            <CardDescription>Desktop, mobile, and tablet split over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="tablet"
                  stackId="1"
                  fill="var(--color-tablet)"
                  fillOpacity={0.6}
                  stroke="var(--color-tablet)"
                />
                <Area
                  type="monotone"
                  dataKey="mobile"
                  stackId="1"
                  fill="var(--color-mobile)"
                  fillOpacity={0.6}
                  stroke="var(--color-mobile)"
                />
                <Area
                  type="monotone"
                  dataKey="desktop"
                  stackId="1"
                  fill="var(--color-desktop)"
                  fillOpacity={0.6}
                  stroke="var(--color-desktop)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gradient Area Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Gradient Fill
        </h2>
        <p className="text-muted-foreground">
          Use gradients for a polished, modern look.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Desktop Traffic</CardTitle>
            <CardDescription>With gradient fill effect</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(var(--chart-1))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="desktop"
                  fill="url(#solarGradient)"
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Step Area Chart */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Step Area Chart
        </h2>
        <p className="text-muted-foreground">
          Use step interpolation for discrete data changes.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Mobile Traffic</CardTitle>
            <CardDescription>Step-wise mobile traffic visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="step"
                  dataKey="mobile"
                  fill="var(--color-mobile)"
                  fillOpacity={0.3}
                  stroke="var(--color-mobile)"
                  strokeWidth={2}
                />
              </AreaChart>
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
            <code>{`import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  desktop: { label: "Desktop", color: "oklch(var(--chart-1))" },
}

<ChartContainer config={chartConfig} className="min-h-[300px]">
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis dataKey="month" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Area
      type="monotone"
      dataKey="desktop"
      fill="var(--color-desktop)"
      fillOpacity={0.3}
      stroke="var(--color-desktop)"
    />
  </AreaChart>
</ChartContainer>`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/charts/area" />
    </div>
  );
}
