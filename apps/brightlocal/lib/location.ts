"use client";

import { useParams } from "next/navigation";
import { DEFAULT_LOCATION, isLocation } from "@/lib/screens";

/** The location the URL names, or the default outside the location scope. */
export function useLocationKey(): string {
  const params = useParams<{ location?: string }>();
  return isLocation(params?.location) ? params.location : DEFAULT_LOCATION;
}
