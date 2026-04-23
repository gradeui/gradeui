---
name: ShaderPresetPicker
import: "@gradeui/ui"
props:
  - value?: string — currently selected preset id (controlled)
  - onChange?: (id: string) => void — called when the user clicks a preset card
  - filterTags?: string[] — only show presets matching at least one tag ("space" | "retro" | "motion" | "hero" | "background" …)
  - live?: "never" | "hover" | "always" (default "hover") — thumbnail render mode
  - postPreset?: string — shared post-FX preset applied to every thumbnail
  - palette?: Partial<Palette> — shared palette applied to every thumbnail
  - columns?: 2 | 3 | 4 (default 3) — grid columns at md+ breakpoint
when_to_use: Runtime gallery of shader presets — click to select. Use with ThreeScene as a controlled input so the user can pick a background shader. For a single preview card, use ShaderPresetPreview directly.
composes_with: [ShaderPresetPreview (internal), ThreeScene (the typical downstream consumer)]
aliases: [shader picker, preset picker, shader gallery, preset gallery]
notes: Powered by the same preset registry that drives `<ThreeScene preset="…" />` — adding a preset to the registry makes it appear here automatically. At time of writing only "space" is registered, so the picker renders a single card until more presets ship.
---

```jsx
const [preset, setPreset] = useState("space");

<ShaderPresetPicker value={preset} onChange={setPreset} />
<ThreeScene preset={preset} postPreset="vhs" aspect="wide" />

// Filter to a subset
<ShaderPresetPicker filterTags={["hero"]} columns={3} />
```
