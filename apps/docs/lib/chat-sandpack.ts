/**
 * Shared Sandpack helpers for the chat design renderer.
 *
 * Mirrors the setup in app/play/page.tsx so generated components render with
 * the same tokens, fonts, and Tailwind config. Kept as plain strings / pure
 * functions so this module can be imported from a server component too (no
 * React/browser APIs).
 *
 * If you change /play's Sandpack config, also update these helpers so the
 * chat preview stays in sync.
 */

import { themeToCSSVars, type GeneratedTheme } from "@/lib/themes";

// ─────────────────────────────────────────────────────────────────────
// Snippet preparation
// ─────────────────────────────────────────────────────────────────────

/**
 * Heuristic: a "complete enough to render" JSX block ends with a closing
 * `}` or `)` on its own line. If it doesn't, assume it's still streaming.
 * Shared between DesignPreview (/chat) and StudioPreview (/studio).
 */
export function looksComplete(code: string): boolean {
  const trimmed = code.trimEnd();
  if (!trimmed) return false;
  const last = trimmed[trimmed.length - 1];
  return last === "}" || last === ")";
}

/**
 * Collapse any double-quoted string literal that contains a literal newline
 * into a single-line form. JSX attribute values are not allowed to span
 * lines — if they do, Babel throws "Unterminated string constant" and the
 * preview dies.
 *
 * LLMs occasionally emit wrapped className attributes like:
 *
 *   <div className="flex flex-col items-
 *                   center justify-center">
 *
 * which is invalid syntax. This repair pass re-joins them. We restrict to
 * double-quoted literals so template literals (which legitimately span
 * lines) pass through untouched; character classes `[^"\\]` match newlines
 * inside the class, so the regex naturally bridges the break.
 *
 * Exported so other Sandpack consumers (template viewer, /chat preview) can
 * apply the same defensive pass before handing code to the iframe.
 */
export function repairMultilineStrings(code: string): string {
  return code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, inner: string) => {
    if (!inner.includes("\n")) return match;
    const collapsed = inner.replace(/\s*\n\s*/g, " ").trim();
    return `"${collapsed}"`;
  });
}

/**
 * Collapse every `import { ... } from "./components/ui/<name>"` into a
 * single `import { ... } from "@gradeui/ui"`. The Sandpack iframe no
 * longer mounts hand-rolled copies of those components — it installs the
 * real `@gradeui/ui` from npm — so any legacy snippet that still uses
 * the old local path must be rewritten before the bundler sees it.
 *
 * This runs inside `prepareAppSource`, which means every consumer
 * (studio, chat, play, templates, embedded code editor examples) gets
 * the rewrite for free. Keeps the Sandpack swap decoupled from every
 * page that hand-authored example code against the old rule.
 *
 * Multi-line imports are handled — JSX source frequently wraps:
 *   import {
 *     Card, CardHeader, CardTitle,
 *   } from "./components/ui/card"
 * and the regex would miss it without the `s` flag (dotAll).
 *
 * We DON'T touch `lucide-react`, `recharts`, `@gradeui/ui`, or any other
 * bare specifier. Only the local `./components/ui/<slug>` pattern is
 * rewritten — anything else the model produced is already correct.
 */
export function rewriteLocalComponentImports(code: string): string {
  // `[^}]+?` already matches newlines inside the braces (character
  // classes match any char except the negated one, newlines included),
  // so we don't need the `s` (dotAll) flag — which would only be needed
  // to make `.` span newlines. Sticking with character classes keeps us
  // compatible with tsconfig targets below ES2018.
  //
  // Three shapes need healing:
  //   1. `./components/ui/<name>` — legacy local path (pre-npm-swap).
  //   2. `../components/ui/<name>` — same, one level up.
  //   3. `@gradeui/ui/<subpath>` — LLM literal-translates the new rule
  //      and emits `@gradeui/ui/button`, but package.json only exports
  //      the barrel at `"."`. Subpath imports fail with "Could not find
  //      module in path: '@gradeui/ui/button'". Fold them into the
  //      single barrel import alongside the legacy local matches.
  //
  // All three collapse into one consolidated `import { ... } from
  // "@gradeui/ui"` at the top of the file. Plain `from "@gradeui/ui"`
  // (no subpath) is NOT matched — it's already correct.
  const rx =
    /import\s*\{\s*([^}]+?)\s*\}\s*from\s*["'](?:\.\.?\/components\/ui\/[a-z-]+|@gradeui\/ui\/[a-z-]+)["'];?/g;
  const specifiers = new Set<string>();
  let matched = false;
  const stripped = code.replace(rx, (_m, group: string) => {
    matched = true;
    for (const raw of group.split(",")) {
      const name = raw.trim();
      if (name) specifiers.add(name);
    }
    // Replace each matched import with an empty string — stripped.trimStart
    // below cleans up the leading whitespace before we prepend the merged
    // import.
    return "";
  });
  if (!matched) return code;
  const merged = `import { ${Array.from(specifiers).join(", ")} } from "@gradeui/ui";\n`;
  return merged + stripped.trimStart();
}

