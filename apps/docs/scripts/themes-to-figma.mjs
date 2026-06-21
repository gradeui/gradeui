/**
 * themes-to-figma.mjs — mirror every code-defined theme into a Figma-ready
 * JSON of hex ramps.
 *
 * For EVERY ThemeInput in `lib/themes/inputs.ts` (BUILT_IN_INPUTS) this:
 *   1. runs the real `generateTheme` from `lib/themes/generator.ts`,
 *   2. takes the eight ramp families — neutral, primary, accent (from
 *      `GeneratedTheme.ramps`) and success, warning, info, highlight,
 *      destructive (from `GeneratedTheme.roleRamps`),
 *   3. converts every 50…950 step's OKLCH triplet to an sRGB hex,
 *   4. emits `themes-figma.json` next to this script, plus a verbatim
 *      `semanticAliasMap` (light + dark) so Figma can wire aliases →
 *      ramp steps.
 *
 * Each theme entry also carries `fonts` ({ body, header, mono, accent } →
 * Figma STRING vars in the per-theme Primitives mode). Two theme-independent
 * top-level blocks are emitted once: `typeScale` (px font-size ladder) and
 * `spacing` (Tailwind-style px spacing ladder) — both FLOAT vars in Figma.
 *
 * Run (Mac):    npx tsx apps/docs/scripts/themes-to-figma.mjs
 * Run (Linux):  node --experimental-strip-types \
 *                 --loader ./scripts/_ts-resolve-hook.mjs \
 *                 scripts/themes-to-figma.mjs   (from apps/docs)
 *
 * It then VALIDATES the engine against the known Figma "Calm" primitives
 * (±1 per channel) and prints a PASS/FAIL table.
 *
 * ── On the hex converter ───────────────────────────────────────────────
 * `lib/themes/oklch-to-hex.ts` resolves OKLCH by asking the BROWSER to
 * compute the colour (`getComputedStyle().color`) and then clamps each
 * channel to 0–255. That function only works with a DOM, so it cannot run
 * under plain Node. `oklchToHex` here reproduces exactly what the browser
 * does: the CSS Color 4 OKLCH → Oklab → linear-sRGB → sRGB pipeline,
 * followed by the SAME per-channel 0–255 clip the source applies. The Calm
 * validation below is the proof that this matches the in-app converter.
 *
 * Run:  node_modules/.bin/tsx apps/docs/scripts/themes-to-figma.mjs
 *   (tsx is required so the .ts imports below resolve.)
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Relative imports (not the "@/" alias — that only resolves inside Next).
import { BUILT_IN_INPUTS } from "../lib/themes/inputs.ts";
import { generateTheme } from "../lib/themes/generator.ts";
import { RAMP_KEYS } from "../lib/themes/oklch.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ─────────────────────── OKLCH → sRGB hex ───────────────────────
   CSS Color 4 reference pipeline. Mirrors what the browser's CSS engine
   does for `oklch(L C H)`, which is what lib/themes/oklch-to-hex.ts reads
   back via getComputedStyle. Per-channel clip to [0,255] matches the
   source's final `Math.max(0, Math.min(255, x))`. */

// Oklab → linear sRGB (Björn Ottosson's matrices, the CSS Color 4 values).
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// linear-light sRGB channel → gamma-encoded sRGB (0..1).
function linearToSrgb(c) {
  const sign = c < 0 ? -1 : 1;
  const abs = Math.abs(c);
  if (abs > 0.0031308) {
    return sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
  }
  return 12.92 * c;
}

// sRGB gamma channel → linear-light (inverse of linearToSrgb). Needed by the
// gamut-mapping delta-EOK distance test.
function srgbToLinear(c) {
  const sign = c < 0 ? -1 : 1;
  const abs = Math.abs(c);
  if (abs > 0.04045) {
    return sign * Math.pow((abs + 0.055) / 1.055, 2.4);
  }
  return c / 12.92;
}

