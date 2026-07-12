---
name: AlertDialog
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/alert-dialog"
subcomponents: [AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: User is about to perform an irreversible or destructive action (delete, discard, overwrite) Action has significant consequences that require explicit confirmation Two clear actions: confirm or cancel — no other options needed Do NOT use for: informational dialogs (use Dialog); toast messages (use Sonner). Use Dialog when content is informational or includes a form — not a simple confirm/cancel. Use Sonner for non-blocking success/error feedback after an action completes.
composes_with: [Dialog, Sonner]
aliases: [confirmation dialog, confirm modal, destructive action dialog]
---

```jsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle dataHook="confirm-title">Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription dataHook="confirm-description">
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
```jsx
<AlertDialog dataHook="confirm-dialog">
  <AlertDialogTrigger asChild>
    <Button dataHook="delete-account">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle dataHook="confirm-title">Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription dataHook="confirm-description">
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-alert-dialog--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
