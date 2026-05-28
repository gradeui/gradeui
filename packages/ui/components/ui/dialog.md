---
name: Dialog
import: "@gradeui/ui"
subcomponents: [DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose]
props:
  - Dialog: open?, onOpenChange? — Radix controlled/uncontrolled pattern
  - DialogTrigger: asChild? (wrap a Button)
  - DialogContent: surface? (solid | translucent | glass | glass-strong) — what the modal panel is *made of*. Defaults to `solid` (opaque `bg-background`). `glass` lets the page show through softly — pairs with rich backdrops or AI-suggestion modals.
  - DialogContent: accepts native div HTML attrs
  - DialogFooter: used for action rows
when_to_use: Modal interruptions — confirmations, focused forms, detail views, AI suggestion sheets. Dialog is the right primitive for Apple HIG / React Native "Alert" (modal) semantics. For non-blocking inline messaging use Callout; for transient notifications use Toaster (Sonner). Always include DialogTitle (a11y requirement).
composes_with: [Button (as DialogTrigger asChild, and inside DialogFooter), Input/Textarea/Select inside DialogContent, Code (for changelog / diff modals), MediaSurface (for image / preview modals)]
aliases: [modal, popup, overlay, alert, system alert, alert dialog, modal dialog, confirm dialog, react native modal, rn alert, glass modal, frosted modal, ai suggestion modal]
---

DialogContent sits at elevation-5 (the dialog tier). The Presence axes still apply: `surface` picks the material, `gds-aura-*` adds radiating state, the overlay scrim handles dimming the page.

---

### Scenario 1 — Destructive confirmation (default opaque)

You're confirming a destructive action: delete, discard, revoke. Keep the dialog opaque — the user should focus on the decision, not the page behind it. The raised Button + tonal `--btn-glow` keeps the destructive action visually heavy without going red-everywhere.

```jsx
<Dialog>
  <DialogTrigger asChild><Button variant="outline">Delete project</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete project?</DialogTitle>
      <DialogDescription>
        This will remove the project, its screens, and all comments. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="raised" style={{ "--btn-glow": "var(--destructive)" }}>
        Delete forever
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

No `surface` prop — `solid` is the right answer for high-stakes confirmations. The opacity reinforces "stop and decide".

---

### Scenario 2 — Glass modal over a rich canvas (creative-tool aesthetic)

You're building a creative tool — Studio, a presentation builder, a photo editor. The canvas behind the dialog is visually rich (a layout in progress, an image, generative art). A solid dialog cuts a hole through the work. Glass keeps the work visible while focusing attention.

```jsx
<Dialog>
  <DialogTrigger asChild><Button>Add a comment</Button></DialogTrigger>
  <DialogContent surface="glass" className="shadow-elevation-5">
    <DialogHeader>
      <DialogTitle>Comment on Hero section</DialogTitle>
      <DialogDescription>
        Visible to your team and to Studio when it next regenerates this screen.
      </DialogDescription>
    </DialogHeader>
    <Textarea placeholder="What should change about this section?" />
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button>Post comment</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

`surface="glass"` is the canvas-tool signature. The user keeps spatial awareness of what they were just looking at; the dialog feels like a layer above the work, not a separate page.

---

### Scenario 3 — AI suggestion sheet (translucent + aura)

Studio is offering a suggestion. It shouldn't feel as heavy as a destructive confirmation — it's a recommendation, not a demand. Translucent (no blur) is lighter than glass; the aura ring announces "this is from an AI agent".

```jsx
<Dialog open={hasSuggestion}>
  <DialogContent
    surface="translucent"
    className="shadow-elevation-5 gds-aura-ring"
    style={{ "--aura-color": "var(--selected-glow)" }}
  >
    <DialogHeader>
      <DialogTitle>Three buttons could align</DialogTitle>
      <DialogDescription>
        Toolbar buttons match TabsList height when size="sm". Apply across all three?
      </DialogDescription>
    </DialogHeader>

    <Card surface="glass" className="shadow-elevation-2">
      <CardContent>
        <Code source={suggestedDiff} language="tsx" diff={{ added: [2, 3, 4] }} bare />
      </CardContent>
    </Card>

    <DialogFooter>
      <Button variant="ghost">Dismiss</Button>
      <Button>Apply suggestion</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Three Presence axes layered: `surface="translucent"` (material), `shadow-elevation-5` (depth), `gds-aura-ring` (state signal). The inner Card uses `surface="glass"` for a different reason — to read as a nested floating preview rather than a flat content block.

---

### Anti-patterns

**DO NOT use `surface="glass"` for destructive confirmations.** Glass implies "the page is still alive behind this" — users will be less decisive. Opaque is the right material for high-stakes choices.

**DO NOT roll glass by hand on DialogContent.**

```jsx
{/* ❌ Misses edge highlight, no theme tuning, no inspector knob. */}
<DialogContent className="bg-background/50 backdrop-blur-md">

{/* ✅ */}
<DialogContent surface="glass">
```

**DO NOT skip DialogTitle.** Screen readers announce the title on open — without it the dialog reads as "[unlabeled dialog]". If the design has no visible title, wrap a visually-hidden title:

```jsx
<DialogHeader>
  <DialogTitle className="sr-only">Image preview</DialogTitle>
</DialogHeader>
```

**DO NOT use Dialog for ambient messaging.** Toast for transient ("Saved"), Callout for inline ("3 unread comments"), Dialog only when the user MUST respond before continuing.
