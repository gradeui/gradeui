/**
 * "Open in CodeSandbox (npm)" export path.
 *
 * Where the Sandpack preview and the default CodeSandbox export both ship
 * inlined copies of the component source strings from `chat-sandpack.ts`,
 * this module builds a sandbox that installs `@gradeui/ui` from npm and
 * imports every component from there. It's the closest thing to a real
 * integration test of the published package — if the sandbox doesn't
 * render, the npm publish is wrong.
 *
 * Shape of the generated project:
 *   /package.json          — @gradeui/ui + peer deps, react-scripts
 *   /public/index.html     — host page with Tailwind CDN + theme vars
 *   /src/index.tsx         — React entry
 *   /src/App.tsx           — user snippet with imports rewritten to @gradeui/ui
 *   /src/styles.css        — reset + gds-neutral bg
 *
 * We deliberately keep Tailwind on the CDN (just like the Sandpack preview)
 * so the sandbox starts without waiting on a Tailwind build step. The CSS
 * vars injected in index.html come from the same theme pipeline the in-page
 * preview uses.
 */

import { compressToBase64 } from "lz-string";
import {
  PLAYGROUND_FONTS_URL,
  PLAYGROUND_FONT_VARS,
  formatThemeVars,
  prepareAppSource,
} from "./chat-sandpack";
import { applyBuiltInThemeOverrides } from "./themes";
import type { GeneratedTheme } from "./themes";

/** Current published version of @gradeui/ui. Bump when we pin to a newer
 *  release. Left at `latest` by default so freshly-published versions are
 *  picked up without code changes. */
const GRADEUI_VERSION = "latest";

/**
 * Rewrite local component imports to flat imports from @gradeui/ui. The
 * Studio system prompt now instructs the model to emit `from "@gradeui/ui"`
 * directly — in that case this is a no-op. The function is kept as a
 * defensive pass for legacy snippets (saved Studio designs from before the
 * switch, hand-authored templates, etc.) that still use the old
 * `./components/ui/<name>` form.
 *
 * Also collapses multi-specifier imports — `{ Button, Card }` from two
 * different local paths become a single `{ Button, Card }` from
 * `@gradeui/ui`. We don't need per-file resolution because the real package
 * re-exports everything from its barrel.
 */
export function rewriteImportsToGradeui(source: string): string {
  // Match: import { ... } from "./components/ui/<name>"  (double or single quote)
  const rx = /import\s+\{([^}]+)\}\s+from\s+["']\.\.?\/components\/ui\/[a-z-]+["'];?/g;
  const specifiers = new Set<string>();
  const stripped = source.replace(rx, (_m, group: string) => {
    for (const s of group.split(",")) {
      const name = s.trim();
      if (name) specifiers.add(name);
    }
    return ""; // drop the original line
  });
  if (specifiers.size === 0) return source;
  const merged = `import { ${Array.from(specifiers).join(", ")} } from "@gradeui/ui";\n`;
  // Place the consolidated import at the top, just after any remaining
  // imports (e.g. lucide-react). Simplest: prepend.
  return merged + stripped.trimStart();
}

