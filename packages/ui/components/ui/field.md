---
name: Field
import: "@gradeui/ui"
element: div
subelements:
  - FieldLabel: label
  - FieldSet: fieldset
  - FieldLegend: legend
subcomponents: [FieldLabel, FieldTitle, FieldDescription, FieldContent, FieldTrailing, FieldGroup, FieldSet, FieldLegend, FieldSeparator, FieldError]
props:
  - orientation?: "vertical" | "horizontal" | "responsive" — vertical (default): label on top, control, then description (Input/Select/Textarea fields); horizontal: control + text in a row, placement follows DOM order (control first = checkbox row; control after text = settings row); responsive: vertical then horizontal at @md (needs a Field.Group ancestor)
  - layout?: "option" | "setting" — DEPRECATED alias; option → horizontal control-leading, setting → horizontal control-trailing. Prefer orientation
  - children: one control (Checkbox / RadioGroupItem / Switch / Input / Select / Textarea) + Field.Label (or Field.Title) + Field.Description? + Field.Trailing? + Field.Content? — id + aria-describedby auto-wired
  - "data-invalid / data-disabled": set on <Field> to cascade error / disabled styling to label + description (via the group/field selector)
when_to_use: The form-field wrapper. Default vertical for Input/Select/Textarea (label on top). horizontal for a checkbox/radio row (control first) or a settings row (label left, Switch right). Stack fields with Field.Group; group a related set with Field.Set + Field.Legend; divide with Field.Separator; surface validation with Field.Error; use Field.Title for a non-label heading. For a selectable CARD where the whole surface is the control, use RadioCard / CheckboxCard / SwitchCard instead.
composes_with: [Input, Select, Textarea, Checkbox, RadioGroup, RadioGroupItem, Switch, Badge (inside Field.Trailing), Field.Group, Field.Set, Field.Legend, Field.Separator, Field.Error, Field.Content, Field.Title]
aliases: [field, form field, control row, label and description, input field, vertical field, two line checkbox, option row, setting row, toggle row, field group, fieldset, field legend, field error, orientation]
---

```jsx
<Field>
  <Checkbox value="terms" />
  <Field.Label>Accept terms</Field.Label>
  <Field.Description>You agree to the privacy policy.</Field.Description>
</Field>
```

```jsx
<Field layout="setting">
  <Field.Label>Email notifications</Field.Label>
  <Field.Description>Weekly digest of activity.</Field.Description>
  <Switch defaultChecked />
</Field>
```
