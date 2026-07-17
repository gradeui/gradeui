// build-all-locations.mjs — the All Locations PAGE (18 Jul):
// 1. harness-render the new page source through the real module chain
// 2. replace the "All Locations" screen's appSource in the DB
// 3. crumb rewires: section landings' second crumb becomes the
//    DATA-BOUND location name; the hub gains the bound crumb.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = "/sessions/bold-optimistic-fermat/mnt/gradeui";
const PROJECT = "47e40175-0d55-4d21-960b-26bdf6b01282";

const ALL_LOCATIONS_SOURCE = `// All Locations — the account's location list (root of the breadcrumb
// trail). LocationCard grid bound to data.locations, functional search,
// Card/Table toggle (card view built; table is the next notch), and
// CONDITIONAL pagination — it only renders when there is more than one
// page (the live platform shows it always; deliberate deviation).

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
  Button,
  Input,
  ToggleGroup,
  ToggleGroupItem,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@brightlocal/ui-components";
import { Menu, Plus, Search, LayoutGrid, Table2 } from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  LocationCard,
  useProposalData,
} from "@brightlocal/proposal";

const PAGE_SIZE = 6;

function LocationsGrid() {
  const data = useProposalData();
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState("card");
  const [page, setPage] = React.useState(1);

  const filtered = (data.locations ?? []).filter((l) =>
    query
      ? [l.name, l.city, l.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      : true,
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar — search left; view toggle + (conditional) pagination
          right. Pagination ONLY when the list overflows a page. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-md">
          <Input
            dataHook="locations-search"
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <ToggleGroup
            dataHook="locations-view-toggle"
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v)}
          >
            <ToggleGroupItem value="card" dataHook="locations-view-card">
              <LayoutGrid className="size-4" />
              Card
            </ToggleGroupItem>
            <ToggleGroupItem value="table" dataHook="locations-view-table">
              <Table2 className="size-4" />
              Table
            </ToggleGroupItem>
          </ToggleGroup>
          {totalPages > 1 ? (
            <Pagination dataHook="locations-pagination">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    dataHook="locations-page-prev"
                    disabled={current === 1}
                    onClick={() => setPage(Math.max(1, current - 1))}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        dataHook={"locations-page-" + n}
                        page={n}
                        isActive={n === current}
                        onClick={() => setPage(n)}
                      />
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    dataHook="locations-page-next"
                    disabled={current === totalPages}
                    onClick={() => setPage(Math.min(totalPages, current + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      </div>

      {/* The grid. Every card walks into the location's hub. */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((l) => (
          <LocationCard
            key={l.id}
            location={l}
            goto="Location Hub - New Template"
            dataHook={"location-card-" + l.id}
          />
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border-2 border-dashed border-[var(--ds-tailwind-colors-neutral-200)] text-sm text-[var(--ds-tailwind-colors-neutral-400)]">
          No locations match "{query}"
        </div>
      ) : null}
    </div>
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
        dataHook="all-locations-app-layout"
        sidebar={
          <ProposalSidebar
            dataHook="all-locations-sidebar"
            activeId="all-locations"
          />
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
            dataHook="all-locations-page-header"
            meta={null}
            title="All Locations"
            actions={
              <Button dataHook="add-location-button">
                <Plus className="size-4" />
                Add location
              </Button>
            }
          />
        }
      >
        <GlobalLayoutContentBody
          dataHook="all-locations-page-body"
          className="space-y-6"
        >
          <LocationsGrid />
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
            for (const [k, v] of Object.entries(r))
              if (k.startsWith("data-") && (typeof v === "string" || typeof v === "number"))
                a[k] = String(v);
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
  const { code } = transform(ALL_LOCATIONS_SOURCE, {
    transforms: ["jsx", "imports"],
    production: true,
  });
  const mod = { exports: {} };
  new Function("module", "exports", "require", "React", code)(
    mod,
    mod.exports,
    requireLib,
    React,
  );
  const html = renderToStaticMarkup(React.createElement(mod.exports.default));
  const cards = (html.match(/No photo available/g) ?? []).length;
  // React 19 emits a <link rel="preload"> per img, so count IMG TAGS.
  const imgs = (html.match(/<img[^>]*images\.unsplash\.com/g) ?? []).length;
  const pageLinks = (html.match(/data-stub="PaginationLink"/g) ?? []).length;
  const checks = [
    ["page renders", html.length > 3000],
    ["6 cards on page 1 (2 photos + 4 placeholders)", imgs === 2 && cards === 4],
    ["photo cards render img", imgs > 0],
    ["no-photo placeholder present", cards >= 3],
    ["pagination RENDERS at 7 locations (2 page links)", pageLinks === 2],
    ["dirty-data comedy intact", html.includes("!!!Cafe Sydney") && html.includes("Dog walker")],
    ["cards goto the hub", /data-grade-goto="Location Hub - New Template"/.test(html)],
  ];
  let fail = 0;
  for (const [l, p] of checks) {
    console.log(p ? "PASS" : "FAIL", l);
    if (!p) fail++;
  }
  // Prove the CONDITIONAL: render again with only 3 locations.
  const P = requireLib("@brightlocal/proposal");
  const few = renderToStaticMarkup(
    React.createElement(
      P.ProposalDataProvider,
      { data: { locations: [{ id: "a", name: "A", city: "X" }, { id: "b", name: "B", city: "Y" }, { id: "c", name: "C", city: "Z" }] } },
      React.createElement(mod.exports.default === undefined ? "div" : (() => React.createElement(mod.exports.default)), null),
    ),
  );
  // NOTE: App mounts its own shell; provider stacking means our 3-location
  // patch flows through (providers merge over parents).
  const noPag = !few.includes('data-stub="PaginationLink"');
  console.log(noPag ? "PASS" : "FAIL", "pagination HIDDEN at 3 locations (1 page)");
  if (!noPag) fail++;
  if (fail) {
    console.error("harness failed — aborting before DB writes");
    process.exit(1);
  }
}

// ── 2 + 3. DB ────────────────────────────────────────────────────────
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
  await fetch(rest(`/designs?project_id=eq.${PROJECT}&select=id,name,state,updated_at`), { headers: H })
).json();

async function patch(row, appSource, label) {
  const res = await fetch(rest(`/designs?id=eq.${row.id}&updated_at=eq.${row.updated_at}`), {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ state: { ...row.state, appSource }, updated_at: Date.now() }),
  });
  const body = await res.json();
  console.log(res.ok && body.length ? `${label}: ${row.name}` : `FAILED ${label}: ${row.name}`);
}

// 2. the page itself
const all = rows.find((r) => r.name === "All Locations");
if (all) await patch(all, ALL_LOCATIONS_SOURCE, "page built");

// 3a. section landings: second crumb becomes the bound location name
const CRUMB_FROM = `{ label: "Location Hub", goto: "Location Hub - New Template" }`;
const CRUMB_TO = `{ bind: "location", goto: "Location Hub - New Template" }`;
for (const row of rows) {
  const src = row.state?.appSource;
  if (typeof src !== "string" || !src.includes(CRUMB_FROM)) continue;
  await patch(row, src.split(CRUMB_FROM).join(CRUMB_TO), "crumb bound");
}

// 3b. the hub gains the bound current-location crumb
const HUB_FROM = `breadcrumbs={[{ label: "All Locations", goto: "All Locations" }]}`;
const HUB_TO = `breadcrumbs={[
              { label: "All Locations", goto: "All Locations" },
              { bind: "location" },
            ]}`;
const fresh = await (
  await fetch(rest(`/designs?project_id=eq.${PROJECT}&select=id,name,state,updated_at`), { headers: H })
).json();
for (const row of fresh) {
  const src = row.state?.appSource;
  if (typeof src !== "string" || !src.includes(HUB_FROM)) continue;
  await patch(row, src.split(HUB_FROM).join(HUB_TO), "hub crumb");
}
console.log("DONE");
