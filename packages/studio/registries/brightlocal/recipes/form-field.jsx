// FormField — A standardized form field with label, input, description, and error message.
// keywords: form field, input group, label input error, form input, field wrapper, input with label
// components: field, label, input
// Harvested from BrightLocal's DS MCP (get_composition_recipe "FormField") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<Field>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" dataHook="email-input" type="email" />
  <FieldDescription>We'll never share your email.</FieldDescription>
  <FieldError>Please enter a valid email.</FieldError>
</Field>
