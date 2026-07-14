/**
 * Active design-system registry (STUDIO-BYODS.md B1/B4).
 *
 * TWO layers of selection, resolved by `getActiveRegistry()`:
 *
 *   1. PER-PROJECT (client): the studio page calls
 *      `setActiveProjectRegistry(project.registryId)` whenever the
 *      active project changes. The override is a module singleton —
 *      one active project per tab — and subscribable so React
 *      consumers re-render (`useActiveRegistry` in
 *      use-active-registry.ts).
 *   2. DEPLOYMENT DEFAULT (env): NEXT_PUBLIC_STUDIO_REGISTRY.
 *      Unset (or "gradeui") keeps stock behaviour. NEXT_PUBLIC_ so the
 *      same fallback drives both server routes and client callsites.
 *
 * Server routes must NOT rely on the singleton (concurrent requests) —
 * they receive a `registryId` per-request and resolve it with
 * `getRegistryById(id) ?? getActiveRegistry()`.
 *
 * Keep every consumer going through these helpers; module-scope
 * `const X = getActiveRegistry()` captures the value BEFORE any project
 * is known and defeats the per-project layer.
 *
 * HMR-proof since July 2026: the override state lives on globalThis
 * (see below), so dev-mode hot updates can no longer reset it.
 */

import {
  BRIGHTLOCAL_REGISTRY,
  GRADE_REGISTRY,
  type DesignSystemRegistry,
} from "@gradeui/studio/registry";

const REGISTRIES: Readonly<Record<string, DesignSystemRegistry>> = {
  [GRADE_REGISTRY.id]: GRADE_REGISTRY,
  [BRIGHTLOCAL_REGISTRY.id]: BRIGHTLOCAL_REGISTRY,
};

/** id → registry, or null. Unknown/absent ids mean "fall back to the
 *  deployment default" (getActiveRegistry). */
export function getRegistryById(
  id: string | null | undefined,
): DesignSystemRegistry | null {
  return (id && REGISTRIES[id]) || null;
}

/** Every registry available on this deployment — drives the project
 *  settings picker. */
export function listRegistries(): DesignSystemRegistry[] {
  return Object.values(REGISTRIES);
}

// ─── Per-project override (client singleton) ───────────────────────────
//
// The store lives on `globalThis`, NOT at module scope, because module
// scope is exactly what dev-mode HMR resets: every edit to a file in
// this import graph replaced the module, wiped the override, and left
// React state (which survives HMR) pointing at a project whose registry
// the app had forgotten — external screens silently rendered with the
// gradeui pipeline until a hard reload ("renderers are all broken",
// July 13/14, three times). globalThis survives module replacement, so
// the override now rides through HMR bursts untouched.
//
// We store the registry ID (string), not the registry object — the
// objects are re-created by each module swap, so a held reference would
// go stale and defeat the `===` change check. Resolution happens at
// read time against the current module's REGISTRIES.

interface RegistryOverrideStore {
  id: string | null;
  listeners: Set<() => void>;
}

const globalStore = globalThis as typeof globalThis & {
  __gradeRegistryOverride?: RegistryOverrideStore;
};
const store: RegistryOverrideStore = (globalStore.__gradeRegistryOverride ??= {
  id: null,
  listeners: new Set(),
});

/** Point the active registry at a project's registryId (null/undefined
 *  or unknown id = clear back to the deployment default). Called by the
 *  studio page whenever the active project changes, and by the share
 *  view with the share's project registry. Notifies subscribers only on
 *  an actual change. */
export function setActiveProjectRegistry(id: string | null | undefined): void {
  // Normalise unknown ids to null so the stored value is always
  // resolvable — matches the old behaviour (getRegistryById fallback).
  const nextId = getRegistryById(id)?.id ?? null;
  if (nextId === store.id) return;
  store.id = nextId;
  for (const l of store.listeners) l();
}

/** Subscribe to override changes — useSyncExternalStore shape. */
export function subscribeActiveRegistry(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

function envRegistry(): DesignSystemRegistry {
  const id = process.env.NEXT_PUBLIC_STUDIO_REGISTRY;
  if (!id) return GRADE_REGISTRY;
  const registry = REGISTRIES[id];
  if (!registry) {
    // Fail safe, loudly: an unknown id almost certainly means a typo'd env
    // var — falling back silently would generate gradeui screens into a
    // client project. One warn per module load is enough.
    // eslint-disable-next-line no-console
    console.warn(
      `[active-registry] unknown NEXT_PUBLIC_STUDIO_REGISTRY "${id}" — falling back to gradeui. Known: ${Object.keys(REGISTRIES).join(", ")}`,
    );
    return GRADE_REGISTRY;
  }
  return registry;
}

export function getActiveRegistry(): DesignSystemRegistry {
  return getRegistryById(store.id) ?? envRegistry();
}
