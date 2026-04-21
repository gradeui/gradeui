---
name: ShaderPresetPreview
import: ./components/ui/shader-preset-preview
props:
  - preset: string — shader preset id from the registry
  - live?: "never" | "hover" | "always" (default "hover") — when to run the live WebGL render
  - postPreset?: string — override the preset's default post-FX
  - palette?: Partial<Palette> — palette overrides for the preview
  - aspect?: "video" | "square" | "portrait" | "wide" (default "video")
  - hideLabel?: boolean (default false) — hide the label strip under the preview
  - onClick?: () => void
when_to_use: Thumbnail-sized preview card for a shader preset. Defaults to a cheap static placeholder until hovered, at which point the live WebGL render kicks in. Use directly when you want a single preset card; use ShaderPresetPicker for a filterable grid.
composes_with: [ThreeScene (internal), ShaderPresetPicker (wraps this)]
notes: Prefer `live="hover"` in galleries — Safari caps concurrent WebGL contexts at ~8. `live="always"` is fine for one or two cards; past that you'll run out of contexts.
---

```jsx
// Hover-to-live (default)
<ShaderPresetPreview preset="space" />

// Always-live — use sparingly
<ShaderPresetPreview preset="space" live="always" />
```
