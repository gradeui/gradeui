---
name: Stepper
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/stepper"
subcomponents: [StepperNav, StepperItem, StepperTrigger, StepperIndicator, StepperSeparator, StepperContent, StepperTitle, StepperDescription]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - steps — Ordered list of steps. Defines step order, total count and id → index resolution.
  - value? — Controlled active step id.
  - defaultValue? — Active step id for uncontrolled usage. Defaults to the first step.
  - onValueChange? — Called with the new active step id when the active step changes.
  - orientation? — Layout orientation. (default "horizontal")
  - labelPlacement? — Where labels sit relative to the indicator in horizontal orientation. (default "below")
  - ariaLabel?: string — Accessible label for the stepper region. (default "Progress")
  - trackingEl?: string — Tracking element identifier for analytics.
  - trackingLabel?: string — Tracking label for analytics context.
  - stepId: string — StepperItem: Id of the step this item represents (must match an `id` in `steps`).
  - completed?: boolean — StepperItem: Force the completed state regardless of the active step.
  - error?: boolean — StepperItem: Mark the step as errored (shows the error indicator).
  - disabled?: boolean — StepperItem: Disable interaction with the step.
  - loading?: boolean — StepperItem: Show a loading spinner in the indicator while this step is active.
  - asChild?: boolean — StepperTrigger: Render as the child element instead of a button (Radix Slot pattern). Note: the disabled state is not applied automatically when `asChild` is true — the consumer must handle disabled styling/behavior on the child.
  - completedLabel?: string — StepperIndicator: Screen-reader label appended when the step is completed. (default "Completed")
  - errorLabel?: string — StepperIndicator: Screen-reader label appended when the step has an error. (default "Error")
  - loadingLabel?: string — StepperIndicator: Screen-reader label appended while the step is loading. (default "Loading")
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
