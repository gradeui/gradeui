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
  SidebarPopoverMenu,
  SidebarSwitcher,
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
  Info,
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
      { id: "ai-insights-website-content", label: "Website and Content" },
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
    // Keyword rows are DATA-DRIVEN — injected from data.keywords by
    // buildProposalSections below (Harry: keywords come from the JSON).
    // This static fallback only renders if sections are used raw.
    sub: [
      { id: "local-search-grid-add", label: "Add more keywords", paid: true },
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

/** The proposal IA with data-driven rows injected:
 *  - Local Search Grid's keyword sub-items come from `data.keywords`,
 *    ahead of the section's static rows (Add more / Settings).
 *  - `data.navLinks` wires goto targets onto nav rows BY ID — per
 *    project data, not module structure, so links can change over time
 *    without touching the IA. Value is a screen name string, or
 *    { goto, transition } for a transition preset:
 *      "navLinks": { "rankings-table": "Rankings Table",
 *                    "location-profile-hours": { "goto": "Opening Hours", "transition": "slide-left" } }
 *  ProposalSidebar calls this with the context data by default; screens
 *  with a custom nav can call it themselves or pass `sections` raw. */
export function buildProposalSections(data) {
  const keywords = data?.keywords ?? [];
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
  return PROPOSAL_SECTIONS.map((section) => {
    const withKeywords =
      section.id === "local-search-grid"
        ? {
            ...section,
            sub: [
              ...keywords.map((kw, i) => ({ id: `local-search-grid-keyword-${i}`, label: kw })),
              ...section.sub,
            ],
          }
        : section;
    return applyLinks(withKeywords);
  });
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
        className="h-auto min-h-7 w-full py-1 [&>span:last-of-type]:whitespace-normal!"
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
        className="px-4 [&>span:last-of-type]:whitespace-normal!"
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
          className="ml-6 items-stretch pr-2"
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
          hardcoded pb-9; pl-6 keeps the logo on the tightened 24px
          icon line (groups px-2 + buttons px-4) — the DS default pl-8
          assumed the airier inset. */}
      <SidebarHeader dataHook="sidebar-header" className="pb-3 pl-6">
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
            <SidebarMenu className="gap-0">
              {sections.map((section) => (
                <NavSection key={section.id} section={section} activeId={activeId} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* STUCK footer — deliberately NOT SidebarFooter: that component
          PORTALS itself into the content scroll area (SidebarContent's
          mt-auto portal target), so with an overflowing nav it scrolls
          away with the content. A plain sibling of the scroll area is
          always pinned. px-2 matches the nav groups' inset. Upstream
          ask: SidebarFooter needs a non-portalling/sticky option. */}
      <div
        data-hook="sidebar-footer"
        className="border-sidebar-border flex shrink-0 flex-col gap-0.5 border-t px-2 py-1.5"
      >
        {/* Account switcher — full-width row above the signed-in user.
            No trigger icon — the label carries it; the popover items
            keep theirs for scanability. */}
        <SidebarSwitcher
          dataHook="account-switcher"
          label={accountLabel}
          triggerAriaLabel="Switch account"
          triggerClassName="w-full px-2 py-1 [&>span]:flex-1 [&>span]:text-left [&>svg:last-child]:size-3 [&>svg:last-child]:opacity-100"
        >
          <SidebarPopoverMenu
            dataHook="account-switcher-menu"
            groupTitle="Accounts"
            items={accounts}
          />
        </SidebarSwitcher>
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

