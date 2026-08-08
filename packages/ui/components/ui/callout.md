---
name: Callout
import: "@gradeui/ui"
element: div
subcomponents: [CalloutTitle, CalloutDescription]
variants: [default, destructive, success, warning, info]
props:
  - variant? (default | destructive | success | warning | info) — semantic colouring; `default` is neutral
  - All native div HTML attrs
when_to_use: Inline, ambient, non-blocking status/feedback that sits inside the layout flow. Form-level validation summaries, settings-page notices, page-level banners. NOT a toast (use Sonner for transient). NOT a modal (use Dialog when the user must respond). Put an icon as first child — it's auto-positioned; CalloutTitle + CalloutDescription follow.
composes_with: [lucide-react icons as first child, Button (inside CalloutDescription), Card (as a section callout)]
aliases: [callout, banner, notice, inline alert, in-app notification, status banner, info banner, info callout, warning callout, success callout]
---

Renamed from `Alert` (May 2026). The old name implied modal/interruptive behaviour the component doesn't have — Apple HIG `Alert` is a modal, and `role="alert"` is assertive ARIA. Callout is honest about what it is: ambient, inline, non-blocking. For genuinely interruptive needs, reach for `<Dialog>`.

Variant tokens come from theme (`--destructive-soft`, `--success-deep`, etc.) so they restyle with the active Grade theme.

The icon slot sizes its direct `svg` child to 16px (`[&>svg]:h-4 [&>svg]:w-4`, Aug 2026): bare lucide icons default to 24px, which filled the 28px text inset and left no icon-to-title gap. Pass icons unsized; a size class on the icon itself loses to the slot.

```jsx
<Callout variant="warning">
  <AlertTriangle />
  <CalloutTitle>Low disk space</CalloutTitle>
  <CalloutDescription>2GB remaining on /dev/sda1.</CalloutDescription>
</Callout>
```

```jsx
// Ambient success notice — uses role="status" (polite) so screen
// readers don't interrupt the user. Warning/destructive get
// role="alert" (assertive) instead.
<Callout variant="success">
  <CheckCircle2 />
  <CalloutTitle>Profile updated</CalloutTitle>
  <CalloutDescription>Your changes are live.</CalloutDescription>
</Callout>
```

### Anti-patterns

DO NOT use `<Callout>` for interruptive or blocking messages. If the user must respond before continuing, use `<Dialog>` — the modal primitive that Apple HIG calls "Alert" and React Native exposes as `Alert.alert()`. Callout is ambient by design.

DO NOT pass `role="alert"` when the variant is `info` / `success` / `default` — the component already routes those to `role="status"` (polite), and overriding makes screen readers interrupt for non-urgent content.

DO NOT reach for `variant="warning"` to convey "this is just notable / FYI" — that's what `variant="info"` is for. Warning is for things that could go wrong if ignored; info is for ambient context.

The previous `variant="highlight"` (yellow) was dropped in the Alert → Callout rename — it overlapped `warning` semantically without offering a distinct intent. Use `warning` for amber attention and `info` for neutral attention.
