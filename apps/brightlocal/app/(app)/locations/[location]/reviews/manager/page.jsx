"use client";

// Promoted from Studio screen "RM — Review Manager (DataTable)"
// (design dmsxf5zjggd0n, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: a2b814efb8d5

// RM — Review Manager. Real DS throughout: DataTable, DataTableSearch,
// DataTablePagination, Tabs, and Popover+Command for every facet menu.
// Reply and filters both open in a Drawer.
//
// 27 Aug — TEMPLATES + AUTO-REPLY MOVED OUT. Both were sub-views behind
// header buttons here, which made this screen carry three pages. They now
// live together on "RM — Reply Templates" (dmtaq1rm9eok2) and the header
// carries one link to it. This screen owns the inbox and nothing else.
// It still READS templates (the reply drawer's picker) from the same
// DEFAULT_TEMPLATES seed, but no longer edits them — see that screen's
// header for why per-screen template state is fine here.
//
// 27 Aug — MULTI-SELECT REMOVED. Row checkboxes, the select-all, the
// "n of N selected" summary and the bulk band (Reply with template / Skip
// reply) are gone: bulk actions have no v2 API commitment and
// Do-Not-Respond / removal are open decisions in the brief (Q4). The
// pre-removal build is preserved as "RM — Review Manager (DataTable) — bulk
// select". Row 3 is now Order + pagination.
//
// 27 Aug: SEND CAN FAIL. A reply that the source rejects is the top
// recurring support theme, and the brief is explicit that a generic
// "something went wrong" is not good enough. So: no new status value (a
// review whose reply failed still NEEDS action, and the tab counts have to
// stay honest), a separate `sendError` field instead, and named copy per
// failure code in SEND_FAILURES that says what to do next. See the send
// state machine in ReviewsInbox and SIMULATED_FAILURES for the demo wiring.
//
// ─── FINDINGS LIVE IN A REPORT, NOT IN THIS HEADER ───
// packages/studio/registries/brightlocal/reports/RM-REVIEW-INBOX-DS-REPORT.md
//
// That file is the current list (12 findings, each with the verbatim class
// strings and measured pixel values). This header used to carry them and
// went stale the moment they were fixed — it claimed Button had no icon
// size, that no multi-select facet was possible, and that rows and
// checkboxes were unreachable by keyboard. All three were wrong, or are
// now. Add findings to the report; keep this header to what a reader needs
// in order to edit the file.
//
// ─── WHAT IS DELIBERATE HERE ───
// TABLE HEADERS ARE HIDDEN, NOT REMOVED (sr-only <th>) — the row reads as a
// list, but screen readers still get column names.
//
// FILTER ROW IS ONE SIZE: size="sm" on every control, per the DS's own
// DataTableToolbarLeft recipe. The search field is forced to rounded-full
// to match the pill buttons, and to text-base/sm:text-sm so iOS does not
// zoom on focus. See findings 1-3.
//
// CARD PADDING: density="condensed" + p-0/gap-0. The default density's
// py-section-md is a CUSTOM utility, so a plain p-0 does not displace it —
// tailwind-merge only resolves classes it recognises as the same group.
//
// THE OPEN ROW is marked from inside a cell and highlighted with :has(),
// because DataTable's row takes no props. See finding 8.
//
// TRIPADVISOR MARK IS A REDRAWN STAND-IN — must not ship; the official
// asset belongs in @brightlocal/icons. Bing Places falls back to Globe.
// See finding 12.

import { useEffect, useMemo, useRef, useState } from "react";
import { usePersona, useDemo } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { profileFor } from "@/lib/location-profiles";
import { inboxRowsFor, TODAY as DATA_TODAY } from "@/lib/reviews-data";
import { pickIllustration } from "@/lib/illustrations";
import { ReviewPlanStrip } from "@/components/review-insights";
import { BeaconNugget } from "@/components/beacon-nugget";
import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import {
  useDataTable,
  DataTable,
  DataTablePagination,
  DataTableColumnHeader,
  DataTableSearch,
} from "@brightlocal/ui-components/data-table";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@brightlocal/ui-components/drawer";
import { Popover, PopoverTrigger, PopoverContent } from "@brightlocal/ui-components/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@brightlocal/ui-components/command";
import { Card, CardTitle } from "@brightlocal/ui-components/card";
import { Tabs, TabsList, TabsTrigger } from "@brightlocal/ui-components/tabs";
import { Separator } from "@brightlocal/ui-components/separator";
import { TypographySmall } from "@brightlocal/ui-components/typography";
import { Badge } from "@brightlocal/ui-components/badge";
import { Button } from "@brightlocal/ui-components/button";
import { Rating } from "@brightlocal/ui-components/rating";
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { AlertInfo, AlertDestructive } from "@brightlocal/ui-components/alert";
import {
  Menu,
  SlidersHorizontal,
  ChevronDown,
  Check,
  ChevronUp,
  Search,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trash2,
  Pencil,
  X,
  ExternalLink,
  Star,
  Globe,
  GoogleOriginal,
  FacebookOriginal,
  YelpOriginal,
  AppleOriginal,
} from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  EmptyState,
  useProposalData,
  formatDate,
  formatDateShort,
} from "@brightlocal/proposal";
import { SideSheetHeader } from "@brightlocal/side-sheet-header";
import {
  FACET_COMMAND_CLASS,
  FacetOptions,
  FacetPopover,
  FacetedFilterMenu,
  SingleSelectMenu,
} from "@brightlocal/facet-menu";

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
// hand, but only Google accepts an unattended rule-driven reply. Not read on
// this screen (auto-reply rules live on RM — Reply Templates); carried so
// the two copies of this map do not drift.
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
  // The three smaller sources the Tracker counts for Minus 1 Studios. They
  // arrive through the shared dataset (lib/reviews-data), so the inbox
  // must know them or a row throws. None can be replied to from here.
  yahoo: { name: "Yahoo! Local", Icon: Globe, hasMark: false, canReply: false, canAutoReply: false, ratingKind: "star" },
  apple: { name: "Apple Maps", Icon: AppleOriginal, hasMark: true, canReply: false, canAutoReply: false, ratingKind: "star" },
  bing: { name: "Bing Places", Icon: Globe, hasMark: false, canReply: false, canAutoReply: false, ratingKind: "star" },
};

const canReply = (review) => !review || SOURCES[review.source]?.canReply !== false;

const UNCONNECTED_SOURCES = [
  { id: "apple", name: "Apple Maps", Icon: AppleOriginal, hasMark: true },
  { id: "bbb", name: "BBB.org", Icon: Globe, hasMark: false },
  { id: "bing", name: "Bing Places", Icon: Globe, hasMark: false },
];

// WHERE A FIRST-RUN ACCOUNT GOES NEXT, when the inbox has nothing in it
// yet. Both are screens this prototype actually has, and both ids are the
// ones lib/first-run.ts already sends a first-run account to, so the empty
// inbox and the "Why it matters" band above it cannot point at two
// different places.
// ASSUMPTION: lib/first-run.ts offers ONE action on this page, "Connect a
// review site". The second button, asking customers for reviews, is mine: it
// is the product's own step 2 and the Review Builder screen exists, but
// nobody asked for it here. Drop it if the empty inbox should carry the
// single action the band carries.
const CONNECT_GOTO = "screen:dmtkj124xagqa"; // Report Settings: the review sites
const ASK_GOTO = "screen:dmt094j963aye"; // Review Builder: ask customers for reviews

const RECOMMENDATION_SOURCE = "facebook";
const AI_DRAFT_QUOTA = 3;
const TODAY = DATA_TODAY;

// ONE LONG FORMAT AND ONE SHORT (Ali, 17 Sep: "I want the date format to be
// consistent in the Review Manager"). The page header already said "August
// 18, 2026" through the library's formatDate, while the table said "9 Sept"
// with no year and the review panel "Wednesday 9 September 2026". The table
// takes the short form, "Aug 18, 2026", and the panel the long one. Both come
// from the library, and they parse the ISO string rather than going through
// new Date, which would apply the viewer's timezone and can move the day.
const shortDate = (iso) => formatDateShort(iso);
const longDate = (iso) => formatDate(iso);
const daysAgo = (iso) => Math.round((TODAY - new Date(iso)) / 86400000);

const ratingValue = (r) => (r === "up" ? 5 : r === "down" ? 1 : r);

