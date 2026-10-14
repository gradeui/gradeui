"use client";

// Promoted from Studio screen "Activity — history v2"
// (design dmupumb6uwgoj, version 1791399537215). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: d1a87fe1da86
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Activity — history v2: the business portal's Activity page on staging.
// A copy of "Activity — history", which stays untouched because the live
// demo is promoted from it.
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New", Activity · Default
// and Filtered:
//   - breadcrumb "Activity"; the title (Raleway Bold 24/32) with Download
//     statement and Tax report on the right (Web DS Button outline, sm);
//   - the filter, Web DS ToggleGroup segmented sm: All, Gold, Silver;
//   - the Web DS activity list, metal over cash. 16 between the three.
//   Gold and Silver keep the rows that touch that wallet; All is every row.
//
// Download statement and Tax report are inert: the demo has no documents
// to give (ASSUMPTION; say if they should open something).
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { ActivityListV2 } from "@/components/activity-list-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
];

export default function ActivityPage() {
  const [filter, setFilter] = React.useState<"all" | "gold" | "silver">("all");
  const rows = Persona.useActivity(filter === "all" ? undefined : filter);
  return (
    <>
      <AppChromeV2.Main className="md:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AppChromeV2.Title>Activity</AppChromeV2.Title>
          <div className="flex items-center gap-2">
            <WebDsV2.Button variant="outline" size="sm">
              Download statement
            </WebDsV2.Button>
            <WebDsV2.Button variant="outline" size="sm">
              Tax report
            </WebDsV2.Button>
          </div>
        </div>
        <WebDsV2.Segmented aria-label="Show" value={filter} onValueChange={setFilter} options={FILTERS} />
        <ActivityListV2 rows={rows} lead="metal" />
      </AppChromeV2.Main>
    </>
  );
}
