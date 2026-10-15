// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "Profile v2"
// (design dmv8hrbkp0e3v, version 1792052356584). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 1b51e26243d0
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Profile v2 (14 Oct 2026): the business portal's Profile page on staging,
// as "Glint - Web Portal - Full New" draws it (Profile · Units g, 87:42743,
// and Units oz t, 190:251685). Opened from the account menu's Profile. It
// takes over from Settings v2: /settings now lands here, and Settings'
// Help and legal and Documents rows have no home in Full New, so they are
// gone (Ali chose to follow Figma, 14 Oct).
//
// LAYOUT: the title, Raleway Bold 24/32; then two columns 32 apart, the
// content 640 wide and a 296 side column (as Settings had them). Personal
// details is its heading (Chivo SemiBold 18/28), a 12/16 note and one
// muted card (12 corners, 20 above and below, 16 sides) of label and value
// pairs 24 apart: the label Chivo 14/20 in muted-foreground, the value
// Chivo Medium 16/24 in foreground, 2 between. The side column is Display:
// Units (g, oz t) and Appearance (System, Light, Dark), each a label, a
// full-width Web DS segmented control and a note, 4 apart. On mobile the
// side column follows the content.
//
// 14 OCT, ALI'S CALL ("we need to match the fields exactly for profile and
// address in Figma and Our Prototype (we dont need tabs)"): Personal
// details carries the Glint build's six fields, Title, First name, Middle
// names, Last name, Email, Phone, unmasked; under it its Home address card
// (15 Oct: without the Glint build's Primary badge, Ali's call), with
// House name or number, Street name, Flat or unit,
// Town or city, State, ZIP code, Country. Both are Figma's muted card,
// the fields two to a row as the Glint build sets them. One page, no
// tabs; /console/user/addresses lands here.
// ASSUMPTIONS: Figma's Display section (Units, Appearance) stays, since the
// account menu points here; the address note is the Glint build's own.
//
// A DEMO: Units writes the persona's unit preferences for the tab, so every
// balance changes with it; Appearance switches the page's mode for the tab.
// The details are PortalV2's (Figma's Wade Jones at Acme Corp).
//
// ASSUMPTIONS:
//   - the Units note follows the unit, as the two Figma states write it;
//   - Figma only draws Appearance on System, whose note is "System follows
//     your device."; Light and Dark show no note (the 12 Oct bug: Dark
//     still claimed to follow the device);
//   - Appearance opens on the mode the page is in (staging is dark by
//     default), rather than on Figma's sample "System".
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { PortalV2 } from "@/lib/portal-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const UNITS = [
  { value: "g", label: "g" },
  { value: "oz", label: "oz t" },
];
const UNIT_NOTE = {
  g: "Grams are shown across your account.",
  oz: "Troy ounces are shown across your account.",
};
const APPEARANCE = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** The page's mode for this tab: System follows the device. */
function useAppearance() {
  const [mode, setMode] = React.useState("dark");
  React.useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const set = (next) => {
    setMode(next);
    const dark =
      next === "dark" || (next === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", Boolean(dark));
  };
  return [mode, set];
}

/** A Display control: label, full-width segmented, note, 4 apart. */
function DisplayControl({ label, note, value, onValueChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">{label}</span>
      <WebDsV2.Segmented aria-label={label} stretch value={value} onValueChange={onValueChange} options={options} />
      {note ? <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">{note}</span> : null}
    </div>
  );
}

/** One label and value pair on a details card. */
function Detail({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{label}</span>
      <span className="break-words text-base font-medium leading-6 text-[color:var(--wds-foreground)]">{children}</span>
    </div>
  );
}

/** Figma's muted card with the fields two to a row. */
function DetailsCard({ children }) {
  return <div className="grid grid-cols-1 gap-6 rounded-[12px] bg-[var(--wds-muted)] px-4 py-5 sm:grid-cols-2">{children}</div>;
}

export default function ProfilePage() {
  const [goldUnit, setGoldUnit] = Persona.usePreference("unit.gold");
  const [, setSilverUnit] = Persona.usePreference("unit.silver");
  const [mode, setMode] = useAppearance();
  const p = PortalV2.PROFILE;

  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>Profile</AppChromeV2.Title>
        <div className="flex flex-col gap-8 md:flex-row">
          <section className="flex min-w-0 flex-1 flex-col gap-3 md:max-w-[640px]">
            <AppChromeV2.Heading>Personal details</AppChromeV2.Heading>
            <p className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">
              These are your personal details. Contact us to change them.
            </p>
            <DetailsCard>
              <Detail label="Title">{p.title}</Detail>
              <Detail label="First name">{p.firstName}</Detail>
              <Detail label="Middle names">{p.middleNames || "None"}</Detail>
              <Detail label="Last name">{p.lastName}</Detail>
              <Detail label="Email">{p.email}</Detail>
              <Detail label="Phone">{p.phone}</Detail>
            </DetailsCard>
            {/* No Primary badge (Ali, 15 Oct), although the Glint build has one. */}
            <AppChromeV2.Heading className="mt-5">Home address</AppChromeV2.Heading>
            <p className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">Your primary residential address.</p>
            <DetailsCard>
              <Detail label="House name or number">{p.address.house}</Detail>
              <Detail label="Street name">{p.address.street}</Detail>
              <Detail label="Flat or unit">{p.address.flat}</Detail>
              <Detail label="Town or city">{p.address.town}</Detail>
              <Detail label="State">{p.address.state}</Detail>
              <Detail label="ZIP code">{p.address.zip}</Detail>
              <Detail label="Country">{p.address.country}</Detail>
            </DetailsCard>
          </section>
          <section className="flex w-full flex-col gap-3 md:w-[296px] md:shrink-0">
            <AppChromeV2.Heading>Display</AppChromeV2.Heading>
            <DisplayControl
              label="Units"
              note={UNIT_NOTE[goldUnit] ?? UNIT_NOTE.g}
              value={goldUnit}
              onValueChange={(u) => {
                setGoldUnit(u);
                setSilverUnit(u);
              }}
              options={UNITS}
            />
            <DisplayControl
              label="Appearance"
              note={mode === "system" ? "System follows your device." : null}
              value={mode}
              onValueChange={setMode}
              options={APPEARANCE}
            />
          </section>
        </div>
      </AppChromeV2.Main>
    </>
  );
}
