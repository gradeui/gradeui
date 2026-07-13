// RightSidePanel — A right-side Sheet panel with a sticky header, scrollable content area, and footer actions.
// keywords: right side panel, side panel, detail panel, right drawer, sheet panel, sliding panel
// components: sheet, scroll-area
// Harvested from BrightLocal's DS MCP (get_composition_recipe "RightSidePanel") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@brightlocal/ui-components/sheet";
import { ScrollArea } from "@brightlocal/ui-components/scroll-area";
import { Button } from "@brightlocal/ui-components/button";

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent dataHook="detail-panel" side="right">
    <SheetHeader className="sticky top-0 z-10 bg-background border-b pb-4">
      <SheetTitle>Item details</SheetTitle>
      <SheetDescription>View and edit item information.</SheetDescription>
    </SheetHeader>
    <ScrollArea className="flex-1 overflow-y-auto">
      <div className="grid gap-4 p-4">
        {/* Panel content */}
      </div>
    </ScrollArea>
    <SheetFooter className="sticky bottom-0 border-t bg-background pt-4">
      <Button dataHook="detail-panel-cancel" variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button dataHook="detail-panel-save" onClick={handleSave}>
        Save changes
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
