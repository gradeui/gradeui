"use client";

// Promoted from Studio screen "Page not found v2"
// (design dmur2qhnjqpm4, version 1790952262158). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: d64524346adb
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Page not found v2 (2 Oct 2026): the business portal's 404, Web DS
// ErrorPage as the Web Portal file's System states slides set it. In the
// staging app this is the page every unknown address shows (the app's
// not-found), and it can also be opened directly at /404.
// Everything it shows lives in the shared ErrorPageV2.
import { ErrorPageV2 } from "@/components/error-page-v2";

export default function PageNotFoundPage() {
  return <ErrorPageV2 code="404" />;
}
