"use client";
import { ComponentNav } from "@/components/component-nav";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const accordionProps = [
  {
    name: "type",
    type: '"single" | "multiple"',
    default: '"single"',
    description: "Whether one or multiple items can be opened at once.",
  },
  {
    name: "value",
    type: "string | string[]",
    default: "-",
    description: "The controlled value of the opened item(s).",
  },
  {
    name: "defaultValue",
    type: "string | string[]",
    default: "-",
    description: "The default opened item(s) when uncontrolled.",
  },
  {
    name: "collapsible",
    type: "boolean",
    default: "false",
    description: "When type is 'single', allows closing all items.",
  },
];

export default function AccordionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Accordion</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A vertically stacked set of interactive headings that reveal or hide content.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@grade/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Is it styled?</AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles.
    </AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="single" collapsible className="w-full max-w-md">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that match the design system.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">FAQ</h3>
        <ComponentPreview
          code={`<Accordion type="single" collapsible>
  <AccordionItem value="q1">
    <AccordionTrigger>What is Ramp DS?</AccordionTrigger>
    <AccordionContent>
      Ramp DS is a design system built around a generator-first theme
      engine — pick three hues and every component re-skins around them.
      Ships as an npm package with full TypeScript typings.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>How do I get started?</AccordionTrigger>
    <AccordionContent>
      Install the npm package with "npm install @grade/ui". Import the styles
      in your root layout and wrap your app with RampThemeProvider.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>What data do you collect?</AccordionTrigger>
    <AccordionContent>
      Ramp DS runs entirely client-side. The library makes no network requests,
      collects no telemetry, and has no tracking. Your users' data stays
      between your app and your backend.
    </AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="single" collapsible className="w-full max-w-lg">
            <AccordionItem value="q1">
              <AccordionTrigger>What is Ramp DS?</AccordionTrigger>
              <AccordionContent>
                Ramp DS is a design system built around a generator-first theme
                engine — pick three hues and every component re-skins around them.
                Ships as an npm package with full TypeScript typings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>How do I get started?</AccordionTrigger>
              <AccordionContent>
                Install the npm package with &quot;npm install @grade/ui&quot;.
                Import the styles in your root layout and wrap your app with
                RampThemeProvider.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>What data do you collect?</AccordionTrigger>
              <AccordionContent>
                Ramp DS runs entirely client-side. The library makes no network requests,
                collects no telemetry, and has no tracking. Your users' data stays
                between your app and your backend.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Multiple Open</h3>
        <ComponentPreview
          code={`<Accordion type="multiple">
  <AccordionItem value="activity">
    <AccordionTrigger>Activity</AccordionTrigger>
    <AccordionContent>
      You shipped 12 commits across 3 repositories this week.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="usage">
    <AccordionTrigger>Usage</AccordionTrigger>
    <AccordionContent>
      85% of your monthly quota used. Resets on the 1st.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="billing">
    <AccordionTrigger>Billing</AccordionTrigger>
    <AccordionContent>
      Next invoice: $24.00 on December 1st.
    </AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="multiple" className="w-full max-w-lg">
            <AccordionItem value="activity">
              <AccordionTrigger>Activity</AccordionTrigger>
              <AccordionContent>
                You shipped 12 commits across 3 repositories this week.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="usage">
              <AccordionTrigger>Usage</AccordionTrigger>
              <AccordionContent>
                85% of your monthly quota used. Resets on the 1st.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="billing">
              <AccordionTrigger>Billing</AccordionTrigger>
              <AccordionContent>
                Next invoice: $24.00 on December 1st.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Default Open</h3>
        <ComponentPreview
          code={`<Accordion type="single" defaultValue="item-1" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Open by default</AccordionTrigger>
    <AccordionContent>
      This item is open when the page loads.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Closed by default</AccordionTrigger>
    <AccordionContent>
      This item starts closed.
    </AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="single" defaultValue="item-1" collapsible className="w-full max-w-md">
            <AccordionItem value="item-1">
              <AccordionTrigger>Open by default</AccordionTrigger>
              <AccordionContent>
                This item is open when the page loads.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Closed by default</AccordionTrigger>
              <AccordionContent>
                This item starts closed.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={accordionProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Built on Radix UI Accordion for full accessibility</li>
          <li>Keyboard navigation (Arrow keys, Home, End)</li>
          <li>WAI-ARIA accordion pattern</li>
          <li>Proper focus management</li>
        </ul>
      </div>

      <ComponentNav currentHref="/components/accordion" />
    </div>
  );
}
