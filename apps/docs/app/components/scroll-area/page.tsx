import { ComponentNav } from "@/components/component-nav";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const scrollAreaProps = [
  {
    name: "type",
    type: '"auto" | "always" | "scroll" | "hover"',
    default: '"hover"',
    description: "Describes the nature of scrollbar visibility.",
  },
  {
    name: "scrollHideDelay",
    type: "number",
    default: "600",
    description: "Delay in ms before hiding scrollbars (for type 'scroll' or 'hover').",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

const projects = [
  { name: "Marketing Site", status: "Live", power: "v2.4" },
  { name: "Mobile App", status: "Live", power: "v1.8" },
  { name: "Admin Dashboard", status: "Deploying", power: "v3.1" },
  { name: "API Gateway", status: "Live", power: "v0.9" },
  { name: "Docs Portal", status: "Live", power: "v1.2" },
  { name: "Design System", status: "Live", power: "v0.2" },
  { name: "Analytics Worker", status: "Paused", power: "—" },
  { name: "Feature Flags", status: "Live", power: "v4.0" },
];

const tags = [
  "Design", "Engineering", "Product", "Research", "Ops", "Marketing",
  "Content", "Infra", "Bug", "Feature", "Docs", "Polish",
];

export default function ScrollAreaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Scroll Area</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Augments native scroll functionality for custom, cross-browser styling.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { ScrollArea, ScrollBar } from "@grade/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<ScrollArea className="h-72 w-48 rounded-md border">
  <div className="p-4">
    <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
    {tags.map((tag) => (
      <div key={tag} className="text-sm">{tag}</div>
    ))}
  </div>
</ScrollArea>`}
        >
          <ScrollArea className="h-72 w-48 rounded-md border">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
              {tags.map((tag) => (
                <div key={tag} className="text-sm py-1">
                  {tag}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Project List</h3>
        <ComponentPreview
          code={`<ScrollArea className="h-72 w-full max-w-sm rounded-md border">
  <div className="p-4">
    <h4 className="mb-4 text-sm font-medium">Projects</h4>
    {projects.map((project, i) => (
      <div key={project.name}>
        <div className="flex justify-between py-2">
          <div>
            <div className="text-sm font-medium">{project.name}</div>
            <div className="text-xs text-muted-foreground">{project.status}</div>
          </div>
          <div className="text-sm text-right">{project.power}</div>
        </div>
        {i < projects.length - 1 && <Separator />}
      </div>
    ))}
  </div>
</ScrollArea>`}
        >
          <ScrollArea className="h-72 w-full max-w-sm rounded-md border">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-medium">Projects</h4>
              {projects.map((project, i) => (
                <div key={project.name}>
                  <div className="flex justify-between py-2">
                    <div>
                      <div className="text-sm font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.status}</div>
                    </div>
                    <div className="text-sm text-right">{project.power}</div>
                  </div>
                  {i < projects.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Horizontal Scroll</h3>
        <ComponentPreview
          code={`<ScrollArea className="w-full max-w-sm whitespace-nowrap rounded-md border">
  <div className="flex w-max space-x-4 p-4">
    {tags.map((tag) => (
      <div
        key={tag}
        className="shrink-0 rounded-md border px-3 py-1.5 text-sm"
      >
        {tag}
      </div>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}
        >
          <ScrollArea className="w-full max-w-sm whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="shrink-0 rounded-md border px-3 py-1.5 text-sm"
                >
                  {tag}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Fixed Height Container</h3>
        <ComponentPreview
          code={`<ScrollArea className="h-[200px] rounded-md border p-4">
  <div className="space-y-4">
    <p>
      The Grade Design System is a collection of production-ready
      React components, design tokens, and patterns for building
      consistent, accessible interfaces.
    </p>
    <p>
      Every theme — built-in or user-built — flows through a
      generator that turns three hues into a full OKLCH-based
      palette with matching typography, spacing, and motion presets.
    </p>
    <p>
      Components are built on Radix UI primitives for accessibility
      and Tailwind CSS for styling. Drop them straight into any
      Next.js or React project via the npm package.
    </p>
    <p>
      Switch themes at runtime, persist user themes to localStorage,
      and ship custom design languages without touching component
      code. Every skin lives in one ThemeInput object.
    </p>
  </div>
</ScrollArea>`}
        >
          <ScrollArea className="h-[200px] w-full max-w-md rounded-md border p-4">
            <div className="space-y-4">
              <p>
                The Grade Design System is a collection of production-ready
                React components, design tokens, and patterns for building
                consistent, accessible interfaces.
              </p>
              <p>
                Every theme — built-in or user-built — flows through a
                generator that turns three hues into a full OKLCH-based
                palette with matching typography, spacing, and motion presets.
              </p>
              <p>
                Components are built on Radix UI primitives for accessibility
                and Tailwind CSS for styling. Drop them straight into any
                Next.js or React project via the npm package.
              </p>
              <p>
                Switch themes at runtime, persist user themes to localStorage,
                and ship custom design languages without touching component
                code. Every skin lives in one ThemeInput object.
              </p>
            </div>
          </ScrollArea>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={scrollAreaProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Built on Radix UI ScrollArea for consistent behavior</li>
          <li>Keyboard scrolling works natively</li>
          <li>Custom scrollbars maintain accessibility</li>
          <li>Works with screen readers</li>
        </ul>
      </div>

      <ComponentNav currentHref="/components/scroll-area" />
    </div>
  );
}
