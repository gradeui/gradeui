/**
 * GENERATED FILE — do not edit.
 *
 * Derived from styles/tokens.css by scripts/generate-tokens.mjs.
 * Edit the CSS (the authored source of truth), then run
 * `pnpm -F @gradeui/core generate`.
 */

/* eslint-disable */

import type { ColorRamp, SemanticAlias } from "./types";

/** Brand color ramps (--gds-<name>-<step>), keyed by ramp name. */
export const GDS_COLOR_RAMPS = {
  "green": {
    "steps": {
      "50": "#ecfff5",
      "100": "#d1ffea",
      "200": "#a6ffd6",
      "300": "#6affbd",
      "400": "#2bff9e",
      "500": "#00FF84",
      "600": "#00cc6a",
      "700": "#009950",
      "800": "#007a40",
      "900": "#006636",
      "950": "#00331b"
    },
    "base": "#00FF84",
    "primaryStep": 500,
    "note": "Primary brand green"
  },
  "yellow": {
    "steps": {
      "50": "#fffce8",
      "100": "#fff8c2",
      "200": "#fff089",
      "300": "#ffe545",
      "400": "#FFD500",
      "500": "#e6c000",
      "600": "#cc9f00",
      "700": "#a37700",
      "800": "#865c00",
      "900": "#704b00"
    },
    "base": "#FFD500",
    "primaryStep": 400,
    "note": "Primary energy yellow"
  },
  "orange": {
    "steps": {
      "50": "#fff5eb",
      "100": "#ffe6cc",
      "200": "#ffc999",
      "300": "#ffa866",
      "400": "#ff8533",
      "500": "#FF6B00",
      "600": "#cc5600",
      "700": "#994000",
      "800": "#662b00",
      "900": "#4d2000"
    },
    "base": "#FF6B00",
    "primaryStep": 500,
    "note": "Primary orange"
  },
  "red": {
    "steps": {
      "50": "#fff0f0",
      "100": "#ffd9d9",
      "200": "#ffb3b3",
      "300": "#ff8080",
      "400": "#ff4d4d",
      "500": "#FF0D0D",
      "600": "#cc0a0a",
      "700": "#990808",
      "800": "#660505",
      "900": "#4d0404"
    },
    "base": "#FF0D0D",
    "primaryStep": 500,
    "note": "Primary red"
  },
  "teal": {
    "steps": {
      "50": "#ecfeff",
      "100": "#cffafe",
      "200": "#a5f3fc",
      "300": "#67e8f9",
      "400": "#22d3ee",
      "500": "#14b8a6",
      "600": "#0D7377",
      "700": "#0a5c5f",
      "800": "#084547",
      "900": "#052e2f",
      "950": "#021717"
    },
    "base": "#0D7377",
    "primaryStep": 600,
    "note": "Primary energetic teal"
  },
  "navy": {
    "steps": {
      "50": "#f0f5fa",
      "100": "#d9e4f0",
      "200": "#b3c9e0",
      "300": "#8daed1",
      "400": "#5c8bc2",
      "500": "#3a6ca3",
      "600": "#1E3A5F",
      "700": "#182e4c",
      "800": "#122339",
      "900": "#0c1726"
    },
    "base": "#1E3A5F",
    "primaryStep": 600,
    "note": "Primary navy"
  },
  "blue": {
    "steps": {
      "50": "#e8f4fd",
      "100": "#c5e3fa",
      "200": "#90c9f6",
      "300": "#5bb0f1",
      "400": "#2196F3",
      "500": "#1976d2",
      "600": "#1565c0",
      "700": "#0d47a1",
      "800": "#0a3880",
      "900": "#072960"
    },
    "base": "#2196F3",
    "primaryStep": 400,
    "note": "Primary blue"
  }
} as const satisfies Record<string, ColorRamp>;

/** Neutral scale: black / white poles + the gray ramp. */
export const GDS_NEUTRALS = {
  "gray": {
    "50": "#fafafa",
    "100": "#f1f1f1",
    "200": "#e5e5e5",
    "300": "#d4d4d4",
    "400": "#a3a3a3",
    "500": "#737373",
    "600": "#525252",
    "700": "#3d3d3d",
    "800": "#262626",
    "900": "#171717",
    "950": "#0a0a0a"
  },
  "black": "#000000",
  "white": "#ffffff"
} as const;

/** Semantic aliases (--gds-success …) pointing into the ramps. */
export const GDS_SEMANTIC_ALIASES = {
  "primary": {
    "ramp": "green",
    "step": 500
  },
  "secondary": {
    "ramp": "teal",
    "step": 600
  },
  "neutral": {
    "ramp": "gray",
    "step": 500
  },
  "success": {
    "ramp": "green",
    "step": 600
  },
  "warning": {
    "ramp": "orange",
    "step": 500
  },
  "error": {
    "ramp": "red",
    "step": 500
  },
  "info": {
    "ramp": "blue",
    "step": 400
  }
} as const satisfies Record<string, SemanticAlias>;

/** Spacing scale (--gds-space-<n>). */
export const GDS_SPACING = {
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "0.75rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "8": "2rem",
  "10": "2.5rem",
  "12": "3rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem"
} as const;

/** Border radii (--gds-radius-<k>). */
export const GDS_RADIUS = {
  "sm": "0.25rem",
  "md": "0.5rem",
  "lg": "0.75rem",
  "xl": "1rem",
  "2xl": "1.5rem",
  "full": "9999px"
} as const;

/** Font stacks (--font-<k>). */
export const GDS_FONT_FAMILIES = {
  "sans": "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  "mono": "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  "display": "var(--font-sans)",
  "body": "var(--font-sans)"
} as const;

/** Type scale (--text-<k>), raw values incl. -line / -tracking entries. */
export const GDS_TYPE_SCALE = {
  "display": "3.75rem",
  "display-line": "1.1",
  "display-tracking": "-0.02em",
  "h1": "2.5rem",
  "h1-line": "1.2",
  "h1-tracking": "-0.02em",
  "h2": "2rem",
  "h2-line": "1.25",
  "h2-tracking": "-0.01em",
  "h3": "1.5rem",
  "h3-line": "1.3",
  "h3-tracking": "-0.01em",
  "h4": "1.25rem",
  "h4-line": "1.4",
  "h4-tracking": "0",
  "h5": "1.125rem",
  "h5-line": "1.4",
  "h5-tracking": "0",
  "h6": "1rem",
  "h6-line": "1.5",
  "h6-tracking": "0",
  "body-lg": "1.125rem",
  "body": "1rem",
  "body-sm": "0.875rem",
  "body-line": "1.6",
  "label-lg": "0.875rem",
  "label": "0.75rem",
  "label-line": "1.4",
  "label-tracking": "0.01em",
  "caption": "0.75rem",
  "caption-line": "1.4",
  "overline": "0.75rem",
  "overline-tracking": "0.1em"
} as const;

/** Ramp names in authored order. */
export const GDS_RAMP_NAMES = [
  "green",
  "yellow",
  "orange",
  "red",
  "teal",
  "navy",
  "blue"
] as const;
