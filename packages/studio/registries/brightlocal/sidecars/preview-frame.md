---
name: PreviewFrame
props:
  - label?: string — the small label in the top row. Default "Preview".
  - trailing? — node. Controls that belong to the preview (device tabs, a page switcher), right of the label.
  - surface?: string (card | none) — "card" draws the white inner surface for a preview of a page; "none" for content that paints its own surface, such as the review showcase widget. Default "card".
  - dataHook?: string
  - className?: string — appended to the outer frame.
when_to_use: >
  Any time a screen shows a representation of what a customer will see: a
  review request page, an email, a review showcase, an embed. It is the ONLY
  wrapper the preview gets. Never place it inside another Card or tinted box;
  the dashed frame is what says "this is a preview", and stacking surfaces
  is what Ali calls too many layers.
composes_with: [Card, CardContent, Drawer, DrawerBody, DeviceFrame]
aliases: [preview, preview surround, preview border, dashed frame]
---
