---
name: SimpleTabs
import: "@gradeui/ui"
subcomponents: [SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent, SimpleTabsRoot, SimpleTabsPanel]
props:
  - SimpleTabs: tabs: { value: string; label: string; content: React.ReactNode }[] — fully-data-driven tab strip
  - SimpleTabs: defaultValue?: string — initial selected tab value
  - SimpleTabs: value?: string — controlled selected tab
  - SimpleTabs: onValueChange?: (value: string) => void
  - SimpleTabs: className?: string — wrapper class
  - SimpleTabsPanel / SimpleTabsRoot / SimpleTabsList / SimpleTabsTrigger / SimpleTabsContent: composition primitives for when the data-driven prop isn't flexible enough
when_to_use: A quick tab strip you can declare from data — config-driven settings tabs, model output where the LLM passes an array. For richer composition (icons, tooltips, per-trigger props) reach for the canonical Tabs component instead.
composes_with: [Card, Dialog]
aliases: [simple tabs, data tabs, config tabs]
---

```jsx
// Data-driven — pass an array of { value, label, content }.
<SimpleTabs
  defaultValue="profile"
  tabs={[
    { value: "profile", label: "Profile", content: <ProfilePanel /> },
    { value: "team", label: "Team", content: <TeamPanel /> },
    { value: "billing", label: "Billing", content: <BillingPanel /> },
  ]}
/>
```
