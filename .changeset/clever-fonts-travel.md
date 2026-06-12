---
"@gradeui/ui": minor
---

Custom uploaded fonts in themes. `ThemeInput.typography` now accepts
`custom:<family>` selections backed by a `customFonts: CustomFontFace[]`
list the theme carries with it — family name, permanent public URL,
format/weight/style descriptors. The generator resolves the selections to
concrete font-family stacks and passes the faces through as
`GeneratedTypography.fontFaces`; new `fontFaceCSS()` / `injectFontFaces()`
helpers (exported from the themes barrel) materialise the `@font-face`
rules wherever the theme is applied, and `applyThemeToRoot` injects them
automatically. Registry-only themes are unaffected.

Variable-font width support: `CustomFontFace.stretch` (default "50% 200%")
keeps the wdth axis reachable, and `typography.bodyStretch` /
`displayStretch` set a theme-wide font-stretch consumed by globals.css on
`body` and `h1–h4` via `--font-body-stretch` / `--font-display-stretch` —
per-element `font-stretch-[…]` utilities still override.
