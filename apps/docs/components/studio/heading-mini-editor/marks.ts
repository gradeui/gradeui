import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * Accent — the headline FONT mark. Toggling it on a selection wraps that
 * text in `<span class="font-accent">…</span>`. It only swaps the font
 * (the accent role we wired into the theme, `--font-accent` via the
 * `font-accent` utility) — it does NOT imply italic. Italic is a separate
 * mark, so "your rules" can be accent, italic, or both, independently.
 *
 * parseHTML matches `span.font-accent` so loading a heading that already
 * carries an accent span re-hydrates it as a mark (round-trip safe). The
 * serializer (serialize.ts) emits the JSX form with `className`.
 */
export const Accent = Mark.create({
  name: "accent",

  parseHTML() {
    return [{ tag: "span.font-accent" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "font-accent" }),
      0,
    ];
  },
});
