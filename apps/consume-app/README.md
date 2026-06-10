# @gradeui/consume-app

Tiny Next.js app that installs `@gradeui/ui` via the pnpm workspace protocol and renders a handful of components. Used as a smoke test that the library's public API works in a realistic consumer setup.

## Run

```bash
pnpm install      # at the monorepo root
pnpm dev:consume  # or `pnpm --filter @gradeui/consume-app dev`
```

Visit http://localhost:3000 — you should see a card with three buttons and the primary colour sourced from `@gradeui/ui`'s theme tokens.

## What this validates

- `@gradeui/ui` resolves from a workspace dependency
- `@gradeui/ui/styles.css` is fully self-contained — tokens, the native Tailwind v4 `@theme` bridge, and every utility the components use (the `@gradeui/ui/tailwind-preset` export was retired in the v4 native-@theme migration; there is no JS config for consumers to extend)
- Next.js `transpilePackages: ["@gradeui/ui"]` compiles the library source without a prebuilt `dist/`
