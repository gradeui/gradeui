# Studio — shell, storage, users & impersonation

Companion to [STUDIO.md](./STUDIO.md). That file is about how the model + Sandpack + selection bus work. This one is about everything around the model: the chrome, the data model, the storage layer, and the user/team/org/impersonation scaffolding that landed in late May 2026.

If you're reading this looking for the allow-list or the system prompt, you want STUDIO.md. If you're trying to understand how Studio decides who you are, what project you're in, or how panels are laid out, you're in the right place.

## High-level shape

```
┌── Topbar ───────────────────────────────────────────────────────┐
│ Grade Studio                  [pill] [shield] [avatar] [gear]   │
├── AppShellMain ─────────────────────────────────────────────────┤
│                                                                 │
│  ┌── left ──┐  ┌── canvas ──────────────┐  ┌── right ──────┐    │
│  │ Projects │  │  Toolbar              │  │  Layout       │    │
│  │  menu OR │  │  Path bar             │  │  Theme        │    │
│  │  Chat    │  │  Sandpack iframe(s)   │  │  Notes        │    │
│  └──────────┘  └────────────────────────┘  └───────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

The whole thing is composed from `@gradeui/ui` primitives — `AppShell`, `Sidebar` (variant="panel"), `Sheet`, `ResizablePanelGroup` (reserved for future drag-resize), `Tabs`. No bespoke layout primitives. Studio is the design system eating its own dogfood; if the chrome can't be built from primitives we add to the DS, not work around it.

Code map for the chrome:

```
apps/docs/
├── app/studio/page.tsx                  # The route. Owns state + URL + provider wiring.
├── components/studio/
│   ├── studio-canvas.tsx                # Middle column. Toolbar, breadcrumb, Sandpack mounts.
│   ├── studio-chat.tsx                  # Left column (when in a focused screen).
│   ├── projects-menu.tsx                # Left column (when in "All screens" / grid mode).
│   ├── studio-right-tabs.tsx            # Right column (Layout / Theme / Notes).
│   ├── project-settings-sheet.tsx       # Per-project Sheet — rename/delete/theme reset/shared.
│   ├── super-admin-sheet.tsx            # Internal-only impersonation surface.
│   ├── studio-settings.tsx              # Session-wide settings Sheet (gear icon).
│   └── design-breadcrumb.tsx            # Canvas toolbar breadcrumb (Project / Screen).
└── lib/
    ├── studio-storage/                  # See "Storage layer" below.
    └── studio-users/                    # See "Users & impersonation" below.
