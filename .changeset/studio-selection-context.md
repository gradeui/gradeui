---
"@gradeui/docs": minor
---

Studio: component-aware selection + direct-prop settings panel.

- The preview's "Select" tool now snaps to the nearest `data-gds-part` ancestor when you click inside a DS component. The selection payload carries `part` and `componentName` (PascalCase) so the chat chip, the preview header badge, and the chat system prompt all lead with the component's identity instead of "div".
- When a DS component is selected, a **Settings** panel appears below the selection chip with one control per parseable prop (Select for enum, Switch for boolean, Input for string/number). Changing a control rewrites the App source directly — no LLM round-trip.
- New endpoint: `GET /api/component-manifest?part=<kebab>` returns the structured prop manifest for one or more components, sourced from sidecar frontmatter.
- One-instance-per-file limit applies: the mutator always targets the first matching `<ComponentName>` tag in the source. Documented in `apps/docs/STUDIO.md`.
