---
name: Stepper
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/stepper"
subcomponents: [StepperNav, StepperItem, StepperTrigger, StepperIndicator, StepperSeparator, StepperContent, StepperTitle, StepperDescription]
props:
  - orientation? (horizontal | vertical)
  - labelPlacement? (below | inline)
  - state? (active | completed | inactive | error)
  - steps? — TODO(review): type + one-line description from src
  - value? — TODO(review): type + one-line description from src
  - defaultValue? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - orientation? — TODO(review): type + one-line description from src
  - labelPlacement? — TODO(review): type + one-line description from src
  - stepId? — TODO(review): type + one-line description from src
  - completed? — TODO(review): type + one-line description from src
  - error? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - loading? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
const steps = [{ id: "details" }, { id: "review" }, { id: "done" }];

<Stepper dataHook="checkout" steps={steps} defaultValue="review">
  <StepperNav>
    {steps.map((step, index) => (
      <StepperItem key={step.id} stepId={step.id}>
        <StepperTrigger>
          <StepperIndicator>{index + 1}</StepperIndicator>
        </StepperTrigger>
        <StepperSeparator />
      </StepperItem>
    ))}
  </StepperNav>
</Stepper>
```
```jsx
const steps = [
  { id: "account", title: "Account", description: "Create account" },
  { id: "payment", title: "Payment", description: "Add payment" },
  { id: "shipping", title: "Shipping", description: "Set address" },
  { id: "review", title: "Review", description: "Confirm order" },
];

<Stepper dataHook="checkout" steps={steps} defaultValue="shipping">
  <StepperNav>
    {steps.map((step) => (
      <StepperItem key={step.id} stepId={step.id}>
        <StepperTrigger>
          <StepperIndicator />
          <StepperContent>
            <StepperTitle>{step.title}</StepperTitle>
            <StepperDescription>{step.description}</StepperDescription>
          </StepperContent>
        </StepperTrigger>
        <StepperSeparator />
      </StepperItem>
    ))}
  </StepperNav>
</Stepper>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-stepper--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
