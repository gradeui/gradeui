---
name: Input
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input"
props:
  - error? — TODO(review): type + one-line description from src
  - hasIcon? — TODO(review): type + one-line description from src
  - hasSecondaryIcon? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: multi-line text (use Textarea); search with dropdown (use Combobox).
aliases: [text field, textbox, text input]
---

```jsx
<Input
  type="email"
  placeholder="Enter your email"
  dataHook="email-input"
/>
```
```jsx
<Field>
  <FieldLabel htmlFor="email">Email Address</FieldLabel>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
    dataHook="email-input"
  />
  <FieldDescription>We'll never share your email</FieldDescription>
</Field>
```
```jsx
<InputGroup dataHook="search-input-group">
  <InputGroupAddon className="pl-3">
    <Search />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-input--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