/**
 * Make sure the snippet exports a default React component so Sandpack's
 *   import App from "./App"
 * resolves to something callable. The model emits any of these shapes:
 *
 *   1. A proper module with `export default` — pass through.
 *   2. A bare JSX expression (`<Card>…</Card>`) — wrap in an App component.
 *   3. A named `function Foo(...)` without the default export — append one.
 *   4. Anything else — append `export default App` as a last-ditch guess.
 *
 * Also applies `repairMultilineStrings` to defuse the classic LLM bug of
 * wrapping long className attributes across lines, and
 * `rewriteLocalComponentImports` so legacy `./components/ui/<name>`
 * paths resolve to the real `@gradeui/ui` npm package. Without those
 * passes the iframe throws:
 *   "Element type is invalid … got: undefined. You likely forgot to export
 *    your component from the file it's defined in …"
 * or the worse
 *   "Unterminated string constant"
 * which Sandpack in turn rethrows as "Cannot assign to read only property
 * 'message' of SyntaxError" when it tries to prettify the error.
 */
export function prepareAppSource(code: string): string {
  const rewritten = rewriteLocalComponentImports(code);
  const repaired = repairMultilineStrings(rewritten);
  const trimmed = repaired.trim();
  if (!trimmed) return `export default function App() { return null }`;

  // Already a proper module — leave alone.
  if (/export\s+default\s+/.test(trimmed)) return trimmed;

  // Bare JSX expression — wrap it in a component.
  if (trimmed.startsWith("<")) {
    return `export default function App() {\n  return (\n${trimmed
      .split("\n")
      .map((l) => "    " + l)
      .join("\n")}\n  )\n}`;
  }

  // Named function — append default export.
  const fnMatch = trimmed.match(/function\s+([A-Z][A-Za-z0-9_]*)/);
  if (fnMatch) {
    return `${trimmed}\n\nexport default ${fnMatch[1]}`;
  }

  // Fallback: wrap whatever we got.
  return `${trimmed}\n\nexport default App`;
}

// ─────────────────────────────────────────────────────────────────────
// Fonts + Sandpack external resources
//
// Everything that mounts a SandpackProvider — /studio's StudioPreview,
// /chat's DesignPreview, /play's Sandpack iframe, the inline code editor,
// the template viewer — MUST consume PLAYGROUND_EXTERNAL_RESOURCES as its
// `externalResources` option. Hand-rolling a literal array per-site is how
// we ended up with Tailwind CDN in every iframe but Google Fonts in none.
//
// The Google Fonts `<link>` tag we emit inside /public/index.html is not a
// reliable substitute — Sandpack's iframe sandbox / CSP strips or ignores
// arbitrary stylesheet links in the host HTML, whereas anything listed in
// `externalResources` is injected via the bundler's trusted path.
// ─────────────────────────────────────────────────────────────────────

export const PLAYGROUND_TAILWIND_CDN = "https://cdn.tailwindcss.com";

export const PLAYGROUND_FONTS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Geist:wght@100..900" +
  "&family=Geist+Mono:wght@100..900" +
  "&family=Fraunces:ital,wght@0,100..900;1,100..900" +
  "&family=Instrument+Serif:ital@0;1" +
  "&family=Source+Serif+4:ital,wght@0,200..900;1,200..900" +
  "&family=Inter:wght@100..900" +
  "&family=Manrope:wght@200..800" +
  "&family=Figtree:wght@300..900" +
  "&family=DM+Sans:ital,wght@0,100..1000;1,100..1000" +
  "&family=Lexend:wght@100..900" +
  "&family=Outfit:wght@100..900" +
  "&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800" +
  "&family=Space+Grotesk:wght@300..700" +
  "&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800" +
  "&family=IBM+Plex+Mono:wght@400;500;600" +
  "&display=swap";

export const PLAYGROUND_FONT_VARS = `
        --font-geist: "Geist", "Geist Fallback", system-ui, sans-serif;
        --font-jetbrains-mono: "JetBrains Mono", ui-monospace, monospace;
        --font-geist-mono: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
        --font-inter: "Inter", system-ui, sans-serif;
        --font-manrope: "Manrope", system-ui, sans-serif;
        --font-figtree: "Figtree", system-ui, sans-serif;
        --font-dm-sans: "DM Sans", system-ui, sans-serif;
        --font-lexend: "Lexend", system-ui, sans-serif;
        --font-outfit: "Outfit", system-ui, sans-serif;
        --font-plus-jakarta: "Plus Jakarta Sans", system-ui, sans-serif;
        --font-space-grotesk: "Space Grotesk", system-ui, sans-serif;
        --font-fraunces: "Fraunces", Georgia, serif;
        --font-instrument-serif: "Instrument Serif", Georgia, serif;
        --font-source-serif: "Source Serif 4", Georgia, serif;
        --font-ibm-plex-mono: "IBM Plex Mono", ui-monospace, monospace;`;

