// PageHeaderWithBreadcrumbs — Page header: breadcrumb trail above the title, meta row below, no avatar/photo.
// keywords: page header, breadcrumbs, breadcrumb header, breadcrumb trail, title header, page title, header with breadcrumbs, navigation header
// components: global-layout, breadcrumb, typography, badge
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
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@brightlocal/ui-components/breadcrumb";
import { Badge } from "@brightlocal/ui-components/badge";
import { TypographyH2 } from "@brightlocal/ui-components/typography";

<GlobalLayoutContentHeader dataHook="page-header">
  <div className="flex w-full flex-wrap items-end justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">
      {/* Trail: ancestors as links, current page as BreadcrumbPage. */}
      <Breadcrumb dataHook="page-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Your Locations</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Blackberry Farm Park</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Monitor Reviews</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <TypographyH2 dataHook="page-title">Monitor Reviews</TypographyH2>
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <span>Blackberry Farm Park — Lewes, BN8 6JD</span>
        <Badge dataHook="location-status">Active</Badge>
      </div>
    </div>
    {/* Right side: page-level actions slot in here. */}
  </div>
</GlobalLayoutContentHeader>
