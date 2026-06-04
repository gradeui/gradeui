---
"@gradeui/ui": minor
---

Component + stylesheet improvements from the Studio editing push:

- **BackgroundFill**: `type="gradient"` now supports radial gradients —
  `gradient={{ shape: "radial", at: "top", size: "45rem 50rem", from, via?, to }}`
  (linear stays the default). The token-true replacement for arbitrary
  `bg-[radial-gradient(…)]` classes, which don't compile in Studio's preview.
- **Logo**: `sources` is now optional — a bare `<Logo />` renders the neutral
  placeholder instead of crashing (`resolveArtwork` read from `undefined`).
- **ThreeScene**: WebGL no longer remounts when the `palette` prop changes
  identity but not value (inline `palette={{…}}` objects re-created every
  parent render were tearing down and re-initialising the renderer — visible
  flash every state tick on shader-heavy pages). The build effect is keyed on
  the palette's serialized value; `onShaderError` rides a ref.
- **AIChat**: reasoning ("thinking") parts render as markdown and stream live
  (`thinkingStreaming` auto-expands the disclosure); `title={null}` drops the
  header row; auto-scroll follows streamed content growth, not just new
  messages.
- **Stylesheet safelist**: gradient-text recipe (`bg-clip-text`,
  `text-transparent`, `bg-gradient-to-*`, `from/via/to-*` semantic stops with
  opacity ladder), display sizes (`text-6xl`–`9xl`), responsive `sm:/md:/lg:`
  variants for the typography families (size, weight, `leading-*`,
  `tracking-*`, alignment) — all previously silently absent from the compiled
  CSS when emitted at runtime.
- **MediaSurface / BackgroundFill sidecars**: imagery + gradient guidance for
  the Studio model (placeholders over invented URLs, fills over arbitrary
  classes).
