"use client";

// Promoted from Studio screen "RM — Reply Templates"
// (design dmtaq1rm9eok2, version 1791409993750). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: e0134bb9e8fa

// RM — Reply Templates. Reply templates AND the auto-reply rules that use
// them, lifted out of the Review Manager onto their own page.
//
// 27 Aug — SPLIT OUT OF THE INBOX (Ali). These were two sub-views behind
// header buttons on the inbox, which made that screen carry three unrelated
// pages. They live together HERE rather than as two pages because they are
// intertwined: a rule cannot fire without a template, so the library and the
// rules that consume it read as one job. Templates first, rules second,
// which is also the order you have to do them in.
//
// 27 Aug — V2 CONTRACT. Templates gained a rating scope and rules gained
// delayMinutes / enabled / scope plus a run history. The two changes are one
// change: once a template says which ratings it is written for, the rule
// editor can tell you that the rule you are building has nothing to send
// with, which is the failure the old shape could not express.
//
// TEMPLATE STATE IS PER-SCREEN. Both this page and the inbox seed from the
// same DEFAULT_TEMPLATES, so every screen shows the same list, but editing a
// template here does NOT change the pickers in the inbox drawer — they are
// separate useState trees in separate screens. Ali's call (27 Aug): fine for
// the prototype, and the alternative is threading templates through the
// ProposalDataProvider contract. Revisit if a demo needs an edit to survive
// a screen change.
//
// Helpers below are copied verbatim from the inbox screen, not re-derived.

import { useEffect, useRef, useState } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import { Card } from "@brightlocal/ui-components/card";
import { TypographyHeading } from "@brightlocal/ui-components/typography-heading";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@brightlocal/ui-components/sheet";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
} from "@brightlocal/ui-components/data-table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@brightlocal/ui-components/dropdown-menu";
import { Separator } from "@brightlocal/ui-components/separator";
import { Button } from "@brightlocal/ui-components/button";
import { Rating } from "@brightlocal/ui-components/rating";
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Badge } from "@brightlocal/ui-components/badge";
import { Input } from "@brightlocal/ui-components/input";
import { Textarea } from "@brightlocal/ui-components/textarea";
import { Switch } from "@brightlocal/ui-components/switch";
import { AlertWarning } from "@brightlocal/ui-components/alert";
// 7 Oct: DS EmptyState for the two lists below, which rendered nothing at all
// when empty. Subpath import, matching every other DS import in this file.
import { EmptyState } from "@brightlocal/ui-components/empty-state";
import { Field, FieldLabel, FieldDescription } from "@brightlocal/ui-components/field";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@brightlocal/ui-components/select";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@brightlocal/ui-components/collapsible";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@brightlocal/ui-components/drawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@brightlocal/ui-components/alert-dialog";
import {
  Menu,
  Trash2,
  X,
  Zap,
  // 7 Oct: the templates empty state's chip glyph.
  MessageSquareText,
  Clock,
  History,
  ChevronDown,
  MapPin,
  Building,
  ThumbsUp,
  ThumbsDown,
  Globe,
  GoogleOriginal,
  FacebookOriginal,
  YelpOriginal,
  MoreHorizontal,
  Pencil,
  Layers,
} from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  useProposalData,
  formatDate,
  formatDateTime
} from "@brightlocal/proposal";
import { SideSheetHeader } from "@brightlocal/side-sheet-header";
import { usePersona } from "@/lib/demo";

/* ------------------------------ interim mark ------------------------------ */

// STAND-IN. Redrawn approximation — replace with the official asset in
// @brightlocal/icons. Brand hex is deliberately literal: brand marks sit
// outside the theme, same as the other -Original icons.
function TripAdvisorMark({ size = 16, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      data-ds-standin="brand-mark"
    >
      <path d="M12 4.4c2.2 0 4.1 1 5.3 2.5H6.7C7.9 5.4 9.8 4.4 12 4.4Z" fill="#00AF87" />
      <circle cx="7.2" cy="13.1" r="5.1" fill="#fff" stroke="#00AF87" strokeWidth="1.8" />
      <circle cx="16.8" cy="13.1" r="5.1" fill="#fff" stroke="#00AF87" strokeWidth="1.8" />
      <circle cx="7.2" cy="13.1" r="2.1" fill="#000" />
      <circle cx="16.8" cy="13.1" r="2.1" fill="#000" />
    </svg>
  );
}

/* ---------------------------------- data ---------------------------------- */

// canReply is a property of the SOURCE, not of a review. Google and
// Facebook are the ONLY sources a reply can be posted to from here (Ali,
// 27 Aug); TripAdvisor and Yelp are read-only, so the inbox can show those
// reviews but cannot answer them. Kept on this map rather than as a
// `source === "..."` test at each call site, so the next network is a
// one-line change here.
//
// canAutoReply is NARROWER than canReply: a person can reply to Facebook by
// hand, but only Google accepts an unattended rule-driven reply. Anything
// that sends without a human in the loop must check canAutoReply.
const SOURCES = {
  google: { name: "Google", Icon: GoogleOriginal, hasMark: true, canReply: true, canAutoReply: true, ratingKind: "star" },
  tripadvisor: {
    name: "TripAdvisor",
    Icon: TripAdvisorMark,
    hasMark: true,
    isStandIn: true,
    canReply: false,
    canAutoReply: false,
    ratingKind: "star",
  },
  facebook: { name: "Facebook", Icon: FacebookOriginal, hasMark: true, canReply: true, canAutoReply: false, ratingKind: "recommendation" },
  yelp: { name: "Yelp", Icon: YelpOriginal, hasMark: true, canReply: false, canAutoReply: false, ratingKind: "star" },
};
const BUCKETS = [
  { id: "5", label: "5 star", kind: "star" },
  { id: "4", label: "4 star", kind: "star" },
  { id: "3", label: "3 star", kind: "star" },
  { id: "2", label: "2 star", kind: "star" },
  { id: "1", label: "1 star", kind: "star" },
  { id: "up", label: "Recommended", kind: "up" },
  { id: "down", label: "Not recommended", kind: "down" },
];

