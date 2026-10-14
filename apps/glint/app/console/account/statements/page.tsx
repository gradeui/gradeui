// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "Statements v2"
// (design dmv8o4j2187s3, version 1792016114041). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: f13db7a7ca34
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Statements v2 (14 Oct 2026): the Glint build's Statements page
// (/console/account/statements) on our prototype, which Ali asked for.
// Figma draws no Statements page.
//
// LAYOUT, from the Glint build's capture: one card (a border, 16 corners)
// of month rows, oldest first, each 12 above and below with a border under
// it: the month in Chivo Medium 14/20 over "All wallets" in 12/16
// muted-foreground, and PDF and CSV (Web DS Button secondary, sm) on the
// right.
//
// ASSUMPTIONS (flagged to Ali):
//   - a title, as every page on our prototype has one (the Glint build's
//     page has none);
//   - Tax report has no page on the Glint build, so it is a second view of
//     this one: a Statements | Tax reports control under the title, which
//     Activity's two buttons open on the right side (FlowStore
//     "v2.statements.view"). There is no tax year to report yet, so Tax
//     reports is the Web DS EmptyState;
//   - the months run from July 2026, when Acme linked its bank, to the last
//     complete month;
//   - PDF and CSV give nothing: the demo has no documents.
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { FlowStore } from "@/lib/flow-store";
import { WebDsV2 } from "@/components/web-ds-v2";

const VIEWS = [
  { value: "statements", label: "Statements" },
  { value: "tax", label: "Tax reports" },
];
const MONTHS = ["July 2026", "August 2026", "September 2026"];

export default function StatementsPage() {
  const [view, setView] = FlowStore.useField("v2.statements.view", "statements");
  return (
    <>
      <AppChromeV2.Main className="md:gap-4">
        <AppChromeV2.Title>{view === "tax" ? "Tax reports" : "Statements"}</AppChromeV2.Title>
        <WebDsV2.Segmented aria-label="Show" value={view} onValueChange={setView} options={VIEWS} />
        {view === "tax" ? (
          <WebDsV2.EmptyState
            title="No tax reports yet"
            body="Your first tax report, for 2026, will be ready in January 2027."
          />
        ) : (
          <div className="flex max-w-[640px] flex-col rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-card)] px-2">
            {MONTHS.map((m, i) => (
              <div
                key={m}
                className={`flex items-center justify-between gap-4 px-2 py-3 ${i < MONTHS.length - 1 ? "border-b border-[color:var(--wds-border)]" : ""}`}
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">{m}</span>
                  <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">All wallets</span>
                </span>
                <span className="flex items-center gap-2">
                  <WebDsV2.Button variant="secondary" size="sm">PDF</WebDsV2.Button>
                  <WebDsV2.Button variant="secondary" size="sm">CSV</WebDsV2.Button>
                </span>
              </div>
            ))}
          </div>
        )}
      </AppChromeV2.Main>
    </>
  );
}
