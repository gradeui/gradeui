"use client";

// LoginTemplateV2 (2 Oct 2026): the signed-out page for the Glint business
// portal v2 on staging. Follows the Web DS "LoginTemplate" (Viewport=Desktop
// and Viewport=Mobile, Light and Dark) as the Web Portal file's Login slides
// use it: the ring lattice ground, the wordmark, one gold-framed card with
// the form in it, Privacy policy and Terms of use, and the chat button.
//
// TWIN: the Studio shared component "LoginTemplateV2" (cmur2ofqhi0uta).
// Editing one does not touch the other. Keep the pair in sync.
//
//   <LoginTemplateV2>
//     <LoginTemplateV2.Headline />            the rotating title, or
//     <h1 ...>Check your phone.</h1>          a plain one
//     ...the form...
//   </LoginTemplateV2>
//
// DESKTOP (md up): ground with the lattice cleared in the middle, the
// wordmark (30 tall) over a 480 wide card, the legal links at the foot of
// the page and the chat button in the corner.
// MOBILE: the lattice band takes whatever height the form leaves, with the
// wordmark in the middle of it, and the card becomes a SHEET pinned to the
// bottom: rounded top corners, gold frame on three sides and no bottom
// stroke (Web DS "Card surface", Shape=Sheet), the legal links inside it.
//
// THE CARD SURFACE (Web DS "Card surface", Frame=Gold, Glow=20%,
// Pattern=Plain, the one Ali chose on 30 Sep): a 1.5px inside border in
// the metal face gradient along the diagonal, and in dark a gold/400 glow
// at 20% with a 56 blur. In light it takes the drop shadow instead
// (neutral/950 at 35%), as the LoginTemplate's Light mode does.
//
// WORDMARK: champagne gold in dark; the primary blue in light, as the
// LoginTemplate's Light mode draws it.
//
// THE CHAT BUTTON, Privacy policy, Terms of use and Contact support are
// inert: the prototype has nowhere for them to go.
//
// No useWebDsType here: the app sets the Web DS type tokens in
// app/globals.css. The Studio copy sets them while it is mounted.

import * as React from "react";
import { Button } from "@gradeui/ui";
import { MessageCircle } from "lucide-react";
import { Wordmark, METALS, metalRing } from "@/components/wordmark";
import { RingLattice } from "@/components/ring-lattice";

const G = METALS.gold;

/** The metal face gradient along the card's diagonal (Web DS Card surface,
 *  Frame=Gold): the same polished ring the trade receipts use. */
const FRAME = metalRing("gold");

/** Shadows are the one other place transparency is allowed. */
const GLOW = `0 0 56px oklch(${G[400]} / 0.2)`;
const DROP = "0 24px 56px -24px oklch(var(--ramp-neutral-950) / 0.35)";

/** The legal links. Inert. */
function Legal({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      <button type="button" className="cursor-pointer text-muted-foreground hover:text-foreground">
        Privacy policy
      </button>
      <button type="button" className="cursor-pointer text-muted-foreground hover:text-foreground">
        Terms of use
      </button>
    </div>
  );
}

export function LoginTemplateV2({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* The lattice: a band that fades out under the sheet on mobile,
          cleared in the middle on desktop. */}
      <RingLattice fade="bottom" className="md:hidden" />
      <RingLattice fade="centre" className="hidden md:block" />

      <main className="relative flex flex-1 flex-col md:items-center md:justify-center md:px-6 md:py-16">
        {/* The wordmark. On mobile this is the band, and it takes the
            height the sheet leaves. */}
        <div className="flex flex-1 items-center justify-center py-10 md:flex-none md:pb-8 md:pt-0">
          <Wordmark cut="champagne" className="hidden dark:block" style={{ height: 30 }} />
          <Wordmark tone="current" className="text-primary dark:hidden" style={{ height: 30 }} />
        </div>

        {/* The card surface: a card on desktop, a sheet on mobile. */}
        <div className="relative -mb-1 w-full md:mb-0" style={{ maxWidth: 480 }}>
          <div
            aria-hidden
            className="absolute inset-0 hidden rounded-t-3xl dark:block md:rounded-3xl"
            style={{ boxShadow: GLOW }}
          />
          <div
            aria-hidden
            className="absolute inset-0 rounded-t-3xl dark:hidden md:rounded-3xl"
            style={{ boxShadow: DROP }}
          />
          <div
            className="relative flex flex-col rounded-t-3xl px-5 pb-7 pt-8 md:rounded-3xl md:p-10"
            style={{
              border: "1.5px solid transparent",
              background: `linear-gradient(oklch(var(--card)), oklch(var(--card))) padding-box, ${FRAME} border-box`,
            }}
          >
            {children}
            <Legal className="mt-8 md:hidden" />
          </div>
        </div>
      </main>

      <footer className="relative hidden justify-center pb-10 md:flex">
        <Legal />
      </footer>

      {/* The chat button. Inert. */}
      <Button
        iconOnly
        size="lg"
        aria-label="Chat with us"
        className="fixed bottom-5 right-5 z-10 rounded-full md:bottom-6 md:right-6"
      >
        <MessageCircle className="size-5" />
      </Button>
    </div>
  );
}

/** The sign-in headline: Glint's own lines, one at a time (Ali, 30 Sep:
 *  "It could actually loop through a number of messages!"). Web DS
 *  "Headline": Raleway 700 30/36 in a box two lines tall, top aligned, so
 *  the lead under it never moves. Each line holds 5.5 s and cross-fades in
 *  400 ms; with reduced motion it shows the first line only. The slogan
 *  is the lockup, two lines with no full stops. No dots: they read as a
 *  carousel control. */
const HEADLINES: string[][] = [
  ["Gold, as money."],
  ["Great ideas never fade."],
  ["Gold is security", "Glint is key"],
];

LoginTemplateV2.Headline = function LoginTemplateV2Headline() {
  const [at, setAt] = React.useState(0);
  React.useEffect(() => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (still) return;
    const t = window.setInterval(() => setAt((n) => (n + 1) % HEADLINES.length), 5900);
    return () => window.clearInterval(t);
  }, []);
  return (
    <h1 className="relative text-3xl" style={{ height: 72, lineHeight: "36px" }}>
      {HEADLINES.map((lines, i) => (
        <span
          key={i}
          aria-hidden={i !== at}
          className="absolute inset-x-0 top-0"
          style={{ opacity: i === at ? 1 : 0, transition: "opacity 400ms ease-out" }}
        >
          {lines.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
};
