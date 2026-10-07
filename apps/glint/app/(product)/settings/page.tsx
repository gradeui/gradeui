"use client";

// Promoted from Studio screen "Settings v2"
// (design dmuyhn3548vjg, version 1791408417297). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 61e2520aedee
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Settings v2 (7 Oct 2026): the business portal's Settings page on
// staging, as "Glint - Web Portal - Full New" draws it (Settings ·
// Default). Reached from the avatar menu's Settings (the only entry point
// the designs show: the sidebar's Help item is hidden in every slide).
//
// LAYOUT (re-read 7 Oct evening, after Ali changed the slide): the title,
// Raleway Bold 24/32; then two columns 32 apart, the content 640 wide and
// a 296 side column. The content is Business profile (the name on a muted
// panel, 12 corners, 20 and 16 in: Figma's 8 and 16 round a row with 12
// above and below, and the note under it), Help and legal
// (Contact support, Fees, Terms and privacy) and Documents (Statements,
// Tax documents), 32 apart; a section is its heading (Chivo SemiBold
// 18/28) and its rows 12 under it, Web DS OptionRows (chevron) 8 apart.
// The side column is Display: Units (g, oz t) and Appearance (System,
// Light, Dark), each a label, a full-width Web DS segmented control and a
// note, 4 apart. The Auto-buy and Close account sections are gone from the
// slide, so they are gone here. On mobile the side column follows the
// content.
//
// A DEMO: Units writes the persona's unit preferences for the tab, so the
// wallet cards change with it; Appearance switches the page's mode for the
// tab. The document, help and close rows open nothing (the demo has
// nowhere for them to go), and nothing is saved anywhere real.
//
// ASSUMPTIONS:
//   - Figma shows "Acme Corp" (sample data); this shows the persona's
//     business, Ridgeline Construction;
//   - Appearance opens on the mode the page is in (staging is dark by
//     default), rather than on Figma's sample "System";
//   - the Units note is Figma's single line, shown whichever unit is set.
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { WebDsV2 } from "@/components/web-ds-v2";

const UNITS = [
  { value: "g", label: "g" },
  { value: "oz", label: "oz t" },
];
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
  const set = (next: string) => {
    setMode(next);
    const dark =
      next === "dark" || (next === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", Boolean(dark));
  };
  return [mode, set] as const;
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <AppChromeV2.Heading>{title}</AppChromeV2.Heading>
      {children}
    </section>
  );
}

/** A Display control: label, full-width segmented, note, 4 apart. */
function DisplayControl({
  label,
  note,
  value,
  onValueChange,
  options,
}: {
  label: string;
  note: string;
  value: string;
  onValueChange: (v: any) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">{label}</span>
      <WebDsV2.Segmented aria-label={label} stretch value={value} onValueChange={onValueChange} options={options} />
      <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">{note}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [goldUnit, setGoldUnit] = Persona.usePreference("unit.gold");
  const [, setSilverUnit] = Persona.usePreference("unit.silver");
  const [mode, setMode] = useAppearance();

  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>Settings</AppChromeV2.Title>
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-8 md:max-w-[640px]">
            <SettingsSection title="Business profile">
              <div className="flex flex-col gap-0.5 rounded-[12px] bg-[var(--wds-muted)] px-4 py-5">
                <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">Business name</span>
                <span className="text-base font-medium leading-6 text-[color:var(--wds-foreground)]">
                  {Persona.DEFAULT.business}
                </span>
              </div>
              <p className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">
                This is the name on your account. Contact us to change it.
              </p>
            </SettingsSection>
            <SettingsSection title="Help and legal">
              <div className="flex flex-col gap-2">
                <WebDsV2.OptionRow trailing="chevron" title="Contact support" description="Get help from our team" />
                <WebDsV2.OptionRow trailing="chevron" title="Fees" description="What we charge and when" />
                <WebDsV2.OptionRow
                  trailing="chevron"
                  title="Terms and privacy"
                  description="Our terms of service and privacy policy"
                />
              </div>
            </SettingsSection>
            <SettingsSection title="Documents">
              <div className="flex flex-col gap-2">
                <WebDsV2.OptionRow trailing="chevron" title="Statements" description="Monthly account statements" />
                <WebDsV2.OptionRow trailing="chevron" title="Tax documents" description="Annual tax forms" />
              </div>
            </SettingsSection>
          </div>
          <div className="flex w-full flex-col gap-8 md:w-[296px] md:shrink-0">
            <SettingsSection title="Display">
              <DisplayControl
                label="Units"
                note="Troy ounces, the standard for precious metals."
                value={goldUnit}
                onValueChange={(u: "g" | "oz") => {
                  setGoldUnit(u);
                  setSilverUnit(u);
                }}
                options={UNITS}
              />
              <DisplayControl
                label="Appearance"
                note="System follows your device."
                value={mode}
                onValueChange={setMode}
                options={APPEARANCE}
              />
            </SettingsSection>
          </div>
        </div>
      </AppChromeV2.Main>
    </>
  );
}
