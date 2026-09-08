"use client";

import * as React from "react";
// Promoted from Studio screen "All Locations"
// (design dmrotrgstba3l, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: c47b7bc2cfaa

// All Locations — the account's location list (root of the breadcrumb
// trail). LocationCard grid bound to data.locations, functional search,
// Card/Table toggle (card view built; table is the next notch), and
// NO pagination (Ali, 22 Jul) — the list is only the dataset-backed
// locations, so it always fits one view.

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Link,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@brightlocal/ui-components";
import { ArrowRight, Menu, Plus, Search, LayoutGrid, Table2 } from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  LocationCard,
  useProposalData,
} from "@brightlocal/proposal";
import { usePersona } from "@/lib/demo";

function LocationsGrid() {
  const data = useProposalData();
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState("card");
  const [client, setClient] = React.useState("all");

  // Client scope -> locations (Ali, 24 Jul: "hardcode, keep it simple").
  // Client A = Minus 1 Studios; Client B = the other two. Keys are the
  // dataset ids (= each location's l.id). ASSUMPTION (Ali to confirm):
  // labels stay "Client A/B" per Ali's wording; swap for real client/
  // agency names here + in the SelectItems below if wanted.
  const CLIENT_LOCATIONS = {
    "minus-one-studios": ["minus-one-studios"],
    "harbour-co": ["harbour-co", "harbour-co-hove", "harbour-co-worthing"],
    "northside-dental": ["northside-dental"],
  };
  // PERSONA SCOPE (app-side, 9 Sep): an account sees its own locations.
  // A single business sees one card; Harbour & Co sees three; the agency
  // sees every client's, with the client filter above the grid.
  const persona = usePersona();
  const visible = (data.locations ?? [])
    .filter((l) => persona.locations.includes(l.id))
    .filter(
      (l) => client === "all" || (CLIENT_LOCATIONS[client] ?? []).includes(l.id),
    )
    .filter((l) =>
      query
        ? [l.name, l.city, l.category]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true,
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar — search left; view toggle
          right. NO pagination (Ali, 22 Jul) — only dataset-backed
          locations render, likely the first screen a client sees. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-md">
          <Input
            dataHook="locations-search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Client scope (Ali, 22 & 24 Jul) — NOW FILTERS the grid:
              Client A = Minus 1 Studios, Client B = the other two
              (hardcoded CLIENT_LOCATIONS map above). */}
          {persona.accountType === "agency" ? (
          <Select value={client} onValueChange={setClient}>
            <SelectTrigger dataHook="locations-client-select" className="w-44">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="minus-one-studios">Minus 1 Studios</SelectItem>
              <SelectItem value="harbour-co">Harbour &amp; Co</SelectItem>
              <SelectItem value="northside-dental">Northside Dental</SelectItem>
            </SelectContent>
          </Select>
          ) : null}
          {/* View switcher as TABS (Ali, 22 Jul) — a mutually exclusive
              always-one-active pair is tab semantics, not a toggle. */}
          <Tabs
            dataHook="locations-view-tabs"
            value={view}
            onValueChange={(v) => v && setView(v)}
          >
            <TabsList>
              <TabsTrigger value="card" dataHook="locations-view-card">
                <LayoutGrid className="size-4" />
                Card
              </TabsTrigger>
              <TabsTrigger value="table" dataHook="locations-view-table">
                <Table2 className="size-4" />
                Table
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Card grid or table — the toggle is REAL (Ali, 22 Jul). Both
          views walk into the location's hub with the dataset carry:
          rows carry data-grade-goto + data-grade-dataset exactly like
          the cards (the capture listener works on any element). */}
      {view === "card" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((l) => (
            <LocationCard
              key={l.id}
              location={l}
              goto="screen:dmrurue2wmp9u"
              dataHook={"location-card-" + l.id}
            />
          ))}
        </div>
      ) : (
        <Table dataHook="locations-table">
          <TableHeader>
            <TableRow>
              <TableHead>Business name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead align="center">Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((l) => (
              <TableRow
                key={l.id}
                className="cursor-pointer"
                data-grade-goto="screen:dmrurue2wmp9u"
                data-grade-dataset={l.dataset}
                dataHook={"location-row-" + l.id}
              >
                {/* Two-line identity — name over the account reference,
                    matching the live product's table. */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="truncate text-base font-medium text-foreground">
                      {l.name}
                    </span>
                    {l.reference ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {l.reference}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="truncate text-base text-muted-foreground">
                    {l.city}, {l.postcode}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    {l.status ? (
                      /* DS variants only: `primary` IS the product's
                         green success badge; no warning variant exists,
                         so non-Active states use `outline`. */
                      <Badge
                        variant={l.status === "Active" ? "primary" : "outline"}
                        dataHook={"location-status-badge-" + l.id}
                      >
                        {l.status}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Link
                      variant="ghost"
                      href="#"
                      dataHook={"locations-table-view-" + l.id}
                      data-grade-goto="screen:dmrurue2wmp9u"
                      data-grade-dataset={l.dataset}
                    >
                      View <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {visible.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border-2 border-dashed border-[var(--ds-tailwind-colors-neutral-200)] text-sm text-[var(--ds-tailwind-colors-neutral-400)]">
          {query ? `No locations match "${query}"` : "No locations for this client"}
        </div>
      ) : null}
    </div>
  );
}

export default function AllLocationsPage() {
  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        flush
        stickyHeader
        pinnedSidebar
        sidebarTone="subtle"
        sidebarFrame="flush"
        sidebarShadow="none"
        headerSurface="white"
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
            title="All Locations"
            actions={
              <>
                <Button variant="outline" dataHook="add-client-button">
                  <Plus className="size-4" />
                  Add Client
                </Button>
                <Button dataHook="add-location-button">
                  <Plus className="size-4" />
                  Add location
                </Button>
              </>
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

