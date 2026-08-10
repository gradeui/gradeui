# STUDIO-EMBED.md — `grade-embed`: live Grade renders, anywhere

This doc captures **`grade-embed`** — a way to drop a live, isolated Grade render into any site (your personal site first, then anywhere). It's the externalised form of Fast Frame: the same iframe renderer Studio and the share view already use, packaged for the outside world. Sibling to `STUDIO-FILLS.md` and `STUDIO.md` (the selection bus / two-renderer model).

If anyone asks "how do we showcase Grade screens on a marketing site / blog / personal site?", this is the answer.

## Why

Showcasing is the use case: a tweakable `ThreeScene`, a Grade-styled screen, a component demo — embedded live on a personal site, blog, Webflow page, or client deck. Simple component demos are just `import { ThreeScene }`; the embed earns its keep when you want **isolation + a self-contained interactive demo** the host site knows nothing about (no Grade, no three.js, no theme plumbing on the host). The iframe boundary is the feature.

## It's mostly already built

The embed is **Fast Frame minus the editing chrome**, and the share stack already did most of the work:

- **`FastIframeHost`** (`fast-frame.tsx`) — the renderer kernel: an isolated iframe that receives a JSX source string + theme + media over postMessage, sucrase-transpiles + evals against the `@gradeui/ui` vocabulary, wraps default providers.
- **`shared-screen.tsx`** — already reuses `FastIframeHost` for public share views, with a viewport vocabulary (`responsive` / `mobile 390` / `tablet 768` / device sizes with explicit W×H), a **Fit scale** (ResizeObserver → largest scale ≤ 1 that fits the artboard), and read-only behaviour.
- **Share links** (`0010`–`0012` migrations) — persist a screen reference + **viewport + colour mode**. An embed is a share link with a different presentation shell.
- **Project grid / `project-home.tsx`** — the gallery pattern (good model for an "all my embeds" or multi-tile showcase).

So `grade-embed` is not a from-scratch build — it's **strip the chrome, harden the boundary, solve sizing, package for external hosts.**

### Share-view presentation params (`/s/<token>?…`)

The share view already ships a chrome-free presentation mode, driven by
URL params (parsed in `apps/docs/app/s/[token]/page.tsx`; individual
params beat the macro):

- `?fullscreen=1` — the macro: chrome hidden, `view=responsive`, zoom
  reset to 100% and locked. As of 8 Aug 2026 it also keeps the PLAIN
  responsive fill for pages taller than the window (no content-height
  artboard, no centring): the iframe document scrolls natively, so a
  home-screen install feels like the real product. The route also
  emits `apple-mobile-web-app` metadata plus the project's app icon
  (see STUDIO-STORAGE.md), so `/s/<token>?fullscreen=1` added to an
  iPhone/iPad home screen launches standalone with no browser chrome.
- `?ui=off` — chrome hidden only ("." reveals it).
- `?view=<id>` — open on a viewport from the share's set.
- `?zoom=fit` — open Fit-scaled instead of 100%.
- `?mode=dark|light` (8 Aug 2026) — force the colour mode for that
  open, beating the share's stored `color_mode`. Per-request only,
  nothing is written; carries across goto navigation because the mode
  is share-view state and flow navigation never reloads the page.

## Two delivery modes (want both)

### 1. React component — `@gradeui/embed`
`<GradeEmbed source={…} | shareId={…} theme={…} aspect={…} />`. For React/Next sites (yours). Wraps the kernel, no docs-app deps. The showcase-on-my-own-site case.

### 2. Hosted iframe — `embed.gradeui.com/e/<id>`
`<iframe src="https://embed.gradeui.com/e/<id>" …>` — the YouTube/CodePen model. Works on **any** site (blog, Webflow, Notion, client page), no npm, no React on the host. This is the one that makes Grade spread.

## Payload — point at a share id (the killer path)

Reuse the **share-link** record. You build in Studio, hit **"Embed"** (sibling to "Share"), and get an iframe snippet referencing that screen by id. Closes the loop: design in Studio → embed live → stays in sync when you update the screen. Inline-source embeds are the escape hatch; **by-id is the product.**

## The hard part — sizing, aspect ratio, resizing (non-trivial, yes)

An iframe has no intrinsic size, and cross-origin means the host **cannot read the iframe's content height** — it must be *reported*. Three strategies, in order of how much we already have:

1. **Aspect-ratio box (default).** Host wraps the iframe in a responsive `aspect-ratio` container (the classic `padding-top: 56.25%` / CSS `aspect-ratio`). Width is fluid, height derives from the ratio. Predictable, zero round-trips. Best default for showcases (heroes, shader backdrops, fixed-shape demos). The embed snippet ships this wrapper.
2. **Fixed device frame, scaled to fit.** For "this is a mobile screen" demos: render at a real device W×H (390×844 etc.) and CSS-scale to fit the host container — exactly the **Fit scale math already in `shared-screen.tsx`**. Reuse it.
3. **Fluid auto-height (the missing piece).** For content-driven embeds that should grow to their natural height: a `ResizeObserver` *inside* the iframe measures the content and **postMessages its height out**; a tiny host script (`embed.js`) listens and sets the iframe height. This is the gap your own comment in `shared-screen.tsx` flags ("Fit is reserved for when the iframe reports its content height"). Needs:
   - inside the sandbox: observe `document.documentElement` / root, debounce, `postMessage({ type: "grade:embed-size", height })`;
   - host side: `embed.js` (for the hosted mode) or the `<GradeEmbed>` component (React mode) listens, validates origin, sets height;
   - a handshake so the host knows which iframe sent it (id in the message).

