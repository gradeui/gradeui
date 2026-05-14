/**
 * Layout-primitive component names — the kebab-case set of @gradeui/ui
 * components whose primary job is structural arrangement (gap / cols /
 * justify / align) rather than content.
 *
 * Used by the Studio right-panel stage router to elevate layout-relevant
 * props to the top of the settings panel (Stage D), and by the
 * empty-design heuristic to know which primitives count as "structure has
 * already been laid down" when deciding whether to surface Stage A
 * starters.
 *
 * Keep this list short on purpose — only components that exist to compose
 * other components. A `Card` arranges content too, but it's a content
 * primitive (has its own visual surface), so it does NOT belong here.
 *
 * The values are the kebab-case `data-gds-part` form. Convert with
 * `kebabToPascal` from `lib/component-refs.ts` when matching against a
 * selection's `componentName`.
 */
export const LAYOUT_PRIMITIVE_KEBABS = [
  "stack",
  "row",
  "grid",
  "flex",
  "app-shell",
] as const;

export type LayoutPrimitiveKebab = (typeof LAYOUT_PRIMITIVE_KEBABS)[number];

/** PascalCase variant of the same set, for matching against a selection's
 *  `componentName` (which the agent already converts via `kebabToPascal`). */
export const LAYOUT_PRIMITIVE_NAMES = [
  "Stack",
  "Row",
  "Grid",
  "Flex",
  "AppShell",
] as const;

export type LayoutPrimitiveName = (typeof LAYOUT_PRIMITIVE_NAMES)[number];

/** Cheap membership test for a PascalCase componentName off a selection. */
export function isLayoutPrimitiveName(name: string | null | undefined): boolean {
  if (!name) return false;
  return (LAYOUT_PRIMITIVE_NAMES as readonly string[]).includes(name);
}
