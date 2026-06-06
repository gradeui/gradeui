/**
 * createScreenContext — the request-shaping half of the core lib.
 *
 * Serializes "the vocabulary that travels with each request": the base
 * OUTPUT RULES, the retrieval-narrowed component reference block, the
 * optional EDIT MODE stanza, and an optional targeted-edit selection
 * stanza — stitched into the single `system` string a model is handed.
 *
 * This is the transport-agnostic version of the stitching that used to
 * live inline in `apps/docs/app/api/chat/route.ts`. Both adapters now call
 * it so the demo surface (MCP) can't drift from what ships (product
 * runtime):
 *
 *   - MCP server adapter: tool args → createScreenContext → return payload.
 *   - Product runtime: same call, wrapped in the streaming generation step.
 *
 * It makes NO model calls and touches no I/O — pure string assembly over
 * the playbook. Stateless by design: it knows nothing about users,
 * projects, or where a generated screen gets saved. Persistence is an
 * adapter/runtime concern (see STUDIO-PERSISTENCE.md / STUDIO-STORAGE.md),
 * deliberately kept out of the contract core.
 */

import {
  buildSystemPrompt,
  EDIT_MODE_PROMPT,
  renderComponentRefsBlock,
  relevantComponentNames,
  ALLOWED_COMPONENTS,
  PINNED_COMPONENTS,
} from "../playbook";

// Fast-path membership check to filter ref matches down to the Studio-exposed
// allowlist. Built once at module load because the allowlist is static.
// Example: a sidecar may alias "animation"/"lottie", so a prompt mentioning
// "animation" pulls in that component's ref — but if it isn't in
// ALLOWED_COMPONENTS the model can't emit it, so we drop the hint.
const ALLOWED_COMPONENT_SET = new Set<string>(
  ALLOWED_COMPONENTS.map((n) => n.toLowerCase()),
);

/**
 * Element the user pointed at in the preview via the Select tool. The
 * iframe agent ships this shape back on click; we glue a targeted-edit
 * stanza onto the system prompt so the model knows what to modify.
 *
 * Wire-compatible with the `RequestSelection` body shape in the docs chat
 * route and `StudioSelection` in the playground helpers.
 */
export interface ScreenSelection {
  tag?: string;
  text?: string;
  outerHTML?: string;
  rect?: { x: number; y: number; width: number; height: number };
  /** data-gds-part value of the nearest DS component ancestor, when the
   *  click landed inside one. Takes priority over `tag` for the model. */
  part?: string;
  /** PascalCase component identifier derived from `part`. */
  componentName?: string;
}

export interface ScreenContextOptions {
  /** Override the base system prompt. Defaults to `buildSystemPrompt()`.
   *  The product runtime passes the client-supplied prompt here (which may
   *  already carry the EDIT MODE stanza) to preserve existing behaviour;
   *  the MCP adapter leaves it unset and lets the core build it. */
  basePrompt?: string;
  /** Append the EDIT MODE stanza (anchored SEARCH/REPLACE edit blocks).
   *  Default false. Leave false when `basePrompt` already includes it. */
  editMode?: boolean;
  /** Targeted-edit selection from the Studio Select tool. */
  selection?: ScreenSelection | null;
  /** Attach the component-reference block. Default true. Callers on
   *  non-design surfaces can pass false to ship the rules alone. */
  includeComponentRefs?: boolean;
  /** Extra component names to force into the refs block beyond what
   *  retrieval + pinning surface (e.g. the components already imported by
   *  the screen being iterated on). Filtered to the allowlist. */
  pin?: readonly string[];
  /** Refs rendering fidelity. "full" (default) ships each ref's worked
   *  example + anti-patterns; "compact" ships only the API header lines.
   *  Transport-budgeted adapters (MCP) fall back to compact when the
   *  full payload would exceed the host's tool-result limit. */
  refsStyle?: "full" | "compact";
}

export interface ScreenContext {
  /** The fully-stitched system prompt to hand the model. */
  system: string;
  /** Component names whose refs were folded in — for the transparency
   *  chip the chat UI shows next to each turn, and the MCP adapter's
   *  response metadata. */
  refs: string[];
}

