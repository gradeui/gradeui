---
"@gradeui/ui": minor
"@gradeui/studio": patch
---

Rename `Alert` → `Callout` (BREAKING for `@gradeui/ui`)

The old name implied modal/interruptive behaviour the component doesn't have — Apple HIG `Alert` is a *modal*, and `role="alert"` is *assertive* ARIA. The component is inline, ambient, and non-blocking. `Callout` is honest about that.

The `Alert` name is now deliberately reserved in the barrel for a future genuinely-interruptive primitive. For modal-alert semantics today (the thing HIG and React Native both call "Alert"), reach for `<Dialog>` — its sidecar and aliases route those prompts correctly.

### Migration

```diff
- import { Alert, AlertTitle, AlertDescription } from "@gradeui/ui";
+ import { Callout, CalloutTitle, CalloutDescription } from "@gradeui/ui";

- <Alert variant="warning">
+ <Callout variant="warning">
    <AlertTriangle />
-   <AlertTitle>Low disk space</AlertTitle>
-   <AlertDescription>2GB remaining on /dev/sda1.</AlertDescription>
- </Alert>
+   <CalloutTitle>Low disk space</CalloutTitle>
+   <CalloutDescription>2GB remaining on /dev/sda1.</CalloutDescription>
+ </Callout>
```

### Two follow-on changes in the same release

- **Dropped the `highlight` variant.** It overlapped `warning` (amber) semantically without offering a distinct intent. Use `variant="warning"` for amber attention, `variant="info"` for neutral attention.
- **Tightened ARIA.** The fixed `role="alert"` is replaced with a variant-conditional mapping: `role="alert"` (assertive) for `warning` / `destructive`; `role="status"` (polite) for `info` / `success` / `default`. Screen readers no longer interrupt the user for ambient confirmations like "Profile updated". Override via the `role` prop if needed.

### What didn't change

- The `variant` prop is intentionally preserved as-is in this pass. Splitting it onto orthogonal `intent` × `emphasis` axes is a separate cross-library refactor, not a one-component change.
- All theme tokens (`--destructive-soft`, `--success-deep`, etc.) are unchanged — Callout reads from the same colour pipeline Alert did.

### `@gradeui/studio` impact

- Studio's allow-list, sidecars, and playbook bundle now reference `Callout` instead of `Alert`. The Sandpack offline-export shim renamed in lockstep. Existing Studio designs that contain `<Alert>` won't compile in Fast Frame after upgrading — the chat will need to regenerate them, or a manual find-replace is fine.
- The docs route moves to `/components/callout`. No redirect — the old `/components/alert` route returns 404. Clean break (gradeui has no external consumers yet).
