/**
 * fill-serialise — the bridge between the inspector's multi-fill
 * <FillSection> control (which speaks `FillValue[]`) and the element's
 * source model (a Tailwind `bg-<token>` class OR an inline
 * `style.background` stack).
 *
 * Why this file exists: the single-token `parseFill`/`setFill` pair in
 * `tailwind-classes.ts` can only round-trip ONE `bg-*` class. Stacking
 * fills needs comma-separated CSS background layers, which only live on
 * the inline `style` attr. This module owns:
 *
 *   - readFills(className, inlineBackground) → FillValue[]
 *       Seeds one solid fill from a `bg-<token>` class, OR parses the
 *       layers of an inline `style.background` / `backgroundImage` back
 *       into FillValue[]. Best-effort; unparseable layers survive as a
 *       raw "custom" solid so an edit never silently drops paint.
 *
 *   - serialiseFills(fills) → { className: "bg-<token>" | null, background: string | null }
 *       Decides the cheapest representation:
 *         · exactly ONE solid token fill, nothing else → a clean
 *           `bg-<token>` class (round-trips, keeps generated code tidy).
 *         · 2+ fills, or any gradient/image → an inline
 *           `style.background` stack (the only place CSS can carry more
 *           than one layer).
 *       The caller writes className + clears/sets the inline background
 *       accordingly (the two are mutually exclusive — never both).
 *
 * CSS layer order: the FIRST fill in the array paints on TOP, matching
 * Figma's fill-list convention. CSS multi-background paints the first
 * layer on top too, so the array order maps 1:1 — no reversal.
 *
 * Upper layers must be gradients/images (CSS won't let a bare colour sit
 * above another in a multi-background). A solid fill above the bottom is
 * emitted as a flat `linear-gradient(<c>,<c>)`. The BOTTOM-most solid is
 * the `background-color`, appended after the comma-separated layer list
 * as `… , <color>` is invalid — instead we fold it into the final
 * layer as a flat gradient too, and (for the single-solid inline case)
 * a trailing solid is fine because CSS `background` shorthand accepts a
 * trailing `<color>`. We keep it simple: every solid becomes a flat
 * gradient layer EXCEPT a lone bottom solid, which we emit as the
 * shorthand's trailing colour so the common 2-fill (gradient over a
 * solid) reads naturally.
 */

import {
  gradientToCss,
  type GradientValue,
} from "@/components/ui/gradient-editor";
import {
  FILL_COLOR_TOKENS,
  type FillColorToken,
} from "@/lib/tailwind-classes";
import {
  parseTailwindGradient,
  serialiseTailwindGradient,
  hasTailwindGradient,
} from "@/lib/tailwind-gradients";
import type { FillValue } from "@/components/ui/fill-picker";

/** The bare token ids that `bg-<token>` and `oklch(var(--<token>))`
 *  both understand. A FillValue.color holding one of these is a theme
 *  token; anything else is treated as a raw CSS colour. */
const TOKEN_SET = new Set<string>(FILL_COLOR_TOKENS);

/**
 * Normalise a colour value to a BARE token id where possible.
 *
 * Two token-naming worlds meet here: the inspector / Tailwind world uses
 * bare ids (`card` → `bg-card`, resolved via `--card`), while the shared
 * <ColorPicker> / <Swatch> world (what <FillSection> emits) uses
 * `group/token` names (`surface/card`). The actual CSS custom properties
 * are bare (`--card`, `--primary`), so we strip any `group/` prefix and
 * keep the value only if the tail is a known fill token. Otherwise it's a
 * raw CSS colour and passes through untouched.
 */
function normaliseToken(color: string | undefined): FillColorToken | null {
  if (color == null) return null;
  const tail = color.includes("/") ? color.split("/").pop()! : color;
  return TOKEN_SET.has(tail) ? (tail as FillColorToken) : null;
}

/** Resolve a solid fill's colour to a CSS value, baking in per-fill
 *  opacity via color-mix (works on tokens, oklch, hex, rgb alike). */
