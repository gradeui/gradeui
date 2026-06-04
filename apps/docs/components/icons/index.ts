/**
 * Custom Grade design-system icons, built with lucide-react's own
 * factory so they carry the exact same props API and defaults as any
 * lucide icon (`size`, `color`, `strokeWidth`, `absoluteStrokeWidth`,
 * `className`).
 *
 * The glyphs mirror the master components in the Figma library
 * ("Grade Design System" → Lucide Icons page, the custom families on
 * Claude Canvas). The visual language:
 *
 *   - SOLID  = the thing itself (a container wall, an element)
 *   - DASHED = space / context (margin outside, a containing block)
 *   - DOTS   = partial presence (opacity) or the canvas grid
 *
 * Sizing note: the Figma masters ship 24/16/12 variants with stroke
 * weights 2 / 1.5 / 1.25. lucide scales strokes proportionally by
 * default, which at 16px gives 1.33 — close enough for UI chrome. For
 * the exact Figma weights pass `strokeWidth` explicitly, e.g.
 * `<PaddingTop size={16} strokeWidth={1.5} absoluteStrokeWidth />`.
 */

export {
  Padding,
  PaddingTop,
  PaddingBottom,
  PaddingLeft,
  PaddingRight,
  PaddingVertical,
  PaddingHorizontal,
} from "./padding";
export {
  Margin,
  MarginTop,
  MarginBottom,
  MarginLeft,
  MarginRight,
  MarginVertical,
  MarginHorizontal,
} from "./margin";
export {
  BorderStrokeTop,
  BorderStrokeBottom,
  BorderStrokeLeft,
  BorderStrokeRight,
  BorderRadius,
  BorderRadiusTopLeft,
  BorderRadiusTopRight,
  BorderRadiusBottomLeft,
  BorderRadiusBottomRight,
} from "./border";
export { Opacity } from "./opacity";
export { BlendMode } from "./blend-mode";
export { Gap, GapColumn, GapRow } from "./gap";
export { PositionAbsolute } from "./position-absolute";
