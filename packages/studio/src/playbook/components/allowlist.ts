/**
 * The components the model is allowed to emit in `jsx` code blocks.
 *
 * Used by:
 *   - the system prompt (OUTPUT RULES #4) — the model sees this list and is
 *     instructed not to stray outside it
 *   - the retrieval layer — ref matches outside the allowlist are dropped
 *     before they reach the system prompt so we don't hint at components
 *     the model can't actually emit (e.g. a prompt mentioning "animation"
 *     matches RivePlayer's aliases, but RivePlayer isn't in the list, so
 *     don't surface its ref block)
 *   - Sandpack's virtual filesystem (in `apps/docs/lib/chat-sandpack.ts`) —
 *     which ships the source for every allowed component so the iframe can
 *     resolve them
 *
 * Keep in sync with the `componentFiles` map in chat-sandpack.ts until that
 * whole setup graduates into `src/runtime/`.
 */
export const ALLOWED_COMPONENTS = [
  // Layout primitives — reach for these over hand-rolled flex/grid so
  // the resulting structure is editable via the settings panel and the
  // vertical/horizontal rhythm stays consistent across designs.
  //   Stack — vertical 1D
  //   Row   — horizontal 1D
  //   Grid  — 2D responsive; `cols` prop bakes in the responsive ladder
  //           so "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" becomes
  //           <Grid cols="4">. The model hand-rolls the same pattern
  //           otherwise, often with invented classes like `gap-md` that
  //           silently do nothing.
  //   Flex  — the unopinionated escape hatch. CSS-aligned — direction,
  //           gap, align, justify, wrap exposed directly. Reach for Flex
  //           when Stack / Row / Grid don't fit (reverse direction,
  //           baseline alignment, CSS defaults).
  "Stack",
  "Row",
  "Grid",
  "Flex",
  // App scaffold — the top-level page shell. nav=side|top|none picks the
  // structure; AppShellMain's maxWidth caps content width. Reach for this
  // instead of hand-rolling grid grid-cols-[auto_1fr] on every app layout.
  "AppShell",
  "AppShellNav",
  "AppShellMain",
  // Core primitives
  "Button",
  "Card",
  "CardHeader",
  "CardTitle",
  "CardDescription",
  "CardContent",
  "CardFooter",
  "Input",
  "Label",
  "Textarea",
  // Feedback
  "Alert",
  "AlertTitle",
  "AlertDescription",
  "Badge",
  "Progress",
  "Skeleton",
  // Overlays
  "Dialog",
  "DialogTrigger",
  "DialogContent",
  "DialogHeader",
  "DialogTitle",
  "DialogDescription",
  "DialogFooter",
  // Form controls
  "Checkbox",
  "Switch",
  "Select",
  "SelectTrigger",
  "SelectContent",
  "SelectValue",
  "SelectItem",
  // Date + Popover (shipped in @gradeui/ui@0.3.0)
  "DatePicker",
  "DateRangePicker",
  "Calendar",
  "Popover",
  "PopoverTrigger",
  "PopoverContent",
  "PopoverAnchor",
  // Layout & data display
  "Separator",
  "Avatar",
  "AvatarImage",
  "AvatarFallback",
  "Tabs",
  "TabsList",
  "TabsTrigger",
  "TabsContent",
  "Table",
  "TableHeader",
  "TableBody",
  "TableFooter",
  "TableHead",
  "TableRow",
  "TableCell",
  "TableCaption",
  // Media (shipped in @gradeui/ui@0.4.0)
  //   - VideoPlayer / ThreeScene are the high-level wrappers the model
  //     should reach for. MediaSurface is the low-level shell; exposing
  //     it too means a user who says "build a bespoke media thing" has a
  //     way to do it without the model inventing imports.
  //   - RivePlayer is intentionally NOT exposed to Studio right now — the
  //     @rive-app/react-canvas runtime is ~900KB and we aren't pushing Rive
  //     as a studio-first primitive. Consumers installing @gradeui/ui
  //     directly can still use it by adding the optional dep themselves.
  //   - Shader preset primitives are included so a prompt like "show a
  //     gallery of shader backgrounds" picks the registry-driven UI instead
  //     of fabricating one.
  "VideoPlayer",
  "ThreeScene",
  "MediaSurface",
  "ShaderPresetPreview",
  "ShaderPresetPicker",
] as const;

/**
 * Additional bare module specifiers the model is allowed to import from.
 *
 * These must be declared in the Sandpack `customSetup.dependencies` block so
 * the iframe can actually resolve them. Keep in sync with the Sandpack setup
 * in `apps/docs/lib/chat-sandpack.ts` (and wherever else the iframe gets
 * built — studio-preview, design-chat, the template viewer, /play).
 */
export const ALLOWED_EXTERNAL_IMPORTS = [
  "lucide-react",
  "recharts",
] as const;

/**
 * Layout primitives whose ref block gets pinned to the system prompt
 * regardless of whether the user's message mentions them.
 *
 * Retrieval's text-match heuristic fires on component names and aliases,
 * but most user prompts ("a card with two buttons at the bottom") don't
 * say "row" or "stack" — so the model never sees their props and falls
 * back to hand-rolled `flex gap-2 justify-end`. Pinning them costs ~4
 * small .md files worth of tokens and reliably steers the model toward
 * the settings-panel-editable path.
 *
 * Kept small on purpose — this isn't a "star components" list, it's
 * specifically the layout primitives that suffer most from the retrieval
 * gap. If a non-layout component needs similar treatment, consider
 * fixing its aliases first.
 */
export const PINNED_COMPONENTS = ["Stack", "Row", "Grid", "Flex"] as const;
