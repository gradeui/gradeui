"use client";

// Promoted from Studio screen "RM — Review Builder"
// (design dmt094j963aye, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: 9bc32f2aab96

// RM — Review Builder — GAUGE EXPLORATION (3 Sep). A duplicate of "RM — Get
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
// ─── THIRD PASS, 3 SEP (late) — TEMPLATES OFF THE HEADER, PAGINATION ───
// Two versions were tried on this message and this is the one that stuck.
// Ali: "not too sure about having a page with two tabs, feels annoying and
// I think it's hard to find things" — then, on seeing a two-card hub with a
// Templates card: "we have templates somewhere else, this doesn't work.
// Let's go on the previous copy and add 'Templates'." So: the tabs are
// gone, the CAMPAIGNS TABLE IS THE HUB, and Templates is a page of its own
// reached from a secondary "Templates" button in the header, with the
// breadcrumb as the way back. Pagination on both tables (DS Pagination).
// Gauge legend moved to the dial's right to match the Review Tracker
// donut. The two-card hub survives as "RM — Review Builder — Hub & spoke" for
// the record. If templates end up living in the product's existing
// templates area, the header button becomes a goto to that screen and the
// TemplatesPage here goes.
//
// Checked against Mobbin (3 Sep): HubSpot ("Back to campaigns" + Manage
// saved templates / Create new template, Built by HubSpot vs Saved rails)
// and Kajabi ("Email Campaigns / Manage templates" breadcrumb) are this
// shape; Flodesk, Squarespace and Podia put the template gallery as step
// one of create, which the wizard here already does; Mailchimp, Klaviyo
// and Wix keep templates under Content in the nav. Nobody makes Templates
// a peer of Campaigns on the campaigns page. Everybody paginates.
//
// RM — Review Builder. First pass from Harry Brignull's UX audit (11 Aug 2026,
// section 3.3) and the "Review Builder.dc.html" clickthrough in the newer ZIP.
//
// ─── WHAT THIS PAGE IS ───
// The audit renames legacy "Review Generation" to "Review Builder" and collapses
// its conceptual model: ONE campaign has ONE collector (channel) and ONE
// insights page. No campaign-inside-a-campaign. To run the same ask again you
// duplicate the campaign. So the page is a hub of campaign cards plus a
// create flow, and every card drills into its own insights page.
//
// ─── VIEWS IN THIS ONE SCREEN ───
// hub → wizard → success, plus insights and its all-feedback child. Same
// shape as RM — Review Manager, which keeps templates and auto-reply in-screen:
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
//    mark, and the Review Manager screen is carrying a redrawn stand-in that
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

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useUrlParam } from "@/lib/url-state";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { profileFor } from "@/lib/location-profiles";
import { BeaconPageStrip } from "@/components/review-summary";
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
import { Switch } from "@brightlocal/ui-components/switch";
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@brightlocal/ui-components/accordion";
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
// THE SAME TABLE AS REVIEW MANAGER (Ali, 6 Sep: "we can switch to the
// DataTable for all tables"). Two hand-rolled <Table>s and one DataTable in
// the same product is two sets of padding, two pagers and two ideas about
// where a header row sits.
import { useDataTable, DataTable, DataTablePagination } from "@brightlocal/ui-components/data-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@brightlocal/ui-components/pagination";
// The funnel is <ReviewFunnel/> from the proposal lib — the DS ships no
// Funnel, and wrapping recharts by hand renders nothing (see its sidecar).
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
  MessageSquareText,
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
  Gauge as GaugeIcon,
  User,
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
  ReviewFunnel,
  Dropzone,
  FeedbackControl,
  FeedbackScore,
  formatDate,
  useProposalData,
} from "@brightlocal/proposal";
import { WizardShell } from "@brightlocal/wizard-shell";
import { FacetedFilterMenu } from "@brightlocal/facet-menu";
import { PreviewFrame } from "@brightlocal/preview-frame";
import { SideSheetHeader } from "@brightlocal/side-sheet-header";

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
    // A 0 to 10 scale IS a gauge, and Review Tracker already draws NPS as one,
    // so the icon matches the chart people will see the results in.
    Icon: GaugeIcon,
    label: "NPS",
    caption: 'A 0 to 10 "how likely are you to recommend us" scale.',
    question: "How likely are you to recommend {{businessname}} to a friend or colleague?",
  },
  thumbs: {
    id: "thumbs",
    Icon: ThumbsUp,
    label: "Thumbs up or down",
    caption: "The simplest possible answer.",
    question: "How was your visit?",
  },
  stars: {
    id: "stars",
    Icon: Star,
    label: "Star rating",
    caption: "A familiar star rating.",
    question: "How would you rate your visit?",
  },
};

// EVERY TYPE HAS AN ICON (Ali, 7 Sep: "each type in Builder should have an
// icon, so NPS, Star rating, and Thumbs up down; they can then go in a facet
// filter with the icons. Review only will need its own"). "Review only" is
// not a FEEDBACK_TYPE, it is the absence of a rating step, but it IS a value
// in the Type column and the Type filter, so it lives in the same list. Order
// here is the order the filter shows.
const REVIEW_ONLY = { id: "review", Icon: MessageSquareText, label: "Review only" };
const ASK_TYPES = [FEEDBACK_TYPES.nps, FEEDBACK_TYPES.stars, FEEDBACK_TYPES.thumbs, REVIEW_ONLY];
const askType = (config) =>
  config.ask === "feedback"
    ? FEEDBACK_TYPES[config.feedbackType] ?? { id: "feedback", Icon: Star, label: "Feedback" }
    : REVIEW_ONLY;

// One rendering of a type wherever it appears: campaigns table, templates
// table, template list. TEXT ONLY in tables (Ali, 7 Sep: "showing the icons
// in the table is actually too much, I dont mind in the dropdowns"); the icon
// belongs to the Type filter, where it helps you pick. Module scope on
// purpose, a component declared inside another remounts on every render.
function AskType({ config, className = "" }) {
  return <span className={`text-muted-foreground ${className}`}>{askType(config).label}</span>;
}

// Credit rates and pricing are the prototype's. See assumption 3.
const CREDIT_RATES = { UK: 2, USA: 1, Canada: 1 };
const CREDIT_PACKAGES = [
  { id: "p250", credits: 250, price: "$12.50" },
  { id: "p500", credits: 500, price: "$25.00" },
  { id: "p1000", credits: 1000, price: "$50.00" },
  { id: "p2500", credits: 2500, price: "$125.00" },
];

const RECIPIENT_COUNT = 112;
// How many people this send actually reaches. One is one.
const recipientsOf = (config) => (config.audience === "one" ? 1 : RECIPIENT_COUNT);

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
    // WRITTEN ONCE (Ali, 7 Sep: "yes do it, with an option to have alternative
  // text for SMS"). `body` is THE message; the text version falls back to it
  // unless you deliberately want different words. The two defaults used to be
  // the same sentence twice ("thank you for choosing" / "thank you for
  // visiting"), which made every template carry four boxes for one idea.
  // The override is real, not decorative: a text has 160 characters and no
  // subject line, so sometimes it genuinely needs its own wording.
  smsOverride: false,
  reminderSmsOverride: false,
  // Empty on purpose: this is the OVERRIDE, and an override that ships with a
  // value pre-filled is just the duplicate sentence again under a new name.
  smsText: "",
    reminderSms: "",
    invite: "Thank you. If you have a moment, please share your feedback on a public review site:",
  // Beat 2. Legacy keeps this under Link Mode because it is the one beat that
  // only exists when the customer arrived from a public link.
  contactIntro:
    "Thanks for using {{businessname}}. Please give us your contact details so we know who left the feedback.",
  // THE BUTTON HAS WORDS TOO (Ali, 7 Sep: "its almost like we need text
  // associated with the leave review button"). Legacy's landing page renders
  // "Review us on Google", so the label already varies by site. ONE field with
  // a {{site}} token rather than a label per site: a campaign can point at
  // four review sites, and nobody wants to write the same sentence four times
  // with one word changed.
  reviewButtonLabel: "Review us on {{site}}",
  // Consent is TEMPLATE content, not a campaign setting (Ali, 7 Sep). Two
  // parts, because legacy has two: `consent` is whether to ask at all, and
  // this is the sentence the customer actually reads. Only the second is
  // wording, but they belong together or the toggle turns off a box whose
  // words live somewhere else.
  consentLabel:
    "I am happy for {{businessname}} to use my feedback on their website and in their marketing.",
    sites: [{ site: "google", url: "https://g.page/r/CQfW8xK2mNvUEBM" }],
    // ONE PERSON OR A LIST (Ali, 7 Sep: "you should be able to have a campaign
  // send to just one email address or phone number as well as a CSV"). A CSV
  // was the only way in, which made the most common small case, asking the
  // customer standing in front of you, the hardest one: build a spreadsheet
  // for a single address.
  // WHERE THE LOGO COMES FROM (Ali, 7 Sep: "for logo we have something that has
  // a checkbox to say get from my Google Profile"). Pulling it from the Google
  // Business Profile is the right default: the location already has a verified
  // logo there, and asking someone to find and upload a PNG to send one email
  // is the kind of small friction that stops a campaign going out at all.
  logoSource: "google", // "google" | "upload"
  audience: "list", // "one" | "list"
  oneContact: "",
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
          { site: "google", url: "https://g.page/r/CQfW8xK2mNvUEBM" },
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
      status: "Ended",
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
      status: "Live",
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
      status: "Ended",
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
// dish. There is no template editor: you edit a campaign, then "Save as
// template" on its row is how a user-made one comes into being.
//
// A TEMPLATE CARRIES NO MODE (Ali, 6 Sep). Legacy's template builder steps
// through Campaign Type › General › Emails › SMS › Link Mode — one template
// configures every delivery mode, and how to send is chosen when you run a
// campaign from it.
//
// The presets were named for their medium (Post-visit EMAIL, TEXT after
// purchase, Counter KIOSK, Receipt QR LINK), and stripping that out exposed
// that two of them were the same template: "Text after purchase" and
// "Receipt QR link" both went straight to a review and differed ONLY by how
// they were sent. So the set is now the thing a template actually decides —
// what you ask and how you measure it: three rating styles that collect
// feedback first, and the one path that skips it.
// A template config is a campaign config with the MODE taken out. Doing it
// here rather than in each preset means a template can never acquire one by
// being spread from a draft that has one — including a user's own template,
// saved from a campaign that was necessarily sent somehow.
// WHAT A TEMPLATE IS, stated once (Ali, 7 Sep: "a template seems to include
// lots of things, including email text templates, sms text templates, leave
// review text templates, as well as titles for each. Its pretty confusing").
//
// It is confusing because a template is not one thing, it is THE WORDING FOR
// EVERY SURFACE, and it has to be, precisely because it carries no channel: at
// the moment you write it, nobody knows whether it will go out by email, by
// text or as a standing link, so it has to have something to say in all three.
// That is the whole of the difficulty, and it is inherent, not a UI accident.
//
// A template carries:
//   the ask      feedbackType, and the question wording that goes with it
//   email        subject, body, legal footer, and the reminder pair
//   text         smsText and its reminder
//   review page  the invite line shown before the review links
//
// A template does NOT carry anything about THIS SEND, because a template is
// reused across many: no channel, no review sites (Ali, 7 Sep: "templates
// dont include review sites"), no recipient columns, no country, and none of
// the per-send confirmations.
const CAMPAIGN_ONLY = ["channel", "sites", "columns", "headerRow", "country", "permission", "privacy", "id"];

function templateConfig(overrides) {
  const merged = { ...blankCampaignDraft(), ...overrides };
  for (const key of CAMPAIGN_ONLY) delete merged[key];
  return merged;
}

