// LocationPageHeader — The live platform's location page header: responsive photo, business name, meta row (location, rating, status badge), last-updated.
// keywords: page header, location header, business header, header card, location title, page title, business name header, last updated, location photo
// components: global-layout, aspect-ratio, typography, badge
// Hand-authored from the LIVE platform DOM (location summary, 14 Jul 2026)
// — the canonical example. Photo swapped for a stock placeholder. Note the
// status badge: the DS ships no "success" variant (their MCP lists this as
// a limitation), so the live product paints it with success tokens via
// className — the ONE sanctioned exception to the no-restyling rule (see
// rules/90-audit.md). Hand-edit freely; the MCP harvester does not
// overwrite custom-named files.

import { GlobalLayoutContentHeader } from "@brightlocal/ui-components/global-layout";
import { AspectRatio } from "@brightlocal/ui-components/aspect-ratio";
import { Badge } from "@brightlocal/ui-components/badge";
import {
  TypographyH2,
  TypographySmall,
} from "@brightlocal/ui-components/typography";
import { MapPin, Star } from "@brightlocal/icons";

<GlobalLayoutContentHeader dataHook="page-header">
  <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div
      className="flex w-full flex-col gap-4 md:flex-row md:items-center"
      data-hook="location-header-card"
    >
      {/* Location photo — full-width 21:9 below md, compact w-24 16:10
          thumbnail from md up (two mounts, CSS-toggled, like live). */}
      <div className="w-full md:hidden">
        <AspectRatio dataHook="location-header-card-photo-sm" ratio={21 / 9}>
          <img
            alt="Brighton Bierhaus location photo"
            className="h-full w-full rounded-xl object-cover"
            src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
          />
        </AspectRatio>
      </div>
      <div className="hidden w-24 shrink-0 md:block">
        <AspectRatio dataHook="location-header-card-photo-lg" ratio={16 / 10}>
          <img
            alt="Brighton Bierhaus location photo"
            className="h-full w-full rounded-xl object-cover"
            src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80"
          />
        </AspectRatio>
      </div>
      <div className="flex flex-col gap-1.5">
        <TypographyH2 dataHook="location-business-name">
          Brighton Bierhaus
        </TypographyH2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span>Brighton and Hove, BN2 0JB</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-3.5 fill-yellow-400 stroke-yellow-400" />
            <span>4.6 (539 reviews)</span>
          </span>
          <span className="basis-full md:basis-auto">
            <Badge
              dataHook="location-status-badge-active"
              className="border-transparent bg-success-background text-success-foreground"
            >
              Active
            </Badge>
          </span>
        </div>
      </div>
    </div>
    <div className="md:shrink-0">
      <TypographySmall dataHook="location-last-updated">
        Last updated: 14/07/26
      </TypographySmall>
    </div>
  </div>
</GlobalLayoutContentHeader>
