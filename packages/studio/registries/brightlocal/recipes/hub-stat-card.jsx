// HubStatCard — Hub-page stat card: icon, title, description, headline metric, and a CTA — the canonical module/entry card for dashboard and hub screens.
// keywords: stat card, stats card, hub card, hub page, metric card, kpi card, dashboard card, module card, entry card, summary card, card grid
// components: card, button, chip
// Hand-authored (July 2026, sidebar/layout explorations) — NOT
// harvested; the recipe harvester does not touch custom-named files.
//
// COMPOSABLE, the AppLayoutShell way: HubStatCard is an in-file
// user-land component — copy the function into the screen and feed the
// five slots as props. Screens are self-contained single-file JSX, so
// this is the composition seam: the ARRANGEMENT is canonical, the
// content is per-instance.
//
// ELEVATION IS NOT SET HERE — deliberately. The floating-panel
// treatment (white surface, soft shadow, hairline border) is a PAGE
// LAYER concern: AppLayoutShell's pageLayers="raised" (the default)
// paints every [data-slot="card"] with it globally. Cards stay
// treatment-agnostic so the whole page re-skins from one switch.
//
// Card gotcha (2.20.0 dist): the base cva bakes `max-w-[400px]` — a
// grid of these needs `max-w-none` on each Card or the tiles won't
// fill their tracks.

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brightlocal/ui-components";
import {
  ChevronRight,
  Link,
  Star,
  TrendingUp,
} from "@brightlocal/icons";

// ─── The canonical arrangement ──────────────────────────────────────
// icon → title → chevron (drill-down) → description → metric (+ delta).
// `metric` and `delta` accept ReactNodes so screens can pass richer
// values (a formatted number, a sparkline) without changing the seam.
function HubStatCard({
  icon: Icon,
  title,
  description,
  metric,
  delta,
  // ctaHook names the chevron (the card's single drill-down control —
  // footer CTAs were dropped once the chevron landed; two buttons to
  // the same place was noise).
  ctaHook,
  dataHook,
}) {
  // The whole card is a drill-down target — hover lifts it a step
  // above the resting layer shadow. Wire navigation per-screen (the
  // CTA carries the same destination for keyboard/AT users).
  return (
    <Card
      density="condensed"
      className="max-w-none cursor-pointer transition-shadow hover:shadow-md"
      dataHook={dataHook}
    >
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {/* Icon tile pinned to neutral-50 — the faintest step, so
                it reads on BOTH a raised white card and a regular
                default/filled card without riding the muted token
                (which the raised layer bumps to neutral-100). */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--ds-tailwind-colors-neutral-100)] bg-[var(--ds-tailwind-colors-neutral-50)]">
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

// ─── Usage — a hub grid ─────────────────────────────────────────────
// Tracks, not max-widths, own the sizing (hence max-w-none above).
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  <HubStatCard
    icon={Star}
    title="Reviews"
    description="Monitor and respond across 30+ sites"
    metric="4.3"
    delta="+0.2 this month"
    ctaHook="hub-reviews-cta"
    dataHook="hub-reviews-card"
  />
  <HubStatCard
    icon={TrendingUp}
    title="Rankings"
    description="Local search positions for tracked keywords"
    metric="12"
    delta="↑ 3 places"
    ctaHook="hub-rankings-cta"
    dataHook="hub-rankings-card"
  />
  <HubStatCard
    icon={Link}
    title="Citations"
    description="Live listings across the citation network"
    metric="86"
    ctaHook="hub-citations-cta"
    dataHook="hub-citations-card"
  />
</div>
