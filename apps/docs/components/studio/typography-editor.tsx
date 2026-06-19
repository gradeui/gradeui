"use client";

/**
 * TypographyEditor — the co-located typography surface for the Design System
 * Typography sub-tab (STUDIO-TYPOGRAPHY.md TY1).
 *
 * Preview and inputs together, not a controls column + a separate specimen:
 *   - Base styles (Body / Header / Mono) — the mixers every step inherits from.
 *   - The step ladder (display … caption) — each row shows the live "Aa +
 *     sentence" specimen AND its inputs (inherits-from, font role, weight,
 *     line-height, letter-spacing) side by side. The specimen renders from the
 *     RESOLVED props via inline styles, so it reflects edits instantly without
 *     waiting on the generator (that wiring is TY2).
 *   - Prose — long-form / markdown typography, composed from the base styles.
 *
 * Everything patches the page-level ThemeBuilderProvider draft, so edits ride
 * the same persistence + preview path as every other theme control.
 */

import * as React from "react";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  FontRow,
  Label,
  WeightSlider,
  useMaybeThemeBuilder,
} from "@/components/theme-builder";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TokenField } from "./token-field";
import { GDS_MODULAR_SCALES } from "@gradeui/core";
import {
  TRACKING_SCALE,
  TRACKING_HINT,
  type TrackingValue,
} from "@/lib/tailwind-classes";
import { customFontFamily } from "@/lib/themes";
import { getStudioStorage } from "@/lib/studio-storage";
import { assetToFontFace } from "@/lib/custom-fonts";
import type {
  ThemeInput,
  FontRole,
  TypeBaseStyleKey,
  TypeStepKey,
  TypeStyleProps,
  TypeScale,
  FontSelection,
  CustomFontFace,
} from "@/lib/themes";

// ── Static metadata ──────────────────────────────────────────────────────

// Steps inherit from one of these (Prose is for the prose tree, not a step).
const STEP_BASE_OPTIONS: { value: TypeBaseStyleKey; label: string }[] = [
  { value: "body", label: "Body" },
  { value: "header", label: "Header" },
  { value: "mono", label: "Mono" },
];

const BASE_STYLES: { key: TypeBaseStyleKey; label: string }[] = [
  { key: "body", label: "Body" },
  { key: "header", label: "Header" },
  { key: "mono", label: "Mono" },
  { key: "accent", label: "Accent" },
];

const BASE_LABEL: Record<TypeBaseStyleKey, string> = {
  body: "Body",
  header: "Header",
  mono: "Mono",
  accent: "Accent",
  prose: "Prose",
};

// The named ladder. `size` is the Tailwind text-* step (rides the theme's
// --text-* scale); `base` is the default inheritance when the step hasn't
// chosen one.
const STEPS: {
  key: TypeStepKey;
  label: string;
  size: string;
  base: TypeBaseStyleKey;
}[] = [
  { key: "display", label: "Display", size: "text-5xl", base: "header" },
  { key: "h1", label: "Heading 1", size: "text-4xl", base: "header" },
  { key: "h2", label: "Heading 2", size: "text-3xl", base: "header" },
  { key: "h3", label: "Heading 3", size: "text-2xl", base: "header" },
  { key: "h4", label: "Heading 4", size: "text-xl", base: "header" },
  { key: "h5", label: "Heading 5", size: "text-lg", base: "header" },
  { key: "h6", label: "Heading 6", size: "text-base", base: "header" },
  { key: "body", label: "Body", size: "text-base", base: "body" },
  { key: "small", label: "Small", size: "text-sm", base: "body" },
  { key: "caption", label: "Caption", size: "text-xs", base: "body" },
];

// Maps each ladder step to a key in the generated theme's size scale, so the
// specimen renders at the DRAFT theme's size and re-pitches when the modular
// scale changes. (caption has no dedicated generated size — it shares small's.)
const SCALE_KEY: Record<TypeStepKey, string> = {
  display: "display",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  body: "body",
  small: "bodySm",
  caption: "bodySm",
};

const DEFAULT_WEIGHT: Record<TypeBaseStyleKey, number> = {
  body: 400,
  header: 600,
  mono: 400,
  accent: 400,
  prose: 400,
};
const DEFAULT_FONT: Record<TypeBaseStyleKey, FontRole> = {
  body: "body",
  header: "display",
  mono: "mono",
  accent: "accent",
  prose: "body",
};

// Which typography font field each base style edits (its actual family).
const BASE_FONT_FIELD: Record<
  "body" | "header" | "mono" | "accent",
  "body" | "display" | "mono" | "accent"