/**
 * Build the per-request screen-generation context from a brief.
 *
 * `brief` is the natural-language ask. On a fresh build it's the user's
 * prompt; on iteration pass the running conversation text (so refs follow
 * the current component's imports, not just the latest sentence).
 *
 *   const { system, refs } = createScreenContext(userPrompt);
 *   // hand `system` to the model as the system prompt.
 */
export function createScreenContext(
  brief: string,
  options: ScreenContextOptions = {},
): ScreenContext {
  const {
    basePrompt,
    editMode = false,
    selection = null,
    includeComponentRefs = true,
    pin = [],
    refsStyle = "full",
  } = options;

  const base = basePrompt ?? buildSystemPrompt();
  const editStanza = editMode ? EDIT_MODE_PROMPT : "";

  const allowed = (n: string) => ALLOWED_COMPONENT_SET.has(n.toLowerCase());

  // Pin layout primitives up front (order matters — the model reads
  // top-down, so structural choices arrive before component-specific refs),
  // then retrieval hits, then any caller-forced names. Dedupe, allowlist.
  const refs = includeComponentRefs
    ? Array.from(
        new Set([
          ...PINNED_COMPONENTS.filter(allowed),
          ...relevantComponentNames(brief).filter(allowed),
          ...pin.filter(allowed),
        ]),
      )
    : [];

  const refsBlock = refs.length > 0
    ? renderComponentRefsBlock({ onlyFor: refs, style: refsStyle })
    : "";

  const selectionBlock = renderSelectionBlock(selection);

  const system = [base, editStanza, refsBlock, selectionBlock]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join("\n\n");

  return { system, refs };
}

/**
 * Build the "TARGETED EDIT" system-prompt stanza for a user-picked element.
 *
 * Putting the outerHTML in the SYSTEM slot means it isn't replayed on every
 * follow-up turn — each request only sees the selection that matters for
 * this send. The stanza speaks in imperatives the model will obey ("locate
 * the element below in the current JSX"); burying the same info in a user
 * message produces fuzzier results in practice.
 *
 * Returns "" when there's no actionable selection.
 */
export function renderSelectionBlock(
  sel: ScreenSelection | null | undefined,
): string {
  if (!sel || typeof sel !== "object") return "";
  const tag = (sel.tag || "").toString().slice(0, 30);
  const text = (sel.text || "").toString().slice(0, 120);
  const outer = (sel.outerHTML || "").toString().slice(0, 500);
  const componentName = (sel.componentName || "").toString().slice(0, 60);
  const part = (sel.part || "").toString().slice(0, 60);
  if (!tag && !outer && !componentName) return "";

  // When the selection resolved to a DS component boundary, lead with the
  // component identifier — that's the most actionable hint we can give the
  // model ("edit <ThreeScene>") and it maps 1:1 to a JSX node.
  const header = componentName
    ? `TARGETED EDIT — the user is pointing at a <${componentName}> component in the current preview.`
    : "TARGETED EDIT — the user is pointing at a specific element in the current preview.";

  const instruction = componentName
    ? `Interpret the user's request AS AN EDIT TO THE <${componentName}> INSTANCE above. Find the matching <${componentName} ... /> JSX node in the current code and modify its props (or children) in place. Do not rewrite unrelated components in the composition. Still follow the OUTPUT RULES — regenerate the full component inside a single \`\`\`jsx fence; the targeted change is WHAT to modify, not HOW to format the response.`
    : "Interpret the user's request AS AN EDIT TO THIS ELEMENT specifically. Locate it inside the current JSX (by tag, text content, classes, and surrounding context) and modify it in place. Do not rewrite unrelated parts of the component. Still follow the OUTPUT RULES — regenerate the full component inside a single ```jsx fence; the targeted change is WHAT to modify, not HOW to format the response.";

  return [
    header,
    componentName ? `Component: <${componentName}>` : null,
    part ? `data-gds-part: "${part}"` : null,
    `Element tag: <${tag}>`,
    text ? `Element text: "${text}"` : null,
    outer ? `Element outerHTML (truncated):\n\`\`\`html\n${outer}\n\`\`\`` : null,
    "",
    instruction,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}
