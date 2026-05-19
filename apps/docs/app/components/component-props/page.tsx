"use client";

import { ComponentProps } from "@/components/component-props";
import { ComponentNav } from "@/components/component-nav";
import { ComponentPreview } from "@/components/component-preview";
import { COMPONENT_CONTRACTS } from "@gradeui/ui";

// Pull contracts off the registry rather than individual exports —
// the barrel only re-exports MediaSurfaceContract by name today, and
// adding one per component would bloat the public surface. The
// registry is the single discoverable entry point.
const CalloutContract = COMPONENT_CONTRACTS.Callout;
const CarouselContract = COMPONENT_CONTRACTS.Carousel;
const ButtonContract = COMPONENT_CONTRACTS.Button;

export default function ComponentPropsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          ComponentProps
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Read-only docs renderer for a <code className="font-mono">ComponentContract</code>.
          Replaces hand-authored props tables — pass a contract, get the
          full prop list with TypeScript-shaped types, defaults, descriptions,
          and design taxonomy badges.
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
          The contract IS the source of truth, so the docs update when the
          contract changes — no per-page maintenance. Cousin of{" "}
          <code className="font-mono">StudioSettingsPanel</code> (the live
          mutator inside Studio); both read contracts, one displays, one
          mutates.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { ComponentProps } from "@/components/component-props";
import { CalloutContract } from "@gradeui/ui";

<ComponentProps contract={CalloutContract} />`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Callout</h3>
        <p className="text-sm text-muted-foreground">
          A simple component — one variant prop. Shows the default
          &ldquo;user-facing&rdquo; filter (knob / content / structured).
        </p>
        <ComponentProps contract={CalloutContract} />

        <h3 className="text-lg font-medium">Carousel</h3>
        <p className="text-sm text-muted-foreground">
          A compound component with mixed prop types — boolean knobs,
          enums, and a structured autoplay config.
        </p>
        <ComponentProps contract={CarouselContract} />

        <h3 className="text-lg font-medium">Button — including plumbing</h3>
        <p className="text-sm text-muted-foreground">
          Pass <code className="font-mono">show=&quot;all&quot;</code> to
          include plumbing / event / ref props (the things Studio hides from
          the settings panel by default).
        </p>
        <ComponentProps contract={ButtonContract} show="all" />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          The design axis
        </h2>
        <p className="text-muted-foreground">
          Every prop in a contract is tagged with a{" "}
          <code className="font-mono">design</code> axis that decides
          where it surfaces:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground pl-1">
          <li>
            <strong className="text-primary">knob</strong> — discrete
            design choice (variants, sizes, booleans). Renders in the
            Studio settings panel as Select / Switch / ToggleGroup.
          </li>
          <li>
            <strong className="text-info-deep">content</strong> — text /
            URL the user authors (alt, src, label). Renders as
            Input / Textarea.
          </li>
          <li>
            <strong className="text-success-deep">structured</strong> —
            discriminated union with sub-fields per kind. MediaSurface&apos;s{" "}
            <code className="font-mono">source</code> is the canonical
            case.
          </li>
          <li>
            <strong className="text-muted-foreground">plumbing</strong> /{" "}
            <strong className="text-warning-deep">event</strong> /{" "}
            <strong className="text-muted-foreground">ref</strong> —
            needed in code, hidden from the design panel by default.
            Pass <code className="font-mono">show=&quot;all&quot;</code>{" "}
            to surface them anyway.
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Registry browsing
        </h2>
        <p className="text-muted-foreground">
          <code className="font-mono">COMPONENT_CONTRACTS</code> is the
          full registry. Use it to render the props for any allow-listed
          component without per-page imports:
        </p>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm overflow-x-auto">
          <pre>
            <code>{`import { COMPONENT_CONTRACTS } from "@gradeui/ui";

<ComponentProps contract={COMPONENT_CONTRACTS.MultiSelect} />`}</code>
          </pre>
        </div>
        <p className="text-xs text-muted-foreground">
          {Object.keys(COMPONENT_CONTRACTS).length} components registered.
        </p>
      </div>

      <ComponentNav currentHref="/components/component-props" />
    </div>
  );
}
