"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RadioCard } from "@/components/ui/selection-card";
import { Label } from "@/components/ui/label";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const radioGroupProps = [
  {
    name: "value",
    type: "string",
    default: "-",
    description: "The controlled value of the radio group.",
  },
  {
    name: "defaultValue",
    type: "string",
    default: "-",
    description: "The default value when uncontrolled.",
  },
  {
    name: "onValueChange",
    type: "(value: string) => void",
    default: "-",
    description: "Callback when the value changes.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Whether the entire group is disabled.",
  },
];

export default function RadioGroupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Radio Group</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A set of checkable buttons where only one can be checked at a time.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { RadioGroup, RadioGroupItem } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <Label htmlFor="option-one">Option One</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <Label htmlFor="option-two">Option Two</Label>
  </div>
</RadioGroup>`}
        >
          <RadioGroup defaultValue="option-one">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="option-one" />
              <Label htmlFor="option-one">Option One</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="option-two" />
              <Label htmlFor="option-two">Option Two</Label>
            </div>
          </RadioGroup>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Plan Selection</h3>
        <ComponentPreview
          code={`<RadioGroup defaultValue="pro">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="free" id="free" />
    <Label htmlFor="free">Free</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="pro" id="pro" />
    <Label htmlFor="pro">Pro</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="team" id="team" />
    <Label htmlFor="team">Team</Label>
  </div>
</RadioGroup>`}
        >
          <RadioGroup defaultValue="pro">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="free" id="free" />
              <Label htmlFor="free">Free</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pro" id="pro" />
              <Label htmlFor="pro">Pro</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="team" id="team" />
              <Label htmlFor="team">Team</Label>
            </div>
          </RadioGroup>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Descriptions</h3>
        <ComponentPreview
          code={`<RadioGroup defaultValue="automatic">
  <div className="flex items-start space-x-2">
    <RadioGroupItem value="automatic" id="automatic" className="mt-1" />
    <div className="grid gap-1.5 leading-none">
      <Label htmlFor="automatic">Automatic</Label>
      <p className="text-sm text-muted-foreground">
        System picks the best option based on your activity.
      </p>
    </div>
  </div>
  <div className="flex items-start space-x-2">
    <RadioGroupItem value="manual" id="manual" className="mt-1" />
    <div className="grid gap-1.5 leading-none">
      <Label htmlFor="manual">Manual</Label>
      <p className="text-sm text-muted-foreground">
        You decide when updates are applied.
      </p>
    </div>
  </div>
  <div className="flex items-start space-x-2">
    <RadioGroupItem value="scheduled" id="scheduled" className="mt-1" />
    <div className="grid gap-1.5 leading-none">
      <Label htmlFor="scheduled">Scheduled</Label>
      <p className="text-sm text-muted-foreground">
        Set specific times for updates to run.
      </p>
    </div>
  </div>
</RadioGroup>`}
        >
          <RadioGroup defaultValue="automatic">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="automatic" id="automatic" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="automatic">Automatic</Label>
                <p className="text-sm text-muted-foreground">
                  System picks the best option based on your activity.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="manual" id="manual" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="manual">Manual</Label>
                <p className="text-sm text-muted-foreground">
                  You decide when updates are applied.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="scheduled" id="scheduled" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="scheduled">Scheduled</Label>
                <p className="text-sm text-muted-foreground">
                  Set specific times for updates to run.
                </p>
              </div>
            </div>
          </RadioGroup>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Disabled</h3>
        <ComponentPreview
          code={`<RadioGroup defaultValue="option-one" disabled>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="disabled-one" />
    <Label htmlFor="disabled-one" className="text-muted-foreground">Disabled Selected</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="disabled-two" />
    <Label htmlFor="disabled-two" className="text-muted-foreground">Disabled</Label>
  </div>
