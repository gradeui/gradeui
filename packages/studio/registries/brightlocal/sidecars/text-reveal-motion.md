---
name: TextRevealMotion
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/text-reveal-motion"
props:
  - holdTime? — TODO(review): type + one-line description from src
  - shimmer? — TODO(review): type + one-line description from src
  - gradientFrom? — TODO(review): type + one-line description from src
  - gradientTo? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

## Guidance

Animated text reveal with a rolling shape-morphing ball.

The ball rolls across each child, revealing it via clip-path, holds, then rolls back and cycles to the next child. Works with any Typography component as children.

- Ball size auto-scales to 1.5× the children's font-size
- Spring-physics driven rolling animation
- Shape morphing (circle, star, starburst) during roll and hold
- Ball keeps animating during hold phase
- Shimmer effect after reveal
- Respects `prefers-reduced-motion`

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "text-reveal-motion") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
