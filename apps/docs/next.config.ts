import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // @gradeui/studio + @gradeui/walker ship as TypeScript source (zero build
  // step, so iterating on the playbook / walker doesn't require a rebuild).
  // Next needs to know to run them through its own compiler rather than
  // expecting pre-built JS.
  transpilePackages: ["@gradeui/studio", "@gradeui/walker", "@gradeui/mcp-server"],
  // `lexical-beautiful-mentions@0.1.48` ships BOTH an ESM build (package root,
  // `import ... from "lexical"`) and a CJS build (`cjs/`, `require("lexical")`),
  // but its exports map wrongly sends BOTH the `import` and `require` conditions
  // to `./cjs/index.js`. So the editor's `@lexical/react` loads ESM `lexical`
  // while BeautifulMentionNode (via the forced-CJS build) subclasses the CJS
  // `LexicalNode` — two classes, and Lexical throws "multiple copies of the same
  // lexical module". Aliasing the package to its ROOT ESM entry bypasses the
  // broken exports so it imports the SAME ESM `lexical` the editor uses.
  // (Surfaced after the Astro/tsup build churn; not a code bug in the composer.)
  turbopack: {
    resolveAlias: {
      "lexical-beautiful-mentions": "./node_modules/lexical-beautiful-mentions/index.js",
    },
  },
  // @gradeui/mcp-server's preview modules lazily import browser tooling
  // (full playwright locally; playwright-core + @sparticuz/chromium on the
  // hosted route). Bundling any of them breaks the build (dynamic
  // requires) or bloats the function — keep them runtime requires; Vercel's
  // file tracer still ships them with the function.
  serverExternalPackages: [
    "playwright",
    "playwright-core",
    "@sparticuz/chromium-min",
  ],
  // Dev-only Next badge / build-activity indicator. Bottom-left (the
  // default) sits right on top of Studio's chat composer + canvas
  // toolbar, and it photobombs screen recordings. Bottom-right is the
  // least contested corner of the Studio layout.
  devIndicators: {
    position: "bottom-right",
  },
};

export default withNextIntl(nextConfig);
