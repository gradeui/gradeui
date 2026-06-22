# sites-spike — Grade × Astro

A proof of concept for the **Sites** direction (see `../../STUDIO-SITES.md`): build
fast, themeable, multi-section sites out of the Grade design system, rendered as
static HTML by Astro. Not production. This doc is the map.

## What it proves

1. **`@gradeui/ui` is a plain npm package.** Any framework can install and consume
   it. Here it's Astro, but the same import works in Next, Remix, Vite, or a
   customer's own app. "Own the components, bring your own interface", made real.
2. **Grade components render to static HTML with zero JS.** Astro server-renders
   the React components; nothing ships to the browser unless a component opts in
   with a `client:*` directive.
3. **A theme is just data written into the page.** A site's whole look is one
   `data-grade-theme` attribute plus, optionally, a block of CSS custom
   properties. No runtime theme provider.
4. **A page is an ordered stack of sections, driven by a CMS.** `/home` is built
   from a content file, not hand-coded markup.

## Quick start

```bash
# from the repo root (gradeui/)
pnpm install                 # links @gradeui/ui from source (workspace dep)
pnpm -F sites-spike dev      # dev server, prints the port (usually 4321)
pnpm -F sites-spike build    # static output in dist/ — note: no JS bundle
pnpm -F sites-spike preview  # serve the built output
```

Two routes:

- **`/`** — `index.astro`. A hand-coded showcase: hero, feature cards, expressive
  bands, and the theme switcher. Good for eyeballing components.
- **`/home`** — the **CMS-driven** page. Content comes from
  `src/content/pages/home.json`; edit that file and the page changes.

## How it's wired

### The package + Astro

`astro.config.mjs` registers the React renderer and the Tailwind v4 Vite plugin,
and sets `vite.ssr.noExternal: ["@gradeui/ui"]` so the package is bundled through
Vite's lenient resolver rather than Node's strict ESM (see "Gotchas").

### CSS and theming

`src/styles/global.css` is the single Tailwind entry. Three things matter:

1. **It imports the package's _source_ stylesheet**, not a second copy of
   Tailwind:

   ```css
   @import "@gradeui/ui/styles/globals.css"; /* this file already does @import "tailwindcss" */
   ```

   Importing `tailwindcss` again would double the entry and silently drop the
   theme (the page renders black-and-white).

2. **It scans the package source for utility classes.** Tailwind skips
   `node_modules` during auto-detection, and `@gradeui/ui` resolves there (it's a
   workspace symlink), so utilities baked _into the components_ (e.g. `Container`'s
   `max-w-7xl`) were never generated and rendered inert. The fix:

   ```css
   @source "../../../../packages/ui/components/**/*.{ts,tsx}";
   @source "../../../../packages/ui/lib/**/*.{ts,tsx}";
   ```

   > Any external app consuming `@gradeui/ui` from source needs the same
   > `@source`, or it should import the **precompiled** `@gradeui/ui/styles.css`
   > (every utility already baked in, no scanning required). Worth surfacing in
   > the public docs.

3. **It holds the demo theme palettes** (`violet` / `amber` / `rose`), each a
   block of CSS custom properties keyed to `data-grade-theme`. The neutral default
   and teal `energy` ship from the package itself.

Theme switching is a single attribute on `<html>`: `data-grade-theme="energy"`.
`index.astro` has a small vanilla switcher (theme swatches + light/dark) that
flips that attribute and persists the choice in `localStorage`, with a pre-paint
inline script so there's no flash. Zero framework JS.

### Expressive accents (section colour)

The **expressive layer** (`../../STUDIO-EXPRESSIVE.md`, now in
`packages/ui/styles/globals.css`) paints whole sections louder than the neutral
chrome. Two attributes resolve a band's colour:

```html
<section data-expressive="accent1" data-expressive-tier="dark" class="expressive">
```

- `data-expressive` picks one of five accent slots: `accent1`–`accent5`
  (rose, orange, amber, yellow, olive).
- `data-expressive-tier` picks one of four tiers: `superlight`, `light`, `dark`,
  `superdark`.
- The `.expressive` class paints the resolved `--gds-expressive-bg` /
  `--gds-expressive-fg` pair.

The accents are fixed ramps today (faithful to the Figma "Expressive"
collection); they'll later be generated from one hue per slot, the token shape
won't change.

### The CMS (`/home`)

A page is an ordered stack of typed sections. The data lives in files now; the
shape is the real Sites model.

| File | Role |
| --- | --- |
| `src/content.config.ts` | The schema. A `pages` collection; each page is `{ title, theme, sections[] }`. Each section is a typed object discriminated by `type` (hero, logos, features, pricing, testimonial, media, cta). Every section takes a colour treatment (`scope` _or_ `expressive`) and a Container measure (`maxW`). |
| `src/content/pages/home.json` | The content. Edit this and the page changes. This is the "CMS". |
| `src/components/SectionRenderer.astro` | Maps one section object to a Grade composition. |
| `src/pages/[slug].astro` | One static route per content file (`home.json` → `/home`) via `getStaticPaths`. |

To add a page, drop another JSON file in `src/content/pages/`. To add a section
**type**, extend the discriminated union in `content.config.ts` and add a branch
to `SectionRenderer.astro`.

Swapping the file loader for a **Payload** source later changes only
`content.config.ts`'s `loader`; the renderer and routes are untouched.

## What hot-reloads vs what needs a restart

Editing an `.astro` page, a component, `home.json`, or `global.css` **hot-reloads**
live, no restart. The dev server must be **restarted** only for:

- `src/content.config.ts` — the content config is read once at startup.
- `astro.config.mjs` — config is loaded once.
- New dependencies / `package.json` changes (after `pnpm install`).

(The earlier "edits don't show up" confusion was none of these: it was Tailwind
not generating component-baked classes until the `@source` lines were added. That
is fixed and now hot-reloads like everything else.)

## Gotchas

- **`lexical-beautiful-mentions` ESM.** `@gradeui/ui`'s Composer pulls this dep,
  whose published ESM uses extensionless re-exports that strict resolvers reject.
  The real fix lives upstream: it's now in tsup's `noExternal`, so a
  `pnpm -F @gradeui/ui build` bakes it into `dist` and every consumer is safe.
  `vite.ssr.noExternal` in this app is a second belt-and-braces.
- **Single Tailwind entry.** Don't add `@import "tailwindcss"` to `global.css`;
  the package stylesheet already does it.
- **Arbitrary Tailwind values.** Classes like `max-w-[96rem]` only generate if
  Tailwind sees the literal string in a scanned file (covered by the `@source`
  lines above).
- **Map / Video are runtime-heavy.** `Map` (MapLibre/Mapbox/Google) and
  `VideoPlayer` need a `client:*` directive and their optional peer SDK installed;
  they won't render in pure static output.

## Roadmap (towards real Sites)

- **Payload CMS** as the content source (replaces the file loader), with an admin
  UI and a database.
- **Deploy + domains** via Vercel (per `../../STUDIO-SITES.md`).
- **More section types**: logos marquee, stats, FAQ (`FaqBlock`), real `Map`
  and `VideoPlayer` bands.
- **Multi-page routing** (already supported: one content file per route).
- **An agent in the build** that composes sections from a prompt, using the same
  Grade allowlist + contracts the Studio MCP relies on.

## Versions

Astro `^7`, `@astrojs/react` `^6`, `@tailwindcss/vite` `^4.3`, React `^19`,
`@gradeui/ui` `workspace:*`. If Astro 7 (a brand-new major) misbehaves on install,
fall back to `astro ^6.3` + `@astrojs/react ^5` (still current, Vite 7).
