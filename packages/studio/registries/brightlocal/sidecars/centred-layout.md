---
name: CentredLayout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/centred-layout"
subcomponents: [CentredLayoutHeader, CentredLayoutContent]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Single-column centered pages (login, signup, password reset, onboarding) Pages with a centered Card and branded header Do NOT use for: two-column layouts (use SplitLayout); app shells with sidebar navigation (use GlobalLayout + Sidebar). Use SplitLayout for two-column pages with marketing content on one side. Use GlobalLayout for full app shells with sidebar navigation.
composes_with: [SplitLayout, GlobalLayout]
---

```jsx
// Basic usage with content only
<CentredLayout dataHook="my-layout">
  <CentredLayoutContent>
    <Card dataHook="my-card">
      <CardHeader>
        <CardTitle>Your Content</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your content here */}
      </CardContent>
    </Card>
  </CentredLayoutContent>
</CentredLayout>

// With Header (composition pattern)
<CentredLayout dataHook="my-layout">
  <CentredLayoutHeader>
    <Header dataHook="my-header">
      <Logo dataHook="my-logo" />
    </Header>
  </CentredLayoutHeader>
  <CentredLayoutContent>
    <Card dataHook="my-card">
      {/* Your content here */}
    </Card>
  </CentredLayoutContent>
</CentredLayout>
```
```jsx
<CentredLayout
  dataHook="centred-layout-default"
  storyDescription="Full page width/height"
>
  <CentredLayoutContent>
    <g />
  </CentredLayoutContent>
</CentredLayout>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-centredlayout--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
