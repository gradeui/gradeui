// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// AutoBuyV2 (7 Oct 2026): auto-buy for the business portal v2 on staging,
// as "Glint - Web Portal - Full New" designs it: the Auto-buy card on
// Wallets, and the Auto-buy drawer (page "Auto-buy": On, Off, No vault ·
// Info, No vault · Warning, Saved).
//
// TWIN: the Studio shared component "AutoBuyV2" (cmuygu2npaocck). Editing one does
// not touch the other. Keep the pair in sync.
//
// THE DATA, as entities (Ali's rule, glint-data-modelling): auto-buy is
// three stored values, never a sentence. Whether it is on and which metal
// ride the persona's existing "autoInvest" preference ("none" | "gold" |
// "silver"), so the USD card, the activity method names and this drawer
// all agree; the vault is its own key, "autobuy.vault", a VaultsV2 id or
// "" for none chosen yet. The demo opens with gold into Zurich, as the
// Wallets slide shows ("Gold · Zurich", Active). The metal last chosen is
// kept in "autobuy.metal" so switching off and on again keeps it.
//
// A DEMO: nothing is scheduled and no money moves. Save only writes these
// keys for the tab (FlowStore, sessionStorage).
//
//   const s = AutoBuyV2.useSettings();   // { on, metal, vault, save(next) }
//   <AutoBuyV2.Card />                   the card; its chevron opens the drawer
//
// THE DRAWER, state by state (Web DS Sheet, Width=sm; OptionRows):
//   - On: "Set auto-buy to on" with the Auto-buy switch row, the rates
//     note, then "Precious metal" (Gold, Silver, each with its G) and
//     "Vault" (Zurich, Brink's Switzerland; Miami, Brink's Florida) as
//     radio rows, and Save (Web DS Button xl) in the footer.
//   - Off: the switch off; the metal and vault rows disabled (50%) and
//     no vault chosen, as the Off slide draws it.
//   - No vault · Info: switched on with no vault chosen, an info Alert
//     "No vault selected" heads the drawer.
//   - No vault · Warning: pressing Save in that state turns the Alert to
//     warning and saves nothing.
//   - Saved: after a save, a success Alert "Auto-buy saved".
//   Save is live (as on the On slide) while auto-buy is on with a vault,
//   until it has saved; otherwise it shows the Web DS Disabled state, as
//   the Off, No vault and Saved slides draw it.
//   ASSUMPTIONS: switching auto-buy OFF takes effect at once, since Save
//   is disabled in the Off slide and there would be no other way to
//   store it; and Save stays pressable while it looks disabled for want
//   of a vault, because pressing it is the only way to reach the Warning
//   slide.
import * as React from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { Persona } from "@/lib/persona";
import { FlowStore } from "@/lib/flow-store";
import { VaultsV2 } from "@/lib/vaults-v2";
import { Wordmark } from "@/components/wordmark";
import { WebDsV2 } from "@/components/web-ds-v2";
import { SideDrawer } from "@/components/side-drawer";

const METAL_LABEL = { gold: "Gold", silver: "Silver" };
const METALS = ["gold", "silver"];
/** Who holds the metal in each vault, as the Auto-buy slides name them. */
const CUSTODIAN = { zurich: "Brink’s Switzerland", miami: "Brink’s Florida" };
const VAULTS = ["zurich", "miami"];

function useSettings() {
  const [invest, setInvest] = Persona.usePreference("autoInvest");
  const [lastMetal, setLastMetal] = FlowStore.useField("autobuy.metal", "gold");
  const [vault, setVault] = FlowStore.useField("autobuy.vault", "zurich");
  const on = invest === "gold" || invest === "silver";
  const metal = on ? invest : lastMetal;
  const save = (next) => {
    setLastMetal(next.metal);
    setVault(next.vault);
    setInvest(next.on ? next.metal : "none");
  };
  return { on, metal, vault, save };
}

/** The Web DS AutobuyCard (Wallets · Default): 20 all round, 8 between, 16
 *  corners, card with a border. "Auto-buy" in Raleway Bold 20/28 with the
 *  Active badge, a 36 round ghost chevron, the line under it in Chivo
 *  16/24 muted-foreground, a rule, then the metal and its vault in Raleway
 *  Bold 20/28. ASSUMPTION: switched off, the badge reads "Off" in the
 *  secondary Badge and the metal line goes, since Figma draws only the
 *  Active card. */
