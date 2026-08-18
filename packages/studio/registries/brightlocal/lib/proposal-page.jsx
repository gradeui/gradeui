// @brightlocal/proposal-page — page furniture: PageHeader and the
// card family (StatCard, HubStatCard, HubHeroCard). Split out of
// proposal.jsx (18 Jul); the barrel re-exports.
import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  MapGridPin,
  MapLocationPin,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  GlobalLayout,
  GlobalLayoutContent,
  GlobalLayoutContentHeader,
  GlobalLayoutSidebar,
  Logo,
  Sidebar,
  SidebarAccountDropdown,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuSubVariant,
  SidebarPopoverMenu,
  SidebarSwitcher,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Skeleton,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
} from "@brightlocal/ui-components";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building,
  ChevronRight,
  Globe,
  Grid3x3,
  HelpCircle,
  ImageOff,
  Info,
  Link,
  ListChecks,
  MapPin,
  Phone,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
} from "@brightlocal/icons";
import {
  GlobeyCalmOpen1,
  GlobeyCalmClosed,
} from "@brightlocal/illustrations";
import { useProposalData } from "@brightlocal/proposal-data";
import { selectSessionDataset } from "@brightlocal/proposal-shell";

// ─── formatDate — just the date, no time/UTC noise ────────────────────
// The dataset stores a pre-formatted string ("1st Jul 2026 at 9:52 AM
// UTC"); we only want "July 1, 2026". Regex-parse (never `new Date` on
// that non-standard string — engines disagree) and reformat. Anything
// we can't parse is returned untouched, so this never breaks a render.
const MONTHS = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};
// "12th July, 2026" — day-with-ordinal first (snags list, Ali 21 Jul:
// "note date format"). Ordinals: 11th/12th/13th are the teens exception.
function ordinal(day) {
  const teens = day % 100;
  if (teens >= 11 && teens <= 13) return "th";
  const last = day % 10;
  return last === 1 ? "st" : last === 2 ? "nd" : last === 3 ? "rd" : "th";
}

export function formatDate(value) {
  if (!value || typeof value !== "string") return value ?? null;
  const m = value.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!m) return value;
  const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (!month) return value;
  const day = parseInt(m[1], 10);
  return `${day}${ordinal(day)} ${month}, ${m[3]}`;
}

