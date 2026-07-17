---
name: ProposalSidebar
import: "@brightlocal/proposal"
props:
  - activeId?: string — WHICH PAGE THIS IS: the nav row id to highlight ("rankings-table", "location-profile-hours", "reviews"). Nav model v2: no accordions — the active section's sub rows render (one level max; a level-3 id highlights its level-2 parent), all other sections show top-level links only. Overrides the IA's baked flags. An id matching no row (hub landing) renders nothing active. Always set on a screen that represents a specific page.
  - sections? — Custom nav model (array of {id, label, icon, active?, goto?, transition?, sub?}). Default: buildProposalSections(data) — the proposal IA with keyword rows injected from data.keywords and goto links applied from data.navLinks. Pass only when a screen needs a DIFFERENT nav.
  - accounts? — Switcher popover items ({label, icon}[]). (default PROPOSAL_ACCOUNTS)
  - accountLabel?: string — Switcher trigger label. (default data.account.label from the proposal data context)
  - userName?: string — Signed-in name in the footer dropdown. (default data.user.name)
  - userMeta?: string — Plan/trial line under the name (renders in the dist's `email` slot). (default data.user.meta)
  - userInitials?: string — AvatarFallback initials. (default data.user.initials)
  - userMenuGroups? — SidebarAccountDropdown menuGroups. (default Account/Billing/Addons/Support + Logout)
  - dataHook?: string — Instance name. (default "app-sidebar")
when_to_use: The proposal side navigation for ANY full-page screen — logo header, three-level SECTIONS nav, stuck footer (account switcher + signed-in dropdown). Wrap the screen in the DS SidebarProvider and pass this to AppLayoutShell's `sidebar` slot. Data-driven — a dataset switch re-writes keywords and account/user rows; wire flows by putting navLinks in the data, never by forking sections.
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
