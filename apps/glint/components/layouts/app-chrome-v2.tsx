// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// AppChromeV2 (1 Oct 2026): the logged-in shell for the Glint business
// portal v2. A FORK of AppChrome: the live demo is promoted from screens
// that wrap AppChrome, so the original stays exactly as it was.
//
// TWIN: the Studio shared component "AppChromeV2" (cmuptagvulv5u1). Editing one does
// not touch the other. Keep the pair in sync.
//
// 7 OCT, REBUILT ON THE WEB DS AppShell, as "Glint - Web Portal - Full
// New" draws it (Wallets · Default, 72:163336, and the Profile drop down):
//   - THE SIDEBAR is 264 on sidebar, with the ring lattice at Light
//     behind it fading out towards the top. Header: the wordmark (24 tall,
//     the wordmark token) and the SidebarTrigger (ghost, 28, panel-left
//     16). Then the SidebarAccount (a 56 row with a sidebar-border edge and
//     10 corners: the 36 avatar on muted with 6 corners, the business in
//     Chivo Medium 14/20, "Business Account" in 12/16, chevrons-up-down).
//     Then the nav: Large SidebarMenuItems, 56 tall with 16 corners, a 36
//     icon slot with 6 corners (sidebar, plus a sidebar-border edge when
//     not lit), the label in Raleway Bold 16/20 and a 12/16 line under it;
//     the lit one sits on sidebar-accent with its icon filled. The footer
//     is empty, so the old "Chat with us" box has gone.
//   - THE NAV IS WALLETS AND ACTIVITY. Bank accounts is no longer in it
//     (ASSUMPTION, flagged to Ali: the page and its route stay, reachable
//     by address only, until he says where it belongs).
//   - THE HEADER is the Web DS Header, Surface=raised: a card inset 6 and
//     8 from the edges, 56 tall, 16 corners, 24 sides, a border; a
//     breadcrumb on the left (Chivo Medium 14/20: a link in
//     muted-foreground, a chevron-right 16, the page in foreground) and on
//     the right a 36 round Notifications button (bell 20, muted-foreground)
//     and the 32 avatar. Collapsing the sidebar shows the Header's own
//     trigger (panel-left in primary) at its start.
//   - THE ACCOUNT MENU (Profile drop down): the avatar and the person's
//     name, then Profile, Settings, Help, then Sign out, which now goes to
//     the log in. Settings opens the Settings page.
//   - MOBILE (Wallets · Default · Mobile): a 60 top bar, 12 and 16 in, the
//     wordmark on the left and two 36 ghost buttons on the right,
//     Notifications and the menu (panel-left), which opens the sidebar as a
//     sheet from the left.
//   - The colour is the Web DS's: <WebDsV2 /> is mounted here.
//
// ASSUMPTION, THE NAV'S SECOND LINES: Figma's "£29.85 total" and "3 since
// yesterday" are sample data. Here they are live: the dollar total of the
// three wallets, and how many activity rows fall on or after the day
// before the newest one (the demo has no real "today").
//
// ASSUMPTION, THE ACCOUNT: Figma's "Acme Corp" is sample data; this shows
// the persona's business (Ridgeline Construction).
//
// PROPS: active ("Wallets" | "Activity" | ...), crumbs ([{ label,
// target? }], the last one is the page). In the app the route layout
// passes both from the pathname, because promotion strips this wrapper.
// AppChromeV2.Slot still lets a screen put content into the header.
import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@gradeui/ui";
import {
  Bell,
  PanelLeft,
  ChevronsUpDown,
  ChevronRight,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { Persona } from "@/lib/persona";
import { RingLattice } from "@/components/ring-lattice";
import { WebDsV2 } from "@/components/web-ds-v2";

/* GLINT'S TAB ICONS, from Figma Primatives & Helpers, page "Glint icons",
   component set "Icon / Tab" (419:4082), exported as SVG on 1 Oct 2026.
   24 grid, 2pt round strokes, painted with currentColor so they take the
   row's colour like any other icon; `filled` is the set's filled style,
   used for the lit item. */
function WalletsIcon({ filled = false, className }) {
  const fill = filled ? "currentColor" : "none";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M2.5 19.5L4.2 14.5H8.8L10.5 19.5H2.5Z" fill={fill} />
      <path d="M13.5 19.5L15.2 14.5H19.8L21.5 19.5H13.5Z" fill={fill} />
      <path d="M8 11.5L9.7 6.5H14.3L16 11.5H8Z" fill={fill} />
    </svg>
  );
}

