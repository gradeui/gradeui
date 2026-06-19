/**
 * Serialize a TipTap / ProseMirror inline document to a JSX inner string,
 * and parse a JSX inner string back to HTML TipTap can load. This is the
 * seam between the rich-text editor (HTML / PM-JSON) and Studio's screens
 * (a JSX SOURCE STRING): a heading's inner content round-trips as
 *
 *     Your AI, <span className="font-accent italic">your rules</span>
 *
 * Pure + deterministic on purpose — it's unit-tested without a browser or a
 * live editor (feed it editor.getJSON()).
 */

export interface PMMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface PMNode {
  type: string;
  text?: string;
  marks?: PMMark[];
  content?: PMNode[];
}

/** Each supported mark maps to a JSX tag pair. Accent is the headline act
 *  (the styled-span pattern); bold/italic are the usual companions. Kept as
 *  data so adding a mark (highlight, link, a colour span) is one entry. */
export const MARK_TAGS: Record<string, { open: string; close: string }> = {
  // Accent swaps the FONT only — italic is a separate mark, never implied.
  accent: { open: '<span className="font-accent">', close: "</span>" },
  bold: { open: "<strong>", close: "</strong>" },
  italic: { open: "<em>", close: "</em>" },
};

/** Escape the characters that are special inside JSX *text* so a heading
 *  like `A < B` or `{x}` can't break the emitted source. `&` first so the
 *  entities we introduce aren't re-escaped. */
export function escapeJsxText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}

/** One text node → its escaped text wrapped in its marks (innermost first,
 *  i.e. the order TipTap stores them). Unknown marks are skipped, never
 *  emitted raw. */
function serializeTextNode(node: PMNode): string {
  let out = escapeJsxText(node.text ?? "");
  for (const mark of node.marks ?? []) {
    const tag = MARK_TAGS[mark.type];
    if (tag) out = tag.open + out + tag.close;
  }
  return out;
}

/** doc → the first block's inline content → a JSX inner string. The editor
 *  is single-block (a heading), so we only read content[0]. */
export function inlineDocToJsx(doc: PMNode): string {
  const block = doc.content?.[0];
  const inline = block?.content ?? [];
  return inline.map(serializeTextNode).join("");
}

/** A heading's stored JSX inner string → HTML TipTap can parse as initial
 *  content. The only JSX-vs-HTML difference inside a heading is
 *  `className` → `class`; the Accent mark's parseHTML matches
 *  `span.font-accent`, so an existing accent span re-hydrates as a mark.
 *  (Entities like &amp; pass through unchanged.) */
export function jsxToEditorHtml(jsx: string): string {
  const inner = jsx.replace(/\bclassName=/g, "class=");
  return `<p>${inner}</p>`;
}