// ─── DrillArrow — THE clickable-card drill affordance ─────────────────
// ONE concept, two looks (Ali, 24 Jul: "they are the same concept —
// add affordance to a card"; promoted to the lib AFTER the standalone
// copies shipped to prod, replacing the repeats):
//   "solid" — secondary circle for card surfaces (hub cards, AI
//             Insights module cards).
//   "glass" — white/70 + backdrop blur for sitting ON photography
//             (LocationCard's photo), where the solid tint clashes
//             with whatever's underneath; firms to /85 on card hover.
//             (Tailwind /70 compiles to alpha-over-transparent — not
//             a colour mix.)
// A REAL DS secondary Button so the solid hover state is the DS's own:
// the parent card must be `group`, and group-hover mirrors the exact
// hover class so hovering anywhere on the card moves the arrow to its
// hover state. Decorative on purpose: the card owns the click
// (pointer-events-none, aria-hidden, tabIndex -1) — a live button
// would swallow the goto. STILL an upstream ask (see the ledger): the
// DS library should ship this; this lib version is the single interim
// definition every card now uses.
export function DrillArrow({ variant = "solid", dataHook = "drill-arrow", className = "" }) {
  return (
    <Button
      variant="secondary"
      aria-hidden
      tabIndex={-1}
      dataHook={dataHook}
      className={[
        "pointer-events-none size-9 shrink-0 rounded-full p-0",
        variant === "glass"
          ? "bg-(--ds-tailwind-colors-base-white)/70 backdrop-blur-sm group-hover:bg-(--ds-tailwind-colors-base-white)/85"
          : "group-hover:bg-secondary/80",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ArrowRight className="size-4" />
    </Button>
  );
}

// ─── CardTitleLink — the clickable-card title treatment ───────────────
// Feature cards whose WHOLE card is a link (hub cards, module cards).
// GREEN-AT-REST REMOVED (Ali, 22 Jul: "just too many colours") and
// GREEN-ON-HOVER REMOVED TOO (Ali, 24 Jul: the hover green "looks
// unfinished" — a previous designer's suggestion). The title is plain
// card foreground in every state; a clickable card's affordance is the
// DrillArrow (a real secondary Button that moves to its hover state on
// card hover, via group/group-hover) plus a hover shadow on the card —
// see the hub screen. data-bl-link stays stamped: accordion rows and
// the --bl-card-link seam for inline links still read it.
export function CardTitleLink({ children, dataHook, className = "", ...rest }) {
  return (
    <CardTitle
      size="small"
      dataHook={dataHook}
      data-bl-link=""
      {...rest}
      // text-xl semibold (Ali, 23 Jul) — the grid-card title scale:
      // a step under the At-a-Glance/landing headings (text-2xl), a
      // step over body. Overrides ride tailwind-merge past the size
      // variant; pass className to override per-instance.
      className={["text-xl font-semibold", className].filter(Boolean).join(" ")}
    >
      {children}
    </CardTitle>
  );
}

// ─── PageHeader — the composed page header ────────────────────────────
// There is NO PageHeader component in the DS — the page header IS this
// composition (recipe: page-header-with-breadcrumbs.jsx; upstream note:
// it should be a component). Trail RULE: ANCESTORS ONLY, max two — the
// current page never appears in the breadcrumb (the H2 IS the current
// page); BreadcrumbPage is deliberately unused. `meta` renders in the
// muted row under the title; `actions` right-aligns (buttons, menus).
export function PageHeader({
  // ANCESTORS ONLY, max two. `[]` keeps the row's FOOTPRINT (invisible
  // spacer) so the band is the same height on every page; `false`
  // removes the row entirely — see the utility-row note below.
  breadcrumbs = [],
  title,
  // Subtitle under the H2 — every proposal page should carry one
  // (Ali, 20 Jul). String or node.
  description,
  // Timestamp shown muted beneath the description. Pass "auto" to BIND
  // data.aiInsights.lastUpdated — the AI Insights pages own it now; it
  // was removed from the AreaInsights header so it lives in ONE place.
  // Any other string renders literally; omit to hide. ("auto" is a
  // STRING because the contract types this prop as a string — a boolean
  // fails save validation.)
  lastUpdated,
  // Muted row under the title. EXPLICIT-ONLY — pass any node to render
  // it; omitted (or null) renders nothing. Previously defaulted to a
  // data-bound NAP line + status Badge from the proposal data context;
  // that default was dropped — the location already leads the crumb, so
  // the row was redundant (Ali, 20 Jul).
  meta,
  // PAGE-LEVEL CTAs. These render on the TITLE row, right, vertically
  // centred on the title (Ali, 18 Aug) — they used to sit top-aligned,
  // which landed them in the breadcrumb row, i.e. page actions reading
  // as utility chrome. Same API, new position: no screen changes.
  actions,
  // UTILITY slot — the right end of the breadcrumb row, for chrome that
  // belongs to the app rather than the page. Defaults to the help
  // affordance alone; pass a node to EXTEND it (your node leads, help
  // follows unless help={false}); pass utility={false} to suppress the
  // whole cluster, help included.
  utility,
  // How the header CONTENT sits inside the full-bleed band the shell
  // paints (AppLayoutShell renders the header edge-to-edge; this decides
  // where its content lands within it):
  //   "center"  — capped at the DS content width (--breakpoint-lg) and
  //               CENTRED, so it lines up with the body, which the DS's
  //               GlobalLayoutContent also caps + centres. This is the
  //               default and the right choice for almost every page.
  //   "justify" — no cap: crumbs/title hard-left, actions hard-right at
  //               the band edges (full-width toolbar look).
  // (Ali, 21 Jul — the body is centred, so a left-aligned header cap
  // drifted right of it; centring here is the auto-margin that fixes it.)
  align = "center",
  // Help/support entry point top-right on EVERY page (snag 8, Ali 22
  // Jul) — a quiet icon button opening a support popover. Pass
  // help={false} to hide on a specific screen.
  help = true,
  dataHook = "page-header",
  // Anchor-id pass-through — see AppLayoutShell's rest note.
  ...rest
}) {
  const data = useProposalData();
  const bindLastUpdated = lastUpdated === "auto" || lastUpdated === true;
  const lastUpdatedValue = bindLastUpdated
    ? (data.aiInsights?.lastUpdated ?? null)
    : lastUpdated || null;

  // breadcrumbs={false} suppresses the trail. The UTILITY ROW goes with
  // it (spec decision (a), Ali 18 Aug): a row whose left half is empty
  // is just a band of whitespace, so on title-only pages the utility
  // cluster COLLAPSES into the title row's right cluster, leading the
  // actions. The cost is that help isn't at a fixed screen position on
  // those pages; the empty-band alternative read worse.
  const hasTrail = breadcrumbs !== false;
  const trail = (hasTrail ? breadcrumbs : [])
    // Trail is ANCESTORS ONLY, max two (the H2 is the current page).
    // Enforced here, not just documented — a screen passing a three-deep
    // "All Locations > … > …" trail is clamped to the DEEPEST two
    // (nearest the current page), so the immediate parent always
    // survives the trim (Ali, 20 Jul).
    .slice(-2)
    // DATA-BOUND crumb: { bind: "location" } resolves to the CURRENT
    // location's name at render position — "All Locations > Blackberry
    // Farm Park" follows dataset switches with zero per-screen wiring
    // (Ali, 18 Jul).
    .map((crumb) =>
      crumb.bind === "location" ? { ...crumb, label: data.location.name } : crumb,
    );
  // MOBILE (below sm) shows the LAST crumb only, behind a back arrow
  // (Ali, 18 Aug): the nearest ancestor IS "back", and a two-deep trail
  // on a phone wraps word-per-line. Full trail from sm up.
  const backCrumb = trail.length ? trail[trail.length - 1] : null;

  const helpButton = help ? (
    // Deliberately quiet ("doesn't need to be mega bright"):
    // muted icon, fills on hover.
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Help and support"
          data-hook={`${dataHook}-help`}
          className="text-muted-foreground hover:text-foreground rounded-full p-1.5 transition-colors hover:bg-[light-dark(var(--ds-tailwind-colors-neutral-100),var(--ds-tailwind-colors-neutral-800))]"
        >
          <HelpCircle className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-2 text-sm">
        <p className="font-semibold">Help &amp; support</p>
        <div className="flex flex-col gap-1.5 text-[var(--ds-tailwind-colors-neutral-600)]">
          <span className="cursor-pointer hover:text-[var(--ds-tailwind-colors-neutral-900)]">Search the help centre</span>
          <span className="cursor-pointer hover:text-[var(--ds-tailwind-colors-neutral-900)]">Contact support</span>
          <span className="cursor-pointer hover:text-[var(--ds-tailwind-colors-neutral-900)]">What's new</span>
        </div>
      </PopoverContent>
    </Popover>
  ) : null;
  const utilityNodes =
    utility === false ? null : (
      <>
        {utility ?? null}
        {helpButton}
      </>
    );
  const hasUtility = utility !== false && (utility || helpButton);

  const clusterClass =
    "flex shrink-0 flex-wrap items-center gap-[var(--gds-page-header-cluster-gap,0.5rem)]";

  return (
    // w-full is LOAD-BEARING: inside GlobalLayoutContentHeader the
    // header block otherwise spans content width only, and
    // justify-between has nothing to distribute — actions hugged the
    // title (16 Jul screenshot).
    //
    // THE VARIABLE SEAM (Ali, 18 Aug — same contract as navDensity on
    // AppLayoutShell): every size and gap below reads a --gds-page-header-*
    // variable with the default as its fallback, so a screen tunes the
    // header by SETTING THE VARIABLE on any ancestor and never by
    // restyling the component. Deliberately no className passthrough for
    // sizing — that reopens the every-screen-restyles-the-header problem
    // this module exists to prevent.
    //
    //   --gds-page-header-title-size     1.875rem (30px, text-3xl)
    //   --gds-page-header-title-leading  2.25rem  (36px)
    //   --gds-page-header-title-weight   600
    //   --gds-page-header-crumb-size     0.875rem (14px)
    //   --gds-page-header-row-gap        1rem
    //   --gds-page-header-cluster-gap    0.5rem
    //
    // The title default is text-3xl, NOT the DS's TypographyH2 (which is
    // text-3xl mobile / text-4xl from md up). 36px was oversized for a
    // dense working page, so the header holds one size below the DS
    // heading at every width; the element stays an h2.
    <div
      {...rest}
      // Persistent region across goto swaps — see the sidebar's
      // view-transition-name note.
      style={{ viewTransitionName: "gds-page-header", ...(rest?.style ?? {}) }}
      data-hook={dataHook}
      className={[
        "flex w-full min-w-0 flex-col gap-[var(--gds-page-header-row-gap,1rem)]",
        // "center" caps + centres to match the body; "justify" fills the
        // band edge-to-edge. mx-auto is the load-bearing bit — the DS
        // body is centred, so without it the header drifts left of it.
        //
        // THE CAP MUST BE THE DS's OWN TOKEN (Ali, 18 Aug — "the Review
        // Insights page doesn't constrain the contents"). GlobalLayoutContent
        // caps the BODY at `var(--ds-breakpoint-lg)` (its maxWidth default,
        // verified in the 2.25.0 dist), and content-header/content-actions
        // do the same. This was capping at `--breakpoint-lg` — Tailwind's
        // own theme variable, which is only 1024px if Tailwind's theme is
        // in scope. Two variables for one measurement is exactly the drift
        // this file keeps getting bitten by: the header and the body must
        // read the SAME token or they cannot be guaranteed to line up.
        align === "justify"
          ? ""
          : "mx-auto max-w-[var(--gds-content-max-width,var(--ds-breakpoint-lg))]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ROW 1 — UTILITY: breadcrumbs left, utility cluster right. */}
      {hasTrail ? (
        <div className="flex min-w-0 items-center justify-between gap-4">
          {trail.length === 0 ? (
            // CRUMB-LESS pages (All Locations — the trail's root) keep the
            // breadcrumb row's FOOTPRINT so the header band is the same
            // height on every page and nothing jumps on navigation (Ali,
            // 22 Jul). Same components rendered invisible — the reserved
            // height can never drift from the real trail's. Pass
            // breadcrumbs={false} instead to drop the row altogether.
            <Breadcrumb
              aria-hidden
              dataHook={`${dataHook}-breadcrumb-spacer`}
              className="invisible select-none text-[length:var(--gds-page-header-crumb-size,0.875rem)]"
            >
              <BreadcrumbList>
                <BreadcrumbItem>
                  <span className="whitespace-nowrap">&nbsp;</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <>
              {/* MOBILE: the nearest ancestor only, as a back link. */}
              <Breadcrumb
                dataHook={`${dataHook}-breadcrumb-back`}
                className="min-w-0 text-[length:var(--gds-page-header-crumb-size,0.875rem)] sm:hidden"
              >
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={backCrumb.href ?? "#"}
                      data-grade-goto={backCrumb.goto}
                      data-grade-transition={backCrumb.transition}
                      className="inline-flex min-w-0 items-center gap-1.5"
                    >
                      <ArrowLeft className="size-4 shrink-0" />
                      <span className="truncate">{backCrumb.label}</span>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              {/* sm+: the full trail. */}
              <Breadcrumb
                dataHook={`${dataHook}-breadcrumb`}
                className="hidden min-w-0 text-[length:var(--gds-page-header-crumb-size,0.875rem)] sm:block"
              >
                <BreadcrumbList>
                  {trail.map((crumb, i) => (
                    <React.Fragment key={crumb.label}>
                      {/* Separator BETWEEN crumbs — the DS's Breadcrumb is
                          shadcn-family: separators are explicit siblings,
                          not auto-inserted (they were silently missing —
                          Ali, 18 Jul). */}
                      {i > 0 ? <BreadcrumbSeparator /> : null}
                      <BreadcrumbItem>
                        {/* crumb.goto — screen link (STUDIO-FLOWS):
                            ancestors are usually other screens in the flow,
                            so crumbs navigate in shares/embeds. {label,
                            href?, goto?, transition?}. */}
                        <BreadcrumbLink
                          href={crumb.href ?? "#"}
                          data-grade-goto={crumb.goto}
                          data-grade-transition={crumb.transition}
                          // Wrap BETWEEN crumbs, never inside one — a crumb
                          // breaking word-per-line reads as layout failure.
                          className="whitespace-nowrap"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </>
          )}
          {hasUtility ? (
            <div data-hook={`${dataHook}-utility`} className={`${clusterClass} ml-auto`}>
              {utilityNodes}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ROW 2 — TITLE: title left, CTAs right, centred on the title.
          Below sm the cluster drops to its own line rather than crushing
          the title column against it (the 17 Jul screenshot). */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <TypographyH2
          dataHook={`${dataHook}-title`}
          // pb-0: the DS heading carries pb-2, which would stack on top
          // of the row gap and put the seam out of one place's control.
          className="min-w-0 pb-0"
          style={{
            fontSize: "var(--gds-page-header-title-size, 1.875rem)",
            lineHeight: "var(--gds-page-header-title-leading, 2.25rem)",
            fontWeight: "var(--gds-page-header-title-weight, 600)",
          }}
        >
          {title}
        </TypographyH2>
        {actions || (!hasTrail && hasUtility) ? (
          <div className={`${clusterClass} sm:ml-auto`}>
            {/* Collapsed utility LEADS the actions on title-only pages. */}
            {!hasTrail && hasUtility ? (
              <div data-hook={`${dataHook}-utility`} className={clusterClass}>
                {utilityNodes}
              </div>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>

      {/* ROW 3 — SUBTITLE: description/meta left, "Last updated" right,
          bottom-aligned so it sits level with the description's last
          line (Ali, 21 Jul — it keeps its dedicated slot, it just isn't
          sharing a column with the CTAs any more). */}
      {description || meta || lastUpdatedValue ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            {description ? (
              // A measure so the description reads as a subtitle, not a
              // paragraph running the full width (Ali, 20 Jul).
              <p
                data-hook={`${dataHook}-description`}
                className="max-w-2xl text-sm leading-relaxed text-muted-foreground"
              >
                {description}
              </p>
            ) : null}
            {meta ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {meta}
              </div>
            ) : null}
          </div>
          {lastUpdatedValue ? (
            <span
              data-hook={`${dataHook}-last-updated`}
              className="shrink-0 text-xs text-muted-foreground sm:ml-auto"
            >
              Last updated: {formatDate(lastUpdatedValue)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── HubStatCard ──────────────────────────────────────────────────────
// The canonical arrangement: icon → title → chevron (drill-down) →
// description → metric (+ delta). `metric` and `delta` accept
// ReactNodes so screens can pass richer values (a formatted number, a
// sparkline) without changing the seam.
export function HubStatCard({
  icon: Icon,
  title,
  // Data binding: name a key in data.metrics ("reviews", "rankings",
  // …) and the card reads metric/delta/description from the proposal
  // data context AT RENDER POSITION — so it follows dataset switches
  // (tweaker or provider). Explicit props win over the bound values.
  metricKey,
  description,
  metric,
  delta,
  // Screen link (STUDIO-FLOWS): name of the screen this card drills
  // into — stamps data-grade-goto; shares/embeds navigate on click.
  // `transition` picks the swap treatment (data on the link).
  goto,
  transition,
  // ctaHook names the chevron (the card's single drill-down control —
  // footer CTAs were dropped once the chevron landed; two buttons to
  // the same place was noise).
  ctaHook,
  dataHook,
  // Everything else (data-* stamps, aria) rides through to the Card —
  // user-land components must not swallow wire-contract attributes.
  ...rest
}) {
  const data = useProposalData();
  const bound = metricKey ? data.metrics?.[metricKey] : undefined;
  metric = metric ?? bound?.metric;
  delta = delta ?? bound?.delta;
  description = description ?? bound?.description;
  // The whole card is a drill-down target (wire navigation per-screen;
  // the chevron is the named control for keyboard/AT users). No hover
  // treatment — resting state stays border-only per the Figma, and the
  // chevron's own hover carries the affordance.
  return (
    <Card
      density="condensed"
      className="max-w-none cursor-pointer"
      dataHook={dataHook}
      data-grade-goto={goto}
      data-grade-transition={transition}
      {...rest}
    >
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {/* Icon tile pinned to neutral-50 — the faintest step, so
                it reads on BOTH a raised white card and a regular
                default/filled card without riding the muted token
                (which the raised layer bumps to neutral-100). */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-neutral-50),var(--ds-tailwind-colors-neutral-800))]">
              <Icon className="size-4" />
            </div>
            {/* DS scale reference (2.20.0): CardTitle default =
                text-2xl font-medium (too big here); size="small" =
                text-base — the sanctioned smaller title. Weight bumped
                to semibold; size stays on their scale. */}
            <CardTitle size="small" className="font-semibold">
              {title}
            </CardTitle>
            {/* Drill-down affordance — mirrors the whole-card click
                target for pointer users and gives AT/keyboard a
                focusable control. */}
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              className="ml-auto shrink-0"
              ariaLabel={`Open ${typeof title === "string" ? title : "module"}`}
              dataHook={ctaHook ? `${ctaHook}-chevron` : undefined}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold tracking-tight">
            {metric}
          </span>
          {/* Badge, NOT Chip — BL's Chip always renders a remove ✕
              (it's a dismissible input); Badge is the read-only
              status/delta component. */}
          {delta ? <Badge variant="secondary">{delta}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── StatCard — the compact metric tile ───────────────────────────────
// The consistency-critical primitive: label → value (+delta badge /
// trend icon) → optional info tooltip. INHERITS FROM CARD (variant
// "filled", condensed density) and owns its anatomy — never hand-roll
// Card + pt-6 for a stat tile (BL's Card already pads content; the
// shadcn pt-6 idiom double-pads and reads as an oversized top gap).
//
// ONE tone knob for consistency: it colors the value, the trend icon
// AND the delta badge together. Presets only — no per-part styling.
const STAT_TONES = {
  default: {
    value: "",
    icon: "text-muted-foreground",
    badge: "border-transparent bg-success-background text-success-foreground",
  },
  success: {
    value: "text-emerald-600",
    icon: "text-emerald-600",
    badge: "border-transparent bg-success-background text-success-foreground",
  },
  destructive: {
    value: "text-rose-600",
    icon: "text-rose-600",
    badge: "border-transparent bg-destructive/10 text-destructive",
  },
  neutral: { value: "", icon: "text-muted-foreground", badge: "" },
};

export function StatCard({
  // Small uppercase label above the value ("Average Position").
  label,
  // Data binding: key into data.metrics — value/delta read from the
  // proposal data context at render position (dataset switches reach
  // the tile). Explicit props win.
  metricKey,
  value,
  // Small Badge beside the value ("+4.2% vs last month", "improving").
  delta,
  // ONE knob: colors value + trend icon + delta badge as a set.
  tone = "default", // "default" | "success" | "destructive" | "neutral"
  // Optional trend icon rendered after the value (TrendingUp/Down).
  icon: IconCmp,
  // Info tooltip text — renders the ghost (i) button top-right.
  info,
  // Card level: "page" sits on the canvas (white card on the raised
  // layer); "nested" sits ON another card — steps down to the
  // neutral-50 tier with a border so a stat row can live at the top of
  // a bigger module card.
  level = "page", // "page" | "nested"
  // Screen link (STUDIO-FLOWS) — stamps data-grade-goto/-transition.
  goto,
  transition,
  dataHook,
  // Layout-only className (grid placement); pass-through for data-*.
  className,
  ...rest
}) {
  const data = useProposalData();
  const bound = metricKey ? data.metrics?.[metricKey] : undefined;
  value = value ?? bound?.metric;
  delta = delta ?? bound?.delta;
  const t = STAT_TONES[tone] ?? STAT_TONES.default;
  return (
    <Card
      variant="filled"
      density="condensed"
      dataHook={dataHook}
      data-grade-goto={goto}
      data-grade-transition={transition}
      className={[
        "max-w-none",
        level === "nested"
          ? "border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-neutral-50),var(--ds-tailwind-colors-neutral-800))]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <CardContent>
        <div className="flex items-start justify-between gap-2">
          <TypographyMuted className="text-xs font-semibold uppercase">
            {label}
          </TypographyMuted>
          {info ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    className="-mt-1 -mr-1 size-7 shrink-0"
                    ariaLabel={`About ${typeof label === "string" ? label : "this metric"}`}
                    dataHook={dataHook ? `${dataHook}-info` : undefined}
                  >
                    <Info className="text-muted-foreground size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{info}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`text-3xl font-bold tracking-tight ${t.value}`}>
            {value}
          </span>
          {delta ? (
            tone === "neutral" ? (
              <Badge variant="secondary">{delta}</Badge>
            ) : (
              <Badge className={t.badge}>{delta}</Badge>
            )
          ) : null}
          {IconCmp ? <IconCmp className={`size-5 self-center ${t.icon}`} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── HubHeroCard ──────────────────────────────────────────────────────
export function HubHeroCard({
  title,
  description,
  primaryCta = "Get started",
  primaryHook,
  secondaryCta,
  secondaryHook,
  media,
  // Media proportion presets — Tailwind aspect utilities. "4/3" is the
  // default (video read too letterboxy at w-2/5); "square" for
  // illustration-led heroes.
  mediaAspect = "4/3", // "4/3" | "square" | "video"
  // Screen link (STUDIO-FLOWS) — stamps data-grade-goto/-transition.
  goto,
  transition,
  dataHook,
  // Pass-through — same rule as HubStatCard.
  ...rest
}) {
  const MEDIA_ASPECTS = {
    "4/3": "aspect-[4/3]",
    square: "aspect-square",
    video: "aspect-video",
  };
  const aspect = MEDIA_ASPECTS[mediaAspect] ?? MEDIA_ASPECTS["4/3"];
  // condensed density bakes px-3 on the card — too tight for a hero.
  // px-6 wins the merge (same utility group); vertical rhythm stays
  // condensed.
  return (
    <Card
      density="condensed"
      className="max-w-none px-6"
      dataHook={dataHook}
      data-grade-goto={goto}
      data-grade-transition={transition}
      {...rest}
    >
      <CardContent>
        <div className="flex items-center gap-8">
          {/* Copy column */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-3 py-4">
            <TypographyH3>{title}</TypographyH3>
            <p className="text-muted-foreground max-w-prose text-sm">
              {description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button dataHook={primaryHook}>{primaryCta}</Button>
              {secondaryCta ? (
                <Button variant="ghost" dataHook={secondaryHook}>
                  {secondaryCta}
                </Button>
              ) : null}
            </div>
          </div>
          {/* Media column — hidden below md; proportion owned by the
              aspect preset so real media and the placeholder agree. */}
          <div className={`hidden w-2/5 shrink-0 md:block ${aspect}`}>
            {media ?? (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-neutral-50),var(--ds-tailwind-colors-neutral-800))]">
                <Sparkles className="text-muted-foreground size-6" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


// ─── LocationCard — the All Locations grid tile ───────────────────────
// Mirrors the live platform's location card (18 Jul screenshot): photo
// (or the No-photo placeholder on the green-tinted neutral wash), name,
// then icon rows — place, category, phone. Rows self-skip when the
// data lacks a field (the client's real list is patchy). `goto` /
// `transition` stamp the flow attributes on the whole card;
// `loading` renders the skeleton state instead (same footprint, no
// layout shift when the real card lands).
// ONE document-level capture listener: any click on (or inside) an
// element carrying data-grade-dataset stashes that dataset for the
// session. Capture phase = ordered before the sandbox goto listener
// and independent of React's event delegation.
let datasetClickListenerInstalled = false;
function ensureDatasetClickListener() {
  if (datasetClickListenerInstalled) return;
  datasetClickListenerInstalled = true;
  try {
    document.addEventListener(
      "click",
      (e) => {
        const el = e.target?.closest?.("[data-grade-dataset]");
        if (el) selectSessionDataset(el.getAttribute("data-grade-dataset"));
      },
      true,
    );
  } catch {
    /* no document (SSR) — the component call re-tries on mount render */
  }
}

export function LocationCard({
  // Either a `location` object ({ name, city, postcode, category,
  // phone, photo?, status? }) or individual props; the object wins
  // field-wise.
  location,
  name,
  city,
  postcode,
  category,
  phone,
  photo,
  status,
  goto,
  transition,
  loading = false,
  // DS Card density — "condensed" (py-3/px-3) matches the live
  // platform's tighter tiles; the default Card py-8/px-8 read bloated
  // in a grid (Ali, 18 Jul). Pass "default" to get the roomy card.
  density = "condensed",
  dataHook = "location-card",
  className,
  ...rest
}) {
  const loc = location ?? {};
  // Optional per-location dataset (location.dataset or the `dataset`
  // prop): clicking the card stashes it in the session layer BEFORE the
  // goto fires, so the destination hub shows THE CLICKED location — the
  // fix for "clicking a location loads the wrong one" (snag 4).
  // Locations without a dataset just navigate. The write rides a NATIVE
  // capture-phase listener on [data-grade-dataset] (installed once) —
  // React's delegated onClick proved unreliable next to the sandbox's
  // goto listener (verified 22 Jul: goto fired, onClick didn't).
  const vDataset = loc.dataset ?? rest.dataset;
  delete rest.dataset;
  ensureDatasetClickListener();
  const vName = loc.name ?? name;
  const vCity = loc.city ?? city;
  const vPostcode = loc.postcode ?? postcode;
  const vCategory = loc.category ?? category;
  const vPhone = loc.phone ?? phone;
  const vPhoto = loc.photo ?? photo;
  const vStatus = loc.status ?? status;
  if (loading) {
    return <LocationCardSkeleton dataHook={`${dataHook}-skeleton`} />;
  }
  return (
    <Card
      {...rest}
      variant="filled"
      density={density}
      dataHook={dataHook}
      data-grade-goto={goto}
      data-grade-transition={transition}
      data-grade-dataset={vDataset}
      className={[
        "max-w-none",
        goto ? "group cursor-pointer transition-shadow hover:shadow-sm" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardContent className="flex flex-col gap-4">
        {/* Photo / placeholder — fixed aspect so card heights align
            regardless of photo availability. 8px inner-media radius
            against the 20px card (Ali, 24 Jul — corrected from the
            4px first cut). */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[var(--ds-tailwind-colors-neutral-100)]">
          {vPhoto ? (
            <img
              src={vPhoto}
              alt={vName}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--ds-tailwind-colors-neutral-500)]">
              <ImageOff className="size-8" />
              <span className="text-sm">No photo available</span>
            </div>
          )}
          {/* Status pill REMOVED (Ali, 24 Jul: "lose the badge") — the
              live-site parity pill read as noise on the tile. The
              status field still arrives in the data; nothing renders
              it here any more. In its corner FLOATS the DrillArrow
              (Ali's mock) — only when the card actually goes
              somewhere, same rule as the hub cards. */}
          {goto ? (
            <span className="absolute right-3 top-3">
              <DrillArrow variant="glass" dataHook={`${dataHook}-drill-arrow`} />
            </span>
          ) : null}
        </div>
        {/* +8px left/right/bottom on the text content (Ali's mock,
            24 Jul): the photo sits at the card padding, the words sit
            a step further in. */}
        <div className="flex flex-col gap-3 px-2 pb-2">
          <TypographyH3
            dataHook={`${dataHook}-name`}
            className="text-xl leading-snug"
          >
            {vName}
          </TypographyH3>
          <div className="flex flex-col gap-2 text-sm text-[var(--ds-tailwind-colors-neutral-600)]">
            {vCity ? (
              <span className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0" />
                {[vCity, vPostcode].filter(Boolean).join(", ")}
              </span>
            ) : null}
            {vCategory ? (
              <span className="flex items-center gap-2.5">
                <Tag className="size-4 shrink-0" />
                {vCategory}
              </span>
            ) : null}
            {vPhone ? (
              <span className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0" />
                {vPhone}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton twin — identical footprint (photo block, name line, three
// rows) so a loading grid doesn't shift when data lands.
export function LocationCardSkeleton({ dataHook = "location-card-skeleton" }) {
  return (
    <Card
      variant="filled"
      density="condensed"
      dataHook={dataHook}
      className="max-w-none"
    >
      <CardContent className="flex flex-col gap-4">
        <Skeleton
          dataHook={`${dataHook}-photo`}
          className="aspect-[16/9] w-full rounded-lg"
        />
        <div className="flex flex-col gap-3 px-2 pb-2">
          <Skeleton dataHook={`${dataHook}-name`} className="h-6 w-2/3" />
          <div className="flex flex-col gap-2">
            <Skeleton dataHook={`${dataHook}-row-1`} className="h-4 w-1/2" />
            <Skeleton dataHook={`${dataHook}-row-2`} className="h-4 w-2/5" />
            <Skeleton dataHook={`${dataHook}-row-3`} className="h-4 w-1/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── EmptyPrototypePage — the standard "not available yet" state ──────
// The blank-page fill for pages this proposal doesn't implement.
// Promoted from the Set-up Tasks screen (Ali, 24 Jul — approved, then
// "push it"). NO dashed outline: an SVG Globey mascot in a 4:3 zone, a
// header, and descriptive copy. SVG (not the raster scene) so it stays
// crisp at any size and flips itself in dark mode (the illustration
// ships a light/dark twin). Gentle idle FLOAT + occasional BLINK, both
// reduced-motion-gated. Defaults carry THIS project's standard copy so
// every blank page inherits it DRY (`title` + `description`); the
// mascot is overridable (Ali).
//
// NOTE: roll-out to the other blank pages is Ali-gated — do NOT swap
// any screen's placeholder for this until told (he owns the timing).

// Blink: swap the open eye-frame for the closed one on a randomised
// timer (same viewBox → no layout shift). matchMedia gate skips it
// under reduced motion.
function GlobeyBlink({
  open: Open = GlobeyCalmOpen1,
  closed: Closed = GlobeyCalmClosed,
  className,
}) {
  const [blinking, setBlinking] = React.useState(false);
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let t;
    const loop = () => {
      setBlinking(true);
      t = setTimeout(() => {
        setBlinking(false);
        t = setTimeout(loop, 2600 + Math.random() * 2600); // 2.6–5.2s
      }, 140);
    };
    t = setTimeout(loop, 1800 + Math.random() * 1800);
    return () => clearTimeout(t);
  }, []);
  const Face = blinking ? Closed : Open;
  return <Face className={className} aria-hidden />;
}

// Bold reference to a screen name inside the description (Ali chose
// bold over links — a live link mid-demo is a footgun; the walkthrough
// teaches the pattern by being clicked).
function EmptyStateRef({ children }) {
  return (
    <span className="font-semibold text-[var(--ds-tailwind-colors-neutral-900)]">
      {children}
    </span>
  );
}

export function EmptyPrototypePage({
  title = "This feature isn't available yet",
  // Default copy is project-level (what IS in the prototype) so every
  // blank page shares it. NO EM DASHES (Ali). Override per page if a
  // screen needs bespoke wording.
  description = (
    <>
      This feature isn't available yet. <EmptyStateRef>All Locations</EmptyStateRef>,
      the <EmptyStateRef>Location Home</EmptyStateRef>,{" "}
      <EmptyStateRef>AI Insights</EmptyStateRef>, and one page deep for the{" "}
      <EmptyStateRef>Location Grid</EmptyStateRef>.
    </>
  ),
  mascot = GlobeyCalmOpen1,
  mascotClosed = GlobeyCalmClosed,
  dataHook = "empty-prototype-page",
}) {
  return (
    <div
      data-hook={dataHook}
      className="flex min-h-[60vh] items-center justify-center py-6"
    >
      {/* Float keyframe, scoped + reduced-motion-gated. */}
      <style>{
        "@keyframes gds-empty-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}" +
        "@media (prefers-reduced-motion:no-preference){[data-bl-empty-float]{animation:gds-empty-float 4.5s ease-in-out infinite}}"
      }</style>
      <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        {/* Mascot in a 4:3 zone on the softest brand-neutral wash. */}
        <div className="flex aspect-[4/3] w-full max-w-[300px] items-center justify-center rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)]">
          <span data-bl-empty-float className="inline-flex">
            <GlobeyBlink open={mascot} closed={mascotClosed} className="h-40 w-auto" />
          </span>
        </div>
        <div className="flex max-w-md flex-col gap-2">
          {/* Mobile text overrides: title xl→2xl, body sm→base. */}
          <h2
            className="text-xl leading-snug text-[var(--ds-tailwind-colors-neutral-900)] sm:text-2xl"
            style={{
              fontFamily: "var(--ds-font-font-display, Poppins)",
              fontWeight: "var(--ds-font-weight-semibold, 600)",
            }}
          >
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-500)] sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── RankGrid — the Local Search Grid viz, and ONLY the viz ───────────
// (Promoted 23 Jul with TWO real consumers — the LSG page's full view
// and the hub card's mini — per the composability lesson: the lib gets
// the CORE grid; selects/legend/zoom/toggles stay screen-side chrome.)
// Data shape: rows of ranks, null = unranked/over-20 (renders "-").
// Bands match the live legend via the DS pin variants: 1-3 strong /
// 4-10 moderate / 11-20 weak / else unranked (red).
// ZOOM CONTRACT (Ali, 23 Jul — for the real-map integration): pinSize
// is the lever a zoom handler drives (size ∝ zoom step) and the map
// must CLAMP zoom to sane min/max bounds — the live product lets pins
// OVERLAP at low zoom (ledgered in rules/90-audit.md). Static surfaces
// (this stand-in, hub minis) simply pass a fixed pinSize.
export function rankVariant(rank) {
  if (rank == null || rank > 20) return "unranked";
  if (rank <= 3) return "strong";
  if (rank <= 10) return "moderate";
  return "weak";
}

export function RankGrid({
  // rows of ranks (number | null), any rectangular shape.
  grid = [],
  // The business-location pin over the grid centre. Hidden by default
  // (Ali, 23 Jul) — the LSG page opts in and pairs it with a toggle.
  showLocationPin = false,
  // "full" (LSG page: DS-default 32px pins) | "mini" (hub card: 24px,
  // tighter gaps). Presets only — pinSize/gap below beat them.
  size = "full",
  // Explicit overrides (px). INLINE STYLE on purpose: numbers can't
  // become Tailwind classes at runtime (the sandbox compiles source,
  // not constructed strings), and style beats the pin's baked size-8.
  pinSize,
  gap,
  // STATIC by default (Ali, 23 Jul): minis/posters are decorative —
  // no cursor, no hover, pins aria-hidden. `interactive` is the full-
  // page mode: pins become buttons with a hover affordance and fire
  // onPinClick(rank, index) — the seam a screen wires to the DS
  // MapPopover pattern (useMapPopoverClick) when pin drill-down lands.
  interactive = false,
  onPinClick,
  // The grid ALWAYS displays in its map context (Ali, 23 Jul): a
  // stand-in surface (muted panel + dot texture, the LSG canvas look)
  // wraps it BY DEFAULT — pins never float bare on a card. Opt out
  // ONLY when the screen supplies its own bigger surface (the LSG page
  // does: its legend/zoom/toggle chrome lives inside its canvas).
  // Swaps for real map tiles when the Google Maps key lands.
  surface = true,
  dataHook = "rank-grid",
  className = "",
}) {
  const cols = grid[0]?.length ?? 7;
  const mini = size === "mini";
  const pinPx = pinSize ?? (mini ? 24 : 32);
  const gapPx = gap ?? (mini ? 8 : 20);
  // Value text tracks the pin diameter (~1/3), floored for legibility.
  const pinStyle =
    pinPx === 32
      ? undefined
      : { width: pinPx, height: pinPx, fontSize: Math.max(9, Math.round(pinPx * 0.34)) };
  const body = (
    <div className="relative inline-block">
      <div
        data-hook={dataHook}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: gapPx,
        }}
      >
        {grid.flat().map((rank, i) =>
          interactive ? (
            <button
              key={i}
              type="button"
              data-hook={`${dataHook}-pin-btn-${i}`}
              className="cursor-pointer rounded-full transition-transform hover:scale-110 focus-visible:scale-110"
              onClick={onPinClick ? () => onPinClick(rank, i) : undefined}
            >
              <MapGridPin
                dataHook={`${dataHook}-pin-${i}`}
                value={rank ?? "-"}
                variant={rankVariant(rank)}
                style={pinStyle}
              />
            </button>
          ) : (
            <MapGridPin
              key={i}
              aria-hidden
              dataHook={`${dataHook}-pin-${i}`}
              value={rank ?? "-"}
              variant={rankVariant(rank)}
              style={pinStyle}
            />
          ),
        )}
      </div>
      {showLocationPin ? (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MapLocationPin dataHook={`${dataHook}-location-pin`} animateIn />
        </span>
      ) : null}
    </div>
  );
  if (!surface) {
    return className ? <div className={className}>{body}</div> : body;
  }
  return (
    <div
      data-hook={`${dataHook}-surface`}
      className={[
        "relative flex items-center justify-center overflow-hidden rounded-xl bg-[var(--ds-tailwind-colors-neutral-100)] p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--ds-tailwind-colors-neutral-300) 1px, transparent 1.4px)",
          backgroundSize: "22px 22px",
          opacity: 0.5,
        }}
      />
      <div className="relative">{body}</div>
    </div>
  );
}
