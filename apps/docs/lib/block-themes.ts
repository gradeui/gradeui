/**
 * Content Block Theming System
 *
 * Extends the existing shadcn/RDS theming with 5 curated theme presets
 * for content blocks. Each theme overrides specific CSS variables while
 * maintaining compatibility with the base design system.
 *
 * Inspired by Tailwind CSS Oatmeal kit's approach:
 * - Named, semantic palettes (not generic primary/secondary)
 * - Curated font pairings
 * - Pre-designed themes that work out of the box
 */

export interface BlockTheme {
  id: string;
  name: string;
  description: string;
  cssVariables: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  fonts: {
    headings: string; // Font for titles/headings in blocks
    body: string; // Font for body text/descriptions
  };
}

/**
 * Theme 1: "Default" - Uses existing RDS theming
 * Clean, tech-focused with teal primary
 */
export const defaultTheme: BlockTheme = {
  id: "default",
  name: "Default",
  description: "Clean and professional with RDS teal",
  cssVariables: {
    light: {
      // Uses existing values from globals.css
    },
    dark: {
      // Uses existing values from globals.css
    },
  },
  fonts: {
    headings: "var(--font-sans)", // Satoshi
    body: "var(--font-sans)", // Satoshi
  },
};

/**
 * Theme 2: "Olive" - Warm, natural, earthy
 * Perfect for: Sustainability, wellness, organic brands
 */
export const oliveTheme: BlockTheme = {
  id: "olive",
  name: "Olive",
  description: "Warm and natural with earthy tones",
  cssVariables: {
    light: {
      "--primary": "85 30% 35%", // Olive green
      "--primary-foreground": "48 20% 97%",
      "--secondary": "40 35% 88%", // Warm sand
      "--secondary-foreground": "30 15% 20%",
      "--accent": "35 80% 55%", // Warm orange accent
      "--accent-foreground": "48 20% 97%",
      "--muted": "48 20% 92%",
      "--muted-foreground": "30 10% 45%",
      "--border": "48 15% 85%",
    },
    dark: {
      "--primary": "85 35% 50%", // Brighter olive for dark
      "--primary-foreground": "0 0% 0%",
      "--secondary": "40 20% 20%",
      "--secondary-foreground": "40 30% 90%",
      "--accent": "35 80% 60%",
      "--accent-foreground": "0 0% 0%",
      "--muted": "40 15% 15%",
      "--muted-foreground": "40 10% 60%",
      "--border": "40 15% 22%",
    },
  },
  fonts: {
    headings: "'Fraunces', serif", // Editorial serif for warmth
    body: "var(--font-sans)",
  },
};

/**
 * Theme 3: "Midnight" - Dark, sophisticated, modern
 * Perfect for: Creative agencies, tech startups, portfolios
 */
export const midnightTheme: BlockTheme = {
  id: "midnight",
  name: "Midnight",
  description: "Bold and sophisticated with vibrant accents",
  cssVariables: {
    light: {
      "--primary": "260 85% 55%", // Purple
      "--primary-foreground": "0 0% 100%",
      "--secondary": "230 10% 92%",
      "--secondary-foreground": "230 15% 20%",
      "--accent": "340 80% 55%", // Pink accent
      "--accent-foreground": "0 0% 100%",
      "--muted": "230 10% 95%",
      "--muted-foreground": "230 10% 45%",
      "--border": "230 10% 88%",
    },
    dark: {
      "--primary": "260 85% 65%", // Brighter purple
      "--primary-foreground": "0 0% 0%",
      "--secondary": "230 10% 22%",
      "--secondary-foreground": "0 0% 95%",
      "--accent": "340 80% 60%",
      "--accent-foreground": "0 0% 100%",
      "--muted": "230 10% 18%",
      "--muted-foreground": "0 0% 65%",
      "--border": "230 10% 25%",
    },
  },
  fonts: {
    headings: "'Space Grotesk', system-ui, sans-serif",
    body: "var(--font-sans)",
  },
};

/**
 * Theme 4: "Ocean" - Fresh, trustworthy, professional
 * Perfect for: Finance, healthcare, education, enterprise
 */
