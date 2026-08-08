# Studio Storage — user assets

How a person's *own* images (and later, other files) get into a prototype — so Studio renders a mockup of *their* product, not a stock-photo lookalike.

> Status: design doc. Drafted 2026-05-31.
> Companion to [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (the theme contract), [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md), and [`STUDIO-CHAT.md`](./STUDIO-CHAT.md). This doc covers the **asset** pillar — binary files owned by a user/project, as distinct from the row-based project data already in Postgres.

**Terminology note** — "asset" = a stored binary file (today: images; later: maybe video, fonts, exported prototypes) with a row of metadata and a URL. Distinct from "media source," which is the *descriptor* (`{ kind: "portrait" }`) the model emits and the resolver turns into a stock/generated URL. Assets are the user's own bytes; sources are hints we fulfil for them.

---

## Problem

A prototype is only believable when it shows the real thing. Today Studio can fill a `<MediaSurface>` from a **descriptor** — `source={{ kind: "album", artist: "Daft Punk" }}` — which the resolver (`apps/docs/lib/media-fill.ts` → `@gradeui/media`'s source router, via `/api/media/resolve-batch`) turns into a stock or generated URL. Those URLs then flow into the iframe through the `mediaUrls` channel (`grade:set-media-urls` → `window.__gradeMediaUrls` → `MediaSurface`).

That's great for "a plausible portrait here." It's useless for "*my* logo," "*my* product screenshots," "*our* hero photography." And those are exactly what a person needs to prototype *their* product rather than a generic-looking one. The gap:

- **No upload path.** There's nowhere to put a user's bytes. Everything persisted today is Postgres rows; there's no object store in the loop.
- **No asset identity.** A resolved stock URL is ephemeral and anonymous. A user asset needs an id, an owner, a project, dimensions, and a stable URL.
- **No reuse.** Upload your logo once; it should be pickable on every screen, not re-uploaded per slot.
- **No story for shares.** A private asset rendered in a public `/s/<token>` share needs a URL an anonymous viewer can actually load — without exposing the user's whole bucket.

This is foundational, not cosmetic: it's the difference between Studio producing "pretty mockups" and "a prototype of the thing I'm building." It deserves its own pillar.

## The shape of the solution

Three pieces, mirroring how the rest of Studio's storage already works:

1. **An object store** — a Supabase Storage bucket holds the bytes. Path convention scopes by project so RLS and cleanup are simple: `assets/{projectId}/{assetId}.{ext}`.

2. **An `assets` table** — one row of metadata per file: owner, project, kind, dimensions, size, content type, created_by. RLS mirrors `project_access` exactly (the `user_can_read_project` / `user_can_edit_project` resolvers from migration `0008`) so "who can see/add an asset" is the same question as "who can read/edit the project." No new permission model.

3. **A wiring path into the existing media flow** — an uploaded asset resolves to a URL that travels the *same* `mediaUrls` channel stock/generated URLs already use. The renderer doesn't learn a new mechanism; it just receives one more URL. The selection inspector's image affordance gains "Upload / pick from library" alongside today's descriptor fill.

The key design principle: **assets reuse the patterns that already exist.** RLS via the project resolvers. URL delivery via `mediaUrls`. Adapter methods on `StudioStorage`. We're adding an object store and a metadata table — not a parallel universe.

## Data model

```ts
interface Asset {
  id: string;            // uuid
  projectId: string;     // owning project (RLS scope)
  path: string;          // bucket path: assets/{projectId}/{id}.{ext}
  kind: "image";         // future: "video" | "font" | "export"
  contentType: string;   // image/png, image/jpeg, image/svg+xml, …
  width: number | null;  // for images — lets MediaSurface reserve space
  height: number | null;
  bytes: number;         // size, for quota + display
  name: string;          // original filename, for the library UI
  createdBy: string;     // users.id
  createdAt: number;
}
```

Table `public.assets`, RLS:
- **select** → `user_can_read_project(project_id)` (viewers + editors + owners see the library).
- **insert/update/delete** → `user_can_edit_project(project_id)` (uploading is a write; viewers can't add).

Storage bucket policies match: read scoped to project-readers, write to project-editors. (Storage RLS keys off the path prefix → project id.)

## How an asset reaches the screen

Uploaded assets and resolved descriptors converge on the same channel — the renderer never knows the difference:

```
descriptor source  ─┐
                    ├─→  mediaUrls map  ─→  grade:set-media-urls  ─→  __gradeMediaUrls  ─→  <MediaSurface src>
user asset URL     ─┘
```

Two ways an asset gets *referenced* in the source:
1. **Direct `src`** — the user picks an asset for a specific slot; we patch `src="<asset url>"` (the same patch mechanism `media-fill.ts` already uses to insert `src`).
2. **Asset-kind source** — a `source={{ kind: "asset", id: "…" }}` descriptor the resolver maps to the asset's URL, so it flows through the existing resolve-batch path. Useful when the model or a template wants "an image here, fillable from the library."

Crucially, **asset URLs are runtime delivery, not source content** — same discipline as comments: the stored `appSource` references an asset *id* or a stable URL, and the resolver supplies bytes at render time. (Exact id-vs-URL choice is an open question — see below.)

## Shares + privacy — the load-bearing decision

The `/s/<token>` route renders for *anonymous* viewers via the service role. A private asset (readable only by project members under RLS) can't be loaded by an anon `<img>` tag. Options, to decide at build time:

- **Signed URLs minted server-side.** The share route mints short-lived signed URLs for the assets that screen references, and injects them like any other `mediaUrl`. Keeps the bucket private; viewer never gets durable access. Most secure; needs the share route to know which assets a screen uses.
- **Per-asset "public on share" flag.** Assets used in a share get marked publicly readable. Simpler, but leaks a durable public URL — wrong default for someone's unreleased product screenshots.

Recommendation: **signed URLs.** Privacy-preserving by default, consistent with how the share route already does privileged reads on the user's behalf. The cost is the share route resolving the screen's asset references to mint signatures — tractable because we already parse the source for media slots.

## What's built today

- **Descriptor → stock/generated fill** — `media-fill.ts`, `@gradeui/media` source router, `/api/media/resolve-batch`, the `mediaUrls` / `__gradeMediaUrls` delivery channel, per-slot `mediaOverrides`. This is the *source* path; it stays.
- **Per-project app icon** (23 Jul, first asset shipped 8 Aug) — an
  `assets` row with `enrichment.role = "app-icon"` (512px PNG in the
  public bucket; newest row wins, so re-uploading replaces without
  cleanup). `/s/<token>`'s `generateMetadata` resolves it into the
  `apple-touch-icon`, so a `?fullscreen=1` share installed on an
  iPhone/iPad home screen wears the CLIENT's mark, not Grade's. The
  `enrichment` jsonb is the role seam until a dedicated projects
  column exists. Glint's icon is generated from the Wordmark G glyph
  with the theme's champagne accent ramp.

## What's planned (this pillar)

- **Bucket + `assets` table + RLS** — the substrate.
- **Upload flow** — drag/drop or picker in the selection inspector + an asset library panel; client uploads to the bucket, writes the metadata row. (Upload itself is a user action — Claude/agents never handle upload credentials.)
- **Library reuse** — pick an existing asset for any slot; upload once, use everywhere.
- **MediaSurface wiring** — `kind: "asset"` source + direct-`src` patching through the existing channel.
- **Signed-URL delivery in shares** — the privacy path above.
- **Quotas + limits** — per-project byte budget (the `OrgLimits` shape in the schema is the natural home), content-type allowlist, max dimensions.
- **Image optimization** — Supabase image transforms or `next/image` in front of asset URLs, later.

## Rollout

Each phase shippable on its own.

**Phase S0 — Substrate.** Bucket, `assets` table, RLS mirroring `project_access`, `StudioStorage` methods (`listAssets`, `createAsset`, `deleteAsset`) on both adapters. No UI yet. (Local adapter: store as object URLs / IndexedDB, or no-op like sharing does — local-only has no server bucket.)

**Phase S1 — Upload + library.** The inspector upload affordance + an asset library panel. A user can upload their logo and pick it for a slot. End of S1: prototypes show real assets in Studio.

**Phase S2 — Shares.** Signed-URL delivery so shared screens render the user's assets to anon viewers without exposing the bucket.

**Phase S3 — Reuse + quotas.** Cross-screen reuse polish, per-project quota enforcement, content-type/size guards.

**Phase S4 — Optimization + beyond-images.** Image transforms; then the `kind` union opens to fonts (custom typefaces feed the theme contract — see STUDIO-THEMES), and eventually exported prototype bundles.

## Asset lifecycle + project deletion (decided 2026-06-02)

As built (migration `0014`), assets are **user-owned** with an **optional `project_id` tag**, not strictly project-scoped as the Data model section above first sketched. That tag is the hook for lifecycle:

- **Tagged asset** (`project_id` set) = belongs to that project; removed when the project is purged.
- **Untagged asset** (`project_id` null) = personal library; persists across projects, never auto-removed.

So tagging is the explicit "this belongs to this prototype" signal, and the personal library stays reusable. Tagging is already wired — the Supabase adapter sets `project_id` on asset create.

**Cleanup runs on purge, not soft-delete.** `deleteProject` is a soft delete (`deleted_at`, recoverable via `restoreProject`), so it must leave assets alone — otherwise a restore returns an assetless project. Asset removal belongs on a **purge** (permanent delete), a primitive that does not exist yet (`deleteProject`'s own comment notes "a true purge … is a separate, explicit action not wired here"). Building purge is the prerequisite for this feature.

**On purge, for each asset tagged to the project:**

1. **Skip if referenced.** If the asset's URL appears in any other screen's `mediaUrls` / `appSource` (or a live share/embed), don't delete it — untag it (`project_id = null`) so it falls back to the personal library. Nothing breaks elsewhere.
2. **Otherwise delete both the row and the bytes.** Remove the `assets` row AND the Storage object. A DB cascade only removes the row; the bytes would orphan in the bucket and keep costing storage, so the Storage object must be deleted explicitly (app-level, via the Storage API).

The `project_id` FK stays `on delete set null` as a safety net for any delete path that bypasses the app cleanup; the real cleanup is the app-level purge routine, because the skip-if-referenced check can't live in a SQL cascade.

**Untagged assets** are out of scope for project purge — a separate, later GC pass can reclaim personal-library assets nothing references.

**Build order:** (1) a `purgeProject(id)` primitive on `StudioStorage` (hard delete + cascade) on both adapters; (2) the asset-cleanup routine it calls (the reference scan + row/byte deletion above); (3) a trigger for purge — an explicit "delete permanently" / empty-trash action, and optionally a scheduled auto-purge after a retention window (the marketing copy already promises "30 days after cancellation, then permanently deleted").

## Constraints we're honest about

**Local-only mode has no bucket.** Like sharing, uploads require the cloud backend. The local adapter either keeps assets in IndexedDB/object URLs (works in-session, doesn't survive a share) or surfaces a clear "sign in to upload" message. Don't pretend a local upload produces a shareable URL.

**Credentials are the user's.** Uploading is always a user-initiated action in the browser. Agents/automation never hold or use storage credentials to push files on the user's behalf — same posture as the broader safety rules.

**Orphan cleanup.** Deleting a screen or regenerating its source can strand assets nothing references. Reference-counting is fiddly; v1 keeps assets until the project is deleted (cascade on the bucket path), and a later pass can garbage-collect unreferenced ones. Don't block S0–S1 on GC.

**This is not a DAM.** No versioning of an asset's bytes, no folders, no approval workflows. It's "the user's images, scoped to a project, pickable in a slot." Scope creep here is easy and unnecessary.

**Fonts bridge to themes — BUILT (June 2026).** A custom uploaded typeface is an asset *and* a theme input. The S4 font slice landed ahead of the rest of S4: a `type: 'font'` asset (the upload tab + bucket already existed) becomes a `CustomFontFace` on `ThemeInput.typography.customFonts` via `assetToFontFace` in `apps/docs/lib/custom-fonts.ts` (family/format/weight derived from the filename; the `enrichment` JSONB can override once binary name-table parsing lands). The theme builder's font pickers list the user's font library under "Your fonts"; selecting one copies the face onto the theme, so the theme stays renderable if the asset row is later deleted. The musical type scale rides on whatever font the theme names — including an uploaded variable font (weight `100 900`). Rendering/injection detail lives in STUDIO-THEMES ("Custom fonts travel inside the contract").

## See also

- [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) — the theme contract; fonts-as-assets bridge to it at S4.
- `apps/docs/lib/media-fill.ts`, `apps/docs/app/api/media/resolve-batch/route.ts` — the existing descriptor-resolution path assets converge with.
- `apps/docs/components/studio/fast-frame.tsx` — the `mediaUrls` / `grade:set-media-urls` delivery channel.
- `apps/docs/supabase/migrations/0008_role_based_access.sql` — the `user_can_read/edit_project` resolvers asset RLS reuses.
- `CLAUDE.md` → the storage adapter pattern (`StudioStorage`, Local + Supabase adapters).
