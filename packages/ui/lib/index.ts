"use client";

/*
 * ─────────────────────────────────────────────────────────────────────
 *  `"use client"` at the top is intent-as-documentation.
 *
 *  The actual load-bearing directive is injected by the `banner`
 *  field in `tsup.config.ts` — esbuild's minifier strips bare
 *  top-of-file string literals (treating them as useless expression
 *  statements), so this source-level directive gets removed from
 *  `dist/index.mjs` during build. The banner appends `"use client";`
 *  to the emitted output AFTER minification runs, which is what
 *  Next.js 15+ App Router actually reads at consume time.
 *
 *  Keeping the directive here too:
 *    - Documents intent for anyone reading the source.
 *    - Means a future `minify: false` build still produces a working
 *      bundle without re-discovering this footgun.
 *
 *  If you change anything about how this barrel is shipped, also
 *  check `packages/ui/tsup.config.ts` — the two configs (client +
 *  server-safe) are deliberately split so the `contracts` and
 *  `tailwind-preset` subpaths stay importable from Server Components.
 * ─────────────────────────────────────────────────────────────────────
 */

// Component contracts (machine-readable component descriptors). The
// Studio settings panel reads these to filter plumbing props, pick the
// right control kind, and render action buttons. See packages/ui/lib/contracts.ts
// for the registry and packages/contracts for the type vocabulary.
export {
  COMPONENT_CONTRACTS,
  getComponentContract,
  listContractedComponents,
} from "./contracts";

// Re-export the MediaSurface contract directly too — convenient for
// consumers that want the typed contract object without going through
// the lookup. Future contracts get the same treatment.
export { MediaSurfaceContract } from "../components/ui/media-surface.contract";

// UI Components
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

// Callout (renamed from Alert in May 2026). The `Alert` name is
// reserved — left vacant deliberately so a future genuinely-
// interruptive primitive can claim it without re-renaming. For
// modal-style "alert" semantics today, use `<Dialog>`.
export {
  Callout,
  CalloutTitle,
  CalloutDescription,
  calloutVariants,
} from "../components/ui/callout";

export {
  AppShell,
  AppShellHeader,
  AppShellNav,
  AppShellAside,
  AppShellMain,
  AppShellFooter,
  shellVariants,
  headerVariants as appShellHeaderVariants,
  navVariants as appShellNavVariants,
  asideVariants as appShellAsideVariants,
  mainVariants as appShellMainVariants,
  footerVariants as appShellFooterVariants,
  type AppShellProps,
  type AppShellHeaderProps,
  type AppShellNavProps,
  type AppShellAsideProps,
  type AppShellMainProps,
  type AppShellFooterProps,
} from "../components/ui/app-shell";

// Avatar — the Radix-backed rounded image + fallback initials combo. The
// component file has shipped since v0.3-ish but never made it into this
// barrel, so any `import { Avatar } from "@gradeui/ui"` resolved to
// undefined and crashed Sandpack with "Element type is invalid". Four of
// the five reference-layout scaffolds (saas-user-editor, music-app,
// tv-streaming, data-table-filters) use Avatar — they all stayed broken
// in Studio until this line landed.
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarTone,
} from "../components/ui/avatar";

export { Badge, badgeVariants } from "../components/ui/badge";

// Banner — full-width horizontal strip for system-level state,
// announcements, first-run guidance. Extracted out of the inline-style
// `FigmaIntroBanner` in apps/docs after the user flagged that as
// invisible (it referenced --gds-* tokens that don't exist; the
// fallback values washed it out). See banner.md for scenarios.
export { Banner, bannerVariants, type BannerProps } from "../components/ui/banner";

export { Button, buttonVariants } from "../components/ui/button";

export { Calendar, CalendarDayButton } from "../components/ui/calendar";

