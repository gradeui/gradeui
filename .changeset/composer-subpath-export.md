---
"@gradeui/ui": major
---

**Breaking:** `Composer` (and `ComposerReply` + its types) now ship on a
dedicated subpath. Import them from `@gradeui/ui/composer` instead of the main
`@gradeui/ui` barrel.

```diff
- import { Composer } from "@gradeui/ui";
+ import { Composer } from "@gradeui/ui/composer";
```

Why: Composer is the only component that depends on `lexical` +
`lexical-beautiful-mentions`, whose published modules use extensionless / CJS
shapes that strict ESM bundlers (Vite 8, plain Node) reject. While Composer was
re-exported from the main barrel, *any* consumer, even one importing only
`<Section>` or `<Button>`, pulled lexical into its module graph and could crash
during resolution. Isolating Composer on its own entry keeps the main barrel
lexical-free; only code that imports `@gradeui/ui/composer` loads lexical.

No other components moved. Theme, tokens, and every non-Composer export are
unchanged.
