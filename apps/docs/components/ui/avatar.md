---
name: Avatar
import: ./components/ui/avatar
subcomponents: [AvatarImage, AvatarFallback]
props:
  - Avatar: className? — set size via utilities (default h-10 w-10)
  - AvatarImage: src, alt
  - AvatarFallback: initials/icon rendered when image fails or loads
when_to_use: User/entity identity in lists, cards, headers. Always include AvatarFallback so load failure doesn't leave a gap.
composes_with: [Card (in CardHeader), Table cells, Badge (placed next to for status), Skeleton (loading state)]
---

```jsx
<Avatar>
  <AvatarImage src="/ada.jpg" alt="Ada Lovelace" />
  <AvatarFallback>AL</AvatarFallback>
</Avatar>
```
