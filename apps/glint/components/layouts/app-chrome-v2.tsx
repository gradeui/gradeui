"use client";

// AppChromeV2 (1 Oct 2026): the logged-in shell for the Glint business
// portal v2. A FORK of AppChrome: the live demo is promoted from screens
// that wrap AppChrome, so the original stays exactly as it was.
//
// TWIN: the Studio shared component "AppChromeV2" (cmuptagvulv5u1).
// Editing one does not touch the other. Keep the pair in sync.
//
// WHAT CHANGED FROM AppChrome:
//   - NO RAIL ON MOBILE (Ali, 1 Oct: "Mobile has NO left-hand rail at
//     all. We had a different version without the rail. Let's run with
//     that"). Below md the sidebar is not rendered at all, collapsed or
//     otherwise. In its place is the earlier mobile version's sticky top
//     bar ("Home — panel stack": a bar with the identity on one side and
//     the avatar on the other, border under, blurred background), here
//     with the Glint wordmark on the left. The nav lives in a menu sheet
//     behind the button beside it, so Activity and Bank Accounts stay
//     reachable. A screen's toolbar slot and the layout's Back sit in a
//     row under the bar.
//   - From md up it is AppChrome as before: the full rail, never the
//     collapsed icon rail, and the sticky toolbar.
//
// Everything else is AppChrome's, and its notes still apply: the nav
// (Wallets, Activity, Bank Accounts) keeps the lit item a link, the
// wordmark is the way back to the demo home, identity comes from Persona,
// and PAGE SLOTS (AppChromeV2.Slot) are how a screen puts content into the
// chrome, because promotion strips the wrapper and its props.
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
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Toolbar,
  Stack,
  Row,
  Button,
  Avatar,
  AvatarFallback,
} from "@gradeui/ui";
import { List, Landmark, Bell, EyeOff, MessageCircle, Menu } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { Persona } from "@/lib/persona";

function GlintMark({ className }: { className?: string }) {
  return <Wordmark lockup="mark" tone="current" className={className ?? "size-4"} />;
}

/* The nav targets are Studio SCREEN NAMES resolved by the goto protocol
   (and by the app's screen registry), so the long dash is part of each
   name. */
const NAV: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  target: string;
}[] = [
  { label: "Wallets", icon: GlintMark, target: "Dashboard — logged-in home v2" },
  { label: "Activity", icon: List, target: "Activity — history v2" },
  { label: "Bank Accounts", icon: Landmark, target: "Bank Accounts v2" },
];

/* Rail spacing, in one place. */
const RAIL = {
  "--gds-sidebar-header-height": "3rem",
  "--gds-sidebar-section-px": "0.75rem",
  "--gds-sidebar-section-gap": "0.375rem",
  "--gds-sidebar-content-py": "1rem",
  "--gds-sidebar-footer-px": "0.75rem",
  "--gds-sidebar-footer-py": "1rem",
} as React.CSSProperties;

type SlotRegion = "leading" | "center" | "trailing";

const SlotContext = React.createContext<
  ((key: string, region: SlotRegion, node: React.ReactNode) => void) | null
