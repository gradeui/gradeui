---
foundation: spacing-layout
section_pad: [none, sm, md, lg, xl]
container_maxw: [sm, md, lg, xl, prose, full]
tokens: ["--spacing"]
---

# Spacing & layout

Layout rhythm comes from two primitives, not from ad-hoc padding/margins on bands.

## Section — vertical rhythm

`Section` owns the band's vertical padding via `pad` (responsive `py`):

| pad    | use                                   |
|--------|---------------------------------------|
| `none` | flush band (e.g. full-bleed media)    |
| `sm`   | tight                                 |
| `md`   | compact                               |
| `lg`   | **default** — standard band rhythm    |
| `xl`   | hero / statement band                 |

`Section` is always full width and never sets a max width — that is the Container's job.

## Container — the measure (horizontal)

`Container` centres content and sets gutters via `maxW`:

| maxW    | use                                            |
|---------|------------------------------------------------|
| `sm`    | narrow (focused CTA / form)                    |
| `md`    | medium                                         |
| `lg`    | **default** — standard content measure         |
| `xl`    | wide (feature grids, dense dashboards)         |
| `prose` | long-form reading measure (markdown / article) |
| `full`  | edge-to-edge — full-bleed bands STILL use this |

`Container grid` snaps children to a 12-column grid (`col-span-*` on children).

## Density

Base spacing scales from the theme's `--spacing` density token, so the whole system
re-pitches its rhythm from one knob. Spacing utilities derive from it — don't hardcode
absolute spacing that can't follow the density.

## Rules

- Bands get their vertical rhythm from `Section pad`, their measure from `Container maxW`.
- Full-bleed = `<Container maxW="full">`, **never** omitting the Container.
- Don't hand-roll `py-*` / `max-w-* mx-auto px-*` page wrappers — that's what these replace.
