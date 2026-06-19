"use client";

/**
 * ThemeBuilderControls — the scrollable form with every knob the builder
 * exposes. Pulls `input`, `patch`, `mode`, and `setMode` off the provider
 * and writes back via `patch(draft => { draft.foo = … })` — the provider
 * handles history push / deep clone so controls can mutate freely.
 *
 * Single full form by design — there's deliberately no "simple" vs
 * "advanced" split. The host (modal, popover, sidebar) handles overflow
 * with its own scroll container; we always render the full set so nothing
 * goes missing depending on where the builder is hosted.
 */

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import {
  customFontFamily,
  type ThemeInput,
  type ColorIntensity,
  type CustomFontFace,
  type FontSelection,
  type RadiusStyle,
  type SpacingDensity,
  type ButtonShape,
  type InputStyle,
  type CardStyle,
  type ShadowIntensity,
  type TypeScale,
} from "@/lib/themes";
import { getStudioStorage } from "@/lib/studio-storage";
import { assetToFontFace } from "@/lib/custom-fonts";
import { GDS_MODULAR_SCALES } from "@gradeui/core";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Swatch, SwatchGroup } from "@/components/ui/swatch";
import { SliderInput } from "@/components/ui/slider-input";

/** Palette slots shown as swatches. `sem` (when set) is the editable
 *  semantic-override key; brand/accent (sem null) are edited via the hue
 *  rows below. `field` is the generated colour read for the chip + the
 *  editor's seed. */
const PALETTE_SLOTS = [
  { field: "primary", label: "Brand", sem: null },
  { field: "accent", label: "Accent", sem: null },
  { field: "success", label: "Success", sem: "success" },
  { field: "warning", label: "Warning", sem: "warning" },
  { field: "info", label: "Info", sem: "info" },
  { field: "highlight", label: "Highlight", sem: "highlight" },
  { field: "destructive", label: "Error", sem: "destructive" },
] as const;

type SemanticKey = "success" | "warning" | "info" | "highlight" | "destructive";
import { useThemeBuilder } from "./theme-builder-provider";
import {
  Section,
  Label,
  Segmented,
  ModeButton,
  HueRow,
  FontRow,
} from "./theme-builder-primitives";

export interface ThemeBuilderControlsProps {
  className?: string;
  /** Hide the Mode section (light/dark). In "site" bind mode the host
   *  usually has a mode toggle in the chrome already. */
  hideMode?: boolean;
  /** Hide specific sections. Useful for embedding a cut-down builder in
   *  a small surface (e.g. a quick-hue popover). */
  sections?: {
    mode?: boolean;
    colour?: boolean;
    typography?: boolean;
    shape?: boolean;
    components?: boolean;
  };
  /** Render each section flat (no collapse chevron). Default keeps the
   *  collapsible behaviour; the focused Design System sub-tabs pass false. */
  collapsibleSections?: boolean;
  /** Hide the global Heading weight control — the Design System editor owns
   *  weight per base style instead, so the top section stays font + scale. */
  hideHeadingWeight?: boolean;
  /** Hide the Scale picker — the Design System editor renders it inside the
   *  Type scale section instead. */
  hideScale?: boolean;
}

