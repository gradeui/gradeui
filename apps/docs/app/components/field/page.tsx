"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const fieldProps = [
  {
    name: "layout",
    type: '"option" | "setting"',
    default: '"option"',
    description:
      "option = control leads, text stacks beside it (checkbox / radio rows). setting = text leads, control pinned trailing (the classic settings row, e.g. a Switch).",
  },
  {
    name: "children",
    type: "ReactNode",
    default: "-",
    description:
      "One bare control (Checkbox / RadioGroupItem / Switch) plus Field.Label, optional Field.Description, and optional Field.Trailing. Order does not matter.",
  },
];

const slotProps = [
  {
    name: "Field.Label",
    type: "<label> props",
    default: "-",
    description:
      "The title line. Its htmlFor is wired to the control automatically.",
  },
  {
    name: "Field.Description",
    type: "<p> props",
    default: "-",
    description:
      "Optional secondary line. Linked to the control via aria-describedby automatically.",
  },
  {
    name: "Field.Trailing",
    type: "<div> props",
    default: "-",
    description: "Optional slot pinned to the end of the row (a Badge, kbd, price).",
  },
];

export default function FieldPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Field</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Inline composition for a control and its caption. Pairs a bare
          Checkbox, RadioGroupItem, or Switch with a label, an optional
          description, and an optional trailing slot — and wires the id and
          aria plumbing for you, so the primitives stay bare.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Field } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Field>
  <Checkbox value="terms" />
  <Field.Label>Accept terms</Field.Label>
  <Field.Description>You agree to the privacy policy.</Field.Description>
</Field>`}
        >
          <Field>
            <Checkbox />
            <Field.Label>Accept terms</Field.Label>
            <Field.Description>
              You agree to the privacy policy.
            </Field.Description>
          </Field>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Trailing slot</h3>
        <p className="text-muted-foreground">
          Field.Trailing pins anything (a Badge, a price, a shortcut hint) to
          the end of the row.
        </p>
        <ComponentPreview
          code={`<Field>
  <Checkbox defaultChecked />
  <Field.Label>Enable beta features</Field.Label>
  <Field.Description>Early access, may change.</Field.Description>
  <Field.Trailing><Badge variant="info-soft">New</Badge></Field.Trailing>
</Field>`}
        >
          <Field>
            <Checkbox defaultChecked />
            <Field.Label>Enable beta features</Field.Label>
            <Field.Description>Early access, may change.</Field.Description>
            <Field.Trailing>
              <Badge variant="info-soft">New</Badge>
            </Field.Trailing>
          </Field>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Radio rows in a group</h3>
        <p className="text-muted-foreground">
          Wrap each RadioGroupItem in a Field. The RadioGroup keeps roving
          focus and single-select behaviour intact.
        </p>
        <ComponentPreview
          code={`<RadioGroup defaultValue="weekly" className="gap-4">
  <Field>
    <RadioGroupItem value="weekly" />
    <Field.Label>Weekly</Field.Label>
    <Field.Description>A digest every Monday.</Field.Description>
  </Field>
  <Field>
    <RadioGroupItem value="daily" />
    <Field.Label>Daily</Field.Label>
    <Field.Description>One email each morning.</Field.Description>
  </Field>
</RadioGroup>`}
        >
          <RadioGroup defaultValue="weekly" className="gap-4">
            <Field>
              <RadioGroupItem value="weekly" />
              <Field.Label>Weekly</Field.Label>
              <Field.Description>A digest every Monday.</Field.Description>
            </Field>
            <Field>
              <RadioGroupItem value="daily" />
              <Field.Label>Daily</Field.Label>
              <Field.Description>One email each morning.</Field.Description>
            </Field>
          </RadioGroup>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Setting row</h3>
        <p className="text-muted-foreground">
          layout=&quot;setting&quot; flips the row: text on the left, control
          pinned right. The classic settings list with a Switch.
        </p>
        <ComponentPreview
          code={`<Field layout="setting">
  <Field.Label>Email notifications</Field.Label>
  <Field.Description>Weekly digest of activity.</Field.Description>
  <Switch defaultChecked />
</Field>`}
        >
          <Field layout="setting">
            <Field.Label>Email notifications</Field.Label>
            <Field.Description>Weekly digest of activity.</Field.Description>
            <Switch defaultChecked />
          </Field>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={fieldProps} />
        <h3 className="text-lg font-medium">Slots</h3>
        <PropsTable props={slotProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Generates one id, hands it to the control, and sets the
            label&apos;s htmlFor — so clicking the label toggles the control.
          </li>
          <li>
            Links Field.Description to the control via aria-describedby when
            present.
          </li>
          <li>
            The control stays a bare primitive; Field clones it to inject the
            wiring rather than requiring a description prop on the control.
          </li>
          <li>
            For a selectable card where the whole surface is the control, use
            RadioCard / CheckboxCard / SwitchCard instead.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="field" />

      <ComponentNav currentHref="/components/field" />
    </div>
  );
}
