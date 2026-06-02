---
name: RadioGroup
import: "@gradeui/ui"
subcomponents: [RadioGroupItem]
props:
  - RadioGroup: value?: string — controlled selection
  - RadioGroup: defaultValue?: string — uncontrolled initial
  - RadioGroup: onValueChange?: (value: string) => void
  - RadioGroup: disabled?: boolean
  - RadioGroup: orientation? "horizontal" | "vertical" (default "vertical")
  - RadioGroup: name?: string — form name when posting natively
  - RadioGroupItem: value: string — what the group emits when this item is picked
  - RadioGroupItem: id?: string — pair with a <Label htmlFor> for click-on-label
  - RadioGroupItem: disabled?: boolean
when_to_use: A small set of mutually-exclusive options where the user needs to SEE all of them at once — pricing tiers (3-4 options), shipping speed, payment method radio cards. When each option should be a whole clickable card (label + description, selected state on the card), use RadioCard inside the RadioGroup instead of a Card with a radio in the corner. For a plain label + description row, wrap RadioGroupItem in Field. For 5+ options use Select. For a segmented control as part of a toolbar use ToggleGroup. For yes/no use Switch.
composes_with: [Label (paired with each item via htmlFor), Field (label + description row), RadioCard (whole-card selectable option), Stack (vertical list)]
aliases: [radio group, radio buttons, single-choice, pricing options, payment method, radio buttons, radio control, single-select]
---

```jsx
<RadioGroup defaultValue="pro" name="plan">
  <Stack gap="sm">
    <Row gap="sm" align="center">
      <RadioGroupItem id="plan-free" value="free" />
      <Label htmlFor="plan-free">Free</Label>
    </Row>
    <Row gap="sm" align="center">
      <RadioGroupItem id="plan-pro" value="pro" />
      <Label htmlFor="plan-pro">Pro — $12/mo</Label>
    </Row>
    <Row gap="sm" align="center">
      <RadioGroupItem id="plan-team" value="team" />
      <Label htmlFor="plan-team">Team — $48/mo</Label>
    </Row>
  </Stack>
</RadioGroup>
```
