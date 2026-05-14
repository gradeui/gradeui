---
name: Toaster
import: "@gradeui/ui"
aliases: [toast, toaster, sonner, notification, snackbar, alert toast, transient alert]
props:
  - Toaster: position? "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" (default "bottom-right")
  - Toaster: theme? "light" | "dark" | "system"
  - Toaster: richColors?: boolean — colored variants for success/error/warning/info
  - Toaster: expand?: boolean — keep multiple toasts visually separated rather than stacked
  - Toaster: visibleToasts?: number — max concurrent toasts on screen (default 3)
  - Toaster: duration?: number — default ms before auto-dismiss
when_to_use: Transient, non-blocking feedback that confirms or warns about an action — "Saved", "Failed to upload", "Copied to clipboard", "Invitation sent". For permanent inline messages keep using Alert. For confirmations that block until acknowledged use Dialog. Mount <Toaster /> ONCE at the root of the app; everywhere else, call the `toast` helper.
composes_with: [App root layout (single <Toaster /> mount), Form submit handlers (success/error toasts), Async actions]
notes: Backed by Sonner under the hood — `import { toast } from "sonner"` to fire toasts from anywhere.
---

```jsx
// At the app root, mount once.
<Toaster richColors position="bottom-right" />
```

```jsx
// Anywhere else, fire via the helper.
import { toast } from "sonner";

<Button
  onClick={async () => {
    try {
      await saveProfile();
      toast.success("Saved");
    } catch (err) {
      toast.error("Couldn't save", { description: err.message });
    }
  }}
>
  Save changes
</Button>
```
