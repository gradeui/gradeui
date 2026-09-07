---
name: SideSheetHeader
props:
  - title — node. The sheet's title. Required; Drawer needs a title in the tree.
  - description? — node. Optional one-line description under the title.
  - trailing? — node. Optional control beside the close button (a status pill, a secondary action). Rare.
  - closeLabel?: string — aria-label for the close button. Default "Close".
  - dataHook?: string — hook for the header; title and description derive `${dataHook}-title` and `${dataHook}-description`.
  - closeHook?: string — the close button's own hook. Defaults to `${dataHook}-close`; pass the screen's existing hook (close-filters, close-template, close-rule) so capture-states keeps pressing the same thing.
  - className?: string — appended to the DrawerHeader; for the one local nuance a screen needs, such as `py-2!` under a bottom sheet's handle.
when_to_use: >
  The header of every right-hand sheet (Drawer with direction right) in the
  BrightLocal prototypes: filters, edit-a-thing, preview, embed code. One row,
  title left with an optional description under it, the 8x8 close button
  aligned to the title line. Never hand-roll a DrawerHeader with a title and a
  close button on a screen; use this so every sheet reads as the same object.
  Named SideSheetHeader because the DS barrel already exports a SheetHeader.
composes_with: [Drawer, DrawerContent, DrawerBody, DrawerFooter, Button]
aliases: [drawer header, sheet title, panel header, close button header, sheet header]
