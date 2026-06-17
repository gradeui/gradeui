"use client";

import * as React from "react";
import { Code } from "@/components/ui/code";
import { ThreeScene } from "@/components/ui/three-scene";
import { ShaderControls } from "@/components/ui/shader-controls";
import type { ControlSpec, DemoState } from "@/lib/three/schema";

// A live, tweakable base embedded in the post: the holographic shader, with
// a colour tweaker wired to ThreeScene's live `palette` (re-tints with no
// remount). Same control renderer as everywhere else in Grade.
const PALETTE_CONTROLS: ControlSpec[] = [
  { type: "color", key: "primary", label: "Primary", default: "#6d5cff", slot: "primary" },
  { type: "color", key: "secondary", label: "Secondary", default: "#22d3ee", slot: "secondary" },
  { type: "color", key: "accent", label: "Accent", default: "#f0abfc", slot: "accent" },
];

function LiveBase() {
  const [pal, setPal] = React.useState({
    primary: "#6d5cff",
    secondary: "#22d3ee",
    accent: "#f0abfc",
    background: "#0b0b14",
  });
  return (
    <div className="grid items-start gap-4 sm:grid-cols-[1fr_220px]">
      <ThreeScene preset="holographic" palette={pal} aspect="video" radius="lg" />
      <div className="rounded-lg border bg-background p-3">
        <ShaderControls
          controls={PALETTE_CONTROLS}
          state={pal as unknown as DemoState}
          labelPosition="above"
          onChange={(k, v) => setPal((p) => ({ ...p, [k]: String(v) }))}
        />
      </div>
    </div>
  );
}

export function Body() {
  return (
    <>
      <p>
        Most shaders ship as a beautiful dead end. You drop a fragment shader
        behind a hero, it looks great, and that is the end of the conversation.
        You cannot theme it, you cannot tweak it without editing GLSL, and you
        certainly cannot ask a model to make you another one that fits. For a
        design system, that is the wrong shape. So when I added generative
        shaders to Grade, the goal was not &ldquo;a nice background&rdquo;. It
        was to make a shader behave like any other part of the system:
        themeable, tweakable, and built from parts.
      </p>

      <h2>Two kinds of part, both finite</h2>
      <p>
        The model that made everything click is that a shader is two kinds of
        thing, and both have a small, bounded set of parameters. There are{" "}
        <strong>base fields</strong>, which produce flowing colour: a mesh
        gradient, fluid metaballs, an aurora, water caustics. And there are{" "}
        <strong>effect layers</strong>, which transform whatever sits beneath
        them: a halftone of dots, an ordered dither, a duotone gradient map,
        scanlines. A &ldquo;preset&rdquo; is then just a saved composition: one
        base plus a short, ordered list of layers, each with its values.
      </p>
      <p>
        That finiteness is the whole trick. A base exposes maybe eight knobs, a
        layer a handful. Nothing is open-ended, which is exactly what makes the
        rest possible. The dozens of entries you would see in a shader gallery
        are not dozens of hand-written shaders. They are a small number of
        bases times a small number of parameterised layers.
      </p>

      <h2>One contract, every surface</h2>
      <p>
        The piece I am proudest of is that a shader&rsquo;s tweakable parameters
        are described exactly once, as a typed schema I call a{" "}
        <code>ControlSpec[]</code>: sliders with ranges, colours that can bind
        to theme slots, segmented choices. That single description does three
        jobs at once.
      </p>
      <ul>
        <li>
          It <strong>generates the uniforms</strong>. The shader author writes
          a <code>main()</code> body that reads <code>uSize</code> or{" "}
          <code>uRamp</code>; the engine declares those uniforms from the
          contract. The shader and its inputs cannot drift apart, because one
          is generated from the other.
        </li>
        <li>
          It <strong>renders the controls</strong>. The same array feeds one
          control-panel component that draws the sliders and swatches. There is
          no per-shader UI to maintain.
        </li>
        <li>
          It is <strong>what generation returns</strong>. When a model writes a
          custom shader, it returns the contract alongside the GLSL, so an
          AI-made shader is just as tweakable and themeable as a hand-authored
          one.
        </li>
      </ul>
      <p>
        Because colour controls bind to theme slots, the shaders re-tint when
        the theme changes, for free. The same mesh gradient reads completely
        differently under a calm theme and a neon one, without touching the
        shader.
      </p>

      <figure>
        <Code
          filename="dots.controls.ts"
          language="tsx"
          size="xs"
          showLineNumbers
          source={`// A layer declares its tweakable parameters once, as a contract.
export const dotsControls: ControlSpec[] = [
  { type: "segmented", key: "shape", label: "Shape",
    options: [{ value: "round" }, { value: "square" }, { value: "line" }],
    default: "round" },
  { type: "slider", key: "size", label: "Size",
    min: 4, max: 48, step: 1, default: 12, unit: "px" },
  { type: "slider", key: "flow", label: "Flow",
    min: 0, max: 1, step: 0.01, default: 0 },
];
// The same array generates the GLSL uniforms AND renders the panel.`}
        />
        <figcaption>
          One contract: the uniforms and the controls both come from this.
        </figcaption>
      </figure>

      <h2>Layers as screen-space passes</h2>
      <p>
        The one real architectural decision was how layers compose. I render
        the base to a buffer, then run each layer as a screen-space pass over
        it, in a fixed order: coordinate, then colour, then treatment, then
        light, then a final grain. A layer author only writes a small function
        over an input colour and a coordinate, plus its contract. The base
        shaders never have to know a layer exists, which means I can stack a
        dither over a fluid or an aurora without editing either.
      </p>

      <h2>The proof: shade your own face</h2>
      <p>
        The clearest demonstration that the layers compose over{" "}
        <em>anything</em> is the capture piece on the homepage. It takes a frame
        from your webcam and treats that frame as an image base, then runs the
        same gradient-map, dots, and dither layers over it. Watching your own
        face turn into a flowing halftone is a better argument for
        composability than any diagram. The captured photo is not special; it
        is just another base the layer stack happens to sit on top of.
      </p>

      <figure>
        <LiveBase />
        <figcaption>
          A live base with a tweaker, embedded in the post. Drag the colours.
        </figcaption>
      </figure>

      <h2>It can never ship a broken shader</h2>
      <p>
        A design system cannot hand someone a black canvas. So nothing reaches
        the screen until it has passed a gate: the fragment is precompiled and
        any error is caught with its log, and a static check confirms every
        uniform the GLSL references is declared by the contract. If a generated
        shader fails, it falls back to the last good one. &ldquo;Broken&rdquo;
        is a hard guarantee. &ldquo;Ugly&rdquo; is the only thing left to
        judgement, and that is what the curated bases and presets are for: they
        are the examples generation learns from.
      </p>

      <h2>Why bother</h2>
      <p>
        The payoff is that a shader stops being a special case. It is a value
        you can store, theme, drop in a share link, hand to a teammate, or ask a
        model to extend, using the same machinery as every other component. That
        is the bar I hold the whole of Grade to: the design system should do
        what the designer says, and everything in it should be a knob.
      </p>
    </>
  );
}