// THE FOUR BEATS, filed by what the customer meets rather than by channel
// (Ali, 7 Sep: "seems like ALOT of not needed duplication").
//
// Legacy files a template by medium: Campaign Type, General, Emails, SMS, Link
// Mode, and Link Mode alone hides two more pages behind a pill toggle. Six
// screens to define one template, and two of them say the same sentence:
// the Link Mode landing page reads "Thank you! If you like, you can share your
// feedback on one of these sites", and the feedback flow's review invite reads
// "Thank you. If you have a moment, please share your feedback on a public
// review site". One beat, written twice, because they sat in different silos.
//
// Filed by journey there are four beats, and only the first genuinely needs a
// version per channel, because only the first travels by one:
//
//   1 Invite         email and text wording, plus their reminders
//   2 Who are you?   only when they arrive from a public link, so nobody knows
//                    who they are yet. With email and text you already have
//                    them from the list, which is exactly why legacy filed
//                    this under Link Mode.
//   3 How was it?    the rating question, skipped when going straight to review
//   4 Leave a review the invite shown before the review-site buttons
const TEMPLATE_BEATS = [
  {
    id: "invite",
    rail: "Message",
    sub: "Email and text wording",
    preview: ["email", "sms"],
    Icon: Mail,
    hint: "The email or text that asks for a review",
    groups: [
      { label: "The message", fields: [
        { key: "subject", label: "Subject line", kind: "input", desc: "What they see in their inbox. A text message has no subject, so this is ignored when sending by text." },
        { rows: 9, key: "body", label: "Message", kind: "textarea", desc: "Sent as the email, and as the text message too unless you word that differently below." },
        { key: "smsOverride", label: "Word it differently in a text message", kind: "switch", desc: "A text is capped at 160 characters and has no subject line, so it sometimes needs its own wording." },
        { rows: 5, key: "smsText", label: "Text message wording", kind: "textarea", when: (d) => d.smsOverride, desc: "Used instead of the message above whenever the campaign sends by text." },
      ] },
      { label: "The reminder", fields: [
        { key: "reminderSubject", label: "Subject line", kind: "input", desc: "The subject of the follow-up email." },
        { rows: 9, key: "reminderBody", label: "Message", kind: "textarea", desc: "Sent only to people who did not respond to the first message." },
        { key: "reminderSmsOverride", label: "Word it differently in a text message", kind: "switch", desc: "Only needed if the reminder has to read differently as a text." },
        { rows: 5, key: "reminderSms", label: "Text message wording", kind: "textarea", when: (d) => d.reminderSmsOverride, desc: "Used instead of the reminder above when sending by text." },
      ] },
    ],
  },
  {
    id: "rate",
    rail: "Rating question",
    sub: "How they score you",
    preview: ["feedback"],
    Icon: Star,
    hint: "The page where they score you, before any review site is offered",
    when: (d) => d.ask === "feedback",
    groups: [{ fields: [
      { key: "feedbackQuestion", label: "Question", kind: "input", desc: "The main question above the rating. Changing what you ask for rewrites this." },
      { key: "followUpQuestionText", label: "Follow-up question", kind: "input", desc: "Asked underneath once they have picked a score, to get the reason behind it." },
    ] }],
  },
  {
    id: "review",
    rail: "Public review",
    sub: "Where they share it publicly",
    preview: ["review"],
    Icon: Link2,
    hint: "The last page. Invites them to post what they just told you on a public review site.",
    // SAY WHERE THE SITES COME FROM (Ali, 7 Sep: "templates stay campaign only.
    // We need a small note below the preview to say as much"). Google appears
    // in this preview, so without a note it reads as something the template
    // decided, and the first instinct is to look for a control that is not
    // there. Sites belong to the campaign because they are a property of the
    // LOCATION, not of the words: one template then works for a location with
    // Google only and one with Google plus TripAdvisor.
    note: "The review sites are chosen on the campaign, not here, so one template works wherever you use it.",
    groups: [{ fields: [
      { rows: 4, key: "invite", label: "Wording above the buttons", kind: "textarea", desc: "Shown after they leave feedback, inviting them to post it publicly." },
      { key: "reviewButtonLabel", label: "Button label", kind: "input", desc: "Repeated once per review site. Use {{site}} to drop in each site name." },
    ] }],
  },
  {
    id: "identify",
    rail: "Contact details",
    sub: "Link campaigns only",
    preview: ["contact"],
    Icon: User,
    hint: "Asks for their name and email. Only appears when someone clicks a public link, because you do not know who they are yet.",
    groups: [{ fields: [
      { rows: 5, key: "contactIntro", label: "Wording above the form", kind: "textarea", desc: "Explains why you are asking for their details before they can leave feedback." },
      { key: "consent", label: "Ask permission to quote them", kind: "switch", desc: "Adds a tick box so you can reuse their words as a testimonial." },
      // Hidden when the ask is off, because wording for a box nobody sees is
      // just another field to scroll past.
      { rows: 4, key: "consentLabel", label: "Permission wording", kind: "textarea", when: (d) => d.consent, desc: "The sentence beside the tick box. This is what they are agreeing to." },
    ] }],
  },
];

