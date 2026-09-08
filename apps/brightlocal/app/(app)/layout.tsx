"use client";

import { useDemo } from "@/lib/demo";

/**
 * The product area. Every promoted screen carries its own shell (the
 * proposal module's AppLayoutShell), so this layout only keys the
 * subtree on the demo epoch: changing persona or look remounts the
 * screen, and its shell re-reads the dataset and look seams.
 */
export default function AppAreaLayout({ children }: { children: React.ReactNode }) {
  const { epoch } = useDemo();
  return <div key={epoch}>{children}</div>;
}
