/**
 * Tiny Tailwind className parser + writer for the Studio selection
 * inspector.
 *
 * Why: the inspector edits component props by manifest, but a huge
 * chunk of layout intent lives in className — `<CardContent
 * className="p-3">` exposes padding through Tailwind, and the
 * inspector currently has no way to surface that. We start with
 * padding because the user reached for it first; everything else
 * (margin, gap, rounded, text size, colours) is a thin extension
 * once this shape is proven.
 *
 * Mental model:
 *   - className is a whitespace-separated bag of Tailwind tokens.
 *   - For each family (padding / margin / gap / …) we know a regex
 *     pattern that identifies a member of that family.
 *   - `parseX(className)` walks the bag and returns the structured
 *     value of the LAST match (Tailwind shadows-later-wins).
 *   - `setX(className, value)` removes every token in that family
 *     and appends the new one (or nothing, if value === null).
 *
 * Non-goals (v1):
 *   - Directional padding (`pt-`, `pr-`, `px-`, etc.). Top-of-list
 *     follow-up — same pattern, more tokens.
 *   - Arbitrary values like `p-[12px]`. Tailwind supports them;
 *     we treat them as opaque "custom" and don't try to round-trip.
 *   - Theme variants (`md:p-4`, `hover:p-2`). Responsive layout
 *     editing is its own conversation; the inspector targets the
 *     base style only.
 */

/** Numeric Tailwind scales we surface in the inspector. Subset of
 *  the full scale — picked for the values designers reach for most
 *  often. The control also offers `null` (none / unset) as a strip. */
// Half-steps included — Tailwind's fine grain (p-0.5 = 2px, p-1.5 = 6px)
// matters for closest-match suggestions and for round-tripping the
// per-side inputs' snap (which already lands on halves).
export const PADDING_SCALE = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16,
] as const;
export const MARGIN_SCALE = PADDING_SCALE;
export const GAP_SCALE = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12,
] as const;
export const GRID_COLS_SCALE = [1, 2, 3, 4, 5, 6, 8, 12] as const;

/** Tailwind's opacity scale runs 0..100. We expose the design-tool
 *  staples — multiples of 5 for the low end, 10 for the rest — so
 *  the dropdown isn't 21 items long. Arbitrary values (`opacity-[0.42]`)
 *  still survive in the className override. */
