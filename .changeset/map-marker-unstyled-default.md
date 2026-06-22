---
"@gradeui/ui": minor
---

Map markers are no longer styled by default. The DS used to force a 1px border
+ ambient shadow on every direct child of a `MapMarker`'s content (a legibility
"floor"). That's too opinionated for a primitive, marker/pin design belongs to
the consumer. The `[data-gds-part="map-marker-content"] > *` border + box-shadow
rule is removed; pins now render exactly as authored.

The `--gds-map-marker-border` / `--gds-map-marker-shadow` tokens remain defined,
and the `.gds-map-label` halo helper is unchanged, so legibility on busy tiles
is now opt-in rather than mandatory. If you relied on the automatic lift, add
the border/shadow yourself (or use the tokens) on your marker content.
