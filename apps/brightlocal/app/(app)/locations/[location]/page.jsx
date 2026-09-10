"use client";

import * as React from "react";
// Promoted from Studio screen "UI Vision - Location Hub"
// (design dmrurue2wmp9u, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: 9d87050fc321

// UI Vision — Location Hub (snags-list rebuild, Ali 21 Jul).
// Standard header: crumb "All Locations" only, H1 = location name with
// town/postcode smaller inline, lede, Last updated (12th July, 2026
// format), white header band against the raised canvas. NO At-a-glance
// card (would duplicate AI Insights). Eight feature cards — feature name
// as GREEN clickable title + lede + data — each walks into its module
// screen. Dataset: minus-one-studios.

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
  Button,
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  Badge,
  MapGridPin,
  MAP_STYLES,
} from "@brightlocal/ui-components";
import { createPortal } from "react-dom";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import {
  Menu,
  Globe,
  ArrowRight,
  Star,
  TrendingUp,
  Lightbulb,
  Check,
  GoogleOriginal,
  FacebookOriginal,
  AppleOriginal,
} from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  useProposalData,
  computeLocationScore,
  ScoreDonut,
  scoreColor,
  CardTitleLink,
  RankGrid,
  GMAPS_DEMO_KEY,
} from "@brightlocal/proposal";

// The circular drill affordance EVERY hub card wears top-right (Ali,
// 23 Jul: "hub cards will always have the arrow") — the whole card is
// the link; this is its visual handle. A REAL DS secondary Button
// (Ali, 24 Jul) so its hover state is the DS's own, not an invented
// tint: the card is `group` and group-hover:bg-secondary/80 mirrors
// the Button's exact hover class, so hovering ANYWHERE on the card
// moves the arrow to its hover state (green title hover retired —
// this + the card shadow IS the affordance now). Decorative on
// purpose: the card owns the click (pointer-events-none, aria-hidden,
// tabIndex -1) — a live button would swallow the goto.
function DrillArrow() {
  return (
    <Button
      variant="secondary"
      aria-hidden
      tabIndex={-1}
      dataHook="hub-drill-arrow"
      className="pointer-events-none size-9 shrink-0 rounded-full p-0 group-hover:bg-secondary/80"
    >
      <ArrowRight className="size-4" />
    </Button>
  );
}

// One hub card shell: title + lede left, drill arrow right, data below;
// whole card walks into the module screen.
function HubCard({ title, lede, goto, dataHook, titleExtra, children }) {
  return (
    <Card
      // gap-4 trims the DS default gap-8 between header and content
      // (Ali, 23 Jul — gap-6 first, then "take it to gap-4"); matches
      // the 16px card rhythm everywhere else. group + hover shadow
      // (Ali, 24 Jul): the whole-card hover affordance — shadow (sm — md read too loud, Ali 24 Jul) lifts
      // the card and group-hover flips the DrillArrow to its hover
      // state; the title no longer recolours.
      className="group max-w-none cursor-pointer gap-4 transition-shadow hover:shadow-sm"
      dataHook={dataHook}
      data-grade-goto={goto}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="flex flex-wrap items-center gap-2.5">
              {/* Lib-owned clickable-title treatment — one token seam
                  (--bl-card-link). */}
              <CardTitleLink>{title}</CardTitleLink>
              {titleExtra ?? null}
            </span>
            <CardDescription>{lede}</CardDescription>
          </div>
          {goto ? <DrillArrow /> : null}
        </div>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  );
}

// Amazon-style horizontal bar row: label, track, count. `color` is a
// raw token var — Reviews runs the RATING yellow (with its star);
// Rankings stays performance green.
function BarRow({ label, count, total, dataHook, color = "var(--ds-tailwind-colors-green-500)" }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3" data-hook={dataHook}>
      <span className="w-14 shrink-0 text-xs text-[var(--ds-tailwind-colors-neutral-500)]">
        {label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--ds-tailwind-colors-neutral-100)]">
        <div
          className="h-full rounded-full"
          style={{ width: pct + "%", backgroundColor: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-medium tabular-nums">
        {count}
      </span>
    </div>
  );
}

// AI Insights — the location score, big.
// Lede tracks the donut's status colour (snag, Ali 22 Jul) — same
// thresholds as scoreColor (<40 red, <70 amber, else green).
// ASSUMPTION (Ali to verify): straight apostrophes in the copy, and
// the red/amber cutoffs are OUR scoreColor thresholds — the live
// product may band its statuses differently.
function scoreLede(score) {
  if (score < 40) return "This location's overall score is low. Take action now.";
  if (score < 70) return "This location's overall score is fair. Take action to improve it.";
  return "This location's overall score is good. Take action to make it even better.";
}

