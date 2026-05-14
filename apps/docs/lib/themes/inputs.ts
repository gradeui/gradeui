import type { ThemeInput } from "./types";

/**
 * Built-in ThemeInputs. Every theme — built-in or user-built — is a
 * ThemeInput. Built-ins are just curated ones we ship as starting points.
 *
 * Three built-ins ship today:
 *
 *   - "Studio" (default) — the app theme. Off-white surface with a
 *     whisper of yellow, warm-brown brand. Designed to be the quiet
 *     chrome behind everything else. Currently exposed in the picker
 *     for tinkering; will be locked-down as the chrome-only theme
 *     once the user/app theme split lands.
 *   - "Calm" — the canonical editorial Grade look: warm neutrals,
 *     terracotta primary, serif typography, roomier spacing, pill
 *     buttons, subtle shadows.
 *   - "Energy" — bolder alternate. Teal primary, indigo accent, Geist
 *     sans, tighter feel.
 *
 * To add a new built-in: define a ThemeInput here, import it in
 * index.ts, and add it to the BUILT_IN_INPUTS registry below.
 */

/**
 * Studio — the app's chrome theme.
 *
 * Cream off-white background with a clearly visible warm tint, plus
 * near-black text and near-black buttons. Built to match the
 * "parchment + black UI" reference image: an app surface that reads
 * as quiet paper, not as gray. The warmth comes from neutral hue 85°
 * (very yellow-leaning) with chroma 0.20× — strong enough to register
 * as cream rather than off-white.
 *
 * The "black text + black buttons" half doesn't come from this input
 * alone — the generator's default ramp puts primary at step 500
 * (L≈0.61, mid-grey at zero chroma). To land near-black we apply a
 * `tokenOverrides` post-process in `lib/themes/index.ts` that
 * remaps `colors.light.primary` to the dark end of the neutral ramp,
 * and similar for the other modes. Primary hue + chroma below are
 * still wired into the ramps map (so the theme builder UI has
 * coherent values to display), but the rendered token uses the
 * override.
 *
 * Future: this will be the locked chrome theme for non-pro users.
 * For now it sits in the picker alongside Calm and Energy so we can
 * iterate on it as a regular theme.
 */
export const studioInput: ThemeInput = {
  id: "studio",
  name: "Studio",
  description: "Cream parchment surface, near-black text and buttons.",
  tagline: "Default",
  hues: {
    // Yellow-leaning neutral — 85° lands close to "warm paper" /
    // "parchment". Visibly warm at the light end without crossing
    // into amber territory.
    neutral: 85,
    // Primary hue is functionally irrelevant — the post-process in
    // `index.ts` re-routes the primary token to the neutral-dark
    // step. Keep it aligned with neutral so any residual chroma
    // matches the rest of the theme.
    primary: 85,
    // Accent stays in the same warm family. Used for secondary
    // highlights where a hint of warmth is wanted without breaking
    // the monochrome chrome.
    accent: 85,
  },
  chroma: {
    // Visible warmth — turns the off-white into a cream. Higher
    // than the calm-leaning 0.12 of an earlier pass because the
    // reference image is clearly tinted, not just barely off-white.
    neutral: 0.2,
    // Effectively zero — primary ramp is monochromatic. The
    // override in `index.ts` makes this moot for the rendered
    // primary token, but a clean primary ramp keeps the theme
    // builder UI honest (the swatch reads neutral, matching what
    // buttons actually look like).
    primary: 0.01,
    // Subtle warm accent — kept low so accent surfaces read as
    // "slightly warmer cream" not as a competing brand colour.
    accent: 0.3,
  },
  // Muted intensity throughout — Studio is meant to be chrome, not a
  // brand statement.
  intensity: "muted",
  typography: {
    display: "inter",
    body: "inter",
    mono: "ibmPlexMono",
    scale: "default",
    headingWeight: 600,
    // Slight negative tracking on headings — tightens them into the
    // app-like register the reference image conveys.
    headingTracking: "-0.01em",
  },
  spacing: { density: "default" },
  // Subtle radii — modern app chrome, not brutalist tool, not
  // friendly mobile.
  radius: { style: "subtle" },
  effects: {
    shadows: "subtle",
    motionIntensity: 1,
  },
  components: {
    buttonShape: "default",
    inputStyle: "outlined",
    // Flat cards on a slightly-tinted off-white surface — keeps the
    // chrome reading as one continuous plane.
    cardStyle: "flat",
  },
};


/**
 * Calm — the canonical Grade DS theme.
 *
 * Warm neutral tint (~40° amber), terracotta primary (~20°), amber accent.
 * Serif display and body (Fraunces with its full variable weight range),
 * roomier spacing, rounder corners, pill buttons, outlined cards, subtle
 * shadows, slower motion.
 */
export const calmInput: ThemeInput = {
  id: "calm",
  name: "Calm",
  description: "Warm neutrals, terracotta primary, serif typography.",
  tagline: "Signature",
  hues: {
    neutral: 40,
    primary: 20,
    accent: 40,
  },
  chroma: {
    neutral: 0.15,
    primary: 0.75,
    accent: 0.8,
  },
  // Calm leans muted — it's a quiet editorial theme by design.
  intensity: "muted",
  typography: {
    // Fraunces has proper variable weights, so bold headings look like serif
    // bold (Instrument Serif only ships in 400 and synthesizes awkwardly when
    // something like `font-bold` on an h1 forces 700).
    display: "fraunces",
    body: "fraunces",
    mono: "jetbrainsMono",
    scale: "default",
    headingWeight: 600,
    headingTracking: "-0.02em",
  },
  spacing: { density: "roomy" },
  radius: { style: "round" },
  effects: {
    shadows: "subtle",
    motionIntensity: 1.25,
  },
  components: {
    buttonShape: "pill",
    inputStyle: "outlined",
    cardStyle: "outlined",
  },
};

/**
 * Energy — bolder alternate theme.
 *
 * Teal primary + indigo accent (complementary-cool pairing). Neutral gets
 * a whisper of chroma (0.08× default curve) so grays read cool against
 * both brand colors rather than clinical. Modern sans (Geist) with
 * tighter spacing and standard corners.
 */
export const energyInput: ThemeInput = {
  id: "energy",
  name: "Energy",
  description: "Teal + indigo — punchy, cool-tone, modern sans.",
  tagline: "Alternate",
  hues: {
    neutral: 175,
    primary: 175,
    accent: 235, // indigo — distinct from teal primary, stays cool-tone
  },
  chroma: {
    neutral: 0.08,
    primary: 1.0,
    accent: 1.0,
  },
  // Energy is loud — bump intensity so the teal pops.
  intensity: "vibrant",
  typography: {
    display: "geist",
    body: "geist",
    mono: "geistMono",
    scale: "default",
    headingWeight: 600,
  },
  spacing: { density: "default" },
  radius: { style: "soft" },
  effects: {
    shadows: "default",
    motionIntensity: 1,
  },
  components: {
    buttonShape: "default",
    inputStyle: "outlined",
    cardStyle: "flat",
  },
};

// Order matters — `defaultThemeId` in `index.ts` points at the first
// entry. Studio leads because it's the chrome default; Calm + Energy
// are the curated alternates surfaced in the picker.
export const BUILT_IN_INPUTS: ThemeInput[] = [studioInput, calmInput, energyInput];
