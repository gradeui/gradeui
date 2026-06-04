# STUDIO-CANVAS — the freeform AI canvas

> Sibling docs: [STUDIO-CAPTURE.md](./STUDIO-CAPTURE.md) (the poster
> economics this doc leans on), [STUDIO-CHAT.md](./STUDIO-CHAT.md) (the
> tool-call protocol AI placement rides), [STUDIO-STORAGE.md](./STUDIO-STORAGE.md)
> (the assets pasted objects become), [STUDIO-DIRECTOR.md](./STUDIO-DIRECTOR.md)
> (camera keyframes over the same coordinate system),
> [STUDIO-EMBED.md](./STUDIO-EMBED.md) (the cross-origin workstream the
> sandbox split shares).

## What this is

Today the focused canvas frames exactly one thing: a live screen in an
iframe. The June 2026 camera work made that frame *feel* like a canvas —
pointer-anchored pinch (10%–5000%), drag/wheel pan through an imperative
gesture session, bounded coordinates, Design/Interact modes — but the
substrate still only holds one object, and that object is always an app.

This doc describes the step from "a camera pointed at one screen" to
**a canvas of many objects**: screens, images, media placeholders,
notes — placed freeform, pasted by hand or emitted by the AI with
coordinates. A moodboard you can talk to; a flow map whose frames are
live prototypes; the surface the Director records camera moves over.

Two principles carried over from the camera work:

1. **The camera is not React.** Gestures write composited transforms
   straight to the DOM and commit state once on settle. Nothing in this
   doc may put per-frame work back on the React render path.
2. **Bounded by choice, infinite by config.** The clamp
   (`clampPan`, the keep-visible rule) is a product decision, not an
   architectural one. The scene graph below is coordinate-unbounded;
   whether a given surface clamps is a flag.

## The object model (scene graph)

One table, one discriminated union — the same shape `designs` and
`assets` already use:

```ts
interface CanvasObject {
  id: string;
  projectId: string;
  /** World-space rect. Unbounded floats — the canvas itself has no
   *  edges; clamping is a per-surface presentation choice. */
  x: number; y: number; w: number; h: number;
  rotation?: number;        // notes/images; screens stay axis-aligned
  z: number;                // sibling order
  kind:
    | "screen"              // payload: designId — a live Grade screen
    | "image"               // payload: assetId  — STUDIO-STORAGE asset
    | "media"               // payload: MediaSource descriptor (unfilled
                            //   slot the Fill pipeline resolves in place)
    | "note"                // payload: rich text (TipTap doc)
    | "group";              // payload: childIds — moodboard clusters
  payload: Record<string, unknown>;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}
```

Storage: a `canvas_objects` table with RLS mirroring `project_access`,
written through the STUDIO-PERSISTENCE dirty-tracking rules (content
signature, debounce, flush-on-leave). Every mutation logs through
`logEvent` (STUDIO-AUDIT): "Ali placed an image on the canvas at …".

`kind: "screen"` does NOT copy the screen — it *places* an existing
design. The design row stays the source of truth; deleting the canvas
object never deletes the screen. (Same pointer discipline as
`remixOf` in STUDIO-THEMES.)

## Rendering: three tiers on one camera

All objects are children of the existing camera wrapper — they ride
`translate(pan) scale(zoom)` for free. Per kind:

