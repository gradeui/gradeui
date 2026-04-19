# gradeui

The Grade design system. A pnpm workspaces monorepo that ships the `@grade/*` packages to npm and hosts the documentation site at [gradeui.com](https://gradeui.com).

## Layout

```
gradeui/
├── apps/
│   ├── docs/            # Next.js docs site (deployed to gradeui.com)
│   └── consume-app/     # Integration test app — installs @grade/ui to validate the public API
└── packages/
    ├── core/            # @grade/core — design tokens, theme generator, primitives
    ├── ui/              # @grade/ui  — React components (shadcn-based)
    └── pro/             # @grade/pro — premium / commercial components (placeholder)
```

## Getting started

```bash
pnpm install
pnpm dev               # starts apps/docs
pnpm dev:consume       # starts apps/consume-app
pnpm build             # builds all publishable packages
pnpm build:docs        # builds the docs site
```

## Publishing

Releases are managed with [changesets](https://github.com/changesets/changesets) and published via GitHub Actions on pushes to `main`.

```bash
pnpm changeset         # record a change
pnpm version           # bump versions
pnpm release           # manual publish (CI normally handles this)
```

## License

MIT © Grade. See [LICENSE](./LICENSE).
