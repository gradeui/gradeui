---
name: Checkbox
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/checkbox"
props:
  - disabled? — TODO(review): type + one-line description from src
  - error? — TODO(review): type + one-line description from src
  - checked? — TODO(review): type + one-line description from src
  - onCheckedChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: on/off toggle (use Switch); radio selection (use RadioGroup).
aliases: [check, checkmark, tick box]
---

```jsx
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Field, FieldLabel, FieldDescription } from "@brightlocal/ui-components/field";

function Example() {
  return (
    <Field orientation="horizontal">
      <Checkbox id="terms" dataHook="terms-checkbox" />
      <FieldLabel htmlFor="terms" dataHook="terms-label">I agree to the terms and conditions</FieldLabel>
    </Field>
  );
}
```
```jsx
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Field, FieldLabel, FieldDescription, FieldContent } from "@brightlocal/ui-components/field";

function Example() {
  return (
    <Field orientation="horizontal">
      <Checkbox
      id="marketing"
      dataHook="marketing-checkbox"
      checked={true}
      />
      <FieldContent>
        <FieldLabel htmlFor="marketing" dataHook="marketing-label">Marketing emails</FieldLabel>
        <FieldDescription dataHook="marketing-desc">Receive updates about new features and promotions.</FieldDescription>
      </FieldContent>
    </Field>
  );
}
```
```jsx
import { Checkbox } from "@brightlocal/ui-components/checkbox";

function Example() {
  return (
    <Checkbox
      aria-label="Select row"
      dataHook="select-row-checkbox"
    />
  );
}
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-checkbox--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