function ActivityIcon({ filled = false, className }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M7.5 4V17" strokeWidth="2.6" />
      <path d="M3.6 15L7.5 20L11.4 15H3.6Z" fill="currentColor" strokeWidth="2" />
      <path d="M16.5 20V7" strokeWidth="2.6" />
      <path d="M12.6 9L16.5 4L20.4 9H12.6Z" fill="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M7.5 4V19" />
      <path d="M3.8 15.5L7.5 19.5L11.2 15.5" />
      <path d="M16.5 20V5" />
      <path d="M12.8 8.5L16.5 4.5L20.2 8.5" />
    </svg>
  );
}

function ProfileIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" />
      <path d="M4.5 20.5C4.5 18.7761 5.29018 17.1228 6.6967 15.9038C8.10322 14.6848 10.0109 14 12 14C13.9891 14 15.8968 14.6848 17.3033 15.9038C18.7098 17.1228 19.5 18.7761 19.5 20.5" />
    </svg>
  );
}

/* The nav targets are Studio SCREEN NAMES resolved by the goto protocol
   (and by the app's screen registry), so the long dash is part of each
   name. Each item's second line is built from live data in the shell. */
const NAV = [
  { label: "Wallets", icon: WalletsIcon, target: "Dashboard — logged-in home v2" },
  { label: "Activity", icon: ActivityIcon, target: "Activity — history v2" },
];
const LOG_IN = "Log in v2";
const SETTINGS = "Settings v2";

/** Studio only: the Web DS type tokens on the document, and the faces.
 *  Plus LINING TABULAR FIGURES as the page default (Ali, 2 Oct: every
 *  figure on web is tabular, and lining wherever Raleway is used, whose
 *  own figures are old-style). The app sets the same in app/globals.css.
 *
 *  A <style> ELEMENT, not the root's inline style (2 Oct). Studio applies
 *  the project theme by rewriting the root's whole style attribute after
 *  this mounts, which silently wiped these tokens: Studio showed the v2
 *  screens in the theme's Geist rather than Chivo and Raleway. A style
 *  element survives that. ":root:root" outranks the theme's own :root
 *  rules without !important. Removed again when the chrome unmounts. */
const WEB_DS_TYPE_CSS =
  ":root:root{--font-sans:Chivo, system-ui, sans-serif;" +
  "--font-display:Raleway, system-ui, sans-serif;" +
  "--font-heading-weight:700;" +
  "font-variant-numeric:lining-nums tabular-nums}";
function useWebDsType() {
  React.useEffect(() => {
    if (!document.getElementById("glint-webds-fonts")) {
      const link = document.createElement("link");
      link.id = "glint-webds-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Chivo:wght@400;500;600;700&family=Raleway:wght@600;700&display=swap";
      document.head.appendChild(link);
    }
    /* One element PER MOUNT, each removing only its own: Fast Frame
       double-buffers the preview, so two of this chrome can be mounted at
       once, and a shared element would leave with the first to unmount. */
    const style = document.createElement("style");
    style.dataset.glintWebdsType = "";
    style.textContent = WEB_DS_TYPE_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

const SlotContext = React.createContext(null);

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const cx = (...c) => c.filter(Boolean).join(" ");
const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)]";

/** Web DS Avatar, Size=default: 32, muted, initials Chivo Medium 12/16. */
function InitialsAvatar({ text, className }) {
  return (
    <span
      className={cx(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--wds-muted)] text-xs font-medium leading-4 text-[color:var(--wds-muted-foreground)]",
        className,
      )}
    >
      {text}
    </span>
  );
}

