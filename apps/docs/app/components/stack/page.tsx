import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Stack } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import { InstallBlock } from "@/components/install-block";

const stackProps = [
  {
    name: "gap",
    type: '"none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"',
    default: '"md"',
    description: "Vertical gap between children.",
  },
  {
    name: "align",
    type: '"start" | "center" | "end" | "stretch"',
    default: '"stretch"',
    description: "Cross-axis (horizontal) alignment of children.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render as the single child element via Radix Slot — stamps Stack's layout classes onto an existing semantic tag (e.g. <section>) without nesting a wrapper div.",
  },
  {
    name: "className",
    type: "string",
    default: "—",
    description: "Extra classes merged onto the root element.",
  },
];

// Shared visual for gap / align demos — a chunky box so the spacing reads.
function Box({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 px-4 py-2 text-sm font-medium ${className}`}
    >
      {children}
    </div>
  );
}

export default function StackPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Stack</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Vertical layout primitive. Stacks children on the Y axis with a shared
          gap and optional cross-axis alignment.
        </p>
      </div>

      {/* Installation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Stack } from "@gradeui/ui"`}</InstallBlock>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <p className="text-muted-foreground">
          The default top-level layout inside a page or section. Use Stack
          instead of hand-rolled <code className="bg-muted px-1 py-0.5 rounded text-sm">flex flex-col gap-*</code>{" "}
          so the vertical rhythm is a variant prop the settings panel can edit.
        </p>
        <ComponentPreview
          code={`<Stack gap="md">
  <Box>One</Box>
  <Box>Two</Box>
  <Box>Three</Box>
</Stack>`}
        >
          <Stack gap="md" className="w-64">
            <Box>One</Box>
            <Box>Two</Box>
            <Box>Three</Box>
          </Stack>
        </ComponentPreview>
      </div>

      {/* Gap */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Gap
        </h2>
        <p className="text-muted-foreground">
          Vertical spacing between children. Seven steps tied to the spacing
          scale — <code className="bg-muted px-1 py-0.5 rounded text-sm">none</code> through{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">2xl</code>.
        </p>

        <h3 className="text-lg font-medium">gap="xs"</h3>
        <ComponentPreview code={`<Stack gap="xs">…</Stack>`}>
          <Stack gap="xs" className="w-48">
            <Box>1</Box>
            <Box>2</Box>
            <Box>3</Box>
          </Stack>
        </ComponentPreview>

        <h3 className="text-lg font-medium">gap="md" (default)</h3>
        <ComponentPreview code={`<Stack gap="md">…</Stack>`}>
          <Stack gap="md" className="w-48">
            <Box>1</Box>
            <Box>2</Box>
            <Box>3</Box>
          </Stack>
        </ComponentPreview>

        <h3 className="text-lg font-medium">gap="xl"</h3>
        <ComponentPreview code={`<Stack gap="xl">…</Stack>`}>
          <Stack gap="xl" className="w-48">
            <Box>1</Box>
            <Box>2</Box>
            <Box>3</Box>
          </Stack>
        </ComponentPreview>
      </div>

      {/* Align */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Align
        </h2>
        <p className="text-muted-foreground">
          Cross-axis alignment — how each child sits horizontally within the
          Stack. Default is <code className="bg-muted px-1 py-0.5 rounded text-sm">stretch</code>{" "}
          so children fill the Stack's width.
        </p>

        <h3 className="text-lg font-medium">align="start"</h3>
        <ComponentPreview code={`<Stack align="start">…</Stack>`}>
          <Stack align="start" gap="sm" className="w-64 border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box className="w-16">S</Box>
            <Box className="w-32">M</Box>
            <Box className="w-24">M</Box>
          </Stack>
        </ComponentPreview>

        <h3 className="text-lg font-medium">align="center"</h3>
        <ComponentPreview code={`<Stack align="center">…</Stack>`}>
          <Stack align="center" gap="sm" className="w-64 border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box className="w-16">S</Box>
            <Box className="w-32">M</Box>
            <Box className="w-24">M</Box>
          </Stack>
        </ComponentPreview>

        <h3 className="text-lg font-medium">align="end"</h3>
        <ComponentPreview code={`<Stack align="end">…</Stack>`}>
          <Stack align="end" gap="sm" className="w-64 border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box className="w-16">S</Box>
            <Box className="w-32">M</Box>
            <Box className="w-24">M</Box>
          </Stack>
        </ComponentPreview>

        <h3 className="text-lg font-medium">align="stretch" (default)</h3>
        <ComponentPreview code={`<Stack align="stretch">…</Stack>`}>
          <Stack align="stretch" gap="sm" className="w-64 border border-dashed border-muted-foreground/30 p-2 rounded">
            <Box>S</Box>
            <Box>M</Box>
            <Box>M</Box>
          </Stack>
        </ComponentPreview>
      </div>

      {/* asChild */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          asChild
        </h2>
        <p className="text-muted-foreground">
          Pass <code className="bg-muted px-1 py-0.5 rounded text-sm">asChild</code>{" "}
          to stamp Stack's layout classes onto an existing semantic element
          instead of wrapping it in a <code className="bg-muted px-1 py-0.5 rounded text-sm">div</code>.
          Useful for landmark tags.
        </p>
        <InstallBlock>{`<Stack asChild gap="lg">
  <section>
    <Hero>…</Hero>
    <Section>…</Section>
  </section>
</Stack>`}</InstallBlock>
      </div>

      {/* Composition */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Composition
        </h2>
        <p className="text-muted-foreground">
          A common pattern — a centred, narrow column for an auth card or
          marketing copy.
        </p>
        <ComponentPreview
          code={`<Stack gap="md" className="max-w-sm mx-auto">
  <Card>
    <CardHeader>
      <CardTitle>Sign in</CardTitle>
      <CardDescription>Use your work email</CardDescription>
    </CardHeader>
    <CardContent>
      <Stack gap="sm">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@work.com" />
        <Button className="w-full">Continue</Button>
      </Stack>
    </CardContent>
  </Card>
</Stack>`}
        >
          <Stack gap="md" className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>Use your work email</CardDescription>
              </CardHeader>
              <CardContent>
                <Stack gap="sm">
                  <Label htmlFor="email-demo">Email</Label>
                  <Input id="email-demo" type="email" placeholder="you@work.com" />
                  <Button className="w-full">Continue</Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </ComponentPreview>
      </div>

      {/* Props */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={stackProps} />
      </div>

      {/* When to reach for it */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to use
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>As the default top-level layout inside a page's main slot.</li>
          <li>For any vertical list of sections, cards, or form controls.</li>
          <li>
            Prefer Stack over hand-rolled{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">flex flex-col gap-*</code>{" "}
            — the spacing becomes a prop editable in the settings panel.
          </li>
          <li>
            For a <em>horizontal</em> composition, reach for{" "}
            <a href="/components/row" className="underline">Row</a> instead.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="stack" />

      <ComponentNav currentHref="/components/stack" />
    </div>
  );
}
