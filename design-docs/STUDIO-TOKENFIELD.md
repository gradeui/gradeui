# STUDIO-TOKENFIELD — the inspector's value-editing rules, in plain English

This document is the source of truth for how **every value control in the
Studio inspector behaves**. The component is `TokenField`
(`apps/docs/components/studio/token-field.tsx`); the scoped token lists come
from the registry (`apps/docs/lib/token-registry.ts`). The model is
deliberately Figma's variable-binding model — if a behaviour question comes
up, "what would Figma do?" is the tiebreaker. The whole point: people must be
able to *design* comfortably in Grade, because the animation tooling sits on
top of what they design.

## The one mental model

A field is always in exactly **one of three states**:

1. **Unset** — nothing authored on this node. The element renders whatever
   its component/theme defaults say.
2. **Bound** — the value is a **token** (Tailwind-backed today: `rounded-md`,
   `gap-4`, `text-sm`, `bg-card`, `shadow-lg`, a contract enum like Grid's
   `gap="lg"`). Written as a class (or contract prop) in the JSX.
3. **Detached** — the value is a **raw CSS value** (`19px`, `4rem`, `50vh`,
   a hex+opacity, an X/Y/blur/spread shadow). Written as **inline `style`**
   on the JSX node.

A node is **never in two states at once** for the same property: binding a
token strips the inline value, detaching strips the token — always composed
into **one undo step**.

## Why detached values are inline style (non-negotiable)

Fast Frame — the **default renderer** — uses a stylesheet compiled at build
time. A class assembled at runtime (`rounded-[19px]`) produces **no CSS**
there. Inline `style` needs no compiler, so it is the only carrier for raw
values. Bound tokens stay classes because every token the inspector can mint
is force-emitted into the package stylesheet via the `@source inline(...)`
safelist block in `packages/ui/styles/globals.css`. **If you add a new token
area, add its scale to that block** or its classes will silently not render
(the "blend modes don't do anything" bug).

## Display rules

- **Unset:** a plain **greyed value** (placeholder styling) — `0` for
  spacing/gap, `100%` for opacity, `Inherit` for font size, `None` for
  radius/fill. It is *not* a chip: chips are reserved for tokens that
  genuinely exist on the node — we never fabricate token-looking chips from
  computed values. No detach icon (there is nothing to detach).
- **Bound:** the token renders in a **chip** (lozenge) tinted with
  `--studio-accent` (theme-independent editing chrome). The property glyph
  (opacity checker, droplet, side icons) sits at the left edge via the
  trigger's `startSlot`. No dropdown chevron — the right edge belongs to the
  **detach** (unlink) icon, tooltipped "Detach …".
- **Detached:** the raw value sits in a freeform input with its **unit as a
  suffix**, and the **attach** icon (hexagon — the token glyph) in the same
  in-field position, so fields never resize across bind/detach.
- The picker rows show `token-name · resolved-value` (`rounded-md · 6`).
  Readouts are **bare numbers, no "px"** — tokens resolve through the theme,
  so a hard unit would be a lie. Units only ever appear on detached raw
  values. Anything deliberately muted inside a row must brighten on the
  highlighted row (`group-data-[highlighted]`) or it becomes unreadable.

## Interaction rules

- **Token-first, by design**: there is **no direct freeform entry** on an
  unset or bound field. The only path to a raw value is pick a token →
  **detach** → edit. This is deliberate (and matches Figma): the default
  path always lands on the scale, and raw values stay an explicit escape
  hatch rather than a parallel input mode. Don't "fix" this by making the
  bound field typeable.
- **Pick a token** → writes the class/prop, clears any inline value.
- **Detach** (unlink icon, bound state only) → seeds the raw input with the
  **bound token's pixel value** and writes it as inline style, stripping the
  token.
