// UI Components
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

export {
  AppShell,
  AppShellNav,
  AppShellMain,
  shellVariants,
  navVariants as appShellNavVariants,
  mainVariants as appShellMainVariants,
  type AppShellProps,
  type AppShellNavProps,
  type AppShellMainProps,
} from "../components/ui/app-shell";

export { Badge, badgeVariants } from "../components/ui/badge";

export { Button, buttonVariants } from "../components/ui/button";

export { Calendar, CalendarDayButton } from "../components/ui/calendar";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export { Checkbox } from "../components/ui/checkbox";

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

export { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

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

export { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export { Textarea } from "../components/ui/textarea";

// Navigation components
export {
  SideMenu,
  type SideMenuItem,
  type SideMenuSection,
  type SideMenuProps,
} from "../components/ui/side-menu";

export {
  TopMenu,
  TopMenuUser,
  TopMenuUserItem,
  TopMenuUserSection,
  type BreadcrumbItem,
  type TopMenuProps,
  type TopMenuUserProps,
  type TopMenuUserItemProps,
} from "../components/ui/top-menu";

export {
  SimpleTabs,
  SimpleTabsPanel,
  SimpleTabsRoot,
  SimpleTabsList,
  SimpleTabsTrigger,
  SimpleTabsContent,
  type SimpleTab,
  type SimpleTabsProps,
  type SimpleTabsPanelProps,
  type SimpleTabsRootProps,
  type SimpleTabsListProps,
  type SimpleTabsTriggerProps,
} from "../components/ui/simple-tabs";

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// Media components
export {
  MediaSurface,
  usePrefersReducedMotion,
  type MediaSurfaceProps,
  type MediaAspect,
  type MediaRadius,
  type BaseMediaProps,
} from "../components/ui/media-surface";

export { VideoPlayer, type VideoPlayerProps } from "../components/ui/video-player";

export { RivePlayer, type RivePlayerProps } from "../components/ui/rive-player";

export { ThreeScene, type ThreeSceneProps } from "../components/ui/three-scene";

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
