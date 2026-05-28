import { ComponentNav } from "@/components/component-nav";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/components/component-preview";

/**
 * Presence — the live token visualiser for the Elevation / Surface /
 * Aura systems. Every section renders real elements with the actual
 * tokens applied, so it doubles as the source-of-truth reference and
 * the in-browser way to inspect what the tokens look like today.
 *
 * When themes change (user-defined or library), this page is the
 * fastest way to verify the new tokens "land" — every variant is
 * visible at once. It's also the substrate for the future theme
 * builder modal's right-hand "live preview" column.
 */
export default function PresencePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Presence</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Three parallel token systems — Elevation (how high), Surface (what it&apos;s made of),
          Aura (what it&apos;s radiating). See <code className="bg-muted px-1 py-0.5 rounded text-sm">PRESENCE.md</code>{" "}
          for the design rationale.
        </p>
      </div>

      {/* ──────────────── ELEVATION ──────────────── */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Elevation
        </h2>
        <p className="text-sm text-muted-foreground">
          Six levels from flat (0) to dialog (5). Same elements, different elevation token.
        </p>

        <ComponentPreview
          code={`<div className="shadow-elevation-1 rounded-lg bg-card p-6">elevation-1</div>
<div className="shadow-elevation-2 rounded-lg bg-card p-6">elevation-2</div>
<div className="shadow-elevation-3 rounded-lg bg-card p-6">elevation-3</div>
<div className="shadow-elevation-4 rounded-lg bg-card p-6">elevation-4</div>
<div className="shadow-elevation-5 rounded-lg bg-card p-6">elevation-5</div>`}
        >
          {/* Class strings are written out literally (no template-string
              interpolation) so Tailwind's JIT picks them up at build
              time. `shadow-elevation-${level}` would be invisible to
              the scanner and silently produce flat cards in prod. */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-background rounded-lg w-full">
            {(
              [
                ["shadow-elevation-0", "--elevation-0", "flat"],
                ["shadow-elevation-1", "--elevation-1", "minimal (inputs)"],
                ["shadow-elevation-2", "--elevation-2", "interactive"],
                ["shadow-elevation-3", "--elevation-3", "raised key"],
                ["shadow-elevation-4", "--elevation-4", "popover"],
                ["shadow-elevation-5", "--elevation-5", "dialog"],
              ] as const
            ).map(([shadowClass, token, label]) => (
              <div
                key={token}
                className={`${shadowClass} bg-card rounded-lg p-4 flex flex-col gap-1`}
              >
                <div className="text-xs font-mono text-muted-foreground">{token}</div>
                <div className="text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium mt-4">State variants on raised surfaces</h3>
        <ComponentPreview
          code={`<Button variant="raised">Rest (elevation-3)</Button>
<Button variant="raised" className="!shadow-hot">Hover (elevation-hot)</Button>
<Button variant="raised" className="!shadow-pressed">Press (elevation-pressed)</Button>`}
        >
          <div className="flex flex-wrap items-center gap-3 p-6 bg-background rounded-lg">
            <Button variant="raised">Rest</Button>
            <Button variant="raised" className="!shadow-hot">
              Hover
            </Button>
            <Button variant="raised" className="!shadow-pressed translate-y-px">
              Pressed
            </Button>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium mt-4">Single-layer atoms</h3>
        <p className="text-sm text-muted-foreground -mt-2">
          When you need to compose your own stack — bevel-only / lift-only / heat-only.
        </p>
        <ComponentPreview
          code={`<div className="shadow-bevel-hi bg-secondary rounded-md p-4">bevel-hi</div>
<div className="shadow-lift bg-card rounded-md p-4">lift</div>
<div className="shadow-heat-outer bg-card rounded-md p-4">heat-outer</div>`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-background rounded-lg">
            {[
              ["shadow-bevel-hi", "bg-secondary"],
              ["shadow-bevel-lo", "bg-secondary"],
              ["shadow-contact", "bg-card"],
              ["shadow-lift", "bg-card"],
              ["shadow-lift-deep", "bg-card"],
              ["shadow-heat-inner", "bg-secondary"],
              ["shadow-heat-outer", "bg-card"],
            ].map(([cls, bg]) => (
              <div
                key={cls}
                className={`${cls} ${bg} rounded-md p-4 flex flex-col gap-1`}
              >
                <div className="text-xs font-mono text-muted-foreground">
                  {cls.replace("shadow-", "--shadow-")}
                </div>
              </div>
            ))}
          </div>
        </ComponentPreview>
      </section>

      {/* ──────────────── SURFACE ──────────────── */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Surface
        </h2>
        <p className="text-sm text-muted-foreground">
          What the surface is made of. Theme-aware — each theme&apos;s <code className="bg-muted px-1 py-0.5 rounded text-xs">--card</code>{" "}
          drives the glass tint automatically.
        </p>

        <ComponentPreview
          code={`<div className="gds-surface-solid p-6 rounded-lg">solid</div>
<div className="gds-surface-translucent p-6 rounded-lg">translucent</div>
<div className="gds-surface-glass p-6 rounded-lg">glass</div>
<div className="gds-surface-glass-strong p-6 rounded-lg">glass-strong</div>`}
        >
          {/* Patterned backdrop so translucent / glass surfaces have
              something visible to blur through. */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-lg"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, oklch(var(--selected) / 0.45) 0px, transparent 180px), radial-gradient(circle at 80% 70%, oklch(var(--warning) / 0.35) 0px, transparent 200px), radial-gradient(circle at 50% 50%, oklch(var(--success) / 0.30) 0px, transparent 220px)",
              backgroundColor: "oklch(var(--background))",
            }}
          >
            <div className="gds-surface-solid rounded-md p-4 shadow-elevation-2">
              <div className="text-xs font-mono text-muted-foreground">solid</div>
              <div className="text-sm font-medium mt-1">100% opacity</div>
            </div>
            <div className="gds-surface-translucent rounded-md p-4 shadow-elevation-2">
              <div className="text-xs font-mono text-muted-foreground">translucent</div>
              <div className="text-sm font-medium mt-1">82% opacity</div>
            </div>
            <div className="gds-surface-glass rounded-md p-4 shadow-elevation-4">
              <div className="text-xs font-mono text-muted-foreground">glass</div>
              <div className="text-sm font-medium mt-1">58% + blur</div>
            </div>
            <div className="gds-surface-glass-strong rounded-md p-4 shadow-elevation-4">
              <div className="text-xs font-mono text-muted-foreground">glass-strong</div>
              <div className="text-sm font-medium mt-1">42% + 24px blur</div>
            </div>
          </div>
        </ComponentPreview>
      </section>

      {/* ──────────────── AURA ──────────────── */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Aura
        </h2>
        <p className="text-sm text-muted-foreground">
          State signals — &quot;Studio is looking at this&quot;, &quot;AI is generating&quot;,
          &quot;ready for input&quot;. Three composable styles. Tone defaults to{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">--selected-glow</code>;
          override per-element via <code className="bg-muted px-1 py-0.5 rounded text-xs">--aura-color</code>.
        </p>

        <ComponentPreview
          code={`<div className="gds-aura-ring p-6 rounded-lg">ring</div>
<div className="gds-aura-gradient p-6 rounded-lg">gradient</div>
<div className="gds-aura-shimmer p-6 rounded-lg">shimmer</div>
<div className="gds-aura-ring gds-aura-shimmer p-6 rounded-lg">ring + shimmer</div>`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-background rounded-lg">
            <div className="gds-aura-ring bg-card rounded-lg p-4 shadow-elevation-2 min-h-24 flex flex-col justify-between">
              <div className="text-xs font-mono text-muted-foreground">aura-ring</div>
              <div className="text-sm font-medium">pulsing halo</div>
            </div>
            <div className="gds-aura-gradient bg-card rounded-lg p-4 shadow-elevation-2 min-h-24 flex flex-col justify-between">
              <div className="text-xs font-mono text-muted-foreground">aura-gradient</div>
              <div className="text-sm font-medium">rotating border</div>
            </div>
            <div className="gds-aura-shimmer bg-card rounded-lg p-4 shadow-elevation-2 min-h-24 flex flex-col justify-between">
              <div className="text-xs font-mono text-muted-foreground">aura-shimmer</div>
              <div className="text-sm font-medium">diagonal sweep</div>
            </div>
            <div className="gds-aura-ring gds-aura-shimmer bg-card rounded-lg p-4 shadow-elevation-2 min-h-24 flex flex-col justify-between">
              <div className="text-xs font-mono text-muted-foreground">ring + shimmer</div>
              <div className="text-sm font-medium">stacked</div>
            </div>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium mt-4">Tonal override</h3>
        <ComponentPreview
          code={`<Button variant="raised" className="gds-aura-ring"
        style={{ "--aura-color": "var(--success)" } as React.CSSProperties}>
  Ready
</Button>`}
        >
          <div className="flex flex-wrap items-center gap-4 p-6 bg-background rounded-lg">
            <Button
              variant="raised"
              className="gds-aura-ring"
              style={{ ["--aura-color" as never]: "var(--success)" }}
            >
              Ready
            </Button>
            <Button
              variant="raised"
              className="gds-aura-ring"
              style={{ ["--aura-color" as never]: "var(--warning)" }}
            >
              Attention
            </Button>
            <Button
              variant="raised"
              className="gds-aura-ring"
              style={{ ["--aura-color" as never]: "var(--destructive)" }}
            >
              Alert
            </Button>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium mt-4">Per-instance timing override</h3>
        <p className="text-sm text-muted-foreground -mt-2">
          Slow the pulse on a heavy element by overriding the duration locally — no keyframe rewrite.
        </p>
        <ComponentPreview
          code={`<Button variant="raised" className="gds-aura-ring"
        style={{ "--aura-pulse-duration": "4s" } as React.CSSProperties}>
  Slow pulse
</Button>`}
        >
          <div className="flex flex-wrap items-center gap-4 p-6 bg-background rounded-lg">
            <Button
              variant="raised"
              className="gds-aura-ring"
              style={{ ["--aura-pulse-duration" as never]: "1.2s" }}
            >
              1.2s
            </Button>
            <Button
              variant="raised"
              className="gds-aura-ring"
              style={{ ["--aura-pulse-duration" as never]: "2.4s" }}
            >
              2.4s (default)
            </Button>
            <Button
              variant="raised"
              className="gds-aura-ring"
              style={{ ["--aura-pulse-duration" as never]: "4s" }}
            >
              4s
            </Button>
          </div>
        </ComponentPreview>
      </section>

      {/* ──────────────── COMPOSITION ──────────────── */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Composition
        </h2>
        <p className="text-sm text-muted-foreground">
          Elevation + Surface + Aura combine independently. A Studio AI-suggestion card is{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">shadow-elevation-4</code> +{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">gds-surface-glass</code> +{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">gds-aura-ring</code>.
        </p>
        <ComponentPreview
          code={`<div className="shadow-elevation-4 gds-surface-glass gds-aura-ring rounded-lg p-6">
  AI is suggesting a layout
</div>`}
        >
          <div
            className="p-10 rounded-lg"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, oklch(var(--selected) / 0.45) 0px, transparent 200px), radial-gradient(circle at 70% 70%, oklch(var(--warning) / 0.30) 0px, transparent 220px)",
              backgroundColor: "oklch(var(--background))",
            }}
          >
            <div className="shadow-elevation-4 gds-surface-glass gds-aura-ring rounded-lg p-6 max-w-md">
              <div className="text-xs font-mono text-muted-foreground mb-2">
                shadow-elevation-4 · gds-surface-glass · gds-aura-ring
              </div>
              <div className="text-sm font-medium mb-1">
                Studio is suggesting a layout
              </div>
              <div className="text-sm text-muted-foreground">
                Glass surface lets the canvas show through, ring aura signals AI
                attention, elevation-4 floats it above the page.
              </div>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <ComponentNav currentHref="/components/presence" />
    </div>
  );
}