// EXAMPLES, NOT PRESETS. These seed the list so it is not empty on day one and
// so there is something to copy from, but they are ordinary templates: editable
// in place, deletable, no badge, no special save path.
function seedTemplates() {
  return [
    {
      id: "t1",
      name: "How likely to recommend",
      updated: "2026-06-02T09:00",
      config: templateConfig({
        name: "How likely to recommend",
        ask: "feedback",
        feedbackType: "nps",
        reminder: true,
      }),
    },
    {
      id: "t2",
      name: "How would you rate us",
      updated: "2026-06-02T09:00",
      config: templateConfig({
        name: "How would you rate us",
        ask: "feedback",
        feedbackType: "stars",
        feedbackQuestion: FEEDBACK_TYPES.stars.question,
      }),
    },
    {
      id: "t3",
      name: "How was your visit",
      updated: "2026-06-02T09:00",
      config: templateConfig({
        name: "How was your visit",
        ask: "feedback",
        feedbackType: "thumbs",
        feedbackQuestion: FEEDBACK_TYPES.thumbs.question,
      }),
    },
    {
      id: "t5",
      name: "Summer Visitors",
      updated: "2026-08-21T11:40",
      config: templateConfig({
        name: "Summer Visitors",
        ask: "feedback",
        reminder: true,
        sites: [
          { site: "google", url: "https://g.page/r/CQfW8xK2mNvUEBM" },
          { site: "facebook", url: "https://facebook.com/willowbrookfarmpark" },
        ],
      }),
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

// ONE PLACE decides what a text message actually says, so a preview and the
// editor can never disagree about it.
function smsBodyOf(config, isReminder) {
  if (isReminder) {
    return config.reminderSmsOverride ? config.reminderSms : config.reminderBody;
  }
  return config.smsOverride ? config.smsText : config.body;
}

function resolveVars(text, business, site) {
  return (text ?? "")
    .replaceAll("{{firstname}}", "Sophie")
    .replaceAll("{{businessname}}", business)
    // {{site}} only means anything on the review buttons, where the same
    // sentence is rendered once per site. Elsewhere it simply never appears.
    .replaceAll("{{site}}", site ?? "");
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
    flow.push("recipients");
    // Column mapping only exists because a CSV has columns. Sending to one
    // address has none, so the step would be an empty page asking nothing.
    if (d.audience !== "one") flow.push("columns");
    flow.push("check", "send");
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

// THE SEND PATH GETS A RAIL (Ali, 8 Sep: "it's the send path, can we also
// add a side rail to these steps"), so it reads as the same template as the
// settings pages. The steps are the send-path portion of the flow the wizard
// already builds (buildFlow), never re-derived here. Subtext is one short
// phrase from what each page already says. "Settings" leads the list as the
// way back to the campaign page, which is what the footer's "Back to
// settings" used to be.
const SEND_STEPS = ["recipients", "columns", "check", "send", "golive"];
const SEND_RAIL = {
  setup: { rail: "Settings", sub: "Campaign settings", Icon: FileText },
  recipients: { rail: "Recipients", sub: "Who receives it", Icon: User },
  columns: { rail: "Columns", sub: "Match your columns", Icon: Upload },
  check: { rail: "Check", sub: "Rows in and out", Icon: CircleCheck },
  send: { rail: "Send", sub: "Summary and send", Icon: Send },
  golive: { rail: "Go live", sub: "Summary and go live", Icon: Send },
};
function sendRailSteps(flow, draft) {
  const steps = ["setup", ...flow.filter((id) => SEND_STEPS.includes(id))];
  return steps.map((id) => {
    const base = SEND_RAIL[id];
    // A kiosk is launched, not put live; the rail says which, as the page does.
    if (id === "golive" && draft.channel === "kiosk") return { id, ...base, rail: "Launch", sub: "Summary and launch" };
    return { id, ...base };
  });
}

// SAME RAIL AS THE TEMPLATE EDITOR (plain buttons with tablist semantics,
// icon, label, subtext, sticky from md), plus one rule a sequence needs:
// steps AFTER the current one are drawn but disabled, because a sequence
// cannot be jumped forward; earlier ones are clickable and go back.
function SequenceRail({ steps, activeId, onSelect, ariaLabel, hook }) {
  const activeIndex = steps.findIndex((s) => s.id === activeId);
  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      className="flex flex-col gap-1 md:sticky md:top-0 md:self-start"
      data-hook={hook}
    >
      {steps.map((x, i) => {
        const on = x.id === activeId;
        const later = i > activeIndex;
        return (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={on}
            aria-disabled={later || undefined}
            disabled={later}
            data-hook={`${hook.replace(/-rail$/, "")}-tab-${x.id}`}
            onClick={() => (later || on ? null : onSelect(x.id))}
            className={`flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors ${
              on ? "bg-muted" : later ? "cursor-not-allowed opacity-50" : "hover:bg-muted/50"
            }`}
          >
            <x.Icon className={`mt-0.5 size-4 shrink-0 ${on ? "" : "text-muted-foreground"}`} />
            <span className="flex min-w-0 flex-col">
              <span className={`truncate text-sm ${on ? "font-medium" : ""}`}>{x.rail}</span>
              <span className="text-muted-foreground truncate text-xs">{x.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

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
// WHAT A PREVIEW PRETENDS THE CUSTOMER PICKED. One place, because two previews
// showing different sample answers for the same template is the drift Ali is
// guarding against ("I just want to make sure when we show a preview it is
// always rendered the same"). A 9 reads as a promoter on NPS, thumbs-up on
// thumbs, 4 of 5 on stars: positive but not a perfect score, so the review-site
// step is reachable and the page does not look staged.
const sampleRating = (config) =>
  config.feedbackType === "nps" ? 9 : config.feedbackType === "thumbs" ? "up" : 4;

const askLabel = (config) => askType(config).label;

// NO SOURCE CHIP ANYWHERE (Ali, 7 Sep: "dont keep yours drop all tags").
// Ready-made templates are simply what a template is here, so labelling four
// of five rows with the name of the product you are already inside said
// nothing; and once those go, "Yours" is a chip that appears on one row and
// makes it look special rather than merely different. `source` stays on the
// record because it still decides whether Delete appears in a row overflow.

// ─── THE SIX CAMPAIGN STATES ─────────────────────────────────────────
// Ali, 3 Sep: "put all the states in, then we can have a page in each of
// these states, as they will display different alerts and button options".
//
// NOTHING SPECIFIES THESE. The RM Design Brief lists what Review Builder does
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
  Live: { variant: "primary", cta: "View insights", alert: null, canStop: true, canRestart: false, canReuse: true },
  // ENDED = Finished + Stopped (Ali, 7 Sep: "'Finished' and 'Stopped' are
  // also the same really, just 'Ended' is ok and captures both"). Sending
  // folded into Live the same day. Two things this drops on purpose: the
  // "numbers still climbing" banner while a send is in flight, and the
  // warning tone that marked a campaign somebody halted.
  // ASSUMPTION: an ended campaign can still be restarted. Stopped could and
  // Finished could not; with one state there is one answer, and keeping the
  // restart flow is the smaller call than deleting it.
  Ended: {
    variant: "outline",
    cta: "View insights",
    alert: {
      tone: "info",
      text: "This campaign has ended. Nothing more will be sent and the numbers below are final. Re-use it to run the same ask again.",
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
        <div className="flex flex-col items-center gap-2">
          {config.sites.map((s) => (
            <Button key={s.site} variant="outline" dataHook={`customer-site-${s.site}`}>
              <SiteMark id={s.site} />
              {/* Was hardcoded "Review us on {label}". Reading the template's
                  own field means editing it actually changes the preview,
                  which is the whole point of it being a field. */}
              {resolveVars(
                config.reviewButtonLabel || "Review us on {{site}}",
                business,
                siteById(s.site).label,
              )}
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
            {resolveVars(
              config.consentLabel ||
                "I am happy for {{businessname}} to use my feedback on their website and in their marketing.",
              business,
            )}
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
  const asksRating = config.ask === "feedback";
  return (
    // The email is a customer-facing surface too, so it takes the same
    // brand remap as the landing pages.
    <div className="flex flex-col gap-3 p-5 text-sm" style={brandSurface(config.brandColor)}>
      <div className="border-b pb-3">
        <span className="text-muted-foreground text-xs">Subject</span>
        <p className="font-medium">{resolveVars(subject, business)}</p>
      </div>
      <p className="whitespace-pre-wrap">{before}</p>
      {/* THE RATING ONLY APPEARS IF YOU ASKED FOR ONE (Ali, 7 Sep: "if we are
          NOT asking for a review up front, our Message is wrong, as this
          currently seems to contain a NPS rating, even though in general I've
          said no to that").
          It was gated on the BODY containing a {{feedbackform}} marker, which
          says where the block goes, not whether there should be one. Turning
          "Ask for a rating first" off left the marker in place, so the email
          kept showing an NPS scale for a campaign that never rates anybody.
          With no rating there is still a job to do, so the slot becomes the
          call to action it should always have been: straight to the review. */}
      {after !== undefined ? (
        asksRating ? (
          <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-md border border-dashed p-4 text-center">
            <span className="text-sm font-medium">{resolveVars(config.feedbackQuestion, business)}</span>
            <FeedbackControl type={config.feedbackType} value={null} onPick={() => {}} interactive={false} />
          </div>
        ) : (
          <div className="flex justify-center">
            <Button variant="primary" dataHook="email-preview-review-cta">
              Leave a review
            </Button>
          </div>
        )
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

// A TEXT MESSAGE LOOKS LIKE A TEXT MESSAGE (Ali, 7 Sep: "the text message
// preview doesn't really look like a text message, it also has {{feedbackform}}
// inside it, all the text would be the same size, the link would maybe have an
// underline, but the link is currently unreadable"). One bubble, one type
// size. The {{feedbackform}} token is where the link GOES, so it renders as
// the short link inline, underlined, in the text colour (the brand green on
// white failed contrast). If the wording carries no token the link follows the
// text on its own line, because a text with no link asks for nothing. The
// opt-out line is part of the same message at the same size, as it is on a
// phone.
const SMS_LINK = "wb.rvw/x8k2p1";
function SmsPreview({ config, isReminder }) {
  const business = useBusinessName();
  const text = resolveVars(smsBodyOf(config, isReminder), business);
  const parts = text.split("{{feedbackform}}");
  const link = <span className="underline underline-offset-2">{SMS_LINK}</span>;
  return (
    <div className="bg-muted/40 flex flex-col gap-2 p-5">
      <span className="text-muted-foreground text-center text-xs">{business}</span>
      <div
        className="bg-background max-w-[85%] rounded-2xl rounded-bl-sm border px-3 py-2 text-sm leading-6 whitespace-pre-wrap"
        data-hook="sms-preview-bubble"
      >
        {parts.length > 1
          ? parts.map((part, i) => (
              <Fragment key={i}>
                {part}
                {i < parts.length - 1 ? link : null}
              </Fragment>
            ))
          : [text, "\n", link]}
        {"\n\nReply STOP to opt out."}
      </div>
    </div>
  );
}

/* ============================ hub and templates =========================== */

// The page header is sticky, so a table's own sticky band has to start below
// it rather than at 0. Measures the band the header sits in, the same way
// Review Manager does — copied rather than shared because the proposal lib
// has no home for a hook yet.
function useStickyHeaderOffset(headerHook) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const el = document.querySelector(`[data-hook="${headerHook}"]`);
    if (!el) return undefined;
    let band = el;
    let node = el;
    while (node && node !== document.body) {
      if (window.getComputedStyle(node).position === "sticky") {
        band = node;
        break;
      }
      node = node.parentElement;
    }
    const measure = () => setOffset(Math.round(band.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(band);
    return () => ro.disconnect();
  }, [headerHook]);
  return offset;
}

// GROUPED SO IT CAN STICK (Ali, 6 Sep: "all table headers and filters to be
// grouped so that they can be sticky just like in Review Manager"). The
// filters band sticks under the page header; the table's OWN header row then
// sticks under the band, which needs the band's measured height rather than
// a guessed one. Two sticky layers, so the column labels stay readable while
// the rows scroll past them.
function useStickyTable(headerHook) {
  const top = useStickyHeaderOffset(headerHook);
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
  return { top, bandRef, headTop: top + bandHeight };
}

// One look for every table on this screen: no outer border (the Card owns
// that), a sticky header row, and the first cell inset to 16px so it lines
// up with the px-4 toolbars above it rather than sitting 8px short.
// overflow-visible IS LOad-BEARING, and TWICE: DataTable nests an inner
// `relative overflow-auto` div inside its own `overflow-auto` root, and
// EITHER of them captures a sticky <th> — it then pins to that box, which
// never scrolls, so the header simply rides away with the page. Clearing
// both hands scrolling back to the page.
//
// The original note, still true of the root:
// which makes IT the scroll container — so a sticky <th> pins to the top of
// that box rather than the viewport, and the header row lands on top of row
// two instead of under the filters. Handing scrolling back to the page is
// what lets the header stick under the band. (Review Manager never hit this:
// its column labels are sr-only, so it has no header to stick.)
// border-separate IS ALSO LOad-BEARING. A sticky <th> does nothing inside a
// `border-collapse: collapse` table — the cell has no box of its own to
// stick, so it scrolls away with computed position:sticky and a top that is
// simply ignored. Separated borders with zero spacing look identical and
// give the cell a box. The row rules then have to be painted per cell,
// because a collapsed table's shared borders go with it.
const TABLE_LOOK =
  "rounded-none border-0 overflow-visible [&>div]:overflow-visible " +
  "[&_table]:border-separate [&_table]:border-spacing-0 " +
  "[&_tbody_td]:border-b [&_thead_th]:border-b " +
  "[&_thead_th]:sticky [&_thead_th]:top-[var(--th-top,0px)] " +
  "[&_thead_th]:z-20 [&_thead_th]:bg-card " +
  // THE TD, NOT THE TR (Ali, 7 Sep: "weird border issue"). border-b is set on
  // the cells, so zeroing it on the last ROW zeroed nothing: the final row kept
  // its 1px line and the sticky pagination bar drew its own border-t directly
  // under it, painting a 2px double rule that read as heavier than every other
  // separator in the table.
  "[&_tbody_tr:last-child_td]:border-b-0 [&_thead_th:first-child]:pl-4 [&_tbody_td:first-child]:pl-4 " +
  "[&_thead_th:last-child]:pr-4 [&_tbody_td:last-child]:pr-4";


// THE CAMPAIGNS TABLE IS THE HUB. Campaigns are what people come here for
// nine times in ten, so they are the page, not a tab on it or a card in
// front of it. Templates are a thing you visit, so they get a page and a
// secondary button — see App's headerActions.

// PAGINATION (Ali, 3 Sep: "apparently we might also need pagination"). The
// DS Pagination, in a muted band at the foot of the card that matches the
// filter band at its head. Page size is FIVE here so nine campaigns show the
// control doing something; the real number is a product decision and lives
// in one constant. Changing a filter goes back to page 1, because page 2 of
// a filter that now has four rows is nowhere. Hidden when there is only one
// page — a pager with one page is furniture.
// TEN A PAGE (Ali, 6 Sep: "pagination will be 10 or 20, not 5 per page").
// Five made a pager out of a list short enough to read in one go, which is
// the pagination equivalent of a progress bar for a one-second task.
const PAGE_SIZE = 10;

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
// One dialog serves both pages; the copy changes with the kind, because
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

// THE CAMPAIGNS TABLE (3 Sep, "table for both"): name, mode, status, reviews
// gained, last activity, a menu. Filters for MODE and STATUS (Ali, 3 Sep:
// "campaign filters for the type — email/sms etc — and also the status —
// live, draft etc"). Sorted by what is happening, then by what worked —
// Four statuses since 7 Sep (see STATES). Ordering note moved beside STATUS_ORDER;
// state — so "is anything on fire" and "what should I copy" are both
// answered from the top of page 1.
// Live first, Ended last, most reviews at the top within a status.
const STATUS_ORDER = { Live: 0, Scheduled: 1, Draft: 2, Ended: 3 };

function CampaignsPage({ campaigns, setCampaigns, setTemplates, onOpen, onNew, onStop, onRestart, onPreview }) {
  // MULTI-SELECT, EMPTY MEANS ALL, same convention as Review Manager's facets.
  // These were two DS Selects until 7 Sep; the Type filter needed icons and
  // checkboxes, and one band should not mix two ways of choosing a filter.
  const [statusFilter, setStatusFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [modeFilter, setModeFilter] = useState([]);
  const [menu, setMenu] = useState(null);
  const openMenu = (id) => setMenu(menu === id ? null : id);
  const toggleIn = (list, set, id) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const facetLabel = (list, all, one, many) =>
    list.length === 0 ? all : list.length === 1 ? one(list[0]) : `${list.length} ${many}`;
  const statusLabel = facetLabel(statusFilter, "All statuses", (id) => id, "statuses");
  const typeLabel = facetLabel(typeFilter, "All types", (id) => ASK_TYPES.find((t) => t.id === id)?.label ?? id, "types");
  const modeLabel = facetLabel(modeFilter, "All modes", (id) => CHANNELS[id]?.label ?? id, "modes");
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const rows = useMemo(
    () =>
      [...campaigns]
        .filter(
          (c) =>
            (statusFilter.length === 0 || statusFilter.includes(c.status)) &&
            (typeFilter.length === 0 || typeFilter.includes(askType(c.config).id)) &&
            (modeFilter.length === 0 || modeFilter.includes(c.config.channel)),
        )
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
            (b.stats?.reviews ?? -1) - (a.stats?.reviews ?? -1),
        ),
    [campaigns, statusFilter, typeFilter, modeFilter],
  );
  const filtered = statusFilter.length > 0 || typeFilter.length > 0 || modeFilter.length > 0;
  const { top, bandRef, headTop } = useStickyTable("get-reviews-page-header");

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
        updated: new Date().toISOString(),
        config: { ...c.config, id: null, permission: false, privacy: false },
      },
      ...ts,
    ]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => "Campaign",
        cell: ({ row }) => {
          const c = row.original;
          if (renameId === c.id) {
            return (
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
            );
          }
          return (
            /* data-bl-link, the shell's link rule (3 Sep): foreground at
               rest, green-700 + underline on hover. The name is the way in;
               a Draft opens in the wizard where it left off, everything else
               opens its page. */
            <button
              type="button"
              data-bl-link=""
              data-hook={`campaign-${c.id}-open`}
              onClick={() => onOpen(c)}
              className="text-left font-medium whitespace-nowrap"
            >
              {c.name}
            </button>
          );
        },
      },
      {
        id: "mode",
        header: () => "Mode",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{CHANNELS[row.original.config.channel]?.label ?? ""}</span>
        ),
      },
      {
        // TYPE, ALONGSIDE MODE (Ali, 7 Sep). The two answer different
        // questions and neither implies the other: Mode is how the invite
        // reaches someone (email, text, link), Type is what it asks them
        // (a score out of ten, stars, thumbs, or straight to a review).
        // Same askLabel the templates table uses, so a campaign and the
        // template it came from read identically.
        id: "type",
        header: () => "Type",
        cell: ({ row }) => <AskType config={row.original.config} />,
      },
      {
        // STATUS SITS BESIDE THE DATE (Ali, 6 Sep). Once the date column
        // lost its per-row verb, "Scheduled" and "Edited" stopped being said
        // anywhere near the date they qualify — a future send date under a
        // column headed Date reads as the past unless the status is next to
        // it.
        accessorKey: "status",
        header: () => "Status",
        cell: ({ row }) => <StatusPill status={row.original.status} hook={`campaign-${row.original.id}-status`} />,
      },
      {
        id: "date",
        header: () => "Date",
        cell: ({ row }) => (
          <span
            className="text-muted-foreground whitespace-nowrap"
            data-hook={`campaign-${row.original.id}-activity`}
          >
            {formatDate(row.original.lastActivity.date)}
          </span>
        ),
      },
      {
        // The one number. No plus sign (3 Sep): reviews gained cannot go the
        // other way, so a sign would be decoration. A Draft has nothing to
        // count, and says so with a dash rather than a zero it did not earn.
        id: "reviews",
        header: () => <span className="block text-right">Reviews gained</span>,
        cell: ({ row }) => (
          <span className="block text-right font-semibold tabular-nums">
            {row.original.stats ? (
              row.original.stats.reviews
            ) : (
              <span className="text-muted-foreground font-normal">—</span>
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex justify-end">
              {/* Same trigger pattern as the old card's menu, which is the one
                  DropdownMenu in this screen that has never blanked the page
                  (see the header note in App). */}
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
                      <X className="size-4" /> {c.status === "Scheduled" ? "Cancel send" : "Stop campaign"}
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
            </div>
          );
        },
      },
    ],
    [renameId, renameValue, onOpen, onNew, onStop, onRestart, onPreview],
  );

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    enablePagination: true,
    pageSize: PAGE_SIZE,
  });

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
            Create your first campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        dataHook="campaigns-table-card"
        className="max-w-none gap-0 overflow-clip p-0"
        density="condensed"
        // ON THE CARD, not on DataTable: DataTable does not forward `style`,
        // so the variable never reached the DOM and every sticky header
        // silently fell back to top:0. Custom properties inherit, so setting
        // it here reaches the <th> just the same.
        style={{ "--th-top": `${headTop}px` }}
      >
        {/* FILTERS AND HEADER IN ONE STICKY GROUP (Ali, 6 Sep: "all table
            headers and filters to be grouped so that they can be sticky just
            like in Review Manager"). The band sticks under the page header;
            the table's own header row then sticks under the BAND, using its
            measured height rather than a guessed one. Scroll nine campaigns
            and the filters and the column labels both stay put. */}
        {/* IDENTICAL TO REVIEW TRACKER (Ali, 7 Sep: "I should be able to
            switch between tracker and builder and the title for each card be
            in the identical position", "so we need the same padding etc").
            Its Review Performance card uses a real CardHeader with
            `-mt-3 rounded-t-[inherit] border-b px-6 pt-4 pb-3` and a
            gridTemplateRows/rowGap override, so those are copied verbatim
            rather than re-derived. My hand-rolled div at px-4 py-2.5 put the
            title 8px left and a few px high of where the Tracker puts it.
            px-6 also matches the table's own cell padding, so the title lines
            up with the column it labels. */}
        {/* THE WRAPPER STICKS, NOT THE CARDHEADER INSIDE IT (Ali, 7 Sep:
            "SEVERE scrolling issue, sticky things all off"). A sticky element
            cannot travel outside its parent's box, and this wrapper used to be
            a plain div exactly one CardHeader tall, so the band had nowhere to
            go and scrolled away while the table header, positioned for a band
            that should have been there, stuck 65px lower with a gap above it.
            Review Manager puts sticky on the measured wrapper; so does this. */}
        <div ref={bandRef} className="bg-card sticky z-30 rounded-t-[inherit]" style={{ top }}>
          <CardHeader
          className="border-b px-6 pt-4 pb-4"
          style={{ gridTemplateRows: "auto", rowGap: 0 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-5">
            {/* COUNT ON THE LEFT, WITH THE TITLE (Ali, 7 Sep: "changing a
                filter janks the page/card header"). It used to sit AFTER the
                two selects, so applying a filter appended text to the end of
                the row and shoved both selects leftwards. Now it is part of
                the left-hand group: the controls are pinned right and never
                move, and the only thing that changes width is the count
                itself, on the side where nothing follows it.
                ALWAYS RENDERED, for the same reason. A count that appears and
                disappears is the jank; one that just changes its wording is
                not. It says "9 campaigns" unfiltered and "5 of 9" when a
                filter is on, so it is never lying about the whole either. */}
            <div className="flex items-baseline gap-2">
              <CardTitle size="small" dataHook="campaigns-title">
                Campaigns
              </CardTitle>
              <span className="text-muted-foreground text-sm" data-hook="campaigns-count">
                {filtered ? `${rows.length} of ${campaigns.length}` : campaigns.length} campaigns
              </span>
            </div>
            <span className="grow" />
            <div className="flex flex-wrap items-center gap-1.5">
              <FacetedFilterMenu
                label={statusLabel}
                open={menu === "status"}
                onOpenChange={() => openMenu("status")}
                options={Object.keys(STATES).map((st) => ({ id: st, label: st }))}
                isAllSelected={statusFilter.length === 0}
                isChecked={(id) => statusFilter.includes(id)}
                onAll={() => setStatusFilter([])}
                onOption={(id) => toggleIn(statusFilter, setStatusFilter, id)}
                allLabel="All statuses"
                panelWidth="w-52"
                align="right"
                dataHook="campaign-status-filter"
              />
              <FacetedFilterMenu
                label={typeLabel}
                open={menu === "type"}
                onOpenChange={() => openMenu("type")}
                options={ASK_TYPES.map((t) => ({
                  id: t.id,
                  label: t.label,
                  leading: <t.Icon className="size-4 shrink-0" aria-hidden="true" />,
                }))}
                isAllSelected={typeFilter.length === 0}
                isChecked={(id) => typeFilter.includes(id)}
                onAll={() => setTypeFilter([])}
                onOption={(id) => toggleIn(typeFilter, setTypeFilter, id)}
                allLabel="All types"
                panelWidth="w-56"
                align="right"
                dataHook="campaign-type-filter"
              />
              <FacetedFilterMenu
                label={modeLabel}
                open={menu === "mode"}
                onOpenChange={() => openMenu("mode")}
                options={Object.values(CHANNELS).map((ch) => ({
                  id: ch.id,
                  label: ch.label,
                  leading: <ch.Icon className="size-4 shrink-0" aria-hidden="true" />,
                }))}
                isAllSelected={modeFilter.length === 0}
                isChecked={(id) => modeFilter.includes(id)}
                onAll={() => setModeFilter([])}
                onOption={(id) => toggleIn(modeFilter, setModeFilter, id)}
                allLabel="All modes"
                panelWidth="w-52"
                align="right"
                dataHook="campaign-mode-filter"
              />
            </div>
          </div>
        </CardHeader>
        </div>

        <DataTable
          table={table}
          dataHook="campaigns-table"
          noResultsMessage="No campaigns match"
          className={TABLE_LOOK}
        />

        {/* ALWAYS SHOWN, even at one page (Ali, 6 Sep: "just leave it there!
            as filtering might add or remove it"). Hiding it below two pages
            is tidier on first paint but makes the bar flicker in and out as
            the reader changes a filter, which is the worse trade. */}
        <div className="bg-card sticky bottom-0 z-10 border-t px-4 py-2">
          <DataTablePagination
            table={table}
            dataHook="campaigns-pagination"
            className="w-auto"
            ariaLabel="Campaign pagination"
            // Same wording as Review Manager. The DS default is "1-9 of 9";
            // two tables in one product should not count rows differently.
            renderRowCount={({ startRow, endRow, totalRows }) =>
              `${startRow} to ${endRow} of ${totalRows}`
            }
          />
        </div>
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

// THE TEMPLATES PAGE. Same anatomy as the campaigns table, minus status and
// the number — a template has neither — plus the two columns a template
// needs: what it asks for and where it came from. Create campaign is a real
// button on the row rather than a menu item, because it is the reason the
// page exists.
function TemplatesPage({ templates, setTemplates, onNew, onEdit }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  // No filter band on this table, so the header row sticks straight under
  // the page header.
  // The band is new here, so this page needs the same three values the
  // campaigns page uses: where the band pins, the ref that measures it, and
  // the resulting offset for the table's own header row.
  const { top, bandRef, headTop } = useStickyTable("get-reviews-page-header");

  const duplicateTemplate = (t) =>
    setTemplates((ts) => [
      ...ts,
      { ...t, id: `t${Date.now()}`, name: `${t.name} (copy)`, updated: new Date().toISOString() },
    ]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => "Template",
        // THE NAME IS THE WAY IN (Ali, 7 Sep: "you can currently edit a
        // template on the live old version, so we should also allow editing
        // templates"). Same affordance the campaigns table uses, so the two
        // lists behave alike rather than one opening on the name and the other
        // hiding its editor in an overflow.
        cell: ({ row }) => (
          <button
            type="button"
            data-hook={`template-${row.original.id}-open`}
            className="font-medium"
            onClick={() => onEdit(row.original)}
          >
            <span data-bl-link>{row.original.name}</span>
          </button>
        ),
      },
      {
        // "Type", not "Ask" (Ali, 7 Sep). The column id follows the header so
        // the next reader is not hunting for a column called something else;
        // nothing referenced the old id. The WIZARD step is still called
        // "ask" and stays that way: capture-states walks campaigns by that
        // step name, and it reads as a verb there rather than a noun.
        id: "type",
        header: () => "Type",
        cell: ({ row }) => <AskType config={row.original.config} />,
      },
      // NO SOURCE COLUMN (Ali, 7 Sep). `source` stays on the record: it still
      // decides whether Delete appears in the row overflow, because a
      // BrightLocal preset cannot be deleted and a user's own duplicate can.
      // It just no longer earns a column. The badge is still shown in the
      // wizard's template picker, where "this one is mine" helps you choose;
      // say the word if that should go too.
      {
        accessorKey: "updated",
        header: () => "Updated",
        // THE DATE, NOTHING ELSE (Ali, 6 Sep). This was a DateStamp: the word
        // "Updated" on every row under a column already headed Updated, plus
        // a dotted underline advertising a tooltip for a date written out in
        // full.
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">{formatDate(row.original.updated)}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* NO PLUS (Ali, 6 Sep). "Create campaign" is already a verb
                  followed by the thing it creates; the icon repeated the
                  verb in a picture. */}
              <Button
                variant="outline"
                size="sm"
                dataHook={`template-${t.id}-create`}
                onClick={() => onNew(t, { fromTemplate: true })}
              >
                Create campaign
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
                  <DropdownMenuItem onSelect={() => onEdit(t)}>
                    <FileText className="size-4" /> Edit template
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => duplicateTemplate(t)}>
                    <Copy className="size-4" /> Duplicate
                  </DropdownMenuItem>
                  {/* Presets cannot be deleted: they are BrightLocal's, and a
                      user who dislikes one can ignore it. A duplicate is
                      theirs and can go. */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setDeleteTarget({ kind: "template", item: t })}>
                    <Trash2 className="size-4" /> Delete template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onNew, onEdit],
  );

  const table = useDataTable({
    columns,
    data: templates,
    getRowId: (row) => row.id,
    enablePagination: true,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <Card
        dataHook="templates-table-card"
        className="max-w-none gap-0 overflow-clip p-0"
        density="condensed"
        style={{ "--th-top": `${headTop}px` }}
      >
        {/* SAME BAND AS CAMPAIGNS, and it is also the corner fix (Ali, 7 Sep:
            "which still has wonky corners"). TABLE_LOOK sets rounded-none on
            the table so its header can sit flush, but with nothing above it
            the table's square top corners rendered inside the card's rounded
            ones. A band on top gives the card a straight edge to meet, and
            overflow-hidden clips whatever still overhangs. */}
        {/* THE WRAPPER STICKS, NOT THE CARDHEADER INSIDE IT (Ali, 7 Sep:
            "SEVERE scrolling issue, sticky things all off"). A sticky element
            cannot travel outside its parent's box, and this wrapper used to be
            a plain div exactly one CardHeader tall, so the band had nowhere to
            go and scrolled away while the table header, positioned for a band
            that should have been there, stuck 65px lower with a gap above it.
            Review Manager puts sticky on the measured wrapper; so does this. */}
        <div ref={bandRef} className="bg-card sticky z-30 rounded-t-[inherit]" style={{ top }}>
          <CardHeader
          className="border-b px-6 pt-4 pb-4"
          style={{ gridTemplateRows: "auto", rowGap: 0 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-5">
            {/* Same shape as the campaigns band: title and count together on
                the left, so the two tables read as one pattern. */}
            <div className="flex items-baseline gap-2">
              <CardTitle size="small" dataHook="templates-title">
                Templates
              </CardTitle>
              <span className="text-muted-foreground text-sm" data-hook="templates-count">
                {templates.length} {templates.length === 1 ? "template" : "templates"}
              </span>
            </div>
          </div>
        </CardHeader>
        </div>
        <DataTable
          table={table}
          dataHook="templates-table"
          noResultsMessage="No templates yet"
          className={TABLE_LOOK}
        />
        {/* ALWAYS SHOWN, even at one page (Ali, 6 Sep: "just leave it there!
            as filtering might add or remove it"). Hiding it below two pages
            is tidier on first paint but makes the bar flicker in and out as
            the reader changes a filter, which is the worse trade. */}
        <div className="bg-card sticky bottom-0 z-10 border-t px-4 py-2">
          <DataTablePagination
            table={table}
            dataHook="templates-pagination"
            className="w-auto"
            ariaLabel="Template pagination"
            // Same wording as Review Manager. The DS default is "1-9 of 9";
            // two tables in one product should not count rows differently.
            renderRowCount={({ startRow, endRow, totalRows }) =>
              `${startRow} to ${endRow} of ${totalRows}`
            }
          />
        </div>
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
// unlike the Review Manager's full-width status strip this is a small
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

// HOISTED TO MODULE SCOPE, AND IT MATTERS (Ali, 7 Sep: "the edit Template name
// freezes after typing one character"). These were declared INSIDE
// CampaignWizard and used as JSX elements. A function declared in a render body
// is a NEW function identity on every render, so React saw <SetupRow> as a
// different component type each keystroke, unmounted the old subtree and
// mounted a fresh one. The input was replaced mid-type, so it lost focus and
// looked frozen. Anything used as <Jsx /> has to be defined once, outside.
// ── SETTINGS PAGE, NOT A WIZARD ──────────────────────────────────
// Ali, 7 Sep: "getting rid of the wizard in a way, so we would present
// defaults, and the user can add or amend those things", and "our edits will
// either be toggles, dropdowns, or sidebars. We can also just move our
// preview to a sidebar entirely."
//
// The wizard asked fourteen questions in a fixed order and gated each one.
// But blankCampaignDraft already holds a working default for every one of
// them, so the campaign was never incomplete: the flow was making people
// re-confirm decisions already made for them. Hence one page, everything
// pre-filled, nothing to complete.
//
// EDIT IN PLACE. A dropdown answers its question where it is asked, so three
// of these four rows never navigate anywhere.
//
// FOUR ROWS (Ali, 7 Sep: "there is just far too much on the page"). It had
// seven and a preview column. The name, what you ask for, how it is sent and
// the review sites are the four Ali named as actually needed; the message
// wording, the reminder and the recipient list all have working defaults and
// belong to the campaign AFTER it exists, not to the act of creating it.
//
// NO PREVIEW HERE (Ali, 7 Sep: "the preview is the last one really"). It
// still lives on the message page, where you are writing the thing it
// previews.
// LABELS SIT AT THE TOP OF THEIR ROW (Ali, 7 Sep: "the Logo label should not
// be centrally aligned, these should all sit at the top of the sections").
// items-start, with the label column padded so its first line centres on a
// 40px control's first line; a tall control (the logo picker, the swatches)
// then grows downwards away from a label that stays put.
function SetupRow({ id, label, hint, children }) {
  return (
    <div
      className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b px-5 py-4 last:border-b-0"
      data-hook={`setup-row-${id}`}
    >
      <div className="w-44 shrink-0 pt-2.5">
        <p className="text-sm leading-5 font-medium">{label}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// A TEMPLATE IS WORDING, so its page is an editor, not a settings list. Two
// decisions at the top (what it is called, what it asks), then a tab per
// surface. Tabs rather than one long form because four surfaces stacked is
// the "far too much on the page" problem again: you are only ever writing
// one of them at a time.
// TWO DECISIONS, NOT ONE DROPDOWN (Ali, 7 Sep: "this just feels like I'm
// having to make a decision. Surely we would have a checkbox or toggle, and
// then we would have What you ask for, which is actually the Rating type").
//
// The single Select had four options, and one of them was not the same KIND
// of thing as the other three: NPS, 5 stars and thumbs are rating types,
// "Review only" is the absence of a rating. Putting them in one list
// made choosing a rating type and choosing whether to rate at all look like
// the same question, which is why the label had to explain itself.
//
// Now: a toggle answers whether, a Select answers which, and the Select is
// simply not there when the answer to whether is no.
function AskRows({ draft, patch }) {
  const rating = draft.ask === "feedback";
  return (
    <>
      <SetupRow
        id="rate-first"
        label="Ask for a rating first"
      >
        {/* THE EXPLANATION SITS WITH THE CONTROL (Ali, 7 Sep: "is it possible
            to move this NEXT to the toggle"). It was a `hint` in the label
            column, which is the narrow one, so a one-line sentence wrapped to
            three while the switch floated alone in a wide empty column. Beside
            the switch it gets the full width and reads as what it is: what
            happens when you turn this on. Same shape as the logo checkbox, so
            the card has one idea of how a toggle explains itself. */}
        <Field orientation="horizontal" dataHook="field-rate-first">
          <Switch
            id="setup-rate-first"
            dataHook="setup-rate-first"
            checked={rating}
            onCheckedChange={(v) => patch({ ask: v ? "feedback" : "review" })}
          />
          <FieldContent>
            <FieldDescription>
              Unhappy feedback comes to you first, not straight to Google.
            </FieldDescription>
          </FieldContent>
        </Field>
      </SetupRow>
      {rating ? (
        <SetupRow id="ask" label="Rating type">
          <Select
            value={draft.feedbackType}
            onValueChange={(v) =>
              patch({ feedbackType: v, feedbackQuestion: FEEDBACK_TYPES[v].question })
            }
          >
            <SelectTrigger dataHook="setup-ask">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(FEEDBACK_TYPES).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SetupRow>
      ) : null}
    </>
  );
}

// A SETTINGS PAGE (Ali, 7 Sep: "it's kind of a wizard but not really, as the
// steps dont need to be done in order. Its essentially like a settings
// page"). So it is built as one: header and footer from the shell, a rail on
// the left, one panel of content on the right. Nothing is sequenced, nothing
// gates anything, and General is the first rail item rather than a card
// floating above the others, because the name and the rating type are
// settings too.
//

function CampaignWizard({
  draft,
  setDraft,
  step,
  setStep,
  history,
  setHistory,
  templates,
  // "campaign" or "template" — App owns it, the wizard only reads it, because
  // App is what decides which of the two you started making.
  setupKind = "campaign",
  // Truthy when amending an existing template, so the primary action can say
  // which of the two it does.
  templateEditId = null,
  onSaveTemplate,
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
  // Which template section the rail is showing. Local to the editor, so it
  // lives here rather than in App: nothing outside this page cares.
  const [beatId, setBeatId] = useState("general");
  // Which section's wording is open for editing in the sheet. null = none.
  const [editingSection, setEditingSection] = useState(null);
  // Which channel the Message preview is showing. Only that section has two.
  const [previewChannel, setPreviewChannel] = useState("email");
  // Below sm a right-hand panel leaves nothing to read beside it, so the sheet
  // comes up from the bottom instead. Same breakpoint as Review Manager.
  const [sheetNarrow, setSheetNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheetNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // Below md the template rail stacks above the card, so a footer with
  // Back / Next walks the sections (Ali, 7 Sep: "we might have a footer for
  // forward and back on tablets and mobiles"). From md up the settings pages
  // have no footer at all; Save and Close live in the page header.
  // "Tablets and mobiles" is below lg (1023px and under), not below md: a
  // 768px tablet keeps the rail beside the card but still gets the footer,
  // as asked. Desktop (lg and up) has no footer.
  const [narrowShell, setNarrowShell] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setNarrowShell(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // The template editor's sections, computed once here so the rail and the
  // narrow footer's Back / Next walk the same list.
  const templateSections = [
    { id: "general", rail: "General", sub: "Name, rating and branding", Icon: FileText },
    ...TEMPLATE_BEATS.filter((x) => !x.when || x.when(draft)),
  ];
  const activeBeatId = templateSections.some((x) => x.id === beatId) ? beatId : templateSections[0].id;

  const flow = buildFlow(draft);
  const flowIndex = flow.indexOf(step);
  const patch = (p) => {
    setDraft((d) => ({ ...d, ...p }));
    setError("");
  };

  const balance = STARTING_CREDITS + creditsBought;
  // COST FOLLOWS THE AUDIENCE. Texting one person costs one person's credits;
  // charging for 112 because the seed says so would be a lie on the one screen
  // where the number is the decision.
  const sendCount = recipientsOf(draft);
  const smsCost = sendCount * (CREDIT_RATES[draft.country] ?? 2);
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
  // A rail click on an EARLIER step: back to it, and the history is cut to
  // where that step sat, so Back from there keeps working.
  const jumpBack = (id) => {
    setHistory((h) => {
      const at = h.indexOf(id);
      return at >= 0 ? h.slice(0, at) : h;
    });
    setStep(id);
    setError("");
    setPreviewIndex(0);
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
      if (draft.audience === "one") {
        if (!draft.oneContact.trim())
          return draft.channel === "sms"
            ? "Enter the phone number to text."
            : "Enter the email address to send to.";
      } else if (!uploaded) return "Upload a CSV file to continue.";
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
        // The reminder is the message again, so it seeds from the message.
        // No separate SMS line: without reminderSmsOverride the text version
        // reads this, which is the whole point of writing it once.
        reminderBody: draft.body,
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
    if (id === "contact") return <ContactPreview config={draft} business={business} />;
    return (
      <CustomerPage
        page={id === "feedback" ? "feedback" : "review"}
        config={draft}
        interactive={false}
        rating={sampleRating(draft)}
        setRating={() => {}}
        comment=""
        setComment={() => {}}
        consent={false}
        setConsent={() => {}}
        onSubmit={() => {}}
      />
    );
  }

  // THE PAGE THE PRODUCT NEVER PREVIEWED. Link Mode's contact form exists in
  // legacy but had no preview here, so its wording could be edited blind.
  function ContactPreview({ config, business }) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        {/* SQUARE, LIKE THE REAL THING. A Google Business Profile logo is 1:1
            (720x720 recommended, 250x250 minimum), so a preview that renders
            the business NAME as text is not previewing a logo at all, and the
            layout it produces is not the layout people will get. Same mark the
            other customer pages draw. */}
        {config.logo ? (
          <div className="flex flex-col items-center gap-2" data-hook="contact-logo">
            <div className="bg-primary/10 flex size-12 items-center justify-center rounded-md">
              <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
                <circle cx="16" cy="16" r="15" className="fill-primary" />
              </svg>
            </div>
            <p className="text-base font-semibold">{business}</p>
          </div>
        ) : null}
        <p className="text-muted-foreground max-w-sm text-sm">
          {resolveVars(config.contactIntro, business)}
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3 text-left">
          <Field dataHook="contact-preview-name">
            <FieldLabel htmlFor="contact-preview-name-input">Your name</FieldLabel>
            <Input id="contact-preview-name-input" dataHook="contact-name" value="" readOnly />
          </Field>
          <Field dataHook="contact-preview-email">
            <FieldLabel htmlFor="contact-preview-email-input">Your email address</FieldLabel>
            <Input id="contact-preview-email-input" dataHook="contact-email" value="" readOnly />
          </Field>
          {config.consent ? (
            <Field orientation="horizontal" dataHook="contact-preview-consent">
              <Checkbox id="contact-preview-consent-box" dataHook="contact-consent" checked={false} />
              <FieldContent>
                <FieldLabel htmlFor="contact-preview-consent-box">
                  {resolveVars(config.consentLabel, business)}
                </FieldLabel>
              </FieldContent>
            </Field>
          ) : null}
        </div>
        <Button variant="primary" dataHook="contact-preview-next">
          Next
        </Button>
      </div>
    );
  }

  // ONE RENDERER (Ali, 7 Sep: "I just want to make sure when we show a preview
  // it is always rendered the same"). This used to be a second copy of
  // renderPageById, and the two had already drifted: renderPageById gained the
  // contact-details page and this one never did, so the same page previewed
  // differently depending on which surface asked for it. Now it only decides
  // WHICH page and WHETHER it is the reminder; what a page looks like is
  // renderPageById's job alone.
  function renderPreviewBody() {
    return renderPageById(activePreview.id, step === "reminder-design");
  }

  /* -- step bodies -------------------------------------------------------- */
  function TemplateBody() {
    const sections = templateSections;
    // Fall back when the active section disappears: turning the rating off
    // removes its section while you are standing in it (activeBeatId).
    const activeId = activeBeatId;
    const active = sections.find((x) => x.id === activeId);

    // minmax(0,1fr) below md too: a single auto column takes the card's
    // min-content, and a preview inside it can force the page to scroll
    // sideways on a phone (found on Review Showcase, 7 Sep).
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        {/* PLAIN BUTTONS, NOT THE DS SIDEBAR (Ali, 7 Sep: "sidebar content
            seems to be fixed"). SidebarMenuButton is app-chrome machinery: it
            requires a SidebarProvider, and that provider ships its own wrapper
            with `min-h-svh w-full` plus positioning meant for a fixed app
            sidebar. Inside a page that already scrolls, that fought the layout
            rather than serving it, and it blanked the page outright when the
            provider was missing.
            So this keeps what was wanted from it, an icon, a label, subtext and
            an active state, and drops what belongs to the app frame. It carries
            tablist semantics so it is still navigable by keyboard. */}
        {/* STICKY (Ali, 7 Sep: "left rail should be sticky"). The shell's content
                    area is the scroller and the header sits outside it, so top-0 pins
                    the rail flush under the header while the cards scroll past.
                    self-start stops the grid stretching it to the card's height, which
                    would leave nothing for sticky to do. md only: below that the rail
                    stacks above the card and should scroll away with it. */}
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Template sections"
          className="flex flex-col gap-1 md:sticky md:top-0 md:self-start"
          data-hook="template-rail"
        >
          {sections.map((x) => {
            const on = x.id === activeId;
            return (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={on}
                data-hook={`template-tab-${x.id}`}
                onClick={() => setBeatId(x.id)}
                className={`flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors ${
                  on ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <x.Icon className={`mt-0.5 size-4 shrink-0 ${on ? "" : "text-muted-foreground"}`} />
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate text-sm ${on ? "font-medium" : ""}`}>{x.rail}</span>
                  <span className="text-muted-foreground truncate text-xs">{x.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        {activeId === "general" ? (
          <Card dataHook="template-basics" className="max-w-none overflow-hidden py-0" density="condensed">
            <CardContent className="flex flex-col gap-0 p-0">
              <SetupRow id="name" label="Template name">
                <Input
                  dataHook="setup-name"
                  value={draft.name}
                  placeholder="Untitled template"
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </SetupRow>
              <AskRows draft={draft} patch={patch} />
              {/* THE LOGO ROW, THIRD ATTEMPT (Ali, 7 Sep: "that whole logo
                  area is frustrating me"). It has been an on/off switch, then a
                  checkbox plus a text link, and both were asking a question
                  nobody has: everyone wants their logo, the only variable is
                  where it comes from.
                  So: the Google Business Profile image IS the default and shows
                  itself. One checkbox opts into uploading instead, and ticking
                  it reveals the dropzone. No link dressed as a control.
                  NO DS DROPZONE EXISTS — its component meta lists seven
                  components and none handle files. shadcn ships one now
                  (`npx shadcn add file-upload`) but a new npm import needs a
                  registry entry and the panel renderer blocks network, so this
                  follows the same shape the CSV step already uses on this
                  screen: dashed border, icon, one line of guidance. Worth
                  promoting to the registry once it has earned it. */}
              {/* NOTHING APPEARS OR DISAPPEARS (Ali, 7 Sep: "when we tap
                  upload a logo we still want to show the GBP logo, just faded
                  out. I dont really want things appearing and dissapearing").
                  Both options are always on the page; the checkbox decides
                  which is LIVE and the other fades. The row is therefore the
                  same height whatever you pick, so ticking the box changes an
                  emphasis rather than reflowing the card.
                  The faded one is also aria-hidden and the dropzone is
                  genuinely `disabled`, so "faded" is not just a look: it is out
                  of the tab order too, and nobody can drop a file onto an
                  option they have not chosen. */}
              <SetupRow id="logo" label="Logo">
                <div className="flex flex-col gap-3">
                  <div
                    className={`flex items-center gap-3 transition-opacity ${
                      draft.logoSource === "google" ? "" : "opacity-40"
                    }`}
                    aria-hidden={draft.logoSource !== "google"}
                  >
                    <div
                      className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-md"
                      data-hook="setup-logo-thumb"
                    >
                      <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
                        <circle cx="16" cy="16" r="15" className="fill-primary" />
                      </svg>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm">
                      <GoogleOriginal className="size-4" />
                      From your Google Business Profile
                    </span>
                  </div>

                  <Field orientation="horizontal" dataHook="field-logo-upload">
                    <Checkbox
                      id="setup-logo-upload-toggle"
                      dataHook="setup-logo-upload-toggle"
                      checked={draft.logoSource === "upload"}
                      onCheckedChange={(v) => patch({ logoSource: v ? "upload" : "google" })}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="setup-logo-upload-toggle">Upload a logo</FieldLabel>
                    </FieldContent>
                  </Field>

                  <div className={draft.logoSource === "upload" ? "" : "opacity-40"}>
                    <Dropzone
                      dataHook="setup-logo-dropzone"
                      disabled={draft.logoSource !== "upload"}
                      label="Drop your logo here, or choose a file"
                      hint="Square. 720 by 720 recommended, 250 minimum. JPG or PNG."
                    />
                  </div>
                </div>
              </SetupRow>
              <SetupRow id="brand" label="Accent colour">
                <BrandPicker value={draft.brandColor} onChange={(v) => patch({ brandColor: v })} />
              </SetupRow>
            </CardContent>
          </Card>
        ) : (
          /* PREVIEW FIRST, EDIT IN A SHEET (Ali, 7 Sep: "I'm almost thinking we
             lead with preview for each section, and have an edit which opens up
             a sheet"). The panel shows what the customer will actually see, so
             the page reads as the thing being made rather than as a form that
             describes it. Editing is then a deliberate act in a side panel,
             and the preview stays visible behind it. */
          <Card className="max-w-none" dataHook={`template-panel-${active.id}`}>
            <CardHeader>
              <CardTitle>{active.rail}</CardTitle>
              <CardDescription>{active.hint}</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  dataHook={`template-edit-${active.id}`}
                  onClick={() => setEditingSection(active.id)}
                >
                  Edit
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* BOTH CHANNELS, BECAUSE THE TEMPLATE WRITES FOR BOTH (Ali,
                  7 Sep: "we are also missing SMS text in here somewhere"). The
                  Message section only previewed the email, so the text version,
                  which is the same message unless you overrode it, could not be
                  seen at all. A template has no channel, so its preview cannot
                  pick one either. */}
              {active.preview.length > 1 ? (
                <div className="flex items-center gap-1" data-hook="preview-channel">
                  {active.preview.map((id) => (
                    <Button
                      key={id}
                      size="sm"
                      variant={id === previewChannel ? "secondary" : "ghost"}
                      dataHook={`preview-channel-${id}`}
                      onClick={() => setPreviewChannel(id)}
                    >
                      {id === "email" ? "Email" : "Text message"}
                    </Button>
                  ))}
                </div>
              ) : null}
              {/* A PREVIEW HAS TO LOOK LIKE ONE (Ali, 7 Sep: "previews need to
                  be differentiated, and will generally need to be obvious that
                  they are actually a preview. So I'm wondering if we do
                  something with the border").
                  Two surfaces, and the distinction is the whole point:
                  the OUTER one is ours, a dashed border on a muted ground with
                  a label, and it says "this is a representation".
                  the INNER one is theirs, and it is WHITE, because that is what
                  the page actually is. It used to render straight onto
                  bg-muted/30, which tinted a page that is not tinted and left
                  nothing to mark it as a preview. If backgrounds ever become
                  something people choose, this inner surface is the one thing
                  that changes. */}
              {/* PreviewFrame from the registry now (7 Sep); the comment above
                  is its origin story. */}
              <PreviewFrame dataHook={`preview-frame-${active.id}`}>
                {renderPageById(
                  active.preview.includes(previewChannel) ? previewChannel : active.preview[0],
                )}
              </PreviewFrame>
              {active.note ? (
                <p className="text-muted-foreground text-xs" data-hook={`preview-note-${active.id}`}>
                  {active.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ONE SHEET, DRIVEN BY WHICH SECTION IS OPEN. A drawer per section would be
  // four copies of the same field loop.
  //
  // NOTE FOR LATER (Ali, 7 Sep): the previews should themselves become shared
  // components, so the editor and the real customer pages render from one
  // source instead of two that can drift. Not now, we are riffing.
  function SectionSheet() {
    const section = TEMPLATE_BEATS.find((x) => x.id === editingSection);
    if (!section) return null;
    // COPIED FROM REVIEW MANAGER'S DRAWER, not re-derived (Ali, 7 Sep: "we
    // have fixed this in the Review Manager"). Every correction below was
    // already made there and I rediscovered them one at a time, which was
    // wasted effort: DrawerHeader, DrawerBody and DrawerFooter all ship
    // `mx-auto w-full max-w-sm` and phone-shaped padding, so all three need the
    // same three overrides, and the body additionally needs
    // `min-h-0 grow overflow-y-auto` or the header and footer do not pin.
    // If a third right-hand drawer appears, lift this into the registry rather
    // than copying it a third time.
    //
    // SAME SHEET AS THE INBOX (Ali, 7 Sep: "when I say sheet I mean like the
    // sheet we use in the inbox, so slide from the right hand side"). It was
    // defaulting to the bottom because Drawer takes a `direction` and I had not
    // passed one. Review Manager's rule, copied rather than reinvented:
    // right-hand from sm up, bottom on a phone where a side panel would leave
    // no room to read, and the same width clamp so the two panels read as the
    // same object on both screens.
    return (
      <Drawer
        open
        onOpenChange={(o) => !o && setEditingSection(null)}
        direction={sheetNarrow ? "bottom" : "right"}
      >
        {/* THE SHEET IS A PORTAL, so it renders on document.body, OUTSIDE
            [data-hook="campaign-wizard-layout"] where WIZARD_TYPE_SCALE sets
            inputs to 13px. That is why the sheet's fields came out a size
            larger than the same fields on the page (Ali, 7 Sep: "the size of
            the text inputs varies"). Same rule, re-scoped to the sheet. */}
        <style>{`
          [data-hook="section-sheet"] [data-slot="input"],
          [data-hook="section-sheet"] [data-slot="textarea"],
          [data-hook="section-sheet"] [data-slot="select-trigger"],
          [data-hook="section-sheet"] [data-slot="select-value"] {
            font-size: 0.8125rem;
            line-height: 1.125rem;
          }
        `}</style>
        <DrawerContent
          dataHook="section-sheet"
          className={`flex flex-col ${sheetNarrow ? "" : "h-full"} data-[vaul-drawer-direction=right]:sm:w-[clamp(24rem,65vw,40rem)] data-[vaul-drawer-direction=right]:lg:w-[clamp(24rem,50vw,40rem)] data-[vaul-drawer-direction=right]:sm:max-w-[40rem]`}
          style={sheetNarrow ? { marginTop: 0, maxHeight: "92svh" } : undefined}
        >
          {/* Title only, no hint (Ali, 7 Sep: "drop the descriptions in the
              review template drawers, looks crap"). The hint lives in the
              rail under the section name; here it was a cramped second line. */}
          <SideSheetHeader title={section.rail} dataHook="section-sheet-header" closeHook="section-sheet-close" />
          <DrawerBody
            className="mx-0 mt-0 flex min-h-0 max-w-none grow flex-col gap-5 overflow-y-auto px-4 py-4"
            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
          >
            {section.groups.map((group, gi) => (
              <div key={group.label ?? gi} className="flex flex-col gap-4">
                {group.label ? <p className="text-sm font-medium">{group.label}</p> : null}
                {group.fields.filter((f) => !f.when || f.when(draft)).map((f) =>
                  f.kind === "switch" ? (
                    <Field key={f.key} orientation="horizontal" dataHook={`field-${f.key}`}>
                      <Switch
                        id={`tpl-${f.key}`}
                        dataHook={`template-${f.key}`}
                        checked={!!draft[f.key]}
                        onCheckedChange={(v) => patch({ [f.key]: v })}
                      />
                      <FieldContent>
                        <FieldLabel htmlFor={`tpl-${f.key}`}>{f.label}</FieldLabel>
                        {f.desc ? <FieldDescription>{f.desc}</FieldDescription> : null}
                      </FieldContent>
                    </Field>
                  ) : (
                    <Field key={f.key} dataHook={`field-${f.key}`}>
                      <FieldLabel htmlFor={`tpl-${f.key}`}>{f.label}</FieldLabel>
                      {f.kind === "textarea" ? (
                        <Textarea
                          id={`tpl-${f.key}`}
                          dataHook={`template-${f.key}`}
                          rows={f.rows ?? 3}
                          value={draft[f.key] ?? ""}
                          onChange={(e) => patch({ [f.key]: e.target.value })}
                        />
                      ) : (
                        <Input
                          id={`tpl-${f.key}`}
                          dataHook={`template-${f.key}`}
                          value={draft[f.key] ?? ""}
                          onChange={(e) => patch({ [f.key]: e.target.value })}
                        />
                      )}
                      {f.desc ? <FieldDescription>{f.desc}</FieldDescription> : null}
                    </Field>
                  ),
                )}
              </div>
            ))}
          </DrawerBody>
          {/* THE DS FOOTER IS BUILT FOR A BOTTOM DRAWER. It ships
              `mx-auto mt-auto w-full max-w-sm flex-col`, which centres itself at
              384px and stretches its children full width. In a right-hand sheet
              that produced a 352px green slab floating in the middle of an empty
              900px column. Review Manager's own drawer overrides the same three
              things, so this copies it rather than inventing a fourth idea:
              a bordered row, contents to the right, normal-width button. */}
          <DrawerFooter className="mx-0 max-w-none flex-row items-center justify-end gap-2 border-t p-4">
            {/* Edits are live, so this only dismisses. The preview behind has
                already moved. */}
            <Button variant="primary" dataHook="section-sheet-done" onClick={() => setEditingSection(null)}>
              Done
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  function SetupBody() {
    const chosen = (draft.sites ?? []).filter((x) => x.site);
    return (
      <Card dataHook="setup-card" className="max-w-none overflow-hidden py-0" density="condensed">
        <CardContent className="flex flex-col gap-0 p-0">
          <SetupRow id="name" label="Campaign name">
            <Input
              dataHook="setup-name"
              value={draft.name}
              placeholder="Untitled campaign"
              onChange={(e) => patch({ name: e.target.value })}
            />
          </SetupRow>

          <AskRows draft={draft} patch={patch} />

          <SetupRow id="channel" label="How it is sent">
            <Select value={draft.channel} onValueChange={(v) => patch({ channel: v })}>
              <SelectTrigger dataHook="setup-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CHANNELS).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SetupRow>

          {/* THE ONE ROW THAT STILL NAVIGATES. Sites are not a choice from a
              list, they each need a URL, so this is authoring rather than
              amending and it earns its own page. */}
          <SetupRow id="sites" label="Review sites">
            <div className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {chosen.length ? (
                  chosen.map((x) => {
                    const site = siteById(x.site);
                    return (
                      <Badge key={x.site} variant="secondary" dataHook={`setup-site-${x.site}`}>
                        <site.Icon className="size-3.5" /> {site.label}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground text-sm">None chosen</span>
                )}
              </span>
              <Button variant="outline" size="sm" dataHook="setup-edit-sites" onClick={() => setStep("sites")}>
                Edit
              </Button>
            </div>
          </SetupRow>
        </CardContent>
      </Card>
    );
  }

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
                    caption: "A ready-made template, or one you saved from a campaign of your own.",
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
                  {/* The ask only: a template no longer states a mode. */}
                  <AskType config={t.config} className="hidden text-xs sm:block" />
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
              specifies a branding model for Review Builder, so this is the smallest one that stops the
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
          <PreviewFrame dataHook="preview-frame-feedback" surface="none">
            <DeviceFrame device="desktop">
              <CustomerPage
                page="feedback"
                config={draft}
                interactive={false}
                rating={sampleRating(draft)}
                setRating={() => {}}
                comment=""
                setComment={() => {}}
                consent={false}
                setConsent={() => {}}
                onSubmit={() => {}}
              />
            </DeviceFrame>
          </PreviewFrame>
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
      const text = smsBodyOf(draft, isReminder);
      // Typing in the SMS step is itself a decision to use different wording,
      // so it turns the override on rather than silently editing a field the
      // template is not reading.
      const setText = (v) =>
        patch(
          isReminder
            ? { reminderSms: v, reminderSmsOverride: true }
            : { smsText: v, smsOverride: true },
        );
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
                  {/* MARKS IN THE MENU AND ON THE TRIGGER (Ali, 6 Sep).
                      Every one of these four is a logo people recognise
                      faster than its name, and the customer's review page
                      shows the same marks on its buttons — so picking one
                      here should look like the thing it produces. */}
                  <SelectTrigger dataHook={`site-${i}-select`}>
                    <SelectValue placeholder="Review site">
                      <span className="flex items-center gap-2">
                        {(() => {
                          const S = siteById(row.site).Icon;
                          return S ? <S className="size-4 shrink-0" /> : null;
                        })()}
                        {siteById(row.site).label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SITES.filter((s) => s.id === row.site || !used.includes(s.id)).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <s.Icon className="size-4 shrink-0" />
                          {s.label}
                        </span>
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

          <Field dataHook="audience-field">
            <FieldLabel htmlFor="audience-one" dataHook="audience-label">
              Who to ask
            </FieldLabel>
            <ChoiceCards
              name="audience"
              value={draft.audience}
              onChange={(v) => patch({ audience: v })}
              columns={2}
              options={[
                {
                  id: "one",
                  label: "One person",
                  caption: draft.channel === "sms" ? "A single phone number" : "A single email address",
                },
                { id: "list", label: "A list", caption: "Upload a CSV" },
              ]}
            />
          </Field>

          {draft.audience === "one" ? (
            <Field dataHook="one-contact-field">
              <FieldLabel htmlFor="one-contact" dataHook="one-contact-label">
                {draft.channel === "sms" ? "Phone number" : "Email address"}
              </FieldLabel>
              <Input
                id="one-contact"
                dataHook="one-contact"
                value={draft.oneContact}
                placeholder={draft.channel === "sms" ? "07700 900123" : "name@example.com"}
                onChange={(e) => patch({ oneContact: e.target.value })}
              />
              <FieldDescription dataHook="one-contact-desc">
                {/* No column mapping either: there are no columns to map, which
                    is why the wizard skips that step entirely for one person. */}
                Goes to this one person. Nothing to upload and no columns to map.
              </FieldDescription>
            </Field>
          ) : (
          <Field dataHook="contacts-field">
            <FieldLabel htmlFor="contacts-upload" dataHook="contacts-label">
              Contact list
            </FieldLabel>
            <FieldDescription dataHook="contacts-desc">
              Upload a CSV of the people you would like to ask.
            </FieldDescription>
            <Dropzone
              dataHook="contacts-upload"
              value={uploaded ? "customers.csv" : undefined}
              meta="120 rows"
              label="Drop your CSV here, or choose a file"
              hint="One row per person, with a header row"
              Icon={uploaded ? FileText : undefined}
              onSelect={() => setUploaded(true)}
            />
          </Field>
          )}
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
              {sendCount === 1 ? "1 person" : `${sendCount} people`} will get this {draft.channel === "sms" ? "text" : "email"}
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
                description={`This send needs ${smsCost.toLocaleString()} credits and you have ${balance.toLocaleString()}. That is ${sendCount} people at ${CREDIT_RATES[draft.country] ?? 2} credits each for ${draft.country}.`}
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
              { k: "To", v: draft.audience === "one" ? draft.oneContact || "one person" : `${RECIPIENT_COUNT} people, from customers.csv` },
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
  // A standing campaign is published, not sent, so the primary action differs.
  const standingNow = isStanding(draft.channel);

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
  // TWO FOOTERS, BECAUSE THERE ARE TWO KINDS OF PAGE NOW. The settings page
  // carries its own actions inside the card, so the shell footer is empty
  // there; a single-choice page gets Cancel and Done, and Done just returns
  // to the settings page. No Next, because nothing follows.
  // A send step is part of a sequence and keeps Back/Next; a settings spoke is
  // one choice and keeps Cancel/Done. Same shell, two different jobs.
  const onSendPath = ["recipients", "columns", "check", "send", "golive"].includes(step);
  // THE SETTINGS PAGES' ACTIONS LIVE IN THE PAGE HEADER (Ali, 7 Sep: "reuse
  // the page header component entirely, and put our Save button in the top
  // right, as well as a cancel or close button icon, therefore stopping the
  // need for a footer"). Two controls: the primary (Save template / Save
  // changes, or Review and send / Go live for a campaign, exactly what the
  // footer said) and an icon-only secondary Close (Ali: "can we make the close
  // button secondary?") that does what Cancel did. No
  // size passed: PageHeader sizes its actions itself. ENABLED FROM THE FIRST
  // RENDER: every setting already holds a working value, which is the point.
  // ONE HEADER SHAPE ON EVERY PAGE OF THIS FLOW (Ali, 8 Sep: "it doesn't
  // look like it is the correct page header", "the header is weirdly
  // mixed"). The settings pages carried the real PageHeader while the send
  // path (recipients, columns, check, send, go live) still used the shell's
  // own title block, so the header changed shape halfway through. Every page
  // now renders PageHeader with the same trail, help icon and date; the
  // settings pages add Save, the sequence pages just Close, and the sequence
  // keeps its Back / Next footer because it is a sequence.
  const trail = [
    { label: "All Locations", goto: "screen:dmrotrgstba3l" },
    { bind: "location", goto: "screen:dmrurue2wmp9u" },
    { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
    { label: "Review Builder", onClick: () => setCancelConfirm(true) },
  ];
  const closeAction = (
    <Button variant="secondary" iconOnly dataHook="step-close" aria-label="Close" onClick={() => setCancelConfirm(true)}>
      <X className="size-4" />
    </Button>
  );
  const setupActions = (
    <>
      {setupKind === "template" ? (
        <Button variant="primary" dataHook="setup-save-template" onClick={onSaveTemplate}>
          {templateEditId ? "Save changes" : "Save template"}
        </Button>
      ) : (
        <Button variant="primary" dataHook="setup-create" onClick={() => go(standingNow ? "golive" : "recipients")}>
          {standingNow ? "Go live" : "Review and send"}
        </Button>
      )}
      <Button variant="secondary" iconOnly dataHook="setup-cancel" aria-label="Close" onClick={() => setCancelConfirm(true)}>
        <X className="size-4" />
      </Button>
    </>
  );
  // BELOW lg ONLY, and only where there is a rail to walk (the template
  // editor): Back and Next step through the sections, disabled at the ends.
  // The campaign settings page is one card with no sections, so it has no
  // footer at any width. From lg up neither page renders one.
  const beatIndex = templateSections.findIndex((s) => s.id === activeBeatId);
  const setupFooter =
    narrowShell && setupKind === "template" ? (
      <>
        <Button
          variant="outline"
          dataHook="template-prev-section"
          disabled={beatIndex <= 0}
          onClick={() => setBeatId(templateSections[beatIndex - 1].id)}
        >
          Back
        </Button>
        <span className="grow" />
        <Button
          variant="ghost"
          dataHook="template-next-section"
          disabled={beatIndex >= templateSections.length - 1}
          onClick={() => setBeatId(templateSections[beatIndex + 1].id)}
        >
          Next
        </Button>
      </>
    ) : undefined;
  // THE SEND PATH READS LIKE THE SETTINGS PAGES (Ali, 8 Sep): its primary
  // (Next / Confirm / Send now / Put live / Launch kiosk, exactly the label
  // the footer used) sits in the header beside Close, and its rail lists the
  // steps of THIS campaign's path. From lg up there is no footer; below lg,
  // Back and Next step the sequence and the primary stays in the header.
  const sendSteps = sendRailSteps(flow, draft);
  const lastSendStep = step === "send" || step === "golive";
  const sendActions = (
    <>
      <Button variant="primary" dataHook="wizard-next" onClick={next}>
        {continueLabel}
      </Button>
      {closeAction}
    </>
  );
  const sendFooter = narrowShell ? (
    <>
      <Button variant="outline" dataHook="wizard-back" disabled={history.length === 0} onClick={goBack}>
        Back
      </Button>
      <span className="grow" />
      <Button variant="ghost" dataHook="wizard-next-footer" disabled={lastSendStep} onClick={next}>
        Next
      </Button>
    </>
  ) : undefined;
  const footer =
    step === "setup" ? (
      setupFooter
    ) : onSendPath ? (
      sendFooter
    ) : (
      <>
        <Button variant="ghost" dataHook="wizard-cancel" onClick={() => setStep("setup")}>
          Cancel
        </Button>
        <span className="grow" />
        <Button variant="primary" dataHook="wizard-done" onClick={() => setStep("setup")}>
          Done
        </Button>
      </>
    );

  // NO RAIL (steps={null}). A rail counts steps, and there are no steps to
  // count now; the settings page shows every setting at once. Kept off the
  // single-choice pages too, where it would imply they sit inside a sequence.
  return (
    <WizardShell
      dataHook="campaign-wizard"
      title={draft.name?.trim() || (setupKind === "template" ? "Untitled template" : "Untitled campaign")}
      description={
        setupKind === "template"
          ? "A starting point you can make campaigns from"
          : "Set up a campaign to ask your customers for reviews"
      }
      header={
        setupKind === "template" ? (
          // NOTE: `status` stays at its default true. The description and the
          // lastUpdated stamp both render in the status row, so switching it
          // off hid the two things this header exists for. On the settings
          // page the header also carries Save and Close (setupActions).
          <PageHeader
            dataHook="template-page-header"
            breadcrumbs={trail}
            title="Review template"
            description={draft.name?.trim() || "Untitled template"}
            lastUpdated="auto"
            actions={step === "setup" ? setupActions : undefined}
          />
        ) : step === "setup" ? (
          // THE CAMPAIGN SETTINGS PAGE GETS THE SAME PageHeader as the template
          // editor now (Ali, 7 Sep), so its actions have a top right to live
          // in. Same shape: the kind of thing as the title, the campaign's own
          // name as the description, the date on the right.
          <PageHeader
            dataHook="campaign-page-header"
            breadcrumbs={trail}
            title="Review campaign"
            description={draft.name?.trim() || "Untitled campaign"}
            lastUpdated="auto"
            actions={setupActions}
          />
        ) : (
          <PageHeader
            dataHook="step-page-header"
            breadcrumbs={trail}
            title="Review campaign"
            description={draft.name?.trim() || "Untitled campaign"}
            lastUpdated="auto"
            actions={onSendPath ? sendActions : closeAction}
          />
        )
      }
      steps={null}
      footer={footer}
      // The send path shows its validation as an Alert at the top of the
      // step card (see below); the shell's slot is kept for the spokes.
      error={onSendPath ? undefined : error}
      contentClassName={step === "setup" || onSendPath ? "pt-6!" : undefined}
    >
      {step === "setup" ? (
        <div className="flex flex-col gap-4">
          {setupKind === "template" ? TemplateBody() : SetupBody()}
          {setupKind === "template" ? SectionSheet() : null}
          {/* "Start from a template" used to sit in the footer beside Cancel.
              The header holds two controls and no more, so it sits under the
              settings card instead, a ghost as before. ASSUMPTION: Ali may
              want this elsewhere (the templates page already offers the same
              route). */}
          {setupKind === "template" ? null : (
            <div>
              <Button variant="ghost" dataHook="setup-template" onClick={() => setStep("template")}>
                Start from a template
              </Button>
            </div>
          )}
        </div>
      ) : (
      /* RAIL + CARD on the send path, the settings pages' grid (16rem + the
         rest, in the shell's own centred column; nothing about the shell's
         widths changes). Other steps keep the card alone. */
      <div className={onSendPath ? "grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[16rem_minmax(0,1fr)]" : "contents"}>
      {onSendPath ? (
        <SequenceRail
          steps={sendSteps}
          activeId={step}
          ariaLabel="Campaign steps"
          hook="send-rail"
          onSelect={(id) => (id === "setup" ? setStep("setup") : jumpBack(id))}
        />
      ) : null}
      <Card dataHook="wizard-card" className="min-w-0 max-w-none">
        <CardHeader>
          <CardTitle dataHook="wizard-step-title">{copy.title}</CardTitle>
          {copy.sub ? (
            <CardDescription dataHook="wizard-step-sub">{copy.sub}</CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* VALIDATION AT THE TOP OF THE CARD, as the Showcase's Reviews
              card does it: the DS warning Alert with a title and the exact
              sentence the footer slot used to show. */}
          {onSendPath && error ? (
            <AlertWarning dataHook="step-issue" title="Before you continue" description={error} />
          ) : null}
          {splitStep ? (
            /* With the rail beside it the card is a column narrower, so the
               send and go-live summaries STACK above their contact sheet
               rather than splitting at lg into two columns too narrow to read. */
            <div className={onSendPath ? "flex flex-col gap-6" : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]"}>
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
      </div>
      )}

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
              {draft.channel === "sms" ? "Text" : "Email"} {sendCount === 1 ? "1 person" : `${sendCount} people`}?
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
          {kiosk ? "Your kiosk is live" : standing ? "Your campaign is live" : `Sending to ${sendCount === 1 ? "1 person" : `${sendCount} people`}`}
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
            Back to Review Builder
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

  // STEP NAMES AND TOOLTIPS FROM LEGACY (Ali, 6 Sep). Each step says what
  // it counts, because "Opened" on its own could mean the email or the
  // feedback page, and "Left rating" could mean left a public review.
  // Every one of them counts RECIPIENTS, which is the thing the tooltips
  // make explicit and the numbers alone do not.
  const funnel = [
    { k: "Sent", v: stats.sent ?? 0, info: "The number of recipients this campaign was sent to" },
    { k: "Opened", v: stats.opened ?? 0, info: "The number of recipients that opened the campaign" },
    { k: "Left rating", v: stats.rated ?? 0, info: "The number of recipients that left a rating" },
    {
      k: "Visited Review Site",
      v: stats.visited ?? 0,
      info: "The number of recipients that visited a review site",
    },
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
              {/* JUST THE FUNNEL (Ali, 6 Sep: "we wouldn't have a
                  conversion donut RAG next to it, just the funnel"). The
                  gauge that sat here read the funnel's last step over its
                  first and passed a red/amber/green judgement on it — a
                  second opinion about a number the funnel already shows,
                  taking half the row to say it. NPS keeps its own dial in
                  its own card, which is a different measurement of a
                  different thing. */}
              <div>
                <div className="min-w-0">
                  <p className="mb-3 text-sm font-medium" data-hook="insights-funnel-title">
                    Funnel
                  </p>
                  {/* A REAL FUNNEL (Ali, 3 Sep: "next up need a funnel
                      chart"), replacing the four Progress bars. Same data,
                      same greys as ReviewFunnel's ramp — the shape now does what
                      the word says. The last shape is a rectangle: a point
                      at the bottom would draw "visited a review site" as if
                      it tapered to nobody. Labels sit to the right of each
                      step, name and count together, in the margin reserved
                      for them. Fixed-height wrapper per the DS chart rule,
                      capped at max-w-md so four steps do not stretch into
                      four flat ribbons on a wide card. */}
                  {/* <ReviewFunnel/>, not a hand-wrapped FunnelChart (6 Sep).
                      The inline version rendered NOTHING: a FunnelChart will
                      not take its size from the ResponsiveContainer that
                      ChartContainer owns. The lib component measures its own
                      width and hands the chart explicit pixels, which is the
                      only shape that keeps the DS chart context and stays
                      responsive. See the ReviewFunnel sidecar. */}
                  <ReviewFunnel data={funnel} dataHook="insights-funnel-chart" height={240} showDrop />
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
                  control that acts on the card — same place Review Tracker
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
          ) : null}

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
  // A DRAWER, NOT AN INLINE EXPANSION (Ali, 7 Sep). The row used to unfold in
  // place, which pushed every row below it down the page and meant the full
  // text was only ever readable at the width of the column it sat in. Holding
  // the id rather than the object keeps the drawer honest if the filters move
  // underneath it.
  const [openId, setOpenId] = useState(null);
  const { top, bandRef, headTop } = useStickyTable("campaign-page-header");

  const bandOf = (score) => (score <= 6 ? "low" : score <= 8 ? "mid" : "high");
  const rows = useMemo(
    () =>
      FEEDBACK_ITEMS.filter(
        (f) =>
          (ratingFilter === "all" || bandOf(f.score) === ratingFilter) &&
          (visitedFilter === "all" || (visitedFilter === "yes") === !!f.visited),
      ),
    [ratingFilter, visitedFilter],
  );
  // COMPARED AS STRINGS ON PURPOSE. Feedback ids are numbers in the seed, but
  // the delegated row handler can only read one back out of a data attribute,
  // where everything is a string. That handler also fires AFTER the cell
  // button (it is the bubble target), so the string is what lands in state
  // either way. Normalising here beats parsing at two call sites.
  const openItem = FEEDBACK_ITEMS.find((f) => String(f.id) === String(openId)) ?? null;

  const columns = useMemo(
    () => [
      {
        id: "score",
        header: () => "Rating",
        cell: ({ row }) => <FeedbackScore type={type} score={row.original.score} />,
      },
      {
        id: "customer",
        header: () => "Customer",
        cell: ({ row }) =>
          row.original.email ? (
            <span className="block max-w-[16rem] truncate">{row.original.email}</span>
          ) : (
            <span className="text-muted-foreground">Anonymous</span>
          ),
      },
      {
        id: "text",
        header: () => "Feedback",
        // A REAL BUTTON, and it keeps the `feedback-row-<id>` hook the
        // capture walker asserts on. The row is clickable by delegation, but
        // a div listener is not reachable by keyboard, so the text people
        // actually want to read in full is the control that carries focus.
        cell: ({ row }) => (
          <button
            type="button"
            data-hook={`feedback-row-${row.original.id}`}
            className="block max-w-[28rem] truncate text-left"
            onClick={() => setOpenId(row.original.id)}
          >
            <span className="text-muted-foreground" data-bl-link>
              {row.original.text}
            </span>
          </button>
        ),
      },
      {
        id: "consent",
        header: () => "Testimonial",
        cell: ({ row }) =>
          row.original.consent ? (
            <Badge dataHook={`feedback-consent-${row.original.id}`} variant="secondary">
              Testimonial
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">No</span>
          ),
      },
      {
        id: "date",
        header: () => "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.date)}
          </span>
        ),
      },
    ],
    [type],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (r) => r.id,
    enablePagination: true,
    initialState: { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } },
  });

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

          {/* DELEGATED, BECAUSE DataTable HAS NO onRowClick. Its props are
              table / dataHook / isLoading / noResultsMessage / stickyHeader /
              className / layout / minWidth / footer and nothing else, so a
              whole-row target has to be caught on the way up. Reading the
              row's own data-hook rather than its index means a re-sort or a
              page change cannot point the drawer at the wrong review.
              The pointer path is here; the keyboard path is the real
              <button> in the Feedback cell, whose click bubbles to this same
              handler. Both open the same drawer. */}
          <div
            onClick={(e) => {
              const tr = e.target.closest?.("tbody tr");
              const hook = tr?.querySelector("[data-hook^='feedback-row-']");
              const id = hook?.getAttribute("data-hook")?.replace("feedback-row-", "");
              if (id) setOpenId(id);
            }}
          >
            <DataTable
              table={table}
              dataHook="feedback-table"
              noResultsMessage="No feedback matches"
              className={`${TABLE_LOOK} [&_tbody_tr]:cursor-pointer`}
            />
          </div>

          <div className="bg-card sticky bottom-0 z-10 border-t px-4 py-2">
            <DataTablePagination
              table={table}
              dataHook="feedback-pagination"
              className="w-auto"
              ariaLabel="Feedback pagination"
              renderRowCount={({ startRow, endRow, totalRows }) =>
                `${startRow} to ${endRow} of ${totalRows}`
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ONE REVIEW, FULL WIDTH (Ali, 7 Sep: "each review should open up in a
          sheet / drawer"). The table truncates the feedback to keep the rows
          scannable, so the drawer is where the whole thing is actually
          readable, along with the two facts the row only hints at: whether
          they went on to a review site, and whether you may quote them.
          Same right-hand Drawer as the customer preview, so the campaign page
          has one idea of what a side panel is. */}
      <Drawer open={!!openItem} onOpenChange={(o) => !o && setOpenId(null)}>
        <DrawerContent dataHook="feedback-drawer" className="w-full sm:max-w-md">
          <SideSheetHeader
            title={
              <span className="flex items-center gap-3">
                {openItem ? <FeedbackScore type={type} score={openItem.score} /> : null}
                {openItem?.name ?? "Feedback"}
              </span>
            }
            dataHook="feedback-drawer-header"
            closeHook="feedback-drawer-close"
          />
          <DrawerBody className="flex flex-col gap-4">
            <p className="text-sm">{openItem?.text}</p>
            <Separator />
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Received</dt>
                <dd>{openItem ? formatDate(openItem.date) : ""}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate">
                  {openItem?.email ?? <span className="text-muted-foreground">Anonymous</span>}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Review site</dt>
                <dd>{openItem?.visited ? "Visited" : "Did not visit"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Testimonial</dt>
                <dd>{openItem?.consent ? "Happy to be quoted" : "Not for use"}</dd>
              </div>
            </dl>
          </DrawerBody>
          {openItem?.email ? (
            <DrawerFooter>
              <Button variant="primary" dataHook={`feedback-reply-${openItem.id}`} asChild>
                <a href={`mailto:${openItem.email}`}>Reply to {openItem.name}</a>
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>
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
        {/* Same header as every other sheet; the page name that used to sit
            under the title is already the selected tab in the preview. */}
        <SideSheetHeader
          title={kiosk ? "Kiosk view" : "Customer view"}
          dataHook="customer-preview-header"
          closeHook="close-customer-preview"
          closeLabel="Close preview"
        />
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

export default function RMReviewBuilderPage() {
  const persona = usePersona();
  const locationKey = useLocationKey();
  const [campaigns, setCampaigns] = useState(() =>
    persona.engagement === "new" ? [] : seedCampaigns().slice(0, profileFor(locationKey).campaigns),
  );
  const [templates, setTemplates] = useState(seedTemplates);
  const [draft, setDraft] = useState(blankCampaignDraft);
  const [step, setStep] = useState("setup");
  // "campaign" or "template". Same settings page either way; a template just
  // has fewer rows, because a template carries no mode (Ali, 6 Sep: "the
  // templates themselves dont have a mode").
  const [setupKind, setSetupKind] = useState("campaign");
  // null when making a new one, the template's id when amending an existing one.
  const [templateEditId, setTemplateEditId] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [urlView, setView] = useUrlParam("view", "hub");
  const view = urlView === "campaign" && activeId === null ? "hub" : urlView;
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
  // the same 12px muted treatment as "Last updated" on Review Tracker,
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
  // EDITING IS THE SAME PAGE AS CREATING, holding an id. A separate editor
  // would be the same four beats with a different title, and the two would
  // drift the moment either changed.
  function editTemplate(t) {
    setDraft({ ...blankCampaignDraft(), ...t.config, name: t.name });
    setTemplateEditId(t.id);
    setSetupKind("template");
    setStep("setup");
    setHistory([]);
    setActiveId(null);
    setView("wizard");
  }

  function startTemplate() {
    setTemplateEditId(null);
    setDraft(blankCampaignDraft());
    setSetupKind("template");
    setStep("setup");
    setHistory([]);
    setActiveId(null);
    setView("wizard");
  }

  function saveTemplate() {
    if (templateEditId) {
      setTemplates((ts) =>
        ts.map((t) =>
          t.id === templateEditId
            ? {
                ...t,
                name: draft.name?.trim() || t.name,
                updated: new Date().toISOString(),
                config: templateConfig(draft),
              }
            : t,
        ),
      );
      setTemplateEditId(null);
      setSetupKind("campaign");
      setView("templates");
      return;
    }
    setTemplates((ts) => [
      {
        id: `t${Date.now()}`,
        name: draft.name?.trim() || "Untitled template",
        updated: new Date().toISOString(),
        // No channel: a template says what to ask and where to send people,
        // not how the invite travels. templateConfig strips it.
        config: templateConfig(draft),
      },
      ...ts,
    ]);
    setSetupKind("campaign");
    setView("templates");
  }

  function startWizard(source, { fromTemplate = false } = {}) {
    setSetupKind("campaign");
    setDraft(
      source
        ? {
            // Spread over a blank draft so anything the source does not
            // carry falls back to the default. That is what lets a TEMPLATE
            // omit `channel` entirely (6 Sep) and still produce a valid
            // draft: the wizard's own default applies, and the "How do you
            // want to ask?" step is where the mode is actually decided.
            ...blankCampaignDraft(),
            ...source.config,
            id: null,
            name: fromTemplate ? source.name : `${source.name} (copy)`,
            permission: false,
            privacy: false,
          }
        : blankCampaignDraft(),
    );
    // ALWAYS THE SETTINGS PAGE. A template no longer jumps you to "name"
    // either: it just pre-fills the rows, which is what picking a template
    // was always supposed to mean.
    setStep("setup");
    setHistory([]);
    // Re-use is reachable from inside the campaign overlay, so the overlay
    // has to be dismissed or it would sit on top of the wizard.
    setActiveId(null);
    setView("wizard");
  }

  function openCampaign(c) {
    if (c.status === "Draft") {
      setDraft({ ...c.config, id: c.id });
      setStep("setup");
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
        : { sent: recipientsOf(draft), delivered: 0, clicked: 0, reviews: 0, impact: "0.0", opened: 0, rated: 0, visited: 0 },
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
    setView("hub");
  }

  // Clearing activeId as well as the view: a stale campaign left in state is
  // what would make the next Preview or Download act on the wrong record.
  function backToHub() {
    setActiveId(null);
    setView("hub");
  }

  const headerByView = {
    hub: {
      title: "Review Builder",
      // A NUMBER, NOT A SENTENCE (Ali, 7 Sep: "for each page header directly off
      // the hub page, our page description can be used to display some information
      // rather than yet more boring text"). The figure is read from the same data
      // the page renders, never typed in, so it moves when the data does.
      description: (
        <span data-hook="page-stat">
          <span className="text-foreground font-medium tabular-nums">{campaigns.length}</span> campaigns
        </span>
      ),
    },
    // TEMPLATES IS A PAGE, so it names itself and the breadcrumb carries
    // "Review Builder" as its parent — the way home runs through the trail,
    // exactly as the campaign page's does.
    templates: {
      title: "Templates",
      description: "Saved wording your campaigns start from",
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
    title: "Review Builder",
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
  // to slot onto its children". The same error killed Review Tracker'
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
        onClick={() => setPreviewConfig({ config: active.config, expired: active.status === "Ended" })}
      >
        <Eye className="size-4" /> Preview
      </Button>
      <Button variant="outline" size="sm" dataHook="insights-download" onClick={() => setDownloadOpen(true)}>
        <Download className="size-4" /> Download
      </Button>
    </>
  ) : null;

  // TEMPLATES OFF THE HEADER (Ali, 3 Sep: "add manage templates or just
  // 'templates'"). Just "Templates": the page manages them, the button
  // only has to say where it goes. Outline beside the primary, so the two
  // rank — New campaign is the thing to do, Templates is the place to go.
  // Not shown ON the templates page, where it would be a button to the
  // page you are on.
  // EACH PAGE OFFERS THE THING THAT PAGE MAKES (Ali, 7 Sep: "How do I create a
  // template??"). You could not. "Save as template" on a campaign row's
  // overflow was the ONLY route, which is on a different page from the one
  // that lists templates, so the Templates page was a list you could not add
  // to. Now it has its own primary action, and saving from a campaign stays as
  // the second route in for a config you have already proved.
  const headerActions =
    view === "hub" || view === "templates" ? (
      <>
        {view === "hub" ? (
          <Button variant="outline" dataHook="open-templates" onClick={() => setView("templates")}>
            <FileText className="size-4" /> Templates
          </Button>
        ) : null}
        {view === "templates" ? (
          <Button variant="primary" dataHook="new-template" onClick={() => startTemplate()}>
            New template
          </Button>
        ) : (
          <Button variant="primary" dataHook="new-campaign" onClick={() => startWizard()}>
            New campaign
          </Button>
        )}
      </>
    ) : (
      campaignActions
    );

  // ANCESTORS ONLY — the H2 is the campaign, so "Review Builder" is its parent
  // and carries the way back. onClick rather than goto: goto takes a screen
  // id, and the parent here is another view of THIS screen (PageHeader gained
  // crumb.onClick for exactly this, 28 Aug).
  // Templates and a campaign are both children of Review Builder, so both get
  // it as a crumb and it is the way back for each.
  const breadcrumbTrail = [
    { label: "All Locations", goto: "screen:dmrotrgstba3l" },
    { bind: "location", goto: "screen:dmrurue2wmp9u" },
    { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
    ...(view === "templates" || onCampaign ? [{ label: "Review Builder", onClick: backToHub }] : []),
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
        setupKind={setupKind}
        templateEditId={templateEditId}
        onSaveTemplate={saveTemplate}
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
            // as Review Tracker and Review Manager, so the three siblings agree.
            breadcrumbs={breadcrumbTrail}
            title={headerByView.title}
            description={headerByView.description}
            statusRight={headerByView.statusRight}
            actions={headerActions}
          />
        }
      >
        <GlobalLayoutContentBody className="gap-4">
          {view === "hub" ? <BeaconPageStrip page="builder" /> : null}
          {view === "hub" ? (
            <CampaignsPage
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              setTemplates={setTemplates}
              onOpen={openCampaign}
              onNew={startWizard}
              onPreview={(c) => setPreviewConfig({ config: c.config, expired: c.status === "Ended" })}
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
            <TemplatesPage
              templates={templates}
              setTemplates={setTemplates}
              onNew={startWizard}
              onEdit={editTemplate}
            />
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
              along: the trail was already saying "Reviews > Review Builder" over
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
                          status: "Ended",
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
