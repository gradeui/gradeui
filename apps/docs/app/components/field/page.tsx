"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const fieldProps = [
  {
    name: "orientation",
    type: '"vertical" | "horizontal" | "responsive"',
    default: '"vertical"',
    description:
      "vertical = label on top, control, then description (Input / Select / Textarea fields). horizontal = control + text in a row; placement follows DOM order (control first = checkbox/radio row; control after the text = settings row). responsive = vertical, switching to horizontal at @md (needs a Field.Group ancestor).",
  },
  {
    name: "layout",
    type: '"option" | "setting"',
    default: "-",
    description:
      "Deprecated alias for orientation. option → horizontal (control leads); setting → horizontal (control trails). Prefer orientation.",
  },
  {
    name: "children",
    type: "ReactNode",
    default: "-",
    description:
      "One control (Input / Select / Textarea / Checkbox / RadioGroupItem / Switch) plus Field.Label (or Field.Title), optional Field.Description, and optional Field.Trailing. id + aria-describedby are wired automatically.",
  },
];

const slotProps = [
  {
    name: "Field.Content",
    type: "<div> props",
    default: "-",
    description:
      "Stacks the label + description. Required in a horizontal field so the text stacks beside the control (shadcn anatomy).",
  },
  {
    name: "Field.Label",
    type: "<label> props",
    default: "-",
    description:
      "The label line. htmlFor is wired to the control automatically. Wrap a Field in a Field.Label to turn it into a selectable card.",
  },
  {
    name: "Field.Title",
    type: "<div> props",
    default: "-",
    description:
      "A non-label title — use inside a card (a Field wrapped in Field.Label) so you don't nest two labels.",
  },
  {
    name: "Field.Description",
    type: "<p> props",
    default: "-",
    description:
      "Optional secondary line. Linked to the control via aria-describedby automatically.",
  },
  {
    name: "Field.Error",
    type: "<div> props + errors?",
    default: "-",
    description:
      "Validation message (role=alert). Pass children or an errors array (react-hook-form friendly).",
  },
  {
    name: "Field.Group / Set / Legend / Separator",
    type: "layout props",
    default: "-",
    description:
      "Structural helpers for composing multiple fields, matching shadcn's Field family.",
  },
  {
    name: "Field.Trailing",
    type: "<div> props",
    default: "-",
    description:
      "Grade extension (not in shadcn): a slot pinned to the end of the row (a Badge, kbd, price).",
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
        <p className="text-muted-foreground">
          Vertical is the default — label on top, control, then description.
          The workhorse for Input / Select / Textarea fields.
        </p>
        <ComponentPreview
          code={`<Field>
  <Field.Label>Email</Field.Label>
  <Input type="email" placeholder="you@example.com" />
  <Field.Description>We'll never share it.</Field.Description>
</Field>`}
        >
          <Field>
            <Field.Label>Email</Field.Label>
            <Input type="email" placeholder="you@example.com" />
            <Field.Description>We&apos;ll never share it.</Field.Description>
          </Field>
        </ComponentPreview>

        <p className="text-muted-foreground">
          For a checkbox or radio row, set orientation=&quot;horizontal&quot;,
          put the control first, and stack the text in a Field.Content.
        </p>
        <ComponentPreview
          code={`<Field orientation="horizontal">
  <Checkbox value="terms" />
  <Field.Content>
    <Field.Label>Accept terms</Field.Label>
    <Field.Description>You agree to the privacy policy.</Field.Description>
  </Field.Content>
</Field>`}
        >
          <Field orientation="horizontal">
            <Checkbox />
            <Field.Content>
              <Field.Label>Accept terms</Field.Label>
              <Field.Description>
                You agree to the privacy policy.
              </Field.Description>
            </Field.Content>
          </Field>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Trailing slot</h3>
        <p className="text-muted-foreground">
          Field.Trailing (a Grade extension) pins anything — a Badge, a price,
          a shortcut hint — to the end of the row.
        </p>
        <ComponentPreview
          code={`<Field orientation="horizontal">
  <Checkbox defaultChecked />
  <Field.Content>
    <Field.Label>Enable beta features</Field.Label>
    <Field.Description>Early access, may change.</Field.Description>
  </Field.Content>
  <Field.Trailing><Badge variant="info-soft">New</Badge></Field.Trailing>
</Field>`}
        >
          <Field orientation="horizontal">
            <Checkbox defaultChecked />
            <Field.Content>
              <Field.Label>Enable beta features</Field.Label>
              <Field.Description>Early access, may change.</Field.Description>
            </Field.Content>
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
  <Field orientation="horizontal">
    <RadioGroupItem value="weekly" />
    <Field.Content>
      <Field.Label>Weekly</Field.Label>
      <Field.Description>A digest every Monday.</Field.Description>
    </Field.Content>
  </Field>
  <Field orientation="horizontal">
    <RadioGroupItem value="daily" />
    <Field.Content>
      <Field.Label>Daily</Field.Label>
      <Field.Description>One email each morning.</Field.Description>
    </Field.Content>
  </Field>
</RadioGroup>`}
        >
          <RadioGroup defaultValue="weekly" className="gap-4">
            <Field orientation="horizontal">
              <RadioGroupItem value="weekly" />
              <Field.Content>
                <Field.Label>Weekly</Field.Label>
                <Field.Description>A digest every Monday.</Field.Description>
              </Field.Content>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="daily" />
              <Field.Content>
                <Field.Label>Daily</Field.Label>
                <Field.Description>One email each morning.</Field.Description>
              </Field.Content>
            </Field>
          </RadioGroup>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Setting row</h3>
        <p className="text-muted-foreground">
          In a horizontal field, putting the control after the text pins it
          to the right — the classic settings list with a Switch.
        </p>
        <ComponentPreview
          code={`<Field orientation="horizontal">
  <Field.Content>
    <Field.Label>Email notifications</Field.Label>
    <Field.Description>Weekly digest of activity.</Field.Description>
  </Field.Content>
  <Switch defaultChecked />
</Field>`}
        >
          <Field orientation="horizontal">
            <Field.Content>
              <Field.Label>Email notifications</Field.Label>
              <Field.Description>Weekly digest of activity.</Field.Description>
            </Field.Content>
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
