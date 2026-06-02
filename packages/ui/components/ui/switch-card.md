---
name: SwitchCard
import: "@gradeui/ui"
props:
  - checked? / defaultChecked? / onCheckedChange? — standard switch state
  - label?: ReactNode — title line
  - description?: ReactNode — secondary line
  - aside?: ReactNode — slot before the indicator (a Badge, price, hint)
  - hideIndicator?: boolean — hide the switch glyph; state shown by the card border + background
  - indicatorPosition?: "leading" | "trailing" — default trailing
  - children?: ReactNode — arbitrary static content instead of label/description
when_to_use: A prominent on/off setting presented as a whole selectable card. The whole card is the switch, so the toggled state lives on the card surface. Standalone. For a row of compact settings (label left, small Switch right) use Field layout="setting" instead — SwitchCard is for the heavier, card-sized toggle.
composes_with: [Badge (in aside), Stack (stacking several)]
aliases: [switch card, toggle card, setting card, feature toggle card]
---

```jsx
<SwitchCard label="Auto-renew" description="Renew this plan automatically each month" defaultChecked />
```

Indicator on the leading edge:

```jsx
<SwitchCard
  indicatorPosition="leading"
  label="Auto-renew"
  description="Renew this plan automatically each month"
  defaultChecked
/>
```
