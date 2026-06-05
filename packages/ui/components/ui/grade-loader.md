# GradeLoader

The branded indeterminate loader — the Grade G-arrow mark with a diagonal
shimmer sweeping through it. Use it for EVERY "working, unknown duration"
moment instead of a generic spinner: fetching, compiling, warming a shader,
waiting on AI.

props:
  - size?: "sm" | "md" | "lg" | "xl" | number — mark size (16/24/32/48px). Default "md".
  - label?: string — accessible status text; shown visually with showLabel. Default "Loading…"; pass "" to silence.
  - showLabel?: boolean — render the label as a caption under the mark. Default false.

when_to_use:
  - Indeterminate waits: data fetching, AI generation in flight, preview compiling, media/shader warm-up, route transitions.
  - Centered in an empty panel/card region while its content loads (pair with size="lg" + showLabel).
  - NOT for determinate progress — use Progress when you can show a fraction.
  - NOT a skeleton — use Skeleton when the layout shape is known and content is imminent.

composes_with:
  - Card / panel bodies (centered placeholder state)
  - Button (size="sm" inline while an action is pending)
  - Motion scene boundaries / media surfaces while heavy content warms
  - EmptyState (loading precursor before empty/error variants)

aliases: loader, spinner, loading indicator, busy, indeterminate, grade mark loader, branded spinner

notes:
  - Paints with currentColor — set text colour on a parent (`text-muted-foreground`, `text-white` over footage).
  - The shimmer highlights with oklch(var(--brand-1)) when brand pops are present; degrades to currentColor.
  - prefers-reduced-motion swaps the sweep for a gentle opacity pulse.
  - Announces via role="status"; the label is always available to screen readers.
