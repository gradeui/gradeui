"use client";

/**
 * HeadingMiniEditor — a small rich-text field for a single heading, so a
 * user can select part of the text and apply an Accent (or bold / italic)
 * span without touching code. It replaces the plain text box, which can
 * only express a flat string and clobbers any inline spans.
 *
 * Built on TipTap (already a dependency). It's inline-only (one line, no
 * blocks/lists), shows a BubbleMenu on selection, and emits a JSX inner
 * string on every change via `onChange` — that string is what gets spliced
 * back into the heading in the screen source (the Walker gives the node's
 * range; wiring that is the integration step after this spike).
 *
 *   <h1>{value as rich JSX}</h1>
 *   "Your AI, " + <span className="font-accent italic">your rules</span>
 *
 * Install (apps/docs): the @tiptap/* packages are already in package.json;
 * this adds @tiptap/core for the custom mark.
 */

import * as React from "react";
import { useEditor, EditorContent, BubbleMenu, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { cn } from "@/lib/utils";
import { Accent } from "./marks";
import { inlineDocToJsx, jsxToEditorHtml, type PMNode } from "./serialize";

type MarkName = "accent" | "bold" | "italic";

const MARK_LABELS: { name: MarkName; label: string }[] = [
  { name: "accent", label: "Accent" },
  { name: "bold", label: "Bold" },
  { name: "italic", label: "Italic" },
];

function MarkButton({
  editor,
  name,
  label,
}: {
  editor: Editor;
  name: MarkName;
  label: string;
}) {
  const active = editor.isActive(name);
  return (
    <button
      type="button"
      // Prevent the bubble menu stealing the selection on mousedown.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => editor.chain().focus().toggleMark(name).run()}
      aria-pressed={active}
      className={cn(
        "rounded px-2 py-1 text-2xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function HeadingMiniEditor({
  value,
  onChange,
  className,
  ariaLabel = "Heading text",
  debounceMs = 250,
}: {
  /** The heading's inner content as a JSX string (may contain spans). */
  value: string;
  /** Fires on every edit with the new JSX inner string. */
  onChange: (jsx: string) => void;
  className?: string;
  ariaLabel?: string;
  /** Debounce before emitting (ms). Keeps the canvas recompiling on a
   *  typing pause, not every keystroke. Blur flushes immediately. */
  debounceMs?: number;
}) {
  // Latest onChange in a ref so the debounced flush never goes stale.
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  const emit = (jsx: string, immediate = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (immediate) {
      timerRef.current = null;
      onChangeRef.current(jsx);
      return;
    }
    timerRef.current = setTimeout(() => onChangeRef.current(jsx), debounceMs);
  };

  const editor = useEditor({
    // SSR-safe (Next.js): don't render on the server, hydrate on mount.
    immediatelyRender: false,
    extensions: [
      // Inline heading: keep marks + a single paragraph, drop every block
      // affordance so the field stays one line and can't grow structure.
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Accent,
    ],
    content: jsxToEditorHtml(value),
    editorProps: {
      attributes: { "aria-label": ariaLabel, class: "outline-none" },
      // Single line: swallow Enter so the user can't create new blocks.
      handleKeyDown(_view, event) {
        if (event.key === "Enter") return true;
        return false;
      },
    },
    onUpdate({ editor }) {
      emit(inlineDocToJsx(editor.getJSON() as PMNode));
    },
    onBlur({ editor }) {
      // Done editing — flush any pending debounce immediately.
      emit(inlineDocToJsx(editor.getJSON() as PMNode), true);
    },
  });

  if (!editor) return null;

  return (
    <div className={cn("text-foreground", className)}>
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-popover p-0.5 shadow-md">
          {MARK_LABELS.map((m) => (
            <MarkButton key={m.name} editor={editor} name={m.name} label={m.label} />
          ))}
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
