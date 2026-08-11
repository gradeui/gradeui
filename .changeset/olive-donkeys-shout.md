---
"@gradeui/ui": minor
---

Interactive cards, row-sized sidebar icons, quieter soft badges, and a
sidebar footer spacing seam.

- **Card** gains `interactive`: the whole card becomes the click target,
  with pointer, keyboard focusability and a hover/focus treatment, and any
  trailing `Button` inside lights at the same moment so a card and its
  chevron read as one affordance rather than two. On dark surfaces a drop
  shadow barely registers, so the hover cue leads with a one-step surface
  lift (card → muted) plus a brighter border, carrying the shadow only as a
  secondary hint. Pair it with a `Button asChild` wrapping a span, so there
  is no nested interactive control inside a clickable region.

- **SidebarItem / SidebarTreeItem** size their leading glyph to the row —
  20px at size `md`, 16px at `sm` — instead of pinning 16px regardless. A
  16px icon in an `md` row read undersized against its 14px label. This is a
  default, not a pin: the existing `:not([class*='size-'])` idiom means a
  `size-*` class on the icon still wins.

- **SidebarFooter** gains `--gds-sidebar-footer-px` / `--gds-sidebar-footer-py`,
  matching the tuning seam the header, content and section already had, so an
  app can give a footer identity block room without reaching past the
  component. Defaults are the previous values, so nothing moves.

- **Badge** soft variants (`success-soft`, `warning-soft`, `destructive-soft`,
  `info-soft`, `highlight-soft`) drop their 30%-alpha status hairline. On a
  dark surface that ring read as a hard bright outline around a chip whose
  fill barely separates from the card behind it. The tint carries the status;
  the ring only added noise, and light mode loses nothing because the fill was
  always doing the work.
