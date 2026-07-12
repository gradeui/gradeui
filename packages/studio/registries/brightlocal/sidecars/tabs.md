---
name: Tabs
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/tabs"
subcomponents: [TabsList, TabsTrigger, TabsContent]
props:
  - value? — TODO(review): type + one-line description from src
  - defaultValue? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - lazyMount? — TODO(review): type + one-line description from src
  - unmountOnExit? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
