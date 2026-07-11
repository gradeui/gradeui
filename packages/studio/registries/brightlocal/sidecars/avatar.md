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

Circular image with fallback initials for user profile pictures.

## Guidance

Avatar displays a user image with fallback for representing people. Built on [Radix UI Avatar](https://www.radix-ui.com/primitives/docs/components/avatar).

### When to Use
- User profile pictures and account displays
- Comment threads and activity feeds
- Team member lists and collaborator views

### Features
- Circular container with customizable sizes via Tailwind classes
- Automatic fallback to initials when image fails to load
- Group layout support with overlapping avatars
- Accessible alt text support for images

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "avatar") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
