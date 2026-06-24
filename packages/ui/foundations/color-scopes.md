---
foundation: color-scopes
classes: [scope-default, scope-inverse, scope-brand, scope-accent, scope-muted, scope-card]
applies_via: "Section scope=... | className=\"scope-*\""
---

# Colour scopes

A **scope** is a Figma-style *variable mode* scoped to a subtree. It is the primary
way a band changes colour. Putting a `scope-*` class on an element (or `scope` on a
`Section`) re-points the **surface family** — `--background`, `--foreground`, `--card`,
`--popover`, `--muted`, `--muted-foreground`, `--border` — for everything inside it,
while leaving the **action colours** (`--primary` / `--accent` / `--secondary` /
`--destructive`) vivid so a CTA still pops.

Descendants keep using the ordinary tokens (`bg-background`, `text-foreground`,
`bg-card`); only what those tokens *resolve to* changes. This is why you re-tone a
whole band by setting one scope, never by hand-colouring children.

## The scopes

| scope     | what it is                                                        |
|-----------|------------------------------------------------------------------|
| `default` | the page surface (omit `scope` to get this)                      |
| `inverse` | dark band / light text — the marketing flip                     |
| `brand`   | brand-toned surface (remaps from the theme's existing tokens)   |
| `accent`  | accent-toned surface                                             |
| `muted`   | a quiet, low-contrast band                                       |
| `card`    | a raised card-toned band with a hairline top/bottom border      |

`brand` / `accent` / `muted` / `card` remap straight from existing theme tokens — no
new tokens. `inverse` reads two stable mirrors (`--bg-base` / `--fg-base`) so the
fg/bg swap can't form a custom-property cycle.

## Usage

```jsx
// Each distinct band gets its own Section + scope so it's independently themeable.
<Section scope="inverse" pad="xl"><Container maxW="lg">{/* hero */}</Container></Section>
<Section pad="lg"><Container maxW="xl">{/* default-surface features */}</Container></Section>
<Section scope="muted" pad="lg"><Container maxW="xl">{/* quiet logos strip */}</Container></Section>

// Or drop the class on any element:
<div className="scope-brand">{/* re-toned island */}</div>
```

## Rules

- One band, one scope. Don't mix ad-hoc background/text colours inside a scoped band —
  let the scope do the work so the band re-themes as a unit.
- Scopes are for **structural surfaces**. For a loud on-brand splash use the
  **expressive** layer (see that foundation), not a scope.