function AiInsightsCard() {
  const data = useProposalData();
  const score = computeLocationScore(data);
  return (
    <HubCard
      title="AI Insights"
      lede={scoreLede(score.overall)}
      goto="screen:dmrotrgwxijez"
      dataHook="hub-ai-insights"
      titleExtra={
        /* ONE badge, beside the title (Ali, 23 Jul) — recommendations
           is the actionable count; insights stays on the landing. */
        <Badge variant="outline" dataHook="hub-ai-recs-count">
          <Check className="size-3.5" />
          {data.aiInsights?.counts?.recommendations ?? 0} recommendations
        </Badge>
      }
    >
      {/* Donut left; the REAL pillar breakdown fills the right (the
          blank-space fix) — same derived numbers as the landing's
          Read-more reveal. */}
      <div className="flex items-center gap-6">
        <ScoreDonut value={score.overall} size={104} dataHook="hub-score-donut" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {[
            { label: "Foundation", value: score.foundation },
            { label: "Visibility", value: score.visibility },
          ].map((p) => (
            <div key={p.label} className="flex items-center gap-3" data-hook={`hub-pillar-${p.label}`}>
              <span className="w-20 shrink-0 text-xs text-[var(--ds-tailwind-colors-neutral-500)]">
                {p.label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--ds-tailwind-colors-neutral-100)]">
                {/* Colour-banded like every score (scoreColor: red <40
                    / amber <70 / green) — Ali, 23 Jul. */}
                <div
                  className="h-full rounded-full"
                  style={{ width: p.value + "%", backgroundColor: scoreColor(p.value) }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums">
                {p.value}/100
              </span>
            </div>
          ))}
        </div>
      </div>
    </HubCard>
  );
}

// Location Profile — full NAP + connection statuses.
// Provider marks from the DS social set, the PROPER full-colour
// -Original treatment on every row (Ali, 23 Jul) — connection state
// stays in the words + status colour. Bing: NO mark in
// @brightlocal/icons (the legacy platform's icon font has
// bl-icon-se-bing — see the audit ledger / upstream ask); lucide
// Globe stands in, muted.
const CONNECTIONS = [
  { name: "Google Business Profile", status: "Active Sync", active: true, Icon: GoogleOriginal },
  { name: "Facebook", status: "Not Connected", active: false, Icon: FacebookOriginal },
  { name: "Bing Places", status: "Not Connected", active: false, Icon: Globe, muted: true },
  { name: "Apple Maps", status: "Not Connected", active: false, Icon: AppleOriginal },
];

function LocationProfileCard() {
  const data = useProposalData();
  const { name, address, phone } = data.location;
  return (
    <HubCard
      title="Location Profile"
      lede={`${name}, ${address} · ${phone}`}
      goto="screen:dmrotrh3wgcq1"
      dataHook="hub-location-profile"
    >
      <div className="flex flex-col divide-y divide-[var(--ds-tailwind-colors-neutral-100)]">
        {CONNECTIONS.map((c) => (
          <div key={c.name} className="flex items-center justify-between py-1.5 text-sm">
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={
                  c.muted
                    ? "inline-flex shrink-0 text-[var(--ds-tailwind-colors-neutral-400)]"
                    : "inline-flex shrink-0"
                }
              >
                <c.Icon size={16} className="size-4" />
              </span>
              {c.name}
            </span>
            {c.active ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ds-tailwind-colors-green-600)]">
                <span className="size-1.5 rounded-full bg-[var(--ds-tailwind-colors-green-500)]" />
                {c.status}
              </span>
            ) : (
              <span className="text-xs text-[var(--ds-tailwind-colors-neutral-400)]">{c.status}</span>
            )}
          </div>
        ))}
      </div>
    </HubCard>
  );
}

