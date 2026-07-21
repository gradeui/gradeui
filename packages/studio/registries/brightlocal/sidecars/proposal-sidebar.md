---
name: ProposalSidebar
import: "@brightlocal/proposal"
props:
  - activeId?: string — WHICH PAGE THIS IS: the nav row id to highlight ("rankings-table", "location-profile-hours", "reviews"). Nav model v2: no accordions — the active section's sub rows render (one level max; a level-3 id highlights its level-2 parent), all other sections show top-level links only. Overrides the IA's baked flags. An id matching no row (hub landing) renders nothing active. Always set on a screen that represents a specific page. SPECIAL VALUE "all-locations" → ACCOUNT context: the whole location nav (current-location House row + sections + footer All Locations row) is dropped and the sidebar shows only an "All Locations" row at the top — use it on the All Locations screen.
  - sections? — Custom nav model (array of {id, label, icon, active?, goto?, transition?, sub?}). Default: buildProposalSections(data) — the proposal IA with keyword rows injected from data.keywords and goto links applied from data.navLinks. Pass only when a screen needs a DIFFERENT nav.
  - locationHomeGoto?: string — Screen the top "current location" House row links to (shows data.location.name). (default "screen:dmrnwiqjdknxy" — the Location Hub)
  - allLocationsGoto?: string — Screen the footer "All Locations" row links to. (default "screen:dmrotrgstba3l" — All Locations)
  - accounts? — (LEGACY) former account-switcher popover items; the switcher was replaced by the "All Locations" nav row, so this is unused. (default PROPOSAL_ACCOUNTS)
  - accountLabel?: string — (LEGACY) former switcher trigger label; unused now. (default data.account.label)
  - userName?: string — Signed-in name in the footer dropdown. (default data.user.name)
  - userMeta?: string — Plan/trial line under the name (renders in the dist's `email` slot). (default data.user.meta)
  - userInitials?: string — AvatarFallback initials. (default data.user.initials)
  - userMenuGroups? — SidebarAccountDropdown menuGroups. (default Account/Billing/Addons/Support + Logout)
  - dataHook?: string — Instance name. (default "app-sidebar")
when_to_use: The proposal side navigation for ANY full-page screen — logo header, a "current location" House row at the very top (data.location.name → its hub), the three-level SECTIONS nav, and a stuck footer with an "All Locations" row + the signed-in dropdown (the old account switcher was dropped). Wrap the screen in the DS SidebarProvider and pass this to AppLayoutShell's `sidebar` slot. Data-driven — a dataset switch re-writes keywords and account/user rows; wire flows by putting navLinks in the data, never by forking sections.
composes_with: [AppLayoutShell, PageHeader, SidebarProvider]
---

The proposal sidenav, shipped in "@brightlocal/proposal" (authored at
registries/brightlocal/lib/proposal.jsx). Resolution order everywhere:
explicit prop → proposal data context → module default. Nav STRUCTURE
lives in the module (PROPOSAL_SECTIONS); per-project wiring lives in
DATA: `data.navLinks` maps row id → screen name (or { goto, transition })
and `data.keywords` feeds the Local Search Grid rows.

```jsx
<ProposalSidebar activeId="location-profile-hours" />
```

Do NOT rebuild the sidebar from Sidebar primitives on proposal screens —
import this; it updates everywhere when the module changes.
