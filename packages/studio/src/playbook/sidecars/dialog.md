---
name: Dialog
import: "@gradeui/ui"
subcomponents: [DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose]
props:
  - Dialog: open?, onOpenChange? — Radix controlled/uncontrolled pattern
  - DialogTrigger: asChild? (wrap a Button)
  - DialogContent: accepts native div HTML attrs
  - DialogFooter: used for action rows
when_to_use: Modal interruptions — confirmations, focused forms, detail views. For non-blocking messaging use Alert or Sonner. Always include DialogTitle (a11y requirement).
composes_with: [Button (as DialogTrigger asChild, and inside DialogFooter), Input/Textarea/Select inside DialogContent]
aliases: [modal, popup, overlay]
---

```jsx
<Dialog>
  <DialogTrigger asChild><Button>Delete</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete project?</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
