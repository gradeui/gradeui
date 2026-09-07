---
name: Dropzone
props:
  value: "string — the chosen file's name. Present means the filled state."
  label: "string — empty-state headline. Default: 'Drop your file here, or choose one'."
  hint: "string — the constraint under the headline when empty (sizes, formats)."
  meta: "string — filled-state detail, e.g. '120 rows' or '720 by 720'."
  Icon: "component — defaults to Upload."
  onSelect: "(file?: File) => void — fired by click and by drop."
  disabled: boolean
  dataHook: string
when_to_use: >
  Any file the user provides: a CSV of contacts, a logo, an import. The
  BrightLocal DS ships no file component at all, so this is the one drop target
  in the registry and every screen should use it rather than hand-rolling a
  dashed box.
composes_with: [Field, FieldLabel, FieldDescription, Card, SetupRow]
aliases: [file upload, upload, drop target, file picker, dropzone]
