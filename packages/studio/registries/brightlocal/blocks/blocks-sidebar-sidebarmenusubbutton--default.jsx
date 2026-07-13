// Blocks/Sidebar/SidebarMenuSubButton — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarmenusubbutton--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render(args) {
    return <SidebarProvider dataHook="provider" defaultOpen>
        <Sidebar dataHook="sidebar">
          <SidebarHeader>
            <Logo className="h-6" dataHook="sidebar-logo" />
          </SidebarHeader>
          <SidebarContent dataHook="content">
            <SidebarGroup>
              <SidebarGroupLabel dataHook="label">Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu dataHook="menu">
                  <SidebarMenuCollapsible defaultOpen dataHook="collapsible-location-manager">
                    <SidebarMenuCollapsibleTrigger tooltip="Location Manager">
                      <MapPin size={24} />
                      <span>Location Manager</span>
                    </SidebarMenuCollapsibleTrigger>
                    <SidebarMenuCollapsibleContent variant={SidebarMenuSubVariant.BORDER}>
                      {subItems.map(item => <SidebarMenuSubItem key={item.title} dataHook={`sub-item-${item.title}`}>
                          <SidebarMenuSubButton {...args} asChild dataHook={`sub-btn-${item.title}`} isActive={item.isActive}>
                            <a href={item.url}>{item.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>)}
                    </SidebarMenuCollapsibleContent>
                  </SidebarMenuCollapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>;
  },
  args: {
    dataHook: "sub-btn"
  },
  parameters: {
    variants: [{
      storyDescription: "Default with active item"
    }, {
      size: "sm",
      storyDescription: "Small size"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test sub-buttons render", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const buttons = variant.querySelectorAll('[data-slot="sidebar-menu-sub-button"]');
      expect(buttons.length).toBe(3);
    });
    await step("Test active state", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const activeBtn = variant.querySelector('[data-slot="sidebar-menu-sub-button"][data-active="true"]');
      expect(activeBtn).toBeInTheDocument();
    });
    await step("Test sub-button has correct data attributes", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const btn = variant.querySelector('[data-slot="sidebar-menu-sub-button"]');
      if (!btn) return;
      expect(btn).toHaveAttribute("data-size", "md");
    });
  }
}