export const OPACITY_SCALE = [
  0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;

/** Tailwind's radius scale is keyword-based, not numeric. The empty
 *  string maps to the bare `rounded` token (Tailwind's default
 *  radius). */
export const RADIUS_SCALE = [
  "none",
  "sm",
  "",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "full",
] as const;
export type RadiusValue = (typeof RADIUS_SCALE)[number];

// ─── Padding ─────────────────────────────────────────────────────────
//
// The parser + setter recognise every directional variant in the
// padding family — all-sides (`p-N`), single-side (`pt`/`pr`/`pb`/`pl`),
// and axis (`px`/`py`). The parser returns the LAST matched numeric
// value, regardless of which variant produced it; the setter strips
// every variant before writing the new all-sides token.
//
// Why "any variant counts": a designer who's already laid down `pt-4`
// and looks at the all-sides Padding dropdown expects to see "4" (not
// "None"). Treating per-side tokens as invisible would force them to
// use the className-override input as the ONLY way to fix per-side
// padding, which defeats the whole point of the structured row.
//
// Why "the setter strips every variant": the structured control is
// authoritative — picking "8" should produce a clean `p-8` className,
// not `pt-4 p-8` with a Tailwind conflict the user can't see. The
// className-override input below remains the escape hatch for
// genuinely per-side intent.
//
// Responsive (`md:p-4`) and state (`hover:p-2`) variants are still
// INVISIBLE to this scan — the regex anchors at `^|\s` and never
// looks past a `:` prefix, so breakpoint overrides survive an
// all-sides edit without being touched.

// `^|\s` left-anchor prevents matching `bp-4` or similar substrings.
// `(?:[trblxy])?` captures the optional directional suffix without
// requiring it, so the same pattern matches `p-N`, `pt-N`, `px-N`.
// Lookahead `(?=\s|$)` keeps the match terminating at a word
// boundary so we don't bite into a longer Tailwind token.
const PADDING_VARIANT_RE =
  /(^|\s)p([trblxy])?-(\d+(?:\.\d+)?)(?=\s|$)/g;
const PADDING_STRIP_RE =
  /(^|\s)p([trblxy])?-\d+(?:\.\d+)?(?=\s|$)/g;

/**
 * Return the padding value parsed from `className`, or `null` when no
 * `p-N` / `p[trblxy]-N` token is present. The LAST match wins —
 * matches Tailwind's "shadows-later" semantics for class-order
 * conflicts.
 *
 * Responsive variants like `md:p-4` are INVISIBLE to this scan
 * (anchored at `^|\s`), so editing the base value preserves any
 * breakpoint overrides silently. The override Input is the escape
 * hatch for editing those today.
 */
export function parsePadding(className: string | null | undefined): number | null {
  return parseNumericLastGroup(className, PADDING_VARIANT_RE, 3);
}

/**
 * Replace (or remove) every padding token in `className` and return
 * the new string. Pass `null` to strip padding entirely. Other
 * tokens are preserved verbatim, in their original order. The setter
 * strips per-side variants too — the structured control writes an
 * all-sides `p-N` token and owns the family.
 *
 * Idempotent — re-running with the same value is a no-op (modulo
 * possible whitespace normalisation, which we keep minimal).
 */
export function setPadding(
  className: string | null | undefined,
  value: number | null
): string {
  return setNumeric(className, PADDING_STRIP_RE, "p", value);
}

// ─── Margin ──────────────────────────────────────────────────────────
//
// Same per-side handling as padding. See the Padding block above for
// the rationale on why the parser sees per-side variants and the
// setter strips them. `mb-6` on an `<h1>` should populate the
// all-sides Margin dropdown with `6`, and picking `8` rewrites
// cleanly to `m-8` (no leftover `mb-6` conflicting with `m-8`).

const MARGIN_VARIANT_RE =
  /(^|\s)m([trblxy])?-(\d+(?:\.\d+)?)(?=\s|$)/g;
const MARGIN_STRIP_RE =
  /(^|\s)m([trblxy])?-\d+(?:\.\d+)?(?=\s|$)/g;

export function parseMargin(className: string | null | undefined): number | null {
  return parseNumericLastGroup(className, MARGIN_VARIANT_RE, 3);
}

export function setMargin(
  className: string | null | undefined,
  value: number | null
): string {
  return setNumeric(className, MARGIN_STRIP_RE, "m", value);
}

// ─── Per-side margin + padding ──────────────────────────────────────
//
// Designers don't write `m-N` and call it a day — they reach for
// `mb-6` to push a heading down without touching the other three
// sides. The single all-sides dropdown can't represent that intent,
// so we layer a per-side parser + setter on top of the all-sides one.
//
// Side model: each of `{ t, r, b, l }` is `number | null`. `null`
// means "no token sets this side" — the all-sides dropdown shows
// "None" when every side is null; the per-side grid shows blank
// inputs for the null sides. Independent: setting one side doesn't
// touch the others (unless chain-mode is on at the UI layer).
//
// Read precedence (Tailwind shadows-later semantics): every token in
// the family is walked in source order; later tokens override
// earlier ones on the sides they cover. `m-4 mb-6` → { t:4, r:4, b:6, l:4 }.
// `m-4 mx-2` → { t:4, r:2, b:4, l:2 }.
//
// Write: serialiseSides folds the four-side state into the minimal
// token set:
//   - all four equal → one all-sides token (`m-4`)
//   - top===bottom AND/OR left===right → axis tokens (`my-4`, `mx-2`)
//   - otherwise → per-side tokens (`mt-2 mr-4 mb-6 ml-4`)
// Mixed-with-nulls works too (a single non-null side serialises to
// one per-side token, e.g. `mb-6`). The setter strips every token in
// the family before writing — same authoritative-control model as
// the all-sides setter.

export interface SideValues {
  t: number | null;
  r: number | null;
  b: number | null;
  l: number | null;
}

const EMPTY_SIDES: SideValues = { t: null, r: null, b: null, l: null };

// Pattern with named-ish capture: group 2 = suffix (undefined for
// all-sides, one of trblxy otherwise), group 3 = numeric value.
function makeSidesScanRe(family: "m" | "p"): RegExp {
  return new RegExp(
    `(^|\\s)${family}([trblxy])?-(\\d+(?:\\.\\d+)?)(?=\\s|$)`,
    "g",
  );
}

function scanSides(
  className: string | null | undefined,
  family: "m" | "p",
): SideValues {
  if (!className) return { ...EMPTY_SIDES };
  const re = makeSidesScanRe(family);
  const out: SideValues = { ...EMPTY_SIDES };
  let match: RegExpExecArray | null;
  while ((match = re.exec(className)) !== null) {
    const suffix = match[2]; // undefined | "t" | "r" | "b" | "l" | "x" | "y"
    const num = Number(match[3]);
    if (!Number.isFinite(num)) continue;
    // Spread the token's value across the sides it covers. Later
    // tokens overwrite earlier ones — shadows-later semantics.
    switch (suffix) {
      case undefined:
        out.t = num;
        out.r = num;
        out.b = num;
        out.l = num;
        break;
      case "x":
        out.l = num;
        out.r = num;
        break;
      case "y":
        out.t = num;
        out.b = num;
        break;
      case "t":
        out.t = num;
        break;
      case "r":
        out.r = num;
        break;
      case "b":
        out.b = num;
        break;
      case "l":
        out.l = num;
        break;
    }
  }
  return out;
}

function serialiseSides(sides: SideValues, family: "m" | "p"): string[] {
  const { t, r, b, l } = sides;
  // All four null → no tokens (stripped state).
  if (t === null && r === null && b === null && l === null) return [];
  // All four equal → one all-sides token.
  if (t !== null && t === r && r === b && b === l) {
    return [`${family}-${t}`];
  }
  // Try to fold into axis pairs first, then emit any remaining
  // sides in clockwise CSS-shorthand order (top, right, bottom,
  // left). The clockwise order matches how `margin: 1px 2px 3px 4px`
  // is read; per-side Tailwind tokens follow the same convention.
  const verticalPaired = t !== null && b !== null && t === b;
  const horizontalPaired = l !== null && r !== null && l === r;
  const tokens: string[] = [];

  if (verticalPaired && horizontalPaired) {
    // `my-Y mx-X` — both axes paired but different values.
    tokens.push(`${family}y-${t}`);
    tokens.push(`${family}x-${l}`);
    return tokens;
  }
  if (verticalPaired) {
    // Vertical folds; horizontal sides emitted individually after.
    tokens.push(`${family}y-${t}`);
    if (r !== null) tokens.push(`${family}r-${r}`);
    if (l !== null) tokens.push(`${family}l-${l}`);
    return tokens;
  }
  if (horizontalPaired) {
    // Horizontal folds; vertical sides emitted in clockwise order.
    if (t !== null) tokens.push(`${family}t-${t}`);
    if (b !== null) tokens.push(`${family}b-${b}`);
    tokens.push(`${family}x-${l}`);
    return tokens;
  }
  // Pure per-side — clockwise order T R B L (matches CSS shorthand).
  if (t !== null) tokens.push(`${family}t-${t}`);
  if (r !== null) tokens.push(`${family}r-${r}`);
  if (b !== null) tokens.push(`${family}b-${b}`);
  if (l !== null) tokens.push(`${family}l-${l}`);
  return tokens;
}

function stripFamily(
  className: string | null | undefined,
  family: "m" | "p",
): string {
  // Same shape as PADDING_STRIP_RE / MARGIN_STRIP_RE.
  const re = new RegExp(
    `(^|\\s)${family}([trblxy])?-\\d+(?:\\.\\d+)?(?=\\s|$)`,
    "g",
  );
  return (className ?? "")
    .replace(re, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse per-side margin from a className. Each side is `null` when
 *  no token covers it; otherwise the latest token wins. */
export function parseMarginSides(
  className: string | null | undefined,
): SideValues {
  return scanSides(className, "m");
}

/** Write per-side margin to a className. Strips every margin token
 *  in the family, then appends the minimal token set that represents
 *  `sides`. Pass all-null to clear margin entirely. */
export function setMarginSides(
  className: string | null | undefined,
  sides: SideValues,
): string {
  const stripped = stripFamily(className, "m");
  const tokens = serialiseSides(sides, "m");
  if (tokens.length === 0) return stripped;
  return stripped ? `${stripped} ${tokens.join(" ")}` : tokens.join(" ");
}

/** Parse per-side padding from a className. Mirror of parseMarginSides. */
export function parsePaddingSides(
  className: string | null | undefined,
): SideValues {
  return scanSides(className, "p");
}

/** Write per-side padding to a className. Mirror of setMarginSides. */
export function setPaddingSides(
  className: string | null | undefined,
  sides: SideValues,
): string {
  const stripped = stripFamily(className, "p");
  const tokens = serialiseSides(sides, "p");
  if (tokens.length === 0) return stripped;
  return stripped ? `${stripped} ${tokens.join(" ")}` : tokens.join(" ");
}

/** True when at least one side is non-null. Used by the UI to
 *  short-circuit "all sides None" → "no padding/margin set". */
export function hasAnySide(sides: SideValues): boolean {
  return sides.t !== null || sides.r !== null || sides.b !== null || sides.l !== null;
}

/** True when all four non-null sides hold the same value. The
 *  per-side inspector uses this to decide whether the chain toggle
 *  should default to "linked" — if the user lands on a component
 *  that's already uniform, we open the input in linked mode so
 *  editing one updates all four. */
export function sidesAreUniform(sides: SideValues): boolean {
  const { t, r, b, l } = sides;
  if (t === null || r === null || b === null || l === null) return false;
  return t === r && r === b && b === l;
}

// ─── Gap ─────────────────────────────────────────────────────────────

const GAP_RE = /(^|\s)gap-(\d+(?:\.\d+)?)(?=\s|$)/g;

export function parseGap(className: string | null | undefined): number | null {
  return parseNumeric(className, GAP_RE);
}

export function setGap(
  className: string | null | undefined,
  value: number | null
): string {
  return setNumeric(className, /(^|\s)gap-\d+(?:\.\d+)?(?=\s|$)/g, "gap", value);
}

// ─── Grid columns ────────────────────────────────────────────────────

const GRID_COLS_RE = /(^|\s)grid-cols-(\d+)(?=\s|$)/g;

export function parseGridCols(
  className: string | null | undefined
): number | null {
  return parseNumeric(className, GRID_COLS_RE);
}

export function setGridCols(
  className: string | null | undefined,
  value: number | null
): string {
  return setNumeric(
    className,
    /(^|\s)grid-cols-\d+(?=\s|$)/g,
    "grid-cols",
    value
  );
}

// ─── Border radius ───────────────────────────────────────────────────
// Tailwind radius is keyword-based, not numeric. Tokens we care
// about: `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`,
// `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`,
// `rounded-full`. The empty-suffix `rounded` token is the default
// radius — we serialise it back as `rounded` (no suffix) when the
// user picks the empty value.

const RADIUS_RE = /(^|\s)rounded(?:-(none|sm|md|lg|xl|2xl|3xl|full))?(?=\s|$)/g;

export function parseRadius(
  className: string | null | undefined
): RadiusValue | null {
  if (!className) return null;
  let last: RadiusValue | null = null;
  RADIUS_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RADIUS_RE.exec(className)) !== null) {
    // Group 1 is the (^|\s) anchor; group 2 is the radius suffix
    // (undefined for the bare `rounded` token → coerce to "").
    last = ((match[2] ?? "") as RadiusValue) ?? null;
  }
  return last;
}

export function setRadius(
  className: string | null | undefined,
  value: RadiusValue | null
): string {
  const stripped = (className ?? "")
    .replace(/(^|\s)rounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = value === "" ? "rounded" : `rounded-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Per-corner radius ───────────────────────────────────────────────
//
// Same family as Border Radius, but corner-aware: `rounded-tl-lg`,
// `rounded-tr`, … plus the edge shorthands (`rounded-t-*` = top two
// corners) and the bare all-corners token. Mirrors the per-side padding
// model: each of { tl, tr, br, bl } is a RadiusValue or null (no token).

export interface CornerValues {
  tl: RadiusValue | null;
  tr: RadiusValue | null;
  br: RadiusValue | null;
  bl: RadiusValue | null;
}

const EMPTY_CORNERS: CornerValues = { tl: null, tr: null, br: null, bl: null };

// Corner group ordered longest-first so `tl` wins over `t`.
const RADIUS_CORNER_SCAN_RE =
  /(^|\s)rounded(?:-(tl|tr|br|bl|t|r|b|l))?(?:-(none|sm|md|lg|xl|2xl|3xl|full))?(?=\s|$)/g;
const RADIUS_CORNER_STRIP_RE =
  /(^|\s)rounded(?:-(?:tl|tr|br|bl|t|r|b|l))?(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?(?=\s|$)/g;

/** Parse per-corner radius. Edge tokens (`rounded-t-*`) spread across
 *  the two corners they cover; the bare token covers all four. Later
 *  tokens win (Tailwind shadows-later). */
export function parseRadiusCorners(
  className: string | null | undefined,
): CornerValues {
  if (!className) return { ...EMPTY_CORNERS };
  const out: CornerValues = { ...EMPTY_CORNERS };
  RADIUS_CORNER_SCAN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RADIUS_CORNER_SCAN_RE.exec(className)) !== null) {
    const corner = m[2];
    const val = (m[3] ?? "") as RadiusValue;
    switch (corner) {
      case undefined:
        out.tl = out.tr = out.br = out.bl = val;
        break;
      case "t":
        out.tl = val;
        out.tr = val;
        break;
      case "r":
        out.tr = val;
        out.br = val;
        break;
      case "b":
        out.br = val;
        out.bl = val;
        break;
      case "l":
        out.tl = val;
        out.bl = val;
        break;
      case "tl":
        out.tl = val;
        break;
      case "tr":
        out.tr = val;
        break;
      case "br":
        out.br = val;
        break;
      case "bl":
        out.bl = val;
        break;
    }
  }
  return out;
}

/** Write per-corner radius. Strips every rounded token, then emits a
 *  single all-corners token when uniform, else per-corner tokens. */
export function setRadiusCorners(
  className: string | null | undefined,
  corners: CornerValues,
): string {
  const stripped = (className ?? "")
    .replace(RADIUS_CORNER_STRIP_RE, " ")
    // Picking tokens clears any custom (arbitrary) radius — the two
    // modes are mutually exclusive.
    .replace(/(^|\s)rounded-\[[^\]]+\](?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const { tl, tr, br, bl } = corners;
  const tok = (corner: string, v: RadiusValue) =>
    corner
      ? v === ""
        ? `rounded-${corner}`
        : `rounded-${corner}-${v}`
      : v === ""
        ? "rounded"
        : `rounded-${v}`;
  if (tl === null && tr === null && br === null && bl === null) return stripped;
  const tokens: string[] = [];
  if (tl !== null && tl === tr && tr === br && br === bl) {
    tokens.push(tok("", tl));
  } else {
    if (tl !== null) tokens.push(tok("tl", tl));
    if (tr !== null) tokens.push(tok("tr", tr));
    if (br !== null) tokens.push(tok("br", br));
    if (bl !== null) tokens.push(tok("bl", bl));
  }
  if (tokens.length === 0) return stripped;
  return stripped ? `${stripped} ${tokens.join(" ")}` : tokens.join(" ");
}

export function hasAnyCorner(c: CornerValues): boolean {
  return c.tl !== null || c.tr !== null || c.br !== null || c.bl !== null;
}

export function cornersUniform(c: CornerValues): boolean {
  const { tl, tr, br, bl } = c;
  if (tl === null || tr === null || br === null || bl === null) return false;
  return tl === tr && tr === br && br === bl;
}

// ─── Custom (raw) radius — the detached escape hatch ─────────────────
//
// Bound mode writes the keyword scale (`rounded-md`, per-corner tokens);
// detaching writes a single arbitrary `rounded-[Npx]` (all corners).
// Each setter strips the other family so a node is never on both.

const RADIUS_CUSTOM_RE = /(^|\s)rounded-\[(\d+(?:\.\d+)?)px\](?=\s|$)/g;

/** Parse a custom `rounded-[Npx]` arbitrary class → px, or null. */
export function parseRadiusCustom(
  className: string | null | undefined,
): number | null {
  if (!className) return null;
  let last: number | null = null;
  RADIUS_CUSTOM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RADIUS_CUSTOM_RE.exec(className)) !== null) {
    const n = Number(m[2]);
    if (Number.isFinite(n)) last = n;
  }
  return last;
}

/** Write (or clear, with null) a custom px radius. Strips BOTH keyword
 *  (incl. per-corner) and arbitrary radius tokens first — the modes are
 *  mutually exclusive. */
export function setRadiusCustom(
  className: string | null | undefined,
  px: number | null,
): string {
  const stripped = (className ?? "")
    .replace(RADIUS_CORNER_STRIP_RE, " ")
    .replace(RADIUS_CUSTOM_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (px === null) return stripped;
  const token = `rounded-[${px}px]`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Font size ───────────────────────────────────────────────────────
//
// Tailwind sizes are keyword tokens (`text-xs`, `text-sm`, `text-base`,
// `text-lg`, `text-xl`, `text-2xl`, …). The regex matches an exact
// allow-list of size suffixes only — `text-*` is a busy prefix in
// Tailwind (covers colour, alignment, wrap, balance), and a permissive
// match would false-bait on `text-foreground`, `text-primary`,
// `text-balance`, `text-left`, etc.
//
// 6xl–9xl are valid Tailwind sizes but rarely useful in product UI;
// keep them out of the v1 scale to keep the dropdown scannable. Add
// them later if real designs reach for them.

export const FONT_SIZE_SCALE = [
  "2xs",
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
] as const;
export type FontSizeValue = (typeof FONT_SIZE_SCALE)[number];

const FONT_SIZE_RE =
  /(^|\s)text-(2xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)(?=\s|$)/g;

export function parseFontSize(
  className: string | null | undefined,
): FontSizeValue | null {
  if (!className) return null;
  let last: FontSizeValue | null = null;
  FONT_SIZE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FONT_SIZE_RE.exec(className)) !== null) {
    last = match[2] as FontSizeValue;
  }
  return last;
}

export function setFontSize(
  className: string | null | undefined,
  value: FontSizeValue | null,
): string {
  const stripped = (className ?? "")
    .replace(
      /(^|\s)text-(?:2xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)(?=\s|$)/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = `text-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Font weight ─────────────────────────────────────────────────────
//
// Tailwind weights are keyword tokens (`font-thin`, `font-light`,
// `font-normal`, …, `font-black`). We expose the full ladder because
// designers reach for all of them — picking weight is the most
// common per-instance typography tweak (one designer wants a heavier
// h1 for hero, another wants a lighter one for a list page). Size
// and color stay theme/semantic-driven for now (a v1 line we may
// revisit when the typography group expands).
//
// Like Radius, the parser returns the LAST matched token (Tailwind
// shadows-later semantics), and the setter strips every variant in
// the family before writing — keeps the structured control
// authoritative.

export const FONT_WEIGHT_SCALE = [
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
] as const;
export type FontWeightValue = (typeof FONT_WEIGHT_SCALE)[number];

// Exact-match list inside the regex so we don't false-bait on
// `font-mono` / `font-sans` / `font-serif` (those are font-family
// tokens, not weight tokens).
const FONT_WEIGHT_RE =
  /(^|\s)font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?=\s|$)/g;

export function parseFontWeight(
  className: string | null | undefined,
): FontWeightValue | null {
  if (!className) return null;
  let last: FontWeightValue | null = null;
  FONT_WEIGHT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FONT_WEIGHT_RE.exec(className)) !== null) {
    last = match[2] as FontWeightValue;
  }
  return last;
}

