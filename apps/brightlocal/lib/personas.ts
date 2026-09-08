/**
 * The demo personas: who is looking at the prototype. Each one picks a
 * dataset (ds/data/*.json, the proposal module's data seam) and a set of
 * facts screens can branch on. Ali's four (8 Sep 2026):
 *
 *   starter   a single-location business that has barely used the
 *             product and needs handholding
 *   engaged   a single-location business with real usage behind it
 *   multi     a multi-location business
 *   agency    an agency managing client locations
 *   empty     signed up, nothing connected, looking around (Ali, 10 Sep:
 *             separate from the trial, which may have connected things)
 *   lapsed    the trial ended and they did not subscribe (Ali, 10 Sep:
 *             "how do we bring them back? discounts?")
 *
 * `dataset` "default" is the proposal module's generic Acme Local Agency
 * data. Screens read the persona through usePersona() in lib/demo.
 */

export type AccountType = "smb" | "multi" | "agency";
export type Engagement = "new" | "engaged" | "empty";

export interface Persona {
  id: string;
  label: string;
  description: string;
  accountType: AccountType;
  engagement: Engagement;
  /** Named dataset the shell mounts for this persona. */
  dataset: string;
  /** Look preset the shell opens in (LOOK_PRESETS in ds/proposal-shell). */
  look: string;
  /** The locations this account can see (dataset keys). All Locations
   *  lists exactly these; the sidebar offers a switcher when there are
   *  several. */
  locations: string[];
  /** The account name shown over the locations (agency: the agency). */
  accountLabel: string;
  /** On a free trial: gated features show as upsells with free credits. */
  trial?: { daysLeft: number; credits: number };
  /** The trial ended: the account is read-only until they subscribe. The
   *  recap modal becomes the win-back. */
  lapsed?: { daysAgo: number };
}

export const PERSONAS: Persona[] = [
  {
    id: "empty",
    label: "Signed up, looking around",
    description: "Minus 1 Studios, day one. No review sites connected, no reviews, no campaigns.",
    accountType: "smb",
    engagement: "empty",
    dataset: "minus-one-studios",
    look: "live-site",
    locations: ["minus-one-studios"],
    accountLabel: "Minus 1 Studios",
  },
  {
    id: "starter",
    label: "Single location, just started",
    description: "Minus 1 Studios, near the end of a free trial. Google connected, four reviews in, nothing answered.",
    accountType: "smb",
    engagement: "new",
    dataset: "minus-one-studios",
    look: "live-site",
    locations: ["minus-one-studios"],
    accountLabel: "Minus 1 Studios",
    trial: { daysLeft: 3, credits: 3 },
  },
  {
    id: "lapsed",
    label: "Trial ended",
    description: "Minus 1 Studios, nine days after the trial ended. Reviews still arriving, nobody answering.",
    accountType: "smb",
    engagement: "new",
    dataset: "minus-one-studios",
    look: "live-site",
    locations: ["minus-one-studios"],
    accountLabel: "Minus 1 Studios",
    lapsed: { daysAgo: 9 },
  },
  {
    id: "engaged",
    label: "Single location, engaged",
    description: "Minus 1 Studios after months of use. Campaigns running, replies flowing.",
    accountType: "smb",
    engagement: "engaged",
    dataset: "minus-one-studios",
    look: "live-site",
    locations: ["minus-one-studios"],
    accountLabel: "Minus 1 Studios",
  },
  {
    id: "multi",
    label: "Multi-location business",
    description: "Harbour & Co. Three restaurants under one account, switching between them.",
    accountType: "multi",
    engagement: "engaged",
    dataset: "harbour-co",
    look: "live-site",
    locations: ["harbour-co", "harbour-co-hove", "harbour-co-worthing"],
    accountLabel: "Harbour & Co",
  },
  {
    id: "agency",
    label: "Agency",
    description: "Acme Local Agency managing every client location, starting on Northside Dental.",
    accountType: "agency",
    engagement: "engaged",
    dataset: "northside-dental",
    look: "live-site",
    locations: ["northside-dental", "minus-one-studios", "harbour-co", "harbour-co-hove", "harbour-co-worthing"],
    accountLabel: "Acme Local Agency",
  },
];

export const DEFAULT_PERSONA_ID = "engaged";

export function personaById(id: string | null | undefined): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID)!;
}
