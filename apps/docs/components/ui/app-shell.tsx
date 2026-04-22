import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * AppShell — top-level page scaffold for an app-like layout.
 *
 * The Studio was missing a named "app layout" primitive — without one,
 * agent-generated pages either freestyle grids or reinvent the nav-plus-
 * content structure every time. AppShell gives them one component with a
 * small, bounded set of layout variants so vibe-coded prototypes land in a
 * recognisable shape: a nav region (top, side, or none) plus a main region
 * that optionally constrains its content width.
 *
 * It is deliberately *just* structure: no collapse state, no context, no
 * runtime JS. Nav content is whatever the caller drops in — a SideMenu,
 * a TopMenu, or a hand-rolled `<nav>`. Keeping it dumb means it renders
 * fine on the server and can be styled by consumers without fighting a
 * behaviour model.
 *
 * Variants:
 * - `nav`       — "none" | "top" | "side". Chooses the grid structure.
 * - `maxWidth`  — "full" | "container". Caps the main region width for
 *                 marketing-style pages without the caller having to wrap
 *                 their content in a max-w-* div.
 * - `sticky`    — boolean. Sticks top nav to the viewport top / side nav
 *                 to the viewport when the page scrolls. Sensible default
 *                 for app chrome.
 */
const shellVariants = cva("rds-app-shell min-h-screen w-full bg-background text-foreground", {
  variants: {
    nav: {
      none: "block",
      top: "grid grid-rows-[auto_1fr]",
      side: "grid grid-cols-[auto_1fr]",
    },
  },
  defaultVariants: {
    nav: "none",
  },
});

const navVariants = cva("rds-app-shell-nav", {
  variants: {
    placement: {
      top: "border-b bg-background",
      side: "border-r bg-background",
      none: "hidden",
    },
    sticky: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      placement: "top",
      sticky: true,
      className: "sticky top-0 z-30",
    },
    {
      placement: "side",
      sticky: true,
      className: "sticky top-0 h-screen self-start",
    },
  ],
  defaultVariants: {
    placement: "top",
    sticky: true,
  },
});

const mainVariants = cva("rds-app-shell-main min-w-0", {
  variants: {
    maxWidth: {
      full: "w-full",
      container: "w-full mx-auto max-w-7xl px-4 md:px-6 lg:px-8",
    },
  },
  defaultVariants: {
    maxWidth: "full",
  },
});

// ---------- AppShell root ----------

export interface AppShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof shellVariants> {
  /** Render as the single child element via Radix Slot — lets you stamp the
   *  shell layout onto an existing root tag without an extra wrapper. */
  asChild?: boolean;
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, nav, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-gds-part="app-shell"
        data-nav={nav ?? "none"}
        className={cn(shellVariants({ nav, className }))}
        {...props}
      />
    );
  }
);
AppShell.displayName = "AppShell";

// ---------- Nav slot ----------

export interface AppShellNavProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navVariants> {
  asChild?: boolean;
}

const AppShellNav = React.forwardRef<HTMLElement, AppShellNavProps>(
  ({ className, placement, sticky, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "nav";
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        data-gds-part="app-shell-nav"
        data-placement={placement ?? "top"}
        className={cn(navVariants({ placement, sticky, className }))}
        {...props}
      />
    );
  }
);
AppShellNav.displayName = "AppShellNav";

// ---------- Main slot ----------

export interface AppShellMainProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof mainVariants> {
  asChild?: boolean;
}

const AppShellMain = React.forwardRef<HTMLElement, AppShellMainProps>(
  ({ className, maxWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "main";
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        data-gds-part="app-shell-main"
        className={cn(mainVariants({ maxWidth, className }))}
        {...props}
      />
    );
  }
);
AppShellMain.displayName = "AppShellMain";

export {
  AppShell,
  AppShellNav,
  AppShellMain,
  shellVariants,
  navVariants,
  mainVariants,
};
