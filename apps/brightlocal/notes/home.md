# The prototype

The Reviews area of the replatformed BrightLocal, built on the published
design system package (`@brightlocal/ui-components` 2.27.0, tokens
0.12.0). Everything renders from the real components; nothing is a
picture.

## How to drive it

- **Cmd+K** opens the demo menu: persona, layout engine, layout preset,
  screens, layout options, settings, docs.
- **Alt+T** opens the layout tweaker on any screen (modified engine only).
- **Cmd+.** opens these notes for the current page.
- `?persona=<id>` on any link selects a persona. `?variant=<slug>` on a
  base route pins a layout option.

## Personas

| Persona | Who | Data |
|---|---|---|
| Starter | Single location, just started, needs handholding | Minus 1 Studios |
| Engaged | Single location with months of use | Minus 1 Studios |
| Multi-location | Several locations under one account | Harbour & Co |
| Agency | Managing client locations | Northside Dental |

The starter persona seeds every Reviews screen for a business in its
first week: four Google reviews and one connected source (Manager and
Tracker), no campaigns (Builder opens on its empty state), showcases
ready but not yet placed, and a set-up guide leading the hub.

## URLs

Routes are flat for now (`/reviews/tracker`). Every route lives in one
registry (`lib/screens.ts`), so moving to
`/locations/<location>/reviews/tracker` later is a folder move plus
redirects, and the breadcrumbs, which already navigate by screen id,
keep working unchanged.
