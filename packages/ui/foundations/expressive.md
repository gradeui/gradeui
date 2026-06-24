---
foundation: expressive
attributes: [data-expressive, data-expressive-tier]
tokens: [--gds-expressive-bg, --gds-expressive-fg, "--gds-expressive-accent{1..5}-{100,300,700,900}"]
---

# Expressive colours

Expressive colours are a **highlight layer**, not the base UI. They paint *sections* —
marketing banners (including banners inside an app), feature cards, promo strips,
editorial blocks — anywhere you want an on-brand splash that is deliberately louder
than the neutral product chrome.

They are **NOT** for base surfaces, body text, form controls, or anything structural.
The semantic layer (surfaces, actions, borders) and colour **scopes** own the product
UI. Expressive sits on top, scoped to a region. So: "make a promo banner" → reach for
expressive; "build a settings form" → do not.

## The model — 5 accent slots × 4 tiers

Five **positional** accent slots (`accent1` … `accent5`) — names are positions, not
hues, so a slot's colour can be retuned without renaming anything. Each slot resolves
to four bg+fg tiers, each pair legible by construction:

| tier         | background        | foreground        |
|--------------|-------------------|-------------------|
| `superlight` | `{accent}/100`    | `{accent}/900`    |
| `light`      | `{accent}/300`    | `{accent}/900`    |
| `dark`       | `{accent}/700`    | `{accent}/100`    |
| `superdark`  | `{accent}/900`    | `{accent}/100`    |

## Usage

Set the slot + tier on the region; paint with the expressive tokens:

```jsx
<Section pad="xl">
  <Container maxW="lg">
    <div data-expressive="accent3" data-expressive-tier="superdark"
         className="rounded-2xl p-10"
         style={{ background: "var(--gds-expressive-bg)", color: "var(--gds-expressive-fg)" }}>
      {/* promo content — bg + fg come as a legible pair */}
    </div>
  </Container>
</Section>
```

`data-expressive="accentN"` selects the slot; `data-expressive-tier` selects the tier;
`--gds-expressive-bg` / `--gds-expressive-fg` then resolve to that pair. Switch the slot
or tier → the whole region reskins, on-brand, contrast intact.

## Rules

- Expressive = louder-than-chrome highlight regions only. Never base surfaces or controls.
- Always use the **pair** (`bg` + `fg`) so contrast holds; don't pick a background without
  its paired foreground.
- The 5 accent ramps are rebrandable via `--gds-expressive-accent{N}-{100,300,700,900}`.
