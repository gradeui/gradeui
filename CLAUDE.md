# gradeui — Grade Design System monorepo

pnpm workspaces monorepo. Publishes the `@gradeui/*` scoped packages to npm and hosts the docs site at [gradeui.com](https://gradeui.com).

This `CLAUDE.md` is the orientation document for any Claude session working in this repo. Read it before reaching for a subagent.

**If the task involves the `/studio` chat-driven playground**, read `apps/docs/STUDIO.md` first — it documents the selection protocol, Sandpack injection model, system-prompt stitching, and known limits. Don't try to infer Studio's internals from the component code alone.

## Layout

```
gradeui/
├── apps/
│   ├── docs/            # @gradeui/docs  — Next.js 16 docs site (private, deployed to gradeui.com)
│   └── consume-app/     # @gradeui/consume-app — Next.js 15 smoke-test app (private, not published)
├── packages/
│   ├── core/            # @gradeui/core  — tokens, theme generator (public, placeholder)
│   ├── ui/              # @gradeui/ui    — free React components (public)
│   └── pro/             # @gradeui/pro   — premium / commercial components (restricted)
├── .changeset/          # versioning + release notes
├── .github/workflows/   # ci.yml (PR validation) + publish.yml (changesets action)
└── pnpm-workspace.yaml
```

## The tiering model (IMPORTANT)

Grade ships components at three access levels, **all from this single codebase**. There is no plan to split into multiple repos unless the scale of client work makes it unavoidable — see "When to break out" below.

The tiering is enforced by two independent controls:

1. **npm publishing** — the `publishConfig.access` field on each package's `package.json` decides whether it publishes `public` (anyone can `npm install`) or `restricted` (only team members + per-user grants). The `.github/workflows/publish.yml` hook runs changesets, which reads those fields per package.
2. **Docs site rendering** — `apps/docs` uses NextAuth (GitHub provider) to gate routes. Public content is statically rendered; pro/client content sits behind auth. This is how `gradeui.com` stays the one place everyone logs into.

### 1. Public / free — `@gradeui/core`, `@gradeui/ui`
- `publishConfig.access: "public"`
- MIT licensed — see root `LICENSE`
- Rendered on `gradeui.com/docs/**` without auth

### 2. Pro / paid — `@gradeui/pro`
- `publishConfig.access: "restricted"` — requires the npm Teams plan
- Commercial license — see `packages/pro/LICENSE.md`
- Rendered on `gradeui.com/pro/**` behind an auth check (user must be logged in AND have an active pro entitlement — entitlement check to be layered on top of NextAuth)

### 3. Per-client private — `packages/clients/<name>/` (when needed)
- Same scope `@gradeui/*` (e.g. `@gradeui/acme-forms`) with `publishConfig.access: "restricted"`, or a client-owned scope like `@acme/*`
- Client packages go in `packages/clients/<name>/` — create that directory + add `packages/clients/*` to `pnpm-workspace.yaml` when the first one lands. Keep the structure identical to `packages/pro` (own tsup/tsconfig/LICENSE).
- Rendered (if at all) on `gradeui.com/clients/<name>/**` behind auth scoped to that client's team
- A separate LICENSE per client package — never MIT, never the same license as `@gradeui/pro`

### Repo visibility

Because `@gradeui/pro` (and eventually client) **source** lives here, **this GitHub repo must stay private**. The npm packages can still be published with different access levels (public `@gradeui/ui`, restricted `@gradeui/pro`) — npm package visibility is independent of source repo visibility.

If at some point you want the `@gradeui/ui` source to be openly browsable on GitHub, that's the trigger to extract — not before.

### When to break out into separate repos

Defaults favor staying in the monorepo. Break out only when one of these becomes true:
- A client's legal team requires source isolation (common with regulated industries)
- Client-specific commits are landing often enough that they're polluting the main repo's history
- You want to hand one client's repo to their internal team without giving them access to others

The template for an extracted client repo is `apps/consume-app/` — a Next.js app consuming `@gradeui/ui` from npm via a real version dep, not `workspace:*`.

### Rule of thumb when deciding where code belongs

- Does every Grade customer benefit? → `packages/ui` (public)
- Is it a paid/premium feature? → `packages/pro` (restricted)
- Is it specific to one client? → `packages/clients/<name>/` (restricted), with that client's docs gated behind auth

## Auth on gradeui.com

`apps/docs` already has NextAuth v5 wired in with a GitHub OAuth provider (see `apps/docs/.env.example`, `apps/docs/components/auth-provider.tsx`, `apps/docs/app/api/auth/[...nextauth]/route.ts`). To gate a route behind auth:

1. Check the session in the page or layout: `auth()` from `@/lib/auth`
2. If `!session`, redirect to `/sign-in` (or render a paywall / upgrade CTA for pro routes)

For **pro entitlement** (logged-in ≠ has-paid), plan to layer on an entitlement check — either a simple allowlist in an env var, a Stripe subscription lookup, or a dedicated `user_entitlements` table once the user store outgrows GitHub login. This hasn't been built yet; keep the hook points obvious in any new gated route.

For **per-client auth**, plan to extend the auth callback to attach a `clients: string[]` claim to the session. Gated client routes then check `session.clients.includes("acme")`.

## Working in this repo

### Library work (fixing or adding a component)
Work in `packages/ui/` (or `packages/pro/` for premium). The public barrel is `packages/ui/lib/index.ts`. Components live under `packages/ui/components/ui/`. See `packages/ui/README.md` for detail.

### Docs-site work
Work in `apps/docs/`. The docs site currently keeps its own copy of components under `components/ui/` — this is deliberate, to decouple the docs site's import graph from the published package during the transition. If you edit a component for a customer-facing change, edit it in **both** `packages/ui/components/ui/` and `apps/docs/components/ui/` until the docs site is migrated to import from `@gradeui/ui`.

### Smoke-testing a published build
Work in `apps/consume-app/`. It consumes `@gradeui/ui` via `workspace:*` so local changes in `packages/ui/` show up immediately. This is also the template for per-client consume repos (swap `workspace:*` → a real npm version).

### Deferred renames — do not "fix" these opportunistically
- `--rds-*` CSS custom properties
- `data-ramp-theme` HTML attribute
- localStorage keys: `ramp-mode`, `ramp-theme`, `rds-playgrounds`, `rds-template-saves`, `rds-chat-settings`

These are runtime tokens / persisted keys carried over from the `ramp-ds` predecessor. Renaming them is a coordinated breaking change (every component that reads `oklch(var(--rds-*))` would need to update, and localStorage rename without migration wipes user data). Do it in a dedicated PR with a migration path, not as a drive-by. The React API — `GradeThemeProvider` / `useGradeTheme` / `GRADE_PRE_HYDRATION_SCRIPT` — was renamed in the Ramp→Grade rebrand pass.

## Versioning & publishing

Releases are driven by [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset          # record a change (creates a .changeset/*.md)
```

On push to `main`, `.github/workflows/publish.yml` runs the changesets action. It opens a "Version Packages" PR when changesets are pending; merging that PR bumps versions and publishes to npm using `NPM_TOKEN`.

`@gradeui/docs` and `@gradeui/consume-app` are in the `ignore` list in `.changeset/config.json` — they're private and never publish.

## Common pitfalls

- **Don't publish `@gradeui/pro` with `access: public`.** The `publishConfig` in `packages/pro/package.json` is already set to `restricted`; keep it that way.
- **Don't add docs-only dependencies to `packages/ui/`.** If something is only used by the docs site (feed, octokit, mapbox-gl, next-intl, etc.), it belongs in `apps/docs/package.json`.
- **Don't break the public API in `packages/ui/lib/index.ts` without a changeset.** The consume-app and every client repo depend on that barrel.
- **Don't commit into `apps/docs/` without considering whether the change should also propagate to `packages/ui/`.** See the "Docs-site work" note above — the two are currently duplicated on purpose, but customer-facing changes need to land in both.

## Scripts (root)

| Command | Runs |
|---|---|
| `pnpm dev` | `apps/docs` in dev mode |
| `pnpm dev:consume` | `apps/consume-app` in dev mode |
| `pnpm build` | `tsup` build for every `packages/*` |
| `pnpm build:docs` | Next.js build of `apps/docs` |
| `pnpm build:all` | Everything — packages + both apps |
| `pnpm changeset` | Record a version change |
| `pnpm release` | `pnpm build && changeset publish` (CI runs this) |
| `pnpm clean` | Remove `dist/`, `.next/`, `.turbo/`, `node_modules/` everywhere |

## See also

- `packages/ui/CLAUDE.md` — deep component/theming/subagent detail (inherited from the predecessor; still the authoritative reference for the component layer)
- `apps/docs/STUDIO.md` — orientation for `/studio` (allow-list location, selection protocol, publish-lag gotcha)
- `SETUP.md` — one-time setup checklist for a fresh clone (GitHub org, npm org + token, Vercel)
