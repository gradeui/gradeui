"use client";

/**
 * ThemeBuilderScope — applies the builder's working theme as CSS custom
 * properties to a subtree.
 *
 * Pair this with `bindTo="scoped"` to preview theme edits only inside a
 * specific region without touching :root. Under the hood it writes the
 * output of `themeToCSSVars()` into the wrapper div's inline style, so
 * every component rendered inside reads the *working* palette instead of
 * the site-wide one.
 *
 *   <ThemeBuilderProvider initial={input} bindTo="scoped">
 *     <ThemeBuilderControls />
 *     <ThemeBuilderScope className="rounded border p-6">
 *       <MyPreviewContent />
 *     </ThemeBuilderScope>
 *   </ThemeBuilderProvider>
 *
 * The scope also applies the `.dark` class + `data-*` component-shape
 * attributes used by the semantic token layer, so components that key
 * off `data-button-shape="pill"` / `html.dark` behave correctly inside
 * the wrapper just as they do at :root.
 *
 * In "site" or "draft" modes the wrapper is a noop — it still renders
 * the children, but doesn't set any vars (site mode already applies at
 * :root; draft mode doesn't apply at all). This keeps the component
 * idempotent regardless of bindTo, so hosts can keep it in the tree
 * without branching on the mode.
 */

import * as React from "react";
import { themeToCSSVars, injectFontFaces } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { useThemeBuilder } from "./theme-builder-provider";

export interface ThemeBuilderScopeProps {
  children: React.ReactNode;
  className?: string;
  /** Underlying element. Default "div". Escape hatch for cases where the
   *  host wants a section / article / main wrapper for semantics. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Extra CSS vars or styles to merge onto the wrapper. Ours win for
   *  theme-generated vars; anything else the caller passes is preserved. */
  style?: React.CSSProperties;
}

export function ThemeBuilderScope({
  children,
  className,
  as = "div",
  style,
}: ThemeBuilderScopeProps) {
  const { generated, mode, bindTo } = useThemeBuilder();

  // Custom uploaded faces — @font-face can't live in inline style, so
  // scoped previews upsert the document-level tag. Faces are keyed by
  // family name, so this can't restyle anything outside the scope: only
  // elements whose font-family var names the custom family resolve it.
  const fontFaces = generated.typography.fontFaces;
  React.useEffect(() => {
    if (bindTo !== "scoped") return;
    injectFontFaces(fontFaces);
  }, [bindTo, fontFaces]);

  // In site + draft modes, short-circuit — the wrapper is transparent. No
  // style merging, no extra DOM cost. Still renders children so it can
  // sit in the tree safely.
  if (bindTo !== "scoped") {
    const Tag = as as React.ElementType;
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  // Flatten the generator output into a style object. themeToCSSVars
  // already returns the exact { "--background": "…", … } map we need;
  // React passes through CSS custom properties when they're cast to
  // CSSProperties-with-index-signature.
  const vars = themeToCSSVars(generated, mode) as React.CSSProperties;
  const mergedStyle: React.CSSProperties = { ...vars, ...style };

  // The `.dark` class + data-* attributes are applied at the scope root
  // so Tailwind's dark: variants and our component-shape CSS keys target
  // the subtree independently from the site's :root state.
  const isDark = mode === "dark";
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={cn(isDark && "dark", className)}
      style={mergedStyle}
      data-mode={mode}
      data-grade-theme={generated.id}
      data-button-shape={generated.components.buttonShape ?? "default"}
      data-input-style={generated.components.inputStyle ?? "outlined"}
      data-card-style={generated.components.cardStyle ?? "flat"}
    >
      {children}
    </Tag>
  );
}
