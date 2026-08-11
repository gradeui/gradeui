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
 * expanded width, item padding) live as `--gds-sidebar-*` CSS variables
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
  /**
   * Visual treatment.
   *
   * - `"rail"` (default) — the classic nav rail: sits flush against an
   *   adjacent surface with only a right-side border, fixed width via
   *   `--gds-sidebar-width`. Designed to slot into `<AppShellNav placement="side">`.
   * - `"panel"` — a floating card-style sidebar: full border, rounded
   *   corners, width inherited from the parent (typically a flex/grid
   *   track). Use when the sidebar is one of several adjacent panes
   *   in a body row, like Studio's `Projects | Canvas | Settings`.
   *
   * The variant affects ONLY the outer chrome — header/content/footer/
   * section/item internals are identical so the same compound markup
   * works in both treatments.
   */
  variant?: "rail" | "panel";
  /**
   * Draw the sidebar's OUTER edge: the right-hand rule in `"rail"`, the
   * full outline in `"panel"`. Default true, which is the long-standing
   * look. Set false where the rail's own `bg-card` already separates it
   * from the content beside it and the rule reads as an artefact, which
   * is typical on dark, high-contrast themes.
   *
   * This controls the outer edge ONLY. The rules under `SidebarHeader`
   * and above `SidebarFooter` are internal structure and stay put; they
   * are not part of this switch.
   */
  bordered?: boolean;
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
      variant = "rail",
      bordered = true,
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
    const isPanel = variant === "panel";

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
            data-variant={variant}
            className={cn(
              "relative flex h-full flex-col bg-card text-card-foreground",
              // Chrome is the only thing the variant changes. Rail
              // hugs an adjacent surface with a tracked width; panel
              // floats as its own card and sizes from the parent
              // flex/grid track. The outer edge each one draws is the
              // `bordered` switch below, so a borderless rail keeps its
              // width transition and a borderless panel keeps its
              // rounding and clipping.
              isPanel
                ? "w-full rounded-lg overflow-hidden"
                : "transition-[width] duration-200 ease-out",
              bordered &&
                (isPanel ? "border border-border" : "border-r border-border"),
              className,
            )}
            style={
              // Panel variant defers sizing to the parent container —
              // typical use is inside a flex track that already
              // constrains width, so an inline width would fight the
              // parent. Rail variant keeps its tracked width as before.
              isPanel
                ? style
                : {
                    width: collapsed
                      ? "var(--gds-sidebar-collapsed-width, 4rem)"
                      : "var(--gds-sidebar-width, 16rem)",
                    ...style,
                  }
            }
            {...rest}
          >
            {children}

            {/* The hover-out toggle is a rail-mode affordance — it
                deliberately overlaps the right border. In panel mode
                the sidebar is a free-standing card whose width is
                set by the parent layout, so a self-collapse handle
                doesn't fit the model; callers wanting a hide/show
                affordance there should add their own button (e.g.
                the Studio canvas toolbar's PanelLeft toggle). */}
            {collapsible && !isPanel && (
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
          "h-[var(--gds-sidebar-header-height,3.25rem)]",
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
        "py-[var(--gds-sidebar-content-py,0.5rem)]",
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
          // Same tuning seam as the header/content/section: an app can
          // give the footer identity block more room without reaching
          // past the component. Defaults are the previous values.
          collapsed
            ? "px-2 py-[var(--gds-sidebar-footer-py,0.5rem)]"
            : "px-[var(--gds-sidebar-footer-px,0.75rem)] py-[var(--gds-sidebar-footer-py,0.5rem)]",
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
  /** Action(s) rendered on the right edge of the section header — the
   *  canonical "+ add to this group" or "..." menu slot. Common in Notion
   *  (+ next to Pages), Linear (+ next to Favorites), Slack (+ next to
   *  Channels). Rendered as a sibling of the chevron when `collapsible`,
   *  otherwise pinned to the right edge of the static header.
   *  Pointer events on the trailing content are isolated from the
   *  collapse toggle, so a Button inside `trailing` won't also flip the
   *  expanded state. */
  trailing?: React.ReactNode;
  /** Allow the section to toggle open/closed via clicking the title.
   *  Default true when `title` is set; ignored otherwise (no header to click). */
  collapsible?: boolean;
  /** Initial open state for collapsible sections. Default true. */
  defaultExpanded?: boolean;
  /** Title casing. The component should not silently dictate case
   *  (Ali, 2026-06-11) — but the HISTORIC defaults differ per variant
   *  and existing surfaces depend on them, so when unset, legacy
   *  behaviour is preserved exactly: static headers render UPPERCASE
   *  (the Notion/Linear treatment), collapsible headers render the
   *  authored case (a long-standing `normal-case` override). Set
   *  explicitly to get the same treatment from both variants:
   *  `"uppercase"` for the shouty group label, `"none"` for
   *  sentence-case headers like a "Recents" list. */
  titleTransform?: "uppercase" | "none";
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  (
    {
      title,
      icon,
      trailing,
      collapsible = true,
      defaultExpanded = true,
      titleTransform,
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
            "px-[var(--gds-sidebar-section-px,0.5rem)] space-y-[var(--gds-sidebar-section-gap,0.125rem)]",
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
          "px-[var(--gds-sidebar-section-px,0.5rem)] pb-1",
          className,
        )}
        {...rest}
      >
        {title &&
          (canCollapse ? (
            // Collapsible header — outer Row stays clickable for the
            // toggle, trailing content is wrapped in a span that swallows
            // its own clicks so a Button inside trailing doesn't also
            // toggle the section.
            <div
              className={cn(
                "group/header flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase tracking-wide",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="flex flex-1 items-center gap-2 text-left min-w-0"
              >
                {icon}
                {/* Legacy: collapsible titles render authored case unless
                    titleTransform asks for uppercase explicitly. */}
                <span
                  className={cn(
                    "flex-1 text-left truncate",
                    titleTransform === "uppercase" ? "uppercase" : "normal-case",
                  )}
                >
                  {title}
                </span>
                {expanded ? (
                  <ChevronDown className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                )}
              </button>
              {trailing && (
                <span
                  className="flex items-center shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {trailing}
                </span>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs font-medium tracking-wide",
                // Legacy default for static headers is uppercase; only an
                // explicit titleTransform="none" renders authored case.
                titleTransform === "none" ? "" : "uppercase",
                "text-muted-foreground",
              )}
            >
              {icon}
              <span className="flex-1 truncate">{title}</span>
              {trailing && <span className="shrink-0">{trailing}</span>}
            </div>
          ))}
        {expanded && (
          <div
            className={cn(
              "mt-[var(--gds-sidebar-section-gap,0.125rem)]",
              "space-y-[var(--gds-sidebar-section-gap,0.125rem)]",
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
  /**
   * Row size.
   *
   * - `"md"` (default) — `text-sm font-medium`, the standard nav row.
   * - `"sm"` — `text-xs`, lighter weight + tighter padding. Use for
   *   visually-subordinate rows (nested screens under a parent
   *   project, sub-pages under a section, etc.) so the hierarchy is
   *   legible without manual className overrides. Active state still
   *   wins on color + weight so the current row pops at either size.
   */
  size?: "sm" | "md";
  /**
   * Secondary line shown beneath the label — typically metadata like
   * "Edited 2m ago", "12 items", or a brief description. Layout
   * adapts: the row becomes label + description stacked vertically,
   * with the icon vertically centered against the stack and the
   * badge anchored to the trailing edge as usual. Hidden when the
   * sidebar is collapsed (only the icon + tooltip remain).
   */
  description?: React.ReactNode;
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
      size = "md",
      description,
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
    // Children indent matches the parent TreeItem's chevron+icon
    // column (chevron 1rem + gap 0.375rem + icon 1rem = ~1.5rem),
    // so a child's row content visually aligns with the parent's
    // label column — the canonical tree pattern. Tunable via the
    // `--gds-sidebar-tree-indent` CSS variable for consumers that
    // want tighter or looser nesting.
    const depthStyle = !collapsed && depth > 0
      ? {
          paddingLeft: `calc(0.5rem + ${depth} * var(--gds-sidebar-tree-indent, 1.5rem))`,
        }
      : undefined;

    // Size + active interact: at md, both states use font-medium;
    // at sm, inactive drops to font-normal so the row visually
    // recedes, but active keeps font-medium so the current row
    // still pops against its siblings.
    const isSm = size === "sm";
    const sizeClasses = isSm
      ? "text-xs px-2 py-1"
      : "text-sm px-2 py-1.5";
    const weightClass =
      isSm && !active ? "font-normal" : "font-medium";
    // Inactive color at sm is muted-foreground to match its lighter
    // role; md keeps the foreground/80 default. Active is the same
    // primary highlight in either size.
    const stateColor = active
      ? "bg-primary/10 text-primary"
      : isSm
        ? "text-muted-foreground hover:bg-muted hover:text-foreground"
        : "text-foreground/80 hover:bg-muted hover:text-foreground";

    // With a description the layout shifts from a single-line row
    // (items-center) to a two-line stack inside the label column —
    // icon stays vertically centered against the stack. Extra
    // vertical padding gives the second line breathing room. The
    // description is hidden when the sidebar is collapsed; only
    // the icon + tooltip survive in rail-collapsed mode.
    const hasDescription = !collapsed && description != null;
    const sharedClass = cn(
      "group flex items-center gap-2.5 rounded-md transition-colors",
      sizeClasses,
      weightClass,
      hasDescription && (isSm ? "py-1.5" : "py-2"),
      collapsed ? "justify-center px-2 py-2" : null,
      stateColor,
      disabled && "opacity-50 pointer-events-none",
      className,
    );

    const labelStack = hasDescription ? (
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left leading-tight">
        <span className="truncate">{children}</span>
        <span
          className={cn(
            "truncate font-normal text-muted-foreground",
            isSm ? "text-[10px]" : "text-[11px]",
          )}
        >
          {description}
        </span>
      </span>
    ) : (
      <span className="flex-1 truncate text-left">{children}</span>
    );

    const body = (
      <>
        {icon && (
          /* The glyph tracks the row size: a 16px icon in an md row
             reads undersized against 14px text. sm rows keep 16px.
             `:not([class*='size-'])` makes this a DEFAULT, not a pin —
             pass any size-* on the icon itself and it wins. */
          <span
            className={cn(
              "shrink-0",
              isSm
                ? "[&>svg:not([class*='size-'])]:size-4"
                : "[&>svg:not([class*='size-'])]:size-5",
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
        {!collapsed && labelStack}
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
  /**
   * Secondary line shown beneath the label — same shape as
   * SidebarItem's `description`. Useful when a branch needs more
   * than just a name (last-edited timestamp, item count, owner).
   * Layout adapts to stack label + description; chevron and icon
   * stay vertically centered against the stack.
   */
  description?: React.ReactNode;
  /**
   * Right-edge action slot — settings cog, more-actions overflow,
   * "+ add child" affordance. Rendered as a sibling of the branch
   * button (not nested inside it, so `<button>` children inside
   * trailing remain valid HTML). Vertically centered against the
   * branch row, isolated from the expand/collapse click so a tap
   * on a trailing button doesn't toggle the tree.
   *
   * The wrapper container also exposes a `group/row` named-group
   * class so consumer-provided trailing can opt into hover-only
   * visibility via Tailwind's `group-hover/row:` variant
   * (`hidden group-hover/row:flex`) without writing custom CSS.
   * Hovering nested children rows does NOT trigger the group hover
   * — the named group is scoped to the branch row alone.
   */
  trailing?: React.ReactNode;
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
      description,
      trailing,
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

    // Match the SidebarItem depth-indent math so nested TreeItems
    // line up with their leaf siblings. Same `--gds-sidebar-tree-indent`
    // CSS var drives both, in rem.
    const depthInset = depth * 1.5;

    return (
      <div data-gds-part="sidebar-tree-item">
        {/* Branch row + optional trailing slot. The `group/row`
            named-group lets consumer-provided trailing content use
            `group-hover/row:` to reveal on hover without leaking
            the hover state to the nested children below. */}
        <div className="group/row relative">
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
            // Reserve trailing padding when a trailing slot is
            // mounted so the label doesn't slide under the actions.
            trailing != null && "pr-12",
            className,
          )}
          style={{
            paddingLeft: `calc(0.25rem + ${depthInset}rem)`,
            paddingRight: trailing != null ? "3rem" : "0.5rem",
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
            /* Tree rows sit at the md scale, so they match SidebarItem;
               a size-* on the icon overrides this default. */
            <span
              className="shrink-0 [&>svg:not([class*='size-'])]:size-5"
              aria-hidden
            >
              {icon}
            </span>
          )}
          {description != null ? (
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left leading-tight">
              <span className="truncate">{label}</span>
              <span className="truncate text-[11px] font-normal text-muted-foreground">
                {description}
              </span>
            </span>
          ) : (
            <span className="flex-1 truncate text-left">{label}</span>
          )}
          {badge !== undefined && badge !== null && (
            <span className="ml-auto inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </button>
        {trailing != null && (
          <div
            // Stop click propagation so a click inside trailing
            // (the canonical 'open settings' button) doesn't bubble
            // to the row's toggle handler and accidentally flip
            // the expanded state. inset-y-0 anchors trailing to
            // the button's height so vertical centering tracks
            // size + description automatically.
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute inset-y-0 right-1.5 flex items-center gap-0.5"
          >
            {trailing}
          </div>
        )}
        </div>
        {expanded && children && (
          <SidebarTreeDepthContext.Provider value={depth + 1}>
            <div className="space-y-[var(--gds-sidebar-section-gap,0.125rem)]">
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
