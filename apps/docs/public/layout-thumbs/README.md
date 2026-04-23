# layout-thumbs/

PNG thumbnails for the Studio StarterPicker's "Start from a layout"
grid. One file per `ReferenceLayout`, named `<id>.png`.

Regenerate:

```sh
pnpm -F @gradeui/docs dev &            # dev server must be running
pnpm -F @gradeui/docs capture:layout-thumbs
```

Single layout:

```sh
THUMB_LAYOUT_ID=ecommerce-listing pnpm -F @gradeui/docs capture:layout-thumbs
```

See `apps/docs/scripts/capture-layout-thumbnails.mjs` and
`packages/studio/src/playbook/layouts/README.md` for the full flow.

The picker falls back to a CSS gradient keyed off the layout id when a
PNG is missing, so emptying this folder won't break the UI — just makes
it less pretty until you regenerate.
