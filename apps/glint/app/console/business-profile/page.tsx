"use client";

// Promoted from Studio screen "Business profile v2"
// (design dmv8hrg7gdew8, version 1792005426124). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 2929ed6be126
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Business profile v2 (14 Oct 2026): the business portal's Business profile
// page on staging, as "Glint - Web Portal - Full New" draws it (Business
// profile · Default, 188:64357). Opened from the sidebar's third item.
//
// LAYOUT: the title, Raleway Bold 24/32; the business name on a full-width
// muted panel (12 corners, 20 above and below, 16 sides: Chivo 14/20 label
// in muted-foreground over Chivo Medium 16/24), and the 12/16 note 12 under
// it. The name is PortalV2's (Figma's Acme Corp).
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { PortalV2 } from "@/lib/portal-v2";

export default function BusinessProfilePage() {
  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>Business profile</AppChromeV2.Title>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5 rounded-[12px] bg-[var(--wds-muted)] px-4 py-5">
            <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">Business name</span>
            <span className="text-base font-medium leading-6 text-[color:var(--wds-foreground)]">{PortalV2.business}</span>
          </div>
          <p className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">
            This is the name on your account. Contact us to change it.
          </p>
        </div>
      </AppChromeV2.Main>
    </>
  );
}
