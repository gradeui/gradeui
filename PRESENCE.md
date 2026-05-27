# Presence — Elevation, Surface, Aura

Three parallel token systems that together define an element's **presence** on screen. Each is independently composable; a single component reaches for all three when it needs to.

| System | Question it answers | Vocabulary |
|---|---|---|
| **Elevation** | How high does this sit off the page? | layers (`bevel-hi`, `bevel-lo`, `contact`, `lift`, `heat-*`, `pressed`) → levels (`0` through `5`) → state variants (`hot`, `pressed`) |
| **Surface** | What is this surface *made of*? | `solid`, `translucent`, `glass`, `glass-strong` |
| **Aura** | What is this element actively radiating? | `ring` (pulse), `gradient` (rotating border), `shimmer` (sweep) |

A Studio AI-suggestion card in this framing is `elevation-4` + `surface-glass` + `aura-ring`. Each axis tunes independently — change one without disturbing the others, and themes can override all three.

All three live in `packages/ui/styles/globals.css` (canonical) and are mirrored to `apps/docs/app/globals.css` until docs migrates to importing `@gradeui/ui`'s CSS directly.

---

## Elevation

### Atomic sub-tokens

Each shadow layer is one box-shadow line, composed from three or four atomic sub-tokens: `-y` (offset), `-blur`, `-spread` (where relevant), `-alpha`. Lowering `--shadow-lift-alpha` globally gives the whole DS a "lighter" feel without touching component CSS.

The colour of each layer is fixed by convention:

| Layer | Colour | Role |
|---|---|---|
| `bevel-hi` | white | top inset highlight (the "catch" of light) |
| `bevel-lo` | black | bottom inset shadow (the bevel undercut) |
| `contact` | black | tight outer drop, 1–2px blur (sitting on a surface) |
| `lift` | black | diffuse outer drop, 12px blur (floating) |
| `lift-deep` | black | deeper drop, 40px blur (dialogs, sheets) |
| `heat-inner` | `var(--btn-glow)` | tonal hover bloom inset from the bottom edge |
| `heat-outer` | `var(--btn-glow)` | tonal hover bloom radiating outward |
| `pressed-bevel` | black | inset shadow simulating a key push (active state) |

`--btn-glow` defaults to `--selected-glow` (blue). Per-element override:

```jsx
<Button variant="raised" style={{ '--btn-glow': 'var(--warning)' }}>Iterate</Button>
```

### Composed layer tokens

Each layer assembles its sub-tokens into a complete box-shadow expression: `--shadow-bevel-hi`, `--shadow-lift`, etc. Components compose layers into a complete stack without having to know the atomic numbers.

### Elevation presets

The default contract — components read these, not the individual layers, unless they're doing something custom.

| Token | Stack | Use for |
|---|---|---|
| `--elevation-0` | (none) | flat surfaces, ghost buttons |
| `--elevation-1` | `contact` | inputs, minimal-lift buttons, sidebar collapse |
| `--elevation-2` | `bevel-hi` + `bevel-lo` + `contact` | interactive surfaces with a sense of "key" |
| `--elevation-3` | `bevel-hi` + `bevel-lo` + `contact` + `lift` | **raised buttons** at rest |
| `--elevation-4` | `contact` + `lift` | popovers, dropdowns, hovercards |
| `--elevation-5` | `contact` + `lift-deep` | dialogs, sheets, modals |

### State variants

| Token | Use for |
|---|---|
| `--elevation-hot` | hover state on raised/tactile surfaces — adds `heat-inner` + `heat-outer` in the active tone |
| `--elevation-pressed` | active/pressed state — inverts to inset push |

### Tailwind utilities

The default Tailwind shadow scale is **repointed** onto the elevation system, so existing `shadow-md` calls automatically inherit the new look:

| Tailwind class | Token |
|---|---|
| `shadow-none` | `--elevation-0` |
| `shadow-sm` | `--elevation-1` |
| `shadow` (default) | `--elevation-2` |
| `shadow-md` | `--elevation-4` |
| `shadow-lg` / `xl` / `2xl` | `--elevation-5` |
| `shadow-inner` | `--shadow-pressed-bevel` |

New code should prefer the explicit `shadow-elevation-N` utilities — they're unambiguous about which level is intended:

```jsx
<div className="shadow-elevation-3">…</div>  // raised key feel
<div className="shadow-elevation-5">…</div>  // dialog
<div className="shadow-raised hover:shadow-hot active:shadow-pressed">…</div>
```

Single-layer atoms are also exposed for components that need to compose their own stack: `shadow-bevel-hi`, `shadow-bevel-lo`, `shadow-contact`, `shadow-lift`, `shadow-lift-deep`, `shadow-heat-inner`, `shadow-heat-outer`.

### Light direction

Light comes from above. Bevel-hi at the top, bevel-lo at the bottom, drops fall downward (positive y). An inverse-light theme can negate the atomic y-offsets without touching component CSS — that work isn't done yet but the system supports it.

