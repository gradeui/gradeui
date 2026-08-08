---
name: Avatar
import: "@gradeui/ui"
element: span
subcomponents: [AvatarImage, AvatarFallback]
sizes: [2xs, xs, sm, md, lg, xl]
props:
  - size? (2xs | xs | sm | md | lg | xl) — t-shirt scale, 20px → 80px; default md (40px). xs for chat message rows, sm for comments/dense threads, lg/xl for profile headers. Prefer this over h-*/w-* className utilities.
  - AvatarImage: src, alt
  - AvatarFallback: tone? (muted | primary | violet | amber | emerald | sky | rose | plum | lime) — tinted bg/text pair. Reach for explicit tones when each author needs a stable colour mapping (chat avatars, comment threads, member lists); default muted.
  - AvatarFallback: children — initials (or a small icon), rendered while the image loads or when it fails. Initials auto-scale with the avatar's size (~0.4 of the circle; md = 16px) — do NOT add text-* classes to correct their size.
when_to_use: User/entity identity for PEOPLE — profile pictures, author rows, member lists, account headers. Circular by default; the AvatarFallback initials read as a person's name. Always include AvatarFallback so load failure doesn't leave a gap.
composes_with: [Card (in CardHeader), Table cells, Badge (placed next to for status), Skeleton (loading state), Message (in the avatar slot)]
aliases: [profile picture, user image, account image, avatar, person glyph, user avatar, profile image, react native avatar]
notes: |
  Anti-patterns to avoid:

  - DO NOT pass `initials` as a prop on <Avatar> — that prop does not
    exist. Initials are the CHILDREN of <AvatarFallback>:
    `<Avatar><AvatarFallback>AL</AvatarFallback></Avatar>`.
  - DO NOT size with className utilities (h-7 w-7) — use the `size`
    prop so the scale stays on the t-shirt tokens.
  - DO NOT use Avatar for album art, posters, product photos, landscape
    images, or anything that isn't a person. Use <MediaSurface> with the
    appropriate `hint` ("album", "poster", "product", "landscape", etc.) —
    MediaSurface also renders initials-style fallbacks at small sizes
    derived from `alt`, so you don't lose the affordance.
  - DO NOT wrap Avatar inside MediaSurface to get an initials fallback.
    MediaSurface has that built in via `alt` + the size-tiered placeholder.
---

```jsx
<Avatar>
  <AvatarImage src="/ada.jpg" alt="Ada Lovelace" />
  <AvatarFallback>AL</AvatarFallback>
</Avatar>
```

```jsx
// Chat / comment rows — small size + stable per-author tone.
<Avatar size="xs">
  <AvatarFallback tone="violet">A</AvatarFallback>
</Avatar>
<Avatar size="sm">
  <AvatarFallback tone="amber">B</AvatarFallback>
</Avatar>
```

```jsx
// Profile header — large, with image + initials fallback.
<Avatar size="lg">
  <AvatarImage src="/ali.jpg" alt="Ali Driver" />
  <AvatarFallback tone="primary">AD</AvatarFallback>
</Avatar>
```
