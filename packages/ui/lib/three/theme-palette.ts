import type { Palette } from "./types";

/**
 * Theme-reactive shader palette. Every slot reads a theme token wrapped
 * in `oklch()` (the gradeui contract — bare `var(--token)` triplets
 * aren't valid CSS colours), so a scene re-tints automatically when the
 * page theme/dark-mode changes (ThreeScene's palette observer pushes the
 * resolved colours into the running shader, no remount).
 *
 * Slot mapping follows the ThreeScene guidance: `secondary → --accent`
 * (gradeui's `--secondary` is a neutral surface) and
 * `background → --foreground` (the raw `--background` is the page bg and
 * washes the shader out).
 */
export const THEME_REACTIVE_PALETTE: Partial<Palette> = {
  primary: "oklch(var(--primary))",
  secondary: "oklch(var(--accent))",
  accent: "oklch(var(--primary))",
  background: "oklch(var(--foreground))",
};
