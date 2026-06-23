---
name: MediaSurface
import: "@gradeui/ui"
props:
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" — when omitted, derived from `hint` (album/product/food → square, portrait/poster → portrait, landscape → wide, video/audio/embed/generic → video)
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "none") — driven by `--gds-media-radius` CSS var. Square by default so a slot mounted flush at the top of a Card lets the Card clip it; set `lg`/`xl` for a standalone rounded image
  - border?: boolean (default false)
  - loading?: boolean — renders the muted skeleton overlay
  - hint?: "album" | "portrait" | "landscape" | "poster" | "product" | "food" | "video" | "audio" | "embed" | "3d" | "generic" (default "generic") — picks the placeholder glyph + the default aspect + the future generation provider
  - alt?: string — becomes the eventual `<img alt>`; also drives the placeholder caption and small-tier initials
  - instanceId?: string — stable per-instance id stamped as `data-gds-instance-id`. Use when rendering MediaSurfaces from a data array (`.map(item => <MediaSurface instanceId={item.id} …/>)`): it's how Studio's selection + Fill flows tell one card apart from its siblings and patch only that entry's data
  - source?: { kind, …per-kind fields } — structured metadata for the generation pipeline. Shapes per kind — album: { artist, title, year? } · poster: { title, year? } · portrait: { name?, role? } · landscape: { location?, mood? } · product: { name?, brand? } · food: { dish?, cuisine? } · generic: { prompt } · video/audio/embed/3d: no fields
  - src?: string — when set, renders an `<img>` filling the slot via object-cover; the wrapper keeps its chrome
  - glyph?: ReactNode — per-instance override of the hint-derived placeholder glyph (escape hatch for unusual slots)
  - overlay?: ReactNode — decorative layer rendered ABOVE the media/placeholder (play buttons, hover gradients, corner badges, progress bars). Does NOT suppress the placeholder — use this for decoration, use `children` for replacement
  - emptyState?: "auto" | "icon" | "none" | ReactNode — "auto" (default) renders the size-tiered placeholder; "icon" is a legacy alias; "none" disables; a node fully overrides
  - className?: string
  - children?: ReactNode — escape hatch for putting a custom `<video>`, `<canvas>`, Rive runtime, etc. inside. When supplied, the placeholder is suppressed
when_to_use: The canonical media slot for ALL non-person imagery — album art, posters, hero images, landscape photos, video and 3D containers. Pass `hint` + `alt` + (optionally) `source` so the empty-state placeholder is meaningful and the generation pipeline can later fill the slot with a real image. Use directly for declarative slots; the higher-level VideoPlayer / RivePlayer / ThreeScene wrap this for runtime-heavy media.
composes_with: [Card (as the image slot), CardBlock, MediaBlock, VideoPlayer, RivePlayer, ThreeScene]
aliases: [media, image slot, media slot, image placeholder, cover, thumbnail, poster slot, image, image view, image well, imagebackground, asyncimage, react native image, fastimage]
notes: |
  Anti-patterns to avoid:

  - DO NOT wrap <Avatar> inside <MediaSurface> to get a 2-letter initials
    fallback. That conflates two primitives. Set `alt` + `hint` on
    MediaSurface directly — the placeholder already renders initials at
    small sizes derived from `alt`.
  - DO NOT use <Avatar> for album art, posters, products, food, landscapes,
    etc. Avatar is for PEOPLE only (circular, social context). Use
    MediaSurface with the appropriate `hint`.
  - DO NOT inline manual gradient backgrounds (`bg-gradient-to-br …`) on
    MediaSurface as a "placeholder vibe" — the empty-state placeholder is
    already styled via `--gds-media-placeholder-bg/-fg` and themes with
    the rest of the design system.

  When you have a real image URL, pass it as `src=`. The wrapper keeps its
  aspect/radius/border chrome and fills with object-cover.
---

```jsx
{/* Empty placeholder — model emits this before generation has filled the slot */}
<MediaSurface
  hint="album"
  alt="Travelling Without Moving — Jamiroquai"
  source={{ kind: "album", artist: "Jamiroquai", title: "Travelling Without Moving" }}
  radius="md"
/>

{/* Filled — same component, now with a src */}
<MediaSurface
  hint="album"
  alt="Travelling Without Moving — Jamiroquai"
  src="https://coverartarchive.org/release/.../front-500.jpg"
  radius="md"
/>

{/* Video container — children escape hatch */}
<MediaSurface aspect="video" radius="lg">
  <video src="/intro.mp4" controls className="absolute inset-0 h-full w-full" />
</MediaSurface>
```
