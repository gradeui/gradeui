// Blocks/DataTable/DataTable — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatable--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Standard table view with sortable columns and pagination. 12 rows with a page size of 5."
      },
      source: {
        code: `const table = useDataTable({
  columns,
  data,
  enableSorting: true,
  enablePagination: true,
  pageSize: 5,
});

<DataTable table={table} dataHook="my-table" />`
      }
    },
    variants: [{
      storyDescription: "Default"
    }]
  },
  render: () => <ViewDemo dataHook="table-view" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test default renders table with rows", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const view = variant.querySelector('[data-slot="data-table-view"]');
        expect(view).toBeInTheDocument();
        expect(view).toHaveAttribute("data-hook", "table-view");

        // Has table element
        const table = variant.querySelector("table");
        expect(table).toBeInTheDocument();

        // Has header
        const thead = variant.querySelector("thead");
        expect(thead).toBeInTheDocument();

        // Has body rows
        const rows = variant.querySelectorAll("tbody tr");
        expect(rows.length).toBeGreaterThan(0);
      }
    });
  }
}