```

## Layout

### The shell

`AppShell` (from `@gradeui/ui`) with `nav="none"`. Header (the topbar) and Main are vertically stacked; the Main slot hosts the body row. We deliberately don't use AppShell's `nav="three-pane"` variant because Studio's body is a flex layout that supports panel collapse + drag-resize semantics, not a static CSS grid. AppShell is the structural shell; the body row is its own composition inside it.

The body row is a horizontal `flex` of three siblings (chat | canvas | settings) on desktop. Side panes carry `flex-basis: var(--gds-studio-chat-width, 320px)` / `var(--gds-studio-settings-width, 340px)`, the canvas is `flex-1 min-w-0`. Collapse animates basis to 0 — `transition-[flex-basis] duration-150` on the wrappers + `hidden` on the inner div so collapsed panes don't get rendered at all. The structure is deliberately shaped like a `ResizablePanelGroup` so swapping to drag-resize later is "wrap each child in `<ResizablePanel>`" — not a rewrite.

### Toggle + keyboard

The canvas toolbar carries two icon buttons — `PanelLeft` (start of toolbar) and `PanelRight` (end). Tooltips read "Hide chat panel (⌘\)" / "Show settings panel (⌘⇧\)" so the shortcuts are discoverable. State is held at the page level (`leftPanelOpen` / `rightPanelOpen`) and persisted to localStorage so a reload restores your last layout.

Keyboard shortcuts wire globally via a single `window.addEventListener("keydown")` effect:

| Shortcut | Action |
|----------|--------|
| `⌘\` | Toggle chat (left) panel |
| `⌘⇧\` | Toggle settings (right) panel |
| `⌘⇧⌥A` | Open the SuperAdminSheet (only effective when current user has `superAdmin === true`) |

The handler ignores key events fired inside `<input>`, `<textarea>`, or `contenteditable` (broadly checked so embedded code editors inside Sandpack also pass through). Otherwise typing `\` inside the chat composer would hijack the toggle.

### Mobile

Below `md` (`max-width: 767px`) the inline left + right panes don't mount. Each becomes a `<Sheet>` overlay — left from the left, right from the right. The same toggle buttons and keyboard shortcuts drive the Sheet open/close state. State for "should this panel be visible" is shared across breakpoints so flipping the viewport doesn't toggle the panels behind the user's back.

### Context-aware left pane

The left pane swaps content based on canvas zoom (which is hoisted to the page so it can drive the swap):

- `zoom === "fit"` (focused on one screen) → `<StudioChat>`. Chat is screen-scoped; this is where prompts go.
- `zoom === "all"` (grid view of all screens in this project) → `<ProjectsMenu>`. Chat makes no sense at the grid level, so we replace it with the workspace navigator.

Clicking a screen in `ProjectsMenu` flips zoom back to fit on that screen — single click into the workbench.

### Canvas breadcrumb

`<DesignBreadcrumb>` in the canvas toolbar reads `<Project> / <Screen>` in fit mode (project crumb clicks navigate to grid view), and `<Project> / All screens (N)` in grid mode. The project name comes from `projects.find(p => p.id === activeProjectId)?.name`, passed down through `StudioCanvas.projectName`. Falls back to "All screens" for embed surfaces with no project semantics.

## Storage layer

`lib/studio-storage/` defines the contract that EVERY persistence backend implements. Today there's one adapter — `LocalStorageStudioStorage` — so cloning the repo and running `pnpm dev` gives a working Studio with no setup. The contract is async-by-default so swapping the adapter for Supabase later is a one-file change in the factory.

```
lib/studio-storage/
├── index.ts            # Factory: getStudioStorage() → singleton adapter.
├── types.ts            # StudioStorage interface + Project/ProjectSnapshot.
└── local-adapter.ts    # LocalStorage implementation + migration chain.
```

### The interface

`StudioStorage` covers six entity families:

| Entity | Methods |
|--------|---------|
| Projects | `listProjects`, `loadProject`, `createProject`, `renameProject`, `deleteProject`, `saveProject` |
| Active project pointer | `getActiveProjectId`, `setActiveProjectId` |
| Teams | `listTeams`, `getTeam`, `createTeam` (takes optional `orgId`), `renameTeam`, `deleteTeam` |
| Team memberships | `listMemberships`, `addMembership` (upsert), `removeMembership`, `updateMembershipRole` |
| Users | `listUsers`, `getUser`, `createUser`, `updateUser` (patch shape) |
| Orgs | `listOrgs`, `getOrg`, `createOrg`, `renameOrg`, `deleteOrg` |
| Org memberships | `listOrgMemberships`, `addOrgMembership` (upsert), `removeOrgMembership`, `updateOrgMembershipRole` |

Every method returns a Promise even on LocalStorage. The cost is one microtask; the benefit is callsites that don't need updating when Supabase lands.

### Key layout (LocalStorage)

```
grade:studio:storage-version      → int (current = 5). Migration gate.
grade:studio:active-project-id    → string. Cross-session pointer.
grade:studio:projects             → { projects: Project[] }. Metadata index — cheap listProjects.
grade:studio:project:<id>         → ProjectSnapshot. Heavy data; loaded per project.
grade:studio:teams                → { teams: Team[] }
grade:studio:memberships          → { rows: Membership[] }
grade:studio:users                → { users: User[] }
grade:studio:orgs                 → { orgs: Organisation[] }
grade:studio:org-memberships      → { rows: OrgMembership[] }
grade:studio:left-panel-open      → "true"/"false". Independent of the schema gate.
grade:studio:right-panel-open     → "true"/"false".
grade:studio:impersonation        → sessionStorage only. { userId, orgId }.
grade:studio:session              → LEGACY v1 blob. Kept as a safety net through v2 migration.
studio:history:<designId>         → Per-design undo snapshots. Owned by useUndoHistory.
```

### Migration chain

Versions advance one step at a time. Whatever version a returning user is on, the adapter walks them forward to `CURRENT_VERSION` in `ensureHydrated` on first call. The migration writes are idempotent: if a v5 user gets corrupt VERSION_KEY and re-runs the chain, the existing-data guards skip every step that's already done.

| Step | What it does |
|------|--------------|
| v1 → v2 | Splits the legacy `grade:studio:session` single-blob into the projects index + per-project keys. |
| v2 → v3 | Backfills the flat `ownerId` + `access` (pre-polymorphic) onto every project. |
| v3 → v4 | Introduces Teams. Creates the Personal team + admin membership for the local user. Polymorphs every project's owner/access (flat `userId` → tagged `{ type: "user" \| "team", id }`). Re-homes pre-Teams projects onto the Personal team. |
| v4 → v5 | Introduces Organisations + Users as first-class persisted entities. Seeds local user (super admin), Default org, fake test users + orgs for impersonation. Backfills `orgId` onto every team. |

Legacy v1 `grade:studio:session` is deliberately preserved until we're confident v2+ is stable.

## Data model

```
Organisation (plan, limits)
   └── Team
         └── Project (owner: Subject, access: ResourceAccess[])
               └── Design (screens)