export function ThemeBuilderControls({
  className,
  hideMode,
  sections,
  collapsibleSections,
  hideHeadingWeight,
  hideScale,
}: ThemeBuilderControlsProps) {
  const { input, patch, mode, setMode, baseline, generated } =
    useThemeBuilder();
  // Which palette swatch is selected (foundation for select-then-tune; the
  // OKLCH editor wires onto this in #29).
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);

  // Resolve visibility. Defaults: everything visible except Mode when
  // `hideMode` is set. If `sections` is provided, undefined means "show";
  // only explicit false hides.
  const show = (key: keyof NonNullable<ThemeBuilderControlsProps["sections"]>) =>
    sections?.[key] !== false;
  const showMode = !hideMode && show("mode");

  // Changed-from-base check per control. Selectors carry the SAME
  // fallbacks the controls render with, so `undefined` and an explicit
  // default compare equal (clicking "Default" on an untouched control
  // doesn't light the dot). JSON compare keeps it order-stable for the
  // primitive values these selectors return.
  const changed = (sel: (i: ThemeInput) => unknown) =>
    JSON.stringify(sel(baseline)) !== JSON.stringify(sel(input));

  // Per-control reset — copies just THIS field's baseline value onto
  // the draft (one history entry, undoable); every other edit stays.
  const resetField =
    (apply: (draft: ThemeInput, base: ThemeInput) => void) => () =>
      patch((d) => apply(d, baseline));

  // ── Custom fonts ────────────────────────────────────────────────────
  // The user's uploaded font assets (migration 0014, type 'font'),
  // offered in the pickers alongside the registry. Cloud-only: local
  // mode returns [] and the group simply doesn't render. Theme-owned
  // faces are merged in first so a face already saved on the theme stays
  // selectable even after its library asset is deleted.
  const [libraryFonts, setLibraryFonts] = React.useState<CustomFontFace[]>([]);
  React.useEffect(() => {
    let alive = true;
    getStudioStorage()
      .listAssets({ type: "font" })
      .then((assets) => {
        if (!alive) return;
        setLibraryFonts(
          assets
            .map(assetToFontFace)
            .filter((f): f is CustomFontFace => f !== null)
        );
      })
      .catch(() => {
        // Asset library unavailable (local mode / signed out) — registry
        // fonts still work, so stay quiet.
      });
    return () => {
      alive = false;
    };
  }, []);

  const customFonts = React.useMemo(() => {
    const own = input.typography.customFonts ?? [];
    const seen = new Set(own.map((f) => f.family));
    return [...own, ...libraryFonts.filter((f) => !seen.has(f.family))];
  }, [input.typography.customFonts, libraryFonts]);

  // Selecting a custom face copies it ONTO the draft — the theme must
  // carry its own faces (deterministic + portable; STUDIO-THEMES) rather
  // than depend on the picker's library being around at render time.
  const setFont =
    (slot: "display" | "body" | "mono") => (v: FontSelection) =>
      patch((d) => {
        d.typography[slot] = v;
        const family = customFontFamily(v);
        if (!family) return;
        const face = customFonts.find((f) => f.family === family);
        const have = d.typography.customFonts ?? [];
        if (face && !have.some((f) => f.family === family)) {
          d.typography.customFonts = [...have, face];
        }
      });

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto",
        className
      )}
      data-lenis-prevent
    >
      {showMode && (
        <Section collapsible={collapsibleSections} title="Mode">
          <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
            <ModeButton
              active={mode === "light"}
              onClick={() => setMode("light")}
              icon={<Sun className="h-3 w-3" />}
              label="Light"
            />
            <ModeButton
              active={mode === "dark"}
              onClick={() => setMode("dark")}
              icon={<Moon className="h-3 w-3" />}
              label="Dark"
            />
          </div>
        </Section>
      )}

      {show("colour") && (
        <Section collapsible={collapsibleSections} title="Colour" subtitle="Hues drive the full OKLCH ramps.">
          {/* Palette — the theme's called-out colours as swatches. Driven by
              the GENERATED triplets so it re-voices live as you edit. Select a
              SEMANTIC chip to tune its OKLCH directly (an override); brand /
              accent are edited via the hue rows below. */}
          <div className="space-y-1.5">
            <Label>Palette</Label>
            <SwatchGroup gap="sm">
              {PALETTE_SLOTS.map((slot) => (
                <Swatch
                  key={slot.field}
                  size="sm"
                  color={`oklch(${generated.colors[mode][slot.field]})`}
                  label={slot.label}
                  selected={selectedSlot === slot.field}
                  onSelect={() =>
                    setSelectedSlot((s) =>
                      s === slot.field ? null : slot.field
                    )
                  }
                />
              ))}
            </SwatchGroup>

            {/* Per-semantic OKLCH editor — shown for a selected semantic chip.
                Seeds from the override if present, else the generated default;
                writing any channel stores the full triplet as an override. */}
            {(() => {
              const slot = PALETTE_SLOTS.find(
                (s) => s.field === selectedSlot && s.sem
              );
              if (!slot || !slot.sem) return null;
              const sem = slot.sem as SemanticKey;
              const triplet =
                input.semantics?.[sem] ?? generated.colors[mode][slot.field];
              const [l, c, h] = triplet.trim().split(/\s+/).map(Number);
              const write = (next: { l?: number; c?: number; h?: number }) =>
                patch((d) => {
                  (d.semantics ??= {})[sem] = `${(next.l ?? l).toFixed(4)} ${(
                    next.c ?? c
                  ).toFixed(4)} ${(next.h ?? h).toFixed(2)}`;
                });
              const overridden = input.semantics?.[sem] != null;
              return (
                <div className="space-y-2 rounded-md border border-border/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-medium text-foreground/80">
                      {slot.label}
                    </span>
                    {overridden && (
                      <button
                        type="button"
                        onClick={() =>
                          patch((d) => {
                            if (d.semantics) d.semantics[sem] = undefined;
                          })
                        }
                        className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-2xs text-muted-foreground">
                      Hue
                    </span>
                    <SliderInput
                      className="flex-1"
                      aria-label={`${slot.label} hue`}
                      value={h}
                      min={0}
                      max={360}
                      step={1}
                      unit="°"
                      onChange={(v) => write({ h: v })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-2xs text-muted-foreground">
                      Lightness
                    </span>
                    <SliderInput
                      className="flex-1"
                      aria-label={`${slot.label} lightness`}
                      value={l}
                      min={0}
                      max={1}
                      step={0.01}
                      decimals={2}
                      onChange={(v) => write({ l: v })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-2xs text-muted-foreground">
                      Chroma
                    </span>
                    <SliderInput
                      className="flex-1"
                      aria-label={`${slot.label} chroma`}
                      value={c}
                      min={0}
                      max={0.4}
                      step={0.005}
                      decimals={3}
                      onChange={(v) => write({ c: v })}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          <HueRow
            label="Primary"
            hue={input.hues.primary}
            chroma={input.chroma?.primary ?? 1.0}
            chromaMax={2.5}
            changed={changed((i) => i.hues.primary)}
            onReset={resetField((d, b) => {
              d.hues.primary = b.hues.primary;
            })}
            onChange={(h) =>
              patch((d) => {
                d.hues.primary = h;
              })
            }
            onChroma={(c) =>
              patch((d) => {
                (d.chroma ??= {}).primary = c;
              })
            }
            lightnessShift={input.lightness?.primary ?? 0}
            onLightness={(s) =>
              patch((d) => {
                (d.lightness ??= {}).primary = s;
              })
            }
          />
          <HueRow
            label="Accent"
            hue={input.hues.accent}
            chroma={input.chroma?.accent ?? 1.0}
            chromaMax={2.5}
            changed={changed((i) => i.hues.accent)}
            onReset={resetField((d, b) => {
              d.hues.accent = b.hues.accent;
            })}
            onChange={(h) =>
              patch((d) => {
                d.hues.accent = h;
              })
            }
            onChroma={(c) =>
              patch((d) => {
                (d.chroma ??= {}).accent = c;
              })
            }
            lightnessShift={input.lightness?.accent ?? 0}
            onLightness={(s) =>
              patch((d) => {
                (d.lightness ??= {}).accent = s;
              })
            }
          />
          <HueRow
            label="Neutral"
            hue={input.hues.neutral}
            chroma={input.chroma?.neutral ?? 0.08}
            chromaMax={0.4}
            changed={changed((i) => i.hues.neutral)}
            onReset={resetField((d, b) => {
              d.hues.neutral = b.hues.neutral;
            })}
            onChange={(h) =>
              patch((d) => {
                d.hues.neutral = h;
              })
            }
            onChroma={(c) =>
              patch((d) => {
                (d.chroma ??= {}).neutral = c;
              })
            }
            lightnessShift={input.lightness?.neutral ?? 0}
            onLightness={(s) =>
              patch((d) => {
                (d.lightness ??= {}).neutral = s;
              })
            }
          />

          <div className="pt-2 space-y-2">
            {/* Canonical Field + Checkbox row (id/aria wiring for free)
                instead of the old raw <input type="checkbox">. */}
            <Field>
              <Checkbox
                checked={Boolean(input.neutralPureGray)}
                onCheckedChange={(checked) =>
                  patch((d) => {
                    d.neutralPureGray = checked === true;
                  })
                }
              />
              <Field.Label className="text-xs font-normal">
                Pure-gray neutral (zero chroma)
              </Field.Label>
            </Field>

            <div>
              <Label
                changed={changed((i) => i.intensity ?? "default")}
                onReset={resetField((d, b) => {
                  d.intensity = b.intensity;
                })}
              >
                Intensity
              </Label>
              <Segmented
                value={input.intensity ?? "default"}
                options={INTENSITIES}
                onChange={(v) =>
                  patch((d: ThemeInput) => {
                    d.intensity = v;
                  })
                }
              />
            </div>
          </div>
        </Section>
      )}

      {show("typography") && (
        <Section collapsible={collapsibleSections} title="Typography">
          <FontRow
            label="Body"
            value={input.typography.body}
            changed={changed((i) => i.typography.body)}
            onReset={resetField((d, b) => {
              d.typography.body = b.typography.body;
            })}
            onChange={setFont("body")}
            customFonts={customFonts}
            filter={(cat) => cat !== "mono"}
            description="The workhorse — body copy and most UI text."
          />
          <FontRow
            label="Display"
            value={input.typography.display || input.typography.body}
            changed={changed((i) => i.typography.display)}
            onReset={resetField((d, b) => {
              d.typography.display = b.typography.display;
            })}
            onChange={setFont("display")}
            customFonts={customFonts}
            filter={(cat) => cat !== "mono"}
            description="Headings and large type. Inherits Body when left unset."
          />
          <FontRow
            label="Mono"
            value={input.typography.mono}
            changed={changed((i) => i.typography.mono)}
            onReset={resetField((d, b) => {
              d.typography.mono = b.typography.mono;
            })}
            onChange={setFont("mono")}
            customFonts={customFonts}
            filter={(cat) => cat === "mono"}
            description="Code, tabular figures, and anything monospaced."
          />

          {/* Width — the variable-font wdth cut, applied theme-wide
              (body inherits into every span/component; display follows
              body unless split later). Only does anything for fonts
              carrying a width axis; static fonts ignore it. Per-element
              font-stretch-[…] utilities still override. */}
          <div className="space-y-1">
            <Label
              changed={changed((i) => i.typography.bodyStretch ?? "normal")}
              onReset={resetField((d, b) => {
                d.typography.bodyStretch = b.typography.bodyStretch;
              })}
            >
              Width
            </Label>
            <Select
              value={input.typography.bodyStretch ?? "normal"}
              onValueChange={(v) =>
                patch((d) => {
                  d.typography.bodyStretch = v === "normal" ? undefined : v;
                })
              }
            >
              <SelectTrigger size="2xs" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent size="2xs">
                <SelectItem value="75%">Condensed (75%)</SelectItem>
                <SelectItem value="90%">Compact (90%)</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="112.5%">Wide (112.5%)</SelectItem>
                <SelectItem value="125%">Extended (125%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type scale — legacy flat presets plus the modular (musical)
              ratios. Modular ids generate the ladder middle-out from the
              body size (Utopia model): up by the ratio, down by the
              reciprocal, floored. See @gradeui/core GDS_MODULAR_SCALES.
              Hidden in the Design System editor, which renders it in the
              Type scale section. */}
          {!hideScale && (
          <div className="space-y-1">
            <Label
              changed={changed((i) => i.typography.scale)}
              onReset={resetField((d, b) => {
                d.typography.scale = b.typography.scale;
              })}
            >
              Scale
            </Label>
            <Select
              value={input.typography.scale}
              onValueChange={(v) =>
                patch((d) => {
                  d.typography.scale = v as TypeScale;
                })
              }
            >
              <SelectTrigger size="2xs" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent size="2xs">
                <SelectGroup>
                  <SelectLabel>Presets</SelectLabel>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Modular (musical)</SelectLabel>
                  {GDS_MODULAR_SCALES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label} · {s.ratio}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          )}

          {!hideHeadingWeight && (
            <div className="pt-1">
              <Label
                changed={changed((i) => i.typography.headingWeight ?? 600)}
                onReset={resetField((d, b) => {
                  d.typography.headingWeight = b.typography.headingWeight;
                })}
              >
                Heading weight
              </Label>
              <Segmented
                value={String(input.typography.headingWeight ?? 600)}
                options={WEIGHTS}
                onChange={(v) =>
                  patch((d) => {
                    d.typography.headingWeight = Number(v);
                  })
                }
              />
            </div>
          )}
        </Section>
      )}

      {show("shape") && (
        <Section collapsible={collapsibleSections} title="Shape &amp; feel">
          <div>
            <Label
              changed={changed((i) => i.radius.style)}
              onReset={resetField((d, b) => {
                d.radius.style = b.radius.style;
              })}
            >
              Radius
            </Label>
            <Segmented
              value={input.radius.style}
              options={RADII}
              onChange={(v) =>
                patch((d) => {
                  d.radius.style = v;
                })
              }
            />
          </div>
          <div>
            <Label
              changed={changed((i) => i.spacing.density)}
              onReset={resetField((d, b) => {
                d.spacing.density = b.spacing.density;
              })}
            >
              Density
            </Label>
            <Segmented
              value={input.spacing.density}
              options={DENSITIES}
              onChange={(v) =>
                patch((d) => {
                  d.spacing.density = v;
                })
              }
            />
          </div>
          <div>
            <Label
              changed={changed((i) => i.effects?.shadows ?? "default")}
              onReset={resetField((d, b) => {
                d.effects = { ...(d.effects ?? {}), shadows: b.effects?.shadows };
              })}
            >
              Shadows
            </Label>
            <Segmented
              value={input.effects?.shadows ?? "default"}
              options={SHADOWS}
              onChange={(v) =>
                patch((d) => {
                  d.effects = { ...(d.effects ?? {}), shadows: v };
                })
              }
            />
          </div>
        </Section>
      )}

      {show("components") && (
        <Section collapsible={collapsibleSections} title="Components">
          <div>
            <Label
              changed={changed((i) => i.components?.buttonShape ?? "default")}
              onReset={resetField((d, b) => {
                d.components = {
                  ...(d.components ?? {}),
                  buttonShape: b.components?.buttonShape,
                };
              })}
            >
              Button shape
            </Label>
            <Segmented
              value={input.components?.buttonShape ?? "default"}
              options={BUTTON_SHAPES}
              onChange={(v) =>
                patch((d) => {
                  d.components = { ...(d.components ?? {}), buttonShape: v };
                })
              }
            />
          </div>
          <div>
            <Label
              changed={changed((i) => i.components?.inputStyle ?? "outlined")}
              onReset={resetField((d, b) => {
                d.components = {
                  ...(d.components ?? {}),
                  inputStyle: b.components?.inputStyle,
                };
              })}
            >
              Input style
            </Label>
            <Segmented
              value={input.components?.inputStyle ?? "outlined"}
              options={INPUT_STYLES}
              onChange={(v) =>
                patch((d) => {
                  d.components = { ...(d.components ?? {}), inputStyle: v };
                })
              }
            />
          </div>
          <div>
            <Label
              changed={changed((i) => i.components?.cardStyle ?? "flat")}
              onReset={resetField((d, b) => {
                d.components = {
                  ...(d.components ?? {}),
                  cardStyle: b.components?.cardStyle,
                };
              })}
            >
              Card style
            </Label>
            <Segmented
              value={input.components?.cardStyle ?? "flat"}
              options={CARD_STYLES}
              onChange={(v) =>
                patch((d) => {
                  d.components = { ...(d.components ?? {}), cardStyle: v };
                })
              }
            />
          </div>
        </Section>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Option tables — shared across themes, unchanged from the old panel.
   ────────────────────────────────────────────────────────────────────── */

const INTENSITIES: { value: ColorIntensity; label: string }[] = [
  { value: "muted", label: "Muted" },
  { value: "default", label: "Default" },
  { value: "vibrant", label: "Vibrant" },
];

const RADII: { value: RadiusStyle; label: string }[] = [
  { value: "sharp", label: "Sharp" },
  { value: "subtle", label: "Subtle" },
  { value: "soft", label: "Soft" },
  { value: "round", label: "Round" },
  { value: "pill", label: "Pill" },
];

const DENSITIES: { value: SpacingDensity; label: string }[] = [
  { value: "tight", label: "Tight" },
  { value: "default", label: "Default" },
  { value: "roomy", label: "Roomy" },
];

const SHADOWS: { value: ShadowIntensity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "default", label: "Default" },
  { value: "dramatic", label: "Dramatic" },
];

const BUTTON_SHAPES: { value: ButtonShape; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Square" },
];

const INPUT_STYLES: { value: InputStyle; label: string }[] = [
  { value: "outlined", label: "Outlined" },
  { value: "filled", label: "Filled" },
  { value: "underline", label: "Underline" },
];

const CARD_STYLES: { value: CardStyle; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "outlined", label: "Outlined" },
  { value: "elevated", label: "Elevated" },
  { value: "glass", label: "Glass" },
];

const WEIGHTS = [
  { value: "400", label: "400" },
  { value: "500", label: "500" },
  { value: "600", label: "600" },
  { value: "700", label: "700" },
  { value: "800", label: "800" },
];
