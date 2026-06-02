---
"@gradeui/ui": minor
---

Add `Field` plus the selection-card family (`RadioCard`, `CheckboxCard`, `SwitchCard`), and fix elevation so it works in generated/runtime UI.

`Field` is the inline composition primitive for a control and its caption. It pairs a bare `Checkbox`, `RadioGroupItem`, or `Switch` with `Field.Label`, an optional `Field.Description`, and an optional `Field.Trailing` slot, and wires the `id` plus `aria-describedby` automatically by cloning the control. The primitives stay bare (no new `description` prop). `layout="option"` (default) leads with the control; `layout="setting"` leads with the text and pins the control trailing, for settings rows.

`RadioCard` / `CheckboxCard` / `SwitchCard` make the whole card the control: it renders as the underlying Radix `Item` / `Checkbox.Root` / `Switch.Root`, so focus, hover, and the checked state all live on the card surface and the entire card is the hit target. All three share one token-driven surface (`.gds-selection-card`, themeable via the new `--gds-selection-card-*` variables) so they look identical sitting together; the dot/check/switch glyph differs by type by design. Props: `label`, `description`, `aside` (a trailing slot for a Badge), `hideIndicator`, `indicatorPosition`, plus arbitrary `children` for custom static content. The checked glyph defaults to `--primary` so a control reads the same colour in a card as standalone. RadioCard must sit inside a `RadioGroup`; static content only (no nested interactive controls).

Elevation fix: the Presence elevation system was defined as Tailwind utilities (`shadow-elevation-N`, `shadow-raised`, the single-layer atoms) that only compiled when a scanned source file used the literal class, so typing `shadow-elevation-3` in Studio output or a consumer screen produced no CSS. This adds JIT-proof real classes (`.gds-elevation-0` through `.gds-elevation-5`, `.gds-elevation-hot`, `.gds-elevation-pressed`, and `.gds-shadow-*` atoms) that are always present in the shipped stylesheet, mirroring how `.gds-surface-*` already works, and safelists the Tailwind utility names so the documented API also compiles into every build.