// ─── Standard metric-card anatomy — LOCAL on purpose ─────────────────
// (Ali's mock, 23 Jul; DE-promoted from the lib same day: "not sure if
// we promoted it too soon" — the hub is its only consumer, and the
// API should stay soft while the anatomy settles. When Citations/GBP
// adopt it, promote a SLOT-shaped version informed by the real
// variations, not this prop list.) Title + soft-green TREND pill;
// circular drill arrow; muted label; BIG display value + context +
// delta; then the viz children. Values DERIVED, never authored twice.
function TrendPill({ children, dataHook }) {
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

function MetricHubCard({ title, trend, goto, dataHook, label, value, valueAdornment, context, delta, children }) {
  return (
    <Card
      // Same whole-card hover affordance as HubCard (Ali, 24 Jul).
      className="group max-w-none cursor-pointer transition-shadow hover:shadow-sm"
      dataHook={dataHook}
      data-grade-goto={goto}
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="flex flex-wrap items-center gap-2.5">
            <CardTitleLink>{title}</CardTitleLink>
            {trend ? <TrendPill dataHook={`${dataHook}-trend`}>{trend}</TrendPill> : null}
          </span>
          <DrillArrow />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[var(--ds-tailwind-colors-neutral-500)]">{label}</p>
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
            {valueAdornment ?? null}
            {context ? (
              <span className="text-base text-[var(--ds-tailwind-colors-neutral-500)]">{context}</span>
            ) : null}
            {delta ? (
              <span className="text-base font-medium text-[var(--ds-tailwind-colors-green-600)]">{delta}</span>
            ) : null}
          </p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// Reviews — star distribution across the two connected sites.
const REVIEW_BARS = [
  { label: "5 star", count: 11 },
  { label: "4 star", count: 1 },
  { label: "3 star", count: 0 },
  { label: "2 star", count: 0 },
  { label: "1 star", count: 0 },
];

function ReviewsCard() {
  const total = REVIEW_BARS.reduce((n, b) => n + b.count, 0);
  // DERIVED from the bars, never authored: (11×5 + 1×4) / 12 = 4.9.
  const avg =
    Math.round(
      (REVIEW_BARS.reduce((n, b, i) => n + b.count * (5 - i), 0) / total) * 10,
    ) / 10;
  return (
    <MetricHubCard
      title="Reviews"
      /* ASSUMPTION (Ali to verify): trend value is DEMO copy from the
         mock — no real 7-day review-rating series exists in the data. */
      trend="0.4 in last 7 days"
      goto="screen:dmrotrhbcxk66"
      dataHook="hub-reviews"
      label="Average rating"
      value={avg}
      valueAdornment={
        <Star
          aria-hidden
          className="size-6 shrink-0 self-center fill-[var(--ds-tailwind-colors-yellow-400)] text-[var(--ds-tailwind-colors-yellow-400)]"
        />
      }
      context={`${total} total reviews`}
    >
      <div className="flex flex-col gap-1.5">
        {REVIEW_BARS.map((b) => (
          <BarRow key={b.label} label={b.label} count={b.count} total={total}
            color="var(--ds-tailwind-colors-yellow-400)"
            dataHook={"hub-reviews-" + b.label.replace(" ", "-")} />
        ))}
      </div>
    </MetricHubCard>
  );
}

// Rankings — where the 5 tracked keywords sit.
// FIVE bars to match the Reviews card's stature (snag, Ali 22 Jul).
// ASSUMPTION (Ali to verify): the live data only says 3 keywords are
// "21+" — bucketing them into 21–50 (51+ empty) is a GUESS to fill the
// fifth bar; the real positions may belong in 51+. The bucket labels
// themselves (21–50 / 51+) are also ours, not the live product's.
const RANKING_BARS = [
  { label: "Top 3", count: 1 },
  { label: "4 to 10", count: 1 },
  { label: "11 to 20", count: 0 },
  { label: "21 to 50", count: 3 },
  { label: "51+", count: 0 },
];

function RankingsCard() {
  // DERIVED average position from bucket midpoints (Top 3→2, 4–10→7,
  // 21–50→35): (2 + 7 + 3×35) / 5 = 22.8. ASSUMPTION (Ali to verify):
  // real per-keyword positions would replace this once captured.
  const avgPos = 22.8;
  return (
    <MetricHubCard
      title="Rankings"
      /* ASSUMPTION: demo trend copy, as on Reviews. */
      trend="1.2 in last 7 days"
      goto="screen:dmrotrh6rulhk"
      dataHook="hub-rankings"
      label="Average position"
      value={avgPos}
      context="5 keywords tracked"
      delta="+1.2"
    >
      <div className="flex flex-col gap-1.5">
        {RANKING_BARS.map((b) => (
          <BarRow key={b.label} label={b.label} count={b.count} total={5}
            dataHook={"hub-rankings-" + b.label.replace(/[+ ]+/g, "-")} />
        ))}
      </div>
    </MetricHubCard>
  );
}

// Local Search Grid — the REAL map, mini + static (Ali, 23 Jul: "use
// this on the hub as well"): the same muted surface + verified
// geometry as the LSG page (data.localSearchGrid), gestures OFF, no
// zoom chrome, no location pin. Decorative at a glance; the card is
// the link. Screen-side ON PURPOSE: lib modules boot before the CDN
// tier can pre-resolve @vis.gl, so the map never enters the lib —
// RankGrid stays the map-free (wireframe) renderer.
const HUB_GMAPS_KEY = GMAPS_DEMO_KEY;
const HUB_SURFACE_STYLES = [
  ...MAP_STYLES.muted.light,
  // "BrightLocal the map" (Ali, 23 Jul): the brand's green-tinted
  // neutrals rather than pure greyscale — a green hue at low
  // saturation so land whispers the palette (neutral-100 #f2f7f3
  // territory), parks lean brand green, roads stay pale, water keeps
  // its blue. Hue anchor = the brand green-500 token value.
  { elementType: "geometry", stylers: [{ hue: "#0fd03b" }, { saturation: -55 }, { lightness: 25 }] },
  { elementType: "labels.text.fill", stylers: [{ saturation: -70 }, { lightness: 5 }] },
  { elementType: "labels.icon", stylers: [{ saturation: -85 }, { lightness: 22 }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ hue: "#0fd03b" }, { saturation: -45 }, { lightness: 22 }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ hue: "#0fd03b" }, { saturation: -20 }, { lightness: 10 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ saturation: -35 }, { lightness: 25 }] },
  { featureType: "road", elementType: "geometry", stylers: [{ saturation: -70 }, { lightness: 30 }] },
  // MINI-ONLY quiet pass (Ali, 23 Jul): no POI, no transit, no road
  // labels — neighbourhood names stay so the map still reads as the
  // right PLACE, just far less busy.
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
];

// Minimal OverlayView portal — same shape as the LSG page's HtmlMarker
// (duplicated screen-side; see the lib note above).
function HtmlMarker({ lat, lng, zIndex = 0, children }) {
  const map = useMap();
  const [container, setContainer] = React.useState(null);
  React.useEffect(() => {
    if (!map || !window.google?.maps) return;
    const div = document.createElement("div");
    div.style.position = "absolute";
    // CENTRE-anchored: grid dots sit ON their point (bottom-anchor
    // shifted the cluster up — Ali, 23 Jul "not quite central").
    div.style.transform = "translate(-50%, -50%)";
    div.style.zIndex = String(zIndex);
    class Overlay extends window.google.maps.OverlayView {
      onAdd() {
        this.getPanes()?.overlayMouseTarget.appendChild(div);
      }
      draw() {
        const proj = this.getProjection();
        if (!proj) return;
        const p = proj.fromLatLngToDivPixel(
          new window.google.maps.LatLng(lat, lng),
        );
        if (p) {
          div.style.left = `${p.x}px`;
          div.style.top = `${p.y}px`;
        }
      }
      onRemove() {
        div.remove();
      }
    }
    const overlay = new Overlay();
    overlay.setMap(map);
    setContainer(div);
    return () => {
      overlay.setMap(null);
      setContainer(null);
    };
  }, [map, lat, lng, zIndex]);
  return container ? createPortal(children, container) : null;
}

// Watchdog: quota exhaustion often just NEVER loads tiles (no
// gm_authFailure) — if tilesloaded hasn't fired within timeoutMs,
// declare the map dead and let the caller fall back to wireframe.
function MapWatchdog({ onFail, timeoutMs = 7000 }) {
  const map = useMap();
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    if (!map || !window.google?.maps) return;
    const l = window.google.maps.event.addListenerOnce(map, "tilesloaded", () =>
      setOk(true),
    );
    return () => l.remove();
  }, [map]);
  React.useEffect(() => {
    if (ok) return;
    const t = setTimeout(() => onFail(), timeoutMs);
    return () => clearTimeout(t);
  }, [ok, onFail, timeoutMs]);
  return null;
}

