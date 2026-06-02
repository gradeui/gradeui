/**
 * lib/motion — the global motion control for gradeui.
 *
 * One choke point for "should this animate?". Every animated component
 * (ThreeScene, RivePlayer, VideoPlayer, aura surfaces) asks
 * `useReducedMotion()`, so flipping motion off in one place stills them all.
 *
 * Two independent inputs, ORed together (reduce-only by design — the toggle
 * can ADD restriction but never override a user's OS preference to force
 * motion ON):
 *
 *   1. the OS `prefers-reduced-motion: reduce` media query, and
 *   2. a `data-motion="off"` attribute on the document root (`<html>`),
 *      the manual toggle.
 *
 * The attribute is the same mechanism the renderer's `data-fidelity` flag
 * uses: stamp it on `<html>` and CSS + components react. Inside Studio's
 * Fast Frame / embed / share iframes it is driven over postMessage
 * (`grade:set-motion`), so the toggle reaches into the sandbox where the
 * ThreeScene surfaces actually run. A matching `[data-motion="off"]` CSS
 * reset in `styles/globals.css` covers pure-CSS animation/transition.
 *
 * Sibling to lib/demo (the scripted-reveal spine).
 */

import * as React from "react";

/** The attribute stamped on `<html>` to force motion off. */
export const MOTION_ATTR = "data-motion";
const MOTION_OFF = "off";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/** Read the current effective reduced-motion state (OS query OR the global
 *  toggle). SSR-safe: returns `false` when there's no `window`. */
function readReduced(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  const osReduced = window.matchMedia(REDUCE_QUERY).matches;
  const toggledOff =
    document.documentElement.getAttribute(MOTION_ATTR) === MOTION_OFF;
  return osReduced || toggledOff;
}

/**
 * Returns `true` when motion should be suppressed — either the OS reports
 * `prefers-reduced-motion: reduce`, or the global `data-motion="off"` toggle
 * is set on `<html>`. Stays live: re-reads on media-query change and on the
 * attribute mutating.
 *
 * SSR-safe — defaults to `false` (motion allowed) on the server and
 * rehydrates in an effect, so it never causes a hydration mismatch.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const update = () => setReduced(readReduced());
    update();

    const mql = window.matchMedia(REDUCE_QUERY);
    mql.addEventListener("change", update);

    // Watch the toggle attribute on <html>.
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [MOTION_ATTR],
    });

    return () => {
      mql.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

/**
 * @deprecated Prefer {@link useReducedMotion}. Kept for back-compat with the
 * components that import it from `media-surface`; it now also folds in the
 * global `data-motion="off"` toggle, not just the OS query.
 */
export const usePrefersReducedMotion = useReducedMotion;

/**
 * Returns `true` when the page is actually being watched — the tab is visible
 * AND (for a top-level document) the window is focused. Inside an iframe the
 * focus check is skipped, because an iframe rarely "has focus" even when its
 * tab is frontmost; it falls back to visibility, which correctly tracks the
 * top tab. Use it to PAUSE autoplay loops when nobody's looking: a movie stops
 * when you tab away.
 *
 * SSR-safe — defaults to `true` and rehydrates in an effect.
 *
 * Scope, deliberately: this knows about tab visibility + window focus, NOT
 * whether the element is scrolled into view (pair it with an
 * IntersectionObserver — e.g. motion's `useInView` — for that), and NOT
 * whether a cross-document iframe has scrolled off its PARENT's viewport. An
 * iframe can't see the parent's scroll; the parent must observe the host and
 * pause it. See the grid poster/promote policy in STUDIO-CAPTURE.md.
 */
export function usePageActive(): boolean {
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    // window.top identity check is safe cross-origin (no property access).
    const framed = window.self !== window.top;
    const compute = () =>
      document.visibilityState !== "hidden" && (framed || document.hasFocus());
    const update = () => setActive(compute());
    update();

    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    window.addEventListener("pageshow", update);

    return () => {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      window.removeEventListener("pageshow", update);
    };
  }, []);

  return active;
}

/**
 * Imperatively set the global motion toggle on `<html>`.
 *
 *   setMotion(false) → stamps `data-motion="off"` (animation suppressed)
 *   setMotion(true)  → removes the attribute (default: respect the OS only)
 *
 * Reduce-only: turning motion "on" never forces animation for a viewer whose
 * OS asks for reduced motion — `useReducedMotion()` still honours the query.
 * No-op on the server.
 */
export function setMotion(enabled: boolean): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (enabled) root.removeAttribute(MOTION_ATTR);
  else root.setAttribute(MOTION_ATTR, MOTION_OFF);
}
