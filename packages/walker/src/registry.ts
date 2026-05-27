/**
 * Soft component registry — a flat Set of PascalCase names the walker
 * recognises as "real Grade components" worth round-tripping to Figma.
 *
 * Text-based walking means we don't strictly need a registry — every
 * PascalCase JSX tag is emitted as-is. The registry exists so the walker
 * can flag *unknown* names (typos, made-up components) as diagnostics,
 * matching the PRD's promise that `walk(<Button>X</Button>)` returns the
 * expected IR without warnings about unresolved components.
 *
 * `registerAll(modules)` is the convenience entry: pass `import * as Grade`
 * at app boot and every named export becomes a known name.
 */

const known = new Set<string>();

/** Register a single component name. */
export function register(name: string): void {
  if (typeof name === "string" && /^[A-Z]/.test(name)) {
    known.add(name);
  }
}

/** Register every PascalCase named export on a module. */
export function registerAll(modules: Record<string, unknown>): void {
  for (const name of Object.keys(modules)) {
    if (/^[A-Z]/.test(name)) {
      known.add(name);
    }
  }
}

/** True iff `name` has been registered (or it's a `$frame` directive). */
export function isKnown(name: string): boolean {
  if (name === "$frame") return true;
  return known.has(name);
}

/** Snapshot of the registry. Mostly for tests / diagnostics. */
export function listKnown(): string[] {
  return [...known].sort();
}

/** Drop everything from the registry. Test helper. */
export function clearRegistry(): void {
  known.clear();
}
