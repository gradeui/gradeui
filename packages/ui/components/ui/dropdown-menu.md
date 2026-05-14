---
name: DropdownMenu
import: "@gradeui/ui"
subcomponents: [DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent]
props:
  - DropdownMenu: open?, defaultOpen?, onOpenChange?, modal? (default true)
  - DropdownMenuTrigger: asChild?: boolean — usually wraps a Button
  - DropdownMenuContent: align? "start" | "center" | "end"; side? "top" | "right" | "bottom" | "left"; sideOffset? number
  - DropdownMenuItem: onSelect?, disabled?, asChild?, inset?
  - DropdownMenuCheckboxItem / DropdownMenuRadioItem: checked? / value, onCheckedChange? / onValueChange? (radio is on the group)
  - DropdownMenuSub / DropdownMenuSubTrigger / DropdownMenuSubContent: nested menu — sub-trigger shows children, sub-content holds the deeper items
  - DropdownMenuShortcut: children — right-aligned kbd hint
when_to_use: A small action menu attached to a trigger — overflow "…" buttons on cards, user-avatar menus in headers, "Insert" menus in editors. For a full searchable list, use Command. For ONE primary action plus a secondary, use a Button next to a smaller ghost Button instead of a dropdown.
composes_with: [Button (as trigger asChild), Avatar (user menu), Card (overflow on a tile), Tooltip (on the trigger)]
aliases: [dropdown, dropdown menu, overflow menu, kebab menu, more menu, action menu, context-style menu]
---

```jsx
// Overflow menu on a card/row — trigger an icon-only Button.
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Open menu">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={onDuplicate}>
      <Copy /> Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={onShare}>
      <Share2 /> Share
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={onDelete} className="text-destructive">
      <Trash /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```
