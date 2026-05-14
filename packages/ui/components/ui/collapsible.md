---
name: Collapsible
import: "@gradeui/ui"
subcomponents: [CollapsibleTrigger, CollapsibleContent]
props:
  - Collapsible: open?: boolean — controlled open state
  - Collapsible: defaultOpen?: boolean — uncontrolled initial state
  - Collapsible: onOpenChange?: (open: boolean) => void
  - CollapsibleTrigger: children: React.ReactNode — the clickable header (often a Button asChild)
  - CollapsibleContent: children: React.ReactNode — the content that animates in/out
when_to_use: A single show/hide reveal — "Show advanced settings" rows, expandable inline help, "More details" sections inside cards. For multiple rows of expandable content where one-at-a-time matters, reach for Accordion. For a separate panel that floats above content, use Popover.
composes_with: [Button (as the trigger, asChild), Card (expandable settings group), Row (header + chevron)]
aliases: [collapsible, expand, show more, disclosure, advanced settings]
---

```jsx
<Collapsible defaultOpen={false}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" size="sm">
      Advanced settings <ChevronDown />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-2 pt-2">
    <Label htmlFor="cors">CORS origins</Label>
    <Input id="cors" placeholder="https://example.com" />
  </CollapsibleContent>
</Collapsible>
```
