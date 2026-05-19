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
  /** Raw JSON of the element's `data-media-source` attribute when
   *  present (only set on `<MediaSurface>` with a `source` prop). The
   *  right panel reads this to surface a "Regenerate this slot" button
   *  without needing to walk the iframe DOM. */
  mediaSourceJson?: string;
  /** `data-gds-instance-id` from the picked element when present. For
   *  components rendered from a data array (the canonical music-app
   *  pattern: `array.map(item => <MediaSurface instanceId={item.id} />)`),
   *  this is the entry's `id` — what the settings panel uses to find
   *  the matching data-array row and mutate per-item. Undefined for
   *  standalone (non-templated) component uses. */
  instanceId?: string;
  /** `data-media-alt` from the picked element when present. For
   *  MediaSurfaces this carries the `alt` prop — the most natural
   *  place for a designer's description of what the slot should
   *  contain. The "Generate image" action forwards this to the
   *  resolver as a prompt-style description so future prompt-aware
   *  providers (Gemini, Replicate, etc.) have something better than
   *  the source descriptor's terse identifier fields to work from.
   *  Undefined for non-MediaSurface elements. */
  mediaAlt?: string;
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
  /** Called when the user clears the selection (Escape, or an external
   *  request via the returned handle's `clear()` method). The canvas
   *  uses this to drop the right-panel chip in lock-step with the
   *  in-iframe ring vanishing. */
  reportCleared?: () => void;
}

/** Return shape — `teardown` for unmount, `clear` so the canvas can
 *  programmatically dismiss the persistent selection ring (e.g. when
 *  the right-panel chip's × is clicked). */
export interface SelectionAgentHandle {
  teardown: () => void;
  clear: () => void;
}

