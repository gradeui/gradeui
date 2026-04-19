"use client";

import { useRampTheme } from "@/components/ramp-theme-provider";
import type { Ramp } from "@/lib/themes";
import { useOklchHexes, formatOklch } from "@/lib/themes/oklch-to-hex";

/**
 * Color tokens page — fully theme-aware. Pulls ramps + semantic tokens
 * from the active theme via useRampTheme(). Swap themes in the nav and
 * every swatch + table row re-renders with the new palette.
 */

const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

interface SemanticRow {
  token: string;
  usage: string;
  cssVar: string;
}

const semanticRows: SemanticRow[] = [
  { token: "background", usage: "Page background", cssVar: "--background" },
  { token: "foreground", usage: "Primary text", cssVar: "--foreground" },
  { token: "card", usage: "Elevated surface background", cssVar: "--card" },
  { token: "card-foreground", usage: "Text on card", cssVar: "--card-foreground" },
  { token: "primary", usage: "Primary actions, links", cssVar: "--primary" },
  { token: "primary-foreground", usage: "Text on primary", cssVar: "--primary-foreground" },
  { token: "secondary", usage: "Secondary surfaces", cssVar: "--secondary" },
  { token: "secondary-foreground", usage: "Text on secondary", cssVar: "--secondary-foreground" },
  { token: "muted", usage: "Muted backgrounds", cssVar: "--muted" },
  { token: "muted-foreground", usage: "Subtle text", cssVar: "--muted-foreground" },
  { token: "accent", usage: "Hover states, highlights", cssVar: "--accent" },
  { token: "accent-foreground", usage: "Text on accent", cssVar: "--accent-foreground" },
  { token: "border", usage: "Default borders", cssVar: "--border" },
  { token: "input", usage: "Form input borders", cssVar: "--input" },
  { token: "ring", usage: "Focus ring", cssVar: "--ring" },
];

const fixedSemanticRows: SemanticRow[] = [
  { token: "destructive", usage: "Destructive actions, errors", cssVar: "--destructive" },
  { token: "success", usage: "Success states", cssVar: "--success" },
  { token: "warning", usage: "Warning states", cssVar: "--warning" },
  { token: "info", usage: "Informational states", cssVar: "--info" },
  { token: "highlight", usage: "Emphasis, new features", cssVar: "--highlight" },
];

