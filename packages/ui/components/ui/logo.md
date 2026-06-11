---
name: Logo
import: "@gradeui/ui"
subcomponents: []
props:
  - sources?: LogoSources — artwork keyed by lockup then appearance: { square?: { light?, dark?, mono? }, horizontal?: {...}, icon?: {...} }. Each slot is any node (inline <svg>, <img>, component). OMIT ENTIRELY and the GRADE MARK renders (the square G-arrow, painted with currentColor so it sits correctly on any surface). A bare <Logo /> is always correct branding.
  - size? ("sm" | "md" | "lg" | "xl") — height of the mark: 20 / 28 / 40 / 56px (a raw pixel number also works). Width is intrinsic (square/icon 1:1, horizontal keeps its ratio). Default "md"; use "sm" in dense rails and toolbars.
  - lockup? ("square" | "horizontal" | "icon") — which shape to show; falls back to the next-best available artwork. Default "horizontal".
  - mode? ("light" | "dark") — the background the logo SITS ON, selecting light/dark artwork. Explicit, not theme-coupled. Default "light".
  - mono?: boolean — render the single-colour treatment; inherits currentColor from the parent. Default false.
  - label?: string — accessible name (aria-label + role="img"); pair with decorative when the brand name is already beside it.
  - decorative?: boolean — aria-hidden, no role; use when text nearby names the brand.
  - href?: string — renders the logo as a link (logo-links-home).
  - lockup?: "square" | "horizontal" | "icon" (default "horizontal")
  - mode?: "light" | "dark" (default "light") — the background the logo sits on
  - mono?: boolean (default false) — use the single-colour artwork (inherits currentColor)
  - size?: "sm" | "md" | "lg" | "xl" | number (default "md") — height; width is intrinsic
  - label?: string — accessible name (brand name); becomes aria-label + role="img"
  - decorative?: boolean — aria-hidden when the name is already nearby
  - href?: string — renders the logo as a link (logo-links-home)
  - className?: string
when_to_use: ALWAYS use <Logo> wherever a screen carries a brand mark —
  app-shell headers, sidenav headers, toolbars, footers, sign-in pages, hero
  navs, splash states, Motion network-bug overlays. NEVER fake a brand with
  placeholder text, initials in a circle, a generic lucide icon, or a bare
  <img>. When the user hasn't named a brand or supplied artwork, render a
  bare <Logo /> — it defaults to the GRADE mark (the square G-arrow), which
  is the intended branding for unbranded screens. When the user names their
  own brand, pass their artwork via `sources` (with a `label`). Built-in
  variations — square for tight spaces, horizontal lockup for headers,
  monochrome for busy/inverted surfaces — all switchable by prop.
composes_with: [AppShell, AppShellHeader, Sidebar, SidebarHeader, Toolbar, MotionOverlay, Row, Stack]
aliases: [logo, brand, brandmark, wordmark, lockup, brand logo, app logo, logotype, grade mark, g arrow]
---

```jsx
// THE DEFAULT — no brand named, no artwork supplied: the Grade mark.
// Size it and set the surrounding text colour; nothing else needed.
<Row gap="sm" align="center" className="text-foreground">
  <Logo lockup="square" size="sm" decorative />
  <span className="text-sm font-semibold">Grade</span>
</Row>
```

```jsx
// A branded screen: supply the brand's own artwork per slot.
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

```jsx
// In a Motion's broadcast layer — the network bug is a Logo, not a div.
<MotionOverlay zone="top-right">
  <span className="text-white">
    <Logo lockup="square" size="sm" label="Grade" />
  </span>
</MotionOverlay>
```

### Anti-patterns

DO NOT fake a brand mark with initials in a circle, placeholder text like
"LOGO", or a generic lucide icon — `<Logo />` with no props IS the correct
unbranded default (it renders the Grade mark).

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