/**
 * The definitive list of external resources every Grade Sandpack iframe
 * must pull in. Keep this the single source of truth — if you need
 * another CDN script or stylesheet in the preview, add it here and every
 * consumer picks it up for free.
 */
export const PLAYGROUND_EXTERNAL_RESOURCES: readonly string[] = [
  PLAYGROUND_TAILWIND_CDN,
  PLAYGROUND_FONTS_URL,
];

/**
 * The Sandpack `customSetup.dependencies` map every Grade preview uses.
 * Every consumer (play, studio, design chat, code editor, template viewer)
 * should pass this instead of hand-writing the map — otherwise a future
 * dependency bump has to chase five sites.
 *
 * `@gradeui/ui` is the ACTUAL published design system. Pulling it in
 * from npm (rather than shipping hand-simplified copies of Button/Input/
 * Checkbox etc.) is the only way to guarantee 1:1 parity with what a
 * consumer sees — if the Sandpack preview renders something different
 * from the real package, we're lying to the user about how their theme
 * will look.
 *
 * The other entries are kept so user JSX that imports them directly
 * (e.g. `import { Mail } from "lucide-react"`, `import { cn } from
 * "tailwind-merge"`) still resolves. `recharts` is pinned for chart
 * generation. `react` + `react-dom` are provided by the Sandpack
 * template so they don't go here.
 *
 * `latest` for @gradeui/ui picks up the most recent published version
 * automatically — CI-driven publishes flow straight through. Pin to an
 * exact version when debugging a breaking change.
 */
export const PLAYGROUND_DEPENDENCIES: Readonly<Record<string, string>> = {
  "@gradeui/ui": "latest",
  "class-variance-authority": "^0.7.0",
  clsx: "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "lucide-react": "^0.300.0",
  recharts: "^2.12.0",
};

// ─────────────────────────────────────────────────────────────────────
// Theme vars
// ─────────────────────────────────────────────────────────────────────

