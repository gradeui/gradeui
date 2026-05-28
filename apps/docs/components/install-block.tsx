"use client";

/**
 * InstallBlock — the canonical install-snippet chrome on every
 * component docs page (`import { X } from "@gradeui/ui"`).
 *
 * Wraps the shared `<Code>` primitive so docs install snippets pick up
 * the same `--gds-code-*` palette as Studio's Source panel + marketing
 * heroes + the playground showcase. Previously a hand-rolled
 * `<pre>` against `bg-gds-gray-{100,800}` which produced a flat grey
 * block with no syntax highlighting — readers couldn't see at a glance
 * that they were looking at a TypeScript import vs a CSS import vs a
 * shell command.
 *
 * Usage:
 *
 *   <InstallBlock>{`import { Badge } from "@gradeui/ui"`}</InstallBlock>
 *
 *   <InstallBlock>{`import {
 *     Dialog,
 *     DialogContent,
 *     DialogHeader,
 *   } from "@gradeui/ui"`}</InstallBlock>
 *
 * Single source of truth for the chrome — restyle here and every docs
 * page moves together.
 */

import * as React from "react";
import { Code } from "@/components/ui/code";

interface InstallBlockProps {
  /** Import string (or any other install-related snippet). */
  children: string;
  /** Override the language — defaults to `tsx` for imports. */
  language?: "tsx" | "ts" | "bash" | "json";
}

export function InstallBlock({ children, language = "tsx" }: InstallBlockProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Code
        source={children}
        language={language}
        bare
        className="p-4 text-sm"
      />
    </div>
  );
}