/** Build the set of virtual files the CodeSandbox define API expects. */
export function buildNpmSandboxFiles(params: {
  appSource: string;
  theme: GeneratedTheme;
  mode: "light" | "dark";
}): Record<string, { content: string }> {
  const { appSource, theme, mode } = params;
  const prepared = prepareAppSource(appSource);
  const rewritten = rewriteImportsToGradeui(prepared);

  // Apply the same per-theme tokenOverrides Studio uses in-page. The
  // registry-loaded built-in themes already have these baked in, but a
  // freshly-edited theme from the builder is raw — and the studio
  // theme's near-black primary in particular only exists via the
  // override. Without this, the sandbox renders with the theme's
  // unedited mid-grey primary instead of the cream/black chrome the
  // user sees in Studio. Once `tokenOverrides` moves into
  // @gradeui/ui's theme generator (and ships in the package), this
  // call becomes a no-op and can be deleted.
  const themed = applyBuiltInThemeOverrides(theme);

  const lightVars = formatThemeVars(themed, "light");
  const darkVars = formatThemeVars(themed, "dark");

  // CRA-style project — minimum surface area, works out of the box on
  // CodeSandbox's default `react-ts` sandbox runtime.
  const packageJson = {
    name: "gradeui-sandbox",
    version: "1.0.0",
    private: true,
    dependencies: {
      "@gradeui/ui": GRADEUI_VERSION,
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "react-scripts": "5.0.1",
      "class-variance-authority": "^0.7.0",
      clsx: "^2.0.0",
      "tailwind-merge": "^2.0.0",
      "lucide-react": "^0.300.0",
      // Optional peer of @gradeui/ui — mirrors PLAYGROUND_DEPENDENCIES so
      // exported code that uses <RivePlayer /> keeps working in CodeSandbox.
      "@rive-app/react-canvas": "^4.21.4",
    },
    scripts: {
      start: "react-scripts start",
      build: "react-scripts build",
    },
    browserslist: {
      production: [">0.2%", "not dead", "not op_mini all"],
      development: [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version",
      ],
    },
  };

  const htmlClass = mode === "dark" ? ' class="dark"' : "";
  const indexHtml = `<!DOCTYPE html>
<html lang="en"${htmlClass}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${PLAYGROUND_FONTS_URL}" />
    <title>Grade DS — CodeSandbox preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      // Same Tailwind config shape as the in-page Sandpack preview — keep
      // in sync with buildPlaygroundIndexHtml in chat-sandpack.ts.
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
      };
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
      /* Form controls don't inherit font-family from body by default — the
         user-agent stylesheet plants its own. Keep this in sync with the
         Sandpack preview so a theme tweak looks identical in both places. */
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

  // Pull in @gradeui/ui's shipped stylesheet — it carries the CSS that
  // *can't* live in Tailwind utility classes, in particular the AppShell
  // grid-template-areas keyed off `[data-nav]`. Without this the sandbox
  // renders AppShell as a single column (nav stacks on top of main), so
  // the main panel falls below the viewport fold and looks "empty".
  const indexTsx = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@gradeui/ui/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  // A stub tsconfig so react-scripts is happy. CRA injects its own defaults
  // if this is missing, but an explicit one renders faster on CodeSandbox.
  const tsconfigJson = {
    compilerOptions: {
      target: "ES2020",
      lib: ["DOM", "DOM.Iterable", "ES2020"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      module: "ESNext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
    },
    include: ["src"],
  };

  return {
    "package.json": { content: JSON.stringify(packageJson, null, 2) },
    "tsconfig.json": { content: JSON.stringify(tsconfigJson, null, 2) },
    "public/index.html": { content: indexHtml },
    "src/index.tsx": { content: indexTsx },
    "src/App.tsx": { content: rewritten },
  };
}

/**
 * Submit the files payload to CodeSandbox's define endpoint via a real
 * `<form>` POST with `target="_blank"`. We *had* a fetch-based version that
 * pre-opened a popup and redirected it once the API returned the sandbox_id,
 * but that path silently fails from `localhost:3000` (and any other origin
 * Chrome treats as cross-site) — Chrome's CORS preflight on the
 * `Content-Type: application/json` POST is rejected and the fetch surfaces
 * as `TypeError: Failed to fetch`, after which the blank popup just sits
 * there with `about:blank`.
 *
 * The form submission path doesn't preflight — it's a same-shape request
 * as if the user clicked a link. CodeSandbox in turn returns a 302 to the
 * fresh sandbox URL, so the target="_blank" tab navigates straight to the
 * editor.
 *
 * Payload encoding follows CodeSandbox's own `getParameters` helper exactly:
 * lz-string `compressToBase64` of the JSON, then URL-safe (`+` → `-`,
 * `/` → `_`, strip trailing `=`). CodeSandbox specifically rejects raw
 * DEFLATE / `CompressionStream` payloads with
 * "Unable to process params for /define".
 *
 * Throws on missing browser environment — caller should catch and surface.
 */
export function openInCodeSandboxNpm(params: {
  appSource: string;
  theme: GeneratedTheme;
  mode: "light" | "dark";
}): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("openInCodeSandboxNpm requires a browser environment");
  }
  const files = buildNpmSandboxFiles(params);
  const parameters = encodeParameters({ files });

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://codesandbox.io/api/v1/sandboxes/define";
  form.target = "_blank";
  form.style.display = "none";

  const parametersInput = document.createElement("input");
  parametersInput.type = "hidden";
  parametersInput.name = "parameters";
  parametersInput.value = parameters;
  form.appendChild(parametersInput);

  // `query.file` hints CodeSandbox at which file to open by default — saves
  // the user a click to find the snippet they actually authored.
  const queryInput = document.createElement("input");
  queryInput.type = "hidden";
  queryInput.name = "query";
  queryInput.value = "file=/src/App.tsx";
  form.appendChild(queryInput);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

function encodeParameters(payload: unknown): string {
  return compressToBase64(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
