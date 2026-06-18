---
"@gradeui/ui": patch
---

Select: the trigger's focus ring now matches Input (`focus-visible:ring-1 ring-ring`, no offset) instead of the heavier `focus:ring-2 ring-offset-2`, so a Select and an Input side by side highlight identically. `SelectContent` also gains an optional `container` prop that forwards to the Radix portal, letting the menu render inside a scoped-theme wrapper (e.g. a preview island) rather than always portaling to `document.body`.
