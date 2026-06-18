/**
 * Theme builder public API — a composable primitive set modelled on
 * Sandpack (one provider, many dumb children).
 *
 * The provider owns the working ThemeInput, the undo/redo history, and
 * the preview mode. Children pull those off the context via named hooks
 * and render their slice — a title bar, the full controls form, a save
 * footer, a scoped preview wrapper, or something bespoke using the
 * primitives.
 *
 * Typical usage:
 *
 *   // Site-wide edit (e.g. a header popover that nudges the live theme)
 *   <ThemeBuilderProvider initial={siteInput} bindTo="site">
 *     <ThemeBuilderPanel className="h-[520px] w-[340px]" />
 *   </ThemeBuilderProvider>
 *
 *   // Scoped preview (edits only apply inside the Scope subtree)
 *   <ThemeBuilderProvider initial={someInput} bindTo="scoped">
 *     <div className="grid grid-cols-[1fr_320px]">
 *       <ThemeBuilderScope className="rounded-xl border p-8">
 *         <MyDemo />
 *       </ThemeBuilderScope>
 *       <ThemeBuilderPanel />
 *     </div>
 *   </ThemeBuilderProvider>
 *
 *   // Draft mode — host pipes `useGeneratedTheme()` into Sandpack/etc.
 *   <ThemeBuilderProvider initial={input} bindTo="draft" onSave={handleSave}>
 *     <div className="grid grid-cols-[1fr_320px]">
 *       <MyCustomPreview />
 *       <ThemeBuilderPanel />
 *     </div>
 *   </ThemeBuilderProvider>
 */

export {
  ThemeBuilderProvider,
  useThemeBuilder,
  useMaybeThemeBuilder,
  useGeneratedTheme,
  useThemeBuilderMode,
  type ThemeBuilderBindTo,
  type ThemeBuilderContextValue,
  type ThemeBuilderProviderProps,
} from "./theme-builder-provider";

export {
  ThemeBuilderScope,
  type ThemeBuilderScopeProps,
} from "./theme-builder-scope";

export {
  ThemeBuilderHeader,
  type ThemeBuilderHeaderProps,
} from "./theme-builder-header";

export {
  ThemeBuilderControls,
  type ThemeBuilderControlsProps,
} from "./theme-builder-controls";

export {
  ThemeBuilderFooter,
  type ThemeBuilderFooterProps,
} from "./theme-builder-footer";

export {
  ThemeBuilderPanel,
  type ThemeBuilderPanelProps,
} from "./theme-builder-panel";

// Shared primitives — useful for hosts that want to build custom
// control layouts (e.g. a hue-only popover, a font-row tooltip).
export {
  Section,
  Label,
  Hint,
  WeightSlider,
  Segmented,
  IconButton,
  ModeButton,
  HueRow,
  FontRow,
} from "./theme-builder-primitives";
