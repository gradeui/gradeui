---
"@gradeui/ui": minor
---

Add colour **scopes**: `scope-*` utility classes (`default` / `inverse` / `brand` / `accent` / `muted` / `card`) that act like a local Figma variable mode, re-pointing the surface token family (`--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--border`) for a subtree while leaving the action colours vivid. `SectionBlock` gains a `scope` prop that applies one, so a section sets a background + foreground colour context as a unit and every descendant re-tones using the ordinary tokens. The generator emits stable `--bg-base` / `--fg-base` mirrors so the `inverse` swap can't form a custom-property cycle.