function solidCss(fill: FillValue): string {
  const raw = fill.color ?? "transparent";
  const tok = normaliseToken(raw);
  const base =
    raw === "transparent"
      ? "transparent"
      : tok
        ? `oklch(var(--${tok}))`
        : raw; // raw CSS colour (hex / rgb / rgba)
  const opacity = fill.opacity ?? 1;
  if (opacity >= 1) return base;
  const pct = Math.round(Math.max(0, opacity) * 100);
  return `color-mix(in srgb, ${base} ${pct}%, transparent)`;
}

/** A solid colour as a flat gradient layer (needed for any solid that
 *  isn't the trailing colour — CSS multi-background upper layers must be
 *  gradients/images). */
function solidLayer(fill: FillValue): string {
  const c = solidCss(fill);
  return `linear-gradient(${c}, ${c})`;
}

/** Bridge FillValue.gradient → the GradientValue gradientToCss speaks.
 *  Mirrors fill-picker's internal toGradientValue, with per-fill opacity
 *  applied to every stop so a hidden/translucent gradient fades. */
function gradientCss(fill: FillValue): string {
  const g = fill.gradient ?? {};
  const op = fill.opacity ?? 1;
  const stops: GradientValue["stops"] = [];
  // gradientToCss resolves a stop's `token` as `oklch(var(--<token>))`,
  // so a stop must carry a BARE token id (not `group/token`) or a raw
  // CSS colour. Normalise: known fill token → bare id (the `token`
  // field); anything else → the raw colour string (the `color` field).
  const push = (value: string | undefined, position: number, id: string) => {
    if (value == null) return;
    const tok = normaliseToken(value);
    if (tok) stops.push({ id, position, token: tok, opacity: op });
    else stops.push({ id, position, color: value, opacity: op });
  };
  push(g.from ?? "primary", 0, "g-from");
  if (g.via != null) push(g.via, 50, "g-via");
  push(g.to ?? "accent", 100, "g-to");
  // The fill model's `type` ("linear" | "radial" | "conic") maps onto the
  // GradientValue's ("linear" | "radial" | "angular"). Carry it + the centre
  // position so radial / conic render (and round-trip) instead of collapsing
  // to linear.
  const type: GradientValue["type"] =
    g.type === "radial"
      ? "radial"
      : g.type === "conic"
        ? "angular"
        : "linear";
  return gradientToCss({
    type,
    angle: g.angle ?? 90,
    position: g.position,
    stops,
  });
}

/** Build a GradientValue from a FillValue.gradient (distinguishing theme
 *  tokens from raw colours) and try to serialise it back to a clean
 *  Tailwind `bg-gradient-to-*` utility. Returns null when it can't be one
 *  (non-default positions, raw colour not in the palette, etc.) so the
 *  caller falls back to inline `background`. */
function gradientToTailwindClass(fill: FillValue): string | null {
  const g = fill.gradient ?? {};
  // Only attempt a clean round-trip for tailwind-sourced presets, and only
  // at full fill opacity (a translucent fill needs the inline stack).
  if (g.source !== "tailwind") return null;
  if ((fill.opacity ?? 1) < 1) return null;
  const stops: GradientValue["stops"] = [];
  const push = (value: string | undefined, position: number, id: string) => {
    if (value == null) return;
    const tok = normaliseToken(value);
    if (tok) stops.push({ id, position, token: tok, opacity: 1 });
    else stops.push({ id, position, color: value, opacity: 1 });
  };
  push(g.from, 0, "g-from");
  if (g.via != null) push(g.via, 50, "g-via");
  push(g.to, 100, "g-to");
  return serialiseTailwindGradient({
    type: "linear",
    angle: g.angle ?? 90,
    stops,
    source: "tailwind",
    tailwindClass: g.tailwindClass,
    interpolation: g.interpolation,
  });
}

