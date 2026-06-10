/**
 * /docs/tokens/core — documentation for the @gradeui/core package.
 *
 * Documents the PRIMITIVE token layer (what ships in the package, the
 * layering rule, the data API) as distinct from the theme-level token
 * pages alongside it (colors/typography/spacing document the ACTIVE
 * theme's output). Tables render from the GDS_* data itself so the page
 * can't drift from the shipped values.
 *
 * Server component on purpose — everything here is static data.
 */

import Link from "next/link";
import {
  GDS_COLOR_RAMPS,
  GDS_NEUTRALS,
  GDS_SEMANTIC_ALIASES,
  GDS_SPACING,
  GDS_RADIUS,
  GDS_FONT_FAMILIES,
  GDS_TYPE_SCALE,
  GDS_RAMP_NAMES,
  GDS_MODULAR_SCALES,
  modularRamp,
} from "@gradeui/core";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg border bg-muted/50 p-4 text-sm font-mono overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight mt-12 mb-4">
      {children}
    </h2>
  );
}

export default function CoreTokensPage() {
  const ramps = GDS_COLOR_RAMPS as Record<
    string,
    { base?: string; primaryStep?: number; steps: Record<string, string> }
  >;
  const aliases = GDS_SEMANTIC_ALIASES as Record<string, { ramp: string; step: number }>;

  return (
    <div className="max-w-3xl">
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Core package</h1>
      <p className="text-lg text-muted-foreground mt-2">
        <code className="font-mono text-base">@gradeui/core</code> is the primitive token
        layer: the locked vocabulary every Grade theme, component, and generated screen
        builds on. One CSS file, plus the same values as typed data.
      </p>

      <H2 id="layering">The layering rule</H2>
      <p className="leading-7">
        Grade's tokens split into three layers. <strong>Primitives</strong> (the color
        ramps, gray scale, spacing, radii, font stacks, type scale) and{" "}
        <strong>semantic aliases</strong> (<code className="font-mono text-sm">--gds-success</code>{" "}
        pointing into a ramp) live in this package and are component-agnostic.{" "}
        <strong>Component tokens</strong> (<code className="font-mono text-sm">--gds-carousel-*</code>,{" "}
        <code className="font-mono text-sm">--gds-composer-*</code>) deliberately do not — they're
        part of each component's contract and ship with{" "}
        <code className="font-mono text-sm">@gradeui/ui</code>, referencing the layers below.
        Keeping the primitive layer free of component opinions is what makes it consumable
        on its own.
      </p>
      <p className="leading-7 mt-3">
        The ramps are locked as vocabulary: a brand doesn't invent token names, it chooses
        a primary, secondary, and neutral palette — and can override specific ramp steps so
        the values match its own tokens exactly. Overrides are theme data (per project, and
        eventually per screen), never edits to this package. Browse everything visually in
        the <Link href="/variables" className="underline underline-offset-4">variables viewer</Link>.
      </p>

      <H2 id="usage">Usage</H2>
      <CodeBlock>{`/* CSS — the authored source of truth */
@import "@gradeui/core/tokens.css";

/* TypeScript — the same values as data */
import {
  GDS_COLOR_RAMPS,      // ramp → { base, primaryStep, steps: { 50: "#…", … } }
  GDS_NEUTRALS,         // black / white / gray ramp
  GDS_SEMANTIC_ALIASES, // success → { ramp: "green", step: 600 }
  GDS_SPACING,          // --gds-space-* scale
  GDS_RADIUS,           // --gds-radius-* scale
  GDS_FONT_FAMILIES,    // --font-* stacks
  GDS_TYPE_SCALE,       // --text-* ladder
  GDS_MODULAR_SCALES,   // musical-interval ratios for generated ramps
  modularRamp,          // (base, ratio, steps) → number[]
} from "@gradeui/core";`}</CodeBlock>
      <p className="leading-7 mt-3 text-sm text-muted-foreground">
        The data module is generated from tokens.css by{" "}
        <code className="font-mono">scripts/generate-tokens.mjs</code> — edit the CSS, run{" "}
        <code className="font-mono">pnpm -F @gradeui/core generate</code>, and the two can
        never drift.
      </p>

      <H2 id="included">What's included</H2>
      <div className="rounded-xl border divide-y text-sm">
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2 font-medium text-muted-foreground">
          <span>Group</span>
          <span>Variables</span>
          <span className="text-right">Count</span>
        </div>
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2.5">
          <span className="font-medium">Color ramps</span>
          <span className="font-mono text-xs text-muted-foreground">
            --gds-{"{"}{(GDS_RAMP_NAMES as readonly string[]).join(",")}{"}"}-{"{"}50…950{"}"}
          </span>
          <span className="text-right font-mono text-xs">
            {Object.values(ramps).reduce((n, r) => n + Object.keys(r.steps).length + (r.base ? 1 : 0), 0)}
          </span>
        </div>
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2.5">
          <span className="font-medium">Neutrals</span>
          <span className="font-mono text-xs text-muted-foreground">--gds-black, --gds-gray-50…950, --gds-white</span>
          <span className="text-right font-mono text-xs">
            {Object.keys(GDS_NEUTRALS.gray).length + 2}
          </span>
        </div>
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2.5">
          <span className="font-medium">Semantic aliases</span>
          <span className="font-mono text-xs text-muted-foreground">
            {Object.keys(aliases).map((a) => `--gds-${a}`).join(", ")}
          </span>
          <span className="text-right font-mono text-xs">{Object.keys(aliases).length}</span>
        </div>
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2.5">
          <span className="font-medium">Spacing</span>
          <span className="font-mono text-xs text-muted-foreground">--gds-space-1 … --gds-space-24</span>
          <span className="text-right font-mono text-xs">{Object.keys(GDS_SPACING).length}</span>
        </div>
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2.5">
          <span className="font-medium">Radius</span>
          <span className="font-mono text-xs text-muted-foreground">--gds-radius-sm … --gds-radius-full</span>
          <span className="text-right font-mono text-xs">{Object.keys(GDS_RADIUS).length}</span>
        </div>
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2.5">
          <span className="font-medium">Font stacks + slots</span>
          <span className="font-mono text-xs text-muted-foreground">
            {Object.keys(GDS_FONT_FAMILIES).map((k) => `--font-${k}`).join(", ")}
          </span>
          <span className="text-right font-mono text-xs">{Object.keys(GDS_FONT_FAMILIES).length}</span>
        </div>
        <div className="grid grid-cols-[10rem_1fr_4rem] gap-4 px-4 py-2.5">
          <span className="font-medium">Type scale</span>
          <span className="font-mono text-xs text-muted-foreground">--text-display … --text-overline-*</span>
          <span className="text-right font-mono text-xs">{Object.keys(GDS_TYPE_SCALE).length}</span>
        </div>
      </div>

      <H2 id="fonts">Font slots</H2>
      <p className="leading-7">
        Two kinds of font variable. <strong>Stacks</strong> are concrete families:{" "}
        <code className="font-mono text-sm">--font-sans</code> and{" "}
        <code className="font-mono text-sm">--font-mono</code>. <strong>Slots</strong> are
        the roles a theme assigns: <code className="font-mono text-sm">--font-display</code>{" "}
        (headings, heroes) and <code className="font-mono text-sm">--font-body</code> (running
        text). Both slots default to the sans stack; the theme generator already assigns{" "}
        display and body independently from its font catalog, so a theme can pair a serif
        display with a sans body without touching components.
      </p>

      <H2 id="scales">Modular scales (type + size ramps)</H2>
      <p className="leading-7">
        Instead of hand-picking every step, a type or size ramp is <em className="not-italic font-medium">generated</em>{" "}
        middle-out (the Utopia model, utopia.fyi): the body size anchors the middle of the
        ladder, headings multiply up by the ratio, small text multiplies down by the
        reciprocal with a minimum floor. The ladder vocabulary is Tailwind's size names
        with base mid-ladder — 2xs, xs, sm, <strong>base</strong>, lg, xl, 2xl … 7xl — so a
        generated scale can eventually populate the <code className="font-mono text-sm">--text-*</code>{" "}
        variables every Tailwind text utility reads. The ratios carry musical interval
        names because they are those intervals' frequency ratios. Pick a scale in the
        style panel's typography section and the whole hierarchy re-pitches in one move.
      </p>
      <div className="rounded-xl border divide-y text-sm mt-4">
        <div className="grid grid-cols-[9rem_4rem_1fr_14rem] gap-4 px-4 py-2 font-medium text-muted-foreground">
          <span>Scale</span>
          <span>Ratio</span>
          <span>Feel</span>
          <span>1rem base, 6 steps</span>
        </div>
        {GDS_MODULAR_SCALES.map((s) => (
          <div key={s.id} className="grid grid-cols-[9rem_4rem_1fr_14rem] gap-4 px-4 py-2.5">
            <span className="font-medium">{s.label}</span>
            <span className="font-mono text-xs">{s.ratio}</span>
            <span className="text-muted-foreground text-xs">{s.feel}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {modularRamp(1, s.ratio, 6).join(" · ")}
            </span>
          </div>
        ))}
      </div>
      <p className="leading-7 mt-4">
        Scales are also contextual, not one-global-value. The same screen can resolve a
        different scale by <strong>surface kind</strong> (a marketing website wants a
        perfect fourth or fifth; dense app chrome wants a minor third), by{" "}
        <strong>section</strong> (a hero block scaling harder than the settings form below
        it), or responsively via <strong>viewport and container queries</strong> (drop a
        ratio at narrow widths). Because the ladder is generated, switching context means
        swapping one ratio, not re-authoring twenty variables. The same mechanism applied
        to spacing and control sizing is Grade's <strong>density scale</strong> — website
        vs app, comfortable vs dense, one ratio per view. This lands with the theme
        engine's scale rework; the current <code className="font-mono text-sm">--text-*</code>{" "}
        ladder is a hand-tuned ramp close to a major third.
      </p>

      <H2 id="overrides">Overrides and what's next</H2>
      <p className="leading-7">
        Planned on top of this package: per-step ramp overrides in the{" "}
        <Link href="/variables" className="underline underline-offset-4">variables viewer</Link>{" "}
        (scoped per project, then per screen), hue-pick for the primary palette (the theme
        generator is already hue-based — picking a hue regenerates the whole primary ramp),
        palette extraction from an uploaded screenshot, and Figma variables sync. The data
        exports on this page are the substrate for all of them.
      </p>
    </div>
  );
}
