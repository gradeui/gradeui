import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { GotoBridge } from "@/components/goto-bridge";
import "./globals.css";

/* The Glint theme resolves --font-sans / --font-display to
   var(--font-inter) and --font-mono to var(--font-ibm-plex-mono)
   (see app/theme.css), so the loaders register exactly those vars. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
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
     the stylesheet keys off. The demo runs dark, like the share link. */
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${ibmPlexMono.variable}`}
      data-grade-theme="glint"
      data-mode="dark"
      data-button-shape="default"
      data-input-style="outlined"
      data-card-style="flat"
    >
      <body className="bg-background text-foreground antialiased">
        <GotoBridge />
        {children}
      </body>
    </html>
  );
}
