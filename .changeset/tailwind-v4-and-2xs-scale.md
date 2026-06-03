---
"@gradeui/ui": major
---

Tailwind v4 migration + the canonical control size scale.

**Breaking — Tailwind v4.** The package now builds its stylesheet with Tailwind v4 (`@import "tailwindcss"` + `@config`; CLI moved to `@tailwindcss/cli`). `dist/styles.css` is v4-generated. The legacy `safelist` moved to `@source inline(...)` in `styles/globals.css`; `darkMode` is the string `"class"` form. Consumers extending `tailwind-preset.ts` must be on Tailwind v4.

**Breaking — size scale.** Component `size` variants now map name→text consistently (`2xs→text-2xs`, `xs→text-xs`, `sm→text-sm`, `md→text-base`, `lg→text-lg`) across input, textarea, select, label, toggle, button, avatar. A new `2xs` tier (h-6 / 24px, `text-2xs` = 11px token) lands across the form-control family, plus sized `Switch` variants (`default`/`sm`/`xs`/`2xs`) and a `2xs` avatar. `sm` controls render 14px text (was 12px); `md`/`default` buttons render `text-base` (was `text-xs`). Arbitrary `text-[11px]`-style values are gone from the library.

**Added.** `SelectItem` gains a `hint` prop — right-aligned secondary text in the menu row that does not mirror into the trigger (used for token→resolved-value readouts).
