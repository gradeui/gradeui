/**
 * Spacing & layout capabilities — which Tailwind families make sense
 * for a given element type.
 *
 * The SpacingGroup in the SelectionInspector used to render every
 * control (padding, margin, gap, grid-cols, radius) for any selection
 * — including text intrinsics like `<h1>`, where padding/gap/grid-cols
 * are noise and radius is unusual. This module is the single source of
 * truth for "what controls actually apply to this element."
 *
 * Resolution order (the first matching bucket wins):
 *
 *   1. App-shell components — full-bleed page chrome; padding + gap
 *      are meaningful, margin would push the chrome around in ways
 *      that almost never make sense, grid-cols + radius don't fit.
 *   2. Grid primitives — every family applies, including grid-cols.
 *   3. Layout primitives (Stack, Row, Flex, Column) — padding /
 *      margin / gap / radius are meaningful; grid-cols isn't.
 *   4. Button-like elements — padding + radius are core, gap matters
 *      for icon+label, margin is useful when the parent isn't doing
 *      its own spacing.
 *   5. Text intrinsics (h1–h6, p, span, label, blockquote, code, em,
 *      strong) — only margin. Text doesn't gap its children (they're
 *      text nodes), doesn't grid, doesn't get internal padding, and
 *      doesn't take radius.
 *   6. Image-like leaves (img, MediaSurface, Avatar) — margin +
 *      radius are the common knobs; padding/gap/grid-cols don't
 *      apply to a leaf media node.
 *   7. Default — show everything. Covers raw `<div>`, unknown DS
 *      components, anything we haven't classified yet. Better to
 *      show a noop control than to silently hide one the user
 *      legitimately needs.
 *
 * The classifier is case-insensitive: it lowercases the input and
 * matches against kebab + PascalCase membership sets simultaneously.
 * `getSpacingCapabilities(undefined)` returns the default (all-true)
 * so callers don't need a null guard.
 */

export interface SpacingCapabilities {
  padding: boolean;
  margin: boolean;
  gap: boolean;
  gridCols: boolean;
  /** Border radius. Lives in the Appearance group, not Layout — kept
   *  here on the same capability object because the rule "which
   *  element types this applies to" runs in the same place. */
  radius: boolean;
  /** Tailwind `opacity-N`. Applies to virtually everything that
   *  renders — defaults to true; only intentionally false for
   *  full-bleed app chrome that shouldn't go translucent. */
  opacity: boolean;
  /** Tailwind `font-{weight}` keyword. Applies to text intrinsics
   *  (h1-h6, p, span, label, …) and button-like elements (whose
   *  label inherits the weight). */
  fontWeight: boolean;
  /** Tailwind `text-{xs..5xl}` size keyword. Same scope as
   *  fontWeight — text intrinsics + button-like. Size is just as
   *  often a per-instance choice as weight (one designer wants a
   *  bigger heading, another wants a smaller one), so we surface
   *  it as an editable knob rather than locking it to the heading
   *  semantic. */
  fontSize: boolean;
}

const ALL_CAPS: SpacingCapabilities = {
  padding: true,
  margin: true,
  gap: true,
  gridCols: true,
  radius: true,
  opacity: true,
  // Default ON for unknown elements (raw divs, future DS components);
  // text-intrinsic profiles keep it true; AppShell chrome turns it
  // off (chrome shouldn't restyle text weight at the wrapper level).
  fontWeight: true,
  fontSize: true,
};

const NO_CAPS: SpacingCapabilities = {
  padding: false,
  margin: false,
  gap: false,
  gridCols: false,
  radius: false,
  opacity: false,
  fontWeight: false,
  fontSize: false,
};

// Text-bearing intrinsics. These elements *contain* text rather than
// laying out children, so the only sensible spacing knob is margin
// (to separate them from sibling content). The user's exact framing:
// "H1 wouldn't generally have padding (they might have margin) and
// also wouldn't have Gap or Grid Columns - Or border radius!"
const TEXT_INTRINSICS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "label",
  "blockquote",
  "code",
  "em",
  "strong",
  "small",
  "kbd",
  "abbr",
  "cite",
  "q",
  "mark",
  "time",
]);

// Button-like — padding + radius are core; gap for icon+label; margin
// is useful when the parent doesn't carry the spacing.
const BUTTON_LIKE = new Set(["button", "Button"]);

// Layout primitives that are NOT grids — flex/stack shapes. grid-cols
// doesn't apply.
const LAYOUT_PRIMITIVES_NO_GRID = new Set([
  "stack",
  "Stack",
  "row",
  "Row",
  "flex",
  "Flex",
  "column",
  "Column",
]);

