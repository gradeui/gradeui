import type { Metadata } from "next";
import { VercelToolbar } from "@vercel/toolbar/next";
import { GotoBridge } from "@/components/goto-bridge";
import { DemoProvider } from "@/lib/demo";
import { DemoSettingsPanel } from "@/components/demo-settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrightLocal Replatform Prototype",
  description:
    "A walkable prototype of the replatformed BrightLocal Reviews area, on the real design system.",
  // Client prototype: keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The Vercel toolbar (comments) is only mounted on Vercel builds; it
  // needs a Vercel account to show anything, so local dev stays clean.
  const toolbar = process.env.VERCEL === "1";
  return (
    <html lang="en">
      <body className="antialiased">
        <DemoProvider>
          <GotoBridge />
          {children}
          <DemoSettingsPanel />
        </DemoProvider>
        {toolbar ? <VercelToolbar /> : null}
      </body>
    </html>
  );
}
