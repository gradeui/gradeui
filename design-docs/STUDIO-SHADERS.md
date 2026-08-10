# STUDIO-SHADERS.md — the shader system: base fields, composable layers, contracts

This is the source of truth for how Grade's generative shaders work: what a shader *is*, how it is parameterised, how shaders compose, and how the same contract drives both the tweak UI and AI generation. Sibling to [`STUDIO-FILLS.md`](./STUDIO-FILLS.md) (a shader is a *fill type*; this doc is what's inside that fill) and [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (shaders read theme tokens through their colour params).

If anyone asks "how do shaders work / how do we add or tweak one / how does a generated shader stay safe?", this is the answer. The **build plan** (how to write a layer, how to test it, how to execute the work) lives in its companion [`STUDIO-SHADERS-PRD.md`](./STUDIO-SHADERS-PRD.md).

## The core idea: a finite, composable parameter space

Every shader in Grade is built from two kinds of part, and both have **finite, bounded parameters**. That boundedness is the whole point: it is what makes shaders tweakable, themeable, generatable, and safe.

1. A **base field**: a fullscreen fragment shader that produces a colour (and an implicit intensity) per pixel. The flowing source. Examples: mesh gradient, fluid, aurora, caustics.
2. Zero or more **effect layers**: composable overlays that transform either the coordinates or the colour of whatever sits beneath them. Examples: dots/halftone, dither, refraction, bloom, grain.

A **preset is a saved composition**: one base plus a short, ordered list of layers, each with its parameter values.

```ts
{ base: "fluid", layers: [ { id: "dots", params: {...} }, { id: "grain", params: {...} } ] }
```

The dozens of entries you see in a shader gallery are not dozens of bespoke shaders. They are a small number of base fields times a small number of parameterised layers, saved as compositions. "Retro Pop" is a warm base plus a static angled Dots layer. "Halftone Swirl" is a dark base plus Dots. "Lava with a pixel dither" is the fluid base plus Dither. The variety is combinatorial, the building blocks are few.

## Why this is tractable (the finite-parameter point)

A base field exposes on the order of 6 to 10 knobs (speed, scale, a few colours bound to theme slots, a couple of shape controls, a grain amount). A layer exposes a similar handful. There is no open-ended surface: a composition is a base id, an ordered list of layer ids, and a flat bag of named values. That means:

- The UI can be **generated** from the parameter list, never hand-built per shader.
- A composition can be **serialised** into a share link, an embed, or a row in the database, and replayed exactly.
- An LLM only has to choose values inside known ranges and pick layers from a known set, which is a constrained problem we can validate, not an open one we have to trust.

## The contract: one schema, every surface

A shader's tweakable parameters are described by a `ControlSpec[]` (the canonical schema in `packages/ui/lib/three/schema.ts`). The control types are already defined and in use: `slider`, `color` (with an optional `slot` binding it to a theme palette slot), `colorList`, `toggle`, `select`, `segmented`, `divider`. A flat `DemoState` (`Record<string, number | string | boolean | string[]>`) holds the current values, keyed by each control's `key`.

This one schema is the through line:

- **Uniforms.** `buildFragmentShaderScene(glsl, controls)` auto-generates a GLSL uniform per non-divider control (key `coolTone` becomes `uCoolTone`, a colour list becomes `uRamp[N]` plus `uRampCount`), seeds them from defaults, and exposes `setParams()` for live updates with no remount. Colours map to `vec3`, sliders and toggles and selects to `float`, colour lists to `vec3[]`. The shader author writes the `main()` body and references the uniforms; the author never declares them.
- **The tweak panel** is rendered from the same `ControlSpec[]` (today `ShaderControls`, becoming `ControlPanel` plus `ControlPanelItem`, see below). One control list, one panel, every shader.
- **Generation** returns a `ControlSpec[]` next to the GLSL. Same schema, same uniforms, same panel.

Because the contract generates the uniform declarations, there is no way for the declared params and the shader's uniforms to drift apart. That removes the largest class of failure before it can happen.

## The pipeline order (layers run in a fixed sequence)

Layers are not arbitrary. They sit at known stages, and the order is fixed so the result is predictable:

1. **Coordinate** layers bend space before anything samples it: Kaleidoscope, Refraction.
2. **Colour** layers remap the field's colour: Gradient map, Posterize.
3. **Treatment** layers decide how the field is drawn: Dots/Halftone, Dither.
4. **Light** layers do the optical finish: Bloom, Chromatic, Vignette.
5. **Finish**: Grain, always last.

A composition lists layers in this order. The UI offers them grouped the same way.

## Base fields (the source)

These produce flowing colour. Built and live today (each with its own contract): mesh gradient, fluid (lava-lamp metaballs), aurora, water caustics, waves, plasma, voronoi, vortex, concentric, ribbon, spectral bloom, glass, holographic. (`halftone`, `digital`, `grain`, `flowing-dots` shipped as interim base presets and fold into layers under this model, see below.)

The quality bar for a base is the homepage shader (`apps/docs/components/marketing/marketing-background.tsx`): a domain-warped fbm mesh gradient with roughly nine meaningful knobs, theme-derived colours, and soft pointer response. Every base should expose that order of tweakability.

## Effect layers (the composable catalog)

A curated, readable set. Each does exactly one thing, carries its own contract, and stacks over any base. Parameters listed are the finite knob set per layer.

### Coordinate
- **Kaleidoscope**: mirror / symmetry fold. Params: segments, rotation, centre.
- **Refraction** (the glass effect, generalised): an fbm height field that distorts what's beneath. Params: strength, scale, chroma split, frost. This is why glass is a layer, not only a base.

### Colour
- **Gradient map** (highest priority to build): remap the field's luminance through a palette ramp, which makes any field theme-reactive and is how the brand palette flows through any treatment. Params: ramp (colour list), contrast, offset.
- **Posterize**: collapse to N hard bands. Params: levels, smoothness.

### Treatment
- **Dots / Halftone** (unifies `halftone` and `flowing-dots`): render the field as a dot grid. Params: shape (round / square / line), size, angle, spacing, flow (0 = static halftone grid, up = flowing dots), softness, jitter. Flowing dots is this layer with flow on; halftone pop is this layer static at an angle.
- **Dither**: quantise through an ordered (Bayer) or blue-noise pattern. Params: pattern, levels, pixel scale, strength. The retro / pixel look.

### Light
- **Bloom**: bright areas bleed. Params: threshold, intensity, radius.
- **Chromatic**: RGB split at the edges. Params: amount, radial vs directional.
- **Vignette**: darken or lift the edges. Params: amount, softness, roundness.

### Finish
- **Grain**: animated film grain, always last. Params: amount, size, mono vs colour.

Note: Bloom, Chromatic, Vignette, and Grain already exist in the post-FX composer (`PostPreset` in `packages/ui/lib/three/types.ts`, plus `post-composer.ts` and `post-controls.ts`). Those layers are mostly a re-wrap of existing passes through the `EffectLayerSpec` contract, not new GLSL. The new GLSL work is Dots, Dither, Gradient map, Refraction-as-layer, Kaleidoscope, Posterize.

## How the existing presets fold in

- `flowing-dots` + `halftone` become one **Dots** layer (flow on vs flow off, plus angle). The two ship as presets of that layer.
- `grain` becomes the **Grain** layer.
- `glass` stays as a base and also informs the **Refraction** layer.
- `digital` loses its central ring and dead hole; the cell-activity field is better expressed as a grid base plus a Dither or Scanline treatment, or dropped. (Ring removal is the "sort a afterwards" item.)

## Mouse reactivity

Pointer response (X, Y, pointer distance) is a per-shader and per-layer **toggle plus amount**, not always-on. Bases and layers that react to the cursor expose a `mouse` control so a static export, an embed, or a reduced-motion context can switch it off.

## The "never a broken shader" guarantee

Broken and ugly are different problems and only one is guaranteeable.

- **Broken** (won't compile, type mismatch, undeclared uniform, NaN, black canvas) is a hard invariant. Nothing reaches the preview until it has passed: (1) the compile gate, `buildFragmentShaderScene` precompiles and throws `ShaderCompileError` with the GL log; and (2) the contract lint, a static check that every `u<Word>` the GLSL references maps to a contract key or the fixed header set (`uTime`, `uResolution`, `uMouse`, `uPrimary`, `uSecondary`, `uAccent`, `uBackground`). On failure after repair retries, it falls back to the last good composition. The gate sits between generation and display, so a broken shader is never shown.
- **Ugly** (compiles, clean contract, looks like mud) is not checkable. It is bounded upstream: the curated base and layer set, the standard presets as few-shot exemplars (the `STUDIO-LEARNING.md` corpus), and a preview-before-commit step. Worst case is "meh", never "broken".

This validation harness (compile gate plus contract lint) belongs in the shader-authoring skill so the same checks cover hand-authored and AI-generated shaders.

## UI surfaces

- **ControlPanel / ControlPanelItem**: abstract the tweak UI out of `ShaderControls` into a reusable pair that renders any `ControlSpec[]`. Reconcile with the Studio right panel's existing `Field` components so every control looks identical across Studio, the docs, and the homepage. The panel stacks a base section plus one section per layer.
- **Homepage switcher / showcase**: a "show off" mirroring the existing theme-switcher embed (built via gradedev-ui): a scrolling preset panel, a preview area, a palette chooser, and a live tweaker. Distinct from the existing marketing background tweaker.
- **Params as component props**: the composition (base, layers, values) becomes real props on the component so a share link or an embed carries the tweaks. Same payload the gallery saves.

## What's built (June 2026)

- **Param-contract engine**, clean in both `packages/ui` and `apps/docs`: `SceneHandle.setParams` (types.ts), and `buildFragmentShaderScene(glsl, controls?)` generating uniforms from the contract plus live `setParams` (custom-fragment.ts: `paramUniformName`, `paramUniformDeclarations`, `safeColor`).
- **Eleven base shaders live and validated** in the picker, theme-reactive, each with a contract: glass, holographic, fluid, aurora, caustics, ribbon, concentric, vortex, spectral, halftone, digital (the last two are interim, see fold-in).
- **WebGL context-loss fix**: `ThreeScene.releaseOffscreen` plus a global LRU context budget (`MAX_LIVE_CONTEXTS = 12`) so a dense gallery never exceeds the browser's roughly 16-context cap. A live `WebGLRenderer` holds a context for its whole lifetime; offscreen scenes release theirs and rebuild on return.

## Phased rollout

- **L0 (done)**: param-contract engine, the standard base shaders, context budget.
- **L1**: wire `shaderParams` and `paletteMode` (default / bright / custom) through `ThreeScene`; auto-derive a vivid "bright" palette from brand (oklch chroma boost plus hue spread), overridable. Live tweak panel so each shader is an interactive mini-playground.
- **L2**: `ControlPanel` / `ControlPanelItem`, reconciled with Studio's `Field` controls.
- **L3**: composable effect layers (Dots, Gradient map, Dither, then the rest); presets become compositions; fold halftone / grain / flowing-dots into layers; fix digital grid.
- **L4**: homepage shader showcase / switcher embed; params as component props for share links and embeds.
- **L5**: the `grade-shader-pipeline` skill (scaffold a base or layer plus its contract, registry wiring, docs) hosting the compile-gate and contract-lint harness; generated shaders return a contract. The skill is **summonable from more than one surface**: as a Cowork / Claude Code skill, as an **MCP tool an agent calls** (generate-and-validate a shader or layer, returning GLSL plus contract that has already passed the gate), and from the **Studio UI** (a "new shader" affordance that runs the same pipeline). One harness, three entry points, mirroring the three deployment modes in `STUDIO-LEARNING.md`.

## The shader skill (one pipeline, many entry points)

The authoring-and-validation pipeline (scaffold, parse, contract-lint, compile-gate, register) is written once and exposed wherever an agent or a person needs it:

- **Cowork / Claude Code skill**: a developer runs it locally to add a base or layer.
- **MCP tool**: an external agent calls it over MCP. Input is a description plus optional constraints; output is a base or layer's GLSL body plus its `ControlSpec[]`, already through the compile-gate and lint, so the caller never receives a broken shader. This is the "generated shaders return a contract" guarantee delivered as a tool.
- **Studio UI**: a "new shader" / "new layer" action in Studio invokes the same pipeline so non-developers get the same validated result inside the product.

The key invariant across all three: the gate (section "The never a broken shader guarantee") is part of the skill, not the caller. No entry point can hand back a shader that has not compiled and passed the contract lint.

## File map

- `packages/ui/lib/three/schema.ts`: `ControlSpec`, `DemoState`, getters. The contract types.
- `packages/ui/lib/three/custom-fragment.ts`: `buildFragmentShaderScene`, the param-to-uniform engine.
- `packages/ui/lib/three/scenes/fragment-scenes.ts`: base field GLSL plus each base's `*Controls` contract.
- `packages/ui/lib/three/shader-presets.ts`: the registry (`sceneRegistry`, `shaderPresets`) re-exporting each contract as `preset.controls`.
- `packages/ui/lib/three/types.ts`: `SceneHandle` (incl. `setParams`), `Palette`, `PostPreset`, `EffectLayerSpec` (the layer contract), `ShaderPreset`.
- `packages/ui/lib/three/post-composer.ts`, `post-controls.ts`, `post-presets.ts`: the existing post-FX stack the light and grain layers re-wrap.
- `packages/ui/components/ui/shader-controls.tsx`: the current panel renderer, becoming `ControlPanel`.
- `apps/docs/...`: the vendored mirror of all of the above (kept in sync until the docs site imports from `@gradeui/ui`).

## See also

- `STUDIO-FILLS.md`: a shader is a fill of a frame; the `FillValue` shape and the `FillPicker`.
- `STUDIO-THEMES.md`: what a token is; shader colour params bind to theme slots.
- `STUDIO-LEARNING.md`: the corpus and exemplars that bound generation quality.