export function setFontWeight(
  className: string | null | undefined,
  value: FontWeightValue | null,
): string {
  const stripped = (className ?? "")
    .replace(
      /(^|\s)font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?=\s|$)/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = `font-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Line height ─────────────────────────────────────────────────────
//
// Keyword ladder only (`leading-none` … `leading-loose`) — the values
// designers actually reach for. Numeric (`leading-7`) and arbitrary
// (`leading-[1.15]`) variants are recognised by the SETTER's strip
// pass (so picking a keyword always wins) but not surfaced as tokens.

export const LINE_HEIGHT_SCALE = [
  "none",
  "tight",
  "snug",
  "normal",
  "relaxed",
  "loose",
] as const;
export type LineHeightValue = (typeof LINE_HEIGHT_SCALE)[number];

/** Unitless multiplier each keyword resolves to — dropdown hints. */
export const LINE_HEIGHT_HINT: Record<LineHeightValue, string> = {
  none: "1",
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
};

const LINE_HEIGHT_RE =
  /(^|\s)leading-(none|tight|snug|normal|relaxed|loose)(?=\s|$)/g;

export function parseLineHeight(
  className: string | null | undefined,
): LineHeightValue | null {
  if (!className) return null;
  let last: LineHeightValue | null = null;
  LINE_HEIGHT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LINE_HEIGHT_RE.exec(className)) !== null) {
    last = match[2] as LineHeightValue;
  }
  return last;
}

export function setLineHeight(
  className: string | null | undefined,
  value: LineHeightValue | null,
): string {
  const stripped = (className ?? "")
    .replace(
      // Strip the WHOLE family — keywords, numerics, arbitrary — so
      // the structured control is authoritative.
      /(^|\s)leading-(?:none|tight|snug|normal|relaxed|loose|\d+(?:\.\d+)?|\[[^\]]+\])(?=\s|$)/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = `leading-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Letter spacing ──────────────────────────────────────────────────
//
// Tailwind's tracking ladder. Same last-match / strip-family contract
// as the rest of the typography tokens.

export const TRACKING_SCALE = [
  "tighter",
  "tight",
  "normal",
  "wide",
  "wider",
  "widest",
] as const;
export type TrackingValue = (typeof TRACKING_SCALE)[number];

/** Em value each keyword resolves to — dropdown hints. */
export const TRACKING_HINT: Record<TrackingValue, string> = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
};

