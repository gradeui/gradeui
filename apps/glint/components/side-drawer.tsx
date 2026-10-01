"use client";

// SideDrawer (1 Oct 2026): THE drawer for the Glint business portal v2.
// One spec, used by Buy and Sell (TradeFlowV2) and by the transaction
// detail (ActivityTableV2), so the two can no longer disagree (Ali, 1 Oct,
// from the layout audit: "Buy and Sell become a side drawer, not a
// centred modal", matching the transaction detail, sharing one spec).
//
// TWIN: the Studio shared component "SideDrawer" (cmupuqcst0zy87).
// Editing one does not touch the other. Keep the pair in sync.
//
// THE SPEC, all of it the DS Sheet as shipped except where noted:
//   - Panel: from the right, full height, 448 wide from 640 up
//     (sm:max-w-md), the full screen below 640 (w-full). Padding 24 (the
//     Sheet's p-6), the Sheet's scrim and border.
//   - Header: never scrolls. SheetTitle (18/28, 600), SheetDescription
//     (14/20 muted) 8 under it, left-aligned at every size (the DS header
//     centres below 640). An optional 20px icon sits 8 before the title,
//     centred on the title's 28px line, and the description starts under
//     the title TEXT, not under the icon (Ali, 1 Oct: line them up).
//   - Close: a 40 by 40 ghost button with a 20px X (Ali, 1 Oct: the DS
//     Sheet's 16px X read small on desktop), centred on the title's line,
//     at the header's right. The Sheet's own close is hidden for it, so
//     there is exactly one, and every drawer has the same one.
//   - Body: the only part that scrolls, taking the height the header and
//     footer leave. 24 under the header (gap-6 on the panel). Its content
//     fills at least the body's height, so a group can be pushed to the
//     bottom with mt-auto, next to the footer it belongs to.
//   - Footer: pinned to the bottom edge. SheetFooter: from 640 the
//     buttons sit right-aligned, primary rightmost; below 640 they stack
//     full width, primary on top, 8 APART. The DS footer only spaces them
//     from 640 (sm:space-x-2), so stacked buttons touched; gap-2 here,
//     with the margin dropped from 640 so the gap is not doubled. The
//     permanent fix is gap-2 in the DS SheetFooter and DialogFooter.
//
//   <SideDrawer open={open} onOpenChange={setOpen} trigger={<Button>Buy</Button>}>
//     <SideDrawer.Header icon={...} title="Buy Gold" description="From your USD wallet" />
//     <SideDrawer.Body>...</SideDrawer.Body>
//     <SideDrawer.Footer>...</SideDrawer.Footer>
//   </SideDrawer>
import * as React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Stack,
  Row,
  Button,
} from "@gradeui/ui";
import { X } from "lucide-react";

export function SideDrawer({
  open,
  onOpenChange,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-6 sm:max-w-md"
        closeClassName="hidden"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}

SideDrawer.Header = function SideDrawerHeader({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <SheetHeader className="shrink-0 text-left">
      <Row justify="between" align="start" gap="sm">
        <Row gap="sm" align="start" className="min-w-0">
          {/* mt-1: a 20px icon centred on the title's 28px line. */}
          {icon ? <span className="mt-1 flex shrink-0">{icon}</span> : null}
          <Stack gap="sm" className="min-w-0">
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </Stack>
        </Row>
        {/* -mt-1.5 centres the 40px button on the title's 28px line;
            -mr-2 keeps the X where the panel's padding puts it. */}
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="lg"
            iconOnly
            aria-label="Close"
            className="-mr-2 -mt-1.5 shrink-0 rounded-full"
          >
            <X />
          </Button>
        </SheetClose>
      </Row>
    </SheetHeader>
  );
};

SideDrawer.Body = function SideDrawerBody({
  children,
}: {
  children: React.ReactNode;
}) {
  /* The negative margin plus matching padding is a gutter for focus
     rings, which an overflow container would otherwise clip. */
  return (
    <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
      <div className="flex min-h-full flex-col">{children}</div>
    </div>
  );
};

SideDrawer.Footer = function SideDrawerFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SheetFooter className="shrink-0 gap-2 sm:space-x-0">{children}</SheetFooter>;
};
