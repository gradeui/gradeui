"use client";

/**
 * GotoBridge: the app-side implementation of Studio's screen-to-screen
 * navigation protocol. Promoted screens keep their
 * `data-grade-goto="screen:<id>"` (or "<screen name>") attributes
 * untouched; this bridge resolves the target through the screen
 * registry and drives the Next.js router instead of Fast Frame's
 * source swap.
 *
 * Capture-phase, like Fast Frame, so it wins over bubble handlers on the
 * same element. Unknown targets (an area with no promoted screen) route
 * to the matching skeleton page when the registry knows the area, and
 * otherwise fall through as inert.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { SCREENS, resolveGoto } from "@/lib/screens";

export function GotoBridge() {
  const router = useRouter();

  React.useEffect(() => {
    for (const s of SCREENS) router.prefetch(s.slug);
  }, [router]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.("[data-grade-goto]");
      if (!el) return;
      const value = el.getAttribute("data-grade-goto");
      if (!value) return;
      const slug = resolveGoto(value);
      if (!slug) return;
      e.preventDefault();
      e.stopPropagation();
      router.push(slug);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