function LocalSearchGridCard() {
  const data = useProposalData();
  const lsg = data.localSearchGrid ?? {};
  const grid = lsg.grid ?? [];
  const centre = lsg.centre ?? { lat: 51.522337, lng: -0.164951 };
  const latStep = lsg.latStep ?? 0.0072315;
  const lngStep = lsg.lngStep ?? 0.011622;
  // Demo-key resilience — mirror the LSG page: on Google auth/quota
  // failure fall back to the RankGrid wireframe mini.
  const [mapFailed, setMapFailed] = React.useState(false);
  React.useEffect(() => {
    window.gm_authFailure = () => setMapFailed(true);
    return () => {
      if (window.gm_authFailure) window.gm_authFailure = undefined;
    };
  }, []);
  if (mapFailed) {
    return (
      <HubCard
        title="Local Search Grid"
        lede="Your location's rankings on a map grid."
        goto="screen:dmroutf7bsndb"
        dataHook="hub-local-search-grid"
      >
        <RankGrid grid={grid} size="mini" dataHook="hub-lsg-grid" />
      </HubCard>
    );
  }
  return (
    <HubCard
      title="Local Search Grid"
      lede="Your location's rankings on a map grid."
      goto="screen:dmroutf7bsndb"
      dataHook="hub-local-search-grid"
    >
      {/* SHARED-ELEMENT MORPH (Ali, 23 Jul): same view-transition-name
          as the LSG page's map surface — tapping the card morphs this
          mini into the full map via the sandbox's goto transition. */}
      <div
        className="relative h-56 w-full overflow-hidden rounded-xl bg-[var(--ds-tailwind-colors-neutral-100)]"
        style={{ viewTransitionName: "gds-lsg-map" }}
      >
        <APIProvider apiKey={HUB_GMAPS_KEY}>
          <Map
            center={centre}
            zoom={11.7}
            disableDefaultUI
            clickableIcons={false}
            gestureHandling="none"
            keyboardShortcuts={false}
            isFractionalZoomEnabled
            styles={HUB_SURFACE_STYLES}
          >
            {grid.flat().map((rank, i) => {
              const row = Math.floor(i / 7);
              const col = i % 7;
              return (
                <HtmlMarker
                  key={i}
                  lat={centre.lat + (3 - row) * latStep}
                  lng={centre.lng + (col - 3) * lngStep}
                  zIndex={row}
                >
                  <MapGridPin
                    dataHook={`hub-lsg-pin-${i}`}
                    value={rank ?? "Not ranked"}
                    variant={
                      rank == null || rank > 20
                        ? "unranked"
                        : rank <= 3
                          ? "strong"
                          : rank <= 10
                            ? "moderate"
                            : "weak"
                    }
                    style={{ width: 20, height: 20, fontSize: 9 }}
                  />
                </HtmlMarker>
              );
            })}
          </Map>
          <MapWatchdog onFail={() => setMapFailed(true)} />
        </APIProvider>
        {/* Click-through to the LSG page: the map eats pointer events
            even with gestures off, so a transparent cover restores the
            CARD as the link. */}
        <div
          className="absolute inset-0"
          data-grade-goto="screen:dmroutf7bsndb"
          data-grade-transition="cross-fade"
        />
      </div>
    </HubCard>
  );
}

