/**
 * Surface — what a container is *made of*.
 *
 * Shared across every component that surfaces content (Card, Dialog,
 * Sheet, Popover, DropdownMenu, HoverCard, SectionBlock). Picking the
 * material is a first-class prop axis on each of those components,
 * orthogonal to elevation (how high) and aura (what it radiates) — see
 * gradeui/PRESENCE.md for the three-axis model.
 *
 * Putting this on the prop API instead of leaving it as a className
 * escape-hatch buys three things:
 *
 *   1. Studio's inspector surfaces a `surface` knob on every container
 *      so users can flip the material without touching code.
 *   2. The model has a first-class vocabulary to pick from — without
 *      this it reaches for `bg-card/40 backdrop-blur-md` Tailwind soup
 *      and loses the edge highlight + theme-aware blur tuning.
 *   3. Themes can retune `--surface-blur-*` / `--surface-alpha-*`
 *      centrally and every container moves with them.
 *
 * The CSS classes referenced here live in packages/ui/styles/globals.css
 * (and the apps/docs mirror) under the SURFACE CLASSES section.
 */

export type Surface = "solid" | "translucent" | "glass" | "glass-strong";

/**
 * Maps a Surface variant to the `gds-surface-*` class. `solid` returns
 * an empty string because the base `bg-card` (or component default)
 * covers it — surface-bearing components should also drop their default
 * opaque background when `surface !== "solid"` so the alpha actually
 * shows through. See cardSurfaceBg() below for the shared helper.
 */
export const SURFACE_CLASS: Record<Surface, string> = {
  solid: "",
  translucent: "gds-surface-translucent",
  glass: "gds-surface-glass",
  "glass-strong": "gds-surface-glass-strong",
};

/**
 * Components that have an opaque default background (Card's `bg-card`,
 * Popover's `bg-popover`, etc.) call this with the surface choice and
 * the component's default class. It drops the default when surface is
 * anything other than `solid` so the translucent/glass layers aren't
 * hidden behind a fully-opaque fill.
 *
 * @param surface  active surface choice
 * @param defaultBgClass e.g. "bg-card" or "bg-popover"
 */
export function surfaceBg(surface: Surface, defaultBgClass: string): string {
  return surface === "solid" ? defaultBgClass : "";
}
