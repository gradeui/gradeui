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
 * Studio is now constructed exactly like every other built-in theme —
 * a plain `ThemeInput` (see `studioInput` in inputs.ts) fed straight
 * through `generateTheme`. The old `applyStudioOverrides` post-process
 * that hard-pinned primary to the neutral ramp's dark end has been
 * removed; Studio's blue primary + cyan accent come from `hues.primary`
 * / `hues.accent` like any other theme.
 *
 * This entrypoint is kept as a pass-through so existing callers (e.g.
 * the CodeSandbox export) don't break — no built-in needs post-process
 * overrides any more.
 */
export function applyBuiltInThemeOverrides(theme: GeneratedTheme): GeneratedTheme {
  return theme;
}

// Public re-exports
export * from "./types";
export { generateTheme, tokenRefsForMode } from "./generator";
export {
  themeToCSSVars,
  themeToPortableCss,
  applyThemeToRoot,
  applyThemeToElement,
  fontFaceCSS,
  injectFontFaces,
  FONT_FACE_STYLE_ID,
} from "./apply";
export type { ModeName } from "./oklch";
export { SEMANTIC_TOKEN_KEYS } from "./types";
export type {
  SemanticTokenKey,
  ThemeTokenRef,
  ThemeTokenOverrides,
} from "./types";
export { BUILT_IN_INPUTS, studioInput, calmInput, energyInput } from "./inputs";
export { generateThemeMarkdown, downloadThemeMarkdown } from "./export-md";
export { oklchToHex, useOklchHexes, formatOklch } from "./oklch-to-hex";

/**
 * Generated built-in themes, keyed by id. These are pure — generated once
 * at module load and shared across the app. Adding a new built-in means
 * updating inputs.ts; this map follows automatically.
 *
 * Every theme — Studio included — is generated identically: no
 * per-theme post-process passes.
 */
export const builtInThemes: Record<string, GeneratedTheme> = Object.fromEntries(
  BUILT_IN_INPUTS.map((input) => [input.id, generateTheme(input)]),
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
