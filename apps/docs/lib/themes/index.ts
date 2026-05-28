/**
 * Theme system public API.
 *
 * Every theme — built-in or user-built — is a ThemeInput that flows
 * through generateTheme() to produce a GeneratedTheme. The provider
 * consumes GeneratedThemes and writes them to :root via applyThemeToRoot.
 *
 * Built-in themes are defined in inputs.ts and generated on module load.
 * User themes are persisted as ThemeInputs in localStorage (phase 4) and
 * generated on demand.
 */

import { generateTheme } from "./generator";
import { BUILT_IN_INPUTS, studioInput } from "./inputs";
import type { GeneratedTheme, ThemeInput } from "./types";

/**
 * Studio's "black buttons on cream" look needs the primary token to
 * land at the dark end of the neutral ramp — the generator's default
 * pulls primary from step 500 (L≈0.61), which is mid-grey when the
 * primary ramp is monochromatic. This post-process retargets the
 * primary token to neutral 900 in the light modes and to neutral 100
 * in the dark modes, plus matching foreground / ring tokens. Applied
 * only to the studio theme; other themes pass through untouched.
 *
 * Lives in the registry rather than the generator because it's a
 * theme-specific override, not a generator-level concern — promoting
 * it into the generator would be the right move once we have a
 * second theme that wants this shape, ideally via a declarative
 * `tokenOverrides` field on `ThemeInput`.
 */
/**
 * Public counterpart of the registry's auto-applied overrides. Call this
 * on any `GeneratedTheme` to get the same chrome the in-page Studio
 * applies — used by the CodeSandbox export so the sandbox preview reads
 * with the same near-black-on-cream palette as Studio.
 *
 * Until `tokenOverrides` lives in `@gradeui/ui` itself, callers outside
 * the registry need this entrypoint to get parity.
 */
export function applyBuiltInThemeOverrides(theme: GeneratedTheme): GeneratedTheme {
  return theme.id === "studio" ? applyStudioOverrides(theme) : theme;
}

function applyStudioOverrides(theme: GeneratedTheme): GeneratedTheme {
  const n = theme.ramps.neutral;
  return {
    ...theme,
    colors: {
      ...theme.colors,
      light: {
        ...theme.colors.light,
        // Near-black on cream. n[900] is a very dark warm-grey
        // (L≈0.245 with subtle chroma) — reads as black against the
        // cream background while keeping a hint of warmth so it
        // doesn't fight the surface tint.
        primary: n[900],
        primaryForeground: n[50],
        // Focus ring slightly less aggressive than primary so it's
        // visible without looking like a duplicate button outline.
        ring: n[700],
      },
      superLight: {
        ...theme.colors.superLight,
        primary: n[900],
        primaryForeground: n[50],
        ring: n[700],
      },
      dark: {
        ...theme.colors.dark,
        // In dark mode, flip — light buttons on dark surface so the
        // "primary stands out from the background" intent survives.
        primary: n[100],
        primaryForeground: n[950],
        ring: n[300],
      },
      superDark: {
        ...theme.colors.superDark,
        primary: n[100],
        primaryForeground: n[950],
        ring: n[300],
      },
    },
  };
}

// Public re-exports
export * from "./types";
export { generateTheme } from "./generator";
export { themeToCSSVars, applyThemeToRoot, applyThemeToElement } from "./apply";
export type { ModeName } from "./oklch";
export { BUILT_IN_INPUTS, studioInput, calmInput, energyInput } from "./inputs";
export { generateThemeMarkdown, downloadThemeMarkdown } from "./export-md";
export { oklchToHex, useOklchHexes, formatOklch } from "./oklch-to-hex";

/**
 * Generated built-in themes, keyed by id. These are pure — generated once
 * at module load and shared across the app. Adding a new built-in means
 * updating inputs.ts; this map follows automatically.
 *
 * The Studio theme gets a post-process pass (`applyStudioOverrides`) so
 * its primary token lands at the dark end of the neutral ramp — see
 * the helper's doc above for the rationale.
 */
export const builtInThemes: Record<string, GeneratedTheme> = Object.fromEntries(
  BUILT_IN_INPUTS.map((input) => {
    const generated = generateTheme(input);
    const finalized =
      input.id === "studio" ? applyStudioOverrides(generated) : generated;
    return [input.id, finalized];
  }),
);

// Studio is the app's chrome theme — see `inputs.ts` for the rationale.
// `defaultThemeId` is what `GradeThemeProvider` lands on when there's
// nothing in localStorage (i.e. fresh visitor / cleared storage).
export const defaultThemeId = studioInput.id;

/**
 * Look up a theme by id — built-in or user-built. User themes are read
 * from localStorage lazily (only called from client code).
 *
 * Returns undefined if no theme matches.
 */
export function getTheme(id: string): GeneratedTheme | undefined {
  if (id in builtInThemes) return builtInThemes[id];
  const userInput = loadUserThemeInput(id);
  if (userInput) return generateTheme(userInput);
  return undefined;
}

/** Enumerate every theme — built-in first, then user themes. */
export function listThemes(): GeneratedTheme[] {
  return [...Object.values(builtInThemes), ...listUserThemes()];
}

/* ═══════════════════════════ User-theme storage ═══════════════════════════
   Minimal CRUD against localStorage for phase 2. Phase 4 will expand on
   this (export/import/URL sharing). Keyed under a single storage slot that
   holds { [id]: ThemeInput }.
   ─────────────────────────────────────────────────────────────────────── */

const USER_THEMES_KEY = "grade-user-themes";

function readUserThemeStore(): Record<string, ThemeInput> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(USER_THEMES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, ThemeInput>;
    return {};
  } catch {
    return {};
  }
}

function writeUserThemeStore(store: Record<string, ThemeInput>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(USER_THEMES_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded or storage disabled — silent fallback.
  }
}

/** Return every user-saved theme (generated from the stored inputs). */
export function listUserThemes(): GeneratedTheme[] {
  return Object.values(readUserThemeStore()).map(generateTheme);
}

/** Load a single user theme's input by id, if present. */
export function loadUserThemeInput(id: string): ThemeInput | undefined {
  return readUserThemeStore()[id];
}

/** Save (create or replace) a user theme. */
export function saveUserTheme(input: ThemeInput): GeneratedTheme {
  const store = readUserThemeStore();
  store[input.id] = input;
  writeUserThemeStore(store);
  return generateTheme(input);
}

/** Remove a user theme. Built-in ids are ignored. */
export function deleteUserTheme(id: string): void {
  if (id in builtInThemes) return;
  const store = readUserThemeStore();
  delete store[id];
  writeUserThemeStore(store);
}

/** Duplicate an existing theme (built-in or user) as a new user theme. */
export function duplicateTheme(sourceId: string, newId: string, newName: string): ThemeInput | undefined {
  const source = builtInThemes[sourceId]?.input ?? loadUserThemeInput(sourceId);
  if (!source) return undefined;
  const copy: ThemeInput = { ...source, id: newId, name: newName };
  saveUserTheme(copy);
  return copy;
}
