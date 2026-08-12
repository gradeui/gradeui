import type { Metadata } from "next";
import { Caveat, IBM_Plex_Mono, Inter } from "next/font/google";
import { GotoBridge } from "@/components/goto-bridge";
import glintTheme from "@/theme/glint.theme.json";
import "./globals.css";

/* The Glint theme resolves --font-sans / --font-display to
   var(--font-inter) and --font-mono to var(--font-ibm-plex-mono)
   (see app/theme.css), so the loaders register exactly those vars. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
/* Handwriting for the signature field on step 7, via the `font-signature`
   role in @gradeui/ui. Registered here rather than hardcoded at the call
   site so the app and Studio resolve the same face. */
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Glint US Business Accounts Demo",
  description: "A walkable demo of the Glint US business account experience.",
  // Client demo: keep it out of search indexes. Drop this if the app
  // ever becomes a public marketing surface.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /* The attribute set mirrors what applyThemeToElement stamps at
     runtime in Studio: theme id, mode, and the component-shape hooks
     the stylesheet keys off. The demo runs dark, like the share link.
     The shape hooks are READ FROM the ThemeInput rather than typed
     here (11 Aug): they were hardcoded, so changing components.cardStyle
     to "elevated" in the theme regenerated the CSS variables but left
     the DOM saying "flat" — the card kept painting itself with --muted
     and the change silently did nothing. One source, no drift. */
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${ibmPlexMono.variable} ${caveat.variable}`}
      data-grade-theme={glintTheme.id}
      data-mode="dark"
      data-button-shape={glintTheme.components?.buttonShape ?? "default"}
      data-input-style={glintTheme.components?.inputStyle ?? "outlined"}
      data-card-style={glintTheme.components?.cardStyle ?? "flat"}
    >
      <body className="bg-background text-foreground antialiased">
        <GotoBridge />
        {children}
      </body>
    </html>
  );
}
