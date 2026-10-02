"use client";

// Promoted from Studio screen "Server error v2"
// (design dmur2qjt0mxyu, version 1790952264999). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: d82a78d9a30d
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Server error v2 (2 Oct 2026): the business portal's 500, Web DS
// ErrorPage as the Web Portal file's System states slides set it. In the
// staging app the same page is the error boundary (app/error.tsx, where
// Try again re-renders the failed page), and it can be opened directly at
// /500, where Try again reloads.
// Everything it shows lives in the shared ErrorPageV2.
import { ErrorPageV2 } from "@/components/error-page-v2";

export default function ServerErrorPage() {
  return <ErrorPageV2 code="500" />;
}
