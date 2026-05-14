---
name: HoverCard
import: "@gradeui/ui"
subcomponents: [HoverCardTrigger, HoverCardContent]
props:
  - HoverCard: open?, defaultOpen?, onOpenChange?, openDelay? (default 700), closeDelay? (default 300)
  - HoverCardTrigger: asChild?: boolean — usually a Link or Button
  - HoverCardContent: side?, align?, sideOffset?, alignOffset?, className?
when_to_use: Rich preview content surfaced on hover — user profile mini-cards on @-mentions, link previews, definition popups. Pointer-only by design (no touch-friendly trigger); pair with a click target for touch devices, or fall back to Popover. NEVER use HoverCard for critical info — if the user can't reach it via keyboard or touch, it might as well not exist for accessibility.
composes_with: [Avatar (user preview), Card (richer content), Link (the trigger)]
aliases: [hover card, hover preview, mention preview, profile peek, link preview]
---

```jsx
// User mention preview — pointer-only enrichment.
<HoverCard>
  <HoverCardTrigger asChild>
    <a href="/u/elena" className="font-medium underline">@elena</a>
  </HoverCardTrigger>
  <HoverCardContent className="w-72">
    <Row gap="sm" align="start">
      <Avatar>
        <AvatarImage src="/avatars/elena.png" />
        <AvatarFallback>EO</AvatarFallback>
      </Avatar>
      <Stack gap="xs">
        <span className="font-semibold">Elena Okafor</span>
        <span className="text-sm text-muted-foreground">
          Design lead · Joined Mar 2025
        </span>
      </Stack>
    </Row>
  </HoverCardContent>
</HoverCard>
```
