/**
 * tailwind-gradients — parse & serialise Tailwind gradient utility classes
 * to/from the GradientEditor's `GradientValue`.
 *
 * Studio treats gradients as Tailwind-native presets: a `bg-gradient-to-*`
 * (v2/v3) or `bg-linear-*` / `bg-radial` / `bg-conic` (v4) utility maps onto
 * the editor model and back, so a generated screen's gradient round-trips
 * through the picker instead of degrading to an opaque inline `background`.
 *
 * Spec: apps/docs/lib/tailwind-gradients.md.
 *
 * Boundaries:
 *   - Preset mode locks the editor to ≤3 stops (from / via / to) at fixed
 *     0 / 50 / 100 positions unless an explicit `-N%` stop position is set.
 *   - A parsed preset is tagged `source: "tailwind"` and keeps the original
 *     class string (`tailwindClass`) so the picker can show provenance and
 *     the serialiser can prefer re-emitting the clean utility.
 *   - Colour names resolve from TAILWIND_PALETTE (v2 rgb hex). A name that is
 *     a Grade theme token instead resolves to `oklch(var(--<token>))`.
 */

import type { GradientValue, GradientStop } from "@/components/ui/gradient-editor";
import { FILL_COLOR_TOKENS } from "@/lib/tailwind-classes";

/* ── Tailwind v2 palette (rgb hex) ──────────────────────────────────────
   Keyed `<family>-<shade>`. v4 ships the same scale in oklch; v2/v3 use
   these rgb hex values, which is what we author back into preview/inline. */
