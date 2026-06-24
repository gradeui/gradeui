---
name: SelectionCard
import: "@gradeui/ui"
subcomponents: [RadioCard, CheckboxCard, SwitchCard]
props:
  - label?: ReactNode — title line. Omit and pass `children` for fully custom content.
  - description?: ReactNode — secondary line under the label.
  - aside?: ReactNode — slot between content and indicator (a Badge, price, kbd hint).
  - hideIndicator?: boolean — hide the dot/check/switch glyph; selection is then shown by the card's selected border + background. Semantics stay intact.
  - indicatorPosition? (leading | trailing) — which side the glyph sits on; default trailing.
  - RadioCard: value (string) — required; sits inside a `RadioGroup`. Renders as a RadioGroupPrimitive.Item.
  - CheckboxCard: checked? / defaultChecked? / onCheckedChange? — renders as a CheckboxPrimitive.Root.
  - SwitchCard: checked? / defaultChecked? / onCheckedChange? — renders as a SwitchPrimitives.Root.
when_to_use: A selectable option where the WHOLE card is the control — plan pickers, shipping/payment options, onboarding choices, settings toggles. Use RadioCard for single-select (inside a RadioGroup), CheckboxCard for multi-select, SwitchCard for an on/off option. The glyph differs by type on purpose so single-select vs multi-select vs toggle reads at a glance. All three share one `.gds-selection-card` surface so they look identical sitting together, and every visual is token-driven (`--gds-selection-card-*` with semantic fallbacks) so a project can re-skin them through the per-project override layer without forking.
composes_with: [RadioGroup, Badge, Label, Grid, Stack]
aliases: [selection card, radio card, checkbox card, switch card, option card, choice card, plan picker, pricing option, selectable card, tile select]
---

The card itself carries `role=radio` / `checkbox` / `switch`, focus, hover, and the
checked state — the entire surface is the hit target. The glyph is only a visual
indicator.

```jsx
// Single-select: RadioCards inside a RadioGroup.
<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" label="Standard" description="4–10 business days" />
  <RadioCard value="fast"     label="Fast"     description="2–5 business days" aside={<Badge>Popular</Badge>} />
  <RadioCard value="next-day" label="Next day" description="1 business day" />
</RadioGroup>
```

```jsx
// Multi-select + toggle.
<div className="grid gap-3">
  <CheckboxCard defaultChecked label="Email receipts" description="Sent after each order" />
  <SwitchCard label="Dark mode" description="Match the system theme" />
</div>
```

**Anti-pattern — never nest interactive content.** Because the card is itself a
control, do NOT put a Slider, Input, Button, or link inside it. Static content only
(text, images, badges). If a card needs its own controls, use a plain `Card` with a
`Field` row + the control as siblings instead.
