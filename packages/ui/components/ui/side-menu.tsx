"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

// Types
export interface SideMenuItem {
  id: string
  label: string
  href?: string
  icon?: React.ReactNode
  badge?: string | number
  onClick?: () => void
  disabled?: boolean
}

export interface SideMenuSection {
  id: string
  title: string
  icon?: React.ReactNode
  items: SideMenuItem[]
  defaultExpanded?: boolean
}

export interface SideMenuProps {
  /** Header content (logo, title, etc.) */
  header?: React.ReactNode
  /** Header content shown when collapsed (icon, etc.) */
  collapsedHeader?: React.ReactNode
  /** Navigation sections with collapsible groups */
  sections?: SideMenuSection[]
  /** Standalone items without sections */
  items?: SideMenuItem[]
  /** Footer content */
  footer?: React.ReactNode
  /** Whether the sidebar is collapsed */
  collapsed?: boolean
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Whether the sidebar can be collapsed */
  collapsible?: boolean
  /** Default collapsed state */
  defaultCollapsed?: boolean
  /** Currently active item id */
  activeItem?: string
  /** Custom className */
  className?: string
  /** Custom link component (e.g., Next.js Link) */
  linkComponent?: React.ComponentType<{
    href: string
    className?: string
    children: React.ReactNode
  }>
}

// Context for sharing state
interface SideMenuContextValue {
  collapsed: boolean
  activeItem?: string
  LinkComponent: React.ComponentType<{
    href: string
    className?: string
    children: React.ReactNode
  }>
}

const SideMenuContext = React.createContext<SideMenuContextValue | null>(null)

function useSideMenu() {
  const context = React.useContext(SideMenuContext)
  if (!context) {
    throw new Error("SideMenu components must be used within SideMenu")
  }
  return context
}

// Default link component
const DefaultLink: React.FC<{
  href: string
  className?: string
  children: React.ReactNode
}> = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
)

// Main SideMenu component
const SideMenu = React.forwardRef<HTMLElement, SideMenuProps>(
  (
    {
      header,
      collapsedHeader,
      sections,
      items,
      footer,
      collapsed: controlledCollapsed,
      onCollapsedChange,
      collapsible = true,
      defaultCollapsed = false,
      activeItem,
      className,
      linkComponent: LinkComponent = DefaultLink,
    },
    ref
  ) => {
    const [internalCollapsed, setInternalCollapsed] =
      React.useState(defaultCollapsed)

    // Support both controlled and uncontrolled modes
    const collapsed = controlledCollapsed ?? internalCollapsed

    const handleToggle = () => {
      const newCollapsed = !collapsed
      setInternalCollapsed(newCollapsed)
      onCollapsedChange?.(newCollapsed)
    }

    return (
      <TooltipProvider delayDuration={0}>
        <SideMenuContext.Provider
          value={{ collapsed, activeItem, LinkComponent }}
        >
          <aside
            ref={ref}
            className={cn(
              "flex h-full flex-col transition-[width] duration-300 ease-in-out",
              "bg-white dark:bg-[#141414] border-r border-rds-gray-200 dark:border-[#1a1a1a]",
              collapsed ? "w-16" : "w-64",
              className
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center border-b border-rds-gray-200 dark:border-[#1a1a1a] flex-shrink-0 h-12",
                collapsed
                  ? "justify-center px-2"
                  : "justify-between px-3"
              )}
            >
              {collapsed ? collapsedHeader || header : header}

              {collapsible && (
                <button
                  onClick={handleToggle}
                  className={cn(
                    "rounded-md h-5 w-5 flex items-center justify-center",
                    "text-rds-gray-400 dark:text-rds-gray-500",
                    "hover:text-rds-gray-600 dark:hover:text-rds-gray-300 transition-colors",
                    "bg-white dark:bg-[#141414] border border-rds-gray-200 dark:border-rds-gray-700 shadow-sm",
                    collapsed && "absolute left-[calc(4rem-10px)] top-6 -translate-y-1/2 z-50"
                  )}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronLeft className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
              {/* Standalone items */}
              {items && items.length > 0 && (
                <div className="px-2 mb-1 space-y-0.5">
                  {items.map((item) => (
                    <SideMenuItemComponent key={item.id} item={item} />
                  ))}
                </div>
              )}

              {/* Sections */}
              {sections?.map((section) => (
                <SideMenuSectionComponent key={section.id} section={section} />
              ))}
            </nav>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 border-t border-rds-gray-200 dark:border-[#1a1a1a] p-2">
                {footer}
              </div>
            )}
          </aside>
        </SideMenuContext.Provider>
      </TooltipProvider>
    )
  }
)
SideMenu.displayName = "SideMenu"

// Section component
function SideMenuSectionComponent({ section }: { section: SideMenuSection }) {
  const { collapsed } = useSideMenu()
  const [expanded, setExpanded] = React.useState(
    section.defaultExpanded ?? true
  )

  if (collapsed) {
    // When collapsed, show items directly without section headers
    return (
      <div className="px-2 mb-1 space-y-0.5">
        {section.items.map((item) => (
          <SideMenuItemComponent key={item.id} item={item} />
        ))}
      </div>
    )
  }

  return (
    <div className="px-2 mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium",
          "text-rds-gray-700 dark:text-rds-gray-300",
          "hover:bg-rds-gray-50 dark:hover:bg-rds-gray-900",
          "hover:text-rds-gray-900 dark:hover:text-white transition-colors"
        )}
      >
        {section.icon && (
          <span className="h-3.5 w-3.5 flex-shrink-0">{section.icon}</span>
        )}
        <span className="flex-1 text-left">{section.title}</span>
        {expanded ? (
          <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
        )}
      </button>

      {expanded && (
        <div className="mt-0.5 space-y-0.5 relative pl-5">
          <div className="absolute left-[1.1rem] top-0 bottom-0 w-px bg-rds-gray-200 dark:bg-rds-gray-700" />
          {section.items.map((item) => (
            <SideMenuItemComponent key={item.id} item={item} nested />
          ))}
        </div>
      )}
    </div>
  )
}

// Item component
function SideMenuItemComponent({
  item,
  nested = false,
}: {
  item: SideMenuItem
  nested?: boolean
}) {
  const { collapsed, activeItem, LinkComponent } = useSideMenu()
  const isActive = activeItem === item.id

  const itemClasses = cn(
    "flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
    collapsed ? "justify-center px-2 py-2.5" : "px-2 py-1.5",
    isActive
      ? nested
        ? "bg-rds-gray-100 dark:bg-[#1a1a1a] text-rds-gray-900 dark:text-white"
        : "bg-rds-green-50 dark:bg-rds-green-950 text-rds-green-700 dark:text-rds-green-400"
      : "text-rds-gray-700 dark:text-rds-gray-300 hover:bg-rds-gray-50 dark:hover:bg-rds-gray-900 hover:text-rds-gray-900 dark:hover:text-white",
    item.disabled && "opacity-50 pointer-events-none"
  )

  const content = (
    <>
      {item.icon && (
        <span
          className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-3.5 w-3.5")}
        >
          {item.icon}
        </span>
      )}
      {!collapsed && <span>{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto text-xs bg-rds-gray-100 dark:bg-rds-gray-800 px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      )}
    </>
  )

  const element = item.href ? (
    <LinkComponent href={item.href} className={itemClasses}>
      {content}
    </LinkComponent>
  ) : (
    <button
      onClick={item.onClick}
      disabled={item.disabled}
      className={cn(itemClasses, "w-full")}
    >
      {content}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{element}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return element
}

export { SideMenu }
