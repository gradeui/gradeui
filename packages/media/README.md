# @gradeui/media

Server-side media generation for Grade — image generation today, video later.
Internal package, never published. Consumed by `apps/docs` (Studio + marketing
surfaces).

## Why this exists

Studio and the docs site both need on-demand stock imagery: marketing pages
where the same image gets reused across cards, product listings where
"replace all images on this page with images about {subject}" is a normal
operation, etc. Calling the model directly from a route handler ties knot
between provider, processing, storage, and HTTP — this package owns the first
three so route handlers stay thin.

## The pipeline

```
caller → cache lookup ─── hit ──→ public URL
            │
            └── miss → provider (Gemini Flash Image)
                          → processor (sharp: resize + format convert)
                          → storage (local-tmp in dev, Vercel Blob in prod)
                          → public URL
```

Providers, processors and storage drivers all sit behind interfaces, so any
one of them can be swapped without touching the call site.

## API

```ts
import { generateImage } from "@gradeui/media";

const { url, cached } = await generateImage({
  prompt: "A surfboard on a sun-bleached wooden floor",
  aspect: "4:3",       // 1:1 | 4:3 | 3:4 | 16:9 | 9:16   (default 16:9)
  format: "webp",      // webp | avif | png | jpeg        (default webp)
  quality: 80,         // 1-100                           (default 80)
  maxWidth: 1600,      // optional resize cap
});
```

`url` is always a stable public URL the browser can request directly. In dev
it's `/api/media/{hash}.{ext}` (served by the Next.js route at
`apps/docs/app/api/media/[file]/route.ts`); in prod it's the Vercel Blob CDN
URL.

The cache key is `sha256(prompt + aspect + style + format + quality + maxWidth + providerId)`,
truncated to 32 hex chars. Identical inputs always hit cache; any knob change
yields a separate artifact.

## Environment

| Variable | Where | Notes |
|---|---|---|
| `GEMINI_API_KEY` | dev + prod | Free tier from https://aistudio.google.com/ |
| `BLOB_READ_WRITE_TOKEN` | prod (Vercel) | Auto-injected when a Blob store is attached |
| `MEDIA_STORAGE_DRIVER` | optional | Force `local-tmp` or `vercel-blob` (otherwise picked from `process.env.VERCEL`) |

## Future work

- **R2 driver** — when Vercel Blob's 1 GB free tier runs out. Same interface,
  ~50 LOC.
- **Pollinations driver** — keyless fallback for prototyping / Storybook.
- **Video** — `generateVideo()` will sit alongside `generateImage()` with a
  similar provider/storage split. Not in v1.
- **Rate limiter** — currently lives in the route handler, not here. If we
  add a non-HTTP caller (e.g. a build-time script), move it down.