```

Plus the user side:

```
User           (id, name, email?, status, superAdmin?)
   ├── OrgMembership  → Org   (role: admin | member)
   └── Membership     → Team  (role: admin | member)
```

### Entities

**`User`** — `id, name, email?, avatarUrl?, status?, superAdmin?`. `status` is `unverified | active | suspended` — reserved for the verification flow once real auth lands. `superAdmin` gates the impersonation UI.

**`Team`** — `id, name, createdAt, updatedAt, orgId`. Every team belongs to an org. The Personal team is one team-of-one created automatically; user-only "scratch" projects can live there.

**`Organisation`** — `id, name, plan, limits, stripeCustomerId?`. Top of the entity hierarchy. Plan is `free | pro | team | enterprise`; limits is an `OrgLimits` object with concrete numbers (or `null` for unlimited). Limits are persisted on the org rather than derived from the plan enum at runtime so enterprise customers can have custom values without a code change. **Nothing reads limits today** — the values are stored so the schema is shaped right for billing later.

**`Membership`** — `userId × teamId × TeamRole` (`admin | member`).

**`OrgMembership`** — `userId × orgId × OrgRole` (`admin | member`).

**`Subject`** — `{ type: "user" \| "team", id }`. Polymorphic discriminated union used in two places: `Project.owner` and `ResourceAccess.subject`. The discriminator on `type` keeps resolvers cleanly branching.

**`ResourceAccess`** — `{ subject, role }` where `role` is `owner | editor | viewer`. Used in `Project.access` for grants that sit on top of ownership (guest invites, team-shares).

### Permission resolution

`lib/studio-users/index.ts` owns the resolver:

```typescript
resolveEffectiveRole(user, memberships, owner, access) → Role | null
canAccess(user, memberships, owner, access, action) → boolean
useCanAccess(memberships, owner, access, action) → boolean    // hook form
```

The resolver walks three paths and returns the highest role found:

1. **Ownership** — if `owner.type === "user"` and the user is the owner directly, OR if `owner.type === "team"` and the user is a member of the owning team → role is `owner`.
2. **Direct user grant** — entries in `access` where `subject.type === "user"` and the user matches.
3. **Team grant via membership** — entries where `subject.type === "team"` and the user is a member of the granted team.

Three-tier action mapping (`roleSatisfies`):
- `read` — any role passes.
- `write` — `owner` or `editor`.
- `admin` — `owner` only. (This is **project admin** — manage shares, delete. Team admin and org admin are separate concepts tied to memberships, checked via `isTeamAdmin` / `isInTeam`.)

v1 policy bakes in: team-owned project → every team member resolves as `owner`. This matches Figma's "everyone in the team can do anything in the team's files." Tighten to member→editor / admin→owner later if you need granular team-internal permissions.

### Plan limits — stub today

`PLAN_DEFAULTS` in `lib/studio-users/index.ts`:

| Plan | Projects | Screens/proj | Turns/screen | Teams | Users | Monthly turns |
|------|----------|--------------|--------------|-------|-------|---------------|
| `free` | 1 | 3 | 5 | 1 | 1 | 50 |
| `pro` | 10 | 25 | 50 | 3 | 5 | 1000 |
| `team` | 50 | 100 | 200 | 10 | 25 | 10000 |
| `enterprise` | unlimited | unlimited | unlimited | unlimited | unlimited | unlimited |

These values are stored on the org via `defaultLimitsForPlan(plan)`. They're NOT enforced anywhere today — the values exist so the UI / middleware can start reading them when Stripe wires in. Free-tier numbers are intentionally aggressive (1 project / 3 screens / 5 turns) so the limit-prompt UX gets exercised early in real testing.

## Users & impersonation

`lib/studio-users/`:

```
lib/studio-users/
├── index.ts             # Public surface. Exports types, ids, default builders, permission helpers.
├── index-constants.ts   # LOCAL_USER_ID / LOCAL_TEAM_ID / LOCAL_ORG_ID — split out to avoid a cycle.
├── types.ts             # User, Team, Organisation, Subject, Role, etc.
└── session.tsx          # UserSessionProvider + useCurrentUser/useCurrentOrg/useImpersonation hooks.
```

### Current user resolution

```typescript
getCurrentUser(): User          // sync, non-React. Always returns the REAL user. Used by storage adapters + non-tree code.
useCurrentUser(): User          // hook. Returns the IMPERSONATED user when active, otherwise the real one.
useCurrentOrg(): Organisation   // hook. Same impersonation semantics, scoped to org.
useImpersonation(): { ... }     // hook. Full control surface — start/stop, real-vs-current, etc.
```

The split between `getCurrentUser` (sync, real) and `useCurrentUser` (hook, impersonated) is deliberate. Storage migration code must NOT be affected by impersonation — when you migrate data, you migrate it under the real user's id. UI code reads `useCurrentUser()` so impersonation flows through.

### Provider

`<UserSessionProvider users={...} orgs={...} realOrgId={...}>` wraps the studio page. The provider:

- Loads `impersonatedUserId` + `impersonatedOrgId` from `sessionStorage` on mount (key: `grade:studio:impersonation`). sessionStorage, not localStorage, so closing the tab resets impersonation — guardrail against forgetting.
- Resolves the effective user + org by looking up the impersonation ids in the `users` / `orgs` arrays passed in as props.
- Exposes `startImpersonation({ userId?, orgId? })` and `stopImpersonation()` setters via context.

When real auth lands, the only change here is `realUser` comes from the auth provider's session instead of finding `LOCAL_USER_ID` in the users array.

### Super admin sheet

`components/studio/super-admin-sheet.tsx`. Discoverable two ways:
- Shield icon in the topbar — rendered only when `useCurrentUser().superAdmin === true`.
- Global shortcut `⌘⇧⌥A` — works from anywhere, but is a no-op if the user isn't super admin.

The sheet has two tabs (Users / Orgs). Picking a row sets the impersonation override. The "Stop" button at the top resets to real identity. The sheet itself doesn't gate on the super-admin flag — it can't open in the first place without one of the two triggers, both of which check `superAdmin`.

A persistent **Impersonating pill** appears in the topbar (between the streaming indicator and the avatar) when impersonation is active. Clicking it is the same as "Stop" inside the sheet.

### Seed data

The v4→v5 migration writes:

| Users | role |
|-------|------|
| `u-local` ("You") | super_admin, active |
| `u-alice` (Alice Carter) | active |
| `u-bob` (Bob Lin) | active |
| `u-charlie` (Charlie Reyes) | **unverified** — wired so the UI's unverified gate has something to demo against |

| Orgs | plan |
|------|------|
| `o-default` (Default) | free |
| `o-acme` (Acme Corp) | team |
| `o-studio-demo` (Studio Demo) | pro |

The local user is admin on all three orgs (so impersonation as themselves in different org contexts works); fake users have a realistic role mix across the fake orgs. These seed rows can be wiped before going to production.

## URL history

The page mirrors `(activeProjectId, activeId)` into `?project=…&screen=…` via `history.pushState` on every change. First write per session is `replaceState` (no extra history entry); subsequent writes are `pushState` so back/forward navigates between recent project/screen pairs. A `popstate` listener reads the URL on back/forward and dispatches `handleSwitchProject` / `setActiveId`. The push effect short-circuits when `current === target` so the popstate echo doesn't loop.

URL params take precedence over the stored `activeProjectId` on bootstrap — a shared link or a back/forward landing on this page lands on the referenced project + screen, not whatever was open last.

## Studio settings — backend selector

`<StudioSettings>` (the gear icon Sheet) now has a Storage section with a Backend select:

- `localstorage` — the only working option today. No setup; everything in the browser. Required for the self-host story.
- `supabase` — disabled with a "Soon" label. The factory at `lib/studio-storage/index.ts` will branch on this setting once the Supabase adapter lands.

**Local-first is non-negotiable.** Anyone who clones this repo and runs `pnpm dev` must get a fully working Studio. Cloud sync is an opt-in upgrade for hosted installs / signed-in users, never a requirement.

## What's deliberately deferred

- **Theme draft persistence per project.** Schema reserves `themeDraftJson` on `ProjectSnapshot`; the wire-up needs a public read API on `ThemeBuilderProvider` to capture the current input. Settings Sheet has a "Reset theme" button disabled with "Soon".
- **Plan enforcement.** `OrgLimits` numbers are stored and read in display contexts; no callsite actually blocks or throttles based on them yet. Comes with the billing pass.
- **Stripe / billing.** Not wired. The `stripeCustomerId` field on `Organisation` is reserved.
- ~~**Real auth.**~~ Now shipped. See "How auth works" below.
- ~~**Invitations.**~~ Now shipped. See "Invitations" below.
- **Onboarding modal.** No "first time setup" flow. Once real auth lands, the first verified login needs a name-capture + create-team-or-join step. The User type already carries `status` for this gate.
- **Team management UI.** Storage methods exist for team membership mutations; no UI surface yet.

## How auth works

Studio supports two deployment modes from a single codebase:

- **Local-only (self-host default).** No Supabase keys in env, no sign-in gate, no cloud sync, everything in localStorage. `pnpm dev` works out of the box. This is the open-source story: a fresh clone gives you a fully working Studio without any account setup.
- **Cloud (hosted on gradeui.com, or self-host with Supabase keys).** With `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set, `/studio` requires sign-in. Google OAuth + email magic-link by default; the active providers are driven by `NEXT_PUBLIC_GRADE_AUTH_PROVIDERS` (comma-separated list of `google` / `email`).