// Grid primitives — grid-cols is meaningful.
const GRID_PRIMITIVES = new Set(["grid", "Grid"]);

// App-shell chrome — padding + gap, no margin/radius/grid-cols.
const APP_SHELL_PARTS = new Set([
  "appshell",
  "AppShell",
  "appshellmain",
  "AppShellMain",
  "appshellheader",
  "AppShellHeader",
  "appshellfooter",
  "AppShellFooter",
  "appshellsidebar",
  "AppShellSidebar",
]);

// Media leaves — margin + radius; no padding/gap/grid-cols on a leaf
// that wraps a single image/avatar.
const MEDIA_LEAVES = new Set([
  "img",
  "MediaSurface",
  "Avatar",
  "Image",
  "Picture",
]);

/**
 * Resolve the spacing capability profile for a selected element.
 *
 * Accepts either or both of:
 *   - `tag` — the lowercase intrinsic name from `selection.tag`
 *     (e.g. `"h1"`, `"div"`, `"button"`).
 *   - `componentName` — the PascalCase DS name from
 *     `selection.componentName` (e.g. `"Button"`, `"Stack"`,
 *     `"MediaSurface"`).
 *
 * Both are checked; whichever matches first under the resolution
 * order above wins. When neither matches, returns the all-true
 * default so the user never loses a control we forgot to classify.
 */
export function getSpacingCapabilities(args: {
  tag?: string | null;
  componentName?: string | null;
}): SpacingCapabilities {
  const candidates = [args.componentName, args.tag].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  if (candidates.length === 0) return ALL_CAPS;

  // Look up each candidate against each bucket. Order matters — we
  // want the most specific classification to win.
  for (const c of candidates) {
    if (APP_SHELL_PARTS.has(c)) {
      // App-shell chrome shouldn't go translucent — it's the page
      // frame, not a content surface. Opacity off; everything else
      // stays per the original rule.
      return { ...NO_CAPS, padding: true, gap: true };
    }
    if (GRID_PRIMITIVES.has(c)) {
      return ALL_CAPS;
    }
    if (LAYOUT_PRIMITIVES_NO_GRID.has(c)) {
      return { ...ALL_CAPS, gridCols: false };
    }
    if (BUTTON_LIKE.has(c)) {
      return {
        ...NO_CAPS,
        padding: true,
        margin: true,
        gap: true,
        radius: true,
        opacity: true,
        // Button labels can take per-instance weight and size
        // (a "Buy now" CTA might want bolder + bigger than the
        // default). Both cascade to the label.
        fontWeight: true,
        fontSize: true,
      };
    }
    if (TEXT_INTRINSICS.has(c)) {
      // Text gets margin, opacity, font-weight, AND font-size —
      // weight and size are the two big per-instance typography
      // overrides. Padding / gap / grid-cols / radius still don't
      // apply.
      return {
        ...NO_CAPS,
        margin: true,
        opacity: true,
        fontWeight: true,
        fontSize: true,
      };
    }
    if (MEDIA_LEAVES.has(c)) {
      return {
        ...NO_CAPS,
        margin: true,
        radius: true,
        opacity: true,
      };
    }
  }

  // Nothing matched — raw `<div>`, unknown DS component, etc. Default
  // to all-true so the user can still reach every control. Classifying
  // a new element type later means adding it to one of the sets above.
  return ALL_CAPS;
}

/** True when at least one Layout-group capability is enabled. Used
 *  by the inspector to decide whether to render the Layout group's
 *  section header. Layout group covers padding / margin / gap /
 *  grid-cols — Radius + Opacity moved to the Appearance group. */
export function hasAnyLayoutCapability(caps: SpacingCapabilities): boolean {
  return caps.padding || caps.margin || caps.gap || caps.gridCols;
}

/** True when at least one Appearance-group capability is enabled.
 *  Appearance currently covers Border Radius + Opacity + Font
 *  Weight + Font Size. The font-* knobs will likely migrate to a
 *  dedicated Typography group once leading/tracking/etc. land. */
export function hasAnyAppearanceCapability(
  caps: SpacingCapabilities,
): boolean {
  return (
    caps.radius || caps.opacity || caps.fontWeight || caps.fontSize
  );
}

/**
 * @deprecated use hasAnyLayoutCapability / hasAnyAppearanceCapability.
 * Kept temporarily so callers that haven't migrated still compile.
 */
export function hasAnySpacingCapability(caps: SpacingCapabilities): boolean {
  return hasAnyLayoutCapability(caps) || hasAnyAppearanceCapability(caps);
}
