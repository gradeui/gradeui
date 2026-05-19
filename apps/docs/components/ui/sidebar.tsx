"use client";

/**
 * Sidebar — apps/docs parallel copy of @gradeui/ui's Sidebar.
 * See packages/ui/components/ui/sidebar.tsx for the canonical version
 * (and sidebar.md for the API + anti-patterns). These must stay in
 * sync until the docs site migrates to importing from `@gradeui/ui`
 * directly (gradeui/CLAUDE.md "Docs-site work" note).
 *
 * Renamed from `SideMenu` (May 2026); rebuilt around a compound API.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarContextValue {
  collapsed: boolean;
}
const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar(componentName: string): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error(`<${componentName}> must be rendered inside a <Sidebar> root.`);
  }
  return ctx;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (next: boolean) => void;
  collapsible?: boolean;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      collapsed: controlledCollapsed,
      defaultCollapsed = false,
      onCollapsedChange,
      collapsible = true,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const isControlled = controlledCollapsed !== undefined;
    const [internal, setInternal] = React.useState(defaultCollapsed);
    const collapsed = isControlled ? controlledCollapsed! : internal;

    const toggle = () => {
      const next = !collapsed;
      if (!isControlled) setInternal(next);
      onCollapsedChange?.(next);
    };

    return (
      <TooltipProvider delayDuration={0}>
        <SidebarContext.Provider value={{ collapsed }}>
          <aside
            ref={ref}
            data-gds-part="sidebar"
            data-collapsed={collapsed || undefined}
            className={cn(
              "relative flex h-full flex-col bg-card text-card-foreground border-r border-border",
              "transition-[width] duration-200 ease-out",
              className,
            )}
            style={{
              width: collapsed
                ? "var(--rds-sidebar-collapsed-width, 4rem)"
                : "var(--rds-sidebar-width, 16rem)",
              ...style,
            }}
            {...rest}
          >
            {children}
            {collapsible && (
              <button
                type="button"
                onClick={toggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                data-gds-part="sidebar-collapse-toggle"
                className={cn(
                  "absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center",
                  "rounded-full border border-border bg-card text-muted-foreground shadow-sm",
                  "hover:text-foreground hover:bg-muted transition-colors",
                )}
              >
                {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
              </button>
            )}
          </aside>
        </SidebarContext.Provider>
      </TooltipProvider>
    );
  },
);
Sidebar.displayName = "Sidebar";

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebar("SidebarHeader");
    return (
      <div
        ref={ref}
        data-gds-part="sidebar-header"
        data-collapsed={collapsed || undefined}
        className={cn(
          "flex shrink-0 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "px-3",
          "h-[var(--rds-sidebar-header-height,3.25rem)]",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarHeader.displayName = "SidebarHeader";

export interface SidebarContentProps extends React.HTMLAttributes<HTMLElement> {}
const SidebarContent = React.forwardRef<HTMLElement, SidebarContentProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      data-gds-part="sidebar-content"
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        "py-[var(--rds-sidebar-content-py,0.5rem)]",
        className,
      )}
      {...props}
    />
  ),
);
SidebarContent.displayName = "SidebarContent";

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebar("SidebarFooter");
    return (
      <div
        ref={ref}
        data-gds-part="sidebar-footer"
        data-collapsed={collapsed || undefined}
        className={cn(
          "shrink-0 border-t border-border",
          collapsed ? "px-2 py-2" : "px-3 py-2",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarFooter.displayName = "SidebarFooter";

export interface SidebarSectionProps
  // Omit `title` from the HTML attrs because the native `title` is a
  // tooltip-text `string`; ours is a ReactNode label shown above the
  // section items.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ title, icon, collapsible = true, defaultExpanded = true, className, children, ...rest }, ref) => {
    const { collapsed } = useSidebar("SidebarSection");
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const canCollapse = !!title && collapsible;

    if (collapsed) {
      return (
        <div
          ref={ref}
          data-gds-part="sidebar-section"
          className={cn(
            "px-[var(--rds-sidebar-section-px,0.5rem)] space-y-[var(--rds-sidebar-section-gap,0.125rem)]",
            className,
          )}
          {...rest}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-gds-part="sidebar-section"
        className={cn("px-[var(--rds-sidebar-section-px,0.5rem)] pb-1", className)}
        {...rest}
      >
        {title &&
          (canCollapse ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium uppercase tracking-wide",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
              )}
            >
              {icon}
              <span className="flex-1 text-left normal-case">{title}</span>
              {expanded ? (
                <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              )}
            </button>
          ) : (
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs font-medium uppercase tracking-wide",
                "text-muted-foreground",
              )}
            >
              {icon}
              <span>{title}</span>
            </div>
          ))}
        {expanded && (
          <div
            className={cn(
              "mt-[var(--rds-sidebar-section-gap,0.125rem)]",
              "space-y-[var(--rds-sidebar-section-gap,0.125rem)]",
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  },
);
SidebarSection.displayName = "SidebarSection";

export interface SidebarItemProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "title"> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  asButton?: boolean;
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  collapsedLabel?: React.ReactNode;
}

const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  (
    {
      icon,
      badge,
      active = false,
      asButton = false,
      asChild = false,
      disabled = false,
      collapsedLabel,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const { collapsed } = useSidebar("SidebarItem");

    const sharedClass = cn(
      "group flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
      collapsed ? "justify-center px-2 py-2" : "px-2 py-1.5",
      active
        ? "bg-primary/10 text-primary"
        : "text-foreground/80 hover:bg-muted hover:text-foreground",
      disabled && "opacity-50 pointer-events-none",
      className,
    );

    const body = (
      <>
        {icon && (
          <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" aria-hidden>
            {icon}
          </span>
        )}
        {!collapsed && <span className="flex-1 truncate text-left">{children}</span>}
        {!collapsed && badge !== undefined && badge !== null && (
          <span className="ml-auto inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </>
    );

    let element: React.ReactElement;
    if (asChild) {
      element = (
        <Slot
          data-gds-part="sidebar-item"
          data-active={active || undefined}
          aria-current={active ? "page" : undefined}
          className={sharedClass}
        >
          {children as React.ReactElement}
        </Slot>
      );
    } else if (asButton) {
      const {
        href: _href,
        target: _target,
        rel: _rel,
        download: _download,
        hrefLang: _hrefLang,
        ping: _ping,
        referrerPolicy: _referrerPolicy,
        type: _type,
        ...buttonRest
      } = rest as React.ButtonHTMLAttributes<HTMLButtonElement> &
        React.AnchorHTMLAttributes<HTMLAnchorElement>;
      element = (
        <button
          type="button"
          data-gds-part="sidebar-item"
          data-active={active || undefined}
          aria-current={active ? "page" : undefined}
          disabled={disabled}
          className={cn(sharedClass, "w-full text-left")}
          {...buttonRest}
        >
          {body}
        </button>
      );
    } else {
      element = (
        <a
          ref={ref}
          data-gds-part="sidebar-item"
          data-active={active || undefined}
          aria-current={active ? "page" : undefined}
          aria-disabled={disabled || undefined}
          className={sharedClass}
          {...rest}
        >
          {body}
        </a>
      );
    }

    if (!collapsed) return element;
    const tooltipLabel =
      collapsedLabel ?? (typeof children === "string" ? children : null);
    if (!tooltipLabel) return element;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{element}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {tooltipLabel}
          {badge !== undefined && badge !== null && (
            <span className="ml-2 inline-flex items-center justify-center rounded bg-foreground/10 px-1.5 py-0 text-[10px]">
              {badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  },
);
SidebarItem.displayName = "SidebarItem";

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarSection, SidebarItem };