const TRACKING_RE =
  /(^|\s)tracking-(tighter|tight|normal|wide|wider|widest)(?=\s|$)/g;

export function parseTracking(
  className: string | null | undefined,
): TrackingValue | null {
  if (!className) return null;
  let last: TrackingValue | null = null;
  TRACKING_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TRACKING_RE.exec(className)) !== null) {
    last = match[2] as TrackingValue;
  }
  return last;
}

export function setTracking(
  className: string | null | undefined,
  value: TrackingValue | null,
): string {
  const stripped = (className ?? "")
    .replace(
      /(^|\s)tracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])(?=\s|$)/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = `tracking-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Text align ──────────────────────────────────────────────────────
//
// `text-*` is the busiest prefix in Tailwind (size, colour, wrap,
// balance, alignment all share it) — exact-list matching only, same
// defensive posture as FONT_SIZE_RE. We expose the four staples;
// `text-start` / `text-end` are recognised by the setter's strip so a
// picked value always wins over model-emitted logical alignment.

export const TEXT_ALIGN_SCALE = [
  "left",
  "center",
  "right",
  "justify",
] as const;
export type TextAlignValue = (typeof TEXT_ALIGN_SCALE)[number];

const TEXT_ALIGN_RE = /(^|\s)text-(left|center|right|justify)(?=\s|$)/g;

export function parseTextAlign(
  className: string | null | undefined,
): TextAlignValue | null {
  if (!className) return null;
  let last: TextAlignValue | null = null;
  TEXT_ALIGN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TEXT_ALIGN_RE.exec(className)) !== null) {
    last = match[2] as TextAlignValue;
  }
  return last;
}

export function setTextAlign(
  className: string | null | undefined,
  value: TextAlignValue | null,
): string {
  const stripped = (className ?? "")
    .replace(
      /(^|\s)text-(?:left|center|right|justify|start|end)(?=\s|$)/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = `text-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Responsive (breakpoint) overrides ───────────────────────────────
//
// Generated heroes lean hard on `text-5xl md:text-8xl`-style ladders.
// The base parsers above deliberately ignore prefixed classes, which
// made the inspector silently lie: the field showed `text-5xl`, the
// desktop preview rendered `md:text-8xl`, and edits "did nothing".
// These helpers give the inspector breakpoint awareness: parse the
// overrides for a badge, and read/write a single breakpoint's token
// for the per-breakpoint editor popover.
//
// `bodyPattern` is the family's class body (see FAMILY_BODY) — the
// same exact-list discipline as the base parsers, shared so the badge
// and the editor can't drift.

