---
"@gradeui/ui": minor
---

Add `--gds-canvas-fill` — the standard backdrop behind a screen when it doesn't fill its frame.

One token for every "canvas" surface: the letterbox bars in an embed/share, and the stage a `<ScreenAnimator>` reveals when it flies in or pulls below 1× zoom. Deep near-black by default; set it to `transparent` to let the host page show through, or any colour to rebrand it in one place. `ScreenAnimator`'s default `stage` now reads `var(--gds-canvas-fill, …)`, falling back to the previous dark gradient where the token isn't loaded.
