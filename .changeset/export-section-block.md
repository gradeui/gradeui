---
"@gradeui/ui": patch
---

Export `SectionBlock` (and `sectionBlockVariants` / `SectionBlockProps`) from the package barrel. The component shipped in 4.0.0 but was never re-exported from `lib/index.ts`, so `import { SectionBlock } from "@gradeui/ui"` resolved to `undefined` for consumers.
