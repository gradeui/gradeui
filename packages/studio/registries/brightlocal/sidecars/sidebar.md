---
name: Sidebar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/sidebar"
subcomponents: [SidebarAccountDropdown, SidebarCollapseIcon, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarHeaderButton, SidebarInboxItem, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuCollapsible, SidebarMenuCollapsibleContent, SidebarMenuCollapsibleTrigger, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarPopoverMenu, SidebarPopoverMenuItem, SidebarPopoverTrigger, SidebarProvider, SidebarRail, SidebarSeparator, SidebarSwitcher, SidebarTrigger, useSidebar]
variants: [sidebar]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics Defaults to "sidebar" if not provided
  - trackingLabel?: string — Tracking label for analytics context
  - side? — Position of the sidebar (default SidebarSide.LEFT)
  - variant? — Visual variant of the sidebar (default SidebarVariant.SIDEBAR)
  - collapsible? — Collapsible behavior (default SidebarCollapsible.OFFCANVAS)
  - embedded?: boolean — DEPRECATED: No longer needed. The Sidebar now always uses inline layout for desktop and Sheet overlay for mobile. Remove this prop.
  - mobileTitle?: string — Accessible title for the mobile sheet overlay (default "Navigation")
  - mobileDescription?: string — Accessible description for the mobile sheet overlay (default "Main) navigation menu"
  - name: string — SidebarAccountDropdown: User's display name
  - email: string — SidebarAccountDropdown: User's email address
  - avatar? — SidebarAccountDropdown: Avatar element (use DS Avatar component)
  - menuGroups? — SidebarAccountDropdown: Menu items to render. Each group is separated by a divider.
  - onClick? — SidebarAccountDropdown:
  - icon? — SidebarAccountDropdown:
  - type? — SidebarCollapseIcon: Icon type variant (default SidebarCollapseIconType.CARET)
  - isActive?: boolean — SidebarCollapseIcon: Whether the icon is in active/open state
  - ariaLabel?: string — SidebarContent: Accessible label for the sidebar navigation landmark. Override for i18n. (default "Sidebar")
  - separator?: boolean — SidebarFooter: Whether to render a separator at the top of the footer. (default true)
  - asChild?: boolean — SidebarGroupAction: Render as a different element (Radix Slot pattern)
  - size? — SidebarGroupLabel: Size variant (default SidebarGroupLabelSize.SM)
  - isOpen?: boolean — SidebarGroupLabel: Whether the collapsible section is open
  - onToggle? — SidebarGroupLabel: Callback when collapsible is toggled
  - onAction? — SidebarGroupLabel: Callback when action is triggered
  - senderName: string — SidebarInboxItem: Sender or person name
  - title: string — SidebarInboxItem: Notification title
  - description?: string — SidebarInboxItem: Preview description text
  - timestamp?: string — SidebarInboxItem: Timestamp string
  - showOnHover?: boolean — SidebarMenuAction: Show action only on hover
  - tooltip? — SidebarMenuButton: Tooltip content to show when sidebar is collapsed
  - defaultOpen?: boolean — SidebarMenuCollapsible: Whether the collapsible is open by default
  - open?: boolean — SidebarMenuCollapsible: Controlled open state
  - onOpenChange? — SidebarMenuCollapsible: Callback when open state changes
  - className?: string — SidebarMenuCollapsible: Additional CSS classes
  - children? — SidebarMenuCollapsible:
  - showIcon?: boolean — SidebarMenuSkeleton: Show icon skeleton placeholder
  - groupTitle?: string — SidebarPopoverMenu: Group title displayed at the top of the menu. (default "Teams")
  - items? — SidebarPopoverMenu: Items to render in the menu
  - shortcut?: string — SidebarPopoverMenu:
  - triggerAriaLabel?: string — SidebarPopoverTrigger: Accessible label for the trigger button. (default "Switch) workspace"
  - toggleAriaLabel?: string — SidebarRail: Accessible label and tooltip for the rail toggle. (default "Toggle) Sidebar"
  - label: string — SidebarSwitcher: Label displayed in the trigger
  - triggerClassName?: string — SidebarSwitcher: Additional CSS classes for the trigger
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
