import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import {
  JetBrains_Mono,
  Inter,
  Inter_Tight,
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
  Poppins,
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
import { SupabaseProvider } from "@/components/supabase-provider";

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
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
// Poppins is a static (non-variable) Google font, so weights are explicit.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});
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
  interTight.variable,
  spaceGrotesk.variable,
  poppins.variable,
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

/* ═════════════════════ Site-level constants ═════════════════════
   Pulled out so the Next.js Metadata object and the JSON-LD graph
   stay aligned — every author / org / URL claim should resolve to
   the same string in both places. Update here, not in two places.
   ═════════════════════════════════════════════════════════════════ */

const SITE_URL = "https://gradeui.com";
const SITE_NAME = "Grade Design System";
const SITE_TAGLINE = "A BYOK design system and AI-powered UI studio for designers — own the components, bring your own model.";
const AUTHOR_NAME = "Alastair Driver";
const AUTHOR_URL = "https://alastairdriver.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Every page title carries author attribution, so a Google SERP
    // entry for any GradeUI page reads e.g. "Components | Grade
    // Design System by Alastair Driver" — making authorship obvious
    // in the result list without anyone clicking through.
    default: `${SITE_NAME} by ${AUTHOR_NAME}`,
    template: `%s | ${SITE_NAME} by ${AUTHOR_NAME}`,
  },
  description: SITE_TAGLINE,
  keywords: [
    "react",
    "components",
    "ui",
    "design-system",
    "grade",
    "gradeui",
    "tailwindcss",
    "radix-ui",
    "ai design tools",
    "byok",
    "v0 alternative",
    "lovable alternative",
    "bolt alternative",
    "claude design alternative",
    "shadcn",
  ],
  authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} by ${AUTHOR_NAME}`,
    description: SITE_TAGLINE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} by ${AUTHOR_NAME}`,
    description: SITE_TAGLINE,
    creator: "@alastairdriver",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/* ─── JSON-LD graph ───────────────────────────────────────────────
   Three-node graph (WebSite + Organization + SoftwareApplication)
   that lets crawlers + LLM ingestion pipelines resolve a single
   coherent claim: GradeUI is software, maintained by Alastair
   Driver, whose canonical identity is alastairdriver.com.
   The @id values are URI references so the nodes link to each other
   inside the same graph (this is what `@graph` is for — separate
   nodes that reference each other via @id).
   ───────────────────────────────────────────────────────────────── */

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_TAGLINE,
      publisher: { "@id": `${AUTHOR_URL}/#person` },
      inLanguage: "en",
    },
    {
      "@type": "Person",
      "@id": `${AUTHOR_URL}/#person`,
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      sameAs: [AUTHOR_URL],
      jobTitle: "Design systems engineer",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_TAGLINE,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "DesignSystem",
      operatingSystem: "Web, Node.js",
      author: { "@id": `${AUTHOR_URL}/#person` },
      creator: { "@id": `${AUTHOR_URL}/#person` },
      maintainer: { "@id": `${AUTHOR_URL}/#person` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        category: "Free + BYOK (bring your own key)",
      },
      license: "https://opensource.org/licenses/MIT",
      keywords:
        "design system, BYOK, AI UI generation, shadcn, tailwindcss, v0 alternative, lovable alternative, bolt alternative, claude design alternative",
    },
  ],
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
  // Both the Fast sandbox iframe (/fast-sandbox) and the public embed
  // (/e/<token>) want a bare tree: no AuthProvider (its config-error
  // banner would leak into the iframe / embed), no Lenis, no Toaster.
  const isSandbox =
    pathname.startsWith("/fast-sandbox") || pathname.startsWith("/e/");

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
        {/*
          JSON-LD graph (Person + WebSite + SoftwareApplication).
          Plain <script type="application/ld+json"> rendered in the
          React tree is the Next.js-recommended pattern for structured
          data — crawlers (Google, Bing) and LLM ingestion pipelines
          (OpenAI, Perplexity, Anthropic) both read the rendered HTML,
          so server-rendering this block is sufficient. We render it
          even on /fast-sandbox iframes — costs nothing and the iframe
          page is not crawled anyway.
        */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {isSandbox ? (
          // Sandbox tree: bare. The sandbox page imports its own
          // TooltipProvider (wrapping compiled previews) and manages
          // theme state via postMessage from the parent — no app-level
          // providers needed.
          children
        ) : (
          <SupabaseProvider>
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
          </SupabaseProvider>
        )}
      </body>
    </html>
  );
}
