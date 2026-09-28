---
name: TypographyHeading
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/typography-heading"
subcomponents: [TypographyText]
props:
  - level: 1 | 2 | 3 | 4 | 5 | 6
  - variant?: "display" | "page" | "section" | "subsection" | "compact"
  - color?: "default" | "muted"
  - align?: "left" | "center" | "right"
  - tabular?: boolean
  - asChild?: boolean
  - dataHook: string
  - trackingEl?: string
  - trackingLabel?: string
when_to_use: Every heading and every run of body copy, on the semantic type scale that ships in @brightlocal/ui-components 3.0.0 and @brightlocal/tokens 1.0.0 (DS-714). Pick by ROLE, never by size. TypographyHeading takes a REQUIRED level (the h1 to h6 tag, chosen for the document outline) and a variant (the look, independent of level). variant "page" is the page title, Poppins 24/32, exactly one per screen. "section" is a card, dialog or sheet title, Inter 20/28. "subsection" is a heading inside a card or a panel header, Inter 16/24. "compact" is the smallest heading, for dense surfaces such as step titles. "display" is Poppins 36/40 for brand moments only, never a default. TypographyText (import from "@brightlocal/ui-components/typography-text") is body copy. variant "body" (default, 16/24), "body-sm" (14/20, dense lists and app chrome), "body-xs" (12/16, helper text, captions, timestamps, stat labels), "metric" (a large number that is the point of its card), "code" (an identifier a user copies). color "muted" de-emphasises by colour only; "destructive" is error text, always paired with an icon or wording. asChild renders the style on your own element. Both REQUIRE dataHook. Do not add raw text sizes, weights or font families on top of a role (tailwind-merge now knows the scale, so a raw size REPLACES the role). DEPRECATED in 3.0.0 (DS-714), never emit them. TypographyH1 becomes TypographyHeading level 1 variant page. TypographyH2 becomes level 2 variant section. TypographyH3 becomes level 3 variant subsection. TypographyH4 becomes level 4 variant subsection. TypographyP becomes TypographyText. TypographyLead becomes TypographyText color muted. TypographySmall becomes TypographyText variant body-sm. TypographyMuted becomes TypographyText variant body-sm color muted. TypographyLarge becomes a subsection heading or plain TypographyText. TypographyBlockquote and TypographyList become TypographyText asChild around a blockquote or ul. TypographyInlineCode becomes a code element with the text-code-inline utility. TypographyCode becomes TypographyText variant code. Do NOT use for form labels (use Label or FieldLabel).
composes_with: [Label, Card, GlobalLayoutContentHeader]
aliases: [typography, heading, headings, page title, paragraph, muted text, TypographyH1, TypographyH2, TypographyH3, TypographyH4, TypographyP, TypographyLead, TypographyLarge, TypographySmall, TypographyMuted, TypographyBlockquote, TypographyList, TypographyInlineCode, TypographyCode]
---

The semantic type scale (DS-714, @brightlocal/ui-components 3.0.0). Two components cover it: TypographyHeading for headings, TypographyText for everything else. The level is the outline; the variant is the look; the two are chosen separately.

```jsx
<TypographyHeading level={1} variant="page" dataHook="page-title">
  Review Manager
</TypographyHeading>
```
```jsx
<TypographyHeading level={2} variant="section" dataHook="directories-title">
  Directories
</TypographyHeading>
<TypographyText variant="body-sm" color="muted" dataHook="directories-intro">
  Where your business listing appears and how accurate it is.
</TypographyText>
```
```jsx
<TypographyText variant="body-xs" color="muted" dataHook="stat-label">
  Average position
</TypographyText>
<TypographyText variant="metric" tabular dataHook="stat-value">
  4.2
</TypographyText>
```

## Deprecated (3.0.0, DS-714)

TypographyH1, TypographyH2, TypographyH3, TypographyH4, TypographyP, TypographyLead, TypographyLarge, TypographySmall, TypographyMuted, TypographyBlockquote, TypographyList, TypographyInlineCode and TypographyCode still ship in 3.0.0 but are deprecated. Their replacements are listed in when_to_use above. The old H1 was 48px; the scale's page title is 24px. The nearest to the old look is variant display, Poppins 36/40, reserved for brand moments (the DS's own deprecation note calls display "the 48px look", but tokens 1.0.0 set it at 36/40).

<!-- Rewritten by hand for @brightlocal/ui-components 3.0.0 (28 Sep 2026) from the typography-heading, typography-text and typography .d.ts JSDoc. The earlier version was harvested from BrightLocal's MCP server (get_component_api "typography"); re-running harvest-brightlocal-mcp.mjs would overwrite this file. -->
