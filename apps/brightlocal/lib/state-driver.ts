/**
 * Replay a state's steps inside a same-origin iframe.
 *
 * This app serves both /meta/states and the screens it frames, so the browser
 * can reach into the frame and drive it. That is the whole reason tapping a
 * thumbnail can open the real page in that interaction rather than a picture
 * of it (Ali, 10 Sep: "its all within our control so no cross origin crap").
 *
 * The steps come from lib/states.ts and are the same ones Playwright runs to
 * make the thumbnail. Playwright can use its own clicks; here the events are
 * dispatched by hand, because Radix and vaul listen for a real pointer
 * sequence and swallow a bare .click() on a tab, a tooltip or a drawer
 * trigger. Pointer move comes first: a Radix menu item only commits on
 * pointerup if the pointer has entered it.
 */

import type { StateStep } from "@/lib/states";

function press(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const o = {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerType: "mouse",
    isPrimary: true,
    clientX: r.left + r.width / 2,
    clientY: r.top + r.height / 2,
    button: 0,
  };
  el.dispatchEvent(new PointerEvent("pointerover", o));
  el.dispatchEvent(new PointerEvent("pointermove", o));
  el.dispatchEvent(new PointerEvent("pointerdown", o));
  el.dispatchEvent(new MouseEvent("mousedown", o));
  el.dispatchEvent(new PointerEvent("pointerup", o));
  el.dispatchEvent(new MouseEvent("mouseup", o));
  el.dispatchEvent(new MouseEvent("click", o));
  return true;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Playwright's `:has-text(…)` is not a CSS selector, so the few steps that
 *  use it are resolved here by reading text content instead. */
function find(doc: Document, selector: string): Element | null {
  const hasText = /^(.*?):has-text\('(.+)'\)$/.exec(selector);
  if (!hasText) return doc.querySelector(selector);
  const [, base, text] = hasText;
  const wanted = text.toLowerCase();
  return (
    [...doc.querySelectorAll(base || "*")].find((e) =>
      (e.textContent ?? "").trim().toLowerCase().includes(wanted),
    ) ?? null
  );
}

async function waitFor(doc: Document, selector: string, timeout = 8000): Promise<Element | null> {
  const until = Date.now() + timeout;
  for (;;) {
    const el = find(doc, selector);
    if (el) return el;
    if (Date.now() > until) return null;
    await sleep(80);
  }
}

export interface ReplayResult {
  ok: boolean;
  /** The step that could not be performed, if any. */
  failedAt?: number;
  reason?: string;
}

/** Run a state's steps against a loaded, same-origin iframe. Resolves once
 *  the last step has settled, or as soon as one cannot be performed: a
 *  half-driven frame with an explanation beats a frame that silently is not
 *  the state it claims to be. */
export async function replay(frame: HTMLIFrameElement, steps: StateStep[] = []): Promise<ReplayResult> {
  const doc = frame.contentDocument;
  if (!doc) return { ok: false, reason: "the frame has not loaded" };

  // The trial recap opens on its own for a trial or a lapsed trial and
  // swallows every click behind it. A state that wants it on screen names it.
  //
  // PRESS ITS OWN BUTTON, twice if need be. A synthetic Escape does not close
  // it: Radix binds its own listener and a dispatched KeyboardEvent is not
  // trusted the way Playwright's real key press is. The recap can also open a
  // beat after load, so this runs again after a pause rather than once.
  const wantsRecap = steps.some((s) => `${s.click ?? ""}${s.waitFor ?? ""}`.includes("trial-recap"));
  if (!wantsRecap) {
    for (const delay of [0, 700]) {
      if (delay) await sleep(delay);
      const recap = doc.querySelector("[data-hook=trial-recap]");
      if (!recap) continue;
      const later = doc.querySelector("[data-hook=trial-recap-later]");
      const close = recap.querySelector('[data-slot="dialog-close"], button[aria-label="Close"]');
      if (later) press(later);
      else if (close) press(close);
      await sleep(400);
    }
  }

  for (const [i, step] of steps.entries()) {
    if (step.click) {
      const el = await waitFor(doc, step.click);
      if (!el) return { ok: false, failedAt: i, reason: `nothing matched ${step.click}` };
      press(el);
    }
    if (step.key) {
      doc.dispatchEvent(new KeyboardEvent("keydown", { key: step.key, bubbles: true }));
    }
    if (step.scrollTo) {
      const el = await waitFor(doc, step.scrollTo);
      if (!el) return { ok: false, failedAt: i, reason: `nothing matched ${step.scrollTo}` };
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    if (step.waitFor) {
      const el = await waitFor(doc, step.waitFor);
      if (!el) return { ok: false, failedAt: i, reason: `${step.waitFor} never appeared` };
    }
    await sleep(step.wait ?? 500);
  }
  return { ok: true };
}

/** Seed the demo settings the frame will read on load. Same-origin, so the
 *  parent can write the key the app boots from before it boots, which is the
 *  only way to have the frame render on a persona or a tone from its very
 *  first paint rather than flipping to it a beat later. */
export function seedLook(look: {
  personaId: string;
  tone?: string;
  /** true, false, or undefined to leave the app's own setting alone. */
  insights?: boolean;
}) {
  try {
    const raw = localStorage.getItem("grade-bl-demo-v2");
    const current = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      "grade-bl-demo-v2",
      JSON.stringify({
        ...current,
        personaId: look.personaId,
        look: "authored",
        engine: "native-fixed",
        beaconTone: look.tone ?? "neutral",
        ...(look.insights === undefined ? {} : { insights: look.insights }),
      }),
    );
  } catch {
    // A private window with storage blocked still gets the screen, just on
    // whatever the app defaults to.
  }
}
