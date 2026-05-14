/**
 * Studio selection agent — single source of truth for both renderers.
 *
 * This function is used in two environments:
 *
 *   1. **Fast mode** (same-document): `fast-frame.tsx` imports it
 *      directly and calls it from a useEffect, mounted on the
 *      `FastPreviewWrapper` element.
 *
 *   2. **Sandpack mode** (in-iframe): `chat-sandpack.ts`'s
 *      `PLAYGROUND_SELECTION_AGENT_TSX` string inlines this function
 *      via `.toString()` so the iframe bundle gets the exact same
 *      code. A tiny boot wrapper around the inlined function supplies
 *      Sandpack-specific options (document as root, postMessage as
 *      reporter).
 *
 * Because the function is stringified into a runtime-compiled bundle,
 * it MUST stay self-contained — no module-level imports, no closures
 * over outside variables, no TypeScript-only features that depend on
 * a compiler. Only its parameters and standard browser globals.
 *
 * If you change behaviour here, both renderers pick it up the next
 * time the Studio bundle rebuilds and the Sandpack iframe boots.
 */

export type SelectionPayload = {
  tag: string;
  text: string;
  outerHTML: string;
  rect: { x: number; y: number; width: number; height: number };
  /** kebab-case data-gds-part if the selection resolved to a DS component
   *  boundary; undefined for plain elements. */
  part?: string;
  /** PascalCase component name derived from `part` — matches what the
   *  model is likely to have in the current JSX. */
  componentName?: string;
};

export interface InstallSelectionAgentOptions {
  /** Element (or Document) to attach capture-phase listeners on. In
   *  Sandpack this is `document` (the iframe's). In fast mode it's the
   *  `FastPreviewWrapper` element. */
  root: Document | HTMLElement;
  /** Where to append the overlay div. In Sandpack this is `document.body`
   *  (overlay uses position:fixed relative to iframe viewport). In fast
   *  mode this is the scroll container itself (overlay uses
   *  position:absolute relative to the container's padding box, with
   *  scroll-offset applied). */
  overlayHost: HTMLElement;
  /** Called with the serialized selection on click. The two renderers
   *  transport it differently — Sandpack via window.parent.postMessage,
   *  fast mode via a React callback. */
  reportSelected: (payload: SelectionPayload) => void;
}

