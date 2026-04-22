---
"@gradeui/docs": minor
---

Studio: shader follows theme hue edits, settings panel can dock, new shader starter template.

- **ThreeScene now repaints on every theme edit, not just dark/light toggles.**
  The in-iframe `ThemeOptionsApplier` stamps a theme-vars signature onto
  `document.documentElement.dataset.gdsTheme` whenever anything in the
  generated CSS vars changes. `<ThreeScene>`'s MutationObserver already
  watches that attribute, so sliding the primary hue now flows straight
  into the shader palette without the user having to toggle mode to
  re-trigger resolution. CSS hot-reloads alone don't mutate any
  attribute; the signature is what makes the observer fire.
- **Settings panel can be docked to the right column.** The panel now has
  `variant: "inline" | "docked"` and a `Dock →` affordance in the inline
  header. Clicking it promotes the panel to the right column (replacing
  the theme builder for that design), where controls get the full column
  height without scrolling. An `Undock` button in the docked header
  restores the theme builder. Per-design — switching tabs remembers each
  design's layout choice.
- **New `Shader hero` starter template** in the Studio prompt picker.
  Prefills a `<ThreeScene>` background with a themed palette so the user
  can poke the shader without writing the prompt from scratch.
