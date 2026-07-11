---
name: Card
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/card"
subcomponents: [CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardMedia, CardContent]
variants: [filled, transparent, border, transparent-flush]
props:
  - density? (default | condensed)
  - align? (left | center | right)
  - maxWidth? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - maxWidth — DEPRECATED since 2.16.0: Use Tailwind max-width utilities via className instead (DS-578)
when_to_use: Grouping related content with a visual boundary (form sections, detail panels, stat cards) Page-level content containers that need consistent padding and border styling Nested sub-sections within a parent card — use density='condensed' for compact inline panels (e.g., stat summaries, ranking grids, metric tiles) Do NOT use for: clickable list items (use List); modal content (use Dialog). LAYOUT RULE: CardHeader is a grid (title 1fr, CardAction natural-width) — keep CardAction SMALL (one or two buttons, a badge). NEVER put a search input, filter bar, or toolbar in CardAction; the wide action column squeezes the title into a sliver. Toolbars and search rows belong in CardContent, above the data they control.
aliases: [container, panel, box, wrapper, content card]
---

Contained surface with header, content, and footer sections. Full-width by default — constrain via className.

## Guidance

Card is a container component for grouping related content with visual separation. Custom implementation using Tailwind CSS.

### When to Use
- Dashboard widgets and metric displays
- Content sections with headers and actions
- Settings panels and form groupings
- Media cards with images or video thumbnails

### Features
- Full-width by default — width is controlled by the parent layout, not the card itself
- Four visual variants: Filled, Transparent, Border, Transparent Flush (opt-in flush layout)
- Two density modes: Default and Condensed for compact layouts like StatTile
- `CardTitle` supports `size` prop: `"default"` (24px) and `"small"` (16px) for nested or secondary headings
- `CardHeader` supports `align` prop: `"left"` (default grid), `"center"` (centred column), or `"right"` (right-aligned grid)
- `CardMedia` sub-component for images, videos, or visual content with automatic rounded clipping
- Compositional sub-components for flexible layouts
- Consistent padding and spacing across non-flush variants
- Transparent Flush variant removes horizontal padding for edge-to-edge layouts
- Accessible with proper semantic structure

### Sub-components

| Sub-component | Purpose |
|---|---|
| `CardHeader` | Header section containing title and description. Accepts `align` prop: `"left"`, `"center"`, or `"right"` |
| `CardTitle` | Title element within the header. Accepts `size` prop: `"default"` (24px) or `"small"` (16px) |
| `CardDescription` | Description text within the header |
| `CardAction` | Action area within the header for buttons/controls |
| `CardMedia` | Media container for images/videos with rounded clipping |
| `CardContent` | Main content area |
| `CardFooter` | Footer section for actions or metadata |

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "card") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