export const RESPONSIVE_BREAKPOINTS = ["sm", "md", "lg", "xl", "2xl"] as const;
export type ResponsiveBp = (typeof RESPONSIVE_BREAKPOINTS)[number];
/** Breakpoints the inspector's editor popover offers. Kept to the
 *  three staples — every minted class must be safelisted in
 *  globals.css, and sm/md/lg cover real design work. xl/2xl overrides
 *  the model emits still surface in the badge (read-only). */
export const EDITABLE_BREAKPOINTS = ["sm", "md", "lg"] as const;

export interface BreakpointOverride {
  bp: ResponsiveBp;
  /** The full prefixed class, e.g. "md:text-8xl". */
  cls: string;
}

/** Family class-body patterns (no prefix, no capture groups). Font
 *  size includes the display sizes (6xl–9xl) — the badge must SEE
 *  them even though the base editing scale stops at 5xl. */
export const FAMILY_BODY = {
  fontSize:
    "text-(?:2xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)",
  fontWeight:
    "font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)",
  lineHeight: "leading-(?:none|tight|snug|normal|relaxed|loose|\\d+(?:\\.\\d+)?)",
  tracking: "tracking-(?:tighter|tight|normal|wide|wider|widest)",
  textAlign: "text-(?:left|center|right|justify|start|end)",
} as const;
export type FamilyBodyKey = keyof typeof FAMILY_BODY;

/** Every breakpoint override of a family present on the className,
 *  in source order. */
export function parseBreakpointOverrides(
  className: string | null | undefined,
  bodyPattern: string,
): BreakpointOverride[] {
  if (!className) return [];
  const re = new RegExp(
    `(^|\\s)(sm|md|lg|xl|2xl):(${bodyPattern})(?=\\s|$)`,
    "g",
  );
  const out: BreakpointOverride[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(className)) !== null) {
    out.push({
      bp: match[2] as ResponsiveBp,
      cls: `${match[2]}:${match[3]}`,
    });
  }
  return out;
}

/** The UNPREFIXED class a specific breakpoint binds for a family
 *  ("text-8xl" for `md:` when md:text-8xl is present), or null. Last
 *  match wins, mirroring the base parsers. */
export function parseBreakpointToken(
  className: string | null | undefined,
  bp: ResponsiveBp,
  bodyPattern: string,
): string | null {
  if (!className) return null;
  const re = new RegExp(`(^|\\s)${bp}:(${bodyPattern})(?=\\s|$)`, "g");
  let last: string | null = null;
  let match: RegExpExecArray | null;
  while ((match = re.exec(className)) !== null) {
    last = match[2];
  }
  return last;
}

/** Write (or clear, with null) one breakpoint's token for a family.
 *  Strips every existing `bp:` class in the family first, so the
 *  structured control stays authoritative. `tokenClass` is the
 *  UNPREFIXED class ("text-8xl"). */