>(null);

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** The business identity box, the rail's footer and the menu sheet's foot. */
function Identity({
  business,
  businessMeta,
}: {
  business: string;
  businessMeta: string;
}) {
  return (
    <div className="w-full rounded-lg border border-border/60 bg-muted/20 p-2">
      <Row gap="sm">
        <Avatar size="sm">
          <AvatarFallback>{initials(business)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{business}</div>
          <div className="truncate text-xs text-muted-foreground">{businessMeta}</div>
        </div>
      </Row>
    </div>
  );
}

export function AppChromeV2({
  active = "Wallets",
  business = Persona.DEFAULT.business,
  businessMeta = Persona.DEFAULT.businessMeta,
  account = Persona.DEFAULT.account,
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

  const [menuOpen, setMenuOpen] = React.useState(false);
  const leading =
    toolbarLeading || slotsIn("leading").length ? (
      <Row gap="sm">
        {toolbarLeading}
        {slotsIn("leading")}
      </Row>
    ) : null;

  const utilities = (
    <>
      <div className="relative">
        <Button variant="ghost" size="md" iconOnly aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <span className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-destructive" />
      </div>
      <Avatar size="sm">
        <AvatarFallback>{account}</AvatarFallback>
      </Avatar>
    </>
  );

  return (
    <AppShell nav="side" className="h-screen overflow-hidden">
      {/* THE RAIL, md and up only: below md it is not rendered at all. */}
      <AppShellNav className="hidden h-full min-h-0 md:block">
        <Sidebar collapsible={false} bordered={false} className="h-full" style={RAIL}>
          <SidebarHeader>
            <button
              type="button"
              data-grade-goto="US Demo Landing"
              aria-label="Glint: back to the demo home"
              className="flex cursor-pointer items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="px-2">
                <Wordmark className="h-5" />
              </div>
            </button>
          </SidebarHeader>
          <SidebarContent className="flex flex-col">
            <SidebarSection collapsible={false}>
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarItem
                    key={item.label}
                    icon={<Icon />}
                    active={item.label === active}
                    data-grade-goto={item.target}
                  >
                    {item.label}
                  </SidebarItem>
                );
              })}
            </SidebarSection>
            {/* Chat with us: inert by design, as in AppChrome. */}
            <div className="mt-auto px-3 pt-3">
              <button
                type="button"
                aria-label="Chat with us"
                className="group w-full cursor-pointer rounded-lg border border-primary/25 bg-primary/10 p-2 text-left transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Row gap="sm" align="center">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <MessageCircle className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      Chat with us
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      Typically replies in minutes
                    </div>
                  </div>
                </Row>
              </button>
            </div>
          </SidebarContent>
          <SidebarFooter>
            <Identity business={business} businessMeta={businessMeta} />
          </SidebarFooter>
        </Sidebar>
      </AppShellNav>

      <AppShellMain className="h-full min-h-0 overflow-y-auto">
        {/* MOBILE TOP BAR, below md only: the earlier mobile version's bar,
            with the menu button and the wordmark on the left and the
            notifications and avatar on the right. The page's own toolbar
            content (Back, a screen's slot) sits in a row under it. */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur md:hidden">
          <Row justify="between" align="center" className="h-14 px-4">
            <Row gap="xs" align="center">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="md" iconOnly aria-label="Menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                {/* CLOSES ON NAVIGATION: in the app the sheet belongs to the
                    route layout and outlives a route change, and the goto
                    bridge stops the click before an item's own onClick, so
                    the close is caught on the way down instead. */}
                <SheetContent
                  side="left"
                  className="flex flex-col"
                  onClickCapture={(e) => {
                    if ((e.target as Element).closest?.("[data-grade-goto]")) setMenuOpen(false);
                  }}
                >
                  <SheetHeader className="text-left">
                    <SheetTitle>
                      <Wordmark cut="champagne" className="h-5" />
                      <span className="sr-only">Menu</span>
                    </SheetTitle>
                  </SheetHeader>
                  <Stack gap="lg" className="flex-1">
                    <Stack gap="xs">
                      {NAV.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.label}
                            variant={item.label === active ? "secondary" : "ghost"}
                            size="md"
                            className="w-full justify-start"
                            aria-current={item.label === active ? "page" : undefined}
                            data-grade-goto={item.target}
                          >
                            <Icon className="size-4" />
                            {item.label}
                          </Button>
                        );
                      })}
                    </Stack>
                    <div className="mt-auto">
                      <Identity business={business} businessMeta={businessMeta} />
                    </div>
                  </Stack>
                </SheetContent>
              </Sheet>
              <button
                type="button"
                data-grade-goto="US Demo Landing"
                aria-label="Glint: back to the demo home"
                className="flex cursor-pointer items-center rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* THE CHAMPAGNE CUT, not the rail's metal one, and not
                    only for the dark bar: a Wordmark's gradient is a <defs>
                    id keyed on lockup and cut, and on mobile the rail's
                    copy of the metal id sits inside display:none, where
                    Chrome will not paint a gradient. Sharing that id left
                    this wordmark invisible. */}
                <Wordmark cut="champagne" className="h-5" />
              </button>
            </Row>
            <Row gap="xs" align="center">
              {utilities}
            </Row>
          </Row>
          {leading ? <div className="overflow-x-auto px-4 pb-3">{leading}</div> : null}
        </div>

        {/* DESKTOP TOOLBAR, md and up: AppChrome's, unchanged. */}
        <Toolbar
          sticky
          aria-label="Page toolbar"
          className="hidden px-4 md:grid md:px-6 lg:px-8"
          leading={leading}
          center={
            slotsIn("center").length ? (
              <Row gap="sm">{slotsIn("center")}</Row>
            ) : null
          }
          trailing={
            <Row gap="sm">
              {slotsIn("trailing")}
              <Button variant="ghost" size="md" iconOnly aria-label="Hide balances">
                <EyeOff className="size-4" />
              </Button>
              {utilities}
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

/** Compound part: a screen's content for a region of the chrome. Renders
 *  nothing in place. region defaults to "leading"; id lets one screen fill
 *  the same region twice. Children are captured when it mounts. */
AppChromeV2.Slot = function AppChromeV2Slot({
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
    /* `children` is deliberately NOT a dependency: captured at mount. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, key, region]);
  return null;
};