**Recommendation:** aspect-ratio default + device-frame option (reuse Fit) + opt-in auto-height via `embed.js`. Ship 1 + 2 first (they're essentially done); 3 is the new engineering.

Also handle: responsive **breakpoints** evaluate against the iframe's own viewport (already true — that's why Fast Frame uses an iframe), colour-mode (light/dark, already on share links), and `prefers-reduced-motion` (shaders should still paint a still frame — already handled by ThreeScene).

## Security posture

Arbitrary JSX eval inside an iframe is fine *if sandboxed correctly*: `sandbox="allow-scripts"` **without `allow-same-origin`** for cross-site embeds, so the embed can't reach the host's cookies/DOM/storage. The hosted `embed.gradeui.com` origin isolates it further. Inline-source embeds from untrusted authors must never run same-origin to a sensitive host. postMessage handlers validate `event.origin`.

## What does NOT come along

Selection agent, comment pins, code view, the walker payload panel, the EDITING inspector — all editing chrome. An embed is **read or tweak**, not edit. So the embed kernel is lighter than Fast Frame. "Tweak" = live controls baked into the embedded source (e.g. a `ShaderControls` panel), not Studio selection.

## Viewer modes — "show my workings" (shipped June 2026)

Portfolio embeds want to demonstrate *process*, not just the finished render. Two read-only viewer modes shipped on `/e/<token>`, each as a param (pins the initial state) plus an optional corner chip (lets the visitor flip it):

- **Fidelity** — `?fidelity=wireframe` + `?fidelitytoggle=1`. Cross-fades all MediaSurface imagery out and the tiered placeholders back in, live and reversible. Pure CSS inside the sandbox: `grade:set-fidelity` stamps `data-fidelity` on the iframe root; the "MediaSurface fidelity" rules in `packages/ui/styles/globals.css` do the fade (`--gds-media-fidelity-fade`). The same rules power Studio's overflow-menu "Wireframe mode" tick.
- **Measure** — `?inspect=1` + `?inspecttoggle=1`. A hover inspector: outline + DS part name + rendered size in the screen's own virtual px (parent scale transforms don't skew the numbers). Deliberately NOT the selection agent — no click capture, no parent round-trips, visitor-safe. Protocol `grade:set-inspect`, handlers in both renderers per the two-agent rule.

**Follow-up (logged, not built): scripted highlighter tour.** An animated, fake-cursor walkthrough — glide between elements, highlight each with its measurements, optionally synced to the camera timeline (`?camera=`) and captions. That's STUDIO-DIRECTOR territory: model it as a `highlight` track in the director timeline (sibling of camera/cursor/caption tracks) so a tour is just a directed demo with measurement callouts, embeddable like any other. The hover inspector's overlay (outline + label) is the render primitive the track would drive.

## Relationship to the extraction

`grade-embed` and the `@gradeui/embed` / kernel extraction are the **same workstream**. The reusable kernel — iframe + postMessage bus + sucrase eval + pluggable component vocabulary + theme — is extracted once and consumed by: Studio (Fast Frame), the share view, and the embed. The coupling to break (per the extraction notes): `@/lib/chat-sandpack` vocabulary/rewrite rules → a passed-in vocabulary; `@/lib/themes` → a theme prop; drop walker/comments/sonner.

## Rollout

- **E0** — Extract the kernel (`@gradeui/embed`) from `FastIframeHost`: pluggable vocabulary + theme, no docs-app deps, `srcdoc` so it needs no route on the host.
- **E1** — React component `<GradeEmbed source|shareId aspect />` with aspect-ratio + device-frame sizing (reuse Fit). Use it on the personal site.
- **E2** — Hosted `embed.gradeui.com/e/<id>` + the **"Embed"** action in Studio's share UI (generate the snippet from a share link).
- **E3** — Auto-height: in-iframe ResizeObserver → `grade:embed-size` → `embed.js` host listener. Closes the `shared-screen` TODO.
- **E4** — Showcase gallery (the project-grid pattern) for "all my public embeds"; optional analytics on the hosted origin.

## See also

- `apps/docs/components/studio/fast-frame.tsx` — `FastIframeHost`, the kernel.
- `apps/docs/components/studio/shared-screen.tsx` — viewport vocabulary + Fit scale (reuse for sizing).
- `apps/docs/supabase/migrations/0010_share_links.sql` (+ `0011`, `0012`) — the share-link record an embed points at.
- `apps/docs/components/studio/project-home.tsx` — the grid/gallery pattern.
- `STUDIO.md` — the `grade:*` postMessage bus + two-renderer rule (add `grade:embed-size` here when E3 lands).
- `STUDIO-FILLS.md` — sibling; `BackgroundFill`/shaders are prime embed content.
