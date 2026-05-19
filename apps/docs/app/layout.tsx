import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import {
  JetBrains_Mono,
  Inter,
  Fraunces,
  Space_Grotesk,
  Plus_Jakarta_Sans,
  Outfit,
  Instrument_Serif,
  Geist,
  Geist_Mono,
  Manrope,
  Figtree,
  DM_Sans,
  Lexend,
  Source_Serif_4,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  GradeThemeProvider,
  GRADE_PRE_HYDRATION_SCRIPT,
} from "@/components/grade-theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LenisProvider } from "@/components/lenis-provider";
import { AuthProvider } from "@/components/auth-provider";

/* ═════════════════════ Font loaders ═════════════════════

   All fonts that the theme builder can select live here. Each loader
   registers a CSS custom property (--font-<name>) on <body> that the
   theme generator references by key via FONTS (lib/themes/types.ts).

   Geist is the default sans (replaces Satoshi — Satoshi's thin weight
   wasn't great for body text). JetBrains Mono + Geist Mono cover the
   monospace slot; serif options live on Fraunces / Instrument Serif /
   Source Serif 4.
   ═════════════════════════════════════════════════════════ */

// Geist gets its own `--font-geist` var so the theme system can reference
// it explicitly (the theme-owned `--font-sans` gets set by globals.css and
// the provider, which would cause a self-referencing cycle if Geist also
// claimed `--font-sans`).
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// JetBrains Mono gets its own `--font-jetbrains-mono` var. The theme
// system writes `--font-mono` to whatever var(--font-<name>) the user
// picks; if this loader claimed --font-mono directly, a theme that
// references var(--font-jetbrains-mono) inside `--font-mono` would
// hit the same circular-reference issue Geist had.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// Alternative sans options surfaced in the builder's font picker.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

// Serifs.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

// Additional mono.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

const FONT_VARS = [
  geist.variable,
  geistMono.variable,
  jetbrainsMono.variable,
  inter.variable,
  spaceGrotesk.variable,
  plusJakartaSans.variable,
  outfit.variable,
  manrope.variable,
  figtree.variable,
  dmSans.variable,
  lexend.variable,
  fraunces.variable,
  instrumentSerif.variable,
  sourceSerif.variable,
  ibmPlexMono.variable,
];

export const metadata: Metadata = {
  title: {
    default: "Grade Design System",
    template: "%s | Grade Design System",
  },
  description: "A collection of reusable React components, design tokens, and guidelines for building consistent, accessible interfaces.",
  keywords: ["react", "components", "ui", "design-system", "grade", "gradeui", "tailwindcss", "radix-ui"],
  authors: [{ name: "Grade" }],
  creator: "Grade",
  publisher: "Grade",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gradeui.com",
    siteName: "Grade Design System",
    title: "Grade Design System",
    description: "A collection of reusable React components, design tokens, and guidelines for building consistent, accessible interfaces.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grade Design System",
    description: "Reusable React components and design tokens.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Middleware stamps `x-pathname` onto the request headers so we can
  // identify sandbox routes here (the root layout otherwise has no
  // access to the current path — layouts are pre-rendered per-segment
  // and Next doesn't expose pathname to server components directly).
  //
  // Sandbox routes (/fast-sandbox) are loaded in an iframe by the Fast
  // renderer. They don't need AuthProvider / LenisProvider / Toaster —
  // specifically, AuthProvider surfaces the app's Auth.js config error
  // right inside the iframe, which is both distracting and unrelated
  // to what the preview is trying to show. Render a bare tree for them.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isSandbox = pathname.startsWith("/fast-sandbox");

  return (
    // Font-loader classes go on <html> (not <body>) so their --font-*
    // custom properties live at :root level, where globals.css rules like
    // `:root { --font-display: var(--font-fraunces), …; }` can actually
    // resolve the nested var() reference. Putting them on <body> would
    // leave --font-fraunces one level too low in the cascade and CSS would
    // treat my --font-display declaration as computed-value-time invalid.
    <html lang="en" className={cn(...FONT_VARS)} suppressHydrationWarning>
      <body
        className={cn("min-h-screen bg-background font-sans antialiased")}
      >
        {/*
          Pre-hydration script. Runs before React mounts and sets the
          .dark class + data-mode attribute from localStorage or system
          preference — avoids the dark-mode FOUC without depending on
          next-themes.

          Why this lives in <body> (not <head>): React 19 stopped
          executing inline <script> tags rendered through the React tree,
          so the historical pattern (`<script dangerouslySetInnerHTML
          ={...}/>` inside <head>) now logs "Encountered a script tag
          while rendering React component. Scripts inside React
          components are never executed". next/script with
          `beforeInteractive` is the App Router replacement, but Next
          documents it as a `<body>`-only API — placing the same Script
          inside <head> trips the same React 19 warning, because React
          still owns the head subtree. Putting it in <body> hands the
          script to Next's hoister, which inlines it into the document
          stream before hydration. The body-vs-head position doesn't
          affect run order for `beforeInteractive` — both fire before
          React boots.
        */}
        <Script
          id="grade-pre-hydration"
          strategy="beforeInteractive"
        >
          {GRADE_PRE_HYDRATION_SCRIPT}
        </Script>
        {isSandbox ? (
          // Sandbox tree: bare. The sandbox page imports its own
          // TooltipProvider (wrapping compiled previews) and manages
          // theme state via postMessage from the parent — no app-level
          // providers needed.
          children
        ) : (
          <AuthProvider>
            <GradeThemeProvider>
              {/* TooltipProvider wraps the whole app so any tabs /
                  buttons / toggles that pass a `tooltip` prop (or use
                  Tooltip directly) work without each consumer
                  needing to mount their own provider. 200ms delay
                  feels snappy without being noisy on cursor passes. */}
              <TooltipProvider delayDuration={200}>
                <LenisProvider>
                  {children}
                </LenisProvider>
              </TooltipProvider>
              <Toaster />
            </GradeThemeProvider>
          </AuthProvider>
        )}
      </body>
    </html>
  );
}
