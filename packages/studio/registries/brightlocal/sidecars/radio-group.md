---
name: RadioGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/radio-group"
subcomponents: [RadioGroupItem]
variants: [simple, box, boxIconVertical, boxIconHorizontal]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - error?: boolean — Whether the radio group has an error state
---

```jsx
<RadioGroup dataHook="payment-method" defaultValue="card">
  <Field orientation="horizontal">
    <RadioGroupItem value="card" id="card" />
    <FieldContent>
      <FieldLabel htmlFor="card" dataHook="card-label">Card Payment</FieldLabel>
      <FieldDescription dataHook="card-desc">Pay with credit or debit card</FieldDescription>
    </FieldContent>
  </Field>
  <Field orientation="horizontal">
    <RadioGroupItem value="paypal" id="paypal" />
    <FieldContent>
      <FieldLabel htmlFor="paypal" dataHook="paypal-label">PayPal</FieldLabel>
      <FieldDescription dataHook="paypal-desc">Fast and secure payment</FieldDescription>
    </FieldContent>
  </Field>
</RadioGroup>
```
```jsx
<RadioGroup
  key="false"
  dataHook="radio-group"
  defaultValue="option-1"
  trackingEl="radio-group-element"
  trackingLabel="Radio Group Component"
  variant="box"
>
  <Field
    orientation="horizontal"
    variant="box"
  >
    <RadioGroupItem
      id="_r_11_"
      value="option-1"
    />
    <FieldContent>
      <FieldLabel
        dataHook="radio-label-1"
        htmlFor="_r_11_"
      >
        Card Payment
      </FieldLabel>
      <FieldDescription dataHook="radio-desc-1">
        Pay with credit or debit card
      </FieldDescription>
    </FieldContent>
  </Field>
  <Field
    orientation="horizontal"
    variant="box"
  >
    <RadioGroupItem
      id="_r_12_"
      value="option-2"
    />
    <FieldContent>
      <FieldLabel
        dataHook="radio-label-2"
        htmlFor="_r_12_"
      >
        PayPal
      </FieldLabel>
      <FieldDescription dataHook="radio-desc-2">
        Fast and secure payment with PayPal
      </FieldDescription>
    </FieldContent>
  </Field>
  <Field
    orientation="horizontal"
    variant="box"
  >
    <RadioGroupItem
      id="_r_13_"
      value="option-3"
    />
    <FieldContent>
      <FieldLabel
        dataHook="radio-label-3"

/* …truncated */
```
```jsx
<RadioGroup
  key="false"
  dataHook="radio-group"
  defaultValue="option-1"
  trackingEl="radio-group-element"
  trackingLabel="Radio Group Component"
  variant="boxIconVertical"
>
  <Field variant="box">
    <RadioGroupItem
      id="_r_39_"
      value="option-1"
    >
      <Store size={46} />
    </RadioGroupItem>
    <FieldContent>
      <FieldLabel
        dataHook="radio-label-1"
        htmlFor="_r_39_"
      >
        Store
      </FieldLabel>
      <FieldDescription dataHook="radio-desc-1">
        Physical retail location
      </FieldDescription>
    </FieldContent>
  </Field>
  <Field variant="box">
    <RadioGroupItem
      id="_r_3a_"
      value="option-2"
    >
      <Globe size={46} />
    </RadioGroupItem>
    <FieldContent>
      <FieldLabel
        dataHook="radio-label-2"
        htmlFor="_r_3a_"
      >
        Online
      </FieldLabel>
      <FieldDescription dataHook="radio-desc-2">
        E-commerce platform
      </FieldDescription>
    </FieldContent>
  </Field>
  <Field variant="box">
    <RadioGroupItem
      id="_r_3b_"
      value="option-3"
    >
      <Briefcase size={46} />
    </RadioGroupItem>
    <FieldContent>
      <FieldLabel
        data
/* …truncated */
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-radiogroup--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