export function formatThemeVars(
  theme: GeneratedTheme,
  mode: "light" | "dark"
): string {
  const vars = themeToCSSVars(theme, mode);
  return Object.entries(vars)
    .map(([key, value]) => `        ${key}: ${value};`)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// HTML / CSS builders
// ─────────────────────────────────────────────────────────────────────

export function buildPlaygroundIndexHtml(
  lightVars: string,
  darkVars: string,
  mode: "light" | "dark",
  components: { buttonShape: string; inputStyle: string; cardStyle: string }
): string {
  const htmlClass = mode === "dark" ? ' class="dark"' : "";
  const dataAttrs = ` data-button-shape="${components.buttonShape}" data-input-style="${components.inputStyle}" data-card-style="${components.cardStyle}"`;
  return `<!DOCTYPE html>
<html lang="en"${htmlClass}${dataAttrs}>
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${PLAYGROUND_FONTS_URL}">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grade DS Chat Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
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
              // Status colors expose -soft (surface) + -deep (text/icon)
              // siblings. Keep these in sync with tailwind-preset.ts.
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
            },
            borderRadius: {
              lg: "var(--radius)",
              md: "calc(var(--radius) - 2px)",
              sm: "calc(var(--radius) - 4px)",
            },
          },
        },
      }
    </script>
    <style>
      :root {
${PLAYGROUND_FONT_VARS}
${lightVars}
      }
      .dark {
${darkVars}
      }
      * { border-color: oklch(var(--border)); }
      body {
        background-color: oklch(var(--background));
        color: oklch(var(--foreground));
        font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
        margin: 0;
      }
      /* Form controls don't inherit font-family from body by default — every
         browser's user-agent stylesheet plants its own. Without this reset
         <Button>, <Input>, <Select>, <Textarea> render in the system font
         while the rest of the page obeys --font-sans. Mirrors Tailwind's
         preflight, but explicit so we don't rely on CDN preflight timing. */
      button, input, optgroup, select, textarea {
        font-family: inherit;
        font-feature-settings: inherit;
        font-variation-settings: inherit;
        font-size: 100%;
        font-weight: inherit;
        line-height: inherit;
        color: inherit;
      }
      h1, h2, h3, h4 {
        font-family: var(--font-display, var(--font-sans));
        font-weight: var(--font-heading-weight, 600);
        letter-spacing: var(--font-heading-tracking, -0.01em);
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

export function buildPlaygroundStylesCss(lightVars: string, darkVars: string): string {
  return `:root {
${PLAYGROUND_FONT_VARS}
${lightVars}
}

.dark {
${darkVars}
}

*, *::before, *::after {
  box-sizing: border-box;
  border-color: oklch(var(--border));
}

body {
  background-color: oklch(var(--background));
  color: oklch(var(--foreground));
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  margin: 0;
}

/* Form controls don't inherit font-family from body by default — every
   browser's user-agent stylesheet plants its own. Without this reset
   <Button>, <Input>, <Select>, <Textarea> render in the system font
   while the rest of the page obeys --font-sans. */
button, input, optgroup, select, textarea {
  font-family: inherit;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
}

/* Utility fallbacks for components that ship semantic classnames. Tailwind
   CDN's JIT scanner misses classes built at runtime by cva() (Alert, Badge
   etc. all do this), so we hand-author the rules those variants reach for.
   Without these the iframe renders colourless surfaces even though the CSS
   vars + tailwind.config.extend.colors are both in place. */
.bg-primary { background-color: oklch(var(--primary)); }
.bg-primary\\/90 { background-color: oklch(var(--primary) / 0.9); }
.bg-primary\\/80 { background-color: oklch(var(--primary) / 0.8); }
.text-primary { color: oklch(var(--primary)); }
.text-primary-foreground { color: oklch(var(--primary-foreground)); }
.bg-secondary { background-color: oklch(var(--secondary)); }
.text-secondary-foreground { color: oklch(var(--secondary-foreground)); }
.bg-destructive { background-color: oklch(var(--destructive)); }
.text-destructive { color: oklch(var(--destructive)); }
.text-destructive-foreground { color: oklch(var(--destructive-foreground)); }
.bg-muted { background-color: oklch(var(--muted)); }
.text-muted-foreground { color: oklch(var(--muted-foreground)); }
.bg-accent { background-color: oklch(var(--accent)); }
.text-accent-foreground { color: oklch(var(--accent-foreground)); }
.bg-card { background-color: oklch(var(--card)); }
.text-card-foreground { color: oklch(var(--card-foreground)); }
.bg-background { background-color: oklch(var(--background)); }
.text-foreground { color: oklch(var(--foreground)); }
.border-input { border-color: oklch(var(--input)); }
.ring-ring { --tw-ring-color: oklch(var(--ring)); }
.rounded-lg { border-radius: var(--radius); }
.rounded-md { border-radius: calc(var(--radius) - 2px); }
.rounded-sm { border-radius: calc(var(--radius) - 4px); }

/* Status palette — solid + soft (tinted surface) + deep (on-surface text /
   icon) siblings. These back the new Alert variants and any other component
   leaning on deriveAlertPair output. */
.bg-success { background-color: oklch(var(--success)); }
.text-success { color: oklch(var(--success)); }
.bg-success-soft { background-color: oklch(var(--success-soft)); }
.text-success-deep { color: oklch(var(--success-deep)); }
.border-success { border-color: oklch(var(--success)); }
.border-success\\/30 { border-color: oklch(var(--success) / 0.3); }

.bg-warning { background-color: oklch(var(--warning)); }
.text-warning { color: oklch(var(--warning)); }
.bg-warning-soft { background-color: oklch(var(--warning-soft)); }
.text-warning-deep { color: oklch(var(--warning-deep)); }
.border-warning { border-color: oklch(var(--warning)); }
.border-warning\\/30 { border-color: oklch(var(--warning) / 0.3); }

.bg-info { background-color: oklch(var(--info)); }
.text-info { color: oklch(var(--info)); }
.bg-info-soft { background-color: oklch(var(--info-soft)); }
.text-info-deep { color: oklch(var(--info-deep)); }
.border-info { border-color: oklch(var(--info)); }
.border-info\\/30 { border-color: oklch(var(--info) / 0.3); }

.bg-highlight { background-color: oklch(var(--highlight)); }
.text-highlight { color: oklch(var(--highlight)); }
.bg-highlight-soft { background-color: oklch(var(--highlight-soft)); }
.text-highlight-deep { color: oklch(var(--highlight-deep)); }
.border-highlight { border-color: oklch(var(--highlight)); }
.border-highlight\\/30 { border-color: oklch(var(--highlight) / 0.3); }

.bg-destructive-soft { background-color: oklch(var(--destructive-soft)); }
.text-destructive-deep { color: oklch(var(--destructive-deep)); }
.border-destructive\\/30 { border-color: oklch(var(--destructive) / 0.3); }

/* Interactive-state fallbacks — Tailwind CDN's JIT scanner misses classes
   inside cva() template strings (same failure mode as the base-color
   fallbacks above). That's harmless for the initial paint, but it also
   means hover:, focus-visible: and disabled: variants never get generated
   at all, so buttons, inputs, links etc. looked "dead" on interaction.
   Hand-author them here so state transitions honour the theme tokens. */

/* Hover — buttons */
.hover\\:bg-primary\\/90:hover { background-color: oklch(var(--primary) / 0.9); }
.hover\\:bg-primary\\/80:hover { background-color: oklch(var(--primary) / 0.8); }
.hover\\:bg-secondary\\/80:hover { background-color: oklch(var(--secondary) / 0.8); }
.hover\\:bg-destructive\\/90:hover { background-color: oklch(var(--destructive) / 0.9); }
.hover\\:bg-destructive\\/80:hover { background-color: oklch(var(--destructive) / 0.8); }
.hover\\:bg-accent:hover { background-color: oklch(var(--accent)); }
.hover\\:bg-muted\\/50:hover { background-color: oklch(var(--muted) / 0.5); }
.hover\\:text-accent-foreground:hover { color: oklch(var(--accent-foreground)); }
.hover\\:text-foreground:hover { color: oklch(var(--foreground)); }
.hover\\:underline:hover { text-decoration-line: underline; }
.hover\\:opacity-100:hover { opacity: 1; }

/* Focus — simplified to a box-shadow ring. The real Tailwind ring stack
   is a layered set of CSS vars (--tw-ring-offset-shadow + --tw-ring-shadow
   composed into box-shadow); reproducing that verbatim inside this
   fallback is brittle and easy to desync. A single box-shadow ring using
   --ring matches the visual intent of every focus style in our components
   — and stays legible regardless of whether Tailwind's ring vars got
   generated. */
.focus\\:outline-none:focus,
.focus-visible\\:outline-none:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
/* Kill the native user-agent outline on form controls. Our components
   declare focus-visible outline-none plus focus-visible ring-1 ring-ring
   so keyboard focus already draws the themed ring — but mouse-click
   focus fires :focus (not :focus-visible), which means neither rule
   applies and browsers fall back to their default blue ring. That read
   as a bug ("input focus color is wrong") because it ignored the theme.
   This reset keeps the native ring OFF while still letting
   :focus-visible draw our box-shadow ring for keyboard users. Same
   effect as Tailwind v4 preflight, which zeroes outlines globally. */
button:focus, input:focus, select:focus, textarea:focus,
[role="button"]:focus, [role="checkbox"]:focus, [role="switch"]:focus,
[role="radio"]:focus, [role="tab"]:focus, [role="menuitem"]:focus {
  outline: none;
}
.focus-visible\\:ring-1:focus-visible {
  box-shadow: 0 0 0 1px oklch(var(--ring));
}
.focus-visible\\:ring-2:focus-visible {
  box-shadow: 0 0 0 2px oklch(var(--ring));
}
.focus\\:ring-2:focus {
  box-shadow: 0 0 0 2px oklch(var(--ring));
}
.focus-visible\\:ring-ring:focus-visible,
.focus\\:ring-ring:focus {
  /* ring-ring is purely a colour utility; the ring-1/ring-2 rules above
     already use oklch(var(--ring)) so this is a no-op, but keep the
     selector present so nothing cascades over it. */
}
.focus\\:ring-offset-2:focus {
  /* Offset would normally be achieved via a second box-shadow layer in
     the --tw-ring stack. In the fallback we just leave the ring flush;
     drop this rule or extend the ring rule if we ever want true offset. */
}

/* Disabled */
.disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
.disabled\\:opacity-50:disabled { opacity: 0.5; }
.disabled\\:pointer-events-none:disabled { pointer-events: none; }

/* peer-disabled:* — needs a sibling .peer input being :disabled, which is
   how <Label> dims when its <Input> is disabled. Tailwind generates
   .peer:disabled ~ .peer-disabled\\:* for these. */
.peer:disabled ~ .peer-disabled\\:cursor-not-allowed { cursor: not-allowed; }
.peer:disabled ~ .peer-disabled\\:opacity-50 { opacity: 0.5; }
.peer:disabled ~ .peer-disabled\\:opacity-70 { opacity: 0.7; }`;
}

// ─────────────────────────────────────────────────────────────────────
// Component source files (legacy — hand-simplified copies of the real
// components, kept around only for the STANDALONE HTML download path.
//
// The in-page Sandpack preview and Studio no longer use these; they now
// install `@gradeui/ui` from npm (see PLAYGROUND_DEPENDENCIES) so the
// iframe gets byte-for-byte the same Button/Input/Checkbox every npm
// consumer does. That gives us real 1:1 parity — the whole point of the
// design system.
//
// The only remaining consumer is lib/chat-export.ts, which produces a
// single-file .html downloadable: no bundler, no npm install, just
// Babel Standalone + an importmap of data: URLs. That path CAN'T reach
// npm, so it falls back to these inlined sources. When a user exports
// a design as HTML, they get these copies — acceptable trade-off for
// an offline download, not acceptable for the live theme preview.
// ─────────────────────────────────────────────────────────────────────

export const componentFiles: Record<string, string> = {
  "/components/ui/button.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }`,

  "/components/ui/card.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`,

  "/components/ui/input.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// Kept in 1:1 class parity with packages/ui/components/ui/input.tsx so the
// Sandpack preview and the published component render the same chrome.
// The focus outline reset in the sandpack fallback CSS is what actually
// makes the themed ring win over the browser's native blue outline on
// mouse click — this class list is just the Tailwind intent.
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }`,

  "/components/ui/label.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }`,

  "/components/ui/alert.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// Kept in sync with the real Alert in apps/docs/components/ui/alert.tsx.
// Status variants reference dedicated --*-soft / --*-deep tokens generated
// by the theme pipeline (see lib/themes/oklch.ts#deriveAlertPair) so the
// surface is a whisper of tint + text is a deep on-surface shade.
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground [&>svg]:text-foreground",
        destructive: "border-destructive/30 bg-destructive-soft text-destructive-deep [&>svg]:text-destructive-deep",
        success: "border-success/30 bg-success-soft text-success-deep [&>svg]:text-success-deep",
        warning: "border-warning/30 bg-warning-soft text-warning-deep [&>svg]:text-warning-deep",
        info: "border-info/30 bg-info-soft text-info-deep [&>svg]:text-info-deep",
        // Highlight (yellow) stays on --foreground for the label — deep
        // yellow text is unreadable — but the icon picks up the deep shade.
        highlight: "border-highlight/30 bg-highlight-soft text-foreground [&>svg]:text-highlight-deep",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }`,

  "/components/ui/badge.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        energy: "border-transparent bg-yellow-400 text-yellow-900 shadow hover:bg-yellow-500",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }`,

  "/components/ui/dialog.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Dialog = ({ children, ...props }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <div {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { open, setOpen })
        }
        return child
      })}
    </div>
  )
}

