---
name: Popover
import: "@gradeui/ui"
subcomponents: [PopoverTrigger, PopoverContent, PopoverAnchor]
props:
  - Popover: open?, defaultOpen?, onOpenChange?, modal? (default false)
  - PopoverTrigger: asChild?: boolean — usually a Button
  - PopoverContent: side? "top" | "right" | "bottom" | "left"; align? "start" | "center" | "end"; sideOffset?, alignOffset?, collisionPadding?, className?
  - PopoverContent: surface? (solid | translucent | glass | glass-strong) — what the popover surface is *made of*. `solid` is the default opaque `bg-popover`. `translucent` is the Apple HIG menu-sheet feel. `glass` for floating panels over rich canvases (Studio inspector, image-tool palette).
  - PopoverAnchor: asChild?: boolean — pin the popover to a different element than the trigger
when_to_use: A floating panel anchored to a trigger that contains interactive content — date pickers, color pickers, filter pickers, "more info" panels, inline forms. Differs from Tooltip (hover-only, no focusable content) and Dialog (modal, blocks the page). DatePicker, DateRangePicker, and the Combobox pattern all compose Popover internally.
composes_with: [Button (as trigger), Calendar (date picker), Command (combobox), Form controls (inline edit popover), Code (code-detail popovers)]
aliases: [popover, dropdown panel, floating panel, inline editor, attached panel, filter pop, popover view, popoverpresentation, attached popover, glass popover, frosted popover, inspector popover]
---

PopoverContent sits at elevation-4. Three scenario recipes — match the material to the canvas the popover floats over.

---

### Scenario 1 — Filter popover (default opaque)

You're attaching a filter picker to a button in a list/table header. The page behind is mostly white space and a table — there's nothing visually important to preserve through the popover. Opaque is the right default.

```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Filter className="h-4 w-4" /> Filters
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-72" align="end">
    <Stack gap="md">
      <Stack gap="xs">
        <Label>Plan</Label>
        <Select>{/* … */}</Select>
      </Stack>
      <Stack gap="xs">
        <Label>Status</Label>
        <Select>{/* … */}</Select>
      </Stack>
      <Row justify="end" gap="xs">
        <Button variant="ghost" size="sm">Clear</Button>
        <Button size="sm">Apply</Button>
      </Row>
    </Stack>
  </PopoverContent>
</Popover>
```

`solid` keeps the form fields maximally legible. Filter popovers are read-heavy; legibility wins over aesthetic.

---

### Scenario 2 — Glass inspector popover (creative tool aesthetic)

You're building Studio, a presentation editor, or a vector tool. The user clicked a selected layer and a popover offers per-element knobs. The canvas behind is the work — they need to keep spatial awareness of what they just clicked. Glass is the canonical signal.

```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon"><Palette className="h-4 w-4" /></Button>
  </PopoverTrigger>
  <PopoverContent
    surface="glass"
    className="w-80 shadow-elevation-4"
    align="end"
    sideOffset={8}
  >
    <Stack gap="md">
      <Row justify="between" align="center">
        <span className="text-sm font-medium">Button — selected</span>
        <Badge variant="outline">raised</Badge>
      </Row>

      <Stack gap="xs">
        <Label>Tone</Label>
        <Row gap="xs">
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--selected-glow)" }} />
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--success)" }} />
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--warning)" }} />
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--destructive)" }} />
        </Row>
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
  </PopoverContent>
</Popover>
```

`surface="glass"` + `shadow-elevation-4` is the Studio-inspector signature. The user's eye stays on the canvas; the popover reads as chrome layered above it.

---

### Scenario 3 — AI suggestion popover (translucent + aura)

A different shape from the destructive Dialog confirmation: an inline AI suggestion that surfaces while the user keeps working. Translucent stays light; aura announces the AI origin.

```jsx
<Popover open={hasSuggestion}>
  <PopoverAnchor>
    <Code source={selectedSnippet} language="tsx" highlight={[3]} bare />
  </PopoverAnchor>
  <PopoverContent
    surface="translucent"
    className="w-96 shadow-elevation-4 gds-aura-ring"
    style={{ "--aura-color": "var(--selected-glow)" }}
    side="bottom"
    align="start"
  >
    <Stack gap="sm">
      <Row gap="xs" align="center">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Studio suggestion</span>
      </Row>
      <p className="text-sm">
        This Toolbar would line up edge-to-edge with the TabsList below if it used <code>size="sm"</code>. Apply?
      </p>
      <Row justify="end" gap="xs">
        <Button variant="ghost" size="sm">Dismiss</Button>
        <Button size="sm">Apply</Button>
      </Row>
    </Stack>
  </PopoverContent>
</Popover>
```

Note `PopoverAnchor` — the popover is pinned to the selected snippet, not to a trigger button. This is the "annotation surfaces next to the thing it annotates" pattern.

---

### Anti-patterns

**DO NOT roll glass by hand on PopoverContent.**

```jsx
{/* ❌ Misses edge highlight, fixed-step blur. */}
<PopoverContent className="bg-popover/50 backdrop-blur-md">

{/* ✅ */}
<PopoverContent surface="glass">
```

**DO NOT use Popover for content that needs a modal interaction.** Popover is non-modal — pointer-down outside dismisses it. If the user must decide before continuing, reach for Dialog.

**DO NOT use `surface="glass-strong"` on PopoverContent.** It's tuned for full-page overlays; on a 288px popover it just reads as washed out.

**DO NOT use Popover when the trigger is a hover target with no focusable content.** That's Tooltip's job — Popover requires focus, Tooltip dismisses on hover-out.