export const TAILWIND_PALETTE: Record<string, string> = {
  // slate
  "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1", "slate-400": "#94a3b8", "slate-500": "#64748b",
  "slate-600": "#475569", "slate-700": "#334155", "slate-800": "#1e293b",
  "slate-900": "#0f172a",
  // gray
  "gray-50": "#f9fafb", "gray-100": "#f3f4f6", "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db", "gray-400": "#9ca3af", "gray-500": "#6b7280",
  "gray-600": "#4b5563", "gray-700": "#374151", "gray-800": "#1f2937",
  "gray-900": "#111827",
  // red
  "red-50": "#fef2f2", "red-100": "#fee2e2", "red-200": "#fecaca",
  "red-300": "#fca5a5", "red-400": "#f87171", "red-500": "#ef4444",
  "red-600": "#dc2626", "red-700": "#b91c1c", "red-800": "#991b1b",
  "red-900": "#7f1d1d",
  // orange
  "orange-50": "#fff7ed", "orange-100": "#ffedd5", "orange-200": "#fed7aa",
  "orange-300": "#fdba74", "orange-400": "#fb923c", "orange-500": "#f97316",
  "orange-600": "#ea580c", "orange-700": "#c2410c", "orange-800": "#9a3412",
  "orange-900": "#7c2d12",
  // amber
  "amber-50": "#fffbeb", "amber-100": "#fef3c7", "amber-200": "#fde68a",
  "amber-300": "#fcd34d", "amber-400": "#fbbf24", "amber-500": "#f59e0b",
  "amber-600": "#d97706", "amber-700": "#b45309", "amber-800": "#92400e",
  "amber-900": "#78350f",
  // yellow
  "yellow-50": "#fefce8", "yellow-100": "#fef9c3", "yellow-200": "#fef08a",
  "yellow-300": "#fde047", "yellow-400": "#facc15", "yellow-500": "#eab308",
  "yellow-600": "#ca8a04", "yellow-700": "#a16207", "yellow-800": "#854d0e",
  "yellow-900": "#713f12",
  // lime
  "lime-50": "#f7fee7", "lime-100": "#ecfccb", "lime-200": "#d9f99d",
  "lime-300": "#bef264", "lime-400": "#a3e635", "lime-500": "#84cc16",
  "lime-600": "#65a30d", "lime-700": "#4d7c0f", "lime-800": "#3f6212",
  "lime-900": "#365314",
  // green
  "green-50": "#f0fdf4", "green-100": "#dcfce7", "green-200": "#bbf7d0",
  "green-300": "#86efac", "green-400": "#4ade80", "green-500": "#22c55e",
  "green-600": "#16a34a", "green-700": "#15803d", "green-800": "#166534",
  "green-900": "#14532d",
  // emerald
  "emerald-50": "#ecfdf5", "emerald-100": "#d1fae5", "emerald-200": "#a7f3d0",
  "emerald-300": "#6ee7b7", "emerald-400": "#34d399", "emerald-500": "#10b981",
  "emerald-600": "#059669", "emerald-700": "#047857", "emerald-800": "#065f46",
  "emerald-900": "#064e3b",
  // teal
  "teal-50": "#f0fdfa", "teal-100": "#ccfbf1", "teal-200": "#99f6e4",
  "teal-300": "#5eead4", "teal-400": "#2dd4bf", "teal-500": "#14b8a6",
  "teal-600": "#0d9488", "teal-700": "#0f766e", "teal-800": "#115e59",
  "teal-900": "#134e4a",
  // cyan
  "cyan-50": "#ecfeff", "cyan-100": "#cffafe", "cyan-200": "#a5f3fc",
  "cyan-300": "#67e8f9", "cyan-400": "#22d3ee", "cyan-500": "#06b6d4",
  "cyan-600": "#0891b2", "cyan-700": "#0e7490", "cyan-800": "#155e75",
  "cyan-900": "#164e63",
  // sky
  "sky-50": "#f0f9ff", "sky-100": "#e0f2fe", "sky-200": "#bae6fd",
  "sky-300": "#7dd3fc", "sky-400": "#38bdf8", "sky-500": "#0ea5e9",
  "sky-600": "#0284c7", "sky-700": "#0369a1", "sky-800": "#075985",
  "sky-900": "#0c4a6e",
  // blue
  "blue-50": "#eff6ff", "blue-100": "#dbeafe", "blue-200": "#bfdbfe",
  "blue-300": "#93c5fd", "blue-400": "#60a5fa", "blue-500": "#3b82f6",
  "blue-600": "#2563eb", "blue-700": "#1d4ed8", "blue-800": "#1e40af",
  "blue-900": "#1e3a8a",
  // indigo
  "indigo-50": "#eef2ff", "indigo-100": "#e0e7ff", "indigo-200": "#c7d2fe",
  "indigo-300": "#a5b4fc", "indigo-400": "#818cf8", "indigo-500": "#6366f1",
  "indigo-600": "#4f46e5", "indigo-700": "#4338ca", "indigo-800": "#3730a3",
  "indigo-900": "#312e81",
  // violet
  "violet-50": "#f5f3ff", "violet-100": "#ede9fe", "violet-200": "#ddd6fe",
  "violet-300": "#c4b5fd", "violet-400": "#a78bfa", "violet-500": "#8b5cf6",
  "violet-600": "#7c3aed", "violet-700": "#6d28d9", "violet-800": "#5b21b6",
  "violet-900": "#4c1d95",
  // purple
  "purple-50": "#faf5ff", "purple-100": "#f3e8ff", "purple-200": "#e9d5ff",
  "purple-300": "#d8b4fe", "purple-400": "#c084fc", "purple-500": "#a855f7",
  "purple-600": "#9333ea", "purple-700": "#7e22ce", "purple-800": "#6b21a8",
  "purple-900": "#581c87",
  // fuchsia
  "fuchsia-50": "#fdf4ff", "fuchsia-100": "#fae8ff", "fuchsia-200": "#f5d0fe",
  "fuchsia-300": "#f0abfc", "fuchsia-400": "#e879f9", "fuchsia-500": "#d946ef",
  "fuchsia-600": "#c026d3", "fuchsia-700": "#a21caf", "fuchsia-800": "#86198f",
  "fuchsia-900": "#701a75",
  // pink
  "pink-50": "#fdf2f8", "pink-100": "#fce7f3", "pink-200": "#fbcfe8",
  "pink-300": "#f9a8d4", "pink-400": "#f472b6", "pink-500": "#ec4899",
  "pink-600": "#db2777", "pink-700": "#be185d", "pink-800": "#9d174d",
  "pink-900": "#831843",
  // rose
  "rose-50": "#fff1f2", "rose-100": "#ffe4e6", "rose-200": "#fecdd3",
  "rose-300": "#fda4af", "rose-400": "#fb7185", "rose-500": "#f43f5e",
  "rose-600": "#e11d48", "rose-700": "#be123c", "rose-800": "#9f1239",
  "rose-900": "#881337",
};

/* ── Direction → angle (deg) ────────────────────────────────────────────
   v2/v3 `to-{dir}` and v4 `bg-linear-to-{dir}`. */
const DIR_ANGLE: Record<string, number> = {
  t: 0, tr: 45, r: 90, br: 135, b: 180, bl: 225, l: 270, tl: 315,
};

