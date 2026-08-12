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
 * rail (nav stays reachable; labels move to hover tooltips). There is NO
 * manual collapse affordance: collapsible={false} removed it, so the
 * breakpoint is the only thing that collapses the rail. Collapsed, the
 * header shows the G mark (Wordmark lockup="mark") and the footer drops
 * to the avatar.
 *
 * DEMO NAVIGATION: nav items with a known target carry data-grade-goto
 * (resolved by GotoBridge through the screen registry), INCLUDING the
 * lit one, so a wallet detail can get back to Wallets. Targets stay
 * inert until their screens are promoted and registered.
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
  /* PLURAL (Ali, 11 Aug, second thoughts: "we may as well pluralise the
     nav link again"). The screen shows TWO accounts side by side, the
     customer's own linked account at Zions and the Glint account at
     Sutton, so the plural is what you find when you get there. It went
     singular earlier on the reading that the section was one thing; the
     built screen settled it the other way. */
  { label: "Bank Accounts", icon: Landmark, target: "Bank Accounts" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * PAGE SLOTS: a screen puts content into a region of the chrome toolbar.
 *
 *     <AppChrome.Slot region="leading">...</AppChrome.Slot>
 *
 * A Slot lives in the screen's BODY and renders nothing there. It has to,
 * rather than being a prop on AppChrome: promotion strips the wrapper and
 * its props, because app/(product)/layout.tsx supplies the chrome here, so
 * a prop set on the screen renders in Studio and vanishes in the app.
 *
 * Children are captured when the Slot mounts and are not an effect
 * dependency, which is what prevents a re-render loop. So a Slot's content
 * does not update when the screen re-renders: if it needs to show changing
 * state, put a component inside and let that hold the state.
 *
 * Mirrors the Studio AppChrome shared component. Change both.
 */
type SlotRegion = "leading" | "center" | "trailing";

const SlotContext = React.createContext<
  ((key: string, region: SlotRegion, node: React.ReactNode) => void) | null
>(null);

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
  /* Registered page slots, keyed so a screen can contribute more than
     one and so a remount replaces rather than duplicates. */
  const [slots, setSlots] = React.useState<
    Record<string, { region: SlotRegion; node: React.ReactNode }>
  >({});
  const registerSlot = React.useCallback(
    (key: string, region: SlotRegion, node: React.ReactNode) => {
      setSlots((prev) => {
        if (node === null) {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: { region, node } };
      });
    },
    [],
  );
  const slotsIn = (region: SlotRegion) =>
    Object.entries(slots)
      .filter(([, v]) => v.region === region)
      .map(([key, v]) => <React.Fragment key={key}>{v.node}</React.Fragment>);

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
          /* NO RAIL BORDER (Ali, 11 Aug). On this dark theme the rail's
             own bg-card already separates it from the content beside it
             and the hairline read as an artefact. A real Sidebar prop,
             not a border-0 override: the rail keeps its width
             transition, and it is one word to put the edge back. The
             rules inside the rail, under the header and above the
             footer, are internal structure and stay. */
          bordered={false}
          className="h-full"
          /* Rail spacing, set through the component's own tuning vars
             rather than padding overrides on each part. The header
             height stays pinned to the Toolbar's 3rem so those two
             hairlines still sit on the same baseline. */
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
            {/* THE WORDMARK IS THE WAY OUT (Ali, 12 Aug: "when you press
                the glint logo in the logged in app - this should go to our
                demo homepage"). A real button, so it is keyboard reachable
                and announced rather than a clickable div; the goto bridge
                resolves the target from the attribute, the same protocol
                the rail uses.
                In a shipped product this would go to the account home,
                which the rail already covers. Pointing it at the demo hub
                is a DEMO convention: it is the way back to the screen
                index from anywhere inside the logged-in app. */}
            <button
              type="button"
              data-grade-goto="US Demo Landing"
              aria-label="Glint: back to the demo home"
              className="flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
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
            </button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection collapsible={false}>
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarItem
                    key={item.label}
                    /* No size class: SidebarItem sizes the glyph to the
                       row (20px at md). Pass size-* only to override. */
                    icon={<Icon />}
                    active={item.label === active}
                    /* THE LIT ITEM IS STILL A LINK (Ali, 11 Aug: "from
                       wallets/gold, I cant press on Wallets in the
                       sidenav"). This used to read
                       {isActive ? undefined : item.target}, which
                       conflated the SECTION you are in with the SCREEN
                       you are on: a wallet detail passes
                       active="Wallets" so the rail shows where you are,
                       and that silently removed the only route back to
                       the wallets index. `active` now does styling
                       alone. On the index itself the link points at the
                       route you are already on, which the router treats
                       as a no-op. */
                    data-grade-goto={item.target}
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
        {/* THE TOOLBAR SHARES THE PAGE'S GUTTER (Ali, 11 Aug: "that
            toolbar needs the same padding as the content below"). Putting
            page actions in the toolbar is what exposed it: the toolbar's
            own px put them 16px from the edge while every content band
            starts at the Container's gutter.
            These are Container's OWN gutter classes, copied so the two
            track together at every breakpoint. KNOWN LIMIT: Container also
            caps at max-w-[96rem] and centres beyond it, which this does
            not, so above ~1536px the toolbar and the content drift apart
            again. Rebuilding the toolbar around a real Container was tried
            and collapsed its three-region layout, so this is the honest
            90% fix rather than a broken 100%. */}
        <Toolbar
          sticky
          aria-label="Page toolbar"
          className="px-4 md:px-6 lg:px-8"
          /* Back (from the layout) first, then the screen's own slot. */
          leading={
            toolbarLeading || slotsIn("leading").length ? (
              <Row gap="sm">
                {toolbarLeading}
                {slotsIn("leading")}
              </Row>
            ) : null
          }
          center={
            slotsIn("center").length ? (
              <Row gap="sm">{slotsIn("center")}</Row>
            ) : null
          }
          trailing={
            <Row gap="sm">
              {/* Before the utility cluster, so it stays rightmost. */}
              {slotsIn("trailing")}
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
        <SlotContext.Provider value={registerSlot}>
          {children}
        </SlotContext.Provider>
      </AppShellMain>
    </AppShell>
  );
}

/** Compound part: see PAGE SLOTS above. region defaults to "leading";
 *  id lets one screen fill the same region twice. */
AppChrome.Slot = function AppChromeSlot({
  region = "leading",
  id,
  children,
}: {
  region?: SlotRegion;
  id?: string;
  children?: React.ReactNode;
}) {
  const register = React.useContext(SlotContext);
  const key = id ?? region;
  React.useEffect(() => {
    register?.(key, region, children);
    return () => register?.(key, region, null);
    /* `children` is deliberately NOT a dependency: see the note above. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, key, region]);
  return null;
};
