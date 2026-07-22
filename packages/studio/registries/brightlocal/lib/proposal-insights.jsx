// @brightlocal/proposal-insights — the AI Insights sub-page furniture:
// ModuleScoreCard (the overview strip, shared across every sub-page) +
// AreaInsights/InsightCard (the actionable recommendations). Promoted
// out of the per-screen hand-rolls (20 Jul, Ali): Website and Content,
// GBP, Reviews and Citations all render THESE, keyed by module, so the
// overview reads identically on each and edits land once.
//
// PAGE MODEL (Harry's concept, 20 Jul): breadcrumb + title (PageHeader)
// → the section OVERVIEW (ModuleScoreCard: the 5 sub-scores as a data
// viz) → the INSIGHT + ACTIONS. Actions are progressive-disclosure by
// default (an Accordion, Lighthouse-style): each action is its own row
// with a "where" — a BUTTON when the fix lives in BrightLocal (on-site)
// or an INSTRUCTION when it's a change on the customer's own website
// (off-site). Both the score viz and the actions ship as VARIANTS so we
// can try alternatives in the UI without forking the component.
//
// The sub-scores are diagnostic only; the fixes live in AreaInsights,
// keyed to the whole area (aiInsights.items[].area) — the data has no
// per-sub-metric action mapping.
import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TypographyH3,
  TypographyMuted,
} from "@brightlocal/ui-components";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Globe,
  Link,
  Sparkles,
  Star,
  Store,
  TriangleAlert,
} from "@brightlocal/icons";
import { RobotAiA } from "@brightlocal/illustrations";
import { useProposalData } from "@brightlocal/proposal-data";
import { ScoreDonut, scoreColor } from "@brightlocal/score-donut";
import { GlossaryText } from "@brightlocal/proposal-glossary";

// Icons for the AI Insights LANDING page module cards (per-module,
// matching the sidebar). NOT used by ModuleScoreCard any more — the
// At a Glance card leads with the SAME Sparkles icon on every feature
// page (snag, Ali 22 Jul: per-page icon/colour drift read as broken).
const MODULE_ICONS = {
  websiteContent: Globe,
  gbp: Store,
  reviews: Star,
  citations: Link,
};

// ─── Score status band — the shared low/fair/good vocabulary ──────────
// Thresholds mirror scoreColor (<40 / <70) so pill, banner and donut
// always agree. "Needs attention" and "Average" are VERIFIED labels
// from the live product's AI insights cards (Ali's mock, 22 Jul);
// ASSUMPTION (Ali to verify): "Good" for the green band, and the fair/
// good headline copy (patterned on the verified low one), until seen
// on live.
export function scoreBand(score) {
  if (score < 40)
    return {
      id: "low",
      label: "Needs attention",
      Icon: CircleAlert,
      pillClass:
        "bg-[var(--ds-tailwind-colors-red-100)] text-[var(--ds-tailwind-colors-red-700)]",
      surfaceClass: "bg-[var(--ds-tailwind-colors-red-50)]",
      headlineClass: "text-[var(--ds-tailwind-colors-red-900)]",
      arc: "var(--ds-tailwind-colors-red-900)",
      track: "var(--ds-tailwind-colors-red-200)",
      headline: "This location's overall score is low. We'll help you fix it.",
    };
  if (score < 70)
    return {
      id: "fair",
      label: "Average",
      Icon: TriangleAlert,
      pillClass:
        "bg-[var(--ds-tailwind-colors-amber-100)] text-[var(--ds-tailwind-colors-amber-700)]",
      surfaceClass: "bg-[var(--ds-tailwind-colors-amber-50)]",
      headlineClass: "text-[var(--ds-tailwind-colors-amber-900)]",
      arc: "var(--ds-tailwind-colors-amber-700)",
      track: "var(--ds-tailwind-colors-amber-200)",
      headline:
        "This location's overall score is fair. We'll help you improve it.",
    };
  return {
    id: "good",
    label: "Good",
    Icon: CircleCheck,
    pillClass:
      "bg-[var(--ds-tailwind-colors-green-100)] text-[var(--ds-tailwind-colors-green-700)]",
    surfaceClass: "bg-[var(--ds-tailwind-colors-green-50)]",
    headlineClass: "text-[var(--ds-tailwind-colors-green-900)]",
    arc: "var(--ds-tailwind-colors-green-700)",
    track: "var(--ds-tailwind-colors-green-200)",
    headline:
      "This location's overall score is good. We'll help you make it even better.",
  };
}

