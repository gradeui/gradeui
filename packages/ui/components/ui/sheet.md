---
name: Sheet
import: "@gradeui/ui"
subcomponents: [SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose]
props:
  - Sheet: open?, defaultOpen?, onOpenChange?, modal? (default true)
  - SheetTrigger: asChild?: boolean
  - SheetContent: side? "top" | "right" | "bottom" | "left" (default "right")
  - SheetContent: className?: string — usually set a width (right/left) or height (top/bottom)
  - SheetTitle / SheetDescription: identify the sheet to screen readers; required for accessibility even if visually styled differently
  - SheetClose: asChild? — usually wraps a Button labelled Cancel or Done
when_to_use: A panel that slides in from a screen edge — mobile nav drawers, side panels for editing a single record without leaving the list, filter trays on small viewports. For a centered focus modal use Dialog. For a transient announcement use Toast (Sonner). For inline reveals use Collapsible.
composes_with: [Form controls (an inline edit sheet), Button (trigger + close), AppShellNav (mobile-only swap)]
aliases: [sheet, drawer, side panel, slide-in, nav drawer, mobile drawer, slide-over, action sheet, modal sheet, bottom sheet, side sheet, react native modal sheet, bottom-sheet, ios action sheet]
---

```jsx
// Edit-record drawer from the right edge.
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Edit user</Button>
  </SheetTrigger>
  <SheetContent className="w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle>Edit user</SheetTitle>
      <SheetDescription>Update Elena's profile and role.</SheetDescription>
    </SheetHeader>
    <Stack gap="md" className="py-4">
      <Stack gap="xs">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Elena Okafor" />
      </Stack>
      <Stack gap="xs">
        <Label htmlFor="role">Role</Label>
        <Select>{/* … */}</Select>
      </Stack>
    </Stack>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="ghost">Cancel</Button>
      </SheetClose>
      <Button>Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```
