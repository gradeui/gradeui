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

/** One segment of the ancestor chain captured at selection time. The
 *  inspector renders these as a clickable breadcrumb so the user can
 *  walk up the tree without having to bullseye the right pixel for a
 *  deeply-nested Stack/Row. Each segment carries enough metadata to
 *  re-select it: `sourceId` is the address (`data-gds-source-id` on
 *  the rendered element); `componentName` + `tag` drive the label. */
export type SelectionChainSegment = {
  /** Stable JSX-node id (`data-gds-source-id`) — what we send back to
   *  the iframe agent to re-select this ancestor. */
  sourceId: string;
  /** Lowercased DOM tag — `div`, `button`, `h1`, etc. Falls back to
   *  this when `componentName` is absent. */
  tag: string;
  /** PascalCase name derived from `data-gds-part` when the ancestor is
   *  a DS component boundary. Undefined for raw HTML hosts. */
  componentName?: string;
  /** `data-gds-instance-id` when the ancestor is a templated entry
   *  inside a `.map()`. Lets the inspector re-route per-item edits
   *  correctly when the breadcrumb jumps to a specific iteration. */
  instanceId?: string;
  /** User-supplied layer name from `data-gds-name`. Set in the
   *  inspector's Layer Name field. The path bar / breadcrumb prefers
   *  this over `componentName` when present, so "My header" reads
   *  better than "Row" in the trail. */
  name?: string;
};

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
  /** Ancestor chain captured at click time, root → target. Last entry
   *  is the selected element itself. The inspector renders this as a
   *  breadcrumb (`AppShellMain[12] › Stack[34] › Row[35]`) so the user
   *  can jump to any ancestor with one click rather than guessing
   *  pixels. Walk stops at the layout shell — anything above is
   *  Studio chrome the user can't meaningfully select. */
  chain?: SelectionChainSegment[];
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
  /** Stable identifier captured from `data-gds-source-id` at click time.
   *  Lets the inspector mutate the exact JSX node the user clicked when
   *  the same component appears multiple times in source (`.map()`
   *  loops). Undefined when the click landed on a non-DS element. */
  sourceId?: string;
  /** The element's EFFECTIVE computed style for the properties the
   *  inspector's style groups care about. Read off the live DOM node so
   *  the inspector can show a baked-in default (e.g. a Card's `rounded-xl`
   *  / `shadow` that live in the component, not the JSX className) instead
   *  of a blank control. Display-only — the groups still write explicit
   *  Tailwind tokens on change. */
  computedStyle?: ComputedStyleHint;
};

/** Effective computed values for the style properties the inspector
 *  surfaces. Concise, human-readable strings (not a full CSSStyleDeclaration)
 *  so they can ride along in the postMessage payload cheaply. */
