// Blocks/DataTable/DataTableToolbar — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatabletoolbar--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Standard toolbar with search on the left and pagination on the right. Stacks on mobile, side-by-side on desktop."
      },
      source: {
        code: `<DataTableToolbar dataHook="toolbar">
  <DataTableToolbarLeft>
    <DataTableSearch table={table} dataHook="search" />
  </DataTableToolbarLeft>
  <DataTableToolbarRight>
    <DataTablePagination table={table} dataHook="pagination" showRowCount={false} />
  </DataTableToolbarRight>
</DataTableToolbar>
<DataTable table={table} dataHook="table" />
<DataTableToolbar dataHook="toolbar-bottom">
  <DataTableToolbarRight>
    <DataTablePagination table={table} dataHook="pagination-bottom" />
  </DataTableToolbarRight>
</DataTableToolbar>`
      }
    },
    variants: [{
      storyDescription: "Default"
    }]
  },
  render: function RenderDefault() {
    return <ToolbarDemo dataHook="toolbar-default" />;
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test toolbar renders with correct structure", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const toolbar = variant.querySelector('[data-slot="data-table-toolbar"]');
        expect(toolbar).toBeInTheDocument();
        expect(toolbar).toHaveAttribute("data-hook", "toolbar-default");
        expect(toolbar).toHaveClass("flex", "flex-col", "gap-3", "py-4", "sm:flex-row", "sm:items-center");
        const left = variant.querySelector('[data-slot="data-table-toolbar-left"]');
        expect(left).toBeInTheDocument();
        expect(left).toHaveClass("flex", "w-full", "min-w-0", "items-center", "gap-2", "sm:w-auto", "sm:flex-1");
        const right = variant.querySelector('[data-slot="data-table-toolbar-right"]');
        expect(right).toBeInTheDocument();
        expect(right).toHaveClass("flex", "w-full", "items-center", "justify-end", "gap-2", "sm:w-auto");
      }
    });
    await step("Test top toolbar has search and pagination", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const search = variant.querySelector('[data-hook="toolbar-default-search"]');
        expect(search).toBeInTheDocument();
        const paginationTop = variant.querySelector('[data-hook="toolbar-default-pagination-top"]');
        expect(paginationTop).toBeInTheDocument();
      }
    });
  }
}
