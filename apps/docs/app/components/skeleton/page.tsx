import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { Skeleton } from "@/components/ui/skeleton";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const skeletonProps = [
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes to control size and shape.",
  },
];

export default function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Skeleton</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Used to show a placeholder while content is loading.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Skeleton } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>`}
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Device Card Loading</h3>
        <ComponentPreview
          code={`<div className="rounded-lg border p-4 space-y-4 w-full max-w-sm">
  <div className="flex justify-between items-center">
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-5 w-16" />
  </div>
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
  <div className="flex gap-2">
    <Skeleton className="h-9 w-20" />
    <Skeleton className="h-9 w-20" />
  </div>
</div>`}
        >
          <div className="rounded-lg border p-4 space-y-4 w-full max-w-sm">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Stats Loading</h3>
        <ComponentPreview
          code={`<div className="grid grid-cols-3 gap-4 w-full max-w-md">
  <div className="rounded-lg border p-4 space-y-2">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-8 w-20" />
  </div>
  <div className="rounded-lg border p-4 space-y-2">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-8 w-20" />
  </div>
  <div className="rounded-lg border p-4 space-y-2">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-8 w-20" />
  </div>
</div>`}
        >
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            <div className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Table Loading</h3>
        <ComponentPreview
          code={`<div className="w-full max-w-lg space-y-2">
  <div className="flex gap-4 py-2">
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-4 w-1/4" />
  </div>
  {[1, 2, 3].map((i) => (
    <div key={i} className="flex gap-4 py-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  ))}
</div>`}
        >
          <div className="w-full max-w-lg space-y-2">
            <div className="flex gap-4 py-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 py-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Chart Loading</h3>
        <ComponentPreview
          code={`<div className="w-full max-w-md space-y-4">
  <div className="flex justify-between items-center">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-8 w-24" />
  </div>
  <Skeleton className="h-[200px] w-full" />
  <div className="flex justify-center gap-4">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-16" />
  </div>
</div>`}
        >
          <div className="w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-[200px] w-full" />
            <div className="flex justify-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Profile Loading</h3>
        <ComponentPreview
          code={`<div className="flex items-center space-x-4">
  <Skeleton className="h-16 w-16 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-4 w-48" />
    <Skeleton className="h-4 w-24" />
  </div>
</div>`}
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={skeletonProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Uses subtle animation to indicate loading state</li>
          <li>Consider using aria-busy on parent containers</li>
          <li>Provide aria-label for screen readers if needed</li>
          <li>Animation respects prefers-reduced-motion</li>
        </ul>
      </div>

      <SidecarBlock slug="skeleton" />

      <ComponentNav currentHref="/components/skeleton" />
    </div>
  );
}
