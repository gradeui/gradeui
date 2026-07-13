---
name: Textarea
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/textarea"
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - id?: string — Optional id attribute for linking with label via htmlFor
  - error?: boolean — Whether the textarea has an error state
  - trackingEl?: string — Optional tracking prop for analytics tracking element identifier
  - trackingLabel?: string — Optional tracking prop for analytics tracking label
---

```jsx
<Textarea
  dataHook="message-textarea"
  placeholder="Type your message here."
  rows={4}
/>
```
```jsx
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod/v4";
import { Textarea } from "@brightlocal/ui-components/textarea";
import {
  Field,
  FieldLabel,
  FieldDescription
} from "@brightlocal/ui-components/field";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

function TextareaExample() {
  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    mode: "onChange",
    defaultValues: { message: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => console.log(data))}>
      <Controller
        control={form.control}
        name="message"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Your message</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              placeholder="Type your message here."
              rows={4}
              dataHook="textarea"
              trackingEl="textarea-default"
              trackingLabel="default-story"
            />
            <FieldDescription>
              Your message w
/* …truncated */
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-textarea--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