// linear sRGB → Oklab (forward direction, for the gamut-map distance metric).
function linearSrgbToOklab(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

// OKLCH (L, C, Hdeg) → linear-sRGB triplet.
function oklchToLinearSrgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  return oklabToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h));
}

const inGamut = (rgb) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4);
const clipLinear = (rgb) => rgb.map((c) => Math.min(1, Math.max(0, c)));

/**
 * Convert an OKLCH triplet ("L C H", space-separated — exactly the form the
 * generator stores in every ramp step) to an sRGB hex string.
 *
 * Faithful to lib/themes/oklch-to-hex.ts `oklchToHex` (which reads the
 * browser's resolved colour back from getComputedStyle), minus the DOM. When
 * the requested OKLCH is OUT of the sRGB gamut, browsers don't naively clip —
 * they run the CSS Color 4 gamut-mapping algorithm: hold L and H, binary-
 * search the chroma down, and at each candidate compare a locally-clipped
 * sRGB against the unclipped colour in Oklab (the "MINDE" deltaEOK ≤ JND
 * test). That chroma reduction is what desaturates near-black / near-white
 * extremes toward grey instead of letting a channel-clip skew the hue. We
 * reproduce that algorithm here, then apply the source's final 0–255 clamp.
 */
function oklchToHex(triplet) {
  const parts = String(triplet).trim().split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return "";
  const [L, C, Hdeg] = parts;

  let linear = oklchToLinearSrgb(L, C, Hdeg);

  if (!inGamut(linear)) {
    // CSS Color 4 §13.2 — gamut mapping by binary-searching chroma with the
    // local-clip MINDE test. Hold L and H; search chroma in [0, C]. At each
    // step, if the colour is in gamut keep it as the best-so-far; otherwise
    // compare its locally-clipped version to itself in Oklab (deltaEOK). Once
    // that clipped-vs-unclipped distance drops below the JND, the clipped
    // colour IS the answer (this is what desaturates near-black extremes and
    // gives them the small hue rotation the browser produces). This mirrors
    // exactly what the source converter reads back from getComputedStyle.
    const JND = 0.02; // just-noticeable deltaEOK
    const EPS = 0.0001;
    let lo = 0;
    let hi = C;
    let result = clipLinear(linear);

    while (hi - lo > EPS) {
      const mid = (lo + hi) / 2;
      const candidate = oklchToLinearSrgb(L, mid, Hdeg);
      if (inGamut(candidate)) {
        lo = mid;
        result = clipLinear(candidate);
      } else {
        const clipped = clipLinear(candidate);
        const [l1, a1, b1] = linearSrgbToOklab(...clipped);
        const [l2, a2, b2] = linearSrgbToOklab(...candidate);
        const dE = Math.hypot(l1 - l2, a1 - a2, b1 - b2);
        if (dE < JND) {
          result = clipped;
          break;
        }
        hi = mid;
      }
    }
    linear = result;
  }

  const r = linearToSrgb(linear[0]);
  const g = linearToSrgb(linear[1]);
  const bl = linearToSrgb(linear[2]);

  // Same final clamp the source applies: round to 0..255, clip per channel.
  const toByte = (x) => Math.max(0, Math.min(255, Math.round(x * 255)));

  return (
    "#" +
    [toByte(r), toByte(g), toByte(bl)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

/* ─────────────────────── ramp → hex map ─────────────────────── */

const RAMP_FAMILIES = [
  "neutral",
  "primary",
  "accent",
  "success",
  "warning",
  "info",
  "highlight",
  "destructive",
];

function rampToHex(ramp, themeName, family) {
  const out = {};
  for (const step of RAMP_KEYS) {
    const triplet = ramp?.[step];
    if (!triplet) {
      console.warn(
        `  ! ${themeName} / ${family}: missing step ${step} — emitting null`,
      );
      out[String(step)] = null;
      continue;
    }
    out[String(step)] = oklchToHex(triplet);
  }
  return out;
}

/* ─────────────────────── semantic alias map (verbatim) ─────────────────────── */

const semanticAliasMap = {
  light: {
    "surface/background": "neutral/50",
    "surface/foreground": "neutral/950",
    "surface/card": "white",
    "surface/card-foreground": "neutral/950",
    "surface/popover": "white",
    "surface/popover-foreground": "neutral/950",
    "action/primary": "primary/500",
    "action/primary-foreground": "primary/50",
    "action/secondary": "neutral/100",
    "action/secondary-foreground": "neutral/700",
    "action/accent": "accent/500",
    "action/accent-foreground": "accent/50",
    "action/muted": "neutral/100",
    "action/muted-foreground": "neutral/500",
    "action/destructive": "destructive/500",
    "action/destructive-foreground": "white",
    "border/border": "neutral/200",
    "border/input": "neutral/200",
    "border/ring": "primary/500",
    "status/success": "success/500",
    "status/warning": "warning/500",
    "status/info": "info/500",
    "status/highlight": "highlight/500",
    "alert/destructive-soft": "destructive/100",
    "alert/destructive-deep": "destructive/800",
    "alert/success-soft": "success/100",
    "alert/success-deep": "success/800",
    "alert/warning-soft": "warning/100",
    "alert/warning-deep": "warning/800",
    "alert/info-soft": "info/100",
    "alert/info-deep": "info/800",
    "alert/highlight-soft": "highlight/100",
    "alert/highlight-deep": "highlight/800",
  },
  dark: {
    "surface/background": "neutral/950",
    "surface/foreground": "neutral/50",
    "surface/card": "neutral/900",
    "surface/card-foreground": "neutral/50",
    "surface/popover": "neutral/900",
    "surface/popover-foreground": "neutral/50",
    "action/primary": "primary/400",
    "action/primary-foreground": "primary/950",
    "action/secondary": "neutral/800",
    "action/secondary-foreground": "neutral/200",
    "action/accent": "accent/400",
    "action/accent-foreground": "accent/950",
    "action/muted": "neutral/800",
    "action/muted-foreground": "neutral/400",
    "action/destructive": "destructive/400",
    "action/destructive-foreground": "white",
    "border/border": "neutral/800",
    "border/input": "neutral/800",
    "border/ring": "primary/400",
    "status/success": "success/400",
    "status/warning": "warning/400",
    "status/info": "info/400",
    "status/highlight": "highlight/400",
    "alert/destructive-soft": "destructive/950",
    "alert/destructive-deep": "destructive/300",
    "alert/success-soft": "success/950",
    "alert/success-deep": "success/300",
    "alert/warning-soft": "warning/950",
    "alert/warning-deep": "warning/300",
    "alert/info-soft": "info/950",
    "alert/info-deep": "info/300",
    "alert/highlight-soft": "highlight/950",
    "alert/highlight-deep": "highlight/300",
  },
};

/* ─────────────────────── build ─────────────────────── */

const themes = {};
for (const input of BUILT_IN_INPUTS) {
  const gen = generateTheme(input);
  const ramps = {};
  for (const family of RAMP_FAMILIES) {
    const ramp =
      family === "neutral" || family === "primary" || family === "accent"
        ? gen.ramps?.[family]
        : gen.roleRamps?.[family];
    if (!ramp) {
      console.warn(`  ! ${gen.name}: no ramp for family "${family}"`);
      ramps[family] = {};
      continue;
    }
    ramps[family] = rampToHex(ramp, gen.name, family);
  }
  // Resolved font-family strings from the generated typography. These become
  // STRING variables in Figma's Primitives collection (one per theme mode):
  //   body   ← GeneratedTypography.fontSans
  //   header ← GeneratedTypography.fontDisplay
  //   mono   ← GeneratedTypography.fontMono
  //   accent ← GeneratedTypography.fontAccent
  const fonts = {
    body: gen.typography.fontSans,
    header: gen.typography.fontDisplay,
    mono: gen.typography.fontMono,
    accent: gen.typography.fontAccent,
  };
  themes[input.id] = { name: gen.name, ramps, fonts };
}

/* ─────────────────────── fixed type scale + spacing ───────────────────────
   Theme-independent blocks. The type ladder rides the generator's default
   scale (it changes per-theme only when a theme picks a non-default modular
   scale / preset); we emit a single representative ladder from a default
   theme so Figma's "Type Scale" collection has one stable mode. Spacing is a
   fixed Tailwind-style px ladder (mirrors the existing Figma "Scale"
   collection). Both are plain px NUMBERS for Figma FLOAT variables. */

// rem string ("3.000rem") → px number (×16). Tolerates a bare number too.
const remToPx = (v) => {
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? null : Math.round(n * 16 * 1000) / 1000;
};

// Representative theme for the fixed type ladder. `studio` is the default
// house theme (default scale + density); `calm` is the documented fallback.
const typeRefInput =
  BUILT_IN_INPUTS.find((t) => t.id === "studio") ??
  BUILT_IN_INPUTS.find((t) => t.id === "calm") ??
  BUILT_IN_INPUTS[0];
const typeRefTheme = generateTheme(typeRefInput);
const s = typeRefTheme.typography.scale;

const typeScale = {
  display: remToPx(s.display),
  h1: remToPx(s.h1),
  h2: remToPx(s.h2),
  h3: remToPx(s.h3),
  h4: remToPx(s.h4),
  h5: remToPx(s.h5),
  h6: remToPx(s.h6),
  body: remToPx(s.body),
  "body-sm": remToPx(s.bodySm),
};

// Tailwind spacing scale (1 unit = 4px). Mirrors the existing Figma "Scale"
// collection keys. Fixed — kept simple, not theme-derived.
const spacing = {
  "space/1": 4,
  "space/2": 8,
  "space/3": 12,
  "space/4": 16,
  "space/5": 20,
  "space/6": 24,
  "space/8": 32,
  "space/10": 40,
  "space/12": 48,
  "space/16": 64,
  "space/20": 80,
  "space/24": 96,
};

const payload = { themes, semanticAliasMap, typeScale, spacing };

const outPath = join(__dirname, "themes-figma.json");
writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

/* ─────────────────────── validate against Figma "Calm" ─────────────────────── */

const CALM_EXPECTED = {
  neutral: {
    50: "#FBFAF9",
    100: "#F4EFED",
    200: "#E3DAD7",
    400: "#ADA09B",
    500: "#8F7F7A",
    700: "#574843",
    800: "#3D312D",
    900: "#261F1C",
    950: "#120F0D",
  },
  primary: {
    50: "#FEF8F8",
    400: "#DF8787",
    500: "#C46063",
    950: "#160D0C",
  },
  accent: {
    50: "#FEF9F7",
    400: "#E0896B",
    500: "#C6633F",
    950: "#160D0A",
  },
};

const TOLERANCE = 1; // ±1 per channel

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex));
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function channelDiffs(a, b) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  return ra.map((v, i) => Math.abs(v - rb[i]));
}

