---
name: Drawer
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/drawer"
subcomponents: [DrawerTrigger, DrawerPortal, DrawerClose, DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription]
props:
  - activeSnapPoint?
  - setActiveSnapPoint?
  - open?: boolean
  - closeThreshold?: number — Number between 0 and 1 that determines when the drawer should be closed. Example: threshold of 0.5 would close the drawer if the user swiped for 50% of the height of the drawer or more.
  - noBodyStyles?: boolean — When `true` the `body` doesn't get any styles assigned from Vaul
  - onOpenChange?
  - shouldScaleBackground?: boolean
  - setBackgroundColorOnScale?: boolean — When `false` we don't change body's background color when the drawer is open.
  - scrollLockTimeout?: number — Duration for which the drawer is not draggable after scrolling content inside of the drawer.
  - fixed?: boolean — When `true`, don't move the drawer upwards if there's space, but rather only change it's height so it's fully scrollable when the keyboard is open
  - handleOnly?: boolean — When `true` only allows the drawer to be dragged by the `<Drawer.Handle />` component.
  - dismissible?: boolean — When `false` dragging, clicking outside, pressing esc, etc. will not close the drawer. Use this in comination with the `open` prop, otherwise you won't be able to open/close the drawer.
  - onDrag?
  - onRelease?
  - modal?: boolean — When `false` it allows to interact with elements outside of the drawer without closing it.
  - nested?: boolean
  - onClose?
  - direction? — Direction of the drawer. Can be `top` or `bottom`, `left`, `right`.
  - defaultOpen?: boolean — Opened by default, skips initial enter animation. Still reacts to `open` state changes
  - disablePreventScroll?: boolean — When set to `true` prevents scrolling on the document body on mount, and restores it on unmount.
  - repositionInputs?: boolean — When `true` Vaul will reposition inputs rather than scroll then into view if the keyboard is in the way. Setting it to `false` will fall back to the default browser behavior.
  - snapToSequentialPoint?: boolean — Disabled velocity based swiping for snap points. This means that a snap point won't be skipped even if the velocity is high enough. Useful if each snap point in a drawer is equally important.
  - container?
  - onAnimationEnd? — Gets triggered after the open or close animation ends, it receives an `open` argument with the `open` state of the drawer by the time the function was triggered. Useful to revert any state changes for example.
  - preventScrollRestoration?: boolean
  - autoFocus?: boolean
  - snapPoints? — Array of numbers from 0 to 100 that corresponds to % of the screen a given snap point should take up. Should go from least visible. Example `[0.2, 0.5, 0.8]`. You can also use px values, which doesn't take screen height into account.
  - fadeFromIndex?: number — Index of a `snapPoint` from which the overlay fade should be applied. Defaults to the last snap point.
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — DrawerContent: Tracking element identifier for analytics
  - trackingLabel?: string — DrawerContent: Tracking label for analytics context
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