export function setBreakpointToken(
  className: string | null | undefined,
  bp: ResponsiveBp,
  bodyPattern: string,
  tokenClass: string | null,
): string {
  const re = new RegExp(`(^|\\s)${bp}:(?:${bodyPattern})(?=\\s|$)`, "g");
  const stripped = (className ?? "")
    .replace(re, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (tokenClass === null) return stripped;
  const cls = `${bp}:${tokenClass}`;
  return stripped ? `${stripped} ${cls}` : cls;
}

// ─── Opacity ─────────────────────────────────────────────────────────
//
// Tailwind exposes `opacity-N` where N ∈ 0..100. We expose the staples
// (multiples of 10 + a couple of low-end samples) so the dropdown
// stays scannable. Arbitrary values like `opacity-[0.42]` live in the
// className override; the parser ignores them.

const OPACITY_RE = /(^|\s)opacity-(\d+)(?=\s|$)/g;

export function parseOpacity(
  className: string | null | undefined,
): number | null {
  return parseNumeric(className, OPACITY_RE);
}

export function setOpacity(
  className: string | null | undefined,
  value: number | null,
): string {
  return setNumeric(
    className,
    /(^|\s)opacity-\d+(?=\s|$)/g,
    "opacity",
    value,
  );
}

// ─── Border ──────────────────────────────────────────────────────────
//
// A "border" in a vector tool like Figma / Paper carries a *position*
// (inside / center / outside) that CSS borders don't have — a CSS
// border is always drawn on the box edge. We model the three positions
// by mapping each to the closest real Tailwind behaviour:
//
//   - center  → a genuine CSS border (`border`, `border-2`, …). Drawn
//               on the box edge; the honest analogue of "centre".
//   - outside → a Tailwind ring (`ring-2 …`). Rings are box-shadows
//               painted OUTSIDE the element, no layout shift.
//   - inside  → an inset ring (`ring-2 ring-inset …`). Same box-shadow
//               mechanism, painted INSIDE the edge.
//
// Style (solid / dashed / dotted / double) only applies to the `center`
// position — rings are always solid, so the UI hides the style control
// for inside / outside. Colour is a theme token suffix shared by both
// `border-{color}` and `ring-{color}`.
//
// Width 0 (or null) means "no border" — the setter strips the whole
// family and emits nothing.

export const BORDER_WIDTH_SCALE = [0, 1, 2, 4, 8] as const;

export type BorderPosition = "inside" | "center" | "outside";
export const BORDER_POSITIONS = ["inside", "center", "outside"] as const;

// Which edge(s) the border applies to. `all` = every side; t/r/b/l =
// a single edge (`border-t`, …). Per-side borders are a CSS-border
// (centre) concept — rings can't be per-side, so a non-`all` side
// always serialises as a centre border regardless of position.
export type BorderSide = "all" | "t" | "r" | "b" | "l";
export const BORDER_SIDES = ["all", "t", "r", "b", "l"] as const;
export const BORDER_SIDE_LABELS: Record<BorderSide, string> = {
  all: "All",
  t: "Top",
  r: "Right",
  b: "Bottom",
  l: "Left",
};

export const BORDER_STYLE_SCALE = [
  "solid",
  "dashed",
  "dotted",
  "double",
] as const;
export type BorderStyle = (typeof BORDER_STYLE_SCALE)[number];

// Theme colour suffixes that resolve as both `border-*` and `ring-*`
// utilities in the Grade Tailwind config. Kept short + semantic so the
// swatch row stays scannable.
export const BORDER_COLOR_TOKENS = [
  "border",
  "foreground",
  "primary",
  "muted-foreground",
  "destructive",
  "ring",
] as const;
export type BorderColorToken = (typeof BORDER_COLOR_TOKENS)[number];

export interface BorderValue {
  /** null = no border set. 0 is treated the same (stripped). */
  width: number | null;
  /** Which edge(s) the border is on. */
  side: BorderSide;
  position: BorderPosition;
  style: BorderStyle;
  /** null = no explicit colour token (inherits theme default). */
  color: BorderColorToken | null;
}

export const EMPTY_BORDER: BorderValue = {
  width: null,
  side: "all",
  position: "center",
  style: "solid",
  color: null,
};

// Width tokens — side-aware. Group 2 = optional side (t/r/b/l/x/y),
// group 3 = optional numeric width (0/2/4/8). A bare `border` (no side,
// no width) is 1px on every edge; `border-t` is 1px top; `border-t-2`
// is 2px top. The exact numeric alternation keeps `border-primary`
// (colour) and `border-dashed` (style) out of the width scan.
const BORDER_WIDTH_RE =
  /(^|\s)border(?:-(t|r|b|l|x|y))?(?:-(0|2|4|8))?(?=\s|$)/g;
const BORDER_STYLE_RE = /(^|\s)border-(solid|dashed|dotted|double)(?=\s|$)/g;
const RING_WIDTH_RE = /(^|\s)ring(?:-(0|1|2|4|8))?(?=\s|$)/g;
const RING_INSET_RE = /(^|\s)ring-inset(?=\s|$)/;
// Colour suffixes — side-aware too (`border-t-primary`). Exact
// alternation so widths/styles never get mistaken for a colour.
const COLOR_ALT = BORDER_COLOR_TOKENS.join("|");
const BORDER_COLOR_RE = new RegExp(
  `(^|\\s)border(?:-(t|r|b|l|x|y))?-(${COLOR_ALT})(?=\\s|$)`,
  "g",
);
const RING_COLOR_RE = new RegExp(`(^|\\s)ring-(${COLOR_ALT})(?=\\s|$)`, "g");

function lastMatch(re: RegExp, s: string, group: number): string | null {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  let last: string | null = null;
  while ((m = re.exec(s)) !== null) last = m[group] ?? "";
  return last;
}

// Last CSS-border width token → { side, width }, or null if none.
// x/y (axis) tokens aren't representable as a single side in this
// model, so they collapse to `all`.
function lastBorderWidth(
  className: string,
): { side: BorderSide; width: number } | null {
  BORDER_WIDTH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let last: { side: BorderSide; width: number } | null = null;
  while ((m = BORDER_WIDTH_RE.exec(className)) !== null) {
    const sideRaw = m[2];
    const wRaw = m[3];
    const width = wRaw === undefined ? 1 : Number(wRaw);
    if (!Number.isFinite(width)) continue;
    const side: BorderSide =
      sideRaw === "t" || sideRaw === "r" || sideRaw === "b" || sideRaw === "l"
        ? sideRaw
        : "all";
    last = { side, width };
  }
  return last;
}

/**
 * Parse the border family out of a className. Ring tokens win the
 * position read (they're the explicit position-bearing utilities); a
 * bare/side `border` with no ring resolves to the `center` position.
 * Returns `EMPTY_BORDER` (width null) when neither family is present.
 */
export function parseBorder(
  className: string | null | undefined,
): BorderValue {
  if (!className) return { ...EMPTY_BORDER };

  const hasInset = RING_INSET_RE.test(className);
  const ringWidthRaw = lastMatch(RING_WIDTH_RE, className, 2);
  const ringPresent = ringWidthRaw !== null;

  if (ringPresent) {
    // Bare `ring` = 3px → not on our scale; surface as 2 so the input
    // shows a sensible value. Our own setter never writes bare ring.
    const width = ringWidthRaw === "" ? 2 : Number(ringWidthRaw);
    return {
      width: Number.isFinite(width) ? width : null,
      side: "all",
      position: hasInset ? "inside" : "outside",
      style: "solid",
      color: (lastMatch(RING_COLOR_RE, className, 2) as BorderColorToken) ?? null,
    };
  }

  const bw = lastBorderWidth(className);
  if (bw) {
    const style =
      (lastMatch(BORDER_STYLE_RE, className, 2) as BorderStyle) ?? "solid";
    // Colour is at capture group 3 (group 2 is the optional side).
    return {
      width: bw.width,
      side: bw.side,
      position: "center",
      style,
      color: (lastMatch(BORDER_COLOR_RE, className, 3) as BorderColorToken) ?? null,
    };
  }

  return { ...EMPTY_BORDER };
}

function stripBorder(className: string | null | undefined): string {
  return (className ?? "")
    .replace(RING_INSET_RE, " ")
    .replace(RING_COLOR_RE, " ")
    .replace(RING_WIDTH_RE, " ")
    .replace(BORDER_COLOR_RE, " ")
    .replace(BORDER_STYLE_RE, " ")
    .replace(BORDER_WIDTH_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Write the border family to a className. Strips every border/ring
 * token first, then emits the minimal token set for `value`. Width
 * null or 0 clears the border entirely. A non-`all` side always
 * serialises as a CSS border (rings can't be per-edge).
 */
export function setBorder(
  className: string | null | undefined,
  value: BorderValue,
): string {
  const stripped = stripBorder(className);
  const tokens: string[] = [];
  const w = value.width;
  if (w !== null && w > 0) {
    const perSide = value.side !== "all";
    const usesRing = value.position !== "center" && !perSide;
    if (usesRing) {
      // ring / ring-1 / … (width 1 keeps an explicit ring-1 — bare
      // `ring` is 3px, which isn't what the user picked).
      tokens.push(`ring-${w}`);
      if (value.position === "inside") tokens.push("ring-inset");
      // Rings need an explicit colour to render predictably (the
      // default --tw-ring-color is a blue). Fall back to the theme
      // border token when the user hasn't chosen one.
      tokens.push(`ring-${value.color ?? "border"}`);
    } else {
      // CSS border, optionally on a single edge. `sidePart` is "" for
      // all-sides, "-t"/"-r"/… for a single edge.
      const sidePart = perSide ? `-${value.side}` : "";
      tokens.push(w === 1 ? `border${sidePart}` : `border${sidePart}-${w}`);
      // border-style is global in Tailwind (no per-edge utility) but
      // only paints the edges that have a width, so it reads correctly
      // for per-side borders too.
      if (value.style !== "solid") tokens.push(`border-${value.style}`);
      if (value.color) tokens.push(`border${sidePart}-${value.color}`);
    }
  }
  if (tokens.length === 0) return stripped;
  return stripped ? `${stripped} ${tokens.join(" ")}` : tokens.join(" ");
}

/** True when a border is actually set (non-zero width). */
export function hasBorder(value: BorderValue): boolean {
  return value.width !== null && value.width > 0;
}

// ─── Border (multi-entry / stack) ────────────────────────────────────
//
// Paper/Figma let you stack several borders, each targeting an edge.
// CSS can't paint two borders on the same edge, but it CAN carry one
// border per edge — so we model a "stack" as a list of per-edge
// entries (All / Top / Right / Bottom / Left). Each entry serialises to
// its per-side tokens (`border-t-2 border-t-primary`). border-style is
// global in Tailwind (no per-edge utility), so it's a single section-
// level value, not per entry.
//
// Border width here is literal px (Tailwind border widths ARE pixels:
// `border-2` = 2px), unlike the spacing scale.

export interface BorderEntry {
  side: BorderSide;
  /** px (1 / 2 / 4 / 8). */
  width: number;
  color: BorderColorToken | null;
}

const BORDER_SIDE_ORDER: BorderSide[] = ["all", "t", "r", "b", "l"];

function sideOf(raw: string | undefined): BorderSide {
  return raw === "t" || raw === "r" || raw === "b" || raw === "l"
    ? raw
    : "all";
}

/** Section-level stroke style parsed from the className. */
export function parseBorderStyle(
  className: string | null | undefined,
): BorderStyle {
  return (
    (lastMatch(BORDER_STYLE_RE, className ?? "", 2) as BorderStyle) ?? "solid"
  );
}

/**
 * Parse every per-edge CSS border into an ordered list of entries
 * (All first, then T R B L). Ring tokens are ignored by the stack model
 * — the stack is CSS-border only. Returns [] when no border is set.
 */
export function parseBorderList(
  className: string | null | undefined,
): BorderEntry[] {
  if (!className) return [];
  const widthBySide = new Map<BorderSide, number>();
  BORDER_WIDTH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BORDER_WIDTH_RE.exec(className)) !== null) {
    const width = m[3] === undefined ? 1 : Number(m[3]);
    if (!Number.isFinite(width)) continue;
    widthBySide.set(sideOf(m[2]), width);
  }
  const colorBySide = new Map<BorderSide, BorderColorToken>();
  BORDER_COLOR_RE.lastIndex = 0;
  while ((m = BORDER_COLOR_RE.exec(className)) !== null) {
    colorBySide.set(sideOf(m[2]), m[3] as BorderColorToken);
  }
  const entries: BorderEntry[] = [];
  for (const side of BORDER_SIDE_ORDER) {
    if (!widthBySide.has(side)) continue;
    entries.push({
      side,
      width: widthBySide.get(side)!,
      color:
        colorBySide.get(side) ??
        (side !== "all" ? colorBySide.get("all") ?? null : null),
    });
  }
  return entries;
}

/**
 * Serialise a border stack back into a className. Strips all existing
 * border/ring tokens, then emits per-entry width + colour and a single
 * global stroke style (Tailwind has no per-edge style utility).
 */
export function serializeBorderList(
  className: string | null | undefined,
  entries: BorderEntry[],
  style: BorderStyle,
): string {
  const stripped = stripBorder(className);
  const tokens: string[] = [];
  for (const e of entries) {
    if (!(e.width > 0)) continue;
    const sidePart = e.side === "all" ? "" : `-${e.side}`;
    tokens.push(e.width === 1 ? `border${sidePart}` : `border${sidePart}-${e.width}`);
    if (e.color) tokens.push(`border${sidePart}-${e.color}`);
  }
  if (tokens.length > 0 && style !== "solid") tokens.push(`border-${style}`);
  if (tokens.length === 0) return stripped;
  return stripped ? `${stripped} ${tokens.join(" ")}` : tokens.join(" ");
}

// ─── Blending (opacity + mix-blend-mode) ─────────────────────────────
//
// `mix-blend-*` utilities map straight to CSS mix-blend-mode. A curated
// subset of the most-reached-for modes keeps the dropdown scannable;
// `normal` is the implicit default (no token).

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
] as const;
export type BlendMode = (typeof BLEND_MODES)[number];

const BLEND_RE =
  /(^|\s)mix-blend-(normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|difference|exclusion|hue|saturation|color|luminosity)(?=\s|$)/g;

export function parseBlend(
  className: string | null | undefined,
): BlendMode {
  return (lastMatch(BLEND_RE, className ?? "", 2) as BlendMode) ?? "normal";
}

export function setBlend(
  className: string | null | undefined,
  value: BlendMode,
): string {
  const stripped = (className ?? "")
    .replace(BLEND_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value === "normal") return stripped;
  const token = `mix-blend-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Shadow ──────────────────────────────────────────────────────────
//
// Tailwind's elevation scale (`shadow-sm` … `shadow-2xl`, plus
// `shadow-inner` and the bare `shadow` default). These are entirely
// THEME-DEFINED — the actual box-shadow values live in the Tailwind
// `boxShadow` theme (and, in Grade, behind `--gds-*` shadow tokens),
// so picking "md" here writes a token the theme owns and can restyle
// globally. No raw px shadow ever lands in the JSX. The empty string
// maps to the bare `shadow` token (Tailwind's default elevation).

export const SHADOW_SCALE = [
  "none",
  "sm",
  "",
  "md",
  "lg",
  "xl",
  "2xl",
  "inner",
] as const;
export type ShadowValue = (typeof SHADOW_SCALE)[number];

const SHADOW_RE =
  /(^|\s)shadow(?:-(none|sm|md|lg|xl|2xl|inner))?(?=\s|$)/g;

export function parseShadow(
  className: string | null | undefined,
): ShadowValue | null {
  if (!className) return null;
  let last: ShadowValue | null = null;
  SHADOW_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SHADOW_RE.exec(className)) !== null) {
    // Group 1 is the (^|\s) anchor; group 2 is the size suffix
    // (undefined for the bare `shadow` token → coerce to "").
    last = ((m[2] ?? "") as ShadowValue) ?? null;
  }
  return last;
}

export function setShadow(
  className: string | null | undefined,
  value: ShadowValue | null,
): string {
  const stripped = (className ?? "")
    .replace(/(^|\s)shadow(?:-(?:none|sm|md|lg|xl|2xl|inner))?(?=\s|$)/g, " ")
    // Picking a token clears any custom (arbitrary) shadow — the two
    // modes are mutually exclusive.
    .replace(/(^|\s)shadow-\[[^\]]+\](?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = value === "" ? "shadow" : `shadow-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Custom (raw) shadow — the ADVANCED escape hatch ─────────────────
//
// The token control above (`shadow-md` …) is the default. When a
// designer needs an exact offset/blur/spread/colour they drop into this
// raw mode, which writes a single arbitrary Tailwind class:
//
//   shadow-[<x>px_<y>px_<blur>px_<spread>px_rgba(r,g,b,a)]
//
// Tailwind needs underscores where CSS uses spaces. Setting a custom
// shadow strips any keyword `shadow-*` (and `setShadow` strips this), so
// a frame is never on both at once — the same token-vs-raw contract we
// want every style section to share.

export interface CustomShadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  /** 6-digit hex WITHOUT leading "#" (e.g. "000000"). */
  hex: string;
  /** 0–100. */
  opacity: number;
}

export const DEFAULT_CUSTOM_SHADOW: CustomShadow = {
  x: 0,
  y: 3,
  blur: 3,
  spread: 0,
  hex: "000000",
  opacity: 20,
};

const SHADOW_CUSTOM_RE = /(^|\s)shadow-\[([^\]]+)\](?=\s|$)/g;

