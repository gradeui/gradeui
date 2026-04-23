---
"@gradeui/ui": patch
---

Export `Avatar`, `AvatarImage`, `AvatarFallback` from the package barrel.
The component has shipped since v0.3 but was never re-exported from
`lib/index.ts`, so `import { Avatar } from "@gradeui/ui"` resolved to
`undefined` and Sandpack crashed with "Element type is invalid".
Visible in Studio as four of the five reference-layout scaffolds
(saas-user-editor, music-app, tv-streaming, data-table-filters) failing
to render; ecommerce-listing was the only one that didn't use Avatar.
