/**
 * The staging app's not-found (2 Oct 2026): every unknown address shows the
 * business portal's 404, the promoted Studio screen "Page not found v2"
 * (app/404/page.tsx, which is also its own route at /404). Rendered by
 * Next.js inside the root layout, outside the product chrome, with a 404
 * status.
 */
import PageNotFoundPage from "./404/page";

export default function NotFound() {
  return <PageNotFoundPage />;
}