// DERIVED FROM SOURCES, and declared HERE rather than beside the code that
// uses them. These are module-scope `const`s, so anything evaluating them
// above their declaration hits the temporal dead zone and the whole screen
// dies with "Cannot access 'AUTO_REPLY_SOURCES' before initialization" —
// which is what happened when the rating-kind filter was written next to
// RatingPicker, 400 lines above the definition (27 Aug). Everything derived
// from SOURCES/BUCKETS lives with SOURCES/BUCKETS.
const AUTO_REPLY_SOURCES = Object.keys(SOURCES).filter((id) => SOURCES[id].canAutoReply);
const AUTO_REPLY_SCOPE = AUTO_REPLY_SOURCES.map((id) => SOURCES[id].name).join(" and ");

const AUTO_REPLY_RATING_KINDS = new Set(
  AUTO_REPLY_SOURCES.map((id) => SOURCES[id].ratingKind),
);
const AUTO_REPLY_BUCKETS = BUCKETS.filter((b) =>
  AUTO_REPLY_RATING_KINDS.has(b.kind === "star" ? "star" : "recommendation"),
);

// `ratings` uses the SAME ids as BUCKETS so a template's scope and a rule's
// filter are directly comparable — that comparison is the whole point, and a
// second vocabulary would need a mapping table nobody would maintain.
// An EMPTY array means "any rating", not "no ratings": an unticked picker is
// the least-specified state, and the least-specified template is the one that
// fits everything. Same convention the rule editor already used for ratings.
const DEFAULT_TEMPLATES = [
  {
    id: "t1",
    name: "Thank you, happy visitor",
    body: "Thanks so much for the lovely review, {{firstname}}! We're really glad you enjoyed your visit to {{businessname}} and we'll pass your comments on to the team. See you again soon.",
    ratings: ["5", "4", "up"],
  },
  {
    id: "t2",
    name: "Sorry to hear, follow up",
    body: "Thanks for taking the time to share this, {{firstname}}. We're sorry parts of your visit fell short of what we'd want at {{businessname}}. Please get in touch so we can look into it and put things right.",
    ratings: ["1", "2", "down"],
  },
];

// scope is new in v2. A rule written once for the whole account beats the
// same rule copied into forty locations, but the two read very differently
// when one of them fires, so the choice has to be visible on the saved row
// and not only in the editor. One map, so the picker, the row badge and the
// explanation can never drift apart.
const SCOPES = {
  location: {
    label: "This location only",
    short: "This location",
    Icon: MapPin,
    help: "Only reviews for the location you are looking at now.",
  },
  account: {
    label: "All locations in the account",
    short: "All locations",
    Icon: Building,
    help: "Every location in the account, including ones added later.",
  },
};

// The legacy fixed steps, kept as PRESETS rather than as the only choices.
// The v2 brief asks for a free-form delay in minutes; a rule migrated off the
// old 1/8/24/48-hour dropdown should still land on a value the person who set
// it recognises, which is what these chips are for.
const DELAY_PRESETS = [
  { mins: 60, label: "1 hour" },
  { mins: 480, label: "8 hours" },
  { mins: 1440, label: "24 hours" },
  { mins: 2880, label: "48 hours" },
];

// Runs are timestamped against a FIXED clock, not Date.now(). A screenshot of
// this screen taken in three months should still read "2 hours ago" — a demo
// whose activity list has quietly drifted to "5 months ago" says the rule is
// dead, which is the opposite of the story.
const RUNS_NOW = new Date("2026-08-27T14:00:00Z");

// Every run is on Google because Google is the only canAutoReply source. If
// another network ever flips, seed rows here to match rather than inventing a
// source the rules could not have used.
//
// run3 FAILED on purpose. A companion screen is building the reply-failure
// states, so a failed auto-reply has to be representable here or the two
// screens disagree about whether sending can go wrong.
const RULE_RUNS = [
  { id: "run1", ruleId: "rule1", reviewer: "Priya Shah", source: "google", at: "2026-08-27T11:20:00Z", templateId: "t1", outcome: "sent" },
  { id: "run2", ruleId: "rule1", reviewer: "Tom Whelan", source: "google", at: "2026-08-27T07:05:00Z", templateId: "t1", outcome: "sent" },
  { id: "run3", ruleId: "rule1", reviewer: "Grace Okoro", source: "google", at: "2026-08-26T16:40:00Z", templateId: "t1", outcome: "failed" },
  { id: "run4", ruleId: "rule1", reviewer: "Daniel Rees", source: "google", at: "2026-08-26T09:15:00Z", templateId: "t1", outcome: "sent" },
  { id: "run5", ruleId: "rule1", reviewer: "Maja Nowak", source: "google", at: "2026-08-25T18:30:00Z", templateId: "t1", outcome: "sent" },
  { id: "run6", ruleId: "rule1", reviewer: "Callum Frost", source: "google", at: "2026-08-24T12:00:00Z", templateId: "t1", outcome: "sent" },
];

/* --------------------------------- helpers -------------------------------- */

function useBusinessName() {
  const data = useProposalData();
  return data?.location?.name ?? "this location";
}
// ONE line to change if the panel width needs tuning. Deliberately the same
// name and the same value as the constant in RM — Review Manager, so the two
// drawers stay the same surface; they are separate screens, so it is two
// edits, not one. Lifting it into the registry (a --gds-drawer-width the
// shell publishes, like --gds-content-max-width) is the real fix, and is
// blocked on the Drawer portalling to document.body, outside the shell's
// tree, where container-level vars cannot reach it.
//
//   floor 24rem  never narrower than the DS default of 384
//   tablet 65vw  no sidebar below lg, so the panel can take more of the row
//   desktop 50vw the sidebar is back
//   cap 40rem    line length past 640 stops being comfortable to read
const DRAWER_WIDTH =
  "data-[vaul-drawer-direction=right]:sm:w-[clamp(24rem,65vw,40rem)] data-[vaul-drawer-direction=right]:lg:w-[clamp(24rem,50vw,40rem)] data-[vaul-drawer-direction=right]:sm:max-w-[40rem]";

