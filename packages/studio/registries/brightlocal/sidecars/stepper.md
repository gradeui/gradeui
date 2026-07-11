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

Guides users through a multi-step process, showing progress and the current step.

## Guidance

Stepper guides users through a multi-step process, showing progress and the current step.

### When to Use
- Multi-step forms, checkouts and onboarding flows
- Wizards where the user moves between sequential stages
- Any process where users benefit from seeing progress and what's next

### Features
- Compound API: `Stepper` › `StepperNav` › `StepperItem` › `StepperTrigger` › `StepperIndicator` / `StepperSeparator`
- Controlled and uncontrolled active-step management (by step `id`)
- States: active, completed (check icon), upcoming, error (cross icon) and disabled
- Loading state with spinner per step
- Horizontal and vertical orientations
- Color is supplemented with icons + text for non-colour state cues (a11y)

## Sub-components

| Component | Purpose |
|-----------|---------|
| `Stepper` | Root provider; tracks the active step and orientation/label placement |
| `StepperNav` | Ordered-list container that lays out the steps |
| `StepperItem` | A single step; derives its state and exposes it to children |
| `StepperTrigger` | Clickable wrapper that activates its step (focus ring on the indicator) |
| `StepperIndicator` | The circular badge — number by default, check/cross/spinner per state, or custom `children`/`asChild` |
| `StepperSeparator` | Connector line between two steps |
| `StepperContent` | Wraps the title + description with orientation-aware alignment |
| `StepperTitle` | Step title text |
| `StepperDescription` | Secondary step description text |

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "stepper") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
