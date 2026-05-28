---
name: Banner
import: "@gradeui/ui"
variants: [default, info, success, warning, destructive, announcement]
props:
  - variant? (default | info | success | warning | destructive | announcement) — intent + tonal direction. `default` is a calm muted strip; `announcement` is a low-alpha brand tint for "new feature" messaging; status variants pick up the soft+deep token pairs.
  - surface? (solid | translucent | glass | glass-strong) — material applied over the variant tint. `glass` for banners that sit over imagery / generative backdrops.
  - align? (start | center | between) — justify behaviour of the inner flex row. Defaults to `between` so the action / dismiss button right-align.
  - sticky?: boolean — stick to the top of the scroll container.
  - dismissible?: boolean — render the trailing X close button. Pair with `onDismiss` to react.
  - onDismiss?: () => void
  - icon?: ReactNode — leading icon slot. NOT inferred from variant; pass what fits the message.
  - action?: ReactNode — trailing slot before dismiss. Usually a `<Button size="sm">` or `<a>`.
  - role?: string — overrides the automatic role mapping (warning/destructive → alert, others → status).
when_to_use: A full-width horizontal strip surfacing system-level state, announcements, or first-run guidance — "you're previewing a draft", "investigating incident", "new feature available", "send your design to Figma". Distinct from Callout (inline boxed message in the layout flow), Toast (transient floating notification), Dialog (modal interrupt). Banner is what lives at the TOP of an AppShellHeader, page, or panel.
composes_with: [AppShellHeader (most common host — banner sits ABOVE the header content), Button (in the action slot), Link (inside the content), Lucide icons (in the icon slot)]
aliases: [banner, notification banner, system banner, header banner, announcement bar, top bar, status bar, promo banner, incident banner, draft banner, first run banner, glass banner, sticky banner]
---

Banner is the "horizontal strip across the top of something" primitive. The shape difference from Callout matters: Callout is an inline boxed message inside layout flow; Banner is full-bleed and meant to anchor at the top of a page, panel, or AppShellHeader.

---

### Scenario 1 — First-run guidance (default)

A one-line hint surfaced the first time a user lands on a tab or screen. Calm muted tint, dismissible, lives above the main content.

```jsx
<Banner
  variant="default"
  dismissible
  onDismiss={dismiss}
  action={
    <a href={pluginUrl} target="_blank" rel="noreferrer" className="text-sm font-medium underline underline-offset-4">
      Get the Grade plugin →
    </a>
  }
>
  Send your design to Figma as live components.
</Banner>
```

This is the canonical replacement for the inline-style `FigmaIntroBanner` that motivated this primitive — same content, but the tint inherits properly from the active theme and the dismiss button gets the same focus-ring treatment as every other interactive element.

---

### Scenario 2 — Incident / warning banner at AppShellHeader top

You need to tell users something is going wrong without interrupting them. Banner with `variant="warning"` (or `destructive` if it's worse) sits at the very top of the AppShell.

```jsx
<AppShell>
  <Banner
    variant="warning"
    sticky
    icon={<AlertTriangle className="h-4 w-4" />}
    action={
      <Button asChild variant="outline" size="sm">
        <a href="/status">Status page</a>
      </Button>
    }
  >
    We're investigating an incident affecting search results. Comments and edits are unaffected.
  </Banner>
  <AppShellHeader>...</AppShellHeader>
  <AppShellMain>...</AppShellMain>
</AppShell>
```

`sticky` so it doesn't scroll away (incidents stay visible). `variant="warning"` gets `role="alert"` automatically — screen readers interrupt to announce it.

---

### Scenario 3 — Announcement banner (brand tint, low-key)

New feature announcement. You want to be noticed but not alarming. The `announcement` variant uses a low-alpha brand tint so the banner reads as "we have news" without competing with the page.

```jsx
<Banner
  variant="announcement"
  dismissible
  onDismiss={dismissAnnouncement}
  icon={<Sparkles className="h-4 w-4" />}
  action={
    <Button asChild size="sm">
      <a href="/components/code">See how →</a>
    </Button>
  }
>
  <strong className="font-medium">New —</strong> Code component lands with diff hero and scroll-triggered reveals.
</Banner>
```

---

### Scenario 4 — Glass banner over a hero image

The marketing site has a hero image and a top banner promoting an event. A solid banner would punch a stripe through the imagery. Glass keeps the image visible.

```jsx
<div className="relative h-screen" style={{ backgroundImage: "url(/hero/teams-shipping.jpg)", backgroundSize: "cover" }}>
  <Banner
    surface="glass"
    sticky
    align="center"
    action={
      <Button size="sm" variant="outline" asChild>
        <a href="/launchweek">Watch the launch →</a>
      </Button>
    }
  >
    GradeUI launch week kicks off 14 June.
  </Banner>
  ...
</div>
```

`surface="glass"` + the default `variant="default"` gives a frosted strip with `--surface-blur-glass` worth of blur. Pair with `align="center"` when the banner has no leading icon — keeps the message visually centered.

---

### Anti-patterns

**DO NOT roll a banner with inline styles or Tailwind soup.**

```jsx
{/* ❌ Wrong token names, no dismiss focus ring, no role mapping, no theme inheritance. */}
<div style={{ background: "oklch(var(--gds-primary) / 0.06)", color: "var(--gds-foreground)" }}>
  Send your design to Figma. <a>Get the Grade plugin →</a>
</div>

{/* ✅ */}
<Banner variant="announcement" dismissible onDismiss={dismiss} action={...}>
  Send your design to Figma.
</Banner>
```

The inline-style original this primitive replaced was effectively invisible because it reached for `--gds-primary` / `--gds-foreground` tokens that don't exist. The fallback values kicked in and the banner washed out completely. Banner exists so this category of mistake is impossible.

**DO NOT use Banner for inline form-level validation.** That's Callout's job — it's a boxed message inside the layout flow. Banner is full-bleed chrome.

**DO NOT use Banner for transient confirmation ("Saved").** That's Toast (Sonner). Banner is persistent until dismissed.

**DO NOT stack multiple Banners.** Two banners reading at the same time fight for attention. If you genuinely need two messages, surface the highest-priority one and queue the second for after the first is dismissed.

**DO NOT pass `role="alert"` on a calm `variant="info"` Banner.** The variant→role mapping is intentional. Info/success/announcement are polite; warning/destructive interrupt. Overriding makes assistive tech behaviour inconsistent with the visual signal.
