# STUDIO-CAPTURE.md — one capture primitive, three consumers

This doc names the thing that sits underneath grid performance, static HTML export, and the live embed: a single **capture primitive** that turns a rendered Grade screen into a portable representation, and the three consumers that representation feeds. Sibling to [`STUDIO-EMBED.md`](./STUDIO-EMBED.md) (the live embed) and [`STUDIO.md`](./apps/docs/STUDIO.md) (the two-renderer model + `grade:*` bus).

If anyone asks "how does the grid hold hundreds of screens?", "how do we export a screen as HTML?", or "how do we embed a demo on an outside site?", the answer is: they are the same capture, packaged three ways.

## The problem that forces this

Today every tile in the All-view grid is a live `FastIframeHost`: a full iframe whose `/fast-sandbox` bundle instantiates its own copy of React, ReactDOM, sucrase, all of `@gradeui/ui`, recharts, tiptap, dnd-kit, tanstack-table, react-virtuoso, radix, and motion. The JS chunk downloads once from cache, but every realm parses and holds its own module objects plus a live reconciler plus a DOM. Budget 30 to 80MB per tile depending on what the screen imports. Hidden tiles stay mounted (the deliberate "instant flip back to All" behaviour), so focusing a screen reclaims nothing.

A project with 50 screens is multiple gigabytes of resident iframes. The tab OOMs well before that. This is not an optimisation target, it is a correctness ceiling: the grid as built cannot hold an arbitrary screen count.

## The core idea

