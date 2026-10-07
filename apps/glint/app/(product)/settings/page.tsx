"use client";

// Promoted from Studio screen "Settings v2"
// (design dmuyhn3548vjg, version 1791400560887). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: a76a4bce3b11
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Settings v2 (7 Oct 2026): the business portal's Settings page on
// staging, as "Glint - Web Portal - Full New" draws it (Settings ·
// Default). Reached from the avatar menu's Settings (the only entry point
// the designs show: the sidebar's Help item is hidden in every slide).
//
// LAYOUT: the title, Raleway Bold 24/32; then three rows of two sections,
// 24 apart across and 32 down; a section is its heading (Chivo SemiBold
// 18/28) and its rows 12 under it, Web DS OptionRows (chevron) 8 apart.
//   - Auto-buy: one row with the gold G, "Auto-buy" and its state, which
//     opens the Auto-buy drawer.
//   - Business profile: the name on a muted panel (12 corners, 8 and 16
//     in), and the note under it.
//   - Documents: Statements, Tax documents.
//   - Help and legal: Contact support, Fees, Terms and privacy.
//   - Display: Units (g, oz t) and Appearance (System, Light, Dark), Web DS
//     segmented controls the full width of their half, each with its note.
//   - Close account: one row.
//
// A DEMO: Units writes the persona's unit preferences for the tab, so the
// wallet cards change with it; Appearance switches the page's mode for the
// tab. The document, help and close rows open nothing (the demo has
// nowhere for them to go), and nothing is saved anywhere real.
//
// ASSUMPTIONS:
//   - the Auto-buy line is composed from the settings: "On. Buying Gold in
//     Zurich with every deposit." as Figma writes it; off reads "Off.";
//   - Figma shows "Acme Corp" (sample data); this shows the persona's
//     business, Ridgeline Construction;
//   - Appearance opens on the mode the page is in (staging is dark by
//     default), rather than on Figma's sample "System";
//   - the Units note is Figma's single line, shown whichever unit is set.
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { AutoBuyV2 } from "@/components/auto-buy-v2";
import { Wordmark } from "@/components/wordmark";
import { WebDsV2 } from "@/components/web-ds-v2";
import { VaultsV2 } from "@/lib/vaults-v2";

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
  return [mode, set];
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <AppChromeV2.Heading>{title}</AppChromeV2.Heading>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const s = AutoBuyV2.useSettings();
  const [autoBuyOpen, setAutoBuyOpen] = React.useState(false);
  const [goldUnit, setGoldUnit] = Persona.usePreference("unit.gold");
  const [, setSilverUnit] = Persona.usePreference("unit.silver");
  const [mode, setMode] = useAppearance();
  const autoBuyLine = s.on
    ? `On. Buying ${AutoBuyV2.METAL_LABEL[s.metal]}${s.vault ? ` in ${VaultsV2.label(s.vault)}` : ""} with every deposit.`
    : "Off.";

  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>Settings</AppChromeV2.Title>
        <div className="flex flex-col gap-8">
          <div className="grid items-start gap-8 md:grid-cols-2 md:gap-6">
            <SettingsSection title="Auto-buy">
              <WebDsV2.OptionRow
                trailing="chevron"
                tile="lg"
                logo={
                  <Wordmark lockup="mark" tone="current" className="size-6" style={{ color: "var(--wds-gold-accent)" }} />
                }
                title="Auto-buy"
                description={autoBuyLine}
                onSelect={() => setAutoBuyOpen(true)}
              />
              <AutoBuyV2.Drawer open={autoBuyOpen} onOpenChange={setAutoBuyOpen} />
            </SettingsSection>
            <SettingsSection title="Business profile">
              <div className="flex flex-col gap-0.5 rounded-[12px] bg-[var(--wds-muted)] px-4 py-2">
                <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">Business name</span>
                <span className="text-base font-medium leading-6 text-[color:var(--wds-foreground)]">
                  {Persona.DEFAULT.business}
                </span>
              </div>
              <p className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">
                This is the name on your account. Contact us to change it.
              </p>
            </SettingsSection>
          </div>

          <div className="grid items-start gap-8 md:grid-cols-2 md:gap-6">
            <SettingsSection title="Documents">
              <div className="flex flex-col gap-2">
                <WebDsV2.OptionRow trailing="chevron" title="Statements" description="Monthly account statements" />
                <WebDsV2.OptionRow trailing="chevron" title="Tax documents" description="Annual tax forms" />
              </div>
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
          </div>

          <div className="grid items-start gap-8 md:grid-cols-2 md:gap-6">
            <SettingsSection title="Display">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Units</span>
                  <WebDsV2.Segmented
                    aria-label="Units"
                    stretch
                    value={goldUnit}
                    onValueChange={(u: "g" | "oz") => {
                      setGoldUnit(u);
                      setSilverUnit(u);
                    }}
                    options={UNITS}
                  />
                  <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">
                    Troy ounces, the standard for precious metals.
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Appearance</span>
                  <WebDsV2.Segmented aria-label="Appearance" stretch value={mode} onValueChange={setMode} options={APPEARANCE} />
                  <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">System follows your device.</span>
                </div>
              </div>
            </SettingsSection>
            <SettingsSection title="Close account">
              <WebDsV2.OptionRow
                trailing="chevron"
                title="Close account"
                description="Talk to our team about closing your account."
              />
            </SettingsSection>
          </div>
        </div>
      </AppChromeV2.Main>
    </>
  );
}
