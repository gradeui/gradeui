---
name: TypographyH1
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/typography"
subcomponents: [TypographyH2, TypographyH3, TypographyH4, TypographyP, TypographyBlockquote, TypographyInlineCode, TypographyCode, TypographyLead, TypographyLarge, TypographySmall, TypographyMuted]
props:
  - key?
  - asChild?: boolean — Render as a different element using Radix Slot pattern. When true, merges props onto the child element.
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics. Defaults to component name if not provided.
  - trackingLabel?: string — Tracking label for analytics context. Additional context for tracking events.
  - ref? — Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
when_to_use: Page and section headings (H1–H4) with consistent font and spacing Body text, lead text, muted captions, and inline code Any heading or paragraph that should follow the design system type scale Do NOT use for: display-sized hero text larger than H1 — not yet covered, use custom Tailwind classes; form labels (use Label or FieldLabel). Use Label for form input labels — Typography is for content headings and body text.
composes_with: [Label]
aliases: [typography]
---

Styled typographic elements: headings (H1-H4), paragraph, blockquote, list, code, lead, and muted text.

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "typography") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
