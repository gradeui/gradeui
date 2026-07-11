---
name: Sidebar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/sidebar"
subcomponents: [SidebarAccountDropdown, SidebarCollapseIcon, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarHeaderButton, SidebarInboxItem, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuCollapsible, SidebarMenuCollapsibleContent, SidebarMenuCollapsibleTrigger, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarPopoverMenu, SidebarPopoverMenuItem, SidebarPopoverTrigger, SidebarProvider, SidebarRail, SidebarSeparator, SidebarSwitcher, SidebarTrigger, useSidebar]
variants: [sidebar]
props:
  - side? (left)
  - collapsible? (offcanvas | icon | none)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - embedded — DEPRECATED since 2.9.0: Sidebar now always uses inline layout ()
---

Application sidebar layout with navigation menus, collapsible groups, and mobile support.

## Guidance

Sidebar is a comprehensive navigation system for application layouts. Custom implementation using Tailwind CSS and Radix UI primitives.

### When to Use
- Application shell navigation (dashboards, admin panels)
- Multi-level menu structures with nested items
- Collapsible navigation that adapts to screen size

### Features
- Collapsible states: expanded, icon-only, and offcanvas modes
- Nested navigation with tree-style expandable sub-items
- Responsive design with mobile sheet overlay
- Tooltips in icon-only mode for accessibility
- Keyboard navigation with full ARIA support
- Cookie persistence for user preferences

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "sidebar") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
