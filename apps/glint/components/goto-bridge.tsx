"use client";

/**
 * GotoBridge: the app-side implementation of Studio's screen-to-screen
 * navigation protocol. Promoted screens keep their
 * `data-grade-goto="<screen name>"` attributes untouched; this bridge
 * resolves the name through the screen registry and drives the Next.js
 * router instead of Fast Frame's source swap.
 *
 * Mirrors Fast Frame's semantics: a CAPTURE-phase click listener that
 * wins over bubble-phase handlers on the same element (which is why the
 * landing's Start button resets state in onPointerDown, not onClick).
 * Unknown targets fall through untouched so stray gotos degrade to
 * inert elements rather than broken navigation.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { SCREENS, screenByName } from "@/lib/screens";

export function GotoBridge() {
  const router = useRouter();

  /* Eleven tiny routes: prefetch them all so demo hops are instant. */
  React.useEffect(() => {
    for (const s of SCREENS) router.prefetch(s.slug);
  }, [router]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.("[data-grade-goto]");
      if (!el) return;
      const name = el.getAttribute("data-grade-goto");
      if (!name) return;
      const screen = screenByName(name);
      if (!screen) return;
      e.preventDefault();
      e.stopPropagation();
      router.push(screen.slug);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
