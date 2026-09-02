---
name: DateStamp
import: "@brightlocal/proposal"
props:
  - label? — The word in front of the date ("Last updated", "Last activity", "Stopped"). Omit for the date alone.
  - value — The date, ISO preferred ("2026-09-02T06:00"). Rendered through formatDate; if it carries a time, formatDateTime hangs the full stamp off a dotted underline on hover and keyboard focus.
  - dataHook?: string — Instance name; the underlined date derives "<dataHook>-date".
  - className?: string — LAYOUT ONLY (alignment inside its row) — never restyle the stamp.
when_to_use: ANY date shown as a status rather than as data — the page header's "Last updated", a card's "Last activity", a stopped campaign's date. Gives every one of them the same 12px muted treatment and the same dotted-underline-plus-tooltip affordance, so a date on a card and a date in a header read identically. Do NOT use for a date inside a table cell or a form field (that is data, not status) — use formatDate directly. Never hand-roll a tooltip on a date; this is why this exists.
composes_with: [PageHeader, Card]
aliases: [last updated, timestamp, date stamp, freshness]
---

A date shown as status, with its exact timestamp one hover away.

## Guidance

Lifted out of `PageHeader` when the Get Reviews campaign cards needed the same
affordance in their top-right corner. Two implementations of one affordance is
how they end up differing, so there is one.

The date is dot-underlined and carries the full stamp on hover or keyboard
focus. It mounts its own `TooltipProvider`, so it is safe on a surface that
has not mounted one at its root.
