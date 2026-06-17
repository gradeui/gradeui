# STUDIO-SHADERS-PRD.md — build plan for the composable shader system

Execution PRD for the architecture in [`STUDIO-SHADERS.md`](./STUDIO-SHADERS.md). This doc is written to be built from directly: it fixes the one architectural decision that everything hangs off (how layers compose), gives a copy-paste recipe for writing a base and a layer, defines the test harness that gates every shader, and breaks the work into ordered tasks with acceptance criteria so it can be parallelised.

## 1. Goals and non-goals

Goals:
- Ship a composition model: a shader is `{ base, layers[] }`, each part contract-driven and finite.
- One rendering model for everything, reusing the existing post-FX composer.
- Every base and every layer is tweakable through an auto-generated panel and serialisable into a share link or embed.
- A validation harness so a broken shader can never reach the screen.

Non-goals (explicitly out of scope for this build):
- Authoring brand-new base fields beyond what exists (the eleven are enough to prove composition).
- The homepage switcher UI (separate task, L4, depends on this landing).
- AI generation of layers (L5, depends on the lint harness landing here).

## 2. The one decision: layers are screen-space passes

Layers compose as **screen-space post passes in the existing `postprocessing` `EffectComposer`** (`packages/ui/lib/three/post-composer.ts`). The base renders the scene to a buffer; each layer is an effect that samples the previous buffer and writes the next. This is the decision; do not build a second rendering path.

Rationale:
- The repo already runs every scene through `EffectComposer` (`createPostComposer`), and Bloom, Chromatic, Vignette, Grain already exist there as passes. The light and finish layers are a re-wrap, not new code.
- A screen-space pass has the rendered image plus uv plus time plus mouse, which is everything the treatment, colour, light, and finish layers need.
- Coordinate layers (Refraction, Kaleidoscope) work on the sampled image, not the base's input coordinates. Refraction sampling the rendered texture is exactly the believable glass-over-content look, and kaleidoscope of the rendered image reads correctly. We accept "warp the image" rather than "warp the field input"; it is visually right and keeps one model.

Consequence: a layer is authored as a small GLSL function over an input colour and uv, and the engine wraps it into a `postprocessing` effect with uniforms generated from its `ControlSpec[]`, mirroring how `buildFragmentShaderScene` already generates uniforms for a base.

## 3. Data model

```ts
// New: a composition is the serialisable unit (share link, embed, db row).
interface ShaderComposition {
  base: string;                 // base field id, e.g. "fluid"
  baseParams?: DemoState;       // overrides on the base's contract defaults
  layers: Array<{
    id: string;                 // effect layer id, e.g. "dots"
    params?: DemoState;         // overrides on the layer's contract defaults
  }>;
}
```

Two registries (mirror the existing `sceneRegistry` / `shaderPresets` pattern):

```ts
// base fields (already exists as sceneRegistry + shaderPresets)
// new: effect layers
interface EffectLayerDef {
  id: string;
  label: string;
  group: "coordinate" | "colour" | "treatment" | "light" | "finish";
  controls: ControlSpec[];      // the layer's contract
  effect: EffectFactory;        // builds the postprocessing effect from resolved params
}
const effectLayerRegistry: Record<string, EffectLayerDef>;
```

`group` fixes ordering: when a composition is built, layers are sorted by group in the order coordinate, colour, treatment, light, finish, then by their position in the array within a group.

## 4. Recipe: how to write a layer (copy-paste)

A layer author writes only the GLSL body of `mainImage` plus a `ControlSpec[]`. The engine (`buildEffectLayer`, new in `post-composer.ts` or a sibling) injects the uniform declarations from the contract and the standard ins.

Standard ins available to every layer (do not redeclare):
```glsl
// inputColor: the colour from the layer beneath, at this pixel
// uv:         0..1, y-up
// plus uniforms: uTime, uResolution, uMouse, and uPrimary/uSecondary/uAccent/uBackground
```

