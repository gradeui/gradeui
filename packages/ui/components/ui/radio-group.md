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
when_to_use: A small set of mutually-exclusive options where the user needs to SEE all of them at once — pricing tiers (3-4 options), shipping speed, payment method radio cards. For 5+ options use Select. For a segmented control as part of a toolbar use ToggleGroup. For yes/no use Switch.
composes_with: [Label (paired with each item via htmlFor), Stack (vertical list), Card (radio card pattern)]
aliases: [radio group, radio buttons, single-choice, pricing options, payment method]
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