/** An image fill as a CSS background layer. */
function imageLayer(fill: FillValue): string {
  const src = fill.src ?? "";
  if (!src) return "none";
  return `url("${src}") center/cover no-repeat`;
}

/** True when a fill should paint (visibility off rides opacity 0). */
function isVisible(fill: FillValue): boolean {
  return (fill.opacity ?? 1) > 0;
}

/* ── Hidden-fill round-trip ─────────────────────────────────────────────
 * Toggling a fill's eye OFF sets opacity 0. The inspector re-derives its
 * FillValue[] from the serialised source on every render, so if a hidden
 * fill were simply OMITTED from the CSS (it paints nothing) the next read
 * would lose it entirely — taking a gradient's stops with it.
 *
 * Instead a hidden fill is serialised as a NON-PAINTING `none` layer that
 * carries the full FillValue (with its visible opacity restored) inside a
 * CSS comment sentinel. `none` is a valid background layer that draws
 * nothing; the comment survives verbatim through the inline-style string
 * round-trip; and `parseLayer` recovers the exact fill — stops intact —
 * flagged hidden again. This mirrors how the Border section keeps a hidden
 * entry alive, but works on the inspector's derive-from-source model where
 * there's no React state to stash it in. */
const HIDDEN_PREFIX = "/*gds-fill-hidden:";
const HIDDEN_SUFFIX = "*/none";

/** The opacity a hidden fill returns to when shown again. A hidden fill
 *  rides opacity 0; we stash the pre-hide opacity in `_opacity` so showing
 *  it restores the exact look. Default to fully opaque when no stash. */
function shownOpacity(fill: FillValue): number {
  const stash = (fill as { _opacity?: number })._opacity;
  return typeof stash === "number" && stash > 0 ? stash : 1;
}

/** Serialise a hidden fill into a non-painting sentinel layer carrying the
 *  full FillValue (restored to its visible opacity) so it round-trips. */
