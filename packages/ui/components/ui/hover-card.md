---
name: HoverCard
import: "@gradeui/ui"
subcomponents: [HoverCardTrigger, HoverCardContent]
props:
  - HoverCard: open?, defaultOpen?, onOpenChange?, openDelay? (default 700), closeDelay? (default 300)
  - HoverCardTrigger: asChild?: boolean — usually a Link or Button
  - HoverCardContent: side?, align?, sideOffset?, alignOffset?, className?
  - HoverCardContent: surface? (solid | translucent | glass | glass-strong) — what the preview surface is *made of*. `solid` (default) is `bg-popover`. `glass` for hover previews over rich content (a media feed, a layout canvas).
when_to_use: Rich preview content surfaced on hover — user profile mini-cards on @-mentions, link previews, definition popups, layer-thumbnail peeks. Pointer-only by design (no touch-friendly trigger); pair with a click target for touch devices, or fall back to Popover. NEVER use HoverCard for critical info — if the user can't reach it via keyboard or touch, it might as well not exist for accessibility.
composes_with: [Avatar (user preview), Card (richer content), Link (the trigger), MediaSurface (link/layer previews), Code (snippet previews)]
aliases: [hover card, hover preview, mention preview, profile peek, link preview, rich tooltip, link preview card, profile hover, peek card, glass preview, frosted preview]
---

HoverCardContent sits at elevation-4. The surface choice depends entirely on what's behind the trigger.

---

### Scenario 1 — User mention preview (default opaque)

The trigger is inline text in a comment thread, document, or feed. The reader's eye is on the prose; the hover-card needs to feel like a small contained card popping up next to the link. Opaque is correct.

```jsx
<HoverCard>
  <HoverCardTrigger asChild>
    <a href="/u/elena" className="font-medium underline">@elena</a>
  </HoverCardTrigger>
  <HoverCardContent className="w-72">
    <Row gap="sm" align="start">
      <Avatar>
        <AvatarImage src="/avatars/elena.png" />
        <AvatarFallback>EO</AvatarFallback>
      </Avatar>
      <Stack gap="xs">
        <span className="font-semibold">Elena Okafor</span>
        <span className="text-sm text-muted-foreground">
          Design lead · Joined Mar 2025
        </span>
        <span className="text-sm">Currently focused on the layout-quality skill suite.</span>
      </Stack>
    </Row>
  </HoverCardContent>
</HoverCard>
```

---

### Scenario 2 — Glass layer preview in a canvas tool

You're hovering a layer name in the Studio layer list. The canvas alongside shows the actual layer in context. A glass hover-card carrying a thumbnail of the layer keeps the canvas visible AND gives the preview presence.

```jsx
<HoverCard openDelay={300}>
  <HoverCardTrigger asChild>
    <button className="text-sm hover:underline">Hero card · v0</button>
  </HoverCardTrigger>
  <HoverCardContent
    surface="glass"
    className="w-80 shadow-elevation-4"
    side="right"
    align="start"
  >
    <Stack gap="sm">
      <MediaSurface
        aspect="video"
        source={{ kind: "image", src: "/previews/hero-v0.png" }}
        alt="Hero card v0 thumbnail"
      />
      <Stack gap="xs">
        <span className="text-sm font-medium">Hero card · v0</span>
        <span className="text-xs text-muted-foreground">Last edited 2m ago by Elena</span>
      </Stack>
    </Stack>
  </HoverCardContent>
</HoverCard>
```

Tighter `openDelay` (300ms vs the default 700) because the user is scanning a list — they want previews to come up faster.

---

### Scenario 3 — Code snippet preview (translucent)

You're showing a hover preview of a code reference (a function name in docs, a symbol in a comment). Translucent lets the page peek through without committing to glass blur — feels lighter for a quick read.

```jsx
<HoverCard>
  <HoverCardTrigger asChild>
    <code className="font-mono text-sm rounded bg-muted px-1.5 py-0.5">surfaceBg()</code>
  </HoverCardTrigger>
  <HoverCardContent
    surface="translucent"
    className="w-96 shadow-elevation-4 p-0"
  >
    <Stack gap="xs" className="p-4 pb-2">
      <span className="text-sm font-medium">surfaceBg(surface, defaultBgClass)</span>
      <span className="text-xs text-muted-foreground">@gradeui/ui · lib/surface</span>
    </Stack>
    <Code
      source={`function surfaceBg(surface, defaultBgClass) {
  return surface === "solid" ? defaultBgClass : "";
}`}
      language="ts"
      bare
      className="text-xs p-4"
    />
  </HoverCardContent>
</HoverCard>
```

---

### Anti-patterns

**DO NOT use HoverCard on touch devices for critical info.** There's no hover on touch — the preview is unreachable. Either provide a click fallback or use Popover.

**DO NOT roll glass by hand on HoverCardContent.**

```jsx
{/* ❌ */}
<HoverCardContent className="bg-popover/60 backdrop-blur-md">

{/* ✅ */}
<HoverCardContent surface="glass">
```

**DO NOT use HoverCard for tooltips.** Tooltips are tiny, label-only, and dismiss instantly. HoverCard is for rich content with delay. If the content is a few words, reach for Tooltip.

**DO NOT use HoverCard as a primary navigation surface.** It dismisses on pointer-out — if the user has to traverse a path to reach a button inside, the preview will close before they get there.
