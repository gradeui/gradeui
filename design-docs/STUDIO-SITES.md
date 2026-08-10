# Studio Sites — the opinionated site builder

A **deliberately opinionated** surface for building **simple sites from Grade
components**, with a CMS, fast static output, and one-click domains. NOT "build
anything" (that's Studio / freeform JSX). The constraint is the feature:
assemble pages from a fixed set of Grade **sections**, theme them with scopes,
publish to a domain. A lightweight-but-*pro* builder.

> Status: design direction, drafted 2026-06-20. Sibling of
> [`STUDIO-SECTIONS.md`](./STUDIO-SECTIONS.md) (the building blocks) and
> [`STUDIO-COLOR.md`](./STUDIO-COLOR.md) (the theme/scopes). Sites is its own
> product, distinct from the freeform Studio.

---

## The opinion

Studio builds anything; Sites builds **simple sites, well**. You add **sections**
(from the Grade section library), fill in **content** (via a CMS), pick a
**theme**, set a **domain**, and **deploy**. No raw JSX, no infinite canvas —
the opinionation is what makes it fast, consistent, and shippable by non-devs.

## The stack

| layer | what | choice |
| ----- | ---- | ------ |
| **Builder** | the editing surface — add/reorder sections, edit content, theme, manage domain & deploys | a "Sites" area (shares the gradeui app + auth) |
| **Content** | structured content (collections + fields), *not* freeform screen-JSX | **CMS — Payload** (TS, Postgres → same Supabase DB, Next-native admin, versioning, access control out of the box) |
| **Blocks** | the page vocabulary | the Grade **section** library (`Section`/`Container`/parts + content blocks) |
| **Theme** | per-site look | the **scopes** + theme tokens (STUDIO-COLOR.md) |
| **Build** | compile content + sections → fast static site | **Astro** (static-first; Grade React components as `@astrojs/react` islands over published `@gradeui/ui`) |
| **Deploy** | host + custom domain | **Vercel** (per-site project, domains API for setup/verification) |

## Reuse vs new

**Reuse from gradeui (already built):**
- **Auth** — gradeui Supabase login (one account across Studio + Sites).
- **Permissions** — `project_access` (owner / editor / viewer) already models grants.
- **Audit log** — the `events` table (migration 0015) is the substrate for "who changed what".
- **Components + sections + scopes + theme** — the published `@gradeui/ui` and the section library.
- **`origin="sites"`** — tags everything back to one account/surface.

**New for Sites:**
- **CMS** (Payload collections: Site, Page, Section-instances, Media…).
- **Astro build pipeline** (content + theme → static site).
- **Vercel deploy** (project-per-site, build hook, status).
- **Domain setup** (Vercel Domains API: add, verify, DNS guidance).

## Capabilities (the "pro" surface)

- Add / reorder / remove **sections** on a page; multi-page sites with nav.
- **Edit content** inline (CMS-backed, easily editable, versioned).
- **Theme** the whole site (scopes); per-section scope overrides.
- **Domain**: connect a custom domain, verify, go live.
- **Deploy**: build + publish to Vercel; preview vs production.
- **Audit log**: changes, publishes, deploys (from `events`).
- **Permissions**: owner/editor/viewer per site (from `project_access`).

## Boundary with Studio

Shared: **auth, theme/scopes, the component + section library.**
Different: **content model** (CMS collections vs freeform screen-JSX) and
**build/runtime** (Astro static vs Next runtime). A site is *compiled from
data*, not stored as a codebase; the Astro project is the build pipeline, the
site's substance is CMS content.

## Open decisions

- **Payload vs thin Supabase CMS.** Payload = batteries-included admin + Postgres
  (co-locates with Supabase) but a second content system; thin CMS = one stack,
  build the admin. Payload is the strong default for "real CMS, fast".
- **How Astro consumes `@gradeui/ui`** — islands granularity, which sections
  hydrate vs stay static.
- **Multi-tenant deploy model** — one Vercel project per site vs a shared
  multi-tenant renderer keyed by hostname.
- **Where the builder lives** — inside the gradeui Next app as a "Sites" route,
  or a separate app sharing auth.

## Next

Not a build yet — this is the plan. First concrete steps when Sites starts:
publish `@gradeui/ui`, stand up Payload against the Supabase Postgres with a
minimal Site/Page/Section schema, and spike an Astro render of one page from
content + a Grade section.
