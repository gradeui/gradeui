"use client";

// Promoted from Studio screen "RM — Report Settings"
// (design dmtkj124xagqa, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: 1f48a8acbe0b

// RM — Report Settings. The configuration surface behind Review Tracker'
// Settings button, which until now was a dead control.
//
// WHY IT IS A SCREEN AND NOT A DIALOG (Ali, 2 Sep: "if you need actual new
// screens, not just tagged on as popovers, modals or sheets, please create
// those - some screens might want to be shared with a url"). Five sections,
// three of which are lists that grow, and a run history table. That is a
// page. It also has a genuine reason to own a URL: "check what we are
// monitoring for this location" is a thing one person sends another, and a
// dialog cannot be sent.
//
// WHAT IT COVERS, AND WHERE EACH PART COMES FROM. The RM Design Brief's
// Monitor Reviews section lists these as shipped today and carrying over,
// and NONE of them existed anywhere in the prototype:
//
//   "Create / edit / delete a report; configure schedule, run day, email
//    alerts, monitored directories"        -> Schedule, Alerts, Directories
//   "Run report on demand"                 -> page header action
//   "Report run history table"             -> Run history
//   "Panel showing which directories a
//    profile was matched on"               -> the match column on Directories
//   "Country-scoped directory picker"      -> the country Select scopes the list
//   "public/white-label share link"        -> Sharing
//
// The alerts section is also the audit's own acknowledged hole. Harry
// Brignull's audit (11 Aug) says, of his clickthrough prototype: "I have not
// included the 'set email notifications' feature (yet)." The legacy screens
// in "Legacy Reviews Feature BL (Copy)" show what it was — No/Yes,
// Immediately/Daily, Only negative / Only positive / Everything, up to five
// addresses — and that model is rebuilt here on DS components.
//
// WHAT IS DELIBERATELY NOT HERE. Create and delete of the report itself. On
// the new platform the report is the location, so there is no list of reports
// to add to or remove from; this page edits THE report for this location.
// If a report list ever returns, it belongs on the Reviews hub, not here.

import { useState } from "react";
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
  CardDescription,
  CardContent,
} from "@brightlocal/ui-components/card";
import { Button } from "@brightlocal/ui-components/button";
import { Badge } from "@brightlocal/ui-components/badge";
import { Input } from "@brightlocal/ui-components/input";
import { Switch } from "@brightlocal/ui-components/switch";
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Separator } from "@brightlocal/ui-components/separator";
import { RadioGroup, RadioGroupItem } from "@brightlocal/ui-components/radio-group";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
} from "@brightlocal/ui-components/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@brightlocal/ui-components/select";
import {
  InputList,
  InputListItems,
  InputListInput,
} from "@brightlocal/ui-components/input-list";
import { AlertInfo } from "@brightlocal/ui-components/alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@brightlocal/ui-components/table";
import {
  Menu,
  Play,
  Check,
  Copy,
  Link2,
  Globe,
  GoogleOriginal,
  FacebookOriginal,
  YelpOriginal,
  TrustpilotOriginal,
} from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  DateStamp,
  formatDate,
  formatDateTime,
  useProposalData,
} from "@brightlocal/proposal";

/* ================================ reference =============================== */

// THE DIRECTORY LIST IS COUNTRY-SCOPED, which is the whole reason the
// country control sits above it rather than in a global setting: Yell and
// Thomson Local are United Kingdom directories and mean nothing to a US
// location, and the legacy picker made you scroll past them anyway.
//
// `matched` is the second thing the brief asks for in this area — "panel
// showing which directories a profile was matched on". It is a column here
// rather than a separate panel: a directory you monitor but have not matched
// is the interesting case, and putting the two lists side by side is how you
// see it. A matched profile shows the URL it matched ON, because "matched"
// with no evidence is the state everybody distrusts.
// EVERY DIRECTORY WEARS ITS OWN MARK (Ali, 2 Sep: "no logos on report
// settings"). The Review Manager and the widget picker both give a source its
// brand glyph, and a settings page that lists the same sources as bare text
// makes them read as different things. A row here and a row there should be
// recognisable as the same directory without reading the word.
//
// FOUR BRANDS EXIST IN @brightlocal/icons — Google, Facebook, Yelp,
// Trustpilot — and that is all. Tripadvisor, Better Business Bureau, Yell,
// Thomson Local and Yellow Pages have no mark in the DS, so they take a
// neutral Globe rather than a lookalike: an approximated brand mark on a
// settings page is worse than an honest generic one, and it is the kind of
// thing that ends up in a screenshot in front of the brand's own people.
// Logged for BrightLocal — the directory list is fixed and known, so these
// five are a reasonable ask of the icon set.
const DIRECTORY_MARK = {
  google: GoogleOriginal,
  facebook: FacebookOriginal,
  yelp: YelpOriginal,
  trustpilot: TrustpilotOriginal,
};

