"use client";

// ErrorPageV2 (2 Oct 2026): the standalone error page for the Glint
// business portal v2 on staging. Web DS "ErrorPage" (500 and 404) as the
// Web Portal file's System states slides set it: outside the shell, deep
// blue, the ring lattice at Subtle, the gold wordmark, the code as a large
// gold figure, a title, one line of body, two actions and two text links.
//
// TWIN: the Studio shared component "ErrorPageV2" (cmur2oxxwtlber).
// Editing one does not touch the other. Keep the pair in sync.
//
//   <ErrorPageV2 code="404" />
//   <ErrorPageV2 code="500" onRetry={reset} />
//
// ALWAYS DARK: the Web DS draws ErrorPage on the deep ground only, so the
// page sets the dark tokens on itself and stays dark in a light session.
// ASSUMPTION: there is no light ErrorPage in the Web DS; if one lands,
// drop the "dark" class here.
//
// COPY is the Web Portal file's, verbatim (System states, 1 Oct). The 404
// says "System status" and the 500 says "Glint status": the file has both,
// kept as drawn. Contact support and the status link are inert.
//
// ACTIONS: "Go to Wallets" is a goto to the v2 Wallets screen. "Go back"
// steps back in the browser history. "Try again" calls onRetry when the
// app's error boundary passes its reset, and reloads the page otherwise.
// Mobile stacks the two actions full width, as the Web DS mobile frames do.
//
// No useWebDsType here: the app sets the Web DS type tokens in
// app/globals.css. The Studio copy sets them while it is mounted.

import * as React from "react";
import { Button } from "@gradeui/ui";
import { Wordmark, METALS } from "@/components/wordmark";
import { RingLattice } from "@/components/ring-lattice";

/* A Studio SCREEN NAME resolved by the goto protocol (and by the app's
   screen registry), so its dash is part of the name, not copy. */
const WALLETS = "Dashboard — logged-in home v2";

type ErrorCode = "404" | "500";

const COPY: Record<ErrorCode, { title: string; body: string; status: string }> = {
  404: {
    title: "Page not found",
    body: "The page you’re looking for doesn’t exist or has moved.",
    status: "System status",
  },
  500: {
    title: "Oops. Glint isn’t loading.",
    body: "This is a problem on our side, and we’re on it. It doesn’t change anything in your wallets.",
    status: "Glint status",
  },
};

const G = METALS.gold;

/** The figure's face: the champagne cut of the polished gold, lit from the
 *  top left like every other metal surface. */
const FIGURE: React.CSSProperties = {
  fontFamily: "var(--font-raleway, Raleway), var(--font-display), sans-serif",
  fontWeight: 700,
  fontVariantNumeric: "lining-nums tabular-nums",
  fontSize: "min(160px, 30vw)",
  lineHeight: 1,
  letterSpacing: "-0.01em",
  backgroundImage: `linear-gradient(135deg, oklch(${G[100]}) 0%, oklch(${G[200]}) 35%, oklch(${G[300]}) 65%, oklch(${G[400]}) 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export function ErrorPageV2({
  code = "404",
  onRetry,
}: {
  code?: ErrorCode;
  /** The error boundary's reset. Without it, Try again reloads. */
  onRetry?: () => void;
}) {
  const copy = COPY[code] ?? COPY[404];
  const retry = () => (onRetry ? onRetry() : window.location.reload());
  const back = () => window.history.back();

  const primary =
    code === "500" ? (
      <Button size="lg" className="w-full sm:w-auto" onClick={retry}>
        Try again
      </Button>
    ) : (
      <Button size="lg" className="w-full sm:w-auto" data-grade-goto={WALLETS}>
        Go to Wallets
      </Button>
    );
  const secondary =
    code === "500" ? (
      <Button size="lg" variant="outline" className="w-full sm:w-auto" data-grade-goto={WALLETS}>
        Go to Wallets
      </Button>
    ) : (
      <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={back}>
        Go back
      </Button>
    );

  return (
    <div className="dark relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <RingLattice fade="centre" />
      <main className="relative flex w-full flex-col items-center text-center" style={{ maxWidth: 560 }}>
        <Wordmark cut="champagne" style={{ height: 30 }} />
        <div className="mt-12" style={FIGURE} aria-hidden>
          {code}
        </div>
        <h1 className="mt-6 text-3xl">
          <span className="sr-only">{code} </span>
          {copy.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">{copy.body}</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          {primary}
          {secondary}
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <Button variant="link" size="sm">
            Contact support
          </Button>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <Button variant="link" size="sm">
            {copy.status}
          </Button>
        </div>
      </main>
    </div>
  );
}
