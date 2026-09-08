"use client";

// Promoted from Studio screen "RM — Get Reviews — Hub & spoke"
// (design dmtltu2hf8x2y, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: e9cd567c2a6a

// RM — Get Reviews — GAUGE EXPLORATION (3 Sep). A duplicate of "RM — Get
// Reviews" at version 1788426129530 with a 270° three-block gauge in the two
// places Ali asked for it: beside the funnel in Results (campaign conversion,
// sent → visited a review site) and in place of the bare NPS number in
// Internal feedback, each with a legend for its three blocks, and the
// four funnel bars replaced by a real Recharts FunnelChart. `Gauge` and
// the funnel block are in the insights section — candidates, not DS
// components. The source screen is unchanged.
//
// ─── SECOND PASS, 3 SEP (evening) — MODES, TEMPLATES, TABLES ───
// Ali: "I need kiosk mode and link mode. We also need to have Templates
// that we create campaigns from. Annoying but true. Shrink the amount of
// data displayed on each card — just the number of reviews generated and
// the type." Decisions taken on the same message:
//   TYPE   = the MODE (Email / SMS / Kiosk / Link), not the feedback type.
//   LAYOUT = a table for campaigns AND a table for templates, in two tabs
//            on the hub. Once a card is a name, a mode and one number, a
//            grid of them is a table with worse alignment; and the agency
//            case (dozens of locations × campaigns) needs a status filter
//            and a sortable number, which cards cannot give.
//   TEMPLATES come from BOTH places: BrightLocal presets and ones a user
//            saves from a campaign ("Save as template" on the row menu).
//   KIOSK is back as its own mode — deliberately reversing the 2 Sep fold
//            of kiosk into web link. Same standing collector, different
//            ending: link gets a URL, kiosk gets a full-screen page that
//            resets after every answer. See CHANNELS.
// CampaignCard is gone (the table rows replaced it); everything else in
// the wizard, insights and drawers is as it was, plus the kiosk branches.
//
// ─── THIRD PASS, 3 SEP (late) — HUB AND SPOKE, PAGINATION ───
// A duplicate of "RM — Get Reviews — Gauge (270°)" at 1788456240543, plus
// the gauge legend moved to the dial's right to match the Review Insights
// donut. Ali: "not too sure about having a page with two tabs, feels
// annoying and I think it's hard to find things. Two cards — campaigns and
// templates — with the numbers associated with them. Apparently we might
// also need pagination." So the two tabs are gone and Get Reviews is a HUB
// of two cards, each a spoke: Campaigns (the table, paginated) and
// Templates (the table). The campaign page hangs off Campaigns, so the
// breadcrumb reads Get Reviews > Campaigns > (this campaign). Kept as a
// separate screen so the tabs version and this one can be put side by side
// and whichever wins folded back.
//
// RM — Get Reviews. First pass from Harry Brignull's UX audit (11 Aug 2026,
// section 3.3) and the "Get Reviews.dc.html" clickthrough in the newer ZIP.
//
// ─── WHAT THIS PAGE IS ───
// The audit renames legacy "Review Generation" to "Get Reviews" and collapses
// its conceptual model: ONE campaign has ONE collector (channel) and ONE
// insights page. No campaign-inside-a-campaign. To run the same ask again you
// duplicate the campaign. So the page is a hub of campaign cards plus a
// create flow, and every card drills into its own insights page.
//
// ─── VIEWS IN THIS ONE SCREEN ───
// hub → wizard → success, plus insights and its all-feedback child. Same
// shape as RM — Review Inbox, which keeps templates and auto-reply in-screen:
// the app shell and PageHeader stay mounted and only the body swaps, so the
// header, sidebar and scroll position behave like one page rather than five.
//
// The customer-facing pages (what the recipient sees) open in a right DRAWER,
// not a view swap. They are a preview OF the thing being edited, so they
// should sit over it and dismiss back to the exact same step. The prototype
// used a full-screen takeover with an "exit preview" bar, which loses the
// editor behind it.
//
//
// ─── FINDINGS AND OPEN QUESTIONS LIVE IN A REPORT ───
// packages/studio/registries/brightlocal/reports/RM-GET-REVIEWS-AND-WIDGETS-REPORT.md
//
// That file carries the DS findings, the assumptions to check and the known
// gaps in this first pass. Add to it rather than to this header, which goes
// stale the moment something is fixed.
// ─── ASSUMPTIONS, FOR ALI TO CHECK ───
// 1. REVIEW SITES ARE Google / Facebook / Yelp / Trustpilot. The prototype
//    offered TripAdvisor and Yell. @brightlocal/icons has GoogleOriginal,
//    FacebookOriginal, YelpOriginal and TrustpilotOriginal but NO TripAdvisor
//    mark, and the Review Inbox screen is carrying a redrawn stand-in that
//    must not ship. Rather than draw a second one, this screen uses the four
//    sites that have official assets. Swap TripAdvisor back in the moment the
//    real mark lands in the icon package.
// 2. CAMPAIGN STATUS VOCABULARY (Live / Draft / Stopped) is the audit's
//    proposal, not verified live-product wording.
// 3. SMS CREDIT RATES (UK 2 credits, US/Canada 1) and the 5c per credit price
//    come straight from the prototype and need a commercial check.
// 4. REVIEW GATING. Audit section 3.3.X flags the legal exposure: if a user
//    can delete the public-review link from the negative path, the feature
//    becomes a review gate (FTC 16 CFR 465.7). This screen therefore has NO
//    branch that routes low scores away from the review sites: every
//    respondent reaches the same review page. If that decision is ever
//    reopened it should be reopened deliberately.
//
// ─── HOUSE RULES OBSERVED ───
// Cards get max-w-none (Card bakes max-w-[400px]). Badge has no success
// variant, so status pills use variant="primary" for Live. Stat tiles are
// StatCard, never hand-rolled Card + pt-6. GlobalLayoutContentBody is already
// flex flex-col gap-6, so card-to-card spacing is className="gap-4" on the
// body, never space-y-*. Charts sit in a wrapper with an explicit height.

import { Fragment, useMemo, useState } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
  CardDescription,
} from "@brightlocal/ui-components/card";
import { Button } from "@brightlocal/ui-components/button";
import { Badge } from "@brightlocal/ui-components/badge";
import { Input } from "@brightlocal/ui-components/input";
import { Textarea } from "@brightlocal/ui-components/textarea";
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Separator } from "@brightlocal/ui-components/separator";
import { Progress } from "@brightlocal/ui-components/progress";
import { Rating } from "@brightlocal/ui-components/rating";
import { RadioGroup, RadioGroupItem } from "@brightlocal/ui-components/radio-group";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@brightlocal/ui-components/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@brightlocal/ui-components/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@brightlocal/ui-components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@brightlocal/ui-components/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@brightlocal/ui-components/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@brightlocal/ui-components/drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@brightlocal/ui-components/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@brightlocal/ui-components/popover";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@brightlocal/ui-components/command";
import { AlertInfo, AlertWarning } from "@brightlocal/ui-components/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "@brightlocal/ui-components/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@brightlocal/ui-components/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@brightlocal/ui-components/pagination";
// THE ONE DIRECT RECHARTS IMPORT (3 Sep). The DS chart module does not
// re-export Funnel — its Storybook set is Area / Bar / Line / Pie / Radar /
// Radial — and the Studio sandbox resolves "recharts" to the copy already
// on the page, so this costs no new dependency. Cell and Tooltip come from
// the same import on purpose: Recharts matches children by component
// identity, so a Cell from the DS module and a Funnel from "recharts" would
// not see each other. This is the thing to request as a seventh chart story.
import {
  FunnelChart,
  Funnel,
  LabelList as FunnelLabelList,
  Cell as FunnelCell,
  Tooltip as FunnelTooltip,
} from "recharts";
import {
  Menu,
  Mail,
  MessageSquare,
  Link2,
  MoreHorizontal,
  RotateCcw,
  Plus,
  Check,
  Copy,
  Download,
  Trash2,
  Pencil,
  Info,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Smartphone,
  Monitor,
  Maximize2,
  Eye,
  CircleCheck,
  Send,
  Star,
  GoogleOriginal,
  FacebookOriginal,
  YelpOriginal,
  TrustpilotOriginal,
} from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  StatCard,
  DateStamp,
  formatDate,
  useProposalData,
} from "@brightlocal/proposal";
import { WizardShell } from "@brightlocal/wizard-shell";

/* ================================ reference =============================== */

// Sites with an OFFICIAL mark in @brightlocal/icons. See assumption 1.
const SITES = [
  { id: "google", label: "Google", Icon: GoogleOriginal },
  { id: "facebook", label: "Facebook", Icon: FacebookOriginal },
  { id: "yelp", label: "Yelp", Icon: YelpOriginal },
  { id: "trustpilot", label: "Trustpilot", Icon: TrustpilotOriginal },
];
const siteById = (id) => SITES.find((s) => s.id === id) ?? SITES[0];

const CHANNELS = {
  email: { id: "email", label: "Email", Icon: Mail },
  sms: { id: "sms", label: "SMS", Icon: MessageSquare },
  // KIOSK IS A MODE AGAIN (Ali, 3 Sep: "I need kiosk mode and link mode").
  // On 2 Sep it was folded into Web link on the grounds that "kiosk" is an
  // API word and the thing is only a URL. Half of that survives: it IS a
  // URL. What does not survive is the idea that where you put it does not
  // matter — a tablet on a counter is a different product from a link on
  // a receipt. It has no audience to upload, it must go full screen, it
  // must reset itself after every answer so the next customer does not
  // see the last one's, and its numbers are sessions, not visits. So the
  // word stays out of the captions (nobody is told to "open it as a
  // kiosk") but the mode exists, and the wizard, the success page and the
  // insights all branch on it.
  kiosk: { id: "kiosk", label: "Kiosk", Icon: Monitor },
  link: { id: "link", label: "Web link", Icon: Link2 },
};

// The two modes with no audience step: nothing is sent, the campaign sits
// and collects. Everything that used to test `channel === "link"` tests
// this instead, so kiosk inherits the standing behaviour in one place.
const isStanding = (channel) => channel === "link" || channel === "kiosk";

const FEEDBACK_TYPES = {
  nps: {
    id: "nps",
    label: "NPS",
    caption: 'A 0 to 10 "how likely are you to recommend us" scale.',
    question: "How likely are you to recommend {{businessname}} to a friend or colleague?",
  },
  thumbs: {
    id: "thumbs",
    label: "Thumbs up or down",
    caption: "The simplest possible answer.",
    question: "How was your visit?",
  },
  stars: {
    id: "stars",
    label: "5 stars",
    caption: "A familiar star rating.",
    question: "How would you rate your visit?",
  },
};

// Credit rates and pricing are the prototype's. See assumption 3.
const CREDIT_RATES = { UK: 2, USA: 1, Canada: 1 };
const CREDIT_PACKAGES = [
  { id: "p250", credits: 250, price: "$12.50" },
  { id: "p500", credits: 500, price: "$25.00" },
  { id: "p1000", credits: 1000, price: "$50.00" },
  { id: "p2500", credits: 2500, price: "$125.00" },
];

const RECIPIENT_COUNT = 112;

// Starting SMS credit balance. Deliberately BELOW the UK cost of one send
// (112 recipients at 2 credits each = 224) and above the US cost (112 at 1),
// so a walkthrough can show both the comfortable path and the top-up path
// without editing the screen.
const STARTING_CREDITS = 150;

function blankCampaignDraft() {
  return {
    id: null,
    name: "",
    logo: true,
    ask: "feedback", // "feedback" = internal feedback then public review, "review" = straight to review
    // EVERY RADIO STARTS SELECTED (Ali, 3 Sep: "radios should always have a
    // default selected"). Nothing here was preselected, which is why four
    // steps carried a "choose an option to continue" error that existed only
    // to catch a state the wizard put the user in. A default is also a
    // recommendation: it says what most people want, and the ones who want
    // something else were going to click anyway.
    //
    // The defaults are the common case, not the safe-looking one:
    //   ask       feedback-first, the richer path and the legacy default
    //   channel   email, by far the most used
    //   reminder  No — a second message is a cost, so it is opted INTO
    //   country   UK, the seeded location's own country
    // Slate by default, NOT BrightLocal green: a campaign that has not been
    // branded yet should look neutral to the customer, not like the vendor.
    brandColor: "neutral",
    feedbackType: "nps",
    feedbackQuestion: FEEDBACK_TYPES.nps.question,
    followUpQuestion: true,
    followUpQuestionText: "What's the main reason for your answer?",
    consent: true,
    channel: "email",
    subject: "Please tell us your thoughts",
    body:
      "Hi {{firstname}},\n\nThank you for choosing {{businessname}}. We would love to hear how we did. It only takes a moment.\n\n{{feedbackform}}\n\nThank you,\nThe team at {{businessname}}",
    legalFooter:
      "You are receiving this email because you are a customer of {{businessname}}. To stop receiving these emails, use the unsubscribe link below.",
    reminder: false,
    reminderSubject: "",
    reminderBody: "",
    smsText:
      "Hi {{firstname}}, thank you for visiting {{businessname}}. We would love to hear about your experience.",
    reminderSms: "",
    invite: "Thank you. If you have a moment, please share your feedback on a public review site:",
    sites: [{ site: "google", url: "https://g.page/r/willow-brook-farm-park" }],
    country: "UK",
    headerRow: true,
    columns: ["name", "lastname", "contact"],
    permission: false,
    privacy: false,
  };
}

// Seed campaigns. Numbers are invented demo data for the walkthrough, not
// captured from the live product.
function seedCampaigns() {
  const base = blankCampaignDraft;
  return [
    {
      id: "c1",
      name: "Summer Visitors",
      status: "Live",
      dates: { label: "Sent", date: "2026-07-12T09:00" },
      lastActivity: { label: "Last activity", date: "2026-08-31T16:42" },
      config: {
        ...base(),
        name: "Summer Visitors",
        ask: "feedback",
        channel: "email",
        reminder: true,
        sites: [
          { site: "google", url: "https://g.page/r/willow-brook-farm-park" },
          { site: "facebook", url: "https://facebook.com/willowbrookfarmpark" },
          { site: "trustpilot", url: "https://trustpilot.com/review/willowbrook.co.uk" },
        ],
      },
      stats: { sent: 480, delivered: 462, clicked: 212, reviews: 38, impact: "+0.3", opened: 341, rated: 212, visited: 96 },
    },
    {
      id: "c2",
      name: "Front Desk Kiosk",
      status: "Live",
      dates: { label: "Live since", date: "2026-05-03T12:00" },
      lastActivity: { label: "Last activity", date: "2026-09-02T09:05" },
      config: {
        ...base(),
        name: "Front Desk Kiosk",
        ask: "feedback",
        channel: "kiosk",
        feedbackType: "stars",
        feedbackQuestion: FEEDBACK_TYPES.stars.question,
      },
      stats: { visits: 1204, reviews: 52, impact: "+0.4" },
    },
    {
      id: "c3",
      name: "Season Pass Holders",
      status: "Live",
      dates: { label: "Sent", date: "2026-08-02T07:30" },
      lastActivity: { label: "Last activity", date: "2026-09-02T09:05" },
      config: {
        ...base(),
        name: "Season Pass Holders",
        ask: "feedback",
        channel: "sms",
        country: "UK",
        feedbackType: "thumbs",
        feedbackQuestion: FEEDBACK_TYPES.thumbs.question,
      },
      stats: { sent: 260, delivered: 252, clicked: 118, reviews: 19, impact: "+0.2", opened: 187, rated: 118, visited: 47 },
    },
    {
      id: "c4",
      name: "Campaign, 9 Aug 2026",
      status: "Draft",
      dates: { label: "Created", date: "2026-08-09T14:05" },
      lastActivity: { label: "Edited", date: "2026-08-28T11:20" },
      resumeAt: "sms",
      config: { ...base(), name: "Campaign, 9 Aug 2026", ask: "review", channel: "sms" },
    },
    {
      id: "c5",
      name: "Spring Reopening",
      status: "Stopped",
      dates: { label: "Sent", date: "2026-03-12T08:45" },
      lastActivity: { label: "Stopped", date: "2026-03-28T08:00" },
      stoppedOn: "2026-03-28",
      config: { ...base(), name: "Spring Reopening", ask: "review", channel: "email", reminder: false },
      stats: { sent: 350, delivered: 339, clicked: 141, reviews: 24, impact: "+0.2", opened: 233, rated: 141, visited: 58 },
    },
    {
      // SCHEDULED — everything written, nothing sent. The one state where
      // the messages can still be changed, which is why its banner says so.
      id: "c6",
      name: "Autumn Half Term",
      status: "Scheduled",
      dates: { label: "Sends", date: "2026-09-19T08:00" },
      lastActivity: { label: "Scheduled", date: "2026-09-01T15:30" },
      stats: null,
      config: {
        ...base(),
        channel: "email",
        ask: "feedback",
        feedbackType: "stars",
        feedbackQuestion: FEEDBACK_TYPES.stars.question,
      },
    },
    {
      // SENDING — in flight. The numbers are real but not final, which is
      // the whole reason this state needs a banner: a half-finished funnel
      // read as a finished one is a wrong conclusion, not a missing number.
      id: "c7",
      name: "Bank Holiday Visitors",
      status: "Sending",
      dates: { label: "Sending since", date: "2026-09-03T08:15" },
      lastActivity: { label: "Started", date: "2026-09-03T08:15" },
      stats: { sent: 143, delivered: 138, opened: 61, clicked: 24, rated: 19, visited: 9, reviews: 4, impact: "0.0" },
      config: {
        ...base(),
        channel: "email",
        ask: "review",
      },
    },
    {
      // FINISHED — sent, reminded, done. Distinct from Stopped, which is a
      // decision, and from Live, which a one-shot email campaign stops being
      // the moment its reminder has gone.
      id: "c8",
      name: "Easter Weekend",
      status: "Finished",
      dates: { label: "Sent", date: "2026-04-02T09:00" },
      lastActivity: { label: "Closed", date: "2026-04-23T00:00" },
      stats: { sent: 310, delivered: 301, opened: 188, clicked: 96, rated: 71, visited: 44, reviews: 27, impact: "+0.2" },
      config: {
        ...base(),
        channel: "email",
        ask: "feedback",
        feedbackType: "nps",
        feedbackQuestion: FEEDBACK_TYPES.nps.question,
      },
    },
    {
      // A LINK campaign now that Front Desk Kiosk is a kiosk: the two
      // standing modes need one example each or the table cannot show
      // the difference it exists to show.
      id: "c9",
      name: "Receipt QR Link",
      status: "Live",
      dates: { label: "Live since", date: "2026-06-14T10:00" },
      lastActivity: { label: "Last activity", date: "2026-09-01T18:20" },
      config: { ...base(), name: "Receipt QR Link", ask: "review", channel: "link" },
      stats: { visits: 860, reviews: 31, impact: "+0.2" },
    },
  ];
}

// TEMPLATES (Ali, 3 Sep: "we also need to have Templates that we create
// campaigns from. Annoying but true"). Two sources, one list: BrightLocal's
// presets and the ones a user saves from a campaign of their own. A template
// is a campaign config with no stats and no status — the recipe, not the
// dish — so the wizard can start from one exactly as it used to start from a
// re-used campaign. There is no template editor: you edit a campaign, then
// "Save as template" on its row is how a user-made one comes into being.
function seedTemplates() {
  const base = blankCampaignDraft;
  return [
    {
      id: "t1",
      name: "Post-visit email",
      source: "brightlocal",
      updated: "2026-06-02T09:00",
      config: { ...base(), name: "Post-visit email", ask: "feedback", channel: "email", reminder: true },
    },
    {
      id: "t2",
      name: "Text after purchase",
      source: "brightlocal",
      updated: "2026-06-02T09:00",
      config: {
        ...base(),
        name: "Text after purchase",
        ask: "review",
        channel: "sms",
        feedbackType: "thumbs",
        feedbackQuestion: FEEDBACK_TYPES.thumbs.question,
      },
    },
    {
      id: "t3",
      name: "Counter kiosk",
      source: "brightlocal",
      updated: "2026-06-02T09:00",
      config: {
        ...base(),
        name: "Counter kiosk",
        ask: "feedback",
        channel: "kiosk",
        feedbackType: "stars",
        feedbackQuestion: FEEDBACK_TYPES.stars.question,
      },
    },
    {
      id: "t4",
      name: "Receipt QR link",
      source: "brightlocal",
      updated: "2026-06-02T09:00",
      config: { ...base(), name: "Receipt QR link", ask: "review", channel: "link" },
    },
    {
      // Saved from a campaign: same shape, different source badge.
      id: "t5",
      name: "Summer Visitors",
      source: "user",
      updated: "2026-08-21T11:40",
      config: {
        ...base(),
        name: "Summer Visitors",
        ask: "feedback",
        channel: "email",
        reminder: true,
        sites: [
          { site: "google", url: "https://g.page/r/willow-brook-farm-park" },
          { site: "facebook", url: "https://facebook.com/willowbrookfarmpark" },
        ],
      },
    },
  ];
}

