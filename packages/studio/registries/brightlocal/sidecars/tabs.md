---
name: Tabs
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/tabs"
subcomponents: [TabsList, TabsTrigger, TabsContent]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - lazyMount?: boolean — Only mount tab panel content when the tab is first activated (opt-in)
  - unmountOnExit?: boolean — Unmount tab panel content when the tab becomes inactive
  - value? — The controlled value of the active tab
  - defaultValue? — The default value of the active tab (uncontrolled)
  - onValueChange? — Callback when the active tab changes
when_to_use: Do NOT use for: page navigation (use NavigationMenu); step-by-step wizards.
aliases: [tab bar, tab group, tabbed interface]
---

```jsx
<Tabs defaultValue="account" dataHook="tabs">
  <TabsList dataHook="tabs-list">
    <TabsTrigger value="account" dataHook="account-tab">
      Account
    </TabsTrigger>
    <TabsTrigger value="password" dataHook="password-tab">
      Password
    </TabsTrigger>
  </TabsList>
  <TabsContent value="account" dataHook="account-content">
    Account content
  </TabsContent>
  <TabsContent value="password" dataHook="password-content">
    Password content
  </TabsContent>
</Tabs>
```
```jsx
type ReportTab = "lsg" | "lrt" | "ct";

const [tab, setTab] = useState<ReportTab>("lsg");

<Tabs<ReportTab> value={tab} onValueChange={setTab} dataHook="report-tabs">
  <TabsList>
    <TabsTrigger value="lsg">Local Search Grid</TabsTrigger>
    <TabsTrigger value="lrt">Local Rank Tracker</TabsTrigger>
    <TabsTrigger value="ct">Citation Tracker</TabsTrigger>
  </TabsList>
</Tabs>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-tabs--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