function hiddenLayer(fill: FillValue): string {
  const restored: FillValue = { ...fill, opacity: shownOpacity(fill) };
  // Drop the in-memory stash key — the visible opacity is already folded in.
  delete (restored as { _opacity?: number })._opacity;
  // encodeURIComponent already escapes `,` `"` `/` `{` `}` etc., so the
  // payload can't carry a top-level comma (would split the layer), a `*/`
  // (would close the comment early — `/` is always escaped), or a quote
  // (would break the style string). It leaves `( ) * ' !` literal, so we
  // additionally escape parens + `*` defensively: a stray `(`/`)` could
  // unbalance `splitLayers`' depth counter for following layers, and `*`
  // adjacent to the closing `/` could be misread. decodeURIComponent on
  // read reverses all of it.
  const payload = encodeURIComponent(JSON.stringify(restored)).replace(
    /[()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `${HIDDEN_PREFIX}${payload}${HIDDEN_SUFFIX}`;
}

/** Recover a hidden fill from its sentinel layer, or null when the layer
 *  isn't one. The recovered fill is flagged hidden (opacity 0) with its
 *  visible opacity stashed in `_opacity`, exactly as the eye-toggle left it. */
function parseHiddenLayer(layer: string): FillValue | null {
  const l = layer.trim();
  if (!l.startsWith(HIDDEN_PREFIX) || !l.endsWith(HIDDEN_SUFFIX)) return null;
  const payload = l.slice(HIDDEN_PREFIX.length, l.length - HIDDEN_SUFFIX.length);
  try {
    const fill = JSON.parse(decodeURIComponent(payload)) as FillValue;
    const visibleOpacity = fill.opacity ?? 1;
    return {
      ...fill,
      opacity: 0,
      ...({ _opacity: visibleOpacity } as Partial<FillValue>),
    };
  } catch {
    return null;
  }
}

/** True when the fill list is exactly one solid token fill — the case
 *  that round-trips cleanly to a single `bg-<token>` class. */
function isLoneSolidToken(fills: FillValue[]): FillColorToken | null {
  if (fills.length !== 1) return null;
  const f = fills[0];
  if (f.type !== "solid") return null;
  if (!isVisible(f)) return null;
  if ((f.opacity ?? 1) < 1) return null; // a translucent solid needs inline
  return normaliseToken(f.color); // bare id (`card`), else null → inline
}

export interface SerialisedFills {
  /** The `bg-<token>` class to write, or null to clear the bg-* class. */
  className: string | null;
  /** The inline `style.background` value to write, or null to clear it. */
  background: string | null;
}

/**
 * Serialise a FillValue[] into a className + inline-background pair.
 * Exactly one of the two carries the paint; the other is null so the
 * caller knows to clear it (the two reps are mutually exclusive).
 */
export function serialiseFills(fills: FillValue[]): SerialisedFills {
  // Empty list → clear both. A list of ONLY hidden fills still serialises
  // (to non-painting sentinel layers) so those fills survive the round-trip.
  if (fills.length === 0) {
    return { className: null, background: null };
  }

  const anyHidden = fills.some((f) => !isVisible(f));

  // The clean className shortcuts (single `bg-<token>` / `bg-gradient-to-*`)
  // can only represent the fills they encode — a sentinel-carried hidden
  // fill has nowhere to live in a class. So the shortcuts apply only when
  // NOTHING is hidden; otherwise we fall through to the inline stack, which
  // can carry both the visible paint and the hidden sentinels together.
  if (!anyHidden) {
    const visible = fills.filter(isVisible);

    // Single solid token at full opacity → clean bg-<token> class.
    const lone = isLoneSolidToken(visible);
    if (lone) {
      return { className: `bg-${lone}`, background: null };
    }

    // Single gradient fill that's a clean Tailwind preset → re-emit the
    // `bg-gradient-to-*` utility (round-trip), else fall through to inline.
    if (visible.length === 1 && visible[0].type === "gradient") {
      const cls = gradientToTailwindClass(visible[0]);
      if (cls) return { className: cls, background: null };
    }
  }

  // Otherwise → inline background stack. First fill paints on TOP, which
  // is also CSS's first-layer-on-top order, so no reversal.
  //
  // Hidden fills serialise to a non-painting sentinel layer (kept in place
  // so array order is preserved), never as the trailing colour.
  //
  // A lone trailing solid (the bottom-most VISIBLE fill) is emitted as the
  // shorthand's trailing <color>; every other solid is a flat gradient
  // layer (CSS upper layers can't be bare colours). Gradients + images
  // are always real layers.
  const layers: string[] = [];
  let trailingColor: string | null = null;
  // The trailing-<color> shorthand is only safe when EVERY fill paints: a
  // trailing colour must be the last token in `background`, so a hidden
  // sentinel below the bottom solid would either land after it (invalid) or
  // force a reorder that scrambles the recovered array. When anything is
  // hidden, emit every solid as a flat-gradient layer to preserve exact
  // array order through the round-trip.
  const useTrailing = !anyHidden;
  const lastIdx = fills.length - 1;

  fills.forEach((fill, i) => {
    if (!isVisible(fill)) {
      layers.push(hiddenLayer(fill));
      return;
    }
    const isBottom = i === lastIdx;
    if (fill.type === "gradient") {
      layers.push(gradientCss(fill));
    } else if (fill.type === "image") {
      layers.push(imageLayer(fill));
    } else {
      // solid
      if (isBottom && useTrailing) trailingColor = solidCss(fill);
      else layers.push(solidLayer(fill));
    }
  });

  // Assemble. CSS `background` shorthand allows a trailing <color> after
  // the comma-separated image layers: `g1, g2, #color`.
  const parts = [...layers];
  if (trailingColor !== null) parts.push(trailingColor);
  const background = parts.length > 0 ? parts.join(", ") : null;

  return { className: null, background };
}

/* ── Read path ──────────────────────────────────────────────────────── */

/** Split a CSS multi-background value on top-level commas (commas inside
 *  parens — gradients, color-mix, rgb() — are NOT layer separators). */
function splitLayers(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(buf.trim());
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** Pull a token id back out of `oklch(var(--<token>))`, else null. */
function tokenFromCss(css: string): FillColorToken | null {
  const m = /^oklch\(var\(--([a-z-]+)\)\)$/.exec(css.trim());
  if (m && TOKEN_SET.has(m[1])) return m[1] as FillColorToken;
  return null;
}

/* ── Gradient parse (inline CSS → FillValue.gradient) ───────────────────
 * The inverse of `gradientCss`: read a real CSS gradient layer
 * (`linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`)
 * back into the {from, via, to, angle} model the fill row + GradientEditor
 * speak. `gradientCss` always emits a `linear-gradient(<angle>deg, …)` with
 * 2–3 stops, each either `oklch(var(--<token>))` or a raw colour, optionally
 * wrapped in `color-mix(in <space>, <base> <pct>%, transparent)` for opacity;
 * this recovers all of that. We also accept hand-/AI-authored gradients with
 * `to <dir>` keywords, `from <angle>deg` (conic) and bare radials. */

/** `to <dir>` keyword → angle (deg), matching CSS linear-gradient semantics. */
const DIR_KEYWORD_ANGLE: Record<string, number> = {
  top: 0,
  "top right": 45,
  "right top": 45,
  right: 90,
  "bottom right": 135,
  "right bottom": 135,
  bottom: 180,
  "bottom left": 225,
  "left bottom": 225,
  left: 270,
  "top left": 315,
  "left top": 315,
};

/** Strip a `color-mix(in <space>, <base> <pct>%, transparent)` wrapper back
 *  to { base, opacity }. A bare colour returns opacity 1. */
function unwrapColorMix(css: string): { base: string; opacity: number } {
  const m =
    /^color-mix\(\s*in\s+[a-z-]+\s*,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*transparent\s*\)$/i.exec(
      css.trim(),
    );
  if (m) {
    const pct = Number(m[2]);
    return { base: m[1].trim(), opacity: Math.max(0, Math.min(1, pct / 100)) };
  }
  return { base: css.trim(), opacity: 1 };
}

interface ParsedStop {
  /** Bare token id when the colour is `oklch(var(--<token>))`, else undefined. */
  token?: FillColorToken;
  /** Raw CSS colour when not a token. */
  color?: string;
  /** 0–100, or undefined when the stop carried no explicit position. */
  position?: number;
  opacity: number;
}

/** Parse one `<color> [position%]` gradient stop (colour may itself be a
 *  `color-mix(...)` carrying opacity). */
function parseGradientStop(raw: string): ParsedStop | null {
  const s = raw.trim();
  if (!s) return null;
  // Split a trailing `<pos>%`, but only the LAST top-level token so a
  // `color-mix(… 60% …)`'s inner percentage isn't mistaken for the position.
  let colorPart = s;
  let position: number | undefined;
  const posM = /\s(\d+(?:\.\d+)?)%\s*$/.exec(s);
  if (posM) {
    position = Number(posM[1]);
    colorPart = s.slice(0, posM.index).trim();
  }
  const { base, opacity } = unwrapColorMix(colorPart);
  const tok = tokenFromCss(base);
  return tok
    ? { token: tok, position, opacity }
    : { color: base, position, opacity };
}

/** Split the inside of a `*-gradient(...)` on top-level commas (reusing the
 *  paren-aware splitter — color-mix() / oklch() commas stay grouped). */
function splitGradientArgs(inner: string): string[] {
  return splitLayers(inner);
}

/** Parse a real multi-stop CSS gradient layer into a gradient FillValue, or
 *  null when the layer isn't a gradient (or is the flat same-colour solid
 *  trick, which the caller handles as a solid before reaching here). */
function parseGradientLayer(layer: string): FillValue | null {
  const l = layer.trim();
  const head = /^(linear|radial|conic)-gradient\(([\s\S]*)\)$/i.exec(l);
  if (!head) return null;
  const kind = head[1].toLowerCase();
  const inner = head[2];
  const args = splitGradientArgs(inner);
  if (args.length === 0) return null;

  // The optional leading orientation arg (angle / direction / shape) is the
  // first arg IFF it isn't itself a colour stop.
  let angle: number | undefined;
  let position: string | undefined;
  let rest = args;
  const first = args[0]?.trim() ?? "";
  const looksLikeOrientation =
    /^-?\d+(?:\.\d+)?deg$/i.test(first) || // `90deg`
    /^to\s+/i.test(first) || // `to right`
    /^from\s+/i.test(first) || // conic `from 90deg`
    /^(circle|ellipse)/i.test(first) || // radial shape
    /^at\s+/i.test(first); // radial position
  if (looksLikeOrientation) {
    const degM = /(-?\d+(?:\.\d+)?)deg/i.exec(first);
    if (degM) angle = ((Number(degM[1]) % 360) + 360) % 360;
    else {
      const toM = /^to\s+(.+)$/i.exec(first);
      if (toM) {
        const key = toM[1].trim().toLowerCase().replace(/\s+/g, " ");
        if (key in DIR_KEYWORD_ANGLE) angle = DIR_KEYWORD_ANGLE[key];
      }
    }
    // Centre position for radial / conic: `… at <position>` (e.g.
    // `circle at 25% 25%`, `from 90deg at top left`).
    const atM = /\bat\s+(.+)$/i.exec(first);
    if (atM) position = atM[1].trim().replace(/\s+/g, " ");
    rest = args.slice(1);
  }

  const parsedStops = rest
    .map(parseGradientStop)
    .filter((s): s is ParsedStop => s !== null);
  // A real gradient needs ≥2 stops. (A flat same-colour 2-stop linear is
  // caught as a solid before this is called.)
  if (parsedStops.length < 2) return null;

  // Even-space positions where absent (mirrors gradientToCss's 0/50/100).
  const n = parsedStops.length;
  parsedStops.forEach((s, i) => {
    if (s.position == null) {
      s.position = n === 1 ? 0 : Math.round((i / (n - 1)) * 100);
    }
  });
  const sorted = [...parsedStops].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  // The fill model carries from / via / to (the GradientEditor reconstructs
  // its stop list from these). Map first → from, last → to, the middle stop
  // (if exactly 3) → via. Per-stop opacity collapses to one fill opacity
  // (the common case from gradientCss, where every stop shares it); take the
  // first stop's.
  const at = (s: ParsedStop | undefined) =>
    s ? (s.token ?? s.color) : undefined;
  const from = at(sorted[0]);
  const to = at(sorted[sorted.length - 1]);
  const via = sorted.length === 3 ? at(sorted[1]) : undefined;
  const opacity = sorted[0]?.opacity ?? 1;

  // Preserve the gradient KIND so radial / conic round-trip (the fill model's
  // gradient.type drives both the editor's Type select and gradientCss's
  // radial-/conic-gradient output). A non-linear gradient is, by definition,
  // not a Tailwind v2/v3 preset, so it carries `source: "custom"`.
  const gradType: NonNullable<FillValue["gradient"]>["type"] =
    kind === "radial" ? "radial" : kind === "conic" ? "conic" : "linear";
  return {
    type: "gradient",
    opacity,
    gradient: {
      from,
      via,
      to,
      angle,
      type: gradType,
      position,
      source: "custom",
    },
  };
}

/** Best-effort parse of one CSS background layer → FillValue.
 *  Unrecognised layers become a raw custom solid (color = the layer
 *  string verbatim) so a round-trip never drops paint. */
function parseLayer(layer: string): FillValue {
  const l = layer.trim();

  // Hidden sentinel: a non-painting `none` layer carrying the full fill in a
  // comment. Recover it (stops intact) flagged hidden, so the eye-toggle is
  // lossless across the derive-from-source round-trip.
  const hidden = parseHiddenLayer(l);
  if (hidden) return hidden;

  // Image: url(...)
  if (/^url\(/i.test(l)) {
    const m = /url\(\s*["']?([^"')]+)["']?\s*\)/i.exec(l);
    return { type: "image", src: m?.[1] ?? "", repeat: false, opacity: 1 };
  }

  // Flat solid masquerading as a 2-stop same-colour linear-gradient,
  // e.g. `linear-gradient(<c>, <c>)`. Recover it as a solid.
  const flat = /^linear-gradient\(\s*([^,]+?)\s*,\s*([^,]+?)\s*\)$/i.exec(l);
  if (flat && flat[1].trim() === flat[2].trim()) {
    const c = flat[1].trim();
    const tok = tokenFromCss(c);
    return tok
      ? { type: "solid", color: tok, opacity: 1 }
      : { type: "solid", color: c, opacity: 1 };
  }

  // Any other gradient (real multi-stop linear/radial/conic) → reconstruct a
  // gradient FillValue so the fill row's toggle stays on "Gradient" and the
  // value field reads "Linear · N stops" (the inverse of `gradientCss`). The
  // flat same-colour 2-stop linear is already handled above as a solid.
  if (/-gradient\(/i.test(l)) {
    const grad = parseGradientLayer(l);
    if (grad) return grad;
    // Genuinely unparseable gradient → keep the raw CSS as a custom solid so
    // a round-trip never silently drops paint.
    return { type: "solid", color: l, opacity: 1 };
  }

  // Bare colour (token or raw).
  const tok = tokenFromCss(l);
  return tok
    ? { type: "solid", color: tok, opacity: 1 }
    : { type: "solid", color: l, opacity: 1 };
}

/** Convert a parsed Tailwind GradientValue into a single gradient
 *  FillValue, carrying the `tailwind` provenance + original class so the
 *  editor locks to ≤3 stops and the serialiser can round-trip the class. */
function tailwindGradientToFill(className: string): FillValue | null {
  const gv = parseTailwindGradient(className);
  if (!gv) return null;
  const sorted = [...gv.stops].sort((a, b) => a.position - b.position);
  const at = (s: (typeof sorted)[number] | undefined) =>
    s ? (s.token ?? s.color) : undefined;
  const from = at(sorted[0]);
  const to = at(sorted[sorted.length - 1]);
  const via = sorted.length > 2 ? at(sorted[1]) : undefined;
  return {
    type: "gradient",
    opacity: 1,
    gradient: {
      from,
      via,
      to,
      angle: gv.angle,
      source: "tailwind",
      tailwindClass: gv.tailwindClass,
      interpolation: gv.interpolation,
    },
  };
}

/**
 * Build the initial FillValue[] for an element from its className (used to
 * recognise a `bg-<token>` solid OR a Tailwind gradient preset) and its
 * inline `style.background` / `style.backgroundImage` (raw CSS).
 *
 * Priority: inline background (a multi-layer stack) wins; else a Tailwind
 * gradient utility on the className becomes a gradient fill; else a single
 * `bg-<token>` solid; else []. The caller passes the already-parsed
 * `bgToken` plus the raw `className` so we can sniff the gradient utility.
 */
export function readFills(
  bgToken: FillColorToken | null,
  inlineBackground: string | undefined | null,
  className?: string | null,
): FillValue[] {
  const inline = (inlineBackground ?? "").trim();
  if (inline) {
    const layers = splitLayers(inline);
    const fills = layers.map(parseLayer);
    return fills.length > 0 ? fills : [];
  }
  // A Tailwind gradient utility on the class → one gradient fill (preset).
  if (className && hasTailwindGradient(className)) {
    const grad = tailwindGradientToFill(className);
    if (grad) return [grad];
  }
  if (bgToken) {
    return [{ type: "solid", color: bgToken, opacity: 1 }];
  }
  return [];
}
