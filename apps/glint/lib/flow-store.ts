"use client";

/**
 * Glint flow store, ported from the Studio shared component "FlowStore"
 * (component cmsn0g361zt0zv, version 1786359133681): selections that
 * survive navigation. sessionStorage persists across route changes and
 * reloads within a tab, so a walkthrough keeps its answers and a fresh
 * tab starts clean. The landing's Start button calls resetFlow() so
 * every demo run starts fresh.
 *
 * Next.js port note: reads go through useSyncExternalStore with a
 * server snapshot of `initial`, so server-rendered HTML shows defaults
 * and the client corrects to stored values during hydration without
 * mismatch errors (the Studio original read sessionStorage in a
 * useState initializer, which is fine in a client-only iframe but not
 * under SSR).
 *
 * KEY REGISTRY (screens share these; Review reads them all):
 *   Step 0: applicantEmail, twoFactor, applicantMobile, applicantRole,
 *     hasGlintAccount, contactName, contactPhone, contactEmail,
 *     contactConsent, attestSanctions, attestProhibited, attestChecks
 *   Step 1: businessType (smllc | mmllc | partnership | corporation)
 *   Step 2: legalName, hasDba, dbaName, formationState, formationDate,
 *     bizStreet, bizCity, bizState, bizZip, mailElsewhere,
 *     mailingAddress, hasRegisteredAgent, agentAddress, bizTin,
 *     industry, bizPhone, bizCell, bizEmail, bizSite, employees, revenue
 *   Owner (3a SMLLC owner = 3b Owner 1, one PERSON record per the
 *     spec): o1First, o1Middle, o1Last, o1Dob, o1Citizenship, o1Street,
 *     o1City, o1State, o1Zip, o1Ssn, o1Phone, o1TaxResidence
 *   Step 3b: ownershipPct, noMajorityOwner, ownerIsTrust, trustName,
 *     controlSameAsOwner, cpFirst, cpMiddle, cpLast, cpDob, cpSsn,
 *     cpStreet, cpCity, cpState, cpZip, cpTitle
 *   Step 4: accountPurpose, monthlyVolume, monthlyCount,
 *     transactionTypes[], fundingSources[], thirdPartyName,
 *     sourcesOfFunds[], crossBorder, crossBorderCountries[],
 *     cryptoActivity, cryptoDetail, cashIntensive
 *   Step 6: boCertified, certName, certRole, accuracyConfirmed,
 *     signature
 */

import * as React from "react";

/** All 50 states + DC, for every state select in the flow. Values are
 *  lowercase USPS codes; stored selections stay compatible. */
export const US_STATES = [
  { value: "al", label: "Alabama" },
  { value: "ak", label: "Alaska" },
  { value: "az", label: "Arizona" },
  { value: "ar", label: "Arkansas" },
  { value: "ca", label: "California" },
  { value: "co", label: "Colorado" },
  { value: "ct", label: "Connecticut" },
  { value: "de", label: "Delaware" },
  { value: "dc", label: "District of Columbia" },
  { value: "fl", label: "Florida" },
  { value: "ga", label: "Georgia" },
  { value: "hi", label: "Hawaii" },
  { value: "id", label: "Idaho" },
  { value: "il", label: "Illinois" },
  { value: "in", label: "Indiana" },
  { value: "ia", label: "Iowa" },
  { value: "ks", label: "Kansas" },
  { value: "ky", label: "Kentucky" },
  { value: "la", label: "Louisiana" },
  { value: "me", label: "Maine" },
  { value: "md", label: "Maryland" },
  { value: "ma", label: "Massachusetts" },
  { value: "mi", label: "Michigan" },
  { value: "mn", label: "Minnesota" },
  { value: "ms", label: "Mississippi" },
  { value: "mo", label: "Missouri" },
  { value: "mt", label: "Montana" },
  { value: "ne", label: "Nebraska" },
  { value: "nv", label: "Nevada" },
  { value: "nh", label: "New Hampshire" },
  { value: "nj", label: "New Jersey" },
  { value: "nm", label: "New Mexico" },
  { value: "ny", label: "New York" },
  { value: "nc", label: "North Carolina" },
  { value: "nd", label: "North Dakota" },
  { value: "oh", label: "Ohio" },
  { value: "ok", label: "Oklahoma" },
  { value: "or", label: "Oregon" },
  { value: "pa", label: "Pennsylvania" },
  { value: "ri", label: "Rhode Island" },
  { value: "sc", label: "South Carolina" },
  { value: "sd", label: "South Dakota" },
  { value: "tn", label: "Tennessee" },
  { value: "tx", label: "Texas" },
  { value: "ut", label: "Utah" },
  { value: "vt", label: "Vermont" },
  { value: "va", label: "Virginia" },
  { value: "wa", label: "Washington" },
  { value: "wv", label: "West Virginia" },
  { value: "wi", label: "Wisconsin" },
  { value: "wy", label: "Wyoming" },
];

const KEY = "glint-flow-state";

type FlowState = Record<string, unknown>;

/* Snapshot cache: useSyncExternalStore compares snapshots by identity,
   so readAll must return the SAME object until storage actually
   changes, or React would loop re-rendering. */
const EMPTY: FlowState = {};
let cache: { raw: string | null; parsed: FlowState } = {
  raw: null,
  parsed: EMPTY,
};

function readAll(): FlowState {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return cache.parsed;
  }
  if (raw === cache.raw) return cache.parsed;
  let parsed: FlowState = {};
  try {
    parsed = raw ? (JSON.parse(raw) ?? {}) : {};
  } catch {
    parsed = {};
  }
  cache = { raw, parsed };
  return parsed;
}

function writeAll(next: FlowState) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: selections simply stop persisting */
  }
}

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export function useFlowField<T>(
  key: string,
  initial: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  /* Pin the first `initial` (matches the original's useState capture):
     an inline [] or {} default would otherwise be a fresh identity
     every render and useSyncExternalStore would loop on it. */
  const initialRef = React.useRef(initial);

  const value = React.useSyncExternalStore(
    subscribe,
    () => {
      const all = readAll();
      return (key in all ? all[key] : initialRef.current) as T;
    },
    () => initialRef.current,
  );

  const set = React.useCallback(
    (v: T | ((prev: T) => T)) => {
      const all = readAll();
      const prev = (key in all ? all[key] : initialRef.current) as T;
      const next =
        typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      writeAll({ ...all, [key]: next });
      emit();
    },
    [key],
  );

  return [value, set];
}

export function getFlowField<T>(key: string, fallback: T): T {
  const all = readAll();
  return (key in all ? all[key] : fallback) as T;
}

export function resetFlow() {
  writeAll({});
  emit();
}

/** Namespace object mirroring the Studio shared component's API
 *  (FlowStore.useField / .get / .reset ride on the component). */
export const FlowStore = {
  useField: useFlowField,
  get: getFlowField,
  reset: resetFlow,
};
