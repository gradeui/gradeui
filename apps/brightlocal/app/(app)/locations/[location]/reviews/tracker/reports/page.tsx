"use client";

/**
 * Reports: the report's run history, on a page of its own.
 *
 * It used to be the last card on the Settings page. Ali, 17 Sep: "add a button
 * to the top of the report settings page that says Reports - We can basically
 * add Run History to that". Svitlana's review made the case: history inside
 * settings "put the result part into the settings part". Settings says what
 * the report does; this page says what it did.
 *
 * App-owned, not a promoted Studio screen. The runs come from lib/report-runs,
 * which the Settings page shares, so a run started there with Run report now
 * lands here when it finishes.
 */

import NextLink from "next/link";
import { SidebarProvider, SidebarTrigger, GlobalLayoutContentBody, Logo } from "@brightlocal/ui-components";
import { Button } from "@brightlocal/ui-components/button";
import { Badge } from "@brightlocal/ui-components/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@brightlocal/ui-components/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@brightlocal/ui-components/table";
import { AlertInfo } from "@brightlocal/ui-components/alert";
import { Menu, Settings, Link2 } from "@brightlocal/icons";
import { AppLayoutShell, ProposalSidebar, PageHeader, DateStamp, formatDate, formatDateTime } from "@brightlocal/proposal";
import { useLocationKey } from "@/lib/location";
import { RUN_STATE, reportSettingsPath, useReportRuns } from "@/lib/report-runs";

export default function ReportsPage() {
  const location = useLocationKey();
  const { runs } = useReportRuns();
  const partial = runs.find((r) => r.state === "partial");

  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        preset="live-site"
        navDensity="comfortable"
        stickyHeader
        flush
        pinnedSidebar
        dataHook="reports-app-layout"
        // Reports belongs to Review Tracker, like its settings.
        sidebar={<ProposalSidebar dataHook="reports-sidebar" activeId="reviews-insights" />}
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
            dataHook="reports-page-header"
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
              { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
              { label: "Review Tracker", goto: "screen:dmswb0i9c6oe5" },
              { label: "Settings", goto: "screen:dmtkj124xagqa" },
            ]}
            title="Reports"
            // A number, not a sentence, like every page header in RM.
            description={
              <span data-hook="page-stat">
                <span className="text-foreground font-medium tabular-nums">{runs.length}</span> runs
              </span>
            }
            statusRight={<DateStamp label="Last run" value={runs[0].at} dataHook="last-run" />}
            actions={
              <Button variant="outline" dataHook="reports-settings" asChild>
                <NextLink href={reportSettingsPath(location)}>
                  <Settings className="size-4" />
                  Settings
                </NextLink>
              </Button>
            }
          />
        }
      >
        <GlobalLayoutContentBody dataHook="reports-page-body" className="gap-4 pb-10">
          <Card dataHook="history-card" className="max-w-none">
            {/* No description under the title (Ali, 17 Sep: "fluff"). */}
            <CardHeader>
              <CardTitle dataHook="history-card-title">Run history</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Table dataHook="history-table" minWidth="640px" scrollRegionLabel="Report run history">
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead align="right">Reviews found</TableHead>
                    <TableHead align="right">New</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => {
                    const state = RUN_STATE[r.state];
                    return (
                      <TableRow key={r.id} dataHook={`run-${r.id}`}>
                        <TableCell>{formatDateTime(r.at) ?? formatDate(r.at)}</TableCell>
                        <TableCell>{r.trigger}</TableCell>
                        {/* tabular-nums so the counts line up down the page. */}
                        <TableCell align="right" className="tabular-nums">
                          {r.found.toLocaleString("en-GB")}
                        </TableCell>
                        <TableCell align="right" className="tabular-nums">
                          +{r.added}
                        </TableCell>
                        <TableCell>
                          <Badge variant={state.variant} dataHook={`run-${r.id}-state`}>
                            {state.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {/* A PARTIAL RUN NEEDS A ROUTE OUT, not just a badge. The fix
                  is the Facebook connection, which lives on Settings,
                  so Reconnect goes there and opens it. */}
              {partial ? (
                <AlertInfo
                  dataHook="history-note"
                  description={`Facebook was skipped on ${formatDate(partial.at.slice(0, 10))} because the connection had expired. Reconnect Facebook to include its reviews in future runs.`}
                  action={
                    <Button variant="ghost" size="sm" dataHook="reconnect-facebook" asChild>
                      <NextLink href={`${reportSettingsPath(location)}?connect=facebook`}>
                        <Link2 className="size-4" />
                        Reconnect
                      </NextLink>
                    </Button>
                  }
                />
              ) : null}
            </CardContent>
          </Card>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