/** Web DS Button ghost, Size=icon: 36 round. */
function IconButton({ label, children, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[var(--wds-accent)]",
        FOCUS,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** The sidebar: header, account, nav. Shared by the desktop rail and the
 *  mobile sheet. */
function SidebarBody({ active, business, describe, onTrigger, onNavigate }) {
  return (
    <div className="relative flex h-full flex-col gap-4 overflow-hidden bg-[var(--wds-sidebar)]">
      <RingLattice strength={0.1} fade="top" />
      {/* SidebarHeader: 20 above and below, 24 left, 16 right. */}
      <div className="relative flex h-[68px] shrink-0 items-center justify-between pb-5 pl-6 pr-4 pt-5">
        <button
          type="button"
          data-grade-goto="Dashboard — logged-in home v2"
          aria-label="Glint: Wallets"
          className={cx("flex cursor-pointer items-center rounded-[6px]", FOCUS)}
          onClick={onNavigate}
        >
          <Wordmark tone="current" style={{ height: 24, color: "var(--wds-wordmark)" }} />
        </button>
        <button
          type="button"
          aria-label="Collapse sidebar"
          onClick={onTrigger}
          className={cx(
            "flex size-7 cursor-pointer items-center justify-center rounded-[8px] text-[color:var(--wds-sidebar-foreground)] transition-colors hover:bg-[var(--wds-sidebar-accent)]",
            FOCUS,
          )}
        >
          <PanelLeft className="size-4" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* SidebarGroup · Account */}
        <div className="p-2">
          <button
            type="button"
            className={cx(
              "flex h-14 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-[color:var(--wds-sidebar-border)] px-2.5 py-2 text-left transition-colors hover:bg-[var(--wds-sidebar-accent)]",
              FOCUS,
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[6px] bg-[var(--wds-muted)] text-xs font-medium leading-4 text-[color:var(--wds-muted-foreground)]">
              {initials(business)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">
                {business}
              </span>
              <span className="truncate text-xs leading-4 text-[color:var(--wds-sidebar-foreground)]">
                Business Account
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-[color:var(--wds-sidebar-foreground)]" />
          </button>
        </div>
        {/* SidebarGroup: the nav. */}
        <nav className="flex flex-col gap-1 p-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const lit = item.label === active;
            return (
              <button
                key={item.label}
                type="button"
                data-grade-goto={item.target}
                aria-current={lit ? "page" : undefined}
                onClick={onNavigate}
                className={cx(
                  "flex h-14 w-full cursor-pointer items-center gap-3 rounded-[16px] px-2.5 py-2 text-left transition-colors",
                  lit ? "bg-[var(--wds-sidebar-accent)]" : "hover:bg-[var(--wds-sidebar-accent)]",
                  FOCUS,
                )}
              >
                <span
                  className={cx(
                    "flex size-9 shrink-0 items-center justify-center rounded-[6px] bg-[var(--wds-sidebar)]",
                    lit
                      ? "text-[color:var(--wds-sidebar-accent-foreground)]"
                      : "border border-[color:var(--wds-sidebar-border)] text-[color:var(--wds-sidebar-foreground)]",
                  )}
                >
                  <Icon filled={lit} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cx(
                      "truncate wds-display text-base font-bold leading-5",
                      lit
                        ? "text-[color:var(--wds-sidebar-accent-foreground)]"
                        : "text-[color:var(--wds-sidebar-foreground)]",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="truncate text-xs leading-4 text-[color:var(--wds-muted-foreground)]">
                    {describe[item.label]}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/** The avatar's account menu (Profile drop down). */
function AccountMenu({ name }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account menu" className={cx("cursor-pointer rounded-full", FOCUS)}>
          <InitialsAvatar text={initials(name)} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} style={{ width: "17.5rem" }}>
        <DropdownMenuLabel className="font-normal">
          <span className="flex items-center gap-2 py-1">
            <InitialsAvatar text={initials(name)} />
            <span className="truncate text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">
              {name}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10">
          <ProfileIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="h-10" data-grade-goto={SETTINGS}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="h-10">
          <CircleHelp className="size-4" />
          Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10" data-grade-goto={LOG_IN}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Web DS Breadcrumb: links in muted-foreground, a 16 chevron-right
 *  between, the page in foreground; Chivo Medium 14/20. */
function Crumbs({ crumbs }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <React.Fragment key={`${c.label}-${i}`}>
            {i > 0 ? <ChevronRight aria-hidden className="size-4 shrink-0 text-[color:var(--wds-muted-foreground)]" /> : null}
            {last || !c.target ? (
              <span
                aria-current={last ? "page" : undefined}
                className="truncate text-sm font-medium leading-5 text-[color:var(--wds-foreground)]"
              >
                {c.label}
              </span>
            ) : (
              <button
                type="button"
                data-grade-goto={c.target}
                className={cx(
                  "cursor-pointer truncate rounded-[4px] text-sm font-medium leading-5 text-[color:var(--wds-muted-foreground)] hover:text-[color:var(--wds-foreground)]",
                  FOCUS,
                )}
              >
                {c.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/** "N since yesterday": rows on or after the day before the newest row. */
function sinceYesterday(rows) {
  if (!rows.length) return 0;
  const newest = Math.max(...rows.map((r) => new Date(r.timestamp).getTime()));
  const d = new Date(newest);
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime();
  return rows.filter((r) => new Date(r.timestamp).getTime() >= from).length;
}

function AppChromeV2({
  active = "Wallets",
  crumbs,
  business = Persona.DEFAULT.business,
  children,
}) {
  const [slots, setSlots] = React.useState({});
  const registerSlot = React.useCallback((key, region, node) => {
    setSlots((prev) => {
      if (node === null) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { region, node } };
    });
  }, []);
  const slotsIn = (region) =>
    Object.entries(slots)
      .filter(([, v]) => v.region === region)
      .map(([key, v]) => <React.Fragment key={key}>{v.node}</React.Fragment>);

  const [collapsed, setCollapsed] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  /* CLOSES ON NAVIGATION (7 Oct evening). In the app the chrome outlives
     a route change, and the goto bridge's document capture listener stops
     a goto click before React sees it, so an onClickCapture on the sheet
     never ran and the menu stayed open over the next page, eating the
     first press there (a wallet card tap after Menu, Wallets landed on
     the scrim, not the card). A document listener of our own runs
     whatever the bridge does: stopPropagation does not stop other
     listeners on the same node. */
  React.useEffect(() => {
    if (!menuOpen) return undefined;
    const onGoto = (e) => {
      if (e.target?.closest?.("[data-grade-goto]")) setMenuOpen(false);
    };
    document.addEventListener("click", onGoto, true);
    return () => document.removeEventListener("click", onGoto, true);
  }, [menuOpen]);
  /* useWebDsType() is Studio only: the app sets the Web DS type in
     app/globals.css and loads the faces with next/font. */

  const [gold] = Persona.useBalance("gold");
  const [silver] = Persona.useBalance("silver");
  const [fiat] = Persona.useBalance("fiat");
  const rows = Persona.useActivity();
  const describe = {
    Wallets: `${Persona.fmtMoney(gold + silver + fiat)} total`,
    Activity: `${sinceYesterday(rows)} since yesterday`,
  };
  const person = Persona.fullName();
  const trail = crumbs && crumbs.length ? crumbs : [{ label: active }];

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--wds-background)] text-[color:var(--wds-foreground)]">
      <WebDsV2 />
      {/* THE SIDEBAR, md and up. */}
      {!collapsed ? (
        <aside className="hidden h-full w-[264px] shrink-0 md:block">
          <SidebarBody
            active={active}
            business={business}
            describe={describe}
            onTrigger={() => setCollapsed(true)}
          />
        </aside>
      ) : null}

      {/* SidebarInset */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* MOBILE TOP BAR, below md. */}
        <div className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-2 bg-[var(--wds-background)] px-4 py-3 md:hidden">
          <button
            type="button"
            data-grade-goto="Dashboard — logged-in home v2"
            aria-label="Glint: Wallets"
            className={cx("flex cursor-pointer items-center rounded-[6px]", FOCUS)}
          >
            <Wordmark tone="current" style={{ height: 24, color: "var(--wds-wordmark)" }} />
          </button>
          <div className="flex items-center gap-1">
            <IconButton label="Notifications" className="text-[color:var(--wds-muted-foreground)]">
              <Bell className="size-4" />
            </IconButton>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <IconButton
                label="Menu"
                className="text-[color:var(--wds-sidebar-foreground)]"
                onClick={() => setMenuOpen(true)}
              >
                <PanelLeft className="size-4" />
              </IconButton>
              {/* Closes on navigation: see the effect by menuOpen. */}
              <SheetContent side="left" className="w-[264px] max-w-[85vw] gap-0 border-0 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SidebarBody
                  active={active}
                  business={business}
                  describe={describe}
                  onTrigger={() => setMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* THE HEADER, md and up: Web DS Header, Surface=raised. */}
        <div className="sticky top-0 z-30 hidden shrink-0 bg-[var(--wds-background)] px-2 py-1.5 md:block">
          <header className="flex h-14 items-center gap-3 rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-card)] px-6">
            {collapsed ? (
              <button
                type="button"
                aria-label="Expand sidebar"
                onClick={() => setCollapsed(false)}
                className={cx(
                  "-ml-2 flex size-7 cursor-pointer items-center justify-center rounded-[8px] text-[color:var(--wds-primary)] hover:bg-[var(--wds-accent)]",
                  FOCUS,
                )}
              >
                <PanelLeft className="size-4" />
              </button>
            ) : null}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Crumbs crumbs={trail} />
              {slotsIn("leading")}
            </div>
            <div className="flex items-center gap-0.5">
              {slotsIn("trailing")}
              <IconButton label="Notifications" className="text-[color:var(--wds-muted-foreground)]">
                <Bell className="size-5" />
              </IconButton>
              <AccountMenu name={person} />
            </div>
          </header>
        </div>

        <SlotContext.Provider value={registerSlot}>{children}</SlotContext.Provider>
      </div>
    </div>
  );
}

/** Compound part: a screen's content for a region of the header. Renders
 *  nothing in place. region defaults to "leading"; id lets one screen fill
 *  the same region twice. Children are captured when it mounts. */
AppChromeV2.Slot = function AppChromeV2Slot({ region = "leading", id, children }) {
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

/** The page body: Web DS SidebarInset main, 24 all round with 24 between
 *  blocks on desktop; 8, 16, 32, 16 with 16 between on mobile. A screen
 *  wraps its content in this so every page keeps the same margins. */
AppChromeV2.Main = function AppChromeV2Main({ children, className }) {
  return (
    <main className={cx("flex flex-col gap-4 px-4 pb-8 pt-2 md:gap-6 md:p-6", className)}>{children}</main>
  );
};

/** The page title: Raleway Bold 24/32. */
AppChromeV2.Title = function AppChromeV2Title({ children, className }) {
  return <h1 className={cx("wds-display text-2xl font-bold leading-8", className)}>{children}</h1>;
};

/** A section heading: Chivo SemiBold 18/28 in foreground. */
AppChromeV2.Heading = function AppChromeV2Heading({ children, className }) {
  return <h2 className={cx("font-sans text-lg font-semibold leading-7 text-[color:var(--wds-foreground)]", className)}>{children}</h2>;
};

/* Exported untyped: the body is plain JSX (see the header). */
const __AppChromeV2: any = AppChromeV2;
export { __AppChromeV2 as AppChromeV2 };
