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
 *   /src/styles.css        — reset + rds-neutral bg
 *
 * We deliberately keep Tailwind on the CDN (just like the Sandpack preview)
 * so the sandbox starts without waiting on a Tailwind build step. The CSS
 * vars injected in index.html come from the same theme pipeline the in-page
 * preview uses.
 */

import {
  PLAYGROUND_FONTS_URL,
  PLAYGROUND_FONT_VARS,
  formatThemeVars,
  prepareAppSource,
} from "./chat-sandpack";
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

  const lightVars = formatThemeVars(theme, "light");
  const darkVars = formatThemeVars(theme, "dark");

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

  const indexTsx = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

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
 * POST the files payload to CodeSandbox's define API and open the resulting
 * sandbox in a new tab. Opens the tab up-front (synchronously with the
 * click) so popup blockers don't swallow it, then redirects it once the API
 * returns the sandbox_id.
 *
 * Throws on network/API failure — caller should catch and surface.
 */
export async function openInCodeSandboxNpm(params: {
  appSource: string;
  theme: GeneratedTheme;
  mode: "light" | "dark";
}): Promise<string> {
  const files = buildNpmSandboxFiles(params);

  // Open a blank tab first — browsers only treat window.open as user-initiated
  // if it's called directly in the click handler, not after an await.
  const win = typeof window !== "undefined" ? window.open("", "_blank") : null;

  try {
    const res = await fetch(
      "https://codesandbox.io/api/v1/sandboxes/define?json=1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ files }),
      }
    );
    if (!res.ok) {
      throw new Error(`CodeSandbox API ${res.status}`);
    }
    const { sandbox_id } = (await res.json()) as { sandbox_id: string };
    const url = `https://codesandbox.io/s/${sandbox_id}`;
    if (win) {
      win.location.href = url;
    } else if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
    return url;
  } catch (err) {
    // Close the blank tab so the user isn't stuck with a stray window.
    if (win) win.close();
    throw err;
  }
}
