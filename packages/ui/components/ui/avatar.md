---
name: Avatar
import: "@gradeui/ui"
subcomponents: [AvatarImage, AvatarFallback]
props:
  - Avatar: className? — set size via utilities (default h-10 w-10)
  - AvatarImage: src, alt
  - AvatarFallback: initials/icon rendered when image fails or loads
when_to_use: User/entity identity for PEOPLE — profile pictures, author rows, member lists, account headers. Circular by default; the AvatarFallback initials read as a person's name. Always include AvatarFallback so load failure doesn't leave a gap.
composes_with: [Card (in CardHeader), Table cells, Badge (placed next to for status), Skeleton (loading state)]
aliases: [profile picture, user image, account image, avatar, person glyph, user avatar, profile image, react native avatar]
notes: |
  Anti-patterns to avoid:

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
