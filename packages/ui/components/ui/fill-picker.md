---
name: FillPicker
import: "@gradeui/ui"
subcomponents: [FillSection]
props:
  - value: FillValue — current paint ({ type, color?, gradient?, src?, fit?, repeat?, tileSize?, preset?, palette?, postPreset?, opacity? }) (required)
  - onChange: (value: FillValue) => void — called on any change (required)
  - FillSection: value — FillValue[] — the ordered list of fills to stack as rows
  - FillSection: onChange — (value: FillValue[]) => void — fired with the next list on add / edit / remove / visibility toggle
  - FillSection: title?: string — section heading (default "Fills")
when_to_use: Grade's paint picker — the control for choosing a frame's background fill, modelled on Figma's fill popover. A fill-type icon row (solid · gradient · image · pattern · video · shader) switches the panel below; a global opacity sits at the foot. Emits a FillValue that maps 1:1 onto BackgroundFill props. This is a Studio/inspector chrome control — pair it with BackgroundFill, which renders the chosen paint. Not for app content. Use the FillSection subcomponent to edit a LIST of fills (the Figma "Fill" inspector section): each row is a Solid/Gradient/Image toggle, the matching value control (ColorPicker / GradientEditor popover / image URL), an opacity %, a visibility eye, and a remove button, with an add button in the header.
composes_with: [BackgroundFill (renders the FillValue), Popover (host it in a popover), ColorPicker (the solid value), GradientEditor (the gradient value), ShaderPresetPicker (the shader tab), the inspector Fill section]
aliases: [fill picker, paint picker, background picker, fill chooser, fill popover, fill section, fill list, fills inspector, paint section]
notes: |
  Grade is token-led, so the solid + gradient tabs lead with theme-token
  swatches (`primary`, `accent`, `secondary`, `muted`, `card`,
  `background`, `destructive`, `transparent`) rather than a freeform HSV
  square. The "pattern" tab is sugar for an image fill with `repeat` on.

  The `FillValue` is the shared data shape: store it on a frame and feed
  it straight to `<BackgroundFill {...value} />`. Solid colour can be a
  className (`bg-<token>`) instead of a layer; every other type renders
  as a `<BackgroundFill>` child of the frame.
---

```jsx
const [fill, setFill] = useState({ type: "shader", preset: "mesh", opacity: 0.35 });

<Popover>
  <PopoverTrigger asChild><button>Fill</button></PopoverTrigger>
  <PopoverContent className="w-[320px] p-3">
    <FillPicker value={fill} onChange={setFill} />
  </PopoverContent>
</Popover>

<div className="relative overflow-hidden">
  <BackgroundFill {...fill} />
  <div className="relative z-10">…content…</div>
</div>
```
