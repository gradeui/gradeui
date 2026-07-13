---
name: GlobalLayout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/global-layout"
subcomponents: [GlobalLayoutSidebar, GlobalLayoutContent, GlobalLayoutContentActions, GlobalLayoutContentHeader, GlobalLayoutContentBody, GlobalLayoutMobileHeader]
variants: [full, md, sm]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - maxWidth? — Maximum width of the global container. Use `breakpoint` tokens from `@brightlocal/tokens/breakpoints`. (default breakpoint.xl)
  - width? — GlobalLayoutSidebar: Width of the sidebar (default: 224px)
  - ariaLabel?: string — GlobalLayoutMobileHeader: Accessible label for the mobile navigation toolbar. (default "Mobile) navigation"
---

```jsx
function App() {
  const addButton = <Button dataHook="add-location">+ Add Location</Button>;

  return (
    <GlobalLayout dataHook="app-layout" maxWidth={breakpoint.xl}>
      <GlobalLayoutSidebar dataHook="app-sidebar">
        {/* Sidebar navigation — sticky */}
      </GlobalLayoutSidebar>
      <GlobalLayoutContent dataHook="app-content" maxWidth={breakpoint.lg}>
        {/* Mobile: button in the mobile header row */}
        <GlobalLayoutMobileHeader dataHook="mobile-header">
          <MenuButton />
          <Logo />
          <div className="ml-auto lg:hidden">{addButton}</div>
        </GlobalLayoutMobileHeader>

        {/* Desktop: button in its own actions row above the header */}
        <GlobalLayoutContentActions dataHook="content-actions">
          {addButton}
        </GlobalLayoutContentActions>

        <GlobalLayoutContentHeader dataHook="page-header">
          <h1 className="font-display text-4xl font-medium">All Locations</h1>
        </GlobalLayoutContentHeader>
        {/* Main content */}
      </GlobalLayoutContent>
    </GlobalLayout>
  );
}
```
```jsx
<GlobalLayoutMobileHeader
  dataHook="mobile-header"
  ariaLabel={t("layout.mobileNav")}
>
  {/* Mobile navigation content */}
</GlobalLayoutMobileHeader>
```
```jsx
<GlobalLayout dataHook="global-layout">
  <React.Fragment key=".0">
    <GlobalLayoutSidebar dataHook="global-layout-sidebar">
      <x />
    </GlobalLayoutSidebar>
    <GlobalLayoutContent
      dataHook="global-layout-content"
      maxWidth="var(--ds-breakpoint-lg)"
    >
      <GlobalLayoutMobileHeader
        ariaLabel="Navegación móvil"
        dataHook="mobile-header-i18n"
      >
        <Slot className="h-8 w-24">
          Menu
        </Slot>
      </GlobalLayoutMobileHeader>
      <u label="Content Area (i18n)" />
    </GlobalLayoutContent>
  </React.Fragment>
</GlobalLayout>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-globallayout--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
