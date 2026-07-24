// @brightlocal/proposal-nav — the proposal IA (PROPOSAL_SECTIONS),
// the data-driven section builder, and ProposalSidebar (nav model v2:
// top-level rows navigate, subs are contextual, one level max). Split
// out of proposal.jsx (18 Jul); the barrel re-exports.
import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  GlobalLayout,
  GlobalLayoutContent,
  GlobalLayoutContentHeader,
  GlobalLayoutSidebar,
  Logo,
  Sidebar,
  SidebarAccountDropdown,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuSubVariant,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
} from "@brightlocal/ui-components";
import {
  BarChart3,
  Briefcase,
  Building,
  ChevronRight,
  Globe,
  Grid3x3,
  House,
  Info,
  LayoutGrid,
  Link,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from "@brightlocal/icons";
import { PROPOSAL_ACCOUNTS, useProposalData } from "@brightlocal/proposal-data";

// ─── Nav + account data (the proposal's default IA) ──────────────────
// Screens can pass their own `sections` / `accounts` to ProposalSidebar;
// these exports are the July 2026 IA from Ali's tree so a screen that
// just wants "the proposal sidenav" carries zero data.
//
// Row fields: `paid` marks add-ons in the IA data (not rendered),
// `active` opens the trail, `goto: "<screen name>"` links a row to
// another screen and `transition: "fade" | "slide-left" | …` picks the
// swap treatment (STUDIO-FLOWS — transitions are DATA ON THE LINK; both
// stamp data-grade-* attributes).

export const PROPOSAL_SECTIONS = [
  {
    id: "ai-insights",
    label: "AI Insights",
    icon: Sparkles,
    sub: [
      // "Website" — renamed from "Website and Content" everywhere in the
      // UI (snags list, Ali 21 Jul); the row ID stays for wiring stability.
      { id: "ai-insights-website-content", label: "Website" },
      { id: "ai-insights-google-business-profile", label: "Google Business Profile" },
      { id: "ai-insights-reviews", label: "Reviews" },
      { id: "ai-insights-citations", label: "Citations" },
      { id: "ai-insights-export", label: "Export Report" },
    ],
  },
  { id: "setup-tasks", label: "Set-up Tasks", icon: ListChecks },
  {
    id: "location-profile",
    label: "Location Profile",
    icon: Building,
    sub: [
      { id: "location-profile-connect", label: "Connect to Listing Platforms" },
      {
        id: "location-profile-core",
        label: "Core Information",
        sub: [
          { id: "location-profile-general", label: "General Settings" },
          { id: "location-profile-business", label: "Business Details" },
          { id: "location-profile-google-business-tracking", label: "Google Business Tracking" },
          { id: "location-profile-categories", label: "Categories" },
          { id: "location-profile-hours", label: "Opening Hours" },
          { id: "location-profile-about", label: "About the Business" },
          { id: "location-profile-additional", label: "Additional Data" },
          { id: "location-profile-images", label: "Image Management" },
          { id: "location-profile-citation-builder-data", label: "Citation Builder Data" },
          { id: "location-profile-alerts", label: "Email Alerts" },
        ],
      },
    ],
  },
  // NOTE: no baked `active` flags in the default IA — which row is
  // active is a PER-SCREEN statement (ProposalSidebar activeId). A
  // screen without activeId highlights nothing (correct for landings);
  // custom `sections` may still carry their own active flags.
  {
    id: "rankings",
    label: "Rankings",
    icon: TrendingUp,
    sub: [
      { id: "rankings-positions", label: "Positions" },
      { id: "rankings-table", label: "Rankings Table" },
      { id: "rankings-keyword-groups", label: "Keyword Groups" },
      { id: "rankings-competitors", label: "Chosen Competitors" },
      {
        id: "rankings-settings",
        label: "Settings",
        sub: [
          { id: "rankings-general", label: "General Settings" },
          { id: "rankings-search", label: "Search Settings" },
          { id: "rankings-advanced", label: "Advanced Settings" },
          { id: "rankings-alerts", label: "Email Alerts" },
        ],
      },
    ],
  },
  {
    id: "local-search-grid",
    label: "Local Search Grid",
    icon: Grid3x3,
    // Fixed sub-nav (21 Jul): the dynamic per-keyword rows were dropped
    // — Browse / Edit / Settings instead.
    sub: [
      { id: "local-search-grid-browse", label: "Browse Keywords" },
      { id: "local-search-grid-edit", label: "Edit Keywords" },
      { id: "local-search-grid-settings", label: "Settings" },
    ],
  },
  {
    id: "citations",
    label: "Citations",
    icon: Link,
    sub: [
      { id: "citations-live", label: "Live Citations" },
      { id: "citations-pending", label: "Pending Citations" },
      { id: "citations-competitor", label: "Competitor Citations" },
      { id: "citations-builder", label: "Citation Builder", paid: true },
    ],
  },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "gbp-manager", label: "GBP Manager", icon: Store },
  { id: "website-seo", label: "Website SEO", icon: Globe },
  { id: "google-analytics", label: "Google Analytics", icon: BarChart3 },
  { id: "agency-tools", label: "Agency Tools", icon: Briefcase },
];

