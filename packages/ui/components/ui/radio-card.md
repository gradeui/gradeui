---
name: RadioCard
import: "@gradeui/ui"
props:
  - value: string (required) — the radio value
  - label?: ReactNode — title line
  - description?: ReactNode — secondary line
  - aside?: ReactNode — slot before the indicator (a Badge, price, hint)
  - hideIndicator?: boolean — hide the dot; selection shown by the card border + background
  - indicatorPosition?: "leading" | "trailing" — default trailing
  - children?: ReactNode — arbitrary static content (image, custom layout) instead of label/description
when_to_use: Single-select where each option is a whole selectable card (shipping options, plan picker, onboarding choices). The whole card is the control, so focus and the checked state live on the card surface and the entire card is clickable. MUST sit inside a RadioGroup (keeps roving focus + single-select). Static content only — never nest an interactive control (Slider/Input/Button/link) inside. For a plain radio + label row use Field instead.
composes_with: [RadioGroup (required parent), Badge (in aside), MediaSurface (custom children)]
aliases: [radio card, selectable card, option card, plan picker, choice card, pricing tier, segmented choice card]
---

```jsx
<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" label="Standard" description="4–10 business days" />
  <RadioCard value="fast" label="Fast" description="2–5 business days" />
  <RadioCard value="next-day" label="Next day" description="1 business day" />
</RadioGroup>
```

Indicator on the leading edge instead of trailing:

```jsx
<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" indicatorPosition="leading" label="Standard" description="4–10 business days" />
  <RadioCard value="fast" indicatorPosition="leading" label="Fast" description="2–5 business days" />
</RadioGroup>
```

No visible dot (selection reads from the card border + background), laid out in a grid via className on the group:

```jsx
<RadioGroup defaultValue="m" className="grid grid-cols-2 gap-3">
  <RadioCard value="s" hideIndicator label="Small" description="Up to 10 seats" />
  <RadioCard value="m" hideIndicator label="Medium" description="Up to 50 seats" />
</RadioGroup>
```
