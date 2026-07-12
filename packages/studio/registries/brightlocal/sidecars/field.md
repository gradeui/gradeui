---
name: Field
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/field"
subcomponents: [FieldLabel, FieldDescription, FieldError, FieldErrorIcon, FieldGroup, FieldLegend, FieldSet, FieldContent]
variants: [default, box]
props:
  - orientation? (vertical | horizontal | responsive)
  - align? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Wrapping any form input with label, description, and error message Canonical pattern: Field > FieldLabel + Input/Select/Textarea + FieldDescription + FieldError When integrating with React Hook Form — use Field with Controller to wire up error state Do NOT use for: standalone labels (use Label); inline text (use Typography). Use standalone Label only when building a custom field layout — Field includes FieldLabel with proper a11y wiring.
composes_with: [Label]
aliases: [form field, input group, field wrapper]
---

```jsx
<Field dataHook="email-field">
  <FieldLabel htmlFor="email" dataHook="email-label">Email Address</FieldLabel>
  <Input id="email" type="email" dataHook="email-input" />
  <FieldDescription dataHook="email-description">We'll never share your email</FieldDescription>
</Field>
```
```jsx
// Without icon (default)
<Field>
  <FieldLabel htmlFor="email">Email Address</FieldLabel>
  <Input id="email" type="email" dataHook="email-input" error />
  <FieldError>Please enter a valid email address.</FieldError>
</Field>

// With icon (composition pattern)
<Field>
  <FieldLabel htmlFor="email">Email Address</FieldLabel>
  <Input id="email" type="email" dataHook="email-input" error />
  <FieldError>
    <FieldErrorIcon /> Please enter a valid email address.
  </FieldError>
</Field>
```
```jsx
import { useForm } from "react-hook-form";

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="email">Email Address</FieldLabel>
        <Input
          id="email"
          type="email"
          dataHook="email-input"
          {...register("email", { required: "Email is required" })}
        />
        <FieldError errors={[errors.email]} />
      </Field>
    </form>
  );
}
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-field--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