/** The proposal IA with data-driven links applied:
 *  - `data.navLinks` wires goto targets onto nav rows BY ID — per
 *    project data, not module structure, so links can change over time
 *    without touching the IA. Value is a screen name string, or
 *    { goto, transition } for a transition preset:
 *      "navLinks": { "rankings-table": "Rankings Table",
 *                    "location-profile-hours": { "goto": "Opening Hours", "transition": "slide-left" } }
 *  ProposalSidebar calls this with the context data by default; screens
 *  with a custom nav can call it themselves or pass `sections` raw. */
export function buildProposalSections(data) {
  const links = data?.navLinks ?? {};
  const applyLinks = (item) => {
    const link = links[item.id];
    const patched = link
      ? typeof link === "string"
        ? { ...item, goto: link }
        : {
            ...item,
            goto: link.goto ?? item.goto,
            transition: link.transition ?? item.transition,
          }
      : item;
    return patched.sub
      ? { ...patched, sub: patched.sub.map(applyLinks) }
      : patched;
  };
  return PROPOSAL_SECTIONS.map(applyLinks);
}

/** Does this item's subtree contain the id? Drives the open trail when
 *  ProposalSidebar gets an explicit activeId. */
function subtreeHas(item, id) {
  if (!id) return false;
  if (item.id === id) return true;
  return (item.sub ?? []).some((child) => subtreeHas(child, id));
}

/* NAV MODEL v2 (Ali, 18 Jul): NO accordions. Every row — top-level or
   sub — is a plain page LINK; the nav discloses by NAVIGATION, not by
   chrome: landing inside a section is what reveals its sub rows.

   Sub rows — FLAT, max ONE level. Rows that still carry a deeper `sub`
   in the IA data render as links to their own page and their children
   stay OFF the nav (level 3 belongs on-page — header tabs, the open
   Harry question). A level-3 activeId highlights its level-2 parent
   (subtreeHas), so deep pages still read as "you are here". */
function SubRows({ items, activeId }) {
  return items.map((item) => (
    <SidebarMenuSubItem key={item.id} dataHook={`sub-item-${item.id}`}>
      <SidebarMenuSubButton
        // size="sm" — the sub button's MD default rendered LARGER text
        // than the size="sm" mains (inverted hierarchy — Ali, 18 Jul).
        size="sm"
        // cursor-pointer select-none: the DS sub button is an <a>
        // without href, so browsers default to a TEXT cursor and
        // selectable label — read as broken, not navigational (Ali,
        // 18 Jul). Nav rows are controls: pointer, never selectable.
        className="h-auto min-h-7 w-full cursor-pointer select-none py-1 [&>span:last-of-type]:whitespace-normal!"
        dataHook={`sub-btn-${item.id}`}
        isActive={
          activeId
            ? item.id === activeId || subtreeHas(item, activeId)
            : item.active
        }
        data-grade-goto={item.goto}
        data-grade-transition={item.transition}
      >
        <span>{item.label}</span>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  ));
}

