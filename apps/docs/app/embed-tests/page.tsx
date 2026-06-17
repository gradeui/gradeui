/**
 * /embed-tests — a scratch surface for the embed configuration options.
 * Renders the same gallery the homepage used to carry (EmbedOptionsShowcase),
 * but on a dedicated page so the marketing homepage stays lean and the embed
 * params can be eyeballed in one place. Not linked from nav; a test bench.
 */

import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { EmbedOptionsShowcase } from "@/components/marketing/embed-options-showcase";

export const metadata = {
  title: "Embed tests · Grade",
  robots: { index: false, follow: false },
};

export default function EmbedTestsPage() {
  return (
    <MarketingLayout>
      <div className="pt-28 md:pt-32">
        <EmbedOptionsShowcase />
      </div>
    </MarketingLayout>
  );
}
