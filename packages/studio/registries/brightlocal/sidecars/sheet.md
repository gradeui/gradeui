---
name: Sheet
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/sheet"
subcomponents: [SheetTrigger, SheetPortal, SheetClose, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription]
props:
  - open?: boolean
  - defaultOpen?: boolean
  - onOpenChange?
  - modal?: boolean
  - side? (top | right | bottom | left) — SheetContent: Side from which the sheet slides in (default "right")
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — SheetContent: Tracking element identifier for analytics
  - trackingLabel?: string — SheetContent: Tracking label for analytics context
  - closeLabel?: string — SheetContent: Accessible label for the close button. (default "Close")
when_to_use: Side panel for editing details, settings, or supplementary info Right-side panel pattern (most common: filters, detail views, forms) Content that should slide in from an edge without navigating away Do NOT use for: centered dialogs (use Dialog); confirmations (use AlertDialog). Use Dialog for centered content requiring focused attention. Use Drawer when you need non-modal behavior or mobile bottom-sheet pattern. Use Sidebar for persistent collapsible navigation — Sheet is for temporary overlays.
composes_with: [Dialog, Drawer, Sidebar]
aliases: [side panel, drawer, flyout, tray, slide-out]
---

```jsx
<Sheet>
  <SheetTrigger asChild>
    <Button dataHook="open-sheet">Open Sheet</Button>
  </SheetTrigger>
  <SheetContent dataHook="my-sheet" side="right">
    <SheetHeader>
      <SheetTitle dataHook="my-sheet-title">Title Text</SheetTitle>
      <SheetDescription dataHook="my-sheet-description">This is a sheet description.</SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 py-4">
      {/* Your content here */}
    </div>
    <SheetFooter>
      <Button dataHook="save-button">Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```
```jsx
<SheetTitle icon={<Heart />}>Title Text</SheetTitle>
```
```jsx
<SheetContent closeLabel={t("sheet.close")} side="right">
  ...
</SheetContent>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-sheet--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
