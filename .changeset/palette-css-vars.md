---
"@gradeui/ui": patch
---

`ThreeScene` palette now accepts any CSS-legal colour expression.

Previously the palette only worked with hex / `rgb()` / named colours (what `THREE.Color.setStyle()` happens to parse). Raw values like `oklch(0.74 0.18 350)` or `var(--primary)` silently fell through to black.

Palette values are now normalised via a DOM probe + `getComputedStyle`, so every slot accepts:
- CSS custom properties — `"var(--primary)"`
- `oklch()`, `lab()`, `lch()`, `oklab()` — full CSS Color 4
- `hsl()`, `rgb()`, hex, named colours (still work)

**Automatic theme re-tinting.** A `MutationObserver` on the document root watches for `class`, `data-theme`, `data-gds-theme`, and `data-grade-mode` changes. When the active theme flips, the scene re-resolves palette values and pushes new uniforms into the running shader — no WebGL remount.

Recommended pattern for DS consumers:

```jsx
<ThreeScene
  preset="plasma"
  palette={{
    primary: "var(--primary)",
    secondary: "var(--secondary)",
    accent: "var(--accent)",
    background: "var(--background)",
  }}
/>
```
