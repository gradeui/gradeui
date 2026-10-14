// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// StagingSwitches (2 Oct 2026): the comparison switches for the Glint
// business portal on staging, read from the page address so Ali can flip
// them on his phone. One module, so every screen and component that reads
// a switch agrees about it.
//
// TWIN: the Studio shared component "StagingSwitches" (cmuqwdewhmagov). Editing one does
// not touch the other. Keep the pair in sync.
//
//   ?cards=subtle | metal   The Gold and Silver wallet cards' look
//                           (MetalWalletCardV2). SUBTLE IS THE DEFAULT
//                           (Ali, 2 Oct: "I think the subtle metals work
//                           for Web"); metal stays one parameter away for
//                           comparison.
//   ?state=live | empty | error | inline | offline   (14 Oct) The System states
//                           slides of "Glint - Web Portal - Full New",
//                           which nothing in the demo would otherwise
//                           reach: EMPTY is a business with nothing yet
//                           (no activity, no metal: the Gold and Silver
//                           No holdings slides and Empty · Activity);
//                           ERROR is the in-shell error page (Error ·
//                           Page); INLINE is Wallets failing to load its
//                           cards (Error · Inline); OFFLINE is the
//                           Couldn't connect toast (Toast · Error). LIVE
//                           (the default) is the demo; Try again and
//                           Retry now go back to it.
//   ?trend=live | down | neutral   (14 Oct) The price card's Charts ·
//                           Down and Neutral slides. The real LBMA prices
//                           rise over every range Figma offers, so those
//                           two states never show by themselves; DOWN
//                           mirrors the drawn series about its first price
//                           and NEUTRAL scales its moves to a 0.5% change.
//                           NOT REAL PRICES: a comparison switch only.
//   ?name=default | long    (14 Oct) The account menu's Long name slide:
//                           "Alexandra Fitzwilliam-Montgomery" signed in.
//   ?announce=on | off      (14 Oct) The announcement bar over the
//                           Wallets page (Announcement bar · Default).
//                           Off by default; dismissing it hides it for
//                           the tab.
//   ?autobuy=on | off       Everything auto-buy: the control by the
//                           Balance, the chip on the metal cards, the USD
//                           card's "Auto-buy to ..." line, the control on
//                           the USD page, the row on Bank accounts, and the
//                           "Direct Gold" method name on Activity. ON BY
//                           DEFAULT since 7 Oct (Ali listed auto-buy among
//                           what staging needs, reversing his 2 Oct "I
//                           need staging not to have auto-buy"); off hides
//                           it all again.
//
// A choice is kept for the tab (sessionStorage), so it survives the links
// between pages, which drop the query. A new tab starts on the defaults.
// ASSUMPTION: per tab is the right lifetime for a comparison switch. If
// Ali wants a choice to stick on his phone between visits, make it
// localStorage.
// Studio reads the same parameters from the page hosting its frame (a
// share link) when that page is readable.
//
//   const cards = StagingSwitches.useCards();      // "subtle" | "metal"
//   const autoBuy = StagingSwitches.useAutoBuy();  // false | true
import * as React from "react";

/** Each switch: its parameter's storage key, the values it takes, and its
 *  default. "glint-cards" is the key the card's own switch used before
 *  this module, so a tab already holding a choice keeps it. */
const SWITCHES = {
  cards: { key: "glint-cards", values: ["subtle", "metal"], fallback: "subtle" },
  /* ASSUMPTION (7 Oct): auto-buy shows by default on staging now. To put
     it back behind ?autobuy=on, change this fallback to "off". */
  autobuy: { key: "glint-autobuy", values: ["off", "on"], fallback: "on" },
  state: { key: "glint-state", values: ["live", "empty", "error", "inline", "offline"], fallback: "live" },
  announce: { key: "glint-announce", values: ["off", "on"], fallback: "off" },
  trend: { key: "glint-trend", values: ["live", "down", "neutral"], fallback: "live" },
  name: { key: "glint-name", values: ["default", "long"], fallback: "default" },
};

/** ?name= on this page, or on the page hosting this frame. */
function fromAddress(name) {
  const read = (w) => new URLSearchParams(w.location.search).get(name);
  let v = null;
  try {
    v = read(window);
    if (!v && window.top && window.top !== window) v = read(window.top);
  } catch {
    /* a cross-origin host: this page's own address is all there is */
  }
  return SWITCHES[name].values.includes(v) ? v : null;
}

function readSwitch(name) {
  const s = SWITCHES[name];
  if (typeof window === "undefined") return s.fallback;
  const v = fromAddress(name);
  if (v) return v;
  try {
    const kept = window.sessionStorage.getItem(s.key);
    if (kept && s.values.includes(kept)) return kept;
  } catch {
    /* storage unavailable: the address alone decides */
  }
  return s.fallback;
}

function subscribe(onChange) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/** One switch's value. The server renders the default and the client
 *  corrects on hydration, as FlowStore does. */
function useSwitch(name) {
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

/** A namespace, like Persona: it renders nothing. */
function StagingSwitches() {
  return null;
}

/** "subtle" (the default) or "metal". */
StagingSwitches.useCards = function useCards() {
  return useSwitch("cards");
};

/** "live" (the default), "empty", "error", "inline" or "offline". */
StagingSwitches.useState = function useStateSwitch() {
  return useSwitch("state");
};

/** "live" (the default), "down" or "neutral". */
StagingSwitches.useTrend = function useTrend() {
  return useSwitch("trend");
};

/** "default" or "long". */
StagingSwitches.useName = function useName() {
  return useSwitch("name");
};

/** false by default; true with ?announce=on. */
StagingSwitches.useAnnounce = function useAnnounce() {
  return useSwitch("announce") === "on";
};

/** true by default; false with ?autobuy=off. */
StagingSwitches.useAutoBuy = function useAutoBuy() {
  return useSwitch("autobuy") === "on";
};


/* Exported untyped: the body is plain JSX (see the header). */
const __StagingSwitches: any = StagingSwitches;
export { __StagingSwitches as StagingSwitches };
