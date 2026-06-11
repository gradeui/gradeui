import type { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { WaitlistFlow } from "@/components/marketing/waitlist-flow";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Get early access to Grade — the design system for designers. Themes, Studio, and components built to be shaped without writing code.",
  robots: { index: false, follow: true },
};

export default function WaitlistPage() {
  return (
    <MarketingLayout>
      <WaitlistFlow />
    </MarketingLayout>
  );
}