// The placeholders resolveVars understands. ONE list, so the insert buttons
// can never offer a token the resolver does not know about.
const TOKENS = ["{{firstname}}", "{{businessname}}"];

function resolveVars(body, review, business) {
  return body
    .replaceAll("{{firstname}}", review ? review.name : "{{firstname}}")
    .replaceAll("{{businessname}}", business);
}

const ratingLabel = (id) => BUCKETS.find((b) => b.id === id)?.label ?? id;

// The delay is stored as MINUTES and read back as English. Storing minutes and
// formatting on the way out is what lets the field be free-form: 45 has to be
// as sayable as 60, and the old dropdown could only ever say four things.
function humaniseDelay(mins) {
  const n = Math.max(0, Math.round(Number(mins) || 0));
  if (n === 0) return "Replies immediately";
  const say = (v, word) => `${v} ${word}${v === 1 ? "" : "s"}`;
  let value;
  // Whole days first, so 2880 reads as "2 days" rather than "48 hours" —
  // the number people typed into the old dropdown is not the number they
  // think in.
  if (n % 1440 === 0) value = say(n / 1440, "day");
  else if (n < 60) value = say(n, "minute");
  else {
    const hours = Math.floor(n / 60);
    const rest = n % 60;
    value = rest === 0 ? say(hours, "hour") : `${say(hours, "hour")} ${say(rest, "minute")}`;
  }
  return `Replies ${value} after the review arrives`;
}

// ABSOLUTE, NOT RELATIVE (Ali, 2 Sep: "not sure things such as '5 days ago'
// are relevant — let's just display the actual date everywhere, formatted as
// per the 'last updated' string").
//
// This used to render "2 hours ago" off a frozen RUNS_NOW, which kept the
// demo stable but still asked the reader to do arithmetic to place two runs
// against each other. `formatDateTime` is the page header's own function —
// "August 13, 2026 at 10:20 AM" — so a run in this log and a date in the
// header now read identically, which is the whole point of having one.
function runStamp(iso) {
  return formatDateTime(iso) ?? formatDate(iso) ?? iso;
}

// Does this template have anything to say about the reviews this rule catches?
// Both empty cases are deliberately permissive: a template with no ratings is a
// catch-all, and a rule with no ratings fires on everything, so neither can be
// the thing that makes the pair a mismatch. Only two SPECIFIC sets that share
// nothing count as a mismatch, which is the case worth warning about.
function templateSuitsRatings(tpl, ratings) {
  const scope = tpl.ratings ?? [];
  if (scope.length === 0 || ratings.length === 0) return true;
  return ratings.some((id) => scope.includes(id));
}

// iconOnly: size-9 p-0 makes a 1:1 box; the base rounded-full then reads as a
// circle. OVERRIDE — Button has no icon size. See header note.
// iconOnly: size-9 p-0 makes a 1:1 box; the base rounded-full then reads as a
// circle. OVERRIDE — Button has no icon size. See header note.
function SourceMark({ source }) {
  const Icon = source.Icon;
  return (
    <Icon size={16} className={`size-4 shrink-0 ${source.hasMark ? "" : "text-muted-foreground"}`} />
  );
}
function RatingValue({ rating, hook }) {
  if (rating === "up") return <ThumbsUp className="text-muted-foreground size-4" />;
  if (rating === "down") return <ThumbsDown className="text-muted-foreground size-4" />;
  return <Rating value={rating} dataHook={hook} />;
}

// A template's rating scope, rendered the same way wherever it appears: on the
// library row and inside the rule editor's picker. Written once because the
// two have to agree — the picker's job is to let you check the row's claim
// without opening the drawer.
function RatingScopeBadges({ ratings, idPrefix }) {
  const scope = ratings ?? [];
  if (scope.length === 0) {
    return (
      <Badge dataHook={`${idPrefix}-any`} variant="outline">
        Any rating
      </Badge>
    );
  }
  return (
    <>
      {scope.map((id) => (
        // outline, not secondary. secondary fills the chip with
        // rgb(230,237,232), which is almost exactly the lightness of the
        // bg-primary/10 a SELECTED template option is painted with, so the
        // badges washed out on the one card you are looking at (Ali, 27
        // Aug: "badges here are a bit grey against the surface"). An
        // outline chip is defined by its border, so it holds up on a white
        // row and a tinted one alike. It also matches the "Any rating"
        // badge above, which was already outline, so the component stops
        // using two chip styles for the same idea.
        <Badge key={id} dataHook={`${idPrefix}-${id}`} variant="outline">
          {ratingLabel(id)}
        </Badge>
      ))}
    </>
  );
}

// Checkbox row for the rule editor's inline multi-selects. NOT a menu, so
// not Command: these are form controls on the page. The <label> gives
// click-anywhere toggling and ties the text to the control.
function CheckRow({ checked, onCheckedChange, dataHook, children }) {
  return (
    <label className="hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm">
      <Checkbox dataHook={dataHook} checked={checked} onCheckedChange={onCheckedChange} />
      {children}
    </label>
  );
}

