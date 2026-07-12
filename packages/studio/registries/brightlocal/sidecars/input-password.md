---
name: InputPasswordRoot
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-password"
subcomponents: [InputPasswordField, InputPasswordStrength, InputPasswordToggle]
props:
  - strengthLevels? — TODO(review): type + one-line description from src
  - onStrengthChange? — TODO(review): type + one-line description from src
  - showMeter? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
