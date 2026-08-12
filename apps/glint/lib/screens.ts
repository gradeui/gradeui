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
   *  only: a metadata write bumps it without changing a pixel, which is
   *  why drift is detected by hashing the source, not by this. */
  promotedAt: number;
  /** Signature of the Studio appSource this copy was promoted from, as
   *  `scripts/check-promotions.mts` computes it (source-id stamps and
   *  whitespace normalised away).
   *
   *  A RECORD, not the baseline. `pnpm -F @gradeui/glint
   *  check:promotions` compares live Studio against the
   *  `// source-hash:` stamp in the promoted page itself, because a
   *  field here can be re-blessed by `--update` with nobody having
   *  re-promoted, which is exactly how a stale app copy hid under a
   *  green tick. This is the fallback for pages promoted before that
   *  stamp existed. `--update` keeps it current. */
  sourceHash?: string;
}

export const SCREENS: ScreenEntry[] = [
  {
    slug: "/",
    name: "US Demo Landing",
    id: "dmskhheytm163",
    promotedAt: 1786536440523,
    sourceHash: "756eefbcfdac",
  },
  {
    slug: "/onboarding/step0",
    name: "US Onboarding — 0 Before you apply",
    id: "dmskgw2pk2r1x",
    step: 1,
    promotedAt: 1786469048975,
    sourceHash: "f2ae74b1b1b1",
  },
  {
    slug: "/onboarding/step1",
    name: "US Onboarding — 1 Business type",
    id: "dmskgweh31a0m",
    step: 2,
    promotedAt: 1786468838006,
    sourceHash: "02cbc1474ccd",
  },
  {
    slug: "/onboarding/step2",
    name: "US Onboarding — 2 Business details",
    id: "dmskgx7qs2sud",
    step: 3,
    promotedAt: 1786469114497,
    sourceHash: "12bf29e77385",
  },
  {
    slug: "/onboarding/step3a",
    name: "US Onboarding — 3a Owner identity",
    id: "dmskgxyctfxci",
    step: 4,
    promotedAt: 1786468890238,
    sourceHash: "73966c79e2d8",
  },
  {
    slug: "/onboarding/step3b",
    name: "US Onboarding — 3b Owners & control",
    id: "dmskgyvzc1nmh",
    step: 4,
    promotedAt: 1786468958015,
    sourceHash: "a44d7d043206",
  },
  {
    slug: "/onboarding/step4",
    name: "US Onboarding — 4 Expected activity",
    id: "dmskgzm7d7xvt",
    step: 5,
    promotedAt: 1786469074449,
    sourceHash: "1bd9816fe619",
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
    promotedAt: 1786468880697,
    sourceHash: "9546c5104b52",
  },
  {
    slug: "/onboarding/step7",
    name: "US Onboarding — 7 Review & submit",
    id: "dmskh12cv6zuz",
    step: 8,
    promotedAt: 1786453677404,
    sourceHash: "68e111cc049c",
  },
  {
    slug: "/status",
    name: "US Onboarding — Application status",
    id: "dmskh1lole59j",
    promotedAt: 1786466510196,
    sourceHash: "f376fadbb6f3",
  },
  {
    slug: "/wallets",
    name: "Dashboard — logged-in home",
    id: "dmskex612bcy1",
    promotedAt: 1786532786752,
    sourceHash: "c0464549bcbb",
  },
  {
    slug: "/bank-accounts",
    name: "Bank Accounts",
    id: "dmsp02q871y5u",
    promotedAt: 1786532789506,
    sourceHash: "fe74d5212606",
  },
  {
    slug: "/activity",
    name: "Activity — history",
    id: "dmsnba2xdvnc3",
    promotedAt: 1786536409378,
    sourceHash: "e03c6b84092d",
  },
  {
    slug: "/wallets/gold",
    name: "Gold — wallet",
    id: "dmsnbpdvrz1qa",
    promotedAt: 1786532787867,
    sourceHash: "47760c612cf0",
  },
  {
    slug: "/wallets/silver",
    name: "Silver — wallet",
    id: "dmsoj5uvz94l3",
    promotedAt: 1786532788454,
    sourceHash: "dc036fa15c70",
  },
  {
    slug: "/wallets/usd",
    name: "USD — wallet",
    id: "dmsou6g4wxv0l",
    promotedAt: 1786532788978,
    sourceHash: "c8bdb8af675d",
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
