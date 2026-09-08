"use client";

/**
 * GotoBridge: the app-side implementation of Studio's screen-to-screen
 * navigation protocol. Promoted screens keep their
 * `data-grade-goto="screen:<id>"` attributes; this bridge resolves the
 * id through the registry and drives the Next router.
 *
 * The LOCATION in the resulting URL comes, in order, from:
 *   1. the clicked element's data-grade-dataset (a location card)
 *   2. the current URL's /locations/<location> segment
 *   3. the session dataset the proposal module stashed
 *   4. the persona's dataset
 * Capture-phase, like Fast Frame. Unknown targets fall through inert.
 */

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { allHrefs, isLocation, locationFromPath, resolveGoto } from "@/lib/screens";
import { loadSessionDataset } from "@brightlocal/proposal-shell";
import { useDemo } from "@/lib/demo";

export function GotoBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const { persona } = useDemo();

  const currentLocation = React.useCallback(
    (el?: Element | null) => {
      const stamped = el?.closest?.("[data-grade-dataset]")?.getAttribute("data-grade-dataset");
      if (isLocation(stamped)) return stamped;
      const fromPath = locationFromPath(pathname);
      if (fromPath) return fromPath;
      const session = loadSessionDataset();
      if (isLocation(session)) return session;
      return persona.dataset;
    },
    [pathname, persona.dataset],
  );

  React.useEffect(() => {
    for (const href of allHrefs(currentLocation())) router.prefetch(href);
  }, [router, currentLocation]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.("[data-grade-goto]");
      if (!el) return;
      const value = el.getAttribute("data-grade-goto");
      if (!value) return;
      const href = resolveGoto(value, currentLocation(el));
      if (!href) return;
      e.preventDefault();
      e.stopPropagation();
      router.push(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, currentLocation]);

  return null;
}
