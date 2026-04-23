import type { Metadata } from "next";

/**
 * Studio-local layout.
 *
 * The root `app/layout.tsx` already keeps the tree chrome-free (no
 * SiteHeader, no MarketingNav) — those were opted into per page. So
 * "removing top nav in Studio" didn't require a custom layout; just
 * dropping the explicit `<SiteHeader />` at the top of `page.tsx` did
 * the job.
 *
 * This file exists as a foothold for the direction we're heading:
 *   - Studio is becoming more product-shaped than docs-shaped — it will
 *     eventually get its own top chrome (project switcher, share button,
 *     sign-in) distinct from the rest of the site.
 *   - That chrome belongs in a layout so it persists across whatever
 *     routes we add under `/studio` (e.g. `/studio/[projectId]`,
 *     `/studio/settings`) without each page re-rendering it.
 *
 * For now it's a pass-through wrapper + a scoped `<title>` — enough to
 * override the docs-wide template and keep the tab reading "Studio"
 * instead of "Studio | Grade Design System". Add chrome here (sticky
 * toolbar, project switcher) when we're ready.
 */
export const metadata: Metadata = {
  title: "Studio",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
