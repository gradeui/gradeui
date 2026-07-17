// reset-lsg-landing.mjs — Local Search Grid starts from blank (18 Jul):
// the original rich LSG screen has bugs but is KEPT — it just stops
// being the landing. Nav gotos resolve by screen NAME, so the blank
// landing takes the canonical name and the original is renamed.
// 1. harness: render the blank LSG landing through the REAL modules
// 2. rename "Local Search Grid" → "Local Search Grid - Original",
//    dropping its section:"Top-Level Pages" tag (other tags kept)
// 3. create the blank "Local Search Grid" landing, tagged
//    section:"Top-Level Pages" (same shape as the other landings)
// Idempotent: skips steps already done.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = process.env.GRADEUI_ROOT ?? "/sessions/bold-optimistic-fermat/mnt/gradeui";
const PROJECT = "47e40175-0d55-4d21-960b-26bdf6b01282";
const TAG = { type: "section", value: "Top-Level Pages" };
const NAME = "Local Search Grid";
const OLD_NAME = "Local Search Grid - Original";
const ACTIVE_ID = "local-search-grid";

// ── screen source (matches the other landings post-crumb-rewire) ─────
const SOURCE = `// ${NAME} — top-level landing (nav model v2). Generated from
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
        dataHook="${ACTIVE_ID}-app-layout"
        sidebar={
          <ProposalSidebar dataHook="${ACTIVE_ID}-sidebar" activeId="${ACTIVE_ID}" />
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
            dataHook="${ACTIVE_ID}-page-header"
            breadcrumbs={[
            { label: "All Locations", goto: "All Locations" },
            { bind: "location", goto: "Location Hub - New Template" },
          ]}
            title="${NAME}"
          />
        }
      >
        <GlobalLayoutContentBody
          dataHook="${ACTIVE_ID}-page-body"
          className="space-y-6"
        >
          <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-[var(--ds-tailwind-colors-neutral-200)] text-sm text-[var(--ds-tailwind-colors-neutral-400)]">
            ${NAME} — page content goes here
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
  const checks = [
    ["renders", html.length > 1500],
    ["LSG subs visible (v2 contextual — keyword rows)", html.includes("campsite lewes")],
    ["sibling subs hidden", !html.includes("Rankings Table")],
    ["top-level goto wired from DEFAULT navLinks", /data-grade-goto="screen:dmrotrh931z64"/.test(html)], // Citations
    ["breadcrumb: bound location name (bare NAP name)", /data-grade-goto="(screen:dmrnwiqjdknxy|Location Hub - New Template)"[^>]*>Blackberry Farm Park</.test(html)],
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

// 2. rename the original + drop its Top-Level Pages tag
const original = rows.find((r) => r.name === NAME && r.state?.appSource && !r.state.appSource.includes("hub-blank"));
const already = rows.find((r) => r.name === OLD_NAME);
if (already) {
  console.log(`skip rename (exists): ${OLD_NAME}`);
} else if (original) {
  const tags = (original.state.tags ?? []).filter(
    (t) => !(t.type === TAG.type && t.value === TAG.value),
  );
  const res = await fetch(rest(`/designs?id=eq.${original.id}&updated_at=eq.${original.updated_at}`), {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      name: OLD_NAME,
      state: { ...original.state, tags },
      updated_at: Date.now(),
    }),
  });
  const body = await res.json();
  console.log(
    res.ok && body.length
      ? `renamed: "${NAME}" → "${OLD_NAME}" (section tag dropped, ${tags.length} tag(s) kept)`
      : `RENAME FAILED: ${JSON.stringify(body).slice(0, 120)}`,
  );
} else {
  console.log("WARN: original Local Search Grid not found — nothing renamed");
}

// 3. create the blank landing under the canonical name
const fresh = await (
  await fetch(rest(`/designs?project_id=eq.${PROJECT}&select=id,name,position`), { headers: H })
).json();
if (fresh.some((r) => r.name === NAME)) {
  console.log(`skip create (exists): ${NAME}`);
} else {
  const now = Date.now();
  const res = await fetch(rest("/designs"), {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      id: mintId(),
      project_id: PROJECT,
      name: NAME,
      state: { appSource: SOURCE, status: "draft", kind: "screen", tags: [TAG] },
      position: Math.max(...fresh.map((r) => r.position)) + 1,
      created_at: now,
      updated_at: now,
    }),
  });
  const body = await res.json();
  console.log(
    res.ok && body.length
      ? `created blank landing: ${NAME} (${body[0].id})`
      : `CREATE FAILED: ${JSON.stringify(body).slice(0, 120)}`,
  );
}
console.log("DONE");