function DirectoryMark({ id }) {
  const Icon = DIRECTORY_MARK[id] ?? Globe;
  return (
    <Icon
      className={`size-4 shrink-0 ${DIRECTORY_MARK[id] ? "" : "text-muted-foreground"}`}
      aria-hidden
    />
  );
}

const DIRECTORIES = {
  UK: [
    { id: "google", name: "Google", matched: "goo.gl/maps/farmburger-uk", on: true },
    { id: "facebook", name: "Facebook", matched: null, on: true, needs: "connection" },
    { id: "yelp", name: "Yelp", matched: "yelp.co.uk/biz/farm-burger", on: true, readOnly: true },
    { id: "tripadvisor", name: "Tripadvisor", matched: "tripadvisor.co.uk/farm-burger", on: true },
    { id: "yell", name: "Yell", matched: null, on: false },
    { id: "thomson", name: "Thomson Local", matched: null, on: false },
    { id: "trustpilot", name: "Trustpilot", matched: "trustpilot.com/review/farmburger", on: true },
  ],
  USA: [
    { id: "google", name: "Google", matched: "goo.gl/maps/farmburger", on: true },
    { id: "facebook", name: "Facebook", matched: null, on: true, needs: "connection" },
    { id: "yelp", name: "Yelp", matched: "yelp.com/biz/farm-burger-asheville", on: true, readOnly: true },
    { id: "tripadvisor", name: "Tripadvisor", matched: "tripadvisor.com/farm-burger", on: true },
    { id: "bbb", name: "Better Business Bureau", matched: null, on: false },
    { id: "yellowpages", name: "Yellow Pages", matched: null, on: false },
    { id: "trustpilot", name: "Trustpilot", matched: null, on: true },
  ],
};

// A ROW THAT CANNOT DELIVER NEEDS A WAY OUT (Ali, 2 Sep: "if it says 'we
// could not find a profile', are the checkboxes disabled, and how do you
// allow the user to fix it — and separately to fix the Facebook
// connection?").
//
// THE CHECKBOX STAYS ENABLED, deliberately. Ticking it is the user saying
// "watch this directory"; the match is plumbing underneath that intent.
// Disabling it would mean a business that has just opened a Yell listing
// has no way to say it wants Yell watched, and would leave the row with
// nothing to act on at all. So the tick expresses intent and the row says
// whether the intent is currently being met.
//
// THE TWO FAILURES ARE NOT THE SAME PROBLEM, and they do not share a fix:
//
//   "No profile found"      we looked and could not find a listing for this
//                           business. The user knows their own URL, or can
//                           search. Per DIRECTORY, fixed with a URL.
//   "Needs Facebook
//    connected"             Facebook only returns reviews after oAuth, so
//                           nothing can be matched until the ACCOUNT is
//                           connected. Per ACCOUNT, fixed once, and it fixes
//                           Facebook everywhere in the tool — this is the
//                           audit's §3.1.3 point.
//
// Same-looking rows, different verbs: "Find profile" against "Connect".
// Collapsing them into one button would send somebody to an oAuth screen to
// solve a missing Yell URL.
const COUNTRIES = [
  { id: "USA", label: "United States" },
  { id: "UK", label: "United Kingdom" },
];

