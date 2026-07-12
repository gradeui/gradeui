"use client";

/**
 * useActiveRegistry — reactive read of the active design-system
 * registry (per-project override ?? deployment default). Components
 * that branch on the registry in render (renderer pick, isExternal,
 * contract lookups) use this instead of calling getActiveRegistry()
 * directly, so switching projects re-renders them with the right DS.
 *
 * Kept in its own "use client" module — active-registry.ts itself is
 * imported by server routes and must stay hook-free.
 */

import { useSyncExternalStore } from "react";
import {
  getActiveRegistry,
  subscribeActiveRegistry,
} from "@/lib/active-registry";
import type { DesignSystemRegistry } from "@gradeui/studio/registry";

export function useActiveRegistry(): DesignSystemRegistry {
  return useSyncExternalStore(
    subscribeActiveRegistry,
    getActiveRegistry,
    // Server snapshot: the env default (no project override exists
    // during SSR — the page sets it after hydration).
    getActiveRegistry,
  );
}
