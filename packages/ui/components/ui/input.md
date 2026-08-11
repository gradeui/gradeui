---
name: Input
import: "@gradeui/ui"
element: input
props:
  - type?: string (text | email | password | number | search | url | tel | date)
  - placeholder?: string — hint text shown while the input is empty. Model it explicitly (not just a native passthrough) so generated screens carry placeholders and the validator accepts them.
  - size?: "lg" | "default" | "sm" | "xs" | "2xs" — control density. `lg` (h-11, stays 16px text) for a prominent single-value field like an amount in a dialog; `default` (h-9) for forms; `sm` (h-8), `xs` (h-7) and `2xs` (h-6) for dense tool panels like the inspector. NOTE: pre-unification scale — see Figma parity audit; due to migrate to the t-shirt scale (xs 24 | sm 28 | md 32 | lg 40, default→md).
  - startSlot?: ReactNode — adornment rendered inside the leading edge (icon, prefix, currency symbol). Non-interactive by default so clicks focus the input.
  - endSlot?: ReactNode — adornment rendered inside the trailing edge (unit like "px", a clear button, a stepper). Same pointer rules as startSlot.
  - revealable?: boolean — adds the show/hide eye toggle to a `type="password"` field, with the aria-label and aria-pressed wiring done. Ignored on any other type. THIS is the password field: do not hand-compose an eye button into endSlot, and do not reach for a separate PasswordInput, there isn't one. Composes with endSlot (the consumer's adornment renders first, the toggle sits outermost).
  - All native input HTML attrs (value, onChange, placeholder, disabled, required)
when_to_use: Any single-line text entry. Always pair with a Label for accessibility. Use startSlot/endSlot for icons, prefixes and units instead of hand-positioning absolute children; use size="sm"/"xs" in dense tool panels.
composes_with: [Label, Form, Card (in CardContent), Button (form submit)]
aliases: [text field, textbox, textfield, form field, text input, secure field, search field, url field, number field, textinput, text input field, react native textinput, unit input, input with icon]
---

```jsx
<div className="grid gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

Slots — a leading icon and a trailing unit, no manual positioning:

```jsx
<Input
  size="sm"
  type="number"
  placeholder="0"
  startSlot={<Ruler className="size-4" />}
  endSlot={<span className="text-xs text-muted-foreground">px</span>}
/>
```

Sizes — `default` for forms, `sm` / `xs` for dense panels:

```jsx
<div className="grid gap-2">
  <Input size="default" placeholder="Default (h-9)" />
  <Input size="sm" placeholder="Small (h-8)" />
  <Input size="xs" placeholder="Extra small (h-7)" />
</div>
```
