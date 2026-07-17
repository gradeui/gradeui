// create-ai-insights-pages.mjs — AI Insights sub pages (18 Jul):
// 1. verify a generated placeholder renders through the REAL module
//    chain (sub nav visible, DEFAULT navLinks wiring live)
// 2. insert one placeholder screen per AI Insights sub row, named
//    "AI Insights - <label>" (section prefix avoids clashing with the
//    top-level Reviews/Citations landings), tagged section:"AI Insights"
// 3. retag the "AI Insights" landing section:"AI Insights" (section is
//    single-cardinality — this REPLACES its Top-Level Pages tag)
// Idempotent: skips screens whose names already exist.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = process.env.GRADEUI_ROOT ?? "/sessions/bold-optimistic-fermat/mnt/gradeui";
const PROJECT = "47e40175-0d55-4d21-960b-26bdf6b01282";
const TAG = { type: "section", value: "AI Insights" };

const SUBS = [
  { id: "ai-insights-website-content", label: "Website and Content" },
  { id: "ai-insights-google-business-profile", label: "Google Business Profile" },
  { id: "ai-insights-reviews", label: "Reviews" },
  { id: "ai-insights-citations", label: "Citations" },
  { id: "ai-insights-export", label: "Export Report" },
];

// ── screen source ────────────────────────────────────────────────────
const crumbs =
  '[\n            { label: "All Locations", goto: "All Locations" },\n            { bind: "location", goto: "Location Hub - New Template" },\n            { label: "AI Insights", goto: "AI Insights" },\n          ]';
function screenSource({ id, label }) {
  const name = `AI Insights - ${label}`;
  return `// ${name} — AI Insights sub page (placeholder). The shell,
// sidenav and header live in "@brightlocal/proposal"; sub-nav rows are
// contextual (nav model v2) and already wired via the module's DEFAULT
// navLinks. Build the page content below.

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import { Menu } from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
} from "@brightlocal/proposal";

export default function App() {
  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        flush
        stickyHeader
        pinnedSidebar
        sidebarTone="white"
        dataHook="${id}-app-layout"
        sidebar={
          <ProposalSidebar dataHook="${id}-sidebar" activeId="${id}" />
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
            dataHook="${id}-page-header"
            breadcrumbs={${crumbs}}
            title="${label}"
          />
        }
      >
        <GlobalLayoutContentBody
          dataHook="${id}-page-body"
          className="space-y-6"
        >
          <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-[var(--ds-tailwind-colors-neutral-200)] text-sm text-[var(--ds-tailwind-colors-neutral-400)]">
            AI Insights — ${label} — page content goes here
          </div>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
`;
}

// ── 1. harness: render the Reviews sub via the real modules ─────────
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
  const src = screenSource(SUBS.find((s) => s.id === "ai-insights-reviews"));
  const { code } = transform(src, { transforms: ["jsx", "imports"], production: true });
  const mod = { exports: {} };
  new Function("module", "exports", "require", "React", code)(
    mod,
    mod.exports,
    requireLib,
    React,
  );
  const html = renderToStaticMarkup(React.createElement(mod.exports.default));
  const checks = [
    ["renders", html.length > 1500],
    ["AI Insights subs visible (v2 contextual)", html.includes("Website and Content") && html.includes("Export Report")],
    ["sibling subs hidden", !html.includes("Rankings Table")],
    ["sub goto wired from DEFAULT navLinks", /data-grade-goto="screen:dmrouize7iinr"/.test(html)], // AI Insights - Citations
    ["export sub goto wired", /data-grade-goto="screen:dmrouizhd7lcw"/.test(html)], // AI Insights - Export Report
    ["top-level goto still wired", /data-grade-goto="screen:dmrotrh931z64"/.test(html)], // Citations
    ["breadcrumb: bound location name", html.includes("Blackberry Farm Park")],
    ["breadcrumb: AI Insights crumb links home", /data-grade-goto="screen:dmrotrgwxijez"|data-grade-goto="AI Insights"/.test(html)],
    // Separators are explicit siblings in shadcn-family breadcrumbs and
    // have gone silently missing TWICE (Ali). Structural invariant:
    // separators === crumbs - 1, forever.
    [
      "breadcrumb separators = crumbs - 1",
      (html.match(/data-stub="BreadcrumbSeparator"/g) ?? []).length === 2,
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

// ── 2–3. DB ─────────────────────────────────────────────────────────
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
const mintId = () =>
  "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const rows = await (
  await fetch(rest(`/designs?project_id=eq.${PROJECT}&select=id,name,state,position,updated_at`), { headers: H })
).json();
const names = new Set(rows.map((r) => r.name));
let position = Math.max(...rows.map((r) => r.position)) + 1;

for (const sub of SUBS) {
  const name = `AI Insights - ${sub.label}`;
  if (names.has(name)) {
    console.log(`skip (exists): ${name}`);
    continue;
  }
  const now = Date.now();
  const res = await fetch(rest("/designs"), {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      id: mintId(),
      project_id: PROJECT,
      name,
      state: {
        appSource: screenSource(sub),
        status: "draft",
        kind: "screen",
        tags: [TAG],
      },
      position: position++,
      created_at: now,
      updated_at: now,
    }),
  });
  const body = await res.json();
  console.log(res.ok && body.length ? `created: ${name} (${body[0].id})` : `FAILED: ${name} ${JSON.stringify(body).slice(0, 120)}`);
  await new Promise((r) => setTimeout(r, 20)); // distinct mintId ms
}

// 3. retag the AI Insights landing (section is single-cardinality:
// swaps out its Top-Level Pages tag — per Ali's instruction, flagged).
const landing = rows.find((r) => r.name === "AI Insights");
if (landing) {
  const fresh = await (
    await fetch(rest(`/designs?id=eq.${landing.id}&select=id,state,updated_at`), { headers: H })
  ).json();
  const row = fresh[0];
  const tags = row.state.tags ?? [];
  if (tags.some((t) => t.type === TAG.type && t.value === TAG.value)) {
    console.log("skip tag (already): AI Insights landing");
  } else {
    const next = [...tags.filter((t) => t.type !== "section"), TAG];
    const res = await fetch(rest(`/designs?id=eq.${row.id}&updated_at=eq.${row.updated_at}`), {
      method: "PATCH",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ state: { ...row.state, tags: next }, updated_at: Date.now() }),
    });
    const body = await res.json();
    console.log(
      res.ok && body.length
        ? "retagged: AI Insights landing → section:AI Insights (replaced section:Top-Level Pages)"
        : "TAG FAILED: AI Insights landing",
    );
  }
} else console.log("WARN: AI Insights landing not found");
console.log("DONE");
