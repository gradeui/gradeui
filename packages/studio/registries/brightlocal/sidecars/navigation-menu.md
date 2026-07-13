---
name: NavigationMenu
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/navigation-menu"
subcomponents: [NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuViewport, NavigationMenuIndicator]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - className?: string
---

```jsx
<NavigationMenu dataHook="main-nav">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Products</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/analytics">Analytics</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```
```jsx
<NavigationMenu dataHook="navigation-menu-default" defaultValue="products">
  <NavigationMenuList>
    <NavigationMenuItem value="products">
      <NavigationMenuTrigger>Products</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
          <li>
            <NavigationMenuLink asChild>
              <a href="/analytics">
                <div className="text-sm leading-none font-medium">Analytics</div>
                <p className="text-muted-foreground text-sm">Track and analyze your data.</p>
              </a>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink asChild>
              <a href="/reports">
                <div className="text-sm leading-none font-medium">Reports</div>
                <p className="text-muted-foreground text-sm">Generate detailed reports.</p>
              </a>
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem value="resources">
      <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid
/* …truncated */
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-navigationmenu--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
