---
name: Tooltip
import: "@gradeui/ui"
subcomponents: [TooltipTrigger, TooltipContent, TooltipProvider]
props:
  - TooltipProvider: delayDuration? number (default 700) — ms hover before show; mount ONCE near the app root
  - TooltipProvider: skipDelayDuration? number (default 300) — ms gap that still feels like "same hover"
  - Tooltip: open?, defaultOpen?, onOpenChange?
  - TooltipTrigger: asChild?: boolean — usually wraps a Button or icon
  - TooltipContent: side? "top" | "right" | "bottom" | "left" (default "top"); align? "start" | "center" | "end"; sideOffset?: number
when_to_use: A short, non-essential label that explains a control on hover/focus — icon-only buttons in toolbars, abbreviated column headers, status dots. NEVER hide critical info inside a tooltip — they're invisible on touch and can be skipped by screen readers if implemented carelessly. For richer hover content use HoverCard. For inline help text that's always visible, use a description paragraph.
composes_with: [Button (icon-only), Toggle, TabsTrigger (the canonical tabs already have a `tooltip` prop that wraps this), Avatar (status badge meaning)]
aliases: [tooltip, tip, hover tip, hint, label on hover, help tag, hint, helper text bubble, info tip]
---

```jsx
// Icon-only Button with a tooltip — accessible name still set via aria-label.
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Open settings">
        <Settings />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Settings</TooltipContent>
  </Tooltip>
</TooltipProvider>
```