// sRGB hex → OKLCH "L C H", so a failing reference value can be decoded and
// compared against the triplet the engine actually emits — making any
// input/curve drift between the live code and the captured Figma reference
// visible (vs. a converter fault, which would also miss the byte-exact steps).
function hexToOklchStr(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "(?)";
  const [r, g, b] = rgb.map((v) => srgbToLinear(v / 255));
  const [L, a, bb] = linearSrgbToOklab(r, g, b);
  const C = Math.hypot(a, bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return `${L.toFixed(3)} ${C.toFixed(4)} ${H.toFixed(1)}`;
}

// The Figma "Calm" primitives were captured BEFORE `calmInput.intensity`
// was set to "muted" (that 0.6× chroma multiplier shipped later). To prove
// the converter + ramp engine are faithful, we validate against the engine
// state that produced those primitives — Calm at intensity "default".
// (The exported JSON still carries the real, as-shipped muted Calm.)
const calmInput = BUILT_IN_INPUTS.find((t) => t.id === "calm");
const calmRefTheme = calmInput
  ? generateTheme({ ...calmInput, intensity: "default" })
  : null;
const calmShippedIntensity = calmInput?.intensity ?? "default";
const calm = calmRefTheme
  ? {
      name: calmRefTheme.name,
      ramps: Object.fromEntries(
        ["neutral", "primary", "accent"].map((fam) => [
          fam,
          rampToHex(calmRefTheme.ramps[fam], calmRefTheme.name, fam),
        ]),
      ),
    }
  : null;

console.log("\n" + "=".repeat(64));
if (calmShippedIntensity !== "default") {
  console.log(
    `NOTE: calmInput.intensity = "${calmShippedIntensity}" today, but the Figma`,
  );
  console.log(
    `      reference primitives encode intensity "default". Validating the`,
  );
  console.log(
    `      converter+engine against a default-intensity Calm (the JSON export`,
  );
  console.log(`      above uses the real, as-shipped "${calmShippedIntensity}" Calm).`);
  console.log("");
}
if (!calm) {
  console.log('VALIDATION: theme id "calm" NOT FOUND — cannot validate.');
} else {
  console.log(`VALIDATION — Calm engine fidelity (tolerance ±${TOLERANCE}/channel)`);
  console.log("=".repeat(64));
  console.log(
    "family    step   expected   actual     Δr Δg Δb   result",
  );
  console.log("-".repeat(64));

  let pass = 0;
  let fail = 0;
  const drift = [];
  for (const family of Object.keys(CALM_EXPECTED)) {
    for (const [step, expected] of Object.entries(CALM_EXPECTED[family])) {
      const actual = calm.ramps?.[family]?.[step] ?? "(none)";
      const diffs = channelDiffs(expected, actual);
      const ok = diffs ? diffs.every((d) => d <= TOLERANCE) : false;
      if (ok) pass++;
      else {
        fail++;
        drift.push({ family, step });
      }
      const dStr = diffs ? diffs.map((d) => String(d).padStart(2)).join(" ") : " -  -  -";
      console.log(
        `${family.padEnd(9)} ${String(step).padStart(4)}   ${expected}    ${String(actual).padEnd(9)}  ${dStr}   ${ok ? "PASS" : "FAIL"}`,
      );
    }
  }
  console.log("-".repeat(64));
  console.log(`TOTAL: ${pass} PASS / ${fail} FAIL`);

  if (drift.length && calmRefTheme) {
    console.log("");
    console.log(
      "Drift diagnostic — failing steps: OKLCH the engine emits vs. the OKLCH",
    );
    console.log(
      "the Figma reference hex decodes to. A hue / chroma gap here (not a",
    );
    console.log(
      "uniform rounding offset) means the captured primitive predates the",
    );
    console.log("current generator curve, NOT a converter fault.");
    console.log("-".repeat(64));
    console.log("family    step   engine emits (L C H)     figma-ref decodes to");
    for (const { family, step } of drift) {
      const emit = calmRefTheme.ramps[family]?.[step] ?? "(none)";
      const ref = hexToOklchStr(CALM_EXPECTED[family][step]);
      console.log(
        `${family.padEnd(9)} ${String(step).padStart(4)}   ${String(emit).padEnd(22)}   ${ref}`,
      );
    }
  }
}

console.log("\n" + "=".repeat(64));
console.log(`Themes written: ${Object.keys(themes).length}`);
console.log(`Output: ${outPath}`);
console.log("Theme ids:");
for (const [id, t] of Object.entries(themes)) {
  console.log(`  ${id.padEnd(18)} ${t.name}`);
}
