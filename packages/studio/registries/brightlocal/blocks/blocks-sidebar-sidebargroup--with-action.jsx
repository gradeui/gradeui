// Blocks/Sidebar/SidebarGroup — With Action
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebargroup--with-action
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render() {
    return <SidebarProvider dataHook="provider" defaultOpen>
        <Sidebar dataHook="sidebar">
          <SidebarHeader>
            <Logo className="h-6" dataHook="sidebar-logo" />
          </SidebarHeader>
          <SidebarContent dataHook="content">
            <SidebarGroup dataHook="group-action">
              <SidebarGroupLabel dataHook="label">Tools</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Add tool">
                <Plus size={16} />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <MenuItems items={mainItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>;
  },
  parameters: {
    variants: [{
      storyDescription: "Group with action button"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test action button renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const action = variant.querySelector('[data-slot="sidebar-group-action"]');
      expect(action).toBeInTheDocument();
      expect(action).toHaveAttribute("aria-label", "Add tool");
    });
  }
}
