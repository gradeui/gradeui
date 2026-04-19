"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

// Types
export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface TopMenuProps {
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
  /** Show mobile menu button */
  showMobileMenu?: boolean
  /** Mobile menu button click handler */
  onMobileMenuClick?: () => void
  /** Left side content (appears after breadcrumbs) */
  leftContent?: React.ReactNode
  /** Right side content (actions, user menu, etc.) */
  rightContent?: React.ReactNode
  /** Custom className */
  className?: string
  /** Custom link component (e.g., Next.js Link) */
  linkComponent?: React.ComponentType<{
    href: string
    className?: string
    children: React.ReactNode
  }>
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

const TopMenu = React.forwardRef<HTMLElement, TopMenuProps>(
  (
    {
      breadcrumbs = [],
      showMobileMenu = false,
      onMobileMenuClick,
      leftContent,
      rightContent,
      className,
      linkComponent: LinkComponent = DefaultLink,
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-30 flex h-12 items-center gap-3",
          "border-b border-rds-gray-200 dark:border-[#1a1a1a]",
          "bg-white dark:bg-[#141414] px-4",
          className
        )}
      >
        {/* Mobile Menu Button */}
        {showMobileMenu && (
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden rounded-md p-1.5 text-rds-gray-600 hover:bg-rds-gray-100 dark:text-rds-gray-400 dark:hover:bg-rds-gray-800"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav
            className="hidden md:flex items-center gap-1.5 text-sm"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-rds-gray-400 dark:text-rds-gray-500 text-xs">
                    /
                  </span>
                )}
                {crumb.href ? (
                  <LinkComponent
                    href={crumb.href}
                    className="text-rds-gray-600 dark:text-rds-gray-400 hover:text-rds-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    {crumb.label}
                  </LinkComponent>
                ) : (
                  <span className="text-rds-gray-900 dark:text-white font-medium text-sm">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Left Content */}
        {leftContent}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Content */}
        {rightContent && (
          <div className="flex items-center gap-1.5">{rightContent}</div>
        )}
      </header>
    )
  }
)
TopMenu.displayName = "TopMenu"

// User Menu Component
export interface TopMenuUserProps {
  /** User name */
  name?: string
  /** User email */
  email?: string
  /** User avatar URL */
  avatarUrl?: string
  /** Custom avatar content (icon, initials, etc.) */
  avatarContent?: React.ReactNode
  /** Avatar background color class */
  avatarClassName?: string
  /** Menu items */
  children?: React.ReactNode
  /** Custom className */
  className?: string
}

const TopMenuUser = React.forwardRef<HTMLDivElement, TopMenuUserProps>(
  (
    {
      name,
      email,
      avatarUrl,
      avatarContent,
      avatarClassName,
      children,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const menuRef = React.useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setOpen(false)
        }
      }

      if (open) {
        document.addEventListener("mousedown", handleClickOutside)
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [open])

    return (
      <div ref={ref} className={cn("relative", className)}>
        <div ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-rds-green-500 hover:ring-offset-2 dark:hover:ring-offset-[#141414] transition-all"
            aria-label="Account menu"
          >
            <div
              className={cn(
                "h-8 w-8 rounded-full overflow-hidden flex items-center justify-center",
                avatarClassName ||
                  "bg-gradient-to-br from-rds-yellow-400 to-rds-yellow-600"
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                avatarContent
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-rds-gray-200 dark:border-[#1a1a1a] bg-white dark:bg-[#141414] shadow-lg overflow-hidden z-50">
              {/* User Info */}
              {(name || email) && (
                <div className="px-4 py-3 border-b border-rds-gray-200 dark:border-[#1a1a1a]">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full overflow-hidden flex items-center justify-center",
                        avatarClassName ||
                          "bg-gradient-to-br from-rds-yellow-400 to-rds-yellow-600"
                      )}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name || "User"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        avatarContent
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {name && (
                        <p className="text-sm font-medium text-rds-gray-900 dark:text-white truncate">
                          {name}
                        </p>
                      )}
                      {email && (
                        <p className="text-xs text-rds-gray-500 dark:text-rds-gray-400 truncate">
                          {email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }
)
TopMenuUser.displayName = "TopMenuUser"

// User Menu Item
export interface TopMenuUserItemProps {
  /** Item icon */
  icon?: React.ReactNode
  /** Item label */
  children: React.ReactNode
  /** Click handler */
  onClick?: () => void
  /** Href for link items */
  href?: string
  /** Variant */
  variant?: "default" | "danger" | "success"
  /** Custom className */
  className?: string
}

const TopMenuUserItem = React.forwardRef<
  HTMLButtonElement,
  TopMenuUserItemProps
>(({ icon, children, onClick, href, variant = "default", className }, ref) => {
  const variantClasses = {
    default:
      "text-rds-gray-700 dark:text-rds-gray-300 hover:bg-rds-gray-50 dark:hover:bg-[#1a1a1a]",
    danger:
      "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
    success:
      "text-rds-green-600 dark:text-rds-green-400 hover:bg-rds-green-50 dark:hover:bg-rds-green-950/20",
  }

  const Component = href ? "a" : "button"

  return (
    <Component
      ref={ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>}
      onClick={onClick}
      href={href}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
        variantClasses[variant],
        className
      )}
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      <span>{children}</span>
    </Component>
  )
})
TopMenuUserItem.displayName = "TopMenuUserItem"

// User Menu Section (for grouping items with borders)
const TopMenuUserSection = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "py-1 border-t border-rds-gray-200 dark:border-[#1a1a1a] first:border-t-0",
      className
    )}
  >
    {children}
  </div>
))
TopMenuUserSection.displayName = "TopMenuUserSection"

export { TopMenu, TopMenuUser, TopMenuUserItem, TopMenuUserSection }
