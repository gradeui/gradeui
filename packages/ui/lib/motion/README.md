# lib/motion

The global motion control for gradeui. One place to answer "should this animate?", so a single toggle stills every animated surface at once.

## API

```ts
import { useReducedMotion, setMotion, MOTION_ATTR } from "@gradeui/ui";

function ShaderBackdrop() {
  const reduced = useReducedMotion();
  // pause the render loop, paint a still frame, etc.
}

// Turn motion off / on globally (e.g. a toolbar toggle):
setMotion(false); // stamps data-motion="off" on <html>
setMotion(true);  // removes it — back to respecting the OS only
```

- `useReducedMotion()` — `true` when motion should be suppressed. ORs the OS `prefers-reduced-motion: reduce` query with a `data-motion="off"` attribute on `<html>`. Live (media-query change + attribute MutationObserver). SSR-safe.
- `setMotion(enabled)` — imperatively flip the `<html>` toggle.
- `MOTION_ATTR` — `"data-motion"`, the attribute name.
- `usePrefersReducedMotion` — deprecated alias of `useReducedMotion`, kept for back-compat.

## Design

**Reduce-only.** The toggle can add restriction but never override a viewer's OS preference to force motion on. `useReducedMotion()` always honours `prefers-reduced-motion: reduce` regardless of the toggle.

**Attribute-driven**, mirroring the renderer's `data-fidelity` flag: stamp `data-motion="off"` on `<html>` and both CSS and components react. A `[data-motion="off"]` reset in `styles/globals.css` neutralises pure-CSS animation/transition; JS-driven surfaces read the hook.

**Crosses the iframe.** In Studio's Fast Frame / embed / share, the toggle is driven into the sandbox over `postMessage` (`grade:set-motion`), where it stamps the attribute on the iframe's own `<html>` so the ThreeScene surfaces running inside pause.

Sibling to [`lib/demo`](../demo/README.md), the scripted-reveal spine.