export function installStudioSelectionAgent(
  opts: InstallSelectionAgentOptions
): SelectionAgentHandle {
  const { root, overlayHost, reportSelected, reportCleared } = opts;

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
  //
  // Why each MediaSurface sub-part is here: the slot is a single
  // `<MediaSurface>` in source, but at render time it stamps several
  // `data-gds-part` markers on its internal layers (placeholder, the
  // `<img>` content, the overlay slot, the caption). Without these
  // entries, a click on the overlay's play button would resolve to
  // "MediaSurfaceOverlay" — a phantom component name the chat can't
  // address. The full set keeps every interior click bubbling up to
  // the MediaSurface root, which IS source-addressable.
  const SUB_PART_NAMES = new Set<string>([
    "shader-canvas",
    "scene-poster",
    "scene-controls",
    "video-poster",
    "preset-poster",
    "preset-label",
    "picker-selected-badge",
    "media-surface-img",
    "media-surface-content",
    "media-surface-overlay",
    "media-surface-placeholder",
    "media-surface-caption",
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
    // Capture the data-media-source blob when the resolved element is
    // a MediaSurface — lets the right panel surface a "Regenerate this
    // slot" button without having to walk the iframe DOM after the
    // selection lands. Set on MediaSurface's root by the component
    // itself (and by the prepareAppSource injection that handles
    // older `@gradeui/ui` versions). Plain non-DS elements obviously
    // don't have this, so the field stays undefined for them.
    const mediaSourceJson =
      el.getAttribute && el.getAttribute("data-media-source")
        ? el.getAttribute("data-media-source") || undefined
        : undefined;
    // `data-gds-instance-id` is the data-array entry's `id`. Captured
    // here so the right panel can mutate just THAT entry without
    // having to walk the JSX itself to figure out which row of the
    // .map() the user clicked.
    const instanceId =
      el.getAttribute && el.getAttribute("data-gds-instance-id")
        ? el.getAttribute("data-gds-instance-id") || undefined
        : undefined;
    // `data-media-alt` — see SelectionPayload.mediaAlt above. The
    // "Generate image" action consumes this as the description it
    // sends to the resolver, so paid prompt-aware providers can use
    // the designer's intent rather than infer from the source kind.
    const mediaAlt =
      el.getAttribute && el.getAttribute("data-media-alt")
        ? el.getAttribute("data-media-alt") || undefined
        : undefined;
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
      mediaSourceJson,
      instanceId,
      mediaAlt,
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

  // TWO overlays — one tracks hover, one stays glued to the
  // most-recently-clicked element.
  //
  //   - hoverOverlay: bright, with a fade-y background fill. Follows
  //     the mouse pointer; vanishes on mouseout. This is the
  //     "what would I pick if I clicked right now?" affordance.
  //
  //   - selectionOverlay: same primary colour, less fill, slightly
  //     stronger ring. Persists until cleared (Escape, external
  //     `clear()` call, or teardown). This is the "this is what's
  //     currently selected — the right panel reflects it" affordance.
  //
  // The two are stacked: selection sits below hover in z-order so a
  // hover-over-self moment paints the hover indicator without losing
  // the selected ring underneath.
  function makeOverlay(persistent: boolean): HTMLDivElement {
    const el = document.createElement("div");
    el.setAttribute("data-grade-selection-overlay", persistent ? "persist" : "hover");
    // Clean 2px outline; no fill. Two outline-offsets:
    //   - hover: -2px (sits inside the element so a Card's
    //     overflow:hidden corners don't clip it)
    //   - persistent: 0px (sits AT the element boundary — visually
    //     distinct from hover, slightly emphatic without flooding
    //     the surface with a tinted fill that fights with imagery).
    // No box-shadow halo, no background tint — the user complaint
    // ("massive grey fill") was that an 18% primary tint over a
    // muted theme reads as a flood. Outlines alone are enough.
    const baseColor = "oklch(var(--primary, 0.55 0.22 260))";
    el.style.cssText = [
      "position:" + (useFixedPositioning ? "fixed" : "absolute"),
      "pointer-events:none",
      "z-index:" + (persistent ? "2147483646" : "2147483647"),
      `outline:2px solid ${baseColor}`,
      persistent ? "outline-offset:0px" : "outline-offset:-2px",
      "background:transparent",
      "border-radius:4px",
      "transition:left 80ms ease-out, top 80ms ease-out, width 80ms ease-out, height 80ms ease-out",
      "display:none",
    ].join(";");
    return el;
  }

  const hoverOverlay = makeOverlay(false);
  const selectionOverlay = makeOverlay(true);

  // Body may not exist yet on early Sandpack boot; defer append until
  // DOMContentLoaded in that case. Fast mode's host always exists.
  function appendOverlay(el: HTMLDivElement) {
    if (overlayHost && overlayHost.isConnected) {
      overlayHost.appendChild(el);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        if (overlayHost && !el.isConnected) overlayHost.appendChild(el);
      });
    }
  }
  appendOverlay(hoverOverlay);
  appendOverlay(selectionOverlay);

  function positionOverlayOn(overlay: HTMLDivElement, el: Element) {
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

  function hideOverlay(overlay: HTMLDivElement) {
    overlay.style.display = "none";
  }

  let lastHovered: Element | null = null;
  let selectedElement: Element | null = null;

  function onMouseOver(e: MouseEvent) {
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    lastHovered = target;
    positionOverlayOn(hoverOverlay, target);
  }

  function onMouseOut(e: MouseEvent) {
    if (e.target === lastHovered) hideOverlay(hoverOverlay);
  }

  function onClick(e: MouseEvent) {
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    e.preventDefault();
    e.stopPropagation();
    selectedElement = target;
    positionOverlayOn(selectionOverlay, target);
    reportSelected(serialize(target));
  }

  // Keep the persistent ring glued to the selected element when the
  // page reflows. Without these the ring drifts out of position the
  // moment the user scrolls the canvas or resizes the viewport. The
  // capture phase + `true` on scroll catch nested scrollers too — a
  // long album shelf reflowing inside the music app would otherwise
  // strand the ring on stale coordinates.
  function repositionSelection() {
    if (selectedElement) positionOverlayOn(selectionOverlay, selectedElement);
  }
  window.addEventListener("scroll", repositionSelection, true);
  window.addEventListener("resize", repositionSelection);

  // Escape clears the selection (in addition to dropping the hover
  // ring, which the next mouseout would handle anyway). We listen at
  // the document level so the keypress works regardless of where focus
  // currently sits inside the iframe.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && selectedElement) {
      clearSelection();
    }
  }
  document.addEventListener("keydown", onKeyDown);

  function clearSelection() {
    selectedElement = null;
    hideOverlay(selectionOverlay);
    reportCleared?.();
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

  function teardown() {
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
    window.removeEventListener("scroll", repositionSelection, true);
    window.removeEventListener("resize", repositionSelection);
    document.removeEventListener("keydown", onKeyDown);
    cursorHost.style.cursor = prevCursor;
    hoverOverlay.remove();
    selectionOverlay.remove();
    lastHovered = null;
    selectedElement = null;
  }

  return { teardown, clear: clearSelection };
}
