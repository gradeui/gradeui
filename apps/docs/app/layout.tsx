import type { Metadata } from "next";
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
  RampThemeProvider,
  RAMP_PRE_HYDRATION_SCRIPT,
} from "@/components/ramp-theme-provider";
import { Toaster } from "@/components/ui/sonner";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font-loader classes go on <html> (not <body>) so their --font-*
    // custom properties live at :root level, where globals.css rules like
    // `:root { --font-display: var(--font-fraunces), …; }` can actually
    // resolve the nested var() reference. Putting them on <body> would
    // leave --font-fraunces one level too low in the cascade and CSS would
    // treat my --font-display declaration as computed-value-time invalid.
    <html lang="en" className={cn(...FONT_VARS)} suppressHydrationWarning>
      <head>
        {/*
          Pre-hydration script. Runs before React mounts and sets the
          .dark class + data-mode attribute from localStorage or system
          preference — avoids the dark-mode FOUC without depending on
          next-themes.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: RAMP_PRE_HYDRATION_SCRIPT }}
        />
      </head>
      <body
        className={cn("min-h-screen bg-background font-sans antialiased")}
      >
        <AuthProvider>
          <RampThemeProvider>
            <LenisProvider>
              {children}
            </LenisProvider>
            <Toaster />
          </RampThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
