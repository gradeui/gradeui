"use client";

/**
 * Project preview CSS — the per-project stylesheet override channel.
 *
 * `.css` files in the project's Rules screen (rulesFiles whose name ends
 * in ".css", enabled) don't ride the PROMPT like .md rules do — they
 * ride the PREVIEW: injected as the last <style> in every renderer
 * iframe so project-level overrides win the cascade. The motivating
 * case (BrightLocal pilot): `--sidebar-width: 224px` in the client DS
 * truncates sidebar labels and we can't edit their package — a project
 * `custom.css` with `:root { --sidebar-width: 280px; }` patches it, and
 * the file doubles as the log of what the client DS needs fixing.
 *
 * Same architecture as lib/active-registry.ts (and for the same reason):
 * state on `globalThis` so dev-mode HMR can't reset it, subscribable so
 * the frame hosts re-post when the CSS changes. The studio page is the
 * only writer (setProjectPreviewCss on project load / rules edit); the
 * FastIframeHost + ExternalDsFrameHost are the readers.
 */

import { useSyncExternalStore } from "react";

interface PreviewCssStore {
  css: string;
  listeners: Set<() => void>;
}

const g = globalThis as typeof globalThis & {
  __gradeProjectPreviewCss?: PreviewCssStore;
};
const store: PreviewCssStore = (g.__gradeProjectPreviewCss ??= {
  css: "",
  listeners: new Set(),
});

/** Replace the active project's preview CSS (all enabled .css rules
 *  files, concatenated). Empty string = no overrides. Notifies only on
 *  change. */
export function setProjectPreviewCss(css: string): void {
  const next = css ?? "";
  if (next === store.css) return;
  store.css = next;
  for (const l of store.listeners) l();
}

export function getProjectPreviewCss(): string {
  return store.css;
}

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

/** The active project's preview CSS, reactively. */
export function useProjectPreviewCss(): string {
  return useSyncExternalStore(subscribe, getProjectPreviewCss, () => "");
}
