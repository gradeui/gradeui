---
name: Link
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/link"
variants: [inline, filled, outline, ghost]
props:
  - variant? — TODO(review): type + one-line description from src
  - external? — TODO(review): type + one-line description from src
  - showExternalIcon? — TODO(review): type + one-line description from src
  - asChild? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Inline text links within paragraphs or sentences (inline variant) Navigation to internal or external URLs Button-styled navigation or inline actions that need a button appearance (filled, outline, ghost variants) Links inside i18n <Trans> blocks — use Link as a component in the components map Do NOT use for: actions that don't navigate (submit, delete, toggle) — use Button. Use Button for actions (submit, delete, open). Use a button-styled Link (variant filled/outline/ghost) for navigation that needs a button appearance.
composes_with: [Button]
---

```jsx
<Link href="/about" dataHook="about-link">
  Learn more
</Link>

<Link href="/upgrade" variant="filled" dataHook="upgrade-link">
  Upgrade plan
</Link>
```
```jsx
import { Link } from "@brightlocal/ui-components/link";
import { Link as RouterLink } from "@tanstack/react-router";

<Link asChild variant="outline" dataHook="nav-link">
  <RouterLink to="/dashboard">Dashboard</RouterLink>
</Link>
```
```jsx
import NextLink from "next/link";

<Link asChild external dataHook="docs-link">
  <NextLink href="https://docs.example.com">Documentation</NextLink>
</Link>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-link--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
