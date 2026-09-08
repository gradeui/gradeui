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

The starter persona does not yet have its own empty states: today it
changes the chrome and dataset only.
