// Blocks/Sidebar — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "Default",
  args: {
    dataHook: "app-sidebar",
    maxWidth: breakpoint.lg,
    defaultOpen: true
  },
  argTypes: {
    maxWidth: {
      control: {
        type: "select"
      },
      options: [breakpoint.sm, breakpoint.md, breakpoint.lg],
      description: "Content max-width. Use `breakpoint` tokens.",
      table: {
        type: {
          summary: "string | number"
        },
        defaultValue: {
          summary: "breakpoint.lg"
        }
      }
    },
    defaultOpen: {
      control: "boolean",
      description: "Initial expanded/collapsed state of the sidebar",
      table: {
        type: {
          summary: "boolean"
        },
        defaultValue: {
          summary: "true"
        }
      }
    },
    toggleAriaLabel: {
      control: "text",
      description: "Accessible label for the sidebar toggle button",
      table: {
        category: "i18n",
        type: {
          summary: "string"
        },
        defaultValue: {
          summary: '"Toggle Sidebar"'
        }
      }
    }
  },
  render: args => {
    const {
      maxWidth,
      defaultOpen = true,
      toggleAriaLabel,
      mobileTitle,
      mobileDescription
    } = args as NonNullable<Story["args"]>;
    return <SidebarProvider dataHook="basic-usage-sidebar-provider" defaultOpen={defaultOpen}>
        <GlobalLayout dataHook="global-layout">
          <GlobalLayoutSidebar dataHook="global-layout-sidebar">
            <AppSidebar mobileTitle={mobileTitle} mobileDescription={mobileDescription} />
          </GlobalLayoutSidebar>
          <GlobalLayoutContent dataHook="global-layout-content" maxWidth={maxWidth}>
            <GlobalLayoutMobileHeader dataHook="mobile-header">
              <SidebarTrigger dataHook="mobile-sidebar-trigger" {...toggleAriaLabel ? {
              toggleAriaLabel
            } : {}}>
                <Menu size={24} />
              </SidebarTrigger>
              <Logo dataHook="mobile-logo" />
              <div className="ml-auto lg:hidden">
                <Button dataHook="add-location-button-mobile" variant="primary" size="sm">
                  <Plus />
                  Add Location
                </Button>
              </div>
            </GlobalLayoutMobileHeader>
            <GlobalLayoutContentActions dataHook="content-actions">
              <Button dataHook="add-location-button" variant="primary" size="sm">
                <Plus />
                Add Location
              </Button>
            </GlobalLayoutContentActions>
            <GlobalLayoutContentHeader dataHook="page-header">
              <div>
                <TypographyH2 className="pb-2" dataHook="page-title">
                  Bailiffscourt Hotel &amp; Spa
                </TypographyH2>
                <p className="text-muted-foreground text-sm">
                  Littlehampton, BN17 5RW
                </p>
              </div>
              <div className="flex gap-2">
                <Button dataHook="change-location-button" variant="outline">
                  Change Location
                  <ChevronDown />
                </Button>
                <Button dataHook="last-updated-button" variant="outline">
                  Last Updated
                  <ChevronDown />
                </Button>
              </div>
            </GlobalLayoutContentHeader>

            <GlobalLayoutContentBody dataHook="page-body">
              <div className="bg-card h-[2000px] rounded-lg" />
            </GlobalLayoutContentBody>
          </GlobalLayoutContent>
        </GlobalLayout>
      </SidebarProvider>;
  },
  parameters: {
    docs: {
      description: {
        story: "Sidebar integrated with GlobalLayout. On desktop the sidebar is visible inline. On mobile the sidebar opens as a Sheet overlay via the SidebarTrigger in the mobile header."
      }
    },
    fullscreen: true,
    variants: [{
      storyDescription: "Default layout"
    }, {
      defaultOpen: false,
      storyDescription: "Collapsed (icon-only)"
    }, {
      toggleAriaLabel: "Alternar barra lateral",
      mobileTitle: "Navegación",
      mobileDescription: "Menú de navegación principal",
      storyDescription: "Custom labels (i18n)"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) {
      return;
    }
    const variants = parameters.variants || [];
    await step("Test sidebar renders correctly", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      await new Promise(resolve => setTimeout(resolve, 500));

      // On mobile viewports the sidebar renders as an offcanvas sheet (portal)
      // so it won't be inside the variant container
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;
      await expect(sidebar).toBeInTheDocument();
      const logo = variant.querySelector('[data-hook="sidebar-logo"]');
      await expect(logo).toBeInTheDocument();
      const header = variant.querySelector('[data-slot="sidebar-header"]');
      await expect(header).toBeInTheDocument();
      const content = variant.querySelector('[data-slot="sidebar-content"]');
      await expect(content).toBeInTheDocument();
    });
    await step("Test sidebar content uses ScrollArea", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;
      const scrollArea = sidebar.querySelector('[data-slot="scroll-area"] [data-slot="sidebar-content"]');
      await expect(scrollArea).toBeInTheDocument();
    });
    await step("Test sidebar footer renders inside scroll area", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;
      const footer = sidebar.querySelector('[data-slot="scroll-area"] [data-slot="sidebar-footer"]');
      await expect(footer).toBeInTheDocument();
      await expect(footer).toHaveAttribute("data-hook", "sidebar-footer");
      await expect(footer).toHaveClass("shrink-0");
    });
    await step("Test content actions bar renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const actions = variant.querySelector('[data-slot="content-actions"]');
      await expect(actions).toBeInTheDocument();
      await expect(actions).toHaveAttribute("data-hook", "content-actions");
      const addButton = variant.querySelector('[data-hook="add-location-button"]');
      await expect(addButton).toBeInTheDocument();
    });
    await step("Test active menu item has correct state", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;

      // On mobile the sidebar is a portal outside the variant container
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;

      // "All Locations" is set as active in the data
      const activeButtons = variant.querySelectorAll('[data-slot="sidebar-menu-button"][data-active="true"]');
      await expect(activeButtons.length).toBeGreaterThan(0);
    });
    await step("Test badge renders on menu item", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;

      // On mobile the sidebar is a portal outside the variant container
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;

      // "GBP Audit" has a "SET UP" badge
      const badges = variant.querySelectorAll('[data-slot="sidebar-menu-badge"]');
      await expect(badges.length).toBeGreaterThan(0);

      // Check badge content
      const badgeTexts = Array.from(badges).map(b => b.textContent);
      await expect(badgeTexts).toContain("SET UP");
    });
    await step("Test menu items render correct count", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;

      // On mobile the sidebar is a portal outside the variant container
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;

      // top: 2, main: 8 (includes Location Manager collapsible trigger), footer: 1 = 11
      const menuButtons = variant.querySelectorAll('[data-slot="sidebar-menu-button"]');
      await expect(menuButtons.length).toBe(11);
    });
    await step("Test collapsed variant has correct state", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (!variant) return;
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    });
    await step("Test sidebar ARIA attributes", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;
      await expect(sidebar).toHaveAttribute("data-state", "expanded");

      // Collapsible trigger gets aria-expanded from Radix Accordion
      const collapsibleTrigger = variant.querySelector('[data-hook="collapsible-location-manager"] [data-slot="sidebar-menu-button"]');
      if (collapsibleTrigger) {
        await expect(collapsibleTrigger).toHaveAttribute("aria-expanded");
      }
    });
    await step("Test mobile sidebar trigger is present", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector('[data-hook="mobile-sidebar-trigger"]');
      await expect(trigger).toBeInTheDocument();
    });
    await step("Test i18n - default toggle label renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector('[data-hook="mobile-sidebar-trigger"]');
      if (!trigger) return;
      const srOnly = trigger.querySelector(".sr-only");
      if (srOnly) {
        await expect(srOnly).toHaveTextContent("Toggle Sidebar");
      }
    });
    await step("Test i18n - custom labels (Spanish)", async () => {
      const variant = getVariant(canvasElement, variants, 2);
      if (!variant) return;
      const trigger = variant.querySelector('[data-hook="mobile-sidebar-trigger"]');
      if (!trigger) return;
      const srOnly = trigger.querySelector(".sr-only");
      if (srOnly) {
        await expect(srOnly).toHaveTextContent("Alternar barra lateral");
      }
    });
    await step("Test keyboard navigation toggles collapsible menu", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;
      const collapsibleTrigger = variant.querySelector('[data-hook="collapsible-location-manager"] [data-slot="sidebar-menu-button"]');
      if (!collapsibleTrigger) return;

      // Trigger starts open (defaultOpen on SidebarMenuCollapsible)
      await expect(collapsibleTrigger).toHaveAttribute("aria-expanded", "true");
      await userEvent.click(collapsibleTrigger);
      await expect(collapsibleTrigger).toHaveAttribute("aria-expanded", "false");
      await userEvent.keyboard("{Enter}");
      await expect(collapsibleTrigger).toHaveAttribute("aria-expanded", "true");
    });
    await step("Test menu button receives focus", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const sidebar = variant.querySelector('[data-slot="sidebar"]');
      if (!sidebar) return;
      const firstButton = variant.querySelector('[data-slot="sidebar-menu-button"]');
      if (!firstButton) return;
      (firstButton as HTMLElement).focus();
      await expect(firstButton).toHaveFocus();
    });
  }
}
