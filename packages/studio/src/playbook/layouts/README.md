# layouts/

Reserved for task **#24 — reference layouts as prompt scaffolds**.

The idea: curated, hand-authored JSX starters (not just prose prompts like
`templates/`) that the model can be seeded with for common app shapes —
dashboard, docs site, marketing page, settings, etc. The model then edits
the scaffold rather than generating from scratch, which should give more
reliable structure on the hard layouts (AppShell + nav + main grid).

Currently empty — the templates/ prose-only approach is good enough until
we have a specific layout that keeps coming out badly. When that happens,
add the JSX scaffold here as a sibling to its prose template entry.

Shape expected (TBD, finalised when we author the first one):

```ts
export interface ReferenceLayout {
  id: string;               // joins to a StudioTemplate by id
  label: string;
  description: string;
  /** Initial JSX dropped into the Sandpack editor. */
  scaffold: string;
}
```

Anything that lands here must stay zero-runtime-dep — JSX as a string,
not as a React component. The host app hydrates it into the editor.