// [source, name, rating, text, isoDate, status, aiDraft]
const SEED_REVIEWS = [
  ["google", "Sophie", 5, "First visit and it was a brilliant day out from start to finish. The team were patient with our two under-5s and nothing was too much trouble. We'll definitely be back before the summer holidays end.", "2026-08-11", "needs",
    "Thank you {{firstname}}, what a lovely thing to read after a first visit to {{businessname}}. I'll pass this to the team, who'll be pleased to hear they made a day with two under-5s an easy one."],
  ["tripadvisor", "Dan", 4, "Great value for a family of four. Plenty to do across the whole site and it held up when the weather turned. Only gripe is the queue at lunchtime, which took nearly 25 minutes.", "2026-08-11", "needs",
    "Thanks {{firstname}}, glad the day still worked when the weather turned. You're right about the lunchtime queue. We're reviewing how we staff the counter across the busiest hour."],
  ["facebook", "Charlotte", "up", "Recommend! Took my nephew for the morning and we stayed until closing. The staff were so patient with him. Lovely day.", "2026-08-10", "needs",
    "Thanks {{firstname}}! A morning that turned into a full day is the best kind. I'll make sure the team hear how patient you found them with your nephew."],
  ["google", "Priya", 5, "We booked for my daughter's fourth birthday and the team went out of their way to make it special. She hasn't stopped talking about it since. Spotlessly clean throughout too.", "2026-08-09", "manual",
    "Thank you {{firstname}}, and a belated happy birthday to your daughter. I'll pass your note on cleanliness to the crew who keep it that way."],
  ["google", "Megan", 3, "Lovely in parts and the kids enjoyed themselves, but a few things were closed with no warning on the website. Worth checking before you travel.", "2026-08-08", "needs",
    "Thanks for the honest feedback {{firstname}}. You're right that closures should be on the website before anyone sets off, and we're changing how we publish those updates. Sorry it caught you out."],
  ["tripadvisor", "Tom", 5, "Third visit this year and it keeps getting better. The new area is huge and the afternoon display was genuinely impressive. The season pass is paying for itself.", "2026-08-07", "manual",
    "Thanks {{firstname}}, three visits in a year is the best review we could ask for. Really glad the new area and the afternoon display are landing well."],
  ["google", "Rachel", 4, "Lovely morning out with my toddler. Pushchair-friendly throughout which made a nice change. Would have given five stars but the baby-change facilities need a refresh.", "2026-08-06", "skipped",
    "Thanks {{firstname}}, good to hear the paths worked with a pushchair. You're right about the baby-change facilities. They're due an upgrade and reviews like yours help make the case."],
  ["facebook", "Josh", "up", "Big recommend from us, easily a full day out. Easy parking and friendly staff all round.", "2026-08-05", "auto",
    "Thanks {{firstname}}! Easy parking and friendly staff are two things we work hard at, so it's good to know they showed."],
  ["google", "Gemma", 5, "Honestly the best we've been to in the county. The indoor space meant we stayed twice as long as planned. Staff clearly love working there.", "2026-08-04", "needs",
    "Thank you {{firstname}}, that's high praise. The indoor space was added so a visit isn't at the mercy of the weather, so hearing it doubled your day is exactly what we hoped for."],
  ["tripadvisor", "Ollie", 5, "Visited with grandchildren aged 3 and 7 and both were entertained all day, which never happens. Lovely touches everywhere.", "2026-08-03", "auto",
    "Thanks {{firstname}}, keeping a 3 year old and a 7 year old happy at the same time is no small thing, so we're glad it worked."],
  ["google", "Hannah", 4, "Really good day out. Everything is well organised with clear time slots. Car park gets tight by 11am on weekends so arrive early.", "2026-08-01", "needs",
    "Thanks {{firstname}}, glad the time slots made the day easy to plan. Weekend parking after 11am is a fair point. We're looking at overflow options."],
  ["tripadvisor", "Ben", 3, "Mixed feelings. The main offering is great, but the cafe was out of most kids' options by 1pm and a couple of the staff seemed stretched thin.", "2026-07-30", "needs",
    "Thanks for taking the time {{firstname}}. Running out of children's options by 1pm isn't good enough, and we've raised both that and the staffing with the catering team."],
  ["google", "Laura", 5, "Celebrated my son's birthday here and the hosts were fantastic. Everything ran to time and the food was spot on.", "2026-07-28", "manual",
    "Thank you {{firstname}}, and happy birthday to your son. I'll pass this to the party hosts and the kitchen, who'll be delighted everything ran to time."],
  ["facebook", "Debbie", "down", "Can't recommend after Saturday. The queue for entry took 50 minutes with two bored toddlers and no one came down the line to explain the delay.", "2026-07-27", "needs",
    "I'm sorry {{firstname}}. Fifty minutes at the entrance with two toddlers, and nobody explaining why, is genuinely poor. We're changing how we manage entry queues and how we communicate delays. Please get in touch so we can put this right."],
  ["google", "Steve", 4, "Good honest family attraction. Not flashy, just well looked after and plenty of space to run around.", "2026-07-26", "auto",
    "Thanks {{firstname}}, that's exactly what we're going for. Not flashy, just well looked after."],
  ["google", "Amira", 4, "Lovely site and really helpful staff. Wheelchair access is mostly good, although one of the paths is steep enough that I needed a hand.", "2026-07-24", "needs",
    "Thanks {{firstname}}, and thank you for flagging that path. Access shouldn't depend on having someone with you to help, so we're reviewing that route and looking at a gentler alternative."],
  ["tripadvisor", "Nadia", 5, "We travelled 45 minutes on a recommendation and it was worth every mile. Would happily do it again next month.", "2026-07-17", "needs",
    "Thank you {{firstname}}, a 45 minute drive on someone else's recommendation is a real vote of confidence, and we're glad {{businessname}} lived up to it."],
  ["tripadvisor", "Ellie", 5, "Beautiful setting and everything clearly well cared for. My daughter cried when we left, which I'm taking as a five-star sign.", "2026-07-14", "auto",
    "Thank you {{firstname}}, tears at going home time might be the highest compliment we get."],
  ["google", "Noah", 2, "Not what we hoped for. Queued 40 minutes for one of the main activities only for it to be cut short, and nobody offered the kids another slot.", "2026-07-09", "needs",
    "I'm sorry {{firstname}}. Forty minutes of queuing for something then cut short is frustrating, and the team should have offered your children another slot. That's on us. Please get in touch so we can make it right."],
  ["google", "Dave", 1, "Would not recommend. My son was knocked over and staff just shrugged it off. Left after an hour.", "2026-07-04", "needs",
    "I'm very sorry {{firstname}}. Your son being knocked over should have been met with immediate care, and it clearly wasn't. That is not the standard we hold ourselves to. Please contact us directly and I'll look into it personally."],
  ["google", "Chris", 5, "Cracking place. Kids were occupied for two hours straight without a single moan. Cafe flat white was decent too, which is rare.", "2026-04-12", "skipped",
    "Thanks {{firstname}}, two hours of uninterrupted play is the whole goal. Glad the coffee held its end up as well."],
  ["google", "Jack", 5, "Annual pass holders for two years now. There's something new every season and the staff remember the kids' names.", "2026-03-03", "auto",
    "Thank you {{firstname}}, two years of annual passes means a great deal. The team will be pleased you noticed they remember the children's names."],
  ["tripadvisor", "Katie", 5, "Spent the whole day here with three kids under 8 and nobody moaned once, which is a first. Plenty of shaded spots to sit.", "2026-02-18", "auto",
    "Thanks {{firstname}}, three under-8s and not one complaint is a genuine result. Glad the shaded spots came in useful."],
  ["tripadvisor", "Ellis", 4, "Beautiful setting and it's obvious how much care goes into the place. The afternoon display alone is worth the ticket.", "2026-01-09", "needs",
    "Thank you {{firstname}}, the afternoon display is a favourite of ours too. We appreciate you noticing the care that goes in behind the scenes."],
  // ---- 36 more, older, appended 18 Aug (Ali: "I need some more reviews in
  // the Review inbox to test the pagination better"). The table pages at 12,
  // so 24 rows only ever produced two pages. 60 gives five. They run OLDER
  // than the block above, which keeps the array's newest-first ordering
  // intact, and every source id and status here is one the screen already
  // defines (google / tripadvisor / facebook / yelp, needs / manual / auto /
  // skipped). Facebook rows carry "up" or "down" rather than a number,
  // matching the recommend model. Nothing derives a hardcoded 24: the tab
  // counts and the row total are computed from this array.
  ["google", "Fiona", 5, "Took the grandchildren for the afternoon and it was the easiest day out we've had all year. Clear signage, plenty of seating, and staff who actually look up and say hello.", "2025-12-28", "auto",
    "Thank you {{firstname}}, seating and signage are the unglamorous things we spend a lot of time on, so it's good to hear they made the afternoon easy."],
  ["tripadvisor", "Marcus", 4, "Good winter visit. Most of it works fine in the cold and the indoor area was warm. Docking a star because the outdoor cafe was shut with no notice.", "2025-12-21", "needs",
    "Thanks {{firstname}}, glad the indoor space kept the day going. The outdoor cafe closing without notice is a fair criticism and we're fixing how we publish seasonal hours."],
  ["yelp", "Bethan", 5, "Booked last minute on a Sunday and had no trouble at all. Staff were relaxed and friendly and the whole site felt well looked after.", "2025-12-14", "auto",
    "Thanks {{firstname}}, last minute Sundays are the ones we most want to work smoothly, so that's good to hear."],
  ["google", "Ryan", 4, "Solid day out for the money. Kids loved it, adults were comfortable, parking was straightforward. Cafe prices are a bit steep but that's true everywhere now.", "2025-12-07", "auto",
    "Thanks {{firstname}}, comfortable adults and happy children is the balance we aim for. We do keep an eye on cafe pricing and your note goes into that review."],
  ["facebook", "Leanne", "up", "Absolutely brilliant, we were there five hours and could have stayed longer. Will be back in the spring.", "2025-11-30", "auto",
    "Thanks {{firstname}}! Five hours and still not done is exactly what we like to hear. See you in the spring."],
  ["google", "Aisha", 5, "First time visiting and I was impressed by how calm it felt even when busy. My daughter is autistic and the quiet room made a real difference to her day.", "2025-11-23", "manual",
    "Thank you {{firstname}}, this means a lot. The quiet room was added for exactly this reason and hearing it worked for your daughter is the best feedback we could get."],
  ["tripadvisor", "Gordon", 3, "Perfectly fine but nothing special on a wet November day. Half the outdoor space wasn't usable and the indoor bit gets crowded quickly.", "2025-11-16", "needs",
    "Thanks for the honest write-up {{firstname}}. A wet November does squeeze everyone indoors and you're right that it gets tight. We're looking at how to spread people out better in poor weather."],
  ["google", "Simon", 5, "Second visit in a month. The kids ask to come back, which tells you everything. Staff are consistently good.", "2025-11-09", "auto",
    "Thanks {{firstname}}, twice in a month is a proper endorsement. I'll pass on the note about the team."],
  ["yelp", "Nicola", 4, "Really enjoyed it. Well organised and easy to navigate with a pram. Would like to see more picnic tables for people bringing their own food.", "2025-11-02", "needs",
    "Thanks {{firstname}}, good to hear it worked with a pram. More picnic tables is a request we hear a lot and it's on the list for next season."],
  ["google", "Priyanka", 5, "Went for a birthday treat and the team made a real fuss of her. Genuinely thoughtful people working here.", "2025-10-26", "manual",
    "Thank you {{firstname}}, and belated birthday wishes. I'll make sure the team hear that the fuss they made was noticed."],
  ["facebook", "Craig", "up", "Great value and a proper full day. Easy to find, easy to park, easy to spend the whole day.", "2025-10-19", "auto",
    "Thanks {{firstname}}! Easy on all three counts is what we're going for."],
  ["google", "Elaine", 2, "Disappointing given the price. Two of the main attractions were closed for maintenance and this wasn't mentioned when we booked online.", "2025-10-12", "needs",
    "I'm sorry {{firstname}}. Maintenance closures should be on the booking page before anyone pays, not discovered on arrival. We're changing how those are flagged. Please get in touch so we can put your visit right."],
  ["tripadvisor", "Hugh", 5, "Excellent half term visit. Busy but never felt overcrowded, and the staff kept everything moving. Food was better than expected.", "2025-10-05", "auto",
    "Thanks {{firstname}}, keeping a half term day moving without it feeling packed is the hardest thing we do, so that's good to hear."],
  ["google", "Sarah", 4, "Lovely place and clearly well cared for. The walk from the far car park is longer than you'd expect, so worth knowing if anyone in your group struggles with distance.", "2025-09-28", "needs",
    "Thanks {{firstname}}, that's a useful flag. The far car park walk catches people out and we're looking at better signage and a drop-off option closer in."],
  ["yelp", "Tomasz", 5, "Brought visiting family and they were genuinely impressed. Everything is thought through, right down to where the bins and the water fountains are.", "2025-09-21", "auto",
    "Thank you {{firstname}}, bins and water fountains are not glamorous but they make or break a day out, so we're pleased someone noticed."],
  ["google", "Jade", 5, "Honestly one of the best days we've had as a family. My youngest didn't want to leave and neither did I.", "2025-09-14", "auto",
    "Thanks {{firstname}}, that's lovely to read. Sorry about the difficult exit negotiation with your youngest."],
  ["facebook", "Martin", "down", "Not great this time. Waited 35 minutes at the cafe for cold food and when we said something we were told they were short staffed and that was that.", "2025-09-07", "needs",
    "I'm sorry {{firstname}}. A 35 minute wait for cold food is bad enough, and being told about staffing rather than being offered a fix makes it worse. Please contact us so we can sort this out properly."],
  ["google", "Rebecca", 5, "Went on a whim on a Wednesday and had the run of the place. Staff were chatty and helpful. Perfect low-key day.", "2025-08-31", "skipped",
    "Thanks {{firstname}}, midweek visits are a bit of a secret. Glad you found it."],
  ["tripadvisor", "Alan", 4, "Very good overall. Clean, well run, plenty for a range of ages. The queueing system at the entrance could be clearer but once you're in it's excellent.", "2025-08-24", "needs",
    "Thanks {{firstname}}, and thank you for the entrance note. The queueing system is the bit we get the most comments on and we're redesigning how it's signed."],
  ["google", "Chloe", 5, "Took my two nieces and they were entertained from open to close. Loads of shade, which mattered on a hot day.", "2025-08-17", "auto",
    "Thanks {{firstname}}, shade on a hot day makes all the difference. Glad your nieces got a full day out of it."],
  ["yelp", "Duncan", 3, "Mixed. The site itself is lovely but it was very busy and the toilets near the entrance needed attention by mid afternoon.", "2025-08-10", "needs",
    "Thanks for telling us {{firstname}}. Toilets slipping by mid afternoon on a busy day is a cleaning rota problem and we've raised it with the team directly."],
  ["google", "Yasmin", 5, "Brilliant. Booked the family ticket, arrived early, stayed all day. Everything ran smoothly and the staff were lovely with my son who is quite shy.", "2025-08-03", "manual",
    "Thank you {{firstname}}, and I'm glad the team took the time with your son. Arriving early is the insider tip we'd give too."],
  ["facebook", "Paula", "up", "Recommend to anyone with young kids. Safe, clean, and enough to fill a whole day without spending a fortune.", "2025-07-27", "auto",
    "Thanks {{firstname}}! Safe, clean and affordable is the brief, so that's good to hear."],
  ["google", "Ian", 4, "Good visit. Nothing to complain about really, other than it took a while to find the entrance from the overflow parking.", "2025-07-20", "skipped",
    "Thanks {{firstname}}, the overflow parking route needs better signage and it's being looked at. Glad the rest of the day was straightforward."],
  ["tripadvisor", "Freya", 5, "Went for my daughter's birthday and it was faultless from booking to leaving. The party host was patient and genuinely good with the children.", "2025-07-13", "manual",
    "Thank you {{firstname}}, and happy birthday to your daughter. Party hosts make or break the day so I'll pass this on."],
  ["google", "Owen", 5, "Really good. Well maintained, well staffed, and the kind of place where you can relax rather than watch them like a hawk.", "2025-07-06", "auto",
    "Thanks {{firstname}}, being able to actually relax is exactly what we want parents to feel here."],
  ["yelp", "Meera", 4, "Enjoyable day. Good range of things to do across ages, which is hard to get right. Cafe queue at lunch is the weak point.", "2025-06-29", "needs",
    "Thanks {{firstname}}, the lunchtime cafe queue comes up often and we're changing how we staff that hour. Glad the range worked across your group."],
  ["google", "Stuart", 1, "Terrible experience. Arrived to find our booking had no record on the system, waited 45 minutes in the office and were eventually let in with no apology.", "2025-06-22", "needs",
    "I'm sorry {{firstname}}. A booking going missing and then 45 minutes in the office with no apology is a poor experience from start to finish. Please get in touch directly so I can look into what happened."],
  ["facebook", "Donna", "up", "Lovely day, lovely people. My mum came with us and there was plenty of seating for her which made it work.", "2025-06-15", "auto",
    "Thanks {{firstname}}! Seating is one of those things you only notice when it isn't there, so we're glad it worked for your mum."],
  ["google", "Callum", 5, "Top marks. Went on a Saturday expecting chaos and it was calm and well managed throughout.", "2025-06-08", "auto",
    "Thanks {{firstname}}, a calm Saturday takes a lot of planning so the team will be pleased it showed."],
  ["tripadvisor", "Verity", 4, "Really nice site with a lot of care taken over the details. Would have been five stars but the play area for older children is limited.", "2025-06-01", "needs",
    "Thanks {{firstname}}, that's fair. Older children are the group we most want to do better for and there's work underway on exactly that."],
  ["google", "Harriet", 5, "Perfect day out. Easy booking, easy parking, easy day. The kids have already asked when we're going back.", "2025-05-25", "auto",
    "Thanks {{firstname}}, three easy things in a row is the aim. Look forward to having you back."],
  ["yelp", "Joseph", 5, "Genuinely impressed. Everything is clean, everyone is friendly, and it's obvious the place is run by people who care about it.", "2025-05-18", "skipped",
    "Thank you {{firstname}}, that's a generous thing to say and I'll pass it on to the whole team."],
  ["google", "Anita", 3, "Fine but not outstanding. Enjoyable enough for a couple of hours, though we'd expected more for a full day at that price.", "2025-05-11", "needs",
    "Thanks for the honest feedback {{firstname}}. If it only filled a couple of hours then the ticket price is a fair thing to question, and it's useful for us to hear where the day fell short."],
  ["facebook", "Ross", "up", "Cracking day out with the boys. Loads of space, easy going staff, no fuss.", "2025-05-04", "auto",
    "Thanks {{firstname}}! No fuss is exactly the day we're trying to run."],
  ["google", "Bridget", 4, "Very good. Clean throughout and well organised. Only note is that the map could be clearer, we missed a whole section until late on.", "2025-04-27", "needs",
    "Thanks {{firstname}}, and sorry you found a section late in the day. The map is being redrawn and this is exactly the feedback we need for it."],
];

const TABS = [
  { id: "all", label: "All" },
  { id: "needs", label: "Needs action" },
  { id: "manual", label: "Manually replied" },
  { id: "auto", label: "Auto-replied" },
  { id: "skipped", label: "Skipped" },
];

// WHAT A NARROWED LIST SAYS WHEN IT HOLDS NOTHING. A tab narrows the list the
// same way a facet does, so "No reviews match these filters" is the wrong
// sentence when the only thing narrowing it is the tab you are standing on.
// One line per tab, in that tab's own terms. "All" cannot reach this state
// with no filters set, so it has no line of its own.
const TAB_EMPTY = {
  needs: "Nothing here needs a reply.",
  manual: "No replies have been written by hand.",
  auto: "No replies have gone out automatically.",
  skipped: "No reviews have been skipped.",
};

// Labels match the current product's own time filter, minus one. The product
// also offers "Last Month", which we deliberately drop: sitting directly above
// "Last 30 days" it either duplicates it (rolling reading) or means the
// previous calendar month (bounded reading), and the two are indistinguishable
// to anyone looking at the menu. Ali's call, 17 Aug.
const PERIODS = [
  { id: "all", label: "All time" },
  { id: "12m", label: "Last 12 months", days: 365 },
  { id: "6m", label: "Last 6 months", days: 183 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "7d", label: "Last 7 days", days: 7 },
];

// "All time" carries no `days`; everything else is a rolling window.
const matchesPeriod = (option, daysAgo) =>
  !option || option.days === undefined || daysAgo <= option.days;

// ASSUMPTION (27 Aug): only "Date" was specified for the order control.
// "Rating" is the one other orderable field on the row model, added so the
// menu is not a single-option dead control — drop it if the inbox should
// only ever be date-ordered.
// DIRECTION, NOT JUST A FIELD (Ali, 6 Sep: "we need order asc, desc as well
// on here"). Kept as one menu of four rather than a field select plus a
// direction toggle: two controls to express one choice is two things to
// read, and the four combinations have plain names that a direction arrow
// beside "Date" does not.
const ORDERS = [
  { id: "date-desc", label: "Newest first" },
  { id: "date-asc", label: "Oldest first" },
  { id: "rating-desc", label: "Highest rated" },
  { id: "rating-asc", label: "Lowest rated" },
];