The switch is made by `isAuthConfigured()` in `lib/supabase/env.ts`. Every gating decision reads that one predicate so the middleware gate, storage factory, and UI affordances never disagree.

Setup walkthrough for keys + providers: [SETUP-AUTH.md](../../SETUP-AUTH.md).

### Key files

- `lib/supabase/env.ts` — single source of truth for configuration + provider list.
- `lib/supabase/{client,server,middleware}.ts` — browser, server, and middleware Supabase clients.
- `app/auth/callback/route.ts` — exchanges the OAuth / magic-link code for a session.
- `app/auth/signout/route.ts` — POST-only sign-out endpoint.
- `app/sign-in/page.tsx` + `sign-in-form.tsx` — the only sign-in surface; reads provider env to decide which buttons render.
- `middleware.ts` — refreshes the Supabase session on every request and gates `/studio` + `/accept-invite` when auth is configured.
- `components/supabase-provider.tsx` — React context for the current Supabase user; mounted in the root layout.
- `lib/studio-storage/supabase-adapter.ts` — the `StudioStorage` impl against Postgres.
- `lib/studio-storage/migration.ts` — first-sign-in local→cloud project migration. Idempotent (flagged on `auth.user.user_metadata.grade_migrated_v1`).
- `supabase/migrations/0001_studio_schema.sql` — Postgres tables + RLS policies.
- `lib/email/resend.ts` + `app/api/invitations/route.ts` + `app/accept-invite/[token]/` — the invitation flow.

