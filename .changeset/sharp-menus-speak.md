---
"@gradeui/ui": minor
---

Component + contract fixes from the Cowork-replica exercise (2026-06-11):

- **DropdownMenuSubTrigger hover**: now applies `focus:text-accent-foreground`
  / `data-[state=open]:text-accent-foreground` + `transition-colors`,
  matching DropdownMenuItem — previously only the accent background was set,
  leaving default-colour text on hover.
- **SidebarSection `titleTransform`** ("uppercase" | "none"): explicit
  control over title casing for both header variants. Unset preserves the
  per-variant legacy defaults exactly (static headers uppercase, collapsible
  headers authored-case).
- **Contracts generator**: multi-prop sidecar lines now parse fully —
  semicolon-separated signatures and bare comma lists (`open?, defaultOpen?,
  onOpenChange?, modal?`) previously kept only the first prop, so the save
  gate rejected props the components genuinely support. Prose semicolons in
  descriptions are no longer mistaken for separators. Sub-component props
  are forced optional in the flattened bag (requiredness no longer leaks —
  TabsTrigger's required `value` was being demanded on `<Tabs>` itself).
  Net effect: 27 real props restored across 17 component contracts, zero
  new requirements.
- **Sidecars**: logo.md now documents the full existing Logo API
  (size/lockup/mode/mono/label/decorative/href — the component had outgrown
  its docs); dropdown-menu.md documents DropdownMenuSub open/defaultOpen/
  onOpenChange (Radix passthrough, useful for composing pre-opened menus in
  static screens); sidebar.md describes the real per-variant title casing
  instead of claiming unconditional uppercase.
