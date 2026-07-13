// Blocks/Sidebar/SidebarMenuSkeleton — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarmenuskeleton--default
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
              <SidebarGroupLabel dataHook="label">Loading...</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu dataHook="menu">
                  {Array.from({
                  length: 8
                }).map((_, i) => <SidebarMenuItem key={i} dataHook={`skeleton-item-${i}`}>
                      <SidebarMenuSkeleton {...args} />
                    </SidebarMenuItem>)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>;
  },
  args: {
    showIcon: false
  },
  parameters: {
    variants: [{
      storyDescription: "Text only"
    }, {
      showIcon: true,
      storyDescription: "With icon placeholder"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test skeletons render", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const skeletons = variant.querySelectorAll('[data-slot="sidebar-menu-skeleton"]');
      expect(skeletons.length).toBe(8);
    });
    await step("Test icon variant shows icon skeleton", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (!variant) return;
      const icons = variant.querySelectorAll('[data-slot="sidebar-menu-skeleton-icon"]');
      expect(icons.length).toBe(8);
    });
  }
}
