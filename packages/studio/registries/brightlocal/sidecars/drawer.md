---
name: Drawer
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/drawer"
subcomponents: [DrawerTrigger, DrawerPortal, DrawerClose, DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - direction? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Mobile-friendly slide-out panel from any edge Non-modal supplementary content on touch devices Bottom sheet pattern on mobile viewports Do NOT use for: centered dialogs (use Dialog); confirmation prompts (use AlertDialog). Use Sheet for always-modal side panels with overlay — Sheet is modal-only, Drawer supports non-modal. Use Dialog when content should be centered and focused, not sliding from an edge.
composes_with: [Sheet, Dialog]
---

```jsx
<Drawer>
  <DrawerTrigger asChild>
    <Button>Open Drawer</Button>
  </DrawerTrigger>
  <DrawerContent dataHook="drawer-content">
    <DrawerHeader>
      <DrawerTitle>Drawer Title</DrawerTitle>
      <DrawerDescription>
        This is a drawer description.
      </DrawerDescription>
    </DrawerHeader>
    <DrawerBody>
      {/* Your content here */}
    </DrawerBody>
    <DrawerFooter>
      <Button>Submit</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```
```jsx
<Drawer>
  <DrawerTrigger asChild>
    <Button>Open Drawer</Button>
  </DrawerTrigger>
  <DrawerContent dataHook="drawer-content">
    <DrawerHeader>
      <DrawerTitle>Drawer Title</DrawerTitle>
      <DrawerDescription>
        This is a drawer description.
      </DrawerDescription>
    </DrawerHeader>
    <DrawerBody>
      {/* Content slot */}
    </DrawerBody>
    <DrawerFooter>
      <Button>Submit</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-drawer--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
