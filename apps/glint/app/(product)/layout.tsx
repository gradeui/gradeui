"use client";

/**
 * Route layout for the logged-in product area: mounts the AppChrome
 * shell ONCE so the sidebar rail and toolbar persist across product
 * navigations. The route group keeps URLs clean (/wallets, /activity,
 * /wallets/gold, ...) while sharing one chrome, mirroring the onboarding
 * wizard's layout pattern. The active nav item and the toolbar's
 * leading slot (subpage back affordance) derive from the pathname.
 */

import { usePathname } from "next/navigation";
import { Button } from "@gradeui/ui";
import { ChevronLeft } from "lucide-react";
import { AppChrome } from "@/components/layouts/app-chrome";

/* Pathname -> sidebar nav label. Grows a row per promoted product
   screen (keep in step with lib/screens.ts and AppChrome's NAV). */
const ACTIVE_BY_PATH: Record<string, string> = {
  "/wallets": "Wallets",
  "/activity": "Activity",
  /* A wallet detail keeps Wallets lit: it is a child of that section. */
  "/wallets/gold": "Wallets",
  "/wallets/silver": "Wallets",
  "/wallets/usd": "Wallets",
  "/bank-accounts": "Bank Accounts",
};

function BackToWallets() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-full text-muted-foreground hover:text-foreground"
      data-grade-goto="Dashboard — logged-in home"
    >
      {/* CHEVRON, not an arrow (Ali, 11 Aug: "back arrows on the wallet
          screens should also use chevrons"), matching the onboarding back
          button. THIS is the copy that renders in the app: promotion
          strips the wrapper's props, so each Studio screen's own
          toolbarLeading is what you see in Studio and this is what you see
          here. Both were changed. */}
      <ChevronLeft className="size-4" />
      Back
    </Button>
  );
}

/* Subpages get the Back affordance in the toolbar's leading slot. */
const LEADING_BY_PATH: Record<string, React.ReactNode> = {
  "/wallets/gold": <BackToWallets />,
  "/wallets/silver": <BackToWallets />,
  "/wallets/usd": <BackToWallets />,
};

export default function ProductChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = ACTIVE_BY_PATH[pathname] ?? "Wallets";
  return (
    <AppChrome active={active} toolbarLeading={LEADING_BY_PATH[pathname] ?? null}>
      {children}
    </AppChrome>
  );
}
