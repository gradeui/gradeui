// FormFieldWithRHF — A form field wired to React Hook Form using Controller, with label, input, and error display.
// keywords: form field rhf, react hook form, controller, form validation, field error, rhf field
// components: field, input
// Harvested from BrightLocal's DS MCP (get_composition_recipe "FormFieldWithRHF") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@brightlocal/ui-components/field";
import { Input } from "@brightlocal/ui-components/input";

// Inside your form component:
const { control } = useFormContext();

<Controller
  name="email"
  control={control}
  rules={{ required: "Email is required" }}
  render={({ field, fieldState }) => (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input
        id="email"
        dataHook="rhf-email-input"
        type="email"
        aria-invalid={!!fieldState.error}
        {...field}
      />
      {fieldState.error && (
        <FieldError>{fieldState.error.message}</FieldError>
      )}
    </Field>
  )}
/>
