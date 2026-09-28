// PageHeaderWithBreadcrumbs — Page header: breadcrumb trail above the title, meta row below, no avatar/photo.
// keywords: page header, breadcrumbs, breadcrumb header, breadcrumb trail, title header, page title, header with breadcrumbs, navigation header
// components: global-layout, breadcrumb, tooltip, typography-heading, badge
// Hand-authored (July 2026, sidebar/layout explorations) — the leaner
// counterpart to location-page-header.jsx (which carries the photo
// treatment). There is NO PageHeader component in the DS — the page
// header is a composition inside GlobalLayoutContentHeader; this recipe
// IS that composition. The MCP harvester does not overwrite
// custom-named files.

import { GlobalLayoutContentHeader } from "@brightlocal/ui-components/global-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@brightlocal/ui-components/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@brightlocal/ui-components/tooltip";
import { Badge } from "@brightlocal/ui-components/badge";
import { TypographyHeading } from "@brightlocal/ui-components/typography-heading";

<GlobalLayoutContentHeader dataHook="page-header">
  <div className="flex w-full flex-wrap items-end justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">
      {/* Trail RULES are the DS's (Breadcrumb docs, NP spec, 28 Sep):
          ancestors only, since the title below IS the current page, so
          BreadcrumbPage is deliberately unused. At most three crumbs: a
          deeper trail keeps the root and the nearest ancestor and puts
          the middle behind a BreadcrumbEllipsis in a DropdownMenuTrigger.
          The root never drops. Only the location crumb truncates, at
          max-w-48 with its full name in a Tooltip. */}
      <Breadcrumb dataHook="page-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Your Locations</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BreadcrumbLink href="#" className="min-w-0 max-w-48 truncate">
                    Blackberry Farm Park
                  </BreadcrumbLink>
                </TooltipTrigger>
                <TooltipContent side="bottom">Blackberry Farm Park</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <TypographyHeading level={1} variant="page" dataHook="page-title">
        Monitor Reviews
      </TypographyHeading>
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <span>Blackberry Farm Park — Lewes, BN8 6JD</span>
        <Badge dataHook="location-status">Active</Badge>
      </div>
    </div>
    {/* Right side: page-level actions slot in here. */}
  </div>
</GlobalLayoutContentHeader>
