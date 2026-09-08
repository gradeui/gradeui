"use client";

// Promoted from Studio screen "RM — Reply Templates"
// (design dmtaq1rm9eok2, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: 987df423a822

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
import { Separator } from "@brightlocal/ui-components/separator";
import { Button } from "@brightlocal/ui-components/button";
import { Rating } from "@brightlocal/ui-components/rating";
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Badge } from "@brightlocal/ui-components/badge";
import { Input } from "@brightlocal/ui-components/input";
import { Textarea } from "@brightlocal/ui-components/textarea";
import { Switch } from "@brightlocal/ui-components/switch";
import { AlertWarning } from "@brightlocal/ui-components/alert";
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

// Editing happens in a Drawer, not an inline panel (Ali, 27 Aug). The inline
// editor pushed the list down and let you open one editor while looking at a
// different template, which reads as two sources of truth. A drawer is modal
// about WHICH template you are editing, and it is the same surface the inbox
// already uses to compose a reply — so writing reply text always happens in
// the same kind of place.
//
// Delete goes through AlertDialog rather than firing on click: it is
// destructive, unrecoverable in this prototype, and can silently break an
// auto-reply rule that points at the template. The confirmation is where that
// consequence gets stated, which is the whole reason it exists.
function TemplatesView({ templates, setTemplates, rules }) {
  // READ IT HERE, not in App() (6 Sep). AppLayoutShell mounts its own nested
  // ProposalDataProvider for the selected dataset, so a useProposalData call
  // ABOVE the shell sees the default location while everything inside it sees
  // the real one. That split is what put "Blackberry Farm Park" in the
  // template previews under a "Minus 1 Studios" breadcrumb. This component
  // renders inside the shell, so it gets the location the page is actually on.
  const business = useBusinessName();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [ratings, setRatings] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Insert at the CARET, not at the end: people write the sentence, then
  // drop the name into it. Reached by id rather than a ref because the DS
  // Textarea is a wrapper and forwarding is not part of its contract, so a
  // ref could quietly be null; the id is already on the element for
  // FieldLabel's htmlFor.
  const pendingCaret = useRef(null);
  const insertToken = (token) => {
    const el = document.getElementById("tpl-body");
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    pendingCaret.current = start + token.length;
  };

  // Caret restore has to run AFTER React has written the new value back
  // into the controlled textarea, which is why it is an effect on `body`
  // and not a requestAnimationFrame inside the click handler. The rAF
  // version set the caret and then React's own re-render put it back at
  // the end, so inserting mid-sentence still dumped you at the end of the
  // box (measured, 27 Aug). Focus returns too, so you can keep typing.
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
    // A NEW template starts as a catch-all. Pre-ticking ratings would make
    // the library's most common shape the one that takes the most clicks.
    setRatings(t ? (t.ratings ?? []) : []);
  };
  const save = () => {
    if (editing === "new")
      setTemplates((ts) => [...ts, { id: `t${Date.now()}`, name, body, ratings }]);
    else setTemplates((ts) => ts.map((t) => (t.id === editing ? { ...t, name, body, ratings } : t)));
    setEditing(null);
  };
  const confirmDelete = () => {
    setTemplates((ts) => ts.filter((x) => x.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  // Which rules would be left pointing at nothing. Counted here so the
  // confirmation can say it rather than leaving it to be discovered.
  const rulesUsing = (tpl) => (rules || []).filter((r) => r.templateId === tpl.id);
  const doomedRules = pendingDelete ? rulesUsing(pendingDelete) : [];
  // A template with a rule pointing at it is not deletable at all, so this
  // gates the whole dialog rather than just decorating it.
  const inUse = doomedRules.length > 0;

  // gap-5, and no mb-* on any child. Card's default density is a flex
  // column with gap-8 (32px); the children also carried mb-5 (20px), so
  // every gap in here was rendering at 52px and the section read as mostly
  // air (Ali, 27 Aug: "too much space on this screen"). gap IS a standard
  // utility, so tailwind-merge genuinely displaces the DS's gap-8 — unlike
  // its custom py-section-* padding, which a plain p-0 does NOT displace.
  // One gap, one place.
  //
  // A `//` comment, NOT a {/* */} one: this sits directly inside `return (`
  // and a JSX comment there is a second sibling expression, which does not
  // parse. It shipped broken for one push because the contract validator
  // checks component contracts, not a full parse (27 Aug).
  return (
      <Card dataHook="templates-view" className="max-w-none gap-5 p-6">
      <SectionHeader
        title="Reply templates"
        subtitle="Reusable replies. {{firstname}} and {{businessname}} are filled in per review."
        actions={
          // outline, not primary. This page has two co-equal sections, so
          // two filled green buttons sat on it competing, and neither is
          // THE action of the page (Ali, 27 Aug: "two primary CTA colours
          // here, need to tone that down"). Nothing here is a conversion,
          // it is a settings surface: the sections are found by their
          // headings, not by button weight. Primary is kept for the SAVE in
          // each drawer, where there genuinely is one action to commit.
          <Button variant="outline" size="sm" dataHook="new-template" onClick={() => startEdit(null)}>
            New template
          </Button>
        }
      />
      <Separator dataHook="templates-rule" />

      <div className="flex flex-col gap-3">
        {templates.map((t) => {
          const used = rulesUsing(t);
          return (
            // Same box-in-a-box fix as the rule rows: a tinted surface
            // instead of a border inside the Card's border.
            <div key={t.id} className="bg-muted/60 rounded-lg p-4">
              <div className="mb-1 flex items-center justify-between gap-3">
                {/* The scope badges sit beside the NAME, not under the body
                    text: "which reviews is this for" is part of identifying
                    the template, and a name alone stopped being enough the
                    moment two templates could share one. */}
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  <RatingScopeBadges ratings={t.ratings} idPrefix={`tpl-${t.id}-scope`} />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="outline" size="sm" dataHook={`edit-tpl-${t.id}`} onClick={() => startEdit(t)}>
                    Edit
                  </Button>
                  {/* ghost, matching Edit beside it and the rule rows
                      below, which were already two quiet ghost icons. A
                      filled red button on every row shouts a warning
                      continuously, which stops meaning anything; the
                      destructive weight belongs at the point of decision,
                      and the confirm dialog is already red. The Trash icon
                      still says what it does. */}
                  <Button
                    variant="outline"
                    size="sm"
                    dataHook={`del-tpl-${t.id}`}
                    onClick={() => setPendingDelete(t)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{resolveVars(t.body, null, business)}</p>
              {used.length > 0 ? (
                // Shown on the row, not only in the delete dialog: knowing a
                // template is load-bearing should not require trying to
                // destroy it first.
                <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                  <Zap className="text-primary size-3.5 shrink-0" />
                  Used by {used.length} auto-reply {used.length === 1 ? "rule" : "rules"}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <Drawer open={editing !== null} onOpenChange={(o) => (o ? null : setEditing(null))} direction="right">
        {/* Same width as the inbox's review panel: half the page, floored at
            the DS's own 384 and capped at 640. This drawer holds more than
            that one (name, a ten-row body, a seven-row rating picker) and
            was the case that prompted the change (Ali, 27 Aug). The
            data-[direction=right] variant is repeated deliberately, see the
            matching note on the review panel. */}
        <DrawerContent
          dataHook="template-drawer"
          className={DRAWER_WIDTH}
        >
          {/* max-w-none on the header, body AND footer. All three DS drawer
              slots are `mx-auto w-full max-w-sm`, so widening the panel to
              640 left the CONTENT at 384 with 127px of empty gutter each
              side (Ali, 27 Aug: "content is still fixed"). The cap belongs
              to a drawer that is always 384 wide; this one is not. All
              three, not just the body, or the header and footer would sit
              in a narrower column than the fields between them. */}
          <SideSheetHeader
            title={editing === "new" ? "New template" : "Edit template"}
            dataHook="template-sheet-header"
            closeHook="close-template"
          />

          <DrawerBody className="mt-0 flex max-w-none flex-col gap-4 overflow-y-auto py-4">
            {/* Field/Input/Textarea, not a hand-rolled border-input class.
                The local fieldClass string was a copy of the DS's own input
                styling that could only ever fall behind it, and it could not
                express states the components already have (error, disabled). */}
            <Field dataHook="tpl-name-field">
              <FieldLabel htmlFor="tpl-name" dataHook="tpl-name-label">
                Name
              </FieldLabel>
              <Input
                id="tpl-name"
                dataHook="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
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
                onChange={(e) => setBody(e.target.value)}
                // 6, not 10. At 384 wide a template wrapped to eight or
                // nine lines and the tall box was earning its height; at 640
                // the same text is four lines and the rest was empty box
                // (Ali, 27 Aug: "the reply area on here would be smaller,
                // that was the idea of making this bigger"). Still resize-y
                // for anyone writing something long.
                rows={6}
                placeholder="Write the reply. Use {{firstname}} and {{businessname}}."
                // text-sm: the DS Textarea sizes its own text at the base
                // step, which read a size larger than every other piece of
                // type on the screen (Ali, 27 Aug). This screen is text-sm
                // throughout, including the reply composer in the inbox that
                // this box is the twin of.
                className="resize-y text-sm"
              />
              {/* INSERT AT THE CURSOR, rather than leaving people to type
                  two sets of braces exactly right. Typing "{{firstname}}"
                  by hand is the kind of thing that fails silently: one
                  brace short and the token ships to a customer verbatim.
                  (Ali, 27 Aug.) */}
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
                    {token}
                  </Button>
                ))}
              </div>
              <FieldDescription dataHook="tpl-body-help">
                These are filled in per review when the reply is sent.
              </FieldDescription>
            </Field>
            {/* Not a Field. FieldLabel REQUIRES htmlFor, and this labels a
                group of checkboxes rather than one control — pointing it at
                the first row would make clicking the heading tick "Any
                rating". Plain heading + muted help, which is what the rule
                editor already does for the same picker.
                Same picker as the rule editor, on purpose: a template's scope
                and a rule's filter get compared against each other, so they
                have to be SET the same way or the comparison reads as a
                coincidence. */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Ratings this template is for</p>
              <RatingPicker selected={ratings} onChange={setRatings} idPrefix="tpl-rating" />
              <p className="text-muted-foreground text-sm">
                Auto-reply rules offer this template first when their ratings overlap. Leave
                everything unticked for a reply that suits any rating.
              </p>
            </div>
          </DrawerBody>

          <DrawerFooter className="max-w-none flex-row items-center border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button variant="ghost" dataHook="cancel-template" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <div className="grow" />
            <Button
              variant="primary"
              dataHook="save-template"
              onClick={save}
              disabled={!name.trim() || !body.trim()}
            >
              Save template
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => (o ? null : setPendingDelete(null))}
        dataHook="delete-template-dialog"
      >
        <AlertDialogContent>
          {/* TWO DIALOGS IN ONE, and the difference is whether anything
              depends on this template.
              It used to always offer Delete, and deleting a template a rule
              pointed at left the rule reading `Replies with "missing
              template"` — a rule that looks live, is switched on, and can
              never send (Ali, 27 Aug: "this is a bad state to get into").
              Warning someone on the way past was not enough: the broken
              state was still one click away, and nothing on the rules page
              made it obvious how to repair it.
              So an in-use template CANNOT be deleted. The dialog explains
              why, names what depends on it, and says what to do first. The
              row's Delete button deliberately stays enabled rather than
              going grey, because "why is this disabled?" is a worse
              question than a dialog that answers it. */}
          {inUse ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle dataHook="delete-template-title">
                  Cannot delete "{pendingDelete ? pendingDelete.name : ""}"
                </AlertDialogTitle>
                <AlertDialogDescription dataHook="delete-template-desc">
                  An auto-reply rule is set to send this template. Deleting it would leave
                  the rule with nothing to send.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertWarning
                dataHook="delete-template-inuse"
                title={`Used by ${doomedRules.length} auto-reply ${
                  doomedRules.length === 1 ? "rule" : "rules"
                }`}
                description={`${doomedRules.map((r) => describeRule(r)).join("; ")}. Point ${
                  doomedRules.length === 1 ? "that rule" : "those rules"
                } at another template, or delete ${
                  doomedRules.length === 1 ? "the rule" : "the rules"
                }, and you can then delete this template.`}
              />
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
                  This template will no longer be available in the inbox or when setting up
                  an auto-reply rule. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep template</AlertDialogCancel>
                {/* A plain destructive Button, NOT AlertDialogAction.
                    AlertDialogAction takes no `variant` (asChild is its only
                    prop) and renders the PRIMARY style, so the confirm on an
                    unrecoverable delete came out the same green as Save,
                    which reads as the safe choice and is the exact opposite
                    of what it does. asChild does not fix it either: Slot
                    merges the Action's own classes over the child's, so the
                    green survives (measured, rgb(42,232,85)).
                    Nothing is lost by dropping it: this dialog is controlled
                    by `pendingDelete`, and confirmDelete clears it, so the
                    close happens anyway. Cancel stays a real
                    AlertDialogCancel, which keeps Esc and the focus return. */}
                <Button
                  variant="destructive"
                  dataHook="confirm-delete-template"
                  onClick={confirmDelete}
                >
                  <Trash2 className="size-4" /> Delete template
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// AUTO_REPLY_SOURCES is derived, not hardcoded, so flipping canAutoReply on
// the SOURCES map is the only edit needed if another network ever allows it.
// The design brief's open question 2 expects exactly that ("design with
// multiple networks in mind, but something that works with just one"), so
// nothing below names Google — the scope line reads off this list.

// Module level so the delete-template dialog can name the rules a deletion
// would break, rather than only counting them. Rules are always
// source-scoped now, so an empty sources array reads as the Google default
// rather than "any source".
function describeRule(rule) {
  const ids = rule.sources.length === 0 ? AUTO_REPLY_SOURCES : rule.sources;
  const src = ids.map((id) => SOURCES[id].name).join(", ");
  const rate =
    rule.ratings.length === 0 ? "any rating" : rule.ratings.map(ratingLabel).join(", ");
  return `${rate} on ${src}`;
}

function AutoReplyView({ templates, rules, setRules }) {
  // `editing` holds a RULE ID, "new", or null. It used to be a boolean, which
  // is why a saved rule could only be deleted and rewritten: the editor had
  // nothing to seed itself from and save could only append. A v2 rule carries
  // enough settings that retyping them is not an acceptable way to change one.
  const [editing, setEditing] = useState(null);
  const [rateSel, setRateSel] = useState(["5"]);
  const [tplId, setTplId] = useState(templates[0] ? templates[0].id : null);
  // Held as TEXT, not a number: a number state cannot represent the empty
  // field you pass through while retyping a value, and coercing on every
  // keystroke fights the person typing. Coerced once, on save.
  const [delayText, setDelayText] = useState("60");
  const [scope, setScope] = useState("location");

  const startRule = (rule) => {
    setEditing(rule ? rule.id : "new");
    setRateSel(rule ? rule.ratings : ["5"]);
    setTplId(rule ? rule.templateId : templates[0] ? templates[0].id : null);
    setDelayText(rule ? String(rule.delayMinutes ?? 0) : "60");
    setScope(rule ? (rule.scope ?? "location") : "location");
  };

  const saveRule = () => {
    const draft = {
      sources: AUTO_REPLY_SOURCES,
      ratings: rateSel,
      templateId: tplId,
      delayMinutes: Math.max(0, Math.round(Number(delayText) || 0)),
      scope,
    };
    // `enabled` is deliberately NOT in the editor. A rule you have just
    // finished writing is one you want running, and pausing belongs on the
    // row where you can see what you are pausing. Updating preserves whatever
    // the row switch last said.
    if (editing === "new") setRules((rs) => [...rs, { id: `rule${Date.now()}`, enabled: true, ...draft }]);
    else setRules((rs) => rs.map((r) => (r.id === editing ? { ...r, ...draft } : r)));
    setEditing(null);
  };

  const setEnabled = (ruleId, value) =>
    setRules((rs) => rs.map((r) => (r.id === ruleId ? { ...r, enabled: value } : r)));

  // Partitioned, not filtered. Hiding the non-matching templates would make
  // the library look smaller than it is and take away a choice that is
  // sometimes right — a 3-star rule answered with the thank-you template is
  // odd, not forbidden. So they stay, below and dimmed.
  const suited = templates.filter((t) => templateSuitsRatings(t, rateSel));
  const unsuited = templates.filter((t) => !templateSuitsRatings(t, rateSel));
  const rateSummary = rateSel.length === 0 ? "any rating" : rateSel.map(ratingLabel).join(", ");

  const templateOption = (t, dimmed) => (
    <button
      key={t.id}
      type="button"
      onClick={() => setTplId(t.id)}
      className={`rounded-lg border p-3 text-left transition-colors ${
        tplId === t.id ? "border-primary bg-primary/10" : "border-input hover:bg-muted"
      } ${dimmed && tplId !== t.id ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{t.name}</p>
        <RatingScopeBadges ratings={t.ratings} idPrefix={`pick-${t.id}-scope`} />
      </div>
      <p className="text-muted-foreground mt-0.5 text-sm">{t.body}</p>
    </button>
  );

  return (
    <Card dataHook="autoreply-view" className="max-w-none gap-5 p-6">
      <SectionHeader
        title="Auto-reply rules"
        subtitle="New reviews that match a rule get its template reply automatically."
        actions={
          // outline, matching New template. See the note there.
          <Button variant="outline" size="sm" dataHook="new-rule" onClick={() => startRule(null)}>
            New rule
          </Button>
        }
      />
      <Separator dataHook="autoreply-rule" />

      {/* THE RULE EDITOR IS A DRAWER (Ali, 27 Aug: "auto reply rules
          should also be in a drawer"). It used to REPLACE the rules
          list in place, which meant editing one rule hid every other
          rule you were editing it against, and the page silently
          changed what it was showing. Same surface as the template
          editor next to it, so both jobs on this page are edited the
          same way. */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          {rules.map((rule) => {
            const tpl = templates.find((t) => t.id === rule.templateId);
            const ruleScope = SCOPES[rule.scope] ?? SCOPES.location;
            const ScopeIcon = ruleScope.Icon;
            const runs = RULE_RUNS.filter((r) => r.ruleId === rule.id);
            return (
              <div
                key={rule.id}
                // FILL, NOT OUTLINE. A bordered row inside a bordered Card
                // is a box in a box, and the two borders are the same weight
                // and nearly the same colour, so the eye reads two competing
                // containers (Ali, 27 Aug: "box in a box states here, subtle
                // colourisation of background perhaps"). Dropping the row
                // border and tinting the surface keeps the grouping without
                // a second frame.
                // Paused goes DEEPER rather than lighter: greyer reads as
                // dormant, and the fill is only a supporting signal anyway,
                // the Paused badge and the dimmed description carry it.
                // 60/90 rather than the first pass's 40/70: at 40 the tint
                // was so close to white that the grouping barely read on a
                // bright display (Ali, 27 Aug: "ever so slightly darker").
                className={`flex flex-col gap-2 rounded-lg p-4 ${
                  rule.enabled ? "bg-muted/60" : "bg-muted/90"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Only the DESCRIPTION dims when a rule is paused. The
                      switch and the buttons keep full contrast: the control
                      that brings a rule back must never look as inactive as
                      the rule it controls. */}
                  <div
                    className={`flex min-w-0 flex-1 items-start gap-3 ${
                      rule.enabled ? "" : "opacity-60"
                    }`}
                  >
                    <Zap
                      className={`mt-0.5 size-4 shrink-0 ${
                        rule.enabled ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{describeRule(rule)}</p>
                        <Badge dataHook={`rule-scope-${rule.id}`} variant="secondary">
                          <ScopeIcon className="size-3" />
                          {ruleScope.short}
                        </Badge>
                        {!rule.enabled ? (
                          // The word, not just an unticked control. A muted
                          // row alone is read as "less important", which is a
                          // different thing from "this is not running".
                          <Badge dataHook={`rule-paused-${rule.id}`} variant="outline">
                            Paused
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground truncate text-sm">
                        Replies with "{tpl ? tpl.name : "missing template"}"
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <Clock className="size-3.5 shrink-0" />
                        {humaniseDelay(rule.delayMinutes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Switch
                      dataHook={`rule-enabled-${rule.id}`}
                      checked={rule.enabled}
                      onCheckedChange={(v) => setEnabled(rule.id, v)}
                      aria-label={rule.enabled ? "Pause rule" : "Resume rule"}
                    />
                    {/* TEXT ONLY, outline, sm. These started as two bare
                        icons, briefly became icon + label, and are now label
                        alone (Ali, 27 Aug: "icons are just cluttering the
                        interface"). Every row carried the same two glyphs,
                        so they repeated down the page without ever
                        distinguishing one row from another, which is the
                        case where an icon costs more than it pays. The words
                        are unambiguous on their own, and outline gives the
                        pair a visible edge now the row itself is a filled
                        surface rather than an outlined one.
                        outline + sm + text is the row-action shape
                        everywhere on this screen. */}
                    <Button
                      variant="outline"
                      size="sm"
                      dataHook={`edit-rule-${rule.id}`}
                      onClick={() => startRule(rule)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      dataHook={`del-rule-${rule.id}`}
                      onClick={() => setRules((rs) => rs.filter((x) => x.id !== rule.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Collapsed by default. The history answers "is this thing
                    actually working", which is a question you ask
                    occasionally — open by default it would bury the rules
                    themselves under their own logs. */}
                <Collapsible dataHook={`rule-activity-${rule.id}`}>
                  {/* asChild, so data-state lands on the Button itself —
                      which is also why the Button carries `group`: the
                      chevron is a descendant and has no state of its own. */}
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group"
                      dataHook={`rule-activity-btn-${rule.id}`}
                    >
                      <History className="size-4" />
                      View recent activity
                      <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent dataHook={`rule-activity-body-${rule.id}`}>
                    {runs.length === 0 ? (
                      // Said plainly rather than drawn as an empty table. A
                      // rule that has never fired is a normal state, and a
                      // bordered box with nothing in it reads as broken.
                      <p className="text-muted-foreground px-3 pt-1 pb-2 text-sm">
                        This rule has not replied to anything yet.
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-col px-3">
                        {runs.map((run) => {
                          const src = SOURCES[run.source];
                          const runTpl = templates.find((t) => t.id === run.templateId);
                          return (
                            <div
                              key={run.id}
                              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t py-2 text-sm first:border-t-0"
                            >
                              <SourceMark source={src} />
                              <span className="font-medium">{run.reviewer}</span>
                              <span className="text-muted-foreground">{src.name}</span>
                              <span className="text-muted-foreground">{runStamp(run.at)}</span>
                              <span className="text-muted-foreground truncate">
                                "{runTpl ? runTpl.name : "deleted template"}"
                              </span>
                              <div className="grow" />
                              {run.outcome === "failed" ? (
                                <Badge dataHook={`run-outcome-${run.id}`} variant="destructive">
                                  Failed
                                </Badge>
                              ) : (
                                <Badge dataHook={`run-outcome-${run.id}`} variant="outline">
                                  Sent
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </div>

      <Drawer
        open={editing !== null}
        onOpenChange={(o) => (o ? null : setEditing(null))}
        direction="right"
      >
        <DrawerContent dataHook="rule-drawer" className={DRAWER_WIDTH}>
          <SideSheetHeader
            title={editing === "new" ? "New auto-reply rule" : "Edit auto-reply rule"}
            dataHook="rule-sheet-header"
            closeHook="close-rule"
          />

          <DrawerBody className="mt-0 flex max-w-none flex-col gap-5 overflow-y-auto py-4">
          {/* No source picker while there is one eligible source: a list of
              one tickable row implies a choice that does not exist. The scope
              is STATED instead, read off AUTO_REPLY_SOURCES, so the day
              Facebook flips to canAutoReply this line says "Google and
              Facebook" on its own. A real picker goes back in at that point —
              deliberately not shipped now, because dead UI nobody can reach
              is worse than a line of copy. */}
          <div className="border-input flex items-start gap-3 rounded-lg border p-4 md:max-w-xl">
            <span className="flex shrink-0 items-center gap-1 pt-0.5">
              {AUTO_REPLY_SOURCES.map((id) => (
                <SourceMark key={id} source={SOURCES[id]} />
              ))}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{AUTO_REPLY_SCOPE} reviews</p>
              <p className="text-muted-foreground text-sm">
                {AUTO_REPLY_SOURCES.length === 1
                  ? `${AUTO_REPLY_SCOPE} is the only source that accepts an automatic reply. You can still reply to the others yourself from the inbox.`
                  : `Rules run on ${AUTO_REPLY_SCOPE}. Every other source is replied to by hand from the inbox.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-72">
              <p className="text-muted-foreground mb-2 text-sm">Ratings</p>
              <RatingPicker
                selected={rateSel}
                onChange={setRateSel}
                idPrefix="rule-rating"
                buckets={AUTO_REPLY_BUCKETS}
              />
            </div>
            <div className="md:w-72">
              <p className="text-muted-foreground mb-2 text-sm">Applies to</p>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger dataHook="rule-scope-trigger" selectLabel="Applies to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">{SCOPES.location.label}</SelectItem>
                  <SelectItem value="account">{SCOPES.account.label}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-2 text-sm">{SCOPES[scope].help}</p>
            </div>
          </div>

          <div className="md:max-w-xl">
            <p className="text-muted-foreground mb-2 text-sm">Delay before replying</p>
            {/* PRESETS ONLY (Ali, 7 Sep: "we are removing actual minutes,
                so just the toggles for now"). The free-form minutes field
                from the v2 brief is gone; the four steps are the whole
                choice. The rule still stores delayMinutes underneath, so a
                rule migrated with an odd value (say 45) keeps it, shows it in
                the readout below, and simply has no chip lit until a chip is
                picked. */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Delay before replying">
              {DELAY_PRESETS.map((p) => (
                <Button
                  key={p.mins}
                  variant={Number(delayText) === p.mins ? "secondary" : "ghost"}
                  size="sm"
                  dataHook={`rule-delay-${p.mins}`}
                  aria-pressed={Number(delayText) === p.mins}
                  onClick={() => setDelayText(String(p.mins))}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {/* The readout says the delay back in words, so "1 hour" and a
                migrated "45 minutes" read the same way. */}
            <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
              <Clock className="size-3.5 shrink-0" />
              {humaniseDelay(delayText)}
            </p>
          </div>

          <div className="md:max-w-xl">
            <p className="text-muted-foreground mb-2 text-sm">Reply with template</p>
            {suited.length === 0 ? (
              // A rule with no template cannot send, so a rule whose ratings
              // no template covers is a rule that will silently do nothing.
              // Warned at the point of writing it, not discovered later in
              // the run history.
              <div className="mb-3">
                <AlertWarning
                  dataHook="no-suitable-template"
                  title="No template covers these ratings"
                  description={`Nothing in the library is written for ${rateSummary}, so reviews matching this rule have no suitable reply. Widen a template's ratings, write a new one, or pick one below anyway.`}
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">{suited.map((t) => templateOption(t, false))}</div>
            {unsuited.length > 0 ? (
              <>
                <p className="text-muted-foreground mt-4 mb-2 text-sm">
                  Written for other ratings
                </p>
                <div className="flex flex-col gap-2">
                  {unsuited.map((t) => templateOption(t, true))}
                </div>
              </>
            ) : null}
          </div>

          </DrawerBody>

          <DrawerFooter className="max-w-none flex-row items-center border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button variant="ghost" dataHook="cancel-rule" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <div className="grow" />
            <Button variant="primary" dataHook="save-rule" disabled={!tplId} onClick={saveRule}>
              {editing === "new" ? "Save rule" : "Save changes"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  );
}

/* --------------------------------- shell ---------------------------------- */

export default function RMReplyTemplatesPage() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [rules, setRules] = useState([
    {
      id: "rule1",
      sources: AUTO_REPLY_SOURCES,
      ratings: ["5"],
      templateId: "t1",
      delayMinutes: 60,
      enabled: true,
      scope: "location",
    },
  ]);

  return (
    <SidebarProvider>
      <AppLayoutShell
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
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
              { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
              { label: "Review Manager", goto: "screen:dmsxf5zjggd0n" },
            ]}
            title="Reply templates"
            description="Reusable replies, and the rules that send them for you."
          />
        }
      >
        <GlobalLayoutContentBody>
          <div className="flex flex-col gap-5">
            <TemplatesView
              templates={templates}
              setTemplates={setTemplates}
              rules={rules}
            />
            <AutoReplyView templates={templates} rules={rules} setRules={setRules} />
          </div>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