| Tier | Kinds | Cost | Mechanism |
|---|---|---|---|
| Plain DOM | image, media, note, group | ~free | positioned divs; Grade components render same-realm (portals need a camera-local portal container so dropdowns don't escape) |
| Poster | screen (far from viewport / many) | one raster | STUDIO-CAPTURE capture: rendered DOM + theme vars + media map |
| Live iframe | screen (near viewport, few at a time) | heavy | the existing Fast Frame, promoted on approach |

The promote/demote policy is STUDIO-CAPTURE's grid policy generalised
from "tiles in a grid" to "objects in a viewport": live frames within
the camera's view (cap N≈3), posters beyond it, promotion on
approach/interaction. Viewport culling (don't mount DOM for objects far
outside the view) is the only new perf machinery the canvas needs.

`kind: "media"` objects are MediaSurface placeholders *on the canvas* —
same descriptor, same `sourceKey`, same Fill flow and pending shimmer
as in-screen slots. Paste a prompt, get a shimmering frame, Fill
resolves it via the generative provider. A moodboard that generates
itself.

## AI placement

The chat emits objects the same way it emits everything else — through
the STUDIO-CHAT tool-call protocol. One new tool:

```ts
placeObjects({
  objects: Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">>,
  /** Optional camera move to frame what was placed — a single
   *  STUDIO-DIRECTOR camera shot. */
  frame?: { x: number; y: number; w: number; h: number },
})
```

Placement intelligence lives promptside: "three variants of this
screen" → three `screen` objects in a row with consistent gutters;
"moodboard for a banking app" → a grid of `media` placeholders with
descriptions the Fill pipeline can run with. The model gets the current
viewport rect + occupied rects in context so it places into empty space
near where the user is looking. `frame` lets the AI end its turn by
gliding the camera to its work — the same `useCameraTimeline` lerp the
embed already ships.

Paste/drop is the manual twin: image paste → `uploadAsset` →
`image` object at the cursor's world position (screen→world is the
inverse of the camera transform — one line now that the camera is
explicit). Text paste → `note`. A dragged screen tile → `screen`
placement.

## Bounded ↔ infinite

`clampPan` keeps today's single-screen surfaces honest (an artboard you
can't lose). The canvas surface passes `clamp: false` — or, better, a
*content-derived* clamp: bounds = union of object rects + slack, so the
canvas is exactly as big as what's on it. Infinite in capability,
bounded in feel. A minimap (poster thumbnails on a tiny fixed camera)
becomes worthwhile around the same time.

## The sandbox origin (security prerequisite)

> Actionable as a single work item:
> [SECURITY-SANDBOX-SPLIT.md](./SECURITY-SANDBOX-SPLIT.md) — full
> checklist (Vercel/domain steps, file-by-file hardening list,
> acceptance criteria). The decision landed on `sandbox.gradeui.com`
> via host-routed middleware, env-driven with same-origin dev fallback.

The moment canvas content (or shares, or community remixes) can carry
*someone else's* generated code, the same-origin `/fast-sandbox` iframe
becomes a stored-XSS vector: same-origin iframes can reach
`window.parent.document` and the parent's localStorage — including the
Supabase session. postMessage hygiene does not help while the origin is
shared; the channel isn't the hole, the origin is.

**Decision: the sandbox moves to its own origin before any
other-people's-code surface ships.** Concretely:

- A separate apex domain (not a subdomain — host-only-cookie mistakes
  on `.gradeui.com` are too easy), e.g. `gradesbx.com`, serving ONLY
  the sandbox document.
- Same monorepo: either a second Vercel project pointed at a tiny
  `apps/sandbox` Next app, or the same project with host-based
  middleware that rewrites the sandbox host to `/fast-sandbox` and
  404s everything else. Iframe src comes from
  `NEXT_PUBLIC_SANDBOX_ORIGIN` (dev falls back to same-origin for DX).
- postMessage hardening becomes meaningful and mandatory: explicit
  `targetOrigin` both directions, `e.origin` + `e.source` checks on
  every handler, payload validation. The same-origin conveniences
  (contentDocument polling for pins/content-height) convert to
  messages.
- CSP on sandbox responses: `frame-ancestors` limited to the app,
  `connect-src` whitelisted (media providers, nothing else) so a
  malicious screen can't exfiltrate what little it can see.

## Rollout

- **K0 — scene graph substrate.** `canvas_objects` table + RLS +
  migration; CRUD through the storage adapter; `logEvent` wiring. No UI.
- **K1 — objects render.** Plain-DOM tier on the existing camera:
  image / note / media objects, viewport culling, world↔screen helpers.
  Paste/drop for images + text. Canvas surface sets content-derived
  bounds.
- **K2 — screens as objects.** `screen` placements: poster tier via
  STUDIO-CAPTURE, live-frame promotion (cap N), selection routes to the
  existing inspector.
- **K3 — AI placement.** `placeObjects` tool + viewport context in the
  prompt; camera `frame` moves on completion.
- **K4 — sandbox origin split.** The security prerequisite above —
  gates any sharing/community exposure of K1–K3 content.
- **K5 — canvas niceties.** Groups, minimap, multi-select drag,
  alignment guides; Director recording over canvas camera moves.

K0–K2 are independent of the AI work and individually shippable; K4 is
orthogonal and can land any time earlier (it should land before public
shares get canvas content, full stop).