function Card({ className }) {
  const s = useSettings();
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className={`flex flex-col gap-2 rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-card)] p-5 ${className ?? ""}`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold leading-7 text-[color:var(--wds-foreground)]">
              Auto-buy
            </span>
            <WebDsV2.Badge variant={s.on ? "default" : "secondary"}>{s.on ? "Active" : "Off"}</WebDsV2.Badge>
          </div>
          <button
            type="button"
            aria-label="Auto-buy settings"
            onClick={() => setOpen(true)}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[var(--wds-accent)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <span className="text-base leading-6 text-[color:var(--wds-muted-foreground)]">
          Automatically buy gold or silver when money transfers
        </span>
      </div>
      {s.on ? (
        <div className="mt-auto flex flex-col gap-2">
          <WebDsV2.Divider />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 py-1">
              <Wordmark
                lockup="mark"
                tone="current"
                className="size-6 shrink-0"
                style={{ color: `var(--wds-${s.metal}-accent)` }}
              />
              <span className="font-display text-xl font-bold leading-7">{METAL_LABEL[s.metal]}</span>
            </span>
            {s.vault ? (
              <span className="flex items-center gap-1">
                <MapPin aria-hidden className="size-6 shrink-0" strokeWidth={2} />
                <span className="font-display text-xl font-bold leading-7">{VaultsV2.label(s.vault)}</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <Drawer open={open} onOpenChange={setOpen} />
    </div>
  );
}

/** The G for a metal, in its accent (Web DS GlintMark, Tone=gold/silver). */
function Mark({ metal }) {
  return (
    <Wordmark lockup="mark" tone="current" className="size-6" style={{ color: `var(--wds-${metal}-accent)` }} />
  );
}

/** The Auto-buy drawer (see THE DRAWER in the header). */
function Drawer({ open, onOpenChange }) {
  const s = useSettings();
  const [draft, setDraft] = React.useState({ on: s.on, metal: s.metal, vault: s.on ? s.vault : "" });
  const [saved, setSaved] = React.useState(false);
  const [warn, setWarn] = React.useState(false);

  /* Each opening starts from what is stored. */
  React.useEffect(() => {
    if (!open) return;
    setDraft({ on: s.on, metal: s.metal, vault: s.on ? s.vault : "" });
    setSaved(false);
    setWarn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const change = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };
  const missingVault = draft.on && !draft.vault;
  /* Save is live once auto-buy is on with a vault, until it has saved. */
  const canSave = draft.on && Boolean(draft.vault) && !saved;
  const press = () => {
    if (missingVault) {
      setWarn(true);
      return;
    }
    if (!canSave) return;
    s.save(draft);
    setSaved(true);
    setWarn(false);
  };
  /* Switching off takes effect at once and clears the vault (the Off
     slide); switching on asks for a vault again. */
  const toggle = () => {
    if (draft.on) {
      const next = { ...draft, on: false, vault: "" };
      setDraft(next);
      s.save(next);
      setSaved(false);
      setWarn(false);
    } else {
      change({ on: true });
    }
  };

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange}>
      <SideDrawer.Header title="Auto-buy" />
      <SideDrawer.Body>
        <div className="flex flex-col gap-4">
          {saved ? (
            <WebDsV2.Alert tone="success" title="Auto-buy saved">
              We’ve updated your auto-buy settings.
            </WebDsV2.Alert>
          ) : missingVault ? (
            <WebDsV2.Alert tone={warn ? "warning" : "info"} title="No vault selected">
              We need to know which vault to store your gold or silver
            </WebDsV2.Alert>
          ) : null}
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold leading-7 text-[color:var(--wds-foreground)]">Set auto-buy to on</h3>
              <WebDsV2.OptionRow
                trailing="switch"
                selected={draft.on}
                title="Auto-buy"
                description="This will buy the metal you choose when fiat money is deposited"
                onSelect={toggle}
              />
              <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
                Auto-buy is subject to rates at the time the funds are received.{" "}
                <button type="button" className="cursor-pointer text-[color:var(--wds-primary)] underline">
                  Learn more.
                </button>
              </p>
            </section>
            <section className="flex flex-col gap-2" role="radiogroup" aria-label="Precious metal">
              <h3 className="text-lg font-semibold leading-7 text-[color:var(--wds-foreground)]">Precious metal</h3>
              {METALS.map((m) => (
                <WebDsV2.OptionRow
                  key={m}
                  selected={draft.metal === m}
                  disabled={!draft.on}
                  logo={<Mark metal={m} />}
                  title={METAL_LABEL[m]}
                  onSelect={() => change({ metal: m })}
                />
              ))}
            </section>
            <section className="flex flex-col gap-2" role="radiogroup" aria-label="Vault">
              <h3 className="text-lg font-semibold leading-7 text-[color:var(--wds-foreground)]">Vault</h3>
              {VAULTS.map((v) => (
                <WebDsV2.OptionRow
                  key={v}
                  selected={draft.vault === v}
                  disabled={!draft.on}
                  title={VaultsV2.label(v)}
                  description={CUSTODIAN[v]}
                  onSelect={() => {
                    change({ vault: v });
                    setWarn(false);
                  }}
                />
              ))}
            </section>
          </div>
        </div>
      </SideDrawer.Body>
      <SideDrawer.Footer>
        <WebDsV2.Button
          size="xl"
          className="w-full"
          aria-disabled={canSave ? undefined : true}
          disabled={!canSave && !missingVault}
          onClick={press}
        >
          Save
        </WebDsV2.Button>
      </SideDrawer.Footer>
    </SideDrawer>
  );
}

/** Marker component satisfying the export-name contract; the statics are
 *  the API. */
function AutoBuyV2() {
  return null;
}
AutoBuyV2.useSettings = useSettings;
AutoBuyV2.Card = Card;
AutoBuyV2.Drawer = Drawer;
AutoBuyV2.METAL_LABEL = METAL_LABEL;
AutoBuyV2.CUSTODIAN = CUSTODIAN;

/* Exported untyped: the body is plain JSX (see the header). */
const __AutoBuyV2: any = AutoBuyV2;
export { __AutoBuyV2 as AutoBuyV2 };
