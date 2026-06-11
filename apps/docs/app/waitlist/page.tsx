import type { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { MarketingBackground } from "@/components/marketing/marketing-background";
import { WaitlistFlow } from "@/components/marketing/waitlist-flow";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Get early access to Grade, the design system for designers. Themes, Studio, and components built to be shaped without writing code.",
  robots: { index: false, follow: true },
};

export default function WaitlistPage() {
  return (
    <MarketingLayout>
      {/* Shader backdrop — same mesh-gradient scene as the homepage
          hero (and the same tuning store), filling the whole page
          behind the form. Pointer interaction works through the
          pointer-events-none wrapper because the scene listens on
          window and maps to its mount rect. */}
      <section className="relative flex-1 flex flex-col">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <MarketingBackground />
        </div>
        <div className="relative">
          <WaitlistFlow />
        </div>
      </section>
    </MarketingLayout>
  );
}
