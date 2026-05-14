---
name: Tabs
import: "@gradeui/ui"
subcomponents: [TabsList, TabsTrigger, TabsContent]
sizes: [sm, md, lg]
props:
  - Tabs: defaultValue?, value?, onValueChange?, orientation?
  - TabsList: size? (sm | md | lg, default md) — t-shirt scale aligned with Button/ToggleGroup heights; cascades to every TabsTrigger via context so set it once on the list
  - TabsTrigger: value: string — matches a TabsContent value; tooltip?: string — when set, wraps the trigger in the design-system Tooltip and auto-applies aria-label (useful for icon-only triggers); requires a TooltipProvider somewhere above the tabs
  - TabsContent: value: string — matches a TabsTrigger value
when_to_use: A small set of peer views within one surface (2–5 tabs). For primary nav use Side Menu/routing. For filters use a filter control, not tabs.
composes_with: [Card (tabs inside a card body), Dialog, TooltipProvider (required for tooltip prop)]
aliases: [tabs, tab strip, tab bar]
---

```jsx
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="details">…</TabsContent>
  <TabsContent value="activity">…</TabsContent>
</Tabs>
```

```jsx
// Icon-only triggers — `tooltip` adds the design-system Tooltip + aria-label.
<TooltipProvider>
  <Tabs defaultValue="preview">
    <TabsList size="sm">
      <TabsTrigger value="preview" tooltip="Preview"><Eye /></TabsTrigger>
      <TabsTrigger value="code" tooltip="Code"><Code /></TabsTrigger>
    </TabsList>
    <TabsContent value="preview">…</TabsContent>
    <TabsContent value="code">…</TabsContent>
  </Tabs>
</TooltipProvider>
```
