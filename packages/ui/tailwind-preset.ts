import type { Config } from "tailwindcss";

/**
 * Grade Design System Tailwind preset.
 *
 * Consumers should spread this into their own tailwind config:
 *
 *   import gradePreset from "@gradeui/ui/tailwind-preset";
 *   export default {
 *     presets: [gradePreset],
 *     content: ["./app/**\/*.{ts,tsx}", "./node_modules/@gradeui/ui/dist/**\/*"],
 *   };
 *
 * Most colors are wired to CSS variables so runtime theme switching via
 * GradeThemeProvider (currently still named GradeThemeProvider — rename
 * pending) takes effect without a rebuild.
 */
const preset: Partial<Config> = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Grade brand palette — values live in styles/globals.css as --gds-* vars.
        // TODO: rename --gds-* → --grade-* in a follow-up pass.
        rds: {
          green: {
            DEFAULT: "var(--gds-green)",
            50: "var(--gds-green-50)",
            100: "var(--gds-green-100)",
            200: "var(--gds-green-200)",
            300: "var(--gds-green-300)",
            400: "var(--gds-green-400)",
            500: "var(--gds-green-500)",
            600: "var(--gds-green-600)",
            700: "var(--gds-green-700)",
            800: "var(--gds-green-800)",
            900: "var(--gds-green-900)",
            950: "var(--gds-green-950)",
          },
          yellow: {
            DEFAULT: "var(--gds-yellow)",
            50: "var(--gds-yellow-50)",
            100: "var(--gds-yellow-100)",
            200: "var(--gds-yellow-200)",
            300: "var(--gds-yellow-300)",
            400: "var(--gds-yellow-400)",
            500: "var(--gds-yellow-500)",
            600: "var(--gds-yellow-600)",
            700: "var(--gds-yellow-700)",
            800: "var(--gds-yellow-800)",
            900: "var(--gds-yellow-900)",
          },
          orange: {
            DEFAULT: "var(--gds-orange)",
            50: "var(--gds-orange-50)",
            100: "var(--gds-orange-100)",
            200: "var(--gds-orange-200)",
            300: "var(--gds-orange-300)",
            400: "var(--gds-orange-400)",
            500: "var(--gds-orange-500)",
            600: "var(--gds-orange-600)",
            700: "var(--gds-orange-700)",
            800: "var(--gds-orange-800)",
            900: "var(--gds-orange-900)",
          },
          red: {
            DEFAULT: "var(--gds-red)",
            50: "var(--gds-red-50)",
            100: "var(--gds-red-100)",
            200: "var(--gds-red-200)",
            300: "var(--gds-red-300)",
            400: "var(--gds-red-400)",
            500: "var(--gds-red-500)",
            600: "var(--gds-red-600)",
            700: "var(--gds-red-700)",
            800: "var(--gds-red-800)",
            900: "var(--gds-red-900)",
          },
          teal: {
            DEFAULT: "var(--gds-teal)",
            50: "var(--gds-teal-50)",
            100: "var(--gds-teal-100)",
            200: "var(--gds-teal-200)",
            300: "var(--gds-teal-300)",
            400: "var(--gds-teal-400)",
            500: "var(--gds-teal-500)",
            600: "var(--gds-teal-600)",
            700: "var(--gds-teal-700)",
            800: "var(--gds-teal-800)",
            900: "var(--gds-teal-900)",
            950: "var(--gds-teal-950)",
          },
          navy: {
            DEFAULT: "var(--gds-navy)",
            50: "var(--gds-navy-50)",
            100: "var(--gds-navy-100)",
            200: "var(--gds-navy-200)",
            300: "var(--gds-navy-300)",
            400: "var(--gds-navy-400)",
            500: "var(--gds-navy-500)",
            600: "var(--gds-navy-600)",
            700: "var(--gds-navy-700)",
            800: "var(--gds-navy-800)",
            900: "var(--gds-navy-900)",
          },
          blue: {
            DEFAULT: "var(--gds-blue)",
            50: "var(--gds-blue-50)",
            100: "var(--gds-blue-100)",
            200: "var(--gds-blue-200)",
            300: "var(--gds-blue-300)",
            400: "var(--gds-blue-400)",
            500: "var(--gds-blue-500)",
            600: "var(--gds-blue-600)",
            700: "var(--gds-blue-700)",
            800: "var(--gds-blue-800)",
            900: "var(--gds-blue-900)",
          },
          gray: {
            50: "var(--gds-gray-50)",
            100: "var(--gds-gray-100)",
            200: "var(--gds-gray-200)",
            300: "var(--gds-gray-300)",
            400: "var(--gds-gray-400)",
            500: "var(--gds-gray-500)",
            600: "var(--gds-gray-600)",
            700: "var(--gds-gray-700)",
            800: "var(--gds-gray-800)",
            900: "var(--gds-gray-900)",
            950: "var(--gds-gray-950)",
          },
          black: "var(--gds-black)",
          white: "var(--gds-white)",
        },
        // Semantic tokens — bare "L C H" in CSS vars, Tailwind wraps with oklch().
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
          // Alert surface pair — paler tinted bg + deeper on-surface text.
          soft: "oklch(var(--destructive-soft) / <alpha-value>)",
          deep: "oklch(var(--destructive-deep) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        // Each status colour exposes `-soft` / `-deep` siblings for the
        // tinted alert surface + readable text tokens generated by the
        // theme pipeline (lib/themes/oklch.ts#deriveAlertPair).
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          soft: "oklch(var(--success-soft) / <alpha-value>)",
          deep: "oklch(var(--success-deep) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "oklch(var(--warning) / <alpha-value>)",
          soft: "oklch(var(--warning-soft) / <alpha-value>)",
          deep: "oklch(var(--warning-deep) / <alpha-value>)",
        },
        info: {
          DEFAULT: "oklch(var(--info) / <alpha-value>)",
          soft: "oklch(var(--info-soft) / <alpha-value>)",
          deep: "oklch(var(--info-deep) / <alpha-value>)",
        },
        highlight: {
          DEFAULT: "oklch(var(--highlight) / <alpha-value>)",
          soft: "oklch(var(--highlight-soft) / <alpha-value>)",
          deep: "oklch(var(--highlight-deep) / <alpha-value>)",
        },
        // Selection pair. `selected` = solid fill behind the chosen option,
        // `selected-foreground` = on-fill text, `selected.glow` = ambient
        // halo used as a box-shadow on hover / focus. Blue by default,
        // theme-overridable via the same OKLCH triplet pattern.
        selected: {
          DEFAULT: "oklch(var(--selected) / <alpha-value>)",
          foreground: "oklch(var(--selected-foreground) / <alpha-value>)",
          glow: "oklch(var(--selected-glow) / <alpha-value>)",
        },
        "chart-1": "oklch(var(--chart-1) / <alpha-value>)",
        "chart-2": "oklch(var(--chart-2) / <alpha-value>)",
        "chart-3": "oklch(var(--chart-3) / <alpha-value>)",
        "chart-4": "oklch(var(--chart-4) / <alpha-value>)",
        "chart-5": "oklch(var(--chart-5) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Presence — elevation tokens exposed both as semantic
      // `shadow-elevation-N` utilities AND as overrides of Tailwind's
      // default `shadow-sm/md/lg/xl/2xl` scale so existing call sites
      // inherit the new system without code changes. See PRESENCE.md.
      boxShadow: {
        // Default Tailwind shadow scale, repointed onto elevation
        sm: "var(--elevation-1)",
        DEFAULT: "var(--elevation-2)",
        md: "var(--elevation-4)",
        lg: "var(--elevation-5)",
        xl: "var(--elevation-5)",
        "2xl": "var(--elevation-5)",
        inner: "var(--shadow-pressed-bevel)",
        none: "var(--elevation-0)",
        // Explicit elevation levels (preferred for new code)
        "elevation-0": "var(--elevation-0)",
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
        "elevation-4": "var(--elevation-4)",
        "elevation-5": "var(--elevation-5)",
        // State variants for raised/tactile surfaces
        raised: "var(--elevation-3)",
        hot: "var(--elevation-hot)",
        pressed: "var(--elevation-pressed)",
        // Single-layer atoms (when you need bevel-only / lift-only)
        "bevel-hi": "var(--shadow-bevel-hi)",
        "bevel-lo": "var(--shadow-bevel-lo)",
        contact: "var(--shadow-contact)",
        lift: "var(--shadow-lift)",
        "lift-deep": "var(--shadow-lift-deep)",
        "heat-inner": "var(--shadow-heat-inner)",
        "heat-outer": "var(--shadow-heat-outer)",
      },
      // Surface backgrounds — `bg-surface-glass` etc. work alongside
      // the `.gds-surface-*` classes (those add backdrop-filter).
      backgroundColor: {
        "surface-solid": "var(--surface-solid)",
        "surface-translucent": "var(--surface-translucent)",
        "surface-glass": "var(--surface-glass)",
        "surface-glass-strong": "var(--surface-glass-strong)",
      },
      backdropBlur: {
        glass: "var(--surface-blur-glass)",
        "glass-strong": "var(--surface-blur-strong)",
        subtle: "var(--surface-blur-subtle)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-from-top": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { opacity: "0", transform: "translateX(10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "energy-pulse": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 0 0 oklch(var(--accent) / 0.4)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 0 8px oklch(var(--accent) / 0)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-in",
        "scale-in": "scale-in 0.15s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.2s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.2s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.2s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.2s ease-out",
        "energy-pulse": "energy-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default preset;