// Internal feedback for the insights page. score is a 0 to 10 value; the
// thumbs and stars campaigns derive their display from the same number, so
// one dataset serves all three feedback types.
const FEEDBACK_ITEMS = [
  { id: 1, name: "Sophie H.", email: "sophie.hart@example.com", visited: true, date: "2026-08-31", score: 10, consent: true, text: "Wonderful day out. The lamb feeding was the highlight for our two." },
  { id: 2, name: "Dan P.", email: "dan.pryce@example.com", visited: true, date: "2026-08-30", score: 9, consent: true, text: "Really smooth booking and friendly staff at the gate." },
  { id: 3, name: "Anonymous", email: null, visited: false, date: "2026-08-30", score: 4, consent: false, text: "Cafe queue was far too long at lunch, and nowhere to sit inside when it rained. We waited nearly forty minutes for two sandwiches and a coffee. The food itself was decent, but you need more tills open during school holidays." },
  { id: 4, name: "Priya N.", email: "priya.n@example.com", visited: false, date: "2026-08-29", score: 8, consent: false, text: "Lovely animals and clean grounds. Parking fills up fast on weekends." },
  { id: 5, name: "Megan F.", email: "megan.f@example.com", visited: true, date: "2026-08-28", score: 10, consent: true, text: "The owl encounter made my daughter's whole week." },
  { id: 6, name: "Tom B.", email: "tom.bailey@example.com", visited: false, date: "2026-08-27", score: 7, consent: false, text: "Good value overall, though a couple of attractions were closed on the day." },
  { id: 7, name: "Rachel W.", email: "rachel.webb@example.com", visited: true, date: "2026-08-26", score: 9, consent: true, text: "Staff could not have been more helpful when our buggy wheel broke. One of the team fetched a toolkit and fixed it while we fed the goats." },
  { id: 8, name: "Anonymous", email: null, visited: false, date: "2026-08-26", score: 3, consent: false, text: "Advertised tractor ride was not running and no one told us at entry." },
  { id: 9, name: "Ollie S.", email: "ollie.shaw@example.com", visited: true, date: "2026-08-26", score: 10, consent: true, text: "Best farm park in the area. The maize maze alone is worth the ticket." },
  { id: 10, name: "Hannah K.", email: "hannah.kerr@example.com", visited: false, date: "2026-08-25", score: 8, consent: false, text: "Picnic areas are great. A bit more shade would make it perfect." },
  { id: 11, name: "Ben C.", email: "ben.clark@example.com", visited: true, date: "2026-08-24", score: 9, consent: true, text: "Pig racing is very funny. The kids want to come back already." },
  { id: 12, name: "Laura M.", email: "laura.mills@example.com", visited: false, date: "2026-08-23", score: 6, consent: false, text: "Fine visit but the ice cream kiosk still does not take card." },
  { id: 13, name: "Jack T.", email: "jack.t@example.com", visited: true, date: "2026-08-22", score: 10, consent: true, text: "Season pass paid for itself in two visits." },
  { id: 14, name: "Katie R.", email: "katie.reid@example.com", visited: true, date: "2026-08-21", score: 9, consent: false, text: "Really well organised birthday party package, thank you." },
];

const CSV_PREVIEW = [
  { a: "Sophie", b: "Hart", c: "sophie.hart@example.com", cSms: "+44 7700 900312" },
  { a: "Dan", b: "Pryce", c: "dan.pryce@example.com", cSms: "+44 7700 900118" },
  { a: "Priya", b: "Nair", c: "priya.n@example.com", cSms: "+44 7700 900642" },
  { a: "Tom", b: "Bailey", c: "tom.bailey@example.com", cSms: "+44 7700 900287" },
];

/* ================================= helpers ================================ */

// "Minus 1 Studios" gives M1, "Willow Brook Farm Park" gives WB. One word
// falls back to its first two letters.