const DialogTrigger = ({ children, asChild, open, setOpen }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: () => setOpen(true) })
  }
  return <button onClick={() => setOpen(true)}>{children}</button>
}

const DialogContent = ({ children, className, open, setOpen }: any) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className={cn("relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg", className)}>
        <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">✕</button>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
)

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }`,

  "/components/ui/textarea.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export { Textarea }`,

  "/components/ui/separator.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }`,

  "/components/ui/progress.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: "translateX(-" + (100 - Math.max(0, Math.min(100, value))) + "%)" }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }`,

  "/components/ui/checkbox.tsx": `import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

// Dual-mode (controlled + uncontrolled) checkbox. The real library uses
// Radix Checkbox which handles this automatically; here we re-implement
// the dual-mode logic manually because Radix isn't bundled into the
// Sandpack deps (it ships as @gradeui/ui's transitive deps when you
// install for real). Without this dual-mode path a model-emitted bare
// <Checkbox /> would render but never toggle on click — the previous
// version forwarded checked={undefined} and no internal state ever
// flipped, so the visual stayed unchecked no matter how many times you
// clicked. This caused the "checkbox doesn't work" bug in /studio.
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onCheckedChange?: (checked: boolean) => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  defaultChecked?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, defaultChecked, ...props }, ref) => {
    const isControlled = checked !== undefined
    const [internal, setInternal] = React.useState<boolean>(
      Boolean(defaultChecked)
    )
    const current = isControlled ? Boolean(checked) : internal
    return (
      <label className="inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          {...(isControlled ? { checked: current } : { defaultChecked: Boolean(defaultChecked) })}
          onChange={(e) => {
            if (!isControlled) setInternal(e.target.checked)
            onCheckedChange?.(e.target.checked)
            onChange?.(e)
          }}
          {...props}
        />
        <span
          className={cn(
            // Fixed 3px radius so the checkbox always reads as a rounded
            // square — mirrors the real component. Using rounded-sm here
            // (which derives from --radius) would turn the 4x4 box circular
            // under pill/round themes and it'd look like a radio button.
            // Kept hand-authored literal so it tracks the real component,
            // not the active theme radius.
            "h-4 w-4 shrink-0 rounded-[3px] border border-primary shadow-sm flex items-center justify-center cursor-pointer",
            "peer-focus-visible:ring-1 peer-focus-visible:ring-ring",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            current ? "bg-primary text-primary-foreground" : "bg-background",
            className
          )}
        >
          {current ? <Check className="h-3 w-3" /> : null}
        </span>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }`,

  "/components/ui/switch.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, checked, ...props }, ref) => (
    <label className="inline-flex items-center">
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => {
          onCheckedChange?.(e.target.checked)
          onChange?.(e)
        }}
        {...props}
      />
      <span
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full border border-transparent transition-colors",
          "peer-focus-visible:ring-1 peer-focus-visible:ring-ring",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted",
          className
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </label>
  )
)
Switch.displayName = "Switch"

