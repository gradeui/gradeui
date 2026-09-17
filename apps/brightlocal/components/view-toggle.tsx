"use client";

/**
 * Chart or table, for a chart card. The same control Review Tracker puts on
 * its Review performance and Timeline cards (Ali, 17 Sep: a campaign's
 * Reviews over time chart "will need to be backed by chart or table view,
 * like on Review Tracker"), shared so the Review Builder variants do not each
 * carry a copy.
 *
 * A real DS ToggleGroup with icon items and tooltips. The guard in
 * onValueChange is load-bearing: Radix's single-select group lets you
 * deselect the ACTIVE item, which would hand back "" and blank the card body.
 * TooltipProvider is here because the DS Tooltip does not bring its own and
 * these cards sit on pages that do not all have one.
 */

import { ToggleGroup, ToggleGroupItem } from "@brightlocal/ui-components/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@brightlocal/ui-components/tooltip";
import { ChartColumn, Table2 } from "@brightlocal/icons";

export type ChartView = "chart" | "table";

export function ViewToggle({
  view,
  onChange,
  idPrefix,
}: {
  view: ChartView;
  onChange: (next: ChartView) => void;
  /** Prefixes the data hooks: `${idPrefix}-view-toggle` and the two items. */
  idPrefix: string;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(next: string) => {
          if (next) onChange(next as ChartView);
        }}
        variant="outline"
        size="sm"
        dataHook={`${idPrefix}-view-toggle`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="chart" ariaLabel="Chart view" dataHook={`${idPrefix}-chart-view`}>
              <ChartColumn />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent dataHook={`${idPrefix}-chart-view-tooltip`}>Chart</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="table" ariaLabel="Table view" dataHook={`${idPrefix}-table-view`}>
              <Table2 />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent dataHook={`${idPrefix}-table-view-tooltip`}>Table</TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}
