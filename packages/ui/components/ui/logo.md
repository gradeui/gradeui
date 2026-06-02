---
name: Logo
import: "@gradeui/ui"
subcomponents: []
props:
  - sources: LogoSources (required) — artwork keyed by lockup then appearance:
      { square?: { light?, dark?, mono? }, horizontal?: {...}, icon?: {...} }.
      Each slot is any node (inline <svg>, <img>, component).
  - lockup?: "square" | "horizontal" | "icon" (default "horizontal")
  - mode?: "light" | "dark" (default "light") — the background the logo sits on
  - mono?: boolean (default false) — use the single-colour artwork (inherits currentColor)
  - size?: "sm" | "md" | "lg" | "xl" | number (default "md") — height; width is intrinsic
  - label?: string — accessible name (brand name); becomes aria-label + role="img"
  - decorative?: boolean — aria-hidden when the name is already nearby
  - href?: string — renders the logo as a link (logo-links-home)
  - className?: string
when_to_use: A brand mark with built-in variations — a square mark for tight
  spaces, a horizontal lockup for headers, monochrome for busy/inverted
  surfaces. Reach for Logo in toolbars, sidenav headers, and footers instead
  of dropping a bare <img>, so the lockup and on-dark/on-light treatment are
  switchable by prop. The artwork is supplied by the consumer; Logo just picks
  the right slot for the context.
composes_with: [AppShell, AppShellHeader, Sidebar, SidebarHeader, Row, Stack]
aliases: [logo, brand, brandmark, wordmark, lockup, brand logo, app logo, logotype]
---

```jsx
// Sidenav header: square mark when collapsed, horizontal when expanded.
// Supply your own artwork per slot; here inline SVGs stand in.
<Logo
  lockup="horizontal"
  mode="dark"
  size="md"
  label="Acme"
  sources={{
    square: { light: <AcmeSquare />, dark: <AcmeSquareWhite /> },
    horizontal: { light: <AcmeWide />, dark: <AcmeWideWhite /> },
    icon: { mono: <AcmeGlyph /> },
  }}
/>
```

### Anti-patterns

DO NOT drop a bare `<img src="logo.png">` in a toolbar/sidenav/footer when you
want light/dark or square/horizontal switching — use `<Logo>` so the variant
is a prop.

DO NOT invert a colour logo with a CSS filter to fake a dark version — supply
the brand's real `dark` artwork in the `sources` slot.

DO NOT set both `label` and `decorative` — `decorative` hides the logo from
assistive tech; `label` names it. Pick one (name it unless the brand name is
already in the DOM right beside it).

DO NOT hardcode a width — `size` sets the height and the artwork keeps its own
aspect ratio (square/icon are 1:1, horizontal stays wide).
