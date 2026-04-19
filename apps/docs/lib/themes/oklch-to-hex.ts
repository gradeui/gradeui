"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Convert an OKLCH triplet (e.g. "0.610 0.128 20") to its sRGB hex equivalent.
 *
 * Implemented by asking the browser to compute the color — we set the
 * oklch() value on a throwaway element, read the resolved rgb() string,
 * and format to hex. This sidesteps having to reimplement the OKLCH → Lab
 * → XYZ → sRGB conversion chain by hand, and picks up the browser's own
 * gamut-mapping behaviour for free.
 *
 * Returns "" during SSR (no document), so callers should gate on truthy.
 */
export function oklchToHex(triplet: string): string {
  if (typeof document === "undefined") return "";
  const probe = document.createElement("span");
  probe.style.color = `oklch(${triplet})`;
  // Must be in the DOM for getComputedStyle to resolve. Keep it invisible.
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color; // "rgb(r, g, b)" or "rgba(...)"
  document.body.removeChild(probe);
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return "";
  const [r, g, b] = match.slice(0, 3).map(Number);
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

/**
 * React hook: convert a list of OKLCH triplets to hex values on the client.
 * Returns an empty array during SSR and the resolved hexes after mount.
 */
export function useOklchHexes(triplets: readonly string[]): string[] {
  const key = useMemo(() => triplets.join("|"), [triplets]);
  const [hexes, setHexes] = useState<string[]>([]);
  useEffect(() => {
    setHexes(triplets.map(oklchToHex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return hexes;
}

/**
 * Format an OKLCH triplet compactly for display. Strips excess decimals
 * from the ugly 0.00225 40 looks and trims to something like 0.99 0.002 40.
 */
export function formatOklch(triplet: string): string {
  const parts = triplet.trim().split(/\s+/);
  if (parts.length < 3) return triplet;
  const [lRaw, cRaw, hRaw] = parts;
  const l = Number(lRaw);
  const c = Number(cRaw);
  const h = Number(hRaw);
  if (Number.isNaN(l) || Number.isNaN(c) || Number.isNaN(h)) return triplet;
  // L: 2 decimals, C: 3 (or 2 if very small), H: nearest integer.
  const lStr = l.toFixed(2);
  const cStr = c < 0.01 ? c.toFixed(3) : c.toFixed(2);
  const hStr = String(Math.round(h));
  return `${lStr} ${cStr} ${hStr}°`;
}
