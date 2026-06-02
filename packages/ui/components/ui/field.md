---
name: Field
import: "@gradeui/ui"
props:
  - layout?: "option" | "setting" — option (default): control leads, text beside it; setting: text leads, control pinned trailing
  - children: one bare control (Checkbox / RadioGroupItem / Switch) + Field.Label + Field.Description? + Field.Trailing? — order does not matter
when_to_use: Pair a bare control with a label and optional description in a row, with id + aria-describedby wired automatically. Use layout="setting" for the classic settings row (label on the left, Switch on the right). For a selectable CARD where the whole surface is the control, use RadioCard / CheckboxCard / SwitchCard instead.
composes_with: [Checkbox, RadioGroup, RadioGroupItem, Switch, Badge (inside Field.Trailing)]
aliases: [field, form field, control row, label and description, two line checkbox, option row, setting row, toggle row]
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
