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
  CardTitle,
  TypographyH3,
  TypographyMuted,
} from "@brightlocal/ui-components";
import { ArrowRight, Globe, Link, Sparkles, Star, Store } from "@brightlocal/icons";
import { useProposalData } from "@brightlocal/proposal-data";
import { ScoreDonut, scoreColor } from "@brightlocal/score-donut";
import { GlossaryText } from "@brightlocal/proposal-glossary";

// Default icon per foundation module — override with the `icon` prop.
const MODULE_ICONS = {
  websiteContent: Globe,
  gbp: Store,
  reviews: Star,
  citations: Link,
};

// Insight severity → the pill label + colour. `high` reads as the
// action priority ("Priority"), not a scare word.
const SEVERITY = {
  high: { label: "Priority", color: "var(--ds-tailwind-colors-red-600)" },
  medium: { label: "Medium", color: "var(--ds-tailwind-colors-amber-600)" },
  low: { label: "Low", color: "var(--ds-tailwind-colors-neutral-500)" },
};

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
  const Icon = icon ?? MODULE_ICONS[moduleKey] ?? Globe;
  const cardTitle = title ?? module.label;
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
              <Icon className="size-4 shrink-0 text-[var(--ds-tailwind-colors-neutral-500)]" />
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

// The "where" affordance rendered inside an expanded action.
function ActionWhere({ item, action, index }) {
  const where = actionWhere(action);
  if (where === "onsite") {
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
  // Off-site: BrightLocal can't make the change for them, so it's an
  // instruction, not a button.
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--ds-tailwind-colors-neutral-200)] px-3 py-2 text-sm text-[var(--ds-tailwind-colors-neutral-600)]">
      <Globe className="size-4 shrink-0 text-[var(--ds-tailwind-colors-neutral-400)]" />
      Make this change on your website
    </div>
  );
}

// A small tag in the accordion trigger telling the user WHERE the fix
// happens before they expand it.
function WhereTag({ where, dataHook = "action-where" }) {
  const onsite = where === "onsite";
  // Pure DS Badge — no type overrides, so it matches every other Badge
  // (the severity one included). Only `shrink-0` for layout (Ali, 20 Jul).
  return (
    <Badge variant="outline" className="shrink-0" dataHook={dataHook}>
      {onsite ? "In BrightLocal" : "On your website"}
    </Badge>
  );
}

// ─── InsightCard — one actionable recommendation ──────────────────────
// severity + area badges, the diagnostic insight, the recommendation
// panel, and the ACTIONS. `actionStyle`:
//   "accordion" — each action a collapsible row (default; Lighthouse).
//   "list"      — the flat numbered list (the original).
export function InsightCard({ item, actionStyle = "accordion" }) {
  const sev = SEVERITY[item.severity] ?? SEVERITY.low;
  // The default view is lean — title + actions. The diagnostic Insight
  // is dropped for now; the Recommendation is opt-in behind "Tell me
  // more" so it only lands on the screen when asked for (Ali, 20 Jul).
  const [showRecommendation, setShowRecommendation] = React.useState(false);
  return (
    // condensed density trims the top/bottom padding that made these
    // cards tall; CardContent carries the internal rhythm (Ali, 20 Jul).
    <Card className="w-full max-w-none" density="default" dataHook={`insight-${item.id}`}>
      <CardContent className="space-y-4">
        {/* The insight IS the card — its headline is the CardTitle and
            the plain-language roll-up (item.actionsSummary, a recommended
            LLM output field) is the CardDescription beneath it. The
            Priority severity badge sits top-right; the area badge was
            dropped — every card on a sub-page shares the area, so it just
            repeated the section (Ali, 20 Jul). */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <CardTitle size="small" className="font-semibold leading-snug">
              <GlossaryText dataHook={`insight-${item.id}-title-glossary`}>
                {item.title}
              </GlossaryText>
            </CardTitle>
            {item.actionsSummary ? (
              <CardDescription className="leading-relaxed">
                <GlossaryText dataHook={`insight-${item.id}-summary-glossary`}>
                  {item.actionsSummary}
                </GlossaryText>
              </CardDescription>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className="shrink-0"
            dataHook={`insight-${item.id}-severity`}
          >
            <span style={{ color: sev.color }}>{sev.label}</span>
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-[var(--ds-tailwind-colors-neutral-400)]">
            Actions ({item.actions.length})
          </p>
          {actionStyle === "list" ? (
            <ActionList item={item} />
          ) : (
            <ActionAccordion item={item} />
          )}
        </div>
        {item.recommendation ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              dataHook={`insight-${item.id}-tell-me-more`}
              onClick={() => setShowRecommendation((v) => !v)}
            >
              {showRecommendation ? "Hide recommendation" : "Tell me more"}
            </Button>
            {showRecommendation ? (
              <div className="space-y-1 rounded-lg bg-[var(--ds-tailwind-colors-neutral-50)] p-4">
                <p className="text-xs font-medium uppercase text-[var(--ds-tailwind-colors-neutral-400)]">
                  Recommendation
                </p>
                <p className="text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-700)]">
                  <GlossaryText dataHook={`insight-${item.id}-rec-glossary`}>
                    {item.recommendation}
                  </GlossaryText>
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
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
        <p className="text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-700)]">
          <GlossaryText dataHook={`insight-${item.id}-action-${index}-glossary`}>
            {action.text}
          </GlossaryText>
        </p>
        <ActionWhere item={item} action={action} index={index} />
      </div>
    );
  }
  return (
    <AccordionItem value={`action-${index}`}>
      <AccordionTrigger dataHook={`insight-${item.id}-action-${index}-trigger`}>
        {/* No number (arbitrary order); items-start + no truncate so the
            title wraps freely instead of being clipped (Ali, 20 Jul). */}
        <span className="flex w-full items-start gap-3 pr-2 text-left">
          <span className="flex-1 text-sm font-medium">
            {actionLabel(action)}
          </span>
          <span className="mt-0.5 shrink-0">
            <WhereTag
              where={where}
              dataHook={`insight-${item.id}-action-${index}-where`}
            />
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-700)]">
            <GlossaryText dataHook={`insight-${item.id}-action-${index}-glossary`}>
              {action.text}
            </GlossaryText>
          </p>
          <ActionWhere item={item} action={action} index={index} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

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
  const { items, lastUpdated } = data.aiInsights;
  const areaItems = items.filter((i) => i.area === areaId);
  return (
    <div className="space-y-4" data-hook={dataHook}>
      <div className="space-y-0.5">
        <TypographyH3 className="flex items-center gap-2">
          <Sparkles className="size-4 text-[var(--ds-tailwind-colors-green-600)]" />
          {title}
        </TypographyH3>
        <TypographyMuted>Last updated: {lastUpdated}</TypographyMuted>
      </div>
      {areaItems.length > 0 ? (
        areaItems.map((item) => (
          <InsightCard key={item.id} item={item} actionStyle={actionStyle} />
        ))
      ) : (
        <Card className="w-full max-w-none" density="default" dataHook={`${dataHook}-empty`}>
          <CardContent className="text-center text-sm text-[var(--ds-tailwind-colors-neutral-500)]">
            No open insights for this area — run Generate insights to refresh.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
