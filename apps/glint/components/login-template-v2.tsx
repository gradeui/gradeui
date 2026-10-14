// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// LoginTemplateV2 (2 Oct 2026): the signed-out page for the Glint business
// portal v2 on staging. Follows the Web DS "LoginTemplate" (Viewport=Desktop
// and Viewport=Mobile, Light and Dark) as the Web Portal file's Login slides
// use it: the ring lattice ground, the wordmark, one gold-framed card with
// the form in it, Privacy policy and Terms of use, and the chat button.
//
// TWIN: the Studio shared component "LoginTemplateV2" (cmur2ofqhi0uta). Editing one does
// not touch the other. Keep the pair in sync.
//
//   <LoginTemplateV2>
//     <LoginTemplateV2.Headline />            the rotating title, or
//     <h1 ...>Check your phone.</h1>          a plain one
//     ...the form...
//   </LoginTemplateV2>
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New" (Login page), value
// for value:
//   - the ground is page-deep (primary/950 dark, neutral/50 light), and
//     the colour is the Web DS's (<WebDsV2 />, mounted here);
//   - the wordmark is one flat colour, the wordmark token (gold/300 dark,
//     primary/500 light), as the Figma Wordmark is filled;
//   - desktop: the card sits 40 under the wordmark; it is filled with
//     background and carries BOTH effects in both modes: the Card
//     surface's gold/400 glow (56 blur, 20%) and the card's drop shadow
//     (0 30 40 at 45%, Figma's own effect colour);
//   - the frame is the Card surface's own gradient: #e3e5bc, #d0b26d,
//     #a48544, #7f6124 along the diagonal, 1.5 inside;
//   - Privacy policy and Terms of use are Chivo 13/20, 24 apart,
//     neutral/400 at the foot of the desktop page and muted-foreground in
//     the mobile sheet;
//   - the chat button is a 48 circle in primary with a 24 icon in
//     primary-foreground, 32 in from the corner on desktop and 20 on
//     mobile.
//
// DESKTOP (md up): ground with the lattice cleared in the middle, the
// wordmark (30 tall) over a 480 wide card, the legal links at the foot of
// the page and the chat button in the corner.
// MOBILE: the lattice band takes whatever height the form leaves, with the
// wordmark in the middle of it, and the card becomes a SHEET pinned to the
// bottom: rounded top corners, gold frame on three sides and no bottom
// stroke (Web DS "Card surface", Shape=Sheet), the legal links inside it.
//
// THE CHAT BUTTON, Privacy policy, Terms of use and Contact support are
// inert: the prototype has nowhere for them to go.
//
// STUDIO DIFFERS HERE: Studio's theme is the project's, so this copy sets
// the Web DS type tokens on the document while it is mounted (the same
// useWebDsType AppChromeV2 has). The app twin has no such hook: the app
// sets them in app/globals.css.
import * as React from "react";
import { MessageCircle, LoaderCircle } from "lucide-react";
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

/** Web DS Card surface, Frame=Gold: the frame's own gradient stops. */
const FRAME = "linear-gradient(135deg, #e3e5bc 0%, #d0b26d 33%, #a48544 67%, #7f6124 100%)";

/** Shadows are the one place transparency is allowed: the Card surface's
 *  glow (gold/400 at 20%, 56 blur) and the card's drop (Figma's effect
 *  colour, 0 30 40 at 45%). */
const GLOW = "0 0 56px rgb(188 155 85 / 0.2)";
const DROP = "0 30px 40px rgb(5 5 18 / 0.45)";

/** The legal links. Inert. */
/* The legal links, and under them (14 Oct, the Glint build's footer)
   "© 2026 Glint Pay Inc.". */
function Legal({ className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-1 text-[13px] leading-5 ${className}`}>
      <div className="flex items-center gap-6">
        <button type="button" className="cursor-pointer hover:text-[color:var(--wds-foreground)]">
          Privacy policy
        </button>
        <button type="button" className="cursor-pointer hover:text-[color:var(--wds-foreground)]">
          Terms of use
        </button>
      </div>
      <span>© 2026 Glint Pay Inc.</span>
    </div>
  );
}

function LoginTemplateV2({ children }) {
  /* useWebDsType() is Studio only: the app sets the Web DS type in
     app/globals.css and loads the faces with next/font. */
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--wds-page-deep)] text-[color:var(--wds-foreground)]">
      <WebDsV2 />
      {/* The lattice: a band that fades out under the sheet on mobile,
          cleared in the middle on desktop. */}
      <RingLattice fade="bottom" className="md:hidden" />
      <RingLattice fade="centre" className="hidden md:block" />

      {/* 100 above on desktop, not 64 (14 Oct): Full New centres the
          column on the whole frame, 18 lower than centring it above the
          footer put it. */}
      <main className="relative flex flex-1 flex-col md:items-center md:justify-center md:px-6 md:pb-16 md:pt-[100px]">
        {/* The wordmark. On mobile this is the band, and it takes the
            height the sheet leaves. */}
        <div className="flex flex-1 items-center justify-center py-10 md:flex-none md:pb-10 md:pt-0">
          <Wordmark tone="current" style={{ height: 30, color: "var(--wds-wordmark)" }} />
        </div>

        {/* The card surface: a card on desktop, a sheet on mobile. */}
        <div
          className="relative -mb-1 w-full rounded-t-3xl md:mb-0 md:rounded-3xl md:shadow-[0_30px_40px_rgb(5_5_18/0.45)]"
          style={{ maxWidth: 480 }}
        >
          <div
            className="relative flex flex-col rounded-t-3xl px-5 pb-7 pt-8 md:rounded-3xl md:p-10"
            style={{
              border: "1.5px solid transparent",
              background: `linear-gradient(var(--wds-background), var(--wds-background)) padding-box, ${FRAME} border-box`,
              boxShadow: GLOW,
            }}
          >
            {children}
            <Legal className="mt-8 text-[color:var(--wds-muted-foreground)] md:hidden" />
          </div>
        </div>
      </main>

      <footer className="relative hidden justify-center pb-10 md:flex">
        <Legal className="text-[color:var(--wds-neutral-400)]" />
      </footer>

      {/* The chat button. Inert. */}
      <button
        type="button"
        aria-label="Chat with us"
        className="fixed bottom-5 right-5 z-10 flex size-12 cursor-pointer items-center justify-center rounded-full bg-[var(--wds-primary)] text-[color:var(--wds-primary-foreground)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)] md:bottom-8 md:right-8"
      >
        <MessageCircle className="size-6" />
      </button>
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
const HEADLINES = [
  ["Gold, as money."],
  ["Great ideas never fade."],
  ["Gold is security", "Glint is key"],
];

/** The spinner a sign-in button shows while it works (14 Oct, the Glint
 *  build's Send code, Continue and Log in). */
LoginTemplateV2.Spinner = function LoginTemplateV2Spinner() {
  return <LoaderCircle aria-label="Working" className="size-4 animate-spin motion-reduce:animate-none" />;
};

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

/* Exported untyped: the body is plain JSX (see the header). */
const __LoginTemplateV2: any = LoginTemplateV2;
export { __LoginTemplateV2 as LoginTemplateV2 };