### Dark mode

Alphas bump in dark mode (shadows fade against dark surfaces). Defined once in `.dark { … }`; everything cascades.

---

## Surface

What the surface is *made of*. Independent from elevation (how high it sits) and from aura (what it's radiating). A glass card can sit at elevation-4 with a calm aura, or at elevation-2 with no aura — these axes don't entangle.

### Atomic sub-tokens

`--surface-alpha-*` (solid, translucent, glass, glass-strong) and `--surface-blur-*` (subtle, glass, strong). Plus `--surface-edge-alpha` and `--surface-edge` for the inner "wet" highlight that gives glass its boundary.

### Composed surface tokens

All theme-aware — read from `--card`, so each theme automatically gets its own frosted tint without per-theme overrides.

| Token | Use for |
|---|---|
| `--surface-solid` | default opaque card surface |
| `--surface-translucent` | menu sheets, command palettes (82% opacity) |
| `--surface-glass` | floating panels (58% opacity + 14px blur) |
| `--surface-glass-strong` | full-page overlays (42% + 24px blur) |

### Classes

| Class | What it does |
|---|---|
| `.rds-surface-solid` | bg only |
| `.rds-surface-translucent` | bg only |
| `.rds-surface-glass` | bg + backdrop-filter + edge highlight + faint border |
| `.rds-surface-glass-strong` | bg + stronger blur + edge + border |

Tailwind utilities: `bg-surface-solid`, `bg-surface-translucent`, `bg-surface-glass`, `bg-surface-glass-strong` (just the colour). For the full glass effect including blur, use the class.

---

## Aura

What's actively *radiating* from an element. State signals — AI attention, generation-in-progress, selection focus. Three composable styles that stack:

| Style | Implementation | Looks like |
|---|---|---|
| `.rds-aura-ring` | animated `box-shadow` outer ring | a soft halo breathing around the element (2.4s cycle) |
| `.rds-aura-gradient` | rotating conic-gradient on a `::before` pseudo, masked to the border ring | a tonal light walking around the perimeter (6s rotation) |
| `.rds-aura-shimmer` | diagonal sweep on `::after` via `background-position` | a highlight sliding across the surface (2s sweep + 1.2s pause) |

### Tone

All three default to `--aura-color`, which defaults to `--selected-glow` (blue). Override per-element for danger / success / brand attention:

```jsx
<Button className="rds-aura-ring" style={{ '--aura-color': 'var(--success)' }}>
  Ready to ship
</Button>
```

### Combining

The three styles compose. A "Studio is generating" indicator can run ring + shimmer simultaneously:

```jsx
<Card className="rds-aura-ring rds-aura-shimmer">…</Card>
```

### Per-instance timing & easing

Every aura style exposes duration and easing as CSS vars. A heavier button that wants a slower pulse can override locally without rewriting keyframes:

```jsx
<Button
  className="rds-aura-ring"
  style={{
    '--aura-pulse-duration': '3.2s',
    '--aura-pulse-ease': 'cubic-bezier(0.65, 0, 0.35, 1)',
  }}
/>
```

Available knobs:
- Ring: `--aura-ring-spread`, `--aura-ring-blur`, `--aura-ring-alpha-min/-max`, `--aura-pulse-duration`, `--aura-pulse-ease`
- Gradient: `--aura-gradient-thickness`, `--aura-gradient-duration`, `--aura-gradient-ease`
- Shimmer: `--aura-shimmer-width`, `--aura-shimmer-alpha`, `--aura-shimmer-duration`, `--aura-shimmer-ease`, `--aura-shimmer-delay-between`

### Reduced motion

`prefers-reduced-motion: reduce` disables all aura animations and holds the ring at a steady mid-state (no breathing). Honoured automatically by the classes.

---

## Migration notes

- Existing `shadow-sm/md/lg/xl/2xl` calls in components keep working — they're transparently routed onto the elevation tokens via the Tailwind preset.
- `--rds-shadow-*` CSS var references (used inside `globals.css`, e.g. `[data-card-style="elevated"]`) are repointed too. No call-site changes required.
- `.rds-button-raised` (the existing raised Button class) is now composed from elevation tokens internally. Visual output is identical to the pre-refactor version; future tweaks happen at the token level.

## Future work

- **Inverse-light theme** — flip atomic y-offsets to support light-from-below.
- **Gradient borders as a first-class layer** beyond aura — e.g. always-on tonal borders for premium cards.
- **Theme builder** — the system is ready to be visualised in a 3-column theme builder modal (themes library / token overrides / live preview grid). See task #16.

## Cross-references

- `packages/ui/components/ui/button.tsx` — Button `variant="raised"` is the first consumer
- `packages/ui/COMPONENTS.md` — components inventory
- `packages/ui/styles/globals.css` — canonical token definitions
- `apps/docs/app/globals.css` — mirror (kept in sync until docs migrates)
- `gradeui/CLAUDE.md` — repo orientation
