import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // RDS Brand Colors
        rds: {
          // Neon Green (Primary)
          green: {
            DEFAULT: "var(--rds-green)",
            50: "var(--rds-green-50)",
            100: "var(--rds-green-100)",
            200: "var(--rds-green-200)",
            300: "var(--rds-green-300)",
            400: "var(--rds-green-400)",
            500: "var(--rds-green-500)",
            600: "var(--rds-green-600)",
            700: "var(--rds-green-700)",
            800: "var(--rds-green-800)",
            900: "var(--rds-green-900)",
            950: "var(--rds-green-950)",
          },
          // Yellow (Energy)
          yellow: {
            DEFAULT: "var(--rds-yellow)",
            50: "var(--rds-yellow-50)",
            100: "var(--rds-yellow-100)",
            200: "var(--rds-yellow-200)",
            300: "var(--rds-yellow-300)",
            400: "var(--rds-yellow-400)",
            500: "var(--rds-yellow-500)",
            600: "var(--rds-yellow-600)",
            700: "var(--rds-yellow-700)",
            800: "var(--rds-yellow-800)",
            900: "var(--rds-yellow-900)",
          },
          // Orange (Warning)
          orange: {
            DEFAULT: "var(--rds-orange)",
            50: "var(--rds-orange-50)",
            100: "var(--rds-orange-100)",
            200: "var(--rds-orange-200)",
            300: "var(--rds-orange-300)",
            400: "var(--rds-orange-400)",
            500: "var(--rds-orange-500)",
            600: "var(--rds-orange-600)",
            700: "var(--rds-orange-700)",
            800: "var(--rds-orange-800)",
            900: "var(--rds-orange-900)",
          },
          // Red (Error/Destructive)
          red: {
            DEFAULT: "var(--rds-red)",
            50: "var(--rds-red-50)",
            100: "var(--rds-red-100)",
            200: "var(--rds-red-200)",
            300: "var(--rds-red-300)",
            400: "var(--rds-red-400)",
            500: "var(--rds-red-500)",
            600: "var(--rds-red-600)",
            700: "var(--rds-red-700)",
            800: "var(--rds-red-800)",
            900: "var(--rds-red-900)",
          },
          // Teal (Energetic Teal)
          teal: {
            DEFAULT: "var(--rds-teal)",
            50: "var(--rds-teal-50)",
            100: "var(--rds-teal-100)",
            200: "var(--rds-teal-200)",
            300: "var(--rds-teal-300)",
            400: "var(--rds-teal-400)",
            500: "var(--rds-teal-500)",
            600: "var(--rds-teal-600)",
            700: "var(--rds-teal-700)",
            800: "var(--rds-teal-800)",
            900: "var(--rds-teal-900)",
            950: "var(--rds-teal-950)",
          },
          // Navy (Deep Blue)
          navy: {
            DEFAULT: "var(--rds-navy)",
            50: "var(--rds-navy-50)",
            100: "var(--rds-navy-100)",
            200: "var(--rds-navy-200)",
            300: "var(--rds-navy-300)",
            400: "var(--rds-navy-400)",
            500: "var(--rds-navy-500)",
            600: "var(--rds-navy-600)",
            700: "var(--rds-navy-700)",
            800: "var(--rds-navy-800)",
            900: "var(--rds-navy-900)",
          },
          // Blue (Info)
          blue: {
            DEFAULT: "var(--rds-blue)",
            50: "var(--rds-blue-50)",
            100: "var(--rds-blue-100)",
            200: "var(--rds-blue-200)",
            300: "var(--rds-blue-300)",
            400: "var(--rds-blue-400)",
            500: "var(--rds-blue-500)",
            600: "var(--rds-blue-600)",
            700: "var(--rds-blue-700)",
            800: "var(--rds-blue-800)",
            900: "var(--rds-blue-900)",
          },
          // Gray Scale
          gray: {
            50: "var(--rds-gray-50)",
            100: "var(--rds-gray-100)",
            200: "var(--rds-gray-200)",
            300: "var(--rds-gray-300)",
            400: "var(--rds-gray-400)",
            500: "var(--rds-gray-500)",
            600: "var(--rds-gray-600)",
            700: "var(--rds-gray-700)",
            800: "var(--rds-gray-800)",
            900: "var(--rds-gray-900)",
            950: "var(--rds-gray-950)",
          },
          black: "var(--rds-black)",
          white: "var(--rds-white)",
        },
        // ShadCN semantic colors mapped to RDS OKLCH tokens.
        // CSS vars hold bare "L C H" triplets; Tailwind wraps them with
        // oklch(…) and substitutes <alpha-value> for opacity shortcuts
        // (e.g. bg-primary/50 → oklch(var(--primary) / 0.5)).
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
        // Ramp semantic extras — same OKLCH wrapping pattern.
        success: "oklch(var(--success) / <alpha-value>)",
        warning: "oklch(var(--warning) / <alpha-value>)",
        info: "oklch(var(--info) / <alpha-value>)",
        highlight: "oklch(var(--highlight) / <alpha-value>)",
        // Chart series palette — derived from theme hues by the generator.
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
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
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

export default config;
