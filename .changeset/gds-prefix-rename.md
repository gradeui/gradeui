---
"@gradeui/ui": major
"@gradeui/core": major
---

**BREAKING: runtime token namespace renamed from `rds-*` / `ramp-*` to `gds-*` / `grade-*`**

The last of the legacy `ramp-ds`-era token names are gone. Every runtime surface that touches the brand prefix has been renamed in one sweep:

| Old | New | Where it lives |
| --- | --- | --- |
| `--rds-*` | `--gds-*` | CSS custom properties (every theme token, every component token — ~720 references) |
| `.rds-*` | `.gds-*` | CSS class names (`gds-app-shell`, `gds-card`, `gds-button`, `gds-aura-*`, `gds-surface-*`, `gds-flex`/`grid`/`row`/`stack`, the `gds.*` Tailwind color namespace, etc.) |
| `data-ramp-theme` | `data-grade-theme` | HTML attribute on `<html>` set by `GRADE_PRE_HYDRATION_SCRIPT` |
| `'ramp-mode'` | `'grade-mode'` | localStorage |
| `'ramp-theme'` | `'grade-theme'` | localStorage |
| `'ramp-user-themes'` | `'grade-user-themes'` | localStorage |
| `'rds-playgrounds'` | `'gds-playgrounds'` | localStorage |
| `'rds-template-saves'` | `'gds-template-saves'` | localStorage |
| `'rds-chat-settings'` | `'gds-chat-settings'` | localStorage |

### What stays

- `--ramp-*` CSS custom properties — these are the per-step OKLCH color-ramp values (`--ramp-50` … `--ramp-950`) and refer to *color ramps* as a technical concept, not the Ramp brand. Untouched, as in the previous Ramp→Grade pass.
- The React API (`GradeThemeProvider`, `useGradeTheme`, `GRADE_PRE_HYDRATION_SCRIPT`) — already on the new names from the prior rebrand.

### Migration

Anyone consuming `@gradeui/ui` from npm needs to:

1. **CSS overrides** — find/replace `--rds-` → `--gds-` and bare `.rds-` → `.gds-` in any stylesheet that targets Grade tokens or classes.
2. **Tailwind config** — if you extended Grade's colour palette, update references to the `rds` namespace (`text-rds-gray-500` → `text-gds-gray-500`, etc.).
3. **HTML attribute targeting** — replace `[data-ramp-theme="…"]` selectors with `[data-grade-theme="…"]`.
4. **localStorage** — no migration shim ships with this release. The library had no external installs prior to this change, so anyone on a dev branch will get a one-time loss of their saved theme / playground / template-saves selection on next load.

### Why now

The rename was on the books from the original Ramp→Grade rebrand. It was deferred to avoid wiping persisted user state for any in-flight consumer. With no public installs yet, "now" was the cheapest moment to take it.

The rename script (`scripts/rename-rds-to-gds.py`) is checked in. It walks the monorepo, runs a longest-first replacement list, and protects technical substrings (`--ramp-*`, `@rds-energy`, `rds-energy-zap` URL slug). Re-runnable and idempotent.
