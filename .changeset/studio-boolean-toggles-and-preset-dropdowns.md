---
"@gradeui/docs": patch
---

Studio: settings-panel Switches now take effect on default-true props, and ThreeScene's `preset` / `postPreset` render as dropdowns.

- **Boolean toggles write `{false}` explicitly instead of omitting the
  prop.** The previous mutator treated `false` as "omit the attr", which
  is correct for props whose library default is `false` (e.g. `controls`)
  but a silent no-op for props that default to `true`
  (`autoPlay`, `pauseOffscreen`, VideoPlayer's `controls`). Turning the
  Switch OFF on a default-true prop now emits `autoPlay={false}` and the
  preview reflects the change. `null` (sent by the reset button) still
  omits the attr, so users can clear intentionally.
- **`preset` and `postPreset` are now proper enums in
  `three-scene.md`.** They were declared as `string` with the valid
  values smuggled into the descriptor comment, so the manifest parser
  emitted `kind: "string"` and the panel rendered a freeform text input.
  Moved the pipe-union into the type position — the parser now sees an
  enum and renders a Select, so users can pick `space` / `plasma` /
  `voronoi` / `synthwave` (and their post passes) from a dropdown.
