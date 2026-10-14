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
  /** Other screen names that resolve to this route. The business portal
   *  v2 (glint-staging, 1 Oct 2026) promotes "… v2" copies of Studio
   *  screens onto the routes their originals held, while the chrome, the
   *  product layout and every unchanged screen still link by the ORIGINAL
   *  name. Listing that name here keeps those links landing on the v2
   *  page instead of falling through as inert. Navigation only: the drift
   *  guard matches pages by design id and never reads this. */
  aliases?: string[];
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
  /** false keeps GotoBridge from prefetching the route. For the error
   *  pages, which answer 404 and 500 by design (staging, 2 Oct 2026). */
  prefetch?: boolean;
}

export const SCREENS: ScreenEntry[] = [
  {
    slug: "/",
    name: "US Demo Landing",
    id: "dmskhheytm163",
    promotedAt: 1786540434331,
    sourceHash: "cc8bee10a890",
  },
  {
    slug: "/onboarding/step1",
    name: "US Onboarding — 1 Before you apply",
    id: "dmskgw2pk2r1x",
    step: 1,
    promotedAt: 1786539104485,
    sourceHash: "63c09bf7fdca",
  },
  {
    slug: "/onboarding/step2",
    name: "US Onboarding — 2 Business type",
    id: "dmskgweh31a0m",
    step: 2,
    promotedAt: 1786539105318,
    sourceHash: "7ae75327f871",
  },
  {
    slug: "/onboarding/step3",
    name: "US Onboarding — 3 Business details",
    id: "dmskgx7qs2sud",
    step: 3,
    promotedAt: 1786539106022,
    sourceHash: "7f478dde453a",
  },
  {
    slug: "/onboarding/step4a",
    name: "US Onboarding — 4a Owner identity",
    id: "dmskgxyctfxci",
    step: 4,
    promotedAt: 1786539106753,
    sourceHash: "2949978560ae",
  },
  {
    slug: "/onboarding/step4b",
    name: "US Onboarding — 4b Owners & control",
    id: "dmskgyvzc1nmh",
    step: 4,
    promotedAt: 1786539107406,
    sourceHash: "1c3dda5ac2dd",
  },
  {
    slug: "/onboarding/step5",
    name: "US Onboarding — 5 Expected activity",
    id: "dmskgzm7d7xvt",
    step: 5,
    promotedAt: 1786539108170,
    sourceHash: "b2c685b8aa71",
  },
  {
    slug: "/onboarding/step6",
    name: "US Onboarding — 6 Documents",
    id: "dmskh01pnwn8w",
    step: 6,
    promotedAt: 1786539108974,
    sourceHash: "16e3289e7e0a",
  },
  {
    slug: "/onboarding/step7",
    name: "US Onboarding — 7 Certification",
    id: "dmskh0ixi1gdj",
    step: 7,
    promotedAt: 1786541633461,
    sourceHash: "d53d2f570700",
  },
  {
    slug: "/onboarding/step8",
    name: "US Onboarding — 8 Review & submit",
    id: "dmskh12cv6zuz",
    step: 8,
    promotedAt: 1786539110181,
    sourceHash: "96d4533bbd62",
  },
  {
    slug: "/status",
    name: "US Onboarding — Application status",
    id: "dmskh1lole59j",
    promotedAt: 1786539111263,
    sourceHash: "32b7d6e48622",
  },
  {
    slug: "/console/wallets",
    name: "Dashboard — logged-in home v2",
    id: "dmuppmsu1t19c",
    aliases: ["Dashboard — logged-in home"],
    promotedAt: 1792016108683,
    sourceHash: "cbac8dc9e6c2",
  },
  {
    slug: "/console/bank-accounts",
    name: "Bank Accounts v2",
    id: "dmupume7sb1e7",
    aliases: ["Bank Accounts"],
    promotedAt: 1791399543880,
    sourceHash: "3a108c45a62d",
  },
  {
    slug: "/console/activity",
    name: "Activity — history v2",
    id: "dmupumb6uwgoj",
    aliases: ["Activity — history"],
    promotedAt: 1792016110753,
    sourceHash: "2040bdf14317",
  },
  {
    slug: "/console/wallets/gold",
    name: "Gold — wallet v2",
    id: "dmuppmu4zpn8y",
    aliases: ["Gold — wallet"],
    promotedAt: 1792006235918,
    sourceHash: "87a417a049cf",
  },
  {
    slug: "/console/wallets/silver",
    name: "Silver — wallet v2",
    id: "dmuppmv1xj9ju",
    aliases: ["Silver — wallet"],
    promotedAt: 1792006237904,
    sourceHash: "679843ed9129",
  },
  /* Staging, 14 Oct 2026: the pages "Glint - Web Portal - Full New" adds.
     Profile takes over from Settings v2 (7 Oct), which is retired: its
     name stays as an alias so an old goto lands on Profile, and
     /console/settings redirects there (next.config.ts). */
  {
    slug: "/console/user/profile",
    name: "Profile v2",
    id: "dmv8hrbkp0e3v",
    aliases: ["Settings v2"],
    promotedAt: 1792016112558,
    sourceHash: "56ac7e2a9d7b",
  },
  {
    slug: "/console/notifications",
    name: "Notifications v2",
    id: "dmv8hrd1lm6pv",
    promotedAt: 1792005847837,
    sourceHash: "54490ee67526",
  },
  {
    slug: "/console/user/business-profile",
    name: "Business profile v2",
    id: "dmv8hrg7gdew8",
    promotedAt: 1792005426124,
    sourceHash: "2929ed6be126",
  },
  /* Staging, 2 Oct 2026: the signed-out pages. New screens rather than v2
     copies (production has no log in and no error pages), named "v2" to
     sit with the rest of the business portal v2. The two error pages are
     also the app's not-found and error boundary (app/not-found.tsx,
     app/error.tsx). */
  {
    slug: "/log-in",
    name: "Log in v2",
    id: "dmur2ps41k9hh",
    promotedAt: 1791397135331,
    sourceHash: "94254fb81a9f",
  },
  {
    slug: "/log-in/code",
    name: "Log in code v2",
    id: "dmur2qa05uort",
    promotedAt: 1792007012083,
    sourceHash: "f6821d07fd82",
  },
  /* 14 Oct 2026, Ali's calls on the Glint build vs Figma: its Statements
     page, at its address. (The USD wallet v2 screen is dropped: the Glint build has
     no USD page and Ali chose to drop ours; its address redirects.) */
  {
    slug: "/console/account/statements",
    name: "Statements v2",
    id: "dmv8o4j2187s3",
    promotedAt: 1792016114041,
    sourceHash: "f13db7a7ca34",
  },
  /* Staging, 14 Oct 2026: the rest of Full New's Login page, the passcode
     after the code and the reset (forgot, verify, choose new). */
  {
    slug: "/log-in/passcode",
    name: "Log in passcode v2",
    id: "dmv8iphang26p",
    promotedAt: 1792008765726,
    sourceHash: "b7166f3f3554",
  },
  {
    slug: "/log-in/forgot-passcode",
    name: "Forgot passcode v2",
    id: "dmv8ipitiwy4d",
    promotedAt: 1792007015814,
    sourceHash: "c6fb3c35d20c",
  },
  {
    slug: "/log-in/verify",
    name: "Verify account v2",
    id: "dmv8ipk6sspxj",
    promotedAt: 1792007017588,
    sourceHash: "cfe3fe0819da",
  },
  {
    slug: "/log-in/new-passcode",
    name: "New passcode v2",
    id: "dmv8iplq561t8",
    promotedAt: 1792007019581,
    sourceHash: "78537f803229",
  },
  {
    slug: "/404",
    name: "Page not found v2",
    id: "dmur2qhnjqpm4",
    promotedAt: 1790952262158,
    sourceHash: "d64524346adb",
    prefetch: false,
  },
  {
    slug: "/500",
    name: "Server error v2",
    id: "dmur2qjt0mxyu",
    promotedAt: 1790952264999,
    sourceHash: "d82a78d9a30d",
    prefetch: false,
  },
];

const norm = (s: string) => s.trim().toLowerCase();

const byName = new Map(
  SCREENS.flatMap((s) =>
    [s.name, ...(s.aliases ?? [])].map((n) => [norm(n), s] as const),
  ),
);
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
