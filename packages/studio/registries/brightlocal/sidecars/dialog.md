---
name: Dialog
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/dialog"
subcomponents: [DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - modal? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Presenting informational content or forms that require focused attention Content that should block interaction with the page behind it Multi-step flows or forms that don't fit inline Do NOT use for: confirmation actions (use AlertDialog); side panels (use Sheet or Drawer). Use AlertDialog when the user must confirm or cancel a destructive/irreversible action. Use Sheet for side panels with supplementary content or forms that don't need centered focus. Use Drawer for mobile-friendly bottom/side slide-out panels.
composes_with: [AlertDialog, Sheet, Drawer]
aliases: [modal, popup, lightbox]
---

```jsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </DialogTrigger>
  <DialogContent dataHook="edit-profile-dialog">
    <DialogHeader>
      <DialogTitle dataHook="edit-profile-title">Edit profile</DialogTitle>
      <DialogDescription dataHook="edit-profile-description">
        Make changes to your profile here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Your form content here */}
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
```jsx
<DialogContent dataHook="dialog" closeLabel={t("dialog.close")}>
  ...
</DialogContent>
```
```jsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" dataHook="dialog-trigger">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent dataHook="dialog-content">
    <DialogHeader>
      <DialogTitle dataHook="dialog-title">Dialog title</DialogTitle>
      <DialogDescription dataHook="dialog-description">
        This is a dialog description.
      </DialogDescription>
    </DialogHeader>
    {/* Content slot */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline" dataHook="dialog-cancel">Cancel</Button>
      </DialogClose>
      <Button dataHook="dialog-save">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-dialog--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
