"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { isLocation } from "@/lib/screens";
import { selectSessionDataset } from "@brightlocal/proposal-shell";

/**
 * The location scope. The URL segment IS the dataset: it is pushed into
 * the proposal module's session dataset seam synchronously, during
 * render and before any child mounts, so every shell below reads the
 * location the URL names. Unknown locations 404.
 */
export default function LocationLayout({ children }: { children: React.ReactNode }) {
  const { location } = useParams<{ location: string }>();
  if (!isLocation(location)) notFound();
  selectSessionDataset(location);
  return <>{children}</>;
}
