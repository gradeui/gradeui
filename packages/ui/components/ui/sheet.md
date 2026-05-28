---
name: Sheet
import: "@gradeui/ui"
subcomponents: [SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose]
props:
  - Sheet: open?, defaultOpen?, onOpenChange?, modal? (default true)
  - SheetTrigger: asChild?: boolean
  - SheetContent: side? "top" | "right" | "bottom" | "left" (default "right")
  - SheetContent: surface? (solid | translucent | glass | glass-strong) — what the sheet panel is *made of*. `solid` is the default opaque `bg-background`. Reach for `glass` whenever the canvas behind the sheet (a layout in progress, a media gallery, a dashboard) should remain visible.
  - SheetContent: className?: string — usually set a width (right/left) or height (top/bottom)
  - SheetTitle / SheetDescription: identify the sheet to screen readers; required for accessibility even if visually styled differently
  - SheetClose: asChild? — usually wraps a Button labelled Cancel or Done
when_to_use: A panel that slides in from a screen edge — mobile nav drawers, side panels for editing a single record without leaving the list, filter trays on small viewports, Studio-style inspector panels. For a centered focus modal use Dialog. For a transient announcement use Toast (Sonner). For inline reveals use Collapsible.
composes_with: [Form controls (an inline edit sheet), Button (trigger + close), AppShellNav (mobile-only swap), Code (changelog drawers), MediaSurface (image-detail sheets)]
aliases: [sheet, drawer, side panel, slide-in, nav drawer, mobile drawer, slide-over, action sheet, modal sheet, bottom sheet, side sheet, react native modal sheet, bottom-sheet, ios action sheet, inspector panel, glass sheet, frosted drawer]
---

SheetContent sits at elevation-5. The `surface` axis controls material independently of `side` (which controls layout direction) — every combination is valid.

---

### Scenario 1 — Edit-record drawer (default opaque)

A right-edge drawer that lets a user edit one record without losing their place in a list. The list is the user's context — the drawer doesn't need to blur it; it just needs to be visibly distinct.

```jsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Edit user</Button>
  </SheetTrigger>
  <SheetContent className="w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle>Edit user</SheetTitle>
      <SheetDescription>Update Elena's profile and role.</SheetDescription>
    </SheetHeader>
    <Stack gap="md" className="py-4">
      <Stack gap="xs">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Elena Okafor" />
      </Stack>
      <Stack gap="xs">
        <Label htmlFor="role">Role</Label>
        <Select>{/* … */}</Select>
      </Stack>
    </Stack>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="ghost">Cancel</Button>
      </SheetClose>
      <Button>Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

`solid` is the right default for editing workflows. Form fields need maximum legibility; blur behind them works against that.

---

### Scenario 2 — Glass inspector panel (creative tool aesthetic)

You're building a creative tool. The canvas is the work — a Studio layout, an image being annotated, a presentation slide. The inspector panel needs to live alongside the work without obscuring it. Glass is the canonical "I am chrome, not content" signal.

```jsx
<Sheet open={hasSelection} modal={false}>
  <SheetContent
    side="right"
    surface="glass"
    className="w-96 shadow-elevation-5"
  >
    <SheetHeader>
      <SheetTitle>Selection</SheetTitle>
      <SheetDescription>Button — Toolbar &gt; trailing</SheetDescription>
    </SheetHeader>

    <Stack gap="md" className="py-4">
      <Stack gap="xs">
        <Label>Variant</Label>
        <Select defaultValue="raised">{/* … */}</Select>
      </Stack>
      <Stack gap="xs">
        <Label>Size</Label>
        <ToggleGroup type="single" defaultValue="md">
          <ToggleGroupItem value="sm">sm</ToggleGroupItem>
          <ToggleGroupItem value="md">md</ToggleGroupItem>
          <ToggleGroupItem value="lg">lg</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  </SheetContent>
</Sheet>
```

Three things to notice: `modal={false}` so the user keeps interacting with the canvas while the inspector is open; `surface="glass"` so the canvas reads through; `shadow-elevation-5` to lift the panel cleanly off the canvas. This is the Studio inspector pattern.

---

### Scenario 3 — Bottom action sheet (mobile, glass for iOS feel)

The iOS-native action sheet has glass behind it. Matching that material on mobile flows is "feels like a native app" by default.

```jsx
<Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
  <SheetContent
    side="bottom"
    surface="glass"
    className="rounded-t-2xl"
  >
    <SheetHeader className="text-center">
      <SheetTitle>Share screen</SheetTitle>
    </SheetHeader>
    <Stack gap="xs" className="py-4">
      <Button variant="ghost" className="justify-start"><Mail /> Email</Button>
      <Button variant="ghost" className="justify-start"><MessageCircle /> Message</Button>
      <Button variant="ghost" className="justify-start"><Copy /> Copy link</Button>
    </Stack>
    <SheetClose asChild>
      <Button variant="outline" className="w-full">Cancel</Button>
    </SheetClose>
  </SheetContent>
</Sheet>
```

`side="bottom"` + `surface="glass"` + `rounded-t-2xl` is the iOS action-sheet recipe. The rounded top corners signal "this can be dismissed by dragging down" even before any gesture handler is wired up.

---

### Anti-patterns

**DO NOT roll glass by hand on SheetContent.**

```jsx
{/* ❌ Tailwind soup — no edge highlight, blur isn't theme-tuned. */}
<SheetContent className="bg-background/60 backdrop-blur-md">

{/* ✅ */}
<SheetContent surface="glass">
```

**DO NOT use `surface="glass"` for a modal sheet that contains a long form.** Form legibility wins over aesthetic. If the user is going to spend 30 seconds in this sheet, give them an opaque background.

**DO NOT pair `surface="glass"` with `modal={true}` and the default scrim.** The scrim already dims the canvas — adding glass on top of a dimmed canvas reads as "two competing layers of de-emphasis". Either turn off the scrim (`modal={false}`), or use `surface="solid"`.

**DO NOT skip SheetTitle.** Screen readers announce it on open. If the design has no visible title, wrap a `sr-only` one.
