---
"@gradeui/ui": patch
---

Callout: size the icon slot to 16px (`[&>svg]:h-4 [&>svg]:w-4`). Bare lucide icons default to 24px, which filled the 28px text inset (`pl-7`) and left the icon flush against the title; sizing the slot restores the intended 12px icon→title gap. Applied to the docs vendored copy in the same pass.
