"use client";

/**
 * Route layout for the logged-in product area: mounts the AppChrome
 * shell ONCE so the sidebar rail and toolbar persist across product
 * navigations. The route group keeps URLs clean (/dashboard, /activity,
 * /gold, ...) while sharing one chrome, mirroring the onboarding
 * wizard's layout pattern. The active nav item and the toolbar's
 * leading slot (subpage back affordance) derive from the pathname.
 */

import { usePathname } from "next/navigation";
import { Button } from "@gradeui/ui";
import { ArrowLeft } from "lucide-react";
import { AppChrome } from "@/components/layouts/app-chrome";

/* Pathname -> sidebar nav label. Grows a row per promoted product
   screen (keep in step with lib/screens.ts and AppChrome's NAV).
   Wallet pages map to no nav item on purpose. */
const ACTIVE_BY_PATH: Record<string, string> = {
  "/dashboard": "Home",
  "/activity": "Activity",
  "/gold": "Gold",
};

function BackToDashboard() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-full text-muted-foreground hover:text-foreground"
      data-grade-goto="Dashboard — logged-in home"
    >
      <ArrowLeft className="size-4" />
      Back
    </Button>
  );
}

/* Subpages get the Back affordance in the toolbar's leading slot. */
const LEADING_BY_PATH: Record<string, React.ReactNode> = {
  "/gold": <BackToDashboard />,
};

export default function ProductChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = ACTIVE_BY_PATH[pathname] ?? "Home";
  return (
    <AppChrome active={active} toolbarLeading={LEADING_BY_PATH[pathname] ?? null}>
      {children}
    </AppChrome>
  );
}