/** Grade theme tokens that may appear as a gradient stop colour. */
const GRADE_TOKENS = new Set<string>(FILL_COLOR_TOKENS);

/** Resolve a Tailwind colour-stop name to a GradientStop colour fields.
 *  Grade token → `{ token }` (re-voices with theme as oklch(var(--token)));
 *  palette name → `{ color: hex }`; unknown → null (skip). */
function resolveStopColor(
  name: string,
): { token?: string; color?: string } | null {
  if (name === "transparent") return { color: "transparent" };
  if (name === "black") return { color: "#000000" };
  if (name === "white") return { color: "#ffffff" };
  if (GRADE_TOKENS.has(name)) return { token: name };
  const hex = TAILWIND_PALETTE[name];
  if (hex) return { color: hex };
  // Arbitrary value: `from-[#abc]` / `from-[oklch(...)]`.
  const arb = /^\[(.+)\]$/.exec(name);
  if (arb) return { color: arb[1].replace(/_/g, " ") };
  return null;
}

let presetSeq = 0;
function stopId(role: string): string {
  presetSeq += 1;
  return `tw-${role}-${presetSeq}`;
}

/**
 * Parse a Tailwind gradient utility set from a className into a
 * GradientValue, or null when no gradient utility is present.
 *
 * Recognises:
 *   v2/v3: `bg-gradient-to-{dir} from-{c} [via-{c}] to-{c}`
 *   v4:    `bg-linear-{n|to-dir}` / `bg-radial` / `bg-conic[-{n}]`,
 *          `/interp` modifier, explicit `from-N% via-N% to-N%`.
 */
export function parseTailwindGradient(
  className: string | null | undefined,
): GradientValue | null {
  if (!className) return null;
  const tokens = className.split(/\s+/).filter(Boolean);

  let type: GradientValue["type"] | null = null;
  let angle: number | undefined;
  let interpolation: string | undefined;
  const matched: string[] = [];

  for (const t of tokens) {
    // strip interpolation modifier `/oklch` etc.
    const [base, interp] = t.split("/");
    if (interp && /^(srgb|oklch|oklab|hsl|longer|shorter|increasing|decreasing)/.test(interp)) {
      interpolation = interp;
    }

    // v2/v3 linear: bg-gradient-to-{dir}
    let m = /^bg-gradient-to-(t|tr|r|br|b|bl|l|tl)$/.exec(base);
    if (m) { type = "linear"; angle = DIR_ANGLE[m[1]]; matched.push(t); continue; }

    // v4 linear by direction: bg-linear-to-{dir}
    m = /^bg-linear-to-(t|tr|r|br|b|bl|l|tl)$/.exec(base);
    if (m) { type = "linear"; angle = DIR_ANGLE[m[1]]; matched.push(t); continue; }

    // v4 linear by angle: bg-linear-45 / bg-linear-[120deg]
    m = /^bg-linear-(\d+)$/.exec(base);
    if (m) { type = "linear"; angle = Number(m[1]); matched.push(t); continue; }
    m = /^bg-linear-\[(\d+)deg\]$/.exec(base);
    if (m) { type = "linear"; angle = Number(m[1]); matched.push(t); continue; }

    // v4 radial: bg-radial / bg-radial-[at_25%_25%]
    if (/^bg-radial(-\[.+\])?$/.exec(base)) { type = "radial"; matched.push(t); continue; }

    // v4 conic: bg-conic / bg-conic-{angle}
    m = /^bg-conic(?:-(\d+))?$/.exec(base);
    if (m) { type = "angular"; if (m[1]) angle = Number(m[1]); matched.push(t); continue; }
  }

  if (type === null) return null;

  // Colour stops. from-/via-/to- with optional explicit `-N%` positions.
  // A stop's colour is the LAST colour-bearing utility for that role; a
  // `-N%` of the same role overrides its position.
  const stopParse = (
    role: "from" | "via" | "to",
    defaultPos: number,
  ): GradientStop | null => {
    let color: { token?: string; color?: string } | null = null;
    let position: number | undefined;
    for (const t of tokens) {
      const base = t.split("/")[0];
      const pm = new RegExp(`^${role}-(\\d+)%$`).exec(base);
      if (pm) { position = Number(pm[1]); matched.push(t); continue; }
      const cm = new RegExp(`^${role}-(.+)$`).exec(base);
      if (cm) {
        const resolved = resolveStopColor(cm[1]);
        if (resolved) { color = resolved; matched.push(t); }
      }
    }
    if (!color) return null;
    return {
      id: stopId(role),
      position: position ?? defaultPos,
      opacity: 1,
      ...color,
    };
  };

  const stops: GradientStop[] = [];
  const from = stopParse("from", 0);
  const via = stopParse("via", 50);
  const to = stopParse("to", 100);
  if (from) stops.push(from);
  if (via) stops.push(via);
  if (to) stops.push(to);

  // Not a usable preset without at least two colour stops.
  if (stops.length < 2) return null;

  // The exact original class string for these matched utilities, in source
  // order, so the serialiser can prefer round-tripping it verbatim.
  const tailwindClass = tokens.filter((t) => matched.includes(t)).join(" ");

  return {
    type,
    angle,
    interpolation,
    source: "tailwind",
    tailwindClass,
    stops,
  };
}

