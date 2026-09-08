/**
 * Per-location review data profiles. The Reviews screens carry one rich
 * seed each (60 inbox rows, a source and star mix, nine campaigns); a
 * profile says how much of that seed a location shows and what its
 * sources look like, so every location reads differently while the
 * screens stay the Studio source.
 *
 * The hub numbers are READ OFF the screens, the standing rule for hub
 * cards: inbox counts are the statuses of the first `inboxRows` rows of
 * the Manager's seed; ratings and totals come from the Tracker's mix;
 * campaign counts are the statuses of the first `campaigns` seed rows
 * (Live, Live, Live, Draft, Ended, Scheduled, Live, Ended, Live).
 * Change a profile, change its hub numbers, in that order.
 */

export interface TrackerSource {
  id: string;
  name: string;
  stars?: number;
  up?: number;
  down?: number;
}

export interface LocationProfile {
  /** Rows of the Manager seed this location shows (max 60). */
  inboxRows: number;
  /** Tracker sources and the star mix across the star sources. */
  sources: TrackerSource[];
  starMix: Record<1 | 2 | 3 | 4 | 5, number>;
  /** Rows of the Builder seed this location shows (max 9). */
  campaigns: number;
  /** Hub card numbers, read off the pages above. */
  hub: {
    needReply: number;
    replied: number;
    skipped: number;
    allTime: number;
    rating: string;
    reviews: string;
    fiveStar: string;
    sourceCount: number;
    running: number;
    scheduled: number;
    draft: number;
    campaignsAll: number;
  };
}

const ENGAGED_SOURCES: TrackerSource[] = [
  { id: "google", name: "Google", stars: 862 },
  { id: "facebook", name: "Facebook", up: 106, down: 14 },
  { id: "yelp", name: "Yelp", stars: 61 },
  { id: "tripadvisor", name: "TripAdvisor", stars: 38 },
  { id: "yahoo", name: "Yahoo! Local", stars: 17 },
  { id: "apple", name: "Apple Maps", stars: 12 },
  { id: "bing", name: "Bing Places", stars: 6 },
];

export const LOCATION_PROFILES: Record<string, LocationProfile> = {
  // The captured account. Full seeds everywhere.
  "minus-one-studios": {
    inboxRows: 60,
    sources: ENGAGED_SOURCES,
    starMix: { 5: 836, 4: 93, 3: 21, 2: 13, 1: 33 },
    campaigns: 9,
    hub: { needReply: 26, replied: 29, skipped: 5, allTime: 60, rating: "4.7", reviews: "1,116", fiveStar: "836", sourceCount: 7, running: 5, scheduled: 1, draft: 1, campaignsAll: 9 },
  },
  // Harbour & Co, the flagship: busy, well run.
  "harbour-co": {
    inboxRows: 41,
    sources: [
      { id: "google", name: "Google", stars: 262 },
      { id: "facebook", name: "Facebook", up: 44, down: 5 },
      { id: "tripadvisor", name: "TripAdvisor", stars: 71 },
      { id: "yelp", name: "Yelp", stars: 9 },
    ],
    starMix: { 5: 251, 4: 61, 3: 17, 2: 6, 1: 7 },
    campaigns: 5,
    hub: { needReply: 19, replied: 20, skipped: 2, allTime: 41, rating: "4.6", reviews: "391", fiveStar: "251", sourceCount: 4, running: 3, scheduled: 0, draft: 1, campaignsAll: 5 },
  },
  // Hove: newer site, fewer reviews, one campaign.
  "harbour-co-hove": {
    inboxRows: 23,
    sources: [
      { id: "google", name: "Google", stars: 96 },
      { id: "facebook", name: "Facebook", up: 18, down: 4 },
      { id: "tripadvisor", name: "TripAdvisor", stars: 12 },
    ],
    starMix: { 5: 68, 4: 27, 3: 8, 2: 3, 1: 2 },
    campaigns: 1,
    hub: { needReply: 12, replied: 9, skipped: 2, allTime: 23, rating: "4.4", reviews: "130", fiveStar: "68", sourceCount: 3, running: 1, scheduled: 0, draft: 0, campaignsAll: 1 },
  },
  // Worthing: the weak one, replies falling behind.
  "harbour-co-worthing": {
    inboxRows: 28,
    sources: [
      { id: "google", name: "Google", stars: 49 },
      { id: "facebook", name: "Facebook", up: 9, down: 6 },
      { id: "tripadvisor", name: "TripAdvisor", stars: 15 },
    ],
    starMix: { 5: 30, 4: 14, 3: 9, 2: 5, 1: 6 },
    campaigns: 2,
    hub: { needReply: 14, replied: 12, skipped: 2, allTime: 28, rating: "3.9", reviews: "79", fiveStar: "30", sourceCount: 3, running: 2, scheduled: 0, draft: 0, campaignsAll: 2 },
  },
  // Northside Dental: the agency client with a reputation problem.
  "northside-dental": {
    inboxRows: 35,
    sources: [
      { id: "google", name: "Google", stars: 141 },
      { id: "facebook", name: "Facebook", up: 21, down: 12 },
      { id: "yelp", name: "Yelp", stars: 40 },
    ],
    starMix: { 5: 79, 4: 38, 3: 22, 2: 17, 1: 25 },
    campaigns: 2,
    hub: { needReply: 16, replied: 17, skipped: 2, allTime: 35, rating: "3.7", reviews: "214", fiveStar: "79", sourceCount: 3, running: 2, scheduled: 0, draft: 0, campaignsAll: 2 },
  },
};

/** The starter persona's week-one numbers, whatever the location: four
 *  Google reviews, nothing answered, no campaigns. Matches the starter
 *  seeds the Manager, Tracker and Builder apply. */
export const STARTER_PROFILE: LocationProfile = {
  inboxRows: 4,
  sources: [{ id: "google", name: "Google", stars: 4 }],
  starMix: { 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 },
  campaigns: 0,
  hub: { needReply: 4, replied: 0, skipped: 0, allTime: 4, rating: "4.8", reviews: "4", fiveStar: "3", sourceCount: 1, running: 0, scheduled: 0, draft: 0, campaignsAll: 0 },
};

export function profileFor(
  location: string | null | undefined,
  persona?: { engagement?: string } | null,
): LocationProfile {
  if (persona?.engagement === "new") return STARTER_PROFILE;
  return LOCATION_PROFILES[location ?? ""] ?? LOCATION_PROFILES["minus-one-studios"];
}
