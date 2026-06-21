---
name: ColorPicker
import: "@gradeui/ui"
props:
  - value?: string | null — a Grade colour token NAME ("action/primary"), the literal "transparent", or null when nothing is picked
  - onValueChange?: (value: string | null) => void — fired with the next value (token name, "transparent", or null)
  - tokens?: { group, tokens }[] — token families offered in the list; defaults to the Grade semantic set (surface / action / status)
  - searchable?: boolean — show the search input (default true)
  - triggerVariant? (default | inline) — default = form-control surface (swatch + name); inline = just a clickable swatch for inspector / fill-row use
  - placeholder?: string — trigger text when nothing is selected
  - searchPlaceholder?: string — search-input placeholder
  - emptyMessage?: string — shown when search returns no rows
  - allowTransparent?: boolean — include a Transparent option at the top (default true)
  - align? (start | center | end) — popover alignment (default start)
  - disabled?: boolean — lock to a read-only display of the current value
when_to_use: The token-led single-select colour picker — the focused "pick one colour token" sibling of FillPicker's solid tab. Use it anywhere a value is ONE Grade colour token (a fill colour, a border colour, an accent override) rather than a full paint. Composes Popover + Command exactly like Combobox, but each row is a Swatch + the token's short name, grouped by family and searchable. triggerVariant="inline" reduces the trigger to a single clickable swatch — reach for that inside inspectors and the FillSection fill rows. For a full paint (gradient / image / shader) use FillPicker; for a list of fills use FillSection; for a multi-stop gradient use GradientEditor.
composes_with: [Popover, Command, Swatch, FillSection, GradientEditor, Field, PropertyList]
aliases: [color picker, colour picker, token picker, colour token picker, color token picker, swatch picker, paint colour, fill colour picker, accent picker, colour dropdown]
---

```jsx
// Token-led colour field.
<ColorPicker value={color} onValueChange={setColor} />
```

```jsx
// Inline swatch trigger — the inspector / fill-row affordance.
<ColorPicker
  triggerVariant="inline"
  value={stopColor}
  onValueChange={setStopColor}
  aria-label="Stop colour"
/>
```
