// ConfirmationDialog — A dialog that asks the user to confirm or cancel a destructive action.
// keywords: confirm, confirmation, confirm dialog, delete confirmation, are you sure, destructive action
// components: alert-dialog
// Harvested from BrightLocal's DS MCP (get_composition_recipe "ConfirmationDialog") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button dataHook="delete-btn" variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
