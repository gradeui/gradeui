---
"@gradeui/ui": patch
---

Make the package barrel ESM-safe by force-bundling `lexical-beautiful-mentions`.

Previously tsup externalized `lexical-beautiful-mentions` (the default for
dependencies), so `dist/index.mjs` shipped a bare
`from "lexical-beautiful-mentions"` import. That package's published ESM uses
extensionless re-exports (`export * from "./BeautifulMentionsPlugin"`), which
strict ESM resolvers (Vite SSR, Astro, `@tailwindcss/node`, plain Node) reject.
The result: any consumer importing even `<Section>` or `<Button>` from
`@gradeui/ui` could crash during module resolution, because the Composer export
dragged the broken dependency into the barrel's static graph.

It's now in tsup's `noExternal` list, so esbuild inlines it at our build time
and resolves the extensionless imports. The published bundle is self-contained
and resolves cleanly in every consumer, no patches or resolver shims required.
No runtime or API change to `<Composer>`.
