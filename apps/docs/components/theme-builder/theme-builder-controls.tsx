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

import { Sun, Moon } from "lucide-react";
import {
  type ThemeInput,
  type ColorIntensity,
  type RadiusStyle,
  type SpacingDensity,
  type ButtonShape,
  type InputStyle,
  type CardStyle,
  type ShadowIntensity,
  type TypeScale,
} from "@/lib/themes";
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
}

export function ThemeBuilderControls({
  className,
  hideMode,
  sections,
}: ThemeBuilderControlsProps) {
  const { input, patch, mode, setMode, baseline } = useThemeBuilder();

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

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto",
        className
      )}
      data-lenis-prevent
    >
      {showMode && (
        <Section title="Mode">
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
        <Section title="Colour" subtitle="Hues drive the full OKLCH ramps.">
          <HueRow
            label="Primary"
            hue={input.hues.primary}
            chroma={input.chroma?.primary ?? 1.0}
            changed={changed((i) => i.hues.primary)}
            onReset={resetField((d, b) => {
              d.hues.primary = b.hues.primary;
            })}
            onChange={(h) =>
              patch((d) => {
                d.hues.primary = h;
              })
            }
          />
          <HueRow
            label="Accent"
            hue={input.hues.accent}
            chroma={input.chroma?.accent ?? 1.0}
            changed={changed((i) => i.hues.accent)}
            onReset={resetField((d, b) => {
              d.hues.accent = b.hues.accent;
            })}
            onChange={(h) =>
              patch((d) => {
                d.hues.accent = h;
              })
            }
          />
          <HueRow
            label="Neutral"
            hue={input.hues.neutral}
            chroma={input.chroma?.neutral ?? 0.08}
            changed={changed((i) => i.hues.neutral)}
            onReset={resetField((d, b) => {
              d.hues.neutral = b.hues.neutral;
            })}
            onChange={(h) =>
              patch((d) => {
                d.hues.neutral = h;
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
        <Section title="Typography">
          <FontRow
            label="Display"
            value={input.typography.display}
            changed={changed((i) => i.typography.display)}
            onReset={resetField((d, b) => {
              d.typography.display = b.typography.display;
            })}
            onChange={(v) =>
              patch((d) => {
                d.typography.display = v;
              })
            }
            filter={(cat) => cat !== "mono"}
          />
          <FontRow
            label="Body"
            value={input.typography.body}
            changed={changed((i) => i.typography.body)}
            onReset={resetField((d, b) => {
              d.typography.body = b.typography.body;
            })}
            onChange={(v) =>
              patch((d) => {
                d.typography.body = v;
              })
            }
            filter={(cat) => cat !== "mono"}
          />
          <FontRow
            label="Mono"
            value={input.typography.mono}
            changed={changed((i) => i.typography.mono)}
            onReset={resetField((d, b) => {
              d.typography.mono = b.typography.mono;
            })}
            onChange={(v) =>
              patch((d) => {
                d.typography.mono = v;
              })
            }
            filter={(cat) => cat === "mono"}
          />

          {/* Type scale — legacy flat presets plus the modular (musical)
              ratios. Modular ids generate the ladder middle-out from the
              body size (Utopia model): up by the ratio, down by the
              reciprocal, floored. See @gradeui/core GDS_MODULAR_SCALES. */}
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
        </Section>
      )}

      {show("shape") && (
        <Section title="Shape &amp; feel">
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
        <Section title="Components">
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