> = {
  body: "body",
  header: "display",
  mono: "mono",
  accent: "accent",
};

// ── Small field row ──────────────────────────────────────────────────────

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

// Em value → tracking token, so a stored letter-spacing re-displays as its
// named token (tight, normal, …) in the picker.
const LS_HINT_TO_TOKEN = Object.fromEntries(
  TRACKING_SCALE.map((t) => [TRACKING_HINT[t], t]),
) as Record<string, TrackingValue>;

/**
 * Letter-spacing field — TOKEN-FIRST via the shared `TokenField` (the same
 * control the on-screen inspector uses). The value reads as a bound token
 * chip — `tracking-tight · -0.025em` — and detaches to a raw em input for a
 * custom value. The theme still stores the resolved em (letter-spacing is
 * owned by the theme, never a `tracking-*` utility on output); a stored em
 * that matches a token re-displays as that token.
 */
const LS_TOKENS = TRACKING_SCALE.map((t) => ({
  value: t,
  label: `tracking-${t}`,
  hint: TRACKING_HINT[t],
}));

function LetterSpacingField({
  value,
  onChange,
}: {
  /** "" = inherit / unset. */
  value: string;
  onChange: (v: string | undefined) => void;
}) {
  const tokenMatch = value ? LS_HINT_TO_TOKEN[value] ?? null : null;
  // Detached = a raw em that isn't a token. A bare custom value reads as
  // detached on its own; `detached` only tracks an explicit unlink off a
  // matching token.
  const [detached, setDetached] = React.useState(false);
  const bound = !detached && (value === "" || tokenMatch != null);
  return (
    <TokenField
      kind="letter spacing"
      label="Letter spacing"
      bound={bound}
      token={bound ? tokenMatch : null}
      tokens={LS_TOKENS}
      placeholder="Inherit"
      currentRaw={bound ? undefined : value}
      onPickToken={(t) => {
        setDetached(false);
        onChange(t == null ? undefined : TRACKING_HINT[t as TrackingValue]);
      }}
      onDetach={() => setDetached(true)}
      onRebind={() => {
        setDetached(false);
        onChange(TRACKING_HINT.normal);
      }}
      renderRaw={(attach) => (
        <div className="flex items-center gap-1">
          <input
            value={value}
            placeholder="-0.01em"
            onChange={(e) => onChange(e.target.value || undefined)}
            className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {attach}
        </div>
      )}
    />
  );
}

// ── Editor ────────────────────────────────────────────────────────────────

