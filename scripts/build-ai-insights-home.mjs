// build-ai-insights-home.mjs — the AI Insights landing content (18 Jul):
// four HubStatCards, one per sub page, each drilling into its screen by
// ID. Export Report is deliberately NOT a stat — it's an action, it
// stays a nav row. Metrics bind from data.metrics.ai* (proposal-data);
// the summary line binds from data.aiInsights.summary.
// 1. harness-render through the real module chain
// 2. PATCH the "AI Insights" screen's appSource (state spread — tags kept)
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = process.env.GRADEUI_ROOT ?? "/sessions/bold-optimistic-fermat/mnt/gradeui";
const PROJECT = "47e40175-0d55-4d21-960b-26bdf6b01282";
const NAME = "AI Insights";

const SOURCE = `// AI Insights — section landing. Four stat cards, one per sub page,
// each drilling into its screen BY ID (ids survive renames). Export
// Report is an action, not a stat — it lives in the nav only. Metrics
// bind from data.metrics.ai*; the summary binds from data.aiInsights.

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import { Menu, Globe, Store, Star, Link } from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  HubStatCard,
  useProposalData,
} from "@brightlocal/proposal";

function InsightsSummary() {
  const data = useProposalData();
  return (
    <p
      data-hook="ai-insights-summary"
      className="max-w-2xl text-sm text-[var(--ds-tailwind-colors-neutral-600)]"
    >
      {data.aiInsights.summary}
    </p>
  );
}

export default function App() {
  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        flush
        stickyHeader
        pinnedSidebar
        sidebarTone="white"
        dataHook="ai-insights-app-layout"
        sidebar={
          <ProposalSidebar dataHook="ai-insights-sidebar" activeId="ai-insights" />
        }
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
            dataHook="ai-insights-page-header"
            breadcrumbs={[
            { label: "All Locations", goto: "screen:dmrotrgstba3l" }, // All Locations
            { bind: "location", goto: "screen:dmrnwiqjdknxy" }, // Location Hub - New Template
          ]}
            title="AI Insights"
          />
        }
      >
        <GlobalLayoutContentBody
          dataHook="ai-insights-page-body"
          className="space-y-6"
        >
          <InsightsSummary />
          {/* 2x2 for now (Ali) — four across read cramped; revisit
              when the cards carry sparklines. */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <HubStatCard
              icon={Globe}
              title="Website and Content"
              metricKey="aiWebsiteContent"
              goto="screen:dmrouiz2ajnqw" // AI Insights - Website and Content
              dataHook="ai-stat-website-content"
              ctaHook="ai-stat-website-content"
            />
            <HubStatCard
              icon={Store}
              title="Google Business Profile"
              metricKey="aiGoogleBusinessProfile"
              goto="screen:dmrouiz5q03hr" // AI Insights - Google Business Profile
              dataHook="ai-stat-google-business-profile"
              ctaHook="ai-stat-google-business-profile"
            />
            <HubStatCard
              icon={Star}
              title="Reviews"
              metricKey="aiReviews"
              goto="screen:dmrouizaw0c9u" // AI Insights - Reviews
              dataHook="ai-stat-reviews"
              ctaHook="ai-stat-reviews"
            />
            <HubStatCard
              icon={Link}
              title="Citations"
              metricKey="aiCitations"
              goto="screen:dmrouize7iinr" // AI Insights - Citations
              dataHook="ai-stat-citations"
              ctaHook="ai-stat-citations"
            />
          </div>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
`;

