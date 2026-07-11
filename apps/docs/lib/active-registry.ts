/**
 * Active design-system registry for this deployment (STUDIO-BYODS.md B1).
 *
 * Interim selection mechanism: one registry per deployment, chosen by env.
 *
 *   NEXT_PUBLIC_STUDIO_REGISTRY=brightlocal pnpm dev
 *
 * Unset (or "gradeui") keeps today's behaviour exactly. NEXT_PUBLIC_ so the
 * same value drives both the server routes (chat, component-manifest) and
 * the client callsites (studio page's buildSystemPrompt, selection agent's
 * partAttribute) — the registry must agree end-to-end within one session.
 *
 * B4 replaces this with per-org `active_registry` in Supabase; keep every
 * consumer going through `getActiveRegistry()` so that swap is one file.
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

/** id → registry, or null. The per-project registry work (Project.
 *  registryId) resolves through this; unknown/absent ids mean "fall
 *  back to the deployment default" (getActiveRegistry). */
export function getRegistryById(
  id: string | null | undefined,
): DesignSystemRegistry | null {
  return (id && REGISTRIES[id]) || null;
}

export function getActiveRegistry(): DesignSystemRegistry {
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
