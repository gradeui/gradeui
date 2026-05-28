import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * AppShell — top-level page scaffold for an app-like or marketing layout.
 *
 * Provides five slots arranged via CSS-grid template areas:
 *
 *   ┌─────────── Header (full bleed) ───────────┐
 *   │ Nav │   Aside   │      Main               │
 *   └─────────── Footer (full bleed) ───────────┘
 *
 * Header and Footer always span the full width and sit at the very top /
 * very bottom of the shell — useful for marketing pages, brand bars, site
 * chrome. `nav` chooses how the body row is split:
 *
 * - `none`        — Main only (a marketing page or a single-column app)
 * - `top`         — Main below an in-app top-nav row (TopMenu)
 * - `side`        — Nav rail + Main (classic app layout)
 * - `three-pane`  — Nav rail + fixed Aside + flex Main (Slack/Mail/Notion
 *                   shape; aside width via --gds-app-shell-aside, default 320px)
 *
 * Each slot is assigned a fixed `grid-area` (header/nav/aside/main/footer),
 * so the **JSX child order doesn't matter** — drop slots in any order and
 * the grid sorts them.
 *
 * It is deliberately *just* structure: no collapse state, no context, no
 * runtime JS. Nav content is whatever the caller drops in — a Sidebar, a
 * TopMenu, a hand-rolled `<nav>`. For drag-to-resize columns inside the
 * body, compose this with `Resizable` instead of using a static grid.
 *
 * Variants:
 * - `nav`       — "none" | "top" | "side" | "three-pane"
 * - `maxWidth`  — Main slot only: "full" | "container" caps reading width
 *                 for marketing-style content.
 * - `sticky`    — Nav slot, Header slot. Pin to the viewport on scroll.
 */
const shellVariants = cva(
  "gds-app-shell min-h-screen w-full bg-background text-foreground grid",
  {
    variants: {
      nav: {
        none: "",
        top: "",
        side: "",
        "three-pane": "",
      },
    },
    defaultVariants: {
      nav: "none",
    },
  }
);

const headerVariants = cva("gds-app-shell-header", {
  variants: {
    sticky: {
      true: "sticky top-0 z-30",
      false: "",
    },
  },
  defaultVariants: {
    sticky: false,
  },
});

const navVariants = cva("gds-app-shell-nav", {
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

const asideVariants = cva("gds-app-shell-aside min-w-0 border-r bg-background", {
  variants: {
    sticky: {
      true: "sticky top-0 h-screen self-start",
      false: "",
    },
  },
  defaultVariants: {
    sticky: false,
  },
});

const mainVariants = cva("gds-app-shell-main min-w-0", {
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

const footerVariants = cva("gds-app-shell-footer border-t bg-background");

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

// ---------- Header slot ----------

export interface AppShellHeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headerVariants> {
  asChild?: boolean;
}

const AppShellHeader = React.forwardRef<HTMLElement, AppShellHeaderProps>(
  ({ className, sticky, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "header";
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        data-gds-part="app-shell-header"
        className={cn(headerVariants({ sticky, className }))}
        {...props}
      />
    );
  }
);
AppShellHeader.displayName = "AppShellHeader";

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

// ---------- Aside slot (middle column for nav="three-pane") ----------

export interface AppShellAsideProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof asideVariants> {
  asChild?: boolean;
}

const AppShellAside = React.forwardRef<HTMLElement, AppShellAsideProps>(
  ({ className, sticky, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "aside";
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        data-gds-part="app-shell-aside"
        className={cn(asideVariants({ sticky, className }))}
        {...props}
      />
    );
  }
);
AppShellAside.displayName = "AppShellAside";

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

// ---------- Footer slot ----------

export interface AppShellFooterProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof footerVariants> {
  asChild?: boolean;
}

const AppShellFooter = React.forwardRef<HTMLElement, AppShellFooterProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "footer";
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        data-gds-part="app-shell-footer"
        className={cn(footerVariants({ className }))}
        {...props}
      />
    );
  }
);
AppShellFooter.displayName = "AppShellFooter";

export {
  AppShell,
  AppShellHeader,
  AppShellNav,
  AppShellAside,
  AppShellMain,
  AppShellFooter,
  shellVariants,
  headerVariants,
  navVariants,
  asideVariants,
  mainVariants,
  footerVariants,
};
