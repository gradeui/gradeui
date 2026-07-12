---
name: Sonner
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/sonner"
subcomponents: [sonner]
props:
  - title? — TODO(review): type + one-line description from src
  - description? — TODO(review): type + one-line description from src
  - icon? — TODO(review): type + one-line description from src
  - colorSchema? — TODO(review): type + one-line description from src
  - button? — TODO(review): type + one-line description from src
  - duration? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: persistent alerts (use Alert); confirmation dialogs (use AlertDialog).
aliases: [toast, notification, snackbar, flash message]
---

```jsx
// Mount Sonner once in your app root
<Sonner />

// Then call sonner() anywhere to show a toast
sonner({
  title: "Changes saved",
  description: "Your changes have been saved successfully.",
  icon: "success",
});

// Persistent toast that stays visible until dismissed
sonner(
  { title: "Redirecting…", icon: "loading" },
  { duration: Infinity },
);
```
```jsx
import { sonner } from "@brightlocal/ui-components/sonner";

// Standard toast (auto-dismisses after 4 000 ms)
<Button
  onClick={() =>
    sonner({
      title: "Event has been created",
      description: "Sunday, December 03, 2023 at 9:00 AM.",
      icon: "success",
      colorSchema: "default",
      button: {
        label: "Undo",
        onClick: () => console.log("Undo clicked"),
      },
    })
  }
>
  Show toast
</Button>

// Persistent toast (stays visible until manually dismissed)
sonner(
  { title: "Redirecting…", icon: "loading" },
  { duration: Infinity, id: "redirect-toast" },
);

// Later, dismiss it programmatically
sonner.dismiss("redirect-toast");
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-sonner--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