/** Parse a custom `shadow-[…]` arbitrary class, or null when none is
 *  present (incl. when only a keyword `shadow-*` token is set). */
export function parseShadowCustom(
  className: string | null | undefined,
): CustomShadow | null {
  if (!className) return null;
  let inner: string | null = null;
  SHADOW_CUSTOM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SHADOW_CUSTOM_RE.exec(className)) !== null) inner = m[2];
  if (inner === null) return null;
  const parts = inner.split("_");
  const nums = parts.slice(0, 4).map((p) => parseInt(p, 10));
  const colorTok = parts.slice(4).join("_"); // rgba(r,g,b,a)
  let hex = "000000";
  let opacity = 100;
  const rgba = /rgba?\(([^)]+)\)/.exec(colorTok);
  if (rgba) {
    const c = rgba[1].split(",").map((s) => s.trim());
    const [r, g, b] = [c[0], c[1], c[2]].map((v) => parseInt(v, 10));
    if ([r, g, b].every((v) => Number.isFinite(v))) {
      hex = [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    }
    if (c[3] !== undefined) {
      const a = parseFloat(c[3]);
      if (Number.isFinite(a)) opacity = Math.round(a * 100);
    }
  }
  const [x, y, blur, spread] = nums.map((n) => (Number.isFinite(n) ? n : 0));
  return { x, y, blur, spread, hex, opacity };
}

