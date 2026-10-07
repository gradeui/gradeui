// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// ErrorPageV2 (2 Oct 2026): the standalone error page for the Glint
// business portal v2 on staging. Web DS "ErrorPage" (500 and 404) as the
// Web Portal file's System states slides set it: outside the shell, deep
// blue, the ring lattice at Subtle, the gold wordmark, the code as a large
// gold figure, a title, one line of body, two actions and two text links.
//
// TWIN: the Studio shared component "ErrorPageV2" (cmur2oxxwtlber). Editing one does
// not touch the other. Keep the pair in sync.
//
//   <ErrorPageV2 code="404" />
//   <ErrorPageV2 code="500" onRetry={reset} />
//
// ALWAYS DARK: the Web DS draws ErrorPage on the deep ground only, so in
// a light session the page puts the "dark" class on itself and stays dark.
// Only then, and only after mounting: when the document is already dark
// the page inherits the theme as it is, because in Studio a nested "dark"
// class picks up the design system's default dark tokens instead of the
// Glint theme's (the theme is applied to the root, not to ".dark").
// ASSUMPTION: there is no light ErrorPage in the Web DS; if one lands,
// drop useForceDark here.
//
// COPY is the Web Portal file's, verbatim (System states, as of 7 Oct;
// see below). Contact support and System status are inert.
//
// ACTIONS: "Go to Wallets" is a goto to the v2 Wallets screen. "Go back"
// steps back in the browser history. "Try again" calls onRetry when the
// app's error boundary passes its reset, and reloads the page otherwise.
// Mobile stacks the two actions full width, as the Web DS mobile frames do.
//
// STUDIO DIFFERS HERE: the same useWebDsType as LoginTemplateV2, since
// Studio's theme is the project's. The app twin has no such hook.
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New", System states:
// Error page · 404 and 500, desktop and mobile. The ground is page-deep
// with the ring lattice cleared in the middle; the wordmark (30, the
// wordmark token); 48 under it the figure in Raleway Bold 144/144 (112 on
// mobile) in the gold face; the title Raleway Bold 30/36 (24/32 on
// mobile) and the line under it Chivo 16/24, 12 apart; 32 under that the
// Web DS Buttons at lg, the primary and an outline, 12 apart (stacked
// full width on mobile); 24 under them the links, Chivo Medium 14/20 in
// primary with a muted "·" between. The 500's copy is Figma's: "Something
// went wrong", "We couldn’t load Glint. Try again in a moment." and
// "System status" (it was "Oops. Glint isn’t loading." and "Glint
// status").
import * as React from "react";
import { Wordmark } from "@/components/wordmark";
import { RingLattice } from "@/components/ring-lattice";
import { WebDsV2 } from "@/components/web-ds-v2";

const WEB_DS_TYPE_CSS =
  ":root:root{--font-sans:Chivo, system-ui, sans-serif;" +
  "--font-display:Raleway, system-ui, sans-serif;" +
  "--font-heading-weight:700;" +
  "font-variant-numeric:lining-nums tabular-nums}";
function useWebDsType() {
  React.useEffect(() => {
    if (!document.getElementById("glint-webds-fonts")) {
      const link = document.createElement("link");
      link.id = "glint-webds-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Chivo:wght@400;500;600;700&family=Raleway:wght@600;700&display=swap";
      document.head.appendChild(link);
    }
    const style = document.createElement("style");
    style.dataset.glintWebdsType = "";
    style.textContent = WEB_DS_TYPE_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

/* A Studio SCREEN NAME resolved by the goto protocol (and by the app's
   screen registry), so its dash is part of the name, not copy. */
const WALLETS = "Dashboard — logged-in home v2";

const COPY = {
  404: {
    title: "Page not found",
    body: "The page you’re looking for doesn’t exist or has moved.",
  },
  500: {
    title: "Something went wrong",
    body: "We couldn’t load Glint. Try again in a moment.",
  },
};

/** The figure's face: the gold ramp along the diagonal, lit from the top
 *  left like every other metal surface. */
const FIGURE = {
  fontFamily: "var(--font-raleway, Raleway), var(--font-display), sans-serif",
  fontWeight: 700,
  fontVariantNumeric: "lining-nums tabular-nums",
  backgroundImage:
    "linear-gradient(135deg, var(--wds-gold-100) 0%, var(--wds-gold-200) 35%, var(--wds-gold-300) 65%, var(--wds-gold-400) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** True when the document is not dark, so the page must darken itself. */
function useForceDark() {
  const [force, setForce] = React.useState(false);
  React.useEffect(() => {
    const root = document.documentElement;
    const read = () => setForce(!root.classList.contains("dark"));
    read();
    /* Follows a mode switch made while the page is open. */
    const watch = new MutationObserver(read);
    watch.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => watch.disconnect();
  }, []);
  return force;
}

function ErrorPageV2({ code = "404", onRetry }) {
  /* useWebDsType() is Studio only: the app sets the Web DS type in
     app/globals.css and loads the faces with next/font. */
  const forceDark = useForceDark();
  const copy = COPY[code] ?? COPY[404];
  const retry = () => (onRetry ? onRetry() : window.location.reload());
  const back = () => window.history.back();

  const primary =
    code === "500" ? (
      <WebDsV2.Button size="lg" className="w-full md:w-auto" onClick={retry}>
        Try again
      </WebDsV2.Button>
    ) : (
      <WebDsV2.Button size="lg" className="w-full md:w-auto" data-grade-goto={WALLETS}>
        Go to Wallets
      </WebDsV2.Button>
    );
  const secondary =
    code === "500" ? (
      <WebDsV2.Button size="lg" variant="outline" className="w-full md:w-auto" data-grade-goto={WALLETS}>
        Go to Wallets
      </WebDsV2.Button>
    ) : (
      <WebDsV2.Button size="lg" variant="outline" className="w-full md:w-auto" onClick={back}>
        Go back
      </WebDsV2.Button>
    );

  return (
    <div
      className={`${forceDark ? "dark " : ""}relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--wds-page-deep)] px-6 py-16 text-[color:var(--wds-foreground)]`}
    >
      <WebDsV2 />
      <RingLattice fade="centre" />
      <main className="relative flex w-full flex-col items-center text-center" style={{ maxWidth: 560 }}>
        <Wordmark tone="current" style={{ height: 30, color: "var(--wds-wordmark)" }} />
        <div className="mt-12 text-[112px] leading-[112px] md:text-[144px] md:leading-[144px]" style={FIGURE} aria-hidden>
          {code}
        </div>
        <h1 className="mt-3 wds-display text-2xl font-bold leading-8 md:text-3xl md:leading-9">
          <span className="sr-only">{code} </span>
          {copy.title}
        </h1>
        <p className="mt-3 text-base leading-6 text-[color:var(--wds-muted-foreground)]">{copy.body}</p>
        <div className="mt-8 flex w-full flex-col gap-3 md:w-auto md:flex-row md:justify-center">
          {primary}
          {secondary}
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm leading-5">
          <button type="button" className="cursor-pointer font-medium text-[color:var(--wds-primary)] hover:underline">
            Contact support
          </button>
          <span aria-hidden className="text-[color:var(--wds-muted-foreground)]">
            ·
          </span>
          <button type="button" className="cursor-pointer font-medium text-[color:var(--wds-primary)] hover:underline">
            System status
          </button>
        </div>
      </main>
    </div>
  );
}

/* Exported untyped: the body is plain JSX (see the header). */
const __ErrorPageV2: any = ErrorPageV2;
export { __ErrorPageV2 as ErrorPageV2 };
