/**
 * Component contract registry — auto-managed by
 * scripts/generate-contracts.mjs. Hand-authored contracts (MediaSurface,
 * etc.) are also wired in here; the generator preserves them on each
 * run.
 */

import type { ComponentContract } from "@gradeui/contracts";
import { AccordionContract } from "../components/ui/accordion.contract";
import { AiChatContract } from "../components/ui/ai-chat.contract";
import { AiChatComposerContract } from "../components/ui/ai-chat-composer.contract";
import { AppShellContract } from "../components/ui/app-shell.contract";
import { AvatarContract } from "../components/ui/avatar.contract";
import { BackgroundFillContract } from "../components/ui/background-fill.contract";
import { BadgeContract } from "../components/ui/badge.contract";
import { BannerContract } from "../components/ui/banner.contract";
import { BreadcrumbContract } from "../components/ui/breadcrumb.contract";
import { ButtonContract } from "../components/ui/button.contract";
import { CalendarContract } from "../components/ui/calendar.contract";
import { CalloutContract } from "../components/ui/callout.contract";
import { CardContract } from "../components/ui/card.contract";
import { CarouselContract } from "../components/ui/carousel.contract";
import { ChartContract } from "../components/ui/chart.contract";
import { CheckboxContract } from "../components/ui/checkbox.contract";
import { CheckboxCardContract } from "../components/ui/checkbox-card.contract";
import { CodeContract } from "../components/ui/code.contract";
import { CollapsibleContract } from "../components/ui/collapsible.contract";
import { CommandContract } from "../components/ui/command.contract";
import { ComposerContract } from "../components/ui/composer.contract";
import { DatePickerContract } from "../components/ui/date-picker.contract";
import { DialogContract } from "../components/ui/dialog.contract";
import { DropdownMenuContract } from "../components/ui/dropdown-menu.contract";
import { FieldContract } from "../components/ui/field.contract";
import { FillPickerContract } from "../components/ui/fill-picker.contract";
import { FlexContract } from "../components/ui/flex.contract";
import { GridContract } from "../components/ui/grid.contract";
import { HoverCardContract } from "../components/ui/hover-card.contract";
import { InputContract } from "../components/ui/input.contract";
import { LabelContract } from "../components/ui/label.contract";
import { LogoContract } from "../components/ui/logo.contract";
import { MapContract } from "../components/ui/map.contract";
import { MediaSurfaceContract } from "../components/ui/media-surface.contract";
import { MessageContract } from "../components/ui/message.contract";
import { MotionContract } from "../components/ui/motion.contract";
import { MultiSelectContract } from "../components/ui/multi-select.contract";
import { PopoverContract } from "../components/ui/popover.contract";
import { ProgressContract } from "../components/ui/progress.contract";
import { RadioCardContract } from "../components/ui/radio-card.contract";
import { RadioGroupContract } from "../components/ui/radio-group.contract";
import { ResizableContract } from "../components/ui/resizable.contract";
import { RivePlayerContract } from "../components/ui/rive-player.contract";
import { RowContract } from "../components/ui/row.contract";
import { ScreenAnimatorContract } from "../components/ui/screen-animator.contract";
import { ScrollAreaContract } from "../components/ui/scroll-area.contract";
import { SectionBlockContract } from "../components/ui/section-block.contract";
import { SelectContract } from "../components/ui/select.contract";
import { SeparatorContract } from "../components/ui/separator.contract";
import { ShaderPresetPickerContract } from "../components/ui/shader-preset-picker.contract";
import { ShaderPresetPreviewContract } from "../components/ui/shader-preset-preview.contract";
import { SheetContract } from "../components/ui/sheet.contract";
import { SidebarContract } from "../components/ui/sidebar.contract";
import { SkeletonContract } from "../components/ui/skeleton.contract";
import { SliderContract } from "../components/ui/slider.contract";
import { SortableContract } from "../components/ui/sortable.contract";
import { StackContract } from "../components/ui/stack.contract";
import { SwitchContract } from "../components/ui/switch.contract";
import { SwitchCardContract } from "../components/ui/switch-card.contract";
import { TableContract } from "../components/ui/table.contract";
import { TabsContract } from "../components/ui/tabs.contract";
import { TextareaContract } from "../components/ui/textarea.contract";
import { ThreeSceneContract } from "../components/ui/three-scene.contract";
import { ToastContract } from "../components/ui/toast.contract";
import { ToggleContract } from "../components/ui/toggle.contract";
import { ToggleGroupContract } from "../components/ui/toggle-group.contract";
import { ToolbarContract } from "../components/ui/toolbar.contract";
import { TooltipContract } from "../components/ui/tooltip.contract";
import { VideoPlayerContract } from "../components/ui/video-player.contract";

export const COMPONENT_CONTRACTS: Readonly<Record<string, ComponentContract>> = {
  Accordion: AccordionContract,
  AiChat: AiChatContract,
  AiChatComposer: AiChatComposerContract,
  AppShell: AppShellContract,
  Avatar: AvatarContract,
  BackgroundFill: BackgroundFillContract,
  Badge: BadgeContract,
  Banner: BannerContract,
  Breadcrumb: BreadcrumbContract,
  Button: ButtonContract,
  Calendar: CalendarContract,
  Callout: CalloutContract,
  Card: CardContract,
  Carousel: CarouselContract,
  Chart: ChartContract,
  Checkbox: CheckboxContract,
  CheckboxCard: CheckboxCardContract,
  Code: CodeContract,
  Collapsible: CollapsibleContract,
  Command: CommandContract,
  Composer: ComposerContract,
  DatePicker: DatePickerContract,
  Dialog: DialogContract,
  DropdownMenu: DropdownMenuContract,
  Field: FieldContract,
  FillPicker: FillPickerContract,
  Flex: FlexContract,
  Grid: GridContract,
  HoverCard: HoverCardContract,
  Input: InputContract,
  Label: LabelContract,
  Logo: LogoContract,
  Map: MapContract,
  MediaSurface: MediaSurfaceContract,
  Message: MessageContract,
  Motion: MotionContract,
  MultiSelect: MultiSelectContract,
  Popover: PopoverContract,
  Progress: ProgressContract,
  RadioCard: RadioCardContract,
  RadioGroup: RadioGroupContract,
  Resizable: ResizableContract,
  RivePlayer: RivePlayerContract,
  Row: RowContract,
  ScreenAnimator: ScreenAnimatorContract,
  ScrollArea: ScrollAreaContract,
  SectionBlock: SectionBlockContract,
  Select: SelectContract,
  Separator: SeparatorContract,
  ShaderPresetPicker: ShaderPresetPickerContract,
  ShaderPresetPreview: ShaderPresetPreviewContract,
  Sheet: SheetContract,
  Sidebar: SidebarContract,
  Skeleton: SkeletonContract,
  Slider: SliderContract,
  Sortable: SortableContract,
  Stack: StackContract,
  Switch: SwitchContract,
  SwitchCard: SwitchCardContract,
  Table: TableContract,
  Tabs: TabsContract,
  Textarea: TextareaContract,
  ThreeScene: ThreeSceneContract,
  Toast: ToastContract,
  Toggle: ToggleContract,
  ToggleGroup: ToggleGroupContract,
  Toolbar: ToolbarContract,
  Tooltip: TooltipContract,
  VideoPlayer: VideoPlayerContract,
};

export function getComponentContract(
  componentName: string | null | undefined,
): ComponentContract | null {
  if (!componentName) return null;
  return COMPONENT_CONTRACTS[componentName] ?? null;
}

export function listContractedComponents(): string[] {
  return Object.keys(COMPONENT_CONTRACTS);
}
