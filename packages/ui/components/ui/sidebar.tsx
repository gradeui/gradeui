"use client";

/**
 * Sidebar — compound layout primitive for vertical app navigation.
 *
 * Renamed from `SideMenu` (May 2026) and rebuilt around a compound API
 * so consumers can slot custom content into the header/content/footer
 * regions instead of being forced through a data-driven `sections=[...]`
 * prop. Replaces the previous single-component shape entirely.
 *
 * Why compound: sidebars vary wildly across products — Notion-style
 * workspace switcher up top, search input below, scrollable nav in the
 * middle, user profile + settings link at the bottom. The old data-
 * driven SideMenu could express the section list cleanly but anything
 * non-list-shaped (search inputs, drag handles, command-K trigger
 * pills, custom brand blocks) had to fight the API. Compound trades
 * "two lines of JSX" for "any shape the consumer wants."
 *
 * Compound shape:
 *
 *   <Sidebar>
 *     <SidebarHeader>            // brand / logo / org switcher
 *     <SidebarContent>           // scrollable body
 *       <SidebarSection title="Workspace">
 *         <SidebarItem href="/" icon={<Home />}>Dashboard</SidebarItem>
 *         <SidebarItem href="/inbox" icon={<Inbox />} badge={3}>Inbox</SidebarItem>
 *       </SidebarSection>
 *     </SidebarContent>
 *     <SidebarFooter>            // user / settings / pinned chrome
 *   </Sidebar>
 *
 * For routing integration, `<SidebarItem href>` renders an `<a>` by
 * default. Drop `asChild` to wrap any link component (Next/Link, React
 * Router Link, Remix Link, etc.) — Radix Slot stamps the item's classes
 * onto whatever you pass:
 *
 *   <SidebarItem asChild icon={<Home />}>
 *     <Link href="/">Dashboard</Link>
 *   </SidebarItem>
 *
 * Theming: visual surfaces (bg, border, text colour) come from semantic
 * theme tokens, not hard-coded greys. Sizing knobs (collapsed width,
 * expanded width, item padding) live as `--rds-sidebar-*` CSS variables
 * so the consumer can retune without prop drilling.
 *
 * Composition: Sidebar slots inside `<AppShellNav placement="side">`
 * exactly the way SideMenu did; AppShell is the page-level chrome,
 * Sidebar is the navigation content for that chrome.
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

// ─── Context ──────────────────────────────────────────────────────────

interface SidebarContextValue {
  collapsed: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

// Tree-depth context — incremented by SidebarTreeItem's children
// wrapper. Read by SidebarItem + SidebarTreeItem to add left padding
// per nesting level. Notion-style page trees use this; flat sidebars
// stay at depth 0 and pay nothing.
const SidebarTreeDepthContext = React.createContext<number>(0);
function useTreeDepth(): number {
  return React.useContext(SidebarTreeDepthContext);
}

function useSidebar(componentName: string): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error(`<${componentName}> must be rendered inside a <Sidebar> root.`);
  }
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Controlled collapsed state. When set, `onCollapsedChange` MUST be
   *  wired or the toggle button becomes a no-op. */
  collapsed?: boolean;
  /** Uncontrolled initial collapsed state. Ignored if `collapsed` is set. */
  defaultCollapsed?: boolean;
  /** Fired when the toggle button flips collapsed state. */
  onCollapsedChange?: (next: boolean) => void;
  /** Show / hide the affordance for the user to collapse. Defaults true. */
  collapsible?: boolean;
}

interface SidebarRootComponent
  extends React.ForwardRefExoticComponent<
    SidebarProps & React.RefAttributes<HTMLElement>
  > {
  Header: typeof SidebarHeader;
  Content: typeof SidebarContent;
  Footer: typeof SidebarFooter;
  Section: typeof SidebarSection;
  Item: typeof SidebarItem;
  TreeItem: typeof SidebarTreeItem;
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
                {collapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronLeft className="h-3 w-3" />
                )}
              </button>
            )}
          </aside>
        </SidebarContext.Provider>
      </TooltipProvider>
    );
  },
) as SidebarRootComponent;
Sidebar.displayName = "Sidebar";

// ─── Header ───────────────────────────────────────────────────────────

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