/* Top-level: always a page link (goto from navLinks/data — a section
   without a mapped screen simply doesn't navigate yet). The section
   row highlights while you're ANYWHERE inside it; its sub list renders
   only then — contextual expansion, one section open at a time, driven
   by where the viewer IS. */
function NavSection({ section, activeId }) {
  const inSection = activeId
    ? section.id === activeId || subtreeHas(section, activeId)
    : Boolean(section.active);
  return (
    <SidebarMenuItem dataHook={`nav-item-${section.id}`}>
      <SidebarMenuButton
        // size="sm" — the DS's own knob (28px row vs the 32px default).
        // Ali + Harry: default vertical padding read too chunky on the
        // main rows. PROPOSED REGISTRY CHANGE: if BL adopt it, this is
        // SidebarMenuButtonSize.SM as the app-nav default.
        size="sm"
        // Same cursor discipline as the sub rows.
        className="cursor-pointer select-none px-4 [&>span:last-of-type]:whitespace-normal!"
        dataHook={`nav-${section.id}`}
        isActive={inSection}
        data-grade-goto={section.goto}
        data-grade-transition={section.transition}
      >
        <section.icon className="size-5" />
        <span>{section.label}</span>
      </SidebarMenuButton>
      {/* ml-6: rail ≈ the icon centreline with the px-4/px-4 inset
          split. pr-2 overrides the variant's baked pr-10 — 40px of
          dead right padding per level was the truncation driver.
          items-stretch + w-full make sub rows span the full width. */}
      {section.sub && inSection ? (
        <SidebarMenuSub
          variant={SidebarMenuSubVariant.BORDER}
          // pr-0: keep overriding the DS's baked overflow pr-10, but
          // ZERO it — the previous pr-2 left sub rows 8px short of the
          // main rows' right edge (measured live, Ali 18 Jul).
          className="ml-6 items-stretch pr-0"
        >
          <SubRows items={section.sub} activeId={activeId} />
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

// ─── ProposalSidebar — the proposal side navigation ───────────────────
// The full sidenav composition: logo header (32px alignment line),
// SECTIONS-driven three-level nav, and the STUCK footer (account
// switcher + signed-in dropdown). Wrap in the DS's SidebarProvider at
// the screen root — the provider is per-screen state, not lib chrome.
export function ProposalSidebar({
  // Default nav is DATA-DRIVEN: built from the proposal data context
  // (keywords feed the Local Search Grid rows; data.navLinks wires goto
  // targets by row id), so a dataset switch re-writes the left nav too.
  // Pass `sections` to opt out.
  sections,
  // WHICH ROW IS ACTIVE — the per-screen knob ("this page is Opening
  // Hours"): pass the nav row's id (activeId="location-profile-hours") and the row
  // highlights + every collapsible on its trail opens. Overrides the
  // IA's baked flags; omit for the default (Rankings Table).
  activeId,
  // The current location's home (the House row at the very top) and the
  // "All Locations" footer row link here. Defaults are this proposal's
  // screen ids; override per-screen (or when the registry is reused).
  locationHomeGoto = "screen:dmrurue2wmp9u", // UI Vision - Location Hub
  allLocationsGoto = "screen:dmrotrgstba3l",
  accounts = PROPOSAL_ACCOUNTS,
  // Account/user rows resolve PROPS FIRST, then the proposal data
  // context — so a screen wrapped in ProposalDataProvider re-skins the
  // footer with zero sidebar props, and a per-instance prop still wins.
  accountLabel,
  userName,
  // `email` renders as span CHILDREN in the dist, so it takes an
  // entity — the plan/trial line rides there (plain text; a Chip
  // proved too loud for the footer). Upstream ask: rename to a typed
  // `meta` ReactNode slot.
  userMeta,
  userInitials,
  userMenuGroups = [
    [
      { label: "Account Details" },
      { label: "Billing Details" },
      { label: "Addons" },
      { label: "Support Tickets" },
    ],
    [{ label: "Logout" }],
  ],
  dataHook = "app-sidebar",
  // Anchor-id pass-through — see AppLayoutShell's rest note.
  ...rest
}) {
  const data = useProposalData();
  sections = sections ?? buildProposalSections(data);
  accountLabel = accountLabel ?? data.account.label;
  userName = userName ?? data.user.name;
  userMeta = userMeta ?? data.user.meta;
  userInitials = userInitials ?? data.user.initials;
  // The All Locations page is an ACCOUNT context — no location is
  // selected — so it drops the whole location nav (scope requirement,
  // Ali 21 Jul). Signalled by its activeId; no extra prop or per-screen
  // wiring needed.
  const isAllLocations = activeId === "all-locations";
  return (
    // view-transition-name (STUDIO-FLOWS F1.5): a STABLE name shared by
    // every screen's sidebar means goto swaps treat the nav as the SAME
    // element — it persists while the page content cross-fades, instead
    // of re-fading with everything else. Must be unique per document
    // per state (one sidebar per screen — safe); a duplicate would
    // abort the whole transition back to a hard cut.
    <Sidebar
      {...rest}
      style={{ viewTransitionName: "gds-sidebar", ...(rest?.style ?? {}) }}
      dataHook={dataHook}
    >
      {/* Logo-only header; the account switcher lives in the STUCK
          footer with the signed-in row. pb-3 overrides the DS's
          hardcoded pb-9. The left inset TRACKS the density's icon
          line so the logo stays column-aligned with the nav icons at
          any density (Ali, 24 Jul). The constant is 12px measured
          from the LIVE chain — scroll-viewport pl 4px + group px-2
          (8px) — plus the row's own --gds-nav-row-px (12px compact /
          16px roomier). The old pl-6 approximation missed the
          viewport's 4px and sat slightly off the line. */}
      <SidebarHeader
        dataHook="sidebar-header"
        className="pb-3"
        style={{ paddingLeft: "calc(12px + var(--gds-nav-row-px, 12px))" }}
      >
        <Logo className="h-6" dataHook="sidebar-logo" />
      </SidebarHeader>

      {/* Tight vertical rhythm: kill the DS's default gap between
          groups and menu items — separators alone mark the sections.
          pr-2 ALWAYS: the DS adds pr-2 only when the nav overflows
          (hasOverflow in sidebar.tsx), so the whole nav nudged 8px left
          the moment it became scrollable. Reserving the gutter
          permanently keeps the width stable either way. */}
      <SidebarContent dataHook="sidebar-content" className="gap-0 pt-1 pr-2">
        <SidebarGroup className="px-2 py-1">
          <SidebarGroupContent>
            {/* gap-1 (4px) between rows — gap-0 read as one solid
                block once the rows went size="sm" (Ali, 18 Jul). */}
            <SidebarMenu className="gap-1">
              {/* All Locations page → account context: just an "All
                  Locations" row, no location nav. Every other screen →
                  the current-location House row + the sections. */}
              {isAllLocations ? (
                <SidebarMenuItem dataHook="nav-item-all-locations-top">
                  <SidebarMenuButton
                    size="sm"
                    className="cursor-pointer select-none px-4 [&>span:last-of-type]:whitespace-normal!"
                    dataHook="nav-all-locations-top"
                    isActive
                    data-grade-goto={allLocationsGoto}
                  >
                    <LayoutGrid className="size-5" />
                    <span>All Locations</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <>
                  {/* Current location — a MINI CARD at the very top
                      (snag 5, Ali 22 Jul): name on the first line,
                      "Town, Postcode" small beneath — the same two-line
                      shape as the signed-in block. Surface = ONE ramp
                      step off the sidebar background (Ali, 24 Jul — the
                      white-card + shadow + border cut was "way too
                      much"): bg-sidebar-accent is exactly that step in
                      EVERY tone (each tone defines its accent one step
                      from its background), no border, no shadow. Hover
                      is TEXT-ONLY, mirroring the nav rows' own hover
                      pair (they go accent bg + accent-foreground text;
                      the card's rest bg already spends the accent, so
                      only the text half applies — Ali, 24 Jul).
                      rounded-2xl: the nav rows are full pills (~15px
                      corner arc on a 30px row); 16px matches that
                      roundedness on this taller block without going
                      full round (Ali: "not necessary full round").
                      The data-hook deliberately does NOT start with
                      "nav-" so the shell's nav-rhythm CSS (fixed row
                      heights) leaves it alone. */}
                  <SidebarMenuItem dataHook="nav-item-current-location">
                    <button
                      type="button"
                      data-hook="location-home-card"
                      data-grade-goto={locationHomeGoto}
                      className="bg-sidebar-accent hover:text-sidebar-accent-foreground mb-1 flex w-full cursor-pointer items-start gap-2.5 rounded-2xl px-3 py-2 text-left transition-colors"
                    >
                      <House className="mt-0.5 size-4 shrink-0" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold leading-snug">
                          {data.location.name}
                        </span>
                        <span className="truncate text-xs leading-snug opacity-70">
                          {data.location.address}
                        </span>
                      </span>
                    </button>
                  </SidebarMenuItem>
                  {sections.map((section) => (
                    <NavSection key={section.id} section={section} activeId={activeId} />
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* STUCK footer — deliberately NOT SidebarFooter: that component
          PORTALS itself into the content scroll area (SidebarContent's
          mt-auto portal target), so with an overflowing nav it scrolls
          away with the content. A plain sibling of the scroll area is
          always pinned. px-3: the footer sits OUTSIDE the scroll area,
          so unlike the nav groups (viewport pl 4px + group px-2) its
          rows need the full 12px here to land on the same icon line
          as the content rows — px-2 left them 4px short. pb-3: the
          signed-in row sat too close to the viewport edge at pb-1.5
          (Ali, 24 Jul). Upstream ask: SidebarFooter needs a
          non-portalling/sticky option. */}
      <div
        data-hook="sidebar-footer"
        className="border-sidebar-border flex shrink-0 flex-col border-t px-3 pt-2 pb-3"
      >
        {/* All Locations — a STANDARD nav row (replaced the account
            switcher dropdown, Ali 21 Jul). Sits above the signed-in
            user with its own breathing room and a rule between it and
            the user block (snag 6, Ali 22 Jul). Hidden ON the All
            Locations page itself — there it's the top nav row instead. */}
        {!isAllLocations ? (
          <div className="border-sidebar-border mb-1.5 border-b pb-2">
            <SidebarMenu>
              <SidebarMenuItem dataHook="nav-item-all-locations">
                <SidebarMenuButton
                  size="sm"
                  className="cursor-pointer select-none px-4 [&>span:last-of-type]:whitespace-normal!"
                  dataHook="nav-all-locations"
                  data-grade-goto={allLocationsGoto}
                >
                  <LayoutGrid className="size-5" />
                  <span>All Locations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        ) : null}
        <SidebarMenu>
          {/* The dropdown trigger inherits SidebarMenuButton's baked
              px-6 (rounded-full nav sizing) — comically wide in a
              compact footer, and the DS plumbs no className through.
              Target its data-hook from the item instead. */}
          <SidebarMenuItem className="[&_[data-hook=sidebar-account-dropdown-button]]:px-2 [&_[data-hook=sidebar-account-dropdown-button]]:py-1">
            <SidebarAccountDropdown
              dataHook="sidebar-account-dropdown"
              name={userName}
              email={userMeta}
              avatar={
                <Avatar dataHook="sidebar-user-avatar">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              }
              menuGroups={userMenuGroups}
              side="top"
              align="end"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}