// The ratings multi-select, shared by the template drawer and the rule editor.
// Both pickers answer the same question against the same BUCKETS ids, and the
// "Any rating" row that clears the selection is the half people get wrong when
// it is written twice — it is a CLEAR, not a tick you can combine with the
// others.
// A source produces ONE shape of rating: Google, Yelp and TripAdvisor give
// stars, Facebook gives a recommendation. So the buckets an auto-reply rule
// can sensibly match are only the ones its eligible sources can actually
// emit, and with auto-reply Google-only that means stars (Ali, 27 Aug:
// "auto-reply is only google, so the template that includes Not recommended
// is wrong"). Derived from canAutoReply + ratingKind, so the day Facebook
// flips, Recommended and Not recommended appear here on their own.
//
// TEMPLATE scope is deliberately NOT filtered this way: a template scoped to
// "Not recommended" is perfectly valid, because Facebook can still be replied
// to BY HAND from the inbox. Only the RULE editor is narrowed.
function RatingPicker({ selected, onChange, idPrefix, buckets = BUCKETS }) {
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="border-input rounded-lg border p-1">
      <CheckRow
        dataHook={`${idPrefix}-any`}
        checked={selected.length === 0}
        onCheckedChange={() => onChange([])}
      >
        Any rating
      </CheckRow>
      {buckets.map((b) => (
        <CheckRow
          key={b.id}
          dataHook={`${idPrefix}-${b.id}`}
          checked={selected.includes(b.id)}
          onCheckedChange={() => toggle(b.id)}
        >
          <RatingValue rating={b.kind === "star" ? Number(b.id) : b.id} hook={`${idPrefix}-${b.id}-stars`} />
          <span className="flex-1">{b.label}</span>
        </CheckRow>
      ))}
    </div>
  );
}

// Facet menus are Popover + Command — the DS's own "searchable action
// menu", which is what these are. Command owns the rhythm (px-2 py-3
// items, its own list insets), the keyboard model (arrow keys,
// type-ahead, Enter) and the filtering, so the hand-rolled MenuRow /
// MenuLabel / local query state are all gone.
//
// PopoverContent defaults to p-4. That is sized for PROSE popovers, and
// around Command's own insets it reads as far too much padding. p-0 hands
// spacing entirely to Command, which is what every DS example does. Both
// are standard utilities, so tailwind-merge genuinely displaces p-4 here.
// The five corrections Command needs to sit inside another surface, in ONE
// place now that both the desktop popovers and the mobile sheet mount it.
// Command's root is `rounded-lg border shadow-md bg-popover` — it assumes it
// IS the surface — and CommandGroup ships px-2 py-1, 8px at the sides but
// 4px top and bottom, which sits an item's highlight unevenly in its panel.
// p-1 makes that gutter uniform, which is what upstream shadcn does.

// SectionHeader, not the inbox's SubHeader: SubHeader always draws a back
// button, which belongs to a sub-view. These are sections of a real page,
// so the way back is the breadcrumb trail in PageHeader.
function SectionHeader({ title, subtitle, actions }) {
  return (
    // No mb here. Card is a flex column with its OWN gap, so a margin on a
    // child ADDS to that gap rather than being it — see the gap-5 note on
    // the Cards below.
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-1.5">{actions}</div>
    </div>
  );
}

/* -------------------------------- sections -------------------------------- */

// 7 OCT — TWO TABLES (Figma "New Platform - WIP" › 07.10.2026 - Review
// Manager › Reply templates): "Two tables on one page: your templates, and the
// auto-replies that send them. Same pattern as Review Manager. Editing opens a
// side sheet. A template's ratings decide when it's suggested while replying."
// Each section is the DS data card the Review Manager uses: title and
// description with the action on the right, then a DataTable edge to edge,
// header band and all. The card lists, the inline Edit/Delete buttons and the
// Drawer editors they opened are gone; row actions live in a "…" menu.

// Same insets as the Review Manager's table: text 24px in from the card edge,
// 52px rows.
const TABLE_CLASS =
  "rounded-none border-0 [&_thead_th:first-child]:pl-6 [&_thead_th:last-child]:pr-6 [&_tbody_td:first-child]:pl-6 [&_tbody_td:last-child]:pr-6 [&_tbody_td]:h-13 [&_tbody_tr:last-child]:border-0";

function DataCard({ title, description, action, dataHook, children }) {
  return (
    <Card dataHook={dataHook} density="condensed" className="max-w-none gap-0 overflow-hidden p-0">
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <TypographyHeading level={2} variant="subsection" dataHook={`${dataHook}-title`}>
            {title}
          </TypographyHeading>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </Card>
  );
}

