// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// PortalV2 (14 Oct 2026): who the business portal v2 says is signed in,
// and what the portal tells them. Data only, plus one hook.
//
// TWIN: the Studio shared component "PortalV2" (cmv8hr8r7l2xex). Editing one does
// not touch the other. Keep the pair in sync.
//
// WHY NOT Persona: Persona is shared with the live demo's v1 screens and
// the onboarding wizard (Ridgeline Construction). Ali chose to follow
// "Glint - Web Portal - Full New" on staging (14 Oct), which names the
// business Acme Corp and gives Wade a profile, so the portal's identity
// lives here and Persona stays as it was.
//
// ASSUMPTION (14 Oct): only the NAMES follow Figma. Balances, vaults and
// activity still come from Persona, because Ali parked the numbers on
// 7 Oct ("we can rationalise numbers at some point") and the live Glint
// build is setting its own. Figma's $4,878.36 and friends are not used.
//
//   PortalV2.business                 "Acme Corp"
//   PortalV2.PROFILE                  Wade's personal details and home address (Profile page)
//   PortalV2.NOTIFICATIONS            the Notifications page's rows
//   PortalV2.useNotifications()       [rows with read applied, unread count, markAllRead]
import * as React from "react";
import { FlowStore } from "@/lib/flow-store";

const BUSINESS = "Acme Corp";

/* Profile (14 Oct, Ali: "match the fields exactly for profile and address
   in Figma and Our Prototype"): the Glint build's fields, unmasked ("we
   dont need to mask them for now"). fullName is what the menus show.
   ASSUMPTION: Wade has no middle name, shown as "None". */
const PROFILE = {
  fullName: "Wade Jones",
  title: "Mr",
  firstName: "Wade",
  middleNames: "",
  lastName: "Jones",
  email: "wade.jones@acmecorp.com",
  phone: "+1 415 555 0142",
  /* The Glint build's Home address card, field for field. */
  address: {
    house: "1200",
    street: "Market Street",
    flat: "Apt 4B",
    town: "San Francisco",
    state: "CA",
    zip: "94102",
    country: "US",
  },
};

/* Notifications · Default (190:109450), newest first. `icon` is a Web DS
   TransactionIcon type; `category` is the line under the date; `fresh`
   rows carry "New" until Mark all as read. ASSUMPTION: the two activity
   rows' figures are Figma's, not the persona's own activity. */
const NOTIFICATIONS = [
  {
    id: "signin",
    icon: "info",
    title: "New sign-in to your account",
    body: "Chrome on macOS in San Francisco. If this wasn't you, contact us.",
    when: "Today at 09:12",
    category: "Security",
    fresh: true,
  },
  {
    id: "terms",
    icon: "info",
    title: "Updated terms of service",
    body: "Please review the changes before 1 November.",
    when: "Yesterday",
    category: "Regulatory",
    fresh: true,
  },
  {
    id: "gold-bought",
    icon: "exchange-to-metal",
    title: "Gold bought",
    body: "7.4058 g at $135.03 / g, held in Zurich.",
    when: "Sep 30",
    category: "Activity",
  },
  {
    id: "deposit",
    icon: "transfer-in",
    title: "Deposit received",
    body: "$2,500.00 by wire transfer.",
    when: "Sep 29",
    category: "Activity",
  },
  {
    id: "silver-sold",
    icon: "exchange-to-money",
    title: "Silver sold",
    body: "100.0000 g for $207.00.",
    when: "Sep 24",
    category: "Activity",
  },
  {
    id: "auto-buy",
    icon: "auto-buy",
    title: "Auto-buy complete",
    body: "18.3392 g of gold for $2,500.00, held in Miami.",
    when: "Sep 15",
    category: "Activity",
  },
  {
    id: "maintenance",
    icon: "info",
    title: "Scheduled maintenance",
    body: "The portal was unavailable on Sunday from 2am to 4am ET.",
    when: "Sep 12",
    category: "Service",
  },
];

/** The rows with "read" applied for this tab, how many are unread, and
 *  Mark all as read. Kept in FlowStore, so the bell's count and the page
 *  agree and survive navigation. */
function useNotifications() {
  const [read, setRead] = FlowStore.useField("v2.notifications.read", false);
  const rows = read ? NOTIFICATIONS.map((n) => ({ ...n, fresh: false })) : NOTIFICATIONS;
  const unread = rows.filter((n) => n.fresh).length;
  const markAllRead = React.useCallback(() => setRead(true), [setRead]);
  return [rows, unread, markAllRead];
}

/** A namespace: it renders nothing. */
function PortalV2() {
  return null;
}
PortalV2.business = BUSINESS;
PortalV2.PROFILE = PROFILE;
PortalV2.NOTIFICATIONS = NOTIFICATIONS;
PortalV2.useNotifications = useNotifications;

/* Exported untyped: the body is plain JSX (see the header). */
const __PortalV2: any = PortalV2;
export { __PortalV2 as PortalV2 };
