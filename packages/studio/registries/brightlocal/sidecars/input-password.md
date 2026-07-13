---
name: InputPasswordRoot
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-password"
subcomponents: [InputPasswordField, InputPasswordStrength, InputPasswordToggle]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - disabled?: boolean — Disabled state
  - value?: string — Controlled password value
  - onChange? — Callback fired when password changes
  - onStrengthChange? — Callback fired when password strength changes
  - strengthLevels? — Custom strength levels configuration. Define your own levels with custom keys, labels, values, and colors. @example strengthLevels={{ empty: { label: "Enter password", value: 0, color: "bg-muted" }, slow: { label: "Slow", value: 33, color: "bg-red-500" }, medium: { label: "Medium", value: 66, color: "bg-yellow-500" }, fast: { label: "Fast", value: 100, color: "bg-green-500" }, }}
  - calculateStrength? — Custom function to calculate password strength. Must return a key from strengthLevels (or default levels if not provided).
  - error?: boolean — Whether the input has an error state
  - id?: string — ID for the input element (for label association)
  - children — Children components
  - className?: string — Additional class name for the root container
  - groupClassName?: string — InputPasswordField: Additional class name for the InputGroup wrapper
  - showLabel?: string — InputPasswordField: Accessible label for the toggle button when password is hidden. (default "Show) password"
  - hideLabel?: string — InputPasswordField: Accessible label for the toggle button when password is visible. (default "Hide) password"
aliases: [inputpassword]
---

```jsx
<InputPasswordRoot
  dataHook="password-input"
  onStrengthChange={function z0e(){}}
  trackingEl="input-password"
  trackingLabel="password-field"
>
  <InputPasswordField
    hideLabel="Ocultar contraseña"
    placeholder="Enter your password"
    showLabel="Mostrar contraseña"
  />
  <InputPasswordStrength />
</InputPasswordRoot>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-inputpassword--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