export { Switch }`,

  "/components/ui/avatar.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted", className)}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
  )
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }`,

  "/components/ui/skeleton.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

export { Skeleton }`,

  "/components/ui/tabs.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs: React.FC<TabsProps> = ({ defaultValue = "", value, onValueChange, className, children, ...props }) => {
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const setValue = (v: string) => {
    if (value === undefined) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={cn("", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}
      {...props}
    />
  )
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (!ctx) throw new Error("TabsTrigger must be used inside Tabs")
    const active = ctx.value === value
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={active}
        onClick={() => ctx.setValue(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          active ? "bg-background text-foreground shadow" : "",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (!ctx) throw new Error("TabsContent must be used inside Tabs")
    if (ctx.value !== value) return null
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", className)}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }`,

  "/components/ui/select.tsx": `import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

// Minimal, native-select-backed version for Sandpack. The real Grade Select
// is Radix-based; consumers using <Select>/<SelectItem> get reasonable JSX,
// and children with a 'value' prop become native <option>s.
interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children?: React.ReactNode
  className?: string
  placeholder?: string
}

const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
  className,
  placeholder,
}) => {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const current = value ?? internal
  return (
    <div className={cn("relative inline-block", className)}>
      <select
        value={current}
        disabled={disabled}
        onChange={(e) => {
          if (value === undefined) setInternal(e.target.value)
          onValueChange?.(e.target.value)
        }}
        className={cn(
          "appearance-none h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {placeholder && !current ? <option value="" disabled hidden>{placeholder}</option> : null}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
}

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ value, children, ...props }, ref) => (
    <option ref={ref} value={value} {...props}>{children}</option>
  )
)
SelectItem.displayName = "SelectItem"

// These are accepted as passthrough children so the model's Radix-shaped JSX
// compiles without error. They render nothing structural.
const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => <>{children}</>
const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => <>{children}</>
const SelectValue: React.FC<{ placeholder?: string }> = () => null

export { Select, SelectTrigger, SelectContent, SelectValue, SelectItem }`,

  "/components/ui/table.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  )
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  )
)
TableCaption.displayName = "TableCaption"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }`,

  "/lib/utils.ts": `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,
};

