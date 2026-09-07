// @brightlocal/side-sheet-header — the header of every right-hand sheet.
//
// NAMED SideSheetHeader, NOT SheetHeader: the DS barrel already exports a
// SheetHeader (its Sheet family), and the contract generator lets the DS's
// typed answer win over a registry sidecar, so a same-named registry
// component validated with NO legal props. Registry-local names must not
// collide with anything the DS barrel exports.
//
// WHY THIS EXISTS (Ali, 7 Sep: "the sheet headers also dont seem to cope with
// descriptions very well"). Review Manager, Reply Templates and Review
// Showcase each carried their own copy of the same DrawerHeader override, and
// each drifted: one centred the close button on a two-line title block so it
// sat between the lines, one dropped the description entirely, one had a raw
// <p> for the description with the wrong size. One component, one shape.
//
// THE SHAPE: one row. Title on the left with an optional description under
// it, the close button on the right aligned to the TITLE LINE (items-start
// plus a small negative top margin), not to the middle of the block, so it
// reads the same whether or not there is a description.
//
// WHY THE OVERRIDES: the DS DrawerHeader ships `mx-auto w-full max-w-sm px-4`,
// which is a phone-width column. A right-hand sheet is not a phone, so the
// width clamp goes and the padding becomes the sheet's own gutter.
import * as React from "react";
import { X } from "@brightlocal/icons";
import { Button } from "@brightlocal/ui-components/button";
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@brightlocal/ui-components/drawer";

export function SideSheetHeader({
  title,
  description,
  // Slot for something that must sit beside the close button (a status
  // pill, a secondary action). Rare; most sheets pass nothing.
  trailing = null,
  closeLabel = "Close",
  dataHook = "sheet-header",
  // The close button's own hook. Defaults to `${dataHook}-close`; screens
  // that already had a close button (close-filters, close-template,
  // close-rule) pass theirs so capture-states keeps pressing the same thing.
  closeHook,
  className = "",
}) {
  const closeDataHook = closeHook ?? `${dataHook}-close`;
  return (
    <DrawerHeader
      data-hook={dataHook}
      className={`mx-0 flex w-full max-w-none flex-row items-start justify-between gap-3 border-b px-4 py-3 text-left ${className}`}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <DrawerTitle className="text-foreground text-base leading-6 font-semibold" dataHook={`${dataHook}-title`}>
          {title}
        </DrawerTitle>
        {description ? (
          <DrawerDescription className="text-muted-foreground text-sm leading-5" dataHook={`${dataHook}-description`}>
            {description}
          </DrawerDescription>
        ) : null}
      </div>
      <div className="-mt-1 -mr-2 flex shrink-0 items-center gap-1">
        {trailing}
        <DrawerClose asChild>
          <Button variant="ghost" iconOnly className="size-8" dataHook={closeDataHook} aria-label={closeLabel}>
            <X className="size-4" />
          </Button>
        </DrawerClose>
      </div>
    </DrawerHeader>
  );
}