/** Map a linear angle back to the nearest `to-{dir}` utility, or null when
 *  it isn't one of the 8 cardinal/diagonal directions. */
function angleToDir(angle: number | undefined): string | null {
  if (angle == null) return null;
  const entry = Object.entries(DIR_ANGLE).find(([, a]) => a === ((angle % 360) + 360) % 360);
  return entry ? entry[0] : null;
}

/** A stop's Tailwind colour name: a Grade token passes through; a palette
 *  hex maps back to `<family>-<shade>`; otherwise an arbitrary `[value]`. */
function stopName(stop: GradientStop): string | null {
  if (stop.token) return stop.token;
  const c = stop.color;
  if (!c) return null;
  if (c === "transparent") return "transparent";
  if (c.toLowerCase() === "#000000" || c.toLowerCase() === "#000") return "black";
  if (c.toLowerCase() === "#ffffff" || c.toLowerCase() === "#fff") return "white";
  const hit = Object.entries(TAILWIND_PALETTE).find(
    ([, hex]) => hex.toLowerCase() === c.toLowerCase(),
  );
  if (hit) return hit[0];
  return `[${c.replace(/\s+/g, "_")}]`;
}

/**
 * Serialise a GradientValue back to a Tailwind gradient class string, or
 * null when it can't be expressed as a clean v2/v3 preset (caller then
 * falls back to inline `background` via gradientToCss).
 *
 * Clean-preset rule: linear, ≤3 stops, a cardinal/diagonal direction, and
 * every stop resolvable to a Tailwind colour name at its default position
 * (0 / 50 / 100). Anything else → null.
 */
export function serialiseTailwindGradient(
  value: GradientValue,
): string | null {
  if (value.type !== "linear") return null;
  const sorted = [...value.stops].sort((a, b) => a.position - b.position);
  if (sorted.length < 2 || sorted.length > 3) return null;

  const dir = angleToDir(value.angle ?? 90);
  if (!dir) return null;

  // Stops must sit at the implicit preset positions to round-trip cleanly.
  const roles =
    sorted.length === 2
      ? [{ role: "from", pos: 0 }, { role: "to", pos: 100 }]
      : [{ role: "from", pos: 0 }, { role: "via", pos: 50 }, { role: "to", pos: 100 }];

  const parts: string[] = [`bg-gradient-to-${dir}`];
  for (let i = 0; i < sorted.length; i++) {
    const stop = sorted[i];
    const { role, pos } = roles[i];
    if (stop.position !== pos) return null; // off-preset → inline fallback
    if (stop.opacity < 1) return null; // per-stop alpha → inline fallback
    const name = stopName(stop);
    if (!name) return null;
    parts.push(`${role}-${name}`);
  }
  return parts.join(" ");
}

/** Quick predicate: does this className carry a Tailwind gradient utility? */
export function hasTailwindGradient(
  className: string | null | undefined,
): boolean {
  if (!className) return false;
  return /(^|\s)bg-(gradient-to-|linear-|radial|conic)/.test(className);
}

/** Strip every Tailwind gradient utility (type + from/via/to) from a
 *  className so a re-serialise doesn't leave stale stop classes behind. */
export function stripTailwindGradient(
  className: string | null | undefined,
): string {
  if (!className) return "";
  return className
    .split(/\s+/)
    .filter((t) => {
      const base = t.split("/")[0];
      if (/^bg-(gradient-to-|linear|radial|conic)/.test(base)) return false;
      if (/^(from|via|to)-/.test(base)) return false;
      return true;
    })
    .join(" ")
    .trim();
}