const BUCKETS = [
  { id: "5", label: "5 star", kind: "star" },
  { id: "4", label: "4 star", kind: "star" },
  { id: "3", label: "3 star", kind: "star" },
  { id: "2", label: "2 star", kind: "star" },
  { id: "1", label: "1 star", kind: "star" },
  { id: "up", label: "Recommended", kind: "up" },
  { id: "down", label: "Not recommended", kind: "down" },
];

const STATUS_CHIP = {
  needs: { label: "Needs action", variant: "primary" },
  manual: { label: "Manually replied", variant: "secondary" },
  auto: { label: "Auto-replied", variant: "outline" },
  skipped: { label: "Reply skipped", variant: "outline" },
};

// A FAILED SEND IS NOT A STATUS. `sendError` is a separate field on the
// review ({ code, at }, null when fine) precisely so a review whose reply
// was rejected keeps status "needs". It still needs action, and the tab
// counts stay honest. Adding a sixth status would have split "Needs action"
// into two piles that mean the same thing to the person clearing the inbox.
//
// Every code names WHAT HAPPENED and WHAT TO DO. "unknown" is the one that
// tempts a generic "something went wrong", so it is written last and given
// the same treatment as the rest: retry, then a route to support. Copy
// carries {{source}} where naming the network makes the sentence concrete,
// resolved by sendFailureCopy, the same substitution model as resolveVars.
const SEND_FAILURES = {
  disconnected: {
    // BLOCKING: nothing can be posted until the connection is renewed, so
    // the composer is not rendered at all (Ali, 27 Aug: "this would have
    // none of the form items, just the error message"). A reply box you
    // cannot submit is furniture that invites wasted typing.
    blocking: true,
    title: "Your {{source}} connection has expired",
    description:
      "The reply was not posted because {{source}} no longer accepts requests from this account. Reconnect {{source}} under Connections, then send the reply again. Your draft is saved here in the meantime.",
  },
  permission: {
    // BLOCKING for the same reason as `disconnected`: the fix is outside
    // this screen, and until it happens there is nothing useful to type.
    blocking: true,
    title: "This account cannot reply to {{source}} reviews",
    description:
      "The connected {{source}} account no longer has permission to reply for this location. Ask whoever manages the {{source}} listing to give it a manager role, or connect an account that already has one, then try again.",
  },
  deleted: {
    // TERMINAL. Every other failure here is something that changes if you
    // fix it or wait, so "Retry sending" is the honest next step. A review
    // that has been removed at the source is gone, and offering a retry
    // that is guaranteed to fail sends someone round a loop with no exit
    // (Ali, 27 Aug). The only real move left is to clear it, so the alert
    // carries no button at all and the footer's Skip, which is there for
    // every unreplied review, is the one thing on screen to press.
    terminal: true,
    blocking: true,
    title: "This review is no longer on {{source}}",
    description:
      "The reviewer or {{source}} removed it, so there is nothing left to reply to. Nothing was posted. You can skip the reply to clear it from Needs action, and it will drop out of the inbox at the next sync.",
  },
  "rate-limited": {
    title: "{{source}} is limiting replies right now",
    description:
      "Too many replies have gone to {{source}} from this account in the last hour, so it turned this one down. Wait a few minutes and send again. Your draft is kept exactly as you wrote it.",
  },
  unknown: {
    title: "{{source}} rejected this reply",
    description:
      "{{source}} turned the reply down without giving a reason, so nothing was posted. Send it again, that clears it most of the time. If it fails a second time, contact support with the reviewer's name and the date and we will chase it with {{source}}.",
  },
};

const sendFailureCopy = (review) => {
  const failure = review?.sendError ? SEND_FAILURES[review.sendError.code] : null;
  if (!failure) return null;
  const source = SOURCES[review.source]?.name ?? "the review site";
  return {
    terminal: Boolean(failure.terminal),
    // blocking = hide the composer. terminal = it can never succeed.
    // Every terminal failure blocks; not every blocking one is terminal
    // (a permission problem is fixable, a deleted review is not).
    blocking: Boolean(failure.blocking),
    title: failure.title.replaceAll("{{source}}", source),
    description: failure.description.replaceAll("{{source}}", source),
  };
};

// DEMO WIRING, not product logic. Failures are pinned to named review ids
// rather than drawn at random so a walkthrough is repeatable: these three
// fail on the FIRST send and go through on the retry, which is the loop the
// brief actually wants seen. All three are Google or Facebook, because a
// read-only source has no send to fail. Delete this map and the send path
// simply always succeeds.
// DEMO WIRING, not product logic.
//
// The five failure states are pinned to the FIRST FIVE reviews the inbox can
// actually reply to, in the order they appear in the table, so every state
// sits in one block at the top of the list and nobody has to remember which
// row does what (Ali, 27 Aug: "make each item that is a particular state
// next to each other so I dont need to remember"). They are DERIVED rather
// than hardcoded ids, so re-ordering or re-tagging the seed data cannot
// silently point a failure at a TripAdvisor row that has no Send button.
//
// Read in table order, the top of the inbox now walks the whole set:
//   1st repliable  connection expired   (transient, retry clears it)
//   2nd repliable  rate limited         (transient, retry clears it)
//   3rd repliable  rejected, no reason  (transient, retry clears it)
//   4th repliable  review deleted       (TERMINAL, retry never clears it)
//   5th repliable  no permission        (arrives ALREADY failed)
const FAILURE_DEMO_SEQUENCE = [
  "disconnected",
  "rate-limited",
  "unknown",
  // PERSISTENT, and it has to be. The other four are transient: something
  // was wrong at the account or the rate limit, you fix it or wait, and the
  // retry goes through. A review that has been deleted at the source is
  // gone, so a retry that "worked" would be a lie about the one failure a
  // person cannot resolve by trying again. This one fails every attempt,
  // and its copy is the only one that offers Skip rather than Send again.
  { code: "deleted", persistent: true },
];

// Repliable AND still needing action: a review that already carries a reply
// renders the sent reply instead of a composer, so it has no Send to fail.
// STARTER PERSONA (app-side, 8 Sep): four reviews, none answered. Same
// indexes as SEED_REVIEWS so ids (r0..r3) line up with the failure demo.
const STARTER_REVIEWS = SEED_REVIEWS.slice(0, 4).map((row) => {
  const next = [...row];
  next[5] = "needs";
  return next;
});
const seedRowsFor = (persona, location) =>
  inboxRowsFor(location, persona); // every persona from the rows: the old STARTER_REVIEWS seed showed TripAdvisor and Facebook with only Google connected (Ali, 10 Sep)

// FROM THE ROWS ON SCREEN, not from SEED_REVIEWS. The app builds its inbox
// with inboxRowsFor(location, persona), so a position picked out of the
// Studio seed pointed at a different review here: the seeded permission
// failure landed on a row that had already been answered, and the state was
// unreachable in the app (capture sweep, 17 Sep, skipped it; Ali, 20 Sep).
const demoFailureIdsFor = (rows) =>
  rows
    .map(([source, , , , , status], i) => ({ id: `r${i}`, source, status }))
    .filter((r) => SOURCES[r.source]?.canReply && r.status === "needs")
    .slice(0, FAILURE_DEMO_SEQUENCE.length + 1)
    .map((r) => r.id);

const simulatedFailuresFor = (ids) =>
  Object.fromEntries(
    FAILURE_DEMO_SEQUENCE.map((spec, i) => [ids[i], spec]).filter(([id]) => Boolean(id)),
  );

// SIMULATED_FAILURES entries are either a bare code (fails the FIRST send,
// succeeds on retry) or { code, persistent } for one that never clears.
const simulatedFailure = (failures, id, attempt) => {
  const entry = failures[id];
  if (!entry) return undefined;
  if (typeof entry === "string") return attempt === 1 ? entry : undefined;
  return entry.persistent || attempt === 1 ? entry.code : undefined;
};

// One review arrives ALREADY failed, so the "Reply failed" row badge is on
// screen at load and nobody has to send anything to find this state. It sits
// at the end of the demo block, and has no SIMULATED_FAILURES entry, so
// retrying it succeeds first time.
const seededSendErrorFor = (ids) => ({
  id: ids[FAILURE_DEMO_SEQUENCE.length] ?? null,
  code: "permission",
  hoursBefore: 5,
});

const DEFAULT_TEMPLATES = [
  {
    id: "t1",
    name: "Thank you, happy visitor",
    // `ratings` uses BUCKETS ids, and [] means "any rating". A 1 star
    // review was being offered the happy-visitor template with nothing to
    // say it was the wrong one. Non-matching templates are still listed
    // (someone may genuinely want one), just demoted. The same field is
    // landing on the Reply Templates screen; keep the two copies identical.
    ratings: ["5", "4", "up"],
    body: "Thanks so much for the lovely review, {{firstname}}! We're really glad you enjoyed your visit to {{businessname}} and we'll pass your comments on to the team. See you again soon.",
  },
  {
    id: "t2",
    name: "Sorry to hear, follow up",
    ratings: ["1", "2", "down"],
    body: "Thanks for taking the time to share this, {{firstname}}. We're sorry parts of your visit fell short of what we'd want at {{businessname}}. Please get in touch so we can look into it and put things right.",
  },
];

// An empty (or missing) `ratings` matches everything, so a template added
// without the field keeps working rather than silently dropping to the
// bottom of every picker.
const templateSuitsRating = (template, review) =>
  !template.ratings || template.ratings.length === 0
    ? true
    : !!review && template.ratings.includes(String(review.rating));

/* --------------------------------- helpers -------------------------------- */

function useBusinessName() {
  const data = useProposalData();
  return data?.location?.name ?? "this location";
}

function useStickyHeaderOffset(headerHook) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const el = document.querySelector(`[data-hook="${headerHook}"]`);
    if (!el) return undefined;
    // The band is the nearest STICKY ancestor. With none (the de facto
    // GlobalLayout has no sticky header) the offset is zero: measuring
    // the header itself put the table's sticky header 100px down the
    // page (Ali, 9 Sep).
    let band = null;
    let node = el;
    while (node && node !== document.body) {
      if (window.getComputedStyle(node).position === "sticky") {
        band = node;
        break;
      }
      node = node.parentElement;
    }
    const measure = () => setOffset(band ? Math.round(band.getBoundingClientRect().height) : 0);
    const watched = band ?? el;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(watched);
    return () => ro.disconnect();
  }, [headerHook]);
  return offset;
}

function resolveVars(body, review, business) {
  return body
    .replaceAll("{{firstname}}", review ? review.name : "{{firstname}}")
    .replaceAll("{{businessname}}", business);
}

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

// A failed send OUTRANKS the status chip rather than sitting beside it. The
// underlying status is still "needs", and "Needs action" next to "Reply
// failed" reads as two separate problems when it is one. Every chip in the
// table goes through here, so the wide `status` column and the narrow
// stacked cell (where `status` is hidden entirely) pick this up together.
// The failure has to survive closing the panel, and the row is the only
// place left showing it.
// STATUS and DELIVERY are two different axes, so a failed send does not
// REPLACE the status chip, it sits beside it (Ali, 27 Aug: "not sure we
// want to change the status badge on the table itself for failed states").
// Swapping it out was worse on both counts: the row stopped saying where
// the review actually is (a failed send leaves it in Needs action, and
// that is exactly what the person still has to deal with), and "Reply
// failed" read like a fifth status, which would imply a tab and a filter
// that do not exist. Status stays truthful, delivery is annotation.
// ONE badge. The status column says what state the review is in, and a
// failed send does not change that state: the review still Needs action,
// which is exactly what the column already said (Ali, 27 Aug: "why would
// we display two bloody statuses, that status is for the state it is in,
// not if it has failed or not").
//
// This went in as a second badge because a failure needed to survive
// closing the panel. It bought that at the cost of every affected row
// carrying a green chip and a red chip saying two different things, and
// "Reply failed" reading like a fifth status with a tab that does not
// exist. Delivery is not status; it belongs to the reply attempt, and the
// reply panel is where the attempt lives.
function StatusChip({ status, hook }) {
  const c = STATUS_CHIP[status];
  return (
    <Badge dataHook={hook} variant={c.variant}>
      {c.label}
    </Badge>
  );
}

// Same, plus: CommandList is `max-h-[300px] overflow-y-auto`, which is right
// in a popover and wrong in a sheet that already scrolls — it would put a
// scroller inside a scroller. The sheet owns scrolling; each list runs full
// height inside it.
// shrink-0 is load-bearing. Command's root is `flex flex-col overflow-hidden`,
// and overflow-hidden sets a flex item's automatic minimum size to zero — so
// as a child of the sheet's capped column, each section SHRANK to fit instead
// of the sheet scrolling, and clipped what did not fit. Period rendered five
// rows into 134px of a 196px list and showed three (Ali, 19 Aug: "Each
// section is fixed and cant scroll, not great!"). Sections keep their full
// height; the scroll region is the one thing that scrolls.
const SHEET_COMMAND_CLASS =
  FACET_COMMAND_CLASS +
  " shrink-0 [&_[data-slot=command-list]]:max-h-none [&_[data-slot=command-list]]:overflow-visible";

function PanelNav({ index, total, onPrev, onNext }) {
  if (index < 0) return null;
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" iconOnly dataHook="panel-prev" onClick={onPrev} disabled={index <= 0} aria-label="Previous review">
        <ChevronUp className="size-4" />
      </Button>
      <Button variant="ghost" iconOnly dataHook="panel-next" onClick={onNext} disabled={index >= total - 1} aria-label="Next review">
        <ChevronDown className="size-4" />
      </Button>
      <span className="text-muted-foreground ml-1 text-sm tabular-nums">
        {index + 1} of {total}
      </span>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground w-20 shrink-0 text-sm">{label}</span>
      {children}
    </div>
  );
}

/* --------------------------------- panel ---------------------------------- */