export function TypographyEditor() {
  const builder = useMaybeThemeBuilder();

  // Project/org font library (uploaded faces). Merged into the picker below
  // so an uploaded font shows even before it's copied onto the draft.
  // Mirrors ThemeBuilderControls; hooks run before the early return.
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
            .filter((f): f is CustomFontFace => f !== null),
        );
      })
      .catch(() => {
        // Asset library unavailable (local / signed out) — registry fonts
        // still work, so stay quiet.
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!builder) return null;

  const input = builder.input as ThemeInput;
  const generated = builder.generated;
  const typo = input.typography;

  // Theme's own faces + library faces (deduped by family), so the picker
  // lists uploaded fonts alongside the registry.
  const customFonts = [
    ...(typo.customFonts ?? []),
    ...libraryFonts.filter(
      (f) => !(typo.customFonts ?? []).some((o) => o.family === f.family),
    ),
  ];

  const patchBase = (key: TypeBaseStyleKey, patch: Partial<TypeStyleProps>) =>
    builder.patch((d: ThemeInput) => {
      const styles = (d.typography.baseStyles ??= {});
      styles[key] = { ...styles[key], ...patch };
    });

  const setBaseFont = (
    field: "body" | "display" | "mono" | "accent",
    v: FontSelection,
  ) =>
    builder.patch((d: ThemeInput) => {
      d.typography[field] = v;
      // Copy the chosen custom face onto the draft so the theme carries it
      // (deterministic + portable) and the @font-face actually loads.
      const family = customFontFamily(v);
      if (!family) return;
      const face = customFonts.find((f) => f.family === family);
      const have = d.typography.customFonts ?? [];
      if (face && !have.some((f) => f.family === family)) {
        d.typography.customFonts = [...have, face];
      }
    });

  // Base weights map to the REAL generator fields so they hit actual screens:
  // Body → bodyWeight, Header → headingWeight. Mono has no generator field yet,
  // so it lives on baseStyles (preview only until the TY2 generator pass).
  const baseWeightFor = (k: TypeBaseStyleKey) =>
    k === "header"
      ? typo.headingWeight ?? 600
      : k === "body"
        ? typo.bodyWeight ?? 400
        : typo.baseStyles?.[k]?.weight ?? DEFAULT_WEIGHT[k];

  const setBaseWeight = (k: TypeBaseStyleKey, w: number) =>
    builder.patch((d: ThemeInput) => {
      if (k === "header") d.typography.headingWeight = w;
      else if (k === "body") d.typography.bodyWeight = w;
      else {
        const styles = (d.typography.baseStyles ??= {});
        styles[k] = { ...styles[k], weight: w };
      }
    });

  // Width (variable-font wdth cut) follows the same dual-storage model as
  // weight: Body → bodyStretch, Header → displayStretch (both LIVE on real
  // screens via the generator), Mono → baseStyles.mono.stretch (preview only
  // until a generator field exists). "normal" clears the override.
  const widthFor = (k: TypeBaseStyleKey) =>
    k === "header"
      ? typo.displayStretch ?? "normal"
      : k === "body"
        ? typo.bodyStretch ?? "normal"
        : typo.baseStyles?.[k]?.stretch ?? "normal";

  const setBaseWidth = (k: TypeBaseStyleKey, v: string) =>
    builder.patch((d: ThemeInput) => {
      const val = v === "normal" ? undefined : v;
      if (k === "header") d.typography.displayStretch = val;
      else if (k === "body") d.typography.bodyStretch = val;
      else {
        const styles = (d.typography.baseStyles ??= {});
        styles[k] = { ...styles[k], stretch: val };
      }
    });

  const patchStep = (
    key: TypeStepKey,
    patch: Partial<TypeStyleProps> & { inheritsFrom?: TypeBaseStyleKey },
  ) =>
    builder.patch((d: ThemeInput) => {
      const steps = (d.typography.steps ??= {});
      steps[key] = { ...steps[key], ...patch };
    });

  // Clear a step's per-property overrides (font / weight / line-height /
  // letter-spacing) so it falls back to inheriting its base style. The chosen
  // base (inheritsFrom) is kept — that's a structural choice, not an override.
  const resetStep = (key: TypeStepKey) =>
    builder.patch((d: ThemeInput) => {
      const cur = d.typography.steps?.[key];
      if (!cur) return;
      d.typography.steps![key] = {
        ...(cur.inheritsFrom ? { inheritsFrom: cur.inheritsFrom } : {}),
      };
    });

  // Resolve a step's effective props: base default → base style → step.
  const resolveStep = (meta: (typeof STEPS)[number]) => {
    const step = typo.steps?.[meta.key] ?? {};
    const baseKey = step.inheritsFrom ?? meta.base;
    const base = typo.baseStyles?.[baseKey] ?? {};
    const font = step.font ?? base.font ?? DEFAULT_FONT[baseKey];
    const weight = step.weight ?? baseWeightFor(baseKey);
    const lineHeight = step.lineHeight ?? base.lineHeight;
    const letterSpacing = step.letterSpacing ?? base.letterSpacing;
    // Any property set on the step itself = it's been overridden away from
    // the base style it inherits.
    const overridden =
      step.weight != null ||
      step.lineHeight != null ||
      step.letterSpacing != null ||
      step.font != null;
    return { baseKey, font, weight, lineHeight, letterSpacing, overridden, step };
  };

  const familyForRole = (role: FontRole) =>
    role === "display"
      ? generated.typography.fontDisplay
      : role === "mono"
        ? generated.typography.fontMono
        : role === "accent"
          ? generated.typography.fontAccent
          : generated.typography.fontSans;

  // Round step coarsens with the scale: at Augmented fourth (1.414) and up the
  // ladder snaps to the nearest 4px, otherwise the nearest 2px.
  const scaleRatio =
    GDS_MODULAR_SCALES.find((s) => s.id === typo.scale)?.ratio ?? 1;
  const roundStep = scaleRatio >= 1.4 ? 4 : 2;

  return (
    <div className="space-y-6">
      {/* ── Base styles ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">Base styles</h3>
          <p className="text-xs text-muted-foreground">
            The reusable styles every step inherits from. Override any property
            on a step below.
          </p>
        </div>
        <div className="space-y-3">
          {BASE_STYLES.map(({ key, label }) => {
            const b = typo.baseStyles?.[key] ?? {};
            const fontField =
              BASE_FONT_FIELD[key as "body" | "header" | "mono" | "accent"];
            const fontValue =
              key === "header"
                ? typo.display || typo.body
                : key === "accent"
                  ? typo.accent ?? "instrumentSerif"
                  : typo[fontField];
            return (
              <div
                key={key}
                className="space-y-2 rounded-md border border-border/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{label}</span>
                  <span
                    className="text-2xl leading-none text-foreground"
                    style={{
                      fontFamily: familyForRole(DEFAULT_FONT[key]),
                      fontWeight: baseWeightFor(key),
                    }}
                  >
                    Aa
                  </span>
                </div>
                <div className="grid grid-cols-2 items-start gap-2">
                  <FontRow
                    label="Font"
                    value={fontValue}
                    onChange={(v) => setBaseFont(fontField, v)}
                    filter={(cat) => (key === "mono" ? cat === "mono" : true)}
                    customFonts={customFonts}
                  />
                  <div className="space-y-1">
                    <Label>Weight</Label>
                    <WeightSlider
                      value={baseWeightFor(key)}
                      onChange={(w) => setBaseWeight(key, w)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="Line height"
                    value={b.lineHeight ?? ""}
                    placeholder="1.4"
                    onChange={(v) => patchBase(key, { lineHeight: v || undefined })}
                  />
                  <LetterSpacingField
                    value={b.letterSpacing ?? ""}
                    onChange={(v) => patchBase(key, { letterSpacing: v })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Width</Label>
                  <Select
                    value={widthFor(key)}
                    onValueChange={(v) => setBaseWidth(key, v)}
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
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Step ladder — preview + inputs together ─────────────────── */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">Type scale</h3>
          <p className="text-xs text-muted-foreground">
            The modular scale every step is pitched from, then per-step
            overrides. Each step inherits a base style.
          </p>
        </div>
        <div className="space-y-1">
          <Label>Scale</Label>
          <Select
            value={typo.scale}
            onValueChange={(v) =>
              builder.patch((d: ThemeInput) => {
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
        <div className="space-y-3">
          {STEPS.map((meta) => {
            const r = resolveStep(meta);
            const sizeRem = (
              generated.typography.scale as Record<string, string>
            )[SCALE_KEY[meta.key]];
            // Computed px (at a 16px root) so you can see when the modular
            // ladder lands on awkward values. Show the raw to 1 decimal plus
            // the nearest-2px snap in brackets (19.2 → 20).
            const sizePxRaw = parseFloat(sizeRem) * 16;
            const sizePx = Math.round(sizePxRaw * 10) / 10;
            const sizeRounded = Math.round(sizePxRaw / roundStep) * roundStep;
            return (
              <div
                key={meta.key}
                className="space-y-2 rounded-md border border-border/60 p-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {meta.label}
                    </span>
                    {r.overridden && (
                      <>
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-studio-accent"
                          title={`Overridden from ${BASE_LABEL[r.baseKey]}`}
                          aria-label="Overridden from its base style"
                        />
                        <button
                          type="button"
                          onClick={() => resetStep(meta.key)}
                          title={`Reset to ${BASE_LABEL[r.baseKey]}`}
                          aria-label="Reset to its base style"
                          className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {sizePx}px ({sizeRounded}) · {meta.size}
                  </span>
                </div>
                {/* Live specimen — resolved props + the DRAFT theme's size so
                    the scale picker visibly re-pitches it. */}
                <div
                  className={cn("truncate leading-tight")}
                  style={{
                    fontSize: sizeRem,
                    fontFamily: familyForRole(r.font),
                    fontWeight: r.weight,
                    lineHeight: r.lineHeight,
                    letterSpacing: r.letterSpacing,
                  }}
                >
                  The quick brown fox
                </div>
                {/* Inputs — together with the preview. */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 items-start gap-2">
                    <div className="space-y-1">
                      <Label>Inherits</Label>
                      <Select
                        value={r.baseKey}
                        onValueChange={(v) =>
                          patchStep(meta.key, {
                            inheritsFrom: v as TypeBaseStyleKey,
                          })
                        }
                      >
                        <SelectTrigger size="2xs" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent size="2xs">
                          {STEP_BASE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Weight</Label>
                      <WeightSlider
                        value={r.weight}
                        onChange={(w) => patchStep(meta.key, { weight: w })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label="Line height"
                      value={r.step.lineHeight ?? ""}
                      placeholder={r.lineHeight ?? "inherit"}
                      onChange={(v) =>
                        patchStep(meta.key, { lineHeight: v || undefined })
                      }
                    />
                    <LetterSpacingField
                      value={r.step.letterSpacing ?? ""}
                      onChange={(v) =>
                        patchStep(meta.key, { letterSpacing: v })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