/** CustomShadow → a CSS box-shadow value for inline style — the carrier
 *  for detached shadows (renders in Fast Frame; arbitrary classes don't). */
export function customShadowToCss(value: CustomShadow): string {
  const h = value.hex.replace(/^#/, "").padStart(6, "0").slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  const a = Math.max(0, Math.min(100, value.opacity)) / 100;
  return `${value.x}px ${value.y}px ${value.blur}px ${value.spread}px rgba(${r},${g},${b},${a})`;
}

/** Parse a simple single CSS box-shadow back into CustomShadow. Null for
 *  multi-shadow / keyword / unparsable values. */
export function cssToCustomShadow(
  css: string | undefined | null,
): CustomShadow | null {
  if (!css) return null;
  const m =
    /^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+rgba?\(([^)]+)\)$/.exec(
      css.trim(),
    );
  if (!m) return null;
  const [, x, y, blur, spread, color] = m;
  const c = color.split(",").map((s) => s.trim());
  const [r, g, b] = [c[0], c[1], c[2]].map((v) => parseInt(v, 10));
  let hex = "000000";
  if ([r, g, b].every((v) => Number.isFinite(v))) {
    hex = [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  const a = c[3] !== undefined ? parseFloat(c[3]) : 1;
  return {
    x: Number(x),
    y: Number(y),
    blur: Number(blur),
    spread: Number(spread),
    hex,
    opacity: Math.round((Number.isFinite(a) ? a : 1) * 100),
  };
}

/** hex + 0–100 opacity → a CSS colour for inline style ("#rrggbb" at
 *  full opacity, rgba(...) otherwise). The detached-fill carrier. */
export function hexOpacityToCssColor(hex: string, opacity: number): string {
  const h = hex.replace(/^#/, "").padStart(6, "0").slice(0, 6);
  const o = Math.max(0, Math.min(100, opacity));
  if (o >= 100) return `#${h}`;
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${o / 100})`;
}

/** Parse "#rrggbb" / rgb() / rgba() back into hex + 0–100 opacity. */
export function cssColorToHexOpacity(
  css: string | undefined | null,
): { hex: string; opacity: number } | null {
  if (!css) return null;
  const v = css.trim();
  const hexM = /^#([0-9a-fA-F]{6})$/.exec(v);
  if (hexM) return { hex: hexM[1].toLowerCase(), opacity: 100 };
  const m = /^rgba?\(([^)]+)\)$/.exec(v);
  if (!m) return null;
  const c = m[1].split(",").map((s) => s.trim());
  const [r, g, b] = [c[0], c[1], c[2]].map((x) => parseInt(x, 10));
  if (![r, g, b].every((x) => Number.isFinite(x))) return null;
  const hex = [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  const a = c[3] !== undefined ? parseFloat(c[3]) : 1;
  return { hex, opacity: Math.round((Number.isFinite(a) ? a : 1) * 100) };
}

/** Write (or clear, with null) a custom shadow. Strips BOTH keyword and
 *  arbitrary shadow tokens first so the modes stay mutually exclusive. */
export function setShadowCustom(
  className: string | null | undefined,
  value: CustomShadow | null,
): string {
  const stripped = (className ?? "")
    .replace(/(^|\s)shadow(?:-(?:none|sm|md|lg|xl|2xl|inner))?(?=\s|$)/g, " ")
    .replace(SHADOW_CUSTOM_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const h = value.hex.replace(/^#/, "").padStart(6, "0").slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  const a = Math.max(0, Math.min(100, value.opacity)) / 100;
  const token = `shadow-[${value.x}px_${value.y}px_${value.blur}px_${value.spread}px_rgba(${r},${g},${b},${a})]`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Fill (background) ───────────────────────────────────────────────
//
// Background colour as a THEME token (`bg-card`, `bg-muted`, …) — never
// a raw hex. The token resolves through the theme's colour scale, so a
// fill picked here restyles globally when the theme changes. `null`
// means "no fill token" (the element inherits / stays transparent);
// `transparent` is an explicit `bg-transparent` override.
//
// Surface-bearing DS components (Card, etc.) already carry a fill via
// their own `surface`/variant prop — this control writes a className
// `bg-*` that stacks ON TOP of that, so it's an override, not the
// component's canonical fill.

export const FILL_COLOR_TOKENS = [
  "background",
  "card",
  "muted",
  "secondary",
  "accent",
  "primary",
  "destructive",
  "transparent",
] as const;
export type FillColorToken = (typeof FILL_COLOR_TOKENS)[number];

const FILL_ALT = FILL_COLOR_TOKENS.join("|");
const FILL_RE = new RegExp(`(^|\\s)bg-(${FILL_ALT})(?=\\s|$)`, "g");

export function parseFill(
  className: string | null | undefined,
): FillColorToken | null {
  if (!className) return null;
  return (lastMatch(FILL_RE, className, 2) as FillColorToken) ?? null;
}

export function setFill(
  className: string | null | undefined,
  value: FillColorToken | null,
): string {
  const stripped = (className ?? "")
    .replace(FILL_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  const token = `bg-${value}`;
  return stripped ? `${stripped} ${token}` : token;
}

// ─── Internal helpers ────────────────────────────────────────────────
// Shared scan/strip logic for the numeric families above so each
// family is a thin wrapper that supplies its own pattern + token
// prefix. Keeps the per-family API uniform.

function parseNumeric(
  className: string | null | undefined,
  pattern: RegExp
): number | null {
  // Existing two-group patterns (gap, grid-cols, radius-like)
  // capture the numeric value at index 2.
  return parseNumericLastGroup(className, pattern, 2);
}

/**
 * Generalised numeric scan — same shape as `parseNumeric` but with
 * an explicit "which capture group holds the number" index. Used by
 * the padding + margin parsers, whose regex captures an optional
 * directional suffix (`[trblxy]?`) in group 2, leaving the numeric
 * value in group 3.
 *
 * Returns the LAST matched numeric value (Tailwind "shadows-later"
 * semantics), or null when no token matches.
 */
function parseNumericLastGroup(
  className: string | null | undefined,
  pattern: RegExp,
  group: number,
): number | null {
  if (!className) return null;
  let last: number | null = null;
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(className)) !== null) {
    const raw = match[group];
    if (raw === undefined) continue;
    const num = Number(raw);
    if (Number.isFinite(num)) last = num;
  }
  return last;
}

function setNumeric(
  className: string | null | undefined,
  stripPattern: RegExp,
  tokenPrefix: string,
  value: number | null
): string {
  const stripped = (className ?? "")
    .replace(stripPattern, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value === null) return stripped;
  return stripped
    ? `${stripped} ${tokenPrefix}-${value}`
    : `${tokenPrefix}-${value}`;
}
