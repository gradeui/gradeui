// ConfirmationModal — A controlled AlertDialog for confirming destructive actions, with open/onOpenChange state management.
// keywords: confirmation modal, confirm delete, confirm action, destructive confirmation, are you sure modal, confirm discard
// components: alert-dialog, button
// Harvested from BrightLocal's DS MCP (get_composition_recipe "ConfirmationModal") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@brightlocal/ui-components/alert-dialog";
import { Button } from "@brightlocal/ui-components/button";

const [open, setOpen] = React.useState(false);

<Button dataHook="confirm-delete-trigger" variant="destructive" onClick={() => setOpen(true)}>
  Delete item
</Button>

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent dataHook="confirm-delete-modal">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. The item and all associated data will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel dataHook="confirm-delete-cancel">Cancel</AlertDialogCancel>
      <AlertDialogAction
        dataHook="confirm-delete-action"
        variant="destructive"
        onClick={handleDelete}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
