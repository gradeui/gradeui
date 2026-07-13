---
name: SplitLayout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/split-layout"
subcomponents: [SplitLayoutHeader, SplitLayoutContentLeft, SplitLayoutContentRight]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - left? — DEPRECATED: Use `<SplitLayoutContentLeft>` composition instead. (Content for the left/primary section.)
  - right? — DEPRECATED: Use `<SplitLayoutContentRight>` composition instead. (Content for the right/secondary section.)
  - children — SplitLayoutHeader: Header content (e.g., Header component with Logo)
  - sticky?: boolean — SplitLayoutContentLeft: Pins the column to the viewport on desktop (≥lg) so it stays visible while the sibling column grows beyond one screen. Applies `sticky top-0 h-screen self-start`. (default false)
  - flush?: boolean — SplitLayoutContentRight: Removes padding so content can fill edge-to-edge. Use with `SplitLayoutImage` for full-bleed imagery. (default false)
  - src: string — SplitLayoutImage: Image source URL
  - alt: string — SplitLayoutImage: Alt text for the image
  - objectFit? — SplitLayoutImage: How the image fits its container. (default "cover")
  - objectPosition?: string — SplitLayoutImage: CSS object-position value controlling the focal point of the image. (default "center") @example "top", "center", "left 30%"
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
