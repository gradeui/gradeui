// Blocks/Sidebar/SidebarAccountDropdown — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebaraccountdropdown--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  args: {
    dataHook: "account-dropdown",
    name: "shadcn",
    email: "m@example.com"
  },
  render: function Render(args) {
    return <SidebarProvider className="min-h-0" dataHook="story-sidebar-provider" defaultOpen>
        <SidebarFooter className="bg-sidebar-background w-[260px]">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarAccountDropdown align="end" avatar={userAvatar} dataHook={args.dataHook} email={args.email} menuGroups={menuGroups} name={args.name} side="top" triggerAriaLabel={args.triggerAriaLabel} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarProvider>;
  },
  parameters: {
    variants: [{
      storyDescription: "Default (closed)"
    }, {
      name: "Very Long Username That Should Truncate Properly",
      email: "very.long.email.address@company-with-long-domain.com",
      storyDescription: "Long text truncation"
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
    const triggerSelector = '[data-hook="account-dropdown-button"]';
    const contentSelector = '[data-hook="account-dropdown-content"]';
    await step("Test trigger renders with avatar and user info", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector(triggerSelector);
      expect(trigger).toBeInTheDocument();
      const avatar = variant.querySelector('[data-hook="user-avatar"]');
      expect(avatar).toBeInTheDocument();
    });
    await step("Test trigger has default aria-label", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector(triggerSelector);
      if (!trigger) return;
      expect(trigger).toHaveAttribute("aria-label", "Account menu");
    });
    await step("Test long text truncation variant renders", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (!variant) return;
      const trigger = variant.querySelector(triggerSelector);
      expect(trigger).toBeInTheDocument();
      const truncatedSpans = trigger?.querySelectorAll(".truncate");
      expect(truncatedSpans?.length).toBeGreaterThanOrEqual(2);
    });
    await step("Test dropdown opens and shows all menu items", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector(triggerSelector);
      if (!trigger) return;
      await userEvent.click(trigger);
      await waitFor(() => {
        expect(document.querySelector(contentSelector)).toBeInTheDocument();
      });
      const content = document.querySelector(contentSelector);
      const menuItems = content?.querySelectorAll('[role="menuitem"]');
      expect(menuItems?.length).toBe(5);
    });
    await step("Test dropdown has user info header with avatar", async () => {
      const content = document.querySelector(contentSelector);
      const label = content?.querySelector('[data-slot="dropdown-menu-label"]');
      expect(label).toBeInTheDocument();
      const headerAvatar = label?.querySelector('[data-hook="user-avatar"]');
      expect(headerAvatar).toBeInTheDocument();
    });
    await step("Test dropdown has menu group separators", async () => {
      const content = document.querySelector(contentSelector);
      const separators = content?.querySelectorAll('[data-slot="dropdown-menu-separator"]');
      expect(separators?.length).toBe(3);
    });
    await step("Test dropdown closes on Escape", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        expect(document.querySelector(contentSelector)).toBeNull();
      });
    });
    await step("Test dropdown opens for Chromatic snapshot", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector(triggerSelector);
      if (!trigger) return;
      await userEvent.click(trigger);
      await waitFor(() => {
        expect(document.querySelector(contentSelector)).toBeInTheDocument();
      });
    });
  }
}
