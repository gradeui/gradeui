/**
 * Standalone HTML export for the /chat design previews.
 *
 * Produces a single .html file that renders the generated design exactly as
 * Sandpack does — but runnable by double-clicking the file. No bundler, no
 * dev server required.
 *
 * Strategy:
 *   - Tailwind Play CDN for utility classes (matches the Sandpack setup).
 *   - Babel Standalone transpiles JSX in the browser.
 *   - React + friends come from esm.sh via an importmap.
 *   - Our own Card/Button/Input/etc sources are inlined so the user's
 *     `import { Button } from "./components/ui/button"` still resolves
 *     (via another importmap entry pointing to a data: URL).
 *
 * Keep in sync with lib/chat-sandpack.ts — the component source strings and
 * the theme-vars pipeline are the same.
 */

import { componentFiles, buildPlaygroundStylesCss } from "./chat-sandpack";

interface ExportArgs {
  /** The user-visible App component source (already normalised). */
  appSource: string;
  /** Light/dark CSS custom-property blocks (sans selectors). */
  lightVars: string;
  darkVars: string;
  /** Mode to boot the page in. */
  mode: "light" | "dark";
  /** File name hint. Without extension — we append .html. */
  filename?: string;
}

/**
 * Turn a JS module source string into a `data:` URL that an importmap can
 * point at. We base64-encode to dodge issues with # and other reserved
 * characters in unencoded data URLs.
 */
function toDataUrl(source: string): string {
  // btoa is available in the browser; on the server a caller would not use
  // this, but we guard anyway.
  const encoded =
    typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(source)))
      : Buffer.from(source, "utf8").toString("base64");
  return `data:text/javascript;base64,${encoded}`;
}

/**
 * The component files from chat-sandpack.ts use TSX syntax (`as any`, type
 * annotations). Browsers can't execute that directly. For the HTML export we
 * strip the TS-only bits — rough but works for the small subset we ship.
 */
function toJsModule(tsxSource: string): string {
  return (
    tsxSource
      // Drop `import type` lines wholesale.
      .replace(/^\s*import\s+type\s+.*?;?\s*$/gm, "")
      // Drop `type Foo = …` and `interface Foo …` blocks.
      .replace(/^\s*(export\s+)?type\s+[^=]+=\s*[^;]+;?/gm, "")
      .replace(/^\s*(export\s+)?interface\s+[^{]+\{[^}]*\}/gm, "")
      // Remove TS-only `as Foo` casts (best-effort).
      .replace(/\s+as\s+[A-Za-z0-9_<>.,\s[\]|&]+(?=[,)\];}\s])/g, "")
      // Remove generics on forwardRef / cloneElement like `<HTMLDivElement, …>`.
      .replace(/React\.forwardRef<[^>]+>/g, "React.forwardRef")
      .replace(/React\.cloneElement<[^>]+>/g, "React.cloneElement")
      // Drop `VariantProps<typeof …>` refs (only used in types).
      .replace(/VariantProps<[^>]+>/g, "")
      // Strip parameter type annotations (very rough — only targets common cases).
      .replace(/:\s*React\.[A-Za-z]+Props<[^>]+>/g, "")
      .replace(/:\s*React\.[A-Za-z]+HTMLAttributes<[^>]+>/g, "")
      .replace(/:\s*React\.HTMLAttributes<[^>]+>/g, "")
      .replace(/:\s*React\.LabelHTMLAttributes<[^>]+>/g, "")
      .replace(/:\s*React\.ButtonHTMLAttributes<[^>]+>/g, "")
      .replace(/:\s*React\.InputHTMLAttributes<[^>]+>/g, "")
      .replace(/:\s*any\b/g, "")
      .replace(/:\s*\{[^}]*\}/g, "")
      // `extends VariantProps<…>` → remove entirely (no longer interfaces).
      .replace(/extends\s+VariantProps<[^>]+>,?/g, "")
      // Strip standalone `?:` optional-property markers in destructuring.
      .replace(/\?\s*:/g, ":")
  );
}

/**
 * Build the full, self-contained HTML document as a string.
 *
 * Note: we deliberately include BOTH the theme vars inline (so the first
 * paint is styled) and rely on Tailwind's Play CDN for utilities — same
 * combo as the Sandpack preview.
 */
export function buildStandaloneHtml({
  appSource,
  lightVars,
  darkVars,
  mode,
  filename = "ramp-design",
}: ExportArgs): string {
  const stylesCss = buildPlaygroundStylesCss(lightVars, darkVars);

  // Build data: URLs for each of the component files so the user's code
  // `import { Button } from "./components/ui/button"` resolves without
  // needing real paths.
  const imports: Record<string, string> = {
    react: "https://esm.sh/react@18",
    "react-dom/client": "https://esm.sh/react-dom@18/client",
    "class-variance-authority":
      "https://esm.sh/class-variance-authority@0.7?external=react",
    clsx: "https://esm.sh/clsx@2",
    "tailwind-merge": "https://esm.sh/tailwind-merge@2",
    "lucide-react": "https://esm.sh/lucide-react@0.300?external=react",
  };
  for (const [path, source] of Object.entries(componentFiles)) {
    // e.g. "/components/ui/button.tsx" → "./components/ui/button"
    const specifier = path.replace(/^\//, "./").replace(/\.tsx?$/, "");
    imports[specifier] = toDataUrl(toJsModule(source));
  }

  const htmlClass = mode === "dark" ? ' class="dark"' : "";

  return `<!DOCTYPE html>
<html lang="en"${htmlClass}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${filename}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: "class",
      theme: { extend: { colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: { DEFAULT: "oklch(var(--primary) / <alpha-value>)", foreground: "oklch(var(--primary-foreground) / <alpha-value>)" },
        secondary: { DEFAULT: "oklch(var(--secondary) / <alpha-value>)", foreground: "oklch(var(--secondary-foreground) / <alpha-value>)" },
        destructive: { DEFAULT: "oklch(var(--destructive) / <alpha-value>)", foreground: "oklch(var(--destructive-foreground) / <alpha-value>)" },
        muted: { DEFAULT: "oklch(var(--muted) / <alpha-value>)", foreground: "oklch(var(--muted-foreground) / <alpha-value>)" },
        accent: { DEFAULT: "oklch(var(--accent) / <alpha-value>)", foreground: "oklch(var(--accent-foreground) / <alpha-value>)" },
        popover: { DEFAULT: "oklch(var(--popover) / <alpha-value>)", foreground: "oklch(var(--popover-foreground) / <alpha-value>)" },
        card: { DEFAULT: "oklch(var(--card) / <alpha-value>)", foreground: "oklch(var(--card-foreground) / <alpha-value>)" },
      }, borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" } } }
    };
  </script>
  <style>
${stylesCss}
  </style>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
  <script type="importmap">
    ${JSON.stringify({ imports }, null, 2)}
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react,typescript">
import React from "react";
import { createRoot } from "react-dom/client";

${appSource}

createRoot(document.getElementById("root")).render(React.createElement(App));
  </script>
</body>
</html>
`;
}

/**
 * Trigger a browser download of the generated HTML. Must run in the browser.
 */
export function downloadStandaloneHtml(args: ExportArgs): void {
  if (typeof document === "undefined") return;
  const html = buildStandaloneHtml(args);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${args.filename ?? "ramp-design"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