// ─── ScoreStatusPill — the band as a Badge ────────────────────────────
// A real DS Badge (Ali, 22 Jul: "the pill components should just be
// badges") with the band's SOFT tint over the top — the upstream Badge
// has no soft red/amber variants (only solid destructive), so the tint
// rides className through Badge's tailwind-merge. UPSTREAM ASK: soft
// status variants on Badge; when they land, swap the override for the
// variant and delete pillClass.
export function ScoreStatusPill({
  score,
  dataHook = "score-status-pill",
  className = "",
}) {
  const band = scoreBand(score);
  const Icon = band.Icon;
  return (
    <Badge
      variant="secondary"
      dataHook={dataHook}
      className={[band.pillClass, className].filter(Boolean).join(" ")}
    >
      <Icon className="size-3.5" />
      {band.label}
    </Badge>
  );
}

// ─── StatusBanner — the illustrated status strip ──────────────────────
// Tinted panel + illustration + band pill + big display-type status
// line. Sits at the top of the AI Insights v2 At-a-Glance card and is
// EXPORTED because the hub wants "something similar" (Ali, 22 Jul).
// Robot illustration by default (@brightlocal/illustrations); pass
// `illustration` to swap it, `headline` to override the band copy.
export function StatusBanner({
  score,
  headline,
  illustration,
  dataHook = "status-banner",
  className = "",
}) {
  const band = scoreBand(score);
  return (
    <div
      data-hook={dataHook}
      className={["flex items-center gap-6 rounded-xl p-5", band.surfaceClass, className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="shrink-0" aria-hidden>
        {illustration ?? <RobotAiA size={88} />}
      </div>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <ScoreStatusPill score={score} dataHook={`${dataHook}-pill`} />
        <p
          className={["text-pretty text-2xl font-semibold leading-snug", band.headlineClass].join(" ")}
          style={{ fontFamily: "var(--ds-font-font-display, Poppins)" }}
        >
          {headline ?? band.headline}
        </p>
      </div>
    </div>
  );
}

// ─── ModuleScoreCard — the section overview ───────────────────────────
// Binds foundation[moduleKey]. Header row: icon + title + colour-coded
// score (+ weight note), then the module summary, then the sub-metric
// data viz. `variant` picks the viz:
//   "bars"   — thin labelled bars, two-column (default; compact).
//   "donuts" — a row of mini score donuts (Lighthouse-style).
export function ModuleScoreCard({
  // Foundation key: "websiteContent" | "gbp" | "reviews" | "citations".
  moduleKey,
  // Sub-score data viz. "bars" (default) | "donuts".
  variant = "bars",
  // Ring diameter for the "donuts" viz (px). Keep >= 60 so the value
  // stays visible (ScoreDonut hides it below that).
  donutSize = 72,
  // CardTitle text — set it PER SUBPAGE (each AI Insights sub-page owns
  // its heading). Falls back to the module's data label.
  title,
  // CardDescription text — set per subpage; falls back to the module's
  // data summary. Runs through GlossaryText either way.
  description,
  // Override the default per-module icon.
  icon,
  dataHook = "module-score-card",
  // data-* / anchor pass-through — same rule as the rest of the lib.
  ...rest
}) {
  const data = useProposalData();
  const module = data.foundation[moduleKey];
  // ONE icon for every At a Glance card (Sparkles, green — matching the
  // Actions & Insights card below it): per-page module icons in varying
  // colours read as inconsistency, not identity (snag, Ali 22 Jul). The
  // module is already named by the page H1 and the sidebar.
  // ASSUMPTION (Ali to verify): the snag named the inconsistency, not
  // the fix — "same icon everywhere, AI-insights-branded" is MY read.
  // The alternative (per-module icon matching the sidebar, colour
  // unified) is one line: `icon ?? MODULE_ICONS[moduleKey]`.
  const Icon = icon ?? Sparkles;
  // Default "At a Glance" — Title Case for titles (snag, Ali 22 Jul).
  // The top card of every sub-page is the module's at-a-glance view —
  // the page H1 already names the module, so repeating it was noise.
  const cardTitle = title ?? "At a Glance";
  const cardDescription = description ?? module.summary;
  // Weight is DERIVED from the score model (never authored twice), so
  // the note can never drift from the donut maths.
  const weight = data.scoreModel?.foundation?.[moduleKey];
  const weightNote =
    weight != null
      ? `${Math.round(weight * 100)}% of your Foundation score`
      : null;
  return (
    <Card
      variant="filled"
      // condensed trims the roomy default vertical padding that made the
      // card top/bottom-heavy; px-6 restores comfortable side gutters
      // (condensed bakes px-3). (Ali, 20 Jul.)
      density="default" 
      className="w-full max-w-none"
      dataHook={dataHook}
      {...rest}
    >
      <CardContent className="flex flex-col gap-5">
        {/* Identity + score. Summary sits UNDER the title so the score
            column stays pinned top-right regardless of summary length. */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon className="size-4 shrink-0 text-[var(--ds-tailwind-colors-green-600)]" />
              <CardTitle size="small" className="font-semibold">
                {cardTitle}
              </CardTitle>
            </div>
            {cardDescription ? (
              // Real CardDescription (not a bare <p>) so title + summary
              // are the DS's CardTitle/CardDescription pair on every
              // subpage — consistent, and settable via the props above.
              <CardDescription className="max-w-prose leading-relaxed">
                <GlossaryText dataHook={`${dataHook}-summary-glossary`}>
                  {cardDescription}
                </GlossaryText>
              </CardDescription>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {/* The module score itself, in a donut — matches the
                sub-metric rings so the header reads as one family, just
                a size up (Ali, 20 Jul). */}
            <ScoreDonut
              value={module.score}
              size={92}
              dataHook={`${dataHook}-score`}
            />
            {weightNote ? (
              <TypographyMuted className="max-w-[7rem] text-center text-xs leading-tight">
                {weightNote}
              </TypographyMuted>
            ) : null}
          </div>
        </div>
        {variant === "donuts" ? (
          <ModuleScoreDonuts
            subMetrics={module.subMetrics}
            donutSize={donutSize}
            dataHook={dataHook}
          />
        ) : (
          <ModuleScoreBars subMetrics={module.subMetrics} dataHook={dataHook} />
        )}
      </CardContent>
    </Card>
  );
}

// Bars viz — diagnostic breakdown, two columns so the strip stays short.
function ModuleScoreBars({ subMetrics, dataHook }) {
  return (
    <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
      {subMetrics.map((m) => (
        <div
          key={m.label}
          className="flex items-center gap-3"
          data-hook={`${dataHook}-metric-${m.label}`}
        >
          <span className="w-40 shrink-0 truncate text-xs text-[var(--ds-tailwind-colors-neutral-600)]">
            {m.label}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ds-tailwind-colors-neutral-100)]">
            <div
              className="h-full rounded-full"
              // min 2% so a 0 score still shows a nub, not a void.
              style={{
                width: `${Math.max(m.score, 2)}%`,
                backgroundColor: scoreColor(m.score),
              }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">
            {m.score}
          </span>
        </div>
      ))}
    </div>
  );
}

// Donuts viz — a row of mini score rings (Google Lighthouse-style).
// `flex-1` spreads the rings evenly across the full width whatever the
// count (2 → halves, 5 → fifths), so modules with fewer sub-metrics
// (Citations, Reviews) don't leave a fixed grid half-empty. Wraps on
// narrow widths via the per-cell min-width.
function ModuleScoreDonuts({ subMetrics, donutSize = 72, dataHook }) {
  return (
    <div className="flex flex-wrap gap-4">
      {subMetrics.map((m) => (
        <div
          key={m.label}
          className="flex flex-1 flex-col items-center gap-2"
          style={{ minWidth: donutSize }}
          data-hook={`${dataHook}-metric-${m.label}`}
        >
          <ScoreDonut value={m.score} size={donutSize} dataHook={`${dataHook}-donut-${m.label}`} />
          <span className="text-center text-xs leading-tight text-[var(--ds-tailwind-colors-neutral-600)]">
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── action "where" — on-site (BrightLocal) vs off-site (their site) ──
// Explicit `action.where` wins; otherwise INFER: a tool deep-link means
// the fix lives in BrightLocal (on-site → button); no link means it's a
// change on the customer's own website (off-site → instruction).
function actionWhere(a) {
  if (a.where) return a.where;
  return a.links && a.links.length ? "onsite" : "offsite";
}

// Trigger title — the authored short `label` (3–6 words) when present.
// The AI generation should emit one per action; without it we fall
// back to the first sentence, which is only a snippet of the same body
// text (no real summary is possible at render time). Never truncated —
// the row wraps.
function actionLabel(a) {
  if (a.label) return a.label;
  const t = a.text ?? "";
  const dot = t.indexOf(". ");
  return dot > 0 ? t.slice(0, dot + 1) : t;
}

// The "where" affordance rendered inside an expanded action — ONSITE
// ONLY (deep-link buttons into BrightLocal). Off-site renders nothing
// here: the "Make this change on your website" box was dropped (snag,
// Ali 21 Jul) — off-site tasks PREPEND the web-developer instruction to
// their body text instead (see offsitePrefix).
function ActionWhere({ item, action, index }) {
  const where = actionWhere(action);
  if (where !== "onsite") return null;
  const links = action.links?.length
    ? action.links
    : [{ label: action.cta?.label ?? "Fix in BrightLocal" }];
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Button
          key={l.label}
          variant="outline"
          size="sm"
          dataHook={`insight-${item.id}-action-${index}-link`}
        >
          {l.label} <ArrowRight className="size-3.5" />
        </Button>
      ))}
    </div>
  );
}

// Off-site tasks lead the body text with who does the work — replacing
// the old dashed "Make this change on your website" box (snag, Ali 21
// Jul: "prepend this to the task description").
function offsitePrefix(action) {
  return actionWhere(action) === "offsite"
    ? "Ask your web developer to do the following things. "
    : "";
}

// ─── InsightCard — one actionable recommendation ──────────────────────
// severity + area badges, the diagnostic insight, the recommendation
// panel, and the ACTIONS. `actionStyle`:
//   "accordion" — each action a collapsible row (default; Lighthouse).
//   "list"      — the flat numbered list (the original).
export function InsightCard({ item, actionStyle = "accordion" }) {
  // The view is lean — title + summary + actions. The diagnostic
  // Insight was dropped earlier; "Tell me more" (the recommendation
  // reveal) is GONE too — it was a recommendation for the whole task
  // list, redundant repetition of the summary (snag, Ali 21 Jul).
  return (
    // NOT a Card any more: all insights share ONE "Actions & Insights"
    // card (AreaInsights) — this renders a SECTION within it. The
    // Priority badge and the "ACTIONS (n)" grey heading are gone
    // (snags 27–29, Ali 21 Jul).
    <div className="space-y-4" data-hook={`insight-${item.id}`}>
      <div className="min-w-0 space-y-1.5">
        {/* NO GlossaryText in headings (Ali, 22 Jul) — dashed underlines
            inside a bold title read as broken formatting. Terms get their
            glossary treatment on first use in BODY text instead. */}
        <CardTitle size="small" className="font-semibold leading-snug">
          {item.title}
        </CardTitle>
        {item.actionsSummary ? (
          <CardDescription className="text-pretty leading-relaxed">
            <GlossaryText dataHook={`insight-${item.id}-summary-glossary`}>
              {item.actionsSummary}
            </GlossaryText>
          </CardDescription>
        ) : null}
      </div>
      {actionStyle === "list" ? (
        <ActionList item={item} />
      ) : (
        <ActionAccordion item={item} />
      )}
    </div>
  );
}

// ─── InsightAction — ONE recommendation action ────────────────────────
// EVERY action routes through this component, so the row anatomy —
// number, short label, where-tag, full text, and the on-site button /
// off-site instruction — lives in exactly one place (Ali, 20 Jul: "the
// actions should route through their own component"). `style`:
//   "accordion" — a collapsible AccordionItem (default). MUST render
//                 inside an <Accordion> (it needs the Radix context).
//   "list"      — a flat numbered row (used inside ActionList's panel).
export function InsightAction({ item, action, index, style = "accordion" }) {
  const where = actionWhere(action);
  if (style === "list") {
    // No number — the actions are an unordered SET, not sequential
    // steps; numbering implied a priority order that isn't real
    // (Ali, 20 Jul).
    return (
      <div className="space-y-1.5">
        <p className="max-w-prose text-pretty text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-700)]">
          <GlossaryText dataHook={`insight-${item.id}-action-${index}-glossary`}>
            {offsitePrefix(action) + action.text}
          </GlossaryText>
        </p>
        <ActionWhere item={item} action={action} index={index} />
      </div>
    );
  }
  return (
    <AccordionItem value={`action-${index}`}>
      {/* cursor-pointer: the DS preflight leaves buttons on the default
          cursor — a clickable row needs the hand (snag, Ali 22 Jul). */}
      <AccordionTrigger
        className="cursor-pointer"
        dataHook={`insight-${item.id}-action-${index}-trigger`}
      >
        {/* No number (arbitrary order); items-start + no truncate so the
            title wraps freely instead of being clipped (Ali, 20 Jul).
            No closed-state where-badge either — it repeated on every row
            and read as clutter (snag 30, Ali 21 Jul); the "where" is
            revealed inside the open panel. Trigger text in the clickable
            link colour (--bl-card-link, same seam as CardTitleLink) so
            the rows READ clickable (snag, Ali 22 Jul). */}
        <span className="flex w-full items-start gap-3 pr-2 text-left">
          <span
            data-bl-link=""
            className="flex-1 text-sm font-medium text-[var(--bl-card-link,var(--ds-tailwind-colors-green-950))]"
          >
            {actionLabel(action)}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {/* max-w-prose: full-width task text was an unreadable line
              length (snag 32) — wrap it and let whitespace live on the
              right. Off-site tasks lead with the web-developer line
              (offsitePrefix). "Learn more." is the novice-expansion
              affordance (snag 34) — stubbed until the copy exists. */}
          {/* text-pretty on the prose paragraphs — kills the hanging
              one-word last line ("…should improve.") (Ali, 22 Jul). */}
          <p className="max-w-prose text-pretty text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-700)]">
            <GlossaryText dataHook={`insight-${item.id}-action-${index}-glossary`}>
              {offsitePrefix(action) + action.text}
            </GlossaryText>{" "}
            <button
              type="button"
              data-bl-link=""
              data-hook={`insight-${item.id}-action-${index}-learn-more`}
              className="font-medium text-[var(--bl-card-link,var(--ds-tailwind-colors-green-950))] hover:underline"
            >
              Learn more.
            </button>
          </p>
          <ActionWhere item={item} action={action} index={index} />
          {/* Close the loop: tell them what happens AFTER the fix
              (snag 33). */}
          <p className="max-w-prose text-pretty text-xs leading-relaxed text-[var(--ds-tailwind-colors-neutral-500)]">
            After you've done this, wait a week then check this page. Your
            {" "}{SCORE_NOUN[item.area] ?? "score"} should improve.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// Per-area noun for the post-action blurb — "your website score should
// improve" on the Website page, sensible fallbacks elsewhere.
const SCORE_NOUN = {
  "website-seo": "website score",
  "gbp-manager": "GBP score",
  reviews: "reviews score",
  citations: "citations score",
};

// Accordion actions (default) — progressive disclosure; each action is
// an InsightAction row inside one Accordion.
function ActionAccordion({ item }) {
  return (
    <Accordion type="multiple" dataHook={`insight-${item.id}-actions`}>
      {item.actions.map((a, i) => (
        <InsightAction key={i} item={item} action={a} index={i} style="accordion" />
      ))}
    </Accordion>
  );
}

// List actions (variant) — the same InsightAction rows, flat inside the
// green panel.
function ActionList({ item }) {
  return (
    <div className="space-y-3 rounded-lg border border-[var(--ds-tailwind-colors-green-100)] bg-[var(--ds-tailwind-colors-green-50)] p-4">
      {item.actions.map((a, i) => (
        <InsightAction key={i} item={item} action={a} index={i} style="list" />
      ))}
    </div>
  );
}

// ─── AreaInsights — the actions-led section ───────────────────────────
// The page's PRIMARY content: header (title + last-updated + updates
// left) then the InsightCards for this area. `areaId` filters
// aiInsights.items[].area — pass the module's `area`
// (foundation[moduleKey].area) so the score strip and the actions stay
// in lockstep. `actionStyle` is threaded down to every InsightCard.
export function AreaInsights({
  areaId,
  // Section heading — the page reframed around doing, not diagnosing.
  title = "Actions & Insights",
  // "accordion" (default) | "list" — passed to each InsightCard.
  actionStyle = "accordion",
  dataHook = "area-insights",
}) {
  const data = useProposalData();
  const { items } = data.aiInsights;
  const areaItems = items.filter((i) => i.area === areaId);
  return (
    // ONE card (snag 27, Ali 21 Jul): the "Actions & Insights" heading
    // lives INSIDE the card, and every insight renders as a section
    // within it, separated by rules — not a stack of separate cards.
    // "Last updated" lives ONLY in the PageHeader (Ali, 20 Jul).
    <Card className="w-full max-w-none" density="default" dataHook={dataHook}>
      <CardHeader>
        <CardTitle size="default" className="flex items-center gap-2">
          <Sparkles className="size-4 text-[var(--ds-tailwind-colors-green-600)]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {areaItems.length > 0 ? (
          <div className="flex flex-col divide-y divide-[var(--ds-tailwind-colors-neutral-100)]">
            {areaItems.map((item, i) => (
              <div key={item.id} className={i === 0 ? "pb-6" : "py-6 last:pb-0"}>
                <InsightCard item={item} actionStyle={actionStyle} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--ds-tailwind-colors-neutral-500)]">
            No open insights for this area — run Generate insights to refresh.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
