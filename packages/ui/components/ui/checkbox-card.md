---
name: CheckboxCard
import: "@gradeui/ui"
props:
  - checked? / defaultChecked? / onCheckedChange? — standard checkbox state
  - label?: ReactNode — title line
  - description?: ReactNode — secondary line
  - aside?: ReactNode — slot before the indicator (a Badge, price, hint)
  - hideIndicator?: boolean — hide the check; selection shown by the card border + background
  - indicatorPosition?: "leading" | "trailing" — default trailing
  - children?: ReactNode — arbitrary static content instead of label/description
when_to_use: Multi-select where each option is a whole selectable card (add-ons, feature toggles, opt-ins). The whole card is the control, so focus and the checked state live on the card surface. Standalone (not in a group). Static content only — never nest an interactive control inside. For a plain checkbox + label row use Field instead.
composes_with: [Badge (in aside), MediaSurface (custom children), Stack / Grid (laying out several)]
aliases: [checkbox card, selectable card, multi-select card, add-on card, feature card, opt-in card]
---

```jsx
<div className="grid gap-3">
  <CheckboxCard label="Priority support" description="24/7 response within an hour" defaultChecked />
  <CheckboxCard label="Extended warranty" description="3 years parts and labour" />
</div>
```

Indicator on the leading edge, with a Badge in the `aside` slot:

```jsx
<CheckboxCard
  indicatorPosition="leading"
  label="Priority support"
  description="24/7 response within an hour"
  aside={<Badge variant="info-soft">Popular</Badge>}
  defaultChecked
/>
```

No visible tick (selection reads from the card border + background), in a two-up grid:

```jsx
<div className="grid grid-cols-2 gap-3">
  <CheckboxCard hideIndicator label="Email" description="Weekly digest" defaultChecked />
  <CheckboxCard hideIndicator label="SMS" description="Critical alerts only" />
</div>
```
