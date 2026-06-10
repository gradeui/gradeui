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

/**
 * Pre-hydration panel-state restore (same pattern as
 * GRADE_PRE_HYDRATION_SCRIPT in the root layout). The page persists the
 * left/right panel visibility to localStorage but used to restore it in
 * a post-mount effect — so every refresh painted default-open chrome,
 * then snapped to the saved state once React hydrated (late, on a page
 * this heavy). This inline script runs as soon as the HTML parses: it
 * stamps `data-studio-left-closed` / `data-studio-right-closed` on
 * <html>, and a matching rule in globals.css collapses the panes before
 * first paint. The page's hydration effect then adopts the same values
 * into React state and REMOVES the attributes, handing control back to
 * the normal inline styles so user toggles never fight the CSS.
 */
const PANEL_PRE_HYDRATION = `(function(){try{
  var d=document.documentElement;
  if(localStorage.getItem("studio:left-panel-open")==="false")d.setAttribute("data-studio-left-closed","");
  if(localStorage.getItem("studio:right-panel-open")==="false")d.setAttribute("data-studio-right-closed","");
}catch(e){}})();`;

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PANEL_PRE_HYDRATION }} />
      {children}
    </>
  );
}
