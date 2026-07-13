// Blocks/Sidebar/SidebarInboxItem — List
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarinboxitem--list
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render() {
    const items = [{
      senderName: "William Smith",
      title: "Meeting Tomorrow",
      description: "Hi, let's have a meeting tomorrow to discuss the project.",
      timestamp: "09:34 AM"
    }, {
      senderName: "Alice Johnson",
      title: "Re: Project Update",
      description: "Thank you for the update. I've reviewed the changes and have some feedback.",
      timestamp: "Yesterday"
    }, {
      senderName: "Bob Wilson",
      title: "Weekend Plans",
      description: "Any plans for the weekend? I was thinking we could...",
      timestamp: "2 days ago"
    }];
    return <div className="flex w-full flex-col">
        {items.map((item, index) => <SidebarInboxItem key={index} dataHook={`inbox-item-${index}`} description={item.description} senderName={item.senderName} timestamp={item.timestamp} title={item.title} />)}
      </div>;
  },
  parameters: {
    variants: [{
      storyDescription: "Multiple items list"
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
    await step("Test list renders all items", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const items = variant.querySelectorAll('[data-slot="sidebar-inbox-item"]');
      expect(items.length).toBe(3);
    });
  }
}
