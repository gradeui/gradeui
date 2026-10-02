"use client";

/**
 * StagingSwitches (2 Oct 2026): the comparison switches for the Glint
 * business portal on staging, read from the page address so Ali can flip
 * them on his phone. One module, so every screen and component that reads
 * a switch agrees about it.
 *
 * TWIN: the Studio shared component "StagingSwitches" (cmuqwdewhmagov).
 * Editing one does not touch the other. Keep the pair in sync.
 *
 *   ?cards=subtle | metal   The Gold and Silver wallet cards' look
 *                           (MetalWalletCardV2). SUBTLE IS THE DEFAULT
 *                           (Ali, 2 Oct: "I think the subtle metals work
 *                           for Web"); metal stays one parameter away for
 *                           comparison.
 *   ?autobuy=on | off       Everything auto-buy: the control by the
 *                           Balance, the chip on the metal cards, the USD
 *                           card's "Auto-buy to ..." line, the control on
 *                           the USD page, the row on Bank accounts, and the
 *                           "Direct Gold" method name on Activity. OFF BY
 *                           DEFAULT (Ali, 2 Oct: "I need staging not to
 *                           have auto-buy, but we do need a layout where
 *                           auto-buy exists in the future"). The layout is
 *                           kept, not deleted, and comes back with on.
 *
 * A choice is kept for the tab (sessionStorage), so it survives the links
 * between pages, which drop the query. A new tab starts on the defaults.
 * ASSUMPTION: per tab is the right lifetime for a comparison switch. If
 * Ali wants a choice to stick on his phone between visits, make it
 * localStorage.
 *
 *   const cards = StagingSwitches.useCards();      // "subtle" | "metal"
 *   const autoBuy = StagingSwitches.useAutoBuy();  // false | true
 */

import * as React from "react";

export type CardsSwitch = "subtle" | "metal";
type AutoBuySwitch = "off" | "on";

/** Each switch: its parameter's storage key, the values it takes, and its
 *  default. "glint-cards" is the key the card's own switch used before
 *  this module, so a tab already holding a choice keeps it. */
const SWITCHES = {
  cards: {
    key: "glint-cards",
    values: ["subtle", "metal"] as readonly CardsSwitch[],
    fallback: "subtle" as CardsSwitch,
  },
  autobuy: {
    key: "glint-autobuy",
    values: ["off", "on"] as readonly AutoBuySwitch[],
    fallback: "off" as AutoBuySwitch,
  },
};
type SwitchName = keyof typeof SWITCHES;

/** ?name= on this page, or on the page hosting this frame. */
function fromAddress(name: SwitchName): string | null {
  const read = (w: Window) => new URLSearchParams(w.location.search).get(name);
  let v: string | null = null;
  try {
    v = read(window);
    if (!v && window.top && window.top !== window) v = read(window.top);
  } catch {
    /* a cross-origin host: this page's own address is all there is */
  }
  return v && (SWITCHES[name].values as readonly string[]).includes(v) ? v : null;
}

function readSwitch(name: SwitchName): string {
  const s = SWITCHES[name];
  if (typeof window === "undefined") return s.fallback;
  const v = fromAddress(name);
  if (v) return v;
  try {
    const kept = window.sessionStorage.getItem(s.key);
    if (kept && (s.values as readonly string[]).includes(kept)) return kept;
  } catch {
    /* storage unavailable: the address alone decides */
  }
  return s.fallback;
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/** One switch's value. The server renders the default and the client
 *  corrects on hydration, as FlowStore does. */
function useSwitch(name: SwitchName): string {
  const value = React.useSyncExternalStore(
    subscribe,
    () => readSwitch(name),
    () => SWITCHES[name].fallback,
  );
  React.useEffect(() => {
    const v = fromAddress(name);
    if (!v) return;
    try {
      window.sessionStorage.setItem(SWITCHES[name].key, v);
    } catch {
      /* storage unavailable: the switch lasts for this page only */
    }
  }, [name]);
  return value;
}

/** "subtle" (the default) or "metal". */
function useCards(): CardsSwitch {
  return useSwitch("cards") as CardsSwitch;
}

/** false by default; true with ?autobuy=on. */
function useAutoBuy(): boolean {
  return useSwitch("autobuy") === "on";
}

/** The same namespace the Studio module exposes, so a promoted screen's
 *  StagingSwitches.useAutoBuy() resolves unchanged. */
export const StagingSwitches = { useCards, useAutoBuy };
