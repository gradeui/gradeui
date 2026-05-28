"use client";

import { useMaybeGradeTheme } from "@/components/grade-theme-provider";
import { GradeModeSwitcher } from "@/components/grade-mode-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Palette } from "lucide-react";

export default function ThemingPage() {
  const ramp = useMaybeGradeTheme();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Theming
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Every theme in Grade DS — built-in or user-built — flows through a
          single generator that turns three hues plus a handful of presets
          into a complete OKLCH-based design language.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <p className="leading-7">
          A theme is defined by a compact{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">ThemeInput</code>{" "}
          — three hues (neutral, primary, accent) and a handful of
          typography, spacing, radius, and effects presets. The generator
          composes three 11-stop <strong>OKLCH</strong> ramps, derives
          semantic tokens, and resolves everything else into concrete CSS
          values. <code className="bg-muted px-1 py-0.5 rounded text-sm">GradeThemeProvider</code>{" "}
          applies that output to <code className="bg-muted px-1 py-0.5 rounded text-sm">:root</code>{" "}
          at runtime — every component re-skins without a single line of
          component code changing.
        </p>
        <p className="leading-7 text-muted-foreground">
          OKLCH is perceptually uniform: the same lightness value <em>looks</em>{" "}
          equally light across every hue (HSL doesn&apos;t do this). That
          makes generated ramps feel cohesive no matter which hue you pick.
        </p>
      </section>

      {/* Modes */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Light and dark
        </h2>
        <p className="leading-7">
          Grade DS ships its own mode system — no{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">next-themes</code>{" "}
          dependency. The user-facing choice is a binary light / dark toggle.
          Internally, the generator produces four brightness tiers —
          <code className="bg-muted px-1 py-0.5 rounded text-sm">superLight</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">light</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">dark</code>,{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">superDark</code>{" "}
          — so surfaces stacked on top of each other (card on background, popover
          on card) can step through tiers to establish visual hierarchy.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Binary toggle (what users see)
            </div>
            <ThemeToggle />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Full 4-way (used internally; exposed in the builder)
            </div>
            <GradeModeSwitcher />
          </div>
        </div>
        <p className="leading-7 text-sm text-muted-foreground">
          First paint is handled by a pre-hydration inline script in{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">app/layout.tsx</code>{" "}
          that reads localStorage or{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            prefers-color-scheme
          </code>{" "}
          and applies the <code className="bg-muted px-1 py-0.5 rounded text-sm">.dark</code>{" "}
          class before React hydrates — no FOUC.
        </p>
      </section>

      {/* Active theme preview */}
      {ramp && (
        <section className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
            Active theme
          </h2>
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{ramp.theme.name}</div>
              <div className="text-sm text-muted-foreground">
                {ramp.theme.description}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {(["neutral", "primary", "accent"] as const).map((rampName) => (
              <div key={rampName}>
                <div className="text-xs text-muted-foreground mb-1 capitalize">
                  {rampName} — hue {ramp.theme.input.hues[rampName]}°
                </div>
                <div className="flex overflow-hidden rounded-md border border-border">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                    (step) => (
                      <div
                        key={step}
                        className="flex-1 h-10 relative group cursor-help"
                        style={{
                          background: `oklch(${
                            ramp.theme.ramps[rampName][step as 50]
                          })`,
                        }}
                        title={`${rampName} ${step}: oklch(${
                          ramp.theme.ramps[rampName][step as 50]
                        })`}
                      >
                        <span className="absolute inset-x-0 bottom-0 text-[9px] text-center opacity-0 group-hover:opacity-100 bg-background/80 text-foreground">
                          {step}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Hover each swatch for the raw OKLCH triplet. Swap themes from the
            palette icon in the top nav to see all three ramps change live.
          </p>
        </section>
      )}

      {/* ThemeInput shape */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Defining a theme
        </h2>
        <p className="leading-7">
          A complete theme fits in a small object. The generator does
          everything else.
        </p>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre>
            <code>{`import type { ThemeInput } from "@gradeui/ui";

export const myTheme: ThemeInput = {
  id: "my-theme",
  name: "My Theme",
  description: "A custom look",
  hues: {
    neutral: 220,   // 0–360°
    primary: 260,
    accent: 340,
  },
  chroma: {
    neutral: 0.08,  // 0–1 multiplier; low = subtle gray tint
    primary: 1.0,   // 1 = default vibrance
    accent: 1.0,
  },
  typography: {
    display: "instrumentSerif",
    body: "plusJakarta",
    mono: "jetbrainsMono",
    scale: "default",        // "compact" | "default" | "spacious"
  },
  spacing: { density: "default" },   // "tight" | "default" | "roomy"
  radius: { style: "soft" },         // "sharp" | "subtle" | "soft" | "round" | "pill"
  effects: {
    shadows: "default",               // "none" | "subtle" | "default" | "dramatic"
    motionIntensity: 1,               // 0 = instant, 2 = luxurious
  },
  components: {
    buttonShape: "default",           // "default" | "pill" | "square"
    inputStyle: "outlined",
    cardStyle: "flat",                // "flat" | "outlined" | "elevated" | "glass"
  },
};`}</code>
          </pre>
        </div>
        <p className="leading-7">
          Activate it via the{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">useGradeTheme()</code>{" "}
          hook — it persists to{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">localStorage</code>{" "}
          and appears in the theme switcher automatically.
        </p>
      </section>

      {/* useGradeTheme hook */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          The useGradeTheme hook
        </h2>
        <p className="leading-7">
          Read and mutate the active theme + mode from any client component.
        </p>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre>
            <code>{`"use client";
import { useGradeTheme } from "@gradeui/ui";

export function ThemeToolbar() {
  const {
    theme,          // GeneratedTheme — active theme with resolved ramps
    themeId,        // string
    mode,           // "superLight" | "light" | "dark" | "superDark"
    isDark,         // boolean — convenience for binary UIs
    setThemeId,     // (id) => void — persists
    setMode,        // (mode) => void — persists
    themes,         // GeneratedTheme[] — all built-ins + user themes
    saveAndActivate,// (ThemeInput) => void — save + activate in one step
    deleteTheme,    // (id) => void — no-op on built-ins
  } = useGradeTheme();

  return (
    <div>
      <p>Current: {theme.name} ({mode})</p>
      {themes.map(t => (
        <button key={t.id} onClick={() => setThemeId(t.id)}>
          {t.name}
        </button>
      ))}
      <button onClick={() => setMode(isDark ? "light" : "dark")}>
        Toggle dark
      </button>
    </div>
  );
}`}</code>
          </pre>
        </div>
      </section>

      {/* CSS tokens */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          OKLCH tokens under the hood
        </h2>
        <p className="leading-7">
          The generator writes every token as a bare{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">L C H</code>{" "}
          triplet. Tailwind wraps each one with{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            oklch(var(--x) / {"<alpha-value>"})
          </code>
          , which keeps opacity shortcuts like{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">bg-primary/50</code>{" "}
          working.
        </p>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre>
            <code>{`:root {
  /* Core semantic tokens — generator output */
  --background: 0.985 0.0012 175;    /* → oklch(0.985 0.0012 175) */
  --foreground: 0.170 0.0032 175;
  --primary:    0.610 0.170  175;
  --muted:      0.955 0.0032 175;
  /* …and so on */

  /* Ramp swatches — exposed for palette previews */
  --ramp-neutral-500: 0.610 0.0136 175;
  --ramp-primary-500: 0.610 0.170  175;
  --ramp-accent-500:  0.610 0.170  175;

  /* Typography, radius, spacing, motion — also generated */
  --font-display: var(--font-sans);
  --radius: 0.5rem;
  --gds-density: 1;
  --gds-transition-base: 200ms;
}

/* Tailwind exposes them as utilities: */
.bg-primary      { background-color: oklch(var(--primary) / 1); }
.bg-primary\\/50 { background-color: oklch(var(--primary) / 0.5); }
.text-foreground { color: oklch(var(--foreground) / 1); }`}</code>
          </pre>
        </div>
      </section>

      {/* Using tokens */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Using theme colors
        </h2>
        <p className="leading-7">
          Use Tailwind utilities with semantic names — they automatically
          resolve to the active theme&apos;s OKLCH values.
        </p>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre>
            <code>{`{/* Semantic — adapts to active theme + mode */}
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="bg-muted text-muted-foreground" />
<div className="bg-accent text-accent-foreground" />

{/* Semantic with opacity */}
<div className="bg-primary/10 hover:bg-primary/20" />
<div className="border-border/50" />

{/* Fixed semantic colors (not hue-derived, for accessibility) */}
<div className="bg-success" />
<div className="bg-destructive" />
<div className="bg-warning" />
<div className="bg-info" />
<div className="bg-highlight" />`}</code>
          </pre>
        </div>
      </section>

      {/* Provider setup */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Setting up in a consuming app
        </h2>
        <p className="leading-7">
          One provider, one inline script — no{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">next-themes</code>,{" "}
          no extra wrappers.
        </p>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre>
            <code>{`// app/layout.tsx
import {
  GradeThemeProvider,
  GRADE_PRE_HYDRATION_SCRIPT,
} from "@gradeui/ui";
import "@gradeui/ui/styles.css";  // MUST be imported first

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-FOUC inline script — reads localStorage + system preference */}
        <script
          dangerouslySetInnerHTML={{ __html: GRADE_PRE_HYDRATION_SCRIPT }}
        />
      </head>
      <body>
        <GradeThemeProvider>
          {children}
        </GradeThemeProvider>
      </body>
    </html>
  );
}`}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}