</RadioGroup>`}
        >
          <RadioGroup defaultValue="option-one" disabled>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="disabled-one" />
              <Label htmlFor="disabled-one" className="text-muted-foreground">Disabled Selected</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="disabled-two" />
              <Label htmlFor="disabled-two" className="text-muted-foreground">Disabled</Label>
            </div>
          </RadioGroup>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Horizontal Layout</h3>
        <ComponentPreview
          code={`<RadioGroup defaultValue="daily" className="flex space-x-4">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="hourly" id="hourly" />
    <Label htmlFor="hourly">Hourly</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="daily" id="daily" />
    <Label htmlFor="daily">Daily</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="weekly" id="weekly" />
    <Label htmlFor="weekly">Weekly</Label>
  </div>
</RadioGroup>`}
        >
          <RadioGroup defaultValue="daily" className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hourly" id="hourly" />
              <Label htmlFor="hourly">Hourly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily">Daily</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">Weekly</Label>
            </div>
          </RadioGroup>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Card variant
        </h2>
        <p className="leading-7 text-muted-foreground">
          For a selectable card where the whole surface is the control, use
          RadioCard inside a RadioGroup. Focus and the selected state live on
          the card, the entire card is clickable, and the group keeps roving
          focus and single-select intact. Put only static content inside
          (text, images, badges), never another interactive control.
        </p>
        <ComponentPreview
          code={`<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" label="Standard" description="4–10 business days" />
  <RadioCard value="fast" label="Fast" description="2–5 business days" />
  <RadioCard value="next-day" label="Next day" description="1 business day" />
</RadioGroup>`}
        >
          <RadioGroup defaultValue="standard" className="grid gap-3">
            <RadioCard
              value="standard"
              label="Standard"
              description="4–10 business days"
            />
            <RadioCard
              value="fast"
              label="Fast"
              description="2–5 business days"
            />
            <RadioCard
              value="next-day"
              label="Next day"
              description="1 business day"
            />
          </RadioGroup>
        </ComponentPreview>
        <p className="leading-7 text-muted-foreground">
          Hide the dot with <code className="bg-muted px-1 py-0.5 rounded text-sm">hideIndicator</code>,
          move it with{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">indicatorPosition=&quot;leading&quot;</code>,
          or pass arbitrary content (an image, a custom layout) as children
          instead of label/description.
        </p>
        <h3 className="text-lg font-medium">Variations</h3>
        <p className="text-muted-foreground">
          Indicator on the leading edge, and indicator hidden (selection reads
          from the card border and background) laid out in a grid via{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">className</code>{" "}
          on the group.
        </p>
        <ComponentPreview
          code={`{/* Indicator leading */}
<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" indicatorPosition="leading" label="Standard" description="4–10 business days" />
  <RadioCard value="fast" indicatorPosition="leading" label="Fast" description="2–5 business days" />
</RadioGroup>

{/* Indicator hidden, two-up grid */}
<RadioGroup defaultValue="m" className="grid grid-cols-2 gap-3">
  <RadioCard value="s" hideIndicator label="Small" description="Up to 10 seats" />
  <RadioCard value="m" hideIndicator label="Medium" description="Up to 50 seats" />
</RadioGroup>`}
        >
          <div className="grid gap-6">
            <RadioGroup defaultValue="standard" className="grid gap-3">
              <RadioCard
                value="standard"
                indicatorPosition="leading"
                label="Standard"
                description="4–10 business days"
              />
              <RadioCard
                value="fast"
                indicatorPosition="leading"
                label="Fast"
                description="2–5 business days"
              />
            </RadioGroup>
            <RadioGroup defaultValue="m" className="grid grid-cols-2 gap-3">
              <RadioCard
                value="s"
                hideIndicator
                label="Small"
                description="Up to 10 seats"
              />
              <RadioCard
                value="m"
                hideIndicator
                label="Medium"
                description="Up to 50 seats"
              />
            </RadioGroup>
          </div>
        </ComponentPreview>
        <SidecarBlock slug="radio-card" title="RadioCard sidecar" />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={radioGroupProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Built on Radix UI RadioGroup for full accessibility</li>
          <li>Keyboard navigation (Arrow keys to move, Space to select)</li>
          <li>WAI-ARIA radiogroup pattern</li>
          <li>Always pair with Label components</li>
        </ul>
      </div>

      <SidecarBlock slug="radio-group" />

      <ComponentNav currentHref="/components/radio-group" />
    </div>
  );
}