/**
 * The components the model is allowed to emit in `jsx` code blocks.
 * Used in the system prompt to constrain output so Sandpack has the source
 * files it needs. Keep in sync with componentFiles above.
 */
export const ALLOWED_COMPONENTS = [
  // Core primitives
  "Button",
  "Card",
  "CardHeader",
  "CardTitle",
  "CardDescription",
  "CardContent",
  "CardFooter",
  "Input",
  "Label",
  "Textarea",
  // Feedback
  "Alert",
  "AlertTitle",
  "AlertDescription",
  "Badge",
  "Progress",
  "Skeleton",
  // Overlays
  "Dialog",
  "DialogTrigger",
  "DialogContent",
  "DialogHeader",
  "DialogTitle",
  "DialogDescription",
  "DialogFooter",
  // Form controls
  "Checkbox",
  "Switch",
  "Select",
  "SelectTrigger",
  "SelectContent",
  "SelectValue",
  "SelectItem",
  // Layout & data display
  "Separator",
  "Avatar",
  "AvatarImage",
  "AvatarFallback",
  "Tabs",
  "TabsList",
  "TabsTrigger",
  "TabsContent",
  "Table",
  "TableHeader",
  "TableBody",
  "TableFooter",
  "TableHead",
  "TableRow",
  "TableCell",
  "TableCaption",
] as const;

/**
 * Additional bare module specifiers the model is allowed to import from.
 * These must be declared in the Sandpack `customSetup.dependencies` block so
 * the iframe can actually resolve them. Keep in sync with studio-preview.tsx
 * + design-chat.tsx's Sandpack setup.
 */
export const ALLOWED_EXTERNAL_IMPORTS = [
  "lucide-react",
  "recharts",
] as const;

// ─────────────────────────────────────────────────────────────────────
// buildSandpackFiles — the single source of truth for what goes into
// a Grade Sandpack iframe.
//
// Every preview surface (/play, /studio, the chat DesignPreview, the
// CodeEditor on component pages, the template viewer) previously
// hand-assembled its own `files` object and duplicated the
// index.tsx / styles.css / index.html fragments. That drift is exactly
// how we ended up with Alert variants rendering colourless in /play
// while working fine in /studio — the two surfaces had diverged.
//
// This helper returns the exact files object to spread into
// <SandpackProvider files={...}>. Consumers decide theme + mode +
// view mode; everything else is centralised here.
// ─────────────────────────────────────────────────────────────────────

