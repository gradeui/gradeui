/**
 * Standalone (home-screen) detection + real safe-area insets.
 *
 * WHY THIS EXISTS
 * A prototype added to an iPhone home screen launches with no browser
 * chrome — and, with `apple-mobile-web-app-status-bar-style` set to
 * `black-translucent` plus `viewport-fit=cover`, the web view runs the
 * full height of the display with the DEVICE'S OWN status bar drawn
 * over the top of it. Two things follow:
 *
 *   1. The prototype must know it is standalone, so it can stop drawing
 *      its own simulated status bar (otherwise you see two).
 *   2. It needs the REAL insets, because the notch/dynamic-island band
 *      differs per handset and the simulated constants a screen ships
 *      with ("iPhone 15 Pro is 59px") are only right on one phone.
 *
 * THE IFRAME PROBLEM (the reason this is a host-side module)
 * Every prototype renders inside the /fast-sandbox iframe. `env(safe-
 * area-inset-*)` evaluated INSIDE that iframe resolves against the
 * IFRAME's box, not the display — so it is zero, always, even in
 * standalone. Only the top-level document can see the true insets.
 * The host therefore measures here and posts the values into the frame
 * (`grade:set-safe-area`), where they land as `--gds-safe-area-*` on
 * the frame's root for the prototype to read.
 *
 * MEASUREMENT
 * `env()` is not readable from JS directly, so we do the standard
 * trick: park an off-screen probe whose padding is set to the four
 * env() values and read them back through getComputedStyle.
 */

"use client";

import { useSyncExternalStore } from "react";

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const ZERO_INSETS: SafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

/** True when the document is running as an installed/home-screen app.
 *  `navigator.standalone` is the iOS-only legacy flag and still the
 *  most reliable signal on older iOS; the media query covers the rest
 *  (and Android/desktop installs).
 *
 *  TOP-LEVEL ONLY, and this is load-bearing rather than tidiness:
 *  `display-mode` PROPAGATES to nested browsing contexts but `env()`
 *  does NOT. An /e/ embed iframed inside another page (the marketing
 *  live-embed, the MCP preview panel) that happens to be open in an
 *  installed app would match the media query while the probe below
 *  correctly measures zero — so we would tell the prototype "you are
 *  on a device, stand your status bar down" and then put nothing in
 *  its place. Only the document that actually owns the display gets
 *  to answer yes. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  // Identity comparison only — safe cross-origin, unlike reading any
  // property off window.top.
  if (window.top !== window.self) return false;
  const legacy = (window.navigator as Navigator & { standalone?: boolean })
    .standalone;
  if (legacy === true) return true;
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches
    );
  } catch {
    return false;
  }
}

/** Read the four env(safe-area-inset-*) values off the TOP-LEVEL
 *  document. Returns zeros anywhere they aren't supported or aren't
 *  set — which is the correct answer in a normal browser tab. */
export function measureSafeAreaInsets(): SafeAreaInsets {
  if (typeof document === "undefined") return ZERO_INSETS;
  const probe = document.createElement("div");
  // Fixed + zero-size + hidden: the probe must not contribute layout
  // or scroll extent while it is parked in the document.
  probe.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:0",
    "height:0",
    "visibility:hidden",
    "pointer-events:none",
    "padding-top:env(safe-area-inset-top, 0px)",
    "padding-right:env(safe-area-inset-right, 0px)",
    "padding-bottom:env(safe-area-inset-bottom, 0px)",
    "padding-left:env(safe-area-inset-left, 0px)",
  ].join(";");
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const px = (v: string): number => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };
  const insets: SafeAreaInsets = {
    top: px(cs.paddingTop),
    right: px(cs.paddingRight),
    bottom: px(cs.paddingBottom),
    left: px(cs.paddingLeft),
  };
  probe.remove();
  return insets;
}

export interface StandaloneState {
  /** Whether this document is running installed to a home screen. */
  standalone: boolean;
  /** Real display insets. Zeros in a normal tab. */
  insets: SafeAreaInsets;
}

/* ── The store ─────────────────────────────────────────────────────
   ONE measurement for the whole document, not one per consumer.
   `FastIframeHost` mounts many times over (the focused mount, every
   canvas tile, each compare pane, the registry browser, layout
   preview), and a per-instance hook would mean each of those
   installing its own resize + orientationchange + matchMedia
   listeners and appending its own probe div to document.body on every
   measure. The display is a property of the document, so it is read
   once and shared.

   Same architecture as lib/project-preview-css.ts and for the same
   reason: state on `globalThis` so dev-mode HMR cannot reset it,
   subscribable so every frame host re-posts when the device rotates.
   The listeners are installed on the FIRST subscriber and torn down
   with the last. */

interface InsetStore {
  state: StandaloneState;
  listeners: Set<() => void>;
  teardown: (() => void) | null;
  frame: number;
}

const g = globalThis as typeof globalThis & {
  __gradeStandaloneInsets?: InsetStore;
};
const store: InsetStore = (g.__gradeStandaloneInsets ??= {
  // Starts "not standalone, zero insets" so the server render and the
  // first client paint agree, then measures on the first subscribe.
  state: { standalone: false, insets: ZERO_INSETS },
  listeners: new Set(),
  teardown: null,
  frame: 0,
});

function sync(): void {
  cancelAnimationFrame(store.frame);
  // One frame's grace: read synchronously from an orientationchange
  // and iOS hands you the PREVIOUS orientation's insets.
  store.frame = requestAnimationFrame(() => {
    const standalone = isStandaloneDisplay();
    const insets = measureSafeAreaInsets();
    const prev = store.state;
    if (
      prev.standalone === standalone &&
      prev.insets.top === insets.top &&
      prev.insets.right === insets.right &&
      prev.insets.bottom === insets.bottom &&
      prev.insets.left === insets.left
    ) {
      return;
    }
    store.state = { standalone, insets };
    for (const l of store.listeners) l();
  });
}

function subscribe(listener: () => void): () => void {
  const first = store.listeners.size === 0;
  store.listeners.add(listener);
  if (first) {
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(display-mode: standalone)");
      mq.addEventListener("change", sync);
    } catch {
      mq = null;
    }
    store.teardown = () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      mq?.removeEventListener("change", sync);
    };
    sync();
  }
  return () => {
    store.listeners.delete(listener);
    if (store.listeners.size === 0) {
      cancelAnimationFrame(store.frame);
      store.teardown?.();
      store.teardown = null;
    }
  };
}

const SERVER_STATE: StandaloneState = {
  standalone: false,
  insets: ZERO_INSETS,
};

/**
 * Live standalone + inset state for the top-level document, shared by
 * every consumer. Re-measures on rotation and resize, because the top
 * inset moves to the side in landscape.
 */
export function useStandaloneInsets(): StandaloneState {
  return useSyncExternalStore(
    subscribe,
    () => store.state,
    () => SERVER_STATE,
  );
}
