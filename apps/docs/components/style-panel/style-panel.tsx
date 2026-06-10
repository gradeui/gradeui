"use client";

/**
 * StylePanel — the portable, CONTRACT-BASED style editor.
 *
 * One component, any host. The panel edits a `ThemeInput` (the portable
 * theme contract from STUDIO-THEMES — deterministic: persisting the input
 * reproduces the theme exactly) and knows nothing about where it's mounted
 * or where the result is stored. The host decides both:
 *
 *   - Right-panel Settings tab → `bindTo="draft"`, onSave persists the
 *     project theme draft (the existing theme-draft-persister flow).
 *   - Header popover nudging the live site theme → `bindTo="site"`.
 *   - Per-SCREEN override popover → `bindTo="draft"`, onSave writes a
 *     screen-scoped ThemeVariant; the host pipes `useGeneratedTheme()`
 *     CSS vars into that screen's preview frame only.
 *   - A docs page demo → `bindTo="scoped"` with a <ThemeBuilderScope>
 *     wrapping the demo subtree.
 *
 * Composition over configuration: this wraps the theme-builder primitives
 * (provider + header + controls + footer) rather than re-implementing
 * them. Sections (mode / colour / typography / shape / components) toggle
 * per host so a popover can ship a cut-down panel.
 *
 * Agnostic but personalised (STUDIO-BYODS.md "The style panel"): the
 * contract this panel edits stays generic; every brand-specific thing —
 * ramp choices, hue, fonts, modular scale ratio — is data inside the
 * ThemeInput, never component code.
 */

import * as React from "react";
import type { GeneratedTheme, ThemeInput } from "@/lib/themes";
import { cn } from "@/lib/utils";
import {
  ThemeBuilderProvider,
  ThemeBuilderHeader,
  ThemeBuilderControls,
  ThemeBuilderFooter,
  useMaybeThemeBuilder,
  type ThemeBuilderBindTo,
  type ThemeBuilderControlsProps,
} from "@/components/theme-builder";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export interface StylePanelProps {
  /** Seed contract. The provider clones it — the host's object is safe.
   *  OPTIONAL when an ambient ThemeBuilderProvider is already in scope
   *  (e.g. Studio's page-level provider): the panel then attaches to it
   *  and `initial` / `bindTo` / `onSave` are ignored. Required when the
   *  panel stands alone (a popover on a marketing page, a docs demo). */
  initial?: ThemeInput;
  /** Where edits land: "site" (live :root), "draft" (host consumes
   *  useGeneratedTheme / onSave), "scoped" (a ThemeBuilderScope subtree).
   *  Default "draft" — the portable, host-decides mode. */
  bindTo?: ThemeBuilderBindTo;
  /** Fired by the footer's save. Return a ThemeInput to re-anchor
   *  dirty-tracking (e.g. after stamping a new id). */
  onSave?: (input: ThemeInput, generated: GeneratedTheme) => ThemeInput | void;
  /** Section visibility — pass through to ThemeBuilderControls. */
  sections?: ThemeBuilderControlsProps["sections"];
  /** Hide the light/dark mode row (hosts with their own toggle). */
  hideMode?: boolean;
  /** Hide the header / footer chrome for tight embeds. */
  hideHeader?: boolean;
  hideFooter?: boolean;
  className?: string;
}

function StylePanelStack({
  sections,
  hideMode,
  hideHeader,
  hideFooter,
  className,
}: Omit<StylePanelProps, "initial" | "bindTo" | "onSave">) {
  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 bg-background overflow-hidden",
        className
      )}
    >
      {!hideHeader && <ThemeBuilderHeader />}
      <ThemeBuilderControls hideMode={hideMode} sections={sections} />
      {!hideFooter && <ThemeBuilderFooter />}
    </div>
  );
}

export function StylePanel({
  initial,
  bindTo = "draft",
  onSave,
  ...stack
}: StylePanelProps) {
  // Provider-inheriting: if a ThemeBuilderProvider is already in scope
  // (Studio's page-level one), attach to it — creating a second provider
  // would fork the edit state away from the canvas + persister.
  const ambient = useMaybeThemeBuilder();
  if (ambient) {
    return <StylePanelStack {...stack} />;
  }
  if (!initial) {
    throw new Error(
      "StylePanel: pass `initial` (a ThemeInput) when no ThemeBuilderProvider is in scope."
    );
  }
  return (
    <ThemeBuilderProvider initial={initial} bindTo={bindTo} onSave={onSave}>
      <StylePanelStack {...stack} />
    </ThemeBuilderProvider>
  );
}

export interface StylePanelPopoverProps extends StylePanelProps {
  /** The element that opens the popover (rendered asChild). */
  trigger: React.ReactNode;
  /** Popover side/align passthrough. */
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Content size. The default suits a screen-override popover. */
  contentClassName?: string;
}

/**
 * StylePanelPopover — the same panel in a popover, for one-off hosts:
 * "override the style of THIS screen" from a canvas toolbar, a quick
 * hue-and-fonts tweak from a share view, etc. The inner scroller carries
 * data-lenis-prevent via ThemeBuilderControls, so it scrolls fine on
 * Lenis-smoothed pages like /studio.
 */
export function StylePanelPopover({
  trigger,
  side = "bottom",
  align = "end",
  contentClassName,
  ...panel
}: StylePanelPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn("w-[340px] p-0 overflow-hidden", contentClassName)}
      >
        <StylePanel
          {...panel}
          className={cn("h-[480px] border-0 rounded-none", panel.className)}
        />
      </PopoverContent>
    </Popover>
  );
}