Layer GLSL shape:
```glsl
// Dots layer body. References contract uniforms uShape, uSize, uAngle, uFlow, uSoftness.
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float lum = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  // ... build dot coverage from lum + uv + the uniforms ...
  outputColor = vec4(mix(uBackground, inputColor.rgb, coverage), 1.0);
}
```

Layer contract (same `ControlSpec[]` shape as a base):
```ts
export const dotsControls: ControlSpec[] = [
  { type: "segmented", key: "shape", label: "Shape", options: [
      { value: "round", label: "Round" }, { value: "square", label: "Square" }, { value: "line", label: "Line" } ],
    default: "round" },
  { type: "slider", key: "size", label: "Size", min: 4, max: 48, step: 1, default: 14, unit: "px" },
  { type: "slider", key: "angle", label: "Angle", min: 0, max: 90, step: 1, default: 27, unit: "deg" },
  { type: "slider", key: "flow", label: "Flow", min: 0, max: 1, step: 0.01, default: 0 }, // 0 = static halftone, up = flowing dots
  { type: "slider", key: "softness", label: "Softness", min: 0, max: 1, step: 0.01, default: 0.35 },
];
```

Registration (one place):
```ts
effectLayerRegistry["dots"] = { id: "dots", label: "Dots", group: "treatment", controls: dotsControls, effect: buildEffectLayer(dotsBody, dotsControls) };
```

That is the entire surface for adding a layer: a GLSL body, a contract, one registry line. The same uniform-naming rule as bases applies (`size` becomes `uSize`, a colour list becomes `uRamp[N]` plus `uRampCount`).

## 5. ThreeScene integration

`ThreeScene` gains optional `composition?: ShaderComposition` (and keeps `preset` as the simple case, which is just `{ base: preset, layers: [] }`). On build:
1. Build the base scene via `sceneRegistry[base]` (unchanged).
2. Build the composer with the ordered layer effects appended after the base's own post preset.
3. Resolve params (colours through the existing `resolveCssColor`, slot-bound colours from the palette) and call `setParams` on the base and each layer.
4. Live updates: a `shaderParams` change re-resolves and calls the relevant `setParams` with no remount (same pattern as the existing palette path).

The context budget (`releaseOffscreen` plus `MAX_LIVE_CONTEXTS`) is unchanged; a composition is still one WebGL context.

## 6. The validation harness (the gate)

Every base and every layer passes all three before it is considered shippable. This harness is the deliverable that makes "never a broken shader" real, and it moves into the shader skill at L5.

1. **Static parse** (sandbox, fast): combine header plus generated uniform decls plus body, run `@shaderfrog/glsl-parser`. Catches syntax and structural errors with no GL. Script lives at `packages/ui/scripts/shader-check.mjs`.
2. **Contract lint** (sandbox, deterministic): extract every `u[A-Z]\w+` identifier from the body; assert each is either in the header set (`uTime`, `uResolution`, `uMouse`, `uPrimary`, `uSecondary`, `uAccent`, `uBackground`), the layer-input set, or a key in the part's `ControlSpec[]`. Fail on any reference with no source, and warn on any contract key never referenced.
3. **GL compile plus visual** (browser): render each base, and each layer over a neutral base, in the picker or a dedicated test route; confirm via screenshot that it renders (not the fallback) and looks distinct. A compile failure currently falls back silently, so the harness route must pass `onShaderError` and surface the GL log to the console.

Acceptance for any new base or layer: passes 1 and 2 in CI, and 3 by review.

## 7. How to test (commands)