function ReplyBody({ review, business, draft, onDraft, onAi, aiPending, aiSpent, aiBlocked, aiRemaining, templates, onTemplate, sending, onRetry }) {
  const [tplOpen, setTplOpen] = useState(false);
  if (!review) return null;
  const replied = review.status === "manual" || review.status === "auto";
  const failure = sendFailureCopy(review);
  // Matching templates first, the rest demoted under a heading rather than
  // hidden. Splitting here rather than sorting keeps the two lists in
  // separate CommandGroups, which is what gives the heading something to
  // label.
  const suitedTemplates = templates.filter((t) => templateSuitsRating(t, review));
  const otherTemplates = templates.filter((t) => !templateSuitsRating(t, review));

  const renderTemplate = (t, demoted) => (
    <CommandItem
      key={t.id}
      value={t.name}
      onSelect={() => {
        onTemplate(t);
        setTplOpen(false);
      }}
      dataHook={`tpl-${review.id}-${t.id}`}
    >
      <span className="min-w-0 flex-1">
        <span className={`block font-medium ${demoted ? "text-muted-foreground" : ""}`}>
          {t.name}
        </span>
        <span className="text-muted-foreground line-clamp-1 block text-sm">
          {resolveVars(t.body, review, business)}
        </span>
      </span>
    </CommandItem>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <DetailRow label="Source">
          <span className="flex items-center gap-2 text-sm">
            <SourceMark source={SOURCES[review.source]} />
            {SOURCES[review.source].name}
          </span>
        </DetailRow>
        <DetailRow label="Rating">
          <RatingValue rating={review.rating} hook={`panel-stars-${review.id}`} />
        </DetailRow>
        <DetailRow label="Date">
          <span className="text-sm">{longDate(review.date)}</span>
        </DetailRow>
        <DetailRow label="Status">
          <StatusChip
            status={review.status}
            hook={`panel-status-${review.id}`}
          />
        </DetailRow>
      </div>

      <Separator dataHook={`panel-rule-${review.id}`} />

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{review.name}</p>
        <p className="text-sm leading-relaxed">{review.text}</p>
      </div>

      {!canReply(review) ? (
        // No composer, no textarea, no AI/template triggers. An existing
        // reply still renders if the record carries one — the review is
        // read-only here, which is not the same as pretending no reply
        // exists. The note carries no action button on purpose: every
        // route out of this state is on the source's own site.
        <div className="flex flex-col gap-4">
          {replied ? (
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Your reply</span>
              <p className="bg-muted rounded-md p-3 text-sm">
                {resolveVars(review.reply, review, business)}
              </p>
            </div>
          ) : null}
          <AlertInfo
            dataHook={`no-reply-${review.id}`}
            title={`${SOURCES[review.source].name} replies cannot be sent from here`}
            // Button lives INSIDE description, below the text — not in the
            // `action` slot. AlertInfo lays action out as a second COLUMN, so
            // it stole the width and reflowed the copy into a ~9-word ribbon
            // (Ali, 27 Aug). Stacking it under the text keeps the paragraph
            // full-width and still reads as part of the same block.
            //
            // The one action a read-only source HAS: leave for the place the
            // reply can actually be written. Named per source rather than a
            // generic "Open review", so the destination is obvious before the
            // click. PROTOTYPE GAP — the real control is an <a> carrying the
            // review's permalink with target="_blank"; the seed rows have no
            // per-review URL, so this is the affordance without a destination.
            description={
              <span className="flex flex-col items-start gap-3">
                <span>
                  {SOURCES[review.source].name} does not accept replies posted through a
                  connected tool, so there is no reply box for this review. You can still
                  reply on {SOURCES[review.source].name} itself.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  dataHook={`open-source-${review.id}`}
                >
                  <ExternalLink className="size-4" />
                  Open in {SOURCES[review.source].name}
                </Button>
              </span>
            }
          />
        </div>
      ) : replied ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">Your reply</span>
          <p className="bg-muted rounded-md p-3 text-sm">
            {resolveVars(review.reply, review, business)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* ABOVE the composer, not below the footer buttons: the draft is
              still sitting there untouched and the person's next move is to
              read this and press Retry, so it has to be the first thing in
              the reply block rather than something they scroll back up for.
              The Retry button is INSIDE description, stacked under the text,
              for the same reason the read-only note is: AlertDestructive
              lays `action` out as a second COLUMN and it would squeeze the
              copy into a ribbon (Ali, 27 Aug). */}
          {failure ? (
            <AlertDestructive
              dataHook={`send-failed-${review.id}`}
              title={failure.title}
              description={
                <span className="flex flex-col items-start gap-3">
                  <span>{failure.description}</span>
                  {/* ONE PLACE TO PRESS PER ACTION (Ali, 20 Sep). The alert
                      only carries a button when the footer cannot: on a
                      blocking failure the composer is gone, so the footer's
                      Send goes with it and a retry has nowhere else to
                      live. On a recoverable failure the composer stays, so
                      the footer's "Send again" is the retry, which is the
                      button this copy already points at ("send again",
                      "send it again"). The terminal one is gone from the
                      source for good: there is nothing to retry, and the
                      Skip its copy names is the footer's, the same Skip
                      every unreplied review has. Before this, a live
                      "Retry sending" sat 461px above a greyed "Send again",
                      and the terminal state offered "Skip reply" twice.
                      No loading state on THIS button: pressing it clears
                      sendError, so the alert it lives in unmounts and the
                      footer's Send carries the pending beat. Two spinners a
                      few hundred pixels apart would say the same thing
                      twice. Still disabled while sending, because nothing
                      stops a second click arriving before the re-render. */}
                  {failure.blocking && !failure.terminal ? (
                    <Button
                      variant="outline"
                      size="sm"
                      dataHook={`retry-${review.id}`}
                      onClick={onRetry}
                      // The composer is hidden in this state, so there is no
                      // visible draft to gate on: the text is still held in
                      // state and is what a retry sends.
                      disabled={sending}
                    >
                      Retry sending
                    </Button>
                  ) : null}
                </span>
              }
            />
          ) : null}
          {failure?.blocking ? null : (
            <>
          <span className="text-muted-foreground text-sm">Your reply</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              // sm to match the "Use template" trigger beside it — that one
              // is a FacetPopover, which is sm throughout the screen.
              size="sm"
              dataHook={`ai-${review.id}`}
              onClick={onAi}
              disabled={aiBlocked || aiPending}
              loading={aiPending}
            >
              {aiPending ? null : <Sparkles className="size-3.5" />}
              {aiPending ? "Generating…" : aiSpent ? "Reinsert AI draft" : "Draft with AI"}
            </Button>
            <FacetPopover
              label="Use template"
              open={tplOpen}
              onOpenChange={setTplOpen}
              panelWidth="w-72"
              dataHook={`tpl-${review.id}`}
            >
              {suitedTemplates.length > 0 ? (
                <CommandGroup>{suitedTemplates.map((t) => renderTemplate(t, false))}</CommandGroup>
              ) : null}
              {otherTemplates.length > 0 ? (
                // The heading only earns its place when there is a suited
                // group above it to contrast with. A 3 star review matches
                // neither template, and labelling the whole list "Other
                // templates" with nothing else on screen just reads as
                // noise, so in that case they render plainly.
                suitedTemplates.length > 0 ? (
                  <CommandGroup heading="Other templates">
                    {otherTemplates.map((t) => renderTemplate(t, true))}
                  </CommandGroup>
                ) : (
                  <CommandGroup>{otherTemplates.map((t) => renderTemplate(t, false))}</CommandGroup>
                )
              ) : null}
            </FacetPopover>
          </div>
          <textarea
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            rows={6}
            placeholder="Write a reply, or generate a draft"
            className="border-input placeholder:text-muted-foreground focus:border-ring bg-background w-full resize-y rounded-md border px-3 py-2 text-sm outline-none"
          />
          {/* Running out of AI drafts is the one state here a person will
              actually want explained, so it gets AlertInfo (title +
              description + action) rather than another quiet grey line. The
              other two states stay as unobtrusive helper text — an alert per
              state would just be noise. */}
          {aiBlocked ? (
            <AlertInfo
              dataHook={`ai-quota-${review.id}`}
              title="No AI drafts left today"
              description={`Your plan includes ${AI_DRAFT_QUOTA} AI drafts a day. The allowance resets 24 hours after the first draft you generated today. You can still write a reply yourself, or start from a template.`}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              {aiSpent
                ? "AI suggestion. Read it over and edit before sending."
                : `${aiRemaining} of ${AI_DRAFT_QUOTA} AI drafts left today.`}
            </p>
          )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ReplyActions({ review, draft, sending, onSend, onSkip, onEdit, onDelete }) {
  if (!review) return null;
  // SEND GOES WITH THE COMPOSER, so a blocking failure takes it off the
  // screen rather than greying it out (Ali, 20 Sep). `blocking` hides the
  // composer, and a Send button under a form that is not there said "you
  // cannot send" and "send" in the same breath, with the live recovery
  // 461px above it in the alert. Recovery for these states is the alert's
  // Retry; for the terminal one there is no recovery at all, only the Skip
  // below. Skip stays live in every failure, because clearing the review is
  // the one thing that still works (Ali, 27 Aug).
  const blocked = Boolean(sendFailureCopy(review)?.blocking);
  // Send / Skip / Edit / Delete all post to the source. None of them apply
  // to a read-only network, so the panel offers no buttons at all — the
  // footer that would hold them is not rendered either.
  if (!canReply(review)) return null;
  const replied = review.status === "manual" || review.status === "auto";
  if (replied) {
    return (
      <>
        <Button variant="destructive" dataHook={`delete-${review.id}`} onClick={onDelete}>
          <Trash2 className="size-4" /> Delete reply
        </Button>
        <Button variant="outline" dataHook={`edit-${review.id}`} onClick={onEdit}>
          <Pencil className="size-4" /> Edit reply
        </Button>
      </>
    );
  }
  // Skip is disabled mid-send as well: it changes the same record the send
  // is about to write to, and letting both land is how you get a review
  // marked skipped AND replied.
  return (
    <>
      <Button variant="outline" dataHook={`skip-${review.id}`} onClick={onSkip} disabled={sending}>
        Skip reply
      </Button>
      {blocked ? null : (
        <Button
          variant="primary"
          dataHook={`send-${review.id}`}
          onClick={onSend}
          loading={sending}
          disabled={sending || !draft.trim()}
        >
          {sending ? "Sending…" : review.sendError ? "Send again" : "Send reply"}
        </Button>
      )}
    </>
  );
}

// A REPLY THAT LANDS IS THE WHOLE POINT OF THIS SCREEN (Ali, 20 Sep: "do we
// have a 'You have replied to a review' in the drawer state? This apparently
// should be a moment for celebration"). A send used to close the drawer, so
// the one thing the inbox exists for was the only action with no
// acknowledgement at all: the overlay vanished and a badge changed behind it.
// The drawer holds instead, says where the reply went, shows what was sent,
// and points at the next review waiting.
//
// IT REPLACES THE SILENT SUCCESS AND NOTHING ELSE. Sending, and every failure
// in SEND_FAILURES, behave exactly as they did.
//
// Type and spacing are the shared EmptyState's own roles, text-heading-
// subsection over a muted text-body, centred, so the two moments in the
// product that stop and say something read as one thing. It is not an
// EmptyState itself: that takes an ICON in a circle, and a moment worth
// marking wants the illustration.
// TWO NUMBERS, TWO QUESTIONS. `remaining` is every review still needing
// action, which is what the Needs action tab and the hub card count and so
// the only honest number to print. `queued` is the ones this screen can post
// to, which is the only honest thing to end the queue on: the read-only rows
// in the gap between them have no Send and no Skip, so an ending measured on
// `remaining` never arrives.
function ReplySent({ review, business, remaining, queued }) {
  if (!review) return null;
  const source = SOURCES[review.source]?.name ?? "the review site";
  // Nothing left to write from here, which is this screen's own finish line.
  const done = queued === 0;
  // And nothing left anywhere, on an account whose waiting reviews are all on
  // sources that take replies.
  const clear = done && remaining === 0;
  // One illustration, chosen by MEANING rather than by name (lib/
  // illustrations, which is what that file exists for): applause for a reply
  // that went, and the confetti kept back for the bigger moment, the reply
  // box with nothing left to write in it.
  const Art = pickIllustration(done ? ["milestone", "celebrate"] : ["win", "congratulations"]);
  return (
    // ONE COMPOSED BLOCK, ANCHORED TO THE TOP. The leftover height here
    // cannot be removed, only placed: the drawer is full height on purpose
    // (see REVIEW_DRAWER_STYLE) and this moment is 232px of content in a
    // 738px column. my-auto split that leftover into two equal 269px voids,
    // above and below, which is what left the block reading as a stamp
    // adrift in a panel that had failed to render (Ali, 20 Sep). Anchored to
    // the top, the white falls once, below the content, where a panel's
    // empty space belongs and where the footer's border closes it off.
    // py-8 over the body's own py-4 puts 48px between the header's divider
    // and the illustration, which is the shared EmptyState's own py-12: this
    // block already borrows that component's type and spacing, so it keeps
    // its vertical rhythm too. max-w-sm so everything in it shares one
    // narrow column: the reply used to run the full 607px of the panel while
    // the two lines above it stayed centred, which is what made the block
    // read as pulled apart (Ali, 20 Sep). mx-auto because a flex child with
    // a max width otherwise sits against the left edge instead of centring.
    <div
      className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 py-8 text-center"
      data-hook={`reply-sent-${review.id}`}
    >
      {/* aria-hidden on a WRAPPER, the way StripArt does it: the illustration
          renders a light twin and a dark twin and neither svg carries one of
          its own, so a reader would open on two unlabelled graphics instead of
          on the line. */}
      <span aria-hidden>
        <Art className="size-20" />
      </span>
      <p className="text-heading-subsection" data-hook="reply-sent-title">
        Your reply is on its way to {source}
      </p>
      <p
        className="text-body text-muted-foreground max-w-[52ch] text-pretty"
        data-hook="reply-sent-next"
      >
        {clear
          ? "That was the last one. Nothing else is waiting for a reply."
          : done
            // The queue this screen owns is empty and the inbox is not, so
            // the line says both: the finish, and exactly what is sitting
            // behind it and why it is not a job for this page. Saying
            // "nothing else is waiting" here would be a lie about four
            // reviews, and printing the bare count would be a demand with no
            // way to meet it.
            ? `That was the last one you can reply to from here. ${remaining} ${
                remaining === 1 ? "review is" : "reviews are"
              } on sources that only take replies on their own site.`
            : `${remaining} more ${remaining === 1 ? "review needs" : "reviews need"} a reply.`}
      </p>
      {/* The same muted box a sent reply gets everywhere else on this panel,
          so it reads as the reply itself rather than as a receipt for it. */}
      <div className="mt-2 flex w-full flex-col gap-2 text-left">
        <span className="text-muted-foreground text-sm">What you sent</span>
        <p className="bg-muted rounded-md p-3 text-sm" data-hook={`reply-sent-body-${review.id}`}>
          {resolveVars(review.reply, review, business)}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------- inbox ---------------------------------- */

// A bottom drawer's height has to be set INLINE. The DS sizes that variant
// with data-[vaul-drawer-direction=bottom]:mt-24 and :max-h-[80vh], and a
// data-attribute selector outranks a plain mt-0 / max-h-[92svh] class, so the
// class version silently lost and the drawer sat at 80% with a 96px band
// above it (Ali, 19 Aug: "Uncanny vally — definetly needs more height").
// Inline style beats every class, whatever the DS adds later.
const BOTTOM_DRAWER_STYLE = { marginTop: 0, maxHeight: "92svh" };

// The drag handle only exists on the bottom variant, and it stacks with the
// header: mt-4 + h-2 + the header's own pt-4 put 40px between the top of the
// drawer and the title (Ali, 19 Aug: "that drag bar and the distance between
// it and the page title is too big"). mt-2 on the handle and pt-2 on the
// header make it 24, with 8px between the bar and the title — still a
// comfortable grab margin, no longer a void.
//
// [&>div:first-child] because the handle is an anonymous div with no
// data-slot and no data-hook. It is always DrawerContent's first child, so
// the selector holds, but it is the one thing here that a DS refactor could
// silently break — worth a data-slot upstream.
// h-1 and a stronger fill, not the DS's h-2 on bg-muted: 8px of the palest
// token in the set reads as a smudge rather than a grab handle (Ali, 19 Aug:
// "a little faint (and also fat)"). 4px on muted-foreground/40 is the iOS
// grabber proportion and actually visible. The /40 is an alpha, not a colour
// mix — Tailwind compiles it as alpha-over-transparent.
//
// The descendant selectors outrank the DS's own plain classes on that div
// (two classes plus a child combinator beats one class), so this is decided
// by specificity rather than by stylesheet order.
const BOTTOM_DRAWER_HANDLE = [
  "[&>div:first-child]:mt-2",
  "[&>div:first-child]:h-1",
  "[&>div:first-child]:bg-muted-foreground/40",
].join(" ");

// The REVIEW panel takes a definite height, not a cap. A drawer hugs its
// content, so a short review opened at 651px and a long one at 747px — and
// since PanelNav pages between reviews INSIDE the drawer, the panel resized
// under your thumb on every next/prev (Ali, 19 Aug: "same height issue with
// selecting an individual item"). A task surface should hold still; the body
// scrolls instead.
//
// The filter drawer keeps max-height on purpose: it has no navigation, and a
// drawer with three filters in it has no business being full height.
const REVIEW_DRAWER_STYLE = { marginTop: 0, height: "92svh", maxHeight: "92svh" };

// Shared by this screen's review panel and the Reply Templates edit drawer,
// so the two read as the same surface. See the note at the review panel.
//
// THREE SIZES, because the space available is not the same in each:
//   phone  (< 640) the drawer is a BOTTOM sheet and full width already, so
//                  none of this applies to it.
//   tablet (640 to 1023) 65% of the width. The nav aside is hidden below lg,
//                  so there is no sidebar competing for the row and the
//                  panel can take more of it (Ali, 27 Aug: "maybe larger on
//                  that").
//   desktop (1024+) back to 50%, because the sidebar is back.
// Floor 24rem (the DS's own 384) so no size ever LOSES width against
// today, cap 40rem (640) so the reply line length stays comfortable.
const DRAWER_WIDTH =
  "data-[vaul-drawer-direction=right]:sm:w-[clamp(24rem,65vw,40rem)] data-[vaul-drawer-direction=right]:lg:w-[clamp(24rem,50vw,40rem)] data-[vaul-drawer-direction=right]:sm:max-w-[40rem]";

// ─── FilterDrawer — the facet row, collapsed ──────────────────────
// Below sm the four-control filter row wraps to two lines (129px at 375px,
// measured) and the sticky block reaches 273px, a third of the viewport
// before a single review. So on mobile the facets fold into ONE trigger and
// open here instead (Ali, 19 Aug: "thats the real win on mobile").
//
// THE ROWS ARE THE DESKTOP ROWS. Each section mounts the same FacetOptions
// the popover menus do, so padding, hover, the selected check and cmdk's
// filtering are the component's, not this sheet's. The first cut hand-rolled
// rows with a Checkbox in each one and had to reinvent all four, unevenly
// (Ali: "the hover state here is uneven in padding top bottom. I guess I'd
// expect this to use a component we already have?").
//
// LIVE, NOT APPLY/CANCEL. It writes straight to the screen's own filter
// setters, so the table behind it updates as you tap and mobile filters by
// exactly the rules desktop does. A draft-and-apply sheet would need a second
// copy of three pieces of state plus a cancel path. The footer button only
// closes; its count is the live filtered total, so it doubles as the answer
// to "what did that do?"
function FilterDrawer({
  // "bottom" on a phone, "right" on a tablet (Ali, 19 Aug: "certainly on
  // Tablet — its a sheet that comes in and hangs on the right hand side").
  // Both are the DS's own side variants, so the animation, the edge border
  // and the sizing come from the component; only the choice is ours.
  side = "bottom",
  open,
  onOpenChange,
  sourceOptions,
  sourceFilter,
  setSourceFilter,
  ratingOptions,
  ratingFilter,
  setRatingFilter,
  period,
  setPeriod,
  facetCount,
  onClear,
  resultCount,
  sourceCount,
  ratingCount,
}) {
  const toggle = (sel, setSel, id) =>
    setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);

  // OPEN AT THE TOP. cmdk marks an item active and scrolls it into view; with
  // three lists in ONE scroll region the last to mount won, so the sheet
  // opened part-way down Sources, past the section deliberately put first.
  // value="" on each Command (below) leaves nothing active, so there is
  // nothing to scroll to — a controlled empty value, not a race with rAF,
  // which cmdk simply re-ran after. Arrow keys still work: cmdk sets its
  // value on the first ArrowDown.
  //
  // Belt and braces: reset the scroll when the sheet opens, since a stale
  // scrollTop survives a close/reopen of the same mounted node.
  const scrollRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  // A search field per section, but only once a list is long enough to need
  // one (Ali, 19 Aug: "potential for the sources to be particularly large").
  // At four sources it would be chrome; at twenty it is the only way to find
  // one. cmdk does the filtering, so this costs a prop.
  const SEARCH_FROM = 8;

  // SECTION TITLES SIT ABOVE THE COMMAND, ONE STEP UP THE DS TYPE SCALE.
  // They were CommandGroup's own `heading` slot, which put them at exactly
  // the treatment nested groups get — so "Rating" and its child "Facebook"
  // were the same size and colour, and so were "Source" and "No reviews yet"
  // (Ali, 19 Aug: "the Command group title is maybe a bit small and also
  // clashes with… essentially Children of Rating and Source").
  //
  // TypographySmall is text-sm font-medium in FOREGROUND against the group
  // heading's text-xs font-medium in MUTED: one step in size and one in
  // colour, which is enough to read as a parent without shouting.
  // TypographyH4 was the other candidate and is 18px rising to 24px — a page
  // heading, not a section label in a sheet. asChild so the DS supplies the
  // type and the markup is still an h3.
  const SectionTitle = ({ children }) => (
    <TypographySmall asChild>
      {/* px-3 lines the title up with the item labels: CommandGroup's p-1
          plus CommandItem's px-2. */}
      <h3 className="px-3 pt-1 pb-0.5">{children}</h3>
    </TypographySmall>
  );

  return (
    // DRAWER, NOT SHEET. Both ship in this DS and both do four edges; the
    // difference is the defaults (Ali, 19 Aug: "its kind of semantics really
    // — they do the same job, just depends which one has the sensible
    // defaults"). Drawer's are the ones this pattern wants: vaul underneath,
    // so a phone gets drag-to-dismiss; its own max-height, corner radius and
    // a DrawerBody that already carries padding and a max width — three
    // things the Sheet version had hand-set on it.
    //
    // The review panel uses the same component and the same direction rule,
    // so the screen has ONE overlay idiom rather than two.
    <Drawer open={open} onOpenChange={onOpenChange} direction={side}>
      {/* mt-0 and a 92svh cap on the bottom drawer: the DS's own bottom
          variant is mt-24 + max-h-[80vh], which puts a 96px band of backdrop
          above it — the gap that read as the drawer failing to reach the top
          (Ali, 19 Aug). The right-hand drawer is full height by definition
          and takes neither. */}
      <DrawerContent
        dataHook="filter-drawer"
        className={`flex flex-col ${side === "bottom" ? BOTTOM_DRAWER_HANDLE : "h-full"}`}
        style={side === "bottom" ? BOTTOM_DRAWER_STYLE : undefined}
      >
        {/* flex-row + items-center is what puts the close ON the title's
            line. DrawerHeader is flex-col p-4 text-center sm:text-left, so
            left-aligning is the same override the Sheet needed.
            The close is a DS ghost icon Button, not a bare icon: Sheet's
            built-in X is absolutely positioned at top-4 right-4 with an
            opacity-70 → 100 hover, which never lines up with a title in a
            padded header and barely reads as hoverable (Ali, 19 Aug: "the
            close icon needs a hover state, and to be centrally aligned with
            the title"). Drawer ships no close at all, so this one is ours to
            get right: a real Button brings its own hover surface and focus
            ring. */}
        {/* ONE SHEET HEADER FOR THE WHOLE PRODUCT (Ali, 7 Sep). SheetHeader
            from the registry; py-2 under the bottom sheet's handle is the one
            local nuance it keeps (Ali, 19 Aug: "too much padding at the
            bottom"). The review panel below keeps its own header because it
            is a prev/next nav, not a title. */}
        <SideSheetHeader
          title="Filters"
          dataHook="filters-sheet-header"
          closeHook="close-filters"
          closeLabel="Close filters"
          className={side === "bottom" ? "py-2!" : ""}
        />

        {/* DrawerBody supplies the container padding and max width; it does
            NOT scroll, so the overflow rules are still ours. px-1 rather than
            its px-4 keeps every text edge on 16px: the section title adds
            px-3, and a row adds CommandGroup's p-1 plus CommandItem's px-2.
            min-h-0 so the body can shrink instead of pushing the footer off.
            Scrollbar takes --border, the token the DS's own ScrollBar thumb
            uses. */}
        <DrawerBody
          ref={scrollRef}
          className="mt-0 flex min-h-0 grow flex-col gap-2 overflow-y-auto px-1 py-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
        >
          {/* PERIOD FIRST, SOURCES LAST (Ali, 19 Aug: "it should be time,
              rating, sources… sources could be the largest list… people are
              short on time to manage this"). Time is the cheapest decision
              and narrows the most, so it earns the top of the sheet, and the
              longest list goes last where scrolling past it costs nothing.
              Period is single-select — no All row, since PERIODS carries its
              own "All time" — so it draws a check rather than a checkbox. */}
          <SectionTitle>Period</SectionTitle>
          <Command className={SHEET_COMMAND_CLASS} value="" dataHook="drawer-period-command">
            <CommandList>
              <FacetOptions
                options={PERIODS}
                isChecked={(id) => period === id}
                onOption={(id) => setPeriod(id)}
                select="single"
                dataHook="drawer-period"
              />
            </CommandList>
          </Command>

          <Separator />

          <SectionTitle>Rating</SectionTitle>
          <Command className={SHEET_COMMAND_CLASS} value="" dataHook="drawer-ratings-command">
            <CommandList>
              <FacetOptions
                options={ratingOptions}
                isChecked={(id) => ratingFilter.includes(id)}
                isAllSelected={ratingFilter.length === 0}
                onAll={() => setRatingFilter([])}
                onOption={(id) => toggle(ratingFilter, setRatingFilter, id)}
                allLabel="All ratings"
                allCount={ratingCount}
                dataHook="drawer-rating"
              />
            </CommandList>
          </Command>

          <Separator />

          <SectionTitle>Source</SectionTitle>
          <Command className={SHEET_COMMAND_CLASS} value="" dataHook="drawer-sources-command">
            {sourceOptions.length >= SEARCH_FROM ? (
              <CommandInput dataHook="drawer-sources-search" placeholder="Find a source" />
            ) : null}
            <CommandList>
              <CommandEmpty>No matches</CommandEmpty>
              <FacetOptions
                options={sourceOptions}
                isChecked={(id) => sourceFilter.includes(id)}
                isAllSelected={sourceFilter.length === 0}
                onAll={() => setSourceFilter([])}
                onOption={(id) => toggle(sourceFilter, setSourceFilter, id)}
                allLabel="All sources"
                allCount={sourceCount}
                dataHook="drawer-source"
              />
            </CommandList>
          </Command>
        </DrawerBody>

        <DrawerFooter className="flex-row items-center gap-2 border-t p-4">
          <Button
            variant="ghost"
            dataHook="drawer-clear"
            onClick={onClear}
            disabled={facetCount === 0}
          >
            Clear all
          </Button>
          <div className="grow" />
          <Button dataHook="drawer-apply" onClick={() => onOpenChange(false)}>
            Show {resultCount} {resultCount === 1 ? "review" : "reviews"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ReviewsInbox() {
  const business = useBusinessName();
  const stickyTop = useStickyHeaderOffset("reviews-page-header");
  // The column headers pin UNDER the sticky tabs-and-filters band, so they
  // need its height, which changes with the filter row's wrapping.
  const bandRef = useRef(null);
  const [bandHeight, setBandHeight] = useState(0);
  useEffect(() => {
    const el = bandRef.current;
    if (!el) return undefined;
    const measure = () => setBandHeight(Math.round(el.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const persona = usePersona();
  const locationKey = useLocationKey();
  // The first-run band above this card (ReviewPlanStrip, which renders
  // FirstRunBand for the empty persona) carries its own "Connect a review
  // site" button, and only when contextual insights are on. The empty inbox
  // has to know, or the page asks for the same thing twice (Ali, 17 Sep: "We
  // dont need to have two empty states").
  const { settings } = useDemo();
  // Worked out once from this persona's own rows, and read by the seeded
  // failure below, by the send handler and by the draft that survives it.
  const seedRows = seedRowsFor(persona, locationKey);
  const demoFailureIds = demoFailureIdsFor(seedRows);
  const simulatedFailures = simulatedFailuresFor(demoFailureIds);
  const seededSendError = seededSendErrorFor(demoFailureIds);
  const [reviews, setReviews] = useState(() =>
    seedRows.map(([source, name, rating, text, date, status, aiDraft], i) => ({
      id: `r${i}`,
      source,
      name,
      rating,
      text,
      date,
      daysAgo: daysAgo(date),
      status,
      aiDraft,
      reply: status === "manual" || status === "auto" ? DEFAULT_TEMPLATES[0].body : "",
      // WHEN THE REPLY WENT OUT (7 Sep). The seed only ever carried the
      // review's own date, because it was built to demo the inbox rather than
      // to report on it. Any real system records this, so the absence was our
      // gap, not the product's.
      //
      // AUTO IS NOT INVENTED: the auto-reply rule on the Reply Templates page
      // states its own delay, delayMinutes 60, "Replies 1 hour after the review
      // arrives". So an auto reply is exactly an hour after the review.
      // MANUAL IS UNKNOWN, and stays null until someone says what it is.
      // I had it as 3 + (i * 7) % 48 hours, which was invented, and then
      // reported "90% replied within 24 hours" off the back of it as though
      // that were a finding. It was an artefact of the made-up numbers.
      // Anything derived from this field must therefore say it covers AUTO
      // replies only, or wait for real manual times.
      repliedHours: status === "auto" ? 1 : null,
      // null on every row but the seeded one. The status stays "needs" for
      // that row too. See SEND_FAILURES for why a failure is a field and
      // not a status.
      sendError:
        `r${i}` === seededSendError.id
          ? {
              code: seededSendError.code,
              at: TODAY.getTime() - seededSendError.hoursBefore * 3600000,
            }
          : null,
    })),
  );
  // Read-only on this screen: the reply drawer offers these, the Reply
  // Templates page owns editing them.
  const templates = DEFAULT_TEMPLATES;

  const [tab, setTab] = useState("all");
  const [sourceFilter, setSourceFilter] = useState([]);
  const [ratingFilter, setRatingFilter] = useState([]);
  const [period, setPeriod] = useState("all");
  const [menu, setMenu] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // Narrow viewports collapse the row to ONE column and stack its parts,
  // rather than letting six columns compress into unreadable slivers or
  // push the table into horizontal scroll. Driven by matchMedia and fed to
  // TanStack's columnVisibility, because a DataTable cell is a <td> — CSS
  // alone can hide the cell's CONTENT but the empty <td> keeps its width.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // A SECOND breakpoint, deliberately not the same one. Columns collapse at
  // sm because that is where a six-column table stops being readable. The
  // FILTERS collapse up to lg (Ali, 19 Aug: "would maybe even put it on
  // tablet as well to test"), because a tablet has room for the row but the
  // sheet turns out to be the better way to filter at any width where the
  // row would wrap. Tying them together would drag the table columns back
  // whenever we retune the filters, which are different questions.
  const [compactFilters, setCompactFilters] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setCompactFilters(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // The seeded failure opens with the reply that failed STILL IN THE BOX.
  // A draft that disappears with the error is the complaint this whole
  // state exists to answer, so the seed has to demonstrate it surviving.
  // It reuses DEFAULT_TEMPLATES[0], same as the pre-replied rows above.
  const [drafts, setDrafts] = useState(() => {
    if (!seededSendError.id) return {};
    const seed = seedRows[Number(seededSendError.id.slice(1))];
    if (!seed) return {};
    return {
      [seededSendError.id]: resolveVars(DEFAULT_TEMPLATES[0].body, { name: seed[1] }, business),
    };
  });
  const [aiSeeded, setAiSeeded] = useState({});
  const [aiRemaining, setAiRemaining] = useState(AI_DRAFT_QUOTA);
  const [aiPending, setAiPending] = useState(false);

  // idle -> sending -> sent | failed. Only "sending" needs to be held in
  // state: "sent" closes the panel and "failed" is written onto the review
  // as sendError, which is what makes it survive the close. One flag rather
  // than a per-id map because only the open review can be sending.
  const [sending, setSending] = useState(false);
  // THE REVIEW WHOSE REPLY JUST WENT. Held so the drawer can mark the moment
  // instead of closing on a success. Cleared whenever the open review changes,
  // which covers Close too, since closing sets activeId to null.
  const [sentId, setSentId] = useState(null);
  // Attempts per review, so SIMULATED_FAILURES can fail the first send and
  // let the retry through. Demo wiring; a real send would not count.
  const [sendAttempts, setSendAttempts] = useState({});
  const sendTimer = useRef(null);
  const cancelSend = () => {
    if (sendTimer.current) clearTimeout(sendTimer.current);
    sendTimer.current = null;
  };
  useEffect(() => cancelSend, []);

  const counts = useMemo(() => {
    const c = { all: reviews.length, needs: 0, manual: 0, auto: 0, skipped: 0 };
    reviews.forEach((r) => {
      c[r.status] += 1;
    });
    return c;
  }, [reviews]);

  // NOTHING HAS ARRIVED AT ALL, which is not the same thing as nothing
  // matching (Ali, 20 Sep: "we will actually need an empty state for the
  // Review Manager homepage as well, no reviews"). This is every new
  // customer's landing view, so the card says what the page is for instead of
  // drawing a header row, a pager and five tabs of zeroes over nothing.
  const inboxEmpty = reviews.length === 0;
  const firstRunBand = settings.insights !== false && persona.engagement === "empty";

  const periodOption = PERIODS.find((p) => p.id === period);

  const base = useMemo(
    () =>
      reviews.filter(
        (r) =>
          (tab === "all" || r.status === tab) &&
          matchesPeriod(periodOption, r.daysAgo),
      ),
    [reviews, tab, periodOption],
  );

  const matchesSource = (r) => sourceFilter.length === 0 || sourceFilter.includes(r.source);
  const matchesRating = (r) => ratingFilter.length === 0 || ratingFilter.includes(String(r.rating));

  const sourceBase = useMemo(() => base.filter(matchesRating), [base, ratingFilter]);
  const ratingBase = useMemo(() => base.filter(matchesSource), [base, sourceFilter]);

  // Sort control dropped (Ali, 17 Aug), reinstated on the pagination row
  // (Ali, 27 Aug): "filtering gives you most of what you need. We could
  // include a sort though on the pagination row." So it is a small ordering
  // control next to pagination, NOT a fourth facet in the filter row.
  // Date is newest-first; Rating is highest-first with date breaking ties.
  // SORTING LIVES IN THE TABLE (Ali, 17 Sep: "bring back the table headers
  // now in Review Manager - its a data table so that automatically includes
  // sorting"). The DS sortable headers drive it from sm up; the Order menu
  // stays for phones, where the columns fold into one cell and there is no
  // header to press, and reads and writes the same sorting state.
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const ORDER_SORTING = {
    "date-desc": [{ id: "date", desc: true }],
    "date-asc": [{ id: "date", desc: false }],
    "rating-desc": [{ id: "rating", desc: true }],
    "rating-asc": [{ id: "rating", desc: false }],
  };
  const order =
    Object.keys(ORDER_SORTING).find(
      (id) => ORDER_SORTING[id][0].id === sorting[0]?.id && ORDER_SORTING[id][0].desc === sorting[0]?.desc,
    ) ?? "date-desc";
  const setOrder = (id) => setSorting(ORDER_SORTING[id]);
  const data = useMemo(
    () => base.filter((r) => matchesSource(r) && matchesRating(r)),
    [base, sourceFilter, ratingFilter],
  );
  // ASSUMPTION: a recommendation sorts among the stars, Recommended as 5 and
  // Not recommended as 1, so Highest rated puts praise first either way.
  const ratingRank = (rating) => (rating === "up" ? 5 : rating === "down" ? 1 : Number(rating) || 0);
  const STATUS_RANK = { needs: 0, manual: 1, auto: 2, skipped: 3 };

  const columns = useMemo(
    () => [
      {
        accessorKey: "source",
        enableGlobalFilter: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Source" dataHook="col-source" />,
        sortingFn: (a, b) => SOURCES[a.original.source].name.localeCompare(SOURCES[b.original.source].name),
        cell: ({ row }) => (
          <div onClick={() => setActiveId(row.original.id)}>
            <span className="flex items-center gap-2">
              <SourceMark source={SOURCES[row.original.source]} />
              {/* A SIZE DOWN (Ali, 6 Sep). The mark beside it already says
                  which site this is; the word is the fallback for anyone who
                  does not read logos, so it should sit under the review text
                  rather than level with it. */}
              {/* ONE LINE, WITH A CEILING (Ali, 17 Sep: "is this wrapping on
                  purpose?", then "the provider would have to have a max width").
                  It was not on purpose. No width is set on this column, so the
                  table sized it to about 110px and "Apple Maps" broke onto two
                  lines at every width. Nowrap alone would let one long site name
                  push the whole column out, and BrightLocal lists 80-plus sites,
                  so it stops at 120px and ellipsises past that, with the full
                  name on hover. Every site currently in the data fits. */}
              <span
                className="hidden max-w-[7.5rem] truncate text-xs lg:inline"
                title={SOURCES[row.original.source].name}
              >
                {SOURCES[row.original.source].name}
              </span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "rating",
        enableGlobalFilter: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" dataHook="col-rating" />,
        sortingFn: (a, b) => ratingRank(a.original.rating) - ratingRank(b.original.rating),
        cell: ({ row }) => (
          <div onClick={() => setActiveId(row.original.id)}>
            <RatingValue rating={row.original.rating} hook={`stars-${row.id}`} />
          </div>
        ),
      },
      {
        id: "text",
        // name + text so the reviewer's name stays searchable — it is only
        // rendered inside another cell, so it has no accessor of its own.
        // The cell reads row.original, so this is invisible to rendering.
        accessorFn: (r) => `${r.name} ${r.text}`,
        header: () => "Review",
        enableSorting: false,
        cell: ({ row }) => (
          // Carries the open-row marker that the select cell used to. This
          // is the only column visible at every width — source/rating/
          // status/date all collapse into it when narrow — so the
          // [&_tbody_tr:has([data-open-row])]:bg-accent highlight on
          // DataTable keeps working in both layouts.
          <div
            onClick={() => setActiveId(row.original.id)}
            className="min-w-0"
            data-open-row={row.original.id === activeId ? "true" : undefined}
          >
            {isNarrow ? (
              <div className="flex min-w-0 flex-col gap-1 py-1">
                <span className="text-muted-foreground flex items-center gap-2 text-xs">
                  <SourceMark source={SOURCES[row.original.source]} />
                  {SOURCES[row.original.source].name}
                  <RatingValue rating={row.original.rating} hook={`stars-${row.id}`} />
                  <span className="ml-auto whitespace-nowrap">
                    {shortDate(row.original.date)}
                  </span>
                </span>
                <span className="line-clamp-2 text-sm">{row.original.text}</span>
                <span>
                  {/* sendError has to be threaded through HERE as well as
                      into the status column: the status column is hidden
                      when narrow, so this stacked cell is the only place a
                      failed reply shows on a phone. */}
                  <StatusChip
                    status={row.original.status}
                    hook={`status-${row.id}`}
                  />
                </span>
              </div>
            ) : (
              <span className="line-clamp-1 text-sm">{row.original.text}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        enableGlobalFilter: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" dataHook="col-status" />,
        sortingFn: (a, b) => (STATUS_RANK[a.original.status] ?? 9) - (STATUS_RANK[b.original.status] ?? 9),
        cell: ({ row }) => (
          <div onClick={() => setActiveId(row.original.id)}>
            <StatusChip
              status={row.original.status}
              hook={`status-${row.id}`}
            />
          </div>
        ),
      },
      {
        accessorKey: "date",
        enableGlobalFilter: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" dataHook="col-date" />,
        // daysAgo counts back from today, so a smaller number is newer.
        sortingFn: (a, b) => b.original.daysAgo - a.original.daysAgo,
        cell: ({ row }) => (
          <div onClick={() => setActiveId(row.original.id)}>
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              {shortDate(row.original.date)}
            </span>
          </div>
        ),
      },
    ],
    [activeId, isNarrow],
  );

  const table = useDataTable({
    columns,
    data,
    getRowId: (row) => row.id,
    enableGlobalFiltering: true,
    sorting,
    onSortingChange: setSorting,
    enablePagination: true,
    // TWENTY (Ali, 6 Sep). Twelve was the number that happened to fill the
    // first screen; twenty is a page you scroll once, and it matches the
    // pagination rule the campaigns table already follows.
    pageSize: 20,
  });

  useEffect(() => {
    // The stacked cell absorbs these four, so hide the columns themselves —
    // otherwise their <td>s still claim width and the table overflows.
    const collapsed = { source: false, rating: false, status: false, date: false };
    table.setColumnVisibility(
      isNarrow ? collapsed : { source: true, rating: true, status: true, date: true },
    );
  }, [isNarrow, table]);

  // Search text lives in the table's global-filter state now, so both of
  // these have to sit below `table`.
  const activeFilters =
    (sourceFilter.length > 0 ? 1 : 0) +
    (ratingFilter.length > 0 ? 1 : 0) +
    (period !== "all" ? 1 : 0) +
    (table.getState().globalFilter ? 1 : 0);

  // TWO DIFFERENT SENTENCES, and the filters win over the tab: clearing them
  // is the way back, and the button under the table offers exactly that.
  const noResultsMessage =
    activeFilters > 0 ? "No reviews match these filters." : TAB_EMPTY[tab] ?? "No reviews match.";

  const clearFilters = () => {
    table.resetGlobalFilter();
    setSourceFilter([]);
    setRatingFilter([]);
    setPeriod("all");
  };

  const pagination = table.getState().pagination;
  // ROWS THE TABLE IS ACTUALLY SHOWING, which is not data.length. The search
  // is the table's own global filter, so `data` still counts the rows a search
  // has just hidden, and a search is the commonest way to empty this list.
  // getRowCount is the filtered, pre-pagination count: the same number the
  // filter sheet reads for "Show n reviews".
  const shownRows = table.getRowCount();
  // The list is narrowed down to nothing, which the table's own no-results row
  // covers. Kept separate from inboxEmpty because the answer is different: one
  // is "undo that", the other is "here is what this page is for".
  const noMatches = !inboxEmpty && shownRows === 0;

  // WHAT IS LEFT TO REPLY TO ON THE ACCOUNT: still needing action, on a
  // source this screen can post to. The review just answered counts itself
  // out, because setStatus has already moved it to "manual".
  // SCOPED TO THE INBOX, not to the rows on screen. A tab or a facet is a way
  // of looking at the work, not a statement about how much of it is left:
  // scoped to the view, a reply sent from the Skipped tab (where a queue is
  // empty by construction) would throw the confetti for an empty queue with
  // twenty reviews still waiting on Needs action. So "3 more reviews need a
  // reply" means three anywhere in the inbox.
  const replyQueue = useMemo(
    () => reviews.filter((r) => r.status === "needs" && canReply(r)),
    [reviews],
  );

  // WHAT IS LEFT THAT THIS SCREEN CANNOT ANSWER: still needing action, on a
  // source that only takes replies on its own site. Four rows on the engaged
  // account, on Apple Maps, Yahoo! Local and TripAdvisor. They have no Send
  // and no Skip, by the design of the read-only panel, so nothing a person
  // does here ever moves them out of Needs action.
  const waitingElsewhere = useMemo(
    () => reviews.filter((r) => r.status === "needs" && !canReply(r)),
    [reviews],
  );

  // HOW MANY ARE WAITING, in the terms the rest of the product uses: every
  // row still needing action, on any source. replyQueue is narrower on
  // purpose, because it is what Next opens and Next cannot land on a review
  // this screen has no way to post to, but COUNTING by that narrower rule
  // made the panel say 21 while the Needs action tab right behind it, and
  // the hub card in front of it, both said 25 (Ali, 20 Sep). The gap was the
  // four Needs action rows on read-only sources. The count and the queue
  // answer two different questions, so they are two different things.
  //
  // THE COUNT IS ALL IT DECIDES. Letting it decide "that was the last one"
  // too broke the state machine: the four read-only rows can never leave
  // Needs action, so the total floored at four, the final state was
  // unreachable, and the last reply on the account landed on a panel saying
  // four still needed answering with only Close under it. The sentence
  // counts every waiting review; whether this was the last one is settled by
  // replyQueue, which is the work this screen can actually do.
  const needsReply = useMemo(
    () => reviews.filter((r) => r.status === "needs").length,
    [reviews],
  );

  const active = activeId ? reviews.find((r) => r.id === activeId) : null;
  const activeIndex = activeId ? data.findIndex((r) => r.id === activeId) : -1;

  const goTo = (i) => {
    if (i < 0 || i >= data.length) return;
    setActiveId(data[i].id);
    const targetPage = Math.floor(i / pagination.pageSize);
    if (targetPage !== pagination.pageIndex) table.setPageIndex(targetPage);
  };

  // The open review, once its reply has gone. Null the rest of the time, and
  // null again the moment the person moves to another review or closes.
  const sent = active && sentId === active.id ? active : null;
  // THE TOP OF THE QUEUE, not the row after this one: the review just
  // answered may have left the list already (the Needs action tab drops it
  // the moment it is replied to), so "the one below" is not a position that
  // survives the send. An inbox is worked from the top, so the top is where
  // Reply to the next one goes.
  const nextNeeds = replyQueue[0] ?? null;
  // WHERE THE REST OF THE WORK IS once this screen has run out of its own:
  // the first Needs action row on a read-only source. Only offered when
  // there is no next reply to write, and it is the whole reason the last
  // reply no longer dead-ends. A panel that says four are still waiting owes
  // the person a door to them, and the read-only panel is that door: it
  // names the source and carries Open in Apple Maps.
  const nextElsewhere = nextNeeds ? null : (waitingElsewhere[0] ?? null);
  const openInQueue = (review) => {
    if (!review) return;
    // NEXT LANDS ON A ROW THE TABLE IS SHOWING. The top of the queue can sit
    // behind the tab you are standing on or a facet you set, so the view goes
    // back to the top of Needs action before the review opens, rather than
    // putting a row in the drawer that is not in the table behind it.
    setTab("needs");
    clearFilters();
    table.setPageIndex(0);
    setActiveId(review.id);
  };

  const draft = activeId && drafts[activeId] !== undefined ? drafts[activeId] : "";
  const setDraft = (text) => setDrafts((d) => ({ ...d, [activeId]: text }));

  const draftWithAi = () => {
    if (!active || aiPending) return;
    const id = active.id;
    const text = resolveVars(active.aiDraft, active, business);
    if (!aiSeeded[id]) {
      if (aiRemaining <= 0) return;
      setAiRemaining((n) => n - 1);
      setAiSeeded((s) => ({ ...s, [id]: true }));
    }
    // The draft is canned, so without a beat the button's loading state
    // would never be visible. Generation is the one thing in this screen a
    // user waits on, so it should look like it.
    setAiPending(true);
    setTimeout(() => {
      setDrafts((d) => ({ ...d, [id]: text }));
      setAiPending(false);
    }, 900);
  };

  // Any deliberate move on a review clears its failure: a send that lands, a
  // skip, an edit, a delete. All four are the person dealing with it, and a
  // stale "Reply failed" badge on a row they have since handled is worse
  // than no badge at all.
  const setStatus = (id, status, reply) =>
    setReviews((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, status, sendError: null, reply: reply !== undefined ? reply : r.reply }
          : r,
      ),
    );

  const failSend = (id, code) =>
    setReviews((rs) =>
      rs.map((r) => (r.id === id ? { ...r, sendError: { code, at: Date.now() } } : r)),
    );

  // The one path a reply takes out of this screen. Latency is faked so the
  // pending state is actually visible, same reasoning as the AI draft
  // above, and the same 900ms.
  const sendReply = () => {
    if (!active || sending) return;
    const id = active.id;
    // Snapshotted now: the timeout closes over the draft as it was when the
    // button was pressed, which is also what a real request would send.
    const text = draft;
    const attempt = (sendAttempts[id] ?? 0) + 1;
    setSendAttempts((a) => ({ ...a, [id]: attempt }));
    // The old failure comes off the moment the retry starts, so the alert
    // does not sit there contradicting the spinner beneath it.
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, sendError: null } : r)));
    setSending(true);
    cancelSend();
    sendTimer.current = setTimeout(() => {
      sendTimer.current = null;
      setSending(false);
      const code = simulatedFailure(simulatedFailures, id, attempt);
      if (code) {
        // FAILED. The drawer stays open and the draft is left exactly as it
        // was. Retyping a reply you already wrote is the complaint behind
        // this whole state.
        failSend(id, code);
        return;
      }
      setStatus(id, "manual", text);
      // THE DRAWER STAYS OPEN ON A SUCCESS. It used to close here, which made
      // a reply that landed the quietest event on the screen: the overlay
      // went and a badge changed behind it.
      setSentId(id);
    }, 900);
  };

  // Moving to another review, or closing the panel, abandons an in-flight
  // send: the pending state belongs to the review that was open, and the
  // Send button in the footer is now pointing at a different record.
  useEffect(() => {
    cancelSend();
    setSending(false);
    setSentId(null);
  }, [activeId]);

  const orderLabel = ORDERS.find((o) => o.id === order)?.label ?? "Newest first";

  const sourceLabel =
    sourceFilter.length === 0
      ? "All sources"
      : sourceFilter.length === 1
        ? SOURCES[sourceFilter[0]].name
        : `${sourceFilter.length} sources`;
  const ratingLabel =
    ratingFilter.length === 0
      ? "All ratings"
      : ratingFilter.length === 1
        ? BUCKETS.find((b) => b.id === ratingFilter[0]).label
        : `${ratingFilter.length} ratings`;
  const periodLabel = PERIODS.find((p) => p.id === period).label;

  const menuState = (id) => ({
    open: menu === id,
    onOpenChange: (o) => setMenu(o ? id : null),
  });

  // ONE definition of each facet's options, read by BOTH the desktop
  // popover menus and the mobile sheet. Inline in the JSX they would be
  // written twice and drift the moment a count or a leading mark changed;
  // the whole point of the mobile collapse is that it filters the same
  // things by the same rules.
  const sourceOptions = useMemo(
    () =>
      Object.keys(SOURCES).map((s) => ({
        id: s,
        label: SOURCES[s].name,
        count: sourceBase.filter((r) => r.source === s).length,
        leading: <SourceMark source={SOURCES[s]} />,
      })),
    [sourceBase],
  );

  const bucketLeading = (bucket) => (
    <RatingValue
      rating={bucket.kind === "star" ? Number(bucket.id) : bucket.id}
      hook={`bucket-${bucket.id}`}
    />
  );

  const ratingOptions = BUCKETS.map((b) => ({
    id: b.id,
    label: b.label,
    count: ratingBase.filter((r) => String(r.rating) === b.id).length,
    leading: bucketLeading(b),
    group: b.kind === "star" ? undefined : SOURCES[RECOMMENDATION_SOURCE].name,
  }));

  // The badge on the mobile trigger counts what the SHEET holds, which is
  // not the same as activeFilters: search stays out on the row at every
  // width, so counting it here would show "1" over a sheet with nothing
  // set in it.
  const facetCount =
    (sourceFilter.length > 0 ? 1 : 0) +
    (ratingFilter.length > 0 ? 1 : 0) +
    (period !== "all" ? 1 : 0);

  const renderInbox = () => (
    <Card dataHook="review-inbox" density="condensed" className="max-w-none gap-0 p-0">
      {/* White (Ali, 10 Sep: "table header area white?"): tabs, filters and
          the order row sit on the card's own surface, divided by borders. */}
      <div ref={bandRef} className="bg-[var(--ds-tailwind-colors-base-white)] sticky z-30 rounded-t-[inherit]" style={{ top: stickyTop }}>
        {/* ROW 1, TITLE AND TABS (Ali, 17 Sep: the tabs "are almost a filter -
            can we move them to the right and include a title in the table
            called Reviews"). "Reviews" on the left, like every other card's
            title; the status tabs on the right, where the filters live, so
            the band reads as a title, then ways to narrow the list. py-3: the
            row holds a 36px strip, and 12px either side gives the title the
            room a card header has (the old tabs-only row was py-2, 53px).
            px-4 keeps the title on the table's first-column edge. On a phone
            the tabs wrap under the title and scroll sideways.
            The tabs are the DS Tabs AS SHIPPED (Ali, 17 Sep: "use the default
            tabs"): only layout classes on them. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
          <CardTitle size="small" dataHook="review-inbox-title">
            Reviews
          </CardTitle>
          {/* NO TABS WITH NOTHING TO SORT INTO. Five counts reading zero
              describe the furniture, not the account, and every one of them
              leads to the same nothing. The title stays, so the card is still
              a card with a name. */}
          {inboxEmpty ? null : (
          <Tabs
            dataHook="review-tabs"
            value={tab}
            onValueChange={(next) => {
              setTab(next);
              setActiveId(null);
            }}
            className="min-w-0 max-w-full"
          >
            <TabsList
              dataHook="review-tabs-list"
              className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id} dataHook={`tab-${t.id}`} className="shrink-0">
                  {t.label}
                  <Badge dataHook={`tab-count-${t.id}`} variant="secondary" data-number="true">
                    {counts[t.id]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          )}
        </div>

        {/* NEITHER ROW EARNS ITS PLACE WITH AN EMPTY INBOX. Both of them
            narrow a list, and a search field over no reviews invites typing
            into nothing. */}
        {inboxEmpty ? null : (
          <>
        {/* ROW 2 — FILTERS, own surface, always visible. Search leads, per
            the DS's own DataTablePage recipe (Toolbar > ToolbarLeft >
            DataTableSearch). */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
          <DataTableSearch
            table={table}
            dataHook="search-reviews"
            // size="sm" is the DS's own prop, per its DataTableToolbarLeft recipe,
            // so the field matches the sm filter buttons beside it.
            size="sm"
            placeholder="Search reviews"
            ariaLabel="Search reviews"
            // THE DS SEARCH AS SHIPPED (Ali, 17 Sep: "make sure our search input
            // is the default input out of DS"). The border-colour and type-size
            // overrides are gone; what is left is layout only. Below lg the
            // field grows into the row (basis-0 min-w-0 so it never pushes the
            // Filters button onto a second line); from lg it is a fixed 12rem
            // on the left of the filters.
            className="min-w-0 grow basis-0 lg:w-48 lg:grow-0 lg:basis-auto"
          />

          {/* SEARCH LEFT, FILTERS RIGHT (Ali, 17 Sep). The spacer sits between
              them from sm up; below sm the search field takes the row and
              the facets fold into the one Filters button. */}
          {compactFilters ? null : <div className="grow" />}

          {compactFilters ? (
            // ONE trigger for three facets. matchMedia, not a
            // CSS hide: rendering both and hiding one would mount two
            // copies of every facet's state and leave a hidden popover in
            // the tab order. The badge counts set facets, not search.
            <Button
              variant="outline"
              size="sm"
              dataHook="open-mobile-filters"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {facetCount > 0 ? (
                <Badge dataHook="mobile-filter-count" variant="secondary" data-number="true">
                  {facetCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}

          {compactFilters ? null : (
          <FacetedFilterMenu
            dataHook="facet-sources"
            align="right"
            label={sourceLabel}
            {...menuState("sources")}
            options={sourceOptions}
            isAllSelected={sourceFilter.length === 0}
            isChecked={(id) => sourceFilter.includes(id)}
            onAll={() => setSourceFilter([])}
            onOption={(id) =>
              setSourceFilter((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]))
            }
            allLabel="All sources"
            allCount={sourceBase.length}
            search
            searchPlaceholder="Find a source"
          />
          )}

          {compactFilters ? null : (
          <FacetedFilterMenu
            dataHook="facet-ratings"
            align="right"
            label={ratingLabel}
            {...menuState("ratings")}
            options={ratingOptions}
            isAllSelected={ratingFilter.length === 0}
            isChecked={(id) => ratingFilter.includes(id)}
            onAll={() => setRatingFilter([])}
            onOption={(id) =>
              setRatingFilter((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]))
            }
            allLabel="All ratings"
            allCount={ratingBase.length}
            panelWidth="w-72"
          />
          )}

          {compactFilters ? null : (
          <SingleSelectMenu
            dataHook="facet-period"
            // Last control on the right of the filter row, and the panel is
            // wider than the trigger, so it hangs from the trigger's right
            // edge like the sources and ratings menus beside it.
            align="right"
            label={periodLabel}
            {...menuState("period")}
            options={PERIODS}
            value={period}
            onSelect={(id) => {
              setPeriod(id);
              setMenu(null);
            }}
          />
          )}

          {!compactFilters && activeFilters > 0 ? (
            <Button variant="ghost" size="sm" dataHook="clear-filters" onClick={clearFilters}>
              Clear all
              <Badge dataHook="active-filter-count" variant="secondary" data-number="true">
                {activeFilters}
              </Badge>
            </Button>
          ) : null}

        </div>

        {/* ROW 3, ORDER: phones only (Ali, 17 Sep). From sm up the column
            headers sort; below it the columns fold into one cell, so this
            menu is the way to sort there. Pagination moved under the table. */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 sm:hidden">
          {/* Order takes the slot the "n of N selected" summary had. The
              label is a plain <span>, not a <Label>: there is no form
              control with an id to point at — the trigger is a popover
              button, and htmlFor pointing at it would be a lie to a screen
              reader. SingleSelectMenu already carries its own name. */}
          <span className="text-muted-foreground text-sm" data-hook="order-label">
            Order
          </span>
          <SingleSelectMenu
            dataHook="facet-order"
            label={orderLabel}
            {...menuState("order")}
            options={ORDERS}
            value={order}
            onSelect={(id) => {
              setOrder(id);
              setMenu(null);
            }}
          />

        </div>
          </>
        )}
      </div>

      {/* THE DEFAULT VIEW FOR EVERY NEW CUSTOMER (Ali, 20 Sep: "we will
          actually need an empty state for the Review Manager homepage as
          well, no reviews"). The shared EmptyState, the same one the Reply
          templates page uses, in place of the table: a header row over
          nothing, a pager reading 0 of 0 and five zero counts say what the
          furniture is rather than what the account is.
          The two actions are the product's own first two steps, connect then
          ask, pointed at the screens lib/first-run.ts already sends a
          first-run account to. They stand down when the "Why it matters"
          band is above the card, because that band carries the same primary
          action and the page should not ask twice. */}
      {inboxEmpty ? (
        <EmptyState
          icon={Star}
          dataHook="inbox-empty-state"
          title="No reviews yet"
          description={
            // The band above says this at length and in nearly these words,
            // so with it on screen the card only has to say the list is
            // empty. With it off, this line is the only explanation there is.
            firstRunBand
              ? "Connected review sites fill this list on their own."
              : "Every review from the sites you connect lands here, ready to answer. Connect one and anything already written about you appears within a day."
          }
          action={
            firstRunBand ? null : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* data-grade-goto sits on a WRAPPER, not on the Button: see
                    the page header's actions for why. */}
                <span className="inline-flex" data-grade-goto={CONNECT_GOTO}>
                  <Button variant="primary" dataHook="inbox-empty-connect">
                    Connect a review site
                  </Button>
                </span>
                <span className="inline-flex" data-grade-goto={ASK_GOTO}>
                  <Button variant="outline" dataHook="inbox-empty-ask">
                    Ask customers for reviews
                  </Button>
                </span>
              </div>
            )
          }
        />
      ) : (
      <>
      <div style={{ "--th-top": `${stickyTop + bandHeight}px` }}>
      <DataTable
        table={table}
        dataHook="reviews-table"
        noResultsMessage={noResultsMessage}
        // The open-row highlight rides TableRow's own `transition-colors
        // duration-fast`, so it fades in and out for free as you page.
        // first-child pl-4 replaces the left inset the select column used
        // to provide (its cell carried pl-2 plus the checkbox's own width).
        // Without it the source icon sits at the card edge + the DS td's own
        // 8px, 8px short of the toolbars above, which are all px-4. Keyed off
        // :first-child rather than the source cell because source/rating/
        // status/date all collapse when narrow and `text` becomes column one.
        // HEADERS SHOWN AND PINNED (Ali, 17 Sep). The row that was sr-only is
        // the DS header again, sortable, and sticks under the tabs-and-filters
        // band at --th-top. Sticky needs the page to be the scroller, so the
        // DataTable's own overflow wrappers are cleared, and a <th> only
        // sticks with separated borders, so the row rules move onto the
        // cells. Below sm the columns fold into one cell and the header row
        // hides: there is nothing in it to sort.
        className="rounded-none border-0 overflow-visible [&>div]:overflow-visible [&_table]:border-separate [&_table]:border-spacing-0 [&_thead_th]:sticky [&_thead_th]:top-[var(--th-top,0px)] [&_thead_th]:z-20 [&_thead_th]:border-b [&_tbody_td]:border-b [&_tbody_tr:last-child_td]:border-b-0 max-sm:[&_thead]:hidden [&_thead_th:first-child]:pl-4 [&_tbody_tr]:cursor-pointer [&_tbody_tr:hover]:bg-muted/50 [&_tbody_tr:has([data-open-row])]:bg-accent [&_tbody_tr:last-child]:border-0 [&_tbody_td:first-child]:pl-4"
      />
      </div>

      {/* THE WAY BACK, AND ONLY WHERE THERE IS NOT ONE ALREADY. From lg the
          filter row carries "Clear all" with its count, in view above the
          short empty table; below lg the facets fold into a sheet and that
          button goes with them, so the message would be left with no control
          anywhere on screen. One action, one place. */}
      {compactFilters && noMatches && activeFilters > 0 ? (
        <div className="flex justify-center px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            dataHook="clear-filters-empty"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      ) : null}
      </>
      )}

      {/* PAGINATION PINNED TO THE BOTTOM (Ali, 17 Sep: "I want the same on
          Review Manager", the Internal feedback table's bar). position:
          sticky at bottom 0: while the card's end is below the fold the bar
          holds the bottom of the screen, and once the end scrolls into view
          it rests there. White and bordered like the top band, above the
          rows. It moved out of the Order row, so the count and the pages
          sit where you finish reading the page of reviews.
          It stands down over no rows, whichever kind of nothing it is: "1 to 0
          of 0" beside a disabled pair of arrows is counting for the sake of
          it. */}
      {shownRows === 0 ? null : (
      <div className="bg-[var(--ds-tailwind-colors-base-white)] sticky bottom-0 z-20 rounded-b-[inherit] border-t px-4 py-2">
        <DataTablePagination
          table={table}
          dataHook="reviews-pagination"
          ariaLabel="Review pagination"
          renderRowCount={({ startRow, endRow, totalRows }) =>
            `${startRow} to ${endRow} of ${totalRows}`
          }
        />
      </div>
      )}
    </Card>
  );

  return (
    <div className="pb-10">
      {renderInbox()}

      <FilterDrawer
        side={isNarrow ? "bottom" : "right"}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        sourceOptions={sourceOptions}
        sourceCount={sourceBase.length}
        ratingCount={ratingBase.length}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        ratingOptions={ratingOptions}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        period={period}
        setPeriod={setPeriod}
        facetCount={facetCount}
        onClear={clearFilters}
        resultCount={table.getRowCount()}
      />

      {/* THE REVIEW PANEL IS A DRAWER TOO (Ali, 19 Aug: "I like the drawer
          close for the filters — can we have the same for opening up an
          individual item?"). Same direction rule as the filters: a bottom
          drawer on a phone, a right-hand one from sm up. One overlay idiom
          on the screen now, which is the earlier open question closed. */}
      <Drawer
        open={active !== null}
        onOpenChange={(o) => (o ? null : setActiveId(null))}
        direction={isNarrow ? "bottom" : "right"}
      >
        {/* WIDTH. The DS right-hand drawer is a flat 384px
            (data-[direction=right]:sm:max-w-sm), which is 30% of a 1280
            canvas and was cramped once the panel carried a review, a
            composer and a failure alert. Now half the page, floored at
            today's 384 so smaller desktops never LOSE width, capped at
            640 because a reply box wider than that runs the line length
            past comfortable (Ali, 27 Aug).
            The override has to repeat the data-[direction=right] variant:
            the DS class is data-[...]:sm:max-w-sm, and a plain sm:max-w-*
            loses on specificity to an attribute-qualified one. Matching
            the variant chain also lets tailwind-merge displace it rather
            than emit both. */}
        <DrawerContent
          dataHook="review-panel"
          className={`flex flex-col ${isNarrow ? BOTTOM_DRAWER_HANDLE : `h-full ${DRAWER_WIDTH}`}`}
          style={isNarrow ? REVIEW_DRAWER_STYLE : undefined}
        >
          {/* Same header shape as the filter drawer: nav on the left, a real
              close Button on its centre line. The title stays screen-reader
              only — the panel's subject is the review itself, and PanelNav
              already says which one you are on — but Drawer, like Dialog,
              needs a title in the tree or it warns and leaves the panel
              unnamed for assistive tech. */}
          <DrawerHeader
            className={`max-w-none flex-row items-center justify-between gap-2 border-b px-4 text-left ${
              isNarrow ? "py-2" : "py-3"
            }`}
          >
            <span className="sr-only">
              <DrawerTitle>Review</DrawerTitle>
            </span>
            {/* The pager stands down for the success moment: the review just
                answered can have left the list already (the Needs action tab
                drops it as soon as it is replied to), which would leave the
                counter reading 0 of N. It hands the slot to a label rather
                than to an empty span: a strip carrying nothing but the close
                X reads as a header that failed to render (Ali, 20 Sep), and
                it read that way on every tab, since the tab that keeps the
                review would have shown a pager and the tab that drops it
                would not. A label says the same thing on both. */}
            {sent ? (
              <span className="text-muted-foreground text-sm">Reply sent</span>
            ) : (
              <PanelNav
                index={activeIndex}
                total={data.length}
                onPrev={() => goTo(activeIndex - 1)}
                onNext={() => goTo(activeIndex + 1)}
              />
            )}
            <DrawerClose asChild>
              <Button
                variant="ghost"
                iconOnly
                size="sm"
                dataHook="close-review"
                ariaLabel="Close review"
              >
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          {/* DrawerBody carries the width and padding but NOT scrolling —
              it is a wrapper, not a scroller — so min-h-0 + overflow-y-auto
              are still ours. min-h-0 is the load-bearing half: a flex child
              defaults to min-height:auto and refuses to shrink below its
              content, so overflow never engages without it.
              key on the review id: React remounts, so the scroll position
              resets to the top of the new review AND tw-animate replays the
              fade. Without the key you land halfway down the next one. */}
          <DrawerBody
            // The sent state is a different thing in the same slot, so it
            // takes its own key: the remount replays the entrance fade, and
            // the moment arrives rather than appearing.
            key={sent ? `${active.id}-sent` : active?.id}
            // py-4: the detail rows sat hard against the header's divider
            // (Ali, 19 Aug: "The key values are directly next to the
            // header"). mt-0 kills DrawerBody's own mt-4, which only exists
            // to space it from a header that has no border.
            //
            // animate-entrance-fade, not `animate-in fade-in-0 duration-200`:
            // the DS published a motion taxonomy on 13 Aug and deprecated
            // direct tw-animate-css use, and this class IS the documented
            // replacement for a hand-written fade. It carries the DS's own
            // 300ms duration-slow, which is their stated ceiling for large
            // surfaces — the 200ms here was invented.
            // max-w-none: see the review panel's width note. The DS
            // drawer slots cap content at 384 and centre it, which left a
            // 127px gutter each side once the panel went to 640.
            className="animate-entrance-fade mt-0 flex min-h-0 max-w-none flex-1 flex-col overflow-y-auto py-4"
          >
          {sent ? (
            <ReplySent
              review={sent}
              business={business}
              remaining={needsReply}
              queued={replyQueue.length}
            />
          ) : (
          <ReplyBody
            review={active}
            business={business}
            draft={draft}
            onDraft={setDraft}
            onAi={draftWithAi}
            aiPending={aiPending}
            aiSpent={active ? !!aiSeeded[active.id] : false}
            aiBlocked={active ? aiRemaining <= 0 && !aiSeeded[active.id] : false}
            aiRemaining={aiRemaining}
            templates={templates}
            onTemplate={(t) => setDraft(resolveVars(t.body, active, business))}
            sending={sending}
            // Retry is the only action the panel body owns. Skip belongs to
            // the footer, which has carried it for every unreplied review
            // all along, failure or not.
            onRetry={sendReply}
          />
          )}
          </DrawerBody>
          {/* The package ships NO safe-area handling, and a right-hand
              drawer is `inset-y-0 h-full`, so on iOS these buttons sit under
              the home indicator. flex-row because DrawerFooter is flex-col:
              it is shaped for stacked confirm/cancel buttons, and these are
              a toolbar. justify-end because the DS SheetFooter right-aligns
              its buttons (sm:justify-end), and this panel should match it
              (Ali, 17 Sep). */}
          {canReply(active) ? (
          <DrawerFooter className="max-w-none flex-row items-center justify-end border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {sent ? (
              <>
                {/* THE OBVIOUS NEXT STEP AND NOTHING ELSE: the next review
                    to answer, or, once there is none, the first of the ones
                    this screen cannot answer. Close takes the primary only
                    when neither exists, because finishing is the action then
                    and nothing else is. */}
                <DrawerClose asChild>
                  <Button
                    variant={nextNeeds || nextElsewhere ? "outline" : "primary"}
                    dataHook={`sent-close-${sent.id}`}
                  >
                    Close
                  </Button>
                </DrawerClose>
                {nextNeeds ? (
                  <Button
                    variant="primary"
                    dataHook={`sent-next-${sent.id}`}
                    onClick={() => openInQueue(nextNeeds)}
                  >
                    Reply to the next one
                  </Button>
                ) : nextElsewhere ? (
                  // The reply box is done for the day, the inbox is not. This
                  // opens the first of the ones only their own site accepts,
                  // where the panel says which site and offers the way out to
                  // it, so the count in the line above always has somewhere
                  // to lead.
                  <Button
                    variant="primary"
                    dataHook={`sent-elsewhere-${sent.id}`}
                    onClick={() => openInQueue(nextElsewhere)}
                  >
                    See the ones left
                  </Button>
                ) : null}
              </>
            ) : (
            <ReplyActions
              review={active}
              draft={draft}
              sending={sending}
              // Send is no longer the whole transaction: sendReply owns the
              // pending beat, the failure and the close. See it in
              // ReviewsInbox.
              onSend={sendReply}
              onSkip={() => {
                setStatus(active.id, "skipped");
                setActiveId(null);
              }}
              onEdit={() => {
                setDraft(resolveVars(active.reply, active, business));
                setStatus(active.id, "needs");
              }}
              onDelete={() => setStatus(active.id, "needs", "")}
            />
            )}
          </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/* --------------------------------- shell ---------------------------------- */

export default function RMReviewManagerDataTablePage() {
  const persona = usePersona();
  const locationKey = useLocationKey();
  return (
    <SidebarProvider>
      <AppLayoutShell
        preset="live-site"
        // Live Site ships the expansive nav. Too loud at this density of
        // page, so the nav steps back one.
        navDensity="comfortable"
        // Live Site drops the sticky band. These screens keep it: their
        // card furniture pins below it off --gds-page-header-height.
        stickyHeader
        flush
        pinnedSidebar
        dataHook="reviews-app-layout"
        sidebar={<ProposalSidebar dataHook="reviews-sidebar" activeId="reviews-inbox" />}
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
            dataHook="reviews-page-header"
            // Three passed, three rendered: the PageHeader clamp went from
            // .slice(-2) to .slice(-3) (Ali, 27 Aug), so "All Locations" no
            // longer falls off and this renders the full
            // "All Locations > Minus 1 Studios > Reviews". Still ancestors
            // only — the H1 is the current page. Mobile shows the last crumb
            // behind a back arrow regardless.
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
              { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
            ]}
            title="Review Manager"
            // A SENTENCE, NOT A NUMBER. This used to read
            // "{seedRowsFor(persona, locationKey).length} reviews" (Ali, 7 Sep:
            // "our page description can be used to display some information
            // rather than yet more boring text"), but that count is the raw
            // seed list for the location, read up here, while the five tabs and
            // the three facets that narrow it live inside the inbox one level
            // down. Tick the 1 star facet and the header still said 60 over a
            // table of 4. The pager under the table already counts the filtered
            // rows, which is why counts came off the table titles too (Ali, 17
            // Sep: "we have pagination"), so the description says what the page
            // is for rather than restating a total it cannot see. Same route
            // the Review Builder hub took for the identical shape.
            description="Read and reply to every review for this location."
            // "auto" binds data.aiInsights.lastUpdated, so the line follows a
            // dataset switch instead of hardcoding a date into the screen.
            // ONLY ONCE THERE ARE REVIEWS. That timestamp is the AI Insights
            // regeneration date, a flat value in the dataset, and every persona
            // mounts the same dataset, so on an account that has never connected
            // a site the header read "Last updated September 9, 2026" next to "0
            // reviews" (Ali, 20 Sep). Nothing has synced, so we claim nothing.
            // There is no review sync timestamp in the data to bind instead, and
            // hiding the line costs no layout: the band stays 88px, the
            // description already sets that height.
            lastUpdated={seedRowsFor(persona, locationKey).length ? "auto" : undefined}
            // ONE link where there were two buttons. Templates and auto-reply
            // now share a page, so two triggers would land in the same place.
            // The "(1 rule)" count went with the rules — that state lives on
            // the destination page now, not here.
            //
            // data-grade-goto sits on a WRAPPER, not on the Button. Button
            // has no `goto` prop in this registry AND it does not spread
            // unknown data-* attributes onto the DOM node, so the attribute
            // was silently dropped and the click did nothing (verified 27
            // Aug). The sandbox handler resolves the target with
            // closest("[data-grade-goto]"), so any ancestor works.
            actions={
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex" data-grade-goto="screen:dmtaq1rm9eok2">
                  <Button variant="outline" dataHook="page-templates">
                    Reply templates
                  </Button>
                </span>
              </div>
            }
          />
        }
      >
        <GlobalLayoutContentBody>
          {/* Beacon's goal for this location, compact (Ali, 9 Sep: the plan
              belongs on the Manager page). The full plan opens in the modal. */}
          <ReviewPlanStrip />
          <ReviewsInbox />
          <BeaconNugget page="manager" />
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}