A live realm is only justified when the user is **looking at motion or interacting**. Everything else (off-screen tiles, thumbnails, exported files, read-only demos that aren't yet in view) can be a **frozen representation** that costs no realm.

So we capture the rendered screen once and reuse that capture everywhere a live realm isn't earning its keep.

## The capture primitive

The sandbox already holds the rendered DOM and the active theme. Capture is cheap:

- **markup** — the rendered root `innerHTML` after React has committed.
- **theme** — the resolved CSS variable map (the same `themeToCSSVars(theme, mode)` output already posted over `grade:fast-theme`), serialised as a `:root { --gds-…: … }` block. The theme travels as variables and nothing else, so re-theming a capture is swapping the block.
- **media** — the resolved `sourceKey → url` map so MediaSurface slots point at real images, not unresolved placeholders.
- **frame semantics** — a capture is a freeze-frame. Animations stop wherever they were when captured. For a thumbnail that is fine. For an export we let the screen run to its settled frame first, then capture.

Capture happens inside the sandbox (it owns the DOM), triggered by a new `grade:capture` request and returned over `grade:captured`. It is runtime-only and never written back into stored source.

## Consumer 1 — grid posters (solves the memory ceiling)

A tile is a **poster by default and a live iframe only on interaction**. Two independent levers, both required:

- **Promote on view, demote on exit.** Tiles in (or near) the viewport boot a live `FastIframeHost` and animate. Tiles that scroll off capture their current frame and drop back to an inert scaled-HTML poster. The capture is taken at the moment of demotion, so the freeze-frame is literally the last frame the user saw: promote and demote are visually seamless. A tile that has never been live shows a cheap skeleton until first entry, then animates, then carries a real freeze-frame thereafter.
- **Virtualise + cap.** Even the live set is windowed (react-virtuoso is already a dependency) and concurrency-capped. Guards: **settle before promoting** (only boot after a tile has been in view ~150ms, so a fling-scroll doesn't spin up 30 iframes mid-flight) and a **concurrency cap** (a small N, say 9 to 12; if more qualify, the furthest-from-centre demote first).

Net effect: everything the user can actually look at animates, exactly as today. Everything off-screen is a frozen last-frame that weighs nothing. Grid cost becomes a function of viewport size, not project size, so 50 screens and 500 screens cost the same. The painting of off-screen posters is virtualised too, so the DOM never holds hundreds of subtrees either.

This is what the grid keeps that the "static screenshots everywhere" approach would have lost: live motion where the eyes are.

## Consumer 2 — static HTML export (a file you can open anywhere)

Export is the same capture plus a **packaging pass** that makes it portable. A raw runtime grab carries Studio cruft and assumes the host document already has Grade's stylesheet, so packaging does:

- **strip the instrumentation** — `data-gds-source-id`, `data-gds-instance-id`, `data-media-source` JSON, portal hosts. None of it leaves the building.
- **bake the styles** — inline or link `@gradeui/ui/styles.css` (Tailwind utilities + component styles). The snapshot carries class names, not the rules.
- **write the theme as a var block** — `:root { --gds-…: … }` prepended; light + dark is two blocks plus a class toggle.
- **make assets portable** — blob / localStorage-scoped MediaSurface URLs are dead outside the session. Rehost or inline as data URIs.
- **settle the frame** — capture the resting state, not a mid-animation freeze.

A raw runtime snapshot is the quick path. The cleaner long-term source for export is a **dedicated render that never stamped the Studio attributes in the first place** (the SSR-eval option from the renderer discussion wearing a different hat). Expect posters to use the cheap runtime snapshot and export to graduate to a purpose-built clean compile, with the styles-plus-var-block packaging shared between them.

Static export is **no JS**: a frozen, styled, themed document. The moment you want interactivity in the exported thing, that is not an export, it is the embed.

## Consumer 3 — live embed (the source string, not the DOM)

The embed does not use the captured DOM at all. It ships the **source string** through the iframe kernel and renders live on the far side. That is the whole of [`STUDIO-EMBED.md`](./STUDIO-EMBED.md): Fast Frame minus the editing chrome, by-id off a share link, sandboxed cross-origin. Listed here only to place it in the family: poster and static export are *frozen output*; the embed is *live input rendered elsewhere*. They share the kernel and the share-link record, not the capture.

## The kernel split this all rides on

Everything above wants a **lean renderer** with the Studio-only machinery removed. Extract the core of `FastIframeHost` into a kernel that keeps:

- iframe lifecycle + `grade:*` message bus
- source compile + theme apply + media URLs
- `grade:capture` / `grade:captured` (new)

and split off into a Studio-only wrapper:

- selection agent props (`selectMode`, `onSelect`, `onClearSelection`, source-id walking)
- comment props (`commentThreads`, `inlineComments`, pin overlay)
- walker / payload panel / sonner

The lean kernel is what grid tiles, static export capture, and the embed all consume. The Studio wrapper is what the focused frame in `/studio` adds on top. This is the same E0 extraction `STUDIO-EMBED.md` already calls for; this doc just shows it has three customers, not one.

## What already exists to build on

- **`/fast-sandbox` standalone path** — `#screen=<key>` reads a screen from localStorage and renders chrome-free (`fast-sandbox/page.tsx`, the standalone-preview handoff). A same-browser embed already, and the seed of the capture host.
- **"Preview" menu item** — writes `grade:screen:<id>` to localStorage and opens `/fast-sandbox#screen=…` in a tab. A working chrome-free render today.
- **Share-link records** — migrations `0010`–`0012` persist a screen reference + viewport + colour mode. The by-id payload for both export and embed.
- **`themeToCSSVars`** — already produces the var map the capture serialises.
- **react-virtuoso** — already a dependency; backs grid virtualisation with no new install.

## Rollout

- **C0 — Kernel + capture.** Extract the lean kernel from `FastIframeHost` (Studio props split into a wrapper). Add `grade:capture` / `grade:captured` to the sandbox: return root `innerHTML` + var block + media map.
- **C1 — Grid posters.** Promote-on-view / demote-on-exit with capture-on-demotion, virtualised, settle-delay + concurrency cap. This is the memory-ceiling fix; ship it first after C0 because it is the load-bearing one.
- **C2 — Static export.** The packaging pass (strip, bake styles, var block, portable assets, settled frame) → a downloadable `.html`. Reuses the capture; adds packaging.
- **C3 — Live embed.** Per `STUDIO-EMBED.md` E0–E2 on top of the same kernel: React `<GradeEmbed>` + hosted `/e/<id>` route + "Embed" action in the share UI. The "embed a demo anywhere" goal lands here.
- **C4 — Clean-render export source.** Graduate export from the runtime grab to a dedicated instrument-free compile (SSR or an export-mode sandbox pass) for crisp, deterministic output.

## See also

- [`STUDIO-EMBED.md`](./STUDIO-EMBED.md) — the live embed (consumer 3), kernel extraction, sandbox security posture.
- [`apps/docs/STUDIO.md`](./apps/docs/STUDIO.md) — two-renderer model + the `grade:*` bus (add `grade:capture` / `grade:captured` there when C0 lands).
- `apps/docs/components/studio/fast-frame.tsx` — `FastIframeHost`, the kernel to split.
- `apps/docs/app/fast-sandbox/page.tsx` — the sandbox; capture lives here, alongside the existing `#screen=` standalone path.
- `apps/docs/components/studio/studio-canvas.tsx` — the All-view grid + `TileFastMount`; where promote/demote lands.
- `apps/docs/components/studio/shared-screen.tsx` — viewport vocabulary + Fit scale, reused by export + embed sizing.
