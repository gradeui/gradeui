# Tailwind gradient reference (for the Studio gradient picker)

Knowledge the GradientEditor parser/serialiser is built against. The Studio treats gradients as **Tailwind-native presets** — parse Tailwind gradient utility classes into the editor model, and emit them back. Lock the editor to Tailwind's boundaries: **2–3 stops** (`from` / `via` / `to`) with fixed positions unless an explicit stop-position utility is present.

## v2 / v3 syntax (primary target — "preset boundaries")

```
bg-gradient-to-{dir} from-{color} [via-{color}] to-{color}
```

- `{dir}` (direction): `t tr r br b bl l tl` → CSS:
  | util   | CSS direction  | ~angle |
  |--------|----------------|--------|
  | `to-t` | `to top`       | 0deg   |
  | `to-tr`| `to top right` | 45deg  |
  | `to-r` | `to right`     | 90deg  |
  | `to-br`| `to bottom right` | 135deg |
  | `to-b` | `to bottom`    | 180deg |
  | `to-bl`| `to bottom left`  | 225deg |
  | `to-l` | `to left`      | 270deg |
  | `to-tl`| `to top left`  | 315deg |
- `from-{color}` = stop @ 0%, `via-{color}` = stop @ 50% (middle), `to-{color}` = stop @ 100%.
- 2 stops = `from`+`to`; 3 stops = `from`+`via`+`to`. **Max 3** in this preset model.
- `{color}` = a Tailwind palette name (`green-400`, `blue-500`, `purple-400`, `pink-500`, `red-500`, …) OR a Grade theme token (`primary`, `card`, …). Resolve palette names from the Tailwind palette; resolve Grade tokens to `oklch(var(--<token>))`.

Examples (from the user):
```html
bg-gradient-to-r from-green-400 to-blue-500            <!-- 2 stops -->
bg-gradient-to-r from-purple-400 via-pink-500 to-red-500  <!-- 3 stops -->
```
Docs: https://v2.tailwindcss.com/docs/gradient-color-stops

## v4 superset (parse if present; richer authoring later)

Tailwind v4 renamed `bg-gradient-*` → `bg-linear-*` and expanded the API:

- **Linear angle:** `bg-linear-45` (any angle) and `bg-linear-to-{dir}`.
- **Interpolation modifier** (suffix after `/`): `bg-linear-to-r/srgb`, `/oklch`, `/oklab` (v4 default), `/hsl`; polar longer-hue via arbitrary `bg-conic/[in_hsl_longer_hue]`.
- **Radial:** `bg-radial`, positioned `bg-radial-[at_25%_25%]`.
- **Conic:** `bg-conic`, angled `bg-conic-{angle}`.
- **Stop positions:** `from-10%`, `via-30%`, `to-90%`, `to-75%` — when present these OVERRIDE the implicit 0/50/100.

Ref: https://tailwindcss.com/blog/tailwindcss-v4#expanded-gradient-apis

## Editor model ↔ class mapping

GradientEditor `GradientValue` (`{ type, angle?, interpolation?, position?, stops: [{token?|color?, position, opacity}], source? }`):
- `type`: `linear` (v2 `to-{dir}` / v4 `bg-linear-*`), `radial` (`bg-radial`), `conic` (`bg-conic`).
- `angle`: from `{dir}` table or v4 `bg-linear-{n}`.
- `interpolation`: from the `/...` modifier (default `oklab`).
- `stops`: ≤3 in preset mode (from/via/to). Positions default 0/50/100; honour explicit `-N%`.
- `source`: tag parsed presets `"tailwind"` (+ keep the original class string) so the picker can DISPLAY provenance ("Tailwind preset"). User-built/custom = `"custom"`; scope-inherited = `"scoped"` (future).

## Tailwind palette (v2 = rgb hex; v4 = oklch)

Stop colours that are palette names map to fixed values. v2/v3 use the rgb hex palette (e.g. `green-400 #4ade80`, `blue-500 #3b82f6`, `purple-400 #c084fc`, `pink-500 #ec4899`, `red-500 #ef4444`). v4 ships the same scale in `oklch`. Keep a `TAILWIND_PALETTE` map keyed by `<family>-<shade>`; prefer Grade theme tokens where the colour is a DS token.

## Roadmap (not yet built)
- Custom gradients stored in the theme; **scoped** gradients per scoped mini-theme (show "inherited" when not set locally) — same provenance channel as the colour tokens. See [[studio-color-fill-gradient]].
