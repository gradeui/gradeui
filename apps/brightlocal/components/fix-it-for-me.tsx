"use client";

/**
 * "Fix it for me" (Ali, 9 Sep): Beacon does the first tactic on your
 * behalf and hands the result back for approval. Prototype behaviour: a
 * dialog that thinks for a moment, then reports what it drafted and
 * where to review it. Shown only when the setting is on.
 */

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@brightlocal/ui-components/dialog";
import { Button } from "@brightlocal/ui-components/button";
import { LoaderCircle, Sparkles, Check } from "@brightlocal/icons";
import { useDemo } from "@/lib/demo";

export function FixItForMe({ count, goto }: { count: number; goto: string }) {
  const { settings } = useDemo();
  const [open, setOpen] = React.useState(false);
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (!open) { setDone(false); return; }
    const t = setTimeout(() => setDone(true), 1600);
    return () => clearTimeout(t);
  }, [open]);
  if (!settings.fixItForMe || count === 0) return null;
  return (
    <>
      <Button variant="primary" size="sm" dataHook="fix-it-for-me" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        Fix it for me
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dataHook="fix-it-for-me-dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{done ? `${count} replies drafted` : "Beacon is drafting your replies"}</DialogTitle>
            <DialogDescription>
              {done
                ? `Each one is written for the review it answers, in your usual tone. Nothing goes out until you say so.`
                : `Reading the ${count} reviews that are waiting and writing a reply for each.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2 text-body-sm text-muted-foreground">
            {done ? <Check className="size-4" /> : <LoaderCircle className="size-4 animate-spin" />}
            {done ? "Drafts are waiting in Review Manager." : "This usually takes a few seconds."}
          </div>
          <DialogFooter>
            <Button variant="outline" dataHook="fix-it-for-me-close" onClick={() => setOpen(false)}>
              Not now
            </Button>
            <span className="inline-flex" data-grade-goto={goto}>
              <Button variant="primary" dataHook="fix-it-for-me-review" disabled={!done}>
                Review the drafts
              </Button>
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
