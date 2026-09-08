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
 *
 * `dataset` "default" is the proposal module's generic Acme Local Agency
 * data. Screens read the persona through usePersona() in lib/demo.
 */

export type AccountType = "smb" | "multi" | "agency";
export type Engagement = "new" | "engaged";

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
}

export const PERSONAS: Persona[] = [
  {
    id: "starter",
    label: "Single location, just started",
    description: "Minus 1 Studios, week one. Few reviews, nothing set up, needs handholding.",
    accountType: "smb",
    engagement: "new",
    dataset: "minus-one-studios",
    look: "live-site",
  },
  {
    id: "engaged",
    label: "Single location, engaged",
    description: "Minus 1 Studios after months of use. Campaigns running, replies flowing.",
    accountType: "smb",
    engagement: "engaged",
    dataset: "minus-one-studios",
    look: "live-site",
  },
  {
    id: "multi",
    label: "Multi-location business",
    description: "Harbour & Co. Several locations under one account, switching between them.",
    accountType: "multi",
    engagement: "engaged",
    dataset: "harbour-co",
    look: "live-site",
  },
  {
    id: "agency",
    label: "Agency",
    description: "Acme Local Agency managing client locations, including Northside Dental.",
    accountType: "agency",
    engagement: "engaged",
    dataset: "northside-dental",
    look: "live-site",
  },
];

export const DEFAULT_PERSONA_ID = "engaged";

export function personaById(id: string | null | undefined): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID)!;
}
