# @gradeui/glint

The Glint US business accounts demo as a real Next.js app: the eleven
screens of the Studio prototype (project "Glint",
`8e65f8f7-f995-4c47-bc39-8f68b42a86e4`) promoted into routed, source-
controlled pages.

**Why this exists:** the Studio project stays the drafting space, but a
client demo needs a defined, locked-down place that cannot change or
break mid-demo. This app is that place. The URL you send is backed by
git; nothing done in Studio moves it. Updates land by editing this
source, or by explicitly re-promoting a screen (below).

## Routes

| Route | Studio screen |
|---|---|
| `/` | US Demo Landing |
| `/onboarding/step0` | 0 Before you apply |
| `/onboarding/step1` | 1 Business type |
| `/onboarding/step2` | 2 Business details |
| `/onboarding/step3a` | 3a Owner identity (SMLLC branch) |
| `/onboarding/step3b` | 3b Owners & control (all other types) |
| `/onboarding/step4` | 4 Expected activity |
| `/onboarding/step5` | 5 Documents |
| `/onboarding/step6` | 6 Certification |
| `/onboarding/step7` | 7 Review & submit |
| `/status` | Application status |
| `/dashboard` | Dashboard — logged-in home |
| `/activity` | Activity — history |
| `/gold` | Gold — wallet |
| `/s/<designId>` | 307 redirect to the screen's route |

`lib/screens.ts` is the registry tying each route to its Studio
identity (screen name + design id + promoted version). Two link styles
work because of it: the pretty URL, and the stable `/s/<id>` form that
survives any future slug rename.

## How it works

- **Navigation** stays on the Studio protocol: promoted JSX keeps its
  `data-grade-goto="<screen name>"` attributes untouched.
  `components/goto-bridge.tsx` (mounted in the root layout) captures
  those clicks and drives the Next router through the registry, with
  every route prefetched. Unknown targets fall through as inert, e.g.
  the status screen's "Go to dashboard" points at a screen that is not
  promoted yet.
- **Wizard chrome** lives once in `app/onboarding/layout.tsx` +
  `components/layouts/onboarding.tsx` (chrome components that back a
  route layout live under `components/layouts/`). Step pages carry only their form
  column, so header, progress bar and step rail persist across
  navigations. The Owners rail entry and the automatic Back button
  branch on the stored business type (3a for SMLLC, else 3b).
- **Flow state** (`lib/flow-store.ts`) is the Studio FlowStore ported
  to a hydration-safe useSyncExternalStore over sessionStorage. Answers
  survive navigation and reloads within a tab; the landing's Start
  button resets them for a fresh run.
- **Theme**: `theme/glint.theme.json` is the Studio project's
  ThemeInput. `pnpm gen:theme` runs the same generator the Studio
  preview uses (imported from apps/docs at dev time only) and writes
  `app/theme.css`, which is checked in. The root layout pins dark mode
  and the component-shape attributes, and loads Inter + IBM Plex Mono
  via next/font against the vars the theme references.
- **Styling** imports the canonical `@gradeui/ui/styles/globals.css`
  (Tailwind v4) and scans this app plus the workspace ui package via
  `@source` so screen utilities compile. See `app/globals.css`.

## Commands

| Command | Does |
|---|---|
| `pnpm -F @gradeui/glint dev` | dev server on port 3010 |
| `pnpm -F @gradeui/glint build` | production build (type gate) |
| `pnpm -F @gradeui/glint gen:theme` | regenerate app/theme.css from the ThemeInput |

## Promoting a screen from Studio

1. Dump the raw source. From `apps/mcp-server` (its node_modules carry
   the Supabase client), with the docs env loaded:

   ```bash
   cd apps/mcp-server && set -a && source <(grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' ../docs/.env.local) && set +a && OUT_DIR=/tmp/glint-screens npx tsx scripts/dump-glint-screens.mts
   ```

   Or fetch a single screen over MCP with `get_screen`.

2. Transform it into a page:

   ```bash
   python3 scripts/promote-screen.py /tmp/glint-screens/<file>.jsx app/<route>/page.tsx --func <Name>Page --name "<Studio screen name>" --id <designId> --version <updatedAt ms> [--step | --unwrap AppChrome]
   ```

   `--step` unwraps the OnboardingLayout chrome (the route layout
   provides it). Screens outside the wizard keep their full layout.

3. Add or refresh the entry in `lib/screens.ts` (slug, name, id, step,
   `promotedAt` = the version you promoted).

4. `pnpm -F @gradeui/glint build`. Strict TS may want light prop
   annotations on untyped helper components inside the screen.

5. Check the page in the browser (`pnpm -F @gradeui/glint dev`).

Shared components ported so far: `OnboardingLayout`, `AppChrome`,
`Wordmark` (+ the pinned metal ladders), `FlowStore`, `Persona`,
`Market` and `BuyFlow`. Any NEW Studio shared component needs a
one-time port into `components/` or `lib/` and a mapping line in
`scripts/promote-screen.py`. Keep the ported copy in sync with its
Studio twin: both carry a header note saying so.

## Deploying to Vercel

This app is designed to be its own Vercel project on its own domain:

1. Vercel dashboard: Add New Project, import this GitHub repo.
2. Root Directory: `apps/glint` (enable "Include files outside the
   root directory", which is the default; the build needs the
   workspace's packages/ui and the root lockfile).
3. Framework preset Next.js; leave build and install commands default.
   Vercel detects the pnpm workspace from the root lockfile.
4. No environment variables are required.
5. Attach the demo domain when ready.

Pages ship `robots: noindex` (see `app/layout.tsx`); drop that if this
ever becomes a public surface.

## Extracting from the monorepo later

The app's runtime depends only on published packages, so lifting it
into its own repo is mechanical:

1. Copy `apps/glint` out; `git init`.
2. `package.json`: change `"@gradeui/ui": "workspace:*"` to a real
   published version.
3. `app/globals.css`: replace the three `../../../packages/ui/...`
   `@source` lines with
   `@source "../node_modules/@gradeui/ui/dist/index.mjs";`.
4. `tsconfig.json`: inline what `../../tsconfig.base.json` provided.
5. `scripts/generate-theme.mts` imports the generator from apps/docs
   and stops working outside the monorepo. `app/theme.css` is checked
   in, so nothing breaks; regenerate future theme changes from the
   monorepo or vendor the generator.

`apps/consume-app` is the reference for the extracted shape (a plain
npm consumer of @gradeui/ui).
