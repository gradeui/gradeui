# gradeui — Grade Design System monorepo

pnpm workspaces monorepo. Publishes the `@gradeui/*` scoped packages to npm and hosts the docs site at [gradeui.com](https://gradeui.com).

This `CLAUDE.md` is the orientation document for any Claude session working in this repo. Read it before reaching for a subagent.

**If the task involves the `/studio` chat-driven playground**, read `apps/docs/STUDIO.md` first — it documents the **two-renderer model** (Fast Frame is the live preview; Sandpack is kept as a parity check), the **two-agent split** (any new `grade:*` postMessage protocol needs handlers added in BOTH `apps/docs/app/fast-sandbox/page.tsx` AND `apps/docs/lib/chat-sandpack.ts` if it should work across both renderers), the selection protocol, system-prompt stitching, and known limits. Don't try to infer Studio's internals from the component code alone.

**If the task involves the future direction of Studio** — corpus / retrieval / preference learning / chat tool calls / generative UI in chat / voice input / themes / remix / community — the source of truth is the three design docs at the root of this repo: [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) (the data flow), [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) (the presentation layer), and [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (the theme contract + remix + community). Anyone asking "what's the plan for Studio?" should be pointed there. See "Design docs" section at the bottom for the full summary.

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
2. **Docs site rendering** — `apps/docs` uses Supabase Auth (Google OAuth + email magic-link, env-configurable) to gate routes. Public content is statically rendered; Studio + pro/client content sits behind auth. This is how `gradeui.com` stays the one place everyone logs into. See `SETUP-AUTH.md` for setup, `apps/docs/STUDIO-SHELL.md` for the implementation walkthrough.

### 1. Public / free — `@gradeui/core`, `@gradeui/ui`
- `publishConfig.access: "public"`
- MIT licensed — see root `LICENSE`
- Rendered on `gradeui.com/docs/**` without auth

### 2. Pro / paid — `@gradeui/pro`
- `publishConfig.access: "restricted"` — requires the npm Teams plan
- Commercial license — see `packages/pro/LICENSE.md`
- Rendered on `gradeui.com/pro/**` behind an auth check (user must be logged in AND have an active pro entitlement — entitlement check to be layered on top of the Supabase session)

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

`apps/docs` uses Supabase Auth — Google OAuth + email magic-link, configurable via `NEXT_PUBLIC_GRADE_AUTH_PROVIDERS`. Two modes from one codebase:

- **Local-only (self-host default):** no Supabase keys in env → sign-in gate bypassed, storage is localStorage. `pnpm dev` works without any setup.
- **Cloud:** keys present → `/studio` requires sign-in, projects sync to Postgres. RLS policies enforce visibility; first-sign-in auto-migrates existing local projects into the cloud account.

The switch is driven by `isAuthConfigured()` in `apps/docs/lib/supabase/env.ts`. Setup walkthrough: [SETUP-AUTH.md](./SETUP-AUTH.md). Full architecture in [apps/docs/STUDIO-SHELL.md](./apps/docs/STUDIO-SHELL.md) under "How auth works".

To gate a new route:

1. Server component: `getServerUser()` from `@/lib/supabase/server` — returns the signed-in Supabase user or null.
2. Compat shim: `auth()` from `@/lib/auth` returns a NextAuth-style `{ user: { id, email, name } }` envelope for legacy callsites.
3. Middleware: add the route's path prefix to `GATED_PREFIXES` in `apps/docs/middleware.ts` so unsigned users are redirected to `/sign-in?next=<path>`.

For **pro entitlement** (logged-in ≠ has-paid), plan to layer on an entitlement check — either an allowlist in env, a Stripe subscription lookup, or a dedicated `user_entitlements` table. The `Organisation.plan` + `OrgLimits` shape is already in the schema; just not enforced yet.

For **per-client auth**, plan to extend the auth-state-change handler to attach a `clients: string[]` claim derived from `org_memberships`. Gated client routes then check `clients.includes("acme")`.

### Invitations

`POST /api/invitations` + `/accept-invite/[token]/` ship a working invitation flow via Resend. Owner of a project can invite by email; the recipient gets a tokenised link; clicking it (and signing in if needed) inserts the access grant. See `apps/docs/lib/email/resend.ts` and `apps/docs/app/api/invitations/route.ts`.

## Working in this repo

### Library work (fixing or adding a component)
Work in `packages/ui/` (or `packages/pro/` for premium). The public barrel is `packages/ui/lib/index.ts`. Components live under `packages/ui/components/ui/`. See `packages/ui/README.md` for detail.

### Creating a new component — the ship checklist

A new component is not "done" until every line below is checked. Skipping any of these leaves the component invisible (no docs page), unusable in Studio (no allowlist), unthemeable (no tokens), or broken on first import (no barrel export). This list is non-negotiable.

1. **Source** — `packages/ui/components/ui/<name>.tsx`
2. **Sidecar** — `packages/ui/components/ui/<name>.md` with `props:`, `when_to_use:`, `composes_with:`, `aliases:` (drives the auto-generated contract + Studio retrieval).
3. **Barrel export** — add to `packages/ui/lib/index.ts` so consumers can `import { X } from "@gradeui/ui"`.
4. **Vendored copy** — `apps/docs/components/ui/<name>.tsx` mirrors the source. Required until docs migrates to importing from `@gradeui/ui`. The docs page imports the vendored copy (`@/components/ui/<name>`), not the published one.
5. **Docs page** — `apps/docs/app/components/<slug>/page.tsx` with `<SidecarBlock slug="..." />`, `<ComponentNav currentHref="..." />`, an interactive playground, and a `<InstallBlock>` showing the basic usage.
6. **Docs sidebar** — add to `apps/docs/components/docs-sidebar.tsx` (`componentsNav`) in the right category. Without this, the page exists but is unreachable.
7. **Components list** — add to `apps/docs/lib/components-list.ts` (powers prev/next nav at the bottom of every docs page). Without this, neighbouring pages don't link back.
8. **Playbook allowlist** — add to `packages/studio/src/playbook/components/allowlist.ts` if Studio should be able to emit it in generated JSX, and to the `componentFiles` map in `apps/docs/lib/chat-sandpack.ts` so Sandpack can resolve it. Skip only for components that are explicitly chrome-only (Studio surfaces).
9. **Components inventory** — add a row to `packages/ui/COMPONENTS.md` (source-of-truth list + Figma sync status).
10. **CSS tokens** — if the component introduces colours, spacing, or motion not covered by existing tokens, add `--gds-<name>-*` variables to `packages/ui/styles/globals.css` (alongside the other component palettes).
11. **Contracts regen** — run `pnpm -F @gradeui/ui generate:contracts` so the auto-generated `<name>.contract.ts` lands alongside the sidecar. The Studio settings panel reads these.
12. **Build** — `pnpm -F @gradeui/ui dev` in watch mode (or `pnpm build`) rebuilds the dist. Without this, `@gradeui/ui` imports won't see the new component even though the file exists.

The vendored copy + dist rebuild are the two most common things to forget. If a new component "doesn't appear" on localhost, check those first.

### Docs-site work
Work in `apps/docs/`. The docs site currently keeps its own copy of components under `components/ui/` — this is deliberate, to decouple the docs site's import graph from the published package during the transition. If you edit a component for a customer-facing change, edit it in **both** `packages/ui/components/ui/` and `apps/docs/components/ui/` until the docs site is migrated to import from `@gradeui/ui`.

### Smoke-testing a published build
Work in `apps/consume-app/`. It consumes `@gradeui/ui` via `workspace:*` so local changes in `packages/ui/` show up immediately. This is also the template for per-client consume repos (swap `workspace:*` → a real npm version).

### Runtime token namespace

All Grade runtime tokens live under the `gds-*` / `--gds-*` / `grade-*` prefixes:

- **CSS custom properties** use `--gds-*` (e.g. `--gds-blue-500`, `--gds-sidebar-width`). The `--ramp-*` prefix is reserved for the per-step OKLCH color ramps (`--ramp-50` … `--ramp-950`) — that's technical color-ramp terminology, not brand, and stays.
- **CSS class prefix** is `gds-*` (e.g. `.gds-app-shell`, `.gds-card`, `.gds-aura-ring`).
- **HTML attribute** for the active theme on `<html>` is `data-grade-theme`.
- **localStorage keys** sit under `grade-*` (`grade-mode`, `grade-theme`, `grade-user-themes`) and `gds-*` (`gds-playgrounds`, `gds-template-saves`, `gds-chat-settings`).
- **React API** is `GradeThemeProvider` / `useGradeTheme` / `GRADE_PRE_HYDRATION_SCRIPT`.

The May 2026 rename pass cleared the last of the legacy `ramp-*` / `--rds-*` / `rds-*` / `data-ramp-theme` references in a single sweep — no user-data migration was needed because the library had no external installs yet. The script that ran is checked in at `scripts/rename-rds-to-gds.py` and documents every pattern it touched; reach for that file as a model if you ever need another monorepo-wide rename.

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

## Design docs — the Studio roadmap

These docs are the source of truth for where Studio is going. Read them before reaching for related tasks; they describe the architecture, the rationale, and the phased rollout. **If anyone asks "what's the plan for Studio?", these are the answer.**

- **[`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md)** — How Studio gets better with use without fine-tuning. Covers the corpus (retrieval-backed generation), Generation Source toggle (LLM / Corpus / Compare), preference loop (accept/reject/comments-on-nodes), App Brief skill, display axes (visualWeight / density / information), gaps log, Mobbin-fed seed generator. 6-phase rollout #113–#118 + Phase 0 #121.

- **[`STUDIO-CHAT.md`](./STUDIO-CHAT.md)** — How the chat surface becomes a rich generative-UI workspace. Covers the AI SDK tool-call protocol, the 8-tool catalog (askQuestions, proposeLayouts, confirmGap, suggestRename, pickIcon, confirmDestructive, saveAsUserComponent, reviewLearnings), Vercel AI Elements adoption, voice input, inline artifacts vs canvas artifacts. 6-phase rollout (A–F) running parallel to the learning rollout.

- **[`STUDIO-THEMES.md`](./STUDIO-THEMES.md)** — What a theme *is* and how it moves between people. The `ThemeInput` contract (deterministic, portable), the three visibility tiers (private project variants → curated share set → community catalog), remix lineage (`remixOf`), and showcase "clones" as seed content. T0–T5 rollout; T0 (variant storage, migration `0013`) is built.

- **[`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md)** — User-owned **assets** (their own images, later fonts/video/exports) as distinct from row-based project data. Supabase Storage bucket + `assets` table with RLS mirroring `project_access`, an upload/library flow, and wiring uploaded URLs into the existing `mediaUrls` channel that today only carries stock/generated fills. Signed-URL delivery for shares. S0–S4 rollout; none built yet. This is what turns "pretty mockups" into "a prototype of *my* product."

The four are siblings: learning is *what the system learns and generates*; chat is *how it presents that*; themes is *the unit people remix and share*; storage is *the user's own bytes that make a prototype theirs*. They cross-reference for individual features.

## See also

- `packages/ui/CLAUDE.md` — deep component/theming/subagent detail (inherited from the predecessor; still the authoritative reference for the component layer)
- `apps/docs/STUDIO.md` — orientation for `/studio` (allow-list location, selection protocol, publish-lag gotcha)
- `SETUP.md` — one-time setup checklist for a fresh clone (GitHub org, npm org + token, Vercel)
