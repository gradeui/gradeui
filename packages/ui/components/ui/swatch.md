---
name: Swatch
import: "@gradeui/ui"
subcomponents: [SwatchGroup]
sizes: [xs, sm, md, lg, xl]
props:
  - color?: string — any raw CSS colour (`#1f6feb`, `oklch(...)`, `rgb(...)`, or `var(--x)`). Takes precedence over `token`. Use for one-off or external colours.
  - token?: string — a Grade colour token NAME with no `--` and no `oklch()` wrap; resolved internally to `oklch(var(--<token>))`. THE design-system path — e.g. `token="brand-3"`, `token="primary"`, `token="chart-2"`. Re-voices live when the theme changes.
  - size? (xs | sm | md | lg | xl) — t-shirt scale, 20px → 56px; default md (32px). Prefer over h-*/w-* utilities.
  - shape? (square | rounded | circle) — default rounded (rides `--radius`); circle for dot pickers; square for a hard tile.
  - selected?: boolean — draws the shared selection ring (`--selected`). For palette / accent pickers.
  - onSelect?: () => void — makes the swatch a pickable <button> (adds aria-pressed, focus ring, hover lift). Omit for a static display chip.
  - onColorChange?: (value: string) => void — makes the swatch an editable colour well: hosts a native `<input type="color">` (the OS picker) behind the DS chip and fires with the new `#rrggbb`. Presentation stays the chip, interaction stays native. Use for inspector / control-panel colour fields instead of styling a raw colour input. Takes precedence over `onSelect`.
  - label?: ReactNode — caption rendered beneath the chip; also becomes the accessible name + tooltip.
  - SwatchGroup: layout? (row | stack) — `row` (default) spaces chips out; `stack` overlaps them into a coin-stack (the theme-picker / "key colours" treatment, where each chip's ring reads as the separating edge).
  - SwatchGroup: size? / shape? — cascade to every child Swatch so a strip stays consistent without repeating the prop.
  - SwatchGroup: gap? (xs | sm | md | lg) — spacing between chips in `row` layout; default sm.
when_to_use: Showing a colour as a small chip — brand-pop strips, palette / accent pickers, theme previews, token galleries, "pick a colour" rows. Reach for `token` to bind to a live theme variable; `color` for raw values. A transparency checkerboard sits behind the fill so semi-transparent values read honestly.
composes_with: [Row (strip of swatches), Stack, Grid (palette wall), Field (as a colour-picker trailing slot), Card (in a theme-preview), RadioGroup (selectable accent set), Label]
aliases: [colour swatch, color swatch, colour chip, color chip, palette swatch, token swatch, brand pop, accent swatch, colour tile, color tile, paint chip, react native colour swatch]
notes: |
  Anti-patterns to avoid:

  - DO NOT hand-roll a colour chip as a bare `<div className="h-10 w-10 rounded">`
    with an inline `style={{ background: ... }}`. That is exactly what
    <Swatch> is — use it so the chip is selectable in Studio, sizes on
    tokens, and gets the transparency checkerboard + selection ring for free.
  - DO NOT wrap a token in oklch() yourself for the `token` prop —
    pass the bare name. `token="brand-3"`, NOT `token="oklch(var(--brand-3))"`.
    (If you already have a wrapped string, pass it as `color` instead.)
  - DO NOT size with h-*/w-* utilities — use `size` so the scale stays on
    the t-shirt tokens.
  - DO NOT use Swatch for an avatar, status dot, or icon background. It is
    specifically a COLOUR specimen. A status dot is a tiny Badge/indicator;
    a person is an Avatar.
---

```jsx
// Brand-pop strip — eight live theme accents.
<SwatchGroup size="lg">
  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
    <Swatch key={n} token={`brand-${n}`} />
  ))}
</SwatchGroup>
```

```jsx
// Theme-picker "key colours" — overlapping coin-stack of circles.
<SwatchGroup layout="stack" shape="circle" size="md">
  <Swatch token="background" />
  <Swatch token="muted" />
  <Swatch token="primary" />
  <Swatch token="accent" />
</SwatchGroup>
```

```jsx
// Captioned token chips.
<Row gap="md" wrap>
  <Swatch token="primary" label="Primary" />
  <Swatch token="accent" label="Accent" />
  <Swatch token="muted" label="Muted" />
</Row>
```

```jsx
// Pickable accent set — selection ring + button semantics.
<Row gap="sm">
  {["brand-1", "brand-2", "brand-3", "brand-4"].map((t) => (
    <Swatch
      key={t}
      token={t}
      shape="circle"
      selected={t === selectedToken}
      onSelect={() => setSelectedToken(t)}
    />
  ))}
</Row>
```

```jsx
// Raw colour, including a semi-transparent value over the checkerboard.
<Row gap="sm">
  <Swatch color="#1f6feb" />
  <Swatch color="oklch(0.7 0.18 30)" />
  <Swatch color="rgb(16 185 129 / 0.4)" />
</Row>
```
