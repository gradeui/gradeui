// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// SideDrawer (1 Oct 2026): THE drawer for the Glint business portal v2.
// One spec, used by Buy and Sell (TradeFlowV2), the transaction detail
// (ActivityListV2), Auto-buy, Deposit and Withdraw, so they cannot
// disagree.
//
// TWIN: the Studio shared component "SideDrawer" (cmupuqcst0zy87). Editing one does
// not touch the other. Keep the pair in sync.
//
// 7 OCT, THE WEB DS Sheet, Side=right, Width=sm, as "Glint - Web Portal -
// Full New" draws its drawers (Drawer · Buy Gold on the Auto-buy, Buy,
// Sell and Withdraw slides). This settles the 1 Oct A/B question in
// Figma's favour of B:
//   - Panel: from the right, full height, 384 wide from 640 up, the full
//     screen below. popover, a border on its open edge, the Sheet's two
//     drop shadows; the scrim is the overlay token.
//   - Header (never scrolls): 16 from the top, 24 sides, 8 under; a 40
//     row with the title in Raleway Bold 24/32 and a 40 square Close (8
//     corners; since 14 Oct a 16 X in muted-foreground, flush with the 24
//     side, as every Full New drawer measures). An optional description, Chivo 16/24
//     muted-foreground, 8 under the title; an optional icon before the
//     title; an optional Back (onBack, a 36 ROUND secondary button since
//     14 Oct, as Deposit · ACH and Withdraw · Review draw it) before that. inset="sheet" is the Web DS SheetHeader the
//     Deposit and Withdraw slides use: 24 from the top and 16 under.
//   - Body (the only part that scrolls): 24 sides, 16 under the header,
//     16 at the foot. Its content fills at least its height, so a group
//     can sit at the bottom with mt-auto, by the footer it belongs to.
//   - Footer (pinned): 16 above, 24 sides and below; full-width buttons
//     (Web DS Button xl, 48), 12 apart, primary first.
//
//   <SideDrawer open={open} onOpenChange={setOpen} trigger={<Button>Buy</Button>}>
//     <SideDrawer.Header icon={...} title="Buy Gold" description="From your USD wallet" />
//     <SideDrawer.Body>...</SideDrawer.Body>
//     <SideDrawer.Footer>...</SideDrawer.Footer>
//   </SideDrawer>
import * as React from "react";
import { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription } from "@gradeui/ui";
import { X, ChevronLeft } from "lucide-react";

const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)]";

function SideDrawer({ open, onOpenChange, trigger, children }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-[color:var(--wds-border)] bg-[var(--wds-popover)] p-0 text-[color:var(--wds-popover-foreground)] shadow-[0_10px_15px_-3px_var(--wds-shadow),0_4px_6px_-4px_var(--wds-shadow)] sm:max-w-[384px]"
        overlayClassName="bg-[var(--wds-overlay)]"
        closeClassName="hidden"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}

SideDrawer.Header = function SideDrawerHeader({ icon, title, description, onBack, inset }) {
  return (
    <div className={`flex shrink-0 flex-col gap-2 px-6 text-left ${inset === "sheet" ? "pb-4 pt-6" : "pb-2 pt-4"}`}>
      <div className="flex h-10 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--wds-secondary)] text-[color:var(--wds-secondary-foreground)] hover:bg-[var(--wds-secondary-hover)] ${FOCUS}`}
            >
              <ChevronLeft className="size-4" />
            </button>
          ) : null}
          {icon ? <span className="flex shrink-0">{icon}</span> : null}
          <SheetTitle className="truncate wds-display text-2xl font-bold leading-8 text-[color:var(--wds-popover-foreground)]">
            {title}
          </SheetTitle>
        </div>
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close"
            className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-[color:var(--wds-muted-foreground)] hover:bg-[var(--wds-accent)] ${FOCUS}`}
          >
            <X className="size-4" />
          </button>
        </SheetClose>
      </div>
      {description ? (
        <SheetDescription className="text-base leading-6 text-[color:var(--wds-muted-foreground)]">
          {description}
        </SheetDescription>
      ) : (
        <SheetDescription className="sr-only">{title}</SheetDescription>
      )}
    </div>
  );
};

SideDrawer.Body = function SideDrawerBody({ children }) {
  /* The inner padding is also a gutter for focus rings, which the
     overflow container would otherwise clip. */
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2">
      <div className="flex min-h-full flex-col">{children}</div>
    </div>
  );
};

SideDrawer.Footer = function SideDrawerFooter({ children }) {
  return <div className="flex shrink-0 flex-col gap-3 px-6 pb-6 pt-4">{children}</div>;
};

/* Exported untyped: the body is plain JSX (see the header). */
const __SideDrawer: any = SideDrawer;
export { __SideDrawer as SideDrawer };
