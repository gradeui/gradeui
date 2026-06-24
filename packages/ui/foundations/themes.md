---
foundation: themes
import: "@gradeui/ui"
apis: [generateTheme, themeToCSSVars, applyThemeToRoot, GradeThemeProvider, useGradeTheme, builtInThemes, GRADE_PRE_HYDRATION_SCRIPT]
attribute: data-grade-theme
---

# Themes

A Grade theme is a **deterministic `ThemeInput`** — a small, portable description
that the generator expands into the full CSS-variable token set. The same input
always produces the same tokens, so a theme is shareable and reproducible.

## The ThemeInput shape (what you set)

- **hues** — OKLCH hue anchors for the `neutral`, `primary`, and `accent` ramp families.
- **chroma / vibrancy** — colour intensity, backed by the real OKLCH `C` (not a multiplier).
- **intensity** — overall vibrancy of the expressive/accent layer.
- **typography** — font roles (`display` / `body` / `mono` / `accent`) + a modular `scale`.
  See the typography foundation.
- **spacing / density** — base spacing rhythm. See the spacing & layout foundation.

Everything is optional and sparse: an empty `ThemeInput` generates the default
Grade theme. Each ramp family expands to a 50–950 OKLCH ramp (`--ramp-*`), and the
semantic surface/action tokens reference those ramps.

## Applying a theme

```tsx
import { GradeThemeProvider } from "@gradeui/ui";
import "@gradeui/ui/styles.css";

export default function App({ children }) {
  return <GradeThemeProvider>{children}</GradeThemeProvider>;
}
```

- `GradeThemeProvider` / `useGradeTheme` — React provider + hook for the active theme + mode.
- `generateTheme(input)` → tokens; `themeToCSSVars(theme)` / `applyThemeToRoot(theme)` to
  apply them outside React.
- `builtInThemes` — the shipped starter themes.
- `GRADE_PRE_HYDRATION_SCRIPT` — inline in `<head>` to set `data-grade-theme` before paint
  (no flash of the wrong theme).

## Rules

- **Token-bound, never raw.** Generated UI references tokens (`bg-background`,
  `text-foreground`, `text-primary`, the `--gds-*` / `--ramp-*` vars), never literal hex.
  A value that can't be reached through a token can't be re-themed — so don't emit it.
- **Minimum extra tokens, maximum impact.** A handful of named roles re-skin every
  surface. Don't add a token per component per state; assign a role and let surfaces wear it.
- **Determinism is load-bearing.** The theme must stay a pure function of its input.
