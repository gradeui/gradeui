"use client";

/**
 * OptionSwitch: one route, several layout options (A, B, C). The base
 * route renders whichever option the demo settings pick for it, so a
 * flow keeps its URLs whatever option a participant is on. Options stay
 * reachable at their own routes too, for direct links and comparison.
 * `?variant=<slug>` on the base URL pins one for the session.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useDemo } from "@/lib/demo";

export function OptionSwitch({
  base,
  options,
}: {
  base: string;
  options: Record<string, React.ComponentType>;
}) {
  const { settings, setVariant } = useDemo();
  const params = useSearchParams();
  const fromUrl = params.get("variant");
  React.useEffect(() => {
    if (fromUrl && options[fromUrl] && settings.variants[base] !== fromUrl) setVariant(base, fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);
  const chosen = settings.variants[base];
  const Comp = (chosen && options[chosen]) || options[base];
  return <Comp />;
}