// ─── Content ──────────────────────────────────────────────────────────

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

// ─── Footer ───────────────────────────────────────────────────────────

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

// ─── Section ──────────────────────────────────────────────────────────

export interface SidebarSectionProps
  // Omit `title` from the HTML attrs because the native `title` is a
  // tooltip-text `string`; ours is a ReactNode label shown above the
  // section items.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Group label shown above the items. Hidden when sidebar is collapsed
   *  (children render flat under the icon strip). */
  title?: React.ReactNode;
  /** Optional icon next to the title. */
  icon?: React.ReactNode;
  /** Allow the section to toggle open/closed via clicking the title.
   *  Default true when `title` is set; ignored otherwise (no header to click). */
  collapsible?: boolean;
  /** Initial open state for collapsible sections. Default true. */
  defaultExpanded?: boolean;
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  (
    {
      title,
      icon,
      collapsible = true,
      defaultExpanded = true,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const { collapsed } = useSidebar("SidebarSection");
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const canCollapse = !!title && collapsible;

    // When the parent sidebar is collapsed, just render the children flat
    // — no section header, no nesting indent. Items get their own
    // collapsed-state treatment via context.
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
        className={cn(
          "px-[var(--rds-sidebar-section-px,0.5rem)] pb-1",
          className,
        )}
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

// ─── Item ─────────────────────────────────────────────────────────────

export interface SidebarItemProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "title"> {
  /** Leading icon. Sized to fit both expanded + collapsed states. */
  icon?: React.ReactNode;
  /** Trailing badge — count, status label. Hidden when collapsed. */
  badge?: React.ReactNode;
  /** Marks the current page / route. Drives the highlighted style + sets
   *  `aria-current="page"`. */
  active?: boolean;
  /** Render the item as a button rather than a link. Use when the row
   *  triggers an action (open dialog, log out) rather than navigation. */
  asButton?: boolean;
  /** Wrap a custom link component (Next/Link, etc.) via Radix Slot
   *  rather than rendering a plain <a>. Mutually exclusive with `asButton`. */
  asChild?: boolean;
  /** Disabled state — visual greying + pointer-events-none. */
  disabled?: boolean;
  /** Visible label. Use `children` so the JSX reads naturally — the
   *  prop name is `children` not `label`. */
  children?: React.ReactNode;
  /** Tooltip override shown when sidebar is collapsed. Defaults to the
   *  item's text content (children, when it's a string). */
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
    // Nesting depth from any enclosing SidebarTreeItem(s). Flat
    // sidebars are depth 0 and pay no extra padding; tree leaves
    // get 0.75rem of left inset per level so the chevron column
    // stays aligned.
    const depth = useTreeDepth();
    const depthStyle = !collapsed && depth > 0
      ? { paddingLeft: `calc(0.5rem + ${depth} * 0.75rem)` }
      : undefined;

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
        {!collapsed && (
          <span className="flex-1 truncate text-left">{children}</span>
        )}
        {!collapsed && badge !== undefined && badge !== null && (
          <span className="ml-auto inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </>
    );

    let element: React.ReactElement;
    if (asChild) {
      // Stamp our classes onto whatever the consumer passed (e.g.
      // <Link>). `children` IS the link node in this mode — we don't
      // wrap it in extra DOM.
      element = (
        <Slot
          data-gds-part="sidebar-item"
          data-active={active || undefined}
          aria-current={active ? "page" : undefined}
          className={sharedClass}
          style={depthStyle}
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
          // forwardRef here is anchor-typed, but for asButton we accept
          // mismatch — most consumers don't ref button rows; if they
          // need a button ref, drop asButton and use asChild with their
          // own <button>.
          data-gds-part="sidebar-item"
          data-active={active || undefined}
          aria-current={active ? "page" : undefined}
          disabled={disabled}
          className={cn(sharedClass, "w-full text-left")}
          style={depthStyle}
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
          style={depthStyle}
          {...rest}
        >
          {body}
        </a>
      );
    }

    if (!collapsed) return element;

    // Collapsed: wrap in a Tooltip so the user can still discover the
    // label. `collapsedLabel` overrides the inferred children text.
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

// ─── TreeItem (nested branches) ───────────────────────────────────────
//
// Notion-style nested page trees. A SidebarTreeItem is a collapsible
// row that hosts more SidebarItem / SidebarTreeItem children, auto-
// indented one level per nesting depth. Reads + writes the
// SidebarTreeDepthContext so consumers don't have to thread depth
// through their own props.
//
// Why not fold this into SidebarItem with an `expandable` flag: the
// row shape diverges — TreeItem grows a chevron column on the LEFT
// edge (where Item has the icon), and the "label" prop reads more
// naturally as its own prop than as ambiguous children. Keeping them
// as separate components also lets the model pick deliberately based
// on intent ("is this a leaf or a branch?").

export interface SidebarTreeItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> {
  /** Row label. Required — without it the row has nothing to show. */
  label: React.ReactNode;
  /** Leading icon (folder, file, custom emoji). Shown to the right
   *  of the chevron column. */
  icon?: React.ReactNode;
  /** Trailing badge — count, status. Hidden when sidebar is collapsed. */
  badge?: React.ReactNode;
  /** Marks the branch as the current route. Adds aria-current="page"
   *  on the row. */
  active?: boolean;
  /** Initial expanded state. Defaults `true` so the user can see what's
   *  inside without having to click. */
  defaultExpanded?: boolean;
  /** Controlled expanded state — wire `onExpandedChange` to manage from
   *  outside (useful when you want to persist tree state). */
  expanded?: boolean;
  onExpandedChange?: (next: boolean) => void;
  /** Disabled state. */
  disabled?: boolean;
  /** Nested children — SidebarItem or more SidebarTreeItem. */
  children?: React.ReactNode;
}

const SidebarTreeItem = React.forwardRef<HTMLButtonElement, SidebarTreeItemProps>(
  function SidebarTreeItem(
    {
      label,
      icon,
      badge,
      active = false,
      defaultExpanded = true,
      expanded: controlledExpanded,
      onExpandedChange,
      disabled,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const { collapsed } = useSidebar("SidebarTreeItem");
    const depth = useTreeDepth();
    const isControlled = controlledExpanded !== undefined;
    const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
    const expanded = isControlled ? controlledExpanded! : internalExpanded;

    const toggle = () => {
      const next = !expanded;
      if (!isControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    };

    // Collapsed sidebar — render children flat as if this branch
    // didn't have a header, same convention as SidebarSection. The
    // tree shape isn't readable in a 4rem-wide rail anyway.
    if (collapsed) {
      return (
        <SidebarTreeDepthContext.Provider value={depth}>
          {children}
        </SidebarTreeDepthContext.Provider>
      );
    }

    const depthInset = depth * 0.75;

    return (
      <div data-gds-part="sidebar-tree-item">
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-current={active ? "page" : undefined}
          data-active={active || undefined}
          disabled={disabled}
          className={cn(
            "group flex w-full items-center gap-1.5 rounded-md py-1 text-sm font-medium transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-foreground/80 hover:bg-muted hover:text-foreground",
            disabled && "opacity-50 pointer-events-none",
            className,
          )}
          style={{
            paddingLeft: `calc(0.25rem + ${depthInset}rem)`,
            paddingRight: "0.5rem",
            ...style,
          }}
          {...rest}
        >
          <span
            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground shrink-0"
            aria-hidden
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
          {icon && (
            <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" aria-hidden>
              {icon}
            </span>
          )}
          <span className="flex-1 truncate text-left">{label}</span>
          {badge !== undefined && badge !== null && (
            <span className="ml-auto inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </button>
        {expanded && children && (
          <SidebarTreeDepthContext.Provider value={depth + 1}>
            <div className="space-y-[var(--rds-sidebar-section-gap,0.125rem)]">
              {children}
            </div>
          </SidebarTreeDepthContext.Provider>
        )}
      </div>
    );
  },
);
SidebarTreeItem.displayName = "SidebarTreeItem";

// ─── Compose + export ─────────────────────────────────────────────────

Sidebar.Header = SidebarHeader;
Sidebar.Content = SidebarContent;
Sidebar.Footer = SidebarFooter;
Sidebar.Section = SidebarSection;
Sidebar.Item = SidebarItem;
Sidebar.TreeItem = SidebarTreeItem;

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarTreeItem,
};