- **Attach** (hexagon icon, detached state) → opens a **dismissable menu**
  of the scoped tokens — it never writes by itself. The menu leads with a
  **"Closest match"** to the current raw value (raw normalised to px;
  rem/em ≈ ×16; vh/% aren't comparable). Picking binds; Esc/click-away does
  nothing.
- **Freeform fields** accept any CSS length unit (`px` default when bare,
  `rem`, `vh`, `%`, …) — typing a unit switches the suffix live. They also
  accept **maths** (`16/2`, `4*4+2`, `100/3px`); invalid input **reverts to
  the previous value**. **↑/↓ nudge by 1 (⇧ = ×10)** and commit live; the
  per-side spacing inputs nudge by one spacing step (4px, ⇧ = 40px) so the
  half-step snap never fights the arrows.
- **Per-side spacing** (padding/margin): every side/axis is its own
  TokenField; sides collapse to the H/V pair only when opposite sides match
  (tokens *and* raw values). A detached side detaches **only that side**
  (`paddingTop` etc.). The expand toggle is a ghost button (no border).
- **Set vs unset is recorded in the JSX, nowhere else**: no token = unset
  (component default applies), explicit `p-0` = a real zero. Clearing a
  field returns it to unset.

## Overrides & defaults

- When a section carries any override (token **or** inline), it shows a
  warning-toned **"Custom" badge** with a **↺ reset** button — one click
  strips every token and inline value in the section in one undo step,
  restoring component/theme defaults.
- Component-baked defaults (CardContent's `p-6 pt-0`) are **invisible to the
  className parser** — the panel edits the JSX override layer only. The live
  `computedStyle` payload (per-side paddings/margins, gap, fontSize) exists
  on the selection for truth-telling; **real** default chips will come from
  contracts shipping derived style defaults (see the task: parse a
  component's own classes at build time and carry them on the contract).
  Until then, unset means a grey `0` — honest about what's *authored*, not a
  fabricated token — and the section shows the baked truth as a display-only
  **"Default · …" caption** under the fields (Padding/Margin in CSS-shorthand
  form, Gap, Font size — same pattern Radius/Border/Shadow already use), fed
  from the live computed style. That's how a `<Button>` whose screen JSX has
  no `className` at all still reports its real cva-resolved values.

## Architecture notes

- **Registry-abstracted:** `getAreaTokens(area)` is the only seam between
  TokenField and the token backend. Today it maps Tailwind scales; a DTCG /
  theme-token backend replaces the function internals without touching any
  consumer (see STUDIO-FILLS.md's token-picker plan).
- **One write channel:** sections mutate through `onApplySource(mutate,
  label)` — a single source transformation per user action (className +
  style together), so undo history stays 1:1 with intent.
- **Two renderers, one truth:** the selection payload (incl.
  `computedStyle`) is built by the shared selection agent; the
  `StudioSelection` type in `chat-sandpack.ts` duplicates the agent's
  `ComputedStyleHint` shape — keep them in sync.
- **Slots, not wrappers:** the Select trigger has `startSlot` (and
  `chevron={false}`) like Input's slot API. Never put a bare `<span>` as a
  trigger's direct child — `[&>span]:line-clamp-1` stacks its children
  vertically.
- **Tooltips:** icon-only affordances use `IconTip` (styled, arrowed) — not
  the native `title`.

## Responsive overrides (typography v1)

Generated screens lean on `text-5xl md:text-8xl`-style ladders. The base
parsers deliberately ignore prefixed classes, which used to make the
inspector lie: the field showed the base token while the preview rendered
the `md:` override, so edits "did nothing".

The model is **explicit, per-property** — deliberately NOT Webflow's
canvas-context model (where the active viewport silently decides which
breakpoint you edit; it routinely catches people out):

- Every typography control carries a `BreakpointOverridesEditor` in its
  label row. Overrides present → amber breakpoint badges (`md` `lg`);
  none → a ghost `+`. The tooltip spells out the contract: "set by CSS
  override — the field below edits the base value".
- Clicking opens a popover with one row per **editable breakpoint**
  (`EDITABLE_BREAKPOINTS` = sm/md/lg) and a scoped token picker; "—"
  clears the override. Tailwind is mobile-first, so a breakpoint value
  applies from that width UP; the base field is everything below.
- The size picker includes the display sizes (6xl–9xl) via
  `FONT_SIZE_OVERRIDE_SCALE` — hero ladders are the main use.
- xl/2xl overrides the model emits surface read-only (pointer at the
  Class-names row / chat). Every mintable class is safelisted in
  `globals.css` (`{sm:,md:,lg:}` blocks) — extending
  `EDITABLE_BREAKPOINTS` REQUIRES extending that block.
- Machinery: `FAMILY_BODY` patterns + `parseBreakpointOverrides` /
  `parseBreakpointToken` / `setBreakpointToken` in
  `lib/tailwind-classes.ts` — exact-list bodies shared between badge and
  editor so they can't drift.

The popover is cascade-literate: a read-only **Base** row anchors the
ladder ("Base · below 640px" + the authored base class), each breakpoint
row is labelled with its min-width ("md · 768px+"), un-overridden rows
read "Inherit · <whatever wins below>", and a **Current** badge marks
the row the preview is actually applying. "Current" comes from
`viewportPx` on the selection payload — the iframe's `innerWidth`
captured at click time (a viewport flip after selecting goes stale until
the next pick; acceptable, and the natural upgrade is re-reporting on
`grade:` viewport pushes).

Out of scope for v1 (revisit if demand): responsive overrides for
non-typography areas (spacing is the likely next ask — the machinery is
family-generic on purpose); live re-capture of `viewportPx` on viewport
flips.

## Still open (tracked)

- Contracts shipping derived style defaults (real grey default chips).
- Badge+reset rollout to Radius / Typography / Blending / Border / Shadow.
- Searchable attach menu if token sets outgrow a glance.
- Studio agents briefed on Tailwind v4 idioms; theme-input audit table;
  raw-triplet → readable `oklch()` theme re-up.
