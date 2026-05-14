---
"@gradeui/ui": minor
---

Foundation pass on Tabs, ToggleGroup, Button + new Breadcrumb primitive.

**Tabs**
- T-shirt sizes (`sm` / `md` / `lg`) via CVA, default `md`. A small
  size context cascades from `TabsList` to every `TabsTrigger` so
  consumers set the size once on the list.
- Explicit per-size heights on the trigger so vertical and horizontal
  whitespace stay symmetric — fixes the "padding feels off" v1
  papercut.
- New `tooltip` prop on `TabsTrigger`. Pass it on an icon-only trigger
  and the component wraps the trigger in the design-system `Tooltip`
  + auto-applies `aria-label` (if not set) so screen readers still
  have an accessible name. Requires a `TooltipProvider` somewhere
  above the tabs.
- `[&_svg]:size-*` baked into each size variant, so icon children
  sit at the right scale without per-call className overrides.

**ToggleGroup**
- Self-contained CVA (`toggleGroupVariants` /
  `toggleGroupItemVariants`) instead of composing `toggleVariants`
  from `Toggle`. The two components have different intents
  (standalone on/off vs in-group picker) and shouldn't share styling.
- Visual parity with `TabsList`/`TabsTrigger` — same pill chrome,
  same active-state lift, same t-shirt scale. A segmented control
  reads identically whether you reached for Tabs or ToggleGroup.
- Size cascades from group to items via context (matches the Tabs
  pattern).

**Button**
- Size scale aligned to Tabs heights exactly: `sm` = h-7, `md` = h-8,
  `lg` = h-10. Type and icon sizes follow the same scale.
- `default` is preserved as an alias for `md` so existing call sites
  keep working through the rename.
- A button placed next to a `TabsList` of the same size now lines up
  edge-to-edge without per-call overrides.

**New `Breadcrumb` primitive**
- Composable, surface-less navigation primitive (Breadcrumb /
  BreadcrumbList / BreadcrumbItem / BreadcrumbLink / BreadcrumbPage /
  BreadcrumbSeparator / BreadcrumbEllipsis).
- Density matches `TabsTrigger`. Theme-token colours throughout.
- `BreadcrumbLink` renders an `<a>` when `href` is set, a `<button>`
  for in-app click handlers, or a `<span>` when `asChild` is used —
  same visual either way.

**BREAKING — `TopMenu` type rename**
- The legacy `BreadcrumbItem` interface exported from `TopMenu` is
  renamed to `TopMenuBreadcrumbItem` so it doesn't collide with the
  new `Breadcrumb` primitive's component exports.
- Consumers importing `BreadcrumbItem` as a type from `@gradeui/ui`
  for the `TopMenu` `breadcrumbs` prop need to update to
  `TopMenuBreadcrumbItem`. The `TopMenu` runtime API is unchanged.

**Theme system**
- `applyThemeToRoot` is now a thin wrapper over the new
  `applyThemeToElement(theme, mode, target)` so themes can be scoped
  to any `HTMLElement` (a div, an iframe's document element). Same
  semantics as before for the existing usage.

**Studio theme**
- New `studioInput` ships as the default chrome theme — off-white
  parchment surface, near-black text and buttons via a small
  per-theme tokenOverrides pass that re-routes the primary token to
  the dark end of the neutral ramp.
- `defaultThemeId` now points at `studio`. Existing user themes
  (calm, energy) remain available in the switcher.