// Carousel — embla-backed slideshow with custom autoplay (per-slide
// duration overrides), Dots/Arrows subcomponents, and a VideoSlide
// variant that does muted-autoplay + poster swap on activation. See
// components/ui/carousel.md for the sidecar and the anti-patterns
// list (notably "Carousel" vs "Slider" disambiguation).
export {
  Carousel,
  CarouselSlide,
  CarouselVideoSlide,
  CarouselDots,
  CarouselArrows,
  CarouselPrev,
  CarouselNext,
  useCarouselApi,
  type CarouselProps,
  type CarouselSlideProps,
  type CarouselVideoSlideProps,
  type CarouselDotsProps,
  type CarouselArrowsProps,
  type CarouselNavButtonProps,
  type AutoplayConfig as CarouselAutoplayConfig,
} from "../components/ui/carousel";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export { Checkbox } from "../components/ui/checkbox";

// Field — inline composition primitive (control + label + description +
// trailing slot) with automatic id / aria-describedby wiring. Keeps the
// Checkbox / RadioGroupItem / Switch primitives bare.
export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldTrailing,
  type FieldProps,
} from "../components/ui/field";

// Selection cards — RadioCard / CheckboxCard / SwitchCard. The whole card
// is the control (focus + checked state on the parent surface), sharing one
// `.gds-selection-card` look. Static content only — never nest interactive
// controls inside (see the component header).
export {
  RadioCard,
  CheckboxCard,
  SwitchCard,
  type RadioCardProps,
  type CheckboxCardProps,
  type SwitchCardProps,
} from "../components/ui/selection-card";

// Code — syntax-highlighted code surface for marketing heroes, docs,
// changelog entries, AI-output displays. Sync prism-react-renderer
// (shared with Studio's CodeView so the repo has one highlighter, not
// two). Supports diff hero mode, line emphasis, scroll-triggered
// reveals, and a token-by-token typewriter for "watch it generate"
// surfaces. Token palette is `--gds-code-*` CSS variables.
export {
  Code,
  type CodeProps,
  type CodeLanguage,
  type CodeReveal,
  type CodeTrigger,
  type CodeDiff,
} from "../components/ui/code";

// Message — canonical "avatar + author + timestamp + body" row. THE
// primitive for any chat message, comment, post-reply, or activity-log
// entry that follows the people-and-text shape. Slot-based avatar so
// consumers pass any Avatar variant. See packages/ui/components/ui/message.md.
export {
  Message,
  type MessageProps,
} from "../components/ui/message";

// Composer — the generic text composition surface. Lexical-backed,
// rich text + mentions/slash + image attachments + scripted demo
// playback. Hosts wrap it for AI chat (paperclip + send), comments
// (no toolbar, no attachments), document editing (full toolbar), etc.
// Shares lib/demo's step-machine vocabulary so demo scripts read the
// same as <Code>'s. See packages/ui/components/ui/composer.md.
export {
  Composer,
  ComposerReply,
  type ComposerProps,
  type ComposerHandle,
  type ComposerContent,
  type ComposerStep,
  type ComposerFormat,
  type ComposerMentionItem,
  type ComposerTriggerConfig,
  type ComposerAttachmentConfig,
  type ComposerAttachment,
} from "../components/ui/composer";

// lib/demo — shared scripted-demo primitive. The spine behind every
// "type this, wait, then reveal that" surface in gradeui. Used
// internally by <Code> and <Composer>; <DemoStage> + <Reveal> are
// re-exported here for marketing surfaces that want to stage whole-
// interface reveals on cue. See packages/ui/lib/demo/README.md.
export {
  useScriptedDemo,
  BlinkingCursor,
  DemoStage,
  Reveal,
  DEMO_SPEED_PRESETS,
  sleep as demoSleep,
  typeText as demoTypeText,
  type DemoSpeed,
  type DemoTrigger,
  type RevealStep,
  type RevealAnimation,
  type DemoStageProps,
  type RevealProps,
  type BlinkingCursorProps,
  type UseScriptedDemoOptions,
  type ScriptedDemoState,
  type ScriptedDemoContext,
} from "./demo";

export {
  DatePicker,
  DateRangePicker,
  type DatePickerProps,
  type DateRangePickerProps,
} from "../components/ui/date-picker";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export { Input } from "../components/ui/input";

export { Label } from "../components/ui/label";

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

export { Progress } from "../components/ui/progress";

// MultiSelect — multi-pick combobox (Popover + Command + Badge).
// Data-driven via `options`; controlled or uncontrolled. See the
// sidecar for anti-patterns (notably: don't use for unbounded /
// async lists — reach for Command directly).
export {
  MultiSelect,
  type MultiSelectOption,
  type MultiSelectProps,
} from "../components/ui/multi-select";

export { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";

export { Row, rowVariants, type RowProps } from "../components/ui/row";

export { Grid, gridVariants, type GridProps } from "../components/ui/grid";

export { Flex, flexVariants, type FlexProps } from "../components/ui/flex";

export { ScrollArea, ScrollBar } from "../components/ui/scroll-area";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export { Separator } from "../components/ui/separator";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";

export { Skeleton } from "../components/ui/skeleton";

export { Slider } from "../components/ui/slider";

// Sortable — drag-to-reorder primitive built on @dnd-kit/sortable.
// Compound API: Sortable + Sortable.Item + Sortable.Handle. Composes
// with any layout primitive — Stack for vertical lists, Row for
// horizontal strips, Grid for 2D card walls. See sidecar for
// anti-patterns (notably: don't add a `sortable` prop to layout
// primitives; wrap them in Sortable instead).
export {
  Sortable,
  SortableItem,
  SortableHandle,
  SortableGroup,
  type SortableProps,
  type SortableItemProps,
  type SortableHandleProps,
  type SortableGroupProps,
} from "../components/ui/sortable";

export { Stack, stackVariants, type StackProps } from "../components/ui/stack";

export { Switch } from "../components/ui/switch";

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbMenuTrigger,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
export type { BreadcrumbMenuItem } from "../components/ui/breadcrumb";

export { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export { Textarea } from "../components/ui/textarea";

export { Toggle, toggleVariants } from "../components/ui/toggle";
export { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";

// Toolbar — slot-based chrome bar with leading/center/trailing.
// Apple HIG "Toolbar" shape. Reach for it any time you'd otherwise
// hand-roll a <Row justify="between"> with a flex-1 middle child.
// See packages/ui/components/ui/toolbar.md for slot semantics + size
// + variant + sticky behaviour.
export {
  Toolbar,
  ToolbarSlot,
  type ToolbarProps,
  type ToolbarSlotProps,
} from "../components/ui/toolbar";

// Navigation components
// Sidebar — renamed from SideMenu (May 2026). Compound API:
// Sidebar / SidebarHeader / SidebarContent / SidebarFooter / SidebarSection / SidebarItem.
// See packages/ui/components/ui/sidebar.md for the API + anti-patterns.
export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarTreeItem,
  type SidebarProps,
  type SidebarHeaderProps,
  type SidebarContentProps,
  type SidebarFooterProps,
  type SidebarSectionProps,
  type SidebarItemProps,
  type SidebarTreeItemProps,
} from "../components/ui/sidebar";


// SimpleTabs retired (May 2026) — merged into Tabs as `variant="underlined"`.
// See packages/ui/components/ui/tabs.tsx for the variant prop and tabs.md
// for usage. Reach for `<Tabs><TabsList variant="underlined">…</TabsList></Tabs>`
// when you want the underlined-tab look that SimpleTabs provided.

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// Map — provider-agnostic map primitive (MapLibre / Mapbox / Google).
// All three SDKs are optional peer deps; the component lazy-loads the
// adapter for the chosen `provider`. See packages/ui/MAP.md for the design
// doc and packages/studio/src/playbook/components/map.md for model-facing
// usage notes.
export {
  Map,
  MapMarker,
  type Coords,
  type MapAppearance,
  type MapError,
  type MapErrorCode,
  type MapHandle,
  type MapMarkerProps,
  type MapProps,
} from "../components/ui/map";

// lib/motion — global motion control. The reduced-motion hook (now folds the
// data-motion="off" toggle in addition to the OS query), the imperative
// setMotion(), and the data-motion attribute name. See lib/motion/README.md.
export {
  useReducedMotion,
  usePrefersReducedMotion,
  usePageActive,
  setMotion,
  MOTION_ATTR,
} from "./motion";

// Media components
export {
  MediaSurface,
  type MediaSurfaceProps,
  type MediaAspect,
  type MediaRadius,
  type BaseMediaProps,
} from "../components/ui/media-surface";

export { VideoPlayer, type VideoPlayerProps } from "../components/ui/video-player";

export { RivePlayer, type RivePlayerProps } from "../components/ui/rive-player";

// Brand
export {
  Logo,
  type LogoProps,
  type LogoSources,
  type LogoVariant,
  type LogoLockup,
  type LogoMode,
  type LogoSize,
} from "../components/ui/logo";

// Direction — wrap any content in a directed camera (zoom/pan/spotlight tour).
export {
  ScreenAnimator,
  type ScreenAnimatorProps,
  type ScreenAnimatorShot,
} from "../components/ui/screen-animator";

// Grade Motion — a directed sequence of scenes on one persistent stage
// (text → demo → video → text). Scenes hold arbitrary JSX; screens get
// their own per-screen camera via MotionScreen; MotionText carries the
// Motion Templates. See STUDIO-DIRECTOR.md ("Grade Motion").
export {
  Motion,
  MotionScene,
  MotionScreen,
  MotionText,
  MotionOverlay,
  useMotionScene,
  type MotionProps,
  type MotionSceneProps,
  type MotionScreenProps,
  type MotionScreenAnimate,
  type MotionSceneTransition,
  type MotionTextProps,
  type MotionTextTemplate,
  type MotionOverlayProps,
  type MotionOverlayZone,
  type MotionSceneRegistration,
} from "../components/ui/motion";

export { ThreeScene, type ThreeSceneProps } from "../components/ui/three-scene";
export { ShaderControls, type ShaderControlsProps } from "../components/ui/shader-controls";
export {
  BackgroundFill,
  type BackgroundFillProps,
  type BackgroundFillType,
  type BackgroundFillFit,
} from "../components/ui/background-fill";
export {
  FillPicker,
  type FillPickerProps,
  type FillValue,
  FILL_TOKENS,
} from "../components/ui/fill-picker";

export {
  ShaderPresetPreview,
  type ShaderPresetPreviewProps,
} from "../components/ui/shader-preset-preview";

export {
  ShaderPresetPicker,
  type ShaderPresetPickerProps,
} from "../components/ui/shader-preset-picker";

// Media preset registry + types
export {
  shaderPresets,
  shaderPresetById,
  sceneRegistry,
} from "./three/shader-presets";

export { postPresets, defaultPostPreset } from "./three/post-presets";

// Custom fragment shader support — uniform contract + error class for
// consumers who want to catch compile errors off `<ThreeScene fragmentShader>`.
export {
  FRAGMENT_HEADER,
  ShaderCompileError,
  buildFragmentShaderScene,
} from "./three/custom-fragment";

export type {
  ShaderPreset,
  PostPreset,
  SceneContext,
  SceneHandle,
  SceneFactory,
  Palette,
} from "./three/types";

// Utility functions
export { cn } from "./utils";

// Providers
export { LenisProvider } from "../components/lenis-provider";

// Theme system — runtime skinning (OKLCH generator-based)
export {
  GradeThemeProvider,
  useGradeTheme,
  useMaybeGradeTheme,
  GRADE_PRE_HYDRATION_SCRIPT,
  ALL_MODES,
  type GradeThemeProviderProps,
} from "../components/grade-theme-provider";
export { GradeThemeSwitcher } from "../components/grade-theme-switcher";
export { GradeModeSwitcher } from "../components/grade-mode-switcher";
export { ThemeToggle } from "../components/theme-toggle";
export {
  // Generator + core
  generateTheme,
  themeToCSSVars,
  applyThemeToRoot,
  // Registry
  builtInThemes,
  defaultThemeId,
  getTheme,
  listThemes,
  // Built-in inputs (for round-trip editing in the theme builder)
  calmInput,
  energyInput,
  BUILT_IN_INPUTS,
  // User-theme CRUD
  listUserThemes,
  loadUserThemeInput,
  saveUserTheme,
  deleteUserTheme,
  duplicateTheme,
  // Types
  type GeneratedTheme,
  type ThemeInput,
  type ModeName,
  type Ramp,
  type OKLCHTriplet,
  type FontKey,
  type TypeScalePreset,
  type SpacingDensity,
  type RadiusStyle,
  type ShadowIntensity,
  type ColorIntensity,
  type ChartPalette,
  type ButtonShape,
  type InputStyle,
  type CardStyle,
} from "./themes";