// The empty state INSIDE the table, under its header row, as Figma draws it:
// a title, one line of help, and the action when there is one to take.
function TableEmpty({ title, description, action, dataHook }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center" data-hook={dataHook}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function RowMenu({ dataHook, label, children }) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" iconOnly dataHook={dataHook} aria-label={label}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">{children}</DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// The sheet both editors use: DS Sheet at its default 384, a title (and an
// optional description) with the DS close, a scrolling body, and the footer
// buttons on the right. `left` puts a quiet action at the far left of the
// footer (Remove, on an existing auto-reply).
function EditorSheet({ open, onOpenChange, title, description, dataHook, left, footer, children }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        dataHook={dataHook}
        closeLabel="Close"
        className="gap-0 p-0"
        // No autofocus: Radix focused the Name field on open and the browser
        // selected its text, which Figma's sheets never show.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle dataHook={`${dataHook}-title`}>{title}</SheetTitle>
          {description ? (
            <SheetDescription dataHook={`${dataHook}-description`}>{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{title}</SheetDescription>
          )}
        </SheetHeader>
        <div
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6"
          style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
        >
          {children}
        </div>
        <div className="flex shrink-0 items-center gap-2 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {left}
          <div className="grow" />
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// A checkbox row in a sheet's list: the box, then whatever describes it.
function SheetCheck({ checked, onCheckedChange, dataHook, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1 text-sm">
      <Checkbox dataHook={dataHook} checked={checked} onCheckedChange={onCheckedChange} />
      {children}
    </label>
  );
}

const STAR_BUCKETS = BUCKETS.filter((b) => b.kind === "star");
const RECOMMEND_BUCKETS = BUCKETS.filter((b) => b.kind !== "star");

// The Insert chips name what they put in, not the token itself (Figma: "First
// name", "Business name"). The token still lands in the text.
const TOKEN_LABELS = { "{{firstname}}": "First name", "{{businessname}}": "Business name" };

// Anything in double braces that is not one of TOKENS, or a brace pair left
// half-typed. Checked on save, which is when Figma shows the error.
function badPlaceholder(body) {
  const found = body.match(/\{\{?[^{}\s]*\}?\}?/g) || [];
  return found.find((t) => t.includes("{") && !TOKENS.includes(t)) ?? null;
}

// "5 star on Google", "5 and 4 star on Google". Rules are star-only (auto-reply
// is Google-only), and the location scope is the line under it in the table.
function ruleName(rule) {
  const ids = [...rule.ratings].sort((a, b) => Number(b) - Number(a));
  const rate =
    ids.length === 0
      ? "Any rating"
      : ids.length === 1
        ? `${ids[0]} star`
        : `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]} star`;
  const ids2 = rule.sources.length === 0 ? AUTO_REPLY_SOURCES : rule.sources;
  return `${rate} on ${ids2.map((id) => SOURCES[id].name).join(" and ")}`;
}

// Kept for anything that still names a rule in prose.
function describeRule(rule) {
  return ruleName(rule);
}

// "1 hour after", "Immediately": the Sends column. The sheet's select spells
// it out in full ("1 hour after the review arrives").
function sendsShort(mins) {
  const preset = DELAY_PRESETS.find((p) => p.mins === mins);
  if (mins === 0) return "Immediately";
  return `${preset ? preset.label : humaniseDelay(mins).replace(/^Replies | after the review arrives$/g, "")} after`;
}

function TemplatesView({ templates, setTemplates, rules, stateRequest }) {
  // READ IT HERE, not in App() (6 Sep): AppLayoutShell mounts its own
  // ProposalDataProvider, so only components inside it see the real location.
  const business = useBusinessName();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [ratings, setRatings] = useState([]);
  const [bodyError, setBodyError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Insert at the CARET, then put the caret back after React has written the
  // new value (an effect on `body`; a rAF lost the race, 27 Aug).
  const pendingCaret = useRef(null);
  const insertToken = (token) => {
    const el = document.getElementById("tpl-body");
    setBodyError(null);
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    pendingCaret.current = start + token.length;
  };
  useEffect(() => {
    if (pendingCaret.current === null) return;
    const at = pendingCaret.current;
    pendingCaret.current = null;
    const el = document.getElementById("tpl-body");
    if (!el) return;
    el.focus();
    el.setSelectionRange(at, at);
  }, [body]);

  const startEdit = (t) => {
    setEditing(t ? t.id : "new");
    setName(t ? t.name : "");
    setBody(t ? t.body : "");
    setRatings(t ? (t.ratings ?? []) : []);
    setBodyError(null);
  };
  const save = () => {
    const bad = badPlaceholder(body);
    if (bad) {
      setBodyError(`${bad} isn't a placeholder. Use Insert to add First name or Business name.`);
      return;
    }
    if (editing === "new") setTemplates((ts) => [...ts, { id: `t${Date.now()}`, name, body, ratings }]);
    else setTemplates((ts) => ts.map((t) => (t.id === editing ? { ...t, name, body, ratings } : t)));
    setEditing(null);
  };

  // States drawer requests (see App). Each opens what Figma draws.
  useEffect(() => {
    if (!stateRequest) return;
    const t1 = DEFAULT_TEMPLATES[0];
    const t2 = DEFAULT_TEMPLATES[1];
    if (stateRequest.id === "edit-t1") startEdit(t1);
    if (stateRequest.id === "edit-t2") startEdit(t2);
    if (stateRequest.id === "new-template") startEdit(null);
    if (stateRequest.id === "placeholder-error") {
      startEdit(t1);
      const broken = t1.body.replace("{{firstname}}", "{{firstname}");
      setTimeout(() => {
        setBody(broken);
        setBodyError(`${badPlaceholder(broken)} isn't a placeholder. Use Insert to add First name or Business name.`);
      }, 50);
    }
    if (stateRequest.id === "cant-delete") setPendingDelete(t1);
  }, [stateRequest]);

  const rulesUsing = (tpl) => (rules || []).filter((r) => r.templateId === tpl.id);
  const blockers = pendingDelete ? rulesUsing(pendingDelete) : [];

  const toggle = (id) => setRatings((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));

  const columns = [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Template" dataHook="th-template" />,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="text-sm">{row.original.name}</span>
          <span className="text-muted-foreground block max-w-[27rem] truncate text-sm">
            {row.original.body}
          </span>
        </div>
      ),
    },
    {
      id: "ratings",
      header: "Ratings",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5">
          <RatingScopeBadges ratings={row.original.ratings} idPrefix={`tpl-${row.original.id}-scope`} />
        </div>
      ),
    },
    {
      id: "autoreply",
      header: "Auto-reply",
      enableSorting: false,
      cell: ({ row }) => {
        const n = rulesUsing(row.original).length;
        return <span className="text-sm">{n === 0 ? "None" : `${n} ${n === 1 ? "rule" : "rules"}`}</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <RowMenu dataHook={`tpl-${row.original.id}-menu`} label="Template actions">
          <DropdownMenuItem onSelect={() => startEdit(row.original)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPendingDelete(row.original)}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </RowMenu>
      ),
    },
  ];
  const table = useDataTable({ columns, data: templates, getRowId: (r) => r.id });

  const newButton = (hook) => (
    <Button variant="outline" size="sm" dataHook={hook} onClick={() => startEdit(null)}>
      New template
    </Button>
  );

  return (
    <DataCard
      dataHook="templates-view"
      title="Templates"
      description="The reviewer's first name and your business name are filled in for you."
      action={newButton("new-template")}
    >
      <DataTable
        table={table}
        dataHook="templates-table"
        className={TABLE_CLASS}
        noResultsMessage={
          <TableEmpty
            dataHook="templates-empty"
            title="No templates yet"
            description={'Save a reply you use often and it appears under "Use template" when you answer a review.'}
            action={newButton("templates-empty-new")}
          />
        }
      />

      <EditorSheet
        open={editing !== null}
        onOpenChange={(o) => (o ? null : setEditing(null))}
        dataHook="template-sheet"
        title={editing === "new" ? "New template" : "Edit template"}
        footer={
          <>
            <Button variant="outline" dataHook="cancel-template" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              dataHook="save-template"
              onClick={save}
              disabled={!name.trim() || !body.trim()}
            >
              {editing === "new" ? "Create template" : "Save template"}
            </Button>
          </>
        }
      >
        <Field dataHook="tpl-name-field">
          <FieldLabel htmlFor="tpl-name" dataHook="tpl-name-label">
            Name
          </FieldLabel>
          <Input
            id="tpl-name"
            dataHook="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thank you, happy visitor"
          />
        </Field>
        <Field dataHook="tpl-body-field">
          <FieldLabel htmlFor="tpl-body" dataHook="tpl-body-label">
            Reply
          </FieldLabel>
          <Textarea
            id="tpl-body"
            dataHook="tpl-body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setBodyError(null);
            }}
            rows={5}
            placeholder="Write the reply..."
            aria-invalid={bodyError ? true : undefined}
            className={bodyError ? "border-destructive resize-y text-sm" : "resize-y text-sm"}
          />
          {bodyError ? (
            <p className="text-destructive text-sm" data-hook="tpl-body-error">
              {bodyError}
            </p>
          ) : (
            <FieldDescription dataHook="tpl-body-help">
              Placeholders are replaced with the reviewer's first name and your business name when
              the reply is sent.
            </FieldDescription>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Insert</span>
            {TOKENS.map((token) => (
              <Button
                key={token}
                variant="outline"
                size="sm"
                dataHook={`insert-${token.replace(/[^a-z]/gi, "")}`}
                onClick={() => insertToken(token)}
              >
                {TOKEN_LABELS[token] ?? token}
              </Button>
            ))}
          </div>
        </Field>

        <Separator dataHook="tpl-sheet-rule" />

        {/* Template ratings: when this template is suggested while replying.
            Any rating clears the rest (an empty list is a catch-all). The
            Facebook pair sits under its own label: only Facebook rates by
            recommendation. */}
        <div className="flex flex-col gap-1">
          <p className="mb-1 text-sm font-medium">Template ratings</p>
          <SheetCheck dataHook="tpl-rating-any" checked={ratings.length === 0} onCheckedChange={() => setRatings([])}>
            Any rating
          </SheetCheck>
          {STAR_BUCKETS.map((b) => (
            <SheetCheck key={b.id} dataHook={`tpl-rating-${b.id}`} checked={ratings.includes(b.id)} onCheckedChange={() => toggle(b.id)}>
              <Rating value={Number(b.id)} dataHook={`tpl-rating-${b.id}-stars`} />
              <span>{b.label}</span>
            </SheetCheck>
          ))}
          <p className="text-muted-foreground mt-1 text-sm">Facebook</p>
          {RECOMMEND_BUCKETS.map((b) => (
            <SheetCheck key={b.id} dataHook={`tpl-rating-${b.id}`} checked={ratings.includes(b.id)} onCheckedChange={() => toggle(b.id)}>
              {b.kind === "up" ? (
                <ThumbsUp className="text-muted-foreground size-4" />
              ) : (
                <ThumbsDown className="text-muted-foreground size-4" />
              )}
              <span>{b.label}</span>
            </SheetCheck>
          ))}
        </div>
      </EditorSheet>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => (o ? null : setPendingDelete(null))}
        dataHook="delete-template-dialog"
      >
        <AlertDialogContent>
          {/* An in-use template CANNOT be deleted (Ali, 27 Aug): a rule left
              pointing at nothing looks live and can never send. Figma "Can't
              delete a template in use" says which auto-reply holds it. */}
          {blockers.length > 0 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle dataHook="delete-template-title">
                  Can't delete "{pendingDelete ? pendingDelete.name : ""}"
                </AlertDialogTitle>
                <AlertDialogDescription dataHook="delete-template-desc">
                  {blockers.length === 1
                    ? `The auto-reply "${ruleName(blockers[0])}" sends this template. Change or remove that auto-reply first.`
                    : `${blockers.length} auto-replies send this template. Change or remove them first.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle dataHook="delete-template-title">
                  Delete "{pendingDelete ? pendingDelete.name : ""}"?
                </AlertDialogTitle>
                <AlertDialogDescription dataHook="delete-template-desc">
                  It will no longer be offered under "Use template" when you reply.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                {/* A plain destructive Button: AlertDialogAction takes no
                    variant and renders primary green (measured, 27 Aug). */}
                <Button
                  variant="destructive"
                  dataHook="confirm-delete-template"
                  onClick={() => {
                    setTemplates((ts) => ts.filter((x) => x.id !== pendingDelete.id));
                    setPendingDelete(null);
                  }}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </DataCard>
  );
}

function AutoReplyView({ templates, rules, setRules, stateRequest }) {
  // `editing` holds a RULE ID, "new", or null.
  const [editing, setEditing] = useState(null);
  const [rateSel, setRateSel] = useState([]);
  const [tplId, setTplId] = useState("");
  const [delay, setDelay] = useState("60");
  const [pendingRemove, setPendingRemove] = useState(null);

  const startEdit = (rule) => {
    setEditing(rule ? rule.id : "new");
    // A NEW auto-reply starts with nothing chosen (Figma "New auto-reply ·
    // nothing chosen yet"), so Create stays off until it is complete.
    setRateSel(rule ? rule.ratings : []);
    setTplId(rule ? rule.templateId : "");
    setDelay(String(rule ? rule.delayMinutes : 60));
  };
  useEffect(() => {
    if (!stateRequest) return;
    const rule = rules[0];
    if (stateRequest.id === "new-rule") startEdit(null);
    if (stateRequest.id === "rule-ratings") {
      startEdit(null);
      setRateSel(["5"]);
    }
    if (stateRequest.id === "rule-ready") {
      startEdit(null);
      setRateSel(["5"]);
      setTplId(DEFAULT_TEMPLATES[0].id);
    }
    if (stateRequest.id === "edit-rule" && rule) startEdit(rule);
    if (stateRequest.id === "remove-rule" && rule) setPendingRemove(rule);
  }, [stateRequest]);
  const complete = rateSel.length > 0 && Boolean(tplId);
  const save = () => {
    if (!complete) return;
    const fields = { ratings: rateSel, templateId: tplId, delayMinutes: Number(delay) };
    if (editing === "new") {
      setRules((rs) => [
        ...rs,
        { id: `rule${Date.now()}`, sources: AUTO_REPLY_SOURCES, enabled: true, scope: "location", ...fields },
      ]);
    } else {
      setRules((rs) => rs.map((r) => (r.id === editing ? { ...r, ...fields } : r)));
    }
    setEditing(null);
  };
  const editingRule = rules.find((r) => r.id === editing) ?? null;
  const toggleRate = (id) => setRateSel((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));

  const columns = [
    {
      id: "rule",
      accessorFn: (r) => ruleName(r),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rule" dataHook="th-rule" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">{ruleName(row.original)}</span>
          <span className="text-muted-foreground text-sm">{SCOPES[row.original.scope]?.short ?? "This location"}</span>
        </div>
      ),
    },
    {
      id: "template",
      header: "Template",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm">
          {templates.find((t) => t.id === row.original.templateId)?.name ?? "No template"}
        </span>
      ),
    },
    {
      id: "sends",
      header: "Sends",
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{sendsShort(row.original.delayMinutes)}</span>,
    },
    {
      id: "active",
      header: "Active",
      enableSorting: false,
      cell: ({ row }) => (
        <Switch
          dataHook={`rule-${row.original.id}-active`}
          checked={row.original.enabled}
          aria-label={`${ruleName(row.original)} active`}
          onCheckedChange={(on) =>
            setRules((rs) => rs.map((r) => (r.id === row.original.id ? { ...r, enabled: on } : r)))
          }
        />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <RowMenu dataHook={`rule-${row.original.id}-menu`} label="Auto-reply actions">
          <DropdownMenuItem onSelect={() => startEdit(row.original)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPendingRemove(row.original)}>
            <Trash2 className="size-4" /> Remove
          </DropdownMenuItem>
        </RowMenu>
      ),
    },
  ];
  const table = useDataTable({ columns, data: rules, getRowId: (r) => r.id });

  return (
    <DataCard
      dataHook="autoreply-view"
      title="Auto-reply rules"
      description="New reviews that match a rule get its template reply automatically."
      action={
        <Button variant="outline" size="sm" dataHook="new-rule" onClick={() => startEdit(null)}>
          New auto-reply
        </Button>
      }
    >
      <DataTable
        table={table}
        dataHook="rules-table"
        className={TABLE_CLASS}
        noResultsMessage={
          templates.length === 0 ? (
            <TableEmpty
              dataHook="rules-empty-no-templates"
              title="No auto-replies yet"
              description="Auto-replies send one of your templates. Create a template first."
            />
          ) : (
            <TableEmpty
              dataHook="rules-empty"
              title="No auto-replies yet"
              description="An auto-reply sends a template to new reviews that match it, without you opening them."
              action={
                <Button variant="outline" size="sm" dataHook="rules-empty-new" onClick={() => startEdit(null)}>
                  New rule
                </Button>
              }
            />
          )
        }
      />

      <EditorSheet
        open={editing !== null}
        onOpenChange={(o) => (o ? null : setEditing(null))}
        dataHook="rule-sheet"
        title={editing === "new" ? "New auto-reply" : "Edit auto-reply"}
        description={`Replies to new ${AUTO_REPLY_SCOPE} reviews automatically.`}
        left={
          editing !== "new" && editingRule ? (
            <Button variant="ghost" dataHook="remove-rule-from-sheet" onClick={() => setPendingRemove(editingRule)}>
              Remove
            </Button>
          ) : null
        }
        footer={
          <>
            <Button variant="outline" dataHook="cancel-rule" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" dataHook="save-rule" onClick={save} disabled={!complete}>
              {editing === "new" ? "Create auto-reply" : "Save"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1">
          <p className="mb-1 text-sm font-medium">Reviews to reply to</p>
          {AUTO_REPLY_BUCKETS.filter((b) => b.kind === "star").map((b) => (
            <SheetCheck key={b.id} dataHook={`rule-rating-${b.id}`} checked={rateSel.includes(b.id)} onCheckedChange={() => toggleRate(b.id)}>
              <Rating value={Number(b.id)} dataHook={`rule-rating-${b.id}-stars`} />
              <span>{b.label}</span>
            </SheetCheck>
          ))}
        </div>

        <Field dataHook="rule-template-field">
          <FieldLabel htmlFor="rule-template" dataHook="rule-template-label">
            Reply with
          </FieldLabel>
          <Select value={tplId} onValueChange={setTplId}>
            <SelectTrigger id="rule-template" dataHook="rule-template" className="w-full">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field dataHook="rule-delay-field">
          <FieldLabel htmlFor="rule-delay" dataHook="rule-delay-label">
            Send
          </FieldLabel>
          <Select value={delay} onValueChange={setDelay}>
            <SelectTrigger id="rule-delay" dataHook="rule-delay" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DELAY_PRESETS.map((p) => (
                <SelectItem key={p.mins} value={String(p.mins)}>
                  {p.label} after the review arrives
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </EditorSheet>

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(o) => (o ? null : setPendingRemove(null))}
        dataHook="remove-rule-dialog"
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle dataHook="remove-rule-title">Remove this auto-reply?</AlertDialogTitle>
            <AlertDialogDescription dataHook="remove-rule-desc">
              {pendingRemove
                ? `New ${ruleName(pendingRemove).replace(/ on .*$/, "")} reviews on ${AUTO_REPLY_SCOPE} won't get a reply automatically any more. Replies already sent stay on ${AUTO_REPLY_SCOPE}.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              dataHook="confirm-remove-rule"
              onClick={() => {
                setRules((rs) => rs.filter((r) => r.id !== pendingRemove.id));
                if (editing === pendingRemove.id) setEditing(null);
                setPendingRemove(null);
              }}
            >
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DataCard>
  );
}

const SEED_RULE = {
  id: "rule1",
  sources: AUTO_REPLY_SOURCES,
  ratings: ["5"],
  templateId: "t1",
  delayMinutes: 60,
  enabled: true,
  scope: "location",
};

export default function RMReplyTemplatesPage() {
  const persona = usePersona();
  const fresh = persona?.engagement === "empty";
  const [templates, setTemplates] = useState(fresh ? [] : DEFAULT_TEMPLATES);
  const [rules, setRules] = useState(() => (fresh ? [] : [{ ...SEED_RULE }]));

  // STATES DRAWER (Ali, 7 Oct), the standard BrightLocal Drawer: every
  // state Figma draws for this page. Each one resets the page to its seed,
  // then asks the section that owns the state to open it. Prototype chrome.
  const [statesOpen, setStatesOpen] = useState(false);
  const [stateRequest, setStateRequest] = useState(null);
  const ask = (id) => () => setTimeout(() => setStateRequest({ id, n: Date.now() }), 60);
  const STATES = [
    ["Page", [
      ["Default", () => {}],
      ["Empty: no templates", () => { setTemplates([]); setRules([]); }],
      ["Empty: templates, no auto-replies", () => setRules([])],
    ]],
    ["Templates", [
      ["Edit: Thank you, happy visitor", ask("edit-t1")],
      ["Edit: Sorry to hear, follow up", ask("edit-t2")],
      ["New template", ask("new-template")],
      ["Placeholder error on save", ask("placeholder-error")],
      ["Can't delete a template in use", ask("cant-delete")],
    ]],
    ["Auto-replies", [
      ["New: nothing chosen yet", ask("new-rule")],
      ["New: ratings picked", ask("rule-ratings")],
      ["New: ready to create", ask("rule-ready")],
      ["Edit auto-reply", ask("edit-rule")],
      ["Remove auto-reply", ask("remove-rule")],
    ]],
  ];
  const resetPage = () => {
    setStateRequest(null);
    setTemplates(DEFAULT_TEMPLATES);
    setRules([{ ...SEED_RULE }]);
  };

  return (
    <SidebarProvider>
      <AppLayoutShell
        // 7 Oct: BrightLocal's own GlobalLayout and Sidebar, as Figma draws
        // the page ("New Platform - WIP" › 07.10.2026 - Review Manager), with
        // the app's token fixes. The look props below only steer the
        // proposal shell, which this engine does not render.
        engine="native-fixed"
        preset="live-site"
        navDensity="comfortable"
        stickyHeader
        flush
        pinnedSidebar
        // SAME dataHook as the inbox, deliberately. The shell stashes
        // tweaker settings (preset "Live Site", nav density, hue, …) in
        // sessionStorage keyed by SCOPE: inside a share the host pins one
        // scope so tweaks follow every goto, but with no host hint —
        // Studio, Sandpack, standalone — the key falls back to the
        // dataHook. Two different hooks meant a tweak set on the inbox was
        // dropped on arriving here. Sharing the hook shares the stash, and
        // these two screens are never on screen at the same time, so there
        // is nothing to collide (Ali, 27 Aug).
        dataHook="reviews-app-layout"
        // activeId "reviews-inbox", NOT the "reviews" parent (Ali, 27 Aug).
        // The module supports standing on the parent, but this page is
        // reached FROM the inbox and belongs to that job, so keeping Review
        // Inbox lit says "you are still in the inbox's world" rather than
        // dropping the highlight to a row nobody clicked.
        sidebar={<ProposalSidebar dataHook="templates-sidebar" activeId="reviews-inbox" />}
        mobileBar={
          <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
            <SidebarTrigger>
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-5" dataHook="mobile-logo" />
          </div>
        }
        header={
          <PageHeader
            dataHook="templates-page-header"
            // Four passed, three rendered: the clamp is .slice(-3) now
            // (Ali, 27 Aug), so this keeps "Minus 1 Studios > Reviews >
            // Review Manager" and drops "All Locations". Review Manager is the
            // real parent here — this page is reached from it — so it is the
            // crumb that must survive the trim.
            // 7 Oct, Figma "Reply templates · Layout": three crumbs ending at
            // Reviews, and the page described as the Review Manager's.
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
              { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
            ]}
            title="Reply templates"
            description="Review Manager reply templates"
          />
        }
      >
        <GlobalLayoutContentBody>
          <div className="flex flex-col gap-5">
            <TemplatesView
              templates={templates}
              setTemplates={setTemplates}
              rules={rules}
              stateRequest={stateRequest}
            />
            <AutoReplyView templates={templates} rules={rules} setRules={setRules} stateRequest={stateRequest} />
          </div>
        </GlobalLayoutContentBody>
        <div className="fixed right-4 bottom-20 z-40" data-hook="states-launcher">
          <Button variant="outline" size="sm" dataHook="open-states" onClick={() => setStatesOpen(true)}>
            <Layers className="size-4" />
            States
          </Button>
        </div>
        <Drawer open={statesOpen} onOpenChange={setStatesOpen} direction="right">
          <DrawerContent dataHook="states-drawer">
            <DrawerHeader>
              <DrawerTitle>Prototype states</DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="flex max-w-none flex-col gap-5 overflow-y-auto pb-6">
              {STATES.map(([group, items]) => (
                <div key={group} className="flex flex-col gap-1">
                  <p className="text-muted-foreground px-2 text-xs font-medium">{group}</p>
                  {items.map(([label, apply]) => (
                    <Button
                      key={label}
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      dataHook={`state-${group}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      onClick={() => {
                        resetPage();
                        setStatesOpen(false);
                        apply();
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              ))}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
