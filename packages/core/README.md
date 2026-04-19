# @gradeui/core

Foundations for the Grade Design System — design tokens, theme engine primitives, OKLCH utilities, and the `cn` helper.

> **Status:** placeholder. Nothing is exported yet. The eventual content currently lives inside `@gradeui/ui` under `lib/themes/` and `lib/utils.ts`, and will be migrated here once the first consumer (beyond `@gradeui/ui` itself) needs to pull tokens without a React dependency.

## Planned surface

```ts
// tokens — bare CSS var names and their default values
export { tokens, type Token } from "./tokens";

// theme engine — OKLCH generator, apply helpers, built-in themes
export {
  generateTheme,
  applyThemeToRoot,
  builtInThemes,
  /* … */
} from "./themes";

// utilities
export { cn } from "./cn";
```

## License

MIT © Grade
