# @grade/consume-app

Tiny Next.js app that installs `@grade/ui` via the pnpm workspace protocol and renders a handful of components. Used as a smoke test that the library's public API works in a realistic consumer setup.

## Run

```bash
pnpm install      # at the monorepo root
pnpm dev:consume  # or `pnpm --filter @grade/consume-app dev`
```

Visit http://localhost:3000 — you should see a card with three buttons and the primary colour sourced from `@grade/ui`'s theme tokens.

## What this validates

- `@grade/ui` resolves from a workspace dependency
- `@grade/ui/styles.css` ships the CSS token layer
- `@grade/ui/tailwind-preset` wires up the Tailwind colour/animation config in a consumer's `tailwind.config.ts`
- Next.js `transpilePackages: ["@grade/ui"]` compiles the library source without a prebuilt `dist/`
