"use client";

import * as React from "react";

import {
  applyThemeToRoot,
  builtInThemes,
  defaultThemeId,
  getTheme,
  listThemes,
  saveUserTheme,
  deleteUserTheme,
  type GeneratedTheme,
  type ModeName,
  type ThemeInput,
} from "@/lib/themes";

/**
 * Runtime theme + mode provider.
 *
 * Owns the active theme id and brightness mode directly — no dependency on
 * next-themes any more. Writes CSS variables to :root on every change,
 * persists the selection to localStorage, and toggles the `.dark` class on
 * <html> so any Tailwind `dark:` utilities still scoped to the old two-mode
 * model continue to work.
 *
 * First-paint behaviour is driven by the inline pre-hydration script in
 * app/layout.tsx (see RAMP_PRE_HYDRATION_SCRIPT below), which reads
 * localStorage + prefers-color-scheme before React hydrates.
 */

const STORAGE_THEME_KEY = "ramp-theme";
const STORAGE_MODE_KEY = "ramp-mode";

export const ALL_MODES: ModeName[] = [
  "superLight",
  "light",
  "dark",
  "superDark",
];

const DARK_MODES: ReadonlySet<ModeName> = new Set(["dark", "superDark"]);

/**
 * Inline script body (no React, no imports) that runs in <head> before
 * hydration. Applies the `.dark` class and `data-mode` attribute so the
 * initial paint matches the stored mode / system preference — prevents
 * the classic dark-mode FOUC.
 *
 * NOTE: this string is embedded directly into the <head> via
 * dangerouslySetInnerHTML. Keep it self-contained and dependency-free.
 */
export const RAMP_PRE_HYDRATION_SCRIPT = `
(function() {
  try {
    var mode = localStorage.getItem('${STORAGE_MODE_KEY}');
    var valid = ['superLight','light','dark','superDark'];
    if (!mode || valid.indexOf(mode) === -1) {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (mode === 'dark' || mode === 'superDark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.setAttribute('data-mode', mode);
    var themeId = localStorage.getItem('${STORAGE_THEME_KEY}');
    if (themeId) document.documentElement.setAttribute('data-ramp-theme', themeId);
  } catch(e) {}
})();
`;

type RampThemeContextValue = {
  /** The currently active theme object. */
  theme: GeneratedTheme;
  /** The active theme's id. */
  themeId: string;
  /** Active brightness mode. */
  mode: ModeName;
  /** True if the active mode is dark or super-dark. Convenience for
   *  components that only care about a binary light/dark split. */
  isDark: boolean;
  /** Switch active theme by id (built-in or user). Persists. */
  setThemeId: (id: string) => void;
  /** Switch active brightness mode. Persists. */
  setMode: (mode: ModeName) => void;
  /** Every theme visible in the switcher (built-ins + user themes). */
  themes: GeneratedTheme[];
  /** Save (create/replace) a user theme and switch to it. */
  saveAndActivate: (input: ThemeInput) => void;
  /** Delete a user theme (built-ins are no-ops). Falls back to default if active. */
  deleteTheme: (id: string) => void;
  /** Refresh the themes list (call after external user-theme mutations). */
  refresh: () => void;
};

const RampThemeContext = React.createContext<RampThemeContextValue | null>(null);

export interface RampThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  defaultMode?: ModeName;
}

export function RampThemeProvider({
  children,
  defaultTheme = defaultThemeId,
  defaultMode = "light",
}: RampThemeProviderProps) {
  // SSR-safe defaults; the real values come from localStorage on mount.
  const [themeId, setThemeIdState] = React.useState<string>(defaultTheme);
  const [mode, setModeState] = React.useState<ModeName>(defaultMode);
  const [revision, setRevision] = React.useState(0);

  // Hydrate from localStorage on mount. The pre-hydration script already
  // applied the correct .dark class, so there's no visible flicker here.
  React.useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(STORAGE_THEME_KEY);
      if (storedTheme && getTheme(storedTheme)) {
        setThemeIdState(storedTheme);
      }
      const storedMode = localStorage.getItem(STORAGE_MODE_KEY) as ModeName | null;
      if (storedMode && ALL_MODES.includes(storedMode)) {
        setModeState(storedMode);
      } else if (typeof window !== "undefined") {
        // No stored mode — follow system preference for the light/dark split.
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setModeState(prefersDark ? "dark" : "light");
      }
    } catch {
      /* storage may be disabled */
    }
  }, []);

  // Apply the resolved theme whenever anything changes.
  React.useEffect(() => {
    const theme = getTheme(themeId) ?? getTheme(defaultThemeId);
    if (!theme) return;
    applyThemeToRoot(theme, mode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", DARK_MODES.has(mode));
    }
  }, [themeId, mode, revision]);

  // Watch the system preference — if the user hasn't explicitly picked a
  // mode yet (nothing in localStorage), follow OS changes live.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(STORAGE_MODE_KEY)) return; // user-chosen, skip
      } catch {
        return;
      }
      setModeState(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const setThemeId = React.useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, id);
    } catch {}
  }, []);

  const setMode = React.useCallback((next: ModeName) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_MODE_KEY, next);
    } catch {}
  }, []);

  const saveAndActivate = React.useCallback((input: ThemeInput) => {
    saveUserTheme(input);
    setRevision((r) => r + 1);
    setThemeId(input.id);
  }, [setThemeId]);

  const deleteTheme = React.useCallback((id: string) => {
    if (id in builtInThemes) return;
    deleteUserTheme(id);
    setRevision((r) => r + 1);
    setThemeIdState((current) => (current === id ? defaultThemeId : current));
  }, []);

  const refresh = React.useCallback(() => {
    setRevision((r) => r + 1);
  }, []);

  const value = React.useMemo<RampThemeContextValue>(() => {
    const theme = getTheme(themeId) ?? getTheme(defaultThemeId)!;
    return {
      theme,
      themeId: theme.id,
      mode,
      isDark: DARK_MODES.has(mode),
      setThemeId,
      setMode,
      themes: listThemes(),
      saveAndActivate,
      deleteTheme,
      refresh,
    };
  }, [themeId, mode, revision, setThemeId, setMode, saveAndActivate, deleteTheme, refresh]);

  return (
    <RampThemeContext.Provider value={value}>
      {children}
    </RampThemeContext.Provider>
  );
}

/** Read the active theme + mode. Must be used inside <RampThemeProvider>. */
export function useRampTheme(): RampThemeContextValue {
  const ctx = React.useContext(RampThemeContext);
  if (!ctx) {
    throw new Error(
      "useRampTheme must be used inside <RampThemeProvider>. Wrap your app (typically in app/layout.tsx)."
    );
  }
  return ctx;
}

/** Safe variant — returns null outside a provider instead of throwing. */
export function useMaybeRampTheme(): RampThemeContextValue | null {
  return React.useContext(RampThemeContext);
}
