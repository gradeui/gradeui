"use client";

/**
 * The large Beacon dialog. Two sections: the summary (every line, the
 * six-month charts, led by the page's own block when opened from a
 * page) and the plan (opened from the Manager's goal strip). Never
 * both at once. Mounted once in the product layout.
 */

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@brightlocal/ui-components/dialog";
import { Button } from "@brightlocal/ui-components/button";
import { X } from "@brightlocal/icons";
import { useLocationKey } from "@/lib/location";
import { DATASETS } from "@brightlocal/data";
import { useBeaconModal } from "@/lib/beacon-modal";
import { ReviewSummary, BeaconBadge, BeaconPageBlock, SummaryCharts } from "@/components/review-summary";
import { statsFor } from "@/lib/reviews-data";
import { usePersona } from "@/lib/demo";
import { ReviewInsights } from "@/components/review-insights";

export function BeaconModal() {
  const { open, close, page, section } = useBeaconModal();
  const location = useLocationKey();
  const persona = usePersona();
  const locationName = (DATASETS as Record<string, { location?: { name?: string } }>)[location]?.location?.name ?? location;
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      {/* LARGE, with a fixed header (Ali, 9 Sep): near full-screen on
          desktop, the header stays put, the body scrolls underneath only
          if it must, and nothing inside carries its own border. */}
      <DialogContent
        dataHook="beacon-modal"
        data-beacon-section={section}
        className="flex max-h-[94vh] w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1400px)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4" data-hook="beacon-modal-header">
          <div className="flex min-w-0 items-center gap-3">
            <BeaconBadge dataHook="beacon-modal-badge" beta />
            <DialogTitle className="text-heading-subsection leading-normal">{section === "plan" ? `Beacon's plan for ${locationName}` : `Beacon insights for ${locationName}`}</DialogTitle>
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
          {section === "plan" ? (
            <ReviewInsights bare />
          ) : (
            // From a page: that page's block and the charts, nothing that
            // restates it (Ali, 9 Sep: "Stacked!"). From the hub: the full
            // summary.
            page ? (
              <div className="flex flex-col gap-2">
                <BeaconPageBlock page={page} />
                {/* Each page gets the charts it is about (Ali, 9 Sep). */}
                <SummaryCharts
                  stats={statsFor(location, persona)}
                  kinds={page === "builder" ? ["velocity", "fourPlus"] : page === "showcase" ? ["rating", "fourPlus"] : ["rating", "velocity", "fourPlus"]}
                />
              </div>
            ) : (
              <ReviewSummary full bare />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
