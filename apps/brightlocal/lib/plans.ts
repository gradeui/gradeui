/**
 * The plans as brightlocal.com/pricing shows them (read 10 Sep 2026):
 * three tiers, USD a month billed annually, each tier adding to the one
 * before. Reviews live in Grow. Quoted, not invented, so the in-product
 * pricing page (Ali, 11 Sep: "See Pro needs to go to a real upsell
 * inside the logged-in experience") says what the site says.
 */

export interface Plan {
  id: "track" | "manage" | "grow";
  name: string;
  price: number;
  saving: string;
  strap: string;
  includes: string[];
  plus?: string;
}

export const PLANS: Plan[] = [
  {
    id: "track",
    name: "Track",
    price: 31,
    saving: "Saving 21% on annual",
    strap: "Understand your local search visibility",
    includes: [
      "Run comprehensive local SEO audits",
      "Monitor local ranking for up to 100 keywords and four competitors",
      "Visualise local rankings on a geo-grid map for up to five keywords",
      "Monitor citation accuracy and spot opportunity gaps",
      "Audit Google Business Profile and benchmark against competitors",
    ],
  },
  {
    id: "manage",
    name: "Manage",
    price: 40,
    saving: "Saving 20% on annual",
    strap: "Keep your business details accurate everywhere",
    plus: "Everything included in Track plus:",
    includes: ["AI insights", "Keep your business details synced and protected across key sites", "Schedule posts on Google Business Profile"],
  },
  {
    id: "grow",
    name: "Grow",
    price: 49,
    saving: "Saving 18% on annual",
    strap: "Build trust and attract more customers",
    plus: "Everything included in Manage plus:",
    includes: [
      "Monitor and respond to customer reviews across multiple sites",
      "Get customer reviews via email, SMS and in-store campaigns",
      "Publish customer reviews on your website",
    ],
  },
];

export const SUBSCRIPTION_PATH = "/account/subscription";
