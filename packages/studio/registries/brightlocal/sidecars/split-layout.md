---
name: SplitLayout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/split-layout"
subcomponents: [SplitLayoutHeader, SplitLayoutContentLeft, SplitLayoutContentRight]
props:
  - left? — TODO(review): type + one-line description from src
  - right? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - left — DEPRECATED since 1.2.0: Use <SplitLayoutContentLeft> composition instead (DS-450)
  - right — DEPRECATED since 1.2.0: Use <SplitLayoutContentRight> composition instead (DS-450)
when_to_use: Two-column pages where one side is content and the other is decorative/marketing Auth pages with form on the left and branding on the right Any page where the right column should be hidden on mobile Do NOT use for: centered single-column layouts (use CentredLayout); app shells with sidebar navigation (use GlobalLayout + Sidebar); equal-width columns that should both be visible on mobile (use CSS grid). Use CentredLayout for single-column centered content. Use GlobalLayout for full app shells with persistent sidebar.
composes_with: [CentredLayout, GlobalLayout]
---

```jsx
// Basic usage
<SplitLayout dataHook="login-layout">
  <SplitLayoutContentLeft>
    <LoginForm />
  </SplitLayoutContentLeft>
  <SplitLayoutContentRight>
    <MarketingContent />
  </SplitLayoutContentRight>
</SplitLayout>
```
```jsx
// With full-bleed image
<SplitLayout dataHook="signup-layout">
  <SplitLayoutContentLeft>
    <SignUpForm />
  </SplitLayoutContentLeft>
  <SplitLayoutContentRight flush>
    <SplitLayoutImage
      dataHook="signup-hero"
      src="/images/signup-hero.png"
      alt="Product preview"
    />
  </SplitLayoutContentRight>
</SplitLayout>
```
```jsx
// With animation and marketing content
<SplitLayout dataHook="signup-layout">
  <SplitLayoutContentLeft>
    <SignUpForm />
  </SplitLayoutContentLeft>
  <SplitLayoutContentRight>
    <Badge dataHook="badge" variant="secondary">
      <Sparkles /> Turning data into insights
    </Badge>
    <h2>We empower businesses to grow locally.</h2>
    <Lottie animationData={dashboardAnimation} loop />
  </SplitLayoutContentRight>
</SplitLayout>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-splitlayout--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
