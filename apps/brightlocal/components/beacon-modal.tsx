"use client";

/**
 * The large Beacon dialog: full AI summary (every line, the charts), then
 * the plan with its tactics. Opened by the strips on the hub and on
 * Review Manager. Mounted once in the product layout.
 */

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@brightlocal/ui-components/dialog";
import { useBeaconModal } from "@/lib/beacon-modal";
import { ReviewSummary } from "@/components/review-summary";
import { ReviewInsights } from "@/components/review-insights";

export function BeaconModal() {
  const { open, section, close } = useBeaconModal();
  const planRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open && section === "plan") {
      const t = setTimeout(() => planRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 120);
      return () => clearTimeout(t);
    }
  }, [open, section]);
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent dataHook="beacon-modal" className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-5xl">
        <DialogTitle className="sr-only">Beacon</DialogTitle>
        <DialogDescription className="sr-only">Your AI summary and plan for this location.</DialogDescription>
        <div className="flex flex-col gap-6">
          <ReviewSummary full />
          <div ref={planRef}>
            <ReviewInsights />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
