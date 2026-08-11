---
"@gradeui/ui": minor
---

Dialog: centred entrance, a real close target, and a responsive shape.

`DialogContent` used to slide in from the top-left on top of its own centring transform, which read as the panel flying in from the corner. It now fades and scales in place.

The close button grows to a 36px target with a 20px icon, and gains a `showClose` prop for dialogs that own their own dismissal.

New `layout` prop: `sheet` (default) makes the panel a full-screen sheet below `sm`, with padding clearing the device safe areas and its content scrolling, which is the right shape for forms and flows. `layout="center"` keeps the centred card at every width, for short confirmations and for anything the user cannot dismiss. From `sm` up both are the centred card, now at `p-8` with a `max-h-[85dvh]` cap.

Consumers passing an unprefixed `p-0` or `max-w-*` to `DialogContent` should prefix it (`sm:p-0`, `sm:max-w-md`) so it still wins at `sm` and above.
