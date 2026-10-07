"use client";

/**
 * Route layout for the logged-in product area: mounts the AppChromeV2
 * shell ONCE so the sidebar and header persist across product
 * navigations. The route group keeps URLs clean (/wallets, /activity,
 * /wallets/gold, ...) while sharing one chrome.
 *
 * Promotion strips each Studio screen's <AppChromeV2 active crumbs>
 * wrapper, so its two props are rebuilt here from the pathname: the lit
 * nav item and the header's breadcrumb (7 Oct 2026, the Web DS Header,
 * which replaced the old toolbar's Back button with "Wallets > Gold").
 * Keep these in step with each screen's own props in Studio.
 */

import { usePathname } from "next/navigation";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";

const WALLETS = { label: "Wallets", target: "Dashboard — logged-in home v2" };

type Crumb = { label: string; target?: string };

/* Pathname -> sidebar nav label and breadcrumb. A wallet page keeps
   Wallets lit: it is a child of that section. */
const CHROME_BY_PATH: Record<string, { active: string; crumbs: Crumb[] }> = {
  "/wallets": { active: "Wallets", crumbs: [{ label: "Wallets" }] },
  "/wallets/gold": { active: "Wallets", crumbs: [WALLETS, { label: "Gold" }] },
  "/wallets/silver": { active: "Wallets", crumbs: [WALLETS, { label: "Silver" }] },
  "/wallets/usd": { active: "Wallets", crumbs: [WALLETS, { label: "USD" }] },
  "/activity": { active: "Activity", crumbs: [{ label: "Activity" }] },
  "/bank-accounts": { active: "Bank accounts", crumbs: [{ label: "Bank accounts" }] },
  "/settings": { active: "Settings", crumbs: [{ label: "Settings" }] },
};

export default function ProductChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chrome = CHROME_BY_PATH[pathname] ?? CHROME_BY_PATH["/wallets"];
  return (
    <AppChromeV2 active={chrome.active} crumbs={chrome.crumbs}>
      {children}
    </AppChromeV2>
  );
}
