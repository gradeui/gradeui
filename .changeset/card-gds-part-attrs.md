---
"@gradeui/ui": patch
"@gradeui/docs": patch
---

Stamp `data-gds-part` on every Card subcomponent so LLMs, design tools, and CSS can target the stable internal parts the same way they already target the media/shader primitives.

- `Card` → `data-gds-part="card"`
- `CardHeader` → `data-gds-part="card-header"`
- `CardTitle` → `data-gds-part="card-title"`
- `CardDescription` → `data-gds-part="card-description"`
- `CardContent` → `data-gds-part="card-content"`
- `CardFooter` → `data-gds-part="card-footer"`

Non-breaking: the attributes are added above the existing `{...props}` spread, so consumers can still pass their own `data-gds="..."` (or any other attr) and have it win. This follows the same convention established on `MediaSurface`, `ThreeScene`, `VideoPlayer`, `ShaderPresetPicker`, and `ShaderPresetPreview` — DS owns `data-gds-part`, consumers own `data-gds`.

Applied in both the library source (`packages/ui/components/ui/card.tsx`) and the docs-site copy (`apps/docs/components/ui/card.tsx`) to keep them in sync until the docs app starts importing from the library directly.