### Local-to-cloud migration

On the first sign-in for a given Supabase account, `SupabaseProvider` fires `maybeRunFirstSignInMigration()`. It copies every local project into the cloud (owner = the new auth user), rewrites the `LOCAL_USER_ID` references onto the real Supabase user id, then sets a one-time flag in `user_metadata` so the migration doesn't re-run on subsequent sign-ins. The local data is left in place as a read-only safety net.

Team-typed access grants are dropped in v1 — the cloud schema requires teams to belong to an org, and the migration doesn't yet do the org-creation dance. Team migration is the next phase.

### Invitations

`POST /api/invitations` creates a row in the `invitations` table and emails a tokenised link via Resend (`lib/email/resend.ts`). The invitee follows the link to `/accept-invite/[token]`, signs in if they haven't already, and the server action consumes the token by inserting the appropriate access grant.

### What's still deferred

- **Stripe / billing.** `Organisation.stripeCustomerId` is reserved; plan changes update `Organisation.plan` + `limits`. No checkout wired up yet.
- **Plan enforcement.** Limits are stored and displayed; nothing actually blocks based on them yet.
- **Onboarding modal.** First verified sign-in still drops the user straight into Studio. A name-capture + create-team-or-join step would slot in here.
- **Team migration in first-sign-in.** Team-typed access grants from local data are dropped in v1 of the migration.

Everything in `lib/studio-storage/types.ts` (the `StudioStorage` interface, the entity types) is stable across the local↔cloud swap. Every callsite that goes through `getStudioStorage()` or `useCurrentUser()` reads the right backend automatically.

## Reading order for someone new

1. **This doc** — gets you the chrome + storage + users story.
2. [STUDIO.md](./STUDIO.md) — gets you the model + Sandpack + system prompt story.
3. [STUDIO-CHAT.md](../../STUDIO-CHAT.md) — generative UI in chat + tool-call protocol.
4. [STUDIO-LEARNING.md](../../STUDIO-LEARNING.md) — retrieval + preference loop.

Both layers (chrome here, model there) compose to make Studio work. Changes that touch both — adding a new entity, changing what the model knows about projects — should land notes in both docs.
