---
name: Tabs
import: ./components/ui/tabs
subcomponents: [TabsList, TabsTrigger, TabsContent]
props:
  - Tabs: defaultValue?, value?, onValueChange?, orientation?
  - TabsTrigger: value: string — matches a TabsContent value
  - TabsContent: value: string — matches a TabsTrigger value
when_to_use: A small set of peer views within one surface (2–5 tabs). For primary nav use Side Menu/routing. For filters use a filter control, not tabs.
composes_with: [Card (tabs inside a card body), Dialog]
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
