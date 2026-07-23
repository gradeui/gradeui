// @brightlocal/proposal-page — page furniture: PageHeader and the
// card family (StatCard, HubStatCard, HubHeroCard). Split out of
// proposal.jsx (18 Jul); the barrel re-exports.
import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
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

// ─── CardTitleLink — the clickable-card title treatment ───────────────
// Feature cards whose WHOLE card is a link (hub cards, module cards)
// title in the brand's clickable colour. ONE token seam: the colour
// reads `--bl-card-link` first (re-point it in a theme/scope to restyle
// every clickable title at once) and falls back to the dark brand green
// GREEN-AT-REST REMOVED (Ali, 22 Jul: "getting rid of the cards having
// green header text… just too many colours") — titles sit in the
// normal card foreground now, and CLICKABILITY reads through the hover
// alone: data-bl-link gives the green-700 + underline treatment on
// hover of the title OR of the whole [data-grade-goto] card (the
// shell's CLICKABLE-LINK TOKENS rules). The --bl-card-link seam still
// colours inline text links and accordion action rows at rest.
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
  actions,
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
  return (
    // w-full is LOAD-BEARING: inside GlobalLayoutContentHeader the
    // header block otherwise spans content width only, and
    // justify-between has nothing to distribute — actions hugged the
    // title (16 Jul screenshot). flex-1/ml-auto belt-and-braces so the
    // actions pin to the far right even in odd flex parents.
    // RESPONSIVE: a single row only from sm up. Below that the header
    // STACKS — crumbs/title/meta first, actions on their own row
    // underneath — instead of crushing the title column against the
    // actions (the word-per-line breadcrumb wrap, 17 Jul screenshot).
    <div
      {...rest}
      // Persistent region across goto swaps — see the sidebar's
      // view-transition-name note.
      style={{ viewTransitionName: "gds-page-header", ...(rest?.style ?? {}) }}
      data-hook={dataHook}
      className={[
        "flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        // "center" caps + centres to match the body; "justify" fills the
        // band edge-to-edge. mx-auto is the load-bearing bit — the DS
        // body is centred, so without it the header drifts left of it.
        align === "justify" ? "" : "mx-auto max-w-[var(--breakpoint-lg)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        {breadcrumbs.length === 0 ? (
          // CRUMB-LESS pages (All Locations — the trail's root) keep the
          // breadcrumb row's FOOTPRINT so the header band is the same
          // height on every page and nothing jumps on navigation (Ali,
          // 22 Jul). Same components rendered invisible — the reserved
          // height can never drift from the real trail's.
          <Breadcrumb
            aria-hidden
            dataHook={`${dataHook}-breadcrumb-spacer`}
            className="invisible mb-4 select-none"
          >
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="whitespace-nowrap">&nbsp;</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          // mb-4: breathing room between the trail and the H1 (Ali, 20 Jul).
          <Breadcrumb dataHook={`${dataHook}-breadcrumb`} className="mb-4">
            <BreadcrumbList>
              {breadcrumbs
                // Trail is ANCESTORS ONLY, max two (the H2 is the current
                // page). Enforced here, not just documented — a screen
                // passing a three-deep "All Locations > … > …" trail is
                // clamped to the DEEPEST two (nearest the current page),
                // so the immediate parent always survives the trim (Ali,
                // 20 Jul).
                .slice(-2)
                // DATA-BOUND crumb: { bind: "location" } resolves to the
                // CURRENT location's name at render position — "All
                // Locations > Blackberry Farm Park" follows dataset
                // switches with zero per-screen wiring (Ali, 18 Jul).
                .map((crumb) =>
                  crumb.bind === "location"
                    ? { ...crumb, label: data.location.name }
                    : crumb,
                )
                .map((crumb, i) => (
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
        )}
        <TypographyH2 dataHook={`${dataHook}-title`}>{title}</TypographyH2>
        {description ? (
          // mt-3 + a measure so the description reads as a subtitle with
          // air around it, not crammed under the H1 (Ali, 20 Jul).
          <p
            data-hook={`${dataHook}-description`}
            className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        ) : null}
        {meta ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
      {/* RIGHT column (Ali, 21 Jul): actions live top-right; "Last
          updated" has a DEDICATED slot bottom-right — smaller text,
          bottom-aligned so it sits level with the description line.
          self-stretch makes justify-between real; on stacked mobile the
          column becomes a plain wrapping row. */}
      {actions || lastUpdatedValue || help ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto sm:flex-col sm:items-end sm:justify-between sm:self-stretch">
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {help ? (
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
            ) : null}
          </div>
          {lastUpdatedValue ? (
            <span
              data-hook={`${dataHook}-last-updated`}
              className="text-xs text-muted-foreground"
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
        goto ? "cursor-pointer transition-shadow hover:shadow-md" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardContent className="flex flex-col gap-4">
        {/* Photo / placeholder — fixed aspect so card heights align
            regardless of photo availability. */}
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
          {/* Status pill ON the image, top-right — live-site parity.
              primary = the DS's green success badge; outline carries its
              own bg-background fill so it stays legible over photos. */}
          {vStatus ? (
            <Badge
              variant={vStatus === "Active" ? "primary" : "outline"}
              dataHook={`${dataHook}-status`}
              className="absolute right-3 top-3"
            >
              {vStatus}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-3">
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

// ─── MetricHubCard — the standard hub metric-card anatomy ─────────────
// (Ali's mock, 23 Jul; promoted from the hub screen 23 Jul — Reviews +
// Rankings wear it, Citations/GBP next.) Title + soft-green TREND pill;
// circular drill arrow top-right (the whole card is the goto link, the
// circle is its visual handle); muted stat label; BIG display-type
// value + muted context + optional green delta; then children (the
// data viz). Values should be DERIVED from the viz data where
// possible, never authored twice.
export function TrendPill({ children, dataHook = "trend-pill" }) {
  // Soft green tint over Badge — same override pattern as
  // ScoreStatusPill (the upstream Badge has no soft-green variant;
  // swap for the variant when it lands).
  return (
    <Badge
      variant="secondary"
      dataHook={dataHook}
      className="bg-[var(--ds-tailwind-colors-green-100)] text-[var(--ds-tailwind-colors-green-700)]"
    >
      <TrendingUp className="size-3.5" />
      {children}
    </Badge>
  );
}

export function MetricHubCard({
  title,
  // Trend pill copy ("0.4 in last 7 days"); omit to hide the pill.
  trend,
  goto,
  dataHook = "metric-hub-card",
  // Stat block: muted label, big display value, muted context, green
  // delta ("+1.2") — all optional except value.
  label,
  value,
  context,
  delta,
  children,
  ...rest
}) {
  return (
    <Card
      className="max-w-none cursor-pointer"
      dataHook={dataHook}
      data-grade-goto={goto}
      {...rest}
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="flex flex-wrap items-center gap-2.5">
            <CardTitleLink>{title}</CardTitleLink>
            {trend ? (
              <TrendPill dataHook={`${dataHook}-trend`}>{trend}</TrendPill>
            ) : null}
          </span>
          <span
            aria-hidden
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ds-tailwind-colors-neutral-100)] text-[var(--ds-tailwind-colors-neutral-700)]"
          >
            <ArrowRight className="size-4" />
          </span>
        </div>
        {value != null ? (
          <div className="flex flex-col gap-1">
            {label ? (
              <p className="text-sm text-[var(--ds-tailwind-colors-neutral-500)]">
                {label}
              </p>
            ) : null}
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span
                className="text-4xl leading-none tabular-nums"
                style={{
                  fontFamily: "var(--ds-font-font-display, Poppins)",
                  fontWeight: "var(--ds-font-weight-semibold, 600)",
                }}
              >
                {value}
              </span>
              {context ? (
                <span className="text-base text-[var(--ds-tailwind-colors-neutral-500)]">
                  {context}
                </span>
              ) : null}
              {delta ? (
                <span className="text-base font-medium text-[var(--ds-tailwind-colors-green-600)]">
                  {delta}
                </span>
              ) : null}
            </p>
          </div>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
