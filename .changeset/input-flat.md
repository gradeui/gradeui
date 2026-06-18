---
"@gradeui/ui": patch
---

Input: dropped `shadow-sm` from the default size so a text input sits flat, matching `SelectTrigger` (which carries no drop shadow). Previously a default-size Input read as slightly lifted next to a Select of the same height. The `xs` / `2xs` densities already opted out of the shadow, so only the default size changes.