// Run history. Every row is a real outcome, including the one that partly
// failed: a history that only ever shows success is not a history, and the
// brief names reply/fetch failures as the recurring support theme.
// ISO IN, house format OUT. Every date in RM goes through `formatDate` /
// `formatDateTime` from @brightlocal/proposal — the same functions the page
// header's Last updated line uses — so a date in this table and a date in a
// header read identically.
const RUNS = [
  { id: "r1", at: "2026-09-02T06:00", trigger: "Scheduled", found: 1247, added: 12, state: "ok" },
  { id: "r2", at: "2026-08-26T06:00", trigger: "Scheduled", found: 1235, added: 9, state: "ok" },
  { id: "r3", at: "2026-08-22T14:31", trigger: "Manual", found: 1226, added: 4, state: "ok" },
  { id: "r4", at: "2026-08-19T06:00", trigger: "Scheduled", found: 1222, added: 7, state: "partial" },
  { id: "r5", at: "2026-08-12T06:00", trigger: "Scheduled", found: 1215, added: 11, state: "ok" },
];

const RUN_STATE = {
  ok: { label: "Complete", variant: "secondary" },
  partial: { label: "Facebook skipped", variant: "outline" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// SPACING FIXES, MEASURED ON THE LIVE PAGE (Ali, 2 Sep: "the 'what to
// send' and the radio buttons are next to each other so no spacing… space
// at the start of the email addresses, the input below them is tiny").
//
// Three DS shapes go wrong here, and all three are worth writing down
// because none of them is a mistake in this screen's markup:
//
//  1. FIELD'S GAP IS 8px. That is right for a label above ONE control and
//     too tight for a label above a GROUP of them: "What to send" sat 8px
//     off its first radio and read as part of the option rather than as
//     the question. 16px separates the question from the answers.
//
//  2. THE LIST ROWS ARE INVISIBLE. InputList draws each item as a FILLED
//     row — `bg-card`, `py-2 pr-2 pl-4`. AppLayoutShell remaps `--card` to
//     white for its pages, so on a white card the fill vanishes and only
//     the 16px left padding survives. The result is an email address that
//     looks arbitrarily indented from its own label, which is exactly what
//     Ali saw. Restoring a visible surface makes the indent read as a row,
//     which is what the DS intended.
//
//  3. THE ADD INPUT COLLAPSES. It ships `h-9` (36px) and renders at 22px
//     inside InputList's flex column. shrink-0 holds it at its own height.
//     It also ships `text-base`, a step larger than every label around it —
//     the same 16px-against-14px mismatch logged as DS finding 3.8.
//
// One scoped block, not a className on each of the twenty controls.
const SPACING_FIXES = `
[data-hook="settings-page-body"] [data-slot="field"] > [data-slot="radio-group"] {
  margin-top: 0.5rem;
}
[data-hook="recipients-list"] [data-slot="list"] > li > div {
  background: var(--muted);
  /* 14px, matching the add-input directly below and the label above (Ali,
     3 Sep: "these email addresses are too big text wise compared to the
     input they are directly next to"). InputList ships its rows at
     text-base leading-none font-medium, 16px, so two
     controls in the same stack, holding the same kind of value, were set
     two steps apart. Same DS finding as 3.8: the library's form surfaces
     are 16px against 14px chrome, and here that lands twice in one field. */
  font-size: 0.875rem;
  font-weight: 400;
}
[data-hook="recipients-input"] {
  flex-shrink: 0;
  /* min-height, not height. A flex parent will shrink a child below its
     height but never below its min-height, which is why setting height
     alone left this at 19px. */
  min-height: 2.25rem;
  height: 2.25rem;
  font-size: 0.875rem;
}
`;

/* ============================== small pieces ============================== */

// One settings block. Card, heading, lede, body. Every section on this page
// wears it, so the page cannot drift into six slightly different cards.
function SettingsCard({ title, lede, action, children, dataHook }) {
  return (
    <Card dataHook={dataHook} className="max-w-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle dataHook={`${dataHook}-title`}>{title}</CardTitle>
            {lede ? <CardDescription dataHook={`${dataHook}-lede`}>{lede}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// The radio rows in the alerts section. Horizontal Field with the control
// first is the DS canonical pattern for a choice with a description.
function ChoiceRow({ name, value, onChange, options }) {
  return (
    <RadioGroup dataHook={`${name}-radio-group`} value={value} onValueChange={onChange}>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <Field key={o.id} orientation="horizontal">
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

/* =================================== app ================================== */

export default function RMReportSettingsPage() {
  const data = useProposalData();
  const locationName = data?.location?.name ?? "this location";

  const [country, setCountry] = useState("USA");
  const [monitored, setMonitored] = useState(() =>
    DIRECTORIES.USA.filter((d) => d.on).map((d) => d.id),
  );
  const [frequency, setFrequency] = useState("weekly");
  const [runDay, setRunDay] = useState("Monday");

  // ALERTS. The legacy model, kept: on/off, then cadence, then scope, then
  // recipients. Off collapses the rest rather than leaving four disabled
  // controls on screen, because a disabled control still reads as a setting
  // someone has to understand.
  const [alerts, setAlerts] = useState(true);
  const [cadence, setCadence] = useState("immediately");
  const [scope, setScope] = useState("negative");
  const [emails, setEmails] = useState(["alex@farmburger.com", "manager@farmburger.com"]);

  const [shared, setShared] = useState(true);
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [copied, setCopied] = useState(false);
  // Which directory's "find profile" dialog is open, by id. null = none.
  const [findFor, setFindFor] = useState(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);

  const list = DIRECTORIES[country];
  const shareUrl = "https://reports.brightlocal.com/r/8k2p1x";

  const toggleDirectory = (id) =>
    setMonitored((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Switching country switches which directories are even offered, so the
  // selection has to be re-derived rather than carried across: a US report
  // silently monitoring Thomson Local is exactly the kind of thing that
  // makes a settings page untrustworthy.
  const switchCountry = (next) => {
    setCountry(next);
    setMonitored(DIRECTORIES[next].filter((d) => d.on).map((d) => d.id));
  };

  const copyLink = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const matchedCount = list.filter((d) => monitored.includes(d.id) && d.matched).length;

  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        preset="live-site"
        navDensity="comfortable"
        stickyHeader
        flush
        pinnedSidebar
        dataHook="settings-app-layout"
        // Settings belongs to Review Tracker, so the rail stays on that
        // item rather than lighting up nothing.
        sidebar={<ProposalSidebar dataHook="settings-sidebar" activeId="reviews-insights" />}
        mobileBar={
          <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
            <SidebarTrigger dataHook="mobile-trigger">
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-5" dataHook="mobile-logo" />
          </div>
        }
        header={
          <PageHeader
            dataHook="settings-page-header"
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
              { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
              { label: "Review Tracker", goto: "screen:dmswb0i9c6oe5" },
            ]}
            title="Report settings"
            // A NUMBER, NOT A SENTENCE (Ali, 7 Sep: "all the report settings
            // headings are just extra copy"). Same rule as the section pages:
            // the one figure that says what this report is doing.
            description={
              <span data-hook="page-stat">
                <span className="text-foreground font-medium tabular-nums">{monitored.length}</span> of {list.length} directories watched
              </span>
            }
            // NOT "Last updated" (Ali, 2 Sep: "do we need to display last
            // updated in this screen as well?"). Last updated describes how
            // stale the DATA is, and this page holds no data — it holds
            // settings. The equivalent fact here is when the report last
            // RAN, which is what the run history below is about, so it goes
            // in the same slot with its own word. Same treatment as the
            // campaign page's date; see PageHeader's statusRight.
            // A DateStamp, not a formatted string (Ali, 3 Sep: "date format
            // here top right, dashed, tooltip"). It was rendering the full
            // stamp inline, which is the one thing DateStamp exists to
            // avoid: a long timestamp sitting in the header instead of a
            // short date with the detail one hover away. Same component the
            // campaign cards and the page header's own Last updated use.
            statusRight={<DateStamp label="Last run" value={RUNS[0].at} dataHook="last-run" />}
            actions={
              <Button variant="outline" dataHook="run-now">
                <Play className="size-4" />
                Run report now
              </Button>
            }
          />
        }
      >
        <GlobalLayoutContentBody dataHook="settings-page-body" className="gap-4 pb-10">
          {/* See SPACING_FIXES. Scoped to this page's body so nothing leaks. */}
          <style>{SPACING_FIXES}</style>
          {/* ── SCHEDULE ─────────────────────────────────────────────── */}
          <SettingsCard
            dataHook="schedule-card"
            title="Schedule"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field dataHook="frequency-field">
                <FieldLabel htmlFor="frequency" dataHook="frequency-label">
                  Frequency
                </FieldLabel>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency" dataHook="frequency-select">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Daily has no run day. Showing the control disabled would
                  imply there is a day to pick and something is stopping you;
                  there is not, so it is not there. */}
              {frequency === "daily" ? null : (
                <Field dataHook="run-day-field">
                  <FieldLabel htmlFor="run-day" dataHook="run-day-label">
                    {frequency === "monthly" ? "Run on the first" : "Run day"}
                  </FieldLabel>
                  <Select value={runDay} onValueChange={setRunDay}>
                    <SelectTrigger id="run-day" dataHook="run-day-select">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
            <p className="text-muted-foreground mt-4 text-sm" data-hook="next-run">
              Next run:{" "}
              <span className="text-foreground font-medium">
                {frequency === "daily" ? "tomorrow, 06:00" : `${runDay} ${formatDate("2026-09-08")}, 06:00`}
              </span>
              . A run can be triggered by hand at any time, and doing so does not move the schedule.
            </p>
          </SettingsCard>

          {/* ── MONITORED DIRECTORIES ────────────────────────────────── */}
          <SettingsCard
            dataHook="directories-card"
            title="Monitored directories"
            // The watched count moved to the page header; this keeps the one
            // fact the header does not carry.
            lede={`${matchedCount} matched to a profile`}
            action={
              <Field dataHook="country-field" className="w-full sm:w-56">
                <FieldLabel htmlFor="country" dataHook="country-label">
                  Country
                </FieldLabel>
                <Select value={country} onValueChange={switchCountry}>
                  <SelectTrigger id="country" dataHook="country-select">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            }
          >
            <div className="flex flex-col">
              {list.map((d, i) => {
                const on = monitored.includes(d.id);
                return (
                  <div key={d.id} data-hook={`directory-${d.id}`}>
                    {i > 0 ? <Separator dataHook={`directory-${d.id}-rule`} /> : null}
                    <Field orientation="horizontal" className="py-3">
                      <Checkbox
                        id={`dir-${d.id}`}
                        dataHook={`directory-${d.id}-checkbox`}
                        checked={on}
                        onCheckedChange={() => toggleDirectory(d.id)}
                      />
                      <FieldContent>
                        <div className="flex flex-wrap items-center gap-2">
                          <DirectoryMark id={d.id} />
                          <FieldLabel htmlFor={`dir-${d.id}`} dataHook={`directory-${d.id}-label`}>
                            {d.name}
                          </FieldLabel>
                          {/* MATCHED IS THE STATE THAT MATTERS, so it is a
                              badge rather than body copy. Read-only sources
                              are marked here as well: the brief is explicit
                              that Yelp has no reply affordance, and this is
                              the one page that says why. */}
                          {d.matched ? (
                            <Badge variant="secondary" dataHook={`directory-${d.id}-matched`}>
                              Matched
                            </Badge>
                          ) : (
                            <Badge variant="outline" dataHook={`directory-${d.id}-unmatched`}>
                              No profile found
                            </Badge>
                          )}
                          {d.readOnly ? (
                            <Badge variant="outline" dataHook={`directory-${d.id}-readonly`}>
                              Read only
                            </Badge>
                          ) : null}
                        </div>
                        <FieldDescription dataHook={`directory-${d.id}-desc`}>
                          {d.matched
                            ? d.matched
                            : d.needs === "connection"
                              ? "Facebook only sends us reviews once your account is connected, so nothing can be matched yet."
                              : on
                                ? "We could not find a listing for this business. Add the URL and we will watch it from the next run."
                                : "Not being watched."}
                        </FieldDescription>
                        {/* THE ACTION LIVES INSIDE FieldContent (Ali, 3 Sep:
                            "what's this gap between the checkbox and Facebook
                            and Trustpilot when there is a CTA button?").
                            It was a third child of the Field, and Field's
                            horizontal variant is `grid-cols-[auto_1fr]` — two
                            columns. A third child wraps to row 2 column 1,
                            and column 1 is `auto`, so it sized itself to the
                            widest thing in it: the button. A 100px "Connect"
                            pushed the checkbox column to 100px and shunted
                            the label right, on those two rows only.
                            Inside FieldContent it is in column 2 with the
                            label and description, where it belongs anyway —
                            it acts on this directory, not on the checkbox.

                            Only while the row is WATCHED: an unticked
                            directory is not failing at anything, so offering
                            to fix it is noise. */}
                        {!d.matched && on ? (
                          <div className="mt-1">
                            {d.needs === "connection" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                dataHook={`directory-${d.id}-connect`}
                                onClick={() => setConnectOpen(true)}
                              >
                                Connect
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                dataHook={`directory-${d.id}-find`}
                                onClick={() => {
                                  setFindFor(d);
                                  setProfileUrl("");
                                }}
                              >
                                Add URL
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </FieldContent>
                    </Field>
                  </div>
                );
              })}
            </div>
          </SettingsCard>

          {/* ── EMAIL ALERTS ─────────────────────────────────────────── */}
          <SettingsCard
            dataHook="alerts-card"
            title="Email alerts"
            // No lede (Ali, 7 Sep: "a lot of verbose crap, drop this"). The
            // title and the switches say it.
          >
            {/* EVERY SWITCH ON THIS PAGE READS THE SAME WAY (Ali, 2 Sep:
                "the toggle for Share link should also be on the left, same
                as Remove BrightLocal branding"). Two of the three sat in the
                card's header action slot, pinned right with the label to
                their LEFT; the third sat in the body, control first. Three
                switches, two grammars.
                The body one won: a switch that gates a whole section is the
                first thing IN that section, not furniture in its title bar,
                and control-then-label is the DS's own horizontal Field
                pattern. It also gives the switch room for the description
                that says what OFF means, which a header slot has not. */}
            <Field orientation="horizontal" dataHook="alerts-toggle-field" className="mb-6">
              <Switch
                id="alerts"
                dataHook="alerts-switch"
                checked={alerts}
                onCheckedChange={setAlerts}
              />
              <FieldContent>
                <FieldLabel htmlFor="alerts" dataHook="alerts-toggle-label">
                  Send alerts
                </FieldLabel>
                <FieldDescription dataHook="alerts-toggle-desc">
                  Email somebody when a new review arrives on a monitored directory.
                </FieldDescription>
              </FieldContent>
            </Field>

            {alerts ? (
              <div className="flex flex-col gap-6">
                <Field dataHook="cadence-field">
                  <FieldLabel htmlFor="cadence-immediately" dataHook="cadence-label">
                    When
                  </FieldLabel>
                  <ChoiceRow
                    name="cadence"
                    value={cadence}
                    onChange={setCadence}
                    options={[
                      {
                        id: "immediately",
                        label: "As they arrive",
                        caption:
                          "One email per review. A fast reply is worth most on a negative review, so this is the default.",
                      },
                      {
                        id: "daily",
                        label: "Once a day",
                        caption: "A single digest at 08:00 covering everything from the day before.",
                      },
                    ]}
                  />
                </Field>

                <Separator dataHook="alerts-rule-1" />

                <Field dataHook="scope-field">
                  <FieldLabel htmlFor="scope-negative" dataHook="scope-label">
                    What to send
                  </FieldLabel>
                  <ChoiceRow
                    name="scope"
                    value={scope}
                    onChange={setScope}
                    options={[
                      { id: "negative", label: "Only negative", caption: "1 and 2 stars, and anything marked not recommended." },
                      { id: "positive", label: "Only positive", caption: "4 and 5 stars, and anything marked recommended." },
                      { id: "everything", label: "Everything", caption: "Every new review on every monitored directory." },
                    ]}
                  />
                </Field>

                <Separator dataHook="alerts-rule-2" />

                <Field dataHook="recipients-field">
                  <FieldLabel htmlFor="recipients" dataHook="recipients-label">
                    Send to
                  </FieldLabel>
                  <FieldDescription dataHook="recipients-desc">
                    Up to five addresses. They do not need a BrightLocal account.
                  </FieldDescription>
                  <InputList
                    dataHook="recipients-list"
                    value={emails}
                    // FIVE IS THE CAP, and it is enforced here rather than
                    // by disabling the input: InputList has no maxItems, so
                    // the app owns the rule (its own docs put validation on
                    // the app side of the DS/app split).
                    onValueChange={(next) => setEmails(next.slice(0, 5))}
                  >
                    <InputListItems dataHook="recipients-items" />
                    {/* A placeholder, because an empty bordered bar with no
                        label is indistinguishable from a rendering fault —
                        which is how it read in the screenshot. */}
                    <InputListInput dataHook="recipients-input" placeholder="Add an email address" />
                  </InputList>
                  {emails.length >= 5 ? (
                    <AlertInfo
                      dataHook="recipients-full"
                      description="Five addresses is the limit. Remove one to add another."
                    />
                  ) : null}
                </Field>
              </div>
            ) : (
              // NOT A DISABLED FORM. Off means nobody is told, and saying so
              // in one sentence is more honest than four greyed-out controls.
              <p className="text-muted-foreground text-sm" data-hook="alerts-off">
                New reviews still arrive in the Review Manager, but nobody is told about them: somebody
                has to go and look.
              </p>
            )}
          </SettingsCard>

          {/* ── SHARING ──────────────────────────────────────────────── */}
          <SettingsCard
            dataHook="sharing-card"
            title="Sharing"
          >
            <Field orientation="horizontal" dataHook="share-toggle-field" className="mb-4">
              <Switch
                id="share"
                dataHook="share-switch"
                checked={shared}
                onCheckedChange={setShared}
              />
              <FieldContent>
                <FieldLabel htmlFor="share" dataHook="share-toggle-label">
                  Share link
                </FieldLabel>
                <FieldDescription dataHook="share-toggle-desc">
                  Anyone with the link can open the report. No sign-in, no account.
                </FieldDescription>
              </FieldContent>
            </Field>

            {shared ? (
              <div className="flex flex-col gap-4">
                <Field dataHook="share-url-field">
                  <FieldLabel htmlFor="share-url" dataHook="share-url-label">
                    Link
                  </FieldLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="share-url"
                      dataHook="share-url-input"
                      readOnly
                      value={shareUrl}
                      className="min-w-0 flex-1"
                    />
                    <Button variant="outline" dataHook="copy-share-link" onClick={copyLink}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <FieldDescription dataHook="share-url-desc">
                    Anyone with this link sees the charts and the review list for {locationName}. They
                    cannot reply, and they cannot change anything.
                  </FieldDescription>
                </Field>

                <Separator dataHook="sharing-rule" />

                <Field orientation="horizontal" dataHook="white-label-field">
                  <Switch
                    id="white-label"
                    dataHook="white-label-switch"
                    checked={whiteLabel}
                    onCheckedChange={setWhiteLabel}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="white-label" dataHook="white-label-label">
                      Remove BrightLocal branding
                    </FieldLabel>
                    <FieldDescription dataHook="white-label-desc">
                      The shared report carries your own logo instead of ours. Agencies send this to
                      their clients, so it is off by default rather than on.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm" data-hook="sharing-off">
                No public link exists. Turning this on creates one, and turning it off again breaks
                any link already sent.
              </p>
            )}
          </SettingsCard>

          {/* ── RUN HISTORY ──────────────────────────────────────────── */}
          <SettingsCard
            dataHook="history-card"
            title="Run history"
            // Five runs here; the full history is its own page (Ali, 7 Sep:
            // "you'd also want to see all the reports historically, maybe on
            // another page, but it doesn't need to be live"). So the way
            // there exists and goes nowhere yet.
            action={
              <Button variant="ghost" size="sm" dataHook="history-all">
                View all runs
              </Button>
            }
          >
            <Table dataHook="history-table" minWidth="640px" scrollRegionLabel="Report run history">
              <TableHeader>
                <TableRow>
                  <TableHead>Run</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead align="right">Reviews found</TableHead>
                  <TableHead align="right">New</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RUNS.map((r) => {
                  const state = RUN_STATE[r.state];
                  return (
                    <TableRow key={r.id} data-hook={`run-${r.id}`}>
                      <TableCell>{formatDateTime(r.at) ?? formatDate(r.at)}</TableCell>
                      <TableCell>{r.trigger}</TableCell>
                      {/* tabular-nums so the columns line up down the page.
                          A count that shifts left and right as the digits
                          change is unreadable as a trend. */}
                      <TableCell className="text-right tabular-nums">
                        {r.found.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">+{r.added}</TableCell>
                      <TableCell>
                        <Badge variant={state.variant} dataHook={`run-${r.id}-state`}>
                          {state.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* A PARTIAL RUN NEEDS A ROUTE OUT, not just a badge. The brief
                names unexplained failures as the recurring support theme, so
                the one row that did not fully succeed says what to do. */}
            <AlertInfo
              dataHook="history-note"
              description={`Facebook was skipped on ${formatDate("2026-08-19")} because the connection had expired. Reconnect Facebook to include its reviews in future runs.`}
              action={
                <Button variant="ghost" size="sm" dataHook="reconnect-facebook" onClick={() => setConnectOpen(true)}>
                  <Link2 className="size-4" />
                  Reconnect
                </Button>
              }
            />
          </SettingsCard>
          {/* ── ADD A PROFILE URL, per directory ──────────────────────
              A dialog rather than an inline field on the row: the row is a
              list item in a list of seven, and growing one of them to hold a
              text input and a Save reflows the six below it. It also has
              room to say WHERE to find the URL, which is the actual
              difficulty — people know their listing exists, not what its
              canonical address is. */}
          <Dialog open={!!findFor} onOpenChange={(o) => !o && setFindFor(null)}>
            <DialogContent dataHook="find-profile-content">
              <DialogHeader>
                <DialogTitle dataHook="find-profile-title">
                  Add your {findFor?.name} listing
                </DialogTitle>
                <DialogDescription dataHook="find-profile-desc">
                  Open your listing on {findFor?.name} and copy the address from the browser. We
                  will check it on the next run and start collecting its reviews.
                </DialogDescription>
              </DialogHeader>
              <Field dataHook="profile-url-field">
                <FieldLabel htmlFor="profile-url" dataHook="profile-url-label">
                  Listing address
                </FieldLabel>
                <Input
                  id="profile-url"
                  dataHook="profile-url-input"
                  placeholder={`https://${findFor?.id ?? "example"}.com/your-business`}
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                />
                <FieldDescription dataHook="profile-url-help">
                  Not sure which page it is? It is the one customers land on when they leave you a
                  review, not your own website.
                </FieldDescription>
              </Field>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" dataHook="find-profile-cancel">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary" dataHook="find-profile-save">
                    Save listing
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── CONNECT FACEBOOK, per account ─────────────────────────
              Separate from the dialog above because it is a different KIND
              of fix: one oAuth handoff that fixes Facebook everywhere in the
              tool, not a URL for one row. Saying so is the point of the
              copy — otherwise it reads as "another directory to configure"
              and gets postponed the same way. */}
          <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
            <DialogContent dataHook="connect-facebook-content">
              <DialogHeader>
                <DialogTitle dataHook="connect-facebook-title">Connect Facebook</DialogTitle>
                <DialogDescription dataHook="connect-facebook-desc">
                  Facebook only releases reviews to tools you have authorised, so this is the one
                  directory we cannot match on your behalf. You will sign in to Facebook and choose
                  the Page for {locationName}. It is a one-off: connecting here also turns on
                  Facebook replies in the Review Manager and Facebook reviews in your widgets.
                </DialogDescription>
              </DialogHeader>
              <AlertInfo
                dataHook="connect-facebook-note"
                description="We only ask for reviews and the ability to reply to them. We never post to your Page."
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" dataHook="connect-facebook-cancel">
                    Not now
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary" dataHook="connect-facebook-go">
                    <FacebookOriginal className="size-4" />
                    Continue to Facebook
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
