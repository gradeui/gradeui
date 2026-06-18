---
name: PropertyList
import: "@gradeui/ui"
props:
  - layout?: "row" | "stack" — row (default): label column beside value; stack: label above value for narrow panels
  - density?: "compact" | "default" | "relaxed" — row rhythm
  - align?: "start" | "center" — default vertical alignment of label vs value; use start when values wrap (tag groups, multi-line)
  - divider?: boolean — hairline rule between rows
  - labelWidth?: string — override the label column width (any CSS length); sets --gds-property-list-label-width
  - children: PropertyList.Row[]
when_to_use: Read-only display of the properties of a SINGLE item — detail panels, inspectors, "about this" cards, order/record summaries. It is a Table row transposed (schema vertical, one record). The value side is a polymorphic slot, so the same renderers that fill a Table cell (text, Badge, tag group, Avatar stack, date, link) drop straight into a row. For an EDITABLE field (label + control) use Field instead; a panel that flips between read and edit swaps a PropertyList for a stack of Fields.
composes_with: [Badge, Avatar, Table, Field, Separator, Card]
aliases: [property list, properties, property panel, description list, definition list, detail list, key value, key-value, data list, field list, attributes, metadata list, record summary, detail panel, inspector fields, spec list]
---

```jsx
<PropertyList>
  <PropertyList.Row label="Status" icon={<Activity />}>
    <Badge variant="warning-soft">Low</Badge>
  </PropertyList.Row>
  <PropertyList.Row label="Published">2026-06-18</PropertyList.Row>
  <PropertyList.Row label="Owner">
    <Avatar className="h-5 w-5"><AvatarFallback>EO</AvatarFallback></Avatar>
  </PropertyList.Row>
</PropertyList>
```

```jsx
<PropertyList density="compact" divider align="start">
  <PropertyList.Row label="Topics">
    <Row gap="xs" wrap>
      <Badge variant="secondary">Pricing</Badge>
      <Badge variant="secondary">Onboarding</Badge>
    </Row>
  </PropertyList.Row>
  <PropertyList.Row label="Business profiles">
    <Row gap="xs" wrap>
      <Badge variant="outline">Acme</Badge>
      <Badge variant="outline">Kite</Badge>
    </Row>
  </PropertyList.Row>
</PropertyList>
```
