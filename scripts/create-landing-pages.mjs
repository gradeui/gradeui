// create-landing-pages.mjs — nav model v2 plumbing (18 Jul):
// 1. verify a generated landing renders through the REAL module chain
// 2. insert one landing screen per top-level nav item + "All Locations"
//    into "Brightlocal Vision - Share", tagged section:"Top-Level Pages"
// 3. rename "Your Locations" → "All Locations" in live screens
// 4. tag the existing "Local Search Grid" screen as a top-level page
// Idempotent: skips screens whose names already exist.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = "/sessions/bold-optimistic-fermat/mnt/gradeui";
const PROJECT = "47e40175-0d55-4d21-960b-26bdf6b01282";
const TAG = { type: "section", value: "Top-Level Pages" };

// ── screen source ────────────────────────────────────────────────────
const crumbsSection =
  '[\n            { label: "All Locations", goto: "All Locations" },\n            { label: "Location Hub", goto: "Location Hub - New Template" },\n          ]';
function screenSource({ name, activeId, root = false }) {
  return `// ${name} — top-level landing (nav model v2). Generated from
// templates/hub-blank.jsx; the shell/sidenav/header live in
// "@brightlocal/proposal" and top-level nav wiring comes from the
// module's DEFAULT navLinks. Build the page content below.

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
        dataHook="${activeId}-app-layout"
        sidebar={
          <ProposalSidebar dataHook="${activeId}-sidebar" activeId="${activeId}" />
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
            dataHook="${activeId}-page-header"${
              root
                ? "\n            meta={null}"
                : `\n            breadcrumbs={${crumbsSection}}`
            }
            title="${name}"
          />
        }
      >
        <GlobalLayoutContentBody
          dataHook="${activeId}-page-body"
          className="space-y-6"
        >
          <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-[var(--ds-tailwind-colors-neutral-200)] text-sm text-[var(--ds-tailwind-colors-neutral-400)]">
            ${name} — page content goes here
          </div>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
`;
}

const LANDINGS = [
  { name: "All Locations", activeId: "all-locations", root: true },
  { name: "AI Insights", activeId: "ai-insights" },
  { name: "Set-up Tasks", activeId: "setup-tasks" },
  { name: "Location Profile", activeId: "location-profile" },
  { name: "Rankings", activeId: "rankings" },
  { name: "Citations", activeId: "citations" },
  { name: "Reviews", activeId: "reviews" },
  { name: "GBP Manager", activeId: "gbp-manager" },
  { name: "Website SEO", activeId: "website-seo" },
  { name: "Google Analytics", activeId: "google-analytics" },
  { name: "Agency Tools", activeId: "agency-tools" },
];

// ── 1. harness: render the "Rankings" landing via the real modules ──
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
  const src = screenSource(LANDINGS.find((l) => l.name === "Rankings"));
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
    ["title present", html.includes(">Rankings<") || html.includes("Rankings")],
    ["rankings subs visible (v2 contextual)", html.includes("Rankings Table")],
    ["sibling subs hidden", !html.includes("Live Citations")],
    ["top-level goto wired from DEFAULT navLinks", /data-grade-goto="Citations"/.test(html)],
    ["breadcrumb goto to All Locations", /data-grade-goto="All Locations"/.test(html)],
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

// ── 2–4. DB ─────────────────────────────────────────────────────────
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

for (const l of LANDINGS) {
  if (names.has(l.name)) {
    console.log(`skip (exists): ${l.name}`);
    continue;
  }
  const now = Date.now();
  const res = await fetch(rest("/designs"), {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      id: mintId(),
      project_id: PROJECT,
      name: l.name,
      state: {
        appSource: screenSource(l),
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
  console.log(res.ok && body.length ? `created: ${l.name} (${body[0].id})` : `FAILED: ${l.name} ${JSON.stringify(body).slice(0, 120)}`);
  await new Promise((r) => setTimeout(r, 20)); // distinct mintId ms
}

// 3. label rename in live screens
for (const row of rows) {
  const src = row.state?.appSource;
  if (typeof src !== "string" || !src.includes("Your Locations")) continue;
  const res = await fetch(rest(`/designs?id=eq.${row.id}&updated_at=eq.${row.updated_at}`), {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      state: { ...row.state, appSource: src.split("Your Locations").join("All Locations") },
      updated_at: Date.now(),
    }),
  });
  const body = await res.json();
  console.log(res.ok && body.length ? `relabelled: ${row.name}` : `RELABEL FAILED: ${row.name}`);
}

// 4. tag the existing Local Search Grid as a top-level page
const lsg = rows.find((r) => r.name === "Local Search Grid");
if (lsg) {
  const fresh = await (
    await fetch(rest(`/designs?id=eq.${lsg.id}&select=id,state,updated_at`), { headers: H })
  ).json();
  const row = fresh[0];
  const tags = row.state.tags ?? [];
  if (!tags.some((t) => t.type === TAG.type && t.value === TAG.value)) {
    const next = [...tags.filter((t) => t.type !== "section"), TAG, ...tags.filter((t) => t.type === "section" && false)];
    const res = await fetch(rest(`/designs?id=eq.${row.id}&updated_at=eq.${row.updated_at}`), {
      method: "PATCH",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ state: { ...row.state, tags: next }, updated_at: Date.now() }),
    });
    const body = await res.json();
    console.log(res.ok && body.length ? "tagged: Local Search Grid" : "TAG FAILED: Local Search Grid");
  } else console.log("skip tag (already): Local Search Grid");
}
console.log("DONE");
