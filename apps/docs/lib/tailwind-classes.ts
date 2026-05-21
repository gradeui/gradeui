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
export const PADDING_SCALE = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const;
export const MARGIN_SCALE = PADDING_SCALE;
export const GAP_SCALE = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const;
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
    // match[1] is undefined for bare `rounded`; coerce to "".
    last = ((match[1] ?? "") as RadiusValue) ?? null;
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
  /(^|\s)text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)(?=\s|$)/g;

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
      /(^|\s)text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)(?=\s|$)/g,
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
