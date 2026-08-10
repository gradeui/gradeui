"use client";

/**
 * TokenMapSection: the semantic token to ramp-step mapping editor
 * (Ali, 8 Aug: "these allocated tokens should actually map to neutral
 * ramps, primary ramps; at the minute it is all raw lch colors").
 *
 * Every semantic token renders as a row: resolved swatch, sentence-case
 * name, and a mapping chip ("neutral 500"). The chip opens a picker of
 * the theme's three generated ramps plus pure white/black. Picks write
 * ThemeInput.tokenOverrides[mode][token] through the provider's patch,
 * so they ride the same history / dirty-tracking / save flow as every
 * other panel edit, persist inside the portable ThemeInput contract,
 * and re-resolve live when the hues change (the override stores the
 * STEP, not the colour). Reset removes the override and returns the
 * token to the mode map's tuned default.
 */

import * as React from "react";
import {
  tokenRefsForMode,
  type SemanticTokenKey,
  type ThemeTokenRef,
} from "@/lib/themes";
import { RAMP_KEYS } from "@/lib/themes/oklch";
import { useThemeBuilder } from "./theme-builder-provider";
import { Section } from "./theme-builder-primitives";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

/** Sentence-case display names, grouped the way a designer scans them. */
const GROUPS: { label: string; keys: SemanticTokenKey[] }[] = [
  {
    label: "Surfaces",
    keys: ["background", "card", "popover", "muted", "secondary", "border", "input"],
  },
  {
    label: "Text",
    keys: [
      "foreground",
      "cardForeground",
      "popoverForeground",
      "secondaryForeground",
      "mutedForeground",
      "superMutedForeground",
    ],
  },
  {
    label: "Brand",
    keys: ["primary", "primaryForeground", "accent", "accentForeground", "ring"],
  },
];

const NAMES: Record<SemanticTokenKey, string> = {
  background: "Background",
  foreground: "Foreground",
  card: "Card",
  cardForeground: "Card foreground",
  popover: "Popover",
  popoverForeground: "Popover foreground",
  primary: "Primary",
  primaryForeground: "Primary foreground",
  secondary: "Secondary",
  secondaryForeground: "Secondary foreground",
  muted: "Muted",
  mutedForeground: "Muted foreground",
  superMutedForeground: "Super muted foreground",
  accent: "Accent",
  accentForeground: "Accent foreground",
  border: "Border",
  input: "Input",
  ring: "Ring",
};

const PURE_WHITE_REF: ThemeTokenRef = { source: "pure", value: "1 0 0" };
const PURE_BLACK_REF: ThemeTokenRef = { source: "pure", value: "0 0 0" };

function refLabel(ref: ThemeTokenRef): string {
  if (ref.source === "pure") {
    return ref.value === "1 0 0"
      ? "white"
      : ref.value === "0 0 0"
        ? "black"
        : "custom";
  }
  return `${ref.source} ${ref.step}`;
}

function sameRef(a: ThemeTokenRef, b: ThemeTokenRef): boolean {
  if (a.source === "pure" || b.source === "pure")
    return a.source === "pure" && b.source === "pure" && a.value === b.value;
  return a.source === b.source && a.step === b.step;
}

export function TokenMapSection({ collapsible }: { collapsible?: boolean }) {
  const { input, patch, mode, generated } = useThemeBuilder();
  const overrides = input.tokenOverrides?.[mode];
  const refs = tokenRefsForMode(mode, overrides);
  const defaults = tokenRefsForMode(mode);

  const setRef = (key: SemanticTokenKey, ref: ThemeTokenRef | null) =>
    patch((draft) => {
      const perMode = (draft.tokenOverrides ??= {});
      const map = (perMode[mode] ??= {});
      if (ref === null || sameRef(ref, defaults[key])) {
        delete map[key];
        if (Object.keys(map).length === 0) delete perMode[mode];
        if (Object.keys(perMode).length === 0) delete draft.tokenOverrides;
      } else {
        map[key] = ref;
      }
    });

  return (
    <Section
      collapsible={collapsible}
      title="Tokens"
      subtitle="Where each semantic token sits on the generated ramps. Edits apply to the current mode."
    >
      <div className="flex flex-col gap-3">
        {GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <div className="text-2xs font-medium text-foreground/80">
              {group.label}
            </div>
            {group.keys.map((key) => {
              const ref = refs[key];
              const overridden = overrides?.[key] !== undefined;
              const color = `oklch(${generated.colors[mode][key]})`;
              return (
                <div key={key} className="flex h-7 items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-sm border border-border/60"
                    style={{ backgroundColor: color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-2xs text-foreground/80">
                    {NAMES[key]}
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-2xs transition hover:bg-foreground/10",
                          overridden
                            ? "border-primary/50 text-foreground"
                            : "border-border/60 text-muted-foreground",
                        )}
                      >
                        {refLabel(ref)}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="left"
                      align="center"
                      className="w-auto p-3"
                    >
                      <div className="flex flex-col gap-2">
                        {(["neutral", "primary", "accent"] as const).map(
                          (source) => (
                            <div key={source} className="flex items-center gap-1.5">
                              <span className="w-12 shrink-0 text-2xs text-muted-foreground">
                                {source}
                              </span>
                              <div className="flex gap-0.5">
                                {RAMP_KEYS.map((step) => {
                                  const active =
                                    ref.source === source && ref.step === step;
                                  return (
                                    <button
                                      key={step}
                                      type="button"
                                      title={`${source} ${step}`}
                                      onClick={() =>
                                        setRef(key, { source, step })
                                      }
                                      className={cn(
                                        "h-5 w-5 rounded-sm border transition",
                                        active
                                          ? "border-primary ring-1 ring-primary"
                                          : "border-border/40 hover:border-foreground/50",
                                      )}
                                      style={{
                                        backgroundColor: `oklch(${generated.ramps[source][step]})`,
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ),
                        )}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="w-12 shrink-0 text-2xs text-muted-foreground">
                            pure
                          </span>
                          <button
                            type="button"
                            onClick={() => setRef(key, PURE_WHITE_REF)}
                            className={cn(
                              "h-5 rounded-sm border px-1.5 text-2xs transition",
                              sameRef(ref, PURE_WHITE_REF)
                                ? "border-primary ring-1 ring-primary"
                                : "border-border/60 hover:border-foreground/50",
                            )}
                            style={{ backgroundColor: "white", color: "black" }}
                          >
                            White
                          </button>
                          <button
                            type="button"
                            onClick={() => setRef(key, PURE_BLACK_REF)}
                            className={cn(
                              "h-5 rounded-sm border px-1.5 text-2xs transition",
                              sameRef(ref, PURE_BLACK_REF)
                                ? "border-primary ring-1 ring-primary"
                                : "border-border/60 hover:border-foreground/50",
                            )}
                            style={{ backgroundColor: "black", color: "white" }}
                          >
                            Black
                          </button>
                          {overridden && (
                            <button
                              type="button"
                              onClick={() => setRef(key, null)}
                              className="ml-auto inline-flex h-5 items-center gap-1 rounded-sm border border-border/60 px-1.5 text-2xs text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Section>
  );
}
