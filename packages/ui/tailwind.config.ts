import type { Config } from "tailwindcss";
import preset from "./tailwind-preset";

/**
 * Local Tailwind config used ONLY by this package's `build:css` script.
 *
 * The preset at `./tailwind-preset.ts` is what consumers of @gradeui/ui
 * extend in their own apps. This file exists so Tailwind CLI, when run
 * inside this package to produce `dist/styles.css`, has a config that
 * (a) pulls in the preset (so @apply can resolve `border-border` etc.)
 * and (b) declares which source files to scan for used classes.
 *
 * Consumers should NOT import this file. They should extend
 * `@gradeui/ui/tailwind-preset` in their own config.
 */
const config: Config = {
  presets: [preset],
  content: [
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.css",
    // Playground scaffolds — siloed dev-only set rendered by Studio's
    // Playground tab. Scanning them here means arbitrary Tailwind
    // values (`h-[600px]`, `md:grid-cols-[minmax(0,440px)_1fr]`, etc.)
    // get compiled into dist/styles.css — the bundle Fast Frame loads
    // in its iframe. Without this, arbitrary classes would be present
    // in the JSX but generate no CSS rules. Screenshot-driven
    // playgrounds need exact pixel measurements during the first pass;
    // discipline-driven curated scaffolds in ../scaffolds/ should
    // refactor away from arbitrary values before graduating.
    "../studio/src/playbook/layouts/scaffolds-playground/*.{jsx,tsx}",
  ],
};

export default config;
