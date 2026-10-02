"use client";

/**
 * The staging app's error boundary (2 Oct 2026): a page that throws shows
 * the business portal's 500, the same ErrorPageV2 as the promoted Studio
 * screen "Server error v2" (app/500/page.tsx, its own route at /500).
 * Here Try again is the boundary's reset, so it re-renders the page that
 * failed instead of reloading.
 *
 * It wraps everything under the root layout, the product area included, so
 * the 500 stands alone outside the chrome as the Web DS draws it. An error
 * in the root layout itself would need app/global-error.tsx, which this app
 * does not have.
 */
import * as React from "react";
import { ErrorPageV2 } from "@/components/error-page-v2";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorPageV2 code="500" onRetry={reset} />;
}
