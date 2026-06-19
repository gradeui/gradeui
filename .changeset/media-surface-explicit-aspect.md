---
"@gradeui/ui": patch
---

MediaSurface: an explicit `aspect` prop now wins over a baked-in `className` aspect. Previously the aspect class was emitted before `className`, so a slot authored as `<MediaSurface className="aspect-video" />` ignored a later `aspect="square"` (e.g. set from the inspector) — it did nothing. An explicit `aspect` now applies via inline `aspect-ratio`, which beats the class; a derived (hint-default) aspect still rides the class so a deliberate `className="aspect-[2/1]"` can override it.