// ── 1. harness ───────────────────────────────────────────────────────
{
  const req = createRequire(
    path.join(ROOT, "node_modules/.pnpm/sucrase@3.35.1/node_modules/sucrase/package.json"),
  );
  const { transform } = req("sucrase");
  const reqReact = createRequire(
    path.join(ROOT, "node_modules/.pnpm/react@19.2.5/node_modules/react/package.json"),
  );
  const React = reqReact("react");
  const reqDom = createRequire(
    path.join(ROOT, "node_modules/.pnpm/react-dom@19.2.5_react@19.2.5/node_modules/react-dom/package.json"),
  );
  const { renderToStaticMarkup } = reqDom("react-dom/server");
  const LIBDIR = path.join(ROOT, "packages/studio/registries/brightlocal/lib");
  const cache = new Map();
  const stub = () =>
    new Proxy(
      {},
      {
        get(_, n) {
          if (n === "__esModule") return true;
          if (typeof n !== "string") return undefined;
          const C = (p = {}) => {
            const { children, ...r } = p;
            const a = { "data-stub": n };
            for (const [k, v] of Object.entries(r)) {
              if (k.startsWith("data-") && (typeof v === "string" || typeof v === "number"))
                a[k] = String(v);
            }
            const slots = Object.values(r).filter((v) => React.isValidElement(v));
            return React.createElement("div", a, ...slots, children);
          };
          C.displayName = n;
          return C;
        },
      },
    );
  function requireLib(spec) {
    if (cache.has(spec)) return cache.get(spec);
    if (spec === "react") return React;
    if (spec === "react/jsx-runtime") return reqReact("react/jsx-runtime");
    if (spec === "@brightlocal/data") {
      const DATASETS = {};
      const dir = path.join(LIBDIR, "data");
      for (const f of readdirSync(dir))
        if (f.endsWith(".json"))
          DATASETS[f.replace(/\.json$/, "")] = JSON.parse(
            readFileSync(path.join(dir, f), "utf8"),
          );
      const m = { DATASETS };
      cache.set(spec, m);
      return m;
    }
    if (spec.startsWith("@brightlocal/proposal")) {
      const file = path.join(LIBDIR, spec.replace("@brightlocal/", "") + ".jsx");
      const { code } = transform(readFileSync(file, "utf8"), {
        transforms: ["jsx", "imports"],
        production: true,
      });
      const mod = { exports: {} };
      cache.set(spec, mod.exports);
      new Function("module", "exports", "require", "React", code)(
        mod,
        mod.exports,
        requireLib,
        React,
      );
      cache.set(spec, mod.exports);
      return mod.exports;
    }
    if (spec.startsWith("@brightlocal/")) return stub();
    throw new Error("unstubbed " + spec);
  }
  const { code } = transform(SOURCE, { transforms: ["jsx", "imports"], production: true });
  const mod = { exports: {} };
  new Function("module", "exports", "require", "React", code)(
    mod,
    mod.exports,
    requireLib,
    React,
  );
  const html = renderToStaticMarkup(React.createElement(mod.exports.default));
  const gotoCount = (re) => (html.match(re) ?? []).length;
  const checks = [
    ["renders", html.length > 1500],
    ["summary bound from aiInsights", html.includes("reviews velocity dropped")],
    ["4 stat cards drill by ID", gotoCount(/data-grade-goto="screen:dmrouiz2ajnqw"/g) >= 1 && gotoCount(/data-grade-goto="screen:dmrouiz5q03hr"/g) >= 1 && gotoCount(/data-grade-goto="screen:dmrouizaw0c9u"/g) >= 1 && gotoCount(/data-grade-goto="screen:dmrouize7iinr"/g) >= 1],
    ["Export Report is NOT a stat card", gotoCount(/data-grade-goto="screen:dmrouizhd7lcw"/g) === 1], // nav row only
    ["metrics bind (6 unanswered reviews)", html.includes(">6<") && html.includes("need replies")],
    ["metrics bind (84% GBP)", html.includes("84%")],
    ["AI subs visible in nav (v2 contextual)", html.includes("Export Report")],
    // Structural invariant (Ali): separators === crumbs - 1, forever.
    [
      "breadcrumb separators = crumbs - 1",
      (html.match(/data-stub="BreadcrumbSeparator"/g) ?? []).length === 1,
    ],
  ];
  let fail = 0;
  for (const [l, p] of checks) {
    console.log(p ? "PASS" : "FAIL", l);
    if (!p) fail++;
  }
  if (fail) {
    console.error("harness failed — aborting before any DB writes");
    process.exit(1);
  }
}

// ── 2. DB ───────────────────────────────────────────────────────────
let url, key;
for (const line of readFileSync(path.join(ROOT, "apps/docs/.env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const v = m[2].replace(/^["']|["']$/g, "");
  if (m[1] === "NEXT_PUBLIC_SUPABASE_URL" || m[1] === "SUPABASE_URL") url = url ?? v;
  if (m[1] === "SUPABASE_SERVICE_ROLE_KEY") key = v;
}
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const rest = (p) => url.replace(/\/$/, "") + "/rest/v1" + p;

const rows = await (
  await fetch(rest(`/designs?project_id=eq.${PROJECT}&name=eq.${encodeURIComponent(NAME)}&select=id,name,state,updated_at`), { headers: H })
).json();
const row = rows[0];
if (!row) {
  console.error(`ABORT: screen "${NAME}" not found`);
  process.exit(1);
}
const res = await fetch(rest(`/designs?id=eq.${row.id}&updated_at=eq.${row.updated_at}`), {
  method: "PATCH",
  headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({
    state: { ...row.state, appSource: SOURCE },
    updated_at: Date.now(),
  }),
});
const body = await res.json();
console.log(
  res.ok && body.length
    ? `patched: ${NAME} (${row.id}) — 4 stat cards, tags kept: ${JSON.stringify(row.state.tags)}`
    : `FAILED: ${JSON.stringify(body).slice(0, 160)}`,
);
console.log("DONE");
