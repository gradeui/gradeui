"use client";

/**
 * SourceEditor — editable code view for Studio, on CodeMirror 6.
 *
 * Edits the screen's RAW `appSource` (not the prepared projection shown in
 * the read-only payload panel) and writes back through the same
 * `onSourceMutation` channel chat + Fill use, so an edit is just another
 * source mutation: Fast Frame recompiles, it lands in the undo history, it
 * persists. Writes are debounced so we recompile on a pause, not every
 * keystroke; a broken intermediate just shows Fast Frame's failure panel.
 *
 * Install (apps/docs): pnpm add @uiw/react-codemirror @codemirror/lang-javascript
 */

import * as React from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;

// Editor chrome mapped onto Grade tokens so it matches the design system in
// both modes (the host `.dark` class flips the CSS variables).
const gradeChrome = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "13px",
    height: "100%",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--muted-foreground)",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--muted) 45%, transparent)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--primary) 22%, transparent)",
  },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    // The scroll boundary — must own overflow so long files scroll
    // *inside* the editor rather than growing the flex column.
    overflow: "auto",
    fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, monospace)",
    lineHeight: "1.6",
  },
});

export function SourceEditor({
  value,
  mode,
  onSourceEdit,
}: {
  /** Current raw appSource. */
  value: string;
  mode: "light" | "dark";
  /** Same signature as onSourceMutation — debounced edits flow here. */
  onSourceEdit?: (next: string, label?: string) => void;
}) {
  const [doc, setDoc] = React.useState(value);
  // What we last sent upward — lets us tell our own echo (the parent
  // re-rendering with the value we just emitted) apart from a genuine
  // external change (chat, undo/redo, Fill), so we don't reset mid-type.
  const lastEmittedRef = React.useRef(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (value !== doc && value !== lastEmittedRef.current) {
      setDoc(value);
      lastEmittedRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleChange = React.useCallback(
    (next: string) => {
      setDoc(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastEmittedRef.current = next;
        onSourceEdit?.(next, "Edit code");
      }, DEBOUNCE_MS);
    },
    [onSourceEdit],
  );

  // Absolute-fill inside a relative box: this pins the editor to the
  // parent's height so the `.cm-scroller` has a definite height to scroll
  // within. Setting `height="100%"` alone isn't enough when the parent is a
  // flex child — the editor would grow to content and the column would
  // scroll instead of the editor.
  return (
    <div
      // Lenis (the Studio page's smooth-scroll) otherwise eats trackpad /
      // wheel deltas before they reach CodeMirror's scroller — the same
      // reason the read-only CodeView carries this marker. overscroll-
      // contain stops a long scroll rubber-banding into the canvas.
      data-lenis-prevent
      className={cn(
        "relative h-full w-full overflow-hidden overscroll-contain",
        mode === "dark" && "dark",
      )}
    >
      <CodeMirror
        value={doc}
        onChange={handleChange}
        theme={mode === "dark" ? "dark" : "light"}
        extensions={[javascript({ jsx: true, typescript: true }), gradeChrome]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          autocompletion: false,
          highlightActiveLineGutter: true,
        }}
        height="100%"
        className="absolute inset-0"
      />
    </div>
  );
}
