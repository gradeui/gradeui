"use client";

/**
 * "Give me my review insights as a PDF" (Ali, 12 Sep).
 *
 * The deck at /meta/deck already renders this location's insights as A4
 * landscape pages from the same libraries the screen uses. This button
 * opens it with ?print=1, which lays the pages out and calls the browser's
 * own print dialog: Chromium's print-to-PDF, no PDF library, no server.
 * In production the same route would be rendered by a headless browser and
 * emailed, which is exactly what apps/brightlocal/scripts/render-pdf.mjs
 * does today.
 */

import { Button } from "@brightlocal/ui-components/button";
import { FileText } from "@brightlocal/icons";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";

export function InsightsPdfButton({ variant = "outline", size = "sm" }: { variant?: "outline" | "primary"; size?: "sm" | "default" | "lg" }) {
  const persona = usePersona();
  const location = useLocationKey();
  const href = `/meta/deck?persona=${persona.id}&location=${location}&print=1`;
  return (
    <Button variant={variant} size={size} dataHook="insights-pdf" asChild>
      <a href={href} target="_blank" rel="noreferrer">
        <FileText className="size-4" />
        Get this as a PDF
      </a>
    </Button>
  );
}