export function installStudioSelectionAgent(
  opts: InstallSelectionAgentOptions
): () => void {
  const { root, overlayHost, reportSelected } = opts;

  // "three-scene" → "ThreeScene"
  function kebabToPascal(kebab: string): string {
    return kebab
      .split(/-+/)
      .filter(Boolean)
      .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join("");
  }

  // Parts that live INSIDE another DS component rather than being their
  // own JSX component. findComponentOwner skips these when walking up
  // so the settings panel pins to a real, source-addressable name.
  const SUB_PART_NAMES = new Set<string>([
    "shader-canvas",
    "scene-poster",
    "scene-controls",
    "video-poster",
    "preset-poster",
    "preset-label",
    "picker-selected-badge",
  ]);

  function findComponentOwner(el: Element | null): Element | null {
    if (!el || !el.closest) return null;
    let node: Element | null = el.closest(
      "[data-gds-part]"
    ) as Element | null;
    while (node) {
      const part = node.getAttribute("data-gds-part") || "";
      if (!SUB_PART_NAMES.has(part)) return node;
      const parent = node.parentElement;
      if (!parent) return null;
      node = parent.closest("[data-gds-part]") as Element | null;
    }
    return null;
  }

  function resolveSelectionTarget(el: Element | null): Element | null {
    if (!el) return null;
    return findComponentOwner(el) ?? el;
  }

  function serialize(target: Element): SelectionPayload {
    const partOwner = findComponentOwner(target);
    const el = partOwner ?? target;
    const part = partOwner
      ? partOwner.getAttribute("data-gds-part") || undefined
      : undefined;
    const componentName = part ? kebabToPascal(part) : undefined;

    const rect = el.getBoundingClientRect();
    const rawText = (
      (el as HTMLElement).innerText ||
      el.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
    const text =
      rawText.length > 120 ? rawText.slice(0, 120) + "…" : rawText;
    let outer = el.outerHTML || "";
    if (outer.length > 500) outer = outer.slice(0, 500) + "…";
    return {
      tag: el.tagName ? el.tagName.toLowerCase() : "",
      text,
      outerHTML: outer,
      rect: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      part,
      componentName,
    };
  }

  function isIgnored(el: Element | null): boolean {
    if (!el || el.nodeType !== 1) return true;
    if ((el as unknown) === root) return true;
    if (el === overlayHost) return true;
    if (el === document.body || el === document.documentElement) return true;
    if ((el as HTMLElement).id === "root") return true;
    if (el.hasAttribute && el.hasAttribute("data-grade-selection-overlay")) {
      return true;
    }
    return false;
  }

  // Overlay positioning strategy depends on host:
  //   - If host is document.body, use position:fixed (viewport-relative,
  //     matches the pre-extraction Sandpack agent's behaviour).
  //   - Otherwise use position:absolute + scroll-offset arithmetic
  //     (fast mode, where overlay lives inside a scroll container).
  const useFixedPositioning = overlayHost === document.body;

  const overlay = document.createElement("div");
  overlay.setAttribute("data-grade-selection-overlay", "");
  overlay.style.cssText = [
    "position:" + (useFixedPositioning ? "fixed" : "absolute"),
    "pointer-events:none",
    "z-index:2147483647",
    "border:2px solid oklch(var(--primary, 0.55 0.22 260))",
    "background:oklch(var(--primary, 0.55 0.22 260) / 0.12)",
    "border-radius:6px",
    "box-shadow:0 0 0 1px oklch(var(--background, 1 0 0) / 0.5) inset",
    "transition:left 80ms ease-out, top 80ms ease-out, width 80ms ease-out, height 80ms ease-out",
    "display:none",
  ].join(";");

  // Body may not exist yet on early Sandpack boot; defer append until
  // DOMContentLoaded in that case. Fast mode's host always exists.
  if (overlayHost && overlayHost.isConnected) {
    overlayHost.appendChild(overlay);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (overlayHost && !overlay.isConnected) {
        overlayHost.appendChild(overlay);
      }
    });
  }

  function positionOverlay(el: Element) {
    const rect = el.getBoundingClientRect();
    if (useFixedPositioning) {
      overlay.style.left = rect.left + "px";
      overlay.style.top = rect.top + "px";
    } else {
      const hostRect = overlayHost.getBoundingClientRect();
      overlay.style.left =
        rect.left - hostRect.left + overlayHost.scrollLeft + "px";
      overlay.style.top =
        rect.top - hostRect.top + overlayHost.scrollTop + "px";
    }
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.style.display = "block";
  }

  function hideOverlay() {
    overlay.style.display = "none";
  }

  let lastHovered: Element | null = null;

  function onMouseOver(e: MouseEvent) {
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    lastHovered = target;
    positionOverlay(target);
  }

  function onMouseOut(e: MouseEvent) {
    if (e.target === lastHovered) hideOverlay();
  }

  function onClick(e: MouseEvent) {
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    e.preventDefault();
    e.stopPropagation();
    positionOverlay(target);
    reportSelected(serialize(target));
  }

  // Cursor: for Sandpack (Document root), set on documentElement so the
  // crosshair covers the whole iframe viewport. For fast mode (element
  // root), set on the element so descendants inherit it via CSS
  // cascade without touching the host page's cursor.
  const cursorHost: HTMLElement =
    root instanceof Document
      ? (root.documentElement as HTMLElement)
      : (root as HTMLElement);
  const prevCursor = cursorHost.style.cursor;
  cursorHost.style.cursor = "crosshair";

  // EventTarget works for both Document and HTMLElement — TS just
  // doesn't know they share addEventListener semantics at this call
  // shape without a cast.
  const listenerTarget = root as EventTarget;
  listenerTarget.addEventListener(
    "mouseover",
    onMouseOver as EventListener,
    true
  );
  listenerTarget.addEventListener(
    "mouseout",
    onMouseOut as EventListener,
    true
  );
  listenerTarget.addEventListener(
    "click",
    onClick as EventListener,
    true
  );

  return function teardown() {
    listenerTarget.removeEventListener(
      "mouseover",
      onMouseOver as EventListener,
      true
    );
    listenerTarget.removeEventListener(
      "mouseout",
      onMouseOut as EventListener,
      true
    );
    listenerTarget.removeEventListener(
      "click",
      onClick as EventListener,
      true
    );
    cursorHost.style.cursor = prevCursor;
    overlay.remove();
    lastHovered = null;
  };
}
