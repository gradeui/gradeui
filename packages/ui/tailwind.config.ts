import type { Config } from "tailwindcss";
import preset from "./tailwind-preset";

/**
 * Local Tailwind config used ONLY by this package's `build:css` script.
 *
 * The preset at `./tailwind-preset.ts` is what consumers of @grade/ui
 * extend in their own apps. This file exists so Tailwind CLI, when run
 * inside this package to produce `dist/styles.css`, has a config that
 * (a) pulls in the preset (so @apply can resolve `border-border` etc.)
 * and (b) declares which source files to scan for used classes.
 *
 * Consumers should NOT import this file. They should extend
 * `@grade/ui/tailwind-preset` in their own config.
 */
const config: Config = {
  presets: [preset],
  content: [
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.css",
  ],
};

export default config;
