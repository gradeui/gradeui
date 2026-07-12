---
name: Avatar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/avatar"
subcomponents: [AvatarImage, AvatarFallback]
props:
  - src? — TODO(review): type + one-line description from src
  - alt? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<Avatar dataHook="user-avatar">
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```
```jsx
<Avatar
  className="size-5"
  dataHook="avatar-default"
  storyDescription="20px"
>
  <AvatarImage
    alt="@shadcn"
    src="https://github.com/shadcn.png"
  />
  <AvatarFallback>
    CN
  </AvatarFallback>
</Avatar>
```
```jsx
<div className="flex -space-x-2">
  <Avatar
    className="size-8"
    dataHook="avatar-group-1"
    storyDescription="32px"
  >
    <AvatarImage
      alt="@shadcn"
      src="https://github.com/shadcn.png"
    />
    <AvatarFallback>
      CN
    </AvatarFallback>
  </Avatar>
  <Avatar
    className="size-8"
    dataHook="avatar-group-2"
    storyDescription="32px"
  >
    <AvatarImage
      alt="@maxleiter"
      src="https://github.com/maxleiter.png"
    />
    <AvatarFallback>
      LR
    </AvatarFallback>
  </Avatar>
  <Avatar
    className="size-8"
    dataHook="avatar-group-3"
    storyDescription="32px"
  >
    <AvatarImage
      alt="@evilrabbit"
      src="https://github.com/evilrabbit.png"
    />
    <AvatarFallback>
      ER
    </AvatarFallback>
  </Avatar>
</div>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-avatar--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
