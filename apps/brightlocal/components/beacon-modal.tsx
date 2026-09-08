"use client";

/**
 * The large Beacon dialog: full AI summary (every line, the charts), then
 * the plan with its tactics. Opened by the strips on the hub and on
 * Review Manager. Mounted once in the product layout.
 */

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@brightlocal/ui-components/dialog";
import { Button } from "@brightlocal/ui-components/button";
import { X } from "@brightlocal/icons";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { DATASETS } from "@brightlocal/data";
import { useBeaconModal } from "@/lib/beacon-modal";
import { ReviewSummary } from "@/components/review-summary";
import { ReviewInsights } from "@/components/review-insights";

export function BeaconModal() {
  const { open, section, close } = useBeaconModal();
  const persona = usePersona();
  const location = useLocationKey();
  const locationName = (DATASETS as Record<string, { location?: { name?: string } }>)[location]?.location?.name ?? location;
  const planRef = React.useRef<HTMLDivElement>(null);
  void persona;
  React.useEffect(() => {
    if (open && section === "plan") {
      const t = setTimeout(() => planRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 120);
      return () => clearTimeout(t);
    }
  }, [open, section]);
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
            <span className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-label-sm text-foreground">
              <span aria-hidden className="text-[var(--ds-tailwind-colors-green-500)]">✦</span> Beacon
            </span>
            <DialogTitle className="text-heading-subsection truncate">Beacon insights for {locationName}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Your AI summary and plan for this location.</DialogDescription>
          <DialogClose asChild>
            <Button variant="outline" size="sm" dataHook="beacon-modal-close">
              <X className="size-4" />
              Close
            </Button>
          </DialogClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-8">
            <ReviewSummary full bare />
            <div ref={planRef}>
              <ReviewInsights bare />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
