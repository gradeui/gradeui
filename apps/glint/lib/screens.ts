/**
 * The screen registry: this app's single source of truth for what was
 * promoted from Studio and where it lives.
 *
 * Every entry keeps its Studio identity (design id + screen name) next
 * to its app route, so links can be built either way:
 *
 *   - real URL:        /onboarding/business-type
 *   - stable Studio id: /s/dmskgweh31a0m   (redirects to the route)
 *
 * and so in-JSX `data-grade-goto="<screen name>"` navigation (the
 * Studio protocol) resolves through GotoBridge without rewriting the
 * promoted screen source. Names are matched case-insensitively on the
 * trimmed string, the same rule Studio's Fast Frame uses.
 *
 * Promotion provenance: `promotedAt` is designs.updated_at (epoch ms)
 * of the Studio source at the moment it was ported. When re-promoting
 * a screen, update it so "which version of the prototype is this?"
 * always has an answer. Studio project: Glint
 * (8e65f8f7-f995-4c47-bc39-8f68b42a86e4).
 */

export interface ScreenEntry {
  /** App route. */
  slug: string;
  /** Studio screen name, the `data-grade-goto` target. */
  name: string;
  /** Studio design id (designs.id), powers /s/<id> stable links. */
  id: string;
  /** 1-based wizard step for /onboarding screens (rail + progress). */
  step?: number;
  /** designs.updated_at (epoch ms) of the promoted source. Provenance
   *  only — a metadata write bumps it without changing a pixel, which
   *  is why drift is detected by `sourceHash`, not by this. */
  promotedAt: number;
  /** Signature of the Studio appSource this copy was promoted from, as
   *  `scripts/check-promotions.mts` computes it (source-id stamps and
   *  whitespace normalised away). `pnpm -F @gradeui/glint
   *  check:promotions` compares it against the live screen and fails
   *  when Studio has moved on. Re-baseline with --update. */
  sourceHash?: string;
}

export const SCREENS: ScreenEntry[] = [
  {
    slug: "/",
    name: "US Demo Landing",
    id: "dmskhheytm163",
    promotedAt: 1786361077708,
    sourceHash: "8b7e0a0d75f8",
  },
  {
    slug: "/onboarding/step0",
    name: "US Onboarding — 0 Before you apply",
    id: "dmskgw2pk2r1x",
    step: 1,
    promotedAt: 1786358340226,
    sourceHash: "af3870289208",
  },
  {
    slug: "/onboarding/step1",
    name: "US Onboarding — 1 Business type",
    id: "dmskgweh31a0m",
    step: 2,
    promotedAt: 1786356816160,
    sourceHash: "8fd2671ebd20",
  },
  {
    slug: "/onboarding/step2",
    name: "US Onboarding — 2 Business details",
    id: "dmskgx7qs2sud",
    step: 3,
    promotedAt: 1786359190532,
    sourceHash: "d3e5c05c417d",
  },
  {
    slug: "/onboarding/step3a",
    name: "US Onboarding — 3a Owner identity",
    id: "dmskgxyctfxci",
    step: 4,
    promotedAt: 1786359134179,
    sourceHash: "478cdb1981d2",
  },
  {
    slug: "/onboarding/step3b",
    name: "US Onboarding — 3b Owners & control",
    id: "dmskgyvzc1nmh",
    step: 4,
    promotedAt: 1786359134361,
    sourceHash: "2e72d0d979f6",
  },
  {
    slug: "/onboarding/step4",
    name: "US Onboarding — 4 Expected activity",
    id: "dmskgzm7d7xvt",
    step: 5,
    promotedAt: 1786358341034,
    sourceHash: "a200f13f1184",
  },
  {
    slug: "/onboarding/step5",
    name: "US Onboarding — 5 Documents",
    id: "dmskh01pnwn8w",
    step: 6,
    promotedAt: 1786358563148,
    sourceHash: "ccb9b512097b",
  },
  {
    slug: "/onboarding/step6",
    name: "US Onboarding — 6 Certification",
    id: "dmskh0ixi1gdj",
    step: 7,
    promotedAt: 1786358341154,
    sourceHash: "0a8ba805a66f",
  },
  {
    slug: "/onboarding/step7",
    name: "US Onboarding — 7 Review & submit",
    id: "dmskh12cv6zuz",
    step: 8,
    promotedAt: 1786359134537,
    sourceHash: "68e111cc049c",
  },
  {
    slug: "/status",
    name: "US Onboarding — Application status",
    id: "dmskh1lole59j",
    promotedAt: 1786357121180,
    sourceHash: "9fb2fd12bb2b",
  },
  {
    slug: "/wallets",
    name: "Dashboard — logged-in home",
    id: "dmskex612bcy1",
    promotedAt: 1786435743706,
    sourceHash: "168ee52d7502",
  },
  {
    slug: "/activity",
    name: "Activity — history",
    id: "dmsnba2xdvnc3",
    promotedAt: 1786371183861,
    sourceHash: "5636bda68a1f",
  },
  {
    slug: "/wallets/gold",
    name: "Gold — wallet",
    id: "dmsnbpdvrz1qa",
    promotedAt: 1786435550819,
    sourceHash: "d3956d3ed613",
  },
];

const norm = (s: string) => s.trim().toLowerCase();

const byName = new Map(SCREENS.map((s) => [norm(s.name), s]));
const byId = new Map(SCREENS.map((s) => [s.id, s]));
const bySlug = new Map(SCREENS.map((s) => [s.slug, s]));

/** Resolve a Studio screen name (goto target) to its registry entry. */
export function screenByName(name: string): ScreenEntry | undefined {
  return byName.get(norm(name));
}

/** Resolve a Studio design id to its registry entry. */
export function screenById(id: string): ScreenEntry | undefined {
  return byId.get(id);
}

/** Resolve an app route to its registry entry. */
export function screenBySlug(slug: string): ScreenEntry | undefined {
  return bySlug.get(slug);
}
