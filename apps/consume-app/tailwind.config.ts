import type { Config } from "tailwindcss";

/**
 * Minimal local config. `@gradeui/ui/tailwind-preset` was retired in the
 * Tailwind v4 native-@theme migration (THEME-MIGRATION.md Phase A): the
 * imported `@gradeui/ui/styles.css` is now fully self-contained — design
 * tokens, the @theme bridge, and every utility the components use ship
 * compiled in the stylesheet, so there is no JS preset to extend.
 *
 * This app intentionally keeps a Tailwind config around only so the
 * postcss pipeline (postcss.config.mjs) keeps mirroring a typical
 * consumer setup. Note app/globals.css has no @tailwind directives —
 * all Grade styling arrives via the compiled stylesheet import.
 */
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
};

export default config;