export const oceanTheme: BlockTheme = {
  id: "ocean",
  name: "Ocean",
  description: "Fresh and trustworthy with professional blues",
  cssVariables: {
    light: {
      "--primary": "210 85% 48%", // Deep blue
      "--primary-foreground": "0 0% 100%",
      "--secondary": "195 65% 92%",
      "--secondary-foreground": "215 25% 15%",
      "--accent": "180 70% 45%", // Cyan
      "--accent-foreground": "0 0% 100%",
      "--muted": "210 20% 94%",
      "--muted-foreground": "215 15% 45%",
      "--border": "210 20% 88%",
    },
    dark: {
      "--primary": "210 85% 58%", // Lighter blue
      "--primary-foreground": "0 0% 0%",
      "--secondary": "210 25% 20%",
      "--secondary-foreground": "210 20% 90%",
      "--accent": "180 70% 50%",
      "--accent-foreground": "0 0% 0%",
      "--muted": "210 20% 16%",
      "--muted-foreground": "210 15% 60%",
      "--border": "210 20% 24%",
    },
  },
  fonts: {
    headings: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
};

/**
 * Theme 5: "Sunset" - Bold, energetic, playful
 * Perfect for: Consumer apps, entertainment, lifestyle brands
 */
export const sunsetTheme: BlockTheme = {
  id: "sunset",
  name: "Sunset",
  description: "Bold and energetic with vibrant gradients",
  cssVariables: {
    light: {
      "--primary": "15 85% 55%", // Coral/orange
      "--primary-foreground": "0 0% 100%",
      "--secondary": "340 75% 95%",
      "--secondary-foreground": "10 20% 15%",
      "--accent": "280 70% 60%", // Purple accent
      "--accent-foreground": "0 0% 100%",
      "--muted": "30 30% 94%",
      "--muted-foreground": "10 15% 45%",
      "--border": "30 25% 90%",
    },
    dark: {
      "--primary": "15 85% 60%",
      "--primary-foreground": "0 0% 0%",
      "--secondary": "15 30% 20%",
      "--secondary-foreground": "15 25% 90%",
      "--accent": "280 70% 65%",
      "--accent-foreground": "0 0% 100%",
      "--muted": "15 20% 16%",
      "--muted-foreground": "15 15% 60%",
      "--border": "15 20% 24%",
    },
  },
  fonts: {
    headings: "'Outfit', system-ui, sans-serif",
    body: "var(--font-sans)",
  },
};

/**
 * All available themes
 */
export const blockThemes = {
  default: defaultTheme,
  olive: oliveTheme,
  midnight: midnightTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
} as const;

export type BlockThemeId = keyof typeof blockThemes;

/**
 * Get theme by ID
 */
export function getBlockTheme(id: BlockThemeId): BlockTheme {
  return blockThemes[id];
}

/**
 * Get all theme options for selectors
 */
export function getBlockThemeOptions() {
  return Object.values(blockThemes).map((theme) => ({
    value: theme.id,
    label: theme.name,
    description: theme.description,
  }));
}

/**
 * Apply theme CSS variables to an element
 *
 * @param theme - The theme to apply
 * @param isDark - Whether dark mode is active
 * @returns Object of CSS custom properties
 */
export function applyBlockTheme(
  theme: BlockTheme,
  isDark: boolean = false
): React.CSSProperties {
  const vars = isDark ? theme.cssVariables.dark : theme.cssVariables.light;

  return {
    ...vars,
    "--block-font-heading": theme.fonts.headings,
    "--block-font-body": theme.fonts.body,
  } as React.CSSProperties;
}

/**
 * Generate a style tag with theme CSS for use in isolated contexts
 * (like Sandpack previews or iframes)
 */
export function generateThemeStyleTag(
  theme: BlockTheme,
  includeGoogleFonts: boolean = true
): string {
  const googleFonts = includeGoogleFonts
    ? `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
  `
    : "";

  const lightVars = Object.entries(theme.cssVariables.light)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  const darkVars = Object.entries(theme.cssVariables.dark)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  return `
${googleFonts}
:root {
${lightVars}
  --block-font-heading: ${theme.fonts.headings};
  --block-font-body: ${theme.fonts.body};
}

.dark {
${darkVars}
}
  `.trim();
}