// Citations / GBP Manager — score cards.
// Citations / GBP — donut left, number in the SAME scale as the
// Reviews/Rankings stat (text-4xl display semibold + muted context —
// Ali, 23 Jul: "the same size numbers").
function ScoreCard({ title, lede, moduleKey, goto, dataHook }) {
  const data = useProposalData();
  const score = data.foundation[moduleKey].score;
  return (
    <HubCard title={title} lede={lede} goto={goto} dataHook={dataHook}>
      <div className="flex items-center gap-3">
        <ScoreDonut value={score} size={44} dataHook={`${dataHook}-donut`} />
        <p className="flex items-baseline gap-x-2">
          <span
            className="text-4xl leading-none tabular-nums"
            style={{
              fontFamily: "var(--ds-font-font-display, Poppins)",
              fontWeight: "var(--ds-font-weight-semibold, 600)",
            }}
          >
            {score}
          </span>
          <span className="text-base text-[var(--ds-tailwind-colors-neutral-500)]">/100</span>
        </p>
      </div>
    </HubCard>
  );
}

// Set-up Tasks — card shell for now: the live "first 3 tasks + X
// more" list needs the trial-tasks scrape (snag #12, blocked on
// browser access to Ali's account). ASSUMPTION: lede copy is ours.
function SetupTasksCard() {
  return (
    <HubCard
      title="Set-up Tasks"
      lede="Get your location fully configured."
      goto="screen:dmrotrh1eilb0"
      dataHook="hub-setup-tasks"
    >
      <p className="text-sm text-[var(--ds-tailwind-colors-neutral-500)]">
        Your onboarding checklist will appear here.
      </p>
    </HubCard>
  );
}

