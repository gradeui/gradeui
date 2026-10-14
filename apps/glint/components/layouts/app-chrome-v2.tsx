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
//   - THE NAV IS WALLETS, ACTIVITY AND BUSINESS PROFILE (14 Oct, Full New
//     adds the third, its second line the business name). Bank accounts is
//     no longer in it (ASSUMPTION, flagged to Ali: the page and its route
//     stay, reachable by address only, until he says where it belongs).
//   - THE HEADER is the Web DS Header, Surface=raised: a card inset 6 and
//     8 from the edges, 56 tall, 16 corners, 24 sides, a border; a
//     breadcrumb on the left (Chivo Medium 14/20: a link in
//     muted-foreground, a chevron-right 16, the page in foreground) and on
//     the right a 36 round Notifications button (bell 20, muted-foreground)
//     and the 32 avatar. Collapsing the sidebar shows the Header's own
//     trigger (panel-left in primary) at its start.
//   - THE ACCOUNT MENU (Profile drop down, 72:165143, 14 Oct): 320 wide,
//     6 inside; a header of the 40 avatar, the name (Chivo Medium 14/20,
//     wrapping: the Long name state) and the business under it in
//     muted-foreground; then Profile and Sign out, each 40 tall, with a
//     rule 6 above and below every one (a plain 1px div: the shipped
//     DropdownMenuSeparator in the app drops margin classes). Settings and
//     Help are gone.
//   - THE HEADER AVATAR wears a 2px ring in the gold token (Profile drop
//     down, Wallets · Default), 36 across in all.
//   - THE BELL opens Notifications. ASSUMPTION (14 Oct): the red count
//     badge on it is the LIVE Glint build's (web.staging.glintpay.com),
//     which Full New does not draw; it counts unread notifications and
//     clears on Mark all as read.
//   - MOBILE (Wallets · Default · Mobile): a 60 top bar, 12 and 16 in, the
//     wordmark on the left and two 36 ghost buttons on the right,
//     Notifications and the menu (panel-left), which opens the sidebar as a
//     sheet from the left.
//   - The colour is the Web DS's: <WebDsV2 /> is mounted here.
//   - SEARCH (14 Oct, Ali: "add it because its there - as I want to match"):
//     the Glint build's search button, left of the bell, opens its command
//     palette, "Search or jump to…", with exactly its five entries in two
//     groups (Console: Wallets, Activity; Account: Notifications, Account,
//     Your settings); typing filters those five and nothing else, as on the
//     Glint build. Measured off its capture: 576 wide, 105 from the top,
//     popover with a border, 16 corners, 8 inside; a 32 input on
//     input-background; 12/16 group labels; 32 rows, 8 corners, accent on
//     the active one. Up, Down and Enter work; Escape or a press outside
//     closes; Cmd or Ctrl K opens it. ASSUMPTION, THE MAPPING: Account goes
//     to Business profile (the business's account) and Your settings to
//     Profile.
//   - HELP (14 Oct, Ali: "we can add in the help at the bottom"): a 16
//     circle-help and "Help" pinned to the foot of the sidebar, as the
//     Glint build has it; the collapsed rail keeps the icon. It opens
//     nothing (the demo has no help pages).
//   - COLLAPSED (14 Oct): the Web DS Sidebar's State=Collapsed, the 64 rail:
//     the trigger on top, the business as a 56 box (its 36 initials tile),
//     each nav item as its 36 tile in a 56 slot (the lit one on
//     sidebar-accent with 16 corners), Help at the foot. Pressing the
//     trigger expands it again. ASSUMPTION: Ali said "no icon rail" and
//     also to follow Figma's collapsed version, which is this rail; it is
//     Figma's rail, not the Glint build's.
//   - SYSTEM STATES (14 Oct, StagingSwitches ?state=): "error" swaps every
//     page's content for the Web DS EmptyState of Error · Page; "offline"
//     raises Toast · Error. The toasts (WebDsV2.toast) show from the host
//     mounted here. Try again and Retry now return to ?state=live.
//
// ASSUMPTION, THE NAV'S SECOND LINES: Figma's "£29.85 total" and "3 since
// yesterday" are sample data. Here they are live: the dollar total of the
// three wallets, and how many activity rows fall on or after the day
// before the newest one (the demo has no real "today").
//
// THE ACCOUNT (14 Oct, Ali chose Full New's names): Acme Corp, from
// PortalV2. Before this it showed the persona's Ridgeline Construction.
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
} from "@gradeui/ui";
import {
  Bell,
  PanelLeft,
  ChevronsUpDown,
  ChevronRight,
  Briefcase,
  LogOut,
  Search,
  Wallet,
  List,
  Settings,
  CircleUser,
  CircleHelp,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { Persona } from "@/lib/persona";
import { PortalV2 } from "@/lib/portal-v2";
import { RingLattice } from "@/components/ring-lattice";
import { StagingSwitches } from "@/lib/staging-switches";
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

/* Business profile's briefcase (Full New's sidebar). ASSUMPTION: Figma
   shows no lit state for it, so it is lucide's outline briefcase at the
   tab icons' 2pt stroke, filled like them when lit. */
function BusinessIcon({ filled = false, className }) {
  return <Briefcase aria-hidden strokeWidth={2} fill={filled ? "currentColor" : "none"} className={className} />;
}

/* The nav targets are Studio SCREEN NAMES resolved by the goto protocol
   (and by the app's screen registry), so the long dash is part of each
   name. Each item's second line is built from live data in the shell. */
const NAV = [
  { label: "Wallets", icon: WalletsIcon, target: "Dashboard — logged-in home v2" },
  { label: "Activity", icon: ActivityIcon, target: "Activity — history v2" },
  { label: "Business profile", icon: BusinessIcon, target: "Business profile v2" },
];
const LOG_IN = "Log in v2";
const PROFILE = "Profile v2";
const NOTIFICATIONS = "Notifications v2";

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

/** Web DS Avatar, Size=default: 32, muted, initials Chivo Medium 12/16.
 *  ring adds the 2px gold-token ring the header's avatar wears. */
function InitialsAvatar({ text, ring = false, className }) {
  return (
    <span
      className={cx(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--wds-muted)] text-xs font-medium leading-4 text-[color:var(--wds-muted-foreground)]",
        ring && "ring-2 ring-[color:var(--wds-gold)]",
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
function SidebarBody({ active, business, describe, onTrigger, onNavigate, person }) {
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
        {person ? null : (
          <div className="mt-auto flex flex-col">
            <HelpRow />
          </div>
        )}
        {/* THE PHONE MENU'S ACCOUNT ROWS (14 Oct). Below md there is no
            header avatar, so Profile and Sign out were unreachable on a
            phone (12 Oct bug list). ASSUMPTION: Full New draws no phone
            menu, so the sheet (only: `person` is passed there) ends with
            the two rows of the account menu, at its 40 height and 14/20. */}
        {person ? (
          <div className="mt-auto flex flex-col gap-1 border-t border-[color:var(--wds-sidebar-border)] p-2">
            <div className="flex items-center gap-3 px-2.5 py-2">
              <InitialsAvatar text={initials(person)} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">{person}</span>
                <span className="truncate text-xs leading-4 text-[color:var(--wds-muted-foreground)]">{business}</span>
              </span>
            </div>
            {[
              { label: "Profile", Icon: ProfileIcon, target: PROFILE },
              { label: "Sign out", Icon: LogOut, target: LOG_IN },
            ].map(({ label, Icon, target }) => (
              <button
                key={label}
                type="button"
                data-grade-goto={target}
                onClick={onNavigate}
                className={cx(
                  "flex h-10 w-full cursor-pointer items-center gap-3 rounded-[8px] px-2.5 text-left text-sm leading-5 text-[color:var(--wds-sidebar-foreground)] transition-colors hover:bg-[var(--wds-sidebar-accent)]",
                  FOCUS,
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Help at the foot of the sidebar (see HELP above). */
function HelpRow() {
  return (
    <button
      type="button"
      className={cx(
        "relative mx-2 mb-3 flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] px-4 text-left text-sm leading-5 text-[color:var(--wds-sidebar-foreground)] transition-colors hover:bg-[var(--wds-sidebar-accent)]",
        FOCUS,
      )}
    >
      <CircleHelp className="size-4" />
      Help
    </button>
  );
}

/** The collapsed sidebar: the Web DS Sidebar, State=Collapsed. */
function SidebarRail({ active, business, onTrigger }) {
  return (
    <div className="relative flex h-full w-16 flex-col items-center overflow-hidden bg-[var(--wds-sidebar)]">
      <RingLattice strength={0.1} fade="top" />
      <div className="relative flex h-14 shrink-0 items-center justify-center">
        <button
          type="button"
          aria-label="Expand sidebar"
          onClick={onTrigger}
          className={cx(
            "flex size-7 cursor-pointer items-center justify-center rounded-[8px] text-[color:var(--wds-sidebar-foreground)] transition-colors hover:bg-[var(--wds-sidebar-accent)]",
            FOCUS,
          )}
        >
          <PanelLeft className="size-4" />
        </button>
      </div>
      <div className="relative pt-[22px]">
        <button
          type="button"
          aria-label={business}
          className={cx(
            "flex size-14 cursor-pointer items-center justify-center rounded-[10px] border border-[color:var(--wds-sidebar-border)] transition-colors hover:bg-[var(--wds-sidebar-accent)]",
            FOCUS,
          )}
        >
          <span className="flex size-9 items-center justify-center rounded-[6px] bg-[var(--wds-muted)] text-xs font-medium leading-4 text-[color:var(--wds-muted-foreground)]">
            {initials(business)}
          </span>
        </button>
      </div>
      <nav className="relative flex flex-col items-center gap-1 pt-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const lit = item.label === active;
          return (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              data-grade-goto={item.target}
              aria-current={lit ? "page" : undefined}
              className={cx(
                "flex size-14 cursor-pointer items-center justify-center rounded-[16px] transition-colors",
                lit ? "bg-[var(--wds-sidebar-accent)]" : "hover:bg-[var(--wds-sidebar-accent)]",
                FOCUS,
              )}
            >
              <span
                className={cx(
                  "flex size-9 items-center justify-center rounded-[6px] bg-[var(--wds-sidebar)]",
                  lit
                    ? "text-[color:var(--wds-sidebar-accent-foreground)]"
                    : "border border-[color:var(--wds-sidebar-border)] text-[color:var(--wds-sidebar-foreground)]",
                )}
              >
                <Icon filled={lit} className="size-5" />
              </span>
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        aria-label="Help"
        className={cx(
          "relative mb-1.5 mt-auto flex size-9 cursor-pointer items-center justify-center rounded-[8px] text-[color:var(--wds-sidebar-foreground)] hover:bg-[var(--wds-sidebar-accent)]",
          FOCUS,
        )}
      >
        <CircleHelp className="size-4" />
      </button>
    </div>
  );
}

/* The command palette's entries, exactly the Glint build's (see SEARCH). */
const SEARCH_GROUPS = [
  {
    label: "Console",
    items: [
      { label: "Wallets", icon: Wallet, target: "Dashboard — logged-in home v2" },
      { label: "Activity", icon: List, target: "Activity — history v2" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", icon: Bell, target: "Notifications v2" },
      { label: "Account", icon: Settings, target: "Business profile v2" },
      { label: "Your settings", icon: CircleUser, target: "Profile v2" },
    ],
  },
];

/** The header's search button and its command palette. */
function SearchPalette({ size = "size-5" }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [at, setAt] = React.useState(0);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);
  const groups = SEARCH_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())),
  })).filter((g) => g.items.length);
  const flat = groups.flatMap((g) => g.items);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  React.useEffect(() => {
    if (!open) return;
    setQ("");
    setAt(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);
  React.useEffect(() => setAt(0), [q]);
  const go = (i) => {
    listRef.current?.querySelector(`[data-index="${i}"]`)?.click();
  };
  let index = -1;
  return (
    <>
      <IconButton label="Search" onClick={() => setOpen(true)} className="text-[color:var(--wds-muted-foreground)]">
        <Search className={size} />
      </IconButton>
      {open ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <div className="absolute inset-0 bg-[var(--wds-overlay)]" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Search"
            className="relative mx-auto mt-[105px] flex w-[576px] max-w-[calc(100vw-32px)] flex-col rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-popover)] p-2 shadow-[0_10px_15px_-3px_var(--wds-shadow),0_4px_6px_-4px_var(--wds-shadow)]"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setAt((n) => Math.min(flat.length - 1, n + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAt((n) => Math.max(0, n - 1));
              } else if (e.key === "Enter" && flat.length) {
                e.preventDefault();
                go(at);
              }
            }}
          >
            <label className="flex h-8 items-center gap-2 rounded-[8px] border border-[color:var(--wds-input)] bg-[var(--wds-input-background)] px-3">
              <Search aria-hidden className="size-4 shrink-0 text-[color:var(--wds-muted-foreground)]" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search or jump to…"
                aria-label="Search or jump to"
                className="h-full min-w-0 flex-1 bg-transparent text-sm leading-5 text-[color:var(--wds-foreground)] outline-none placeholder:text-[color:var(--wds-muted-foreground)]"
              />
            </label>
            <div ref={listRef} className="flex flex-col pb-0.5">
              {groups.map((g) => (
                <div key={g.label} className="flex flex-col">
                  <span className="px-2 pb-1 pt-3 text-xs font-medium leading-4 text-[color:var(--wds-muted-foreground)]">
                    {g.label}
                  </span>
                  {g.items.map((item) => {
                    index += 1;
                    const i = index;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        data-index={i}
                        data-grade-goto={item.target}
                        onMouseEnter={() => setAt(i)}
                        onClick={() => setOpen(false)}
                        className={cx(
                          "flex h-8 cursor-pointer items-center gap-3 rounded-[8px] px-2 text-left text-sm leading-5 text-[color:var(--wds-foreground)]",
                          i === at ? "bg-[var(--wds-accent)]" : "",
                          FOCUS,
                        )}
                      >
                        <Icon aria-hidden className="size-4 shrink-0 text-[color:var(--wds-muted-foreground)]" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
              {groups.length ? null : (
                <span className="px-2 py-3 text-sm leading-5 text-[color:var(--wds-muted-foreground)]">No results</span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** The avatar's account menu (Profile drop down). */
function AccountMenu({ name, business }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account menu" className={cx("ml-1 cursor-pointer rounded-full", FOCUS)}>
          <InitialsAvatar text={initials(name)} ring />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="p-1.5" style={{ width: "20rem" }}>
        <DropdownMenuLabel className="px-3 py-3 font-normal">
          <span className="flex items-center gap-3">
            <InitialsAvatar text={initials(name)} className="size-10" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">{name}</span>
              <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{business}</span>
            </span>
          </span>
        </DropdownMenuLabel>
        <div role="separator" className="my-1.5 h-px bg-[var(--wds-border)]" />
        <DropdownMenuItem className="h-10 gap-3 px-3" data-grade-goto={PROFILE}>
          <ProfileIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <div role="separator" className="my-1.5 h-px bg-[var(--wds-border)]" />
        <DropdownMenuItem className="h-10 gap-3 px-3" data-grade-goto={LOG_IN}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The header's Notifications button: opens the page, with the unread
 *  count in a red badge over the bell (the live build's, see the header). */
function BellButton({ size = "size-5" }) {
  const [, unread] = PortalV2.useNotifications();
  return (
    <IconButton
      label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      data-grade-goto={NOTIFICATIONS}
      className="relative text-[color:var(--wds-muted-foreground)]"
    >
      <Bell className={size} />
      {unread ? (
        <span
          aria-hidden
          className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--wds-destructive)] px-1 text-[10px] font-semibold leading-none text-[color:var(--wds-destructive-foreground)]"
        >
          {unread}
        </span>
      ) : null}
    </IconButton>
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
  business = PortalV2.business,
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
  const sys = StagingSwitches.useState();
  React.useEffect(() => {
    if (sys !== "offline") return;
    WebDsV2.toast({
      id: "offline",
      type: "error",
      title: "Couldn’t connect. Retrying...",
      body: "Your balances will update when we’re back.",
      action: "Retry now",
      duration: 0,
      onAction: backToLive,
    });
  }, [sys]);

  const [gold] = Persona.useBalance("gold");
  const [silver] = Persona.useBalance("silver");
  const [fiat] = Persona.useBalance("fiat");
  const rows = Persona.useActivity();
  const describe = {
    Wallets: `${Persona.fmtMoney(gold + silver + fiat)} total`,
    Activity: `${sinceYesterday(rows)} since yesterday`,
    "Business profile": business,
  };
  /* ?name=long: the Long name slide's signed-in person (StagingSwitches). */
  const person = StagingSwitches.useName() === "long" ? "Alexandra Fitzwilliam-Montgomery" : PortalV2.PROFILE.fullName;
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
      ) : (
        <aside className="hidden h-full w-16 shrink-0 md:block">
          <SidebarRail active={active} business={business} onTrigger={() => setCollapsed(false)} />
        </aside>
      )}

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
            <SearchPalette size="size-4" />
            <BellButton size="size-4" />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <IconButton
                label="Menu"
                className="text-[color:var(--wds-sidebar-foreground)]"
                onClick={() => setMenuOpen(true)}
              >
                <PanelLeft className="size-4" />
              </IconButton>
              {/* Closes on navigation: see the effect by menuOpen. The DS
                  sheet's own close X (its last child) is hidden: it sat on
                  top of the sidebar's trigger (12 Oct bug list), which
                  closes the sheet here anyway. */}
              <SheetContent side="left" className="w-[264px] max-w-[85vw] gap-0 border-0 p-0 [&>button:last-child]:hidden">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SidebarBody
                  active={active}
                  business={business}
                  describe={describe}
                  person={person}
                  onTrigger={() => setMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* THE HEADER, md and up: Web DS Header, Surface=raised. */}
        <div className="sticky top-0 z-30 hidden shrink-0 bg-[var(--wds-background)] px-2 py-1.5 md:block">
          <header className="flex h-14 items-center gap-3 rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-card)] px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Crumbs crumbs={trail} />
              {slotsIn("leading")}
            </div>
            <div className="flex items-center gap-0.5">
              {slotsIn("trailing")}
              <SearchPalette />
              <BellButton />
              <AccountMenu name={person} business={business} />
            </div>
          </header>
        </div>

        <SlotContext.Provider value={registerSlot}>
          {sys === "error" ? (
            <AppChromeV2.Main>
              <WebDsV2.EmptyState
                title="Something went wrong"
                body="We couldn’t load this page. Try again, or contact support if it keeps happening."
                actions={
                  <>
                    <WebDsV2.Button size="lg" onClick={backToLive}>
                      Try again
                    </WebDsV2.Button>
                    <WebDsV2.Button size="lg" variant="outline">
                      Contact support
                    </WebDsV2.Button>
                  </>
                }
              />
            </AppChromeV2.Main>
          ) : (
            children
          )}
        </SlotContext.Provider>
      </div>
      <WebDsV2.ToastHost />
    </div>
  );
}

/** Try again / Retry now: this page again, on ?state=live. */
function backToLive() {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("state", "live");
    window.location.assign(u.toString());
  } catch {
    /* a frame that cannot navigate: nothing to retry */
  }
}

AppChromeV2.backToLive = backToLive;

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
