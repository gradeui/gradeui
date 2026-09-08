"use client";

/**
 * The large Beacon dialog: the full AI summary, every line and the
 * six-month charts. The plan is NOT here (Ali, 9 Sep); it unfolds on
 * Review Manager. Opened by the strips; mounted once in the product
 * layout.
 */

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@brightlocal/ui-components/dialog";
import { Button } from "@brightlocal/ui-components/button";
import { X } from "@brightlocal/icons";
import { useLocationKey } from "@/lib/location";
import { DATASETS } from "@brightlocal/data";
import { useBeaconModal } from "@/lib/beacon-modal";
import { ReviewSummary, BeaconBadge, BeaconPageBlock } from "@/components/review-summary";

export function BeaconModal() {
  const { open, close, page } = useBeaconModal();
  const location = useLocationKey();
  const locationName = (DATASETS as Record<string, { location?: { name?: string } }>)[location]?.location?.name ?? location;
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      {/* LARGE, with a fixed header (Ali, 9 Sep): near full-screen on
          desktop, the header stays put, the body scrolls underneath only
          if it must, and nothing inside carries its own border. */}
      <DialogContent
        dataHook="beacon-modal"
        className="flex max-h-[94vh] w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1400px)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4" data-hook="beacon-modal-header">
          <div className="flex min-w-0 items-center gap-3">
            <BeaconBadge dataHook="beacon-modal-badge" beta />
            <DialogTitle className="text-heading-subsection leading-normal">Beacon insights for {locationName}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Your AI summary for this location.</DialogDescription>
          <DialogClose asChild>
            <Button variant="outline" size="sm" dataHook="beacon-modal-close">
              <X className="size-4" />
              Close
            </Button>
          </DialogClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-6">
            {page ? <BeaconPageBlock page={page} /> : null}
            <ReviewSummary full bare />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
