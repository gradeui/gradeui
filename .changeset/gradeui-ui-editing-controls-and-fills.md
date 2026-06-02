---
"@gradeui/ui": minor
---

Compact control sizes for dense editing UI, plus fills and an upgraded ThreeScene renderer.

Much of this came out of building the Studio editing surfaces (inspector, side panels), where controls need to sit at a tighter rhythm than page UI.

New components and exports:

- `FillPicker` (with `FillValue` and `FILL_TOKENS`) and `BackgroundFill` (`BackgroundFillProps`, `BackgroundFillType`, `BackgroundFillFit`): a frame's background as a first-class fill (shader / image / gradient / solid) with a Figma-style picker.
- `ShaderControls` (`ShaderControlsProps`): live controls for the shader/post-processing fills.
- `AvatarTone` type export.

Compact sizes across form controls:

- `Button` gains an `xs` size (24px) for tool panels.
- `Input` gains a `size` prop plus `startSlot` / `endSlot` adornments.
- `Select` gains menu density (`size="xs" | "sm"` on `SelectContent`, propagated to every `SelectItem` via context).
- `Textarea` gains a `size` prop mirroring `Input`.
- `Label` gains a `size` prop.
- `Message` gains a `compact` variant for dense side-panel use.

ThreeScene:

- Upgraded render pipeline: post-processing composer, shader presets, fragment scenes, and theme-aware palettes, so backgrounds react to the active Grade theme.
