"use client";

// Promoted from Studio screen "Notifications v2"
// (design dmv8hrd1lm6pv, version 1792005847837). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 54490ee67526
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Notifications v2 (14 Oct 2026): the business portal's Notifications page
// on staging, as "Glint - Web Portal - Full New" draws it (Notifications ·
// Default, 190:109450). Opened from the header's bell.
//
// LAYOUT: the title row (Raleway Bold 24/32, and Mark all as read, the Web
// DS Button outline sm, on the right); then, 16 under it, the list, Web DS ListItems with
// no card behind them: a TransactionIcon (info for Security, Regulatory and
// Service; the activity glyphs otherwise), the title over its line, and on
// the right the date over its category, with "New" above a fresh row's
// date in warning.
//
// A DEMO: Mark all as read clears every "New" and the bell's badge for the
// tab (PortalV2.useNotifications); rows open nothing. ASSUMPTION: the rows
// are Figma's sample notifications, not built from the persona's activity.
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { PortalV2 } from "@/lib/portal-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

export default function NotificationsPage() {
  const [rows, unread, markAllRead] = PortalV2.useNotifications();
  return (
    <>
      <AppChromeV2.Main>
        {/* 16 between the title row and the list, not Main's 24. */}
        <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <AppChromeV2.Title>Notifications</AppChromeV2.Title>
          <WebDsV2.Button variant="outline" size="sm" onClick={markAllRead} disabled={!unread}>
            Mark all as read
          </WebDsV2.Button>
        </div>
        <div className="flex flex-col">
          {rows.map((n: any) => (
            <WebDsV2.ListItem
              key={n.id}
              leading={<WebDsV2.TxIcon type={n.icon} />}
              title={n.title}
              subtitle={n.body}
              valueTop={n.fresh ? "New" : null}
              value={n.when}
              subValue={n.category}
            />
          ))}
        </div>
        </div>
      </AppChromeV2.Main>
    </>
  );
}
