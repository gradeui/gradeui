"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Types
export interface SimpleTab {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SimpleTabsProps {
  /** Array of tab definitions */
  tabs: SimpleTab[]
  /** Currently active tab id */
  activeTab?: string
  /** Default active tab id (for uncontrolled mode) */
  defaultTab?: string
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void
  /** Tab panel children */
  children?: React.ReactNode
  /** Custom className for the container */
  className?: string
  /** Custom className for the tabs list */
  tabsClassName?: string
}

export interface SimpleTabsPanelProps {
  /** Tab id this panel corresponds to */
  id: string
  /** Panel content */
  children: React.ReactNode
  /** Custom className */
  className?: string
}

// Context for sharing state
interface SimpleTabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const SimpleTabsContext = React.createContext<SimpleTabsContextValue | null>(
  null
)

function useSimpleTabs() {
  const context = React.useContext(SimpleTabsContext)
  if (!context) {
    throw new Error("SimpleTabsPanel must be used within SimpleTabs")
  }
  return context
}

// Main SimpleTabs component
const SimpleTabs = React.forwardRef<HTMLDivElement, SimpleTabsProps>(
  (
    {
      tabs,
      activeTab: controlledActiveTab,
      defaultTab,
      onTabChange,
      children,
      className,
      tabsClassName,
    },
    ref
  ) => {
    const [internalActiveTab, setInternalActiveTab] = React.useState(
      defaultTab || tabs[0]?.id || ""
    )

    // Support both controlled and uncontrolled modes
    const activeTab = controlledActiveTab ?? internalActiveTab

    const handleTabChange = (tabId: string) => {
      setInternalActiveTab(tabId)
      onTabChange?.(tabId)
    }

    return (
      <SimpleTabsContext.Provider
        value={{ activeTab, setActiveTab: handleTabChange }}
      >
        <div ref={ref} className={cn("space-y-6", className)}>
          {/* Tab Navigation */}
          <div className="border-b border-rds-gray-200 dark:border-rds-gray-800">
            <nav
              className={cn(
                "-mb-px flex gap-1 overflow-x-auto scrollbar-hide",
                tabsClassName
              )}
              aria-label="Tabs"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && handleTabChange(tab.id)}
                    disabled={tab.disabled}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                      tab.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
                    {tab.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {children && <div>{children}</div>}
        </div>
      </SimpleTabsContext.Provider>
    )
  }
)
SimpleTabs.displayName = "SimpleTabs"

// Tab Panel component
const SimpleTabsPanel = React.forwardRef<HTMLDivElement, SimpleTabsPanelProps>(
  ({ id, children, className }, ref) => {
    const { activeTab } = useSimpleTabs()

    if (activeTab !== id) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-labelledby={`tab-${id}`}
        className={className}
      >
        {children}
      </div>
    )
  }
)
SimpleTabsPanel.displayName = "SimpleTabsPanel"

// Compound component for more flexible usage
export interface SimpleTabsRootProps {
  /** Currently active tab id */
  activeTab?: string
  /** Default active tab id (for uncontrolled mode) */
  defaultTab?: string
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void
  /** Children (SimpleTabsList and SimpleTabsPanel components) */
  children: React.ReactNode
  /** Custom className */
  className?: string
}

const SimpleTabsRoot = React.forwardRef<HTMLDivElement, SimpleTabsRootProps>(
  (
    { activeTab: controlledActiveTab, defaultTab, onTabChange, children, className },
    ref
  ) => {
    const [internalActiveTab, setInternalActiveTab] = React.useState(
      defaultTab || ""
    )

    const activeTab = controlledActiveTab ?? internalActiveTab

    const handleTabChange = (tabId: string) => {
      setInternalActiveTab(tabId)
      onTabChange?.(tabId)
    }

    return (
      <SimpleTabsContext.Provider
        value={{ activeTab, setActiveTab: handleTabChange }}
      >
        <div ref={ref} className={cn("space-y-6", className)}>
          {children}
        </div>
      </SimpleTabsContext.Provider>
    )
  }
)
SimpleTabsRoot.displayName = "SimpleTabsRoot"

// Tabs List for compound component pattern
export interface SimpleTabsListProps {
  children: React.ReactNode
  className?: string
}

const SimpleTabsList = React.forwardRef<HTMLDivElement, SimpleTabsListProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className="border-b border-rds-gray-200 dark:border-rds-gray-800"
      >
        <nav
          className={cn(
            "-mb-px flex gap-1 overflow-x-auto scrollbar-hide",
            className
          )}
          role="tablist"
          aria-label="Tabs"
        >
          {children}
        </nav>
      </div>
    )
  }
)
SimpleTabsList.displayName = "SimpleTabsList"

// Tab Trigger for compound component pattern
export interface SimpleTabsTriggerProps {
  /** Tab id */
  value: string
  /** Tab content */
  children: React.ReactNode
  /** Tab icon */
  icon?: React.ReactNode
  /** Disabled state */
  disabled?: boolean
  /** Custom className */
  className?: string
}

const SimpleTabsTrigger = React.forwardRef<
  HTMLButtonElement,
  SimpleTabsTriggerProps
>(({ value, children, icon, disabled, className }, ref) => {
  const { activeTab, setActiveTab } = useSimpleTabs()
  const isActive = activeTab === value

  return (
    <button
      ref={ref}
      role="tab"
      id={`tab-${value}`}
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={cn(
        "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      {children}
      {isActive && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          aria-hidden="true"
        />
      )}
    </button>
  )
})
SimpleTabsTrigger.displayName = "SimpleTabsTrigger"

// Tab Content for compound component pattern
const SimpleTabsContent = React.forwardRef<
  HTMLDivElement,
  { value: string; children: React.ReactNode; className?: string }
>(({ value, children, className }, ref) => {
  const { activeTab } = useSimpleTabs()

  if (activeTab !== value) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={className}
    >
      {children}
    </div>
  )
})
SimpleTabsContent.displayName = "SimpleTabsContent"

export {
  SimpleTabs,
  SimpleTabsPanel,
  SimpleTabsRoot,
  SimpleTabsList,
  SimpleTabsTrigger,
  SimpleTabsContent,
}
