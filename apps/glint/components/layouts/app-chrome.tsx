"use client";

/**
 * Glint app chrome, ported from the Studio shared component "AppChrome"
 * (cmsn9muj2ir5xd): the Mercury-pattern logged-in shell shared by every
 * desktop product screen. Sidebar rail (Wordmark header, trimmed nav,
 * pinned business identity) + the sticky page toolbar with the utility
 * cluster. The route layout at app/(product)/layout.tsx mounts this
 * once; pages supply only the scrolling content sections.
 *
 * ALIGNMENT: the sidebar header pins its height to the Toolbar's md
 * height (3rem) via --gds-sidebar-header-height so the two bottom
 * hairlines run as one continuous line across rail + main.
 *
 * MOBILE: below the md breakpoint the rail auto-collapses to the icon
 * rail (nav stays reachable; labels move to hover tooltips). The manual
 * collapse affordance still works at any width; crossing the breakpoint
 * re-applies the responsive default. Collapsed, the header shows the G
 * mark (Wordmark lockup="mark") and the footer drops to the avatar.
 *
 * DEMO NAVIGATION: nav items with a known target carry data-grade-goto
 * (resolved by GotoBridge through the screen registry); the active item
 * renders without one. Targets stay inert until their screens are
 * promoted and registered.
 */

import * as React from "react";
import {
  AppShell,
  AppShellNav,
  AppShellMain,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  Toolbar,
  Row,
  Button,
  Avatar,
  AvatarFallback,
} from "@gradeui/ui";
import { List, Landmark, Bell, EyeOff } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { DEFAULT_PERSONA } from "@/lib/persona";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Studio screen name the item gotos; omit while the screen is unbuilt. */
  target?: string;
}

/* Wallets wears the Glint G rather than a generic wallet glyph (Ali,
   11 Aug). Rendered from Wordmark so the mark cannot drift; the same
   artwork is also checked in as a standalone asset at
   public/glint-mark.svg for anywhere that needs a plain file. */
function GlintMark() {
  /* Monochrome + 16px (Ali, 11 Aug): a filled gold glyph beside 1.5px
     lucide strokes reads louder and larger than its box, so it takes
     currentColor and 16px against their 20px — where the two optically
     match. The gold mark still leads the header, where it is brand. */
  return <Wordmark lockup="mark" tone="current" className="size-4" />;
}

const NAV: NavItem[] = [
  { label: "Wallets", icon: GlintMark, target: "Dashboard — logged-in home" },
  { label: "Activity", icon: List, target: "Activity — history" },
  { label: "Bank Accounts", icon: Landmark },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppChrome({
  active = "Wallets",
  business = DEFAULT_PERSONA.business,
  businessMeta = DEFAULT_PERSONA.businessMeta,
  account = DEFAULT_PERSONA.account,
  toolbarLeading = null,
  children,
}: {
  active?: string;
  business?: string;
  businessMeta?: string;
  account?: string;
  toolbarLeading?: React.ReactNode;
  children: React.ReactNode;
}) {
  /* Responsive default: collapsed below md, expanded above. The user
     can still toggle manually; a breakpoint crossing re-applies the
     media default. */
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setCollapsed(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <AppShell nav="side" className="h-screen overflow-hidden">
      <AppShellNav className="h-full min-h-0">
        <Sidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          /* No hover-out collapse arrow (Ali, 11 Aug): the rail still
             collapses, but on the breakpoint, not a tiny target. */
          collapsible={false}
          className="h-full"
          /* Rail spacing, set through the component's own tuning vars
             rather than padding overrides on each part. The header
             height stays pinned to the Toolbar's 3rem so the two
             bottom hairlines still run as one line. */
          style={
            {
              "--gds-sidebar-header-height": "3rem",
              "--gds-sidebar-section-px": "0.75rem",
              "--gds-sidebar-section-gap": "0.375rem",
              "--gds-sidebar-content-py": "1rem",
              "--gds-sidebar-footer-px": "0.75rem",
              "--gds-sidebar-footer-py": "1rem",
            } as React.CSSProperties
          }
        >
          <SidebarHeader>
            {collapsed ? (
              <Wordmark lockup="mark" className="h-5" />
            ) : (
              /* The logotype's G and the rail's G share a left edge:
                 SidebarHeader's own 12px + this 8px lands the wordmark
                 exactly where a nav row's icon starts (section inset +
                 the item's 8px). Both render at 20px tall. */
              <div className="px-2">
                <Wordmark className="h-5" />
              </div>
            )}
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection collapsible={false}>
              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === active;
                return (
                  <SidebarItem
                    key={item.label}
                    /* No size class: SidebarItem sizes the glyph to the
                       row (20px at md). Pass size-* only to override. */
                    icon={<Icon />}
                    active={isActive}
                    data-grade-goto={isActive ? undefined : item.target}
                  >
                    {item.label}
                  </SidebarItem>
                );
              })}
            </SidebarSection>
          </SidebarContent>
          <SidebarFooter>
            {/* Business identity; avatar-only when collapsed */}
            <Row gap="sm" className={collapsed ? "justify-center" : undefined}>
              <Avatar size="sm">
                <AvatarFallback>{initials(business)}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{business}</div>
                  <div className="truncate text-xs text-muted-foreground">{businessMeta}</div>
                </div>
              )}
            </Row>
          </SidebarFooter>
        </Sidebar>
      </AppShellNav>

      <AppShellMain className="h-full min-h-0 overflow-y-auto">
        {/* Sticky page toolbar; leading is the subpage back-button slot */}
        <Toolbar
          sticky
          aria-label="Page toolbar"
          leading={toolbarLeading}
          trailing={
            <Row gap="sm">
              <Button variant="ghost" size="md" iconOnly aria-label="Hide balances">
                <EyeOff className="size-4" />
              </Button>
              <div className="relative">
                <Button variant="ghost" size="md" iconOnly aria-label="Notifications">
                  <Bell className="size-4" />
                </Button>
                <span className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-destructive" />
              </div>
              <Avatar size="sm">
                <AvatarFallback>{account}</AvatarFallback>
              </Avatar>
            </Row>
          }
        />
        {children}
      </AppShellMain>
    </AppShell>
  );
}
