---
"@gradeui/docs": patch
---

Studio: select-tool resolves sub-parts to their enclosing component; drop RivePlayer from the Studio allowlist + sandbox deps.

- **Selecting the canvas inside `<ThreeScene>` no longer pins the
  settings panel to a phantom `<ShaderCanvas>`.** `<ThreeScene>` stamps
  `data-gds-part="shader-canvas"` on the WebGL canvas, plus
  `scene-poster` / `scene-controls` on its other internals. The iframe
  selection agent's kebab-to-Pascal mapping was turning those into
  `ShaderCanvas` / `ScenePoster` / `SceneControls` — component names
  that never appear in the generated source, so the settings panel fell
  through to "regenerate via chat first". The agent now keeps a list of
  known sub-part names and climbs to the nearest enclosing
  `data-gds-part` ancestor, so clicking the canvas lands on
  `<ThreeScene>` and its prop controls work in place. The long-term
  plan is a library-side `data-gds-component` attribute on real JSX
  roots; the sub-part list is a holdover until then.
- **RivePlayer is no longer exposed to Studio.** Removed from
  `ALLOWED_COMPONENTS` and `@rive-app/react-canvas` dropped from
  `PLAYGROUND_DEPENDENCIES` — every sandbox boot was pulling in ~900KB
  for a component we're not pushing as a studio-first primitive. The
  chat ref-block also filters against `ALLOWED_COMPONENTS` now, so
  prompts mentioning "rive" / "lottie" / "animation" won't leak
  RivePlayer's sidecar into the system prompt. The component itself
  stays in the library; consumers installing `@gradeui/ui` directly can
  still use it by adding the optional dep themselves.
