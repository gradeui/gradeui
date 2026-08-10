"use client";

/**
 * Route layout for the logged-in product area: mounts the AppChrome
 * shell ONCE so the sidebar rail and toolbar persist across product
 * navigations. The route group keeps URLs clean (/dashboard, and later
 * /transactions, /account, ...) while sharing one chrome, mirroring
 * the onboarding wizard's layout pattern. The active nav item derives
 * from the pathname.
 */

import { usePathname } from "next/navigation";
import { AppChrome } from "@/components/layouts/app-chrome";

/* Pathname -> sidebar nav label. Grows a row per promoted product
   screen (keep in step with lib/screens.ts and AppChrome's NAV). */
const ACTIVE_BY_PATH: Record<string, string> = {
  "/dashboard": "Home",
  "/activity": "Activity",
};

export default function ProductChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = ACTIVE_BY_PATH[pathname] ?? "Home";
  return <AppChrome active={active}>{children}</AppChrome>;
}
