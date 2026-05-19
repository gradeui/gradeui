// UI Components
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

// Callout — renamed from Alert (May 2026). The `Alert` name is reserved
// for a future genuinely-interruptive primitive; modal-style "alert"
// semantics today live in <Dialog>.
export { Callout, CalloutDescription, CalloutTitle } from "../components/ui/callout";

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
// Sidebar — renamed from SideMenu (May 2026). Compound API:
// Sidebar / SidebarHeader / SidebarContent / SidebarFooter /
// SidebarSection / SidebarItem.
export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  type SidebarProps,
  type SidebarHeaderProps,
  type SidebarContentProps,
  type SidebarFooterProps,
  type SidebarSectionProps,
  type SidebarItemProps,
} from "../components/ui/sidebar";


// SimpleTabs retired (May 2026) — merged into Tabs as `variant="underlined"`.
// `<Tabs><TabsList variant="underlined">…</TabsList></Tabs>` is the replacement.

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

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
  studioInput,
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