function slugOf(name) {
  return (name ?? "logo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveVars(text, business) {
  return (text ?? "")
    .replaceAll("{{firstname}}", "Sophie")
    .replaceAll("{{businessname}}", business);
}

function useBusinessName() {
  const data = useProposalData();
  return data?.location?.name ?? "this location";
}

// THE RAIL SHOWS PHASES, NOT STEPS. buildFlow can return twelve or more
// steps, and a twelve-item rail is unreadable at any width: the labels
// collide long before the indicators do. Steps are grouped into six named
// phases instead, the rail tracks the phase, and the card heading names the
// step inside it. Derived from the flow, so a phase with no steps in this
// configuration never appears (a link campaign has no Audience).
const STEP_PHASE = {
  // FOUR PHASES, DOWN FROM SIX (Ali, 3 Sep: "having a wizard with 6 steps is
  // a bit extra"). It was Setup / Ask / Message / Review page / Audience /
  // Send, and two of those were not earning a slot on the rail:
  //
  //   "Ask" was two steps that are really part of setting the thing up —
  //   what you are asking for is a property of the campaign, like its name.
  //   "Review page" was ONE step, and a phase that is one step is a step
  //   wearing a costume.
  //
  // Merged: Setup absorbs Ask, and Message absorbs the review page, because
  // Message is now honestly "everything the customer sees" — the email or
  // text, the reminder, and the page it lands on. Four also matches the
  // widget wizard's four, so both wizards in the tool count the same way.
  start: "Setup",
  template: "Setup",
  name: "Setup",
  ask: "Setup",
  feedback: "Setup",
  channel: "Message",
  email: "Message",
  sms: "Message",
  reminder: "Message",
  "reminder-design": "Message",
  sites: "Message",
  recipients: "Audience",
  columns: "Audience",
  check: "Audience",
  send: "Send",
  golive: "Send",
};
function phasesFor(flow) {
  const seen = [];
  for (const id of flow) {
    const phase = STEP_PHASE[id];
    if (phase && !seen.includes(phase)) seen.push(phase);
  }
  return seen.map((label) => ({ id: label, label }));
}

// The wizard's step list is DERIVED, never stored: the same two answers
// (ask and channel) decide which steps exist, so a step count that drifts
// from the answers is impossible.
function buildFlow(d) {
  const flow = ["name", "ask"];
  if (d.ask === "feedback") flow.push("feedback");
  flow.push("channel");
  if (d.channel === "email") {
    flow.push("email", "reminder");
    if (d.reminder) flow.push("reminder-design");
  }
  if (d.channel === "sms") {
    flow.push("sms", "reminder");
    if (d.reminder) flow.push("reminder-design");
  }
  if (d.channel) flow.push("sites");
  if (d.channel === "email" || d.channel === "sms") {
    flow.push("recipients", "columns", "check", "send");
  }
  if (isStanding(d.channel)) flow.push("golive");
  return flow;
}

const STEP_COPY = {
  start: { title: "How do you want to start?" },
  template: {
    title: "Pick a template",
    sub: "Everything is copied from the template. You can change any of it before it goes live.",
  },
  name: { title: "Name your campaign" },
  ask: { title: "How do you want to ask customers for reviews?" },
  feedback: {
    title: "Set up internal feedback",
    sub: "Customers answer this first, then they are invited to leave a public review.",
  },
  channel: { title: "How do you want to ask?" },
  email: { title: "Design your email" },
  sms: { title: "Design your text message" },
  reminder: {
    title: "Send a reminder?",
    sub: "A reminder goes out 48 hours later, only to people who have not responded.",
  },
  "reminder-design": {
    title: "Design your reminder",
    sub: "Sent 48 hours after the first message, to people who have not responded.",
  },
  sites: {
    title: "Review page",
    sub: "This is where customers choose which public review site to post on.",
  },
  recipients: { title: "Who should we send this to?" },
  columns: {
    title: "Map your columns",
    sub: "Tell us which column is which. We have guessed from your header row.",
  },
  check: { title: "Check your list" },
  send: { title: "Ready to send?", sub: "Please check this is right before you send." },
  golive: { title: "Ready to go live" },
};

function campaignSummary(config) {
  const rows = [
    {
      k: "Channel",
      v: `${CHANNELS[config.channel]?.label ?? "Not chosen yet"}${config.reminder ? ", reminder after 48 hours" : ""}`,
    },
    {
      k: "Ask",
      v:
        config.ask === "feedback"
          ? "Internal feedback, then a public review"
          : config.ask === "review"
            ? "Straight to a public review"
            : "Not chosen yet",
    },
  ];
  if (config.ask === "feedback") {
    rows.push({ k: "Feedback type", v: FEEDBACK_TYPES[config.feedbackType].label });
  }
  rows.push({ k: "Review sites", v: config.sites.map((s) => siteById(s.site).label).join(", ") });
  return rows;
}

/* ============================== small pieces ============================== */

function ChoiceCards({ name, value, onChange, options, columns = 1 }) {
  return (
    <RadioGroup
      dataHook={`${name}-radio-group`}
      variant="box"
      value={value ?? ""}
      onValueChange={onChange}
    >
      <div className={columns === 3 ? "grid gap-3 sm:grid-cols-3" : columns === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
      {options.map((o) => (
        <Field key={o.id} orientation="horizontal" variant="box">
          <RadioGroupItem id={`${name}-${o.id}`} value={o.id} />
          <FieldContent>
            <FieldLabel htmlFor={`${name}-${o.id}`} dataHook={`${name}-${o.id}-label`}>
              {o.label}
            </FieldLabel>
            {o.caption ? (
              <FieldDescription dataHook={`${name}-${o.id}-desc`}>{o.caption}</FieldDescription>
            ) : null}
          </FieldContent>
        </Field>
      ))}
      </div>
    </RadioGroup>
  );
}

// Layout-only wrapper. Field's own box variant is the control surface; this
// is just the label plus control stack the DS canonical pattern asks for.
function LabelledField({ id, label, description, children, hook }) {
  return (
    <Field dataHook={`${hook}-field`}>
      <FieldLabel htmlFor={id} dataHook={`${hook}-label`}>
        {label}
      </FieldLabel>
      {children}
      {description ? (
        <FieldDescription dataHook={`${hook}-desc`}>{description}</FieldDescription>
      ) : null}
    </Field>
  );
}

function SiteMark({ id }) {
  const Icon = siteById(id).Icon;
  return <Icon className="size-4 shrink-0" />;
}

// What the campaign asks for, in one cell: the feedback type when there is
// a feedback step, otherwise the fact that there is not.
const askLabel = (config) =>
  config.ask === "feedback" ? FEEDBACK_TYPES[config.feedbackType]?.label ?? "Feedback" : "Straight to review";

// Two sources, two badge weights: BrightLocal's presets are the furniture
// (secondary), the user's own are the ones they will be looking for
// (outline, so they read differently at a glance without being louder).
function SourceBadge({ source, hook }) {
  return (
    <Badge dataHook={hook} variant={source === "brightlocal" ? "secondary" : "outline"}>
      {source === "brightlocal" ? "BrightLocal" : "Yours"}
    </Badge>
  );
}

// ─── THE SIX CAMPAIGN STATES ─────────────────────────────────────────
// Ali, 3 Sep: "put all the states in, then we can have a page in each of
// these states, as they will display different alerts and button options".
//
// NOTHING SPECIFIES THESE. The RM Design Brief lists what Get Reviews does
// but no states; the audit only says "once live, each campaign has a
// campaign insights page"; the legacy screens show no state chips. Six is a
// design proposal, and it is written as one table so it can be argued with
// as a table rather than found in scattered `status ===` checks.
//
// The three that existed were Draft, Live and Stopped, and Live was doing
// two jobs. A standing web link IS live — it sits there collecting. An email
// campaign sent in July is not live in September: everything has been sent,
// the reminder has fired, and nothing more will happen. Calling both "Live"
// makes the word mean nothing and inflates "campaigns running" on the hub.
//
//   Draft      never sent, still being built
//   Scheduled  finished, waiting for its send time
//   Sending    send in progress right now
//   Live       open and collecting: a standing link, or a send whose
//              responses are still arriving
//   Finished   nothing more will be sent and the window has closed
//   Stopped    halted early, by a person, on purpose
//
// BADGE VARIANTS, from the DS's four (primary, secondary, outline,
// destructive). The rule is loudness = how much is happening:
//   Sending / Live   primary     something is happening right now
//   Scheduled        secondary   something is going to happen
//   Draft            secondary   something could happen
//   Finished         outline     nothing more will
//   Stopped          outline     nothing more will, and by choice
// NOT destructive for Stopped: red says something went wrong, and stopping
// is a deliberate, reversible decision.
const STATES = {
  Draft: {
    variant: "secondary",
    cta: "Resume setup",
    // `alert` renders on the campaign page. null = the page needs no banner,
    // which is the right answer for the states that are simply working.
    alert: null,
    canStop: false,
    canRestart: false,
    canReuse: false,
  },
  Scheduled: {
    variant: "secondary",
    cta: "View campaign",
    alert: {
      tone: "info",
      text: "Nothing has been sent yet. This campaign sends automatically at its scheduled time, and you can still change the messages or cancel it until then.",
    },
    canStop: true,
    canRestart: false,
    canReuse: true,
  },
  Sending: {
    variant: "primary",
    alert: {
      tone: "info",
      text: "Sending now. The numbers below are still climbing and will settle once every message has gone.",
    },
    cta: "View insights",
    canStop: true,
    canRestart: false,
    canReuse: true,
  },
  Live: { variant: "primary", cta: "View insights", alert: null, canStop: true, canRestart: false, canReuse: true },
  Finished: {
    variant: "outline",
    cta: "View insights",
    alert: {
      tone: "info",
      text: "This campaign has run its course: every message was sent, the reminder has gone, and no more responses are expected. Re-use it to run the same ask again.",
    },
    canStop: false,
    canRestart: false,
    canReuse: true,
  },
  Stopped: {
    variant: "outline",
    cta: "View insights",
    alert: {
      tone: "warning",
      text: "Stopped early. The links no longer work and the numbers stopped counting on that date. Restarting makes the links live again.",
    },
    canStop: false,
    canRestart: true,
    canReuse: true,
  },
};

const stateOf = (status) => STATES[status] ?? STATES.Live;

function StatusPill({ status, hook }) {
  return (
    <Badge dataHook={hook} variant={stateOf(status).variant}>
      {status}
    </Badge>
  );
}

// The customer-facing rating control, shared by the wizard preview and the
// customer drawer. `interactive` is what separates a picture of the control
// from the real thing.
function FeedbackControl({ type, value, onPick, interactive }) {
  if (type === "nps") {
    return (
      // CIRCLES, AND THEY FIT (Ali, 2 Sep: "NPS score funnily enough doesn't
      // fit… BrightLocal would likely have them as circles?").
      //
      // THE FIT. Eleven fixed 32px buttons plus gaps need ~390px, and the
      // email preview column is 420px minus 72px of padding. They wrapped,
      // which put "10" on a line of its own under "0" — the one layout that
      // makes a 0-to-10 scale unreadable. flex-1 with aspect-square lets the
      // row divide whatever width it is given, so it fits the 420px preview,
      // the full-size dialog and a phone without a breakpoint.
      //
      // CIRCLES, checked against Mobbin rather than guessed. Rounded squares
      // (Typeform, Tally, Expedia, Employment Hero) outnumber circles
      // (Care.com, HubSpot) 4:2, but the four are all general form builders
      // where NPS is one field type among fifty. HubSpot is the real
      // analogue — a B2B tool where a business CONFIGURES an NPS survey its
      // own customers receive, with detractor/passive/promoter bands in the
      // editor, which is exactly this screen — and it uses circles. Care.com
      // is the other genuine end-customer NPS.
      //
      // OPEN, FOR ALI: legacy BrightLocal and HubSpot both COLOUR-GRADE the
      // scale red to green. Kept neutral here because the landing page now
      // wears the business's accent colour and a red-amber-green row would
      // fight it. That is a departure from BrightLocal's own precedent, so
      // it is a decision to take rather than a detail to leave.
      <div className="flex flex-col gap-1.5">
        {/* CAPPED AND CENTRED (Ali, 3 Sep: "the NPS 0-10 scale looks
            shit"). flex-1 alone let each circle grow to fill whatever it was
            given, so in the full-size dialog eleven circles stretched to
            ~50px each and became big hollow rings with the numbers lost in
            the middle — and in the half-scale contact-sheet tile they
            collapsed to about 16px. A max width holds them at a sane size
            and the row centres instead of spreading, so the scale looks the
            same in the tile, the dialog and the live page. */}
        {/* A GRID, NOT FLEX (3 Sep). `flex-1` with `aspect-square` never
            produced circles at any size: flex-basis 0 plus min-w-0 let each
            button shrink to the width of its own digit, and aspect-square
            then squared off THAT, so the control rendered as a bare run of
            numbers with the selected one in a narrow black pill — at full
            size as well as in the tile. Eleven equal grid columns resolve
            from the container, so aspect-square has a real width to work
            from and the circles are actually round. */}
        <div className="mx-auto grid w-full max-w-[26rem] grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              data-hook={`nps-${n}`}
              onClick={() => interactive && onPick(n)}
              className={`focus-visible:ring-ring flex aspect-square w-full items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                value === n
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="text-muted-foreground mx-auto flex w-full max-w-[26rem] justify-between text-xs">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </div>
    );
  }
  if (type === "thumbs") {
    return (
      <div className="flex gap-3">
        {[
          { id: "up", Icon: ThumbsUp, label: "Thumbs up" },
          { id: "down", Icon: ThumbsDown, label: "Thumbs down" },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            data-hook={`thumb-${id}`}
            onClick={() => interactive && onPick(id)}
            className={`focus-visible:ring-ring flex size-12 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              value === id
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-border"
            }`}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          data-hook={`star-${n}`}
          onClick={() => interactive && onPick(n)}
          className="focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          {/* GOLD, NOT THE BRAND COLOUR (Ali, 2 Sep: "green stars"). A
              filled star was `fill-primary`, which is BrightLocal's green,
              so the customer-facing rating control wore BrightLocal's brand
              on a page that belongs to the business — and a green star does
              not read as a rating at all. Amber is the convention every
              review site uses, and it stays amber whatever brand colour the
              campaign is set to: the star is a UNIT, like a percent sign,
              not a piece of the business's identity. Pure ramp tokens, no
              colour mixing. */}
          <Star
            className={`size-8 ${
              typeof value === "number" && n <= value
                ? "fill-[var(--ds-tailwind-colors-amber-400)] text-[var(--ds-tailwind-colors-amber-500)]"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ============================ campaign branding ============================ */

// A CAMPAIGN HAS A BRAND COLOUR (Ali, 2 Sep: "is there a need from the
// previous get reviews to have some kind of colour palette or theme?").
//
// There is, and the reason is not decoration. The feedback page, the review
// page and the emails are seen by the BUSINESS'S customers, not by the
// BrightLocal user, and until now every button and avatar on them was
// `--primary`, which is BrightLocal's green. So a customer of Blackberry
// Farm Park was being shown a page in a software vendor's brand. The logo
// upload was already here, half-solving the same problem; this is the other
// half.
//
// SIX PRESETS, NOT A COLOUR PICKER. A free hex field is where a brand colour
// with 2:1 contrast against white text gets typed in, and the customer page
// is the last place to ship an unreadable button. Every preset is a DS ramp
// token at its 600 step, which is dark enough for white text at every one of
// them, and it is the token that is stored, not a hex — so a campaign
// re-themes with the design system rather than being frozen at whatever the
// ramp looked like on the day it was made.
const BRAND_COLOURS = [
  // GREY IS A REAL CHOICE, not the absence of one (Ali, 2 Sep: "maybe the
  // ability to choose a grey?"). Plenty of brands are black-and-white, and
  // a picker that only offers colours forces those businesses to pick a
  // colour they do not use. Neutral-800 is first, and it is the default.
  { id: "neutral", label: "Grey", token: "--ds-tailwind-colors-neutral-800" },
  { id: "slate", label: "Slate", token: "--ds-tailwind-colors-slate-700" },
  { id: "blue", label: "Blue", token: "--ds-tailwind-colors-blue-600" },
  { id: "emerald", label: "Green", token: "--ds-tailwind-colors-emerald-600" },
  { id: "amber", label: "Amber", token: "--ds-tailwind-colors-amber-600" },
  { id: "rose", label: "Rose", token: "--ds-tailwind-colors-rose-600" },
  { id: "violet", label: "Violet", token: "--ds-tailwind-colors-violet-600" },
];

const brandById = (id) => BRAND_COLOURS.find((c) => c.id === id) ?? BRAND_COLOURS[0];

// Remap the tokens the DS's own components read, rather than restyling each
// one. `Button variant="primary"`, the avatar circle and the tick all pick
// this up with no className anywhere. Same technique as CARD_SURFACE in
// @brightlocal/wizard-shell, and it means a new customer-facing control
// inherits the brand automatically instead of having to be remembered.
const brandSurface = (id) => {
  const c = brandById(id);
  return {
    "--primary": `var(${c.token})`,
    "--color-primary": `var(${c.token})`,
    "--primary-foreground": "var(--ds-tailwind-colors-base-white)",
    "--color-primary-foreground": "var(--ds-tailwind-colors-base-white)",
  };
};

// The swatch row on the branding step.
function BrandPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent colour">
      {BRAND_COLOURS.map((c) => {
        const on = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.label}
            data-hook={`brand-${c.id}`}
            onClick={() => onChange(c.id)}
            className={`focus-visible:ring-ring flex size-9 items-center justify-center rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              on ? "border-foreground" : "border-transparent"
            }`}
          >
            <span
              className="size-6 rounded-full"
              style={{ background: `var(${c.token})` }}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ============================ customer-facing =============================== */

// One component renders all four customer pages. The drawer and the wizard's
// preview pane both mount it, so a change to the customer experience shows up
// in both places by construction.
function CustomerPage({ page, config, interactive, rating, setRating, comment, setComment, consent, setConsent, onSubmit }) {
  // AppLayoutShell mounts its own ProposalDataProvider for the chosen
  // dataset, so anything ABOVE the shell reads the package defaults and shows
  // the wrong business. The name is therefore read here, at the leaf, and
  // never threaded down from App.
  const business = useBusinessName();
  // EVERY CUSTOMER PAGE WEARS THE CAMPAIGN'S BRAND, not BrightLocal's. One
  // style object on the root of each page remaps --primary, so the avatar,
  // the submit button and the tick all follow without a className between
  // them. See brandSurface.
  const brand = brandSurface(config.brandColor);
  // A LOGO, NOT AN AVATAR (Ali, 2 Sep). Two passes to get here. First the
  // circle-of-initials only rendered when a logo HAD been uploaded, which
  // was the right rule attached to the wrong mark; then it was removed for
  // the no-logo case, which was half the fix. The remaining half: initials
  // in a circle are an AVATAR — the convention for a person whose photo is
  // missing — and a business at the top of its own review request does not
  // have a face, it has a logo.
  //
  // WHERE PLACEHOLDER LOGOS COME FROM. logoipsum and similar sets exist for
  // exactly this, but shipping a third party's artwork into a client
  // prototype is the same mistake as approximating a directory's brand mark
  // (see DirectoryMark on Report Settings): it is someone else's asset,
  // sitting in a screenshot, in front of a client. Drawn here instead —
  // geometric, license-clean, ours, and obviously a stand-in rather than a
  // real brand somebody has to recognise.
  //
  // Mark plus wordmark, because that is the shape of nearly every small
  // business logo and it is what the real upload will replace. It takes the
  // campaign's accent colour, so changing the accent changes the logo with
  // it rather than leaving one element in a different palette.
  const logo = config.logo ? (
    <div className="flex items-center gap-2" data-hook="customer-logo">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <circle cx="16" cy="16" r="15" className="fill-primary" />
        <path
          d="M16 7c5 3 7 6 7 10a7 7 0 1 1-14 0c0-4 2-7 7-10Z"
          className="fill-primary-foreground"
          opacity="0.9"
        />
        <circle cx="16" cy="18" r="3" className="fill-primary" />
      </svg>
      <span className="text-base font-semibold tracking-tight">{business}</span>
    </div>
  ) : null;

  if (page === "expired") {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center" style={brand}>
        {logo}
        <p className="text-base font-semibold">This request has expired.</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Thanks all the same. {business} is not collecting responses for this campaign any more.
        </p>
      </div>
    );
  }

  if (page === "review" || page === "thanks") {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center" style={brand}>
        {page === "thanks" ? (
          <>
            <CircleCheck className="text-primary size-10" />
            <p className="text-base font-semibold">Thanks for your feedback.</p>
          </>
        ) : (
          logo
        )}
        <p className="text-muted-foreground max-w-sm text-sm">{resolveVars(config.invite, business)}</p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          {config.sites.map((s) => (
            <Button key={s.site} variant="outline" dataHook={`customer-site-${s.site}`} className="justify-start">
              <SiteMark id={s.site} />
              Review us on {siteById(s.site).label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // page === "feedback"
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center" style={brand}>
      {logo}
      <p className="max-w-sm text-base font-semibold">
        {resolveVars(config.feedbackQuestion, business)}
      </p>
      <FeedbackControl
        type={config.feedbackType}
        value={rating}
        onPick={setRating}
        interactive={interactive}
      />
      {config.followUpQuestion ? (
        <div className="flex w-full max-w-sm flex-col gap-2 text-left">
          <span className="text-sm font-medium">{config.followUpQuestionText}</span>
          <Textarea
            dataHook="customer-comment"
            rows={3}
            placeholder="Tell us more"
            value={comment}
            readOnly={!interactive}
            onChange={(e) => interactive && setComment(e.target.value)}
          />
        </div>
      ) : null}
      {config.consent ? (
        <Field orientation="horizontal" className="max-w-sm text-left">
          <Checkbox
            id="customer-consent"
            dataHook="customer-consent"
            checked={consent}
            onCheckedChange={(v) => interactive && setConsent(!!v)}
          />
          <FieldLabel htmlFor="customer-consent" dataHook="customer-consent-label">
            I am happy for {business} to use my feedback on their website and in their marketing.
          </FieldLabel>
        </Field>
      ) : null}
      <Button
        variant="primary"
        dataHook="customer-submit"
        onClick={interactive ? onSubmit : undefined}
        className="w-full max-w-xs"
      >
        Send feedback
      </Button>
    </div>
  );
}

// THE CONTACT SHEET (Ali, 2 Sep: "I wonder if you'd almost maybe have the
// ability to render each one at scale, and then tap on it and render full
// screen — this could be an alternate view for this step").
//
// On the send step the job is not "author this one thing", it is "check
// everything before it goes". A tab strip is the wrong shape for that: it
// shows one page and asks you to remember the other two. Every page renders
// at once, scaled down, and any one of them opens full size.
//
// SCALED, NOT SHRUNK. The pages render at their real width (420px) inside a
// clipped box and are transformed down, so the type ratios, wrapping and
// line breaks are the ones the customer gets. Re-laying them out at 210px
// would produce a picture of a page that does not exist.
//
// The tile is a real <button>: keyboard reachable, and it says what it does.
// pointer-events-none on the render underneath means a click anywhere on the
// tile opens it rather than landing on a button inside the preview.
// ZOOM, NOT TRANSFORM (Ali, 2 Sep: "the preview's review page is cropped,
// so not scaling properly").
//
// The first version put the page at its real width inside a clipped box of
// FIXED height and shrank it with `transform: scale`. Transform does not
// affect layout, so the box could not know how tall its content had become:
// at 0.5 the feedback page needed 263px and got 230 (cropped by a third of
// its consent line), while the review page needed 106 and sat in 230 with
// dead space under it. One height for pages that are 212px and 527px tall
// cannot be right for both.
//
// `zoom` scales AND participates in layout, so the tile is exactly as tall
// as its own scaled content and nothing is guessed. Chromium, Safari and
// Firefox 126+ all support it, which covers the capture browser and the
// share view.
const SHEET_W = 420;

// THE SCALE DEPENDS ON HOW MANY PAGES THERE ARE (Ali, 3 Sep: the NPS scale
// on the go-live step "still looks a bit shit").
//
// Half scale is right for a contact sheet of three — the email, the feedback
// page and the review page on the send step — where the job is "here is
// everything, at a glance". It is wrong for two, because two tiles side by
// side in a 418px column leaves each one 187px for a 420px page: the NPS
// row's eleven circles land at 16px with 7px numerals inside them and a
// half-pixel border, which is not a small version of the control, it is a
// smear. Two pages have the room to stack at near full size, so they do.
const SHEET_COLS = 2;

function PreviewSheet({ pages, renderPage, onOpen }) {
  const roomy = pages.length <= SHEET_COLS;
  const scale = roomy ? 0.9 : 0.5;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">Preview</span>
        <span className="text-muted-foreground text-xs">Everything your customers will see</span>
      </div>
      <div
        className={`grid items-start gap-3 ${roomy ? "" : "sm:grid-cols-2"}`}
        data-hook="preview-sheet"
      >
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            data-hook={`preview-tile-${page.id}`}
            onClick={() => onOpen(page.id)}
            className="hover:border-primary focus-visible:ring-ring group flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <div className="bg-background w-full overflow-hidden rounded-md border">
              <div
                className="pointer-events-none select-none"
                style={{ width: SHEET_W, zoom: scale }}
              >
                {renderPage(page.id)}
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Maximize2 className="text-muted-foreground size-3.5" />
              {page.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Everything inside a DeviceFrame is a PICTURE of a page, so the frame makes
// it inert in ONE place. Controls inside render enabled: a preview full of
// greyed-out buttons reads as a broken page rather than a preview of a
// working one. The customer DRAWER mounts CustomerPage directly, without this
// frame, which is what keeps the real preview clickable.
function DeviceFrame({ device, children }) {
  return (
    <div
      className={`bg-background mx-auto w-full overflow-hidden rounded-lg border ${
        device === "mobile" ? "max-w-[340px]" : ""
      }`}
    >
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}

function EmailPreview({ config, isReminder }) {
  const business = useBusinessName();
  const subject = isReminder ? config.reminderSubject : config.subject;
  const body = isReminder ? config.reminderBody : config.body;
  const [before, after] = resolveVars(body, business).split("{{feedbackform}}");
  return (
    // The email is a customer-facing surface too, so it takes the same
    // brand remap as the landing pages.
    <div className="flex flex-col gap-3 p-5 text-sm" style={brandSurface(config.brandColor)}>
      <div className="border-b pb-3">
        <span className="text-muted-foreground text-xs">Subject</span>
        <p className="font-medium">{resolveVars(subject, business)}</p>
      </div>
      <p className="whitespace-pre-wrap">{before}</p>
      {after !== undefined ? (
        <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-md border border-dashed p-4 text-center">
          <span className="text-sm font-medium">{resolveVars(config.feedbackQuestion, business)}</span>
          <FeedbackControl type={config.feedbackType} value={null} onPick={() => {}} interactive={false} />
        </div>
      ) : null}
      {after !== undefined ? <p className="whitespace-pre-wrap">{after}</p> : null}
      <Separator dataHook="email-preview-rule" />
      <p className="text-muted-foreground text-xs whitespace-pre-wrap">
        {resolveVars(config.legalFooter, business)}
      </p>
      <span className="text-muted-foreground text-xs underline">Unsubscribe from these emails</span>
    </div>
  );
}

function SmsPreview({ config, isReminder }) {
  const business = useBusinessName();
  const text = isReminder ? config.reminderSms : config.smsText;
  return (
    <div className="bg-muted/40 flex flex-col gap-2 p-5">
      <span className="text-muted-foreground text-center text-xs">{business}</span>
      <div className="bg-background max-w-[85%] rounded-2xl rounded-bl-sm border px-3 py-2 text-sm">
        <p className="whitespace-pre-wrap">{resolveVars(text, business)}</p>
        <p className="text-primary mt-1">wb.rvw/x8k2p1</p>
        <p className="text-muted-foreground mt-1 text-xs">Reply STOP to opt out.</p>
      </div>
    </div>
  );
}

/* ============================ hub and spokes ============================== */

// HUB AND SPOKE (Ali, 3 Sep). The two-tab hub put Campaigns and Templates
// side by side as peers, and they are not: you live in campaigns and visit
// templates. Tabs also hide where you are — a tab strip is the one piece of
// navigation the breadcrumb does not know about, so "Get Reviews" in the
// trail meant two different pages.
//
// The cost of a hub is a click. Campaigns are what people come here for
// nine times out of ten, and a landing page that is only a menu ("Campaigns
// →", "Templates →") taxes every one of those visits. So the overview has
// to earn its place as a DASHBOARD: the campaigns card carries the numbers
// you would otherwise open the table to learn — how many are running, what
// they have brought in, what is sitting in draft, when anything last
// happened — and the templates card says how many there are and whose. If
// those numbers turn out to be nothing anyone reads, the honest fallback is
// the campaigns table ON the hub with Templates as a secondary spoke off a
// header link, which is the third option and half a click cheaper.
//
// Numbers are computed from the campaigns themselves, so the card can never
// disagree with the table behind it.
function GetReviewsOverview({ campaigns, templates, onCampaigns, onTemplates, onNew }) {
  const running = campaigns.filter((c) => c.status === "Live" || c.status === "Sending").length;
  const drafts = campaigns.filter((c) => c.status === "Draft").length;
  const scheduled = campaigns.filter((c) => c.status === "Scheduled").length;
  const reviews = campaigns.reduce((n, c) => n + (c.stats?.reviews ?? 0), 0);
  const latest = campaigns.map((c) => c.lastActivity.date).sort().at(-1) ?? null;
  const presets = templates.filter((t) => t.source === "brightlocal").length;
  const yours = templates.length - presets;
  const latestTemplate = templates.map((t) => t.updated).sort().at(-1) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card dataHook="overview-campaigns" className="max-w-none">
        <CardHeader>
          <CardTitle size="small" dataHook="overview-campaigns-title">
            Campaigns
          </CardTitle>
          <CardDescription dataHook="overview-campaigns-sub">
            {campaigns.length === 0
              ? "Nothing sent or set up yet."
              : `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}, by email, text, kiosk and web link.`}
          </CardDescription>
          <CardAction>
            {campaigns.length === 0 ? (
              <Button variant="primary" size="sm" dataHook="overview-campaigns-first" onClick={() => onNew()}>
                <Plus className="size-4" /> Create your first campaign
              </Button>
            ) : (
              <Button variant="outline" size="sm" dataHook="overview-campaigns-open" onClick={onCampaigns}>
                View campaigns
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* The same nested tiles the Results card uses, so a stat looks the
              same on the overview as it does one level down. */}
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              level="nested"
              label="Running"
              value={String(running)}
              info="Live or sending right now."
              dataHook="overview-running"
            />
            <StatCard
              level="nested"
              label="Reviews gained"
              value={reviews.toLocaleString()}
              tone={reviews > 0 ? "success" : "neutral"}
              info="New reviews across every campaign, matched on timing."
              dataHook="overview-reviews-gained"
            />
            <StatCard level="nested" label="Drafts" value={String(drafts)} dataHook="overview-drafts" />
          </div>
          {campaigns.length > 0 ? (
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {scheduled > 0 ? <span>{scheduled} scheduled to send</span> : null}
              {latest ? <DateStamp label="Last activity" value={latest} dataHook="overview-last-activity" /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card dataHook="overview-templates" className="max-w-none">
        <CardHeader>
          <CardTitle size="small" dataHook="overview-templates-title">
            Templates
          </CardTitle>
          <CardDescription dataHook="overview-templates-sub">
            Ready-made campaigns to start from. Save your own from any campaign's menu.
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" dataHook="overview-templates-open" onClick={onTemplates}>
              View templates
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              level="nested"
              label="From BrightLocal"
              value={String(presets)}
              dataHook="overview-templates-brightlocal"
            />
            <StatCard level="nested" label="Yours" value={String(yours)} dataHook="overview-templates-yours" />
          </div>
          {latestTemplate ? (
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <DateStamp label="Last updated" value={latestTemplate} dataHook="overview-templates-updated" />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// PAGINATION (Ali, 3 Sep: "apparently we might also need pagination"). The
// DS Pagination, in a muted band at the foot of the card that matches the
// filter band at its head. Page size is FIVE here so nine campaigns show the
// control doing something; the real number is a product decision and lives
// in one constant. Changing a filter goes back to page 1, because page 2 of
// a filter that now has four rows is nowhere. Hidden when there is only one
// page — a pager with one page is furniture.
const PAGE_SIZE = 5;

// Every page number while there are few; first, last and a window round the
// current one with ellipses once there are many. The DS ships usePagination
// for the real thing; this is enough to see the control.
function pageItems(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const items = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(pageCount - 1, page + 1);
  if (lo > 2) items.push("gap-a");
  for (let p = lo; p <= hi; p += 1) items.push(p);
  if (hi < pageCount - 1) items.push("gap-b");
  items.push(pageCount);
  return items;
}

function TablePager({ page, pageCount, from, to, total, noun, onPage, hook }) {
  if (pageCount <= 1) return null;
  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-2 border-t px-4 py-2">
      <span className="text-muted-foreground text-sm">
        {from}–{to} of {total} {noun}
      </span>
      <span className="grow" />
      <Pagination dataHook={`${hook}-pagination`} className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled={page <= 1} onClick={() => onPage(page - 1)} />
          </PaginationItem>
          {pageItems(page, pageCount).map((item) =>
            typeof item === "number" ? (
              <PaginationItem key={item}>
                <PaginationLink page={item} isActive={item === page} onClick={() => onPage(item)} />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext disabled={page >= pageCount} onClick={() => onPage(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

// DELETE ASKS IN A DIALOG, like every other destructive action in RM (2 Sep).
// One dialog serves both spokes; the copy changes with the kind, because
// deleting a draft and deleting a template promise different things about
// what is left behind.
function DeleteDialog({ target, onCancel, onConfirm }) {
  const isTemplate = target?.kind === "template";
  return (
    <AlertDialog dataHook="delete-dialog" open={!!target} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle dataHook="delete-title">Delete “{target?.item?.name ?? ""}”?</AlertDialogTitle>
          <AlertDialogDescription dataHook="delete-desc">
            {isTemplate
              ? "Campaigns already made from this template are not affected. The template itself cannot be recovered."
              : "This draft has never been sent, so nobody has received anything and nothing stops working. The messages, review sites and settings you have written go with it, and they cannot be recovered."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button variant="destructive" dataHook="delete-yes" onClick={onConfirm}>
            {isTemplate ? "Delete template" : "Delete draft"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// THE CAMPAIGNS SPOKE. Same table as the tabbed version (3 Sep, "table for
// both"): name, mode, status, reviews gained, last activity, a menu. Sorted
// by what is happening, then by what worked — Sending and Live first,
// Stopped last, most reviews at the top within a state — so "is anything on
// fire" and "what should I copy" are both answered from the top of page 1.
const STATUS_ORDER = { Sending: 0, Live: 1, Scheduled: 2, Draft: 3, Finished: 4, Stopped: 5 };

function CampaignsPage({ campaigns, setCampaigns, setTemplates, onOpen, onNew, onStop, onRestart, onPreview }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const rows = useMemo(
    () =>
      [...campaigns]
        .filter(
          (c) =>
            (statusFilter === "all" || c.status === statusFilter) &&
            (modeFilter === "all" || c.config.channel === modeFilter),
        )
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
            (b.stats?.reviews ?? -1) - (a.stats?.reviews ?? -1),
        ),
    [campaigns, statusFilter, modeFilter],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const filtered = statusFilter !== "all" || modeFilter !== "all";

  const commitRename = () => {
    setCampaigns((cs) => cs.map((x) => (x.id === renameId ? { ...x, name: renameValue || x.name } : x)));
    setRenameId(null);
  };

  // SAVE AS TEMPLATE is the only way a user template is made. The config is
  // copied clean — no id, the two send-step confirmations unticked — so a
  // campaign made from it later starts where a new one should.
  const saveAsTemplate = (c) =>
    setTemplates((ts) => [
      {
        id: `t${Date.now()}`,
        name: c.name,
        source: "user",
        updated: "2026-09-03T17:10",
        config: { ...c.config, id: null, permission: false, privacy: false },
      },
      ...ts,
    ]);

  if (campaigns.length === 0) {
    return (
      <Card dataHook="get-reviews-empty" className="max-w-none">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Send className="text-muted-foreground size-8" />
          <p className="text-lg font-semibold">Ask your happy visitors for reviews</p>
          <p className="text-muted-foreground max-w-md text-sm">
            Send review requests by email or text, put a link on a receipt or behind a QR code, or
            run a kiosk on a tablet by the till. Feedback and new reviews land back here.
          </p>
          <Button variant="primary" dataHook="create-first-campaign" onClick={() => onNew()}>
            <Plus className="size-4" /> Create your first campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card dataHook="campaigns-table-card" className="max-w-none overflow-hidden py-0" density="condensed">
        <CardContent className="flex flex-col gap-0 p-0">
          <div className="bg-muted/40 flex flex-wrap items-center gap-2 border-b px-4 py-2">
            <div className="w-44">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger dataHook="campaign-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.keys(STATES).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select
                value={modeFilter}
                onValueChange={(v) => {
                  setModeFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger dataHook="campaign-mode-filter">
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  {Object.values(CHANNELS).map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="grow" />
            {/* The count describes the FILTER, so it only appears when one is
                on; the pager underneath owns the page range. Two counts that
                say different things in the same band read as a contradiction. */}
            {filtered ? (
              <span className="text-muted-foreground text-sm">
                {rows.length} of {campaigns.length} campaigns
              </span>
            ) : null}
          </div>
          <Table dataHook="campaigns-table">
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reviews gained</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {renameId === c.id ? (
                      <Input
                        dataHook={`campaign-${c.id}-rename`}
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                    ) : (
                      /* data-bl-link, the shell's link rule (3 Sep): foreground
                         at rest, green-700 + underline on hover. The name is
                         the way in; a Draft opens in the wizard where it left
                         off, everything else opens its page. */
                      <button
                        type="button"
                        data-bl-link=""
                        data-hook={`campaign-${c.id}-open`}
                        onClick={() => onOpen(c)}
                        className="text-left"
                      >
                        {c.name}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {CHANNELS[c.config.channel]?.label ?? ""}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={c.status} hook={`campaign-${c.id}-status`} />
                  </TableCell>
                  {/* The one number. No plus sign (3 Sep): reviews gained cannot
                      go the other way, so a sign would be decoration. A Draft
                      has nothing to count, and says so with a dash rather than
                      a zero it did not earn. */}
                  <TableCell className="text-right font-semibold tabular-nums">
                    {c.stats ? c.stats.reviews : <span className="text-muted-foreground font-normal">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <DateStamp
                      label={c.lastActivity.label}
                      value={c.lastActivity.date}
                      dataHook={`campaign-${c.id}-activity`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Same trigger pattern as the old card's menu, which is the
                        one DropdownMenu in this screen that has never blanked
                        the page (see the header note in App). */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          iconOnly
                          dataHook={`campaign-${c.id}-menu-button`}
                          aria-label="Campaign actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {c.config.channel === "kiosk" ? (
                          <DropdownMenuItem onSelect={() => onPreview(c)}>
                            <Monitor className="size-4" /> Open kiosk
                          </DropdownMenuItem>
                        ) : null}
                        {c.config.channel === "link" ? (
                          <DropdownMenuItem onSelect={() => {}}>
                            <Copy className="size-4" /> Copy link
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onSelect={() => {
                            setRenameId(c.id);
                            setRenameValue(c.name);
                          }}
                        >
                          <Pencil className="size-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onNew(c)}>
                          <Copy className="size-4" /> Re-use as new campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => saveAsTemplate(c)}>
                          <FileText className="size-4" /> Save as template
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {stateOf(c.status).canStop ? (
                          <DropdownMenuItem onSelect={() => onStop(c)}>
                            <X className="size-4" />{" "}
                            {c.status === "Scheduled" ? "Cancel send" : "Stop campaign"}
                          </DropdownMenuItem>
                        ) : null}
                        {stateOf(c.status).canRestart ? (
                          <DropdownMenuItem onSelect={() => onRestart(c)}>
                            <RotateCcw className="size-4" /> Restart campaign
                          </DropdownMenuItem>
                        ) : null}
                        {c.status === "Draft" ? (
                          <DropdownMenuItem onSelect={() => setDeleteTarget({ kind: "campaign", item: c })}>
                            <Trash2 className="size-4" /> Delete draft
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePager
            page={safePage}
            pageCount={pageCount}
            from={(safePage - 1) * PAGE_SIZE + 1}
            to={Math.min(safePage * PAGE_SIZE, rows.length)}
            total={rows.length}
            noun="campaigns"
            onPage={setPage}
            hook="campaigns"
          />
        </CardContent>
      </Card>

      <DeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          setCampaigns((cs) => cs.filter((c) => c.id !== deleteTarget.item.id));
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

// THE TEMPLATES SPOKE. Same anatomy as the campaigns table, minus status and
// the number — a template has neither — plus the two columns a template
// needs: what it asks for and where it came from. Create campaign is a real
// button on the row rather than a menu item, because it is the reason the
// page exists.
function TemplatesPage({ templates, setTemplates, onNew }) {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const pageCount = Math.max(1, Math.ceil(templates.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = templates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const duplicateTemplate = (t) =>
    setTemplates((ts) => [
      ...ts,
      { ...t, id: `t${Date.now()}`, name: `${t.name} (copy)`, source: "user", updated: "2026-09-03T17:10" },
    ]);

  return (
    <>
      <Card dataHook="templates-table-card" className="max-w-none overflow-hidden py-0" density="condensed">
        <CardContent className="flex flex-col gap-0 p-0">
          <div className="bg-muted/40 flex flex-wrap items-center gap-2 border-b px-4 py-2">
            <span className="text-muted-foreground text-sm">
              BrightLocal's templates, plus any you save from a campaign of your own.
            </span>
          </div>
          <Table dataHook="templates-table">
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Ask</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-52">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{CHANNELS[t.config.channel]?.label ?? ""}</TableCell>
                  <TableCell className="text-muted-foreground">{askLabel(t.config)}</TableCell>
                  <TableCell>
                    <SourceBadge source={t.source} hook={`template-${t.id}-source`} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <DateStamp label="Updated" value={t.updated} dataHook={`template-${t.id}-updated`} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        dataHook={`template-${t.id}-create`}
                        onClick={() => onNew(t, { fromTemplate: true })}
                      >
                        <Plus className="size-4" /> Create campaign
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            iconOnly
                            dataHook={`template-${t.id}-menu-button`}
                            aria-label="Template actions"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => duplicateTemplate(t)}>
                            <Copy className="size-4" /> Duplicate
                          </DropdownMenuItem>
                          {/* Presets cannot be deleted: they are BrightLocal's,
                              and a user who dislikes one can ignore it. A
                              duplicate is theirs and can go. */}
                          {t.source === "user" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setDeleteTarget({ kind: "template", item: t })}>
                                <Trash2 className="size-4" /> Delete template
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePager
            page={safePage}
            pageCount={pageCount}
            from={(safePage - 1) * PAGE_SIZE + 1}
            to={Math.min(safePage * PAGE_SIZE, templates.length)}
            total={templates.length}
            noun="templates"
            onPage={setPage}
            hook="templates"
          />
        </CardContent>
      </Card>

      <DeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          setTemplates((ts) => ts.filter((t) => t.id !== deleteTarget.item.id));
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

/* ================================= wizard ================================= */

function MergeVariableMenu({ onInsert, hook, variables }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" dataHook={hook}>
          Insert <ChevronDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <Command dataHook={`${hook}-command`} className="rounded-[inherit] border-0 bg-transparent shadow-none">
          <CommandList>
            <CommandGroup>
              {variables.map((v) => (
                <CommandItem key={v.token} value={v.label} onSelect={() => onInsert(v.token)}>
                  {v.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const EMAIL_VARIABLES = [
  { token: "{{firstname}}", label: "First name" },
  { token: "{{businessname}}", label: "Business name" },
  { token: "{{feedbackform}}", label: "Feedback form" },
];
const SMS_VARIABLES = [
  { token: "{{firstname}}", label: "First name" },
  { token: "{{businessname}}", label: "Business name" },
];

// TABS, NOT ARROWS (Ali, 2 Sep: "would we have each preview as tabs - the
// arrows to go between are a little hidden (hides the previews)").
//
// The pager was a prev / label / next triplet, and it had two problems.
// The first is that nothing on screen said how many previews there were:
// you had to press an arrow to find out that a second one existed, and on
// the send step there are three. The second is what Ali saw — the circular
// arrow buttons sit over the top edge of the frame below and read as part
// of the preview rather than as a control over it.
//
// Tabs fix both: every page is named and countable at a glance, and the
// current one is marked rather than merely displayed. This is the DS Tabs
// strip, unstyled beyond `h-8` — the pill look is right here, because
// unlike the Review Inbox's full-width status strip this is a small
// segmented control in a card header, which is exactly what TabsList's
// default is for. One preview left (every step but send / go live) still
// renders a plain label: a one-tab tab strip is a control that cannot do
// anything.
function PreviewPane({ pages, index, setIndex, device, setDevice, children }) {
  const current = pages[index] ?? pages[0];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">Preview</span>
        <div className="flex items-center gap-1.5">
          {pages.length > 1 ? (
            <Tabs
              dataHook="preview-tabs"
              value={current?.id}
              onValueChange={(v) => {
                const i = pages.findIndex((p) => p.id === v);
                if (i >= 0) setIndex(i);
              }}
            >
              <TabsList dataHook="preview-tabs-list" className="h-8">
                {pages.map((p) => (
                  <TabsTrigger
                    key={p.id}
                    value={p.id}
                    dataHook={`preview-tab-${p.id}`}
                    className="text-xs"
                  >
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <span className="text-muted-foreground text-xs">{current?.label}</span>
          )}
          {current?.id !== "sms" ? (
            <>
              <Separator dataHook="preview-rule" orientation="vertical" className="mx-1 h-5" />
              <Button
                variant={device === "desktop" ? "secondary" : "ghost"}
                iconOnly
                size="sm"
                dataHook="preview-desktop"
                aria-label="Desktop preview"
                onClick={() => setDevice("desktop")}
              >
                <Monitor className="size-4" />
              </Button>
              <Button
                variant={device === "mobile" ? "secondary" : "ghost"}
                iconOnly
                size="sm"
                dataHook="preview-mobile"
                aria-label="Mobile preview"
                onClick={() => setDevice("mobile")}
              >
                <Smartphone className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <DeviceFrame device={current?.id === "sms" ? "mobile" : device}>{children}</DeviceFrame>
    </div>
  );
}

function CampaignWizard({
  draft,
  setDraft,
  step,
  setStep,
  history,
  setHistory,
  templates,
  onCancel,
  onLaunch,
  onOpenCustomerPreview,
  editingExisting,
}) {
  const business = useBusinessName();
  const [error, setError] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  // DEFAULTED (3 Sep, "radios should always have a default selected"):
  // templates when there are any, because that is what most people want
  // and the reason the tab exists; fresh only when there is nothing to
  // start from.
  const [startMode, setStartMode] = useState(templates.length ? "template" : "fresh");
  const [templatePeek, setTemplatePeek] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [showExclusions, setShowExclusions] = useState(false);
  const [creditsBought, setCreditsBought] = useState(0);
  const [infoModal, setInfoModal] = useState(null);
  const [creditStage, setCreditStage] = useState(null);
  const [creditPackage, setCreditPackage] = useState(null);
  const [sendConfirm, setSendConfirm] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [previewIndex, setPreviewIndex] = useState(0);
  // Which preview is open full size, by page id. null = none.
  const [fullPage, setFullPage] = useState(null);

  const flow = buildFlow(draft);
  const flowIndex = flow.indexOf(step);
  const patch = (p) => {
    setDraft((d) => ({ ...d, ...p }));
    setError("");
  };

  const balance = STARTING_CREDITS + creditsBought;
  const smsCost = RECIPIENT_COUNT * (CREDIT_RATES[draft.country] ?? 2);
  const creditsShort = draft.channel === "sms" && smsCost > balance;

  const go = (next) => {
    setHistory((h) => [...h, step]);
    setStep(next);
    setError("");
    setPreviewIndex(0);
  };
  const goBack = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setStep(h[h.length - 1]);
      setError("");
      setPreviewIndex(0);
      return h.slice(0, -1);
    });
  };

  function validate() {
    if (step === "start" && !startMode) return "Choose an option to continue.";
    if (step === "name" && !draft.name.trim()) return "Give your campaign a name.";
    if (step === "email") {
      const count = (draft.body.match(/\{\{feedbackform\}\}/g) ?? []).length;
      if (count !== 1) return "Your message must include the feedback form token exactly once.";
    }
    if (step === "sites" && draft.sites.some((s) => !s.url.trim()))
      return "Add a profile URL for every review site.";
    if (step === "recipients") {
      if (draft.channel === "sms" && !draft.country)
        return "Choose the country of your contacts first.";
      if (!uploaded) return "Upload a CSV file to continue.";
    }
    if (step === "columns" && !draft.columns.includes("contact"))
      return draft.channel === "sms"
        ? "Choose which column holds the mobile number."
        : "Choose which column holds the email address.";
    if (step === "check") {
      if (!(draft.permission && draft.privacy)) return "Please tick both confirmations to continue.";
      if (creditsShort) return "You do not have enough credits to send this campaign.";
    }
    return "";
  }

  function next() {
    const e = validate();
    if (e) {
      setError(e);
      return;
    }
    if (step === "start") {
      if (startMode === "fresh") {
        patch({ name: "Campaign, 19 Aug 2026" });
        go("name");
      } else {
        go("template");
      }
      return;
    }
    if (step === "reminder" && draft.reminder && !draft.reminderBody) {
      patch({
        reminderSubject: `Reminder: ${draft.subject}`,
        reminderBody: draft.body,
        reminderSms: `Hi {{firstname}}, just a reminder. We would love to hear about your experience at {{businessname}}.`,
      });
    }
    if (step === "send") {
      setSendConfirm(true);
      return;
    }
    if (step === "golive") {
      onLaunch();
      return;
    }
    const i = flow.indexOf(step);
    if (i >= 0 && flow[i + 1]) go(flow[i + 1]);
  }

  // The go-live step names the thing being launched. A kiosk is not "put
  // live", it is opened on a tablet, and the title should say which.
  const copy =
    step === "golive" && draft.channel === "kiosk"
      ? { title: "Ready to launch the kiosk" }
      : STEP_COPY[step] ?? {};
  // The flow LENGTH is not knowable until both branching answers are in, so
  // the total is withheld rather than shown as a number that climbs from 3
  // to 12 as the user answers.
  const shapeKnown = !!draft.ask && !!draft.channel;
  const eyebrow =
    flowIndex < 0
      ? editingExisting
        ? "Edit campaign"
        : "New campaign"
      : shapeKnown
        ? `Step ${flowIndex + 1} of ${flow.length}`
        : `Step ${flowIndex + 1}`;
  const continueLabel =
    step === "columns"
      ? "Confirm"
      : step === "send"
        ? "Send now"
        : step === "golive"
          ? draft.channel === "kiosk"
            ? "Launch kiosk"
            : "Put live"
          : "Next";

  /* -- preview pages available at this step ------------------------------- */
  const previewPages = useMemo(() => {
    const pages = [];
    if (draft.channel === "email") pages.push({ id: "email", label: "Email" });
    if (draft.channel === "sms") pages.push({ id: "sms", label: "Text message" });
    if (draft.ask === "feedback") pages.push({ id: "feedback", label: "Feedback page" });
    pages.push({ id: "review", label: "Review page" });
    return pages;
  }, [draft.channel, draft.ask]);

  const splitStep = ["email", "sms", "reminder-design", "sites", "send", "golive"].includes(step);
  const activePreview = (() => {
    if (step === "email" || (step === "reminder-design" && draft.channel === "email")) return { id: "email", label: step === "reminder-design" ? "Reminder email" : "Email" };
    if (step === "sms" || (step === "reminder-design" && draft.channel === "sms")) return { id: "sms", label: step === "reminder-design" ? "Reminder text" : "Text message" };
    if (step === "sites") return { id: "review", label: "Review page" };
    return previewPages[Math.min(previewIndex, previewPages.length - 1)] ?? previewPages[0];
  })();
  const sheetStep = step === "send" || step === "golive";
  const pagerPages = step === "send" || step === "golive" ? previewPages : [activePreview];
  const pagerIndex = step === "send" || step === "golive" ? Math.min(previewIndex, previewPages.length - 1) : 0;

  // One page, by id. Both the tab view, the contact sheet and the full-size
  // dialog go through here, so a change to any customer surface shows up in
  // all three by construction.
  function renderPageById(id, isReminder = false) {
    if (id === "email") return <EmailPreview config={draft} isReminder={isReminder} />;
    if (id === "sms") return <SmsPreview config={draft} isReminder={isReminder} />;
    return (
      <CustomerPage
        page={id === "feedback" ? "feedback" : "review"}
        config={draft}
        interactive={false}
        rating={draft.feedbackType === "nps" ? 9 : draft.feedbackType === "thumbs" ? "up" : 4}
        setRating={() => {}}
        comment=""
        setComment={() => {}}
        consent={false}
        setConsent={() => {}}
        onSubmit={() => {}}
      />
    );
  }

  function renderPreviewBody() {
    const isReminder = step === "reminder-design";
    if (activePreview.id === "email") return <EmailPreview config={draft} isReminder={isReminder} />;
    if (activePreview.id === "sms") return <SmsPreview config={draft} isReminder={isReminder} />;
    return (
      <CustomerPage
        page={activePreview.id === "feedback" ? "feedback" : "review"}
        config={draft}
        interactive={false}
        rating={draft.feedbackType === "nps" ? 9 : draft.feedbackType === "thumbs" ? "up" : 4}
        setRating={() => {}}
        comment=""
        setComment={() => {}}
        consent={false}
        setConsent={() => {}}
        onSubmit={() => {}}
      />
    );
  }

  /* -- step bodies -------------------------------------------------------- */
  function StepBody() {
    if (step === "start") {
      return (
        <ChoiceCards
          name="start"
          value={startMode}
          onChange={setStartMode}
          options={[
            ...(templates.length
              ? [
                  {
                    id: "template",
                    label: "Start from a template",
                    caption: "BrightLocal's templates, or one you saved from a campaign of your own.",
                  },
                ]
              : []),
            { id: "fresh", label: "Start fresh", caption: "Build a new campaign from scratch." },
          ]}
        />
      );
    }

    // THE TEMPLATE PICKER replaces "re-use an existing campaign" here.
    // Re-using a campaign still exists — it is on the campaign's row menu,
    // where you are looking at campaigns — but the thing you start a NEW
    // campaign from is a template, and the templates list is the one place
    // BrightLocal's presets and the user's own sit side by side.
    if (step === "template") {
      return (
        <div className="flex flex-col gap-2">
          {templates.map((t) => {
            const open = templatePeek === t.id;
            return (
              <div key={t.id} className="overflow-hidden rounded-lg border">
                <button
                  type="button"
                  data-hook={`template-${t.id}`}
                  onClick={() => setTemplatePeek(open ? null : t.id)}
                  className="hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
                  <span className="text-muted-foreground hidden text-xs sm:block">
                    {CHANNELS[t.config.channel]?.label ?? ""} · {askLabel(t.config)}
                  </span>
                  <SourceBadge source={t.source} hook={`template-${t.id}-source`} />
                  {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {open ? (
                  <div className="bg-muted/30 flex flex-col gap-3 border-t px-4 py-3">
                    <dl className="grid gap-1.5">
                      {campaignSummary(t.config).map((r) => (
                        <div key={r.k} className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
                          <dt className="text-muted-foreground">{r.k}</dt>
                          <dd>{r.v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div>
                      <Button
                        variant="primary"
                        size="sm"
                        dataHook={`template-${t.id}-use`}
                        onClick={() => {
                          setDraft({ ...t.config, id: null, name: t.name, permission: false, privacy: false });
                          go("name");
                        }}
                      >
                        Use this template
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    }

    if (step === "name") {
      return (
        <div className="flex max-w-xl flex-col gap-5">
          <LabelledField
            id="campaign-name"
            hook="campaign-name"
            label="Campaign name"
            description="Only you see this. You can rename it any time."
          >
            <Input
              id="campaign-name"
              dataHook="campaign-name-input"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </LabelledField>

          {/* BRANDING SITS TOGETHER. The logo was already here; the colour
              belongs beside it, because they are the same decision made
              twice ("what does this look like to my customer?"). */}
          <Field dataHook="brand-colour-field">
            <FieldLabel htmlFor="brand-neutral" dataHook="brand-colour-label">
              Accent colour
            </FieldLabel>
            <FieldDescription dataHook="brand-colour-desc">
              The colour of the buttons on your customers' pages and emails. Nothing in the brief
              specifies a branding model for Get Reviews, so this is the smallest one that stops the
              customer seeing BrightLocal's green.
            </FieldDescription>
            <BrandPicker value={draft.brandColor} onChange={(v) => patch({ brandColor: v })} />
          </Field>

          <Field dataHook="campaign-logo-field">
            <FieldLabel htmlFor="campaign-logo" dataHook="campaign-logo-label" optional>
              Logo
            </FieldLabel>
            {draft.logo ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                {/* The same mark the customer sees, not a second idea of it. */}
                <div className="shrink-0" style={brandSurface(draft.brandColor)}>
                  <svg viewBox="0 0 32 32" className="size-10" aria-hidden>
                    <circle cx="16" cy="16" r="15" className="fill-primary" />
                    <path
                      d="M16 7c5 3 7 6 7 10a7 7 0 1 1-14 0c0-4 2-7 7-10Z"
                      className="fill-primary-foreground"
                      opacity="0.9"
                    />
                    <circle cx="16" cy="18" r="3" className="fill-primary" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{slugOf(business)}-logo.png</p>
                  <p className="text-muted-foreground text-xs">
                    Shown on your landing pages and messages
                  </p>
                </div>
                <Button variant="outline" size="sm" dataHook="campaign-logo-remove" onClick={() => patch({ logo: false })}>
                  Remove
                </Button>
              </div>
            ) : (
              <button
                type="button"
                id="campaign-logo"
                data-hook="campaign-logo-upload"
                onClick={() => patch({ logo: true })}
                className="border-border hover:border-primary focus-visible:ring-ring flex flex-col items-center gap-1 rounded-lg border border-dashed p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <Upload className="text-muted-foreground size-5" />
                <span className="text-sm font-medium">Upload a logo</span>
                <span className="text-muted-foreground text-xs">PNG or JPG, square works best</span>
              </button>
            )}
          </Field>
        </div>
      );
    }

    if (step === "ask") {
      return (
        <div className="flex flex-col gap-3">
          <ChoiceCards
            name="ask"
            value={draft.ask}
            onChange={(v) => patch({ ask: v })}
            options={[
              {
                id: "feedback",
                label: "Internal feedback, then a public review",
                caption:
                  "Customers tell you how it went first, then everyone is invited to leave a public review.",
              },
              {
                id: "review",
                label: "Go straight to a public review",
                caption: "Customers are invited to leave a public review right away.",
              },
            ]}
          />
          <div>
            <Button variant="ghost" size="sm" dataHook="ask-more-info" onClick={() => setInfoModal("ask")}>
              <Info className="size-4" /> What is the difference?
            </Button>
          </div>
          {/* AUDIT 3.3.X. Whichever option is chosen, every respondent reaches
              the same review page: there is no low-score diversion to
              configure, so this feature cannot be turned into a review gate. */}
          <AlertInfo
            dataHook="gating-note"
            description="Everyone who responds sees the same review page, whatever they scored. Sending only your happy customers to a review site is called review gating, and it is against the rules of most review sites."
          />
        </div>
      );
    }

    if (step === "feedback") {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Field dataHook="feedback-type-field">
              <FieldLabel htmlFor="feedback-type-nps" dataHook="feedback-type-label">
                Feedback type
              </FieldLabel>
              <ChoiceCards
                name="feedback-type"
                value={draft.feedbackType}
                onChange={(v) =>
                  patch({ feedbackType: v, feedbackQuestion: FEEDBACK_TYPES[v].question })
                }
                options={Object.values(FEEDBACK_TYPES).map((t) => ({
                  id: t.id,
                  label: t.label,
                  caption: t.caption,
                }))}
              />
            </Field>
            <LabelledField
              id="feedback-question"
              hook="feedback-question"
              label="Question"
              description="Use {{businessname}} to drop in the location name."
            >
              <Input
                id="feedback-question"
                dataHook="feedback-question-input"
                value={draft.feedbackQuestion}
                onChange={(e) => patch({ feedbackQuestion: e.target.value })}
              />
            </LabelledField>
            <Field orientation="horizontal">
              <Checkbox
                id="follow-up-question"
                dataHook="follow-up-question"
                checked={draft.followUpQuestion}
                onCheckedChange={(v) => patch({ followUpQuestion: !!v })}
              />
              <FieldContent>
                <FieldLabel htmlFor="follow-up-question" dataHook="follow-up-question-label">
                  Ask a follow-up question
                </FieldLabel>
                {draft.followUpQuestion ? (
                  <Input
                    dataHook="follow-up-question-input"
                    value={draft.followUpQuestionText}
                    onChange={(e) => patch({ followUpQuestionText: e.target.value })}
                  />
                ) : null}
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="testimonial-consent"
                dataHook="testimonial-consent"
                checked={draft.consent}
                onCheckedChange={(v) => patch({ consent: !!v })}
              />
              <FieldContent>
                <FieldLabel htmlFor="testimonial-consent" dataHook="testimonial-consent-label">
                  Ask permission to use feedback as a testimonial
                </FieldLabel>
                <FieldDescription dataHook="testimonial-consent-desc">
                  Only feedback with permission can be downloaded for your website and marketing.
                </FieldDescription>
              </FieldContent>
            </Field>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold">Preview</span>
            <DeviceFrame device="desktop">
              <CustomerPage
                page="feedback"
                config={draft}
                interactive={false}
                rating={draft.feedbackType === "nps" ? 9 : draft.feedbackType === "thumbs" ? "up" : 4}
                setRating={() => {}}
                comment=""
                setComment={() => {}}
                consent={false}
                setConsent={() => {}}
                onSubmit={() => {}}
              />
            </DeviceFrame>
          </div>
        </div>
      );
    }

    if (step === "channel") {
      return (
        <ChoiceCards
          name="channel"
          value={draft.channel}
          onChange={(v) => patch({ channel: v, reminder: null })}
          options={[
            { id: "email", label: "Email", caption: "Send your request to a list of customers by email." },
            { id: "sms", label: "SMS", caption: "Text your request to a list of customers." },
            {
              id: "kiosk",
              label: "Kiosk",
              caption:
                "A tablet by the till or at reception. Opens full screen and comes back to the first question after every answer.",
            },
            {
              id: "link",
              label: "Web link",
              caption:
                "One link you can put anywhere: on a receipt, in your email signature, or behind a QR code.",
            },
          ]}
        />
      );
    }

    if (step === "email" || (step === "reminder-design" && draft.channel === "email")) {
      const isReminder = step === "reminder-design";
      const subject = isReminder ? draft.reminderSubject : draft.subject;
      const body = isReminder ? draft.reminderBody : draft.body;
      const setSubject = (v) => patch(isReminder ? { reminderSubject: v } : { subject: v });
      const setBody = (v) => patch(isReminder ? { reminderBody: v } : { body: v });
      const tokenCount = (body.match(/\{\{feedbackform\}\}/g) ?? []).length;
      return (
        <div className="flex flex-col gap-5">
          {isReminder ? (
            <AlertInfo
              dataHook="reminder-timing"
              description="Sent 48 hours after the first email, only to people who have not responded. This timing cannot be changed."
            />
          ) : null}
          <LabelledField id="email-subject" hook="email-subject" label="Subject">
            <Input
              id="email-subject"
              dataHook="email-subject-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </LabelledField>
          <Field dataHook="email-body-field">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="email-body" dataHook="email-body-label">
                Message body
              </FieldLabel>
              <MergeVariableMenu
                hook="email-insert"
                variables={EMAIL_VARIABLES}
                onInsert={(t) => setBody(`${body}${t}`)}
              />
            </div>
            <Textarea
              id="email-body"
              dataHook="email-body-input"
              rows={9}
              value={body}
              error={tokenCount !== 1}
              onChange={(e) => setBody(e.target.value)}
            />
            <FieldDescription dataHook="email-body-desc">
              {tokenCount === 1
                ? "The feedback form token is where the rating control appears in the email."
                : "Your message must include the feedback form token exactly once."}
            </FieldDescription>
          </Field>
          {/* The footer belongs to the CAMPAIGN, not to one message, so it is
              edited once on the first email and only noted on the follow-up. */}
          {isReminder ? (
            <p className="text-muted-foreground text-sm">
              The same legal footer is added to this email. Edit it on the first email step.
            </p>
          ) : (
            <>
              <LabelledField id="email-footer" hook="email-footer" label="Legal footer">
                <Textarea
                  id="email-footer"
                  dataHook="email-footer-input"
                  rows={3}
                  value={draft.legalFooter}
                  onChange={(e) => patch({ legalFooter: e.target.value })}
                />
              </LabelledField>
              <div>
                <Button variant="ghost" size="sm" dataHook="legal-more-info" onClick={() => setInfoModal("legal")}>
                  <Info className="size-4" /> Why is a legal footer required?
                </Button>
              </div>
            </>
          )}
        </div>
      );
    }

    if (step === "sms" || (step === "reminder-design" && draft.channel === "sms")) {
      const isReminder = step === "reminder-design";
      const text = isReminder ? draft.reminderSms : draft.smsText;
      const setText = (v) => patch(isReminder ? { reminderSms: v } : { smsText: v });
      const resolved = resolveVars(text, business);
      const total = resolved.length + 40; // link and opt-out line are added for every send
      const segments = Math.max(1, Math.ceil(total / 160));
      return (
        <div className="flex flex-col gap-5">
          {isReminder ? (
            <AlertInfo
              dataHook="reminder-timing"
              description="Sent 48 hours after the first text, only to people who have not responded. This timing cannot be changed."
            />
          ) : null}
          <Field dataHook="sms-body-field">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="sms-body" dataHook="sms-body-label">
                Message
              </FieldLabel>
              <MergeVariableMenu
                hook="sms-insert"
                variables={SMS_VARIABLES}
                onInsert={(t) => setText(`${text}${t}`)}
              />
            </div>
            <Textarea
              id="sms-body"
              dataHook="sms-body-input"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <FieldDescription dataHook="sms-body-desc">
              {total} characters, {segments} text{segments === 1 ? "" : "s"} per recipient.
            </FieldDescription>
          </Field>
          <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground text-xs font-medium">
              Added to every text automatically. Cannot be edited or removed.
            </span>
            <span>wb.rvw/x8k2p1 (tracking link, unique per recipient)</span>
            <span>Reply STOP to opt out.</span>
          </div>
        </div>
      );
    }

    if (step === "reminder") {
      return (
        <ChoiceCards
          name="reminder"
          value={draft.reminder === null ? null : draft.reminder ? "yes" : "no"}
          onChange={(v) => patch({ reminder: v === "yes" })}
          options={[
            {
              id: "yes",
              label: "Yes, send one reminder",
              // The step description above already says when and to whom, so
              // this said it twice, word for word. The option only needs to
              // say what it adds.
              caption: "One extra nudge, two days after the first.",
            },
            { id: "no", label: "No", caption: `Just the one ${draft.channel === "sms" ? "text" : "email"}.` },
          ]}
        />
      );
    }

    if (step === "sites") {
      const used = draft.sites.map((s) => s.site);
      const move = (i, dir) => {
        const next = [...draft.sites];
        const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        patch({ sites: next });
      };
      return (
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            At least 1 review site is required, up to 3. Row order sets the button order on the
            customer's review page.
          </p>
          {draft.sites.map((row, i) => (
            <div key={`${row.site}-${i}`} className="flex flex-wrap items-end gap-2">
              {/* Reorder appears only when there is something to reorder, and
                  on one line: stacked chevrons across two rows read as
                  misaligned when half of them are disabled. */}
              {draft.sites.length > 1 ? (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    iconOnly
                    size="sm"
                    dataHook={`site-${i}-up`}
                    aria-label={`Move ${siteById(row.site).label} up`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    iconOnly
                    size="sm"
                    dataHook={`site-${i}-down`}
                    aria-label={`Move ${siteById(row.site).label} down`}
                    disabled={i === draft.sites.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              ) : null}
              <div className="w-40">
                <Select
                  value={row.site}
                  onValueChange={(v) => {
                    const next = [...draft.sites];
                    next[i] = { ...next[i], site: v };
                    patch({ sites: next });
                  }}
                >
                  <SelectTrigger dataHook={`site-${i}-select`}>
                    <SelectValue placeholder="Review site" />
                  </SelectTrigger>
                  <SelectContent>
                    {SITES.filter((s) => s.id === row.site || !used.includes(s.id)).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-48 flex-1">
                <Input
                  dataHook={`site-${i}-url`}
                  placeholder="Paste your profile URL"
                  value={row.url}
                  error={!row.url.trim()}
                  onChange={(e) => {
                    const next = [...draft.sites];
                    next[i] = { ...next[i], url: e.target.value };
                    patch({ sites: next });
                  }}
                />
              </div>
              {draft.sites.length > 1 ? (
                <Button
                  variant="ghost"
                  iconOnly
                  dataHook={`site-${i}-remove`}
                  aria-label="Remove review site"
                  onClick={() => patch({ sites: draft.sites.filter((_, k) => k !== i) })}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
          {draft.sites.length < 3 ? (
            <div>
              <Button
                variant="outline"
                size="sm"
                dataHook="site-add"
                onClick={() => {
                  const free = SITES.find((s) => !used.includes(s.id));
                  if (free) patch({ sites: [...draft.sites, { site: free.id, url: "" }] });
                }}
              >
                <Plus className="size-4" /> Add a review site
              </Button>
            </div>
          ) : null}
          {/* A TEXTAREA (Ali, 3 Sep). This is a sentence addressed to the
              customer, not a value: it runs past the width of a single-line
              field, so the writer could only ever see the end of what they
              had typed. Three rows shows the whole thing. */}
          <LabelledField
            id="review-invite"
            hook="review-invite"
            label="Invitation wording"
            description="Shown above the review site buttons."
          >
            <Textarea
              id="review-invite"
              dataHook="review-invite-input"
              rows={3}
              value={draft.invite}
              onChange={(e) => patch({ invite: e.target.value })}
            />
          </LabelledField>
        </div>
      );
    }

    if (step === "recipients") {
      return (
        <div className="flex flex-col gap-5">
          {draft.channel === "sms" ? (
            <Field dataHook="country-field">
              <FieldLabel htmlFor="country-UK" dataHook="country-label">
                Country of contacts
              </FieldLabel>
              <FieldDescription dataHook="country-desc">
                This sets the credit rate for each text.
              </FieldDescription>
              <ChoiceCards
                name="country"
                value={draft.country}
                onChange={(v) => patch({ country: v })}
                columns={3}
                options={[
                  { id: "UK", label: "United Kingdom", caption: "2 credits per text" },
                  { id: "USA", label: "United States", caption: "1 credit per text" },
                  { id: "Canada", label: "Canada", caption: "1 credit per text" },
                ]}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border p-3">
                <span className="text-sm">
                  You have <strong>{balance.toLocaleString()}</strong> SMS credits.
                </span>
                <span className="grow" />
                <Button variant="outline" size="sm" dataHook="buy-credits" onClick={() => setCreditStage("packages")}>
                  Buy credits
                </Button>
              </div>
            </Field>
          ) : null}

          <Field dataHook="contacts-field">
            <FieldLabel htmlFor="contacts-upload" dataHook="contacts-label">
              Contact list
            </FieldLabel>
            <FieldDescription dataHook="contacts-desc">
              Upload a CSV of the people you would like to ask.
            </FieldDescription>
            <button
              type="button"
              id="contacts-upload"
              data-hook="contacts-upload"
              onClick={() => setUploaded(true)}
              className="border-border hover:border-primary focus-visible:ring-ring flex flex-col items-center gap-1 rounded-lg border border-dashed p-8 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {uploaded ? (
                <>
                  <FileText className="text-primary size-6" />
                  <span className="text-sm font-medium">customers.csv</span>
                  <span className="text-muted-foreground text-xs">120 rows, click to replace</span>
                </>
              ) : (
                <>
                  <Upload className="text-muted-foreground size-6" />
                  <span className="text-sm font-medium">Drop your CSV here, or choose a file</span>
                  <span className="text-muted-foreground text-xs">
                    One row per person, with a header row
                  </span>
                </>
              )}
            </button>
          </Field>
        </div>
      );
    }

    if (step === "columns") {
      const contactLabel = draft.channel === "sms" ? "Mobile number" : "Email address";
      const options = [
        { id: "skip", label: "Do not import" },
        { id: "contact", label: contactLabel },
        { id: "name", label: "First name" },
        { id: "lastname", label: "Last name" },
      ];
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="text-muted-foreground size-4" />
            <span className="font-medium">customers.csv</span>
            <span className="text-muted-foreground">120 rows</span>
          </div>
          <Field orientation="horizontal">
            <Checkbox
              id="header-row"
              dataHook="header-row"
              checked={draft.headerRow}
              onCheckedChange={(v) => patch({ headerRow: !!v })}
            />
            <FieldLabel htmlFor="header-row" dataHook="header-row-label">
              First row contains column names
            </FieldLabel>
          </Field>
          <div className="overflow-x-auto rounded-lg border">
            <Table dataHook="csv-map-table">
              <TableHeader>
                <TableRow>
                  {[0, 1, 2].map((i) => (
                    <TableHead key={i}>
                      <Select
                        value={draft.columns[i]}
                        onValueChange={(v) => {
                          const next = [...draft.columns];
                          next[i] = v;
                          patch({ columns: next });
                        }}
                      >
                        <SelectTrigger dataHook={`column-${i}-select`}>
                          <SelectValue placeholder="Choose a field" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.headerRow ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground">first_name</TableCell>
                    <TableCell className="text-muted-foreground">last_name</TableCell>
                    <TableCell className="text-muted-foreground">
                      {draft.channel === "sms" ? "mobile" : "email"}
                    </TableCell>
                  </TableRow>
                ) : null}
                {CSV_PREVIEW.map((r) => (
                  <TableRow key={r.c}>
                    <TableCell>{r.a}</TableCell>
                    <TableCell>{r.b}</TableCell>
                    <TableCell>{draft.channel === "sms" ? r.cSms : r.c}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-xs">
                    and 116 more rows
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-muted-foreground text-sm">
            First name is optional. If you leave it out, messages open with "Hi there" instead.
          </p>
        </div>
      );
    }

    if (step === "check") {
      const exclusions = [
        { count: 4, label: "duplicates", note: "the same address twice" },
        { count: 3, label: "invalid rows", note: "no contact detail" },
        { count: 1, label: "unsubscribed", note: "opted out before" },
      ];
      return (
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border p-4">
            <p className="text-base font-semibold">
              {RECIPIENT_COUNT} people will get this {draft.channel === "sms" ? "text" : "email"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              From 120 rows in customers.csv. 8 rows were left out:
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {exclusions.map((x) => (
                <li key={x.label} className="flex gap-2">
                  <span className="w-6 shrink-0 text-right font-medium tabular-nums">{x.count}</span>
                  <span>{x.label}</span>
                  <span className="text-muted-foreground">({x.note})</span>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              dataHook="toggle-exclusions"
              className="-ml-2 mt-1"
              onClick={() => setShowExclusions((v) => !v)}
            >
              {showExclusions ? "Hide the rows we left out" : "Show the rows we left out"}
              {showExclusions ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
            {showExclusions ? (
              <div className="bg-muted/40 mt-2 flex flex-col gap-1 rounded-md border p-3 text-sm">
                {[
                  { row: 12, value: "sophie.hart@example.com", reason: "Duplicate of row 4" },
                  { row: 31, value: "(blank)", reason: "No contact detail" },
                  { row: 58, value: "dan.pryce@example.com", reason: "Duplicate of row 9" },
                  { row: 77, value: "tom.bailey@example.com", reason: "Unsubscribed 3 Feb 2026" },
                ].map((x) => (
                  <div key={x.row} className="grid grid-cols-[4rem_1fr_auto] gap-2">
                    <span className="text-muted-foreground">Row {x.row}</span>
                    <span className="truncate">{x.value}</span>
                    <span className="text-muted-foreground">{x.reason}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {draft.channel === "sms" ? (
            creditsShort ? (
              <AlertWarning
                dataHook="credits-short"
                title="Not enough SMS credits"
                description={`This send needs ${smsCost.toLocaleString()} credits and you have ${balance.toLocaleString()}. That is ${RECIPIENT_COUNT} people at ${CREDIT_RATES[draft.country] ?? 2} credits each for ${draft.country}.`}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    dataHook="buy-credits-short"
                    onClick={() => setCreditStage("packages")}
                  >
                    Buy SMS credits
                  </Button>
                }
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                This send uses {smsCost.toLocaleString()} of your {balance.toLocaleString()} credits.
              </p>
            )
          ) : null}

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <span className="text-sm font-medium">Before we message these people, please confirm:</span>
            <Field orientation="horizontal">
              <Checkbox
                id="confirm-permission"
                dataHook="confirm-permission"
                checked={draft.permission}
                onCheckedChange={(v) => patch({ permission: !!v })}
              />
              <FieldLabel htmlFor="confirm-permission" dataHook="confirm-permission-label">
                I have permission to contact these people for marketing, in line with the terms and
                conditions.
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="confirm-privacy"
                dataHook="confirm-privacy"
                checked={draft.privacy}
                onCheckedChange={(v) => patch({ privacy: !!v })}
              />
              <FieldLabel htmlFor="confirm-privacy" dataHook="confirm-privacy-label">
                I have read and agree to the privacy policy.
              </FieldLabel>
            </Field>
          </div>
        </div>
      );
    }

    if (step === "send" || step === "golive") {
      const rows =
        step === "golive"
          ? campaignSummary(draft)
          : [
              { k: "To", v: `${RECIPIENT_COUNT} people, from customers.csv` },
              ...campaignSummary(draft),
            ];
      return (
        <div className="flex flex-col gap-4">
          <dl className="divide-border divide-y rounded-lg border">
            {rows.map((r) => (
              <div key={r.k} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
          {step === "golive" ? (
            <AlertInfo
              dataHook="link-note"
              description={
                draft.channel === "kiosk"
                  ? "Your kiosk page is created the moment the campaign goes live. Open it on the tablet and it stays full screen, coming back to the first question after every answer."
                  : "Your link is created the moment the campaign goes live."
              }
            />
          ) : null}
          <div>
            <Button variant="outline" size="sm" dataHook="preview-as-customer" onClick={() => onOpenCustomerPreview(draft)}>
              <Eye className="size-4" /> Preview as a customer
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }

  const stepPercent = flowIndex >= 0 ? ((flowIndex + 1) / flow.length) * 100 : 0;

  const phases = phasesFor(flow);
  const currentPhase = STEP_PHASE[step] ?? phases[0]?.id;

  // SAME SHELL AS THE WIDGET WIZARDS, from @brightlocal/wizard-shell (Ali,
  // 2 Sep: "if it is a wizard, it should follow the same format as Create
  // Widgets"). Pinned header with title, description and the phase rail; the
  // step scrolls; pinned footer with Cancel on the left and Back / continue on
  // the right.
  //
  // NO VERB IN THE TITLE. Creating, re-using and resuming a draft are one
  // flow, so the header names the campaign, not the task: "Untitled campaign"
  // until it has a name.
  const footer = (
    <>
      <Button variant="ghost" dataHook="wizard-cancel" onClick={() => setCancelConfirm(true)}>
        Cancel
      </Button>
      <span className="grow" />
      {history.length > 0 ? (
        <Button variant="outline" dataHook="wizard-back" onClick={goBack}>
          Back
        </Button>
      ) : null}
      {/* The re-use step advances from a ROW ("Use these settings"), not from
          the footer, so a Next button there is a dead control. */}
      {step === "template" ? null : (
        <Button variant="primary" dataHook="wizard-next" onClick={next}>
          {continueLabel}
        </Button>
      )}
    </>
  );

  return (
    <WizardShell
      dataHook="campaign-wizard"
      title={draft.name?.trim() || "Untitled campaign"}
      description="Set up a campaign to ask your customers for reviews."
      steps={flowIndex >= 0 ? phases : null}
      value={currentPhase}
      footer={footer}
      error={error}
    >
      <Card dataHook="wizard-card" className="max-w-none">
        <CardHeader>
          <CardTitle dataHook="wizard-step-title">{copy.title}</CardTitle>
          {copy.sub ? (
            <CardDescription dataHook="wizard-step-sub">{copy.sub}</CardDescription>
          ) : null}
        </CardHeader>

        <CardContent>
          {splitStep ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
              <div>{StepBody()}</div>
              {/* THE LAST STEP GETS THE CONTACT SHEET, the authoring steps get
                  the tabbed single preview. The difference is the job: while
                  you are writing the email you want that email large and the
                  others out of the way; at "ready to send?" you want to see
                  everything at once, because that is the question being
                  asked. See PreviewSheet. */}
              {sheetStep ? (
                <PreviewSheet
                  pages={previewPages}
                  renderPage={(id) => renderPageById(id)}
                  onOpen={setFullPage}
                />
              ) : (
                <PreviewPane
                  pages={pagerPages}
                  index={pagerIndex}
                  setIndex={setPreviewIndex}
                  device={device}
                  setDevice={setDevice}
                >
                  {renderPreviewBody()}
                </PreviewPane>
              )}
            </div>
          ) : (
            StepBody()
          )}
        </CardContent>
      </Card>

      {/* Cancel is a footer control now, one mis-click from the button people
          press a dozen times, so it asks first and says what happens to the
          work. The old inline strip lived above the card and could not be seen
          from a footer at the bottom of a scrolling step. */}
      <AlertDialog dataHook="leave-wizard" open={cancelConfirm} onOpenChange={setCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle dataHook="leave-title">Leave setup?</AlertDialogTitle>
            <AlertDialogDescription dataHook="leave-desc">
              Your progress is saved as a draft, so you can pick this campaign up from the Get
              Reviews page and carry on where you left off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button variant="primary" dataHook="cancel-yes" onClick={onCancel}>
              Save and leave
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ------------------------------ modals ------------------------------ */}

      <Dialog open={infoModal === "ask"} onOpenChange={(o) => !o && setInfoModal(null)}>
        <DialogContent dataHook="ask-info-content">
          <DialogHeader>
            <DialogTitle dataHook="ask-info-title">The two ways to ask</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <p className="font-medium">Internal feedback, then a public review</p>
              <p className="text-muted-foreground">
                The customer fills in a short feedback form that comes straight to you, and is then
                invited to leave a public review. Because unhappy feedback reaches you first, you can
                put things right with that customer.
              </p>
            </div>
            <div>
              <p className="font-medium">Go straight to a public review</p>
              <p className="text-muted-foreground">
                The customer goes directly to the review invitation, with no feedback step first.
              </p>
            </div>
            <p className="text-muted-foreground">
              Either way, every customer sees the review page. Feedback never decides who is asked
              for a review.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="primary" dataHook="ask-info-close">
                Got it
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={infoModal === "legal"} onOpenChange={(o) => !o && setInfoModal(null)}>
        <DialogContent dataHook="legal-info-content">
          <DialogHeader>
            <DialogTitle dataHook="legal-info-title">About the legal footer</DialogTitle>
            <DialogDescription dataHook="legal-info-desc">
              A legal footer is part of the terms and conditions. Laws such as CAN-SPAM in the US and
              the ePrivacy Directive and GDPR in the EU also require marketing email to say who sent
              it, give a real postal address, and offer a way to opt out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="primary" dataHook="legal-info-close">
                Got it
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS credits: packages, checkout, paid. Card fields are display only in
          this prototype and take no real input. */}
      <Dialog open={creditStage !== null} onOpenChange={(o) => !o && setCreditStage(null)}>
        <DialogContent dataHook="credits-content" className="sm:max-w-lg">
          {creditStage === "packages" ? (
            <>
              <DialogHeader>
                <DialogTitle dataHook="credits-title">SMS credit packages</DialogTitle>
                <DialogDescription dataHook="credits-desc">
                  Credits do not expire. You have {balance.toLocaleString()} left.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                {CREDIT_PACKAGES.map((p) => (
                  <div key={p.id} className="flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-base font-semibold">{p.credits.toLocaleString()} credits</span>
                    <span className="text-muted-foreground text-sm">{p.price}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      dataHook={`credits-buy-${p.id}`}
                      className="mt-1"
                      onClick={() => {
                        setCreditPackage(p);
                        setCreditStage("checkout");
                      }}
                    >
                      Buy now
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Rates vary by country. Texts to the USA and Canada use 1 credit each, texts to the UK
                use 2 credits each.
              </p>
            </>
          ) : null}
          {creditStage === "checkout" ? (
            <>
              <DialogHeader>
                <DialogTitle dataHook="checkout-title">Checkout</DialogTitle>
                <DialogDescription dataHook="checkout-desc">
                  {creditPackage?.credits.toLocaleString()} credits for {creditPackage?.price}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <LabelledField id="card-number" hook="card-number" label="Card number">
                  <Input id="card-number" dataHook="card-number-input" placeholder="1234 1234 1234 1234" />
                </LabelledField>
                <div className="grid grid-cols-2 gap-3">
                  <LabelledField id="card-expiry" hook="card-expiry" label="Expiry">
                    <Input id="card-expiry" dataHook="card-expiry-input" placeholder="MM / YY" />
                  </LabelledField>
                  <LabelledField id="card-cvc" hook="card-cvc" label="Security code">
                    <Input id="card-cvc" dataHook="card-cvc-input" placeholder="123" />
                  </LabelledField>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" dataHook="checkout-back" onClick={() => setCreditStage("packages")}>
                  Back to packages
                </Button>
                <Button
                  variant="primary"
                  dataHook="checkout-pay"
                  onClick={() => {
                    setCreditsBought((c) => c + (creditPackage?.credits ?? 0));
                    setCreditStage("paid");
                  }}
                >
                  Pay {creditPackage?.price}
                </Button>
              </DialogFooter>
            </>
          ) : null}
          {creditStage === "paid" ? (
            <>
              <DialogHeader>
                <DialogTitle dataHook="paid-title">Payment successful</DialogTitle>
                <DialogDescription dataHook="paid-desc">
                  {creditPackage?.credits.toLocaleString()} credits added. Your balance is now{" "}
                  {balance.toLocaleString()}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="primary" dataHook="paid-close" onClick={() => setCreditStage(null)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* FULL SIZE, from the contact sheet. A Dialog rather than a Drawer:
          a drawer is for something you work on beside the page, and this is
          a picture you open, look at and close. `interactive` stays false —
          the working, clickable customer page is "Preview as a customer",
          which is a different control with a different promise. */}
      <Dialog open={!!fullPage} onOpenChange={(o) => !o && setFullPage(null)}>
        <DialogContent dataHook="preview-full" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle dataHook="preview-full-title">
              {previewPages.find((p) => p.id === fullPage)?.label ?? "Preview"}
            </DialogTitle>
            <DialogDescription dataHook="preview-full-desc">
              How this looks to your customer.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-background overflow-hidden rounded-lg border">
            <div className="pointer-events-none select-none">
              {fullPage ? renderPageById(fullPage) : null}
            </div>
          </div>
          {/* THE BUTTON, NOT THE INSTRUCTION (Ali, 3 Sep: "come on, put a
              bloody preview button on there"). The copy used to say "use
              Preview as a customer to try the real thing", which is a
              signpost to a control on a different part of the page — and a
              signpost is what you write when you cannot put the control
              where the person is. It can go here, so it does. */}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" dataHook="preview-full-close">
                Close
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              dataHook="preview-full-interactive"
              onClick={() => {
                setFullPage(null);
                onOpenCustomerPreview(draft);
              }}
            >
              <Eye className="size-4" /> Try it as a customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog dataHook="send-confirm" open={sendConfirm} onOpenChange={setSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle dataHook="send-confirm-title">
              {draft.channel === "sms" ? "Text" : "Email"} {RECIPIENT_COUNT} people?
            </AlertDialogTitle>
            <AlertDialogDescription dataHook="send-confirm-desc">
              {draft.channel === "sms"
                ? `This uses ${smsCost.toLocaleString()} SMS credits and cannot be undone once sending starts.`
                : "Sending starts straight away and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onLaunch}>
              Send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WizardShell>
  );
}

/* ================================= success ================================ */

function SuccessView({ draft, onInsights, onHub, onKiosk }) {
  const standing = isStanding(draft.channel);
  const kiosk = draft.channel === "kiosk";
  const [copied, setCopied] = useState(false);
  return (
    <Card dataHook="wizard-success" className="max-w-none">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <CircleCheck className="text-primary size-10" />
        <p className="text-lg font-semibold">
          {kiosk ? "Your kiosk is live" : standing ? "Your campaign is live" : `Sending to ${RECIPIENT_COUNT} people`}
        </p>
        <p className="text-muted-foreground max-w-md text-sm">
          {kiosk
            ? "Open the kiosk page on the tablet. It goes full screen and comes back to the first question after every answer. Responses appear in campaign insights."
            : standing
              ? "Put the link on a receipt, in your email signature, or behind a QR code. Responses appear in campaign insights."
              : "Your messages go out shortly. Responses appear in campaign insights as people click through and review."}
        </p>
        {/* Both standing modes are a URL underneath — the kiosk's is the one
            you open on the tablet — so both get the copy control. */}
        {standing ? (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <code className="text-sm">{kiosk ? "wb.rvw/k/x8k2p1" : "wb.rvw/x8k2p1"}</code>
            <Button
              variant="ghost"
              size="sm"
              dataHook="copy-campaign-link"
              onClick={() => setCopied(true)}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {kiosk ? (
            <Button variant="primary" dataHook="success-open-kiosk" onClick={onKiosk}>
              <Monitor className="size-4" /> Open kiosk
            </Button>
          ) : null}
          <Button variant={kiosk ? "outline" : "primary"} dataHook="success-insights" onClick={onInsights}>
            View campaign insights
          </Button>
          <Button variant="outline" dataHook="success-hub" onClick={onHub}>
            Back to Get Reviews
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================ gauge =================================== */

// A 270° THREE-BLOCK GAUGE (Ali, 3 Sep: "gauge would be three blocks red
// amber green probably using up 270 degrees"). Not in the DS, and not in
// Storybook's chart set either (Area, Bar, Line, Pie, Radar, Radial — checked
// against storybook.brightlocal.com's index, 3 Sep), so this is a CANDIDATE
// component. It is built only from what the DS chart module already
// re-exports — PieChart, Pie, Cell — so it needs no new dependency and would
// slot into Storybook as a seventh chart story rather than a new package.
//
// The three blocks are one Pie swept from 225° to −45° (Recharts measures
// counter-clockwise from 3 o'clock, so that is 270° with the gap at the
// bottom). The pointer and the centre number are an overlay drawn off the
// same fixed geometry, deliberately NOT a Recharts <Label>: label internals
// changed between Recharts 2 and 3 and this should render the same on
// either. Bands carry the page's existing NPS hues (rose / amber / emerald,
// at the muted steps chosen on 3 Sep) so the gauge and the bars next to it
// agree about what red means. Pointer is currentColor so it follows theme.
const GAUGE = { size: 200, cx: 100, cy: 100, outer: 90, inner: 68 };

const BAND_COLOR = {
  low: "var(--ds-tailwind-colors-rose-400)",
  mid: "var(--ds-tailwind-colors-amber-400)",
  high: "var(--ds-tailwind-colors-emerald-600)",
};

// NPS runs −100 to 100. Below 0 more people are detractors than promoters;
// 50+ is the conventional "excellent" line. Three blocks, unequal on purpose.
const NPS_BANDS = [
  { id: "low", label: "Below 0", meaning: "needs work", to: 0 },
  { id: "mid", label: "0 to 50", meaning: "good", to: 50 },
  { id: "high", label: "50 and above", meaning: "great", to: 100 },
];

// Conversion is people who visited a review site as a share of people sent
// to. 0–40% scale: the best campaign in the sample sits at 20%, so a full
// 0–100 dial would park every needle in the first block.
const CONVERSION_BANDS = [
  { id: "low", label: "Under 10%", meaning: "low", to: 10 },
  { id: "mid", label: "10 to 20%", meaning: "typical", to: 20 },
  { id: "high", label: "Over 20%", meaning: "strong", to: 40 },
];

// Greys still, per the 3 Sep rule — the funnel counts people, the gauge
// beside it passes judgement. A ramp rather than one tone so four
// trapezoids stay tellable apart without the labels.
const FUNNEL_RAMP = [
  "var(--ds-tailwind-colors-neutral-300)",
  "var(--ds-tailwind-colors-neutral-400)",
  "var(--ds-tailwind-colors-neutral-500)",
  "var(--ds-tailwind-colors-neutral-600)",
];
const FUNNEL_CONFIG = { v: { label: "People", color: "var(--ds-tailwind-colors-neutral-400)" } };

function Gauge({ value, min, max, bands, display, caption, dataHook, legend = true }) {
  const { size, cx, cy, outer, inner } = GAUGE;
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = ((225 - 270 * t) * Math.PI) / 180;
  const at = (r) => [cx + r * Math.cos(angle), cy - r * Math.sin(angle)];
  const perp = angle + Math.PI / 2;
  const [tx, ty] = at(inner - 4);
  const [bx, by] = at(inner - 18);
  const pointer = [
    [tx, ty],
    [bx + 6 * Math.cos(perp), by - 6 * Math.sin(perp)],
    [bx - 6 * Math.cos(perp), by + 6 * Math.sin(perp)],
  ]
    .map((p) => p.map((n) => n.toFixed(1)).join(","))
    .join(" ");
  const data = bands.map((b, i) => ({
    id: b.id,
    name: b.label,
    value: b.to - (i ? bands[i - 1].to : min),
    fill: BAND_COLOR[b.id],
  }));
  const config = Object.fromEntries(bands.map((b) => [b.id, { label: b.label, color: BAND_COLOR[b.id] }]));
  return (
    // DIAL, THEN LEGEND TO THE RIGHT (Ali, 3 Sep: "the legend for the gauge
    // should sit to the right, just like the donut chart on review
    // insights"). Same anatomy as the sources donut: dial and key side by
    // side with a gap-8, swatch + label on the left of each row, the
    // qualifier on the right in muted text where the donut puts its count.
    // Two instruments in RM that read the same way, rather than one with
    // its key underneath and one beside.
    <div className="flex flex-wrap items-center gap-8" data-hook={`${dataHook}-wrap`}>
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ChartContainer config={config} dataHook={dataHook} width={size} height={size} className="aspect-auto">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            startAngle={225}
            endAngle={-45}
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.id} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <svg className="pointer-events-none absolute inset-0" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <polygon points={pointer} fill="currentColor" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums">{display}</span>
      </div>
      {caption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <span className="text-muted-foreground text-sm">{caption}</span>
        </div>
      ) : null}
    </div>
      {/* A LEGEND FOR EACH BLOCK (Ali, 3 Sep: "we would need legends for
          each area"). Hand-drawn rather than Recharts' Legend: a Legend
          inside the chart reserves its own height from the plot area, which
          moves the pie centre and breaks the overlay geometry above. Range
          on the left, meaning on the right, so the number on the dial can be
          read against the range and the word says what that range is worth. */}
      {legend ? (
        <ul className="flex min-w-[180px] flex-col gap-2" data-hook={`${dataHook}-legend`}>
          {bands.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ background: BAND_COLOR[b.id] }}
                  aria-hidden="true"
                />
                <span className="text-sm">{b.label}</span>
              </span>
              {b.meaning ? (
                <span className="text-muted-foreground text-sm">{b.meaning}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ================================ insights ================================ */

function FeedbackScore({ type, score }) {
  if (type === "nps") {
    const tone = score <= 6 ? "destructive" : score <= 8 ? "outline" : "primary";
    return (
      <Badge dataHook={`feedback-score-${score}`} variant={tone} data-number="true">
        {score}
      </Badge>
    );
  }
  if (type === "thumbs") {
    return score >= 7 ? (
      <ThumbsUp className="text-primary size-4 shrink-0" />
    ) : (
      <ThumbsDown className="text-muted-foreground size-4 shrink-0" />
    );
  }
  return <Rating value={Math.max(1, Math.round(score / 2))} dataHook={`feedback-stars-${score}`} />;
}

function CampaignInsights({ campaign, onAllFeedback }) {
  const config = campaign.config;
  const standing = isStanding(config.channel);
  const stats = campaign.stats ?? {};
  const fresh = !campaign.stats || campaign.stats.delivered === 0;
  // Days for a campaign that ends, months for one that does not. See GRAINS.
  const [grain, setGrain] = useState(config.channel === "link" ? "month" : "day");

  // AN INFO TOOLTIP ON THE ONES THAT NEED IT (Ali, 3 Sep: "an info with a
  // tooltip is probably also useful on here"). StatCard already has an
  // `info` prop — it renders the ghost (i) button top right and hangs the
  // text off it — and these tiles were not using it, so the two metrics
  // nobody can define from their label alone had no definition anywhere.
  //
  // Only where there is something to say. "Sent" needs no gloss, and an (i)
  // on every tile turns a real signal into wallpaper: the icon stops meaning
  // "this one is worth a look" the moment it is on all five.
  const tiles = standing
    ? [
        // A kiosk counts SESSIONS — one person at the tablet — where a link
        // counts visits; same number, different noun, and the noun is the
        // whole difference between the two modes.
        { label: config.channel === "kiosk" ? "Sessions" : "Visits", value: (stats.visits ?? 0).toLocaleString() },
        { label: "Reviews gained", value: String(stats.reviews ?? 0), tone: "success",
          info: "New reviews this campaign brought in, matched on timing." },
        { label: "Rating impact", value: stats.impact ?? "0.0", tone: "success",
          info: "Rating change from this campaign's reviews only." },
      ]
    : [
        { label: "Sent", value: (stats.sent ?? 0).toLocaleString() },
        { label: "Delivered", value: (stats.delivered ?? 0).toLocaleString(),
          info: "Accepted by the provider. The gap is bounces and dead numbers." },
        { label: "Clicked", value: (stats.clicked ?? 0).toLocaleString() },
        { label: "Reviews gained", value: String(stats.reviews ?? 0), tone: "success",
          info: "New reviews this campaign brought in, matched on timing." },
        { label: "Rating impact", value: stats.impact ?? "0.0", tone: "success",
          info: "Rating change from this campaign's reviews only." },
      ];

  const funnel = [
    { k: "Sent", v: stats.sent ?? 0 },
    { k: "Opened", v: stats.opened ?? 0 },
    { k: "Left a rating", v: stats.rated ?? 0 },
    { k: "Visited a review site", v: stats.visited ?? 0 },
  ];
  // The funnel's one outcome number, for the gauge: last step over first.
  const conversion = stats.sent ? Math.round(((stats.visited ?? 0) / stats.sent) * 100) : 0;

  // GRAIN, NOT JUST A WINDOW (Ali, 2 Sep: "we might need a way to show per
  // month, per year etc"). A standing link campaign runs for years, and a
  // fourteen-day strip is a keyhole view of it: the question "is this
  // working?" is answered at month or quarter scale, not day scale. A
  // fixed-length email campaign is the opposite — it is over in a fortnight
  // and daily is the only grain with anything in it.
  //
  // So the control's OPTIONS depend on the campaign, and the default does
  // too. A one-shot email campaign offers days only and says so; a standing
  // campaign opens on months, which is where its shape actually is. Offering
  // "by year" on a campaign that has run for four months would be a menu
  // item that can only ever draw one bar.
  const GRAINS = standing
    ? [
        { id: "day", label: "Last 14 days" },
        { id: "month", label: "By month" },
        { id: "quarter", label: "By quarter" },
      ]
    : [{ id: "day", label: "Day by day" }];

  const SERIES = {
    day: standing
      ? [3, 4, 2, 5, 4, 6, 3, 5, 4, 6, 5, 7, 4, 6].map((reviews, i) => ({
          label: `${1 + i} Aug`,
          reviews,
        }))
      : [2, 6, 5, 4, 7, 4, 3, 2, 2, 1, 1, 0, 1, 0].map((reviews, i) => ({
          label: `${12 + i} Jul`,
          reviews,
        })),
    month: [
      { label: "May", reviews: 38 },
      { label: "Jun", reviews: 52 },
      { label: "Jul", reviews: 61 },
      { label: "Aug", reviews: 64 },
    ],
    quarter: [
      { label: "Q2 2026", reviews: 90 },
      { label: "Q3 2026", reviews: 125 },
    ],
  };
  const series = SERIES[grain] ?? SERIES.day;

  const grainSub = {
    day: standing
      ? `Live since ${formatDate("2026-05-03")}, showing the last 14 days.`
      : `Sent ${formatDate("2026-07-12")}${config.reminder ? `, reminder ${formatDate("2026-07-14")} to people who had not responded` : ""}.`,
    month: `Live since ${formatDate("2026-05-03")}, by calendar month.`,
    quarter: `Live since ${formatDate("2026-05-03")}, by calendar quarter.`,
  };
  const chartConfig = { reviews: { label: "Reviews", color: "var(--chart-1, var(--chart-1-light))" } };

  const responded = FEEDBACK_ITEMS.length;
  const promoters = FEEDBACK_ITEMS.filter((f) => f.score >= 9).length;
  const passives = FEEDBACK_ITEMS.filter((f) => f.score >= 7 && f.score <= 8).length;
  const detractors = FEEDBACK_ITEMS.filter((f) => f.score <= 6).length;
  const nps = Math.round((promoters / responded) * 100 - (detractors / responded) * 100);

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: FEEDBACK_ITEMS.filter((f) => Math.max(1, Math.round(f.score / 2)) === stars).length,
  }));
  const distributionPeak = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="flex flex-col gap-4">
      {/* ONE BANNER, FROM THE STATE TABLE. It used to be a Stopped-only
          block; now every state that needs to explain itself does, and the
          two that do not (Draft, Live) render nothing rather than an empty
          reassurance. See STATES. */}
      {stateOf(campaign.status).alert ? (
        stateOf(campaign.status).alert.tone === "warning" ? (
          <AlertWarning
            dataHook="state-banner"
            description={`${stateOf(campaign.status).alert.text} ${campaign.lastActivity.label} ${formatDate(campaign.lastActivity.date)}.`}
          />
        ) : (
          <AlertInfo dataHook="state-banner" description={stateOf(campaign.status).alert.text} />
        )
      ) : null}

      {/* THE STAT ROW LIVES INSIDE A CARD (Ali, 2 Sep: "I think these would
          actually be inside another card, and be smaller cards with a
          coloured background - no capitalisation of the labels").
          There IS a DS pattern for exactly this and the tiles were not using
          it: `StatCard level="nested"` steps the tile down to the neutral
          tier with a border, "for a stat row at the top of a bigger module
          card" — its own words. Five white tiles floating on the page
          background were five cards competing with the cards below them for
          the same level of attention, when they are a summary OF what is
          below. Nested, in one card, they read as the module's headline.
          The uppercase labels and the 30px numbers were fixed in StatCard
          itself, not here: it is used on five other pages. */}
      {/* THE CARD NEEDS TO SAY WHAT THE NUMBERS ARE (Ali, 2 Sep: "the main
          card that these are in needs a title???"). It did not have one,
          which left five numbers floating in an unlabelled box — the reader
          has to infer from the tiles what the container is, which is the
          wrong way round. Every other card on this page names itself.
          The description dates the numbers rather than repeating the title:
          "results" is only meaningful with a period attached, and a standing
          link campaign and a one-shot email campaign date theirs
          differently. */}
      <Card dataHook="insights-summary-card" className="max-w-none">
        <CardHeader>
          <CardTitle size="small" dataHook="insights-summary-title">
            Results
          </CardTitle>
{/* No subtitle (Ali, 3 Sep: "we don't need this"). The date was
              already in the page header's own status slot two rows above,
              so the card was repeating it under a heading that does not
              need qualifying: Results are the results. */}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {tiles.map((t) => (
              <StatCard
                key={t.label}
                level="nested"
                label={t.label}
                value={t.value}
                info={t.info}
                tone={fresh ? "neutral" : t.tone}
                dataHook={`insights-${t.label.toLowerCase().replaceAll(" ", "-")}`}
              />
            ))}
          </div>

          {/* THE FUNNEL JOINS THE RESULTS CARD (Ali, 3 Sep: "'What happened
              after you sent it' is a truly awful title. In reality it's just
              more metrics — you could arguably just put that in the card
              above called Results").
              It is the same card's worth of information: the tiles are the
              totals, the bars are the same journey with its drop-off shown.
              Two cards meant inventing a name for the second one, and the
              name that got invented was a sentence.
              "Funnel" as the sub-heading (Ali, 3 Sep: "you could even call
              it funnel if that is what it is"). I had left it unlabelled on
              the grounds that the rows label themselves, which was right
              about the rows and wrong about the group: four bars under a
              rule need a word saying what the SET is, and funnel is the word
              — it is a real term for exactly this shape, not a euphemism
              for one. */}
          {!standing && !fresh ? (
            <>
              <Separator dataHook="insights-results-rule" className="my-5" />
              {/* GAUGE WHERE THE FUNNEL IS (Ali, 3 Sep). The funnel rows stay —
                  they are the journey — and the gauge sits to their left as
                  the journey's one outcome: how many of the people sent to
                  ended up on a review site. The bands are a judgement
                  (under 10% / 10–20% / over 20%), which is exactly what the
                  neutral funnel bars were told NOT to make; the gauge is
                  where that judgement now lives, so the bars can stay grey. */}
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex flex-col">
                  <p className="mb-3 text-sm font-medium" data-hook="insights-conversion-title">
                    Conversion
                  </p>
                  <Gauge
                    value={conversion}
                    min={0}
                    max={40}
                    bands={CONVERSION_BANDS}
                    display={`${conversion}%`}
                    caption="sent to review site"
                    dataHook="insights-conversion-gauge"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-3 text-sm font-medium" data-hook="insights-funnel-title">
                    Funnel
                  </p>
                  {/* A REAL FUNNEL (Ali, 3 Sep: "next up need a funnel
                      chart"), replacing the four Progress bars. Same data,
                      same greys — see FUNNEL_RAMP — the shape now does what
                      the word says. The last shape is a rectangle: a point
                      at the bottom would draw "visited a review site" as if
                      it tapered to nobody. Labels sit to the right of each
                      step, name and count together, in the margin reserved
                      for them. Fixed-height wrapper per the DS chart rule,
                      capped at max-w-md so four steps do not stretch into
                      four flat ribbons on a wide card. */}
                  <div className="h-56 w-full max-w-md">
                    <ChartContainer
                      config={FUNNEL_CONFIG}
                      dataHook="insights-funnel-chart"
                      width="100%"
                      height="100%"
                      className="aspect-auto h-full w-full"
                    >
                      <FunnelChart margin={{ top: 4, right: 176, bottom: 4, left: 4 }}>
                        <FunnelTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Funnel
                          dataKey="v"
                          nameKey="k"
                          data={funnel}
                          isAnimationActive={false}
                          lastShapeType="rectangle"
                          stroke="var(--background)"
                          strokeWidth={2}
                        >
                          {funnel.map((f, i) => (
                            <FunnelCell key={f.k} fill={FUNNEL_RAMP[i] ?? FUNNEL_RAMP[FUNNEL_RAMP.length - 1]} />
                          ))}
                          <FunnelLabelList
                            position="right"
                            offset={12}
                            fill="currentColor"
                            stroke="none"
                            fontSize={12}
                            valueAccessor={(entry) =>
                              `${entry?.payload?.k ?? entry?.name ?? ""} · ${(entry?.payload?.v ?? entry?.val ?? 0).toLocaleString()}`
                            }
                          />
                        </Funnel>
                      </FunnelChart>
                    </ChartContainer>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {fresh ? (
        <Card dataHook="insights-empty" className="max-w-none">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              No activity yet. Numbers appear here as people click through and respond.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>

          <Card dataHook="insights-timeline" className="max-w-none">
            <CardHeader>
              <CardTitle size="small" dataHook="insights-timeline-title">
                Reviews over time
              </CardTitle>
              <CardDescription dataHook="insights-timeline-sub">
                {grainSub[grain] ?? grainSub.day}
              </CardDescription>
              {/* The control goes in CardAction, the DS's own slot for a
                  control that acts on the card — same place Review Insights
                  puts its period filter, so the two pages agree about where
                  a chart's period lives. Hidden when there is only one
                  grain: a select with one option is furniture. */}
              {GRAINS.length > 1 ? (
                <CardAction>
                  <Select value={grain} onValueChange={setGrain}>
                    <SelectTrigger dataHook="timeline-grain" className="w-40">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRAINS.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              {/* Fixed-height wrapper per the DS chart rule; aspect-auto
                  displaces ChartContainer's baked aspect-video. */}
              <div className="h-56 w-full">
                <ChartContainer
                  config={chartConfig}
                  dataHook="insights-reviews-chart"
                  width="100%"
                  height="100%"
                  className="aspect-auto h-full w-full"
                >
                  <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis width={32} allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="reviews"
                      stroke="var(--chart-1, var(--chart-1-light))"
                      fill="var(--chart-1, var(--chart-1-light))"
                      fillOpacity={0.15}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {config.ask === "feedback" ? (
            <>
              <Card dataHook="insights-feedback-summary" className="max-w-none">
                <CardHeader>
                  <CardTitle size="small" dataHook="insights-feedback-title">
                    Internal feedback
                  </CardTitle>
                  <CardDescription dataHook="insights-feedback-sub">
                    Only visible to you. These are not public reviews.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {config.feedbackType === "nps" ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {/* GAUGE WHERE THE NPS SCORE WAS (Ali, 3 Sep). The number
                          moves into the dial's centre; the three band bars to
                          the right are the same three blocks unrolled, so the
                          two read as one instrument. Response count goes in
                          the dial's bottom gap where the caption slot is. */}
                      <Gauge
                        value={nps}
                        min={-100}
                        max={100}
                        bands={NPS_BANDS}
                        display={nps}
                        caption={`NPS, ${responded} responses`}
                        dataHook="insights-nps-gauge"
                      />
                      <div className="flex flex-1 flex-col gap-2">
                        {/* THE DS COLOUR ENUM IS BROKEN, so these are painted
                            explicitly. Progress advertises green / red /
                            orange / yellow in its contract, and MEASURED on
                            the live render only green paints: yellow and red
                            come back rgba(0,0,0,0) for BOTH the track and the
                            indicator, so two of these three bars were
                            invisible — the row rendered, the numbers rendered,
                            and the bar was simply not there (Ali, 3 Sep:
                            "seems to be a lack of other bar charts here").
                            Logged as a DS finding.
                            Colours are MUTED (Ali, same message: "is there a
                            slightly more neutral chart colour? big bright
                            fighting for attention"). The band still carries
                            meaning — promoter, passive, detractor is a real
                            scale — so the hues stay, at a step that reads as
                            data rather than as an alert. */}
                        {[
                          { k: "Promoters (9 to 10)", n: promoters, bar: "--ds-tailwind-colors-emerald-600" },
                          { k: "Passives (7 to 8)", n: passives, bar: "--ds-tailwind-colors-amber-400" },
                          { k: "Detractors (0 to 6)", n: detractors, bar: "--ds-tailwind-colors-rose-400" },
                        ].map((row) => (
                          <div key={row.k} className="flex items-center gap-3">
                            <span className="w-40 shrink-0 text-sm">{row.k}</span>
                            <Progress
                              dataHook={`nps-${row.k.slice(0, 3).toLowerCase()}`}
                              value={row.n}
                              max={responded}
                              indicatorClassName={`bg-[var(${row.bar})]`}
                              ariaLabel={`${row.n} ${row.k}`}
                              className="h-2 flex-1 bg-[var(--ds-tailwind-colors-neutral-200)]"
                            />
                            <span className="w-20 shrink-0 text-right text-sm tabular-nums">
                              {row.n} ({Math.round((row.n / responded) * 100)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : config.feedbackType === "thumbs" ? (
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-3xl font-semibold tabular-nums">
                          {Math.round((FEEDBACK_ITEMS.filter((f) => f.score >= 7).length / responded) * 100)}%
                        </span>
                        <span className="text-muted-foreground text-sm">
                          positive, {responded} responses
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        {[
                          { k: "Thumbs up", n: FEEDBACK_ITEMS.filter((f) => f.score >= 7).length, color: "green" },
                          { k: "Thumbs down", n: FEEDBACK_ITEMS.filter((f) => f.score < 7).length, color: "red" },
                        ].map((row) => (
                          <div key={row.k} className="flex items-center gap-3">
                            <span className="w-32 shrink-0 text-sm">{row.k}</span>
                            <Progress
                              dataHook={`thumbs-${row.k.includes("up") ? "up" : "down"}`}
                              value={row.n}
                              max={responded}
                              color={row.color}
                              ariaLabel={`${row.n} ${row.k}`}
                              className="h-2 flex-1"
                            />
                            <span className="w-10 shrink-0 text-right text-sm tabular-nums">{row.n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {distribution.map((d) => (
                        <div key={d.stars} className="flex items-center gap-3">
                          <span className="w-24 shrink-0">
                            <Rating value={d.stars} size="sm" dataHook={`dist-${d.stars}`} />
                          </span>
                          <Progress
                            dataHook={`dist-bar-${d.stars}`}
                            value={d.count}
                            max={distributionPeak}
                            color="green"
                            ariaLabel={`${d.count} responses at ${d.stars} stars`}
                            className="h-2 flex-1"
                          />
                          <span className="w-10 shrink-0 text-right text-sm tabular-nums">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card dataHook="insights-recent-feedback" className="max-w-none">
                <CardHeader>
                  <CardTitle size="small" dataHook="insights-recent-title">
                    Recent feedback
                  </CardTitle>
                  <CardAction>
                    <Button variant="outline" size="sm" dataHook="view-all-feedback" onClick={onAllFeedback}>
                      View all {FEEDBACK_ITEMS.length}
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-border divide-y border-t">
                    {FEEDBACK_ITEMS.slice(0, 6).map((f) => (
                      <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="w-24 shrink-0">
                          <FeedbackScore type={config.feedbackType} score={f.score} />
                        </span>
                        <span className="w-28 shrink-0 truncate font-medium">{f.name}</span>
                        <span className="text-muted-foreground min-w-0 flex-1 truncate">{f.text}</span>
                        <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">
                          {formatDate(f.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <AlertInfo
              dataHook="no-internal-feedback"
              description="This campaign sends customers straight to public review sites, so there is no internal feedback to show."
            />
          )}

          <Card dataHook="insights-reviews-gained" className="max-w-none">
            <CardHeader>
              <CardTitle size="small" dataHook="insights-gained-title">
                Reviews gained
              </CardTitle>
              <CardDescription dataHook="insights-gained-sub">
                {stats.reviews} new public reviews came from this campaign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* The last site takes the remainder, so the split always sums
                  to the headline figure instead of rounding past it. */}
              <div className="flex flex-wrap gap-4">
                {(() => {
                  const total = stats.reviews ?? 0;
                  const shares = [0.55, 0.25, 0.2].slice(0, config.sites.length);
                  const counts = shares.map((f) => Math.round(total * f));
                  counts[counts.length - 1] =
                    total - counts.slice(0, -1).reduce((a, b) => a + b, 0);
                  return config.sites.map((site, i) => (
                    <div key={site.site} className="flex items-center gap-2">
                      <SiteMark id={site.site} />
                      <span className="text-sm">{siteById(site.site).label}</span>
                      <span className="text-sm font-semibold tabular-nums">{counts[i] ?? 0}</span>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/* ============================= all feedback =============================== */

function AllFeedback({ campaign }) {
  const type = campaign.config.feedbackType;
  const [ratingFilter, setRatingFilter] = useState("all");
  const [visitedFilter, setVisitedFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  const bandOf = (score) => (score <= 6 ? "low" : score <= 8 ? "mid" : "high");
  const rows = FEEDBACK_ITEMS.filter(
    (f) =>
      (ratingFilter === "all" || bandOf(f.score) === ratingFilter) &&
      (visitedFilter === "all" || (visitedFilter === "yes") === !!f.visited),
  );

  const RATING_OPTIONS =
    type === "nps"
      ? [
          { id: "all", label: "All ratings" },
          { id: "high", label: "Promoters (9 to 10)" },
          { id: "mid", label: "Passives (7 to 8)" },
          { id: "low", label: "Detractors (0 to 6)" },
        ]
      : [
          { id: "all", label: "All ratings" },
          { id: "high", label: "Happy" },
          { id: "mid", label: "Neutral" },
          { id: "low", label: "Unhappy" },
        ];

  return (
    <div className="flex flex-col gap-4">
      {/* PLAIN, NOT CRYPTIC (Ali, 3 Sep: "seems like a cryptic message to
          me, bad English or not really legible"). It was: "came to you
          privately through the campaign" describes a MECHANISM, in the
          passive, and "it is not published anywhere" is a negative that
          leaves the reader working out what the positive was.
          The fact that matters is who can see it and where it is not — so
          it says that, in that order, and names the sites people are
          actually worried about rather than saying "anywhere". */}
      <AlertInfo
        dataHook="feedback-private-note"
        description="Only you can see this. Customers wrote it on your own feedback page, so none of it appears on Google, Facebook or any other review site."
      />

      {/* py-0 ON THE CARD (Ali, 2 Sep: "this table has a gap at the top").
          CardContent was already p-0, but Card's own density="condensed"
          padding is py-3, so the filter band sat 12px below the card's top
          edge with a strip of card background above it — which reads as a
          rendering mistake, because a band that is flush on three sides and
          not the fourth has no way of reading as deliberate.
          overflow-hidden keeps the band's square corners inside the card's
          rounded ones. */}
      <Card
        dataHook="all-feedback-card"
        className="max-w-none overflow-hidden py-0"
        density="condensed"
      >
        <CardContent className="flex flex-col gap-0 p-0">
          <div className="bg-muted/40 flex flex-wrap items-center gap-2 border-b px-4 py-2">
            <div className="w-48">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger dataHook="feedback-rating-filter">
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  {RATING_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <Select value={visitedFilter} onValueChange={setVisitedFilter}>
                <SelectTrigger dataHook="feedback-visited-filter">
                  <SelectValue placeholder="All feedback" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All feedback</SelectItem>
                  <SelectItem value="yes">Visited a review site</SelectItem>
                  <SelectItem value="no">Did not visit a review site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="grow" />
            {/* NO CTA IN THE FILTER BAND (Ali, 2 Sep: "we would not also have
                a CTA in the table header"). A "Download testimonials" button
                lived here, and it was wrong twice over: a filter band is for
                narrowing what you are looking at, not for acting on the whole
                dataset, and the page header's own Download already offers
                testimonials alongside CSV and PDF. One control, in the place
                that acts on the campaign. The count stays — it describes the
                filters, which is exactly what belongs in this band. */}
            <span className="text-muted-foreground text-sm">
              Showing {rows.length} of {FEEDBACK_ITEMS.length}
            </span>
          </div>

          <div className="divide-border divide-y">
            {rows.map((f) => (
              <div key={f.id}>
                <button
                  type="button"
                  data-hook={`feedback-row-${f.id}`}
                  onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  className="hover:bg-muted/40 flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                >
                  <span className="w-24 shrink-0">
                    <FeedbackScore type={type} score={f.score} />
                  </span>
                  {/* Plain text, not a link: the ROW is the button, and an
                      anchor inside a button is invalid markup. The real
                      mailto link lives in the expanded panel below. */}
                  <span className="w-52 shrink-0 truncate">
                    {f.email ? f.email : <span className="text-muted-foreground">Anonymous</span>}
                  </span>
                  <span className="text-muted-foreground min-w-0 flex-1 truncate">{f.text}</span>
                  {f.consent ? (
                    <Badge dataHook={`feedback-consent-${f.id}`} variant="secondary">
                      Testimonial
                    </Badge>
                  ) : null}
                  <span className="text-muted-foreground hidden w-24 shrink-0 text-right text-xs sm:block">
                    {formatDate(f.date)}
                  </span>
                </button>
                {openId === f.id ? (
                  <div className="bg-muted/30 flex flex-col gap-2 border-t px-4 py-3 text-sm">
                    <p>{f.text}</p>
                    {f.email ? (
                      <div>
                        <Button variant="outline" size="sm" dataHook={`feedback-reply-${f.id}`} asChild>
                          <a href={`mailto:${f.email}`}>Reply to {f.name}</a>
                        </Button>
                      </div>
                    ) : null}
                    <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                      <span>{f.name}</span>
                      <span>
                        {f.visited ? "Visited a review site" : "Did not visit a review site"}
                      </span>
                      <span>
                        {f.consent
                          ? "Happy to be used as a testimonial"
                          : "Not for use as a testimonial"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================ customer drawer ============================= */

// The customer pages live in a right drawer rather than a full-screen
// takeover: they are a preview OF the campaign being edited, so the editor
// should still be there when the preview closes.
function CustomerPreviewDrawer({ open, onOpenChange, config, expired }) {
  const [page, setPage] = useState(null);
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);

  const first = expired ? "expired" : config?.ask === "feedback" ? "feedback" : "review";
  const current = page ?? first;
  // KIOSK VIEW: same pages, different promise. The tablet page resets to
  // the first question after every answer, which is the one thing this
  // preview has to say that the customer view does not.
  const kiosk = config?.channel === "kiosk";

  const label = {
    feedback: "Feedback page",
    thanks: "Review invitation",
    review: "Review page",
    expired: "Expired link",
  }[current];

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setPage(null);
          setRating(null);
          setComment("");
          setConsent(false);
        }
      }}
      direction="right"
    >
      <DrawerContent dataHook="customer-preview-drawer" className="w-full sm:max-w-md">
        <DrawerHeader className="flex-row items-center justify-between border-b">
          <div className="flex flex-col">
            <DrawerTitle>{kiosk ? "Kiosk view" : "Customer view"}</DrawerTitle>
            <span className="text-muted-foreground text-sm">{label}</span>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" iconOnly dataHook="close-customer-preview" aria-label="Close preview">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <DrawerBody className="p-4">
          {config ? (
            <div className="bg-muted/30 rounded-lg border">
              <CustomerPage
                page={current}
                config={config}
                interactive
                rating={rating}
                setRating={setRating}
                comment={comment}
                setComment={setComment}
                consent={consent}
                setConsent={setConsent}
                onSubmit={() => setPage("thanks")}
              />
            </div>
          ) : null}
        </DrawerBody>
        <DrawerFooter className="flex-row items-center gap-2 border-t p-4">
          <span className="text-muted-foreground text-xs">
            {kiosk
              ? "What your customer sees on the tablet. It comes back to the first question after every answer."
              : "This is exactly what your customer sees."}
          </span>
          <span className="grow" />
          {current !== first ? (
            <Button variant="outline" size="sm" dataHook="restart-customer-preview" onClick={() => setPage(null)}>
              Start again
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* =================================== app ================================== */

export default function RMGetReviewsHubSpokePage() {
  const [campaigns, setCampaigns] = useState(seedCampaigns);
  const [templates, setTemplates] = useState(seedTemplates);
  const [view, setView] = useState("hub");
  const [draft, setDraft] = useState(blankCampaignDraft);
  const [step, setStep] = useState("start");
  const [history, setHistory] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [stopTarget, setStopTarget] = useState(null);
  const [restartTarget, setRestartTarget] = useState(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState(null);
  // Which face of the campaign you are on is a TAB, not a view: All feedback
  // was only ever a drill-down from Summary, so the nesting had nothing left
  // to express.
  const [campaignTab, setCampaignTab] = useState("summary");

  const active = campaigns.find((c) => c.id === activeId) ?? null;
  // Built up here rather than inline: the tidy-up is two method calls, and a
  // call inside a JSX attribute is what the sandbox id-injector chokes on.
  // A DateStamp, not a string (Ali, 3 Sep: "look at the date format top
  // right of page — no underline, no tooltip"). This was the last date in RM
  // still being formatted inline: the cards, Report Settings and the page
  // header's own Last updated all went through DateStamp, and this one did
  // not, so the campaign page was the one place a date had no exact time
  // behind it.
  const activeDates = active ? (
    <DateStamp
      label={active.dates.label}
      value={active.dates.date}
      dataHook="campaign-page-date"
    />
  ) : null;
  // THE CHANNEL DESCRIBES THE CAMPAIGN, THE DATE DATES IT, and they are
  // two different kinds of fact, so they stopped sharing a line (Ali,
  // 2 Sep). The channel stays as the description on the left; the date
  // moves to PageHeader's right-hand status slot, in the same place and
  // the same 12px muted treatment as "Last updated" on Review Insights,
  // so a date sits in one place across the whole tool.
  const activeChannelLine = active ? CHANNELS[active.config.channel]?.label ?? "" : "";
  const activeDateLine = activeDates;
  // A campaign is a FULL PAGE, not an overlay (Ali, 28 Aug: "the screens you
  // have put in drawers should really be full screens"). It was a drawer
  // because a body view had to invent its own way home, and the in-body back
  // link that produced was rejected. The route home now runs through the
  // breadcrumb, which was already claiming to be it — see the trail below.
  const onCampaign = view === "campaign" && active !== null;

  // Three ways in: nothing (the start step asks), a campaign to re-use
  // (name gets "(copy)" so two campaigns never share one), or a template
  // (name is the template's — the name step is where it gets its own).
  function startWizard(source, { fromTemplate = false } = {}) {
    setDraft(
      source
        ? {
            ...source.config,
            id: null,
            name: fromTemplate ? source.name : `${source.name} (copy)`,
            permission: false,
            privacy: false,
          }
        : blankCampaignDraft(),
    );
    setStep(source ? "name" : "start");
    setHistory(source ? ["start"] : []);
    // Re-use is reachable from inside the campaign overlay, so the overlay
    // has to be dismissed or it would sit on top of the wizard.
    setActiveId(null);
    setView("wizard");
  }

  function openCampaign(c) {
    if (c.status === "Draft") {
      setDraft({ ...c.config, id: c.id });
      setStep(c.resumeAt ?? "name");
      setHistory(["start", "name"]);
      setView("wizard");
      return;
    }
    setCampaignTab("summary");
    setActiveId(c.id);
    setView("campaign");
  }

  function launch() {
    const standing = isStanding(draft.channel);
    const id = `c${Date.now()}`;
    const created = {
      id,
      name: draft.name || "New campaign",
      status: "Live",
      dates: standing ? { label: "Live since", date: "2026-08-19" } : { label: "Sent", date: "2026-08-19" },
      lastActivity: { label: "Created", date: "2026-09-02T09:05" },
      config: { ...draft, id },
      stats: standing
        ? { visits: 0, reviews: 0, impact: "0.0" }
        : { sent: RECIPIENT_COUNT, delivered: 0, clicked: 0, reviews: 0, impact: "0.0", opened: 0, rated: 0, visited: 0 },
    };
    setCampaigns((cs) => [created, ...cs.filter((c) => c.id !== draft.id)]);
    setActiveId(id);
    setView("success");
  }

  function saveDraftAndLeave() {
    const id = draft.id ?? `c${Date.now()}`;
    const record = {
      id,
      name: draft.name || "Campaign, 19 Aug 2026",
      status: "Draft",
      dates: { label: "Created", date: "2026-08-19" },
      lastActivity: { label: "Edited", date: "2026-09-02T09:05" },
      resumeAt: step,
      config: { ...draft, id },
    };
    setCampaigns((cs) =>
      cs.some((c) => c.id === id) ? cs.map((c) => (c.id === id ? record : c)) : [...cs, record],
    );
    // Back to the campaigns spoke, where the draft now sits, not the hub.
    setView("campaigns");
  }

  // Clearing activeId as well as the view: a stale campaign left in state is
  // what would make the next Preview or Download act on the wrong record.
  function backToHub() {
    setActiveId(null);
    setView("hub");
  }
  function toCampaigns() {
    setActiveId(null);
    setView("campaigns");
  }

  const headerByView = {
    hub: {
      title: "Get Reviews",
      description: "Invite your visitors to leave a review by email, text, kiosk or web link.",
    },
    // THE SPOKES GET THEIR OWN HEADERS. Each is a page, so it names itself
    // and the breadcrumb carries "Get Reviews" as its parent — the way home
    // runs through the trail, exactly as the campaign page's does.
    campaigns: {
      title: "Campaigns",
      description: "Every ask you have sent or set up, and what it brought in.",
    },
    templates: {
      title: "Templates",
      description: "Ready-made campaigns from BrightLocal, plus any you have saved from your own.",
    },
    campaign: {
      title: active?.name ?? "Campaign",
      // The badge travels with the channel here too (Ali, 3 Sep: "surely
      // the description on the next page should also have the status badge
      // alongside it"). A card that shows Live and a page that does not is
      // the same campaign described two ways.
      description: active ? (
        <span className="flex items-center gap-2">
          {activeChannelLine}
          <StatusPill status={active.status} hook="campaign-page-status" />
        </span>
      ) : (
        activeChannelLine
      ),
      statusRight: activeDateLine,
    },
    wizard: {
      title: draft.name || "New campaign",
      description: "Set up a campaign to ask your customers for reviews.",
    },
    success: { title: draft.name || "New campaign", description: "Your campaign is set up." },
  }[view] ?? {
    title: "Get Reviews",
    description: "Invite your visitors to leave a review by email, text or web link.",
  };

  // Back in the header now the campaign is a page again. Re-use / Stop /
  // Restart / Preview / Download act on the whole campaign, so they belong
  // beside its title, not buried at the bottom of a scrolling panel.
  // TWO BUTTONS AND A MENU (Ali, 3 Sep: "we are getting fairly busy — at
  // most we have 2 CTAs and put the others in an overflow").
  //
  // It was four equal outline buttons, which is a row that has stopped
  // ranking anything: Re-use, Stop, Preview and Download all looked like the
  // thing to do next. Preview and Download stay out, because they are what
  // you came to a results page FOR — see what the customer saw, take the
  // numbers away. Re-use and Stop go in the menu: Re-use starts a whole new
  // campaign, and Stop is destructive, and neither is a thing you do on most
  // visits.
  //
  // MOBILE, since Ali asked: below sm the two buttons keep their labels
  // rather than collapsing to icons — "Preview" and "Download" are shorter
  // than the icons are explanatory — and the menu holds everything else, so
  // the header is two buttons plus a 32px trigger at any width. That is the
  // real argument for the overflow: four buttons had nowhere to go on a
  // phone but wrap onto a second row.
  // PLAIN BUTTONS, NO OVERFLOW — reverted 3 Sep after three attempts at a
  // DropdownMenu here blanked the whole page with "Primitive.button failed
  // to slot onto its children". The same error killed Review Insights'
  // Download earlier tonight. Something about this DS's Button inside
  // `DropdownMenuTrigger asChild` is fragile in a way the campaign CARD's
  // identical-looking menu is not, and chasing it further was costing more
  // than the tidier header was worth.
  //
  // Ali wanted two CTAs and the rest in an overflow (3 Sep) and that is
  // still the right answer — it is logged as outstanding, not abandoned.
  // Getting the page to render came first.
  // RE-USE IS NOT UP HERE (Ali, 3 Sep: "drop the re-use button from the top
  // area, you can access this through the overflow menu on the card anyway,
  // 4 CTAs is too many"). Starting a new campaign from an old one is a thing
  // you do FROM the list, where you are choosing between campaigns; on one
  // campaign's own results page it was competing with the things you came
  // here to do.
  const campaignActions = onCampaign ? (
    <>
      {stateOf(active.status).canStop ? (
        <Button variant="outline" size="sm" dataHook="insights-stop" onClick={() => setStopTarget(active)}>
          {active.status === "Scheduled" ? "Cancel send" : "Stop campaign"}
        </Button>
      ) : null}
      {stateOf(active.status).canRestart ? (
        <Button variant="primary" size="sm" dataHook="insights-restart" onClick={() => setRestartTarget(active)}>
          <RotateCcw className="size-4" /> Restart
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        dataHook="insights-preview"
        onClick={() => setPreviewConfig({ config: active.config, expired: active.status === "Stopped" })}
      >
        <Eye className="size-4" /> Preview
      </Button>
      <Button variant="outline" size="sm" dataHook="insights-download" onClick={() => setDownloadOpen(true)}>
        <Download className="size-4" /> Download
      </Button>
    </>
  ) : null;

  const headerActions =
    view === "hub" || view === "campaigns" || view === "templates" ? (
      <Button variant="primary" dataHook="new-campaign" onClick={() => startWizard()}>
        <Plus className="size-4" /> New campaign
      </Button>
    ) : (
      campaignActions
    );

  // ANCESTORS ONLY — the H2 is the campaign, so "Get Reviews" is its parent
  // and carries the way back. onClick rather than goto: goto takes a screen
  // id, and the parent here is another view of THIS screen (PageHeader gained
  // crumb.onClick for exactly this, 28 Aug).
  // With the spokes in the trail: a spoke's parent is Get Reviews, and a
  // campaign's parent is Campaigns, so the campaign page reads
  // "Get Reviews > Campaigns" and each crumb is a real way back.
  const breadcrumbTrail = [
    { label: "All Locations", goto: "screen:dmrotrgstba3l" },
    { bind: "location", goto: "screen:dmrurue2wmp9u" },
    { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
    ...(view === "campaigns" || view === "templates" || onCampaign
      ? [{ label: "Get Reviews", onClick: backToHub }]
      : []),
    ...(onCampaign ? [{ label: "Campaigns", onClick: toCampaigns }] : []),
  ];

  // THE WIZARD IS A PAGE OF ITS OWN, not a body view swapped into the hub
  // (Ali, 2 Sep: "if it is a wizard, it should follow the same format as
  // Create Widgets"). Same @brightlocal/wizard-shell the two widget wizards
  // use, so all three read as one pattern.
  if (view === "wizard") {
    // THE DRAWER TRAVELS WITH THE WIZARD (Ali, 2 Sep: "Preview as a
    // customer doesn't work in the prototype either"). It did not, and this
    // is why: the wizard returns BEFORE the app shell, and
    // CustomerPreviewDrawer was mounted inside the shell's body. Pressing
    // Preview as a customer set previewConfig and nothing rendered it,
    // because the only thing that could was not on the page. Both mount
    // points now exist — the wizard's own, here, and the campaign page's
    // inside the shell — so the control works from either place.
    return (
      <>
      <CampaignWizard
        draft={draft}
        setDraft={setDraft}
        step={step}
        setStep={setStep}
        history={history}
        setHistory={setHistory}
        templates={templates}
        editingExisting={!!draft.id}
        onCancel={saveDraftAndLeave}
        onLaunch={launch}
        onOpenCustomerPreview={(cfg) => setPreviewConfig({ config: cfg, expired: false })}
      />
      <CustomerPreviewDrawer
        open={!!previewConfig}
        onOpenChange={(o) => !o && setPreviewConfig(null)}
        config={previewConfig?.config ?? null}
        expired={!!previewConfig?.expired}
      />
      </>
    );
  }

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
        dataHook="get-reviews-app-layout"
        sidebar={<ProposalSidebar dataHook="get-reviews-sidebar" activeId="reviews-get" />}
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
            dataHook="get-reviews-page-header"
            // PageHeader keeps the DEEPEST two crumbs, so this renders
            // "<location> > Reviews" and "All Locations" falls off. Same trail
            // as Review Insights and Review Inbox, so the three siblings agree.
            breadcrumbs={breadcrumbTrail}
            title={headerByView.title}
            description={headerByView.description}
            statusRight={headerByView.statusRight}
            actions={headerActions}
          />
        }
      >
        <GlobalLayoutContentBody className="gap-4">
          {view === "hub" ? (
            <GetReviewsOverview
              campaigns={campaigns}
              templates={templates}
              onCampaigns={toCampaigns}
              onTemplates={() => setView("templates")}
              onNew={startWizard}
            />
          ) : null}

          {view === "campaigns" ? (
            <CampaignsPage
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              setTemplates={setTemplates}
              onOpen={openCampaign}
              onNew={startWizard}
              onPreview={(c) => setPreviewConfig({ config: c.config, expired: c.status === "Stopped" })}
              onStop={setStopTarget}
              // Restarting is not destructive and nothing is lost by it, so
              // unlike Stop it does not ask first — it just goes live again,
              // and Stop is one menu item away if that was a mistake.
              // Same dialog from the row as from the page: restarting means
              // the same thing wherever it is triggered, so it explains
              // itself the same way.
              onRestart={setRestartTarget}
            />
          ) : null}

          {view === "templates" ? (
            <TemplatesPage templates={templates} setTemplates={setTemplates} onNew={startWizard} />
          ) : null}

          {view === "success" ? (
            /* launch() already parked the new campaign in activeId, so
               insights is a straight switch to its page. */
            <SuccessView
              draft={draft}
              onInsights={() => {
                setCampaignTab("summary");
                setView("campaign");
              }}
              onHub={backToHub}
              onKiosk={() => setPreviewConfig({ config: draft, expired: false })}
            />
          ) : null}

          {/* THE CAMPAIGN, AS A PAGE. It was a right-hand drawer for one
              turn, on the reasoning that a body view has to invent its own
              way home and the in-body back link that produced had already
              been rejected ("I dont want weird back links like this"). Ali
              settled it on 28 Aug: a campaign summary is a screen, not a
              panel, and 56rem of funnel, chart and feedback table inside a
              scrolling overlay was the tell.
              The way home is the BREADCRUMB, which was the honest answer all
              along: the trail was already saying "Reviews > Get Reviews" over
              the top of the overlay, so the last crumb just had to become
              clickable. No invented row under the header.
              Summary and All feedback stay tabs, and the four campaign
              actions go back to the page header where they started.
              Two SCREENS is still not an option: goto carries a screen id and
              nothing else, so it cannot say WHICH campaign to open. */}
          {onCampaign ? (
            <Tabs value={campaignTab} onValueChange={setCampaignTab} dataHook="campaign-tabs">
              <TabsList dataHook="campaign-tabs-list">
                <TabsTrigger value="summary" dataHook="campaign-tab-summary">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="feedback" dataHook="campaign-tab-feedback">
                  All feedback
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" dataHook="campaign-summary-panel">
                <div className="pt-4">
                  <CampaignInsights
                    campaign={active}
                    onAllFeedback={() => setCampaignTab("feedback")}
                  />
                </div>
              </TabsContent>
              <TabsContent value="feedback" dataHook="campaign-feedback-panel">
                <div className="pt-4">
                  <AllFeedback campaign={active} />
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          {/* Inside the shell on purpose: the customer pages read the business
              name from the proposal data seam, and the shell is what mounts
              the provider for the selected dataset. */}
          <CustomerPreviewDrawer
            open={!!previewConfig}
            onOpenChange={(o) => !o && setPreviewConfig(null)}
            config={previewConfig?.config ?? null}
            expired={!!previewConfig?.expired}
          />
        </GlobalLayoutContentBody>
      </AppLayoutShell>

      {/* RESTARTING IS A CHANGE, SO IT EXPLAINS ITSELF (Ali, 3 Sep:
          "restart, as it is a change, should probably have an alert
          explaining what this means"). It is easy to assume restart means
          "send it again", which for a 480-person email campaign is an
          expensive thing to assume wrongly. It does not: it reopens the
          landing pages so links already out in the world work again. Nobody
          receives anything. That is the one sentence this dialog exists to
          say. */}
      <AlertDialog
        dataHook="restart-campaign"
        open={!!restartTarget}
        onOpenChange={(o) => !o && setRestartTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle dataHook="restart-title">
              Restart “{restartTarget?.name ?? "this campaign"}”?
            </AlertDialogTitle>
            <AlertDialogDescription dataHook="restart-desc">
              Nobody is sent anything. Restarting makes the links already out there work again, so
              customers who still have the email or text can leave a review, and the numbers start
              counting from where they stopped. To ask a new group of people, re-use the campaign
              instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Leave it stopped</AlertDialogCancel>
            <Button
              variant="primary"
              dataHook="restart-confirm"
              onClick={() => {
                setCampaigns((cs) =>
                  cs.map((c) =>
                    c.id === restartTarget.id
                      ? {
                          ...c,
                          status: "Live",
                          lastActivity: { label: "Restarted", date: "2026-09-03T09:05" },
                        }
                      : c,
                  ),
                );
                setRestartTarget(null);
              }}
            >
              Restart campaign
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        dataHook="stop-campaign"
        open={!!stopTarget}
        onOpenChange={(o) => !o && setStopTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle dataHook="stop-title">Stop “{stopTarget?.name ?? "this campaign"}”?</AlertDialogTitle>
            <AlertDialogDescription dataHook="stop-desc">
              The links stop working and the numbers stop counting. You can restart it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it live</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                setCampaigns((cs) =>
                  cs.map((c) =>
                    c.id === stopTarget?.id
                      ? {
                          ...c,
                          status: "Stopped",
                          stoppedOn: "2026-08-19",
                          lastActivity: { label: "Stopped", date: "2026-08-19T14:10" },
                        }
                      : c,
                  ),
                )
              }
            >
              Stop campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent dataHook="download-content">
          <DialogHeader>
            <DialogTitle dataHook="download-title">Download</DialogTitle>
            <DialogDescription dataHook="download-desc">
              CSV gives you the raw numbers for a spreadsheet. PDF gives you a formatted report ready
              to share. Testimonials include only the feedback where the customer gave permission
              ({FEEDBACK_ITEMS.filter((f) => f.consent).length} of {FEEDBACK_ITEMS.length}).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" dataHook="download-csv">
                <Download className="size-4" /> CSV
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" dataHook="download-pdf">
                <Download className="size-4" /> PDF
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