export type ComputedStyleHint = {
  /** Border-radius: a single value (`"12px"`) when uniform, else the four
   *  corners (`"12px 12px 8px 8px"`, TL TR BR BL). `"0px"` means none. */
  radius?: string;
  /** Box-shadow as computed (`"none"` when unset, else the resolved rgba
   *  shadow string). */
  boxShadow?: string;
  /** Border shorthand for the top edge (`"1px solid rgb(229 231 235)"`);
   *  width `"0px"` means no border. */
  border?: string;
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

/** One immediate-child descriptor returned by `getChildrenOf`. The
 *  CanvasPathBar renders these in the dropdown for a given segment.
 *  `summary` is the model-emitted `data-gds-summary` when present;
 *  otherwise we synthesise one from the element's first text run
 *  (truncated) so even un-tagged content has a readable label. */
export type ChildDescriptor = {
  sourceId: string;
  tag: string;
  componentName?: string;
  instanceId?: string;
  /** User-supplied layer name from `data-gds-name`. Set via the
   *  Layer Name field in the Selection inspector and persisted into
   *  the JSX. When present, the path bar uses this as the primary
   *  label (falling back to componentName/tag). */
  name?: string;
  /** Optional 3-5 word description. Falls back to a synthesised
   *  preview from the element's first text run when no explicit
   *  summary is set, so even untagged content has a readable
   *  subtitle in the path bar's dropdown. */
  summary?: string;
  /** True when this child has its own children with source-ids —
   *  the bar uses this to decide whether to render a `›` affordance
   *  signalling "you can drill further." */
  hasChildren: boolean;
  /** Nested children when the caller asked for depth > 1. Each
   *  level is a fresh ChildDescriptor[], rendered as an indented
   *  group in the path bar dropdown so users see peers AND a
   *  preview of their subtrees without leaving the popover. */
  children?: ChildDescriptor[];
};

/** Return shape — `teardown` for unmount, `clear` so the canvas can
 *  programmatically dismiss the persistent selection ring (e.g. when
 *  the right-panel chip's × is clicked), `selectBySourceId` so the
 *  parent can re-select a specific ancestor, `getChildrenOf` so the
 *  CanvasPathBar can populate its dropdown columns. */
export interface SelectionAgentHandle {
  teardown: () => void;
  clear: () => void;
  /** Re-run selection on the element with `data-gds-source-id="id"`.
   *  No-op when the element can't be found (likely re-rendered out of
   *  existence since the chain was captured). Returns true on
   *  successful re-selection. */
  selectBySourceId: (id: string) => boolean;
  /** Walk down from `sourceId` (or from the layout-shell root when
   *  `sourceId` is null) and return immediate children that carry
   *  their own `data-gds-source-id`. "Immediate" means the nearest
   *  source-id-bearing descendants — intermediate plumbing tags
   *  (Radix Slots, fragments) are skipped because the user never
   *  needs to navigate to them. When `depth` > 1 each child also
   *  has its own `children` populated, recursively. Default
   *  depth=1 returns just one level. */
  getChildrenOf: (
    sourceId: string | null,
    depth?: number
  ) => ChildDescriptor[];
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

  // Intrinsic tags whose whole purpose is to host editable text. When
  // the user clicks one of these we want selection to LAND on it
  // directly rather than bubbling up to the nearest DS ancestor —
  // otherwise headings nested inside a Card snap to the Card, and the
  // TextEditRow in the inspector hides because the Card's children
  // contain nested JSX. Buttons (DS component) already get the right
  // behavior via data-gds-part; this list covers plain HTML.
  const TEXT_HOST_TAGS = new Set([
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "label",
    "blockquote",
  ]);

  // Tags that are NEVER selected directly — they're leaf media /
  // graphic elements that visually belong to their parent component
  // (a Lucide icon inside a Button, an Avatar image inside a chat
  // bubble). Clicking one walks up to find the parent DS component.
  //
  // Without this exclusion, Lucide icons trip the className-exception
  // path (they carry `class="lucide lucide-save"`) so the inner SVG
  // gets selected instead of the Button wrapping it — and the
  // inspector can't show Button's contract because the SVG has no
  // data-gds-part.
  const NEVER_DIRECT_SELECT_TAGS = new Set([
    "svg",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "g",
    "use",
    "defs",
    "img",
    "picture",
    "source",
    "video",
    "audio",
    "canvas",
    "i",
  ]);

  function resolveSelectionTarget(el: Element | null): Element | null {
    if (!el) return null;
    // Default: walk up to the nearest DS component (data-gds-part)
    // — the long-standing behavior that lets clicks anywhere inside
    // a Card / Button / etc. snap to the component root.
    //
    // Exception 1: a raw HTML element (not a DS component root —
    // doesn't have data-gds-part) that the MODEL gave styling
    // intent to (a non-empty className attribute) is selectable
    // directly. Captures the "interfaces being generated have
    // styled <div>s between DS components" case — those divs
    // hold padding / border / grid layouts the user wants to
    // edit, and snapping up to the DS ancestor would hide them.
    //
    // The class check rules out structurally-meaningless divs
    // (pure semantic wrappers with no styling) — clicking those
    // still bubbles up to the nearest editable DS ancestor, which
    // matches the "I clicked on this card area" intuition.
    //
    // Exception 2: text-host intrinsics (h1-h6, p, label, …) are
    // selectable DIRECTLY regardless of className. Headings rarely
    // carry styling classes ("just <h1>Title</h1>") but the user
    // overwhelmingly wants to edit their text content — walking up
    // to a Card or section ancestor would hide the TextEditRow
    // because the ancestor's children contain nested JSX.
    const hasPart =
      el.hasAttribute && el.hasAttribute("data-gds-part");
    const hasSourceId =
      el.hasAttribute && el.hasAttribute("data-gds-source-id");
    const className = (el.getAttribute?.("class") ?? "").trim();
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    // Leaf-media tags (SVGs, imgs, icons) ALWAYS walk up to find
    // the parent DS component — even when they have their own
    // source-id and className. Without this rule, clicking a
    // Lucide icon inside a Button (icon has class="lucide ..."
    // and a source-id from the JSX injection of `<Save />`) would
    // trip the className exception below and the SVG would be
    // selected directly instead of the Button.
    if (!hasPart && NEVER_DIRECT_SELECT_TAGS.has(tag)) {
      return findComponentOwner(el) ?? el;
    }
    if (!hasPart && hasSourceId && TEXT_HOST_TAGS.has(tag)) {
      return el;
    }
    if (!hasPart && hasSourceId && className.length > 0) {
      return el;
    }
    return findComponentOwner(el) ?? el;
  }

  function serialize(target: Element): SelectionPayload {
    // The caller (`resolveSelectionTarget`) has ALREADY decided which
    // element to serialize — using `target` directly here keeps the
    // selection coherent with that decision. Earlier this function
    // re-walked upward via `findComponentOwner(target)` and used the
    // nearest data-gds-part ancestor instead, which silently overrode
    // deliberate landings on non-DS elements: clicking a Button (no
    // `data-gds-part`) inside a Card walked back up to the Card and
    // returned the Card's sourceId, so the TextEditRow tried to edit
    // the Card's children (nested JSX) and hid itself. Same trap for
    // headings (h1-h6) and raw styled divs.
    const el = target;
    // Component metadata comes from THIS element only. If the user
    // landed on a Button / h1 / styled div that doesn't carry its
    // own data-gds-part, there's no manifest-driven UI to render —
    // and that's correct, the TextEditRow + Spacing group still work
    // off `sourceId` / className.
    const part = el.getAttribute("data-gds-part") || undefined;
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
    // Stable identifier for the JSX opening tag that rendered this
    // element. `data-gds-source-id="N"` is auto-injected on every
    // PascalCase opening tag at `prepareAppSource` time. All rendered
    // iterations of a `.map()` share the same id (one JSX node →
    // many DOM nodes), so the mutator hits the template only once
    // and edits propagate to every iteration — which is the correct
    // behavior for template-wide knobs. Per-item edits still route
    // through `instanceId` (data-array entries).
    const sourceId =
      el.getAttribute && el.getAttribute("data-gds-source-id")
        ? el.getAttribute("data-gds-source-id") || undefined
        : undefined;

    // Ancestor chain — walk from `el` up through every element that
    // carries a `data-gds-source-id`, stopping at the layout shell
    // (AppShell* parts). We BUILD top-down (root → target) so the
    // inspector can render the breadcrumb left-to-right without
    // reversing. The cap (8 levels) keeps the chain readable on
    // dense trees; in practice we stop at the shell long before
    // hitting the cap. The current element is the LAST entry —
    // rendered as a non-clickable badge so the user knows where
    // they are.
    const chain: SelectionChainSegment[] = [];
    let node: Element | null = el;
    const MAX_CHAIN = 8;
    while (node && chain.length < MAX_CHAIN) {
      const nodeSourceId = node.getAttribute
        ? node.getAttribute("data-gds-source-id") || ""
        : "";
      if (nodeSourceId) {
        const nodePart = node.getAttribute
          ? node.getAttribute("data-gds-part") || ""
          : "";
        const nodeInstanceId = node.getAttribute
          ? node.getAttribute("data-gds-instance-id") || ""
          : "";
        const nodeName = node.getAttribute
          ? node.getAttribute("data-gds-name") || ""
          : "";
        chain.unshift({
          sourceId: nodeSourceId,
          tag: node.tagName ? node.tagName.toLowerCase() : "",
          componentName: nodePart ? kebabToPascal(nodePart) : undefined,
          instanceId: nodeInstanceId || undefined,
          name: nodeName || undefined,
        });
        // Stop at the AppShell ROOT — it's the user's topmost wrapper
        // and a valid target (e.g. for a page-wide background fill), so
        // we INCLUDE it as the final crumb, then stop. We must not break
        // on the inner `app-shell-*` parts (header/nav/aside/main/footer)
        // — those sit BELOW the root, so breaking there would drop
        // AppShell from the breadcrumb. Anything above the root
        // (FastSandboxRoot, body, html) is Studio chrome.
        if (nodePart === "app-shell") break;
      }
      node = node.parentElement;
    }

    // Effective computed style for the inspector's style groups. Read off
    // the LIVE element so component-baked defaults (a Card's `rounded-xl`
    // / `shadow` that live inside the component, not the JSX) show up as
    // the current value instead of a blank control. Wrapped in try/catch —
    // getComputedStyle can throw on detached nodes mid-reflow.
    let computedStyle: ComputedStyleHint | undefined;
    try {
      const view = el.ownerDocument?.defaultView;
      if (view && el instanceof view.HTMLElement) {
        const cs = view.getComputedStyle(el);
        const tl = cs.borderTopLeftRadius;
        const tr = cs.borderTopRightRadius;
        const br = cs.borderBottomRightRadius;
        const bl = cs.borderBottomLeftRadius;
        const radius =
          tl === tr && tr === br && br === bl ? tl : `${tl} ${tr} ${br} ${bl}`;
        const border = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
        computedStyle = { radius, boxShadow: cs.boxShadow, border };
      }
    } catch {
      /* detached node — leave computedStyle undefined */
    }

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
      sourceId,
      mediaAlt,
      chain,
      computedStyle,
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
    // Clean 1px outline; no fill. Two outline-offsets:
    //   - hover: -1px (sits inside the element so a Card's
    //     overflow:hidden corners don't clip it)
    //   - persistent: 0px (sits AT the element boundary — visually
    //     distinct from hover, slightly emphatic without flooding
    //     the surface with a tinted fill that fights with imagery).
    // No box-shadow halo, no background tint — the user complaint
    // ("massive grey fill") was that an 18% primary tint over a
    // muted theme reads as a flood. Outlines alone are enough.
    //
    // Colour reads from `--studio-accent` (a theme-independent
    // Studio chrome token) rather than `--primary` — so the
    // selection ring stays consistent when the design's theme is
    // switched. The fallback OKLCH triplet matches the value in
    // globals.css; if the iframe's host page hasn't loaded that
    // stylesheet for any reason (raw Sandpack boot), the fallback
    // keeps the overlay visible.
    const baseColor = "oklch(var(--studio-accent, 0.62 0.18 264))";
    el.style.cssText = [
      "position:" + (useFixedPositioning ? "fixed" : "absolute"),
      "pointer-events:none",
      "z-index:" + (persistent ? "2147483646" : "2147483647"),
      // Thin 1px stroke — Figma/Paper weight. The old 2px read as
      // "fat". `outline` stays off-layout and crisp.
      `outline:1px solid ${baseColor}`,
      persistent ? "outline-offset:0px" : "outline-offset:-1px",
      "background:transparent",
      // Sharp rectangle (no radius) — the selection chrome frames the
      // box regardless of the element's own corner radius.
      "border-radius:0",
      "transition:left 80ms ease-out, top 80ms ease-out, width 80ms ease-out, height 80ms ease-out",
      "display:none",
    ].join(";");

    if (persistent) {
      // Corner handles + a dimension badge — the Figma-style selection
      // chrome. NOTE: these are purely VISUAL. Drag-to-resize isn't
      // wired up, so every piece keeps `pointer-events:none` and never
      // captures a click (no false "you can drag me" affordance beyond
      // the look).
      for (const pos of [
        "top:0;left:0",
        "top:0;left:100%",
        "top:100%;left:100%",
        "top:100%;left:0",
      ]) {
        const handle = document.createElement("div");
        handle.setAttribute("data-grade-handle", "");
        handle.style.cssText = [
          "position:absolute",
          pos,
          "transform:translate(-50%,-50%)",
          "width:7px",
          "height:7px",
          "background:#fff",
          `border:1px solid ${baseColor}`,
          "border-radius:1px",
          "box-shadow:0 0 0 0.5px rgba(255,255,255,.7)",
          "pointer-events:none",
        ].join(";");
        el.appendChild(handle);
      }
      const label = document.createElement("div");
      label.setAttribute("data-grade-dim-label", "");
      label.style.cssText = [
        "position:absolute",
        "top:100%",
        "left:50%",
        "transform:translate(-50%,6px)",
        "background:" + baseColor,
        "color:#fff",
        "font:500 11px/1.35 ui-sans-serif,system-ui,sans-serif",
        "padding:2px 6px",
        "border-radius:4px",
        "white-space:nowrap",
        "pointer-events:none",
      ].join(";");
      el.appendChild(label);
    }
    return el;
  }

  const hoverOverlay = makeOverlay(false);
  const selectionOverlay = makeOverlay(true);

  // Secondary overlays for iterations OTHER than the clicked one
  // that share the same `data-gds-source-id`. Drawn whenever a
  // selection resolves to >1 DOM node (i.e. a `.map()` loop) so
  // the user can see "editing this one will change all of these"
  // before they commit. Pooled — we create up to as many as we
  // need on the fly, then keep them hidden when not in use.
  const siblingOverlays: HTMLDivElement[] = [];
  function makeSiblingOverlay(): HTMLDivElement {
    const el = document.createElement("div");
    el.setAttribute("data-grade-selection-overlay", "sibling");
    // Sibling style: matches the primary ring's stroke weight
    // (2px) but dashed instead of solid, at 60% opacity. Strong
    // enough that the user can see "this edit changes all of
    // these" at a glance, weak enough that the primary still
    // reads as the focused target.
    el.style.cssText = [
      "position:" + (useFixedPositioning ? "fixed" : "absolute"),
      "pointer-events:none",
      "z-index:2147483645",
      "outline:1px dashed oklch(var(--studio-accent, 0.62 0.18 264) / 0.6)",
      "outline-offset:0px",
      "background:transparent",
      "border-radius:4px",
      "transition:left 80ms ease-out, top 80ms ease-out, width 80ms ease-out, height 80ms ease-out, opacity 120ms ease-out",
      "display:none",
    ].join(";");
    return el;
  }
  function ensureSiblingOverlays(n: number) {
    while (siblingOverlays.length < n) {
      const ov = makeSiblingOverlay();
      siblingOverlays.push(ov);
      appendOverlay(ov);
    }
  }
  function positionSiblingOverlays(elements: Element[]) {
    ensureSiblingOverlays(elements.length);
    elements.forEach((el, i) =>
      positionOverlayOn(siblingOverlays[i], el)
    );
    // Hide unused overlays from previous selections.
    for (let i = elements.length; i < siblingOverlays.length; i++) {
      hideOverlay(siblingOverlays[i]);
    }
  }
  function hideAllSiblingOverlays() {
    for (const ov of siblingOverlays) hideOverlay(ov);
  }

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
    // Keep the dimension badge (selection overlay only) in sync with
    // the live size — rounded to whole pixels.
    const dimLabel = overlay.querySelector<HTMLElement>(
      "[data-grade-dim-label]",
    );
    if (dimLabel) {
      dimLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
  }

  function hideOverlay(overlay: HTMLDivElement) {
    overlay.style.display = "none";
  }

  let lastHovered: Element | null = null;
  let selectedElement: Element | null = null;
  // The selected element's `data-gds-source-id` is captured at
  // selection time and used to re-resolve the element after the
  // iframe re-renders (e.g. when a className mutation triggers React
  // to replace the DOM node). Without this, the ResizeObserver
  // fires on the detached old node, getBoundingClientRect returns
  // 0×0, and the overlay collapses to a zero-size point — visually
  // identical to a deselect, which is what the user reported.
  let selectedSourceId: string | null = null;
  // Position within the document-order list of elements that share
  // `selectedSourceId`. Required because a `.map()` loop renders N
  // DOM iterations from ONE source-id, so a bare `querySelector`
  // post-render would land on the first iteration regardless of
  // which one the user originally clicked. The bug the user
  // reported as "ring jumps to first row after editing the third".
  let selectedSiblingIndex: number | null = null;
  // Watches the currently-selected element so the persistent
  // outline keeps up with size changes from inspector-driven
  // className mutations (padding / margin etc.). Created lazily on
  // first selection; replaced on each subsequent selection;
  // disconnected on clear/teardown.
  let selectionResizeObserver: ResizeObserver | null = null;
  function observeSelectedSize(el: Element) {
    selectionResizeObserver?.disconnect();
    selectionResizeObserver = null;
    if (typeof ResizeObserver === "undefined") return;
    selectionResizeObserver = new ResizeObserver(() => {
      // The observed node may have been detached by the time this
      // callback fires — React often replaces nodes on reconcile
      // rather than mutating them in place. Route through
      // refreshSelection so we get the latest live node by
      // sourceId before drawing the overlay.
      refreshSelection();
    });
    selectionResizeObserver.observe(el);
  }
  /**
   * Re-resolve `selectedElement` against the current DOM, then
   * reposition the overlay. Used by the scroll/resize listeners
   * (window-level) and by the per-element ResizeObserver. When the
   * captured element is no longer connected — typical after a
   * className mutation triggers React to swap nodes — we look up
   * the replacement by `data-gds-source-id` and re-attach the
   * observer to it. When no replacement exists (the user deleted
   * the component via chat, say), the selection clears.
   */
  function refreshSelection() {
    if (!selectedElement) return;
    let didReplace = false;
    if (!selectedElement.isConnected) {
      if (selectedSourceId) {
        const all = document.querySelectorAll(
          `[data-gds-source-id="${CSS.escape(selectedSourceId)}"]`
        );
        // Prefer the same sibling-index the user originally
        // clicked. Falls back to the first match when the loop
        // shrunk between re-renders and the index is now out of
        // range — better than clearing the selection mid-edit.
        const replacement =
          (selectedSiblingIndex !== null
            ? all[selectedSiblingIndex]
            : null) ?? all[0];
        if (replacement) {
          selectedElement = replacement;
          observeSelectedSize(replacement);
          didReplace = true;
        } else {
          // Element is genuinely gone — clear so the overlay
          // doesn't strand at the old position.
          clearSelection();
          return;
        }
      } else {
        clearSelection();
        return;
      }
    }
    positionOverlayOn(selectionOverlay, selectedElement);
    // Re-draw the sibling outlines too — re-renders move them as
    // well, and if the loop's length changed we want the overlay
    // count to follow.
    drawSiblingOverlays(selectedElement);
    // When the DOM node was replaced (re-render after a source
    // edit), re-emit the selection so the parent picks up any
    // changed attributes — Layer Name renames, swapped icons,
    // edited text, anything that would change what the chain
    // segments display. Scroll/resize-only refreshes skip this
    // path (didReplace stays false), so we don't spam updates.
    if (didReplace) {
      reportSelected(serialize(selectedElement));
    }
  }

  function drawSiblingOverlays(primary: Element) {
    if (!selectedSourceId) {
      hideAllSiblingOverlays();
      return;
    }
    const doc = primary.ownerDocument ?? document;
    const all = doc.querySelectorAll(
      `[data-gds-source-id="${CSS.escape(selectedSourceId)}"]`
    );
    const siblings: Element[] = [];
    all.forEach((el) => {
      if (el !== primary) siblings.push(el);
    });
    positionSiblingOverlays(siblings);
  }

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

  // Interactive widgets (Radix Select / Dropdown / Popover, native
  // <select>, links, buttons grabbing focus) activate on POINTERDOWN /
  // MOUSEDOWN — which fire BEFORE `click`. If we only intercept click,
  // the menu has already opened by the time we preventDefault, so the
  // user can never grab the component to edit it (it just goes active).
  //
  // The fix: in select mode, swallow pointerdown + mousedown in the
  // CAPTURE phase. A capture listener on the root runs before any
  // listener the component attached deeper in the tree, so
  // `stopImmediatePropagation()` here means Radix's own handler never
  // sees the event and the widget never opens. `preventDefault()` also
  // blocks focus-stealing, which is what let inputs hijack the pick.
  // Selection itself still happens on `click` (which fires regardless —
  // preventing a pointerdown's default does not cancel the click).
  function onSuppressActivation(e: Event) {
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  // Keyboard activation (Space / Enter on a focused trigger) is the other
  // way a widget opens. Swallow those too while select mode is armed.
  function onSuppressKeyActivation(e: KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function onClick(e: MouseEvent) {
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    e.preventDefault();
    // stopImmediatePropagation (not just stopPropagation) so any click
    // handler the component registered on itself can't fire either.
    e.stopImmediatePropagation();
    selectedElement = target;
    // Capture the sourceId so we can re-resolve the element after
    // re-renders. Reads it off the resolved target (which is the
    // closest `data-gds-part` ancestor); the source-id is injected
    // alongside the part attribute on the same DOM node by
    // `injectSourceIds` at `prepareAppSource` time.
    selectedSourceId =
      target.getAttribute && target.getAttribute("data-gds-source-id");
    // Capture this iteration's position among all DOM nodes sharing
    // the same source-id. Used by refreshSelection to land back on
    // the same iteration after re-renders. Lookup via the iframe's
    // own document (which the target lives in).
    if (selectedSourceId) {
      const doc = target.ownerDocument;
      if (doc) {
        const all = doc.querySelectorAll(
          `[data-gds-source-id="${CSS.escape(selectedSourceId)}"]`
        );
        const idx = Array.from(all).indexOf(target);
        selectedSiblingIndex = idx >= 0 ? idx : null;
      }
    } else {
      selectedSiblingIndex = null;
    }
    positionOverlayOn(selectionOverlay, target);
    observeSelectedSize(target);
    // Draw secondary outlines on every OTHER iteration that shares
    // the source-id, so the user can see "this edit will change N
    // of these" before they touch a control.
    drawSiblingOverlays(target);
    reportSelected(serialize(target));
  }

  // Keep the persistent ring glued to the selected element when the
  // page reflows. Without these the ring drifts out of position the
  // moment the user scrolls the canvas or resizes the viewport. The
  // capture phase + `true` on scroll catch nested scrollers too — a
  // long album shelf reflowing inside the music app would otherwise
  // strand the ring on stale coordinates.
  // Scroll + viewport-resize listeners both route through
  // `refreshSelection` (rather than the previous direct
  // `positionOverlayOn`) so any post-render swap is recovered
  // the same way regardless of trigger.
  function repositionSelection() {
    refreshSelection();
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
    selectedSourceId = null;
    selectedSiblingIndex = null;
    selectionResizeObserver?.disconnect();
    selectionResizeObserver = null;
    hideOverlay(selectionOverlay);
    hideAllSiblingOverlays();
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
  // Swallow the activating events BEFORE the widget sees them (capture
  // phase). pointerdown is what Radix triggers open on; mousedown is the
  // native-widget + focus path. keydown covers Space/Enter activation.
  listenerTarget.addEventListener(
    "pointerdown",
    onSuppressActivation as EventListener,
    true
  );
  listenerTarget.addEventListener(
    "mousedown",
    onSuppressActivation as EventListener,
    true
  );
  listenerTarget.addEventListener(
    "keydown",
    onSuppressKeyActivation as EventListener,
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
    listenerTarget.removeEventListener(
      "pointerdown",
      onSuppressActivation as EventListener,
      true
    );
    listenerTarget.removeEventListener(
      "mousedown",
      onSuppressActivation as EventListener,
      true
    );
    listenerTarget.removeEventListener(
      "keydown",
      onSuppressKeyActivation as EventListener,
      true
    );
    window.removeEventListener("scroll", repositionSelection, true);
    window.removeEventListener("resize", repositionSelection);
    document.removeEventListener("keydown", onKeyDown);
    cursorHost.style.cursor = prevCursor;
    hoverOverlay.remove();
    selectionOverlay.remove();
    selectionResizeObserver?.disconnect();
    selectionResizeObserver = null;
    for (const ov of siblingOverlays) ov.remove();
    siblingOverlays.length = 0;
    lastHovered = null;
    selectedElement = null;
    selectedSourceId = null;
    selectedSiblingIndex = null;
  }

  // Programmatic selection — used by the breadcrumb in the inspector.
  // Looks up the element with `data-gds-source-id="id"`, walks up via
  // `resolveSelectionTarget` (which handles the same heuristics as a
  // mouse click — DS-component snap, text-host direct-select, styled
  // div passthrough), runs the standard `serialize` + `reportSelected`
  // path, and pins the persistent ring. Returns false when no element
  // with that id is in the live DOM (likely re-rendered out since the
  // chain was captured).
  function selectBySourceId(id: string): boolean {
    // Query the right scope — Document for Sandpack mode, the wrapper
    // element for fast mode. `CSS.escape` is overkill (source ids are
    // numeric counters) but keeps things robust to future schemes.
    const scope: ParentNode = root instanceof Document ? root : (root as HTMLElement);
    const candidates = scope.querySelectorAll(
      `[data-gds-source-id="${CSS.escape(id)}"]`
    );
    if (candidates.length === 0) return false;
    // Multiple iterations of a `.map()` share one sourceId. The first
    // DOM-order match is the right pick when the user jumps via the
    // breadcrumb — they're saying "select THIS Stack/Row," not "the
    // 3rd iteration of it."
    const raw = candidates[0] as Element;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return false;
    selectedElement = target as HTMLElement;
    selectedSourceId =
      (target.getAttribute && target.getAttribute("data-gds-source-id")) ||
      null;
    selectedSiblingIndex = 0;
    positionOverlayOn(selectionOverlay, target);
    observeSelectedSize(target);
    drawSiblingOverlays(target);
    reportSelected(serialize(target));
    return true;
  }

  // Walk down from a node, collecting the FIRST source-id-bearing
  // descendants along each branch. We skip past intermediate plumbing
  // (fragments, Radix Slots) because the user never needs to land
  // there — they want to land on real components / blocks.
  //
  // When `depth` > 1, each captured child gets its own `children`
  // populated by a recursive call. This powers the path bar's
  // "siblings + N levels deep" dropdown view, where each peer at a
  // given level shows a preview of its own subtree so the user can
  // jump straight to a grandchild without opening multiple
  // dropdowns.
  function collectImmediateChildren(
    root: Element,
    depth: number = 1
  ): ChildDescriptor[] {
    const out: ChildDescriptor[] = [];
    const seen = new Set<string>();
    function walk(node: Element) {
      // Walk children one level at a time. For each child, if it
      // has a source-id, capture it and STOP descending into it
      // here (its `.children` is filled by a fresh recursive call
      // below, not by continuing this walk — keeps the depth
      // budget clean). Otherwise recurse so we punch through
      // plumbing wrappers.
      const kids = node.children;
      for (let i = 0; i < kids.length; i++) {
        const kid = kids[i];
        const id = kid.getAttribute("data-gds-source-id") || "";
        if (id) {
          // Multiple iterations of a `.map()` share a sourceId.
          // Deduplicate so the dropdown shows one entry per JSX
          // node, not N copies — the per-iteration disambiguation
          // belongs to the inspector via instanceId, not here.
          if (seen.has(id)) continue;
          seen.add(id);
          const part = kid.getAttribute("data-gds-part") || "";
          const nameAttr = kid.getAttribute("data-gds-name") || "";
          const summaryAttr = kid.getAttribute("data-gds-summary") || "";
          const instanceId =
            kid.getAttribute("data-gds-instance-id") || undefined;
          // Fallback summary — grab the first text run, normalise
          // whitespace, truncate. Means even pre-summary content
          // (everything the model has already generated) has a
          // readable label in the dropdown.
          const fallback = (() => {
            const text = (kid as HTMLElement).innerText || kid.textContent || "";
            const norm = text.replace(/\s+/g, " ").trim();
            if (!norm) return undefined;
            return norm.length > 40 ? norm.slice(0, 40) + "…" : norm;
          })();
          // hasChildren: any source-id-bearing descendant inside
          // this child. Computed by querySelector for simplicity.
          const hasChildren = !!kid.querySelector("[data-gds-source-id]");
          const descriptor: ChildDescriptor = {
            sourceId: id,
            tag: kid.tagName.toLowerCase(),
            componentName: part ? kebabToPascal(part) : undefined,
            instanceId,
            name: nameAttr || undefined,
            summary: summaryAttr || fallback,
            hasChildren,
          };
          // Recurse for one less level when there's depth left and
          // this child actually has source-id-bearing descendants
          // to show.
          if (depth > 1 && hasChildren) {
            descriptor.children = collectImmediateChildren(kid, depth - 1);
          }
          out.push(descriptor);
        } else {
          // Intermediate non-id node — punch through.
          walk(kid);
        }
      }
    }
    walk(root);
    return out;
  }

  function getChildrenOf(
    id: string | null,
    depth: number = 1
  ): ChildDescriptor[] {
    // Resolve scope. With an id, scope = that element. Without, we
    // pick the layout shell main content if available (so the
    // empty-state bar starts from a meaningful root), falling back
    // to body.
    const docOrEl: ParentNode =
      root instanceof Document ? root : (root as HTMLElement);
    let scope: Element | null = null;
    if (id) {
      scope = docOrEl.querySelector(
        `[data-gds-source-id="${CSS.escape(id)}"]`
      );
    } else {
      // Root the tree at the AppShell ROOT — it's the user's topmost
      // wrapper and a valid target (e.g. a page-wide background fill).
      // Fall back to main content, then any shell part, then body.
      scope =
        docOrEl.querySelector('[data-gds-part="app-shell"]') ||
        docOrEl.querySelector('[data-gds-part="app-shell-main"]') ||
        docOrEl.querySelector('[data-gds-part^="app-shell"]') ||
        (root instanceof Document ? root.body : (root as Element));
    }
    if (!scope) return [];
    return collectImmediateChildren(scope, Math.max(1, depth));
  }

  return { teardown, clear: clearSelection, selectBySourceId, getChildrenOf };
}