- `node packages/ui/scripts/shader-check.mjs` runs parse plus contract-lint over every base and layer, exits non-zero on failure. Wire into `ci.yml`.
- `pnpm -F @gradeui/ui exec tsc --noEmit` for the contract and registry types.
- Browser: `localhost:3000/components/shader-preset-picker` for bases; a new `localhost:3000/components/shader-lab` (L1) for compositions and the live panel.
- Canonical compositions that must render correctly (the smoke set): `fluid + dots(flow=0, angle=27)` (halftone over lava), `fluid + dither`, `aurora + grain`, `mesh + gradientMap`, `caustics + chromatic + vignette`, `plasma + kaleidoscope`.

## 8. Execution plan (ordered, parallelisable)

Phase A, foundation (serial, one owner):
- A1. `buildEffectLayer(body, controls)` in the composer: generate uniforms from the contract, wrap as a `postprocessing` effect, expose `setParams`. Acceptance: a trivial passthrough layer compiles and renders unchanged.
- A2. `effectLayerRegistry` plus `ShaderComposition` type. Acceptance: types clean, empty registry builds.
- A3. `ThreeScene` accepts `composition`; resolves and applies base plus layer params; live `setParams`. Acceptance: `{ base:"fluid", layers:[] }` renders identically to `preset="fluid"`.
- A4. `shader-check.mjs` harness (parse plus lint) over bases and layers. Acceptance: passes on the eleven existing bases; fails a deliberately broken fixture.

Phase B, the two proof layers (parallelisable after A):
- B1. **Dots** layer (subsumes halftone plus flowing-dots). Acceptance: smoke composition `fluid + dots` renders; flow=0 reads as halftone, flow up reads as flowing dots.
- B2. **Gradient map** layer. Acceptance: a greyscale-ish base plus gradient map re-tints with the theme palette.

Phase C, the rest of the catalog (parallelisable, each is the recipe in section 4):
- C1. Dither. C2. Posterize. C3. Refraction (port from the glass base). C4. Kaleidoscope. C5. Bloom, Chromatic, Vignette, Grain as `EffectLayerSpec` re-wraps of the existing post passes.
- Authoring can be delegated: a worker returns the GLSL body plus `ControlSpec[]` per layer (it does not edit files); the owner integrates, runs the harness, and registers. This is how the eleven bases were built.

Phase D, fold-in and cleanup:
- D1. Convert `halftone`, `flowing-dots`, `grain` from base presets into compositions over the new layers; keep their ids as saved compositions.
- D2. Fix `digital`: remove the ring and dead centre (the "sort a" item); re-express as a grid base plus Dither or drop.

Phase E, panel:
- E1. `ControlPanel` / `ControlPanelItem` from `ShaderControls`, reconciled with the Studio right-panel `Field` controls; stacks base section plus one section per layer; add the mouse on/off toggle.

Parallelism: A is serial. B1, B2 in parallel once A lands. C1 through C5 in parallel (independent GLSL, integrated one at a time through the harness). D and E after B.

## 9. Risks and mitigations

- **Coordinate layers as image-space passes look wrong.** Mitigation: accept image-space refraction and kaleidoscope (visually right); if a true field-input warp is ever needed, it stays inside the base, not a layer.
- **Layer order surprises.** Mitigation: the fixed `group` order, enforced at compose time, not left to the array.
- **Param-uniform collisions** (a key named `background` becomes `uBackground` and clashes with the header). Mitigation: the contract lint flags any key whose `u<Key>` collides with the header set; authors use `bg` not `background`. Already hit and fixed once.
- **`pow(negative, n)` and other undefined GLSL.** Mitigation: lint rule plus review; already caught in aurora.
- **Context budget under many compositions.** Mitigation: unchanged; one composition is one context, the LRU budget holds.

## 10. Definition of done

- `shader-check.mjs` green in CI over all bases and layers.
- The smoke compositions (section 7) render in the lab route, theme-reactive, no console errors.
- `halftone` and `flowing-dots` are compositions over the Dots layer, not separate base GLSL.
- `digital` ring removed.
- `ControlPanel` renders a composition's full stack and edits apply live.
- Both `packages/ui` and `apps/docs` copies in sync; `tsc` clean.
