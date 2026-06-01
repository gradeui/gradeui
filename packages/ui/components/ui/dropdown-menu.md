---
name: DropdownMenu
import: "@gradeui/ui"
subcomponents: [DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent]
props:
  - DropdownMenu: open?, defaultOpen?, onOpenChange?, modal? (default true)
  - DropdownMenuTrigger: asChild?: boolean — usually wraps a Button
  - DropdownMenuContent: align? "start" | "center" | "end"; side? "top" | "right" | "bottom" | "left"; sideOffset? number
  - DropdownMenuContent: surface? (solid | translucent | glass | glass-strong) — what the menu surface is *made of*. `solid` (default) is `bg-popover`. `translucent` matches Apple HIG / iOS menu sheets. `glass` for menus floating over rich canvases.
  - DropdownMenuContent: size? "default" | "sm" | "xs" — menu density; cascades to every item (Item, Checkbox, Radio, SubTrigger, Label) via context so a compact trigger gets a compact menu. Use "xs" in dense tool panels.
  - DropdownMenuSubContent: surface? (solid | translucent | glass | glass-strong) — same axis applied to nested submenu surfaces
  - DropdownMenuSubContent: size? "default" | "sm" | "xs" — match the parent content's size down the tree
  - DropdownMenuItem: onSelect?, disabled?, asChild?, inset?
  - DropdownMenuCheckboxItem / DropdownMenuRadioItem: checked? / value, onCheckedChange? / onValueChange? (radio is on the group)
  - DropdownMenuSub / DropdownMenuSubTrigger / DropdownMenuSubContent: nested menu — sub-trigger shows children, sub-content holds the deeper items
  - DropdownMenuShortcut: children — right-aligned kbd hint
when_to_use: A small action menu attached to a trigger — overflow "…" buttons on cards, user-avatar menus in headers, "Insert" menus in editors. For a full searchable list, use Command. For ONE primary action plus a secondary, use a Button next to a smaller ghost Button instead of a dropdown.
composes_with: [Button (as trigger asChild), Avatar (user menu), Card (overflow on a tile), Tooltip (on the trigger)]
aliases: [dropdown, dropdown menu, overflow menu, kebab menu, more menu, action menu, context-style menu, menu, pull-down menu, pulldown menu, context menu, popup menu, actions menu, glass menu, frosted menu, ios menu, hig menu]
---

DropdownMenuContent sits at elevation-4. Pick the material from the scenarios below — the `surface` prop is the discoverable lever.

---

### Scenario 1 — Overflow menu on a row/card (default opaque)

The canonical "…" menu attached to a row or card. The content behind is a list — readability of the menu items matters more than seeing what's underneath.

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Open menu">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={onDuplicate}>
      <Copy /> Duplicate
      <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
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

`solid` is the right default. Menu items are read-targets — give them a clean opaque background.

---

### Scenario 2 — Translucent menu (iOS / Apple HIG)

You want the iOS-native menu feel: light translucency that picks up the colour of whatever's beneath without committing to a full blur. The Apple HIG canonical material for context menus.

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    surface="translucent"
    className="shadow-elevation-4"
    align="end"
  >
    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
    <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
      <DropdownMenuRadioItem value="recent">Most recent</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="alpha">A–Z</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

82% opacity. The background tints the menu without demanding the user filter it out.

---

### Scenario 3 — Glass menu in a canvas tool

Studio's layer-context menu, an image editor's right-click, a slide-tool insert menu. The canvas behind is the work. Glass lets the menu float without cutting a hole through the work.

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><Plus /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    surface="glass"
    className="shadow-elevation-4 w-56"
    align="start"
  >
    <DropdownMenuLabel>Insert</DropdownMenuLabel>
    <DropdownMenuItem><LayoutTemplate /> Layout</DropdownMenuItem>
    <DropdownMenuItem><Image /> Media</DropdownMenuItem>
    <DropdownMenuItem><Code2 /> Code block</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger><Sparkles /> AI suggestion</DropdownMenuSubTrigger>
      <DropdownMenuSubContent surface="glass" className="shadow-elevation-4">
        <DropdownMenuItem>Layout variant</DropdownMenuItem>
        <DropdownMenuItem>Tone shift</DropdownMenuItem>
        <DropdownMenuItem>Density pass</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

Pass `surface="glass"` to BOTH the root content AND the sub-content — submenus default to `solid` so a glass parent with an opaque child looks broken. Match the surface consistently down the menu tree.

---

### Anti-patterns

**DO NOT roll glass by hand on DropdownMenuContent.**

```jsx
{/* ❌ Misses the iOS-native edge highlight + theme blur tuning. */}
<DropdownMenuContent className="bg-popover/55 backdrop-blur-md">

{/* ✅ */}
<DropdownMenuContent surface="glass">
```

**DO NOT mix surfaces between content and sub-content.** A glass root with a solid submenu (or vice-versa) reads as two materials competing for attention. Pick one for the whole tree.

**DO NOT use DropdownMenu for searchable lists.** Past ~7 items the menu becomes a scrollable list and the right primitive is Command (a search-first list inside a Popover or Dialog).

**DO NOT put long-form text in menu items.** Items are action labels — verbs. If you need help text, that's a Popover surface, not a menu.
