---
name: Tabs
import: "@gradeui/ui"
subcomponents: [TabsList, TabsTrigger, TabsContent]
sizes: [sm, md, lg]
variants: [pill, underlined]
props:
  - Tabs: defaultValue?, value?, onValueChange?, orientation?
  - TabsList: size? (sm | md | lg, default md) — t-shirt scale aligned with Button/ToggleGroup heights; cascades to every TabsTrigger via context so set it once on the list
  - TabsList: variant? (pill | underlined, default pill) — `pill` is the shadcn chip-on-muted look; `underlined` is the minimal text + bottom-border treatment (formerly the separate SimpleTabs component, collapsed into Tabs in May 2026). Cascades to triggers.
  - TabsTrigger: value: string — matches a TabsContent value; tooltip?: string — when set, wraps the trigger in the design-system Tooltip and auto-applies aria-label (useful for icon-only triggers); requires a TooltipProvider somewhere above the tabs
  - TabsContent: value: string — matches a TabsTrigger value
when_to_use: A small set of peer views within one surface (2–5 tabs). For primary nav use Side Menu/routing. For filters use a filter control, not tabs. Pick `variant="pill"` for app chrome (settings panels, in-card tab strips). Pick `variant="underlined"` for marketing/docs pages and browser-tab-style treatments.
composes_with: [Card (tabs inside a card body), Dialog, TooltipProvider (required for tooltip prop)]
aliases: [tabs, tab strip, tab bar, tab view, tabbed interface, pageviewcontroller, react native tab view, underlined tabs, page tabs, segment switcher, simple tabs]
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

```jsx
// Underlined variant — replaces the old SimpleTabs component. Use
// `variant="underlined"` on the TabsList and it cascades to triggers.
<Tabs defaultValue="profile">
  <TabsList variant="underlined">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">…</TabsContent>
  <TabsContent value="team">…</TabsContent>
  <TabsContent value="billing">…</TabsContent>
</Tabs>
```