/**
 * The minimal entry + styles every Sandpack iframe needs.
 *
 * CRITICAL — import order is the whole ballgame for live theming:
 *   1. `@gradeui/ui/styles.css` ships the library's compiled Tailwind
 *      output + :root defaults. Loaded FIRST so every utility class the
 *      real component emits (bg-primary, rounded-md, focus-visible ring
 *      stack, data-[state=checked]:*, peer-disabled:*, etc.) is already
 *      resolved before theme vars come in.
 *   2. `./styles.css` contains the active theme's CSS variable values —
 *      --primary, --foreground, --font-sans, plus the data-*-shape
 *      overrides. Loaded SECOND so its `:root { --primary: ... }`
 *      declaration wins over the library's default triplet via same-
 *      specificity cascade (last rule wins).
 *
 * Flip the order and the library's built-in defaults would override the
 * user's theme — silently making every preview look identical regardless
 * of slider position.
 */
const PLAYGROUND_ENTRY_TSX = [
  'import React from "react";',
  'import ReactDOM from "react-dom/client";',
  'import "@gradeui/ui/styles.css";',
  'import "./styles.css";',
  'import App from "./App";',
  "",
  'ReactDOM.createRoot(document.getElementById("root")!).render(<App />);',
].join("\n");

export interface BuildSandpackFilesArgs {
  /** Raw JSX the user/model produced. Run through prepareAppSource. Pass
   *  an already-prepared source if you prefer to call prepareAppSource
   *  yourself upstream (e.g. to memoize separately from the files obj). */
  appSource: string;
  /** The theme currently driving the preview — provides CSS var values
   *  and the data-* shape attributes for button/input/card. */
  theme: GeneratedTheme;
  /** Light or dark. Independent of the parent page's mode. */
  mode: "light" | "dark";
  /** When true, treat `appSource` as already normalised and skip the
   *  prepareAppSource pass. Useful when the caller memoizes separately. */
  appSourceIsPrepared?: boolean;
  /** Extra files to merge in after the defaults. Consumers can override
   *  any file (e.g. swap /App.tsx) or add new ones. */
  extraFiles?: Record<string, string>;
}

/**
 * Build the complete Sandpack files object — entry, styles, index.html,
 * App, and every inlined component file. Spread directly into
 * <SandpackProvider files={...}>.
 */
export function buildSandpackFiles({
  appSource,
  theme,
  mode,
  appSourceIsPrepared,
  extraFiles,
}: BuildSandpackFilesArgs): Record<string, string> {
  const lightVars = formatThemeVars(theme, "light");
  const darkVars = formatThemeVars(theme, "dark");
  const components = {
    buttonShape: theme.components.buttonShape ?? "default",
    inputStyle: theme.components.inputStyle ?? "outlined",
    cardStyle: theme.components.cardStyle ?? "flat",
  };
  // Always rewrite legacy `./components/ui/<name>` imports even when the
  // caller claims the source is pre-prepared — templates/view passes
  // `appSourceIsPrepared: true` (so the bare-JSX + default-export passes
  // are skipped for cleanliness), but their authored template code still
  // has the old local paths that need to resolve to @gradeui/ui now.
  // The rewrite is idempotent, so re-running it after prepareAppSource
  // already ran is a no-op.
  const normalized = appSourceIsPrepared ? appSource : prepareAppSource(appSource);
  const prepared = rewriteLocalComponentImports(normalized);

  // NOTE: no `...componentFiles` spread. The Sandpack iframe now
  // installs `@gradeui/ui` from npm (see PLAYGROUND_DEPENDENCIES) and
  // user JSX imports directly from "@gradeui/ui". Shipping hand-rolled
  // copies of Button/Input/Checkbox alongside that would double-define
  // the modules and invite drift — exactly the drift that motivated the
  // switch ("we dont want closer parity — we want ACTUAL parity").
  //
  // The `componentFiles` export is still used by lib/chat-export.ts's
  // standalone-HTML download path (browser Babel + data: URL importmap),
  // which can't hit npm directly. Keep it exported; just don't mount it
  // in the Sandpack file map here.
  return {
    "/App.tsx": prepared,
    "/public/index.html": buildPlaygroundIndexHtml(lightVars, darkVars, mode, components),
    "/index.tsx": PLAYGROUND_ENTRY_TSX,
    "/styles.css": buildPlaygroundStylesCss(lightVars, darkVars),
    ...(extraFiles ?? {}),
  };
}