// Google Analytics — honest not-connected state, mirroring the
// Location Profile card's vocabulary. ASSUMPTION: lede copy is ours;
// GA connection state is plausible-for-trial, not captured from live.
function GoogleAnalyticsCard() {
  return (
    <HubCard
      title="Google Analytics"
      lede="Traffic and conversions from local search."
      goto="screen:dmrotri1gb3rf"
      dataHook="hub-google-analytics"
    >
      <div className="flex items-center justify-between py-1.5 text-sm">
        <span>Google Analytics 4</span>
        <span className="text-xs text-[var(--ds-tailwind-colors-neutral-400)]">Not Connected</span>
      </div>
    </HubCard>
  );
}

// Citations bulked with Ali's LIVE Citation Tracker capture (23 Jul):
// 11 found / 20 not found, 35%, 2 NAP errors — brightlocal-source;
// move into the dataset with a citations section next pass.
function CitationsCard() {
  const data = useProposalData();
  return (
    <HubCard
      title="Citations"
      lede="Your business listings across the web."
      goto="screen:dmrotrh931z64"
      dataHook="hub-citations"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ScoreDonut value={data.foundation.citations.score} size={44} dataHook="hub-citations-donut" />
          <p className="flex items-baseline gap-x-2">
            <span
              className="text-4xl leading-none tabular-nums"
              style={{
                fontFamily: "var(--ds-font-font-display, Poppins)",
                fontWeight: "var(--ds-font-weight-semibold, 600)",
              }}
            >
              {data.foundation.citations.score}
            </span>
            <span className="text-base text-[var(--ds-tailwind-colors-neutral-500)]">/100</span>
          </p>
        </div>
        <div className="flex flex-col divide-y divide-[var(--ds-tailwind-colors-neutral-100)]">
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span>Key citations found</span>
            <span className="text-xs text-[var(--ds-tailwind-colors-neutral-500)]">11 of 31 · 35%</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span>Listings with NAP errors</span>
            <span className="text-xs font-medium text-[var(--ds-tailwind-colors-red-600)]">2</span>
          </div>
        </div>
      </div>
    </HubCard>
  );
}

function HubHeader() {
  const data = useProposalData();
  return (
    <PageHeader
      dataHook="hub-page-header"
      breadcrumbs={[{ label: "All Locations", goto: "screen:dmrotrgstba3l" }]}
      title={
        <span className="flex flex-wrap items-baseline gap-x-3">
          {data.location.name}
          <span className="text-base font-normal text-[var(--ds-tailwind-colors-neutral-500)]">
            {data.location.address}
          </span>
        </span>
      }
      lastUpdated="auto"
    />
  );
}

export default function UIVisionLocationHubPage() {
  return (
    <SidebarProvider>
      <AppLayoutShell
        flush
        stickyHeader
        pinnedSidebar
        sidebarTone="subtle"
        sidebarFrame="flush"
        sidebarShadow="none"
        headerSurface="white"
        dataset="minus-one-studios"
        dataHook="ui-vision-hub-app-layout"
        sidebar={
          <ProposalSidebar dataHook="ui-vision-hub-sidebar" activeId="location-hub" />
        }
        mobileBar={
          <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
            <SidebarTrigger>
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-5" dataHook="mobile-logo" />
          </div>
        }
        header={<HubHeader />}
      >
        <GlobalLayoutContentBody className="space-y-6 pb-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AiInsightsCard />
            <LocationProfileCard />
            <ReviewsCard />
            <RankingsCard />
            <LocalSearchGridCard />
            <CitationsCard />
            <ScoreCard
              title="GBP Manager"
              lede="Manage your Google Business Profile (GBP), track performance and schedule posts."
              moduleKey="gbp"
              goto="screen:dmrotrhwtj0wc"
              dataHook="hub-gbp-manager"
            />
            {/* NAV PARITY (Ali, 23 Jul: "a card for every item in the
                sidenav") — Website SEO binds the same foundation module
                as the AI Insights Website card (one source of truth);
                ordering is provisional pending Ali's design pass. */}
            <ScoreCard
              title="Website SEO"
              lede="Optimise your site for local search."
              moduleKey="websiteContent"
              goto="screen:dmrotrhz8gp49"
              dataHook="hub-website-seo"
            />
            <SetupTasksCard />
            <GoogleAnalyticsCard />
            <HubCard
              title="Agency Tools"
              lede="White-label reports, API details and more."
              goto="screen:dmrotri3pxlio"
              dataHook="hub-agency-tools"
            />
          </div>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
