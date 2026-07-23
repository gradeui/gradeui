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
} from "@brightlocal/ui-components";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  TriangleAlert,
} from "@brightlocal/icons";
import { RobotAiA } from "@brightlocal/illustrations";
import { useProposalData } from "@brightlocal/proposal-data";
import { ScoreDonut, scoreColor } from "@brightlocal/score-donut";
import { GlossaryText } from "@brightlocal/proposal-glossary";

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
      ink: "var(--ds-tailwind-colors-red-900)",
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
      ink: "var(--ds-tailwind-colors-amber-900)",
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
      ink: "var(--ds-tailwind-colors-green-900)",
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
      {/* Band-tinted robot (Ali, 23 Jul: "can we override the
          colours?") — the illustration tint seam in the shell re-points
          the baked fills; ink AND accent go monochrome band-ink (the
          mock's maroon robot), paper goes transparent so the banner
          tint shows through the line art. */}
      <div
        className="shrink-0"
        aria-hidden
        data-bl-illo-tint=""
        style={{
          "--bl-illo-ink": band.ink,
          "--bl-illo-accent": band.ink,
          "--bl-illo-paper": "transparent",
        }}
      >
        {illustration ?? <RobotAiA size={88} />}
      </div>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <ScoreStatusPill score={score} dataHook={`${dataHook}-pill`} />
        {/* SEMI-BOLD explicitly via the token (Ali, 23 Jul) — inline
            weight so no ramp/utility drift can bolden it (BL's shipped
            ramp maps font-semibold to 500 without our fix; and a
            missing 600 face would let font-synthesis fake a heavier
            one — if this still READS bold somewhere, suspect a local
            Poppins install or an unloaded 600 face on that machine). */}
        <p
          className={["text-pretty text-2xl leading-snug", band.headlineClass].join(" ")}
          style={{
            fontFamily: "var(--ds-font-font-display, Poppins)",
            fontWeight: "var(--ds-font-weight-semibold, 600)",
            fontSynthesisWeight: "none",
          }}
        >
          {headline ?? band.headline}
        </p>
      </div>
    </div>
  );
}

// ─── ModuleScoreCard — the section overview ───────────────────────────
// The sub-page's At-a-Glance card, matched to the LANDING page's (Ali,
// 23 Jul: "essentially the same as the page prior"): large donut left;
// title + insight/recommendation count badges + glossaried summary
// right. NO icon (the "star AI" Sparkles are gone from these cards)
// and NO weight note. The sub-metric viz (the row of 5 donuts / bars)
// is PARKED — Ali is designing its replacement (bar chart or badges);
// `variant`/`donutSize` stay accepted so existing screens don't break,
// but render nothing for now (ModuleScoreBars/Donuts kept below).
export function ModuleScoreCard({
  // Foundation key: "websiteContent" | "gbp" | "reviews" | "citations".
  moduleKey,
  // PARKED (accepted, currently unrendered — see header note).
  variant = "bars",
  donutSize = 72,
  // CardTitle text — set it PER SUBPAGE (each AI Insights sub-page owns
  // its heading). Defaults to "At a Glance" (Title Case): the page H1
  // already names the module.
  title,
  // Summary text — set per subpage; falls back to the module's data
  // summary. Runs through GlossaryText either way.
  description,
  dataHook = "module-score-card",
  // data-* / anchor pass-through — same rule as the rest of the lib.
  ...rest
}) {
  const data = useProposalData();
  const module = data.foundation[moduleKey];
  const cardTitle = title ?? "At a Glance";
  const cardDescription = description ?? module.summary;
  // Counts scoped to THIS module's area — same semantics as the
  // landing card's totals (insights = items, recommendations = their
  // action rows).
  const areaItems = data.aiInsights.items.filter(
    (i) => i.area === module.area,
  );
  const insights = areaItems.length;
  const recs = areaItems.reduce((n, i) => n + (i.actions?.length ?? 0), 0);
  return (
    <Card
      variant="filled"
      density="default"
      className="w-full max-w-none"
      dataHook={dataHook}
      {...rest}
    >
      <CardContent>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <ScoreDonut
            value={module.score}
            size={168}
            className="mx-auto lg:mx-0"
            dataHook={`${dataHook}-score`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle size="default">{cardTitle}</CardTitle>
              <Badge variant="outline" dataHook={`${dataHook}-insights`}>
                <Lightbulb className="size-3.5" />
                {insights} insights
              </Badge>
              <Badge variant="outline" dataHook={`${dataHook}-recs`}>
                <Check className="size-3.5" />
                {recs} recommendations
              </Badge>
            </div>
            {cardDescription ? (
              <p className="max-w-prose text-pretty text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-700)]">
                <GlossaryText dataHook={`${dataHook}-summary-glossary`}>
                  {cardDescription}
                </GlossaryText>
              </p>
            ) : null}
          </div>
        </div>
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
    return (
      <div className="space-y-1.5">
        <p className="max-w-prose text-pretty text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-700)]">
          {`${index + 1}. `}
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
        {/* NUMBERED rows (Ali, 23 Jul) — "1." ahead of each action so
            the list reads as a CHECKLIST. (Numbers were dropped 20 Jul
            as implying priority order; the checklist read wins — order
            is still arbitrary, the number is a handle, not a rank.)
            items-start + no truncate so the title wraps freely; no
            closed-state where-badge (snag 30); trigger text in the
            clickable link colour so the rows READ clickable. */}
        <span className="flex w-full items-start gap-3 pr-2 text-left">
          <span
            data-bl-link=""
            className="flex flex-1 items-start gap-2.5 text-sm font-medium text-[var(--bl-card-link,var(--ds-tailwind-colors-green-950))]"
          >
            {/* Number CHIP (Ali, 23 Jul: "put them in a circle") —
                INLINE-flex on purpose: atomic inlines don't receive the
                trigger's propagated hover underline, so the line runs
                under the label only, never through the circle. Colour
                inherits the link seam (shifts with the row's hover). */}
            <span
              aria-hidden
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--ds-tailwind-colors-neutral-100)] text-xs font-semibold tabular-nums"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{actionLabel(action)}</span>
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
        {/* No icon — the "star AI" Sparkles came off these cards with
            the sub-page At-a-Glance rework (Ali, 23 Jul). */}
        <CardTitle size="default">{title}</CardTitle>
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
