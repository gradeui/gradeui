export const componentsList = [
  // Layout
  { name: "App Shell", href: "/components/app-shell", category: "Layout" },
  { name: "Stack", href: "/components/stack", category: "Layout" },
  { name: "Row", href: "/components/row", category: "Layout" },
  { name: "Grid", href: "/components/grid", category: "Layout" },
  { name: "Flex", href: "/components/flex", category: "Layout" },
  { name: "Resizable", href: "/components/resizable", category: "Layout" },
  // Navigation — hoisted above Forms so the IA reads structure → nav →
  // controls. Sidebar lives here (compound API; renamed from SideMenu).
  { name: "Sidebar", href: "/components/sidebar", category: "Navigation" },
  { name: "Toolbar", href: "/components/toolbar", category: "Navigation" },
  { name: "Command", href: "/components/command", category: "Navigation" },
  { name: "Dropdown Menu", href: "/components/dropdown-menu", category: "Navigation" },
  { name: "Tabs", href: "/components/tabs", category: "Navigation" },
  { name: "Accordion", href: "/components/accordion", category: "Navigation" },
  { name: "Collapsible", href: "/components/collapsible", category: "Navigation" },
  { name: "Sheet", href: "/components/sheet", category: "Navigation" },
  { name: "Scroll Area", href: "/components/scroll-area", category: "Navigation" },
  // Forms
  { name: "Button", href: "/components/button", category: "Forms" },
  { name: "Input", href: "/components/input", category: "Forms" },
  { name: "Textarea", href: "/components/textarea", category: "Forms" },
  { name: "Composer", href: "/components/composer", category: "Forms" },
  { name: "Label", href: "/components/label", category: "Forms" },
  { name: "Field", href: "/components/field", category: "Forms" },
  { name: "Select", href: "/components/select", category: "Forms" },
  { name: "Multi Select", href: "/components/multi-select", category: "Forms" },
  { name: "Checkbox", href: "/components/checkbox", category: "Forms" },
  { name: "Radio Group", href: "/components/radio-group", category: "Forms" },
  { name: "Switch", href: "/components/switch", category: "Forms" },
  { name: "Slider", href: "/components/slider", category: "Forms" },
  { name: "Toggle", href: "/components/toggle", category: "Forms" },
  { name: "Toggle Group", href: "/components/toggle-group", category: "Forms" },
  { name: "Calendar", href: "/components/calendar", category: "Forms" },
  { name: "Date Picker", href: "/components/date-picker", category: "Forms" },
  // Data Display
  { name: "Avatar", href: "/components/avatar", category: "Data Display" },
  { name: "Logo", href: "/components/logo", category: "Data Display" },
  { name: "Badge", href: "/components/badge", category: "Data Display" },
  { name: "Message", href: "/components/message", category: "Data Display" },
  { name: "Card", href: "/components/card", category: "Data Display" },
  { name: "Chart", href: "/components/charts", category: "Data Display" },
  { name: "Table", href: "/components/table", category: "Data Display" },
  { name: "Skeleton", href: "/components/skeleton", category: "Data Display" },
  { name: "Separator", href: "/components/separator", category: "Data Display" },
  { name: "Hover Card", href: "/components/hover-card", category: "Data Display" },
  // Feedback
  { name: "Banner", href: "/components/banner", category: "Feedback" },
  { name: "Callout", href: "/components/callout", category: "Feedback" },
  { name: "Dialog", href: "/components/dialog", category: "Feedback" },
  { name: "Popover", href: "/components/popover", category: "Feedback" },
  { name: "Toast", href: "/components/toast", category: "Feedback" },
  { name: "Tooltip", href: "/components/tooltip", category: "Feedback" },
  { name: "Progress", href: "/components/progress", category: "Feedback" },
  // Media
  { name: "Carousel", href: "/components/carousel", category: "Media" },
  { name: "Code", href: "/components/code", category: "Media" },
  { name: "Video Player", href: "/components/video-player", category: "Media" },
  { name: "Rive Player", href: "/components/rive-player", category: "Media" },
  { name: "Three Scene", href: "/components/three-scene", category: "Media" },
  { name: "Shader Preset Preview", href: "/components/shader-preset-preview", category: "Media" },
  { name: "Shader Preset Picker", href: "/components/shader-preset-picker", category: "Media" },
  { name: "Background Fill", href: "/components/background-fill", category: "Media" },
  // Interactions — drag/drop, motion, gesture primitives. New category
  // landed May 2026 with Sortable; motion is documented here too even
  // though it's an external library (allow-listed import), not a Grade
  // component.
  { name: "Sortable", href: "/components/sortable", category: "Interactions" },
  // Map
  { name: "Map", href: "/components/map", category: "Map" },
  // Studio — Grade-specific surfaces that compose the DS into higher-
  // order tools (chat, contract-derived props rendering). Renamed from
  // "Blocks" in May 2026; the category now reads as "what Grade Studio
  // is built from" rather than the older catch-all label.
  { name: "Presence", href: "/components/presence", category: "Studio" },
  { name: "AI Chat", href: "/components/ai-chat", category: "Studio" },
  { name: "Component Props", href: "/components/component-props", category: "Studio" },
];

export function getComponentNav(currentHref: string) {
  const index = componentsList.findIndex((c) => c.href === currentHref);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? componentsList[index - 1] : null,
    next: index < componentsList.length - 1 ? componentsList[index + 1] : null,
  };
}
