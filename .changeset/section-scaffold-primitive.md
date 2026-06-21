---
"@gradeui/ui": minor
---

Add the **Section** page-scaffold primitive and its **Container** measure. A page is an ordered stack of Sections — each distinct band gets its own, independently themeable. `Section` is the full-width band: it owns a colour `scope` (subtheme, via the `scope-*` classes) and vertical `pad` rhythm, nothing else. `Container` is the centred max-width + gutters you drop inside a section (or anywhere) to constrain content; omit it for a full-bleed band, and `grid` snaps children to a 12-column grid. The composable parts — `SectionEyebrow`, `SectionTitle`, `SectionSubtitle`, `SectionDescription`, `SectionActions`, `SectionMedia` (a slot for any media) — give the common heading + copy + CTA + media shape design intent without constraining the content. Design doc: `STUDIO-SECTIONS.md`.