function RampSwatches({
  name,
  description,
  ramp,
  hue,
}: {
  name: string;
  description: string;
  ramp: Ramp;
  hue: number;
}) {
  const triplets = RAMP_STEPS.map((step) => ramp[step]);
  const hexes = useOklchHexes(triplets);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-lg font-medium">{name}</h3>
        <span className="text-xs text-muted-foreground font-mono">
          hue {Math.round(hue)}°
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
        {RAMP_STEPS.map((step, i) => {
          const triplet = triplets[i];
          const hex = hexes[i] ?? "";
          return (
            <div key={step} className="space-y-1.5">
              <div
                className="h-10 w-full rounded-md border border-border cursor-help"
                style={{ background: `oklch(${triplet})` }}
                title={`oklch(${formatOklch(triplet)})${hex ? ` · ${hex}` : ""}`}
              />
              <div className="text-xs">
                <div className="font-medium">{step}</div>
                <div className="text-muted-foreground font-mono text-[10px]">
                  {hex || "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 5-stop chart palette swatch row with hex readout + OKLCH tooltip.
 */
function ChartPaletteSwatches({
  chart,
}: {
  chart: { 1: string; 2: string; 3: string; 4: string; 5: string };
}) {
  const triplets = [1, 2, 3, 4, 5].map((i) => chart[i as 1]);
  const hexes = useOklchHexes(triplets);
  return (
    <div className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((i, idx) => {
        const triplet = triplets[idx];
        const hex = hexes[idx] ?? "";
        return (
          <div key={i} className="space-y-1.5">
            <div
              className="h-12 w-full rounded-md border border-border cursor-help"
              style={{ background: `oklch(${triplet})` }}
              title={`oklch(${formatOklch(triplet)})${hex ? ` · ${hex}` : ""}`}
            />
            <div className="text-xs">
              <div className="font-medium">chart-{i}</div>
              <div className="text-muted-foreground font-mono text-[10px]">
                {hex || "—"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Semantic-token / fixed-semantic table row with hex lookup + tooltip.
 */
function SemanticRows({ rows, tokens }: { rows: SemanticRow[]; tokens: Record<string, string> }) {
  const triplets = rows.map((r) => tokens[r.token] ?? "");
  const hexes = useOklchHexes(triplets);
  return (
    <>
      {rows.map((row, i) => {
        const triplet = triplets[i];
        const hex = hexes[i] ?? "";
        return (
          <tr key={row.token} className="border-t">
            <td className="p-3 font-mono text-xs">{row.cssVar}</td>
            <td className="p-3 text-muted-foreground">{row.usage}</td>
            <td className="p-3">
              <div
                className="h-6 w-6 rounded border border-border cursor-help"
                style={{ background: `oklch(${triplet})` }}
                title={`oklch(${formatOklch(triplet)})${hex ? ` · ${hex}` : ""}`}
              />
            </td>
            <td className="p-3 font-mono text-xs text-muted-foreground">
              {hex || "—"}
            </td>
          </tr>
        );
      })}
    </>
  );
}

export default function ColorsPage() {
  const { theme } = useRampTheme();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Colors</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Every color in Ramp DS comes from the active theme&apos;s three-hue
          OKLCH generator. Switch themes in the top nav to see these update
          live.
        </p>
      </div>

      {/* Active theme header */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 overflow-hidden rounded-md border border-border">
            <div className="h-10 w-4" style={{ background: `oklch(${theme.ramps.primary[500]})` }} />
            <div className="h-10 w-4" style={{ background: `oklch(${theme.ramps.accent[500]})` }} />
            <div className="h-10 w-4" style={{ background: `oklch(${theme.ramps.neutral[500]})` }} />
          </div>
          <div>
            <div className="text-sm font-medium">{theme.name}</div>
            <div className="text-xs text-muted-foreground">
              {theme.description} · intensity: {theme.input.intensity ?? "default"}
            </div>
          </div>
        </div>
      </div>

      {/* Ramps */}
      <section className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Ramps
        </h2>
        <p className="leading-7">
          Three 11-stop OKLCH ramps are generated from the theme&apos;s hues.
          Every component color resolves back to one of these stops.
        </p>

        <RampSwatches
          name="Neutral"
          description="Backgrounds, borders, text. Subtly tinted toward the neutral hue for warmth or coolness."
          ramp={theme.ramps.neutral}
          hue={theme.input.hues.neutral}
        />

        <RampSwatches
          name="Primary"
          description="Brand color. Used for primary actions, links, focus rings, and the default button."
          ramp={theme.ramps.primary}
          hue={theme.input.hues.primary}
        />

        <RampSwatches
          name="Accent"
          description="Secondary brand color. Used for accents, highlights, and a second visual thread."
          ramp={theme.ramps.accent}
          hue={theme.input.hues.accent}
        />
      </section>

      {/* Semantic tokens */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Semantic tokens
        </h2>
        <p className="leading-7">
          Purpose-based tokens derived from the ramps above. These swap values
          per brightness mode automatically.
        </p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Token</th>
                <th className="text-left p-3 font-medium">Usage</th>
                <th className="text-left p-3 font-medium">Swatch</th>
                <th className="text-left p-3 font-medium">Hex</th>
              </tr>
            </thead>
            <tbody>
              <SemanticRows
                rows={semanticRows}
                tokens={theme.colors.light as unknown as Record<string, string>}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Fixed semantic colors */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Fixed semantic colors
        </h2>
        <p className="leading-7">
          Status colors are deliberately <em>not</em> hue-derived — they stay
          consistent across themes so users always read green as success, red
          as destructive, etc. Accessibility wins over brand cohesion here.
        </p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Token</th>
                <th className="text-left p-3 font-medium">Usage</th>
                <th className="text-left p-3 font-medium">Swatch</th>
                <th className="text-left p-3 font-medium">Hex</th>
              </tr>
            </thead>
            <tbody>
              <SemanticRows
                rows={fixedSemanticRows}
                tokens={theme.colors.light as unknown as Record<string, string>}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Chart palette */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Chart palette
        </h2>
        <p className="leading-7">
          A 5-stop categorical palette derived from the theme&apos;s hues.
          Primary leads, then two well-separated hue rotations, neutral as a
          quiet step, and accent closes — each adjacent slot is visibly
          distinct. Use via{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            var(--chart-1)
          </code>
          …
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            var(--chart-5)
          </code>{" "}
          or Tailwind utilities{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">bg-chart-1</code>.
        </p>
        <ChartPaletteSwatches chart={theme.chart} />
      </section>

      {/* Usage */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre>
            <code>{`{/* Semantic tokens — adapt to active theme + mode */}
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="bg-card text-card-foreground" />

{/* With opacity (Tailwind shortcut, works with any color) */}
<div className="bg-primary/50 hover:bg-primary/80" />
<div className="border-border/40" />

{/* Fixed semantic status colors */}
<div className="bg-success text-success-foreground" />
<div className="bg-destructive" />
<div className="text-warning" />

{/* Chart palette (generator-derived) */}
<Bar dataKey="x" fill="var(--chart-1)" />
<Bar dataKey="y" fill="var(--chart-2)" />`}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}
