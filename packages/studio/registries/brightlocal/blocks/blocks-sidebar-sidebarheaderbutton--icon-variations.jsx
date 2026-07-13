// Blocks/Sidebar/SidebarHeaderButton — Icon Variations
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarheaderbutton--icon-variations
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render() {
    return <div className="flex items-center gap-2">
        <SidebarHeaderButton aria-label="Toggle sidebar" dataHook="btn-sidebar">
          <PanelLeft size={16} />
        </SidebarHeaderButton>
        <SidebarHeaderButton aria-label="Notifications" dataHook="btn-notifications">
          <Bell size={16} />
        </SidebarHeaderButton>
        <SidebarHeaderButton aria-label="Search" dataHook="btn-search">
          <Search size={16} />
        </SidebarHeaderButton>
      </div>;
  },
  parameters: {
    variants: [{
      storyDescription: "Multiple icon buttons"
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
    await step("Test all buttons render", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const buttons = variant.querySelectorAll('[data-slot="sidebar-header-button"]');
      expect(buttons.length).toBe(3);
    });
  }
}
