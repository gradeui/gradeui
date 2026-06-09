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
 * Cream off-white background with a clearly visible warm tint (neutral
 * hue 85°), now paired with a blue primary and a teal-cyan secondary
 * brand colour. Constructed exactly like every other built-in theme:
 * a plain ThemeInput fed through `generateTheme`, with no per-theme
 * post-process override (the old near-black-button override in
 * `lib/themes/index.ts` has been removed). Brand colours come straight
 * from `hues.primary` / `hues.accent` below.
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
    // into amber territory. The cream surface stays; only the brand
    // colours below change.
    neutral: 85,
    // Brand primary — blue. Exact hue of the requested
    // oklch(0.5667 0.1529 250.94); the generator's step-500 primary
    // token lands at L 0.610 / C 0.153 at this hue (chroma scale 0.90
    // below × the 0.170 peak).
    primary: 250.94,
    // Secondary brand colour — teal-cyan. Exact hue of the requested
    // oklch(0.5667 0.1085 214.94). Surfaced through the `accent`
    // token (the generator's `secondary` token is always a neutral
    // surface, so the second brand colour rides on accent).
    accent: 214.94,
  },
  chroma: {
    // Rebalanced for `default` intensity (was 0.2 under `muted` =
    // 0.12 effective). Keeps the cream surface visually identical.
    neutral: 0.12,
    // 0.90 × 0.170 peak = C 0.153 on the primary token — matches the
    // requested primary chroma.
    primary: 0.9,
    // 0.64 × 0.170 peak = C 0.109 on the accent token — matches the
    // requested secondary chroma.
    accent: 0.64,
  },
  // Default intensity so the brand chroma above renders at full
  // strength (muted would scale it down by 0.6).
  intensity: "default",
  typography: {
    // Inter for body — dense panels (the Studio inspector especially)
    // were hard to read in all-mono. Display keeps IBM Plex Mono for
    // the terminal-flavoured headings; mono stays for code and value
    // chips.
    display: "ibmPlexMono",
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

/* ═══════════════════════════════════════════════════════════════════
   WILD SEED — 8 deterministic "starting points" for the theme creator.
   Hand-authored constants (NOT generated), so they're byte-identical on
   every build and editable line-by-line for edge-testing. These are the
   seed the theme creator will later let users fork + tweak. Each leans
   into a distinct mood across hue / type / radius / shape so the picker
   shows real breadth.
   ═══════════════════════════════════════════════════════════════════ */

export const neonBrutalistInput: ThemeInput = {
  id: "neon-brutalist",
  name: "Neon Brutalist",
  description: "Electric magenta + acid green on near-black. Sharp, loud.",
  tagline: "Wild",
  hues: { neutral: 285, primary: 330, accent: 140 },
  chroma: { neutral: 0.12, primary: 1.2, accent: 1.2 },
  intensity: "vibrant",
  typography: {
    display: "spaceGrotesk",
    body: "geist",
    mono: "geistMono",
    scale: "default",
    headingWeight: 700,
    headingTracking: "-0.02em",
  },
  spacing: { density: "tight" },
  radius: { style: "sharp" },
  effects: { shadows: "none", motionIntensity: 0.75, borderWidth: "2px" },
  components: { buttonShape: "square", inputStyle: "underline", cardStyle: "flat" },
};

export const sunsetVaporInput: ThemeInput = {
  id: "sunset-vapor",
  name: "Sunset Vapor",
  description: "Tangerine + violet vaporwave with glassy cards.",
  tagline: "Wild",
  hues: { neutral: 320, primary: 35, accent: 295 },
  chroma: { neutral: 0.1, primary: 1.1, accent: 1.1 },
  intensity: "vibrant",
  typography: {
    display: "outfit",
    body: "outfit",
    mono: "jetbrainsMono",
    scale: "spacious",
    headingWeight: 600,
  },
  spacing: { density: "roomy" },
  radius: { style: "round" },
  effects: { shadows: "dramatic", motionIntensity: 1.25 },
  components: { buttonShape: "pill", inputStyle: "filled", cardStyle: "glass" },
};

export const forestTerminalInput: ThemeInput = {
  id: "forest-terminal",
  name: "Forest Terminal",
  description: "Deep green + amber, monospace, terminal-flavoured.",
  tagline: "Wild",
  hues: { neutral: 150, primary: 155, accent: 75 },
  chroma: { neutral: 0.06, primary: 0.9, accent: 1.0 },
  intensity: "default",
  typography: {
    display: "ibmPlexMono",
    body: "ibmPlexMono",
    mono: "ibmPlexMono",
    scale: "compact",
    headingWeight: 600,
  },
  spacing: { density: "tight" },
  radius: { style: "subtle" },
  effects: { shadows: "subtle", motionIntensity: 0.5 },
  components: { buttonShape: "square", inputStyle: "outlined", cardStyle: "outlined" },
};

export const candyPopInput: ThemeInput = {
  id: "candy-pop",
  name: "Candy Pop",
  description: "Bubblegum pink + cyan. Round, roomy, cheerful.",
  tagline: "Wild",
  hues: { neutral: 330, primary: 350, accent: 195 },
  chroma: { neutral: 0.08, primary: 1.1, accent: 1.1 },
  intensity: "vibrant",
  typography: {
    display: "plusJakarta",
    body: "plusJakarta",
    mono: "geistMono",
    scale: "default",
    headingWeight: 700,
  },
  spacing: { density: "roomy" },
  radius: { style: "pill" },
  effects: { shadows: "default", motionIntensity: 1.25 },
  components: { buttonShape: "pill", inputStyle: "filled", cardStyle: "elevated" },
};

export const monoNoirInput: ThemeInput = {
  id: "mono-noir",
  name: "Mono Noir",
  description: "Pure greyscale, high-contrast, sharp editorial.",
  tagline: "Wild",
  hues: { neutral: 0, primary: 0, accent: 0 },
  chroma: { neutral: 0, primary: 0, accent: 0 },
  neutralPureGray: true,
  intensity: "default",
  typography: {
    display: "spaceGrotesk",
    body: "inter",
    mono: "geistMono",
    scale: "default",
    headingWeight: 800,
    headingTracking: "-0.03em",
  },
  spacing: { density: "default" },
  radius: { style: "sharp" },
  effects: { shadows: "dramatic", motionIntensity: 1, borderWidth: "1.5px" },
  components: { buttonShape: "square", inputStyle: "underline", cardStyle: "outlined" },
};

export const broadsheetInput: ThemeInput = {
  id: "broadsheet",
  name: "Broadsheet",
  description: "Ink navy + crimson, serif headlines, editorial.",
  tagline: "Wild",
  hues: { neutral: 250, primary: 255, accent: 20 },
  chroma: { neutral: 0.05, primary: 0.7, accent: 0.9 },
  intensity: "muted",
  typography: {
    display: "fraunces",
    body: "sourceSerif",
    mono: "ibmPlexMono",
    scale: "spacious",
    headingWeight: 600,
    headingTracking: "-0.02em",
  },
  spacing: { density: "roomy" },
  radius: { style: "subtle" },
  effects: { shadows: "subtle", motionIntensity: 1 },
  components: { buttonShape: "default", inputStyle: "underline", cardStyle: "flat" },
};

export const electricIndigoInput: ThemeInput = {
  id: "electric-indigo",
  name: "Electric Indigo",
  description: "Indigo + lime, punchy, soft-cornered product UI.",
  tagline: "Wild",
  hues: { neutral: 265, primary: 270, accent: 120 },
  chroma: { neutral: 0.07, primary: 1.15, accent: 1.15 },
  intensity: "vibrant",
  typography: {
    display: "geist",
    body: "geist",
    mono: "geistMono",
    scale: "default",
    headingWeight: 700,
    headingTracking: "-0.02em",
  },
  spacing: { density: "default" },
  radius: { style: "soft" },
  effects: { shadows: "default", motionIntensity: 1 },
  components: { buttonShape: "default", inputStyle: "filled", cardStyle: "elevated" },
};

export const pastelDreamInput: ThemeInput = {
  id: "pastel-dream",
  name: "Pastel Dream",
  description: "Soft lavender + mint, airy and muted.",
  tagline: "Wild",
  hues: { neutral: 280, primary: 285, accent: 160 },
  chroma: { neutral: 0.05, primary: 0.55, accent: 0.55 },
  intensity: "muted",
  typography: {
    display: "manrope",
    body: "manrope",
    mono: "jetbrainsMono",
    scale: "spacious",
    headingWeight: 600,
  },
  spacing: { density: "roomy" },
  radius: { style: "round" },
  effects: { shadows: "subtle", motionIntensity: 1.25 },
  components: { buttonShape: "pill", inputStyle: "outlined", cardStyle: "flat" },
};

/**
 * Bright Green — derived from BrightLocal's design tokens
 * (storybook.brightlocal.com → Tokens / Colors).
 *
 * BrightLocal's brand is a single vivid green: `primary` = green-400
 * (#2ae855 → oklch ~L0.81 C0.24 H146) on green-tinted neutrals (their
 * neutral ramp carries a subtle ~150° green cast — #f2f7f3 / #657568 /
 * #111412 rather than pure grey). There's no second brand colour in their
 * set — secondary/accent are neutral — so the `accent` token here rides on
 * their cool info hue (cyan ~215°, #06b6d4 family) to give the theme a
 * usable cool complement without inventing a clashing brand colour.
 *
 * Notes on fidelity: Grade's generator picks lightness per ramp step, so the
 * primary *token* lands a touch deeper than BrightLocal's very-light green-400
 * button — the hue/chroma/tint are matched, the exact step-lightness follows
 * Grade's curve. Bump `intensity` / `chroma.primary` if you want it brighter.
 */
export const brightGreenInput: ThemeInput = {
  id: "brightgreen",
  name: "Bright Green",
  description: "BrightLocal's vivid green on green-tinted neutrals, cyan accent.",
  tagline: "Brand",
  hues: {
    // ~150° green-cast neutrals — matches BrightLocal's tinted greys.
    neutral: 150,
    // green-400 #2ae855 → oklch hue 146.
    primary: 146,
    // Cool complement from their info/cyan family (#06b6d4 → hue ~215).
    accent: 215,
  },
  chroma: {
    // Subtle tint only — their neutrals are barely green (C ~0.03 at mid).
    neutral: 0.06,
    // Push the green vivid — BrightLocal's green is high-chroma.
    primary: 1.1,
    accent: 0.85,
  },
  // Vibrant so the green reads bright, not muted.
  intensity: "vibrant",
  typography: {
    // Clean modern SaaS register — crisp sans headings, readable body.
    display: "geist",
    body: "inter",
    mono: "geistMono",
    scale: "default",
    headingWeight: 600,
    headingTracking: "-0.01em",
  },
  spacing: { density: "default" },
  radius: { style: "soft" },
  effects: {
    shadows: "subtle",
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
// are the curated alternates; the 8 wild seeds follow as starting
// points for the theme creator.
export const BUILT_IN_INPUTS: ThemeInput[] = [
  studioInput,
  calmInput,
  energyInput,
  brightGreenInput,
  neonBrutalistInput,
  sunsetVaporInput,
  forestTerminalInput,
  candyPopInput,
  monoNoirInput,
  broadsheetInput,
  electricIndigoInput,
  pastelDreamInput,
];
